# MatterControl Current UX Specification — MC-P0-DESIGN-R1

## 0. Document Metadata & Governance Baseline

- **Specification ID**: SPEC-MC-P0-DESIGN-R1
- **Task Reference**: MC-P0-DESIGN-R1 (Continuation from local-r3)
- **Status**: `PREPARED_NOT_DISPATCHED / SPECIFICATION_CONSOLIDATION`
- **Design Authority**: Local Codex under delegated PO Authority (`D-UX01..04`)
- **Implementer Target**: ZCode (Full P0 Backend & Product Frontend)
- **Governance Commit**: `a62d838791ba188838c4ff00b7b6e265ac775056`
- **Branch**: `codex/unified-project-flow`
- **Design Tokens Source**: `docs/design/step-03a/revised/local-r3/design-tokens.json` / `selected-tokens.css`
- **Rendered Acceptance Status**: `RENDERED_VALIDATION_UNAVAILABLE` (Mandatory independent review and headless testing pending)

---

## 1. Design System & Token Binding Contract

The interface adheres strictly to **Enterprise Precision (Direction A)** with the causal impact rail from Direction B and compact operational behavior from Direction C. No external library branding is adopted.

### 1.1 Palette Tokens

```css
:root {
  /* Surfaces and Canvas */
  --surface: #ffffff;             /* Primary card and modal canvas */
  --background: #f6f8fa;          /* Main application page background */
  --header: #101820;              /* Global dark header / context rail */
  --header-text: #ffffff;         /* Text on global dark header */

  /* Text Neutrals (Dark-on-Light) */
  --ink: #17212b;                 /* Primary high-contrast typography */
  --muted: #52606d;               /* Secondary metadata, subtitles, labels */
  --line: #c6ced6;                /* Subtle dividers, card borders, table rules */
  --disabled: #626973;            /* Disabled control label and icon fill */

  /* Interactive & States */
  --focus: #174ea6;               /* Blue focus halo (2px offset) */
  --selected: #e8effa;            /* Table row selection fill */
  --error: #a12622;               /* Form validation errors, destructive actions */

  /* Semantic State Family (Color + Text paired) */
  --execution: #364152;           /* Execution neutral / in-progress */
  --verification: #236341;        /* Proof accepted / verified green */
  --dependency-ready: #174ea6;    /* Unblocked / ready to start blue */
  --dependency-blocked: #8a2925;  /* Blocker alert red */
  --timing: #775317;              /* Due soon amber / schedule warning */
  --attention: #783e14;           /* High attention / critical cause orange */
}
```

### 1.2 Typography & Sizing Ladder

- **Font Family**: System Humanist Sans stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).
- **Monospace Stack**: System Monospace (`"SF Mono", "Segoe UI Mono", Menlo, Consolas, monospace`) strictly reserved for entity IDs, SHA-256 hashes, timestamps, and raw JSON payloads.
- **Type Scale**:
  - `heading`: 22px / line-height 1.25 / font-weight 600
  - `title`: 17px / line-height 1.35 / font-weight 600
  - `body`: 14px / line-height 1.50 / font-weight 400
  - `body-emphasis`: 14px / line-height 1.50 / font-weight 600
  - `metadata`: 12px / line-height 1.45 / font-weight 400
  - `metadata-bold`: 12px / line-height 1.45 / font-weight 600
- **Touch & Desktop Sizing**:
  - Minimum desktop button/input height: `32px`
  - Minimum mobile touch target: `44px`
  - Standard focus ring: `2px solid var(--focus)` with `2px` offset.

### 1.3 Operational Density Modes

1. **Comfortable Mode (Default)**:
   - Row height: Minimum `44px` (single-line baseline).
   - Vertical padding: `8px` top/bottom.
   - Purpose: Standard executive reviews, detailed reading, first-time users.
2. **Compact Mode (User Opt-In)**:
   - Row height: Minimum `36px` (single-line baseline).
   - Vertical padding: `4px` top/bottom.
   - Purpose: Dense operational triage, reviewing 50+ line items without excessive scrolling.
3. **Multiline Expansion Invariant**:
   - **Text size does NOT shrink in Compact mode**.
   - If a legal title, requirement description, or failure reason exceeds one line, the cell **must expand vertically**. Truncation with `...` (ellipsis) is strictly prohibited for legal conditions, verification reasons, and error text.

