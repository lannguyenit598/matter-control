# MatterControl — System Architecture

- Author: Claude Code (actual), model claude-opus-5-5, task MC-002-ARCH. Packet-only execution: no tools, no filesystem access, no commands, no PoC.
- Inputs: requirements subject `572835a21bda764901a11aaea3c06b88750b2883`, approval record commit `54e1db5`; backend template `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`; frontend template `3e5a642479acb789eb210e73fba956f3e85082e3`; Cloudflare documentation snapshots supplied by Codex (dated Apr–Oct 2026).
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**. Hosting, frontend adapter, identity provider, object store and workload values are **WAITING_PO_APPROVAL**. Critical blockers in [technical-blockers.md](technical-blockers.md) are **OPEN**.

## 1. Scope

This document is the entry point for the logical candidate architecture. It is hosting-neutral: every component below can run under any topology in [ADR-001](adr/ADR-001-runtime-and-hosting.md), and none of them assumes the Go server runs unchanged on Cloudflare Workers. Companion documents:

| Concern | Document |
|---|---|
| Typed domain, aggregates, P1 extension points | [domain-model.md](domain-model.md) |
| Five state axes, guards, derived-state evaluation | [state-machine.md](state-machine.md) |
| Dependency graph, recursive READY, cycle prevention | [dependency-engine.md](dependency-engine.md) |
| Criteria, evidence, scoped assessments, disputes, expiry | [evidence-model.md](evidence-model.md) |
| Document identity, versions, promotion, content storage | [document-lineage.md](document-lineage.md) |
| Filing stages, cycles, submissions, negative outcomes | [filing-model.md](filing-model.md) |
| HTTP contracts | [api-contracts.md](api-contracts.md) |
| PostgreSQL schema, constraints, transactions, read snapshots | [data-model.md](data-model.md) |
| Identity, authorization, threats | [security-architecture.md](security-architecture.md) |
| Runtime/hosting, concurrency, frontend adapter decisions | ADR-001 / ADR-002 / ADR-003 |

## 2. Architecture drivers

1. **Operational truth over task tracking.** Requirement ≠ Action, criterion ≠ proof, completion ≠ verification, waiting ≠ blocked (RULE-001/002). Each concept is a typed aggregate; there is no generic Item + JSON metadata model.
2. **Server-side authority for state.** All five axes are evaluated in the Go domain core. The frontend renders returned states and reasons; it never derives READY/VERIFIED (RULE-002, NFR-013).
3. **Synchronous causal consistency.** An accepted command and every derived consequence (dependency, verification aggregate, milestone readiness, critical chain, history) commit in one transaction. Revocation, expiry and reopen are never "eventually" applied; reads cannot observe a state that contradicts committed inputs or the as-of instant (RULE-004/007/018).
4. **Attributable, append-only history** written in the same transaction as the mutation (RULE-019, FR-008).
5. **Matter-scoped isolation**: active Workspace membership AND explicit Matter membership AND operation permission on every path, including files, exports and history (RULE-017).
6. **Preserve source architecture**: Go hexagonal ports/adapters (template `internal/core/{domain,port,service}`, `internal/adapter/...`), Huma/OpenAPI 3.1, RFC 9457 problems, sqlc + Goose, version CAS; Next.js Atomic Design + feature modules with repository services and Server Actions.
7. **Cost constraint**: Cloudflare Free Tier, $0/month for an approved workload — currently unresolved for the Go/PostgreSQL stack (TB-01/02).

## 3. System context

```mermaid
flowchart LR
  owner([Transaction Owner])
  contrib([Contributor])
  reviewer([Reviewer / Manager / Designated Verifier])
  mc[[MatterControl\nControl plane for legal matter state]]
  idp[(Identity Provider\nWAITING_PO_APPROVAL)]
  obj[(Object Store\ncandidate: R2 via S3 API)]
  xl[/Excel or CSV files\nuser supplied/]
  ext([External parties and authorities\nNOT system users])
  owner --> mc
  contrib --> mc
  reviewer --> mc
  mc -->|OIDC/JWT validation| idp
  mc -->|document bytes, export artifacts| obj
  xl -->|import preview / confirm| mc
  mc -->|xlsx export, draft brief| reviewer
  ext -. represented as External Party records; no login, no e-filing, no messaging .- mc
```

