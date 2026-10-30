# MatterControl Action-Entry UX Product Brief

**Date:** 2026-10-29  
**Owner:** Product Manager  
**Consumer:** Product Design, then the single assigned frontend writer  
**Status:** READY_FOR_DESIGN_AND_IMPLEMENTATION_AFTER_CURRENT_PICKER_FIX  
**Evidence mode:** source inspection only; rendered/browser validation was not available because the local frontend and API were not listening.

## 1. Product direction and recommendation

MatterControl is a system for reading the current truth before changing it. Every list, overview, and detail screen must therefore open in **browse mode**, not edit mode.

Use this action-entry rule throughout P0:

1. Show current state, explanation, and next decision first.
2. Put one clear primary action in the page or section header.
3. Do not render create/edit fields until the user explicitly invokes that action.
4. Use a focused dialog for short, reversible-in-UI commands; use a dedicated route for multi-step, high-consequence, file-based, or reconciliation-sensitive work.
5. Empty states repeat the same action button; they do not expose a permanent form.
6. Hide actions the caller cannot perform. Do not replace them with disabled controls that imply a request might succeed.

This is a presentation and flow correction. It must not collapse Requirement into Action, infer verification from completion, or change any permission or workflow rule.

## 2. User problem and root cause

The current screens mix reading with authoring. Forms occupy large cards before a user has decided to act, make long pages harder to scan, and give every possible operation the same visual weight. This is especially disruptive in a legal control plane, where the user first needs to understand state, provenance, dependencies, and risk.

Source inspection found three recurring causes:

- **Authoring components are mounted directly by route-level views.** Examples include work creation on both Matter overview and Work, and create forms at the bottom of Planning, Documents, Filings, and Control Room.
- **State transitions are presented as permanent forms.** Work-item status, metadata, dependencies, proof operations, filing advances, and owner-only corrections visually compete with the record itself.
- **Disclosure is being used as an editor shell.** Native `details` hides some fields but leaves the page organized around editing rather than the user's decision and does not establish a consistent action hierarchy.

The result is not primarily a styling defect. It is an information hierarchy and action-entry defect.

## 3. Preserve completed improvements

Do not redo or regress these current patterns while this brief is implemented:

| Surface | Current disposition | Preserve |
|---|---|---|
| Workspace list | `CreateWorkspaceForm` is a `FormDialog` action | One header action, focused title-only dialog, stable draft/idempotency behavior |
| Workspace detail | Create Matter and Add Member are dialog actions | Workspace context, permission gating, searchable person picker |
| Matter membership | Add to Matter is a dialog action | Eligible-person semantics and access-loss purge |
| Matter creation | `CreateMatterForm` is a dialog action | Owner explanation, no automatic members, post-create navigation |
| Shared command dialogs | `FormDialog` keeps content mounted | Pending and `OUTCOME_UNKNOWN` attempts remain inspectable after close/reopen |

The current picker UXR-01/UXR-02 correction has its own writer and must finish before another writer edits those shared picker paths.

## 4. Screen and action inventory

### P0 — remove permanent create forms from browse screens

| Surface and source | Current behavior | Required entry pattern | Product rationale |
|---|---|---|---|
| Matter overview: `app/(app)/matters/[matterId]/page.tsx:88-97` | Full `WorkCreationPanel` is always present for editors | One **Add work** action in the page header. Its compact action menu offers **Add action** and **Add requirement**; each opens its own focused dialog. Remove the duplicate body panel. | Overview should answer “what is this Matter and what changed?”, not start in data-entry mode. |
| Work list: `app/(app)/matters/[matterId]/work/page.tsx:106-125` and `features/work/components/work-creation-panel.tsx:18-91` | Header link jumps to a large two-form disclosure panel | Use the same **Add work** action menu and dialogs as Matter overview. No `#create-work` panel. | One reusable entry point prevents two competing creation experiences. |
| Planning: `features/work/components/planning-view.tsx:104-126,178-192,220-234` | Create Milestone, External Party, and Workstream forms sit below their lists; Edit Party expands inside a row | Section-header buttons: **Add milestone**, **Add external party**, **Add workstream**. Open short forms in dialogs. Row **Edit** opens a dialog. “Change required Requirements” opens a focused large dialog; if the list exceeds the agreed bounded picker capacity, promote it to a dedicated route rather than an unbounded modal. | Planning is three readable collections, not a stack of forms. Section-local actions are easier to understand than one generic page-level Create button. |
| Documents list: `app/(app)/matters/[matterId]/documents/page.tsx:61-90` | A permanent New Document card follows the list | Put **New document** in the list/page header and open the title-only form in a dialog. Empty state uses the same button. | A one-field command is appropriate for a dialog and should not consume permanent page space. |
| Filings list: `app/(app)/matters/[matterId]/filings/page.tsx:72-116` | A permanent New Filing card follows the list | Header button **New filing** navigates to `/matters/{matterId}/filings/new`. The route shows scope, authority, served Requirement, accountable person, and submission details as one focused flow. | Filing creation connects multiple legal records and is high consequence; it needs room, reload safety, and a stable URL, not a long modal. |
| Control Room: `app/(app)/matters/[matterId]/control-room/page.tsx:87-130` | Add Context Record form is permanently visible below records | Card-header **Add context record** opens a dialog. Per-row Close/Reopen remains a row action; a required close reason opens a small dialog. | Context notes should remain readable. A form is secondary to the operational record. |

