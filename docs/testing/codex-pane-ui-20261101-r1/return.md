# Pane-inspired workbench — Local Codex return

- Task: `MC-CODEX-PANE-UI-20261101`.
- Date: 2026-11-01, Asia/Ho_Chi_Minh. Actual implementation and browser QA: Local Codex.
- Branch/head: `codex/unified-project-flow` at `64b9e0315e210953d7a7eaeacc0643b269a14ad9`, preserving the existing dirty work.
- Status: **IMPLEMENTED / LOCAL_BROWSER_VERIFIED_WITH_LIMITATIONS / IN_REVIEW**. No external OpenCode, product acceptance, release or deployment approval implied.

## Direction and scope

The PO chose “shared shell, panels and lists” after seeing the proposed adaptation of the live [Pane reference](https://demo.codeandchill.store/pane/#/home). Pane was inspected in the approved in-app browser; web extraction could not access the SPA. No reference assets, source code, people, charts, sample metrics, timer or notification functionality was copied.

Skills applied: frontend-design; design-taste-frontend app-screen guidance; Hallmark app/redesign guidance; Impeccable context, Operate and craft-floor guidance. Impeccable context loaded successfully from the existing PRODUCT.md. Existing visual implementation, not its missing DESIGN.md, was treated as authority; the PO's reference and scope chose the extension. DESIGN.md now records the system.

Taste direction draw: `achromatic-ledger`, seed **77911537**, palette/type kept. The PO-selected Pane sidebar and glass material explicitly supersede the sheet's no-sidebar/no-glass defaults. The adopted discipline is neutral chrome and color reserved for real state; Be Vietnam Pro and the independently modeled legal state axes stay intact. No theme reroll or invented visual data.

## Implemented

1. Shared shell: always-visible desktop toolbar instead of the mobile-only header wrapper; compact neutral floating sidebar; existing scale mark and product name; capped canvas and aligned gutters.
2. Toolbar: existing command palette is visible on desktop; explicit EN/VI accessible name remains when mobile hides its visible label. Existing theme toggle is in the toolbar. Account/locale stay in the sidebar; the existing mobile preferences route remains available.
3. Shared material: neutral canvas, defined panel face, top rim and small offset elevation. Card/list/table surfaces share one recipe. Nested lists do not get a second rim. State badges and form guards are not replaced with decorative chart semantics.
4. Data tools: the same four actions become rows of one panel with a small operational guidance column. The existing task toggling, mounted inactive editors, UNKNOWN/frozen-attempt state and recovery boundary are unchanged. Guidance and its accessible heading references are localized. Copy “Your matter, protected” from the first draft was replaced with the factual “Before you start”.
5. Responsive: the existing drawer replaces the sidebar; the toolbar stays available; guidance stacks; the small-screen brand uses the scale mark with an accessible product name. Text wraps without page overflow.

Ten application files are listed in `delivery-source-check.json`; all ten match the running snapshot byte-for-byte. No API, backend, schema, dependency, permission or idempotency implementation changed in this task. Prior Brief replay/preflight/navigation work remains intact.

## Verification

| Check | Actual result |
| --- | --- |
| Related command-palette / dashboard / data-task suites | **12/12 PASS**, including a new explicit search-label regression and existing task-switch draft-preservation tests. |
| Final complete frontend suite | **843 PASS / 1 FAIL / 12 SKIP**; 101 files pass, 1 fails, 1 skips. Failure is the unchanged `work/[itemId]/page.test.tsx:186` expectation for the old `Package and signature readiness` label. No test assertion was weakened to hide it. |
| `pnpm check` | Type generation/typecheck and ESLint PASS, then formatting stops at the existing `filing-guard-copy.test.tsx`. Snapshot excludes local Mimosa runtime history; the primary checkout also has the previously recorded history-file formatting issue. Full composite check is not PASS. |
| Changed-file ESLint and Prettier | PASS. |
| Final Webpack production build and CSS guard | PASS. |
| Final Storybook build | PASS. |
| Impeccable detector, seven changed UI targets | `[]`, exit 0. |
| Taste static app lint | **0 FAIL / 18 WARN**, exit 0. Warnings are the requested glass/elevation treatment and declarations removing it for fallback states; retained with explicit PO-reference rationale. |
| Hallmark static app sweep | **0 Floor FAIL / 1 REFLEX / 1 WARN**, raw exit 1. REFLEX 26b: TaskChoice has no disabled styling; it is an always-available local view selector without an async/disabled contract, manually retained rather than adding an unused state. WARN 41 points to forced-colors Canvas/CanvasText, which deliberately uses system colors. This is not reported as a mechanically clean sweep. |
| Git whitespace | PASS. |

Browser rendering used the approved in-app browser, not the skill scripts' separate Chrome/puppeteer render tier. `inspect.mjs` and `sloplint --render` were not run. Static lint counts do not establish rendered accessibility.

### Accepted browser evidence

- Final Data route, EN/dark: **1440, 768, 390, 320px**. Each measurement verifies the URL, width and **four visible task rows**, excluding hidden cached-route DOM. `scrollWidth == innerWidth`, rows and toolbar stay inside the canvas. `final-geometry.json` and matching `final-data-dark-*.png`.
- Final Data route, VI/light: **1440, 768, 375, 320px**. Same checks; localized titles/descriptions wrap without clipping. `final-geometry-vi.json` and `final-data-light-vi-*.png`.
- The browser authenticated via the previously authorized ordinary ZITADEL Cloud/SSO flow. No password, verification code, token or cookie was read/exported.
- Palette: localized search input opened; filtering `hồ` returned `Hồ sơ`. Native search input consumed the first Escape to clear its query; the second Escape closed the dialog and returned focus to `Tìm trang`. The initial immediate probe and its timeout are retained as inconclusive; no single-Escape-close claim. Unit keyboard checks passed separately.
- The user continued manual navigation in other tabs; early route-drift measurements are explicitly excluded below.

Internal fresh-context visual finish review (Local Codex subagent, not OpenCode): initially **recapture** for missing narrow/VI/light evidence, then **ship** after inspecting six final captures. No substantive visual defect found; original facts/actions preserved. This is a visual review, not full WCAG or business acceptance. See `internal-finish-review.md`.

## Provenance corrections

Preserve these early artifacts; do not use them as final coverage:

- `before-data-dark.png`: actually **605×851**, not a desktop-width baseline.
- `after-data-dark-1280.png`: actually **605×851**, despite the filename. Superseded.
- `after-data-dark-1440.png`: real 1440×900, but from the earlier build before the final guidance label and flat face.
- `data-dark-1440/768/390/320.png` and `geometry-dark.json`: the user navigated away while this batch ran; task nodes from a cached hidden route had zero dimensions. The screenshot is a Workspace list, not final Data evidence. Those rows are **INVALID_FOR_DATA_COVERAGE**.
- `verified-data-dark-390.png`: genuine Data route and visible rows, but earlier build. Superseded by `final-*`.
- `keyboard-browser.json`: immediate post-key snapshot preceded native cancellation completion and was followed by unrelated navigation. **INCONCLUSIVE**, superseded by the final documented two-Escape observation.

Before/after layouts were not captured at the same viewport, so no quantitative desktop density improvement is claimed.

## Local handoff

- App remains at **http://localhost:3000**; final Next listener PID **22234**, wrapper **22233**, cwd `/private/tmp/mc-pane-ui-20261101/frontend`.
- API listener remains **12838**, `127.0.0.1:8081`, with the same manual DB and object directory from the prior local task. No backend/container/database lifecycle change in this UI task.
- Frontend was replaced twice while finalizing the reviewed UI; memory sessions required ordinary sign-in again. The final build ran in the same isolated frontend directory as the first UI server; avoid this for future updates: build in a new directory before the swap so the live `.next` is never replaced underneath its reader. Final source/build/runtime identity was verified after restart.
- No preview/commit/import/export business command was submitted during visual QA. User-authored manual actions remain user evidence.
- Theme/language and viewport were restored after temporary QA overrides. User-controlled tabs/work were not overwritten. The final UI tab is retained.

No source commit, push, cloud mutation or deployment. Backend tests were not repeated for this UI-only change. Full screen-reader coverage, reduced-transparency/forced-colors runtime emulation, all authenticated business flows and complete rendered contrast certification remain unverified. Existing frontend test/format failures remain open; no P0/MC-002 acceptance gate was closed.
