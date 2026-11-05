# Codex parallel review intake — 2026-10-28

Coordinator actual Local Codex; three actual internal Local Codex agents returned (not external OpenCode/ZCode/Claude execution). Reviewed snapshot selected-public535 files/4,533,934 bytes, branch `codex/unified-project-flow`, reference HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`; exact identity is snapshot-manifest hashes. Root verified535 frozen hashes and149 selected report-input pins (51+64+34), zero mismatches. JSON screen map covers13 IDs/117 state cells. Acceptance remains open; static findings require owner reconciliation with the evolving live source.

## Allocation and delivered work

| Lane | Codex owner | Return | Review outcome |
|---|---|---|---|
| Backend/API W6 + F01..03 | p0_backend_qa_20261028 | [backend report](backend-qa/return.md) + input pins | Six actionable static findings; source fixes already present explicitly recognized |
| FE/R9 alignment + functional UX | p0_fe_alignment_20261028 | [FE report](fe-alignment/return.md), [13-screen map](fe-alignment/screen-map.json) + input pins | Eight priorities, functional data safety before appearance; rendered results NOT_RUN |
| Acceptance/recovery | p0_coverage_recovery_20261028 | [coverage report](coverage-recovery/return.md), [execution checklist](coverage-recovery/execution-checklist.md) + input pins | Canonical counts preserved, owner labels stale, real workflow/restore evidence incomplete |

Actual Claude Code retains implementation of both stacks, source changes, current contract/workboard, tests/runtime under its existing authority and final candidate. Codex edited only new review/coordination outputs. No competing product writer was introduced.

## Implementer priorities

1. **Receipt replay scope/intent — BQ-01.** Bulk/import must authorize saved receipt scope, not only requested Matter. Import must bind source+row+content+scope; reused key must not expose a receipt from a revoked Matter or replay a different row/source. Reuse existing saved-scope policy and add multi-Matter/revocation regression.
2. **Frozen FE attempts/preview — FE F02.** Bulk edits invalidate preview. Import/bulk retain exact submitted payload/keys across lost response/UNKNOWN; new keys per click are unsafe. Existing intent helpers are not integrated into the panel/action seam. Show real row results and preserve failure drafts.
3. **Access-loss semantics — FE F01.** Mutation403 with read retained is not full revocation. Actual read-access loss needs shared scoped purge of visible/memory/durable drafts, selections/previews; re-grant cannot revive them. Create-Matter draft retention also needs wiring.
4. **Brief temporal facts — BQ-02/03.** Filing execution events still missing; proof expiry heuristic does not match domain alternatives/epoch/criteria/dependency semantics at t2. Reconstruct actual inputs/evaluate correctly or refuse unsupported reconstruction. Preserve RULE-016.
5. **Import validation/claim retention and package policy — BQ-04/05/06.** Propagate global parser failures instead of empty-success; retain non-authoritative original verification label and include it in content identity; no-signature decision cannot waive required package completeness.
6. **FE usability and R9 reach.** Causal Back/context, Control Room snapshot/causes/accountable owner, reachable data-transfer navigation, Grid density/selection/mobile composition, usable history/provenance/paging, then shared R9 fonts/tokens/spacing/state variants. Preserve already-correct promotion target/expected-current separation.
7. **Evidence completion.** Replace vacuous workflow assertions; reuse existing W4/W6 scenarios and extend to original cross-view workflows. Whole-product restore needs representative relationships/actual object links, consistent boundary, corruption/restart/readback/timing/loss proof. Update stale FR/AC/NFR/GW fields after evidence, not before.

These are source-backed reports, not execution results. Severity in lane reports is prioritization for review; reconcile exact triggers/impact before applying fixes. Do not blindly implement a historical finding against already-fixed code.

## Superseded historical claims

- Current frozen source already has new-row dependency resolution/group transactions, F01 correction, F02 producer/consumer wiring, F03 signature-applicability service/store/API and shared W6+HTTP tests. Older reports/checkpoint labels describing those as absent are historical.
- The owner stop record is useful proof of handoff, but its compilation errors are not current reviewer evidence: this parallel pass ran no build. Root's earlier commentary about starting with that compile issue referred to the stop checkpoint, not a newly reproduced failure.
- W6 has13 shared scenarios with memory and PostgreSQL entrypoints; source presence is confirmed, current execution not reviewed here. Do not repeat “no PG tests”.
- W7 tests are not full original workflows. All3 GW rows remain NOT_RUN. Restore sample is useful partial evidence, not full recovery acceptance.
- Workboard six FR NOT_STARTED and42 AC NOT_RUN are stale/mixed labels, not a reliable percentage of completed code. Canonical14NFR and3GW still need real mapped evidence.

## Next action

Give the existing Claude session `CLAUDE-CONSUME.md`; all reports now exist. Continue the same long assignment and reconcile only applicable findings; do not stop for a new per-wave review gate. After stable source/test/evidence candidate, perform the appropriately independent final review. This intake does not grant production/deploy/paid/Mimosa/commit authority.

Skipped: source fixes, tests/builds/runtime/render/private/Cloud/resource/Git mutation. Remaining risk: static snapshot findings can be superseded by live Claude edits and do not prove current behavior or release readiness.
