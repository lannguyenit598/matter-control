package service_test

// Manual review matrix behavior, observed through the memory double: roles, hidden resources,
// CAS, receipts, stale derivation and isolation from verification state.

import (
	"bytes"
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

var (
	rvEditor   = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	rvViewer   = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	rvOutsider = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	rvOther    = matter.MatterID(uuid.Must(uuid.NewV7()).String())
)

type reviewSUT struct {
	svc   port.ReviewService
	ev    port.EvidenceService
	work  *service.WorkService
	msvc  port.MatterService
	store *mattercontrol.Store
}

func newReviewSUT(t *testing.T) reviewSUT {
	t.Helper()
	w6 := newW6SUT(t)
	w := w6.world
	for _, a := range []matter.ActorID{rvEditor, rvViewer, rvOutsider} {
		w.AddUser(a)
	}
	for _, a := range []matter.ActorID{rvEditor, rvViewer} {
		w.SetWorkspaceMembership(w1Workspace, a, matter.WorkspaceRoleMember, matter.StatusActive)
	}
	w.SetMatterMembership(w1Matter, rvEditor, matter.MatterRoleEditor, matter.StatusActive)
	w.SetMatterMembership(w1Matter, rvViewer, matter.MatterRoleViewer, matter.StatusActive)
	// A second matter the owner also owns: its versions must not be referenceable from w1Matter.
	w.AddMatter(rvOther, w1Workspace)
	w.Store().SetMatterRevision(rvOther, 1)
	w.SetMatterMembership(rvOther, w1TestActorOwner, matter.MatterRoleOwner, matter.StatusActive)
	work := service.NewWorkService(w6.store, w6RecordIDs{}, discardLogger(), matter.KeyAgePolicy{})
	ev := service.NewEvidenceService(work, mattercontrol.NewMemoryObjects())
	return reviewSUT{svc: service.NewReviewService(work), ev: ev, work: work, msvc: w6.msvc, store: w6.store}
}

// version uploads one real document version into m and returns its id.
func (s reviewSUT) version(t *testing.T, m matter.MatterID, name string) string {
	t.Helper()
	ctx := context.Background()
	doc, err := s.ev.CreateDocument(ctx, port.CreateDocumentCmd{
		ActorID: w1TestActorOwner.String(), MatterID: m.String(), IdempotencyKey: newKey(), RequestHash: w1AnyHash, Name: name,
	})
	if err != nil {
		t.Fatalf("create document: %v", err)
	}
	v, err := s.ev.UploadVersion(ctx, port.UploadVersionCmd{
		ActorID: w1TestActorOwner.String(), MatterID: m.String(), DocumentID: doc.ID, IdempotencyKey: newKey(),
		RequestHash: w1AnyHash, Filename: name + ".pdf", MediaType: "application/pdf",
		Body: bytes.NewReader([]byte("content of " + name)), MaxBytes: 1 << 20,
	})
	if err != nil {
		t.Fatalf("upload version: %v", err)
	}
	return v.ID
}

func (s reviewSUT) grid(t *testing.T, name string) matter.ReviewGridView {
	t.Helper()
	res, err := s.svc.CreateGrid(context.Background(), port.CreateReviewGridCmd{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), IdempotencyKey: newKey(), RequestHash: w1AnyHash, Name: name,
	})
	if err != nil {
		t.Fatalf("create grid: %v", err)
	}
	return s.view(t, res.ID)
}

func (s reviewSUT) view(t *testing.T, gridID string) matter.ReviewGridView {
	t.Helper()
	v, err := s.svc.GetGrid(context.Background(), port.GetReviewGridQuery{ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: gridID})
	if err != nil {
		t.Fatalf("get grid: %v", err)
	}
	return v
}

func (s reviewSUT) addVersion(t *testing.T, g matter.ReviewGrid, versionID string) matter.ReviewGrid {
	t.Helper()
	out, err := s.svc.AddGridVersion(context.Background(), port.ReviewVersionCmd{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, VersionID: versionID, ExpectedRevision: g.Revision,
	})
	if err != nil {
		t.Fatalf("add version: %v", err)
	}
	return out
}

