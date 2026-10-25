# MC-002-INTA-FE-R4 — Frontend Owner Return (R4 Bounded Source Corrections Complete; Runtime WAITING_ENV)

- **Owner & Role:** Antigravity (actual frontend owner MC-002-INTA-FE), model Gemini 3.8 Flash (High thinking, owner-reported).
- **Authority:** DEC-028 / INT-D01=INT-A APPROVED (subject `e7dbfbf`).
- **Reviewer:** OpenCode (actual independent QA role, packet re-review).
- **Proposed Status:** **IN_REVIEW (bounded source corrections complete, preparation evidence qualified) / runtime WAITING_ENV.**
- **Matrix Status:** All 51 canonical rows remain **NOT_RUN** (36 required for selected slice, 14 deferred to later product, 1 blocked by external production feasibility). Zero rows awarded PASS. MC-002 and C01-PRODUCT remain OPEN.

---

## 1. Acknowledgement and Workspace Provenance

| Dimension | Value / Provenance |
|---|---|
| Task ID | `MC-002-INTA-FE-R4` |
| Agent Identity | Antigravity (actual frontend owner) |
| Model & Settings | Gemini 3.8 Flash (Thinking High, owner-reported) |
| Governance Root | `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` |
| Governance Branch | `task/MC-002-solution-architecture` |
| Base Commit (Harness) | `cfec8694799634b05438764aec56858dc26c8764` (verified clean before edits) |
| Head Commit (Harness) | `48cc03e949d66fc47a7d304413621eb79804e6c1` |
| Harness Branch | `codex/mc-002-inta-harness-r4` in `/tmp/mc002-inta-harness` |
| Template Worktree | `/tmp/mc002-inta-fe` on `codex/mc-002-inta-fe`, clean at `3e5a642479acb789eb210e73fba956f3e85082e3` (zero tracked diff) |
| Go Backend Worktree | `/tmp/mc002-inta-be` clean at `52b60a4617081c41b949f2242e1784238c170f75` (untouched by frontend) |
| Pinned Installed Packages | Next.js 16.4.2, React 19.3.1, TypeScript 5.9.3, ESLint 9.39.5 |
| Input Governance Docs | Read in full: `project-status.md`, `inta-po-approval.md` (DEC-028), `inta-approved-contract.md` (frozen INTA-1), `MC-002-INT-A.md`, `inta-coordination.md`, `integration-acceptance-matrix.md`, `inta-frontend-r3-return.md`, `inta-frontend-r3-opencode-review.md`, `inta-frontend-r3-intake.md`, `docs/testing/inta-frontend-r3-intake/codex-focused-intent-repro.stdout.json` |

---

## 2. Review Findings Disposition (MC-002-INTA-FE-R3-F01 .. F07)

### MC-002-INTA-FE-R3-F01 — Existing Intent File Must Never Authorize New Dispatch (RESOLVED)
- **Problem:** Codex repro (`codex-focused-intent-repro.stdout.json`) demonstrated that an empty object `{}` status file bypassed the check `st.state === 'started' || ...` and got overwritten with `{ state: 'started' }`, executing dispatch.
- **Files Modified:** `src/driver.ts` (lines 352–415), `tests/driver.test.ts`.
- **Fail-Closed Resolution:**
  - Hardened `reserveSubstepIntent(caseId)`: ANY existing status file blocks before network I/O.
  - If the status file exists, the driver parses it. If it contains a known state (`started`, `completed`, `unknown`) and matching `caseId`, it throws:
    `Dispatch refused by one-shot intent guard: case ${caseId} is already ${data.state} for runId ${this.runId}`.
  - If the status file exists but contains an unrecognized state (e.g. `{}`), missing `caseId`, mismatched `caseId`, non-object, `null`, or invalid JSON, it immediately throws:
    `Dispatch refused by one-shot intent guard: invalid or unrecognized existing intent status for case ${caseId} in runId ${this.runId}`.
  - Under no circumstances does an existing intent file authorize a new fetch or dispatch.
  - Intent reservation occurs strictly before `dispatchCaseToHarness`.
  - Regression tested in `tests/driver.test.ts` across `{}`, `{ state: 'garbage' }`, mismatched `caseId`, `null`, and truncated syntax: all 5 reject with zero network requests.

