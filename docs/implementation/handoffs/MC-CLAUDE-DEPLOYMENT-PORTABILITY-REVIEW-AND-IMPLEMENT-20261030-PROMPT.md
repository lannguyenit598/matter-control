# MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030

You are **actual Claude Code, Solution Architect**, working in a dedicated session. Assess the current MatterControl implementation for deployment and implement the smallest architecture changes that let the same product code support:

- Frontend/BFF: **Cloudflare Workers OR Firebase App Hosting**.
- Go backend: **Google Cloud Run OR Google Compute Engine**.
- Existing PostgreSQL on Supabase, private object storage on Cloudflare R2, and the current ZITADEL direction remain unchanged.

First complete a source-backed architecture assessment and detailed plan. Then implement the necessary adapters/profiles, tests and runbooks. Deliver a locally verified candidate or a precise remaining blocker; do not return only advice or a design document. Do not provision or deploy cloud resources.

## 1. Authorization and working boundary

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Expected branch: `codex/unified-project-flow`. Last observed HEAD at preparation: `20feedbf06c859a9806055d609f5b132fe8bb086` plus extensive dirty/untracked implementation. Record actual branch/HEAD/status and pin public source bytes before review. HEAD alone is not the candidate identity.

Read root/component AGENTS, RTK instructions, current workflow/project-status, task/workboard and applicable source rules. Use Semble before code exploration and Context7 resolve → query for current library/provider documentation. Use official sources if the exact version/project is unavailable. Record versions and source URLs; do not infer API compatibility from marketing pages or generic Next.js support.

This direct assignment extends the previously selected Workers/Cloud Run topology with **alternative local implementation/deployment targets**, not an automatic switch of the live default, active-active routing or approval to create infrastructure. Preserve the selected Workers/Cloud Run default unless a documented compatible change is needed; add Firebase App Hosting/Compute Engine as selectable, verified profiles. Keep Supabase/R2/IdP identity and product/API semantics intact. Preserve `leonx.me/matter-control` and all prior authorship/dirty work.

Allowed edits: the narrow frontend/backend runtime integration, build/configuration, state-store portability, lifecycle/health, tests and deployment documentation needed for these four targets. Do not redesign UI/UX or business workflows. Establish exact shared-file ownership before edits: other Codex/ZCode sessions may be changing next.config, package/lock files, OIDC/state, backend entry/config and readiness. This assignment does not terminate their ownership/runtime. If overlap is unresolved, finish independent review/design and identify the exact handoff required before touching overlapping files. Do not overwrite their changes or continue on mixed unpinned bytes.

No reset/stash/clean/branch switch, commit/push/merge/deploy, provider authentication, new IAM/DNS/billing/IdP changes, paid cloud builds, real R2, retained-database migration or legal data. Do not change global tools/settings. Reuse installed dependencies; add a minimal repository-scoped pinned adapter dependency only if technically necessary, after documenting why and reviewing its provenance/scripts, while preserving unrelated lockfile changes. Network/sandbox restrictions remain binding; a dependency/tool blocker is not permission to bypass them. No unsolicited agents or external-session messaging.

## 2. Mandatory current-source intake

Read ADR-001/003/004/005/006 with supersession notes, `docs/deployment/free-phase-deploy-checklist.md`, deployment/readiness intake, `MC-ZCODE-ADR006-CLOUD-READINESS` task and implementation prompt plus its B1–B9 addendum. Read the latest review and remediation artifacts, including:

- `docs/testing/zcode-adr006-cloud-readiness-20261030-r1/`: return, adapter comparison/PoC, durable-state design, readiness and security matrices, cloud-validation packet.
- `docs/testing/zcode-implemented-system-review-20261030-r1/`: return, findings and remediation handoff; author-review limits remain explicit.
- `docs/testing/codex-zcode-implementation-intake-20261030-r1/` and `docs/testing/codex-adr006-remediation-20261030-r1/` if present. Discover actual available files: a missing final return means the session's completion is not established. Do not fabricate an evidence path.
- Newer task/returns that supersede any of these. Read current source before treating a historical blocker as still open.

Preparation observations from current source, to verify rather than overwrite:

- `apps/frontend/package.json` already contains `@opennextjs/cloudflare` 1.20.14, Wrangler 4.156.0, pg 8.23.1, `build:worker` and `preview:worker`. Do not start by claiming no adapter exists or replacing OpenNext with vinext.
- `apps/frontend/next.config.ts` already distinguishes `MC_WORKER_BUILD=1`; Node keeps Cache Components/partial prefetching while the Worker profile disables them because of a documented adapter/workerd hang. Assess the evidence and behavior/performance delta; do not silently drop the workaround or globally disable features on all platforms.
- `scripts/build-worker.mjs`, `scripts/worker-build-env.mjs`, `open-next.config.ts` and `wrangler.jsonc` already define Worker packaging and secret guards. Preserve the build/runtime secret separation and fail-closed placeholder API endpoint behavior.
- `src/lib/oidc/durable-state.ts` and durable session/transfer tests now exist. The implementation uses encrypted PostgreSQL state, transactions/locks, pg, Node crypto/net and per-transaction connections. Historical reports describing a Map/WeakMap-only implementation may predate these bytes. Trace actual production selection, caller wiring, schema/migrations, roles, TLS, expiry, rotation and pending-attempt integration before proposing a replacement.
- `apps/backend/Dockerfile` already produces a nonroot native Go image with migrate/serve entrypoint. Reuse this image/binary for Cloud Run and Compute Engine where possible. Different hosts alone do not require a new Go domain-service adapter.

## 3. Architecture assessment — before application changes

Deliver a compatibility/risk matrix for the four deployment combinations. For every relevant capability list current implementation → platform difference → reuse/config change/actual adapter needed → risk → evidence/test → residual provider-only verification.

### Frontend/BFF

Assess exact Next.js/React/Node and OpenNext versions, App Router, SSR/RSC, streaming, Route Handlers, Server Actions, `connection()`, cache/prefetch behavior, native Node APIs, environment access and build output. Firebase **App Hosting is different from Firebase Hosting**: use its documented Next.js support/build integration and `apphosting.yaml`; do not apply classic Hosting's cookie-rewrite assumptions to App Hosting without evidence. App Hosting ultimately runs Node on Cloud Run; its managed lifecycle/build output still differs from a local standalone server.

Check Worker isolate/request-context restrictions; Node process lifecycle; SQL/TLS/connectivity and connection budgets; crypto/byte handling; request/body/CPU/memory and streaming limits; native sockets; filesystem usage; caches and auth-sensitive responses. Prefer one shared product/BFF implementation with thin host-specific binding/config handling. Do not duplicate feature actions, repositories, DTOs, UI or authorization by provider.

### Backend and network boundary

Assess listener/PORT, timeouts, readiness/liveness, shutdown/draining, in-flight admission, DB pooling, temporary storage, job/migration execution, logging and concurrency. Cloud Run is managed request/container hosting; Compute Engine requires explicit OS/container supervision, TLS ingress, firewall, patching/restart/log rotation and secret delivery. A VM deployment profile is operational work, not a second Go business implementation.

Assess transport authentication separately from per-user ZITADEL authorization. If using Cloud Run IAM, preserve the user's bearer token and use the documented separate platform-auth channel; Compute Engine has no equivalent built-in Cloud Run invocation check. Never silently remove an auth boundary on host switch. Specify canonical public API/BFF origins, trusted proxy/header handling, HTTPS, CSRF and approved routing. Do not solve the switch by exposing DB/credentials or moving server-side tokens into the browser.

### Shared state and switching semantics

Keep the proven state contract portable: expiry/idle renewal, atomic refresh/rotation, logout/revocation, encryption key/version rotation, replay resistance, tenant/actor/session scope, pending mutation/receipt recovery and UNKNOWN semantics. Identify a real runtime difference before introducing an interface; extend an existing port/store contract instead of inventing a provider SDK facade.

Define what a deployment switch preserves: same public origin versus changed hostname, state schema compatibility, shared or rotated encryption keys, concurrent old/new revisions, Server Action build IDs/encryption keys where relevant, in-flight writes/transfers and controlled relogin. Do not promise transparent session migration when origins or cryptographic compatibility change. No copying production tokens into test artifacts or storing credentials in cookies to achieve portability.

## 4. Detailed design and implementation plan

