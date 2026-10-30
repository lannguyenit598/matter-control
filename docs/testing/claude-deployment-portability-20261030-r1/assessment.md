# Deployment portability assessment — four FE/BE combinations

Author: actual Claude Code (Solution Architect, Claude Opus 5.5, `claude-opus-5-5`), 2026-10-30. Task: `MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030`. Written **before** any source/config edit. Source pin: `source-pin-before.json` (815 files under `apps/frontend`, `apps/backend`, `ops`; aggregate `f19cce31…69b9`; HEAD `20feedbf…`, 636 dirty/untracked status entries).

Evidence classes: **[src]** read in the pinned working tree; **[doc]** current official documentation read this session (URL listed); **[pkg]** published package bytes inspected in an isolated scratch directory; **[prior]** a prior session's recorded evidence (not re-executed by me unless stated).

## 1. Current source facts (verified, not inferred)

| Area | Current implementation | Evidence |
|---|---|---|
| Frontend framework | Next.js 16.4.2, React 19.3.1, App Router, Cache Components + partial prefetching on the Node profile, `output: 'standalone'` | [src] `apps/frontend/package.json`, `next.config.ts` |
| Worker build profile | `pnpm build:worker` → `scripts/build-worker.mjs` → OpenNext Cloudflare 1.20.14 with `MC_WORKER_BUILD=1` (Cache Components and partial prefetching **off**: documented workerd hang), runtime-secret guard on `.env*`, placeholder `API_BASE_URL=https://unconfigured.invalid/api/v1` at build; Wrangler 4.156.0, `nodejs_compat`, `BFF_STATE_BACKEND=postgres` in `wrangler.jsonc` vars | [src]; [prior] `codex-adr006-remediation-20261030-r1` 17 workerd HTTP probes |
| Node build profile | `pnpm build` = `next build && node scripts/check-built-css.mjs`; Dockerfile builds the standalone server (still says "one instance only … ADR-004", stale since the durable store exists) | [src] |
| Durable BFF state | `src/lib/oidc/durable-state.ts`: AES-256-GCM sealed rows in `mc_bff.state`, one `pg` 8.23.1 `Client` per transaction using `node:net` Socket, advisory xact lock, `verify-full` for remote hosts, `BFF_STATE_BACKEND=memory` default, `postgres` explicit, any other value / bad config → 503 (no memory fallback) | [src]; [prior] 14/14 PG suites |
| Runtime environment access | `process.env` read at module load (`src/lib/env.ts`, zod) and in `durableState()`; Workers populate `process.env` from vars/secrets under `nodejs_compat`; Node reads the process env | [src] |
| Native APIs in BFF | `node:crypto` (AES-GCM, SHA-256, random), `node:net` (pg socket), `Buffer`; no filesystem use in request paths | [src] |
| Backend binary/image | `apps/backend/Dockerfile`: Go 1.26 static binary, distroless `static-debian12:nonroot`, `ENTRYPOINT /mcapi`, `mcapi migrate` subcommand | [src]; [prior] ZCode container receipts |
| Backend listener | `MC_HTTP_ADDR` (default `127.0.0.1:8081`); **does not read `PORT`** | [src] `internal/config/product.go` |
| Backend lifecycle | `/healthz` liveness, `/readyz` = draining flag + pool ping; SIGTERM → draining → `MC_SHUTDOWN_DELAY` → `Shutdown(MC_SHUTDOWN_TIMEOUT)`; `MC_MAX_IN_FLIGHT` admission (503 + Retry-After); request 10 s / transfer 60 s | [src] `internal/app/product.go` |
| Backend DB | pgxpool `MaxConns: 10` **hard-coded** (overrides DSN `pool_max_conns`), statement timeout 5 s; refuses to serve with pending migrations; `MC_MIGRATE_DATABASE_URL` separate migration role | [src] |
| Object store | `fs` or `r2`; `fs` rejected when `K_SERVICE` is set (Cloud Run) but **not** on a VM; R2 via aws-sdk-go-v2 S3, path style, SHA-256 checksum header, whole object buffered in memory ≤ 25 MiB | [src] `config/product.go`, `objectstore/r2.go` |
| Identity | ZITADEL introspection with `private_key_jwt` key **file** (`MC_OIDC_API_KEY_FILE`); https required except loopback | [src] |
| Proxy headers | Audit client IP = first `X-Forwarded-For` hop else peer address; BFF sends no XFF, so audit records BFF egress | [src] `productapi/requestmeta.go` |

