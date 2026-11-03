-- +goose Up
-- RLF-07: Matter-scoped versioned guidance. OWNER/EDITOR draft, only the matter OWNER publishes
-- an immutable revision. Guidance is readable text with attributable exact-version references;
-- it is kept apart from matter facts, legal authority, evidence and permissions — publishing
-- changes no legal state.

CREATE TABLE guidance_documents (
    id         UUID PRIMARY KEY,
    matter_id  UUID NOT NULL REFERENCES matters,
    title      TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 300),
    created_by UUID NOT NULL REFERENCES users,
    created_at TIMESTAMPTZ NOT NULL,
    revision   BIGINT NOT NULL DEFAULT 1,
    -- RLF-07 parity: the memory double rejects duplicate titles in one matter; PostgreSQL
    -- enforces the same rule here (the service answers 409 before the constraint fires).
    UNIQUE (matter_id, title)
);

CREATE TABLE guidance_revisions (
    id           UUID PRIMARY KEY,
    document_id  UUID NOT NULL REFERENCES guidance_documents,
    matter_id    UUID NOT NULL REFERENCES matters,
    no           BIGINT NOT NULL,
    body         TEXT NOT NULL,
    source_refs  JSONB NOT NULL DEFAULT '[]',
    status       TEXT NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED')),
    created_by   UUID NOT NULL REFERENCES users,
    created_at   TIMESTAMPTZ NOT NULL,
    published_by UUID,
    published_at TIMESTAMPTZ,
    UNIQUE (document_id, no)
);

CREATE INDEX guidance_revisions_doc_idx ON guidance_revisions (document_id, no);
CREATE INDEX guidance_documents_matter_idx ON guidance_documents (matter_id);

-- +goose Down
DROP TABLE IF EXISTS guidance_revisions;
DROP TABLE IF EXISTS guidance_documents;
