package mattercontrol

// Shared W2 contract: typed Actions, metadata, the execution transition table, AND-gate
// dependencies, milestones, parties and the derived reads. It runs unchanged against the
// in-memory double and the PostgreSQL adapter.

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
	"github.com/example/userapi/internal/core/service"
)

type w2Env struct {
	t    *testing.T
	b    Bundle
	ctx  context.Context
	ws   port.WorkspaceService
	reqs port.MatterService
	work *service.WorkService
	ev   *service.EvidenceService
	objs *MemoryObjects
	fil  *service.FilingService
	ctl  *service.ControlService
	// reviewer is a designated verifier (matter EDITOR), created on first use by verify.
	reviewer matter.ActorID
	owner    matter.ActorID // matter OWNER
	editor   matter.ActorID // matter EDITOR
	viewer   matter.ActorID // matter VIEWER
	out      matter.ActorID // not a member of anything
	wsID     matter.WorkspaceID
	m        matter.MatterID
}

func newW2Env(t *testing.T, newBundle Factory) *w2Env {
	t.Helper()
	b := newBundle(t)
	ids := port.RecordIDGenerator(kitIDs{})
	if b.IDs != nil {
		ids = b.IDs
	}
	ws, ok := b.Store.(port.WorkspaceStore)
	if !ok {
		t.Fatal("store does not implement port.WorkspaceStore")
	}
	e := &w2Env{
		t: t, b: b, ctx: context.Background(),
		ws:   service.NewWorkspaceService(ws, ids, discardLogger(), matter.KeyAgePolicy{}),
		reqs: service.NewMatterService(b.Store, ids, discardLogger(), matter.KeyAgePolicy{}),
		work: service.NewWorkService(b.Store, ids, discardLogger(), matter.KeyAgePolicy{}),
	}
	e.objs = NewMemoryObjects()
	var objects port.ObjectStore = e.objs
	if b.Objects != nil {
		objects = b.Objects
	}
	e.ev = service.NewEvidenceService(e.work, objects)
	e.fil = service.NewFilingService(e.work)
	e.ctl = service.NewControlService(e.work)
	e.owner, e.editor, e.viewer, e.out = newActor(b), newActor(b), newActor(b), newActor(b)
	w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
	wsv := w1.mustWorkspace(e.owner, "Acme")
	e.wsID = wsv.ID
	for _, u := range []matter.ActorID{e.editor, e.viewer} {
		if err := w1.grantWS(e.owner, e.wsID, u, "MEMBER", w1.wsRevision(e.owner, e.wsID)); err != nil {
			t.Fatal(err)
		}
	}
	e.m = w1.mustMatter(e.owner, e.wsID, "Atlas").MatterID
	for user, role := range map[matter.ActorID]string{e.editor: "EDITOR", e.viewer: "VIEWER"} {
		if err := w1.grantMatter(e.owner, e.m, user, role, w1.matterRevision(e.owner, e.wsID, e.m)); err != nil {
			t.Fatal(err)
		}
	}
	return e
}

// verify makes a Requirement VERIFIED through the real W3 path: a criterion, evidence submitted
// by the editor, and an acceptance by a different, designated verifier. Nothing is pinned.
func (e *w2Env) verify(id matter.NodeID) {
	e.t.Helper()
	e.ensureReviewer()
	cl, err := e.ev.CreateCriterion(e.ctx, port.CreateCriterionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), SubjectID: id.String(),
		Criterion: port.CriterionInput{Title: "Signed copy on file", Mandatory: true, Rule: "NONE"}})
	if err != nil {
		e.t.Fatalf("criterion: %v", err)
	}
	crit := cl.Result.Criteria[len(cl.Result.Criteria)-1].Criterion.ID
	if _, err := e.ev.SubmitEvidence(e.ctx, port.SubmitEvidenceCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
		Reference: "synthetic-ref-" + id.String(), Claims: []string{crit.String()}}); err != nil {
		e.t.Fatalf("evidence: %v", err)
	}
	cl, err = e.ev.ProofChecklist(e.ctx, port.SubjectQuery{ActorID: e.editor.String(), MatterID: e.m.String(), SubjectID: id.String()})
	if err != nil {
		e.t.Fatal(err)
	}
	var claim matter.ClaimID
	for _, c := range cl.Result.Criteria {
		if c.Criterion.ID == crit {
			claim = c.Claims[0].Claim.ID
		}
	}
	if _, err := e.ev.Assess(e.ctx, port.AssessCmd{ActorID: e.reviewer.String(), MatterID: e.m.String(), ClaimID: claim.String(),
		ExpectedSubjectEpoch: e.detail(id).View.Item.ProofEpoch, Verdict: "ACCEPTED", Rationale: "synthetic proof checked",
		ExpectedAssessmentID: e.seen(id, claim)}); err != nil {
		e.t.Fatalf("assess: %v", err)
	}
}

func (e *w2Env) requirement(title string) matter.WorkItem {
	e.t.Helper()
	res, err := e.reqs.CreateRequirement(e.ctx, port.CreateRequirementCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Title: title, Outcome: "Outcome of " + title,
	})
	if err != nil {
		e.t.Fatalf("create requirement: %v", err)
	}
	return res.Requirement.AsWorkItem()
}

func (e *w2Env) action(actor matter.ActorID, title string) matter.WorkItem {
	e.t.Helper()
	res, err := e.work.CreateAction(e.ctx, port.CreateActionCmd{
		ActorID: actor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Title: title, Outcome: "Outcome of " + title,
	})
	if err != nil {
		e.t.Fatalf("create action: %v", err)
	}
	return res.Item
}

func (e *w2Env) detail(id matter.NodeID) matter.WorkItemDetail {
	e.t.Helper()
	d, err := e.work.GetWorkItem(e.ctx, port.GetWorkItemQuery{ActorID: e.owner.String(), MatterID: e.m.String(), ItemID: id.String()})
	if err != nil {
		e.t.Fatalf("get %s: %v", id, err)
	}
	return d
}

func (e *w2Env) rev(id matter.NodeID) int64 { return e.detail(id).View.Item.Revision }

func (e *w2Env) transition(actor matter.ActorID, id matter.NodeID, to string, mut func(*port.TransitionExecutionCmd)) (matter.WorkItemView, error) {
	cmd := port.TransitionExecutionCmd{ActorID: actor.String(), MatterID: e.m.String(), ItemID: id.String(), ExpectedRevision: e.rev(id), To: to}
	if mut != nil {
		mut(&cmd)
	}
	return e.work.TransitionExecution(e.ctx, cmd)
}

func (e *w2Env) mustTransition(actor matter.ActorID, id matter.NodeID, to string, mut func(*port.TransitionExecutionCmd)) matter.WorkItemView {
	e.t.Helper()
	v, err := e.transition(actor, id, to, mut)
	if err != nil {
		e.t.Fatalf("transition %s -> %s: %v", id, to, err)
	}
	return v
}