---

## 2. Global State Model: Five Independent Dimensions

Every Requirement, Action, and Regulatory Filing exposes five orthogonal state dimensions. The product UI must never collapse these into a single overloaded "Status" badge.

| Axis | Valid Enum Values | Business Semantics & Rules | Display Token |
|---|---|---|---|
| **1. Execution** | `NOT_STARTED`<br>`IN_PROGRESS`<br>`WAITING`<br>`COMPLETED`<br>`CANCELLED` | Human progress asserted by assigned contributors. Terminal `COMPLETED` does NOT mean verified. `WAITING` requires an internal follow-up owner and waiting condition. | Neutral slate (`#364152`)<br>Amber for `WAITING` (`#775317`) |
| **2. Verification** | `UNVERIFIED`<br>`PARTIALLY_VERIFIED`<br>`VERIFIED`<br>`DISPUTED`<br>`NOT_REQUIRED` | Authoritative validity of submitted evidence evaluated against criteria by a designated verifier. Zero criteria yields `UNVERIFIED`. `NOT_REQUIRED` is an explicit OWNER exemption under RULE-005. | Green for `VERIFIED` (`#236341`)<br>Muted for `UNVERIFIED`<br>Red for `DISPUTED` (`#a12622`) |
| **3. Dependency** | `READY`<br>`BLOCKED` | Derived automatically by server graph evaluation under RULE-003. `READY` requires all upstream prerequisites to be completed and proof-verified. | Blue for `READY` (`#174ea6`)<br>Red for `BLOCKED` (`#8a2925`) |
| **4. Timing** | `ON_TRACK`<br>`DUE_SOON`<br>`OVERDUE` | Evaluated against explicit as-of timestamp (+07:00). `DUE_SOON` represents deadline within 48h. Records without a deadline display "No due date" with unassessed schedule indicator. | Amber for `DUE_SOON`<br>Red for `OVERDUE`<br>Slate for `ON_TRACK` |
| **5. Attention** | `NORMAL`<br>`ATTENTION`<br>`CRITICAL` | Aggregated exception indicator triggered by unresolved blockers, disputes, overdue deadlines, or explicit escalation. | Orange for `ATTENTION` (`#783e14`)<br>Red for `CRITICAL` (`#a12622`) |

---

## 3. Wave 1 Detailed Specification: Shell, Navigation & Core Requirements

### 3.1 SCR-01: App Shell & Session Navigation

#### Input & Business Context
The application shell frames all operations. Users access the system within a strict tenancy boundary: **Active Workspace Membership** AND **Explicit Matter Membership**. Workspace OWNER does not have automatic access to confidential matters (RULE-017).

#### Authoritative Data Dependency
- Session endpoint: `GET /api/v1/session` -> `{ user_id, email, active_workspace_id, workspaces: [...] }`
- Matter context endpoint: `GET /api/v1/workspaces/{wsId}/matters/{matterId}/context` -> `{ matter_id, title, role: ("OWNER"|"EDITOR"|"VIEWER"), designated_verifier: boolean }`

#### Layout & Navigation Structure
- **Global Header (Dark `#101820`, Height 48px)**:
  - App Logo: "MatterControl" (white humanist sans, 16px bold).
  - Workspace Switcher: Dropdown showing current workspace name, ID, and list of accessible workspaces.
  - Divider: Thin vertical rule (`rgba(255,255,255,0.15)`).
  - Matter Switcher: Searchable selector showing current Matter title (`ATLAS-001`), workstream summary, and switch option.
  - Right Utility Rail: Current user display (`user@example.com`), Matter Role Badge (`OWNER`, `EDITOR`, or `VIEWER`), and Session status dot.
- **Matter Navigation Sub-Bar (Light `#ffffff`, Border `#c6ced6`, Height 40px)**:
  - Nav Tabs:
    1. `Control Room` (SCR-02)
    2. `Operational Grid` (SCR-03)
    3. `Dependencies` (SCR-06)
    4. `Filings` (SCR-09)
    5. `Briefs` (SCR-12)
    6. `History` (SCR-13)
  - Active Tab indicator: 2px bottom border in `--focus` (`#174ea6`), bold text.

