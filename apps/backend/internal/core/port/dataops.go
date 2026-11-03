package port

import (
	"context"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Inbound (driving): W6 data operations ----------

type BulkPreviewCmd struct {
	ActorID  string
	MatterID string
	Rows     []BulkRowChange
}

// BulkRowChange is one requested metadata change. The allowlist is exactly
// title / description (→ the item's outcome text) / internalOwner / due.
type BulkRowChange struct {
	RowKey           string
	IdempotencyKey   string // UUIDv7, per-row receipt key
	ItemID           string
	ExpectedRevision int64
	Title            *string
	Description      *string
	InternalOwner    *string // user id; empty string clears
	Due              *string // RFC 3339 with offset; empty string clears
}

type BulkCommitCmd struct {
	ActorID    string
	MatterID   string
	AttemptKey string // UUIDv7 grouping one bulk attempt
	Rows       []BulkRowChange
}

type ImportPreviewCmd struct {
	ActorID    string
	MatterID   string
	SourceName string
	Format     string // csv | xlsx
	Content    []byte
}

type ImportCommitCmd struct {
	ActorID    string
	MatterID   string
	RunKey     string // UUIDv7
	SourceName string
	Format     string
	Content    []byte
	// RowKeys maps each file row key to its per-row UUIDv7 idempotency key
	// (lost-response recovery). RULE-014 dedupe rides the import_sources registry.
	RowKeys map[string]string
}

type ExportQuery struct {
	ActorID  string
	MatterID string
	Format   string // xlsx | csv
}

// ExportResult is the scoped export table plus its provenance boundary.
type ExportResult struct {
	Rows      [][]string
	AsOf      time.Time
	Revision  int64
	Workspace string
}

type BriefQuery struct {
	ActorID  string
	MatterID string
	T1       time.Time
	T2       time.Time
}

// DataOpsService defines the W6 use cases (contract §2.7).
type DataOpsService interface {
	BulkPreview(ctx context.Context, cmd BulkPreviewCmd) (matter.BulkPreviewResult, error)
	BulkCommit(ctx context.Context, cmd BulkCommitCmd) ([]matter.BulkRowResult, error)
	ImportPreview(ctx context.Context, cmd ImportPreviewCmd) (matter.ImportPreviewResult, error)
	ImportCommit(ctx context.Context, cmd ImportCommitCmd) ([]matter.ImportRowResult, error)
	Export(ctx context.Context, q ExportQuery) (matter.ExportResult, error)
	Brief(ctx context.Context, q BriefQuery) (matter.BriefResult, error)
}

// ---------- Outbound (driven): brief replay reads ----------

// ImportRegistry is the optional W6 capability of a matter transaction: the
// RULE-014 (matter, source identity, row key) registry.
type ImportRegistry interface {
	FindImportSource(ctx context.Context, matterID matter.MatterID, sourceName, rowKey string) (*matter.ImportSource, error)
	RegisterImportSource(ctx context.Context, m matter.ImportSource) error
}

// DataOpsSnapshot is implemented by the MatterSnapshot of storage adapters for the
// brief's deterministic replay reads.
type DataOpsSnapshot interface {
	// EventsWindow returns the matter's events with recorded_at in (t1, t2], ordered
	// by (recorded_at, seq), with their after payloads when present.
	EventsWindow(ctx context.Context, m matter.MatterID, t1, t2 time.Time) ([]matter.EventRecord, error)
	// EventsUpTo returns every matter event with recorded_at ≤ t2, ordered by
	// (recorded_at, seq): the input of the outstanding-at-t2 replay.
	EventsUpTo(ctx context.Context, m matter.MatterID, t2 time.Time) ([]matter.EventRecord, error)
	// AsOf instant of the snapshot.
	AsOf() time.Time
}
