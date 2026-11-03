package postgres

// Tooling for the isolated whole-product restore rehearsal. It is inert unless MC_RESTORE_MODE is
// set (the normal suites never run it). `seed` builds a complete synthetic dataset through the real
// services into a dedicated database and a real object directory; `marker` writes one record after
// the backup boundary; `readback` reads a (possibly restored) database through the real services and
// writes a canonical JSON that two runs can be diffed on. Synthetic data only.

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"os"
	"sort"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/objectstore"
	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
	"leonx.me/matter-control/internal/adapter/outbound/sheet"
	"leonx.me/matter-control/internal/adapter/outbound/system"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

func restoreEnv(t *testing.T, keys ...string) map[string]string {
	t.Helper()
	out := map[string]string{}
	for _, k := range keys {
		v := os.Getenv(k)
		if v == "" {
			t.Fatalf("%s is required", k)
		}
		out[k] = v
	}
	return out
}

func TestRestoreRehearsal(t *testing.T) {
	mode := os.Getenv("MC_RESTORE_MODE")
	if mode == "" {
		t.Skip("MC_RESTORE_MODE not set; restore rehearsal tooling is inert")
	}
	switch mode {
	case "seed", "marker":
		env := restoreEnv(t, "MC_RESTORE_SRC_DSN", "MC_RESTORE_SRC_OBJECTS")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		if err := MigrateMatterControl(ctx, env["MC_RESTORE_SRC_DSN"], discardLogger()); err != nil {
			t.Fatal(err)
		}
		pool, err := pgxpool.New(ctx, env["MC_RESTORE_SRC_DSN"])
		if err != nil {
			t.Fatal(err)
		}
		defer pool.Close()
		objs, err := objectstore.New(env["MC_RESTORE_SRC_OBJECTS"])
		if err != nil {
			t.Fatal(err)
		}
		defer objs.Close()
		factory := func(t *testing.T) mattercontrol.Bundle {
			fs := &faultCapableStore{inner: NewMatterStore(pool)}
			return mattercontrol.Bundle{Store: fs, World: &pgWorld{pool: pool, tb: t, dsn: env["MC_RESTORE_SRC_DSN"]}, Objects: objs}
		}
		if mode == "marker" {
			mattercontrol.SeedPostBoundaryMarker(t, factory)
			return
		}
		mattercontrol.SeedRestoreFixture(t, factory)
		mattercontrol.SuiteW4(t, factory)
		mattercontrol.SuiteW6(t, factory, sheet.Codec{})
		mattercontrol.SuiteW7QA(t, factory)
		mattercontrol.SuiteGW(t, factory)
	case "readback":
		env := restoreEnv(t, "MC_RESTORE_DSN", "MC_RESTORE_OBJECTS", "MC_RESTORE_OUT")
		readbackRestore(t, env["MC_RESTORE_DSN"], env["MC_RESTORE_OBJECTS"], env["MC_RESTORE_OUT"])
	default:
		t.Fatalf("unknown MC_RESTORE_MODE %q", mode)
	}
}

// scrub removes read-instant fields (a later read legitimately has a later as-of) and returns a
// JSON-comparable value.
func scrub(t *testing.T, v any) any {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	var out any
	if err := json.Unmarshal(b, &out); err != nil {
		t.Fatal(err)
	}
	var walk func(any) any
	walk = func(x any) any {
		switch m := x.(type) {
		case map[string]any:
			for k, val := range m {
				if k == "AsOf" || k == "asOf" {
					delete(m, k)
					continue
				}
				m[k] = walk(val)
			}
		case []any:
			for i := range m {
				m[i] = walk(m[i])
			}
		}
		return x
	}
	return walk(out)
}