### MC-002-INTA-FE-R3-F02 — Stop Ownership Requires Nonempty Matching Recorded Identity (RESOLVED)
- **Problem:** Blank `PROV_START` or unnormalized whitespace could allow an unverified target process to be signaled, or fail to prove ownership.
- **Files Modified:** `scripts/stop-harness.sh`, `scripts/live-guards.ts`, `tests/driver.test.ts`.
- **Identical Normalization & Zero Signals on Mismatch:**
  - `stop-harness.sh` extracts `PROV_PID`, `PROV_START`, and `PROV_CMD` from `.run-state/harness.provenance`.
  - Normalizes recorded and actual `ps` identity strings identically: strips carriage returns (`\r`), collapses multi-spaces, and trims leading/trailing whitespace.
  - Requires nonempty `PROV_PID`, `PROV_START_NORM`, and `PROV_CMD_NORM`. If any field is empty, blank, or missing, it outputs an error, exits with code 1, sends **zero signals**, and **retains the files** for manual operator inspection.
  - Compares normalized start time and normalized command against live `ps -p ${TARGET_PID} -o lstart=,command=`. Any mismatch exits 1 with zero signals and retains files.
  - In `scripts/live-guards.ts`, `recordProvenance` throws an error if `startTime` or `command` capture is empty, preventing unverified provenance files from ever being written.
  - Regression tested in `tests/driver.test.ts`: blank start time, blank command, mismatched command, and mismatched start time all exit 1, send 0 signals (process remains alive), and retain provenance files; valid matching provenance terminates process and unlinks files.

### MC-002-INTA-FE-R3-F03 — Atomic Stage Marker Writes & Fail-Closed Durable State Loaders (RESOLVED)
- **Problem:** Direct `writeFileSync` on stage markers could leave truncated files on sudden termination. Swallowing errors in `loadCheckpoint` or `loadAssertions` could allow corrupted state to silently degrade.
- **Files Modified:** `src/driver.ts` (lines 240–345, 980–1040), `tests/driver.test.ts`.
- **Atomic Writes & Fail-Closed Parsers:**
  - `markStageCompleted(stageNum)` writes marker JSON to a temp file (`.stage<N>.completed.tmp`) and atomically renames it to `.stage<N>.completed`.
  - `isStageCompleted(stageNum)` validates that the marker file exists, is valid JSON, and contains `data.stage === stageNum`. Any truncation, corrupt syntax, or stage mismatch returns `false`.
  - At the top of `runStage(stageNum)`, the driver checks `isStageCompleted(stageNum)` and throws `Stage ${stageNum} refused: stage is already completed for runId ${this.runId}` before performing any I/O.
  - `loadCheckpoint()` and `loadAssertions()` removed all silent `catch {}` blocks. If an existing state file cannot be read or parsed, it throws an immediate fail-closed error preventing resumption on corrupted state.
  - Regression tested in `tests/driver.test.ts`: corrupt stage markers, corrupt assertions, and corrupt checkpoints fail closed immediately.

