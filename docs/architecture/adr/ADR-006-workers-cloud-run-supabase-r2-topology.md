# ADR-006 — Selected Pilot Topology: Workers + Cloud Run + Supabase + R2

- Author: Local Codex (DevOps documentation intake), 2026-10-29.
- Input: direct Product Owner decision: Next.js on Cloudflare Workers; Go backend on Google Cloud Run; images/files in Cloudflare R2; PostgreSQL on Supabase.
- Repository: `codex/unified-project-flow` at `20feedbf06c859a9806055d609f5b132fe8bb086` plus the preserved dirty working tree.
- Status: **TOPOLOGY SELECTED — IMPLEMENTATION AND VERIFICATION GATES OPEN; NOT APPROVED FOR DEPLOYMENT, PURCHASE, PRODUCTION, OR REAL DATA.**

> **Portability notice — 2026-10-30:** [ADR-007](ADR-007-portable-fe-be-deployment-profiles.md) adds Firebase App Hosting (FE/BFF) and Compute Engine (Go API) as selectable alternative profiles built from the same source. Workers + Cloud Run remains the selected default; every gate, non-decision and limitation below still applies. This notice is the only change to this ADR.

## Decision

The selected pilot topology is:

| Boundary | Selected placement | Current constraint |
|---|---|---|
| Next.js frontend and server-side BFF | Cloudflare Workers | The exact adapter is not selected. The current Next.js 16.4.2 feature set must be tested against the current vinext and OpenNext candidates before either is adopted. |
| Go API | Google Cloud Run, `asia-southeast1` (Singapore) | Native container deployment remains the backend path. A free allowance is not a guarantee of a zero bill. |
| PostgreSQL | Supabase, exact region `ap-southeast-1` (Singapore) | Use a session-compatible connection path for pgx and migrations; Free can pause and does not provide the required recovery evidence by itself. |
| Images and files | Private Cloudflare R2 bucket | An `apac` location hint is best effort and does not guarantee Singapore placement or jurisdiction. Access remains mediated and Matter-authorized; no public bucket. |
| Identity | Existing ZITADEL direction, otherwise unchanged | Region, production instance, quota, redirect origins and residency remain unresolved. No ZITADEL migration or provider change is decided here. |

This decision supersedes ADR-004 only where ADR-004 selected a Cloud Run frontend, a single frontend process, and `*.run.app` as the frontend origin. It retains the Go Cloud Run, Supabase, private R2 and synthetic-only direction. ADR-004 remains historical evidence for its review and earlier approval provenance.

## Non-decisions and preserved gates

- The strict `$0` objective remains a target and an unresolved release gate. Workers Free has hard runtime limits; Cloud Run and R2 can bill past allowances; Supabase Free can pause. Provider budget controls and workload evidence must be reviewed before any deployment request. This ADR does not relax the objective or claim a zero-cost topology.
- `asia-southeast1` and `ap-southeast-1` pin the selected backend compute and primary database to Singapore. Workers execute on Cloudflare's global edge, and R2 `apac` is not a Singapore guarantee. That mismatch is a documented limitation, **not an approved residency exception**. Synthetic data only remains mandatory until the PO accepts a precise residency scope and provider evidence.
- No adapter, dependency, Worker, Cloud Run service, Supabase project, R2 bucket, DNS record, billing account, secret or identity resource is installed, created or changed by this decision.
- No production, release, purchase, provider authentication or real-R2 call is authorized.

## Required frontend readiness work

The Cloud Run frontend container evidence does not prove Workers readiness. A candidate cannot advance until all of the following produce local, reproducible evidence:

