package mattercontrol

// Shared W3 contract: documents with immutable versions and guarded promotion, evidence
// criteria, claims, independent per-claim assessment, disputes, revocation, applicability and
// the proof reads. It runs unchanged against the in-memory double and the PostgreSQL adapter.

import (
	"context"
	"errors"
	"io"
	"strings"
	"testing"
	"testing/iotest"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

// ensureReviewer creates (once) a designated verifier who is a matter EDITOR.
func (e *w2Env) ensureReviewer() {
	e.t.Helper()
	if e.reviewer == "" {
		e.reviewer = e.newVerifier()
	}
}

func (e *w2Env) newVerifier() matter.ActorID {
	e.t.Helper()
	w1 := w1Env{t: e.t, ws: e.ws, ctx: e.ctx}
	u := newActor(e.b)
	if err := w1.grantWS(e.owner, e.wsID, u, "MEMBER", w1.wsRevision(e.owner, e.wsID)); err != nil {
		e.t.Fatal(err)
	}
	if err := w1.grantMatter(e.owner, e.m, u, "EDITOR", w1.matterRevision(e.owner, e.wsID, e.m)); err != nil {
		e.t.Fatal(err)
	}
	if _, err := e.ev.DesignateVerifier(e.ctx, port.DesignateVerifierCmd{ActorID: e.owner.String(), MatterID: e.m.String(), UserID: u.String()}); err != nil {
		e.t.Fatalf("designate verifier: %v", err)
	}
	return u
}

func (e *w2Env) criterion(subject matter.NodeID, in port.CriterionInput) (matter.CriterionID, matter.ProofChecklist) {
	e.t.Helper()
	cl, err := e.ev.CreateCriterion(e.ctx, port.CreateCriterionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), SubjectID: subject.String(), Criterion: in})
	if err != nil {
		e.t.Fatalf("criterion: %v", err)
	}
	return cl.Result.Criteria[len(cl.Result.Criteria)-1].Criterion.ID, cl
}

func (e *w2Env) submit(actor matter.ActorID, mut func(*port.SubmitEvidenceCmd)) (matter.CreatedResult, error) {
	cmd := port.SubmitEvidenceCmd{ActorID: actor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Reference: "synthetic-ref"}
	mut(&cmd)
	return e.ev.SubmitEvidence(e.ctx, cmd)
}

func (e *w2Env) checklist(id matter.NodeID) matter.ProofChecklist {
	e.t.Helper()
	cl, err := e.ev.ProofChecklist(e.ctx, port.SubjectQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), SubjectID: id.String()})
	if err != nil {
		e.t.Fatal(err)
	}
	return cl
}

// claimOf returns the (only) current claim of a criterion.
func (e *w2Env) claimOf(subject matter.NodeID, crit matter.CriterionID) matter.ClaimStatus {
	e.t.Helper()
	for _, c := range e.checklist(subject).Result.Criteria {
		if c.Criterion.ID == crit && len(c.Claims) > 0 {
			return c.Claims[len(c.Claims)-1]
		}
	}
	e.t.Fatalf("no claim on criterion %s", crit)
	return matter.ClaimStatus{}
}

func (e *w2Env) assess(actor matter.ActorID, subject matter.NodeID, claim matter.ClaimID, verdict string) (matter.ProofChecklist, error) {
	return e.ev.Assess(e.ctx, port.AssessCmd{ActorID: actor.String(), MatterID: e.m.String(), ClaimID: claim.String(),
		ExpectedSubjectEpoch: e.detail(subject).View.Item.ProofEpoch, Verdict: verdict, Rationale: "synthetic review",
		ExpectedAssessmentID: e.seen(subject, claim)})
}

// seen is what a fresh reader of the proof checklist would bind its review to: the id of the
// claim's current assessment, or a pointer to "" when none exists yet (F02).
func (e *w2Env) seen(subject matter.NodeID, claim matter.ClaimID) *string {
	e.t.Helper()
	id := ""
	for _, c := range e.checklist(subject).Result.Criteria {
		for _, k := range c.Claims {
			if k.Claim.ID == claim && k.Current != nil {
				id = k.Current.ID.String()
			}
		}
	}
	return &id
}

// state asserts the derived aggregate and that the persisted read-model agrees with it.
func (e *w2Env) state(label string, id matter.NodeID, want matter.VerificationState) {
	e.t.Helper()
	if got := e.checklist(id).Result.State; got != want {
		e.t.Fatalf("%s: derived verification %s, want %s", label, got, want)
	}
	if got := e.detail(id).View.Item.Verification; got != want {
		e.t.Fatalf("%s: item reads %s, want %s", label, got, want)
	}
}

