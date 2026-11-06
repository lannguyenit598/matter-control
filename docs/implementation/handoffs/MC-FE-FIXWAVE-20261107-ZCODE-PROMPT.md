# MC-FE-FIXWAVE-20261107 — Dispatch prompt (implementation, frontend fix-wave batch 1, ZCode)

Task ID: MC-FE-FIXWAVE-20261107
Assigned by: Product Owner, direct instruction 2026-11-07. Executor: actual ZCode (PO routing; frontend execution formally sits with Antigravity under MC-002-INTA-FE-VALIDATION — this dispatch is the PO's reroute; record it in the return).
Scope source: `MC-FE-DESIGN-REVIEW-20261106` backlog (13 UX-B, 0 LANE-B) + its PROXY confirmation `CONFIRMED_WITH_NOTES` (`5a00dbc1`) + OpenCode recheck when it lands.
Status target: implement → gates → task-scoped commits → `AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW`. No DONE, no closure of review findings.

## 0. Mode

- Batch 1 only — 6 work items (§2). **Explicitly out of scope:** UX-B-13 (resolved RUNTIME_ARTIFACT — no action, do not "fix" the dialog), B-02/03/04/05/06/07/08 (batch 2), any lens re-work.
- Design boundary (binding): every change stays **LANE-A** — inside the approved Solid Glass intent (blur only overlays, near-opaque light faces, dark no saturation), D-3 terminology, existing token system. If an item cannot be done within LANE-A: STOP that item, prepare a `D-nn` decision request instead of improvising. Never re-propose adjudicated-rejected directions (glass-everywhere, radius 32, rainbow, overshoot, 58px titles).
- Commit authority: pre-authorized task-scoped (same discipline as MC-BE-FIXWAVE-20261106). Other sessions may be active — `git status --porcelain` before every commit; stage ONLY your paths.
- Commit message footer or body must cite the item IDs (UX-B-xx / P-08) for traceability.

## 1. Pinning — pre-flight

- Repo (absolute): `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` · Branch: `develop`
- Pinned base: `5a00dbc1` — re-pin to actual HEAD if moved; record; verify the §2 anchor files still hold at HEAD.
- Pre-flight: `git rev-parse HEAD`; `git status --porcelain`; confirm `apps/frontend` tools (`node --version`, pnpm present, node_modules exists — do NOT install); record Chrome availability.

## 2. Work items (order: contrast first — it is the a11y-relevant one)

### W1 — UX-B-11 (S–M): field-face contrast to ≥3:1
- Claim (PROXY-verified): `--field-face` tokens (`apps/frontend/src/app/globals.css:76-77` + dark counterpart — re-verify lines) measure 1.037 (light) / 1.188 (dark) vs glass composite; target ≥3:1 (P-10/V-03 closure path).
- Preferred fix: deepen the inset tint per theme until the recorded measurement method reports ≥3:1. Re-measure with the review's own contrast sweep method (see `commands/` transcript in `docs/testing/fe-design-review-20261106-r1/`) and put before/after JSON + method in evidence.
- **Guard:** if reaching 3:1 would break the Solid Glass intent (face must stay near-opaque-light) → STOP, write the D-nn with both options (deeper tint vs ratify rim-only affordance in the token comment) and leave the decision to the PO. Record the known limitation: final on-dialog measurement still awaits the populated walkthrough env (D-1(b)).

### W2 — UX-B-01 (P2): close the fail/empty first-screen void
- Claim: fail/empty canvas void 39–40% (`taste-inspect/app-matters/report.json`); surfaces: `app/(app)/*/page.tsx` ReadFailure branches + `dashboard-template.stories.tsx`.
- Preferred fix (from backlog): vertically centre the fail card at canvas height; one secondary context line under it is welcome but optional. Do both ONLY if it stays minimal.
- Acceptance: before/after Storybook captures + re-run of the same void measurement → materially reduced; story still passes.

### W3 — UX-B-09 (S): theme-color meta
- `apps/frontend/src/app/layout.tsx`: emit `<meta name="theme-color">` per theme (light/dark values from the existing token palette, via `media` variants or the app's theme mechanism — match how dark mode is actually driven in this app, do not invent a new one).

### W4 — UX-B-10 (S): touch-action on controls
- Add `touch-action: manipulation` to interactive controls in the globals layer (buttons, links, form controls) — one CSS layer, no per-component sprinkling.

### W5 — P-08 (STILL_OPEN): tab title follows locale
- Claim (PROXY-confirmed): tab title stays EN on vi pages — EN metadata at `app/(app)/workspaces/page.tsx:15` + template at root shell (`root-shell.tsx:23` — re-verify exact paths).
- Fix: titles must follow the SAME cookie-locale mechanism as page content (D-2 root-shell split; no parallel locale system). D-3 terms for any title copy ("Hồ sơ · MatterControl" style — follow `terminology-final.md`).
- Acceptance: locale probe (vi cookie → vi title, en → unchanged) on the affected routes; add/extend a test if a cheap one exists.

### W6 — B-12 (re-scoped): investigate the 404, do not blind-fix
- PROXY finding: badge story/component reference NO resource (grep exit 1) yet a console 404 appears every round — origin unidentified.
- Task: identify the actual 404 origin (Storybook console transcripts in `docs/testing/fe-design-review-20261106-r1/commands/` + `evidence/`, then reproduce once locally if needed — ports check first). If the origin is a trivial LANE-A fix (bad path, missing asset), fix it; otherwise return a written diagnosis only. Do not "fix the reference" that does not exist.

## 3. Gates before any commit

1. `pnpm check` in `apps/frontend` (typecheck + lint + format:check + test + agents:check) → exit 0. Existing suite baseline: ~830+ tests green; Storybook render baseline 72/72 (verify changed stories still render; run Storybook only if `:6006` is free).
2. Item-specific evidence per §2 (before/after captures, contrast JSON, locale probe output) into `docs/testing/mc-fe-fixwave-20261107-r1/` (`return.md` + `evidence/` + `commands/`).
3. **No shared-`.next` concurrency**: `lsof -i :3000` + `:6006` before ANY build/dev/Storybook; if a writer is live, coordinate or use an isolated worktree — never build over a live server.

## 4. Runtime rules

Prefix shell commands with `rtk` (host rule; `rtk proxy` for unwrapped). No `sed`/`perl -i` (Mimosa). No macOS `timeout`; `openssl rand` for randomness; shell vars do not persist between Bash calls. Semble-first for code exploration (record failure → targeted grep). No new dependencies, no `pnpm install`. Synthetic data only in captures/tests. Do not kill processes you did not start; do not touch `.mimosa/`, `.agents/`, `ops/`, other sessions' files.

## 5. Commits, register, return

- Commit plan: one commit per work item or logical pairs (e.g. W3+W4 web hygiene together); `fix(frontend): fix-wave MC-FE-FIXWAVE-20261107 — <items>` style; cite item IDs in the body.
- After the last commit: append register section (next free number — re-read `docs/implementation/workboard-findings.md` immediately before inserting; concurrent sessions are live) and commit it with the evidence.
- Return per orchestration protocol: task ID · actual agent identity · base/head per commit · changed files · acceptance per W1–W6 · tests run / NOT_RUN · risks · proposed next status `AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW` · end with **what was skipped and remaining risk** (expected skips: batch-2 items, populated-walkthrough-dependent final contrast measure, anything that hit the LANE-B guard).

## 6. Non-goals

No LANE-B changes, no dependency installs, no new design system, no backend edits, no re-adjudication of 2026-11-01 decisions, no production/provider claims, no closure of design-review findings (that requires the OpenCode confirmation), no Step 03 claims.
