# Deploy Checklist — "Free phase" (Workers + Cloud Run + Supabase Free + R2 + ZITADEL)

> **ADDENDUM — 2026-10-31: superseded by `docs/deployment/pilot-deploy-runbook.md`.** The current,
> authoritative pilot deployment procedure (ADR-006 order, smoke tests, rollback, monitoring,
> rotation, backup/retention, connection budget) lives there. This checklist is retained as
> historical evidence; the Cloud Run-frontend instructions below must not be executed (see the
> 2026-10-29 topology amendment). Nothing in the runbook has been executed against a provider.

- Author: Claude Code (actual), 2026-10-29; topology amendment by Local Codex, 2026-10-29. Status: **PROPOSED — NOT APPROVED, NOT EXECUTED**. ADR-006 controls the current topology; ADR-004 is retained as historical review evidence.
- Scope: a **pilot with synthetic data only**. No real legal data, no SLA, no production claim. Hosting outside Cloudflare is an ADR-001 H1 exception that the Product Owner must accept first.
- Evidence classes: **[page]** read on the official page this session; **[repo]** read in the working tree; **[recall]** from memory, verify on the official page before relying on it.

> **Current topology amendment — 2026-10-29:** Use ADR-006 as the controlling topology: Next.js on Cloudflare Workers; Go backend on Cloud Run `asia-southeast1`; Supabase PostgreSQL in exact region `ap-southeast-1`; private R2 for images/files. The Cloud Run-frontend instructions below are retained as historical checklist evidence and **must not be executed**. Before this checklist can be used, replace them with the ADR-006 gates: compare the exact current vinext/OpenNext candidates; select one from evidence; implement durable OIDC sessions and pending-transfer recovery; verify cookies, OIDC, Server Actions, BFF calls and near-25 MiB uploads on the Worker runtime; then record Worker Free CPU/request/quota evidence. The strict `$0` target remains unproven, Workers/R2 do not prove Singapore residency, and ZITADEL region remains unresolved. This amendment is not deployment, purchase, account, billing or real-data approval.

> **Portability amendment — 2026-10-30:** Alternative FE (Firebase App Hosting) and BE (Compute Engine) profiles are defined in ADR-007 and `docs/deployment/portability-runbook.md`. They do not change this checklist's default target. App Hosting needs the Blaze plan; a Singapore Compute Engine VM is outside the e2-micro free tier.

## What "free" means here (read first)

| Service | Free allowance used | Source | Catch for this product |
|---|---|---|---|
| Supabase Free | 500 MB DB, 2 active projects, 5 GB egress | [page] | **Paused after 1 week of inactivity; no automatic backups; no PITR.** A paused project is down until restored |
| Cloudflare R2 Standard | 10 GB-month, 1M Class A, 10M Class B, no internet egress fee | [page] | Not a hard cap (overage is billed); enabling R2 may require a payment method (repo doc: checkout) |
| ZITADEL Cloud Free | 100 daily active users, unlimited stored users | [page] | Custom domain and uptime guarantee are paid; introspection rate limits are not published |
| Cloud Run | about 2M requests, 180k vCPU-s, 360k GiB-s per month, 1 GiB egress (North America) | [recall] | **Needs a billing account with a payment method and has no hard spending cap**; always-on instances (min-instances ≥ 1) would likely exceed it |
| Artifact Registry, Cloud Build, Secret Manager, Cloud Scheduler, Cloud Logging | small free allowances | [recall] | Keep image tags few, secret versions few, logs modest |

**$0 is a target, not a guarantee.** `free-tier-budget.md` still rates the total UNKNOWN. Guardrails below turn "free" into "alerts fire before money is spent", not into "money cannot be spent".

## Product consequences of going free (accept explicitly)

- Frontend runs `min-instances=0, max-instances=1`: it scales to zero, so **sessions live in process memory and are lost after idle, restart, or deploy** (ADR-004 B1). Users sign in again through ZITADEL; unresolved import/bulk attempts are lost.
- Supabase Free can pause: a keep-alive is required, and there are **no backups** unless we make them (below).
- Public URLs are the `*.run.app` addresses: no custom domain, no Cloudflare proxy. `APP_ORIGIN`, the ZITADEL redirect URI and the `__Host-` cookies all use the frontend's `*.run.app` origin.
- Latency: cold starts (Node frontend several seconds) and cross-region hops; choose one region near the Supabase project.

## 0. Gate — do not start until all are checked

