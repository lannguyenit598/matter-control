# ZCode R4 handoff — unified P0 implementation blueprint

Task: **MC-P0-DESIGN-R4** · Author: **Antigravity Design Assistant / Local Codex** · Consumer: **Actual ZCode (Backend + Product Frontend)**.
Priority: **P0 Delivery Prerequisite** · Governance base/head: `a62d838791ba188838c4ff00b7b6e265ac775056`.
Status: **PROPOSED_IN_REVIEW / IMPLEMENTATION_DIRECTIVE**.

---

## 1. Integration into Ongoing BE+FE W1–W7 Plan

This document is the definitive implementation blueprint for ZCode to integrate the complete MatterControl P0 design into the running **MC-P0-ZCODE-EXECUTION** assignment (`docs/implementation/p0-zcode-end-to-end-execution-plan.md`).

### 1.1 Core Directives
1. **Single Comprehensive Blueprint**: This handoff covers the entire P0 product scope across waves W1 to W7. ZCode does not need to pause after each screen or request separate design handoffs for routine UI implementation.
2. **Reuse Generic Primitives**: Maximize reuse of existing presentational components in `apps/frontend/src/components/atoms`, `molecules`, and `organisms`.
3. **Strict Domain Boundary**: Business features, domain models, five-axis state mappers, and API integrations belong exclusively under `apps/frontend/src/features/`. Do not pollute generic component directories with legal-domain wrappers.
4. **Read-Only Contract Alignment**: Align with existing Go backend interfaces and contract definitions. Do not invent arbitrary REST endpoints, DTOs, or ETag schemes. When an architecture detail is pending, treat it as an explicit dependency inside your plan.

---

## 2. Component Inventory & Architecture Placement

### 2.1 Generic Primitives (`apps/frontend/src/components/`)
The existing shared UI library provides battle-tested presentational building blocks:
- **Atoms**: `Button`, `Badge`, `Input`, `Textarea`, `Select`, `Label`, `Skeleton`.
- **Molecules**: `Dialog` (accessible modal using native `<dialog>` or Headless UI), `FormField` (accessible label, input, error, and description binding), `EmptyState`, `Alert`, `SearchInput`, `Pagination`, `PageHeader`, `StatCard`.
- **Organisms**: `DataTable` (presentational table wrapper), `AppHeader`, `AppSidebar`, `MobileNav`.

### 2.2 Domain Feature Modules (`apps/frontend/src/features/`)
Place domain logic, data hooks, and business compositions in the following feature directories:

| Feature Directory | Screens Covered | Scope & Responsibilities |
|---|---|---|
| `src/features/matters/` | `SCR-01` | Workspace & Matter switcher, active matter scope banner, session chip. |
| `src/features/control-room/` | `SCR-02` | 6-tier dashboard, 5-step causal pipeline cards, Milestones (UNASSESSED logic), Decisions. |
| `src/features/grid/` | `SCR-03` | Operational Grid table, multiline row rendering, Comfortable/Compact density, selection counter. |
| `src/features/actions/` | `SCR-03`, `SCR-05` | Action detail drawer, 4-tier My Actions operational queue, AC-05 dual-status handler. |
| `src/features/requirements/` | `SCR-04` | Requirement detail drawer, lifecycle timeline, title draft editor with rebase logic. |
| `src/features/dependencies/` | `SCR-06` | Causal dependency graph, impact inspector, incoming/outgoing gate badges (`proof` vs `completion`). |
| `src/features/evidence/` | `SCR-07` | Proof verification drawer, criterion checker, submitter vs verifier anti-self-review validator. |
| `src/features/documents/` | `SCR-08` | Document version lineage, signature execution tracker, version promotion modal with mandatory reason. |
| `src/features/filings/` | `SCR-09` | 9-stage filing lifecycle stepper, 2-cycle supplement-response tracker, receipt recorder. |
| `src/features/bulk/` | `SCR-10` | Bulk metadata editor modal, 4-field allowlist validator, atomic execution progress, partial audit. |
| `src/features/import/` | `SCR-11` | 3-step CSV/JSON import wizard, key/date mapping, deduplication engine, group rollback. |
| `src/features/brief/` | `SCR-12` | Delta status brief generator, `(t1, t2]` interval parser, formula-escaped export builder. |
| `src/features/audit/` | `SCR-13` | Scoped append-only event ledger, diff visualizer, causal reference linker. |

---

