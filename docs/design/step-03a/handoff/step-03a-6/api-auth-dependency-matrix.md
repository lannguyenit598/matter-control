# MC-003A-ARCH-COMPAT — API / Auth dependency matrix

Author: Claude Code (actual) 2.1.310, model claude-opus-5-5. 2026-10-25T07:21Z. Head 6530858; base dbcc4a9; local-r3 24103d1; Step02 references dd959b6 (7 snapshot blobs verified equal to source). Document and source review only.

## Authority legend

| Class | Meaning | Sources |
|---|---|---|
| APPROVED_POLICY | PO-approved product policy; not reopened | PRD/SRS, business-rules RULE-001..021, state-semantics, permission-matrix, golden-workflow-acceptance (APPROVED_BY_PO / APPROVED_INPUT, 572835a, OBD-02..08/10/11); DEC-023..025 |
| INT-A_TRANSPORT | Approved local synthetic transport scope only | DEC-028 / INTA-1 (inta-po-approval.md, inta-approved-contract.md) |
| CANDIDATE_ARCH | Claude-authored; OpenCode PASS_DOCUMENT_ONLY; **PO Architecture Approval Gate NOT_PASSED** | api-contracts.md, security-architecture.md, dependency-engine.md, document-lineage.md, filing-model.md, ADR-002 (all PROPOSED / WAITING_ARCHITECTURE_APPROVAL) |
| UNRESOLVED_PO | Material trade-off not selected | ADR-001, ADR-003, INT-D02 (IdP), INT-D04..08, TB-05/06 |
| PROPOSAL_ONLY | Decision analysis, no decision | api-auth-decision-analysis.md INT-D02..09, integration-scope-proposal.md |

Self-review disclosure: CANDIDATE_ARCH documents were authored by Claude Code claude-opus-5-5. This review checks design compatibility against them; it is not an independent review of them and does not approve them.

## A. The 412 and 200 dispositions

| Item | Source | Classification | Notes |
|---|---|---|---|
| 412 native (INT-A T10) | INTA-1 §4 T10, §3 mapping | **ALREADY_APPROVED_CONTRACT, transport scope only** | Local synthetic Next-dev harness → native UserAPI → unchanged Go → PG. The client sees ApiError 412/HTTP_ERROR. Runtime NOT_RUN. Proves nothing about product auth, idempotency or business semantics |
| 412 product `stale-revision` / `stale-criterion-revision` | api-contracts §1, §1.1, §3.4 | **COMPATIBLE_PROPOSAL** (CANDIDATE_NOT_YET_APPROVED) | Consistent with RULE-018 (mechanism delegated to architecture) and the design conflict state. Not promoted by INT-A. Candidate 428-on-missing is stricter than native; the client must always send If-Match |
| 409 for stale | Antigravity return (returned-output.txt lines ~297-313, 380) | **CONTRACT CONFLICT with candidate; already corrected by intake INT-01** | 409 is guard/transition/cycle/duplicate/preview-mismatch only. No universal 409 stale mapping |
| 200 bulk per-row (product) | api-contracts §3.6 | **COMPATIBLE_PROPOSAL** (CANDIDATE_NOT_YET_APPROVED) | Matches RULE-013 and AC-112/133. Row outcomes APPLIED/STALE/FORBIDDEN/NOT_FOUND/INVALID. New failed-only preview excludes successful rows. Bulk commit has no If-Match (scope none, digest binding) |
| 207 Multi-Status | Antigravity return | **CONTRACT CONFLICT with candidate; already corrected by intake INT-01** | Not used |
| 200 bulk (INT-A) | INTA-1 §4 | **NOT_APPLICABLE** | INT-A has no bulk route |
| refId fixed-route rule, value envelope, 16 KiB truncation | Step02.3 clarification F1/F2; INTA-1 §3, §5 | **NOT_APPLICABLE to product; closed, not reopened** | Harness control/evidence semantics. No new material evidence |

## B. Comparison dimensions

