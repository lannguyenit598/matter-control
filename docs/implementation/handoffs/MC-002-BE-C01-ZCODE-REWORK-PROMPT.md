# MC-002-BE-C01 — ZCode Bounded Rework

Status: **PREPARED / WAITING_MANUAL_DISPATCH**, not executed. Actual original owner return is fd747ae; this is a new corrective assignment, not a repeat of R01/R02. Codex records the bounded rule-file scope extension authorized by actual Claude's implementation review. Independent findings are linked from the current intake before dispatch.

--- BEGIN ZCODE REWORK PROMPT ---

You are actual ZCode, Go Backend Engineer. Execute MC-002-BE-C01-R1, a bounded C01-NATIVE correction. Codex coordinates, Claude owns architecture, OpenCode independently verifies. You are not alone: preserve other changes, baseline worktrees, R01/R02 closure and all existing evidence. Do not self-award DONE/NATIVE_PASS or close C01/MC-002; return IN_REVIEW.

Governance: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control, branch task/MC-002-solution-architecture, intake base b43dc53e5efefcb904fa111f7ec1972387171de6. Later governance-only commit contains this prompt; record actual head. Read root AGENTS.md, original C01 prompt, docs/reviews/step-02-c01-intake.md, step-02-c01-claude-implementation-review.md, step-02-c01-opencode-source-review.md and step-02-c01-opencode-evidence-review.md, plus original Claude clarification/edge-case amendment IN FULL. Read backend AGENTS.md and matching rule files; use rtk/rtk proxy and Semble first or record failure. English backend content only. Acknowledge actual tool/model/version, source/head, scope and blockers before edits.

Use existing /tmp/mattercontrol-step022-backend-c01 on task/MC-002-be-c01, expected CLEAN head fd747ae11aad05bd98737bc91f6bd19894fd72e7. Verify status/head; stop on unexpected edits/revision, never reset or overwrite. Do not edit/rebuild either baseline /tmp/mattercontrol-step02-backend or /tmp/mattercontrol-step021-backend.

Required source/doc corrections, owned by ZCode:

1. Claude F1: add one focused subtest in internal/adapter/outbound/postgres/map_error_test.go for mapError(combinedChain{errs: []error{&pgconn.ConnectError{}, context.Canceled}}). Assert errors.Is(mapped, context.Canceled) AND errors.Is(mapped, port.ErrUnavailable), proving the driver cause survives for inbound499. No production change; do not deliberately break correct code merely to create a red result. A passing newly added invariant test is expected here; record it honestly.
2. Claude F5: docs/api.md 499 row must say “A disconnect wins over every other classification.” Cancellation-before-domain is the architect-accepted behavior, not a new policy. Record the accepted Echo-renderer background context versus Huma live-context split; do not change it.
3. Claude F6 scope extension: replace ONLY the stale sentence in .claude/rules/persistence.md:
   OLD: Map database timeouts (`57014`, `statement_timeout`) to `context.DeadlineExceeded` for HTTP 503.
   NEW: Classify SQLSTATE first: wrap retryable codes (class `08`, `57P01`–`57P03`, `53300`, `40P01`, `40001`, `55P03`, `57014`) with `port.ErrUnavailable` (HTTP 503); every other `*pgconn.PgError` stays unexpected (500); a `*pgconn.ConnectError` maps to `port.ErrUnavailable` only when no `PgError` is in the chain; never classify by error text.
   Search other matching rule statements; report inconsistencies, do not edit other rules. This template sentence is explicitly allowed; normative MatterControl architecture/ADRs stay unchanged.

Claude has dispositioned OpenCode M1 NOT_REACHABLE_ON_CURRENT_ROUTES: readyz discards the Ready cause and returns bare echo.ErrServiceUnavailable; healthz returns nil/committed response. No M1 probe code/test change is required. Read docs/reviews/step-02-c01-claude-probe-disposition.md.

No other production/config/dependency/schema/migration/retry/auth/idempotency/UoW/endpoint/Workers/product changes. Review any additional OpenCode source finding in the supplied actual review; if it requires a production change or changes the approved contract, stop and return the exact blocker to Codex/Claude before widening scope. Architect F3/F4/F7 are nonblocking follow-ups, not required changes for this assignment.

Correct the returned evidence narrative without rewriting original raw files: both HTTP PATCH log entries in 44-api2.stdout.log are about3s deadline-exceeded; 45's label “A57014at4s” is not proved by those HTTP logs. Real57014 is proven separately by the PostgreSQL row-lock test. Describe A8 as real42P01 repository plus mapping composition, not an HTTP500 replay; a startup guard does not make post-start schema faults impossible. Runtime binary was built/stamped d024e3e-dirty before fd747ae: do not call it reproducible commit-stamped evidence. Count278 as named parent/subtest passes, not independent leaf tests. Nineteen exported files were17master payloads plus2hash lists;32master entries are not19payload hashes.

Run required checks on the corrected head: focused regression, rtk proxy make check with a NEW verified disposable PostgreSQL target, and rtk proxy go test -race -count=1 -json ./... with the verified TEST_DATABASE_URL supplied privately. Report command UTC/exits/stdout/stderr, test/subtest pass/fail/explicit skips separately from no-test packages. No claim a previous-head run certifies the new head. This is C01 regression, not reopening R01/R02; do not rerun their four config cases or restore drill for reassurance.

OpenCode evidence review requires no additional A1/A2/A3/A9/A14 smoke replay solely for reassurance; its E03 requires corrected-head checks. For those PostgreSQL checks, or a genuinely new fault-triggered recheck, use only a NEW task-labelled, capped PostgreSQL fixture on a verified unused loopback port with fresh credentials; verify daemon/ID/database/user/empty target BEFORE assigning DSN. No Config.Env/env/DSN dump, shell tracing or secret in argv/logs. Never restart/mutate old mc002be-c01-pg-20261024T1700Z, mc002be-pg-20261024T1454Z or mc002be-recheck-pg-20261024T1539Z. No pruning/volume deletion.

Record exact redacted launch/config/curl/assertion argv, UTC, actual exits, separate raw outputs and expected-versus-actual for any new HTTP smoke. Assert statuses/content, current probe bytes and recovery/persistence; use barriers and bounded waits. Do not label a timeout subtype unless actual error-chain/server evidence proves it. A5xx write does not mean no effect; do not add write retries. Actual application log privacy checks must cover the synthetic email/name and every request body/query value used in that run, plus the fixture password/DSN, with secret-free counts only. Record request_id/status; no general logging/privacy guarantee from a sample.

Use NEW /tmp/mc002be-c01-r1/ evidence and governance docs/testing/step-02-c01-r1/; refuse overwrite, retain fd747ae evidence unchanged. Write docs/reviews/step-02-c01-zcode-rework-return.md with finding-by-finding disposition, actual tool/model, repo/base/head/local commit/diff, changed paths, commands/time/exits/raw logs/hashes, every acceptance PASS/FAIL/NOT_RUN, skips/risks and exact resource disposition. Stop only owned new processes/fixture and verify no listeners; retain containers/volumes, no deletion. No push/merge/deploy/global auth/settings changes.

Commit only scoped backend test/doc changes locally. Actual OpenCode reviews the new head/diff/tests after return; Claude reviews deviations. C01-NATIVE remains unaccepted until then; C01-PRODUCT/auth/idempotency/full UoW/Workers/log-policy/product retry convention remain OPEN/NOT_RUN. MC-002 stays OPEN, Architecture Approval Gate NOT_PASSED, Step03 NOT_STARTED.

--- END ZCODE REWORK PROMPT ---
