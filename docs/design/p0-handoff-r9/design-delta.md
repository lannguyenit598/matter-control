# MatterControl R9 — design delta

Task: **MC-P0-DESIGN-R9-TARGETED-CORRECTION** · Priority: **P0** · Actual author: **Claude (Anthropic), this session** · Status: **AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS**.
Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.
Export Revision: **MC-P0-DESIGN-R9-local-20261027-01**. Supersedes **MC-P0-DESIGN-R8-local-20261027-01**.

Sections 1 through 9 below are the R1→R7 lineage as R7 recorded it, retained verbatim as history. Section 10 is the R8 delta, also retained verbatim as history. The R9 delta — a targeted correction of R8-N01..04, not a re-finalization — is section 11 at the end of this document. Historical packages R1–R8 are untouched on disk.

---

## 1. Lineage Across Design Iterations (R1 → R2 → R3 → R4 → R5 → R6 → R7)

The table below summarizes the comprehensive evolution of design findings from initial baseline through R5 finalization.

| Finding | Severity | R1 Baseline Defect | R2 Initial Correction | R3 Diagnostic Refinement | R4 Enhancement | R5 Finalization & Calibration |
|---|---|---|---|---|---|---|
| **UIUX-01** | P1 | Reassigned FR identities / substituted dashboard and signature workflows | Restored 20 FR identities and SRS ACs/rules; 13 SCR identities; 3 complete GWs | Preserved in matrix and spec; validated in pure helper tests | Full 20 FRs and 13 SCRs linked; GW-01..03 journeys intact in spec and matrix | **CALIBRATED IN R5 (R4-I01)**: Restored canonical FR identities in validation prose (VAL-FR-001..020); calibrated distinct milestone predicate `READY + COMPLETED + (valid VERIFIED or explicit valid NOT_REQUIRED)`. |
| **UIUX-02** | P1 | Title omitted / description replaced by operational_note / wrong AC | Restored 4 metadata fields (title, description, owner, due); atomic per-row audit | Preserved in spec W6 and prototype Data operations | Explicit 4-field allowlist enforced in bulk preview; partial results table specified | **PRESERVED IN R5**: Bulk metadata strictly restricted to 4 fields; atomic per-row audit and OUTCOME_UNKNOWN reconciliation. |
| **UIUX-03** | P1 | Overwrite on conflict; unsafe retry on missing response | Prohibited overwrite; rebase against accepted revision; OUTCOME_UNKNOWN reconciliation | Preserved in spec and prototype draft editor details | Comprehensive conflict/recovery state specimen and draft preservation per record | **CALIBRATED IN R5**: Side-by-side conflict diff in prototype; draft retention strictly obeys adopted session/privacy contract. |
| **UIUX-04** | P1 | Short stage ladder / receipt upload auto-advances stage | Restored 9 filing stages, exact versions, package/signature guards, 2 supplement cycles | Preserved in spec W4 and prototype Filing context | 9-stage lifecycle stepper, 2-cycle supplement-response tracker, ARCH-Q5 reopen | **CALIBRATED IN R5 (R4-I03)**: Uploading receipt supplies document only; stage advance requires authorized observation/command (RULE-012; Receipt ≠ Approval). |
| **UIUX-05** | P1 | Axes on wrong subject / proof on all edges / milestone missing READY | Distinct completion vs proof vs milestone predicates; unavailable never READY | Preserved in spec and helper tests | 5 independent axes strictly uncollapsed; milestone UNASSESSED when set undefined | **CALIBRATED IN R5 (R4-I01)**: Milestone predicate calibrated; proof edge strictly requires valid VERIFIED. |
| **UIUX-06** | P1 | Two IN_PROGRESS Actions / invented milestone counts | Correct census 4/3/5/0, zero eligible Next Actions; undefined milestones UNASSESSED | Preserved in spec W5 and prototype Control Room | Truthful 0 eligible actions with full causal explanation; self-review caveats | **PRESERVED IN R5**: Truthful 0 eligible actions at T0; census 4/3/5/0 intact; self-review strictly prohibited (RULE-007). |
| **UIUX-07** | P1 | Invented routes/DTOs/ETags/storage/error authority | Semantic data/command needs only; no Git SHA as ETag; dependencies pending | Preserved in zcode-handoff.md | Concrete ZCode integration contract aligned with ongoing W1–W7 execution plan | **CALIBRATED IN R5 (R4-I02, R4-I07)**: OAuth tokens in server-side BFF store; opaque cookie handle; CSV/XLSX import and scoped XLSX export; no invented wire enums. |
| **UIUX-08** | P2 | Hover-only reasons / no concrete screen state contract | Per-screen 9 states, roles, accessible persistent reasons, draft/focus rules | Preserved in screen-state-matrix.json and spec | Interactive Screen States Specimen viewer implemented; full 9 states per screen | **CALIBRATED IN R5 (R4-I08)**: Screen-specific state specimens for all 13 screens with real skeleton loaders, reconciled counts, and honest SPECIFIED_ONLY tags. |
| **UIUX-09** | P2 | Wrong comprehension study / nonexistent proof / incomplete tests | Exact AC-137 protocol (5 managers, unseen 50-row, 10s cutoff); NOT_RUN status | Preserved in validation-plan.md | Validation plan updated with exact oracles; visual NOT_RUN boundaries calibrated | **CALIBRATED IN R5**: All 20 FR oracles calibrated; AC-137 protocol strictly preserved as `NOT_RUN / AWAITING_HUMAN_TRIAL`. |
| **UIUX-10** | P2 | Ambiguous executor / inherited corrections misattributed | Actual executor identity and export hashes; corrections proposed pending review | Preserved in return.md and delta | Calibrated evidence: static reasoning distinguished from rendered observation | **PRESERVED IN R5**: Clear executor attribution; static reasoning vs rendered observation strictly delineated. |
| **UIUX-11** | P2 | Business compositions in domain-free components / missing src root | Primitives in components/; domain composites under apps/frontend/src/features/ | Preserved in zcode-handoff.md | Strict frontend boundary preserved: generic atoms/molecules vs domain features | **PRESERVED IN R5**: Architectural separation between UI primitives and domain features preserved across all waves. |
| **R2-S01** | P3 | Causal drill-down has no context-aware Back action in prototype | Navigation replaced currentRecord; no Back action to return to parent | Maintained openRecord single record state | Full `navStack` history, breadcrumbs, Back-to-previous, Return-to-record, Close-to-origin with focus restoration | **CALIBRATED IN R5 (R4-I05)**: Centralized session cleanup on Close and Escape; real origin preserved (Grid, My Actions, Waiting On, Filing, Control Room). |
| **R2-S02** | P3 | My Actions is a flat assignment table without operational groups | Filtered flat list of U-01 actions; no eligible/waiting/blocked separation | Maintained flat table view | 4-tier operational queue (Eligible 0, Waiting On, Blocked, Completed), dual status AC-05 explained, U-01 marked alias | **PRESERVED IN R5**: 4-tier operational queue intact; AC-05 appears in Waiting and Blocked without double counting. |