## 3. Wave-by-Wave Implementation Contract (W1–W7)

### Wave 1: Authentication, Session & Requirement Foundation
- **UI Targets**: `SCR-01` (App Shell), `SCR-04` (Requirement Detail & Create), `SCR-13` (Audit History).
- **Identity & Auth**:
  - Integrate with local ZITADEL instance using OIDC Authorization Code + PKCE S256.
  - Store tokens server-side in Next.js session BFF boundary; forward access tokens to Go backend via authenticated introspection.
  - Map `(issuer, subject)` to internal user account (`U-xx`).
- **Requirement Lifecycle**:
  - Implement Requirement create with zero actions allowed at creation.
  - Render Requirement Detail with 5 independent state axes (never collapse to a single badge).
  - Provide title draft editor with in-memory persistence and optimistic concurrency check on save.
- **Audit Logging**:
  - Every Requirement creation and edit must append an immutable audit record containing actor, timestamp, operation, and before/after diff.

### Wave 2: Operational Grid, My Actions & Causal Navigation
- **UI Targets**: `SCR-03` (Operational Grid), `SCR-03` (My Actions Queue), `SCR-05` (Action Detail), `SCR-06` (Causal Pipeline).
- **Operational Grid Implementation**:
  - Implement full-text search, type filter (`all`, `req`, `action`), and sort (`id`, `due`).
  - Table cell layout: set `min-height: 44px` for Comfortable, `min-height: 36px` for Compact.
    > **CRITICAL**: Compact mode must alter padding only (`padding: 4px 12px;`); **strictly preserve 14px body font size**.
  - Enable multiline text wrapping (`overflow-wrap: break-word; white-space: normal;`) for titles and reasons.
  - Implement row selection state with hidden item counter: `"Selected exact IDs: AC-04, AC-05 · Hidden by current view/filter: AC-12"`.
- **My Actions Operational Queue**:
  - Partition user actions into 4 distinct groups:
    1. *Eligible Actions*: Show 0 with explanation when no actions meet readiness criteria.
    2. *Waiting On*: Filter actions with execution=`WAITING`; display external counterparty and internal owner.
    3. *Blocked Actions*: Filter actions with dependency=`BLOCKED`; display upstream blocker root cause.
    4. *Completed Actions*: Filter actions with execution=`COMPLETED`.
  - Handle `AC-05`: display in both Waiting and Blocked sections with synchronized state, single draft, and explicit explanatory badge.
- **Causal Navigation History Stack (`navStack`)**:
  - Implement an internal navigation history stack in the detail drawer component:
    ```typescript
    interface NavHistoryItem {
      id: string;
      mode: 'record' | 'proof' | 'version';
      title: string;
    }
    const [navStack, setNavStack] = useState<NavHistoryItem[]>([]);
    ```
  - When drilling down from Action to Requirement via dependency gate:
    1. Push current action: `setNavStack(prev => [...prev, { id: currentId, mode: 'record', title: currentTitle }])`.
    2. Load target requirement.
    3. Render live breadcrumbs: `Grid / AC-05 / RQ-04`.
    4. Provide `← Back to AC-05` button to pop the stack.
  - When closing the drawer: clear `navStack`, restore focus to the originating DOM element (`openerRef.current?.focus()`).

### Wave 3: Evidence Submission & Independent Verification
- **UI Targets**: `SCR-07` (Evidence Verification Drawer), `SCR-08` (Document Versions & Signatures).
- **Evidence Verification Rules**:
  - Display criterion (`ER-xx`), required vs supplied document version, submitter identity, and designated verifier.
  - Enforce Anti-Self-Review (RULE-007): if `session.userId === evidence.submitterId`, disable verification action with explanatory alert: *"Submitter cannot self-review. Verification requires an independent designated verifier."*
  - Enforce Owner Rule: Matter OWNER role alone does not grant verifier permissions without explicit verifier designation.
- **Document Lineage & Signatures**:
  - Track document versions (`DOC-xx vx`). Version promotion requires an explicit promotion reason and impact acknowledgment.
  - Partial signature execution (e.g. 1/2 signatures on `DOC-03 v3`) evaluates verification as `PARTIALLY_VERIFIED`, halting dependent closing gates.