func (s reviewSUT) addQuestion(t *testing.T, g matter.ReviewGrid, text string) matter.ReviewGrid {
	t.Helper()
	out, err := s.svc.AddQuestion(context.Background(), port.AddReviewQuestionCmd{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, Text: text, ExpectedRevision: g.Revision,
	})
	if err != nil {
		t.Fatalf("add question: %v", err)
	}
	return out
}

func answerCmd(g matter.ReviewGrid, versionID, questionID, expected string) port.RecordReviewAnswerCmd {
	rev := 0
	for _, q := range g.Questions {
		if q.ID == questionID {
			rev = q.Revision
		}
	}
	return port.RecordReviewAnswerCmd{
		ExpectedQuestionRevision: rev,
		ActorID:                  w1TestActorOwner.String(), MatterID: w1Matter.String(), IdempotencyKey: newKey(), RequestHash: w1AnyHash,
		GridID: g.ID, VersionID: versionID, QuestionID: questionID, ExpectedAnswerID: &expected,
		State: "REVIEWED", Text: "Clause 12.3 applies", PageRef: "14", QuoteRef: "on a change of control",
	}
}

func TestCreateGridOwnerAndEditorOnly(t *testing.T) {
	s := newReviewSUT(t)
	create := func(actor matter.ActorID) error {
		_, err := s.svc.CreateGrid(context.Background(), port.CreateReviewGridCmd{
			ActorID: actor.String(), MatterID: w1Matter.String(), IdempotencyKey: newKey(), RequestHash: w1AnyHash, Name: "DD grid",
		})
		return err
	}
	if err := create(w1TestActorOwner); err != nil {
		t.Fatalf("owner: %v", err)
	}
	if err := create(rvEditor); err != nil {
		t.Fatalf("editor: %v", err)
	}
	if err := create(rvViewer); !errors.Is(err, port.ErrForbidden) {
		t.Fatalf("viewer must be refused with a role denial, got %v", err)
	}
	if err := create(rvOutsider); !errors.Is(err, port.ErrNotFound) {
		t.Fatalf("non-member must see a hidden resource, got %v", err)
	}
	if _, err := s.svc.ListGrids(context.Background(), port.MatterListQuery{ActorID: rvViewer.String(), MatterID: w1Matter.String()}); err != nil {
		t.Fatalf("viewer may read: %v", err)
	}
	if _, err := s.svc.ListGrids(context.Background(), port.MatterListQuery{ActorID: rvOutsider.String(), MatterID: w1Matter.String()}); !errors.Is(err, port.ErrNotFound) {
		t.Fatalf("outsider read must be hidden, got %v", err)
	}
}

func TestAddVersionRejectsUnknownAndCrossMatterIdentically(t *testing.T) {
	s := newReviewSUT(t)
	g := s.grid(t, "DD grid").Grid
	foreign := s.version(t, rvOther, "foreign")
	add := func(id string) error {
		_, err := s.svc.AddGridVersion(context.Background(), port.ReviewVersionCmd{
			ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, VersionID: id, ExpectedRevision: g.Revision,
		})
		return err
	}
	cross, missing := add(foreign), add(uuid.Must(uuid.NewV7()).String())
	var rc, rm *matter.RejectedError
	if !errors.As(cross, &rc) || !errors.As(missing, &rm) {
		t.Fatalf("both must be rejections: %v / %v", cross, missing)
	}
	if rc.Code != "unknown-version" || rc.Code != rm.Code || rc.Message != rm.Message {
		t.Fatalf("cross-matter and missing must be indistinguishable: %+v vs %+v", rc, rm)
	}
}

func TestAddVersionTwiceAndBounds(t *testing.T) {
	s := newReviewSUT(t)
	g := s.grid(t, "DD grid").Grid
	v1 := s.version(t, w1Matter, "spa")
	g = s.addVersion(t, g, v1)
	_, err := s.svc.AddGridVersion(context.Background(), port.ReviewVersionCmd{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, VersionID: v1, ExpectedRevision: g.Revision,
	})
	var re *matter.RejectedError
	if !errors.As(err, &re) || re.Code != "duplicate-version" {
		t.Fatalf("duplicate: %v", err)
	}
	long := strings.Repeat("q", matter.MaxReviewQuestion+1)
	if _, err := s.svc.AddQuestion(context.Background(), port.AddReviewQuestionCmd{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, Text: long, ExpectedRevision: g.Revision,
	}); err == nil {
		t.Fatal("an over-long question must be refused")
	}
}

