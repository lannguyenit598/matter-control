# MC-OPENCODE-BATCH2-20261107 — Dispatch prompt (OpenCode: FE Next.js review + FE fix-wave confirmation)

Task ID: MC-OPENCODE-BATCH2-20261107
Routed by: Product Owner (2026-11-07) · Executor: **OpenCode** (independent non-author — required by both tasks).
Two sequential tasks, two separate outputs, two separate verdicts. Same discipline as MC-OPENCODE-CONFIRM-20261107: review-only, only your output files are written, no commits, no installs.

## 0. Identity and mode (binding)

- If the executing session authored any reviewed surface or is a ZCode/Codex session: STOP, return `CONFLICT_OF_INTEREST`. (A ZCode session previously returned COI on Task 1 — that gate works; you are the intended non-author.)
- Prefix every shell command with `rtk`; no `sed`/`perl -i` (Mimosa); synthetic data only; never bypass a hook refusal; record tool/version, exact commands, exit codes.
- Sessions may be active in this checkout: `git status --porcelain` per task, touch nothing outside your outputs, check `lsof -i :3000/:6006` before any server, never build into a shared `.next` while a writer is live, never kill processes you did not start.

## Task 1 — FE Next.js review (full dispatch, executed by you)

Execute `docs/implementation/handoffs/MC-FE-NEXTJS-REVIEW-20261106-PROMPT.md` **exactly as written** — it is self-contained (§1 pinning auto-re-pins from the stale `41098a4d` to actual HEAD and records it; §3 skill passes A→B→D→E→C with explicit skill invocation; §4 runtime rules incl. the shared-`.next` guard; §5 SOURCE_ONLY labelling; §6 output + verdict).

Notes for this execution:
- A prior attempt by a ZCode session returned `CONFLICT_OF_INTEREST` (correct §0 behaviour, no waiver granted); its pre-flight record lives in `docs/testing/fe-nextjs-review-20261106-r1/` — keep that dir and its RETURN record intact, write your report alongside it.
- If capacity is limited, the prompt's own priority order applies (A → B → D → E → C); record skipped passes as NOT_RUN, never infer them.
- Output: `docs/testing/fe-nextjs-review-20261106-r1/report.md` + `evidence/` + `commands/` — verdict `PASS | PASS_WITH_LIMITATIONS | CHANGES_REQUIRED | BLOCKED`.

## Task 2 — FE fix-wave MC-FE-FIXWAVE-20261107 confirmation

Self-authored wave (register §15), status `AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW`. Reviewed bytes: commits `fab42a89`, `b499c2d9`, `e6ce564b`, `9724cfa1`, `30ad569a`, `c03368a2` on `develop` (base pin `5a00dbc1`); first run `git log --oneline 5a00dbc1..HEAD -- apps/frontend` and confirm those are the binding commits; verdicts bind to them.

Confirm per item (spot-check, not re-implement):

1. **W1 (UX-B-11 → D-23)**: verify NO token/code change landed (`git show fab42a89 --stat` = decision-request docs only); the D-23 math file exists (`evidence/fieldface-math-output.txt`); independently spot-recompute ONE number (e.g. light 3:1 target field-composite luminance ≤0.277, dark darker-path impossible) from the method described.
2. **W2 (UX-B-01)**: `b499c2d9` diff = ReadFailure centring (+ partial denials inline preserved); before/after void captures exist and the recorded delta (47.8% → 19.7%) matches the captures; existing tests untouched-green.
3. **W3+W4**: `e6ce564b` — theme-color meta emitted through the **same data-theme mechanism** (init script pre-paint + toggleTheme; values from tokens, not hardcoded hex); `touch-action: manipulation` in one globals layer, no per-component sprinkling.
4. **W5 (P-08)**: `9724cfa1` — `lib/page-metadata.ts` reads the SAME `uiLocale()` D-2 mechanism (no parallel locale system); 13 static → generateMetadata + 4 dynamic + login; probe evidence shows vi → `Hồ sơ · MatterControl` at t=0, en unchanged; new tests 3/3 present.
5. **W6 (UX-B-12)**: `30ad569a` — favicon fix (`.storybook/static/favicon.ico` + staticDirs) and post-fix repro evidence showing 0×404.
6. **D-3 deviation flag**: independently confirm the flagged shipped labels exist as described ("Thủ tục"/"Bảng điều khoản" vs terminology-final "Hồ sơ khai") — confirming the FLAG is accurate is in scope; adjudicating the deviation is NOT (PO intake item).
7. **Gates re-run**: `pnpm check` in `apps/frontend` → exit 0; changed-story render spot-check (2 of the 5 changed stories) if `:6006` is free.
8. Confirm the wave closed nothing as independently verified; **D-23 was decided (Option C) after the wave** — W1's no-code-change outcome is confirmed as correct process, not a criterion closure; D-23-C implementation is out of scope here.

- Output: `docs/testing/mc-fe-fixwave-20261107-r1/confirmation.md` — header `CONFIRMATION_REVIEW (non-author — OpenCode)` — verdict `CONFIRMED | CONFIRMED_WITH_NOTES | NOT_CONFIRMED` + per-item results.

## Non-goals

No fixes (including no D-23-C implementation), no dependency changes, no lens re-runs, no adjudication of the D-3 deviation, no production/provider claims. `NOT_RUN` stays `NOT_RUN`.

## Return

Per task: verdict + output path + discrepancies. Overall: actual agent identity, commands/exit summaries, tests run vs NOT_RUN, skipped + remaining risk. After both: FE fix-wave W1–W6 becomes citable "owner-confirmed + non-author-confirmed (OpenCode)" and the FE Next.js review gains an independent verdict.
