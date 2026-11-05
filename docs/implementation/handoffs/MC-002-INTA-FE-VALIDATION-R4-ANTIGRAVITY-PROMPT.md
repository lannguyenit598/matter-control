# INT-A FE validation R4 — bounded corrections after independent R3 review

**READY_NOT_DISPATCHED / SOURCE_AND_DETERMINISTIC_SELFCHECK_ONLY / LIVE_RUNTIME_NOT_RELEASED**

Human delivery assigns actual Antigravity (frontend owner), task MC-002-INTA-FE-VALIDATION-R4, P0. Requirements: INT-ENV-05/R07, C02..04 and carried R2-I02..06/R3-N01..06/NF-1..6 under INTA-1-LAUNCH-01. Codex coordinates and owns private environment/PG; actual OpenCode independently reviews the returned source. Do not report DISPATCHED/EXECUTED from this prepared file.

## 1. Inputs, ownership and boundaries

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, prepared base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. Recheck root, HEAD/status, applicable instructions and RTK. Semble before exploration. You are not alone; preserve other owners' work. No reset/stash/stage/commit/merge/push. Record actual identity/tool/model/provider; use current permitted session without login/switch/global setting changes or a new paid route.

First verify `docs/testing/inta-opencode-fe-r3-intake/r4-inputs.json`: all direct pins and all 20 R3 baseline payloads. Read:

- `docs/reviews/inta-opencode-fe-r3-source-review.md`, especially §§3–6 and §10; SHA256 `7eb30ed9450482c95d695bb18601c8bddad9d4b27bbb65032414f3be0e1d92c1`, 41,708 bytes.
- `docs/reviews/inta-opencode-fe-r3-intake.md` for Codex disposition and lifecycle rider.
- `docs/testing/inta-returns/frontend/validation-r3-20261026/` as the immutable source/test baseline (20 payloads / 225,606 bytes), not an earlier R2.
- Approved launch addendum/PO approval, original frozen contract, previous R3 assignment and separate privacy/teardown return as pinned.

C01 and R2-I01 are CLOSED_SOURCE_ONLY; preserve their actual dispatch, no-port-kill wrapper and refusal/probe fixes. Do not reopen historical 7 stages, product build or architecture. Option A already approves the guard-first boundary; no repeat approval is needed. The exact implementation binding is still a candidate until independent review and prerequisites pass.

Only NEW owned paths (check absence before creation; collision means STOP/report, never overwrite):

- `/tmp/mc002-inta-fe-validation-r4-20261026` — corrected source and pure/mock tests.
- `/tmp/mc002-inta-evidence/frontend/validation-r4-20261026` — raw evidence.
- `docs/testing/inta-returns/frontend/validation-r4-20261026` — export.
- `docs/reviews/inta-fe-validation-r4-antigravity-return.md` — return.

Copy only necessary baseline source/tests into R4. No edits to R3/R2, sealed reports/manifests, tools/inta-harness, original FE/harness/backend, product config/lockfiles, dependencies, ledger or old A/B/X state. Fixed guard is read-only at `/tmp/mc002-inta-harness/src/guards.ts`, SHA256 `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928`.

**Current PG is stopped and retained** per the separately pinned Codex return. Do not start, stop, inspect or connect to it. No private env/credential read, Go/Next/observer/server/socket/HTTP/SQL/lsof/ps/real signal (including 0), dependency copy/install/download, product build or stage replay. No external agent/provider invocation. Pure Python/Node tests and load-only guard imports are allowed after signal safety is established; mock OS/process/probe/time/signal APIs. Normal tool version reads are allowed. Context7/installed docs are required before selecting version-specific Node import behavior.

## 2. Correction order and minimum reach

### A. Make the tests safe before any rerun (P1; R3-N03, R2-I06)

Do not run the unchanged R3 suite. First inspect every signal/process caller and inject fake `kill_func` into cases 20/21/25 and any equivalent new path. Close over no real os.kill/process.kill/terminate default in mock tests. Use a fail-fast test guard for unexpected real signal/process operations, including signal 0. Verify source reach statically before executing the corrected suite.

Case 25 must prove successful cleanup of its fake observer via call/identity/wait assertions, not pass merely because an error note contains text. Keep fake IDs entirely in the fake OS; no dummy process, real PID existence checks or signal delivery.

### B. Finish the one owned-cleanup path (P1; R3-N01, R2-I03)

Correct all five real cleanup call sites, including both listener/counter aborts. Pass the captured ownership/parent/executable identity and retain every termination result. Preserve fail-closed behavior on identity/query errors and never turn a mismatch into successful cleanup. Errors from finally must reach the retained outcome, including early observer-bind/start returns.

Keep this minimal: use each created process handle and checked bounded wait/reap for true exit status; do not rely only on kill(pid,0) disappearance or an optional executable substring. A parent/name argument alone is not an immutable start identity. Record creation/start identity and exact executable/parent/handle binding once; reject unowned/reused identity without a signal. Do not invent a general process manager. Test successful owned exit, mismatch/denial, already-exited handle, timeout and cleanup failure with fakes. No real ps/signal execution in this round.

### C. One exact implementation-binding candidate (P1; R3-N02, NF-1/NF-3/NF-5, R2-I02/I05)

Produce a compact binding record naming source hashes, actual installed Node/Python versions and absolute executable paths, supported launcher/guard paths and hash/import checks, exact argv/cwd, environment key set, private HOME/TMPDIR/state, observer/probe ownership and new attempt/output paths. Use a real version read to settle v24.10.0 versus v24.22.1; do not copy an old version string.