func TestStructureCommandsNeedCurrentRevision(t *testing.T) {
	s := newReviewSUT(t)
	g := s.grid(t, "DD grid").Grid
	cmd := port.AddReviewQuestionCmd{ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, Text: "Change of control?"}
	if _, err := s.svc.AddQuestion(context.Background(), cmd); !errors.Is(err, port.ErrPreconditionRequired) {
		t.Fatalf("no revision: %v", err)
	}
	cmd.ExpectedRevision = g.Revision + 5
	if _, err := s.svc.AddQuestion(context.Background(), cmd); !errors.Is(err, port.ErrPreconditionFailed) {
		t.Fatalf("stale revision: %v", err)
	}
	cmd.ExpectedRevision = g.Revision
	got, err := s.svc.AddQuestion(context.Background(), cmd)
	if err != nil || got.Revision != g.Revision+1 || len(got.Questions) != 1 {
		t.Fatalf("add question: %+v, %v", got, err)
	}
	if v := s.view(t, g.ID); len(v.Grid.Questions) != 1 || v.Grid.Revision != g.Revision+1 {
		t.Fatalf("not persisted: %+v", v.Grid)
	}
}

func TestReviseQuestionStalesOnlyItsColumn(t *testing.T) {
	s := newReviewSUT(t)
	g := s.grid(t, "DD grid").Grid
	v1 := s.version(t, w1Matter, "spa")
	g = s.addVersion(t, g, v1)
	g = s.addQuestion(t, g, "Change of control?")
	g = s.addQuestion(t, g, "Assignment?")
	q1, q2 := g.Questions[0], g.Questions[1]
	for _, q := range []matter.ReviewQuestion{q1, q2} {
		if _, err := s.svc.RecordAnswer(context.Background(), answerCmd(g, v1, q.ID, "")); err != nil {
			t.Fatalf("answer: %v", err)
		}
	}
	revised, err := s.svc.ReviseQuestion(context.Background(), port.ReviseReviewQuestionCmd{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, QuestionID: q1.ID,
		Text: "Is there a change-of-control termination right?", ExpectedRevision: g.Revision,
	})
	if err != nil || revised.Questions[0].Revision != 2 || revised.Questions[1].Revision != 1 {
		t.Fatalf("revise: %+v, %v", revised.Questions, err)
	}
	view := s.view(t, g.ID)
	if len(view.QuestionHistory) != 3 || view.QuestionHistory[0].Text != "Change of control?" || view.QuestionHistory[2].Revision != 2 {
		t.Fatalf("the old wording must stay readable: %+v", view.QuestionHistory)
	}
	cells := view.Cells
	if !cells[0].Stale || cells[0].Answer == nil {
		t.Fatalf("revised column must be stale and keep its answer: %+v", cells[0])
	}
	if cells[1].Stale {
		t.Fatalf("other column must stay current: %+v", cells[1])
	}
}

func TestRecordAnswerCASOnExpectedAnswerID(t *testing.T) {
	s := newReviewSUT(t)
	g := s.grid(t, "DD grid").Grid
	v1 := s.version(t, w1Matter, "spa")
	g = s.addVersion(t, g, v1)
	g = s.addQuestion(t, g, "Change of control?")
	q := g.Questions[0]
	first, err := s.svc.RecordAnswer(context.Background(), answerCmd(g, v1, q.ID, ""))
	if err != nil {
		t.Fatalf("first answer: %v", err)
	}
	if _, err := s.svc.RecordAnswer(context.Background(), answerCmd(g, v1, q.ID, "")); !errors.Is(err, port.ErrPreconditionFailed) {
		t.Fatalf("a second answer expecting 'none' must conflict, got %v", err)
	}
	second, err := s.svc.RecordAnswer(context.Background(), answerCmd(g, v1, q.ID, first.ID))
	if err != nil {
		t.Fatalf("superseding answer: %v", err)
	}
	cells := s.view(t, g.ID).Cells
	if cells[0].Answer == nil || cells[0].Answer.ID != second.ID || cells[0].Answer.SupersedesID != first.ID {
		t.Fatalf("current answer = %+v", cells[0].Answer)
	}
	hist, err := s.svc.AnswerHistory(context.Background(), port.ReviewHistoryQuery{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, VersionID: v1, QuestionID: q.ID,
	})
	if err != nil || len(hist.Items) != 2 || hist.Items[0].ID != second.ID || hist.Items[1].ID != first.ID {
		t.Fatalf("history newest first: %+v, %v", hist, err)
	}
}

