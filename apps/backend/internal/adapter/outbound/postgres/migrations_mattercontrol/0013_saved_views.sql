-- +goose Up
-- RLF-04 (REQ-MC-P1-12): private named work-grid filter definitions. A view belongs to exactly
-- one actor inside exactly one Matter; it stores a validated filter shape — never record copies,
-- tokens, URLs or executable queries. Sharing does not exist: a list read returns only the
-- caller's own rows, and knowing an id grants nothing.

CREATE TABLE saved_views (
    id         UUID PRIMARY KEY,
    matter_id  UUID NOT NULL REFERENCES matters,
    owner_id   UUID NOT NULL REFERENCES users,
    name       TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 100),
    filters    JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    revision   BIGINT NOT NULL DEFAULT 1,
    UNIQUE (matter_id, owner_id, name)
);

CREATE INDEX saved_views_owner_idx ON saved_views (owner_id, matter_id);

-- +goose Down
DROP TABLE IF EXISTS saved_views;
