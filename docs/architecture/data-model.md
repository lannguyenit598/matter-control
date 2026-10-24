# Data Model — PostgreSQL

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b` (pgx v5, Goose, sqlc, version CAS, PostgreSQL 18 in CI).
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**. PostgreSQL is retained; database hosting is unresolved (TB-02). D1 is not a substitute.

## 1. Conventions

- UUIDv7 primary keys (template `system.UUIDv7`). Every matter-scoped table has `matter_id NOT NULL REFERENCES matters` and `UNIQUE (matter_id, id)`. Every reference to another matter-scoped row is a **composite FK including `matter_id`** targeting a declared UNIQUE/PK key (register §1a). With the register instantiated (§2–§6), direct SQL cannot persist a cross-matter reference (AC-135, NFR-005). FKs use default MATCH SIMPLE: a NULL *optional* reference is unchecked by design; mandatory references are `NOT NULL`.
- Register enforcement: schema-lint test DM-08 reads `pg_catalog.pg_constraint` and fails on any FK from a `matter_id` table that omits `matter_id` (FKs to `matters`, `workspaces`, `users` excepted) or targets a non-unique key. Scope/reference columns are immutable via column-level grants.
- NULL-safe CHECKs: PostgreSQL **accepts** a row whose CHECK yields NULL. Variant/discriminator CHECKs therefore use NOT NULL discriminators, `CASE … ELSE false END`, and only `IS [NOT] NULL`/`num_nonnulls` operands. Value CHECKs on nullable columns are paired with all-or-nothing `num_nonnulls` CHECKs.
- Mutable rows carry `revision BIGINT NOT NULL DEFAULT 1` for CAS (`UPDATE … WHERE id=$1 AND revision=$2`).
- Enumerations are PostgreSQL `CHECK` constraints on `TEXT` (simpler expand/contract than enum types).
- Times are `TIMESTAMPTZ`. No hard deletes for domain tables; the application role has no `DELETE` privilege on them.
- Migrations: Goose, expand-only for rolling deploys (template practice). Goose's session advisory lock is fine on a direct connection; it is unsupported through Hyperdrive, so migrations must not run via Hyperdrive (TB-09).

### 1a. Same-Matter reference register

| Referencing (all include `matter_id`) | Referenced declared key |
|---|---|
| `requirements`/`actions (matter_id, id, kind)` | `graph_nodes UNIQUE (matter_id, id, kind)` |
| `dependency_edges` upstream/downstream; `waiting_on.subject_node_id`; `evidence_requirements.subject_node_id`; context link tables' node ids | `graph_nodes UNIQUE (matter_id, id)` |
| `requirement_actions`, `milestone_prerequisites`, `filings` → requirement; `requirement_actions` → action | `requirements`/`actions UNIQUE (matter_id, id)` |
| `milestone_prerequisites` → milestone; `*.workstream_id` | `milestones`/`workstreams UNIQUE (matter_id, id)` |
| owner/internal owner/assignee user ids; `verifier_designations` | `matter_memberships PK (matter_id, user_id)` |
| `waiting_on.subject_filing_id`, `evidence_requirements.subject_filing_id`, `filing_cycles`, `filing_stage_observations` | `filings UNIQUE (matter_id, id)` |
| `waiting_on.party_id`, `filings.authority_party_id`, signatory party | `external_parties UNIQUE (matter_id, id)` |
| `evidence_requirements (matter_id, id, current_revision_id)` (deferred) | `criterion_revisions UNIQUE (matter_id, evidence_requirement_id, id)` |
| `criterion_revisions` → evidence requirement / document / fixed version | `evidence_requirements`, `documents`, `document_versions UNIQUE (matter_id, id)` |
| `criterion_components` → revision | `criterion_revisions UNIQUE (matter_id, id)` |
| `evidence.document_version_id`, `evidence_assessments.assessed_document_version_id`, submission items, signature observations | `document_versions UNIQUE (matter_id, id)` |
| `evidence_claims (matter_id, evidence_id, evidence_submitter_id)` | `evidence UNIQUE (matter_id, id, submitted_by)` |
| `evidence_claims (matter_id, criterion_revision_id, component_key)` | `criterion_components UNIQUE (matter_id, criterion_revision_id, key)` (NULL key = implicit) |
| `evidence_assessments (matter_id, claim_id, evidence_submitter_id, claimant_id)` | `evidence_claims UNIQUE (matter_id, id, evidence_submitter_id, claimed_by)` |
| `evidence_assessments.superseded_by_id` (deferred), `evidence_disputes.assessment_id` | `evidence_assessments UNIQUE (matter_id, id)` |
| `document_versions` → document; predecessor `(matter_id, document_id, predecessor_version_id)`; `documents (matter_id, id, current_version_id)` (deferred) | `documents UNIQUE (matter_id, id)`; `document_versions UNIQUE (matter_id, document_id, id)` |
| `document_versions.content_object_id` | `content_objects UNIQUE (matter_id, id)` |
| `filing_submissions (matter_id, filing_id, cycle_no)`; items → submission | `filing_cycles UNIQUE (matter_id, filing_id, cycle_no)`; `filing_submissions UNIQUE (matter_id, id)` |
| observation evidence links, signature evidence | `evidence UNIQUE (matter_id, id)` |
| `import_row_mappings`, bulk/import outcome tables, `export_artifacts`, `brief_generations`, `command_receipts.matter_id`, `command_receipt_matters.represented_matter_id` | `matters(id)`; typed `(matter_id, record_id)` FKs where a record kind is fixed |

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
  next_boundary_at TIMESTAMPTZ, boundaries_applied_until TIMESTAMPTZ NOT NULL,
  CHECK (boundaries_applied_until <= last_recorded_at),
  CHECK (next_boundary_at IS NULL OR next_boundary_at > boundaries_applied_until));
CREATE INDEX matters_next_boundary ON matters (next_boundary_at) WHERE next_boundary_at IS NOT NULL;  -- worker selection
CREATE TABLE matter_memberships (matter_id UUID REFERENCES matters, user_id UUID REFERENCES users,
  role TEXT NOT NULL CHECK (role IN ('OWNER','EDITOR','VIEWER')),
  status TEXT NOT NULL CHECK (status IN ('ACTIVE','REVOKED')), revision BIGINT NOT NULL DEFAULT 1,
  PRIMARY KEY (matter_id, user_id));
CREATE TABLE verifier_designations (matter_id UUID, user_id UUID, active BOOLEAN NOT NULL,
  designated_by UUID NOT NULL, reason TEXT NOT NULL, revision BIGINT NOT NULL DEFAULT 1, PRIMARY KEY (matter_id, user_id),
  FOREIGN KEY (matter_id, user_id) REFERENCES matter_memberships);
```

