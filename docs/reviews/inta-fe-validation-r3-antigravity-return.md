# MC-002-INTA-FE-VALIDATION-R3 — Antigravity Formal Return

**Status**: `SOURCE_CORRECTIONS_RETURNED / IN_REVIEW / RUNTIME_NOT_RELEASED`  
**Task ID**: `MC-002-INTA-FE-VALIDATION-R3`  
**Priority**: P0  
**Executor**: Actual Antigravity (Frontend Execution Owner, Gemini 3.8 Flash High)  
**Coordinating Role & Intake Recipient**: Codex (PM / Coordination Owner)  
**Independent QA Reviewer**: OpenCode  
**Coordination Branch**: `codex/unified-project-flow`  
**Base Commit**: `a62d838791ba188838c4ff00b7b6e265ac775056`  
**Execution Timestamp**: 2026-10-26T08:17:00Z  
**Workstation Environment**: macOS (darwin arm64), Node.js `v24.22.1`, Python `3.14.4`  
**Normative Authority**: Direct Human Product Owner Approval (2026-10-26, `INTA-LAUNCH-D01`, Option A), `docs/implementation/inta-launch-contract-addendum.md` (INTA-1-LAUNCH-01), `docs/testing/inta-launch-approval-20261026/approval.json`

---

## 1. Executive Summary & Review Scope

In accordance with handoff prompt `MC-002-INTA-FE-VALIDATION-R3-ANTIGRAVITY-PROMPT.md`, Antigravity has executed the targeted source-level and deterministic self-check corrections to resolve all six findings (**R2-I01..R2-I06**) raised during OpenCode's independent review of R2 (`docs/reviews/inta-opencode-fe-r2-source-review.md`).

The PO's explicit approval of **INTA-LAUNCH-D01 Option A** confirms that the supported harness launch path is a reviewed guard-first launcher, and that raw direct Next CLI is unsupported for never-listen (its historical FAIL stands). In this R3 round:
- **Zero Live Runtime Released**: No live Next.js development server, background HTTP observer, product build, Go backend, PostgreSQL, Docker container, or 7-stage validation replay was executed.
- **Zero Dependency Mutations**: No npm/pnpm installs, downloads, or dependency copies were performed. Read-only frozen baselines (`/tmp/mc002-inta-fe` at `3e5a642`, `/tmp/mc002-inta-harness` at `48cc03e`, and `src/guards.ts` at `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928`) remain pristine and byte-identical.
- **Complete In-Process Verification**: 30/30 comprehensive self-checks pass cleanly in `runner/selfcheck-r3.py` (exit 0), and 10/10 mock launcher unit tests pass cleanly in `launcher/test-launcher-mock.mjs` (exit 0).
- **Exact Governance Evidence Delivered**: 20 payload artifacts totaling 225,606 bytes have been generated in raw evidence `/tmp/mc002-inta-evidence/frontend/validation-r3-20261026` and synchronized byte-for-byte to governance export `docs/testing/inta-returns/frontend/validation-r3-20261026`.

---

## 2. Detailed Mapping of Review Findings (R2-I01..R2-I06) to Corrections

