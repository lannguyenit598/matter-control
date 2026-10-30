# MC-P0-DESIGN-R2 — targeted source/spec review

Task: MC-P0-DESIGN-R2-SOURCE-CHECK-20261027. Actual reviewer: Codex / Local Codex, current desktop session. Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. Priority: P0 design intake. Inputs: R2's nine-file export, approved SRS/rules/acceptance criteria and P0 coverage mapping. Evidence: [receipt](../testing/p0-design-r2-source-review-20261027/receipt.json).

**Result: two bounded prototype corrections; visual acceptance remains blocked.** The reviewed specification preserves the approved product model. Continue ZCode's authorized W1–W7 author execution; carry these corrections into W2. This review does not approve a wave, close historical UIUX findings, or replace independent final acceptance. R2 credits Codex as author, and earlier polish also has Codex authorship; this is coordinator source inspection, not an independent nonauthor verdict.

## Findings

### R2-S01 — P3: causal drill-down has no context-aware Back action

Source: [prototype.html:225](../design/p0-handoff-r2/prototype.html#L225), lines 220–240 and 252–257. `openRecord()` replaces the only `currentRecord`; dependency buttons reuse that function. After AC-05 → RQ-04 → proof, `back-record` returns to RQ-04. There is no previous-record stack or labelled Back-to-AC-05 action. The reverse dependency link can open AC-05 again, so the record remains reachable; the missing part is navigation history identifying the user's previous context. Closing restores the external opener, which is a different navigation action.

The explicit Trace experience in [current-ux-spec.md:106](../design/p0-handoff-r2/current-ux-spec.md#L106) and the context-preservation contract at line 81 would benefit from an explicit return path. Users currently reconstruct their route through graph links rather than a Back action, even though per-record draft text remains in memory. This is a navigation refinement, not an unreachable-record or data-loss finding.

Minimum correction: retain the originating record and a small local trail for nested causal navigation, with an explicit Back action; keep proof-to-record return distinct from record-to-previous-record return. Preserve the original external opener for final close. No new product route or API is needed.

Acceptance later: filter Grid, select AC-05, type a draft, inspect RQ-04 and ER-04, return to RQ-04 then AC-05, close to the exact opener. Draft, selection, filter and focus must survive. Inspect actual keyboard/mobile behavior when browser use is available. **Finding confirmed by source control flow; browser reproduction NOT_RUN.**

### R2-S02 — P3: My Actions is a flat assignment table instead of the specified operational groups

Source: [prototype.html:196](../design/p0-handoff-r2/prototype.html#L196), lines 193–215. The `mine` branch selects every Action owned by fixture U-01 and passes the result to the common flat table. It includes historical AC-01/02 alongside WAITING AC-04/05 and BLOCKED AC-12; none of the promised eligible/waiting/blocked sections is built. The explanatory text correctly says there is no eligible Action, and each row retains its separate axes: this is an interaction discrepancy, not a false READY claim.

Compare [current-ux-spec.md:51](../design/p0-handoff-r2/current-ux-spec.md#L51), SRS FR-010 and AC-144. A contributor must distinguish actionable work from waiting and blockers without scanning a historical assignment ledger.

Minimum correction: use the existing record/axis presentation to group the queue. Show an explicit empty eligible group, waiting and blocked groups, and a separate historical/completed section. A WAITING+BLOCKED Action must retain both facts; do not collapse independent axes to one status. Product implementation must use the authenticated actor and authorized results; U-01 remains a labelled prototype alias.

Acceptance later: canonical T0 has zero eligible own Actions, waiting AC-04/05, blocked AC-05/12, and completed AC-01/02 separately. If a record appears in two operational groups, retain one shared identity/draft/selection and explain the overlap. Test a separately labelled synthetic READY Action without changing canonical Atlas. **Finding confirmed by source structure; rendered comprehension NOT_RUN.**

## What was verified

All nine R2 files match the known full SHA-256 values and byte counts, including `return.md` and its eight declared outputs. Twelve independent read/parse assertions passed:

- 20 FR IDs, ordered AC mappings and primary waves match the existing P0 coverage baseline; 63 AC and 14 NFR IDs match.
- 13 screens each specify nine distinct states, and FR/screen links are reciprocal.
- All three complete Golden Workflow sequences remain intact; GW-03 specifies two supplement/response cycles.
- Atlas has 24 records, 12 Requirements/12 Actions and seven edges; Action census is 4 completed / 3 waiting / 5 not started / 0 in progress. No canonical Action is eligible.
- Embedded prototype CSS equals `polish.css` byte-for-byte. The disposition retains 11 proposed corrections and 48 historical records; this count is not independent closure of those records.

Targeted reading also confirms the four-field bulk allowlist, conflict/OUTCOME_UNKNOWN reconciliation, independent verifier requirement, explicit milestone set/UNASSESSED semantics, receipt-versus-approval distinction and recorded-time brief policy. R2 appropriately labels its draft controls, density fixtures and narrative as illustrative rather than persisted product truth.

The selected Enterprise Precision direction remains consistent in source: causal chain first, readable legal text, separate axes, Comfortable/Compact spacing, textual reasons and reduced-motion fallback. The prototype intentionally covers a focused subset; the 13-screen matrix is not proof of 13 implemented interactive screens. Keep the spec/handoff authoritative when composing the product; do not copy the prototype's hardcoded actor, attention or fixture evaluators as enforcement.

## Visual and acceptance boundary

The actual browser inventory returned `Local browser use is disabled in Work settings`. Per the `product-design:audit` capture rule, visual audit stopped. No alternate browser, native app capture, server or renderer was used. No screenshot was inspected and no layout, contrast-in-context, mobile reflow, focus trap/return, screen-reader, touch or AC-137 outcome is claimed. Browser-dependent checks remain NOT_RUN / VERIFICATION_BLOCKED.

The next permitted visual pass should inspect the exact reviewed export at desktop, tablet, 390px and 200% zoom, both densities, long EN/VI content and the last 200-row fixture entry. Operate the full causal round trip and compare My Actions groups before making a visual quality judgment. The five-manager AC-137 study remains separate.

## Routing and output ownership

Only this report and its receipt were added. No R2 files, ZCode workboard/local contract, application source, task gates or historical evidence were edited. No external agent message was sent. Give the report to the already-running ZCode assignment as an incremental W2 correction; no W0 restart or new per-wave review hold is required by this report. A corrected design export should use a new revision/directory and preserve pinned R2 bytes if the design owner chooses to update it.

Proposed status: source check complete, findings OPEN_FOR_CORRECTION; R2 remains IN_REVIEW. Skipped: product execution, builds, runtime, visual/assistive/user studies, external dispatch and Git mutations. Risk: the product can inherit the two navigation/queue gaps if the prototype is copied without the specification; visual quality is still unverified.
