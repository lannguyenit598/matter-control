package postgres

// RLF-06 + RLF-07 PostgreSQL adapter: intake records and versioned guidance, written inside the
// locked matter transaction and read in the same snapshot as the work graph.

import (
	"context"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.IntakeSnapshot   = (*pgSnapshot)(nil)
	_ port.IntakeTx         = (*pgMatterTx)(nil)
	_ port.GuidanceSnapshot = (*pgSnapshot)(nil)
	_ port.GuidanceTx       = (*pgMatterTx)(nil)
)

func intakeFromRow(r mcsqlc.IntakeRecord) matter.IntakeRecord {
	var atts []string
	_ = json.Unmarshal(r.Attachments, &atts) // stored only by the service
	out := matter.IntakeRecord{
		ID: matter.IntakeID(r.ID), MatterID: matter.MatterID(r.MatterID), Title: r.Title,
		RequestText: r.RequestText, Requester: r.Requester, ReceivedAt: r.ReceivedAt.UTC(),
		Attachments: atts, Status: matter.IntakeStatus(r.Status), TriageReason: r.TriageReason,
		RecordedBy: matter.ActorID(r.RecordedBy), CreatedAt: r.CreatedAt.UTC(), Revision: r.Revision,
	}
	if r.TriagedBy.Valid {
		a := matter.ActorID(uuid.UUID(r.TriagedBy.Bytes).String())
		out.TriagedBy = &a
	}
	if r.TriagedAt.Valid {
		t := r.TriagedAt.Time.UTC()
		out.TriagedAt = &t
	}
	if r.ItemID.Valid {
		n := matter.NodeID(uuid.UUID(r.ItemID.Bytes).String())
		out.ItemID = &n
	}
	return out
}

func (s *pgSnapshot) ListIntakeRecords(ctx context.Context, m matter.MatterID) ([]matter.IntakeRecord, error) {
	rows, err := s.q.ListIntakeRecordsOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.IntakeRecord, 0, len(rows))
	for _, r := range rows {
		out = append(out, intakeFromRow(r))
	}
	return out, nil
}

func (t *pgMatterTx) ListIntakeRecords(ctx context.Context, m matter.MatterID) ([]matter.IntakeRecord, error) {
	rows, err := t.q.ListIntakeRecordsOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.IntakeRecord, 0, len(rows))
	for _, r := range rows {
		out = append(out, intakeFromRow(r))
	}
	return out, nil
}

func (t *pgMatterTx) InsertIntakeRecord(ctx context.Context, r matter.IntakeRecord) error {
	atts, err := json.Marshal(r.Attachments)
	if err != nil {
		return err
	}
	return mapMatterError(t.q.InsertIntakeRecord(ctx, mcsqlc.InsertIntakeRecordParams{
		ID: r.ID.String(), MatterID: r.MatterID.String(), Title: r.Title, RequestText: r.RequestText,
		Requester: r.Requester, ReceivedAt: r.ReceivedAt, Attachments: atts,
		RecordedBy: r.RecordedBy.String(), CreatedAt: r.CreatedAt,
	}))
}

func (t *pgMatterTx) LoadIntakeRecord(ctx context.Context, m matter.MatterID, id matter.IntakeID) (matter.IntakeRecord, error) {
	r, err := t.q.GetIntakeRecord(ctx, mcsqlc.GetIntakeRecordParams{ID: id.String(), MatterID: m.String()})
	if err != nil {
		return matter.IntakeRecord{}, mapMatterError(err)
	}
	return intakeFromRow(r), nil
}

func (t *pgMatterTx) SaveIntakeRecord(ctx context.Context, r matter.IntakeRecord, expectedRevision int64) error {
	params := mcsqlc.SaveIntakeRecordParams{
		ID: r.ID.String(), MatterID: r.MatterID.String(), Status: string(r.Status),
		TriageReason: r.TriageReason, ExpectedRevision: expectedRevision,
	}
	if r.TriagedBy != nil {
		params.TriagedBy = uuidString(r.TriagedBy.String())
	}
	if r.TriagedAt != nil {
		params.TriagedAt = pgtype.Timestamptz{Time: *r.TriagedAt, Valid: true}
	}
	if r.ItemID != nil {
		params.ItemID = uuidString(r.ItemID.String())
	}
	rows, err := t.q.SaveIntakeRecord(ctx, params)
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return port.ErrPreconditionFailed
	}
	return nil
}

func (s *pgSnapshot) ListGuidanceDocuments(ctx context.Context, m matter.MatterID) ([]matter.GuidanceDocument, error) {
	rows, err := s.q.ListGuidanceDocumentsOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.GuidanceDocument, 0, len(rows))
	for _, r := range rows {
		out = append(out, guidanceDocFromRow(r))
	}
	return out, nil
}

