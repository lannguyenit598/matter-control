# MC-002-INTA-FE-R3 — Frontend Owner Return (R3 Companion Rework Complete; Runtime WAITING_ENV)

- **Owner & Role:** Antigravity (actual frontend owner MC-002-INTA-FE), model Gemini 3.8 Flash (High thinking, owner-reported).
- **Authority:** DEC-028 / INT-D01=INT-A APPROVED (subject `e7dbfbf`).
- **Reviewer:** OpenCode (actual independent QA role, packet re-review).
- **Proposed Status:** **IN_REVIEW (rework complete, preparation evidence qualified) / runtime WAITING_ENV.**
- **Matrix Status:** All 51 canonical rows remain **NOT_RUN** (36 required for selected slice, 14 deferred to later product, 1 blocked by external production feasibility). Zero rows awarded PASS. MC-002 and C01-PRODUCT remain OPEN.

---

## 1. Acknowledgement and Workspace Provenance

| Dimension | Value / Provenance |
|---|---|
| Task ID | `MC-002-INTA-FE-R3` |
| Agent Identity | Antigravity (actual frontend owner) |
| Model & Settings | Gemini 3.8 Flash (Thinking High, owner-reported) |
| Governance Root | `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` |
| Governance Branch | `task/MC-002-solution-architecture` |
| Base Commit (Harness) | `79322fcb2c72bb3db20d55f3f3fc860e7e7ee2dc` (verified clean before edits) |
| Head Commit (Harness) | `cfec8694799634b05438764aec56858dc26c8764` |
| Harness Branch | `codex/mc-002-inta-harness-r3` in `/tmp/mc002-inta-harness` |
| Template Worktree | `/tmp/mc002-inta-fe` on `codex/mc-002-inta-fe`, clean at `3e5a642479acb789eb210e73fba956f3e85082e3` (zero tracked diff) |
| Go Backend Worktree | `/tmp/mc002-inta-be` clean at `52b60a4617081c41b949f2242e1784238c170f75` (untouched by frontend) |
| Pinned Installed Packages | Next.js 16.4.2, React 19.3.1, TypeScript 5.9.3, ESLint 9.39.5 |
| Input Governance Docs | Read in full: `project-status.md`, `inta-po-approval.md` (DEC-028), `inta-approved-contract.md` (INTA-1), `MC-002-INT-A.md`, `inta-coordination.md`, `integration-acceptance-matrix.md`, `step-02-4-runtime-classification.md`, `inta-frontend-r2-return.md`, `inta-frontend-r2-opencode-review.md`, `inta-frontend-r2-intake.md` |

---

## 2. Review Findings Disposition (MC-002-INTA-FE-R2-F01 .. F09)

### MC-002-INTA-FE-R2-F01 — Causal Lifecycle Barriers & Staged Sequencing (RESOLVED)
- **Files Modified:** `src/driver.ts` (lines 40–100, 970–1450), `tests/driver.test.ts`.
- **Causal Stage Order Enforcement:**
  - Redesigned driver execution into 7 explicit staged commands (`stage1` .. `stage7`) matching the exact external lifecycle boundaries:
    - `stage1`: Baseline & initial negatives (`T1`, `T2`, `W1`, `W2`, `T3`, `T4`, `T5`, `T8`, `W3`, `T6-W`, `T7-W`), records immutable Checkpoint A (version 1), prompts for ZCode Go restart.
    - `stage2`: Readback `INT-PERS-01` after Go restart.
    - `stage3`: Readback `INT-PERS-02` after PostgreSQL restart.
    - `stage4`: Mutations & stale update (`T9`, `W9`, `T10`), updates mutable current checkpoint to version 2, prompts for Codex PG stop.
    - `stage5`: Outage operations (`T11a`, `T11b`, `T11c`, `W11`), preserves `userXOutcome = OUTCOME_UNKNOWN`, prompts for Codex PG restart.
    - `stage6`: Recovery readbacks (`INT-PERS-03`, `INT-PERS-04`), prompts for ZCode Go stop.
    - `stage7`: Shutdown check `T12` (`NETWORK_ERROR` / `unavailable`).
  - Durable stage-completion markers are persisted atomically to `.run-state/stages/<runId>/stage<N>.completed`.
  - Every stage verifies prior stages: `stageN` checks `isStageCompleted(N - 1)`. If missing, the driver throws `Stage N refused: previous stage N-1 is not completed for runId ...` before performing **any network I/O**.
