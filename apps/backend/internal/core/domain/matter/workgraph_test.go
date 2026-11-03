package matter_test

import (
	"errors"
	"fmt"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

var t0 = time.Date(2026, 6, 15, 9, 0, 0, 0, time.FixedZone("ICT", 7*3600))

func req(id string, exec matter.ExecutionState, ver matter.VerificationState) matter.WorkItem {
	return matter.WorkItem{
		ID: matter.NodeID(id), Kind: matter.NodeRequirement, MatterID: "M1", Title: id,
		Execution: exec, Dependency: matter.DependencyReady, ProofRequired: true, Verification: ver,
		Applicability: matter.VerificationRequired, Revision: 1,
	}
}

func act(id string, exec matter.ExecutionState) matter.WorkItem {
	return matter.WorkItem{
		ID: matter.NodeID(id), Kind: matter.NodeAction, MatterID: "M1", Title: id,
		Execution: exec, Dependency: matter.DependencyReady, Revision: 1,
	}
}

func edge(id, src, dst string, g matter.GateKind) matter.Edge {
	return matter.Edge{ID: id, MatterID: "M1", Source: matter.NodeID(src), Target: matter.NodeID(dst), Gate: g}
}

func dep(items []matter.WorkItem, edges []matter.Edge) map[matter.NodeID]matter.DependencyEval {
	return matter.EvaluateDependencies(items, edges)
}

// AC-105: completion prerequisite A done, proof prerequisite R unverified -> BLOCKED with
// the failed PROOF gate distinguished from the satisfied completion gate.
func TestANDGate_ProofGateKeepsTargetBlocked(t *testing.T) {
	items := []matter.WorkItem{
		act("A", matter.ExecutionCompleted),
		req("R", matter.ExecutionCompleted, matter.VerificationUnverified),
		act("T", matter.ExecutionNotStarted),
	}
	edges := []matter.Edge{edge("e1", "A", "T", matter.GateCompletion), edge("e2", "R", "T", matter.GateProof)}
	got := dep(items, edges)["T"]
	if got.State != matter.DependencyBlocked || len(got.Reasons) != 1 {
		t.Fatalf("T: %+v", got)
	}
	r := got.Reasons[0]
	if r.Source != "R" || r.Gate != matter.GateProof || r.Code != matter.ReasonNotVerified {
		t.Fatalf("reason: %+v", r)
	}
	if dep(items, edges)["A"].State != matter.DependencyReady {
		t.Fatal("A has no incoming gate and must be READY")
	}
}

// AC-123: verification of the upstream unlocks the target in the same evaluation.
func TestUpstreamVerificationUnlocksTarget(t *testing.T) {
	items := []matter.WorkItem{req("R1", matter.ExecutionCompleted, matter.VerificationVerified), req("R2", matter.ExecutionNotStarted, matter.VerificationUnverified)}
	if got := dep(items, []matter.Edge{edge("e", "R1", "R2", matter.GateProof)})["R2"]; got.State != matter.DependencyReady {
		t.Fatalf("R2: %+v", got)
	}
}

// AC-124: reopening R1 re-blocks A2 and (recursively) A3 without erasing A2's completion.
func TestReopenReblocksTransitively(t *testing.T) {
	r1 := req("R1", matter.ExecutionCompleted, matter.VerificationVerified)
	a2, a3 := act("A2", matter.ExecutionCompleted), act("A3", matter.ExecutionNotStarted)
	edges := []matter.Edge{edge("e1", "R1", "A2", matter.GateProof), edge("e2", "A2", "A3", matter.GateCompletion)}
	for id, ev := range dep([]matter.WorkItem{r1, a2, a3}, edges) {
		if ev.State != matter.DependencyReady {
			t.Fatalf("%s should start READY: %+v", id, ev)
		}
	}
	res, err := matter.DecideTransition(matter.TransitionRequest{Item: r1, To: matter.ExecutionInProgress, Role: matter.MatterRoleOwner, Reason: "defect found", AsOf: t0})
	if err != nil {
		t.Fatal(err)
	}
	reopened := res.Item
	if reopened.Execution != matter.ExecutionInProgress || reopened.Verification != matter.VerificationUnverified || reopened.ProofEpoch != 1 || reopened.CompletedAt != nil {
		t.Fatalf("reopened: %+v", reopened)
	}
	after := dep([]matter.WorkItem{reopened, a2, a3}, edges)
	if after["A2"].State != matter.DependencyBlocked || after["A3"].State != matter.DependencyBlocked {
		t.Fatalf("A2/A3 must be BLOCKED: %+v", after)
	}
	if a2.Execution != matter.ExecutionCompleted {
		t.Fatal("A2's completion is history and must not be erased")
	}
	if after["A3"].Reasons[0].Code != matter.ReasonUpstreamBlocked || after["A2"].Reasons[0].Code != matter.ReasonNotCompleted {
		t.Fatalf("causes: %+v", after)
	}
}

// AC-146: cancellation never satisfies a prerequisite; no waiver by relabeling.
func TestCancellationDoesNotSatisfy(t *testing.T) {
	items := []matter.WorkItem{req("R", matter.ExecutionCancelled, matter.VerificationUnverified), act("A", matter.ExecutionNotStarted)}
	got := dep(items, []matter.Edge{edge("e", "R", "A", matter.GateCompletion)})["A"]
	if got.State != matter.DependencyBlocked || got.Reasons[0].Code != matter.ReasonCancelled {
		t.Fatalf("A: %+v", got)
	}
	// COMPLETED <- CANCELLED is not a listed transition: the waiver-by-relabel is rejected.
	_, err := matter.DecideTransition(matter.TransitionRequest{Item: items[0], To: matter.ExecutionCompleted, Role: matter.MatterRoleOwner, Reason: "waive", AsOf: t0})
	var rej *matter.RejectedError
	if !errors.As(err, &rej) || rej.Code != "transition-not-allowed" {
		t.Fatalf("relabel must be refused: %v", err)
	}
}

// AC-125: cycles, self-edges, duplicates and cross-matter links are refused before saving.
func TestValidateNewEdge(t *testing.T) {
	items := []matter.WorkItem{act("A", matter.ExecutionNotStarted), act("B", matter.ExecutionNotStarted), act("C", matter.ExecutionNotStarted)}
	edges := []matter.Edge{edge("1", "A", "B", matter.GateCompletion), edge("2", "B", "C", matter.GateCompletion)}
	cases := []struct {
		name     string
		src, dst matter.NodeID
		gate     matter.GateKind
		code     string
	}{
		{"closing cycle", "C", "A", matter.GateCompletion, "cycle"},
		{"self edge", "A", "A", matter.GateProof, "self-edge"},
		{"duplicate", "A", "B", matter.GateProof, "duplicate-edge"},
		{"cross matter", "A", "ZZ", matter.GateCompletion, "cross-matter"},
		{"bad gate", "A", "C", "MAYBE", "invalid-gate"},
	}
	for _, c := range cases {
		err := matter.ValidateNewEdge(items, edges, c.src, c.dst, c.gate)
		var rej *matter.RejectedError
		if !errors.As(err, &rej) || rej.Code != c.code {
			t.Errorf("%s: got %v want %s", c.name, err, c.code)
		}
	}
	if err := matter.ValidateNewEdge(items, edges, "A", "C", matter.GateCompletion); err != nil {
		t.Fatalf("a valid forward edge is accepted: %v", err)
	}
	var rej *matter.RejectedError
	_ = errors.As(matter.ValidateNewEdge(items, edges, "C", "A", matter.GateCompletion), &rej)
	if fmt.Sprint(rej.Path) != "[A B C]" {
		t.Fatalf("the refused cycle is explained by its path: %v", rej.Path)
	}
}

// AC-122: completing a BLOCKED item is rejected with the gate reason and no mutation.
func TestBlockedItemCannotComplete(t *testing.T) {
	items := []matter.WorkItem{req("R1", matter.ExecutionCompleted, matter.VerificationUnverified), req("R2", matter.ExecutionInProgress, matter.VerificationUnverified)}
	ev := dep(items, []matter.Edge{edge("e", "R1", "R2", matter.GateProof)})["R2"]
	items[1].Dependency, items[1].DependencyReasons = ev.State, ev.Reasons
	_, err := matter.DecideTransition(matter.TransitionRequest{Item: items[1], To: matter.ExecutionCompleted, Role: matter.MatterRoleEditor, AsOf: t0})
	var rej *matter.RejectedError
	if !errors.As(err, &rej) || rej.Code != "dependency-blocked" || len(rej.Gates) != 1 || rej.Gates[0].Source != "R1" {
		t.Fatalf("got %v", err)
	}
}

// AC-142: timing boundaries at an explicit instant; equivalent instants in other zones agree.
func TestTimingBoundaries(t *testing.T) {
	at := func(d time.Duration) *time.Time { v := t0.Add(d); return &v }
	h48 := 48 * time.Hour
	cases := []struct {
		name  string
		due   *time.Time
		state matter.Timing
		noDue bool
	}{
		{"T-1s", at(-time.Second), matter.TimingOverdue, false},
		{"T", at(0), matter.TimingDueSoon, false},
		{"T+48h", at(h48), matter.TimingDueSoon, false},
		{"T+48h+1s", at(h48 + time.Second), matter.TimingOnTrack, false},
		{"no due", nil, matter.TimingOnTrack, true},
	}
	for _, c := range cases {
		it := act("X", matter.ExecutionInProgress)
		it.DueAt = c.due
		got := matter.TimingOf(it, t0)
		if got.State != c.state || got.NoDue != c.noDue {
			t.Errorf("%s: %+v", c.name, got)
		}
		if c.due != nil { // same instants expressed in UTC
			utc := c.due.UTC()
			it.DueAt = &utc
			if matter.TimingOf(it, t0.UTC()).State != c.state {
				t.Errorf("%s: timezone-equivalent instants must agree", c.name)
			}
		}
	}
	late := act("L", matter.ExecutionCompleted)
	d := t0.Add(-24 * time.Hour)
	done := t0.Add(-time.Hour)
	late.DueAt, late.CompletedAt = &d, &done
	if got := matter.TimingOf(late, t0); got.State != matter.TimingOnTrack || late.CompletedAt.Before(*late.DueAt) {
		t.Fatalf("terminal is ON_TRACK for active monitoring yet lateness stays visible: %+v", got)
	}
}

// AC-143: CRITICAL first with reasons; ATTENTION after the critical cause is removed; a
// manual NORMAL cannot hide a derived cause (there is no way to set one).
func TestAttentionPrecedence(t *testing.T) {
	it := req("R", matter.ExecutionInProgress, matter.VerificationUnverified)
	due := t0.Add(-time.Hour)
	it.DueAt = &due
	got := matter.AttentionOf(it, t0, true)
	if got.State != matter.AttentionCritical || got.Reasons[0] != matter.AttnCriticalChain || got.Reasons[1] != matter.AttnOverdue {
		t.Fatalf("critical first with all reasons: %+v", got)
	}
	got = matter.AttentionOf(it, t0, false)
	if got.State != matter.AttentionAttention || got.Reasons[0] != matter.AttnOverdue {
		t.Fatalf("after the critical cause is removed: %+v", got)
	}
	esc := "regulator call"
	it.EscalationReason = &esc
	if got := matter.AttentionOf(it, t0, false); got.State != matter.AttentionCritical || got.Reasons[0] != matter.AttnEscalated {
		t.Fatalf("explicit escalation: %+v", got)
	}
	clean := act("C", matter.ExecutionNotStarted)
	if matter.AttentionOf(clean, t0, false).State != matter.AttentionNormal {
		t.Fatal("no cause means NORMAL")
	}
	w := act("W", matter.ExecutionWaiting)
	if got := matter.AttentionOf(w, t0, false); got.State != matter.AttentionAttention || got.Reasons[0] != matter.AttnWaiting {
		t.Fatalf("waiting: %+v", got)
	}
	cu := req("CU", matter.ExecutionCompleted, matter.VerificationUnverified)
	if got := matter.AttentionOf(cu, t0, false); got.State != matter.AttentionAttention || got.Reasons[0] != matter.AttnCompletedUnverified {
		t.Fatalf("completed+unverified: %+v", got)
	}
}

func TestCriticalChainIsUnsatisfiedPrerequisitesOfCriticalMilestones(t *testing.T) {
	g := matter.WorkGraph{
		MatterID: "M1",
		Items: []matter.WorkItem{
			req("R1", matter.ExecutionCompleted, matter.VerificationVerified), // satisfied: off the chain
			req("R2", matter.ExecutionInProgress, matter.VerificationUnverified),
			act("A1", matter.ExecutionNotStarted), // upstream of R2
			act("X", matter.ExecutionNotStarted),  // unrelated
		},
		Edges:      []matter.Edge{edge("e", "A1", "R2", matter.GateCompletion)},
		Milestones: []matter.Milestone{{ID: "MS1", Critical: true, Prerequisites: []matter.NodeID{"R1", "R2"}}},
	}
	chain := matter.CriticalChain(g)
	if !chain["R2"] || !chain["A1"] || chain["R1"] || chain["X"] {
		t.Fatalf("chain: %v", chain)
	}
	g.Milestones[0].Critical = false
	if len(matter.CriticalChain(g)) != 0 {
		t.Fatal("a non-critical milestone designates no chain")
	}
}

// AC-102 / AC-141.
func TestMilestoneReadiness(t *testing.T) {
	r1 := req("R1", matter.ExecutionCompleted, matter.VerificationVerified)
	r2 := req("R2", matter.ExecutionCompleted, matter.VerificationUnverified)
	g := matter.WorkGraph{Items: []matter.WorkItem{r1, r2}}
	st := matter.MilestoneReadiness(matter.Milestone{Prerequisites: []matter.NodeID{"R1", "R2"}}, g)
	if st.State != matter.MilestoneNotReady || st.Satisfied != 1 || st.Total != 2 || st.Unsatisfied[0].ItemID != "R2" || st.Unsatisfied[0].Reasons[0] != matter.MSProofNotVerified {
		t.Fatalf("AC-102: %+v", st)
	}
	if st := matter.MilestoneReadiness(matter.Milestone{}, g); st.State != matter.MilestoneUnassessed {
		t.Fatalf("no prerequisites is unassessed, never ready: %+v", st)
	}
	r2.Execution = matter.ExecutionCancelled
	r3 := req("R3", matter.ExecutionCompleted, matter.VerificationDisputed)
	g = matter.WorkGraph{Items: []matter.WorkItem{r1, r2, r3}}
	st = matter.MilestoneReadiness(matter.Milestone{Prerequisites: []matter.NodeID{"R1", "R2", "R3"}}, g)
	if st.State != matter.MilestoneNotReady || st.Satisfied != 1 {
		t.Fatalf("%+v", st)
	}
	if st.Unsatisfied[0].Reasons[0] != matter.MSCancelled || st.Unsatisfied[1].Reasons[0] != matter.MSProofDisputed {
		t.Fatalf("cancelled/disputed keep their own reasons: %+v", st.Unsatisfied)
	}
	exempt := req("R4", matter.ExecutionCompleted, matter.VerificationNotRequired)
	exempt.Applicability, exempt.ApplicabilityReason = matter.VerificationNotApplicable, ptr("no proof applies")
	if st := matter.MilestoneReadiness(matter.Milestone{Prerequisites: []matter.NodeID{"R4"}}, matter.WorkGraph{Items: []matter.WorkItem{exempt}}); st.State != matter.MilestoneReady {
		t.Fatalf("explicit NOT_REQUIRED satisfies: %+v", st)
	}
	blocked := req("R5", matter.ExecutionCompleted, matter.VerificationVerified)
	blocked.Dependency = matter.DependencyBlocked
	if st := matter.MilestoneReadiness(matter.Milestone{Prerequisites: []matter.NodeID{"R5"}}, matter.WorkGraph{Items: []matter.WorkItem{blocked}}); st.State != matter.MilestoneNotReady || st.Unsatisfied[0].Reasons[0] != matter.MSDependencyBlocked {
		t.Fatalf("a blocked prerequisite is not satisfied: %+v", st)
	}
}

func ptr[T any](v T) *T { return &v }

// AC-103: exact order and stable across calls; exclusions are classified, not ranked.
func TestNextActionOrderAndClassification(t *testing.T) {
	due := func(d time.Duration) *time.Time { v := t0.Add(d); return &v }
	mk := func(id string, d *time.Time) matter.WorkItem {
		it := act(id, matter.ExecutionNotStarted)
		it.DueAt = d
		return it
	}
	k1, k2, k3 := mk("K1", due(24*time.Hour)), mk("K2", due(24*time.Hour)), mk("K3", nil)
	n1, n2, n3 := mk("N1", due(time.Hour)), mk("N2", due(time.Hour)), mk("N3", nil)
	cands := []matter.Candidate{{Item: n3}, {Item: k3, CriticalChain: true}, {Item: n2}, {Item: k2, CriticalChain: true}, {Item: n1}, {Item: k1, CriticalChain: true}}
	order := func() string {
		s := ""
		for _, c := range matter.RankNextActions(cands) {
			s += string(c.Item.ID) + ","
		}
		return s
	}
	if got := order(); got != "K1,K2,K3,N1,N2,N3," || order() != got {
		t.Fatalf("order: %s", got)
	}
	b := act("B", matter.ExecutionNotStarted)
	b.Dependency = matter.DependencyBlocked
	w := act("W", matter.ExecutionWaiting)
	done := act("D", matter.ExecutionCompleted)
	for item, want := range map[string]matter.ActionClass{"K1": matter.ClassEligible, "B": matter.ClassBlocked, "W": matter.ClassWaiting, "D": matter.ClassHistorical} {
		var it matter.WorkItem
		switch item {
		case "K1":
			it = k1
		case "B":
			it = b
		case "W":
			it = w
		default:
			it = done
		}
		if got := matter.ClassifyAssigned(it); got != want {
			t.Errorf("%s: %s want %s", item, got, want)
		}
	}
	if got := matter.ClassifyAssigned(req("R", matter.ExecutionInProgress, matter.VerificationUnverified)); got == matter.ClassEligible {
		t.Fatal("an assigned Requirement is not a next-action candidate")
	}
}

// AC-160: every ordered pair of execution states, once with every guard satisfied and the
// actor an OWNER. Only the listed pairs succeed; same-state is a no-op.
func TestTransitionTableConformance(t *testing.T) {
	states := []matter.ExecutionState{matter.ExecutionNotStarted, matter.ExecutionInProgress, matter.ExecutionWaiting, matter.ExecutionCompleted, matter.ExecutionCancelled}
	allowed := map[string]bool{
		"NOT_STARTED>IN_PROGRESS": true, "NOT_STARTED>WAITING": true, "NOT_STARTED>COMPLETED": true,
		"IN_PROGRESS>WAITING": true, "IN_PROGRESS>COMPLETED": true,
		"WAITING>IN_PROGRESS": true, "WAITING>COMPLETED": true,
		"NOT_STARTED>CANCELLED": true, "IN_PROGRESS>CANCELLED": true, "WAITING>CANCELLED": true,
		"COMPLETED>IN_PROGRESS": true, "CANCELLED>IN_PROGRESS": true,
	}
	party := matter.PartyID("P1")
	owner := matter.ActorID("U1")
	completedAt := t0.Add(-time.Hour)
	for _, from := range states {
		for _, to := range states {
			it := req("R", from, matter.VerificationVerified)
			it.OwnerActorID = &owner
			res, err := matter.DecideTransition(matter.TransitionRequest{
				Item: it, To: to, Role: matter.MatterRoleOwner, Reason: "because",
				WaitingPartyID: &party, WaitingCondition: "reply", CompletedAt: &completedAt, AsOf: t0,
			})
			key := string(from) + ">" + string(to)
			switch {
			case from == to:
				if err != nil || !res.NoOp {
					t.Errorf("%s: same-state must be a no-op: %v", key, err)
				}
			case allowed[key]:
				if err != nil || res.NoOp || res.Item.Execution != to {
					t.Errorf("%s must succeed: %v", key, err)
				}
			default:
				var rej *matter.RejectedError
				if !errors.As(err, &rej) || rej.Code != "transition-not-allowed" || len(rej.Alternatives) == 0 {
					t.Errorf("%s must be rejected with alternatives: %v", key, err)
				}
			}
		}
	}
}

func TestTransitionGuards(t *testing.T) {
	owner := matter.ActorID("U1")
	party := matter.PartyID("P1")
	completedAt := t0.Add(-time.Hour)
	do := func(it matter.WorkItem, to matter.ExecutionState, mut func(*matter.TransitionRequest)) error {
		r := matter.TransitionRequest{Item: it, To: to, Role: matter.MatterRoleEditor, AsOf: t0}
		if mut != nil {
			mut(&r)
		}
		_, err := matter.DecideTransition(r)
		return err
	}
	code := func(err error) string {
		var rej *matter.RejectedError
		if errors.As(err, &rej) {
			return rej.Code
		}
		if errors.Is(err, matter.ErrTransitionForbidden) {
			return "forbidden"
		}
		if err == nil {
			return "ok"
		}
		return err.Error()
	}
	ns := act("A", matter.ExecutionNotStarted)
	ns.OwnerActorID = &owner
	blocked := ns
	blocked.Dependency = matter.DependencyBlocked

	checks := map[string]string{
		"start while blocked":            code(do(blocked, matter.ExecutionInProgress, nil)),
		"start when ready":               code(do(ns, matter.ExecutionInProgress, nil)),
		"wait without party":             code(do(ns, matter.ExecutionWaiting, func(r *matter.TransitionRequest) { r.WaitingCondition = "x" })),
		"wait without condition":         code(do(ns, matter.ExecutionWaiting, func(r *matter.TransitionRequest) { r.WaitingPartyID = &party })),
		"wait without owner":             code(do(act("B", matter.ExecutionNotStarted), matter.ExecutionWaiting, func(r *matter.TransitionRequest) { r.WaitingPartyID, r.WaitingCondition = &party, "x" })),
		"wait ok (dependency untouched)": code(do(blocked, matter.ExecutionWaiting, func(r *matter.TransitionRequest) { r.WaitingPartyID, r.WaitingCondition = &party, "reply" })),
		"complete untouched needs when":  code(do(ns, matter.ExecutionCompleted, func(r *matter.TransitionRequest) { r.Reason = "done earlier" })),
		"complete untouched needs why":   code(do(ns, matter.ExecutionCompleted, func(r *matter.TransitionRequest) { r.CompletedAt = &completedAt })),
		"complete in the future":         code(do(ns, matter.ExecutionCompleted, func(r *matter.TransitionRequest) { f := t0.Add(time.Hour); r.CompletedAt, r.Reason = &f, "x" })),
		"complete blocked":               code(do(blocked, matter.ExecutionCompleted, func(r *matter.TransitionRequest) { r.CompletedAt, r.Reason = &completedAt, "x" })),
		"cancel by editor":               code(do(ns, matter.ExecutionCancelled, func(r *matter.TransitionRequest) { r.Reason = "x" })),
		"cancel without reason":          code(do(ns, matter.ExecutionCancelled, func(r *matter.TransitionRequest) { r.Role = matter.MatterRoleOwner })),
		"cancel by owner":                code(do(ns, matter.ExecutionCancelled, func(r *matter.TransitionRequest) { r.Role, r.Reason = matter.MatterRoleOwner, "scope" })),
		"reopen by editor":               code(do(act("C", matter.ExecutionCompleted), matter.ExecutionInProgress, func(r *matter.TransitionRequest) { r.Reason = "x" })),
		"reopen without reason":          code(do(act("C", matter.ExecutionCompleted), matter.ExecutionInProgress, func(r *matter.TransitionRequest) { r.Role = matter.MatterRoleOwner })),
	}
	want := map[string]string{
		"start while blocked": "dependency-blocked", "start when ready": "ok",
		"wait without party": "waiting-details-required", "wait without condition": "waiting-details-required",
		"wait without owner": "waiting-owner-required", "wait ok (dependency untouched)": "ok",
		"complete untouched needs when": "completion-time-required", "complete untouched needs why": "reason-required",
		"complete in the future": "completion-in-future", "complete blocked": "dependency-blocked",
		"cancel by editor": "forbidden", "cancel without reason": "reason-required", "cancel by owner": "ok",
		"reopen by editor": "forbidden", "reopen without reason": "reason-required",
	}
	for k, w := range want {
		if checks[k] != w {
			t.Errorf("%s: got %s want %s", k, checks[k], w)
		}
	}
}

func TestWaitingFieldsFollowTheState(t *testing.T) {
	owner, party := matter.ActorID("U1"), matter.PartyID("P1")
	it := act("A", matter.ExecutionInProgress)
	it.OwnerActorID = &owner
	w, err := matter.DecideTransition(matter.TransitionRequest{Item: it, To: matter.ExecutionWaiting, Role: matter.MatterRoleEditor, WaitingPartyID: &party, WaitingCondition: "  counterparty reply ", AsOf: t0})
	if err != nil || w.Item.WaitingPartyID == nil || *w.Item.WaitingCondition != "counterparty reply" || w.Item.Dependency != matter.DependencyReady {
		t.Fatalf("waiting keeps dependency independent and trims the condition: %+v %v", w.Item, err)
	}
	back, err := matter.DecideTransition(matter.TransitionRequest{Item: w.Item, To: matter.ExecutionInProgress, Role: matter.MatterRoleEditor, AsOf: t0})
	if err != nil || back.Item.WaitingPartyID != nil || back.Item.WaitingCondition != nil {
		t.Fatalf("leaving WAITING clears the current wait: %+v %v", back.Item, err)
	}
	done, err := matter.DecideTransition(matter.TransitionRequest{Item: it, To: matter.ExecutionCompleted, Role: matter.MatterRoleEditor, AsOf: t0})
	if err != nil || done.Item.CompletedAt == nil || !done.Item.CompletedAt.Equal(t0) {
		t.Fatalf("completing from IN_PROGRESS records the as-of time: %+v %v", done.Item, err)
	}
	r := req("R", matter.ExecutionInProgress, matter.VerificationUnverified)
	cr, _ := matter.DecideTransition(matter.TransitionRequest{Item: r, To: matter.ExecutionCompleted, Role: matter.MatterRoleEditor, AsOf: t0})
	if cr.Item.Verification != matter.VerificationUnverified {
		t.Fatal("completed is not verified (AC-121)")
	}
}
