# MC-P0-CLAUDE-ACTION-ENTRY-UX — continuation addendum

## Direct product direction

The Product Owner requests an immediate UX improvement: creation inputs must not occupy the default reading/list screen. Expose explicit Create/Add buttons that open a focused task. Keep Next.js/Go, approved semantics and existing design tokens. This is a continuation of the current Claude UX assignment, not another implementation session.

Read docs/design/action-entry-ux-20261029/product-brief.md when present, the current UX task/return, and docs/testing/p0-final-parallel-20261028/review/codex-people-membership-matter-ux-r1/return.md. Finish UXR-01 and UXR-02 first, then perform this addendum on those same current bytes. Do not reset, duplicate the writer, restart W0 or stop at a planning checkpoint. Preserve dirty work and current author provenance. Record exact source manifest/delta.

Prepared source HEAD: 20feedbf06c859a9806055d609f5b132fe8bb086; recheck actual bytes. Claude owns this scoped implementation after the human submits this continuation. Codex and its Product Manager subagent only wrote analysis/handoff documents in this pass, no implementation edits.

## Product structure

A list screen answers: What exists? What needs attention? Which object should I open? A detail screen answers: What is its state? What can I do next? Avoid teaching the data model by showing every possible mutation form simultaneously.

Default screen:
- Context/name and current state remain visible.
- A clear primary Create/Add button next to the relevant list heading, shown only for the current authorized role.
- Search/filter and rows remain usable without scrolling past creation cards.
- No visible creation inputs until deliberate activation. Hidden mounted state is acceptable when necessary for safe request recovery.

After activation:
- Short tasks use existing FormDialog/Dialog with current object name, concise instructions, fields, a clear submit and Close/Cancel.
- Consequential transitions show impact/prerequisites and an explicit confirmation; opening a dialog never mutates data.
- Long multi-step data tasks use the current Data route as a focused workspace opened by explicit task buttons. Do not squeeze import/preview/commit/restore into a small modal or invent a new backend workflow.
- Modal height bounded by the viewport with one predictable content scroll region; footer actions remain reachable on narrow screens. Avoid double scroll traps. Keep title/current scope and visible accessible focus.

## Exact implementation inventory

### A. Keep recent correct work

Preserve existing CreateWorkspaceForm, CreateMatterForm, GrantWorkspaceMemberForm and GrantMatterMemberForm button/dialog entry flows, plus unified Workspace/Matter/member lists. Integrate UXR fixes. Do not rebuild these merely to change visual style. Keep the no-document-reload Search/WorkFilters fixes.

### B. Overview and Work

Source: features/work/components/work-creation-panel.tsx and its Overview/Work route callers.

Replace the large permanently visible instructional card + details forms with a compact Add work action. Inside the focused task, distinguish Action (someone does work) from Requirement (a condition must hold), using concise examples. Preserve separate form state and independent Requirement/Action semantics. Do not merge forms, auto-verify Requirements or hide pending/UNKNOWN state when switching kind.

Update current #create-work links and post-create continuation so they open/focus the actual task; do not leave dead anchors, a button that merely scrolls to an empty spot, or duplicate Add work triggers for the same list. Keep current permission gates.

### C. Documents

Source: app/(app)/matters/[matterId]/documents/page.tsx and features/proof/components/document-forms.tsx.

Documents default: list + Create document button, no always-visible New document card. On document detail: version list first; Upload new version opens the upload task, and Record signature opens the task for that specific version. Keep filename/version/scope explicit.

Promotion already follows a deliberate Make current link with target and impact; preserve that deliberate preview/confirmation. Do not hide invalidation impact or convert the link into an immediate mutation. Make its placement consistent only where necessary.

File input caveat: closing/reopening must not discard the in-memory File or pending attempt. A page reload cannot restore a File from storage; explain the actual recovery and require an explicit reselect/reconcile. Never serialize file bytes/tokens or auto-reupload to improve appearance.

### D. Filings

Source: app/(app)/matters/[matterId]/filings/page.tsx, its detail route, features/filings/components/filing-forms.tsx.

List + New filing navigation action to a dedicated frontend creation route (proposed /matters/{matterId}/filings/new; this route does not exist yet, so implement and test it explicitly if chosen). Use a Next Link styled as a button for navigation, not a button that performs a write. The focused page shows prerequisites from current data and links to resolve missing requirements/authority/people. No fake default object or raw-ID input fallback.

On detail, show stage and next valid task before forms. Place advance/correction/negative-outcome/owner-decision/signature-applicability forms behind explicit labeled actions where currently exposed. Keep strong warnings and required independent assessment/evidence and all Filing proof-epoch/receipt/outcome distinctions. Secondary/risky tasks belong near the affected object, not in an unlabeled universal Create menu.

### E. Planning

Source: features/work/components/planning-view.tsx and planning forms.

Each section owns its button: Add milestone / Add party / Add workstream. Lists and current status stay visible by default. Keep OWNER-only milestone eligibility and current permissions. Existing object editors that are already deliberately opened do not need speculative redesign.

### F. Control Room

Keep operational context records readable by default. Move Add context record into a section-header action and short focused dialog. Existing Close/Reopen remains next to the record; a required reason is collected only after invoking that action. Preserve factual/provenance/non-authoritative semantics and current permission checks.

