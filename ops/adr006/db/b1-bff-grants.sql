-- B1 least-privilege database role profile (ADR-006 zero-trust addendum), part 2 of 2: grants for
-- the dedicated BFF role and the bounded BFF-state cleanup role on `mc_bff.state`.
--
-- Apply order: `b1-roles.sql` (roles + schemas) → product migrations → `ops/adr006/bff-state.sql`
-- (creates `mc_bff.state`) → THIS FILE. The grants below fail closed if the table is missing, so
-- applying this file before `bff-state.sql` is an operator error that stops the run.
--
-- THIS FILE IS THE SINGLE SOURCE OF TRUTH together with `b1-roles.sql`: the repeatable
-- verification (apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go)
-- executes it verbatim.
--
-- Conventions: idempotent; NO passwords/DSNs; one SQL statement per blank-line-separated block.

-- Dedicated BFF login role: exactly mc_bff.state, nothing else (no product tables, no CREATE,
-- no schema ownership).
GRANT USAGE ON SCHEMA mc_bff TO mc_bff;

REVOKE CREATE ON SCHEMA mc_bff FROM mc_bff;

GRANT SELECT, INSERT, UPDATE, DELETE ON mc_bff.state TO mc_bff;

-- Bounded expired-row cleanup (BFF state retention job) runs as the maintenance role: reading and
-- deleting expired BFF state is all it can do — no product schema access, no INSERT anywhere.
GRANT USAGE ON SCHEMA mc_bff TO mc_maintenance;

GRANT SELECT, DELETE ON mc_bff.state TO mc_maintenance;

-- Receipt purge (B7) stays DISABLED: mc_maintenance deliberately has zero grants on mcapp.
