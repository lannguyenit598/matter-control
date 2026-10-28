# MatterControl R5 — design delta

Task: **MC-P0-DESIGN-R5** · Priority: **P0** · Author: **Antigravity Design Assistant / Local Codex** · Status: **AUTHOR_COMPLETE_PENDING_REVIEW**.
Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.
Export Revision: **MC-P0-DESIGN-R5-local-20261027-01**.

---

## 1. Lineage Across Design Iterations (R1 → R2 → R3 → R4 → R5)

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

*Status: MC-P0-DESIGN-R5 design delta complete.*