Remove PATH-resolved Node/Next and current-cwd fallback from actual supported execution. Missing/invalid binding fails before child creation. Reconcile coordinator, launcher and proposal allowlists; choose only needed keys and explicitly account for SHELL/TMPDIR instead of forwarding the ambient environment. Bound observer env as well. Do not copy dependency trees: describe candidate private paths and nested-link checks; clearly mark staging as unperformed until Codex provisions and verifies it. Tests use filesystem doubles where paths do not exist yet.

The guard hash must be checked by the execution path, not merely a comment. Use the actual frozen guard/export names and behavior. Missing/changed guard or import failure is a binding failure, never a canonical refusal PASS. Do not modify guard policy, add a duplicate secret-key list or assert it checks MC_INTA_ENABLE; its existing startup and handler checks are distinct.

### D. Require actual complete evidence (P2; R3-N04, C02/R2-I04)

Reject a present error field even when empty/falsey; unknown observer failures cannot PASS. Missing sample-count/observer-exit evidence must remain missing, not default to 1/0. Use strict types for counters/counts/exit values, expected identity and final/clean state at the real caller boundary. Keep the corrected R1 bool-counter/string-cleanShutdown/unknown-listener regressions, plus tests for empty/false/null error, omitted evidence, malformed identity and cleanup/parse/write failure. Retain zero-sample LISTENER_UNKNOWN.

### E. Correct plan and proposal from code (NF-2/NF-6)

The existing plan is 24 = 11 remaining variables × nonempty/empty plus API_MODE nonempty/empty. Correct its labels; preserve ordering and canonical IDs. Add the already required NODE_ENV=production supported-path subcheck explicitly, reporting its own count (25 total if represented as one added variant). It needs the correct refusal message; do not silently keep NODE_ENV=development for that case. No new product rule or waiver is involved.

Replace contradictory proposal text with the binding record: actual Node version, actual guard exports/import checks, correct MC_INTA_ENABLE behavior, exact allowlist and exact Next executable. Fix pre-bound-port outcome wording: nothing executed when a preflight listener already exists. Refuse existing attempt paths without reusing/truncating them.

### F. Decide the fast-refusal proof basis before runtime (NF-4)

Do not claim that a sample automatically occurs before a fast refusal exits. State precisely what proves supported-path zero child spawn/no listener and zero upstream, and how observation intervals, guard hash, invocation identity and final counter tie to that attempt. Sampling only supports its observed windows; it cannot weaken the approved never-listen condition. Keep zero-sample UNKNOWN, never fabricate a sample, insert a delay just to get PASS, or retry to force a passing result.

Return a concrete candidate proof method for nonauthor review. If the corrected measurement cannot support the approved claim, mark that part BLOCKED with the exact missing evidence rather than claim runtime readiness. Do not ask the PO to reapprove option A or self-approve a changed acceptance criterion.

### G. Tests must exercise corrected entrypoints and failures (R3-N06/R2-I06, R2-I05)

Fix T9: assert relative resolution directly under an explicit cwd; remove the absolute-path OR fallback. Make launcher signal-forwarding errors visible and final outcomes wait for owned close/exit. Test the same CLI adapter/entry branch used by actual launch with fake process/spawn; do not cover only a helper that real entry bypasses.

Retain useful current tests. Add meaningful focused checks for the successful coordinator path, each cleanup abort/error, probe timeout/exception, creation/replace/fsync failure propagation and the thin wrapper's argument/exit dispatch via a harmless controlled interpreter/entry stub. Do not launch the real coordinator/observer accidentally. Where parent-directory durability is claimed, implement/test the needed durability step or narrow the documented guarantee honestly. Do not chase an arbitrary test count.

## 3. Evidence, return and stop

Record exact corrected-suite commands, real UTC start/end, numeric exits and separate stdout/stderr. Retain standalone launcher mock output/exit, not merely a substring from a swallowed inner invocation. Test result counts must be parsed from actual records/assertions; state which tests are pure, mocked or load-only imports. Record actual version reads. Preserve original R3 timing as historical; no accusation or invented replacement timestamp.

Deliver source hashes and exact R3→R4 diffs, per-finding map for R2-I02..06/R3-N01..06/NF-1..6, corrected tests/results, binding candidate and remaining BLOCKED fields. Complete new manifest excluding itself and raw/export byte equality. Pattern scan new artifacts without real credential access. The previous Codex actual-value privacy scan does not cover these future artifacts; supplemental actual-value matching remains Codex's later task.

Return **SOURCE_CORRECTIONS_RETURNED / IN_REVIEW / RUNTIME_NOT_RELEASED** or a concrete blocker. No self-awarded DONE/live PASS, no message to OpenCode and no runtime cue. Codex intakes actual R4, then nonauthor source/binding review; fresh prerequisites and explicit bounded runtime cue remain required. Current stopped PG must not be restarted for these source tests.

Preserve all 51 formal results (36 required / 14 product deferred / one external blocked), historical raw-CLI FAIL, T11c OUTCOME_UNKNOWN, Go/Next unknown termination evidence, independent privacy/teardown acceptance and MC-002/product/auth/security/Cloudflare/cost/recovery/Step03B gates. No extra Claude/architecture loop or duplicate PO decision. End with work skipped and remaining risk.
