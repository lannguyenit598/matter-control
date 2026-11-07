# MC-FE-DESIGN-CONFIRM-20261107 — OpenCode independent recheck of the PROXY confirmation

**CONFIRMATION_REVIEW (non-author — OpenCode)**

- **Task**: Task C of MC-OPENCODE-CONFIRM-20261107 (routed by the Product Owner). Executing session: OpenCode (independent, non-author; REVIEW_ONLY; this file is my only repo write — the live-repro script lives outside the repo in the approved session temp dir). Scope: **verify the PROXY's basis of confirmation, not re-run the review**.
- **Artifacts in scope**: r1 `report.md` (pin `41098a4d8690a1f3ce3864ace50fc20ca1221caa`), `backlog.md`, and the PROXY `confirmation.md` (commit `5a00dbc1`).
- **Environment**: OpenCode harness, model GLM-5.3-Flash Free. Node v24.22.1; Chrome 156.0.8078.80 via Playwright `channel:'chrome'`; Storybook v10.6.3 served from the repo's **existing** node_modules (no installs). All shell commands `rtk`-prefixed, raw output via `rtk proxy` where needed. Synthetic data only.

## 0. Pre-flight

- `git rev-parse HEAD` → `5a00dbc1…` on `develop` (exit 0).
- Byte basis: `git diff --stat 41098a4d..HEAD` on the five in-scope design files (`dialog.tsx`, `command-palette.tsx`, `quick-search.tsx`, `badge.tsx`, `badge.stories.tsx`) → **empty** (exit with no output; `diff_done` marker) — all reviewed surfaces at HEAD are byte-identical to the pin, so pin-byte reads and live HEAD serving coincide for this recheck.
- Concurrent writers: FE fix-wave prompts and `docs/testing/fe-nextjs-review-20261106-r1/` untracked (other sessions'); a concurrent FE writer with page-metadata edits went live mid-check and was never touched. Ports verified free before any server: `lsof -nP -iTCP:3000/-iTCP:6006 -sTCP:LISTEN` → nothing (both exit 1).

## 1. UX-R1-25 (PROXY determination: RUNTIME_ARTIFACT) — UPHELD

**Static chain at pin bytes (`git show 41098a4d:` …):**
- `molecules/dialog.tsx`: `onCancel` at **lines 67–70** → `onOpenChange(false)` on native close request; `onClose` (74–76) also resyncs state; `closeCount` reducer at :48 keeps the effect sensible when `open` flips. Exactly the PROXY's citation.
- `organisms/command-palette.tsx` (lines 1–120): owns the open state, renders `Dialog`, no independent Escape handling that could veto close.
- `features/search/components/quick-search.tsx`: passes through `CommandPalette` (trigger button + palette); the Quick-search component itself never intercepts Escape.

**Live repro (script `/private/var/folders/9b/…/opencode/mc-oc-uxr125-repro.mjs`, outside the repo):**
- Setup: `rtk pnpm run storybook --ci` on 6006 (dir was free), Storybook ready; reached `organisms-commandpalette--default` and `atoms-badge--variants` from `/index.json`.
- Script bug, fixed before the measured attempt: my story-id lookup was case-sensitive (`'Default'` vs lowercase matching) → first navigation rendered `id=undefined` (Storybook `NoStoryMatchError` in the server log) and timed out on the trigger selector. **No Escape keypress was consumed**; lookup fixed to case-insensitive compare, then the measurement ran.
- **Attempt 1 (of max 2) decisive** — trusted CDP keyboard Escape: before = `{dialogOpen: true, focusedTag: "INPUT", focusedAutofocus: true}`; after = `{dialogOpen: false}`; `dialogClosedByEscape: true`. Measurements identical to the PROXY's recorded values → the dialog **does close on trusted Escape** in this environment. Original GUI-side report of it not closing is confirmed as **RUNTIME_ARTIFACT**; the adaptive `data-autofocus` sub-claim (autofocus input focused at open time) also reproduced.
- Teardown: storybook server killed by its own PID (81065, found via `lsof -t` on 6006 — a process I started); port 6006 free after.

## 2. B-12 (badge 404) — occurrence confirmed; origin still unnamed; note: does not reproduce fresh

- **Occurrence** confirmed in the r1 evidence: the console line `Failed to load resource: the server responded with a status of 404 (Not Found)` appears in all five `evidence/screens/*/_results.json` (smoke, smoke2, lens1, lens2, lens3), **message-only — no URL captured** anywhere in the recorded transcript.
- **PROXY's grep claim independently confirmed**: `grep -rnE 'url\(|\.png|\.svg|\.ico|favicon|manifest|link rel|rel="' apps/frontend/src/components/atoms/badge.tsx badge.stories.tsx` → **exit 1** (zero resource references); `badge.stories.tsx` at pin read in full — pure component rendering, no image/link/asset.
- **Value-add 404-origin hunt**: from the recorded evidence alone the origin is not nameable (no URLs). On my own fresh `storybook --ci` session I instrumented `page.on('response')` (status ≥ 400) + `page.on('console')` error capture while loading `atoms-badge--variants` for 2.5 s → **zero failed responses, zero console errors** (Chrome 156 headless). The recorded 404 did **not** reproduce in my fresh session, so it points at something session/config or asset-specific in the r1 run rather than the badge story itself. Origin remains **unnamed**; this stays open for FE fix-wave W6 as a candidate lead, not a closure.

## 3. Contrast claim — exact recount

`grep -o '"result": "PASS"' evidence/contrast-results-r1.json | wc -l` → **44**; `"result": "FAIL"` → **4**; `"result"` occurrences → **48**. The recorded **44/48 PASS** stands exactly.

## 4. One disposition spot-check — P-08: VERIFIED

`git show 41098a4d:apps/frontend/src/app/(app)/workspaces/page.tsx` → `export const metadata: Metadata = { title: 'Workspaces' }` with `PageHeader` using `<LocalizedText en="Workspaces" vi="Không gian làm việc" />` — matches the disposition as recorded (EN metadata title is plain English; vi title correct).

## Verdict: **CONFIRMED_WITH_NOTES**

The PROXY confirmation's load-bearing claims all re-verified (UX-R1-25 static + live, B-12 occurrence + zero-resource grep, 44/48 contrast recount, P-08 spot-check). By extension the r1 review it confirms is non-author-confirmed on the items re-checked. Notes: (a) the recorded 404 does not reproduce in a fresh session and its origin cannot be named from the recorded evidence (no URL captured) — left open for FE fix-wave W6; (b) the first repro navigation failed on my own script's story-id case mismatch (no keypress consumed; recorded per evidence rules).

**Citation**: r1 + PROXY results may be cited in gates with attribution **"owner-confirmed + non-author-confirmed (OpenCode, this file)"** for the re-checked items.

## Skipped / remaining risk

- NOT_RUN stays NOT_RUN: contrast re-measurement (recount only, per dispatch), the remaining PROXY §3 dispositions (one spot-check mandated, one done), production/provider claims, vi-text sweep, SR pass, EXPLAIN/other lenses.
- Remaining risk/features: the 404 origin is unresolved (evidence has no URL); an unnamed session/config variable could explain the difference between the r1 run and this fresh run; nothing outside this file and the temp script was written or modified by this pass.
