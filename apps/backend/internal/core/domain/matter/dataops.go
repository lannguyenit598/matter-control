package matter

import "time"

// W6 data-operations values. Receipts for bulk/import rows extend the immutable
// receipt store; SnapshotKind discriminates the payload (contract §2.7).

const (
	SnapshotBulkRowApplied   SnapshotKind = "BULK_ROW_APPLIED"
	SnapshotImportRowApplied SnapshotKind = "IMPORT_ROW_APPLIED"
)

// BulkRowApplied is the immutable outcome snapshot of one bulk-edit row. ContentHash
// pins the requested change set so a same-key retry with a different change is a
// key-reuse, never a silent different write.
type BulkRowApplied struct {
	ItemID      string
	Kind        string
	Revision    int64 // item revision AFTER the applied change
	ContentHash string
}

// ImportRowApplied is the immutable outcome snapshot of one imported row.
type ImportRowApplied struct {
	ItemID      string
	Kind        string
	RowKey      string
	SourceName  string
	ContentHash string
	Revision    int64
	RecordedAt  time.Time
} // BulkRowStatus is the per-row outcome class of a bulk commit.
type BulkRowStatus string

const (
	BulkRowSuccess  BulkRowStatus = "SUCCESS"
	BulkRowReplayed BulkRowStatus = "SUCCESS_REPLAYED"
	BulkRowFailure  BulkRowStatus = "FAILURE"
	BulkRowUnknown  BulkRowStatus = "UNKNOWN"
)

// BulkRowResult is one row of a bulk commit response.
type BulkRowResult struct {
	RowKey   string
	ItemID   string
	Status   BulkRowStatus
	Code     string // failure code: stale | unknown-item | role | not-a-member | validation | key-reuse
	Revision int64  // item revision after a successful apply
	Detail   string
}

// BulkPreviewRow is one row of a bulk preview: current authorized values plus the
// requested change and its validity. Preview never mutates.
type BulkPreviewRow struct {
	RowKey   string
	ItemID   string
	Found    bool
	Title    string
	Outcome  string
	Owner    *string
	Due      *time.Time
	Revision int64
	Valid    bool
	Code     string
}

// BulkPreviewResult is the whole preview: content-hash pinned (previewId).
type BulkPreviewResult struct {
	PreviewID string
	Rows      []BulkPreviewRow
	AsOf      time.Time
}

// ImportRowPlan is one validated import row.
type ImportRowPlan struct {
	ImportedVerificationClaim *string
	RowKey                    string
	Kind                      string // REQUIREMENT | ACTION
	Title                     string
	Outcome                   string
	Owner                     *string
	Due                       *time.Time
	Dependencies              []string // other row keys or existing item ids
	ContentHash               string
	Errors                    []string
}

// ImportGroup is a connected set of rows (via dependency references). A group with
// any invalid row is rejected whole; independent valid groups may commit.
type ImportGroup struct {
	ID     int
	RowIdx []int
	Valid  bool
}

// ImportPreviewResult is the whole preview: mapped rows, errors, groups, limits.
type ImportPreviewResult struct {
	SourceName string
	Rows       []ImportRowPlan
	Groups     []ImportGroup
	AsOf       time.Time
}

// ImportRowStatus is the per-row outcome class of an import commit.
type ImportRowStatus string

const (
	ImportRowSuccess  ImportRowStatus = "SUCCESS"
	ImportRowReplayed ImportRowStatus = "SUCCESS_REPLAYED"
	ImportRowFailure  ImportRowStatus = "FAILURE"
	ImportRowUnknown  ImportRowStatus = "UNKNOWN"
)

// ImportRowResult is one row of an import commit response.
type ImportRowResult struct {
	RowKey      string
	ItemID      string
	Status      ImportRowStatus
	Code        string
	ContentHash string
	Detail      string
}

// ImportSource is the RULE-014 registry row: (matter, source identity, row key)
// identifies one imported record; content hash decides replay vs conflict.
type ImportSource struct {
	MatterID        MatterID
	SourceName      string
	RowKey          string
	ItemID          string
	ContentHash     string
	FirstImportedAt time.Time
}

// ExportResult is the scoped export table plus its provenance boundary.
type ExportResult struct {
	Rows     [][]string
	AsOf     time.Time
	Revision int64
}

// BriefChange is one matter event inside the (t1,t2] window.
type BriefChange struct {
	Seq        int64
	ID         string
	Type       string
	TargetKind string
	TargetID   string
	ActorID    *string
	Reason     *string
	RecordedAt time.Time
	// EffectiveAt is when the fact took effect. LateRecorded is true when it took effect at or
	// before the baseline t1 but was only recorded inside the window (recorded-time semantics).
	EffectiveAt  time.Time
	LateRecorded bool
	SourceRev    int64 // matter event_seq after the event (changes.fence of the event batch)
}

// BriefOutstandingItem is one work item reconstructed as of t2 by event replay.
type BriefOutstandingItem struct {
	ItemID       string
	Kind         string
	Title        string
	Outcome      string
	Owner        *string
	Due          *time.Time
	Execution    string
	Dependency   string
	Verification string
	Revision     int64
	// ProofExpired is true when an acceptance that was current at t2 had expired by t2: the
	// recorded verification relied on proof that no longer counts at that instant.
	ProofExpired bool
}

// BriefResult is the delta brief: recorded changes in (t1,t2] separate from the
// outstanding work items as of t2 (FR-019/RULE-016/AC-138).
type BriefResult struct {
	MatterID    MatterID
	T1          time.Time
	T2          time.Time
	Changes     []BriefChange
	Outstanding []BriefOutstandingItem
	AsOf        time.Time
}
