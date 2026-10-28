package matter

import (
	"sort"
	"time"
)

// ControlRoom is the manager's one-screen reading of a matter, built from ONE consistent snapshot
// at an explicit instant: what is blocked and why, what to do next and who owns it, what is
// waiting, which milestones are ready, where proof or ownership is missing, and what changed.
// Every number and row is derived from the same authorized records; nothing is stored and an
// unavailable input is never shown as zero.
type ControlRoom struct {
	AsOf     time.Time
	Revision int64
	State    ControlState
	// Blockers are blocked records with the prerequisites that hold them.
	Blockers []BlockerView
	// NextActions are ready records that unblock others or sit on a critical chain, ranked.
	NextActions []NextActionView
	Waiting     []WorkItemView
	Milestones  []MilestoneView
	Gaps        []Gap
	// Decisions, Risks and Findings are the open context records.
	Decisions []ContextRecord
	Risks     []ContextRecord
	Findings  []ContextRecord
	// Records is every context record (open and closed, all kinds) and Titles the display label of
	// each record the room refers to. Both come from the same snapshot as the figures, so a page
	// never has to combine them with another read (F04).
	Records []ContextRecord
	Titles  map[NodeID]string
	Changes []EventRecord
}

type ControlState struct {
	Total           int
	ByExecution     map[ExecutionState]int
	Blocked         int
	Overdue         int
	Critical        int
	AwaitingProof   int
	OpenFilings     int
	NegativeFilings int
}

type BlockerView struct {
	View     WorkItemView
	Reasons  []GateReason
	Upstream []WorkItem
}

type NextActionView struct {
	View WorkItemView
	// Unblocks lists the blocked records that wait on this one.
	Unblocks []NodeID
	// Decisions are the open decisions that concern this record.
	Decisions []ContextRecord
}

type GapKind string

const (
	GapCompletedUnverified GapKind = "COMPLETED_UNVERIFIED"
	GapNoCriteria          GapKind = "NO_CRITERIA"
	GapProofDisputed       GapKind = "PROOF_DISPUTED"
	GapNoOwner             GapKind = "NO_OWNER"
	GapNegativeFiling      GapKind = "NEGATIVE_FILING_OUTCOME"
)

type Gap struct {
	ItemID NodeID
	Kind   GapKind
}

func attentionRank(a Attention) int {
	switch a {
	case AttentionCritical:
		return 0
	case AttentionAttention:
		return 1
	}
	return 2
}

