package mattercontrol

// Shared W4 contract: the regulatory-filing stage machine, exact submissions, repeated supplement
// cycles, negative paths, correction and owner reopen with proof epochs. It runs unchanged against
// the in-memory double and the PostgreSQL adapter.

import (
	"errors"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

type filingFx struct {
	e        *w2Env
	req      matter.WorkItem
	party    matter.Party
	filingID matter.NodeID
}

func (e *w2Env) newFiling(proofRequired bool) filingFx {
	e.t.Helper()
	e.ensureReviewer()
	req := e.requirement("Obtain merger clearance")
	p, err := e.work.CreateParty(e.ctx, port.CreatePartyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Name: "Competition authority", Kind: "AUTHORITY", Contact: "desk@authority.test"})
	if err != nil {
		e.t.Fatal(err)
	}
	res, err := e.fil.CreateFiling(e.ctx, port.CreateFilingCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
		Title: "Merger filing", Outcome: "Clearance decision", RequirementID: req.ID.String(), AuthorityPartyID: p.ID.String(),
		OwnerID: e.editor.String(), ProofRequired: proofRequired,
	})
	if err != nil {
		e.t.Fatalf("create filing: %v", err)
	}
	return filingFx{e: e, req: req, party: p, filingID: matter.NodeID(res.ID)}
}

func (f filingFx) get() matter.FilingDetail {
	f.e.t.Helper()
	d, err := f.e.fil.GetFiling(f.e.ctx, port.FilingQuery{ActorID: f.e.viewer.String(), MatterID: f.e.m.String(), FilingID: f.filingID.String()})
	if err != nil {
		f.e.t.Fatal(err)
	}
	return d
}

func (f filingFx) adv(actor matter.ActorID, to string, mut func(*port.AdvanceFilingCmd)) (matter.FilingDetail, error) {
	cmd := port.AdvanceFilingCmd{ActorID: actor.String(), MatterID: f.e.m.String(), FilingID: f.filingID.String(), ExpectedRevision: f.get().View.Item.Revision, To: to}
	if mut != nil {
		mut(&cmd)
	}
	return f.e.fil.Advance(f.e.ctx, cmd)
}

func (f filingFx) must(to string, mut func(*port.AdvanceFilingCmd)) matter.FilingDetail {
	f.e.t.Helper()
	d, err := f.adv(f.e.editor, to, mut)
	if err != nil {
		f.e.t.Fatalf("advance to %s: %v", to, err)
	}
	if d.Filing.Stage != matter.FilingStage(to) {
		f.e.t.Fatalf("stage after advance to %s: %s", to, d.Filing.Stage)
	}
	return d
}

// sign records the observed signature on a version, which a no-proof filing needs before it can
// submit it (F03; the alternative is the OWNER no-signature decision).
func (f filingFx) sign(v matter.VersionID) {
	f.e.t.Helper()
	if _, err := f.e.ev.RecordSignature(f.e.ctx, port.RecordSignatureCmd{ActorID: f.e.editor.String(), MatterID: f.e.m.String(), Version: v.String(), Signer: "A. Signer", SignedAt: "2020-01-01T00:00:00Z"}); err != nil {
		f.e.t.Fatalf("record signature: %v", err)
	}
}

func (f filingFx) evidence(label string) string {
	f.e.t.Helper()
	r, err := f.e.submit(f.e.editor, func(s *port.SubmitEvidenceCmd) { s.Reference = label })
	if err != nil {
		f.e.t.Fatal(err)
	}
	return r.ID
}

// declarePackage declares the filing's package criterion and has an independent verifier accept
// the evidence for it. Every filing needs this before package preparation (F03).
func (f filingFx) declarePackage() {
	f.e.t.Helper()
	crit, _ := f.e.criterion(f.filingID, port.CriterionInput{Title: "Package complete", Mandatory: true, Rule: "NONE"})
	if _, err := f.e.submit(f.e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{crit.String()} }); err != nil {
		f.e.t.Fatal(err)
	}
	if _, err := f.e.assess(f.e.reviewer, f.filingID, f.e.claimOf(f.filingID, crit).Claim.ID, "ACCEPTED"); err != nil {
		f.e.t.Fatal(err)
	}
}