Last-effective-OWNER protection (AC-158). An *effective* OWNER has an ACTIVE matter membership with role OWNER **and** an ACTIVE workspace membership. Guards follow the global lock order (ADR-002 §1a):
- (a) Matter demotion/revocation: under the matter lock, count effective OWNERs excluding the target.
- (b) Workspace revocation: under the workspace row lock and the target's matter locks, reject with `409 guard-failed {guard: LAST_EFFECTIVE_MATTER_OWNER}` if the target is the last effective OWNER of any matter. The problem names no matter, title or count, because the workspace OWNER may lack matter access. The remedy is a transfer by a matter OWNER first (permission matrix).

A deferred constraint trigger on both membership tables re-checks every affected matter at commit, so a path that skips (a)/(b) cannot strand a matter. Whether an urgent workspace revocation may proceed and leave a matter temporarily without an effective OWNER is a business decision (ARCH-Q4), not adopted.

## 3. Work graph

```sql
CREATE TABLE graph_nodes (id UUID PRIMARY KEY, matter_id UUID NOT NULL REFERENCES matters,
  kind TEXT NOT NULL CHECK (kind IN ('REQUIREMENT','ACTION')), UNIQUE (matter_id, id), UNIQUE (matter_id, id, kind));
-- typed totality: at most one child is structural (child FK carries kind; child kind CHECK; id is PK);
-- at least one is enforced at commit, so node + child are inserted in one transaction:
CREATE CONSTRAINT TRIGGER graph_nodes_typed_total AFTER INSERT ON graph_nodes
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION assert_graph_node_has_typed_row();
-- app role: no UPDATE/DELETE on graph_nodes; id/kind/matter_id of requirements/actions not updatable

CREATE TABLE requirements (
  id UUID PRIMARY KEY, kind TEXT NOT NULL DEFAULT 'REQUIREMENT' CHECK (kind='REQUIREMENT'),
  matter_id UUID NOT NULL, FOREIGN KEY (matter_id, id, kind) REFERENCES graph_nodes (matter_id, id, kind),
  UNIQUE (matter_id, id),
  workstream_id UUID, FOREIGN KEY (matter_id, workstream_id) REFERENCES workstreams (matter_id, id),
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0), outcome TEXT NOT NULL CHECK (length(btrim(outcome)) > 0),
  owner_user_id UUID, FOREIGN KEY (matter_id, owner_user_id) REFERENCES matter_memberships (matter_id, user_id),
  due_at TIMESTAMPTZ,
  execution_state TEXT NOT NULL CHECK (execution_state IN ('NOT_STARTED','IN_PROGRESS','WAITING','COMPLETED','CANCELLED')),
  dependency_state TEXT NOT NULL CHECK (dependency_state IN ('READY','BLOCKED')),
  dependency_reasons JSONB NOT NULL DEFAULT '[]',     -- derived explanation cache, typed by Go struct
  verification_state TEXT NOT NULL CHECK (verification_state IN ('NOT_REQUIRED','UNVERIFIED','PARTIALLY_VERIFIED','VERIFIED','DISPUTED')),
  verification_applicability TEXT NOT NULL DEFAULT 'REQUIRED' CHECK (verification_applicability IN ('REQUIRED','NOT_REQUIRED')),
  applicability_reason TEXT, proof_epoch INT NOT NULL DEFAULT 0 CHECK (proof_epoch >= 0), proof_epoch_opened_at TIMESTAMPTZ,
  CHECK (proof_epoch = 0 OR proof_epoch_opened_at IS NOT NULL),
  completed_at TIMESTAMPTZ, cancelled_at TIMESTAMPTZ,
  critical_escalation_reason TEXT, imported_verification_claim TEXT,
  revision BIGINT NOT NULL DEFAULT 1,
  CHECK ((execution_state='COMPLETED') = (completed_at IS NOT NULL)),
  CHECK (verification_applicability='REQUIRED' OR applicability_reason IS NOT NULL));
-- actions: same shape with CHECK (kind='ACTION'), the same (matter_id, id, kind) FK and UNIQUE (matter_id, id),
--   proof_required BOOLEAN NOT NULL, CHECK ((verification_state IS NULL) = (NOT proof_required)),
--   CHECK ((verification_applicability IS NULL) = (NOT proof_required)) — pairs the nullable IN-list CHECKs
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

`dependency_reasons` is a derived explanation cache recomputed with the state, not a metadata store; all business fields are typed columns. Other tables (all `matter_id` + `UNIQUE (matter_id, id)`, references per §1a): `workstreams`, `milestones (critical BOOLEAN, due_at, readiness, satisfied_count, total_count, revision)`, `milestone_prerequisites (matter_id, milestone_id, requirement_id, added_reason, removed_at, removal_reason)`, `waiting_on (matter_id, subject_kind NOT NULL, subject_node_id | subject_filing_id with CASE variant CHECK, party_id, condition_text, CHECK (num_nonnulls(party_id, condition_text) >= 1), internal_owner_id NOT NULL, reason NOT NULL, follow_up_due_at, resolved_at, response_reference, revision)`.

## 4. Proof

```sql
CREATE TABLE evidence_requirements (id UUID PRIMARY KEY, matter_id UUID NOT NULL REFERENCES matters,
  subject_kind TEXT NOT NULL CHECK (subject_kind IN ('NODE','FILING')),
  subject_node_id UUID, subject_filing_id UUID,
  FOREIGN KEY (matter_id, subject_node_id) REFERENCES graph_nodes (matter_id, id),
  FOREIGN KEY (matter_id, subject_filing_id) REFERENCES filings (matter_id, id),
  CHECK (CASE subject_kind WHEN 'NODE' THEN subject_node_id IS NOT NULL AND subject_filing_id IS NULL
                           WHEN 'FILING' THEN subject_filing_id IS NOT NULL AND subject_node_id IS NULL ELSE false END),
  current_revision_id UUID,   -- FK (matter_id, id, current_revision_id) → criterion_revisions added by ALTER, DEFERRABLE INITIALLY DEFERRED
  retired_at TIMESTAMPTZ, revision BIGINT NOT NULL DEFAULT 1, UNIQUE (matter_id, id));
