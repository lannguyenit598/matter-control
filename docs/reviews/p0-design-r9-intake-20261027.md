# Design R9 — targeted source/mock intake, 2026-10-27

Verdict: **CHANGES_REQUIRED / incomplete candidate**. R9 contains real source corrections but is not a verified completed handoff. This review is separate from Claude's product W1 implementation.

Task MC-P0-DESIGN-R9-TARGETED-CORRECTION; scope R8-N01..04 under the existing approved requirements and design semantics. Reviewer actual Local Codex, nonauthor. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. The candidate is uncommitted; `closing-check.json` in [the reviewer evidence directory](../testing/p0-claude-w1-review-20261027/) records full R9 file pins. No owner file was modified.

## Findings disposition

| Finding | Observed result | Disposition |
|---|---|---|
| R8-N01 access-loss purge | Shared cleanup clears record/form draft maps, bulk selections/results/intents and drawer trail; revoke→regrant and retained-read downgrade checks pass | CORRECTED_IN_REVIEWED_SOURCE_AND_MOCK_SCOPE; broader scope-isolation/browser security acceptance not awarded |
| R8-N02 form intent retention | Create Matter retention and explicit discard checks pass; promotion reason is written into retained state and restored textarea markup | PARTIAL_VERIFICATION; original regression suite fails due to mock limitations, not proven browser draft loss |
| R8-N03 independent promotion target | Separate target/current guard controls and target checks exist; missing-target/role checks pass in diagnostics | SOURCE_CORRECTION_PRESENT / VERIFICATION_INCOMPLETE; target/current/ack tests need a working mock |
| R8-N04 accurate return/ledger/evidence | `return.md` is byte-identical to R8; findings ledger remains byte-identical to the earlier ledger; no current R9 receipts/complete handoff | OPEN |

Source observations: `src/logic.js:363` shared purge; `:966` promotion draft state and `:972` target control; `:1482` form input state; `:1504` target change invalidates acknowledgment; `:1530` access-loss invokes purge. These are concept-state changes, not product enforcement.

## Checks actually executed

1. `rtk proxy node docs/design/p0-handoff-r9/checks/check_mock_dom_bootstrap.js`: **exit 0, 29 checks pass**.
2. `rtk proxy node docs/design/p0-handoff-r9/checks/check_r8_n01_n04_regressions.js`: **exit 1**, after four passes. First failure: promotion reason `.value` is empty after view switching. Later original assertions did not execute in that invocation.
3. Reviewer diagnostic continuation, preserving the original suite and prototype: **8 assertions pass, 5 fail** when all 13 are visited separately. This is diagnostic evidence, not a replacement passing suite. A separate assertion confirms the unsent reason is present inside generated textarea markup after navigation while the mock's `.value` remains empty.

`checks/strict_dom.js:135` only scans tags/attributes; it does not hydrate textarea values or option text/default values like a browser. This explains why a `.value` failure alone does not prove that R9 loses the user's draft. Other failing diagnostics include option text/current selection and checkbox state. Fix the test adapter where necessary, preserving negative assertions, then rerun the unmodified behavioral expectations. Do not edit the prototype to use invalid textarea markup merely to satisfy the mock.

The reviewer initially described the first failure in commentary as draft loss, then corrected that statement after checking generated markup and the mock. The retained receipts preserve both the actual failure and the diagnostic result. No visual or browser acceptance was inferred.

## Handoff integrity

Observed R9 pins:

- `return.md`: 11,319 B; SHA-256 `ba6e720a865b989f04416d1631d16317df049d4e0050c1005d21b55bc5f1b1db`, identical to R8, titled/task-scoped R8.
- `findings-disposition.json`: 78,967 B; SHA-256 `72470e86a1d1cfc13de34a157be2768f0195a9df3369a325cf74764578760076`, identical to the inherited ledger and still identifies R7.
- `prototype.html`: 213,630 B; SHA-256 `3a6c15484a722408f66137e68b3d7ada03c0f8670ffb421e8e3489b831ae0e2c`.
- `src/logic.js`: 117,380 B; SHA-256 `d8e349704d898f6d42e6cf2a9cb0394d7093b1176cb4e3f965013d59b8323c18`.

The copied return therefore cannot establish a fresh R9 output manifest. Retain historical records, append R8-N01..04 dispositions with source/tests, correct revision/provenance and refresh every declared artifact pin. Capture commands/exits/UTC and a complete reproducible source/export inventory; do not claim tests that have not passed. R9 remains candidate input, not design acceptance or automatic permission to overwrite product implementation.

Next owner action: finish R9's own regression adapter/checks, evidence and return/ledger in one coherent candidate. The implementation owner may continue unrelated product work; another design rewrite or waiting for all backend implementation is unnecessary.

Skipped: browser/render, visual geometry, keyboard/touch/screen-reader checks, AC-137 human study, full requirements/study-package re-audit, source fixes and external-agent dispatch. Remaining risk: R9's new behavioral suite is red and its handoff metadata is stale; no design completion or product acceptance is awarded.
