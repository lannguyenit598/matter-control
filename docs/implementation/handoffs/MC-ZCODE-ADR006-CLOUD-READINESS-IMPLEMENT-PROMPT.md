# MatterControl — ADR-006 cloud readiness implementation and deployment packet

## Assignment and controlling decision

You are actual ZCode. Inspect the complete current product against ADR-006, implement the missing authorized repository/local readiness work, and deliver one reproducible candidate plus a concrete cloud-validation/deployment packet. Continue through ordinary implementation and verification milestones; do not return only a plan or a generic list of blockers.

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Expected branch: `codex/unified-project-flow`; last observed HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` plus extensive dirty/untracked source. Verify current identity and preserve all work.

Controlling ADR: `docs/architecture/adr/ADR-006-workers-cloud-run-supabase-r2-topology.md`:

- Next.js/frontend BFF on Cloudflare Workers; exact adapter still to be established by comparative PoC.
- Native Go API on Cloud Run `asia-southeast1`.
- Supabase PostgreSQL `ap-southeast-1`, session-compatible connection/migration path.
- Private R2 for files/images.
- Existing ZITADEL direction, with public origins, region and production configuration unresolved.

This is local implementation/testing and deployment-preparation authority. It is **not** approval to create/change cloud resources, IAM/DNS/secrets, billing/plans, ZITADEL settings, retained databases, production traffic or real-provider data. Prepare exact reviewable actions before requesting a bounded cloud-validation stage. No production release, real legal data, paid activation, provider login, real-R2 call or automatic deployment.

The strict zero-cost target and residency constraints remain open. Do not substitute Cloud Run frontend, static export, D1, another IdP or a paid plan to make the checks pass. If the selected topology cannot satisfy a requirement, show the concrete failed evidence and alternatives for the PO; keep unaffected local work moving.

## 1. Resume, coordinate and pin

Mandatory readiness amendment: consume `docs/implementation/handoffs/MC-ZCODE-ADR006-ZERO-TRUST-B1-B9-ADDENDUM.md`. It incorporates the PO's B1–B9 work list, source qualifications and concrete least-privilege/index/rate/TLS/encryption/MFA/retention/rotation/monitoring verification. Execute it within this assignment's writer/local/cloud approval boundaries. Resume the same task; do not create another overlapping writer or infer every proposal is already an approved production policy.

Read root/component AGENTS, RTK, current contracts/workboard and applicable rules. Use Semble before exploration and Context7/current official docs for version-specific configuration. Verify actual tool/model, branch/HEAD and dirty source. Installed SDK presence and authenticated account state do not establish deployment permission.

Consume ADR-006, its supersession notices in ADR-004/deploy checklist, and:

- `docs/implementation/handoffs/MC-P0-ZCODE-EIGENWELT-END-TO-END-PROMPT.md` and any actual implementation returns.
- `docs/implementation/handoffs/MC-ZCODE-SYSTEM-REVIEW-THEN-SOLID-GLASS-IMPLEMENT-PROMPT.md` and actual system/tenant/UI audit returns. A prepared audit prompt is not a completed verdict.
- Current Review Matrix correction and Codex intake; preserve F01..04 corrections and open independent/browser gates.
- `docs/deployment/`, backend operations/API/Makefile/Dockerfile/configuration, frontend package/Next configuration/session/recovery code and root CI workflows.
- Current security/data retention/permission/state/Golden Workflow requirements. Pilot-critical isolation/auth/recovery defects block cloud exposure; unrelated future P1/P2 recommendations do not automatically become pilot prerequisites.

Identify active writers and exact shared paths. This assignment overlaps OIDC/transfer/state/backend configuration and CI; get an actual task/file handoff before editing those paths. Do not infer handoff from processes, mtime or elapsed time. Finish nonoverlapping assessment, scripts/templates and isolated PoCs while a narrow overlap waits. Do not run the same implementation twice in competing sessions or overwrite Solid Glass feature edits.

Create/resume `docs/implementation/tasks/MC-ZCODE-ADR006-CLOUD-READINESS.md` and a noncolliding `docs/testing/zcode-adr006-cloud-readiness-<actual-attempt>/`. Pin source, contract and dependency versions. Isolated builds/PoCs must exclude private `.env*`, key files, tokens, caches and user data; verify copied public source and record drift from other writers. Preserve existing local login runtime and database.

## 2. Build the readiness inventory before changing it

For every ADR gate record source proof, executed evidence, current state, missing action, owner, dependency and approval boundary. Use IMPLEMENTED_NOT_VERIFIED, PASS_SCOPED, FAIL, NOT_RUN, BLOCKED_DEPENDENCY and DECISION_REQUIRED accurately.

Observed preparation leads, to recheck against current source:

- Frontend Next16.4.2/React19.3.1 with `cacheComponents`, `partialPrefetching`, standalone Node output; no Workers adapter/Wrangler config found in the initial inventory.
- OIDC session-store uses global process Map; refresh coordination uses Map; pending transfers use WeakMap keyed by session object. These are intentionally local-profile mechanisms, not distributed durable state.
- Next configuration redirects `/` to `/dashboard`, while product root route uses `/workspaces`; reconcile this obsolete route/configuration instead of assuming every redirect mismatch proves a stale runtime.
- Go configuration defaults bind127.0.0.1:8081, object backend fs, max-in-flight0; Cloud Run profile needs explicit validated container settings. Existing source already implements request/transfer timeout, readiness/draining/shutdown and rejects fs when K_SERVICE is set. Inspect/test before duplicating.
- Separate migration DSN is supported; no complete runtime/migrator least-privilege SQL/cloud profile was located. Pool currently has a fixed MaxConns10; include instance-count multiplication and migration/admin headroom.
- Root workflows currently run checks/builds and demo frontend E2E; they do not establish Workers packaging/deploy, authenticated product E2E or cross-cloud integration.

These observations are leads, not a current full audit. Do not erase valid completed readiness work because an older checklist says it was absent.

## 3. Workers adapter comparison and selection

Compare current exact vinext and OpenNext candidates against the actual application in separate isolated copies. Resolve current official support/version limits and pin packages/runtime/compatibility date. Generic feature support tables are not proof of this exact Next/React/configuration combination.

Test routing, RSC/streaming, Suspense/request-time `connection()`, cookies/headers, Route Handlers, Server Actions, current cacheComponents/partialPrefetching behavior, server-only imports, crypto, multipart/streaming, static assets/fonts/Tailwind, CSP/security headers, redirects, localization and error boundaries. Local preview must execute the intended Worker/workerd runtime, not only next dev or Node standalone. Record any emulation gap.

Do not run automatic configure/add/migrate generators on the shared dirty tree. Necessary local adapter/dev dependencies may be evaluated at exact pinned versions in isolated copies; inspect changes/lifecycle scripts and license/security compatibility. Do not alter global tooling or relink another session's node_modules. Adopt a selected adapter into shared source only after a stable compatibility result and writer handoff, with a narrow justified lockfile delta. No remote bindings/account calls as a side effect of preview/build; explicitly use local emulation and inspect defaults.

Choose the smallest approach preserving approved behavior. If neither candidate supports a required feature, produce a minimal failing reproducer and concrete configuration alternatives. Disabling required semantics, downgrading Next/React or replacing the framework needs an explicit compatibility/design disposition rather than a silent shortcut. Keep both comparison results; recommendation is implementation evidence, not independent acceptance.

## 4. Durable auth and pending-command state — implement before cloud readiness

Specify and implement a durable design compatible with the selected topology. Evaluate reuse of existing PostgreSQL/backend versus Cloudflare state services on consistency, latency, security, cost and residency; introducing a new managed service/binding remains a cloud decision. Do not choose an eventually consistent cache as authoritative revocation/refresh/command ownership merely because it is cheap.

Design must cover:

- Opaque random session handle in HttpOnly/Secure/SameSite cookies; access/refresh tokens server-side only, encrypted at rest with declared key ownership/version/rotation and no secret logging.
- Expiry, idle/absolute lifetime, logout/destroy, revocation, cleanup, storage outage fail-closed behavior and per-session/user resource bounds.
- Distributed refresh-token rotation: atomic ownership/versioning or equivalent; concurrent Worker requests cannot refresh twice, overwrite fresh tokens, revive a destroyed session or accept stale updates. A process Map/single-flight is not the cross-instance correctness boundary.
- Login state/PKCE/callback replay and multi-instance/cold-start behavior; a durable session alone does not establish all transient auth state is correct.
- Pending import/bulk commands keyed by stable session/user/tenant/Matter identity rather than JS object identity; preserve original command payload, key, authorization context and receipt reconciliation across restart, retry and deployment.
- Bounded persisted upload/plan data, encryption/provenance, expiry and access-loss purge; do not put legal content/tokens into browser-readable storage or exceed a database's practical body limits by storing arbitrary file blobs there.
- In-progress leases/expiry and crash recovery so commands neither run twice nor remain locked forever. UNKNOWN is not failure; never mint a new command key to discover whether the old write committed.
- Safe schema/interface evolution and cleanup; no migration of retained local sessions/tokens without a scoped decision. Keep local developer login behavior functional under its declared profile.

Test two independent process/store clients, restart/new isolate, concurrent refresh, logout-versus-refresh, storage outage, expired/revoked session, UNKNOWN retry, changed props/scope, cross-tenant lookup and no token/payload disclosure. Deliver a focused security-review packet; author tests do not waive independent review.

## 5. Cloud Run backend profile and image

Retain native Go, existing ports/services/domain and object-store interface. Produce a minimal explicit pilot profile and validated configuration:

- Container listens on0.0.0.0 with an exact configured Cloud Run port; clarify whether PORT is consumed or MC_HTTP_ADDR is supplied. Verify running container connectivity, not only EXPOSE or compilation.
- Non-root reproducible image/toolchain, bounded resources, startup/readiness/liveness and graceful SIGTERM within platform termination limits. Reuse existing shutdown/draining implementation and test it with real local container requests.
- Route/transfer/read/write deadlines, request size, concurrency/max-in-flight, max instances, DB pool and timeout multiplication; rejection is503/retry-safe where contracted. Bound scale/cost exposure without promising max-instances alone is a hard spending cap.
- Cloud profile requires private R2, valid secrets and no production demo/local-directory flags. Reject unsafe fs/object/identity configuration, including local people directory exposure outside its approved local/dev scope.
- Decide and document Cloud Run invocation model: user bearer tokens forwarded by BFF are distinct from platform IAM service-to-service identity. Either restrict invocation through an actually supported Worker identity approach or explicitly assess a public network endpoint with mandatory application auth and abuse controls. Do not silently grant allUsers/IAM or assume Worker can mint a Google identity token.
- Ensure migration does not run independently on every autoscaled instance. Prepare a separate serialized migration job/operator action, forward-compatible schema sequence and runtime version check. No retained migration executed here.

## 6. Supabase PostgreSQL readiness

Prepare SQL/scripts/configuration and verify on disposable local PostgreSQL first:

- Separate schema-owner/migrator/runtime roles with explicit schema/table/sequence/function grants and default privileges for future migrations. Runtime cannot create/drop/alter or bypass intended ownership policy; test denied DDL and required DML.
- Correct TLS/hostname validation and separate migration/runtime connection paths. Current official shared transaction-pooler limitations differ from session pooling; test pgx prepared behavior, advisory locks and migration connection lifetime against the intended mode. Do not add Prisma-specific DSN flags to pgx or hide incompatibility by disabling safeguards blindly.
- Region ap-southeast-1, selected pooler mode, connection budget across max instances and reserved migration/ops slots, statement/lock/idle transaction timeouts and reconnect/pause behavior.
- Supabase Data API exposure, public/anon/authenticated grants and private schemas. Application ACL does not protect a separately exposed database API. Prepare a deny/disable strategy and negative anonymous/cross-tenant test; no account setting changed during local preparation.
- Include latest feature migrations/constraints, tenant isolation and Review Matrix history changes. Code-created identifiers/receipts/events remain correctly scoped.
- Forward-compatible migration/preflight/backup commands and failure recovery. A local role fixture does not prove managed Supabase grants/pooler/network behavior; keep provider checks NOT_RUN until authorized.

## 7. R2 and full file/transfer path

Use local synthetic object fixtures for ordinary development. Preserve private bucket, bucket-scoped credentials, server-side authorized content retrieval, SHA256 and version semantics. Inspect IAM/public-access requirements rather than creating a bucket/token.

Test local Worker→Go→object-emulator flow with1MiB and near25MiB files, content equality, size rejection, multipart/envelope overhead, retries, interrupted/lost-response UNKNOWN recovery and access loss. Record CPU/memory/body buffering and latency where measurable. Avoid base64/duplicate buffering of large files in Worker/Server Actions if it violates the selected runtime constraints. Preserve the authorized BFF boundary; direct browser upload/public URLs are architecture changes requiring a separate security contract.

Real R2 SigV4/HEAD/PUT/GET/multipart/permissions and cross-cloud near25MiB tests require a named authorized synthetic bucket and bounded workload. Emulator/Node success is not real-provider compatibility or Worker free-limit evidence. Prepare an exact provider validation script with safe cleanup of only task-owned synthetic keys, private log handling and operation budgets; do not execute remote calls now.

## 8. CI/CD, secrets, observability and recovery

Prepare reviewable repository artifacts rather than triggering deployment:

- Worker build/local-preview/compatibility/type generation and Go image build/scan/test; pinned CI actions and toolchains, reproducible manifest/lockfiles, skip accounting and required negative tests.
- Separate PR jobs without cloud credentials from protected manually approved deployment jobs. Use least privilege, environment separation, immutable artifact/revision identity, serialized deploy/migration and no automatic live deploy on push during this assignment.
- Prefer GitHub→Google workload identity federation over committed long-lived keys where applicable; scoped Cloudflare/Supabase secrets and rotation/source mapping. Templates contain secret names/placeholders only. Some secret/binding commands mutate/deploy immediately; include them in the approval packet, not a presumed harmless setup step.
- Worker vars/bindings, Cloud Run service/image/profile, migration action, SQL grants, domain/origin/redirect map and idempotent preflight. IaC/dry-run scripts must not mutate accounts during tests or auto-enable paid APIs.
- Redacted structured logs, correlation across Worker→Go, error/quota/auth/DB/object metrics, health and alert ownership. Exclude tokens, DSNs, request bodies, synthetic personal identifiers and legal document content from logs.
- Database+object backup manifest and synthetic restore rehearsal with relational/readback and SHA checks, corrupted/missing object cases, source/target separation and private credential handling. Prepare scheduled backup/retention/key recovery only under actual policy; local RPO24h/RTO8h test inputs are not production commitments.
- Rollback packet retains Worker version and Cloud Run revision, identifies compatible DB versions, uses expand/contract/forward fix and preserves legal data. Do not present goose down/drop tables as safe production rollback.

Update executable deployment checklists to ADR-006 while preserving historical records. Old Cloud Run-frontend/single-process assumptions must not remain in the active runbook. Reconcile obsolete root redirects and demo-only CI assumptions with the actual product entry journey.

## 9. Quota/cost/residency and approval packet

Fetch dated current official documentation and distinguish public allowance, actual account entitlement, configured limits and measured consumption. Enumerate Workers runtime/state services, Cloud Run, build/artifact registry, networking, Supabase, R2 operations/storage, backups/logging, secrets, CI, IdP and domain costs. No component may disappear from the cost model merely because it is ancillary.

Model approved synthetic workload, per-request CPU/bundle/startup limits, request counts, DB growth/connections, upload/retry amplification and R2 operations/backup retention. A local workerd observation cannot prove provider enforcement or account shared usage. Budget alerts are not hard caps. If a strict zero bill cannot be guaranteed, retain the gate and present the exact plan/limit trade-off; no automatic plan upgrade or changed objective.

Residency: Cloud Run Singapore plus Supabase Singapore does not prove all data stays in Singapore. Map Worker processing/caches/session state, R2, backups/logs/CI and the existing Australian ZITADEL instance/configuration from actual approved metadata. Record unresolved scope and a precise PO decision; no silent IdP migration or residency waiver. Keep synthetic-only until accepted.

Produce one deployment-input checklist: Cloudflare account/plan and Worker origin/bindings; GCP project/billing eligibility/region/service and permitted identity; Supabase project/region/pooler/public exposure profile; private R2 bucket/scope; public app/API origins; ZITADEL application/audience/redirects/logout; secret destination/owner; workload/quota/cost/residency decisions; operator/rollback contacts. Ask for non-secret identifiers/status only, with secret values entered through the approved secret store/operator path.

Separate promotion stages to avoid claiming remote proof before authorization:

1. LOCAL_CANDIDATE: local adapter/state/container/DB-role/object tests and reviewable configuration complete, with remaining gaps explicit.
2. READY_FOR_SCOPED_CLOUD_VALIDATION: independent critical review plus exact proposed resources/actions/data/operation budget/cost/rollback packet ready for PO authorization. This is not a deployed result.
3. After a future actual authorization: verify account permissions/resources/limits using available supported read-only tools first, execute only the approved bounded synthetic validation, read back real state and measured results. This prompt does not perform that stage automatically.
4. Pilot/production go/no-go requires its own evidence and explicit release approval; real legal data has additional tenancy/residency/recovery gates.

## 10. Finish and handoff

Implement all safe authorized local readiness work before returning. When blocked by an external account/policy/tool boundary, complete independent items and prepare the exact unblock action. Do not block local compatibility testing on future provider secrets, or claim all ready from existing Node/Docker builds.

Deliver:

- `readiness-matrix.md/json`: each ADR gate, current source, executed results, remaining action/owner/approval boundary.
- Adapter comparison/decision, durable-state/security design and regression results, container/cloud profile, least-privilege SQL, CI/configuration/deployment templates, active ADR-006 runbook and restore/rollback procedures.
- Exact source/contract manifests and deltas, commands/UTC/exits/tool versions, test pass/fail/skip counts, local Worker/browser evidence with identity and limitations.
- `cloud-validation-approval-packet.md`: exact candidate, proposed provider actions/resources/permissions/secrets destination, bounded synthetic workload, potential costs, residency and rollback/cleanup; no credential values.
- One prioritized blocker list separating local implementation defects, unexecuted provider verification, material PO decisions and independent acceptance.

Final status reflects actual stage, not “deployment complete”. No source commit/push, remote mutation/deploy, IAM/billing/DNS/IdP change, production acceptance or agent-provider payload transmission under this local task. Keep writer handoffs and historical evidence intact. End with skipped checks, resource disposition, risks and the next exact action for the human/operator.
