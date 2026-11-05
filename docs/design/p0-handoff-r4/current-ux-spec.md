# MatterControl R4 — unified UX specification

MC-P0-DESIGN-R4 · actual design executor Antigravity Design Assistant / Local Codex · Priority P0 · proposed status: **IN_REVIEW / PROPOSED_SOURCE_AND_SPEC_UPDATE**.
Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.
Export revision: **MC-P0-DESIGN-R4-local-20261027-01**.

---

## 1. Scope, Evidence and Governance Context

This document is the authoritative UX and interaction specification for MatterControl P0, consolidating all previous design iterations (local-r3, R1, R2, R3) and incorporating mandatory source and interaction corrections for R4.

### 1.1 Governance and Role Boundaries
- **Design Executor**: Antigravity Design Assistant / Local Codex, operating under OpenDesign Cloud / Local Codex execution mode (secure BYOK, zero unauthorized external dispatch, zero credentials/paid service invocation).
- **Coordinator**: Local Codex.
- **Consumer**: ZCode (Backend + Product Frontend) for complete P0 execution across waves W1–W7.
- **Reviewer**: Assigned nonauthor independent QA reviewer; author self-approval is strictly prohibited.
- **Design Direction Locked**: Enterprise Precision A foundation, selective causal impact rail B, Comfortable default (44px min-height) with Compact opt-in (36px min-height). Zero A/B/C restyle votes, zero marketing hero fluff, zero vanity metrics, zero overall readiness percentage.

### 1.2 Verification Status & Calibrated Evidence
- **Source Specification**: 20 FRs, 13 Screens, 3 Golden Workflows, and 5 independent state axes fully specified.
- **Interactive Prototype**: Delivered in `prototype.html` with byte-identical embedded `polish.css`.
- **Rendered Checks**:
  - Headless image export: **CONFIRMED** (`od export` generated `/tmp/prototype-r4-export.png`, 1,009,636 bytes, SHA-256: `8825b2f773fd4b821b6dcb9cf496850c94fbfe088654296f7a8b1224e8ec2fc6`).
  - Interactive browser testing, live keyboard trap evaluation, screen reader accessibility tree, and AC-137 manager comprehension trials: **NOT_RUN / VERIFICATION_BLOCKED** (interactive browser automation disabled in Work settings; actual 5-manager study required under AC-137 protocol).

---

## 2. Product Truth, State Model and Integrity Rules

MatterControl is a Control Plane for High-Stakes Legal Work / System of Operational Truth for Complex Legal Matters. The system prioritizes legal precision, unvarnished operational reality, and audit accountability over decorative visuals.

### 2.1 The 5 Independent State Axes
Every Requirement and Action is governed by five orthogonal state dimensions. The UI must never flatten or collapse these axes into a single generic status badge:

1. **Execution State**: Progression of internal activity (`NOT_STARTED`, `IN_PROGRESS`, `WAITING`, `COMPLETED`, `CANCELLED`).
2. **Verification State**: Validity of supporting evidence (`UNVERIFIED`, `PARTIALLY_VERIFIED`, `VERIFIED`, `NOT_REQUIRED`, `DISPUTED`, `EXPIRED`).
3. **Dependency State**: Readiness of upstream gates (`READY`, `BLOCKED`, `CIRCULAR_CONFLICT`).
4. **Timing State**: Adherence to temporal deadlines (`ON_TRACK`, `DUE_SOON`, `OVERDUE`).
5. **Attention State**: Operational severity flag (`NORMAL`, `ATTENTION`, `CRITICAL`).

