-- +goose Up
-- MatterControl product schema, initial bundle for the BE-01 transaction spine.
-- This bundle is separate from the legacy userapi migrations: never run legacy
-- migrations against a product database and never run this bundle against a legacy
-- database. Table shapes follow docs/architecture/data-model.md (candidate) scoped
-- to this spine; proof/filing/import/object tables are deliberately absent.

-- Product identities are issuer+subject backed, unrelated to legacy email users.
CREATE TABLE users (
    id           UUID PRIMARY KEY,
    idp_issuer   TEXT NOT NULL,
    idp_subject  TEXT NOT NULL,
    display_name TEXT NOT NULL,
    UNIQUE (idp_issuer, idp_subject)
);

CREATE TABLE workspaces (
    id       UUID PRIMARY KEY,
    name     TEXT NOT NULL,
    revision BIGINT NOT NULL DEFAULT 1
);

CREATE TABLE workspace_memberships (
    workspace_id UUID NOT NULL REFERENCES workspaces,
    user_id      UUID NOT NULL REFERENCES users,
    role         TEXT NOT NULL CHECK (role IN ('OWNER', 'MEMBER')),
    status       TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
    revision     BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (workspace_id, user_id)
);

-- event_seq is the last assigned history sequence; last_recorded_at enforces the
-- nondecreasing recorded-time rule per matter. BE-01 sets no boundaries (due dates
-- stay NULL), so next_boundary_at stays NULL; the CHECKs keep later slices honest.
-- statement_timestamp() (not clock_timestamp()) seeds the two time columns: it is
-- stable within the INSERT, so boundaries_applied_until <= last_recorded_at always holds.
CREATE TABLE matters (
    id                        UUID PRIMARY KEY,
    workspace_id              UUID NOT NULL REFERENCES workspaces,
    title                     TEXT NOT NULL,
    revision                  BIGINT NOT NULL DEFAULT 1,
    event_seq                 BIGINT NOT NULL DEFAULT 0,
    last_recorded_at          TIMESTAMPTZ NOT NULL DEFAULT statement_timestamp(),
    next_boundary_at          TIMESTAMPTZ,
    boundaries_applied_until  TIMESTAMPTZ NOT NULL DEFAULT statement_timestamp(),
    CHECK (boundaries_applied_until <= last_recorded_at),
    CHECK (next_boundary_at IS NULL OR next_boundary_at > boundaries_applied_until)
);
CREATE INDEX matters_next_boundary ON matters (next_boundary_at) WHERE next_boundary_at IS NOT NULL;

CREATE TABLE matter_memberships (
    matter_id UUID NOT NULL REFERENCES matters,
    user_id   UUID NOT NULL REFERENCES users,
    role      TEXT NOT NULL CHECK (role IN ('OWNER', 'EDITOR', 'VIEWER')),
    status    TEXT NOT NULL CHECK (status IN ('ACTIVE', 'REVOKED')),
    revision  BIGINT NOT NULL DEFAULT 1,
    PRIMARY KEY (matter_id, user_id)
);

-- Workstreams carry scoped nullable references for requirements.
CREATE TABLE workstreams (
    id        UUID PRIMARY KEY,
    matter_id UUID NOT NULL REFERENCES matters,
    name      TEXT NOT NULL,
    revision  BIGINT NOT NULL DEFAULT 1,
    UNIQUE (matter_id, id)
);

-- Typed totality: every graph node must carry exactly one typed row (REQUIREMENT or
-- ACTION) in the SAME transaction. The deferred constraint trigger rejects a commit
-- that leaves a node without its typed row.
CREATE TABLE graph_nodes (
    id        UUID PRIMARY KEY,
    matter_id UUID NOT NULL REFERENCES matters,
    kind      TEXT NOT NULL CHECK (kind IN ('REQUIREMENT', 'ACTION')),
    UNIQUE (matter_id, id),
    UNIQUE (matter_id, id, kind)
);

