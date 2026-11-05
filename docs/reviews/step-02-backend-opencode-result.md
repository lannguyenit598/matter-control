# OpenCode independent review — MC-002-BE-VERIFY (ZCode native H5 template PoC)

**Verdict: PASS_WITH_LIMITATIONS**

The executed template characterization (build, container, migrations, tests, image, API runtime, restart, DB-down recovery, guards) is sufficiently evidenced to hold as an IN_REVIEW characterization of the ZCode PoC on pinned `d024e3e` with zero source change. The limitations are evidence-quality gaps, not contradictions of the reported behavior. I approve only carriage of the evidence as characterized below — no architecture approval, no PO/cost/Cloudflare approval, and no MC-002 DONE.

## Findings

### A. Mandatory reruns (blocking full PASS on the affected acceptance lines)

**R-01 — "zero skips" is unproven; rerun with per-test output**
- Severity: Medium. ID: MC002BE-R01.
- Path: `docs/testing/step-02-backend-poc.md` §4.4/§6; `checks.json` `test_package_counts`.
- Evidence: Both `40-make-test.log` and `41-make-check.log` are non-verbose (`ok`/`[no test files]` lines only, 11 `ok` + 5 `[no test files]` each). `pgtest.FreshSchemaDSN` (source snapshot, `pgtest/pgtest.go`) skips per-test when `TEST_DATABASE_URL` is empty; the DSN was set and the postgres package ran (3.567s / 3.388s), but a package-level `ok` conveys aggregate state including per-test `t.Skip`. Grep of one message string cannot prove "zero skips" globally.
- Minimal correction: Rerun once with `TEST_DATABASE_URL=$DSN rtk proxy go test -race -count=1 -json ./...` (or `-v`), retain the output in the evidence set, and record the actual `skip` count per package. Either the count is 0 and "zero skips" stands with evidence, or the report is amended to the proven statement: "PostgreSQL tests ran against a verified disposable DSN; NA for absolute zero-skip."

**R-02 — invalid-config evidence lacks command/error pairs**
- Severity: Medium. ID: MC002BE-R02.
- Path: `docs/testing/step-02-backend-poc/65-invalid-config.log`; report §4.9.
- Evidence: The retained log is 63 bytes containing three unpaired `exit=1` markers, no argv, no stderr. The three exact error strings in §4.9 ("DATABASE_URL is required when STORAGE=postgres", "STORAGE must be \"memory\" or \"postgres\"", slog level error) are owner assertions, not captured output. The surviving fail-fast with a captured message is the migrate-no-DSN case in §4.1 and the pending-guard in `66-pending-guard.log` (evidenced). Checks.json observations concur.
- Minimal correction: Rerun the three invocations separately, each capturing argv + stderr (one retained file each). The behavior (exit 1) is likely correct; only the captured messages are missing. Until then, §4.9 messages must be labeled "asserted, log not retained".

### B. Metadata / report corrections (no rerun needed)

**M-01 — package-count inaccuracy in report**
- Severity: Low. ID: MC002BE-M01.
- Path: `docs/testing/step-02-backend-poc.md` §4.4 ("13 packages ok"); `checks.json`.
- Evidence: Logs show 11 `ok` packages + 5 `[no test files]` in both runs; checks.json records 11. The report's "13 packages ok" is wrong.
- Correction: Change to "11 packages ok, 5 packages with no test files". The `ok` on `postgres` and `app` (the DB-running packages) is the substantive claim and holds.

**M-02 — migration run 3 not evidenced**
- Severity: Low. ID: MC002BE-M02.
- Path: report §4.3; `31-migrate-run2.log`.
- Evidence: Report asserts runs 2 and 3 both no-op; only one no-op run is retained (`migrate_run2b_exit=0`, and that file has no argv/trace). checks.json notes the third run is not separately retained.
- Correction: Drop the "run 3" claim or retain its log. Also add argv lines to run-2 style logs.

