# MatterControl creation-flow proposal R1

## Review identity and boundary

- Task: first-time creation flow review for Workspace → Matter → Requirement/Action → proof/documents/filing.
- Reviewer: Local Codex product-manager subagent, reconciled with the Local Codex business-analyst subagent.
- Repository / branch / inspected HEAD: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` / `codex/unified-project-flow` / `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`.
- Method: static source and approved-requirement review only. No browser, rendered UI, human study, runtime, API call, source edit, contract edit or policy change was performed.
- Status of observations: the current route/form behavior below is `CONFIRMED_FROM_SOURCE`; usability effects are reasoned product findings, not observed user-test results. AC-137 remains `NOT_RUN`.

## Product recommendation

Ship a **resumable, contextual creation path**, not an atomic setup wizard:

1. Create a Workspace.
2. Create the first Matter; inviting people stays optional until assignment is needed.
3. On the Matter, choose one goal in plain language:
   - **Requirement — record what must be true.** Example: “Board approval obtained.”
   - **Action — record work someone performs.** Example: “Prepare board resolutions.”
4. After confirmed creation, continue on the canonical operational detail screen, where ownership, dates, dependencies and proof can be added when relevant.
5. Add a document or filing through prerequisite-aware entry points; never present an empty identifier selector as the next step.

Every step remains an independent, auditable command. Partial progress is valid and resumable. The UI must not imply that completing an Action verifies a Requirement, that uploading a document makes it current, or that recording a Filing means MatterControl submitted anything.

## Why the current flow is difficult

| Current source-backed behavior | User consequence | Evidence |
| --- | --- | --- |
| The Workspace list always competes with a sticky creation form, while its empty state has no action. | The first-time user must infer that the separate right-hand form resolves the empty state. | `apps/frontend/src/app/(app)/workspaces/page.tsx:46-65`; `apps/frontend/src/features/workspaces/components/workspace-list.tsx` |
| Workspace detail lists Matters, then shows New Matter, then member administration. The empty Matter state explains access but does not lead an OWNER to creation. | The user can mistake team setup for a prerequisite to first value. | `apps/frontend/src/app/(app)/workspaces/[workspaceId]/page.tsx:65-90`; `apps/frontend/src/features/matters/components/matter-list.tsx` |
| Matter Overview opens with an embedded Requirement form, followed by members and history. | It silently recommends one domain type without explaining Requirement versus Action and gives no operational “start here” summary. | `apps/frontend/src/app/(app)/matters/[matterId]/page.tsx:55-89` |
| Work shows filters and a dense grid before two full forms side by side at the bottom. | New users meet advanced list controls before understanding which record to create; smaller viewports may place the resolution far below the empty state. | `apps/frontend/src/app/(app)/matters/[matterId]/work/page.tsx:107-168`; `apps/frontend/src/features/work/components/work-grid.tsx` |
| Requirement creation redirects to `/requirements/{id}`, a reduced detail with only “Back to matter”; Action creation redirects to the rich canonical work-item detail. | The same work model produces inconsistent destinations, and a newly created Requirement lands at a dead end without owner/due/proof controls. | `apps/frontend/src/features/requirements/components/create-requirement-form.tsx:14-28`; `apps/frontend/src/app/(app)/requirements/[requirementId]/page.tsx:24-43`; `apps/frontend/src/features/work/components/create-action-form.tsx:15-30` |
| New Document creates metadata but has no success navigation; file upload exists only on document detail and upload does not make a version current. | “Saved” leaves the user on the list and makes the intended next step—upload a version—discoverability work. | `apps/frontend/src/features/proof/components/document-forms.tsx:20-38,46-50,113-121`; `apps/frontend/src/app/(app)/matters/[matterId]/documents/page.tsx:63-93` |
| New Filing is rendered even with zero Requirements or authority Parties, although both fields are required. | The form becomes an unavoidable dead end with empty selects and only a textual hint pointing to Planning. | `apps/frontend/src/app/(app)/matters/[matterId]/filings/page.tsx:74-117`; `apps/frontend/src/features/filings/components/filing-forms.tsx:14-116` |
| Eight Matter tabs have equal visual priority. | A first-time user must understand the full information architecture before completing the basic creation path. | `apps/frontend/src/features/matters/components/matter-tabs.tsx:6-15,25-58` |

## Target journey

### 1. Empty Workspaces

**Screen:** Workspaces.

- Empty-state title: **Create your first workspace**.
- Supporting copy: “A workspace groups a legal team’s Matters. You can invite people later.”
- Primary action: **Create workspace**; focus or reveal the existing one-field form.
- Required field: Workspace name only.
- Do not expose the Workspace ID or ask for members during this command.
- After confirmed success: navigate to the Workspace and show the next action **Create first Matter**. “Invite people” is secondary.

### 2. Workspace with no accessible Matters

**Screen:** Workspace detail.

- OWNER empty state: “Start with a Matter” and primary **Create Matter**.
- Non-owner empty state: explain that explicit Matter membership is required; do not show a create action.
- Required field: Matter title only.
- After confirmed success: navigate to Matter Overview and show a short “Start this Matter” panel.
- Member administration remains available, but below the first-value path and labelled optional until assignment is needed.

### 3. Start this Matter

**Screens:** Matter Overview and Work, using the same shared creation component.

- Above-the-fold primary action: **Create work**.
- Before showing a form, present two choices with examples:
  - **Requirement** — “A condition or result that must be true.” Example: “Board approval obtained.”
  - **Action** — “Work someone performs.” Example: “Prepare board resolutions.”
- Show only one full form at a time. Do not merge the two types or infer a dependency.
- Keep both form instances mounted so drafts, pending state and a frozen `OUTCOME_UNKNOWN` intent are not discarded when a panel closes. The inactive form must be hidden/inert, excluded from sequential focus and the accessibility tree, and use control/label IDs distinct from the active form; two forms must not be announced at once.
- Required fields remain unchanged:
  - Requirement: title + intended outcome.
  - Action: title + expected outcome.
- Defer owner, due date, workstream, dependencies, verifier and proof criteria until after creation. Do not ask users to edit derived state axes.
- Add `draftKey` coverage to Requirement creation, matching the existing Action behavior; scope it by session/user and Matter.
- After either command is confirmed: navigate to `/matters/{matterId}/work/{id}`. The legacy Requirement detail may remain as a compatibility route, but it is not the creation destination.

### 4. Canonical work-item next steps

**Screen:** Work-item detail.

- Preserve the type label and five independent state axes.
- A compact “Next steps” area should derive actions from facts and permissions, not mutate state automatically:
  - Assign an owner, set a due date or workstream when needed.
  - Add prerequisites when the work really depends on another record.
  - If proof is required, define what would count before offering evidence.
  - Create or open a document when the evidence is a file.
- Requirement and Action remain independent records. No copy may say that completing an Action completes or verifies a Requirement.
- An assignee must already be an active Matter member; assigning never grants access.

### 5. Documents and proof

**Screen:** Documents, then document detail; proof remains on the relevant work-item detail.

- Empty-state primary action: **Create document**.
- Required field: document name only.
- After confirmed creation: navigate directly to the new document detail with primary **Upload first version**.
- After upload, state explicitly: “Version uploaded; it is not current yet.” OWNER promotion remains a separate, reasoned action that preserves version history.
- If a user enters Documents from a proof checklist, carry a safe internal return link back to that work item; never rely on a visible UUID as navigation copy.
- Evidence offer and independent assessment remain separate. Supplying evidence cannot set verification by itself.

### 6. Filings

**Screen:** Filings.

Before rendering New Filing, evaluate prerequisites already loaded by the page:

- No Requirement: show **Create a Requirement first**, linking to the shared create-work panel with Requirement selected.
- No authority Party: show **Add authority under Planning**.
- Both exist: render the form with readable labels, never raw IDs.

When a user follows a missing-prerequisite action, preserve already-entered safe Filing draft values for the same user and Matter so the user can resume after returning. Access loss still purges that draft and related selection state.

Required create fields remain title, outcome sought, linked Requirement, authority Party and proof-required choice. Filing owner remains optional at creation, with clear copy that it becomes required before package preparation. After confirmed creation, navigate to Filing detail and show only the next stages allowed by server facts. MatterControl records stages; it does not file with an authority.

## Navigation and information hierarchy

### Ship now

- Add contextual creation actions inside empty states instead of relying on a distant form.
- Add one shared Create work panel to Matter Overview and Work.
- Put a visible Create work action above Work filters/grid.
- Use names in breadcrumbs, rows and selects. Technical IDs may stay in URLs and request payloads but must not be the label users act on.
- Keep Matter membership optional in the initial path; surface people management when the user assigns an owner or verifier.

### Next design iteration

- Keep the existing routes, but visually separate primary sections (Overview, Work, Documents, Filings) from advanced administration/audit sections (Control Room, Planning, Data, History). This is an information-architecture change and requires rendered keyboard/mobile review before adoption.
- Add contextual breadcrumbs that display Workspace and Matter names. Do not replace URL keys or weaken access checks.

## Command, error and resume behavior

The current shared `IntentForm` correctly models one form as one intent and distinguishes receipted retries from CAS rereads (`apps/frontend/src/components/organisms/intent-form.tsx:18-48,66-118,122-136`). The redesigned presentation must preserve it:

- Pending disables duplicate submission.
- Field validation keeps entered values and focuses/summarizes actionable errors.
- A stale CAS response preserves the form and offers **Reload current state**; it does not silently replay the mutation.
- Network/503 keeps the protected draft.
- `OUTCOME_UNKNOWN` says “We could not confirm whether this was created.” Use the command's available receipt/reconciliation path; a generic list read is not assumed to identify the result. If no conclusive result exists, only retry the exact frozen payload with the same idempotency key.
- Do not navigate to a success destination until creation is confirmed or a same-key replay confirms it.
- Access loss purges protected Requirement and Action state for that user and Matter, including drafts, selections, pending previews and any frozen intent; later re-grant starts clean and cannot resurrect them.
- Switching Requirement/Action panels must not erase a draft, pending attempt or unknown-outcome recovery.

## Delivery sequence

### Slice 1 — coherent first-value path (ship now)

1. Build the shared Requirement/Action choice panel with one visible form and both forms mounted.
2. Use it on Matter Overview and Work; add an above-grid Create work anchor.
3. Change Requirement success navigation to the canonical Matter work-item route.
4. Add Requirement draft persistence with the existing access-loss purge behavior.
5. Update empty-state copy/actions for Workspace and Matter; keep invites secondary.

This slice changes presentation, navigation and existing client-state handling (Requirement draft persistence and access-loss purge). It adds no endpoint, API contract, command, transaction or business rule.

### Slice 2 — remove document and Filing dead ends

1. Navigate confirmed Document creation to document detail/upload.
2. Add safe internal return context from proof to Documents and back.
3. Replace unfulfillable Filing forms with prerequisite empty states.
4. Navigate confirmed Filing creation to Filing detail.

### Slice 3 — navigation polish and validation

1. Group primary versus advanced Matter navigation without changing routes.
2. Verify responsive layout, keyboard order, focus placement, screen-reader names and bilingual copy.
3. Run a human formative test; do not infer it from unit tests or source inspection.

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| CF-01 | From an empty Workspaces screen, an authorized user can create a Workspace, create a Matter and reach the Create work choice without opening member administration or copying an ID. |
| CF-02 | Requirement and Action are explained before either form. In the approved formative protocol, at least 4 of 5 representative managers correctly choose the type for both unseen examples within 10 seconds; until executed this remains `NOT_RUN` under AC-137. |
| CF-03 | Only one full create-work form is visible and exposed to keyboard/assistive technology. The inactive form stays mounted but hidden/inert with unique control IDs; switching type preserves each form’s draft, pending and unknown-outcome state. |
| CF-04 | Confirmed Requirement and Action creation both open `/matters/{matterId}/work/{id}`. The created title, type and outcome are readable without exposing the identifier as a label. |
| CF-05 | Workspace OWNER is the only role offered Matter creation. Matter OWNER/EDITOR are offered Requirement/Action creation; VIEWER is not. API authorization remains authoritative. |
| CF-06 | Creation asks only the approved required fields. Owner, due, workstream, dependencies, proof configuration and Filing stages are progressively disclosed after creation. |
| CF-07 | An unknown outcome never shows success or creates a new intent automatically. Same-key retry sends the frozen payload; CAS-only recovery rereads first. |
| CF-08 | Validation, stale state and service failure preserve permitted inputs; access loss purges both Requirement and Action protected state for the user+Matter scope, including drafts, selections, pending previews and frozen intents, and re-grant does not restore them. |
| CF-09 | Confirmed Document creation opens document detail. Upload is shown as a separate operation and never claims the version is current. |
| CF-10 | New Filing is unavailable with an actionable explanation when no Requirement or authority Party exists; when available, all select options show readable names. |
| CF-11 | Completing an Action never changes Requirement completion/verification by implication; offering evidence never verifies it; Filing receipt never reads as approval. |
| CF-12 | The first-value path is operable by keyboard, has deterministic focus after reveal/success/error, and has equivalent English/Vietnamese labels. Rendered accessibility evidence is required before PASS. |

## Scope boundary and decisions

### Safe presentation changes already within approved semantics

- Progressive disclosure; wording, examples and CTA hierarchy.
- Empty-state actions and next-action cards.
- Canonical Requirement success navigation to the existing rich work-item route.
- Readable names in controls and breadcrumbs while retaining technical route keys.
- Hiding create affordances when the caller’s known Matter/Workspace role cannot create; backend remains authoritative.
- Filing prerequisite empty states.
- Same-issuer local/dev account search already separately approved by the PO; this proposal does not expand its scope or make an invitation mandatory.

### Require PO/API decision before implementation

- Any atomic multi-record Workspace→Matter→work wizard.
- Inline creation of a Requirement or Party from the Filing command.
- Workflow templates, default generated records or a policy that Requirement must be created first.
- Automatic owner, verifier, proof criterion or dependency assignment.
- Changing any required field or the default proof policy.
- Product-wide directory/organization policy beyond the separately approved local/dev same-issuer lookup.

## Risks and mitigations

- **Hidden intent loss:** conditional rendering can unmount a form. Mitigation: keep both type forms mounted and test pending/draft/unknown switching.
- **Wizard illusion:** visual continuity can imply one transaction. Mitigation: show confirmed checkpoints and independent resume links after each command.
- **Permission leakage:** an empty state can reveal an unavailable action. Mitigation: use caller role only for affordance; let the API authorize; preserve hidden/not-found semantics.
- **Domain collapse:** friendly language can imply coupled states. Mitigation: retain explicit Requirement/Action definitions and the independent execution, verification, dependency, timing and attention axes.
- **Unproven UX:** source-correct presentation is not usability evidence. Mitigation: keep browser/accessibility/AC-137 outcomes `NOT_RUN` until independently executed.

## Proposed next status

`READY_FOR_IMPLEMENTATION` for Slice 1 as a UI-only change, followed by author tests and an independent rendered/accessibility review. Slices 2–3 remain `READY` only after Slice 1 source behavior is stable.

Skipped: browser/rendered inspection, user study, runtime/API verification, implementation and contract changes.

Remaining risk: the proposal is source-backed but its usability and accessibility outcomes remain unverified until rendered and human evidence exists.
