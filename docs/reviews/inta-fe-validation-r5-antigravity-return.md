# MC-002-INTA-FE-VALIDATION-R5 — Antigravity Formal Return

**Status**: `SOURCE_CORRECTIONS_RETURNED / IN_REVIEW / RUNTIME_NOT_RELEASED`  
**Task ID**: `MC-002-INTA-FE-VALIDATION-R5`  
**Priority**: P0  
**Executor**: Actual Antigravity (Frontend Execution Owner, Gemini 3.8 Flash High)  
**Coordinating Role & Intake Recipient**: Local Codex (PM / Coordination Owner)  
**Independent QA Reviewer**: Actual OpenCode  
**Coordination Branch**: `codex/unified-project-flow`  
**Base Commit**: `a62d838791ba188838c4ff00b7b6e265ac775056`  
**Execution Timestamp**: 2026-10-26T14:58:00Z  
**Workstation Environment**: macOS (darwin arm64), Node.js `v24.22.1`, Python `3.14.4`  
**Normative Authority**: Direct Human Product Owner Approval (2026-10-26, `INTA-LAUNCH-D01`, Option A), [`docs/implementation/inta-launch-contract-addendum.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/inta-launch-contract-addendum.md) (`INTA-1-LAUNCH-01`), [`docs/testing/inta-launch-approval-20261026/approval.json`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-launch-approval-20261026/approval.json)  

---

## 1. Executive Summary & Review Scope

In accordance with handoff prompt [`MC-002-INTA-FE-VALIDATION-R5-ANTIGRAVITY-PROMPT.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/handoffs/MC-002-INTA-FE-VALIDATION-R5-ANTIGRAVITY-PROMPT.md), Antigravity has executed the comprehensive source-level and deterministic self-check corrections to resolve all findings (**R4-C01..C05**, **S1..S6**, **NF-1..NF-6**) raised during OpenCode's independent review of R4 ([`docs/reviews/inta-opencode-fe-r4-source-review.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/reviews/inta-opencode-fe-r4-source-review.md)).

- **P1.1 Lifecycle-Bound Proof (NF-4 / R4-C01 / R2-I04)**: Port probes during execution are strictly conditioned on `child_proc.poll() is None`. An already-exited or dead child process produces **zero** during-samples and fails closed as `LISTENER_UNKNOWN` (proven in Test 34). Removed synthetic `during_sample_count = 1` from the pre-flight port-occupied path. The launcher atomically persists an attempt-bound `launcher-execution.json` record into `MC_INTA_STATE_DIR`, capturing exact binary hashes, start/exit UTC, zero-spawn proof (`spawnCalled: false`), and refusal outcome, which the evaluator validates.
- **P1.2 Actual Binding Validation & Codex Staging Prerequisites (NF-1 / R3-N02 / R4-C02)**: Settled explicit absolute binary pins for Node (`/Users/nguyenvanlan/.nvm/versions/node/v24.22.1/bin/node`) and Python (`/Library/Frameworks/Python.framework/Versions/3.14/bin/python3`). Private, isolated `HOME` and `TMPDIR` are bound inside the variant output root, preventing user session leakage. The candidate staging destination `/tmp/mc002-inta-runtime-stage-r5-20261026` is reserved for Codex; the coordinator's pre-flight check validates the Codex `stage-receipt.json` and fails closed (`BINDING_ERROR/NOT_READY`) if absent or unverified.
- **P2 Owned Identity & Cleanup Without Forcekill (C03 / R2-I03 / R3-N01)**: Process verification captures immutable OS start times (`lstart`) in addition to PPID and executable name. In accordance with explicit instructions, **no reviewer-suggested SIGKILL was added**. Graceful termination uses SIGTERM and bounded wait/reap; if a process remains alive after timeout, explicit cleanup failure (`still-alive / cleanup-failed`) is reported and propagated to the evaluator with retained resources and no retry. Resolved the observer pre-bind signal gap: early signals arriving before server construction terminate deterministically with exit code 1.
- **P2 Durability & Schema (C02 / NF-6 / R3-N04 / R4-C04 / R4-C05)**: `AtomicStateWriter` in `observer.py` propagates directory open, fsync, and close failures rather than swallowing them. The evaluator strictly enforces exact `int` types (rejecting `bool` and `float`) for child and observer exit codes. `expected_variant` and `expected_pid` are strictly mandatory.
- **P2 Guard Bytes Before Code Evaluation (NF-3 / R4-C03 / Item 5)**: Completely eliminated static ES import of `guards.ts`. The launcher reads raw bytes and verifies cryptographic SHA-256 against `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928` before dynamically importing the module via Node 24 native type stripping (`--experimental-strip-types`). Any integrity or module failure fails closed as `BINDING_ERROR/NOT_READY` (not a canonical refusal PASS).
- **Test Reach & Provenance (S1..S6)**: All abort paths inject a raising `unexpected_popen` fake (S1). Deterministic fake clock and sleep are injected into coordinator scenarios (S2). The thin shell wrapper is verified with explicit env, all 4 positional arguments, and nonzero exit code 2 propagation (S3). Caller sites 3 (timeout) and 4 (finally cleanup) are directly covered (S4). The launcher mock suite exercises synchronous spawn throws, signal delivery exceptions, CLI adapter, and `launcher-execution.json` output (S5). Isolated unit tests verify file and directory fsync failure propagation (S6).
- **Deterministic Test Verification**:
  - [`selfcheck-r5.py`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/runner/selfcheck-r5.py): **46/46 PASS** (exit code 0).
  - [`test-launcher-mock.mjs`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/launcher/test-launcher-mock.mjs): **17/17 PASS** (exit code 0).
