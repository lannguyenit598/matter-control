# MC-002-BE-C01: Architecture Clarification Before ZCode Dispatch

**Reviewer:** Claude Code (claude-opus-5-5), Solution Architect. Packet-only: no tools, files or commands.
**Basis:** supplied snapshots at backend `d024e3e` and governance `f0f82a6`.
**Authority:** my prior C01 disposition (`docs/reviews/step-02-backend-claude-disposition.md`), the unchanged `api-contracts.md` catalogue and ADR-002 §1a.
**Not changed:** no normative architecture file, ADR or approval record is changed by this note.
**Not run:** all implementation and runtime tests.

---

## 1. Is a minimal native C01 fix ready to dispatch?

**Yes, as a scoped track called `C01-NATIVE`.** The disposition was never a global 500→503 conversion. Mapping is by typed classification, in this order (first match wins):

| # | Condition (typed `errors.Is`/`errors.As` only) | Status | Body |
|---|---|---|---|
| 1 | `domain.ValidationError`, `port.ErrNotFound`, `ErrEmailAlreadyExists`, `ErrVersionConflict` | 422 / 404 / 409 / 409 | **Unchanged**: `about:blank`, same detail |
| 2 | **Actual request cancellation**: `context.Canceled` in the chain, **or** the request's own context reports `Canceled` | **499** | Unchanged |
| 3 | `context.DeadlineExceeded` from the request timeout (`ContextTimeout`; includes pool-acquire wait), or new `port.ErrUnavailable` | **503** | `type /problems/unavailable`, `retryAfter`, one fixed `detail` |
| 4 | Echo `HTTPError` with code 503 on a non-probe route | 503 | Same unavailable body as row 3 |
| 5 | Other Echo `HTTPError` (404 route, 405, 400 bind, 413, other 5xx) | Echo code | **Unchanged** |
| 6 | Everything else | **500** | **Unchanged**: `about:blank`, no `retryAfter` |

### Precedence rules (mandatory)

- **Row 2 must precede row 3.** Today `mapError` wraps 57014 as `DeadlineExceeded: <pgErr>`. A cancelled client request can therefore produce a chain that matches `DeadlineExceeded` and maps to 503. That must become 499.
- **Do not trust the chain alone.** If pgx surfaces a bare 57014 after sending its own cancel request, the single mapping must consult the request context (`Err() == context.Canceled`).
- **One shared mapping.** Implement this once in the single mapping function used by both the Huma (`register`) and Echo (`newErrorHandler`) paths. A `toProblem(ctx, err)`-style signature is acceptable.

### Outbound classification (postgres adapter only)

`mapError` wraps a **closed set of typed predicates** with `port.ErrUnavailable` (a new sentinel in `internal/core/port/errors.go`). Example: `fmt.Errorf("postgres: %w: %w", port.ErrUnavailable, err)`.

| Classified as unavailable (retryable 503) | Stays 500 |
|---|---|
| `*pgconn.ConnectError` (dial or connect failure) | `42xxx` (including 42P01) |
| SQLSTATE class `08` | `22xxx` |
| `57P01`, `57P02`, `57P03` | `42501` |
| `53300` | Unmapped `23xxx` |
| `40P01`, `40001`, `55P03` | Marshal errors and programming faults |
| `57014`: replace the current `DeadlineExceeded` wrap with `ErrUnavailable` | Anything not on the left |

- **No string matching.** Text such as "connection refused" or "conn closed" is never classification.
- **Unmatched failures are findings.** If a real fault produces an untyped error that matches nothing, it stays 500 and is recorded as a finding. No string fallback is added.
- **Package boundaries.** The inbound package never imports `pgx` or `pgconn`. The depguard rules stay unchanged and green.

### Problem type ownership

- The mapping sets `Type`.
- Both `newErrorHandler` and `completeProblem` must stop overwriting it. They default to `about:blank` only when `Type` is empty.
- Only the unavailable class gets a catalogue URI in this fix. The broader `about:blank`→catalogue gap stays out of scope, as in the disposition (§2).

### Probes and migrations: preserve exactly

- `/healthz`: 200.
- `/readyz`: 503 on failure with its **current bytes**. Row 4 must exclude probe paths.
- `migrate` and `relay` subcommands, `OutboxSource`, and R02 invalid-config exits: no change.

### Fixed 503 body

