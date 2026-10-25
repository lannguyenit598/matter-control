# MC-002-INTA-FE-R2 — Frontend Owner Return (R2 Companion Rework Complete; Runtime WAITING_ENV)

- **Owner & Role:** Antigravity (actual frontend owner MC-002-INTA-FE), model Gemini 3.8 Flash (High thinking, owner-reported).
- **Authority:** DEC-028 / INT-D01=INT-A APPROVED (subject `e7dbfbf`).
- **Reviewer:** OpenCode (actual independent QA role, packet re-review).
- **Proposed Status:** **IN_REVIEW (rework complete, preparation evidence qualified) / runtime WAITING_ENV.**
- **Matrix Status:** All 51 canonical rows remain **NOT_RUN** (36 required for selected slice, 14 deferred to later product, 1 blocked by external production feasibility). Zero rows awarded PASS. MC-002 and C01-PRODUCT remain OPEN.

---

## 1. Acknowledgement and Workspace Provenance

| Dimension | Value / Provenance |
|---|---|
| Task ID | `MC-002-INTA-FE-R2` |
| Agent Identity | Antigravity (actual frontend owner) |
| Model & Settings | Gemini 3.8 Flash (Thinking High, owner-reported) |
| Governance Root | `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` |
| Governance Branch | `task/MC-002-solution-architecture` |
| Base Commit (Harness) | `6e2f65b51e7ead3c84274e717f8f3bcaeccf9b91` (verified clean before edits) |
| Head Commit (Harness) | `79322fcb2c72bb3db20d55f3f3fc860e7e7ee2dc` |
| Harness Branch | `codex/mc-002-inta-harness-r2` in `/tmp/mc002-inta-harness` |
| Template Worktree | `/tmp/mc002-inta-fe` on `codex/mc-002-inta-fe`, clean at `3e5a642479acb789eb210e73fba956f3e85082e3` (zero tracked diff) |
| Go Backend Worktree | `/tmp/mc002-inta-be` clean at `52b60a4617081c41b949f2242e1784238c170f75` (untouched by frontend) |
| Pinned Installed Packages | Next.js 16.4.2, React 19.3.1, TypeScript 5.9.3, ESLint 9.39.5 |
| Input Governance Docs | Read in full: `project-status.md`, `inta-po-approval.md` (DEC-028), `inta-approved-contract.md` (INTA-1), `MC-002-INT-A.md`, `inta-coordination.md`, `integration-acceptance-matrix.md`, `step-02-4-runtime-classification.md`, `inta-frontend-r1-return.md`, `inta-frontend-r1-opencode-review.md`, `inta-frontend-r1-intake.md` |

---

## 2. Review Findings Disposition (MC-002-INTA-FE-R1-F01 .. F09)

### MC-002-INTA-FE-R1-F01 — Executable phase runner & per-case assertions (P0 BLOCKER — RESOLVED)
- **Files Modified:** `src/driver.ts` (lines 160–1085), `tests/driver.test.ts`, `package.json` (`"driver": "node src/driver.ts"`).
- **Executable CLI Runner:**
  - Added CLI runner entry point `main()` in `src/driver.ts` executed via `node src/driver.ts <command>`.
  - Commands supported:
    - `phase1`: Sequences baseline & initial negatives (`T1`, `T2`, `W1`, `W2`, `T3`, `T4`, `T5`, `T8`, `W3`, `T6-W`, `T7-W`), persists envelopes, establishes Checkpoint A, and emits external owner lifecycle prompt for Go restart (`INT-PERS-01`) and PostgreSQL restart (`INT-PERS-02`).
    - `phase2`: Sequences restart persistence checks (`INT-PERS-01`, `INT-PERS-02`), verifying User A unchanged.
    - `phase3`: Sequences mutations & stale update (`T9`, `W9`, `T10`), updating Checkpoint A to version 2 and emitting external owner prompt for PostgreSQL outage stop.
    - `phase4`: Sequences outage cases (`T11a`, `T11b`, `T11c`, `W11`), recovery readbacks (`INT-PERS-03`, `INT-PERS-04`), and shutdown (`T12`).
    - `status`: Displays current runId, phase, checkpoint state, and assertion counts.
- **Driver-Only Readiness Gate:**
  - Strict gating: `checkEnvReadiness(options.envReady)` verifies `--env-ready` CLI flag or `process.env.MC_INTA_ENV_READY === '1'`.
  - If unset, runner exits immediately with code 2 (`[DRIVER_PAUSED] Phase X paused: upstream environment not verified ready`), performing **zero upstream network requests**.
  - As clarified in Codex intake, readiness confirmation is implemented **in the driver only**; no `MC_INTA_ENV_READY` route input, header, or server-side auth policy was introduced into `route.ts`.
