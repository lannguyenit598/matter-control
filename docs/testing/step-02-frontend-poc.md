# MC-002-FE — Frontend Technical Owner PoC Validation Report

**Task ID:** MC-002-FE (Priority P0)  
**Agent Identity:** Antigravity (Frontend Technical Owner)  
**Model & Thinking:** Gemini 3.8 Flash (High) (CLI slug `gemini-3.8-flash-high`, effort high)  
**Runtime Task Status:** `PO_C_EXECUTED` (Proposed Status: `IN_REVIEW`)  
**Reviewer:** OpenCode  
**Date / Timestamp:** 2026-10-24 Asia/Ho_Chi_Minh  

Codex PM evidence corrigendum following actual OpenCode FE-VERIFY-01..07. Original owner report/logs are preserved in the exact review packet under docs/testing/step-02-frontend-intake/. No test rerun or source change occurred. Runtime tool/model/Node details absent from raw logs remain owner-reported; missing historical metadata is not invented.

---

## 1. Governance & Source Provenance

- **Governance Repository:** `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`
- **Governance Branch / Base:** `task/MC-002-solution-architecture` (continuation base `2000d9435a7a3d405cb89e92ea72610f09b1f1cf`, current HEAD `4a6b8f9c0b50a81930cb2edc0806c57dbda8cd99`)
- **Authority:** `docs/ai-sdlc/step-02-1-request.md`, `docs/ai-sdlc/step-02-local-approval.md` (DEC-023 H5 local approved, DEC-024 W1 local targets approved, DEC-025 ARCH-Q3/Q5 accepted), `docs/implementation/tasks/MC-002.md`, `docs/implementation/handoffs/MC-002-ANTIGRAVITY-PROMPT.md`
- **Source Template Repository:** `https://github.com/lannguyenit598/nextjs-atomic-starter`
- **Pinned Commit SHA:** `3e5a642479acb789eb210e73fba956f3e85082e3`
- **Read-Only Base Snapshot:** `/tmp/mattercontrol-step02-frontend` (verified clean, origin matched, HEAD matched, preserved read-only)
- **Isolated Worktree:** `/tmp/mattercontrol-step021-frontend` on branch `task/MC-002-fe-poc` at `3e5a642479acb789eb210e73fba956f3e85082e3` (verified unused prior to creation; created cleanly via `git worktree add -b task/MC-002-fe-poc`)
- **Runtime Environment:** macOS (Darwin 24.6.0 arm64), Node.js `v24.22.1`, pnpm `12.11.2`, rtk `1.0.1`

---

## 2. Technical PoC Execution Matrix (P-FE-1 Baseline)

All commands were executed using `rtk proxy` prefixes, with `set -o pipefail` enforced to ensure pipeline exit codes are never masked by `tee`. Raw command outputs are preserved in `docs/testing/step-02-frontend-poc/`. UTC/exit metadata for logs01..08 and10 are owner-manifest assertions, not captured in those nine raw files. Logs09/11 contain wrapper UTC/exit markers; their exit0 does not assert cleanup, binding or all content criteria.

