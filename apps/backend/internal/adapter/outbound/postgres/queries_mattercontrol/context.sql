-- name: InsertContextRecord :exec
INSERT INTO context_records (id, matter_id, kind, title, body, status, closed_reason, created_by, created_at, revision)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);

-- name: UpdateContextRecord :execrows
UPDATE context_records SET title = $3, body = $4, status = $5, closed_reason = $6, revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = $1 AND matter_id = $2 AND revision = sqlc.arg(expected_revision)::bigint;

-- name: DeleteContextLinks :exec
DELETE FROM context_links WHERE record_id = $1;

-- name: InsertContextLink :exec
INSERT INTO context_links (record_id, matter_id, node_id) VALUES ($1, $2, $3);

-- name: ListContextRecordsOfMatter :many
SELECT id, kind, title, body, status, closed_reason, created_by, created_at, revision
FROM context_records WHERE matter_id = $1 ORDER BY id;

-- name: ListContextLinksOfMatter :many
SELECT record_id, node_id FROM context_links WHERE matter_id = $1 ORDER BY record_id, node_id;
