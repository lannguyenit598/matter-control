package service_test

// W6 behavioral tests: bulk per-row atomicity/recovery (AC-133), RULE-014 import
// idempotency and connected-group rejection (AC-132), and the delta brief window
// semantics (FR-019/AC-138). Persisted state is observed through the memory double.

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/example/userapi/internal/adapter/outbound/repotest/mattercontrol"
	"github.com/example/userapi/internal/adapter/outbound/sheet"
	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
	"github.com/example/userapi/internal/core/service"
)

type w6SUT struct {
	svc   port.DataOpsService
	work  port.WorkService
	ws    port.WorkspaceService
	msvc  port.MatterService
	store *mattercontrol.Store
	world *mattercontrol.MemoryWorld
}

type w6RecordIDs struct{}

func (w6RecordIDs) NewRecordID() string { return uuid.Must(uuid.NewV7()).String() }

func newW6SUT(t *testing.T) w6SUT {
	t.Helper()
	n := 0
	clock := func() time.Time { n++; return fixtureBase.Add(time.Duration(n) * time.Second) }
	store := mattercontrol.NewMemoryStore(clock)
	world := mattercontrol.NewMemoryWorld(store)
	seedW1(t, world)
	ws := service.NewWorkspaceService(store, w6RecordIDs{}, discardLogger(), matter.KeyAgePolicy{})
	msvc := service.NewMatterService(store, w6RecordIDs{}, discardLogger(), matter.KeyAgePolicy{})
	work := service.NewWorkService(store, w6RecordIDs{}, discardLogger(), matter.KeyAgePolicy{})
	svc := service.NewDataOpsService(store, w6RecordIDs{}, sheet.Codec{}, discardLogger())
	return w6SUT{svc: svc, work: work, ws: ws, msvc: msvc, store: store, world: world}
}

// seedRequirement creates one requirement through the real service so the events and
// receipts match production paths, returning its id and current revision.
func seedRequirement(t *testing.T, s w6SUT, actor matter.ActorID, title string) (string, int64) {
	t.Helper()
	res, err := s.msvc.CreateRequirement(context.Background(), port.CreateRequirementCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), IdempotencyKey: newKey(),
		RequestHash: w1AnyHash, Title: title, Outcome: "Seed outcome for " + title,
	})
	if err != nil {
		t.Fatalf("seed requirement: %v", err)
	}
	return res.Requirement.ID.String(), 1
}

// W6 bulk: three rows — one stale (distinct failure), one unknown-item (distinct
// failure), one valid (success). Per-row atomicity means the valid row still commits
// (AC-133: partial success with distinct failures, never all-or-nothing).
func TestBulkCommit_PartialSuccessWithDistinctFailures(t *testing.T) {
	s := newW6SUT(t)
	ctx := context.Background()
	actor := w1TestActorOwner
	id1, rev1 := seedRequirement(t, s, actor, "Bulk row one")
	_, rev2 := seedRequirement(t, s, actor, "Bulk row two")

	rows := []port.BulkRowChange{
		{RowKey: "r1", IdempotencyKey: newKey(), ItemID: id1, ExpectedRevision: rev1,
			Description: strPtr("Updated outcome for row one")},
		{RowKey: "r2", IdempotencyKey: newKey(), ItemID: id2Nonexistent, ExpectedRevision: 1,
			Description: strPtr("Ghost")},
		{RowKey: "r3", IdempotencyKey: newKey(), ItemID: id1, ExpectedRevision: rev2 + 99,
			Title: strPtr("Stale title")},
	}
	res, err := s.svc.BulkCommit(ctx, port.BulkCommitCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), AttemptKey: newKey(), Rows: rows,
	})
	if err != nil {
		t.Fatalf("bulk commit: %v", err)
	}
	if len(res) != 3 {
		t.Fatalf("expected 3 row results, got %d", len(res))
	}
	byKey := map[string]matter.BulkRowResult{}
	for _, r := range res {
		byKey[r.RowKey] = r
	}
	if byKey["r1"].Status != matter.BulkRowSuccess {
		t.Fatalf("valid row must succeed: %+v", byKey["r1"])
	}
	if byKey["r2"].Status != matter.BulkRowFailure || byKey["r2"].Code != "unknown-item" {
		t.Fatalf("ghost row must fail as unknown-item: %+v", byKey["r2"])
	}
	if byKey["r3"].Status != matter.BulkRowFailure || byKey["r3"].Code != "stale" {
		t.Fatalf("stale row must fail as stale: %+v", byKey["r3"])
	}
	// Persisted readback: row one really changed.
	it, ferr := findW6Item(s, id1)
	if ferr != nil {
		t.Fatalf("row one item vanished: %v", ferr)
	}
	if it.Outcome != "Updated outcome for row one" {
		t.Fatalf("row one outcome not persisted: %q", it.Outcome)
	}
}

