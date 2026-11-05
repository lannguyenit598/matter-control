package mattercontrol

// Shared W6 contract: the import graph (row keys resolved to persisted items), group atomicity,
// RULE-014 dedupe and recovery. It runs unchanged against the in-memory double and the
// PostgreSQL adapter.

import (
	"context"
	"errors"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
	"github.com/example/userapi/internal/core/service"
)

// SheetCodecFactory supplies the spreadsheet codec (an adapter the kit itself must not import).
type SheetCodecFactory func() port.SheetCodec

// revokingStore revokes the importer's access right before the group transaction begins, which is
// the window between the preview and the mutation.
type revokingStore struct {
	port.WorkspaceStore
	before func()
}

func (r revokingStore) Execute(ctx context.Context, m matter.MatterID, fn func(tx port.MatterTx) error) error {
	if r.before != nil {
		r.before()
	}
	return r.WorkspaceStore.Execute(ctx, m, fn)
}

type w6Env struct {
	*w2Env
	data  *service.DataOpsService
	codec port.SheetCodec
}

func newW6Env(t *testing.T, newBundle Factory, codec port.SheetCodec) *w6Env {
	t.Helper()
	e := newW2Env(t, newBundle)
	ws, ok := e.b.Store.(port.WorkspaceStore)
	if !ok {
		t.Fatal("store does not implement port.WorkspaceStore")
	}
	return &w6Env{w2Env: e, codec: codec, data: service.NewDataOpsService(ws, kitIDs{}, codec, discardLogger())}
}

// importOf runs ImportCommit with a fresh per-row key for each row key in the file.
func (e *w6Env) importOf(actor matter.ActorID, source, csv string, keys map[string]string) ([]matter.ImportRowResult, error) {
	if keys == nil {
		keys = map[string]string{}
		for _, line := range strings.Split(strings.TrimSpace(csv), "\n")[1:] {
			keys[strings.SplitN(line, ",", 2)[0]] = newKey()
		}
	}
	return e.data.ImportCommit(e.ctx, port.ImportCommitCmd{
		ActorID: actor.String(), MatterID: e.m.String(), RunKey: newKey(),
		SourceName: source, Format: "csv", Content: []byte(csv), RowKeys: keys,
	})
}

func byRow(rs []matter.ImportRowResult) map[string]matter.ImportRowResult {
	m := map[string]matter.ImportRowResult{}
	for _, r := range rs {
		m[r.RowKey] = r
	}
	return m
}

// itemCount counts the Requirements and Actions the owner can export from the matter.
func (e *w6Env) itemCount() int {
	e.t.Helper()
	res, err := e.data.Export(e.ctx, port.ExportQuery{ActorID: e.owner.String(), MatterID: e.m.String(), Format: "csv"})
	if err != nil {
		e.t.Fatal(err)
	}
	return len(res.Rows) - 1
}

func (e *w6Env) importedEvents() int {
	n := 0
	for _, ev := range e.events() {
		if strings.HasPrefix(ev.Type, "import.") {
			n++
		}
	}
	return n
}

const graphCSV = "rowkey,kind,title,description,dependencies\n" +
	"R1,REQUIREMENT,Clearance obtained,Authority clearance,\n" +
	"A1,ACTION,Prepare package,Package ready,R1\n" +
	"A2,ACTION,Sign and file,Filed,R1;A1\n"

