# Owner addenda — compact render, content evidence only

Decorative box borders/padding removed; table cell text retained. R1 original SHA256 7945caae8f73c3f465b9ddbb7f7e7bbb223c78481755bd65787365164526eb86. R2 original SHA256 4a46667e332dccbdb2cd0818937b2af836a54c648e3cd37c855086001b22b0a6. No technical correction applied by this rendering.

## R1 F-01..F-10 before/after

F-01: DR-06 two independently paged collections

  Before (DR-06 required_data):

  ▎ "incoming[] {edgeRef, upstreamRef, gate, satisfied, failed[], revision} (all incoming; paged only past cap with nextCursor); downstream[] transitive reachable refs ordered by distance then id, keyset paged."

  RC-6:

  ▎ "Cursors are opaque, … bound to actor/matter/collection/filter/sort; mismatch -> 422 without detail"

  After (replaces the DR-06 required_data node part; the blockers part is unchanged):
  GET /api/v1/nodes/{id}/dependencies[?side=incoming|downstream][&after=<cursor>][&limit=n]

  No side  → { asOf, sourceRevision, historyMaterializedThrough,
               incoming:   { items:[{edgeRef, upstreamRef, gate, satisfied, failed[], revision}], total, nextCursor },
               downstream: { items:[{ref, distance}], total, nextCursor } }
  side=X   → same metadata + only member X; the other member is ABSENT (not requested; never null, never [])
  - D1: With no side, both first pages come from one snapshot, and limit applies to each side independently (≤200, RC-7). Sending after without side returns 422.
  - D2, order:
    - Incoming is ordered by upstreamRef.id asc, then edgeRef.id asc.
    - Downstream is ordered by distance asc, then ref.id asc. Distance is the shortest directed path length, and a direct dependent has distance 1. Each node appears once, at its minimum distance.
  - D3, cursor binding: under RC-6, the cursor's collection is (nodeId, side). A swapped-side cursor or another node's cursor returns 422, after authorization (RC-1).
  - D4, snapshots: each response is its own snapshot and never patches an earlier page.
    - "No omission and no duplicate" is guaranteed only while every page in a traversal carries the same sourceRevision.
    - If it changes, the client labels the result "changed since first page" and may restart without a cursor. Downstream distances can shift between snapshots.
  - D5: a non-null nextCursor means more rows exist. A partial downstream page never claims the full chain (base review_note retained).
  - D6: total is an in-Matter integer from that response's snapshot.

  Deviation from the Codex recommendation: I use side= plus the standard after/limit instead of incomingAfter/downstreamAfter/incomingLimit/downstreamLimit. This keeps RC-6/RC-7 parameter names unchanged, makes "advancing one side" trivially defined (the other side is not returned), and avoids cross-side state.

Item | Detail
Authority | Approved: FR-005 (causal failed gate list), FR-009, RULE-003 (AND gates), RULE-017; AC-105/122..125/146. Candidate: RC-6/RC-7, DR-06
Alternatives | Two routes expand the 32 operations, so a separate decision would be needed. One shared cursor cannot continue both sides. Codex's
 | dual-parameter naming is equivalent in power but adds four nonstandard parameters
Compatibility | Flat incoming[]/downstream[] consumers must read .items. Additive query parameter
ADR/PO | None. Snapshot and auth model unchanged
Owner | Claude (contract), ZCode (API), Antigravity (consumer), OpenCode (tests)

  Acceptance:
  - A1: On a synthetic node with 201 incoming edges and 201 downstream nodes, on a fixed snapshot, the union of the incoming pages is exactly 201 unique edges, and the downstream pages give 201 unique nodes.
  - A2: A side=downstream response has no incoming key.
  - A3: Each of these returns 422: an incoming cursor sent with side=downstream; node N's cursor used on node M; after without side; side=other.
  - A4: A revoked member with a valid cursor gets 404, not 422.
  - A5: If a mutation happens between pages, page 2 has a higher sourceRevision and no continuity is claimed.
  - A6: D2 order holds, including the minimum-distance dedup.

  Limitation: traversal cost on large graphs has not been measured.

  F-02: closed unavailableReason set

  Before (section_envelope):

  ▎ "{availability: AVAILABLE|UNAVAILABLE, items: [card] | null, total: int|null, nextCursor: string|null, unavailableReason: code|null}"

  READ-02:

  ▎ "503 /problems/unavailable when the snapshot cannot be opened or no section is available"

  After:
  - unavailableReason is the closed set {EVALUATION_FAILED}.
    - Trigger: the snapshot opened, but this section's own evaluation failed. That covers a query error, a statement timeout, an evaluator error, or an integrity failure such as an unresolvable ref (F-06).
    - No exception, SQL or provider text appears in the body; correlation is through X-Request-ID.
  - SNAPSHOT_UNAVAILABLE is omitted. Under READ-01, every section shares one snapshot, so a snapshot failure has no per-section case; it is root 503.
  - Envelope invariants:
    - AVAILABLE has unavailableReason=null, items as an array, total as an integer and nextCursor per the section.
    - UNAVAILABLE has items=null, total=null, nextCursor=null and unavailableReason="EVALUATION_FAILED".
  - READ-02 amendment (labelled): root 503 applies when the snapshot cannot be opened, or when none of the seven data sections is AVAILABLE. The seven are blockers, nextActions, waitingOn, milestones, evidenceGaps, decisions and recentChanges. The condition card alone never makes a 200.
  - Condition section:
    - If condition's own evaluation fails, condition itself is UNAVAILABLE with EVALUATION_FAILED.
    - If only contributing sections fail, condition stays AVAILABLE, INCOMPLETE, with null counts (F-08).
  - Consumer rule: any non-null reason renders as unavailable, never as empty. An unrecognized code renders the same way. That is defensive only: the set is closed for this contract version, and adding a code is a contract change.
  - Fault seam: a non-production, per-section fault injection seam is required to execute CT-14. This is a document requirement only; it is not proven at runtime. No retry cadence is set (TQ-04 stays open).

  Implementation note (unverified, for ZCode): in PostgreSQL, a failed statement normally aborts the enclosing transaction. Partial-200 inside one REPEATABLE READ snapshot therefore needs per-section isolation, for example savepoints, that keeps the snapshot. If that changes ADR-002 §1.6, a decision is needed. This is not resolved here.

