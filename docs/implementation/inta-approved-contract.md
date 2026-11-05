# INT-A Selected Implementation Contract — INTA-1

Codex coordination,2026-10-25 Asia/Ho_Chi_Minh. Governance base e7dbfbfb63062c4df576836c744701832356edd7. **SELECTED_SCOPE_APPROVED / CONTRACT_FROZEN_FOR_OWNER_HANDOFF / RUNTIME_FEASIBILITY_NOT_PROVEN.** Authority [DEC-028](../ai-sdlc/inta-po-approval.md). This freezes technical literals within the reviewed INT-A scope; no new business/auth/API policy or historical ADR edit.

Architecture basis: actual Claude's [scope proposal](../architecture/integration-scope-proposal.md), actual OpenCode [clarification](../reviews/step-02-3-opencode-clarification-review.md), original [51-row matrix](../testing/integration-acceptance-matrix.md) and [procedures](../testing/step-02-4-runtime-classification.md). Contract INTA-1 binds those existing expectations to concrete local assets. Any contradiction or material deviation stops for disposition; no silent fallback.

## 1. Sources, ownership and permitted assets

| Asset | Frozen base / planned location | Owner and restriction |
|---|---|---|
| Backend | go-hexa-template52b60a4617081c41b949f2242e1784238c170f75; read-only seed /tmp/mattercontrol-step022-backend-c01; NEW worktree /tmp/mc002-inta-be, branch codex/mc-002-inta-be | ZCode runtime; tracked source/config/dependencies/docs/rules unchanged; no production patch |
| Frontend template | nextjs-atomic-starter3e5a642479acb789eb210e73fba956f3e85082e3; read-only seed /tmp/mattercontrol-step021-frontend; NEW worktree /tmp/mc002-inta-fe, branch codex/mc-002-inta-fe | Antigravity; template tree stays unchanged, including src, package/lockfile and product configs |
| Temporary harness | NEW /tmp/mc002-inta-harness with its own app/harness/case/route file, harness-only Next/config/driver/check assets; no product routes/screens | Antigravity owns all new harness source. Use installed pinned Next16.4.2/React19.3.1/Zod from the NEW frontend worktree; no dependency/version/lockfile change |
| Evidence | NEW /tmp/mc002-inta-evidence/{backend,frontend,environment,qa}; reviewed exports docs/testing/inta-returns/{owner}/ | Each owner writes only its own subdirectory; Codex verifies redaction/inventory before governance export. No secret in Git |
| PG | NEW container mc002-inta-pg-<runId>, database mc002_inta, user mc002_inta; no reused volume/database/container | Codex only provisions/operates. Stop/start same owned container; retain on completion |

All listed new paths were absent at preparation; they are reservations, not created resources. Check again before creation; occupied path/branch is a stop, not permission to reset/reuse. Never touch MC-003A or retained native fixtures. No automatic branch merge/push.