- **Write-Once Envelope Ledger:**
  - `persistEnvelope(caseId, envelopes)` checks `.run-state/envelopes/<runId>/<caseId>.json`.
  - If existing content is byte-identical: idempotent success.
  - If existing content differs: throws `Duplicate case execution refused by write-once ledger: ${caseId} already executed with different content for runId ${this.runId}`.
- **Durable Write-Once Checkpoints:**
  - `saveCheckpoint()` and `loadCheckpoint()` persist driver state to `.run-state/checkpoints/<runId>.json` atomically (temp-file write + rename).
  - Instantiation with `allowResume=true` restores `checkpointA`, `checkpointBId`, `userXOutcome`, and `phase` from disk, surviving process restarts and module reloads.
- **Complete Per-Case Assertions:**
  - `UUIDV7_LOWERCASE_REGEX`: strictly verifies lowercase UUIDv7 version digit 7 and RFC 4122 variant (`^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`).
  - Fixture matching: `assertT1` asserts `val.email === f.userA.initial.email` (`inta-a-<runId>@example.test`) and `val.name === f.userA.initial.name` (`INTA_A_INITIAL`) against `getFixturesForRun(runId)`.
  - Unchanged readbacks: `assertT5`, `assertT8`, and `assertT10` verify readbacks match Checkpoint A field-for-field.
  - Update assertion: `assertT9` verifies version 2 and updated name `INTA_A_UPDATED`, advancing Checkpoint A.
  - Native 503 problem details: `assertT11a` verifies `status: 503`, `classification: 'unavailable'`, problem type `/problems/unavailable`, retryAfter integer `1`, and detail `"service temporarily unavailable"`.
  - Outage outcome: `assertT11c` marks `userXOutcome = 'OUTCOME_UNKNOWN'` (never retried, re-POSTed, or probed via list/SQL).
  - Wire assertions: `assertW1` checks wire 201, `Location === /api/v1/users/${bId}`, `ETag === "\"1\""`, and `x-request-id` echo; `assertW9` checks `ETag === "\"2\""`.
  - Truncation blocking: `recordAssertion` blocks body/schema/equality acceptance with `blocked: true` if `envelope.truncated === true`.

### MC-002-INTA-FE-R1-F02 — Counter fail-closed + atomicity + preflight alignment (P1 — RESOLVED)
- **Files Modified:** `src/request-id.ts` (lines 40–115), `src/driver.ts` (lines 98–145), `tests/request-id.test.ts`, `tests/driver.test.ts`.
- **Fail-Closed Persistence:**
  - `loadPersistedSeq()`: If `.run-state/counters.json` exists but is unreadable, malformed, or contains a non-integer counter for `runId`, it throws `Error('Fail-closed: unreadable or corrupt counter state in ...')`. It never silently falls back to seq 0.
  - `persistSeq()`: Throws immediately if write fails (no swallowed exceptions).
- **Atomic Disk Writes:**
  - `persistSeq()` writes to a PID- and timestamp-tagged temporary file in `this.stateDir` (`.counters.<runId>.<pid>.<ts>.tmp`), then invokes `fs.renameSync` to replace `counters.json` atomically.
- **Downward Overwrite Prevention:**
  - `next()` re-reads disk state to observe any concurrent or overlapping instances: `this.seq = Math.max(this.seq, onDiskSeq) + 1`.
  - `persistSeq()` persists `Math.max(seq, onDiskSeq)`, preventing a stale module instance from resetting the counter downward.
- **Preflight Alignment:**
  - `assertNoRunIdCollision()` checks the real `counters.json` path (`data[runId] !== undefined`), `checkpoints/<runId>.json`, and `envelopes/<runId>`.
  - `HarnessDriver` passes its actual configured `stateDir` into `assertNoRunIdCollision`.

### MC-002-INTA-FE-R1-F03 — Identity metadata authenticity & unmeasured sentinels (P1 — RESOLVED)
- **Files Modified:** `src/executor.ts` (lines 40–90, 275–285), `tests/executor.test.ts`.
- **Removal of Fabricated Fallbacks & Overrides:**
  - Dropped unchecked environment variable overrides `MC_INTA_NEXT_VERSION` and `MC_INTA_HARNESS_REVISION`.
  - Dropped hardcoded literal fallbacks `'16.4.2'` and `'e25bbc6933264fc46a729e6a364a3bfa02d8038f'`.
  - If package metadata cannot be read: returns sentinel `'unmeasured:next-package-json-not-found'`.
  - If git revision cannot be resolved (and no `.harness-revision` stamp exists): returns sentinel `'unmeasured:git-rev-parse-failed'`.
