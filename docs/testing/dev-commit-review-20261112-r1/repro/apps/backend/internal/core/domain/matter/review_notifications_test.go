package matter

import (
	"testing"
	"time"
)

func TestReviewSeenNotificationStaysSeenAfterRefresh(t *testing.T) {
	firstRead := time.Date(2026, 11, 12, 0, 0, 0, 0, time.UTC)
	agenda := []AgendaEntry{{MatterID: MatterID("m1"), Kind: "work", ItemID: "i1", Title: "Synthetic overdue work", DueAt: firstRead.Add(-time.Hour), Timing: string(TimingOverdue)}}
	before := DeriveNotifications(agenda, MyActions{}, ReviewQueue{}, firstRead)
	seenAt := firstRead.Add(time.Second)
	after := DeriveNotifications(agenda, MyActions{}, ReviewQueue{}, seenAt.Add(time.Second))
	if len(before) != 1 || len(after) != 1 || before[0].ID != after[0].ID {
		t.Fatal("fixture must retain the same notification across reads")
	}
	if after[0].CreatedAt.After(seenAt) {
		t.Fatalf("unchanged notification is unread again: id=%s createdAt=%s seenAt=%s", after[0].ID, after[0].CreatedAt.Format(time.RFC3339), seenAt.Format(time.RFC3339))
	}
}

func TestReviewTerminalWorkDoesNotProduceDueSoon(t *testing.T) {
	now := time.Date(2026, 11, 12, 0, 0, 0, 0, time.UTC)
	due := now.Add(time.Hour)
	for _, state := range []ExecutionState{ExecutionCompleted, ExecutionCancelled} {
		t.Run(string(state), func(t *testing.T) {
			work := WorkItem{ID: NodeID("i1"), Execution: state, DueAt: &due}
			agenda := []AgendaEntry{{MatterID: MatterID("m1"), Kind: "work", ItemID: "i1", DueAt: due, Execution: string(state), Timing: string(TimingOf(work, now).State)}}
			if got := DeriveNotifications(agenda, MyActions{}, ReviewQueue{}, now); len(got) != 0 {
				t.Fatalf("terminal work must not need action: state=%s notifications=%+v", state, got)
			}
		})
	}
}