- **Explicit Operator Confirmation Flags:**
  - External lifecycle actions are outside the frontend process boundary. To prevent racing external restarts, restart-dependent stages refuse without explicit operator confirmation:
    - Stage 2 requires `--confirm-go-restarted` or `MC_INTA_CONFIRM_GO_RESTARTED=1`.
    - Stage 3 requires `--confirm-pg-restarted` or `MC_INTA_CONFIRM_PG_RESTARTED=1`.
    - Stage 5 requires `--confirm-pg-stopped` or `MC_INTA_CONFIRM_PG_STOPPED=1`.
    - Stage 6 requires `--confirm-pg-recovered` or `MC_INTA_CONFIRM_PG_RECOVERED=1`.
    - Stage 7 requires `--confirm-go-stopped` or `MC_INTA_CONFIRM_GO_STOPPED=1`.
  - Missing confirmation immediately pauses the driver with exit code 2 and outputs a clear prompt with zero upstream calls.

### MC-002-INTA-FE-R2-F02 — Pre-Dispatch Intent Reservation & No-Replay Enforcement (RESOLVED)
- **Files Modified:** `src/driver.ts` (lines 350–430), `tests/driver.test.ts`.
- **Pre-Dispatch Intent Guard:**
  - Checking the write-once envelope ledger *after* fetch allows mutations to execute upstream before throwing on replay.
  - Implemented `reserveSubstepIntent(caseId)`: atomically checks `.run-state/substeps/<runId>/<caseId>.status` before `dispatchCaseToHarness`.
  - Refuses dispatch immediately if status is `started`, `completed`, or `unknown`:
    `Duplicate execution refused by pre-dispatch intent guard: case ${caseId} is already marked ${status} for runId ${this.runId}`.
  - Atomically writes `started` status with timestamp to disk.
  - After dispatch and assertion, `completeSubstepIntent(caseId)` marks status `completed`.
  - For T11c, status is marked `unknown` (`OUTCOME_UNKNOWN`), durably blocking any future re-POST or retry.
  - If status file contains corrupt or invalid JSON, it fails closed with `Pre-dispatch intent guard corrupt for case ${caseId}`.

### MC-002-INTA-FE-R2-F03 — Preflight Separation & External Boundary Respect (RESOLVED)
- **Files Modified:** `src/driver.ts` (lines 140–210), `tests/driver.test.ts`.
- **Removed Frontend Docker-PS Coupling:**
  - Removed `execSync('docker ps ...')` from frontend driver runtime paths. Container lifecycle and verification are owned by Codex, not frontend.
  - Preflight separates fresh reservation from operating/resuming:
    - In fresh mode (`allowResume=false`), refuses if runId assets already exist in `envelopes`, `checkpoints`, `counters.json`, or `stages`.
    - In resume mode (`allowResume=true`), allows existing same-run assets while strictly refusing foreign/mismatched collisions.
  - Fail-closed on corrupt `counters.json`: syntax errors or non-object structures immediately throw `Preflight collision check failed: counters.json is corrupt`.
  - All readiness checks remain confined to the driver CLI only; zero route/auth policy alterations in Next.js.

### MC-002-INTA-FE-R2-F04 & F05 — Provenanced Process Termination & Cleanup Hygiene (RESOLVED)
- **Files Modified:** `scripts/stop-harness.sh`, `scripts/live-guards.ts`.
- **Exact Provenance Comparison in `stop-harness.sh`:**
  - Replaced broad `pgrep -f "next dev"` matching with exact provenance verification.
  - Harness writes `.run-state/harness.provenance` on spawn containing `PID`, `START_TIME`, and `COMMAND`.
  - `stop-harness.sh` reads provenance, verifies PID > 0, inspects target via `ps -p "$TARGET_PID" -o lstart=,command=`, and compares exact start time and command against recorded values.
  - If PID is missing, stale, mismatched, non-numeric, 0, or negative, `stop-harness.sh` exits with code 1 and sends **zero signals**.
  - Verified termination: waits up to 5 seconds for PID exit; verifies port 18085 is closed before returning 0.
- **Guard Script Hygiene in `live-guards.ts`:**
  - Removed all `process.exit(1)` calls from inside the `try` block.
  - All unexpected errors re-throw through the single protected `finally` block.
  - `finally` closes the synthetic upstream observer and terminates all active child processes recorded in `activePids`.
  - `activePids` are retained until exit is explicitly observed; timeouts escalate from SIGTERM to SIGKILL without prematurely deleting the tracking record.
  - Verified port 18085 closed check before concluding.

### MC-002-INTA-FE-R2-F06 — Strict Wire Echo Assertions (RESOLVED)
- **Files Modified:** `src/driver.ts` (lines 430–460, 560–640, 810–835, 890–915), `tests/driver.test.ts`.
- **Explicit Echo Verification:**
  - Added `assertWireEcho(envelope, caseId)` helper enforcing INTA-1 §C wire requirement:
    `const echoed = envelope.wire?.headers?.['x-request-id']; if (echoed !== envelope.requestId) throw new Error(...)`.
  - Integrated into all 7 wire cases: `W1`, `W2`, `W3`, `T6-W`, `T7-W`, `W9`, and `W11`.
  - Regression tested with missing, mismatched, and valid echo headers.

