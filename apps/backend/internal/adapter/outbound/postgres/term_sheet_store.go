package postgres

// MC-ZCODE-TERMSHEET-01 PostgreSQL adapter for contract term lines: typed facts about one
// contract document version, imported under content-hash idempotency; promotion records only
// the link to the draft the fact operationalized.

import (
	"context"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.TermLineSnapshot  = (*pgSnapshot)(nil)
	_ port.MatterTermSheetTx = (*pgMatterTx)(nil)
)

// termRefFromPg reads a nullable UUID reference into the domain's empty-string-means-absent form.
func termRefFromPg(u pgtype.UUID) string {
	if !u.Valid {
		return ""
	}
	return uuid.UUID(u.Bytes).String()
}

func termLineFromRow(r mcsqlc.ContractTermLine) matter.TermLine {
	return matter.TermLine{
		ID:                matter.TermLineID(r.ID),
		MatterID:          matter.MatterID(r.MatterID),
		DocumentVersionID: matter.VersionID(r.DocumentVersionID),
		Field:             matter.TermField(r.Field),
		ValueText:         r.ValueText.String,
		ValueDate:         timestamptzPtr(r.ValueDate),
		RowKey:            r.RowKey,
		SourceHash:        r.ContentHash,
		PromotedRef:       termRefFromPg(r.PromotedRef),
		PromotedKind:      matter.TermPromotionKind(r.PromotedKind.String),
		PromotedAt:        timestamptzPtr(r.PromotedAt),
		ImportedBy:        matter.ActorID(r.ImportedBy),
		CreatedAt:         r.CreatedAt.UTC(),
		UpdatedAt:         r.UpdatedAt.UTC(),
		Revision:          r.Revision,
	}
}

func (s *pgSnapshot) ListTermLines(ctx context.Context, m matter.MatterID) ([]matter.TermLine, error) {
	rows, err := s.q.ListTermLinesOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.TermLine, 0, len(rows))
	for _, r := range rows {
		out = append(out, termLineFromRow(r))
	}
	return out, nil
}

// matter tx

func (t *pgMatterTx) ListTermLines(ctx context.Context, m matter.MatterID) ([]matter.TermLine, error) {
	rows, err := t.q.ListTermLinesOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.TermLine, 0, len(rows))
	for _, r := range rows {
		out = append(out, termLineFromRow(r))
	}
	return out, nil
}

func (t *pgMatterTx) LoadTermLine(ctx context.Context, m matter.MatterID, id matter.TermLineID) (matter.TermLine, error) {
	r, err := t.q.GetTermLine(ctx, mcsqlc.GetTermLineParams{ID: id.String(), MatterID: m.String()})
	if err != nil {
		return matter.TermLine{}, mapMatterError(err)
	}
	return termLineFromRow(r), nil
}

// ReplaceTermLinesOfDocumentVersion deletes the version's lines and inserts the parsed set in
// the same transaction: the import is atomic per document version (design §2.2).
func (t *pgMatterTx) ReplaceTermLinesOfDocumentVersion(ctx context.Context, m matter.MatterID, documentVersionID matter.VersionID, lines []matter.TermLine) error {
	if err := mapMatterError(t.q.DeleteTermLinesOfDocumentVersion(ctx, mcsqlc.DeleteTermLinesOfDocumentVersionParams{
		MatterID: m.String(), DocumentVersionID: documentVersionID.String(),
	})); err != nil {
		return err
	}
	for _, l := range lines {
		if err := mapMatterError(t.q.InsertTermLine(ctx, mcsqlc.InsertTermLineParams{
			ID: l.ID.String(), MatterID: l.MatterID.String(), DocumentVersionID: l.DocumentVersionID.String(),
			Field: l.Field.String(), ValueText: pgText(l.ValueText), ValueDate: timestamptzVal(l.ValueDate),
			RowKey: l.RowKey, ContentHash: l.SourceHash,
			PromotedRef: uuidString(l.PromotedRef), PromotedKind: pgText(l.PromotedKind.String()),
			PromotedAt: timestamptzVal(l.PromotedAt), ImportedBy: l.ImportedBy.String(),
			CreatedAt: l.CreatedAt, UpdatedAt: l.UpdatedAt, Revision: l.Revision,
		})); err != nil {
			return err
		}
	}
	return nil
}

func (t *pgMatterTx) MarkTermLinePromoted(ctx context.Context, m matter.MatterID, id matter.TermLineID, ref string, kind matter.TermPromotionKind, at time.Time) error {
	rows, err := t.q.MarkTermLinePromoted(ctx, mcsqlc.MarkTermLinePromotedParams{
		ID: id.String(), MatterID: m.String(), PromotedRef: uuidString(ref), PromotedKind: pgText(kind.String()), PromotedAt: timestamptzVal(&at),
	})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 { // same outcome as the memory double: the line is gone
		return mapMatterError(pgx.ErrNoRows)
	}
	return nil
}
