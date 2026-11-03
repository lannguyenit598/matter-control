package mattercontrol

// Shared review-matrix contract: grid structure with revision CAS, exact versions that can only
// belong to the grid's matter, append-only answers with a single successor, question history and
// access rules. It runs unchanged against the in-memory double and the PostgreSQL adapter.

import (
	"errors"
	"fmt"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

type reviewFx struct {
	e  *w2Env
	rv *service.ReviewService
}

func newReviewFx(t *testing.T, newBundle Factory) reviewFx {
	e := newW2Env(t, newBundle)
	return reviewFx{e: e, rv: service.NewReviewService(e.work)}
}

func (f reviewFx) grid(actor matter.ActorID, name string) matter.ReviewGridView {
	f.e.t.Helper()
	res, err := f.rv.CreateGrid(f.e.ctx, port.CreateReviewGridCmd{ActorID: actor.String(), MatterID: f.e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Name: name})
	if err != nil {
		f.e.t.Fatalf("create grid: %v", err)
	}
	return f.view(f.e.owner, res.ID)
}

func (f reviewFx) view(actor matter.ActorID, id string) matter.ReviewGridView {
	f.e.t.Helper()
	v, err := f.rv.GetGrid(f.e.ctx, port.GetReviewGridQuery{ActorID: actor.String(), MatterID: f.e.m.String(), GridID: id})
	if err != nil {
		f.e.t.Fatalf("get grid: %v", err)
	}
	return v
}

func (f reviewFx) addVersion(g matter.ReviewGrid, versionID string) (matter.ReviewGrid, error) {
	return f.rv.AddGridVersion(f.e.ctx, port.ReviewVersionCmd{ActorID: f.e.editor.String(), MatterID: f.e.m.String(), GridID: g.ID, VersionID: versionID, ExpectedRevision: g.Revision})
}

func (f reviewFx) addQuestion(g matter.ReviewGrid, text string) (matter.ReviewGrid, error) {
	return f.rv.AddQuestion(f.e.ctx, port.AddReviewQuestionCmd{ActorID: f.e.editor.String(), MatterID: f.e.m.String(), GridID: g.ID, Text: text, ExpectedRevision: g.Revision})
}

func (f reviewFx) answer(g matter.ReviewGrid, version, question, expected, text string) (matter.CreatedResult, error) {
	rev := 0
	for _, q := range g.Questions {
		if q.ID == question {
			rev = q.Revision
		}
	}
	return f.rv.RecordAnswer(f.e.ctx, port.RecordReviewAnswerCmd{
		ExpectedQuestionRevision: rev,
		ActorID:                  f.e.editor.String(), MatterID: f.e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, GridID: g.ID,
		VersionID: version, QuestionID: question, ExpectedAnswerID: &expected, State: "REVIEWED", Text: text, PageRef: "7", QuoteRef: "as written",
	})
}

// versionIn uploads a document version into matter m (owner-written) and returns its id.
func (f reviewFx) versionIn(m matter.MatterID, name, sum string) string {
	f.e.t.Helper()
	d, err := f.e.ev.CreateDocument(f.e.ctx, port.CreateDocumentCmd{ActorID: f.e.owner.String(), MatterID: m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Name: name})
	if err != nil {
		f.e.t.Fatal(err)
	}
	v, err := f.e.ev.AddVersion(f.e.ctx, port.AddVersionCmd{ActorID: f.e.owner.String(), MatterID: m.String(), DocumentID: d.ID, IdempotencyKey: newKey(), RequestHash: anyHash,
		Filename: name + ".pdf", MediaType: "application/pdf", Ref: port.ObjectRef{SHA256: sum, Size: 10}})
	if err != nil {
		f.e.t.Fatalf("add version: %v", err)
	}
	return v.ID
}

const (
	reviewSumA = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
	reviewSumB = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
)

// SuiteReview runs the review-matrix contract against any Bundle whose Store supports ReviewTx.
func SuiteReview(t *testing.T, newBundle Factory) {
	t.Helper()

	t.Run("grid round trip: exact versions, questions, a cited answer and its row labels", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		v := f.versionIn(f.e.m, "Share purchase agreement", reviewSumA)
		g := f.grid(f.e.editor, "Change of control").Grid
		g, err := f.addVersion(g, v)
		if err != nil {
			t.Fatal(err)
		}
		g, err = f.addQuestion(g, "Is there a change-of-control clause?")
		if err != nil {
			t.Fatal(err)
		}
		res, err := f.answer(g, v, g.Questions[0].ID, "", "Clause 12.3")
		if err != nil || res.Kind != "REVIEW_ANSWER" {
			t.Fatalf("answer: %+v %v", res, err)
		}
		view := f.view(f.e.viewer, g.ID)
		if len(view.Versions) != 1 || view.Versions[0].DocumentName != "Share purchase agreement" || view.Versions[0].No != 1 || view.Versions[0].Filename != "Share purchase agreement.pdf" {
			t.Fatalf("version rows: %+v", view.Versions)
		}
		c := view.Cells[0]
		if c.Answer == nil || c.Answer.Text != "Clause 12.3" || c.Answer.PageRef != "7" || c.Answer.QuoteRef != "as written" || c.Answer.Author != f.e.editor || c.Stale || c.Pending {
			t.Fatalf("cell: %+v", c)
		}
		if view.Revision != g.Revision+0 || view.Grid.Revision != g.Revision {
			t.Fatalf("revision: %d vs %d", view.Revision, g.Revision)
		}
		list, err := f.rv.ListGrids(f.e.ctx, port.MatterListQuery{ActorID: f.e.viewer.String(), MatterID: f.e.m.String()})
		if err != nil || len(list) != 1 || list[0].ID != g.ID {
			t.Fatalf("list: %+v %v", list, err)
		}
	})

	t.Run("a version of another matter and a missing id are rejected identically", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		w1 := w1Env{t: t, ws: f.e.ws, ctx: f.e.ctx}
		other := w1.mustMatter(f.e.owner, f.e.wsID, "Other").MatterID
		foreign := f.versionIn(other, "Foreign", reviewSumB)
		g := f.grid(f.e.editor, "Grid").Grid
		_, errCross := f.addVersion(g, foreign)
		_, errMissing := f.addVersion(g, "01a17c8f-15d0-7386-8133-c1625313f6d1")
		mustCode(t, "cross-matter version", errCross, "unknown-version")
		mustCode(t, "missing version", errMissing, "unknown-version")
		var a, b *matter.RejectedError
		if !errors.As(errCross, &a) || !errors.As(errMissing, &b) || a.Message != b.Message {
			t.Fatalf("outcomes differ: %v / %v", errCross, errMissing)
		}
		if got := f.view(f.e.owner, g.ID).Grid; len(got.VersionIDs) != 0 || got.Revision != g.Revision {
			t.Fatalf("a rejection wrote something: %+v", got)
		}
	})

	t.Run("structure changes are revision guarded and a conflict writes nothing", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		g := f.grid(f.e.editor, "Grid").Grid
		stale := g
		g, err := f.addQuestion(g, "First?")
		if err != nil {
			t.Fatal(err)
		}
		if _, err := f.addQuestion(stale, "Second?"); !errors.Is(err, port.ErrPreconditionFailed) {
			t.Fatalf("stale revision: %v", err)
		}
		stale.Revision = 0
		if _, err := f.addQuestion(stale, "Second?"); !errors.Is(err, port.ErrPreconditionRequired) {
			t.Fatalf("no revision: %v", err)
		}
		if got := f.view(f.e.owner, g.ID).Grid; len(got.Questions) != 1 || got.Revision != g.Revision {
			t.Fatalf("conflicts wrote: %+v", got)
		}
	})

	t.Run("answers chain, a stale expectation conflicts, and only one answer may succeed another", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		v := f.versionIn(f.e.m, "SPA", reviewSumA)
		g := f.grid(f.e.editor, "Grid").Grid
		g, _ = f.addVersion(g, v)
		g, _ = f.addQuestion(g, "Q?")
		q := g.Questions[0].ID
		first, err := f.answer(g, v, q, "", "one")
		if err != nil {
			t.Fatal(err)
		}
		if _, err := f.answer(g, v, q, "", "again"); !errors.Is(err, port.ErrPreconditionFailed) {
			t.Fatalf("expecting none after an answer: %v", err)
		}
		second, err := f.answer(g, v, q, first.ID, "two")
		if err != nil {
			t.Fatal(err)
		}
		hist, err := f.rv.AnswerHistory(f.e.ctx, port.ReviewHistoryQuery{ActorID: f.e.viewer.String(), MatterID: f.e.m.String(), GridID: g.ID, VersionID: v, QuestionID: q})
		if err != nil || len(hist.Items) != 2 || hist.Items[0].ID != second.ID || hist.Items[1].ID != first.ID {
			t.Fatalf("history: %+v %v", hist, err)
		}
		// The store itself refuses a second successor of the same answer.
		err = f.e.b.Store.Execute(f.e.ctx, f.e.m, func(tx port.MatterTx) error {
			rt, ok := tx.(port.ReviewTx)
			if !ok {
				return errors.New("store does not implement port.ReviewTx")
			}
			branch := hist.Items[0]
			branch.ID = newKey()
			branch.SupersedesID = first.ID
			return rt.InsertReviewAnswer(f.e.ctx, branch)
		})
		if !errors.Is(err, port.ErrVersionConflict) {
			t.Fatalf("a branching answer must conflict, got %v", err)
		}
	})

	t.Run("revising a question stales only its answers and keeps the old wording readable", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		v := f.versionIn(f.e.m, "SPA", reviewSumA)
		g := f.grid(f.e.editor, "Grid").Grid
		g, _ = f.addVersion(g, v)
		g, _ = f.addQuestion(g, "Original wording?")
		g, _ = f.addQuestion(g, "Other?")
		for _, q := range g.Questions {
			if _, err := f.answer(g, v, q.ID, "", "x"); err != nil {
				t.Fatal(err)
			}
		}
		if _, err := f.rv.ReviseQuestion(f.e.ctx, port.ReviseReviewQuestionCmd{ActorID: f.e.editor.String(), MatterID: f.e.m.String(), GridID: g.ID, QuestionID: g.Questions[0].ID, Text: "New wording?", ExpectedRevision: g.Revision}); err != nil {
			t.Fatal(err)
		}
		view := f.view(f.e.viewer, g.ID)
		if !view.Cells[0].Stale || view.Cells[1].Stale || view.Cells[0].Answer == nil {
			t.Fatalf("cells: %+v", view.Cells)
		}
		texts := map[string]bool{}
		for _, q := range view.QuestionHistory {
			texts[q.Text] = true
		}
		if !texts["Original wording?"] || !texts["New wording?"] || !texts["Other?"] || len(view.QuestionHistory) != 3 {
			t.Fatalf("history: %+v", view.QuestionHistory)
		}
	})

	t.Run("an answer to wording the writer never saw is refused and writes nothing", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		v := f.versionIn(f.e.m, "SPA", reviewSumA)
		g := f.grid(f.e.editor, "Grid").Grid
		g, _ = f.addVersion(g, v)
		g, _ = f.addQuestion(g, "Original wording?")
		seen := g // the writer opened the cell at wording 1
		if _, err := f.rv.ReviseQuestion(f.e.ctx, port.ReviseReviewQuestionCmd{ActorID: f.e.editor.String(), MatterID: f.e.m.String(), GridID: g.ID, QuestionID: g.Questions[0].ID, Text: "New wording?", ExpectedRevision: g.Revision}); err != nil {
			t.Fatal(err)
		}
		if _, err := f.answer(seen, v, seen.Questions[0].ID, "", "late"); !errors.Is(err, port.ErrPreconditionFailed) {
			t.Fatalf("stale wording: %v", err)
		}
		if c := f.view(f.e.viewer, g.ID).Cells[0]; c.Answer != nil || !c.Pending {
			t.Fatalf("the refused answer was stored: %+v", c)
		}
		if _, err := f.rv.RecordAnswer(f.e.ctx, port.RecordReviewAnswerCmd{ActorID: f.e.editor.String(), MatterID: f.e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, GridID: g.ID, VersionID: v, QuestionID: g.Questions[0].ID, State: "ABSENT"}); !errors.Is(err, port.ErrPreconditionRequired) {
			t.Fatalf("no revision: %v", err)
		}
	})

	t.Run("removing a version hides its row but keeps its answers attributable", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		v := f.versionIn(f.e.m, "SPA", reviewSumA)
		g := f.grid(f.e.editor, "Grid").Grid
		g, _ = f.addVersion(g, v)
		g, _ = f.addQuestion(g, "Q?")
		if _, err := f.answer(g, v, g.Questions[0].ID, "", "kept"); err != nil {
			t.Fatal(err)
		}
		g, err := f.rv.RemoveGridVersion(f.e.ctx, port.ReviewVersionCmd{ActorID: f.e.editor.String(), MatterID: f.e.m.String(), GridID: g.ID, VersionID: v, ExpectedRevision: g.Revision})
		if err != nil || len(g.VersionIDs) != 0 {
			t.Fatalf("remove: %+v %v", g, err)
		}
		if view := f.view(f.e.viewer, g.ID); len(view.Cells) != 0 || len(view.Versions) != 0 {
			t.Fatalf("row still shown: %+v", view)
		}
		hist, err := f.rv.AnswerHistory(f.e.ctx, port.ReviewHistoryQuery{ActorID: f.e.viewer.String(), MatterID: f.e.m.String(), GridID: g.ID, VersionID: v, QuestionID: g.Questions[0].ID})
		if err != nil || len(hist.Items) != 1 || hist.Items[0].Text != "kept" {
			t.Fatalf("history after removal: %+v %v", hist, err)
		}
		g, err = f.addVersion(g, v)
		if err != nil {
			t.Fatal(err)
		}
		if c := f.view(f.e.viewer, g.ID).Cells[0]; c.Answer == nil || c.Answer.Text != "kept" {
			t.Fatalf("re-added row lost its answer: %+v", c)
		}
	})

	t.Run("history pages stay truthful when an answer is recorded between pages", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		v := f.versionIn(f.e.m, "SPA", reviewSumA)
		g := f.grid(f.e.editor, "Grid").Grid
		g, _ = f.addVersion(g, v)
		g, _ = f.addQuestion(g, "Q?")
		q := g.Questions[0].ID
		var ids []string
		expected := ""
		for i := 0; i < 3; i++ {
			res, err := f.answer(g, v, q, expected, fmt.Sprintf("answer %d", i))
			if err != nil {
				t.Fatal(err)
			}
			ids = append(ids, res.ID)
			expected = res.ID
		}
		page := func(cursor *matter.ReviewAnswerCursor) matter.ReviewAnswerPage {
			p, err := f.rv.AnswerHistory(f.e.ctx, port.ReviewHistoryQuery{ActorID: f.e.viewer.String(), MatterID: f.e.m.String(), GridID: g.ID, VersionID: v, QuestionID: q, Limit: 2, Cursor: cursor})
			if err != nil {
				t.Fatal(err)
			}
			return p
		}
		p1 := page(nil)
		if len(p1.Items) != 2 || p1.NextCursor == nil {
			t.Fatalf("page one: %+v", p1)
		}
		// A new answer lands while the reader is between pages: later pages anchored to the
		// cursor keep the already-ordered older rows; a fresh page one shows the newcomer.
		res, err := f.answer(g, v, q, ids[len(ids)-1], "inserted between pages")
		if err != nil {
			t.Fatal(err)
		}
		p2 := page(p1.NextCursor)
		if len(p2.Items) != 1 || p2.Items[0].ID != ids[0] || p2.NextCursor != nil {
			t.Fatalf("page two must finish the anchored trail: %+v", p2)
		}
		fresh := page(nil)
		if len(fresh.Items) != 2 || fresh.Items[0].ID != res.ID {
			t.Fatalf("a fresh page one must show the new answer first: %+v", fresh)
		}
	})

	t.Run("history order is recorded chronology, not the id byte order", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		v := f.versionIn(f.e.m, "SPA", reviewSumA)
		g := f.grid(f.e.editor, "Grid").Grid
		g, _ = f.addVersion(g, v)
		g, _ = f.addQuestion(g, "Q?")
		q := g.Questions[0].ID
		now := time.Now()
		// Recorded oldest → newest, but the later answers carry lexically smaller ids (clock
		// skew). The history must follow the recorded instants with the id as tie-break only.
		seeded := []struct {
			id string
			at time.Time
		}{
			{"ffffffff-0000-7000-8000-000000000003", now.Add(-time.Minute)}, // recorded first, largest id
			{"00000000-0000-7000-8000-000000000002", now},                   // recorded second, smallest id
			{"0fffffff-0000-7000-8000-000000000001", now},                   // recorded last, middle id, same instant
		}
		err := f.e.b.Store.Execute(f.e.ctx, f.e.m, func(tx port.MatterTx) error {
			rt, ok := tx.(port.ReviewTx)
			if !ok {
				return errors.New("store does not implement port.ReviewTx")
			}
			for _, s := range seeded {
				a := matter.ReviewAnswer{ID: s.id, GridID: g.ID, VersionID: v, QuestionID: q, QuestionRevision: 1,
					State: matter.ReviewReviewed, Text: "recorded", Author: f.e.editor, AnsweredAt: s.at}
				if err := rt.InsertReviewAnswer(f.e.ctx, a); err != nil {
					return err
				}
			}
			return nil
		})
		if err != nil {
			t.Fatal(err)
		}
		var walked []string
		cursor := (*matter.ReviewAnswerCursor)(nil)
		for {
			p, err := f.rv.AnswerHistory(f.e.ctx, port.ReviewHistoryQuery{ActorID: f.e.viewer.String(), MatterID: f.e.m.String(), GridID: g.ID, VersionID: v, QuestionID: q, Limit: 2, Cursor: cursor})
			if err != nil {
				t.Fatal(err)
			}
			for _, a := range p.Items {
				walked = append(walked, a.ID)
			}
			if p.NextCursor == nil {
				break
			}
			cursor = p.NextCursor
		}
		want := []string{"0fffffff-0000-7000-8000-000000000001", "00000000-0000-7000-8000-000000000002", "ffffffff-0000-7000-8000-000000000003"}
		if len(walked) != 3 || walked[0] != want[0] || walked[1] != want[1] || walked[2] != want[2] {
			t.Fatalf("recorded chronology newest first: %v", walked)
		}
	})

	t.Run("access: viewers read but cannot write; outsiders and revoked members see nothing", func(t *testing.T) {
		f := newReviewFx(t, newBundle)
		g := f.grid(f.e.editor, "Grid").Grid
		if _, err := f.rv.CreateGrid(f.e.ctx, port.CreateReviewGridCmd{ActorID: f.e.viewer.String(), MatterID: f.e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Name: "x"}); !errors.Is(err, port.ErrForbidden) {
			t.Fatalf("viewer write: %v", err)
		}
		if _, err := f.rv.GetGrid(f.e.ctx, port.GetReviewGridQuery{ActorID: f.e.out.String(), MatterID: f.e.m.String(), GridID: g.ID}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("outsider read: %v", err)
		}
		w1 := w1Env{t: t, ws: f.e.ws, ctx: f.e.ctx}
		if err := w1.revokeMatter(f.e.owner, f.e.m, f.e.viewer, w1.matterRevision(f.e.owner, f.e.wsID, f.e.m)); err != nil {
			t.Fatal(err)
		}
		if _, err := f.rv.GetGrid(f.e.ctx, port.GetReviewGridQuery{ActorID: f.e.viewer.String(), MatterID: f.e.m.String(), GridID: g.ID}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("revoked member read: %v", err)
		}
		if _, err := f.rv.ListGrids(f.e.ctx, port.MatterListQuery{ActorID: f.e.viewer.String(), MatterID: f.e.m.String()}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("revoked member list: %v", err)
		}
		if _, err := f.rv.AnswerHistory(f.e.ctx, port.ReviewHistoryQuery{ActorID: f.e.viewer.String(), MatterID: f.e.m.String(), GridID: g.ID, VersionID: "01a17c8f-15d0-7386-8133-c1625313f6d1", QuestionID: "01a17c8f-15d0-7386-8133-c1625313f6d2"}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("revoked member history: %v", err)
		}
	})
}
