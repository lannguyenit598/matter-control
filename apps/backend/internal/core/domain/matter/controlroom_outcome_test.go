package matter_test

import (
	"testing"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// Z-F-03: Control Room rows state a filing's own outcome axis, apart from the package-driven
// verification aggregate, so a manager never reads VERIFIED without the outcome qualifier.
func TestControlRoomRowsCarryTheOutcomeAxis(t *testing.T) {
	out := purposeCriterion("OUT", matter.PurposeOutcome)
	oev, ok := proof("2", out, u1, u1)
	filing := filingItem(true)
	filing.Execution, filing.Dependency = matter.ExecutionWaiting, matter.DependencyBlocked
	other := act("R", matter.ExecutionWaiting)
	g := matter.WorkGraph{
		Items:    []matter.WorkItem{filing, other},
		Evidence: setOf([]matter.Criterion{out}, []matter.Evidence{oev}, []matter.Claim{ok}, nil),
		Filing:   matter.FilingSet{Filings: []matter.Filing{{ItemID: filing.ID, MatterID: "M1", AuthorityPartyID: "P", Stage: matter.StageRequirement, CurrentCycle: 1}}},
	}
	room := matter.BuildControlRoom(g, now, 1, nil)
	if len(room.Waiting) != 2 {
		t.Fatalf("precondition: both waiting rows present: %+v", room.Waiting)
	}
	for _, w := range room.Waiting {
		if w.Item.ID == filing.ID {
			if w.OutcomeVerification != matter.OutcomePending {
				t.Fatalf("the filing row states its own outcome axis: %+v", w)
			}
		} else if w.OutcomeVerification != "" {
			t.Fatalf("a non-filing row carries no outcome axis: %+v", w)
		}
	}
	if len(room.Blockers) != 1 || room.Blockers[0].View.Item.ID != filing.ID || room.Blockers[0].View.OutcomeVerification != matter.OutcomePending {
		t.Fatalf("the blocker row carries it too: %+v", room.Blockers)
	}
}
