# MC-002-INTA-FE-R1 — Frontend Owner Return (R1 Companion Rework Complete; Runtime WAITING_ENV)

- **Owner & Role:** Antigravity (actual frontend owner MC-002-INTA-FE), model Gemini 3.8 Flash (High thinking).
- **Authority:** DEC-028 / INT-D01=INT-A APPROVED (subject `e7dbfbf`).
- **Reviewer:** OpenCode (actual independent QA role, packet re-review).
- **Proposed Status:** **IN_REVIEW (rework complete, preparation evidence qualified) / runtime WAITING_ENV.**
- **Matrix Status:** All 51 canonical rows remain **NOT_RUN** (36 required for selected slice, 14 deferred to later product, 1 blocked by external production feasibility). Zero rows awarded PASS. MC-002 and C01-PRODUCT remain OPEN.

---

## 1. Acknowledgement and Workspace Provenance

| Dimension | Value / Provenance |
|---|---|
| Task ID | `MC-002-INTA-FE-R1` |
| Agent Identity | Antigravity (actual frontend owner) |
| Model & Settings | Gemini 3.8 Flash (Thinking High) |
| Governance Root | `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` |
| Governance Branch | `task/MC-002-solution-architecture` |
| Base Commit (Harness) | `e25bbc6933264fc46a729e6a364a3bfa02d8038f` (verified clean before edits) |
| Head Commit (Harness) | `6e2f65b51e7ead3c84274e717f8f3bcaeccf9b91` |
| Harness Branch | `codex/mc-002-inta-harness-r1` in `/tmp/mc002-inta-harness` |
| Template Worktree | `/tmp/mc002-inta-fe` on `codex/mc-002-inta-fe`, clean at `3e5a642479acb789eb210e73fba956f3e85082e3` (zero tracked diff) |
| Go Backend Worktree | `/tmp/mc002-inta-be` clean at `52b60a4617081c41b949f2242e1784238c170f75` (untouched by frontend) |
| Pinned Installed Packages | Next.js 16.4.2, React 19.3.1, TypeScript 5.9.3, ESLint 9.39.5 |
| Input Governance Docs | Read in full: `project-status.md`, `inta-po-approval.md` (DEC-028), `inta-approved-contract.md` (INTA-1), `MC-002-INT-A.md`, `inta-coordination.md`, `integration-acceptance-matrix.md`, `step-02-4-runtime-classification.md`, `inta-frontend-intake.md`, `inta-frontend-opencode-source-review.md`, `inta-frontend-return.md` |

---

## 2. Review Findings Disposition (INTA-FE-R01 .. R10)

### INTA-FE-R01 — Native schema decodes `created_at`/`updated_at` (P0 BLOCKER — RESOLVED)
- **Files Modified:** `src/schemas.ts` (lines 86–93), `tests/schemas.test.ts`, `tests/executor.test.ts`.
- **Implementation:** `nativeUserSchema` now decodes snake_case `created_at` and `updated_at` strings instead of camelCase.
- **Verification:** Unit test in `tests/schemas.test.ts` validates native payloads passing `created_at`/`updated_at`, and rejects camelCase payloads (`createdAt`/`updatedAt`) with explicit field errors. Driver assertions verify RFC 3339 UTC format with 0–6 fraction digits (`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$`).

