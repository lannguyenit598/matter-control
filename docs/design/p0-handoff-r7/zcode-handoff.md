# MatterControl R7 — phased ZCode implementation handoff

Task: **MC-P0-DESIGN-R7-UI-FINALIZATION** · Priority: **P0** · Author: **Antigravity Design Assistant / Local Codex** · Status: **AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS**.
Target Implementer: **ZCode (Go Backend + Next.js Product Frontend)**.
Integration Target: Ongoing full P0 assignment across waves W1–W7 (no W0 restart, no per-wave review gate).
Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.
Export Revision: **MC-P0-DESIGN-R7-local-20261027-01**.

---

## 1. Handoff Contract and Scope Boundaries

This document provides ZCode with the comprehensive UX consumer and handoff specification for all P0 capabilities across waves W1 through W7. It directly incorporates all corrective findings from coordinator intake (R4-I01..08, R5-N01..N05, and R6-E01..E03), maintaining strict alignment with approved SRS requirements, domain rules, and architecture contracts in `docs/implementation/p0-zcode-execution/local-contract.md`.

### 1.1 Implementation Architecture Separation
- **Generic Primitives** (`apps/frontend/src/components/{atoms,molecules,organisms}/`): Domain-free atomic controls. Primitives exist in the codebase:
  - Atoms (`apps/frontend/src/components/atoms/`): `badge`, `button`, `card`, `input`, `label`, `select`, `skeleton`, `spinner`, `textarea`.
  - Molecules (`apps/frontend/src/components/molecules/`): `alert`, `confirmation-dialog`, `dialog`, `empty-state`, `form-field`, `nav-menu`, `page-header`, `pagination`, `search-input`, `stat-card`, `theme-toggle`.
  - Organisms (`apps/frontend/src/components/organisms/`): `app-header`, `app-sidebar`, `data-table`, `mobile-nav`.
  - Templates (`apps/frontend/src/components/templates/`): `app-shell`.
  Zero MatterControl business logic or entity schemas in these components.
- **Domain Compositions** (`apps/frontend/src/features/*`): Entity-specific screens, forms, drawers, and state orchestration (e.g. `src/features/control-room/`, `src/features/grid/`, `src/features/requirements/`, `src/features/actions/`, `src/features/evidence/`, `src/features/filings/`, etc.). No intermediate generic UI layer is created.
- **Backend API & Data Authority** (`apps/backend/`): Go HTTP services implementing domain invariants, state machines, proof verification, and audit ledgers. This handoff document provides behavioral, interaction, and state expectations from the UX perspective; it does not unilaterally alter, overwrite, or supersede the backend API, database schema, or security contracts independently governed and versioned by ZCode in `docs/implementation/p0-zcode-execution/local-contract.md`.

---

## 2. Component and Feature Inventory

| Directory | Screen ID | Deliverable Scope & Behavioral Contract |
|---|---|---|
| `src/features/shell/` | `SCR-01` | Persistent top bar, workspace scope, matter switcher, session indicator, left navigation rail. |
| `src/features/control-room/` | `SCR-02` | 6-tier dashboard, 5-step scannable causal pipeline, next actions summary, decision links, milestone rollups. |
| `src/features/grid/` | `SCR-03` | Operational grid, filter toolbar, multiline cell wrapping, density toggle (Comfortable vs Compact), selection manager. |
| `src/features/requirements/` | `SCR-04` | Requirement lifecycle drawer, 5-axis state pills, incoming/outgoing gate list, title draft editor. |
| `src/features/actions/` | `SCR-05`, `SCR-10` | Action detail drawer, assignment controller (EDITOR and OWNER can assign), 4-tier My Actions queue, bulk editor. |
| `src/features/dependencies/` | `SCR-06` | Causal graph inspector, predecessor/successor gate lists, root-cause blocker diagnostic view. |
| `src/features/evidence/` | `SCR-07` | Proof verification drawer, criterion checker, submitter vs verifier anti-self-review validator, typed proof relations. |
| `src/features/documents/` | `SCR-08` | Document version lineage, signature execution tracker, version promotion modal with mandatory reason. |
| `src/features/filings/` | `SCR-09` | 9-stage filing lifecycle stepper, 2-cycle supplement-response tracker, receipt recorder, ARCH-Q5 reopen. |
| `src/features/bulk/` | `SCR-10` | Bulk metadata editor modal, 4-field allowlist validator, atomic execution progress, partial audit. |
| `src/features/import/` | `SCR-11` | 3-step CSV/XLSX import wizard, key/date mapping, deduplication engine, group rollback. |
| `src/features/brief/` | `SCR-12` | Delta status brief generator, `(t1, t2]` interval parser, formula-escaped scoped XLSX export builder. |
| `src/features/audit/` | `SCR-13` | Scoped append-only event ledger, diff visualizer, causal reference linker. |

---

## 3. Wave-by-Wave Implementation Contract (W1–W7)