---

## 2. Eight Mandatory R5 Corrections (Addressing R4-I01 .. R4-I08)

### 2.1 Canonical FR Mappings and Distinct Milestone Predicates (R4-I01)
- **Problem**: `validation-plan.md:52–71` in R4 had mislabeled VAL-FR-001..020 identities (e.g. VAL-FR-001 as Workspace boundary instead of Requirement vs Action, VAL-FR-002 as auth instead of Milestones). The milestone oracle required VERIFIED for all items, omitting explicitly valid NOT_REQUIRED permitted by RULE-008.
- **R5 Correction**:
  - Restored canonical 1:1 mapping for all 20 FRs in `validation-plan.md` Table 3.1: VAL-FR-001 (Requirement vs Action), VAL-FR-002 (Milestones), VAL-FR-003 (Next Action), ..., VAL-FR-020 (Five Axes State Model).
  - Created separate cross-cutting test suite in Section 3.2 for `VAL-CROSS-AUTH`, `VAL-CROSS-CONCURRENCY`, `VAL-CROSS-BOUNDARY`, and `VAL-CROSS-RESPONSIVE-A11Y`.
  - Calibrated the milestone predicate: Every declared required Requirement evaluates `READY + COMPLETED + (valid VERIFIED or explicit valid NOT_REQUIRED)`. Proof edge requires valid `VERIFIED` (`NOT_REQUIRED` does not satisfy a proof edge). Undefined sets evaluate strictly as `UNASSESSED`.

