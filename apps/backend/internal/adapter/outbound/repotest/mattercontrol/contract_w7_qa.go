package mattercontrol

// Postrun QA regressions (F01..F03). They run unchanged against the in-memory double and the
// PostgreSQL adapter through the shared Factory.

import (
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// SuiteW7QA runs the postrun QA regressions against any Bundle whose Store supports evidence and filings.
func SuiteW7QA(t *testing.T, newBundle Factory) {
	t.Helper()

	// F01: an unresolved dispute survives evidence withdrawal and acceptance revocation: the
	// subject stays DISPUTED and non-satisfying until an authorized resolution recomputes it.
	for _, drop := range []string{"withdrawn", "revoked"} {
		t.Run("F01 dispute survives "+drop, func(t *testing.T) {
			e := newW2Env(t, newBundle)
			e.ensureReviewer()
			second := e.newVerifier()
			r := e.requirement("F01 disputed subject")
			c1, _ := e.criterion(r.ID, port.CriterionInput{Title: "Mandatory proof", Mandatory: true, Rule: "NONE"})
			ev, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{c1.String()} })
			if err != nil {
				t.Fatal(err)
			}
			k := e.claimOf(r.ID, c1)
			if _, err := e.assess(e.reviewer, r.ID, k.Claim.ID, "ACCEPTED"); err != nil {
				t.Fatal(err)
			}
			e.state("accepted before dispute", r.ID, matter.VerificationVerified)
			cur := e.claimOf(r.ID, c1).Current
			if _, err := e.ev.RaiseDispute(e.ctx, port.RaiseDisputeCmd{ActorID: e.editor.String(), MatterID: e.m.String(), AssessmentID: cur.ID.String(), Reason: "signature page missing"}); err != nil {
				t.Fatal(err)
			}
			e.state("open dispute", r.ID, matter.VerificationDisputed)

			if drop == "withdrawn" {
				_, err = e.ev.WithdrawEvidence(e.ctx, port.WithdrawEvidenceCmd{ActorID: e.editor.String(), MatterID: e.m.String(), EvidenceID: ev.ID, Reason: "wrong document attached"})
			} else {
				_, err = e.ev.RevokeAssessment(e.ctx, port.RevokeAssessmentCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), AssessmentID: cur.ID.String(), Reason: "acceptance revoked"})
			}
			if err != nil {
				t.Fatalf("%s: %v", drop, err)
			}
			e.state("still DISPUTED after the drop", r.ID, matter.VerificationDisputed)
			cs := e.claimOf(r.ID, c1)
			if !cs.Disputed || cs.Satisfying {
				t.Fatalf("open dispute must stay visible and non-satisfying: %+v", cs)
			}

			// An authorized resolution recomputes from the remaining proof (now unsatisfying).
			if _, err := e.ev.ResolveDispute(e.ctx, port.ResolveDisputeCmd{ActorID: second.String(), MatterID: e.m.String(), DisputeID: e.openDispute().String(), Resolution: "moot after " + drop}); err != nil {
				t.Fatal(err)
			}
			e.state("after resolution recomputes from remaining proof", r.ID, matter.VerificationUnverified)
		})
	}

	// F02: an assessment binds to the assessment the reviewer saw. A missing binding is 428, a
	// stale binding is 412 with no mutation, and a fresh explicit supersession still works.
	t.Run("F02 stale assessment refused", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		e.ensureReviewer()
		second := e.newVerifier()
		r := e.requirement("F02 contested claim")
		c1, _ := e.criterion(r.ID, port.CriterionInput{Title: "Signed copy", Mandatory: true, Rule: "NONE"})
		if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{c1.String()} }); err != nil {
			t.Fatal(err)
		}
		k := e.claimOf(r.ID, c1)
		epoch := e.detail(r.ID).View.Item.ProofEpoch
		assess := func(actor matter.ActorID, verdict string, expected *string) error {
			_, err := e.ev.Assess(e.ctx, port.AssessCmd{ActorID: actor.String(), MatterID: e.m.String(), ClaimID: k.Claim.ID.String(),
				ExpectedSubjectEpoch: epoch, Verdict: verdict, Rationale: "review", ExpectedAssessmentID: expected})
			return err
		}
		empty := ""

		mustIs(t, "a missing binding is a missing precondition", assess(e.reviewer, "ACCEPTED", nil), port.ErrPreconditionRequired)
		if e.claimOf(r.ID, c1).Current != nil {
			t.Fatal("a refused review must not record an assessment")
		}

		// B records REJECTED first; A's older screen (which saw no assessment) is then stale.
		if err := assess(second, "REJECTED", &empty); err != nil {
			t.Fatal(err)
		}
		rejected := e.claimOf(r.ID, c1).Current
		mustIs(t, "stale first review", assess(e.reviewer, "ACCEPTED", &empty), port.ErrPreconditionFailed)
		if cur := e.claimOf(r.ID, c1).Current; cur == nil || cur.ID != rejected.ID || cur.Verdict != matter.VerdictRejected {
			t.Fatalf("the intervening verdict must stand untouched, got %+v", cur)
		}
		for _, ev := range e.events() {
			if ev.Type == "assessment.recorded" && ev.TargetID != rejected.ID.String() {
				t.Fatalf("a refused review must not emit an event: %+v", ev)
			}
		}
		stale := rejected.ID.String() + "-old"
		mustIs(t, "a binding to another assessment", assess(e.reviewer, "ACCEPTED", &stale), port.ErrPreconditionFailed)

		// A reader that saw the rejection may explicitly reverse it with a rationale.
		saw := rejected.ID.String()
		if err := assess(e.reviewer, "ACCEPTED", &saw); err != nil {
			t.Fatalf("fresh explicit supersession refused: %v", err)
		}
		fresh := e.claimOf(r.ID, c1).Current
		if fresh == nil || fresh.Verdict != matter.VerdictAccepted || fresh.ID == rejected.ID {
			t.Fatalf("supersession missing: %+v", fresh)
		}
		e.state("reversal verifies", r.ID, matter.VerificationVerified)
	})

	// F03: an editor's proofRequired=false never waives the package or the signature requirement.
	// The package criteria must be declared and satisfied whatever the flag says; a no-proof
	// filing proves its signature by an observation on a submitted version or by the OWNER's
	// explicit decision, kept with its reason, decider and instant.
	t.Run("F03 no-proof filing: package and signature guards", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		fx := e.newFiling(false)
		pkg := e.version(e.document("Package").Document.ID.String(), sum(2))
		set := func(actor matter.ActorID, notRequired bool, reason string, rev int64) (matter.FilingDetail, error) {
			return e.fil.SetSignatureApplicability(e.ctx, port.SetFilingSignatureApplicabilityCmd{
				ActorID: actor.String(), MatterID: e.m.String(), FilingID: fx.filingID.String(),
				ExpectedRevision: rev, SignatureNotRequired: notRequired, Reason: reason,
			})
		}

		// The package is required even before anyone talks about signatures, and the OWNER's
		// no-signature decision does not stand in for it.
		_, err := fx.adv(e.editor, "PACKAGE_PREPARATION", nil)
		mustCode(t, "no package criteria declared", err, "package-criteria-required")
		d, err := set(e.owner, true, "informational filing; the authority requires no signatures", fx.get().View.Item.Revision)
		if err != nil {
			t.Fatalf("owner decision: %v", err)
		}
		_, err = fx.adv(e.editor, "PACKAGE_PREPARATION", nil)
		mustCode(t, "no signatures does not mean no package", err, "package-criteria-required")
		if _, err := set(e.owner, false, "withdrawn for the test", d.View.Item.Revision); err != nil {
			t.Fatal(err)
		}

		// A declared but unmet package criterion blocks the submission with the reason.
		crit, _ := e.criterion(fx.filingID, port.CriterionInput{Title: "Package complete", Mandatory: true, Rule: "NONE"})
		fx.must("PACKAGE_PREPARATION", nil)
		fx.must("SIGNATURE", func(c *port.AdvanceFilingCmd) { c.VersionIDs = []string{pkg.String()} })
		submit := func() (matter.FilingDetail, error) {
			return fx.adv(e.editor, "SUBMISSION", func(c *port.AdvanceFilingCmd) {
				c.Reference, c.VersionIDs, c.ObservedAt = "REF-1", []string{pkg.String()}, past()
			})
		}
		_, err = submit()
		mustCode(t, "package criterion unmet", err, "guard-failed")
		if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{crit.String()} }); err != nil {
			t.Fatal(err)
		}
		if _, err := e.assess(e.reviewer, fx.filingID, e.claimOf(fx.filingID, crit).Claim.ID, "ACCEPTED"); err != nil {
			t.Fatal(err)
		}

		// The package is satisfied but nothing shows the signature: refused, with no event,
		// revision change or submission.
		evBefore, revBefore := len(e.events()), fx.get().View.Item.Revision
		_, err = submit()
		mustCode(t, "no signature and no owner decision", err, "signature-required")
		if len(e.events()) != evBefore || fx.get().View.Item.Revision != revBefore || len(fx.get().Submissions) != 0 {
			t.Fatal("a refused submission leaves no event, no revision and no submission")
		}

		_, err = set(e.editor, true, "informational filing", revBefore)
		mustIs(t, "only an owner decides applicability", err, port.ErrForbidden)
		_, err = set(e.owner, true, "  ", revBefore)
		mustCode(t, "a reason is retained with the decision", err, "reason-required")
		_, err = set(e.owner, true, "stale screen", revBefore+7)
		mustIs(t, "stale filing revision", err, port.ErrPreconditionFailed)

		d, err = set(e.owner, true, "informational filing; the authority requires no signatures", revBefore)
		if err != nil {
			t.Fatalf("owner decision: %v", err)
		}
		if !d.Filing.SignatureNotRequired || d.Filing.SignatureNotRequiredBy != e.owner || d.Filing.SignatureNotRequiredReason == "" || d.Filing.SignatureNotRequiredAt.IsZero() {
			t.Fatalf("decision not retained with reason/decider/instant: %+v", d.Filing)
		}
		if d.View.Item.Revision != revBefore+1 || d.View.Item.ProofRequired {
			t.Fatalf("the decision advances the revision and never turns on outcome proof: %+v", d.View.Item)
		}
		if got := fx.get().Filing; !got.SignatureNotRequired || got.SignatureNotRequiredReason != d.Filing.SignatureNotRequiredReason || got.SignatureNotRequiredBy != e.owner {
			t.Fatalf("decision does not survive a re-read: %+v", got)
		}
		_, err = set(e.owner, true, "again", d.View.Item.Revision)
		mustCode(t, "unchanged decision", err, "applicability-unchanged")

		sub, err := submit()
		if err != nil {
			t.Fatalf("submission under the owner decision: %v", err)
		}
		if sub.View.Item.Execution != matter.ExecutionWaiting || len(sub.Submissions) != 1 {
			t.Fatalf("submission waits for the authority: %+v", sub.View.Item)
		}
	})

	// F03: an observed signature on a submitted version satisfies the signature requirement
	// without any owner decision; the package criterion is still required.
	t.Run("F03 observed signature satisfies the signature guard", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		fx := e.newFiling(false)
		pkg := e.version(e.document("Package").Document.ID.String(), sum(3))
		fx.declarePackage()
		fx.must("PACKAGE_PREPARATION", nil)
		fx.must("SIGNATURE", func(c *port.AdvanceFilingCmd) { c.VersionIDs = []string{pkg.String()} })
		fx.sign(pkg)
		d := fx.must("SUBMISSION", func(c *port.AdvanceFilingCmd) {
			c.Reference, c.VersionIDs, c.ObservedAt = "REF-2", []string{pkg.String()}, past()
		})
		if d.Filing.SignatureNotRequired {
			t.Fatal("no applicability decision was made")
		}
	})

	// F04: the room carries every context record and the labels of what it refers to, read in the
	// same snapshot as its figures, so a page never has to mix it with another read.
	t.Run("F04 room is self-contained", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		head, tail := e.action(e.owner, "Head action"), e.action(e.owner, "Tail action")
		if _, err := e.addDep(e.editor, head.ID, tail.ID, "COMPLETION"); err != nil {
			t.Fatal(err)
		}
		mk := func(kind, title string, links ...string) string {
			res, err := e.ctl.CreateContextRecord(e.ctx, port.CreateContextRecordCmd{
				ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
				Kind: kind, Title: title, Links: links,
			})
			if err != nil {
				t.Fatal(err)
			}
			return res.ID
		}
		open := mk("DECISION", "Open decision", head.ID.String())
		closed := mk("RISK", "Closed risk", tail.ID.String())
		if _, err := e.ctl.UpdateContextRecord(e.ctx, port.UpdateContextRecordCmd{
			ActorID: e.editor.String(), MatterID: e.m.String(), RecordID: closed, ExpectedRevision: 1, Close: true, Reason: "mitigated",
		}); err != nil {
			t.Fatal(err)
		}
		room, err := e.ctl.ControlRoom(e.ctx, port.ControlRoomQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
		if err != nil {
			t.Fatal(err)
		}
		ids := map[string]matter.ContextRecord{}
		for _, r := range room.Records {
			ids[r.ID] = r
		}
		if ids[open].Status != matter.ContextOpen || ids[closed].Status != matter.ContextClosed || len(ids) != 2 {
			t.Fatalf("every record, open and closed, is part of the snapshot: %+v", room.Records)
		}
		if room.Titles[head.ID] != "Head action" || room.Titles[tail.ID] != "Tail action" {
			t.Fatalf("labels for every record a context record refers to: %v", room.Titles)
		}
		for _, r := range room.Decisions {
			if r.Status != matter.ContextOpen {
				t.Fatalf("the decision list is the open ones only: %+v", r)
			}
		}
	})
}