## 2. Provider facts used (current official docs, 2026-10-30)

| Fact | Consequence | Source |
|---|---|---|
| App Hosting framework adapters build with `npm run build`; custom build commands "can't dependably guarantee success"; `scripts.buildCommand` override opts out of adapters | Keep our `build` script; do **not** override `buildCommand` | [doc] firebase.google.com/docs/app-hosting/frameworks-tooling, /configure |
| App Hosting Next.js support table lists 13.5–15.2 only; versions newer than the 'active' version are **preview** | Next 16.4.2 on App Hosting is *preview support*, a provider-risk row, not a local blocker | [doc] frameworks-tooling |
| Node.js 22+; pnpm used when `pnpm-lock.yaml` present; version from `packageManager`/`engines.pnpm` | `pnpm@12.11.2` acceptance by the buildpack is unverified (provider leg) | [doc] frameworks-tooling |
| `apphosting.yaml` `env[]` with `value` or `secret`, `availability: [BUILD, RUNTIME]`; `runConfig` cpu/memoryMiB/min/maxInstances/concurrency | Profile is pure config; secrets runtime-only | [doc] /configure |
| App Hosting emulator runs the package manager's **dev** command (`startCommand`), not the adapter build | Emulator is not adapter evidence; I run the real adapter package locally instead | [doc] /emulate |
| App Hosting requires the pay-as-you-go **Blaze** plan; no-cost limits then billed (Cloud Run, Cloud Build, Artifact Registry, Secret Manager 6 active versions, 10 GiB egress) | Not a $0 guarantee; a billing account is mandatory | [doc] /app-hosting/costs |
| `@apphosting/adapter-nextjs` 14.0.22 (published 2026-10-12, no install scripts): sets `NEXT_PRIVATE_STANDALONE`, wraps `next.config.ts` (only `images.unoptimized`), runs `npm run build`, writes `.apphosting/bundle.yaml` with `runCommand: node .next/standalone/server.js`, blocks CVE-2025-55182 Next versions (16.4.2 passes) | Our config survives the wrapper; local build-path validation is feasible with the exact adapter | [pkg] scratch install, source read |
| Cloud Run container contract: listen on `PORT`, not loopback; SIGTERM then **10 s** to SIGKILL; in-memory filesystem | `MC_HTTP_ADDR=0.0.0.0:$PORT`, shutdown budget < 10 s | [doc] docs.cloud.google.com/run/docs/container-contract |
| Cloud Run reserves "some paths ending with `z`" | `/healthz`, `/readyz` must be used only as container probes, never as public URLs | [doc] /run/docs/known-issues |
| Compute Engine: container startup agent (konlet) and `create-with-container` are **deprecated**; use `docker run` in a startup script or `cloud-init` | VM profile = Container-Optimized OS + cloud-init + systemd + `docker run` | [doc] docs.cloud.google.com/compute/docs/containers/deploying-containers |
| GCE free tier: 1 `e2-micro` in us-west1/us-central1/us-east1 only, 30 GB standard PD, 1 GB NA egress | A Singapore VM is **not** free-tier; a free-tier VM breaks the Singapore choice | [doc] docs.cloud.google.com/free/docs/free-cloud-features |
| Cloud Run free: 2M requests, 180k vCPU-s, 360k GiB-s | Billing account still required | [doc] same |

## 3. Compatibility / risk matrix

Legend: **R** reuse unchanged · **C** config/profile only · **A** code adapter needed.

### 3.1 Frontend/BFF capabilities

