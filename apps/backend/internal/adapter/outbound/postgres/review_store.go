package postgres

// PostgreSQL adapter for the manual review matrix: grids, their exact versions and questions, and
// append-only answers. Composite foreign keys keep every referenced version inside the grid's
// matter; the structure is revision-guarded and one answer can have at most one successor.

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgtype"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.ReviewTx       = (*pgMatterTx)(nil)
	_ port.ReviewSnapshot = (*pgSnapshot)(nil)
)

func reviewGridFromRow(row mcsqlc.ReviewGrid) matter.ReviewGrid {
	return matter.ReviewGrid{
		ID: row.ID, MatterID: matter.MatterID(row.MatterID), Name: row.Name, CreatedBy: matter.ActorID(row.CreatedBy),
		CreatedAt: row.CreatedAt.UTC(), Revision: row.Revision,
	}
}

// hydrateReviewGrids attaches the ordered version ids and questions of every grid of the matter.
func hydrateReviewGrids(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID, grids []matter.ReviewGrid) ([]matter.ReviewGrid, error) {
	if len(grids) == 0 {
		return grids, nil
	}
	versions, err := q.ListReviewGridVersionsOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	questions, err := q.ListReviewQuestionsOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	idx := map[string]int{}
	for i, g := range grids {
		idx[g.ID] = i
	}
	for _, v := range versions {
		if i, ok := idx[v.GridID]; ok {
			grids[i].VersionIDs = append(grids[i].VersionIDs, v.VersionID)
		}
	}
	for _, r := range questions {
		if i, ok := idx[r.GridID]; ok {
			grids[i].Questions = append(grids[i].Questions, matter.ReviewQuestion{
				ID: r.ID, Position: int(r.Position), Revision: int(r.Revision), Text: r.Text,
				RevisedBy: matter.ActorID(r.RevisedBy), RevisedAt: r.RevisedAt.UTC(),
			})
		}
	}
	return grids, nil
}

func loadReviewGrid(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID, id string) (matter.ReviewGrid, error) {
	row, err := q.GetReviewGrid(ctx, mcsqlc.GetReviewGridParams{MatterID: m.String(), ID: id})
	if err != nil {
		return matter.ReviewGrid{}, mapMatterError(err)
	}
	grids, err := hydrateReviewGrids(ctx, q, m, []matter.ReviewGrid{reviewGridFromRow(row)})
	if err != nil {
		return matter.ReviewGrid{}, err
	}
	return grids[0], nil
}

func listReviewGrids(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID) ([]matter.ReviewGrid, error) {
	rows, err := q.ListReviewGridsOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	grids := make([]matter.ReviewGrid, len(rows))
	for i, r := range rows {
		grids[i] = reviewGridFromRow(r)
	}
	return hydrateReviewGrids(ctx, q, m, grids)
}

func loadReviewAnswers(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID, gridID string) ([]matter.ReviewAnswer, error) {
	rows, err := q.ListReviewAnswersOfGrid(ctx, mcsqlc.ListReviewAnswersOfGridParams{MatterID: m.String(), GridID: gridID})
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.ReviewAnswer, len(rows))
	for i, r := range rows {
		sup := ""
		if p := uuidPtr(r.SupersedesID); p != nil {
			sup = p.String()
		}
		out[i] = matter.ReviewAnswer{
			ID: r.ID, GridID: r.GridID, VersionID: r.VersionID, QuestionID: r.QuestionID, QuestionRevision: int(r.QuestionRevision),
			State: matter.ReviewAnswerState(r.State), Text: r.Text, PageRef: r.PageRef, QuoteRef: r.QuoteRef,
			Author: matter.ActorID(r.Author), AnsweredAt: r.AnsweredAt.UTC(), SupersedesID: sup,
		}
	}
	return out, nil
}

