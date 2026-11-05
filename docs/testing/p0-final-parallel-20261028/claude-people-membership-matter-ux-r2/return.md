# MC-P0-CLAUDE-PEOPLE-MEMBERSHIP-MATTER-UX r2 — fixes for UXR-01 / UXR-02

Actual Claude Code (Sonnet 5.5). Branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` (unchanged). Proposed status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**. No commit, push, dependency, backend, IdP, database or runtime change. r1 evidence untouched; new evidence only in this directory.

## Cause
Both defects were in `components/molecules/search-picker.tsx`:
- **UXR-02**: rows came from `settled.result` without checking that `settled.query === query`, so the previous query's unselected rows stayed enabled while the new request was pending.
- **UXR-01**: the matter caller's `search` closure over `candidates` was only stored in a ref, so a refreshed candidate list neither re-ran the search nor reconciled `chosen`; `chosen` was always prepended to the list.

## Change (4 files; delta = 1 added, 3 modified, 0 removed, nothing else drifted)
- `search-picker.tsx`
  - Responses are tagged `{query, version}`. A row is shown or selectable only when the response matches the **current** query and eligible set; otherwise the list is empty and "Searching…" shows. The chosen person is still rendered as the checked pinned row plus the "Selected:" line, so form data and Clear keep working. Late-response ignoring (effect cleanup) is unchanged.
  - New optional prop `eligible`: the complete authoritative set (caller supplies it only when it truly is complete). Rows outside it are filtered immediately, a chosen person who left it is cleared, and a change re-runs the search with no debounce delay. Omitting it keeps the previous behaviour exactly, so the workspace search (max 20 results) never infers "ineligible" from a name search.
- `grant-matter-member-form.tsx`: passes `eligible` (the full candidate list) and filters that same list by name in `search`. No `key` change and no remount, so `IntentForm` pending, UNKNOWN, receipted attempt, role and ETag handling are untouched.
- Tests: `search-picker.test.tsx` (+8), new `src/test/matter-grant-eligibility.test.tsx` (4). One existing test now awaits the new row after typing, because rows are offered only once the new query settles (the intended UXR-02 change).

## Red / green
| Run | Result |
|---|---|
| Codex `reviewer-picker.test.tsx` with the fix neutralized (pre-fix behaviour) | 2 failed / 2 (UXR-01, UXR-02) |
| Same file on the fixed source | 2 passed / 2 |
| My new regressions on the unfixed source (before any edit) | 8 failed; the other new ones (pending/UNKNOWN/retry/name-search guards) passed |
| My new + existing picker, membership, FormDialog, IntentForm, creation-reload suites on fixed source | 11 files, 99 tests pass |

"Pre-fix" for Codex's file was reconstructed by neutralizing the fix lines in a backup-protected edit and restoring byte-identically (verified by diff). Primary files were not otherwise reverted.

## Coverage of the requested cases
- Same Matter, new candidates and ETag: Alex dropped, role EDITOR kept, submit sends `userId: ''` (never `u1`), `ifMatch` is the new ETag.
- Dialog closed, refreshed, reopened: no Alex, no "Selected:", empty-state wording.
- Chosen person still eligible after a refresh stays checked; a removed person does not come back if they later become eligible again.
- Name search that omits the chosen person does not unselect them.
- Pending + double click: one call, same form instance still busy after candidates change and close/reopen. UNKNOWN: still re-read-only after candidates change and reopen, no second call.
- Query change with pending request: no rows (Alex absent); chosen stays pinned and checked; ArrowDown with no rows leaves focus in the box; request error hides old rows and Retry shows the new ones; clearing the query hides old rows until `''` settles; late old response still ignored.

## Checks (executed, logs in this directory)
- `pnpm check`: exit 0 — typecheck, eslint, prettier, **62 files / 584 tests**, agents:check OK (`pnpm-check.log`). The intermittent `proof/upload-attempt` timeout did not occur this run; not declared fixed.
- `pnpm build:webpack`: exit 0, compiled-CSS guard pass (`build-webpack.log`).
- `pnpm build-storybook`: exit 0 (`build-storybook.log`), run because a shared molecule changed. `pnpm build` (Turbopack) not re-run.
- Source manifest `source-manifest.json` aggregate `106262b2d3b188d3d74741a2ec5dc69a2576d96b1780833bab8d72993114dc29`, 279 entries (r1: 278, aggregate `def5068f…`); `source-delta.json` vs r1.

## Limits
- **Browser: NOT_RUN.** The official browser tool is not available in this session; I did not substitute another tool. jsdom proves neither real focus return, top-layer dialog, ArrowDown focus in a real browser, nor layout. No rendered/focus PASS is claimed.
- **Runtime: not touched.** I did not inspect or restart port 3000/3100 or any owner/PID; API/PG untouched. Updating a local frontend needs owner/PID/cwd/argv verification first.
- Equal display names and the ambiguous 404 are unchanged (r1 items 2–3).
- Brief UI behaviour change: after typing, rows reappear after the debounce (250 ms) instead of staying clickable; on a candidate refresh the list shows "Searching…" for one tick.

Skipped: browser/rendered checks, e2e, Turbopack rebuild, runtime refresh, independent re-review, human acceptance. Remaining risk: unverified real-browser dialog/focus behaviour and no independent re-review of this delta.