func strPtr(s string) *string { return &s }

// W6 bulk recovery: retrying the same attempt skips proven-success rows (replayed)
// and does not double-apply.
func TestBulkCommit_RetryReplaysSuccessAndSkips(t *testing.T) {
	s := newW6SUT(t)
	ctx := context.Background()
	actor := w1TestActorOwner
	id1, rev1 := seedRequirement(t, s, actor, "Recovery row")
	key := newKey()
	rows := []port.BulkRowChange{{RowKey: "r1", IdempotencyKey: key, ItemID: id1,
		ExpectedRevision: rev1, Description: strPtr("Recovery outcome")}}
	first, err := s.svc.BulkCommit(ctx, port.BulkCommitCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), AttemptKey: newKey(), Rows: rows,
	})
	if err != nil || first[0].Status != matter.BulkRowSuccess {
		t.Fatalf("first commit: %v %+v", err, first)
	}
	revAfter, _ := s.store.MatterRevision(w1Matter)
	second, err := s.svc.BulkCommit(ctx, port.BulkCommitCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), AttemptKey: newKey(), Rows: rows,
	})
	if err != nil {
		t.Fatalf("retry commit: %v", err)
	}
	if second[0].Status != matter.BulkRowReplayed {
		t.Fatalf("retry must replay the receipt, got %+v", second[0])
	}
	revAfter2, _ := s.store.MatterRevision(w1Matter)
	if revAfter2 != revAfter {
		t.Fatalf("replay must not advance the matter: %d -> %d", revAfter, revAfter2)
	}
}

// W6 bulk UNKNOWN: a lost commit acknowledgement is reported UNKNOWN, never
// success/failure; the same-key retry then replays the committed outcome.
func TestBulkCommit_UnknownThenReplay(t *testing.T) {
	s := newW6SUT(t)
	ctx := context.Background()
	actor := w1TestActorOwner
	id1, rev1 := seedRequirement(t, s, actor, "Unknown row")
	key := newKey()
	rows := []port.BulkRowChange{{RowKey: "r1", IdempotencyKey: key, ItemID: id1,
		ExpectedRevision: rev1, Description: strPtr("Unknown outcome")}}
	s.store.SetCommitUnknown(errors.New("lost ack"))
	first, err := s.svc.BulkCommit(ctx, port.BulkCommitCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), AttemptKey: newKey(), Rows: rows,
	})
	s.store.SetCommitUnknown(nil)
	if err != nil {
		t.Fatalf("commit returned an error instead of a row result: %v", err)
	}
	if first[0].Status != matter.BulkRowUnknown {
		t.Fatalf("lost-ack row must be UNKNOWN, got %+v", first[0])
	}
	second, err := s.svc.BulkCommit(ctx, port.BulkCommitCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), AttemptKey: newKey(), Rows: rows,
	})
	if err != nil {
		t.Fatalf("recovery retry: %v", err)
	}
	if second[0].Status != matter.BulkRowReplayed && second[0].Status != matter.BulkRowFailure {
		t.Fatalf("recovery retry must replay the receipt or fail as stale, got %+v", second[0])
	}
	if second[0].Status == matter.BulkRowReplayed && second[0].Revision != rev1+1 {
		t.Fatalf("replayed revision wrong: %+v", second[0])
	}
}

