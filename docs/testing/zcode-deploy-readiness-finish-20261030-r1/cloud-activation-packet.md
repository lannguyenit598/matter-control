# Cloud activation packet — MC-ZCODE-DEPLOY-READINESS-FINISH-20261030

Author: actual ZCode, 2026-10-31. This packet separates what local work proved from what only a
scoped cloud authorization can prove, and lists the exact operator inputs still missing. No cloud
resource, billing, IAM, DNS, IdP or secret was created, changed or contacted. Nothing here is a
deployment, purchase or release approval.

## 1. READY_FOR_REVIEW (done locally, evidence attached)

| Item | Evidence |
|---|---|
| `MC_OIDC_CACHE_TTL=30s` consistently in code, templates, docs; tests assert it | `logs/final-make-check-r5.log`, `logs/final-pnpm-check-r3.log` (renderer assertions) |
| B1 least-privilege roles as deployable SQL (`ops/adr006/db/`), sync-guarded against the Go verification; BFF/maintenance scoping; grant-class and PUBLIC-denial subtests | `logs/b1-retention-0010-events.json` (64 pass / 0 fail, incl. contracts under `mc_runtime`) |
| Index migration 0010 (reversible, idempotent; sqlc diff empty; EXPLAIN harness green) | same events file |
| Migrator/serving identity separation in both BE profiles + renderer fail-closed rule | `ops/deploy/profiles.test.mjs` (6/6) |
| Release preflight script + tests; CI jobs (worker build, durable-bff PG, preflight on real artifacts); deploy template disabled | `logs/final-pnpm-check-r3.log`, `logs/final-build-worker.log` (preflight clean on the real `.open-next`) |
| BFF state retention job (bounded batches, maintenance-role scoped) | same events file |
| Scheduled dump script (second location, retention 7, archive self-check) | local smoke: 3 runs, 80 TABLE DATA entries, prune verified |
| Whole-product restore rehearsal on schema 0001→0010 with real measurements | `restore/runs/manual-run-20261031T154218Z/summary.json` (backup 0.277 s, restore 0.383 s, census/objects/readback IDENTICAL, refusals work) |
| Pending-import ceiling (default 5 MiB sealed estimate, fail-closed, streamed document path unchanged) | `logs/durable-pg.log` (14/14), ceiling unit tests inside `logs/final-pnpm-check-r3.log` |
| Pilot deploy runbook (supersedes the checklist operationally) | `docs/deployment/pilot-deploy-runbook.md` |
| Backend `make check` exit 0 (gofmt, tidy, sqlc, lint incl. depguard, `go test -race` with the full PG suite: 14 packages ok); frontend `pnpm check` exit 0; `pnpm build` (CSS guard), `pnpm build:worker`, `pnpm build-storybook` exit 0 | `logs/` |

All of the above is AUTHOR_VERIFICATION. Independent review is required before any activation
decision (see `independent-review-packet.md`).

## 2. READY_FOR_SCOPED_CLOUD_AUTHORIZATION (exact resources/commands; NOT_RUN)

Activating any line below requires the PO's explicit scoped approval, the operator inputs listed,
and the negative tests as acceptance. Costs are estimates-with-alerts, never $0 (decision D2).

### 2.1 Operator inputs still missing

- **Cloudflare**: account; Worker name + final public origin; private R2 bucket (no public
  access, no r2.dev domain) + bucket-scoped API token (Read & Write, delete policy per runbook).
- **GCP**: project; Artifact Registry repo; TWO service accounts (`mcapi-run@…`,
  `mcapi-migrate@…` — PI-02, distinct, renderer enforces it); Workload Identity Federation
  provider for CI; Secret Manager secrets: `mcapi-database-url`, `mcapi-migrate-database-url`,
  `mcapi-r2-access-key-id`, `mcapi-r2-secret-access-key`, `mcapi-oidc-api-key`.
- **Supabase**: project ref (region `ap-southeast-1`), session-pooler host/port (copy from the
  Connect dialog — never composed), CA certificate, role passwords into the secrets above.
- **ZITADEL**: project + web app + API application for the pilot; redirect/post-logout URIs for
  the final FE origin; API key JSON into `mcapi-oidc-api-key`.
- **GitHub**: protected environment `pilot-deploy` (only if the disabled deploy template is
  enabled — a separate decision).

### 2.2 Ordered activation (templates; every command NOT_RUN)

1. DB roles: apply `ops/adr006/db/b1-roles.sql` (admin connection).
2. Migrate: `mcapi migrate` (Cloud Run job or command) as `mc_migrator` DSN
   `…&search_path=mcapp`; verify version 0010; second run = no-op.