// BuildControlRoom derives the Control Room from an already-effective graph (verification and
// dependency evaluated at asOf) and the matter's recent history, all from one snapshot.
func BuildControlRoom(g WorkGraph, asOf time.Time, revision int64, recent []EventRecord) ControlRoom {
	chain := CriticalChain(g)
	out := ControlRoom{AsOf: asOf, Revision: revision, Changes: recent, State: ControlState{ByExecution: map[ExecutionState]int{}}}
	views := map[NodeID]WorkItemView{}
	for _, it := range g.Items {
		v := ViewOf(it, asOf, chain)
		views[it.ID] = v
		out.State.Total++
		out.State.ByExecution[it.Execution]++
		if it.Terminal() {
			continue
		}
		if it.Dependency == DependencyBlocked {
			out.State.Blocked++
		}
		if v.Timing.State == TimingOverdue {
			out.State.Overdue++
		}
		if v.Attention.State == AttentionCritical {
			out.State.Critical++
		}
		if _, ok := g.Filing.Of(it.ID); ok {
			out.State.OpenFilings++
			if it.NegativeOpen {
				out.State.NegativeFilings++
			}
		}
	}

	// Blockers and the work that would release them.
	unblocks := map[NodeID][]NodeID{}
	for _, it := range g.Items {
		if it.Terminal() || it.Dependency != DependencyBlocked {
			continue
		}
		b := BlockerView{View: views[it.ID], Reasons: it.DependencyReasons}
		seen := map[NodeID]bool{}
		for _, r := range it.DependencyReasons {
			if src, ok := g.Item(r.Source); ok && !seen[src.ID] {
				seen[src.ID] = true
				b.Upstream = append(b.Upstream, src)
				unblocks[src.ID] = append(unblocks[src.ID], it.ID)
			}
		}
		out.Blockers = append(out.Blockers, b)
	}
	sort.Slice(out.Blockers, func(i, j int) bool {
		a, b := out.Blockers[i].View, out.Blockers[j].View
		if ra, rb := attentionRank(a.Attention.State), attentionRank(b.Attention.State); ra != rb {
			return ra < rb
		}
		return a.Item.ID < b.Item.ID
	})

	// Next actions: ready, open records that release a blocked record or sit on the critical chain.
	for _, it := range g.Items {
		if it.Terminal() || it.Dependency != DependencyReady || it.Execution == ExecutionWaiting {
			continue
		}
		if len(unblocks[it.ID]) == 0 && !chain[it.ID] {
			continue
		}
		ids := append([]NodeID(nil), unblocks[it.ID]...)
		sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })
		out.NextActions = append(out.NextActions, NextActionView{View: views[it.ID], Unblocks: ids, Decisions: g.Context.Linked(ContextDecision, it.ID)})
	}
	sort.Slice(out.NextActions, func(i, j int) bool {
		a, b := out.NextActions[i], out.NextActions[j]
		if ra, rb := attentionRank(a.View.Attention.State), attentionRank(b.View.Attention.State); ra != rb {
			return ra < rb
		}
		if len(a.Unblocks) != len(b.Unblocks) {
			return len(a.Unblocks) > len(b.Unblocks)
		}
		ad, bd := a.View.Item.DueAt, b.View.Item.DueAt
		switch {
		case ad != nil && bd != nil && !ad.Equal(*bd):
			return ad.Before(*bd)
		case ad != nil && bd == nil:
			return true
		case ad == nil && bd != nil:
			return false
		}
		return a.View.Item.ID < b.View.Item.ID
	})

	for _, it := range g.Items {
		if it.Execution == ExecutionWaiting {
			out.Waiting = append(out.Waiting, views[it.ID])
		}
	}
	sort.Slice(out.Waiting, func(i, j int) bool { return out.Waiting[i].Item.ID < out.Waiting[j].Item.ID })

	for _, m := range g.Milestones {
		out.Milestones = append(out.Milestones, MilestoneView{Milestone: m, Status: MilestoneReadiness(m, g)})
	}
	sort.Slice(out.Milestones, func(i, j int) bool { return out.Milestones[i].Milestone.ID < out.Milestones[j].Milestone.ID })

	// Gaps: missing proof, missing criteria, disputed proof, missing owner, negative filing outcome.
	for _, it := range g.Items {
		hasCriteria := false
		for _, c := range g.Evidence.Criteria {
			if c.SubjectID == it.ID && !c.Retired {
				hasCriteria = true
			}
		}
		proofOwed := it.ProofRequired && it.Applicability != VerificationNotApplicable
		if proofOwed && it.Verification == VerificationDisputed {
			out.Gaps = append(out.Gaps, Gap{it.ID, GapProofDisputed})
			out.State.AwaitingProof++
		} else if proofOwed && it.Execution == ExecutionCompleted && it.Verification != VerificationVerified {
			out.Gaps = append(out.Gaps, Gap{it.ID, GapCompletedUnverified})
			out.State.AwaitingProof++
		}
		if proofOwed && !hasCriteria && !it.Terminal() {
			out.Gaps = append(out.Gaps, Gap{it.ID, GapNoCriteria})
		}
		if !it.Terminal() && it.OwnerActorID == nil {
			out.Gaps = append(out.Gaps, Gap{it.ID, GapNoOwner})
		}
		if it.NegativeOpen {
			out.Gaps = append(out.Gaps, Gap{it.ID, GapNegativeFiling})
		}
	}

	out.Records = append([]ContextRecord(nil), g.Context.Records...)
	out.Titles = map[NodeID]string{}
	label := func(id NodeID) {
		if it, ok := g.Item(id); ok {
			out.Titles[id] = it.Title
		}
	}
	for _, n := range out.NextActions {
		for _, id := range n.Unblocks {
			label(id)
		}
	}
	for _, r := range out.Records {
		for _, id := range r.Links {
			label(id)
		}
	}
	for _, gap := range out.Gaps {
		label(gap.ItemID)
	}
	for _, m := range out.Milestones {
		for _, u := range m.Status.Unsatisfied {
			label(u.ItemID)
		}
	}
	for _, e := range recent {
		label(NodeID(e.TargetID))
	}

	for _, r := range g.Context.Records {
		if r.Status != ContextOpen {
			continue
		}
		switch r.Kind {
		case ContextDecision:
			out.Decisions = append(out.Decisions, r)
		case ContextRisk:
			out.Risks = append(out.Risks, r)
		case ContextFinding:
			out.Findings = append(out.Findings, r)
		}
	}
	return out
}
