# MC-OPENCODE-FE-CONFIRM-GROUP-20261107 — Dispatch prompt (OpenCode: fixwave batch 1+2 confirmation + W1 adjudication [+ FE Next.js review if absent])

Task ID: MC-OPENCODE-FE-CONFIRM-GROUP-20261107
Routed by: Product Owner via coordinator · Executor: **OpenCode** (independent non-author — binding).
Purpose: one session closing the FE confirmation debt — fix-wave batch 1 + batch 2 confirmations, the **D-23 W1 no-op reading adjudication** (the open question that decides whether any token change is needed at all), and — only if no results exist anywhere — the FE Next.js review.

## 0. Identity and mode (binding)

- If the executing session authored any reviewed surface or is a ZCode/Codex session: STOP, return `CONFLICT_OF_INTEREST`.
- REVIEW_ONLY. Writes: only the output files listed per task. No commits, no installs.
- `rtk` prefix on every shell command; no `sed`/`perl -i` (Mimosa); synthetic data only; record tool/version, exact commands, exit codes per task; never bypass a hook refusal.
- `git status --porcelain` per task; touch nothing outside your outputs; `lsof -i :3000/:6006` before any server; never build into a shared `.next` while a writer is live; never kill processes you did not start (a foreign `next dev` on :3000 has been seen in this checkout — probe as CLIENT if you need rendered output and it serves current bytes).

## Task 0 — Disk check (1 minute, decides Task 3)

`ls docs/testing/fe-nextjs-review-20261106-r1/` — if `report.md` exists (a prior session completed the review), Task 3 becomes VERIFY-ONLY: read it, spot-check 2 claims against disk evidence, write a 1-page verification note instead of re-running. If only `RETURN-CONFLICT-OF-INTEREST.md` exists (current state at prompt-authoring time), Task 3 = full execution.

## Task 1 — FE fix-wave batch 1 confirmation (MC-FE-FIXWAVE-20261107)

Execute **Task 2 of `MC-OPENCODE-BATCH2-20261107-PROMPT.md` exactly as written** (it is self-contained: W1 D-23 no-code-change + math spot-recompute, W2 centring + void captures, W3+W4 theme-color/touch-action mechanism, W5 page-metadata uiLocale, W6 favicon repro, D-3 deviation flag verification, `pnpm check` rerun, 2-story render spot-check). Reviewed bytes: `fab42a89`…`c03368a2` (base pin `5a00dbc1`).
- Output: `docs/testing/mc-fe-fixwave-20261107-r1/confirmation.md` — verdict `CONFIRMED | CONFIRMED_WITH_NOTES | NOT_CONFIRMED`.

## Task 2 — FE fix-wave batch 2 confirmation + W1 adjudication (MC-FE-FIXWAVE2-20261107)

Reviewed bytes: commits `00707d23`, `721bab57`, `c5020566`, `ce2858a4`, `48a9568d` (code) — verify via `git log --oneline 4068298b..HEAD -- apps/frontend` that those are the binding backend-unrelated commits. Confirm per item (spot-check, not re-implement):

1. **W1 — D-23 no-op reading ADJUDICATION (the decisive item)**. The wave claims the field's actual boundary indicator is the input border token `--input` (`globals.css:1123`), already ≥3:1 vs composites (3.646/5.676 panel, 3.842/5.445 popover — light/dark), while D-23's original math measured `--glass-edge` (a panel-decoration token). Adjudicate independently:
   a. Read the field layer CSS: is `--input` genuinely the rendered field border/boundary on glass surfaces (trace `[data-slot]` usage + the field-layer rules), and is `--glass-edge` genuinely not part of the field boundary?
   b. Recompute at least one composite with the recorded method (`fieldface-math.mjs` lineage in `docs/testing/mc-fe-fixwave-20261107-r1/evidence/`) — does `--input` clear 3:1 vs the panel/popover composites in both themes?
   c. Optionally, one rendered probe (ports free; Playwright `channel:'chrome'`, computed style of a rendered field border vs its parent composite) to corroborate the token math.
   - **Verdict line**: `W1 READING: UPHELD` (amended V-03 already satisfied; the "strengthen field edge" step of Option C is unnecessary — D-23 closes with no token change) **or** `W1 READING: REFUTED` (what actually fails 3:1, with numbers — D-23-C implementation reopens). This adjudication is authoritative for D-23; the PO ratified Option C's wording, and your measurement decides whether its implementation step is a no-op.
2. **W2 D-3 labels**: grep shipped copy for residual "Thủ tục" (expect 0 in product strings; fixtures/comments excluded — report what you find and where); confirm "Bảng điều khoản" was KEPT (guard — not in D-3) and appears in the wave's proposed-terms list; vi titles still correct via the batch-1 metadata mechanism.
3. **W3 refutation**: verify the composite math claim — `--pane-edge` rgb(86 94 111 / 0.22) composites to ≈1.35:1 on the card surface (recompute one value).
4. **W4**: light `--pane-shadow` alpha 0.08 + dark 0.24 with a defend-rationale comment verbatim.
5. **W5–W8 spot-checks**: fixture product voice (no "Acme Admin"/"Page title"); form stories ~420px; inline-edit pencil proximity with a11y attributes intact (aria-label unchanged); error line icon + `font-medium`.
6. **W9**: re-run the 4px-scale check (sloplint or equivalent) → 0 NOTEs on the two files.
7. **Gates**: `pnpm check` in `apps/frontend` → exit 0.
8. Confirm the wave closed nothing as independently verified; the transparency note (pre-populated evidence dir, `775c38b6`) is consistent with the dir contents.
- Output: `docs/testing/mc-fe-fixwave2-20261107-r1/confirmation.md` — verdict + per-item results + the W1 adjudication verdict line.

## Task 3 — FE Next.js review (conditional per Task 0)

Execute `docs/implementation/handoffs/MC-FE-NEXTJS-REVIEW-20261106-PROMPT.md` exactly as written (self-contained; §1 auto re-pins; skill passes A→B→D→E→C invoked explicitly; capacity order applies; skipped = NOT_RUN). Keep the existing `RETURN-CONFLICT-OF-INTEREST.md` intact; write alongside it.
- Output: `docs/testing/fe-nextjs-review-20261106-r1/report.md` + `evidence/` + `commands/` — verdict per that prompt's scale. (If Task 0 found a completed report: 1-page verification note `verification-opencode.md` instead.)

## Non-goals

No fixes (including no D-23 darkening regardless of your Task-2 outcome — implementation is a separate dispatch), no dependency changes, no lens re-runs, no production/provider claims, no re-adjudication of D-3 terminology or the gitleaks PO decisions. `NOT_RUN` stays `NOT_RUN`.

## Return

Per task: verdict + output path + discrepancies. Overall: actual agent identity, commands/exit summaries, tests run vs NOT_RUN, skipped + remaining risk. After Tasks 1–2: both fix-waves become citable "owner-confirmed + non-author-confirmed (OpenCode)" and D-23's implementation question is closed by measurement.