#### Edge, Error & Security States
1. **Loading State**: Global header renders with skeleton pulse on switcher texts; sub-bar tabs disabled; page body shows centered spinner with text "Loading matter context...".
2. **Forbidden Matter State (Security Invariant RULE-017)**:
   - When a user enters a URL for a matter where they lack active membership, the system returns **HTTP 404 Not Found** (indistinguishable from a non-existent matter).
   - Display: Centered neutral card: "Matter not found. The requested matter does not exist or you do not have permission to view it." No matter title, workspace name, or internal metadata leaks.
3. **Session Expired State**: Floating modal overlay: "Your session has expired. Please sign in again to resume your work." Form inputs lock; background is frosted.
4. **Stale Data Warning**: Yellow banner below header: "A newer version of this matter was committed by another user. [Refresh to update]."

---

### 3.2 SCR-04: Requirement Create, Read & Detail Drawer

#### Input & Business Context
Requirements represent legal conditions, governance obligations, or transactional milestones (e.g., "RQ-01 Corporate Approval Resolution", "RQ-04 Due Diligence Material Contracts Review"). They hold zero or more child Actions, Evidence Requirements, and prerequisite links.

#### Authoritative Data Dependency
- Endpoint: `GET /api/v1/matters/{matterId}/requirements/{reqId}`
- Mutation endpoints:
  - `POST /api/v1/matters/{matterId}/requirements` (Create)
  - `PATCH /api/v1/matters/{matterId}/requirements/{reqId}` (Update with `If-Match: "{revision}"`)
  - `POST /api/v1/matters/{matterId}/requirements/{reqId}/reopen` (OWNER only)
  - `POST /api/v1/matters/{matterId}/requirements/{reqId}/cancel` (OWNER only)

#### Detail Drawer Layout (Right Drawer, 480px Desktop / Full-Screen Mobile)
- **Header**:
  - Entity ID badge: `RQ-04` (mono, font-weight 600).
  - Title: Editable inline by EDITOR/OWNER (multiline auto-resizing textarea).
  - Close button (`Esc` key or click outside).
- **Five-Axis State Summary Strip**:
  - 5 horizontal pills displaying: Execution, Verification, Dependency, Timing, Attention.
- **Section 1: Conditions & Workstream**:
  - Workstream selector (e.g. `WS-02 Due Diligence`).
  - Accountable Lead / Internal Coordinator (`U-01 Coordinator`).
  - Description / Legal context note.
- **Section 2: Linked Operational Actions**:
  - List of child Actions (`AC-04`, `AC-05`, etc.) with execution badges and assigned contributors.
  - "Add Action" button (EDITOR/OWNER only).
- **Section 3: Evidence Requirements & Submitted Proof**:
  - Criteria definition (`ER-04 Material contracts schedule signed`).
  - Verification status badge (`UNVERIFIED` / `VERIFIED` / `NOT_REQUIRED`).
  - Link to Evidence Detail Drawer (SCR-07).
- **Section 4: Dependency Links**:
  - Upstream Prerequisites: list of incoming edges with condition flags (`execution: COMPLETED`, `verification: VERIFIED`).
  - Downstream Dependents: list of items blocked by this Requirement.
- **Footer Controls**:
  - If `COMPLETED` and user is OWNER: "Reopen Requirement" button (prompts for mandatory reason, resets verification to `UNVERIFIED` unless `NOT_REQUIRED`).
  - If open and user is OWNER: "Cancel Requirement" button (prompts for mandatory reason; does NOT satisfy dependencies).
  - Revision token: `rev: 4 (etag: a62d8387)` displayed in metadata font.

#### Unsaved Draft & Conflict Recovery
- If user edits description/title and attempts to navigate away, prompt native confirmation: "You have unsaved changes. Discard changes?"
- If server returns **HTTP 409 Conflict** on patch: Display conflict dialog showing "Your version" vs "Server version (committed by U-02 at 09:12)". Provide "Overwrite" (if permitted) or "Reload and discard my edits".

---

### 3.3 SCR-13: Scoped Event History Ledger

#### Input & Business Context
Every state transition, document promotion, evidence submission, and administrative action creates an immutable audit event (RULE-008, RULE-019). Normal users and admins CANNOT edit or delete history.

