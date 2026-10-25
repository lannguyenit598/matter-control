# MatterControl Integration Scope Proposal (MC-002, H5 local seam)

- **Author:** Claude Code (actual), claude-opus-5-5, Solution Architect, task MC-002-INT-ARCH (Step02.3), correction round 1.
- **Method:** packet-only analysis. No tools, MCP, files, commands or URLs. Besides the original packet, only the supplied `src/lib/api/http-client.ts` was read.
- **Governance base:** `e377568ac47f8f1b88e3875a8f13d7e57fc30667`. Backend accepted native head `52b60a4` (C01-NATIVE, PASS_WITH_LIMITATIONS). Frontend baseline `3e5a642`.
- **Status:** **PROPOSED / WAITING_PO_APPROVAL / NOT_IMPLEMENTED**.
  - Every runtime check below is **NOT_RUN**. Nothing here asserts feasibility beyond the supplied source.
  - The fifteen architecture documents are candidate DOCUMENT_REVIEW_PASS, not PO-approved. This file edits neither them nor any ADR.
  - Product requirements and the permission matrix are PO-approved and are not reopened.
- **Companion:** [api-auth-decision-analysis.md](api-auth-decision-analysis.md). This proposal is decision INT-D01 there.
- **No implementation before PO selection.**
- **Bounded clarification update:** actual OpenCode reviewed and supplied the section4/5 wording under the human [this-round routing override](../ai-sdlc/step-02-3-review-routing.md). Historical Claude authorship is preserved; this update is attributed to OpenCode, not an unexecuted Claude return. Runtime checks remain NOT_RUN.

## 1. Objective

On H5 local (approved), with synthetic data only, demonstrate:

1. The frontend's existing `httpRequest`/`buildUrl` (`src/lib/api/http-client.ts`), executed **inside a running Next.js server runtime**, reaches the unchanged Go native service over REST.
2. Go persists through a real disposable PostgreSQL across a Go restart and a PostgreSQL container stop/start.
3. App-client outcomes classify native success and RFC 9457 problems correctly, including the C01-NATIVE `503 /problems/unavailable`, which must never become a false success or a false empty state.
4. Every request is correlated by its own request ID.

Explicitly **excluded**: identity and authentication; authorization and Workspace/Matter isolation (deferred, §13); Matter invariants; product pages and UI flows; the product session, Server Actions, Server Components and product cache; Next.js production build/start behavior; Cloudflare runtime; cost; enterprise SSO.

## 2. Options and the PO decision

Starting facts: the frontend `restTaskRepository` targets `/tasks` and `/tasks/stats`; the backend exposes `/api/v1/users` (different resources); `resolveSession()` returns `null` (fail-closed); Go `APIMiddleware` is empty (no auth).

| ID | Option | Assessment |
|---|---|---|
| **INT-A** | **Temporary Next.js runtime harness** (recommended) | An isolated, test-only Next.js root outside product `src/`, using the frontend repository's already-installed pinned dependencies. One harness-only Route Handler executes the existing client → REST → Go `52b60a4` (unchanged) → PostgreSQL. No backend change, no `src/` change. Proves local Next-runtime transport compatibility only |
| INT-A0 | Node-only runner | **Explicit reduced-scope exception, not the requested seam.** The same client run by plain Node, with no Next runtime. Only if INT-A is shown infeasible (§5.6) and the PO explicitly accepts the smaller scope |
| INT-B | Authenticated temporary harness | **Not recommended.** The User API has no authorization model; Go middleware would change code outside the accepted C01 scope; validating a token proves only signature checking, inviting false security claims. Depends on INT-D02 |
| INT-C | Defer until a product API/auth seam exists | Viable fallback. No throwaway work; compatibility defects surface later, mixed with product defects |

**Not options:** aliasing Task to User; new Matter or Task CRUD; new product routes, pages or screens; `API_MODE=demo`, `AUTH_ALLOW_ANONYMOUS=true` or a shared `API_TOKEN`; a hardcoded or shared demo principal; any session weakening or auth bypass; enterprise SSO.

