-- +goose Up
-- W5: basic Decision / Finding / Risk / Entity context records linked to work items. They never
-- change execution, verification or dependency state, and an Entity never grants access.

CREATE TABLE context_records (
    id            UUID PRIMARY KEY,
    matter_id     UUID NOT NULL REFERENCES matters,
    kind          TEXT NOT NULL CHECK (kind IN ('DECISION', 'FINDING', 'RISK', 'ENTITY')),
    title         TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    body          TEXT NOT NULL DEFAULT '',
    status        TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
    closed_reason TEXT NOT NULL DEFAULT '',
    created_by    UUID NOT NULL REFERENCES users,
    created_at    TIMESTAMPTZ NOT NULL,
    revision      BIGINT NOT NULL DEFAULT 1,
    CHECK ((status = 'CLOSED') = (length(btrim(closed_reason)) > 0)),
    UNIQUE (matter_id, id)
);

CREATE TABLE context_links (
    record_id UUID NOT NULL,
    matter_id UUID NOT NULL,
    node_id   UUID NOT NULL,
    PRIMARY KEY (record_id, node_id),
    FOREIGN KEY (matter_id, record_id) REFERENCES context_records (matter_id, id),
    FOREIGN KEY (matter_id, node_id) REFERENCES graph_nodes (matter_id, id)
);

-- +goose Down
DROP TABLE IF EXISTS context_links;
DROP TABLE IF EXISTS context_records;
