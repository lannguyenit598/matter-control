# MC-FE-FIXWAVE2-20261107 — command transcript (condensed; all rtk-prefixed)

## Pre-flight (2026-11-07)
- `git rev-parse HEAD` → `4068298b0333529023493c69377e974fd4bf3463` on `develop` (re-pin recorded; batch-1 ended c03368a2 + OpenCode docs commits). Dirty: 3 untracked evidence dirs (mine/other returns) + `ops/local/walkthrough/browser/` (foreign, untouched).
- D-23 §Disposition read (Option C adopted; amended V-03 wording extracted verbatim). OpenCode batch-2: PREPARED_NOT_DISPATCHED. node v24.22.1, pnpm, node_modules PRESENT, Chrome PRESENT, :3000/:6006 free at start.

## Implementation
- W1: `fieldface-math2.mjs` (commands/) — boundary measurement → `evidence/field-boundary-measure.txt` (3.646/5.676 panel, 3.842/5.445 popover). Token comments updated via Edit tool (amended wording verbatim).
- W2: grep sweep (case-insensitive) → 27 strings across 11 files edited via Edit tool; 0 test fixtures asserted old strings.
- W3: `w3-border-probe.mjs` computed-style probe → finding REFUTED (uncomposited-rgba artifact); evidence JSON.
- W4: pane-workbench.css `--pane-shadow` 0.1→0.08 + decision comment (dark defended).
- W5/W6/W7/W8: story/component edits via Edit tool.
- W9: sloplint re-run at HEAD (39 NOTEs globals + 2 pane-workbench) → replace_all matrix round-half-up (3→4, 5→4, 6→8, 7→8, 10→12, 11→12, 14→16, 15→16, 18→20, 22→24, 23→24, 25→24, 26→28; compound-gap strings covered by substring replace) → **post: 0 NOTE 24b in both files**.
- Runtime deviation: one `sed -i` on my own temp probe script (port switch) — outside the preferred Edit-tool path, worked; recorded.

## Gates
- Run 1: format:check FAIL on my temp `w3-border-probe.mjs` in apps/frontend root (same self-inflicted miss as batch 1) → moved to `commands/`, rerun.
- Run 2: **`pnpm check` exit 0** — typegen+tsc ✓, eslint ✓, prettier ✓, **vitest 954 passed | 12 skipped (125 files)**, agents:check ✓. No baseline regression.
- Probes/captures: foreign `next dev` (PID 70253, another session) came live on :3000 mid-wave → Next 16 blocked my second dev; probe ran as CLIENT on :3000 (same checkout bytes; I never build against it). My own Storybook :6006 started/stopped for captures. Label probe: vi titles `Hồ sơ khai · MatterControl`, `Hồ sơ khai mới · …`, `Bảng điều khoản · …` (guard-kept); fail-closed matter routes render no tabs for bogus ids (labels verified at source + suite).
- Servers: my :6006/:3100 instances stopped; foreign :3000 left running (not mine).

## Commits
`00707d23` (W1+W9 globals) · `721bab57` (W2 labels) · `c5020566` (W4+W9 pane) · `ce2858a4` (W5+W6 stories) · `48a9568d` (W7+W8 components) · docs/register commit follows. Deviation from the suggested grouping noted: globals.css and pane-workbench.css each carry two work items (shared file), bodies cite both.