**If the PO nevertheless selects INT-B** (specification only): a fresh per-run random subject; an asymmetric key pair generated at run start, held in memory or a run-scoped temp file, never committed or reused, destroyed at run end; a JWT access token with pinned `alg`/`kid`, run-specific local issuer URN, `aud` equal to the local Go API identifier (never the frontend client), `exp` of 15 minutes or less, `nbf`/`iat` checked, no role/permission/workspace claims; the validator refuses to start unless a local-harness flag is set, the bind is loopback and the environment is not production; missing, invalid or expired tokens return `401`; success yields only an authenticated subject, with authorization reported as unimplemented; removal as in §11.

**PO decision required:** select INT-A, **including explicit approval of the temporary harness-only endpoint in §5**, or INT-C. INT-A0 is selectable only as a named exception.

## 3. Participating components

| Component | Version | Owner (after PO) | Notes |
|---|---|---|---|
| Next harness root (proposed `integration/next-harness/`, name confirmed by Antigravity) | Task branch from `3e5a642`; installed pinned dependencies | Antigravity | Development server bound to loopback; one harness-only Route Handler; no product route, page, component, Server Action or middleware/proxy |
| Driver script (Node, test-only) | Same branch | Antigravity | Sequences case IDs against the harness endpoint and stores envelopes. Contains no client or classification logic |
| Go native server | `52b60a4`, **unchanged** | ZCode (operate only) | `127.0.0.1`; docs/OpenAPI routes disabled; no trusted proxies |
| PostgreSQL | New owned disposable target (§6) | Codex | Loopback only; verified empty |
| Not included | — | — | Browser, object store, IdP, Workers/wrangler, Cloudflare |

## 4. Exact contract: the existing native template only

`/api/v1/users` is a **backend-template route, not a MatterControl product route**.

- Every request carries `X-Request-Id: mc-int-<runId>-<caseId>-<seq>` (128 characters or fewer, `[A-Za-z0-9._-]`). In app-client mode it is passed through the client's `headers` option.
- The client itself always sets `Accept: application/json`, and sets `Content-Type: application/json` whenever a body is given.
- Never sent: `Authorization`, `Cookie`, `Origin`, `Idempotency-Key`.

> **Native 503 source pin (accepted `52b60a4`):** every native unavailable problem returns exactly `type` `/problems/unavailable`, `detail` `"service temporarily unavailable"`, integer `retryAfter` `1` and `title` "Service Unavailable", pinned by `docs/api.md` L148–163, `internal/adapter/inbound/httpapi/errors.go` L58–78 (`unavailableDetail`, `retryAfterSeconds`) and `testdata/unavailable.golden` L1–15, with Codex-recorded file hashes in `docs/testing/step-02-3/native-503-source-pin.json`. Source pin only: no runtime replay, no new product `retryAfter`/`Retry-After` convention (product units/range/header remain deferred to D-11/G-5).

Evidence path: **C** = app-client mode, **W** = wire mode (§5.3). Expected values are the native contract (`docs/api.md` at the pinned head).