CREATE TABLE criterion_revisions (id UUID PRIMARY KEY, matter_id UUID NOT NULL, evidence_requirement_id UUID NOT NULL,
  FOREIGN KEY (matter_id, evidence_requirement_id) REFERENCES evidence_requirements (matter_id, id),
  rev_no INT NOT NULL, mandatory BOOLEAN NOT NULL, applicable BOOLEAN NOT NULL, applicability_reason TEXT,
  CHECK (applicable OR applicability_reason IS NOT NULL),
  acceptable_proof TEXT NOT NULL,
  version_rule TEXT NOT NULL CHECK (version_rule IN ('CURRENT_AUTHORITATIVE','FIXED','NONE')),
  document_id UUID, fixed_document_version_id UUID,
  FOREIGN KEY (matter_id, document_id) REFERENCES documents (matter_id, id),
  FOREIGN KEY (matter_id, fixed_document_version_id) REFERENCES document_versions (matter_id, id),
  CHECK (CASE version_rule
    WHEN 'CURRENT_AUTHORITATIVE' THEN document_id IS NOT NULL AND fixed_document_version_id IS NULL
    WHEN 'FIXED' THEN fixed_document_version_id IS NOT NULL AND document_id IS NULL
    WHEN 'NONE' THEN document_id IS NULL AND fixed_document_version_id IS NULL ELSE false END),
  validity_required BOOLEAN NOT NULL, reason TEXT NOT NULL, created_by UUID NOT NULL, created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (evidence_requirement_id, rev_no), UNIQUE (matter_id, id), UNIQUE (matter_id, evidence_requirement_id, id));