### INTA-FE-R02 — Companion-local driver and 36-case execution plan (P0 BLOCKER — RESOLVED)
- **Files Created:** `src/driver.ts`, `tests/driver.test.ts`.
- **Implementation:** Added full harness-local driver asset `HarnessDriver`:
  - `generateRunId()`: Generates alphanumeric 8–32 character runIds (`^[a-zA-Z0-9]{8,32}$`).
  - `assertNoRunIdCollision()`: Refuses execution if runId collides with existing evidence directories (`/tmp/mc002-inta-evidence/*/<runId>`), local state files, or active Docker containers (`mc002-inta-pg-<runId>`).
  - 36 required logical IDs: Defined in `CANONICAL_36_LOGICAL_IDS`, sequencing environment procedures (`INT-ENV-01`..`07`), Phase 1 (`T1`, `T2`, `W1`, `W2`, `T3`, `T4`, `T5`, `T8`, `W3`, `T6-W`, `T7-W`), Phase 2 (`INT-PERS-01`, `INT-PERS-02`, `T9`, `W9`, `T10`), Phase 3 (`T11a`, `T11b`, `T11c`, `W11`, `INT-PERS-03`, `INT-PERS-04`), and Phase 4 (`T12`, `INT-COR-01`, `INT-PRIV-01`, `INT-ISO-01`..`03`, `INT-CONF-01`).
  - Strict Rules: Exactly one upstream attempt per intended substep; zero retries; zero duplicate writes; pause safely before any upstream action until Codex ENV handoff and owner readiness.
  - Bounded Envelope Persistence: Saves envelopes to `.run-state/envelopes/<runId>/<caseId>.json`.
  - Blocked on Truncation: Blocks full-body, schema, equality, and persistence acceptance if envelope body was truncated.

### INTA-FE-R03 — Request-ID uniqueness across restarts, dev reloads, and runId switching (P0 BLOCKER — RESOLVED)
- **Files Modified:** `src/request-id.ts`, `app/harness/case/route.ts`, `tests/request-id.test.ts`.
- **Implementation:** `RequestIdGenerator` persists sequence counters to run-local disk state (`.run-state/counters.json`). Re-instantiation with the same runId loads the last counter, preventing collisions across Next.js dev reloads, server reboots, and runId switching. `app/harness/case/route.ts` maintains a generator map rather than discarding instances.
- **Verification:** `tests/request-id.test.ts` proves monotonically increasing IDs, zero collision across simulated server restarts, independent tracking across multiple runIds, and conformance with `<=128` safe characters (`^[a-zA-Z0-9_-]+$`).

### INTA-FE-R04 — Envelope protocol alignment with INTA-1 §5 (P1 — RESOLVED)
- **Files Modified:** `src/envelope.ts`, `src/executor.ts`, `tests/envelope.test.ts`, `tests/executor.test.ts`.
- **Implementation:**
  - `outcome`: Updated vocabulary to `'value' | 'apiError' | 'abort'`.
  - `classification`: Added field recording `'success'`, `'unavailable'` (for 503 outage and status 0 network errors per proposal §5.5 and matrix T11a/b/c/T12/W11), or `null`.
  - Single-sourced wire body: When `outcome === 'value'`, `value` holds the parsed body and `apiError` is `null`. When `outcome === 'apiError'`, `value` is `null` and `apiError.details` holds the body.
  - Measured versions: `getInstalledNextVersion()` dynamically reads `next/package.json` (`16.4.2`); `getHarnessRevision()` dynamically resolves git HEAD (`6e2f65b5...`).
  - Abort reachability: Documented that caller abort leaves `value` and `apiError` null, but the harness exposes no artificial caller controls.

### INTA-FE-R05 — Byte-accurate 16 KiB retention cap on all surfaces (P1 — RESOLVED)
- **Files Modified:** `src/envelope.ts`, `tests/envelope.test.ts`.
- **Implementation:** Implemented `findSafeUtf8TruncationIndex()` and `truncateUtf8()` to truncate strictly at encoded byte boundaries `<=16384` without splitting multi-byte sequences. Capping is applied to `value` and `apiError.details`. If any surface is capped, `truncated: true` is flagged. Documented that truncating an object changes its type from object to string.
- **Verification:** Unit tests in `tests/envelope.test.ts` verify ASCII, CJK (3 bytes/char), Emoji (4+ bytes/char), large objects, and large `apiError.details` all cap at `<=16384` encoded bytes without corrupting characters or generating replacement characters (`\uFFFD`).

