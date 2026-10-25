# MatterControl backend fast-track

Status: PROPOSED_FOR_LOCAL_SLICE_APPROVAL. Codex prepared this implementation blueprint from the actual accepted source. No product/architecture approval or STEP03B activation is claimed.

## 1. Build the transaction spine first

Fastest useful first increment: CreateRequirement + GetRequirement at the Go service boundary, current membership authorization, PostgreSQL persistence, attributable history and idempotency outcome in one transaction. This is BE-01, not a complete product HTTP API.

F-08 gap-count unit and F-10 nested filing reads do not block BE-01. Both remain required before their features ship.

Verified source: /private/tmp/mattercontrol-step022-backend-c01, clean task/MC-002-be-c01 at 52b60a4617081c41b949f2242e1784238c170f75. The separate /Users/nguyenvanlan/Documents/code/go-projects/userapi main is older d024e3e; do not use it as the implementation base. Preserve all native C01 and INT-A checkouts.

Reuse pinned Go 1.26.0, Echo 5.4.0, Huma 2.39.1, pgx 5.11.0, Goose 3.28.0, sqlc and Fx 1.24.0. No dependency upgrade, module rename, microservices, event-sourced rewrite, Kafka or cloud resource.

## 2. Important source facts

- postgres/outbox.go:38-45 runs directly on the pool when outbox is off. Product commands need an unconditional transaction. Never reuse that helper as if it always provided atomicity.
- httpapi.NewServer registers legacy User routes and has no authentication. It is not a MatterControl server.
- Native C01 retryAfter=1 is not a product retry policy.
- Product identities use issuer+subject, unlike legacy email users. Requirement/Action are separate domain types, never aliases for User/Task.
- Existing migrations are merged history. Use a separate product migration bundle, sqlc job and product database; do not alter or run legacy migrations against it.
- pgtest.FreshSchemaDSN creates/drops a random schema. Product tests need a newly verified owned disposable database, isolated from native fixtures. An explicit-DSN helper may preserve/reuse that pattern without process-wide env mutation.
- Scope the persistence.md r.write rule explicitly to legacy User writes; the proposed Matter UoW is the necessary unconditional-transaction exception, not a global rule relaxation.
- Core imports only standard library/internal core; domain has no JSON/SQL tags; Fx remains in internal/app. Primitive-field commands follow port/port.go.

## 3. Small package design

~~~mermaid
flowchart LR
  H[Future verified HTTP identity] --> S[core/service]
  S --> D[core/domain/matter]
  S --> P[core/policy]
  S --> U[core/port transaction and snapshot]
  DB[postgres / pgx / sqlc] --> U
  T[Test double] --> U
~~~

Start with one coherent product domain package, not every future context:
- internal/core/domain/matter/: IDs, Requirement, access facts, events/results.
- internal/core/policy/: approved operation matrix, default deny.
- internal/core/port/matter.go and internal/core/service/matter_service.go.
- internal/adapter/outbound/postgres/matter_*.go.
- postgres/migrations_mattercontrol/, queries_mattercontrol/, mcsqlc/ generated output.
- internal/adapter/outbound/repotest/mattercontrol/ and focused tests.
- sqlc.yaml: additive second job, original job unchanged.

No production HTTP route, auth-provider adapter, product binary or deployment in BE-01.

## 4. BE-01 contract

~~~go
type CreateRequirementCmd struct {
    ActorID        string // trusted calling identity, never a client-editable JSON actor
    MatterID       string
    IdempotencyKey string
    RequestHash    string // trusted server fingerprint, not a client trust claim
    Title          string
    Outcome        string
}
type GetRequirementQuery struct {
    ActorID string
    ID      string
}
~~~

CreateRequirement returns an immutable created-result snapshot; GetRequirement returns an authorized record with revision/asOf/sourceRevision. Results are domain/port values, not HTTP DTOs.

Create only NOT_STARTED, UNVERIFIED, dependency READY with no incoming edge, revision1/epoch0. Owner/workstream/due/links are null/empty for this narrow command; their editing remains in BE-03, not removed from P0. No auto-created Action or auto-verification.

The existing IDGenerator returns UserID; do not cast it into Requirement identity. Add only a caller-needed record-ID capability and reuse the clock concept. Domain validation remains pure.

ActorID is supplied by trusted tests/calling adapters. This slice proves membership/role enforcement, not authentication. A real verified-identity boundary is required before any later HTTP activation; no anonymous/shared-token/debug actor path.

BE-01 proves receipt persistence/replay under a trusted supplied fingerprint. Exact HTTP method/route/body/header canonicalization and wire replay remain BE-02 acceptance. Do not claim complete product idempotency protocol conformance from this service test.

## 5. Persistence/transaction contract

Use a separate product migration FS and sqlc job with the existing Goose provider pattern, not process-global migration state. Only a fresh product database/test schema may receive this DDL.

Start with data-model.md tables required for this spine: product users/workspaces/memberships/matters; workstreams for scoped nullable refs; graph_nodes and typed Requirement/Action rows; domain_events; command_receipts and command_receipt_matters; restricted security audit. Action is a structural typed-totality dependency, not a BE-01 endpoint. Implement real composite keys/typed-totality/append-only guards, not comment-only DDL. Do not scaffold proof/filing/import/object tables yet.

