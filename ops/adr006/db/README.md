# B1 database role profile — operator SQL (ADR-006 addendum)

Single source of truth for the pilot's Supabase role/schema setup; the repeatable Go verification
(`apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go` and
`b1_operator_sequence_test.go`) executes these files verbatim, in this order, on a disposable
fixture — including as a constrained non-superuser CREATEROLE admin on PostgreSQL 16+ semantics.
See `docs/deployment/pilot-deploy-runbook.md` for the full operator procedure.

| File | What it does | When |
|---|---|---|
| `b1-roles.sql` | Bootstrap: roles (`mc_owner` NOLOGIN owner, `mc_migrator`, `mc_runtime`, `mc_maintenance`, `mc_bff`), private schemas `mcapp`/`mc_bff`, owner role GUC + role-level `search_path`, default privileges. **No per-table grants** — on a fresh database those tables do not exist yet | 1st, on a fresh or existing approved database (idempotent; PG16+) |
| `b1-runtime-grants.sql` | Exact per-table runtime grants, sequence USAGE, function EXECUTE hardening, the `mc_search_key_v1(text)` EXECUTE grant | 4th, after the product migrations (fails closed if they did not run) |
| `b1-bff-grants.sql` | `mc_bff` role grants on `mc_bff.state` + `mc_maintenance` cleanup grants | 6th, after `ops/adr006/bff-state.sql` created the table (fails closed otherwise) |

Full order (each step by the documented identity): `b1-roles.sql` → role passwords (operator
step) → product migrations as `mc_migrator` → `b1-runtime-grants.sql` → `ops/adr006/bff-state.sql`
(database admin) + `ALTER TABLE mc_bff.state OWNER TO mc_owner;` → `b1-bff-grants.sql` → probes.

Rules:

- Run the SQL files as a database admin with `ON_ERROR_STOP=1`. A partially applied run is not a
  success: a statement error must stop the sequence and be fixed before continuing.
- PostgreSQL 16+ is required (`GRANT … WITH SET TRUE`, `createrole_self_grant`). On a
  non-superuser CREATEROLE admin the file's first statement (`set_config('createrole_self_grant',
  'SET, INHERIT')`) keeps the SET/INHERIT options the later OWNER-to-owner and role-setting
  statements need; on a superuser connection it is harmless. Actual Supabase admin rights are
  verified at P2.1 of the runbook (`SHOW createrole_self_grant` / `rolcreaterole`), which remains
  a provider gate.
- No passwords or DSNs appear here; set each LOGIN role's password in a separate step (SCRAM),
  e.g. from a secret store, using a URL-safe generation method
  (`openssl rand -hex 24`; base64 values can contain `/`, which structurally breaks connection-URL
  parsing, and `+`, which clients may misinterpret — hex needs no encoding and round-trips):
  `ALTER ROLE mc_migrator PASSWORD '<from secret manager>';` — same for `mc_runtime`, `mc_bff`,
  and (only when activating the cleanup job) `mc_maintenance LOGIN PASSWORD ...`.
- Migration DSN (runbook): `postgres://mc_migrator.<PROJECT_REF>:…@<SESSION_POOLER_HOST>:5432/postgres?sslmode=verify-full`
  — the role GUC makes that connection act as `mc_owner` and the role-level `search_path` below
  resolves `mcapp` without a DSN parameter. A DSN that adds `search_path=mcapp` explicitly still
  works (client startup parameters override role defaults).
- The maintenance role is NOLOGIN until the retention job is activated (it then gets LOGIN and a
  password only). It has zero grants on the product schema; the receipt purge (B7) stays disabled.
- Statements are one per blank-line-separated block (the Go tests rely on this formatting).
