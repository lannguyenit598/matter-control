package mattercontrol

// RLF-04 Saved Views (REQ-MC-P1-12) contract: private per-actor grid filter definitions with
// receipted creation, revision CAS and strict privacy. Runs on memory and PostgreSQL.

import (
	"errors"
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

// SuiteSavedViews runs the Saved Views contracts.
func SuiteSavedViews(t *testing.T, newBundle Factory) {
	t.Helper()
	t.Run("saved views private lifecycle", func(t *testing.T) { savedViewsLifecycle(t, newBundle) })
}

func savedViewsLifecycle(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	ctx := e.ctx
	svc := service.NewSavedViewService(e.work)

	// Create (receipted): a replay with the same key returns the same id without a second row.
	key := newKey()
	first, err := svc.CreateSavedView(ctx, port.CreateSavedViewCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: key, RequestHash: anyHash,
		Name: "My overdue", Filters: matter.SavedViewFilters{Kind: "ACTION", Timing: "OVERDUE"},
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	replay, err := svc.CreateSavedView(ctx, port.CreateSavedViewCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: key, RequestHash: anyHash,
		Name: "My overdue", Filters: matter.SavedViewFilters{Kind: "ACTION", Timing: "OVERDUE"},
	})
	if err != nil || !replay.Replayed || replay.ID != first.ID {
		t.Fatalf("replay returns the stored outcome: %+v vs %+v (%v)", replay, first, err)
	}
	if _, err := svc.CreateSavedView(ctx, port.CreateSavedViewCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: key, RequestHash: "0000000000000000000000000000000000000000000000000000000000000002",
		Name: "Other", Filters: matter.SavedViewFilters{},
	}); err == nil {
		t.Fatal("a different fingerprint on the same key must be reuse")
	}

	// Privacy: only the owner lists the view; another member and an outsider see nothing.
	own, err := svc.ListSavedViews(ctx, port.ListSavedViewsQuery{ActorID: e.editor.String(), MatterID: e.m.String()})
	if err != nil || len(own) != 1 || own[0].Name != "My overdue" || own[0].Filters.Timing != "OVERDUE" {
		t.Fatalf("owner sees exactly their view: %+v (%v)", own, err)
	}
	for name, who := range map[string]matter.ActorID{"viewer": e.viewer, "owner (not the view's owner)": e.owner, "outsider": e.out} {
		got, err := svc.ListSavedViews(ctx, port.ListSavedViewsQuery{ActorID: who.String(), MatterID: e.m.String()})
		// A non-member is the uniform 404; a member without own views gets an empty list.
		// Either way nothing of the owner's view is disclosed.
		if err != nil && !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("%s: unexpected error: %v", name, err)
		}
		if err == nil && len(got) != 0 {
			t.Fatalf("%s must not see the view: %+v", name, got)
		}
	}

	// Update under CAS; a stale revision is refused and nothing changes.
	updated, err := svc.UpdateSavedView(ctx, port.UpdateSavedViewCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), ViewID: first.ID, ExpectedRevision: 1,
		Name: "All overdue", Filters: matter.SavedViewFilters{},
	})
	if err != nil || updated.Revision != 2 || updated.Name != "All overdue" {
		t.Fatalf("update: %+v (%v)", updated, err)
	}
	if _, err := svc.UpdateSavedView(ctx, port.UpdateSavedViewCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), ViewID: first.ID, ExpectedRevision: 1,
		Name: "Stale", Filters: matter.SavedViewFilters{},
	}); err == nil {
		t.Fatal("a stale CAS must be refused")
	}
	// A member who is not the view's owner cannot change it — same uniform 404 as a stranger.
	if _, err := svc.UpdateSavedView(ctx, port.UpdateSavedViewCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), ViewID: first.ID, ExpectedRevision: 2,
		Name: "Steal", Filters: matter.SavedViewFilters{},
	}); err == nil {
		t.Fatal("a non-owner must not change the view")
	}

	// Delete under CAS; the view is gone afterwards.
	if err := svc.DeleteSavedView(ctx, port.DeleteSavedViewCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), ViewID: first.ID, ExpectedRevision: 2,
	}); err != nil {
		t.Fatalf("delete: %v", err)
	}
	own, err = svc.ListSavedViews(ctx, port.ListSavedViewsQuery{ActorID: e.editor.String(), MatterID: e.m.String()})
	if err != nil || len(own) != 0 {
		t.Fatalf("the view is gone: %+v (%v)", own, err)
	}
}
