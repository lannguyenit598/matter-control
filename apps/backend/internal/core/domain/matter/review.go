package matter

import (
	"strings"
	"time"
	"unicode/utf8"

	"leonx.me/matter-control/internal/core/domain"
)

// Limits count characters (runes), like the database and the client, never bytes.
// A review grid is a manual, source-linked table: exact document versions are the rows, versioned
// questions are the columns, and a person records a cited answer per cell. Answers are append-only
// (a new answer supersedes the previous one), "pending" and "stale" are derived, and an answer
// never verifies a Requirement, completes an Action or changes a Filing: independent proof
// assessment stays the only verification authority.

const (
	MaxReviewVersions   = 50
	MaxReviewQuestions  = 25
	MaxReviewNameLen    = 200
	MaxReviewQuestion   = 1000
	MaxReviewAnswerText = 4000
	MaxReviewPageRef    = 40
	MaxReviewQuoteRef   = 1000
	MaxReviewHistory    = 100
)

// ReviewAnswerState is what a person recorded for a cell. There is no machine/OCR error state:
// UNABLE means a person says the cell could not be reviewed.
type ReviewAnswerState string

const (
	ReviewReviewed ReviewAnswerState = "REVIEWED"
	ReviewAbsent   ReviewAnswerState = "ABSENT"
	ReviewUnable   ReviewAnswerState = "UNABLE"
)

func (s ReviewAnswerState) Valid() bool {
	switch s {
	case ReviewReviewed, ReviewAbsent, ReviewUnable:
		return true
	}
	return false
}

// ReviewQuestion is one column at its current revision; earlier texts live in the revision history.
type ReviewQuestion struct {
	ID        string
	Position  int
	Revision  int
	Text      string
	RevisedBy ActorID
	RevisedAt time.Time
}

// ReviewGrid is the structure of one review: a set of exact version ids and ordered questions.
// Revision guards every structure change.
type ReviewGrid struct {
	ID         string
	MatterID   MatterID
	Name       string
	CreatedBy  ActorID
	CreatedAt  time.Time
	Revision   int64
	VersionIDs []string
	Questions  []ReviewQuestion
}

// ReviewAnswer is one recorded answer. SupersedesID chains the history of a cell.
type ReviewAnswer struct {
	ID, GridID, VersionID, QuestionID string
	QuestionRevision                  int
	State                             ReviewAnswerState
	Text                              string
	// PageRef and QuoteRef are typed by a person and never validated against the document.
	PageRef, QuoteRef string
	Author            ActorID
	AnsweredAt        time.Time
	SupersedesID      string
}

// ReviewVersionRef describes a row. Current is a neutral fact (the document's current pointer),
// never a statement that the version was superseded.
type ReviewVersionRef struct {
	VersionID, DocumentID, DocumentName, Filename string
	No                                            int
	Current                                       bool
}

// ReviewAnswerCursor is the opaque-to-clients ordering key of one history page: the last answer's
// recorded instant and id. It is a seek position, never an authorization input.
type ReviewAnswerCursor struct {
	AnsweredAt time.Time
	ID         string
}

// ReviewAnswerPage is one authorized history page of one cell, newest first by the recorded
// facts (AnsweredAt, then id). NextCursor is nil on the last page; a page never claims a total
// it did not count.
type ReviewAnswerPage struct {
	Items      []ReviewAnswer
	NextCursor *ReviewAnswerCursor
}

// ReviewCell is one version × question. Stale means the question changed after the answer.
type ReviewCell struct {
	VersionID, QuestionID string
	Answer                *ReviewAnswer
	Pending, Stale        bool
}

// ReviewGridView is one consistent read of a grid.
type ReviewGridView struct {
	Grid     ReviewGrid
	Versions []ReviewVersionRef
	Cells    []ReviewCell
	// QuestionHistory holds every revision of every question, oldest first, so an answer can be shown
	// next to the wording it actually answered.
	QuestionHistory []ReviewQuestion
	AsOf            time.Time
	Revision        int64
}

