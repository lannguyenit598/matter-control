# M1 disposition: **NOT_REACHABLE_ON_CURRENT_ROUTES**

The reviewer's stated mechanism for M1 is also wrong about the source ordering. No owner change is required beyond F1, F5 and F6.

## 1. What M1 claims vs. what the source does

M1 says a probe deadline gets wrapped by `ContextTimeout` as `echo.ErrServiceUnavailable`, then falls through the probe guard as `problem{Status:503}` with empty detail.

The packet's `toProblem` (`internal/adapter/inbound/httpapi/errors.go`) checks in this order:

1. Row 2 (cancellation).
2. A `switch` whose last case is `errors.Is(err, context.DeadlineExceeded), errors.Is(err, port.ErrUnavailable)`, which returns `unavailableProblem()`.
3. Only then the `echo.StatusCode` branch with the `!probe` guard.

The `probe` flag is consulted only in step 3. Suppose an error reached `toProblem` as `echo.ErrServiceUnavailable.Wrap(ctxDeadlineErr)` with `probe=true`. It would match step 2 and render:

- `type: /problems/unavailable`
- `detail: "service temporarily unavailable"`
- `retryAfter: 1`

It would not render an empty detail. M1's "empty detail" outcome is therefore wrong even for its own constructed case.

One qualification: this assumes Echo v5's `HTTPError.Wrap` keeps the chain reachable via `Unwrap`. That is the purpose of `Wrap`, but the `HTTPError` source is not in the packet.

## 2. Can any current probe route produce a `DeadlineExceeded` or `ErrUnavailable` chain?

Middleware order from `server.go`: `dropInvalidRequestID` (Pre), RequestID, traceRoute, requestLogger (skipped for probes), Recover, BodyLimit, ContextTimeout, then the handler.

**`/healthz`**
- The handler returns `c.JSON(200, …)`. That is `nil`, or a write error after the response is committed.
- A committed response returns early in `newErrorHandler` before `toProblem`.
- A server write-deadline error would be `os.ErrDeadlineExceeded`, which is a different sentinel from `context.DeadlineExceeded`.
- No `DeadlineExceeded` chain can arise.

**`/readyz`**
- When `opts.Ready(ctx)` fails for any reason, including the `ContextTimeout` deadline expiring inside it, the cause is only logged.
- The handler returns the bare sentinel `echo.ErrServiceUnavailable`, which wraps nothing.
- `ContextTimeout`'s default `ErrorHandler` tests `errors.Is(err, context.DeadlineExceeded)`. That is false for the bare sentinel, so it returns `err` unchanged and `.Wrap` never runs.
- In `toProblem` (called with `context.Background()`):
  - Row 2: false.
  - Domain cases: false.
  - `DeadlineExceeded`/`ErrUnavailable`: false.
  - `echo.StatusCode` = 503 with `probe=true`, so the result is `problem{Status:503}`. The `code < 500` check suppresses detail.
- That gives the legacy `about:blank`, no-detail bytes, which the reviewer confirms are asserted against the exact body.
- So the actual readiness-timeout case already preserves probe bytes. The probe-timeout corner M1 describes is the readiness-failure path, and it is covered.

**Other errors on probe paths** (405 for a wrong method, 413) have codes other than 503. They take the unchanged Echo branch, so probe preservation is irrelevant to them.

**Recover** catches a panic, not a deadline. Reaching row 3 from it would need a `Ready` implementation that panics with a `DeadlineExceeded`-wrapping error. That is not in the packet, so it is not claimed.

## 3. Exact scope of probe-byte preservation

The guarantee holds for 503s that reach the Echo branch without a `DeadlineExceeded` or `ErrUnavailable` chain. On current routes, that is every failing probe response.

It would not hold for a hypothetical future or custom probe handler that returns the context or storage error itself (for example `return err` from `Ready`). Rows 2 and 3 take precedence over the probe guard by design. Such a handler would get 499 or `/problems/unavailable` respectively. That would be a behaviour change introduced by that new handler, not a defect at `fd747ae`. Covering it would mean broadening code and tests for a hypothetical, which is out of scope.

The baseline comparison M1 makes ("request timed out") is likewise moot for `/readyz`. The baseline `readyz` also returned the bare sentinel, so its `DeadlineExceeded` case could not fire there either. This is inferred from the unchanged `server.go` handler; the baseline `toProblem` itself is not in the packet.

## 4. Disposition

| Item | Result |
|---|---|
| M1 as stated (empty-detail regression) | **Not confirmed.** The mechanism is contradicted by switch ordering. |
| M1 on current routes | **NOT_REACHABLE_ON_CURRENT_ROUTES**: `/healthz` returns nil; `/readyz` always discards the cause and returns the bare sentinel. |
| Hypothetical cause-returning probe handler | Would render row 2 or row 3, not legacy bytes. This is a qualification on the scope, not a defect. |
| Additional owner change REQUIRED | **None** beyond F1 (test), F5 and F6 (docs). No probe-timeout test is required. F7 stays optional. |

**Suggested non-normative return note:** "M1 not reachable: `/readyz` discards the `Ready` cause and returns the unwrapped `echo.ErrServiceUnavailable`, so `ContextTimeout` does not wrap it and `toProblem` reaches the probe guard. Probe-byte preservation is scoped to current probe handlers. A probe handler that returned a cancellation or deadline chain would map via rows 2 or 3."

Statuses are unchanged: MC-002 C01 remains **IN_REVIEW / CHANGES_REQUIRED (F1+F5+F6)**, NATIVE_PASS is withheld pending evidence-packet review, C01-PRODUCT is open, and Step 03 has not started. I made no normative, production-policy or waiver changes, and ran no tools.
