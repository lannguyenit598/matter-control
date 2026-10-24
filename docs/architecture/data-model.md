# Data Model — PostgreSQL

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b` (pgx v5, Goose, sqlc, version CAS, PostgreSQL 18 in CI).
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**. PostgreSQL is retained; database hosting is unresolved (TB-02). D1 is not a substitute.

## 1. Conventions

- UUIDv7 primary keys (template `system.UUIDv7`). Every matter-scoped table has `matter_id` and `UNIQUE (matter_id, id)`; child references use **composite foreign keys** `(matter_id, x_id)` so a cross-matter reference is structurally impossible (AC-135, NFR-005).
- Mutable rows carry `revision BIGINT NOT NULL DEFAULT 1` for CAS (`UPDATE … WHERE id=$1 AND revision=$2`).
- Enumerations are PostgreSQL `CHECK` constraints on `TEXT` (simpler expand/contract than enum types).
- Times are `TIMESTAMPTZ`. No hard deletes for domain tables; the application role has no `DELETE` privilege on them.
- Migrations: Goose, expand-only for rolling deploys (template practice). Goose's session advisory lock is fine on a direct connection; it is unsupported through Hyperdrive, so migrations must not run via Hyperdrive (TB-09).

## 2. Access and matter core (DDL sketch)

```sql
CREATE TABLE users (id UUID PRIMARY KEY, idp_issuer TEXT NOT NULL, idp_subject TEXT NOT NULL,
  display_name TEXT NOT NULL, UNIQUE (idp_issuer, idp_subject));
CREATE TABLE workspaces (id UUID PRIMARY KEY, name TEXT NOT NULL, revision BIGINT NOT NULL DEFAULT 1);
CREATE TABLE workspace_memberships (workspace_id UUID REFERENCES workspaces, user_id UUID REFERENCES users,
  role TEXT NOT NULL CHECK (role IN ('OWNER','MEMBER')), status TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED')),
  revision BIGINT NOT NULL DEFAULT 1, PRIMARY KEY (workspace_id, user_id));
CREATE TABLE matters (id UUID PRIMARY KEY, workspace_id UUID NOT NULL REFERENCES workspaces,
  title TEXT NOT NULL, revision BIGINT NOT NULL DEFAULT 1,
  event_seq BIGINT NOT NULL DEFAULT 0,               -- last assigned history sequence
  last_recorded_at TIMESTAMPTZ NOT NULL,              -- enforces nondecreasing recorded time
  next_boundary_at TIMESTAMPTZ, boundaries_applied_until TIMESTAMPTZ NOT NULL);
CREATE TABLE matter_memberships (matter_id UUID REFERENCES matters, user_id UUID REFERENCES users,
  role TEXT NOT NULL CHECK (role IN ('OWNER','EDITOR','VIEWER')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED')), revision BIGINT NOT NULL DEFAULT 1,
  PRIMARY KEY (matter_id, user_id));
CREATE TABLE verifier_designations (matter_id UUID, user_id UUID, active BOOLEAN NOT NULL,
  designated_by UUID NOT NULL, reason TEXT NOT NULL, PRIMARY KEY (matter_id, user_id),
  FOREIGN KEY (matter_id, user_id) REFERENCES matter_memberships);
```

Last-OWNER protection: enforced in the membership command under the matter lock (count active owners excluding target) plus a deferred constraint trigger that rejects a commit leaving a matter with zero active OWNERs (AC-158).

## 3. Work graph

```sql
CREATE TABLE graph_nodes (id UUID PRIMARY KEY, matter_id UUID NOT NULL REFERENCES matters,
  kind TEXT NOT NULL CHECK (kind IN ('REQUIREMENT','ACTION')), UNIQUE (matter_id, id), UNIQUE (id, kind));

CREATE TABLE requirements (
  id UUID PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'REQUIREMENT' CHECK (kind='REQUIREMENT'),
  matter_id UUID NOT NULL, FOREIGN KEY (id, kind) REFERENCES graph_nodes (id, kind),
  FOREIGN KEY (matter_id, id) REFERENCES graph_nodes (matter_id, id),
  workstream_id UUID, FOREIGN KEY (matter_id, workstream_id) REFERENCES workstreams (matter_id, id),
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0), outcome TEXT NOT NULL CHECK (length(btrim(outcome)) > 0),
  owner_user_id UUID, FOREIGN KEY (matter_id, owner_user_id) REFERENCES matter_memberships (matter_id, user_id),
  due_at TIMESTAMPTZ,
  execution_state TEXT NOT NULL CHECK (execution_state IN ('NOT_STARTED','IN_PROGRESS','WAITING','COMPLETED','CANCELLED')),
  dependency_state TEXT NOT NULL CHECK (dependency_state IN ('READY','BLOCKED')),
  dependency_reasons JSONB NOT NULL DEFAULT '[]',     -- derived explanation cache, typed by Go struct
  verification_state TEXT NOT NULL CHECK (verification_state IN ('NOT_REQUIRED','UNVERIFIED','PARTIALLY_VERIFIED','VERIFIED','DISPUTED')),
  verification_applicability TEXT NOT NULL DEFAULT 'REQUIRED' CHECK (verification_applicability IN ('REQUIRED','NOT_REQUIRED')),
  applicability_reason TEXT, proof_epoch INT NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ,
  critical_escalation_reason TEXT, imported_verification_claim TEXT,
  revision BIGINT NOT NULL DEFAULT 1,
  CHECK ((execution_state='COMPLETED') = (completed_at IS NOT NULL)),
  CHECK (verification_applicability='REQUIRED' OR applicability_reason IS NOT NULL));