### INTA-FE-R06 — Per-case `refId` validation table and mandatory readbacks (P0 BLOCKER — RESOLVED)
- **Files Modified:** `src/schemas.ts`, `src/executor.ts`, `app/harness/case/route.ts`, `tests/schemas.test.ts`, `tests/executor.test.ts`.
- **Implementation:**
  - `REF_ID_REQUIRED_CASE_IDS`: 15 cases (`T2`, `T5`, `T8`, `T9`, `T10`, `T11a`, `T11b`, `T12`, `W2`, `W9`, `W11`, `INT-PERS-01`..`04`) require lowercase canonical UUID `refId`. Missing `refId` fails schema validation before dispatch with HTTP 400 Bad Request and zero upstream.
  - `REF_ID_FORBIDDEN_CASE_IDS`: 8 cases (`T1`, `T3`, `T4`, `T11c`, `W1`, `W3`, `T6-W`, `T7-W`) forbid `refId`. Supplying `refId` fails validation with HTTP 400 Bad Request and zero upstream.
  - T5 and T8 mandatory readbacks: With `refId` guaranteed present by schema validation, substep 2 (readback GET User A unchanged) is mandatory and unconditional.
- **Verification:** Tests in `tests/schemas.test.ts` test all 23 allowlisted cases for required/forbidden refId behavior. Tests in `tests/executor.test.ts` verify T5 and T8 execute both substeps.

### INTA-FE-R07 — Startup refusal before listen, env audit enumeration, generic refusal (P1 — RESOLVED)
- **Files Modified:** `next.config.ts`, `src/guards.ts`, `tests/guards.test.ts`, `scripts/live-guards.ts`.
- **Implementation:**
  - Startup refusal: `next.config.ts` invokes `validateHarnessStartup(process.env)`. If `NODE_ENV === 'production'` or any prohibited product auth/secret variable is set, it throws an error immediately, causing Next.js dev server to exit non-zero before ever listening on port 18085.
  - Opt-in & fixed URL: `MC_INTA_ENABLE=1` and `MC_INTA_GO_BASE_URL=http://127.0.0.1:18086` are validated per-request in `route.ts`. Unset opt-in returns 404 with zero upstream.
  - Generic refusal message: Error for non-canonical `MC_INTA_GO_BASE_URL` returns generic `Fixed Go URL violation: MC_INTA_GO_BASE_URL must be http://127.0.0.1:18086` without echoing configured values.
  - Audited Environment Key Names (names only, zero values):
    - Template auth keys: `API_MODE`, `API_TOKEN`, `API_BASE_URL`, `AUTH_ALLOW_ANONYMOUS`, `API_TIMEOUT_MS`, `NEXT_PUBLIC_APP_NAME`
    - Additional audited session/provider-secret keys refused: `AUTH_SECRET`, `NEXTAUTH_SECRET`, `CLERK_SECRET_KEY`, `SESSION_SECRET`, `COOKIE_SECRET`, `DATABASE_URL`, `JWT_SECRET`.

### INTA-FE-R08 — Authoritative guard checks, computed verdicts, measured zero upstream, owned-PID stop (P1 — RESOLVED)
- **Files Created/Modified:** `scripts/live-guards.ts`, `scripts/stop-harness.sh`, `tests/guards.test.ts`.
- **Implementation:**
  - Isolated dimensions: Checks 1–4, 6–7 use valid runId `inta20261025a`; Check 5 isolates invalid runId pattern `bad_pattern!`. Checks 3 and 4 verify no runId confounding.
  - Computed verdicts: Each check programmatically verifies status code, headers, and error details, printing computed `PASS` / `FAIL`.
  - Measured zero upstream: A synthetic HTTP observer listens on `127.0.0.1:18086` during guard checks, proving exactly 0 upstream requests were received across all 7 checks.
  - Owned-PID cleanup: `scripts/stop-harness.sh` reads `.run-state/harness.pid`, sends `SIGTERM`, waits up to 5s for graceful exit, verifies port 18085 is closed, and removes the PID file. Never uses `lsof | xargs kill`, never `killall`.
  - Narrative correction: Prior return claims regarding graceful stop and cleanup methodology are superseded by this authoritative owned-PID evidence.