### 2.2 OAuth Token Storage & Session Architecture (R4-I02)
- **Problem**: `zcode-handoff.md:152` stated "tokens stored in session cookie", contradicting line 56 and local contract architecture.
- **R5 Correction**:
  - Corrected all checklist items and specifications across `zcode-handoff.md`, `current-ux-spec.md`, and `validation-plan.md`.
  - Stated explicitly: OAuth tokens are stored strictly in the **server-side BFF session store**. The browser cookie contains only an **opaque session handle**. Zero tokens in browser cookie, zero tokens in localStorage.

### 2.3 Regulatory Filing Receipt & Stage Transition Guard (R4-I03)
- **Problem**: R4 specifications described receipt upload as advancing the filing stage to Authority Review, and cited RULE-016 (Status Brief rule) instead of RULE-012 (Filing rule).
- **R5 Correction**:
  - Corrected rule citation to **RULE-012**.
  - Clarified lifecycle semantics: Uploading a filing receipt supplies an artifact only. Transition to Authority Review requires an authorized, validated observation/command acknowledged by the backend with exact scope, version, reference, and current guards. Outcome is `WAITING`, never `APPROVED` (Receipt ≠ Approval).

### 2.4 Explicit Typed Relations for Evidence Proof Lookup (R4-I04)
- **Problem**: `prototype.html:300–312` used `id.slice(-2)` to look up proof records for both Requirements and Actions. Opening `AC-05` borrowed `RQ-05`'s `EV-05 / DOC-03` proof and displayed a false blocked state.
- **R5 Correction**:
  - Replaced numeric suffix lookup with explicit typed relation maps: `reqProofData` and `actionProofData`.
  - Configured `AC-05` with explicit proof applicability `NOT_REQUIRED` in canonical Atlas, with clear note confirming it does not carry proof criteria or borrow `RQ-05` proof.
  - Verified distinct, typed proof contexts for `AC-01`, `AC-03`, `AC-04`, `AC-06`, `AC-10` and `RQ-01..RQ-10`.

### 2.5 Navigation Session History, Centralized Cleanup & True Origin (R4-I05)
- **Problem**: Fresh modal opens retained previous `currentRecord`; closing via Close button or Escape did not centrally reset session state; all non-CR/MyActions origins were labeled "Grid".
- **R5 Correction**:
  - Implemented `cleanupModalSession()` which centrally resets `navStack.length = 0`, `currentRecord = null`, and `detailMode = 'record'`.
  - Bound `cleanupModalSession()` to both `handleCloseDetail()` and dialog native `close` event listener (handling Escape key dismiss).
  - Implemented `originLabel(view)` which dynamically preserves the real origin view (`Control Room`, `Operational Grid`, `My Actions Queue`, `Waiting On`, `Filing context`).
  - Restored previous mode when navigating Back; isolated drafts in per-record `drafts` Map.

### 2.6 Consistent Role Permissions for Action Assignment (R4-I06)
- **Problem**: `current-ux-spec.md:176` stated that non-owners were forbidden from modifying action assignments, contradicting the approved permission matrix.
- **R5 Correction**:
  - Restored correct role permissions across spec, handoff, and prototype text: **Both Matter `EDITOR` and `OWNER` have authority to assign Actions within scope to active members**.
  - `VIEWER` role is read-only and restricted from assignment or editing. Submitter identity cannot self-review (RULE-007).

