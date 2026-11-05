-- +goose Up
-- D-9 (ratified 2026-10-31, Z-F-01/Z-F-02): a criterion's purpose gains the SIGNATURE value. A
-- proof-required filing proves its signatures through SIGNATURE-purpose criteria; the existing
-- PACKAGE and OUTCOME readings are unchanged and no row is rewritten.
ALTER TABLE criteria DROP CONSTRAINT criteria_purpose_check;
ALTER TABLE criteria ADD CONSTRAINT criteria_purpose_check CHECK (purpose IN ('PACKAGE', 'SIGNATURE', 'OUTCOME'));

-- +goose Down
-- Data-safe rollback (OV-F1-03): re-adding the two-value CHECK would reject any SIGNATURE row
-- (23514). Every SIGNATURE criterion is first mapped back to PACKAGE — the only reading every
-- pre-0011 row had, so claims and assessments stay valid and the legacy semantics are exact.
-- Claims made against SIGNATURE criteria keep their criterion revision; the purpose is fixed at
-- creation and never part of the claim binding.
UPDATE criteria SET purpose = 'PACKAGE' WHERE purpose = 'SIGNATURE';
ALTER TABLE criteria DROP CONSTRAINT criteria_purpose_check;
ALTER TABLE criteria ADD CONSTRAINT criteria_purpose_check CHECK (purpose IN ('PACKAGE', 'OUTCOME'));
