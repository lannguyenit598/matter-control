# API reference

Reference for API clients. Default local base URL: `http://localhost:8080`. Example requests: [`api.http`](../api.http). With `API_DOCS_ENABLED=true`, the server also publishes an OpenAPI 3.1 document at `/openapi.json` and SwaggerUI at `/docs` ([operations.md](operations.md#api-documentation)); this page remains the reference for behavior the schema cannot express, such as normalization and `If-Match` rules.

## General conventions

| Item | Convention |
|---|---|
| Format | JSON (`application/json`); `Accept` is ignored. Requests with bodies (POST, PATCH) **must** send `Content-Type: application/json` (case-insensitive; parameters such as `; charset=utf-8` are allowed). Missing headers and other media types, including forms/XML, return 415 |
| Body size | Maximum 1 MiB; larger bodies return 413, including chunked bodies without `Content-Length` |
| Unknown body fields | Ignored without errors |
| ID | Canonical lowercase UUID v7 (`01a15359-aa28-7a00-a380-c47e52905707`). Malformed IDs, including uppercase UUIDs, are treated as absent: 404 |
| Time | RFC 3339, UTC, microsecond precision (`2026-10-19T08:49:07.624656Z`). Trailing fractional zeros are omitted (`…07.5722Z`, `…07Z`), so precision varies from 0 to 6 digits: use an RFC 3339 parser, not a fixed six-digit format |
| Errors | RFC 9457 `application/problem+json`; see [Errors](#errors) |
| Authentication | The template has **no authentication**. See [operations.md](operations.md#authentication) to add it |
| Timeout | Each request uses `REQUEST_TIMEOUT` (default 10s); each SQL statement uses `DB_STATEMENT_TIMEOUT` (default 5s). Either timeout returns 503 `/problems/unavailable` (see [Errors](#errors)) |

### Header

| Header | Direction | Meaning |
|---|---|---|
| `X-Request-Id` | Request (optional) / Response (always) | Log correlation ID. Client values are preserved only if at most 128 characters using `A-Z a-z 0-9 - _ .`; otherwise the server generates one. Responses always return the ID in use |
| `ETag` | POST, single-user GET, PATCH responses | Current user version as `"<version>"`, for example `"3"` |
| `If-Match` | PATCH request (optional) | Update only if the current version matches. See [Concurrent updates](#concurrent-updates) |
| `Location` | POST response | Path to the newly created user |

## The `User` resource

```json
{
  "id": "01a15359-aa28-7a00-a380-c47e52905707",
  "email": "lan@example.com",
  "name": "Lan Nguyen",
  "created_at": "2026-10-19T08:49:07.624656Z",
  "updated_at": "2026-10-19T08:49:07.624656Z",
  "version": 1
}
```

| Field | Rules |
|---|---|
| `email` | Required; trim and lowercase; maximum 254 characters; bare address only (`a@b.com`, not `Name <a@b.com>`); unique after normalization |
| `name` | Required; collapse whitespace (including tabs, newlines, Unicode spaces) to single spaces (`"  Lan   Nguyen "` → `"Lan Nguyen"`); maximum 100 Unicode code points (a base character plus combining mark counts as 2) |
| `version` | Starts at 1 and increments by 1 on each actual change |
| `updated_at` | Changes only when data changes |

## Endpoint

### `POST /api/v1/users`: create a user

```http
POST /api/v1/users
Content-Type: application/json

{"email": " Lan@Example.COM ", "name": "  Lan   Nguyen "}
```

**201 Created**, with `Location: /api/v1/users/<id>` and `ETag: "1"`. The body is the new user with normalized email and name.

Common errors: 422 (invalid input), 409 (duplicate email), 400 (invalid JSON), 413 (oversized body), 415 (`Content-Type` is not `application/json`).

### `GET /api/v1/users`: list users

| Query | Default | Rules |
|---|---|---|
| `limit` | 20 | `≤ 0` uses 20; values above 100 are **capped at 100** without errors; non-integers return 400 |
| `offset` | 0 | Negative values use 0; above 10,000 returns 422; non-integers return 400 |

Ordered by `created_at` ascending, then `id`. The response reports the **effective** `limit`/`offset`:

```json
{
  "data": [ { "id": "…", "email": "lan@example.com", "name": "Lan Nguyen", "…": "…" } ],
  "meta": { "limit": 20, "offset": 0, "total": 42 }
}
```

Offset pagination suits admin screens that jump to page N. Do not use it to scan large datasets; that is why offset is capped at 10,000.

### `GET /api/v1/users/{id}`: get a user

**200 OK**, with `ETag`. Missing user or malformed ID: 404.

### `PATCH /api/v1/users/{id}`: partial update

```http
PATCH /api/v1/users/01a15359-aa28-7a00-a380-c47e52905707
Content-Type: application/json
If-Match: "1"

{"name": "Lan Pham"}
```

- Only supplied fields are updated. Omitted or `null` fields remain unchanged.
- Empty body or `{}`: return 200 with the current user without incrementing `version`.
- **200 OK**, with the resulting `ETag`.

Common errors: 404, 422, 409 (duplicate email or version conflict), 412 (`If-Match` mismatch), 400, 413, 415 (as for POST).

### `DELETE /api/v1/users/{id}`: delete

**204 No Content**. Missing user or malformed ID: 404. Deleted users' email addresses can be reused.

> `DELETE` does **not** check `If-Match`: the header is ignored and the user is deleted.

### Probe

| Endpoint | Meaning | Response |
|---|---|---|
| `GET /healthz` | Liveness: process is alive | 200 `{"status":"ok"}` |
| `GET /readyz` | Readiness: pod can receive traffic | 200 `{"status":"ready"}`; 503 during shutdown (or database failure when `READINESS_CHECK_DB` is enabled) |

Probes have no `/api/v1` prefix, bypass authentication middleware, and do not generate `http_request` access logs. A failed `/readyz` emits one WARN log: `readiness check failed`.

## Concurrent updates

Each write checks `version` (optimistic locking), preventing concurrent PATCH requests from silently overwriting changes based on stale reads.

| Client sends | On conflict |
|---|---|
| No `If-Match` (or `If-Match: *`) | Server rereads and reapplies changes, up to 3 total attempts. Remaining conflicts return **409** |
| `If-Match: "<version>"` | A different current version returns **412** without retry. Client should GET again, show fresh data, and let the user decide |
| Weak ETag (`W/"2"`) or a value differing from the issued `"<number>"` form (such as `"+2"`, `"02"`) | Always **412**: RFC 9110 If-Match uses character-for-character strong comparison |
| Empty `If-Match` or multiple ETags (`"1", "2"` or repeated header lines) | Always **412**, even if the current version appears. Only **one** ETag is accepted; rejection is safer than treating it as absent and overwriting unconditionally |

Edit forms should retain the ETag from GET and send it as If-Match. This detects edits based on stale user-visible data.

## Errors

All errors use `Content-Type: application/problem+json`:

```json
{
  "type": "about:blank",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "request failed validation",
  "instance": "/api/v1/users",
  "errors": [
    {"field": "email", "message": "must be a valid email address"},
    {"field": "name",  "message": "is required"}
  ]
}
```

`errors` appears only for 422. 5xx responses never expose internal details; use `X-Request-Id` to locate the underlying error in logs.

Retryable unavailability (503) returns a fixed body with a `retryAfter` hint:

```json
{
  "type": "/problems/unavailable",
  "title": "Service Unavailable",
  "status": 503,
  "detail": "service temporarily unavailable",
  "instance": "/api/v1/users",
  "retryAfter": 1
}
```

`retryAfter` is an integer number of seconds. Its value is a **native-template constant** (1), not a MatterControl production convention. **A 5xx on a non-GET request does not mean the change was not applied**: the outcome of a failed write is unknown (this template has no idempotency), so never assume "not committed" from a 503.

| Status | When | `detail` |
|---|---|---|
| 400 | Invalid JSON body | `request body is not valid JSON` |
| 400 | Wrong field type, such as `{"email": 5}` | `field "email" has the wrong type` |
| 400 | JSON body is not an object, such as `[]` | `request body must be a JSON object` |
| 400 | Non-integer `limit`/`offset` | `limit must be an integer` / `offset must be an integer` |
| 404 | Missing user or malformed ID | `resource not found` |
| 404 | Unknown route, including trailing `/`, such as `/api/v1/users/` | (empty) |
| 405 | Wrong method for the route; response includes `Allow` | |
| 409 | Email belongs to another user | `a user with this email already exists` |
| 409 | Version conflict after 3 attempts without `If-Match` | `the user was modified concurrently, please retry` |
| 412 | `If-Match` does not match the current version | `If-Match does not match the current version of the resource` |
| 413 | Body exceeds 1 MiB | |
| 415 | POST/PATCH has a body without `application/json` Content-Type (missing, form, XML...) | |
| 422 | Invalid input with per-field `errors` | `request failed validation` |
| 499 | Client disconnects before response, or requests are canceled after shutdown timeout. The client receives no such response; 499 appears only in logs. A disconnect wins over every other classification | |
| 500 | Unexpected error, including authentication/privilege/schema faults (these are never retryable 503s) | (empty) |
| 503 | Storage temporarily unavailable: request exceeds `REQUEST_TIMEOUT`, SQL exceeds `DB_STATEMENT_TIMEOUT`, connection failure or termination, pool exhaustion, or lock/deadlock conditions | `service temporarily unavailable` (+ `retryAfter`) |
| 503 | `/readyz` when the pod is not ready | (empty) |

Field error messages (`errors[].message`):

| Field | Message |
|---|---|
| `email` | `is required`, `must be at most 254 characters`, `must be a valid email address` |
| `name` | `is required`, `must not contain NUL characters`, `must be at most 100 characters` |
| `offset` | `must be at most 10000` |

## MatterControl product API

The product API (`cmd/mcapi`, separate composition from the legacy User API above) serves
`/api/v1` with its own catalogue, problem types (`urn:mc:*`), per-operation receipt/CAS rules
and W6 data operations. The **normative, living catalogue is the local implementation contract**
(`docs/implementation/p0-zcode-execution/local-contract.md`, §2–§2.7): it defines every route with
its receipt/CAS scope, roles, DTO presence/null policy, fingerprint and error precedence. This
page stays a summary and defers to that contract; the two are kept in sync per wave.

Summary of implemented route groups (details and exact request/response shapes in the contract):

- **Identity/session**: BFF server-side session store with an opaque cookie handle; the Go API
  verifies every bearer via authenticated introspection (fail-closed), maps `(issuer, subject)`
  lookup-only to `users.id`, and rechecks current Workspace/Matter/operation rights in every
  transaction/read path.
- **W1**: workspaces (+ members, revocation with last-owner protection), matters (+ members),
  requirements (create/read), events (append-only history), `GET /operations/{key}` own-receipt
  lookup, reconciliation.
- **W2**: typed actions, work-item metadata updates, execution transitions, escalations,
  AND-gate dependencies (409 `urn:mc:rejected` for guarded refusals), workstreams, parties,
  milestones, grid/My Actions/Waiting On reads.
- **W3**: documents with immutable versions and guarded promotion, criteria, evidence claims,
  independent assessments, disputes, verifier designation, streamed upload/download.
- **W4**: regulatory filings (nine-stage machine, repeated supplement cycles, negative outcomes,
  reopen with proof epochs, observations/corrections).
- **W5**: Control Room snapshot read and context records (Decision/Finding/Risk/Entity).
- **W6**: `bulk/preview` / `bulk/commit` (per-row receipts, allowlist title/description/
  internalOwner/due), `import/preview` / `import/commit` (RULE-014 registry, connected-group
  rejection), `export.xlsx|csv` (scoped, formula-neutral), `brief?t1&t2` (recorded changes vs
  outstanding at t2).

Common headers: `Authorization: Bearer` (verified principal), `Idempotency-Key` (UUIDv7, receipted
commands), `If-Match` (strong ETag → revision CAS on the catalogue's CAS-scoped writes),
`MC-As-Of` / `MC-Source-Revision` response provenance.


W6 receipt replay checks current read access to the receipt's saved workspace and every
represented Matter before comparing or exposing its outcome. A reused row key must retain
its operation, Matter and complete row intent; import intent also retains its source name
and source row key. Incompatible reuse is a per-row `key-reuse` failure. Revoked saved scope
produces `hidden` (bulk) or `not-found` (import), without the saved item, revision or hash.

Bulk row and import content fingerprints now encode field boundaries and absent versus
supplied values without delimiter ambiguity; bulk fingerprints also include the row key.
Existing receipts using earlier fingerprints fail closed with `key-reuse`. Existing import
registry entries retain their saved hashes and fail closed with `content-conflict` when
called with a fresh per-row idempotency key; replay across this change is not backwards compatible.
Rows, receipts and registry hashes are preserved without automatic migration.
Recover through authorized item readback or the own-operation receipt query with the original
key. Do not resend an uncertain write with a new key: `UNKNOWN` still requires reconciliation.

Import preview and commit reject an unreadable whole sheet with HTTP 400,
`application/problem+json`, type `urn:mc:bad-request`, and detail
`spreadsheet cannot be read; check the format, required columns and upload limits`.
This includes unsupported format, malformed CSV/XLSX, an empty sheet, missing `rowkey`,
`kind` or `title`, and a sheet over 5,000 data rows or the 8 MiB service limit. No import
rows, edges, receipts or events are written. Row/group validation errors remain in the
preview or per-row commit response; storage failures retain their own error classification.