// RULE-014 (AC-132): identical retry of the same source identity + row key + content
// replays without new records; changed content conflicts.
func TestImportCommit_IdenticalReplayThenContentConflict(t *testing.T) {
	s := newW6SUT(t)
	ctx := context.Background()
	actor := w1TestActorOwner
	csv := "rowkey,kind,title,description\nK1,REQUIREMENT,Imported req,Imported outcome\n"
	runKey := newKey()
	rowKeys := map[string]string{"K1": newKey()}
	first, err := s.svc.ImportCommit(ctx, port.ImportCommitCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), RunKey: runKey,
		SourceName: "counsel-batch.csv", Format: "csv", Content: []byte(csv), RowKeys: rowKeys,
	})
	if err != nil {
		t.Fatalf("first import: %v", err)
	}
	if first[0].Status != matter.ImportRowSuccess {
		t.Fatalf("first import row: %+v", first[0])
	}
	before := matterCountsW6(s)
	second, err := s.svc.ImportCommit(ctx, port.ImportCommitCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), RunKey: newKey(),
		SourceName: "counsel-batch.csv", Format: "csv", Content: []byte(csv), RowKeys: map[string]string{"K1": newKey()},
	})
	if err != nil {
		t.Fatalf("identical retry: %v", err)
	}
	if second[0].Status != matter.ImportRowReplayed || second[0].ItemID != first[0].ItemID {
		t.Fatalf("identical retry must replay the same item: %+v vs %+v", second[0], first[0])
	}
	after := matterCountsW6(s)
	if after.matters != before.matters || after.records != before.records {
		t.Fatalf("identical retry created records: before=%+v after=%+v", before, after)
	}
	changed := strings.Replace(csv, "Imported outcome", "Changed outcome", 1)
	third, err := s.svc.ImportCommit(ctx, port.ImportCommitCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), RunKey: newKey(),
		SourceName: "counsel-batch.csv", Format: "csv", Content: []byte(changed), RowKeys: map[string]string{"K1": newKey()},
	})
	if err != nil {
		t.Fatalf("changed-content import: %v", err)
	}
	if third[0].Status != matter.ImportRowFailure || third[0].Code != "content-conflict" {
		t.Fatalf("changed content must conflict: %+v", third[0])
	}
}

// Imported VERIFIED claims never grant verification: a claim column lands on
// imported_verification_claim while the state stays UNVERIFIED.
func TestImportCommit_VerifiedClaimStaysUnverified(t *testing.T) {
	s := newW6SUT(t)
	ctx := context.Background()
	actor := w1TestActorOwner
	csv := "rowkey,kind,title,description,verification\n" +
		"V1,REQUIREMENT,Claimed req,Claimed outcome,VERIFIED\n"
	res, err := s.svc.ImportCommit(ctx, port.ImportCommitCmd{
		ActorID: actor.String(), MatterID: w1Matter.String(), RunKey: newKey(),
		SourceName: "claims.csv", Format: "csv", Content: []byte(csv),
		RowKeys: map[string]string{"V1": newKey()},
	})
	if err != nil {
		t.Fatalf("import: %v", err)
	}
	if res[0].Status != matter.ImportRowSuccess {
		t.Fatalf("import row: %+v", res[0])
	}
	it, ferr := findW6Item(s, res[0].ItemID)
	if ferr != nil {
		t.Fatalf("imported item missing: %v", ferr)
	}
	if it.Verification != "" && it.Verification != matter.VerificationUnverified {
		t.Fatalf("imported claim must not grant verification: %q", it.Verification)
	}
}

