package postgres

// W5 PostgreSQL adapter: context records and their links to work items, written inside the locked
// matter transaction and read into the same snapshot as the work graph.

import (
	"context"
	"fmt"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var _ port.ContextTx = (*pgMatterTx)(nil)

func loadContext(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID) (matter.ContextSet, error) {
	var set matter.ContextSet
	rows, err := q.ListContextRecordsOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	links, err := q.ListContextLinksOfMatter(ctx, m.String())
	if err != nil {
		return set, mapMatterError(err)
	}
	for _, r := range rows {
		rec := matter.ContextRecord{
			ID: r.ID, MatterID: m, Kind: matter.ContextKind(r.Kind), Title: r.Title, Body: r.Body, Status: matter.ContextStatus(r.Status),
			ClosedReason: r.ClosedReason, CreatedBy: matter.ActorID(r.CreatedBy), CreatedAt: r.CreatedAt.UTC(), Revision: r.Revision,
		}
		for _, l := range links {
			if l.RecordID == r.ID {
				rec.Links = append(rec.Links, matter.NodeID(l.NodeID))
			}
		}
		set.Records = append(set.Records, rec)
	}
	return set, nil
}

func (t *pgMatterTx) writeContextLinks(ctx context.Context, r matter.ContextRecord) error {
	if err := t.q.DeleteContextLinks(ctx, r.ID); err != nil {
		return mapMatterError(err)
	}
	for _, l := range r.Links {
		if err := t.q.InsertContextLink(ctx, mcsqlc.InsertContextLinkParams{RecordID: r.ID, MatterID: r.MatterID.String(), NodeID: l.String()}); err != nil {
			return mapMatterError(err)
		}
	}
	return nil
}

func (t *pgMatterTx) InsertContextRecord(ctx context.Context, r matter.ContextRecord) error {
	if err := t.q.InsertContextRecord(ctx, mcsqlc.InsertContextRecordParams{
		ID: r.ID, MatterID: r.MatterID.String(), Kind: string(r.Kind), Title: r.Title, Body: r.Body, Status: string(r.Status),
		ClosedReason: r.ClosedReason, CreatedBy: r.CreatedBy.String(), CreatedAt: r.CreatedAt, Revision: r.Revision,
	}); err != nil {
		return mapMatterError(err)
	}
	return t.writeContextLinks(ctx, r)
}

func (t *pgMatterTx) SaveContextRecord(ctx context.Context, r matter.ContextRecord, expectedRevision int64) error {
	rows, err := t.q.UpdateContextRecord(ctx, mcsqlc.UpdateContextRecordParams{
		ID: r.ID, MatterID: r.MatterID.String(), Title: r.Title, Body: r.Body, Status: string(r.Status), ClosedReason: r.ClosedReason, ExpectedRevision: expectedRevision,
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("context record update: %w", port.ErrVersionConflict)
	}
	return t.writeContextLinks(ctx, r)
}