- [x] PO accepted ADR-001 H1 (backend and database outside Cloudflare), 2026-10-29, with its three consequences (see ADR-004 decision record, decision 1). Evidence: the user's "duyệt" in the session; no separate signed record exists yet.
- [x] PO approved attaching a payment card to the Google Cloud billing account and to Cloudflare R2 for the free phase, spending limited by alerts, not a cap (ADR-004 decision 2, 2026-10-29). Supabase Pro and ZITADEL production are **not** approved.
- [x] PO accepted a single frontend instance: a restart or deploy signs everyone out (ADR-004 decision 3).
- [x] `MC_OIDC_CACHE_TTL=30s` approved (ADR-004 decision 4).
- [x] PO approved: no Cloudflare proxy (5), synthetic-only until a data-residency gate (6), blocker triage and order (7). 2026-10-29.
- [ ] Data classification: only synthetic data; named test users only.
- [ ] ADR-004 blockers closed or explicitly waived by the PO:
  - [x] B2 frontend `Dockerfile` + `output: 'standalone'`, image builds and starts (local Docker only; evidence `claude-b2-frontend-image-r1/`).
  - [ ] B3 R2 adapter smoke-tested against a real bucket with a synthetic file.
  - [ ] B4 per-route timeouts for upload, content download, import, export (25 MiB must complete); Cloud Run request timeout set above them.
  - [ ] B6 Supabase Data API disabled or grants revoked, plus a negative test.
  - [ ] Startup guard: backend refuses `MC_OBJECT_BACKEND=fs` when running on Cloud Run (`K_SERVICE` set), or the check below is done by hand.
- [ ] Owner named for each step (backend: Codex; frontend: Antigravity; verification: OpenCode) and a human deployer present. Preparing this list is not a deployment approval.

## 1. Pre-deploy — accounts and guardrails

Google Cloud
- [ ] New project (not shared with anything else); one region chosen near Supabase.
- [ ] Billing budget with alerts at low amounts (for example 1, 5, 10 USD) and notification to a monitored address. Alerts lag; they are not caps.
- [ ] APIs enabled only as needed (Cloud Run, Artifact Registry, Secret Manager, Cloud Build or CI deploy).
- [ ] Deployer uses short-lived credentials (Workload Identity Federation from CI, or a personal login); no long-lived JSON key in the repo or CI.
- [ ] Artifact Registry: cleanup policy keeping the last 2–3 images (frontend images are large).

Supabase
- [ ] New project, region near Cloud Run. Password in a password manager, never in git.
- [ ] Data API disabled for this project, or default privileges revoked and RLS/grants set (ADR-004 B6).
- [ ] Dedicated app role (least privilege) and a separate migration owner role; `ALTER ROLE <app> SET statement_timeout = '5s'` set at role level.
- [ ] Connection strings recorded: **session pooler (port 5432)** for the API and for migrations. Never the transaction pooler (6543): pgx uses prepared statements and goose takes an advisory lock.
- [ ] Database size alert plan: check at 400 MB of 500 MB.

Cloudflare R2
- [ ] Private bucket, no public access, no `r2.dev` domain, no custom public domain.
- [ ] API token limited to this bucket, Object Read & Write only (no delete if the dashboard allows it); token ID/secret stored only in Secret Manager.
- [ ] Usage dashboard bookmarked: storage, Class A/B counts against 10 GB / 1M / 10M.

ZITADEL
- [ ] Separate project and application for this phase (do not reuse the development client); synthetic users only. Record the issuer, project ID, client ID.
- [ ] Redirect and post-logout URIs registered for the frontend's exact `*.run.app` origin (HTTPS).
- [ ] API application key file created and stored as a secret, mode 0600 when mounted (`MC_OIDC_API_KEY_FILE`).
- [ ] Decide the introspection cache TTL (`MC_OIDC_CACHE_TTL`): `0s` means a ZITADEL call per API request; free-tier rate limits are not published.

Secrets (Secret Manager; keep versions few)
- [ ] `MC_DATABASE_URL`, `MC_MIGRATE_DATABASE_URL`, `MC_R2_ACCESS_KEY_ID`, `MC_R2_SECRET_ACCESS_KEY`, OIDC API key file. No secret appears in logs, images, build args, or the repository.

## 2. Pre-deploy — build and configuration

- [ ] CI green on the exact commit: backend `make check` (gofmt, tidy, lint, `-race` tests), frontend `pnpm check`, `pnpm build`, CSS guard.
- [ ] Release commit is reviewed and approved; no commit or push is made by an agent unless asked.
- [ ] Backend image built from `apps/backend/Dockerfile` (distroless, non-root); frontend image built from the new Dockerfile.
- [ ] Backend environment: `MC_HTTP_ADDR=0.0.0.0:<port>` and the Cloud Run port set; `MC_OBJECT_BACKEND=r2` plus `MC_R2_ENDPOINT`, `MC_R2_BUCKET`; `MC_OIDC_*` set; `MC_SHUTDOWN_TIMEOUT` about 8s (Cloud Run SIGTERM grace is about 10s **[recall]**); `MC_MAX_IN_FLIGHT` set; `MC_MAX_UPLOAD_BYTES` default 25 MiB.
- [ ] Frontend environment: `API_MODE=rest`, `API_BASE_URL` = backend `/api/v1` URL, `OIDC_*`, `APP_ORIGIN` = frontend origin, `SESSION_COOKIE_SECURE=true`; no `AUTH_ALLOW_ANONYMOUS`.
- [ ] Cloud Run settings: backend `min=0`, `max=2` (2 × 10 pool connections); frontend `min=0`, `max=1`; memory sized for the 25 MiB buffered upload and for sessions/pending imports; request-based billing (CPU only during requests); backend ingress public with the API's own bearer-token check (a private backend would collide with the `Authorization` header **[recall]**).
- [ ] Migrations reviewed: forward-only and backward-compatible with the previous release (expand/contract), because rollback does not undo schema.

