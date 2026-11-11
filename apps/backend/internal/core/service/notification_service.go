package service

// MC-ZCODE-NOTIF-MAILPITCH-20261110: derived notifications. The service composes the caller's
// existing authorized cross-matter reads (agenda, my actions, review queue) and projects them
// through the pure domain derivation. No notification state exists outside the seen watermark,
// so notifications can never disagree with the views they came from.

import (
	"context"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

const (
	// notificationAgendaPage bounds each agenda window read. The agenda orders rows by due
	// instant, so the overdue prefix sits at the front of the past window and a full first page
	// covers it; deeper backlogs are the agenda's job, not a notification storm.
	notificationAgendaPage = 100
	// notificationReviewPage bounds the pending-review read feeding the projection.
	notificationReviewPage = 100
)

// Notifications projects the caller's operational state into in-app notifications.
type Notifications struct {
	w        *WorkService
	evidence port.EvidenceService
	seen     port.NotificationSeenStore
	clock    port.Clock
}

// NewNotificationService builds the projection on the shared spine, the review queue and the
// per-user watermark store. The clock is injected so the derivation instant stays testable.
func NewNotificationService(w *WorkService, evidence port.EvidenceService, seen port.NotificationSeenStore, clock port.Clock) *Notifications {
	return &Notifications{w: w, evidence: evidence, seen: seen, clock: clock}
}

// ListNotifications derives the caller's notifications at one instant. Only the caller's own
// authorized reads are consulted; a user without a seen row simply has nothing seen yet.
func (s *Notifications) ListNotifications(ctx context.Context, q port.ListNotificationsQuery) (matter.NotificationPage, error) {
	now := q.Now
	if now.IsZero() {
		now = s.clock.Now().UTC()
	}
	seenAt, err := s.seen.NotificationSeen(ctx, q.ActorID)
	if err != nil {
		return matter.NotificationPage{}, err
	}
	until := now
	past, err := s.w.MeAgenda(ctx, port.MeAgendaQuery{ActorID: q.ActorID, Until: &until, Limit: notificationAgendaPage})
	if err != nil {
		return matter.NotificationPage{}, err
	}
	soon := now.Add(matter.DueSoonWindow)
	upcoming, err := s.w.MeAgenda(ctx, port.MeAgendaQuery{ActorID: q.ActorID, From: &now, Until: &soon, Limit: notificationAgendaPage})
	if err != nil {
		return matter.NotificationPage{}, err
	}
	agenda := append(append(make([]matter.AgendaEntry, 0, len(past.Entries)+len(upcoming.Entries)), past.Entries...), upcoming.Entries...)
	actions, err := s.w.MyActions(ctx, port.MyActionsQuery{ActorID: q.ActorID})
	if err != nil {
		return matter.NotificationPage{}, err
	}
	queue, err := s.evidence.ReviewQueue(ctx, port.ReviewQueueQuery{ActorID: q.ActorID, Limit: notificationReviewPage})
	if err != nil {
		return matter.NotificationPage{}, err
	}
	return matter.NotificationPage{
		Items:  matter.DeriveNotifications(agenda, actions, queue, now),
		SeenAt: seenAt, AsOf: now,
	}, nil
}

// MarkNotificationsSeen advances the watermark to the command instant; calling it again later
// is harmless by construction.
func (s *Notifications) MarkNotificationsSeen(ctx context.Context, cmd port.MarkNotificationsSeenCmd) (time.Time, error) {
	at := cmd.At
	if at.IsZero() {
		at = s.clock.Now().UTC()
	}
	if err := s.seen.SetNotificationSeen(ctx, cmd.ActorID, at); err != nil {
		return time.Time{}, err
	}
	return at, nil
}
