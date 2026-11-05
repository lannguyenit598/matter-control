# MatterControl backend (BE-01 transaction spine)

Status: LOCAL_SLICE_IMPLEMENTED (MC-BE-01). Bounded local source/test slice on branch
`codex/mc-be-01`; no product HTTP endpoint, binary, deployment or release is included
or implied. See `docs/architecture.md` for the legacy userapi architecture this
repository originally is; this page documents only the MatterControl addition.

## What exists

- `internal/core/domain/matter`: typed product domain — identities (`ActorID`,
  `MatterID`, `RequirementID`, ...), the `Requirement` aggregate with its approved
  initial state (NOT_STARTED / READY / UNVERIFIED with verification REQUIRED,
  revision 1, proof epoch 0, no owner/workstream/due), access facts, the typed
  creation event, the immutable created-result snapshot, and the injected key-age
  policy (`KeyAgePolicy`; zero value enforces nothing — no retention default is
  invented, TB-06 remains open).
- `internal/core/policy`: the approved operation matrix, default deny. Create needs an
  ACTIVE workspace membership AND an ACTIVE matter membership with role OWNER or
  EDITOR; a workspace role alone — including workspace OWNER — grants no matter
  operation. Read needs active memberships with any matter role.
- `internal/core/port/matter.go`: the spine contract. `CreateRequirementCmd` and
  `GetRequirementQuery` carry primitives; `ActorID` is a trusted calling identity
  (product `users.id`), never client-editable data. Outbound: `MatterStore.Execute`
  (unconditional READ COMMITTED transaction; matter row locked FOR UPDATE first;
  t_cmd = `greatest(clock_timestamp(), last_recorded_at)` captured with the lock) and
  `MatterStore.View` (one REPEATABLE READ READ ONLY snapshot; asOf from its first
  statement). `RecordIDGenerator` mints record ids as opaque strings — never the
  legacy `domain.UserID`. Additive outcome errors: `ErrForbidden`,
  `ErrIdempotencyKeyReuse`, `ErrOutcomeUnknown`.
- `internal/core/service/matter_service.go`: orchestrates the transaction —
  memberships read FOR SHARE inside the lock, policy decision, receipt replay check
  AFTER current authorization (read access to the scope and every represented
  matter), then node + typed row + obligatory history event + immutable receipt +
  matters update, committed once. Denials write a restricted security-audit row and
  no domain-success event. A lost commit acknowledgement returns `ErrOutcomeUnknown`,
  never an invented result.
- `internal/adapter/outbound/postgres/matter_store.go` + `matter_migrate.go` +
  `matter_dto.go`: the PostgreSQL adapter over pgx and the second sqlc job
  (`mcsqlc`, generated from `migrations_mattercontrol` + `queries_mattercontrol`).
  Error mapping extends the accepted SQLSTATE-first classification: the
  `command_receipts` primary-key conflict maps to `ErrIdempotencyKeyReuse`; retryable
  classes stay `ErrUnavailable`; no text matching.
- `internal/adapter/outbound/repotest/mattercontrol`: the shared contract suite plus
  an in-memory double (global mutex; snapshot-copy rollback) used by the suite and by
  service unit tests.
- Product schema: `migrations_mattercontrol/0001_mattercontrol_core.sql` —
  users/workspaces/memberships/matters (event_seq, nondecreasing last_recorded_at),
  workstreams, graph_nodes + typed requirements/actions with a DEFERRED typed-totality
  constraint trigger, append-only domain_events / command_receipts /
  command_receipt_matters (trigger guards), and restricted security_audit_events.

## Deliberate boundaries

- No HTTP endpoint, auth-provider implementation or product binary. The trusted
  ActorID in tests proves membership/role enforcement, NOT authentication.
- The native C01 `retryAfter=1` is not adopted as a product retry policy.
- `command_receipts.purge_after` is NULLABLE in this bundle (deviation from the
  data-model sketch): no retention value is approved, so none is invented and no
  purge job exists (TB-06 open).
- Temporal boundaries: create never sets due dates and never writes
  `next_boundary_at`; no boundary evaluation exists in this slice, and nothing
  silently no-ops an unsupported pending boundary — later commands own that
  (state-machine §6 handling).
- The legacy `r.write`/outbox rule in `.claude/rules/persistence.md` is untouched for
  legacy User writes. The MatterControl store is the explicitly scoped exception: an
  UNCONDITIONAL transaction per command, because a product command must never run on
  a pool without a transaction (the legacy helper does exactly that when the outbox
  is disabled).
- F-08 gap-row unit and F-10 nested filing reads are outside this slice.

## Tests

- Unit: `internal/core/domain/matter`, `internal/core/policy`,
  `internal/core/service` (memory double), `internal/adapter/outbound/system`.
- Shared contract: `repotest/mattercontrol` runs against the memory double and the
  PostgreSQL adapter (same suite), covering BE01-T02..T09: denial matrix with audit
  rows and no domain events, atomicity with per-step rollback injection, sequential /
  concurrent / restart replay, key reuse, cross-matter same-key (one effect, no
  leaked divergent response), revocation and demotion semantics, uniform read
  outcomes (inaccessible / nonexistent / kind-mismatch), snapshot consistency across
  a concurrent create, and commit-phase outcomes (unknown vs known abort).
- PostgreSQL: product tests read `MC_TEST_DATABASE_URL` and create a FRESH schema per
  test via `pgtest.FreshSchemaDSNFrom`, then run the product migrations in it. Native
  legacy tests keep `TEST_DATABASE_URL` semantics unchanged. Both variables must
  point at disposable, separately owned databases — never fixtures or production.

## Known limitations

- Authentication, wire format (headers, problem bodies, golden files), product HTTP
  composition (Fx) and any deployment: NOT_VERIFIED / not present by design (BE-02+).
- The lock order reduces deadlock risk; deadlock freedom is not proven. Detected
  deadlocks map to retryable unavailability.
- The in-memory double serializes on one mutex; true per-matter concurrency and the
  receipt-PK race are exercised against the PostgreSQL adapter.