Save the assessment and plan **before source edits**. Include two focused architecture diagrams (deployment and request/state flow), alternatives, the selected minimum design, requirement/contract traceability, file ownership, exact edits/callers/tests/config and rollout/rollback sequence. Record an ADR using the next unused number; supersede only the relevant single-target restrictions, preserving historical ADR bytes/provenance except a small supersession notice.

Distinguish:

1. **Build adapter/profile:** produces Worker versus Node/App Hosting artifacts from the same source. Switching target generally requires the correct build/deploy, not an environment variable that makes a Node artifact run as a Worker.
2. **Runtime binding adapter:** only for concrete differences in environment/secrets/platform services. Validate once at the boundary; never scatter provider checks through domain/UI code.
3. **Deployment profile:** manifests/scripts/runbooks for a backend image on Cloud Run versus a supervised VM. Reuse lifecycle and service logic.

Propose a simple operator selection mechanism consistent with existing scripts. Do not assume one command/one immutable FE artifact can serve both runtimes. No generic plugin registry, multi-cloud control plane, service mesh, Kubernetes, new IaC framework or automatic failover. No unnecessary `HOST_PROVIDER` flags if explicit scripts/config already express the difference. Unknown/missing profile configuration must fail closed with actionable nonsecret errors.

After saving the plan, give a concise progress update, then implement within the authorized scope. Routine architecture/implementation choices belong to you; ask only for real new policy, security, cost or product trade-offs. If a supported target needs an unapproved security/behavior downgrade or a dependency upgrade of material scope, record the incompatibility and complete unaffected targets rather than silently weakening the product.

## 5. Implement the smallest complete portable candidate

- Preserve/reuse the current Worker build/config and Node path; add the missing Firebase App Hosting profile using documented configuration. Map BUILD versus RUNTIME values explicitly; keep secrets runtime-only unless a documented nonsecret build input is required. Do not bundle .env, signing/sealing keys, database URLs or IdP credentials. Verify custom build command/adapter behavior, not just YAML syntax.
- Make existing state/config integration operate correctly on both Worker and Node paths. Add a thin adapter only for an observed incompatibility; avoid changing transaction/security semantics merely to make a build pass. No production fallback to memory or local filesystem when durable dependencies fail.
- Reuse the same Go image/binary on both backend hosts, with explicit safe profiles for ports, shutdown, role separation, object backend and probes. Keep migrations a separately operated step rather than every instance applying DDL at boot.
- Provide a minimal reviewable Compute Engine runtime artifact and runbook using a currently supported startup/supervision method. Verify current Google documentation before using old container-declaration/create-with-container shortcuts. Do not open ports, install agents, create VMs or run host provisioning on this workstation. Model nonroot execution, secret file permissions, restart policy, health/log handling, resource limits and TLS/proxy assumptions; validate locally where possible.
- Keep R2 and PostgreSQL provider boundaries unchanged. Remote deployments must use private R2 and validated TLS, separate runtime/migration/BFF privileges as applicable, and bounded pool size × replica count. Local-only fixtures may use explicitly local substitutes with clear labels.
- Update affected callers/tests/config/examples/docs together. Preserve normal local developer/test behavior and Atomic/import rules. Do not overwrite unrelated dirty lock/config files or start scripts with cloud side effects during verification.

## 6. Verification — behavior, not filenames

Use an isolated public-source snapshot/build output and fresh labelled synthetic PG/fake object-store fixtures. Never copy private env/key files or mutate retained runtimes/DB. Bind results to hashes/tool versions and check concurrent source drift. Verify existing scripts for side effects before invoking them. Add meaningful tests for real branches/adapters, invalid config, secret leakage and security/state invariants; not assertions that four manifest filenames exist.

Required evidence matrix:

| Combination | Minimum local evidence | Cannot be claimed from that evidence |
| --- | --- | --- |
| Worker FE + Cloud Run BE | Actual workerd preview of built artifact + container with Cloud Run contract profile + synthetic DB/storage | Deployed Worker/Cloud Run IAM, network, region or billing proof |
| Worker FE + Compute Engine BE | Same Worker artifact + same backend image with VM profile/supervision validation | Actual VM patching/firewall/TLS/identity behavior |
| Firebase App Hosting FE + Cloud Run BE | Exact Node/App Hosting build-path validation where tooling permits + Node runtime integration against backend container | Local Node success alone is not App Hosting adapter/deployment proof |
| Firebase App Hosting FE + Compute Engine BE | Same validated Node profile + VM-profile backend container and equivalent API behavior | Provider execution/availability/cost guarantees |

