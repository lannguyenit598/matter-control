# Work row-density icon correction

Actual Local Codex, 2026-10-29, direct PO screenshot follow-up. Scope: one Work route page, preserving existing dirty changes. Exact current HEAD/page hash in source.json. IN_REVIEW; independent review pending. No commit/push.

The underlined Comfortable/Compact text links are now a compact two-option group using installed Lucide Rows2/Rows3 icons with localized visible labels (Thoáng/Gọn). The selected link uses the existing outline button variant over a muted group surface, and retains aria-current. Group label is localized via aria-labelledby; decorative icons do not replace accessible names. Existing query-link construction/filter preservation and density values remain unchanged. scroll=false avoids jumping to the top. No backend, authorization, data or font change; no dependency or new component.

Verification: installed package exports confirmed for both icons; pnpm check exit0,76files/695tests plus typecheck/lint/format/agent checks. Isolated Webpack production build and compiled-CSS guard exit0; route source matches snapshot bytes. Existing WorkGrid compact-row tests run in the suite. No new test for the presentation-only markup. Existing isolated-build tracing warnings do not certify a deployable standalone image.

Skipped: authenticated rendered Work-page/browser/E2E check (current accessible tab has no Matters), new Storybook build (no shared component change), independent review and release checks. Risk: localized wrapping/geometry of this specific selector has source/build coverage, not live-browser acceptance. Existing product runtime retained; no lifecycle actions.
