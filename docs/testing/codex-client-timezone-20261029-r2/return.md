# Device time zone only — selector removed

Actual Local Codex,2026-10-29. Supersedes the preceding R1 manual/automatic preference UX per the PO's latest instruction. Prior evidence remains historical and unchanged.

Removed the display-zone dropdown, stored preference reader/setter, manual-zone constants and storage/custom-event subscriptions. `LocaleToggle` now contains only language selection. Every display-zone consumer resolves the device's IANA zone and rechecks on window focus; UTC is only the stable SSR snapshot and detection-error fallback. Old `ui-time-zone` values are ignored, including explicit UTC. No localStorage cleanup/migration is required or performed.

Agenda copy now says device zone and no longer directs users to a removed Preferences control. Legal instants, wire values, dateTime attributes and explicitly offset date-entry forms are unchanged. New/updated tests prove absence of the dropdown, ignored legacy preference, device changes, DST, safe invalid detection, blocked storage and draft/instant preservation. Tests about other product behavior use an explicit mocked UTC display zone rather than writing an obsolete preference.

Checks observed: five focused files/49tests passed; isolated current-source Webpack build exit0 and compiled-CSS guard2assets passed; Storybook build exit0. An earlier copied test snapshot contained an invalid callable `deviceZone('UTC')`; retained its failed receipt and refreshed from current source, then typecheck/build passed. The final manifest pins8source/test files; no drift at post-build comparison. Whitespace check passed. Full `pnpm check` result is recorded separately in `checks.json` after completion.

No browser/IdP/runtime lifecycle action, provider/DB/API change, commit or push. Existing dev runtime can serve source updates; human reload is sufficient. Browser access remains disabled, so no rendered/hydration or independent acceptance is claimed. Proposed status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS.

Skipped: actual-browser visual checks. Risk: if device detection is unavailable, UTC is used; otherwise the display always follows the device, with no app-level override.
