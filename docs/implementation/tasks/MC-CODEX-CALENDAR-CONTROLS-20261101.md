# MC-CODEX-CALENDAR-CONTROLS-20261101

Owner: actual Local Codex. Priority P1 UI. Status IMPLEMENTED_SELF_TESTED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS.
Requirement: direct PO request to align tick selection and date calendar with current UI, and explicit selection of shared calendar popup/direct entry/device-zone behavior. Dependencies: BF-03 local-time semantics, shared Dialog/Select/Input, current Pane/glass tokens. Existing permission/command/draft contracts remain authoritative.
Allowed scope: shared calendar/selection UI, current consumers, tests/stories/styles and this evidence/task. No business/backend/API/DB/provider changes or dependency additions.
Inputs: current source at978d8fc; DESIGN/PRODUCT context; current date/time fields; checkbox/radio census; MDN Popover/anchor documentation via Context7. Output: shared controls plus sixteen-path candidate source manifest and docs/testing/codex-calendar-controls-20261101-r1/return.md.
Acceptance: shared caller coverage, native submission/key values, readonly zone/DST/untouched instant preserved; compact tick/large labels; keyboard/localization/draft/disabled tests; full frontend gates. Source/test gates PASS. Real browser/visual/physical-device/screen-reader acceptance NOT_RUN due official browser permission refusal despite PO reporting enabled.
Tests: pnpm check871pass/12skip/0fail; build:webpack+CSS guard and build-storybook exit0 on exact isolated final candidate. Receipts and environment errata retained. Backend tests skipped (unchanged).
Reviewer: independent nonauthor UI reviewer pending; PO manual local testing at localhost3000. No DONE/release approval. Next action: normal sign-in then rendered calendar/selection light/dark/EN/VI/320/390 check and independent review.
Skipped/risk: real browser top-layer/focus/a11y visual checks pending; inactive starter date-only input unchanged. No commit/push/deploy.
