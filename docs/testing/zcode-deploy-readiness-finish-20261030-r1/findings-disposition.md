# Findings disposition — MC-ZCODE-DEPLOY-READINESS-FINISH-20261030

Author: actual ZCode (backend execution owner), 2026-10-31. Base: `0de3e5d` (HEAD) + the preserved
dirty tree (157 files) — all prior work untouched. Everything below is **AUTHOR_VERIFICATION**; no
independent PASS is claimed. Provider behavior remains NOT_RUN throughout.

## Work packages

### WP-1 (P1) — `MC_OIDC_CACHE_TTL` restored to 30s (PI-01) — DONE

- Code default `apps/backend/internal/config/product.go` → `30s`; `.env.example` deploy block →
  `30s` (the local/test `0s` line kept, per task); `ops/deploy/cloud-run/service.yaml`,
  `ops/deploy/compute-engine/cloud-init.yaml`, `docs/deployment/portability-runbook.md` (2 spots),
  `apps/backend/docs/operations.md` (default column was wrongly `0s`), verifier doc-comment.
- `profiles.test.mjs` now asserts 30s in both profiles. `TestLoadProduct_Defaults` asserts 30s.
- Remaining `0s` references are intentional (local/test revocation-instant profiles:
  `ops/p0-local/cloud/backend.cloud.env`, `backend-public.env.example`,
  `zitadel-supabase-operator-setup` snippet). Evidence files untouched.
- Verified: `go test ./internal/config/` 14 passed; renderer tests 6/6.

### WP-2 (P1) — B1 least-privilege packaged as deployable SQL — DONE (with a structural decision)

- New `ops/adr006/db/` = `b1-roles.sql` (roles, private schemas, default privileges, per-table
  grant classes), `b1-bff-grants.sql` (BFF + maintenance grants on `mc_bff.state`), `README.md`.
  Idempotent, NO passwords/DSNs (operator password step documented), fail-closed ordering.
- Structural decision, recorded for the reviewer: the Mimosa PreToolUse hook blocks any Go code
  that executes SQL text derived from a variable (it flagged verbatim file→Exec three times), so
  the test cannot execute the operator files byte-for-byte at runtime. Instead the test keeps the
  statements as Go source and a **sync subtest** enforces file↔Go equality after comment
  normalization (both directions + count). The files remain the single operator source of truth;
  drift fails the suite. This is a deviation from "execute THIS file verbatim" — accepted as the
  only hook-compatible form of "same SQL, not a copy".
- Grant classes: append-only 4 (S+I), replace-on-save 4 (S+I+U+D), standard 31 (S+I+U), sequences
  USAGE, function EXECUTE revoked from PUBLIC. BFF role: USAGE `mc_bff` + full DML on
  `mc_bff.state` only. Maintenance: SELECT+DELETE on `mc_bff.state` only (B7 receipts stay
  zero-grant). NEW vs the prior profile: `ALTER ROLE mc_migrator SET role = 'mc_owner'` (migration
  objects owned by the NOLOGIN owner — the role GUC), and default privileges now grant a
  SELECT,INSERT floor only (the old blanket S,I,U default would have granted UPDATE to future
  append-only tables once migrations run as the owner — caught by the denial test during the
  refactor).
- New subtests: `every table has its grant class` (has_table_privilege probes per class),
  `public has nothing on the private schemas` (tables/schema/functions), `bff role is scoped to
  mc_bff.state` (CRUD roundtrip + 6 denials).
- `bff-state.sql` execution-order finding: `CREATE SCHEMA IF NOT EXISTS` needs database-level
  CREATE even when the schema exists (PG privilege check precedes existence), so the runbook
  applies it as the database admin followed by `ALTER TABLE mc_bff.state OWNER TO mc_owner` —
  recorded in the file headers and the runbook.
