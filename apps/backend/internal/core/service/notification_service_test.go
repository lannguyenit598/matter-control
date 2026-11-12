package service_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"leonx.me/matter-control/internal/adapter/outbound/system"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

type notificationClock struct{ at time.Time }

func (c *notificationClock) Now() time.Time { return c.at }

type notificationSeenMemory struct {
	keys map[string]map[string]bool
	at   *time.Time
}

func (m *notificationSeenMemory) NotificationSeen(_ context.Context, _ string) (*time.Time, error) {
	return m.at, nil
}
func (m *notificationSeenMemory) SeenNotificationKeys(_ context.Context, user string, keys []string) ([]string, error) {
	var out []string
	for _, k := range keys {
		if m.keys[user][k] {
			out = append(out, k)
		}
	}
	return out, nil
}
func (m *notificationSeenMemory) SetNotificationSeen(_ context.Context, user string, keys []string, at time.Time) error {
	if m.keys[user] == nil {
		m.keys[user] = map[string]bool{}
	}
	for _, k := range keys {
		m.keys[user][k] = true
	}
	if m.at == nil || at.After(*m.at) {
		m.at = &at
	}
	return nil
}

type notificationQueue struct {
	port.EvidenceService
	rows []matter.PendingAssessment
}

func (q *notificationQueue) ReviewQueue(_ context.Context, query port.ReviewQueueQuery) (matter.ReviewQueue, error) {
	if query.ActorID != editorID.String() {
		return matter.ReviewQueue{}, nil
	}
	return matter.ReviewQueue{Items: q.rows}, nil
}

func TestNotificationsReadMarkRead(t *testing.T) {
	ctx := context.Background()
	fixture := newMatterSUT(t)
	work := service.NewWorkService(fixture.store, system.RecordIDv7{}, discardLogger(), matter.KeyAgePolicy{})
	clock := &notificationClock{at: fixtureBase.Add(time.Minute)}
	seen := &notificationSeenMemory{keys: map[string]map[string]bool{}}
	queue := &notificationQueue{rows: []matter.PendingAssessment{{MatterID: matterA, SubjectID: matter.NodeID("review-subject"), ClaimID: matter.ClaimID("claim-1"), SubjectTitle: "Synthetic pending"}}}
	svc := service.NewNotificationService(work, queue, seen, clock)
	create := func(due time.Time) matter.WorkItem {
		t.Helper()
		made, err := work.CreateAction(ctx, port.CreateActionCmd{ActorID: editorID.String(), MatterID: matterA.String(), IdempotencyKey: newKey(), RequestHash: anyHash, Title: "Synthetic work", Outcome: "Done"})
		if err != nil {
			t.Fatal(err)
		}
		updated, err := work.UpdateWorkItem(ctx, port.UpdateWorkItemCmd{ActorID: editorID.String(), MatterID: matterA.String(), ItemID: made.Item.ID.String(), ExpectedRevision: 1, Owner: port.OptString{Set: true, Value: editorID.String()}, Due: port.OptString{Set: true, Value: due.Format(time.RFC3339)}})
		if err != nil {
			t.Fatal(err)
		}
		return updated.Item
	}
	overdue := create(fixtureBase.Add(-time.Hour))
	upcoming := create(fixtureBase.Add(24 * time.Hour))
	_, err := work.AddDependency(ctx, port.AddDependencyCmd{ActorID: editorID.String(), MatterID: matterA.String(), SourceID: overdue.ID.String(), TargetID: upcoming.ID.String(), Gate: "COMPLETION", Reason: "Synthetic dependency", ExpectedTargetRevision: upcoming.Revision})
	if err != nil {
		t.Fatal(err)
	}
	read := func(limit int) matter.NotificationPage {
		t.Helper()
		page, err := svc.ListNotifications(ctx, port.ListNotificationsQuery{ActorID: editorID.String(), Limit: limit})
		if err != nil {
			t.Fatal(err)
		}
		return page
	}
	first := read(200)
	if len(first.Items) != 4 {
		t.Fatalf("want 4 kinds, got %+v", first.Items)
	}
	keys := make([]string, 0, len(first.Items))
	for _, n := range first.Items {
		if n.Seen {
			t.Fatal("new item seen")
		}
		keys = append(keys, n.SeenKey)
	}
	// A new row after reading the batch must remain unread after marking the older batch.
	create(fixtureBase.Add(-2 * time.Hour))
	clock.at = clock.at.Add(time.Minute)
	if _, err := svc.MarkNotificationsSeen(ctx, port.MarkNotificationsSeenCmd{ActorID: editorID.String(), Keys: keys}); err != nil {
		t.Fatal(err)
	}
	clock.at = clock.at.Add(time.Minute)
	after := read(200)
	unread := 0
	for _, n := range after.Items {
		if !n.Seen {
			unread++
		}
	}
	if unread != 1 {
		t.Fatalf("unchanged keys must stay seen, new row unread: %+v", after)
	}
	bounded := read(1)
	if len(bounded.Items) != 1 || bounded.Total != len(after.Items) {
		t.Fatalf("limit/total %+v", bounded)
	}
	// A client cannot acknowledge another user's or an inaccessible/nonexistent key.
	outsiderKey := strings.Repeat("f", 64)
	if _, err := svc.MarkNotificationsSeen(ctx, port.MarkNotificationsSeenCmd{ActorID: outsider.String(), Keys: keys}); err != nil {
		t.Fatal(err)
	}
	if len(seen.keys[outsider.String()]) != 0 {
		t.Fatal("acknowledged unrelated assignment")
	}
	queue.rows = nil
	fixture.world.SetMatterMembership(matterA, editorID, matter.MatterRoleEditor, matter.StatusRevoked)
	before := len(seen.keys[editorID.String()])
	if _, err := svc.MarkNotificationsSeen(ctx, port.MarkNotificationsSeenCmd{ActorID: editorID.String(), Keys: append(keys, outsiderKey)}); err != nil {
		t.Fatal(err)
	}
	if len(seen.keys[editorID.String()]) != before {
		t.Fatal("stored revoked/unknown keys")
	}
	for _, keys := range [][]string{{"bad"}, {strings.Repeat("a", 64), strings.Repeat("a", 64)}, make([]string, 201)} {
		if _, err := svc.MarkNotificationsSeen(ctx, port.MarkNotificationsSeenCmd{ActorID: editorID.String(), Keys: keys}); err == nil {
			t.Fatal("accepted malformed batch")
		}
	}
}
