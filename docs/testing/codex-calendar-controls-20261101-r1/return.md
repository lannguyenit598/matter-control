# Checkbox/radio and calendar UI — Local Codex return

Task: MC-CODEX-CALENDAR-CONTROLS-20261101. Actual Local Codex, branch `codex/unified-project-flow`, HEAD `978d8fc694a47e9beee528076bcf1af9473997e3` plus preserved dirty work. Proposed status IMPLEMENTED_SELF_TESTED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS. PO selected a calendar popup matching current UI, retaining direct entry and device zone.

## Changes and reach

The previous mobile rule stretched native checkbox/radio inputs to at least 44px, while only some callers supplied an accent. SelectionControl now keeps a native input for names/values/labels/keyboard/form semantics and draws a compact 18px token-colored checkbox/check/mixed mark or radio dot. The clickable label retains a minimum 44px mobile height. Focus, disabled, invalid and forced-colors states are explicit. All six production checkbox/radio families now use it: planning, context links, Filing version selection, proof claims, document acknowledgement and people SearchPicker. Existing name/value/checked/onChange logic is unchanged.

LocalDateTimeField now composes CalendarPopover for the current business date/time inputs: work due/completion, milestone, document signature, Filing events/cycles/corrections and Status Brief range. Native datetime-local entry remains named exactly as before. The popover uses the platform top layer and anchor positioning with centered fallback; no dependency added. Monday-first calendar, exact localized day labels, month/year keyboard navigation, Today/Clear/Apply, time and read-only device zone. Picking does not write until Apply (Clear explicitly clears); application emits the native draft input event. Seconds of untouched stored instants, gaps/repeated DST time choice and final instant validation stay in the existing local-time implementation. Only open calendar content is mounted.

All current product consumers share these controls. The inactive starter Task form's separate date-only input remains native; it is outside the current legal-work navigation and was not silently replaced with a datetime field.

## Checks actually run

- Focused initial suites: 21/21 passed after correcting test-environment popover lifecycle and Intl punctuation assumptions. New date behavior cases cover draft-restored DOM values, native form input/persistence, no write on navigation/cancel, keyboard month focus, adjacent-month click focus, disabled fieldsets, localized clear and unchanged instant/DST rules. Selection tests exercise label/Space, radio exclusivity, disabled, controlled/mixed behavior.
- Exact final isolated candidate `pnpm check`: 108 files passed, 1 skipped; **871 tests passed /12 skipped /0 failed**, including typegen/typecheck, ESLint, formatting and agent checks. Snapshot excludes private env/build/dependencies/raw .mimosa history; this does not claim formatting immutable primary raw evidence.
- Production Webpack build and compiled CSS guard: exit0. Storybook build: exit0. Final bundles contain both calendar and selection CSS.
- Source pins:16/16 primary/snapshot equal at close; package.json and lock match the opening snapshot. No dependency or backend/API/DB/IdP change.
- An intermediate full check found duplicate zone copy from hidden calendar content. Corrected by mounting content only when open; the failed receipt remains. Final source also corrects adjacent-month focus and explicit gridcell semantics, with the full candidate gates rerun after those changes.
- Impeccable mechanical detector returned []; this is not visual acceptance.

## Browser limitation and local runtime

Official CUA first read the existing Workspaces screen, then reported browser use disabled. After the user reported enabling Settings, the same supported tool still refused. No headless/native alternate, injected page execution, screenshot bypass or credential reading was used. New rendered light/dark/EN/VI/mobile, actual top-layer Escape/focus, forced colors and screen-reader behavior are NOT_RUN. jsdom manually simulates native popover lifecycle for component tests; it does not prove the platform top layer or visual layout.

Frontend has been refreshed at **http://localhost:3000** to this candidate, after ready-probing new3107 and then stopping only verified owned old76415/cwd/parent76414. New runtime details in runtime.json. API8081 PID12838, DB/objects/IdP unchanged. Private retained0600 config is used by Node only, never exported. Memory sessions may require normal sign-in again; no business requests submitted during this task. Probe3107 stopped; manual frontend3000 retained intentionally.

## Environment erratum

First snapshot pnpm12 preflight tried automatic dependency verification/install, failed because node_modules is a symlink, and continued scripts. That attempt is retained, not called a successful install. Subsequent verification disables this behavior only in isolated pnpm-workspace.yaml (`verifyDepsBeforeRun:false`); primary dependency settings unchanged. Final check/build/Storybook use installed existing dependencies and pass. See closing-checks.json.

## Evidence / next action

candidate-source.json, source-inputs.json, check/build/Storybook attempt logs + command/cwd/UTC/exit receipts, closing-checks.json, runtime.json, outputs-manifest.json. New test/proposal files remain uncommitted. Local manual check: open Planning → Add milestone → calendar; navigate and cancel before applying to the form; verify picked value, Escape closes only calendar, parent draft/focus survives, long labels and selection marks at320/390/desktop in both themes. Submit only synthetic data if later explicitly testing commands. Independent UI review pending; no product/release gate promoted.

Skipped: real-browser/new visual acceptance, physical Safari/iPad, screen-reader speech, inactive date-only starter form and backend testing. Risk: top-layer positioning/focus and forced-colors presentation need a real browser pass; unit/build success alone does not establish them. No commit/push/deploy.
