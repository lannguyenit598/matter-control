-- +goose Up
-- W3: documents with immutable versions, evidence criteria, proof, claims, assessments, disputes
-- and verifier designation. Additive to 0001/0002. Independence of review is repeated here as a
-- database CHECK (through the exact-claim composite foreign key) so a code path that forgets the
-- policy still cannot persist a self-verification.

CREATE TABLE documents (
    id                 UUID PRIMARY KEY,
    matter_id          UUID NOT NULL REFERENCES matters,
    name               TEXT NOT NULL CHECK (length(btrim(name)) > 0),
    current_version_id UUID,
    revision           BIGINT NOT NULL DEFAULT 1,
    UNIQUE (matter_id, id)
);

-- Versions are immutable and never overwritten: content is addressed by SHA-256.
CREATE TABLE document_versions (
    id             UUID PRIMARY KEY,
    matter_id      UUID NOT NULL,
    document_id    UUID NOT NULL,
    version_no     INT NOT NULL CHECK (version_no >= 1),
    predecessor_id UUID,
    filename       TEXT NOT NULL,
    media_type     TEXT NOT NULL,
    sha256         TEXT NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
    size_bytes     BIGINT NOT NULL CHECK (size_bytes >= 0),
    uploaded_by    UUID NOT NULL REFERENCES users,
    uploaded_at    TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (matter_id, document_id) REFERENCES documents (matter_id, id),
    UNIQUE (matter_id, id),
    UNIQUE (document_id, version_no)
);

-- The current pointer must name a version of THIS matter; checked at commit so the first version
-- and its promotion can be written in one transaction.
ALTER TABLE documents
    ADD FOREIGN KEY (matter_id, current_version_id) REFERENCES document_versions (matter_id, id)
    DEFERRABLE INITIALLY DEFERRED;

CREATE TRIGGER document_versions_immutable
    BEFORE UPDATE OR DELETE ON document_versions
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

CREATE TABLE signature_observations (
    id          UUID PRIMARY KEY,
    matter_id   UUID NOT NULL,
    version_id  UUID NOT NULL,
    signer      TEXT NOT NULL CHECK (length(btrim(signer)) > 0),
    signed_at   TIMESTAMPTZ NOT NULL,
    observed_by UUID NOT NULL REFERENCES users,
    recorded_at TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (matter_id, version_id) REFERENCES document_versions (matter_id, id)
);
CREATE TRIGGER signature_observations_append_only
    BEFORE UPDATE OR DELETE ON signature_observations
    FOR EACH ROW EXECUTE FUNCTION forbid_mutation();

CREATE TABLE criteria (
    id                UUID PRIMARY KEY,
    matter_id         UUID NOT NULL,
    subject_id        UUID NOT NULL,
    title             TEXT NOT NULL CHECK (length(btrim(title)) > 0),
    description       TEXT NOT NULL DEFAULT '',
    mandatory         BOOLEAN NOT NULL,
    version_rule      TEXT NOT NULL CHECK (version_rule IN ('NONE', 'CURRENT_AUTHORITATIVE', 'FIXED')),
    document_id       UUID,
    fixed_version_id  UUID,
    valid_for_seconds BIGINT NOT NULL DEFAULT 0 CHECK (valid_for_seconds >= 0),
    retired           BOOLEAN NOT NULL DEFAULT false,
    revision          BIGINT NOT NULL DEFAULT 1,
    FOREIGN KEY (matter_id, subject_id) REFERENCES graph_nodes (matter_id, id),
    FOREIGN KEY (matter_id, document_id) REFERENCES documents (matter_id, id),
    FOREIGN KEY (matter_id, fixed_version_id) REFERENCES document_versions (matter_id, id),
    UNIQUE (matter_id, id),
    CHECK ((version_rule = 'NONE' AND document_id IS NULL AND fixed_version_id IS NULL)
        OR (version_rule = 'CURRENT_AUTHORITATIVE' AND document_id IS NOT NULL AND fixed_version_id IS NULL)
        OR (version_rule = 'FIXED' AND fixed_version_id IS NOT NULL))
);
CREATE INDEX criteria_subject ON criteria (matter_id, subject_id);

