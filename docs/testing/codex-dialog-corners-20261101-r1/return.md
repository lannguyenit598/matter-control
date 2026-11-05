# Dialog corner artifacts — Local Codex return

Task **MC-CODEX-DIALOG-CORNERS-20261101**; actual agent Local Codex. Branch/head `codex/unified-project-flow` / `978d8fc694a47e9beee528076bcf1af9473997e3` plus preserved dirty UI work. Status **IMPLEMENTED / LOCAL_BROWSER_VERIFIED / IN_REVIEW**; independent acceptance pending.

## Cause and correction

The screenshot's corner shapes were **backdrop-displacement artifacts**, not functional icons. Actual browser inspection reproduced them with matching 16px host/material radii and one `backdrop-filter: url(#mc-glass-…)` layer. Unlike the previous dense-panel problem, this dialog did not have a radius mismatch.

Shared Dialog now requests `refraction={0}`. GlassSurface honors zero refraction by omitting the optical layer and not generating/registering a displacement map. **Blur/saturation, translucent tint, specular edge, corner radius, native modal/focus behavior and stable wrapper identity remain.** Non-form surfaces retain their existing optics. Nothing clips the content or removes functional icons. No dependency, business, API, DB, permission or typography change.

Three source/test files: `apps/frontend/src/components/molecules/dialog.tsx`, `glass-surface.tsx`, `glass-tier-focus.test.tsx`. Exact pins in intake.json match the isolated built/runtime source at close. Existing Pane/list/navigation work remains untouched.

## Verification actually run

- Regression on old Dialog/GlassSurface with new tests: **1 FAIL /4 PASS**; the old liquid dialog registered a refraction-12 filter. See red.json and logs/red.log.
- Corrected shared dialog/material/focus/form-dialog suites: **16/16 PASS** (4 files). New tests check no optical filter for the form, retained non-form optics and input focus; existing tier-transition identity/value/focus cases remain green.
- Isolated source snapshot **pnpm check PASS:860 passed /12 skipped**; typegen/typecheck, lint, formatting and agents check pass. Snapshot excludes private env and immutable raw .mimosa history, without editing primary formatter rules. This is not a claim that the whole primary checkout including raw evidence was formatted.
- **Production Webpack build + compiled CSS guard PASS**; **Storybook build PASS**. Command/cwd/UTC/exit receipts and logs retained.
- Initial full-check attempt failed two env tests because this task's verification runner applied build-only API_MODE/API_BASE_URL to checks too. The runner was corrected to use clean test env/build-only overrides; no test/product changes were used to conceal it. Both attempts remain retained.
- Actual approved in-app browser: before artifact reproduced; after corners clean in **light/dark**, default viewport and **390px** mobile. Blur/tint/rim remain; zero refraction layer in dialog. Input initially focused; Tab reached submit; Escape closed dialog and returned focus to trigger. No form submitted during visual QA.
- Long Filing dialog at390×600:358px wide, no document horizontal overflow; scroll height716/client568, actual scrollTop148 brought submit button into viewport (top518/bottom562). No Filing command executed. Viewport override reset, light theme restored.

Screenshots: [before](before.png), [after light](after-light.png), [after dark](after-dark.png), [mobile light](after-mobile-light.png), [mobile dark](after-mobile-dark.png), [long form](after-long-form.png), [scrolled long form](after-long-form-scrolled.png). [Browser measurements](browser-checks.json).

## Local runtime handoff

Current frontend: **http://localhost:3000**, `/private/tmp/mc-dialog-corners-20261101-16bq2ao6/frontend`, listener **76415**, wrapper **76414**, build `34zfl9ofBfeLV-QYMe6RQ`. Source includes the current primary candidate, including prior committed G7 shell integration; its empty polite/atomic status region was observed in the live DOM, **not tested for actual speech**.

The new build was first checked at owned loopback3107 then stopped. Only old frontend39127 was SIGTERM'd after verifying listener/cwd/parent39126. New :3000 passed HTTP readiness. Retained private0600 local config was used by Node without exporting its values. **API8081 PID12838, DB/container/object resources and IdP settings unchanged.** Memory-session restart was followed by the normal existing Cloud SSO session; no password/token/cookie read or exported. Existing synthetic G1 fixtures remain intact; verifier designation approval is still pending and was not retried.

QA user tab is left at the repaired New workspace dialog with empty input. No new business records created. Private runtime logs remain private; public logs contain only checks/build/test output. Existing W2-BROWSER-01 stage-state defect is not fixed by this visual change and remains OPEN.

Skipped: actual screen-reader speech, physical Safari/iPad, exhaustive all-dialog/role validation and independent acceptance. No stage/commit/push/deploy or backend tests. Risk: runtime includes other pre-existing uncommitted UI work; scoped visual verification does not accept that entire tree or close G1/G7/P0/release gates.
