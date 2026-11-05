<!-- docs/architecture/data-model.md, source lines 1-5 -->
# Data Model — PostgreSQL

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b` (pgx v5, Goose, sqlc, version CAS, PostgreSQL 18 in CI).
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**. PostgreSQL is retained; database hosting is unresolved (TB-02). D1 is not a substitute.

<!-- docs/architecture/data-model.md, source lines 127-128 -->
## 4. Proof


<!-- docs/architecture/data-model.md, source lines 159-209 -->
CREATE TABLE evidence (id UUID PRIMARY KEY, matter_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('DOCUMENT_VERSION','EXTERNAL_REFERENCE','OBSERVATION')),
  document_version_id UUID, FOREIGN KEY (matter_id, document_version_id) REFERENCES document_versions (matter_id, id),
  external_reference TEXT, description TEXT NOT NULL,
  valid_from TIMESTAMPTZ, valid_until TIMESTAMPTZ, CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_from < valid_until),
  CHECK (CASE kind WHEN 'DOCUMENT_VERSION' THEN document_version_id IS NOT NULL
                   WHEN 'EXTERNAL_REFERENCE' THEN document_version_id IS NULL AND external_reference IS NOT NULL
                   WHEN 'OBSERVATION' THEN document_version_id IS NULL ELSE false END),
  submitted_by UUID NOT NULL, submitted_at TIMESTAMPTZ NOT NULL, withdrawn_at TIMESTAMPTZ, withdrawn_reason TEXT,
  CHECK (num_nonnulls(withdrawn_at, withdrawn_reason) IN (0, 2)), revision BIGINT NOT NULL DEFAULT 1,
  UNIQUE (matter_id, id), UNIQUE (matter_id, id, submitted_by));
CREATE TABLE evidence_claims (id UUID PRIMARY KEY, matter_id UUID NOT NULL,
  evidence_id UUID NOT NULL, evidence_submitter_id UUID NOT NULL,
  FOREIGN KEY (matter_id, evidence_id, evidence_submitter_id) REFERENCES evidence (matter_id, id, submitted_by),
  criterion_revision_id UUID NOT NULL, FOREIGN KEY (matter_id, criterion_revision_id) REFERENCES criterion_revisions (matter_id, id),
  component_key TEXT,  -- NULL = implicit single component; trigger claim_component_shape: NULL iff revision declares none
  FOREIGN KEY (matter_id, criterion_revision_id, component_key)
    REFERENCES criterion_components (matter_id, criterion_revision_id, key),  -- unchecked only when NULL
  revision BIGINT NOT NULL DEFAULT 1,  -- CAS target for assess/revoke/dispute
  claimed_by UUID NOT NULL, claimed_at TIMESTAMPTZ NOT NULL,
  UNIQUE NULLS NOT DISTINCT (evidence_id, criterion_revision_id, component_key),
  UNIQUE (matter_id, id), UNIQUE (matter_id, id, evidence_submitter_id, claimed_by));
CREATE TABLE evidence_assessments (id UUID PRIMARY KEY, matter_id UUID NOT NULL,
  claim_id UUID NOT NULL, evidence_submitter_id UUID NOT NULL, claimant_id UUID NOT NULL,
  FOREIGN KEY (matter_id, claim_id, evidence_submitter_id, claimant_id)
    REFERENCES evidence_claims (matter_id, id, evidence_submitter_id, claimed_by),
  subject_epoch INT NOT NULL CHECK (subject_epoch >= 0), verdict TEXT NOT NULL CHECK (verdict IN ('ACCEPTED','REJECTED')),
  reviewer_id UUID NOT NULL, rationale TEXT NOT NULL, assessed_document_version_id UUID,
  FOREIGN KEY (matter_id, assessed_document_version_id) REFERENCES document_versions (matter_id, id),
  effective_until TIMESTAMPTZ, assessed_at TIMESTAMPTZ NOT NULL,
  superseded_by_id UUID,
  FOREIGN KEY (matter_id, superseded_by_id) REFERENCES evidence_assessments (matter_id, id) DEFERRABLE INITIALLY DEFERRED,
  revoked_at TIMESTAMPTZ, revoked_by UUID, revoke_reason TEXT,
  CHECK (num_nonnulls(revoked_at, revoked_by, revoke_reason) IN (0, 3)), UNIQUE (matter_id, id),
  CHECK (reviewer_id <> evidence_submitter_id AND reviewer_id <> claimant_id),   -- no self-verification
  CHECK (revoked_by IS NULL OR (revoked_by <> evidence_submitter_id AND revoked_by <> claimant_id)));
CREATE UNIQUE INDEX one_current_assessment ON evidence_assessments (claim_id, subject_epoch) WHERE superseded_by_id IS NULL;
-- trigger assessment_epoch_current (insert): subject_epoch = current proof_epoch of the claim's subject
--   (claim → criterion revision → evidence requirement → node/filing); epochs only rise under the same matter lock
-- trigger assessment_version_consistent (insert): assessed_document_version_id IS NOT DISTINCT FROM the claim's
--   evidence.document_version_id (evidence is immutable), and evidence.kind = 'DOCUMENT_VERSION' when the claim's
--   criterion revision has version_rule <> 'NONE'; trigger claim_version_rule_kind (evidence_claims insert) applies
--   the same kind rule at claim time (evidence-model §2 rule 4)
CREATE TABLE evidence_disputes (id UUID PRIMARY KEY, matter_id UUID NOT NULL, assessment_id UUID NOT NULL,
  FOREIGN KEY (matter_id, assessment_id) REFERENCES evidence_assessments (matter_id, id),
  CHECK (num_nonnulls(resolved_by, outcome, rationale, resolved_at) IN (0, 4)), UNIQUE (matter_id, id),
  raised_by UUID NOT NULL, reason TEXT NOT NULL, raised_at TIMESTAMPTZ NOT NULL,
  resolved_by UUID, outcome TEXT CHECK (outcome IN ('UPHOLD','REVOKE')), rationale TEXT, resolved_at TIMESTAMPTZ,
  CHECK (resolved_by IS NULL OR resolved_by <> raised_by));
CREATE UNIQUE INDEX one_open_dispute ON evidence_disputes (assessment_id) WHERE resolved_at IS NULL;
```

