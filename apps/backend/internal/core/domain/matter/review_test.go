package matter

import (
	"errors"
	"strings"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain"
)

var reviewAt = time.Date(2026, 10, 29, 9, 0, 0, 0, time.UTC)

func mustQ(t *testing.T, id string, pos int, text string) ReviewQuestion {
	t.Helper()
	q, err := NewReviewQuestion(id, pos, text, "u1", reviewAt)
	if err != nil {
		t.Fatalf("question: %v", err)
	}
	return q
}

func isValidation(err error) bool {
	var ve *domain.ValidationError
	return errors.As(err, &ve)
}

func TestNewReviewGridValidates(t *testing.T) {
	if _, err := NewReviewGrid("g1", "m1", "  ", "u1", reviewAt); !isValidation(err) {
		t.Fatalf("blank name: %v", err)
	}
	if _, err := NewReviewGrid("g1", "m1", strings.Repeat("x", 201), "u1", reviewAt); !isValidation(err) {
		t.Fatalf("201 chars: %v", err)
	}
	g, err := NewReviewGrid("g1", "m1", "  Change of control  ", "u1", reviewAt)
	if err != nil || g.Name != "Change of control" || g.Revision != 1 {
		t.Fatalf("grid = %+v, %v", g, err)
	}
}

func TestNewReviewQuestionBounds(t *testing.T) {
	if _, err := NewReviewQuestion("q1", 0, "", "u1", reviewAt); !isValidation(err) {
		t.Fatalf("blank: %v", err)
	}
	if _, err := NewReviewQuestion("q1", 0, strings.Repeat("x", 1001), "u1", reviewAt); !isValidation(err) {
		t.Fatalf("1001: %v", err)
	}
	q := mustQ(t, "q1", 0, " Is there a change-of-control clause? ")
	if q.Revision != 1 || q.Text != "Is there a change-of-control clause?" {
		t.Fatalf("question = %+v", q)
	}
}

func TestNewReviewAnswerRules(t *testing.T) {
	q := mustQ(t, "q1", 0, "Q")
	cases := []struct {
		name              string
		state             ReviewAnswerState
		text, page, quote string
		wantErr           bool
	}{
		{"reviewed needs text", ReviewReviewed, "", "", "", true},
		{"unable needs text", ReviewUnable, " ", "", "", true},
		{"absent may be empty", ReviewAbsent, "", "", "", false},
		{"bad state", ReviewAnswerState("OCR_ERROR"), "x", "", "", true},
		{"page ref too long", ReviewReviewed, "x", strings.Repeat("9", 41), "", true},
		{"quote ref too long", ReviewReviewed, "x", "", strings.Repeat("q", 1001), true},
		{"text too long", ReviewReviewed, strings.Repeat("t", 4001), "", "", true},
		{"ok with refs", ReviewReviewed, "Clause 12.3", " 14 ", " exact words ", false},
	}
	for _, c := range cases {
		a, err := NewReviewAnswer("a1", "g1", "v1", q, c.state, c.text, c.page, c.quote, "u1", reviewAt, "")
		if (err != nil) != c.wantErr || (err != nil && !isValidation(err)) {
			t.Fatalf("%s: err = %v, wantErr %v", c.name, err, c.wantErr)
		}
		if err == nil && c.name == "ok with refs" {
			if a.PageRef != "14" || a.QuoteRef != "exact words" || a.QuestionRevision != 1 {
				t.Fatalf("answer = %+v", a)
			}
		}
	}
}

func gridWith(versions []string, qs ...ReviewQuestion) ReviewGrid {
	return ReviewGrid{ID: "g1", MatterID: "m1", VersionIDs: versions, Questions: qs}
}

func TestBuildReviewCellsPendingWhenNoAnswer(t *testing.T) {
	cells := BuildReviewCells(gridWith([]string{"v1", "v2"}, mustQ(t, "q1", 0, "A"), mustQ(t, "q2", 1, "B")), nil)
	if len(cells) != 4 {
		t.Fatalf("cells = %d, want 4", len(cells))
	}
	for _, c := range cells {
		if !c.Pending || c.Stale || c.Answer != nil {
			t.Fatalf("cell %+v should be pending", c)
		}
	}
	if cells[0].VersionID != "v1" || cells[0].QuestionID != "q1" || cells[1].QuestionID != "q2" || cells[2].VersionID != "v2" {
		t.Fatalf("order = %+v", cells)
	}
}

