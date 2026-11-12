package matter

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"sort"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain"
)

// In-app notifications (MC-ZCODE-NOTIF-MAILPITCH-20261110): every notification is a
// deterministic projection of a read model the caller is already authorized to see at the read
// instant (My Agenda, My Actions, review queue). Nothing derived is stored, so nothing can go
// stale, leak across tenancy or contradict the views it came from. A notification never
// invents a deadline or a fact; it points at records that already exist.

// NotificationKind enumerates the derived notification kinds.
type NotificationKind string

const (
	// NotificationOverdue: a recorded due date on an accessible matter is past due. Only work
	// rows carry a derived timing, so only work rows can be overdue.
	NotificationOverdue NotificationKind = "OVERDUE"
	// NotificationDueSoon: a recorded due date falls inside the due-soon window. Milestones are
	// included: their date is recorded, even though a milestone is never given a timing.
	NotificationDueSoon NotificationKind = "DUE_SOON"
	// NotificationBlocked: one of the caller's assigned records is currently BLOCKED.
	NotificationBlocked NotificationKind = "BLOCKED"
	// NotificationReviewPending: a proof claim waits for the caller as the designated verifier.
	NotificationReviewPending NotificationKind = "REVIEW_PENDING"
)

// DueSoonWindow bounds the DUE_SOON projection: recorded dates further out stay on the agenda,
// which is the calendar view of record. Due-soon is a reminder, not a new state.
const DueSoonWindow = 48 * time.Hour

// Notification is one derived row produced at a single read instant. ID is deterministic
// (kind + matter + subject record) so the same state always yields the same identity; whether a
// row counts as unread is decided by its stable acknowledgement key, not read-time metadata.
type Notification struct {
	SeenKey     string
	Seen        bool
	ID          string
	Kind        NotificationKind
	MatterID    *MatterID
	MatterTitle string
	// ItemID is the subject record to navigate to (work item, milestone or filing subject);
	// empty when the source view carries none.
	ItemID string
	Title  string
	DueAt  *time.Time
	// CreatedAt is the derivation instant, never a domain event time.
	CreatedAt time.Time
}

// NotificationPage is one derivation of the caller's notifications with the seen watermark
// the caller last recorded.
type NotificationPage struct {
	Total  int
	Items  []Notification
	SeenAt *time.Time
	AsOf   time.Time
}

// DeriveNotifications projects the caller's cross-matter read models into notifications at one
// instant: overdue and due-soon rows only from recorded agenda dates, blocked rows only from the
// caller's blocked assignments, review rows only from pending offers in the caller's review
// queue. Rows are ordered deterministically (kind, matter, id) so repeated derivations of the
// same state are identical.
func DeriveNotifications(agenda []AgendaEntry, actions MyActions, queue ReviewQueue, now time.Time) []Notification {
	out := make([]Notification, 0, 8)
	for _, e := range agenda {
		if e.Kind == agendaKindWork && (WorkItem{Execution: ExecutionState(e.Execution)}).Terminal() {
			continue
		}
		due := e.DueAt
		switch {
		case e.Kind == agendaKindWork && e.Timing == string(TimingOverdue):
			out = append(out, notificationFromAgenda(NotificationOverdue, e, due, now))
		case due.After(now) && due.Before(now.Add(DueSoonWindow)):
			out = append(out, notificationFromAgenda(NotificationDueSoon, e, due, now))
		}
	}
	for _, a := range actions.Blocked {
		mid := a.MatterID
		out = append(out, Notification{
			ID:   notificationID(string(NotificationBlocked), a.MatterID.String(), a.View.Item.ID.String()),
			Kind: NotificationBlocked, MatterID: &mid, ItemID: a.View.Item.ID.String(),
			Title: a.View.Item.Title, DueAt: a.View.Item.DueAt, CreatedAt: now,
		})
	}
	for _, p := range queue.Items {
		mid := p.MatterID
		out = append(out, Notification{
			ID:   notificationID(string(NotificationReviewPending), p.MatterID.String(), p.ClaimID.String()),
			Kind: NotificationReviewPending, MatterID: &mid, MatterTitle: p.MatterTitle,
			ItemID: p.SubjectID.String(), Title: p.SubjectTitle, CreatedAt: now,
		})
	}
	sort.Slice(out, func(i, j int) bool {
		a, b := out[i], out[j]
		if a.Kind != b.Kind {
			return a.Kind < b.Kind
		}
		am, bm := "", ""
		if a.MatterID != nil {
			am = a.MatterID.String()
		}
		if b.MatterID != nil {
			bm = b.MatterID.String()
		}
		if am != bm {
			return am < bm
		}
		return a.ID < b.ID
	})
	for i := range out {
		out[i].SeenKey = NotificationSeenKey(out[i])
	}
	return out
}

// agendaKindWork mirrors the work-row literal of the agenda projection; milestone rows carry
// readiness instead of a derived timing.
const agendaKindWork = "work"

func notificationFromAgenda(kind NotificationKind, e AgendaEntry, due time.Time, now time.Time) Notification {
	mid := e.MatterID
	return Notification{
		ID:   notificationID(string(kind), e.MatterID.String(), e.Kind+":"+e.ItemID),
		Kind: kind, MatterID: &mid, MatterTitle: e.MatterTitle, ItemID: e.ItemID,
		Title: e.Title, DueAt: &due, CreatedAt: now,
	}
}

// MaxNotificationKeys bounds one acknowledgement batch and notification digest.
const MaxNotificationKeys = 200

// NotificationSeenKey changes only with the source identity, reminder kind or due instant.
func NotificationSeenKey(n Notification) string {
	due := ""
	if n.DueAt != nil {
		due = n.DueAt.UTC().Format(time.RFC3339Nano)
	}
	encoded, _ := json.Marshal([2]string{n.ID, due}) // A fixed array of strings cannot fail JSON encoding.
	digest := sha256.Sum256(encoded)
	return hex.EncodeToString(digest[:])
}

// ValidateNotificationKeys rejects malformed and duplicate client acknowledgement keys.
func ValidateNotificationKeys(keys []string) error {
	v := &domain.ValidationError{}
	if len(keys) > MaxNotificationKeys {
		v.Add("keys", "must contain at most 200 keys")
		return v
	}
	seen := make(map[string]bool, len(keys))
	for _, key := range keys {
		_, err := hex.DecodeString(key)
		if len(key) != 64 || err != nil || strings.ToLower(key) != key || seen[key] {
			v.Add("keys", "must contain unique lowercase SHA-256 keys")
			return v
		}
		seen[key] = true
	}
	return nil
}

func notificationID(kind, matterID, subject string) string {
	return kind + ":" + matterID + ":" + subject
}
