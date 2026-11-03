package mattercontrol

// Fixture for the isolated whole-product restore rehearsal: real uploaded bytes behind versions,
// two matters (one the editor cannot see), a revoked member and a document promoted over a fixed
// criterion. The GW/W4/W6 suites add filings, imports, proof, receipts and history to the same
// database. Synthetic data only.

import (
	"strings"
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// SeedRestoreFixture creates content-bearing documents and a second, inaccessible matter.
func SeedRestoreFixture(t *testing.T, newBundle Factory) {
	t.Helper()
	e := newW2Env(t, newBundle)
	e.ensureReviewer()
	doc := e.document("Restore rehearsal agreement").Document.ID.String()
	var versions []matter.VersionID
	for i, body := range []string{
		"SYNTHETIC agreement draft v1 " + strings.Repeat("a", 2000),
		"SYNTHETIC agreement draft v2 " + strings.Repeat("b", 70000),
		"SYNTHETIC agreement final v3 \x00\x01\x02 binary tail " + strings.Repeat("c", 500),
	} {
		res, err := e.ev.UploadVersion(e.ctx, port.UploadVersionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), DocumentID: doc,
			IdempotencyKey: newKey(), RequestHash: anyHash, Filename: "agreement.pdf", MediaType: "application/pdf", Body: strings.NewReader(body), MaxBytes: 1 << 20})
		if err != nil {
			t.Fatalf("upload %d: %v", i+1, err)
		}
		versions = append(versions, matter.VersionID(res.ID))
	}
	d := e.preview(doc, versions[2])
	if _, err := e.promote(e.owner, doc, versions[2], "", d.Document.Revision, "final is authoritative", d.ImpactToken); err != nil {
		t.Fatal(err)
	}
	r := e.requirement("Executed agreement (rehearsal)")
	cur, _ := e.criterion(r.ID, port.CriterionInput{Title: "Current agreement", Mandatory: true, Rule: "CURRENT_AUTHORITATIVE", DocumentID: doc})
	fixed, _ := e.criterion(r.ID, port.CriterionInput{Title: "Draft 1 reviewed", Mandatory: false, Rule: "FIXED", FixedID: versions[0].String()})
	for _, c := range []struct {
		id matter.CriterionID
		v  matter.VersionID
	}{{cur, versions[2]}, {fixed, versions[0]}} {
		if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) {
			s.Reference, s.VersionID, s.Claims = "", c.v.String(), []string{c.id.String()}
		}); err != nil {
			t.Fatal(err)
		}
		k := e.claimOf(r.ID, c.id)
		if _, err := e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: k.Claim.ID.String(),
			ExpectedSubjectEpoch: e.detail(r.ID).View.Item.ProofEpoch, Verdict: "ACCEPTED", Rationale: "rehearsal", AssessedVersionID: c.v.String(), ExpectedAssessmentID: e.seen(r.ID, k.Claim.ID)}); err != nil {
			t.Fatal(err)
		}
	}
	// A revoked member and a second matter the editor cannot see.
	w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
	if err := w1.revokeMatter(e.owner, e.m, e.viewer, w1.matterRevision(e.owner, e.wsID, e.m)); err != nil {
		t.Fatal(err)
	}
	m2 := w1.mustMatter(e.owner, e.wsID, "Rehearsal matter two (editor has no access)")
	if _, err := e.reqs.CreateRequirement(e.ctx, port.CreateRequirementCmd{ActorID: e.owner.String(), MatterID: m2.MatterID.String(), IdempotencyKey: newKey(),
		RequestHash: anyHash, Title: "M2 only", Outcome: "inaccessible to the editor"}); err != nil {
		t.Fatal(err)
	}
}

// SeedPostBoundaryMarker writes a record AFTER the backup boundary; it must be absent from the restore.
func SeedPostBoundaryMarker(t *testing.T, newBundle Factory) {
	t.Helper()
	e := newW2Env(t, newBundle)
	w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
	w1.mustWorkspace(e.owner, "POST-BOUNDARY-MARKER")
}