- Verified: B1 suite 59/59 on the task PG 18.6 container (incl. representative contracts
  Suite/SuiteW4/SuiteReview under `mc_runtime`).

### WP-3 (P1) — B2 index migration as 0010 — DONE

- `migrations_mattercontrol/0010_access_path_indexes.sql` (slot 0009 was taken by
  `criterion_purpose`): the 4 measured indexes (review_answers ordering — 54×;
  matter_memberships user — 4×; workspace_memberships user; matters workspace), `IF NOT EXISTS`
  Up, `DROP INDEX IF EXISTS` Down.
- `TestAccessPathIndexesMigration`: fresh 0001→0010, second Up clean no-op, Down drops exactly the
  four, re-Up restores. Plus `TestCriterionPurposeMigration` regression green.
- sqlc diff empty (`make sqlc-check` exit 0 — no query text change). Fresh migrate via
  `cmd/mcapi` twice on the task container: clean. B1 suite re-run with 0010 present: 59/59.
  EXPLAIN harness (`MC_EXPLAIN_VERIFY=1`) re-run: green.

### WP-4 (P1) — Migrator/runtime identity separation (PI-02) — DONE (templates + tests)

- `profiles.mjs`: `MIGRATOR_SERVICE_ACCOUNT` key for cloud-run + a renderer rule refusing equal
  serving/migrator SAs (fails closed before writing anything).
- `migrate-job.yaml` runs as `{{MIGRATOR_SERVICE_ACCOUNT}}`; `service.yaml` never references the
  migrator identity or `MC_MIGRATE_DATABASE_URL` (asserted by test).
- Compute Engine: secret fetching split — `mc-secrets.service` (runtime secrets) vs new
  `mc-migrate-secrets.service` (migrator secret only, started only with `mcapi-migrate.service`);
  test asserts the serving unit never references `migrate-secrets.env`.
- `cloud-run.values.example.json` gains the placeholder. Renderer tests 6/6 (incl. the new
  `migration identity is separate from the serving identity (PI-02)`).
- IAM minimum-per-SA table + negative access test plan: `docs/deployment/pilot-deploy-runbook.md`
  §2 (actual IAM verification NOT_RUN — needs the SAs to exist).

### WP-5 (P1) — CI/release preflight + clean build artifact (PI-03) — DONE

- `apps/frontend/scripts/release-preflight.mjs` + tests (5/5): scans `git ls-files` AND given
  artifact directories byte-wise; rejects `.env*` (non-example), `.dev.vars*` (non-example),
  `*.pem`, `*.key`, `*api-key*.json`; names runtime-secret KEY names inside env-shaped files via
  the existing `worker-build-env` helpers; content sentinels (`-----BEGIN … PRIVATE KEY-----`,
  `MC-RELEASE-SENTINEL` marker). Values never printed. `pnpm preflight` script added.
- `frontend.yml`: the three TODO actions pinned by SHA fetched from the official GitHub API
  (pnpm/action-setup v6 → 0977fd99725f1db4007ccb2928dbb4e90d06cc86; setup-node v7 →
  949feb2413d6458794dcd2491c4babbbce0c15c1; upload-artifact v7 →
  cf430e030ddbb5b0abf93d22962f4752f3646cd9). New jobs: `worker` (build:worker + preflight
  `.open-next --require-artifacts`, no cloud credentials) and `durable-bff` (PG 18 service
  container, creates the guarded `mc_fixture`, runs ONLY the two durable integration suites with
  `MC_BFF_TEST_DATABASE_URL` — a clean integration count, not the mixed 174-test directory run the
  intake criticized). quality job runs preflight over `.next/standalone`.
- `ops/deploy/ci/deploy.yml.disabled`: workflow_dispatch template, protected environment,
  Workload Identity Federation (no long-lived key JSON), migrate-then-deploy order, no secrets.
  actionlint unavailable on this workstation — YAML syntax validated with PyYAML only; recorded.