### INTA-FE-R09 — Return drift correction and canonical 36-case inventory (P1 — RESOLVED)
- **Descriptions corrected:**
  - `T5`: POST invalid name -> 422 VALIDATION_ERROR; mandatory readback GET User A unchanged (version 1).
  - `T8`: POST User A email with duplicate name -> 409 HTTP_ERROR; mandatory readback GET User A unchanged (version 1).
  - `T6-W`: Wire POST malformed JSON bytes `{` with JSON Content-Type -> 400 application/problem+json.
  - `T7-W`: Wire POST valid JSON bytes as Uint8Array without Content-Type -> 415 application/problem+json.
  - `W9`: Wire GET User A after update -> 200, ETag: `"2"`.
- **Missing IDs added:** `INT-ENV-05`, `INT-ENV-06`, `INT-ENV-07` included in the canonical 36 required local cases table.
- **503-only expectations:** T11a, T11b, T11c, W11 expect 503 only (removed `503 / 500` ambiguity).
- **Installed versions corrected:** Next.js 16.4.2, React 19.3.1, TypeScript 5.9.3, ESLint 9.39.5.
- **Labeling:** Replaced `PASS (Prep)` with `PREPARED (Harness only)` to prevent conflation with matrix row acceptance. All 51 matrix rows remain `NOT_RUN`.
- **Isolation log:** Re-captured raw command transcript with exact argv, exits, and UTC timestamps.

### INTA-FE-R10 — Minor dispositions without dependency changes (P2 — RESOLVED)
- (a) Wire fetch timeout: Bounded with `AbortSignal.timeout(10000)` (10s local timeout); catches timeout and maps to status 0, `TIMEOUT`, classification `unavailable`.
- (b) Vitest config: Replaced `__dirname` with `import.meta.dirname` in `vitest.config.ts`, eliminating the deprecation warning.
- (c) Type safety: `ValidationResult` failure branch includes `refusedKeys?: string[]`, eliminating `(envCheck as any)` cast in `route.ts`.
- (d) Direct template import: Confirmed intentional direct import of unmodified `/tmp/mc002-inta-fe/src/lib/api/http-client` without copying product code; cross-root feasibility verified under `INT-ENV-07`.
- (e) Envelope truncation type change: Documented that truncated retained `value` changes type from object to string, and blocks full-body assertions.

---

## 3. Coordinated Driver RunId and Request-ID Plan

- **Proposed Driver RunId:** `inta20261025a` (valid alphanumeric: `^[a-zA-Z0-9]{8,32}$`). Preflight checks confirm zero collision against existing evidence folders, local state files, and Docker containers.
- **Request-ID Format:** `mc-int-<runId>-<caseId>-<seq>`
  - Generated by `RequestIdGenerator` backed by `.run-state/counters.json`.
  - Sequential, strictly monotonic, safe characters (`^[a-zA-Z0-9_-]+$`), `<=128` characters.
  - Guaranteed unique across Next.js dev reloads, process reboots, and runId switches.
  - Each distinct substep receives a unique request ID (e.g. `mc-int-inta20261025a-T4-1`, `mc-int-inta20261025a-T4-2`).
  - Enables 100% correlation with Go application logs for `INT-COR-01` when executed.

---

## 4. Canonical 36 Required Integration Cases Table

*Note: All 36 rows remain **NOT_RUN**; preparation evidence represents harness-local unit, schema, and guard checks only. Upstream Go/PG execution is safely paused pending Codex ENV handoff.*

