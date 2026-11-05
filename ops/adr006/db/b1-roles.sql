-- B1 least-privilege database role profile (ADR-006 zero-trust addendum) — operator deliverable,
-- BOOTSTRAP part 1 of 2 (roles, schemas, default privileges; no per-table grants).
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
--   * PostgreSQL 16+ required (the GRANT ... WITH SET TRUE syntax below and the
--     createrole_self_grant GUC are 16+). Requires nothing beyond the documented admin rights
--     (see the README): the GUC block below lets a non-superuser CREATEROLE admin keep the
--     SET/INHERIT rights on the roles it creates here, which the later OWNER-to-owner and
--     role-setting statements need. On a superuser connection the block is harmless.
--   * No table or function grants here: on a fresh database the tables/functions only come into
--     being with the product migrations. Per-table runtime grants, sequence USAGE, the function
--     EXECUTE hardening and the Search EXECUTE grant live in b1-runtime-grants.sql (part 2),
--     applied AFTER the migrations. This file has no unconditional dependency on migrated objects.
--
-- Apply order on a fresh database (each step by the documented identity, see the README):
--   1. this file (bootstrap; roles exist before anything else logs in),
--   2. safe role-password setup (operator step),
--   3. product migrations as mc_migrator (the role GUC below makes every migration connection act
--      as mc_owner, so migration objects — and goose_db_version — are owned by the NOLOGIN owner;
--      the role-level search_path below resolves mcapp without a DSN parameter),
--   4. ops/adr006/db/b1-runtime-grants.sql (per-table grants, sequences, function hardening),
--   5. ops/adr006/bff-state.sql as the database admin (its CREATE SCHEMA IF NOT EXISTS needs
--      database-level CREATE even when this file already made the schema; follow it with
--      ALTER TABLE mc_bff.state OWNER TO mc_owner),
--   6. ops/adr006/db/b1-bff-grants.sql,
--   7. runtime/BFF probes.
-- Every step is idempotent; re-running 1/4/5/6 after the migrations is the supported order.
--
-- Data API exposure: product tables live in the private schema `mcapp` (never `public`), so the
-- Supabase Data API (which exposes `public` only) has nothing to serve, and nothing is granted to
-- PUBLIC anywhere below. The operator Data-API negative test (publishable key against these
-- schemas) remains a required provider step — see the pilot deploy runbook.

-- PG16+ CREATEROLE semantics: a non-superuser role that creates roles receives ADMIN OPTION on
-- them only. SET/INHERIT options (needed to SET ROLE into the owner, transfer ownership, set
-- role-level GUCs and act as the owner's member) must be granted at creation time via this GUC
-- (settable by CREATEROLE roles). Unknown on older servers: skipped there; PG16+ is required above.
DO $do$ BEGIN PERFORM set_config('createrole_self_grant', 'SET, INHERIT', false); EXCEPTION WHEN undefined_object THEN NULL; END $do$;

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
-- owned by the NOLOGIN owner, never by a LOGIN role. The role-level search_path resolves mcapp
-- on a fresh connection without a DSN parameter (server-side; the session pooler forwards nothing).
GRANT mc_owner TO mc_migrator WITH SET TRUE;

ALTER ROLE mc_migrator SET role = 'mc_owner';

ALTER ROLE mc_migrator SET search_path = mcapp;

ALTER ROLE mc_runtime SET search_path = mcapp;

GRANT USAGE ON SCHEMA mcapp TO mc_runtime;

-- Future migration objects are born without PUBLIC rights, with only a read/append floor:
-- UPDATE (and DELETE) are always deliberate per-table grants in b1-runtime-grants.sql, so a
-- future append-only table can never silently inherit a blanket UPDATE default.
ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp REVOKE ALL ON TABLES FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp REVOKE ALL ON FUNCTIONS FROM PUBLIC;

ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp GRANT SELECT, INSERT ON TABLES TO mc_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp GRANT USAGE ON SEQUENCES TO mc_runtime;

-- BFF durable-state schema (the table itself comes from ops/adr006/bff-state.sql).
CREATE SCHEMA IF NOT EXISTS mc_bff;

REVOKE ALL ON SCHEMA mc_bff FROM PUBLIC;

ALTER SCHEMA mc_bff OWNER TO mc_owner;

GRANT USAGE ON SCHEMA mc_bff TO mc_owner;
