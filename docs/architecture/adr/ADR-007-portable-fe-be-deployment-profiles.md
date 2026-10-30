# ADR-007 — Portable deployment profiles: Workers or App Hosting (FE), Cloud Run or Compute Engine (BE)

- Author: actual Claude Code (Solution Architect), 2026-10-30. Task `MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030`.
- Base: `codex/unified-project-flow` @ `20feedbf…` + pinned dirty tree. Evidence: `docs/testing/claude-deployment-portability-20261030-r1/`.
- Status: **PROPOSED — LOCAL CANDIDATE; the trade-offs below (Next.js 16 on App Hosting preview support, git-only App Hosting deploys, a second operating model for the VM, proposed workload bounds) await Product Owner approval.** Provider qualification, cost and residency decisions open. Not deployment, purchase or real-data approval.

## Context

ADR-006 selected Cloudflare Workers (FE/BFF) + Cloud Run (Go API) + Supabase + private R2 + ZITADEL. The PO asked that the same product code also run with Firebase App Hosting as the FE host and Compute Engine as the API host, selectable per target, without changing Supabase, R2, ZITADEL or product/API semantics.

The source assessment found no host-specific product logic: the BFF's durable state uses only APIs present on Node and on workerd `nodejs_compat` (`pg` over `node:net`, `node:crypto`), and the Go service exposes listener, timeouts, drain, admission and object backend as environment.

## Decision

1. **Selected default unchanged:** Workers + Cloud Run (ADR-006). The alternatives are selectable profiles, not active-active routing or automatic failover.
2. **FE build profiles, one source:**
   - Worker: `pnpm build:worker` (OpenNext 1.20.14, Cache Components off: documented workerd hang) + `wrangler.jsonc`.
   - App Hosting: `apps/frontend/apphosting.yaml` consumed by the official Next.js adapter (`npm run build` → `next build`, Node profile with Cache Components on). No `scripts.buildCommand`/`runCommand` override, which would opt out of the adapter.
   A Node artifact never becomes a Worker by environment variable; each host is built by its own builder.
3. **No runtime adapter or provider flag.** Both FE hosts share the same BFF code, durable PostgreSQL state (`BFF_STATE_BACKEND=postgres` in both profiles), repositories, actions and authorization. Two Node instances, a Worker pair and a same-origin Worker→Node swap were verified against shared state.
4. **BE deployment profiles, one image digest:** `ops/deploy/cloud-run/{service,migrate-job}.yaml` and `ops/deploy/compute-engine/cloud-init.yaml` (Container-Optimized OS + cloud-init + systemd + `docker run`, Caddy TLS ingress). The deprecated container startup agent / `create-with-container` path is not used. `ops/deploy/profiles.mjs` renders them from non-secret values and fails closed on unknown profiles, missing/placeholder values, non-https endpoints, mutable image tags and inline secret values. Migrations are a separate step in both (Cloud Run job / operator-started oneshot).
5. **Host timing bounds (timeouts are derived from existing code defaults; the numeric workload values are proposed defaults, PO-owned):** Cloud Run `timeoutSeconds: 75` (≥ 60 s transfers), `MC_SHUTDOWN_TIMEOUT=8s` (< 10 s SIGTERM grace), container concurrency and `MC_MAX_IN_FLIGHT` 10, Cloud Run `maxScale` 3, App Hosting `maxInstances` 2 / concurrency 20 — proposed defaults from memory and connection arithmetic only (uploads are buffered up to 25 MiB before the R2 PUT: 10 × 25 MiB fits 512 MiB; pgx pool 10 × 3 instances), not measured workload sizing; the Product Owner owns these numbers (decision D7). VM: `MC_SHUTDOWN_TIMEOUT=65s`, `docker stop -t 75`, same in-flight bound.
6. **Transport boundary is the application boundary on every combination:** public HTTPS ingress + per-user ZITADEL bearer introspected by mcapi. Cloud Run IAM is not enabled in any profile, so switching BE host removes no boundary. If IAM is ever required, the platform token goes in `X-Serverless-Authorization` so `Authorization: Bearer <user token>` is preserved; App Hosting can mint ID tokens from its metadata server, Workers cannot without a stored credential, and a VM has no invoker check. That asymmetry is a PO security/cost decision, not part of this ADR.
7. **Switching semantics:** same public origin + same `BFF_STATE_KEYS` ring + same BFF database ⇒ durable sessions survive an FE host switch (verified). A different origin, issuer or client id changes the state namespace ⇒ users sign in again (verified); no session migration is promised. Server Action ids differ per build: an action posted from an old page to a new build fails without a write (verified 409) and the page must reload.

## Consequences

- **App Hosting constraints:** deploy only from the git-connected repository root `apps/frontend`; the adapter copies every app-root file into the server bundle (local `.env*`/`.dev.vars` were observed inside `.next/standalone`), so local-source deploys are not allowed. Secrets must be Secret Manager references with `availability: [RUNTIME]`; console variables are always BUILD+RUNTIME and must not hold secrets. Next.js 16.4.2 is newer than App Hosting's listed `active` version (15.2.x) → **preview support**. pnpm 12 via `packageManager` is unverified on the buildpack. The adapter's CommonJS `next.config.ts` wrapper broke the build's type check on a test that default-imported the config; the test now uses a namespace import (only change to existing source).
- **Behaviour delta between FE hosts:** Worker = dynamic SSR (no Cache Components/partial prefetching); App Hosting = Node defaults with both. Same data, auth and API results; different streaming/prefetch performance characteristics.
- **VM operations are real work:** firewall (80/443), DNS, certificate issuance, COS update reboots, journald retention, Secret Manager IAM, disk. A VM profile is not a second implementation, but it is a second operating model.
- **Cost:** no profile is a $0 guarantee. App Hosting requires the Blaze plan; Cloud Run requires billing; the GCE free tier (`e2-micro`) is only in us-west1/us-central1/us-east1, so a **Singapore VM is billed** and a free-tier VM breaks the Singapore choice.
- **Residency:** unchanged from ADR-006 for Workers/R2/ZITADEL; App Hosting region and CDN placement are additional provider facts to verify.
- **Handoffs:** `MC_DB_MAX_CONNS` knob (backend owner) only if the measured Supabase pool budget is below 10 per instance; frontend Dockerfile comment "one instance only" is stale since durable state exists (frontend owner).

## Supersession

Supersedes ADR-006 only where ADR-006 implies Workers and Cloud Run are the *only* permitted hosts. ADR-006's default topology, gates and non-decisions remain in force. Historical ADRs are unchanged except a one-paragraph notice in ADR-006.
