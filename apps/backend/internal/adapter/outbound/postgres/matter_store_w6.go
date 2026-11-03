package postgres

// W6 data-operations store extension: brief replay reads (DataOpsSnapshot) and the
// RULE-014 import-source registry (importRegistry) over the pg matter transaction.

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgtype"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// EventsWindow returns the matter's events with recorded_at in (t1, t2], ordered by
// (recorded_at, seq), including after payloads when present.
func (s *pgSnapshot) EventsWindow(ctx context.Context, m matter.MatterID, t1, t2 time.Time) ([]matter.EventRecord, error) {
	rows, err := s.q.PageEventsWindow(ctx, mcsqlc.PageEventsWindowParams{
		MatterID: m.String(), RecordedAt: t1, RecordedAt_2: t2,
	})
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.EventRecord, 0, len(rows))
	for _, r := range rows {
		out = append(out, eventRecordFromRow(r.MatterID, r.Seq, r.ID, r.Type, r.SchemaVersion,
			r.ActorKind, r.ActorID, r.TargetKind, r.TargetID, r.EffectiveAt, r.RecordedAt,
			r.CauseSeq, r.CorrelationID, r.CommandKey, r.Reason, r.Before, r.After))
	}
	return out, nil
}

// EventsUpTo returns every matter event with recorded_at ≤ t2 ordered by (recorded_at, seq): the
// brief's outstanding-at-t2 replay input.
func (s *pgSnapshot) EventsUpTo(ctx context.Context, m matter.MatterID, t2 time.Time) ([]matter.EventRecord, error) {
	rows, err := s.q.EventsUpTo(ctx, mcsqlc.EventsUpToParams{MatterID: m.String(), RecordedAt: t2})
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.EventRecord, 0, len(rows))
	for _, r := range rows {
		out = append(out, eventRecordFromRow(r.MatterID, r.Seq, r.ID, r.Type, r.SchemaVersion,
			r.ActorKind, r.ActorID, r.TargetKind, r.TargetID, r.EffectiveAt, r.RecordedAt,
			r.CauseSeq, r.CorrelationID, r.CommandKey, r.Reason, r.Before, r.After))
	}
	return out, nil
}

// eventRecordFromRow maps one generated domain_events row into the read record.
func eventRecordFromRow(matterID string, seq int64, id, typ string, schemaVersion int32,
	actorKind string, actorID pgtype.UUID, targetKind, targetID string,
	effectiveAt, recordedAt time.Time, causeSeq pgtype.Int8, correlationID, commandKey pgtype.UUID,
	reason pgtype.Text, before, after []byte) matter.EventRecord {
	return matter.EventRecord{
		MatterID: matter.MatterID(matterID), Seq: seq, ID: id, Type: typ,
		SchemaVersion: int(schemaVersion), ActorKind: actorKind,
		ActorID: uuidStringPtrW6(actorID), TargetKind: targetKind, TargetID: targetID,
		EffectiveAt: effectiveAt.UTC(), RecordedAt: recordedAt.UTC(),
		CauseSeq: int64PtrW6(causeSeq), CorrelationID: uuidStringPtrW6(correlationID),
		CommandKey: uuidStringPtrW6(commandKey), Reason: textPtrW6(reason),
		Before: before, After: after,
	}
}

// uuidStringPtrW6 maps a nullable uuid to a string pointer.
func uuidStringPtrW6(v pgtype.UUID) *string {
	if !v.Valid {
		return nil
	}
	s := v.String()
	return &s
}

// int64PtrW6 maps a nullable bigint to an int64 pointer.
func int64PtrW6(v pgtype.Int8) *int64 {
	if !v.Valid {
		return nil
	}
	n := v.Int64
	return &n
}

// textPtrW6 maps a nullable text to a string pointer.
func textPtrW6(v pgtype.Text) *string {
	if !v.Valid {
		return nil
	}
	s := v.String
	return &s
}

// DataOpsSnapshot marker: pgSnapshot satisfies the W6 read capability.
var _ port.DataOpsSnapshot = (*pgSnapshot)(nil)

// FindImportSource reads the RULE-014 registry row (ErrNotFound when absent).
func (t *pgMatterTx) FindImportSource(ctx context.Context, matterID matter.MatterID, sourceName, rowKey string) (*matter.ImportSource, error) {
	row, err := t.q.FindImportSource(ctx, mcsqlc.FindImportSourceParams{
		MatterID: matterID.String(), SourceName: sourceName, RowKey: rowKey,
	})
	if err != nil {
		return nil, mapMatterError(err)
	}
	return &matter.ImportSource{
		MatterID: matter.MatterID(row.MatterID), SourceName: row.SourceName, RowKey: row.RowKey,
		ItemID: row.ItemID, ContentHash: row.ContentHash, FirstImportedAt: row.FirstImportedAt.UTC(),
	}, nil
}

// RegisterImportSource inserts the registry row in the same transaction as the import.
func (t *pgMatterTx) RegisterImportSource(ctx context.Context, m matter.ImportSource) error {
	return mapMatterError(t.q.RegisterImportSource(ctx, mcsqlc.RegisterImportSourceParams{
		MatterID: m.MatterID.String(), SourceName: m.SourceName, RowKey: m.RowKey,
		ItemID: m.ItemID, ContentHash: m.ContentHash, FirstImportedAt: m.FirstImportedAt,
	}))
}

var _ port.ImportRegistry = (*pgMatterTx)(nil)

var _ = pgtype.Timestamptz{} // pgtype retained for future W6 reads
