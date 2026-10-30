# INT-A — independent R3 review intake and R4 disposition

Task: MC-002-INTA-FE-VALIDATION-R3-SOURCE-REVIEW-INTAKE. Actual actor: Local Codex; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. No commit. **REVIEW_RECEIVED / CHANGES_REQUIRED_SOURCE_ONLY / RUNTIME_NOT_RELEASED**.

Actual human-returned OpenCode CLI v2.1.4 / `opencode/glm-5.3-flash-free` reviewed as independent nonauthor, read/hash/static only. Codex did not invoke that external session. The completed review deliverable is accepted into governance with its limitations; this is not MC-002, formal-case or runtime DONE.

## Integrity and accepted findings

[108 intake checks](../testing/inta-opencode-fe-r3-intake/checks.json) pass: three output hashes/sizes and both JSON files, all 50 reviewed input pins, 21 R3 raw/export pairs including manifest, imported guard equality, privacy/teardown manifest and 26 payload pins, last recorded PG disposition and unchanged HEAD. The [independent report](inta-opencode-fe-r3-source-review.md) is 41,708 bytes, SHA256 `7eb30ed9450482c95d695bb18601c8bddad9d4b27bbb65032414f3be0e1d92c1`. Full output pins are in [received-review.json](../testing/inta-opencode-fe-r3-intake/received-review.json).

Adopt **C01 and R2-I01 CLOSED_SOURCE_ONLY**, retaining the unexercised-wrapper caveat. C02/C03/C04 and R2-I02..06 remain PARTIAL. All R3-N01..06 are CONFIRMED; carry NF-1..6 into the bounded correction. Seven supplied diffs have independently verified semantic reconstruction; the five older textual comparator mismatches are not source defects. Owner 30/10 PASS counts remain cited evidence only. Neither suite is safe to rerun unchanged because real os.kill defaults remain reachable.

## Narrow R4 assignment

[Full Antigravity R4 prompt](../implementation/handoffs/MC-002-INTA-FE-VALIDATION-R4-ANTIGRAVITY-PROMPT.md), **READY_NOT_DISPATCHED**, uses new paths and the exact R3 baseline. Preserve accepted dispatch/guard ordering and all historical packets. Correct actual cleanup callers/results, reproducible launcher/observer binding, safe signal mocks, strict evidence schema, proposal/plan labels, real entrypoint/test reach and explicit fast-refusal proof basis.

One coordination rider avoids carrying a known residual into another round: parent/name arguments alone do not establish immutable identity, and kill(pid,0) polling does not capture owned-child exit. Keep the helper's fail-closed checks and use created process handles with checked bounded wait/reap at the real call sites. No generic process manager or unrelated rewrite is assigned. This is the existing R3-N01/N06 lifecycle gap, not a new architecture or PO decision.

The binding record must be honest about which private paths are only proposed until Codex stages dependencies. No dependency copy/install or real Next/observer is assigned here. Do not weaken the approved never-listen boundary to sampled absence; keep zero-sample UNKNOWN, and provide a reviewable complete proof basis or explicit blocker before runtime.

## Provenance and current-resource notes

The reviewer report section 1 says the manifest lives only in the export. Actual raw/export manifest exists and matches; record that isolated narrative erratum without altering the reviewer files or rejecting the correct source findings. Its section 10 has seven numbered groups with subcorrections; the human summary's eight-item shorthand does not create a new finding.

The review's preserved OPEN privacy/PG wording belongs to its frozen source-review input set. [Separate Codex privacy/teardown return](inta-codex-privacy-teardown-return.md) now records actual-secret scan **PARTIAL / zero matches in selected scope** (raw QA missing), exact PG **stopped and retained, exit 0**, and unchanged source/59-file ledger. No independent acceptance of that separate packet is implied. PG is not an available running prerequisite; R4 must not start it, use credentials or run SQL. The recorded stop observation is historical evidence, not a new live check during this intake.

Option A remains approved. All 51 formal results, T11c OUTCOME_UNKNOWN, historical raw-CLI FAIL, Go/Next unknown termination status, final 36-case QA and product/auth/security/Cloudflare/cost/recovery gates remain unchanged. Source fixes → independent R4 review → fresh prerequisites and explicit bounded cue. New R4 outputs are later than the completed privacy scan and need supplemental coverage before final acceptance.

Skipped: reviewed-source/suite execution, new runtime or resource observation, private credential reads, lifecycle, provider calls and commit. Risk: current R3 retains unsafe signal reach, unbound execution and incomplete evidence; do not execute it.