| # | Request | Expected | Path |
|---|---|---|---|
| T1 | `POST` user A `{email: run-unique synthetic address on a reserved test domain, name}` | `201`; body has lowercase UUIDv7 `id`, normalized fields, `version` 1, RFC 3339 UTC times with 0–6 fraction digits | C (body only) |
| W1 | `POST` user B, a **distinct** synthetic email and name, own request ID | `201`; `Location: /api/v1/users/<B id>`; `ETag: "1"`; JSON media type; request-ID echo. Evidence applies to B only | W |
| T2 | `GET` A | `200`; body equals T1 body | C |
| W2 | `GET` A | `ETag` equals `"<version>"`; echo | W |
| T3 | `GET` a valid, never-created UUIDv7 | `404`; `ApiError` code `NOT_FOUND`; `details` contains no other record's data | C |
| W3 | Same as T3, own request ID | `application/problem+json` | W |
| T4 | `GET` malformed and uppercase IDs (fixed literals in the case table) | `404` | C |
| T5 | `POST` with empty `name` | `422`; code `VALIDATION_ERROR` | C |
| T6 | `POST` malformed JSON | `400` problem | W only: the client always JSON-serializes, so it cannot send malformed JSON |
| T7 | `POST` JSON bytes without `Content-Type` | `415` | W only: the client sets `Content-Type` for any body |
| T8 | `POST` with A's email and a different name | `409`; code `HTTP_ERROR` | C |
| T9 | `PATCH` A, `If-Match: "1"`, a **fresh name different from the current one** | `200`; body `version` 2; name changed. A no-op PATCH is not asserted | C |
| W9 | `GET` A after T9 | `ETag: "2"` | W |
| T10 | `PATCH` A, stale `If-Match: "1"`, another different name | `412`; then a C `GET` shows `version` 2 and the T9 name | C |
| T11 | PostgreSQL stopped: C `GET` A; C `PATCH` A (current `If-Match`, different name); C `POST` new user | Each: `ApiError` status `503`, `details.type` `/problems/unavailable`, `retryAfter` 1, `detail` equals the pinned golden/docs string, no driver text. No retry | C |
| W11 | PostgreSQL stopped: `GET` A | `503`; `application/problem+json` | W (GET only) |
| T12 | Go stopped: `GET` A | `ApiError` code `NETWORK_ERROR`, status 0 | C |

- **Probes:** `/healthz` and `/readyz` are readiness gating only, not evidence.
- **Native 4xx `type`** stays `about:blank` (a gap preserved by C01). 4xx is classified by status; `type` is used only for unavailable. Product catalogue types are not asserted.
- **Out of scope:** `DELETE` (ignores `If-Match`); list/offset; timeout and 57014 faults (characterized by C01, not repeated).

## 5. Next.js harness design

### 5.1 Location and dependencies

- A dedicated Next root outside `src/`. It contains only what the pinned Next version minimally requires to serve one Route Handler: no pages, components, Server Actions or middleware/proxy.
- `next`, `react` and `zod` resolve from the frontend repository's existing install. No new dependency, no version change, no lockfile change.
- It imports `src/lib/api/http-client.ts` directly. A copy would test a fork and is not allowed. Any import configuration lives in the harness root only.

### 5.2 Endpoint (temporary, harness-only)

- **Why:** before any product API exists, it is the only way to execute the existing client inside a Next runtime.
- One `POST` handler inside the harness root only, for example `/harness/case`. Other methods are rejected.
- Input, Zod-validated: `runId` (`[A-Za-z0-9]{8,32}`), `caseId` (fixed allowlist from §4), and `refId` (lowercase UUID, only for cases that need a record).
- The Go base URL comes only from server environment and must be the loopback literal `127.0.0.1` or `[::1]`; it is re-checked on every call.
- Caller input is limited to three Zod-validated fields — `runId` (`[A-Za-z0-9]{8,32}`), `caseId` (fixed §4 allowlist) and `refId` (lowercase UUID, supplied only for cases that address a record) — and only the validated `refId` fills the single `{id}` parameter of the fixed `/api/v1/users/{id}` route template, never a caller-supplied URL or path. All other method, path template, header and body values are fixed per case; arbitrary caller-supplied URL, path, method, header or body overrides are forbidden, so the endpoint is **not a proxy**.
- The harness response is its own envelope with `Cache-Control: no-store`. Client calls pass `init: { cache: 'no-store' }`.
- Antigravity confirms against the installed version that the handler is dynamic and that no fetch result is cached or reused. Deviations are reported.

### 5.3 Two distinct evidence modes

