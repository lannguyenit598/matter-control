-- name: InsertIntakeRecord :exec
INSERT INTO intake_records (id, matter_id, title, request_text, requester, received_at, attachments, status, recorded_by, created_at, revision)
VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING', $8, $9, 1);

-- name: ListIntakeRecordsOfMatter :many
SELECT id, matter_id, title, request_text, requester, received_at, attachments, status, triage_reason, triaged_by, triaged_at, item_id, recorded_by, created_at, revision
FROM intake_records WHERE matter_id = $1 ORDER BY created_at DESC, id;

-- name: GetIntakeRecord :one
SELECT id, matter_id, title, request_text, requester, received_at, attachments, status, triage_reason, triaged_by, triaged_at, item_id, recorded_by, created_at, revision
FROM intake_records WHERE id = $1 AND matter_id = $2;

-- name: SaveIntakeRecord :execrows
UPDATE intake_records SET status = $3, triage_reason = $4, triaged_by = $5, triaged_at = $6, item_id = $7, revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = $1 AND matter_id = $2 AND revision = sqlc.arg(expected_revision)::bigint;

-- name: InsertGuidanceDocument :exec
INSERT INTO guidance_documents (id, matter_id, title, created_by, created_at, revision)
VALUES ($1, $2, $3, $4, $5, 1);

-- name: ListGuidanceDocumentsOfMatter :many
SELECT id, matter_id, title, created_by, created_at, revision
FROM guidance_documents WHERE matter_id = $1 ORDER BY created_at DESC, id;

-- name: GetGuidanceDocument :one
SELECT id, matter_id, title, created_by, created_at, revision
FROM guidance_documents WHERE id = $1 AND matter_id = $2;

-- name: InsertGuidanceRevision :exec
INSERT INTO guidance_revisions (id, document_id, matter_id, no, body, source_refs, status, created_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);

-- name: ListGuidanceRevisionsOfMatter :many
SELECT id, document_id, matter_id, no, body, source_refs, status, created_by, created_at, published_by, published_at
FROM guidance_revisions WHERE matter_id = $1 ORDER BY document_id, no;

-- name: GetGuidanceRevision :one
SELECT id, document_id, matter_id, no, body, source_refs, status, created_by, created_at, published_by, published_at
FROM guidance_revisions WHERE id = $1 AND matter_id = $2;

-- name: PublishGuidanceRevision :execrows
UPDATE guidance_revisions SET status = 'PUBLISHED', published_by = $3, published_at = $4
WHERE id = $1 AND matter_id = $2 AND status = 'DRAFT';

-- name: MaxGuidanceRevisionNo :one
SELECT COALESCE(MAX(no), 0)::bigint AS max_no FROM guidance_revisions WHERE document_id = $1;