### 2.7 Import/Export Format Fidelity & Privacy Retention (R4-I07)
- **Problem**: `zcode-handoff.md:44` substituted CSV/JSON import and omitted scoped XLSX export; introduced invented wire enum `CLAIM_IMPORTED`; `validation-plan.md:53` included unsupported localStorage legal drafts.
- **R5 Correction**:
  - Preserved **CSV and XLSX structured import** and **meaningful scoped XLSX export** with formula injection escaping (`=`, `+`, `-`, `@`).
  - Removed invented wire enum `CLAIM_IMPORTED`; described imported verification as a claim to be evaluated by contract/evaluator.
  - Removed localStorage legal draft reference; draft retention and revocation strictly obey the adopted session/privacy contract.

### 2.8 Honest Screen States Specimen & Scannable Causal Pipeline (R4-I08)
- **Problem**: `renderStateSpecimen()` in prototype used a generic template for all screens, literal aria-busy text, mismatched counts (3 accepted with 2 IDs), and fake "Recovery Complete" buttons. Control Room causal chain repeated lengthy paragraphs across 5 cards.
- **R5 Correction**:
  - Implemented screen-specific state specimens for all 13 screens (`SCR-01` to `SCR-13`), including tailored empty guidance (`screenEmptyGuidance`) and role context (`screenRoleContext`).
  - Replaced literal text with real animated skeleton loaders (`.skeleton-box`) with `role="status"` and `aria-busy="true"`.
  - Reconciled partial results: 3 items updated matches 3 IDs listed (`AC-07`, `AC-08`, `AC-10`).
  - Labeled non-operational controls with `<span class="specimen-tag">SPECIFIED_ONLY · Non-operational specimen</span>`.
  - Streamlined Control Room causal chain into a scannable 5-step pipeline using differentiated styling (`.root-blocker`, `.direct-gate`, `.downstream`) and a single synthesis summary banner, eliminating repetitive paragraphs.

---

## 3. Preserved Baseline & Authority Gates

### 3.1 Preserved Decisions
- **Visual Foundation**: Enterprise Precision A foundation, selective causal impact rail B, Comfortable default (44px min-height) with Compact opt-in (36px min-height, 14px body font size preserved).
- **Domain Invariants**: Requirement ≠ Action, COMPLETED ≠ VERIFIED, WAITING ≠ BLOCKED (AC-05 dual status), Submitter cannot self-review, Receipt ≠ Approval (RULE-012), 5 orthogonal axes, all 20 FRs, 13 SCRs, 3 GWs, 24 Atlas canonical records.

### 3.2 Outstanding Authority Gates
- **`GATE-INDEPENDENT-QA`**: Mandatory semantic and domain independent review remains pending. Neither author (Antigravity/Codex) nor implementer (ZCode) may self-approve this design packet.
- **Verification Blockers**: Interactive browser automation, screen reader accessibility tree, and AC-137 manager comprehension trials remain `NOT_RUN / VERIFICATION_BLOCKERS` due to headless browser restrictions in Work settings.

*Status: MC-P0-DESIGN-R8 design delta complete.*


---

## 3. Five Mandatory R6 Corrections (Addressing R5-N01 .. R5-N05)

### 3.1 Restored DOM Lookup Helper `$` for Standalone Initialization (R5-N01)
- **Problem**: `prototype.html:657` and subsequent initialization lines called `$('detail').addEventListener(...)`, `$('chain')`, `$('next')`, etc. While R4 defined `const $ = id => document.getElementById(id);`, R5 inadvertently omitted the declaration while retaining callers. Consequently, the standalone page threw a runtime `ReferenceError: $ is not defined` prior to initial rendering.
- **R6 Correction**:
  - Restored `const $ = id => document.getElementById(id);` at the top of `<script id="concept-logic">` before all function declarations and event listeners.
  - Verified with AST analysis that all 35 `$()` calls resolve to valid, declared DOM IDs.
  - Executed mock DOM bootstrap under Node; verified exit code 0 without exceptions.

