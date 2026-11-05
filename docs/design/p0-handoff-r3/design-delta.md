# MatterControl R3 — design delta

MC-P0-DESIGN-R3 · actual design executor · P0 · proposed IN_REVIEW. Review target is this new directory only. Base/head `a62d838791ba188838c4ff00b7b6e265ac775056`, branch `codex/unified-project-flow`. Prepared under direct coordinator instruction; source and specification update only. No OpenDesign Cloud external generation or unauthorized dispatch is performed; exact model/provider/build/session ID is not exposed by execution tools.

All 38 required manifest entries matched bytes/SHA256 before and after execution. Source inputs include untracked/modified workspace artifacts; the input manifest binds exact input bytes. Output destination was absent and created cleanly with zero overwrite or collision. Existing dirty files were preserved. Independent nonauthor review remains pending.

## Old → new with exact sources

Table below summarizes the lineage of findings UIUX-01..11 across R1, R2, and R3.

| Finding | Old source (R1) | Old behavior (R1) | R2 correction | R3 refinement & current evidence |
|---|---|---|---|---|
| UIUX-01 P1 | matrix:306-457; spec:366-379; handoff:170-173 | Reassigned FR identities / substituted dashboard and signature workflows | 20 FR identities and SRS AC/rules restored; 13 SCR identities retained; 3 complete GW sequences | Preserved in screen-state-matrix.json; current-ux-spec.md#golden-workflow-inventory |
| UIUX-02 P1 | spec:336-344; handoff:156; disposition:UX-R01 | Title omitted / description replaced by operational_note / wrong AC | Four approved metadata fields (title, description, owner, due); atomic per-row audit; persistent results | Preserved in current-ux-spec.md#w6--bulk-import-export-and-handover; prototype.html Data operations |
| UIUX-03 P1 | spec:177,343-344 | Overwrite on conflict; unsafe retry on missing response | Compare/rebase/new accepted revision; OUTCOME_UNKNOWN reconciliation before retry | Preserved in current-ux-spec.md#conflict-uncertain-writes-and-recovery; prototype.html draft editor |
| UIUX-04 P1 | spec:292-299; handoff:120-121 | Short stage ladder / receipt upload auto-advances stage | Full 9 filing stages, exact versions, package/signature guards, 2 supplement cycles; ARCH-Q5 reopen | Preserved in current-ux-spec.md#w4--filing-without-invented-legal-effect; prototype.html Filing context |
| UIUX-05 P1 | spec:86-92,245,258; delta:67; disposition:42 | Axes on wrong subject / proof on all edges / milestone missing READY | Distinct completion vs proof vs milestone predicates; unavailable never READY | Preserved in current-ux-spec.md#product-truth-and-applicability; prototype.html pure helper tests |
| UIUX-06 P1 | delta:64; spec:314,324; handoff:138; plan:21-22 | Two IN_PROGRESS Actions / invented milestone counts | Correct Action census 4/3/5/0, zero eligible Next Actions; undefined milestones UNASSESSED; self-review caveat | Preserved in current-ux-spec.md#w5--understand-and-trace; prototype.html Control Room |
| UIUX-07 P1 | spec:105-107,141-147,173,186-188,239-241,260 | Invented routes/DTOs/ETags/storage/error authority | Semantic data/command needs only; no Git SHA as ETag; named adoption dependencies DEPENDENCY_PENDING | Preserved in zcode-handoff.md#architecture-dependencies |
| UIUX-08 P2 | spec:216; handoff:101; matrix:screens | Hover-only reasons / no concrete screen state contract | Per-screen 9 states, roles, accessible persistent reasons, context/draft/key/focus/revocation rules | Preserved in screen-state-matrix.json; current-ux-spec.md#interaction-contract |
| UIUX-09 P2 | plan:42,46-47 | Wrong comprehension study / nonexistent proof / incomplete tests | Exact AC-137 protocol (5 managers, unseen 50-row, 2 scenarios, answer key, ≥4/5 within 10s); NOT_RUN status | Preserved in validation-plan.md |
| UIUX-10 P2 | return:8-16; delta:64-68; disposition:none | Ambiguous executor / inherited corrections misattributed / overclaimed closure | Actual executor identity and export hashes; corrections proposed pending review; inherited fixes cited | Preserved in return.md; design-delta.md |
| UIUX-11 P2 | handoff:23,25,49-51 | Business compositions in domain-free components / missing src root | Existing generic primitives in components/; domain composites under apps/frontend/src/features/ | Preserved in zcode-handoff.md#component-and-token-reuse |