func NewReviewGrid(id string, m MatterID, name string, by ActorID, at time.Time) (ReviewGrid, error) {
	n := strings.TrimSpace(name)
	if n == "" || utf8.RuneCountInString(n) > MaxReviewNameLen {
		v := &domain.ValidationError{}
		v.Add("name", "must be 1 to 200 characters")
		return ReviewGrid{}, v
	}
	return ReviewGrid{ID: id, MatterID: m, Name: n, CreatedBy: by, CreatedAt: at.UTC(), Revision: 1}, nil
}

func NewReviewQuestion(id string, position int, text string, by ActorID, at time.Time) (ReviewQuestion, error) {
	t := strings.TrimSpace(text)
	if t == "" || utf8.RuneCountInString(t) > MaxReviewQuestion {
		v := &domain.ValidationError{}
		v.Add("text", "must be 1 to 1000 characters")
		return ReviewQuestion{}, v
	}
	return ReviewQuestion{ID: id, Position: position, Revision: 1, Text: t, RevisedBy: by, RevisedAt: at.UTC()}, nil
}

// NewReviewAnswer validates a human answer to question q (at q's current revision).
func NewReviewAnswer(id, gridID, versionID string, q ReviewQuestion, state ReviewAnswerState, text, pageRef, quoteRef string, by ActorID, at time.Time, supersedesID string) (ReviewAnswer, error) {
	v := &domain.ValidationError{}
	if !state.Valid() {
		v.Add("state", "must be REVIEWED, ABSENT or UNABLE")
	}
	t, p, qr := strings.TrimSpace(text), strings.TrimSpace(pageRef), strings.TrimSpace(quoteRef)
	if utf8.RuneCountInString(t) > MaxReviewAnswerText {
		v.Add("text", "must be at most 4000 characters")
	}
	if (state == ReviewReviewed || state == ReviewUnable) && t == "" {
		v.Add("text", "is required for this state")
	}
	if utf8.RuneCountInString(p) > MaxReviewPageRef {
		v.Add("pageRef", "must be at most 40 characters")
	}
	if utf8.RuneCountInString(qr) > MaxReviewQuoteRef {
		v.Add("quoteRef", "must be at most 1000 characters")
	}
	if v.HasErrors() {
		return ReviewAnswer{}, v
	}
	return ReviewAnswer{
		ID: id, GridID: gridID, VersionID: versionID, QuestionID: q.ID, QuestionRevision: q.Revision,
		State: state, Text: t, PageRef: p, QuoteRef: qr, Author: by, AnsweredAt: at.UTC(), SupersedesID: supersedesID,
	}, nil
}

// BuildReviewCells derives one cell per (version, question), in grid order. The current answer of a
// cell is the one no other answer supersedes; answers of versions no longer in the grid are ignored
// (they stay stored and readable through the history).
func BuildReviewCells(g ReviewGrid, answers []ReviewAnswer) []ReviewCell {
	superseded := map[string]bool{}
	for _, a := range answers {
		if a.SupersedesID != "" {
			superseded[a.SupersedesID] = true
		}
	}
	current := map[[2]string]*ReviewAnswer{}
	for i := range answers {
		a := &answers[i]
		if !superseded[a.ID] {
			current[[2]string{a.VersionID, a.QuestionID}] = a
		}
	}
	cells := make([]ReviewCell, 0, len(g.VersionIDs)*len(g.Questions))
	for _, vid := range g.VersionIDs {
		for _, q := range g.Questions {
			c := ReviewCell{VersionID: vid, QuestionID: q.ID}
			if a := current[[2]string{vid, q.ID}]; a != nil {
				c.Answer = a
				c.Stale = a.QuestionRevision != q.Revision
			} else {
				c.Pending = true
			}
			cells = append(cells, c)
		}
	}
	return cells
}

// ParseReviewID validates the id of a grid, question or version (a UUID).
func ParseReviewID(raw, field string) (string, error) {
	id, err := newUUID[NodeID](raw, field)
	return string(id), err
}
