# Pilot deploy runbook — ADR-006 (Workers + Cloud Run + Supabase + R2 + ZITADEL)

- Author: actual ZCode, 2026-10-31, task `MC-ZCODE-DEPLOY-READINESS-FINISH-20261030` (WP-9).
- Status: **RUNBOOK — nothing here has been executed against a provider.** Every provider command
  is a placeholder template with operator-fill values and is marked **NOT_RUN**. This document
  supersedes the operational content of `free-phase-deploy-checklist.md` (see its addendum);
  ADR-004 remains historical approval evidence. Execution requires the PO's scoped cloud
  authorization and the missing operator inputs listed in the cloud-activation packet
  (`docs/testing/zcode-deploy-readiness-finish-20261030-r1/cloud-activation-packet.md`).
- Scope: synthetic-data pilot. No real legal data, no SLA, no production claim, no `$0` claim
  (decision D2 interpretation applies: alerts-before-cost, not cost-impossible).

## 0. Inputs the operator must have (all missing today)

| Input | Used by |
|---|---|
| Cloudflare account, Worker name/origin, R2 bucket (private) + bucket-scoped token | FE deploy, B3 |
| GCP project, Artifact Registry, two service accounts (serving + migrator, PI-02), WIF provider | BE deploy, CI |
| Supabase project ref, session-pooler host/port, CA cert, role passwords in Secret Manager | DB steps |
| ZITADEL instance: web app + API application, redirect URIs for the final FE origin, API key JSON | Auth |
| GitHub protected environment `pilot-deploy` (for the disabled deploy template) | CI (optional) |

## 1. Database: roles, schema, migration (in this exact order)

All commands run as the Supabase project admin connection (SQL editor or psql). **NOT_RUN.**

1. `ops/adr006/db/b1-roles.sql` — roles (`mc_owner` NOLOGIN, `mc_migrator`, `mc_runtime`,
   `mc_maintenance`, `mc_bff`), private schemas `mcapp`/`mc_bff`, default privileges, per-table
   grants. Idempotent; re-run after migrations.
2. Product migrations as the migration identity — the DSN carries
   `search_path=mcapp`; the role GUC in the profile makes the connection act as `mc_owner`:

   ```sh
   # placeholder — NOT_RUN; DATABASE_URL from Secret Manager, never on the command line in logs
   MC_DATABASE_URL="postgresql://mc_migrator.<PROJECT_REF>:<PW>@<SESSION_POOLER_HOST>:5432/postgres?sslmode=verify-full&sslrootcert=<CA>&search_path=mcapp" \
     mcapi migrate   # Cloud Run job: ops/deploy/cloud-run/migrate-job.yaml (rendered by ops/deploy/profiles.mjs)
   ```

3. `ops/adr006/db/b1-roles.sql` again (idempotent re-run: per-table grants, sequence USAGE and the
   function EXECUTE revoke land on the migrated objects).
4. `ops/adr006/bff-state.sql` — as the **database admin** (its
   `CREATE SCHEMA IF NOT EXISTS` requires database-level CREATE even when the schema already
   exists; a right the migration identity deliberately lacks), then
   `ALTER TABLE mc_bff.state OWNER TO mc_owner;`
5. `ops/adr006/db/b1-bff-grants.sql` — BFF role and maintenance-role grants on `mc_bff.state`.
6. Passwords (operator step, from the secret store; SCRAM): `ALTER ROLE mc_migrator PASSWORD …`,
   `mc_runtime`, `mc_bff`, and — only when activating the cleanup job —
   `mc_maintenance LOGIN PASSWORD …` (it stays NOLOGIN until then).