// reviewAnswerPage reads one newest-first history page of one cell with a limit+1 keyset seek:
// recorded chronology (answered_at desc, id desc), strictly after the cursor when one is given.
func reviewAnswerPage(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID, gridID, versionID, questionID string, cursor *matter.ReviewAnswerCursor, limit int) (matter.ReviewAnswerPage, error) {
	size, err := int32Checked(limit + 1)
	if err != nil {
		return matter.ReviewAnswerPage{}, err
	}
	rows := make([]mcsqlc.ListReviewAnswersOfCellRow, 0, limit+1)
	if cursor == nil {
		first, err := q.ListReviewAnswersOfCellFirst(ctx, mcsqlc.ListReviewAnswersOfCellFirstParams{
			MatterID: m.String(), GridID: gridID, VersionID: versionID, QuestionID: questionID, PageLimit: size,
		})
		if err != nil {
			return matter.ReviewAnswerPage{}, mapMatterError(err)
		}
		for _, r := range first {
			rows = append(rows, mcsqlc.ListReviewAnswersOfCellRow(r))
		}
	} else {
		rows, err = q.ListReviewAnswersOfCell(ctx, mcsqlc.ListReviewAnswersOfCellParams{
			MatterID: m.String(), GridID: gridID, VersionID: versionID, QuestionID: questionID,
			CursorAt: cursor.AnsweredAt, CursorID: cursor.ID, PageLimit: size,
		})
		if err != nil {
			return matter.ReviewAnswerPage{}, mapMatterError(err)
		}
	}
	page := matter.ReviewAnswerPage{Items: make([]matter.ReviewAnswer, 0, len(rows))}
	for i, r := range rows {
		if i == limit { // the extra row only proves an older answer exists
			last := page.Items[limit-1]
			page.NextCursor = &matter.ReviewAnswerCursor{AnsweredAt: last.AnsweredAt, ID: last.ID}
			break
		}
		sup := ""
		if p := uuidPtr(r.SupersedesID); p != nil {
			sup = p.String()
		}
		page.Items = append(page.Items, matter.ReviewAnswer{
			ID: r.ID, GridID: r.GridID, VersionID: r.VersionID, QuestionID: r.QuestionID, QuestionRevision: int(r.QuestionRevision),
			State: matter.ReviewAnswerState(r.State), Text: r.Text, PageRef: r.PageRef, QuoteRef: r.QuoteRef,
			Author: matter.ActorID(r.Author), AnsweredAt: r.AnsweredAt.UTC(), SupersedesID: sup,
		})
	}
	return page, nil
}

func loadReviewQuestionHistory(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID, gridID string) ([]matter.ReviewQuestion, error) {
	rows, err := q.ListReviewQuestionRevisionsOfGrid(ctx, mcsqlc.ListReviewQuestionRevisionsOfGridParams{MatterID: m.String(), GridID: gridID})
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.ReviewQuestion, len(rows))
	for i, r := range rows {
		out[i] = matter.ReviewQuestion{ID: r.QuestionID, Revision: int(r.Revision), Text: r.Text, RevisedBy: matter.ActorID(r.RevisedBy), RevisedAt: r.RevisedAt.UTC()}
	}
	return out, nil
}

func reviewVersionRefs(ctx context.Context, q *mcsqlc.Queries, m matter.MatterID, ids []string) ([]matter.ReviewVersionRef, error) {
	if len(ids) == 0 {
		return nil, nil
	}
	rows, err := q.ListReviewVersionRefs(ctx, mcsqlc.ListReviewVersionRefsParams{MatterID: m.String(), Column2: ids})
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.ReviewVersionRef, len(rows))
	for i, r := range rows {
		out[i] = matter.ReviewVersionRef{VersionID: r.ID, DocumentID: r.DocumentID, DocumentName: r.DocumentName, Filename: r.Filename, No: int(r.VersionNo), Current: r.IsCurrent}
	}
	return out, nil
}

// ---- snapshot ----

func (s *pgSnapshot) LoadReviewGrid(ctx context.Context, m matter.MatterID, id string) (matter.ReviewGrid, error) {
	return loadReviewGrid(ctx, s.q, m, id)
}
func (s *pgSnapshot) ListReviewGrids(ctx context.Context, m matter.MatterID) ([]matter.ReviewGrid, error) {
	return listReviewGrids(ctx, s.q, m)
}
func (s *pgSnapshot) LoadReviewAnswers(ctx context.Context, m matter.MatterID, gridID string) ([]matter.ReviewAnswer, error) {
	return loadReviewAnswers(ctx, s.q, m, gridID)
}
func (s *pgSnapshot) ReviewAnswerPage(ctx context.Context, m matter.MatterID, gridID, versionID, questionID string, cursor *matter.ReviewAnswerCursor, limit int) (matter.ReviewAnswerPage, error) {
	return reviewAnswerPage(ctx, s.q, m, gridID, versionID, questionID, cursor, limit)
}
func (s *pgSnapshot) LoadReviewQuestionHistory(ctx context.Context, m matter.MatterID, gridID string) ([]matter.ReviewQuestion, error) {
	return loadReviewQuestionHistory(ctx, s.q, m, gridID)
}
func (s *pgSnapshot) ReviewVersionRefs(ctx context.Context, m matter.MatterID, ids []string) ([]matter.ReviewVersionRef, error) {
	return reviewVersionRefs(ctx, s.q, m, ids)
}

// ---- transaction ----