func guidanceDocFromRow(r mcsqlc.GuidanceDocument) matter.GuidanceDocument {
	return matter.GuidanceDocument{
		ID: matter.GuidanceDocumentID(r.ID), MatterID: matter.MatterID(r.MatterID), Title: r.Title,
		CreatedBy: matter.ActorID(r.CreatedBy), CreatedAt: r.CreatedAt.UTC(), Revision: r.Revision,
	}
}

func (s *pgSnapshot) ListGuidanceRevisions(ctx context.Context, m matter.MatterID) ([]matter.GuidanceRevision, error) {
	rows, err := s.q.ListGuidanceRevisionsOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.GuidanceRevision, 0, len(rows))
	for _, r := range rows {
		g, err := guidanceRevFromRow(r)
		if err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, nil
}

func guidanceRevFromRow(r mcsqlc.GuidanceRevision) (matter.GuidanceRevision, error) {
	refs, err := matter.ParseGuidanceSourceRefs(r.SourceRefs)
	if err != nil {
		return matter.GuidanceRevision{}, err
	}
	out := matter.GuidanceRevision{
		ID: matter.GuidanceRevisionID(r.ID), DocumentID: matter.GuidanceDocumentID(r.DocumentID),
		MatterID: matter.MatterID(r.MatterID), No: r.No, Body: r.Body, SourceRefs: refs,
		Status: r.Status, CreatedBy: matter.ActorID(r.CreatedBy), CreatedAt: r.CreatedAt.UTC(),
	}
	if r.PublishedBy.Valid {
		a := matter.ActorID(uuid.UUID(r.PublishedBy.Bytes).String())
		out.PublishedBy = &a
	}
	if r.PublishedAt.Valid {
		t := r.PublishedAt.Time.UTC()
		out.PublishedAt = &t
	}
	return out, nil
}

func (t *pgMatterTx) ListGuidanceRevisions(ctx context.Context, m matter.MatterID) ([]matter.GuidanceRevision, error) {
	rows, err := t.q.ListGuidanceRevisionsOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.GuidanceRevision, 0, len(rows))
	for _, r := range rows {
		g, err := guidanceRevFromRow(r)
		if err != nil {
			return nil, err
		}
		out = append(out, g)
	}
	return out, nil
}

func (t *pgMatterTx) ListGuidanceDocuments(ctx context.Context, m matter.MatterID) ([]matter.GuidanceDocument, error) {
	rows, err := t.q.ListGuidanceDocumentsOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.GuidanceDocument, 0, len(rows))
	for _, r := range rows {
		out = append(out, guidanceDocFromRow(r))
	}
	return out, nil
}

func (t *pgMatterTx) InsertGuidanceDocument(ctx context.Context, d matter.GuidanceDocument) error {
	return mapMatterError(t.q.InsertGuidanceDocument(ctx, mcsqlc.InsertGuidanceDocumentParams{
		ID: d.ID.String(), MatterID: d.MatterID.String(), Title: d.Title, CreatedBy: d.CreatedBy.String(), CreatedAt: d.CreatedAt,
	}))
}

func (t *pgMatterTx) InsertGuidanceRevision(ctx context.Context, r matter.GuidanceRevision, refs []byte) error {
	return mapMatterError(t.q.InsertGuidanceRevision(ctx, mcsqlc.InsertGuidanceRevisionParams{
		ID: r.ID.String(), DocumentID: r.DocumentID.String(), MatterID: r.MatterID.String(), No: r.No,
		Body: r.Body, SourceRefs: refs, Status: r.Status, CreatedBy: r.CreatedBy.String(), CreatedAt: r.CreatedAt,
	}))
}

func (t *pgMatterTx) PublishGuidanceRevision(ctx context.Context, docID matter.GuidanceDocumentID, revID matter.GuidanceRevisionID, m matter.MatterID, by matter.ActorID, at time.Time) error {
	rows, err := t.q.PublishGuidanceRevision(ctx, mcsqlc.PublishGuidanceRevisionParams{
		ID: revID.String(), MatterID: m.String(), PublishedBy: uuidString(by.String()),
		PublishedAt: pgtype.Timestamptz{Time: at, Valid: true},
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return port.ErrPreconditionFailed
	}
	_ = docID
	return nil
}

func (t *pgMatterTx) LoadGuidanceRevision(ctx context.Context, m matter.MatterID, id matter.GuidanceRevisionID) (matter.GuidanceRevision, error) {
	r, err := t.q.GetGuidanceRevision(ctx, mcsqlc.GetGuidanceRevisionParams{ID: id.String(), MatterID: m.String()})
	if err != nil {
		return matter.GuidanceRevision{}, mapMatterError(err)
	}
	return guidanceRevFromRow(r)
}

func (t *pgMatterTx) MaxGuidanceRevisionNo(ctx context.Context, docID matter.GuidanceDocumentID) (int64, error) {
	return t.q.MaxGuidanceRevisionNo(ctx, docID.String())
}
