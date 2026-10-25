# MC-003A.6 — actual Claude return and Codex intake

Owner Local Codex orchestration. Priority P0. Status IN_REVIEW; base6530858. Actual Claude human-invoked manual return received: four requested files exist, preserved unchanged. [Reviewer report](claude-review.md), [compatibility matrix](architecture-compatibility-matrix.json), [API/Auth dependencies](api-auth-dependency-matrix.md), [Antigravity constraints](antigravity-implementation-constraints.md). [Exact returned summary](claude-return-summary.txt), [hashes/checks/intake dispositions](review-intake.json).

## Accepted scope and evidence

Record the actual reviewer verdict **ARCHITECTURE_COMPATIBLE_WITH_CONSTRAINTS_DOCUMENT_ONLY** as a scoped architecture-owner return. No broader approval inferred. Reviewer reports actual Claude2.1.310/claude-opus-5-5 interactive, compared with prior CLI2.1.309probe. Actual service routing/effective model/session/charge trace is not supplied. This is human-returned owner evidence, not a new Codex model invocation.

44Codex intake assertions PASS: four actual output hashes match reported prefixes;41manifest inputs and7Step02Gitblob snapshots unchanged;20uniqueFR with11matrix fields and ACsets retained;16Arows,5architecture-dependent roots,12cross-cutting rows and8TQs present; r3output20/QA85hashes preserved; both reference checkouts still clean/pinned; returned links resolve. These are intake checks, not another architecture/runtime suite. FRcounts:16COMPATIBLE_WITH_CONSTRAINTS,1COMPATIBLE(FR003),2CANDIDATE_NOT_YET_APPROVED(FR012/018),1UNKNOWN/NEEDS_EVIDENCE(FR009).

Claude's self-review disclosure is retained: the reviewer authored the candidate architecture. This return cannot independently approve it or satisfy G4. Coverage is substantial document/partial source only; listed unread inputs remain unread by Claude. In particular, full Atlas and fullHTML/backend behavior are not validated by this verdict. No build/server/browser/runtime/security behavior was tested. No need to repeat the whole review merely because its documented scope is limited.

## Binding UX correction K-2

Under the existing PO UX delegation, **Import Draft / structured draft means the pre-confirm mapping/validation preview**. It is not a new persisted Requirement/Action state and does not change any execution/verification vocabulary. Preview performs no domain-record mutation. Confirmation creates only approved typed records under approved validation, scope, permission and history rules. Internal preview storage/lifetime is a technical dependency, not selected here. This supplements frozen r3§4.6/§5.12/I-10 and controlled-handoff; frozen sources remain intact. K-2 is author-contract clarified, not a formal independent CLOSED finding. No product source is implemented.

## Intake interpretation notes — approved inputs prevail

- **CI-01:** FR001 recommended_action says no “mark Requirement done” control. Read narrowly: Action completion must never implicitly complete/verify its Requirement. Approved state-semantics allows explicit guarded Requirement execution transitions by authorized actors; do not remove them. No legal policy change is authorized.
- **CI-02:** reviewer§5 shorthand “client must always send If-Match” must use its own C-REV-1/API matrix rule: candidateCASnamedtarget requires it; scope-none rejects it. Neither this review nor nativeINTA412 approves product412/200.
- **CI-03:** keep proposed implementation details conditional. Known pre-dispatch rejection is not automatically an unknown server-write outcome; unknown dispatched mutations require the then-approved reconciliation/idempotency contract. Business partial failure and transport success remain separate without mandating a wrapper field/API. Row-props names and eligibility presentation are proposals, not installed component contracts.

These notes reconcile overbroad shorthand with approved policy and the review's more precise clauses. They do not rewrite Claude's output or sign an architecture choice on his behalf. If the owner disputes an interpretation, request only a targeted addendum; no automatic new full review or closedStep02.3round.

## Contract disposition and tracked technical questions

INT-A412T10 is approved transport scope only. Product412 and bulk200per-row are compatible candidate proposals, not approved product API. INT-A has no bulk route. refId/value/16KiB wording remains closed harness-only clarification. Exact statuses/assumptions remain in the returned API/Auth matrix.

| Question | Owner | Affected next slice |
|---|---|---|
| TQ-01 — Reopen/promote impact before confirm (r3 I-11; permission-matrix "impact summary") | Claude (contract), Codex/OpenDesign (copy) | Reopen/promote slice UX copy only |
| TQ-02 — `GET /control-room` response shape and per-region availability | Claude, ZCode | Control Room integration |
| TQ-03 — Client hint for verify eligibility and role-aware affordances | Claude | Evidence review UX polish (server 403 remains authoritative) |
| TQ-04 — Product error/retry conventions (retryAfter, Retry-After, command 503 as unknown) | Claude → PO | Unavailable/unknown UX copy |
| TQ-05 — "Changes since T-1 09:00" with seq-keyed events | Claude | I-08 only |
| TQ-06 — Waiting-since / aging field naming | Claude | I-07 aging display |
| TQ-07 — Bulk preview expiry and import size/row limits | PO (values), Claude | Bulk/import UX timers and messages |
| TQ-08 — Detail read routes are not enumerated in candidate §2. Its only GETs are control-room, grid, me/actions, next-actions, milestone readiness, version content, imports/{id}, exports content, events and operations. Missing: node detail, dependency edges/graph (Dependency View, impact rail), evidence/claims/assessments, document version ledger, filing cycles/submissions, waits, external parties and milestone list | Claude, ZCode | Integration of drawers/tabs for FR-001/004/005/006/007/015/016/017; writes and aggregate reads unaffected |

All eight are OPEN technical questions in the local design-to-architecture intake registry. Nothing was assigned by messaging another agent/worktree. No ADR was requested/proposed by Claude; create none solely for these contract details. Priority for the first ControlRoom/detail integration is TQ02response shape and TQ08detail-read catalogue; auth and then-approved contracts remain prerequisites. TQ07values remain legitimately PO-owned when that slice is ready, not a routine UX question now.

## Current gate decision and next action

G1delegated choices preserved. G2author scope preserved plus K-2clarification. **G5now has an actual document-compatibility return with constraints**; its earlier WAITING_MANUAL_DISPATCH record is historical, but per-slice API/Auth/TQ and overall PO Architecture Approval Gate remain OPEN. G3rendered BLOCKED_BY_TOOLING/NOT_TESTED; G4independentQA PENDING; G6formalclosurePENDING. MC-003A remains REWORK_REQUIRED at the overall gate, STEP03B/product implementation NOT_AUTHORIZED. Do not collapse this scoped G5achievement into a runtime/security/design completion.

Concrete progression: carry K-2/CI01..03 into the next Antigravity intake; resolve TQ02/08with actual Claude/ZCode before that integration slice, under existing architecture authority/approval boundaries. Use the returned constraints and20FRmatrix rather than redispatching a full review. Codex retains the existing QA packet and render plan until a legitimate authorized access/target event. No provider retry, model/service transfer, auth change, Step02mutation, PO screenshot or product implementation in this intake.

Requirements FR001..020/REQ-MC-P0-01..20, all3GW and D-UX01..04. Reviewer return accepted only at its stated level; formal independent acceptance remains required. Completion evidence is review-intake.json and the four immutable originals. Skipped: browser/native/runtime/security checks, backend source review and external QA. Remaining risk: real auth absent, contract/read-shape gaps, unknown-outcome/bulk adaptation and unmeasured visual/native behavior.
