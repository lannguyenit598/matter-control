package matter

import (
	"sort"
	"time"
)

// DependencyEval is the derived dependency outcome for one node.
type DependencyEval struct {
	State   DependencyState
	Reasons []GateReason
}

// EvaluateDependencies derives READY/BLOCKED for every item from the whole graph
// (RULE-003). An edge is satisfied only when its upstream is itself READY, COMPLETED and,
// for a proof gate, VERIFIED. Incoming edges combine with AND; no incoming edge is READY.
// The graph is acyclic by construction; a cycle that slipped in is BLOCKED, never READY.
func EvaluateDependencies(items []WorkItem, edges []Edge) map[NodeID]DependencyEval {
	byID := make(map[NodeID]WorkItem, len(items))
	for _, it := range items {
		byID[it.ID] = it
	}
	incoming := map[NodeID][]Edge{}
	for _, e := range edges {
		incoming[e.Target] = append(incoming[e.Target], e)
	}
	for _, list := range incoming {
		sort.Slice(list, func(i, j int) bool { return list[i].ID < list[j].ID })
	}
	memo := make(map[NodeID]DependencyEval, len(items))
	visiting := map[NodeID]bool{}
	var eval func(id NodeID) DependencyEval
	eval = func(id NodeID) DependencyEval {
		if v, ok := memo[id]; ok {
			return v
		}
		if visiting[id] {
			return DependencyEval{State: DependencyBlocked}
		}
		visiting[id] = true
		defer delete(visiting, id)
		var reasons []GateReason
		for _, e := range incoming[id] {
			src, ok := byID[e.Source]
			if !ok {
				reasons = append(reasons, GateReason{EdgeID: e.ID, Source: e.Source, Gate: e.Gate, Code: ReasonNotCompleted})
				continue
			}
			if code, bad := gateFailure(src, e.Gate, eval(e.Source)); bad {
				reasons = append(reasons, GateReason{EdgeID: e.ID, Source: e.Source, Gate: e.Gate, Code: code})
			}
		}
		res := DependencyEval{State: DependencyReady}
		if len(reasons) > 0 {
			res = DependencyEval{State: DependencyBlocked, Reasons: reasons}
		}
		memo[id] = res
		return res
	}
	out := make(map[NodeID]DependencyEval, len(items))
	for _, it := range items {
		out[it.ID] = eval(it.ID)
	}
	return out
}

// gateFailure reports why src does not satisfy the gate, most specific cause first.
func gateFailure(src WorkItem, gate GateKind, srcDep DependencyEval) (GateReasonCode, bool) {
	switch {
	case src.Execution == ExecutionCancelled:
		return ReasonCancelled, true // cancellation never satisfies a prerequisite
	case src.Execution != ExecutionCompleted:
		return ReasonNotCompleted, true
	case srcDep.State != DependencyReady:
		return ReasonUpstreamBlocked, true
	case gate == GateProof && src.Verification != VerificationVerified:
		return ReasonNotVerified, true
	}
	return "", false
}

// ValidateNewEdge rejects a self-edge, a duplicate, a link outside this matter's items and
// any cycle before anything is saved (RULE-003, AC-125).
func ValidateNewEdge(items []WorkItem, edges []Edge, source, target NodeID, gate GateKind) error {
	if !gate.Valid() {
		return &RejectedError{Code: "invalid-gate", Message: "gate must be COMPLETION or PROOF"}
	}
	if source == target {
		return &RejectedError{Code: "self-edge", Message: "a record cannot depend on itself", Path: []NodeID{source}}
	}
	found := 0
	for _, it := range items {
		if it.ID == source || it.ID == target {
			found++
		}
	}
	if found != 2 {
		// Both ends must be records of this matter: no cross-matter links (RULE-003).
		return &RejectedError{Code: "cross-matter", Message: "both records must belong to this matter"}
	}
	for _, e := range edges {
		if e.Source == source && e.Target == target {
			return &RejectedError{Code: "duplicate-edge", Message: "this dependency already exists"}
		}
	}
	if path := cyclePath(edges, source, target); path != nil {
		return &RejectedError{Code: "cycle", Message: "this dependency would create a cycle", Path: path}
	}
	return nil
}

