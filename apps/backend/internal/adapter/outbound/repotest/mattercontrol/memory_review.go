package mattercontrol

// Review matrix memory-store extension, with the same constraints the PostgreSQL schema enforces:
// versions must belong to the grid's matter, a revision CAS guards the structure, answers are
// append-only and no two answers may supersede the same one.

import (
	"context"
	"fmt"
	"sort"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.ReviewTx       = (*memTx)(nil)
	_ port.ReviewSnapshot = (*memSnapshot)(nil)
)

func (s *Store) reviewGrid(m matter.MatterID, id string) (matter.ReviewGrid, error) {
	g, ok := s.reviewGrids[id]
	if !ok || g.MatterID != m {
		return matter.ReviewGrid{}, fmt.Errorf("review grid: %w", port.ErrNotFound)
	}
	g.VersionIDs = append([]string(nil), g.VersionIDs...)
	g.Questions = append([]matter.ReviewQuestion(nil), g.Questions...)
	return g, nil
}

func (s *Store) reviewGridList(m matter.MatterID) []matter.ReviewGrid {
	var out []matter.ReviewGrid
	for _, g := range s.reviewGrids {
		if g.MatterID == m {
			g.VersionIDs = append([]string(nil), g.VersionIDs...)
			g.Questions = append([]matter.ReviewQuestion(nil), g.Questions...)
			out = append(out, g)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID > out[j].ID })
	return out
}