- **Zero Live Runtime Released**: No live Next.js development server, background HTTP observer, product build, Go backend, PostgreSQL, Docker container, or 7-stage validation replay was executed. PostgreSQL is stopped and retained.

---

## 2. Comprehensive Per-Finding Mapping to Corrections

| Finding ID | Review Defect Description | Coherent Correction in R5 | Baseline Diffs | In-Process Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **R4-C01** / **NF-4** / **R2-I04** | Fast refusal PASS was not lifecycle-proven; probe-before-poll sampled dead children; test 34 passed with already-exited mock; `spawnCalled:false` was not persisted; pre-flight port occupancy fabricated `during_sample_count=1`. | Poll child **before** taking during-samples; if already exited, loop breaks immediately with 0 samples. Evaluator fails closed on 0 samples as `LISTENER_UNKNOWN`. Pre-flight occupied port returns `during_sample_count=0`. Launcher atomically persists `launcher-execution.json` with `spawnCalled:false`, guard hash, and refusal outcome, cross-correlated by evaluator. | [`diffs/coordinator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/coordinator.diff)<br>[`diffs/guard_evaluator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/guard_evaluator.diff)<br>[`diffs/harness-dev.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/harness-dev.diff)<br>[`fast-refusal-proof-basis-r5.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/proposals/fast-refusal-proof-basis-r5.md) | Tests 33–36 in `selfcheck-r5.py`:<br>- Test 33: `spawnCalled:true` rejected.<br>- Test 34: Dead mock child rejected as during-evidence (`duringSampleCount=0` -> `LISTENER_UNKNOWN`).<br>- Test 35: Live-then-exit fake passes `VALID_COMPLETE_INPUT`.<br>- Test 36: Immediate-exit defect fails closed as `LISTENER_UNKNOWN`.<br>Test 17 in `test-launcher-mock.mjs`: `launcher-execution.json` schema and persistence. |
| **R4-C02** / **NF-1** / **R3-N02** | PATH-resolved Node and Python; ambient `HOME`/`TMPDIR` leakage; nonprivate Next/cwd; missing pre-spawn validation of executables and dependency boundaries; unperformed staging. | Pinned absolute Node (`/Users/nguyenvanlan/.nvm/versions/node/v24.22.1/bin/node`) and Python (`/Library/Frameworks/Python.framework/Versions/3.14/bin/python3`). Created isolated private `HOME` and `TMPDIR` inside variant output root. `validate_preflight_stage()` checks absolute binary existence and validates Codex stage receipt (`stage-receipt.json`). Authored binding record and dependency isolation plan. | [`diffs/coordinator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/coordinator.diff)<br>[`diffs/guard-validator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/guard-validator.diff)<br>[`implementation-binding-record-r5.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/proposals/implementation-binding-record-r5.md)<br>[`dependency-isolation-plan-r5.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/proposals/dependency-isolation-plan-r5.md) | Test 44 in `selfcheck-r5.py`: Missing Codex stage receipt fails closed as `PROBE_ERROR` before process launch.<br>Tests 41–42: Wrapper dispatches pinned Python and typed arguments. |
| **R4-C03** / **NF-3** | Static import of `guards.ts` executed before hash check; checked path and imported path diverged; hash failure surfaced as raw error. | Eliminated static ES import. `verifyGuardIntegrity()` reads raw bytes and verifies SHA-256 match before dynamic `import()`. Failure outputs `[BINDING_ERROR/NOT_READY]`, records `outcome: "BINDING_ERROR"` in execution record, and exits 1. Evaluator treats as `BINDING_ERROR`, not canonical refusal PASS. | [`diffs/harness-dev.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/harness-dev.diff)<br>[`diffs/guard_evaluator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/guard_evaluator.diff) | Test 11 & 16 in `test-launcher-mock.mjs`: Missing or mismatched guard hash fails closed as `BINDING_ERROR/NOT_READY` with exit code 1.<br>Test 45 in `selfcheck-r5.py`: Native dynamic import under `--experimental-strip-types`. |
| **R4-C04** | Observer swallowed directory fsync failure in `try/except: pass`; tests exercised only open/replace, not fsync denial. | Removed `try/except: pass` in `AtomicStateWriter.write_state`. Parent directory open, fsync, and close failures propagate explicitly, failing closed. Added isolated unit tests for file fsync, dir open, dir fsync, and dir close failures. | [`diffs/observer.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/observer.diff)<br>[`diffs/selfcheck.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/selfcheck.diff) | Tests 28–32 in `selfcheck-r5.py`:<br>- Test 28: File fsync error propagates.<br>- Test 29: Directory open error propagates.<br>- Test 30: Directory fsync error propagates.<br>- Test 31: Directory close error propagates.<br>- Test 32: Replace error propagates. |
| **R4-C05** | Exit codes accepted `bool` (`True`/`False`) and `float` (`1.0`/`0.0`); identity checks were optional; provenance lacked exact command lines, exit codes, and transcripts. | Evaluator enforces `type(exit_code) is int` and `type(observer_exit_code) is int`. `expected_variant` and `expected_pid` are strictly mandatory. Test runner captures exact argv, cwd, UTC timestamps, numeric exit codes, and version read transcripts in `r5-test-summary.json`. | [`diffs/guard_evaluator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/guard_evaluator.diff)<br>[`r5-test-summary.json`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/r5-test-summary.json) | Tests 14–18 in `selfcheck-r5.py`:<br>- Test 14: `exit_code=True` rejected.<br>- Test 15: `exit_code=1.0` rejected.<br>- Test 16: `observer_exit_code=False` rejected.<br>- Test 17: `observer_exit_code=0.0` rejected.<br>- Test 18: Omitted expected identity rejected. |
| **S1** | Real Popen defaults in abort tests; branch drift could reach real spawn. | Injected `raising_unexpected_popen` fake across all abort test scenarios (preprobe error, preprobe bound, collision). | [`diffs/selfcheck.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/selfcheck.diff) | Tests 37, 38, 44 in `selfcheck-r5.py` verify that abort paths halt cleanly with `raising_unexpected_popen`. |
| **S2** | Coordinator used real `time.time()` / `time.sleep()`, reducing determinism. | Allowed injecting `time_func` and `sleep_func` into `VariantRunner` and `bounded_terminate`. Injected `FakeClock` in test scenarios. | [`diffs/coordinator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/coordinator.diff)<br>[`diffs/selfcheck.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/selfcheck.diff) | Test 39 in `selfcheck-r5.py` advances `FakeClock` deterministically through timeout. |
| **S3** | Wrapper test defined `wrapper_env` but ran with ambient env; ports and nonzero propagation untested. | Wrapper test passes `env=wrapper_env` explicitly; asserts all 4 positional arguments (`attempt`, `harness`, `port`, `obs_port`); tests nonzero stub exit code 2 propagation. | [`diffs/guard-validator.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/guard-validator.diff)<br>[`diffs/selfcheck.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/selfcheck.diff) | Tests 41–43 in `selfcheck-r5.py`:<br>- Test 41: Full 4-argument dispatch.<br>- Test 42: Exit code 2 propagation.<br>- Test 43: Existing attempt collision refusal. |
| **S4** | Caller sites 3 (timeout) and 4 (finally cleanup) not covered by coordinator tests. | Added Test 39 driving site 3 timeout termination and asserting handle reap. Added Test 40 raising simulated loop error and asserting site 4 cleanup in finally. | [`diffs/selfcheck.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/selfcheck.diff) | Tests 39 & 40 in `selfcheck-r5.py`. |
| **S5** | Launcher mock suite lacked CLI adapter, synchronous spawn throws, and signal exception branches. | Added unit tests covering CLI adapter execution, synchronous spawn exceptions, signal delivery exceptions, and `launcher-execution.json` output. | [`diffs/test-launcher-mock.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/test-launcher-mock.diff) | Tests 14–17 in `test-launcher-mock.mjs` (17/17 PASS). |
| **S6** | Real subprocesses in test suite; file-fsync vs dir-fsync failure not isolated. | Isolated unit tests mock each filesystem operation individually, proving that each failure mode raises independently. | [`diffs/selfcheck.diff`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/diffs/selfcheck.diff) | Tests 28–32 in `selfcheck-r5.py`. |

