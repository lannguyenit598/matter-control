-- +goose Up
-- W6 data operations: the RULE-014 import-source registry. One row per imported
-- record identified by (matter, source identity, row key); the content hash decides
-- identical-retry replay vs explicit content conflict. Items themselves live in the
-- work graph; this table never grants verification or membership.
CREATE TABLE import_sources (
    matter_id         UUID NOT NULL REFERENCES matters,
    source_name       TEXT NOT NULL,
    row_key           TEXT NOT NULL,
    item_id           UUID NOT NULL,
    content_hash      TEXT NOT NULL,
    first_imported_at TIMESTAMPTZ NOT NULL DEFAULT statement_timestamp(),
    PRIMARY KEY (matter_id, source_name, row_key)
);

-- +goose Down
DROP TABLE IF EXISTS import_sources;
