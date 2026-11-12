package service

import (
	"context"
	"fmt"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

const (
	notificationAgendaPage = 100
	notificationReviewPage = 100
)

// Notifications projects authorized current views; persisted keys acknowledge only seen rows.
type Notifications struct {
	w        *WorkService
	evidence port.EvidenceService
	seen     port.NotificationSeenStore
	clock    port.Clock
}

func NewNotificationService(w *WorkService, evidence port.EvidenceService, seen port.NotificationSeenStore, clock port.Clock) *Notifications {
	return &Notifications{w: w, evidence: evidence, seen: seen, clock: clock}
}

func (s *Notifications) derive(ctx context.Context, actor string, now time.Time) ([]matter.Notification, error) {
	until := now
	past, err := s.w.MeAgenda(ctx, port.MeAgendaQuery{ActorID: actor, Until: &until, Limit: notificationAgendaPage})
	if err != nil {
		return nil, err
	}
	soon := now.Add(matter.DueSoonWindow)
	upcoming, err := s.w.MeAgenda(ctx, port.MeAgendaQuery{ActorID: actor, From: &now, Until: &soon, Limit: notificationAgendaPage})
	if err != nil {
		return nil, err
	}
	agenda := append(past.Entries, upcoming.Entries...)
	actions, err := s.w.MyActions(ctx, port.MyActionsQuery{ActorID: actor})
	if err != nil {
		return nil, err
	}
	queue, err := s.evidence.ReviewQueue(ctx, port.ReviewQueueQuery{ActorID: actor, Limit: notificationReviewPage})
	if err != nil {
		return nil, err
	}
	return matter.DeriveNotifications(agenda, actions, queue, now), nil
}

// ListNotifications annotates the returned digest with this user's durable acknowledgement keys.
func (s *Notifications) ListNotifications(ctx context.Context, q port.ListNotificationsQuery) (matter.NotificationPage, error) {
	if _, err := matter.NewActorID(q.ActorID); err != nil {
		return matter.NotificationPage{}, err
	}
	limit := q.Limit
	if limit == 0 {
		limit = matter.MaxNotificationKeys
	}
	if limit < 1 || limit > matter.MaxNotificationKeys {
		return matter.NotificationPage{}, rejected("invalid-limit", "notification limit must be between 1 and 200")
	}
	now := q.Now
	if now.IsZero() {
		now = s.clock.Now().UTC()
	}
	items, err := s.derive(ctx, q.ActorID, now)
	if err != nil {
		return matter.NotificationPage{}, fmt.Errorf("derive notifications: %w", err)
	}
	total := len(items)
	if len(items) > limit {
		items = items[:limit]
	}
	keys := make([]string, 0, len(items))
	for _, n := range items {
		keys = append(keys, n.SeenKey)
	}
	acknowledged, err := s.seen.SeenNotificationKeys(ctx, q.ActorID, keys)
	if err != nil {
		return matter.NotificationPage{}, fmt.Errorf("read notification acknowledgements: %w", err)
	}
	seen := make(map[string]bool, len(acknowledged))
	for _, key := range acknowledged {
		seen[key] = true
	}
	for i := range items {
		items[i].Seen = seen[items[i].SeenKey]
	}
	at, err := s.seen.NotificationSeen(ctx, q.ActorID)
	if err != nil {
		return matter.NotificationPage{}, fmt.Errorf("read notification marker: %w", err)
	}
	return matter.NotificationPage{Items: items, Total: total, SeenAt: at, AsOf: now}, nil
}

// MarkNotificationsSeen intersects the displayed keys with freshly authorized current rows.
func (s *Notifications) MarkNotificationsSeen(ctx context.Context, cmd port.MarkNotificationsSeenCmd) (time.Time, error) {
	if _, err := matter.NewActorID(cmd.ActorID); err != nil {
		return time.Time{}, err
	}
	if err := matter.ValidateNotificationKeys(cmd.Keys); err != nil {
		return time.Time{}, err
	}
	at := cmd.At
	if at.IsZero() {
		at = s.clock.Now().UTC()
	}
	if len(cmd.Keys) == 0 {
		return at, nil
	}
	rows, err := s.derive(ctx, cmd.ActorID, at)
	if err != nil {
		return time.Time{}, fmt.Errorf("authorize notification acknowledgements: %w", err)
	}
	current := make(map[string]bool, len(rows))
	for _, n := range rows {
		current[n.SeenKey] = true
	}
	keys := make([]string, 0, len(cmd.Keys))
	for _, key := range cmd.Keys {
		if current[key] {
			keys = append(keys, key)
		}
	}
	if len(keys) == 0 {
		return at, nil
	}
	if err := s.seen.SetNotificationSeen(ctx, cmd.ActorID, keys, at); err != nil {
		return time.Time{}, fmt.Errorf("acknowledge notifications: %w", err)
	}
	return at, nil
}
