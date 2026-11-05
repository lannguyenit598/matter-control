# MC-002-BE-ARCH-REVIEW: DB-down data path (500 vs 503 `unavailable`)

**Reviewer:** Claude Code (actual), claude-opus-5-5, packet-only. No tools, commands or files were used.
**Basis:** sanitized exports only, source `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b` as executed by ZCode. This is the first actual architect disposition of this finding; earlier "escalated" statements had no architect return.
**Scope:** H5/W1 local only. This review does not approve product, topology, cost, deploy or release.

## 1. Finding disposition

**CONFIRMED.** With PostgreSQL stopped, the server returned:

| Route | Observed | Approved MatterControl contract |
|---|---|---|
| `/healthz` | 200 | 200 (liveness is independent of the DB). Conforms. |
| `/readyz` | 503, `about:blank` | 503. Conforms (probes are outside `/api/v1`). |
| `/api/v1/users` | **500**, `about:blank`, no `retryAfter` | **503 `/problems/unavailable` + `retryAfter`**, and never a default READY/zero |

**Root cause:**
- `toProblem` maps only `context.DeadlineExceeded` to 503. Everything else falls through to 500.
- `mapError` wraps connectivity failures generically.
- `newErrorHandler` forces `type: about:blank` on every problem.

## 2. Classification

- **Native H5 baseline: no impact on PoC acceptance.** The template behaves as its own design intends: it fails safe, leaks nothing to the client, keeps liveness and readiness distinct, and recovers. "PASS with finding" stands as a baseline characterization.
- **Future product contract conformance: NON-CONFORMANT, blocking.** No MatterControl `/api/v1` adapter may claim conformance until this is fixed.
- **Contract is not waived.** The broader `about:blank` vs catalogue `type` URI gap is the same class of obligation, but it is outside this finding.

## 3. ADR or contract change?

**No normative change is needed.** This is an implementation obligation under the unchanged contract and ADR-002:
- The catalogue already defines the 503 entry.
- ADR-002 §1a already maps `40P01` to a retryable 503 with no partial effect.
- Unknown-outcome semantics already exist.

**Recommended non-normative clarifications** (these need architecture approval and are not waivers):
1. The unit and range of `retryAfter` (suggested: integer seconds from bounded configuration, never derived from internal state). The contract leaves this unspecified.
2. Whether to emit a `Retry-After` header as well. This would be additive and optional.
3. A short note that 503 on a command means *outcome unknown*, not *not committed*.

## 4. Minimal conceptual remediation (hexagonal)

1. **The outbound adapter classifies.** The postgres adapter (and each future adapter, including a Workers/Hyperdrive one) translates driver failures into a **core-owned unavailability outcome**, such as a port-level sentinel. This mirrors how `57014` is already translated today.
   - Inbound code tests only that core outcome.
   - Inbound code never imports `pgx`/`pgconn`; the existing depguard rules must stay green.
   - The memory adapter must be able to produce the same outcome so the shared contract suite can assert it.
2. **Retryable (map to 503 `unavailable`):**
   - connect/dial failure
   - pool acquire timeout
   - SQLSTATE class `08`
   - `57P01`/`57P02`/`57P03`
   - `53300`
   - `40P01`, plus `40001`/`55P03` if ever used
   - `57014` statement timeout, which currently gives 503 with `about:blank`
3. **Not retryable (stay 500, no `retryAfter`):**
   - unmapped constraint violations
   - `42xxx` errors such as schema drift or undefined objects
   - `22xxx` data exceptions
   - `42501` privilege misconfiguration
   - marshal errors and programming faults

   A 500 is never relabelled as 503 just because it happened during an outage.
4. **Unknown commit:**
   - A failure after COMMIT was sent maps to 503. The problem body must not assert that nothing took effect.
   - No blind in-adapter retry of writes. Any server-side retry must re-enter the full `MatterUnitOfWork` path: scope lock, then current authorization, then receipt check.
   - Clients recover with the **same** `Idempotency-Key` or via `GET /operations/{key}`.
5. **Authorization is preserved:**
   - The 503 body is uniform, with fixed detail and no resource, existence or role information. It is identical for existing, nonexistent and inaccessible IDs.
   - Replay and operations lookup never return a stored body unless current authorization succeeded.
   - Future auth or membership middleware that cannot reach its store must answer 503 (fail closed), never pass through.
6. **Unchanged:** `context.Canceled` stays 499. Probes keep their current semantics.
7. **The problem `type` comes from the mapping,** not a blanket `about:blank` override. Huma-originated and Echo-originated errors must both pass through the single mapping.

## 5. Client-body redaction vs diagnostic logs (separate findings)

- **Client body: PASS (observed).** The 500 body contained only type, title, status and instance; no driver text appeared. The remediation must keep `detail` a fixed string.
- **Diagnostic logs: acceptable for local H5, with a policy note.**
  - The ERROR and WARN entries include the wrapped pgx error with DB user, database name and host:port. This is operational metadata, not a secret, but future log policy should classify it.
  - Logs must never contain a DSN, password or query parameter values.
  - The future 503 log entry should carry an error class plus `request_id`.
  - The password exposure recorded in intake was in the private `30-migrate-run1.log` shell trace, not in application logs. It is a separate evidence-hygiene item, already redacted in exports.
  - One log sample does not prove a general redaction property.

## 6. Acceptance cases for the future assigned fix (all NOT_RUN)

| # | Case | Expected |
|---|---|---|
| A1 | DB stopped; GET and non-GET `/api/v1` routes | 503 `application/problem+json`, `type /problems/unavailable`, positive `retryAfter`, no driver text |
| A2 | A1 with existing vs nonexistent vs inaccessible IDs | Byte-identical bodies except `instance` |
| A3 | Outage probes, then recovery | `/healthz` 200 and `/readyz` 503 during the outage; both 200 after recovery |
| A4 | Command rejected before admission | 503; no receipt, no events; same-key retry after recovery executes exactly once |
| A5 | Connection killed after COMMIT (R8) | Retry with same key → `Idempotent-Replayed: true`; operations lookup → `COMMITTED`; exactly one event |
| A6 | A5, but caller's access revoked before the retry | Uniform 404; stored body not returned |
| A7 | Injected `40P01`, `57014`, `57P03`, `53300`, pool-acquire timeout | 503 `unavailable`; no partial effect |
| A8 | Undefined table, unmapped constraint, programming error | 500; no `retryAfter` |
| A9 | Client cancel | 499 |
| A10 | depguard and import check | Inbound package has no `pgx`/`pgconn` import; lint passes |
| A11 | Shared contract suite | Postgres and memory adapters both produce the unavailability outcome |
| A12 | Membership/auth store unreachable | 503; request never proceeds |
| A13 | Huma- and Echo-originated errors | Both pass through the single mapping |
| A14 | Log inspection during outage | Error class and `request_id` present; no DSN or password |
| A15 | Repeat A1–A9 on any Workers/Hyperdrive adapter | Native success is not evidence for H3 |

All tests in this table are **NOT_RUN**. They must run against a newly verified disposable PostgreSQL target, using injected faults rather than sleeps.

## 7. Status

- **Finding:** confirmed. Disposition is an **implementation obligation under the unchanged contract**, assigned to future backend adapter work.
- **Optional clarifications:** `retryAfter` units and the `Retry-After` header, pending architecture approval.
- **MC-002-BE:** remains **IN_REVIEW**, pending independent OpenCode QA.
- **Not approved by this review:** source changes, scaffolding, providers, deploy or release.