External parties, signatories and authorities are records, not integrations. MatterControl does not send email, sign, pay, transfer or file (PRD §16).

## 4. Container view (logical, hosting-neutral)

```mermaid
flowchart TB
  browser[Browser\nReact 19 client components]
  subgraph FE[Web Frontend — Next.js 16.4.2 App Router]
    rsc[Server Components and Server Actions\nBFF: session, token forwarding,\nIdempotency-Key, If-Match]
  end
  subgraph BE[MatterControl API — Go 1.26, Echo v5 + Huma]
    api[Inbound HTTP adapter\nOpenAPI 3.1, problem+json]
    core[Domain core + application services\nstate, graph, proof, filing, history]
    sched[Boundary worker\nexpiry and due-time materialization]
  end
  pg[(PostgreSQL\nsystem of record + Event History)]
  os[(Object store\nstaging + committed content)]
  idp[(Identity provider)]
  browser -->|HTTPS, same-origin| rsc
  rsc -->|HTTPS JSON, user access token| api
  api --> core
  sched --> core
  core -->|pgx, single-writer per matter| pg
  core -->|S3-compatible API port| os
  rsc -->|OIDC session| idp
  api -->|JWKS verify| idp
```

| Container | Responsibility | Source basis | Hosting status |
|---|---|---|---|
| Web Frontend | Rendering, navigation, drafts, BFF calls; no domain authority | Next 16.4.2, Server Actions, `src/lib/api/backend.ts` | ADR-003 unresolved |
| MatterControl API | All commands, queries, authorization, derived state, history | Echo v5/Huma, fx lifecycle, net/http TCP listener (`internal/app/app.go`) | ADR-001 unresolved; NOT runnable unchanged in Workers |
| Boundary worker | Applies due/expiry boundaries even when nobody reads (RULE-007 "effective instant") | New; in-process ticker or external trigger | Depends on ADR-001 |
| PostgreSQL | System of record, constraints, append-only history, idempotency receipts | pgx v5, Goose, sqlc | Provider unresolved (TB-02); no D1 substitution |
| Object store | Immutable document version bytes, import sources, export artifacts | New outbound port | R2 candidate (TB-05) |
| Identity provider | Authentication only; authorization stays in MatterControl | Template has none | WAITING_PO_APPROVAL (TB-04) |

Not included by default: Kafka/relay (`EVENTS_SINK=none` stays), generic workflow engine, KV as source of truth (KV is eventually consistent per Cloudflare docs and unsuitable for authority), D1.

## 5. Backend component view (hexagonal)

```mermaid
flowchart LR
  subgraph inbound[Inbound adapters]
    http[httpapi: Huma operations\nauth middleware, ETag/If-Match,\nIdempotency-Key, problem mapping]
    tick[boundary trigger: ticker / cron endpoint]
  end
  subgraph core[Core — no framework imports]
    svc[service: command handlers\nquery handlers]
    dom[domain: access, matter, graph,\nproof, document, filing, context, history]
    pol[policy: permission matrix,\nno-self verification]
    eng[engines: readiness, verification\naggregate, timing, attention]
  end
  subgraph ports[Outbound ports]
    uow[MatterUnitOfWork]
    repo[typed repositories]
    store[ObjectStore]
    clock[Clock / IDGenerator]
    idv[TokenVerifier]
    sheet[SpreadsheetCodec]
  end
  subgraph outbound[Outbound adapters]
    pgad[postgres: pgx + sqlc]
    memad[memory: tests only]
    s3[objectstore: S3-compatible / local fs dev]
    oidc[identity: OIDC JWKS]
    xlsx[spreadsheet: xlsx/csv codec]
  end
  http --> svc
  tick --> svc
  svc --> dom
  svc --> pol
  svc --> eng
  svc --> uow
  svc --> repo
  svc --> store
  svc --> clock
  http --> idv
  svc --> sheet
  uow --> pgad
  uow --> memad
  repo --> pgad
  store --> s3
  idv --> oidc
  sheet --> xlsx
```

Proposed package layout (extends template, keeps depguard dependency rule):