CREATE TABLE evidence (
    id           UUID PRIMARY KEY,
    matter_id    UUID NOT NULL,
    kind         TEXT NOT NULL CHECK (kind IN ('DOCUMENT_VERSION', 'EXTERNAL_REFERENCE')),
    version_id   UUID,
    reference    TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    submitted_by UUID NOT NULL REFERENCES users,
    submitted_at TIMESTAMPTZ NOT NULL,
    valid_from   TIMESTAMPTZ NOT NULL,
    valid_until  TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    FOREIGN KEY (matter_id, version_id) REFERENCES document_versions (matter_id, id),
    UNIQUE (matter_id, id),
    UNIQUE (matter_id, id, submitted_by),
    CHECK ((kind = 'DOCUMENT_VERSION') = (version_id IS NOT NULL)),
    CHECK (kind = 'DOCUMENT_VERSION' OR length(btrim(reference)) > 0),
    CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- A claim offers one evidence item for one criterion revision: the only link between proof and a
-- criterion. Acceptance is per claim; there is no "evidence is verified" anywhere.
CREATE TABLE evidence_claims (
    id                 UUID PRIMARY KEY,
    matter_id          UUID NOT NULL,
    evidence_id        UUID NOT NULL,
    evidence_submitter UUID NOT NULL,
    criterion_id       UUID NOT NULL,
    criterion_revision BIGINT NOT NULL,
    claimed_by         UUID NOT NULL REFERENCES users,
    claimed_at         TIMESTAMPTZ NOT NULL,
    FOREIGN KEY (matter_id, evidence_id, evidence_submitter) REFERENCES evidence (matter_id, id, submitted_by),
    FOREIGN KEY (matter_id, criterion_id) REFERENCES criteria (matter_id, id),
    UNIQUE (matter_id, id),
    UNIQUE (matter_id, id, evidence_submitter, claimed_by),
    UNIQUE (evidence_id, criterion_id, criterion_revision)
);

CREATE TABLE assessments (
    id                  UUID PRIMARY KEY,
    matter_id           UUID NOT NULL,
    claim_id            UUID NOT NULL,
    subject_id          UUID NOT NULL,
    subject_epoch       INT NOT NULL CHECK (subject_epoch >= 0),
    verdict             TEXT NOT NULL CHECK (verdict IN ('ACCEPTED', 'REJECTED')),
    reviewer_id         UUID NOT NULL REFERENCES users,
    rationale           TEXT NOT NULL CHECK (length(btrim(rationale)) > 0),
    assessed_version_id UUID,
    effective_until     TIMESTAMPTZ,
    recorded_at         TIMESTAMPTZ NOT NULL,
    superseded_by       UUID,
    revoked_at          TIMESTAMPTZ,
    revoked_by          UUID REFERENCES users,
    revoked_reason      TEXT,
    evidence_submitter  UUID NOT NULL,
    claimant            UUID NOT NULL,
    FOREIGN KEY (matter_id, claim_id, evidence_submitter, claimant)
        REFERENCES evidence_claims (matter_id, id, evidence_submitter, claimed_by),
    FOREIGN KEY (matter_id, subject_id) REFERENCES graph_nodes (matter_id, id),
    FOREIGN KEY (matter_id, assessed_version_id) REFERENCES document_versions (matter_id, id),
    UNIQUE (matter_id, id),
    -- RULE-006 enforced by the database as well: nobody reviews proof they supplied or offered.
    CHECK (reviewer_id <> evidence_submitter AND reviewer_id <> claimant),
    CHECK ((revoked_at IS NULL) = (revoked_by IS NULL))
);
ALTER TABLE assessments
    ADD FOREIGN KEY (matter_id, superseded_by) REFERENCES assessments (matter_id, id)
    DEFERRABLE INITIALLY DEFERRED;
CREATE INDEX assessments_claim ON assessments (matter_id, claim_id);

CREATE TABLE disputes (
    id            UUID PRIMARY KEY,
    matter_id     UUID NOT NULL,
    assessment_id UUID NOT NULL,
    raised_by     UUID NOT NULL REFERENCES users,
    reason        TEXT NOT NULL CHECK (length(btrim(reason)) > 0),
    raised_at     TIMESTAMPTZ NOT NULL,
    resolved_at   TIMESTAMPTZ,
    resolved_by   UUID REFERENCES users,
    resolution    TEXT,
    FOREIGN KEY (matter_id, assessment_id) REFERENCES assessments (matter_id, id),
    CHECK ((resolved_at IS NULL) = (resolved_by IS NULL))
);

-- Matter-level verifier designation. Matter OWNER alone is not verifier authority.
CREATE TABLE verifier_designations (
    matter_id     UUID NOT NULL,
    user_id       UUID NOT NULL,
    active        BOOLEAN NOT NULL,
    designated_by UUID NOT NULL REFERENCES users,
    designated_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (matter_id, user_id),
    FOREIGN KEY (matter_id, user_id) REFERENCES matter_memberships (matter_id, user_id)
);

-- +goose Down
DROP TABLE IF EXISTS verifier_designations;
DROP TABLE IF EXISTS disputes;
DROP TABLE IF EXISTS assessments;
DROP TABLE IF EXISTS evidence_claims;
DROP TABLE IF EXISTS evidence;
DROP TABLE IF EXISTS criteria;
DROP TABLE IF EXISTS signature_observations;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_matter_id_current_version_id_fkey;
DROP TABLE IF EXISTS document_versions;
DROP TABLE IF EXISTS documents;