func TestBuildReviewCellsPicksCurrentAnswer(t *testing.T) {
	q := mustQ(t, "q1", 0, "A")
	a1, _ := NewReviewAnswer("a1", "g1", "v1", q, ReviewReviewed, "first", "", "", "u1", reviewAt, "")
	a2, _ := NewReviewAnswer("a2", "g1", "v1", q, ReviewAbsent, "", "", "", "u2", reviewAt.Add(time.Hour), "a1")
	cells := BuildReviewCells(gridWith([]string{"v1"}, q), []ReviewAnswer{a1, a2})
	if cells[0].Answer == nil || cells[0].Answer.ID != "a2" || cells[0].Pending {
		t.Fatalf("cell = %+v", cells[0])
	}
}

func TestBuildReviewCellsStaleOnlyForRevisedQuestion(t *testing.T) {
	q1, q2 := mustQ(t, "q1", 0, "A"), mustQ(t, "q2", 1, "B")
	a1, _ := NewReviewAnswer("a1", "g1", "v1", q1, ReviewReviewed, "x", "", "", "u1", reviewAt, "")
	a2, _ := NewReviewAnswer("a2", "g1", "v1", q2, ReviewReviewed, "y", "", "", "u1", reviewAt, "")
	q1.Revision, q1.Text = 2, "A, reworded"
	cells := BuildReviewCells(gridWith([]string{"v1"}, q1, q2), []ReviewAnswer{a1, a2})
	if !cells[0].Stale || cells[0].Answer == nil {
		t.Fatalf("revised column must be stale and keep its answer: %+v", cells[0])
	}
	if cells[1].Stale {
		t.Fatalf("untouched column must not be stale: %+v", cells[1])
	}
}

func TestBuildReviewCellsIgnoresAnswersOfRemovedVersion(t *testing.T) {
	q := mustQ(t, "q1", 0, "A")
	a, _ := NewReviewAnswer("a1", "g1", "v-removed", q, ReviewReviewed, "x", "", "", "u1", reviewAt, "")
	cells := BuildReviewCells(gridWith([]string{"v1"}, q), []ReviewAnswer{a})
	if len(cells) != 1 || cells[0].Answer != nil || !cells[0].Pending {
		t.Fatalf("cells = %+v", cells)
	}
}

func TestReviewLimitsCountCharactersNotBytes(t *testing.T) {
	viet := strings.Repeat("ệ", 150) // 150 characters, 450 bytes
	if _, err := NewReviewGrid("g1", "m1", viet, "u1", reviewAt); err != nil {
		t.Fatalf("a 150-character Vietnamese name is within the 200-character limit: %v", err)
	}
	if _, err := NewReviewGrid("g1", "m1", strings.Repeat("ệ", 201), "u1", reviewAt); !isValidation(err) {
		t.Fatalf("201 characters must still be refused: %v", err)
	}
	q := mustQ(t, "q1", 0, "Q")
	long := strings.Repeat("ế", MaxReviewAnswerText)
	if _, err := NewReviewAnswer("a1", "g1", "v1", q, ReviewReviewed, long, strings.Repeat("ế", 40), strings.Repeat("ế", MaxReviewQuoteRef), "u1", reviewAt, ""); err != nil {
		t.Fatalf("limits are characters, so exactly-at-limit text is accepted: %v", err)
	}
	if _, err := NewReviewAnswer("a1", "g1", "v1", q, ReviewReviewed, long+"ế", "", "", "u1", reviewAt, ""); !isValidation(err) {
		t.Fatalf("one character over is refused: %v", err)
	}
	if _, err := NewReviewQuestion("q1", 0, strings.Repeat("ệ", MaxReviewQuestion), "u1", reviewAt); err != nil {
		t.Fatalf("a question at the limit in characters: %v", err)
	}
}
