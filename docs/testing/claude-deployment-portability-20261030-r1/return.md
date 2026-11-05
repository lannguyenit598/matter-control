# MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030 — author return

- Identity: actual Claude Code 2.1.314, model Claude Opus 5.5 (`claude-opus-5-5`), Solution Architect. Verification class: **AUTHOR_VERIFICATION** (independent non-author review still required).
- Repository: `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` + preserved dirty tree. Pins: `source-pin-before.json` (815 files, aggregate `f19cce31…69b9`); final drift = only the files in `source-manifest.json`; no concurrent writer changed pinned bytes during the session. `copy-vs-final.json`: isolated build copies differ from final bytes only in `.gitignore` and the new invariant test (neither is runtime code).
- No commit, push, deploy, provider authentication, cloud resource, real R2/ZITADEL/Supabase or legal data.
- Proposed status: **LOCAL_CANDIDATE / IN_REVIEW_WITH_VERIFICATION_BLOCKERS** (provider legs below are NOT_RUN).

Inputs read: handoff prompt; root/component AGENTS; ADR-001/003/004/005/006; free-phase checklist; ADR-006 readiness intake; ZCode ADR-006 cloud-readiness packet (cloud-run-profile); Codex ADR-006 remediation return, runbook and verification programs; current FE/BE source. Assessment and plan were saved before any source edit: `assessment.md`, `docs/implementation/plans/MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030.md`.

## 1. What is portable today, and what prevented it before

Portable: one BFF codebase (durable PostgreSQL state, OIDC, actions, repositories) and one Go image. Before this change portability was blocked by **missing profiles and evidence**, not host-specific code:

- no App Hosting profile; the App Hosting adapter **failed the build** (its CommonJS `next.config.ts` wrapper broke `next build`'s type check on `entry-route.test.ts`, which default-imported the config) — `receipts/apphosting-adapter-build.log`;
- the Node + `BFF_STATE_BACKEND=postgres` path had never run end-to-end, and the Node default `memory` would silently lose sessions on a multi-instance host;
- no Cloud Run or VM deployment profile with host-correct timeouts/drain; no supported VM supervision method;
- no evidence for switching semantics.

## 2. Code adapters vs build/config profiles

| Difference | Resolution | Why |
|---|---|---|
| Worker vs Node artifact | build profiles (`build:worker` / App Hosting adapter + `apphosting.yaml`) | builders differ; env cannot convert artifacts |
| Cache Components on Worker | unchanged Worker-only profile switch (Codex) | documented workerd hang |
| Durable state on Node vs workerd | **no adapter** | same `pg`/`node:net`/`node:crypto` code passed on both (two instances each) |
| App Hosting adapter type-check break | 2-line test import change | adapter rewrites config as CommonJS during build |
| App Hosting bundles all app-root files | constraint: git-connected deploys only; `.gitignore` gains `/.apphosting/`; invariant test asserts `.env*`, `.dev.vars`, `/.apphosting/` are ignored | local secret files were copied into `.next/standalone` |
| Cloud Run vs VM | deployment profiles + renderer | same image; only env, supervision, ingress and secret delivery differ |
| Transport auth | none added; application auth on all combinations | no IAM boundary exists today; adding it is a PO decision (ADR-007 §6) |

## 3. Operator selection, rebuild and compatibility

- FE: Worker = `pnpm build:worker` + Wrangler; App Hosting = rollout of `apps/frontend` with `apphosting.yaml` (+ `apphosting.<env>.yaml`). Each FE target is rebuilt by its own builder; do not mix outputs in one tree.
- BE: one image digest; `node ops/deploy/profiles.mjs <cloud-run|compute-engine> values.json <new-dir>` renders reviewed files and prints, never runs, the next commands. Unknown profile, missing/placeholder values, http endpoints, mutable tags and inline secrets fail closed with key names only.
- Compatible across switches: same origin + same `BFF_STATE_KEYS` ring + same BFF DB ⇒ sessions survive; different origin/issuer/client ⇒ controlled re-login; BE switch only changes `API_BASE_URL`. Full contract: `docs/deployment/portability-runbook.md`.

## 4. Four-combination local results (final harness `verification-programs/portability-smoke.mjs` sha256 `4c3bdf9f…`)

Fixture: owned PostgreSQL 18.6 namespace (product DB + BFF DB with a DML-only BFF role), synthetic OIDC issuer + fake S3 in `node:24.22.1-slim` (`fixture-server.mjs`), one backend image `sha256:754a9cd0…` run under the rendered Cloud Run and VM profiles (`be-profiles.py`; substitutions listed in `receipts/profile-substitutions.json`). **Synthetic IdP is not ZITADEL; fake S3 checks SigV4 presence and SHA-256 headers but not signatures.**

| Combination | Result | Receipt |
|---|---|---|
| Worker FE + Cloud Run BE | **23/23 PASS** incl. same-origin Worker→Node swap keeps session; Worker Server Action id on Node build → 409, no write | `receipts/smoke-worker-cloudrun-r5.json` |
| Worker FE + Compute Engine BE | **21/21 PASS** | `receipts/smoke-worker-vm-r2.json` |
| App Hosting FE + Cloud Run BE | **22/22 PASS** incl. changed origin → re-login | `receipts/smoke-apphosting-cloudrun-r2.json` |
| App Hosting FE + Compute Engine BE | **22/22 PASS** | `receipts/smoke-apphosting-vm-r2.json` |
| App Hosting FE + host Go binary (TTL 0) | 22/22 PASS (earlier harness revision) | `receipts/smoke-node-hostgo-r2.json` |

Probes per run: root redirect, anonymous session, PKCE S256, callback after FE restart, 8-way concurrent refresh across two instances (exactly 1 refresh grant, 0 reuse), session on second instance + after restart (display-only), SSR from Go/PG, no token material in HTML, CSS, 1 MiB and 26,213,376 B upload via BFF → fake S3 → download SHA-256 equal, Server Action foreign origin refused, same-origin write + readback on the other instance, second user cannot list/open the first tenant's workspace (positive control: user B's own authenticated page carries the `Synthetic B` marker in all four receipts, so the pass is not an unauthenticated page), revoked identity denied within the 15 s introspection cache TTL (observed 13.2–14.9 s), logout on B refuses the cookie on A. Fake S3 recorded 10 signed PUTs/10 GETs, 0 unsigned.

Other checks:

| Check | Result | Evidence |
|---|---|---|
| Real App Hosting adapter 14.0.22 build (FRAMEWORK_VERSION=16.4.2, CVE gate exercised) | FAIL before fix → PASS; `bundle.yaml` `runCommand: node .next/standalone/server.js`; `next.config.ts` restored byte-identical | `receipts/apphosting-adapter-build*.log` |
| Secret-file leak scan | `.env.local`/`.dev.vars` copied into `.next/standalone` by the adapter (constraint recorded); none inlined into JS; `.open-next` clean; Worker guard refuses a secret in `.env.local` | `receipts/aba-markers.json`, `aba-a0-worker-guard.log` |
| A→B→A builds in one tree | profile markers switch correctly (Worker false/false ↔ Node true/true); stale `.apphosting/` left after A2; adapter edited `.gitignore` (now pre-listed) | `receipts/aba-markers.json` |
| Migration as Cloud Run job (no key file mounted) | PASS, 0001–0008 | `receipts/be-cloudrun-migrate-job.json` |
| VM container hardening from the rendered unit | read-only rootfs, cap-drop ALL, no-new-privileges, 512 MiB, pids 256, nonroot, key 0400 read-only | `receipts/be-vm-start.json` |
| SIGTERM with 4 MiB upload in flight | Cloud Run profile: 201, exit 0, stop 3.3 s (< 10 s); VM profile: 201, exit 0, graceful | `receipts/drain-*.json` |
| Real YAML parse of rendered `service.yaml`, `migrate-job.yaml`, `cloud-init.yaml` and `apphosting.yaml` (yaml 2.9.1) | 13 structural checks PASS; the regex env parser in `deploy-profiles.test.ts` equals the real parse | `receipts/yaml-caddy-validate.out`, `verification-programs/yaml-validate.mjs` |
| `caddy validate` of the rendered Caddyfile (caddy 2.11.7-alpine `sha256:eb4d35b7…`, `--network none`) | `Valid configuration` | same |
| Worker preview, 26,213,376 B (LOCAL, not a quota fit) | upload 201 in 859 ms, download SHA equal in 589 ms; wrangler+workerd tree RSS 928 MB idle → 1,007 MB peak (+79 MB; dominated by the Wrangler toolchain, so not comparable to a 128 MB isolate limit); client abort at ~30% (7.5 MiB sent) → `AbortError`, no `document_versions` row added, next 1 MiB upload 201 | `receipts/measure-worker-cloudrun-r1.json` |
| Renderer tests | 5/5 PASS | `node --test ops/deploy/profiles.test.mjs` (run in session) |
| Frontend `pnpm check` (final bytes) | PASS: 730 passed / 12 skipped (Codex baseline 726/12; +4 new) | `receipts/frontend-check-r2.*` (r1 = prettier failure on my new test, fixed) |
| Durable BFF PostgreSQL suites | 174/174 PASS, 0 skipped | `receipts/durable-bff-pg-r1.*` |
| Backend `go test -race` config/app/cmd | PASS (no backend source changed) | `receipts/backend-config-app-tests.*` |