- **Pre-Upstream Refusal on Unmeasured Identity:**
  - `executeCase()` checks `nextVersion` and `harnessRevision` before dispatch: if either starts with `unmeasured:`, it throws `Error('Upstream execution refused: unmeasured ...')`.

### MC-002-INTA-FE-R1-F04 — Unconditional startup refusal & empty-string env presence (P1 — RESOLVED)
- **Files Modified:** `next.config.ts`, `src/guards.ts` (lines 60–65, 95–105), `tests/guards.test.ts`.
- **Unconditional Startup Refusal:**
  - Removed `if (process.env.NODE_ENV !== 'test' && !process.env.VITEST)` from `next.config.ts`. `validateHarnessStartup(process.env)` is now called unconditionally upon loading `next.config.ts`.
- **Presence Check for Prohibited Keys:**
  - Updated `validateHarnessEnvironment` and `validateHarnessStartup` from `env[key] !== undefined && env[key] !== ''` to `env[key] !== undefined`.
  - Setting prohibited variables to empty string (e.g. `API_MODE=""`) is strictly refused as presence per frozen INTA-1 §2.
  - Added unit test cases for empty string env presence and `NODE_ENV=test` contexts.

### MC-002-INTA-FE-R1-F05 — Refused vs audited key-list documentation (P2 DOC — RESOLVED)
- **Refused Keys (`PRODUCT_AUTH_ENV_KEYS`):**
  - Contract-mandated product auth/bypass keys: `API_MODE`, `API_TOKEN`, `API_BASE_URL`, `AUTH_ALLOW_ANONYMOUS`.
  - Audited session / provider-secret keys: `AUTH_SECRET`, `NEXTAUTH_SECRET`, `CLERK_SECRET_KEY`, `SESSION_SECRET`, `COOKIE_SECRET`, `DATABASE_URL`, `JWT_SECRET`.
  - Harness-local timeout control: `API_TIMEOUT_MS`.
- **Harness-Local Rationale for `API_TIMEOUT_MS` Refusal:**
  - `API_TIMEOUT_MS` is a harness-local configuration key rather than a product secret. It is included in `PRODUCT_AUTH_ENV_KEYS` to guarantee that the contract-mandated 10,000 ms wire timeout cannot be overridden or weakened via environment variables during integration execution.
- **Audited Public-Key Distinction:**
  - `NEXT_PUBLIC_APP_NAME` is an audited public application UI label from the template. Per F05, it is **not** included in `PRODUCT_AUTH_ENV_KEYS` and is **not** refused.
  - No product `.env` files are loaded. Secret values are never exposed or printed.

### MC-002-INTA-FE-R1-F06 — Check 7 numeric exit code, timeout kill & cleanup hygiene (P1 — RESOLVED)
- **Files Modified:** `scripts/live-guards.ts` (lines 420–580).
- **Numeric Non-Zero Exit Code:**
  - Check 7 now strictly requires `typeof startupExitCode === 'number' && startupExitCode !== 0`. Exit code `null` is classified as failure.
  - On the 5-second safety timeout, `devProcess3` is explicitly killed via `devProcess3.kill('SIGTERM')`.
- **Live Check 7b Added:**
  - Added live Check 7b testing `NODE_ENV=production` startup refusal.
  - Asserts numeric exit code `1`, stderr includes `'NODE_ENV cannot be production'`, and port 18085 remained closed.
- **Bounded `try / finally` Cleanup:**
  - All phases in `scripts/live-guards.ts` are wrapped in a `try / finally` block.
  - Active process PIDs are tracked in an `activePids` set; the `finally` block terminates any surviving child processes gracefully (SIGTERM, bounded 5s, SIGKILL) and closes `upstreamServer`.

### MC-002-INTA-FE-R1-F07 — Stop script positive PID validation & port verification (P1 — RESOLVED)
- **Files Modified:** `scripts/stop-harness.sh`.
- **Strict Numeric PID Validation:**
  - `TARGET_PID` is validated against `^[1-9][0-9]*$`.
  - Targets of `0`, negative values (e.g. `-1`), or non-numeric strings are refused immediately with exit code 1 and **zero signals sent**, eliminating caller process group signaling risk.
