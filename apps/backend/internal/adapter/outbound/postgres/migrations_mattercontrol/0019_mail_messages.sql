-- +goose Up
-- MC-ZCODE-NOTIF-MAILPITCH-20261110: email capture (J10). An uploaded .eml is stored as an
-- ordinary document + immutable version; this table records the parsed envelope so a matter can
-- list correspondence without re-parsing raw bytes. The envelope is a capture aid, never legal
-- state. Every row traces to exactly one upload by one active member; there is no auto-ingestion.

CREATE TABLE mail_messages (
    id          UUID PRIMARY KEY,
    matter_id   UUID NOT NULL REFERENCES matters,
    document_id UUID NOT NULL REFERENCES documents,
    version_id  UUID NOT NULL REFERENCES document_versions,
    direction   TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    sender      TEXT NOT NULL CHECK (length(sender) BETWEEN 3 AND 320),
    recipients  TEXT[] NOT NULL DEFAULT '{}',
    subject     TEXT NOT NULL DEFAULT '',
    excerpt     TEXT NOT NULL DEFAULT '',
    sent_at     TIMESTAMPTZ,
    recorded_by UUID NOT NULL REFERENCES users,
    created_at  TIMESTAMPTZ NOT NULL,
    UNIQUE (matter_id, id)
);

CREATE INDEX mail_messages_matter_idx ON mail_messages (matter_id, created_at DESC, id DESC);

-- +goose Down
DROP TABLE IF EXISTS mail_messages;
