package mattercontrol

// BF-05 (pending-assessment queue) and BF-08 (cross-workspace Matter discovery): bounded,
// authorized read models. They run unchanged against the in-memory double and PostgreSQL.

import (
	"strings"
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// SuiteBF runs the business-flow remediation read-model contracts.
func SuiteBF(t *testing.T, newBundle Factory) {
	t.Helper()
	t.Run("BF-05 review queue", func(t *testing.T) { bfReviewQueue(t, newBundle) })
	t.Run("BF-08 matter discovery", func(t *testing.T) { bfDiscovery(t, newBundle) })
}

func (e *w2Env) queue(actor matter.ActorID) matter.ReviewQueue {
	e.t.Helper()
	q, err := e.ev.ReviewQueue(e.ctx, port.ReviewQueueQuery{ActorID: actor.String(), Limit: 50})
	if err != nil {
		e.t.Fatalf("review queue: %v", err)
	}
	return q
}

func bfReviewQueue(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	f := e.newFiling(true)
	pkg, _ := e.criterion(f.filingID, port.CriterionInput{Title: "Signed filing form", Mandatory: true, Rule: "NONE"})
	doc := e.document("Filing package").Document.ID.String()
	ver := e.version(doc, sum(1))

	if n := len(e.queue(e.reviewer).Items); n != 0 {
		t.Fatalf("nothing offered yet: %d rows", n)
	}
	res, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.VersionID, s.Claims = ver.String(), []string{pkg.String()} })
	if err != nil {
		t.Fatal(err)
	}

	// The designated independent verifier discovers the claim without knowing the item.
	q := e.queue(e.reviewer)
	if len(q.Items) != 1 || q.Total != 1 {
		t.Fatalf("the verifier sees exactly the pending claim: %+v", q)
	}
	row := q.Items[0]
	if row.MatterID != e.m || row.MatterTitle != "Atlas" || row.SubjectID != f.filingID || row.SubjectTitle != "Merger filing" ||
		row.CriterionTitle != "Signed filing form" || row.CriterionID != pkg || row.CriterionPurpose != matter.PurposePackage ||
		row.EvidenceID.String() != res.ID || row.VersionID == nil || *row.VersionID != ver || row.VersionLabel == "" ||
		row.ClaimedBy != e.editor || row.ClaimedByName == "" || row.Reason != matter.CriterionPending || row.SubjectEpoch != 0 {
		t.Fatalf("the row carries the exact criterion, document version and context: %+v", row)
	}
	if row.ClaimID != e.claimOf(f.filingID, pkg).Claim.ID {
		t.Fatalf("the row opens the exact claim: %+v", row)
	}

	// The submitter, a viewer, an undesignated matter OWNER and an outsider see nothing: this is
	// not an ordinary assigned-work queue and it never offers self-assessment.
	for name, who := range map[string]matter.ActorID{"submitter": e.editor, "viewer": e.viewer, "owner without designation": e.owner, "outsider": e.out} {
		if got := e.queue(who); len(got.Items) != 0 || got.Total != 0 {
			t.Fatalf("%s must not see the queue: %+v", name, got)
		}
	}
	// A reviewer who offered the claim themselves is not independent of it.
	own, err := e.submit(e.reviewer, func(s *port.SubmitEvidenceCmd) { s.Reference, s.Claims = "self-offered", []string{pkg.String()} })
	if err != nil {
		t.Fatal(err)
	}
	if got := e.queue(e.reviewer); len(got.Items) != 1 || got.Items[0].EvidenceID.String() == own.ID {
		t.Fatalf("a verifier never reviews their own offer: %+v", got)
	}

	// Assessing removes the row; the queue is derived live, so there is nothing stale to purge.
	none := ""
	if _, err := e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: row.ClaimID.String(),
		ExpectedSubjectEpoch: row.SubjectEpoch, Verdict: "ACCEPTED", Rationale: "synthetic review", AssessedVersionID: ver.String(), ExpectedAssessmentID: &none}); err != nil {
		t.Fatal(err)
	}
	if got := e.queue(e.reviewer); len(got.Items) != 0 {
		t.Fatalf("an assessed claim leaves the queue: %+v", got)
	}

	// Withdrawn evidence leaves the queue too.
	ev2, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Reference, s.Claims = "second", []string{pkg.String()} })
	if err != nil {
		t.Fatal(err)
	}
	if got := e.queue(e.reviewer); len(got.Items) != 1 {
		t.Fatalf("the new claim is pending: %+v", got)
	}
	if _, err := e.ev.WithdrawEvidence(e.ctx, port.WithdrawEvidenceCmd{ActorID: e.editor.String(), MatterID: e.m.String(), EvidenceID: ev2.ID, Reason: "wrong file"}); err != nil {
		t.Fatal(err)
	}
	if got := e.queue(e.reviewer); len(got.Items) != 0 {
		t.Fatalf("withdrawn evidence cannot be assessed: %+v", got)
	}

	// Revoked access removes the rows and the count at once.
	if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Reference, s.Claims = "third", []string{pkg.String()} }); err != nil {
		t.Fatal(err)
	}
	if got := e.queue(e.reviewer); len(got.Items) != 1 {
		t.Fatalf("pending again: %+v", got)
	}
	w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
	if err := w1.revokeMatter(e.owner, e.m, e.reviewer, w1.matterRevision(e.owner, e.wsID, e.m)); err != nil {
		t.Fatal(err)
	}
	if got := e.queue(e.reviewer); len(got.Items) != 0 || got.Total != 0 {
		t.Fatalf("a revoked verifier sees no rows and no count: %+v", got)
	}
}