| Case ID | Subsystem / Role | Expected Outcome (INTA-1) | Harness Preparation Status | Notes & Verification Scope |
|---|---|---|---|---|
| INT-ENV-01 | Codex (PG container) | Dedicated container `mc002-inta-pg-<runId>`, port 15457, caps, empty DB | NOT_RUN / WAITING_ENV | Container provisioning owned by Codex |
| INT-ENV-02 | ZCode (Migration) | Native `migrate` at clean `52b60a4` on new DB | NOT_RUN / WAITING_ENV | Migration owned by ZCode |
| INT-ENV-03 | ZCode (Go runtime) | Loopback 18086, `STORAGE=postgres`, no docs routes | NOT_RUN / WAITING_ENV | Binary ready at `f3bcdc2f`; startup owned by ZCode |
| INT-ENV-04 | Antigravity (Harness) | Route handler `POST /harness/case` on 18085; allowlist; no-store | **PREPARED** | Route handler, allowlist, and no-store headers verified |
| INT-ENV-05 | Antigravity (Startup refusal) | Opt-in absent -> 404; prod/auth env -> startup refusal before listen | **PREPARED** | Check 6 (404) & Check 7 (exit 1 before listen) verified |
| INT-ENV-06 | Antigravity (Driver rules) | Fixed case table, 1 attempt/substep, bounded envelopes persisted | **PREPARED** | `HarnessDriver` implemented; collision refusal verified |
| INT-ENV-07 | Antigravity (Next runtime) | Cross-root import compiles; no fetch caching; `nextVersion` recorded | **PREPARED** | Tested under Next.js 16.4.2 webpack dev server |
| T1 | Antigravity (App-client) | POST create A -> outcome `value`, version 1, RFC 3339 UTC `created_at`/`updated_at`, UUIDv7 `id` | NOT_RUN / WAITING_ENV | Client executor & schema ready; Checkpoint A logic verified |
| T2 | Antigravity (App-client) | GET A -> outcome `value`, field-for-field equal to Checkpoint A | NOT_RUN / WAITING_ENV | Read executor implemented; field equality check verified |
| W1 | Antigravity (Wire) | POST B -> wire 201, `Location: /api/v1/users/<B id>`, `ETag: "1"`, request-ID echo | NOT_RUN / WAITING_ENV | Wire POST executor implemented; timeout bounded |
| W2 | Antigravity (Wire) | GET A -> wire 200, `ETag: "1"`, request-ID echo | NOT_RUN / WAITING_ENV | Wire GET executor implemented; timeout bounded |
| T3 | Antigravity (App-client) | GET missing UUID -> client 404 `NOT_FOUND`, RFC 9457 details | NOT_RUN / WAITING_ENV | Missing UUID fixture ready; 404 handling verified |
| T4 | Antigravity (App-client) | GET malformed literal then uppercase literal -> two 404 `NOT_FOUND` | NOT_RUN / WAITING_ENV | Two distinct substeps with unique request IDs verified |
| T5 | Antigravity (App-client) | POST empty name -> 422 `VALIDATION_ERROR`; mandatory readback GET A version 1 | NOT_RUN / WAITING_ENV | 422 validation & mandatory readback substep verified |
| T8 | Antigravity (App-client) | POST duplicate email -> 409 `HTTP_ERROR`; mandatory readback GET A version 1 | NOT_RUN / WAITING_ENV | 409 conflict & mandatory readback substep verified |
| W3 | Antigravity (Wire) | GET missing UUID -> wire 404 `application/problem+json` | NOT_RUN / WAITING_ENV | Wire 404 observation ready |
| T6-W | Antigravity (Wire) | POST malformed JSON bytes `{` with JSON Content-Type -> wire 400 | NOT_RUN / WAITING_ENV | Malformed JSON wire probe implemented |
| T7-W | Antigravity (Wire) | POST valid JSON bytes as `Uint8Array` without Content-Type -> wire 415 | NOT_RUN / WAITING_ENV | Omitted Content-Type wire probe implemented |
| INT-PERS-01 | Codex, ZCode, Antigravity | Go restart -> GET A readback equals pre-restart checkpoint (version 1) | NOT_RUN / WAITING_ENV | Pre-restart checkpointing ready; coordinated restart |
| INT-PERS-02 | Codex, Antigravity | Same-PG container stop/start -> GET A equals checkpoint (version 1) | NOT_RUN / WAITING_ENV | Container storage identity preservation; readback ready |
| T9 | Antigravity (App-client) | PATCH A (`If-Match: "1"`, new name) -> outcome `value`, version 2 | NOT_RUN / WAITING_ENV | PATCH executor implemented; Checkpoint A updated to v2 |
| W9 | Antigravity (Wire) | GET A after update -> wire 200, `ETag: "2"`, request-ID echo | NOT_RUN / WAITING_ENV | Wire GET post-update observation implemented |
| T10 | Antigravity (App-client) | PATCH A stale (`If-Match: "1"`) -> 412 `HTTP_ERROR`; readback version 2 preserved | NOT_RUN / WAITING_ENV | Stale ETag 412 & readback preservation verified |
| T11a | Antigravity (App-client) | GET A during PG outage -> client 503, classification `unavailable`, retryAfter=1 | NOT_RUN / WAITING_ENV | Outage classification `unavailable` mapped and verified |
| T11b | Antigravity (App-client) | PATCH A during outage -> client 503 `unavailable`; marked OUTCOME_UNKNOWN | NOT_RUN / WAITING_ENV | Write marked OUTCOME_UNKNOWN; no commit inferred |
| T11c | Antigravity (App-client) | POST X during outage -> client 503 `unavailable`; X permanently OUTCOME_UNKNOWN | NOT_RUN / WAITING_ENV | User X marked OUTCOME_UNKNOWN; zero retries |
| W11 | Antigravity (Wire) | GET A during outage -> wire 503 `application/problem+json` | NOT_RUN / WAITING_ENV | Wire outage observation ready |
| INT-PERS-03 | Antigravity (App-client) | GET A after PG recovery without Go restart -> 200, classification `success` | NOT_RUN / WAITING_ENV | Recovery readback implemented |
| INT-PERS-04 | Antigravity (App-client) | Reconcile User A read-only; User X remains OUTCOME_UNKNOWN | NOT_RUN / WAITING_ENV | Read-only reconciliation; zero retry/re-POST/SQL expansion |
| T12 | Antigravity (App-client) | GET A after Go stopped -> `NETWORK_ERROR`, status 0, classification `unavailable` | NOT_RUN / WAITING_ENV | Network error mapping to `unavailable` verified |
| INT-COR-01 | Antigravity, ZCode | Correlate request IDs in Go access logs | NOT_RUN / WAITING_ENV | Deterministic monotonic request-ID generator ready |
| INT-PRIV-01 | Codex, Antigravity | Zero credentials in logs/envelopes; envelope bodies <=16 KiB capped | **PREPARED** | Byte-accurate 16 KiB UTF-8 capping verified; 0 secrets found |
| INT-ISO-01 | Antigravity, ZCode | Zero tracked diffs in template and backend | **PREPARED** | `/tmp/mc002-inta-fe` clean at `3e5a6424`; zero tracked diff |
| INT-ISO-02 | Antigravity | Product build/test/CI excludes harness; harness not in product globs | **PREPARED** | Template typecheck and lint pass with 0 errors |
| INT-ISO-03 | Codex, Antigravity | Owned process teardown verification (zero owned listeners) | **PREPARED** | Graceful stop of owned PIDs verified; port 18085 closed |
| INT-CONF-01 | Claude, OpenCode | Architecture conformance review against INTA-1 contract | NOT_RUN / WAITING_ENV | Independent review after coordinated runtime execution |

