# MC-P0-DESIGN-R5 — coordinator verification

Task: MC-P0-DESIGN-R5-INTAKE-20261027. Actual inspector: Codex / Local Codex. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; observed base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. Reviewed export `MC-P0-DESIGN-R5-local-20261027-01`; return SHA-256 `85641ebfa6e3bc9de37cee954f9037f15c6644908aba404a7b98bd87b58267bc`.

**Disposition: CHANGES_REQUIRED — retain the design direction and completed corrections; repair the bounded issues below.** R5 is an actual delivered nine-file package, but its standalone prototype cannot initialize as written, and proof content still contradicts approved applicability/canonical data. This is coordinator inspection, not independent design/visual acceptance; previous Codex-derived design authorship remains relevant. No formal gate is promoted.

## What passed

All eight payloads match the declared byte counts/full SHA-256 values. Twelve read/parse checks pass: canonical 20 FR/AC/wave mapping, 63 AC IDs, 14 NFR IDs, 13 screens/nine states, reciprocal screen links, retained three GW sequences/two GW-03 cycles, Atlas 24 records/12+12/seven edges, 4/3/5 Action census, embedded CSS identity, 48 historical records unchanged, and 11 UIUX/two prior source/eight R4 dispositions present.

The actual extracted JavaScript passes `rtk proxy node --check /private/tmp/mc-p0-design-r5-intake-20261027-syntax.js` with exit 0. **This is syntax-only; no prototype execution occurred.** In particular, it does not prove referenced identifiers exist.

Source corrections for canonical oracle identities/milestone predicate, server-side token store/opaque cookie handle, primary Filing observation guard, EDITOR/OWNER assignment, and CSV/XLSX/scoped XLSX direction are present. The final candidate should preserve them.

## Remaining findings

### R5-N01 — P1: missing `$` helper prevents standalone initialization

`prototype.html:657` calls `$('detail').addEventListener(...)` at top level, then lines 670 onward use the same helper to build the causal chain, queues, Grid and brief. No `const/let/var $`, function declaration, window assignment, external script or named element supplying `$` exists anywhere in this standalone HTML. R4 had `const $=id=>document.getElementById(id)`; R5 removed it while retaining the callers.

Consequently, a standalone page reaches an unbound identifier at line 657 before initial dynamic rendering. This is a source-confirmed startup defect, not a browser-observed exception. `node --check` and the reported clean design lint do not detect it.

Minimum correction: restore one local lookup helper before its callers, or use the platform lookup directly consistently. Add an undefined-identifier/bootstrap dependency check using permitted existing tooling; do not inject `$` from a test harness to conceal a missing page dependency. Recheck the exact standalone script; record actual interactive bootstrap only when browser execution is permitted.

### R5-N02 — P1: typed proof fix still changes applicability and canonical facts

The numeric-suffix cross-kind proof lookup is removed, but `prototype.html:368` now states that proof criteria in MatterControl attach strictly to Requirements and defaults all otherwise-unlisted Actions to NOT_REQUIRED. `validation-plan.md:50` repeats the exclusion. Approved `state-semantics.md:10` explicitly allows verification on Action/Filing when proof is required; unspecified criteria without an explicit exemption do not imply NOT_REQUIRED. Scope the no-proof statement to the supplied canonical Actions or model actual declared applicability. Do not introduce a new product-wide prohibition on proof-bearing Actions.

Explicit relation content also remains wrong:

- `prototype.html:365` says AC-06 is blocked by upstream prerequisites and assigns submitter U-01. The embedded canonical record is COMPLETED, dependency READY, owner U-03; the Atlas action records the first signature receipt.
- `prototype.html:352` still declares DEP-05 blocked and turns RQ-05's displayed historical proof into UNVERIFIED, despite the retained canonical historical VERIFIED baseline. Historical self-review/current-policy caveats must remain distinct from an actually recomputed new snapshot. Do not silently change the baseline or assert a newly evaluated gate without one.

Keep explicit record/criterion/version links, but source the panel's canonical facts from the dataset and separate current-policy caveats. Add checks against canonical identity/state/owner/edge facts, plus a separately labelled proof-required Action fixture. AC-05 must remain NOT_REQUIRED without borrowing RQ-05 evidence.

### R5-N03 — P2: Back still loses a saved proof mode

