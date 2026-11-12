package port

import (
	"context"
	"io"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- In-app notifications (MC-ZCODE-NOTIF-MAILPITCH-20261110) ----------

// ListNotificationsQuery reads the caller's derived notifications at one instant. Now pins the
// derivation instant; zero means the service clock.
type ListNotificationsQuery struct {
	ActorID string
	Limit   int
	Now     time.Time
}

// MarkNotificationsSeenCmd acknowledges only displayed keys. It is deliberately not
// receipted: it records no domain fact, changes no matter and is idempotent by construction.
type MarkNotificationsSeenCmd struct {
	ActorID string
	Keys    []string
	At      time.Time
}

// NotificationSeenStore keeps per-user acknowledgement keys and last-action metadata.
type NotificationSeenStore interface {
	NotificationSeen(ctx context.Context, userID string) (*time.Time, error)
	SeenNotificationKeys(ctx context.Context, userID string, keys []string) ([]string, error)
	SetNotificationSeen(ctx context.Context, userID string, keys []string, at time.Time) error
}

// NotificationService defines the notification use cases.
type NotificationService interface {
	ListNotifications(ctx context.Context, q ListNotificationsQuery) (matter.NotificationPage, error)
	MarkNotificationsSeen(ctx context.Context, cmd MarkNotificationsSeenCmd) (time.Time, error)
}

// ---------- Email capture (MC-ZCODE-NOTIF-MAILPITCH-20261110) ----------

// MailIntakeCmd captures one uploaded .eml: the raw bytes become an ordinary document version
// and the parsed envelope one mail row, in one transaction. Owner/editor only, receipted.
type MailIntakeCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	Filename       string
	Direction      string
	Body           io.Reader
	MaxBytes       int64
}

// MailListQuery reads the matter's captured envelopes.
type MailListQuery struct {
	ActorID  string
	MatterID string
}

// MailTx writes the envelope inside the locked matter transaction.
type MailTx interface {
	InsertMailMessage(ctx context.Context, m matter.MailMessage) error
	LoadMailMessage(ctx context.Context, m matter.MatterID, id matter.MailMessageID) (matter.MailMessage, error)
}

// MailSnapshot reads captured envelopes in one matter snapshot.
type MailSnapshot interface {
	ListMailMessages(ctx context.Context, m matter.MatterID) ([]matter.MailMessage, error)
}

// MailService defines the email-capture use cases.
type MailService interface {
	MailIntake(ctx context.Context, cmd MailIntakeCmd) (matter.MailCreated, error)
	ListMail(ctx context.Context, q MailListQuery) ([]matter.MailMessage, error)
}
