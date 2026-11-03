package port

import (
	"context"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Saved Views (RLF-04, REQ-MC-P1-12) ----------

// ListSavedViewsQuery lists the caller's OWN views of one Matter. Another member's views are
// never visible: sharing does not exist.
type ListSavedViewsQuery struct {
	ActorID  string
	MatterID string
}

// CreateSavedViewCmd creates one view owned by the caller. Receipted: an unknown outcome may be
// retried with the SAME key (§2.1).
type CreateSavedViewCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	Name           string
	Filters        matter.SavedViewFilters
}

// UpdateSavedViewCmd renames/edits one view. Owner-of-view only, CAS on the view revision.
type UpdateSavedViewCmd struct {
	ActorID          string
	MatterID         string
	ViewID           string
	ExpectedRevision int64
	Name             string
	Filters          matter.SavedViewFilters
}

// DeleteSavedViewCmd removes one view. Owner-of-view only, CAS on the view revision.
type DeleteSavedViewCmd struct {
	ActorID          string
	MatterID         string
	ViewID           string
	ExpectedRevision int64
}

// SavedViewSnapshot reads saved views inside one matter snapshot.
type SavedViewSnapshot interface {
	// ListSavedViews returns the caller's own views of the matter, ordered by (name, id).
	ListSavedViews(ctx context.Context, m matter.MatterID, owner matter.ActorID) ([]matter.SavedView, error)
}

// SavedViewTx writes saved views inside the locked matter transaction. The filters bytes are
// the already-validated typed shape, serialized by the service.
type SavedViewTx interface {
	InsertSavedView(ctx context.Context, v matter.SavedView, filters []byte) error
	SaveSavedView(ctx context.Context, v matter.SavedView, expectedRevision int64, filters []byte) error
	DeleteSavedView(ctx context.Context, v matter.SavedView, expectedRevision int64) error
	ListSavedViews(ctx context.Context, m matter.MatterID, owner matter.ActorID) ([]matter.SavedView, error)
}

// SavedViewService defines the Saved Views use cases.
type SavedViewService interface {
	ListSavedViews(ctx context.Context, q ListSavedViewsQuery) ([]matter.SavedView, error)
	CreateSavedView(ctx context.Context, cmd CreateSavedViewCmd) (matter.CreatedResult, error)
	UpdateSavedView(ctx context.Context, cmd UpdateSavedViewCmd) (matter.SavedView, error)
	DeleteSavedView(ctx context.Context, cmd DeleteSavedViewCmd) error
}
