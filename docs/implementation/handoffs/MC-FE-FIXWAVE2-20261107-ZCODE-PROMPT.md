# MC-FE-FIXWAVE2-20261107 — Dispatch prompt (implementation, frontend batch 2 + D-23-C + D-3 labels, ZCode)

Task ID: MC-FE-FIXWAVE2-20261107
Assigned by: Product Owner via coordinator ("viết prompt cho các phần không bị chặn"). Executor: actual ZCode (PO reroute from Antigravity — record in return, same as batch 1).
Scope sources: D-23 disposition (Option C, PO-decided — `docs/testing/mc-fe-fixwave-20261107-r1/D-23-field-face-contrast.md` §Disposition), design-review backlog UX-B-02..08 (LANE-A, all confirmed by OpenCode PROXY + recheck), D-3 deviation flag from fix-wave batch 1 W5.
Status target: implement → gates → task-scoped commits → `AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW`. No DONE, no closure of review findings.

## 0. Mode and boundaries

- 9 work items (§2). Out of scope: anything else; batch 3 will absorb MC-FE-NEXTJS-REVIEW findings when its return is intaken — do not pre-empt it.
- LANE-A binding (identical to batch 1): approved Solid Glass intent, D-3 terminology, existing tokens. Item that cannot stay LANE-A → STOP, write D-nn. Never re-propose rejected directions.
- If the OpenCode batch-2 return (`MC-OPENCODE-BATCH2-20261107`) is intaken before you start and surfaces P0/P1 FE findings, note them as batch-3 candidates — do NOT fix them here unless the PO says so.
- Commit authority pre-authorized task-scoped; `git status --porcelain` before every commit; stage only your paths; cite item IDs in commit bodies.

## 1. Pre-flight

