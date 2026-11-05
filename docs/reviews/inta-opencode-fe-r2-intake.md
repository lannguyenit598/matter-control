# INT-A — independent implementation-R2 review intake

Task: MC-002-INTA-FE-VALIDATION-R2-REVIEW-INTAKE. Actual actor: Local Codex; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. Proposed disposition: **CHANGES_REQUIRED / SOURCE_ONLY / RUNTIME_NOT_RELEASED**. No commit created.

The human returned an actual independent OpenCode CLI 2.1.4 review using `opencode/glm-5.3-flash-free`. OpenCode completed its scoped read/hash/static review, not all INT-A validation. Codex verified the returned artifacts locally; Codex did not invoke OpenCode in this intake.

## Integrity and disposition

[55 intake checks](../testing/inta-opencode-fe-r2-intake/checks.json) passed. The [independent report](inta-opencode-fe-r2-source-review.md) is 26,979 bytes, SHA256 `1a1abebe0c6872c54a309d3b655a4e43848d974006ccd6529b517c030faec6b3`. The two review JSON outputs are 9,195 and 6,920 bytes; their full hashes are in [received-review.json](../testing/inta-opencode-fe-r2-intake/received-review.json). All 14 reviewed input pins and 15 R2 payload pins match. The current 131,584-byte author payload matches the frozen review snapshot and raw export. Original 59-file ledger pins, 51 formal NOT_RUN results and PO option A remain unchanged.

All six findings R2-I01 through R2-I06 are independently CONFIRMED:

| Finding | Required correction |
| --- | --- |
| R2-I01 | Make the wrapper dispatch the coordinator; remove cleanup that signals every listener on a port. |
| R2-I02 | Use the approved guard-first launcher, explicit environment and private state; remove direct npx launch. |
| R2-I03 | Verify owned process identity, use checked bounded waits and cleanup on every abort path. |
| R2-I04 | Reject unknown/fast-exit observations, probe errors and incomplete final observer records. |
| R2-I05 | Bind launcher paths/cwd/state and test the actual CLI/error/signal/close path. |
| R2-I06 | Test actual corrected coordinator, probe, persistence and cleanup code using mocks. |

C01, C03 and C04 remain PARTIAL. C02 is substantially fixed, with a remaining final-evidence gap. Owner results (29 selfchecks and 8 launcher mocks) remain useful source evidence, without proving runtime readiness. The independent reviewer did not repeat the 36-row coverage audit.

The reviewer disclosed an intermediate JSON syntax error and corrected it before final delivery. Final JSON parses and hashes match. Approximate timestamps remain approximate; no missing intermediate bytes or exact event ordering are inferred.

## Next assignment

[Full Antigravity R3 prompt](../implementation/handoffs/MC-002-INTA-FE-VALIDATION-R3-ANTIGRAVITY-PROMPT.md): **READY_NOT_DISPATCHED**, source corrections and deterministic selfchecks only. The smallest coherent change is one coordinator dispatch through the approved launcher, one owned cleanup path, strict final evidence checks, and tests calling those paths. R3 uses new paths; sealed R2 artifacts remain intact. Inputs are pinned in [r3-inputs.json](../testing/inta-opencode-fe-r2-intake/r3-inputs.json).

PO option A already approves the supported guard-first boundary. Exact executable, import, environment, argv, cwd, state and ownership binding still require implementation and nonauthor review. Do not request option A again. After R3 source review, fresh prerequisites and an explicit bounded runtime cue are still required.

Do not execute the unsafe R2 wrapper, including for a smoke check: its exit trap can signal an unrelated listener. Historical raw-CLI FAIL and T11c OUTCOME_UNKNOWN remain. Actual-secret privacy, Next termination, Go direct-wait, same-PG final teardown, dynamic/cache conformance and final 36-case QA remain open. No MC-002 DONE, Step 03B, production, security, Cloudflare, cost or recovery acceptance follows.

Skipped: source execution, tests, runtime, credential reads, lifecycle actions, provider calls and commit. Risk: R2 remains unsafe to execute before the confirmed fixes.
