# MC-CODEX-DARK-GLASS-20261030 — author return

Actual Local Codex; branch `codex/unified-project-flow`; base/head `0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee`. Proposed status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS. No external agent invoked, commit, push, deployment or project gate closure. Existing Liquid Glass edits and unrelated concurrent OpenCode outputs retained.

## Changes

Four source files pinned in source-manifest.json. The shared stylesheet now uses visible light rims on dark panes/popovers, less dark shadow, clearer field boundaries in both modes, brighter/lower-chroma status text, a dark warning foreground, and a restrained specular sheen on filled buttons. Workbench palette declarations moved to root/theme tokens without changing their values; the existing data-theme initialization/toggle is preserved. Existing Storybook stories gain explicit dark workbench/button variants and a complete dark badge census. Native controls, labels, status meanings, layout, auth, API and data are unchanged by this increment.

## Verification

- Whitespace: scoped four-file diff check exit0. Whole-tree diff check finds an EOF blank in concurrent OpenCode QA output; preserved, outside this task.
- Final frontend check: exit 0; 731 passes / 12 skips; 84 passing files / 1 skipped. Typecheck/lint/format/agent checks pass.
- Exact new runtime snapshot: Webpack production build and compiled-CSS guard exit 0. The earlier in-repository build also passed but preceded the last token relocation; runtime-build is the final-byte evidence.
- Final Storybook build exit 0; upstream module-directive warnings retained in log.
- Final contrast model: 96/96 selected pairings pass, across light/dark root and workbench scopes. Original material: 24/96 below the selected thresholds. Tests include text >=4.5 and field/focus >=3, eight axis/status badge treatments, filled actions and the maximum button sheen. RGB alpha compositing over a conservative stack of all three canvas tints, then pane/row surfaces. Conversion clamps out-of-sRGB channels. Self-checks: black/white ratio21 and OKLCH endpoints. This is a selected-token calculation, not exhaustive CSS/computed-style or WCAG certification; it omits specular overlay/light behind actual SVG layers, adjacent colors of every component and browser-specific color interpolation. before-globals.css is retained for reproducing the original failures.
- Hallmark static: exit0, 0FAIL / 6WARN / 33NOTE on the stylesheet. WARN dispositions: glass/material and repeated surfaces retained by direct PO direction; dark surfaces inherit foreground through the app/root rather than redeclaring it, numerical pairs checked; balanced headlines not changed in this token-only polish. Spacing notes retain the existing approved composition.
- Taste static: exit1, six gradient flags plus glass/shadow warnings and one mono-token warning. These are explicit design exceptions: the PO requested Liquid Glass, the specular/canvas gradients produce that material, and the monospace token is retained for technical code consumers. No clean Taste or rendered-pass claim.
- Browser: BLOCKED_TOOL_DISABLED (local browser use disabled in Work settings). No headless/browser/OS-capture bypass. Rendered contrast, geometry, keyboard, touch and screen-reader checks remain NOT_RUN. Skills used: frontend-design, design-taste-frontend app-screen guidance, Hallmark dark-mode/polish guidance. Kept existing 14px app typography and Vietnamese font instead of a marketing-page type system.

## Local runtime

New Codex-owned frontend snapshot serves http://localhost:3000/workspaces (login may be required), with two compiled CSS assets and the new status/input/action-sheen tokens confirmed over HTTP; login200 and API health200. Only the identity-verified prior Codex frontend71345 was stopped; new frontend15074. API8081, PostgreSQL, objects and all QA resources retained. See runtime.json. Memory BFF restart invalidates its existing sessions. A first readiness assertion expected decimal instead of percent OKLCH output and failed after successful startup; the corrected read-only probe passed without a second restart (runtime-probe-erratum.json).

## Remaining review

Independent nonauthor review and PO visual acceptance are pending. Manually inspect workspaces, Control Room, records/table rows, form focus/invalid/disabled/loading states, popovers and dialogs in both themes at desktop/mobile widths; check the Vietnamese labels and reduced-transparency mode. No claims for production, IdP journeys, all P0 workflows or release acceptance.

Skipped: browser/visual/accessibility execution, backend/recovery/IdP suites, commit/push/deploy. Remaining risk: numerical contrast and source/build checks cannot establish real rendered legibility, SVG refraction, focus or device performance.
