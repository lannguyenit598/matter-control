package port

import (
	"context"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Inbound: manual document review matrix ----------
//
// A grid is a Matter-scoped table of exact document versions (rows) and versioned questions
// (columns). Structure changes are guarded by the grid revision (If-Match); an answer is a receipted
// creation guarded by the id of the cell's current answer. Nothing here verifies a Requirement,
// completes an Action or changes a Filing.

type CreateReviewGridCmd struct {
	ActorID, MatterID string
	IdempotencyKey    string
	RequestHash       string
	Name              string
}

// ReviewVersionCmd adds or removes one exact version of the grid.
type ReviewVersionCmd struct {
	ActorID, MatterID, GridID, VersionID string
	ExpectedRevision                     int64
}

type AddReviewQuestionCmd struct {
	ActorID, MatterID, GridID, Text string
	ExpectedRevision                int64
}

type ReviseReviewQuestionCmd struct {
	ActorID, MatterID, GridID, QuestionID, Text string
	ExpectedRevision                            int64
}

// RecordReviewAnswerCmd records a human answer. ExpectedAnswerID is the id of the cell's current
// answer, or "" when the cell has none; nil (the field absent or null on the wire) is
// ErrPreconditionRequired — the caller must state what it saw — and a mismatch is
// ErrPreconditionFailed.
type RecordReviewAnswerCmd struct {
	ActorID, MatterID string
	IdempotencyKey    string
	RequestHash       string
	GridID            string
	VersionID         string
	QuestionID        string
	ExpectedAnswerID  *string
	// ExpectedQuestionRevision is the wording revision the writer answered; 0 is ErrPreconditionRequired and
	// a question reworded since is ErrPreconditionFailed, so an answer is never stamped with wording the
	// writer did not see.
	ExpectedQuestionRevision int
	State                    string
	Text                     string
	PageRef                  string
	QuoteRef                 string
}

type GetReviewGridQuery struct{ ActorID, MatterID, GridID string }

// ReviewHistoryQuery reads the answers of one cell, newest first by the recorded facts.
// Limit 0 means the maximum; Cursor is the previous page's nextCursor (a seek position,
// re-authorized per page like every read).
type ReviewHistoryQuery struct {
	ActorID, MatterID, GridID, VersionID, QuestionID string
	Limit                                            int
	Cursor                                           *matter.ReviewAnswerCursor
}

// ReviewService defines the review-matrix use cases.
type ReviewService interface {
	CreateGrid(ctx context.Context, cmd CreateReviewGridCmd) (matter.CreatedResult, error)
	AddGridVersion(ctx context.Context, cmd ReviewVersionCmd) (matter.ReviewGrid, error)
	RemoveGridVersion(ctx context.Context, cmd ReviewVersionCmd) (matter.ReviewGrid, error)
	AddQuestion(ctx context.Context, cmd AddReviewQuestionCmd) (matter.ReviewGrid, error)
	ReviseQuestion(ctx context.Context, cmd ReviseReviewQuestionCmd) (matter.ReviewGrid, error)
	RecordAnswer(ctx context.Context, cmd RecordReviewAnswerCmd) (matter.CreatedResult, error)
	ListGrids(ctx context.Context, q MatterListQuery) ([]matter.ReviewGrid, error)
	GetGrid(ctx context.Context, q GetReviewGridQuery) (matter.ReviewGridView, error)
	AnswerHistory(ctx context.Context, q ReviewHistoryQuery) (matter.ReviewAnswerPage, error)
}

// ReviewReader is the read side shared by the transaction and the snapshot of storage adapters.
type ReviewReader interface {
	// LoadReviewGrid returns the grid with its versions and question revisions, or ErrNotFound.
	LoadReviewGrid(ctx context.Context, m matter.MatterID, gridID string) (matter.ReviewGrid, error)
	ListReviewGrids(ctx context.Context, m matter.MatterID) ([]matter.ReviewGrid, error)
	// LoadReviewAnswers returns every answer of the grid ordered by id ascending.
	LoadReviewAnswers(ctx context.Context, m matter.MatterID, gridID string) ([]matter.ReviewAnswer, error)
	// ReviewAnswerPage returns one newest-first page of one cell's answers, seeking strictly
	// after the cursor (nil cursor = first page). It fetches limit+1 rows and reports
	// NextCursor only when an older answer exists, so a full trail stays reachable and no
	// page ever claims false completeness.
	ReviewAnswerPage(ctx context.Context, m matter.MatterID, gridID, versionID, questionID string, cursor *matter.ReviewAnswerCursor, limit int) (matter.ReviewAnswerPage, error)
	// LoadReviewQuestionHistory returns every stored revision of the grid's questions, oldest first.
	LoadReviewQuestionHistory(ctx context.Context, m matter.MatterID, gridID string) ([]matter.ReviewQuestion, error)
	// ReviewVersionRefs returns only the requested versions that belong to THIS matter.
	ReviewVersionRefs(ctx context.Context, m matter.MatterID, versionIDs []string) ([]matter.ReviewVersionRef, error)
}

// ReviewTx is implemented by the MatterTx of storage adapters.
type ReviewTx interface {
	ReviewReader
	InsertReviewGrid(ctx context.Context, g matter.ReviewGrid) error
	// SaveReviewGrid replaces the version set and stores any question revision not yet stored; zero updated rows is ErrVersionConflict.
	SaveReviewGrid(ctx context.Context, g matter.ReviewGrid, expectedRevision int64) error
	// InsertReviewAnswer appends an answer; a second answer superseding the same one is ErrVersionConflict.
	InsertReviewAnswer(ctx context.Context, a matter.ReviewAnswer) error
}

// ReviewSnapshot is implemented by the MatterSnapshot of storage adapters.
type ReviewSnapshot interface{ ReviewReader }