### 3.2 Calibrated Proof Applicability Model and Canonical Dataset Facts (R5-N02)
- **Problem**: R5's proof context asserted that proof criteria in MatterControl attach strictly to Requirements and defaulted all Actions to `NOT_REQUIRED`. Furthermore, R5 misattributed `AC-06` as blocked with submitter U-01 (contradicting canonical Atlas facts where AC-06 is COMPLETED/READY, owned by U-03, recording first signature receipt), and converted `RQ-05`'s historical baseline to UNVERIFIED and DEP-05 to blocked.
- **R6 Correction**:
  - Aligned proof applicability model strictly with approved `state-semantics.md` §10: Verification applies to Requirements, Evidence Requirements, supplied Evidence; and to Actions or Filings when proof is explicitly required (initial state `UNVERIFIED`). `NOT_REQUIRED` applies only via an explicit applicability decision.
  - In canonical Atlas, all 12 operational actions (`AC-01..AC-12`) have an explicit `NOT_REQUIRED` applicability decision (`explicitNotRequired: true`).
  - Added labelled fixture `AC-DEMO-PROOF` to demonstrate an operational Action requiring explicit proof under `state-semantics.md` §10.
  - Corrected `AC-06` to canonical facts: execution `COMPLETED`, dependency `READY`, owner `U-03`, recording receipt of first signature for `RQ-06`.
  - Preserved `RQ-05`'s historical baseline `VERIFIED` and `DEP-05` satisfied status at baseline T0; documented U-02 self-review as an audit caveat under RULE-007 rather than retroactively mutating the verified T0 baseline.
  - Preserved `AC-05` as explicit `NOT_REQUIRED` without borrowing `RQ-05` proof.

### 3.3 Preserved Mode on Back Navigation & Trail Truncation on Breadcrumbs (R5-N03)
- **Problem**: In R5, `handleBackPrev()` set `detailMode = prev.mode`, called `openRecord(prev.id, null, false)` (which overwrote `detailMode = 'record'`), and then checked `if (detailMode === 'proof')`. This check always failed, losing the saved proof view mode when navigating Back. Furthermore, breadcrumb clicks appended ancestors to `navStack` instead of truncating the trail.
- **R6 Correction**:
  - In `handleBackPrev()`, stored popped mode in a local variable `const savedMode = prev.mode || 'record';` across the `openRecord()` invocation. If `savedMode === 'proof'`, it invokes `showProof()`, accurately restoring the proof context view.
  - In `updateTrailUI()`, rendered breadcrumb ancestor nodes with `data-trail-idx="i"`. Clicking an ancestor truncates `navStack` via `navStack.splice(idx)` to return directly to that ancestor without creating cyclical loops.
  - Preserved centralized session cleanup (`cleanupModalSession()`) on fresh open, Close button, and Escape key dismiss.
  - Preserved isolated per-record drafts in `drafts` Map and focus restoration to opener with replacement fallback.

