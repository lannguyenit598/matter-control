# INT-A — Antigravity R3 intake

Task: MC-002-INTA-FE-VALIDATION-R3. Actual intake actor: Local Codex. Owner identity returned by human: actual Antigravity, Gemini 3.8 Flash High / Google. Branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`; no new commit.

**SOURCE_RETURN_RECEIVED / REWORK_REQUIRED / INDEPENDENT_REVIEW_PENDING / RUNTIME_NOT_RELEASED**. Owner claims completion; Codex does not accept all six findings as closed. [OpenCode source-review prompt](../implementation/handoffs/MC-002-INTA-OPENCODE-FE-R3-SOURCE-REVIEW-PROMPT.md) is READY_NOT_DISPATCHED.

## Verified artifact integrity

The [owner manifest](../testing/inta-returns/frontend/validation-r3-20261026/manifest.json) contains 20 payloads totaling 225,606 bytes. Every payload size/hash matches; raw/export files including manifest are byte-equal, and no export files are undeclared. Seven core scratch/source/test files equal their exported counterparts. Four Python files parse as AST without importing or executing them. Frozen R2's 15 payloads and the original guard hash remain unchanged.

[checks.json](../testing/inta-fe-validation-r3-intake/checks.json) retains 81 initial checks: 76 PASS and five textual-diff comparator mismatches. Those five are superseded by [semantic diff validation](../testing/inta-fe-validation-r3-intake/diff-validation.json): all seven supplied diffs reconstruct their exact exported targets from the frozen baseline. Different diff algorithms selected different valid hunks; no stale diff defect is established. The original diagnostic record is retained.

Owner JSON contains 30 cases marked PASS; captured stdout reports 30/30. The owner reports 10/10 launcher mocks, also invoked by selfcheck case 30. These are owner results, not Codex execution. The packet lacks a separate standalone launcher stdout/exit transcript, and raw exact command/stderr provenance should be assessed before claiming complete execution evidence. Nothing in this intake reran those suites.

## Static observations for independent adjudication

[Full observations](../testing/inta-fe-validation-r3-intake/source-observations.json) pin line references. These are Codex source observations, not an OpenCode verdict.

| ID | Priority | Observation |
| --- | --- | --- |
| R3-N01 | P1 | Real cleanup callers omit expected identity; the helper still permits PID-exists-only verification and optional executable substring. No immutable start identity is checked. PID polling substitutes for a checked owned-child wait; two abort calls ignore cleanup results. |
| R3-N02 | P1 | Launcher defaults to `next` from PATH and current cwd; CLI supplies no explicit executable/state binding. Coordinator resolves Node from PATH, inherits HOME/PATH and starts observer without a bounded env. The private binding is still unverified. |
| R3-N03 | P1 | Selfcheck cases 20/21 retain real `os.kill`; case 25 also retains it for fake observer PID 77777. Depending on live PID existence, this can reach SIGTERM. Do not rerun the suite as mock-only. This is static reachability, not evidence that a historical SIGTERM occurred. |
| R3-N04 | P2 | Zero-sample/isFinal checks improve R2, but falsey error fields still pass; sample-count and observer-exit defaults supply missing evidence, and observer identity remains optional. |
| R3-N05 | P2 | The named 22-variant list has 24 entries; API_TOKEN is included and actual plan has no NODE_ENV=production variant. Proposal says Node v24.10.0 while summary says v24.22.1. Existing empty attempt dirs are accepted. Scope, counts and binding need accurate disposition. |
| R3-N06 | P2 | Wrapper isn't actually exercised by plan tests; relative-entry test can pass through its absolute-path OR fallback. Writer failure test does not isolate replace/fsync failures; successful coordinator/cleanup and probe exception coverage remain incomplete. Parent-directory durability is not established. |

Wrapper dispatch and removal of port-kill traps, guard-first invocation, state-variable propagation, strict counter type, isFinal and zero-sample handling are visible improvements. They do not establish runtime safety or close the remaining paths above. Early observer-bind returns also require checking that cleanup outcome reaches retained verdict evidence. Sampling alone does not prove the full never-listen boundary; assess the complete proposed proof before runtime.

## Next action and preserved gates

Deliver the pinned prompt to actual OpenCode for an independent read/hash/static review of this exact R3 and baseline. Do not execute wrapper, coordinator, selfcheck, launcher or observer. Reviewer decides each prior finding plus the new observations, with exact lines and the smallest necessary corrections. Avoid a new architecture/PO loop: option A is already approved; executable binding and evidence remain the work.

All formal 51 results remain unchanged by this intake (36 required / 14 product deferred / one external blocked). Historical raw-CLI FAIL, T11c OUTCOME_UNKNOWN, termination limitations, actual-secret privacy, final PG teardown, conformance and final 36-case QA remain open. No MC-002 DONE, Step 03B or production/cost/security/recovery acceptance. No provider invocation, source edit or commit occurred.

Skipped: owner suite execution, live runtime, credential reads, signals and resource lifecycle. Risk: current R3 still permits insufficiently verified process signals and an unbound executable path; hold execution pending correction/review.
