-- name: GetNotificationSeen :one
SELECT user_id, seen_at FROM notification_seen WHERE user_id = $1;

-- name: UpsertNotificationSeen :exec
INSERT INTO notification_seen (user_id, seen_at) VALUES ($1, $2)
ON CONFLICT (user_id) DO UPDATE SET seen_at = EXCLUDED.seen_at;

-- name: InsertMailMessage :exec
INSERT INTO mail_messages (id, matter_id, document_id, version_id, direction, sender, recipients, subject, excerpt, sent_at, recorded_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);

-- name: GetMailMessage :one
SELECT id, matter_id, document_id, version_id, direction, sender, recipients, subject, excerpt, sent_at, recorded_by, created_at
FROM mail_messages WHERE id = $1 AND matter_id = $2;

-- name: ListMailMessagesOfMatter :many
SELECT id, matter_id, document_id, version_id, direction, sender, recipients, subject, excerpt, sent_at, recorded_by, created_at
FROM mail_messages WHERE matter_id = $1 ORDER BY created_at DESC, id;
