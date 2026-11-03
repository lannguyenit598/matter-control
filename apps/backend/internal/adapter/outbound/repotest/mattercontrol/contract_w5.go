package mattercontrol

// Shared W5 contract: the Control Room read (one consistent snapshot, every section matching the
// underlying authorized records) and Decision/Finding/Risk/Entity context records. It runs
// unchanged against the in-memory double and the PostgreSQL adapter.

import (
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

func (e *w2Env) room() matter.ControlRoom {
	e.t.Helper()
	r, err := e.ctl.ControlRoom(e.ctx, port.ControlRoomQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
	if err != nil {
		e.t.Fatal(err)
	}
	return r
}

func (e *w2Env) newContext(kind, title string, links ...matter.NodeID) matter.CreatedResult {
	e.t.Helper()
	ids := make([]string, len(links))
	for i, l := range links {
		ids[i] = l.String()
	}
	r, err := e.ctl.CreateContextRecord(e.ctx, port.CreateContextRecordCmd{
		ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Kind: kind, Title: title, Links: ids,
	})
	if err != nil {
		e.t.Fatalf("context record: %v", err)
	}
	return r
}

// SuiteW5 runs the W5 contract against any Bundle whose Store supports context records.
func SuiteW5(t *testing.T, newBundle Factory) {
	t.Helper()

	t.Run("context records: receipted, linked, CAS, closing keeps the record (FR-009)", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		r := e.requirement("Obtain clearance")
		cmd := port.CreateContextRecordCmd{ActorID: e.editor.String(), MatterID: e.m.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
			Kind: "DECISION", Title: "  Choose filing route ", Body: "short form or long form", Links: []string{r.ID.String()}}
		first, err := e.ctl.CreateContextRecord(e.ctx, cmd)
		if err != nil || first.Replayed || first.Kind != "CONTEXT_RECORD" {
			t.Fatalf("%+v %v", first, err)
		}
		if again, err := e.ctl.CreateContextRecord(e.ctx, cmd); err != nil || !again.Replayed || again.ID != first.ID {
			t.Fatalf("replay: %+v %v", again, err)
		}
		bad := cmd
		bad.IdempotencyKey = newKey()
		bad.Kind = "NOTE"
		if _, err := e.ctl.CreateContextRecord(e.ctx, bad); err == nil {
			t.Fatal("an unknown kind is a validation error")
		}
		bad.Kind, bad.Links = "RISK", []string{"01a17c8f-15d0-7386-8133-c1625313f6d1"}
		mustCode(t, "link to nothing", errOf(e.ctl.CreateContextRecord(e.ctx, bad)), "unknown-link")
		cmd.IdempotencyKey, cmd.ActorID = newKey(), e.viewer.String()
		mustIs(t, "viewer", errOf(e.ctl.CreateContextRecord(e.ctx, cmd)), port.ErrForbidden)

		list, err := e.ctl.ListContextRecords(e.ctx, port.MatterListQuery{ActorID: e.viewer.String(), MatterID: e.m.String()})
		if err != nil || len(list) != 1 || list[0].Title != "Choose filing route" || list[0].Revision != 1 || len(list[0].Links) != 1 {
			t.Fatalf("%+v %v", list, err)
		}
		_, err = e.ctl.ListContextRecords(e.ctx, port.MatterListQuery{ActorID: e.out.String(), MatterID: e.m.String()})
		mustIs(t, "outsider", err, port.ErrNotFound)

		upd := func(actor matter.ActorID, rev int64, mut func(*port.UpdateContextRecordCmd)) (matter.ContextRecord, error) {
			c := port.UpdateContextRecordCmd{ActorID: actor.String(), MatterID: e.m.String(), RecordID: first.ID, ExpectedRevision: rev}
			mut(&c)
			return e.ctl.UpdateContextRecord(e.ctx, c)
		}
		title := "Choose the filing route"
		_, err = upd(e.editor, 0, func(c *port.UpdateContextRecordCmd) { c.Title = &title })
		mustIs(t, "revision required", err, port.ErrPreconditionRequired)
		_, err = upd(e.editor, 9, func(c *port.UpdateContextRecordCmd) { c.Title = &title })
		mustIs(t, "stale", err, port.ErrPreconditionFailed)
		_, err = upd(e.viewer, 1, func(c *port.UpdateContextRecordCmd) { c.Title = &title })
		mustIs(t, "viewer", err, port.ErrForbidden)
		evBefore := len(e.events())
		same := list[0].Title
		if got, err := upd(e.editor, 1, func(c *port.UpdateContextRecordCmd) { c.Title = &same }); err != nil || got.Revision != 1 || len(e.events()) != evBefore {
			t.Fatalf("an unchanged update is a no-change: %+v %v", got, err)
		}
		got, err := upd(e.editor, 1, func(c *port.UpdateContextRecordCmd) { c.Title = &title })
		if err != nil || got.Title != title || got.Revision != 2 {
			t.Fatalf("%+v %v", got, err)
		}
		mustCode(t, "reason to close", errOf(upd(e.editor, 2, func(c *port.UpdateContextRecordCmd) { c.Close = true })), "reason-required")
		closed, err := upd(e.editor, 2, func(c *port.UpdateContextRecordCmd) { c.Close = true; c.Reason = "decided: short form" })
		if err != nil || closed.Status != matter.ContextClosed || closed.ClosedReason == "" || closed.Revision != 3 {
			t.Fatalf("%+v %v", closed, err)
		}
		if l, _ := e.ctl.ListContextRecords(e.ctx, port.MatterListQuery{ActorID: e.viewer.String(), MatterID: e.m.String()}); len(l) != 1 {
			t.Fatal("a closed record stays visible")
		}
		if rm := e.room(); len(rm.Decisions) != 0 {
			t.Fatalf("a closed decision leaves the Control Room's open decisions: %+v", rm.Decisions)
		}
		if got, err := upd(e.editor, 3, func(c *port.UpdateContextRecordCmd) { c.Reopen = true }); err != nil || got.Status != matter.ContextOpen || got.ClosedReason != "" {
			t.Fatalf("%+v %v", got, err)
		}
		// context never changes the work it concerns
		if it := e.detail(r.ID).View.Item; it.Revision != r.Revision || it.Execution != matter.ExecutionNotStarted {
			t.Fatalf("a context record never changes execution, verification or dependency: %+v", it)
		}
	})

	t.Run("control room: every section matches the records at one boundary (AC-109)", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		party, _ := e.work.CreateParty(e.ctx, port.CreatePartyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Name: "Counterparty counsel"})
		up := e.requirement("Signed share purchase agreement")
		down := e.action(e.editor, "Wire the purchase price")
		done := e.requirement("Board approval")
		idle := e.action(e.editor, "Prepare closing agenda")
		if _, err := e.addDep(e.editor, up.ID, down.ID, "COMPLETION"); err != nil {
			t.Fatal(err)
		}
		e.mustTransition(e.owner, done.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "approved", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
		})
		if _, err := e.work.UpdateWorkItem(e.ctx, port.UpdateWorkItemCmd{ActorID: e.owner.String(), MatterID: e.m.String(), ItemID: up.ID.String(),
			ExpectedRevision: e.rev(up.ID), Owner: port.OptString{Set: true, Value: e.editor.String()}}); err != nil {
			t.Fatal(err)
		}
		e.mustTransition(e.editor, up.ID, "IN_PROGRESS", nil)
		if _, err := e.work.UpdateWorkItem(e.ctx, port.UpdateWorkItemCmd{ActorID: e.owner.String(), MatterID: e.m.String(), ItemID: idle.ID.String(),
			ExpectedRevision: e.rev(idle.ID), Owner: port.OptString{Set: true, Value: e.editor.String()}}); err != nil {
			t.Fatal(err)
		}
		e.mustTransition(e.editor, idle.ID, "WAITING", func(c *port.TransitionExecutionCmd) {
			c.WaitingPartyID, c.WaitingCondition = party.ID.String(), "awaiting comments"
		})
		dec := e.newContext("DECISION", "Should the price be wired before signing?", down.ID, up.ID)
		e.newContext("RISK", "Counterparty may delay signing", up.ID)
		e.newContext("FINDING", "Draft lacks a bring-down clause")
		e.newContext("ENTITY", "Counterparty counsel")
		evBefore, revBefore := len(e.events()), e.rev(up.ID)

		rm := e.room()
		if rm.AsOf.IsZero() || rm.Revision == 0 {
			t.Fatalf("the Control Room states its boundary: %+v", rm)
		}
		if rm.State.Total != 4 || rm.State.Blocked != 1 || rm.State.ByExecution[matter.ExecutionCompleted] != 1 || rm.State.ByExecution[matter.ExecutionWaiting] != 1 {
			t.Fatalf("state: %+v", rm.State)
		}
		// blockers explain why, and name the prerequisite that holds them
		if len(rm.Blockers) != 1 || rm.Blockers[0].View.Item.ID != down.ID || len(rm.Blockers[0].Reasons) != 1 ||
			len(rm.Blockers[0].Upstream) != 1 || rm.Blockers[0].Upstream[0].ID != up.ID {
			t.Fatalf("blockers: %+v", rm.Blockers)
		}
		// the next action is the record that releases the blocker, with its owner and adjacent decision
		if len(rm.NextActions) != 1 || rm.NextActions[0].View.Item.ID != up.ID || len(rm.NextActions[0].Unblocks) != 1 || rm.NextActions[0].Unblocks[0] != down.ID {
			t.Fatalf("next actions: %+v", rm.NextActions)
		}
		na := rm.NextActions[0]
		if na.View.Item.OwnerActorID == nil || *na.View.Item.OwnerActorID != e.editor || len(na.Decisions) != 1 || na.Decisions[0].ID != dec.ID {
			t.Fatalf("owner and adjacent decision: %+v", na)
		}
		if len(rm.Waiting) != 1 || rm.Waiting[0].Item.ID != idle.ID || rm.Waiting[0].Item.WaitingPartyID == nil || *rm.Waiting[0].Item.WaitingPartyID != party.ID {
			t.Fatalf("waiting: %+v", rm.Waiting)
		}
		if len(rm.Decisions) != 1 || len(rm.Risks) != 1 || len(rm.Findings) != 1 {
			t.Fatalf("context: %d decisions %d risks %d findings", len(rm.Decisions), len(rm.Risks), len(rm.Findings))
		}
		// gaps: the completed Requirement has no criteria and is unverified; open Requirement has none either
		kinds := map[matter.GapKind]map[matter.NodeID]bool{}
		for _, g := range rm.Gaps {
			if kinds[g.Kind] == nil {
				kinds[g.Kind] = map[matter.NodeID]bool{}
			}
			kinds[g.Kind][g.ItemID] = true
		}
		if !kinds[matter.GapCompletedUnverified][done.ID] || !kinds[matter.GapNoCriteria][up.ID] || !kinds[matter.GapNoOwner][down.ID] || kinds[matter.GapNoOwner][up.ID] {
			t.Fatalf("gaps: %+v", rm.Gaps)
		}
		if len(rm.Changes) == 0 || rm.Changes[0].Seq < rm.Changes[len(rm.Changes)-1].Seq {
			t.Fatalf("changes are newest first: %d", len(rm.Changes))
		}
		// reading mutates nothing
		if len(e.events()) != evBefore || e.rev(up.ID) != revBefore {
			t.Fatal("the Control Room is a read: no event and no revision")
		}
		// authorization: an outsider learns nothing
		_, err := e.ctl.ControlRoom(e.ctx, port.ControlRoomQuery{ActorID: e.out.String(), MatterID: e.m.String()})
		mustIs(t, "outsider", err, port.ErrNotFound)

		// the room follows the records: completing the prerequisite releases the blocker at once
		e.mustTransition(e.editor, up.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
			c.Reason, c.CompletedAt = "signed", time.Now().Add(-time.Minute).UTC().Format(time.RFC3339)
		})
		rm2 := e.room()
		if rm2.State.Blocked != 0 || len(rm2.Blockers) != 0 || len(rm2.NextActions) != 0 || rm2.Revision <= rm.Revision {
			t.Fatalf("the Control Room follows the records: %+v", rm2)
		}
	})
}
