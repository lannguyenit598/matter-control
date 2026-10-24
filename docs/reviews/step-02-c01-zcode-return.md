# MC-002-BE-C01 — ZCode Implementation Return (slice C01-NATIVE)

- Executed by: ZCode (actual), model GLM-5.3-Flash (`account:zai-start-plan/GLM-5.3`). 2026-10-24. Manual dispatch per the C01-NATIVE prompt (preparation base governance `f0f82a6`, actual head at execution `b43dc53`, no conflicting changes).
- Reviewer: OpenCode (independent) — pending; **proposed status IN_REVIEW**. No DONE, no whole-C01 closure, no MC-002 closure, no Step 03. Native success, once independently verified, is recorded as **NATIVE_PASS / PRODUCT_OPEN** only.
- Authority: Claude clarification (`step-02-c01-claude-clarification.md`) with the binding edge-case amendment (`step-02-c01-claude-edge-cases.md`): **SQLSTATE first**, `ConnectError` only without any `PgError` in the chain; no string matching; cancellation 499 precedence; probe bytes preserved.

## 1. Identity, source and no-diff-to-baseline confirmation

| Item | Value |
|---|---|
| Worktree | `/tmp/mattercontrol-step022-backend-c01`, NEW branch `task/MC-002-be-c01` from `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b` (path and branch verified absent before creation) |
| Base → Head | `d024e3e` → **`fd747ae11aad05bd98737bc91f6bd19894fd72e7`** (local commit `fd747ae`, not pushed) |
| Preserved baselines | `/tmp/mattercontrol-step021-backend` untouched at `d024e3e` (verified clean before/after); old fixtures `mc002be-pg-20261024T1454Z` / `mc002be-recheck-pg-20261024T1539Z` never started or mutated (retained, Exited 0) |
| Semble | recorded unavailable ("MCP dependencies are not installed"); targeted reads used; nothing installed |
| Binary | rebuilt for runtime evidence, sha256 `b7b74d5a214225244a2f8586696b41c4609d2ae63d2fb536468b96ebc3967563`, version stamp `d024e3e-dirty` |
| Tools | go1.27.3, golangci-lint 2.14.0, Docker 29.8.2; every command via `rtk`/`rtk proxy` |

## 2. Changed files (commit `fd747ae`, 11 modified + 5 new, all in scope)

Production (4): `internal/core/port/errors.go` (new `ErrUnavailable` sentinel), `internal/adapter/outbound/postgres/user_repository.go` (SQLSTATE-first `mapError` + `unavailableSQLSTATE`), `internal/adapter/inbound/httpapi/errors.go` (single `toProblem(ctx, err, probe)` mapping, `unavailableProblem`, `retryAfter` field/constant, renderer type-ownership), `internal/adapter/inbound/httpapi/openapi.go` (`register` maps with live request context; `completeProblem` defaults only an empty Type).

Docs (2): `docs/api.md` (new 503 body + `retryAfter` native-constant note + "a 5xx on a non-GET does not mean the change was not applied" + updated error table), `api.http` (503 example).

Tests/goldens (10): new `map_error_test.go`, `faults_test.go`, `errors_test.go`, `service_unavailable_test.go`, `testdata/unavailable.golden`; updated `contract_test.go` (unavailable golden case), `openapi_test.go` (optional integer `retryAfter` property assertion), `user_repository_test.go` (`TestStatementTimeout_IsDeadlineExceeded` → `TestStatementTimeout_IsUnavailable`, the intended behavior change), `user_service_test.go` (`TestUpdate_DoesNotRetryUnavailable` guard), `testdata/timeout.golden` (only the 503 body line + Content-Length; all other goldens byte-identical). **No new dependency, config, migration, endpoint, auth, idempotency, UoW, retry, or production fault switch.**

## 3. Key implementation facts (for OpenCode's diff review)

