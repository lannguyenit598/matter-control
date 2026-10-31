-- +goose Up
-- BF-01: a criterion proves either filing package/signature readiness (gates submission) or the
-- authority outcome (accepted independently after submission). The purpose is fixed at creation.
-- Every existing row becomes PACKAGE: that keeps its submission gate exactly as before. Nothing
-- is inferred from titles, and no historical fact or verdict is rewritten.
ALTER TABLE criteria ADD COLUMN purpose TEXT NOT NULL DEFAULT 'PACKAGE' CHECK (purpose IN ('PACKAGE', 'OUTCOME'));

-- +goose Down
ALTER TABLE criteria DROP COLUMN IF EXISTS purpose;