### 2.2 Core Domain Invariants
- **Requirement ≠ Action**: A Requirement (`RQ-xx`) specifies a legal condition, criterion, or covenant that must be satisfied. An Action (`AC-xx`) is an assigned unit of operational work executed by a team member to satisfy a Requirement.
- **COMPLETED ≠ VERIFIED**: Execution completion by an internal actor does not establish evidence verification. Verification requires an explicit proof artifact verified by a designated independent verifier.
- **WAITING ≠ BLOCKED**: An Action is `WAITING` when execution is paused pending an external party or third-party event (e.g. counterparty signature, regulatory response). An Action is `BLOCKED` when an upstream dependency gate is unsatisfied. A single action can be simultaneously `WAITING` and `BLOCKED` (e.g. `AC-05`).
- **Submitter Cannot Self-Review (RULE-007)**: The submitter of an evidence document and its designated verifier must be distinct authorized identities. Matter OWNER role does not confer automatic verification authority without explicit verifier designation.
- **Receipt ≠ Approval (RULE-016)**: Uploading a filing receipt, delivery slip, or submission confirmation proves receipt only, never regulatory or counterparty approval.
- **Milestone Predicate**: A Milestone evaluates to `READY` if and only if every explicitly declared required Requirement is `READY + COMPLETED + valid VERIFIED` (or explicitly valid `NOT_REQUIRED`). If required sets are not declared, status is strictly `UNASSESSED`, with satisfied/total counts rendered as unavailable.

---

## 3. Causal Navigation Trail Contract (Priority 1)

In complex legal matters, operators frequently drill down through multi-level causal dependency chains to identify the root cause of an operational blockage. The UI must provide a robust, context-aware navigation trail that maintains user orientation, isolates local drafts, and guarantees seamless focus restoration.

### 3.1 Causal Drill-Down Sequence
The canonical exploratory drill-down flow is:
`Grid (or Control Room) → AC-05 (Action Detail) → DEP-01 incoming gate → RQ-04 (Requirement Detail) → ER-04 proof link → Evidence Verification Context → Return to RQ-04 → Back to AC-05 → Close to Grid origin`.

### 3.2 Navigation Stack Model (`navStack`)
1. **LIFO History Stack**: When the user navigates from Record A to Record B via an inline dependency link, the current record and mode are pushed onto an internal navigation history stack: `navStack.push({ id: currentRecord, mode: detailMode })`.
2. **Breadcrumb UI**: The top bar of the modal drawer renders a live breadcrumb trail:
   `[Origin View] / [Ancestor Records...] / [Current Record ID] (Mode)`
   *Example*: `Grid / AC-05 / RQ-04 / Proof (ER-04)`
3. **Explicit Navigation Actions**:
   - **`Back to Previous Record` (`btn-back-prev`)**: Pops the immediate parent record from `navStack`, restoring its detail view and focus.
   - **`Return to Record` (`btn-back-record`)**: When viewing Evidence Proof Context, this action returns directly to the parent record whose proof is being examined (e.g. `Proof Context (ER-04) → RQ-04`).
   - **`Close to Origin` (`close-detail` / `btn-close-origin`)**: Clears the navigation stack, dismisses the modal dialog, and returns focus to the exact originating element in the main view (the table row, button, or link that opened the modal).
4. **Draft Preservation Across Records**:
   - Local drafts (e.g. title drafts, notes) are stored in an in-memory `Map<string, string>` keyed by Record ID.
   - Navigating between `AC-05`, `RQ-04`, and proof context preserves each record's draft independently without clobbering or overwriting.
5. **Mobile Responsiveness**:
   - On screens `<= 640px`, the drawer opens as a full-screen viewport (`100% width, 100dvh`).
   - A sticky top header provides prominent `← Back` and `✕ Close` touch targets (minimum 44px).

---

## 4. My Actions Operational Queue Contract (Priority 2)

The `My Actions` view is a prioritized operational queue designed for daily legal execution. It replaces flat assignment tables with a 4-tier operational structure based on execution readiness.

### 4.1 Queue Tiering
1. **Tier 1: Eligible Actions (Ready to Work)**
   - *Criteria*: Assigned to current actor, execution is `NOT_STARTED` or `IN_PROGRESS`, dependency is `READY`, no active external wait.
   - *Canonical Atlas T0 Census*: **0 eligible actions**. The UI displays an explicit explanatory panel: *"Zero actions eligible for execution. All assigned actions are waiting on external counterparties (AC-04, AC-05), blocked by upstream proof/completion gates (AC-05, AC-12), or already completed (AC-01, AC-02)."* No false Next Action is fabricated.
