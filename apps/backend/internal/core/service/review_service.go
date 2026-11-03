package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

// ReviewService implements the manual review matrix: grids of exact document versions and
// versioned questions with append-only, cited human answers. It reuses the central command gate
// (membership, OWNER/EDITOR for writes, hidden resources, audit) and never touches verification.
type ReviewService struct{ w *WorkService }

var _ port.ReviewService = (*ReviewService)(nil)

func NewReviewService(w *WorkService) *ReviewService { return &ReviewService{w: w} }

func reviewTx(env *workEnv) (port.ReviewTx, error) {
	t, ok := env.g.(port.ReviewTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support review grids")
	}
	return t, nil
}

func reviewSnap(snap port.MatterSnapshot) (port.ReviewSnapshot, error) {
	s, ok := snap.(port.ReviewSnapshot)
	if !ok {
		return nil, fmt.Errorf("snapshot does not support review grids")
	}
	return s, nil
}

// gridSnapshot is what history keeps of a grid: structure only, never answer text.
func gridSnapshot(g matter.ReviewGrid) map[string]any {
	qs := make([]map[string]any, len(g.Questions))
	for i, q := range g.Questions {
		qs[i] = map[string]any{"id": q.ID, "revision": q.Revision}
	}
	return map[string]any{"name": g.Name, "versions": append([]string{}, g.VersionIDs...), "questions": qs, "revision": g.Revision}
}

func (s *ReviewService) CreateGrid(ctx context.Context, cmd port.CreateReviewGridCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_REVIEW_GRID", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := reviewTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			g, err := matter.NewReviewGrid(env.ids.NewRecordID(), matterID, cmd.Name, env.actor, env.tCmd)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			if err := tx.InsertReviewGrid(ctx, g); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "review.grid_created", "REVIEW_GRID", g.ID, "", nil, gridSnapshot(g), nil)
			return matter.CreatedResult{Kind: "REVIEW_GRID", ID: g.ID, Seq: seq}, err
		})
		return err
	})
	return out, err
}

// mutateGrid runs one revision-guarded structure change. apply edits the grid in place and reports
// whether anything changed; an unchanged grid writes no event and keeps its revision.
func (s *ReviewService) mutateGrid(ctx context.Context, actorID, matterIDStr, gridID string, expected int64, op, event string,
	apply func(env *workEnv, tx port.ReviewTx, g *matter.ReviewGrid) (bool, error),
) (matter.ReviewGrid, error) {
	matterID, err := matter.NewMatterID(matterIDStr)
	if err != nil {
		return matter.ReviewGrid{}, err
	}
	gid, err := matter.ParseReviewID(gridID, "gridId")
	if err != nil {
		return matter.ReviewGrid{}, err
	}
	var out matter.ReviewGrid
	err = s.w.execute(ctx, actorID, matterIDStr, op, policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := reviewTx(env)
		if err != nil {
			return err
		}
		cur, err := tx.LoadReviewGrid(ctx, matterID, gid)
		if err != nil {
			return err
		}
		if expected == 0 {
			return port.ErrPreconditionRequired
		}
		if cur.Revision != expected {
			return port.ErrPreconditionFailed
		}
		next := cur
		next.VersionIDs = append([]string(nil), cur.VersionIDs...)
		next.Questions = append([]matter.ReviewQuestion(nil), cur.Questions...)
		changed, err := apply(env, tx, &next)
		if err != nil {
			return err
		}
		if !changed {
			out = cur
			return nil
		}
		if err := tx.SaveReviewGrid(ctx, next, cur.Revision); err != nil {
			return err
		}
		next.Revision = cur.Revision + 1
		if _, err := env.emit(ctx, event, "REVIEW_GRID", cur.ID, "", gridSnapshot(cur), gridSnapshot(next), nil); err != nil {
			return err
		}
		out = next
		return nil
	})
	return out, err
}

func (s *ReviewService) AddGridVersion(ctx context.Context, cmd port.ReviewVersionCmd) (matter.ReviewGrid, error) {
	return s.mutateGrid(ctx, cmd.ActorID, cmd.MatterID, cmd.GridID, cmd.ExpectedRevision, "ADD_REVIEW_VERSION", "review.version_added",
		func(env *workEnv, tx port.ReviewTx, g *matter.ReviewGrid) (bool, error) {
			unknown := rejected("unknown-version", "that document version does not exist in this matter")
			vid, err := matter.ParseReviewID(cmd.VersionID, "versionId")
			if err != nil {
				return false, unknown
			}
			for _, have := range g.VersionIDs {
				if have == vid {
					return false, rejected("duplicate-version", "that version is already in this grid")
				}
			}
			if len(g.VersionIDs) >= matter.MaxReviewVersions {
				return false, rejected("too-many-versions", "a grid holds at most 50 versions")
			}
			// Missing and other-matter versions are indistinguishable: only this matter's rows come back.
			refs, err := tx.ReviewVersionRefs(ctx, g.MatterID, []string{vid})
			if err != nil {
				return false, err
			}
			if len(refs) != 1 || refs[0].VersionID != vid {
				return false, unknown
			}
			g.VersionIDs = append(g.VersionIDs, vid)
			return true, nil
		})
}

