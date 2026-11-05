# R9 progress intake — 2026-10-27

Task MC-P0-DESIGN-R9-PROGRESS-INTAKE; actual Local Codex reviewer; priority P0. Existing R8-N01..04 and parent approved FR/AC/NFR/GW scope; no new implementation or acceptance scope. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, reference HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. This is an interim progress review; the design author is still preparing the final return.

## Observed progress

Current R9 has an updated strict mock adapter, three additional check scripts, updated spec/delta/validation/consumer handoff/ledger, raw log/receipt files and a manifest. The previous no-new-export observation is superseded for these files. Product source was not modified by this review.

Reviewer actually executed, from repository root:

- `rtk proxy node docs/design/p0-handoff-r9/checks/check_r8_n01_n04_regressions.js`: exit 0, 13 assertions pass.
- `rtk proxy node docs/design/p0-handoff-r9/checks/check_strict_dom_adapter.js`: exit 0, 9 adapter selfchecks pass. These verify the adapter's selected assertions, not complete browser DOM conformance.
- `rtk proxy node docs/design/p0-handoff-r9/checks/check_r8_baseline_redgreen.js`: exit 0. With the same corrected mock, R8 reproduces draft resurrection/title/reason loss and R9 does not. R8 is read-only.
- Manifest verification at `2026-10-27T08:34:25.204541+00:00`: all 62 declared payload paths/byte lengths/SHA-256 match, no missing or undeclared files after the explicit manifest/return exclusions.

Tool outputs and exact exits are retained in [the reviewer receipt](../testing/p0-design-r9-progress-review-20261027.json). This supersedes the earlier failing new regression result for the updated mock snapshot; it does not rewrite earlier evidence or grant browser/product security acceptance. The other owner-reported checks were not independently rerun here.

## Remaining closeout items

1. `docs/design/p0-handoff-r9/return.md` is still the inherited R8 return, SHA-256 `ba6e720a865b989f04416d1631d16317df049d4e0050c1005d21b55bc5f1b1db`, titled `MC-P0-DESIGN-R8`. Replace it with the actual R9 final return, current consumer/contract input, limitations, manifest pin and accurate tests. Report its final hash separately.
2. Eleven inspected author receipts under `evidence/run-20261027T081038Z/` use malformed UTC strings, such as `2026-10-27T08:10:50.6NZ`. The pin-verification argv also contains a descriptive placeholder rather than the four exact path arguments. These receipts cannot establish exact valid execution timing/argv. Preserve already pinned evidence, append an explicit provenance erratum and capture any replacement execution in a new attempt with actual argv/cwd/tool versions/start/end UTC/exits/raw logs. Do not guess historical timestamps or relabel a later rerun as the original run.
3. Rebuild the final manifest after closing documentation/evidence. Continue excluding manifest/return to avoid cycles; return pins manifest; final message reports return hash. No candidate-wide acceptance follows from today's 62 matching pins alone.

Proposed status: NONBROWSER_REGRESSION_PROGRESS_CONFIRMED / FINAL_RETURN_PENDING. No new design generation or author dispatch performed. Complete current R9 rather than start R10 or another planning pass. Claude's independent product implementation may continue using reconciled inputs while final handoff closure remains pending.

Skipped: design source fixes, full semantic/structural/visual/accessibility re-audit, browser/human study, product implementation/runtime, private resources and Git mutation. Remaining risk: final return and evidence provenance are unfinished; mock success is not visual, product authorization or release proof.