### Wave 1: Authentication, Session & Requirement Foundation
- **UI Targets**: `SCR-01` (App Shell), `SCR-04` (Requirement Detail & Create), `SCR-13` (Audit History).
- **Identity & Session Security (R4-I02)**:
  - Integrate with local ZITADEL instance using OIDC Authorization Code + PKCE S256.
  - Store OAuth tokens strictly in **server-side BFF session store**. Forward access tokens to Go backend via authenticated introspection.
  - Browser cookie contains only an **opaque session handle**. Zero tokens in browser cookie, zero tokens in localStorage.
  - Map `(issuer, subject)` to internal user account (`U-xx`).
- **Requirement Lifecycle**:
  - Implement Requirement create with zero actions allowed at creation.
  - Render Requirement Detail with 5 independent state axes (never collapse to a single badge).
  - Record immutable audit event for creation and every update.

### Wave 2: Operational Grid, My Actions & Dependency Logic
- **UI Targets**: `SCR-03` (Operational Grid), `SCR-05` (Action Detail), `SCR-06` (Dependency Inspector).
- **Operational Grid**:
  - Implement Comfortable (44px min-height) and Compact (36px min-height) densities.
  - Compact mode strictly preserves 14px body font size (`Compact không giảm cỡ chữ`).
  - Table cells wrap naturally multiline: `td { overflow-wrap: break-word; white-space: normal; }`.
  - Selection counter accurately announces hidden filtered items.
- **My Actions 4-Tier Queue**:
  - Tier 1: Eligible Actions (truthful 0 at Atlas T0 with explanation).
  - Tier 2: Waiting On External Parties (`AC-04`, `AC-05`).
  - Tier 3: Blocked Actions (`AC-05`, `AC-12`).
  - Tier 4: Historical / Completed (`AC-01`, `AC-02`).
  - `AC-05` appears in both Waiting On and Blocked with shared identity and draft; zero duplicate task counting.
- **Causal Navigation Trail (R4-I05)**:
  - LIFO stack (`navStack`) tracking drill-down `AC-05 → RQ-04 → Proof Context → RQ-04 → AC-05 → Origin`.
  - Context-aware buttons: `← Back to Previous Record`, `← Return to Record`, and `Close to Origin` (restoring exact opener focus).
  - Centralized cleanup on Close button and Escape key resets modal session without retaining stale cross-session breadcrumbs.
  - Isolated per-record drafts preserved in memory.

### Wave 3: Evidence, Verification & Document Signatures
- **UI Targets**: `SCR-07` (Evidence Verification), `SCR-08` (Document Versions).
- **Explicit Typed Proof Relations & Applicability (R4-I04, R5-N02)**:
  - Proof lookup uses explicit typed relations by record kind (`Requirement` vs `Action`) and exact ID under state-semantics.md §10.
  - Verification applies to Requirements, Evidence Requirements, supplied Evidence, and to Actions or Filings when proof is explicitly required (initial state UNVERIFIED). NOT_REQUIRED applies only via explicit applicability decision (e.g. canonical Atlas operational actions AC-01..AC-12).
  - Canonical facts: AC-06 is COMPLETED / READY, owned by U-03 (receipt of first signature). RQ-05 maintains historical VERIFIED baseline (DEP-05 satisfied at T0); U-02 self-review is an audit caveat under RULE-007, not retroactive state mutation. AC-05 has explicit NOT_REQUIRED applicability and does not inherit RQ-05 proof.
  - Requirements map to specific criteria (`ER-xx`) and document versions (`DOC-xx vx`).
- **Anti-Self-Review (RULE-007)**:
  - Submitter of proof cannot review or verify own submission.
  - Matter OWNER role does not confer automatic verification authority without explicit verifier designation.
- **Signatures & Promotion**:
  - Version promotion requires mandatory reason and impact acknowledgment.
  - Partial signature execution (e.g. 1/2 signatures on `DOC-03 v3`) evaluates verification as `PARTIALLY_VERIFIED`, halting dependent closing gates.

### Wave 4: Regulatory Filing Lifecycle
- **UI Targets**: `SCR-09` (Regulatory Filing Tracker & Package Manager).
- **Filing Lifecycle Stepper**:
  - Implement the 9 canonical stages: `Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval`.
  - Enforce Receipt ≠ Approval (RULE-012): Uploading a filing receipt supplies an artifact only; transition to `Authority Review` requires an authorized, validated observation/command acknowledged by backend with exact scope, version, reference, and current guards. Outcome is `WAITING`, never `APPROVED`.
  - Support 2 full supplement-response cycles: each cycle preserves its own reference ID, requested items, owner, due date, and submitted response package.
  - Support ARCH-Q5 Reopen: reopening an approved filing preserves prior authority decisions and appends a reopening reason to audit history.