### 3.4 Calibrated Validation Plan Oracles & Evidence Classifications (R5-N04)
- **Problem**: R5's `validation-plan.md` marked unimplemented/unexecuted flows (Requirement creation, proof submission/verdict mutation, atomic bulk execution, version promotion, Filing lifecycle progression, XLSX file export) as `CONFIRMED_IN_PROTOTYPE`, and cited R4 static exports as proof of R5 rendering.
- **R6 Correction**:
  - Strictly separated execution classifications:
    - `SPECIFIED_ONLY / SOURCE_INSPECTED`: For data mutation flows specified in UX specs and screen specimens but not executed in the standalone prototype (FR-001, FR-006, FR-007, FR-008, FR-012, FR-014, FR-015, FR-016, FR-017, FR-018, VAL-CROSS-CONCURRENCY).
    - `CONFIRMED_IN_PROTOTYPE_EXPLORATORY`: For UI behaviors actually executed in the standalone prototype (FR-002, FR-003, FR-004, FR-005, FR-009, FR-010, FR-011, FR-019, FR-020, VAL-INIT-01, VAL-NAV-01, VAL-NAV-02, VAL-PROOF-01).
    - `NOT_RUN / VERIFICATION_BLOCKERS`: For interactive browser automation, touch latency measurement, live screen reader tree inspection, and AC-137 manager trial (due to headless browser execution being disabled in Work settings).
  - Provided actual source-check scripts, UTC timestamps, commands, exits, and reproducible check logs in Section 5 of the validation plan.

### 3.5 Real Codebase Component Inventory & Correct UX Consumer Authority (R5-N05)
- **Problem**: `zcode-handoff.md:16` directed implementation to non-existent directory `apps/frontend/src/components/ui/` and described the handoff as a binding implementation contract rather than a UX consumer specification.
- **R6 Correction**:
  - Aligned component inventory with actual codebase structure under `apps/frontend/src/components/{atoms,molecules,organisms}/` (Atoms: `badge`, `button`, `card`, `input`, `label`, `select`, `skeleton`, `spinner`, `textarea`; Molecules: `alert`, `confirmation-dialog`, `dialog`, `empty-state`, `form-field`, `nav-menu`, `page-header`, `pagination`, `search-input`, `stat-card`, `theme-toggle`; Organisms: `app-header`, `app-sidebar`, `data-table`, `mobile-nav`; Templates: `app-shell`).
  - Placed business feature compositions under `apps/frontend/src/features/*`.
  - Clarified that this package is the **UX consumer and handoff specification** providing interaction, visual, and state requirements. It does not unilaterally alter, overwrite, or supersede the backend API, database schema, or security contracts independently governed and versioned by ZCode in `docs/implementation/p0-zcode-execution/local-contract.md`.


---

## 10. R8 delta — the consolidated correction and finalization pass

R8 answers the consolidated R7 review (`docs/reviews/p0-design-r7-full-review-20261027.md`, SHA-256 `c271018278efa75a6dfd26655045d71b9b632e1dc4b5c69f1388e399f20e1d2f`, verdict CHANGES_REQUIRED) in a single pass. The selected visual direction is preserved exactly: Enterprise Precision A, selective causal hierarchy B, Comfortable default with Compact opt-in, 14px body text, multiline legal content, the selected semantic tokens and the existing icon direction. No palette, theme or direction was re-opened, and no direction vote was re-run.

### 10.1 Findings