func (e *w2Env) document(name string) matter.DocumentDetail {
	e.t.Helper()
	d, err := e.ev.CreateDocument(e.ctx, port.CreateDocumentCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Name: name})
	if err != nil {
		e.t.Fatal(err)
	}
	got, err := e.ev.GetDocument(e.ctx, port.DocumentQuery{ActorID: e.editor.String(), MatterID: e.m.String(), DocumentID: d.ID})
	if err != nil {
		e.t.Fatal(err)
	}
	return got
}

func (e *w2Env) version(doc string, sum string) matter.VersionID {
	e.t.Helper()
	v, err := e.ev.AddVersion(e.ctx, port.AddVersionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), DocumentID: doc, IdempotencyKey: newKey(), RequestHash: anyHash,
		Filename: "spa.pdf", MediaType: "application/pdf", Ref: port.ObjectRef{SHA256: sum, Size: 10}})
	if err != nil {
		e.t.Fatalf("add version: %v", err)
	}
	return matter.VersionID(v.ID)
}

func (e *w2Env) promote(actor matter.ActorID, doc string, target matter.VersionID, expectedCur string, expectedRev int64, reason string, token string) (matter.DocumentDetail, error) {
	return e.ev.PromoteVersion(e.ctx, port.PromoteVersionCmd{ActorID: actor.String(), MatterID: e.m.String(), DocumentID: doc, TargetVersionID: target.String(),
		ExpectedCurrentVersionID: expectedCur, ExpectedRevision: expectedRev, Reason: reason, ImpactToken: token})
}

func (e *w2Env) preview(doc string, target matter.VersionID) matter.DocumentDetail {
	e.t.Helper()
	d, err := e.ev.GetDocument(e.ctx, port.DocumentQuery{ActorID: e.owner.String(), MatterID: e.m.String(), DocumentID: doc, PromoteTo: target.String()})
	if err != nil {
		e.t.Fatal(err)
	}
	return d
}

func sum(n byte) string { return strings.Repeat(string("0123456789abcdef"[n%16]), 64) }