| | App-client mode (`app-client`) | Wire mode (`wire`) |
|---|---|---|
| Executes | Shared `httpRequest`, unmodified, with a harness-local Zod schema of the native User | The runtime's `fetch` directly, in the same Route Handler and fixed case table |
| Observes | The schema-validated body on success; or `ApiError` `status`/`code`/`message`/`details`; `NETWORK_ERROR`; `TIMEOUT` | Status, allowlisted response headers, raw body |
| Cannot observe | Success status, any response header, media type, request-ID echo | Client behavior |
| Proves | Next-runtime client compatibility | Go's wire contract as seen from the Next runtime |
| Used for | T1–T5, T8–T12 | W1, W2, W3, T6, T7, W9, W11 |

Rules:

- No wire request repeats an app-client `POST` or `PATCH`. W1 creates its own record B.
- Header evidence is attributed only to the request ID that produced it.
- Wire mode reads the upstream response without altering it. Values are copied into the envelope; Go's response is never re-emitted.
- **T7:** under the Fetch standard, byte bodies carry no default `Content-Type`, so the harness sends a `Uint8Array` and records the headers it constructed. If Go does not return `415`, that is recorded as a finding, not worked around.
- The shared client is never modified to add test features.

### 5.4 Bounded envelope (temporary)

Fields: `runId`, `caseId`, `requestId`, `mode`, `method`, `routeTemplate`, `startedAt` (UTC), `latencyMs`, `nextVersion` (from the installed package), `harnessRevision`.

- **App-client:** `outcome` (`value` / `apiError` / `abort`); when `outcome` is `value`, `value` carries the harness-local Zod-validated native User object (properties per §4 expectations) and `apiError` is `null`; when `outcome` is `apiError`, `value` is `null` and `apiError.{status, code, message, details}` is present; a caller `signal` abort leaves `value` and `apiError` `null` (client timeouts are `apiError` code `TIMEOUT`, not aborts, per client source); `classification` per §5.5. The shared client returns schema-validated body only on success — success HTTP status and response headers are not observable through it — so wire fields stay `null` (`not-observable-via-client`); wire evidence keeps its own request IDs/records; the shared client is unmodified.
- **Wire:** `upstream.status`, `upstream.headers` (allowlist only: `content-type`, `location`, `etag`, `x-request-id`, `retry-after`), `upstream.body`, `sentHeaders` (as constructed).
- In app-client mode, wire fields are `null` with reason `not-observable-via-client`.
- Retained bodies (`value`, wire `upstream.body`) are capped at 16 KiB with a `truncated` flag set when capped. Truncation is an envelope-retention boundary only — the client parses and schema-validates the complete response body in memory — but a truncated retained value is never evidence of a complete response: rows asserting full-body equality (T2), field-for-field persistence comparison (INT-PERS-01/02 checkpoints) or full validated/persisted state are recorded BLOCKED (assertion not established, never PASS) unless the retained body is untruncated. Synthetic data only.

### 5.5 Harness-local classification (app-client outcomes)

| Outcome | Class |
|---|---|
| Resolved value passing the schema | success |
| `ApiError` 404 | not-found |
| `ApiError` 409, 412 | conflict |
| `ApiError` 400, 415, 422 | invalid |
| `ApiError` 503, `NETWORK_ERROR`, `TIMEOUT` | **unavailable** (never empty, never success) |
| `INVALID_RESPONSE` (including on 2xx) | unexpected, never success |
| Anything else | unexpected |

The product problem-to-UI mapping (`api-contracts.md` §4) is deferred.

### 5.6 Not exercised, and feasibility unknowns

**Not called:** `backendRequest`, `getSession`, `requireSession`, `restTaskRepository`. Not exercised: the product session, Server Actions, Server Components and product cache. The harness runs on the development server only, because it refuses `NODE_ENV=production`, so no production build/start behavior is claimed.