func readbackRestore(t *testing.T, dsn, objectDir, outPath string) {
	t.Helper()
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	objs, err := objectstore.New(objectDir)
	if err != nil {
		t.Fatal(err)
	}
	defer objs.Close()

	store := NewMatterStore(pool)
	ids := system.RecordIDv7{}
	logger := discardLogger()
	ws := service.NewWorkspaceService(store, ids, logger, matter.KeyAgePolicy{})
	work := service.NewWorkService(store, ids, logger, matter.KeyAgePolicy{})
	ev := service.NewEvidenceService(work, objs)
	fil := service.NewFilingService(work)
	ctl := service.NewControlService(work)
	data := service.NewDataOpsService(store, ids, sheet.Codec{}, logger)

	type row struct{ matterID, owner string }
	var matters []row
	rows, err := pool.Query(ctx, `SELECT mm.matter_id::text, mm.user_id::text FROM matter_memberships mm
		WHERE mm.role = 'OWNER' AND mm.status = 'ACTIVE' ORDER BY mm.matter_id, mm.user_id`)
	if err != nil {
		t.Fatal(err)
	}
	seen := map[string]bool{}
	for rows.Next() {
		var r row
		if err := rows.Scan(&r.matterID, &r.owner); err != nil {
			t.Fatal(err)
		}
		if !seen[r.matterID] {
			seen[r.matterID] = true
			matters = append(matters, r)
		}
	}
	rows.Close()

	report := map[string]any{"matterCount": len(matters)}
	objectFailures := 0
	objectsChecked := 0
	for _, m := range matters {
		entry := map[string]any{}
		exp, err := data.Export(ctx, port.ExportQuery{ActorID: m.owner, MatterID: m.matterID, Format: "csv"})
		if err != nil {
			t.Fatalf("export %s: %v", m.matterID, err)
		}
		entry["export"] = exp.Rows
		room, err := ctl.ControlRoom(ctx, port.ControlRoomQuery{ActorID: m.owner, MatterID: m.matterID, RecentChanges: 100})
		if err != nil {
			t.Fatalf("room %s: %v", m.matterID, err)
		}
		entry["room"] = scrub(t, room)
		brief, err := data.Brief(ctx, port.BriefQuery{ActorID: m.owner, MatterID: m.matterID, T1: time.Unix(0, 0).UTC(), T2: room.AsOf})
		if err != nil {
			t.Fatalf("brief %s: %v", m.matterID, err)
		}
		entry["brief"] = scrub(t, map[string]any{"changes": brief.Changes, "outstanding": brief.Outstanding})
		var history []matter.EventRecord
		var cur *matter.EventCursor
		for {
			p, err := ws.HistoryRead(ctx, port.HistoryReadQuery{ActorID: m.owner, MatterID: m.matterID, Limit: 200, Cursor: cur})
			if err != nil {
				t.Fatalf("history %s: %v", m.matterID, err)
			}
			history = append(history, p.Events...)
			if p.NextCursor == nil {
				break
			}
			cur = p.NextCursor
		}
		entry["history"] = scrub(t, history)
		fs, err := fil.ListFilings(ctx, port.MatterListQuery{ActorID: m.owner, MatterID: m.matterID})
		if err != nil {
			t.Fatalf("filings %s: %v", m.matterID, err)
		}
		var filings []any
		for _, f := range fs {
			d, err := fil.GetFiling(ctx, port.FilingQuery{ActorID: m.owner, MatterID: m.matterID, FilingID: f.View.Item.ID.String()})
			if err != nil {
				t.Fatalf("filing %s: %v", f.View.Item.ID, err)
			}
			filings = append(filings, scrub(t, d))
		}
		entry["filings"] = filings

		// Every document and every version's exact bytes, read to EOF through the service.
		var docs []any
		drows, err := pool.Query(ctx, `SELECT id::text FROM documents WHERE matter_id = $1 ORDER BY id`, m.matterID)
		if err != nil {
			t.Fatal(err)
		}
		var docIDs []string
		for drows.Next() {
			var id string
			if err := drows.Scan(&id); err != nil {
				t.Fatal(err)
			}
			docIDs = append(docIDs, id)
		}
		drows.Close()
		for _, id := range docIDs {
			d, err := ev.GetDocument(ctx, port.DocumentQuery{ActorID: m.owner, MatterID: m.matterID, DocumentID: id})
			if err != nil {
				t.Fatalf("document %s: %v", id, err)
			}
			var vs []map[string]any
			for _, v := range d.Versions {
				_, rc, err := ev.OpenVersion(ctx, port.VersionContentQuery{ActorID: m.owner, MatterID: m.matterID, VersionID: v.ID.String()})
				item := map[string]any{"id": v.ID.String(), "sha256": v.SHA256, "size": v.SizeBytes}
				if err != nil {
					// A version whose bytes were never stored (fixtures that name a digest only) is not an object failure.
					item["content"] = "unavailable"
				} else {
					h := sha256.New()
					n, cerr := io.Copy(h, rc)
					_ = rc.Close()
					sum := hex.EncodeToString(h.Sum(nil))
					item["content"] = map[string]any{"bytes": n, "sha256": sum, "matches": cerr == nil && sum == v.SHA256}
					objectsChecked++
					if cerr != nil || sum != v.SHA256 {
						objectFailures++
					}
				}
				vs = append(vs, item)
			}
			sort.Slice(vs, func(i, j int) bool { return vs[i]["id"].(string) < vs[j]["id"].(string) })
			docs = append(docs, map[string]any{"detail": scrub(t, d), "versions": vs})
		}
		entry["documents"] = docs
		report[m.matterID] = entry
	}
	report["objectsChecked"], report["objectFailures"] = objectsChecked, objectFailures
	b, err := json.MarshalIndent(report, "", " ")
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(outPath, b, 0o600); err != nil {
		t.Fatal(err)
	}
	if objectFailures > 0 {
		t.Fatalf("%d object(s) failed their hash", objectFailures)
	}
	t.Logf("readback: %d matters, %d object(s) hash-verified, %d bytes of JSON", len(matters), objectsChecked, len(b))
}
