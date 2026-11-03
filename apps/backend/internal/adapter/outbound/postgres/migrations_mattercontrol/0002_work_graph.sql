-- +goose Up
-- W2 work graph: external parties, waiting relations, dependency edges, milestones.
-- Additive to 0001: no executable SQL of the merged bundle changes. Invariants that the core
-- also enforces are repeated here as constraints so a bug cannot persist an impossible state.

-- External parties are context only: no account, no role, no access.
CREATE TABLE parties (
    id        UUID PRIMARY KEY,
    matter_id UUID NOT NULL REFERENCES matters,
    name      TEXT NOT NULL CHECK (length(btrim(name)) > 0),
    kind      TEXT NOT NULL DEFAULT '',
    contact   TEXT NOT NULL DEFAULT '',
    notes     TEXT NOT NULL DEFAULT '',
    revision  BIGINT NOT NULL DEFAULT 1,
    UNIQUE (matter_id, id)
);

-- A waiting relation exists exactly while execution is WAITING; CANCELLED carries its time.
ALTER TABLE requirements
    ADD COLUMN waiting_party_id UUID,
    ADD COLUMN waiting_condition TEXT,
    ADD FOREIGN KEY (matter_id, waiting_party_id) REFERENCES parties (matter_id, id),
    ADD CONSTRAINT requirements_waiting_shape
        CHECK ((execution_state = 'WAITING') = (waiting_party_id IS NOT NULL AND waiting_condition IS NOT NULL)),
    ADD CONSTRAINT requirements_cancelled_shape
        CHECK ((execution_state = 'CANCELLED') = (cancelled_at IS NOT NULL));
ALTER TABLE actions
    ADD COLUMN waiting_party_id UUID,
    ADD COLUMN waiting_condition TEXT,
    ADD FOREIGN KEY (matter_id, waiting_party_id) REFERENCES parties (matter_id, id),
    ADD CONSTRAINT actions_waiting_shape
        CHECK ((execution_state = 'WAITING') = (waiting_party_id IS NOT NULL AND waiting_condition IS NOT NULL)),
    ADD CONSTRAINT actions_cancelled_shape
        CHECK ((execution_state = 'CANCELLED') = (cancelled_at IS NOT NULL));

-- Directed prerequisites. Both ends are nodes of the SAME matter (composite foreign keys), no
-- self-edge and one edge per ordered pair. Cycles are refused by the core under the matter lock.
CREATE TABLE dependency_edges (
    id        UUID PRIMARY KEY,
    matter_id UUID NOT NULL,
    source_id UUID NOT NULL,
    target_id UUID NOT NULL,
    gate      TEXT NOT NULL CHECK (gate IN ('COMPLETION', 'PROOF')),
    FOREIGN KEY (matter_id, source_id) REFERENCES graph_nodes (matter_id, id),
    FOREIGN KEY (matter_id, target_id) REFERENCES graph_nodes (matter_id, id),
    CHECK (source_id <> target_id),
    UNIQUE (matter_id, source_id, target_id)
);
CREATE INDEX dependency_edges_target ON dependency_edges (matter_id, target_id);

CREATE TABLE milestones (
    id        UUID PRIMARY KEY,
    matter_id UUID NOT NULL REFERENCES matters,
    name      TEXT NOT NULL CHECK (length(btrim(name)) > 0),
    due_at    TIMESTAMPTZ,
    critical  BOOLEAN NOT NULL DEFAULT false,
    revision  BIGINT NOT NULL DEFAULT 1,
    UNIQUE (matter_id, id)
);

-- Explicitly designated required Requirements; only Requirements, only of the same matter.
CREATE TABLE milestone_prerequisites (
    milestone_id   UUID NOT NULL,
    matter_id      UUID NOT NULL,
    requirement_id UUID NOT NULL,
    PRIMARY KEY (milestone_id, requirement_id),
    FOREIGN KEY (matter_id, milestone_id) REFERENCES milestones (matter_id, id),
    FOREIGN KEY (matter_id, requirement_id) REFERENCES requirements (matter_id, id)
);

-- +goose Down
DROP TABLE IF EXISTS milestone_prerequisites;
DROP TABLE IF EXISTS milestones;
DROP TABLE IF EXISTS dependency_edges;
ALTER TABLE actions DROP CONSTRAINT IF EXISTS actions_cancelled_shape, DROP CONSTRAINT IF EXISTS actions_waiting_shape,
    DROP COLUMN IF EXISTS waiting_condition, DROP COLUMN IF EXISTS waiting_party_id;
ALTER TABLE requirements DROP CONSTRAINT IF EXISTS requirements_cancelled_shape, DROP CONSTRAINT IF EXISTS requirements_waiting_shape,
    DROP COLUMN IF EXISTS waiting_condition, DROP COLUMN IF EXISTS waiting_party_id;
DROP TABLE IF EXISTS parties;