1. **Outbound, SQLSTATE first**: after `pgx.ErrNoRows` → NotFound and `23505`+`users_email_key` → email conflict, `errors.As(*pgconn.PgError)` decides: retryable set {class `08*`, `57P01`, `57P02`, `57P03`, `53300`, `40P01`, `40001`, `55P03`, `57014`} wraps `port.ErrUnavailable`; any other PgError stays generic (500). Only when **no** PgError is in the chain does `errors.As(*pgconn.ConnectError)` wrap `ErrUnavailable`. No string matching, no `net.Error` rule. The old `57014`→`DeadlineExceeded` wrap is replaced as authorized.
2. **Inbound, one shared mapping** `toProblem(ctx, err, probe)` used by Huma `register` (live request context, probe=false) and Echo `newErrorHandler` (probe = `probePaths`). Order: cancellation (`errors.Is(err, context.Canceled)` **or** live `ctx.Err() == Canceled`) → 499, before `DeadlineExceeded`/`ErrUnavailable` → 503 `/problems/unavailable` + fixed detail + `retryAfter:1`; then Echo codes with non-probe 503 → unavailable; else unchanged; else 500 without retryAfter. `errPreconditionFailed` (412 stale If-Match) remains the distinct handler path, untouched.
3. **Echo-context discovery (documented by test, not assumed)**: Echo v5 `ContextTimeout`'s default error handler converts a returned `DeadlineExceeded` chain into `*echo.HTTPError(503)` wrapping the deadline (`echo.ErrServiceUnavailable.Wrap`) — asserted in `TestContextTimeout_MiddlewareShape`. Separately, the middleware `defer cancel()`s its derived request context before `newErrorHandler` runs, so the Echo renderer **cannot** consult `ctx.Err()` (it would 499 every error); it passes `context.Background()` and detects cancellation via the chain only. The live-context consultation (bare-57014-after-client-cancel → 499) happens in `register` where the context is live.
4. **CAS predicate guard**: the existing retry predicate matches `port.ErrVersionConflict` only; no reclassified SQLSTATE collides. `TestUpdate_DoesNotRetryUnavailable` proves one attempt on `ErrUnavailable`; `TestUpdate_GivesUpAfterRepeatedConflicts` (unchanged) still proves exactly 3 attempts on conflicts. The dispatch's stop-and-escalate condition was **not** triggered.
5. `retryAfter` = unexported `retryAfterSeconds = 1` (integer seconds) with code comment and docs/api.md note: native-template constant, **not** the MatterControl production convention; no `Retry-After` header, no env option, no retry behavior.

## 4. Executed checks (UTC, exits; full logs in [step-02-c01/](../testing/step-02-c01/))

| Step | UTC | Exit | Result |
|---|---|---|---|
| TDD RED (`go test ./...`, no DB) | 16:51:33 | 1 | `TestMapError_UnavailableClassification` failed on all retryable codes (57014 still DeadlineExceeded-wrapped); httpapi red = new `toProblem` signature/`RetryAfter` (intended API); contract/openapi red on retryAfter/golden |
| Implement + goldens (`-update`, reviewed diff) | ~16:5x–17:0x | 0 | only `timeout.golden` 503 body + new `unavailable.golden`; user_api/panic/version_conflict/unexpected_error byte-identical |
| `make check` run 6 (fixture DSN, private) | 17:05:16–29 | **0** | sqlc-check, gofmt, `go mod tidy -diff`, golangci-lint **0 issues** (depguard green), `go test -race -count=1` all ok with PostgreSQL tests running |
| `go test -race -count=1 -json ./...` | 17:05:42–53 | **0** | 1189 events, 0 invalid lines: **278 pass / 0 fail / 0 named skips**, 11 packages pass + 5 no-test-file (summary in `36-json-parse-summary.txt`) |
| A10 import check | — | — | `grep -rn 'jackc/pgx\|pgconn' internal/adapter/inbound/` → comment matches only, **no imports** |

Fixture: `mc002be-c01-pg-20261024T1700Z` (postgres:18-alpine digest `sha256:77f585114c32…`, 512 MiB/1 CPU/128 pids, `127.0.0.1:15457`, label `mc002be-c01`, dedicated network, anonymous volume, fresh random credential never printed/traced/reused; verified healthy + `public` tables = 0 **before** `TEST_DATABASE_URL` assignment).

## 5. Claude's native acceptance cases