- `detail` is one fixed string, for example "service temporarily unavailable".
- It must **not** say "not saved", "no changes" or "not committed".
- No driver text, resource, existence or role information.
- HEAD keeps `NoContent(503)`.

### Unverified API assumptions

From the source alone I cannot confirm two things. ZCode must verify both by test, not assumption:

- whether Echo v5 `ContextTimeout` yields an `HTTPError` 503 or a raw `DeadlineExceeded`;
- the exact pgx v5 error types surfaced for each fault.

---

## 2. `retryAfter` convention

**Authorized as a local implementation detail, not a contract decision:**

- `retryAfter` is the JSON integer `1`.
- It is documented in a code comment and `docs/api.md` as *seconds, native-template constant, not a MatterControl contract value*.
- It is a single unexported constant in the inbound adapter.

**Why this fits the unchanged contract:** the catalogue requires `retryAfter` on 503 and A1 requires it to be positive, but no unit is specified. Any positive constant satisfies the text without asserting a product convention.

**Explicitly not authorized:**

- an env var or configuration;
- a `Retry-After` header;
- a client or server retry policy;
- a derivation from internal state;
- any claim that this is the MatterControl unit or range.

**Approval dependency (unchanged, still open):** the product-level unit and range of `retryAfter`, the optional `Retry-After` header, and the "503 on command = outcome unknown" note (disposition §3, items 1–3).

- These require a Claude Code proposal and a dated PO decision record, in the style of `step-02-local-approval.md`.
- I am not inventing a decision ID.
- Until then, C01-PRODUCT cannot close.

**Template definition of done (`AGENTS.md`):**

- `docs/api.md`, `api.http` and the affected `testdata/*.golden` 503 bodies change in the same commit.
- Every other golden file must stay byte-identical.
- Tests must be observed failing before the fix.

---

## 3. Partition of A1–A15

### Native template regression (executable now, gates `C01-NATIVE`)

| Case | Native form |
|---|---|
| A1 | DB stopped or unreachable, on a new disposable target. GET, list, POST, PUT/PATCH and DELETE on `/api/v1/users` → 503 unavailable, `retryAfter: 1`, fixed detail, no driver text. |
| A2-native | Existing vs nonexistent user ID during outage: bodies byte-identical except `instance`. *Inaccessible* is deferred. |
| A3 | `/healthz` 200 and `/readyz` 503 (current bytes) during the outage; both 200 after recovery, with no restart. |
| A7 | Two parts: <br>• Table-driven `mapError` unit tests with constructed `*pgconn.PgError` for every retryable code. <br>• Real-fault integration for: connect refused, `57P01` via `pg_terminate_backend` from a second session, `57014` via a low `StatementTimeout` plus a row lock held by a barrier session, and pool-acquire timeout via `MaxConns=1` plus a held connection. <br>• Check no partial effect: the row is unchanged after a failed Update. <br>• Use barriers, not sleeps. |
| A8 | Unit: `42P01`, `22xxx`, `42501`, unmapped `23xxx` → 500. Integration: fresh schema without migration → 500, no `retryAfter`. |
| A9 | Client cancel → 499. **Precedence case:** cancel during an in-flight query whose chain contains 57014 or `DeadlineExceeded` → still 499, asserted via recorder or log, not via the disconnected client. Request timeout → 503. |
| A10 | depguard and golangci-lint pass; inbound has no `pgx`/`pgconn` import. |
| A11-native | Postgres adapter: real faults satisfy `errors.Is(err, port.ErrUnavailable)`. A **test-only** decorator around memory (in a `_test.go` or `repotest` helper) returns the same sentinel for HTTP tests. No fault switch, flag or env var in production code. |
| A13 | Huma `apiError` path and Echo `HTTPError` path both carry the mapped type. Echo 4xx are unchanged. Huma-internal `huma.NewError` responses are characterized only, not changed. |
| A14-native | Outage log entries have `request_id` and status 503, and contain no DSN, password or query values. |

Also required:

- `make check` passes, with an explicit report of whether PostgreSQL tests ran or skipped.
- The full existing suite passes, with goldens unchanged except the 503 ones.

### Deferred: product or Workers acceptance (C01-PRODUCT, stays OPEN)

| Case | Why deferred |
|---|---|
| A2 (inaccessible) | Needs authorization |
| A4, A5, A6 | Need `Idempotency-Key`, receipts, `GET /operations/{key}`, `MatterUnitOfWork` and authorization |
| A11-product | Shared `MatterUnitOfWork` contract suite |
| A12 | Membership/auth store |
| A14 | Explicit `error_class` log field and log policy |
| A15 | Workers/Hyperdrive adapter |

