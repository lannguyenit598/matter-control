# ADR-004 — Production Hosting Topology Review (Cloud Run + Supabase + Cloudflare R2)

- Author: Claude Code (actual), claude-sonnet-5-5, Solution Architect review at the user's request ("review this infra thoroughly").
- Date: 2026-10-29. Repository HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` plus the uncommitted working tree.
- Status: **PARTIALLY APPROVED — decisions 1–7 decided (2026-10-29); blockers B2, B3, B4, B6 are implementation work still OPEN.** Nothing here is deployed, purchased, or provisioned. No account, billing, DNS, secret, or provider state was touched.

> **Superseded topology notice — 2026-10-29:** ADR-006 records the Product Owner's later final topology decision: Next.js on Cloudflare Workers, Go on Cloud Run, images/files in R2 and PostgreSQL on Supabase. ADR-006 supersedes this ADR's Cloud Run frontend, single-frontend-process and frontend `*.run.app` decisions. This document remains historical review and approval-provenance evidence; it is not the current frontend deployment plan. The later decision does not authorize deployment, purchase, provider changes or real data.

## Decision record

| # | Decision | State |
|---|---|---|
| 1 | Accept ADR-001 H1: backend and database run outside Cloudflare (Cloud Run, Supabase); frontend also on Cloud Run, Cloudflare used for R2 and DNS only | **APPROVED 2026-10-29** — the user replied "duyệt" in the session after being given the exception's three consequences: (a) backend/database outside Cloudflare; (b) no firm $0 commitment (Cloud Run needs a billing account and has no hard cap; Supabase Free can pause and has no backups); (c) synthetic data only for this phase |
| 2 | Paid services | **APPROVED for the free phase: attach a payment card** to the Google Cloud billing account and to Cloudflare R2 (user: "đồng ý gắn thẻ"), spending controlled by budget alerts, not a cap. **Not approved:** Supabase Pro, ZITADEL production tier, any plan upgrade |
| 3 | Single frontend instance vs durable sessions first | **APPROVED: single instance; a restart or deploy signs everyone out** (user: "restart là đăng xuất hết"). Accepted risk, not a fix; durable sessions stay a future item |
| 4 | OIDC introspection cache TTL | **APPROVED: `MC_OIDC_CACHE_TTL=30s`** (user: "ok" to the 30 s recommendation) |
| 5 | Cloudflare proxy vs DNS-only | **APPROVED: no proxy** in the free phase; `*.run.app` origins; Cloudflare only for R2 (user: "có") |
| 6 | Data residency and processor agreements | **APPROVED: synthetic data only now; real data is a separate gate** requiring residency decision and processor terms (user: "đồng ý") |
| 7 | Blockers B1–B6 for the free phase | **APPROVED triage and order** B6 → B2 → B4 → B3 → smoke (user: "đồng ý"); B1 accepted risk, B5 closed by decision 5 |

Approval of decision 1 is not a deployment, purchase, or release approval, and it does not close any blocker. Whoever maintains `project-status.md` / the risk register should reflect this; this ADR does not edit those files.
- Relates to: ADR-001 (runtime and hosting, option H1 hybrid), ADR-003 (frontend runtime), `deployment/free-tier-budget.md`, `deployment/provider-options.md`, `architecture/cloudflare-feasibility.md`.
- Deciders: Human Product Owner (hosting-constraint exception, paid services, availability/security trade-offs).

## Recommendations on the open decisions (Claude Code, 2026-10-29)

**Decision 4 — introspection cache TTL: 30 s.** The cache is in memory, per backend instance, keyed by the SHA-256 of the token, holds only *active* results, and never outlives the token's own expiry (+60 s leeway) [repo: `zitadel/verifier.go`]. With TTL 0 every API call is a round trip to ZITADEL, and a page issues several. A cached "active" answer can therefore only delay a token revoked at the identity provider (sign-out, disabled user) by up to the TTL; workspace and matter membership are resolved in the database per request, so removing someone's access takes effect immediately regardless of the TTL (per the access contract; not re-verified path by path). 30 s keeps most page fan-out calls to one ZITADEL call per token while bounding the IdP-revocation lag to 30 s; 15–60 s is the sensible range. Revisit with measured ZITADEL latency in the PoC.

**Decision 5 — Cloudflare proxy: none in the free phase.** The free phase uses the `*.run.app` origins; there is no custom domain to proxy, and a proxy in front of Cloud Run adds the Host-header, Server-Action origin, `__Host-` cookie and ZITADEL redirect risks of B5 for little gain on a synthetic pilot. Cloudflare is used only for R2. Revisit when a custom domain is bought, after an edge PoC. This closes B5 for this phase.

**Decision 6 — data residency and processors: synthetic data only; make real data a separate gate.** Record the rule operationally (named test users, a short banner or README note, no real documents in uploads) and require, before the first real matter: a data inventory (what goes to Google Cloud, Supabase, Cloudflare R2, ZITADEL), regions chosen from the client's jurisdiction, signed data-processing terms with each, encryption-key and access-log decisions, and counsel review. Nothing is needed from the PO for this phase beyond confirming the synthetic-only rule.

**Blockers for the free phase (decision 7):**

| Blocker | Treatment | Why |
|---|---|---|
| B1 sessions in memory | **Accepted risk** (decision 3); enforce `max-instances=1` and state it in the pilot notice | No code needed |
| B2 frontend Dockerfile / standalone | **Must do** | No image, no deploy |
| B3 R2 against a real bucket | **Must do**, before the first document upload; card approval (decision 2) unblocks it | Adapter only fake-tested |
| B4 10–15 s timeouts on upload/download | **Must do** (small backend change: longer timeouts on the upload, content, import, export routes) | A 25 MiB document otherwise fails for ordinary connections |
| B5 edge in front of Cloud Run | **Closed by decision 5** (no proxy) | |
| B6 Supabase Data API | **Must do first** (configuration plus a negative test, minutes of work) | Cheapest and highest exposure |

Suggested order: B6 → B2 → B4 → B3 → smoke tests. Also needed for the free phase, small: refuse `MC_OBJECT_BACKEND=fs` on Cloud Run (M4); `/readyz` database check plus a Supabase keep-alive (the Free project pauses after a week of inactivity); `statement_timeout` at role level (H2); `MC_SHUTDOWN_TIMEOUT` about 8 s (H4); nightly dump to a second location (H5).

## Evidence classes used below

- **[repo]** read in the source of this working tree in this review.
- **[docs]** confirmed this session against official documentation (Context7: Firebase, Supabase).
- **[recall]** from general knowledge, **not verified here**. Treat as a hypothesis; a PoC or the official page must confirm before approval (AGENTS.md: no invented limits).

## Context

The proposal under review: frontend on Cloudflare or Firebase Hosting; backend (Go) on Google Cloud Run; PostgreSQL on Supabase; document bytes on Cloudflare R2.

Approved constraints (AGENTS.md, ADR-001): Go + PostgreSQL + Next.js stay; the product goal is Cloudflare Free Tier and $0/month, with no option yet selected. ADR-001 already concluded that no evidenced option satisfies every constraint and that H1 (Next.js on Cloudflare or another host, native Go origin and managed PostgreSQL elsewhere, R2 via S3 API) is the only one keeping Go + PostgreSQL, **as a hosting exception that needs PO approval**. The proposal is an H1 variant. `free-tier-budget.md` says the total cost is **UNKNOWN, not $0** while the native Go host, the PostgreSQL provider, persistent object storage, identity and backups are unpriced.

This session also added the R2 adapter (`internal/adapter/outbound/objectstore/r2.go`) behind `port.ObjectStore`; it is tested only against an in-process fake S3, never against a real bucket.

## Decision requested

Do **not** approve the topology as stated. Approve **Option A** below, conditional on the blockers B1–B6 being closed by the listed PoCs, and decide the six items in "Decisions for the Product Owner".

## Options considered

| ID | Topology | Verdict |
|---|---|---|
| **A** | Frontend and backend as two Cloud Run services (same region); Supabase Postgres via session-mode pooler; R2 for documents; Cloudflare for DNS only. Frontend pinned to **one instance** (min = max = 1) until sessions are durable | **Recommended for a pilot**, with conditions |
| B | Same, plus a durable session/attempt store so the frontend can scale out | Target state; needs code and a store (see B1) |
| C | Frontend on Cloudflare Workers (OpenNext/vinext) | **Reject for now**: sessions and import/bulk attempts are process memory; Next 16.4.2 `cacheComponents` is untested on any adapter (ADR-003); 10 ms CPU on Free |
| D | Firebase Hosting rewriting to Cloud Run | **Reject as is**: see B5 (cookies, 60 s) |
| E | All-Google (Cloud SQL + GCS) | Operationally simplest, but outside the stated Supabase/R2 intent; keep only as the cost and ops baseline |

| Dimension | A | B | C | D |
|---|---|---|---|---|
| Complexity | Low | Medium | High (adapter + session redesign) | Medium |
| Cost | Cloud Run always-on instance + Supabase Pro + R2 checkout: **not $0, unpriced** | A + a store | Workers Paid may be needed | like A |
| Scalability | One frontend instance | Horizontal | Edge | Horizontal |
| Fit to code today | Runs as is after a Dockerfile | Needs session-store work | Does not run | Login breaks |

## Findings

### Blockers (must be closed before any deployment)

**B1 — Frontend sessions and recovery state live in process memory. [repo]**
`src/lib/oidc/session-store.ts` keeps login sessions, including access and refresh tokens, in one `Map` per process; its own comment says "in-process on purpose for the local profile… a durable store is a production decision". `src/features/data-transfer/pending-attempts.ts` keeps unresolved bulk/import attempts (including uploaded file bytes) in a `WeakMap` keyed by that session, and says production restart recovery needs durable storage. Consequences on Cloud Run: a second instance, a scale-to-zero, a restart, or a deploy logs everyone out; an UNKNOWN import or bulk attempt cannot be recovered, which defeats `RecoveryGate`. On Workers it is impossible (isolates are ephemeral). My earlier message named only the attempt store; the session store is the larger problem.
Options: (1) **min = max = 1 instance**, accept that every restart or deploy signs users out and loses unresolved attempts — zero code, single point of failure; (2) durable store (Postgres table with envelope-encrypted tokens, or Redis) — code plus a new store; tokens must stay out of cookies per the session contract, so a stateless cookie is not an option; (3) Cloud Run session affinity — best effort only, not a correctness mechanism. Recommendation: (1) for the pilot with PO acceptance, (2) before scale.

**B2 — The frontend has no deployable artifact. [repo]** — **DONE 2026-10-29** (see `docs/testing/p0-final-parallel-20261028/claude-b2-frontend-image-r1/`): `apps/frontend/Dockerfile`, `.dockerignore`, `output: 'standalone'`; image builds, runs as non-root, serves static CSS and security headers, and fails closed without OIDC. Not yet run on Cloud Run or against a real ZITADEL/API. Original finding:
There is no `Dockerfile`, no `.dockerignore`, and `next.config.ts` has no `output: 'standalone'`. A container image is required for Cloud Run; building and running it on Node (no adapter) is the lowest-risk path for Next 16.4.2 with `cacheComponents`. Add a Dockerfile, run the production build in the image, and smoke-test sign-in, a Server Action, and a 25 MiB upload.

**B3 — Document bytes need R2 to be real, and R2 is unproven. [repo]**
Production must set `MC_OBJECT_BACKEND=r2`; the default `fs` writes to Cloud Run's per-instance ephemeral disk. The adapter has never talked to R2: SigV4 acceptance, the disabled CRC32 trailer, HEAD 404 handling and token scoping are assumptions. ADR-001 (P-OS-1) limits R2 to a local emulator until the PO approves a billing step (R2 requires checkout). Needed: PO billing approval, then a synthetic-data smoke test; plus backup/replication of the bucket (H5).

**B4 — Upload and download are capped at 10–15 seconds. [repo]**
`productapi.NewServer` applies `middleware.ContextTimeout(RequestTimeout)` (10 s) to every route, including upload, content download, import and export (only the body-size limiter is skipped for them). `newProductHTTPServer` sets `WriteTimeout = RequestTimeout + 5 s` (15 s) and `ReadTimeout = 30 s`. A 25 MiB document needs about 7 Mbit/s sustained to finish an upload in 30 s and 13 Mbit/s to stream a download in 15 s; the R2 adapter additionally spends a HEAD and a PUT under the same 10 s context. The frontend already allows 120 s for uploads (`timeoutMs: 120_000`), so the backend is the binding limit. This is pre-existing but becomes visible once the path is user → Cloud Run → Cloud Run → R2. Fix: per-route timeouts for the upload, content, import and export routes (the Skipper pattern for the body limit already shows where), with the Cloud Run request timeout set above them. Owner: Codex (backend primary).

**B5 — The edge in front of Cloud Run breaks the cookie, host, and origin model. [docs][repo][recall]**
- Firebase Hosting rewrites: **[docs]** cookies are stripped from requests to Cloud Run; only `__session` passes through, and Hosting enforces a 60 s timeout. The app's session cookie is `__Host-mc_session` (`src/lib/oidc/config.ts`) and its contract forbids tokens in cookies, so sign-in would not survive; a 120 s upload would 504. Option D is rejected unless the cookie contract is renegotiated.
- Cloudflare proxy in front of `*.run.app` **[recall]**: Cloudflare forwards the custom `Host`; Cloud Run routes by `Host`, so a Host-header override or a Cloud Run domain mapping or load balancer is needed, and then Next's Server Action origin check (Host vs `Origin`) and the upload route's strict `Origin === APP_ORIGIN` check must still pass. Also `APP_ORIGIN`, the `__Host-` prefix (requires HTTPS, no `Domain`) and the ZITADEL redirect URI must all be the same public origin.
- Safest first step: no proxy — Cloud Run's own HTTPS URL or a mapped custom domain, Cloudflare as DNS only; add the proxy later after a PoC on Host/Origin behaviour.

**B6 — Supabase exposes `public` through its Data API by default. [docs]**
Official guidance: a table in the exposed `public` schema is readable and writable by anyone holding the publishable key until RLS and grants are set; default privileges grant to `anon`/`authenticated`. The product migrations (`migrations_mattercontrol/0001…0007`) create tables in the default schema, and authorization is enforced by the Go service, not RLS. Required: disable the Data API for this project, or revoke the default privileges and grants and use a dedicated schema and role; connect the API as a least-privilege role and use `MC_MIGRATE_DATABASE_URL` for the owner role. Verify with a negative test using the publishable key.

### High

**H1 — Every API call re-introspects the token at ZITADEL. [repo]**
`MC_OIDC_CACHE_TTL` defaults to `0s`. A matter page makes several API calls in parallel (`Promise.all` of three to five reads plus candidates), each introspected against ZITADEL Cloud (the dev instance is in `au1`). Latency and ZITADEL Cloud rate limits are unmeasured. A short TTL is a load shield but delays revocation — that trade-off is the PO's (AGENTS: not a revocation guarantee). Also, the current ZITADEL instance is a dev instance; production needs its own instance, project, key file (Secret Manager) and redirect URIs.

**H2 — Database connection mode and parameters. [docs][repo]**
- **[docs]** Supavisor session mode (port 5432) is IPv4 and supports prepared statements and advisory locks; transaction mode (6543) does not support prepared statements. pgx caches prepared statements by default and `pool.go` sets no exec mode, so transaction mode is out. Cloud Run egress is IPv4: use the session pooler. **[recall]** the direct connection is IPv6-only unless the IPv4 add-on is bought.
- **[repo]** Migrations take a PostgreSQL session advisory lock (`matter_migrate.go:45`, goose `NewPostgresSessionLocker`): run `mcapi migrate` on session mode or a direct connection, as a Cloud Run Job, never through a transaction pooler.
- **[repo]** `statement_timeout` is sent as a startup parameter (`RuntimeParams`). Whether the Supabase pooler accepts it is **unverified**; the safe alternative is `ALTER ROLE <app role> SET statement_timeout = '5s'`. Test it in the PoC.
- `MaxConns: 10` per instance × `max-instances` must stay under the pooler's and the plan's connection limits; cap the instance count explicitly.

**H3 — Making the backend private conflicts with the bearer token. [recall]**
Cloud Run IAM invocation uses the `Authorization` header, which the API needs for the user's ZITADEL token. A private backend needs the Google identity token in `X-Serverless-Authorization`. Simplest consistent choice: backend public (`allow-unauthenticated`), protected by the API's own token check, plus `MC_MAX_IN_FLIGHT`.

**H4 — Shutdown and listener settings. [repo]**
`MC_HTTP_ADDR` defaults to `127.0.0.1:8081`; the container must listen on `0.0.0.0` and the Cloud Run port must be set. `MC_SHUTDOWN_TIMEOUT` defaults to 10 s; Cloud Run gives about 10 s after SIGTERM **[recall]**, so set it to about 8 s. `/healthz` and `/readyz` exist, but `/readyz` does not check the database (`readiness(&draining, nil)`); the pool is pinged at start.

**H5 — Backup, recovery, and cross-store consistency are absent. [repo]**
Database and bucket have different restore points. The dangerous direction is a database row whose object is missing; the code writes the object before the row (correct), and orphans are harmless by design. Needed: bucket replication or periodic copy to a second store, Supabase plan with the backup/PITR you intend to rely on, a restore rehearsal covering both (extend `ops/p0-local/restore-rehearsal`), and R2 delete protection (whether R2 offers object versioning or retention locks is **[recall]**; if not, issue the application token without delete rights). RPO/RTO remain deferred to Step 02.

**H6 — Cost cannot be called $0. [repo]**
Always-on frontend instance, Cloud Run billing account, Supabase Pro (the free tier pauses and has limited backups **[recall]**), R2 checkout, and ZITADEL Cloud production tier are all unpriced; `free-tier-budget.md` requires a complete inventory before any $0 claim. Produce a priced estimate for W1-style load before asking for approval.

**H7 — Legal data across four vendors. [repo policy]**
Google Cloud, Supabase, Cloudflare and ZITADEL would each process legal data. AGENTS limits current work to synthetic data; residency, DPAs, encryption-at-rest keys and access logging are PO and counsel decisions before real data.

### Medium

- **M1 — Background work.** No ticker exists today (a due boundary fails closed). TB-08 plans a boundary worker; on Cloud Run use Cloud Scheduler hitting an endpoint, or an always-on instance. Do not add an in-process ticker for a scale-to-zero service.
- **M2 — Next caches.** No `'use cache'` is used; `revalidatePath` is per instance. If caching is added, a shared cache handler is required before scaling out.
- **M3 — Memory sizing.** Frontend holds up to 5000 sessions plus pending import bytes; backend buffers each upload (≤ `MC_MAX_UPLOAD_BYTES`) in the R2 adapter. Size memory and `MC_MAX_IN_FLIGHT` together.
- **M4 — R2 adapter limits (self-review).** A same-size but corrupted object under a key is treated as present (reads detect it, uploads do not repair it); credentials are static keys needing a rotation drill; default backend `fs` is a deployment foot-gun (consider failing startup when `K_SERVICE` is set and the backend is `fs`); no real-R2 test; conditional-write/`If-None-Match` is not used.
- **M5 — Observability.** Logs are structured on stdout (Cloud Logging works); OpenTelemetry is off by default; no alerts, uptime checks or budget alerts are defined.
- **M6 — Delivery.** `deployment/ci-cd-plan.md` exists; add image build, Workload Identity Federation instead of long-lived keys, migrate-then-deploy ordering, and expand/contract migrations.

## Trade-off analysis

The proposal buys managed Postgres and zero-egress object storage by splitting the system across four vendors, and by moving to a stateless-cloud model the frontend was not written for. The decisive fact is B1: the frontend is a stateful BFF today. Cloud Run is the only proposed platform that runs it unchanged (Node, one instance); Workers and Firebase Hosting each break a core contract (process memory; cookies and timeouts). Supabase and R2 are replaceable behind existing ports (a connection string and `ObjectStore`), so those choices are low-regret provided B6 and B3 are closed. The price is explicit: one frontend instance is a single point of failure that signs users out on every deploy.

## Consequences

- Becomes easier: managed Postgres operations; documents off the container disk; a plain Node container for the frontend.
- Becomes harder: four vendors, four secret sets, cross-cloud latency (Cloud Run ↔ R2 ↔ Supabase ↔ ZITADEL; pick one region near all), cross-store restore.
- To revisit: durable sessions (B), the Cloudflare proxy, OIDC cache TTL, and the exact cost model.

## Corrections to my earlier messages in this session

1. I said only the data-transfer attempt store was in memory; the login session store is too (B1).
2. I proposed Cloudflare in front without the Host/Origin/cookie analysis (B5).
3. I did not find `ADR-001`/`ADR-003`/`free-tier-budget.md` before answering; they already define H1 as a PO exception and forbid a $0 claim.
4. I called the R2 adapter ready to wire; it is code-complete and fake-tested only (B3, M4).

## Action items

1. [ ] PO: decisions 1–6 below.
2. [ ] Codex (backend): per-route timeouts for upload, content, import, export (B4); startup guard against `fs` on Cloud Run; role-level `statement_timeout` (H2); `/readyz` DB check (H4).
3. [ ] Frontend owner: Dockerfile + `output: 'standalone'` + image smoke test (B2); decide and, if chosen, build the durable session/attempt store (B1).
4. [ ] DevOps (Codex): PoCs on a non-production project with synthetic data — P-HOST-1: Cloud Run reaching Supabase over the session pooler (migrate Job, advisory lock, statement timeout, prepared statements); P-OS-1: real R2 smoke test after PO billing approval; edge PoC: custom domain Host/Origin/cookie/redirect behaviour; ZITADEL introspection latency at TTL 0 vs 30 s.
5. [ ] Security: Supabase Data API negative test with the publishable key (B6); secret inventory and rotation plan (R2 token, DB roles, OIDC key).
6. [ ] Priced estimate for the chosen option; extend restore rehearsal to database + bucket (H5, H6).

## Decisions for the Product Owner

1. Accept ADR-001 H1 as a hosting exception (backend and database outside Cloudflare).
2. Approve paid services: Cloud Run billing, Supabase Pro, R2 checkout, ZITADEL production tier.
3. Pilot with a single frontend instance (restart signs users out) or fund the durable session store first.
4. OIDC introspection cache TTL (latency and quota versus revocation delay).
5. Cloudflare proxied or DNS-only in front of Cloud Run, pending the edge PoC.
6. Data residency and processor agreements for the four vendors before any real legal data.
