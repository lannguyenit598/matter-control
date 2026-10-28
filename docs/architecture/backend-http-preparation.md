# BE-02 preparation — Requirement HTTP and identity boundary

Status: DRAFT_FOR_TECHNICAL_REVIEW, document preparation only. Prepared by Local Codex on2026-10-26 following the PO request to advance independent work while OpenCode reviews BE01. Architectural ownership remains with Claude Code; ZCode supplies implementation feasibility and OpenCode independent verification. No product architecture decision, endpoint activation or source implementation is approved here.

## 1. Small next increment

Expose the existing typed Requirement create/read service through a dedicated product HTTP composition, with a verified per-user identity and an explicit product wire contract. Add own-key operation reconciliation before claiming complete unknown-outcome recovery. Reuse the existing service/UoW/product migrations; preserve the native User server and INT-A baseline.

This preparation can finish before BE01 acceptance. Source work must use the eventual independently accepted BE01 revision, not silently build on HEAD136eae6 alone. The current reference is136eae6 plus uncommitted patch33297560; [input hashes](../testing/be02-preparation/inputs.json) record its exact identity. BE01 review changes require rechecking only affected preparation assumptions.

## 2. Source facts and compatibility gaps

All backend locations below are relative to `/private/tmp/mattercontrol-backend-be01`; this is a read-only reference, not an assigned writing destination.

| Gap | Direct source evidence | Required disposition before product activation |
|---|---|---|
| BG-01 identity | `httpapi/server.go:35,48,90` accepts optional middleware and registers User routes; product users have unique issuer+subject at product migration:9–14, but no identity resolver exists | INT-D02 remains unselected. Define a verified-principal boundary and lookup semantics, with no shared/debug/client actor fallback. A fake in unit tests cannot close real auth. |
| BG-02 product errors | `httpapi/errors.go:67,97` uses native retryAfter1 and mostly about:blank; the Echo handler inserts actual request path as instance | Define the product problem table, uniform404 bytes, unknown-commit handling and retry convention. Keep native bytes/probes unchanged; INT-D09 governs material retry decisions. |
| BG-03 composition/schema | `app/app.go:125,201–220` wires UserService and legacy Migrate/PendingMigrations; product `matter_migrate.go:35,66` has separate entry points | Dedicated product graph/schema readiness. Never point the legacy migrate/start path at the product DB; both bundles define incompatible users tables. |
| BG-04 HTTP fingerprint | `port/matter.go` accepts a trusted RequestHash; no product handler builds it. Native user DTO ignores unknown fields and parseIfMatch treats absence/star as unconditional | Define strict product DTO decoding, duplicate-key handling, framed canonical intent and scope-specific preconditions. Do not change legacy parsing globally. |
| BG-05 receipt/reconciliation | `MatterService` exposes only CreateRequirement/GetRequirement. `Receipt` stores a domain snapshot, not a complete encoded HTTP envelope | Decide stable wire replay and add authorized own-key snapshot lookup before claiming operation reconciliation. No pool read that bypasses scope/represented-Matter authorization. |
| BG-06 provenance/boundaries | `RequirementCreatedResult` has seq/recordedAt; `RequirementRead` has asOf/sourceRevision, neither exposes historyMaterializedThrough. Current read does not run a temporal evaluator | Capture actual fence/provenance within the existing transaction/snapshot. No wall-clock substitution, fake materialization or claim of time-correct derived values without an evaluator or an approved fail-closed scope. |
| BG-07 policy composition | `access.go:152–162` permits a zero key-age policy as a disclosed BE01 test seam; purge_after stays nullable | Explicit validated policy at future product startup, no production fallback to zero. INT-D07/TB06 values remain unapproved. Do not add a purge job in this increment. |
| BG-08 ETag representation | Candidate API§1 combines strong revision ETag with database-clock asOf and Matter-wide sourceRevision in every response | Resolve representation/CAS compatibility: equal resource revision can accompany different GET body bytes. This is a candidate-contract issue, not a reproduced BE01 defect. |

