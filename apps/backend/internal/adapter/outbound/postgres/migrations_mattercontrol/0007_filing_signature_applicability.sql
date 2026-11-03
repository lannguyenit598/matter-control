-- +goose Up
-- F03: the explicit OWNER no-signature applicability decision on a filing. It is
-- independent of the outcome-verification flag and is the only waiver of the
-- package/signature guards; the rationale, decider and instant are retained.
ALTER TABLE filing_details ADD COLUMN signature_not_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE filing_details ADD COLUMN signature_not_required_reason TEXT;
ALTER TABLE filing_details ADD COLUMN signature_not_required_by UUID REFERENCES users;
ALTER TABLE filing_details ADD COLUMN signature_not_required_at TIMESTAMPTZ;

-- +goose Down
ALTER TABLE filing_details DROP COLUMN IF EXISTS signature_not_required_at;
ALTER TABLE filing_details DROP COLUMN IF EXISTS signature_not_required_by;
ALTER TABLE filing_details DROP COLUMN IF EXISTS signature_not_required_reason;
ALTER TABLE filing_details DROP COLUMN IF EXISTS signature_not_required;