### G. Data

Source: features/data-transfer/components/data-transfer-panel.tsx and its Bulk/Import/Brief/Recovery children.

Do not add Data subroutes solely for appearance: reuse the current dedicated route and safe operation selection first; if a new frontend subroute is necessary, implement its auth/recovery/deep-link behavior explicitly. The default Data route should orient with explicit tasks: Import, Bulk update, Export, Draft status brief. Open the chosen task rather than displaying every editor together. Reuse current route/state, not new backend endpoints.

RecoveryGate and unresolved receipt/attempt alerts remain visible and cannot be hidden behind an inactive task. Switching/closing must not discard pending/UNKNOWN/preview identity, auto-retry a POST, mint a new key or make a hidden task seem cancelled. Export may remain a direct read-only download. Label draft reports as draft and retain provenance. If safe state preservation needs more than wrapping a component, solve it before claiming this part complete.

## Common interaction contract

- Explicit semantic button (type=button for open/cancel) opens a local dialog; a real Next Link opens a dedicated frontend route. No mutation on dialog open, query input, role selection, kind switch or close.
- Close means close the view; it does not cancel a sent request. Preserve the user's valid draft, selected scope and original attempt identity according to current contracts.
- Pending disables duplicate commit; actual confirmed success updates the relevant list/object and clearly states what changed. Unknown remains unknown with the existing reconciliation/reread path.
- Do not remount IntentForm to clear errors/UNKNOWN. Inspect FormDialog keepMounted and recovery ownership. Reopening an unresolved task shows its real state.
- Any reset/discard is deliberate, consistent with the existing command contract and inaccessible after permission loss. Access loss purges protected state; later regrant never revives it.
- Restore focus to the actual invoking button; Esc/backdrop behavior must not discard work silently. Do not use nested dialogs/forms or automatic autofocus that makes a closed dialog steal focus.
- Preserve navigation/list filter/scroll context. Internal navigation/filtering does not perform full page reload.
- EN/VI labels consistent; user names/titles primary, IDs internal. Do not invent permission, new API fields or success.

## Scope and design references

Follow root/component AGENTS, RTK, Semble, Context7 and installed framework docs. Use existing tokens, Lucide, Dialog/FormDialog, PageHeader/ListSection and feature modules. No dependency or platform migration. Reference the Medusa interaction principles already researched in the prior UX assignment; do not claim to have viewed its login-protected Inventory screen.

Product Design skill and purpose-first redesign guided the entry-point design. This pass is source-grounded, not a completed rendered audit: neither local frontend3000 nor API8081 was listening when Codex checked. No product screenshots or user-trial results were obtained. Restore a verified owned local runtime or provide exact operator instructions before claiming rendered completion; no secret/provider/DB-policy bypass.

## Acceptance and verification

For every inventoried task record its entry button, default state, open state, close/reopen, pending, success, validation/error, unknown, access-loss and responsive/focus expectations.

1. Unit/component regressions: default page has no visible creation editor; correct named button opens correct scoped editor; keyboard activation/close; pending/UNKNOWN survives close and task switch; no extra mutation; successful result refreshes correct object; permissions hide/refuse the action; drafts/file caveats handled honestly.
2. Update tests that asserted inline/always-visible forms. Do not delete coverage or assert DOM absence for intentionally hidden mounted forms.
3. Shared components: story coverage and build-storybook. Required pnpm check and production build with CSS guard; targeted existing membership, creation, proof upload, Filing and data recovery regressions.
4. Official browser: default versus open states at desktop/narrow viewport, light/dark, keyboard/focus return and scroll; confirm API result/list after an authorized synthetic create. No headless/capture workaround when unavailable.
5. Intended-user task wording for future validation: “Add a piece of work”, “Add a document”, “Record a filing”, without naming controls. Observe whether they find the entry, understand scope and know whether it saved. Do not invent success/timing/user scores.
6. Report source/unit/build/rendered/integration/human/independent evidence separately. No self-awarded UX acceptance or MC-002 DONE.

Complete all authorized source work in this continuation. If a real semantic tradeoff blocks one task, implement unaffected tasks and name the precise blocker; do not silently skip the rest. No commit/push/merge/deploy/paid services, existing resource deletion or broad process termination.

Outputs: a unique new checkpoint/return under docs/testing/p0-final-parallel-20261028/claude-action-entry-ux-r1/; exact changed-source manifest/delta, tests/log receipts, screenshot evidence when actually available, task-by-task coverage and remaining risks. Keep earlier UXR evidence intact. End with skipped checks and exact next action.

## Coordination disposition

Product Manager analysis is delivered in product-brief.md; it is an actual Codex product-manager subagent, not an external product or an independent UX acceptance. Product Design plugin skills guided this root pass. Their rendered-audit requirement could not be met because the local app/API were unavailable; no screenshot-based audit is claimed. The purpose-first brief and this continuation are ready; visual validation remains a named gate.

Apply the brief's immediate creation-entry scope first (Work, Planning, Documents, Filings and Control Room). Detail/Data improvements follow within this scoped continuation when feasible, preserving all command safety semantics. A dedicated frontend Filing creation page is a proposed UI route, not an existing API. Avoid speculative Data/action-subroute proliferation. Do not add a new dependency or global creation framework.