func (s *ReviewService) RemoveGridVersion(ctx context.Context, cmd port.ReviewVersionCmd) (matter.ReviewGrid, error) {
	return s.mutateGrid(ctx, cmd.ActorID, cmd.MatterID, cmd.GridID, cmd.ExpectedRevision, "REMOVE_REVIEW_VERSION", "review.version_removed",
		func(_ *workEnv, _ port.ReviewTx, g *matter.ReviewGrid) (bool, error) {
			for i, have := range g.VersionIDs {
				if have == cmd.VersionID {
					g.VersionIDs = append(g.VersionIDs[:i:i], g.VersionIDs[i+1:]...)
					return true, nil
				}
			}
			return false, rejected("not-in-grid", "that version is not in this grid")
		})
}

func (s *ReviewService) AddQuestion(ctx context.Context, cmd port.AddReviewQuestionCmd) (matter.ReviewGrid, error) {
	return s.mutateGrid(ctx, cmd.ActorID, cmd.MatterID, cmd.GridID, cmd.ExpectedRevision, "ADD_REVIEW_QUESTION", "review.question_added",
		func(env *workEnv, _ port.ReviewTx, g *matter.ReviewGrid) (bool, error) {
			if len(g.Questions) >= matter.MaxReviewQuestions {
				return false, rejected("too-many-questions", "a grid holds at most 25 questions")
			}
			q, err := matter.NewReviewQuestion(env.ids.NewRecordID(), len(g.Questions), cmd.Text, env.actor, env.tCmd)
			if err != nil {
				return false, err
			}
			g.Questions = append(g.Questions, q)
			return true, nil
		})
}

func (s *ReviewService) ReviseQuestion(ctx context.Context, cmd port.ReviseReviewQuestionCmd) (matter.ReviewGrid, error) {
	return s.mutateGrid(ctx, cmd.ActorID, cmd.MatterID, cmd.GridID, cmd.ExpectedRevision, "REVISE_REVIEW_QUESTION", "review.question_revised",
		func(env *workEnv, _ port.ReviewTx, g *matter.ReviewGrid) (bool, error) {
			for i, q := range g.Questions {
				if q.ID != cmd.QuestionID {
					continue
				}
				checked, err := matter.NewReviewQuestion(q.ID, q.Position, cmd.Text, env.actor, env.tCmd)
				if err != nil {
					return false, err
				}
				if checked.Text == q.Text {
					return false, nil // same wording: no revision, answers stay current
				}
				checked.Revision = q.Revision + 1
				g.Questions[i] = checked
				return true, nil
			}
			return false, port.ErrNotFound
		})
}

func (s *ReviewService) RecordAnswer(ctx context.Context, cmd port.RecordReviewAnswerCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	gid, err := matter.ParseReviewID(cmd.GridID, "gridId")
	if err != nil {
		return matter.CreatedResult{}, err
	}
	vid, err := matter.ParseReviewID(cmd.VersionID, "versionId")
	if err != nil {
		return matter.CreatedResult{}, err
	}
	qid, err := matter.ParseReviewID(cmd.QuestionID, "questionId")
	if err != nil {
		return matter.CreatedResult{}, err
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "RECORD_REVIEW_ANSWER", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := reviewTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			g, err := tx.LoadReviewGrid(ctx, matterID, gid)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			var q *matter.ReviewQuestion
			for i := range g.Questions {
				if g.Questions[i].ID == qid {
					q = &g.Questions[i]
				}
			}
			inGrid := false
			for _, have := range g.VersionIDs {
				inGrid = inGrid || have == vid
			}
			if q == nil || !inGrid {
				return matter.CreatedResult{}, rejected("not-in-grid", "the version and question must both belong to this grid")
			}
			if cmd.ExpectedQuestionRevision == 0 {
				return matter.CreatedResult{}, port.ErrPreconditionRequired
			}
			if cmd.ExpectedQuestionRevision != q.Revision {
				return matter.CreatedResult{}, port.ErrPreconditionFailed
			}
			answers, err := tx.LoadReviewAnswers(ctx, matterID, gid)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			current := ""
			for _, c := range matter.BuildReviewCells(g, answers) {
				if c.VersionID == vid && c.QuestionID == qid && c.Answer != nil {
					current = c.Answer.ID
				}
			}
			// F01: an absent expectation is a missing precondition, never an explicit "none";
			// the caller must state the answer it saw (or "" for an observed empty cell).
			if cmd.ExpectedAnswerID == nil {
				return matter.CreatedResult{}, port.ErrPreconditionRequired
			}
			if *cmd.ExpectedAnswerID != current {
				return matter.CreatedResult{}, port.ErrPreconditionFailed
			}
			a, err := matter.NewReviewAnswer(env.ids.NewRecordID(), g.ID, vid, *q, matter.ReviewAnswerState(strings.TrimSpace(cmd.State)),
				cmd.Text, cmd.PageRef, cmd.QuoteRef, env.actor, env.tCmd, current)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			if err := tx.InsertReviewAnswer(ctx, a); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "review.answer_recorded", "REVIEW_GRID", g.ID, "", nil,
				map[string]any{"answerId": a.ID, "versionId": vid, "questionId": qid, "questionRevision": a.QuestionRevision, "state": string(a.State)}, nil)
			return matter.CreatedResult{Kind: "REVIEW_ANSWER", ID: a.ID, Seq: seq}, err
		})
		return err
	})
	return out, err
}

