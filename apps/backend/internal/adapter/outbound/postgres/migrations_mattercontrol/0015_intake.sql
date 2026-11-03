-- +goose Up
-- RLF-06: human-triaged intake inside ONE existing Matter. The original request text, its
-- received time and attributable requester are kept as recorded; triage names the accountable
-- actor; conversion creates real work through the ordinary commands. Intake is not a hidden
-- matter lifecycle, a workspace inbox, or an external submission channel.

CREATE TABLE intake_records (
    id             UUID PRIMARY KEY,
    matter_id      UUID NOT NULL REFERENCES matters,
    title          TEXT NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 300),
    request_text   TEXT NOT NULL DEFAULT '',
    requester      TEXT NOT NULL DEFAULT '',
    received_at    TIMESTAMPTZ NOT NULL,
    attachments    JSONB NOT NULL DEFAULT '[]',
    status         TEXT NOT NULL CHECK (status IN ('PENDING', 'CONVERTED', 'DECLINED')),
    triage_reason  TEXT NOT NULL DEFAULT '',
    triaged_by     UUID,
    triaged_at     TIMESTAMPTZ,
    item_id        UUID,
    recorded_by    UUID NOT NULL REFERENCES users,
    created_at     TIMESTAMPTZ NOT NULL,
    revision       BIGINT NOT NULL DEFAULT 1,
    CHECK ((status = 'DECLINED') = (length(btrim(triage_reason)) > 0))
);

CREATE INDEX intake_records_matter_idx ON intake_records (matter_id, status);
CREATE INDEX intake_records_item_idx ON intake_records (item_id);

-- +goose Down
DROP TABLE IF EXISTS intake_records;