**Isolation binding:** the prior integration/next-harness name was provisional. The pinned product tsconfig includes recursive **/*.ts, **/*.tsx, **/*.mts and ESLint scans the project. To satisfy the already-approved production/app/config isolation, the temporary Next project lives in the new sibling harness directory, outside the template checkout. This is a test-asset location choice, not INT-A0 or a new product/runtime architecture. Product globs cannot discover the sibling via directory scanning; imports, build traces and generated artifacts still require actual owner/QA checks. The harness must import the actual unchanged template HTTP client, not copy it. Cross-root/module resolution using only harness config and existing dependencies is an unproven prerequisite; stop if it requires product config/source/dependency changes. Record harness source as a versioned new task artifact/commit or complete immutable source archive; do not pretend an unchanged template Git diff includes external harness source. Keep runtime outputs/credential files outside that source archive.

## 2. Runtime and local guards

- Only the development-server Next runtime, no browser/product session/Server Actions or production start claim.
- One temporary endpoint: POST /harness/case. Other methods →405; malformed/unknown/extra control fields →400 with bounded generic error and **zero upstream request**. These are harness controls, not product routes.
- Harness bind127.0.0.1:18085; Go127.0.0.1:18086; PG publishes127.0.0.1:15457 only. Verify unused ports before use. Port conflict → stop/request a recorded amended local parameter; never kill an unknown process.
- Required harness opt-in MC_INTA_ENABLE=1; unset →404 and zero upstream calls. Refuse startup with NODE_ENV=production, any product auth/bypass env set (API_MODE, API_TOKEN, AUTH_ALLOW_ANONYMOUS) or any additional product session/provider-secret env found during the owner audit. Enumerate that latter set in the return without exposing values. Do not load product .env files or secrets.
- MC_INTA_GO_BASE_URL is fixed http://127.0.0.1:18086 from server environment; revalidate every request. No caller-controlled baseURL, protocol, port, path, method, headers/body overrides or open proxy. No upstream Authorization, Cookie, Origin or Idempotency-Key; no product identity or permission bypass.
- Return Cache-Control:no-store; shared-client init cache:no-store. Actual dynamic/no-cache behavior is an acceptance requirement, not source proof.
- Current upstream docs describe next dev [directory] with --hostname/--port; owner must read installed node_modules/next/dist/docs and installed CLI help before selecting the exact command. Record exact argv. Do not infer exact16.4.2 cross-root compatibility from Context7's generic docs or use create-next-app/download/upgrade. Next may generate files in the new harness root only.

## 3. Frozen synthetic fixtures and request observations

- runId: run-local alphanumeric value of8–32characters, unique for this run, generated by the driver before any create. Keep the same runId across restarts; refuse collision with existing owned evidence/assets.
- Emails: inta-a-<runId>@example.test (A), inta-b-<runId>@example.test (B), inta-x-<runId>@example.test (X). Names: INTA_A_INITIAL, INTA_A_UPDATED, INTA_A_STALE, INTA_A_OUTAGE, INTA_B_INITIAL, INTA_X_OUTAGE; T8 uses A's email with INTA_DUPLICATE. They are fixture markers, not real accounts.
- Missing UUID:01a15359-aa28-7a00-a380-000000000001, verified absent in this fresh fixture. T4 malformed literal:not-a-uuid; uppercase literal:01A15359-AA28-7A00-A380-000000000001. Never create these IDs. Actual A/B IDs come from the native API, never assigned by the harness.
- Control input allows only runId, caseId and optional refId. refId is lowercase canonical UUID only where a fixed record-route case requires it; it fills only {id} in /api/v1/users/{id}. Validate against the fixed case table. Fixture bodies/headers are generated from fixed case rules and validated runId; never accept raw URL/body/header overrides.
- One request ID per actual upstream attempt:mc-int-<runId>-<caseId>-<monotonicSequence>, ≤128safe characters. Monotonic sequence belongs to the harness; across harness restarts add a fresh safe boot discriminator or persist its last counter, so IDs never collide. No client-supplied arbitrary header.
- **Logical test IDs stay51.** Some cases require multiple explicit substeps (T4 two GETs; T10 PATCH then GET; restart cases before/after reads). Every substep gets a separate request ID, action label and log entry; these labels are not additional test IDs. Exactly one upstream attempt per intended substep, zero automatic retries. Guard failures produce zero attempts. Never duplicate a successful POST/PATCH solely to collect wire headers.
- Requests through shared httpRequest expose decoded/schema-validated body on success, ApiError status/code/details on failure. They do not expose success HTTP status/headers. Raw fetch wire controls prove those separately using their own request IDs and B create. Do not infer201/ETag/Location for A from B's W1.
- ApiError mapping from supplied source:404 NOT_FOUND;400/422 VALIDATION_ERROR;409/412/503 HTTP_ERROR; network NETWORK_ERROR/status0; timeout TIMEOUT; success-schema mismatch INVALID_RESPONSE. Harness classification unavailable is separate from the client's code.

## 4. Fixed operation allowlist

The Route Handler may accept the following existing-case IDs only; environment/log/teardown/conformance row IDs are procedures, never arbitrary network commands. Record substeps explicitly; never replay a mutation after restart.

| caseId | Fixed method / route / body or readback | Observation |
|---|---|---|
| T1 | POST /api/v1/users, A fixture | client schema/value; native expected201, version1 |
| T2 | GET /api/v1/users/{refId=A} | client value equals A current checkpoint |
| T3 | GET fixed missing UUID | client404/NOT_FOUND |
| T4 | GET malformed literal then uppercase literal | two client404 observations with unique IDs |
| T5 | POST inta-invalid-<runId>@example.test with empty name | client422/VALIDATION_ERROR; read-only A unchanged checkpoint |
| T8 | POST A email, INTA_DUPLICATE | client409/HTTP_ERROR; A unchanged |
| T9 | PATCH A with If-Match:"1", INTA_A_UPDATED | client version2/name; never no-op |
| T10 | PATCH A with stale If-Match:"1", INTA_A_STALE; explicit read-only A | client412; A version2/update name preserved |
| T11a | GET A while exact owned PG stopped | client503/HTTP_ERROR; unavailable classification |
| T11b | PATCH A with If-Match:"2", INTA_A_OUTAGE while PG stopped | client503; no commit inference from503 alone |
| T11c | POST X fixture once while PG stopped | client503; X stays OUTCOME_UNKNOWN; never retry or lookup by list/SQL |
| T12 | GET A after exact owned Go stopped | client NETWORK_ERROR/status0, unavailable |
| W1 | POST B fixture, different record from T1 | wire201/Location/ETag"1"/JSON/request-ID |
| W2 | GET A before T9 | wire current ETag"1"/request-ID |
| W3 | GET fixed missing UUID | wire404/problem+json |
| T6-W | POST bytes { with JSON content type | wire400/problem+json |
| T7-W | POST fixed run-derived email inta-wire-<runId>@example.test and name INTA_WIRE_MISSING_TYPE encoded as valid JSON Uint8Array, deliberately no content type | wire415/problem+json; unexpected behavior is a finding, no workaround |
| W9 | GET A after T9 | wire ETag"2" |
| W11 | GET A during owned PG outage | wire503/problem+json |
| INT-PERS-01 / INT-PERS-02 | Explicit GET A checkpoints/readbacks around ordered Go/PG restarts | client complete unchanged state before T9 |
| INT-PERS-03 / INT-PERS-04 | Explicit GET A only after outage recovery | client recovery/read-only actual known-ID state |

No DELETE/list/new product route or fault flag. Native4xx retain their existing about:blank behavior; product problem catalogue/CAS/idempotency rules are not asserted. Native unavailable: type /problems/unavailable, detail service temporarily unavailable, integer retryAfter1; no product Retry-After convention introduced. Health/readiness are operational gates only; unchanged native probe bytes are not new product evidence.

## 5. Envelope, caps and log policy

Envelope binds runId/caseId/requestId/mode/method/routeTemplate/startedAtUTC/latencyMs/actualNextVersion/harnessRevision and assertion evidence. App-client success outcome=value carries the harness-local Zod-validated native User in value; apiError=null. For apiError: value=null and status/code/message/details. Caller abort leaves both null; client timeout remains ApiError TIMEOUT. No invented success status/header; wire fields null with not-observable-via-client.

Wire mode copies the upstream status/body and allowlisted content-type/location/etag/x-request-id/retry-after into its own envelope; it does not re-emit Go's response or alter it. No Retry-After expectation. Each wire observation is attributed only to that request.

Retained bodies are capped at16KiB, with explicit truncation flag. The client may parse a complete response in memory, but a truncated retained body never establishes complete schema/equality/persistence assertions; mark the assertion BLOCKED rather than PASS. Secrets/DSNs/passwords/token values must be absent everywhere, including error details, argv and source archives. Synthetic response bodies are allowed only in bounded controlled evidence, never in Go/Next application logs. Harness logs contain metadata only. Scan complete per-run marker set and actual secret values using a secret-safe process; record counts/UTC/command provenance without printing values.

## 6. Environment ownership, sequence and cleanup

Future Codex ENV: a new owned Docker container, unique task label,512MiB/1CPU/128PID caps, loopback port above; pinned locally available postgres:18-alpine image digest recorded at creation. No pull/paid/account activation by assumption. Use only a new dedicated named volume mc002-inta-data-<runId> or a new container's own durable data layer, never an existing/anonymous inherited volume or tmpfs. Verify unused names; retain volume/container, do not remove/prune. Fresh random password via private process environment, never traced/printed. Verify actual DB/user, healthy/empty state BEFORE DSN handoff; store no credentials in governance or review packets. Full docker inspect/env dumps forbidden.

Go runtime: STORAGE=postgres, HTTP_ADDR=127.0.0.1:18086, EVENTS_SINK=none, API_DOCS_ENABLED=false, TRUSTED_PROXIES empty, MIGRATE_ON_START=false, READINESS_CHECK_DB=true, LOG_LEVEL=info, REQUEST_TIMEOUT=10s, DB_STATEMENT_TIMEOUT=5s, DB_MAX_CONNS=5, DB_MIN_CONNS=0, SHUTDOWN_DELAY=0s; OTel exporter endpoint empty. Use a private DATABASE_URL for the new DB only. ZCode builds a clean52b60a4 binary with source stamp/hash outside tracked files, records exact command, then uses its native migrate once against the verified new DB. No schema/production code mutation or make run-pg default fixture. Do not rebuild retained evidence binaries or invoke relay/Kafka.

Sequence: ENV/guards/feasibility → T1/T2/W1/W2 and initial negatives → immediate checkpoint → INT-PERS-01 Go restart → INT-PERS-02 same-PG stop/start, no A mutation → T9/W9/T10 → one controlled PG outage T11a/b/c/W11 → PG restart without Go restart → INT-PERS-03/04 read-only recovery → T12 Go stop → source/artifact/privacy/correlation checks → owned teardown → conformance/evidence review.

For an optional strict unchanged-PATCH assertion, require the exact causal chain already specified by OpenCode: stop command completion + stopped identity check before PATCH dispatch, still stopped through failure, same container/storage identity and sole writer, then read-only comparison. Without that evidence record actual readback and unresolved outcome, not a false “not applied.” X POST is always unresolved in this slice; no re-POST/new-key/list/SQL probe.

Stop only exact owned Go/Next/PG processes. Verify no owned listeners, record UTC/exits/IDs, retain evidence/container/volume. No alteration of existing databases/volumes/resources, no merges. Any infeasibility or needed product/config/dependency/auth change stops for PO/material-architecture disposition; never auto-fallback.

## 7. Status, conformance and route stop

The selected [ledger](../testing/inta-runtime-status.json) contains36required/14deferred/1blocked and51NOT_RUN. Procedures/expected outcomes remain the original matrix except selected local literal/observation bindings here. INT-CONF-01 retains its ID: Codex assembles conformance evidence, OpenCode independently assesses this frozen scope; Claude reviews **if a material architectural deviation is found**, matching the current explicit PO assignment. No repeated Claude clarification sign-off. A deviation is not silently waived; no runtime PASS until evidence.

ZCode direct CLI is currently unavailable (required packaged provider files absent); Antigravity direct headless engineering is denied by recorded RunCommand evidence. **Stop at prepared manual owner handoffs as explicitly instructed by PO.** No engineering dispatch, task worktree creation, dependency installation, harness source creation, fixture provisioning or runtime test execution occurs in this preparation turn. The freeze records a contract, not proven implementation feasibility or actual owner acceptance.