| Step | Operation | Exact Command | UTC Start / End | Exit Code | Status | Log Artifact & SHA-256 |
|---|---|---|---|---|---|---|
| **1** | Dependency Installation | `rtk proxy pnpm --dir /tmp/mattercontrol-step021-frontend install --frozen-lockfile` | `2026-10-24T14:50:09Z` / `14:50:11Z` | `0` | **PASS** | `01-pnpm-install.log`<br>`28e686f3fe48e2f01bd89b37827eabbbfae698866c12f8117b565fda27bec893` |
| **2.1** | Static Typecheck | `rtk proxy pnpm --dir /tmp/mattercontrol-step021-frontend typecheck` | `2026-10-24T14:50:45Z` / `14:50:48Z` | `0` | **PASS** | `02-typecheck.log`<br>`99d7c2179cdd316467c51f37901025a0753453664d741214ba56fc631fa6c0bc` |
| **2.2** | ESLint Code Quality | `rtk proxy pnpm --dir /tmp/mattercontrol-step021-frontend lint` | `2026-10-24T14:50:54Z` / `14:51:11Z` | `0` | **PASS** | `03-lint.log`<br>`050c69da23536758722729aeda55a8d0fb9d557495ef6d33d70873a3b64a71c1` |
| **2.3** | Prettier Formatting Check | `rtk proxy pnpm --dir /tmp/mattercontrol-step021-frontend format:check` | `2026-10-24T14:51:51Z` / `14:51:52Z` | `0` | **PASS** | `04-format-check.log`<br>`1d66faad74f5e8709353f7288592866bd3a9095da1174a916e7aa632949971e2` |
| **2.4** | Vitest Unit/Component Tests | `rtk proxy pnpm --dir /tmp/mattercontrol-step021-frontend test` | `2026-10-24T14:52:52Z` / `14:52:56Z` | `0` | **PASS** | `05-test.log`<br>`9ff92dd7720a3c5ef17681d9227ffb22bb0172536c979f45359eee43ff6df8f2` |
| **2.5** | Agent Rules Check | `rtk proxy pnpm --dir /tmp/mattercontrol-step021-frontend agents:check` | `2026-10-24T14:53:19Z` / `14:53:19Z` | `0` | **PASS** | `06-agents-check.log`<br>`491f4a4bdb8b7c87f65de72867b64bd78362251e44fd47fd1a1b8693e757950c` |
| **2.6** | Production Next.js Build | `rtk proxy pnpm --dir /tmp/mattercontrol-step021-frontend build` | `2026-10-24T14:53:31Z` / `14:53:37Z` | `0` | **PASS** | `07-build.log`<br>`44054c0d7c514e2a12e58262cb0dc8e4a54bf767eb5ddc7aa5c0594d3fc534d6` |
| **2.7** | Storybook Build | `rtk proxy pnpm --dir /tmp/mattercontrol-step021-frontend build-storybook` | `2026-10-24T14:53:44Z` / `14:53:55Z` | `0` | **PASS** | `08-build-storybook.log`<br>`d32d63a9631e830cc227b0cbcafaddd0b519554fdcf280c55ef1d442e54392a8` |
| **3** | Production Startup & Routes | Production start on port 3088 & restarted on port 3089 (`API_MODE=demo`, `AUTH_ALLOW_ANONYMOUS=false`) | `2026-10-24T14:55:08Z` / `14:55:14Z` | `0` | **PASS** | `09-production-start.log`<br>`acf6b215d2210489f247f060852a0c71ec110930d433f9ae1911e39e8aac0396` |
| **4** | Playwright E2E Tests | `CI=true PORT=3095 rtk proxy pnpm --dir /tmp/mattercontrol-step021-frontend test:e2e` | `2026-10-24T14:56:52Z` / `14:57:06Z` | `0` | **PASS** | `10-playwright.log`<br>`73f53f4f97065e661c8f8c79ca33746a9cdccce174ecfbdceb7ee1941d32692c` |
| **5** | REST Fail-Closed Verification | Production start on port 3096 (`API_MODE=rest`, `API_BASE_URL=http://127.0.0.1:8080`, `AUTH_ALLOW_ANONYMOUS=false`) | `2026-10-24T14:57:56Z` / `14:57:58Z` | `0` | **PASS** | `11-rest-negative.log`<br>`3bb6a567efb66b4ec2d8f7d6ec7d33bb9584707a3e763de59267529cf40cb23b` |

---

## 3. Detailed Results & Lifecycle Inspections

### 3.1. Dependency Lifecycle & Lockfile Integrity (Step 1)
- `pnpm install --frozen-lockfile` completed cleanly in 2.1s.
- `package.json` lifecycle hook `prepare: husky` was executed.
- Lockfile `pnpm-lock.yaml` diff: **0 lines changed** (strictly preserved).
- Git tracked working tree diff: **0 files changed**.
- Filesystem writes: Installation wrote local dependencies into `node_modules` (544 packages;668MB is an owner-reported external measurement absent from the raw logs) from pnpm content-addressable store. The earlier assertion of "zero dependency writes" is rejected as physically inaccurate for package installation; the correct standard is frozen lockfile and zero Git tracked modifications.