// cyclePath returns the path target -> ... -> source if adding source -> target closes a
// cycle, nil otherwise.
func cyclePath(edges []Edge, source, target NodeID) []NodeID {
	out := map[NodeID][]NodeID{}
	for _, e := range edges {
		out[e.Source] = append(out[e.Source], e.Target)
	}
	for _, list := range out {
		sort.Slice(list, func(i, j int) bool { return list[i] < list[j] })
	}
	seen := map[NodeID]bool{}
	var path []NodeID
	var dfs func(n NodeID) bool
	dfs = func(n NodeID) bool {
		path = append(path, n)
		if n == source {
			return true
		}
		if !seen[n] {
			seen[n] = true
			for _, next := range out[n] {
				if dfs(next) {
					return true
				}
			}
		}
		path = path[:len(path)-1]
		return false
	}
	if dfs(target) {
		return path
	}
	return nil
}

// ---------- timing and attention ----------

// Timing is the derived schedule state (RULE-009).
type Timing string

const (
	TimingOnTrack Timing = "ON_TRACK"
	TimingDueSoon Timing = "DUE_SOON"
	TimingOverdue Timing = "OVERDUE"
	dueSoonWindow        = 48 * time.Hour
)

// TimingResult carries the state and whether it is only a default for lack of a due date:
// no deadline is ON_TRACK but never evidence of schedule health.
type TimingResult struct {
	State Timing
	NoDue bool
}

// TimingOf derives the timing of one item at an explicit instant. The comparison is on
// instants, so equivalent instants in different time zones agree.
func TimingOf(it WorkItem, asOf time.Time) TimingResult {
	if it.Terminal() {
		return TimingResult{State: TimingOnTrack} // lateness stays visible via CompletedAt vs DueAt
	}
	if it.DueAt == nil {
		return TimingResult{State: TimingOnTrack, NoDue: true}
	}
	due := *it.DueAt
	switch {
	case due.Before(asOf):
		return TimingResult{State: TimingOverdue}
	case !due.After(asOf.Add(dueSoonWindow)):
		return TimingResult{State: TimingDueSoon}
	}
	return TimingResult{State: TimingOnTrack}
}

// Attention is the derived attention level (RULE-010).
type Attention string

const (
	AttentionNormal    Attention = "NORMAL"
	AttentionAttention Attention = "ATTENTION"
	AttentionCritical  Attention = "CRITICAL"
)

// AttentionReason is one input of the attention level. Reasons are never hidden.
type AttentionReason string

const (
	AttnCriticalChain       AttentionReason = "CRITICAL_CHAIN"
	AttnEscalated           AttentionReason = "ESCALATED"
	AttnOverdue             AttentionReason = "OVERDUE"
	AttnProofDisputed       AttentionReason = "PROOF_DISPUTED"
	AttnCompletedUnverified AttentionReason = "COMPLETED_UNVERIFIED"
	AttnWaiting             AttentionReason = "WAITING"
	AttnNegativeOutcome     AttentionReason = "NEGATIVE_FILING_OUTCOME"
)

// AttentionResult is the level with every contributing reason.
type AttentionResult struct {
	State   Attention
	Reasons []AttentionReason
}

// AttentionOf derives attention. criticalChain says the item is an unsatisfied prerequisite
// on a designated critical milestone chain. OWNER escalation raises to CRITICAL but a
// manual NORMAL can never hide a derived cause.
func AttentionOf(it WorkItem, asOf time.Time, criticalChain bool) AttentionResult {
	var critical, attention []AttentionReason
	if criticalChain {
		critical = append(critical, AttnCriticalChain)
	}
	if it.EscalationReason != nil {
		critical = append(critical, AttnEscalated)
	}
	if !it.Terminal() && TimingOf(it, asOf).State == TimingOverdue {
		attention = append(attention, AttnOverdue)
	}
	if it.ProofRequired && it.Verification == VerificationDisputed {
		attention = append(attention, AttnProofDisputed)
	}
	if it.ProofRequired && it.Execution == ExecutionCompleted && it.Applicability != VerificationNotApplicable &&
		it.Verification != VerificationVerified && it.Verification != VerificationDisputed {
		attention = append(attention, AttnCompletedUnverified)
	}
	if it.Execution == ExecutionWaiting {
		attention = append(attention, AttnWaiting)
	}
	if it.NegativeOpen {
		attention = append(attention, AttnNegativeOutcome)
	}
	switch {
	case len(critical) > 0:
		return AttentionResult{State: AttentionCritical, Reasons: append(critical, attention...)}
	case len(attention) > 0:
		return AttentionResult{State: AttentionAttention, Reasons: attention}
	}
	return AttentionResult{State: AttentionNormal}
}