## 3. Pre-deploy — data safety (free tier has no backups)

- [ ] A scheduled logical dump (for example nightly `pg_dump` from CI or a Cloud Run Job) written to a **second** location (R2 prefix with its own token, or a GCS bucket within free limits); retention of the last 7.
- [ ] One restore rehearsal done into a scratch Supabase project or local Postgres, with a document download verified against its stored SHA-256.
- [ ] Keep-alive for Supabase Free: a scheduled request that performs a real database query at least every few days (the current `/readyz` does not query the database, so add that check or use an authenticated read). Confirm the pause behaviour and restore procedure on the Supabase dashboard.
- [ ] Rollback plan below read by the deployer.

## 4. Deploy (in this order)

1. [ ] Run `mcapi migrate` as a one-off Cloud Run Job using the migration role over the session pooler. Verify exit code 0 and the applied version.
2. [ ] Deploy the backend (traffic 100% only after the check below). Check `/healthz` and `/readyz`; confirm the log line shows the R2 backend is in use, not the local directory.
3. [ ] Deploy the frontend with `APP_ORIGIN` set to its real URL (deploy once, read the URL, set `APP_ORIGIN` and the ZITADEL redirect URI, redeploy if the URL was not known).
4. [ ] Smoke tests (synthetic user A and B):
   - [ ] Sign in through ZITADEL; sign out; sign in again.
   - [ ] Create workspace and matter; add user B to the matter; B sees it, a non-member does not.
   - [ ] Add an action and a requirement; reload and confirm they persist.
   - [ ] Create a document; upload a 1 MB file and a near-25 MiB file; download and compare SHA-256; re-upload the same file and confirm "already stored".
   - [ ] Export CSV; open Data import preview (no commit).
   - [ ] Negative: upload with a wrong `Origin` is refused; user without access gets 403/404; Supabase publishable-key request to the tables returns nothing.
   - [ ] Restart/scale the frontend and confirm the expected outcome: you must sign in again.
5. [ ] Switch traffic to 100% only after steps 2–4 pass; keep the previous revision available.

## 5. Monitor (first 15 minutes, then daily during the pilot)

- [ ] Cloud Run: request count, 5xx, latency, instance count, container memory; Cloud Logging errors.
- [ ] Budget and quota usage: Cloud Run free-tier consumption, Supabase DB size and egress, R2 storage and operation counts, ZITADEL daily active users.
- [ ] Alert if any free allowance passes 70% before month end.

## 6. Post-deploy

- [ ] Record the release: commit SHA, image digests, Cloud Run revision names, migration version, who deployed and when (no secrets).
- [ ] Update the status documents and close the related task; state what was not verified.
- [ ] Notify the PO and testers of the limits: synthetic data only, sign-in resets after idle, no backups beyond the dump, no SLA.
- [ ] Schedule the review of restore rehearsal results and the first month's actual usage against the budget.

## 7. Rollback

Triggers (pilot scale, adjust with real traffic):
- [ ] 5xx on API calls: 5 or more within 10 minutes, or more than 2% of requests.
- [ ] p50 API latency above 1.5 s for 10 minutes (excluding the first cold start).
- [ ] Sign-in fails, or an uploaded document cannot be downloaded with a matching SHA-256.
- [ ] Any negative security test fails (Data API exposure, cross-user read, origin check).
- [ ] Any free allowance exceeds its alert, or an unexpected charge appears.
- [ ] Database size above 450 MB of 500 MB, or Supabase reports the project paused.

Actions:
- Code: route traffic back to the previous Cloud Run revision (backend, then frontend). Images stay in Artifact Registry.
- Schema: forward-fix only; do not run down migrations. If a migration is faulty, restore from the latest dump into a clean project and repoint the secret.
- Documents: objects are immutable and content-addressed, so rolling code back needs no object rollback; orphans are harmless.
- Data lost to a Supabase pause is not expected (paused, not deleted), but restoring may take time: the dump is the fallback.
- After rollback: keep logs, record the trigger and the time, and do not retry the deploy until the cause is found.

## Not covered by this checklist

Real legal data, production availability targets (RPO/RTO deferred to Step 02), custom domain and WAF, horizontal scaling of the frontend, durable sessions, and compliance review. Each needs its own decision.