Failed attempts are retained under `receipts/failed/` (harness defects: DML-only role cannot apply schema; inspector-port collision; TTL-unaware revocation probe; fixture left revoked after a failed run; zsh word splitting). None was a product failure except the adapter type-check break above.

## 5. Not run / provider-only (NOT_RUN)

Real App Hosting buildpack (pnpm 12, Node runtime, preview support for Next 16), Workers platform CPU/body limits, real HTTPS origins and `__Host-` cookies, ZITADEL, Supabase TLS/pooler/budget, real R2 SigV4, Cloud Run scale-in/timeout/probes, VM Caddy TLS/firewall/COS reboots/journald/Secret Manager fetch (`caddy validate` not run; cloud-init not executed), Linux key ownership semantics (Docker Desktop bind mounts differ), browser/accessibility, cost reports. Also NOT_RUN or only partial: VM `Restart=always`/systemd supervision (the container ran detached; the unit files were parsed and `docker run` flags executed, but no systemd, reboot or crash-restart was exercised); explicit backpressure/slow-consumer behaviour of the BFF (only streamed 26 MiB transfers and one client abort were exercised); Worker CPU time as billed by Cloudflare (the RSS/wall-time sample above is local-only and not a quota fit); host-timeout/proxy behaviour (Cloud Run 75 s timeout, Caddy) beyond config parsing. Backend `make check` full suite not re-run (no backend diff; Codex's 717-pass run stands as prior evidence).

## 6. Changed files (all hashes in `source-manifest.json`)

New (also `ops/deploy/**` verification: `verification-programs/{yaml-validate.mjs,measure-worker.mjs}` added after review): `apps/frontend/apphosting.yaml`, `apps/frontend/src/lib/mc/deploy-profiles.test.ts`, `ops/deploy/{profiles.mjs,profiles.test.mjs,cloud-run.values.example.json,compute-engine.values.example.json,cloud-run/service.yaml,cloud-run/migrate-job.yaml,compute-engine/cloud-init.yaml}`, ADR-007, runbook, approval packet, task, plan, this evidence directory. Modified (prior authors' dirty files): `apps/frontend/src/lib/mc/entry-route.test.ts` (Codex; import shape only, assertions unchanged — **handoff: Codex/reviewer to accept**), `apps/frontend/.gitignore` (+`/.apphosting/`), ADR-006 (one notice paragraph), `docs/deployment/README.md` (tracked), `free-phase-deploy-checklist.md` (untracked, prior author; one amendment paragraph), `docs/ai-sdlc/project-status.md` (one appended paragraph linking this return).

## 7. Remaining regressions, constraints, handoffs, decisions

- No regressions found in the FE gate or durable suites.
- PO decisions D1–D6 in `docs/deployment/portability-cloud-validation-packet.md` (which profiles to qualify, billing, Singapore VM cost vs free tier, VM TLS ingress, platform IAM asymmetry, Next 16 preview on App Hosting).
- Cost: no $0 claim. App Hosting needs Blaze; Cloud Run/GCE need billing; Singapore VM is billed.
- Handoffs: backend owner — `MC_DB_MAX_CONNS` only if the measured Supabase budget is < 10/instance; frontend owner — stale "one instance only" comment in `apps/frontend/Dockerfile`; Codex — accept the `entry-route.test.ts` import change.
- Security notes: App Hosting local-source deploys must not be used; audit client IP records BFF egress (existing behaviour); introspection cache keeps revoked tokens usable up to 15 s (existing A5 decision, now measured).

## Tool versions and resolved digests

Docker 29.9.2 (Docker Desktop), Node 24.22.1, pnpm 12.11.2, host Go 1.27.3 (the image builds with `golang:1.26-alpine@sha256:a2012b4a…0308` → `gcr.io/distroless/static-debian12:nonroot@sha256:afa5c872…f7ab`, so the host Go version is not the image toolchain), Python 3.14.4, Next 16.4.2, React 19.3.1, pg 8.23.1, OpenNext Cloudflare 1.20.14, Wrangler 4.156.0, `@apphosting/adapter-nextjs` 14.0.22 (installed with `--ignore-scripts` in a scratch directory, not a repository dependency), PostgreSQL `postgres:18.6-alpine@sha256:898c60cb…9d6a5`, `node:24.22.1-slim@sha256:be8204d4…c605c`, caddy 2.11.7-alpine `sha256:eb4d35b7…510f`, backend image `mc-claude-portability/mcapi@sha256:754a9cd04348b2c2f45fe8c24f5f79ccbcc0a9c4c1b30b2cf96fa5d92bd3b43f`.

## Process deviations and receipt notes

- **Semble was not used.** The prompt and CLAUDE.md require Semble search before code exploration; I explored with targeted reads/grep from the start and recorded no Semble failure. This is a process deviation, not backfilled.
- Context7 resolve → query returned Firebase documentation only; Cloud Run/Compute Engine facts and the App Hosting support table were read from the official pages (URLs in `assessment.md`). Exact-version library docs for OpenNext/Wrangler were not re-queried: their versions come from Codex's pinned dependency and package metadata.
- `docs/` files were not in the pre-edit pin (`source-pin-before.json` covers `apps/frontend`, `apps/backend`, `ops`); their hashes in `source-manifest.json` are post-edit only.
- Receipt notes: `receipts/be-cloudrun-start.json` and `be-cloudrun-start` were rewritten when the Cloud Run container was recreated for the Worker measurement (the first run's substitutions are preserved in `profile-substitutions-run1.json`); the four combination smokes and drain runs all used the first containers.
- Template fixes after review: `fetch-secrets.sh` now fails closed on a failed fetch (assignments under `set -euo pipefail`), is invoked via `/bin/bash` (COS `noexec` paths), and Caddy's firewall rules are idempotent across restarts.

## Resources and disposition

Owned containers (label `mc.owner=claude-portability-20261030`): `mc-claude-portability-pg`, `-fixture`, `-be-cloudrun`, `-be-vm` — all stopped, retained for QA inspection; image `mc-claude-portability/mcapi:local`. Synthetic credentials and logs live only under the session scratchpad `private/` (mode 0700). No pre-existing container, database, port or process was touched.

Skipped: provider legs above, browser checks, full backend `make check`, VM systemd supervision, backpressure test, Cloudflare-billed Worker CPU measurement. Residual risk: local PASS does not prove provider limits, TLS, IAM, quotas, residency or cost.