func (s *Store) reviewAnswersOf(m matter.MatterID, gridID string) []matter.ReviewAnswer {
	var out []matter.ReviewAnswer
	if g, ok := s.reviewGrids[gridID]; !ok || g.MatterID != m {
		return nil
	}
	for _, a := range s.reviewAnswers {
		if a.GridID == gridID {
			out = append(out, a)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out
}

// reviewAnswerPageOf seeks one newest-first page of one cell: recorded chronology
// (AnsweredAt desc) with the unique id as tie-break, strictly after the cursor, limit+1 rows so
// the caller can tell whether an older answer exists.
func (s *Store) reviewAnswerPageOf(m matter.MatterID, gridID, versionID, questionID string, cursor *matter.ReviewAnswerCursor, limit int) matter.ReviewAnswerPage {
	var cell []matter.ReviewAnswer
	if g, ok := s.reviewGrids[gridID]; ok && g.MatterID == m {
		for _, a := range s.reviewAnswers {
			if a.GridID == gridID && a.VersionID == versionID && a.QuestionID == questionID {
				cell = append(cell, a)
			}
		}
	}
	sort.Slice(cell, func(i, j int) bool {
		if !cell[i].AnsweredAt.Equal(cell[j].AnsweredAt) {
			return cell[i].AnsweredAt.After(cell[j].AnsweredAt)
		}
		return cell[i].ID > cell[j].ID
	})
	if cursor != nil {
		at := cursor.AnsweredAt
		id := cursor.ID
		seek := 0
		for seek < len(cell) {
			a := cell[seek]
			if a.AnsweredAt.Before(at) || (a.AnsweredAt.Equal(at) && a.ID < id) {
				break
			}
			seek++
		}
		cell = cell[seek:]
	}
	page := matter.ReviewAnswerPage{}
	if len(cell) > limit {
		page.Items = cell[:limit]
		last := cell[limit-1]
		page.NextCursor = &matter.ReviewAnswerCursor{AnsweredAt: last.AnsweredAt, ID: last.ID}
	} else {
		page.Items = cell
	}
	return page
}

func (s *Store) reviewQuestionHistory(m matter.MatterID, gridID string) []matter.ReviewQuestion {
	if g, ok := s.reviewGrids[gridID]; !ok || g.MatterID != m {
		return nil
	}
	var out []matter.ReviewQuestion
	for _, q := range s.reviewQuestionRevs {
		if q.gridID == gridID {
			out = append(out, q.q)
		}
	}
	// Oldest first by the instant the revision was written; ids and revisions break exact ties.
	sort.SliceStable(out, func(i, j int) bool {
		if !out[i].RevisedAt.Equal(out[j].RevisedAt) {
			return out[i].RevisedAt.Before(out[j].RevisedAt)
		}
		if out[i].ID != out[j].ID {
			return out[i].ID < out[j].ID
		}
		return out[i].Revision < out[j].Revision
	})
	return out
}

func (s *Store) reviewVersionRefs(m matter.MatterID, ids []string) []matter.ReviewVersionRef {
	var out []matter.ReviewVersionRef
	for _, id := range ids {
		v, ok := s.versions[matter.VersionID(id)]
		if !ok || v.MatterID != m {
			continue
		}
		d := s.documents[v.DocumentID]
		out = append(out, matter.ReviewVersionRef{
			VersionID: id, DocumentID: v.DocumentID.String(), DocumentName: d.Name, Filename: v.Filename, No: v.No,
			Current: d.CurrentVersionID != nil && *d.CurrentVersionID == v.ID,
		})
	}
	return out
}

// ---- snapshot reads ----

func (s *memSnapshot) LoadReviewGrid(_ context.Context, m matter.MatterID, id string) (matter.ReviewGrid, error) {
	return s.state.reviewGrid(m, id)
}
func (s *memSnapshot) ListReviewGrids(_ context.Context, m matter.MatterID) ([]matter.ReviewGrid, error) {
	return s.state.reviewGridList(m), nil
}
func (s *memSnapshot) LoadReviewAnswers(_ context.Context, m matter.MatterID, gridID string) ([]matter.ReviewAnswer, error) {
	return s.state.reviewAnswersOf(m, gridID), nil
}
func (s *memSnapshot) ReviewAnswerPage(_ context.Context, m matter.MatterID, gridID, versionID, questionID string, cursor *matter.ReviewAnswerCursor, limit int) (matter.ReviewAnswerPage, error) {
	return s.state.reviewAnswerPageOf(m, gridID, versionID, questionID, cursor, limit), nil
}
func (s *memSnapshot) LoadReviewQuestionHistory(_ context.Context, m matter.MatterID, gridID string) ([]matter.ReviewQuestion, error) {
	return s.state.reviewQuestionHistory(m, gridID), nil
}
func (s *memSnapshot) ReviewVersionRefs(_ context.Context, m matter.MatterID, ids []string) ([]matter.ReviewVersionRef, error) {
	return s.state.reviewVersionRefs(m, ids), nil
}

// ---- transaction ----

func (t *memTx) LoadReviewGrid(_ context.Context, m matter.MatterID, id string) (matter.ReviewGrid, error) {
	return t.store.reviewGrid(m, id)
}
func (t *memTx) ListReviewGrids(_ context.Context, m matter.MatterID) ([]matter.ReviewGrid, error) {
	return t.store.reviewGridList(m), nil
}
func (t *memTx) LoadReviewAnswers(_ context.Context, m matter.MatterID, gridID string) ([]matter.ReviewAnswer, error) {
	return t.store.reviewAnswersOf(m, gridID), nil
}
func (t *memTx) ReviewAnswerPage(_ context.Context, m matter.MatterID, gridID, versionID, questionID string, cursor *matter.ReviewAnswerCursor, limit int) (matter.ReviewAnswerPage, error) {
	return t.store.reviewAnswerPageOf(m, gridID, versionID, questionID, cursor, limit), nil
}
func (t *memTx) LoadReviewQuestionHistory(_ context.Context, m matter.MatterID, gridID string) ([]matter.ReviewQuestion, error) {
	return t.store.reviewQuestionHistory(m, gridID), nil
}
func (t *memTx) ReviewVersionRefs(_ context.Context, m matter.MatterID, ids []string) ([]matter.ReviewVersionRef, error) {
	return t.store.reviewVersionRefs(m, ids), nil
}

func (t *memTx) checkReviewVersions(g matter.ReviewGrid) error {
	for _, id := range g.VersionIDs {
		if v, ok := t.store.versions[matter.VersionID(id)]; !ok || v.MatterID != g.MatterID {
			return fmt.Errorf("memory: review version %s is not a version of this matter", id)
		}
	}
	return nil
}

func (t *memTx) storeQuestionRevisions(g matter.ReviewGrid) {
	for _, q := range g.Questions {
		known := false
		for _, r := range t.store.reviewQuestionRevs {
			known = known || (r.gridID == g.ID && r.q.ID == q.ID && r.q.Revision == q.Revision)
		}
		if !known {
			t.store.reviewQuestionRevs = append(t.store.reviewQuestionRevs, reviewQuestionRev{gridID: g.ID, q: q})
		}
	}
}

func (t *memTx) InsertReviewGrid(_ context.Context, g matter.ReviewGrid) error {
	if _, dup := t.store.reviewGrids[g.ID]; dup {
		return fmt.Errorf("memory: review grid %s exists", g.ID)
	}
	if err := t.checkReviewVersions(g); err != nil {
		return err
	}
	t.store.reviewGrids[g.ID] = g
	t.storeQuestionRevisions(g)
	return nil
}

func (t *memTx) SaveReviewGrid(_ context.Context, g matter.ReviewGrid, expectedRevision int64) error {
	cur, ok := t.store.reviewGrids[g.ID]
	if !ok || cur.MatterID != g.MatterID || cur.Revision != expectedRevision {
		return fmt.Errorf("review grid update: %w", port.ErrVersionConflict)
	}
	if err := t.checkReviewVersions(g); err != nil {
		return err
	}
	g.Revision = expectedRevision + 1
	t.store.reviewGrids[g.ID] = g
	t.storeQuestionRevisions(g)
	return nil
}

func (t *memTx) InsertReviewAnswer(_ context.Context, a matter.ReviewAnswer) error {
	g, ok := t.store.reviewGrids[a.GridID]
	if !ok {
		return fmt.Errorf("memory: review grid %s: %w", a.GridID, port.ErrNotFound)
	}
	if v, ok := t.store.versions[matter.VersionID(a.VersionID)]; !ok || v.MatterID != g.MatterID {
		return fmt.Errorf("memory: review answer version %s is not a version of this matter", a.VersionID)
	}
	if a.SupersedesID != "" {
		for _, other := range t.store.reviewAnswers {
			if other.SupersedesID == a.SupersedesID {
				return fmt.Errorf("review answer: %w", port.ErrVersionConflict)
			}
		}
	}
	t.store.reviewAnswers = append(t.store.reviewAnswers, a)
	return nil
}

// reviewQuestionRev is one stored revision of a question, with the grid it belongs to.
type reviewQuestionRev struct {
	gridID string
	q      matter.ReviewQuestion
}
