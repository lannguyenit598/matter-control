-- B1 least-privilege database role profile (ADR-006 zero-trust addendum) — operator deliverable.
--
-- THIS FILE IS MIRRORED VERBATIM (after comment normalization) by the repeatable Go verification
-- apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go: its sync subtest
-- fails if this file and the Go profile source ever drift apart. Edit both together.
--
-- Conventions:
--   * Idempotent: safe to re-run. Roles are cluster-level; schemas and grants are per-database.
--   * NO passwords, NO DSNs: run as a database admin (Supabase project admin connection), then set
--     each LOGIN role's password in a separate operator step (docs/deployment/pilot-deploy-runbook.md).
--     A LOGIN role without a password cannot authenticate, so an unfilled role fails closed.
--   * Apply order on a fresh database: this file FIRST (roles exist before anything else logs in),
--     product migrations SECOND (as mc_migrator — the role GUC below makes every migration object
--     owned by mc_owner), this file AGAIN third (idempotent: the per-table grants, sequence USAGE
--     and function EXECUTE revoke land on the migrated objects), ops/adr006/bff-state.sql FOURTH
--     (as the database admin: its CREATE SCHEMA IF NOT EXISTS needs database-level CREATE even
--     when this file already made the schema; follow it with ALTER TABLE mc_bff.state OWNER TO
--     mc_owner), and ops/adr006/db/b1-bff-grants.sql FIFTH.
--
-- Data API exposure: product tables live in the private schema `mcapp` (never `public`), so the
-- Supabase Data API (which exposes `public` only) has nothing to serve, and nothing is granted to
-- PUBLIC anywhere below. The operator Data-API negative test (publishable key against these
-- schemas) remains a required provider step — see the pilot deploy runbook.

DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_owner') THEN CREATE ROLE mc_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF; END $do$;

DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_migrator') THEN CREATE ROLE mc_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT; END IF; END $do$;

DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_runtime') THEN CREATE ROLE mc_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; END IF; END $do$;

DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_maintenance') THEN CREATE ROLE mc_maintenance NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF; END $do$;

DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_bff') THEN CREATE ROLE mc_bff LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; END IF; END $do$;

-- Private product schema: the owner owns it; PUBLIC (incl. Supabase anon/authenticated) gets nothing.
CREATE SCHEMA IF NOT EXISTS mcapp;

REVOKE ALL ON SCHEMA mcapp FROM PUBLIC;

GRANT USAGE, CREATE ON SCHEMA mcapp TO mc_owner;

ALTER SCHEMA mcapp OWNER TO mc_owner;

-- Migrations act as the schema owner: the membership is SET-able, and the role-level GUC makes
-- every migration connection assume mc_owner, so migration objects (and goose_db_version) are
-- owned by the NOLOGIN owner, never by a LOGIN role.
GRANT mc_owner TO mc_migrator WITH SET TRUE;

ALTER ROLE mc_migrator SET role = 'mc_owner';

GRANT USAGE ON SCHEMA mcapp TO mc_runtime;

REVOKE CREATE ON SCHEMA mcapp FROM mc_runtime;

-- Future migration objects are born without PUBLIC rights, with only a read/append floor:
-- UPDATE (and DELETE) are always deliberate per-table grants below, so a future append-only
-- table can never silently inherit a blanket UPDATE default.
ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp GRANT SELECT, INSERT ON TABLES TO mc_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp GRANT USAGE ON SEQUENCES TO mc_runtime;

-- Per-table runtime grants, exact by class (B1 method: the contract suites prove any missing
-- grant empirically; the every-table-has-a-grant-class test proves no table was missed).
-- Append-only legal history: read/append only — no UPDATE, no DELETE, ever.
GRANT SELECT, INSERT ON mcapp.command_receipt_matters TO mc_runtime;

GRANT SELECT, INSERT ON mcapp.command_receipts TO mc_runtime;

GRANT SELECT, INSERT ON mcapp.domain_events TO mc_runtime;

GRANT SELECT, INSERT ON mcapp.security_audit_events TO mc_runtime;

-- Replace-on-save tables: the only product tables whose contracts DELETE (rebuild row sets).
GRANT SELECT, INSERT, UPDATE, DELETE ON mcapp.context_links TO mc_runtime;

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

GRANT SELECT, INSERT, UPDATE ON mcapp.filing_cycles TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.filing_details TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.filing_observations TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.filing_submissions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.goose_db_version TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.graph_nodes TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.import_sources TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.matter_memberships TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.matters TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.milestones TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.parties TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.requirements TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.review_answers TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.review_grids TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.review_question_revisions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.review_questions TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.signature_observations TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.users TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.verifier_designations TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.workspace_memberships TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.workspaces TO mc_runtime;

GRANT SELECT, INSERT, UPDATE ON mcapp.workstreams TO mc_runtime;

GRANT USAGE ON ALL SEQUENCES IN SCHEMA mcapp TO mc_runtime;

-- Functions (trigger guards) stay executable by their trigger; PUBLIC loses direct EXECUTE.
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mcapp FROM PUBLIC;

-- BFF durable-state schema (the table itself comes from ops/adr006/bff-state.sql).
CREATE SCHEMA IF NOT EXISTS mc_bff;

REVOKE ALL ON SCHEMA mc_bff FROM PUBLIC;

ALTER SCHEMA mc_bff OWNER TO mc_owner;

GRANT USAGE ON SCHEMA mc_bff TO mc_owner;
