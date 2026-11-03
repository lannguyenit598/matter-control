package postgres

// RLF-04 PostgreSQL adapter for saved views: private per-actor grid filter definitions written
// inside the locked matter transaction and read in the same snapshot as the work graph.

import (
	"context"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.SavedViewSnapshot = (*pgSnapshot)(nil)
	_ port.SavedViewTx       = (*pgMatterTx)(nil)
)

func savedViewFromRow(r mcsqlc.SavedView) matter.SavedView {
	f, _ := matter.ParseSavedViewFilters(r.Filters) // stored shape is written only by this service
	return matter.SavedView{
		ID: matter.SavedViewID(r.ID), MatterID: matter.MatterID(r.MatterID), OwnerID: matter.ActorID(r.OwnerID),
		Name: r.Name, Filters: f, CreatedAt: r.CreatedAt.UTC(), UpdatedAt: r.UpdatedAt.UTC(), Revision: r.Revision,
	}
}

func (s *pgSnapshot) ListSavedViews(ctx context.Context, m matter.MatterID, owner matter.ActorID) ([]matter.SavedView, error) {
	rows, err := s.q.ListSavedViewsOfMatter(ctx, mcsqlc.ListSavedViewsOfMatterParams{MatterID: m.String(), OwnerID: owner.String()})
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.SavedView, 0, len(rows))
	for _, r := range rows {
		out = append(out, savedViewFromRow(r))
	}
	return out, nil
}

func (t *pgMatterTx) ListSavedViews(ctx context.Context, m matter.MatterID, owner matter.ActorID) ([]matter.SavedView, error) {
	rows, err := t.q.ListSavedViewsOfMatter(ctx, mcsqlc.ListSavedViewsOfMatterParams{MatterID: m.String(), OwnerID: owner.String()})
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.SavedView, 0, len(rows))
	for _, r := range rows {
		out = append(out, savedViewFromRow(r))
	}
	return out, nil
}

func (t *pgMatterTx) InsertSavedView(ctx context.Context, v matter.SavedView, filters []byte) error {
	return mapMatterError(t.q.InsertSavedView(ctx, mcsqlc.InsertSavedViewParams{
		ID: v.ID.String(), MatterID: v.MatterID.String(), OwnerID: v.OwnerID.String(), Name: v.Name,
		Filters: filters, CreatedAt: v.CreatedAt, UpdatedAt: v.UpdatedAt, Revision: v.Revision,
	}))
}

func (t *pgMatterTx) SaveSavedView(ctx context.Context, v matter.SavedView, expectedRevision int64, filters []byte) error {
	rows, err := t.q.UpdateSavedView(ctx, mcsqlc.UpdateSavedViewParams{
		ID: v.ID.String(), MatterID: v.MatterID.String(), OwnerID: v.OwnerID.String(), Name: v.Name,
		Filters: filters, UpdatedAt: v.UpdatedAt, ExpectedRevision: expectedRevision,
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return port.ErrPreconditionFailed
	}
	return nil
}

func (t *pgMatterTx) DeleteSavedView(ctx context.Context, v matter.SavedView, expectedRevision int64) error {
	rows, err := t.q.DeleteSavedView(ctx, mcsqlc.DeleteSavedViewParams{
		ID: v.ID.String(), MatterID: v.MatterID.String(), OwnerID: v.OwnerID.String(), ExpectedRevision: expectedRevision,
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return port.ErrPreconditionFailed
	}
	return nil
}
