# MC-002-BE-C01 C01-NATIVE: Architecture Review of Actual `fd747ae`

**Reviewer:** Claude Code (claude-opus-5-5), Solution Architect. I worked from the supplied snapshots only. I used no tools, files, commands or runtime.
**Not run:** all tests, runtime and replay. This is a code and architecture review, not QA replay, not independent verification and not product approval.

## Verdict: **CHANGES_REQUIRED** (bounded: one test addition plus doc-only edits, no production code change)

- **Production code conforms.** The production logic in `errors.go`, `openapi.go`, `user_repository.go` and `port/errors.go` matches the clarification and the binding edge-case amendment, with one acceptable deviation (F2).
- **NATIVE_PASS is withheld for now.** It needs the items in §6. After that, the expected outcome is NATIVE_PASS / PRODUCT_OPEN, subject to OpenCode verification. The native/product split is unchanged.

---

## 1. Cancellation precedence on actual existing routes (the key deviation)

I traced the real middleware order in `server.go`:

> RequestID → traceRoute → requestLogger(HandleError) → Recover → BodyLimit → ContextTimeout → group → Huma

**The owner's claim is correct, confirmed from the dependency source.** `context_timeout.go` calls `c.SetRequest(...WithContext(timeoutContext))`, never restores it, and `defer cancel()`s it on return. By the time `requestLogger` invokes `HTTPErrorHandler`, `c.Request().Context().Err()` is non-nil for every request. Consulting it there would turn every error into 499. Using `context.Background()` in `newErrorHandler` is therefore required, not a shortcut.

**Precedence is preserved for every existing `/api/v1/users` route:**

- **Where errors are mapped.** `register` calls `toProblem(ctx, …)` with the Huma context. `humaContext.Context()` is `c.orig.Request().Context()`, which is the live `timeoutContext`, because `ContextTimeout`'s `next` has not returned yet.
  - `ctx.Err()==Canceled` occurs only on client disconnect or server base-context cancellation.
  - A request deadline yields `DeadlineExceeded`, which correctly maps to 503.
- **Who writes the response.** Huma writes it via `completeProblem`, which commits it. `reportError` then returns the cause to Echo.
  - `ContextTimeout` may rewrap a deadline cause as `HTTPError(503)`.
  - `newErrorHandler` then exits early on `Committed`.
  - The logger records the committed status: 499, 503 or 500. That matches the owner's `status:499` cancel log, which is owner-attested.
- **What still reaches the Echo renderer on these routes:** route 404/405, BodyLimit 413, recovered panics (500), and the probe/docs native routes.
  - None of these carries a live-cancel signal that the chain cannot already express.
  - `/readyz` returns a bare `echo.ErrServiceUnavailable` with `probe=true`, so its bytes are preserved, as asserted in `errors_test.go`.
  - **Losing live-context consultation in the Echo path has no observable effect on existing routes.**
- **Bare 57014 after a pgx-sent cancel:**
  1. `mapError` classifies it as `ErrUnavailable`.
  2. `register` sees the live context is `Canceled`.
  3. The result is 499. This is the required row-2 behaviour, and it is enforced at the only point where it is reachable.

**Residual limitation (non-blocking).** No HTTP-level test drives a live-cancelled request through `register`. The 499 evidence is:

- the unit test `toProblem(cancelledCtx, …)`;
- by-construction code: `register` passes its `ctx`;
- the owner runtime log.

OpenCode should accept this composition explicitly or add a recorder test.

## 2. Findings

