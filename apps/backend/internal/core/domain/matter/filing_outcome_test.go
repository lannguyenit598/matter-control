package matter_test

import (
	"errors"
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// BF-01: package/signature readiness gates submission; the authority outcome is a separate
// criterion that stays pending until a designated non-submitter accepts it.

func asRejected(err error, target **matter.RejectedError) bool { return errors.As(err, target) }

func filingItem(proof bool) matter.WorkItem {
	owner := u1
	it := act("F", matter.ExecutionInProgress)
	it.ProofRequired, it.Applicability, it.OwnerActorID = proof, matter.VerificationRequired, &owner
	return it
}

func filingAt(stage matter.FilingStage) matter.Filing {
	return matter.Filing{ItemID: "F", MatterID: "M1", AuthorityPartyID: "P", Stage: stage, CurrentCycle: 1}
}

func purposeCriterion(id string, purpose matter.CriterionPurpose) matter.Criterion {
	c := criterion(id, matter.VersionNone)
	c.SubjectID, c.Purpose = "F", purpose
	return c
}

func acceptedFor(id string, c matter.Criterion) (matter.Evidence, matter.Claim, matter.Assessment) {
	ev, k := proof(id, c, u1, u1)
	a := accept(id, k, u2, 0, nil)
	a.SubjectID = "F"
	return ev, k, a
}

func submitInput() matter.AdvanceInput {
	return matter.AdvanceInput{To: matter.StageSubmission, Reference: "SUB-1", VersionIDs: []matter.VersionID{"V1"}, Actor: u1, Role: matter.MatterRoleEditor, AsOf: now}
}

func withVersion(set matter.EvidenceSet) matter.EvidenceSet {
	set.Versions = []matter.DocumentVersion{{ID: "V1"}}
	set.Signatures = []matter.SignatureObservation{{VersionID: "V1"}}
	return set
}

func TestSubmissionNeedsPackageCriteriaNotTheFutureOutcome(t *testing.T) {
	pkg, out := purposeCriterion("PKG", matter.PurposePackage), purposeCriterion("OUT", matter.PurposeOutcome)
	ev, k, a := acceptedFor("1", pkg)
	set := withVersion(setOf([]matter.Criterion{pkg, out}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{a}))
	if _, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), set, matter.FilingSet{}, submitInput()); err != nil {
		t.Fatalf("a verified package must permit submission while the outcome criterion is still open: %v", err)
	}
}

func TestSubmissionStillRefusedByAnUnsatisfiedPackageCriterion(t *testing.T) {
	pkg, out := purposeCriterion("PKG", matter.PurposePackage), purposeCriterion("OUT", matter.PurposeOutcome)
	set := withVersion(setOf([]matter.Criterion{pkg, out}, nil, nil, nil))
	_, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), set, matter.FilingSet{}, submitInput())
	var rej *matter.RejectedError
	if !asRejected(err, &rej) || rej.Code != "guard-failed" {
		t.Fatalf("an unsatisfied package criterion refuses submission: %v", err)
	}
}

// Legacy rows carry no purpose: they keep gating submission (never loosened, never guessed).
func TestUnspecifiedPurposeGatesLikeAPackageCriterion(t *testing.T) {
	legacy := purposeCriterion("OLD", "")
	set := withVersion(setOf([]matter.Criterion{legacy}, nil, nil, nil))
	if _, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), set, matter.FilingSet{}, submitInput()); err == nil {
		t.Fatal("a criterion without a purpose must still gate submission")
	}
	if legacy.EffectivePurpose() != matter.PurposePackage {
		t.Fatalf("legacy purpose reads as PACKAGE: %q", legacy.EffectivePurpose())
	}
}

func TestOutcomeStaysPendingUntilAnIndependentAssessment(t *testing.T) {
	pkg, out := purposeCriterion("PKG", matter.PurposePackage), purposeCriterion("OUT", matter.PurposeOutcome)
	pev, pk, pa := acceptedFor("1", pkg)
	oev, ok := proof("2", out, u1, u1)
	base := func(as ...matter.Assessment) matter.EvidenceSet {
		return setOf([]matter.Criterion{pkg, out}, []matter.Evidence{pev, oev}, []matter.Claim{pk, ok}, as)
	}

	res := matter.EvaluateVerification(filingItem(true), base(pa), now)
	if res.State != matter.VerificationPartiallyVerified || !res.Package.Ready() || !res.Outcome.Declared() || res.Outcome.Ready() {
		t.Fatalf("package accepted, outcome claimed but unassessed: %+v", res)
	}
	oa := accept("2", ok, u2, 0, nil)
	oa.SubjectID = "F"
	res = matter.EvaluateVerification(filingItem(true), base(pa, oa), now)
	if res.State != matter.VerificationVerified || !res.Outcome.Ready() {
		t.Fatalf("an accepted outcome completes the verification: %+v", res)
	}
}

func TestOutcomeNeedsADeclaredCriterionToBeReady(t *testing.T) {
	pkg := purposeCriterion("PKG", matter.PurposePackage)
	res := matter.EvaluateVerification(filingItem(true), setOf([]matter.Criterion{pkg}, nil, nil, nil), now)
	if res.Outcome.Declared() || res.Outcome.Ready() {
		t.Fatalf("no outcome criterion declared is not an accepted outcome: %+v", res.Outcome)
	}
}

// BF-01: a filing whose package is accepted can read VERIFIED with no outcome criterion; the outcome
// verification is reported separately and never as accepted in that case.
func TestOutcomeVerificationIsReportedApartFromThePackageState(t *testing.T) {
	pkg, out := purposeCriterion("PKG", matter.PurposePackage), purposeCriterion("OUT", matter.PurposeOutcome)
	pev, pk, pa := acceptedFor("1", pkg)
	pkgOnly := setOf([]matter.Criterion{pkg}, []matter.Evidence{pev}, []matter.Claim{pk}, []matter.Assessment{pa})
	if got := state(filingItem(true), pkgOnly, now); got != matter.VerificationVerified {
		t.Fatalf("precondition: package-only reads VERIFIED, got %s", got)
	}
	if got := matter.OutcomeVerification(filingItem(true), pkgOnly, now); got != matter.OutcomeNotDeclared {
		t.Fatalf("no OUTCOME criterion is never an accepted outcome: %s", got)
	}
	if got := matter.OutcomeVerification(filingItem(false), pkgOnly, now); got != matter.OutcomeNotTracked {
		t.Fatalf("a no-outcome-proof filing tracks none: %s", got)
	}
	oev, ok := proof("2", out, u1, u1)
	declared := setOf([]matter.Criterion{pkg, out}, []matter.Evidence{pev, oev}, []matter.Claim{pk, ok}, []matter.Assessment{pa})
	if got := matter.OutcomeVerification(filingItem(true), declared, now); got != matter.OutcomePending {
		t.Fatalf("declared but not accepted: %s", got)
	}
	oa := accept("2", ok, u2, 0, nil)
	oa.SubjectID = "F"
	declared.Assessments = append(declared.Assessments, oa)
	if got := matter.OutcomeVerification(filingItem(true), declared, now); got != matter.OutcomeAccepted {
		t.Fatalf("accepted: %s", got)
	}
}