func (e *w2Env) addDep(actor matter.ActorID, src, dst matter.NodeID, gate string) (matter.WorkItemDetail, error) {
	return e.work.AddDependency(e.ctx, port.AddDependencyCmd{
		ActorID: actor.String(), MatterID: e.m.String(), SourceID: src.String(), TargetID: dst.String(), Gate: gate,
		Reason: "needed first", ExpectedTargetRevision: e.rev(dst),
	})
}

func (e *w2Env) events() []matter.EventRecord {
	e.t.Helper()
	var out []matter.EventRecord
	var cur *matter.EventCursor
	for {
		p, err := e.ws.HistoryRead(e.ctx, port.HistoryReadQuery{ActorID: e.owner.String(), MatterID: e.m.String(), Limit: 200, Cursor: cur})
		if err != nil {
			e.t.Fatal(err)
		}
		out = append(out, p.Events...)
		if p.NextCursor == nil {
			return out
		}
		cur = p.NextCursor
	}
}

func rejectedCode(err error) string {
	var rej *matter.RejectedError
	if errors.As(err, &rej) {
		return rej.Code
	}
	return ""
}

func mustCode(t *testing.T, label string, err error, code string) {
	t.Helper()
	if got := rejectedCode(err); got != code {
		t.Fatalf("%s: got %v (code %q), want rejection %q", label, err, got, code)
	}
}

func ptrString(s string) *string { return &s }

