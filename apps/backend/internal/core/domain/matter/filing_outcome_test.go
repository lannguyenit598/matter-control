package matter_test

import (
	"errors"
	"strings"
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

// D-9 (2026-10-31): a proof-required filing proves its signatures through a satisfied
// SIGNATURE-purpose criterion, so the submission flow declares one alongside the package.
func proofRequiredSet() matter.EvidenceSet {
	pkg, sig, out := purposeCriterion("PKG", matter.PurposePackage), purposeCriterion("SIG", matter.PurposeSignature), purposeCriterion("OUT", matter.PurposeOutcome)
	pev, pk, pa := acceptedFor("1", pkg)
	sev, sk, sa := acceptedFor("2", sig)
	return withVersion(setOf([]matter.Criterion{pkg, sig, out}, []matter.Evidence{pev, sev}, []matter.Claim{pk, sk}, []matter.Assessment{pa, sa}))
}

func TestSubmissionNeedsPackageAndSignatureCriteriaNotTheFutureOutcome(t *testing.T) {
	set := proofRequiredSet()
	if _, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), set, matter.FilingSet{}, submitInput()); err != nil {
		t.Fatalf("verified package and signature criteria must permit submission while the outcome criterion is still open: %v", err)
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

// OV-F1-04a (fix-wave #2 G6): when the package is unmet AND no signature criterion is declared,
// the ONE refusal names both gaps — the OpenDesign guard copy ("this filing requires supporting
// evidence and a valid signature") is built on seeing both in a single message.
func TestSubmissionRefusalNamesPackageAndMissingSignatureTogether(t *testing.T) {
	pkg := purposeCriterion("PKG", matter.PurposePackage)
	set := withVersion(setOf([]matter.Criterion{pkg}, nil, nil, nil))
	_, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), set, matter.FilingSet{}, submitInput())
	var rej *matter.RejectedError
	if !asRejected(err, &rej) || rej.Code != "guard-failed" {
		t.Fatalf("the combined violation refuses with guard-failed: %v", err)
	}
	if !strings.Contains(rej.Message, "package criteria are not satisfied") || !strings.Contains(rej.Message, "signature criteria are not declared") {
		t.Fatalf("the single refusal names both gaps: %q", rej.Message)
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

// Z-F-01 (D-9, ratified 2026-10-31): the package gate counts PACKAGE-purpose criteria only. A
// proof-required filing whose only criterion is the authority's OUTCOME cannot even enter
// PACKAGE_PREPARATION — an empty declared package is never "prepared".
func TestPackagePreparationRejectsAnOutcomeOnlyCriteriaSet(t *testing.T) {
	out := purposeCriterion("OUT", matter.PurposeOutcome)
	set := setOf([]matter.Criterion{out}, nil, nil, nil)
	_, err := matter.DecideAdvance(filingAt(matter.StageRequirement), filingItem(true), set, matter.FilingSet{},
		matter.AdvanceInput{To: matter.StagePackage, Actor: u1, Role: matter.MatterRoleEditor, AsOf: now})
	var rej *matter.RejectedError
	if !asRejected(err, &rej) || rej.Code != "package-criteria-required" {
		t.Fatalf("an outcome-only criteria set refuses package preparation: %v", err)
	}
}

// Z-F-01 (D-9): submission never reads an undeclared package as ready, even for a filing that
// reached the SIGNATURE stage without package criteria (in-flight legacy data).
func TestSubmissionNeverReadsAMissingPackageAsReady(t *testing.T) {
	out := purposeCriterion("OUT", matter.PurposeOutcome)
	set := withVersion(setOf([]matter.Criterion{out}, nil, nil, nil))
	_, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), set, matter.FilingSet{}, submitInput())
	var rej *matter.RejectedError
	if !asRejected(err, &rej) || rej.Code != "package-criteria-required" {
		t.Fatalf("a proof-required filing without package criteria cannot be submitted: %v", err)
	}
}