Create command:
1. Unconditional READ COMMITTED transaction; Matter row lock then workspace membership, Matter membership and typed rows in ADR-002 order.
2. Capture DB command instant using nondecreasing recorded-time rule. Require active workspace AND Matter membership and OWNER/EDITOR. Workspace OWNER alone grants no access.
3. Validate fields, typed scope and trusted fingerprint. Denials create no domain-success event; security audit stays restricted.
4. Replay only after current authorization, including every Matter in the saved outcome. Same actor/key/hash replays immutable stored result; mismatch conflicts. The receipt PK is actor+key: concurrent same-key requests across different Matters must not commit twice or leak a stored response.
5. Insert graph node+Requirement, advance Matter seq, append typed creation event, store immutable result snapshot/receipt and represented Matter identity.
6. The documented lock order reduces risk, not proves deadlock freedom; test revocation/FK interactions and preserve SQLSTATE handling.
7. Commit once; known pre-commit failure rolls everything back. Lost acknowledgement is OUTCOME_UNKNOWN, not proof of rollback; never retry with a new key.

Do not reconstruct replay from a later live Requirement. History is obligatory even with EVENTS_SINK=none. Adapt storage error classification from accepted SQLSTATE-first behavior without changing native C01 or mapping unrelated product constraints to email conflict.

Reads: REPEATABLE READ READ ONLY; resolve owning Matter and authorize within the snapshot. Return same boundary's record/revision/asOf/sourceRevision. Driver failure is unavailable, not invented empty/not-found.

BE-01 has no due/proof mutations. Do not silently no-op an unsupported pending temporal boundary: fail closed; later command activation needs state-machine section6 handling. Receipt age/retention/skew/deadline values are explicit injected test policy only. No new production defaults, purge job or numeric commitment; TB-06 remains open.

## 6. Acceptance — currently NOT_RUN

- OWNER/EDITOR create; VIEWER denied; missing workspace/Matter membership and foreign scope fail uniformly.
- One successful create yields one typed Requirement, event and receipt; each injected pre-commit failure yields none.
- Same key/hash, concurrency and repository restart yield one effect and the immutable saved result.
- Different fingerprint/scope under the same actor/key cannot yield two effects or unauthorized replay.
- Revocation before authorization defeats writes/replays; assignment grants no membership.
- Get is consistent; inaccessible/nonexistent/kind-mismatched IDs are indistinguishable at the use-case boundary.
- No core HTTP/SQL/Fx/driver imports, legacy aliases or secrets in evidence.
- make check and race suite pass on actual new source; separate fresh native/product PG fixtures, explicit skip inventory. Missing PG execution is not PASS.
- Report auth, wire/CAS/error protocol, temporal-boundary runtime, F-08/F-10, production/security as NOT_VERIFIED.

## 7. Delivery order

| Slice | Scope | Trace/dependency |
|---|---|---|
| BE-01 | Service create/get Requirement, access policy, UoW/snapshot, history/receipt | FR-001/008/018/020; local scope approval |
| BE-02 | Product HTTP/composition, real identity seam, exact CAS/errors/idempotency wire | IdP/API-auth/product retry and receipt-policy decisions |
| BE-03 | Action/metadata/workstreams, dependencies/reopen/waits/external parties/milestones, pure state engines | FR-001/002/003/004/005/010/017/020; synchronous propagation/boundary fence |
| BE-04 | Criteria/proof/claims/assessment/dispute/verifier and document versions | FR-006/007/015/018; real bytes depend on object provider |
| BE-05 | Filing stages/cycles/submissions/nested reads | FR-016; F-10 decision |
| BE-06 | Control Room/Grid/My Actions/basic Decision/Finding/Risk | FR-009/010/011 + FR-001 context; F-08 before numeric gap count |
| BE-07 | Bulk/import/export/draft Status Brief | FR-012/013/014/019; preview/outcomes/provenance |
| BE-08 | Consumer/security/performance/recovery/release verification | Independent QA, budgets, cloud/cost/PO release |

No P0 dropped. Existing 22 CT/51 INT-A IDs stay unchanged/NOT_RUN until their own execution. Use BE-01-specific test IDs. A completed slice does not authorize its successor.

## 8. Recommendations for the already assigned ZCode review

NEW PROPOSALS, not changes to the current 32-operation candidate:

F-08: prefer one gap row per applicable mandatory criterion component; implicit component uses componentKey=null. Stable identity (evidenceRequirementRef, criterionRevisionRef, componentKey). Dedup failing claims/reasons into one row; total counts rows. Two mandatory components with one satisfied -> total1; two rejected claims for one component -> still1. ZCode must pin applicability/revision changes/scalar gap-code selection/compatibility before adoption. Criterion satisfaction and proof authority remain unchanged.

F-10: prefer three explicit paged relations:
- GET /api/v1/filings/{filingId}/cycles/{cycleNo}/submissions
- GET /api/v1/filing-submissions/{submissionId}/items
- GET /api/v1/filings/{filingId}/cycles/{cycleNo}/evidence?role=RECEIPT|OUTCOME

Proposed count 32 -> 35 ONLY AFTER PO decision. Submission rows have identity/reference/time and relation totals, not full nested arrays; items page exact DocumentVersion refs; cycle evidence retains observation/evidence/role/proof-epoch context. Same-Matter auth, bound cursors/filter/order, provenance and working continuation; inherited per-page cap, no business cardinality cap. No current-version substitution or receipt=approval shortcut.

ZCode must return final row keys/order/envelopes/negative tests and compare complete embedding as an explicit risk alternative. No new UNIQUE/domain limit or accepted size risk. BE-01 depends on neither proposal.

## 9. Activation

Current user request authorizes design preparation. Architecture Approval Gate/full STEP03B remain unapproved. The concrete next approval is BE-01 LOCAL SOURCE IMPLEMENTATION ONLY: new isolated source branch from accepted52b60a4, unit/owned disposable PG tests, no HTTP/product deployment, paid service, existing-worktree/DB mutation or auto merge.

After that exact scope is explicitly approved, ZCode implements BE-01 and returns diff/tests/evidence IN_REVIEW. Another reviewer checks the implementation. Product auth, F-08/F-10, G3/G4/G6, cloud $0/month and release remain separate.