-- actions: same shape with kind='ACTION', proof_required BOOLEAN, verification_state NULL unless proof_required
CREATE TABLE requirement_actions (matter_id UUID, requirement_id UUID, action_id UUID,
  PRIMARY KEY (requirement_id, action_id),
  FOREIGN KEY (matter_id, requirement_id) REFERENCES requirements (matter_id, id),
  FOREIGN KEY (matter_id, action_id) REFERENCES actions (matter_id, id));

CREATE TABLE dependency_edges (id UUID PRIMARY KEY, matter_id UUID NOT NULL,
  upstream_id UUID NOT NULL, downstream_id UUID NOT NULL,
  FOREIGN KEY (matter_id, upstream_id) REFERENCES graph_nodes (matter_id, id),
  FOREIGN KEY (matter_id, downstream_id) REFERENCES graph_nodes (matter_id, id),
  gate TEXT NOT NULL CHECK (gate IN ('COMPLETION','COMPLETION_AND_VERIFIED')),
  reason TEXT NOT NULL, created_by UUID NOT NULL, removed_at TIMESTAMPTZ, removal_reason TEXT,
  revision BIGINT NOT NULL DEFAULT 1, CHECK (upstream_id <> downstream_id),
  CHECK ((removed_at IS NULL) = (removal_reason IS NULL)));
CREATE UNIQUE INDEX dependency_edges_active_pair ON dependency_edges (upstream_id, downstream_id) WHERE removed_at IS NULL;
CREATE INDEX dependency_edges_downstream ON dependency_edges (matter_id, downstream_id) WHERE removed_at IS NULL;
```

`dependency_reasons` is a derived explanation cache recomputed with the state, not a metadata store; all business fields are typed columns. Other tables: `workstreams`, `milestones (critical BOOLEAN, due_at, readiness, satisfied_count, total_count, revision)`, `milestone_prerequisites (milestone_id, requirement_id, added_reason, removed_at, removal_reason)`, `waiting_on (subject_node_id | subject_filing_id with CHECK exactly one, party_id, condition_text, internal_owner_id NOT NULL, reason NOT NULL, follow_up_due_at, resolved_at, response_reference)`.

## 4. Proof

```sql
CREATE TABLE evidence_requirements (id UUID PRIMARY KEY, matter_id UUID NOT NULL,
  subject_node_id UUID, subject_filing_id UUID,
  CHECK (num_nonnulls(subject_node_id, subject_filing_id) = 1),
  current_revision_id UUID, retired_at TIMESTAMPTZ, UNIQUE (matter_id, id));
