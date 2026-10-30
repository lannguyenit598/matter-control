# Compact typography and wrapping correction

Actual Local Codex,2026-10-29. Scope follows PO feedback that text is too large and requests more icons plus clipping/layout inspection. This deliberately supersedes the earlier prototype-exact size values while retaining the selected focused-workbench composition. Existing dirty business/source changes preserved.

## Implemented

- App body14px, page heading26px(24px narrow), task heading28px(26px intermediate/24px narrow), nav/filter/body labels14px and section headings16px. Sidebar232px desktop/210px intermediate, smaller navigation icons and reduced section whitespace. Primary task button44px instead of56px; touch target safeguards remain.
- Removed nowrap/shrink constraints from shared text buttons, bounded them to the available width and allowed wrapping of long translated action labels. Kept icons nonshrinking. Business labels/warnings and confirmation behavior stay present.
- Dialog header now has a shrinkable/wrapping text column and16px snug title instead of18px leading-none. Shared list no longer clips outlines/long content with overflow-hidden. Scoped legal text wraps rather than being clamped/truncated.
- Queue labels/icons stay on one bounded scrollable region instead of wrapping into multiple rows; narrow icons remain visible. Added disclosure and sign-in/retry action icons using installed Lucide. No dependency or behavior/API change.

## Observed runtime

Official cua browser tools became available during this task. Real localhost3000 product at390px before login: document width390, h1computed24px, fonts loaded. User then signed in themselves. Account has no accessible workspaces; Codex created no business data to fill it.

At320px authenticated Workspace screen, actual create-workspace dialog opened without submission: document width320; dialog left16/right304/top174/bottom546(width288), no clipped buttons, Vietnamese text visually readable, close returned focus to the opener. Screenshot:`dialog-320.png`. No token/credential/session data read or copied.

Attempt to inspect1440px then failed with `browser.user is unavailable`; subsequent tab read also unavailable. Viewport capability reset succeeded, so no temporary override deliberately retained. No desktop, populated workbench/Grid or screen-reader acceptance claimed. Runtime not stopped/restarted.

## Checks and limits

Initial `pnpm check`: exit0,72files/665tests, typecheck/lint/format/agent checks passed. Shared read-failure icon addition followed; final recheck exit0,76files/692tests, typecheck/lint/format/agent checks passed. One intermediate run failed two retry/upload tests (690passed/2failed); isolated rerun passed8/8, then the unchanged full suite passed692/692. See `checks.json` and retained final log; no assertion or timeout relaxation. Isolated Webpack build/CSS guard passed and Storybook build passed; outputs retained outside the running frontend `.next`. Snapshot excludes private env, reuses existing dependencies without install. Snapshot symlinks cause standalone file-tracing warnings, not a deployable-image verdict.

Source hashes: `source-manifest.json`. Browser measurements:`browser-checks.json`. `git diff --check` clean. Author changes remain IN_REVIEW_WITH_VERIFICATION_BLOCKERS. No commit/push/deploy; browser observations are author runtime evidence, not independent review or legal-team comprehension proof.

Next: independently review typography/wrapping source, restore tab access and test actual populated workbench, long content and dense tables. Current account's empty scope limits data-bearing checks.

Skipped: desktop/populated layouts after tool disconnect and full-browser end-to-end. Risk: the global text-button wrapping change intentionally alters long-label height; affected flows still need real desktop and narrow regression beyond the observed dialog.