func TestRecordAnswerReplayReturnsOriginal(t *testing.T) {
	s := newReviewSUT(t)
	g := s.grid(t, "DD grid").Grid
	v1 := s.version(t, w1Matter, "spa")
	g = s.addVersion(t, g, v1)
	g = s.addQuestion(t, g, "Change of control?")
	cmd := answerCmd(g, v1, g.Questions[0].ID, "")
	first, err := s.svc.RecordAnswer(context.Background(), cmd)
	if err != nil {
		t.Fatalf("first: %v", err)
	}
	again, err := s.svc.RecordAnswer(context.Background(), cmd)
	if err != nil || !again.Replayed || again.ID != first.ID {
		t.Fatalf("replay = %+v, %v", again, err)
	}
	hist, _ := s.svc.AnswerHistory(context.Background(), port.ReviewHistoryQuery{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, VersionID: v1, QuestionID: g.Questions[0].ID,
	})
	if len(hist.Items) != 1 {
		t.Fatalf("replay must not write a second answer: %d", len(hist.Items))
	}
}

func TestRecordAnswerRequiresVersionInGrid(t *testing.T) {
	s := newReviewSUT(t)
	g := s.grid(t, "DD grid").Grid
	g = s.addQuestion(t, g, "Change of control?")
	outside := s.version(t, w1Matter, "not-in-grid")
	_, err := s.svc.RecordAnswer(context.Background(), answerCmd(g, outside, g.Questions[0].ID, ""))
	var re *matter.RejectedError
	if !errors.As(err, &re) || re.Code != "not-in-grid" {
		t.Fatalf("got %v", err)
	}
}

func TestAnswerHistoryIsBoundedOrderedAndComplete(t *testing.T) {
	s := newReviewSUT(t)
	g := s.grid(t, "DD grid").Grid
	v1 := s.version(t, w1Matter, "spa")
	g = s.addVersion(t, g, v1)
	g = s.addQuestion(t, g, "Change of control?")
	prev := ""
	firstID := ""
	seen := map[string]bool{}
	for i := 0; i < 5; i++ {
		res, err := s.svc.RecordAnswer(context.Background(), answerCmd(g, v1, g.Questions[0].ID, prev))
		if err != nil {
			t.Fatalf("answer %d: %v", i, err)
		}
		if i == 0 {
			firstID = res.ID
		}
		seen[res.ID] = true
		prev = res.ID
	}
	// Page through the whole trail: every answer appears exactly once and the original,
	// oldest answer stays reachable through the cursor.
	q := port.ReviewHistoryQuery{ActorID: rvViewer.String(), MatterID: w1Matter.String(), GridID: g.ID, VersionID: v1, QuestionID: g.Questions[0].ID, Limit: 3}
	var walked []matter.ReviewAnswer
	pages := 0
	for {
		page, err := s.svc.AnswerHistory(context.Background(), q)
		if err != nil {
			t.Fatalf("page %d: %v", pages, err)
		}
		walked = append(walked, page.Items...)
		pages++
		if page.NextCursor == nil {
			break
		}
		q.Cursor = page.NextCursor
	}
	if pages != 2 || len(walked) != 5 || walked[0].ID != prev || walked[len(walked)-1].ID != firstID {
		t.Fatalf("traversal: %d pages, %d rows, newest %s, oldest %s", pages, len(walked), walked[0].ID, walked[len(walked)-1].ID)
	}
	for _, a := range walked {
		if !seen[a.ID] {
			t.Fatalf("unknown answer in history: %s", a.ID)
		}
		delete(seen, a.ID)
	}
	if len(seen) != 0 {
		t.Fatalf("answers missing from the traversed history: %d", len(seen))
	}
	q.Limit = matter.MaxReviewHistory + 1
	if _, err := s.svc.AnswerHistory(context.Background(), q); err == nil {
		t.Fatal("a limit above the maximum must be refused")
	}
}