<!-- docs/architecture/data-model.md, source lines 211-214 -->
Proof notes:
- The `current_revision_id` FK is circular, so it is added by `ALTER TABLE` and deferred.
- Supersession inside one transaction: set `superseded_by_id` on the current row to the pre-generated new id, then insert the new row (the partial unique index is immediate; the self-FK is deferred).
- Column grants allow `UPDATE` only on withdrawal/revision columns, `superseded_by_id`/`revoked_*`, dispute resolution columns and `current_revision_id`/`retired_at`/`revision`.

<!-- docs/architecture/data-model.md, source lines 216-222 -->
## 5. Documents, filing, context

- `documents (id, matter_id, title, current_version_id, revision, UNIQUE (matter_id, id), FOREIGN KEY (matter_id, id, current_version_id) REFERENCES document_versions (matter_id, document_id, id) DEFERRABLE INITIALLY DEFERRED)`.
- `document_versions (id, matter_id, document_id, seq, source, content_object_id, external_reference, sha256, size_bytes, media_type, predecessor_version_id, uploaded_by, availability, FKs (matter_id, document_id) → documents, (matter_id, document_id, predecessor_version_id) → document_versions, (matter_id, content_object_id) → content_objects, CHECK (CASE source WHEN 'CONTENT' THEN content_object_id IS NOT NULL AND external_reference IS NULL WHEN 'EXTERNAL_REFERENCE' THEN content_object_id IS NULL AND external_reference IS NOT NULL ELSE false END), UNIQUE (document_id, seq), UNIQUE (matter_id, id), UNIQUE (matter_id, document_id, id))`.
- `content_objects (id, matter_id, object_key UNIQUE, status, expected_sha256, expected_size, expires_at, committed_at, UNIQUE (matter_id, id))`.
- `signature_observations (id, matter_id, document_version_id, signatory_party_id | signatory_entity_ref_id | signatory_label, CHECK (num_nonnulls(signatory_party_id, signatory_entity_ref_id, signatory_label) = 1), observed, evidence_id, observed_at, recorded_by, composite FKs per §1a)`.
- `filings (id, matter_id, requirement_id, authority_party_id, owner_user_id, stage CHECK (9 values), execution_state, proof_required BOOLEAN NOT NULL, verification_state, CHECK ((verification_state IS NULL) = (NOT proof_required)), proof_epoch INT NOT NULL DEFAULT 0 CHECK (proof_epoch >= 0), proof_epoch_opened_at, due_at, negative_outcome CHECK IN ('REJECTED','WITHDRAWN'), negative_outcome_epoch INT, CHECK (num_nonnulls(negative_outcome, negative_outcome_epoch) IN (0, 2)), revision, UNIQUE (matter_id, id), FKs per §1a)`; `filing_cycles (matter_id, filing_id, cycle_no, opened_in_epoch, kind, request_reference, owner_user_id, due_at, opened_at, closed_at, UNIQUE (filing_id, cycle_no), UNIQUE (matter_id, filing_id, cycle_no))`; `filing_stage_observations (matter_id, filing_id, proof_epoch, …)` (append-only) + `filing_observation_evidence (matter_id, observation_id, evidence_id)`; `filing_submissions (id, matter_id, filing_id, cycle_no, FK (matter_id, filing_id, cycle_no) → filing_cycles, UNIQUE (matter_id, id), submission_reference NOT NULL, submitted_at NOT NULL)`; `filing_submission_items (matter_id, submission_id, document_version_id, composite FKs, PRIMARY KEY (submission_id, document_version_id))`.