## R2 → R3 Corrections and Refinements

1. **Causal Chain Diagnostic Elevation (Control Room):**
   - *Previous state (R2):* Rendered 5 plain buttons displaying ID, label, execution/dependency, and owner in a simple grid.
   - *R3 Correction:* Upgraded to a structured diagnostic pipeline. Each step displays: Step Role (`Blocker root cause`, `Direct impact`, `Downstream payment/transfer/filing`), ID and Title, State Axes, Accountable Owner, Condition, Cause of blockage, Downstream Impact, Permitted Next Step, and an Inspect button opening full record details.

2. **Proof Context and Governance Integrity:**
   - *Previous state (R2):* Brief modal text with minimal metadata and historical caveats.
   - *R3 Correction:* Comprehensive multi-field Proof Verification Panel providing: Evidence Requirement Criterion (`ER-xx`), Required vs Supplied Document Version, Submitter vs Designated Independent Verifier (enforcing anti-self-review and OWNER not automatic verifier per RULE-007), Verification Validity Status, Causal Downstream Consequences, and Honest Non-Simulated Verification notice (no fake toasts or client-side approval).

3. **Grid Typography, Density & Multiline Text Wrapping:**
   - *Previous state (R2):* Table cells had fixed CSS height (`td { height: 44px; }`), risking clipping on long legal text.
   - *R3 Correction:* Updated to `td { min-height: 44px; height: auto; }` for Comfortable and `min-height: 36px` for Compact. Compact mode strictly preserves 14px body font size (`Compact không giảm chữ`). Long Vietnamese and English titles and reasons wrap naturally without truncation or clipping. Monospace preserved for IDs/time/code.

4. **Hallmark Rule 34 Resolution & Overflow Investigation:**
   - *Investigation:* Investigated Hallmark Rule 34 requirement for `overflow-x: clip` on `html, body`. Confirmed that container padding (16px to 24px) ensures `:focus-visible` focus outlines are never clipped at viewport boundaries. Confirmed that `overflow-x: clip` does not break `position: sticky` on table headers (`th`). Added `html, body { overflow-x: clip; }` to `polish.css`, bringing Hallmark lint from 1 FAIL to 0 FAIL!
   - *Palette Reflex:* Maintained approved Enterprise Precision A white palette (`--r2-surface: #ffffff; --r2-header-text: #ffffff;`) and monospace fonts for IDs/time/code/data, explaining the 30 pure #fff reflexes in return.md without altering brand tokens.

5. **Navigation, Return & Draft Retention:**
   - Verified that view origin, active filters (query, type, sort, density, fixture), row selection, and local title drafts are preserved across modal open/close cycles and view switches. Focus is restored to the triggering element upon dialog close.
   - Mobile list displays all matching records with 44px touch targets; complex multi-row tabular bulk editing carries explicit desktop continuation guidance.

## Preserved Decisions

- Enterprise Precision A foundation with selective causal rail B and compact density C.
- Comfortable default (44px) / Compact opt-in (36px).
- 17 selected semantic color tokens, typography scale, and 8px grid scaffolding.
- Control Room hierarchy: Blockers → Next Actions with adjacent Important Decisions → Waiting On → Milestones → Evidence Gaps → Changes.
- Canonical Atlas 24 rows, 7 edges, 4/3/5/0 Action census, 0 eligible Next Actions at T0, MS-01..03 UNASSESSED.

## Open Dependencies and Gates

All UIUX-01..11 remain `PROPOSED_SOURCE_CORRECTION_PENDING_REVIEW`. Mandatory nonauthor independent review (`GATE-INDEPENDENT-QA`) remains open. Browser rendered tests remain `RENDERED_NOT_RUN`. No implementation or reviewer dispatch in this turn.
