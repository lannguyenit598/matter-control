# MC-003A-READ-CONSUMPTION — Antigravity Focused Reconciliation

## 1. Executive Summary & Identity

| Dimension | Recorded Evidence |
|---|---|
| **Task ID** | `MC-003A-READ-CONSUMPTION` |
| **Actual Agent & Role** | Antigravity — MatterControl Frontend Owner |
| **Model & Service** | Gemini 3.8 Flash (High) (interactive Antigravity session) |
| **Method** | Read-only structural reconciliation of the Claude Code reviewed candidate read contract against frontend architecture and starter reference components. No external payload egress, no model switch, zero charges, no credential usage. |
| **Governance Checkout** | `/Users/nguyenvanlan/.codex/worktrees/mattercontrol-step-03a-remediation/matter-control`<br>(Shared repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`) |
| **Branch & Review Head** | Branch `task/MC-003A-remediation` at commit `9262e6ea6f289ba83d70ef0016a55de9aeca6822`<br>(Intake commit: `cd30600dc8b88b80fb10b96d4049e84787c4cf47`) |
| **Input Artifact Hashes** | - `targeted-claude-review.md`: SHA256 `263718e7b7cf2554594de5bfa73e331ad3cfe4d9d97c3a7d2bfabfd45402c203` (**MATCHES EXACT**)<br>- `reviewed-read-contract.json`: SHA256 `ac2b3851e55143d9e5df8fa5df77be7ceb4255b42024aefe888f06389fe5c7f5` (**MATCHES EXACT**)<br>- `targeted-return-summary.txt`: SHA256 `b4bd1da67f09518fd153bdb26cea871e4bbc192572ee9c2bcaf9f91b8fb99fda` (**MATCHES EXACT**) |
| **Primary Reference Checkout** | `/tmp/mattercontrol-step02-frontend`<br>Commit: `3e5a642479acb789eb210e73fba956f3e85082e3`, Branch: `main`, Origin: `https://github.com/lannguyenit598/nextjs-atomic-starter` (**VERIFIED CLEAN**) |
| **Alternate Reference Checkout** | `/tmp/mattercontrol-step021-frontend`<br>Commit: `3e5a642479acb789eb210e73fba956f3e85082e3`, Branch: `task/MC-002-fe-poc` (git worktree, **VERIFIED CLEAN**) |
| **Read Depth** | **Full read**: `targeted-review-intake.md`, `targeted-review-intake.json`, `targeted-claude-review.md`, `reviewed-read-contract.json`, `targeted-return-summary.txt`, `step-03a-6/antigravity-implementation-constraints.md`, `review-intake.md`, controlled-handoff E-01 / K-2, and relevant starter component seams in `/tmp/mattercontrol-step02-frontend` (`DataTable`, `Dialog`, `MobileNav`, `Card`, `Badge`, `Alert`, `EmptyState`, `Button`, `FormField`, `SearchInput`, `Pagination`). |
| **Limitations & Gate Boundary** | This is a **read-only feasibility reconciliation** of candidate contracts. TQ-02, TQ-08, and TQ-06 are resolved only as `REVIEWED_CANDIDATE_DOCUMENT_ONLY`. TQ-01, TQ-03, TQ-04, TQ-05, and TQ-07 remain **OPEN**. All endpoints and fields remain unapproved candidate specifications. The PO Architecture Approval Gate has **NOT** passed. Product 412 and bulk 200 remain candidate specifications. MC-003A is **NOT** marked DONE. Production UI and API implementation remain **NOT_AUTHORIZED**. |

---

## 2. Reconciled Control Room Architecture: 8 Server Sections + 2 Embedded Groups

The reviewed candidate establishes that `GET /api/v1/matters/{matterId}/control-room` is a server-evaluated projection returned in a **single `REPEATABLE READ READ ONLY` snapshot** (ADR-002 §1.6). Consumers never compose matter-wide legal truth from separate calls.

```
+----------------------------------------------------------------------------------------------------+
| CONTROL ROOM SERVER SNAPSHOT (One asOf, One sourceRevision, One historyMaterializedThrough)         |
+----------------------------------------------------------------------------------------------------+
| 1. condition:    { matterRef, label, completeness: COMPLETE|INCOMPLETE, exceptions: [{code,count}]} |
| 2. blockers:     [ Upstream Cause Cards (rootCause: bool, axes, waitRef, failingGates) ]            |
| 3. nextActions:  [ Action Cards (RULE-021 rank) ] + excluded: [{ref, reason: WAITING|BLOCKED|...}] |
| 4. waitingOn:    [ Wait Cards (partyRef|condition, internalOwnerRef, openedAt, openedEventSeq) ]    |
| 5. milestones:   [ Milestone Cards (readiness: READY|NOT_READY|UNASSESSED, satisfied, total) ]     |
| 6. evidenceGaps: [ Gap Cards (MISSING|PENDING_REVIEW|REJECTED|EXPIRED|DISPUTED|WITHDRAWN) ]         |
| 7. decisions:    [ Open Decision Cards (label: question, lifecycle, relatedRefs) ]                  |
| 8. recentChanges:[ Chronological Audit Events (seq descending, targetRef, correlationId) ]          |
+----------------------------------------------------------------------------------------------------+
| Embedded in every card: [CRI-09 Actionability (permittedActions?)] + [CRI-10 Navigation (ref, relatedRefs)] |
+----------------------------------------------------------------------------------------------------+
```

### 2.1 Server Envelope, Freshness & Partial Failure Rules

1. **Single Snapshot Metadata**:
   - `meta.asOf`: Server timestamp (RFC 3339 with explicit offset, e.g. `+07:00`).
   - `meta.sourceRevision`: Integer Matter event sequence number.
   - `meta.historyMaterializedThrough`: Integer sequence indicating audit timeline coverage.
   - Per-section `asOf` and `sourceRevision` are removed from the server response; all AVAILABLE sections share the snapshot boundary.
2. **Server Availability (`AVAILABLE` vs. `UNAVAILABLE`)**:
   - Server returns only `AVAILABLE` or `UNAVAILABLE`.
   - `AVAILABLE + []` = **True Zero**: Successfully evaluated empty set (e.g., zero blockers, zero evidence gaps).
   - `UNAVAILABLE + null` = **Evaluation Failure**: Never presented as zero or READY. Renders an explicit section error boundary.
3. **Partial 200 vs. 503 HTTP Semantics**:
   - Root returns HTTP `200 OK` when **at least one** section is `AVAILABLE`.
   - Root returns HTTP `503 Service Unavailable` (`/problems/unavailable`) only when the snapshot fails to open or all sections fail.
   - A `200 OK` response does **not** mean all sections are fresh. Consumers must inspect every section's `availability` independently.
4. **Condition Exceptions & Completeness**:
   - `condition.completeness` is `INCOMPLETE` whenever any contributing section is `UNAVAILABLE`.
   - Any exception count sourced from an `UNAVAILABLE` section must be `count: null` (rendered as "Unknown", never `0`).
5. **Client-Owned `STALE` State**:
   - `STALE` is strictly client-owned. If a periodic background refetch fails (e.g. 503 or network failure), the client retains the prior authorized response, visually labels it `STALE`, and renders it with its **original `asOf` timestamp**. It is never presented as current truth.
6. **Authorization Revocation (RC-1, RC-3)**:
   - On HTTP `401 Unauthorized` or uniform `404 /problems/not-found` (returned for non-members, matching non-existent matters), the client must immediately **purge all cached protected state** for that Matter.

### 2.2 Section-by-Section Reconciliation Matrix

| Section Name | Server Order & Traceability | Card / Shape Schema | Continuation Route & Default Order | Actionability (CRI-09) & Navigation (CRI-10) Obligations | Consumer Presentation & Component Adaptation |
|---|---|---|---|---|---|
| **1. `condition`** | P0 overview (CRI-01). Traced to FR-009, AC-109. | `{matterRef, label, exceptions: [{code, count}], completeness: COMPLETE \| INCOMPLETE}` | *None* (single card at top of Control Room). | Summarizes matter status and exception categories. Does not provide direct action triggers. | Renders matter headline, as-of time, and exception tags. If `completeness == INCOMPLETE`, displays prominent warning badge and renders `null` exception counts as "— (Unknown)", never `0`. |
| **2. `blockers`** | P0 upstream causes (CRI-02). Traced to FR-005, FR-009, AC-105, AC-137. | `{ref: REQUIREMENT \| ACTION, label, axes, ownerRef, dueAt, waitRef \| null, rootCause: bool, failingGates: [{edgeRef, downstreamRef, gate, failed: [code]}], criticalMilestoneRefs, revision}` | `GET /matters/{m}/blockers`<br>Order: critical-unsatisfied first, then `rootCause` before intermediate, then `dueAt` asc (nulls last), then `id`. | Cards represent **upstream causes**, not blocked targets. Shows cause's own WAITING/READY axes and `waitRef`. Targets reachable via DR-06. | Replaces starter presentational table with `BlockerCard`. Prominently highlights `rootCause: true` (e.g. Atlas T0 RQ-04 WAITING+READY failing DEP-01). Clicking `ref` triggers NAV-01; clicking downstream triggers NAV-09. |
| **3. `nextActions`** | P0 actionable queue (CRI-03). Traced to FR-003, FR-009, AC-103, AC-144. | `{ref: ACTION, label, ownerRef, dueAt, axes, permittedActions?}`<br>Section adds: `excluded: [{ref, reason: WAITING \| BLOCKED \| UNASSIGNED}]` | `GET /matters/{m}/next-actions`<br>Order: RULE-021 (critical-unsatisfied, `dueAt` asc, `id`). | **Requirements NEVER enter nextActions**. Cards carry optional advisory `permittedActions`. Atlas T0 empty candidate list renders `excluded[]` reasons. | When `items` is empty, renders `EmptyState` explaining why zero candidates exist (listing excluded actions with reasons). Does not synthesize tasks. Navigates via NAV-06 to Action Inspector. |
| **4. `waitingOn`** | P0 waiting relations (CRI-04). Traced to FR-004, FR-009, AC-104, AC-130. | `{ref: WAIT, subjectRef, partyRef \| condition, internalOwnerRef, reason, followUpDueAt, openedAt, openedEventSeq}` | `GET /matters/{m}/waits`<br>Order: `followUpDueAt` asc (nulls last), then `openedAt`, then `id`. | Separates execution `WAITING` from dependency `BLOCKED`. Displays internal accountable owner and external party. TQ-06 provides system-recorded `openedAt`. | Displays follow-up due badges and time elapsed since `openedAt`. Click on `subjectRef` navigates to Requirement/Action detail; click on `partyRef` navigates via DR-13. |
| **5. `milestones`** | P0 milestones (CRI-05). Traced to FR-002, FR-009, AC-102, AC-141. | `{ref: MILESTONE, label, dueAt, critical, readiness: {state: READY \| NOT_READY \| UNASSESSED, satisfied, total, unsatisfied: [{requirementRef, failed: [code]}]}}` | `GET /matters/{m}/milestones`<br>Order: `dueAt` asc, then `id`. | Evaluates explicitly declared prerequisites. Empty prerequisite set returns `UNASSESSED`, never ready. | Renders milestone cards with satisfied/total progress fraction. Explicitly displays `UNASSESSED` state without showing a green checkmark or artificial percentage. Click triggers DR-03 readiness drill-down. |
| **6. `evidenceGaps`** | P0 evidence gaps (CRI-06). Traced to FR-006, FR-007, FR-009, AC-106, AC-127. | `{ref: EVIDENCE_REQUIREMENT, criterionRevisionRef, componentKey?, subjectRef, gap: MISSING \| PENDING_REVIEW \| REJECTED \| EXPIRED \| DISPUTED \| WITHDRAWN, evidenceRefs (actual only)}` | `GET /matters/{m}/evidence-requirements?gap=true`<br>Order: subject critical first, then subject `dueAt`, then `id`. | Separates Evidence Requirement from Evidence. Missing proof is a gap, never a fabricated evidence record. `evidenceRefs` lists actual proofs only. | Displays gap badge with explicit severity. Clicking `ref` navigates via NAV-02 to Evidence Requirement detail; clicking `evidenceRef` (if present) navigates via NAV-03 to Evidence record. |
| **7. `decisions`** | P0 decisions queue (CRI-07). Traced to FR-009, AC-109, D-UX03. | `{ref: DECISION, label (question), lifecycle, ownerRef \| null, relatedRefs}` | `GET /matters/{m}/decisions?open=true`<br>Order: `dueAt` (if recorded), then `createdAt`, then `id`. | Positioned prominently alongside `nextActions`. Displays unresolved matter questions (e.g., DEC-AT-01/02) and responsible owner. | Reusable card item rendering decision question and related matter entity links. Clicking decision triggers NAV-10. |
| **8. `recentChanges`** | P0 event history (CRI-08). Traced to FR-008, FR-009, AC-108, AC-136. | `{eventRef, type, actorRef, recordedAt, effectiveAt, targetRef, correlationId}` | `GET /matters/{m}/events?before={seq}`<br>Order: event sequence `seq` descending. | Displays immutable chronological events. Differentiates effective vs. recorded timestamps. | Rendered in event timeline stream. Clicking `targetRef` resolves entity context via appropriate DR route. Continuation uses keyset `before` cursor for backward historical paging. |

---

## 3. Detail Read Catalogue (DR-01..17), Read Operations & NAV Transitions

The reviewed candidate defines **30 unique read operations** under 17 Detail Read (DR) capabilities, reusing or extending 3 existing candidate routes (version content, milestone readiness, events) and establishing 27 new candidate routes.

### 3.1 Mapping of 17 DR Capabilities & 30 Operations

```
DR-01: Matter Context & Shell           --> GET /api/v1/matters/{matterId}
DR-02: Workstream List & Grid Filter     --> GET /api/v1/matters/{matterId}/workstreams
DR-03: Milestone Readiness & List       --> GET /api/v1/milestones/{id}/readiness (extended) + GET /matters/{m}/milestones
DR-04: Requirement Detail & Context     --> GET /api/v1/requirements/{id}
DR-05: Action Detail & Context          --> GET /api/v1/actions/{id}
DR-06: Dependency Explanations & Nodes   --> GET /api/v1/nodes/{id}/dependencies + GET /matters/{m}/blockers
DR-07: Evidence Requirement Detail      --> GET /api/v1/evidence-requirements/{id} + GET /matters/{m}/evidence-requirements
DR-08: Evidence & Inline Claims         --> GET /api/v1/evidence/{id}
DR-09: Claim Verification Assessments   --> GET /api/v1/evidence-claims/{id}/assessments
DR-10: Document Metadata & Versions     --> GET /api/v1/documents/{id} + GET /documents/{id}/versions + GET /matters/{m}/documents
DR-11: Version Detail & Content Download--> GET /api/v1/document-versions/{id} + GET /document-versions/{id}/content
DR-12: Regulatory Filing & Cycles       --> GET /api/v1/filings/{id} + GET /filings/{id}/cycles + GET /matters/{m}/filings
DR-13: External Parties Collection      --> GET /api/v1/matters/{matterId}/external-parties
DR-14: Decisions Detail & Collection    --> GET /api/v1/decisions/{id} + GET /matters/{m}/decisions
DR-15: Event History Keyset Paging      --> GET /api/v1/matters/{matterId}/events?after=|before=&limit=&targetId=
DR-16: Waits Detail & Collection        --> GET /api/v1/waits/{id} + GET /matters/{m}/waits
DR-17: Findings & Risks Context         --> GET /findings/{id} + GET /risks/{id} + collections
```

### 3.2 Evaluation of the 4 Replaced Detail Routes & Pagination Resolution Gaps

Claude's review rejected 4 proposed individual entity detail routes on YAGNI and redundancy grounds. We evaluated whether a clicked typed reference `{kind, id}` can **always** be safely resolved across paginated collections:

```
+---------------------------------------------------------------------------------------------------------+
| REPLACED ROUTE EVALUATION & MATERIAL GAPS                                                               |
+---------------------------------------------------------------------------------------------------------+
| DR-02: /workstreams/{id} rejected  --> List /workstreams + Grid filter. Small list (<=200). Safe.      |
| DR-03: /milestones/{id} rejected    --> Extended /milestones/{id}/readiness point lookup. Safe.         |
| DR-08: /evidence/{id}/claims rej.  --> Claims inline in /evidence/{id}. GAP on orphan claimRef.        |
| DR-13: /external-parties/{id} rej. --> List /external-parties (paginated). MATERIAL GAP on party lookup.|
+---------------------------------------------------------------------------------------------------------+
```

#### Gap 1 (Material): `EXTERNAL_PARTY` Ref Resolution Across Paginated Collection (DR-13)
- **Observed Contract**: Proposed `GET /external-parties/{id}` was rejected. The candidate operations define only `GET /api/v1/matters/{matterId}/external-parties` (keyset paginated: `after`, `limit <= 200`) and `GET /api/v1/matters/{matterId}/waits?partyId={id}`.
- **Frontend Failure Mode**:
  When a user views a wait card or filing record that references an external party (e.g. `{kind: "EXTERNAL_PARTY", id: "ep-999"}`), the UI needs to display the party's legal label, contact details, and `inactive` flag in an inspector drawer. If the Matter contains $> 200$ external parties (common in multi-lender syndicates, cross-border corporate transactions with dozens of subsidiaries, regulatory bodies, and counsel), `ep-999` may reside on page 3 or 4.
  Because `GET /matters/{m}/external-parties` has **no `id` query filter parameter**, the client would be forced to execute sequential $O(N)$ cursor fetches (`after=...`) across pages just to locate one party. If the user closes and clicks another party, this thrashing repeats.
- **Smallest Concrete Question for Claude**:
  > *"For DR-13, when resolving a clicked `EXTERNAL_PARTY` reference `{kind: 'EXTERNAL_PARTY', id}` across a paginated collection, should `GET /api/v1/matters/{matterId}/external-parties` support an `id` query filter (`?id={id}`) returning a 1-item page, or should a point-lookup route `GET /api/v1/external-parties/{id}` be reinstated to avoid client-side sequential cursor traversal?"*

#### Gap 2 (Material): Orphan `EVIDENCE_CLAIM` Reference Resolution (DR-08)
- **Observed Contract**: Proposed `GET /evidence/{id}/claims` was rejected; claims are provided inline inside `GET /api/v1/evidence/{id}` as `claims[]`. The catalogue provides `GET /api/v1/evidence-claims/{id}/assessments` (DR-09).
- **Frontend Failure Mode**:
  `EVIDENCE_CLAIM` is an explicit member of the 25 typed reference kinds. If an audit event (`recentChanges`), dispute record, or assessment history cites `{kind: "EVIDENCE_CLAIM", id: "claim-456"}` without including the parent `evidenceId`, the frontend cannot resolve the claim's status, componentKey, or criterion revision. `GET /api/v1/evidence/{id}` requires an `evidenceId`, not a `claimId`, and `GET /api/v1/evidence-claims/{id}/assessments` returns assessment records, not the claim entity itself.
- **Smallest Concrete Question for Claude**:
  > *"Does every reference of kind `EVIDENCE_CLAIM` contractually guarantee the presence of its parent `evidenceRef`, or does `GET /api/v1/evidence-claims/{id}/assessments` return the parent claim definition inline to prevent unresolvable orphan claim references?"*

#### Gap 3 (Low / Clarification): Workstream Collection Boundedness (DR-02)
- **Observed Contract**: Proposed `GET /workstreams/{id}` was rejected in favor of `GET /matters/{m}/workstreams` and `GET /matters/{m}/grid?workstreamId={id}`.
- **Feasibility Assessment**:
  Navigating from a workstream chip to the filtered Grid works cleanly. However, to display the human-readable label of `{kind: "WORKSTREAM", id: "ws-02"}` when encountered in a blocker card, the client must lookup the workstream by ID. In corporate legal transactions, workstreams rarely exceed 15-20 records.
- **Smallest Concrete Question for Claude**:
  > *"Is `GET /api/v1/matters/{matterId}/workstreams` contractually guaranteed to be bounded ($\le 200$ items) and unpaginated per Matter so clients can safely cache all workstream labels in a single read?"*

#### DR-03 (Milestones): Safe via Point Lookup Extension
- Milestone detail is safely resolved: `GET /api/v1/milestones/{id}/readiness` directly accepts `{id}` in its path and was extended by Claude to include `label`, `dueAt`, `critical`, and readiness details. This avoids collection pagination entirely.

### 3.3 Navigation Transitions (NAV-01..10) Mapping

| Nav ID | Origin View / Element | Target View & Inspector | Candidate Route | Context & Focus Preservation Contract |
|---|---|---|---|---|
| **NAV-01** | Control Room Blocker Card | Requirement Detail Drawer | DR-04 (`GET /requirements/{id}`) | Compares `sourceRevision` with overview; renders "Changed since overview" badge if newer. Preserves origin scroll and filter context. Restores trigger focus or labeled table fallback on close. |
| **NAV-02** | Requirement Detail Drawer | Evidence Requirement View | DR-07 (`GET /evidence-requirements/{id}`) | Uses `criterionRevisionRef` from gap. Gaps carry no fabricated evidence ref. Retains parent drawer in history stack. |
| **NAV-03** | Evidence Requirement View | Actual Evidence Record | DR-08 (`GET /evidence/{id}`) | Follows actual `evidenceRef` or inline `claimRef`. Missing proof stays an explicit gap without navigation. |
| **NAV-04** | Actual Evidence Record | Verification History Sheet | DR-09 (`GET /evidence-claims/{id}/assessments`) | Opens assessment timeline for selected claim. Shows verifier identity, timestamps, verdicts, and audit rationale. |
| **NAV-05** | Operational Grid Row (Requirement) | Contextual Inspector | DR-04 (`GET /requirements/{id}`) | Retains grid selection, pagination, sort, and scroll position. Inline edits and drafts remain untouched. |
| **NAV-06** | Operational Grid Row (Action) | Contextual Inspector | DR-05 (`GET /actions/{id}`) | Opens Action detail; retains grid state. Closing restores focus to active row cell. |
| **NAV-07** | Filing Lifecycle Stage | Document Version View | DR-11 (`GET /document-versions/{id}`) | **Always follows `submittedVersionRefs` from the cycle**, NEVER `document.currentVersion`. Prevents version confusion. |
| **NAV-08** | Filing Lifecycle Stage | Waiting On Context Sheet | DR-12 / DR-16 (`GET /filings/{id}/cycles` $\to$ `GET /waits/{id}`) | Navigates to authority review wait condition with external agency party context. |
| **NAV-09** | Blocker Card / Inspector | Dependency Explanation View | DR-06 (`GET /nodes/{id}/dependencies`) | Follows `edgeRef` or `failingGates.downstreamRef`. Renders root cause and transitive blocker exposure graph. |
| **NAV-10** | Recent Changes Stream / Decisions Queue | Event Context / Decision Sheet | DR-14 (`GET /decisions/{id}`) or DR-15 (`GET /matters/{m}/events?targetId=`) | Opens decision question or highlights historical audit event with before/after delta values. |

---

## 4. Review §7 Constraints Mapped to Components, State & Acceptance Hooks

We mapped all 10 architectural constraints from §7 of `targeted-claude-review.md` directly into frontend implementation obligations, starter component adaptations, and verifiable acceptance hooks:

| Review §7 Constraint | Frontend State & Consumer Behavior | Component Reuse or Adaptation Obligation | Acceptance Hook & Assertion |
|---|---|---|---|
| **1. Section-by-Section Handling** | A 200 response from `/control-room` is not treated as "all fresh". Each section checks `availability`. `UNAVAILABLE + null` renders an error container, never 0 or READY. `condition.completeness = INCOMPLETE` rendered explicitly; exception counts with `null` display "Unknown". | Adapt [`Alert`](file:///tmp/mattercontrol-step02-frontend/src/components/molecules/alert.tsx#L1-L43) and [`Skeleton`](file:///tmp/mattercontrol-step02-frontend/src/components/atoms/skeleton.tsx#L1-L10). Create `SectionErrorBoundary`. | **HOOK-CR-01**: Inject `availability: UNAVAILABLE` into `blockers`. Assert: Blocker count shows "Unknown", Condition shows `INCOMPLETE`, zero blockers is NOT displayed. |
| **2. Blockers are Causes** | Blocker cards render unsatisfied upstream causes, displaying their own WAITING/READY axes and `rootCause` flag prominently. Blocked targets are navigated via DR-06. | Adapt [`Card`](file:///tmp/mattercontrol-step02-frontend/src/components/atoms/card.tsx#L1-L30) into `BlockerNodeCard`. Highlight `rootCause: true` with prominent indicator. | **HOOK-CR-02**: Load Atlas T0 fixture. Assert: RQ-04 (WAITING · READY, failing DEP-01) renders as the top root cause blocker card. |
| **3. Client-Owned STALE** | `STALE` is never expected from the server. When background refetch fails, the client retains the prior authorized response, tags the view `STALE`, and displays its original `asOf` timestamp. | Adapt [`PageHeader`](file:///tmp/mattercontrol-step02-frontend/src/components/molecules/page-header.tsx#L1-L23) to show a persistent `StaleIndicator` badge alongside the as-of time. | **HOOK-CR-03**: Simulate failed periodic poll. Assert: Stale banner appears with original `asOf`; data is retained; view is not cleared or marked error. |
| **4. Continuation Boundaries** | A continuation page or detail read carries its own `sourceRevision`. If newer than overview, render a "Changed since overview" banner. Never silently merge into the initial snapshot. | Create `SnapshotBoundaryNotice` molecule in drawers. | **HOOK-CR-04**: Open detail drawer with `sourceRevision > overview.sourceRevision`. Assert: "Changed since overview" notice renders; parent overview unchanged. |
| **5. No Client-Side Legal Truth** | The client never computes readiness percentages, milestone gates, eligibility, or exception aggregates. All state is displayed verbatim from server payloads. | Replace any client-calculated badges with pure server state projection. | **HOOK-CR-05**: Audit codebase for client-side state machine derivations. Assert: Zero client status transition logic; all display derives from server axes. |
| **6. Exact Ref Typing & Lineage** | Ref resolution strictly follows kind enum. Never substitute `document.currentVersion` for `submittedVersionRef` or `assessedDocumentVersionRef`. Gaps without evidence stay gaps. | Typed routing helper `resolveRefUrl(ref)` mapping 25 kinds to exact DR routes. | **HOOK-CR-06**: In Filing Detail, click document link for FIL-02 cycle. Assert: Navigates to DOC-03 v2 (submitted version), NOT DOC-03 v3 (current draft). |
| **7. Uniform Not-Found & Revocation** | Every HTTP 404 renders an identical generic "Not Available" screen with no leaked title or count. On 404 after membership revocation, purge all cached matter detail. | Adapt [`EmptyState`](file:///tmp/mattercontrol-step02-frontend/src/components/molecules/empty-state.tsx#L1-L43) into `UniformNotFoundState`. Clear client query cache on 404. | **HOOK-CR-07**: Revoke user membership and request matter route. Assert: Uniform 404 rendered; all previous matter memory/cache is purged. |
| **8. Opaque Cursors & Totals** | Cursors are opaque strings: client never inspects or constructs them. Display `total` only when present in the response envelope; otherwise render "—". | Adapt [`Pagination`](file:///tmp/mattercontrol-step02-frontend/src/components/molecules/pagination.tsx#L1-L100) to support cursor-based `nextCursor` / `prevCursor` without page math. | **HOOK-CR-08**: Inspect collection requests. Assert: `after` query param uses verbatim server cursor string; total count omitted if server returns `null`. |
| **9. Advisory Actionability** | `permittedActions` is an advisory hint. When missing or unknown, the action is treated as unknown: offered safely, with server error handling. `viewerRole` drives affordance visibility only. | Adapt [`Button`](file:///tmp/mattercontrol-step02-frontend/src/components/atoms/button.tsx#L1-L58) to handle unknown permission states gracefully. | **HOOK-CR-09**: Render action card with `permittedActions: undefined` for VIEWER. Assert: Action button disabled with "Read-only access" tooltip; no grant inferred. |
| **10. Request Mechanics** | Never send `If-Match` on GET requests. Maintain transport abstraction seam (`backendRequest`). Record `X-Request-ID` response header for diagnostic display without logging payloads. | Inspect [`http-client.ts`](file:///tmp/mattercontrol-step02-frontend/src/lib/api/http-client.ts) and [`backend.ts`](file:///tmp/mattercontrol-step02-frontend/src/lib/api/backend.ts). | **HOOK-CR-10**: Inspect outgoing network request headers. Assert: No `If-Match` header on any GET; `X-Request-ID` captured and available for diagnostics. |

---

## 5. Comprehensive State Reconciliation Matrix

The client must handle all combination states without visual glitches, misleading legal summaries, or context loss:

| State | Server Response Condition | Client Presentation | Interaction / Recovery Behavior |
|---|---|---|---|
| **INITIAL_LOADING** | Snapshot request in flight (`GET /control-room`). | Skeleton placeholders matching 2-column layout (Blocker chain spans top; Next Actions & Decisions side-by-side). | Navigation controls disabled; structure preserved to prevent layout shifts. |
| **FULL_SUCCESS** | 200 OK; all 8 sections have `availability: AVAILABLE`. | Render complete Control Room with single `asOf` and `sourceRevision`. | All cards interactive; filter and search bars active. |
| **PARTIAL_SUCCESS** | 200 OK; 1 to 7 sections `AVAILABLE`, remaining `UNAVAILABLE`. | Available sections render normally. Unavailable sections render an `Alert` warning with `unavailableReason`. | `condition.completeness` displays `INCOMPLETE`. Exception counts from failed sections show "Unknown". Retry button triggers scoped section refetch. |
| **TRUE_EMPTY** | Section returns `availability: AVAILABLE, items: [], total: 0`. | Honest empty state with contextual explanation (e.g. "Zero active blockers"). | Next Actions displays `excluded[]` reasons explaining why no eligible actions exist. |
| **FULL_FAILURE** | 503 `/problems/unavailable` (snapshot failed to open). | Page-level error screen: "Matter state temporarily unavailable". | Offers manual retry button with backoff; does not display zero blockers or empty data. |
| **CLIENT_STALE** | Background poll fails after a prior successful snapshot. | Retains existing UI; overlays persistent banner: "Viewing data as of [original asOf] (Connection lost)". | User can continue browsing cached snapshot; manual refresh attempt offered. |
| **REVOKED_ACCESS** | 404 `/problems/not-found` returned on any subsequent read. | Generic "Not Available" screen. No matter title, ID, or counts displayed. | Client clears all cached data, local storage, and history for that matter immediately. |
| **DETAIL_DRIFT** | Detail read returns `sourceRevision > overview.sourceRevision`. | Detail drawer displays warning: "Record updated since Control Room was loaded". | Renders current detail; provides button to refresh the underlying Control Room snapshot. |

---

## 6. Architecture Dependencies (A-01..16) & Open Technical Questions (TQs)

### 6.1 Status of Architecture Dependencies for Read Consumption

All architecture documents remain **candidate inputs**. Dependencies A-01..A-15 are `MECHANISM_PENDING_ARCHITECTURE_ACCEPTANCE`. Dependency A-16 is updated based on our starter inspection:

```
+----------------------------------------------------------------------------------------------------+
| ARCHITECTURE DEPENDENCY SEAMS (A-01..A-16)                                                         |
+----------------------------------------------------------------------------------------------------+
| A-01 (Authentication)         : PENDING (requires real session resolution; demo mode bypasses)    |
| A-02 (Authorization RBAC)     : PENDING (VIEWER read-only enforced client-side via viewerRole)      |
| A-03 (API Contracts)          : REVIEWED CANDIDATE DOCUMENT ONLY (TQ-02/08/06 accepted by Claude) |
| A-04 (Pagination & Bounds)    : REVIEWED CANDIDATE (opaque cursors, default order per collection)  |
| A-05 (Backend Validation)     : PENDING (validation problem formats and field error schemas)       |
| A-06 (Concurrency & Revisions): REVIEWED CANDIDATE (sourceRevision comparison; If-Match on mutations|
| A-07 (Optimistic Updates)     : PENDING (forbidden on proof/gate evaluations)                      |
| A-08 (Error Taxonomy)         : REVIEWED CANDIDATE (uniform 404, 401, 422, 503 shapes specified)   |
| A-09 (Durable Persistence)    : PENDING (backend event store durability)                          |
| A-10 (Realtime Sync)          : PENDING (no websocket/SSE selected; client-owned STALE fallback)  |
| A-11 (Evidence Storage)       : PENDING (TB-05 object store provider unselected)                   |
| A-12 (Verification Aggregates): REVIEWED CANDIDATE (read-only derived aggregates, no self-review)  |
| A-13 (Bulk Transaction)       : PENDING (RULE-013 atomic per-record mutation contract)             |
| A-14 (Import Parsing)         : PENDING (K-2 pre-confirm preview contract)                         |
| A-15 (Export & Reporting)     : PENDING (formula-safe Excel export and status brief draft)         |
| A-16 (Frontend Reference)     : INSPECTED & RECONCILED (Starter requires OperationalGrid organism) |
+----------------------------------------------------------------------------------------------------+
```

### 6.2 Status of Technical Questions (TQ-01..08)

| TQ ID | Question Topic | Current Governance Status | Frontend Reconciliation Impact |
|---|---|---|---|
| **TQ-02** | Control Room response shape & partial 200 | **RESOLVED_AS_REVIEWED_CANDIDATE_DOCUMENT_ONLY** | Section-by-section envelope (`availability`, `items`, `total`, `nextCursor`) and `condition.completeness` fully reconciled. |
| **TQ-08** | Detail-read catalogue & replaced routes | **RESOLVED_AS_REVIEWED_CANDIDATE_DOCUMENT_ONLY** | 17 DR capabilities and 30 operations mapped; 3 material pagination/ref gaps flagged for Claude. |
| **TQ-06** | Wait duration and opened instant | **RESOLVED_AS_REVIEWED_CANDIDATE_DOCUMENT_ONLY** | `openedAt` and `openedEventSeq` added to wait cards. Frontend calculates elapsed wait from system-recorded instant. |
| **TQ-01** | Dry-run / preview read endpoint | **OPEN** (Claude / Codex) | Bulk and import wizards remain pre-confirm client drafts; no dedicated dry-run read route. |
| **TQ-03** | Per-claim verifier eligibility | **OPEN** (Claude) | Frontend checks `viewerRole` and designated non-submitter rule client-side; cannot display fine-grained verifier badges. |
| **TQ-04** | Error problem taxonomy & retry conventions | **OPEN** (Claude $\to$ PO) | 503 `/problems/unavailable` handled with generic exponential backoff; no custom retry headers. |
| **TQ-05** | Event history time-window mapping | **OPEN** (Claude) | `recentChanges` uses sequence pagination (`before={seq}`); relative time window queries remain open. |
| **TQ-07** | Numeric workload caps & retention | **OPEN** (PO) | Frontend enforces inherited candidate limit of $\le 200$ items per page; no new limits invented. |

---

## 7. Confirmed Source Observations vs. Hypotheses

| Area | Confirmed Source Observation (Verified by Code Read) | Unverified Hypothesis (Requires Runtime / Independent QA) |
|---|---|---|
| **`DataTable`** | Confirmed presentational `<table>` only ([`data-table.tsx#L28-L68`](file:///tmp/mattercontrol-step02-frontend/src/components/organisms/data-table.tsx#L28-L68)). Contains zero keyboard handling, row selection, or density adaptation. | Hypothesis: Building an `OperationalGrid` with 200 rows in React 19 will maintain 60fps scrolling without virtualizer libraries. |
| **`Dialog`** | Confirmed unmounts `{children}` on `open === false` ([`dialog.tsx#L82`](file:///tmp/mattercontrol-step02-frontend/src/components/molecules/dialog.tsx#L82)), dropping uncommitted form state. Focus returns only to opener. | Hypothesis: Externalizing form state to an outer store will fully eliminate accidental draft loss on backdrop clicks. |
| **`MobileNav`** | Confirmed navigation drawer only ([`mobile-nav.tsx#L15-L39`](file:///tmp/mattercontrol-step02-frontend/src/components/organisms/mobile-nav.tsx#L15-L39)); trigger button is 36px, failing 44px touch target rule. | Hypothesis: Single-column mobile card layouts with 44px controls will satisfy mobile usability without horizontal clipping. |
| **Auth Provider** | Confirmed fail-closed in REST mode ([`auth-provider.ts#L27-L35`](file:///tmp/mattercontrol-step02-frontend/src/lib/auth-provider.ts#L27-L35)); demo mode defaults to `{ userId: 'demo', permissions: ['*'] }`. | Hypothesis: Real IdP integration (OIDC/JWT) will transparently forward tokens via `backendRequest()` without session leaks. |
| **Design Tokens** | Confirmed starter uses generic OKLCH palette ([`globals.css#L11-L66`](file:///tmp/mattercontrol-step02-frontend/src/app/globals.css#L11-L66)); lacks `--mc-*` semantic state variables. | Hypothesis: Mapping `--mc-*` variables into Tailwind v4 `@theme inline` will satisfy WCAG AA computed contrast under real rendering. |

---

## 8. Candidate Tests (CT-01..22) & OpenCode Testability Evaluation

All 22 Candidate Test rows (CT-01..22) are maintained as **`NOT_RUN`**. We evaluated the 8 testability questions formulated by Claude Code from a frontend consumer consumption perspective:

```
+----------------------------------------------------------------------------------------------------+
| 8 OPENCODE TESTABILITY QUESTIONS (CONSUMER EVALUATION)                                             |
+----------------------------------------------------------------------------------------------------+
| Q1 (Uniform 404 byte-identity)   : VERIFIED TESTABLE (client handles identical 404 for missing/revoked)|
| Q2 (Fault-injected partial 200)   : VERIFIED TESTABLE (client renders INCOMPLETE and null counts)   |
| Q3 (Single sourceRevision drift)  : VERIFIED TESTABLE (client detects newer revision in continuation) |
| Q4 (Keyset cursor security/bounds): VERIFIED TESTABLE (client passes opaque cursors verbatim)      |
| Q5 (Filing submitted version ref) : VERIFIED TESTABLE (client follows submittedVersionRef strictly) |
| Q6 (Atlas T0 empty nextActions)   : VERIFIED TESTABLE (client renders excluded[] reasons & RQ-04)   |
| Q7 (Read side-effect privacy)     : VERIFIED TESTABLE (client expects zero audit mutations on GET) |
| Q8 (Kind-mismatched ID 404)       : VERIFIED TESTABLE (client handles 404 without crashing)        |
+----------------------------------------------------------------------------------------------------+
```

1. **Uniform 404 Byte-Identity (Q1)**: Fully testable. Frontend consumer renders identical `UniformNotFoundState` on 404 across both non-existent matters and unauthorized matters, ensuring zero information leakage.
2. **Partial 200 Fault Injection (Q2)**: Fully testable. When backend injects failure into one section, consumer renders the section error container while other sections remain interactive; `condition.completeness` displays `INCOMPLETE`.
3. **Single Revision & Continuation Drift (Q3)**: Fully testable. Consumer compares `meta.sourceRevision` across views; when a detail read returns a newer revision, a "Changed since overview" notification renders.
4. **Keyset Cursor Security & Reachability (Q4)**: Fully testable. Consumer passes cursor strings as opaque parameters without parsing; validates that pagination can traverse all matching records.
5. **Filing Submitted Version Ref (Q5)**: Fully testable. Consumer navigates to the exact `submittedVersionRef` linked in the filing cycle, proving it does not default to the document's `currentVersion`.
6. **Atlas T0 Exclusion Rendering (Q6)**: Fully testable. Consumer renders the empty Next Actions queue with explicit excluded reasons (`WAITING`, `BLOCKED`, `UNASSIGNED`) and surfaces RQ-04 as the top root cause blocker.
7. **Read Side-Effect Freedom (Q7)**: Fully testable. Inspecting event sequence counters before and after read operations confirms that read consumption creates zero domain events.
8. **Kind-Mismatched ID 404 (Q8)**: Fully testable. Passing an Action ID to a Requirement route returns 404, which the client handles gracefully via its standard not-found component.

---

## 9. Scoped Feasibility Verdict & Next Steps

### 9.1 Feasibility Verdict
**`FEASIBLE_WITH_CANDIDATE_READ_CONTRACT_SUBJECT_TO_PAGINATION_CLARIFICATIONS`** (Document-Level Feasibility Only).

The candidate read contract reviewed by Claude Code (`reviewed-read-contract.json`) provides a coherent, robust, and semantically sound projection for the Matter Control Room and detail inspection. It respects all core domain invariants (Requirement $\neq$ Action, Criterion $\neq$ Evidence, COMPLETED $\neq$ VERIFIED, WAITING $\neq$ BLOCKED, five independent state axes, and single-snapshot boundaries).

Subject to clarifying the 3 pagination resolution questions for Claude Code (specifically `EXTERNAL_PARTY` lookup in DR-13 and orphan `EVIDENCE_CLAIM` lookup in DR-08), the frontend architecture is fully capable of consuming these candidate contracts.

### 9.2 Explicit Governance Boundary
- This feasibility verdict does **NOT** constitute Product Owner architecture approval.
- It does **NOT** claim runtime pass, browser rendering pass, security validation, or independent QA acceptance.
- MC-003A remains **`REWORK_REQUIRED`** at the overall gate.
- Production UI and API implementation remain **`NOT_AUTHORIZED`**.

### 9.3 Next Concrete Steps
1. **Codex Orchestration**: Ingest this reconciliation report into the MC-003A governance record.
2. **Claude Code Contract Clarification**: Submit the 3 targeted pagination questions (DR-13, DR-08, DR-02) to Claude Code for architectural clarification.
3. **OpenCode Testability Handoff**: Forward CT-01..22 and the 8 testability questions to OpenCode when independent verification execution is authorized.