func bfDiscovery(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
	// A second workspace the editor belongs to, with its own matter.
	ws2 := w1.mustWorkspace(e.owner, "Beta Partners")
	if err := w1.grantWS(e.owner, ws2.ID, e.editor, "MEMBER", w1.wsRevision(e.owner, ws2.ID)); err != nil {
		t.Fatal(err)
	}
	m2 := w1.mustMatter(e.owner, ws2.ID, "Atlas Holdings merger").MatterID
	if err := w1.grantMatter(e.owner, m2, e.editor, "VIEWER", w1.matterRevision(e.owner, ws2.ID, m2)); err != nil {
		t.Fatal(err)
	}
	// A confidential matter in the editor's first workspace: the editor has no explicit membership.
	secret := w1.mustMatter(e.owner, e.wsID, "Atlas confidential").MatterID

	find := func(actor matter.ActorID, q string, limit int, after *matter.DiscoveryCursor) matter.MatterDiscoveryPage {
		t.Helper()
		p, err := e.ws.DiscoverMatters(e.ctx, port.DiscoverMattersQuery{ActorID: actor.String(), Query: q, Limit: limit, After: after})
		if err != nil {
			t.Fatalf("discover %q: %v", q, err)
		}
		return p
	}

	// One entry finds matters across workspaces by name, with workspace context and caller role.
	p := find(e.editor, "atlas", 10, nil)
	if p.Total != 2 || len(p.Items) != 2 {
		t.Fatalf("both accessible Atlas matters, never the confidential one: %+v", p)
	}
	got := map[matter.MatterID]matter.DiscoveredMatter{}
	for _, it := range p.Items {
		got[it.Header.MatterID] = it
	}
	if got[e.m].WorkspaceName != "Acme" || got[e.m].CallerRole != matter.MatterRoleEditor ||
		got[m2].WorkspaceName != "Beta Partners" || got[m2].CallerRole != matter.MatterRoleViewer {
		t.Fatalf("workspace context and role are visible: %+v", got)
	}
	if _, leaked := got[secret]; leaked {
		t.Fatal("a Matter without explicit membership is never discoverable")
	}
	for _, it := range find(e.owner, "confidential", 10, nil).Items {
		if it.Header.MatterID != secret {
			t.Fatalf("unexpected: %+v", it)
		}
	}
	// A workspace OWNER has no implicit access to a confidential Matter they were not granted:
	// the creator of `secret` is its owner, so use a separate workspace owner without membership.
	wsOnly := newActor(e.b)
	if err := w1.grantWS(e.owner, e.wsID, wsOnly, "OWNER", w1.wsRevision(e.owner, e.wsID)); err != nil {
		t.Fatal(err)
	}
	if got := find(wsOnly, "atlas", 10, nil); got.Total != 0 || len(got.Items) != 0 {
		t.Fatalf("workspace OWNER without Matter membership discovers nothing: %+v", got)
	}

	// Honest bounded pagination: the exact total, a cursor, no duplicates, the last page has none.
	first := find(e.editor, "", 1, nil)
	if first.Total != 2 || len(first.Items) != 1 || first.Next == nil {
		t.Fatalf("page one of two: %+v", first)
	}
	second := find(e.editor, "", 1, first.Next)
	if len(second.Items) != 1 || second.Next != nil || second.Items[0].Header.MatterID == first.Items[0].Header.MatterID {
		t.Fatalf("page two is the other matter and the last: %+v", second)
	}
	if got := find(e.editor, "zzz-no-such-matter", 10, nil); got.Total != 0 || len(got.Items) != 0 {
		t.Fatalf("no match is an empty page, not an error: %+v", got)
	}
	// Case-insensitive, trimmed substring of the title only.
	if got := find(e.editor, "  HOLDINGS ", 10, nil); len(got.Items) != 1 || !strings.Contains(got.Items[0].Header.Title, "Holdings") {
		t.Fatalf("substring match: %+v", got)
	}
	if got := find(e.out, "atlas", 10, nil); got.Total != 0 {
		t.Fatalf("an outsider discovers nothing: %+v", got)
	}

	// Revocation removes the result at once (matter membership, then the whole workspace).
	if err := w1.revokeMatter(e.owner, m2, e.editor, w1.matterRevision(e.owner, ws2.ID, m2)); err != nil {
		t.Fatal(err)
	}
	if got := find(e.editor, "atlas", 10, nil); got.Total != 1 || got.Items[0].Header.MatterID != e.m {
		t.Fatalf("a revoked matter disappears: %+v", got)
	}
	if err := w1.revokeWS(e.owner, e.wsID, e.editor, w1.wsRevision(e.owner, e.wsID)); err != nil {
		t.Fatal(err)
	}
	if got := find(e.editor, "atlas", 10, nil); got.Total != 0 {
		t.Fatalf("a revoked workspace hides its matters: %+v", got)
	}
}