### MC-002-INTA-FE-R2-F07 — Durable Assertions & Checkpoint Split (RESOLVED)
- **Files Modified:** `src/driver.ts` (lines 230–330, 760–810), `tests/driver.test.ts`.
- **Immutable Baseline Snapshot vs Current Checkpoint:**
  - T1 creates `checkpointA.baseline.json` (version 1) and `checkpointA.current.json` (version 1).
  - T9 updates only `checkpointA.current.json` to version 2; `checkpointA.baseline.json` remains permanently immutable at version 1.
  - Subsequent readbacks (`INT-PERS-01`, `INT-PERS-02`, `T5`, `T8`) verify against immutable baseline, while post-mutation checks (`T10`, `INT-PERS-03`, `INT-PERS-04`) verify against current.
- **Durable Assertions Persistence:**
  - Every assertion recorded via `recordAssertion(caseId, pass, notes, blocked)` is written atomically to `.run-state/assertions/<runId>.json`.
  - Re-instantiation with `allowResume=true` calls `loadAssertions()` to restore all prior results.
  - Clarified truthfulness: 23 canonical cases are endpoint operations executed by the driver; 13 cases are external-owner lifecycle procedures (`INT-ENV-01..07`, `INT-LOG-01..02`, `INT-CLN-01..04`) tracked as durable milestones.

### MC-002-INTA-FE-R2-F08 — Single Upstream Attempt (RE-AFFIRMED)
- Zero automatic retries, duplicate writes, or probes are executed to obtain wire headers or recover from errors.

### MC-002-INTA-FE-R2-F09 — Aligned RunId Regex & Error Bounding (RESOLVED)
- **Files Modified:** `src/request-id.ts` (line 12), `app/harness/case/route.ts` (line 62).
- Updated `RUN_ID_REGEX` to `/^[a-zA-Z0-9]{8,32}$/` matching schema across all modules.
- Bounded generic 400 responses in `route.ts`: error internals are never reflected in response payloads.

---

## 3. Verification Evidence

### 3.1 Unit Test Suite (`11-unit-tests.log`)
- **Command:** `rtk pnpm test`
- **Working Directory:** `/tmp/mc002-inta-harness` (commit `cfec8694799634b05438764aec56858dc26c8764`)
- **Results:** **87 passed in 7 test files** (0 failures, 0 skipped), duration 301ms, exit code 0.
  - `tests/fixtures.test.ts`: 2 tests passed
  - `tests/envelope.test.ts`: 6 tests passed
  - `tests/guards.test.ts`: 34 tests passed
  - `tests/request-id.test.ts`: 6 tests passed
  - `tests/schemas.test.ts`: 11 tests passed
  - `tests/executor.test.ts`: 8 tests passed
  - `tests/driver.test.ts`: 20 tests passed (+7 new regression tests covering causal stage ordering, operator confirmation barriers, pre-dispatch intent reservation, corrupt intent fail-closed, wire echo mismatch, preflight resume/corrupt counters, durable assertions and baseline checkpoint immutability)

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

### 4.1 Raw Evidence (`/tmp/mc002-inta-evidence/frontend/r3/`)
| File | SHA256 Hash |
|---|---|
| `01-unit-tests.log` | `f46e2407cdedb93b99702a688c8691e4174f94699139d91819bf7e3c4b240143` |
| `02-harness-live-guards.log` | `eb18f293df8755cab531a3806fa393fef1fc18d53ede4758a61b60fe395cc846` |
| `03-template-isolation.log` | `040ac25dc0d09146641fdf5d22922c42ab4a6d9ac7acb0886586603bd702b44b` |
| `harness-source.tar.gz` | `d2b1f92a00539ef55e186e69fa3bb767496f6a4226df58df0e4e2dbd42218334` |
| `source-hashes.txt` | `946165012e0b366fb50387a3706bb4e3fd50b7c3c08d4a4d7ccb438ba11577f7` |

### 4.2 Reviewed Exports (`docs/testing/inta-returns/frontend/r3/`)
| File | SHA256 Hash | Raw Match |
|---|---|---|
| `10-harness-meta.txt` | `a08e71138ee5501899225368053db6c426cfb6ae47edd4a77ba71932280d5ec6` | Meta |
| `11-unit-tests.log` | `f46e2407cdedb93b99702a688c8691e4174f94699139d91819bf7e3c4b240143` | Byte-identical to `01-unit-tests.log` |
| `12-live-guards.log` | `eb18f293df8755cab531a3806fa393fef1fc18d53ede4758a61b60fe395cc846` | Byte-identical to `02-harness-live-guards.log` |
| `13-template-isolation.log` | `040ac25dc0d09146641fdf5d22922c42ab4a6d9ac7acb0886586603bd702b44b` | Byte-identical to `03-template-isolation.log` |
| `20-source-hashes.txt` | `946165012e0b366fb50387a3706bb4e3fd50b7c3c08d4a4d7ccb438ba11577f7` | Byte-identical to `source-hashes.txt` |
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