| Dimension | INT-A (approved transport) | Product candidate | Design expectation (r3) | Disposition |
|---|---|---|---|---|
| IDs | Native User UUID; harness `refId` lowercase canonical UUID in fixed route only | UUIDv7 path params; matter scope in path or derived and validated | Typed IDs per object; no route assumption | Compatible; do not copy refId into product |
| Fields / shapes | Native User + value/apiError envelope (harness) | Node shape with 5 axes + reasons, revision, asOf, sourceRevision; control-room shape **unspecified**; detail read routes **not enumerated** | Five axes + reasons + as-of; per-region Control Room; drawers/tabs | Compatible except TQ-02 (control-room shape) and TQ-08 (detail reads) |
| Truncation | Retained evidence bodies capped 16 KiB, flagged | None in contract | None | Not applicable to product |
| Loading / pagination | n/a | Keyset `after`, `limit` ≤200 default 100; no total | 50–200 rows retaining filter/sort/selection/scroll | Compatible with constraint C-API-6; starter Pagination is page-number based |
| Preconditions | If-Match quoted version; stale → 412 | If-Match required iff CAS scope; 428/412/400; expectedRevisions | Conflict detected before write; reload/reconcile | Compatible proposal |
| Retry / idempotency | No Idempotency-Key, zero automatic retries; X POST outcome stays unknown | Idempotency-Key per intent; receipt; replay; operations lookup; no final-absence guarantee | Unknown-outcome reconciliation; retry selection | Compatible proposal; INT-D09 conventions open |
| Unknown outcome | 503 never implies commit/no-commit | 503 unavailable; 404 on operations ≠ never committed | Unknown outcome shown explicitly | Compatible; starter treats timeout/network as plain failure (C-IDEM-2) |
| Inaccessible resource | Not in scope | Uniform 404, no title/count; 403 only for members lacking role | Denied state leaks no identity/count | Compatible |
| Bulk retry | n/a | New failed-only preview | Failed rows stay selected; retry | Compatible |

## C. Authentication / authorization dependencies

| Need | Authority | State | Blocks |
|---|---|---|---|
| Identity provider and token model | INT-D02, UNRESOLVED_PO | Not selected; ID-A preferred for evaluation only | All product integration slices |
| Authn separate from authz | security-architecture §2 (candidate); INT-D02 settled baseline | Settled principle: IdP authenticates only; roles/memberships in MatterControl | — |
| Workspace AND Matter membership AND role | permission-matrix, RULE-017 (APPROVED) | Policy approved; enforcement unimplemented | Integration until negative tests |
| Policy mechanism | INT-D03 (Claude technical, preserve) / security-architecture §3 | Candidate: `core/policy` inside the command transaction, after the matter lock, FOR SHARE memberships | Integration |
| Independent designated non-submitter verifier | RULE-006 (APPROVED); evidence-model/DB CHECK (candidate) | Policy approved; client eligibility hint missing (TQ-03) | Evidence review slice |
| Consequential audit | RULE-019 (APPROVED); ADR-002 §1.5 (candidate) | Events in same transaction; denials in restricted security audit | — |
| Retrieval/revocation | permission-matrix revocation; document-lineage §4 (candidate) | Streaming proxy, no presigned GET; export recheck; replay re-auth | Content/export slices; storage provider TB-05 open |
| Frontend seam | auth-provider.ts:27-36, backend.ts:25, auth.ts:33-45 | Fail-closed stub; shared-token fallback and demo/anonymous wildcard sessions present | C-AUTH-1/2 must hold before any product data |
| Session/tokens placement | ADR-003 (UNRESOLVED_PO); security-architecture §6.1 | F1/F2/F4 server-side; F3 browser tokens need security review | Transport choice; components kept transport-agnostic (C-API-1) |

## D. Golden Workflow dependency trace (eventual implementation; no P0 build here)