// Satisfied reports that an item fully satisfies a milestone prerequisite: COMPLETED,
// VERIFIED (or explicitly NOT_REQUIRED) and dependency READY (RULE-008).
func Satisfied(it WorkItem) bool {
	proofOK := !it.ProofRequired || it.Verification == VerificationVerified || it.Verification == VerificationNotRequired ||
		it.Applicability == VerificationNotApplicable
	return it.Execution == ExecutionCompleted && proofOK && it.Dependency == DependencyReady
}

// CriticalChain returns the items that are unsatisfied prerequisites on a designated
// critical milestone chain: a critical milestone's required Requirements and everything
// upstream of them, that is not yet satisfied.
func CriticalChain(g WorkGraph) map[NodeID]bool {
	incoming := map[NodeID][]NodeID{}
	for _, e := range g.Edges {
		incoming[e.Target] = append(incoming[e.Target], e.Source)
	}
	chain := map[NodeID]bool{}
	var walk func(id NodeID)
	walk = func(id NodeID) {
		if chain[id] {
			return
		}
		chain[id] = true
		for _, up := range incoming[id] {
			walk(up)
		}
	}
	for _, m := range g.Milestones {
		if !m.Critical {
			continue
		}
		for _, p := range m.Prerequisites {
			walk(p)
		}
	}
	out := map[NodeID]bool{}
	for id := range chain {
		if it, ok := g.Item(id); ok && !Satisfied(it) && it.Execution != ExecutionCancelled {
			out[id] = true
		}
	}
	return out
}

// ---------- milestones ----------

// MilestoneState is the readiness verdict (RULE-008): a milestone with no declared
// prerequisites is unassessed, never ready.
type MilestoneState string

const (
	MilestoneUnassessed MilestoneState = "UNASSESSED"
	MilestoneReady      MilestoneState = "READY"
	MilestoneNotReady   MilestoneState = "NOT_READY"
)

// MilestoneReason explains why a required Requirement is not satisfied.
type MilestoneReason string

const (
	MSCancelled         MilestoneReason = "CANCELLED"
	MSNotCompleted      MilestoneReason = "NOT_COMPLETED"
	MSProofDisputed     MilestoneReason = "PROOF_DISPUTED"
	MSProofNotVerified  MilestoneReason = "PROOF_NOT_VERIFIED"
	MSDependencyBlocked MilestoneReason = "DEPENDENCY_BLOCKED"
	MSMissing           MilestoneReason = "NOT_FOUND"
)

// Unsatisfied is one required Requirement that does not yet satisfy a milestone.
type Unsatisfied struct {
	ItemID  NodeID
	Reasons []MilestoneReason
}

// MilestoneStatus is the readiness with counts and reasons; a percentage is never offered.
type MilestoneStatus struct {
	State       MilestoneState
	Satisfied   int
	Total       int
	Unsatisfied []Unsatisfied
}

