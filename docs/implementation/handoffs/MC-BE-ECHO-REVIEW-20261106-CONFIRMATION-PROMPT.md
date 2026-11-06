# MC-BE-ECHO-REVIEW-20261106 — Non-author confirmation pass (dispatch prompt, lightweight)

Task ID: MC-BE-ECHO-REVIEW-CONFIRM-20261106
Purpose: per `ERRATUM-1-self-review-label.md`, the r1 review (PASS_WITH_LIMITATIONS, re-pin `b86152d2`) is labelled SELF-REVIEW / OWNER-CONFIRMATION. This pass is the **non-author confirmation** that lets its results gate anything. It is a confirmation of recorded evidence, **not** a full re-review.

## 0. Identity gate (binding)

- You must be an **independent, non-author reviewer** (OpenCode, or any session that did not author the reviewed code). ZCode sessions authored the in-scope backend — if you are one, STOP and return `CONFLICT_OF_INTEREST`.
- Mode: REVIEW_ONLY. Write only `confirmation.md` inside the evidence dir. No code edits, no commits.

## 1. Pin

- Repo: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` · Reviewed bytes: `b86152d2015d0b6b502dde55c48ced5814f42ea9`
- Pre-flight: `git rev-parse HEAD`; then `git diff --stat b86152d2..HEAD -- apps/backend` — if empty, all spot-checks bind to `b86152d2` bytes; if not empty, re-check only the touched files' related items and record.

## 2. What to confirm (and nothing more)

1. **Evidence integrity** — the dir `docs/testing/be-echo-review-20261106-r1/` exists; `commands/` transcripts match the report's counts: binding scan (255 raw `Exec/Query` sites → exactly 2 hand-written production SQL files, both parameterized); `fmt.Sprintf`-near-SQL = 1 error-message hit (filing.go:386), not SQL; gitleaks tree = 8 go.sum-checksum FPs.
2. **One cheap objective re-run**: `make check` in `apps/backend` (with your own throwaway PG fixture via `MC_TEST_DATABASE_URL` — do not reuse `mc-r2-check-pg`; it was torn down after intake). Exit 0 expected.
3. **Binding scan re-run (2 greps)** — reproduce the 0-violation result with the recorded commands.
4. **Spot-check 3 of the 9 REMEDIATED dispositions** (§4 of report): membership CAS at `internal/adapter/inbound` queries `matter.sql:132-134` (`AND revision = sqlc.arg(expected_revision)`); `0010_access_path_indexes.sql` exists with the named indexes; `authorizeReceiptScope` at `internal/core/service/matter_service.go:299-319`.
5. **Term-sheet spot-check (2 checks)**: rejected import does not burn the idempotency key (no receipt written on rejection) and promoted-fact protection named codes (`promoted`) in `internal/core/service/termsheet_service.go`.

## 3. Out of scope

Passes A/C/D/F re-runs, E/G, EXPLAIN re-run, org-tenancy adjudication, the 4 P3s' fixes, anything production/provider. Do not re-review what is already recorded — verify or refute it.

## 4. Runtime rules

Prefix shell commands with `rtk`; Semble-first for code exploration (record failure → targeted grep); no `sed`/`perl -i` (Mimosa); synthetic data only; record tool/version, exact commands, exit codes in `confirmation.md`.

## 5. Output and verdict

- File: `docs/testing/be-echo-review-20261106-r1/confirmation.md` — label header `CONFIRMATION_REVIEW (non-author)`.
- Verdict: `CONFIRMED` | `CONFIRMED_WITH_NOTES` | `NOT_CONFIRMED` + per-item results (5 sections above) and any discrepancy with `file:line` evidence.
- On `CONFIRMED*`: the r1 results may be cited in gates with attribution "owner-confirmed + non-author-confirmed (this file)". On `NOT_CONFIRMED`: the erratum label stands and discrepancies become new findings for coordinator intake.