Item | Detail
Authority | Approved: FR-009 ("do not display zero blockers from failure"), AC-109, AC-156. Candidate: READ-01/02, 503 problem
Alternatives | A finer taxonomy (timeout vs error) gives more detail but leaks implementation and needs mapping rules. SNAPSHOT_UNAVAILABLE would
 | contradict READ-01
Compatibility | Enum pinned. Consumers map one code
ADR/PO | None, unless section isolation changes ADR-002
Owner | Claude, ZCode, Antigravity, OpenCode

  Acceptance:
  - B1: A fault in one section gives that section UNAVAILABLE with null/null/null and EVALUATION_FAILED. The others stay AVAILABLE, the root is 200, condition is INCOMPLETE and that section's codes are null.
  - B2: Faults in all seven sections give root 503 /problems/unavailable.
  - B3: A snapshot-open fault gives 503.
  - B4: A genuine zero gives AVAILABLE, [], total=0, reason null.
  - B5: No raw error detail appears in the body.

  F-03: overlapping excluded[].reason

  Before (nextActions card):

  ▎ "section adds excluded:[{ref, reason: WAITING|BLOCKED|UNASSIGNED}]"

  nextActions rule:

  ▎ "excluded reasons always returned so an empty list explains itself (AtlasT0). Requirements never appear"

  After:
  - Membership: excluded contains every visible Action in the Matter that is non-terminal (NOT_STARTED, IN_PROGRESS or WAITING) and is not a RULE-021 candidate. Terminal Actions and Requirements never appear.
  - Conditions at asOf:
    - W: execution is WAITING.
    - B: dependency is BLOCKED.
    - U: there is no active assignee, meaning ownerRef is null or the assignee is not an active Matter member.
  - Rule: reason is the first true condition in the order WAITING, BLOCKED, UNASSIGNED.
    - It is display-only. It changes no axis, no readiness and no candidate rule.
    - WAITING comes first because RULE-021 routes WAITING to Waiting On, and the base waitingOn rule shows the subject's own dependency axes. So BLOCKED stays visible there.

