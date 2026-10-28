package mattercontrol

import (
	"strings"
	"testing"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

// gw03Alternates covers the variants the checklist lists beside the main GW-03 path.
func gw03Alternates(t *testing.T, newBundle Factory) {
	// No supplement: Authority Review straight to Approval, with no invented supplement events.
	t.Run("no-supplement alternate", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		l := newGWLedger(t, e, "GW-03", "AC-163")
		f := e.newFiling(false)
		f.toReview()
		post := l.cp("Approval", "no supplement", e.editor, "EDITOR", f.filingID, func() {
			f.must("APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{f.evidence("outcome")} })
		})
		d := f.get()
		if len(d.Cycles) != 1 || len(d.Submissions) != 1 || post.Item.Execution != matter.ExecutionCompleted || post.Item.Verification != "" {
			t.Fatalf("one cycle, one submission, completed, no verification axis for a no-proof filing: %+v", d)
		}
		for _, ev := range e.events() {
			if ev.Type == "filing.stage_changed" && ev.After != nil && strings.Contains(string(ev.After), "SUPPLEMENT") {
				t.Fatalf("no supplement was invented: %s", ev.After)
			}
		}
	})

	// Rejection: an EDITOR records it, only the OWNER closes it; the Requirement stays unmet; a closed
	// filing is not approved without an OWNER reopen and new evidence.
	t.Run("rejection and closure", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		l := newGWLedger(t, e, "GW-03", "AC-163")
		f := e.newFiling(false)
		f.toReview()
		post := l.cp("Rejection", "EDITOR records", e.editor, "EDITOR", f.filingID, func() {
			if _, err := e.fil.RecordNegative(e.ctx, port.RecordNegativeCmd{ActorID: e.editor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(),
				ExpectedRevision: f.get().View.Item.Revision, Outcome: "REJECTED", Reference: "REJ-1", EvidenceIDs: []string{f.evidence("rejection letter")}}); err != nil {
				t.Fatal(err)
			}
		})
		if f.get().Filing.Stage != matter.StageReview || post.Item.Execution == matter.ExecutionCompleted {
			t.Fatalf("a rejection never moves the stage or completes: %+v", post.Item)
		}
		hopeful, afterClose := f.evidence("hopeful"), f.evidence("after closure")
		l.refused("Approval while the rejection stands", f.filingID, func() error {
			return errOf(f.adv(e.editor, "APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{hopeful} }))
		}, "negative-outcome-open")
		closeNeg := func(actor matter.ActorID) error {
			_, err := e.fil.CloseNegative(e.ctx, port.ReasonedFilingCmd{ActorID: actor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(), ExpectedRevision: f.get().View.Item.Revision, Reason: "the authority refused"})
			return err
		}
		l.refused("Close by an editor", f.filingID, func() error { return closeNeg(e.editor) }, "")
		post = l.cp("Closure", "OWNER", e.owner, "OWNER", f.filingID, func() {
			if err := closeNeg(e.owner); err != nil {
				t.Fatal(err)
			}
		})
		if post.Item.Execution != matter.ExecutionCancelled {
			t.Fatalf("closing cancels: %+v", post.Item)
		}
		if r := e.detail(f.req.ID).View.Item; r.Execution != matter.ExecutionNotStarted {
			t.Fatalf("the linked Requirement stays unmet: %+v", r)
		}
		l.refused("Approval of a cancelled filing", f.filingID, func() error {
			return errOf(f.adv(e.editor, "APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{afterClose} }))
		}, "filing-closed")
	})

	// Rights and staleness: a stage update with a stale revision, or after the editor lost access, changes nothing.
	t.Run("stale stage update and revoked membership", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		l := newGWLedger(t, e, "GW-03", "AC-163")
		f := e.newFiling(false)
		stale := f.get().View.Item.Revision
		f.declarePackage()
		f.must("PACKAGE_PREPARATION", nil)
		l.refused("Stage update with a stale revision", f.filingID, func() error {
			_, err := e.fil.Advance(e.ctx, port.AdvanceFilingCmd{ActorID: e.editor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(), ExpectedRevision: stale, To: "SIGNATURE"})
			if err == nil {
				return nil
			}
			mustIs(t, "stale", err, port.ErrPreconditionFailed)
			return err
		}, "")
		w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
		if err := w1.revokeMatter(e.owner, e.m, e.editor, w1.matterRevision(e.owner, e.wsID, e.m)); err != nil {
			t.Fatal(err)
		}
		l.refused("Stage update after access was revoked", f.filingID, func() error {
			_, err := e.fil.Advance(e.ctx, port.AdvanceFilingCmd{ActorID: e.editor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(), ExpectedRevision: f.get().View.Item.Revision, To: "SIGNATURE"})
			return err
		}, "")
	})
}

// gw01 walks Approval → Document → Signature → Payment → Transfer → Closing → Post-Closing on the
// work spine. Execution, verification and dependency stay independent at every checkpoint, and
// completing work never verifies it. (The Filing step is GW-03.)
func gw01(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	e.ensureReviewer()
	l := newGWLedger(t, e, "GW-01", "AC-161")
	done := func(actor matter.ActorID, id matter.NodeID) {
		e.mustTransition(actor, id, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "done", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
		})
	}
	accept := func(subject matter.NodeID, crit matter.CriterionID, version string) {
		t.Helper()
		if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) {
			s.Claims = []string{crit.String()}
			if version != "" {
				s.Reference, s.VersionID = "", version
			}
		}); err != nil {
			t.Fatal(err)
		}
		k := e.claimOf(subject, crit)
		if _, err := e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: k.Claim.ID.String(),
			ExpectedSubjectEpoch: e.detail(subject).View.Item.ProofEpoch, Verdict: "ACCEPTED", Rationale: "checked", AssessedVersionID: version, ExpectedAssessmentID: e.seen(subject, k.Claim.ID)}); err != nil {
			t.Fatal(err)
		}
	}

	// Approval: completion first, verification only by an independent reviewer; a proof gate stays blocked until then.
	approval := e.requirement("Board approval")
	apprC, _ := e.criterion(approval.ID, port.CriterionInput{Title: "Approval minute", Mandatory: true, Rule: "NONE"})
	downstream := e.action(e.editor, "Prepare the agreement")
	if _, err := e.addDep(e.owner, approval.ID, downstream.ID, "PROOF"); err != nil {
		t.Fatal(err)
	}
	needAxes(t, "downstream before approval", axesOf(e.detail(downstream.ID).View), gwAxes{Dependency: "BLOCKED"})
	post := l.cp("Approval", "completion", e.editor, "EDITOR", approval.ID, func() { done(e.editor, approval.ID) })
	needAxes(t, "Approval completed", axesOf(post), gwAxes{Execution: "COMPLETED", Verification: "UNVERIFIED"})
	needAxes(t, "a completed but unproven prerequisite still blocks the proof gate", axesOf(e.detail(downstream.ID).View), gwAxes{Dependency: "BLOCKED"})
	post = l.cp("Approval", "verification", e.reviewer, "EDITOR (designated verifier)", approval.ID, func() { accept(approval.ID, apprC, "") })
	needAxes(t, "Approval verified", axesOf(post), gwAxes{Execution: "COMPLETED", Verification: "VERIFIED"})
	needAxes(t, "the proof gate opens only after verification", axesOf(e.detail(downstream.ID).View), gwAxes{Dependency: "READY"})

	// Document: v2 then v3; promotion changes authority and criteria, never Execution; a fixed-v2 criterion is preserved.
	agreement := e.requirement("Executed agreement")
	doc := e.document("Agreement")
	v2, v3 := e.version(doc.Document.ID.String(), sum(2)), e.version(doc.Document.ID.String(), sum(3))
	p := e.preview(doc.Document.ID.String(), v2)
	if _, err := e.promote(e.owner, doc.Document.ID.String(), v2, "", p.Document.Revision, "v2 is the draft of record", p.ImpactToken); err != nil {
		t.Fatal(err)
	}
	curC, _ := e.criterion(agreement.ID, port.CriterionInput{Title: "Current agreement", Mandatory: true, Rule: "CURRENT_AUTHORITATIVE", DocumentID: doc.Document.ID.String()})
	fixedC, _ := e.criterion(agreement.ID, port.CriterionInput{Title: "Draft v2 reviewed", Mandatory: false, Rule: "FIXED", FixedID: v2.String()})
	accept(agreement.ID, curC, v2.String())
	accept(agreement.ID, fixedC, v2.String())
	needAxes(t, "Document: both accepted", axesOf(e.detail(agreement.ID).View), gwAxes{Verification: "VERIFIED", Execution: "NOT_STARTED"})
	pre := e.preview(doc.Document.ID.String(), v3)
	post = l.cp("Document", "promote v3", e.owner, "OWNER", agreement.ID, func() {
		if _, err := e.promote(e.owner, doc.Document.ID.String(), v3, v2.String(), pre.Document.Revision, "v3 supersedes the draft", pre.ImpactToken); err != nil {
			t.Fatal(err)
		}
	})
	if post.Item.Execution != matter.ExecutionNotStarted || post.Item.Verification == matter.VerificationVerified {
		t.Fatalf("promotion changes authority and proof, never Execution: %+v", post.Item)
	}
	for _, c := range e.checklist(agreement.ID).Result.Criteria {
		switch c.Criterion.ID {
		case curC:
			if c.Satisfied {
				t.Fatalf("current-version proof needs v3 review: %+v", c)
			}
		case fixedC:
			if !c.Satisfied {
				t.Fatalf("fixed-v2 proof is preserved: %+v", c)
			}
		}
	}

	// Signature: components observed on the exact version; partial until every component is proven.
	sigC, _ := e.criterion(agreement.ID, port.CriterionInput{Title: "Seller signature", Mandatory: true, Rule: "NONE"})
	buyerC, _ := e.criterion(agreement.ID, port.CriterionInput{Title: "Buyer signature", Mandatory: true, Rule: "NONE"})
	accept(agreement.ID, curC, v3.String())
	if _, err := e.ev.RecordSignature(e.ctx, port.RecordSignatureCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Version: v3.String(), Signer: "Seller", SignedAt: "2026-06-15T09:00:00+07:00"}); err != nil {
		t.Fatal(err)
	}
	post = l.cp("Signature", "seller only", e.reviewer, "EDITOR (designated verifier)", agreement.ID, func() { accept(agreement.ID, sigC, "") })
	if post.Item.Verification == matter.VerificationVerified || post.Item.Execution != matter.ExecutionNotStarted {
		t.Fatalf("partial signatures: partial proof, no completion: %+v", post.Item)
	}
	post = l.cp("Signature", "buyer", e.reviewer, "EDITOR (designated verifier)", agreement.ID, func() { accept(agreement.ID, buyerC, "") })
	needAxes(t, "Signature complete", axesOf(post), gwAxes{Verification: "VERIFIED", Execution: "NOT_STARTED"})

	// Payment and Transfer: attested completion and verification stay apart; nothing is inferred between steps.
	payment, transfer := e.requirement("Payment confirmed"), e.requirement("Transfer recorded")
	payC, _ := e.criterion(payment.ID, port.CriterionInput{Title: "Payment confirmation", Mandatory: true, Rule: "NONE"})
	trC, _ := e.criterion(transfer.ID, port.CriterionInput{Title: "Transfer checklist", Mandatory: true, Rule: "NONE"})
	post = l.cp("Payment", "completion without proof", e.editor, "EDITOR", payment.ID, func() { done(e.editor, payment.ID) })
	needAxes(t, "Payment completed without proof", axesOf(post), gwAxes{Execution: "COMPLETED", Verification: "UNVERIFIED"})
	post = l.cp("Transfer", "completion without proof", e.editor, "EDITOR", transfer.ID, func() { done(e.editor, transfer.ID) })
	needAxes(t, "Transfer: payment and signatures prove nothing here", axesOf(post), gwAxes{Execution: "COMPLETED", Verification: "UNVERIFIED"})
	l.cp("Payment", "verification", e.reviewer, "EDITOR (designated verifier)", payment.ID, func() { accept(payment.ID, payC, "") })
	l.cp("Transfer", "verification", e.reviewer, "EDITOR (designated verifier)", transfer.ID, func() { accept(transfer.ID, trC, "") })

	// Closing: a milestone with no prerequisites is unassessed; READY only when every declared one is
	// satisfied; a cancelled prerequisite never satisfies it; a reopened one recomputes it.
	ms, err := e.work.CreateMilestone(e.ctx, port.CreateMilestoneCmd{ActorID: e.owner.String(), MatterID: e.m.String(), Name: "Closing", Critical: true})
	if err != nil {
		t.Fatal(err)
	}
	if ms.Status.State != matter.MilestoneUnassessed {
		t.Fatalf("no prerequisite: unassessed, not ready: %+v", ms.Status)
	}
	setPrereq := func(ids ...matter.NodeID) matter.MilestoneView {
		rev := e.milestoneRevision(ms.Milestone.ID.String())
		out := make([]string, len(ids))
		for i, id := range ids {
			out[i] = id.String()
		}
		v, err := e.work.SetMilestonePrerequisites(e.ctx, port.SetMilestonePrerequisitesCmd{ActorID: e.owner.String(), MatterID: e.m.String(), MilestoneID: ms.Milestone.ID.String(),
			ExpectedRevision: rev, Prerequisites: out, Critical: true, Reason: "closing gate"})
		if err != nil {
			t.Fatal(err)
		}
		return v
	}
	done(e.editor, agreement.ID) // execution is attested separately from the proof it already has
	closing := setPrereq(approval.ID, agreement.ID, payment.ID, transfer.ID)
	if closing.Status.State != matter.MilestoneReady || closing.Status.Satisfied != 4 {
		t.Fatalf("every explicit prerequisite satisfied: %+v", closing.Status)
	}
	// Reopen an upstream verified Requirement after closing: recompute, keep the history.
	post = l.cp("Closing", "reopen upstream", e.owner, "OWNER", approval.ID, func() {
		e.mustTransition(e.owner, approval.ID, "IN_PROGRESS", func(c *port.TransitionExecutionCmd) { c.Reason = "new facts" })
	})
	needAxes(t, "reopened upstream", axesOf(post), gwAxes{Execution: "IN_PROGRESS", Verification: "UNVERIFIED"})
	if post.Item.ProofEpoch != 1 {
		t.Fatalf("reopen advances the proof epoch: %d", post.Item.ProofEpoch)
	}
	if st := e.milestoneStatus(ms.Milestone.ID); st.State != matter.MilestoneNotReady {
		t.Fatalf("closing is recomputed from the reopened prerequisite, not remembered: %+v", st)
	}
	e.mustTransition(e.owner, approval.ID, "CANCELLED", func(c *port.TransitionExecutionCmd) { c.Reason = "scope change" })
	if st := e.milestoneStatus(ms.Milestone.ID); st.State == matter.MilestoneReady {
		t.Fatalf("a cancelled prerequisite never satisfies closing: %+v", st)
	}

	// Post-Closing: handover completes apart from its proof; a scoped viewer reads the same boundary.
	handover := e.requirement("Handover acknowledged")
	hoC, _ := e.criterion(handover.ID, port.CriterionInput{Title: "Acknowledgement", Mandatory: true, Rule: "NONE"})
	post = l.cp("Post-Closing", "handover completed", e.editor, "EDITOR", handover.ID, func() { done(e.editor, handover.ID) })
	needAxes(t, "handover completed", axesOf(post), gwAxes{Execution: "COMPLETED", Verification: "UNVERIFIED"})
	l.cp("Post-Closing", "handover reviewed", e.reviewer, "EDITOR (designated verifier)", handover.ID, func() { accept(handover.ID, hoC, "") })
	room, err := e.ctl.ControlRoom(e.ctx, port.ControlRoomQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
	if err != nil {
		t.Fatal(err)
	}
	grid := e.detail(handover.ID).View.Item
	if room.State.Total != 6 || grid.Verification != matter.VerificationVerified || grid.Execution != matter.ExecutionCompleted {
		t.Fatalf("Grid and Control Room agree at the boundary: total=%d grid=%+v", room.State.Total, grid)
	}
}

