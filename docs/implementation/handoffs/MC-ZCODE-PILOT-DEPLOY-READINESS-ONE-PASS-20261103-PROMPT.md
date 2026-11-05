# MC-ZCODE-PILOT-DEPLOY-READINESS-20261103 — one-pass remediation

Status: READY_NOT_DISPATCHED. Preparing this file is not execution. Human delivery of this
assignment to actual ZCode authorizes the local implementation/testing described below.

## 0. Exact branch contract — mandatory

| Purpose | Exact branch/ref | Permission |
|---|---|---|
| Base to branch from | `origin/main` | Read; verified at `048776b3862ab384ab4e42356c46c0a320a93488` during preparation |
| Your implementation branch | `codex/pilot-deploy-readiness-20261103` | The ONLY branch for this assignment's source changes |
| Future PR/merge destination | `main` | Target only; no direct writes, merge or push authorized by this prompt |
| Six-report input checkout | `docs-codebase-review-main` in `sunstar` | Read only; NOT the implementation branch despite its name |
| Coordination/archive | `codex/unified-project-flow` | Read only; preserve in-flight source and all uncommitted files |
| Historical curated import | `codex/main-release-preparation` | Read only; do not continue new implementation here |

Exact implementation worktree:
`/private/tmp/mc-zcode-pilot-deploy-readiness-20261103`.

