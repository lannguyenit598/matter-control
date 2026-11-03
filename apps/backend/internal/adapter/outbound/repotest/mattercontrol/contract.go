package mattercontrol

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"sync"
	"testing"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

// Bundle is what a storage backend supplies to run the shared suite: a store over an
// empty world, the World to provision and observe it, and optionally the record-ID
// generator the service should use (nil = the kit's UUIDv7 default; the kit itself
// must not depend on an adapter).
type Bundle struct {
	Store port.MatterStore
	World World
	IDs   port.RecordIDGenerator
	// Objects, when set, replaces the in-memory object store behind the evidence service (a restore
	// rehearsal needs real files). Nil keeps the in-memory double.
	Objects port.ObjectStore
}

type kitIDs struct{}

func (kitIDs) NewRecordID() string { return uuid.Must(uuid.NewV7()).String() }

// failInjector lets a backend simulate a per-step transaction failure; backends without
// the seam get that subtest skipped by name.
type failInjector interface {
	SetFailAt(step string)
}

// commitInjector lets a backend simulate commit-phase outcomes.
type commitInjector interface {
	SetCommitRollback(err error)
	SetCommitUnknown(err error)
}

// injector combines both simulation seams.
type injector interface {
	failInjector
	commitInjector
}

// Factory builds an empty Bundle for each subtest.
type Factory func(t *testing.T) Bundle