// toReview drives a no-proof filing to AUTHORITY_REVIEW: package criterion declared and accepted,
// and a signature observed on the submitted version.
func (f filingFx) toReview() {
	f.e.t.Helper()
	v := f.e.version(f.e.document("Package").Document.ID.String(), sum(1))
	f.declarePackage()
	f.must("PACKAGE_PREPARATION", nil)
	f.must("SIGNATURE", func(c *port.AdvanceFilingCmd) { c.VersionIDs = []string{v.String()} })
	f.sign(v)
	f.must("SUBMISSION", func(c *port.AdvanceFilingCmd) { c.Reference = "SUB-1"; c.VersionIDs = []string{v.String()} })
	f.must("RECEIPT", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{f.evidence("ack")} })
	f.must("AUTHORITY_REVIEW", nil)
}

func past() string { return time.Now().Add(-time.Minute).UTC().Format(time.RFC3339) }

// SuiteW4 runs the W4 contract against any Bundle whose Store supports filings.
func SuiteW4(t *testing.T, newBundle Factory) {
	t.Helper()

	// F-07: every CAS Save maps a zero-row update to ErrVersionConflict (412, "re-read and
	// retry") — SaveFiling included, uniformly with SaveWorkItem/SaveParty/SaveMilestone/
	// SaveContextRecord/SaveDocument/SaveCriterion/SaveReviewGrid. The service loads the
	// aggregate in the same transaction, so zero rows can only be a concurrent change.
	t.Run("a zero-row filing save is a version conflict like every other CAS save", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		err := e.b.Store.Execute(e.ctx, e.m, func(tx port.MatterTx) error {
			ft, ok := tx.(port.FilingTx)
			if !ok {
				return errors.New("store does not implement port.FilingTx")
			}
			return ft.SaveFiling(e.ctx, matter.Filing{ItemID: matter.NodeID(newKey())})
		})
		if !errors.Is(err, port.ErrVersionConflict) {
			t.Fatalf("zero-row SaveFiling must be ErrVersionConflict, got %v", err)
		}
	})

	t.Run("create: receipted; linked Requirement and authority; status follows the stage", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		e.ensureReviewer()
		req := e.requirement("Clearance")
		p, _ := e.work.CreateParty(e.ctx, port.CreatePartyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Name: "Authority"})
		cmd := port.CreateFilingCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
			Title: "Filing", Outcome: "Decision", RequirementID: req.ID.String(), AuthorityPartyID: p.ID.String(), OwnerID: e.editor.String(), ProofRequired: true}
		first, err := e.fil.CreateFiling(e.ctx, cmd)
		if err != nil || first.Replayed || first.Kind != "FILING" {
			t.Fatalf("%+v %v", first, err)
		}
		if again, err := e.fil.CreateFiling(e.ctx, cmd); err != nil || !again.Replayed || again.ID != first.ID {
			t.Fatalf("replay: %+v %v", again, err)
		}
		bad := cmd
		bad.IdempotencyKey = newKey()
		bad.AuthorityPartyID = "01a17c8f-15d0-7386-8133-c1625313f6d1"
		mustCode(t, "unknown authority", errOf(e.fil.CreateFiling(e.ctx, bad)), "unknown-party")
		bad.AuthorityPartyID, bad.RequirementID = p.ID.String(), p.ID.String()
		mustCode(t, "not a Requirement", errOf(e.fil.CreateFiling(e.ctx, bad)), "unknown-requirement")
		cmd.IdempotencyKey, cmd.ActorID = newKey(), e.viewer.String()
		mustIs(t, "viewer", errOf(e.fil.CreateFiling(e.ctx, cmd)), port.ErrForbidden)

		f := filingFx{e: e, req: req, party: p, filingID: matter.NodeID(first.ID)}
		d := f.get()
		it := d.View.Item
		if d.Filing.Stage != matter.StageRequirement || d.Filing.RequirementID != req.ID || d.Filing.AuthorityPartyID != p.ID ||
			!it.ProofRequired || it.Execution != matter.ExecutionNotStarted || it.Kind != matter.NodeAction || len(d.Cycles) != 1 || d.Cycles[0].No != 1 {
			t.Fatalf("%+v", d)
		}
		// A filing's status follows its stage: the generic transition is refused.
		_, err = e.transition(e.editor, f.filingID, "IN_PROGRESS", nil)
		mustCode(t, "managed by the stage", err, "managed-by-filing")
		lst, err := e.fil.ListFilings(e.ctx, port.MatterListQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
		if err != nil || len(lst) != 1 {
			t.Fatalf("%+v %v", lst, err)
		}
		_, err = e.fil.GetFiling(e.ctx, port.FilingQuery{ActorID: e.out.String(), MatterID: e.m.String(), FilingID: f.filingID.String()})
		mustIs(t, "outsider", err, port.ErrNotFound)
		_, err = e.fil.GetFiling(e.ctx, port.FilingQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), FilingID: req.ID.String()})
		mustIs(t, "a Requirement is not a filing", err, port.ErrNotFound)
	})

	t.Run("full flow with proof: guards, exact submissions, repeated cycles, approval, reopen epoch (AC-116,129,145,163)", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		f := e.newFiling(true)

		// REQUIREMENT -> PACKAGE needs declared package criteria.
		mustCode(t, "criteria first", errOf(f.adv(e.editor, "PACKAGE_PREPARATION", nil)), "package-criteria-required")
		sig, _ := e.criterion(f.filingID, port.CriterionInput{Title: "Signed filing form", Mandatory: true, Rule: "NONE"})
		f.must("PACKAGE_PREPARATION", nil)
		if it := f.get().View.Item; it.Execution != matter.ExecutionInProgress {
			t.Fatalf("package preparation is in progress: %+v", it)
		}

		doc := e.document("Filing package").Document.ID.String()
		v1, v2, v3 := e.version(doc, sum(1)), e.version(doc, sum(2)), e.version(doc, sum(3))
		mustCode(t, "versions identified", errOf(f.adv(e.editor, "SIGNATURE", nil)), "package-contents-required")
		mustCode(t, "unknown version", errOf(f.adv(e.editor, "SIGNATURE", func(c *port.AdvanceFilingCmd) {
			c.VersionIDs = []string{"01a17c8f-15d0-7386-8133-c1625313f6d1"}
		})), "unknown-version")
		f.must("SIGNATURE", func(c *port.AdvanceFilingCmd) { c.VersionIDs = []string{v1.String()} })

		// FL-03: a missing signature blocks submission, with the reason, and records nothing.
		evBefore, revBefore := len(e.events()), f.get().View.Item.Revision
		_, err := f.adv(e.editor, "SUBMISSION", func(c *port.AdvanceFilingCmd) { c.Reference = "SUB-1"; c.VersionIDs = []string{v1.String()} })
		mustCode(t, "AC-145 missing signature", err, "guard-failed")
		var rej *matter.RejectedError
		if !errors.As(err, &rej) || rej.Message == "" {
			t.Fatalf("the refusal names what is missing: %v", err)
		}
		if len(e.events()) != evBefore || f.get().View.Item.Revision != revBefore || len(f.get().Submissions) != 0 {
			t.Fatal("a refused stage change leaves no event, no revision and no submission")
		}
		// the proof is offered by the editor and accepted by an independent verifier
		if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{sig.String()} }); err != nil {
			t.Fatal(err)
		}
		if _, err := e.assess(e.reviewer, f.filingID, e.claimOf(f.filingID, sig).Claim.ID, "ACCEPTED"); err != nil {
			t.Fatal(err)
		}
		// stale revision, future time, missing reference
		_, err = e.fil.Advance(e.ctx, port.AdvanceFilingCmd{ActorID: e.editor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(), ExpectedRevision: revBefore - 1, To: "SUBMISSION"})
		mustIs(t, "stale", err, port.ErrPreconditionFailed)
		_, err = f.adv(e.editor, "SUBMISSION", func(c *port.AdvanceFilingCmd) { c.VersionIDs = []string{v1.String()} })
		mustCode(t, "reference", err, "reference-required")
		_, err = f.adv(e.editor, "SUBMISSION", func(c *port.AdvanceFilingCmd) {
			c.Reference, c.VersionIDs, c.ObservedAt = "SUB-1", []string{v1.String()}, time.Now().Add(48*time.Hour).UTC().Format(time.RFC3339)
		})
		mustCode(t, "future observation", err, "observed-in-future")
		d := f.must("SUBMISSION", func(c *port.AdvanceFilingCmd) {
			c.Reference, c.VersionIDs, c.ObservedAt = "SUB-1", []string{v1.String()}, past()
		})
		if d.View.Item.Execution != matter.ExecutionWaiting || d.View.Item.WaitingPartyID == nil || *d.View.Item.WaitingPartyID != f.party.ID ||
			len(d.Submissions) != 1 || d.Submissions[0].Versions[0] != v1 || d.Cycles[0].SubmittedAt == nil {
			t.Fatalf("submitted is not completed; it waits for the acknowledgement: %+v", d.View.Item)
		}
		mustCode(t, "AC-160 unlisted pair", errOf(f.adv(e.editor, "AUTHORITY_REVIEW", nil)), "transition-not-allowed")
		mustCode(t, "receipt needs acknowledgement evidence", errOf(f.adv(e.editor, "RECEIPT", nil)), "evidence-required")
		f.must("RECEIPT", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{f.evidence("ack-1")} })
		d = f.must("AUTHORITY_REVIEW", nil)
		// FL-01: receipt and review are not approval
		if d.View.Item.Execution != matter.ExecutionWaiting || d.Filing.Stage == matter.StageApproval || d.View.Item.CompletedAt != nil {
			t.Fatalf("AC-116: %+v", d.View.Item)
		}

		// FL-02: two supplement cycles, each with its own exact submission; earlier ones stay intact
		mustCode(t, "supplement details", errOf(f.adv(e.editor, "SUPPLEMENT", nil)), "supplement-details-required")
		due := time.Now().Add(72 * time.Hour).UTC().Format(time.RFC3339)
		supp := func(ref string) {
			f.must("SUPPLEMENT", func(c *port.AdvanceFilingCmd) { c.RequestRef, c.CycleOwnerID, c.CycleDue = ref, e.editor.String(), due })
		}
		supp("REQ-1")
		extra, _ := e.criterion(f.filingID, port.CriterionInput{Title: "Additional market data", Mandatory: true, Rule: "NONE"})
		_, err = f.adv(e.editor, "RESPONSE", func(c *port.AdvanceFilingCmd) { c.Reference = "RESP-2"; c.VersionIDs = []string{v2.String()} })
		mustCode(t, "requested items not yet satisfied", err, "guard-failed")
		if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{extra.String()} }); err != nil {
			t.Fatal(err)
		}
		if _, err := e.assess(e.reviewer, f.filingID, e.claimOf(f.filingID, extra).Claim.ID, "ACCEPTED"); err != nil {
			t.Fatal(err)
		}
		f.must("RESPONSE", func(c *port.AdvanceFilingCmd) { c.Reference = "RESP-2"; c.VersionIDs = []string{v2.String()} })
		f.must("AUTHORITY_REVIEW", nil)
		supp("REQ-2")
		f.must("RESPONSE", func(c *port.AdvanceFilingCmd) { c.Reference = "RESP-3"; c.VersionIDs = []string{v3.String()} })
		d = f.must("AUTHORITY_REVIEW", nil)
		if len(d.Cycles) != 3 || d.Filing.CurrentCycle != 3 || len(d.Submissions) != 3 {
			t.Fatalf("AC-129: %+v", d)
		}
		for i, want := range []matter.VersionID{v1, v2, v3} {
			if d.Submissions[i].CycleNo != i+1 || len(d.Submissions[i].Versions) != 1 || d.Submissions[i].Versions[0] != want {
				t.Fatalf("each cycle keeps its own exact versions: %+v", d.Submissions)
			}
		}

		// Approval needs outcome evidence; approval completes the filing but not the Requirement.
		mustCode(t, "outcome evidence", errOf(f.adv(e.editor, "APPROVAL", nil)), "evidence-required")
		outcome1 := f.evidence("decision-1")
		d = f.must("APPROVAL", func(c *port.AdvanceFilingCmd) {
			c.EvidenceIDs = []string{outcome1}
			c.Reference = "DEC-1"
			c.ObservedAt = past()
		})
		if d.View.Item.Execution != matter.ExecutionCompleted || d.View.Item.CompletedAt == nil || len(d.Next) != 0 {
			t.Fatalf("%+v", d.View.Item)
		}
		if r := e.detail(f.req.ID).View.Item; r.Execution != matter.ExecutionNotStarted || r.Verification == matter.VerificationVerified {
			t.Fatalf("filing approval never completes or verifies the Requirement: %+v", r)
		}
		mustCode(t, "closed", errOf(f.adv(e.editor, "APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{outcome1} })), "filing-closed")

		// FL-08: reopen is an owner decision; history stays, the epoch advances, proof must be redone.
		reopen := func(actor matter.ActorID, reason string) (matter.FilingDetail, error) {
			return e.fil.Reopen(e.ctx, port.ReasonedFilingCmd{ActorID: actor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(), ExpectedRevision: f.get().View.Item.Revision, Reason: reason})
		}
		mustIs(t, "editor", errOf(reopen(e.editor, "x")), port.ErrForbidden)
		mustCode(t, "reason", errOf(reopen(e.owner, " ")), "reason-required")
		d, err = reopen(e.owner, "authority asked to reconsider")
		if err != nil {
			t.Fatal(err)
		}
		if d.View.Item.Execution != matter.ExecutionInProgress || d.View.Item.ProofEpoch != 1 || len(d.Submissions) != 3 || d.Filing.Stage != matter.StageApproval {
			t.Fatalf("%+v", d)
		}
		e.state("old assessments no longer count after reopen", f.filingID, matter.VerificationUnverified)
		mustCode(t, "only pre-reopen evidence", errOf(f.adv(e.editor, "APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{outcome1} })), "evidence-before-reopen")
		outcome2 := f.evidence("decision-2")
		d = f.must("APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{outcome2}; c.Reference = "DEC-2" })
		if d.View.Item.Execution != matter.ExecutionCompleted || len(d.Submissions) != 3 {
			t.Fatalf("%+v", d)
		}
	})

	t.Run("negative path: rejection, close, reopen, approval only on new evidence (FL-04, FL-09)", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		f := e.newFiling(false)
		neg := func(actor matter.ActorID, kind string, evidence ...string) (matter.FilingDetail, error) {
			return e.fil.RecordNegative(e.ctx, port.RecordNegativeCmd{ActorID: actor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(),
				ExpectedRevision: f.get().View.Item.Revision, Outcome: kind, EvidenceIDs: evidence, Reference: "REJ-1"})
		}
		mustCode(t, "nothing submitted yet", errOf(neg(e.editor, "REJECTED", f.evidence("early"))), "not-submitted")
		f.toReview()
		mustCode(t, "evidence", errOf(neg(e.editor, "REJECTED")), "evidence-required")
		mustCode(t, "outcome kind", errOf(neg(e.editor, "MAYBE", f.evidence("x"))), "invalid-outcome")
		mustIs(t, "viewer", errOf(neg(e.viewer, "REJECTED", f.evidence("y"))), port.ErrForbidden)
		d, err := neg(e.editor, "REJECTED", f.evidence("rejection letter"))
		if err != nil {
			t.Fatal(err)
		}
		if d.Filing.Stage != matter.StageReview || d.Filing.NegativeOutcome != matter.OutcomeRejected || d.View.Attention.State == matter.AttentionNormal {
			t.Fatalf("a rejection raises attention and never moves the stage: %+v", d)
		}
		found := false
		for _, r := range d.View.Attention.Reasons {
			found = found || r == matter.AttnNegativeOutcome
		}
		if !found {
			t.Fatalf("the reason is visible: %+v", d.View.Attention)
		}
		mustCode(t, "approval refused while the rejection stands", errOf(f.adv(e.editor, "APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{f.evidence("hopeful")} })), "negative-outcome-open")

		closeNeg := func(actor matter.ActorID, reason string) (matter.FilingDetail, error) {
			return e.fil.CloseNegative(e.ctx, port.ReasonedFilingCmd{ActorID: actor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(), ExpectedRevision: f.get().View.Item.Revision, Reason: reason})
		}
		mustIs(t, "editor", errOf(closeNeg(e.editor, "x")), port.ErrForbidden)
		mustCode(t, "reason", errOf(closeNeg(e.owner, "")), "reason-required")
		d, err = closeNeg(e.owner, "the authority refused; closing")
		if err != nil {
			t.Fatal(err)
		}
		if d.View.Item.Execution != matter.ExecutionCancelled {
			t.Fatalf("%+v", d.View.Item)
		}
		if r := e.detail(f.req.ID).View.Item; r.Execution != matter.ExecutionNotStarted {
			t.Fatalf("the linked Requirement stays unmet: %+v", r)
		}
		mustCode(t, "closed filing", errOf(f.adv(e.editor, "APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{f.evidence("z")} })), "filing-closed")
		mustCode(t, "nothing to close twice", errOf(closeNeg(e.owner, "again")), "no-negative-outcome")

		// FL-09: reopen, then approval on outcome evidence recorded after the reopen
		if _, err := e.fil.Reopen(e.ctx, port.ReasonedFilingCmd{ActorID: e.owner.String(), MatterID: e.m.String(), FilingID: f.filingID.String(), ExpectedRevision: f.get().View.Item.Revision, Reason: "appeal granted"}); err != nil {
			t.Fatal(err)
		}
		d = f.must("APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{f.evidence("appeal decision")} })
		if d.View.Item.Execution != matter.ExecutionCompleted || len(d.Submissions) != 1 {
			t.Fatalf("%+v", d)
		}
	})

	t.Run("no-supplement path, proof not required, role matrix and stage machine (FL-05,06,07,10)", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		f := e.newFiling(false)
		f.toReview()
		d := f.must("APPROVAL", func(c *port.AdvanceFilingCmd) { c.EvidenceIDs = []string{f.evidence("outcome")} })
		it := d.View.Item
		if it.Execution != matter.ExecutionCompleted || it.ProofRequired || it.Verification != "" || len(d.Cycles) != 1 {
			t.Fatalf("FL-10: approval completes; verification does not apply: %+v", it)
		}

		g := e.newFiling(false)
		// every unlisted pair is rejected, and a viewer cannot write
		for _, to := range []string{"SIGNATURE", "SUBMISSION", "RECEIPT", "AUTHORITY_REVIEW", "SUPPLEMENT", "RESPONSE", "APPROVAL"} {
			mustCode(t, "REQUIREMENT -> "+to, errOf(g.adv(e.editor, to, nil)), "transition-not-allowed")
		}
		mustCode(t, "unknown stage", errOf(g.adv(e.editor, "DONE", nil)), "invalid-stage")
		mustIs(t, "viewer", errOf(g.adv(e.viewer, "PACKAGE_PREPARATION", nil)), port.ErrForbidden)
		mustIs(t, "outsider", errOf(g.adv(e.out, "PACKAGE_PREPARATION", nil)), port.ErrNotFound)
		_, err := e.fil.Advance(e.ctx, port.AdvanceFilingCmd{ActorID: e.editor.String(), MatterID: e.m.String(), FilingID: g.filingID.String(), To: "PACKAGE_PREPARATION"})
		mustIs(t, "revision required", err, port.ErrPreconditionRequired)

		// a filing without an owner cannot start package preparation
		req := e.requirement("No owner")
		res, err := e.fil.CreateFiling(e.ctx, port.CreateFilingCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
			Title: "Unowned", Outcome: "x", RequirementID: req.ID.String(), AuthorityPartyID: g.party.ID.String()})
		if err != nil {
			t.Fatal(err)
		}
		h := filingFx{e: e, filingID: matter.NodeID(res.ID)}
		mustCode(t, "owner required", errOf(h.adv(e.editor, "PACKAGE_PREPARATION", nil)), "owner-required")

		// FL-06: signature criteria made non-applicable by an owner revision, then submission is allowed
		k := e.newFiling(true)
		sig, _ := e.criterion(k.filingID, port.CriterionInput{Title: "Wet-ink signature", Mandatory: true, Rule: "NONE"})
		v := e.version(e.document("Package").Document.ID.String(), sum(7))
		k.must("PACKAGE_PREPARATION", nil)
		k.must("SIGNATURE", func(c *port.AdvanceFilingCmd) { c.VersionIDs = []string{v.String()} })
		submit := func() (matter.FilingDetail, error) {
			return k.adv(e.editor, "SUBMISSION", func(c *port.AdvanceFilingCmd) { c.Reference = "S"; c.VersionIDs = []string{v.String()} })
		}
		mustCode(t, "signature missing", errOf(submit()), "guard-failed")
		rev := e.checklist(k.filingID).Result.Criteria[0].Criterion.Revision
		if _, err := e.ev.ReviseCriterion(e.ctx, port.ReviseCriterionCmd{ActorID: e.owner.String(), MatterID: e.m.String(), CriterionID: sig.String(), ExpectedRevision: rev,
			Reason: "no signature is required for this authority", Retire: true}); err != nil {
			t.Fatal(err)
		}
		if _, err := submit(); err != nil {
			t.Fatalf("the owner's reasoned revision removes the signature requirement: %v", err)
		}
	})

	t.Run("correction: appended, never edited; owner only (AC-163)", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		f := e.newFiling(false)
		f.toReview()
		d := f.get()
		var target matter.FilingObservation
		for _, o := range d.Observations {
			if o.To == matter.StageSubmission {
				target = o
			}
		}
		correct := func(actor matter.ActorID, id, ref, reason string) (matter.FilingDetail, error) {
			return e.fil.CorrectObservation(e.ctx, port.CorrectObservationCmd{ActorID: actor.String(), MatterID: e.m.String(), FilingID: f.filingID.String(),
				ExpectedRevision: f.get().View.Item.Revision, ObservationID: id, Reference: ref, Reason: reason})
		}
		mustIs(t, "editor", errOf(correct(e.editor, target.ID, "SUB-1b", "typo")), port.ErrForbidden)
		mustCode(t, "reason", errOf(correct(e.owner, target.ID, "SUB-1b", "")), "reason-required")
		mustIs(t, "unknown observation", errOf(correct(e.owner, "01a17c8f-15d0-7386-8133-c1625313f6d1", "x", "typo")), port.ErrNotFound)
		got, err := correct(e.owner, target.ID, "SUB-1b", "typo in the reference")
		if err != nil {
			t.Fatal(err)
		}
		n := len(got.Observations)
		last := got.Observations[n-1]
		if last.Kind != matter.ObsCorrection || last.CorrectsID != target.ID || last.Reference != "SUB-1b" || n != len(d.Observations)+1 {
			t.Fatalf("%+v", last)
		}
		for _, o := range got.Observations {
			if o.ID == target.ID && o.Reference != target.Reference {
				t.Fatal("the original observation is never edited")
			}
		}
		mustCode(t, "correct the original", errOf(correct(e.owner, last.ID, "x", "again")), "correct-the-original")
	})
}