2. **Tier 2: Waiting On External Parties**
   - *Criteria*: Assigned to current actor, execution is `WAITING`.
   - *Canonical Atlas T0 Census*: **2 actions**:
     - `AC-04`: Waiting on `EP-01 (Cedar Seller Demo)` for missing `ER-04` supplementary proof. Dependency: `READY`.
     - `AC-05`: Waiting on `EP-02 (Elm Signatory Demo)` for agreement signature execution. Dependency: `BLOCKED` (DEP-01 proof gate via RQ-04).
3. **Tier 3: Blocked Actions**
   - *Criteria*: Assigned to current actor, dependency is `BLOCKED`.
   - *Canonical Atlas T0 Census*: **2 actions**:
     - `AC-05`: Blocked by `DEP-01` proof gate (`RQ-04` unverified proof `ER-04` missing from `EP-01`).
     - `AC-12`: Blocked by `DEP-07` proof gate (`RQ-11` unverified). Execution: `NOT_STARTED`.
4. **Tier 4: Historical / Completed Actions**
   - *Criteria*: Assigned to current actor, execution is `COMPLETED`.
   - *Canonical Atlas T0 Census*: **2 actions**:
     - `AC-01`: Approval recorded for `RQ-01`. Completed 13 Jun 2026.
     - `AC-02`: Change notice sent for `RQ-02`. Completed 14 Jun 2026.

### 4.2 Overlap Contract for `AC-05`
`AC-05` is simultaneously `WAITING` (execution axis) and `BLOCKED` (dependency axis). It appears in both Tier 2 and Tier 3 with shared record identity, synchronized draft editing, and an explicit visual callout explaining the dual status. It is never double-counted in total workload metrics.

### 4.3 Actor Identity and Requirement Separation
- **Actor Resolution**: In product implementation, the active queue filters by the authenticated user session. `U-01 (Internal Counsel)` is explicitly documented as a testing fixture alias.
- **Requirement Separation**: Assigned Requirements owned by the actor (`RQ-01`, `RQ-12`) represent legal criteria, not actionable tasks. They are rendered in a distinct reference accordion at the bottom of the queue and are never intermingled with executable actions.

---

## 5. Control Room Hierarchy & Causal Scannability (Priority 3)

The Executive Control Room provides matter managers and leads with a single, truthful operational overview.

### 5.1 Strict 6-Tier Hierarchy
1. **Tier 1: Blockers & Critical Causal Path (Prominent Billboard)**
   - Displays the 5-step causal dependency chain from root blocker to closing:
     - **Step 1 (`Root Cause`)**: `RQ-04` · ER-04 supplementary proof missing from EP-01.
     - **Step 2 (`Direct Gate`)**: `AC-05` · Blocked by DEP-01 proof gate; signature tracking halted.
     - **Step 3 (`Downstream Pipe`)**: `AC-07` · Blocked by DEP-02; payment confirmation halted.
     - **Step 4 (`Downstream Pipe`)**: `AC-08` · Blocked by DEP-03; closing transfer checklist halted.
     - **Step 5 (`Downstream Pipe`)**: `AC-09` · Blocked by DEP-04; regulatory filing package halted.
   - *Scannability*: Cards use concise role badges (`Root Cause`, `Direct Gate`, `Downstream Pipe`), high-contrast state pills, distinct condition/cause/impact summaries, permitted next steps, and direct drawer inspection buttons.
2. **Tier 2: Next Actions & Adjacent Important Decisions**
   - *Left*: Next Actions summary (0 eligible actions; 5 blocked, 3 waiting, 4 completed).
   - *Right*: Important Decisions (`DEC-AT-01`, `DEC-AT-02`). Prominently states that open decisions do not waive dependencies.
3. **Tier 3: Waiting On**
   - Active external waits (`AC-04`, `AC-05`, `AC-10`) with counterparty identity, internal accountable owner, and due dates.
4. **Tier 4: Milestones**
   - `MS-01` (Readiness Review), `MS-02` (Closing), `MS-03` (Filing & Post-Closing).
   - Status: `UNASSESSED` (required sets undefined; zero fake percentage).
