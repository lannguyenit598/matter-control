package matter

import "time"

// AsWorkItem converts a W1 Requirement row into the unified typed record.
func (r Requirement) AsWorkItem() WorkItem {
	return WorkItem{
		ID: NodeID(r.ID), Kind: NodeRequirement, MatterID: r.MatterID, Title: r.Title, Outcome: r.Outcome,
		Execution: r.ExecutionState, Dependency: r.DependencyState,
		ProofRequired: true, Verification: r.VerificationState, Applicability: r.VerificationApplicability,
		ImportedVerificationClaim: r.ImportedVerificationClaim, ApplicabilityReason: r.ApplicabilityReason, ProofEpoch: r.ProofEpoch,
		WorkstreamID: r.WorkstreamID, OwnerActorID: r.OwnerActorID, DueAt: r.DueAt, Revision: r.Revision,
	}
}

// AsRequirement converts a unified Requirement record back into the W1 shape.
func (w WorkItem) AsRequirement() Requirement {
	return Requirement{
		ID: RequirementID(w.ID), MatterID: w.MatterID, Title: w.Title, Outcome: w.Outcome,
		ExecutionState: w.Execution, DependencyState: w.Dependency,
		VerificationState: w.Verification, VerificationApplicability: w.Applicability,
		ImportedVerificationClaim: w.ImportedVerificationClaim, ApplicabilityReason: w.ApplicabilityReason, ProofEpoch: w.ProofEpoch,
		WorkstreamID: w.WorkstreamID, OwnerActorID: w.OwnerActorID, DueAt: w.DueAt, Revision: w.Revision,
	}
}

// NewAction builds an Action in its approved initial state: NOT_STARTED, dependency READY,
// no proof required (an Action carries proof only when explicitly required).
func NewAction(id NodeID, matterID MatterID, title, outcome string) (WorkItem, error) {
	r, err := NewRequirement(RequirementID(id), matterID, title, outcome)
	if err != nil {
		return WorkItem{}, err
	}
	it := r.AsWorkItem()
	it.Kind = NodeAction
	it.ProofRequired = false
	it.Verification = ""
	it.Applicability = ""
	return it, nil
}

// WorkItemView is a work item with its derived dimensions at one explicit instant. The
// derived values are never stored or accepted from a client.
type WorkItemView struct {
	Item          WorkItem
	Timing        TimingResult
	Attention     AttentionResult
	CriticalChain bool
}

// ViewOf derives the view of one item inside its graph.
func ViewOf(it WorkItem, asOf time.Time, chain map[NodeID]bool) WorkItemView {
	return WorkItemView{
		Item: it, Timing: TimingOf(it, asOf), CriticalChain: chain[it.ID],
		Attention: AttentionOf(it, asOf, chain[it.ID]),
	}
}

// WorkItemPage is one page of the operational grid.
type WorkItemPage struct {
	Items      []WorkItemView
	Total      int
	NextOffset *int
	AsOf       time.Time
	Revision   int64
}

// EdgeView is one dependency edge with the upstream/downstream record and whether the
// gate is satisfied right now (and why not).
type EdgeView struct {
	Edge      Edge
	Other     WorkItem // the record at the other end
	Satisfied bool
	Reason    GateReasonCode
}

// WorkItemDetail is the item plus its causal neighbourhood (SCR-06): what blocks it and
// what it blocks.
type WorkItemDetail struct {
	View       WorkItemView
	Upstream   []EdgeView
	Downstream []EdgeView
	AsOf       time.Time
	Revision   int64
	// IsFiling marks an Action that is a regulatory filing: its package/signature checklist
	// stays reachable whatever its outcome-verification flag says (BF-02).
	IsFiling bool
	// OutcomeVerification is set for a filing (see Outcome* constants), empty otherwise.
	OutcomeVerification string
}

// AssignedView is one assigned item in My Actions, with its section and source matter.
type AssignedView struct {
	View      WorkItemView
	Class     ActionClass
	MatterID  MatterID
	Revision  int64 // revision of the matter graph the candidate was derived from
	Reason    string
	WaitingOn string
}

// MyActions groups the caller's assigned items; an assignment is never silently a
// recommendation. Counts include only matters the caller can access.
type MyActions struct {
	Next       []AssignedView // ranked eligible Actions (RULE-021)
	Waiting    []AssignedView
	Blocked    []AssignedView
	Historical []AssignedView
	AsOf       time.Time
}

// MilestoneView is a milestone with its readiness.
type MilestoneView struct {
	Milestone Milestone
	Status    MilestoneStatus
}

// WorkItemCreatedResult is the immutable outcome snapshot stored with a create-action receipt
// and returned verbatim on replay.
type WorkItemCreatedResult struct {
	Item       WorkItem
	Seq        int64
	RecordedAt time.Time
	// Replayed stays false in stored snapshots; the service marks replayed copies.
	Replayed bool
}

// CreatedResult is the immutable outcome snapshot of a W3 creation (document, version,
// evidence): which kind of record, its id and the history sequence of the creating event.
type CreatedResult struct {
	Kind       string
	ID         string
	Seq        int64
	RecordedAt time.Time
	Replayed   bool
}

// DocumentDetail is a document with its versions, signature observations and, when a promotion
// was previewed, the impact of that promotion.
type DocumentDetail struct {
	Document   Document
	Versions   []DocumentVersion
	Signatures []SignatureObservation
	// Impact and ImpactToken are set when a promotion target was supplied. The token binds an
	// acknowledgement to exactly this target, expected current version and document revision.
	Impact      *PromotionImpact
	ImpactToken string
	AsOf        time.Time
}

// ProofChecklist is the proof view of one subject: its criteria with their status (gaps included),
// the evidence offered for them, the derived aggregate and who may verify.
type ProofChecklist struct {
	Subject      WorkItem
	Result       VerificationResult
	Evidence     []Evidence
	Verifiers    []ActorID
	OpenDisputes []Dispute
	Dependencies []NodeID // records whose dependency now depends on this subject's proof
	AsOf         time.Time
}
