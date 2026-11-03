-- +goose Up
-- W4: regulatory filings. A filing is an ACTION node (execution, dependencies, waiting, proof epochs
-- and evidence criteria are the shared machinery); these tables hold the filing-specific facts.
-- Submissions and observations are append-only: history is never rewritten.

CREATE TABLE filing_details (
    item_id                UUID PRIMARY KEY,
    matter_id              UUID NOT NULL,
    requirement_id         UUID NOT NULL,
    authority_party_id     UUID NOT NULL,
    stage                  TEXT NOT NULL CHECK (stage IN (
        'REQUIREMENT', 'PACKAGE_PREPARATION', 'SIGNATURE', 'SUBMISSION', 'RECEIPT',
        'AUTHORITY_REVIEW', 'SUPPLEMENT', 'RESPONSE', 'APPROVAL')),
    negative_outcome       TEXT CHECK (negative_outcome IS NULL OR negative_outcome IN ('REJECTED', 'WITHDRAWN')),
    negative_outcome_epoch INT NOT NULL DEFAULT 0 CHECK (negative_outcome_epoch >= 0),
    current_cycle          INT NOT NULL DEFAULT 1 CHECK (current_cycle >= 1),
    FOREIGN KEY (matter_id, item_id) REFERENCES actions (matter_id, id),
    FOREIGN KEY (matter_id, requirement_id) REFERENCES graph_nodes (matter_id, id),
    FOREIGN KEY (matter_id, authority_party_id) REFERENCES parties (matter_id, id),
    UNIQUE (matter_id, item_id)
);

CREATE TABLE filing_cycles (
    id             UUID PRIMARY KEY,
    matter_id      UUID NOT NULL,
    item_id        UUID NOT NULL,
    cycle_no       INT NOT NULL CHECK (cycle_no >= 1),
    opened_in_epoch INT NOT NULL DEFAULT 0,
    request_ref    TEXT NOT NULL DEFAULT '',
    owner_id       UUID,
    due_at         TIMESTAMPTZ,
    opened_at      TIMESTAMPTZ NOT NULL,
    submitted_at   TIMESTAMPTZ,
    submission_id  UUID,
    FOREIGN KEY (matter_id, item_id) REFERENCES filing_details (matter_id, item_id),
    UNIQUE (item_id, cycle_no)
);

CREATE TABLE filing_submissions (
    id            UUID PRIMARY KEY,
    matter_id     UUID NOT NULL,
    item_id       UUID NOT NULL,
    cycle_no      INT NOT NULL,
    reference     TEXT NOT NULL CHECK (length(btrim(reference)) > 0),
    submitted_at  TIMESTAMPTZ NOT NULL,
    version_ids   JSONB NOT NULL DEFAULT '[]',
    external_refs JSONB NOT NULL DEFAULT '[]',
    recorded_by   UUID NOT NULL REFERENCES users,
    recorded_at   TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (matter_id, item_id) REFERENCES filing_details (matter_id, item_id),
    FOREIGN KEY (item_id, cycle_no) REFERENCES filing_cycles (item_id, cycle_no)
);
CREATE TRIGGER filing_submissions_immutable
    BEFORE UPDATE OR DELETE ON filing_submissions
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

CREATE TABLE filing_observations (
    id          UUID PRIMARY KEY,
    matter_id   UUID NOT NULL,
    item_id     UUID NOT NULL,
    seq         INT NOT NULL CHECK (seq >= 1),
    kind        TEXT NOT NULL CHECK (kind IN ('STAGE', 'NEGATIVE_OUTCOME', 'CLOSE_NEGATIVE', 'REOPEN', 'CORRECTION')),
    from_stage  TEXT NOT NULL,
    to_stage    TEXT NOT NULL,
    reference   TEXT NOT NULL DEFAULT '',
    observed_at TIMESTAMPTZ NOT NULL,
    evidence_ids JSONB NOT NULL DEFAULT '[]',
    actor_id    UUID NOT NULL REFERENCES users,
    reason      TEXT NOT NULL DEFAULT '',
    corrects_id UUID REFERENCES filing_observations (id),
    outcome     TEXT NOT NULL DEFAULT '',
    recorded_at TIMESTAMPTZ NOT NULL,
    cycle_no    INT NOT NULL,
    proof_epoch INT NOT NULL,
    FOREIGN KEY (matter_id, item_id) REFERENCES filing_details (matter_id, item_id),
    UNIQUE (item_id, seq),
    CHECK ((kind = 'CORRECTION') = (corrects_id IS NOT NULL))
);
CREATE TRIGGER filing_observations_append_only
    BEFORE UPDATE OR DELETE ON filing_observations
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

-- +goose Down
DROP TABLE IF EXISTS filing_observations;
DROP TABLE IF EXISTS filing_submissions;
DROP TABLE IF EXISTS filing_cycles;
DROP TABLE IF EXISTS filing_details;