### Wave 4: Regulatory Filing Lifecycle
- **UI Targets**: `SCR-09` (Regulatory Filing Tracker & Package Manager).
- **Filing Lifecycle Stepper**:
  - Implement the 9 canonical stages: `Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval`.
  - Enforce Receipt ≠ Approval (RULE-016): uploading a submission receipt advances state to `Authority Review` with outcome `WAITING`, never `APPROVED`.
  - Support 2 full supplement-response cycles: each cycle preserves its own reference ID, requested items, owner, due date, and submitted response package.
  - Support ARCH-Q5 Reopen: reopening an approved filing preserves prior authority decisions and appends a reopening reason to audit history.

### Wave 5: Executive Control Room
- **UI Targets**: `SCR-02` (Executive Control Room).
- **6-Tier Layout**:
  - Maintain the exact hierarchy: 1. Blockers, 2. Next Actions / Decisions, 3. Waiting On, 4. Milestones, 5. Evidence Gaps, 6. Changes.
  - Causal Chain: Render the 5 critical path steps with role badges (`Root Cause`, `Direct Gate`, `Downstream Pipe`), conditions, causes, downstream impacts, owners, and permitted next steps.
  - Milestones: Evaluate strictly as `UNASSESSED` when required sets are undefined. Satisfied/total count rendered as unavailable; zero fake percentage.

### Wave 6: Bulk Operations, Import, Export & Brief
- **UI Targets**: `SCR-10` (Bulk Editor), `SCR-11` (Import Wizard), `SCR-12` (Status Brief).
- **Bulk Metadata Editor**:
  - Restrict editable fields strictly to the 4-field allowlist: `title`, `description`, `internal_owner`, `due_date`.
  - Execute mutations atomically per row; return per-record result status (`succeeded`, `failed`, `unknown`).
  - Handle `OUTCOME_UNKNOWN`: if an HTTP write times out, do not allow blind retry. Require server readback/reconciliation before resubmitting.
- **Structured Import Wizard**:
  - 3-step wizard with file upload, column mapping, and preview.
  - If any row in a connected dependency group fails validation, reject the entire group.
  - Imported verification records are marked as `CLAIM_IMPORTED`, requiring independent verification.
- **Delta Status Brief**:
  - Calculate recorded-time changes in interval `(t1, t2]`, strictly separated from outstanding state at `t2`.
  - Escape formula-leading characters (`=`, `+`, `-`, `@`) in CSV/text exports to prevent spreadsheet formula injection.

### Wave 7: Hardening, Verification & Accessibility
- **UI Targets**: All screens (`SCR-01` to `SCR-13`).
- **Accessibility & Focus**:
  - Ensure `:focus-visible` outline (`2px solid var(--r2-focus)`) is visible on all focusable elements without clipping by viewport containers.
  - Maintain `aria-describedby` linking form controls to their helper and error messages.
  - Table keyboard navigation: ArrowUp/ArrowDown on rows; keep typing keys and arrows functional inside inputs/textareas for text and IME composition.
- **Mobile Responsive Parity**:
  - On viewports `<= 640px`, table rows reflow to accessible cards.
  - All interactive controls have minimum 44px touch targets.
  - Detail drawers open full-screen with sticky top navigation.

---

## 4. ZCode Author Self-Testing Checklist

Before submitting code for nonauthor review, verify the following:
- [ ] OIDC login with ZITADEL completes via PKCE; tokens stored in session cookie; introspection verified.
- [ ] Requirement creation succeeds without actions; 5-axis state displayed independently.
- [ ] Operational Grid renders long Vietnamese/English text wrapped multiline without clipping.
- [ ] Compact density preserves 14px body font size (`Compact không giảm cỡ chữ`).
- [ ] Selection counter accurately announces hidden filtered records.
- [ ] My Actions displays 0 eligible actions at T0 with truthful explanation.
- [ ] `AC-05` appears in both Waiting On and Blocked sections without duplicate workload counting.
- [ ] Causal drill-down `AC-05 → RQ-04 → ER-04 → RQ-04 → AC-05 → Grid` works with full breadcrumbs, Back buttons, draft preservation, and focus restoration to opener.
- [ ] Submitter cannot verify own evidence (RULE-007); OWNER cannot verify without explicit designation.
- [ ] Uploading filing receipt transitions to Authority Review, not APPROVED (RULE-016).
- [ ] Bulk editor allows editing only `title`, `description`, `internal_owner`, and `due_date`.
- [ ] OpenDesign linter passes cleanly (0 P0, 0 P1, 0 P2).

*Status: ZCode Handoff Blueprint completed, unified, and ready for execution.*