### P1 — convert permanent edit/transition forms on detail screens

| Surface and source | Current behavior | Required entry pattern | Product rationale |
|---|---|---|---|
| Work-item detail: `app/(app)/matters/[matterId]/work/[itemId]/page.tsx:221-340` | Change Status, Proof, Dependencies, Details, and Escalation cards expose controls in the main reading flow | Page actions: **Change status** (dialog) and **Edit details** (dialog). Each card shows state first and places a contextual action in its header. Add/remove prerequisite uses a large dialog or side panel. Escalation uses a reason dialog/confirmation. Proof operations remain inside Proof but appear only after selecting the named action. | The detail page must support rapid comprehension of the five independent state axes before mutation. |
| Document detail: `app/(app)/matters/[matterId]/documents/[documentId]/page.tsx:145-174` | Promotion impact form and Upload New Version form appear as cards | Header **Upload version** opens a keep-mounted dialog. Selecting a version exposes **Make current**, then opens an impact confirmation dialog. | Upload and promotion are different intents. The impact preview must remain visible before confirmation without presenting a permanent form. |
| Filing detail: `app/(app)/matters/[matterId]/filings/[filingId]/page.tsx:113-223` | Every permitted transition becomes a full card/form | Show one state-aware primary action, **Record next step**. Use an **Other actions** menu for negative outcome, signature applicability, close/reopen, and correction. Navigate to a dedicated action subroute for multi-field/evidence steps; use confirmation dialogs only for genuinely short toggles. | Legal transitions need explicit intent, stable reload behavior, and reduced accidental action. All possible transitions should not compete visually. |
| Proof panel: `features/proof/components/proof-panel.tsx:301-368,375-445` | Verifier designation and several reason/assessment forms are embedded or opened with `details` | Show verifier list and current assessment first. **Designate verifier**, **Review evidence**, **Withdraw**, and **Add criterion** are explicit contextual actions opening focused dialogs. | Proof decisions are role- and epoch-sensitive. The UI must make the decision being recorded unmistakable. |

### Preserve as dedicated tools, but improve entry

| Surface and source | Current behavior | Decision |
|---|---|---|
| Data: `features/data-transfer/components/data-transfer-panel.tsx:18-48`, `bulk-section.tsx:193+`, `import-section.tsx:129+` | Bulk Edit and Import are fully expanded together | Keep Data as a dedicated area, but make its landing state an operation chooser: **Bulk edit**, **Import file**, **Export**, **Generate brief**. Bulk edit and Import each open a dedicated subroute/step flow. Do not put these workflows in a modal. Preserve preview, frozen intent, per-row result, and reconciliation states. |

## 5. Interaction contract

Every new action entry must satisfy all of the following:

- **One intent per surface.** A dialog or route has one named goal and one primary submit action.
- **No hidden cancellation.** Closing a dialog does not cancel an in-flight request, discard an `OUTCOME_UNKNOWN` attempt, or mint a new idempotency key. Reopen shows the same unresolved state.
- **Draft ownership stays unchanged.** Drafts remain scoped by signed-in user, Workspace, Matter, document/record, and operation. Re-render, locale change, and switching read sections do not erase a draft.
- **Access loss wins.** Sign-out, forbidden, or hidden/not-found access closes the editor, clears its scoped draft/selection/pending preview, and prevents it from reappearing after re-grant.
- **Confirmed success is visible.** Close the editor only after confirmed success, refresh the affected read model without a full-page navigation where possible, move focus to the new/updated row or a success status, and preserve list/filter position.
- **Refusal is explanatory.** Validation, stale revision, permission, dependency, and retryable/unavailable errors remain distinct. A refused write must never look successful.
- **Permission controls visibility.** OWNER-only and OWNER/EDITOR actions follow existing policies. Do not broaden them in the UI.
- **Human labels only.** Buttons, menus, pickers, breadcrumbs, and rows show names/titles. IDs may be copied from a details affordance for support but are never the primary label.
- **Action hierarchy is stable.** At most one visually primary action per page or section; destructive/exception actions live in an overflow menu or confirmation dialog.
- **Keyboard and narrow screens are first-class.** Trigger, dialog title, initial focus, Escape behavior, focus return, error focus, and 320 px layout require browser verification.

## 6. Delivery sequence

### Ship now

1. Finish and independently review the current UXR-01/UXR-02 picker fix; do not create a competing writer.
2. Convert Work creation on Matter overview and Work list to the shared Add Work action menu plus two keep-mounted dialogs.
3. Convert Planning create/edit forms, New Document, and Control Room Add Record to section-header actions and dialogs.
4. Replace inline New Filing with a dedicated `/filings/new` route.
5. Add regression tests proving forms are not visible before invocation and drafts/unknown outcomes survive close/reopen.

### Next

1. Convert work-item, document, filing, and proof mutations to contextual action entry.
2. Split Data into explicit operation subroutes while retaining the current preview/commit/reconcile model.
3. Run rendered Product Design and accessibility validation against the authenticated local candidate.

### Later

- Saved user preferences for default create type or frequently used action.
- Command palette/global creation shortcuts.
- Cross-Matter templates or batch creation beyond the approved P0 workflows.

These are intentionally deferred because they add complexity before the core action hierarchy is proven usable.

## 7. Acceptance criteria and success signals

### Testable acceptance

1. On initial render of every list/overview named in P0, there is no visible text field, textarea, file input, radio group, or select belonging to a create/edit operation.
2. Every authorized create operation is reachable through a clearly named button in its page or section header; unauthorized roles cannot see that action.
3. Matter overview and Work use the same Add Work interaction and copy; neither renders `WorkCreationPanel` inline.
4. Planning has independent section actions; invoking one never opens or resets another section's draft.
5. Filing creation has a stable URL and survives refresh without losing its scoped draft or attempt identity.
6. Closing and reopening any receipted action during pending or `OUTCOME_UNKNOWN` produces no additional mutation request.
7. Access-loss tests prove the opened editor and its scoped draft/selection are purged.
8. After confirmed creation, the new row is visible and announced without losing the user's list/filter context.
9. Browser validation passes keyboard-only operation, focus return, 320 px layout, light/dark themes, and long EN/VI labels.
10. Existing business semantics and 401/403/404/409/412/503 mappings remain unchanged.

### Product success signals

- In moderated tests, at least 4 of 5 target legal managers can locate the correct creation action and explain the difference between Action and Requirement within 10 seconds.
- No participant mistakes a permanently visible form for required setup before they can read a Matter.
- No duplicate write occurs in cancel/reopen, network loss, or `OUTCOME_UNKNOWN` scenarios.
- The median vertical space before the first list/state content decreases on Matter overview, Work, Planning, Documents, Filings, and Control Room.

## 8. Risks and unresolved decisions

- **Rendered evidence is missing.** This brief is source-backed product analysis, not a visual acceptance result. Product Design must validate the implemented candidate in a real authenticated browser.
- **Large bounded selectors.** Product Design and frontend engineering must set the point at which a multi-select dialog becomes a dedicated route; do not silently render hundreds of checkboxes in a modal.
- **Filing action URL shape.** Solution architecture/frontend should confirm the exact subroute naming without changing API contracts.
- **Current shared dialogs.** A single writer should extend `FormDialog`/action-menu primitives only after the picker fixes land, because those shared paths are presently under active correction.
- **Role-specific primary action.** If a screen has no legal primary mutation for the caller, it should have no primary action rather than a disabled placeholder.

## 9. Handoff boundary

After UXR-01/UXR-02 is returned and accepted, assign one frontend writer to implement the **Ship now** paths in order. Product Design supplies the rendered composition and responsive/action-menu details; engineering preserves the interaction contract above. Independent review must verify source behavior and authenticated browser behavior separately. Do not claim the current runtime reflects this brief until a newly built candidate has been started and captured.