// Suite runs the MatterControl transaction-spine contract (BE01-T02..T08) against any
// Bundle: the in-memory double and the PostgreSQL adapter run the same suite.
func Suite(t *testing.T, newBundle Factory) {
	t.Helper()

	t.Run("create writes one atomic outcome", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		res := mustCreate(t, s, editor.ID, newKey(), anyHash)
		if res.Seq != 1 {
			t.Fatalf("seq = %d", res.Seq)
		}
		if c := w.Counts(); c.Nodes != 1 || c.Requirements != 1 || c.Events != 1 ||
			c.Receipts != 1 || c.ReceiptMatters != 1 || c.Audits != 0 {
			t.Fatalf("counts: %+v", c)
		}
	})

	t.Run("denial matrix through the service", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		before := w.Counts()
		if _, err := create(s, viewer.ID, newKey(), anyHash); !errors.Is(err, port.ErrForbidden) {
			t.Fatalf("viewer: %v", err)
		}
		if _, err := create(s, wsOwner.ID, newKey(), anyHash); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("ws owner: %v", err)
		}
		if _, err := create(s, outsider.ID, newKey(), anyHash); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("outsider: %v", err)
		}
		after := w.Counts()
		if after.Requirements != before.Requirements || after.Events != before.Events ||
			after.Receipts != before.Receipts {
			t.Fatalf("denials wrote domain rows: %+v", after)
		}
		if after.Audits != before.Audits+3 {
			t.Fatalf("denials must audit: %+v -> %+v", before, after)
		}
	})

	t.Run("replay sequential and after restart", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		key := newKey()
		first := mustCreate(t, s, editor.ID, key, anyHash)
		second := mustCreate(t, s, editor.ID, key, anyHash)
		first.Replayed = true
		if first != second {
			t.Fatalf("replay differs")
		}
		reopened := service.NewMatterService(w.Reopen(), kitIDs{}, discardLogger(), matter.KeyAgePolicy{})
		third := mustCreate(t, reopened, editor.ID, key, anyHash)
		if !third.Replayed || third != second {
			t.Fatal("restart replay differs")
		}
		if c := w.Counts(); c.Requirements != 1 || c.Receipts != 1 {
			t.Fatalf("replay wrote rows: %+v", c)
		}
	})

	t.Run("key reuse and same key under another actor", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		key := newKey()
		mustCreate(t, s, editor.ID, key, anyHash)
		if _, err := create(s, editor.ID, key, strings.Repeat("cd", 32)); !errors.Is(err, port.ErrIdempotencyKeyReuse) {
			t.Fatalf("reuse: %v", err)
		}
		mustCreate(t, s, editor2.ID, key, anyHash) // independent intent
		if c := w.Counts(); c.Requirements != 2 || c.Receipts != 2 {
			t.Fatalf("two actors must yield two outcomes: %+v", c)
		}
	})

	t.Run("concurrent same key one effect", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		key := newKey()
		const n = 8
		results := make([]matter.RequirementCreatedResult, n)
		errs := make([]error, n)
		start := make(chan struct{})
		var wg sync.WaitGroup
		for i := range n {
			wg.Add(1)
			go func() {
				defer wg.Done()
				<-start
				results[i], errs[i] = create(s, editor.ID, key, anyHash)
			}()
		}
		close(start)
		wg.Wait()
		fresh := 0
		for i := range n {
			if errs[i] != nil {
				t.Fatalf("goroutine %d: %v", i, errs[i])
			}
			if !results[i].Replayed {
				fresh++
			}
			results[i].Replayed = true
			if results[i] != results[0] {
				t.Fatalf("goroutine %d differs", i)
			}
		}
		if fresh != 1 {
			t.Fatalf("fresh = %d", fresh)
		}
		if c := w.Counts(); c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
			t.Fatalf("concurrency wrote extra rows: %+v", c)
		}
	})

	t.Run("concurrent same key across matters commits once without leaking", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		w.AddMatter(matterB, workspaceID)
		w.SetMatterMembership(matterB, editor.ID, matter.MatterRoleEditor, matter.StatusActive)
		key := newKey()
		const n = 2
		results := make([]matter.RequirementCreatedResult, n)
		errs := make([]error, n)
		start := make(chan struct{})
		var wg sync.WaitGroup
		for i := range n {
			wg.Add(1)
			go func() {
				defer wg.Done()
				<-start
				target := matterA
				if i == 1 {
					target = matterB
				}
				results[i], errs[i] = s.CreateRequirement(context.Background(), port.CreateRequirementCmd{
					ActorID: editor.ID.String(), MatterID: target.String(),
					IdempotencyKey: key, RequestHash: anyHash,
					Title: "Concurrent", Outcome: "One effect only",
				})
			}()
		}
		close(start)
		wg.Wait()

		// Exactly one effect commits. A loser that raced the receipt INSERT gets key
		// reuse; a request serialized after the winner replays the stored outcome
		// (same hash, and the actor can read the represented matter) — either way the
		// stored response is never returned as a second, divergent effect.
		freshOutcome := func(r matter.RequirementCreatedResult) matter.RequirementCreatedResult {
			r.Replayed = false
			return r
		}
		var fresh int
		var outcome matter.RequirementCreatedResult
		haveOutcome := false
		for i := range n {
			switch err := errs[i]; {
			case err == nil:
				if !haveOutcome {
					outcome, haveOutcome = results[i], true
				} else if freshOutcome(results[i]) != freshOutcome(outcome) {
					t.Fatalf("goroutine %d returned a different outcome", i)
				}
				if !results[i].Replayed {
					fresh++
				}
			case errors.Is(err, port.ErrIdempotencyKeyReuse):
				// receipt PK race lost: no stored response leaked
			default:
				t.Fatalf("unexpected error: %v", err)
			}
		}
		if !haveOutcome || fresh != 1 {
			t.Fatalf("fresh effects = %d, want exactly 1 (with a stored outcome)", fresh)
		}
		if c := w.Counts(); c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
			t.Fatalf("cross-matter key wrote extra rows: %+v", c)
		}
		// The committed requirement belongs to the winner: only one matter holds a row.
	})

	t.Run("revocation defeats create and replay", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		key := newKey()
		mustCreate(t, s, editor.ID, key, anyHash)
		w.SetMatterMembership(matterA, editor.ID, matter.MatterRoleEditor, matter.StatusRevoked)
		if _, err := create(s, editor.ID, key, anyHash); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("replay after revocation: %v", err)
		}
		if _, err := create(s, editor.ID, newKey(), anyHash); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("create after revocation: %v", err)
		}
		if c := w.Counts(); c.Requirements != 1 {
			t.Fatalf("revocation wrote rows: %+v", c)
		}
	})

	t.Run("demotion keeps replay blocks create", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		key := newKey()
		mustCreate(t, s, editor.ID, key, anyHash)
		w.SetMatterMembership(matterA, editor.ID, matter.MatterRoleViewer, matter.StatusActive)
		if _, err := create(s, editor.ID, key, anyHash); err != nil {
			t.Fatalf("replay after demotion: %v", err)
		}
		if _, err := create(s, editor.ID, newKey(), anyHash); !errors.Is(err, port.ErrForbidden) {
			t.Fatalf("create after demotion: %v", err)
		}
	})

	// BE01-F01 / BE01-T05/T06: a stored receipt must stay invisible to a caller that
	// lost read access to its saved scope or to ANY matter the stored outcome
	// represents — before any age or hash comparison, uniformly as not-found.
	t.Run("receipt replay authorizes every represented matter", func(t *testing.T) {
		t.Run("authorized caller learns key reuse across matters", func(t *testing.T) {
			b := newBundle(t)
			w, s := seedStandard(t, b)
			w.AddMatter(matterB, workspaceID)
			w.SetMatterMembership(matterB, editor.ID, matter.MatterRoleEditor, matter.StatusActive)
			key := newKey()
			mustCreate(t, s, editor.ID, key, anyHash) // receipt stored for matterA
			if _, err := createOn(s, editor.ID, key, strings.Repeat("cd", 32), matterB); !errors.Is(err, port.ErrIdempotencyKeyReuse) {
				t.Fatalf("saved scope intact: want ErrIdempotencyKeyReuse, got %v", err)
			}
			if c := w.Counts(); c.Requirements != 1 || c.Receipts != 1 {
				t.Fatalf("reuse wrote rows: %+v", c)
			}
		})

		t.Run("revoked represented matter hides the receipt uniformly", func(t *testing.T) {
			b := newBundle(t)
			w, s := seedStandard(t, b)
			w.AddMatter(matterB, workspaceID)
			w.SetMatterMembership(matterB, editor.ID, matter.MatterRoleEditor, matter.StatusActive)
			key := newKey()
			mustCreate(t, s, editor.ID, key, anyHash)
			before := w.Counts()
			w.SetMatterMembership(matterA, editor.ID, matter.MatterRoleEditor, matter.StatusRevoked)
			// Authorized target, different fingerprint: the receipt represents revoked
			// matterA, so it must stay invisible — uniform not-found, never key reuse.
			if _, err := createOn(s, editor.ID, key, strings.Repeat("cd", 32), matterB); !errors.Is(err, port.ErrNotFound) {
				t.Fatalf("cross-matter reuse after revocation: want uniform ErrNotFound, got %v", err)
			}
			// Same fingerprint against the represented matter itself: still not-found.
			if _, err := createOn(s, editor.ID, key, anyHash, matterA); !errors.Is(err, port.ErrNotFound) {
				t.Fatalf("same-hash replay after revocation: want uniform ErrNotFound, got %v", err)
			}
			after := w.Counts()
			if after.Requirements != before.Requirements || after.Events != before.Events ||
				after.Receipts != before.Receipts || after.ReceiptMatters != before.ReceiptMatters {
				t.Fatalf("denied replays wrote rows: %+v -> %+v", before, after)
			}
			if after.Audits != before.Audits+2 {
				t.Fatalf("hidden denials must audit once each: %+v -> %+v", before, after)
			}
		})

		t.Run("cross-workspace saved scope lost hides the receipt", func(t *testing.T) {
			b := newBundle(t)
			w, s := seedStandard(t, b)
			ws2 := matter.WorkspaceID(uuid.Must(uuid.NewV7()).String())
			w.AddWorkspace(ws2)
			w.AddMatter(matterB, ws2)
			w.SetWorkspaceMembership(ws2, editor.ID, matter.WorkspaceRoleMember, matter.StatusActive)
			w.SetMatterMembership(matterB, editor.ID, matter.MatterRoleEditor, matter.StatusActive)
			key := newKey()
			mustCreate(t, s, editor.ID, key, anyHash) // receipt in workspaceID
			if _, err := createOn(s, editor.ID, key, strings.Repeat("cd", 32), matterB); !errors.Is(err, port.ErrIdempotencyKeyReuse) {
				t.Fatalf("saved scope intact: want ErrIdempotencyKeyReuse, got %v", err)
			}
			w.SetWorkspaceMembership(workspaceID, editor.ID, matter.WorkspaceRoleMember, matter.StatusRevoked)
			if _, err := createOn(s, editor.ID, key, strings.Repeat("cd", 32), matterB); !errors.Is(err, port.ErrNotFound) {
				t.Fatalf("saved workspace revoked: want uniform ErrNotFound, got %v", err)
			}
			if c := w.Counts(); c.Requirements != 1 || c.Receipts != 1 {
				t.Fatalf("rows changed: %+v", c)
			}
		})

		t.Run("demotion to viewer keeps represented-matter replay", func(t *testing.T) {
			b := newBundle(t)
			w, s := seedStandard(t, b)
			w.AddMatter(matterB, workspaceID)
			w.SetMatterMembership(matterB, editor.ID, matter.MatterRoleEditor, matter.StatusActive)
			key := newKey()
			first := mustCreate(t, s, editor.ID, key, anyHash) // outcome stored for matterA
			w.SetMatterMembership(matterA, editor.ID, matter.MatterRoleViewer, matter.StatusActive)
			replayed, err := createOn(s, editor.ID, key, anyHash, matterB)
			if err != nil {
				t.Fatalf("replay after demotion failed: %v", err)
			}
			first.Replayed = true
			if first != replayed {
				t.Fatal("replayed stored outcome changed")
			}
			if c := w.Counts(); c.Requirements != 1 || c.Receipts != 1 {
				t.Fatalf("replay wrote rows: %+v", c)
			}
		})
	})

	// BE01-F02 / backend-fast-track section 6: an unevaluated pending temporal boundary
	// is never silently no-op'd. Due boundaries fail closed before any mutation; future
	// boundaries are safe and must survive a successful command and a replay.
	t.Run("elapsed pending boundary fails closed", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		w.SetElapsedBoundary(matterA)
		if _, err := create(s, editor.ID, newKey(), anyHash); !errors.Is(err, matter.ErrBoundaryDue) {
			t.Fatalf("want ErrBoundaryDue, got %v", err)
		}
		if c := w.Counts(); c.Nodes != 0 || c.Requirements != 0 || c.Events != 0 ||
			c.Receipts != 0 || c.ReceiptMatters != 0 || c.Audits != 0 {
			t.Fatalf("refused command wrote rows: %+v", c)
		}
		if _, ok := w.NextBoundary(matterA); !ok {
			t.Fatal("pending boundary disappeared after refusal")
		}
		if _, err := create(s, editor.ID, newKey(), anyHash); !errors.Is(err, matter.ErrBoundaryDue) {
			t.Fatalf("boundary not preserved: a later command must still be refused, got %v", err)
		}
	})

	t.Run("not-due pending boundary is preserved by a successful create", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		w.SetFutureBoundary(matterA)
		mustCreate(t, s, editor.ID, newKey(), anyHash)
		if c := w.Counts(); c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
			t.Fatalf("create counts: %+v", c)
		}
		if _, ok := w.NextBoundary(matterA); !ok {
			t.Fatal("successful create cleared a not-due pending boundary")
		}
	})

	t.Run("replay keeps a later pending boundary intact", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		key := newKey()
		first := mustCreate(t, s, editor.ID, key, anyHash)
		w.SetElapsedBoundary(matterA)
		replayed, err := create(s, editor.ID, key, anyHash)
		if err != nil {
			t.Fatalf("replay performs no mutation, so it is not gated by a pending boundary: %v", err)
		}
		first.Replayed = true
		if first != replayed {
			t.Fatal("replayed outcome changed")
		}
		if _, ok := w.NextBoundary(matterA); !ok {
			t.Fatal("replay cleared the pending boundary")
		}
		if c := w.Counts(); c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
			t.Fatalf("replay wrote rows: %+v", c)
		}
	})

	t.Run("uniform read outcomes", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		res := mustCreate(t, s, editor.ID, newKey(), anyHash)
		action := matter.NodeID(uuid.Must(uuid.NewV7()).String())
		w.InsertActionNode(action, matterA)

		for name, tc := range map[string]port.GetRequirementQuery{
			"nonexistent":  {ActorID: editor.ID.String(), ID: uuid.Must(uuid.NewV7()).String()},
			"kindMismatch": {ActorID: editor.ID.String(), ID: action.String()},
			"outsider":     {ActorID: outsider.ID.String(), ID: res.Requirement.ID.String()},
		} {
			if _, err := s.GetRequirement(context.Background(), tc); !errors.Is(err, port.ErrNotFound) {
				t.Fatalf("%s: want uniform ErrNotFound, got %v", name, err)
			}
		}
		read, err := s.GetRequirement(context.Background(), port.GetRequirementQuery{
			ActorID: viewer.ID.String(), ID: res.Requirement.ID.String(),
		})
		if err != nil {
			t.Fatal(err)
		}
		if read.Requirement != res.Requirement || read.SourceRevision != res.Seq || read.AsOf.IsZero() {
			t.Fatalf("read mismatch: %+v", read)
		}
	})

	t.Run("snapshot stays consistent across a concurrent create", func(t *testing.T) {
		b := newBundle(t)
		w, s := seedStandard(t, b)
		first := mustCreate(t, s, editor.ID, newKey(), anyHash)

		inSnapshot := make(chan struct{})
		release := make(chan struct{})
		done := make(chan error, 1)
		go func() {
			done <- b.Store.View(context.Background(), func(snap port.MatterSnapshot) error {
				read1, m1, err := snap.RequirementByID(context.Background(), first.Requirement.ID)
				if err != nil {
					return err
				}
				close(inSnapshot)
				<-release
				// Second read in the SAME snapshot: the concurrent create must be invisible.
				read2, m2, err := snap.RequirementByID(context.Background(), first.Requirement.ID)
				if err != nil {
					return err
				}
				if read1 != read2 || m1 != m2 {
					return errors.New("snapshot read drifted")
				}
				h, err := snap.MatterHeader(context.Background(), m1)
				if err != nil {
					return err
				}
				if h.EventSeq != first.Seq {
					return fmt.Errorf("sourceRevision drifted: %d != %d", h.EventSeq, first.Seq)
				}
				return nil
			})
		}()
		<-inSnapshot
		mustCreate(t, s, editor2.ID, newKey(), anyHash) // commits while the snapshot is open
		close(release)
		if err := <-done; err != nil {
			t.Fatal(err)
		}
		if c := w.Counts(); c.Requirements != 2 {
			t.Fatalf("concurrent create missing: %+v", c)
		}
	})

	// Rollback-on-injected-failure and commit-phase outcomes need backend seams; run
	// them when the store implements the injection interfaces.
	if _, ok := newBundle(t).Store.(injector); ok {
		t.Run("injected step failures roll back everything", func(t *testing.T) {
			for _, step := range []string{"insert_node", "insert_requirement", "append_event", "store_receipt", "complete_matter"} {
				t.Run(step, func(t *testing.T) {
					b := newBundle(t)
					w, s := seedStandard(t, b)
					inj := mustInjector(t, b.Store)
					inj.SetFailAt(step)
					_, err := create(s, editor.ID, newKey(), anyHash)
					if err == nil {
						t.Fatal("injected failure must surface")
					}
					inj.SetFailAt("")
					if c := w.Counts(); c.Nodes != 0 || c.Requirements != 0 || c.Events != 0 ||
						c.Receipts != 0 || c.ReceiptMatters != 0 {
						t.Fatalf("rollback incomplete: %+v", c)
					}
					// The same key must still be usable: nothing committed.
					mustCreate(t, s, editor.ID, newKey(), anyHash)
				})
			}
		})
		t.Run("commit outcomes", func(t *testing.T) {
			t.Run("unknown outcome is not proof of rollback", func(t *testing.T) {
				b := newBundle(t)
				w, s := seedStandard(t, b)
				inj := mustInjector(t, b.Store)
				inj.SetCommitUnknown(errors.New("connection reset"))
				if _, err := create(s, editor.ID, newKey(), anyHash); !errors.Is(err, port.ErrOutcomeUnknown) {
					t.Fatalf("want ErrOutcomeUnknown, got %v", err)
				}
				if c := w.Counts(); c.Requirements != 1 || c.Receipts != 1 {
					t.Fatalf("lost ack must leave the committed effect: %+v", c)
				}
			})
			t.Run("known abort is unavailable with no effect", func(t *testing.T) {
				b := newBundle(t)
				w, s := seedStandard(t, b)
				inj := mustInjector(t, b.Store)
				inj.SetCommitRollback(errors.New("serialization failure"))
				if _, err := create(s, editor.ID, newKey(), anyHash); !errors.Is(err, port.ErrUnavailable) {
					t.Fatalf("want ErrUnavailable, got %v", err)
				}
				if c := w.Counts(); c.Requirements != 0 || c.Receipts != 0 {
					t.Fatalf("known abort must leave nothing: %+v", c)
				}
			})
		})
	}
	// BE01-F03 / BE01-T08: a membership lookup failure is a storage failure, not
	// absence — it must surface (unavailable stays unavailable; unexpected stays
	// non-not-found) on create, replay and read, and never fabricate a denial,
	// an empty result or a key-reuse outcome.
	if _, ok := newBundle(t).Store.(failInjector); ok {
		t.Run("membership storage failures stay distinct", func(t *testing.T) {
			for _, step := range []string{"membership_unavailable", "membership_unexpected"} {
				t.Run(step, func(t *testing.T) {
					t.Run("create aborts with no effect", func(t *testing.T) {
						b := newBundle(t)
						w, s := seedStandard(t, b)
						mustFailInjector(t, b.Store).SetFailAt(step)
						_, err := create(s, editor.ID, newKey(), anyHash)
						if err == nil || errors.Is(err, port.ErrNotFound) || errors.Is(err, port.ErrForbidden) {
							t.Fatalf("membership failure must surface, not fake a denial: %v", err)
						}
						if step == "membership_unavailable" && !errors.Is(err, port.ErrUnavailable) {
							t.Fatalf("unavailable must stay unavailable: %v", err)
						}
						if c := w.Counts(); c.Nodes != 0 || c.Requirements != 0 || c.Events != 0 ||
							c.Receipts != 0 || c.Audits != 0 {
							t.Fatalf("aborted create wrote rows: %+v", c)
						}
					})
					t.Run("replay aborts without exposing the receipt", func(t *testing.T) {
						b := newBundle(t)
						w, s := seedStandard(t, b)
						key := newKey()
						mustCreate(t, s, editor.ID, key, anyHash)
						mustFailInjector(t, b.Store).SetFailAt(step)
						_, err := create(s, editor.ID, key, anyHash)
						if err == nil || errors.Is(err, port.ErrNotFound) || errors.Is(err, port.ErrIdempotencyKeyReuse) {
							t.Fatalf("membership failure must surface during replay: %v", err)
						}
						if step == "membership_unavailable" && !errors.Is(err, port.ErrUnavailable) {
							t.Fatalf("unavailable must stay unavailable: %v", err)
						}
						if c := w.Counts(); c.Requirements != 1 || c.Receipts != 1 {
							t.Fatalf("aborted replay changed rows: %+v", c)
						}
					})
					t.Run("read is unavailable, not empty", func(t *testing.T) {
						b := newBundle(t)
						_, s := seedStandard(t, b)
						res := mustCreate(t, s, editor.ID, newKey(), anyHash)
						mustFailInjector(t, b.Store).SetFailAt(step)
						_, err := s.GetRequirement(context.Background(), port.GetRequirementQuery{
							ActorID: editor.ID.String(), ID: res.Requirement.ID.String(),
						})
						if err == nil || errors.Is(err, port.ErrNotFound) {
							t.Fatalf("membership failure must surface on read: %v", err)
						}
						if step == "membership_unavailable" && !errors.Is(err, port.ErrUnavailable) {
							t.Fatalf("unavailable must stay unavailable: %v", err)
						}
					})
				})
			}
		})
	}
}

