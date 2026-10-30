# API reference

## Product runtime probes and deadlines (2026-10-29)

For `mcapi`, `GET /healthz` remains process liveness. `GET /readyz` checks the product database with a 500ms deadline and returns 503 `urn:mc:unavailable` when the database is unavailable or the process is draining. No database error or credential is included in the response. These probes bypass authentication and the in-flight limiter.

Ordinary routes use `MC_REQUEST_TIMEOUT` (10s default). Document upload/content download, import preview/commit, export and bulk commit use `MC_TRANSFER_TIMEOUT` (60s local engineering default; positive duration required). Authentication, body/concurrency limits, request cancellation and receipt/CAS semantics still apply. A timeout after a possible write is OUTCOME_UNKNOWN; reconcile with the original key rather than blindly replaying it. These defaults are not approved production SLAs. See [operations](operations.md) for socket deadlines and shutdown. Historical template sections below do not override this product addendum; the broader S5 reference rewrite remains deferred.

## Product member pickers (local UX addendum, 2026-10-28)

- `GET /api/v1/matters/{id}/member-candidates`: Matter OWNER only, with active workspace membership. Returns the existing members page shape for active workspace members. The UI excludes existing Matter members. This read grants no permissions; membership commands retain authorization and CAS checks.
- `GET /api/v1/workspaces/{id}/member-candidates?q=<name>`: local/dev opt-in `MC_LOCAL_PEOPLE_DIRECTORY=true` (default false). Workspace OWNER only. Returns `{items:[{userId,displayName}]}`, at most 20 provisioned product users in the caller's issuer, excluding active members. Case-insensitive literal substring search, q at most 100 bytes; no provider/admin calls, email or subject disclosure. SQL rechecks active OWNER membership. This PO-approved local visibility boundary is not a production organization directory.

IDs remain stable wire/route keys; user-facing pickers and scope navigation use names. No schema migration is needed.

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
- **Review matrix (manual)**: Matter-scoped review grids of exact document versions (rows) and
  versioned questions (columns) with append-only, cited human answers; it never verifies a
  Requirement, completes an Action or changes a Filing. All routes are under
  `/matters/{id}/review-grids`; reads need any active Matter role, writes need OWNER/EDITOR.
  - `GET` list (`page`, no cells); `POST` create `{name}` (Idempotency-Key, no If-Match) → 201 with `Location`.
  - `GET /{gridId}` → grid view: `versions[{versionId, documentId, documentName, filename, no, current}]`
    (`current` is a neutral fact), `questions`, `questionHistory` (every revision, oldest first) and
    `cells[{versionId, questionId, state: PENDING|REVIEWED|ABSENT|UNABLE, stale, answer}]`; strong
    `ETag` = grid revision tag, plus `MC-As-Of` / `MC-Source-Revision`. `stale` means the question
    changed after that answer; it is derived, never stored.
  - Structure commands take the grid `ETag` in `If-Match` (428 without, 412 when stale) and return the
    new view: `POST /{gridId}/versions {versionId}`, `POST /{gridId}/versions/{versionId}/removal`,
    `POST /{gridId}/questions {text}`, `POST /{gridId}/questions/{questionId}/revision {text}`.
    A version of another Matter and a missing id both answer 409 `urn:mc:rejected` (`unknown-version`)
    with identical bodies.
  - `POST /{gridId}/answers {versionId, questionId, expectedAnswerId, state, text, pageRef, quoteRef}`
    (Idempotency-Key, no If-Match): `expectedAnswerId` is the id of the cell's current answer, `""`
    an observed empty cell; an absent or null `expectedAnswerId` is a missing precondition (428) and
    a mismatch is 412. `pageRef` (≤ 40) and `quoteRef` (≤ 1000) are typed by a person and never
    validated. Replay with the same key returns the original answer (`Idempotent-Replayed: true`).
  - `GET /{gridId}/cells/{versionId}/{questionId}/history?limit=&cursor=` (1–100, default 100),
    newest first by the server-recorded facts (`answeredAt`, tie-broken by answer id); the page
    envelope carries `total: null` (a keyset page does not count the trail) and `nextCursor` when
    older answers exist; every page is re-authorized and a copied or malformed cursor is 400.
    Answers recorded between pages appear on a fresh first page; anchored later pages never
    duplicate or skip older rows. Answers of a removed version stay readable.
- **W6**: `bulk/preview` / `bulk/commit` (EDITOR+ at the endpoint, per-row receipts, allowlist
  title/description/internalOwner/due), `import/preview` / `import/commit` (multipart; row keys in
  `dependencies` resolve to the imported items; one transaction per connected group; RULE-014
  registry; content conflict and group rejection are per-row `FAILURE` codes in a 200 array),
  `export` (`format=xlsx|csv`, scoped, formula-neutral), `brief?t1&t2` (recorded changes after
  `t1` up to `t2`, apart from the work outstanding at `t2`, rebuilt from the history).
  Route names use `/` rather than `:` because the router reads `:` as a parameter marker.
  All W6 responses are camelCase JSON.

Wire details added in contract revision 11 (see the delta table in the contract):

| Case | Status / type | Notes |
|---|---|---|
| Missing precondition | `428 urn:mc:precondition-required`, detail `a required precondition is missing (If-Match, or the expected-state field this command names)` | also when `expectedAssessmentId` is absent on `POST …/claims/{claimId}/assessments` |
| Stale review | `412 urn:mc:precondition-failed` | `expectedAssessmentId` differs from the claim's current assessment; nothing is recorded |
| Reversed or too-late brief window | `400 urn:mc:invalid-window` | `t1 ≤ t2 ≤` read boundary; no report is produced |
| Unrebuildable brief | `500 urn:mc:brief-unreconstructable` | history missing or corrupt; never a thinner success |
| Oversized import | `413 urn:mc:payload-too-large` | bounded before parsing |
| Filing signature decision | `POST …/filings/{filingId}/signature-applicability` | CAS, OWNER, `{signatureNotRequired, reason}`; reason required |
| Control Room | `GET …/control-room` adds `records` and `titles` | same snapshot as the figures |

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
