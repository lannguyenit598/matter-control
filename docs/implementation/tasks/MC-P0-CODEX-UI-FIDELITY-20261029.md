# MC-P0-CODEX-UI-FIDELITY-20261029

Latest writer disposition,2026-10-30: Local Codex has finished these UI correction increments and hands frontend presentation implementation to the existing ZCode System-Review→Solid-Glass session. Explicit owner receipt: `docs/testing/codex-system-solid-glass-intake-20261030-r1/writer-handoff.md`. Codex is not currently writing the handed-over UI paths. Historical checks/status below remain unchanged; independent acceptance is still pending. This releases only Codex's visual-task ownership, not another feature/cloud writer's paths or retained runtime lifecycle.

Owner: actual Local Codex, assigned directly by the PO: “phần sửa UI này codex đảm nhiệm luôn”. Priority: current usable local P0 experience. Scope: selected option3 visual fidelity of the app shell and My Work. This supersedes Claude ownership of this visual correction only; no backend or new-feature scope expansion.

Requirements: BR-001/002/003/005/006; P0-03/04/09/10/18/20. Inputs: selected concept/interactive prototype at4176, current Claude-authored workbench and action-entry source, existing API and safety semantics. Existing dirty work preserved.

State: IN_REVIEW_WITH_VERIFICATION_BLOCKERS. Independent reviewer: pending assignment; this task's changes and checks are author work.

Changed surfaces: shared app shell/sidebar/navigation/page headers/mobile breakpoint, existing app layout/account placement, My Work typography/queue/current/Up next/disclosures, and local Inter asset/font setup. No commands/API/business-state change. Runtime on3000 retained; HTTP-only CSS smoke confirms new styles are served.

Acceptance: selected desktop geometry and responsive CSS implemented from the reference; real names/links/queue semantics retained; sidebar account/preferences and mobile menu kept; meaningful shell accessibility test added. No browser or human-comprehension acceptance awarded. Browser control is disabled in Work settings; no alternative browser/headless capture used.

Checks: typegen/TypeScript, ESLint, format and agent checks passed; final test-only run2workers passed68files/632tests. Full `pnpm check` did not finish green: first new test lacked pathname mock (fixed), next run hit the previously reported proof-upload5s timeout. Isolated Webpack compile/typegen/build and compiled-CSS guard pass; Storybook build passes. No test assertions removed/timeouts increased to suppress the flake.

Evidence: `docs/testing/codex-workbench-fidelity-20261029-r1/`. No commit/push. Next: permitted authenticated desktop/mobile rendered comparison and nonauthor review. Retain the existing upload-test reliability finding.

## PO typography and Vietnamese correction — 2026-10-29

The PO subsequently requested automatic client timezone without a dropdown, more navigation icons, Vietnamese font correction and smaller text with clipping/layout inspection. The typography amendment replaces the former Latin-subset Inter asset with locally served Be Vietnam Pro (OFL; four weights and verified Vietnamese glyph coverage), and supersedes the original exact prototype sizes with a compact 14px app body, 26px page headings and responsive wrap safeguards. Shared buttons/dialog/list surfaces and My Work queues retain existing commands, accessible names and business semantics. Inputs/callers include shared Button/Dialog/ListSection, MyActionsView and ReadFailure. No API, permission or data behavior changes.

Evidence: `docs/testing/codex-vietnamese-font-20261029-r1/` and `docs/testing/codex-ui-density-20261029-r1/`. Official browser tools became available: actual Vietnamese rendering inspected at390px before login, then the user signed in manually. Workspace-empty/create dialog inspected at320px: no horizontal document overflow or clipped buttons; closing returns focus. No business data created. Later desktop inspection failed with `browser.user is unavailable`; viewport reset confirmed. This supersedes the historical blanket browser-unavailable statement for these specific narrow observations only. Populated desktop, screen-reader and comprehension acceptance remain open.

Final check receipts and the two initially failing retry/upload test dispositions are recorded in density `checks.json`; source pins, isolated Webpack/CSS and Storybook build receipts are retained. Independent review remains pending; no commit/push/deploy or release gate closed.

## Sidebar preference icon correction — 2026-10-29

Direct PO screenshot follow-up: Select now owns the language icon and its native-control padding, removing the misaligned external wrapper. Appearance gains a fixed-size Monitor icon; theme button has a locale-aware accessible label/tooltip. Native selection/form/auth behavior unchanged. Seven scoped files, language story and existing behavior tests updated; pnpm check692/692, isolated Webpack/CSS and Storybook pass. Local desktop and narrow Preferences observed; automated E2E/independent review pending. Evidence: `docs/testing/codex-sidebar-icons-20261029-r1/`. No commit/push.

## Work search simplification — 2026-10-29

Direct PO screenshot follow-up: primary keyword Search plus native Advanced filters disclosure, applied filter chips and one/all removal. Existing seven criteria/sort/URL semantics retained; density/descending sort now survive submissions and removals, cursor resets. Five source/test/story files; tests red before change, final pnpm check695/695, isolated Webpack/CSS and Storybook pass. Actual isolated browser closed/expanded/applied states observed; product Work E2E pending because current tab has no accessible Matters. Evidence: `docs/testing/codex-work-search-20261029-r1/`. No commit/push or independent gate closure.

## Work density icons — 2026-10-29

Direct PO follow-up replaces underlined Comfortable/Compact labels with Rows2/Rows3 icon links, localized Thoáng/Gọn labels and selected button treatment; existing density/query semantics preserved, scroll disabled. One route source file changed; pnpm check695/695 and isolated Webpack/CSS pass. Live authenticated Work geometry and independent review pending. Evidence: `docs/testing/codex-density-icons-20261029-r1/`. No commit/push.
