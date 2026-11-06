package port

import (
	"context"
	"io"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Contract term sheet (MC-ZCODE-TERMSHEET-01, design 2026-11-05 §2.2) ----------

const MaxTermSheetBytes = 5 << 20

type TermSheetView struct {
	Lines          []matter.TermLine
	MatterRevision int64
}

// ListTermLinesQuery reads every term line of one matter (authorized members).
type ListTermLinesQuery struct {
	ActorID  string
	MatterID string
}

// TermSheetRowError names one rejected imported row: the row key, a stable code and the reason.
// A rejected row never aborts a well-formed sheet silently — the result lists every rejection.
type TermSheetRowError struct {
	RowKey string
	Code   string // "validation", or "promoted" when a re-import would change or drop a promoted fact
	Detail string
}

// TermSheetImportResult is the readback of one import: how many rows were written as new line
// records (Created), how many of this version's prior lines did not survive the replace
// (Replaced — changed bytes re-created, plus lines the sheet dropped outright), how many were
// byte-identical no-ops (Unchanged), how many prior lines the sheet dropped outright (Deleted),
// and which rows were rejected.
type TermSheetImportResult struct {
	DocumentVersionID string
	Created           int
	Replaced          int
	Unchanged         int
	Deleted           int
	Rejected          []TermSheetRowError
	Replayed          bool
}

// ImportTermSheetCmd imports/refreshes the term lines of ONE contract document version from a
// structured sheet. Idempotent by row content hash over (document version, field, row key): the
// same bytes are a no-op, changed bytes replace that version's lines atomically. Deliberately
// receipted once per sheet, with a Matter revision precondition.
type ImportTermSheetCmd struct {
	ActorID           string
	MatterID          string
	DocumentVersionID string
	ExpectedRevision  int64
	IdempotencyKey    string
	RequestHash       string
	Format            string // "csv" | "xlsx" — decoded through SheetCodec
	Sheet             io.Reader
	// MaxBytes bounds the decoded sheet; the handler passes the same ceiling as uploads.
	MaxBytes int64
}

// PromoteTermLineCmd creates the DRAFT record one term line operationalizes, under the fixed
// field→target mapping (matter.PromotionTargetOf). Receipted like every mutation (§2.1): the
// same key replays the stored outcome. Promoting never completes or verifies anything.
type PromoteTermLineCmd struct {
	ActorID          string
	MatterID         string
	TermLineID       string
	IdempotencyKey   string
	RequestHash      string
	ExpectedRevision int64
}

// PromotedTermLine is the readback of one promotion: the line (now carrying its promotion link)
// and the reference of the created draft. Replayed marks a stored outcome returned under the
// SAME key.
type PromotedTermLine struct {
	LineID        matter.TermLineID
	TargetKind    matter.TermPromotionKind
	TargetMissing bool
	TargetID      string
	Replayed      bool
}

// TermLineSnapshot reads term lines inside one store snapshot.
type TermLineSnapshot interface {
	ListTermLines(ctx context.Context, m matter.MatterID) ([]matter.TermLine, error)
}

// MatterTermSheetTx reads and writes term lines inside the locked matter transaction. The
// replace is atomic with the whole import: either every parsed line of the document version is
// written or nothing is.
type MatterTermSheetTx interface {
	ListTermLines(ctx context.Context, m matter.MatterID) ([]matter.TermLine, error)
	LoadTermLine(ctx context.Context, m matter.MatterID, id matter.TermLineID) (matter.TermLine, error)
	ReplaceTermLinesOfDocumentVersion(ctx context.Context, m matter.MatterID, documentVersionID matter.VersionID, lines []matter.TermLine) error
	MarkTermLinePromoted(ctx context.Context, m matter.MatterID, id matter.TermLineID, ref string, kind matter.TermPromotionKind, at time.Time) error
}

// TermSheetService defines the term-sheet use cases.
type TermSheetService interface {
	ListTermLines(ctx context.Context, q ListTermLinesQuery) (TermSheetView, error)
	ImportTermSheet(ctx context.Context, cmd ImportTermSheetCmd) (TermSheetImportResult, error)
	PromoteTermLine(ctx context.Context, cmd PromoteTermLineCmd) (PromotedTermLine, error)
}
