package matter

import (
	"fmt"
	"sort"
	"strings"
	"time"
)

// A Filing records what is known about a regulatory filing; MatterControl files nothing
// (RULE-012). It is an ACTION work item (execution, dependencies, timing, waiting, proof epochs and
// evidence criteria are the shared machinery) plus the stage, cycles, submissions and observations
// below. A stage change is only ever an appended observation; history is never rewritten.

type FilingStage string

const (
	StageRequirement FilingStage = "REQUIREMENT"
	StagePackage     FilingStage = "PACKAGE_PREPARATION"
	StageSignature   FilingStage = "SIGNATURE"
	StageSubmission  FilingStage = "SUBMISSION"
	StageReceipt     FilingStage = "RECEIPT"
	StageReview      FilingStage = "AUTHORITY_REVIEW"
	StageSupplement  FilingStage = "SUPPLEMENT"
	StageResponse    FilingStage = "RESPONSE"
	StageApproval    FilingStage = "APPROVAL"
)

// FilingStages lists the approved stages in flow order.
func FilingStages() []FilingStage {
	return []FilingStage{
		StageRequirement, StagePackage, StageSignature, StageSubmission, StageReceipt,
		StageReview, StageSupplement, StageResponse, StageApproval,
	}
}

func (s FilingStage) Valid() bool {
	for _, x := range FilingStages() {
		if x == s {
			return true
		}
	}
	return false
}

// NextStages is the closed set of allowed stage changes from s. Every other ordered pair is refused.
func NextStages(s FilingStage) []FilingStage {
	switch s {
	case StageRequirement:
		return []FilingStage{StagePackage}
	case StagePackage:
		return []FilingStage{StageSignature}
	case StageSignature:
		return []FilingStage{StageSubmission}
	case StageSubmission:
		return []FilingStage{StageReceipt}
	case StageReceipt:
		return []FilingStage{StageReview}
	case StageReview:
		return []FilingStage{StageSupplement, StageApproval}
	case StageSupplement:
		return []FilingStage{StageResponse}
	case StageResponse:
		return []FilingStage{StageReview, StageApproval}
	case StageApproval:
		// A reopened, approved filing may be approved again on new outcome evidence.
		return []FilingStage{StageApproval}
	}
	return nil
}

type NegativeOutcome string

const (
	OutcomeRejected  NegativeOutcome = "REJECTED"
	OutcomeWithdrawn NegativeOutcome = "WITHDRAWN"
)

func (o NegativeOutcome) Valid() bool { return o == OutcomeRejected || o == OutcomeWithdrawn }

// Filing is the filing-specific part of an ACTION work item (same id).
type Filing struct {
	ItemID           NodeID
	MatterID         MatterID
	RequirementID    NodeID  // the filing obligation this filing serves; never auto-completed
	AuthorityPartyID PartyID // the external authority
	Stage            FilingStage
	// NegativeOutcome is set by a recorded rejection/withdrawal; NegativeEpoch is the proof epoch it
	// was recorded in. Approval is refused while it equals the current epoch.
	NegativeOutcome NegativeOutcome
	NegativeEpoch   int64
	CurrentCycle    int
	// SignatureNotRequired is the explicit OWNER applicability decision (RULE-012):
	// signatures do not apply to this filing, with the retained rationale, by whom and
	// when. It is independent of the outcome-verification flag (F03): an editor's
	// proofRequired=false never waives the package/signature guards.
	SignatureNotRequired       bool
	SignatureNotRequiredReason string
	SignatureNotRequiredBy     ActorID
	SignatureNotRequiredAt     time.Time
}

// FilingCycle counts authority request rounds (1 = the initial filing). Cycles and proof epochs
// are independent: a reopen opens no cycle.
type FilingCycle struct {
	ID           string
	MatterID     MatterID
	ItemID       NodeID
	No           int
	OpenedInEp   int64
	RequestRef   string
	Owner        *ActorID
	DueAt        *time.Time
	OpenedAt     time.Time
	SubmittedAt  *time.Time // when this cycle's submission was recorded
	SubmissionID string
}

