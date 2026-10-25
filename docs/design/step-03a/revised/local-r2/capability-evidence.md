# MC-003A local-r2 capability evidence

## Local R2 capability and evidence contract

Revision: local-r2, STEP 03A.3. Local-r1 and all previous review evidence remain historical. Classification refers to this concept, not the future production application. IMPLEMENTED_AND_TESTED is always qualified by method; no browser interaction has been executed. Render status: **RENDERED_VALIDATION_PENDING_MANUAL_CAPTURE**.

| Capability | Classification and evidence | Expected interaction for later approved STEP 03B / Antigravity |
|---|---|---|
| Canonical Atlas board/fixture state mapping | IMPLEMENTED_AND_TESTED at source-extraction layer only; r2 source-check results verify values/IDs. Not a rendered or authoritative state test. | Render the authorized source state and reasons consistently across views. |
| Row Up/Down/Enter/Space; nested-input exclusion | IMPLEMENTED_NOT_TESTED in browser. Historical local-r1 VM assertions cover only selected logic, not native focus. | Row movement must preserve context; nested inputs retain their own editing keys. Full cell navigation remains SPECIFIED_ONLY. |
| Focus rings, native dialogs, Escape and origin/tab return after rerender | IMPLEMENTED_NOT_TESTED in browser; no headless Chrome run, native focus measurement or keyboard PASS evidence. | Trap/restore focus appropriately; retain origin; provide a labeled fallback when the opener disappears. |
| Representative inline title editor | IMPLEMENTED_NOT_TESTED in browser. Shared metadata helper is unchanged from local-r1; prior VM tests are historical. | Enter commits an allowed value, Escape cancels, invalid value/error stay local; preserve selection/filter/scroll. |
| Bulk title/description/internal owner/due | IMPLEMENTED_NOT_TESTED in browser. Blank means unchanged; RQ-10 conflict/RQ-12 denial are synthetic scenarios. Metadata/audit helper unchanged; prior VM logic evidence does not prove authorization. | Preview exact IDs/fields; recheck rights/revision; per-record atomic change+audit; retain unchanged failed rows/reasons and persistent partial results. |
| Responsive CSS and all matching mobile rows | IMPLEMENTED_NOT_TESTED in browser. No viewport/zoom/touch/geometry evidence. | Keep all matching records reachable, meaningful navigation and recovery; evaluate actual device/zoom. |
| Evidence context, versions, rationale specimen | IMPLEMENTED_NOT_TESTED in browser for local display only. Historical self-review remains disclosed; missing proof/authority prevents new full acceptance. | Designated independent verifier, exact criterion/version/validity and rationale; recompute aggregates via authoritative system. |
| Upload/import/review feedback specimens | CONCEPTUAL_ONLY; upload is a toast, import wizard does not create records, no authoritative verification or filing submission. | Validate and retain provenance; upload must not verify or auto-promote. |
| Four specification-only screens; full filing lifecycle and permissions | SPECIFIED_ONLY; NOT_TESTABLE_IN_CONCEPT as complete flows. | Matter List/My Actions/Waiting On/Filing Detail and stage/error/repeat behaviors follow approved contracts. |
| Full spreadsheet paste/cell editing, real parsing/export, auth, persistence and production audit | NOT_IMPLEMENTED; NOT_TESTABLE_IN_CONCEPT. | Implement only after the separate design/architecture gates; do not infer an API or library here. |
| A/B/C direction boards | CONCEPTUAL_ONLY / REVIEW_BOARD miniatures, not a 1:1 application. | PO chooses one coherent direction after actual evidence; no automatic approval. |

Requirement ≠ Action. Evidence Requirement ≠ Evidence. COMPLETED ≠ VERIFIED. No classification grants production readiness, formal QA or PO approval. Proposed keyboard/focus/responsive behavior elsewhere in this document is expected interaction unless this table identifies an executed source check. No blanket interaction PASS is implied.

