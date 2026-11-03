-- name: InsertSavedView :exec
INSERT INTO saved_views (id, matter_id, owner_id, name, filters, created_at, updated_at, revision)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);

-- name: UpdateSavedView :execrows
UPDATE saved_views SET name = $4, filters = $5, updated_at = $6, revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = $1 AND matter_id = $2 AND owner_id = $3 AND revision = sqlc.arg(expected_revision)::bigint;

-- name: DeleteSavedView :execrows
DELETE FROM saved_views
WHERE id = $1 AND matter_id = $2 AND owner_id = $3 AND revision = sqlc.arg(expected_revision)::bigint;

-- name: ListSavedViewsOfMatter :many
SELECT id, matter_id, owner_id, name, filters, created_at, updated_at, revision
FROM saved_views WHERE matter_id = $1 AND owner_id = $2 ORDER BY name, id;