---

## 3. Architecture & Proposal Documents Delivered

Three authoritative documents have been authored and included in the governance export:
1. **[`implementation-binding-record-r5.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/proposals/implementation-binding-record-r5.md)**:
   - Formally fulfills INTA-1-LAUNCH-01 line 18.
   - Names exact settled versions (`node v24.22.1`, `python 3.14.4`), absolute executable paths, native type-stripping flags, cryptographic guard hash validation (`0f5f...`), and clean-room private `HOME`/`TMPDIR`.
   - Mandates fail-closed handling on missing Codex stage receipt.
2. **[`dependency-isolation-plan-r5.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/proposals/dependency-isolation-plan-r5.md)**:
   - Outlines APFS Copy-on-Write (`cp -c`) staging, symlink boundary escape checks via `realpath`, and zero-mutation preservation.
   - Confirms candidate staging status (reserved for Codex).
3. **[`fast-refusal-proof-basis-r5.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/proposals/fast-refusal-proof-basis-r5.md)**:
   - Resolves NF-4 and R4-C01 by specifying verified live interval conditioning and attempt-bound `launcher-execution.json` persistence.
   - Preserves fail-closed behavior for zero-sample runs (`LISTENER_UNKNOWN`).

---

## 4. Evidence Package & Governance Manifest

The governance export directory [`docs/testing/inta-returns/frontend/validation-r5-20261026/`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/) is byte-for-byte identical to the raw evidence directory `/tmp/mc002-inta-evidence/frontend/validation-r5-20261026/` (`diff -r` exit 0).

The export contains **22 payload files** totaling **332,773 bytes**, validated by a no-self-hash [`manifest.json`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r5-20261026/manifest.json):

```
manifest.json summary:
Total Payloads: 22
Total Payload Bytes: 332,773
Timestamp: 2026-10-26T14:58:00Z
SHA256: 75edcd41c8e017a41cd4a8ce18a92b063d82de55528d0a63a2d2359d7a9c3d9c
```

### Manifest Payload Inventory
1. `credential-pattern-scan-r5.json` (292 B, SHA256: `9aa54218fd067a2413703c71659c0626aefe30c6d1d1b8aafbecb57684d6f544`) — 24 files scanned, 0 pattern matches found.
2. `diffs/coordinator.diff` (27,024 B, SHA256: `257562baf9ce58a8c0f5c0aea8f83027579fc1db89365f70a6a316912a7a1f52`)
3. `diffs/guard-validator.diff` (2,469 B, SHA256: `8c99ec6eab78a69b62fdcb0d1c9d528f114c90de191a1c045d11f963c97c21a8`)
4. `diffs/guard_evaluator.diff` (11,420 B, SHA256: `6b8f5fff0440b09a92920839e69894e66c579e69ce7acbc858997785581f59d7`)
5. `diffs/harness-dev.diff` (12,302 B, SHA256: `9d241e40b7e64a32c7f176d9b9c42a398e68daebc422c4fbaea34d6c1c69ac0c`)
6. `diffs/observer.diff` (3,479 B, SHA256: `76a8be0cdf730b6fb809ed424fd95ca441e9f9e53b88e7c310ec272c38bf39a8`)
7. `diffs/selfcheck.diff` (83,090 B, SHA256: `e204d9845cbff7f5bace4f8534a91560c6e1c872506558c2109e936bd635a952`)
8. `diffs/test-launcher-mock.diff` (12,237 B, SHA256: `145c7db91b22276f01f2c9c2b20a445ea8b33b28356d768a97c50dd8415c5971`)
9. `launcher-mock.stdout.txt` (2,787 B, SHA256: `a93b4f620898863f63e6ef678d1fe8b1050eb4eb91e25e8316373b75a133f915`)
10. `launcher/harness-dev.mjs` (13,730 B, SHA256: `63b8c6a0c24ae6f1cbaec8140ae4fa572a1be822bc6825c93540d436cf472251`)
11. `launcher/test-launcher-mock.mjs` (16,791 B, SHA256: `a8f6dff4e29221ae2641505c877fa5a7209ca7e9a8f4c944ebf94697950f2824`)
12. `proposals/dependency-isolation-plan-r5.md` (3,200 B, SHA256: `576ef2fa9b42211bb15cbe98c252277d32c453aa6a9287313ee0d8d461cb28dc`)
13. `proposals/fast-refusal-proof-basis-r5.md` (3,947 B, SHA256: `e06c8b3211516e87d4052f36d4f938d8134ae41c2c2f689f783cb7e18987d605`)
14. `proposals/implementation-binding-record-r5.md` (6,256 B, SHA256: `3b3ebf28328fa1604a3f3a8b48858feeb9d29fc0a430c7760777e48b816223ad`)
15. `r5-test-summary.json` (4,008 B, SHA256: `c8309df7395bf507daee767fa6347da70fe9b657929424e6ca6f53412536c4b2`)
16. `runner/coordinator.py` (31,939 B, SHA256: `d9df16a7ceee54452140be0fb26ff342416f406089d31fbe5391d84be8593a2b`)
17. `runner/guard-validator-r5.sh` (2,025 B, SHA256: `a6eecbe098e94fae9f54817a151be974052c92336338e55e3cefe106c5b96791`)
18. `runner/guard_evaluator.py` (12,113 B, SHA256: `c1e845701ef7e1ae2d427774d75438c8c504008bc061e967a6e11894a4c58f96`)
19. `runner/observer.py` (6,968 B, SHA256: `fefda52a5c531d054d485f7a26f30a911a37c9bc9e5c4a450531fe9f3a69634e`)
20. `runner/selfcheck-r5-results.json` (19,104 B, SHA256: `f5bc70876104ca8433ec27b13a8ce9013c9e6bb079d8544a4aebe435ee912e75`)
21. `runner/selfcheck-r5.py` (52,840 B, SHA256: `0dc3cfb39fae72645607da1063640b3ff1c8636fb484ae877b0c799a4fc6285d`)
22. `selfcheck-r5.stdout.txt` (4,752 B, SHA256: `6fa7d5300eb198889aa31ff3d93bfbb6ec0cc5e8c14838634177d611ee6ec027`)

---

## 5. Formal Results & Unchanged Statuses

All **51 formal results** remain unchanged and intact:
- **36 Required Cases**: Includes `T11c` with status `OUTCOME_UNKNOWN`.
- **14 Product-Deferred Cases**: Preserved as deferred.
- **1 Production-Feasibility Blocked Case**: `D-14` (distinct from T11c).
- **Option A Boundary**: `INTA-LAUNCH-D01` Option A stands approved; launcher-only supported boundary.
- **Raw Direct Next CLI**: `FAIL_OBSERVED_LISTENER` stands; direct CLI remains unsupported for never-listen.
- **PostgreSQL**: Retained stopped (exit 0); no connection, start, inspection, or SQL was performed.

---

## 6. Skipped Work & Remaining Risks

1. **Codex Private Staging**: Actual staging of `/tmp/mc002-inta-runtime-stage-r5-20261026` is owned by Codex. Antigravity does not perform copy, download, or link manipulation on staging dependencies. Independent review must verify Codex's staging evidence alongside this source return.
2. **Live Runtime Gate**: Live execution of Next.js, Go backend, and observers remains strictly **NOT_RELEASED** until Codex provisions the stage and OpenCode completes independent QA review.
3. **No Automatic Authorization**: MC-002 remains open; Step 03B is not authorized; Mimosa integration remains separate; production deployment is not authorized.
