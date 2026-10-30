# Step02 — RMV-F01 explicit answer expectation at the trust boundary

Read COMMON.md and the step01 checkpoint. Scope is the missing-precondition defect, not a new CAS protocol or general API rewrite.

## Owned paths

Relative to `apps/backend`:

- `internal/adapter/inbound/productapi/review_handlers.go`, relevant DTO/HTTP tests.
- `internal/core/port/review.go`, `internal/core/service/review_service.go` and shared contract/service tests **only if required** to carry presence through the central authorization gate.
- Review test fixtures/callers that must explicitly declare an empty expectation; preserve all unrelated dirty bytes.
- `docs/api.md` and narrow task-local proposed shared contract delta. No generated SQL, migration, composition/policy/router edit is expected.

## Required behavior

The current JSON string field maps both missing/null and explicit "" to the same value, allowing a malformed empty-cell command to write201. Preserve intentional explicit "" for an observed empty cell, but distinguish absence/null and return428 for an authorized otherwise valid request. Do not replace an empty expected ID with whatever is current at execution time.

Preserve the order of trust/visibility checks: unauthenticated remains401, a known nonmember/revoked user or hidden foreign grid remains uniform404, VIEWER remains the existing role denial, and missing preconditions must not reveal hidden existence. Do not implement an eager HTTP presence return that short-circuits the established service gate for unauthorized callers. Carry the minimum presence information through existing patterns if necessary; no HTTP/driver type in core.

## Red-before-green tests

Extract the verifier's missing-expectation test, then add:

| Request/caller | Expected behavior |
|---|---|
| Authorized writer, missing expectedAnswerId |428, no answer/event/receipt effect |
| Authorized writer, null expectedAnswerId |428 under the same missing-expectation contract; record explicitly |
| Wrong JSON type | existing malformed/validation contract, no write |
| Explicit "", empty cell, correct wording revision |201 |
| Explicit "", existing answer |412, unchanged history |
| Explicit exact current answer ID |201, one successor |
| Stale expected ID or stale questionRevision |412, no write |
| Missing questionRevision |428 under existing contract |
| Same complete request/key after success/UNKNOWN | original byte-stable receipt, not a second answer |
| Anonymous/nonmember/revoked/VIEWER/foreign grid, with and without expectation | unchanged auth/hidden-resource precedence; no existence leak |

Check that rejected requests leave answer count/history/state unchanged. Preserve original key/request hash; no retry/key regeneration in tests. If a port change affects memory/PG callers, update them completely and run shared contracts on both stores. Do not modify generated sqlc or applied0008 for request presence.

Run targeted domain/service/HTTP/shared contracts as affected; use the fresh owned synthetic PG fixture when PG tests are required, never retained DB. Update the narrow HTTP contract and record red/green/source delta. Continue03; final full gates run after the remaining code settles.

Skipped: broad CAS refactor, new migration, IdP/provider/runtime actions. Risk: fixing428 before authorization can introduce a visibility regression even while the happy-path test passes.