CREATE TABLE criterion_components (matter_id UUID NOT NULL, criterion_revision_id UUID NOT NULL,
  FOREIGN KEY (matter_id, criterion_revision_id) REFERENCES criterion_revisions (matter_id, id),
  key TEXT NOT NULL CHECK (length(btrim(key)) > 0), label TEXT NOT NULL, mandatory BOOLEAN NOT NULL,
  PRIMARY KEY (criterion_revision_id, key), UNIQUE (matter_id, criterion_revision_id, key));

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

Proof notes:
- The `current_revision_id` FK is circular, so it is added by `ALTER TABLE` and deferred.
- Supersession inside one transaction: set `superseded_by_id` on the current row to the pre-generated new id, then insert the new row (the partial unique index is immediate; the self-FK is deferred).
- Column grants allow `UPDATE` only on withdrawal/revision columns, `superseded_by_id`/`revoked_*`, dispute resolution columns and `current_revision_id`/`retired_at`/`revision`.

## 5. Documents, filing, context

- `documents (id, matter_id, title, current_version_id, revision, UNIQUE (matter_id, id), FOREIGN KEY (matter_id, id, current_version_id) REFERENCES document_versions (matter_id, document_id, id) DEFERRABLE INITIALLY DEFERRED)`.
- `document_versions (id, matter_id, document_id, seq, source, content_object_id, external_reference, sha256, size_bytes, media_type, predecessor_version_id, uploaded_by, availability, FKs (matter_id, document_id) → documents, (matter_id, document_id, predecessor_version_id) → document_versions, (matter_id, content_object_id) → content_objects, CHECK (CASE source WHEN 'CONTENT' THEN content_object_id IS NOT NULL AND external_reference IS NULL WHEN 'EXTERNAL_REFERENCE' THEN content_object_id IS NULL AND external_reference IS NOT NULL ELSE false END), UNIQUE (document_id, seq), UNIQUE (matter_id, id), UNIQUE (matter_id, document_id, id))`.
- `content_objects (id, matter_id, object_key UNIQUE, status, expected_sha256, expected_size, expires_at, committed_at, UNIQUE (matter_id, id))`.
- `signature_observations (id, matter_id, document_version_id, signatory_party_id | signatory_entity_ref_id | signatory_label, CHECK (num_nonnulls(signatory_party_id, signatory_entity_ref_id, signatory_label) = 1), observed, evidence_id, observed_at, recorded_by, composite FKs per §1a)`.
- `filings (id, matter_id, requirement_id, authority_party_id, owner_user_id, stage CHECK (9 values), execution_state, proof_required BOOLEAN NOT NULL, verification_state, CHECK ((verification_state IS NULL) = (NOT proof_required)), proof_epoch INT NOT NULL DEFAULT 0 CHECK (proof_epoch >= 0), proof_epoch_opened_at, due_at, negative_outcome CHECK IN ('REJECTED','WITHDRAWN'), negative_outcome_epoch INT, CHECK (num_nonnulls(negative_outcome, negative_outcome_epoch) IN (0, 2)), revision, UNIQUE (matter_id, id), FKs per §1a)`; `filing_cycles (matter_id, filing_id, cycle_no, opened_in_epoch, kind, request_reference, owner_user_id, due_at, opened_at, closed_at, UNIQUE (filing_id, cycle_no), UNIQUE (matter_id, filing_id, cycle_no))`; `filing_stage_observations (matter_id, filing_id, proof_epoch, …)` (append-only) + `filing_observation_evidence (matter_id, observation_id, evidence_id)`; `filing_submissions (id, matter_id, filing_id, cycle_no, FK (matter_id, filing_id, cycle_no) → filing_cycles, UNIQUE (matter_id, id), submission_reference NOT NULL, submitted_at NOT NULL)`; `filing_submission_items (matter_id, submission_id, document_version_id, composite FKs, PRIMARY KEY (submission_id, document_version_id))`.
- `external_parties`, `entity_references`, `decisions`, `findings`, `risks` with typed columns; link tables `decision_subjects`, `finding_subjects`, `risk_subjects`, `entity_reference_links`, each with composite same-matter FKs.

