# MatterControl P0 design — source/specification intake

Task: **MC-P0-DESIGN-UIUX-REVIEW-20261027**. Owner: actual Codex / Local Codex, PM/BA/design intake. Priority: P0 delivery prerequisite. Date: 2026-10-27, Asia/Ho_Chi_Minh. Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.

**Disposition: CHANGES_REQUIRED for `docs/design/p0-handoff-r1/`.** The seven-file return is present and its six declared output hashes match. The parent manifest matches 26/26 files. Those integrity results do not establish semantic correctness. Do not use R1 as the final implementation contract for ZCode.

This is a Codex source/specification intake, not independent design acceptance or a visual audit. R1 describes its author ambiguously; no nonauthor declaration is inferred. Preserve the roadmap, D-UX01..04, historical findings and all existing gates. No product source, frozen design, pending external review packet or project status was edited.

## Scope and method

Inputs: R1's seven deliverables; approved SRS, rules, permission/state semantics, acceptance criteria, Golden Workflows and canonical Atlas; selected local-r3 design/tokens/interactions; P0 roadmap/coverage; frontend architecture instructions. Exact input hashes and browser failure are in [inputs.json](../testing/p0-design-uiux-review-20261027/inputs.json). Recomputed facts and closing checks are in [checks.json](../testing/p0-design-uiux-review-20261027/checks.json).

Applied skills:

- `product-design:audit`: require actual flow capture before a visual audit. The in-app browser returned **`Local browser use is disabled in Work settings`**. The skill states: “If none of those can capture valid screenshots or control the flow, stop and report the blocker.” Visual work stopped; no alternate browser/server/OS capture was used.
- `accessibility`: use keyboard, focus, labels, error recovery, text status and reflow guidance to identify specification gaps. No accessibility conformance verdict is awarded from this review.
- `design-taste-frontend`, especially its app-screen guidance: preserve the selected enterprise application system, dense operational tables, real domain data and useful empty/error states. No marketing redesign or new style vote.

Read-only project metadata/artifact retrieval found the existing Atlas concept entry. Its current HTML is **315,229 bytes / `6000190940fe42128009ce06b220a1d858228f346c1022a190c8de4eafa4cd4a`**; the approved-source local-r3 export is **349,284 bytes / `b6ce56b77670c22dded5ef4e03bdb060932c79ffcc60a33c42cf7a7a668aa12e`**. They differ. Metadata design-system ID `apple` does not itself prove a token defect. No current-preview-to-R1/r3 revision binding was supplied, and no new rendered artifact exists in R1. Do not inspect an arbitrary preview later and assume it represents this handoff.

## Findings and minimum corrections

### UIUX-01 · P1 — six approved FR identities and Golden Workflow coverage changed

R1 `screen-state-matrix.json:306–457` assigns FR-009 to document versions, FR-010 to signatures, FR-012 to dense grid, FR-013 to bulk, FR-014 to import and FR-015 to export. Approved identities are **FR-009 Control Room, FR-010 My Actions, FR-012 Bulk, FR-013 Import, FR-014 Export, FR-015 Document Versions**. Existing AC IDs remain attached to the wrong capability. Listing 20 IDs is not coverage of all 20 contracts; My Actions is reduced to a filter mention without its own complete flow.

R1 `current-ux-spec.md:366–379`, `zcode-handoff.md:170–173` and the matrix's `golden_workflows` replace GW-01's transaction-to-post-closing journey with a dashboard review and **GW-02 Due Diligence with signature reconciliation**. GW-03 covers only receipt/approval distinction. Approved [Golden Workflows](../requirements/golden-workflow-acceptance.md) require the complete original sequences, two supplement-response cycles for AC-163 and stated alternatives/negative paths. Keep the new short journeys only as labelled subscenarios, without reusing GW/AC identities. Rebuild traceability from SRS and the existing roadmap coverage; retain signature observation within the appropriate approved capability.

### UIUX-02 · P1 — bulk metadata contract regressed

R1 `current-ux-spec.md:336–344`, `zcode-handoff.md:156`, matrix FR-013 and disposition UX-R01 omit **title**; the handoff also substitutes `operational_note` for description. RULE-013 and local-r3 `interaction-guidance.md:43` already permit **title, description, assigned internal owner and due date**. AC-112 is bulk preview; AC-113 is import. Restore the approved allowlist and references consistently, exact selected IDs/changes, unchanged-versus-clear behavior, per-record permission/revision checks and persistent partial results. Do not invent an additional note field or erase failed-row drafts.

### UIUX-03 · P1 — conflict recovery permits lost updates; uncertain writes lack reconciliation

R1 `current-ux-spec.md:177` offers **“Overwrite”** after a conflict. RULE-018 explicitly requires conflict **without overwrite**. The package also does not specify an outcome-unknown mutation state before the bulk retry at lines 343–344. A missing response must not mean failure followed by an unguarded retry.