// mustFailInjector returns a store that supports per-step fail injection.
func mustFailInjector(t *testing.T, store port.MatterStore) failInjector {
	t.Helper()
	inj, ok := store.(failInjector)
	if !ok {
		t.Fatal("store does not implement the fail injection seam")
	}
	return inj
}

func mustInjector(t *testing.T, store port.MatterStore) injector {
	t.Helper()
	inj, ok := store.(injector)
	if !ok {
		t.Fatal("store does not implement the injection seams")
	}
	return inj
}

// ---------- helpers ----------

type actor struct{ ID matter.ActorID }

var (
	editor   = actor{ID: matter.ActorID(uuid.Must(uuid.NewV7()).String())}
	editor2  = actor{ID: matter.ActorID(uuid.Must(uuid.NewV7()).String())}
	viewer   = actor{ID: matter.ActorID(uuid.Must(uuid.NewV7()).String())}
	outsider = actor{ID: matter.ActorID(uuid.Must(uuid.NewV7()).String())}
	wsOwner  = actor{ID: matter.ActorID(uuid.Must(uuid.NewV7()).String())}

	workspaceID = matter.WorkspaceID(uuid.Must(uuid.NewV7()).String())
	matterA     = matter.MatterID(uuid.Must(uuid.NewV7()).String())
	matterB     = matter.MatterID(uuid.Must(uuid.NewV7()).String())
)

const anyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

func seedStandard(t *testing.T, b Bundle) (World, port.MatterService) {
	t.Helper()
	for _, a := range []matter.ActorID{editor.ID, editor2.ID, viewer.ID, wsOwner.ID} {
		b.World.AddUser(a)
	}
	b.World.AddWorkspace(workspaceID)
	b.World.SetWorkspaceMembership(workspaceID, editor.ID, matter.WorkspaceRoleMember, matter.StatusActive)
	b.World.SetWorkspaceMembership(workspaceID, editor2.ID, matter.WorkspaceRoleMember, matter.StatusActive)
	b.World.SetWorkspaceMembership(workspaceID, viewer.ID, matter.WorkspaceRoleMember, matter.StatusActive)
	b.World.SetWorkspaceMembership(workspaceID, wsOwner.ID, matter.WorkspaceRoleOwner, matter.StatusActive)
	b.World.AddMatter(matterA, workspaceID)
	b.World.SetMatterMembership(matterA, editor.ID, matter.MatterRoleEditor, matter.StatusActive)
	b.World.SetMatterMembership(matterA, editor2.ID, matter.MatterRoleEditor, matter.StatusActive)
	b.World.SetMatterMembership(matterA, viewer.ID, matter.MatterRoleViewer, matter.StatusActive)
	ids := port.RecordIDGenerator(kitIDs{})
	if b.IDs != nil {
		ids = b.IDs
	}
	s := service.NewMatterService(b.Store, ids, discardLogger(), matter.KeyAgePolicy{})
	return b.World, s
}

func discardLogger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

func newKey() string { return uuid.Must(uuid.NewV7()).String() }

func create(s port.MatterService, actor matter.ActorID, key, hash string) (matter.RequirementCreatedResult, error) {
	return createOn(s, actor, key, hash, matterA)
}

// createOn dispatches a create command against an explicit target matter.
func createOn(s port.MatterService, actor matter.ActorID, key, hash string, target matter.MatterID) (matter.RequirementCreatedResult, error) {
	return s.CreateRequirement(context.Background(), port.CreateRequirementCmd{
		ActorID: actor.String(), MatterID: target.String(),
		IdempotencyKey: key, RequestHash: hash,
		Title: "Sign the SPA", Outcome: "Executed SPA countersigned by both parties",
	})
}

func mustCreate(t *testing.T, s port.MatterService, actor matter.ActorID, key, hash string) matter.RequirementCreatedResult {
	t.Helper()
	res, err := create(s, actor, key, hash)
	if err != nil {
		t.Fatal(err)
	}
	return res
}