BG-08 reasoning: a strong validator must distinguish changes observable in representation data ([RFC9110§8.8.1](https://www.rfc-editor.org/rfc/rfc9110.html#section-8.8.1), official primary source checked2026-10-26). Proposed alternatives: keep resource representation stable and move per-read provenance into defined metadata; or use representation-specific ETags with an explicitly revised CAS mapping. Neither is adopted. A weak ETag is not a drop-in fix for If-Match. Merely setting no-store does not turn a revision token into a valid strong representation validator.

## 3. Candidate endpoint boundary

These are proposal rows, not additions to the current operation catalogue. Create and operations are already described in the candidate API; the exact individual Requirement GET path needs explicit catalogue confirmation. Do not alter the32-operation candidate or F10 proposals through this preparation.

| Operation | Candidate request | Result and preconditions |
|---|---|---|
| POST `/api/v1/matters/{matterId}/requirements` | Per-user bearer identity; UUIDv7 Idempotency-Key; JSON containing only title/outcome |201 immutable created result. Create has CAS scope none: supplied If-Match produces candidate400 precondition-not-applicable, not428. Location, stable replay representation and ETag await BG05/08. |
| GET `/api/v1/requirements/{id}` — proposed exact path | Per-user bearer identity; no client actor or asOf |200 authorized Requirement and truthful provenance from one snapshot; member roles O/E/V. Inaccessible/nonexistent/kind mismatch have one fixed404 body. No PATCH/transition route in this increment. |
| GET `/api/v1/operations/{idempotencyKey}` | Authenticated caller's own key; no actor query parameter | Candidate200 committed outcome, otherwise uniform404 or410 after retention.404 never proves the original did not or cannot commit. Required service/snapshot port is absent today. |

DTO proposal for create: preserve separate Requirement identity, matterId, title, outcome, execution, dependency, verification, verificationApplicability, proofEpoch and revision. Initial state is BE01's NOT_STARTED/READY/UNVERIFIED, REQUIRED,epoch0,revision1; metadata remains null until its owning later commands. Never expose RequestHash or trust an actor from request JSON. Final field names/envelope are technical-review output, not a new authoritative schema.

Do not fill timing, attention, readiness or historyMaterializedThrough with constants to match a sample. If the intended product representation requires unavailable evaluation, leave activation blocked or seek an explicit reduced representation decision. BE01's bounded create/read implementation does not implement all state engines.

## 4. Proposed processing and fingerprint rules

Use existing request-ID/log/cancellation patterns where compatible. Product auth runs before any product use-case invocation. Membership authorization stays authoritative inside the command transaction or read snapshot; verified identity alone grants no Matter access. Unknown identity provisioning must be explicitly defined; no implicit user/membership creation is proposed.

For a valid create, propose a deterministic framed tuple:

```json
{
  "version": 1,
  "method": "POST",
  "routeTemplate": "/api/v1/matters/{matterId}/requirements",
  "path": {"matterId": "<validated canonical ID>"},
  "body": {"title": "<decoded string>", "outcome": "<decoded string>"},
  "preconditions": {"ifMatch": null, "ifNoneMatch": null, "expectedRevisions": {}}
}
```

Propose SHA256 of a specified deterministic UTF8 JSON encoding of that fixed-shape tuple, with a fixed member order/escaping policy. This is a concrete proposal for technical review, not an approved canonicalization standard. JSON property order/insignificant whitespace/escape spelling do not change decoded intent; title/outcome string content remains exact before domain trimming. No implicit Unicode normalization, number conversion, duplicate property acceptance or hash of delimiter-concatenated strings. Reject forbidden actor/hash/derived-state fields rather than silently accepting them. Exact malformed/unknown-field status precedence remains to be specified alongside the schema.

Exclude bearer tokens, request IDs and changing transport metadata from the fingerprint. Idempotency-Key is the lookup identity, not content added to the hash. Method/template/path scope and accepted revision inputs remain bound to intent. Do not accept a caller-supplied trusted hash. No new production payload/field size limit is selected; enforce limits only after their scope/value has been decided.

## 5. Stable replay and error proposals

Prefer a version-pinned deterministic wire projection of the immutable stored domain outcome for this small slice if it can preserve every returned body field, status and relevant header across restart and future codec versions. Persist missing immutable provenance in the same command transaction. If that condition cannot be met, propose an additive immutable wire snapshot with clear inward dependency boundaries. Technical owner must choose; no generic receipt framework or extra post-commit receipt write is authorized.

Replay must not regenerate asOf, read the latest Requirement, change Location/ETag arbitrarily or put request-specific replay flags in stored body. Candidate Idempotent-Replayed header may differ; request correlation headers remain per request. Operations lookup's outer asOf is its own snapshot; its nested committed outcome remains unchanged. Retain current authorization of saved workspace and all represented Matters before comparison/disclosure.

| Outcome | Candidate product mapping | Limit |
|---|---|---|
| Domain validation |422 validation | Do not expose internal SQL/token data |
| Invalid/missing identity |401 unauthenticated | Provider verification unavailable needs separate outage disposition; do not fabricate invalid credentials |
| ErrNotFound |404 not-found | Fixed body, no resource path/title/count or per-request dynamic body field |
| ErrForbidden for an active member |403 forbidden | No inaccessible-resource403 leak |
| Key reuse / key expired |422 respective problem | Preserve saved-scope auth first |
| ErrBoundaryDue | Proposed503 unavailable | Refusal leaves pending state intact; no engine invented |
| ErrUnavailable / request deadline | Proposed503 unavailable | INT-D09 retry convention unresolved |
| ErrOutcomeUnknown | Proposed503 with internal outcome_unknown classification | Does not assert rollback; never auto-resubmit with a new key. Exact external convention is a pending decision. |
| Actual client cancellation | Preserve cancellation cause; no success claim | A disconnect is not proof the transaction aborted |
| Unexpected internal error |500 fixed non-sensitive body | Do not map every error to retryable503 |

## 6. Implementation reach after approval

| Area | Smallest proposed change and affected callers/checks |
|---|---|
| Inbound product HTTP | Dedicated product registration/DTO/identity glue; shared middleware only after compatibility check. Huma and Echo error paths must agree; no modification of User semantics. |
| Composition/config | Product graph and product migration readiness; explicit auth/policy dependencies fail startup when missing. No change to native defaults or INT-A binaries. Command/entry-point names need technical confirmation. |
| Core/ports | Only necessary verified-principal resolution, own-key receipt read and truthful immutable provenance additions; no HTTP/pgx/Fx imports in core. Current membership checks remain inside UoW/snapshot. |
| PostgreSQL | Existing issuer+subject identity lookup, receipt/scope snapshot reads and any approved additive receipt fields. Use sqlc generation; never edit generated code manually or mutate BE01 evidence/schema fixtures while review runs. |
| Tests/docs | New HTTP/schema/fingerprint/receipt/auth-negative tests plus updated contract/architecture/operations docs. Test-only principal injection must be unreachable from product runtime configuration. Existing native goldens remain unchanged. |

Do not create a successor branch from a dirty/unaudited tree. Once source work is authorized and the actual accepted BE01 revision is known, make an isolated successor checkout and record its exact base. Independent OpenCode review remains mandatory.

## 7. Work that can proceed now and later gates

Now: technical gap review, final proposed DTO/fingerprint vectors, endpoint-to-policy trace, test-fixture plan and classification of BG01..08. ZCode can return a read-only feasibility delta through the prepared preflight prompt; no dispatch has occurred.

Before source implementation: explicit bounded BE02 assignment, accepted/pinned BE01 outcome, technical owner disposition of the contract gaps and an allowed commit/checkout route. Test-only seams must be explicitly distinguished from any product authentication claim. Before product runtime: INT-D02/07/09 and any material representation/scope trade-off must have their required decisions; independent negative auth/isolation/replay checks must execute. No demand for hosting/provider/production work merely to prepare this local contract.

Acceptance cases are enumerated in [acceptance-cases.json](../testing/be02-preparation/acceptance-cases.json). Every case is NOT_RUN. Existing22CT/51INT-A IDs/results and F08/F10 remain unchanged. This proposal does not close C01-PRODUCT, MC002, MC003A, Cloudflare/cost/recovery or STEP03B.

Skipped: source edits, external agent calls, library upgrades, auth setup, test execution, DB/runtime changes and commits. Main risk: technical and PO-owned contract decisions remain open; treating this draft as an implementation approval would bypass the current gates.
