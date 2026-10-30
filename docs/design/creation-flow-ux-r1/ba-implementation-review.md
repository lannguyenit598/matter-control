# Creation flow R1 — BA implementation review

Status: `PASS_SOURCE_ONLY_WITH_LIMITATIONS`  
Reviewer: Local Codex business-analyst subagent  
Repository / branch / HEAD: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` / `codex/unified-project-flow` / `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`  
Mode: targeted static/source-delta review only. No browser, runtime, API, accessibility or human-usability result is claimed.

## Acceptance result

No business-rule, permission or command-boundary drift was found in the reviewed creation-flow changes.

- Matter Overview and Work now use the same `WorkCreationPanel`. Requirement and Action remain separate forms, payloads, receipts and success results; the UI does not create a dependency or imply that completing an Action verifies a Requirement.
- Both forms remain mounted inside native disclosure elements, so changing the visible choice does not itself destroy the other form instance. Requirement now uses the existing session-scoped, Matter-scoped draft mechanism already used by Action.
- Requirement and Action still ask only for their approved required fields. Owner, due date, workstream, dependencies, verifier and proof remain later operations.
- Requirement success now opens the existing Matter work-item route; no new route or API contract was introduced.
- Workspace and Matter creation retain their existing one-record commands and permission evidence. Matter creation is offered only when the existing OWNER-only membership read succeeded; non-owners receive no create action.
- Document and Filing navigation occurs only through the existing `onSuccess` callback with a returned record ID. Upload/promotion and Filing stages remain separate commands.
- Filing creation is not rendered when Requirement or authority-Party prerequisites are empty. The replacement actions use existing Work and Planning surfaces and do not invent inline multi-record creation.
- Existing `IntentForm` semantics remain in control of pending submission, same-key receipted retry, stale-state reread, draft preservation and access-loss cleanup. No generated ID, ETag or idempotency key became a user field.

## Open limitations and narrow follow-ups

1. **Mutual exclusion and accessibility remain unverified.** `WorkCreationPanel` relies on native `<details name="new-work-kind">` behavior. Its source test proves both form instances remain mounted and entered input survives a choice change, but it does not assert that the first disclosure closes, that its controls leave sequential focus/the accessibility tree, or that an unresolved error is discoverable while collapsed. Keep CF-03 and CF-12 pending browser/keyboard/screen-reader verification.
2. **Workspace hierarchy is only partly implemented.** The empty-state CTA and clearer copy are present, but the creation card remains sticky and equally visible when Workspaces already exist. This does not violate a business rule, but it does not yet achieve the proposal's secondary-action hierarchy for the non-empty state.
3. **Filing prerequisite navigation is actionable but not preselected.** “Add a Requirement under Work” reaches `#create-work`, where both choices initially remain closed. The user must select Requirement once more. This is not a semantic blocker, but a later UI-only refinement may carry a safe presentation hint that opens Requirement without auto-submitting or changing its command.
4. **Rendered recovery is not proven by the panel-level test.** Same-key `OUTCOME_UNKNOWN`, conflict and access-loss behavior is inherited from the existing `IntentForm`/`ReadFailure` infrastructure; the new panel test uses plain inputs rather than exercising those states while switching disclosures. Add focused integration coverage or verify them in the browser before closing the journey acceptance.

## Proposed disposition

The source is acceptable to continue as the UI-only Slice 1 candidate. No PO, API or architecture decision is required for the reviewed changes. Do not claim the creation flow, accessibility or AC-137 complete until the limitations above have actual evidence.

Tests run: none; review was explicitly source-only.  
Skipped: browser rendering, keyboard/focus behavior, screen reader, responsive layout, API/runtime execution and human comprehension testing.  
Remaining risk: native disclosure behavior and hidden recovery state may differ across supported browsers; the non-empty Workspace hierarchy and Filing preselection are still presentation polish gaps.

## Input-refresh addendum — 2026-10-29

Refresh branch / HEAD: `codex/unified-project-flow` / `20feedbf06c859a9806055d609f5b132fe8bb086`  
Panel SHA-256: `135f25fb8f89d6849a567e2d2f366d0a7d65ed12fc25ba924ee02c1b15389ab4`  
Panel-test SHA-256: `1c6d2dcb95079e6db7c11f489591edaae0461aea11a7c600c4c7c1efa0f0088c`

The earlier mutual-exclusion note is superseded in part. `WorkCreationPanel` no longer relies on native `<details name>` grouping alone: a component-local `selected` state controls each disclosure's `open` value, and each summary prevents the native toggle before selecting or clearing exactly one kind. Both Requirement and Action form instances remain mounted, so the command, payload, draft and frozen-intent boundaries remain independent and unchanged.

The source test now explicitly asserts that Action becomes not visible after Requirement opens, while also asserting that the original Action input node and entered value survive the switch. The previous statement that this closing assertion was missing is therefore no longer current. The reported pass was not rerun by this source-only BA review.

The remaining limitation is narrower: source and DOM-unit evidence still do not prove keyboard behavior, focus placement, accessibility-tree exposure, collapsed error discoverability or behavior in supported real browsers. CF-03 has stronger source evidence, but CF-12 and rendered accessibility remain `NOT_RUN`. No change to required creation fields, business rules, permissions, API contracts or backend semantics was found in this narrow refresh.
