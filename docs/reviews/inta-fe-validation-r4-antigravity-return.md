# MC-002-INTA-FE-VALIDATION-R4 — Antigravity Formal Return

**Status**: `SOURCE_CORRECTIONS_RETURNED / IN_REVIEW / RUNTIME_NOT_RELEASED`  
**Task ID**: `MC-002-INTA-FE-VALIDATION-R4`  
**Priority**: P0  
**Executor**: Actual Antigravity (Frontend Execution Owner, Gemini 3.8 Flash High)  
**Coordinating Role & Intake Recipient**: Codex (PM / Coordination Owner)  
**Independent QA Reviewer**: OpenCode  
**Coordination Branch**: `codex/unified-project-flow`  
**Base Commit**: `a62d838791ba188838c4ff00b7b6e265ac775056`  
**Execution Timestamp**: 2026-10-26T09:37:13Z  
**Workstation Environment**: macOS (darwin arm64), Node.js `v24.22.1`, Python `3.14.4`  
**Normative Authority**: Direct Human Product Owner Approval (2026-10-26, `INTA-LAUNCH-D01`, Option A), [`docs/implementation/inta-launch-contract-addendum.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/inta-launch-contract-addendum.md) (`INTA-1-LAUNCH-01`), [`docs/testing/inta-launch-approval-20261026/approval.json`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-launch-approval-20261026/approval.json)

---

## 1. Executive Summary & Review Scope

In accordance with handoff prompt [`MC-002-INTA-FE-VALIDATION-R4-ANTIGRAVITY-PROMPT.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/handoffs/MC-002-INTA-FE-VALIDATION-R4-ANTIGRAVITY-PROMPT.md), Antigravity has executed the targeted source-level and deterministic self-check corrections to resolve all carried and confirmed findings (**R2-I02..I06**, **R3-N01..N06**, **NF-1..NF-6**) raised during OpenCode's independent review of R3 ([`docs/reviews/inta-opencode-fe-r3-source-review.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/reviews/inta-opencode-fe-r3-source-review.md)).

- **Option A Boundary Preserved**: The supported harness entrypoint is a reviewed guard-first launcher (`harness-dev.mjs`); raw direct Next CLI bypass is unsupported for never-listen and its historical `FAIL_OBSERVED_LISTENER` stands.
- **Fail-Fast Signal Safety Established (R3-N03)**: Real `os.kill` was monkeypatched with a fail-fast assertion guard across `selfcheck-r4.py`. All tests injected an isolated in-memory `MockSignalTracker`. Zero real signals (including signal 0) were sent to any unowned real OS process.
- **Pure / Mock Execution Only**: **Zero live runtime released**. No live Next.js development server, background HTTP observer, product build, Go backend, PostgreSQL, Docker container, or 7-stage validation replay was executed.
- **Zero Dependency Mutations**: No `npm install`, download, or file copies of dependencies. Read-only baselines at `/tmp/mc002-inta-fe` (`3e5a642`), `/tmp/mc002-inta-harness` (`48cc03e`), and `src/guards.ts` (`0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928`) remain pristine.
- **Deterministic Test Verification**:
  - [`selfcheck-r4.py`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/runner/selfcheck-r4.py): **46/46 PASS** (exit code 0).
  - [`test-launcher-mock.mjs`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/launcher/test-launcher-mock.mjs): **13/13 PASS** (exit code 0).
- **Exact Governance Evidence Delivered**: 22 payload files totaling 285,768 bytes delivered to raw evidence `/tmp/mc002-inta-evidence/frontend/validation-r4-20261026` and synchronized byte-for-byte (`diff -r` exit 0) to governance export [`docs/testing/inta-returns/frontend/validation-r4-20261026/`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/).

---

## 2. Comprehensive Per-Finding Mapping to Corrections