```
internal/core/domain/{access,matter,graph,proof,document,filing,context,history}
internal/core/engine/{readiness,verification,timing,attention}   // pure functions, clock injected
internal/core/policy/                                             // matrix-driven Can(actor, op, scope)
internal/core/port/        // inbound use-case interfaces, outbound ports, ErrNotFound, ErrVersionConflict
internal/core/service/     // command/query handlers; one MatterUnitOfWork per command
internal/adapter/inbound/httpapi/
internal/adapter/outbound/{postgres,memory,objectstore,identity,spreadsheet,system}
internal/adapter/outbound/repotest/   // shared contract suite, including concurrency contracts
```

The central outbound port is `MatterUnitOfWork.Execute(ctx, matterID, func(tx MatterTx) error)`: it serializes all writes for one Matter, provides the matter event sequence, and guarantees that mutations, derived updates, history and idempotency receipt commit atomically ([ADR-002](adr/ADR-002-transaction-and-concurrency.md)). The memory adapter implements it with a per-matter mutex so the contract suite can run without PostgreSQL; it is never a production storage option.

## 6. Frontend component view (Atomic Design + features)

| Layer | Content | Rule |
|---|---|---|
| `components/atoms` | `StateLabel` (text + icon, never color-only), `RevisionTag`, `AsOfStamp`, existing Button/Input/Select | No domain imports |
| `components/molecules` | `ReasonList`, `FieldErrorSummary`, `ConflictNotice`, `UnavailableNotice` | Distinguishes loading / error / stale / empty (AC-156) |
| `components/organisms` | `KeyboardGrid` (generic, row-ID focus, multiselect), `TimelineList`, `DataTable` | Presentational only |
| `components/templates` | `DashboardTemplate`, `MatterTemplate` (matter switcher, contextual navigation) | Layout slots |
| `features/*` | `control-room`, `operational-grid`, `my-actions`, `dependencies`, `evidence`, `documents`, `filings`, `history`, `status-brief`, `import-export`, `access` | Each owns `schemas.ts` (Zod mirrors of OpenAPI), `services/` (REST repository), `actions.ts` (Server Actions), `components/` |
| `lib/api` | `backendRequest` extended with `Idempotency-Key`, `If-Match`, problem parsing | Shared `API_TOKEN` fallback removed for MatterControl data (TB-04) |

Demo repositories may remain for Storybook fixtures only; production builds must fail if `API_MODE=demo` (TB-12).

## 7. Domain boundaries

| Bounded context | Aggregates / records | Owns invariants |
|---|---|---|
| Access | Workspace, WorkspaceMembership, MatterMembership, VerifierDesignation | RULE-017, last-owner, no self-grant |
| Matter operations | Matter, Workstream, Milestone(+prerequisites), Requirement, Action, RequirementActionLink, WaitingOn | Execution guards, milestone readiness, Next Action ordering |
| Graph | DependencyEdge (within Matter) | AND gates, recursive READY, acyclicity |
| Proof | EvidenceRequirement(+revisions, components), Evidence, EvidenceClaim, EvidenceAssessment, Dispute, ApplicabilityDecision | RULE-005/006/007, scoped acceptance, no-self |
| Documents | Document, DocumentVersion, ContentObject, SignatureObservation | RULE-011, explicit promotion |
| Filing | Filing, FilingCycle, StageObservation, Submission(+items) | RULE-012 stage guards |
| Legal context (basic P0) | ExternalParty, EntityReference, Decision, Finding, Risk | RULE-020; Legal Question reserved for P1 |
| History | DomainEvent, SecurityAuditEvent, CommandReceipt | RULE-018/019 |
| Reporting & IO | StatusBrief generation, ExportArtifact, ImportBatch, BulkOperation | RULE-013/014/015/016 |

The Matter is the **consistency boundary**: graph, proof and state propagation never cross Matters (cross-matter links are not approved), so serializing writes per Matter is both sufficient and simple.

## 8. Consistency model summary

- Writes: per-Matter serialized transaction (`SELECT … FOR UPDATE` on the matter row), record-level revision CAS, authorization read with `FOR SHARE` inside the transaction, derived-state recompute, events with a strictly increasing per-matter sequence, idempotency receipt — one commit.
- Reads: one `REPEATABLE READ READ ONLY` snapshot per view; every response carries `asOf` and `sourceRevision` (matter event sequence high-water mark).
- Time: a **boundary fence** per Matter (`next_boundary_at`). Any command or read with `asOf ≥ next_boundary_at` first applies pending expiry/due boundaries (effective at the boundary instant) before proceeding; a background trigger does the same for idle matters. Therefore expiry "at the effective instant even if no user opens a screen" holds for every observation.
- Failure: if the fence cannot be applied or a view cannot be computed, the API returns `503 unavailable`, never a default READY/VERIFIED/zero.

