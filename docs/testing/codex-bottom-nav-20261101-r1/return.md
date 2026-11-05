# Responsive bottom navigation — Local Codex return

Task `MC-CODEX-BOTTOM-NAV-20261101`; actual implementation/verification: Local Codex. Branch/head `codex/unified-project-flow` / `64b9e0315e210953d7a7eaeacc0643b269a14ad9`. Proposed status **IMPLEMENTED / LOCAL_BROWSER_VERIFIED_WITH_LIMITATIONS / IN_REVIEW**. No independent acceptance implied.

## Change

The PO requested the Pane-style transition from sidebar to bottom navigation on smaller screens. Reuse the existing `mainNavigation` and `NavMenu` rather than maintaining a second destination/active-route system. At <=800px show four icon-and-label destinations in a floating glass dock; above 800px retain the desktop sidebar. No fake More, search or notification destination was added. Search/theme stay in the toolbar and account/language remain reachable through mobile preferences. The preferences/brand breakpoint now matches the sidebar's 800px boundary, closing the previous 768–800px gap.

Bottom targets are equal-height, at least 64px high and 67.5px wide in measured narrow geometry. Selected route, keyboard focus, safe-area positioning, reduced-transparency and forced-colors fallback are retained. Main content reserves 136px plus the safe-area inset. Full Vietnamese labels wrap; a measured English Workspaces overflow at 320px was corrected with 11px labels only below 361px, otherwise 12px. The existing standalone MobileNav component remains available for other callers/stories; this application shell uses BottomNav.

Application paths: new bottom-nav.tsx, bottom-nav.test.tsx and bottom-nav.stories.tsx; changes to dashboard-template.tsx, app/(app)/layout.tsx and pane-workbench.css. DESIGN.md records the responsive direction. All six application files match the running r3 snapshot byte-for-byte in delivery-source-check.json. No business logic/backend/schema/dependency changed.

## Checks

- Four focused navigation/dashboard/search suites: **13/13 PASS**, including route aliases, path-boundary matching and Vietnamese landmark naming. `targeted-final.json`.
- Changed TSX lint and six application-file formatting: **PASS**; `lint-bottom-final.json`. `git diff --check`: PASS.
- Final production Webpack build and compiled CSS guard: **PASS**, `build-narrow-final.json`. Storybook: **PASS**, `storybook-final.json` (before the final CSS-only <=360px label adjustment).
- Full frontend suite: **846 PASS / 1 FAIL / 12 SKIP**. Existing item-detail expectation still asks for “Package and signature readiness” while implementation renders “Package readiness”. No assertion weakened. Full `pnpm check` passes typecheck/lint then stops on pre-existing formatting in filing-guard-copy.test.tsx; `unit.json` and `check.json`.
- Impeccable detector on the changed UI targets returned no findings before the final narrow font-only adjustment. This is a detector result, not full accessibility certification.

## Browser evidence

Normal previously authorized ZITADEL Cloud SSO restored the local session; no credential/token/cookie was read or exported. Screenshots show real local application data. EN and VI link labels have no measured horizontal clipping at 320px; the page has no horizontal overflow in these observations. VI 768px and 800px show the dock and mobile preferences with sidebar hidden; 801px restores sidebar and hides the dock. Current-route indication was observed for My Work and Workspaces as the user continued navigation. `geometry-vi-final.json`, vi-light-320-final.png and vi-dark-tablet-final.png are final r3 observations.

Provenance caveats: early en-light-* images and geometry-en.json are r2 observations. In geometry-en-final.json, sidebarVisible checked computed display on a contents wrapper, which does not prove visibility; ignore that field and use the bounds-based VI observations. Its requested 1024px iteration measured 801px before viewport settlement, so it does not establish 1024px coverage. Do not infer physical iPad/Safari/virtual-keyboard behavior from emulated widths. Full-page screenshots place the fixed dock at the viewport's scroll position within the long capture; they do not imply it moves into document flow.

## Local handoff

The reachable app is http://localhost:3000. Running frontend snapshot: `/private/tmp/mc-bottom-nav-20261101-r3/frontend`, wrapper PID 26985; see runtime-final-r3.json. The previous owned frontend listener was verified by cwd/parent before SIGTERM. Every build used a separate snapshot before the swap. API at 127.0.0.1:8081 and the manual database/object resources were not restarted or changed. The memory-session restart was followed by ordinary SSO. Browser viewport override was reset; current VI/dark appearance was retained while the user continued manual navigation.

Skipped: physical iPad/iOS keyboard and safe-area tests, complete screen-reader/contrast certification, backend reruns and independent review. Existing full-suite test/format defects remain open. No commit, push, cloud mutation, deployment or product acceptance gate closure.