### MC-002-INTA-FE-R3-F04 — Deterministic Fake-Transport Runner Fixture (RESOLVED)
- **Problem:** Need an automated, deterministic runner fixture verifying the full 7-stage causal pipeline without spinning up Go or PostgreSQL.
- **Files Modified:** `tests/driver.test.ts` (lines 800–1520).
- **Comprehensive Fixture Implementation:**
  - Implemented `deterministic fake-transport runner fixture exercises full stage1..7 orchestration in causal order (R3-F04)` in `tests/driver.test.ts`.
  - Intercepts `global.fetch` inside Vitest to return fully conforming `HarnessEnvelope` substep arrays for all 23 companion endpoint cases.
  - Verifies exact sequential progression from Stage 1 through Stage 7:
    - Stage 1: 11 dispatches (`T1`, `T2`, `W1`, `W2`, `T3`, `T4`, `T5`, `T8`, `W3`, `T6-W`, `T7-W`), creates baseline checkpoint.
    - Stage 2: 1 dispatch (`INT-PERS-01`), verifies baseline User A unchanged.
    - Stage 3: 1 dispatch (`INT-PERS-02`), verifies baseline User A unchanged.
    - Stage 4: 3 dispatches (`T9`, `W9`, `T10`), updates checkpoint to version 2, verifies stale 412.
    - Stage 5: 4 dispatches (`T11a`, `T11b`, `T11c`, `W11`), verifies 503 outage and marks User X `unknown`.
    - Stage 6: 2 dispatches (`INT-PERS-03`, `INT-PERS-04`), verifies version 2 preserved after PG restart.
    - Stage 7: 1 dispatch (`T12`), verifies 0 / `NETWORK_ERROR` shutdown state.
  - Verifies causal pause enforcement when operator confirmation flags are omitted.
  - Verifies dispatch count: exactly 23 requests sent.
  - Verifies persistent reload: re-instantiated driver loads prior assertions and checkpoints.
  - Verifies intent guard: attempting to re-dispatch a completed stage throws before I/O with 0 network calls.
  - Verifies crash replay: simulated crash in `started` state throws on resume before I/O with 0 network calls.
  - Verifies unknown guard: `T11c` in `unknown` state refuses re-POST with 0 network calls.

### MC-002-INTA-FE-R3-F05 — Prohibit Legacy `phase*` Commands; Use Canonical `stage1`..`stage7` Only (RESOLVED)
- **Problem:** Legacy `phase1`..`phase7` references in driver methods and CLI dispatch created potential ambiguity.
- **Files Modified:** `src/driver.ts` (lines 1420–1660).
- **Canonical Stage Commands Only:**
  - Removed `runPhase(phaseNum)` method entirely from `HarnessDriver`.
  - Removed `phaseMatch` dispatch from CLI `main()`.
  - CLI `main()` accepts only canonical stage subcommands: `stage1`, `stage2`, `stage3`, `stage4`, `stage5`, `stage6`, `stage7` (or `all` / `resume`).
  - Passing any legacy `phase*` argument prints an error and exits with code 1.

### MC-002-INTA-FE-R3-F06 — Correct 13 External-Owner Procedure IDs in Lifecycle Summary (RESOLVED)
- **Problem:** Summary printout in driver used temporary internal labels instead of canonical procedure IDs.
- **Files Modified:** `src/driver.ts` (lines 1390–1415).
- **Exact Canonical Procedure IDs:**
  - Updated driver summary output to reference the exact 13 external-owner procedures:
    `INT-ENV-01..07`, `INT-COR-01`, `INT-PRIV-01`, `INT-ISO-01..03`, `INT-CONF-01`.
  - Total accounting: 23 companion endpoint cases + 13 external lifecycle procedures = 36 required cases in selected slice.

### MC-002-INTA-FE-R3-F07 — Process Exit Observation and Preflight Collision Scope (RESOLVED)
- **Files Modified:** `scripts/live-guards.ts` (lines 105–120), `src/driver.ts` (lines 150–210).
- **Rider (a) — Process Exit Observation:**
  - In `scripts/live-guards.ts`, `stopOwnedHarness` waits up to 2000ms after `process.kill(pid, 'SIGKILL')` to observe process exit via `process.kill(pid, 0)` before unlinking `PID_FILE` and `PROVENANCE_FILE`.
- **Rider (b) — Comprehensive RunId Collision Check:**
  - In `src/driver.ts`, `assertNoRunIdCollision` checks `.run-state/substeps/<runId>`, `.run-state/stages/<runId>`, and `.run-state/assertions/<runId>.json` in addition to `envelopes/<runId>` and `checkpoints/<runId>`. Any existing asset throws preflight collision error before execution.