**OpenCode source-only clarification, this round:** Source-supplied `src/lib/api/http-client.ts` confirms at static source level: `headers?: HeadersInit` is supported (merged via `new Headers(options.headers)`; the client authoritatively sets `Accept: application/json` always and `Content-Type: application/json` whenever a body is given); `init` accepts `cache: 'no-store'` (typed `Omit<RequestInit, 'method' | 'body' | 'headers' | 'signal'>` and spread first in `fetch`, so it cannot override method/body/headers/signal); error mapping is `404→NOT_FOUND`, `400/422→VALIDATION_ERROR`, otherwise `HTTP_ERROR` (consistent with T8/T10/T11a asserting `HTTP_ERROR` on 409/412/503), transport failure `NETWORK_ERROR` status 0, timeout `TIMEOUT`, 2xx schema failure `INVALID_RESPONSE`. This closes the source-level gap for the pinned file only; it is not a runtime or test result, and INT-ENV-07's Next caching/cross-root/binding/dynamicity items remain NOT_RUN.

**Antigravity confirms before implementation** (deviations are reported, not worked around):

- whether the pinned Next/bundler compiles an import from outside the harness root using harness-root configuration only;
- the pinned version's documented loopback binding option (no flag is assumed here);
- whether product TypeScript/lint/test globs pick up the harness root. If they do, report it; do not silently edit product config.

If the existing client cannot run inside Next without editing `src/` or product config: stop and report. The PO then chooses INT-A0 (explicit exception) or INT-C.

## 6. Real persistent state and seed lifecycle

1. **Preparation (Codex).**
   - Create a **new owned**, labelled, capped PostgreSQL container on loopback.
   - Storage is either that container's own writable layer (stopped but never removed during the run) or a **dedicated new named volume** created for this run. Never an existing volume; never tmpfs or in-memory storage cleared on stop. Codex makes the exact choice after approval.
   - Before creation, verify the names are unused. Never overwrite or reuse an existing container, volume, database or the default context.
   - Verify the database is empty.
2. **Migration:** the native `migrate` subcommand at `52b60a4`.
3. **Seeds:** none. The harness creates run-unique synthetic rows. No real names, emails or legal data.
4. **Persistence sequence:**
   - T1/T2.
   - Restart Go against the same database; `GET` A shows unchanged `id`, `version` and timestamps.
   - **Stop then start the same PostgreSQL container**, with no remove and no recreate; `GET` A again.
   - Codex records that the container ID and storage identity are equal before and after.
   - Any data loss is a FAIL. Durability is claimed only if this sequence passes.
5. Synthetic User rows are data, not identities: no membership or role, never used to authenticate.
6. **End:** stop only owned processes and containers (Next harness, Go, PostgreSQL); verify no owned listeners remain. Retention or removal follows Codex governance. No deletion of others' resources, no prune.

## 7. Validation, negative and failure scenarios (all NOT_RUN)

| Area | Cases |
|---|---|
| Positive | T1, T2, T9, W1, W2, W9; persistence (§6) |
| Negative | T3–T8, T10, W3 |
| Failure | T11/W11, then recovery without a Go restart; T12 |
| No silent retry | No retry of a non-GET after `503` or transport failure |

- **Outcome unknown:** reconcile `PATCH` by `GET` of A after recovery; record a failed `POST` as OUTCOME_UNKNOWN.
- **Assertions** are made on the envelope fields of the specific request ID and on the absence of other records' data.
- A process exit 0, a `curl` exit 0, or a `200` from the harness endpoint itself is never evidence.

## 8. Observability and privacy

- Envelopes are retained per request. No DSN, password or token appears anywhere. The harness does not log bodies.
- Go access logs are path-only (template). OpenCode checks that the T1/W1/T8/T9 synthetic emails and names are absent from retained Go logs and Next harness logs. This is a scoped check, not a privacy guarantee.
- **Correlation:** the request-ID echo is proven only in wire mode. App-client requests correlate to Go through a Go log line carrying the request ID, if the pinned template logs it. That is not shown in the packet; otherwise it is reported as not observable.
- **Codex intake:** argv, exit codes, base/head SHAs, redacted configuration hashes, database and storage identity, and the list of owned resources stopped.

## 9. CORS, origins, idempotency, CAS and versioning

