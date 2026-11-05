# MC-P0-CLAUDE-ACTION-ENTRY-UX r1

Actual Claude Code (Sonnet 5.5). Branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` (unchanged). Built on the UXR-01/UXR-02 bytes (`claude-people-membership-matter-ux-r2`, aggregate `106262b2…`). Proposed status **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**. No commit, push, dependency, backend, IdP, database or runtime change; r1/r2 evidence untouched.

Source delta vs r2 (`source-delta.json`): 7 added, 20 modified, 2 removed, all this task's; aggregate `f3abdcd221e5af27f0f6318b8dcd3395e523a55fbc6208dccc4210e9f53974cd`, 284 entries. Removed: `work-creation-panel.tsx` and its test (superseded by `add-work-dialog.tsx`; the test's behaviours — explanation before any form, typed intent preserved across kind switch — are re-asserted in `src/test/action-entry.test.tsx`, plus new pending/UNKNOWN cases).

## Shared mechanism (small, additive)
- `FormDialog`/new `TaskDialog` (server pages pass plain children): closes itself and shows an optional `successNotice` beside the trigger **only** after an `IntentForm` (or the upload form) reports confirmed success via a new `TaskSuccess` context. Failure, refusal, UNKNOWN and re-read never close it. Content stays mounted while closed (existing `keepMounted`).
- `UnresolvedReporter` context in `intent-form.tsx` (informational only): a form that is pending, unconfirmed or needs a re-read tells a surface that can hide it, so the hidden option shows "Not finished — open to check". Changes nothing about the command, key or draft.
- `Dialog`: content now bounded to the viewport (`max-h-[calc(100dvh-2rem)]`, one scroll region inside, `overscroll-contain`).
- New `TaskChoice` molecule (toggle button with icon, name, one-line explanation, unfinished marker) + story; `TaskDialog` story.

## Task-by-task
| Task | Default (no editor on screen) | Entry | Notes / safety |
|---|---|---|---|
| Work (overview + Work list) | header only | one **Add work** dialog; first picks Action vs Requirement with examples, then that kind's own form | Both forms stay mounted; each keeps own draft/key/result; out-of-sight kind with a pending/UNKNOWN request is flagged on its choice; permission gate unchanged (OWNER/EDITOR); duplicate `WorkCreationPanel` and `#create-work` anchors removed (banner now says "use Add work at the top"; filing prerequisite link goes to `/work` and says how) |
| Planning | lists + status | **Add milestone** (OWNER) / **Add external party** / **Add workstream** in each section header | Existing deliberate `details` editors (Edit party, change required Requirements) unchanged by design |
| Documents list | list | **New document** header dialog (names the matter) | Draft + receipted key survive close/reopen; routes to the new document |
| Document detail | version list | **Upload new version** header dialog (names the document); per-version **Record signature** dialog (names version) | File stays in memory while the dialog is closed; reload cannot restore it, the existing "earlier upload not confirmed, choose the same file" path is unchanged; no auto-reupload, no bytes stored. **Make current…** link/preview card left as is (deliberate preview + impact + confirmation) |
| Filings list | list | **New filing** = `Link` to new route `/matters/{id}/filings/new` | New server page: reads names with caller's rights, shows form or the existing "missing Requirement/authority" guidance with links; viewer sees why not; sign-in handled; opening sends nothing |
| Filing detail | state + next step first | "Actions" card of labeled buttons: Record the next step, rejection/withdrawal, signature applicability, close/reopen, correct an observation (each in its own dialog with its warning) | Same gates and forms as before (canEdit/OWNER/stage); only presentation moved |
| Control Room | records | **Add context record** in the card header (dialog) | Close/Reopen with reason stays next to the record; "read separately at … room as of …" provenance sentence kept |
| Data | chooser | **Import file / Bulk update / Export / Draft status brief** | All tasks stay mounted, only hidden; `RecoveryGate` and its alerts sit outside the chooser; an import/bulk task that is pending, locked (UNKNOWN) or access-lost is flagged on its button; brief labelled draft; Export remains a direct read-only download; no new route, no new endpoint |

Not in the addendum inventory and left unchanged: work-item detail and `ProofPanel` contextual actions (brief "Next" items), Make-current placement.

## Checks executed (logs in this directory)
- `pnpm check`: exit **0**, **64 files / 605 tests**, agents:check OK (`pnpm-check-run1.log`; an earlier run hit the known `proof/upload-attempt` 5 s timeout, which passes alone 3/3 and is untouched by logic here — see `pnpm-check.log`).
- `pnpm build:webpack` + CSS guard: exit 0, route table includes `/matters/[matterId]/filings/new` (`build-webpack.log`). `pnpm build` (Turbopack) + guard: exit 0. `pnpm build-storybook`: exit 0.
- New tests: `src/test/action-entry.test.tsx` (12: Add work default/switch/UNKNOWN/double-click, Planning buttons/draft/permissions, signature + upload dialogs incl. File kept across close/reopen and unconfirmed upload), `data-transfer-panel.test.tsx` (4), `filings/new/page.test.tsx` (4), `form-dialog.test.tsx` (+2). Updated assertions that expected inline forms: document create, filing prerequisites link, control-room provenance text. No coverage deleted.
- A test-authoring slip was caught and fixed: a mock reset placed after arranging it made an upload test pass for the wrong reason; resets now run in `beforeEach`.

## Not verified (named gates)
- **Official browser: NOT_RUN** (tool unavailable). Not proven: desktop/narrow layout, light/dark, real `<dialog>` focus return to the trigger, Escape/backdrop, scroll region and reachability of the submit on 320 px (submit scrolls with content; it is not sticky), `/filings/new` navigation without reload. jsdom proves none of these.
- No authorized synthetic create against the API/list; no runtime started or restarted (3000/8081 not touched).
- No user-task trial ("Add a piece of work" / "Add a document" / "Record a filing"), no independent review, no UX acceptance, MC-002 not DONE.
- e2e not run (specs target the template demo).
- Risks: after a successful dialog task the only on-page confirmation is the notice beside the trigger plus the refreshed data; hidden-dialog duplicate status text (one visible, one in the closed dialog); the proof-upload flake can still fail a full `pnpm check`.

## Exact next action
Start a verified owned frontend on a free port against the existing API/IdP, then run the official browser pass listed above on the Work, Planning, Documents, Filing (list/new/detail), Control Room and Data screens at desktop and 320 px, light and dark; independent reviewer then re-checks `form-dialog.tsx`/`intent-form.tsx` contexts and the new route.
