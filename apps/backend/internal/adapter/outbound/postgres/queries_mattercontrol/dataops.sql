-- W6 data-operations reads (brief replay + import registry). Explicit columns.

-- name: PageEventsWindow :many
SELECT matter_id, seq, id, type, schema_version, actor_kind, actor_id, target_kind,
       target_id, effective_at, recorded_at, cause_seq, correlation_id, command_key,
       reason, before, after
FROM domain_events
WHERE matter_id = $1 AND recorded_at > $2 AND recorded_at <= $3
ORDER BY recorded_at, seq;

-- name: EventsUpTo :many
SELECT matter_id, seq, id, type, schema_version, actor_kind, actor_id, target_kind,
       target_id, effective_at, recorded_at, cause_seq, correlation_id, command_key,
       reason, before, after
FROM domain_events
WHERE matter_id = $1 AND recorded_at <= $2
ORDER BY recorded_at, seq;

-- name: FindImportSource :one
SELECT matter_id, source_name, row_key, item_id, content_hash, first_imported_at
FROM import_sources
WHERE matter_id = $1 AND source_name = $2 AND row_key = $3;

-- name: RegisterImportSource :exec
INSERT INTO import_sources (matter_id, source_name, row_key, item_id, content_hash, first_imported_at)
VALUES ($1, $2, $3, $4, $5, $6);
