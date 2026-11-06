-- +goose Up
-- MC-ZCODE-TERMSHEET-01: contract term lines. One line is ONE typed fact about one contract
-- document version (design 2026-11-05 §2.2): the field vocabulary is a closed enum, every line
-- pins its source document version and row content hash, and promotion only records the link to
-- the DRAFT record the fact operationalizes. Facts never complete or verify anything.

CREATE TABLE contract_term_lines (
    id                  UUID PRIMARY KEY,
    matter_id           UUID NOT NULL REFERENCES matters,
    document_version_id UUID NOT NULL,
    field               TEXT NOT NULL CHECK (field IN ('PARTY', 'EFFECTIVE_DATE', 'RENEWAL_DATE', 'NOTICE_PERIOD', 'VALUE_AMOUNT', 'VALUE_CURRENCY', 'GOVERNING_LAW', 'NOTE')),
    value_text          TEXT,
    value_date          TIMESTAMPTZ,
    row_key             TEXT NOT NULL,
    content_hash        TEXT NOT NULL,
    promoted_ref        UUID,
    promoted_kind       TEXT CHECK (promoted_kind IN ('context_record', 'milestone', 'action', 'requirement')),
    promoted_at         TIMESTAMPTZ,
    imported_by         UUID NOT NULL REFERENCES users,
    created_at          TIMESTAMPTZ NOT NULL,
    updated_at          TIMESTAMPTZ NOT NULL,
    revision            BIGINT NOT NULL DEFAULT 1,
    FOREIGN KEY (matter_id, document_version_id) REFERENCES document_versions (matter_id, id),
    UNIQUE (document_version_id, field, row_key)
);

CREATE INDEX contract_term_lines_matter_idx ON contract_term_lines (matter_id, document_version_id);

-- +goose Down
DROP TABLE IF EXISTS contract_term_lines;