#### Authoritative Data Dependency
- Endpoint: `GET /api/v1/matters/{matterId}/events?limit=50&as_of={timestamp}`
- Schema: `{ event_id, recorded_at, actor: { id, email, role }, target_type, target_id, operation, changes: { field, old_value, new_value }, reason }`

#### Layout & Filter Controls
- Timeline list displaying events in reverse chronological order.
- Each event row displays:
  - Timestamp (ISO +07:00 formatted, e.g. `2026-06-15 08:45:12`).
  - Actor badge (`U-01 Coordinator (OWNER)`).
  - Operation label (`REQUIREMENT_EXECUTION_CHANGED`, `EVIDENCE_VERIFIED`, `REVISION_REOPENED`).
  - Diff view: `execution: IN_PROGRESS -> COMPLETED`.
  - Stated rationale / audit reason (e.g. "Board resolution passed unanimously in extraordinary session").
- Filter toolbar: Filter by entity ID, actor, or operation type.

---

## 4. Wave 2 Detailed Specification: Operational Grid, Actions & Dependencies

### 4.1 SCR-03: Operational Grid

#### Layout & Column Model
The Grid provides an exhaustive tabular view of all Requirements and Actions in the Matter.

| Column Header | Width | Data Field & Component | Behavior & Formatting |
|---|---|---|---|
| **Select** | 40px | Multi-select checkbox | Header checkbox selects all filtered rows. Indeterminate state supported. |
| **ID** | 80px | `RQ-xx` / `AC-xx` (Mono) | Click opens Drawer (SCR-04 or SCR-05). Visual icon indicates Requirement vs Action. |
| **Title & Scope** | Flex (min 240px) | Legal Title + Workstream chip | **Multiline auto-wrapping**. Never truncated. Inline editable by EDITOR/OWNER. |
| **Execution** | 120px | Badge (`NOT_STARTED`..`COMPLETED`) | Dropdown selector for EDITOR/OWNER. Transition guarded by business rules. |
| **Verification** | 130px | Badge (`UNVERIFIED`..`VERIFIED`) | Read-only in grid; click opens Evidence drawer. Shows designated verifier label. |
| **Dependency** | 100px | Badge (`READY` / `BLOCKED`) | Calculated by server. Hover displays upstream blocker count / causal reason. |
| **Due Date** | 110px | Date string + Timing badge | Displays date; flags `DUE_SOON` (orange) or `OVERDUE` (red). |
| **Owner / Assignee** | 120px | User avatar + name/alias | Action assignee or Requirement coordinator. Shows `Unassigned` warning if empty. |
| **Actions** | 60px | Quick action icon menu (`...`) | Quick links: Open Drawer, View Dependencies, View History. |

#### Density & Sizing Spec
- **Comfortable Row**: Minimum 44px height; text 14px body; padding 8px 12px.
- **Compact Row**: Minimum 36px height; text 14px body; padding 4px 12px.
- **Header**: Height 36px, background `#f6f8fa`, font 12px bold, uppercase tracking `0.05em`.

#### Keyboard Navigation Contract
- `Arrow Up` / `Arrow Down`: Move active row focus.
- `Enter` / `Space`: Open detail drawer for currently focused row.
- If focused on inline editable Title: `Enter` commits mutation; `Escape` cancels and restores prior text.
- `Tab` / `Shift+Tab`: Navigate between interactive controls within the active row; skips disabled controls.

---

### 4.2 SCR-05: Action Detail & Assignment Drawer

#### Input & Business Context
Actions represent discrete human work assignments (e.g., "AC-04 Retrieve Cedar Seller disclosure schedules", "AC-05 Request missing Tax Clearance Certificate"). They belong to a parent Requirement and may have external parties associated.

#### Authoritative Data Dependency
- Endpoint: `GET /api/v1/matters/{matterId}/actions/{actionId}`
- Mutation: `PATCH /api/v1/matters/{matterId}/actions/{actionId}` with optimistic locking.

