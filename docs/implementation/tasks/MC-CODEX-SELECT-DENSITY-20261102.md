# MC-CODEX-SELECT-DENSITY-20261102

Owner actual Local Codex; priority P1; status IN_REVIEW. Inputs: direct PO screenshots/request, frontend-design skill, existing Pane tokens, Select API/callers and WorkGrid density. Requirements UI-SELECT-01 consistent popup, UI-DENSITY-01 visibly different spacing; preserve native forms, keyboard, validation, disabled/reset, all business state and prior Focus/Search work.

Scope: Select atom popup, its tests/stories, existing shared CSS and WorkGrid density hook. No BE/DB/auth or dependency changes. Branch codex/unified-project-flow; HEAD978d8fc694a47e9beee528076bcf1af9473997e3 plus preserved dirty candidate.

Acceptance: no platform-native dropdown in supported Popover browsers; checkbox selection indicator, wrapping, EN/VI/light/dark, Escape/keyboard and real native value/input/change/reset; measured compact rows shorter than comfortable, same rows/actions/filter state. Tests: pnpm check, Webpack/CSS, Storybook, official browser regression. Reviewer: independent followup pending, no self-awarded release PASS. Evidence docs/testing/codex-select-density-20261102-r1/.

Runtime: build isolated snapshot; refresh only task-owned3109 after verified PID/cwd. Existing3000/8081 and all DBs are protected. Memory BFF refresh ends old login epoch/Focus; warned before replacement. No commit/push/deploy assigned.

Author completion:901 pass/12 skip; Webpack/CSS + Storybook PASS. Official browser confirmed12px density difference, native form/filter behavior, keyboard Escape and nested-dialog operation. Return in the evidence directory; no independent acceptance or commit/deploy.
