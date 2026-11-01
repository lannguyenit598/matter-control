-- +goose Up
-- D-9 (ratified 2026-10-31, Z-F-01/Z-F-02): a criterion's purpose gains the SIGNATURE value. A
-- proof-required filing proves its signatures through SIGNATURE-purpose criteria; the existing
-- PACKAGE and OUTCOME readings are unchanged and no row is rewritten.
ALTER TABLE criteria DROP CONSTRAINT criteria_purpose_check;
ALTER TABLE criteria ADD CONSTRAINT criteria_purpose_check CHECK (purpose IN ('PACKAGE', 'SIGNATURE', 'OUTCOME'));

-- +goose Down
ALTER TABLE criteria DROP CONSTRAINT criteria_purpose_check;
ALTER TABLE criteria ADD CONSTRAINT criteria_purpose_check CHECK (purpose IN ('PACKAGE', 'OUTCOME'));