| Finding ID | Review Defect Description | Coherent Correction in R4 | Baseline Diffs | In-Process Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **R3-N01** / **R2-I03** | Cleanup identity was omitted across all 5 terminate call sites; early abort returns discarded results; wait-by-kill(0) polling substituted for true process handle reap. | Pass `expected_parent=os.getpid()`, `expected_name="node"`/`"python"`, and `process_handle` at all five call sites. Use `process_handle.wait(timeout)` to reap processes. All five call sites capture `(term_ok, term_err)` and append failures to `cleanup_errors`. Single `try/finally` wraps observer start so early bind errors reach cleanup and retained results. | [`diffs/coordinator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/coordinator.diff) | Tests 26–31, 37–40 in `selfcheck-r4.py`:<br>- Test 28: Handle reap via `wait()` and SIGTERM tracked.<br>- Test 29: Already-exited handle sends zero signals.<br>- Test 30: Handle wait timeout escalates.<br>- Test 31: PID mismatch denied.<br>- Tests 37–40: All abort and cleanup sites verified. |
| **R3-N02** / **R2-I02** / **NF-1** | PATH-resolved Node and Next binaries; unpinned cwd; observer Popen had unbounded ambient env; proposal and code allowlists conflicted on `SHELL`/`TMPDIR`. | Settled absolute executable paths (`/Users/nguyenvanlan/.nvm/versions/node/v24.22.1/bin/node`, `/tmp/mc002-inta-harness/node_modules/.bin/next`). Pinned cwd `/tmp/mc002-inta-harness`. Observer Popen runs with bounded `obs_env`. Reconciled 11-key allowlist including `SHELL`, `TMPDIR`, and `MC_INTA_STATE_DIR`. Authored formal binding record per addendum L18. | [`diffs/harness-dev.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/harness-dev.diff)<br>[`diffs/coordinator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/coordinator.diff)<br>[`implementation-binding-record-r4.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/proposals/implementation-binding-record-r4.md) | Tests 7–8, 13 in `test-launcher-mock.mjs` (bounded env with `SHELL`/`TMPDIR`, explicit bindings). Tests 34–40 in `selfcheck-r4.py`. |
| **R3-N03** / **R2-I06** | Selfcheck tests 20/21/25 lacked `kill_func` injection and could reach real `os.kill` / `SIGTERM` if mock PIDs existed on real OS. | Monkeypatched `os.kill = fail_fast_real_signal_guard` across entire `selfcheck-r4.py`. Injected `MockSignalTracker` into every test path. Proved observer cleanup in Test 38 via explicit `wait_calls > 0` and signal tracking assertions. | [`diffs/selfcheck.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/selfcheck.diff) | Test 38 asserts `obs_proc.wait_calls > 0` and `SIGTERM` delivery in mock tracker. Active fail-fast guard verified: zero unexpected signal violations occurred. |
| **R3-N04** / **C02** | Present-but-falsy error fields (e.g. `""`, `None`) were accepted; default parameters allowed evidence by omission. | In `guard_evaluator.py`, any presence of `"error"` in `observer_data` fails closed with `OBSERVER_ERROR`. Removed permissive default arguments (`during_sample_count=None`, `observer_exit_code=None`), failing closed on omission. Strict types enforced for counts and flags. | [`diffs/guard_evaluator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/guard_evaluator.diff) | Tests 16–18 in `selfcheck-r4.py`:<br>- Test 16: `error: ""` rejected (`OBSERVER_ERROR`).<br>- Test 17: `error: None` rejected (`OBSERVER_ERROR`).<br>- Test 18: `during_sample_count=None` rejected (`INCOMPLETE_EVIDENCE`). |
| **R3-N05** / **NF-2** | Canonical plan was mislabeled as 22 while containing 24 entries; `NODE_ENV=production` supported-path subcheck was missing; existing empty attempt directory was accepted. | Relabeled to `PLAN_VARIANTS_25` (24 = 11 remaining forbidden variables × 2 + API_MODE × 2; plus 1 = `NODE_ENV=production` subcheck). Handled `NODE_ENV=production` refusal phrase (`NODE_ENV cannot be production`). Collision check in coordinator and shell wrapper strictly refuses any existing directory (`os.path.exists`), without reuse or truncation. | [`diffs/coordinator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/coordinator.diff)<br>[`diffs/guard-validator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/guard-validator.diff) | Tests 41 & 44 in `selfcheck-r4.py` (collision check refuses existing directory with exit 2). Plan definition in `coordinator.py` verified at 25 entries. |
| **R3-N06** / **R2-I05** | T9 relative-path assertion used OR-fallback to absolute; writer durability lacked directory fsync; thin shell wrapper was never executed in tests; positive path & probe exceptions unexercised. | Removed T9 OR-fallback, asserting relative resolution directly (`path.relative(process.cwd(), currentFile)`). Added parent directory `fsync` in `observer.py`. Added test exercising `guard-validator-r4.sh` via controlled coordinator stub. Added tests for successful run (`VALID_COMPLETE_INPUT`), probe timeout, and probe exception. | [`diffs/test-launcher-mock.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/test-launcher-mock.diff)<br>[`diffs/observer.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/observer.diff)<br>[`diffs/selfcheck.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/selfcheck.diff) | Test 9 in `test-launcher-mock.mjs` (direct relative path). Tests 24–25, 33–34, 43 in `selfcheck-r4.py` (probe timeout/exec errors, writer replace error, wrapper stub dispatch, successful pass). |
| **NF-3** | Guard file pinning was comment-only; corrupt or missing guard surfaced as raw Node exception outside canonical refusal. | Implemented `verifyGuardIntegrity()` in `harness-dev.mjs`, computing SHA-256 at start and verifying match against `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928`. Throws diagnostic error and exits 1 if missing or tampered. | [`diffs/harness-dev.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/harness-dev.diff) | Test 11 in `test-launcher-mock.mjs` (verifies valid guard passes; missing or altered guard throws integrity error). |
| **NF-4** | Real coordinator PASS cadence was timing-dependent on whether child exited before first monitor loop probe. | Reordered monitor loop in `coordinator.py`: `probe_tcp_listener` is invoked at loop entry before evaluating `child_proc.poll()`, guaranteeing at least one during-run probe observation during the active execution window. Authored candidate proof basis document. | [`diffs/coordinator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/coordinator.diff)<br>[`fast-refusal-proof-basis-r4.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/proposals/fast-refusal-proof-basis-r4.md) | Test 34 in `selfcheck-r4.py` (passes `VALID_COMPLETE_INPUT` with `duringSampleCount=1`). |
| **NF-6** | Pre-bound port wording claimed listener was acquired "during execution" when nothing had executed yet. | In `guard_evaluator.py`, when `listener_during is True` and `exit_code is None`, notes state: `"listener observed at pre-flight (port already occupied)"`. | [`diffs/guard_evaluator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/diffs/guard_evaluator.diff) | Test 19 in `selfcheck-r4.py` (verifies pre-flight wording in notes). |

---

## 3. Architecture & Proposal Documents Delivered

Three authoritative documents have been authored and included in the governance export:
1. **[`implementation-binding-record-r4.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/proposals/implementation-binding-record-r4.md)**:
   - Formally fulfills INTA-1-LAUNCH-01 line 18.
   - Names exact settled versions (`node v24.22.1`, `python 3.14.4`), absolute executable paths, native type-stripping flags, cryptographic guard hash validation, exact cwd, and nextBin target.
   - Reconciles the 11-key allowlist and specifies clean-room observer environment.
   - Confirms the canonical 25-variant plan structure.
