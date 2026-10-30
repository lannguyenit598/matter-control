# INT-A — Antigravity R4 intake

Task MC-002-INTA-FE-VALIDATION-R4-INTAKE. Actual actor Local Codex; author human-returned actual Antigravity / Gemini 3.8 Flash High. Branch codex/unified-project-flow; base/head a62d838791ba188838c4ff00b7b6e265ac775056. No commit. **SOURCE_RETURN_RECEIVED / IN_REVIEW / INDEPENDENT_SOURCE_REVIEW_PENDING / RUNTIME_NOT_RELEASED**.

## Integrity and source progress

[132 intake checks](../testing/inta-fe-validation-r4-intake/checks.json) pass: 22 declared payloads / 285,768 bytes; all 22 human-reported pins; 23 exact raw/export files including manifest with no extras; seven scratch/export core pairs; four Python AST parses without importing code; frozen R3/R2 payload preservation; seven exact semantic R3→R4 diff reconstructions; recorded 46 selfcheck results and 13-case standalone launcher stdout; 25-entry plan including NODE_ENV production; original guard hash and unchanged HEAD.

Owner claims 46/46 selfchecks and 13/13 launcher mocks. They remain owner execution evidence; Codex did not rerun them. Improvements visible in source: all five cleanup call sites pass parent/name/handle and retain results; owned-handle wait exists; present error fields reject even falsey values; omitted sample/exit defaults no longer look supplied; NODE_ENV production is in plan; strict path-collision check and a binding candidate are delivered; standalone launcher stdout now exists.

The [static safety assessment](../testing/inta-fe-validation-r4-intake/selfcheck-static-safety.json) by an internal Codex explorer confirms the os.kill rejecting guard is installed before coordinator import on the normal fresh-script route and direct calls inject fake signal tracking. This is materially safer than R3, without an independent execution verdict. Abort-only tests still retain real Popen defaults behind early returns; clock/sleep and harmless wrapper/Node subprocesses are real. The 46/13 counts do not cover every claimed cleanup caller or the real launcher CLI adapter.

## Focused questions for independent review

[Five source observations](../testing/inta-fe-validation-r4-intake/source-observations.json) are Codex questions, not an OpenCode verdict:

- **R4-C01, P1:** probe-before-poll can count a sample after an already-exited child. It does not establish an active during-run sample. The proposed five-point proof cites `spawnCalled:false`, but the real CLI does not persist that result for the coordinator. No complete never-listen proof follows from the reordered loop.
- **R4-C02, P1:** coordinator still uses shutil.which before its fallback; wrapper uses PATH python3/PYTHONPATH; child/observer HOME/TMPDIR/PATH remain inherited. Absolute Next/cwd defaults point at original harness/dependency links, not a verified private stage. Candidate staging remains unperformed.
- **R4-C03, P2:** cleanup actual callers improved, but substring/parent/handle checks are not a captured immutable start identity. Guard static import runs before the later hash check; optional checked guardPath is not necessarily the imported path. Assess exact supported-path guarantees and failure boundaries.
- **R4-C04, P2:** parent-directory fsync exceptions are swallowed at observer.py59–68, so durability failure is not reflected in final evidence.
- **R4-C05, P2:** observer-exit comparison still accepts False/0.0; identity can be omitted. Exact standalone suite command/exit/stderr and version-read provenance are not retained as independent execution records. Need accurate schema/test-reach/proof wording.

Do not close every finding based on the author claim. The [OpenCode R4 prompt](../implementation/handoffs/MC-002-INTA-OPENCODE-FE-R4-SOURCE-REVIEW-PROMPT.md) requests independent adjudication of these and all carried R2/R3/NF findings on the exact packet. It is READY_NOT_DISPATCHED, read/hash/static only. No fifth author loop is dispatched preemptively.

## Current gates, provenance and parallel work

Author return incorrectly labels the single external-blocked case as T11c. Preserve canonical 36 required / 14 product-deferred / one production-feasibility blocked partition: T11c OUTCOME_UNKNOWN is a retained runtime outcome, not a reassigned external-blocked row. No case ID or historical result changes. Its privacy/teardown OPEN language must distinguish executed Codex evidence from pending independent acceptance: PG was stopped/retained with exit0; original privacy is PARTIAL plus a 123-file supplement awaiting QA. R4 is later and is not covered by that prior actual-value scan.

Option A remains approved, not an implementation PASS. No live runtime/Next/observer/dependency staging/private credential or PG action is released. Go/Next historical unknown wait/termination evidence stays unchanged. Product exclusion/dynamic-cache/final36QA, MC-002/architecture/security/cost/recovery/Step03B gates remain open.

Parallel privacy/teardown QA and BE02/N1 contract review may continue with their already pinned read sets and disjoint outputs. R4 source QA is a third unique output namespace; if only two OpenCode sessions are available, queue it after one completes rather than changing providers. Mimosa operator lane stays separate.

Skipped: reviewed source/suite execution, live resource observation, credentials, staging, signals, lifecycle, external provider dispatch and commit. Risk: current fast-refusal proof and private binding are insufficient for a runtime cue; independent review and concrete corrections remain necessary.