W | B | U | Candidate? | reason
no | no | no | yes | (not excluded)
no | no | yes | no | UNASSIGNED
no | yes | no | no | BLOCKED
no | yes | yes | no | BLOCKED
yes | no | no | no | WAITING
yes | no | yes | no | WAITING
yes | yes | no | no | WAITING (the finding's AC-05 case)
yes | yes | yes | no | WAITING

Item | Detail
Authority | Approved: RULE-021, RULE-002 (WAITING≠BLOCKED), FR-003/010, AC-103, AC-144. Candidate: nextActions card
Alternatives | An ordered reasons[] array keeps every cause inline, but changes a field type that Antigravity already consumed. Recommend it only if
 | UX wants all causes inline. BLOCKED-first would hide the approved Waiting On routing
Compatibility | Scalar shape kept. Overlap behaviour becomes explicit
ADR/PO | None. This is display-only, not a policy change
Owner | Claude, ZCode, Antigravity, OpenCode. The CT-21 fixture is still Codex F-11

  Acceptance:
  - C1: All eight truth-table rows hold.
  - C2: A WAITING+BLOCKED Action is in excluded with reason WAITING, is not in items, and appears in waitingOn with subject dependency BLOCKED.
  - C3: With zero candidates, the section is AVAILABLE with items=[] and a non-empty excluded. No action is manufactured and readiness is unchanged.
  - C4: No Requirement or terminal Action appears in excluded.

  Limitations:
  - For BLOCKED+UNASSIGNED, excluded[] shows BLOCKED only.
  - The ordering and size bound of excluded[] are pre-existing gaps outside F-01..F-10, but CT-21 payload determinism needs an order. Codex should decide whether to raise them separately.

  F-04: Decisions null-due order

  Before (sections.decisions.order):

  ▎ "dueAt if recorded, then createdAt, then id"

  DR-14:

  ▎ "(default order dueAt, createdAt, id)"

  After (same text in both locations): "dueAt ascending, null dueAt last; then createdAt ascending (server-recorded); then id ascending." Keyset cursors use this exact tuple. The DR-14 default for open=true equals the section order.

Item | Detail
Authority | Approved: FR-009, AC-109. No approved Decision-specific rule exists; null-last follows the RULE-021 convention. Candidate ordering
Alternatives | Null-first is permitted by the approved rules but inconsistent with the surrounding sections
ADR/PO | None
Owner | Claude, ZCode, Antigravity

  Acceptance (D1 fixture):
  - X1 due T+1, createdAt c1, id 3.
  - X2 due T+1, createdAt c1, id 2.
  - X3 due T+1, createdAt c0, id 9.
  - X4 due T+2.
  - X5 no due, createdAt c0.
  - X6 no due, createdAt c1.

  The expected order is X3, X2, X1, X4, X5, X6. At the same sourceRevision, overview items equal the prefix of DR-14 page 1.

  F-05: malformed path identifiers

  Before:
  - CT-05: "Testable: malformed id 404/422 per route convention; other-kind id -> 404".
  - RC-1: "authentication (401) -> Matter membership resolved from path or resource (404 uniform) -> query/cursor validation (422) -> evaluation (503)".
  - RC-3: "foreign or other-kind ids return the same 404".
  - Candidate catalogue: "400 /problems/malformed — JSON/syntax/type errors".

  After (new RC-3a, reads only):
  1. An unauthenticated request gets 401, whatever the path contains.
  2. Any path identifier (matterId or resource id) that does not identify an existing, visible resource of the expected kind gets the byte-identical uniform 404 /problems/not-found. That includes:
     - a syntactically invalid id;
     - a well-formed but nonexistent id;
     - a foreign-Matter id;
     - an other-kind id;
     - a caller who is not an active member.

     Path identifiers on reads never produce 400 or 422.
  3. Query parameters and cursors return 422 /problems/validation, but only after step 2 succeeds.
     - A malformed id-valued filter (subjectId, targetId, partyId, workstreamId, …) gets 422.
     - A well-formed filter id that matches nothing visible gets a 200 empty page, with no existence signal.
  4. Evaluation failure returns 503.

  400 /problems/malformed stays for request-body syntax on commands. Commands are out of scope.

  Implementation note: if the framework validates path formats before the handler, ZCode must map that to the same 404 body, or bind the path parameter as a plain string. I make no claim about Huma's default.

Item | Detail
Authority | Approved: FR-018 (uniform inaccessible/not-found), RULE-017, AC-118/134/135/147, permission-matrix "externally indistinguishable".
 | Candidate: RC-1/3
Alternatives | Uniform 422 or 400 for path syntax is also non-leaking, since a malformed id can't exist, but it adds a per-route branch. I chose 404
 | as the single rule
ADR/PO | None. Check order unchanged
Owner | Claude, ZCode (binding), OpenCode

  Acceptance (identical across every resource-in-path read of the 32):
  - E1: Unauthenticated with a malformed path gets 401.
  - E2: Authenticated with a malformed, other-kind, foreign or nonexistent path gets a 404 with an identical body.
  - E3: A member sending an invalid limit or a bad cursor gets 422.
  - E4: A non-member sending an invalid query gets 404.
  - E5: A malformed filter id gets 422; an unmatched well-formed one gets 200 [].

  F-06: label nullability

  Before (delta):
  - DR-12 filing.authorityPartyLabel — "label of authorityPartyRef".
  - DR-04 requirement.workstreamLabel and DR-05 action.workstreamLabel — "label of workstreamRef".
  - waitingOn.items[].partyLabel — "null when the wait is on a condition, not a party".

  After (pairing rule P, applied to (partyRef, partyLabel) on waitingOn and DR-16, (authorityPartyRef, authorityPartyLabel) on DR-12, (workstreamRef, workstreamLabel) on DR-04/05, and on grid rows if they display a workstream):
  - Both keys are always present and never omitted.
  - ref = null ⇔ label = null. A non-null ref has a non-empty label from the same snapshot. That includes an inactive party, whose label is kept. Empty string is never used.
  - This contract does not decide whether a null ref is domain-permitted. It fixes the representation only where the domain allows absence, and adds no new optionality.
  - A non-null ref that is unresolvable in the snapshot is an integrity failure.
    - A detail read returns 503 /problems/unavailable.
    - A Control Room section becomes UNAVAILABLE with EVALUATION_FAILED (F-02).
    - It is never a null label, a placeholder, or a label from another snapshot or Matter.

Item | Detail
Authority | Approved: FR-017 ("Referenced party cannot vanish silently"), FR-001/016, RULE-003, AC-117/130. Candidate: delta
Alternatives | Omitting both keys needs a separate optional-field convention. An empty string conflates absent with known
ADR/PO | None
Owner | Claude, ZCode, Antigravity

  Acceptance:
  - F1: A condition wait has partyRef and partyLabel both null.
  - F2: An inactive party resolves with its label.
  - F3: A labelled ref's label equals the point-lookup label at the same sourceRevision, and never comes from a foreign Matter.
  - F4: An injected dangling ref gives 503 or UNAVAILABLE, never a null label.

  F-07: claim status vocabulary: NEEDS_AUTHORIZED_SOURCE

  Before:
  - Delta: claim: {claimRef, evidenceRef, criterionRevisionRef, componentKey|null, status, revision}.
  - DR-08: claims[] inline {…, status, revision}.
  - DR-07: claims summary {claimRef, evidenceRef, status} and the filter claimStatus=.
  - §3.3: the single example "status":"PENDING_REVIEW".

  Settled now from the packet:
  - status is the claim's own review state. It is not the subject verification aggregate (state-semantics: "Evidence review verdict and subject aggregate are distinguished"), so it never takes VERIFIED, PARTIALLY_VERIFIED or NOT_REQUIRED.
  - Zero assessments returns the envelope plus assessments: []. 404 is only for a nonexistent or inaccessible claim.
  - Revocations and disputes stay visible in assessments[] (revokedBy, disputes[]), with exact assessedDocumentVersionRef and criterionRevisionRef.
  - Time-derived status is evaluated at asOf (RC-8).

  Source request:

Field | Value
Paths (locations to check; | docs/architecture/data-model.md: the section defining evidence claim, assessment and dispute and their status
Codex identifies exact sections | values. docs/architecture/api-contracts.md: §1.1 (CAS scopes) and the dispute/revoke command section, both outside
when snapshotting) | the 1–48 and 165–191 excerpt. Any candidate section defining Evidence withdrawal
Reason | Bind status to an existing candidate definition instead of inventing an enum, and determine whether EXPIRED and
 | WITHDRAWN are claim states or evidence states
Destination | This interactive Claude Code session (claude-opus-5-5, Anthropic)
Permissions | Read-only snapshot, text-only output
Cost | Current session and quota; marginal cost unknown

  I can't tell from the packet whether these paths are within the prior 18.

  Fallback (NOT APPLIED; self-referential because it is derived from my own reviewed evidenceGaps codes):
  - Vocabulary: {PENDING_REVIEW, ACCEPTED, REJECTED, DISPUTED, EXPIRED, WITHDRAWN}. That is the gap set minus MISSING, plus the §3.4 verdict ACCEPTED.
  - Derivation precedence: WITHDRAWN > DISPUTED (open dispute on the current assessment) > EXPIRED (current accepted assessment past validity at asOf) > the current non-revoked verdict > PENDING_REVIEW.
  - Coupling: this would also fix the DR-07 claimStatus= filter values, which the finding didn't name.

Item | Detail
Authority | Approved: FR-007, RULE-005/006, AC-107/126/127/140. Candidate: §3.3/§3.4 and the delta
ADR/PO | A decision is needed only if new lifecycle semantics are introduced; otherwise a citable clarification
Owner | Claude (after the source), ZCode, Antigravity, OpenCode

  Acceptance (after binding):
  - G1: Zero assessments gives the envelope plus [], with the bound "unreviewed" value.
  - G2: Revoking the sole assessment returns status to the unreviewed value, and the revoked row is kept with revokedBy.
  - G3: An open dispute gives the disputed value, and no VERIFIED appears anywhere on the claim.
  - G4: Withdrawn Evidence follows the bound definition.
  - G5: claimStatus= accepts exactly the bound vocabulary; anything else gets 422.

  Limitation: this CT-17 subcase stays open.

  F-08: condition degenerate paging and CRITICAL_ATTENTION

  Before (sections.condition):
  - order: "single card".
  - card: "{matterRef, label, exceptions:[{code, count}], completeness: COMPLETE|INCOMPLETE}".
  - rule: "codes from approved vocabularies (CRITICAL_ATTENTION, DEPENDENCY_BLOCKED, …) … every exception sourced from an UNAVAILABLE section has count:null (never 0)".
  - continuation: "none".

  After:

  - (a) Envelope:
    - AVAILABLE always has items=[one card], total=1 and nextCursor=null, including when every count is 0.
    - UNAVAILABLE (own evaluation failed) has items=null, total=null, nextCursor=null and unavailableReason=EVALUATION_FAILED.
  - (b) Split code: CRITICAL_ATTENTION is replaced by CRITICAL and ATTENTION. They count the Requirement, Action and Filing objects whose attention axis at asOf is CRITICAL, or ATTENTION, respectively. The two are disjoint, because the axis is single-valued (RULE-010). There is no overall Matter state.
  - (c) Codes always present: every code appears exactly once, in list order, with a count that is an integer ≥ 0 or null.
    - Deviation: exceptions is never []. Codex's "exceptions=[] still one card" case becomes "all counts 0, still one card".
  - (d) Null source map. This maps evaluators, not section cards; DEPENDENCY_BLOCKED counts blocked targets, while the blockers section lists causes. A count is null if and only if its source evaluator failed.

  | Codes                                                        | Source evaluator                |
  |--------------------------------------------------------------|---------------------------------|
  | DEPENDENCY_BLOCKED                                           | blockers                        |
  | WAITING                                                      | waitingOn                       |
  | MILESTONE_NOT_READY, MILESTONE_UNASSESSED                    | milestones                      |
  | EVIDENCE_GAP, DISPUTED                                       | evidenceGaps                    |
  | OPEN_DECISION                                                | decisions                       |
  | CRITICAL, ATTENTION, OVERDUE, DUE_SOON, COMPLETED_UNVERIFIED | condition's own axis evaluation |
    completeness=INCOMPLETE holds if and only if any of blockers, waitingOn, milestones, evidenceGaps or decisions is UNAVAILABLE. nextActions and recentChanges source no code and don't affect completeness.

Item | Detail
Authority | Approved: RULE-010 (distinct CRITICAL/ATTENTION), FR-009, AC-109/156. Candidate: condition card
Alternatives | A union envelope with no paging fields is a larger shape change. A documented compound summary obscures RULE-010
ADR/PO | None. No new aggregate or state
Owner | Claude, ZCode, Antigravity, OpenCode

  Acceptance:
  - H1: An all-zero Matter returns one card with total=1, nextCursor=null and every code present with count 0.
  - H2: One CRITICAL and two ATTENTION objects give CRITICAL:1 and ATTENTION:2.
  - H3: A fault in evidenceGaps gives EVIDENCE_GAP:null, DISPUTED:null, INCOMPLETE, with other counts integers.
  - H4: If condition is UNAVAILABLE, total is null and never 0.

  Limitation: count units for the pre-existing codes, other than CRITICAL and ATTENTION, are not defined in the packet. Only their null source is pinned.

  F-09: DR-15 public seq keyset vs RC-6

  Before:
  - DR-15: "GET /api/v1/matters/{matterId}/events?after=|before=&limit=&targetId= (after: seq asc; before: seq desc)".
  - Generic collection_version: "opaque cursor bound to actor/matter/collection/filter/sort".
  - recentChanges: "events?before={seq}".

  After:
  - after and before are public integer event-seq bounds. They are exempt from RC-6's opaque-token syntax and binding only. RC-1/3/4/5/7/9 still apply.
  - At most one of them may be sent; sending both returns 422. With neither, events come in seq ascending order from the first event, as if after=0.
  - after=N returns seq > N ascending. before=N returns seq < N descending. Both bounds are exclusive.
  - Valid values: base-10 integers, with after ≥ 0 and before ≥ 1; anything else returns 422.
    - A bound beyond the head is valid. after ≥ head returns an empty page.
    - before > head returns events descending from the head.
  - nextCursor on DR-15 is the decimal string of the last returned seq, to be passed in the same parameter as the request. It is null when that response's snapshot has no further event in that direction.
  - recentChanges nextCursor is the decimal string of the last card's seq, used as before=.
  - Filters are not bound. The client re-sends targetId, and changing it between pages is not a 422. This is a deliberate difference from RC-6.
    - A malformed targetId gets 422 (F-05); an unmatched one gets [].
  - Scope and order of checks: seq is scoped to the path Matter, so there is no cross-Matter retrieval. A revoked member gets 404 before any validation.
  - Snapshots: each page carries its own asOf and sourceRevision.
  - Security audit events are never included.
  - TQ-05 time-window and CT-19 stay OPEN, untouched.

Item | Detail
Authority | Approved: FR-008/019, RULE-016/017/019, AC-108/136/138/149/153. Candidate: DR-15, RC-6
Alternatives | Wrapping seq in an opaque cursor is a wider change and hides nothing, since members already see seq
ADR/PO | None. TQ-05 not closed
Owner | Claude, ZCode, Antigravity, OpenCode

  Acceptance:
  - I1: after=5 returns 6, 7, …; before=5 returns 4, 3, ….
  - I2: Sending both gives 422; after=-1, after=x and before=0 each give 422.
  - I3: nextCursor round-trips with no gap or duplicate at a fixed sourceRevision.
  - I4: A revoked member with a valid seq gets 404.
  - I5: Matter B's seq used on Matter A returns only Matter A events.
  - I6: The recentChanges nextCursor used as before= continues without overlap.

  F-10: embedded versions[], cycles[], submissions[]

  Before:
  - DR-10: "title, currentVersionRef|null, revision; versions[] {versionRef, seq, createdAt, isCurrent (derived), signatureSummary}".
  - DR-12: "…authorityPartyRef, revision; cycles[] {cycleNo, requestRef, ownerRef, dueAt, opened/closed, submissions[] {submissionRef, reference, submittedAt, submittedVersionRefs (exact)}, receipt/outcome evidence refs}".

  After (RECOMMENDED_CLARIFICATION):
  - DR-10: versions becomes {items, total, nextCursor}, the first page from the same snapshot as the document, with the item shape unchanged.
    - nextCursor continues on the existing GET /documents/{id}/versions.
    - The default order for both is seq descending.
    - The cursor is bound under RC-6 to that document's versions collection.
    - currentVersionRef is independent of the page, so the current version may be off-page. No business cap.
  - DR-12: cycles becomes {items, total, nextCursor}, continued on the existing GET /filings/{id}/cycles.
    - The default order for both is cycleNo descending.
    - /cycles items have the identical shape, including submissions[].

  submissions[] and submittedVersionRefs: DECISION_REQUIRED.
  - No existing route pages submissions within a cycle or versions within a submission.
  - The packet doesn't bound either cardinality.
  - RC-10 forbids a truncation flag.

  The options are:
  1. A candidate source states a bound, for example a filing-model rule on per-cycle submissions and package size. That downgrades this to a clarification, via a NEEDS_AUTHORIZED_SOURCE request for the filing-model cycle/submission cardinality sections.
  2. A new nested route. That expands the 32 operations, so a separate decision is needed.
  3. Complete embedding with the size risk accepted explicitly.

  Until then, the base behaviour stands: complete, untruncated arrays, with the size risk open.

Item | Detail
Authority | Approved: FR-015/016, RULE-011/012 (supplement creates a new cycle, original preserved), AC-115/116/128/129/145. Candidate: DR-10/12
Compatibility | .versions and .cycles consumers read .items
Owner | Claude, Codex/PO for the decision, ZCode, Antigravity

  Acceptance:
  - J1: A synthetic document with 201 versions: every version is reachable through the embedded page plus /versions, with no dup and an identical order.
  - J2: A filing with more than one page of cycles is fully reachable the same way.
  - J3: Every submittedVersionRefs entry is an exact version id, never the current pointer.
  - J4: No response claims completeness while a non-null nextCursor exists.
  - Nested subpart: acceptance waits on the decision.

## R2 identity and affected finding revisions

Tôi đã xử lý xong follow-up cho F-02, F-03, F-07, F-08 và F-10, kết quả là text Markdown/JSON bên dưới; không tạo hay sửa file, không commit. Bốn kết luận R1 sai hoặc tự mâu thuẫn được sửa lại: điều chỉnh READ-02 rút lại, phạm vi actor của F-03, trường status của F-07, và lời nói sai về RC-10 ở F-10.

MC-003A.8A R2: owner follow-up (F-02/F-03/F-07/F-08/F-10)

0. Identity and authorization

Field | Value
Authorization | The approval text arrived inside a wrapper titled "prepared only, NOT authorization". I treated your sending it as the approval.
note | Codex should confirm this or discard R2
Reviewer | Claude Code, interactive. Model claude-opus-5-5 and provider Anthropic per session metadata; routing not inspected. Version
 | 2.1.310 is from the earlier record, not re-run
Head | 838fde6 as declared, not checked. Baseline 97356ce
Packets | Follow-up manifest 95694…cd2c matched (9944 bytes); 7/7 snapshots, 47615 bytes. Prior packet re-verified: 12/12, 164137 bytes.
 | Read-only, packet-only
Self-review | I wrote the base contract, R1, data-model, evidence-model, filing-model and api-contracts. Nothing is closed by self-review

R1 count correction: the R1 intro said 7, which was wrong. R1 actually had 8 recommended clarifications, 1 NEEDS_AUTHORIZED_SOURCE and 1 SPLIT.

After R2:

Verdict | Findings
Recommended clarification | 8: F-01/04/05/06/09 unchanged, plus F-02, F-03, F-08. F-08 keeps one subpart open (EVIDENCE_GAP)
CHANGES_REQUIRED | 1: F-07
SPLIT | 1: F-10

F-02 + F-08: one partial-failure rule

Disposition of R1's READ-02 change: WITHDRAWN. The baseline READ-02 stays: root 503 only when the snapshot can't open or no section is AVAILABLE. A response where only the condition section is AVAILABLE is therefore a 200, with null counts.
- This is the lower-impact option, and the baseline already says "a 200 does not mean every section is available".
- It needs no decision, and the immutable baseline is unchanged.
- How each section's failure is contained inside one snapshot is still an implementation question. The mechanism and its feasibility are unverified, and I'm not claiming any particular one works.

R1 B1 corrected: only a failure in a contributing section makes condition INCOMPLETE.

Contributing sections (revised from R1): milestones, evidenceGaps and decisions. Blockers, waitingOn, nextActions and recentChanges do not contribute.

Truth table (availability and completeness are separate; null is never 0):

Case | Sections | condition | completeness | Root
a. milestones, evidenceGaps or | that one UNAVAILABLE | AVAILABLE; that evaluator's codes null | INCOMPLETE | 200
decisions fails |  |  |  |
b. nextActions only | nextActions | AVAILABLE; all counts integers | COMPLETE | 200
 | UNAVAILABLE |  |  |
c. recentChanges only | recentChanges | same as b | COMPLETE | 200
 | UNAVAILABLE |  |  |
c'. blockers or waitingOn only | that one UNAVAILABLE | same as b | COMPLETE | 200
d. condition's own evaluation fails | all 7 AVAILABLE | UNAVAILABLE: null/null/null, EVALUATION_FAILED | absent | 200
e. all 7 data sections fail, condition | 7 UNAVAILABLE | AVAILABLE; own-axis counts integers, contributing | INCOMPLETE | 200
OK |  | codes null |  | (baseline)
f. all 7 fail and condition fails | none available | — | — | 503
g. snapshot can't open | — | — | — | 503

F-08 count units, per code

Scope for every count: in-Matter, same snapshot, at asOf. Each count is the number of distinct objects. Codes overlap and must not be summed, and there is no total. Every code is always present, as an integer ≥ 0 or null.

Code | Unit (CANDIDATE) | Source (R1 → R2)
CRITICAL / ATTENTION | Requirement/Action/Filing with attention CRITICAL / ATTENTION. Disjoint | own (unchanged)
OVERDUE / DUE_SOON | Requirement/Action/Filing with that timing value | own (unchanged)
COMPLETED_UNVERIFIED | execution COMPLETED and verification exactly UNVERIFIED. PARTIALLY_VERIFIED, DISPUTED and | own (unchanged)
 | objects where verification doesn't apply are excluded, following RULE-010's literal wording |
DEPENDENCY_BLOCKED | Requirement/Action with dependency BLOCKED, in any execution state (Filing has no dependency | blockers → own
 | axis) |
DISPUTED | Requirement/Action/Filing with verification DISPUTED | evidenceGaps →
 |  | own
WAITING | Requirement/Action/Filing with execution WAITING. Counts objects, not wait records | waitingOn → own
MILESTONE_NOT_READY / | milestones with that readiness value; NOT_READY + UNASSESSED + READY = milestones.total | milestones
MILESTONE_UNASSESSED |  | (unchanged)
OPEN_DECISION | open decisions; equals decisions.total | decisions
 |  | (unchanged)
EVIDENCE_GAP | equals evidenceGaps.total. NEEDS_CLARIFICATION: the evidenceGaps row unit (per criterion or per | evidenceGaps
 | component) is not pinned in the packet | (unchanged)

The condition's own evaluation is all-or-nothing: either every own-axis code is computed, or condition is UNAVAILABLE. This creates no overall legal state, percentage or cap.

Acceptance:
- H1: An all-zero Matter returns one card, every code present with 0, total=1 and nextCursor=null.
- H2: One CRITICAL and two ATTENTION objects give 1 and 2.
- H3: A decisions fault gives OPEN_DECISION null and INCOMPLETE.
- H4: A blockers fault leaves DEPENDENCY_BLOCKED an integer and COMPLETE.
- H5: The equality checks against decisions.total, milestones.total and evidenceGaps.total hold.

Limitations:
- OVERDUE and DUE_SOON depend on RULE-009, which is not in the packet.
- The EVIDENCE_GAP numeric tests can't be executed until the row unit is pinned.

F-03: actor scope, excluded population, order and size

I accept the counterexample. AC-144 (approved) lists Actions "unassigned to current user". My R1 implicit Matter-wide reading is withdrawn.

Rules:
- Evaluation actor: the caller, for both the Control Room section and GET /matters/{m}/next-actions, so the base rule that the continuation route has the same population and order still holds. No selected-member parameter is added, so "selected owner" is always the caller.
- Candidate (RULE-021 unchanged): a visible Action that is NOT_STARTED or IN_PROGRESS, with dependency READY, assigned to the caller as an active Matter member.
- Excluded: every other visible non-terminal Action (NOT_STARTED, IN_PROGRESS or WAITING). This doesn't leak: P0 has no access control below the Matter.
- Reason: the first of these that is true:
  - WAITING;
  - BLOCKED;
  - UNASSIGNED, meaning not assigned to the caller as an active member. That covers an Action owned by another member, one with no owner, and one whose owner has been removed.

  This is display precedence only; WAITING≠BLOCKED is unchanged and no new code is added.
- Removed owner: an Action whose owner is no longer a member shows no ownerRef or name, because USER refs are for co-members only.
- Order and size (CANDIDATE):
  - excluded becomes {items, total, nextCursor}, ordered by critical chain first, then dueAt ascending with nulls last, then id.
  - It continues on GET /matters/{m}/next-actions?excluded=true, a new query parameter on an existing route.
  - This changes the shape Antigravity consumes: it was an array.
  - No cap, no truncation, no new route.

Truth table (caller U1):

W | B | Assignee | Candidate | reason
no | no | U1 | yes | —
no | no | U2 (active), none, or removed member | no | UNASSIGNED
no | yes | any | no | BLOCKED
yes | any | any | no | WAITING

Acceptance:
- K1: A READY Action owned by U2 is excluded with UNASSIGNED; it is not a candidate.
- K2: An Action with no owner gives UNASSIGNED.
- K3: An Action whose owner was removed gives UNASSIGNED, with no name.
- K4: U1's own READY Action is a candidate.
- K5: A WAITING+BLOCKED Action gives WAITING, and waitingOn shows it BLOCKED.
- K6: With zero candidates, items is [], excluded.total is greater than 0, and no action is manufactured.
- K7: Paging excluded over more than one page reaches every row in the pinned order.

Limitation: the scope comes from AC-144. If the PO reads FR-009 "next/owner" as Matter-wide, that is a PO interpretation question and becomes DECISION_REQUIRED.

F-07: CHANGES_REQUIRED, bound to the candidate model

Findings from the packet:
- evidence_claims has no status column; a claim is the link between evidence and criterion component (evidence-model §1).
- An assessment's verdict is ACCEPTED or REJECTED. Exactly one assessment is current per (claim, proof epoch); supersession and revocation are tracked (§2 rule 5).
- Satisfaction is the §4 conjunction, and evidence-model forbids any "Evidence E is verified" field.
- So claim.status was a derived value nobody defined.

Changes:
- Withdraw the R1 six-value fallback.
- Remove status from the DR-07, DR-08 and DR-09 claim shapes.
- Withdraw DR-07's claimStatus= filter, since no vocabulary exists; gap= still covers that need.
- Add three fields, all CANDIDATE:
  - currentAssessmentRef: the current assessment for the subject's current epoch, or null.
  - openDisputeRef: the open dispute on that assessment, or null.
  - failed: [code]: a new CANDIDATE vocabulary in which each code is the negation of one §4 condition, in §4 order.

Code | Meaning (§4 condition false)
STALE_CRITERION_REVISION | the claim's criterion revision is not current
NO_CURRENT_ASSESSMENT | no non-superseded assessment in the current proof epoch
REJECTED | current verdict is REJECTED
REVOKED | current assessment revoked
EVIDENCE_WITHDRAWN | withdrawn_at set
OUTSIDE_VALIDITY | asOf outside the half-open interval [valid_from, min(valid_until, effective_until))
VERSION_RULE_MISMATCH | assessed version fails CURRENT_AUTHORITATIVE or FIXED
OPEN_DISPUTE | open dispute on the current assessment

Reading failed:
- Codes that depend on an assessment are evaluated only when a current assessment exists.
- An empty failed means this claim meets every §4 condition. It is not a criterion, subject or Evidence verdict; another claim may still satisfy the component.
- There is no boolean "satisfied" field.
- The subject aggregate stays separate.

Known contradiction: the api-contracts §3.3 command example still shows "status":"PENDING_REVIEW". It needs a candidate alignment, which I haven't made here.

Decision: no PO decision; this adds no new lifecycle semantics.

Acceptance:
- L1: A claim with no assessment gives [NO_CURRENT_ASSESSMENT], plus any assessment-independent codes, with assessments:[]; it is not a 404.
- L2: An ACCEPTED assessment superseded by REJECTED gives [REJECTED].
- L3: Revoking gives [REVOKED].
- L4: Reopening the subject (new epoch) gives [NO_CURRENT_ASSESSMENT], and the old assessment stays in history.
- L5: Revising the criterion gives STALE_CRITERION_REVISION.
- L6: Promoting a new version under CURRENT_AUTHORITATIVE gives VERSION_RULE_MISMATCH.
- L7: At asOf equal to the expiry instant, the result includes OUTSIDE_VALIDITY.
- L8: Withdrawn Evidence gives EVIDENCE_WITHDRAWN.
- L9: An open dispute gives OPEN_DISPUTE and a non-null openDisputeRef.
- L10: No claim field ever carries VERIFIED.

F-10: outer pages vs nested arrays

Outer pages: the versions and cycles first-page plus continuation recommendation is unchanged.

Two R1 claims are struck:
- RC-10 does not forbid a truncation flag.
- Complete nested arrays are not base behaviour. Nested completeness is unspecified.

Nested arrays: DECISION_REQUIRED. This covers submissions[], submittedVersionRefs and cycle receipt/outcome evidence refs, which are the same kind of problem. Evidence:
- filing_submissions has no UNIQUE (filing_id, cycle_no), so a cycle can have several submissions.
- filing_submission_items has primary key (submission_id, document_version_id), with no bound.
- filing-model §3 says supplement cycles are unbounded. I'm not inventing a per-Filing limit.

Until this is decided, the outer cycles page has no size bound.

Options:
1. A new nested read route. It expands the 32 operations, so it needs a catalogue decision.
2. A data-model or domain bound, for example UNIQUE (filing_id, cycle_no). That is an architecture decision, possibly needing PO input on RULE-012 resubmissions, and it still doesn't bound the items.
3. Explicitly accept complete embedding and the response-size risk; clients then handle large payloads. That needs an architecture or PO decision.
4. A bounded prefix with no continuation. This is rejected because some items would become unreachable.

Approval: the PO Architecture Approval Gate, on my proposal. Exact submitted document-version IDs are kept in every option.

## R2 gates and limitations

Gates

- All 22 CT IDs and the 16/4/1/1 classification are unchanged, and runtime is NOT_RUN.
- Q2, Q4, Q6 and Q8 stay conditional.
- CT-19/TQ-05 and CT-20/TB-05 are still open.
- G5-A stands; G5-B FINDINGS_OPEN; G3 NOT_VERIFIED; G4 PENDING; G6 REWORK_REQUIRED; MC-003A REWORK_REQUIRED; STEP03B NOT_AUTHORIZED.
- Next: Codex intake. Then ZCode rechecks only F-02, F-03, F-07, F-08 and F-10.

Skipped:
- Every source outside the 19 snapshots, including RULE-009, dependency-engine and the AtlasT0 fixture.
- Any git check, any version re-run, and all runtime or database checks.
- F-11.

Risks:
- F-03: actor scope depends on reading AC-144 over FR-009.
- F-08: EVIDENCE_GAP's row unit is still open.
- F-07: the §3.3 example contradiction remains.
- F-10: the cycles response has no size bound until the decision is made.
- Authorization: it rests on how I read the wrapper (section 0).
- Self-review: everything here is me reviewing my own candidate design.