Run each feasible local combination. For unavailable official build/emulation tooling, state the exact missing leg and test shared Node semantics separately; do not rename that a Firebase pass. Do not execute remote builds or deploy to obtain missing evidence under this prompt.

Exercise entry and SSR, synthetic OIDC callback/session lifecycle, Server Actions/Origin/CSRF, forbidden requests, tenant revocation, two independent FE instances, restart and state recovery, concurrent refresh/rotation, unknown-outcome retry and bounded transfer persistence. Use a local synthetic IdP and distinguish it from real ZITADEL verification. Verify restart of an instance does not silently lose durable sessions; test controlled relogin if switching origin is intentionally unsupported. Check no cross-user cache data, browser token leakage, client-bundle secrets or wrong-runtime SDK imports.

Check upload/download with small and near-25 MiB synthetic payloads, checksum, streaming/backpressure, cancellation, host timeouts and proxy behavior; use fake/local R2-compatible storage, not real R2. Measure Worker CPU/memory locally with methodological limits, not an invented Free-plan fit. Verify backend health/readiness and bounded SIGTERM drain with requests in flight. Re-run applicable frontend gates/build/CSS guard, backend gates/sqlc/race PG contracts and shared state tests on final bytes. Separate baseline failures, skips and new regressions.

Include A → B → A profile selection/build smoke without contamination of generated configs or outputs. Verify independently selectable FE/BE targets; all combinations keep the same API/auth/state contract. Document immutable build identifiers, secret references and explicit operator steps; selection scripts must not silently deploy or choose an account.

## 7. Cost, residency and release limits

The user's free objective is unchanged. Evaluate cost separately per profile: Workers Free CPU/request limits, Firebase App Hosting billing/managed dependencies, Cloud Run usage/egress, VM/disk/IP/uptime, build/registry/logging/secrets, Supabase/R2/IdP. Use current official documentation and distinguish no-cost allowance, trial credit, paid minimum, overage and enforcement limits. A portable adapter does not make every target free; **do not claim $0 or activate billing**.

Retain Singapore as the selected backend/database region where available. Workers/global CDN/R2 location hints and IdP residency are separate limitations, not an automatic all-Singapore guarantee. No unapproved storage/IdP provider migration. Record minimal real-provider validation and cost/residency decisions needed after local acceptance, without making prior deployment a prerequisite for requesting that authorization.

## 8. Deliverables and acceptance

Create/resume `docs/implementation/tasks/MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030.md` with scope/requirement IDs/owner/priority/dependencies/inputs/outputs/tests/reviewer/acceptance. Use `docs/testing/claude-deployment-portability-20261030-r1/` (increment if occupied) for assessment, compatibility matrix, source/evidence manifests, commands/receipts, final drift check and return. Save the detailed plan at `docs/implementation/plans/MC-CLAUDE-DEPLOYMENT-PORTABILITY-20261030.md`.

Deliver actual minimal source/config/test changes, the new ADR, the four-profile verification matrix, environment/secret contract, provider switch and rollback runbook, reviewed deployment templates and a separate cloud-validation approval packet with exact operations/resources/cost exposure. Preserve historic reports; update only controlling current docs and link the new evidence.

Final return must answer:

1. What is portable today, and what prevented portability before the change?
2. Which differences required code adapters, which only build/config profiles, and why?
3. How does an operator select each FE/BE target, what must be rebuilt, and what state/secrets/origin remain compatible?
4. Which of the four combinations actually passed which local checks, and which provider-only legs remain NOT_RUN?
5. What regressions, cost/residency constraints, writer handoffs or security decisions remain?

Return actual Claude identity/tool/version, base/head plus working-tree pins, changed files, fresh test counts/exits and concise remaining blockers. Declare prior authorship and mark your implementation verification AUTHOR_VERIFICATION; independent acceptance belongs to a non-author reviewer. End LOCAL_CANDIDATE / IN_REVIEW_WITH_VERIFICATION_BLOCKERS or precise BLOCKED status, not project DONE or DEPLOY_READY without the corresponding evidence. Finish with skipped checks and residual risks. No commit/push/deploy/provider mutation.