func (t *pgMatterTx) LoadReviewGrid(ctx context.Context, m matter.MatterID, id string) (matter.ReviewGrid, error) {
	return loadReviewGrid(ctx, t.q, m, id)
}
func (t *pgMatterTx) ListReviewGrids(ctx context.Context, m matter.MatterID) ([]matter.ReviewGrid, error) {
	return listReviewGrids(ctx, t.q, m)
}
func (t *pgMatterTx) LoadReviewAnswers(ctx context.Context, m matter.MatterID, gridID string) ([]matter.ReviewAnswer, error) {
	return loadReviewAnswers(ctx, t.q, m, gridID)
}
func (t *pgMatterTx) ReviewAnswerPage(ctx context.Context, m matter.MatterID, gridID, versionID, questionID string, cursor *matter.ReviewAnswerCursor, limit int) (matter.ReviewAnswerPage, error) {
	return reviewAnswerPage(ctx, t.q, m, gridID, versionID, questionID, cursor, limit)
}
func (t *pgMatterTx) LoadReviewQuestionHistory(ctx context.Context, m matter.MatterID, gridID string) ([]matter.ReviewQuestion, error) {
	return loadReviewQuestionHistory(ctx, t.q, m, gridID)
}
func (t *pgMatterTx) ReviewVersionRefs(ctx context.Context, m matter.MatterID, ids []string) ([]matter.ReviewVersionRef, error) {
	return reviewVersionRefs(ctx, t.q, m, ids)
}

func (t *pgMatterTx) InsertReviewGrid(ctx context.Context, g matter.ReviewGrid) error {
	if err := t.q.InsertReviewGrid(ctx, mcsqlc.InsertReviewGridParams{
		ID: g.ID, MatterID: g.MatterID.String(), Name: g.Name, CreatedBy: g.CreatedBy.String(), CreatedAt: g.CreatedAt, Revision: g.Revision,
	}); err != nil {
		return mapMatterError(err)
	}
	return t.writeReviewStructure(ctx, g)
}

func (t *pgMatterTx) SaveReviewGrid(ctx context.Context, g matter.ReviewGrid, expectedRevision int64) error {
	rows, err := t.q.UpdateReviewGrid(ctx, mcsqlc.UpdateReviewGridParams{ID: g.ID, MatterID: g.MatterID.String(), Name: g.Name, ExpectedRevision: expectedRevision})
	if err != nil {
		return mapMatterError(err)
	}
	if rows == 0 {
		return fmt.Errorf("review grid update: %w", port.ErrVersionConflict)
	}
	return t.writeReviewStructure(ctx, g)
}

// writeReviewStructure replaces the version set and stores the questions and any new revision.
func (t *pgMatterTx) writeReviewStructure(ctx context.Context, g matter.ReviewGrid) error {
	if err := t.q.DeleteReviewGridVersions(ctx, g.ID); err != nil {
		return mapMatterError(err)
	}
	for i, v := range g.VersionIDs {
		if err := t.q.InsertReviewGridVersion(ctx, mcsqlc.InsertReviewGridVersionParams{GridID: g.ID, MatterID: g.MatterID.String(), VersionID: v, Position: int32(i)}); err != nil { //nolint:gosec // bounded by MaxReviewVersions
			return mapMatterError(err)
		}
	}
	for _, q := range g.Questions {
		pos, err := int32Checked(q.Position)
		if err != nil {
			return err
		}
		rev, err := int32Checked(q.Revision)
		if err != nil {
			return err
		}
		if err := t.q.UpsertReviewQuestion(ctx, mcsqlc.UpsertReviewQuestionParams{
			ID: q.ID, MatterID: g.MatterID.String(), GridID: g.ID, Position: pos, Revision: rev, Text: q.Text,
			RevisedBy: q.RevisedBy.String(), RevisedAt: q.RevisedAt,
		}); err != nil {
			return mapMatterError(err)
		}
		if err := t.q.InsertReviewQuestionRevision(ctx, mcsqlc.InsertReviewQuestionRevisionParams{
			QuestionID: q.ID, Revision: rev, Text: q.Text, RevisedBy: q.RevisedBy.String(), RevisedAt: q.RevisedAt,
		}); err != nil {
			return mapMatterError(err)
		}
	}
	return nil
}

func (t *pgMatterTx) InsertReviewAnswer(ctx context.Context, a matter.ReviewAnswer) error {
	var sup pgtype.UUID
	if a.SupersedesID != "" {
		sup = uuidString(a.SupersedesID)
	}
	rev, err := int32Checked(a.QuestionRevision)
	if err != nil {
		return err
	}
	// The transaction's own matter binds the answer; the composite keys reject a foreign grid, version or question.
	err = t.q.InsertReviewAnswer(ctx, mcsqlc.InsertReviewAnswerParams{
		ID: a.ID, MatterID: t.header.MatterID.String(), GridID: a.GridID, VersionID: a.VersionID, QuestionID: a.QuestionID, QuestionRevision: rev,
		State: string(a.State), Text: a.Text, PageRef: a.PageRef, QuoteRef: a.QuoteRef, Author: a.Author.String(), AnsweredAt: a.AnsweredAt, SupersedesID: sup,
	})
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) && pgErr.Code == uniqueViolation && pgErr.ConstraintName == "review_answers_supersedes_id_key" {
		return fmt.Errorf("review answer: %w", port.ErrVersionConflict)
	}
	return mapMatterError(err)
}
