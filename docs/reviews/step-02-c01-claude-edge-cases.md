# MC-002-BE-C01: Edge-Case Clarification (packet-only)

**Reviewer:** Claude Code (claude-opus-5-5). No tools, files or runtime were used.
**Not run:** all tests. **Not changed:** any normative file, ADR, policy or approval.

## 1. A `ConnectError` that wraps a `PgError`

**Confirmed: SQLSTATE comes first.** Inside `mapError`, after the existing domain mappings (`23505` → `ErrEmailAlreadyExists`, and so on), the order is:

1. **`errors.As(err, &pgErr *pgconn.PgError)`**
   - If the code is in the retryable set (class `08`, `57P01`/`02`/`03`, `53300`, `40P01`, `40001`, `55P03`, `57014`), wrap it with `port.ErrUnavailable`.
   - **Otherwise it stays 500.** This covers `28P01`, `28000`, `3D000`, `42501`, `42xxx`, `22xxx` and unmapped `23xxx`. It holds even when a `ConnectError` sits outside the `PgError`.
2. **Only if no `PgError` is in the chain:** `errors.As(err, &*pgconn.ConnectError)` → `ErrUnavailable`.
3. **Everything else:** the existing generic wrap, which gives 500.

Rules that still apply:

- There is no `net.Error` rule and no string matching.
- An unknown or untyped error stays 500 and is recorded as a finding.
- Inbound row 2 still takes precedence. A `ConnectError` or acquire failure whose chain contains `context.Canceled`, or whose request context is cancelled, maps to 499 even if `ErrUnavailable` was added.

**Required unit cases:**

| Case | Expected |
|---|---|
| `ConnectError{PgError 28P01}` | 500 |
| `ConnectError{PgError 3D000}` | 500 |
| `ConnectError{PgError 42501}` | 500 |
| `ConnectError{PgError 53300}` | 503 |
| `ConnectError{PgError 57P03}` | 503 |
| Bare `ConnectError` (dial failure) | 503 |
| `ConnectError` wrapping `context.Canceled` | 499 |

## 2. Untyped faults after termination or COMMIT

**Confirmed.**

- Timing or COMMIT uncertainty never selects 503 on its own. Only typed-classified failures map to 503. An unmatched real-fault error stays 500 and becomes an open finding, not an accepted PASS.
- The *outcome unknown* wording in my clarification (§4) applies only to failures that were classified. The docs warning must cover both classes: "a 5xx on a non-GET does not mean the change was not applied." No body or doc may assert that nothing was committed.
- C01-NATIVE PASS stays gated on the real-fault integration evidence in A7 (connect refused, `57P01` via terminate, `57014`, acquire timeout). Constructed unit errors alone are not enough.

## 3. Existing CAS / version-conflict retries

**Confirmed.** "No retry" means no **new** transient or write retries. Any existing optimistic-concurrency behaviour (`ErrVersionConflict` and its handling) stays byte-for-byte unchanged.

One guard I am adding:

- Wrapping `40001`/`40P01` in `ErrUnavailable` must not change which errors the existing retry predicate matches.
- ZCode must show by test that the existing CAS path's retry count and outcome are unchanged.
- If the existing predicate already matches any SQLSTATE that is now reclassified, stop and escalate. Do not adjust it.

## 4. Log privacy tests

**Confirmed.** A14-native must capture the **actual** log output, such as a test `slog` handler buffer or captured stdout, during the real-fault runs. It must then assert that the output contains none of the following:

- the test password;
- the DSN;
- query parameter values.

It must also assert that `request_id` and status 503 are present. Whether a wrapped `ConnectError` excludes credentials must be observed, not assumed.

If those assertions fail and the fix needs a change to logger or redaction code:

- **Stop and flag it to Claude Code** before touching any path outside the scoped file list.
- Any approved change is limited to the error attribute logged by the HTTP error path.
- No global logging rewrite and no new log policy. A14 product (`error_class`, log policy) stays deferred.

## Dispatch status

**DISPATCH_READY for `MC-002-BE-C01-NATIVE` stands**, with §1–§4 above as binding amendments:

- **Ordering:** SQLSTATE-first ordering replaces the earlier flat list entry "`*pgconn.ConnectError` → unavailable" in the outbound classification table.
- **Dispatch prompt:** the ZCode prompt should include this note verbatim alongside the earlier clarification.
- **Unchanged:** the envelope (baseline `d024e3e`, new worktree, new disposable PostgreSQL target, file scope, OpenCode reviewer, manual dispatch) and the `NATIVE_PASS / PRODUCT_OPEN` status model.

Still deferred and **not** authorized here: auth, idempotency, `MatterUnitOfWork`, product or Workers work, normative changes, new policy and production approval.