| Workflow step | API (candidate) | State / invariant (approved) | Permission |
|---|---|---|---|
| GW-01 Approval | requirements/actions; evidence + claims; assessments | RULE-005/006; COMPLETED≠VERIFIED | O,E submit; DV non-submitter verifies |
| GW-01 Document | documents, version-uploads/:commit, :promote | RULE-011 upload≠promote; one current | O,E add; OWNER promote with expectedCurrentVersionId |
| GW-01 Signature | signature-observations on exact version | Separate from current-version status | O,E |
| GW-01 Payment / Transfer | execution-transitions; evidence on respective Requirements | No product payment; assertions + proof only | O,E; DV |
| GW-01 Closing | milestone readiness; dependency edges; critical chain | RULE-008 vs RULE-003; cancelled ≠ satisfied | OWNER prerequisites; O,E edges |
| GW-01 Filing / Post-Closing | filings (as GW-03); requirements + evidence | RULE-012 | as GW-03 |
| GW-02 Request → Document → Review | actions; waits; version-uploads; assessments (assessedDocumentVersionId) | Request sent ≠ evidence; review on identified version | O,E; DV |
| GW-02 Gap → Finding → Follow-Up | criteria gaps; findings (typed context); actions; waits | RULE-020; Finding resolves with reference, no deletion | O,E |
| GW-02 Resolution | evidence + assessment; execution COMPLETED | Gate satisfied only per edge type | DV; O,E |
| GW-03 Package → Signature → Submission | filings; filing observations; signature observations; exact submitted versions | Package guard; submission ≠ completion | O,E |
| GW-03 Receipt → Authority Review | observations with acknowledgement evidence; waiting_on authority | Receipt ≠ approval; WAITING can coexist with READY | O,E |
| GW-03 Supplement → Response (repeat) | observations with expectedCycleNo | New cycle per request; first request never overwritten | O,E |
| GW-03 Approval / negative | observations with outcome evidence; :cancel/:reopen/corrections | Approval needs outcome proof; rejection = negative outcome, OWNER CANCELLED; requirement unmet | O,E; OWNER for negative/cancel/reopen; DV verifies |

All rows: active Workspace AND Matter membership; history event per accepted change; Grid/Control Room readback consistency (AC-161..163 checkpoint ledger). Runtime: NOT_RUN.

## E. Open technical questions (no ADR required)

| ID | Question | Smallest resolution | Owner | Blocks |
|---|---|---|---|---|
| TQ-01 | Reopen/promote impact before confirm (r3 I-11; permission-matrix "impact summary") | Read-only server dry-run, or UI labels a pre-confirm preview as non-authoritative as-of and shows the server `derivedChanges`/`impact` after commit | Claude (contract), Codex/OpenDesign (copy) | Reopen/promote slice UX copy only |
| TQ-02 | `GET /control-room` response shape and per-region availability | Specify sections each with status/asOf/items/reasons, or compose from section endpoints | Claude, ZCode | Control Room integration |
| TQ-03 | Client hint for verify eligibility and role-aware affordances | Add per-object `viewerCapabilities`/eligibility hint to read shapes (advisory only) | Claude | Evidence review UX polish (server 403 remains authoritative) |
| TQ-04 | Product error/retry conventions (retryAfter, Retry-After, command 503 as unknown) | INT-D09 proposal with first product endpoint, then PO decision | Claude → PO | Unavailable/unknown UX copy |
| TQ-05 | "Changes since T-1 09:00" with seq-keyed events | Use status-brief window (RECORDED_TIME), or add `recordedAfter` to events | Claude | I-08 only |
| TQ-06 | Waiting-since / aging field naming | Name the field in read shapes, sourced from the waiting event time | Claude | I-07 aging display |
| TQ-07 | Bulk preview expiry and import size/row limits | TB-06 / workload decision | PO (values), Claude | Bulk/import UX timers and messages |
| TQ-08 | Detail read routes are not enumerated in candidate §2. Its only GETs are control-room, grid, me/actions, next-actions, milestone readiness, version content, imports/{id}, exports content, events and operations. Missing: node detail, dependency edges/graph (Dependency View, impact rail), evidence/claims/assessments, document version ledger, filing cycles/submissions, waits, external parties and milestone list | Enumerate read routes and shapes in the candidate catalogue with the first slice, each carrying revision/asOf/sourceRevision and uniform 404 | Claude, ZCode | Integration of drawers/tabs for FR-001/004/005/006/007/015/016/017; writes and aggregate reads unaffected |