// SuiteW3 runs the W3 contract against any Bundle whose Store supports evidence.
func SuiteW3(t *testing.T, newBundle Factory) {
	t.Helper()

	t.Run("a creation receipt whose saved access was revoked stays hidden and audits the refusal", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
		other := w1.mustMatter(e.owner, e.wsID, "Other matter").MatterID
		if err := w1.grantMatter(e.owner, other, e.editor, "EDITOR", w1.matterRevision(e.owner, e.wsID, other)); err != nil {
			t.Fatal(err)
		}
		cmd := port.CreateDocumentCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Name: "Synthetic document"}
		if _, err := e.ev.CreateDocument(e.ctx, cmd); err != nil {
			t.Fatal(err)
		}
		if err := w1.revokeMatter(e.owner, e.m, e.editor, w1.matterRevision(e.owner, e.wsID, e.m)); err != nil {
			t.Fatal(err)
		}
		before := e.b.World.Counts()
		cmd.MatterID = other.String()
		if _, err := e.ev.CreateDocument(e.ctx, cmd); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("saved receipt must remain hidden: %v", err)
		}
		after := e.b.World.Counts()
		if after.Audits != before.Audits+1 || after.Events != before.Events || after.Receipts != before.Receipts {
			t.Fatalf("saved-scope denial must audit without a domain effect: %+v -> %+v", before, after)
		}
	})

	t.Run("creation receipts cannot replay in another matter with the same actor key and hash", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
		other := w1.mustMatter(e.owner, e.wsID, "Other matter").MatterID
		for _, kind := range []string{"document", "action"} {
			t.Run(kind, func(t *testing.T) {
				key := newKey()
				create := func(m matter.MatterID) error {
					if kind == "document" {
						_, err := e.ev.CreateDocument(e.ctx, port.CreateDocumentCmd{ActorID: e.owner.String(), MatterID: m.String(), IdempotencyKey: key, RequestHash: anyHash, Name: "Synthetic document"})
						return err
					}
					_, err := e.work.CreateAction(e.ctx, port.CreateActionCmd{ActorID: e.owner.String(), MatterID: m.String(), IdempotencyKey: key, RequestHash: anyHash, Title: "Synthetic action", Outcome: "Synthetic outcome"})
					return err
				}
				if err := create(e.m); err != nil {
					t.Fatal(err)
				}
				if err := create(e.m); err != nil {
					t.Fatalf("same-scope replay: %v", err)
				}
				if err := create(other); !errors.Is(err, port.ErrIdempotencyKeyReuse) {
					t.Fatalf("foreign-scope receipt must refuse, got %v", err)
				}
			})
		}
	})

	t.Run("documents: immutable versions, nothing current by upload, guarded promotion (AC-115)", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		cmd := port.CreateDocumentCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Name: "  SPA "}
		first, err := e.ev.CreateDocument(e.ctx, cmd)
		if err != nil || first.Replayed || first.Kind != "DOCUMENT" {
			t.Fatalf("%+v %v", first, err)
		}
		if again, err := e.ev.CreateDocument(e.ctx, cmd); err != nil || !again.Replayed || again.ID != first.ID {
			t.Fatalf("replay: %+v %v", again, err)
		}
		cmd.RequestHash = otherHash
		if _, err := e.ev.CreateDocument(e.ctx, cmd); !errors.Is(err, port.ErrIdempotencyKeyReuse) {
			t.Fatalf("key reuse: %v", err)
		}
		cmd.ActorID, cmd.IdempotencyKey = e.viewer.String(), newKey()
		mustIs(t, "viewer", errOf(e.ev.CreateDocument(e.ctx, cmd)), port.ErrForbidden)

		v1, v2 := e.version(first.ID, sum(1)), e.version(first.ID, sum(2))
		_, err = e.ev.AddVersion(e.ctx, port.AddVersionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), DocumentID: first.ID, IdempotencyKey: newKey(), RequestHash: anyHash,
			Filename: "a/b.pdf", Ref: port.ObjectRef{SHA256: sum(3), Size: 1}})
		mustCode(t, "path in file name", err, "invalid-filename")
		_, err = e.ev.AddVersion(e.ctx, port.AddVersionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), DocumentID: first.ID, IdempotencyKey: newKey(), RequestHash: anyHash,
			Filename: "a.pdf", Ref: port.ObjectRef{SHA256: "xyz", Size: 1}})
		mustCode(t, "bad content ref", err, "invalid-content")

		d := e.preview(first.ID, v1)
		if d.Document.CurrentVersionID != nil || len(d.Versions) != 2 || d.Versions[0].No != 1 || d.Versions[1].No != 2 || d.Versions[1].Predecessor == nil || *d.Versions[1].Predecessor != v1 {
			t.Fatalf("a version never becomes current by being added (RULE-011): %+v", d)
		}
		tok := d.ImpactToken
		if tok == "" {
			t.Fatal("a promotion preview carries an acknowledgement token")
		}
		rev := d.Document.Revision

		_, err = e.promote(e.editor, first.ID, v1, "", rev, "why", tok)
		mustIs(t, "editor", err, port.ErrForbidden)
		_, err = e.promote(e.owner, first.ID, v1, "", 0, "why", tok)
		mustIs(t, "no revision", err, port.ErrPreconditionRequired)
		_, err = e.promote(e.owner, first.ID, v1, "", rev+7, "why", tok)
		mustIs(t, "stale revision", err, port.ErrPreconditionFailed)
		_, err = e.promote(e.owner, first.ID, v1, v2.String(), rev, "why", tok)
		mustIs(t, "stale expected current", err, port.ErrPreconditionFailed)
		_, err = e.promote(e.owner, first.ID, v1, "", rev, "  ", tok)
		mustCode(t, "reason", err, "reason-required")
		_, err = e.promote(e.owner, first.ID, v1, "", rev, "why", "forged")
		mustCode(t, "token", err, "impact-acknowledgement-required")
		_, err = e.promote(e.owner, first.ID, v2, "", rev, "why", tok) // token is bound to v1
		mustCode(t, "token bound to the target", err, "impact-acknowledgement-required")
		before := len(e.events())
		got, err := e.promote(e.owner, first.ID, v1, "", rev, "agreed final", tok)
		if err != nil || got.Document.CurrentVersionID == nil || *got.Document.CurrentVersionID != v1 || got.Document.Revision != rev+1 {
			t.Fatalf("%+v %v", got, err)
		}
		if len(e.events()) != before+1 {
			t.Fatal("promotion emits exactly one event")
		}
		// promoting the version that is already current is a no-change
		again, err := e.promote(e.owner, first.ID, v1, v1.String(), rev+1, "", "")
		if err != nil || again.Document.Revision != rev+1 || len(e.events()) != before+1 {
			t.Fatalf("current-as-target must be a no-change: %+v %v", again, err)
		}
		// recording a signature observes it on the exact version; the future is refused
		if _, err := e.ev.RecordSignature(e.ctx, port.RecordSignatureCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Version: v1.String(), Signer: "A. Signer", SignedAt: "2099-01-01T00:00:00Z"}); rejectedCode(err) != "signature-in-future" {
			t.Fatalf("future signature: %v", err)
		}
		sd, err := e.ev.RecordSignature(e.ctx, port.RecordSignatureCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Version: v1.String(), Signer: "A. Signer", SignedAt: "2020-01-01T00:00:00Z"})
		if err != nil || len(sd.Signatures) != 1 || sd.Signatures[0].VersionID != v1 {
			t.Fatalf("%+v %v", sd, err)
		}
	})

	t.Run("verification: criteria are not proof; independent designated review; partial/reject/dispute/revoke (AC-106,107,126,127,140)", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		e.ensureReviewer()
		second := e.newVerifier()
		r := e.requirement("Signed SPA")
		e.state("no criteria is never vacuously verified", r.ID, matter.VerificationUnverified)
		c1, _ := e.criterion(r.ID, port.CriterionInput{Title: "Signed copy", Mandatory: true, Rule: "NONE"})
		c2, _ := e.criterion(r.ID, port.CriterionInput{Title: "Board minute", Mandatory: true, Rule: "NONE"})
		for _, c := range []matter.CriterionID{c1, c2} {
			if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{c.String()} }); err != nil {
				t.Fatal(err)
			}
		}
		e.state("claimed but not assessed proves nothing", r.ID, matter.VerificationUnverified)
		k1, k2 := e.claimOf(r.ID, c1), e.claimOf(r.ID, c2)

		_, err := e.assess(e.editor, r.ID, k1.Claim.ID, "ACCEPTED")
		mustCode(t, "not a designated verifier", err, "not-verifier")
		_, err = e.assess(e.viewer, r.ID, k1.Claim.ID, "ACCEPTED")
		mustIs(t, "a VIEWER cannot write at all", err, port.ErrForbidden)
		_, err = e.ev.DesignateVerifier(e.ctx, port.DesignateVerifierCmd{ActorID: e.owner.String(), MatterID: e.m.String(), UserID: e.viewer.String()})
		mustCode(t, "verifier must be EDITOR/OWNER", err, "verifier-role")
		_, err = e.ev.DesignateVerifier(e.ctx, port.DesignateVerifierCmd{ActorID: e.editor.String(), MatterID: e.m.String(), UserID: e.editor.String()})
		mustIs(t, "only an OWNER designates", err, port.ErrForbidden)
		if _, err := e.ev.DesignateVerifier(e.ctx, port.DesignateVerifierCmd{ActorID: e.owner.String(), MatterID: e.m.String(), UserID: e.editor.String()}); err != nil {
			t.Fatal(err)
		}
		_, err = e.assess(e.editor, r.ID, k1.Claim.ID, "ACCEPTED")
		mustCode(t, "nobody verifies what they supplied (AC-126)", err, "self-evidence")
		if _, err := e.ev.DesignateVerifier(e.ctx, port.DesignateVerifierCmd{ActorID: e.owner.String(), MatterID: e.m.String(), UserID: e.editor.String(), Revoke: true}); err != nil {
			t.Fatal(err)
		}
		_, err = e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: k1.Claim.ID.String(), ExpectedSubjectEpoch: 99, Verdict: "ACCEPTED", Rationale: "x"})
		mustCode(t, "stale epoch", err, "stale-review")
		_, err = e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: k1.Claim.ID.String(), ExpectedSubjectEpoch: 0, Verdict: "MAYBE", Rationale: "x"})
		mustCode(t, "verdict", err, "invalid-verdict")
		_, err = e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: k1.Claim.ID.String(), ExpectedSubjectEpoch: 0, Verdict: "ACCEPTED"})
		mustCode(t, "rationale", err, "rationale-required")

		if _, err := e.assess(e.reviewer, r.ID, k1.Claim.ID, "ACCEPTED"); err != nil {
			t.Fatal(err)
		}
		e.state("one of two mandatory criteria satisfied (AC-127)", r.ID, matter.VerificationPartiallyVerified)
		if _, err := e.assess(e.reviewer, r.ID, k2.Claim.ID, "REJECTED"); err != nil {
			t.Fatal(err)
		}
		e.state("a rejection leaves it partial", r.ID, matter.VerificationPartiallyVerified)
		if _, err := e.assess(e.reviewer, r.ID, k2.Claim.ID, "ACCEPTED"); err != nil {
			t.Fatal(err)
		}
		e.state("all mandatory criteria satisfied", r.ID, matter.VerificationVerified)

		// dispute (AC-140): DISPUTED until an independent verifier resolves it
		a1 := e.claimOf(r.ID, c1).Current
		if a1 == nil {
			t.Fatal("accepted claim has a current assessment")
		}
		_, err = e.ev.RaiseDispute(e.ctx, port.RaiseDisputeCmd{ActorID: e.viewer.String(), MatterID: e.m.String(), AssessmentID: a1.ID.String(), Reason: "x"})
		mustIs(t, "viewer may not dispute", err, port.ErrForbidden)
		_, err = e.ev.RaiseDispute(e.ctx, port.RaiseDisputeCmd{ActorID: e.editor.String(), MatterID: e.m.String(), AssessmentID: a1.ID.String()})
		mustCode(t, "reason", err, "reason-required")
		if _, err := e.ev.RaiseDispute(e.ctx, port.RaiseDisputeCmd{ActorID: e.editor.String(), MatterID: e.m.String(), AssessmentID: a1.ID.String(), Reason: "signature looks altered"}); err != nil {
			t.Fatal(err)
		}
		e.state("an open dispute", r.ID, matter.VerificationDisputed)
		_, err = e.ev.RaiseDispute(e.ctx, port.RaiseDisputeCmd{ActorID: e.editor.String(), MatterID: e.m.String(), AssessmentID: a1.ID.String(), Reason: "again"})
		mustCode(t, "already disputed", err, "already-disputed")
		disp := e.checklist(r.ID).Result.Criteria[0].Claims[0]
		if !disp.Disputed {
			t.Fatalf("%+v", disp)
		}
		did := e.openDispute()
		_, err = e.ev.ResolveDispute(e.ctx, port.ResolveDisputeCmd{ActorID: e.editor.String(), MatterID: e.m.String(), DisputeID: did.String(), Resolution: "x"})
		mustCode(t, "the challenger is no verifier", err, "not-verifier")
		_, err = e.ev.ResolveDispute(e.ctx, port.ResolveDisputeCmd{ActorID: second.String(), MatterID: e.m.String(), DisputeID: did.String()})
		mustCode(t, "resolution rationale", err, "rationale-required")
		if _, err := e.ev.ResolveDispute(e.ctx, port.ResolveDisputeCmd{ActorID: second.String(), MatterID: e.m.String(), DisputeID: did.String(), Resolution: "original is intact"}); err != nil {
			t.Fatal(err)
		}
		e.state("resolution recomputes from current proof, it does not restore a label", r.ID, matter.VerificationVerified)

		// revoking an acceptance ends its satisfaction; the decision stays in history
		if _, err := e.ev.RevokeAssessment(e.ctx, port.RevokeAssessmentCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), AssessmentID: a1.ID.String(), Reason: "new facts"}); err != nil {
			t.Fatal(err)
		}
		e.state("revoked", r.ID, matter.VerificationPartiallyVerified)
		_, err = e.ev.RevokeAssessment(e.ctx, port.RevokeAssessmentCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), AssessmentID: a1.ID.String(), Reason: "again"})
		mustCode(t, "already revoked", err, "not-revocable")

		// a criterion revision invalidates claims and assessments pinned to the old revision (AC-128)
		rev := e.checklist(r.ID).Result.Criteria[1].Criterion.Revision
		_, err = e.ev.ReviseCriterion(e.ctx, port.ReviseCriterionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), CriterionID: c2.String(), ExpectedRevision: rev + 5, Reason: "x",
			Criterion: port.CriterionInput{Title: "Board minute v2", Mandatory: true, Rule: "NONE"}})
		mustIs(t, "stale criterion revision", err, port.ErrPreconditionFailed)
		if _, err := e.ev.ReviseCriterion(e.ctx, port.ReviseCriterionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), CriterionID: c2.String(), ExpectedRevision: rev, Reason: "scope changed",
			Criterion: port.CriterionInput{Title: "Board minute v2", Mandatory: true, Rule: "NONE"}}); err != nil {
			t.Fatal(err)
		}
		e.state("the proof was for the old criterion", r.ID, matter.VerificationUnverified)
	})

	t.Run("documents as proof: promotion invalidates the current-version criterion, a fixed one is unaffected (AC-107,157)", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		e.ensureReviewer()
		r := e.requirement("Executed SPA")
		doc := e.document("SPA")
		v1, v2 := e.version(doc.Document.ID.String(), sum(1)), e.version(doc.Document.ID.String(), sum(2))
		d := e.preview(doc.Document.ID.String(), v1)
		if _, err := e.promote(e.owner, doc.Document.ID.String(), v1, "", d.Document.Revision, "initial", d.ImpactToken); err != nil {
			t.Fatal(err)
		}
		cur, _ := e.criterion(r.ID, port.CriterionInput{Title: "Current SPA", Mandatory: true, Rule: "CURRENT_AUTHORITATIVE", DocumentID: doc.Document.ID.String()})
		fixed, _ := e.criterion(r.ID, port.CriterionInput{Title: "Draft 1 reviewed", Mandatory: false, Rule: "FIXED", FixedID: v1.String()})
		for _, c := range []matter.CriterionID{cur, fixed} {
			if _, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) {
				s.Reference, s.VersionID, s.Claims = "", v1.String(), []string{c.String()}
			}); err != nil {
				t.Fatal(err)
			}
		}
		_, err := e.submit(e.editor, func(s *port.SubmitEvidenceCmd) {
			s.Reference, s.VersionID, s.Claims = "", v2.String(), []string{fixed.String()}
		})
		mustCode(t, "a fixed criterion accepts only its version", err, "version-mismatch")
		for _, c := range []matter.CriterionID{cur, fixed} {
			k := e.claimOf(r.ID, c)
			_, err := e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: k.Claim.ID.String(),
				ExpectedSubjectEpoch: e.detail(r.ID).View.Item.ProofEpoch, Verdict: "ACCEPTED", Rationale: "ok", ExpectedAssessmentID: e.seen(r.ID, k.Claim.ID)})
			mustCode(t, "the assessed version must be stated", err, "assessed-version-mismatch")
			if _, err := e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: k.Claim.ID.String(),
				ExpectedSubjectEpoch: e.detail(r.ID).View.Item.ProofEpoch, Verdict: "ACCEPTED", Rationale: "ok", AssessedVersionID: v1.String(), ExpectedAssessmentID: e.seen(r.ID, k.Claim.ID)}); err != nil {
				t.Fatal(err)
			}
		}
		e.state("current version accepted", r.ID, matter.VerificationVerified)

		p := e.preview(doc.Document.ID.String(), v2)
		if p.Impact == nil || len(p.Impact.Invalidated) != 1 || p.Impact.Invalidated[0] != cur || len(p.Impact.Unaffected) != 1 || p.Impact.Unaffected[0] != fixed {
			t.Fatalf("impact: %+v", p.Impact)
		}
		if _, err := e.promote(e.owner, doc.Document.ID.String(), v2, v1.String(), p.Document.Revision, "v2 is final", p.ImpactToken); err != nil {
			t.Fatal(err)
		}
		cl := e.checklist(r.ID)
		if cl.Result.State != matter.VerificationPartiallyVerified && cl.Result.State != matter.VerificationUnverified {
			t.Fatalf("promoting a version invalidates the old acceptance: %s", cl.Result.State)
		}
		for _, c := range cl.Result.Criteria {
			switch c.Criterion.ID {
			case cur:
				if c.Satisfied || c.Reason != matter.CriterionStaleVersion {
					t.Fatalf("current criterion: %+v", c)
				}
			case fixed:
				if !c.Satisfied {
					t.Fatalf("a fixed criterion is unaffected: %+v", c)
				}
			}
		}
		e.state("persisted state follows", r.ID, cl.Result.State)
	})

	t.Run("evidence: receipted submit, withdrawal, applicability, read authorization", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		e.ensureReviewer()
		r := e.requirement("Bring-down certificate")
		c, _ := e.criterion(r.ID, port.CriterionInput{Title: "Certificate", Mandatory: true, Rule: "NONE"})
		cmd := port.SubmitEvidenceCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Reference: "synthetic-ref", Claims: []string{c.String()}}
		first, err := e.ev.SubmitEvidence(e.ctx, cmd)
		if err != nil || first.Replayed {
			t.Fatalf("%+v %v", first, err)
		}
		if again, err := e.ev.SubmitEvidence(e.ctx, cmd); err != nil || !again.Replayed || again.ID != first.ID {
			t.Fatalf("replay: %+v %v", again, err)
		}
		if n := len(e.checklist(r.ID).Result.Criteria[0].Claims); n != 1 {
			t.Fatalf("a replay creates no second claim: %d", n)
		}
		cmd.RequestHash = otherHash
		if _, err := e.ev.SubmitEvidence(e.ctx, cmd); !errors.Is(err, port.ErrIdempotencyKeyReuse) {
			t.Fatalf("key reuse: %v", err)
		}
		_, err = e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Reference = " " })
		mustCode(t, "target", err, "evidence-target-required")
		_, err = e.submit(e.editor, func(s *port.SubmitEvidenceCmd) { s.Claims = []string{"01a17c8f-15d0-7386-8133-c1625313f6d1"} })
		mustIs(t, "unknown criterion", err, port.ErrNotFound)
		_, err = e.submit(e.viewer, func(s *port.SubmitEvidenceCmd) {})
		mustIs(t, "viewer", err, port.ErrForbidden)

		_, err = e.ev.WithdrawEvidence(e.ctx, port.WithdrawEvidenceCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), EvidenceID: first.ID, Reason: "x"})
		mustIs(t, "only the submitter or an OWNER withdraws", err, port.ErrForbidden)
		_, err = e.ev.WithdrawEvidence(e.ctx, port.WithdrawEvidenceCmd{ActorID: e.editor.String(), MatterID: e.m.String(), EvidenceID: first.ID})
		mustCode(t, "reason", err, "reason-required")
		if _, err := e.ev.WithdrawEvidence(e.ctx, port.WithdrawEvidenceCmd{ActorID: e.editor.String(), MatterID: e.m.String(), EvidenceID: first.ID, Reason: "wrong file"}); err != nil {
			t.Fatal(err)
		}
		if got := e.checklist(r.ID).Result.Criteria[0]; got.Satisfied || got.Reason != matter.CriterionWithdrawn {
			t.Fatalf("withdrawn evidence stays visible and counts for nothing: %+v", got)
		}
		k := e.claimOf(r.ID, c)
		_, err = e.assess(e.reviewer, r.ID, k.Claim.ID, "ACCEPTED")
		mustCode(t, "withdrawn", err, "evidence-withdrawn")

		// applicability: OWNER decision, never while a mandatory criterion applies
		set := func(actor matter.ActorID, id matter.NodeID, rev int64, notReq bool, reason string) (matter.ProofChecklist, error) {
			return e.ev.SetApplicability(e.ctx, port.SetApplicabilityCmd{ActorID: actor.String(), MatterID: e.m.String(), SubjectID: id.String(), ExpectedRevision: rev, NotRequired: notReq, Reason: reason})
		}
		_, err = set(e.owner, r.ID, e.rev(r.ID), true, "x")
		mustCode(t, "mandatory criteria exist", err, "mandatory-criteria-exist")
		bare := e.requirement("Courtesy copy")
		_, err = set(e.editor, bare.ID, e.rev(bare.ID), true, "x")
		mustIs(t, "editor", err, port.ErrForbidden)
		_, err = set(e.owner, bare.ID, e.rev(bare.ID), true, " ")
		mustCode(t, "reason", err, "reason-required")
		_, err = set(e.owner, bare.ID, 0, true, "x")
		mustIs(t, "revision required", err, port.ErrPreconditionRequired)
		if _, err := set(e.owner, bare.ID, e.rev(bare.ID), true, "not applicable to this deal"); err != nil {
			t.Fatal(err)
		}
		e.state("owner decision", bare.ID, matter.VerificationNotRequired)
		if _, err := set(e.owner, bare.ID, e.rev(bare.ID), false, "needed after all"); err != nil {
			t.Fatal(err)
		}
		e.state("revoked exemption is unverified, not verified", bare.ID, matter.VerificationUnverified)

		// reads: an outsider learns nothing; a viewer may read but not write
		_, err = e.ev.ProofChecklist(e.ctx, port.SubjectQuery{ActorID: e.out.String(), MatterID: e.m.String(), SubjectID: r.ID.String()})
		mustIs(t, "outsider", err, port.ErrNotFound)
		_, err = e.ev.CreateCriterion(e.ctx, port.CreateCriterionCmd{ActorID: e.viewer.String(), MatterID: e.m.String(), SubjectID: r.ID.String(), Criterion: port.CriterionInput{Title: "x", Mandatory: true}})
		mustIs(t, "viewer writes", err, port.ErrForbidden)
		a := e.action(e.editor, "An action")
		_, err = e.ev.CreateCriterion(e.ctx, port.CreateCriterionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), SubjectID: a.ID.String(), Criterion: port.CriterionInput{Title: "x", Mandatory: true}})
		mustCode(t, "an Action carries no proof unless it asks for it", err, "proof-not-required")
	})

	t.Run("content: authorize before storing, bounded, content-bound replay, exact bytes back", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		doc := e.document("Executed SPA").Document.ID.String()
		up := func(actor matter.ActorID, key, hash, body string, max int64) (matter.CreatedResult, error) {
			return e.ev.UploadVersion(e.ctx, port.UploadVersionCmd{ActorID: actor.String(), MatterID: e.m.String(), DocumentID: doc, IdempotencyKey: key,
				RequestHash: hash, Filename: "spa.pdf", MediaType: "application/pdf", Body: strings.NewReader(body), MaxBytes: max})
		}
		_, err := up(e.viewer, newKey(), anyHash, "viewer bytes", 100)
		mustIs(t, "viewer", err, port.ErrForbidden)
		_, err = up(e.out, newKey(), anyHash, "outsider bytes", 100)
		mustIs(t, "outsider", err, port.ErrNotFound)
		if e.objs.Count() != 0 {
			t.Fatal("an actor who may not write never makes the server store their bytes")
		}
		_, err = up(e.editor, newKey(), anyHash, "0123456789", 5)
		if !errors.Is(err, port.ErrObjectTooLarge) || e.objs.Count() != 0 {
			t.Fatalf("over the limit stores nothing: %v", err)
		}
		key := newKey()
		first, err := up(e.editor, key, anyHash, "content one", 100)
		if err != nil || first.Replayed || first.Kind != "DOCUMENT_VERSION" {
			t.Fatalf("%+v %v", first, err)
		}
		if again, err := up(e.editor, key, anyHash, "content one", 100); err != nil || !again.Replayed || again.ID != first.ID {
			t.Fatalf("replay: %+v %v", again, err)
		}
		if _, err := up(e.editor, key, anyHash, "content TWO", 100); !errors.Is(err, port.ErrIdempotencyKeyReuse) {
			t.Fatalf("one key never stands for two contents: %v", err)
		}
		if d, err := e.ev.GetDocument(e.ctx, port.DocumentQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), DocumentID: doc}); err != nil || len(d.Versions) != 1 {
			t.Fatalf("exactly one version: %+v %v", d, err)
		}
		ver, rc, err := e.ev.OpenVersion(e.ctx, port.VersionContentQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), VersionID: first.ID})
		if err != nil {
			t.Fatal(err)
		}
		got, _ := io.ReadAll(rc)
		_ = rc.Close()
		if string(got) != "content one" || ver.SizeBytes != 11 || ver.Filename != "spa.pdf" {
			t.Fatalf("%q %+v", got, ver)
		}
		_, _, err = e.ev.OpenVersion(e.ctx, port.VersionContentQuery{ActorID: e.out.String(), MatterID: e.m.String(), VersionID: first.ID})
		mustIs(t, "outsider reads nothing", err, port.ErrNotFound)

		// A record whose bytes are gone or damaged is an integrity incident: still the same retryable
		// "unavailable" answer, but an operator sees an ERROR naming the matter and the digest, and
		// nothing else (no file name, no actor).
		query := port.VersionContentQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), VersionID: first.ID}
		assertIncident := func(problem string, want int) {
			t.Helper()
			got := e.logs.entries(t, "ERROR")
			if len(got) != want {
				t.Fatalf("%s: want %d error log(s), got %d: %s", problem, want, len(got), e.logs.raw())
			}
			rec := got[want-1]
			if rec["matter"] != e.m.String() || rec["sha256"] != ver.SHA256 || rec["problem"] != problem {
				t.Fatalf("%s: log fields: %v", problem, rec)
			}
			for _, secret := range []string{ver.Filename, e.viewer.String()} {
				if strings.Contains(e.logs.raw(), secret) {
					t.Fatalf("%s: the log must not carry %q: %s", problem, secret, e.logs.raw())
				}
			}
		}
		before := len(e.logs.entries(t, "ERROR"))
		e.objs.Remove(e.m, ver.SHA256)
		_, _, err = e.ev.OpenVersion(e.ctx, query)
		if !errors.Is(err, port.ErrObjectMissing) || !errors.Is(err, port.ErrObjectUnavailable) {
			t.Fatalf("lost bytes: %v", err)
		}
		assertIncident("missing", before+1)

		broken := service.NewEvidenceService(e.work, contentStore{ObjectStore: e.objs, open: func(context.Context, matter.MatterID, string) (io.ReadCloser, error) {
			return io.NopCloser(iotest.ErrReader(port.ErrObjectCorrupt)), nil
		}})
		_, rc, err = broken.OpenVersion(e.ctx, query)
		if err != nil {
			t.Fatal(err)
		}
		for range 2 { // reading again must not log again
			if _, err := io.ReadAll(rc); !errors.Is(err, port.ErrObjectCorrupt) {
				t.Fatalf("damaged stream: %v", err)
			}
		}
		_ = rc.Close()
		assertIncident("corrupt", before+2)

		down := service.NewEvidenceService(e.work, contentStore{ObjectStore: e.objs, open: func(context.Context, matter.MatterID, string) (io.ReadCloser, error) {
			return nil, port.ErrObjectUnavailable
		}})
		if _, _, err = down.OpenVersion(e.ctx, query); !errors.Is(err, port.ErrObjectUnavailable) || errors.Is(err, port.ErrObjectMissing) {
			t.Fatalf("a store that is down is unavailable, not missing: %v", err)
		}
		if n := len(e.logs.entries(t, "ERROR")); n != before+2 {
			t.Fatalf("a store that is merely down is not an integrity incident; %d error logs", n)
		}
	})
}

func errOf[T any](_ T, err error) error { return err }

// openDispute finds the (only) raised dispute through the history read.
func (e *w2Env) openDispute() matter.DisputeID {
	e.t.Helper()
	for _, ev := range e.events() {
		if ev.Type == "dispute.raised" {
			return matter.DisputeID(ev.TargetID)
		}
	}
	e.t.Fatal("no dispute.raised event")
	return ""
}
