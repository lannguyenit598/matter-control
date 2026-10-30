package port

import (
	"context"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Inbound: W4 regulatory filings ----------
//
// Receipt participation (contract §2.1/§2.5): CreateFiling is a receipted creation. Every stage
// command is guarded by the filing item's revision (If-Match) and is NEVER resent after an unknown
// outcome: the caller re-reads the filing, whose append-only observations show what was recorded.

type CreateFilingCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	Title          string
	Outcome        string
	// RequirementID is the filing obligation this filing serves (a Requirement of this matter).
	RequirementID string
	// AuthorityPartyID is the external authority (an external party of this matter).
	AuthorityPartyID string
	OwnerID          string
	ProofRequired    bool
}

type AdvanceFilingCmd struct {
	ActorID          string
	MatterID         string
	FilingID         string
	ExpectedRevision int64
	To               string
	Reference        string
	ObservedAt       string // RFC 3339 with offset; empty = now
	EvidenceIDs      []string
	VersionIDs       []string
	ExternalRefs     []string
	RequestRef       string
	CycleOwnerID     string
	CycleDue         string // RFC 3339 with offset
	Reason           string
}

type RecordNegativeCmd struct {
	ActorID          string
	MatterID         string
	FilingID         string
	ExpectedRevision int64
	Outcome          string // REJECTED | WITHDRAWN
	Reference        string
	ObservedAt       string
	EvidenceIDs      []string
}

// ReasonedFilingCmd is a reason-carrying owner command: close a negative filing, or reopen a closed one.
type ReasonedFilingCmd struct {
	ActorID          string
	MatterID         string
	FilingID         string
	ExpectedRevision int64
	Reason           string
}

// SetFilingSignatureApplicabilityCmd is the OWNER-only applicability decision (F03): signatures do
// not apply to this filing (or, with SignatureNotRequired=false, the decision is withdrawn). The
// reason is retained with the decider and instant. It is guarded by the filing revision.
type SetFilingSignatureApplicabilityCmd struct {
	ActorID              string
	MatterID             string
	FilingID             string
	ExpectedRevision     int64
	SignatureNotRequired bool
	Reason               string
}

type CorrectObservationCmd struct {
	ActorID          string
	MatterID         string
	FilingID         string
	ExpectedRevision int64
	ObservationID    string
	Reference        string
	ObservedAt       string
	Reason           string
}

type FilingQuery struct {
	ActorID  string
	MatterID string
	FilingID string
}

// FilingService defines the W4 use cases.
type FilingService interface {
	CreateFiling(ctx context.Context, cmd CreateFilingCmd) (matter.CreatedResult, error)
	Advance(ctx context.Context, cmd AdvanceFilingCmd) (matter.FilingDetail, error)
	RecordNegative(ctx context.Context, cmd RecordNegativeCmd) (matter.FilingDetail, error)
	CloseNegative(ctx context.Context, cmd ReasonedFilingCmd) (matter.FilingDetail, error)
	Reopen(ctx context.Context, cmd ReasonedFilingCmd) (matter.FilingDetail, error)
	CorrectObservation(ctx context.Context, cmd CorrectObservationCmd) (matter.FilingDetail, error)
	SetSignatureApplicability(ctx context.Context, cmd SetFilingSignatureApplicabilityCmd) (matter.FilingDetail, error)

	ListFilings(ctx context.Context, q MatterListQuery) ([]matter.FilingSummary, error)
	GetFiling(ctx context.Context, q FilingQuery) (matter.FilingDetail, error)
}

// FilingTx is implemented by the MatterTx of storage adapters. Observations and submissions are
// insert-only; the filing row and a cycle's submission mark are the only updates.
type FilingTx interface {
	// InsertFilingAction inserts the ACTION node with its proof columns (ProofRequired may be true).
	InsertFilingAction(ctx context.Context, item matter.WorkItem, f matter.Filing) error
	SaveFiling(ctx context.Context, f matter.Filing) error
	InsertCycle(ctx context.Context, c matter.FilingCycle) error
	MarkCycleSubmitted(ctx context.Context, itemID matter.NodeID, cycleNo int, submissionID string, at time.Time) error
	InsertSubmission(ctx context.Context, s matter.FilingSubmission) error
	InsertObservation(ctx context.Context, o matter.FilingObservation) error
}