CREATE TABLE criterion_revisions (id UUID PRIMARY KEY, matter_id UUID NOT NULL, evidence_requirement_id UUID NOT NULL,
  rev_no INT NOT NULL, mandatory BOOLEAN NOT NULL, applicable BOOLEAN NOT NULL, applicability_reason TEXT,
  acceptable_proof TEXT NOT NULL,
  version_rule TEXT NOT NULL CHECK (version_rule IN ('CURRENT_AUTHORITATIVE','FIXED','NONE')),
  document_id UUID, fixed_document_version_id UUID,
  CHECK ((version_rule='CURRENT_AUTHORITATIVE') = (document_id IS NOT NULL AND fixed_document_version_id IS NULL)
      OR (version_rule='FIXED' AND fixed_document_version_id IS NOT NULL) OR (version_rule='NONE')),
  validity_required BOOLEAN NOT NULL, reason TEXT NOT NULL, created_by UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (evidence_requirement_id, rev_no), UNIQUE (matter_id, id));
CREATE TABLE criterion_components (criterion_revision_id UUID REFERENCES criterion_revisions,
  key TEXT NOT NULL, label TEXT NOT NULL, mandatory BOOLEAN NOT NULL, PRIMARY KEY (criterion_revision_id, key));

CREATE TABLE evidence (id UUID PRIMARY KEY, matter_id UUID NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('DOCUMENT_VERSION','EXTERNAL_REFERENCE','OBSERVATION')),
  document_version_id UUID, FOREIGN KEY (matter_id, document_version_id) REFERENCES document_versions (matter_id, id),
  external_reference TEXT, description TEXT NOT NULL,
  valid_from TIMESTAMPTZ, valid_until TIMESTAMPTZ, CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_from < valid_until),
  CHECK ((kind='DOCUMENT_VERSION') = (document_version_id IS NOT NULL)),
  submitted_by UUID NOT NULL, submitted_at TIMESTAMPTZ NOT NULL, withdrawn_at TIMESTAMPTZ, withdrawn_reason TEXT,
  UNIQUE (matter_id, id), UNIQUE (id, submitted_by));
CREATE TABLE evidence_claims (id UUID PRIMARY KEY, matter_id UUID NOT NULL,
  evidence_id UUID NOT NULL, evidence_submitter_id UUID NOT NULL,
  FOREIGN KEY (evidence_id, evidence_submitter_id) REFERENCES evidence (id, submitted_by),
  criterion_revision_id UUID NOT NULL, FOREIGN KEY (matter_id, criterion_revision_id) REFERENCES criterion_revisions (matter_id, id),
  component_key TEXT NOT NULL DEFAULT '',             -- '' = implicit single component
  claimed_by UUID NOT NULL, claimed_at TIMESTAMPTZ NOT NULL,
  UNIQUE (evidence_id, criterion_revision_id, component_key),
  UNIQUE (id, evidence_submitter_id, claimed_by));
CREATE TABLE evidence_assessments (id UUID PRIMARY KEY, matter_id UUID NOT NULL,
  claim_id UUID NOT NULL, evidence_submitter_id UUID NOT NULL, claimant_id UUID NOT NULL,
  FOREIGN KEY (claim_id, evidence_submitter_id, claimant_id) REFERENCES evidence_claims (id, evidence_submitter_id, claimed_by),
  subject_epoch INT NOT NULL, verdict TEXT NOT NULL CHECK (verdict IN ('ACCEPTED','REJECTED')),
  reviewer_id UUID NOT NULL, rationale TEXT NOT NULL, assessed_document_version_id UUID,
  effective_until TIMESTAMPTZ, assessed_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ, revoked_by UUID, revoke_reason TEXT,
  CHECK (reviewer_id <> evidence_submitter_id AND reviewer_id <> claimant_id),   -- no self-verification
  CHECK (revoked_by IS NULL OR (revoked_by <> evidence_submitter_id AND revoked_by <> claimant_id)));
CREATE TABLE evidence_disputes (id UUID PRIMARY KEY, matter_id UUID NOT NULL, assessment_id UUID NOT NULL REFERENCES evidence_assessments,
  raised_by UUID NOT NULL, reason TEXT NOT NULL, raised_at TIMESTAMPTZ NOT NULL,
  resolved_by UUID, outcome TEXT CHECK (outcome IN ('UPHOLD','REVOKE')), rationale TEXT, resolved_at TIMESTAMPTZ,
  CHECK (resolved_by IS NULL OR resolved_by <> raised_by));
