package matter

import (
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain"
)

// ExecutionState is a Requirement execution lifecycle state (approved set).
type ExecutionState string

const (
	ExecutionNotStarted ExecutionState = "NOT_STARTED"
	ExecutionInProgress ExecutionState = "IN_PROGRESS"
	ExecutionWaiting    ExecutionState = "WAITING"
	ExecutionCompleted  ExecutionState = "COMPLETED"
	ExecutionCancelled  ExecutionState = "CANCELLED"
)

func (s ExecutionState) Valid() bool {
	switch s {
	case ExecutionNotStarted, ExecutionInProgress, ExecutionWaiting, ExecutionCompleted, ExecutionCancelled:
		return true
	}
	return false
}

// DependencyState summarizes the active dependency situation of a Requirement.
type DependencyState string

const (
	DependencyReady   DependencyState = "READY"
	DependencyBlocked DependencyState = "BLOCKED"
)

func (s DependencyState) Valid() bool { return s == DependencyReady || s == DependencyBlocked }

// VerificationState is a Requirement verification state (approved set).
type VerificationState string

const (
	VerificationNotRequired       VerificationState = "NOT_REQUIRED"
	VerificationUnverified        VerificationState = "UNVERIFIED"
	VerificationPartiallyVerified VerificationState = "PARTIALLY_VERIFIED"
	VerificationVerified          VerificationState = "VERIFIED"
	VerificationDisputed          VerificationState = "DISPUTED"
)

func (s VerificationState) Valid() bool {
	switch s {
	case VerificationNotRequired, VerificationUnverified, VerificationPartiallyVerified,
		VerificationVerified, VerificationDisputed:
		return true
	}
	return false
}

// VerificationApplicability records whether verification applies to a Requirement.
type VerificationApplicability string

const (
	VerificationRequired      VerificationApplicability = "REQUIRED"
	VerificationNotApplicable VerificationApplicability = "NOT_REQUIRED"
)

func (a VerificationApplicability) Valid() bool {
	return a == VerificationRequired || a == VerificationNotApplicable
}

// NodeKind discriminates typed work-graph rows.
type NodeKind string

const (
	NodeRequirement NodeKind = "REQUIREMENT"
	NodeAction      NodeKind = "ACTION"
)

// Requirement is a typed work-graph record. Creation fixes the approved initial state
// (NOT_STARTED / READY / UNVERIFIED with verification REQUIRED, revision 1, proof epoch 0,
// no incoming dependency edge); owner, workstream, due date and links stay unset until
// later commands own them.
type Requirement struct {
	ImportedVerificationClaim *string
	ID                        RequirementID
	MatterID                  MatterID
	Title                     string
	Outcome                   string
	ExecutionState            ExecutionState
	DependencyState           DependencyState
	VerificationState         VerificationState
	VerificationApplicability VerificationApplicability
	ApplicabilityReason       *string
	ProofEpoch                int64
	WorkstreamID              *WorkstreamID
	OwnerActorID              *ActorID
	DueAt                     *time.Time
	Revision                  int64
}

// NewRequirement validates and constructs a Requirement in its initial state.
func NewRequirement(id RequirementID, matterID MatterID, title, outcome string) (Requirement, error) {
	v := &domain.ValidationError{}
	normTitle := normalizeText(title, "title", v)
	normOutcome := normalizeText(outcome, "outcome", v)
	if !idValid(id) {
		v.Add("id", "must be a canonical UUID")
	}
	if !idValid(matterID) {
		v.Add("matterId", "must be a canonical UUID")
	}
	if v.HasErrors() {
		return Requirement{}, v
	}
	return Requirement{
		ID:                        id,
		MatterID:                  matterID,
		Title:                     normTitle,
		Outcome:                   normOutcome,
		ExecutionState:            ExecutionNotStarted,
		DependencyState:           DependencyReady,
		VerificationState:         VerificationUnverified,
		VerificationApplicability: VerificationRequired,
		ProofEpoch:                0,
		Revision:                  1,
	}, nil
}

func idValid[T ~string](id T) bool { return uuidValid(string(id)) }

// normalizeText trims surrounding whitespace and rejects blank or NUL-containing text.
// There is deliberately no length cap: no business limit is approved for this slice.
func normalizeText(raw, field string, v *domain.ValidationError) string {
	s := strings.TrimSpace(raw)
	switch {
	case s == "":
		v.Add(field, "is required")
	case strings.ContainsRune(s, 0):
		v.Add(field, "must not contain NUL characters")
	}
	return s
}

// RequirementCreatedEvent is the typed history entry appended with every committed
// create. History is obligatory for every successful command, independent of any
// event-sink configuration.
type RequirementCreatedEvent struct {
	EventID        string
	MatterID       MatterID
	TargetID       RequirementID
	Actor          ActorID
	IdempotencyKey IdempotencyKey
	Seq            int64
	EffectiveAt    time.Time
	RecordedAt     time.Time
	Requirement    Requirement
}

// RequirementCreatedResult is the immutable outcome snapshot stored with the receipt and
// returned unchanged on replay. Replayed is false in stored snapshots; the service marks
// a replayed copy so boundaries can distinguish it.
type RequirementCreatedResult struct {
	Requirement    Requirement
	Seq            int64
	RecordedAt     time.Time
	IdempotencyKey IdempotencyKey
	RequestHash    RequestHash
	Replayed       bool
}

// RequirementRead is an authorized read of a Requirement from one snapshot.
type RequirementRead struct {
	Requirement    Requirement
	AsOf           time.Time
	SourceRevision int64
}