// MilestoneReadiness evaluates one milestone against the graph's current item states.
func MilestoneReadiness(m Milestone, g WorkGraph) MilestoneStatus {
	st := MilestoneStatus{Total: len(m.Prerequisites)}
	if st.Total == 0 {
		st.State = MilestoneUnassessed
		return st
	}
	for _, id := range m.Prerequisites {
		it, ok := g.Item(id)
		if !ok {
			st.Unsatisfied = append(st.Unsatisfied, Unsatisfied{ItemID: id, Reasons: []MilestoneReason{MSMissing}})
			continue
		}
		if Satisfied(it) {
			st.Satisfied++
			continue
		}
		var reasons []MilestoneReason
		switch {
		case it.Execution == ExecutionCancelled:
			reasons = append(reasons, MSCancelled) // never masquerades as satisfied
		case it.Execution != ExecutionCompleted:
			reasons = append(reasons, MSNotCompleted)
		}
		if it.ProofRequired && it.Applicability != VerificationNotApplicable &&
			it.Verification != VerificationVerified && it.Verification != VerificationNotRequired {
			if it.Verification == VerificationDisputed {
				reasons = append(reasons, MSProofDisputed)
			} else {
				reasons = append(reasons, MSProofNotVerified)
			}
		}
		if it.Dependency != DependencyReady {
			reasons = append(reasons, MSDependencyBlocked)
		}
		st.Unsatisfied = append(st.Unsatisfied, Unsatisfied{ItemID: id, Reasons: reasons})
	}
	if st.Satisfied == st.Total {
		st.State = MilestoneReady
	} else {
		st.State = MilestoneNotReady
	}
	return st
}

// ---------- next actions ----------

// ActionClass places one assigned item in exactly one section of My Actions: an assignment
// is not automatically a next action (AC-110, AC-144).
type ActionClass string

const (
	ClassEligible   ActionClass = "ELIGIBLE"
	ClassWaiting    ActionClass = "WAITING"
	ClassBlocked    ActionClass = "BLOCKED"
	ClassHistorical ActionClass = "HISTORICAL"
)

// ClassifyAssigned classifies an assigned item. Only an ACTION that is NOT_STARTED or
// IN_PROGRESS with a READY dependency is eligible (RULE-021).
func ClassifyAssigned(it WorkItem) ActionClass {
	switch {
	case it.Terminal():
		return ClassHistorical
	case it.Execution == ExecutionWaiting:
		return ClassWaiting
	case it.Dependency != DependencyReady:
		return ClassBlocked
	case it.Kind == NodeAction:
		return ClassEligible
	}
	// An assigned Requirement that is ready is neither a recommendation nor a blocker: it is
	// work-in-scope, listed with the waiting/blocked sections but never as a next action.
	return ClassBlocked
}

// Candidate is one next-action candidate with the revision it was derived from and why.
type Candidate struct {
	Item          WorkItem
	CriticalChain bool
}

// RankNextActions orders eligible Actions: critical-chain first, then due ascending (no due
// last), then stable id (RULE-021). Items are not re-ranked by anything else.
func RankNextActions(cands []Candidate) []Candidate {
	out := append([]Candidate(nil), cands...)
	sort.SliceStable(out, func(i, j int) bool {
		a, b := out[i], out[j]
		if a.CriticalChain != b.CriticalChain {
			return a.CriticalChain
		}
		switch {
		case a.Item.DueAt != nil && b.Item.DueAt != nil:
			if !a.Item.DueAt.Equal(*b.Item.DueAt) {
				return a.Item.DueAt.Before(*b.Item.DueAt)
			}
		case a.Item.DueAt != nil:
			return true
		case b.Item.DueAt != nil:
			return false
		}
		return a.Item.ID < b.Item.ID
	})
	return out
}

// EffectiveGraph returns the graph with every proof-requiring item's verification recomputed
// from its criteria and proof AT asOf, and every dependency re-evaluated from those effective
// states. Stored verification and dependency are only a cache: an acceptance that expired a
// moment ago, or a document promoted since, is reflected here even if no command has run.
func EffectiveGraph(g WorkGraph, asOf time.Time) WorkGraph {
	out := g
	out.Items = append([]WorkItem(nil), g.Items...)
	for i := range out.Items {
		if out.Items[i].ProofRequired {
			out.Items[i].Verification = EvaluateVerification(out.Items[i], g.Evidence, asOf).State
		}
	}
	evals := EvaluateDependencies(out.Items, out.Edges)
	for i := range out.Items {
		ev := evals[out.Items[i].ID]
		out.Items[i].Dependency, out.Items[i].DependencyReasons = ev.State, ev.Reasons
		if f, ok := g.Filing.Of(out.Items[i].ID); ok {
			out.Items[i].NegativeOpen = f.NegativeOpen(out.Items[i])
		}
	}
	return out
}