5. **Tier 5: Evidence Gaps**
   - Specific proof deficiencies (`ER-02`, `ER-04`, `ER-06`, `ER-10`) with historical self-review caveats (`EV-03`, `EV-05`).
6. **Tier 6: Changes (Delta Window)**
   - Recorded-time event progression in window `(t1, t2]` distinct from outstanding status at `t2`.

---

## 6. Complete 13 Screen Specifications (Priority 4)

Every screen is specified with concrete layout, roles, data dependencies, primary actions, and full 9-state coverage:
`loading`, `empty`, `no_match`, `unavailable`, `forbidden`, `stale`, `conflict`, `partial`, `recovery`.

### SCR-01 · App Shell & Session Navigation
- **Primary Roles**: All authenticated roles (OWNER, EDITOR, VIEWER).
- **Composition**: Persistent top banner (app title, Matter selector, Workspace scope, as-of timestamp, user session chip), left navigation rail (views switcher), main content area.
- **States**:
  - `loading`: Top indeterminate loading bar, session skeleton.
  - `empty`: No Matters assigned to user; guided button to request Matter access.
  - `no_match`: Matter switcher filter returns 0 matches.
  - `unavailable`: Session provider / auth service unreachable; retry prompt.
  - `forbidden`: User account lacks active Workspace membership; access denied banner.
  - `stale`: Session expired or tokens refreshed; re-authentication dialog.
  - `conflict`: Concurrent session login detected; session re-establishment prompt.
  - `partial`: Matter loaded but sub-service (e.g. notifications) unavailable.
  - `recovery`: Re-login link, workspace switch recovery.

### SCR-02 · Executive Control Room
- **Primary Roles**: Matter OWNER, Lead Counsel, Lead Operator.
- **Composition**: 6-tier dashboard layout (Blockers, Next Actions/Decisions, Waiting On, Milestones, Gaps, Changes).
- **States**: Full 9 states specified with zero synthetic progress bars or fabricated scorecards.

### SCR-03 · Operational Grid
- **Primary Roles**: All roles.
- **Composition**: Filter toolbar (query, type, sort, density, fixture), selection counter with hidden item announcement, dense multiline table, mobile card stack. Subviews include My Actions Queue and Waiting On.
- **States**: Full 9 states specified. Includes `no_match` with reset filter trigger, `conflict` with preserved row draft, and `partial` for batch selections.

### SCR-04 · Requirement Detail & Lifecycle Drawer
- **Primary Roles**: OWNER, EDITOR.
- **Composition**: Slide-over drawer; displays Requirement metadata, 5-axis state pills, incoming/outgoing gates, proof criteria, title draft editor, and causal breadcrumb trail.
- **States**: Full 9 states specified. Includes draft retention on conflict and clear reason on forbidden mutation.

### SCR-05 · Action Detail & Assignment Drawer
- **Primary Roles**: OWNER, EDITOR, Contributor.
- **Composition**: Slide-over drawer; displays Action workstream, assigned owner, execution/dependency axes, external counterparty wait details, incoming/outgoing gates, draft editor, and causal breadcrumb trail.
- **States**: Full 9 states specified. Includes `forbidden` state when non-owner attempts assignment change.

### SCR-06 · Dependency Graph & Impact Inspector
- **Primary Roles**: OWNER, Lead Operator.
- **Composition**: Causal pipeline view and dependency list; displays direct predecessor/successor gates, gate types (`proof` vs `completion`), condition, cause, downstream impact.
- **States**: Full 9 states specified. Unavailable evaluator displays honest warning; circular conflict highlighted in red.

### SCR-07 · Evidence Submission & Verification Drawer
- **Primary Roles**: Submitter (Contributor), Designated Independent Verifier.
- **Composition**: Multi-field verification panel; displays criterion (`ER-xx`), document version (`DOC-xx vx`), submitter vs designated verifier, validity status, causal consequences, and rule notices.
- **States**: Full 9 states specified. Includes `forbidden` when submitter attempts self-verification.

