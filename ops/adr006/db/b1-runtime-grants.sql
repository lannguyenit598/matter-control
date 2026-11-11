-- B1 least-privilege database role profile (ADR-006 zero-trust addendum), part 2 of 2: per-table
-- runtime grants, sequence USAGE, function EXECUTE hardening and the Search EXECUTE grant.
--
-- Apply order: b1-roles.sql (bootstrap) -> role passwords -> product migrations as mc_migrator ->
-- THIS FILE -> ops/adr006/bff-state.sql (admin) + ALTER TABLE mc_bff.state OWNER TO mc_owner ->
-- ops/adr006/db/b1-bff-grants.sql -> probes. The per-table grants below FAIL CLOSED if the
-- migrations did not run: on a fresh database the first GRANT aborts with "relation does not
-- exist" (ON_ERROR_STOP makes the mis-ordered run loud, never silently partial).
--
-- THIS FILE IS THE SINGLE SOURCE OF TRUTH together with b1-roles.sql: the repeatable verification
-- (apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go) executes it
-- verbatim; its sync guard fails if the files and the Go source ever drift apart. When a migration
-- adds a table, add its exact grant line here AND re-verify with the Go test.
--
-- Conventions: idempotent; NO passwords/DSNs; one SQL statement per blank-line-separated block.
-- Run as the database admin (it acts as a member of mc_owner on these objects).

-- Append-only legal history: read/append only — no UPDATE, no DELETE, ever.
GRANT SELECT, INSERT ON mcapp.command_receipt_matters TO mc_runtime;

GRANT SELECT, INSERT ON mcapp.command_receipts TO mc_runtime;

GRANT SELECT, INSERT ON mcapp.domain_events TO mc_runtime;

GRANT SELECT, INSERT ON mcapp.security_audit_events TO mc_runtime;

-- Append-only capture aid (migration 0019): mail envelopes are written once by the intake
-- receipt and never updated or deleted; the raw bytes live on the immutable document version.
GRANT SELECT, INSERT ON mcapp.mail_messages TO mc_runtime;

-- Replace-on-save tables: the only product tables whose contracts DELETE (rebuild row sets).
GRANT SELECT, INSERT, UPDATE, DELETE ON mcapp.context_links TO mc_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON mcapp.contract_term_lines TO mc_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON mcapp.dependency_edges TO mc_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON mcapp.milestone_prerequisites TO mc_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON mcapp.review_grid_versions TO mc_runtime;

-- Standard tables: the runtime reads and writes current state; DELETE is never granted.
GRANT SELECT, INSERT, UPDATE ON mcapp.actions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.assessments TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.context_records TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.criteria TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.disputes TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.document_versions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.documents TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.evidence TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.evidence_claims TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.guidance_documents TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.guidance_revisions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.filing_cycles TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.filing_details TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.filing_observations TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.filing_submissions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.goose_db_version TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.graph_nodes TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.intake_records TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.import_sources TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.matter_memberships TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.matters TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.milestones TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.notification_seen TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.parties TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.playbook_instances TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.playbook_revisions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.playbooks TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.requirements TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.review_answers TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.review_grids TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.review_question_revisions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.review_questions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE, DELETE ON mcapp.saved_views TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.signature_observations TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.users TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.verifier_designations TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.workspace_memberships TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.workspaces TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.workstreams TO mc_runtime;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA mcapp TO mc_runtime;

-- Metadata Quick Search (migration 0012): mc_search_key_v1(text) is called by every search query
-- at runtime. Default privileges already revoked PUBLIC EXECUTE on functions; the runtime gets
-- exactly this one EXECUTE grant. Without it the search endpoint fails with
-- "permission denied for function mc_search_key_v1" under the restricted runtime role.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mcapp FROM PUBLIC;

GRANT EXECUTE ON FUNCTION mcapp.mc_search_key_v1(text) TO mc_runtime;

REVOKE CREATE ON SCHEMA mcapp FROM mc_runtime;