- **Process Identity / Ownership Verification:**
  - Inspects `ps -p "${TARGET_PID}" -o command=`.
  - Refuses to signal any process whose command does not match `next`, `node`, or `mc002-inta-harness`.
- **Port 18085 Closed Verification:**
  - After process termination, executes `nc -z 127.0.0.1 18085` to verify that port 18085 is closed.

### MC-002-INTA-FE-R1-F08 — Assert Allow/Cache-Control & scope wording riders (P2 — RESOLVED)
- **Files Modified:** `scripts/live-guards.ts` (lines 175–215).
- **Check 1 Header Assertions:**
  - Check 1 now explicitly computes:
    ```ts
    const pass = res.status === 405 &&
      parsed?.error === 'Method Not Allowed' &&
      allowHeader === 'POST' &&
      Boolean(cacheControlHeader?.includes('no-store'))
    ```
- **Wording Scope Riders:**
  - "Port 18085 closed verification": A closed port snapshot at the startup check proves *refusal before listen*, rather than continuous "never opened" proof across all time.
  - `INT-ENV-07`: Scoped strictly as companion preparation evidence. Webpack dev server cross-root module compilation is verified, but dynamic no-caching and successful Go transport remain runtime QA requirements.

### MC-002-INTA-FE-R1-F09 — Provenance qualification of retained artifacts (P2 DOC — RESOLVED)
- **Printed Command Provenance:**
  - In `scripts/live-guards.ts`, printed HTTP requests are explicitly labeled `Equivalent curl:` to clarify that the script executed Node.js `fetch()`.
- **Artifact Scope Qualifications:**
  - `13-template-isolation.log` confirms that `/tmp/mc002-inta-fe` has zero git diff and passes typecheck/lint. Full artifact-exclusion verification (`INT-ISO-02`) remains a runtime QA check.
  - `INT-PRIV-01` secret scans cover owner companion logs and source only; Go and Next application log scans remain deferred to runtime QA.
  - Model identity `Gemini 3.8 Flash (High thinking)` is owner-reported.

---

## 3. Authoritative Verification Evidence Summary

### 3.1 Unit Test Suite (`11-unit-tests.log`)
- **Command:** `rtk pnpm test` (`vitest run`)
- **Working Directory:** `/tmp/mc002-inta-harness` (commit `79322fcb2c72bb3db20d55f3f3fc860e7e7ee2dc`)
- **Results:** **80 passed in 7 test files** (0 failures, 0 skipped), duration 2.34s, exit code 0.
  - `tests/fixtures.test.ts`: 2 tests passed
  - `tests/envelope.test.ts`: 6 tests passed
  - `tests/guards.test.ts`: 34 tests passed (including empty string auth keys and test env without bypass)
  - `tests/request-id.test.ts`: 6 tests passed (including fail-closed on corrupt state, atomic write, downward overwrite prevention)
  - `tests/schemas.test.ts`: 11 tests passed
  - `tests/executor.test.ts`: 8 tests passed (including dynamic version measurement and unmeasured identity refusal)
  - `tests/driver.test.ts`: 13 tests passed (including UUIDv7 version digit check, fixture matching, write-once ledger, durable checkpoint restore, T9 mutation, T11a 503 problem details, runId collision refusal)

### 3.2 Live Harness Guards (`12-live-guards.log`)
- **Command:** `node scripts/live-guards.ts`
- **Results:** **8/8 live guard checks PASS + 0 upstream calls measured**, exit code 0.
  - Check 1: `GET /harness/case` -> Expected 405 Method Not Allowed, `Allow: POST`, `Cache-Control: no-store` [PASS]
  - Check 2: `POST /harness/case` non-JSON body -> Expected 400 Bad Request [PASS]
  - Check 3: `POST /harness/case` unknown caseId -> Expected 400 Bad Request (no runId confounding) [PASS]
  - Check 4: `POST /harness/case` extra prohibited field -> Expected 400 Bad Request (strict schema) [PASS]
  - Check 5: `POST /harness/case` invalid refId UUID for T2 -> Expected 400 Bad Request [PASS]
  - Check 6: `POST /harness/case` when disabled (no `MC_INTA_ENABLE=1`) -> Expected 404 Not Found [PASS]
  - Check 7: Startup refusal before listen with `API_MODE=demo` -> Exit code 1 non-zero, port 18085 remained closed [PASS]
  - Check 7b: Startup refusal before listen with `NODE_ENV=production` -> Exit code 1 non-zero, port 18085 remained closed [PASS]
  - **Measured Upstream Requests at `127.0.0.1:18086`:** **0** (Zero Upstream Assertion PASS)
  - **Port 18085 Closed Verification:** PASS

