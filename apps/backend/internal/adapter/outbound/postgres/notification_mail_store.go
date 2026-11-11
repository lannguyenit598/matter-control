package postgres

// MC-ZCODE-NOTIF-MAILPITCH-20261110 adapter: the per-user notification watermark (pool-backed,
// outside any matter transaction — it belongs to the person, not to a matter) and mail capture
// writes/reads inside the locked matter transaction.

import (
	"context"
	"errors"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.NotificationSeenStore = (*MatterStore)(nil)
	_ port.MailTx                = (*pgMatterTx)(nil)
	_ port.MailSnapshot          = (*pgMatterTx)(nil)
	_ port.MailSnapshot          = (*pgSnapshot)(nil)
)

// NotificationSeen returns the caller's watermark, or nil when nothing was ever seen.
func (s *MatterStore) NotificationSeen(ctx context.Context, userID string) (*time.Time, error) {
	row, err := mcsqlc.New(s.pool).GetNotificationSeen(ctx, userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, mapMatterError(err)
	}
	t := row.SeenAt.UTC()
	return &t, nil
}

// SetNotificationSeen writes the watermark; the upsert makes replays harmless.
func (s *MatterStore) SetNotificationSeen(ctx context.Context, userID string, at time.Time) error {
	return mapMatterError(mcsqlc.New(s.pool).UpsertNotificationSeen(ctx, mcsqlc.UpsertNotificationSeenParams{
		UserID: userID, SeenAt: at,
	}))
}

func mailFromRow(r mcsqlc.MailMessage) matter.MailMessage {
	out := matter.MailMessage{
		ID: matter.MailMessageID(r.ID), MatterID: matter.MatterID(r.MatterID),
		DocumentID: matter.DocumentID(r.DocumentID), VersionID: matter.VersionID(r.VersionID),
		Direction: matter.MailDirection(r.Direction), Sender: r.Sender, Recipients: r.Recipients,
		Subject: r.Subject, Excerpt: r.Excerpt, RecordedBy: matter.ActorID(r.RecordedBy),
		CreatedAt: r.CreatedAt.UTC(),
	}
	if r.SentAt.Valid {
		t := r.SentAt.Time.UTC()
		out.SentAt = &t
	}
	return out
}

func mailTimestamptz(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: *t, Valid: true}
}

func (t *pgMatterTx) InsertMailMessage(ctx context.Context, m matter.MailMessage) error {
	return mapMatterError(t.q.InsertMailMessage(ctx, mcsqlc.InsertMailMessageParams{
		ID: m.ID.String(), MatterID: m.MatterID.String(), DocumentID: m.DocumentID.String(),
		VersionID: m.VersionID.String(), Direction: string(m.Direction), Sender: m.Sender,
		Recipients: m.Recipients, Subject: m.Subject, Excerpt: m.Excerpt,
		SentAt: mailTimestamptz(m.SentAt), RecordedBy: m.RecordedBy.String(), CreatedAt: m.CreatedAt,
	}))
}

func (t *pgMatterTx) LoadMailMessage(ctx context.Context, m matter.MatterID, id matter.MailMessageID) (matter.MailMessage, error) {
	r, err := t.q.GetMailMessage(ctx, mcsqlc.GetMailMessageParams{ID: id.String(), MatterID: m.String()})
	if err != nil {
		return matter.MailMessage{}, mapMatterError(err)
	}
	return mailFromRow(r), nil
}

func (t *pgMatterTx) ListMailMessages(ctx context.Context, m matter.MatterID) ([]matter.MailMessage, error) {
	rows, err := t.q.ListMailMessagesOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.MailMessage, 0, len(rows))
	for _, r := range rows {
		out = append(out, mailFromRow(r))
	}
	return out, nil
}

func (s *pgSnapshot) ListMailMessages(ctx context.Context, m matter.MatterID) ([]matter.MailMessage, error) {
	rows, err := s.q.ListMailMessagesOfMatter(ctx, m.String())
	if err != nil {
		return nil, mapMatterError(err)
	}
	out := make([]matter.MailMessage, 0, len(rows))
	for _, r := range rows {
		out = append(out, mailFromRow(r))
	}
	return out, nil
}
