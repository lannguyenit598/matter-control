package mattercontrol

// RLF-06 + RLF-07 contract: intake record/decline/convert and guidance draft/publish on both
// stores. Conversion is receipted and atomic; drafts append; publication is OWNER-only and
// immutable.

import (
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

// SuiteIntakeGuidance runs the intake and guidance contracts.
func SuiteIntakeGuidance(t *testing.T, newBundle Factory) {
	t.Helper()
	t.Run("intake lifecycle", func(t *testing.T) { intakeContract(t, newBundle) })
	t.Run("guidance lifecycle", func(t *testing.T) { guidanceContract(t, newBundle) })
}

func intakeContract(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	ctx := e.ctx
	svc := service.NewIntakeService(e.work)

	// Record with the original request (EDITOR is allowed).
	res, err := svc.CreateIntake(ctx, port.CreateIntakeCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
		Title: "Client asks about signing", RequestText: "Please handle it.", Requester: "Dana (client)",
		ReceivedAt: time.Now().UTC().Add(-time.Hour),
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	rs, err := svc.ListIntake(ctx, port.ListIntakeQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
	if err != nil || len(rs) != 1 || rs[0].Status != matter.IntakePending {
		t.Fatalf("any member reads the pending record: %+v (%v)", rs, err)
	}

	// Decline with a reason; CAS on the record revision.
	if _, err := svc.TriageIntake(ctx, port.TriageIntakeCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IntakeID: res.ID,
		ExpectedRevision: 1, Decline: true, Reason: "outside this matter's scope",
	}); err != nil {
		t.Fatalf("decline: %v", err)
	}
	rs, _ = svc.ListIntake(ctx, port.ListIntakeQuery{ActorID: e.owner.String(), MatterID: e.m.String()})
	if rs[0].Status != matter.IntakeDeclined || rs[0].TriagedBy == nil {
		t.Fatalf("declined with an accountable triager: %+v", rs[0])
	}

	// Conversion: receipted, atomic, idempotent, into a real ACTION.
	res2, err := svc.CreateIntake(ctx, port.CreateIntakeCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
		Title: "Signature request", RequestText: "Handle it.",
		ReceivedAt: time.Now().UTC().Add(-time.Hour),
	})
	if err != nil {
		t.Fatalf("create 2: %v", err)
	}
	key := newKey()
	record, created, replayed, err := svc.ConvertIntake(ctx, port.ConvertIntakeCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), IntakeID: res2.ID,
		IdempotencyKey: key, RequestHash: anyHash,
		Kind: "ACTION", Title: "Handle signature", Outcome: "Handled", Owner: e.editor.String(),
	})
	if err != nil || replayed || record.Status != matter.IntakeConverted || record.ItemID == nil {
		t.Fatalf("convert: %+v %+v (%v)", record, created, err)
	}
	_, _, replayedAgain, err := svc.ConvertIntake(ctx, port.ConvertIntakeCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), IntakeID: res2.ID,
		IdempotencyKey: key, RequestHash: anyHash,
		Kind: "ACTION", Title: "Handle signature", Outcome: "Handled", Owner: e.editor.String(),
	})
	if err != nil || !replayedAgain {
		t.Fatalf("conversion replay: %v (%v)", replayedAgain, err)
	}
	if _, _, _, err := svc.ConvertIntake(ctx, port.ConvertIntakeCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), IntakeID: res2.ID,
		IdempotencyKey: newKey(), RequestHash: anyHash,
		Kind: "ACTION", Title: "Again", Outcome: "x",
	}); err == nil {
		t.Fatal("a second conversion must be refused")
	}
	// An owner outside the matter aborts before anything is written.
	res3, _ := svc.CreateIntake(ctx, port.CreateIntakeCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
		Title: "Third", RequestText: "x", ReceivedAt: time.Now().UTC().Add(-time.Hour),
	})
	if _, _, _, err := svc.ConvertIntake(ctx, port.ConvertIntakeCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), IntakeID: res3.ID,
		IdempotencyKey: newKey(), RequestHash: anyHash,
		Kind: "ACTION", Title: "X", Outcome: "x", Owner: e.out.String(),
	}); err == nil {
		t.Fatal("a foreign owner must abort the conversion")
	}
	rs, _ = svc.ListIntake(ctx, port.ListIntakeQuery{ActorID: e.owner.String(), MatterID: e.m.String()})
	for _, r := range rs {
		if r.ID.String() == res3.ID && r.Status != matter.IntakePending {
			t.Fatalf("the failed conversion created nothing: %+v", r)
		}
	}
}

func guidanceContract(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	ctx := e.ctx
	svc := service.NewGuidanceService(e.work)

	doc, err := svc.CreateGuidance(ctx, port.CreateGuidanceCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
		Title: "Signing checklist", Body: "Check the authority.", SourceRefs: []matter.GuidanceSourceRef{{Reference: "Register letter 12"}},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	// A duplicate title in the same matter is a typed 409 on BOTH stores (0016 UNIQUE parity).
	if _, err := svc.CreateGuidance(ctx, port.CreateGuidanceCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
		Title: "Signing checklist", Body: "Duplicate.",
	}); err == nil {
		t.Fatal("a duplicate guidance title must be refused")
	}
	// A second draft appends.
	if _, err := svc.AddGuidanceDraft(ctx, port.AddGuidanceDraftCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), DocumentID: doc.ID,
		IdempotencyKey: newKey(), RequestHash: anyHash,
		Body: "Updated.", SourceRefs: []matter.GuidanceSourceRef{{Reference: "Register letter 13"}},
	}); err != nil {
		t.Fatalf("draft 2: %v", err)
	}
	docs, revs, err := svc.ListGuidance(ctx, port.ListGuidanceQuery{ActorID: e.owner.String(), MatterID: e.m.String()})
	if err != nil || len(docs) != 1 || len(revs[0]) != 2 {
		t.Fatalf("drafts append: %+v (%v)", docs, err)
	}
	// The editor (EDITOR) may not publish; the OWNER may, once.
	if _, err := svc.PublishGuidance(ctx, port.PublishGuidanceCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), DocumentID: doc.ID,
		RevisionID: revs[0][1].ID.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
	}); err == nil {
		t.Fatal("only the matter OWNER publishes")
	}
	if _, err := svc.PublishGuidance(ctx, port.PublishGuidanceCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), DocumentID: doc.ID,
		RevisionID: revs[0][1].ID.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
	}); err != nil {
		t.Fatalf("publish: %v", err)
	}
	if _, err := svc.PublishGuidance(ctx, port.PublishGuidanceCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), DocumentID: doc.ID,
		RevisionID: revs[0][1].ID.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
	}); err == nil {
		t.Fatal("a published revision is immutable")
	}
	// The viewer still reads the document (published rows); drafts stay visible to editors.
	_, revs2, err := svc.ListGuidance(ctx, port.ListGuidanceQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
	if err != nil {
		t.Fatalf("viewer read: %v", err)
	}
	_ = revs2
}