### 3.2. Static Quality, Tests, and Build Verifications (Step 2)
- **Typecheck:** Next.js route typegen and `tsc --noEmit` exited 0.
- **Lint:** ESLint 9.39.5 exited 0 with 0 errors and 0 warnings.
- **Format:** Prettier 3.9.10 verified all matched files follow formatting standards.
- **Unit & Component Tests:** Vitest 5.0.5 executed 18 test files, **99 tests passed (100%)**, 0 failures in 3.05s.
- **Agent Config Rules:** `sync-agent-config.mjs --check` verified 17 skills and 3 scoped rules.
- **Next.js Production Build:** Next.js 16.4.2 compiled successfully in 2.5s using Turbopack with `cacheComponents: true` and `partialPrefetching: true`. Prerendered static pages (`/_not-found`) and Partial Prerendering pages (`/dashboard`, `/tasks`) generated without error.
- **Storybook Build:** Vite/Rolldown completed Storybook10.6.2 static assets in1.41s. Log08 retains `No story files found for the specified pattern: src/**/*.mdx`, module-level use-client directive warnings and a telemetry notice; this is a successful build with warnings, not an interaction/accessibility certification.

### 3.3. Production Startup, Route Exercise, and Lifecycle Control (Step 3)
- Observed production server execution using `API_MODE=demo` and `AUTH_ALLOW_ANONYMOUS=false`; lifecycle/binding limitations below prevent a blanket clean-shutdown claim:
  - Verified port3088 was unused; launch omitted an explicit loopback hostname. Loopback confinement was not established.
  - Started `next start -p 3088`. Readiness loop reported2 iterations; no subsecond readiness measurement was retained.
  - **`GET /`**: Returned `HTTP/1.1 307 Temporary Redirect` to `/dashboard`.
  - **`GET /dashboard`**: Returned `HTTP/1.1 200 OK` with full security headers (`Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Permissions-Policy`, `Referrer-Policy: strict-origin-when-cross-origin`) and partial prerender streaming header `x-nextjs-prerender: 1`.
  - **`GET /tasks`**: Returned `HTTP/1.1 200 OK` with task table.
  - **`GET /nonexistent-path-for-test-404`**: Returned `HTTP/1.1 404 Not Found` with custom not-found template.
  - Sent kill to the recorded wrapper PID; raw09 then warns port3088 remained occupied. Historical graceful child-process shutdown is not established.
  - Started a second server on3089 and observed dashboard200; after wrapper kill, raw09 warns port3089 remained occupied. This is not a same-port restart or verified graceful cleanup. Codex host check at15:05:01UTC later found neither listener; it does not prove the earlier shutdown mechanism.
- *Boundary Note:* Demo mode success demonstrates template runtime integrity under local Node.js; it does **not** prove Go connectivity or PostgreSQL persistence.

### 3.4. Playwright End-to-End Validation (Step 4)
- Verified unused loopback port 3095.
- Executed `playwright test` with `CI=true PORT=3095`.
- Existing Chromium cache/version1248 was owner-reported outside the retained log; raw10 does not attest the executable identity.
- Raw10 reports9 tests using1worker; spec-file names/browser details are owner-reported and source-configuration context, not enumerated in that log.
- **All 9 tests passed (100%)** in 13.7s.
- Codex later found no listener on3095 at15:05:01UTC. Raw10 does not itself record listener cleanup.

### 3.5. REST Fail-Closed Security Verification (Step 5)
- Verified port3096 was unused; the launch omitted explicit loopback binding and its server banner advertises LAN192.168.1.59. Future starts must bind127.0.0.1 explicitly and capture actual listener addresses.
- Started production server under `API_MODE=rest`, `API_BASE_URL=http://127.0.0.1:8080`, and `AUTH_ALLOW_ANONYMOUS=false`.
- **`GET /dashboard`**: Server evaluated dynamic session boundary, invoked `resolveSession()` which returned `null`, and rendered the fail-closed `<EmptyState>`:
  - Title: `"Sign-in required"`
  - Description: `"You need to be signed in to see this page."`
  - Fail-closed content and the expected auth warning were observed. No runtime backend spy/request counter or complete leakage test was retained; zero actual outbound requests or zero leakage is not claimed. Source gates requireSession before dispatch and backend.test.ts asserts a mocked fetch is not called without a session; that is distinct unit/source evidence.
- **`GET /tasks`**: Rendered identical fail-closed `<EmptyState>` (`"Sign-in required"`).
- **Server Log:** Emitted expected warning: `[auth] No authentication provider configured: all REST data access is denied. Implement resolveSession() in src/lib/auth-provider.ts.`
- Sent kill to the recorded wrapper PID; raw11 warns port3096 remained occupied. Later host check found no listener at15:05:01UTC. Historical graceful stop is not established.

---

## 4. Formal Corrections to Unsupported Audit Claims

