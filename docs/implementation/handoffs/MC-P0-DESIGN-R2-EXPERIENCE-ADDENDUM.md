# MC-P0-DESIGN-R2 — experience quality brief

Direct Product Owner instruction: **“UX phải thực sự ấn tượng”** (the UX must be truly impressive). Recorded by Local Codex on 2026-10-27, Asia/Ho_Chi_Minh. This supplements [the R2 correction prompt](MC-P0-DESIGN-R2-CORRECTION-PROMPT.md); send both together to the actual design owner. Status: **READY_NOT_DISPATCHED / DESIGN_BRIEF_ONLY**. Prepared branch/head: `codex/unified-project-flow` / `a62d838791ba188838c4ff00b7b6e265ac775056`.

## Intended experience

MatterControl should make complex legal operations feel understandable, controlled and confidently actionable. A manager can identify what matters, a contributor can act without losing context, and a reviewer can understand exactly what a decision changes. Impress through clarity, continuity, precise interactions and believable operational depth.

Keep the approved Enterprise Precision foundation, typography/palette/density tokens, causal impact rail and D-UX01..04 hierarchy. The 11 R2 correctness findings remain required corrections. This brief improves their presentation and interaction quality; it does not change business rules, approved scope, architecture, performance budgets or release gates.

## Five connected experience moments

| Moment | Required experience | Design specification to return |
|---|---|---|
| **1. Understand the matter** | Control Room presents a clear operational story: blocking condition, cause, consequence, accountable owner and available next step. Important Decisions remain adjacent to Next Actions. Zero eligible work and undefined milestone sets have useful, truthful explanations. | An annotated reading order with realistic Atlas labels and the exact evidence/source behind each displayed fact. Separate unavailable, stale, empty and assessed states. Carry the approved AC-137 comprehension protocol into validation. |
| **2. Follow a blocker to its source** | Selecting a blocker preserves Matter, as-of, origin and selected record while revealing its causal chain and the exact evidence gap. The user can move to the relevant Requirement/Action/evidence and return to the originating row or panel. | A connected Control Room → causal detail → record/evidence → return walkthrough, including back/Escape/focus behavior, unavailable relations and permission changes. Distinguish historical completion from current exposure after an upstream reversal. |
| **3. Work fluently in the Grid** | Stable columns, readable long legal text, clear selection and unobtrusive row actions support focused work. Comfortable/Compact changes density while preserving text, focus and selection. Editing gives immediate intelligible feedback and retains drafts through validation/conflict. | Row/cell/editor states, exact keyboard ownership, filter/sort/pagination behavior, explicit selection scope and persistent partial results. Preserve semantic labels and text reasons. Pending, accepted, rejected and uncertain writes have distinct states; show success only after authoritative acceptance. |
| **4. Make a proof decision with confidence** | Evidence review makes criterion, exact document version, submitter, designated reviewer, validity and consequences visible together. The confirmation explains the effect on affected work. A disabled operation has an accessible reason and an appropriate permitted next step. | A proof-review walkthrough using separately labelled synthetic evidence, plus self-review refusal, stale version, missing designation, challenge and unavailable evaluation. Show authoritative readback after acceptance; do not predict verified/readiness outcomes from a local animation. |
| **5. Hand over a useful brief** | The draft brief tells the story of changes since the chosen baseline separately from what remains outstanding. References return to the source object in the permitted Matter scope. Draft status, window, as-of and provenance remain clear on preview/export. | A brief walkthrough with meaningful changes, no-change, inaccessible data, changed rights and export failure. Keep RULE-016's draft boundary and approved source semantics. |

These moments are presentation walkthroughs within existing P0 flows. They do not replace GW-01..03 or AC-161..163.

## Craft requirements

- **Visual hierarchy:** one clear primary task at each step; strongest emphasis for the current decision or blocking cause. Use alignment, spacing, typography and restrained surface contrast to make a dense screen readable. Secondary metadata remains legible; identifiers and timestamps are consistently formatted.
- **Domain clarity:** preserve separate five-axis labels and show their applicability/reasons. A satisfied count needs an explicit required set. Filing stage, execution and verification remain distinct. Show actual owner/wait relationships without implying external parties can log in or act.
- **Interaction continuity:** drawer/detail navigation keeps origin, selection and scroll context; returning restores a sensible focus target. Nested controls retain their own keys. Long content, dirty forms, missing records and revoked access each have a specified recovery path.
- **Purposeful motion:** describe only transitions that help users follow an accepted change, spatial navigation or an expanding detail. Respect reduced-motion preferences, retain focus and avoid shifting surrounding content. Motion cannot carry state meaning alone or imply a write succeeded. Durations are design proposals, not measured performance promises.
- **Mobile confidence:** prioritize the current blocker, owner, evidence and permitted next action; preserve all matching records and full critical reasons. Use clear touch targets and explicit alternatives for complex desktop work. Preserve the selected information hierarchy at narrow widths and zoom.
- **Complete feedback:** describe loading, empty, no matches, unavailable, forbidden, stale, field error, conflict, partial success and outcome unknown with the cause and permitted recovery. Never replace real behavior with a mock toast or reassuring default.
- **Accessibility as interaction quality:** named controls, text status, keyboard/touch-accessible explanations, field-associated errors, announced async results, visible focus, sensible dialog entry/exit and readable reflow are part of the intended experience. Actual acceptance still requires execution.

## Reviewable delivery

Within R2's existing seven deliverables, add these five walkthroughs to `current-ux-spec.md` and map their components/states/dependencies in `zcode-handoff.md` and `screen-state-matrix.json`. Give each moment its initial state, actor/permissions, user intent, steps, resulting authoritative state, feedback, recovery and keyboard/mobile behavior. Wireframe annotations or source-level diagrams are sufficient for this authorized pass; do not generate new high-fidelity screens or add a separate design system.

Use the selected skills as review guidance: product-flow audit for connected journeys, accessibility for operable states and recovery, and `design-taste-frontend` app-screen guidance for hierarchy/density/craft. Existing approved product rules win over generic stylistic preferences. Preserve R1 and frozen local-r3; create only the new R2 outputs under the correction prompt's boundary.

The R2 review should be able to answer all of the following from its specification:

1. What is the most important issue on this screen, why does it matter, and who can act?
2. Can the user reach the supporting proof and return without losing context?
3. Are the next operation and its consequences clear, including when it is unavailable?
4. Are keyboard, touch, long text, zoom and failure recovery explicitly designed?
5. Can ZCode implement the interaction using existing components and an adopted contract, with missing dependencies clearly identified?

These are qualitative design-review questions, not new measured SLAs or self-awarded PASS criteria. Keep AC-137's approved ≥4/5 managers within 10 seconds as the measured comprehension target. Retain the full workflow, security and accessibility acceptance requirements.

## Execution and review boundary

No design-agent dispatch or product implementation is performed by recording this brief. The current browser setting prevents capture; do not bypass it. Actual rendered layout, motion, focus, touch and screen-reader behavior remain NOT_RUN. Once a permitted target is available, capture the exact exported revision's connected flows, inspect them, and run the required interaction/user-task checks before claiming experience acceptance. A separately assigned nonauthor reviews the corrected handoff and actual evidence; all architecture, design and release gates remain in force.

Skipped: visual generation, screenshot/runtime checks, agent dispatch and source edits. Remaining risk: a compelling specification still needs real interaction testing to establish that the experience works.