### 3.3 Template & Backend Isolation (`13-template-isolation.log`)
- **Template Worktree (`/tmp/mc002-inta-fe`):** Clean at `3e5a642479acb789eb210e73fba956f3e85082e3`, zero diff.
  - `pnpm --dir /tmp/mc002-inta-fe typecheck`: Exit code 0 (`✓ Types generated successfully`).
  - `pnpm --dir /tmp/mc002-inta-fe lint`: Exit code 0 (zero errors/warnings).
- **Backend Worktree (`/tmp/mc002-inta-be`):** Clean at `52b60a4617081c41b949f2242e1784238c170f75`, zero diff.

---

## 4. Hash Manifest and Byte-Equality Verification

### 4.1 Raw Evidence (`/tmp/mc002-inta-evidence/frontend/r2/`)
| File | SHA256 Hash |
|---|---|
| `01-unit-tests.log` | `e403ee451d81ad7ab076259caf85f322cac3a3a38b015e48161e2d1e8bcfa3fb` |
| `02-harness-live-guards.log` | `0b48009866bde103d55485ae99558ebbdecf9beea58415baa2aeeb64b3728894` |
| `03-template-isolation.log` | `dc6c1bbc7e6abc181e8ddc4770ba3a50bbe233a0ddebeca4f6b6c529c468d651` |
| `harness-source.tar.gz` | `8d16d873eecc63c29b603ee966f919737384ffdea18f42be4804d98a74ed94c7` |
| `source-hashes.txt` | `a672bf6e4c12558e1e13d6e19f7e8da632a8ebc9d44000fcb3a230463668f04f` |

### 4.2 Reviewed Exports (`docs/testing/inta-returns/frontend/r2/`)
| File | SHA256 Hash | Raw Match |
|---|---|---|
| `10-harness-meta.txt` | `ac4b7c6830c168a5d5c9e8f37590e4bb44ccb51031a907da908c1d0c7181d0b5` | Meta |
| `11-unit-tests.log` | `e403ee451d81ad7ab076259caf85f322cac3a3a38b015e48161e2d1e8bcfa3fb` | Byte-identical to `01-unit-tests.log` |
| `12-live-guards.log` | `0b48009866bde103d55485ae99558ebbdecf9beea58415baa2aeeb64b3728894` | Byte-identical to `02-harness-live-guards.log` |
| `13-template-isolation.log` | `dc6c1bbc7e6abc181e8ddc4770ba3a50bbe233a0ddebeca4f6b6c529c468d651` | Byte-identical to `03-template-isolation.log` |
| `20-source-hashes.txt` | `a672bf6e4c12558e1e13d6e19f7e8da632a8ebc9d44000fcb3a230463668f04f` | Byte-identical to `source-hashes.txt` |
| `21-export-hashes.txt` | Manifest of export hashes (no self-hash cycle) | Verified |

All 4 raw/export pairs verified byte-identical via `cmp`.
Archive `harness-source.tar.gz` contains exactly 25 tracked source files, excluding `.git`, `node_modules`, `.next`, `.run-state`, and build artifacts, without macOS AppleDouble entries (`COPYFILE_DISABLE=1`).

---

## 5. Resource Disposition and Lifecycle Status

- **Harness Dev Server:** Gracefully stopped (PID terminated via SIGTERM, PID file unlinked).
- **Port 18085:** Verified closed.
- **Port 18086:** Verified closed (synthetic upstream observer closed in `finally` block).
- **PostgreSQL / Docker:** Zero containers spawned or modified by frontend.
- **Go Runtime:** Zero binaries built or executed by frontend.
- **Driver State:** Safe pause enforced. All upstream phase execution remains blocked pending Codex verified ENV handoff.

---

## 6. Skipped Work and Remaining Risks

- **Skipped Work:**
  - No product source, dependency, or lockfile modifications in `/tmp/mc002-inta-fe`.
  - No backend Go code edits, binary compilation, or migrations in `/tmp/mc002-inta-be`.
  - No database creation, container lifecycle, or PostgreSQL execution.
  - No production build, paid service invocation, or Cloudflare integration.
  - No changes to MC-003A or governance status records.
- **Remaining Risks:**
  - Real upstream transport across the cross-root template client, Go binary, and PostgreSQL instance remains unexercised until Codex provisions the isolated environment and executes the coordinated 36 cases.
  - All 51 matrix rows remain `NOT_RUN` awaiting actual runtime execution and independent OpenCode verification.
