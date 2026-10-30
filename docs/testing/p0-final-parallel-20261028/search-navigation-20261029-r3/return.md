# MC-P0-SEARCH-NAVIGATION-20261029

Actual Local Codex; branch codex/unified-project-flow; HEAD 20feedbf06c859a9806055d609f5b132fe8bb086. Proposed IN_REVIEW.

Root cause: WorkspaceMembers search and WorkFilters submitted native GET forms, causing full document navigation. Both now use next/form with a string action and scroll=false. URL query semantics, GET fallback without JavaScript, server authorization and first-page filter behavior remain intact. Existing mutation forms untouched. No new dependency.

Four source paths relative to pinned Select candidate: workspace-members.tsx, work-filters.tsx, work-ui.test.tsx, new search-navigation.test.tsx. Preserve all earlier dirty work. Current 678 source entries match manifest; no closing drift.

Verification: two regression tests fail on the isolated original forms and pass after applying these two component changes (R2 red/green receipts). Current pnpm check exit 0: 56 files / 511 tests; pnpm build:webpack exit 0 including CSS check. Unit tests use the installed next/form standard entry with RouterContext; the production build resolves App Router. No browser execution is inferred from these tests.

Frontend only updated to /private/tmp/mc-local-login-cij0dm22/frontend-search-navigation-r1 on port3000 after prior process parent/start/cwd checks. runtime.json pins the candidate. API and DB unchanged. The already-open browser needs one reload to load the new client bundle. Restart may require normal sign-in again; no authentication bypass.

Browser/E2E NOT_RUN: official browser API unavailable and inventory returned no tabs. No alternate/headless workaround. No screenshot or visual PASS. No commit/push/release or independent acceptance. No debounce/new search UI added.
