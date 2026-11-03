-- +goose Up
-- RLF-05: workspace playbooks. A playbook is a Workspace-scoped template container; publishing
-- appends ONE immutable revision (entries are a validated shape, never executable content). A
-- Matter OWNER may apply one exact revision inside an authorized Matter of the SAME workspace:
-- the application is atomic and idempotent, and playbook_instances records the reproducible
-- source provenance of each created work item. Provenance is not evidence and completes nothing.

CREATE TABLE playbooks (
    id           UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces,
    name         TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
    created_by   UUID NOT NULL REFERENCES users,
    created_at   TIMESTAMPTZ NOT NULL,
    revision     BIGINT NOT NULL DEFAULT 1,
    UNIQUE (workspace_id, name)
);

CREATE TABLE playbook_revisions (
    id          UUID PRIMARY KEY,
    playbook_id UUID NOT NULL REFERENCES playbooks,
    no          BIGINT NOT NULL,
    entries     JSONB NOT NULL,
    created_by  UUID NOT NULL REFERENCES users,
    created_at  TIMESTAMPTZ NOT NULL,
    UNIQUE (playbook_id, no)
);

CREATE TABLE playbook_instances (
    matter_id    UUID NOT NULL REFERENCES matters,
    revision_id  UUID NOT NULL REFERENCES playbook_revisions,
    playbook_id  UUID NOT NULL REFERENCES playbooks,
    entry_key    TEXT NOT NULL,
    item_id      UUID NOT NULL,
    applied_by   UUID NOT NULL REFERENCES users,
    applied_at   TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (matter_id, revision_id, entry_key)
);

CREATE INDEX playbook_instances_item_idx ON playbook_instances (item_id);

-- +goose Down
DROP TABLE IF EXISTS playbook_instances;
DROP TABLE IF EXISTS playbook_revisions;
DROP TABLE IF EXISTS playbooks;
