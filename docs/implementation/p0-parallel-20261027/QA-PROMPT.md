# MC-P0-W1W5-STATIC-QA — Local Codex, frozen source review

Owner actual Local Codex subagent `w1w5_source_qa`; priority P0. Read shared README completely. You are not alone: ZCode owns product edits; other Codex agents own separate outputs. Do not revert, modify, execute or import reviewed source. Use the frozen copy and selected manifest pins so ongoing ZCode work cannot invalidate the reviewed bytes.

Goal: find actionable correctness/security/requirements gaps in existing W1–W5, especially blockers that should be fixed before full product handover. This is a nonauthor static source review, not independent runtime/visual acceptance. Requirement linkage must use actual approved FR/AC/RULE ids, not invented tests or policies.

Prioritize at most **five substantive findings** after tracing concrete callers/dataflow:

- W3 proof/version: current-vs-fixed binding, expiry/dispute/revocation recomputation, independent reviewer/actor scope, subject epoch/version/criterion fencing, content authorization and integrity.
- W4 Filing: nine-stage guards, signatures/package checks, receipt vs approval, repeated cycle/submission/observation binding, reopen/outcome-proof epochs, correction history.
- W5: one authorized consistent snapshot, unavailable vs empty, Next/Waiting/critical chain/gaps/context and causal links. Check actual producer and FE consumer fields/meaning.
- Shared W1/W2 boundaries relevant to the above: current rights, CAS vs 409 vs UNKNOWN, replay/readback/draft privacy. The original CW1-F01..03 have fixes; verify current paths before reporting them again.

Read corresponding tests and approved rules; identify a real trigger and wrong result, the exact frozen files/line locations and test gap. Distinguish a contract/design choice pending acceptance from a confirmed implementation bug. Report lower-confidence hypotheses separately and sparsely. Do not demand extra product scope, perfect abstractions, production providers or browser proof from unit tests.

Output only new `docs/testing/p0-parallel-20261027/qa/`, after absence check:

- `return.md`: findings first, severity/trigger/impact/source/requirement/minimum correction/validation; then inspected scope and no-execution limits. If none confirmed, say so and preserve gaps.
- `inputs.json`: selected original-relative paths, frozen hashes, exact source lines and tool metadata. Confirm relevant frozen files unchanged at close.

Do not run the source/tests, start services, inspect live DB/processes, use credentials, edit code or message ZCode. The coordinator will deliver findings; ZCode decides the current-source delta and performs author fixes. The reviewer does not self-award acceptance. End with skipped checks and remaining risk.