7. **Negative tests (provider, NOT_RUN):**
   - Data API: a request with the publishable/anon key against `mcapp.*` and `mc_bff.*` must fail
     or return nothing (schemas are private and nothing is granted to PUBLIC — verified locally by
     the B1 test's `public has nothing on the private schemas` subtest).
   - IAM: the serving SA must be DENIED `gcloud secrets versions access` on
     `MIGRATE_DATABASE_URL_SECRET`; the migrator SA must be denied nothing it needs. This is the
     PI-02 negative verification plan; it can only run once the SAs exist.

### Connection budget (WP-8 calculation — why `MC_DB_MAX_CONNS` was NOT added)

pgx pool is fixed at 10 per mcapi instance (code, `pool.go`) × `maxScale 3` = 30; a rolling deploy
briefly doubles that (old+new revisions) → 60; BFF opens one short connection per state
transaction × FE concurrency 20 × FE maxInstances 2 → up to 40 short-lived; migrator/ops ≤ 2.
Worst case ≈ 102 simultaneous client connections, all through the **session pooler** (the direct
path is used only by migrations/backups, ≤ 2 connections — well inside the documented Free-compute
direct limit of ~60). The shared-pooler **client** limit for the project's plan/compute could not
be verified this session (the limits page was unavailable; [recall] default ≈ 200 clients).
Because the budget does not exceed any documented limit, the `MC_DB_MAX_CONNS` knob was **not**
added. If provider qualification measures a lower client cap, that knob is the named backend
follow-up — activation stays blocked until then.

## 2. Backend (Cloud Run)

1. Build and push the image once; record the **digest**
   (`asia-southeast1-docker.pkg.dev/<PROJECT>/mattercontrol/mcapi@sha256:…`). **NOT_RUN.**
2. Fill a non-secret values JSON; render
   (`node ops/deploy/profiles.mjs cloud-run values.json out/`): the renderer fails closed on
   placeholders, mutable tags, equal serving/migrator SAs (PI-02), and non-https endpoints.
3. IAM grants (per secret, accessor only): serving SA → `DATABASE_URL_SECRET`,
   `R2_*_SECRET`, `OIDC_KEY_SECRET`; migrator SA → additionally
   `MIGRATE_DATABASE_URL_SECRET`. No broader Secret Manager roles. **NOT_RUN.**
4. Apply the rendered `migrate-job.yaml` + `service.yaml` (`gcloud run jobs replace/execute`,
   `gcloud run services replace`). Migrate runs BEFORE the service rollout, sequentially.
   **NOT_RUN.** (The disabled CI template `ops/deploy/ci/deploy.yml.disabled` encodes this order
   with Workload Identity Federation and no long-lived keys; enabling it is a separate decision.)
5. Probes: `/healthz`, `/readyz`. `/readyz` pings the product database with a 500 ms deadline
   (existing code + test), so an authenticated scheduled probe doubles as the Supabase keep-alive.
6. Env summary: `MC_OIDC_CACHE_TTL=30s` (ADR-004 decision 4; PI-01 restored),
   `MC_OBJECT_BACKEND=r2`, `MC_TRANSFER_TIMEOUT=60s`, `MC_MAX_IN_FLIGHT=10`,
   `MC_SHUTDOWN_TIMEOUT=8s`, `MC_MAX_UPLOAD_BYTES=26214400`.

## 3. Frontend (Cloudflare Worker; App Hosting is the ADR-007 alternative)

1. `pnpm build:worker` (OpenNext 1.20.14, Cache Components off). CI builds it and runs the
   release preflight over `.open-next` (PI-03) — no local secret files may leak into the artifact.
2. `wrangler.jsonc` vars: `BFF_STATE_BACKEND=postgres`, `AUTH_ALLOW_ANONYMOUS=false`,
   `SESSION_COOKIE_SECURE=true`, `API_BASE_URL` = the real BE `/api/v1` URL.
   Secrets via `wrangler secret put`: `BFF_DATABASE_URL` (BFF role, `sslmode=verify-full`),
   `BFF_STATE_KEYS`, optionally `BFF_DATABASE_CA`. Optional non-secret:
   `BFF_MAX_PENDING_BYTES` (WP-7 ceiling; default 5 MiB sealed estimate — PO decision D7).
3. Deploy (`wrangler versions upload`), then set `APP_ORIGIN` to the final origin and register the
   matching ZITADEL redirect/post-logout URIs (same public origin as `APP_ORIGIN`).
4. **NOT_RUN** end to end; Worker Free CPU/memory/latency for large pending imports stays unproven
   (the WP-7 ceiling bounds it; do not raise it to "make it fit").

## 4. Smoke tests (synthetic users A and B) — NOT_RUN

- Sign in through ZITADEL; reload; sign out; sign in again.
- Create workspace → matter → add user B to the matter; B sees it, a non-member gets 403/404.
- Add action/requirement; reload; persist.
- **Document upload**: 1 MB and near-25 MiB synthetic file; download; compare SHA-256 byte-for-byte
  (the streamed document path — bounded by `MC_MAX_UPLOAD_BYTES`, NOT by the WP-7 import ceiling);
  re-upload the same file → "already stored".
- Export CSV; import preview without commit.
- Negative: wrong `Origin` on upload refused; non-member 403/404; publishable-key request to the
  private schemas returns nothing (Data API negative).
- Restart the Worker → users sign in again (sessions survive on durable state only if the same
  origin/issuer/keys; a NEW origin is a controlled re-login).

## 5. Backups, restore and retention (WP-6)

- **Scheduled dump**: `ops/backup/scheduled-dump.sh` from a scheduler (Cloud Run Job /
  Cloud Scheduler / VM timer) with `MC_BACKUP_DSN` from the secret store and `MC_BACKUP_DIR` on a
  **second location** (persistent disk or R2 prefix with its own token). Keeps the newest
  `MC_BACKUP_RETAIN` (default 7) archives + SHA-256 sidecars; verifies each archive lists its
  TABLE DATA entries. Script logic was exercised locally (80 TABLE DATA entries per archive,
  retention prune verified); a provider-scheduled run is **NOT_RUN**.
- **Restore rehearsal** (the RPO/RTO local condition; measured 2026-10-31 on PostgreSQL 18.6,
  schema 0001→0010, evidence `docs/testing/zcode-deploy-readiness-finish-20261030-r1/restore/`):
  seed through the real services (14.5 s) → backup 0.277 s (256,971 bytes, sha256 recorded) →
  restore 0.383 s → row-census and object-hash IDENTICAL → post-boundary marker absent from the
  restore → readback through the real services IDENTICAL (also after restart) → corrupt/truncated
  archives refused; altered/missing object detected. Local synthetic drill only — not a
  production RPO/RTO commitment.
- **BFF state cleanup**: `mcapi` repo ships `cmd/mcbffcleanup` (bounded DELETE batches on
  `mc_bff.state`, `expires_at < now − MC_BFF_RETENTION_GRACE` default 24 h, max-rows cap,
  counts-only logging). Schedule it (e.g. hourly) with the `mc_maintenance` role DSN after
  activating that role (`ALTER ROLE mc_maintenance LOGIN PASSWORD …`). It can touch nothing else —
  proven by the B1/retention tests. Receipts (B7) are never purged (DISABLED by default, PO decision D5).
- **Keep-alive (Supabase Free auto-pause)**: `/readyz` performs a real DB ping (500 ms deadline),
  so a scheduled authenticated probe of `/readyz` is a genuine keep-alive. Provider scheduling
  **NOT_RUN**.

## 6. Monitoring (B9 minimum set) — rules prepared; destinations/alerts NOT_RUN

| Signal | Where | Note |
|---|---|---|
| 5xx rate, p50/p95 latency, instance count | Cloud Run metrics | alert on sustained 5xx; exclude first cold start |
| Budget alerts | GCP billing | 1 / 5 / 10 USD — alerts-before-cost, not a cap (decision D2) |
| DB size | Supabase dashboard | check at 400 MB of 500 MB |
| R2 storage + Class A/B ops | Cloudflare dashboard | against 10 GB / 1M / 10M |
| ZITADEL DAU | ZITADEL console | free tier 100 DAU |
| Repeated auth failures / denials | `security_audit_events` (outcomes) | no tokens/content in labels |
| Backup/restore failure | dump job exit + `scheduled-dump.sh` summary line | a silent backup gap is a failure |

## 7. Rollback

- Code: Cloud Run → route traffic to the previous revision; Worker → `wrangler rollback <version>`;
  App Hosting → previous rollout; VM → previous image digest. Keep the previous revision/version
  until the smoke set passes.
- Schema: forward-fix only; never run Down migrations in place. Restore-from-dump into a clean
  project is the faulty-migration path (see the rehearsal).
- Objects: immutable and content-addressed; code rollback needs no object rollback.
- Keys: removal of a `BFF_STATE_KEYS` entry logs those sessions out — never do it while commands
  have unknown outcomes.

## 8. Secret rotation (B8; procedure only — nothing rotated)

- DB role passwords / R2 tokens / ZITADEL key: issue the new credential → deploy the new value →
  verify provider acceptance → revoke the old → confirm. Compromise path: revoke immediately and
  destroy dependent sessions.
- BFF state sealing keys: **add** a new key id to `BFF_STATE_KEYS`, switch `BFF_STATE_KEY_ID` to
  it, and keep the previous entry until all rows sealed under it have expired or are deliberately
  invalidated. Removing an old key early invalidates those sessions/attempts.
- `MC_OIDC_CACHE_TTL` note: token revocation at ZITADEL can take up to 30 s to be observed
  (approved TTL; workspace/matter membership is DB-resolved per request and is not affected).

## 9. Cleanup (end of pilot)

Delete, in order: Worker versions, Cloud Run service + migrate job, Artifact Registry images,
Secret Manager versions, the two SAs + WIF bindings, R2 bucket contents + token, ZITADEL
project/application, Supabase project (or pause). Record what was deleted and when. **NOT_RUN.**

## 10. Explicitly out of scope of this runbook

Real legal data, residency decision (D3), rate admission quotas (B3/D4), receipt retention (B7/TB-06),
custom domain/WAF, horizontal FE scaling, production SLA. Each is a separate PO decision.