### Wave 5: Executive Control Room
- **UI Targets**: `SCR-02` (Executive Control Room).
- **6-Tier Layout**:
  - Maintain the exact hierarchy: 1. Blockers, 2. Next Actions / Decisions, 3. Waiting On, 4. Milestones, 5. Evidence Gaps, 6. Changes.
  - Causal Chain: Render the 5 critical path steps with differentiated role badges (`Root Cause` / `.root-blocker`, `Direct Gate` / `.direct-gate`, `Downstream Pipe` / `.downstream`), concise conditions, causes, downstream impacts, owners, and permitted next steps without paragraph duplication.
  - Milestones: Evaluate strictly as `UNASSESSED` when required sets are undefined. Satisfied/total count rendered as unavailable; zero fake percentage. Declared set evaluates `READY` only when all required Requirements are `READY + COMPLETED + (valid VERIFIED or explicit valid NOT_REQUIRED)`. Proof edge requires valid `VERIFIED`.

### Wave 6: Bulk Operations, Import, Export & Brief
- **UI Targets**: `SCR-10` (Bulk Editor), `SCR-11` (Import Wizard), `SCR-12` (Status Brief).
- **Bulk Metadata Editor**:
  - Restrict editable fields strictly to the 4-field allowlist: `title`, `description`, `internal_owner`, `due_date`.
  - Execute mutations atomically per row; return per-record result status (`succeeded`, `failed`, `unknown`).
  - Handle `OUTCOME_UNKNOWN`: if an HTTP write times out, do not allow blind retry. Require server readback/reconciliation before resubmitting.
- **Structured Import Wizard (R4-I07)**:
  - 3-step wizard with file upload, column mapping, and preview. Supports CSV and XLSX.
  - If any row in a connected dependency group fails validation, reject the entire group.
  - Imported verification records are treated as claims to be evaluated by contract/evaluator; no invented premature wire status enum.
- **Delta Status Brief & Scoped Export (R4-I07)**:
  - Calculate recorded-time changes in interval `(t1, t2]`, strictly separated from outstanding state at `t2`.
  - Build meaningful scoped XLSX export with formula injection escaping (`=`, `+`, `-`, `@`).

### Wave 7: Hardening, Verification & Accessibility
- **UI Targets**: All screens (`SCR-01` to `SCR-13`).
- **Accessibility & Focus**:
  - Ensure `:focus-visible` outline (`2px solid var(--r2-focus); outline-offset: 2px;`) is visible on all focusable elements without clipping by viewport containers.
  - Table keyboard navigation: ArrowUp/ArrowDown on rows; keep typing keys and arrows functional inside inputs/textareas for text and IME composition.
- **Mobile Responsive Parity**:
  - On viewports `<= 640px`, table rows reflow to accessible cards.
  - All interactive controls have minimum 44px touch targets.
  - Detail drawers open full-screen with sticky top navigation.

---

## 4. ZCode Author Self-Testing Checklist

Before submitting code for nonauthor review, verify the following:
- [ ] OIDC login with ZITADEL completes via PKCE; OAuth tokens stored server-side in BFF session store; opaque session handle in browser cookie; introspection verified.
- [ ] Requirement creation succeeds without actions; 5-axis state displayed independently.
- [ ] Operational Grid renders long Vietnamese/English text wrapped multiline without clipping.
- [ ] Compact density preserves 14px body font size (`Compact không giảm cỡ chữ`).
- [ ] Selection counter accurately announces hidden filtered records.
- [ ] My Actions displays 0 eligible actions at T0 with truthful explanation.
- [ ] `AC-05` appears in both Waiting On and Blocked sections without duplicate workload counting.
- [ ] Causal drill-down `AC-05 → RQ-04 → ER-04 → RQ-04 → AC-05 → Origin` works with breadcrumbs, Back buttons, draft preservation, and focus restoration to opener.
- [ ] Modal navigation session clears centrally on both Close button and Escape key; real origin preserved.
- [ ] Submitter cannot verify own evidence (RULE-007); OWNER cannot verify without explicit designation.
- [ ] Proof lookup uses explicit typed relations; `AC-05` has proof applicability `NOT_REQUIRED` and does not inherit `RQ-05` proof.
- [ ] Both Matter `EDITOR` and `OWNER` can assign Actions in scope to active members.
- [ ] Uploading filing receipt supplies document only; transition to Authority Review requires authorized observation/command (RULE-012); Receipt ≠ Approval.
- [ ] Bulk editor allows editing only `title`, `description`, `internal_owner`, and `due_date`.
- [ ] Structured import supports CSV and XLSX; invalid connected group rejected whole; imported verification is claim (no invented premature wire status enum).
- [ ] Delta Status Brief exports scoped XLSX with formula-leading character escaping (`=`, `+`, `-`, `@`).
- [ ] OpenDesign deliverable linter passes cleanly (0 P0, 0 P1, 0 P2).

*Status: ZCode Handoff Blueprint completed, unified, and ready for execution.*