2. **[`dependency-isolation-plan-r4.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/proposals/dependency-isolation-plan-r4.md)**:
   - Outlines APFS Copy-on-Write (`cp -c`) staging, symlink boundary escape checks via `realpath`, and zero-mutation preservation.
   - Confirms candidate staging status (unperformed in R4).
3. **[`fast-refusal-proof-basis-r4.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/proposals/fast-refusal-proof-basis-r4.md)**:
   - Resolves NF-4 by specifying loop-entry probe ordering and 5-point evidence correlation (pre-flight absence, in-process refusal, zero child spawn proof, persisted zero upstream, post-probe absence).
   - Preserves fail-closed behavior for zero-sample runs (`LISTENER_UNKNOWN`).

---

## 4. Evidence Package & Governance Manifest

The governance export directory [`docs/testing/inta-returns/frontend/validation-r4-20261026/`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/) is byte-for-byte identical to the raw evidence directory `/tmp/mc002-inta-evidence/frontend/validation-r4-20261026/` (`diff -r` exit 0).

The export contains **22 payload files** totaling **285,768 bytes**, validated by a no-self-hash [`manifest.json`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r4-20261026/manifest.json):

```
manifest.json summary:
Total Payloads: 22
Total Payload Bytes: 285,768
Timestamp: 2026-10-26T09:37:13Z
```