Repository used ONLY to inspect refs and create the new worktree:
`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.

After checking that the branch and destination do not already exist, create the worktree:

```sh
rtk git -C /Users/nguyenvanlan/Documents/code/pet-projects/matter-control worktree add -b codex/pilot-deploy-readiness-20261103 /private/tmp/mc-zcode-pilot-deploy-readiness-20261103 origin/main
rtk git -C /private/tmp/mc-zcode-pilot-deploy-readiness-20261103 branch --show-current
rtk git -C /private/tmp/mc-zcode-pilot-deploy-readiness-20261103 rev-parse HEAD
rtk git -C /private/tmp/mc-zcode-pilot-deploy-readiness-20261103 status --short
```

The branch output MUST be `codex/pilot-deploy-readiness-20261103`. All source/config/test/doc
edits and builds run in that worktree. Reading the prompt from the coordination checkout does
not authorize writing source there. Before edits and before final return, verify the branch
again and report the actual base SHA. Do not implement on `sunstar`/`docs-codebase-review-main`,
`codex/unified-project-flow`, `codex/main-release-preparation`, or directly on `main`.

If the exact worktree/branch already belongs to this assignment, verify its checkpoint and
resume it. If it belongs to other work, preserve it and report the exact collision; do not delete,
reset, rename it or silently choose a different branch. If `origin/main` advances, follow the
baseline reconciliation rule in section 2 while keeping this exact implementation branch name.

## 1. Assignment and finish condition

You are actual ZCode, the implementation owner for this bounded assignment. Read all inputs,
verify the current source, implement the smallest complete corrections, run the applicable
checks, fix failures introduced by your changes, and deliver ONE consolidated local candidate.
Continue through all packages below in the same assignment. Do not stop after intake, a plan,
one file, one package, or a request to continue. Checkpoint as needed and resume from it.

The objective is an executable, locally verified deployment preparation for the existing
Workers → Cloud Run → Supabase/private R2/ZITADEL topology. It is NOT a new application, a
platform migration, an actual cloud deployment, or a promise that every provider gate is closed.

Owner: actual ZCode. Priority P1. Requirement references: ADR-006, existing ADR-007 profile
compatibility, B1/PI-02 role isolation, approved application auth/receipt/CAS semantics, and
the source-backed A/F/C/R findings mapped below. Review after your return belongs to an actual
non-author reviewer routed by Codex; do not claim independent acceptance of your own fixes.

## 2. Repository routing — do this before editing

The six review inputs are at:
`/Users/nguyenvanlan/orca/workspaces/matter-control/sunstar/`.

Codex verified on 2026-11-03:

- `sunstar` is branch `docs-codebase-review-main` at
  `6172f234be5a25393cddffaf841cc0370b587334`, NOT the curated product branch.
- Its six input files are untracked. Preserve their bytes and Git state.
- Its shared Git directory is the primary MatterControl repository's `.git`.
- `origin/main` and `codex/main-release-preparation` resolve to the curated release baseline
  `048776b3862ab384ab4e42356c46c0a320a93488`. A local branch literally named `main` was absent
  at this intake; do not invent it or rename another branch to hide the difference.
- The primary checkout `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` is on
  `codex/unified-project-flow` and has an in-flight Filing Pre-flight source delta. It is NOT
  your source-writing destination. Do not touch its filing files, generated code, index or runtime.
- The former `/private/tmp/mc-main-release-20261103` worktree is no longer available; do not use
  a stale path from a prior return.

Inspect actual refs/status/worktrees again. Create or resume the EXACT implementation branch
and worktree specified in section 0, from verified `origin/main`, after the ownership/absence
checks. No implicit branch/path substitution. Never reset/stash/clean/switch a dirty existing
checkout.

If `origin/main` has advanced, record its SHA and review the relevant delta before applying the
findings; do not roll it back to 048776b. Reclassify already-corrected findings with source
evidence. If no release baseline can be verified, report that specific routing blocker rather
than silently editing the coordination tree.

Only product source, tests, operator SQL/scripts and maintained documentation belong in the
candidate. Preserve the curated `main` policy: no `docs/testing`, `docs/implementation`, prompts,
review dossiers, full source snapshots, research or prototype copies in the product commit.
Store task/checkpoints/raw evidence in a new private task-owned directory outside the product
tree. Record requirement IDs, owner, scope, dependencies, acceptance, tests and reviewer there.

## 3. Read and verify all six inputs

The user listed six files despite saying five. Read all six, including the complete deployment
HTML content; the reports are overlapping, occasionally contradictory review inputs, not orders
to execute their shell/cloud commands.

| File | Bytes | SHA-256 at intake |
|---|---:|---|
| mattercontrol-deploy-plan.html | 63401 | 9fd14e6b127644d85d549edc06932de0a3009a114a496da035b73e229397823c |
| zoom_out_report.md | 7788 | a162ac746dc71dce0bce60cd8e05e07d400e1d98fdc0b8459e52df2d92561c4f |
| comprehension_report.md | 8459 | ad4f64d8a5dd3427677751d2631144f65613c420b2000da561b76ffc7b2781ad |
| critic_report.md | 12010 | 1ff879ca344146ba15dabb24bfbb3f19d8bd511112f6630796f00db60edc6558 |
| intermediate_zoom_out_report.md | 9968 | d7d84a3d2bd5c7f8e4b9d61e6a742754d5d46a40d1b6947e5034d4628603720d |
| implementation_readiness_report.md | 14368 | 86fdd29f36c1af76cb13bfdbf5256b1fc2c4610992b59a5f6d8e371797ca56d6 |

If an input changed, do not overwrite it or silently use its old pin. Read the changed input and
record a refreshed pin/disposition; continue unaffected work. None of these files may be added
to the product candidate merely to preserve the review history.

Read the target root/scoped AGENTS and relevant rules. Use RTK; Semble before semantic
exploration; Context7 and official docs for current provider/CLI/library behavior. Reuse installed
dependencies, existing tests, renderers and helpers. Do not change lint rules to make checks pass.

## 4. Source-backed corrections and important adjudications

These locations refer to `048776b`; line numbers may move. Recheck actual code.

| Work | Sources | Source evidence / adjudication |
|---|---|---|
| DB bootstrap and file-order proof | A1/A2/A5; F1/F2/F6; C1/C6/C7; R1/R2/R3 | `b1-roles.sql:69` grants on not-yet-created tables; the runbook sets passwords after migrate; Go test applies a different split/order and injects DSN search_path. |
| Search under runtime authority | A4/A7; C4; R11/R24 | `mc_search_key_v1(text)` is used in queries but PUBLIC EXECUTE is revoked and runtime has no explicit function grant. Templates/renderer have no cursor-key injection. Core intentionally permits Search to be unconfigured; keep that compatibility. |
| Auth/transport/runtime bindings | A3/A9/A10; C5/C9; R4/R12 | Worker OIDC config requires missing vars. Cloud Run ingress `all` is not an invoker permission. Go/BFF TLS must be qualified separately. |
| Operational correctness | A8/A11; C8/C11/C13; R5/R6/R10/R18 | Backup schema option is unused; whole-database dump is wrong for managed schemas. Key-ring retention, URL encoding, secret rotation, connection budgets and rollback claims need correction. |
| Operator procedure and smoke truth | F3/F5/F8/F10/F11; comprehension 2–22; C2/C3/C14–26; Z1–6; R7–9/R13–32 | One runbook, unique decision identities, usable commands and actual application expectations; no duplicated deployment manual. |

Do NOT blindly adopt these report suggestions:

- Do not ignore SQL errors or remove `ON_ERROR_STOP` to get past bootstrap. Partial psql success
  is not a successful ordered sequence. Autocommit explains partial persistence; it does not fix it.
- Do not weaken TLS to `require`, disable certificate/hostname verification, or change topology
  merely because the laptop probe passes/fails. Local tests are not actual Supavisor/workerd proof.
- Do not guess a different audience after any 401. A 401 can also mean expired/inactive token,
  issuer mismatch or other authentication failure. Keep exact audience validation and tokens sealed.
- Do not take a reviewer recommendation to use Workers Paid as PO approval. No paid plan,
  automatic cloud action, public IAM mutation or residency exception is authorized here.
- Do not assume a 200 pooler-client cap proves all session-mode/DB connections fit. Workers do
  not have App Hosting's `20 × 2 instances` bound. Check actual pool/role/server budgets later.
- The local same-issuer directory approval does not authorize production or pilot discovery.
  Self-registration alone is not the exposure boundary: the product directory lists explicitly
  provisioned product users. Keep the feature flag off unless separately approved for that environment.
- Do not drop/recreate a Supabase project, discard a database or remove a private key based on
  destructive recovery/teardown lines in the plan. This assignment has no such authorization.
- Do not reduce scope by disabling an already implemented capability without an explicit PO
  choice. Add the missing optional deployment support; retain intentional fail-closed behavior.

## 5. Execute all local packages in one continuous run

### WP1 — Make operator SQL genuinely executable

Primary files: `ops/adr006/db/*`, `ops/adr006/bff-state.sql`, corresponding backend B1 tests and
the canonical pilot runbook.

1. Reproduce the fresh-database first-pass failure with the actual operator SQL, using a NEW
   disposable local fixture and `ON_ERROR_STOP=1`; retain a credential-redacted RED receipt.
2. Separate role/schema/default-privilege bootstrap from post-migration table/function grants.
   Prefer keeping `b1-roles.sql` as bootstrap and adding one clearly named runtime-grants file.
   Bootstrap must contain no unconditional dependency on tables/functions created by migrations.
3. Document/test this exact order: bootstrap → safe role-password setup → migrate as migration
   identity → post-migration product grants → BFF table with correct ownership → BFF/maintenance
   grants → runtime/BFF probes. Re-run the supported SQL phases idempotently.
4. Set the runtime's schema resolution at role/database configuration level so a fresh runtime
   connection without DSN `search_path` resolves the private product schema. Keep test-specific
   schemas working. Verify migrator effective role/path rather than assuming a login-name change
   also applies that role's settings. Do not give runtime owner membership/DDL privileges.
5. Test a constrained NON-superuser bootstrap operator on PostgreSQL 16+ semantics in a separate
   disposable cluster/database: CREATEROLE plus only the documented setup rights, including the
   owner SET/INHERIT rights actually required. Explicitly grant/set only what the bootstrap
   identity needs. No SUPERUSER/BYPASSRLS, PUBLIC grants, blanket owner membership for app roles,
   or mutation of managed Supabase roles. If local SQL can reproduce/fix a missing owner right,
   do so now; actual Supabase policy remains a distinct provider gate.
6. Cover BFF table creation/ownership, owner default privileges, seeding authority and grant
   re-runs under this sequence. Do not special-case away the failures with fixture-only grants.

### WP2 — Replace the misleading B1 proof with actual file-order tests

Read `apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go`. Its existing
Go mirror plus sorted statement equality does NOT prove an operator can run the SQL in order.

- Make integration tests execute the actual checked-in SQL files in the documented order on an
  empty fixture, without sorting/rearranging grants or substituting a successful Go-only profile.
  Reuse existing loading helpers where sound; do not implement a general SQL parser.
- Exercise first application and reapplication, a fresh runtime login without DSN search_path,
  SHOW search_path/current_user/session_user/role/statement_timeout, authorized product CRUD,
  BFF CRUD, bounded maintenance, and the existing DDL/history/receipt/BFF-isolation refusals.
- Test real Search query/service behavior as `mc_runtime`, including EN/VI comparison. Calling
  only the normalization function is insufficient as the entire query also needs table rights.
- Keep existing representative and RLF contract coverage. Fix shared fixtures/mirrors/callers
  affected by splitting the operator files. Preserve runtime/migrator secret separation.
- PostgreSQL CREATEROLE behavior and a stock local cluster are not a Supabase permission proof;
  report those scopes separately. No real provider call is needed to complete WP1/WP2 locally.

### WP3 — Preserve Search and complete optional deployment wiring

- Add the precise EXECUTE grant for `mcapp.mc_search_key_v1(text)` in the POST-migration phase;
  retain PUBLIC revocation and exact least-privilege classes. Keep migrations 0001–0016 intact.
- Add optional `MC_SEARCH_CURSOR_KEY` secret-reference support to the existing deployment
  renderer/templates and examples where applicable; never embed the value. The existing profile
  without that key must remain renderable, with Search honestly unavailable by design.
- Test configured/unconfigured rendering, malformed/unsafe secret references, deterministic
  render output, no raw secret in output/errors, and that runtime query/grants work together.
- Use the same existing feature in every enabled instance; do not generate independent cursor
  keys per instance or change cursor binding/expiration semantics.

### WP4 — Correct deployment bindings, auth documentation and TLS preparation

- Worker: document every required runtime var and secret in one canonical location, matching
  `wrangler.jsonc`, `oidc/config.ts`, env validation and the actual build wrapper. At minimum:
  API_MODE, API_BASE_URL, AUTH_ALLOW_ANONYMOUS, SESSION_COOKIE_SECURE, BFF_STATE_BACKEND,
  APP_ORIGIN, OIDC_ISSUER, OIDC_CLIENT_ID, OIDC_PROJECT_ID, BFF_STATE_KEY_ID; secrets
  BFF_DATABASE_URL/BFF_STATE_KEYS and optional BFF_DATABASE_CA. Include the pending-size ceiling.
- Provide a tested, minimal way to supply non-secret deployment vars without hand-editing tracked
  source after the release SHA is pinned. Use the installed Wrangler's verified supported
  configuration/flag path, or the existing rendering pattern. No new deployment framework.
  Set the exact HTTPS origin and callback registration BEFORE activation; remove the circular
  deploy-then-configure-origin instructions. Validate blank/placeholders and origin mismatches.
- Cloud Run: make the intended public ingress/application-auth boundary operationally explicit.
  Current official documentation supports `run.googleapis.com/invoker-iam-disabled: 'true'`;
  validate whether this is the smallest declarative correction consistent with existing profile
  intent. Document the supported allUsers alternative and applicable organization restrictions.
  This is preparation ONLY: do not apply an IAM change, disable an org policy or expose a service.
- Audience: the BFF requests `urn:zitadel:iam:org:project:id:{projectId}:aud`; document the expected
  resource project audience for that flow, distinct from API-app client_id used to authenticate
  introspection. Fix the misleading verifier comment, operations docs, examples and contract
  references without changing the verifier's strict checks. Add targeted synthetic tests if the
  distinction is not covered. Unknown actual provider values remain inputs, not guessed constants.
- Remove the duplicate MC_OIDC_CACHE_TTL in `.env.example`; retain the approved 30s default and
  an explicit 0s override explanation. Update any affected configuration tests.
- TLS: support/validate the existing verified-full paths. If an optional CA mount/reference is
  needed to make configured pgx sslrootcert paths actually exist in rendered service AND migrate
  templates, implement the smallest optional, backward-compatible support with rendering tests.
  For BFF use the existing CA setting, not a second trust mechanism. Test with a task-owned local
  CA/hostname: trusted succeeds, wrong CA/hostname fails. Never disable rejectUnauthorized.
  Keep laptop, final Go image, Node and local workerd TLS observations distinct; deployed Worker
  → actual Supabase TLS remains NOT_RUN without a separate real-provider authorization.
- Preserve separate migrate/serving identities and fail-closed key validation. `mcapi migrate`
  currently validates nonempty config but does not read the OIDC key or contact the IdP; prove
  that contract locally rather than granting the migration SA unnecessary OIDC-key access.

### WP5 — Repair the existing backup/secret/operator gaps without new infrastructure

- `ops/backup/scheduled-dump.sh` documents MC_BACKUP_SCHEMA but ignores it. Honor a validated,
  explicit schema selection using argv-safe `pg_dump` arguments; choose/document the smallest
  backward-compatible interface. An empty/invalid selection must not silently dump all managed
  schemas. Test that the chosen schema set, not Supabase auth/storage, is in the archive.
- Use a documented login/dump authority that can read the selected objects; NOLOGIN mc_owner
  is not a connection user and mc_runtime cannot read mc_bff. State explicitly whether encrypted
  BFF sessions are included or deliberately excluded with sign-in-after-restore consequences.
  Never imply that a database dump alone backs up R2 objects or encryption keys.
- Test the script using synthetic databases/schema contents and restore to a NEW target; reuse
  existing rehearsal helpers where appropriate. Verify failure exit, archive validity, correct
  retention behavior and no credentials in diagnostics. Do not use a retained application DB.
- Keep pilot backup/cleanup executable from an operator-controlled environment. No new backup
  image, bucket, Cloud Scheduler, Hyperdrive, IaC framework or monitoring service is required.
  Existing `go run ./cmd/mcbffcleanup` is sufficient for a documented manual path. Add that binary
  to the existing image only if the chosen documented image invocation needs it; preserve mcapi
  entrypoint/non-root behavior and test it. Do not schedule or activate maintenance remotely.
- Generate passwords safely for their representation: URL-encode with the client URL API or
  use a documented URL-safe generation method. Do not claim all base64 characters always break
  URLs; prevent actual reserved-character parsing bugs and test round trips with synthetic values.
- Persist the BFF key ring in approved protected operator storage, not terminal output/Git.
  Keep prior key versions during rotation and pending/UNKNOWN attempts; never lose a key by
  replacing the ring with only the new entry. Reuse the existing encryption/rotation code/tests.
- Make secret-version/revision rollback limitations explicit. If references remain `latest`, a
  previous code revision is NOT an exact previous-secret rollback. Document safe password/key
  rotation order or add minimal existing-renderer version pin support if required for a truthful
  reproducible release. Do not create a new secret manager or rotate a real credential.

### WP6 — One canonical runbook and decision packet

Update `docs/deployment/pilot-deploy-runbook.md`, the existing approval packet, ops READMEs and
necessary configuration/contract references. No second full deployment manual in HTML.

- Deduplicate findings into three tiers: first-deploy blockers, sustained-operation requirements,
  feature-scope/operator choices. Give each a verified status, owner/type, exact source, test and
  closure condition. Map EVERY A/F/C/Z/R/comprehension item to a fix, a deduplicated parent,
  corrected assertion, or an explicitly pending provider/PO item. Do not silently drop reports.
- Reuse/namespace the existing ADR007 decision IDs accurately. Its D3 is VM region and D4 VM
  TLS, not the runbook's residency/rate-limit shorthand. Give pilot-only choices stable distinct
  names, options/recommendation, needed-by step and actual approval status. Do not invent approvals.
- Preserve selected default topology and all release boundaries. Workers Free versus Paid,
  billing exposure, workload limits, residency, actual IdP instance/MFA and pilot people-directory
  activation remain concrete PO/provider choices. Do not ask for approval of each source file
  or block local work while waiting for these external choices.
- Correct the Workers/DB budget: distinguish pooler CLIENT slots, per-role session pool SERVER
  connections, database max_connections, backend pools, overlapping revisions and Workers BFF
  fan-out. No fictitious Worker instance cap or claim that 102 < 200 alone establishes safety.
  Do not add new pool flags/Hyperdrive by default; identify the actual qualification evidence.
- Use explicit MC_SRC/OUT/IMAGE/API_URL variables and phase-produced inputs; no out-* glob cd,
  undefined variables, literal ellipses in executable DSNs, or hidden assumptions about shell/cwd.
  Show where values are safely persisted/reloaded, secret versus non-secret inputs and required
  tool versions. Use verified CLI help/current docs for commands; label unexecuted provider steps.
- Define a stop/recovery condition for each provider phase, including FIRST-release failure with
  no previous revision/dump. Prefer retained-state diagnosis and forward fixes; destructive
  recreate/teardown requires a separate explicit approval of the exact resource.
- Do not promise secure erasure from rm -P/shred on SSDs. Do not automatically delete/revoke an
  existing key; document operator custody, protected storage and separately authorized cleanup.
- Remove public `/readyz` keep-alive assumptions. Use platform probes and documented provider
  availability/manual resume behavior; scale-to-zero is cold start, not a reliable API outage.
  No automatic scheduler/paid upgrade or hidden change to the $0 objective.
- Keep the six original review files immutable/untracked. A concise disposition outside the
  product tree may link the corrected runbook at candidate SHA. Do not edit old evidence into PASS.

### WP7 — Make smoke expectations match source and write a bounded qualification handoff

Implement local synthetic checks where possible and prepare the actual-provider cases with
precise inputs, prerequisites, expected results and artifact labels:

- Login without a deep target lands on `/my-actions`, not `/workspaces`. Logout destroys the
  BFF session and redirects to `/login?signedOut=1`; no `/logged-out` route is promised.
- A → workspace/Matter → B grant → B access → C hidden denial → revoke B/read again. Uniform
  hidden-resource response is 404; do not accept arbitrary 403/404. Active role denial is separate.
  Membership checks apply on new requests; issuer revocation has the configured cache window.
- Distinguish expired/invalid token, audience/issuer mismatch, IdP unavailable, missing product
  identity and missing membership. Do not extract sealed bearer tokens, add debug token routes
  or weaken checks to settle the audience. Use synthetic introspection responses locally and
  a separately authorized real identity flow for provider acceptance.
- Create work, restart/persist, and prove completion does not itself perform independent proof
  acceptance, using a fixture with the relevant proof requirements declared.
- Upload/download exact 1 MiB and 25 MiB synthetic objects and compare bytes when the test path
  supports it; also test oversize/origin denial. Derive duplicate-upload behavior from code,
  not the plan's unverified “already stored” text. Do not equate local S3 with real R2 SigV4.
- Search EN/VI under runtime grants and authorized scope; private/nonmember results stay hidden.
- Durable session refresh/same-origin redeploy and retained key ring; unknown writes stay unknown
  until reconciled. Old Server Action builds and `urn:mc:ui-session-changed` are different cases;
  do not assert one blanket 409. Trace actual code/build behavior and specify honest recovery.
- Local controlled unavailable injection must operate only on your own fixture/process. Do not
  stop a shared API or change live Cloud Run traffic to simulate an outage.
- Real Worker CPU/memory/body, Supavisor GUC/TLS, IAM denial, ZITADEL users, R2 and browser
  journeys remain NOT_RUN unless separately authorized and actually observed. Bundle dry-run
  size is not CPU qualification. Do not change a paid plan merely to make the gate pass.

## 6. Verification and completion gates

Use NEW task-owned synthetic fixtures with identity/port/label/resource limits and private random
credentials. Stop your fixtures on completion and retain evidence; no global prune, no existing
DB/volume changes. Password-bearing env/DSNs/raw logs stay private and out of process argv/output
where practical. Do not use shared node_modules symlinks that can relink another checkout.

Run appropriate local gates on FINAL candidate bytes:

1. Targeted RED→GREEN tests for bootstrap ordering, role search_path, runtime Search, renderer
   wiring and schema-selective backup. A skipped PG test is not a pass.
2. Backend `make check` WITH disposable PostgreSQL, race enabled. Prove the actual operator-file
   sequence with both superuser fixture setup and constrained bootstrap identity; record versions.
3. `node --test ops/deploy/profiles.test.mjs`, new script checks, actual YAML parsing/render
   invariants; migration and runtime identities remain distinct and inputs fail closed.
4. Frontend `pnpm check` if changed; `pnpm build:worker` and release preflight on the actual
   `.open-next` output because Worker deployment behavior is in scope. Build Node/webpack and
   relevant durable BFF PG tests if affected; use existing rules to choose additional tests.
5. Local image build/run or static/binary proof appropriate to Dockerfile/CA changes, without
   pushing an image. Record exactly whether final image TLS was executed or only prepared.
6. Check maintained links/commands/variable names, whitespace, secret-pattern findings with
   real versus deliberate synthetic-fixture classification, final source drift and allowed paths.

Do not rerun unrelated suites endlessly. Once appropriate checks pass, finish the candidate.
If a tool/provider is unavailable, record the exact error and use the existing authorized local
alternative. Continue independent packages. Return one consolidated report rather than stopping
for “continue?” after every gate. Never bypass a tool permission/Mimosa/invalid-signature refusal.

## 7. Permissions, output and final return

AUTHORIZED: isolated local source/docs/test changes, task-owned local fixtures/builds, public
documentation reads, and preparation of a reviewable candidate. This prompt does NOT authorize
commit, merge, push, real-provider authentication/API probes, secret reads/rotation, IAM changes,
cloud resource creation/deletion, public ingress activation, paid services, or deployment.
Earlier environment-specific approvals must not be generalized. Do not send internal payloads
to another provider, post messages, or start other external agents under this prompt.

Deliver:

1. Actual identity/tool/model; source and isolated branch/base/head; six input hash results.
2. One implementation diff covering all applicable local packages, with no unrelated Pre-flight
   edits or reintroduction of coordination dossiers into curated main.
3. Finding disposition table covering ALL six inputs, with source/test evidence and corrected
   report assertions clearly separated from actual code fixes.
4. Test/command/exit/UTC receipts for final source, fixture/resource disposition and hashes.
5. A SHORT operator/PO queue: exactly what remains external, which input or decision is missing,
   next command/action and success criterion. Separate “source candidate complete” from “actual
   cloud qualification complete”; author verification is not independent review.
6. Proposed status `LOCAL_CANDIDATE / IN_REVIEW_WITH_VERIFICATION_BLOCKERS` once local work is
   complete; otherwise name the exact unfinished local defect. No DONE/DEPLOYED/production-ready
   or $0 claim. End with skipped checks and remaining risks.

## 8. Official documentation checked by Codex (2026-11-03; recheck when executing)

- Cloud Run public access/IAM: https://docs.cloud.google.com/run/docs/authenticating/public
- ZITADEL audience scopes: https://zitadel.com/docs/guides/integrate/retrieve-user-roles
  and https://zitadel.com/docs/apis/openidoauth/scopes
- Supabase connection modes/custom-role usernames: https://supabase.com/docs/guides/database/connecting-to-postgres
- Supabase per-role pool sizing: https://supabase.com/docs/guides/database/connection-management
- PostgreSQL role membership: https://www.postgresql.org/docs/17/sql-createrole.html
  and https://www.postgresql.org/docs/17/sql-grant.html
- Worker limits/CPU versus network wait: https://developers.cloudflare.com/workers/platform/limits/

These sources clarify semantics; they do not establish the actual accounts, organization policy,
certificates, limits or approvals for this pilot. Do not replace real qualification with citations.