Preserve the draft, show only authorized current values, reload/rebase and require a new command against the accepted current revision. State the receipt/reconciliation dependency for ambiguous writes; do not resend until the adopted contract establishes the outcome or a safe retry. Include permission revocation, unavailable reconciliation and field-level validation recovery. This corrects UX behavior without selecting a new wire protocol.

### UIUX-04 · P1 — filing journey loses essential stages and auto-advances on upload

R1 `current-ux-spec.md:292–299`, matrix FR-016 and `zcode-handoff.md:120–121` substitute a strict `DRAFT → PREPARED → SUBMITTED → RECEIVED → APPROVED` ladder. The handoff says uploading a receipt transitions the stage. Approved `state-semantics.md:61–77` includes preparation/signature, Authority Review, repeated Supplement/Response cycles, separate observation/proof review and OWNER rejection/withdrawal/reopen controls. Upload success does not record the whole authoritative observation. Restore that journey and exact-version/cycle history; keep unknown technical enum names as architecture dependencies. Preserve ARCH-Q5's approved reopen interpretation; do not newly require an authority to issue another decision.

### UIUX-05 · P1 — state applicability and readiness predicates conflict inside R1

`current-ux-spec.md:86–92` applies every axis independently to Filing and requires proof verification for every upstream edge, contradicting its own execution-only edge at line 258. Approved state applicability gates Filing through linked Requirements/Actions; Action/Filing verification depends on explicit proof applicability. RULE-003 distinguishes completion edges from proof edges.

`design-delta.md:67` and `findings-disposition.json:42` omit **dependency READY** from the milestone predicate. RULE-008/local-r3 require every explicitly required Requirement **READY + COMPLETED + valid VERIFIED or explicitly valid NOT_REQUIRED**; no declared set means UNASSESSED with unavailable counts. Restore those exact distinctions, unavailable/stale evaluation and propagation after reversal. Specify WAITING party/condition from the approved business contract without declaring both new wire fields universally mandatory (`current-ux-spec.md:245`). Preserve allowed NOT_STARTED→WAITING/COMPLETED and guarded WAITING exits; do not treat the shortened R1 list as the full transition policy.

### UIUX-06 · P1 — canonical Atlas explanation is false

`design-delta.md:64`, `current-ux-spec.md:314`, `zcode-handoff.md:138` and `validation-plan.md:21` claim two IN_PROGRESS Actions and the rest blocked. The actual 12 Actions are **4 COMPLETED, 3 WAITING, 5 NOT_STARTED, 0 IN_PROGRESS**. AC-04/05/10 remain Waiting On with owners U-01/U-01/U-03; the five NOT_STARTED Actions AC-07/08/09/11/12 are BLOCKED. Zero eligible Next Actions is correct; its explanation is not.

Canonical MS-01/02/03 do not provide declared required-Requirement sets. R1 `current-ux-spec.md:324` and validation line 22 cannot show measured satisfied/total or unsatisfied-prerequisite counts for that fixture. Display UNASSESSED and “required set not defined”; use separately labelled synthetic fixtures for known counts. Preserve the historical Atlas self-review caveat rather than silently making its old data policy-conformant.

### UIUX-07 · P1 — proposed APIs and storage choices presented as authoritative

`current-ux-spec.md:105–107,141–147,173,186–188,239–241,260` settles route/DTO/validator/error details, including a governance commit fragment as a resource ETag example. The assignment explicitly requires unknown API/schema details to remain architecture dependencies. The P0 plan still requires adoption of the auth/wire contract; design cannot select it. Replace these with named semantic data/command needs and the exact adopted reference when available. Keep examples explicitly illustrative, not a source of production contracts, error status selection, tables, fields or API naming. Do not adopt new SSE/storage/export dependencies from handoff questions.

### UIUX-08 · P2 — interaction and accessibility contract is incomplete

R1 specifies a blocker reason only on hover (`current-ux-spec.md:216`), disabled-control tooltip guidance (`zcode-handoff.md:101`) and row navigation, but not a complete keyboard/touch path to reasons, error association/announcement, cell/editor ownership, modal focus entry/trap/return, unsaved navigation or stale/revoked session handling. Its matrix lists axes and roles but **has no per-screen loading/empty/unavailable/forbidden/stale/conflict/partial/recovery definitions**. Claimed uniform coverage exceeds the actual specification.

Carry forward working local-r3 guidance, then give each screen concrete interaction/state coverage or an explicit dependency. Keep a persistent, keyboard/touch-accessible reason, named controls and errors linked to their fields; nested editors retain their keys. Define exact selection behavior after filter/sort/pagination, draft recovery and explicit mobile alternatives for complex workflows. Distinguish zero records, zero filtered matches, no eligible action, undefined milestone and unavailable evaluator. Do not drop P0 actions on mobile. These are specification corrections; actual focus, screen-reader behavior, touch geometry and clipping remain NOT_RUN.