### Manifest Payload Inventory
1. `credential-pattern-scan-r4.json` (292 B, SHA256: `365f7adb58077e06bffc16fe1bac7dfe8763579860f1c2386f4d4d3d6fadec15`) — 24 files scanned, 0 pattern matches found.
2. `diffs/coordinator.diff` (21,017 B, SHA256: `d6b8a4f4d3ac10c937932b1fa5db6da7ff94585eb149ffdc174b3c1d73d0527c`)
3. `diffs/guard-validator.diff` (2,072 B, SHA256: `f00f5f8b87321c63d6cf4bd52b38a02c6ae0b14d015e99995be99d25dc111810`)
4. `diffs/guard_evaluator.diff` (5,608 B, SHA256: `2f5d261f218121e7af56477da039cc6fb145b215d094cd50f806876837a6ac82`)
5. `diffs/harness-dev.diff` (6,802 B, SHA256: `95ee77d011a89939e0f1604bd9ff4ab10c738ece0d6261c49edef918b7912ad1`)
6. `diffs/observer.diff` (782 B, SHA256: `03ed6c3f06d1cbc98d6e889449039e15cd42677f4d52aa9265da60b0cf0d04e9`)
7. `diffs/selfcheck.diff` (76,678 B, SHA256: `0841129ea898151bc1311186e0d7f9aeee54b4a2e4be96b96c0dc028ed07bdf9`)
8. `diffs/test-launcher-mock.diff` (12,626 B, SHA256: `22d3cad1ac1b1387311bc2487a495fb92d4b3d96705b321f2f24dc9ddc50de6c`)
9. `launcher-mock.stdout.txt` (2,304 B, SHA256: `c50e33c66c3206a51ba3dc9dc65336d3fcea066a97fb47765d93e55c167b8a89`)
10. `launcher/harness-dev.mjs` (7,610 B, SHA256: `6d89694a2115aa28ce63f5e797de3e152f5033aaa50c30697fe9edaad5164e02`)
11. `launcher/test-launcher-mock.mjs` (13,011 B, SHA256: `4e734a19582c3bdca66aa561630d80e345f645f4d457a5493a24197e450f2408`)
12. `proposals/dependency-isolation-plan-r4.md` (4,947 B, SHA256: `ded266aef3243f3b4b1e76803a43b4a1c51ac5f7ca6978388f6179c66ac19a95`)
13. `proposals/fast-refusal-proof-basis-r4.md` (4,195 B, SHA256: `cb05e856f7f8872919c520ed1d9214d91fbb9257a747a89f22e9b15a97661f7d`)
14. `proposals/implementation-binding-record-r4.md` (5,883 B, SHA256: `62033f98acdf11fe33e360722e7d46f5b9567ae4c9989b72fc49712cc64dfee0`)
15. `r4-test-summary.json` (3,534 B, SHA256: `dea2233fdc4fbea56daffe84f49cffb35e3a0b3cd681efe692a14e1a7ee281ac`)
16. `runner/coordinator.py` (25,452 B, SHA256: `e77ff416beb12638119a23517f6d1bede567059a8ba0d967346161625b8f8caa`)
17. `runner/guard-validator-r4.sh` (1,610 B, SHA256: `e1c579ce75a5f4d06cf8418f6176141967f242d68eb51205d3ef40429bb2f404`)
18. `runner/guard_evaluator.py` (9,767 B, SHA256: `e6a54a786834ed69de78a7c30f2e5caed01721338600b224d9168c90c1de72f1`)
19. `runner/observer.py` (6,283 B, SHA256: `b5cef31ee33722ab585a393120a0a0cbe0517b2285e6b230205cf967da996c2c`)
20. `runner/selfcheck-r4-results.json` (18,924 B, SHA256: `0e917fa77b7f691160eb204b799e19d80735332ff2ed3571a15f1cf7786487ad`)
21. `runner/selfcheck-r4.py` (50,787 B, SHA256: `5d1811f3f077f7a9f43ea5f4a47b72453e39f94e991feed996fe7452f4a266c5`)
22. `selfcheck-r4.stdout.txt` (5,584 B, SHA256: `058ce49cab4c32da246bc96953492125ddd9f463f01f1d5b665e358a460c61c0`)

---

## 5. Preserved Historical Status and Unchanged Results

All **51 formal verification results** remain strictly preserved and unchanged:
- **36 required cases**:
  - `FEVAL_F01`: `FAIL_OBSERVED_LISTENER` permanently retained for raw direct Next CLI.
  - `FEVAL_F02`: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` retained for the 21 historical variants pending authorized live execution on the new supported launcher path.
  - Historical variant evidence preserved at `docs/testing/inta-returns/frontend/validation-r1-20261026/retained-variant-evidence/` (66 files).
- **14 product-deferred cases**: Unchanged.
- **1 external-blocked case** (`T11c`): `OUTCOME_UNKNOWN` retained.
- **Current PostgreSQL Status**: Preserved stopped and retained, exit code 0, per separate Codex return. Antigravity did not inspect, connect, start, or stop PostgreSQL.
- **Teardown & Final QA Gates**: Actual runtime secret scans, same-PG final teardown, dynamic cache, and full end-to-end conformance remain open gates owned by Codex and OpenCode.
- **No Early Stage Progression**: No claim of MC-002 DONE, Step 03B, production release, or Cloudflare/cost signoff.

---

## 6. Work Skipped & Remaining Risks

### Work Skipped
1. **Live Next.js Server & Runtime Observation**: Zero live processes spawned; port 18085 was not opened; observer port 18086 was not bound to live network.
2. **Dependency Modifications**: Zero `npm install`, `pnpm install`, or dependency tree copying executed.
3. **Product & Harness Modifications**: The baseline frontend at `/tmp/mc002-inta-fe` and harness at `/tmp/mc002-inta-harness` were preserved read-only.
4. **PostgreSQL Operations**: Database remained untouched in its stopped state.
5. **Git Operations**: Zero git staging, committing, stashing, merging, or pushing performed.

### Remaining Risks
1. **Staging Prerequisites**: Staging of `node_modules` via APFS CoW cloning and verification of `.bin`/`.pnpm` symlinks must be performed by Codex prior to live execution.
2. **Live Environment Execution**: While all mock, fail-closed, signal safety, and type-stripping tests pass 100%, actual live process execution on Darwin arm64 under high concurrency awaits the formal Codex runtime cue following independent OpenCode review PASS.
