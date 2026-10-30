-- name: InsertReviewGrid :exec
INSERT INTO review_grids (id, matter_id, name, created_by, created_at, revision)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: UpdateReviewGrid :execrows
UPDATE review_grids SET name = $3, revision = sqlc.arg(expected_revision)::bigint + 1
WHERE id = $1 AND matter_id = $2 AND revision = sqlc.arg(expected_revision)::bigint;

-- name: GetReviewGrid :one
SELECT id, matter_id, name, created_by, created_at, revision
FROM review_grids WHERE matter_id = $1 AND id = $2;

-- name: ListReviewGridsOfMatter :many
SELECT id, matter_id, name, created_by, created_at, revision
FROM review_grids WHERE matter_id = $1 ORDER BY id DESC;

-- name: DeleteReviewGridVersions :exec
DELETE FROM review_grid_versions WHERE grid_id = $1;

-- name: InsertReviewGridVersion :exec
INSERT INTO review_grid_versions (grid_id, matter_id, version_id, position) VALUES ($1, $2, $3, $4);

-- name: ListReviewGridVersionsOfMatter :many
SELECT grid_id, version_id FROM review_grid_versions WHERE matter_id = $1 ORDER BY grid_id, position;

-- name: UpsertReviewQuestion :exec
INSERT INTO review_questions (id, matter_id, grid_id, position, revision, text, revised_by, revised_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
ON CONFLICT (id) DO UPDATE SET position = EXCLUDED.position, revision = EXCLUDED.revision, text = EXCLUDED.text,
    revised_by = EXCLUDED.revised_by, revised_at = EXCLUDED.revised_at;

-- name: InsertReviewQuestionRevision :exec
INSERT INTO review_question_revisions (question_id, revision, text, revised_by, revised_at)
VALUES ($1, $2, $3, $4, $5) ON CONFLICT (question_id, revision) DO NOTHING;

-- name: ListReviewQuestionsOfMatter :many
SELECT id, grid_id, position, revision, text, revised_by, revised_at
FROM review_questions WHERE matter_id = $1 ORDER BY grid_id, position;

-- name: ListReviewQuestionRevisionsOfGrid :many
SELECT r.question_id, r.revision, r.text, r.revised_by, r.revised_at
FROM review_question_revisions r JOIN review_questions q ON q.id = r.question_id
WHERE q.matter_id = $1 AND q.grid_id = $2
ORDER BY r.revised_at, r.question_id, r.revision;

-- name: InsertReviewAnswer :exec
INSERT INTO review_answers (id, matter_id, grid_id, version_id, question_id, question_revision, state, text, page_ref, quote_ref, author, answered_at, supersedes_id)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, sqlc.narg(supersedes_id));

-- name: ListReviewAnswersOfGrid :many
SELECT id, grid_id, version_id, question_id, question_revision, state, text, page_ref, quote_ref, author, answered_at, supersedes_id
FROM review_answers WHERE matter_id = $1 AND grid_id = $2 ORDER BY id;

-- name: ListReviewAnswersOfCell :many
-- One newest-first history page of one cell: recorded chronology (answered_at desc) with the
-- unique id as tie-break, seeking strictly after the cursor tuple, limit+1 rows so the caller
-- can tell whether an older answer exists without counting the whole trail.
SELECT id, grid_id, version_id, question_id, question_revision, state, text, page_ref, quote_ref, author, answered_at, supersedes_id
FROM review_answers
WHERE matter_id = $1 AND grid_id = $2 AND version_id = $3 AND question_id = $4
  AND (answered_at, id) < (sqlc.arg(cursor_at)::timestamptz, sqlc.arg(cursor_id)::uuid)
ORDER BY answered_at DESC, id DESC
LIMIT sqlc.arg(page_limit);

-- name: ListReviewAnswersOfCellFirst :many
-- The first history page of one cell (no seek): same order and limit+1 contract.
SELECT id, grid_id, version_id, question_id, question_revision, state, text, page_ref, quote_ref, author, answered_at, supersedes_id
FROM review_answers
WHERE matter_id = $1 AND grid_id = $2 AND version_id = $3 AND question_id = $4
ORDER BY answered_at DESC, id DESC
LIMIT sqlc.arg(page_limit);

-- name: ListReviewVersionRefs :many
SELECT v.id, v.document_id, d.name AS document_name, v.filename, v.version_no,
       COALESCE(d.current_version_id = v.id, FALSE)::bool AS is_current
FROM document_versions v
JOIN documents d ON d.matter_id = v.matter_id AND d.id = v.document_id
WHERE v.matter_id = $1 AND v.id = ANY($2::uuid[]);
