# B1 database role profile — operator SQL (ADR-006 addendum)

Single source of truth for the pilot's Supabase role/schema setup; the repeatable Go verification
(`apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go`) executes these files
verbatim. See `docs/deployment/pilot-deploy-runbook.md` for the full operator procedure.

| File | What it does | When |
|---|---|---|
| `b1-roles.sql` | Roles (`mc_owner` NOLOGIN owner, `mc_migrator`, `mc_runtime`, `mc_maintenance`, `mc_bff`), private schemas `mcapp`/`mc_bff`, default privileges, exact per-table runtime grants | First, on a fresh or existing approved database (idempotent) |
| `b1-bff-grants.sql` | `mc_bff` role grants on `mc_bff.state` + `mc_maintenance` cleanup grants | After `ops/adr006/bff-state.sql` has created the table (fails closed otherwise) |

Rules:

- Run both as a database admin. No passwords or DSNs appear here; set each LOGIN role's password in
  a separate step (SCRAM), e.g. from a secret store:
  `ALTER ROLE mc_migrator PASSWORD '<from secret manager>';` — same for `mc_runtime`, `mc_bff`,
  and (only when activating the cleanup job) `mc_maintenance LOGIN PASSWORD ...`.
- Migration DSN (runbook): `postgres://mc_migrator:…@host/db?sslmode=verify-full&search_path=mcapp`
  — the role GUC in `b1-roles.sql` makes that connection act as `mc_owner`, so migration objects
  are owned by the NOLOGIN owner.
- The maintenance role is NOLOGIN until the retention job is activated (it then gets LOGIN and a
  password only). It has zero grants on the product schema; the receipt purge (B7) stays disabled.
- Statements are one per blank-line-separated block (the Go test relies on this formatting).