| Capability | Current impl | Worker (OpenNext/workerd) | App Hosting (Node on Cloud Run) | Change | Risk | Local evidence planned | Provider-only residual |
|---|---|---|---|---|---|---|---|
| Build artifact | Same source, two builders | `.open-next/worker.js` via `build:worker` | `.next/standalone` + `.apphosting/bundle.yaml` via adapter → `npm run build` | **C** (new `apphosting.yaml`) | Build outputs share `.next/`: a Worker build leaves a Worker-profile `.next/` | Actual adapter build in isolated copy; A→B→A in one copy with profile markers | App Hosting buildpack/pnpm 12 acceptance |
| Cache Components / partial prefetching | On for Node, off for Worker | off (documented hang) | on (Node default) | **R** | Behaviour/perf delta between FEs: Worker renders fully dynamic SSR; Node can stream static shells | Both profiles exercised by the same HTTP probes | Real latency |
| RSC / streaming / Route Handlers / Server Actions | App Router | workerd | Node | **R** | Server Action encryption key is per build; mixing builds behind one origin breaks in-flight actions | Origin-rejection + write/readback probe on both | Real origin/TLS |
| `connection()` / request-time reads | Inside `<Suspense>` | ok | ok | **R** | — | SSR page probe | — |
| Env/secrets | `process.env` | vars + secret bindings; `.dev.vars` local | `apphosting.yaml` values + Secret Manager refs, RUNTIME only | **C** | A secret given BUILD availability could be captured; the Worker guard does not cover App Hosting | Config invariant test on `apphosting.yaml` | Secret Manager IAM grants |
| Durable state (PKCE, sessions, refresh, pending transfers) | PG via `pg` + `node:net` | proven [prior] | same code on Node; **untested end-to-end on Node with `postgres`** | **R** (no adapter: no observed incompatibility) | Node defaulting to `memory` on multi-instance App Hosting would silently drop sessions | Two Node instances sharing PG state; restart; concurrent refresh; logout | Supabase TLS/pooler |
| SQL/TLS/connection budget | 1 short connection per state txn | per request | per request, × instances × concurrency | **C** (runConfig bounds) | Supabase session pooler size | Count concurrent BFF connections in fixture | Real pooler limits |
| Crypto/bytes | `node:crypto`, Buffer | `nodejs_compat` | native | **R** | — | Seal/open + 25 MiB round trip on both | — |
| Body/stream limits | Streamed upload route | Workers request body limit (plan-dependent) | Cloud Run 32 MiB HTTP/1 request limit | **R** | Near-25 MiB is inside both documented limits [recall: verify] | 1 MiB + 26,213,376 B upload/download SHA on both | Real limits |
| CPU/memory | — | Free 10 ms CPU / 128 MB | 512 MiB default | — | Worker Free CPU unmeasured | Local timing only, labelled non-quota | Actual Worker CPU |
| Filesystem | none at request time | none | read-only image + /tmp in memory | **R** | — | — | — |
| Auth-sensitive caching | Dynamic per-user pages | dynamic SSR | Cache Components: per-user reads must stay request-time | **R** | Cross-user cache leak if a `use cache` touches session data | Two users, check no cross-user HTML | CDN cache config (App Hosting CDN caches only cacheable responses) |
| Origin/cookies/CSRF | `APP_ORIGIN`, `__Host-` cookies, Server Action Origin check | same | same; App Hosting forwards `x-forwarded-host` | **C** | Changing hostname invalidates `stateKey` namespace (issuer, client, origin) → relogin | Controlled relogin test when origin differs | Custom domain/TLS |

### 3.2 Backend capabilities