// gw02 walks Request → Document → Review → Gap → Finding → Follow-Up → Resolution with typed records:
// a completed request never completes or verifies a review Requirement.
func gw02(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	e.ensureReviewer()
	l := newGWLedger(t, e, "GW-02", "AC-162")
	done := func(actor matter.ActorID, id matter.NodeID) {
		e.mustTransition(actor, id, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "done", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
		})
	}

	// Request: an Action, distinct review and gap Requirements, a provider party.
	request := e.action(e.editor, "Send the document request list")
	review := e.requirement("Review the data room")
	gapR := e.requirement("Resolve the open IP assignment")
	provider, err := e.work.CreateParty(e.ctx, port.CreatePartyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Name: "Seller counsel", Kind: "EXTERNAL", Contact: "counsel@seller.test"})
	if err != nil {
		t.Fatal(err)
	}
	if request.Kind == review.Kind {
		t.Fatal("a request Action and a review Requirement are different typed records")
	}
	revC, _ := e.criterion(review.ID, port.CriterionInput{Title: "Corporate records", Mandatory: true, Rule: "NONE"})
	ipC, _ := e.criterion(review.ID, port.CriterionInput{Title: "IP assignments", Mandatory: true, Rule: "NONE"})
	post := l.cp("Request", "action completed", e.editor, "EDITOR", request.ID, func() { done(e.editor, request.ID) })
	needAxes(t, "Request completed", axesOf(post), gwAxes{Execution: "COMPLETED"})
	if r := e.detail(review.ID).View.Item; r.Execution != matter.ExecutionNotStarted || r.Verification != matter.VerificationUnverified {
		t.Fatalf("a completed request neither completes nor verifies the review: %+v", r)
	}

	// Document: the pack arrives as an exact version; a new version is neither accepted proof nor authority.
	pack := e.document("Data room pack")
	v2 := e.version(pack.Document.ID.String(), sum(2))
	if d, err := e.ev.GetDocument(e.ctx, port.DocumentQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), DocumentID: pack.Document.ID.String()}); err != nil || d.Document.CurrentVersionID != nil {
		t.Fatalf("an uploaded version is not automatically authoritative: %+v %v", d.Document.CurrentVersionID, err)
	}
	if e.detail(review.ID).View.Item.Verification != matter.VerificationUnverified {
		t.Fatal("bytes are not proof")
	}

	// Review: U2 reviews independently; a rejection stays visible and non-satisfying.
	if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) {
		s.Reference, s.VersionID, s.Claims = "", v2.String(), []string{revC.String(), ipC.String()}
	}); err != nil {
		t.Fatal(err)
	}
	asm := func(crit matter.CriterionID, verdict string) {
		k := e.claimOf(review.ID, crit)
		if _, err := e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: k.Claim.ID.String(),
			ExpectedSubjectEpoch: e.detail(review.ID).View.Item.ProofEpoch, Verdict: verdict, Rationale: "reviewed", AssessedVersionID: v2.String(), ExpectedAssessmentID: e.seen(review.ID, k.Claim.ID)}); err != nil {
			t.Fatal(err)
		}
	}
	mustCode(t, "the submitter does not review", errOf(e.assess(e.editor, review.ID, e.claimOf(review.ID, revC).Claim.ID, "ACCEPTED")), "not-verifier")
	post = l.cp("Review", "one accepted", e.reviewer, "EDITOR (designated verifier)", review.ID, func() { asm(revC, "ACCEPTED") })
	needAxes(t, "Review partial", axesOf(post), gwAxes{Verification: "PARTIALLY_VERIFIED", Execution: "NOT_STARTED"})

	// Gap: the missing component stays a criterion; no fabricated evidence, no suppression because a document exists.
	post = l.cp("Gap", "IP assignments rejected", e.reviewer, "EDITOR (designated verifier)", review.ID, func() { asm(ipC, "REJECTED") })
	if post.Item.Verification == matter.VerificationVerified {
		t.Fatalf("a rejected mandatory component keeps the review partial: %+v", post.Item)
	}
	for _, c := range e.checklist(review.ID).Result.Criteria {
		if c.Criterion.ID == ipC && (c.Satisfied || c.Reason != matter.CriterionRejected) {
			t.Fatalf("the rejection is visible and non-satisfying: %+v", c)
		}
	}

	// Finding: a typed context record linked to the Requirement; it changes no status or proof.
	beforeFinding := axesOf(e.detail(gapR.ID).View)
	post = l.cp("Finding", "typed record", e.editor, "EDITOR", gapR.ID, func() {
		if _, err := e.ctl.CreateContextRecord(e.ctx, port.CreateContextRecordCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
			Kind: "FINDING", Title: "IP assignment missing for the 2019 patent", Links: []string{gapR.ID.String()}}); err != nil {
			t.Fatal(err)
		}
	})
	if got := axesOf(post); got.Execution != beforeFinding.Execution || got.Verification != beforeFinding.Verification {
		t.Fatalf("a finding does not complete or verify work: %v -> %v", beforeFinding, got)
	}

	// Follow-Up: an accountable follow-up waits on the provider; WAITING may coexist with READY dependency.
	followUp := e.action(e.owner, "Obtain the executed IP assignment")
	if _, err := e.work.UpdateWorkItem(e.ctx, port.UpdateWorkItemCmd{ActorID: e.editor.String(), MatterID: e.m.String(), ItemID: followUp.ID.String(), ExpectedRevision: 1,
		Owner: port.OptString{Set: true, Value: e.editor.String()}}); err != nil {
		t.Fatal(err) // waiting needs an accountable internal owner
	}
	post = l.cp("Follow-Up", "waiting on the provider", e.editor, "EDITOR", followUp.ID, func() {
		e.mustTransition(e.editor, followUp.ID, "WAITING", func(c *port.TransitionExecutionCmd) {
			c.WaitingPartyID, c.WaitingCondition = provider.ID.String(), "executed assignment from seller counsel"
		})
	})
	needAxes(t, "Follow-up waiting", axesOf(post), gwAxes{Execution: "WAITING", Dependency: "READY"})

	// Resolution: supplemental proof, independent assessment, then an explicit attestation of the outcome.
	if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) {
		s.Reference, s.Claims = "assignment-2019-executed", []string{ipC.String()}
	}); err != nil {
		t.Fatal(err)
	}
	k := e.claimOf(review.ID, ipC)
	if _, err := e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: k.Claim.ID.String(),
		ExpectedSubjectEpoch: e.detail(review.ID).View.Item.ProofEpoch, Verdict: "ACCEPTED", Rationale: "supplemental proof valid", ExpectedAssessmentID: e.seen(review.ID, k.Claim.ID)}); err != nil {
		t.Fatal(err)
	}
	post = e.detail(review.ID).View
	needAxes(t, "Resolution proof", axesOf(post), gwAxes{Verification: "VERIFIED", Execution: "NOT_STARTED"})
	if post.Item.Execution == matter.ExecutionCompleted {
		t.Fatal("verification alone never completes work")
	}
	l.cp("Resolution", "follow-up completed", e.editor, "EDITOR", followUp.ID, func() { done(e.editor, followUp.ID) })
	post = l.cp("Resolution", "attest the outcome", e.editor, "EDITOR", review.ID, func() { done(e.editor, review.ID) })
	needAxes(t, "Resolution attested", axesOf(post), gwAxes{Execution: "COMPLETED", Verification: "VERIFIED"})
	// Readback: the finding and the gap lineage remain; the history shows the follow-up wait.
	found := false
	for _, ev := range e.events() {
		if ev.Type == "context.created" {
			found = true
		}
	}
	if !found {
		t.Fatal("the finding stays in the history")
	}
}

func (e *w2Env) milestoneView(id string) matter.MilestoneView {
	e.t.Helper()
	ms, err := e.work.ListMilestones(e.ctx, port.MatterListQuery{ActorID: e.owner.String(), MatterID: e.m.String()})
	if err != nil {
		e.t.Fatal(err)
	}
	for _, m := range ms {
		if m.Milestone.ID.String() == id {
			return m
		}
	}
	e.t.Fatalf("milestone %s not found", id)
	return matter.MilestoneView{}
}

func (e *w2Env) milestoneRevision(id string) int64 { return e.milestoneView(id).Milestone.Revision }

func (e *w2Env) milestoneStatus(id matter.MilestoneID) matter.MilestoneStatus {
	return e.milestoneView(id.String()).Status
}
