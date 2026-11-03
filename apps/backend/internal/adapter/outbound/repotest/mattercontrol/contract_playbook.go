package mattercontrol

// RLF-05 playbook contract: publish immutable revisions; apply one exact revision atomically and
// idempotently with provenance. Runs on the memory double and PostgreSQL.

import (
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

// SuitePlaybooks runs the playbook contracts.
func SuitePlaybooks(t *testing.T, newBundle Factory) {
	t.Helper()
	t.Run("playbook publish apply atomicity", func(t *testing.T) { playbookApplyContract(t, newBundle) })
}

func playbookApplyContract(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	ctx := e.ctx
	svc := service.NewPlaybookService(e.b.Store.(port.WorkspaceStore), e.work, kitIDs{})
	w1 := w1Env{t: t, ws: e.ws, ctx: ctx}

	// The workspace OWNER publishes one revision: two entries, one dependency, one owner key.
	entries := []matter.PlaybookEntry{
		{Key: "collect", Kind: "REQUIREMENT", Title: "Collect documents", Outcome: "Complete set"},
		{Key: "file", Kind: "ACTION", Title: "File the form", Outcome: "Filed", OwnerKey: "collect", DependsOn: []string{"collect"}, DueDaysOffset: 7},
	}
	pb, err := svc.CreatePlaybook(ctx, port.CreatePlaybookCmd{
		ActorID: e.owner.String(), WorkspaceID: e.wsID.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
		ExpectedRevision: w1.wsRevision(e.owner, e.wsID), Name: "Onboarding",
	})
	if err != nil {
		t.Fatalf("create playbook: %v", err)
	}
	pub, err := svc.PublishPlaybookRevision(ctx, port.PublishPlaybookRevisionCmd{
		ActorID: e.owner.String(), WorkspaceID: e.wsID.String(), PlaybookID: pb.ID,
		IdempotencyKey: newKey(), RequestHash: anyHash, ExpectedRevision: w1.wsRevision(e.owner, e.wsID), Entries: entries,
	})
	if err != nil {
		t.Fatalf("publish: %v", err)
	}
	revID := matter.PlaybookRevisionID(pub.ID)

	// A duplicate (workspace, name) is a typed 409, never a storage error.
	if _, err := svc.CreatePlaybook(ctx, port.CreatePlaybookCmd{
		ActorID: e.owner.String(), WorkspaceID: e.wsID.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
		ExpectedRevision: w1.wsRevision(e.owner, e.wsID), Name: "Onboarding",
	}); err == nil {
		t.Fatal("a duplicate playbook name must be refused")
	}

	// The matter OWNER applies with an explicit owner mapping; the apply is atomic.
	applyKey := newKey()
	applied, err := svc.ApplyPlaybook(ctx, port.ApplyPlaybookCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), RevisionID: revID.String(),
		IdempotencyKey: applyKey, RequestHash: anyHash,
		OwnerMap: map[string]string{"file": e.editor.String()},
	})
	if err != nil {
		t.Fatalf("apply: %v", err)
	}
	if applied.RevisionNo != 1 {
		t.Fatalf("applied revision 1: %+v", applied)
	}
	// Provenance names every entry; the graph holds two items and the dependency edge.
	insts, err := svc.ListMatterPlaybookInstances(ctx, port.ListPlaybookInstancesQuery{ActorID: e.owner.String(), MatterID: e.m.String()})
	if err != nil || len(insts) != 2 {
		t.Fatalf("provenance for every entry: %+v (%v)", insts, err)
	}
	var fileID matter.NodeID
	for _, i := range insts {
		if i.EntryKey == "file" {
			fileID = i.ItemID
		}
	}
	if detail := e.detail(fileID); len(detail.Upstream) != 1 || detail.Upstream[0].Edge.Gate != matter.GateCompletion {
		t.Fatalf("the template dependency became a COMPLETION edge: %+v", detail.Upstream)
	}
	// Same key replays: no second effect.
	replay, err := svc.ApplyPlaybook(ctx, port.ApplyPlaybookCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), RevisionID: revID.String(),
		IdempotencyKey: applyKey, RequestHash: anyHash,
		OwnerMap: map[string]string{"file": e.editor.String()},
	})
	if err != nil || !replay.Replayed {
		t.Fatalf("replay: %+v (%v)", replay, err)
	}
	// The same revision under a different key is refused.
	if _, err := svc.ApplyPlaybook(ctx, port.ApplyPlaybookCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), RevisionID: revID.String(),
		IdempotencyKey: newKey(), RequestHash: anyHash,
		OwnerMap: map[string]string{"file": e.editor.String()},
	}); err == nil {
		t.Fatal("a second application of the same revision must be refused")
	}
	// An owner outside the matter aborts the whole application: nothing partial exists.
	pub2, err := svc.PublishPlaybookRevision(ctx, port.PublishPlaybookRevisionCmd{
		ActorID: e.owner.String(), WorkspaceID: e.wsID.String(), PlaybookID: pb.ID,
		IdempotencyKey: newKey(), RequestHash: anyHash, ExpectedRevision: w1.wsRevision(e.owner, e.wsID),
		Entries: []matter.PlaybookEntry{{Key: "x", Kind: "ACTION", Title: "X", Outcome: "Done", OwnerKey: "x"}},
	})
	if err != nil {
		t.Fatalf("publish 2: %v", err)
	}
	if _, err := svc.ApplyPlaybook(ctx, port.ApplyPlaybookCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), RevisionID: pub2.ID,
		IdempotencyKey: newKey(), RequestHash: anyHash,
		OwnerMap: map[string]string{"x": e.out.String()},
	}); err == nil {
		t.Fatal("an owner outside the matter must abort the application")
	}
	insts2, err := svc.ListMatterPlaybookInstances(ctx, port.ListPlaybookInstancesQuery{ActorID: e.owner.String(), MatterID: e.m.String()})
	if err != nil || len(insts2) != 2 {
		t.Fatalf("the failed application created nothing: %+v (%v)", insts2, err)
	}
	// The editor (not the matter OWNER) cannot apply.
	if _, err := svc.ApplyPlaybook(ctx, port.ApplyPlaybookCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), RevisionID: pub2.ID,
		IdempotencyKey: newKey(), RequestHash: anyHash, OwnerMap: map[string]string{"x": e.editor.String()},
	}); err == nil {
		t.Fatal("only the matter OWNER applies")
	}
}