## 9. Integration architecture

| Integration | Port | Candidate adapter | Notes |
|---|---|---|---|
| Identity | `TokenVerifier` | OIDC/JWT with JWKS cache | Provider WAITING_PO_APPROVAL; authentication only |
| Object store | `ObjectStore` (PutIntent, Head, Get stream, Delete) | S3-compatible (R2 candidate); local filesystem for development | Staging/commit/reconcile protocol in document-lineage.md |
| Spreadsheet | `SpreadsheetCodec` | Go xlsx/csv library to be selected and audited by ZCode | Never evaluates formulas/macros, never fetches links |
| Clock / IDs | `Clock`, `IDGenerator` | Template `system.Clock` (UTC, µs), UUIDv7 | Tests inject time (NFR-012) |
| Telemetry | OpenTelemetry (template) | OTLP endpoint optional | No parameter values, no document content in spans/logs |
| Events to other systems | none in P0 | template outbox stays disabled | Domain history is not a broker stream |

## 10. Invariant ownership matrix (Step 02 §6)

| # | Invariant | Owning component | Mechanism | Primary tests |
|---|---|---|---|---|
| 1 | Execution state | domain/matter | Transition table + guards in core | AC-160, AC-122 |
| 2 | Verification state | engine/verification | Derived aggregate, precedence rules | AC-127, AC-157, AC-160 |
| 3 | Dependency state | engine/readiness | Recursive AND over DAG | AC-105, AC-124 |
| 4 | Timing state | engine/timing | Pure f(due, asOf, execution) + boundary fence | AC-142 |
| 5 | Attention state | engine/attention | Pure f(inputs) with reasons; escalation record | AC-143 |
| 6 | Dependency satisfaction | engine/readiness | Gate kinds COMPLETION / COMPLETION_AND_VERIFIED | AC-105, AC-123 |
| 7 | Blocker propagation | service + readiness | Topological recompute of downstream closure in same txn | AC-124, AC-146 |
| 8 | Cycle prevention | domain/graph + UoW | Reachability check under matter lock; DB self-edge/unique constraints | AC-125 |
| 9 | Evidence lifecycle | domain/proof | Claims, scoped assessments, revoke, dispute, proof epoch | AC-107, AC-126, AC-157 |
| 10 | Criterion↔Evidence M:N | domain/proof | `evidence_claims` + per-claim assessments; no global evidence verdict | AC-127, evidence-model tests EV-01..06 |
| 11 | Version lineage | domain/document | Immutable versions, single current pointer, explicit promotion | AC-115, AC-128 |
| 12 | Filing lifecycle | domain/filing | Stage table, cycles, immutable submissions | AC-116, AC-129, AC-145 |
| 13 | History consistency | MatterUnitOfWork | Events in same txn; append-only table | AC-108, AC-149, AC-153 |
| 14 | Deterministic brief | service/reporting | Recorded-time window over event sequence; bitemporal reconstruction | AC-119, AC-138 |
| 15 | Bulk operations | service/bulk | Preview + per-row txn with preview revision | AC-112, AC-133 |
| 16 | Import/export | service/io | Connected-group txn, row-key idempotency, formula-safe codec | AC-113, AC-131, AC-132, AC-148 |
| 17 | Authorization | policy + UoW | Matrix in core, checked inside txn with FOR SHARE | AC-118, AC-134, AC-135, AC-147 |
| 18 | Concurrent updates | UoW + CAS | Matter lock + revision CAS + receipts | AC-139, AC-125 |
| 19 | Auditability | history | Actor, before/after, effective/recorded, cause, correlation | AC-108, AC-136 |
| 20 | P1/P2 extension | domain packages | Reserved types and expand-only migrations | domain-model §9 |

## 11. NFR mapping