// SuiteW2 runs the W2 contract against any Bundle whose Store supports the work graph.
func SuiteW2(t *testing.T, newBundle Factory) {
	t.Helper()

	t.Run("actions: receipted creation, Requirement is not Action, role matrix", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		key := newKey()
		cmd := port.CreateActionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: key, RequestHash: anyHash, Title: "  Draft SPA ", Outcome: "First draft"}
		first, err := e.work.CreateAction(e.ctx, cmd)
		if err != nil {
			t.Fatal(err)
		}
		it := first.Item
		if it.Kind != matter.NodeAction || it.Title != "Draft SPA" || it.Execution != matter.ExecutionNotStarted || it.Dependency != matter.DependencyReady ||
			it.ProofRequired || it.Verification != "" || it.Revision != 1 || first.Replayed {
			t.Fatalf("action: %+v", first)
		}
		again, err := e.work.CreateAction(e.ctx, cmd)
		if err != nil || !again.Replayed || again.Item.ID != it.ID || again.Seq != first.Seq {
			t.Fatalf("replay must return the stored outcome: %+v %v", again, err)
		}
		cmd.RequestHash = otherHash
		if _, err := e.work.CreateAction(e.ctx, cmd); !errors.Is(err, port.ErrIdempotencyKeyReuse) {
			t.Fatalf("key reuse: %v", err)
		}
		reopened := service.NewWorkService(e.b.World.Reopen(), kitIDs{}, discardLogger(), matter.KeyAgePolicy{})
		cmd.RequestHash = anyHash
		if third, err := reopened.CreateAction(e.ctx, cmd); err != nil || !third.Replayed || third.Item.ID != it.ID {
			t.Fatalf("replay after restart: %+v %v", third, err)
		}
		if c := e.b.World.Counts(); c.Actions != 1 {
			t.Fatalf("one action expected: %+v", c)
		}

		_, err = e.work.CreateAction(e.ctx, port.CreateActionCmd{ActorID: e.viewer.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Title: "x", Outcome: "y"})
		mustIs(t, "viewer", err, port.ErrForbidden)
		_, err = e.work.CreateAction(e.ctx, port.CreateActionCmd{ActorID: e.out.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Title: "x", Outcome: "y"})
		mustIs(t, "outsider", err, port.ErrNotFound)
		var ve interface{ Error() string }
		_, err = e.work.CreateAction(e.ctx, port.CreateActionCmd{ActorID: e.owner.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Title: "  ", Outcome: "y"})
		if err == nil {
			t.Fatal("a blank title is a validation failure")
		}
		_ = ve

		// AC-101: completing the Action leaves the Requirement and the other Action untouched.
		r := e.requirement("Obtain approval")
		a2 := e.action(e.owner, "Other action")
		e.mustTransition(e.editor, it.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "done earlier", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
		})
		if got := e.detail(r.ID).View.Item; got.Execution != matter.ExecutionNotStarted || got.Verification != matter.VerificationUnverified || got.Kind != matter.NodeRequirement {
			t.Fatalf("the Requirement must be unaffected: %+v", got)
		}
		if got := e.detail(a2.ID).View.Item; got.Execution != matter.ExecutionNotStarted || got.Revision != 1 {
			t.Fatalf("the other Action must be unaffected: %+v", got)
		}
	})

	t.Run("metadata: CAS, member-only owner, explicit-offset due, same-value no-op, history", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		a := e.action(e.editor, "Draft")
		upd := func(actor matter.ActorID, rev int64, mut func(*port.UpdateWorkItemCmd)) (matter.WorkItemView, error) {
			c := port.UpdateWorkItemCmd{ActorID: actor.String(), MatterID: e.m.String(), ItemID: a.ID.String(), ExpectedRevision: rev}
			mut(&c)
			return e.work.UpdateWorkItem(e.ctx, c)
		}
		_, err := upd(e.editor, 0, func(c *port.UpdateWorkItemCmd) { c.Title = ptrString("x") })
		mustIs(t, "missing CAS", err, port.ErrPreconditionRequired)
		_, err = upd(e.editor, 9, func(c *port.UpdateWorkItemCmd) { c.Title = ptrString("x") })
		mustIs(t, "stale CAS", err, port.ErrPreconditionFailed)
		_, err = upd(e.viewer, 1, func(c *port.UpdateWorkItemCmd) { c.Title = ptrString("x") })
		mustIs(t, "viewer", err, port.ErrForbidden)
		_, err = upd(e.out, 1, func(c *port.UpdateWorkItemCmd) { c.Title = ptrString("x") })
		mustIs(t, "outsider", err, port.ErrNotFound)

		_, err = upd(e.editor, 1, func(c *port.UpdateWorkItemCmd) { c.Due = port.OptString{Set: true, Value: "2026-06-15"} })
		if err == nil {
			t.Fatal("a date without an explicit offset must be refused (no guessed local timezone)")
		}
		_, err = upd(e.editor, 1, func(c *port.UpdateWorkItemCmd) { c.Owner = port.OptString{Set: true, Value: e.out.String()} })
		mustCode(t, "assignee outside the matter", err, "owner-not-member")
		if c := e.b.World.Counts(); c.MatterMembers != 3 {
			t.Fatalf("assignment must never grant access: %+v", c)
		}
		_, err = upd(e.editor, 1, func(c *port.UpdateWorkItemCmd) {
			c.Workstream = port.OptString{Set: true, Value: "0192b1c4-0000-7000-8000-000000000999"}
		})
		mustCode(t, "unknown workstream", err, "unknown-workstream")

		ws, err := e.work.CreateWorkstream(e.ctx, port.CreateWorkstreamCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Name: "Closing"})
		if err != nil {
			t.Fatal(err)
		}
		v, err := upd(e.editor, 1, func(c *port.UpdateWorkItemCmd) {
			c.Title = ptrString("  Draft SPA v2 ")
			c.Owner = port.OptString{Set: true, Value: e.editor.String()}
			c.Due = port.OptString{Set: true, Value: "2026-06-15T09:00:00+07:00"}
			c.Workstream = port.OptString{Set: true, Value: ws.ID.String()}
		})
		if err != nil {
			t.Fatal(err)
		}
		it := v.Item
		if it.Title != "Draft SPA v2" || it.OwnerActorID == nil || *it.OwnerActorID != e.editor || it.DueAt == nil ||
			!it.DueAt.Equal(time.Date(2026, 6, 15, 2, 0, 0, 0, time.UTC)) || it.WorkstreamID == nil || it.Revision != 2 {
			t.Fatalf("updated: %+v", it)
		}
		eventsBefore := len(e.events())
		v2, err := upd(e.editor, 2, func(c *port.UpdateWorkItemCmd) { c.Title = ptrString("Draft SPA v2") })
		if err != nil || v2.Item.Revision != 2 || len(e.events()) != eventsBefore {
			t.Fatalf("a same-value update is a no-op without revision bump or event: %+v %v", v2.Item, err)
		}
		cleared, err := upd(e.editor, 2, func(c *port.UpdateWorkItemCmd) {
			c.Owner, c.Due, c.Workstream = port.OptString{Set: true}, port.OptString{Set: true}, port.OptString{Set: true}
		})
		if err != nil || cleared.Item.OwnerActorID != nil || cleared.Item.DueAt != nil || cleared.Item.WorkstreamID != nil {
			t.Fatalf("clearing: %+v %v", cleared.Item, err)
		}
		var updates int
		for _, ev := range e.events() {
			if ev.Type == "work.updated" {
				updates++
				if len(ev.Before) == 0 || len(ev.After) == 0 || ev.TargetID != a.ID.String() {
					t.Fatalf("history carries before/after for the target: %+v", ev)
				}
			}
		}
		if updates != 2 {
			t.Fatalf("two accepted edits, two events: %d", updates)
		}
	})

	t.Run("execution: guards, waiting is not blocked, completed is not verified, no-op, stale", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		r := e.requirement("Board approval")
		// AC-121: completing a Requirement changes execution only.
		done := e.mustTransition(e.editor, r.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "approved before", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
		})
		if done.Item.Execution != matter.ExecutionCompleted || done.Item.Verification != matter.VerificationUnverified || done.Item.CompletedAt == nil {
			t.Fatalf("AC-121: %+v", done.Item)
		}
		if done.Attention.State != matter.AttentionAttention || done.Attention.Reasons[0] != matter.AttnCompletedUnverified {
			t.Fatalf("the evidence gap is visible: %+v", done.Attention)
		}

		// AC-104: waiting keeps dependency independent; needs party + condition + owner.
		a := e.action(e.owner, "Await counterparty")
		party, err := e.work.CreateParty(e.ctx, port.CreatePartyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Name: "Buyer counsel", Kind: "ORGANISATION", Contact: "counsel@example.test"})
		if err != nil {
			t.Fatal(err)
		}
		_, err = e.transition(e.editor, a.ID, "WAITING", func(c *port.TransitionExecutionCmd) {
			c.WaitingPartyID, c.WaitingCondition = party.ID.String(), "signed draft"
		})
		mustCode(t, "no owner yet", err, "waiting-owner-required")
		if _, err := e.work.UpdateWorkItem(e.ctx, port.UpdateWorkItemCmd{ActorID: e.editor.String(), MatterID: e.m.String(), ItemID: a.ID.String(), ExpectedRevision: 1, Owner: port.OptString{Set: true, Value: e.editor.String()}}); err != nil {
			t.Fatal(err)
		}
		_, err = e.transition(e.editor, a.ID, "WAITING", func(c *port.TransitionExecutionCmd) {
			c.WaitingPartyID, c.WaitingCondition = "0192b1c4-0000-7000-8000-000000000aaa", "x"
		})
		mustCode(t, "unknown party", err, "unknown-party")
		w := e.mustTransition(e.editor, a.ID, "WAITING", func(c *port.TransitionExecutionCmd) {
			c.WaitingPartyID, c.WaitingCondition = party.ID.String(), "signed draft"
		})
		if w.Item.Execution != matter.ExecutionWaiting || w.Item.Dependency != matter.DependencyReady || w.Item.WaitingPartyID == nil || *w.Item.WaitingPartyID != party.ID {
			t.Fatalf("AC-104: %+v", w.Item)
		}
		waiting, err := e.work.WaitingOn(e.ctx, port.MatterListQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
		if err != nil || len(waiting) != 1 || waiting[0].Item.ID != a.ID {
			t.Fatalf("waiting-on: %+v %v", waiting, err)
		}
		back := e.mustTransition(e.editor, a.ID, "IN_PROGRESS", nil)
		if back.Item.WaitingPartyID != nil || back.Item.WaitingCondition != nil {
			t.Fatalf("leaving WAITING clears the wait: %+v", back.Item)
		}

		// Same-state retry: no mutation and no duplicate event.
		before := e.events()
		rev := e.rev(a.ID)
		same, err := e.transition(e.editor, a.ID, "IN_PROGRESS", nil)
		if err != nil || same.Item.Revision != rev || len(e.events()) != len(before) {
			t.Fatalf("same-state must be a no-op: %+v %v", same.Item, err)
		}

		// Unlisted pair, stale revision, role limits.
		_, err = e.transition(e.editor, r.ID, "NOT_STARTED", func(c *port.TransitionExecutionCmd) { c.Reason = "undo" })
		mustCode(t, "terminal -> NOT_STARTED", err, "transition-not-allowed")
		_, err = e.transition(e.editor, a.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) { c.ExpectedRevision = 1 })
		mustIs(t, "stale revision", err, port.ErrPreconditionFailed)
		_, err = e.transition(e.editor, a.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) { c.ExpectedRevision = 0 })
		mustIs(t, "missing revision", err, port.ErrPreconditionRequired)
		_, err = e.transition(e.editor, a.ID, "CANCELLED", func(c *port.TransitionExecutionCmd) { c.Reason = "scope" })
		mustIs(t, "editor cannot cancel", err, port.ErrForbidden)
		_, err = e.transition(e.viewer, a.ID, "COMPLETED", nil)
		mustIs(t, "viewer", err, port.ErrForbidden)
		_, err = e.transition(e.editor, r.ID, "IN_PROGRESS", func(c *port.TransitionExecutionCmd) { c.Reason = "reopen" })
		mustIs(t, "editor cannot reopen", err, port.ErrForbidden)
		_, err = e.transition(e.owner, a.ID, "CANCELLED", nil)
		mustCode(t, "cancel needs a reason", err, "reason-required")

		// OWNER cancel, then reopen with a reason: verification resets and a new proof epoch opens.
		e.mustTransition(e.owner, a.ID, "CANCELLED", func(c *port.TransitionExecutionCmd) { c.Reason = "scope change" })
		reopened := e.mustTransition(e.owner, r.ID, "IN_PROGRESS", func(c *port.TransitionExecutionCmd) { c.Reason = "defect found" })
		if reopened.Item.Execution != matter.ExecutionInProgress || reopened.Item.CompletedAt != nil || reopened.Item.ProofEpoch != 1 || reopened.Item.Verification != matter.VerificationUnverified {
			t.Fatalf("reopen: %+v", reopened.Item)
		}
	})

	t.Run("dependencies: AND gate, blocked completion, cycles, reblock, cancellation", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		a := e.action(e.owner, "A")
		r := e.requirement("R")
		tgt := e.action(e.owner, "T")
		if _, err := e.addDep(e.editor, a.ID, tgt.ID, "COMPLETION"); err != nil {
			t.Fatal(err)
		}
		d, err := e.addDep(e.editor, r.ID, tgt.ID, "PROOF")
		if err != nil {
			t.Fatal(err)
		}
		if d.View.Item.Dependency != matter.DependencyBlocked || len(d.Upstream) != 2 {
			t.Fatalf("AC-105 setup: %+v", d.View.Item)
		}
		// A completes, R stays unverified: T stays BLOCKED, only the PROOF gate fails.
		e.mustTransition(e.owner, a.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "x", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
		})
		e.mustTransition(e.owner, r.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "x", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
		})
		got := e.detail(tgt.ID)
		if got.View.Item.Dependency != matter.DependencyBlocked || len(got.View.Item.DependencyReasons) != 1 ||
			got.View.Item.DependencyReasons[0].Gate != matter.GateProof || got.View.Item.DependencyReasons[0].Code != matter.ReasonNotVerified {
			t.Fatalf("AC-105: %+v", got.View.Item.DependencyReasons)
		}
		sat := map[matter.NodeID]bool{}
		for _, up := range got.Upstream {
			sat[up.Other.ID] = up.Satisfied
		}
		if !sat[a.ID] || sat[r.ID] {
			t.Fatalf("the completion gate is satisfied and the proof gate is not: %+v", sat)
		}

		// AC-122: completing the blocked target is rejected with the gate reason; nothing changes.
		evBefore, revBefore := len(e.events()), e.rev(tgt.ID)
		_, err = e.transition(e.editor, tgt.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "x", time.Now().Add(-time.Minute).UTC().Format(time.RFC3339)
		})
		mustCode(t, "AC-122", err, "dependency-blocked")
		var rej *matter.RejectedError
		if !errors.As(err, &rej) || len(rej.Gates) != 1 || rej.Gates[0].Source != r.ID {
			t.Fatalf("the rejection explains the failed gate: %+v", rej)
		}
		if e.rev(tgt.ID) != revBefore || len(e.events()) != evBefore {
			t.Fatal("a rejected command leaves no mutation and no success event")
		}

		// AC-123: verification of the upstream unlocks the target once the graph is re-evaluated.
		e.verify(r.ID) // the acceptance itself unlocks the target in the same transaction
		unlocked := e.detail(tgt.ID)
		if unlocked.View.Item.Dependency != matter.DependencyReady || unlocked.View.Item.Execution != matter.ExecutionNotStarted {
			t.Fatalf("AC-123: %+v", unlocked.View.Item)
		}
		changes := 0
		for _, ev := range e.events() {
			if ev.Type == "work.dependency_changed" && ev.TargetID == tgt.ID.String() {
				changes++
			}
		}
		if changes != 2 { // BLOCKED at the first edge, READY now
			t.Fatalf("causal history of the derived changes: %d", changes)
		}
		before := len(e.events())
		if err := e.work.Reevaluate(e.ctx, e.editor.String(), e.m.String()); err != nil || len(e.events()) != before {
			t.Fatalf("a refresh that changes nothing writes nothing: %v", err)
		}

		// AC-124: reopening R re-blocks T (and what depends on T) without erasing completions.
		t2 := e.mustTransition(e.owner, tgt.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "x", time.Now().Add(-time.Minute).UTC().Format(time.RFC3339)
		})
		down := e.action(e.owner, "Downstream")
		if _, err := e.addDep(e.editor, tgt.ID, down.ID, "COMPLETION"); err != nil {
			t.Fatal(err)
		}
		if e.detail(down.ID).View.Item.Dependency != matter.DependencyReady {
			t.Fatal("downstream starts READY")
		}
		e.mustTransition(e.owner, r.ID, "IN_PROGRESS", func(c *port.TransitionExecutionCmd) { c.Reason = "defect" })
		if e.detail(tgt.ID).View.Item.Dependency != matter.DependencyBlocked || e.detail(down.ID).View.Item.Dependency != matter.DependencyBlocked {
			t.Fatal("AC-124: reachable work is re-blocked")
		}
		if got := e.detail(tgt.ID).View.Item; got.Execution != matter.ExecutionCompleted || got.CompletedAt == nil || !got.CompletedAt.Equal(*t2.Item.CompletedAt) {
			t.Fatalf("a completed target stays completed (COMPLETED+BLOCKED): %+v", got)
		}
		var causal bool
		for _, ev := range e.events() {
			if ev.Type == "work.dependency_changed" && ev.TargetID == down.ID.String() && ev.CauseSeq != nil {
				causal = true
			}
		}
		if !causal {
			t.Fatal("derived changes reference the event that caused them")
		}
		_, err = e.transition(e.editor, tgt.ID, "IN_PROGRESS", nil)
		mustIs(t, "a terminal item moves only by an OWNER reopen", err, port.ErrForbidden)

		// AC-146: cancelling an upstream never satisfies a prerequisite.
		up, dn := e.action(e.owner, "Up"), e.action(e.owner, "Down")
		if _, err := e.addDep(e.editor, up.ID, dn.ID, "COMPLETION"); err != nil {
			t.Fatal(err)
		}
		e.mustTransition(e.owner, up.ID, "CANCELLED", func(c *port.TransitionExecutionCmd) { c.Reason = "scope" })
		if got := e.detail(dn.ID).View.Item; got.Dependency != matter.DependencyBlocked || got.DependencyReasons[0].Code != matter.ReasonCancelled {
			t.Fatalf("AC-146: %+v", got)
		}
		_, err = e.transition(e.owner, up.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) { c.Reason = "waive" })
		mustCode(t, "waiver by relabeling", err, "transition-not-allowed")
	})

	t.Run("dependencies: cycle, self, duplicate, cross-matter, reason and revision guards", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		a, b, c := e.action(e.owner, "A"), e.action(e.owner, "B"), e.action(e.owner, "C")
		for _, p := range [][2]matter.NodeID{{a.ID, b.ID}, {b.ID, c.ID}} {
			if _, err := e.addDep(e.editor, p[0], p[1], "COMPLETION"); err != nil {
				t.Fatal(err)
			}
		}
		graphBefore := fmt.Sprint(len(e.detail(a.ID).Downstream), len(e.detail(c.ID).Upstream), len(e.events()))
		_, err := e.addDep(e.editor, c.ID, a.ID, "COMPLETION")
		mustCode(t, "cycle", err, "cycle")
		var rej *matter.RejectedError
		if errors.As(err, &rej) && len(rej.Path) != 3 {
			t.Fatalf("the cycle is explained by its path: %v", rej.Path)
		}
		_, err = e.addDep(e.editor, a.ID, a.ID, "PROOF")
		mustCode(t, "self", err, "self-edge")
		_, err = e.addDep(e.editor, a.ID, b.ID, "PROOF")
		mustCode(t, "duplicate", err, "duplicate-edge")
		_, err = e.work.AddDependency(e.ctx, port.AddDependencyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), SourceID: "0192b1c4-0000-7000-8000-000000000bbb", TargetID: a.ID.String(), Gate: "COMPLETION", Reason: "x", ExpectedTargetRevision: e.rev(a.ID)})
		mustCode(t, "cross-matter / unknown source", err, "cross-matter")
		_, err = e.work.AddDependency(e.ctx, port.AddDependencyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), SourceID: a.ID.String(), TargetID: c.ID.String(), Gate: "COMPLETION", ExpectedTargetRevision: e.rev(c.ID)})
		mustCode(t, "reason required", err, "reason-required")
		_, err = e.work.AddDependency(e.ctx, port.AddDependencyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), SourceID: a.ID.String(), TargetID: c.ID.String(), Gate: "COMPLETION", Reason: "x", ExpectedTargetRevision: 99})
		mustIs(t, "stale target revision", err, port.ErrPreconditionFailed)
		_, err = e.work.AddDependency(e.ctx, port.AddDependencyCmd{ActorID: e.viewer.String(), MatterID: e.m.String(), SourceID: a.ID.String(), TargetID: c.ID.String(), Gate: "COMPLETION", Reason: "x", ExpectedTargetRevision: e.rev(c.ID)})
		mustIs(t, "viewer", err, port.ErrForbidden)
		if got := fmt.Sprint(len(e.detail(a.ID).Downstream), len(e.detail(c.ID).Upstream), len(e.events())); got != graphBefore {
			t.Fatalf("every refusal left the graph and history unchanged: %s vs %s", got, graphBefore)
		}

		// Removal needs an explicit scope-change reason and never relabels anything satisfied.
		edgeID := e.detail(b.ID).Upstream[0].Edge.ID
		_, err = e.work.RemoveDependency(e.ctx, port.RemoveDependencyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), EdgeID: edgeID, ExpectedTargetRevision: e.rev(b.ID)})
		mustCode(t, "removal reason", err, "reason-required")
		d, err := e.work.RemoveDependency(e.ctx, port.RemoveDependencyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), EdgeID: edgeID, Reason: "scope reduced", ExpectedTargetRevision: e.rev(b.ID)})
		if err != nil || len(d.Upstream) != 0 || d.View.Item.Dependency != matter.DependencyReady {
			t.Fatalf("removal recomputes the target: %+v %v", d.View.Item, err)
		}
		var removed bool
		for _, ev := range e.events() {
			removed = removed || (ev.Type == "dependency.removed" && ev.Reason != nil && *ev.Reason == "scope reduced")
		}
		if !removed {
			t.Fatal("the removal is audited with its reason")
		}
	})

	t.Run("milestones: readiness, critical chain attention, OWNER-only settings", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		r1, r2 := e.requirement("R1"), e.requirement("R2")
		upstream := e.action(e.owner, "Prepare")
		if _, err := e.addDep(e.editor, upstream.ID, r2.ID, "COMPLETION"); err != nil {
			t.Fatal(err)
		}
		_, err := e.work.CreateMilestone(e.ctx, port.CreateMilestoneCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Name: "Signing"})
		mustIs(t, "editor cannot create milestones", err, port.ErrForbidden)
		ms, err := e.work.CreateMilestone(e.ctx, port.CreateMilestoneCmd{ActorID: e.owner.String(), MatterID: e.m.String(), Name: "Signing", Due: "2026-07-01T00:00:00+07:00"})
		if err != nil {
			t.Fatal(err)
		}
		if ms.Status.State != matter.MilestoneUnassessed {
			t.Fatalf("no prerequisites is unassessed, never ready: %+v", ms.Status)
		}
		set := func(actor matter.ActorID, rev int64, reason string, critical bool, ids ...matter.NodeID) (matter.MilestoneView, error) {
			var s []string
			for _, id := range ids {
				s = append(s, id.String())
			}
			return e.work.SetMilestonePrerequisites(e.ctx, port.SetMilestonePrerequisitesCmd{ActorID: actor.String(), MatterID: e.m.String(), MilestoneID: ms.Milestone.ID.String(), ExpectedRevision: rev, Prerequisites: s, Critical: critical, Reason: reason})
		}
		_, err = set(e.editor, 1, "x", false, r1.ID)
		mustIs(t, "editor", err, port.ErrForbidden)
		_, err = set(e.owner, 1, "", false, r1.ID)
		mustCode(t, "reason required", err, "reason-required")
		_, err = set(e.owner, 1, "x", false, upstream.ID)
		mustCode(t, "an Action is not a milestone prerequisite", err, "prerequisite-not-requirement")
		_, err = set(e.owner, 9, "x", false, r1.ID)
		mustIs(t, "stale", err, port.ErrPreconditionFailed)
		v, err := set(e.owner, 1, "agreed with partner", false, r1.ID, r2.ID)
		if err != nil || v.Milestone.Revision != 2 || v.Status.State != matter.MilestoneNotReady || v.Status.Total != 2 || v.Status.Satisfied != 0 {
			t.Fatalf("%+v %v", v, err)
		}
		// AC-102: R1 completed+verified, R2 completed but unverified: 1/2, with R2's proof reason.
		done := func(id matter.NodeID) {
			e.mustTransition(e.owner, id, "COMPLETED", func(c *port.TransitionExecutionCmd) {
				c.Reason, c.CompletedAt = "x", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
			})
		}
		done(r1.ID)
		e.verify(r1.ID)
		done(upstream.ID)
		done(r2.ID)
		list, err := e.work.ListMilestones(e.ctx, port.MatterListQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
		if err != nil || len(list) != 1 {
			t.Fatalf("%+v %v", list, err)
		}
		st := list[0].Status
		if st.State != matter.MilestoneNotReady || st.Satisfied != 1 || st.Total != 2 || st.Unsatisfied[0].ItemID != r2.ID || st.Unsatisfied[0].Reasons[0] != matter.MSProofNotVerified {
			t.Fatalf("AC-102: %+v", st)
		}

		// AC-143: a critical milestone makes its unsatisfied chain CRITICAL, with reasons.
		if _, err := set(e.owner, 2, "this gates closing", true, r1.ID, r2.ID); err != nil {
			t.Fatal(err)
		}
		crit := e.detail(r2.ID).View
		if !crit.CriticalChain || crit.Attention.State != matter.AttentionCritical || crit.Attention.Reasons[0] != matter.AttnCriticalChain {
			t.Fatalf("AC-143: %+v", crit)
		}
		if e.detail(r1.ID).View.CriticalChain {
			t.Fatal("a satisfied prerequisite is off the critical chain")
		}
		if _, err := set(e.owner, 3, "no longer critical", false, r1.ID, r2.ID); err != nil {
			t.Fatal(err)
		}
		if got := e.detail(r2.ID).View.Attention; got.State != matter.AttentionAttention {
			t.Fatalf("ATTENTION remains after the critical cause is removed (completed but unverified): %+v", got)
		}
	})

	t.Run("escalation: OWNER only, CRITICAL with reason, cleared with a reason-less call", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		a := e.action(e.owner, "Call regulator")
		_, err := e.work.Escalate(e.ctx, port.EscalateCmd{ActorID: e.editor.String(), MatterID: e.m.String(), ItemID: a.ID.String(), ExpectedRevision: 1, Reason: "urgent"})
		mustIs(t, "editor", err, port.ErrForbidden)
		v, err := e.work.Escalate(e.ctx, port.EscalateCmd{ActorID: e.owner.String(), MatterID: e.m.String(), ItemID: a.ID.String(), ExpectedRevision: 1, Reason: "regulator deadline"})
		if err != nil || v.Attention.State != matter.AttentionCritical || v.Attention.Reasons[0] != matter.AttnEscalated || v.Item.Revision != 2 {
			t.Fatalf("%+v %v", v, err)
		}
		cleared, err := e.work.Escalate(e.ctx, port.EscalateCmd{ActorID: e.owner.String(), MatterID: e.m.String(), ItemID: a.ID.String(), ExpectedRevision: 2})
		if err != nil || cleared.Attention.State != matter.AttentionNormal {
			t.Fatalf("%+v %v", cleared, err)
		}
	})

	t.Run("parties: context only, CAS, history; waiting references a party", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		membersBefore := e.b.World.Counts().MatterMembers
		p, err := e.work.CreateParty(e.ctx, port.CreatePartyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Name: "Authority", Kind: "AUTHORITY", Contact: "desk@authority.test"})
		if err != nil {
			t.Fatal(err)
		}
		_, err = e.work.CreateParty(e.ctx, port.CreatePartyCmd{ActorID: e.viewer.String(), MatterID: e.m.String(), Name: "x"})
		mustIs(t, "viewer", err, port.ErrForbidden)
		_, err = e.work.UpdateParty(e.ctx, port.UpdatePartyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), PartyID: p.ID.String(), ExpectedRevision: 9, Contact: ptrString("new")})
		mustIs(t, "stale", err, port.ErrPreconditionFailed)
		up, err := e.work.UpdateParty(e.ctx, port.UpdatePartyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), PartyID: p.ID.String(), ExpectedRevision: 1, Contact: ptrString("registry@authority.test")})
		if err != nil || up.Revision != 2 || up.Contact != "registry@authority.test" {
			t.Fatalf("%+v %v", up, err)
		}
		list, err := e.work.ListParties(e.ctx, port.MatterListQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
		if err != nil || len(list) != 1 || list[0].Contact != "registry@authority.test" {
			t.Fatalf("%+v %v", list, err)
		}
		if _, err := e.work.ListParties(e.ctx, port.MatterListQuery{ActorID: e.out.String(), MatterID: e.m.String()}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("outsiders see nothing: %v", err)
		}
		if e.b.World.Counts().MatterMembers != membersBefore {
			t.Fatal("a party never gets an account or a role")
		}
		var updated bool
		for _, ev := range e.events() {
			updated = updated || (ev.Type == "party.updated" && ev.TargetID == p.ID.String() && len(ev.Before) > 0)
		}
		if !updated {
			t.Fatal("party changes are in history")
		}
	})

	t.Run("grid: filters, derived timing/attention, sorting, paging without gaps, scoping", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		now := time.Now().UTC()
		mk := func(title string, mut func(*port.UpdateWorkItemCmd)) matter.WorkItem {
			a := e.action(e.owner, title)
			if mut != nil {
				c := port.UpdateWorkItemCmd{ActorID: e.owner.String(), MatterID: e.m.String(), ItemID: a.ID.String(), ExpectedRevision: 1}
				mut(&c)
				if _, err := e.work.UpdateWorkItem(e.ctx, c); err != nil {
					t.Fatal(err)
				}
			}
			return a
		}
		due := func(d time.Duration) port.OptString {
			return port.OptString{Set: true, Value: now.Add(d).Format(time.RFC3339)}
		}
		overdue := mk("Overdue filing", func(c *port.UpdateWorkItemCmd) { c.Due = due(-time.Hour) })
		soon := mk("Due soon call", func(c *port.UpdateWorkItemCmd) { c.Due = due(24 * time.Hour) })
		later := mk("Later task", func(c *port.UpdateWorkItemCmd) { c.Due = due(30 * 24 * time.Hour) })
		undated := mk("Undated", nil)
		owned := mk("Owned by editor", func(c *port.UpdateWorkItemCmd) { c.Owner = port.OptString{Set: true, Value: e.editor.String()} })
		for i := 0; i < 55; i++ {
			e.action(e.owner, fmt.Sprintf("Bulk %02d", i))
		}
		list := func(f port.WorkFilter, sort string, desc bool, limit, offset int) matter.WorkItemPage {
			p, err := e.work.ListWorkItems(e.ctx, port.ListWorkItemsQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), Filter: f, Sort: sort, Desc: desc, Limit: limit, Offset: offset})
			if err != nil {
				t.Fatal(err)
			}
			return p
		}
		ids := func(p matter.WorkItemPage) []matter.NodeID {
			var out []matter.NodeID
			for _, v := range p.Items {
				out = append(out, v.Item.ID)
			}
			return out
		}
		if p := list(port.WorkFilter{Timing: "OVERDUE"}, "", false, 0, 0); len(p.Items) != 1 || p.Items[0].Item.ID != overdue.ID || p.Items[0].Attention.State != matter.AttentionAttention || p.AsOf.IsZero() {
			t.Fatalf("overdue: %+v", p.Items)
		}
		if p := list(port.WorkFilter{Timing: "DUE_SOON"}, "", false, 0, 0); len(p.Items) != 1 || p.Items[0].Item.ID != soon.ID {
			t.Fatalf("due soon: %+v", p.Items)
		}
		if p := list(port.WorkFilter{Owner: e.editor.String()}, "", false, 0, 0); len(p.Items) != 1 || p.Items[0].Item.ID != owned.ID {
			t.Fatalf("owner: %+v", p.Items)
		}
		if p := list(port.WorkFilter{Owner: "none"}, "", false, 0, 0); p.Total != 5+55-1 {
			t.Fatalf("unassigned: %d", p.Total)
		}
		if p := list(port.WorkFilter{Text: "FILING"}, "", false, 0, 0); len(p.Items) != 1 || p.Items[0].Item.ID != overdue.ID {
			t.Fatalf("text: %+v", p.Items)
		}
		if p := list(port.WorkFilter{Kind: "REQUIREMENT"}, "", false, 0, 0); p.Total != 0 {
			t.Fatalf("kind: %d", p.Total)
		}
		byDue := ids(list(port.WorkFilter{Text: "task"}, "due", false, 0, 0))
		if len(byDue) != 1 || byDue[0] != later.ID {
			t.Fatalf("%v", byDue)
		}
		order := ids(list(port.WorkFilter{}, "due", false, 4, 0))
		if order[0] != overdue.ID || order[1] != soon.ID || order[2] != later.ID {
			t.Fatalf("due ascending with no due last: %v", order)
		}
		desc := list(port.WorkFilter{}, "title", true, 1, 0)
		if desc.Items[0].Item.Title != "Undated" && !strings.HasPrefix(desc.Items[0].Item.Title, "Overdue") {
			t.Fatalf("title descending: %+v", desc.Items[0].Item.Title)
		}
		// Paging walks all 60 rows exactly once.
		seen := map[matter.NodeID]bool{}
		offset := 0
		for pages := 0; ; pages++ {
			p := list(port.WorkFilter{}, "title", false, 25, offset)
			if p.Total != 60 {
				t.Fatalf("total %d", p.Total)
			}
			for _, v := range p.Items {
				if seen[v.Item.ID] {
					t.Fatalf("duplicate row %s", v.Item.ID)
				}
				seen[v.Item.ID] = true
			}
			if p.NextOffset == nil {
				break
			}
			offset = *p.NextOffset
			if pages > 5 {
				t.Fatal("paging does not terminate")
			}
		}
		if len(seen) != 60 || !seen[undated.ID] {
			t.Fatalf("rows seen: %d", len(seen))
		}
		if _, err := e.work.ListWorkItems(e.ctx, port.ListWorkItemsQuery{ActorID: e.out.String(), MatterID: e.m.String()}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("an outsider learns nothing, not even a count: %v", err)
		}
	})

	t.Run("my actions: only the caller's own work in readable matters, sections, deterministic order", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		now := time.Now().UTC()
		own := func(a matter.WorkItem, user matter.ActorID, due time.Duration) {
			c := port.UpdateWorkItemCmd{ActorID: e.owner.String(), MatterID: e.m.String(), ItemID: a.ID.String(), ExpectedRevision: e.rev(a.ID), Owner: port.OptString{Set: true, Value: user.String()}}
			if due != 0 {
				c.Due = port.OptString{Set: true, Value: now.Add(due).Format(time.RFC3339)}
			}
			if _, err := e.work.UpdateWorkItem(e.ctx, c); err != nil {
				t.Fatal(err)
			}
		}
		k1, k2, k3 := e.action(e.owner, "K1"), e.action(e.owner, "K2"), e.action(e.owner, "K3")
		n1, n2, n3 := e.action(e.owner, "N1"), e.action(e.owner, "N2"), e.action(e.owner, "N3")
		blocked, waiting := e.action(e.owner, "B"), e.action(e.owner, "W")
		req := e.requirement("Assigned requirement")
		for _, a := range []struct {
			it  matter.WorkItem
			due time.Duration
		}{{k1, 24 * time.Hour}, {k2, 24 * time.Hour}, {k3, 0}, {n1, time.Hour}, {n2, time.Hour}, {n3, 0}, {blocked, 0}, {waiting, 0}} {
			own(a.it, e.editor, a.due)
		}
		own(req, e.editor, 0)
		// K1..K3 are the unsatisfied chain of a critical milestone (via an intermediate requirement).
		crit := e.requirement("Critical requirement")
		for _, k := range []matter.WorkItem{k1, k2, k3} {
			if _, err := e.addDep(e.owner, k.ID, crit.ID, "COMPLETION"); err != nil {
				t.Fatal(err)
			}
		}
		// the K actions are upstream of the critical requirement; K itself must stay READY
		ms, err := e.work.CreateMilestone(e.ctx, port.CreateMilestoneCmd{ActorID: e.owner.String(), MatterID: e.m.String(), Name: "Closing", Critical: true})
		if err != nil {
			t.Fatal(err)
		}
		if _, err := e.work.SetMilestonePrerequisites(e.ctx, port.SetMilestonePrerequisitesCmd{ActorID: e.owner.String(), MatterID: e.m.String(), MilestoneID: ms.Milestone.ID.String(), ExpectedRevision: 1, Prerequisites: []string{crit.ID.String()}, Critical: true, Reason: "closing gate"}); err != nil {
			t.Fatal(err)
		}
		gate := e.action(e.owner, "Gate")
		if _, err := e.addDep(e.owner, gate.ID, blocked.ID, "COMPLETION"); err != nil {
			t.Fatal(err)
		}
		party, _ := e.work.CreateParty(e.ctx, port.CreatePartyCmd{ActorID: e.owner.String(), MatterID: e.m.String(), Name: "Counterparty"})
		e.mustTransition(e.editor, waiting.ID, "WAITING", func(c *port.TransitionExecutionCmd) {
			c.WaitingPartyID, c.WaitingCondition = party.ID.String(), "reply"
		})

		got, err := e.work.MyActions(e.ctx, port.MyActionsQuery{ActorID: e.editor.String()})
		if err != nil {
			t.Fatal(err)
		}
		var order []string
		for _, a := range got.Next {
			order = append(order, a.View.Item.Title)
		}
		if strings.Join(order, ",") != "K1,K2,K3,N1,N2,N3" {
			t.Fatalf("AC-103 order: %v", order)
		}
		if len(got.Blocked) != 2 || len(got.Waiting) != 1 || got.Waiting[0].WaitingOn != "Counterparty" {
			t.Fatalf("sections: blocked=%d waiting=%d %+v", len(got.Blocked), len(got.Waiting), got.Waiting)
		}
		for _, a := range got.Next {
			if a.Reason == "" || a.View.Item.OwnerActorID == nil || *a.View.Item.OwnerActorID != e.editor || a.Revision == 0 {
				t.Fatalf("each candidate carries owner, reason and its revision: %+v", a)
			}
		}
		// A stale candidate: K1 becomes blocked at a new revision; the old revision is refused.
		k1rev := e.rev(k1.ID)
		if _, err := e.addDep(e.owner, gate.ID, k1.ID, "COMPLETION"); err != nil {
			t.Fatal(err)
		}
		_, err = e.work.TransitionExecution(e.ctx, port.TransitionExecutionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), ItemID: k1.ID.String(), ExpectedRevision: k1rev, To: "IN_PROGRESS"})
		mustIs(t, "AC-103: the stale revision is rejected", err, port.ErrPreconditionFailed)
		refreshed, _ := e.work.MyActions(e.ctx, port.MyActionsQuery{ActorID: e.editor.String()})
		for _, a := range refreshed.Next {
			if a.View.Item.ID == k1.ID {
				t.Fatal("a blocked K1 is excluded after refresh")
			}
		}
		// Scoping: another user sees none of it; the viewer's own list is empty and says so.
		other, err := e.work.MyActions(e.ctx, port.MyActionsQuery{ActorID: e.viewer.String()})
		if err != nil || len(other.Next)+len(other.Blocked)+len(other.Waiting)+len(other.Historical) != 0 {
			t.Fatalf("AC-110/144: nothing assigned means nothing listed: %+v %v", other, err)
		}
		// Losing access hides the matter's work entirely.
		w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
		if err := w1.revokeMatter(e.owner, e.m, e.editor, w1.matterRevision(e.owner, e.wsID, e.m)); err != nil {
			t.Fatal(err)
		}
		gone, err := e.work.MyActions(e.ctx, port.MyActionsQuery{ActorID: e.editor.String()})
		if err != nil || len(gone.Next)+len(gone.Blocked)+len(gone.Waiting)+len(gone.Historical) != 0 {
			t.Fatalf("revoked access leaves no assigned work visible: %+v %v", gone, err)
		}
	})

	t.Run("concurrency: one winner per revision; racing edges cannot both close a cycle", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		a, b := e.action(e.owner, "A"), e.action(e.owner, "B")
		var wg sync.WaitGroup
		start := make(chan struct{})
		errs := make([]error, 2)
		revA, revB := e.rev(a.ID), e.rev(b.ID)
		for i, p := range [][2]matter.NodeID{{a.ID, b.ID}, {b.ID, a.ID}} {
			wg.Go(func() {
				<-start
				rev := revB
				if i == 1 {
					rev = revA
				}
				_, errs[i] = e.work.AddDependency(e.ctx, port.AddDependencyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), SourceID: p[0].String(), TargetID: p[1].String(), Gate: "COMPLETION", Reason: "race", ExpectedTargetRevision: rev})
			})
		}
		close(start)
		wg.Wait()
		wins := 0
		for _, err := range errs {
			if err == nil {
				wins++
			}
		}
		if wins != 1 {
			t.Fatalf("AC-125: exactly one of two opposing edges may commit: %v", errs)
		}

		c := e.action(e.owner, "C")
		rev := e.rev(c.ID)
		results := make([]error, 6)
		start = make(chan struct{})
		for i := range results {
			wg.Go(func() {
				<-start
				_, results[i] = e.work.TransitionExecution(e.ctx, port.TransitionExecutionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), ItemID: c.ID.String(), ExpectedRevision: rev, To: "IN_PROGRESS"})
			})
		}
		close(start)
		wg.Wait()
		wins = 0
		for _, err := range results {
			switch {
			case err == nil:
				wins++
			case errors.Is(err, port.ErrPreconditionFailed):
			default:
				t.Fatalf("AC-139: unexpected outcome %v", err)
			}
		}
		// Same-state arrivals after the winner are NO-OP successes only if the revision matches; the
		// others are stale. Exactly one accepted change, exactly one event.
		var changes int
		for _, ev := range e.events() {
			if ev.Type == "work.execution_changed" && ev.TargetID == c.ID.String() {
				changes++
			}
		}
		if wins != 1 || changes != 1 {
			t.Fatalf("AC-139: wins=%d events=%d", wins, changes)
		}
	})

	t.Run("failure modes: injected step failures roll back; an unknown commit outcome is not a rollback", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		if _, ok := e.b.Store.(interface{ IsMemoryDouble() }); ok {
			a := e.action(e.owner, "A")
			target := e.action(e.owner, "T")
			inj := mustFailInjector(t, e.b.Store)
			for _, step := range []string{"save_work_item", "append_event", "insert_edge"} {
				inj.SetFailAt(step)
				before, rev := len(e.events()), e.rev(target.ID)
				_, err := e.addDep(e.editor, a.ID, target.ID, "COMPLETION")
				inj.SetFailAt("")
				if err == nil {
					t.Fatalf("%s: the injected failure must surface", step)
				}
				if e.rev(target.ID) != rev || len(e.events()) != before || len(e.detail(target.ID).Upstream) != 0 {
					t.Fatalf("%s: a failed command wrote something", step)
				}
			}
		}
		a := e.action(e.owner, "Unknown outcome")
		inj := mustInjector(t, e.b.Store)
		inj.SetCommitUnknown(errors.New("lost acknowledgement"))
		_, err := e.transition(e.editor, a.ID, "IN_PROGRESS", nil)
		inj.SetCommitUnknown(nil)
		mustIs(t, "unknown", err, port.ErrOutcomeUnknown)
		// The effect is durable even though the caller could not know: only a re-read shows it,
		// and a blind resend with the OLD revision is refused instead of applying twice.
		if got := e.detail(a.ID).View.Item; got.Execution != matter.ExecutionInProgress {
			t.Fatalf("the committed change is visible on re-read: %+v", got)
		}
		_, err = e.work.TransitionExecution(e.ctx, port.TransitionExecutionCmd{ActorID: e.editor.String(), MatterID: e.m.String(), ItemID: a.ID.String(), ExpectedRevision: 1, To: "IN_PROGRESS"})
		mustIs(t, "a blind resend cannot double-apply", err, port.ErrPreconditionFailed)
	})
}