### UIUX-09 · P2 — validation oracles cannot establish the approved acceptance

`validation-plan.md:42` uses Atlas and an unspecified participant instead of AC-137's **5 representative managers, unseen 50-row matter, two counterbalanced scenarios, no hints, answer key, ≥4/5 correct within 10 seconds** (already PO approved). Line 46 identifies a nonexistent canonical **EV-04**; ER-04 has missing proof. Line 47 tests the wrong bulk allowlist. The 12 planned scenarios omit complete GW-01..03, several negative roles/revocation, unknown-write reconciliation, repeated filing cycles and full cell/error flows. No required rendered or runtime test has run.

Restore the approved protocol and create labelled synthetic evidence for new negative tests rather than falsifying Atlas. Cross-reference the full acceptance matrix, name missing scenarios NOT_RUN, and require actual backend guards/readback for business acceptance. New runners, browser engines, pixel tolerances or libraries are proposals until accepted; use the existing stack. Include 50/100/200 rows, long Vietnamese/English labels, both densities, last-row access, agreed viewports/200% zoom, filter/sort/editor/focus context and mobile task completion. Retain the distinction between a test plan, a mock result and a persisted end-to-end result.

### UIUX-10 · P2 — provenance and “source corrected” claims need narrowing

R1 `return.md:8–16` says PREPARED_NOT_DISPATCHED while claiming an actual executor under “Local Codex / OpenDesign Cloud”, without one verifiable execution identity/revision. Its disposition says no blocking business contradiction and claims UX-R01/R04 source corrected despite findings above. `design-delta.md:64–68` describes earlier bulk/brief/self-review defects already corrected or constrained in local-r3 (`interaction-guidance.md:26,43–44,52`; HTML lines 1646–1647,2772,4037). No evidence establishes those regressions against the pinned local-r3 source.

Return the actual tool/mode/session and source/export revision or explicitly mark identity not established. Bind the future captured page to that revision. Cite exact old lines for any delta; distinguish inherited correction, proposed specification and validation not executed. Retain historical finding IDs/classifications without falsely closing or manufacturing them. No fresh PO visual-direction vote or transfer of independent-review authority is needed.

### UIUX-11 · P2 — shared component placement violates the existing frontend boundary

`zcode-handoff.md:23,25,49–51` puts five-axis domain `StateBadge` and `WorkspaceMatterSwitcher` in `components/molecules/…`, and omits the actual `src/` root. `apps/frontend/AGENTS.md:17–30` keeps shared components domain-free and business behavior under `src/features/`. Reuse an existing generic badge/selector/dialog where suitable; put the Matter/domain compositions in features and bind tokens there. Generic app-shell/drawer primitives may remain shared when domain-free. This is a handoff-path correction, not an architecture or dependency redesign.

## Design direction retained

Keep Enterprise Precision A with selective causal rail/compact behavior; Comfortable default; readable multiline text; text-labelled separate states; blocker→Next Actions→Waiting On→Milestones→Evidence Gaps→Changes with Important Decisions adjacent; mobile triage/details/evidence plus permitted simple updates. R1 repeats the selected 17 color values correctly. Static contrast calculations for selected text pairs are recorded in checks.json, not rendered or accessibility acceptance. Do not alter tokens to compensate for unobserved layout issues.

## Next action and acceptance

Use [MC-P0-DESIGN-R2-CORRECTION-PROMPT.md](../implementation/handoffs/MC-P0-DESIGN-R2-CORRECTION-PROMPT.md) for the design owner. It is **READY_NOT_DISPATCHED**, source/spec correction only. Preserve R1 and all pinned inputs. Return a new R2 package with an explicit disposition of UIUX-01..11, exact original finding IDs and a corrected W1/W2 implementation handoff. ZCode can continue independent W0 planning; do not consume contradicted R1 behavior as adopted implementation policy.

Then obtain an actual nonauthor semantic/testability review of the corrected revision. When browser use is permitted, capture and inspect that exact revision's real flows, followed by keyboard/screen-reader/mobile/user-task checks. Design approval is scoped to actual evidence; no independent approval, STEP03A_APPROVED, STEP03B, runtime acceptance, INT-A PASS or release is awarded here.

Acceptance for this intake: input/output pins checked; every finding has current source, approved authority, impact and minimum fix; browser blocker retained; original materials and source unchanged; concrete correction handoff prepared. Proposed intake status: **IN_REVIEW / R1 REWORK_REQUIRED**. Reviewer: assigned nonauthor after R2 correction, with PO retaining material policy/release decisions.

Skipped: screenshots, rendered layout/contrast, real focus/keyboard/screen-reader/mobile/usability execution, builds/runtime, provider generation/reviewer dispatch and Git mutation. Remaining risk: implementing R1 verbatim would encode incorrect domain behavior; correcting the documents alone will not establish runtime or visual quality.