*Deferred Cases: 14 product cases (`D-01`..`D-13`, `D-15`) remain `DEPENDS_ON_LATER_PRODUCT_IMPLEMENTATION`; 1 case (`D-14`) remains `BLOCKED_BY_EXTERNAL_FEASIBILITY`.*

---

## 5. Verification Evidence and Artifact Manifest

### 5.1 Unit Tests Execution Summary
- **Command:** `rtk proxy pnpm --dir /tmp/mc002-inta-harness test` (`vitest run`)
- **UTC Duration:** 2026-10-25T03:56:51Z (Duration: 298ms)
- **Exit Code:** 0
- **Results:** **7 test files, 66 tests passed, 0 failed, 0 skipped.**
  - `tests/fixtures.test.ts`: 2 tests passed
  - `tests/request-id.test.ts`: 4 tests passed (restart persistence, runId switching, length/charset)
  - `tests/guards.test.ts`: 31 tests passed (startup refusal on prod/auth env, per-request validation, generic URLs)
  - `tests/envelope.test.ts`: 6 tests passed (16 KiB byte capping, CJK/Emoji safe truncation, object type change, details capping)
  - `tests/schemas.test.ts`: 11 tests passed (native created_at/updated_at, camel-case rejection, full 23-case refId table)
  - `tests/executor.test.ts`: 6 tests passed (native timestamps, T4 substeps, T5 mandatory readback, outage/T12 unavailable classification)
  - `tests/driver.test.ts`: 6 tests passed (runId generation, collision refusal, 36 logical IDs, Checkpoint A, truncation blocking)