- **CORS:** none. The harness is server-to-server on loopback; there is no browser. Go gains no CORS configuration.
- **Idempotency:** the native API has none. Product `Idempotency-Key`, receipts and `GET /operations/{key}` are deferred and not simulated.
- **CAS:** native `If-Match` on `PATCH` is optional, and `DELETE` ignores it. The candidate product contract is stricter (`428`, `412`, `400 precondition-not-applicable`). T9/T10 characterize native behavior only.
- **Versioning:** the shared `/api/v1` prefix does not make `/users` a product route. Gate G-9 decides its fate.

## 10. Contract classification

| Class | Members |
|---|---|
| Accepted native (C01-NATIVE, `52b60a4`) | User routes in §4; 499/503/500 classification; fixed 503 body; probes |
| Candidate product (DOCUMENT_REVIEW_PASS, not PO-approved) | `api-contracts.md` catalogue, problem catalogue, CAS table, idempotency/receipts, `security-architecture.md` |
| Temporary harness (if INT-A is selected) | Next harness root, its one endpoint, envelope, driver, harness-local schema and classification. No backend artifact |
| Future P0 | All product endpoints, auth/session, authorization, UoW, frontend Matter features |

## 11. Isolation of temporary artifacts

- **Enable** (all required): PO approval of INT-A including the endpoint; the explicit harness script; a harness opt-in flag, checked by the endpoint on every request (it returns `404` when the flag is absent); a loopback base URL; a loopback harness server.
- **Refuse to run** when `NODE_ENV=production`, when any product auth variable is set (list confirmed by Antigravity), or when `API_MODE`, `AUTH_ALLOW_ANONYMOUS` or `API_TOKEN` is set.
- **Disabled by default:** not in the product build, default tests or CI; not importable from `src/`. At QA, OpenCode verifies that product build output contains no harness module. This is not claimed now.
- **Branch:** a task branch. Merging to mainline requires OpenCode review of these conditions.
- **Removal** (whichever comes first): the first approved product API seam has its own integration tests covering transport classification; the template User routes are removed; or the PO selects INT-C or withdraws INT-A. Removal deletes the harness root, the driver and the script entry, verified by OpenCode. Retention as a test tool requires a Claude recommendation plus a PO decision.

## 12. Acceptance for INT-A

Executed by the owners and **independently verified by OpenCode**:

1. T1–T12, W1/W2/W3/W9/W11 and the persistence sequence pass with exact assertions, each tied to its request ID.
2. App-client envelopes show execution inside the Next harness runtime.
3. Outage gives *unavailable*, never success or empty; recovery needs no Go restart.
4. No backend diff from `52b60a4`; no `src/` diff; no shared-client change; no dependency or lockfile change.
5. No auth weakening.
6. §11 isolation and the §8 log check pass.

Passing proves **local Next-runtime (development server) transport compatibility only**. It does not prove production build/start, authentication, authorization, isolation or product behavior.

## 13. Deferred product gates

- **G-1** Identity provider and authentication (INT-D02).
- **G-2** Authorization and isolation: AC-118, AC-134, AC-135, AC-140, AC-147, AC-158, uniform 404.
- **G-3** Idempotency, receipts, unknown-outcome recovery (AC-153).
- **G-4** MatterUnitOfWork, locking, revocation ordering.
- **G-5** Product problem catalogue, `retryAfter` and `Retry-After` (INT-D09).
- **G-6** The Next session, Server Actions, per-user cache rules, UI unavailable/stale states (AC-156).
- **G-7** Frontend adapter and Workers.
- **G-8** Hosting, cost, production recovery.
- **G-9** Fate of the template User routes.

**No INT-A run, and no identity check, can prove product isolation.**

## 14. Ownership and next steps

| Who | Role |
|---|---|
| Claude | Owns this proposal; conformance review after execution |
| Codex | Records the PO choice; prepares the environment and task contracts |
| Antigravity | Harness implementation after PO selection |
| ZCode | Operates Go unchanged |
| OpenCode | Independent QA plan and verification |

No agent self-approves. MC-002 is not DONE.