| Finding ID | OpenCode R2 Defect | R3 Correction Implemented | Changed Files & Baseline Diffs | Deterministic Verification Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **R2-I01** | `guard-validator-r2.sh` never invoked `coordinator.py`, ran port-based listener kill traps, and returned synthetic success. | Thin shell wrapper delegating strictly to `coordinator.py`. Removed all port killing and trap cleanup from the shell. `run_plan` refuses occupied attempt directories before process creation and immediately halts subsequent variants upon any failure. | - [`guard-validator-r3.sh`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/guard-validator-r3.sh)<br>- [`coordinator.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/coordinator.py)<br>- [`diffs/guard-validator.diff`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/diffs/guard-validator.diff)<br>- [`diffs/coordinator.diff`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/diffs/coordinator.diff) | Tests 27 & 28 in [`selfcheck-r3.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/selfcheck-r3.py):<br>- Test 27: Collision check refuses occupied directory with exit 2.<br>- Test 28: Execution immediately halts on first variant failure. |
| **R2-I02** | Coordinator used raw `npx next dev` and copied full `os.environ`. Allowed env list omitted `MC_INTA_STATE_DIR`. | Coordinator binds execution to approved guard-first launcher `harness-dev.mjs`. Constructed strict bounded environment allowlist (`ALLOWED_ENV_KEYS`) including `MC_INTA_STATE_DIR`. Prohibits any audited secret or auth keys before process creation. | - [`coordinator.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/coordinator.py)<br>- [`harness-dev.mjs`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/launcher/harness-dev.mjs)<br>- [`diffs/harness-dev.diff`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/diffs/harness-dev.diff) | Tests 1-6 in [`test-launcher-mock.mjs`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/launcher/test-launcher-mock.mjs):<br>- Forbidden keys (both nonempty and empty `""`) refuse without spawn.<br>- `NODE_ENV=production` refuses before spawn.<br>- Strict env allowlist verified. |
| **R2-I03** | `verify_pid_identity` failed open on ps errors; `bounded_terminate` treated unverified PIDs as terminated; lack of `try/finally` leaked observers. | `verify_pid_identity` fails closed on any ps error. `bounded_terminate` strictly refuses signals to unverified/unowned processes. Single `try/finally` block wraps observer start, child run, monitoring, post-probe, and cleanup. Distinguishes already-exited owned children from unowned/reused PIDs. Signal API injection allows pure mock verification without real signal hazards. | - [`coordinator.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/coordinator.py)<br>- [`observer.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/observer.py)<br>- [`diffs/coordinator.diff`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/diffs/coordinator.diff)<br>- [`diffs/observer.diff`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/diffs/observer.diff) | Tests 20, 21, 22, 25 in [`selfcheck-r3.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/selfcheck-r3.py):<br>- Test 20: ps failure fails closed (returns False).<br>- Test 21: `bounded_terminate` refuses unverified PID.<br>- Test 22: Atomic writer propagates write errors.<br>- Test 25: Child spawn failure triggers observer cleanup in `finally`. |
| **R2-I04** | Fast-exit children with 0 during-samples defaulted to `listener_during = False` (unsafe PASS); ENOENT stderr in `probe_tcp_listener` was treated as clean absence; `isFinal` was never checked. | In `guard_evaluator.py`, 0 during-samples fails closed as `LISTENER_UNKNOWN`. Stricter validation requires `isFinal is True`, non-negative integer counter (excluding boolean types), `cleanShutdown is True`, and `observer_exit_code == 0`. In `probe_tcp_listener`, any non-empty stderr on rc=1 (including ENOENT) is classified as `PROBE_ERROR`. | - [`guard_evaluator.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/guard_evaluator.py)<br>- [`coordinator.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/coordinator.py)<br>- [`diffs/guard_evaluator.diff`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/diffs/guard_evaluator.diff) | Tests 11-19, 26 in [`selfcheck-r3.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/selfcheck-r3.py):<br>- Test 11: `requestCount=False` rejected.<br>- Test 12: `cleanShutdown='false'` rejected.<br>- Test 13 & 26: 0 during-samples returns `LISTENER_UNKNOWN`.<br>- Test 14: `isFinal=False` rejected.<br>- Test 15: Observer exit code 2 rejected.<br>- Tests 16-19: Actual lsof rc/stderr classification matrix. |
| **R2-I05** | Bounded env lacked `MC_INTA_STATE_DIR`; relative CLI invocation broke `isCliEntry`; signal forwarding re-raised self-signals recursively. | Explicit `MC_INTA_STATE_DIR` allowlisting and propagation. `isCliEntry` uses canonical path resolution (`path.resolve(argv[1]) === fileURLToPath(import.meta.url)`). Signal handlers forward `SIGINT`/`SIGTERM` to child without re-raising on parent `process`. Child exit status cleanly forwarded. | - [`harness-dev.mjs`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/launcher/harness-dev.mjs)<br>- [`diffs/harness-dev.diff`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/diffs/harness-dev.diff) | Tests 7-10 in [`test-launcher-mock.mjs`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/launcher/test-launcher-mock.mjs):<br>- Relative and absolute CLI paths detected accurately.<br>- Child signal forwarding and lifecycle event attachments verified. |
| **R2-I06** | Self-check duplicated probe logic in toy helpers and never exercised actual coordinator, wrapper, or launcher. | `selfcheck-r3.py` directly imports and exercises `VariantRunner`, `run_plan`, `probe_tcp_listener`, `verify_pid_identity`, `bounded_terminate`, `guard_evaluator`, and executes `test-launcher-mock.mjs` and native Node 24 `--experimental-strip-types` imports. | - [`selfcheck-r3.py`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/runner/selfcheck-r3.py)<br>- [`diffs/selfcheck.diff`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/diffs/selfcheck.diff) | Full suite passes 30/30 deterministic tests with exit code 0. Captured stdout at [`selfcheck-r3.stdout.txt`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/selfcheck-r3.stdout.txt). |

---

## 3. Proposal and Architecture Artifacts

Two formal proposal documents have been authored and included in the export:
1. **[`pre-listen-launcher-proposal-r3.md`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/proposals/pre-listen-launcher-proposal-r3.md)**:
   - Formally specifies the supported launcher binding under approved INTA-LAUNCH-D01 Option A.
   - Details Node 24 native `--experimental-strip-types` loading `/tmp/mc002-inta-harness/src/guards.ts` directly without external transpilers or runtime dependencies.
   - Outlines pre-listen evaluation, exit-1 refusal without child spawn, strict bounded environment allowlist, and lifecycle/signal forwarding.
2. **[`dependency-isolation-plan-r3.md`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/proposals/dependency-isolation-plan-r3.md)**:
   - Outlines the filesystem isolation plan for future runtime execution.
   - Details virtual store (`.bin/`, `.pnpm/`) symlink traversal, `realpath` boundary checks preventing directory escape, and APFS Copy-on-Write (`cp -c`) staging to preserve source baselines.
   - Confirms that zero dependency mutations or copies were performed during R3.

---

## 4. Evidence Package & Governance Manifest

The governance export directory [`docs/testing/inta-returns/frontend/validation-r3-20261026/`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/) is byte-for-byte identical to the raw evidence directory `/tmp/mc002-inta-evidence/frontend/validation-r3-20261026/` (`diff -r` exit 0).

The export contains **20 payload files** totaling **225,606 bytes**, validated by a no-self-hash [`manifest.json`](file:///docs/testing/inta-returns/frontend/validation-r3-20261026/manifest.json):

```
manifest.json summary:
Total Payloads: 20
Total Payload Bytes: 225,606
Timestamp: 2026-10-26T08:16:55Z
```

### Manifest Payload Inventory
1. `credential-pattern-scan-r3.json` (300 B, SHA256: `d01c4c50bfe699efe08c5296feac2e4a60b74aa6fb3c418e004665d4d4416025`) — 22 files scanned, 0 pattern matches found.
2. `diffs/coordinator.diff` (29,600 B, SHA256: `39a194a5609c240954d861acc048232c9de7d7f2fd9dab8042f5b8fbaeb02fce`)
3. `diffs/guard-validator.diff` (3,343 B, SHA256: `a14b49cde798377d5a3b3b1b00511b78a9709eeb2310aafabea963c4271a8588`)
4. `diffs/guard_evaluator.diff` (5,136 B, SHA256: `3158d8b5e459cacfca5feb9ac1b8eaf3132a9ba7a7c01c56cc510b433c8ab056`)
5. `diffs/harness-dev.diff` (6,981 B, SHA256: `42639202fc8d9c2eb7a5b40ffb32a9a4add98aee807cce03754bef4ccaa0bf0d`)
6. `diffs/observer.diff` (3,372 B, SHA256: `986352a8aa055431f1859b4266e9ce03c3303952d5ab3f689ceb076600232d3b`)
7. `diffs/selfcheck.diff` (41,804 B, SHA256: `a4e4a4b2cdaed2a5edcb4bca631dbd096fb46f2103030062877712e416119732`)
8. `diffs/test-launcher-mock.diff` (9,073 B, SHA256: `41fa4d3d9efe814079ac632a46d49443081861b97caf81ba964c394f711a664c`)
9. `launcher/harness-dev.mjs` (5,383 B, SHA256: `1294f5ca6530902456780052506de81dcbaddebb9e8349ffe9ef6e5a0a117acd`)
10. `launcher/test-launcher-mock.mjs` (10,559 B, SHA256: `e7e1505ea53a734824bacc1850da436d2860e92d52e51d99c9b840f33cd910c6`)
11. `proposals/dependency-isolation-plan-r3.md` (4,928 B, SHA256: `38010adc9ef25091994e83ccd56c668e0af607ae7e008bac3e79b26a5ba0f5a8`)
12. `proposals/pre-listen-launcher-proposal-r3.md` (7,315 B, SHA256: `e88b261fc253d3778744c608717223197773a3fd1698043f47b4ec7fb3201c57`)
13. `r3-test-summary.json` (2,968 B, SHA256: `6f981f638dc0db6fa16df9bcc373b9a30d4dc04124fd8971ed237182fbee9798`)
14. `runner/coordinator.py` (21,513 B, SHA256: `2d87675849cc62a62b39d09b744a4a9a396000a7800581d9f221beae03531029`)
15. `runner/guard-validator-r3.sh` (1,683 B, SHA256: `cd2b0dc9f715918e92e2f607c63180d56e59142e166c815ab4630a23ce28bc9a`)
16. `runner/guard_evaluator.py` (8,438 B, SHA256: `efb284aecb51e11f0bac794f06a15adad4350b073ccf17f24c2111e3701d3a8a`)
17. `runner/observer.py` (5,885 B, SHA256: `1560fd278042dd19b9ffc3cd6d60c24d7f23dc263214a1d0aa12dd8d54e523fd`)
18. `runner/selfcheck-r3-results.json` (22,679 B, SHA256: `48eb3f6367ed6f244a748443e1553797a57bfebb06d6538149a9ba6e194041d8`)
19. `runner/selfcheck-r3.py` (30,750 B, SHA256: `852453cd055387046860a8e25fdc24f17377aab219430d4bab6104141632b178`)
20. `selfcheck-r3.stdout.txt` (3,896 B, SHA256: `57de269f4a8cb23bcf260923738a96499f392fb4a0cc738d819adefb9c4d8a43`)

---

## 5. Preserved Historical Status and Unchanged Results

All **51 formal verification results** remain strictly preserved and unchanged:
- **36 required cases**:
  - `FEVAL_F01`: `FAIL_OBSERVED_LISTENER` permanently retained for raw direct Next CLI.
  - `FEVAL_F02`: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` retained for the 21 historical variants pending authorized live execution on the new supported launcher path.
  - Historical variant evidence preserved at `docs/testing/inta-returns/frontend/validation-r1-20261026/retained-variant-evidence/` (66 files).
- **14 product-deferred cases**: Unchanged.
- **1 external-blocked case** (`T11c`): `OUTCOME_UNKNOWN` retained.
- **Teardown & Final QA Gates**: Actual runtime secret scans, same-PG final teardown, dynamic cache, and full end-to-end conformance remain open gates owned by Codex and OpenCode.
- **No Early Stage Progression**: No claim of MC-002 DONE, Step 03B, production release, or Cloudflare/cost signoff.

---

## 6. Work Skipped & Remaining Risks

### Work Skipped
1. **Live Next.js Server & Runtime Observation**: No live processes were spawned; port 18085 was not opened; observer port 18086 was not bound.
2. **Dependency Modifications**: No `npm install`, `pnpm install`, or dependency tree copying was executed.
3. **Product & Harness Modifications**: The baseline frontend at `/tmp/mc002-inta-fe` and harness at `/tmp/mc002-inta-harness` were preserved read-only.
4. **Git Operations**: No git staging, committing, stashing, merging, or pushing was performed.

### Remaining Risks
1. **Mock vs. Live Timing Discrepancies**: The pre-listen launcher logic and type-stripping imports are verified through deterministic mock suites and in-process execution. Live child process interaction under actual high-concurrency Node runtime execution requires the explicit Codex bounded runtime cue.
2. **Runtime Isolation Verification**: Although the APFS CoW cloning and symlink boundary escape checks are formally specified in the isolation plan, physical execution of dependency staging must be audited when Codex authorizes the live attempt directory creation.