#### Execution State Transitions & Invariants
- `NOT_STARTED -> IN_PROGRESS`: Requires `dependency: READY`. Actor commences work.
- `IN_PROGRESS -> WAITING`: Requires explicit `waiting_party` (e.g., `EP-01 Cedar Seller`), `waiting_condition` (text description), and `internal_owner` (`U-01 Coordinator`).
- `WAITING -> IN_PROGRESS` or `COMPLETED`: Condition resolved; clears waiting fields, records audit.
- `IN_PROGRESS -> COMPLETED`: Work finished. Does NOT verify parent Requirement!

---

### 4.3 SCR-06: Dependency Graph & Impact Inspector

#### Input & Business Context
Enforces RULE-003, RULE-004, and RULE-005. Prerequisite edges connect Requirements and Actions within a single Matter.

#### Edge Specification
- **Edge Types**:
  1. `Execution Gate`: Requires upstream `dependency: READY` and `execution: COMPLETED`.
  2. `Proof Gate`: Requires upstream `READY` + `COMPLETED` + `verification: VERIFIED` with valid proof.
- **Cycle Prevention**: The UI validates incoming/outgoing edges locally before sending; server re-evaluates the entire graph transactionally and rejects any cycle with **HTTP 422 Unprocessable Entity**.

---

## 5. Wave 3 Detailed Specification: Evidence, Verification & Document Versions

### 5.1 SCR-07: Evidence Submission & Verification Drawer

#### Submitter vs Designated Verifier Role Invariant (RULE-006, UX-N04)
- **Submitter**: Any Matter EDITOR or OWNER may upload/submit proof. The submitter's identity is recorded immutably.
- **Designated Verifier**: Only an EDITOR or OWNER who has been explicitly designated as a **Matter Verifier** AND is **NOT the submitter** can verify, reject, or resolve a dispute on submitted evidence.
- **Self-Verification Guard**: If the currently logged-in user is the submitter of the evidence, the "Accept / Verify" and "Reject" buttons are **permanently disabled** with the persistent helper note: *"Submitter cannot verify their own evidence. Independent verification by a designated verifier is required."*

---

### 5.2 SCR-08: Document Version & Signature History

#### Document Versioning & Authoritative Promotion (RULE-009)
- Uploading a new file version (e.g. `v4`) assigns it a draft status.
- **Authoritative Promotion**: Only Matter OWNER can mark a version as `Authoritative`. This action prompts for an impact summary: *"Promoting v4 will supersede v3. Criteria explicitly tied to current authoritative version will be invalidated."*

#### Signature Tracking (FR-010)
- Signatory tracking lists all required signatory parties (internal + external).
- Status per signatory: `PENDING`, `SIGNED`, `DECLINED`.
- A document version is `FULLY_SIGNED` only when 100% of required signatory slots are signed.

---

## 6. Wave 4 Detailed Specification: Regulatory Filing Lifecycle (SCR-09)

### 6.1 Regulatory Filing State Ladder (FR-016)

Filings follow a strict sequential lifecycle:
```
DRAFT -> PREPARED -> SUBMITTED -> RECEIVED -> APPROVED / REJECTED / WITHDRAWN
```

### 6.2 Regulatory Receipt vs Approval Invariant
- Marking a filing as `RECEIVED` records the authority's formal submission acknowledgment and receipt reference number.
- **A filing receipt is strictly NOT regulatory approval**. The filing remains in progress and cannot satisfy dependency gates requiring regulatory clearance until an explicit `APPROVED` event is recorded with attached authority approval order.

---

## 7. Wave 5 Detailed Specification: Executive Control Room (SCR-02)

### 7.1 Information Architecture & Reading Order (D-UX03)

The Control Room serves executive decision-makers. Visual and DOM reading order is strictly anchored:

1. **Top Priority Banner: Critical Blockers**:
   - Lists items with `attention: CRITICAL` or `dependency: BLOCKED` on the critical chain.
   - Shows condition -> root cause -> downstream impact -> accountable owner.
2. **Next Actions Queue**:
   - Shows actionable tasks (`NOT_STARTED` / `IN_PROGRESS` + `dependency: READY`).
   - **Canonical Atlas T0 Truthfulness**: At T0, displays the `EMPTY_EXPLAINED` card: *"0 candidate actions currently available. 2 actions are in progress waiting on evidence review; remaining actions are blocked by prerequisite dependencies."* No invented work.