### 5.2 Authoritative Live Guards Execution Summary
- **Command:** `node scripts/live-guards.ts`
- **UTC Duration:** 2026-10-25T03:57:03Z to 03:57:07Z
- **Exit Code:** 0
- **Live Guard Checks:** **7/7 PASS (Computed Assertions)**
  - Check 1: GET `/harness/case` -> 405 Method Not Allowed (`allow=POST`) [PASS]
  - Check 2: POST `/harness/case` with non-JSON body -> 400 Bad Request (`Invalid JSON body`) [PASS]
  - Check 3: POST with valid runId `inta20261025a` and unknown caseId -> 400 Bad Request (caseId issue only, no runId confounding) [PASS]
  - Check 4: POST with valid runId, valid caseId, and extra field -> 400 Bad Request (extra field issue only, no runId confounding) [PASS]
  - Check 5: POST with invalid runId pattern `bad_pattern!` -> 400 Bad Request (runId regex issue only) [PASS]
  - Check 6: POST with `MC_INTA_ENABLE` unset -> 404 Not Found (`MC_INTA_ENABLE=1 is required`) [PASS]
  - Check 7: Boot attempt with `API_MODE=demo` -> Startup Refusal before listen (Exit 1, stderr `Harness startup refused: product auth/secret env vars present (API_MODE)`, port 18085 never opened) [PASS]
- **Measured Upstream Requests (127.0.0.1:18086):** **0 requests** (Zero Upstream Assertion: PASS)
- **Port 18085 Closed Verification:** PASS

### 5.3 Template Invariance & Product Isolation Summary
- **Worktree:** `/tmp/mc002-inta-fe` clean at `3e5a642479acb789eb210e73fba956f3e85082e3`
- **Git Status:** `git -C /tmp/mc002-inta-fe status --porcelain` -> Empty (0 files changed)
- **Git Diff:** `git -C /tmp/mc002-inta-fe diff 3e5a642479acb789eb210e73fba956f3e85082e3 --stat` -> Empty
- **Product Typecheck:** `pnpm --dir /tmp/mc002-inta-fe typecheck` -> Exit 0
- **Product ESLint:** `pnpm --dir /tmp/mc002-inta-fe lint` -> Exit 0

### 5.4 Artifact & Export Hash Manifest
- **Source Archive:** `/tmp/mc002-inta-evidence/frontend/r1/harness-source.tar.gz`
  - SHA256: `29c9537201bc1a4ecc81c3902888297a9fc3f8c537203e9981cac598f3375ab3`
  - Excludes `.git`, `node_modules`, `.next`, `.run-state`, AppleDouble metadata (`._*`).