// FilingSubmission is the immutable exact set of versions/references submitted in one cycle.
type FilingSubmission struct {
	ID           string
	MatterID     MatterID
	ItemID       NodeID
	CycleNo      int
	Reference    string
	SubmittedAt  time.Time
	Versions     []VersionID
	ExternalRefs []string
	RecordedBy   ActorID
	RecordedAt   time.Time
}

type ObservationKind string

const (
	ObsStage         ObservationKind = "STAGE"
	ObsNegative      ObservationKind = "NEGATIVE_OUTCOME"
	ObsCloseNegative ObservationKind = "CLOSE_NEGATIVE"
	ObsReopen        ObservationKind = "REOPEN"
	ObsCorrection    ObservationKind = "CORRECTION"
)

// FilingObservation is append-only. ObservedAt is the effective time of the fact; RecordedAt is
// when it was entered. A correction links to what it corrects and never edits it.
type FilingObservation struct {
	ID          string
	MatterID    MatterID
	ItemID      NodeID
	Seq         int
	Kind        ObservationKind
	From, To    FilingStage
	Reference   string
	ObservedAt  time.Time
	Evidence    []EvidenceID
	Actor       ActorID
	Reason      string
	CorrectsID  string
	Outcome     NegativeOutcome
	RecordedAt  time.Time
	CycleNo     int
	ProofEpoch  int64
	Description string
}

// FilingSet is everything the filing rules read, in the work graph's snapshot.
type FilingSet struct {
	Filings      []Filing
	Cycles       []FilingCycle
	Submissions  []FilingSubmission
	Observations []FilingObservation
}

// Of returns the filing whose work item is id.
func (s FilingSet) Of(id NodeID) (Filing, bool) {
	for _, f := range s.Filings {
		if f.ItemID == id {
			return f, true
		}
	}
	return Filing{}, false
}

// For returns one filing's rows in order.
func (s FilingSet) For(id NodeID) (cycles []FilingCycle, subs []FilingSubmission, obs []FilingObservation) {
	for _, c := range s.Cycles {
		if c.ItemID == id {
			cycles = append(cycles, c)
		}
	}
	for _, x := range s.Submissions {
		if x.ItemID == id {
			subs = append(subs, x)
		}
	}
	for _, o := range s.Observations {
		if o.ItemID == id {
			obs = append(obs, o)
		}
	}
	sort.Slice(cycles, func(i, j int) bool { return cycles[i].No < cycles[j].No })
	sort.Slice(subs, func(i, j int) bool { return subs[i].RecordedAt.Before(subs[j].RecordedAt) })
	sort.Slice(obs, func(i, j int) bool { return obs[i].Seq < obs[j].Seq })
	return
}

// AdvanceInput is one requested stage change with the facts that support it.
type AdvanceInput struct {
	To           FilingStage
	Reference    string
	ObservedAt   time.Time // effective time of the observed fact; zero = AsOf
	EvidenceIDs  []EvidenceID
	VersionIDs   []VersionID
	ExternalRefs []string
	RequestRef   string
	CycleOwner   *ActorID
	CycleDue     *time.Time
	Reason       string
	Actor        ActorID
	Role         MatterRole
	AsOf         time.Time
}

// AdvanceDecision is the accepted outcome of a stage change. IDs are assigned by the service.
type AdvanceDecision struct {
	Filing      Filing
	Item        WorkItem
	Observation FilingObservation
	NewCycle    *FilingCycle
	Submission  *FilingSubmission
	// CloseCycle is the cycle number whose submission this change records.
	CloseCycle int
}

func guardFailed(code, msg string) error { return &RejectedError{Code: code, Message: msg} }

// unsatisfied lists the mandatory criteria of the filing that are not currently satisfied, with the
// reason, so a refusal says exactly what is missing (AC-145).
func unsatisfied(it WorkItem, set EvidenceSet, asOf time.Time) []string {
	// F03: mandatory package/signature criteria bind every filing; the outcome-
	// verification flag no longer suppresses this check. An OWNER no-signature
	// applicability decision is the only waiver, and it is recorded on the filing.
	// BF-01: only PACKAGE criteria gate submission; an OUTCOME criterion is the authority's
	// future decision and is verified after the fact.
	var out []string
	for _, c := range EvaluateVerification(it, set, asOf).Criteria {
		if c.Criterion.EffectivePurpose() == PurposePackage && c.Criterion.Mandatory && !c.Criterion.Retired && !c.Satisfied {
			out = append(out, fmt.Sprintf("%s (%s)", c.Criterion.Title, c.Reason))
		}
	}
	return out
}

