# MC-FE-DESIGN-CONFIRM-20261107 — Non-author confirmation pass (dispatch prompt, lightweight)

Task ID: MC-FE-DESIGN-CONFIRM-20261107
Purpose: per ADDENDUM-2 of `MC-FE-DESIGN-REVIEW-20261106-PROMPT.md`, the design review r1 (PASS_WITH_LIMITATIONS, SELF-REVIEW / OWNER-CONFIRMATION) needs a **non-author confirmation pass** on `report.md` + `backlog.md` before its results can gate anything. This is a confirmation of recorded evidence plus ONE independent repro — **not** a lens re-run.

Can be combined in one dispatch with `MC-BE-ECHO-REVIEW-20261106-CONFIRMATION-PROMPT.md` (same reviewer, sequential tasks, separate outputs) if the router prefers.

## 0. Identity gate (binding)

- You must be an **independent, non-author reviewer** (OpenCode, OpenDesign, or any session that did not author the reviewed code). ZCode sessions authored the in-scope surfaces (Solid Glass, ⌘K, preflight, term-sheet FE, fix-wave UX items) — if you are one, STOP and return `CONFLICT_OF_INTEREST`.
- Mode: REVIEW_ONLY. Write only `confirmation.md` in the evidence dir. No code edits, no commits, no dependency installs.

## 1. Pin

- Repo: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`
- Reviewed bytes: `41098a4d` (review ran in an isolated worktree clean-at-pin).
- Pre-flight: `git rev-parse HEAD`; `git diff --stat 41098a4d..HEAD -- apps/frontend` — record. Spot-checks bind to `41098a4d` bytes: use `git show 41098a4d:<path>` when the file has moved. The ONE live repro (§2.2) runs against current HEAD and must state the exact HEAD used.

## 2. What to confirm (and nothing more)

1. **Evidence integrity** — `docs/testing/fe-design-review-20261106-r1/` contains report.md, 5 lens files, backlog.md (13 UX-B, 0 LANE-B), contrast JSON, command transcript, ~240 evidence files; the SELF-REVIEW label appears in report, lens headers and backlog. Transcript commands match claimed results (spot-check 2: Storybook 72/72 render claim; contrast 44/48 claim).
2. **UX-R1-25 independent repro (the one live task)** — claim: Escape does not close the Quick-search dialog after 2 GUI attempts despite `onCancel` at `dialog.tsx:67-70`. Independently determine **real bug vs runtime artifact**: start your own dev/Storybook instance (check `lsof -i :3000`/`:6006` first — never share a live writer's `.next`), drive Escape via Playwright-local or keyboard, capture the outcome. Verdict feeds backlog UX-B-13. If you cannot reproduce or the env blocks you, return `UNRESOLVED` with the exact blocker — do not guess.
3. **Spot-check 3 owner dispositions** — pick: UX-L-01 (Workspaces label now "Hồ sơ", not "Matters"); P-08 (tab title still EN on vi page — verify STILL_OPEN is accurate); one Z-F guard copy surface (source-level check vs approved UX copy in `terminology-final.md`).
4. **Spot-check 2 backlog factual bases** — B-09 (grep `apps/frontend` for `theme-color` meta: claimed absent) and B-12 (badge story references a 404 resource — verify from the story file, no Storybook run needed).
5. **Backlog lane check** — confirm all 13 items are genuinely LANE-A (inside Solid Glass intent, D-3 terms, existing tokens; nothing re-proposes an adjudicated-rejected direction).

## 3. Out of scope

Lens re-runs, prod build gate, screen-reader session, vi grep-sweep, populated runtime walkthrough, applying any backlog item, re-adjudicating 2026-11-01 decisions.

## 4. Runtime rules

Prefix shell commands with `rtk`; Semble-first (record failure → targeted grep); no `sed`/`perl -i` (Mimosa); no shared-`.next` concurrency; foreign dirty files untouchable; synthetic data only in captures; record tool/version, exact commands, exit codes.

## 5. Output and verdict

- File: `docs/testing/fe-design-review-20261106-r1/confirmation.md` — header `CONFIRMATION_REVIEW (non-author)`.
- Verdict: `CONFIRMED` | `CONFIRMED_WITH_NOTES` | `NOT_CONFIRMED` + per-section results + UX-R1-25 determination (REAL_BUG / RUNTIME_ARTIFACT / UNRESOLVED with blocker).
- On `CONFIRMED*`: r1 results may gate with attribution "owner-confirmed + non-author-confirmed (this file)". On `NOT_CONFIRMED`: discrepancies become new findings for coordinator intake; the waiver label stands.

## ADDENDUM-3 (2026-11-07) — PO-authorized proxy execution

The PO directed this confirmation to execute immediately via a **fresh-context ZCode subagent** instead of waiting for an OpenCode dispatch:

- Spawned by the coordinator session; carries no conversation history and authored none of the reviewed surfaces — non-author by construction.
- The run is valid only with the label `CONFIRMATION_REVIEW (PROXY — fresh-context ZCode subagent)` in `confirmation.md` §0.
- A PROXY confirmation is weaker than an external non-author product (same model family; instructions authored by the coordinator session). Task-level progress may proceed on it; an **OpenCode/OpenDesign confirmation remains recommended before any release-level gate** cites these results.
- §0–§5 rules otherwise unchanged. UX-R1-25 may end `UNRESOLVED` — an acceptable outcome, not a failure.