**M-03 — credential-handling wording misstates the original file**
- Severity: Medium. ID: MC002BE-M03.
- Path: report §5 ("redacted in all retained logs"); `manifest.json` / `checks.json` (`credential_redactions: 1`, source vs stored hash differ for `30-migrate-run1.log`).
- Evidence: One live local test DB credential sits unredacted in the original `/tmp/mc002be-evidence/30-migrate-run1.log`. The exported copy is redacted and never entered Git or a packet; hashes prove the byte change. Owner's blanket claim is false for the original file.
- Correction: Amend the report to "redacted in all exported/stored copies; one original private /tmp file retains an unredacted per-run random credential". Add an explicit disposition: the original file is destroyed by its owner after review, and the disposable container/credential (already exited and per-run random) is not reused. No evidence incident occurred; hygiene claim must be precise.

**M-04 — unlabeled DB-state log cited as acceptance proof**
- Severity: Low. ID: MC002BE-M04.
- Path: `62-db-state-during-api.log` (`7`,`6`,`2`); report §4.6 goose/users claims.
- Evidence: Six bytes of unlabeled numbers back three distinct claims (goose rows 0–6 applied, max version 6 unchanged, users count). No query strings or column labels retained.
- Correction: Annotate the log semantics in the report (what each number is), or re-capture with labels. The corresponding pending-guard log (`66-pending-guard.log`) is properly labeled and independently evidenced.

**M-05 — final container health status contradicts narrative**
- Severity: Low. ID: MC002BE-M05.
- Path: `host-state.json`; report §3 §7 ("healthy… retained stopped").
- Evidence: Final inspection shows `Health.Status: "unhealthy"` with `FailingStreak: 0` and five 2s probes, exit 0, "accepting connections", ending at `FinishedAt` 15:00:23. `20-pg-container.log` shows healthy at start. The narrative "healthy container" is not what the final record says.
- Correction: Annotate that the terminal `unhealthy` is the post-stop inspection artifact (probes ceased with stop; streak 0 and all exit-0 probe outputs). No container action needed; it is retained for the reviewer.

### C. Product-contract gap — registered, not rerunnable, not mine to approve

**C-01 — DB-unavailable data path returns 500, contracts require 503 `unavailable`**
- Severity: High (against `api-contracts.md`), but correctly out of ZCode change scope. ID: MC002BE-C01.
- Path: source `errors.go` (`toProblem`) vs `64-db-down.log` / `63-api-run2.stdout.log`; contract §1 problem catalogue (`/problems/unavailable`, `retryAfter`).
- Evidence: Confirmed: `toProblem` maps only `context.DeadlineExceeded` → 503; `mapError` wraps pgx connectivity errors as `postgres: %w`, which falls through to generic 500. The 500 body was clean (no internals), and readiness 503 vs liveness 200 remained distinct.
- Disposition: This stays a characterized template integration gap, pending the actual Claude Code architecture-impact review (owner "escalated" is not completed review). It does not degrade PASS_WITH_LIMITATIONS for template characterization and must not be fixed by ZCode without Claude disposition. Do not conflate the gap with the template verdict.

### Positive verification notes
- Runtime behavior is well-evidenced: full HTTP exchanges with request IDs, statuses, ETags, problem+json bodies in `61-api-checks.log`; CAS 200→2 / stale 412; restart persistence in `63-*`; recovery in `64-db-down.log`; pending-migration guard captured in `66-pending-guard.log`; image/container identities cross-match between logs, manifest and read-only host inspection; binary sha matches; base == head with empty diff.
- Correct accuracies in the report: test-isolation (FreshSchemaDSN) claim matches source; `MIGRATE_ON_START=false` honored (run 1 explicitly set it; goose rows 0–6 retained); resource caps and loopback publish match Docker records; outbox/kfake claim consistent with package timings.

## Summary
- **PASS_WITH_LIMITATIONS** for MC-002-BE as an IN_REVIEW template characterization.
- Two mandatory reruns: R-01 (per-test skip enumeration), R-02 (invalid-config command/error pairs).
- Five metadata fixes: M-01 package count, M-02 run 3, M-03 credential wording + original-file disposition, M-04 log labels, M-05 health-status note.
- One registered contract gap: C-01 (500 vs 503 `unavailable`) → actual Claude Code review.
- Proposed next status: keep **IN_REVIEW**; reopen to REWORK_REQUIRED only if R-01 or R-02 are not executed within the review window. Nothing here approves Step 03, architecture, cost, or production.

*What was skipped:* no hash recomputation, no replay, no live DB inspection, no command execution — log/source-only review per task scope. Remaining risk: per-test skip counts remain formally unverified until R-01; the original /tmp credential file's deletion is not yet evidenced.
