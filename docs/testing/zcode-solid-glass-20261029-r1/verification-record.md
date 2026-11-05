# Verification record — Solid Glass Phase C (2026-10-30)

Actual ZCode session. All gates on final bytes unless noted; the one CSS-only `-webkit-` prefix removal happened after the first full test run and before the second (both receipts retained).

## Gates (fresh receipts)

| Gate | Command | Result |
|---|---|---|
| Typecheck | `pnpm exec tsc --noEmit` | exit 0 |
| Affected component tests (pilot) | `pnpm vitest run src/components src/features/review src/features/work` | 29 files / 218 tests pass |
| Full frontend test (run 1, pre-CSS-tweak) | `pnpm test` | **78 files / 707 tests pass** (`final-frontend-test.log` was overwritten by run 2; counts quoted here) |
| Full frontend test (run 2, final bytes) | `pnpm test` | **1 failed / 706 passed** — see flake below |
| Full frontend test (run 3, after repeats) | `pnpm test` | **78 files / 707 tests pass** |
| Production build Turbopack + CSS guard | private tree, `node node_modules/next/dist/bin/next build` + `check-built-css.mjs` | exit 0, "Compiled CSS verified: 1 assets" (`pilot-build-turbopack.log`) |
| Production build Webpack + CSS guard (final bytes) | same, `--webpack` | exit 0, **"Compiled CSS verified: 2 assets"** (`final-build-webpack.log`) |
| Build after the `-webkit-` fix + CSS guard | `--webpack` rebuild of the private tree with the final globals.css | exit 0, guard pass (`pilot-build-webpack-recheck.log`) |
| ESLint on `src/` | `pnpm exec eslint src` | clean (`final-eslint.log`) |
| Prettier on `src/` | `pnpm exec prettier --check src --ignore-unknown` | "All matched files use Prettier code style!" (`final-prettier.log`) |
| Storybook build | `pnpm exec storybook build -o /private/tmp/mc-sg-storybook-20261030` | build success (`storybook-build.log`) — **runtime render is a BASELINE failure**, see below |
| Storybook runtime | rendered `atoms-button--variants` and `molecules-feedback-data-display--alerts` from the static build | **ALL stories fail identically**: `TypeError: Cannot read properties of undefined (reading 'data')` in the built iframe bundle (react-18 chunk; `react-18-aI7pQMBn.js`) — including stories that contain none of this session's touched components. Classified BASELINE (pre-existing static-build runtime incompatibility; build ≠ runtime, and this session's changes are CSS + plain DOM attributes). Not fixed here (tooling outside visual scope); retained as a finding for the tooling owner. |

## Rendered evidence (fixture rendering — compiled production CSS, synthetic content; NOT authenticated product rendering)

- `fixture-light-1440.png` / `fixture-dark-1440.png` — real compiled `.next/static/css` assets over representative product markup (sidebar panel, selected nav state rim, primary/outline/disabled buttons, fields with rim, badges incl. warning/verification, near-opaque card with edge finish, open dialog on the popover ladder).
- Computed-style receipts (1440px): buttons same-tier height uniform; input `border 1px` + rim inset; card `box-shadow: oklch(1 0 0 / 0.9) 0 1px 0 inset, …`; dialog `background oklch(0.995 0.003 265 / 0.97)`, border `oklch(0.38 0.03 265 / 0.18)`, **`backdrop-filter: blur(26px) saturate(1.5)`**.
- 320px: `horizontalOverflow: false` (`scrollWidth 320 == clientWidth 320`).
- Fix found during measurement: the hand-written `-webkit-backdrop-filter` prefixes made lightningcss DROP the standard property in the built CSS (computed `none`). Fix: standard property only → lightningcss emits both (`-webkit-backdrop-filter` + `backdrop-filter` verified in the rebuilt CSS). Re-verified by computed style.
- NOT_RUN: authenticated product rendering (OWNER/EDITOR/VIEWER journeys, My Work live geometry, EN/VI long text in situ) — requires the runtime-owner handoff + human-assisted login; screen-reader pass NOT_RUN.

## Flake record (retained failure — baseline, not introduced)

Run 2 hit `src/test/action-entry.test.tsx > Planning: each section owns its button > keeps a typed draft across close and reopen, then closes on a confirmed save`: `expect(dialog).not.toHaveAttribute("open")` received `open=""`. The file is NOT touched by this session; the test asserts dialog-close immediately after `findByText('Workstream added.')` with no intermediate wait — a click→close race under parallel-worker load (same reliability class as the previously recorded proof-upload/action-entry flakes). Repeats: the file alone passed ×2 (12/12); full suite rerun passed 78/707. No assertion weakened, no timeout changed; failure classified baseline and left for the feature owner.

## Cleanup

Session-owned resources removed: Storybook static output, fixture dir, private build trees (`/private/tmp/mc-sg-*`), local HTTP servers on 4180/4181. Workspace `.next` untouched throughout.