3. **Dedicated Important Decisions Queue**:
   - Prominently positioned adjacent to Next Actions.
   - Lists open governance questions (e.g., `DEC-AT-01 Structure choice`, `DEC-AT-02 Filing timeline waiver`).
   - Displays required decision maker, impact, and unresolved risk link.
4. **Waiting On Queue**:
   - Actions in `execution: WAITING`.
   - Exposes: External party, waiting condition, days elapsed, and **accountable internal follow-up owner**.
5. **Milestone Readiness Summary**:
   - Milestones `MS-01`, `MS-02`, `MS-03`.
   - Shows satisfied / total prerequisite counts and specific unsatisfied blocker items. **Zero overall percentages**.
6. **Evidence Gaps**:
   - Mandatory criteria lacking valid accepted proof.
7. **Recent Changes & Audit Feed**:
   - Stream of latest state modifications.

---

## 8. Wave 6 Detailed Specification: Bulk, Import, Export & Delta Status Brief

### 8.1 SCR-10: Bulk Metadata Editor

- **Allowlist Policy (RULE-013)**: Bulk editing is strictly limited to:
  - `internal_owner`
  - `due_date`
  - `description` / operational note
- Bulk editing is **strictly forbidden** for: `type`, `execution state`, `verification status`, `dependency edges`, and `evidence criteria`.
- **Atomic Execution & Partial Results**: The server processes bulk updates record-by-record in a single transaction payload. If rows succeed while others fail (e.g., permission check or stale revision conflict), the UI displays:
  - Success badge: *"18 records updated successfully."*
  - Error table: *"2 records failed: RQ-10 (409 Conflict: modified concurrently), RQ-12 (403 Forbidden: insufficient role)."*
  - Failed rows retain their form state to allow immediate correction and retry.

### 8.2 SCR-11: Structured Import Wizard

- 3-Step Wizard:
  1. `Upload`: Accept `.csv` or `.xlsx` template.
  2. `Validate & Preview`: Server checks column schema, references, date formats, and evaluates the dependency graph for cycles.
  3. `Commit`: Transactional insert of validated records.
- **Import Invariant**: Imported verification labels are claims, never authoritative `VERIFIED`. All imported evidence is initialized to `UNVERIFIED` pending review.

### 8.3 SCR-12: Delta Status Brief Generator

- **Windowing Parameters**: Baseline timestamp $t_1$, As-of timestamp $t_2$ ($t_1 \le t_2$).
- **Output Structure**:
  - `Section A: Changes in (t1, t2]`: Chronological list of events that occurred strictly between $t_1$ and $t_2$.
  - `Section B: Outstanding Status at t2`: Complete active backlog of open blockers, waiting items, and unverified evidence as of $t_2$.
- **No-Change Truthfulness**: If zero events occurred in $(t_1, t_2]$, render explicit statement: *"No state changes recorded between baseline and as-of timestamps."*

---

## 9. Wave 7 Detailed Specification: Golden Workflows & E2E Integration

### 9.1 GW-01: Corporate Restructuring Readiness Review
- **Persona**: Lead Legal Counsel (Matter OWNER).
- **Flow**: Access Control Room -> inspect MS-01 Readiness -> drill down into RQ-04 DD gap -> review unverified contracts -> review outstanding DEC-AT-01 decision -> export executive brief.
- **Success Criteria**: Clear visibility that MS-01 is unready due to RQ-04 without misleading percentages.

### 9.2 GW-02: Pre-Closing Signature & Evidence Reconciliation
- **Persona**: Operations Contributor (Matter EDITOR).
- **Flow**: Filter Grid by `WS-03 Documents & Signatures` -> open DOC-03 -> inspect signature slots (1/2 signed) -> follow up on Elm Signatory (EP-02) -> attach signature evidence -> verifier accepts proof.
- **Success Criteria**: DOC-03 moves to fully signed; upstream dependency satisfies closing gate.

### 9.3 GW-03: Regulatory Filing Submission & Follow-Up
- **Persona**: Regulatory Specialist (Matter EDITOR).
- **Flow**: Access Filing Tracker (SCR-09) -> review FIL-02 -> upload filing receipt from Harbor Registry (EP-03) -> verify filing remains in `SUBMITTED / RECEIVED` state until final clearance decree is uploaded.
- **Success Criteria**: Strict observance that receipt != approval.
