-- +goose Up
-- MC-ZCODE-NOTIF-MAILPITCH-20261110: in-app notifications are derived on read from read models
-- the caller is already authorized to see (My Agenda, My Actions, review queue). Nothing derived
-- is stored; this table holds only the per-user watermark that separates "unread" from "seen".
-- Marking seen records no domain fact and is not receipted.

CREATE TABLE notification_seen (
    user_id UUID PRIMARY KEY REFERENCES users,
    seen_at TIMESTAMPTZ NOT NULL
);

-- +goose Down
DROP TABLE IF EXISTS notification_seen;
