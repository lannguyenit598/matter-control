package matter

import (
	"reflect"
	"testing"
	"time"
)

// DeriveNotifications is a pure projection: recorded agenda dates become overdue/due-soon rows,
// blocked assignments and pending review offers carry through, and nothing else is invented.
func TestDeriveNotifications(t *testing.T) {
	now := time.Date(2026, 11, 10, 12, 0, 0, 0, time.UTC)
	mid := MatterID("m-1")
	agenda := []AgendaEntry{
		{MatterID: mid, MatterTitle: "Project Atlas", Kind: "work", ItemID: "i1", Title: "Notarize SPA", DueAt: now.Add(-time.Hour), Timing: string(TimingOverdue)},
		{MatterID: mid, MatterTitle: "Project Atlas", Kind: "milestone", ItemID: "ms-1", Title: "Signing meeting", DueAt: now.Add(24 * time.Hour)},
		{MatterID: mid, MatterTitle: "Project Atlas", Kind: "work", ItemID: "i2", Title: "Far future", DueAt: now.Add(72 * time.Hour)},
	}
	actions := MyActions{Blocked: []AssignedView{{
		View: WorkItemView{Item: WorkItem{ID: NodeID("n1"), Title: "Obtain license"}}, MatterID: mid,
	}}}
	queue := ReviewQueue{Items: []PendingAssessment{{
		MatterID: mid, MatterTitle: "Project Atlas", SubjectID: NodeID("n2"), SubjectTitle: "Land certificate proof", ClaimID: ClaimID("c1"),
	}}}
	got := DeriveNotifications(agenda, actions, queue, now)
	kinds := map[NotificationKind]int{}
	for _, n := range got {
		kinds[n.Kind]++
	}
	if kinds[NotificationOverdue] != 1 || kinds[NotificationDueSoon] != 1 || kinds[NotificationBlocked] != 1 || kinds[NotificationReviewPending] != 1 {
		t.Fatalf("kind counts %v, want one of each", kinds)
	}
	for _, n := range got {
		if n.CreatedAt != now {
			t.Fatalf("%s: CreatedAt must be the derivation instant", n.ID)
		}
	}
	// Deterministic identity: the same state derives the same ids.
	again := DeriveNotifications(agenda, actions, queue, now)
	if !reflect.DeepEqual(got, again) {
		t.Fatalf("derivation is not deterministic")
	}
}

func TestDeriveNotificationsEdges(t *testing.T) {
	now := time.Date(2026, 11, 10, 12, 0, 0, 0, time.UTC)
	mid := MatterID("m-1")
	// A milestone is never given a derived timing, so it cannot be overdue even when past.
	pastMilestone := AgendaEntry{MatterID: mid, Kind: "milestone", ItemID: "ms-9", Title: "Old gate", DueAt: now.Add(-48 * time.Hour)}
	// A date exactly at the window edge (48h ahead) stays on the agenda, not a notification.
	edgeWork := AgendaEntry{MatterID: mid, Kind: "work", ItemID: "i9", Title: "Edge", DueAt: now.Add(DueSoonWindow), Timing: string(TimingOnTrack)}
	got := DeriveNotifications([]AgendaEntry{pastMilestone, edgeWork}, MyActions{}, ReviewQueue{}, now)
	if len(got) != 0 {
		t.Fatalf("no rows expected, got %+v", got)
	}
}