| Finding | Severity | What R7 shipped | What R8 ships | Where to look |
|---|---|---|---|---|
| **DR7-01** | P1 | `EXPIRED` listed as a verification member and `CIRCULAR_CONFLICT` as a dependency member | Neither is a member anywhere. Proof expiry is presented as an input that makes the evaluator recompute the aggregate, carried as a recorded reason; a graph cycle is presented as a rejection of the proposed edge, with the offending edges named and the graph unchanged | `current-ux-spec.md` §2.1, `screen-state-matrix.json` `state_axes`, `checks/check_vocabulary.py` |
| **DR7-02** | P2 | A generic fallback asserted "No downstream proof gates declared" for RQ-11, which gates AC-12 through DEP-07; RQ-07's panel borrowed AC-07's BLOCKED dependency | The presentation layer no longer holds causal prose. One `derive` layer computes gate satisfaction, dependency, root causes, downstream reach and the consequence sentence from the typed edges, and every panel, queue and chain reads it. Where the fixture supplies nothing, the panel reports absence rather than asserting a negative fact | `prototype.html` derive layer; `checks/check_mock_dom_bootstrap.js` checks 6–9 and 23 |
| **DR7-03** | P2 | Concurrent revision errors described with a single status the current contract does not define | An eleven-row consumer mapping bound to contract revision 4: 428 absent precondition, 412 stale precondition, 422 key reuse, 400 precondition-not-applicable, receipted and non-receipted unknown outcomes as separate rows, lost readback, denied read, denied mutation, unavailable evaluator, and `DEPENDENCY_PENDING` for operations the contract has not yet defined | `current-ux-spec.md` §6, the prototype's error surface, `zcode-handoff.md` §4 |
| **DR7-04** | P2 | Screens described with mixtures such as OWNER / Lead Operator and OWNER / Compliance Auditor | Three separate rows on every screen: personas, scoped read roles, operation authority. Workspace-scoped operations routed through a workspace role rather than a Matter-role column. Denied read and denied mutation are different screens with different content | `current-ux-spec.md` §3, `screen-state-matrix.json` `authority_model`, `checks/check_mock_dom_bootstrap.js` checks 17, 25, 26 |
| **DR7-05** | P2 | SCR-01, SCR-08, SCR-09, SCR-10, SCR-11 and SCR-13 were prose with a generic state card | Six working surfaces with their own layout, field hierarchy, action placement, navigation and high-risk states. Every filter resets its own screen. The drawer navigation bar is sticky | `prototype.html`; `current-ux-spec.md` §4 |
| **DR7-06** | P2 | The AC-137 protocol was restored in prose with no runnable assets | Two 50-row datasets with full causal graphs, declared milestone prerequisite sets and scoped owners; a three-file participant bundle; a facilitator-only key outside it whose expected answers are derived from the data by a checked-in script and re-derived by a separate check | `study/`, `study-facilitator/`, `checks/build_study_datasets.py`, `checks/check_study_assets.py` |
| **DR7-07** | P2 | The mock created an element for any requested id, so a renamed id still passed | A strict mock that refuses to invent an element, keeps markup nesting, retains event listeners and is driven by real dispatch. Two negative mutation tests prove it can fail. `renderAll` no longer swallows render errors. Evidence tiers are separated and no row claims geometry from a mock | `checks/strict_dom.js`, `checks/check_mock_dom_bootstrap.js`, `validation-plan.md` §1 and §3.1 |
| **DR7-08** | P3 | Files labelled R5 and R6 inside the R7 package; a static export called CONFIRMED without binding it to R4; GW-02 shortened to a gap example | Every file labelled R8 with the supersession recorded. The R4 image is cited only as historical R4 evidence of a different candidate. All three Golden Workflow sequences render stage by stage, with Atlas excerpts marked as examples | every file in this package; `checks/check_vocabulary.py` revision sweep; `checks/check_mock_dom_bootstrap.js` check 21 |

### 10.2 Corrections carried forward from R7, kept and re-asserted

The R7 fixes for R6-E01..E03 are preserved, and R8 adds the assertions that pin them:

- **RQ-03** keeps its recorded historical `VERIFIED` aggregate with the self-review caveat stated. Nothing flips to UNVERIFIED without a recorded re-assessment event.
- **RQ-05 and DEP-05** keep the separation R7 introduced, and R8 makes it structural: the gate panel prints the status Atlas reported at T0 (`Satisfied`) beside the current-policy evaluation (`unsatisfied`, self-review), and states that the two differ and that both are kept.
- **AC-06** remains COMPLETED and READY, owned by U-03, with explicit NOT_REQUIRED applicability.
- **AC-DEMO-PROOF** remains a labelled fixture outside the canonical 24, reachable from My Actions, entering no Atlas total, and now carrying an explicit evidence requirement of its own.

### 10.3 Things R8 deliberately did not do

- No approved requirement, rule, state semantic, permission row, acceptance criterion or Golden Workflow sequence was changed to make a design or a test agree with it.
- No canonical Atlas fact was altered. Where a check and the fixture disagreed, the fixture was corrected, never the expectation.
- No historical package was edited: R1 through R7 and the review and evidence under `docs/testing/` are unchanged.
- No product code, ZCode contract, workboard, formal ledger, AGENTS file or security state was touched, and no git operation of any kind was performed.
- No browser bypass was attempted. See `validation-plan.md` §2.