## 6. History, receipts, security audit

```sql
CREATE TABLE domain_events (matter_id UUID NOT NULL REFERENCES matters, seq BIGINT NOT NULL,
  id UUID NOT NULL UNIQUE, type TEXT NOT NULL, schema_version INT NOT NULL,
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('USER','SYSTEM_CLOCK')), actor_id UUID,
  CHECK (CASE actor_kind WHEN 'USER' THEN actor_id IS NOT NULL WHEN 'SYSTEM_CLOCK' THEN actor_id IS NULL ELSE false END),
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
  scope_kind TEXT NOT NULL CHECK (scope_kind IN ('MATTER','WORKSPACE')),
  workspace_id UUID NOT NULL REFERENCES workspaces, matter_id UUID REFERENCES matters,
  CHECK (CASE scope_kind WHEN 'MATTER' THEN matter_id IS NOT NULL WHEN 'WORKSPACE' THEN matter_id IS NULL ELSE false END),
  status_code INT NOT NULL CHECK (status_code BETWEEN 200 AND 299), response JSONB NOT NULL,
  committed_at TIMESTAMPTZ NOT NULL, purge_after TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (actor_id, idempotency_key));
CREATE INDEX command_receipts_purge ON command_receipts (purge_after);
CREATE TABLE command_receipt_matters (actor_id UUID NOT NULL, idempotency_key UUID NOT NULL,
  represented_matter_id UUID NOT NULL REFERENCES matters,
  FOREIGN KEY (actor_id, idempotency_key) REFERENCES command_receipts,
  PRIMARY KEY (actor_id, idempotency_key, represented_matter_id));
-- one row per Matter represented in the stored response (incl. a MATTER scope and a Matter created under WORKSPACE scope)
-- both inserted only inside the command's own transaction (visible receipt ⇔ committed outcome); read only through
-- replay/operations paths that require current read access to the scope AND every represented Matter (api-contracts §1);
-- purge_after = committed_at + receiptRetention; purged (with its matter rows) by retention role after purge_after (TB-06)
CREATE TABLE security_audit_events (id UUID PRIMARY KEY, occurred_at TIMESTAMPTZ NOT NULL, actor_id UUID,
  operation TEXT NOT NULL, outcome TEXT NOT NULL, requested_resource_kind TEXT, requested_id_hash BYTEA,
  client_ip INET, request_id TEXT);   -- no titles, filenames, content; separate grant
```