- **Raw Evidence:** `/tmp/mc002-inta-evidence/frontend/r1/SHA256SUMS` (No self-hash cycle)
  ```
  6a5b20eedc7c882abe25556062cda37c29e2e351de9e4d6508930b2d32e99fa8  01-unit-tests.log
  614eaf9978b425d3756442f2c8b7b1dbfc7c61d0b580246d560d1e1c91743f26  02-harness-live-guards.log
  04445c73e1d88bc38c9df1b31a7f52903951b1f64b07777e9cb8c220e2d08835  03-template-isolation.log
  29c9537201bc1a4ecc81c3902888297a9fc3f8c537203e9981cac598f3375ab3  harness-source.tar.gz
  df81eac33e2affa16fa6d67d9c60d0b3d56fcc51e73d74b487610e6c0b1be7c5  source-hashes.txt
  ```
- **Reviewed Governance Exports:** `docs/testing/inta-returns/frontend/r1/21-export-hashes.txt` (No self-hash cycle)
  ```
  229c0bf2465ea7ce29d4d8a9d8e65d17517b45d86da4db4c117df3b046299255  10-harness-meta.txt
  6a5b20eedc7c882abe25556062cda37c29e2e351de9e4d6508930b2d32e99fa8  11-unit-tests.log
  614eaf9978b425d3756442f2c8b7b1dbfc7c61d0b580246d560d1e1c91743f26  12-live-guards.log
  04445c73e1d88bc38c9df1b31a7f52903951b1f64b07777e9cb8c220e2d08835  13-template-isolation.log
  df81eac33e2affa16fa6d67d9c60d0b3d56fcc51e73d74b487610e6c0b1be7c5  20-source-hashes.txt
  ```
  *Byte equality verified between `/tmp` raw evidence and governance exports.*

---

## 6. Privacy, Security, and Cleanup Disposition

1. **Zero Credentials / Tokens:** Redaction scan across all generated evidence logs with `grep -riE "(password|secret|bearer|authorization|token|clerk_secret|private_key)"` returned zero credential leaks (only the literal error string `Harness startup refused: product auth/secret env vars present (API_MODE)` appeared).
2. **Template Invariance:** `/tmp/mc002-inta-fe` has zero modified or untracked files; diff against base `3e5a6424` is 0 lines.
3. **Owned PID Cleanup:** Harness processes are terminated exclusively by exact recorded PID via `scripts/stop-harness.sh` using `SIGTERM` with graceful bounded wait. Port 18085 was verified completely closed after execution.
4. **No Open Proxy:** Route Handler accepts only fixed caseIds and lowercase canonical UUID refId; caller cannot control method, URL, headers, or body.

---

## 7. Blockers and Next Dependencies

1. **Current Route State:** The harness companion rework is complete and verified with focused unit tests and authoritative live guards. Upstream Go/PostgreSQL execution remains safely paused.
2. **Next Dependency:**
   - Codex provisions the capped, task-labelled PostgreSQL container (`mc002-inta-pg-<runId>` on loopback 15457), verifies healthy/empty DB, and privately hands DSN to ZCode (INT-ENV-01).
   - ZCode runs native migration (INT-ENV-02) and starts Go `userapi` binary at `52b60a4` on loopback 18086 (INT-ENV-03).
   - Antigravity launches harness on loopback 18085 and executes the coordinated frozen 36-case sequence with driver checkpointing and envelope persistence.
   - OpenCode independently reviews R1 source/evidence and performs independent runtime verification.
3. **Skipped Items:**
   - No product auth, session, or multi-tenant isolation implemented.
   - No Cloudflare, cost, or full backup/recovery validation.
   - No paid service, production deployment, or MC-003A change.
4. **Remaining Risk:**
   - Cross-root runtime feasibility and all 36 coordinated Next -> Go -> PG integration cases still require actual independent runtime verification.