// Z-F-02 (D-9): submission of a proof-required filing without any SIGNATURE criterion is refused:
// a generic package criterion no longer stands in for the signatures.
func TestProofRequiredSubmissionRequiresADeclaredSignatureCriterion(t *testing.T) {
	pkg := purposeCriterion("PKG", matter.PurposePackage)
	ev, k, a := acceptedFor("1", pkg)
	set := withVersion(setOf([]matter.Criterion{pkg}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{a}))
	_, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), set, matter.FilingSet{}, submitInput())
	var rej *matter.RejectedError
	if !asRejected(err, &rej) || rej.Code != "signature-criteria-required" {
		t.Fatalf("a proof-required filing without a signature criterion cannot be submitted: %v", err)
	}
}

// Z-F-02 (D-9): a declared but unmet signature criterion is named in the refusal.
func TestProofRequiredSubmissionRequiresSatisfiedSignatureCriteria(t *testing.T) {
	pkg, sig := purposeCriterion("PKG", matter.PurposePackage), purposeCriterion("SIG", matter.PurposeSignature)
	pev, pk, pa := acceptedFor("1", pkg)
	sev, sk := proof("2", sig, u1, u1)
	set := withVersion(setOf([]matter.Criterion{pkg, sig}, []matter.Evidence{pev, sev}, []matter.Claim{pk, sk}, []matter.Assessment{pa}))
	_, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), set, matter.FilingSet{}, submitInput())
	var rej *matter.RejectedError
	if !asRejected(err, &rej) || rej.Code != "guard-failed" || !strings.Contains(rej.Message, "SIG") {
		t.Fatalf("the refusal names the unmet signature criterion: %v", err)
	}
}

// Z-F-02 (D-9): the OWNER's no-signature applicability decision still waives the signature
// criteria, and a satisfied SIGNATURE criterion completes the proof-required submission.
func TestSignatureCriteriaWaivedByTheOwnerDecision(t *testing.T) {
	pkg := purposeCriterion("PKG", matter.PurposePackage)
	ev, k, a := acceptedFor("1", pkg)
	set := withVersion(setOf([]matter.Criterion{pkg}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{a}))
	it := filingItem(true)
	f := filingAt(matter.StageSignature)
	f.SignatureNotRequired = true
	if _, err := matter.DecideAdvance(f, it, set, matter.FilingSet{}, submitInput()); err != nil {
		t.Fatalf("the owner's no-signature decision waives the signature criteria: %v", err)
	}
	if _, err := matter.DecideAdvance(filingAt(matter.StageSignature), filingItem(true), proofRequiredSet(), matter.FilingSet{}, submitInput()); err != nil {
		t.Fatalf("a satisfied SIGNATURE criterion completes the submission: %v", err)
	}
}

// D-9: the signature is its own proof axis on the checklist, apart from package and outcome.
func TestSignatureIsItsOwnProofPart(t *testing.T) {
	pkg, sig := purposeCriterion("PKG", matter.PurposePackage), purposeCriterion("SIG", matter.PurposeSignature)
	pev, pk, pa := acceptedFor("1", pkg)
	pkgOnly := setOf([]matter.Criterion{pkg}, []matter.Evidence{pev}, []matter.Claim{pk}, []matter.Assessment{pa})
	res := matter.EvaluateVerification(filingItem(true), pkgOnly, now)
	if res.Signature.Declared() || res.Signature.Ready() {
		t.Fatalf("no signature criterion declared is not a proven signature: %+v", res.Signature)
	}
	sev, sk, sa := acceptedFor("2", sig)
	both := setOf([]matter.Criterion{pkg, sig}, []matter.Evidence{pev, sev}, []matter.Claim{pk, sk}, []matter.Assessment{pa, sa})
	res = matter.EvaluateVerification(filingItem(true), both, now)
	if !res.Signature.Ready() || !res.Package.Ready() {
		t.Fatalf("the signature part tracks its own criteria: %+v %+v", res.Package, res.Signature)
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