func TestReviewDoesNotChangeVerification(t *testing.T) {
	s := newReviewSUT(t)
	ctx := context.Background()
	g := s.grid(t, "DD grid").Grid
	v1 := s.version(t, w1Matter, "spa")
	g = s.addVersion(t, g, v1)
	g = s.addQuestion(t, g, "Change of control?")
	if _, err := s.msvc.CreateRequirement(ctx, port.CreateRequirementCmd{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), IdempotencyKey: newKey(), RequestHash: w1AnyHash,
		Title: "Board approval", Outcome: "Approved",
	}); err != nil {
		t.Fatalf("seed requirement: %v", err)
	}
	before := workStateJSON(t, s)
	if before == "" {
		t.Fatal("the comparison needs at least one work item")
	}
	if _, err := s.svc.RecordAnswer(ctx, answerCmd(g, v1, g.Questions[0].ID, "")); err != nil {
		t.Fatalf("answer: %v", err)
	}
	if after := workStateJSON(t, s); after != before {
		t.Fatalf("answers changed work state:\nbefore %s\nafter  %s", before, after)
	}
}

// workStateJSON renders the items' execution, dependency and verification as one comparable string.
func workStateJSON(t *testing.T, s reviewSUT) string {
	t.Helper()
	page, err := s.work.ListWorkItems(context.Background(), port.ListWorkItemsQuery{ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String()})
	if err != nil {
		t.Fatalf("list work items: %v", err)
	}
	var b strings.Builder
	for _, v := range page.Items {
		b.WriteString(v.Item.ID.String() + ":" + string(v.Item.Execution) + ":" + string(v.Item.Dependency) + ":" + string(v.Item.Verification) + ";")
	}
	return b.String()
}

func TestRecordAnswerRefusesAReWordedQuestion(t *testing.T) {
	s := newReviewSUT(t)
	ctx := context.Background()
	g := s.grid(t, "DD grid").Grid
	v1 := s.version(t, w1Matter, "spa")
	g = s.addVersion(t, g, v1)
	g = s.addQuestion(t, g, "Change of control?")
	q := g.Questions[0]
	seen := answerCmd(g, v1, q.ID, "") // the writer opened the cell at wording 1
	if _, err := s.svc.ReviseQuestion(ctx, port.ReviseReviewQuestionCmd{
		ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, QuestionID: q.ID,
		Text: "Is there a termination right on change of control?", ExpectedRevision: g.Revision,
	}); err != nil {
		t.Fatalf("revise: %v", err)
	}
	if _, err := s.svc.RecordAnswer(ctx, seen); !errors.Is(err, port.ErrPreconditionFailed) {
		t.Fatalf("an answer to wording the writer never saw must be refused, got %v", err)
	}
	if hist, _ := s.svc.AnswerHistory(ctx, port.ReviewHistoryQuery{ActorID: w1TestActorOwner.String(), MatterID: w1Matter.String(), GridID: g.ID, VersionID: v1, QuestionID: q.ID}); len(hist.Items) != 0 {
		t.Fatalf("the refused answer must not be stored: %+v", hist)
	}
	missing := seen
	missing.IdempotencyKey, missing.ExpectedQuestionRevision = newKey(), 0
	if _, err := s.svc.RecordAnswer(ctx, missing); !errors.Is(err, port.ErrPreconditionRequired) {
		t.Fatalf("no question revision must be 428-class, got %v", err)
	}
	current := seen
	current.IdempotencyKey, current.ExpectedQuestionRevision = newKey(), 2
	if _, err := s.svc.RecordAnswer(ctx, current); err != nil {
		t.Fatalf("an answer to the current wording succeeds: %v", err)
	}
}