func existingEvidence(set EvidenceSet, ids []EvidenceID, notBefore *time.Time) error {
	if len(ids) == 0 {
		return guardFailed("evidence-required", "name at least one piece of evidence that records this fact")
	}
	for _, id := range ids {
		e, ok := set.evidence(id)
		if !ok {
			return guardFailed("unknown-evidence", "that evidence does not exist in this matter")
		}
		if e.WithdrawnAt != nil {
			return guardFailed("evidence-withdrawn", "withdrawn evidence cannot support a filing fact")
		}
		if notBefore != nil && e.SubmittedAt.Before(*notBefore) {
			return guardFailed("evidence-before-reopen", "evidence recorded before the filing was reopened cannot support a new outcome")
		}
	}
	return nil
}

func existingVersions(set EvidenceSet, ids []VersionID) error {
	for _, id := range ids {
		found := false
		for _, v := range set.Versions {
			if v.ID == id {
				found = true
			}
		}
		if !found {
			return guardFailed("unknown-version", "a submitted version does not exist in this matter")
		}
	}
	return nil
}

// couple moves the execution axis for a stage, in the same transaction as the observation. It
// reuses the approved transition table, so every guard (dependency, owner, waiting details) holds.
func couple(it WorkItem, want ExecutionState, party PartyID, cond string, in AdvanceInput) (WorkItem, error) {
	if want == ExecutionWaiting && it.Execution == ExecutionWaiting {
		p, c := party, cond
		it.WaitingPartyID, it.WaitingCondition = &p, &c
		return it, nil
	}
	if want == ExecutionInProgress && it.Execution == ExecutionInProgress {
		return it, nil
	}
	req := TransitionRequest{Item: it, To: want, Role: in.Role, Reason: in.Reason, AsOf: in.AsOf}
	if want == ExecutionWaiting {
		p := party
		req.WaitingPartyID, req.WaitingCondition = &p, cond
	}
	if want == ExecutionCompleted {
		at := in.ObservedAt
		req.CompletedAt = &at
		if strings.TrimSpace(req.Reason) == "" {
			req.Reason = "filing approved by the authority"
		}
	}
	res, err := DecideTransition(req)
	if err != nil {
		return it, err
	}
	return res.Item, nil
}