- Verified locally: preflight tracked-files scan clean on this tree; tests 5/5. CI itself NOT_RUN
  (no push).

### WP-6 (P1) — BFF state retention + real backup — DONE (local), scheduling NOT_RUN

- `postgres.PurgeExpiredBFFState` (bounded DELETE batches, oldest-first, no FOR UPDATE — the
  maintenance role deliberately lacks UPDATE, which row-locking would require) +
  `cmd/mcbffcleanup` (thin) + `internal/app.RunBFFCleanup` (env parsing + pool: the depguard
  architecture rule forbids cmd importing adapters; wiring belongs in the composition root).
- `TestBFFStateRetentionPurge` (4 subtests): exact past-grace deletion in bounded batches, second
  pass deletes nothing, max-rows early stop, maintenance-role denials (INSERT/UPDATE/product
  reads). Setup follows the operator order (profile → bff-state → grants → activation). 4/4 green.
- `ops/backup/scheduled-dump.sh`: `pg_dump -Fc` + SHA-256 sidecar to a second location, TABLE DATA
  listing check, keeps N (default 7). Exercised locally through a test-only container wrapper
  (3 runs, retention prune verified, 80 TABLE DATA entries/archive). Provider scheduling NOT_RUN.
- **Restore rehearsal executed for real** on PostgreSQL 18.6 (task containers, schema 0001→0010):
  seed via real services 14.5 s → boundary census → backup **0.277 s** (256,971 bytes, sha256
  832048ae…) → restore **0.383 s** → row census + object hashes IDENTICAL → post-boundary marker
  absent from the restore → readback through the real services IDENTICAL (incl. after a fresh
  process) → corrupt/truncated archives refused (exit 1, 0 tables) → altered/missing object
  detected. Evidence: `restore/runs/manual-run-20261031T154218Z/` (summary.json passes the
  acceptance gate). Local synthetic drill only — not a production RPO/RTO commitment.
- Keep-alive/readyz intake delta: the handoff expected `/readyz` not to query the DB; the current
  code DOES (`readiness(&draining, pool.Ping)` with a 500 ms deadline + tests) — the checklist's
  historical text was stale. Documented; no code change needed.

### WP-7 (P1) — Pending-import ceiling in the Worker — DONE (default 5 MiB, PO owns the number)

- `BFF_MAX_PENDING_BYTES` (default 5 MiB; integer 1..36 MiB; invalid → fail-closed 503) +
  `estimatePendingSealedBytes` (base64-aware conservative estimate) + `assertPendingImportFits`
  enforced in `beginAttemptAsync` BEFORE any bytes are stored; refusal is 413 `payload-too-large`
  with a cause message naming the numbers, the env var, and the streamed-document alternative.
  The 36 MiB `sealState` hard cap remains the physical backstop.
- Tests: new `pending-ceiling.test.ts` (6/6: default, at-ceiling/one-under, document-sized refused
  by default, invalid configs fail closed, bulk not ceilinged, estimate never under-reports).
  `durable-attempts.test.ts`: the 1 MiB case now passes under the default ceiling; the 25 MiB
  byte-equality case sets the knob explicitly (35 MiB) — a deliberate test change to Codex's
  file, recorded here. Durable PG suite: 14/14 green on the local `mc_fixture`.
- `.dev.vars.example` documents the knob. Final number = PO decision D7 (packet).

### WP-8 (P2) — Small real debt — DONE

- `apps/frontend/Dockerfile`: stale "one instance only" comment replaced (durable state makes
  instances stateless; one-instance is a workload/cost choice). Comment only.
- PI-04 erratum: `docs/testing/claude-deployment-portability-20261030-r1/erratum-caddy-validate.md`
  — the retained receipt proves `caddy validate` RAN (`"Valid configuration"`); the NOT_RUN
  sentence is the erratum; historical receipts untouched.