### 10.4 New structural decisions in R8

| Decision | Rationale |
|---|---|
| A single `derive` layer owns every causal statement | DR7-02 was a class of bug, not three instances. Removing the ability to write causal prose per record removes the class |
| Dependency is recomputed from the edges and compared with the stored value | A stored state that disagrees with the graph is now a check failure rather than a rendering |
| Historical and current evaluations are two columns, never merged | The DEP-05 case has now cost two review rounds. It is structural in R8, not phrasing |
| Workspace scope is a separate role | The approved matrix writes the condition in words ("Workspace OWNER") next to a Matter-role column. Reading the column alone is exactly the slip DR7-04 names |
| Values the approved sources do not state are marked design-supplied where shown | A fixture that looks transcribed but is invented is the same defect as a false causal fact, one level down |
| The prototype is built from `src/` by a checked-in script | The artefact stays self-contained and reproducible, and a reviewer can diff the source rather than a 200 KB single file |

---

## 11. R9 delta — targeted correction of R8-N01..04

A reviewer re-checked R8, reran the real checks plus 29 mock assertions, and reproduced three concept/UX regressions and one handoff/evidence gap. R9 fixes exactly those four, at the root, in `src/logic.js` and the supporting package; it does not reopen the R8 direction, add a feature, or restart finalization.

| Finding | Root cause in R8 | Root-cause fix in R9 |
|---|---|---|
| R8-N01 | The denied-access panel's "purged" claim was prose only; the shared `drafts` Map and other in-memory state were never cleared | `purgeProtectedState()` clears drafts/selection/bulk-result/drawer-trail on the real access-loss transition (hasMatterAccess true → false), not on a downgrade that keeps scoped read; Sign-out reuses the same function |
| R8-N02 | `new-matter-title` and `promote-reason` had no backing state at all, unlike record-title drafts | `formDrafts` Map, reusing the existing `drafts` pattern, keyed per document for the promotion form |
| R8-N03 | `promote-expected` was overloaded as both the concurrency guard and the implied target | A separate `promote-target` control; impact text recomputes from the actual target; missing/invalid/same-as-current target and a stale guard each produce a validation message, never a fabricated success |
| R8-N04 | `run_all_checks.sh` / `check_manifest_pins.py` / `check_screen_state_matrix.py` were referenced but two never existed and one was missing; `evidence/` was empty; the ledger stopped at R7 | Dangling references removed (smaller fix than building a runner framework); `check_screen_state_matrix.py` added since the matrix JSON already carries the structure to check; `evidence/run-20261027T081038Z/` populated with real per-check receipts; `findings-disposition.json` gets current R8-N01..04 and carried-forward DR7-01..08 dispositions, 48 historical records untouched |

An R9 recheck additionally found the first version of R9's own regression suite failing on promotion-reason persistence after navigation. Root cause was in the **test adapter** (`checks/strict_dom.js` did not hydrate a `<textarea>`'s `.value` from its own child text, did not fall an `<option>`'s value back to its own text, and did not expose `input.type`), not in the corrected concept source — the generated markup already carried the user's typed text. The adapter was fixed minimally (three DOM-semantics gaps, no new parser or dependency), proven by `checks/check_strict_dom_adapter.js`, and then the full regression suite plus a read-only-R8-baseline-vs-R9-candidate red→green run (`checks/check_r8_baseline_redgreen.js`) confirmed the underlying R8-N01/N02 defects are real and are fixed in R9, not an artefact of the earlier broken adapter.

No canonical Atlas fact, approved axis vocabulary, permission matrix row, CAS status mapping, screen layout or Golden Workflow was altered. No new dependency, persistence mechanism (localStorage/cookie) or framework was introduced.