| # | Severity | Finding | Required action |
|---|---|---|---|
| F1 | **Required (test-only)** | The edge-case table's required row "`ConnectError` wrapping `context.Canceled` → 499" has no outbound case. The behaviour is correct by construction: `mapError` wraps with `%w: %w`, so `Canceled` survives, and `errors_test` covers the resulting inbound shape. The binding row still lacks direct evidence. | Add one subtest in `postgres/map_error_test.go`: `mapError(combinedChain{errs: []error{&pgconn.ConnectError{}, context.Canceled}})` must satisfy both `errors.Is(_, context.Canceled)` and `errors.Is(_, port.ErrUnavailable)`. It must fail if a future change drops the cause. No production change. |
| F2 | Accepted deviation | `toProblem` puts cancellation **before** domain outcomes. My table ordered domain first. | See §3. Record it in the return, and fix the docs wording (F5). |
| F3 | Non-blocking hardening | `TestFaults_TerminatedConnection` has no real barrier. `started` is closed before `Exec`, so the terminate can land before `pg_sleep` starts. That fails as a flake, not a false pass, because the 57P01 assertion is strict. | Follow-up only: wait until `pg_stat_activity` shows the victim pid `active` before terminating. |
| F4 | Non-blocking | `TestFaults_PoolAcquireTimeout` asserts on `pool.Acquire` directly and never passes through `mapError`. HTTP pool-exhaustion evidence (`45-*`) is owner-run with incomplete argv. | Optional: assert `errors.Is(mapError(err), context.DeadlineExceeded)`. OpenCode must weigh the runtime claim as owner-attested. |
| F5 | **Required (doc)** | The `docs/api.md` 499 row says "A disconnect also wins over any timeout classification". The implementation wins over *every* classification. | Change it to "A disconnect wins over every other classification." `docs/api.md` is in scope. |
| F6 | **Required (doc)** | `.claude/rules/persistence.md` is stale. See §5. | Doc-only follow-up. |
| F7 | Non-blocking | The comment in `port/errors.go` says "Repositories return bare sentinels", but `ErrUnavailable` is intentionally wrapped with its cause. | Optional same-commit comment edit: "…bare sentinels, except `ErrUnavailable`, which wraps the driver cause." |
| F8 | Evidence gap | A14-native: the return asserts no password or DSN in logs, but does not state that request **values** (email/name) are absent. The log `error` attribute is `PgError.Error()`, which carries no Detail, so the risk is low but unproven. | OpenCode/QA must check that the retained logs contain no body values. Product A14 stays deferred. |

## 3. Cancellation before domain outcomes: meaningful versus impossible

**Reachable differences** occur only through the **live context** in `register`. The client disconnected while the service still returned 404, 409 or 422, for example on an invalid-ID parse or a late `ErrNoRows`. In that case the log shows 499 instead of 404/409/422.

- The client receives nothing either way.
- 499 is not 5xx.
- A successful write returns `nil` and is never mapped.

This is a log-only difference and arguably more accurate. **Accepted.**

**Impossible in practice:** chains where a `ValidationError`, `ErrNotFound`, `ErrEmailAlreadyExists` or `ErrVersionConflict` also contains `context.Canceled`.

- `mapError` returns bare `ErrNotFound` and `ErrEmailAlreadyExists`.
- The service builds the version-conflict and validation errors without context errors.

No test or argument is needed for these.

## 4. Other checks

- **SQLSTATE first.** The order is `ErrNoRows` → `23505`+`users_email_key` → `PgError` (retryable set → `ErrUnavailable`, else generic) → `ConnectError` only without a `PgError` → generic.
  - `HasPrefix(code,"08")` operates on the SQLSTATE code, not on error text, so it conforms.
  - Real chains for 28P01 and 3D000 are asserted PgError-first.
  - The lookalike-text negatives are present.
- **503 body.** It uses fixed `type`, `title` and `detail`, plus `retryAfterSeconds = 1`.
  - The constant is an unexported local with a native-only comment.
  - There is no header, env var or retry.
  - `omitempty` keeps `retryAfter` off every other status.
  - The OpenAPI schema has it as an optional integer.
  - HEAD has no body (direct handler test).
  - Only `timeout.golden` (one body) changed, and `unavailable.golden` is new.