CREATE TABLE requirements (
    id                        UUID PRIMARY KEY,
    kind                      TEXT NOT NULL DEFAULT 'REQUIREMENT' CHECK (kind = 'REQUIREMENT'),
    matter_id                 UUID NOT NULL,
    FOREIGN KEY (matter_id, id, kind) REFERENCES graph_nodes (matter_id, id, kind),
    UNIQUE (matter_id, id),
    workstream_id             UUID,
    FOREIGN KEY (matter_id, workstream_id) REFERENCES workstreams (matter_id, id),
    title                     TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    outcome                   TEXT NOT NULL CHECK (length(btrim(outcome)) > 0),
    owner_user_id             UUID,
    FOREIGN KEY (matter_id, owner_user_id) REFERENCES matter_memberships (matter_id, user_id),
    due_at                    TIMESTAMPTZ,
    execution_state           TEXT NOT NULL CHECK (execution_state IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CANCELLED')),
    dependency_state          TEXT NOT NULL CHECK (dependency_state IN ('READY', 'BLOCKED')),
    dependency_reasons        JSONB NOT NULL DEFAULT '[]',
    verification_state        TEXT NOT NULL CHECK (verification_state IN ('NOT_REQUIRED', 'UNVERIFIED', 'PARTIALLY_VERIFIED', 'VERIFIED', 'DISPUTED')),
    verification_applicability TEXT NOT NULL DEFAULT 'REQUIRED' CHECK (verification_applicability IN ('REQUIRED', 'NOT_REQUIRED')),
    applicability_reason      TEXT,
    proof_epoch               INT NOT NULL DEFAULT 0 CHECK (proof_epoch >= 0),
    proof_epoch_opened_at     TIMESTAMPTZ,
    CHECK (proof_epoch = 0 OR proof_epoch_opened_at IS NOT NULL),
    completed_at              TIMESTAMPTZ,
    cancelled_at              TIMESTAMPTZ,
    critical_escalation_reason TEXT,
    imported_verification_claim TEXT,
    revision                  BIGINT NOT NULL DEFAULT 1,
    CHECK ((execution_state = 'COMPLETED') = (completed_at IS NOT NULL)),
    CHECK (verification_applicability = 'REQUIRED' OR applicability_reason IS NOT NULL)
);

-- Actions are a structural typed-totality dependency of graph nodes, not a BE-01
-- endpoint: the table exists so the node guard is complete.
CREATE TABLE actions (
    id                        UUID PRIMARY KEY,
    kind                      TEXT NOT NULL DEFAULT 'ACTION' CHECK (kind = 'ACTION'),
    matter_id                 UUID NOT NULL,
    FOREIGN KEY (matter_id, id, kind) REFERENCES graph_nodes (matter_id, id, kind),
    UNIQUE (matter_id, id),
    workstream_id             UUID,
    FOREIGN KEY (matter_id, workstream_id) REFERENCES workstreams (matter_id, id),
    title                     TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    outcome                   TEXT NOT NULL CHECK (length(btrim(outcome)) > 0),
    owner_user_id             UUID,
    FOREIGN KEY (matter_id, owner_user_id) REFERENCES matter_memberships (matter_id, user_id),
    due_at                    TIMESTAMPTZ,
    execution_state           TEXT NOT NULL CHECK (execution_state IN ('NOT_STARTED', 'IN_PROGRESS', 'WAITING', 'COMPLETED', 'CANCELLED')),
    dependency_state          TEXT NOT NULL CHECK (dependency_state IN ('READY', 'BLOCKED')),
    dependency_reasons        JSONB NOT NULL DEFAULT '[]',
    proof_required            BOOLEAN NOT NULL,
    verification_state        TEXT CHECK (verification_state IS NULL OR verification_state IN ('NOT_REQUIRED', 'UNVERIFIED', 'PARTIALLY_VERIFIED', 'VERIFIED', 'DISPUTED')),
    verification_applicability TEXT CHECK (verification_applicability IS NULL OR verification_applicability IN ('REQUIRED', 'NOT_REQUIRED')),
    applicability_reason      TEXT,
    proof_epoch               INT NOT NULL DEFAULT 0 CHECK (proof_epoch >= 0),
    proof_epoch_opened_at     TIMESTAMPTZ,
    CHECK ((verification_state IS NULL) = (NOT proof_required)),
    CHECK ((verification_applicability IS NULL) = (NOT proof_required)),
    completed_at              TIMESTAMPTZ,
    cancelled_at              TIMESTAMPTZ,
    critical_escalation_reason TEXT,
    imported_verification_claim TEXT,
    revision                  BIGINT NOT NULL DEFAULT 1,
    CHECK ((execution_state = 'COMPLETED') = (completed_at IS NOT NULL))
);

-- Obligatory history for every successful command, independent of any event sink.
-- Append-only: the guard trigger rejects UPDATE and DELETE.
CREATE TABLE domain_events (
    matter_id      UUID NOT NULL REFERENCES matters,
    seq            BIGINT NOT NULL,
    id             UUID NOT NULL UNIQUE,
    type           TEXT NOT NULL,
    schema_version INT NOT NULL,
    actor_kind     TEXT NOT NULL CHECK (actor_kind IN ('USER', 'SYSTEM_CLOCK')),
    actor_id       UUID,
    CHECK (CASE actor_kind WHEN 'USER' THEN actor_id IS NOT NULL
                           WHEN 'SYSTEM_CLOCK' THEN actor_id IS NULL
                           ELSE false END),
    target_kind    TEXT NOT NULL,
    target_id      UUID NOT NULL,
    effective_at   TIMESTAMPTZ NOT NULL,
    recorded_at    TIMESTAMPTZ NOT NULL,
    CHECK (effective_at <= recorded_at),
    cause_seq      BIGINT,
    correlation_id UUID,
    command_key    UUID,
    reason         TEXT,
    before         JSONB,
    after          JSONB,
    PRIMARY KEY (matter_id, seq)
);
CREATE INDEX domain_events_recorded ON domain_events (matter_id, recorded_at, seq);
CREATE INDEX domain_events_target ON domain_events (matter_id, target_id, seq);

-- Immutable idempotency receipts: the primary key (actor_id, idempotency_key) means
-- one committed outcome per actor intent. BE-01 deviation from the data-model sketch:
-- purge_after is nullable because no retention policy value is approved (TB-06 open);
-- no default and no purge job are invented here.
CREATE TABLE command_receipts (
    actor_id        UUID NOT NULL,
    idempotency_key UUID NOT NULL,
    request_hash    BYTEA NOT NULL,
    scope_kind      TEXT NOT NULL CHECK (scope_kind IN ('MATTER', 'WORKSPACE')),
    workspace_id    UUID NOT NULL REFERENCES workspaces,
    matter_id       UUID REFERENCES matters,
    CHECK (CASE scope_kind WHEN 'MATTER' THEN matter_id IS NOT NULL
                           WHEN 'WORKSPACE' THEN matter_id IS NULL
                           ELSE false END),
    status_code     INT NOT NULL CHECK (status_code BETWEEN 200 AND 299),
    response        JSONB NOT NULL,
    committed_at    TIMESTAMPTZ NOT NULL,
    purge_after     TIMESTAMPTZ,
    PRIMARY KEY (actor_id, idempotency_key)
);

-- One row per matter represented in the stored response; replay requires current read
-- access to every one of them.
CREATE TABLE command_receipt_matters (
    actor_id              UUID NOT NULL,
    idempotency_key       UUID NOT NULL,
    represented_matter_id UUID NOT NULL REFERENCES matters,
    FOREIGN KEY (actor_id, idempotency_key) REFERENCES command_receipts,
    PRIMARY KEY (actor_id, idempotency_key, represented_matter_id)
);

-- Restricted security audit: no titles, filenames, content or response bodies.
CREATE TABLE security_audit_events (
    id                       UUID PRIMARY KEY,
    occurred_at              TIMESTAMPTZ NOT NULL,
    actor_id                 UUID,
    operation                TEXT NOT NULL,
    outcome                  TEXT NOT NULL,
    requested_resource_kind  TEXT,
    requested_id_hash        BYTEA,
    client_ip                INET,
    request_id               TEXT
);

-- Typed-totality guard: fires at commit, so node and typed row are inserted in one
-- transaction or neither persists.
-- +goose StatementBegin
CREATE FUNCTION assert_graph_node_has_typed_row() RETURNS trigger AS $$
BEGIN
    IF NEW.kind = 'REQUIREMENT' THEN
        IF NOT EXISTS (SELECT 1 FROM requirements r
                       WHERE r.matter_id = NEW.matter_id AND r.id = NEW.id) THEN
            RAISE EXCEPTION 'graph node % in matter % has no REQUIREMENT row', NEW.id, NEW.matter_id;
        END IF;
    ELSIF NEW.kind = 'ACTION' THEN
        IF NOT EXISTS (SELECT 1 FROM actions a
                       WHERE a.matter_id = NEW.matter_id AND a.id = NEW.id) THEN
            RAISE EXCEPTION 'graph node % in matter % has no ACTION row', NEW.id, NEW.matter_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE CONSTRAINT TRIGGER graph_nodes_typed_total
    AFTER INSERT ON graph_nodes
    DEFERRABLE INITIALLY DEFERRED
    FOR EACH ROW EXECUTE FUNCTION assert_graph_node_has_typed_row();

-- Append-only and no-hard-delete guards. Local enforcement is trigger-based because
-- role/column grants do not exist in a disposable test database; production grants
-- come with the deployment decision.
-- +goose StatementBegin
CREATE FUNCTION forbid_mutation() RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'table % is append-only: % is not allowed', TG_TABLE_NAME, TG_OP;
END;
$$ LANGUAGE plpgsql;
-- +goose StatementEnd

CREATE TRIGGER domain_events_append_only
    BEFORE UPDATE OR DELETE ON domain_events
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER command_receipts_append_only
    BEFORE UPDATE OR DELETE ON command_receipts
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER command_receipt_matters_append_only
    BEFORE UPDATE OR DELETE ON command_receipt_matters
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER requirements_no_delete
    BEFORE DELETE ON requirements
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER actions_no_delete
    BEFORE DELETE ON actions
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();
CREATE TRIGGER graph_nodes_no_delete
    BEFORE DELETE ON graph_nodes
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- +goose Down
DROP TRIGGER IF EXISTS graph_nodes_no_delete ON graph_nodes;
DROP TRIGGER IF EXISTS actions_no_delete ON actions;
DROP TRIGGER IF EXISTS requirements_no_delete ON requirements;
DROP TRIGGER IF EXISTS command_receipt_matters_append_only ON command_receipt_matters;
DROP TRIGGER IF EXISTS command_receipts_append_only ON command_receipts;
DROP TRIGGER IF EXISTS domain_events_append_only ON domain_events;
DROP FUNCTION IF EXISTS forbid_mutation();
DROP FUNCTION IF EXISTS assert_graph_node_has_typed_row();
DROP TABLE IF EXISTS security_audit_events;
DROP TABLE IF EXISTS command_receipt_matters;
DROP TABLE IF EXISTS command_receipts;
DROP TABLE IF EXISTS domain_events;
DROP TABLE IF EXISTS actions;
DROP TABLE IF EXISTS requirements;
DROP TABLE IF EXISTS graph_nodes;
DROP TABLE IF EXISTS workstreams;
DROP TABLE IF EXISTS matter_memberships;
DROP TABLE IF EXISTS matters;
DROP TABLE IF EXISTS workspace_memberships;
DROP TABLE IF EXISTS workspaces;
DROP TABLE IF EXISTS users;
