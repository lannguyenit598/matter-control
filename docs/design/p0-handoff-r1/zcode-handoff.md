# MatterControl Phased ZCode Handoff — MC-P0-DESIGN-R1

## 1. Handoff Scope, Boundaries & Engineering Role

- **Recipient / Implementer**: ZCode (Product Backend + Frontend Engineering Owner)
- **Coordinator**: Local Codex
- **Source Governance**: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`
- **Branch**: `codex/unified-project-flow` (Head: `a62d838791ba188838c4ff00b7b6e265ac775056`)
- **Engineering Target**: Phased implementation of all 20 P0 capabilities (`FR-001..FR-020`) and 3 Golden Workflows across 7 waves (`P0-W1` through `P0-W7`).
- **Boundaries**:
  - No guessed backend APIs or unauthorized schema changes.
  - No direct activation of unreviewed production code; each wave requires an activation record with prerequisite gate receipts.
  - Frontend follows Atomic Design + Feature-sliced architecture (`components/atoms`, `components/molecules`, `components/organisms`, `features/*`).

---

## 2. Component Inventory & Atomic Reuse Strategy

The table below catalogs every component required across the waves, specifying whether to reuse an existing atomic pattern or construct a new feature-level component.

| Component Identifier | Atomic Classification | Destination Path | Primary Wave | Variants & States | Tokens Used |
|---|---|---|---|---|---|
| `StateBadge` | Molecule | `components/molecules/StateBadge.tsx` | W1 | `axis`: `execution`, `verification`, `dependency`, `timing`, `attention`<br>`state`: all enum values<br>`size`: `sm`, `md` | `--execution`, `--verification`, `--dependency-ready`, `--dependency-blocked`, `--timing`, `--attention` |
| `AppShell` | Organism | `components/organisms/AppShell.tsx` | W1 | `default`, `loading`, `error`, `session-expired` | `--header`, `--header-text`, `--surface`, `--background` |
| `WorkspaceMatterSwitcher` | Molecule | `components/molecules/WorkspaceMatterSwitcher.tsx` | W1 | `collapsed`, `open`, `search-active`, `loading` | `--header`, `--surface`, `--ink`, `--focus` |
| `DetailDrawer` | Organism | `components/organisms/DetailDrawer.tsx` | W1 | `width`: `480px` (desktop), `100vw` (mobile)<br>`state`: `open`, `closing`, `dirty-unsaved` | `--surface`, `--ink`, `--line`, `--focus` |
| `EventTimeline` | Organism | `features/history/EventTimeline.tsx` | W1 | `default`, `filtered`, `loading`, `empty` | `--surface`, `--line`, `--muted`, `--ink` |
| `OperationalGrid` | Organism | `features/grid/OperationalGrid.tsx` | W2 | `density`: `comfortable` (min 44px), `compact` (min 36px)<br>`selection`: `none`, `partial`, `all-filtered` | `--surface`, `--line`, `--selected`, `--ink`, `--focus` |
| `GridRow` | Molecule | `features/grid/GridRow.tsx` | W2 | `state`: `default`, `hover`, `selected`, `focused`, `editing` | `--surface`, `--selected`, `--focus`, `--ink` |
| `InlineTitleEditor` | Molecule | `features/grid/InlineTitleEditor.tsx` | W2 | `state`: `resting`, `editing`, `submitting`, `error-local` | `--surface`, `--ink`, `--focus`, `--error` |
| `DependencyRail` | Molecule | `features/dependencies/DependencyRail.tsx` | W2 | `direction`: `upstream`, `downstream`<br>`type`: `execution`, `proof-gate` | `--dependency-ready`, `--dependency-blocked`, `--line` |
| `NextActionQueue` | Organism | `features/control-room/NextActionQueue.tsx` | W5 | `state`: `populated`, `empty-explained` (T0 special case) | `--surface`, `--ink`, `--muted`, `--focus` |
| `ImportantDecisionCard` | Molecule | `features/control-room/ImportantDecisionCard.tsx` | W5 | `status`: `OPEN`, `RESOLVED`<br>`urgency`: `high`, `normal` | `--surface`, `--attention`, `--ink`, `--line` |
| `MilestoneProgressBar` | Molecule | `features/control-room/MilestoneProgressBar.tsx` | W5 | `state`: `unassessed`, `active`, `ready`<br>**Zero percentage representation** | `--surface`, `--execution`, `--verification`, `--line` |
| `EvidenceVerificationCard` | Organism | `features/evidence/EvidenceVerificationCard.tsx` | W3 | `role`: `submitter`, `designated-verifier`, `other`<br>`state`: `unreviewed`, `accepted`, `disputed` | `--surface`, `--verification`, `--disabled`, `--error` |
| `DocumentVersionStack` | Organism | `features/documents/DocumentVersionStack.tsx` | W3 | `status`: `draft`, `authoritative`, `superseded` | `--surface`, `--line`, `--ink`, `--focus` |
| `FilingStageStepper` | Molecule | `features/filings/FilingStageStepper.tsx` | W4 | `currentStage`: `DRAFT`..`APPROVED`<br>`state`: `in-progress`, `rejected` | `--surface`, `--execution`, `--timing`, `--error` |
| `BulkEditModal` | Organism | `features/grid/BulkEditModal.tsx` | W6 | `state`: `editing`, `previewing`, `submitting`, `partial-result` | `--surface`, `--line`, `--ink`, `--error`, `--focus` |
| `ImportWizard` | Organism | `features/import/ImportWizard.tsx` | W6 | `step`: `1-upload`, `2-preview`, `3-commit`<br>`validation`: `clean`, `errors`, `cycles` | `--surface`, `--line`, `--focus`, `--error` |
| `DeltaBriefViewer` | Organism | `features/briefs/DeltaBriefViewer.tsx` | W6 | `mode`: `preview`, `print`, `exporting` | `--surface`, `--ink`, `--line`, `--muted` |

---

## 3. Wave-by-Wave Engineering Intake Specifications

### Wave 1 (P0-W1): App Shell, Session, Core Requirements & Audit History

#### Components to Implement
- `components/organisms/AppShell.tsx`
- `components/molecules/WorkspaceMatterSwitcher.tsx`
- `components/molecules/StateBadge.tsx`
- `features/requirements/RequirementCreateModal.tsx`
- `features/requirements/RequirementDetailDrawer.tsx`
- `features/history/EventTimeline.tsx`

#### Interaction & Token Acceptance Criteria
1. **Context & Tenancy**: Navigating to `/{wsId}/{matterId}` validates active membership. Inaccessible matters return 404 (indistinguishable from non-existent). No matter title leaks in document title or error body.
2. **State Representation**: `StateBadge` accepts an explicit `axis` prop. It must render with text label AND color token. Hovering displays the axis and reason string.
3. **Requirement Lifecycle**: Creating a Requirement defaults execution to `NOT_STARTED`, verification to `UNVERIFIED`, dependency to `READY` (if no edges). Reopening requires OWNER role and a non-empty audit rationale.
4. **Audit History**: All mutations trigger an append-only event in `EventTimeline`. Events cannot be edited or deleted through UI or client API.

#### Questions for Backend Implementer (ZCode BE)
- *Session Contract*: What header or cookie mechanism carries the active workspace session token?
- *Optimistic Locking*: Does the `PATCH /requirements/{id}` endpoint accept standard `If-Match: "{revision_number}"` headers?
- *Audit Query*: Can `/api/v1/matters/{id}/events` stream updates via Server-Sent Events (SSE) or polling?

---

### Wave 2 (P0-W2): Operational Grid, Actions, Next Actions & Dependencies

#### Components to Implement
- `features/grid/OperationalGrid.tsx`
- `features/grid/GridRow.tsx`
- `features/grid/InlineTitleEditor.tsx`
- `features/actions/ActionDetailDrawer.tsx`
- `features/dependencies/DependencyGraphView.tsx`
- `features/dependencies/DependencyRail.tsx`

#### Interaction & Token Acceptance Criteria
1. **Grid Density Switch**: Toggle switches between `comfortable` (min 44px) and `compact` (min 36px) without altering font size. Multiline rows wrap naturally without truncation.
2. **Keyboard Navigation**: `ArrowUp`/`ArrowDown` navigates rows. `Enter` opens drawer or commits inline edit. `Escape` cancels inline edit without dirtying state.
3. **Action Execution State**: Marking an action `WAITING` forces input of `waiting_party`, `waiting_condition`, and an internal owner.
4. **Dependency Cycles**: Client graph editor checks for cycles using topological sort. Server must independently validate and reject cycles with 422.

#### Questions for Backend Implementer (ZCode BE)
- *Grid Virtualization*: Does the backend support keyset pagination (`cursor`) for the grid query, or limit/offset?
- *Batch Edge Evaluation*: Is there an endpoint `POST /dependencies/evaluate` that dry-runs graph changes and returns affected blocker paths?

---

### Wave 3 (P0-W3): Evidence Requirements, Verification & Document Versions

#### Components to Implement
- `features/evidence/EvidenceRequirementList.tsx`
- `features/evidence/EvidenceSubmissionModal.tsx`
- `features/evidence/EvidenceVerificationCard.tsx`
- `features/documents/DocumentVersionStack.tsx`
- `features/documents/SignatoryTrackingTable.tsx`

#### Interaction & Token Acceptance Criteria
1. **Self-Verification Guard**: UI inspects `current_user.id == evidence.submitted_by`. If true, `Verify` button is disabled with disabled token `--disabled` and tooltip: *"Submitters cannot verify their own evidence."*
2. **Authoritative Promotion**: Only users with `matter_role == 'OWNER'` see the "Promote to Authoritative" control for document versions. Promotion prompts for impact summary.
3. **Dispute State**: Any EDITOR/OWNER can record a dispute on accepted proof, immediately flipping verification status to `DISPUTED` and downstream dependencies to `BLOCKED`.

#### Questions for Backend Implementer (ZCode BE)
- *Object Storage*: Does the file upload use presigned S3/GCS PUT URLs, or does the Go backend stream the payload?
- *Checksum Verification*: Does the backend calculate and store SHA-256 hashes on upload to verify file integrity?

---

### Wave 4 (P0-W4): Regulatory Filing Lifecycle & Packaging

#### Components to Implement
- `features/filings/RegulatoryFilingList.tsx`
- `features/filings/FilingDetailDrawer.tsx`
- `features/filings/FilingStageStepper.tsx`
- `features/filings/SubmissionPackageModal.tsx`

#### Interaction & Token Acceptance Criteria
1. **Stage Ladder Enforced**: Filing cannot jump directly from `DRAFT` to `SUBMITTED`. It must move through `PREPARED`.
2. **Receipt vs Approval**: Uploading a submission receipt transitions stage to `RECEIVED`. The UI explicitly displays warning: *"Filing receipt acknowledged. Final authority approval remains pending."*

#### Questions for Backend Implementer (ZCode BE)
- *Filing Package Assembly*: Does the backend zip/tar linked evidence files into an immutable submission package artifact?

---

### Wave 5 (P0-W5): Executive Control Room & Decision Queue

#### Components to Implement
- `features/control-room/ExecutiveControlRoom.tsx`
- `features/control-room/NextActionQueue.tsx`
- `features/control-room/ImportantDecisionCard.tsx`
- `features/control-room/WaitingOnList.tsx`
- `features/control-room/MilestoneSummary.tsx`

#### Interaction & Token Acceptance Criteria
1. **Canonical T0 Empty State**: At Atlas T0, `NextActionQueue` displays the `EMPTY_EXPLAINED` card stating 0 actions are ready, 2 in progress waiting on proof, remaining blocked. No fake actions shown.
2. **Important Decisions Queue**: Positioned directly alongside Next Actions. Open questions (`DEC-AT-01`, `DEC-AT-02`) display assigned decision-maker and urgency.
3. **Milestone Representation**: Milestones display satisfied/total counts (e.g. `4/6 Prerequisites Satisfied`) and blocker badges. **Zero percentage meters**.

#### Questions for Backend Implementer (ZCode BE)
- *Control Room Aggregator*: Is there a consolidated endpoint `GET /matters/{id}/dashboard` returning blockers, next actions, decisions, and milestones in a single roundtrip?

---

### Wave 6 (P0-W6): Bulk Edit, Import, Scoped Export & Delta Brief

#### Components to Implement
- `features/grid/BulkEditModal.tsx`
- `features/import/ImportWizard.tsx`
- `features/export/ExcelExportButton.tsx`
- `features/briefs/DeltaBriefViewer.tsx`

#### Interaction & Token Acceptance Criteria
1. **Bulk Allowlist Enforced**: Bulk modal only renders inputs for `internal_owner`, `due_date`, and `operational_note`. State, type, and criteria fields are unavailable.
2. **Per-Row Atomic Results**: Bulk submission renders a results dialog showing exact counts of successes and failures with per-row retry options.
3. **Excel Export Security**: Form strings starting with `=`, `+`, `-`, `@` are prepended with a single quote `'` to neutralize formula execution.
4. **Delta Status Brief**: Evaluates changes strictly within $(t_1, t_2]$ and backlog at $t_2$.

#### Questions for Backend Implementer (ZCode BE)
- *Export Generation*: Is Excel generation handled via a Go stream (`excelize`) or client-side?
- *Delta Computation*: What endpoint computes the event log diff between two timestamps?

---

### Wave 7 (P0-W7): Golden Workflows & E2E Validation

#### Focus & Deliverable
- End-to-end integration and automated Playwright / Cypress scenarios covering:
  - `GW-01`: Restructuring Readiness Review (`AC-161`)
  - `GW-02`: Pre-Closing Reconciliation (`AC-162`)
  - `GW-03`: Regulatory Filing Flow (`AC-163`)