- Repo: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` · Branch `develop` · Pinned base: record `git rev-parse HEAD` at start (re-pin rule; batch-1 landed through `c03368a2`, OpenCode confirmations after — backend bytes unchanged by docs commits).
- `git status --porcelain` (foreign dirty files untouchable); node/pnpm present, node_modules exists (no installs); Chrome availability; read `docs/testing/mc-fe-fixwave-20261107-r1/D-23-field-face-contrast.md` §Disposition before W1.

## 2. Work items (priority order)

### W1 — D-23-C implementation (decided; a11y-relevant)
- Per the D-23 §Disposition: strengthen the field **boundary indicator** to ≥3:1 vs glass composite **in field contexts only** — current edge 1.218 (light) / 1.635 (dark). Mechanism must be a field-context-scoped override (modifier/class or dedicated field-surface variables) — do NOT change global `--glass-edge`/`--glass-field-rim` values (other glass surfaces must stay untouched).
- Acceptance: `fieldface-math.mjs` method re-run → edge-vs-composite ≥3:1 per theme recorded; token comment updated to the **amended V-03 wording** (from the D-23 disposition — carry it verbatim into the token comment); visual spot-check that non-field glass surfaces are unchanged (captures before/after); full test suite green.

### W2 — D-3 deviation labels (user-visible copy)
- Batch-1 flag: shipped labels "Thủ tục"/"Bảng điều khoản" deviate from `terminology-final.md` (D-3 FINAL: Filing = "Hồ sơ khai"/"Khai", Approval = "Chấp thuận"…). Titles were locale-corrected onto those shipped labels in `9724cfa1` — so fix the LABELS first, titles follow the same mechanism.
- Sweep the flagged surfaces (matter-tabs + H1 + wherever the two labels render), map each to the D-3 term, fix label + any test fixtures asserting the old string.
- **Guard:** if a term is NOT covered by terminology-final (term-sheet vocabulary may not exist in D-3), keep the current label and add it to a "proposed terms for OpenDesign adjudication" list in the return — do not improvise vocabulary.

### W3 — UX-B-02 (S): fixture borders
- `dashboard-template.stories.tsx` liquid fixture + glass CSS: align fixture panel borders into the `--workbench-border`/`--glass-edge` whisper range (1.1–1.3:1) — measured 5.69:1 (#57606d on #f1f2f5). Capture before/after.

### W4 — UX-B-03 (S): glass shadows defend-or-tune
- Measured rgba(38,44,57,0.1) panel shadows. Choose ONE and record why in the token comment: (a) tune to ≤8% alpha, or (b) ratify the Solid-Glass thickness defence. Pick by visual risk (if ≤8% visibly flattens the panels in captures, defend instead). Either way, document the decision.

### W5 — UX-B-04 (S–M): fixture copy sweep
- Storybook fixtures using placeholder voice ("Acme Admin", "Page title") → product voice + D-3 terms, so Storybook stays a faithful design-review surface. No product-code copy changes in this item — fixtures only.

### W6 — UX-B-05 (S): form stories width
- `molecules/form-field.stories.tsx`, `atoms/select.stories.tsx`: realistic max-width container (~420px) instead of full-1440 inputs.

### W7 — UX-B-06 (S): inline-edit affordance
- `organisms/inline-edit.tsx`: bring the edit affordance into text proximity / hover-reveal near the text (current: distant). Keep keyboard reachability intact (tests + a11y attributes unchanged in behaviour).

### W8 — UX-B-07 (S): error precedence
- `molecules/form-field.tsx`: when error and helper text both render, error line gets visual precedence (weight/icon per existing primitives). Do not remove helper text.

### W9 — UX-B-08 (M): 4px spacing scale normalisation
- sloplint 36 off-4px-scale NOTEs (`globals.css:815-897`, `pane-workbench.css:290,373` — re-verify at HEAD): normalise paddings/gaps to the 4px grid **where visually equivalent** (±2px); off-grid values that are deliberate get a one-line `/* 4px-exception: <why> */` comment instead of blind rounding. Record normalised vs exception counts.

## 3. Gates before any commit

1. `pnpm check` in `apps/frontend` → exit 0 (typegen+tsc, eslint, prettier, vitest, agents:check). Baseline: 954 passed | 12 skipped (125 files) — must not regress.
2. Item evidence: W1 fieldface re-measure JSON + non-field captures; W2 label probe (vi → corrected labels); W3/W4/W6 before-after captures; W9 normalised/exception counts. All into `docs/testing/mc-fe-fixwave2-20261107-r1/` (`return.md` + `evidence/` + `commands/`).
3. Shared-`.next` rule: `lsof -i :3000` + `:6006` before any build/dev/Storybook; Storybook runs only if `:6006` free.

## 4. Runtime rules

`rtk` prefix on every shell command (proxy for unwrapped); no `sed`/`perl -i` (Mimosa); no `timeout` cmd; `openssl rand` for randomness; shell vars do not persist between Bash calls; Semble-first (record failure → targeted grep); synthetic data only; no new dependencies; do not touch other sessions' files, `.mimosa/`, `.agents/`, `ops/`.

## 5. Commits, register, return

- Commits: logical groups (e.g. W1 alone; W2 alone; W3–W6 fixture/story hygiene together; W7+W8 component UX; W9 alone) — `fix(frontend): fix-wave2 MC-FE-FIXWAVE2-20261107 — <items>`.
- After last commit: append register section (next free number — re-read immediately before insert; concurrent sessions live) + commit evidence.
- Return per orchestration protocol: task ID · actual agent identity · base/head per commit · changed files · acceptance per W1–W9 · tests run/NOT_RUN · risks · proposed next status `AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW` · end with **skipped + remaining risk** (expected: on-dialog final contrast measure still awaits walkthrough env; any D-3-unmappable terms flagged; batch-3 candidates listed not fixed).

## 6. Non-goals

No LANE-B, no new deps, no backend edits, no prod build/e2e unless ports allow and time permits (record NOT_RUN otherwise), no closure of review findings, no re-adjudication of D-3 or D-23, no production/provider claims.