3. Re-apply `b1-roles.sql` (idempotent grants/functions revoke on migrated objects).
4. BFF schema: `ops/adr006/bff-state.sql` as DB admin + `ALTER TABLE mc_bff.state OWNER TO
   mc_owner`; then `ops/adr006/db/b1-bff-grants.sql`.
5. Role passwords from the secret store (SCRAM); `mc_maintenance` stays NOLOGIN until the cleanup
   job is scheduled.
6. Backend image build+push by digest; render profiles (`node ops/deploy/profiles.mjs`); IAM:
   serving SA accessor on its 4 secrets; migrator SA additionally on
   `mcapi-migrate-database-url`; NO broader roles.
7. Apply migrate-job → execute → apply service.yaml (order enforced in the disabled CI template).
8. Negative IAM test: serving SA `gcloud secrets versions access` on
   `mcapi-migrate-database-url` must FAIL.
9. Worker: `pnpm build:worker` in a CLEAN checkout; preflight the artifact; `wrangler versions
   upload`; set `APP_ORIGIN`/ZITADEL redirect URIs to the real origin; deploy secrets via
   `wrangler secret put`.
10. Data API negative test with the publishable key against `mcapp.*`/`mc_bff.*` must fail.
11. Smoke set (runbook §4): sign-in A/B, workspace/matter/member, 1 MB + near-25 MiB upload with
    SHA-256 equality, export, negative origin/403/Data API, restart → re-login.
12. Schedule: `cmd/mcbffcleanup` (maintenance role), `scheduled-dump.sh` (second location), the
    authenticated `/readyz` keep-alive probe, budget alerts 1/5/10 USD.

Rollback for every step is in the runbook §7 (previous revision/version; schema forward-fix;
keys: add-then-switch, never remove early).

### 2.3 Measurement obligations during the pilot (gates, not observations)

Worker Free CPU/memory/latency for large pending imports (bounded by the WP-7 ceiling; raising it
is decision D7), Cloud Run consumption, Supabase size/connections (pooler client cap confirmation
— runbook §1), R2 storage/ops, ZITADEL DAU. Exceeding a limit must fail closed or stop the pilot.

## 3. VERIFIED_ON_PROVIDER

**Empty — by design.** Nothing has been executed on any provider. This section stays empty until
the authorized activation produces receipts; "local evidence" never proves provider behavior or a
$0 bill.

## 4. Open PO decisions (with recommendations; ZCode decides none)

| ID | Decision | Recommendation carried into this packet |
|---|---|---|
| D1 | Backend ingress: public + bearer (current) vs private/IAM | Keep public + application auth for the synthetic pilot; the IAM asymmetry (ADR-007 §6) stays documented |
| D2 | Meaning of "$0" | "Alerts fire before money is spent", not "money cannot be spent" |
| D3 | Residency (ZITADEL AU, Workers edge, R2 APAC vs Singapore) | Accept for the synthetic pilot; HARD GATE before any real data |
| D4 | B3 rate-admission quota numbers | See the B3 brief below — accept the documented pilot risk now; require the limiter before real data |
| D5 | B7 receipt retention | Keep DISABLED until TB-06 numbers exist |
| D6 | Worker adapter = OpenNext 1.20.14 | Accept (build + local runtime evidence exists); vinext stays build-only |
| D7 | Workload numbers (maxScale 3, concurrency 10, FE maxInstances 2/concurrency 20, `BFF_MAX_PENDING_BYTES` default 5 MiB) | Adopt the proposed defaults for the pilot, re-measure, then fix numbers |
| D8 | Commit/branch of the release | The tree is 157+ files dirty; commit/merge is PO/Codex; a release needs a clean reviewed SHA |

### D4/B3 brief — rate admission (WP-10; prepared, NOT implemented)

- **Today**: authentication is mandatory (ZITADEL introspection) and `MC_MAX_IN_FLIGHT` caps
  concurrency per instance (503 + Retry-After). There is no per-actor/per-time rate limit; a
  single authenticated principal can issue unbounded requests within the concurrency cap.
- **Risk accepted for a synthetic pilot**: the data is synthetic, the users are two named test
  accounts, abuse costs provider quota (not data integrity — the command spine is receipted and
  append-only). Acceptable for the pilot with monitoring on denial/5xx counts.
- **Not acceptable before real data**: unbounded per-principal request rates against legal
  records. Required then: per (actor, tenant) admission at the Go boundary using claims
  post-verification, counted in a Postgres table with an atomic conditional UPDATE (the same CAS
  pattern as the membership revision — no new store), 429 + Retry-After, never marking refused
  requests committed; a pre-auth edge/IP shield at the Worker as defense-in-depth;
  `X-Forwarded-For` trusted only from a declared proxy list. Numbers (window, burst, per-tier
  quotas) are PO-owned; design prepared, zero code written for it.
