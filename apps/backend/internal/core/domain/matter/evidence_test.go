package matter_test

import (
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

var (
	u1, u2, u3 = matter.ActorID("U1"), matter.ActorID("U2"), matter.ActorID("U3")
	now        = time.Date(2026, 6, 15, 9, 0, 0, 0, time.UTC)
)

func tp(t time.Time) *time.Time { return &t }

func subject() matter.WorkItem {
	return req("R", matter.ExecutionCompleted, matter.VerificationUnverified)
}

func criterion(id string, rule matter.VersionRule) matter.Criterion {
	return matter.Criterion{ID: matter.CriterionID(id), SubjectID: "R", Title: id, Mandatory: true, Rule: rule, Revision: 1}
}

// proof builds evidence E<id> submitted by sub, claimed for c by claimant, assessed by reviewer.
func proof(id string, c matter.Criterion, sub, claimant matter.ActorID) (matter.Evidence, matter.Claim) {
	ev := matter.Evidence{ID: matter.EvidenceID("E" + id), Kind: matter.EvidenceExternal, Reference: "ref-" + id, SubmittedBy: sub, SubmittedAt: now.Add(-time.Hour), ValidFrom: now.Add(-time.Hour)}
	k := matter.Claim{ID: matter.ClaimID("K" + id), EvidenceID: ev.ID, CriterionID: c.ID, CriterionRev: c.Revision, ClaimedBy: claimant, EvidenceSubmitter: sub}
	return ev, k
}

func accept(id string, k matter.Claim, reviewer matter.ActorID, epoch int64, version *matter.VersionID) matter.Assessment {
	return matter.Assessment{ID: matter.AssessmentID("A" + id), ClaimID: k.ID, SubjectID: "R", SubjectEpoch: epoch, Verdict: matter.VerdictAccepted, Reviewer: reviewer, RecordedAt: now.Add(-time.Minute), AssessedVersionID: version, EvidenceSubmitter: k.EvidenceSubmitter, Claimant: k.ClaimedBy}
}

func setOf(cs []matter.Criterion, evs []matter.Evidence, ks []matter.Claim, as []matter.Assessment) matter.EvidenceSet {
	return matter.EvidenceSet{Criteria: cs, Evidence: evs, Claims: ks, Assessments: as, Verifiers: []matter.ActorID{u2, u3}}
}

func state(it matter.WorkItem, set matter.EvidenceSet, at time.Time) matter.VerificationState {
	return matter.EvaluateVerification(it, set, at).State
}

// AC-106: a criterion exists as a gap; no evidence is fabricated; the subject stays UNVERIFIED
// even though execution is COMPLETED.
func TestCriterionIsAGapUntilProofIsAssessed(t *testing.T) {
	c := criterion("C", matter.VersionNone)
	res := matter.EvaluateVerification(subject(), setOf([]matter.Criterion{c}, nil, nil, nil), now)
	if res.State != matter.VerificationUnverified || len(res.Criteria) != 1 || res.Criteria[0].Satisfied || res.Criteria[0].Reason != matter.CriterionMissing || len(res.Criteria[0].Claims) != 0 {
		t.Fatalf("%+v", res)
	}
	// Zero criteria never means verified.
	if got := state(subject(), setOf(nil, nil, nil, nil), now); got != matter.VerificationUnverified {
		t.Fatalf("zero criteria must not be a vacuous VERIFIED: %s", got)
	}
}

// Submitting and claiming is not verifying: pending review changes nothing.
func TestClaimedButUnassessedProofIsPending(t *testing.T) {
	c := criterion("C", matter.VersionNone)
	ev, k := proof("1", c, u1, u1)
	res := matter.EvaluateVerification(subject(), setOf([]matter.Criterion{c}, []matter.Evidence{ev}, []matter.Claim{k}, nil), now)
	if res.State != matter.VerificationUnverified || res.Criteria[0].Reason != matter.CriterionPending || len(res.Criteria[0].Claims) != 1 {
		t.Fatalf("%+v", res)
	}
}

// AC-107 + AC-127: acceptance is per claim; one accepted of two mandatory is PARTIAL, the
// other stays visibly missing, and attachment count never substitutes for it.
func TestAcceptedProofVerifiesOnlyItsCriterion(t *testing.T) {
	c1, c2 := criterion("C1", matter.VersionNone), criterion("C2", matter.VersionNone)
	ev, k := proof("1", c1, u1, u1)
	a := accept("1", k, u2, 0, nil)
	set := setOf([]matter.Criterion{c1, c2}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{a})
	res := matter.EvaluateVerification(subject(), set, now)
	if res.State != matter.VerificationPartiallyVerified || !res.Criteria[0].Satisfied || res.Criteria[1].Satisfied || res.Criteria[1].Reason != matter.CriterionMissing {
		t.Fatalf("AC-127: %+v", res)
	}
	// A second attachment claimed for C1 does not satisfy C2.
	ev2, k2 := proof("2", c1, u1, u1)
	set.Evidence, set.Claims = append(set.Evidence, ev2), append(set.Claims, k2)
	if got := state(subject(), set, now); got != matter.VerificationPartiallyVerified {
		t.Fatalf("attachment count never substitutes for a criterion: %s", got)
	}
	// Accept the proof for C2 as well: VERIFIED.
	ev3, k3 := proof("3", c2, u1, u1)
	set.Evidence, set.Claims = append(set.Evidence, ev3), append(set.Claims, k3)
	set.Assessments = append(set.Assessments, accept("3", k3, u3, 0, nil))
	if got := state(subject(), set, now); got != matter.VerificationVerified {
		t.Fatalf("AC-107: %s", got)
	}
}

// AC-126: expiry takes effect at its instant (half-open window) with no command in between;
// a rejection or a revocation ends satisfaction, old history is untouched.
func TestExpiryRejectionAndRevocationEndSatisfaction(t *testing.T) {
	c := criterion("C", matter.VersionNone)
	ev, k := proof("1", c, u1, u1)
	until := now.Add(time.Hour)
	ev.ValidUntil = &until
	set := setOf([]matter.Criterion{c}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{accept("1", k, u2, 0, nil)})
	if got := state(subject(), set, until.Add(-time.Nanosecond)); got != matter.VerificationVerified {
		t.Fatalf("valid just before expiry: %s", got)
	}
	res := matter.EvaluateVerification(subject(), set, until)
	if res.State != matter.VerificationUnverified || res.Criteria[0].Reason != matter.CriterionExpired {
		t.Fatalf("expired exactly at the instant: %+v", res)
	}
	at, ok := matter.NextExpiry([]matter.WorkItem{subject()}, set, now)
	if !ok || !at.Equal(until) {
		t.Fatalf("the next expiry is known to a scheduler: %v %v", at, ok)
	}
	if _, ok := matter.NextExpiry([]matter.WorkItem{subject()}, set, until); ok {
		t.Fatal("nothing left to expire after the instant")
	}

	// Another valid proof keeps the subject partially supported when one criterion expires.
	c2 := criterion("C2", matter.VersionNone)
	ev2, k2 := proof("2", c2, u1, u1)
	set2 := setOf([]matter.Criterion{c, c2}, []matter.Evidence{ev, ev2}, []matter.Claim{k, k2}, []matter.Assessment{accept("1", k, u2, 0, nil), accept("2", k2, u2, 0, nil)})
	if got := state(subject(), set2, until); got != matter.VerificationPartiallyVerified {
		t.Fatalf("one criterion expired, the other still valid: %s", got)
	}

	rej := accept("1", k, u2, 0, nil)
	rej.Verdict = matter.VerdictRejected
	if r := matter.EvaluateVerification(subject(), setOf([]matter.Criterion{c}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{rej}), now); r.State != matter.VerificationUnverified || r.Criteria[0].Reason != matter.CriterionRejected {
		t.Fatalf("rejected: %+v", r)
	}
	rev := accept("1", k, u2, 0, nil)
	rev.RevokedAt, rev.RevokedBy, rev.RevokedReason = tp(now), &u3, "defective"
	if r := matter.EvaluateVerification(subject(), setOf([]matter.Criterion{c}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{rev}), now); r.State != matter.VerificationUnverified || r.Criteria[0].Reason != matter.CriterionRevoked {
		t.Fatalf("revoked: %+v", r)
	}
	wd := ev
	wd.WithdrawnAt = tp(now)
	if r := matter.EvaluateVerification(subject(), setOf([]matter.Criterion{c}, []matter.Evidence{wd}, []matter.Claim{k}, []matter.Assessment{accept("1", k, u2, 0, nil)}), now); r.Criteria[0].Reason != matter.CriterionWithdrawn {
		t.Fatalf("withdrawn: %+v", r)
	}
	// A later REJECTED supersedes an earlier ACCEPTED: only the non-superseded one counts.
	old := accept("1", k, u2, 0, nil)
	next := rej
	next.ID = "A2"
	old.SupersededBy = &next.ID
	if got := state(subject(), setOf([]matter.Criterion{c}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{old, next}), now); got != matter.VerificationUnverified {
		t.Fatalf("a later rejection ends an earlier acceptance: %s", got)
	}
}

// AC-128: promotion invalidates only criteria that require the CURRENT version; a FIXED
// criterion keeps its proof; the impact preview says which.
func TestPromotionInvalidatesCurrentVersionCriteriaOnly(t *testing.T) {
	d := matter.DocumentID("D")
	v2, v3 := matter.VersionID("v2"), matter.VersionID("v3")
	cCur := criterion("C-current", matter.VersionCurrent)
	cCur.DocumentID = &d
	cFix := criterion("C-fixed", matter.VersionFixed)
	cFix.FixedID = &v2
	e1, k1 := proof("1", cCur, u1, u1)
	e2, k2 := proof("2", cFix, u1, u1)
	doc := matter.Document{ID: d, CurrentVersionID: &v2, Revision: 1}
	set := matter.EvidenceSet{
		Documents: []matter.Document{doc},
		Versions:  []matter.DocumentVersion{{ID: v2, DocumentID: d, No: 2}, {ID: v3, DocumentID: d, No: 3}},
		Criteria:  []matter.Criterion{cCur, cFix}, Evidence: []matter.Evidence{e1, e2}, Claims: []matter.Claim{k1, k2},
		Assessments: []matter.Assessment{accept("1", k1, u2, 0, &v2), accept("2", k2, u2, 0, &v2)},
		Verifiers:   []matter.ActorID{u2},
	}
	if got := state(subject(), set, now); got != matter.VerificationVerified {
		t.Fatalf("both accepted on v2: %s", got)
	}
	impact := matter.ImpactOfPromotion(doc, set)
	if len(impact.Invalidated) != 1 || impact.Invalidated[0] != "C-current" || len(impact.Unaffected) != 1 || impact.Unaffected[0] != "C-fixed" {
		t.Fatalf("impact: %+v", impact)
	}
	set.Documents = []matter.Document{{ID: d, CurrentVersionID: &v3, Revision: 2}} // v3 promoted
	res := matter.EvaluateVerification(subject(), set, now)
	if res.State != matter.VerificationPartiallyVerified {
		t.Fatalf("AC-128: %s", res.State)
	}
	for _, c := range res.Criteria {
		switch c.Criterion.ID {
		case "C-current":
			if c.Satisfied || c.Reason != matter.CriterionStaleVersion {
				t.Fatalf("current-version criterion pending review of v3: %+v", c)
			}
		case "C-fixed":
			if !c.Satisfied {
				t.Fatalf("a fixed-version criterion stays valid: %+v", c)
			}
		}
	}
	if set.Assessments[0].AssessedVersionID == nil || *set.Assessments[0].AssessedVersionID != v2 {
		t.Fatal("the exact v2 reference of the earlier decision is preserved")
	}
}

// AC-157: DISPUTED while unresolved; resolution recomputes from current proof.
func TestDisputeMakesSubjectDisputedUntilResolved(t *testing.T) {
	c1, c2 := criterion("C1", matter.VersionNone), criterion("C2", matter.VersionNone)
	e1, k1 := proof("1", c1, u1, u1)
	e2, k2 := proof("2", c2, u1, u1)
	a1, a2 := accept("1", k1, u2, 0, nil), accept("2", k2, u2, 0, nil)
	set := setOf([]matter.Criterion{c1, c2}, []matter.Evidence{e1, e2}, []matter.Claim{k1, k2}, []matter.Assessment{a1, a2})
	if got := state(subject(), set, now); got != matter.VerificationVerified {
		t.Fatalf("%s", got)
	}
	set.Disputes = []matter.Dispute{{ID: "X1", AssessmentID: a1.ID, RaisedBy: u1, Reason: "forged"}}
	res := matter.EvaluateVerification(subject(), set, now)
	if res.State != matter.VerificationDisputed || res.Criteria[0].Reason != matter.CriterionDisputed || !res.Criteria[1].Satisfied {
		t.Fatalf("a dispute is immediately non-satisfying while the other proof stays valid: %+v", res)
	}
	// Resolution does not restore a previous label: the revoked proof leaves C1 missing and C2 valid.
	a1.RevokedAt, a1.RevokedBy = tp(now), &u3
	set.Assessments[0] = a1
	set.Disputes[0].ResolvedAt = tp(now)
	if got := state(subject(), set, now); got != matter.VerificationPartiallyVerified {
		t.Fatalf("resolved: recomputed from current proof, not the previous label: %s", got)
	}
	// Upheld acceptance returns to VERIFIED because the proof is still valid.
	set.Assessments[0] = a1
	set.Assessments[0].RevokedAt, set.Assessments[0].RevokedBy = nil, nil
	if got := state(subject(), set, now); got != matter.VerificationVerified {
		t.Fatalf("the dispute was resolved in favour of the proof: %s", got)
	}
}

func TestPrecedenceAndApplicability(t *testing.T) {
	c := criterion("C", matter.VersionNone)
	ev, k := proof("1", c, u1, u1)
	a := accept("1", k, u2, 0, nil)
	exempt := subject()
	exempt.Applicability = matter.VerificationNotApplicable
	exempt.ApplicabilityReason = ptr("no proof applies")
	if got := state(exempt, setOf(nil, nil, nil, nil), now); got != matter.VerificationNotRequired {
		t.Fatalf("explicit applicability: %s", got)
	}
	set := setOf([]matter.Criterion{c}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{a})
	set.Disputes = []matter.Dispute{{ID: "X", AssessmentID: a.ID}}
	if got := state(exempt, set, now); got != matter.VerificationDisputed {
		t.Fatalf("an unresolved dispute outranks NOT_REQUIRED: %s", got)
	}
	// An Action without a proof requirement has no verification state.
	if got := state(act("A", matter.ExecutionNotStarted), set, now); got != "" {
		t.Fatalf("no proof requirement: %q", got)
	}
}

// Criteria revisions and proof epochs invalidate stale assessments without rewriting them.
func TestStaleRevisionAndOldEpochNeverSatisfy(t *testing.T) {
	c := criterion("C", matter.VersionNone)
	ev, k := proof("1", c, u1, u1)
	a := accept("1", k, u2, 0, nil)
	set := setOf([]matter.Criterion{c}, []matter.Evidence{ev}, []matter.Claim{k}, []matter.Assessment{a})
	if state(subject(), set, now) != matter.VerificationVerified {
		t.Fatal("precondition")
	}
	revised := c
	revised.Revision = 2
	set.Criteria = []matter.Criterion{revised}
	res := matter.EvaluateVerification(subject(), set, now)
	if res.State != matter.VerificationUnverified || res.Criteria[0].Reason != matter.CriterionMissing {
		t.Fatalf("a revised criterion needs a fresh claim and assessment: %+v", res)
	}
	set.Criteria = []matter.Criterion{c}
	reopened := subject()
	reopened.ProofEpoch = 1
	res = matter.EvaluateVerification(reopened, set, now)
	if res.State != matter.VerificationUnverified || res.Criteria[0].Reason != matter.CriterionOldEpoch {
		t.Fatalf("a reopened subject's old acceptance is history only: %+v", res)
	}
	set.Criteria[0].Retired = true
	if r := matter.EvaluateVerification(subject(), set, now); len(r.Criteria) != 0 {
		t.Fatal("a retired criterion is not part of the checklist")
	}
}

// AC-140 / RULE-006: independence is decided from designation, role and who offered the proof.
func TestReviewIndependence(t *testing.T) {
	c := criterion("C", matter.VersionNone)
	_, k := proof("1", c, u1, u1)
	set := setOf(nil, nil, nil, nil)
	set.Verifiers = []matter.ActorID{u1, u2, u3}
	cases := []struct {
		name     string
		reviewer matter.ActorID
		role     matter.MatterRole
		claim    matter.Claim
		verifier []matter.ActorID
		want     string
	}{
		{"submitter who is also a verifier and OWNER", u1, matter.MatterRoleOwner, k, nil, "self-evidence"},
		{"non-designated EDITOR", "U9", matter.MatterRoleEditor, k, nil, "not-verifier"},
		{"designated OWNER-less viewer", u2, matter.MatterRoleViewer, k, nil, "role"},
		{"designated non-submitter EDITOR", u2, matter.MatterRoleEditor, k, nil, ""},
		{"designated non-submitter OWNER", u3, matter.MatterRoleOwner, k, nil, ""},
		{"claimant who did not submit", u2, matter.MatterRoleEditor, func() matter.Claim { c := k; c.ClaimedBy = u2; return c }(), nil, "self-claim"},
		{"one-member matter: only the submitter is designated", u1, matter.MatterRoleOwner, k, []matter.ActorID{u1}, "self-evidence"},
	}
	for _, tc := range cases {
		s := set
		if tc.verifier != nil {
			s.Verifiers = tc.verifier
		}
		d := matter.DecideReview(tc.reviewer, tc.role, s, tc.claim)
		if got := d.Code; got != tc.want || d.Allowed != (tc.want == "") {
			t.Errorf("%s: %+v want %q", tc.name, d, tc.want)
		}
	}
	// Sharing evidence cannot launder independence: U2 linking U1's evidence cannot assess it.
	laundered := k
	laundered.ClaimedBy = u2
	if d := matter.DecideReview(u2, matter.MatterRoleEditor, set, laundered); d.Allowed {
		t.Fatal("the linker becomes the claimant and cannot assess")
	}
	if d := matter.DecideReview(u3, matter.MatterRoleEditor, set, laundered); !d.Allowed {
		t.Fatalf("a third designated member can: %+v", d)
	}
}
