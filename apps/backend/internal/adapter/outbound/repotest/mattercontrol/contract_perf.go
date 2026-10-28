package mattercontrol

// Workload for the local NFR-006 measurement: a matter of N work items (half Requirements with
// proof, half Actions, a chain of dependencies, some completed, some waiting) and the reads a
// manager actually repeats. The measuring harness lives next to the adapter; this file only builds
// the data through the real services and exposes one closure per read.

import (
	"fmt"
	"testing"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

// PerfRead is one named repeatable read.
type PerfRead struct {
	Name string
	Run  func() error
}

// NewPerfWorkload seeds a matter with `items` work items and returns the reads to time.
func NewPerfWorkload(t *testing.T, newBundle Factory, items int) []PerfRead {
	t.Helper()
	e := newW2Env(t, newBundle)
	e.ensureReviewer()
	party, err := e.work.CreateParty(e.ctx, port.CreatePartyCmd{ActorID: e.editor.String(), MatterID: e.m.String(), Name: "Counterparty", Kind: "ORGANISATION", Contact: "x@example.test"})
	if err != nil {
		t.Fatal(err)
	}
	var prev matter.NodeID
	for i := 0; i < items; i++ {
		var it matter.WorkItem
		if i%2 == 0 {
			it = e.requirement(fmt.Sprintf("Requirement %03d", i))
			if i%10 == 0 {
				e.verify(it.ID)
			}
		} else {
			it = e.action(e.owner, fmt.Sprintf("Action %03d", i))
		}
		if prev != "" && i%3 == 0 {
			if _, err := e.addDep(e.owner, prev, it.ID, "COMPLETION"); err != nil {
				t.Fatal(err)
			}
		}
		switch {
		case i%7 == 0 && it.Kind == matter.NodeAction:
			if _, err := e.work.UpdateWorkItem(e.ctx, port.UpdateWorkItemCmd{ActorID: e.editor.String(), MatterID: e.m.String(), ItemID: it.ID.String(), ExpectedRevision: e.rev(it.ID),
				Owner: port.OptString{Set: true, Value: e.editor.String()}}); err != nil {
				t.Fatal(err)
			}
			if _, err := e.transition(e.editor, it.ID, "WAITING", func(c *port.TransitionExecutionCmd) {
				c.WaitingPartyID, c.WaitingCondition = party.ID.String(), "awaiting reply"
			}); err != nil {
				t.Fatal(err)
			}
		case i%5 == 0:
			if _, err := e.transition(e.editor, it.ID, "COMPLETED", func(c *port.TransitionExecutionCmd) {
				c.Reason, c.CompletedAt = "done", time.Now().Add(-time.Hour).UTC().Format(time.RFC3339)
			}); err != nil {
				// a blocked item cannot complete: that is part of the workload, not a failure
				_ = err
			}
		}
		prev = it.ID
	}
	ctl := e.ctl
	return []PerfRead{
		{"grid page (50 rows)", func() error {
			_, err := e.work.ListWorkItems(e.ctx, port.ListWorkItemsQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), Limit: 50})
			return err
		}},
		{"grid page (200 rows)", func() error {
			_, err := e.work.ListWorkItems(e.ctx, port.ListWorkItemsQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), Limit: 200})
			return err
		}},
		{"control room", func() error {
			_, err := ctl.ControlRoom(e.ctx, port.ControlRoomQuery{ActorID: e.viewer.String(), MatterID: e.m.String(), RecentChanges: 20})
			return err
		}},
		{"my actions", func() error {
			_, err := e.work.MyActions(e.ctx, port.MyActionsQuery{ActorID: e.editor.String()})
			return err
		}},
	}
}