---

## 3. Verification Evidence

### 3.1 Unit Test Suite (`11-unit-tests.log`)
- **Command:** `rtk pnpm test`
- **Working Directory:** `/tmp/mc002-inta-harness` (commit `48cc03e949d66fc47a7d304413621eb79804e6c1`)
- **Results:** **91 passed in 7 test files** (0 failures, 0 skipped), duration 492ms, exit code 0.
  - `tests/fixtures.test.ts`: 2 tests passed
  - `tests/envelope.test.ts`: 6 tests passed
  - `tests/guards.test.ts`: 34 tests passed
  - `tests/request-id.test.ts`: 6 tests passed
  - `tests/schemas.test.ts`: 11 tests passed
  - `tests/executor.test.ts`: 8 tests passed
  - `tests/driver.test.ts`: 24 tests passed (+4 new regression tests covering corrupt intent fail-closed, corrupt stage markers, deterministic fake-transport 7-stage orchestration with 23 dispatches, and stop-harness provenance identity normalization)

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

### 4.1 Raw Evidence (`/tmp/mc002-inta-evidence/frontend/r4/`)
| File | SHA256 Hash |
|---|---|
| `01-unit-tests.log` | `809def5d233b0d8bf7ed889d2259d6e511f1f2f7a4e00c3d410c8850ac93043b` |
| `02-harness-live-guards.log` | `0a8733016a2091a79e48cef87d01a1e908c256127d625c28ad07327ba8a838e9` |
| `03-template-isolation.log` | `77071fb0548eb1f682efbd591f9114879e29eb1d5316bc78a66b61de00338b1d` |
| `harness-source.tar.gz` | `78823fab1f96a00113585b7a080b88bd6a143af88de39628cb4606ea35404f44` |
| `source-hashes.txt` | `cd5866e73d0a68ab731f8206cc6ce3226235ee2c8ca2c2df6036acfb0a980bf9` |

### 4.2 Reviewed Exports (`docs/testing/inta-returns/frontend/r4/`)
| File | SHA256 Hash | Raw Match |
|---|---|---|
| `10-harness-meta.txt` | `49f465b24fee0b0163d6745a091c0332bfc92e682270b1d64d79049d1316109c` | Meta |
| `11-unit-tests.log` | `809def5d233b0d8bf7ed889d2259d6e511f1f2f7a4e00c3d410c8850ac93043b` | Byte-identical to `01-unit-tests.log` |
| `12-live-guards.log` | `0a8733016a2091a79e48cef87d01a1e908c256127d625c28ad07327ba8a838e9` | Byte-identical to `02-harness-live-guards.log` |
| `13-template-isolation.log` | `77071fb0548eb1f682efbd591f9114879e29eb1d5316bc78a66b61de00338b1d` | Byte-identical to `03-template-isolation.log` |
| `20-source-hashes.txt` | `cd5866e73d0a68ab731f8206cc6ce3226235ee2c8ca2c2df6036acfb0a980bf9` | Byte-identical to `source-hashes.txt` |
| `21-export-hashes.txt` | Manifest of export hashes (no self-hash cycle) | Verified |

All 4 raw/export pairs verified byte-identical via `cmp`.
Archive `harness-source.tar.gz` contains exactly 25 tracked source files, excluding `.git`, `node_modules`, `.next`, `.run-state`, and build artifacts, without macOS AppleDouble entries (`COPYFILE_DISABLE=1`).

---

## 5. Resource Disposition and Lifecycle Status

- **Harness Dev Server:** Gracefully stopped (PID terminated via verified SIGTERM, provenance unlinked).
- **Port 18085:** Verified closed.
- **Port 18086:** Verified closed (synthetic upstream observer closed in `finally` block).
- **PostgreSQL / Docker:** Zero containers spawned or modified by frontend.
- **Go Runtime:** Zero binaries built or executed by frontend.
- **Driver State:** Safe pause enforced. All upstream stage execution remains blocked pending Codex verified ENV handoff.

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