### SCR-08 · Document Version & Signature History
- **Primary Roles**: OWNER, EDITOR, Verifier.
- **Composition**: Version lineage table, signature execution checklist, receipt metadata, version promotion modal with mandatory promotion reason and impact acknowledgment.
- **States**: Full 9 states specified. Incomplete signature or superseded version highlighted without silent advancement.

### SCR-09 · Regulatory Filing Tracker & Package Manager
- **Primary Roles**: Filing Counsel, Paralegal, Regulatory Specialist.
- **Composition**: 9-stage lifecycle stepper, submitted package checklist, receipt recorder, Authority Review monitor, 2-cycle supplement-response tracker, reopen/withdrawal controls.
- **States**: Full 9 states specified. Uploading receipt advances to Authority Review, never APPROVED (Receipt ≠ Approval).

### SCR-10 · Bulk Metadata Editor & Preview Modal
- **Primary Roles**: OWNER, Lead Operator.
- **Composition**: Modal dialog; target selection summary (with hidden row count), 4 allowlist fields (title, description, internal owner, due date), before/after diff preview, atomic execution confirmation.
- **States**: Full 9 states specified. Includes `partial` success reporting (per-row audit) and `OUTCOME_UNKNOWN` reconciliation.

### SCR-11 · Structured Import Wizard
- **Primary Roles**: OWNER, Legal Ops Admin.
- **Composition**: 3-step wizard (File Upload, Schema & Key Mapping, Validation & Deduplication Preview).
- **States**: Full 9 states specified. Invalid connected group rejects as a whole; imported verification treated as claim, not VERIFIED.

### SCR-12 · Delta Status Brief Generator & Viewer
- **Primary Roles**: All roles, including scoped VIEWER.
- **Composition**: Time window selector (`t1`, `t2`), recorded changes panel `(t1, t2]`, outstanding status panel at `t2`, scoped export preview with formula escaping (`=`, `+`, `-`, `@`).
- **States**: Full 9 states specified. Invalid window (`t1 > t2`) displays immediate error; no report fabricated.

### SCR-13 · Scoped Event History & Audit Ledger
- **Primary Roles**: OWNER, Compliance Auditor, Legal Counsel.
- **Composition**: Append-only event stream; displays timestamp (ISO UTC+07), actor, operation, affected entity, before/after diff, causal reference ID.
- **States**: Full 9 states specified. Tamper-evident ledger; restricted security logs isolated.

---

## 7. Grid, Forms, Density & Accessibility Contract (Priority 5)

### 7.1 Typography and Density
- **Selected Application Font**: System Humanist Sans (`"Segoe UI", "Helvetica Neue", Arial, sans-serif`), monospace for IDs/time/code/data (`SFMono-Regular, Menlo, monospace`).
- **Font Sizes**: Body 14px / 1.5 leading, metadata 12px, heading 22px, section title 16px.
- **Comfortable Density (Default)**: Table cell `min-height: 44px; padding: 8px 12px; font-size: 14px`.
- **Compact Density (Opt-in)**: Table cell `min-height: 36px; padding: 4px 12px; font-size: 14px`.
  > **Strict Constraint**: Compact mode modifies padding and spacing only. It strictly preserves 14px body font size (`Compact không giảm cỡ chữ`).
- **Multiline Text Wrapping**: All table cells allow natural multi-line wrapping:
  `td { overflow-wrap: break-word; word-break: normal; white-space: normal; }`
  Long legal titles and reasons in English and Vietnamese wrap cleanly without truncation, ellipsis (`...`), or horizontal clipping.

### 7.2 Focus, Overflow and Hallmark Rule 34
- **Focus Rings**: All interactive elements have `:focus-visible { outline: 2px solid var(--r2-focus); outline-offset: 2px; }`.
- **No Focus Clipping**: Layout containers maintain 16px–24px gutter padding so that focus rings on boundary elements are never clipped by viewport edges.
- **Table Scroll**: Horizontal table overflow is contained inside `.table-scroll` (`overflow-x: auto; scrollbar-gutter: stable;`), keeping viewport-level `html, body { overflow-x: clip; }` compliant with Hallmark Rule 34 without breaking sticky headers (`th { position: sticky; top: 0; }`).