JSONB in `domain_events.before/after` is the serialized form of typed Go event structs validated on write and read; it is a history payload, not a replacement for domain tables (all current state lives in typed columns).

IO tables: `import_batches (id, matter_id, actor_id, source_id, preview_digest, expires_at)`, `import_group_outcomes (matter_id, batch_id, group_id, confirm_key, status, PRIMARY KEY (batch_id, group_id))`, `import_rows (batch_id, row_key, content_hash, parsed typed columns, errors)`, `import_row_mappings (matter_id, source_id, row_key, content_hash, record_kind, record_id, PRIMARY KEY (matter_id, source_id, row_key))`, `bulk_previews (id, matter_id, actor_id, patch (typed allowlist struct), preview_digest, created_at, expires_at)`, `bulk_preview_rows (preview_id, row_id, kind, revision)`, `bulk_row_outcomes (matter_id, preview_id, row_id, commit_key, status, event_seq, PRIMARY KEY (preview_id, row_id))`, `export_artifacts (id, matter_id, requested_by, object_key, params, created_at, status)`, `brief_generations (id, matter_id, actor_id, t1, t2, source_revision_t2, source_revision_generation, created_at)`.

## 7. Transaction template (all commands)

```sql
BEGIN;                                                    -- READ COMMITTED
-- lock order (ADR-002 §1a): [workspace row] → matter row → workspace membership → matter membership → typed rows → receipt
SELECT revision, event_seq, last_recorded_at, boundaries_applied_until, next_boundary_at FROM matters WHERE id=$m FOR UPDATE;
SELECT greatest(clock_timestamp(), $last_recorded_at) AS t_cmd;   -- captured once; Clock port in tests
SELECT status FROM workspace_memberships WHERE workspace_id=$w AND user_id=$u FOR SHARE;
SELECT role, status FROM matter_memberships WHERE matter_id=$m AND user_id=$u FOR SHARE;
SELECT request_hash, scope_kind, matter_id, response FROM command_receipts WHERE actor_id=$u AND idempotency_key=$k;  -- replay check
-- replay only if hash equal AND authorization above passed AND the caller can currently read every
-- command_receipt_matters Matter (else uniform 404); key age checked at t_cmd (api-contracts §1); ApplyBoundaries(upTo = t_cmd) (SYSTEM_CLOCK events);
-- load typed rows (missing typed row → abort, 503); CAS revisions; decide in Go core at t_cmd
UPDATE <typed rows> SET …, revision = revision + 1 WHERE id=$id AND revision=$expected;  -- 0 rows → 412
-- derived recompute writes; INSERT domain_events with seq = event_seq+1..n, recorded_at = t_cmd
INSERT INTO command_receipts …;
UPDATE matters SET event_seq=$n, last_recorded_at=t_cmd, boundaries_applied_until=t_cmd, next_boundary_at=$nb, revision=revision+1 WHERE id=$m;
COMMIT;
```

