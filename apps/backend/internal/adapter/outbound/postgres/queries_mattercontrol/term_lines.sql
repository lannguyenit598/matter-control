-- MC-ZCODE-TERMSHEET-01: contract term lines (design 2026-11-05 §2.2). Facts about one contract
-- document version; promotion only records the link to the draft the fact operationalized.

-- name: ListTermLinesOfMatter :many
SELECT id, matter_id, document_version_id, field, value_text, value_date, row_key, content_hash,
       promoted_ref, promoted_kind, promoted_at, imported_by, created_at, updated_at, revision
FROM contract_term_lines
WHERE matter_id = $1
ORDER BY document_version_id, field, row_key, id;

-- name: GetTermLine :one
SELECT id, matter_id, document_version_id, field, value_text, value_date, row_key, content_hash,
       promoted_ref, promoted_kind, promoted_at, imported_by, created_at, updated_at, revision
FROM contract_term_lines
WHERE id = $1 AND matter_id = $2;

-- name: InsertTermLine :exec
INSERT INTO contract_term_lines (id, matter_id, document_version_id, field, value_text, value_date,
                                 row_key, content_hash, promoted_ref, promoted_kind, promoted_at,
                                 imported_by, created_at, updated_at, revision)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15);

-- name: DeleteTermLinesOfDocumentVersion :exec
DELETE FROM contract_term_lines
WHERE matter_id = $1 AND document_version_id = $2;

-- name: MarkTermLinePromoted :execrows
UPDATE contract_term_lines
SET promoted_ref = $2, promoted_kind = $3, promoted_at = $4, updated_at = $4, revision = revision + 1
WHERE id = $1 AND matter_id = $5;
