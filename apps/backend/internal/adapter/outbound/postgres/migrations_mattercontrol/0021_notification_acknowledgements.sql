-- +goose Up
-- Acknowledgements are per-user UI metadata; no legal notification content is copied.
CREATE TABLE notification_acknowledgements (
 user_id UUID NOT NULL REFERENCES users,
 notification_key TEXT NOT NULL CHECK (notification_key ~ '^[0-9a-f]{64}$'),
 seen_at TIMESTAMPTZ NOT NULL,
 PRIMARY KEY (user_id, notification_key)
);

-- +goose Down
DROP TABLE notification_acknowledgements;
