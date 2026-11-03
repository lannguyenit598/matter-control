package port

import (
	"context"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Intake (RLF-06) ----------

type ListIntakeQuery struct {
	ActorID  string
	MatterID string
}

// CreateIntakeCmd records the original request inside one existing Matter. OWNER/EDITOR only,
// receipted (§2.1).
type CreateIntakeCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	Title          string
	RequestText    string
	Requester      string
	ReceivedAt     time.Time
	Attachments    []string
}

// TriageIntakeCmd records the accountable disposition. OWNER/EDITOR only, CAS on the record
// revision; a PENDING record may be declined (with the reason) — conversion is the acceptance
// path and carries its own receipt.
type TriageIntakeCmd struct {
	ActorID          string
	MatterID         string
	IntakeID         string
	ExpectedRevision int64
	Decline          bool
	Reason           string
}

// ConvertIntakeCmd converts a triaged-pending record into one real Requirement or Action. The
// conversion is receipted, atomic and idempotent (same key replays; a record that already has
// its work is refused under a new key). The original request text and its provenance stay on
// the intake record; the created work is ordinary authorized work.
type ConvertIntakeCmd struct {
	ActorID        string
	MatterID       string
	IntakeID       string
	IdempotencyKey string
	RequestHash    string
	Kind           string // REQUIREMENT | ACTION
	Title          string
	Outcome        string
	Owner          string // optional ACTIVE matter member
	Due            *time.Time
}

type GetIntakeQuery struct {
	ActorID  string
	MatterID string
	IntakeID string
}

// IntakeSnapshot reads intake records inside one matter snapshot.
type IntakeSnapshot interface {
	ListIntakeRecords(ctx context.Context, m matter.MatterID) ([]matter.IntakeRecord, error)
}

// IntakeTx writes intake records inside the locked matter transaction.
type IntakeTx interface {
	InsertIntakeRecord(ctx context.Context, r matter.IntakeRecord) error
	SaveIntakeRecord(ctx context.Context, r matter.IntakeRecord, expectedRevision int64) error
	LoadIntakeRecord(ctx context.Context, m matter.MatterID, id matter.IntakeID) (matter.IntakeRecord, error)
}

// ---------- Guidance (RLF-07) ----------

type ListGuidanceQuery struct {
	ActorID  string
	MatterID string
}

type GetGuidanceQuery struct {
	ActorID    string
	MatterID   string
	DocumentID string
}

// CreateGuidanceCmd creates a document and its first DRAFT revision. OWNER/EDITOR only,
// receipted.
type CreateGuidanceCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	Title          string
	Body           string
	SourceRefs     []matter.GuidanceSourceRef
}

// AddGuidanceDraftCmd appends one DRAFT revision. OWNER/EDITOR only, receipted (a new draft is
// a new intent; published rows are never touched).
type AddGuidanceDraftCmd struct {
	ActorID        string
	MatterID       string
	DocumentID     string
	IdempotencyKey string
	RequestHash    string
	Body           string
	SourceRefs     []matter.GuidanceSourceRef
}

// PublishGuidanceCmd publishes one exact DRAFT revision as immutable. Matter OWNER only,
// receipted. Publishing changes no legal state.
type PublishGuidanceCmd struct {
	ActorID        string
	MatterID       string
	DocumentID     string
	RevisionID     string
	IdempotencyKey string
	RequestHash    string
}

// GuidanceSnapshot reads guidance inside one matter snapshot (drafts filtered by the caller's
// role at the service boundary).
type GuidanceSnapshot interface {
	ListGuidanceDocuments(ctx context.Context, m matter.MatterID) ([]matter.GuidanceDocument, error)
	ListGuidanceRevisions(ctx context.Context, m matter.MatterID) ([]matter.GuidanceRevision, error)
}

// GuidanceTx writes guidance inside the locked matter transaction.
type GuidanceTx interface {
	InsertGuidanceDocument(ctx context.Context, d matter.GuidanceDocument) error
	InsertGuidanceRevision(ctx context.Context, r matter.GuidanceRevision, refs []byte) error
	PublishGuidanceRevision(ctx context.Context, docID matter.GuidanceDocumentID, revID matter.GuidanceRevisionID, m matter.MatterID, by matter.ActorID, at time.Time) error
	LoadGuidanceRevision(ctx context.Context, m matter.MatterID, id matter.GuidanceRevisionID) (matter.GuidanceRevision, error)
	MaxGuidanceRevisionNo(ctx context.Context, docID matter.GuidanceDocumentID) (int64, error)
}

// IntakeService defines the intake use cases.
type IntakeService interface {
	ListIntake(ctx context.Context, q ListIntakeQuery) ([]matter.IntakeRecord, error)
	GetIntake(ctx context.Context, q GetIntakeQuery) (matter.IntakeRecord, error)
	CreateIntake(ctx context.Context, cmd CreateIntakeCmd) (matter.CreatedResult, error)
	TriageIntake(ctx context.Context, cmd TriageIntakeCmd) (matter.IntakeRecord, error)
	ConvertIntake(ctx context.Context, cmd ConvertIntakeCmd) (record matter.IntakeRecord, created matter.WorkItemCreatedResult, replayed bool, err error)
}

// GuidanceService defines the guidance use cases.
type GuidanceService interface {
	ListGuidance(ctx context.Context, q ListGuidanceQuery) ([]matter.GuidanceDocument, [][]matter.GuidanceRevision, error)
	GetGuidance(ctx context.Context, q GetGuidanceQuery) (matter.GuidanceDocument, []matter.GuidanceRevision, error)
	CreateGuidance(ctx context.Context, cmd CreateGuidanceCmd) (matter.CreatedResult, error)
	AddGuidanceDraft(ctx context.Context, cmd AddGuidanceDraftCmd) (matter.CreatedResult, error)
	PublishGuidance(ctx context.Context, cmd PublishGuidanceCmd) (matter.CreatedResult, error)
}