func (s *ReviewService) ListGrids(ctx context.Context, q port.MatterListQuery) ([]matter.ReviewGrid, error) {
	matterID, err := matter.NewMatterID(q.MatterID)
	if err != nil {
		return nil, err
	}
	var out []matter.ReviewGrid
	err = s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, _ int64) error {
		rs, err := reviewSnap(snap)
		if err != nil {
			return err
		}
		out, err = rs.ListReviewGrids(ctx, matterID)
		return err
	})
	return out, err
}

func (s *ReviewService) GetGrid(ctx context.Context, q port.GetReviewGridQuery) (matter.ReviewGridView, error) {
	matterID, err := matter.NewMatterID(q.MatterID)
	if err != nil {
		return matter.ReviewGridView{}, err
	}
	gid, err := matter.ParseReviewID(q.GridID, "gridId")
	if err != nil {
		return matter.ReviewGridView{}, err
	}
	var out matter.ReviewGridView
	err = s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, asOf time.Time, _ int64) error {
		rs, err := reviewSnap(snap)
		if err != nil {
			return err
		}
		g, err := rs.LoadReviewGrid(ctx, matterID, gid)
		if err != nil {
			return err
		}
		answers, err := rs.LoadReviewAnswers(ctx, matterID, gid)
		if err != nil {
			return err
		}
		history, err := rs.LoadReviewQuestionHistory(ctx, matterID, gid)
		if err != nil {
			return err
		}
		refs, err := rs.ReviewVersionRefs(ctx, matterID, g.VersionIDs)
		if err != nil {
			return err
		}
		byID := map[string]matter.ReviewVersionRef{}
		for _, r := range refs {
			byID[r.VersionID] = r
		}
		versions := make([]matter.ReviewVersionRef, 0, len(g.VersionIDs))
		for _, id := range g.VersionIDs {
			if r, ok := byID[id]; ok {
				versions = append(versions, r)
			}
		}
		out = matter.ReviewGridView{Grid: g, Versions: versions, Cells: matter.BuildReviewCells(g, answers), QuestionHistory: history, AsOf: asOf, Revision: g.Revision}
		return nil
	})
	return out, err
}

func (s *ReviewService) AnswerHistory(ctx context.Context, q port.ReviewHistoryQuery) (matter.ReviewAnswerPage, error) {
	limit := q.Limit
	if limit == 0 {
		limit = matter.MaxReviewHistory
	}
	if limit < 0 || limit > matter.MaxReviewHistory {
		return matter.ReviewAnswerPage{}, rejected("limit", "limit must be between 1 and 100")
	}
	matterID, err := matter.NewMatterID(q.MatterID)
	if err != nil {
		return matter.ReviewAnswerPage{}, err
	}
	gid, err := matter.ParseReviewID(q.GridID, "gridId")
	if err != nil {
		return matter.ReviewAnswerPage{}, err
	}
	vid, err := matter.ParseReviewID(q.VersionID, "versionId")
	if err != nil {
		return matter.ReviewAnswerPage{}, err
	}
	qid, err := matter.ParseReviewID(q.QuestionID, "questionId")
	if err != nil {
		return matter.ReviewAnswerPage{}, err
	}
	var out matter.ReviewAnswerPage
	err = s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, _ int64) error {
		rs, err := reviewSnap(snap)
		if err != nil {
			return err
		}
		// The grid read is the authorization anchor: a hidden or foreign grid is a uniform
		// not-found before any paging happens. The cursor is only a seek position.
		if _, err := rs.LoadReviewGrid(ctx, matterID, gid); err != nil {
			return err
		}
		out, err = rs.ReviewAnswerPage(ctx, matterID, gid, vid, qid, q.Cursor, limit)
		return err
	})
	return out, err
}