| NFR | Architectural response | Remaining gate |
|---|---|---|
| NFR-001/002 | In-transaction authorization, uniform 404, proxy-only content retrieval, no shared service token for user data | Identity provider, threat review by OpenCode |
| NFR-003/009 | Idempotency receipts in same txn, operation reconciliation endpoint, per-row/per-group outcomes | Receipt retention value |
| NFR-004 | Append-only `domain_events`, separate restricted `security_audit_events` | Retention/legal hold policy (OBD-11) |
| NFR-005 | DB constraints (composite same-matter FKs, unique edges, CHECK no-self), CAS, matter lock | Concurrency tests |
| NFR-006 | Per-matter read models sized for 50–200-row views; keyset pagination | Budgets unapproved; AC-154 measurement NOT_RUN |
| NFR-007/010/011 | Text state labels, ISO-8601 instants with offset, explicit zone in every view/export | OpenDesign Step 03 |
| NFR-008 | 503 `unavailable` problems; UI distinguishes stale/error/empty | Availability objective unapproved |
| NFR-012/013 | Pure engines with injected clock; invariant owner per row above | — |
| NFR-014 | Logical dumps/PITR + object versioning options | RPO/RTO unapproved (§12) |

## 12. Workload, retention and recovery options — NOT_APPROVED

The PO deferred these numbers to Step 02. The following are **options for decision**, not approved values, SLAs or measurements.

| Option | Workspaces | Active matters | Named users | Peak concurrent editors | Records per matter | Stored content | Import/export |
|---|---|---|---|---|---|---|---|
| W1 Pilot | 1 | ≤ 10 | ≤ 15 | ≤ 5 | ≤ 300 | ≤ 2 GB, files ≤ 25 MiB | a few per week |
| W2 Small team | ≤ 3 | ≤ 50 | ≤ 50 | ≤ 15 | ≤ 1,000 | ≤ 10 GB | daily |
| W3 Growth | > 3 | > 50 | > 50 | > 15 | > 1,000 | > 10 GB | frequent |

Illustrative arithmetic only (not measurement): W1 at roughly 400 API requests per user-day is about 6,000 requests/day; W2 about 20,000. Both sit below the documented Workers Free 100,000 requests/day and Hyperdrive Free 100,000 queries/day, but a single Control Room view may issue several queries, so query counts must be measured (AC-154). W2 storage approaches the documented R2 free 10 GB-month allowance. W3 is expected to exceed free allowances.

| Topic | Options for PO | Consequence |
|---|---|---|
| Retention | R-A: retain all history and versions for matter lifetime until an explicit disposition policy exists; R-B: fixed period after matter closure (value to approve) with legal-hold override | R-A grows storage; R-B needs erasure/hold workflow (not generic delete) |
| RPO | RP-A: daily logical dump to object store; RP-B: provider point-in-time recovery if the chosen provider offers it (unverified); RP-C: continuous WAL archive | Cost and provider dependent |
| RTO | RT-A: manual restore runbook rehearsed in isolated environment; RT-B: warm standby | RT-B unlikely to be $0 |
| Object recovery | Bucket object versioning or periodic copy, with DB/object reconciliation after restore | Must restore links consistently (AC-155) |

## 13. Architecture risk assessment

| Risk | Likelihood / impact | Mitigation | Status |
|---|---|---|---|
| Go/PostgreSQL cannot be hosted within Cloudflare Free Tier and $0 | High / Critical | ADR-001 options; PO decision; no silent substitution | OPEN (TB-01/02) |
| Next.js 16.4.2 features incompatible or CPU-heavy on Workers Free | High / High | ADR-003 options; Antigravity PoC | OPEN (TB-03) |
| No authentication in either template | Certain / Critical | Security architecture; identity decision | OPEN (TB-04) |
| Per-matter write serialization limits throughput | Low at W1/W2 / Medium | Short transactions; measured lock wait | Accepted proposal, measure |
| Event-fold reconstruction for briefs becomes slow | Low / Medium | Rebuildable internal checkpoints (not P1 snapshots) | Monitor |
| Retention policy conflicts with brief reproducibility | Medium / High | Fail honestly when inputs purged; PO policy | OPEN (TB-06) |
| Owner audits (ZCode, Antigravity) not executed | Certain / High | Explicit handoffs; findings here are source interpretation only | OPEN (TB-10) |

## 14. Explicit non-decisions

No hosting provider, database provider, identity provider, frontend adapter, object-store activation or paid service is selected. No Go→TypeScript or PostgreSQL→D1 migration is proposed as a default. The design is a logical candidate under declared assumptions and stops at the Architecture Approval Gate.