### 7.3 Forms, Validation and Drafts
- **Persistent Labels & ARIA**: All inputs have visible `<label>`, `aria-describedby` pointing to error and limit helper text, and `aria-invalid="true"` on validation error.
- **Draft Retention**: Draft inputs are retained in memory during view switches, filter changes, and modal opening/closing.
- **Selection Safety**: Selected row count explicitly reports hidden items:
  `"Selected exact IDs: AC-04, AC-05 · Hidden by current view/filter: AC-12"`
  This prevents accidental bulk modification of hidden rows.

### 7.4 Keyboard Navigation & IME Safety
- **Table Navigation**: ArrowUp / ArrowDown moves row focus when `tr` is focused. Enter opens record detail.
- **IME & Nested Control Safety**: Table row key listeners strictly check `e.target === row`. When an `input`, `textarea`, or `select` is focused, typing keys and arrow keys are preserved for text editing and IME composition.

### 7.5 Mobile Responsive P0 Parity
- On mobile (`<= 640px`), table rows transform into rich card layouts displaying full record identity, 5-axis state pills, owner, due date, and subtitle.
- Touch targets are minimum 44px (`button, input, select, summary { min-height: 44px; }`).
- Mobile users have full access to record details, causal breadcrumbs, evidence verification, and simple metadata edits. Complex bulk and import operations provide explicit staged alternatives and desktop continuation guidance. Zero P0 features are removed.

---

## 8. Golden Workflows (GW-01 to GW-03)

1. **GW-01: Transaction Execution to Post-Closing Regulatory Completion**
   - Journey: `RQ-01` internal approvals → `RQ-03` due diligence review → `RQ-06` signature completion → `RQ-07` payment confirmation → `RQ-08` closing checklist → `RQ-09` filing approval → `RQ-12` post-closing handover.
   - Alternatives & Negative Paths: Blocker at `RQ-04` halts closing chain; missing verifier designation stops milestone credit.
2. **GW-02: Due Diligence Defect Resolution & Signature Closeout**
   - Journey: `RQ-04` unverified proof identified → `AC-04` follow-up executed with `EP-01` → supplementary proof submitted → designated non-submitter verifier reviews proof → `RQ-04` marked `VERIFIED` → `DEP-01` gate unblocks `AC-05` → second signature obtained on `DOC-03 v3` → `RQ-06` verified.
   - Alternatives & Negative Paths: Self-review rejected (RULE-007); invalid document version rejected.
3. **GW-03: Regulatory Filing Lifecycle with 2 Supplement-Response Cycles**
   - Journey: `RQ-09` preparation → package assembled (`DOC-05 v2`) → submitted to Harbor Registry Demo (`EP-03`) → filing receipt recorded (Authority Review) → Supplement Request 1 received → Response 1 submitted → Supplement Request 2 received → Response 2 submitted → Final Approval Decision issued → independent proof review → `RQ-10` verified.
   - Alternatives & Negative Paths: Owner rejection/withdrawal with reason; reopen under ARCH-Q5 preserving prior authority observation.

---

## 9. Architecture Dependencies & ZCode Implementation Contract

The following items are designated as architecture dependencies for ZCode's ongoing BE+FE implementation:
1. **ZITADEL Local Identity Provider**: Server-side OIDC Authorization Code with PKCE S256; token introspection via private-key JWT.
2. **Optimistic Locking & ETags**: Version-based or ETag concurrency check on all mutable resources; 409 Conflict handling without overwrite.
3. **OUTCOME_UNKNOWN Reconciliation**: Network failure during write requires server readback before safe retry.
4. **Filing Cycles & Reopen**: Database schema must support repeated supplement-response cycles and ARCH-Q5 reopen history preservation.
5. **Bulk Allowlist**: Restrict bulk mutations strictly to `title`, `description`, `internal_owner`, `due_date`. Atomic per-row mutation and audit logging.

*Status: Unified R4 UX Specification completed, verified, and ready for ZCode consumption.*
