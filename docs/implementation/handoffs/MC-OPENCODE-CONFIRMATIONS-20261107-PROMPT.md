# MC-OPENCODE-CONFIRM-20261107 — Dispatch prompt (OpenCode: 3 confirmation tasks, sequential)

Task ID: MC-OPENCODE-CONFIRM-20261107
Routed by: Product Owner · Executor: **OpenCode** (independent non-author — this is the point of the whole exercise).
Purpose: three lightweight confirmations that unblock gating of owner-side verdicts. All are confirmations of recorded evidence plus bounded re-runs — **not** re-reviews. One session, three tasks, three separate output files, three separate verdicts.

## 0. Identity and mode

- If the executing session is a ZCode/Codex session or authored any reviewed surface: STOP, return `CONFLICT_OF_INTEREST` per task.
- Mode: REVIEW_ONLY. Your only writes are the three confirmation output files (§4). No code edits, no commits, no dependency installs.
- Every output carries header `CONFIRMATION_REVIEW (non-author — OpenCode)`.
- Prefix every shell command with `rtk`; no `sed`/`perl -i` (Mimosa); synthetic data only; never bypass a hook refusal. Record tool/version, exact commands, exit codes per task.
- Backend fix-wave and other sessions may be active: check `git status --porcelain` per task, touch nothing outside your outputs, never kill processes you did not start, check `lsof -i :3000/:6006` before any server, never build into a shared `.next` while a writer is live.

## Task A — BE Echo review r1 confirmation

Execute `docs/implementation/handoffs/MC-BE-ECHO-REVIEW-20261106-CONFIRMATION-PROMPT.md` exactly as written (it is self-contained: 5 sections incl. one `make check` re-run on your **own throwaway PG** — the old fixture `mc-r2-check-pg` is gone; use a free port, e.g. 5436).

- Reviewed bytes: `b86152d2` (pre-flight inside that prompt handles drift via `git diff --stat b86152d2..HEAD -- apps/backend`).
- Output: `docs/testing/be-echo-review-20261106-r1/confirmation.md` — verdict `CONFIRMED | CONFIRMED_WITH_NOTES | NOT_CONFIRMED`.

## Task B — BE fix-wave MC-BE-FIXWAVE-20261106 confirmation

Self-authored wave (register §13), status `AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW`. Reviewed bytes: fix-wave commits `66993366` (W1) + `07d6f595` (W2/W3), evidence commit `d7c521bd`; first run `git log --oneline 276a1e68..HEAD -- apps/backend` and confirm those are the ONLY backend-touching commits; verdicts bind to them.

Confirm each item (spot-check, not re-implement):

1. **W1 echo bump**: `apps/backend/go.mod` pins `github.com/labstack/echo/v5 v5.4.1`; the `276a1e68..07d6f595` go.mod/go.sum diff is minimal as claimed (1 line go.mod, ~4 lines go.sum, no unrelated transitive upgrades); re-run govulncheck (`go run golang.org/x/vuln/cmd/govulncheck@latest ./...` in `apps/backend`) → expect **0 "code is affected"**; verify the 2 INFO entries (GO-2026-6866/6860, x/net) are genuinely required-but-not-called.
2. **W2 deleted counter**: read the `07d6f595` diff — `Deleted` on `port.TermSheetImportResult` + `matter.TermSheetImported` + event map + HTTP response; semantics match the pinned contract (`Replaced` = "prior lines that did not survive", `Deleted = Replaced − re-created` per `contract_termsheet.go`); replay of pre-wave receipts decodes `Deleted=0` without error; failing-before evidence exists in `docs/testing/mc-be-fixwave-20261106-r1/`.
3. **W3 keyset**: `matter.sql:147-148` uses row comparison `(recorded_at, seq) > ($1, $2)`; sqlc regenerated diff is the single predicate; boundary test `TestEventsPage_CursorReturnsEqualTimestampGreaterSeq` exists and runs in the suite.
4. **W4 adjudication (reconcile a recorded discrepancy)**: register §12 + ERRATUM-1 claim `apps/backend/docs/api.md.orig` existed (from `git ls-files` at `276a1e68`); fix-wave §13 returned NOT_FOUND. Determine the truth: `git log --all --full-history -- apps/backend/docs/api.md.orig` + `git cat-file -e 276a1e68:apps/backend/docs/api.md.orig` + filesystem. State which observation was wrong and the recommended ERRATUM-1 correction.
5. **Gate re-run**: `make check` in `apps/backend` with your own throwaway PG → exit 0.
6. Confirm the wave closed **nothing** as independently verified (status semantics intact).

- Output: `docs/testing/mc-be-fixwave-20261106-r1/confirmation.md` — verdict + per-item results + the W4 adjudication.

## Task C — FE design review: external recheck of the PROXY confirmation (optional if capacity runs out)

The design r1 (`docs/testing/fe-design-review-20261106-r1/`, pin `41098a4d`) is owner-confirmed + PROXY-confirmed (fresh-context ZCode subagent, `confirmation.md`, `5a00dbc1`). Your job: **verify the PROXY's claims independently**, not redo the review:

1. **UX-R1-25** (PROXY determination: RUNTIME_ARTIFACT): re-verify the static cancel chain by reading `dialog.tsx` + the Quick-search component at `41098a4d` bytes (`git show`), then — ports free only — ONE live repro (Playwright `channel:'chrome'`, trusted keyboard Escape, max 2 attempts). If you reproduce close-on-Escape → RUNTIME_ARTIFACT upheld; if you cannot close it where PROXY could, return the discrepancy with full env details (this would be a REAL_BUG candidate → coordinator intake).
2. **B-12**: independently confirm the badge story/component reference no resource (grep exit 1 claim), and — value-add — attempt to identify the ACTUAL 404 origin from the review's Storybook console transcript (`commands/`/`evidence/`); a named origin feeds FE fix-wave W6.
3. **Contrast claim**: re-count `44/48 PASS` from the recorded contrast JSON (no re-measurement needed).
4. Spot-check ONE disposition of your choice from the PROXY's §3 results.

- Output: `docs/testing/fe-design-review-20261106-r1/confirmation-opencode.md` — verdict `CONFIRMED | CONFIRMED_WITH_NOTES | NOT_CONFIRMED` (of the PROXY confirmation, and of r1 by extension).

## Non-goals (all tasks)

No fixes, no dependency changes, no lens re-runs, no production/provider claims, no closure of any finding beyond what these confirmations support, no re-opening of adjudicated decisions. `NOT_RUN` stays `NOT_RUN`.

## Return

Per task: verdict + confirmation file path + discrepancies. Overall: actual agent identity, commands/exit summaries, tests run vs NOT_RUN, skipped + remaining risk. Proposed next status: the three confirmed results become citable with attribution "owner-confirmed + non-author-confirmed (OpenCode)".