Also deferred: the `retryAfter` unit and range, the `Retry-After` header, and the catalogue-wide `type` gap.

**No auth, idempotency or UoW scaffolding** may be added to satisfy these.

### Status model

- **`C01-NATIVE` may PASS** on the native set above, after independent OpenCode verification.
- **`C01-PRODUCT` stays OPEN, not waived.** Disposition §2 still holds: no MatterControl `/api/v1` adapter may claim conformance until the deferred cases pass.
- **Overall C01:** `NATIVE_PASS / PRODUCT_OPEN`, never CLOSED as a whole.

---

## 4. Unknown commit, cancellation vs timeout, probes

**Unknown commit**

- In the native template, writes are autocommit statements (outbox off) or `pgx.BeginFunc` (outbox on). A failure after the statement or COMMIT was sent maps to 503 with *outcome unknown*.
- No retry loop in the adapter or service. No `pgconn.SafeToRetry`-driven write retry.
- `docs/api.md` must state that a 503 on a non-GET does not mean "not applied".
- The template has no idempotency, so duplicate-safe retry is a product obligation (A4/A5), not a native claim.

**Actual request cancellation**

- This means the client disconnected and the request context is `Canceled`. It maps to **499**, never 5xx.

**Request timeout vs SQLSTATE 57014**

- Request timeout (`ContextTimeout` → `DeadlineExceeded`) maps to **503 unavailable**.
- SQLSTATE 57014 not caused by client cancellation (`statement_timeout` or an admin `pg_cancel_backend`) maps to **503 unavailable** via `ErrUnavailable`.
- 57014 that pgx triggered *because the request context was cancelled* maps to **499** (row 2 precedence).

**Probes and migrations**

- Probes and the readiness function are untouched.
- Migration and relay error paths do not use the HTTP mapping and are untouched.

---

## 5. Integration PoC: prerequisites and decision request only

**Fact:**

- The frontend targets `/tasks` and `/tasks/stats` with a fail-closed `resolveSession` that returns null.
- The backend exposes `/api/v1/users` with empty `APIMiddleware`, meaning no auth.
- No honest end-to-end path exists today.

**Prerequisites:**

1. C01-NATIVE PASS.
2. A PO plus Claude Code decision on what "integration PoC" means under H5.
3. If any auth seam is involved, an identity decision, which DEC-023 does not approve.

**Decision request (for the PO, with my architecture review; none of these is approved here):**

- **(a)** Re-scope the H5 integration gate to transport-level evidence: reachability, `problem+json` parsing and `unavailable` → stale/error-banner mapping, using a test harness outside product screens.
- **(b)** Defer integration until a MatterControl API/auth seam exists.
- **(c)** Some other option the PO proposes.

**Explicitly not approved:**

- resource aliases (`/tasks`→`/users`);
- auth bypass or a wildcard anonymous session;
- new endpoints or screens;
- frontend adapter or topology selection.

Integration stays **PENDING** and does not block C01-NATIVE dispatch.

---

## Dispatch envelope (for Codex's ZCode prompt)

| Item | Content |
|---|---|
| Baseline | `d024e3e` |
| Worktree | New task-specific worktree and branch; fail if the path is occupied. Do not modify `/tmp/mattercontrol-step021-backend`, which is preserved R01/R02 evidence. |
| Database | New, verified disposable PostgreSQL target. |
| Files in scope | `internal/core/port/errors.go`, `internal/adapter/outbound/postgres/user_repository.go`, `internal/adapter/inbound/httpapi/{errors,openapi}.go`, tests, the affected golden files, `docs/api.md`, `api.http` |
| Out of scope | Everything else, especially the relay/outbox, config, probes, migrations and normative docs. |
| Reviewer | OpenCode, independent. Escalate to Claude Code for any deviation from this table. |
| Dispatch mode | Manual paste. ZCode CLI lacks packaged provider configuration, so the task is `WAITING_MANUAL_DISPATCH`. |

## Conclusion

**DISPATCH_READY** for scoped `MC-002-BE-C01-NATIVE`, under the rules in §1 to §4. Full C01 product obligations remain OPEN and are not waived, with the exact dependencies listed in §2 and §3. All implementation and runtime tests are **NOT_RUN** in this review.