CREATE UNIQUE INDEX one_open_dispute ON evidence_disputes (assessment_id) WHERE resolved_at IS NULL;
```

## 5. Documents, filing, context

- `documents (id, matter_id, title, current_version_id, revision, FOREIGN KEY (id, current_version_id) REFERENCES document_versions (document_id, id) DEFERRABLE)`.
- `document_versions (id, matter_id, document_id, seq, source, content_object_id, external_reference, sha256, size_bytes, media_type, predecessor_version_id, uploaded_by, availability, UNIQUE (document_id, seq), UNIQUE (document_id, id), UNIQUE (matter_id, id))`.
- `content_objects (id, matter_id, object_key UNIQUE, status, expected_sha256, expected_size, expires_at, committed_at)`.
- `signature_observations (id, matter_id, document_version_id, signatory_party_id | signatory_entity_ref_id | signatory_label, observed, evidence_id, observed_at, recorded_by)`.
- `filings (id, matter_id, requirement_id, authority_party_id, owner_user_id, stage CHECK (9 values), execution_state, verification_state NULL, proof_epoch, due_at, negative_outcome CHECK IN ('REJECTED','WITHDRAWN'), revision)`; `filing_cycles (filing_id, cycle_no, kind, request_reference, owner_user_id, due_at, opened_at, closed_at, UNIQUE (filing_id, cycle_no))`; `filing_stage_observations` (append-only); `filing_submissions (id, filing_id, cycle_no, submission_reference NOT NULL, submitted_at NOT NULL)`; `filing_submission_items (submission_id, document_version_id, PRIMARY KEY (submission_id, document_version_id))`.
- `external_parties`, `entity_references`, `decisions`, `findings`, `risks` with typed columns; link tables `decision_subjects`, `finding_subjects`, `risk_subjects`, `entity_reference_links`, each with composite same-matter FKs.

## 6. History, receipts, security audit

```sql
CREATE TABLE domain_events (matter_id UUID NOT NULL REFERENCES matters, seq BIGINT NOT NULL,
  id UUID NOT NULL UNIQUE, type TEXT NOT NULL, schema_version INT NOT NULL,
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('USER','SYSTEM_CLOCK')), actor_id UUID,
  target_kind TEXT NOT NULL, target_id UUID NOT NULL,
  effective_at TIMESTAMPTZ NOT NULL, recorded_at TIMESTAMPTZ NOT NULL, CHECK (effective_at <= recorded_at),
  cause_seq BIGINT, correlation_id UUID, command_key UUID, reason TEXT,
  before JSONB, after JSONB,                 -- serialized typed event struct; schema per (type, schema_version)
  PRIMARY KEY (matter_id, seq));
CREATE INDEX domain_events_recorded ON domain_events (matter_id, recorded_at, seq);
CREATE INDEX domain_events_target ON domain_events (matter_id, target_id, seq);
-- append-only: app role has INSERT/SELECT only; trigger raises on UPDATE/DELETE for every role except a separately
-- approved retention role (not created until OBD-11 retention policy is approved).

CREATE TABLE command_receipts (actor_id UUID NOT NULL, idempotency_key UUID NOT NULL, request_hash BYTEA NOT NULL,
  matter_id UUID, status_code INT NOT NULL, response JSONB NOT NULL, created_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (actor_id, idempotency_key));
CREATE TABLE security_audit_events (id UUID PRIMARY KEY, occurred_at TIMESTAMPTZ NOT NULL, actor_id UUID,
  operation TEXT NOT NULL, outcome TEXT NOT NULL, requested_resource_kind TEXT, requested_id_hash BYTEA,
  client_ip INET, request_id TEXT);   -- no titles, filenames, content; separate grant
