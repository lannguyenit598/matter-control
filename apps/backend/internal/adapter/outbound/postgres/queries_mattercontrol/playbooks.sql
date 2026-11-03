-- name: InsertPlaybook :exec
INSERT INTO playbooks (id, workspace_id, name, created_by, created_at, revision)
VALUES ($1, $2, $3, $4, $5, 1);

-- name: ListPlaybooksOfWorkspace :many
SELECT id, workspace_id, name, created_by, created_at, revision
FROM playbooks WHERE workspace_id = $1 ORDER BY name, id;

-- name: GetPlaybook :one
SELECT id, workspace_id, name, created_by, created_at, revision
FROM playbooks WHERE id = $1;

-- name: InsertPlaybookRevision :exec
INSERT INTO playbook_revisions (id, playbook_id, no, entries, created_by, created_at)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: MaxPlaybookRevisionNo :one
SELECT COALESCE(MAX(no), 0)::bigint AS max_no FROM playbook_revisions WHERE playbook_id = $1;

-- name: ListPlaybookRevisions :many
SELECT id, playbook_id, no, entries, created_by, created_at
FROM playbook_revisions WHERE playbook_id = $1 ORDER BY no;

-- name: GetPlaybookRevision :one
SELECT id, playbook_id, no, entries, created_by, created_at
FROM playbook_revisions WHERE id = $1;

-- name: ListPlaybookRevisionsOfPlaybookIds :many
SELECT id, playbook_id, no, entries, created_by, created_at
FROM playbook_revisions WHERE playbook_id = ANY($1::uuid[]) ORDER BY playbook_id, no;

-- name: InsertPlaybookInstance :exec
INSERT INTO playbook_instances (matter_id, revision_id, playbook_id, entry_key, item_id, applied_by, applied_at)
VALUES ($1, $2, $3, $4, $5, $6, $7);

-- name: ListPlaybookInstancesOfMatter :many
SELECT matter_id, revision_id, playbook_id, entry_key, item_id, applied_by, applied_at
FROM playbook_instances WHERE matter_id = $1;

-- name: ListPlaybookInstancesOfItems :many
SELECT matter_id, revision_id, playbook_id, entry_key, item_id, applied_by, applied_at
FROM playbook_instances WHERE item_id = ANY($1::uuid[]);