// DecideAdvance applies the approved stage machine. It is pure: the caller persists the decision.
func DecideAdvance(f Filing, it WorkItem, set EvidenceSet, fs FilingSet, in AdvanceInput) (AdvanceDecision, error) {
	if it.Terminal() {
		return AdvanceDecision{}, guardFailed("filing-closed", "this filing is "+strings.ToLower(string(it.Execution))+"; an owner must reopen it first")
	}
	allowed := false
	for _, n := range NextStages(f.Stage) {
		if n == in.To {
			allowed = true
		}
	}
	if !allowed {
		return AdvanceDecision{}, &RejectedError{
			Code:    "transition-not-allowed",
			Message: fmt.Sprintf("a filing cannot move from %s to %s; allowed: %v", f.Stage, in.To, NextStages(f.Stage)),
		}
	}
	if f.Stage == StageApproval && it.Execution != ExecutionInProgress {
		return AdvanceDecision{}, guardFailed("transition-not-allowed", "an approved filing can only be approved again after an owner reopened it")
	}
	if in.ObservedAt.IsZero() {
		in.ObservedAt = in.AsOf
	}
	if in.ObservedAt.After(in.AsOf) {
		return AdvanceDecision{}, guardFailed("observed-in-future", "an observation cannot be dated after the recorded time")
	}
	in.Reference = strings.TrimSpace(in.Reference)

	out := AdvanceDecision{Filing: f, Item: it}
	out.Filing.Stage = in.To
	var err error
	switch in.To {
	case StagePackage:
		if it.OwnerActorID == nil {
			return out, guardFailed("owner-required", "assign an owner before package preparation starts")
		}
		// F03: every filing declares its package criteria before package preparation. Neither the
		// editor's outcome-verification flag nor the OWNER's no-signature decision waives this:
		// "no signatures" never means "no package".
		n := 0
		for _, c := range set.Criteria {
			if c.SubjectID == it.ID && !c.Retired {
				n++
			}
		}
		if n == 0 {
			return out, guardFailed("package-criteria-required", "declare the package criteria first")
		}
		out.Item, err = couple(it, ExecutionInProgress, f.AuthorityPartyID, "", in)

	case StageSignature:
		if len(in.VersionIDs)+len(in.ExternalRefs) == 0 {
			return out, guardFailed("package-contents-required", "identify the versions or references the package will contain")
		}
		if err = existingVersions(set, in.VersionIDs); err == nil {
			out.Item, err = couple(it, ExecutionInProgress, f.AuthorityPartyID, "", in)
		}

	case StageSubmission, StageResponse:
		if missing := unsatisfied(it, set, in.AsOf); len(missing) > 0 {
			return out, guardFailed("guard-failed", "package criteria are not satisfied: "+strings.Join(missing, "; "))
		}
		// F03: a proof-required filing proves its signatures through its mandatory criteria (checked
		// above; the OWNER may retire the signature criterion with a reason). A no-proof filing has
		// no signature criterion to retire, so it needs a signature observed on a submitted version
		// or the OWNER's explicit no-signature decision. Either way something must be shown: the
		// editor's choice about outcome proof never waives the signature requirement.
		if !f.SignatureNotRequired && !it.ProofRequired {
			signed := false
			for _, so := range set.Signatures {
				for _, v := range in.VersionIDs {
					signed = signed || so.VersionID == v
				}
			}
			if !signed {
				return out, guardFailed("signature-required", "no signature observation covers the submitted versions; record the signature or an OWNER no-signature applicability decision")
			}
		}
		if in.Reference == "" {
			return out, guardFailed("reference-required", "the submission reference is required")
		}
		if len(in.VersionIDs)+len(in.ExternalRefs) == 0 {
			return out, guardFailed("package-contents-required", "name the exact versions that were submitted")
		}
		if err = existingVersions(set, in.VersionIDs); err != nil {
			return out, err
		}
		sub := FilingSubmission{
			MatterID: f.MatterID, ItemID: f.ItemID, CycleNo: f.CurrentCycle, Reference: in.Reference, SubmittedAt: in.ObservedAt,
			Versions: in.VersionIDs, ExternalRefs: in.ExternalRefs, RecordedBy: in.Actor, RecordedAt: in.AsOf,
		}
		out.Submission, out.CloseCycle = &sub, f.CurrentCycle
		if in.To == StageSubmission {
			// Submitted is not completed: the filing now waits for the authority's acknowledgement.
			out.Item, err = couple(it, ExecutionWaiting, f.AuthorityPartyID, "acknowledgement outstanding", in)
		} else {
			out.Item, err = couple(it, ExecutionInProgress, f.AuthorityPartyID, "", in)
		}

	case StageReceipt:
		if err = existingEvidence(set, in.EvidenceIDs, nil); err == nil {
			out.Item, err = couple(it, ExecutionInProgress, f.AuthorityPartyID, "", in)
		}

	case StageReview:
		out.Item, err = couple(it, ExecutionWaiting, f.AuthorityPartyID, "awaiting the authority's decision", in)

	case StageSupplement:
		if strings.TrimSpace(in.RequestRef) == "" || in.CycleOwner == nil || in.CycleDue == nil {
			return out, guardFailed("supplement-details-required", "a supplement needs the authority's request reference, an owner and a due date")
		}
		next := FilingCycle{
			MatterID: f.MatterID, ItemID: f.ItemID, No: f.CurrentCycle + 1, OpenedInEp: it.ProofEpoch,
			RequestRef: strings.TrimSpace(in.RequestRef), Owner: in.CycleOwner, DueAt: in.CycleDue, OpenedAt: in.ObservedAt,
		}
		out.NewCycle = &next
		out.Filing.CurrentCycle = next.No
		out.Item, err = couple(it, ExecutionInProgress, f.AuthorityPartyID, "", in)

	case StageApproval:
		if f.NegativeOutcome != "" && f.NegativeEpoch == it.ProofEpoch {
			return out, guardFailed("negative-outcome-open", "a rejection or withdrawal is recorded; an owner must reopen the filing before approval")
		}
		// Outcome evidence must post-date the latest reopen (also for filings without proof epochs).
		var notBefore *time.Time
		if it.ProofEpoch > 0 {
			notBefore = it.ProofEpochOpenedAt
		}
		for _, o := range fs.Observations {
			if o.ItemID == f.ItemID && o.Kind == ObsReopen && (notBefore == nil || o.RecordedAt.After(*notBefore)) {
				t := o.RecordedAt
				notBefore = &t
			}
		}
		if err = existingEvidence(set, in.EvidenceIDs, notBefore); err == nil {
			out.Item, err = couple(it, ExecutionCompleted, f.AuthorityPartyID, "", in)
		}
	}
	if err != nil {
		return out, err
	}
	out.Observation = FilingObservation{
		MatterID: f.MatterID, ItemID: f.ItemID, Kind: ObsStage, From: f.Stage, To: in.To, Reference: in.Reference,
		ObservedAt: in.ObservedAt, Evidence: in.EvidenceIDs, Actor: in.Actor, Reason: strings.TrimSpace(in.Reason),
		RecordedAt: in.AsOf, CycleNo: out.Filing.CurrentCycle, ProofEpoch: it.ProofEpoch,
	}
	return out, nil
}