| Capability | Current impl | Cloud Run | Compute Engine (COS VM) | Change | Risk | Local evidence planned | Provider residual |
|---|---|---|---|---|---|---|---|
| Image/binary | distroless nonroot | same digest | same digest | **R** | — | One local image used by both profiles | Registry push/pull |
| Listener | `MC_HTTP_ADDR` | `0.0.0.0:8080` explicit (`PORT` ignored by code, so container port must match) | `0.0.0.0:8081` in container, published to host loopback only | **C** | Mismatch with injected `PORT` | Container with `PORT`+`K_SERVICE` set | Real ingress |
| Probes | `/healthz`, `/readyz` | startup/liveness probes only (reserved `z` paths) | Docker healthcheck impossible (distroless has no shell) → systemd restart on exit + Caddy upstream health | **C** | — | Probe 200/503 during drain | — |
| Shutdown/drain | SIGTERM, delay, timeout | grace 10 s → `MC_SHUTDOWN_TIMEOUT=8s` | `docker stop -t 75`, `MC_SHUTDOWN_TIMEOUT=65s` (≥ 60 s transfer) | **C** | Cloud Run can cut a >8 s transfer at scale-in → UNKNOWN, recovered by idempotent retry | SIGTERM with in-flight slow upload on both profiles | Real scale-in |
| In-flight admission | `MC_MAX_IN_FLIGHT` | ≥ concurrency | set explicitly | **C** | — | 503+Retry-After behaviour [prior] | — |
| DB pool | 10 per instance, hard-coded | 10 × max-instances | 10 × 1 | **R** (bounded) / handoff | Supabase pool may need < 10 per instance; knob absent | Arithmetic recorded | Real pooler |
| Migrations | `mcapi migrate`, refuse pending | Cloud Run **Job** with migration role | one-shot systemd unit, operator-started | **C** | — | Migrate container then serve | — |
| Secrets | env + key **file** | Secret Manager env + volume-mounted key file | root-only env file + 0400 key file owned by uid 65532, fetched from Secret Manager at boot into tmpfs | **C** | VM secret material on host tmpfs | Mount/permission check with synthetic key | IAM/Secret Manager |
| Object store | fs/r2; fs blocked by `K_SERVICE` | r2 (enforced) | r2 required by profile renderer (code does not block fs on VM) | **C** | VM accidentally on `fs` with ephemeral disk | Renderer rejects non-r2; container with fake S3 | Real R2 SigV4 |
| TLS/ingress | — | Google-managed | Caddy 2 automatic HTTPS on 443 (+80 ACME); firewall only 80/443; API on loopback | **C** | Patching/restart/log rotation are operator duties | Caddyfile validation not possible without image (see plan) | Cert issuance, firewall |
| Transport auth | ZITADEL per-user bearer (application) | Optional Cloud Run IAM; Worker cannot mint Google ID tokens without a credential; App Hosting could via metadata | No built-in invoker check | **none now** (decision pending since ZCode packet) | Silently removing IAM would be a downgrade — but no IAM boundary exists today | Forbidden/revoked probes prove the application boundary on both | Decision + IAM tests |
| Logging | JSON stdout | Cloud Logging | journald (docker `journald` driver), rotation by journald limits | **C** | Disk fill | — | Log retention cost |

## 4. Combination summary

| Combination | Adapter work | Config/profile work | Principal residual |
|---|---|---|---|
| Worker FE + Cloud Run BE | none (exists) | Cloud Run service/job templates | Worker CPU/body quotas, IAM decision, real origins |
| Worker FE + Compute Engine BE | none | VM cloud-init/systemd/Caddy profile | VM ops (patch/TLS/firewall), Singapore VM not free |
| App Hosting FE + Cloud Run BE | none expected; to be confirmed by Node+PG run | `apphosting.yaml` | Next 16 preview support, Blaze billing, pnpm 12 buildpack |
| App Hosting FE + Compute Engine BE | none | both above | sum of the above |

**Conclusion before implementation:** portability is blocked by *missing profiles and missing evidence*, not by host-specific product code. The BFF already uses only APIs present on both Node and workerd `nodejs_compat`; the Go service already exposes all lifecycle knobs as environment. No new runtime-binding adapter, provider SDK facade or `HOST_PROVIDER` flag is justified unless the Node+PostgreSQL integration run shows an incompatibility. Required work: App Hosting profile, Cloud Run + VM deployment profiles, a fail-closed renderer/validator, invariant tests, an end-to-end four-combination local harness, ADR-007 and runbooks.
