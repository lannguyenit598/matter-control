# Automatic client display time zone

Actual Local Codex,2026-10-29. Direct PO request: automatically detect the client's time zone instead of defaulting the display selector to UTC. Source on `codex/unified-project-flow`; pre-existing dirty source preserved. No backend, auth, provider, stored timestamp or form-offset change.

Default preference is now **Automatic**, using the browser's `Intl.DateTimeFormat().resolvedOptions().timeZone`. Existing explicit manual preferences remain respected; the viewer can switch back to Automatic. Automatic stays automatic in storage, rather than freezing today's detected zone. Window focus refreshes the snapshot after device-zone changes. Invalid stored/detected values fall back safely; denied storage retains tab-local preferences. SSR keeps a stable UTC snapshot and updates to the actual client zone after hydration.

Dates use actual IANA zone rules, including DST, instead of treating every non-UTC zone as UTC+07. Agenda grouping and its zone label use that same display zone. `dateTime`, deadline inputs/explicit offsets, command values, receipt keys and saved instants remain unchanged.

Changed runtime source: `hooks/use-time-zone.ts`, `components/molecules/locale-toggle.tsx`, `lib/locale.ts`, `features/work/components/agenda-view.tsx`. Tests added for auto/New York, manual override/return, device-zone change/Tokyo, DST winter/summer, invalid zone and blocked storage. Existing UTC-specific tests now explicitly choose UTC. The stale MatterTabs8-link assertion was updated to include the already implemented ninth Agenda link; no navigation feature was added here.

## Checks

- Final `pnpm check`: exit0; typegen/TypeScript, ESLint, formatting,72files/656tests, agent checks passed.
- Focused timezone/localization/agenda/grid/scope/navigation:6files/56tests passed, exit0. Earlier timezone/localization/agenda-only run13tests passed.
- Fresh isolated full-source Webpack build: exit0, CSS guard2assets passed. First reused snapshot lacked the concurrently added agenda module and failed TypeScript; preserved that receipt and rebuilt from a fresh source-only snapshot. No private env copied; no dependency install, runtime restart or authenticated request.
- Storybook build: exit0, output under owned `/private/tmp/mc-workbench-build-ubh20n93/storybook-timezone`; existing bundle/module-directive warnings. No browser screenshot acceptance.
- Initial test authoring errors (unsupported matcher, missing `this` annotation and formatting) were corrected before the final gates. Full-suite checks also exposed UTC-default assertions and the stale navigation count, corrected as above.

Source/test hashes: `source-manifest.json`. Build receipts/logs retained here. Other test/check output is in tool history; no reconstructed raw logs claimed. Build tracing warnings stem from the snapshot's linked existing node_modules and do not establish deployable standalone packaging.

Proposed status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS, author verification only. Existing local dev server can consume these source changes without session replacement. No commit/push.

Skipped: real-browser hydration/time-zone switching and independent acceptance, since browser access remains disabled. Risk: explicit old UTC preferences deliberately stay UTC until the viewer chooses Automatic; display time never changes legal input/record semantics.
