package matter

import "time"

// PartyID identifies an external party reference within a matter.
type PartyID string

// MilestoneID identifies a milestone within a matter.
type MilestoneID string

func (id PartyID) String() string     { return string(id) }
func (id MilestoneID) String() string { return string(id) }

// GateKind says what an edge requires of its upstream node (RULE-003).
type GateKind string

const (
	// GateCompletion requires the upstream execution to be COMPLETED.
	GateCompletion GateKind = "COMPLETION"
	// GateProof additionally requires the upstream verification to be VERIFIED.
	GateProof GateKind = "PROOF"
)

func (g GateKind) Valid() bool { return g == GateCompletion || g == GateProof }

// Edge is a directed prerequisite: Target needs Source to satisfy Gate. Incoming edges of
// one target combine with AND in P0.
type Edge struct {
	ID       string
	MatterID MatterID
	Source   NodeID
	Target   NodeID
	Gate     GateKind
}

// GateReasonCode names why one incoming edge is not satisfied.
type GateReasonCode string

const (
	ReasonUpstreamBlocked GateReasonCode = "UPSTREAM_BLOCKED"
	ReasonNotCompleted    GateReasonCode = "NOT_COMPLETED"
	ReasonCancelled       GateReasonCode = "CANCELLED"
	ReasonNotVerified     GateReasonCode = "NOT_VERIFIED"
)

// GateReason is one failed incoming gate of a BLOCKED node. The completion gate and the
// proof gate are always distinguishable.
type GateReason struct {
	EdgeID string
	Source NodeID
	Gate   GateKind
	Code   GateReasonCode
}

// WorkItem is the typed work-graph record shared by Requirements and Actions. Requirement
// is not Action (RULE-001): Kind keeps them apart everywhere they are stored or shown.
type WorkItem struct {
	ID       NodeID
	Kind     NodeKind
	MatterID MatterID

	// ImportedVerificationClaim retains the source label; it never grants verification.
	ImportedVerificationClaim *string

	Title   string
	Outcome string

	Execution         ExecutionState
	Dependency        DependencyState
	DependencyReasons []GateReason

	// ProofRequired is always true for a Requirement; an Action carries proof only when
	// explicitly required. Verification is empty when proof is not required.
	ProofRequired       bool
	Verification        VerificationState
	Applicability       VerificationApplicability
	ApplicabilityReason *string
	ProofEpoch          int64
	ProofEpochOpenedAt  *time.Time

	WorkstreamID *WorkstreamID
	OwnerActorID *ActorID
	DueAt        *time.Time

	CompletedAt *time.Time
	CancelledAt *time.Time

	// WaitingPartyID/WaitingCondition are set exactly while Execution is WAITING.
	WaitingPartyID   *PartyID
	WaitingCondition *string

	// EscalationReason marks an explicit OWNER critical escalation (RULE-010).
	EscalationReason *string

	// NegativeOpen is DERIVED (never stored): a filing with an unresolved rejection/withdrawal in
	// its current proof epoch. It raises attention only.
	NegativeOpen bool

	Revision int64
}

// Terminal reports a COMPLETED or CANCELLED execution.
func (w WorkItem) Terminal() bool {
	return w.Execution == ExecutionCompleted || w.Execution == ExecutionCancelled
}

// Workstream groups work items; it is organizational, not an access boundary.
type Workstream struct {
	ID       WorkstreamID
	MatterID MatterID
	Name     string
	Revision int64
}

// Party is an external party reference (FR-017): context only. It never grants an account
// or a role.
type Party struct {
	ID       PartyID
	MatterID MatterID
	Name     string
	Kind     string
	Contact  string
	Notes    string
	Revision int64
}

// Milestone declares which Requirements must be satisfied for it to be ready (RULE-008).
type Milestone struct {
	ID       MilestoneID
	MatterID MatterID
	Name     string
	DueAt    *time.Time
	// Critical designates the chain whose unsatisfied prerequisites are CRITICAL (RULE-010).
	Critical bool
	// Prerequisites are the explicitly designated required Requirements.
	Prerequisites []NodeID
	Revision      int64
}

// WorkGraph is everything the derived-state rules need, read in one consistent snapshot.
type WorkGraph struct {
	MatterID    MatterID
	Items       []WorkItem
	Edges       []Edge
	Workstreams []Workstream
	Parties     []Party
	Milestones  []Milestone
	// Evidence is everything the verification rules read (criteria, proof, assessments, documents).
	Evidence EvidenceSet
	// Filing holds the filing-specific rows of the ACTION items that are regulatory filings.
	Filing FilingSet
	// Context holds the matter's Decision/Finding/Risk/Entity records.
	Context ContextSet
}

// Item returns the work item with the given id.
func (g WorkGraph) Item(id NodeID) (WorkItem, bool) {
	for _, it := range g.Items {
		if it.ID == id {
			return it, true
		}
	}
	return WorkItem{}, false
}

// WorkEvent is one append-only history row written by a work command. Before/After are the
// command-owned JSON payloads; CauseSeq links a derived change to the event that caused it.
type WorkEvent struct {
	MatterID    MatterID
	Seq         int64
	ID          string
	Type        string
	TargetKind  string
	TargetID    string
	Actor       ActorID
	Reason      string
	CauseSeq    *int64
	Before      []byte
	After       []byte
	EffectiveAt time.Time
	RecordedAt  time.Time
}

// RejectedError is a guarded domain refusal: nothing was mutated. Code is stable; the
// boundary renders it as a conflict with the allowed alternatives and the failed gates.
type RejectedError struct {
	Code         string
	Message      string
	Alternatives []ExecutionState
	Gates        []GateReason
	// Path is the cycle that a refused edge would have closed, as node ids.
	Path []NodeID
}

func (e *RejectedError) Error() string { return e.Code + ": " + e.Message }