In accordance with task instructions, the following claims from the earlier supplied-source audit (`docs/reviews/step-02-1-antigravity-result.md`) are formally corrected:

1. **Unsupported SSR CPU Measurement:**
   - *Previous claim:* "Workers Free provides 10 ms CPU per request. Standard SSR with session handling and complex React 19 component trees typically consumes 10–20 ms CPU, risking Cloudflare Error 1102."
   - *Correction:* This was an unmeasured assertion based on generic documentation notes. No empirical CPU profiling was performed on this template or its routes under Cloudflare Workers. Cloudflare adapter candidate remains untested and unmeasured.
2. **Unsupported Identifier Regex Incompatibility:**
   - *Previous claim:* "URL paths restricted by `taskIdSchema` (`^[A-Za-z0-9_-]{1,100}$`). Domain IDs depend on backend UUID/int representations. Validation Hazard. Incompatible ID representations will abort at the frontend boundary."
   - *Correction:* Regex `^[A-Za-z0-9_-]{1,100}$` permits standard UUIDs (such as RFC 9562 UUIDv7 or UUIDv4, e.g. `0192e23b-6e9f-7b71-91ea-42b7e199db1c`), integer IDs, and alphanumeric slugs up to 100 characters. The regex alone does not prove an identifier representation mismatch. The real mismatch is domain semantics (`/tasks` vs `/api/v1/users`).
3. **Overstated Static Export Impossibility & Secret Leakage:**
   - *Previous claim:* "Static Export Fallback (F3): Running `output: 'export'` breaks Next.js Server Actions, server-side session resolution, PPR, and `backendRequest()`. It would force moving authentication tokens and backend access into client-side code, violating the secure server-secret boundary."
   - *Correction:* While static export cannot run the existing Server Actions or server-only `backendRequest()` unchanged, a static SPA architecture does not *inherently* require leaking server secrets or shared tokens. With proper architectural redesign (e.g., OIDC Authorization Code + PKCE, in-memory short-lived tokens, strict CSP without unsafe-inline, and exact CORS allowlisting as documented in Security Architecture §6.1), client-side auth can be designed securely without shared API secrets. However, such redesign would require formal PO approval and security review, which has not occurred.
4. **Rejection of Unsafe `rm -rf` and Shallow Clone Recipe:**
   - *Previous advice:* Section 9 proposed executing `rm -rf` on the target directory followed by `git clone --depth 1` and checking out a SHA.
   - *Correction:* `rm -rf` is unsafe and risks destroying concurrent work. Pinned sources must not be fetched as latest; instead, isolated git worktrees at exact pinned commit SHAs without deleting existing paths must be used, aborting if the target exists.
5. **Correction of Zero Dependency Writes Claim:**
   - *Previous claim:* "Zero local dependencies or lockfile updates may be written."
   - *Correction:* Inaccurate assertion. `pnpm install` necessarily writes local dependencies to `node_modules` (544 packages, 668MB). The correct guarantee is that the lockfile is respected without mutation (`--frozen-lockfile`) and git tracked files remain clean.
6. **Rejection of Shell Pipelines Hiding Exit Codes:**
   - *Correction:* In shell commands piping into `tee`, `set -o pipefail` must be enforced so any failing command in the pipeline triggers a non-zero exit code.

---

## 5. Local Node Runtime vs. Cloudflare Candidate Assessment (ADR-003)

| Target / Candidate | Evaluated Technology | Compatibility & Evidence Status | Findings & Limitations |
|---|---|---|---|
| **Local Node Runtime** (Approved H5 scope) | Node.js 24.22.1, Next.js 16.4.2, React 19.3.1 | **LOCAL_FUNCTIONAL_OUTPUTS_SUPPORTED / EVIDENCE_LIMITATIONS** | Build,99unit/9E2E summaries, Storybook completion and route/REST-negative content are supported. Owner-asserted metadata, shutdown, bind scope, warning and runtime-network limitations above remain explicit. |
| **F1: vinext on Workers** | Vite-based Next.js reimplementation | **UNTESTED / NOT_RUN** | Not installed. Compatibility with Next 16.4.2 `cacheComponents: true`, `partialPrefetching: true`, and `connection()` is unverified. Worker CPU limits remain unmeasured. |
| **F2: OpenNext on Workers** | `@opennextjs/cloudflare` | **UNTESTED / NOT_RUN** | Not installed. Experimental PPR and `"use cache"` compatibility under Cloudflare Workers execution constraints remain unverified. |
| **F3: Static Export SPA** | `output: 'export'` on Pages / Workers Static | **BLOCKED / REDESIGN REQUIRED** | Incompatible with template's existing Server Actions, server-side session resolution, and PPR. Requires deliberate architectural redesign and security review per Security Architecture §6.1. |
| **F4: Co-hosted Node Server** | Node.js container co-hosted with Go backend | **LOCAL_NODE_SUPPORTED / COHOST_UNTESTED** | Local native Node output is supported. A co-hosted container/topology, provider, deployment and any required exception remain untested/unapproved; local success does not establish them. |