```

JSONB in `domain_events.before/after` is the serialized form of typed Go event structs validated on write and read; it is a history payload, not a replacement for domain tables (all current state lives in typed columns).

IO tables: `import_batches`, `import_rows (batch_id, row_key, content_hash, parsed typed columns, errors)`, `import_row_mappings (matter_id, source_id, row_key, content_hash, record_kind, record_id, PRIMARY KEY (matter_id, source_id, row_key))`, `bulk_previews (id, actor_id, matter_id, rows (id, revision), patch, expires_at)`, `export_artifacts (id, matter_id, requested_by, object_key, params, created_at, status)`, `brief_generations (id, matter_id, actor_id, t1, t2, source_revision_t2, source_revision_generation, created_at)`.

## 7. Transaction template (all commands)

```sql
BEGIN;                                                    -- READ COMMITTED
SELECT revision, event_seq, last_recorded_at, next_boundary_at FROM matters WHERE id=$m FOR UPDATE;
SELECT status FROM workspace_memberships WHERE workspace_id=$w AND user_id=$u FOR SHARE;
SELECT role, status FROM matter_memberships WHERE matter_id=$m AND user_id=$u FOR SHARE;
SELECT 1 FROM command_receipts WHERE actor_id=$u AND idempotency_key=$k;  -- replay check
-- apply boundaries <= now (SYSTEM_CLOCK events), load aggregate rows, CAS revisions, decide in Go core
UPDATE <typed rows> SET …, revision = revision + 1 WHERE id=$id AND revision=$expected;  -- 0 rows → 412
-- derived recompute writes; INSERT domain_events with seq = event_seq+1..n, recorded_at = greatest(now, last_recorded_at)
INSERT INTO command_receipts …;
UPDATE matters SET event_seq=$n, last_recorded_at=$t, next_boundary_at=$nb, revision=revision+1 WHERE id=$m;
COMMIT;
```

Revocation causality: membership revocation updates the membership row (and locks the matter row for matter memberships). Because commands read memberships `FOR SHARE`, a revocation waits for in-flight commands that already read the grant, and any command reading after the revocation commit sees REVOKED. Either the write is serialized before the revocation (it was authorized at its serialization point) or it is denied (AC-147). Workspace revocation follows the same rule through the workspace membership row.

If `INSERT domain_events` fails, the transaction aborts: no mutation without history (AC-153).

## 8. Read snapshots and report semantics

- Views (`control-room`, `grid`, `next-actions`, `readiness`) run in one `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY` transaction: authorize, read `matters.event_seq` as `sourceRevision`, read typed rows, compute timing/attention at `asOf`. If `next_boundary_at ≤ asOf`, the service first runs the boundary command (separate write transaction) and then opens the snapshot.
- **Status brief (FR-019)**: window axis is **recorded time** (`recorded_at`), the instant MatterControl knew of the change. `changes = events with t1 < recorded_at ≤ t2`, ordered by `(recorded_at, seq)` (seq breaks ties deterministically and equals commit order within the matter). Each item shows `effectiveAt`. `outstandingAtT2` is reconstructed by folding events with `recorded_at ≤ t2` (state *as known at t2*), so regenerating the same window later returns the same facts even if corrections were recorded afterwards. Events recorded after t2 whose `effective_at ≤ t2` are listed separately as `lateRecordedAffectingWindow`, identified as new data. Provenance carries `sourceRevisionAtT2` and `sourceRevisionAtGeneration`.
- **ARCH-Q3**: PO/BA to confirm recorded-time windowing (an effective-time window would change old reports whenever backdated corrections arrive). The design supports both axes; recorded-time is proposed as the deterministic default.
- If any event needed for the fold is unavailable (future retention purge), generation fails with `/problems/unavailable` ("historical inputs unavailable"), never a guessed narrative. Internal rebuildable fold checkpoints may be added for performance; they are not P1 issued snapshots and are never exposed as such.

## 9. Tests

| ID | Scenario | AC |
|---|---|---|
| DM-01 | Direct SQL insert of cross-matter edge/claim/assessment → FK violation | AC-135, NFR-005 |
| DM-02 | Direct SQL self-verification insert → CHECK violation | AC-140 |
| DM-03 | UPDATE/DELETE on `domain_events` as app role → error | AC-149 |
| DM-04 | Event insert failure injected → whole command rolled back, receipt absent | AC-153 |
| DM-05 | Brief: E1 at t1 excluded, E2 at t2 included, (T0,T0] empty, t1>t2 rejected, other matter's event absent with no count | AC-138 |
| DM-06 | Regenerate brief after a late correction → identical `changes`/`outstanding`, correction in `lateRecordedAffectingWindow` | AC-119, AC-136 |
| DM-07 | Membership revoke concurrent with 20 writers → every committed write's serialization precedes revocation | AC-147 |