`handleBackPrev()` at `prototype.html:393–400` sets `detailMode=prev.mode`, calls `openRecord()`, then tests `detailMode==='proof'`. `openRecord()` sets `detailMode='record'` at line 313, so that test can never restore proof mode for a normal record. Reachable example: AC-05 → RQ-04 → proof → click the AC-05 breadcrumb → Back to RQ-04; the saved proof view is replaced by record detail.

Keep the popped mode in a local value across the `openRecord()` call, then restore the correct view. Also define breadcrumb traversal as returning/truncating the trail rather than repeatedly appending an ancestor. The separate R4 stale-session bug is fixed by centralized cleanup on fresh-open and native close; preserve that correction and the independent draft map. Actual focus behavior remains unexecuted.

### R5-N04 — P2: validation still credits unimplemented/unexecuted behavior

`validation-plan.md:45–64` marks Requirement creation, proof submission/review, atomic bulk execution, version promotion, XLSX export, Filing cycles and permission enforcement `CONFIRMED_IN_PROTOTYPE`. The prototype explicitly declares no backend/login/upload/save/verification/export; its Data operations view is specification prose rather than those commands. The new syntax check cannot establish those outcomes, and R5-N01 prevents normal initial rendering anyway.

Classify design/source coverage separately from execution: SPECIFIED_ONLY/source inspection where applicable, NOT_RUN for product/interactive outcomes, and actual results only with retained receipts. Lines 75 and 164 also carry static-export confirmation without a declared R5 capture/input binding. The existing R4 image is not proof of a changed R5 export. No R5 screenshots or raw check scripts/logs are included in the nine-file package, despite the finalization prompt requesting reproducible checks/evidence.

Provide bounded source-check scripts/logs with actual command/tool/version/UTC/exit/input/output pins. Do not repeat all product tests in a design task, fabricate logs or use a new renderer to bypass browser restrictions. A disabled specimen is useful design material; it is not an executed operation.

### R5-N05 — P2: handoff changes the component inventory and overstates authority

`zcode-handoff.md:16` places existing generic primitives under `apps/frontend/src/components/ui/`, which is absent. The actual Atomic inventory is under `components/atoms`, `molecules`, and `organisms`, as previously verified. Point to the real primitives instead of directing a duplicate UI layer. Business compositions remain under `src/features/*`.

Line 13 calls this design an exact binding frontend-backend implementation contract. Keep it as the UX consumer/handoff specification, subject to approved rules and the separately versioned local contract. Do not overwrite API/security/schema authority or the currently running ZCode contract to resolve design prose.

## R4 finding disposition in this inspection

| R4 finding | Current coordinator assessment |
|---|---|
| I01 canonical mapping/milestone | SOURCE_CORRECTED; execution claims handled separately in N04 |
| I02 token storage | SOURCE_CORRECTED |
| I03 Filing upload/stage | Primary spec/handoff/oracle SOURCE_CORRECTED; retain artifact/observation distinction in all copy |
| I04 proof lookup | PARTIAL: cross-kind borrowing removed; N02 still blocks semantic closure |
| I05 modal lifecycle | PARTIAL: fresh-open/close cleanup and real origin corrected; N03 mode restoration remains |
| I06 assignment permission | SOURCE_CORRECTED; no product authorization acceptance claimed |
| I07 formats/privacy | SOURCE_CORRECTED in direction/checklists; no actual import/export acceptance claimed |
| I08 states/evidence | PARTIAL: real loading markup, labelled disabled controls, tailored empty copy and reconciled counts added; N04 remains |

These are bounded source assessments, not independent closure of historical records. Other role-context specimen text still uses personas; actual permissions continue to follow the approved matrix.

## Continuation

Repair N01–N05 together as one design correction delta, keeping all compatible R5 work, existing FR/GW IDs and Enterprise Precision direction. No whole-product redesign, new wave gate or W0 restart is needed. Preserve immutable R5 bytes when exporting a corrected revision. ZCode continues the full BE+FE plan against approved requirements/current contract and can reuse compatible reference details; do not wholesale adopt the contradictory proof model or missing component inventory.

Skipped: DOM/prototype execution, new rendering/capture, keyboard/touch/screen-reader, product/build/DB/provider checks, AC-137, agent dispatch and Git mutations. Risk: syntax/lint success is being mistaken for a functioning prototype and verified product behavior; the proof model can misdirect P0 implementation until corrected.