// SuiteW6 runs the W6 import contract against any Bundle whose Store supports the work graph.
func SuiteW6(t *testing.T, newBundle Factory, codec port.SheetCodec) {
	t.Helper()

	t.Run("a new-row dependency graph becomes the exact persisted edges", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		res, err := e.importOf(e.editor, "counsel.csv", graphCSV, nil)
		if err != nil {
			t.Fatal(err)
		}
		r := byRow(res)
		for _, k := range []string{"R1", "A1", "A2"} {
			if r[k].Status != matter.ImportRowSuccess || r[k].ItemID == "" {
				t.Fatalf("%s: %+v", k, r[k])
			}
		}
		a2 := e.detail(matter.NodeID(r["A2"].ItemID))
		got := map[matter.NodeID]matter.GateKind{}
		for _, up := range a2.Upstream {
			got[up.Other.ID] = up.Edge.Gate
			if up.Edge.Target != a2.View.Item.ID {
				t.Fatalf("edge direction: %+v", up.Edge)
			}
		}
		want := map[matter.NodeID]matter.GateKind{matter.NodeID(r["R1"].ItemID): matter.GateCompletion, matter.NodeID(r["A1"].ItemID): matter.GateCompletion}
		if len(got) != 2 || got[matter.NodeID(r["R1"].ItemID)] != matter.GateCompletion || got[matter.NodeID(r["A1"].ItemID)] != matter.GateCompletion {
			t.Fatalf("A2 prerequisites = %v, want %v", got, want)
		}
		if a2.View.Item.Dependency != matter.DependencyBlocked {
			t.Fatalf("the derived dependency state must be computed: %+v", a2.View.Item)
		}
		if e.detail(matter.NodeID(r["R1"].ItemID)).View.Item.Dependency != matter.DependencyReady || len(e.detail(matter.NodeID(r["R1"].ItemID)).Downstream) != 2 {
			t.Fatal("the head of the graph is ready and gates both actions")
		}
		if e.itemCount() != 3 || e.importedEvents() < 3 {
			t.Fatalf("records=%d import events=%d", e.itemCount(), e.importedEvents())
		}
	})

	t.Run("a reference to an existing item links to it", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		base := e.action(e.editor, "Existing prerequisite")
		csv := "rowkey,kind,title,description,dependencies\nN1,ACTION,Follow-up,Done," + base.ID.String() + "\n"
		res, err := e.importOf(e.editor, "link.csv", csv, nil)
		if err != nil || res[0].Status != matter.ImportRowSuccess {
			t.Fatalf("%v %+v", err, res)
		}
		up := e.detail(matter.NodeID(res[0].ItemID)).Upstream
		if len(up) != 1 || up[0].Other.ID != base.ID {
			t.Fatalf("upstream = %+v", up)
		}
	})

	t.Run("an invalid connected group is rejected whole and an independent group succeeds", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		csv := "rowkey,kind,title,description,dependencies\n" +
			"B1,REQUIREMENT,Head,Outcome,\n" +
			"B2,ACTION,Tail,Outcome,B1;MISSING\n" +
			"C1,ACTION,Solo,Outcome,\n"
		res, err := e.importOf(e.editor, "bad.csv", csv, nil)
		if err != nil {
			t.Fatal(err)
		}
		r := byRow(res)
		if r["C1"].Status != matter.ImportRowSuccess {
			t.Fatalf("independent group: %+v", r["C1"])
		}
		for _, k := range []string{"B1", "B2"} {
			if r[k].Status != matter.ImportRowFailure || r[k].ItemID != "" || r[k].Code != "group-rejected" {
				t.Fatalf("%s must be rejected with its group: %+v", k, r[k])
			}
		}
		if e.itemCount() != 1 {
			t.Fatalf("only the independent row may exist, got %d", e.itemCount())
		}
	})

	t.Run("a dependency cycle or self-reference rejects the group before any mutation", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		csv := "rowkey,kind,title,description,dependencies\n" +
			"X1,ACTION,One,Outcome,X2\n" +
			"X2,ACTION,Two,Outcome,X1\n" +
			"X3,ACTION,Self,Outcome,X3\n"
		res, err := e.importOf(e.editor, "cycle.csv", csv, nil)
		if err != nil {
			t.Fatal(err)
		}
		for _, row := range res {
			if row.Status != matter.ImportRowFailure || row.ItemID != "" {
				t.Fatalf("%+v", row)
			}
		}
		if e.itemCount() != 0 || e.importedEvents() != 0 {
			t.Fatalf("a rejected group wrote %d records / %d events", e.itemCount(), e.importedEvents())
		}
	})

	t.Run("an identical re-import replays and changed content conflicts, with no new records", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		first, err := e.importOf(e.editor, "counsel.csv", graphCSV, nil)
		if err != nil {
			t.Fatal(err)
		}
		records, evs := e.itemCount(), len(e.events())
		again, err := e.importOf(e.editor, "counsel.csv", graphCSV, nil) // new row keys, same source identity
		if err != nil {
			t.Fatal(err)
		}
		for i, row := range again {
			if row.Status != matter.ImportRowReplayed || row.ItemID != first[i].ItemID {
				t.Fatalf("replay %d: %+v vs %+v", i, row, first[i])
			}
		}
		if e.itemCount() != records || len(e.events()) != evs {
			t.Fatal("a replay must not create records, links or history")
		}
		changed := strings.Replace(graphCSV, "Package ready", "Package approved", 1)
		res, err := e.importOf(e.editor, "counsel.csv", changed, nil)
		if err != nil {
			t.Fatal(err)
		}
		r := byRow(res)
		if r["A1"].Code != "content-conflict" || r["A1"].Status != matter.ImportRowFailure {
			t.Fatalf("changed content is an explicit conflict: %+v", r["A1"])
		}
		for _, k := range []string{"R1", "A2"} {
			if r[k].Status != matter.ImportRowFailure || r[k].Code != "group-rejected" {
				t.Fatalf("the conflict rejects the whole group; %s: %+v", k, r[k])
			}
		}
		if e.itemCount() != records || len(e.events()) != evs {
			t.Fatal("a conflict must not mutate")
		}
	})

	t.Run("a new row can extend an already imported group", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		first, err := e.importOf(e.editor, "counsel.csv", graphCSV, nil)
		if err != nil {
			t.Fatal(err)
		}
		extended := graphCSV + "A3,ACTION,Follow up,Done,A2\n"
		res, err := e.importOf(e.editor, "counsel.csv", extended, nil)
		if err != nil {
			t.Fatal(err)
		}
		r := byRow(res)
		if r["A3"].Status != matter.ImportRowSuccess || r["R1"].Status != matter.ImportRowReplayed || r["R1"].ItemID != first[0].ItemID {
			t.Fatalf("%+v", res)
		}
		up := e.detail(matter.NodeID(r["A3"].ItemID)).Upstream
		if len(up) != 1 || up[0].Other.ID != matter.NodeID(first[2].ItemID) {
			t.Fatalf("A3 must depend on the previously imported A2: %+v", up)
		}
		if e.itemCount() != 4 {
			t.Fatalf("records = %d", e.itemCount())
		}
	})

	t.Run("a failure inside the group rolls back every row; a retry then succeeds", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		if _, ok := e.b.Store.(interface{ IsMemoryDouble() }); !ok {
			t.Skip("step-level failure injection is a memory-double seam; the PostgreSQL adapter rolls back through its single transaction")
		}
		inj := mustFailInjector(t, e.b.Store)
		keys := map[string]string{"R1": newKey(), "A1": newKey(), "A2": newKey()}
		for _, step := range []string{"insert_edge", "register_import_source", "store_receipt", "complete_matter", "save_work_item"} {
			inj.SetFailAt(step)
			res, err := e.importOf(e.editor, "fail.csv", graphCSV, keys)
			inj.SetFailAt("")
			if err != nil {
				t.Fatal(err)
			}
			for _, row := range res {
				if row.Status != matter.ImportRowFailure || row.ItemID != "" {
					t.Fatalf("%s: %+v", step, row)
				}
			}
			if e.itemCount() != 0 || e.importedEvents() != 0 {
				t.Fatalf("%s left a partial graph: %d records, %d events", step, e.itemCount(), e.importedEvents())
			}
		}
		res, err := e.importOf(e.editor, "fail.csv", graphCSV, keys)
		if err != nil {
			t.Fatal(err)
		}
		for _, row := range res {
			if row.Status != matter.ImportRowSuccess {
				t.Fatalf("retry with the same keys: %+v", row)
			}
		}
	})

	t.Run("a lost commit acknowledgement is UNKNOWN and the same keys recover it", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		inj := mustInjector(t, e.b.Store)
		keys := map[string]string{"R1": newKey(), "A1": newKey(), "A2": newKey()}
		inj.SetCommitUnknown(errors.New("lost acknowledgement"))
		res, err := e.importOf(e.editor, "lost.csv", graphCSV, keys)
		inj.SetCommitUnknown(nil)
		if err != nil {
			t.Fatal(err)
		}
		for _, row := range res {
			if row.Status != matter.ImportRowUnknown || row.ItemID != "" {
				t.Fatalf("UNKNOWN carries no guessed outcome: %+v", row)
			}
		}
		// The group committed durably: one boundary for all rows.
		if e.itemCount() != 3 {
			t.Fatalf("the commit was durable, records = %d", e.itemCount())
		}
		recovered, err := e.importOf(e.editor, "lost.csv", graphCSV, keys)
		if err != nil {
			t.Fatal(err)
		}
		for _, row := range recovered {
			if row.Status != matter.ImportRowReplayed || row.ItemID == "" {
				t.Fatalf("recovery by the same keys: %+v", row)
			}
		}
		if e.itemCount() != 3 {
			t.Fatalf("recovery duplicated records: %d", e.itemCount())
		}
	})

	t.Run("concurrent identical imports create the records exactly once", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		const workers = 4
		out := make([][]matter.ImportRowResult, workers)
		errs := make([]error, workers)
		var wg sync.WaitGroup
		for i := range out {
			wg.Add(1)
			go func() {
				defer wg.Done()
				out[i], errs[i] = e.importOf(e.editor, "race.csv", graphCSV, nil)
			}()
		}
		wg.Wait()
		created := 0
		for i := range out {
			if errs[i] != nil {
				t.Fatalf("worker %d: %v", i, errs[i])
			}
			for _, row := range out[i] {
				switch row.Status {
				case matter.ImportRowSuccess:
					created++
				case matter.ImportRowReplayed:
				default:
					t.Fatalf("worker %d: %+v", i, row)
				}
			}
		}
		if created != 3 || e.itemCount() != 3 {
			t.Fatalf("created %d rows, %d records; want 3/3", created, e.itemCount())
		}
	})

	t.Run("access withdrawn between preview and commit mutates nothing", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
		ws := e.b.Store.(port.WorkspaceStore)
		revoked := false
		e.data = service.NewDataOpsService(revokingStore{WorkspaceStore: ws, before: func() {
			if !revoked {
				revoked = true
				if err := w1.revokeMatter(e.owner, e.m, e.editor, w1.matterRevision(e.owner, e.wsID, e.m)); err != nil {
					t.Fatalf("revoke: %v", err)
				}
			}
		}}, kitIDs{}, e.codec, discardLogger())
		res, err := e.importOf(e.editor, "revoked.csv", graphCSV, nil)
		if err != nil {
			t.Fatal(err)
		}
		for _, row := range res {
			if row.Status != matter.ImportRowFailure || row.ItemID != "" || (row.Code != "forbidden" && row.Code != "not-found") {
				t.Fatalf("a withdrawn right must be rechecked at the mutation boundary: %+v", row)
			}
		}
		if e.itemCount() != 0 {
			t.Fatalf("records = %d", e.itemCount())
		}
	})

	// ----- Status Brief: changes in (t1,t2] are separate from the work outstanding at t2 -----

	lastAt := func(e *w6Env) time.Time {
		var at time.Time
		for _, ev := range e.events() {
			if ev.RecordedAt.After(at) {
				at = ev.RecordedAt
			}
		}
		return at
	}
	brief := func(e *w6Env, actor matter.ActorID, t1, t2 time.Time) (matter.BriefResult, error) {
		return e.data.Brief(e.ctx, port.BriefQuery{ActorID: actor.String(), MatterID: e.m.String(), T1: t1, T2: t2})
	}
	ids := func(r matter.BriefResult) map[string]matter.BriefOutstandingItem {
		m := map[string]matter.BriefOutstandingItem{}
		for _, o := range r.Outstanding {
			m[o.ItemID] = o
		}
		return m
	}
	types := func(r matter.BriefResult) []string {
		var out []string
		for _, c := range r.Changes {
			out = append(out, c.Type+":"+c.TargetID)
		}
		return out
	}
	epoch := time.Unix(0, 0).UTC()

	t.Run("brief: completion, cancellation and reopen move work in and out of outstanding at t2", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		a, b, c, d := e.action(e.owner, "A"), e.action(e.owner, "B"), e.action(e.owner, "C"), e.action(e.owner, "D")
		created := lastAt(e)
		done := func(id matter.NodeID) {
			e.mustTransition(e.editor, id, "COMPLETED", func(c *port.TransitionExecutionCmd) {
				c.Reason, c.CompletedAt = "finished", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
			})
		}
		done(a.ID)
		e.mustTransition(e.owner, b.ID, "CANCELLED", func(c *port.TransitionExecutionCmd) { c.Reason = "scope change" })
		done(c.ID)
		settled := lastAt(e)
		e.mustTransition(e.owner, c.ID, "IN_PROGRESS", func(c *port.TransitionExecutionCmd) { c.Reason = "work resumed" })
		reopened := lastAt(e)

		atCreated, err := brief(e, e.viewer, epoch, created)
		if err != nil {
			t.Fatal(err)
		}
		if got := ids(atCreated); len(got) != 4 {
			t.Fatalf("all four are outstanding at creation: %v", types(atCreated))
		}
		atSettled, err := brief(e, e.viewer, created, settled)
		if err != nil {
			t.Fatal(err)
		}
		got := ids(atSettled)
		if len(got) != 1 || got[d.ID.String()].Execution != string(matter.ExecutionNotStarted) {
			t.Fatalf("only D is outstanding once A, C are completed and B cancelled: %+v", atSettled.Outstanding)
		}
		want := []string{"work.execution_changed:" + a.ID.String(), "work.execution_changed:" + b.ID.String(), "work.execution_changed:" + c.ID.String()}
		if len(atSettled.Changes) != 3 || strings.Join(types(atSettled), ",") != strings.Join(want, ",") {
			t.Fatalf("changes in (created, settled] = %v, want %v", types(atSettled), want)
		}
		atReopened, err := brief(e, e.viewer, settled, reopened)
		if err != nil {
			t.Fatal(err)
		}
		got = ids(atReopened)
		if len(got) != 2 || got[c.ID.String()].Execution != string(matter.ExecutionInProgress) || len(atReopened.Changes) != 1 {
			t.Fatalf("reopened C returns to outstanding: out=%+v changes=%v", atReopened.Outstanding, types(atReopened))
		}

		// Window boundaries: (t1, t2] excludes t1 and includes t2; an empty window is explicit.
		same, err := brief(e, e.viewer, settled, settled)
		if err != nil || len(same.Changes) != 0 || len(same.Outstanding) != 1 {
			t.Fatalf("t1=t2: no changes, outstanding still reported: %v %+v", err, same)
		}
		quiet, err := brief(e, e.viewer, reopened, reopened.Add(time.Nanosecond))
		if err == nil && len(quiet.Changes) != 0 {
			t.Fatalf("no events after the last one: %+v", quiet.Changes)
		}
		_, err = brief(e, e.viewer, reopened, created)
		mustIs(t, "reversed window", err, port.ErrInvalidBriefWindow)
		_, err = brief(e, e.viewer, created, time.Now().UTC().Add(48*time.Hour))
		mustIs(t, "t2 beyond the read boundary", err, port.ErrInvalidBriefWindow)
		_, err = brief(e, e.out, epoch, reopened)
		mustIs(t, "a non-member learns nothing", err, port.ErrNotFound)
	})

	t.Run("brief: proof assessment and dispute change readiness at t2", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		r := e.requirement("Signed approval")
		e.verify(r.ID)
		e.mustTransition(e.editor, r.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "signed", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
		})
		verified := lastAt(e)
		cur := e.checklist(r.ID).Result.Criteria[0].Claims[0].Current
		if cur == nil {
			t.Fatal("verify() leaves a current assessment")
		}
		if _, err := e.ev.RaiseDispute(e.ctx, port.RaiseDisputeCmd{ActorID: e.editor.String(), MatterID: e.m.String(), AssessmentID: cur.ID.String(), Reason: "signature page missing"}); err != nil {
			t.Fatal(err)
		}
		disputed := lastAt(e)
		second := e.newVerifier()
		if _, err := e.ev.ResolveDispute(e.ctx, port.ResolveDisputeCmd{ActorID: second.String(), MatterID: e.m.String(), DisputeID: e.openDispute().String(), Resolution: "original is intact"}); err != nil {
			t.Fatal(err)
		}
		resolved := lastAt(e)

		for _, tc := range []struct {
			at          time.Time
			outstanding bool
			verif       string
		}{
			{verified, false, ""},
			{disputed, true, string(matter.VerificationDisputed)},
			{resolved, false, ""},
		} {
			res, err := brief(e, e.viewer, epoch, tc.at)
			if err != nil {
				t.Fatal(err)
			}
			o, in := ids(res)[r.ID.String()]
			if in != tc.outstanding || (in && o.Verification != tc.verif) {
				t.Fatalf("at %v: outstanding=%v verification=%q, want %v/%q (%+v)", tc.at, in, o.Verification, tc.outstanding, tc.verif, res.Outstanding)
			}
		}
		window, err := brief(e, e.viewer, verified, disputed)
		if err != nil {
			t.Fatal(err)
		}
		if joined := strings.Join(types(window), ","); !strings.Contains(joined, "dispute.raised") || !strings.Contains(joined, "work.verification_changed:"+r.ID.String()) {
			t.Fatalf("the dispute and its effect on the subject are changes in the window: %s", joined)
		}
	})

	t.Run("brief: imported work and its dependency facts appear at t2", func(t *testing.T) {
		e := newW6Env(t, newBundle, codec)
		e.action(e.owner, "Existing")
		before := lastAt(e)
		res, err := e.importOf(e.editor, "counsel.csv", graphCSV, nil)
		if err != nil {
			t.Fatal(err)
		}
		after := lastAt(e)
		r := byRow(res)
		b, err := brief(e, e.viewer, before, after)
		if err != nil {
			t.Fatal(err)
		}
		got := ids(b)
		if len(got) != 4 || got[r["A2"].ItemID].Dependency != string(matter.DependencyBlocked) || got[r["R1"].ItemID].Dependency != string(matter.DependencyReady) {
			t.Fatalf("imported items with their derived dependency state: %+v", b.Outstanding)
		}
		imports := 0
		for _, c := range b.Changes {
			if strings.HasPrefix(c.Type, "import.") {
				imports++
			}
		}
		if imports != 3 {
			t.Fatalf("three import events in the window, got %v", types(b))
		}
	})
}