1. **Adapter selection PoC.** Test the current application with both currently supported candidates before selecting one. Record exact package/tool versions, compatibility configuration and failures for `cacheComponents`, `partialPrefetching`, `connection()`, React Server Components, Route Handlers and Server Actions. Do not assume vinext or OpenNext compatibility from generic provider support.
2. **Durable server state.** Replace or redesign the process-local OIDC session `Map` and pending-transfer `WeakMap`. Tokens must remain out of browser-readable storage and cookies must continue to carry only an opaque handle. The durable-store design, encryption, expiry, revocation, cleanup and recovery behavior require security review.
3. **Authentication and origin proof.** Verify OIDC login/callback/logout, `HttpOnly`/`Secure`/`SameSite` cookies, PKCE state, redirect URIs, Worker secrets, CSRF/origin checks and Server Action origin behavior on one exact public origin. Verify that access and refresh tokens never enter client bundles, browser storage, logs or deployment artifacts.
4. **BFF/API proof.** Verify server-side calls from the Worker to the Cloud Run API, per-user bearer-token forwarding, fail-closed authentication, timeout behavior, error mapping and cross-cloud latency. Browser-to-API CORS is not introduced unless separately designed and reviewed.
5. **Files and data-transfer proof.** Verify the selected upload path for 1 MiB and near-25 MiB synthetic files, download SHA-256 equality, retries and unknown-outcome recovery across Worker → Cloud Run → R2. Measure Worker CPU, memory, request/body limits and backend timeouts; do not infer them from local Node execution.
6. **Free-limit evidence.** Record requests, CPU time, bundle size, Worker errors, Cloud Run consumption, Supabase size/connections and R2 storage/Class A/Class B operations for the approved synthetic workload. Exceeding a free limit must fail closed or stop the pilot; an alert alone is not a `$0` guarantee.

## Backend, database and storage readiness retained

- Backend: keep the native Go container path; close route-timeout, readiness, shutdown, concurrency and object-backend startup guards before deployment.
- Database: use separate least-privilege runtime and migration roles; verify prepared statements, advisory-lock migrations, TLS, statement timeout and connection budgets against a synthetic Supabase fixture. Disable or deny unintended Data API access and prove it with a negative test.
- R2: keep the bucket private and credentials bucket-scoped. Real-bucket SigV4, HEAD/PUT/GET, checksum, retry, backup and restore evidence remains `NOT_RUN` until separately authorized.
- Recovery: prove a database dump/restore together with object SHA-256 readback. Free-plan availability or provider documentation is not recovery evidence.

## Promotion gates and rollback

Promotion order after separate implementation and deployment authorization:

1. Local adapter comparison and selected-adapter build/preview.
2. Durable-session and pending-attempt tests, including restart/retry recovery.
3. Backend PostgreSQL contract tests on the synthetic fixture.
4. Auth, Server Action, API and near-25 MiB file-path integration tests.
5. Independent security, browser, accessibility and failure-path review.
6. Cost/quota and residency review against actual provider configuration.

For a future release, retain the prior Worker version and prior Cloud Run revision. Roll back the frontend Worker first for frontend/auth regressions and the backend revision for API regressions; database migrations remain expand/contract and forward-fixed. No rollback was performed here because nothing was deployed.

## Consequences

- Positive: the selected frontend placement matches the Product Owner's Cloudflare direction; the Go and PostgreSQL runtimes remain unchanged; files stay behind the existing object-store boundary.
- Cost: the frontend now requires adapter and state work that the earlier single-process Cloud Run option avoided.
- Reliability: process memory cannot be a correctness boundary on Workers. Durable sessions and pending-attempt recovery become pre-deployment requirements, not future scaling work.
- Operations: the system spans Cloudflare, Google Cloud, Supabase and ZITADEL. Cross-provider auth, latency, secrets, logs, recovery and quota evidence are mandatory.
- Residency: only the selected Cloud Run backend and Supabase primary database are explicitly Singapore-region choices. Global edge processing, R2 placement and ZITADEL remain outside any proven all-Singapore claim.

## Evidence required for the next status

The next candidate status requires: exact adapter/version decision; clean local production build and Worker preview; durable-state tests; auth/API/upload integration evidence; backend PostgreSQL contract results; quota/cost measurements; residency disposition; independent review. Until then, deployment readiness is **BLOCKED ON IMPLEMENTATION AND VERIFICATION**, not on the topology decision.
