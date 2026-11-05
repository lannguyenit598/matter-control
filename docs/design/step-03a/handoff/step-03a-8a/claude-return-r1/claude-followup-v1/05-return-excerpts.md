<!-- Original return lines 125-150; decorative box borders removed, table cell text retained -->
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

<!-- Original return lines 167-172; decorative box borders removed, table cell text retained -->
  Acceptance:
  - B1: A fault in one section gives that section UNAVAILABLE with null/null/null and EVALUATION_FAILED. The others stay AVAILABLE, the root is 200, condition is INCOMPLETE and that section's codes are null.
  - B2: Faults in all seven sections give root 503 /problems/unavailable.
  - B3: A snapshot-open fault gives 503.
  - B4: A genuine zero gives AVAILABLE, [], total=0, reason null.
  - B5: No raw error detail appears in the body.

<!-- Original return lines 174-211; decorative box borders removed, table cell text retained -->
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

<!-- Original return lines 229-237; decorative box borders removed, table cell text retained -->
  Acceptance:
  - C1: All eight truth-table rows hold.
  - C2: A WAITING+BLOCKED Action is in excluded with reason WAITING, is not in items, and appears in waitingOn with subject dependency BLOCKED.
  - C3: With zero candidates, the section is AVAILABLE with items=[] and a non-empty excluded. No action is manufactured and readiness is unchanged.
  - C4: No Requirement or terminal Action appears in excluded.

  Limitations:
  - For BLOCKED+UNASSIGNED, excluded[] shows BLOCKED only.
  - The ordering and size bound of excluded[] are pre-existing gaps outside F-01..F-10, but CT-21 payload determinism needs an order. Codex should decide whether to raise them separately.

<!-- Original return lines 414-440; decorative box borders removed, table cell text retained -->
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

<!-- Original return lines 454-460; decorative box borders removed, table cell text retained -->
  Acceptance:
  - H1: An all-zero Matter returns one card with total=1, nextCursor=null and every code present with count 0.
  - H2: One CRITICAL and two ATTENTION objects give CRITICAL:1 and ATTENTION:2.
  - H3: A fault in evidenceGaps gives EVIDENCE_GAP:null, DISPUTED:null, INCOMPLETE, with other counts integers.
  - H4: If condition is UNAVAILABLE, total is null and never 0.

  Limitation: count units for the pre-existing codes, other than CRITICAL and ATTENTION, are not defined in the packet. Only their null source is pinned.

<!-- Original return lines 505-535; decorative box borders removed, table cell text retained -->
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

<!-- Original return lines 542-548; decorative box borders removed, table cell text retained -->

  Acceptance:
  - J1: A synthetic document with 201 versions: every version is reachable through the embedded page plus /versions, with no dup and an identical order.
  - J2: A filing with more than one page of cycles is fully reachable the same way.
  - J3: Every submittedVersionRefs entry is an exact version id, never the current pointer.
  - J4: No response claims completeness while a non-null nextCursor exists.
  - Nested subpart: acceptance waits on the decision.
