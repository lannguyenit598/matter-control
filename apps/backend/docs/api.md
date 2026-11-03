# API reference

## Product runtime probes and deadlines (2026-10-29)

For `mcapi`, `GET /healthz` remains process liveness. `GET /readyz` checks the product database with a 500ms deadline and returns 503 `urn:mc:unavailable` when the database is unavailable or the process is draining. No database error or credential is included in the response. These probes bypass authentication and the in-flight limiter.

Ordinary routes use `MC_REQUEST_TIMEOUT` (10s default). Document upload/content download, import preview/commit, export and bulk commit use `MC_TRANSFER_TIMEOUT` (60s local engineering default; positive duration required). Authentication, body/concurrency limits, request cancellation and receipt/CAS semantics still apply. A timeout after a possible write is OUTCOME_UNKNOWN; reconcile with the original key rather than blindly replaying it. These defaults are not approved production SLAs. See [operations](operations.md) for socket deadlines and shutdown.

## Product member pickers (local UX addendum, 2026-10-28)

- `GET /api/v1/matters/{id}/member-candidates`: Matter OWNER only, with active workspace membership. Returns the existing members page shape for active workspace members. The UI excludes existing Matter members. This read grants no permissions; membership commands retain authorization and CAS checks.
- `GET /api/v1/workspaces/{id}/member-candidates?q=<name>`: local/dev opt-in `MC_LOCAL_PEOPLE_DIRECTORY=true` (default false). Workspace OWNER only. Returns `{items:[{userId,displayName}]}`, at most 20 provisioned product users in the caller's issuer, excluding active members. Case-insensitive literal substring search, q at most 100 bytes; no provider/admin calls, email or subject disclosure. SQL rechecks active OWNER membership. This PO-approved local visibility boundary is not a production organization directory.

IDs remain stable wire/route keys; user-facing pickers and scope navigation use names. No schema migration is needed.

## MatterControl product API

The product API (`cmd/mcapi`) serves
`/api/v1` with its own catalogue, problem types (`urn:mc:*`), per-operation receipt/CAS rules
and W6 data operations. The **normative, living catalogue is the application contract**
(`docs/api/contract.md`, §2–§2.7): it defines every route with
its receipt/CAS scope, roles, DTO presence/null policy, fingerprint and error precedence. This
page stays a summary and defers to that contract.

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


## Business-flow remediation addendum (2026-10-30)

Binding detail: `docs/api/contract.md` Revision 13.

| Endpoint | Notes |
|---|---|
| `GET /api/v1/me/reviews?limit&cursor` | Pending assessments the caller may decide as a designated independent verifier. Envelope `{items, page:{limit,maxLimit,total,nextCursor}}`; `MC-As-Of` header. 400 `urn:mc:bad-request` for a bad `limit`/`cursor`; 401/403 as every `/me` read. Empty for a submitter, viewer, undesignated owner or revoked member. |
| `GET /api/v1/matters?q&limit&cursor` | Matters the caller can open across their active workspaces, by title. Rows add `workspaceName`. `total` is exact. 409 `urn:mc:rejected` (`query-too-long`) for `q` over 100 characters. |
| `POST …/work-items/{id}/criteria` | Body adds `purpose` (`PACKAGE` default, `SIGNATURE`, `OUTCOME` — D-9 ratified 2026-10-31). 409 `urn:mc:rejected` codes `invalid-purpose`, `outcome-criterion-not-applicable`; revising with another purpose: `purpose-immutable`. |
| `GET …/work-items/{id}` | Adds `isFiling` and, for a filing, `outcomeVerification` (`NOT_TRACKED`/`NOT_DECLARED`/`PENDING`/`ACCEPTED`). `GET …/filings` rows and `GET …/filings/{id}` add the same field. |
| `GET …/work-items/{id}/proof` | Adds `package`, `signature` and `outcome` summaries (D-9); each criterion adds `purpose`. |
| `GET /matters/{id}/brief?t1&t2` response | `changes[].targetLabel` (label recorded by the change itself; may be empty). |

## Record-name Search

POST `/api/v1/search` is an authenticated, bounded read (not a receipted command). Its JSON body, typed groups, EN/VI comparison, cursor/privacy/error and authorized duplicate-metadata contract are specified in the shared local implementation contract revision13 §8. Every response is private/no-store; authentication still runs before validation. Errors use the existing problem format: 400 invalid request, 413 payload-too-large, 409 search-stale, 503 unavailable. Each group has its own snapshot instant. Hidden and nonexistent records are indistinguishable; Workspace OWNER has no implicit Matter access. No file-content/people search or new permission is introduced.

## Remaining local features (RLF, 2026-11-03)

The shared local implementation contract revision 14, section 9 records the approved local
scope. All paths below have the `/api/v1` prefix and use the existing authentication, problem
responses and hidden-resource rules.

| Routes | Contract |
|---|---|
| `GET /me/agenda?from&until&limit&cursor` | Authorized work and milestone due dates across accessible Matters. Date bounds are inclusive UTC `YYYY-MM-DD`; limit is at most 200. Keyset paging uses due date, Matter, kind and item identity; no total is invented. |
| `GET/POST /matters/{id}/saved-views`, `PATCH /matters/{id}/saved-views/{viewId}`, `POST /matters/{id}/saved-views/{viewId}/removal` | Private named filter definitions, not record snapshots. Create is receipted; update/removal require the view's strong ETag. Only the view owner may mutate it, with Matter EDITOR/OWNER authority. Duplicate names within the same Matter/user return 409 `urn:mc:rejected`. |
| `GET/POST /workspaces/{id}/playbooks`, `GET /workspaces/{id}/playbooks/{playbookId}`, `POST /workspaces/{id}/playbooks/{playbookId}/revisions` | Active workspace members read; Workspace OWNER creates/publishes. Create and publication are receipted commands with workspace `If-Match`. Published revisions retain exact entries. Duplicate workspace/name returns 409 `urn:mc:rejected`. |
| `GET /matters/{id}/playbook-applications/preview?revision`, `POST /matters/{id}/playbook-applications`, `GET /matters/{id}/playbook-instances` | Matter OWNER previews/applies an exact revision from the same workspace. Apply body contains `revisionId` and `ownerMap`; apply is atomic and receipted. Same-key replay recovers the outcome; a new-key application of the same revision is refused. |
| `GET/POST /matters/{id}/intake`, `GET /matters/{id}/intake/{intakeId}`, `POST /matters/{id}/intake/{intakeId}/decline`, `POST /matters/{id}/intake/{intakeId}/conversion` | Matter members read; OWNER/EDITOR create and triage. Create/conversion are receipted; decline requires `If-Match`. States are PENDING, DECLINED and CONVERTED. Exact document-version attachments and conversion are validated inside the Matter transaction. Read failures propagate instead of fabricating absence. |
| `GET/POST /matters/{id}/guidance`, `POST /matters/{id}/guidance/{docId}/revisions`, `POST /matters/{id}/guidance/{docId}/publication` | Matter OWNER/EDITOR draft; OWNER publishes one exact revision. Draft/create/publication are receipted. Viewers see published revisions. Publication neither completes work nor verifies legal claims. Duplicate Matter/title returns 409 `urn:mc:rejected`. |

Migrations 0013–0016 add the seven feature tables. Reapply the operator's B1 grants after
migration; `saved_views` needs DELETE as well as SELECT/INSERT/UPDATE. Other feature tables
retain their narrower grant classes. Browser, real IdP, load and production acceptance are
separate from the local suite results.
