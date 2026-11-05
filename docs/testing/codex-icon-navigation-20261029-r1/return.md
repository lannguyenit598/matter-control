# Icon-supported navigation and actions

Actual Local Codex,2026-10-29. PO requests extensive icon usage for navigation, either replacing text where clear or accompanying it. This implementation uses **Lucide icons plus the existing labels**, avoiding ambiguous icon-only legal commands. Existing dirty code and prior authorship preserved. No backend/auth/domain/URL change, package install, commit or push.

## Changes

- All9Matter destinations have distinct consistent icons (overview, control room, work, documents, filing, planning, agenda, data, history). The tab strip scrolls within its own region instead of growing into multiple rows. Active/accessible names and actual URLs remain unchanged.
- Agenda source/timing filters, apply/clear work filters and work-grid detail/next-page actions now combine icons and text.
- Workspace/Matter list entries and scope navigation have matching contextual icons while preserving full readable names and role badges.
- Shared form actions now carry icons for submit, retry, reread and discard; confirmation actions use warning/cancel icons while retaining warning text and the same confirmation gate. Icons do not imply legal verification or confirmed success.
- Planning/context/filing dialog triggers carry semantic icons; return navigation uses actual Lucide arrows instead of typed Unicode arrows. Back/All filings labels remain in EN/VI without decorative arrow text.
- Search retry, sign in/out and language preference affordances use the same icon family. Existing icon-equipped task choices/create/upload/export/queue/theme controls are reused.

All added SVGs are decorative (`aria-hidden`), retain visible text and do not add another tab stop. No new icon-only action was introduced, so no hover-only explanation is required to discover an action. Long names wrap within bounded flex children. No icon font, animation library or per-button client state was added.

## Verification

- `pnpm check`: exit0; typegen/TypeScript, ESLint, formatting,72files/656tests passed; agent checks OK.
- Focused existing navigation/action-entry/form/draft/search/locale tests:10files/117tests passed, exit0. Existing tests verify accessible action names, paths and safety behavior without mirroring icon implementation.
- Isolated current-source Next Webpack build and CSS guard: exit0;2CSS assets verified. Private env excluded, no dependency installation. Linked node_modules creates standalone output-tracing warnings; this does not certify deployable image packaging.
- Storybook build: exit0, output under owned `/private/tmp/mc-icon-build-pgs9jtn9/storybook`; existing module-directive/chunk warnings. No rendered Storybook acceptance.
- `git diff --check` clean.18scoped files match the isolated build snapshot; complete current bytes are pinned in `source-manifest.json`, not represented as a clean HEAD-only author diff.

Build/guard receipts retained here; other exact command outputs are in tool history. The existing3000 dev process and4176reference were not stopped/restarted. Human reload consumes the source update; authenticated browser appearance is not observed by this author.

Proposed status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS. Skipped: browser/mobile scroll/focus/contrast inspection and independent QA because the permitted browser surface remains disabled. Risk: the compact horizontal tab navigation needs real narrow-screen validation; no functional/release acceptance follows from build/source checks alone.