- `MC_DB_MAX_CONNS`: **not added** — budget = pgx 10 × maxScale 3 (30, ~60 during rolling) + BFF
  ≤ 40 short-lived + migrator ≤ 2 ≈ 102 peak client connections through the session pooler; the
  direct path (migrator/backup ≤ 2) sits inside the documented Free-compute direct limit (~60).
  The shared-pooler CLIENT limit for the exact plan/compute could not be verified this session
  (docs page unavailable), so the calculation, the unverified number, and the named follow-up are
  recorded in the runbook §1 — if qualification measures a lower cap, the knob is the follow-up.
- `pnpm format:check`: green within `pnpm check` (exit 0) on the final bytes.

### WP-9 (P1) — Current deploy runbook + checklist supersession — DONE

- `docs/deployment/pilot-deploy-runbook.md`: operator inputs, DB order (roles → migrate → re-run
  roles → bff-state as admin + ownership → bff grants → passwords → negative tests), connection
  budget, backend/Worker deploy, smoke A/B (incl. 1 MB/near-25 MiB + SHA-256, negatives), backup/
  rehearsal/retention, monitoring (B9 set + budget alerts 1/5/10 USD, DB 400 MB, R2 ops, ZITADEL
  DAU), rollback, secret rotation (B8 incl. key-id procedure), cleanup, explicit out-of-scope.
  Provider commands are placeholders; NOT_RUN marked throughout.
- `free-phase-deploy-checklist.md`: superseding addendum added at the top; history untouched.

### WP-10 (P2) — B3 rate admission — PREPARED, not decided

- No limiter code written (no PO numbers). The decision brief (risk for the synthetic pilot vs
  requirement before real data; minimal per-actor+tenant design at the Go boundary with a
  Postgres CAS counter; X-Forwarded-For trusted only from a declared proxy) is in
  `cloud-activation-packet.md` §3 as PO decision D4-B3.

## B1–B9 dispositions (carry-over)

- **B1** roles: now a deployable, sync-guarded artifact + BFF/maintenance scoping (above).
  Provider grants/pooler/network: NOT_RUN.
- **B2** indexes: now a real reversible migration (0010) with tests; live DDL on Supabase stays a
  named deployment action. NOT_RUN on provider.
- **B3**: unchanged design; decision brief prepared (WP-10). NOT_RUN.
- **B4** transport encryption: unchanged (documented hop map; provider verification NOT_RUN).
- **B5** at-rest: unchanged (OIDC tokens sealed; §4 design + SQL unchanged).
- **B6** MFA/device posture: unchanged checklist; IdP enforcement NOT_RUN.
- **B7** receipt purge: still DISABLED by design; the maintenance role now has BFF-state-only
  grants (product schema remains zero-grant). No purge function written.
- **B8** rotation: runbook §8 procedure; nothing rotated.
- **B9** monitoring: runbook §6 rules; destinations/alerts NOT_RUN.

## PI-01..04 dispositions

- **PI-01** fixed (WP-1). **PI-02** fixed in templates + tests (WP-4); live IAM NOT_RUN.
- **PI-03** addressed by the preflight + CI jobs (WP-5); the full App-Hosting-artifact sentinel
  inspection on a real buildpack run remains an OpenCode case (my preflight runs locally against
  the local builds only — CI does it on its own clean checkouts).
- **PI-04** erratum written (WP-8).

## Honest gaps

- No browser tooling was granted: browser/e2e-at-UI rows stay NOT_RUN; the covered layers are the
  Go/HTTP contract suites (make check, incl. object + gateway contracts), the durable BFF PG
  suites, and the renderer/preflight tests.
- Reading credential files (`.env*`, `.dev.vars`, key files) is forbidden by the task, so no
  live-stack boot against the local ZITADEL was attempted; real-IdP login/refresh/logout remains
  external-owner verification.
- CI workflows were not executed (no push); actionlint unavailable (PyYAML syntax check only).