| Case | Evidence | Result |
|---|---|---|
| A1 outage GET/list/POST/PATCH/DELETE | `42-outage.log`: all five → 503 `application/problem+json`, `type /problems/unavailable`, `detail "service temporarily unavailable"`, `retryAfter:1`, no driver text | **PASS** |
| A2-native existing vs nonexistent during outage | bodies byte-identical except `instance` | **PASS** |
| A3 probes + recovery without restart | outage: `/healthz` 200 (`{"status":"ok"}`), `/readyz` 503 **exact current bytes** (`about:blank`, no retryAfter); after `docker start`: both 200 and GET works, no restart | **PASS** |
| A7 unit (every retryable code) | `map_error_test.go` table incl. 08xxx/57P0x/53300/40P01/40001/55P03/57014, wrapped chains, lookalikes, negatives | **PASS** |
| A7 real faults | connect refused (real `*pgconn.ConnectError` chain observed+asserted), wrong password (real 28P01 in chain → 500-class), missing database (real 3D000 → 500-class), `pg_terminate_backend` (real 57P01 → ErrUnavailable), statement-timeout under barrier-held row lock (real 57014 → ErrUnavailable **and** row/version unchanged after rollback — outcome known: timed out waiting for the lock), pool-acquire timeout (real observed chain classifies via DeadlineExceeded/ErrUnavailable → 503): `faults_test.go`, all ran in the suite | **PASS** |
| A7 HTTP pool exhaustion | inst2 `DB_MAX_CONNS=1`, external row-lock barrier: blocked PATCH → 57014 → 503 at ~4s; concurrent PATCH → acquire wait → request deadline → 503 at 3s; row unchanged (version 1) after both (`45-pool-exhaustion.log`) | **PASS** |
| A8 | unit `42P01/22xxx/42501/unmapped 23xxx` → 500 no retryAfter; integration fresh-unmigrated-schema → real `42P01` → 500-class (`TestFaults_MissingTable_IsNotUnavailable`); HTTP-level 42P01 is unreachable by design (pending-migrations startup guard fails first) — noted, not a gap in the mapping | **PASS** |
| A9 client cancel | cancelled PATCH at 2s (curl exit 28): server logged `status:499`, latency 2.002s, with request_id; unit precedence cases incl. cancelled ctx + unavailable/deadline chains → 499; request timeout → 503 (inst2 request B) | **PASS** |
| A10 | depguard/lint green in `make check`; no pgx/pgconn import in inbound (incl. tests) | **PASS** |
| A11-native | postgres real faults satisfy `errors.Is(err, port.ErrUnavailable)`; test-only memory decorator (`unavailableRepo`) produces the same sentinel → byte-identical 503 wire shape across GET/list/POST/PATCH/DELETE | **PASS** |
| A13 | Huma path (all runtime 503s + `unavailable.golden`) and Echo renderer (direct `newErrorHandler` assertions, `TestContextTimeout_MiddlewareShape`, probe bytes) both carry the mapped type; 4xx Echo codes unchanged (`42-outage.log` 404 + full suite) | **PASS** |
| A14-native | captured logs: 6× `status:503` entries all with `request_id`; **0** occurrences of the fixture password or any DSN; wrapped error text contains connection metadata (`user=… database=… host:port`) — operational metadata per disposition §5, `error_class` policy stays deferred | **PASS** |

**All native cases PASS on actual evidence.** Product cases A2-inaccessible/A4/A5/A6/A11-product/A12/A14-policy/A15 and the retryAfter unit/range + `Retry-After` header decisions remain **OPEN / NOT_RUN** (no scaffolding added).

## 6. Findings, skips, risks

1. **Template rule-file inconsistency (report-only, not fixed — out of authorized scope):** `.claude/rules/persistence.md` still says "Map database timeouts (`57014`, …) to `context.DeadlineExceeded`", superseded by this authorized change. Needs a one-line follow-up commit (via Codex/Claude) — I did not edit an out-of-scope file.
2. **Echo renderer context:** cancellation detection in the Echo error path is chain-only (middleware cancels the derived context before rendering). The live-context bare-57014 rule is enforced at the Huma mapping point, which is where service errors are mapped; documented in code and tests.
3. `retryAfter` constant and the docs wording follow the clarification exactly; any unit/range change requires the open product decision.
4. Skipped: govulncheck (CI-only, not part of `make check`); product A-cases (above). No unresolved untyped real-fault findings: every injected real fault classified as designed (wrong-password/missing-db chains were PgError-first as predicted; acquire timeout surfaced DeadlineExceeded → row-3 503).

## 7. Resource disposition

API processes (2) terminated gracefully (log lines retained); fixture `mc002be-c01-pg-20261024T1700Z` stopped (Exited 0) and **retained with its anonymous volume** for OpenCode; network retained; no pruning/deletion anywhere; no listeners on 15457/18095/18096; other containers untouched. Raw evidence `/tmp/mc002be-c01/` (SHA256 manifest `49-sha256.txt`); redaction scan: **0** credential hits across all files, one benign REDACTED-form DSN line (manifest). Governance exports in `docs/testing/step-02-c01/` (19 files, hash list `49b-gov-export-hashes.txt`); original/stored hash pairs identical for exported copies.

**Proposed status: IN_REVIEW** — OpenCode to inspect the actual diff (`fd747ae`), tests and evidence, and independently verify. No self-awarded DONE.