- **500/unexpected.** These map to `about:blank` with no detail and no `retryAfter` (contract plus unit tests).
- **Type ownership.** `completeProblem` and `newErrorHandler` default only an empty `Type`.
- **Probes.** `/healthz` 200 bytes and `/readyz` 503 legacy bytes are both asserted. The readiness function is unchanged.
- **No new retries.** The service predicate is `errors.Is(err, port.ErrVersionConflict)` only, so 40001/40P01 cannot collide with it.
  - `DoesNotRetryUnavailable` checks one call.
  - `GivesUpAfterRepeatedConflicts` checks three attempts.
  - The stop condition was correctly not triggered.
- **Boundaries.** Inbound has no pgx/pgconn import (test files included), as claimed and covered by depguard via `make check`. There is no new dependency, auth, UoW, idempotency, endpoint or production fault switch.
- **Rollback claim.** The 57014 test runs with outbox off, and the timeout fires while the statement is still waiting for the row lock. "Known not executed" is therefore correct, and the test does not misdescribe unknown commits.

## 5. Native evidence versus deferred product, and owner-runtime limits

| Case | Assessment |
|---|---|
| A7, A8 unit, A10, A11-native, A13 | Supported by source-visible tests. Execution is pending independent log checking by QA/OpenCode. |
| A8 HTTP 42P01 | **Accept test-only evidence:** a real repo produces 42P01 in a fresh schema, and the mapping composes to the unexpected-error 500 path. The startup guard does not make 42P01 *impossible*: a table dropped after startup would reach it. It is only impractical to replay without schema mutation, so record it as "composition evidence, not HTTP replay". |
| A1, A2-native, A3 recovery, A9 runtime, A14 | **Owner-attested only.** The argv wrappers are incomplete, so these must not be certified as independent replay. Memory-parity and contract goldens independently cover the wire shape. Real-outage-per-method results and recovery without restart remain runtime-only claims. OpenCode must replay on a verified disposable database, or record NOT_RUN and say whether the native PASS can stand on the remaining evidence. Passing suites are not a blanket waiver. |
| Product A2-inaccessible/A4/A5/A6/A11-product/A12/A14-policy/A15, `retryAfter` unit/range, `Retry-After` header | **OPEN / NOT_RUN.** No scaffolding was found. |

## 6. Stale rule: exact replacement and ownership

**Replace exactly this sentence** in `.claude/rules/persistence.md` (third bullet):

> Map database timeouts (`57014`, `statement_timeout`) to `context.DeadlineExceeded` for HTTP 503.

**With:**

> Classify SQLSTATE first: wrap retryable codes (class `08`, `57P01`–`57P03`, `53300`, `40P01`, `40001`, `55P03`, `57014`) with `port.ErrUnavailable` (HTTP 503); every other `*pgconn.PgError` stays unexpected (500); a `*pgconn.ConnectError` maps to `port.ErrUnavailable` only when no `PgError` is in the chain; never classify by error text.

**Ownership:**

- This is a backend-template agent rule, not MatterControl normative architecture, an ADR or a policy.
- **ZCode may make it** as a bounded doc-only follow-up commit on `task/MC-002-be-c01` after `fd747ae`, once Codex records the scope extension. No Codex backend implementation is involved.
- The same commit may carry F1 (test), F5 (`docs/api.md` wording) and optionally F7. It must not touch any other behaviour.
- ZCode should search `.claude/rules/` for other `DeadlineExceeded`→503 or forced-`about:blank` statements. Report them; any edit beyond this sentence escalates to me.
- Afterwards, rerun `make check` and `go test -race -json` on the new head.
- OpenCode reviews the new head, not `fd747ae`.

## 7. Required owner changes before NATIVE_PASS

1. F1: one outbound subtest (test-only).
2. F5: `docs/api.md` 499 wording.
3. F6: the rule sentence above.
4. Record F2 as an accepted deviation in the return.
5. Rerun checks on the new head.
6. OpenCode then independently verifies:
   - the diff;
   - the test logs;
   - the F8 value check;
   - either a runtime replay or an explicit NOT_RUN assessment for A1/A3/A9/A14.

**Status:** IN_REVIEW / CHANGES_REQUIRED (bounded). No DONE, no whole-C01 closure, no MC-002 closure, no Step 03 and no production policy selected.
