-- name: GetNotificationSeen :one
SELECT user_id, seen_at FROM notification_seen WHERE user_id = $1;

-- name: UpsertNotificationSeen :exec
INSERT INTO notification_seen (user_id, seen_at) VALUES ($1, $2)
ON CONFLICT (user_id) DO UPDATE SET seen_at = GREATEST(notification_seen.seen_at, EXCLUDED.seen_at);

-- name: SeenNotificationKeys :many
SELECT notification_key FROM notification_acknowledgements
WHERE user_id = sqlc.arg(user_id) AND notification_key = ANY(sqlc.arg(keys)::text[]);

-- name: AcknowledgeNotificationKeys :exec
INSERT INTO notification_acknowledgements (user_id, notification_key, seen_at)
SELECT sqlc.arg(user_id), key, sqlc.arg(seen_at)::timestamptz FROM unnest(sqlc.arg(keys)::text[]) AS key
ON CONFLICT (user_id, notification_key) DO UPDATE
SET seen_at = GREATEST(notification_acknowledgements.seen_at, EXCLUDED.seen_at);

-- name: InsertMailMessage :exec
INSERT INTO mail_messages (id, matter_id, document_id, version_id, direction, sender, recipients, subject, excerpt, sent_at, recorded_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);

-- name: GetMailMessage :one
SELECT id, matter_id, document_id, version_id, direction, sender, recipients, subject, excerpt, sent_at, recorded_by, created_at
FROM mail_messages WHERE id = $1 AND matter_id = $2;

-- name: ListMailMessagesOfMatter :many
SELECT id, matter_id, document_id, version_id, direction, sender, recipients, subject, excerpt, sent_at, recorded_by, created_at
FROM mail_messages WHERE matter_id = $1 ORDER BY created_at DESC, id;