---

## 6. Concrete Contract Seam & Integration Blockers

1. **Domain Incoherence:**
   - The frontend template models a Task tracking domain: `/tasks`, `/tasks/stats`, `/tasks/:id` with envelope `{ items: Task[], total, page, pageSize }`.
   - The Go backend template (`go-hexa-template`) exposes only `/api/v1/users` and has zero task or matter endpoints.
   - Any attempt to alias user endpoints into task structures or invent an unauthorized bridge violates governance rules.
2. **Missing Authentication Middleware in Go Backend:**
   - Frontend in REST mode forwards Bearer tokens to the backend.
   - Go backend inbound HTTP adapter explicitly has no authentication middleware (`internal/adapter/inbound/httpapi/server.go:34`).
3. **Integration Gate:**
   - Full Next.js → Go → PostgreSQL integration must remain blocked until:
     1. Both owners (Antigravity and ZCode) achieve passing isolated PoCs.
     2. A minimal compatible contract and auth seam are formally specified and approved by Claude Code / Codex.

---

## 7. Delivery & Proposed Status

- **Changed Files in Governance Repo:**
  - `docs/testing/step-02-frontend-poc/manifest.json` (created)
  - `docs/testing/step-02-frontend-poc/*.log` (11 raw execution logs created)
  - `docs/testing/step-02-frontend-poc.md` (created)
  - `docs/architecture/frontend-audit.md` (updated)
- **Source Repositories Status:**
  - `/tmp/mattercontrol-step02-frontend`: Clean, unchanged, read-only.
  - `/tmp/mattercontrol-step021-frontend`: Clean, 0 git diff, isolated worktree.
- **Proposed Task Status:** **`IN_REVIEW`** (Independent review assigned to OpenCode).
- **Step 02 Gate:** MC-002 remains open; Step 02 is **NOT PASSED / NOT DONE**; Step 03 is **NOT STARTED**.


## 8. Evidence limitations and future methodology

Actual OpenCode review: CHANGES_REQUIRED for documentary corrections, no PoC rerun required;99unit and9E2E/build outputs stand. The numbered corrections above distinguish owner-reported metadata from in-log observations. All original11 log bytes/hashes are unchanged. Raw09 start14:55:08Z and raw11 start14:57:56Z now govern the corrected manifest. Reported exit0 values are retained with explicit provenance, not promoted to complete assertions. Lint output contains only the command banner; claimed exit0/no warnings remains owner-reported.

Future bounded smoke runs must capture UTC start/end and actual command/criterion exits inside the log; assert expected HTTP status and content (missing content must fail), explicitly bind127.0.0.1 and capture lsof bind addresses, own the server child/process group through a cleanup trap, fail on a lingering listener and verify a same-port restart if restart is claimed. Any zero-outbound claim needs a fresh synthetic counted destination, not an existing8080 service or absence of error logs. No such new measurement is retroactively claimed. Current CSP includes unsafe-inline; presence of headers is not proof of full MatterControl security. Integration/auth/adapter/cloud/cost remain separate gates.


## 9. Actual independent recheck

OpenCode2.1.4 / opencode/glm-5.3-flash-free, session ses_e9187093cffe0GgVrhsyCHzO3F, exit0/outcome succeeded, returned PASS_WITH_LIMITATIONS for the corrected H5 local template baseline, resolving FE-VERIFY-01..07. No runtime replay or hash recomputation by reviewer; no PoC rerun by Codex. Owner-asserted metadata and limited historical lifecycle/network evidence remain qualified above. Full frontend/product/adapter, integration, production/Cloudflare/cost gates remain open. See ../reviews/step-02-frontend-opencode-recheck.md and step-02-frontend-intake/opencode-recheck-execution.json.