Revocation causality: membership revocation updates the membership row (and locks the matter row for matter memberships). Because commands read memberships `FOR SHARE`, a revocation waits for in-flight commands that already read the grant, and any command reading after the revocation commit sees REVOKED. Either the write is serialized before the revocation (it was authorized at its serialization point) or it is denied (AC-147). Workspace revocation takes the workspace row `FOR UPDATE`, then each matter of that workspace where the target is an ACTIVE member (ascending id), then updates the workspace membership row. Grants hold the workspace row `FOR SHARE`, so the matter set cannot grow concurrently and the global order holds (ADR-002 §1a).

If `INSERT domain_events` fails, the transaction aborts: no mutation without history (AC-153).

## 8. Read snapshots and report semantics

- Views (`control-room`, `grid`, `next-actions`, `readiness`) run in one `BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY` transaction whose first statement reads `clock_timestamp()` as `asOf`, `matters.event_seq` as `sourceRevision`, and `boundaries_applied_until`/`next_boundary_at`. It then authorizes, reads typed rows and evaluates derived values at `asOf`: stored values only if `boundaries_applied_until ≤ asOf < next_boundary_at`, otherwise pure in-memory evaluation (state-machine §6.2). Reads never write or wait for the worker.
- **Status brief (FR-019)**: window axis is **recorded time** (`recorded_at`), the instant MatterControl knew of the change. `changes = events with t1 < recorded_at ≤ t2`, ordered by `(recorded_at, seq)` (seq breaks ties deterministically and equals commit order within the matter). Each item shows `effectiveAt`. `outstandingAtT2` is reconstructed by folding events with `recorded_at ≤ t2` (state *as known at t2*), with time-derived values (expiry, timing, attention, readiness) evaluated purely at `t2` from those inputs, so an expiry effective ≤ t2 is reflected even if its boundary event was recorded later; regenerating the same window later returns the same facts even if corrections were recorded afterwards. Events recorded after t2 whose `effective_at ≤ t2` are listed separately as `lateRecordedAffectingWindow`, identified as new data. Provenance carries `sourceRevisionAtT2` and `sourceRevisionAtGeneration`.
- **Sealing and clock assumption.** Generation requires `t2 ≤ asOf`. The window is *sealed* once `t2 ≤ asOf − maxCommandDuration` (DB-enforced transaction deadline, TB-13): with per-matter monotonic `recorded_at` from one database clock, no transaction that can still commit carries `recorded_at ≤ t2`. Unsealed windows return `provisional: true`. Determinism is claimed only for equal `(window, sourceRevisionAtT2)`. If the database clock steps back beyond the margin, a later regeneration may differ; that is identified by a different `sourceRevisionAtT2` (RULE-016), never silently.
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
| DM-08 | Schema lint: every FK from a `matter_id` table includes `matter_id` and targets a UNIQUE key; each variant CHECK rejects every invalid variant (incl. FIXED/NONE with wrong fields) | AC-135, NFR-005 |
| DM-09 | Graph node without typed child → commit rejected; edge to it cannot commit | NFR-005 |
| DM-10 | Second current assessment for (claim, epoch) → unique violation; stale `subject_epoch` → trigger rejects | AC-124, AC-157 |
| DM-11 | Workspace revocation of last effective OWNER → rejected without matter detail; after transfer → succeeds | AC-158, AC-135 |
| DM-12 | Replay/operations after revocation → uniform 404; Workspace OWNER who lost membership of a Matter created by `POST /workspaces/{ws}/matters` → uniform 404 on replay and operations; receipt invisible before commit | AC-147, AC-153 |
| DM-13 | Read at `asOf ≥ next_boundary_at`, no worker: equals post-materialization state; read issues no write | AC-126 |
| DM-14 | Direct SQL assessment whose `assessed_document_version_id` differs from the evidence version (or is non-NULL for non-document evidence) → trigger rejects; claim of OBSERVATION/EXTERNAL_REFERENCE evidence on a CURRENT_AUTHORITATIVE/FIXED revision → trigger rejects | AC-127, AC-128, NFR-005 |