// negativeStages are the stages at which an authority can already have answered.
func negativeAllowed(s FilingStage) bool {
	switch s {
	case StageSubmission, StageReceipt, StageReview, StageSupplement, StageResponse:
		return true
	}
	return false
}

// DecideNegative records a rejection or withdrawal. The stage never changes and the filing is never
// approved by it; attention is raised until an owner closes or reopens the filing.
func DecideNegative(f Filing, it WorkItem, set EvidenceSet, kind NegativeOutcome, evidence []EvidenceID, reference string, observedAt time.Time, actor ActorID, asOf time.Time) (Filing, FilingObservation, error) {
	if !kind.Valid() {
		return f, FilingObservation{}, guardFailed("invalid-outcome", "the outcome must be REJECTED or WITHDRAWN")
	}
	if it.Terminal() {
		return f, FilingObservation{}, guardFailed("filing-closed", "this filing is already closed")
	}
	if !negativeAllowed(f.Stage) {
		return f, FilingObservation{}, guardFailed("not-submitted", "nothing has been submitted yet, so there is nothing to reject or withdraw")
	}
	if observedAt.IsZero() {
		observedAt = asOf
	}
	if observedAt.After(asOf) {
		return f, FilingObservation{}, guardFailed("observed-in-future", "an observation cannot be dated after the recorded time")
	}
	if err := existingEvidence(set, evidence, nil); err != nil {
		return f, FilingObservation{}, err
	}
	f.NegativeOutcome, f.NegativeEpoch = kind, it.ProofEpoch
	return f, FilingObservation{
		MatterID: f.MatterID, ItemID: f.ItemID, Kind: ObsNegative, From: f.Stage, To: f.Stage, Reference: strings.TrimSpace(reference),
		ObservedAt: observedAt, Evidence: evidence, Actor: actor, Outcome: kind, RecordedAt: asOf, CycleNo: f.CurrentCycle, ProofEpoch: it.ProofEpoch,
	}, nil
}

// NegativeOpen reports an unresolved negative outcome in the filing's current proof epoch.
func (f Filing) NegativeOpen(it WorkItem) bool {
	return f.NegativeOutcome != "" && f.NegativeEpoch == it.ProofEpoch && !it.Terminal()
}

// FilingSummary is one filing in a list: its work item (with derived views computed by the caller)
// and the filing facts.
type FilingSummary struct {
	View   WorkItemView
	Filing Filing
	// OutcomeVerification is one of the Outcome* constants.
	OutcomeVerification string
}

// FilingDetail is one filing with its whole history: cycles, exact submissions and the
// append-only observations.
type FilingDetail struct {
	View         WorkItemView
	Filing       Filing
	Cycles       []FilingCycle
	Submissions  []FilingSubmission
	Observations []FilingObservation
	// Next lists the stages the filing may move to from here (the guards decide at the time).
	Next []FilingStage
	AsOf time.Time
	// OutcomeVerification is one of the Outcome* constants.
	OutcomeVerification string
}
