# All-popup visual/source audit — 2026-11-01

Task: MC-CODEX-ALL-POPUPS-20261101. Actual Local Codex, official ChatGPT in-app browser (CUA), read-only source/hash audit plus local rendered checks. Branch `codex/unified-project-flow`, HEAD `978d8fc694a47e9beee528076bcf1af9473997e3`. Proposed status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS. This is author/local verification, not independent acceptance.

## Result

The shared corner correction reaches every current business dialog through Dialog → FormDialog/TaskDialog. No star-shaped corner defect was observed in the opened dialogs. All 22 dialog captures had zero optical refraction layers, one blur layer, one rim layer, focus inside, and no horizontal document overflow. Screenshots confirm clean rounded corners and readable controls. No application source was changed by this audit.

Source inventory: 37 TSX files, all byte-identical to the running isolated frontend; opening/closing hashes match, 0 drift. There are 23 business form callsites: 14 opened directly, 9 source-only. Action/Requirement are two modes of one callsite. Wrappers and inactive template components are counted separately, never as executed business forms.

## Browser coverage

Live product: Quick search, preferences, language dropdown, New workspace, Create Matter, workspace member picker, Add Action/Requirement, Matter member picker, milestone/native date picker, external party, workstream, context record, New document, New review grid, Filing next step, signature applicability, correction. Only open/close/type-mode controls were used; no submission, upload, role grant, deletion or Filing transition.

Storybook: 3 FormDialog/TaskDialog variants rendered; all 9 SearchPicker states rendered (normal, empty, truncated, loading, unavailable, failed, denied, invalid, duplicate names); 7 Select variants rendered; native language and long-label menus opened. Long-label menu wrapped correctly at 390px in Storybook.

42 captures total: 21 product and 21 Storybook. One Storybook capture is an error, not a pass. Product captures include repeated states and the date-picker inside a dialog; counts are not unique-feature acceptance totals.

## Remaining coverage

Nine business forms were not opened: Document upload/signature (no documents), Review add/remove version and add/reword question (no review grids), Filing rejection/close/reopen (current fixture is Signature, not a negative/closed outcome). Source confirms shared wrapper coverage; do not claim their runtime behavior. The existing NA project also had no documents/review grids. No business state was manufactured to reach these conditions.

ConfirmationDialog's existing interactive Storybook fixture failed before rendering with `Cannot read properties of undefined (reading 'data')`. Source shares the corrected Dialog. This is a fixture/render blocker; the dialog itself is not browser-certified. It belongs to the inactive tasks template, not the current Matter product flow. No destructive confirmation was attempted. Follow-up: diagnose its missing Storybook runtime context and verify confirm/pending/error/cancel states.

Known W2-BROWSER-01 (Filing advance state retention) remains open in the preceding G1 checkpoint; this visual audit did not modify it or execute a transition.

Viewport erratum: filenames 29/30 describe intended mobile overrides, but their measured product viewport remained 606×853. They are default-size observations. Capture 28 is the actual 390px Storybook long-label check. Prior corner-fix evidence separately includes product light/dark/390px/long-form checks; not counted as reruns here.

## Evidence and safety

`source-inventory.json`: AST callsites, exact paths/lines/hashes/runtime identity. `browser-cases.json`: capture times and DOM measurements; each ID has its matching AX text and PNG. `coverage.json`: result counts and source-only conditions. `server-closeout.json`: owned temporary Storybook server stopped (exit 130). Original denied bind attempt retained in fixture.json; it is not an active process.

The application remains running at localhost:3000; product tab returned to Workspaces, all dialogs closed. Temporary viewport overrides reset. Agent Storybook tab closed. No application writes, installs, resource provisioning, credential reads, commit, push or deploy. Existing dirty source preserved. No full-suite rerun: no source delta in this task; prior dialog-fix check/build receipts remain separate evidence.

Skipped: 9 data/state-dependent forms, confirmation fixture rendering, physical Safari/iPad and screen-reader speech. Risk: shared-source coverage does not prove every conditional form or business submission; independent review and the known Filing state bug remain open.