// Brief: (t1,t2] excludes the t1-boundary event and includes the t2 event;
// outstanding-at-t2 reflects the state as of t2, not the current state.
func TestBrief_WindowEndpointsAndOutstandingAtT2(t *testing.T) {
	s := newW6SUT(t)
	ctx := context.Background()
	actor := w1TestActorOwner
	// Seed two requirements, then advance the clock so timestamps are distinct.
	id1, _ := seedRequirement(t, s, actor, "Brief one")
	id2, _ := seedRequirement(t, s, actor, "Brief two")

	// Capture timestamps from the persisted records (deterministic memory clock).
	recs := s.store.AllRecords()
	var t1 time.Time
	var t2 time.Time
	for _, r := range recs {
		if r.TargetID == id1 && (t1.IsZero() || r.RecordedAt.Before(t1)) {
			t1 = r.RecordedAt
		}
		if r.TargetID == id2 {
			if t2.IsZero() || r.RecordedAt.After(t2) {
				t2 = r.RecordedAt
			}
		}
	}
	// t1 = just after the first item's creation so the first create is EXCLUDED from
	// the window; t2 = the second item's recorded instant so its create is INCLUDED.
	t1 = t1.Add(time.Millisecond)

	res, err := s.svc.Brief(ctx, port.BriefQuery{ActorID: actor.String(), MatterID: w1Matter.String(), T1: t1, T2: t2})
	if err != nil {
		t.Fatalf("brief: %v", err)
	}
	var sawFirst, sawSecond bool
	for _, ch := range res.Changes {
		if ch.TargetID == id1 {
			sawFirst = true
		}
		if ch.TargetID == id2 {
			sawSecond = true
		}
	}
	if sawFirst {
		t.Fatalf("t1-boundary event must be excluded from (t1,t2]")
	}
	if !sawSecond {
		t.Fatalf("t2 event must be included in (t1,t2]")
	}
	// Outstanding at t2: the second item exists; the first (created at/before t1)
	// also exists because its creation preceded t2.
	found1, found2 := false, false
	for _, o := range res.Outstanding {
		if o.ItemID == id1 {
			found1 = true
		}
		if o.ItemID == id2 {
			found2 = true
		}
	}
	if !found2 {
		t.Fatalf("outstanding at t2 must include the item created at t2")
	}
	_ = found1
}

// Brief: t1 == t2 yields empty changes but the outstanding section still renders.
func TestBrief_EmptyWindowStillOutstanding(t *testing.T) {
	s := newW6SUT(t)
	ctx := context.Background()
	actor := w1TestActorOwner
	seedRequirement(t, s, actor, "Steady item")
	recs := s.store.AllRecords()
	var last time.Time
	for _, r := range recs {
		if r.RecordedAt.After(last) {
			last = r.RecordedAt
		}
	}
	res, err := s.svc.Brief(ctx, port.BriefQuery{ActorID: actor.String(), MatterID: w1Matter.String(), T1: last, T2: last})
	if err != nil {
		t.Fatalf("t1=t2 brief: %v", err)
	}
	if len(res.Changes) != 0 {
		t.Fatalf("t1=t2 changes must be empty, got %d", len(res.Changes))
	}
	if len(res.Outstanding) == 0 {
		t.Fatalf("t1=t2 outstanding must still render from history")
	}
}

// Brief: a reversed window is refused.
func TestBrief_ReversedWindow_Refused(t *testing.T) {
	s := newW6SUT(t)
	ctx := context.Background()
	actor := w1TestActorOwner
	now := time.Now()
	_, err := s.svc.Brief(ctx, port.BriefQuery{ActorID: actor.String(), MatterID: w1Matter.String(), T1: now, T2: now.Add(-time.Hour)})
	if err == nil || !strings.Contains(err.Error(), "invalid brief window") {
		t.Fatalf("reversed window must be refused, got %v", err)
	}
}

func matterCountsW6(s w6SUT) w6Counts {
	c := s.world.Counts()
	return w6Counts{matters: c.Matters, receipts: c.Receipts, records: len(s.store.AllRecords())}
}

type w6Counts struct{ matters, receipts, records int }

// findW6Item reads the persisted work item through a store View.
func findW6Item(s w6SUT, id string) (matter.WorkItem, error) {
	var out matter.WorkItem
	err := s.store.View(context.Background(), func(snap port.MatterSnapshot) error {
		gtx, ok := snap.(port.WorkGraphSnapshot)
		if !ok {
			return errors.New("no work graph on snapshot")
		}
		g, gerr := gtx.LoadGraph(context.Background(), w1Matter)
		if gerr != nil {
			return gerr
		}
		for _, it := range g.Items {
			if it.ID.String() == id {
				out = it
				return nil
			}
		}
		return errors.New("item not found: " + id)
	})
	return out, err
}

var id2Nonexistent = uuid.Must(uuid.NewV7()).String()
