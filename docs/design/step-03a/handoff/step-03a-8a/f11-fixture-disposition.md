# F-11 — targeted fixture disposition (proposal)

Owner Codex; baseline 97356ce; priority P0; status NEEDS_CLARIFICATION / PROPOSED_NOT_APPLIED; independent ZCode targeted recheck pending. No original Atlas or approved business semantics changed. Runtime NOT_RUN.

## Actual graph and authority

Atlas §4 has 12 Requirements and 12 Actions, enumerated in the companion JSON; §5 has exactly seven directed edges. An edge upstream → downstream means the downstream depends on the upstream. A Requirement contribution link, workstream grouping, document link or milestone narrative is not a dependency edge. Milestones accept explicit required Requirements under approved RULE-008; they are not graph nodes.

| Edge | Upstream → downstream | Normalized approved gate | T0 |
|---|---|---|---|
| DEP-01 | RQ-04 → AC-05 | COMPLETION_AND_VERIFIED | Unsatisfied |
| DEP-02 | AC-05 → AC-07 | COMPLETION | Unsatisfied |
| DEP-03 | AC-07 → AC-08 | COMPLETION | Unsatisfied |
| DEP-04 | AC-08 → AC-09 | COMPLETION | Unsatisfied |
| DEP-05 | RQ-05 → AC-05 | COMPLETION_AND_VERIFIED | Satisfied |
| DEP-06 | AC-10 → AC-11 | COMPLETION | Unsatisfied |
| DEP-07 | RQ-11 → AC-12 | COMPLETION_AND_VERIFIED | Unsatisfied |

RULE-003: all incoming gates AND; upstream must be READY+COMPLETED, with VERIFIED additionally for a proof gate. Atlas's historical verification-only label is adapted explicitly to COMPLETION_AND_VERIFIED; no outcomes change at T0. No incoming edges means dependency READY, independent of WAITING. RULE-010 allows explicit critical milestone prerequisites or reasoned OWNER escalation; neither is actually specified by Atlas. Atlas demo CRITICAL labels are not policy evidence. Candidate dependency-engine.md §§1/2/5 explains implementation semantics but remains PROPOSED/WAITING_ARCHITECTURE_APPROVAL; it is not an additional approved business source.

Paths: RQ-04 → AC-05 → AC-07 → AC-08 → AC-09 exists. RQ-04 → RQ-08 does not. RQ-08 has no incoming or outgoing dependency edge. Adding MS-02.prerequisites=[RQ-08] cannot make RQ-04 an ancestor. Neither an implicit AC-08→RQ-08 edge nor a milestone→Action edge is allowed.

## Comparator and corrected assertion

Candidate blocker cards are upstream causes of unsatisfied outgoing edges, not all blocked targets. Comparator: critical-unsatisfied first; rootCause=true first; dueAt ascending/null-last; canonical ID ascending. This is a blocker comparator, distinct from RULE-021 Next Action ordering (no rootCause key).

T0 root causes: RQ-04 (READY/WAITING, due June 14), AC-10 (READY/WAITING, June 20), RQ-11 (READY/NOT_STARTED, June 21). Intermediate causes AC-05/07/08 are BLOCKED, due June 16/17/18. RQ-05's outgoing gate is satisfied so it is not a blocker card. AC-09/11/12 have no failing outgoing gate so they are not cause cards.

The review's necessary-condition claim “RQ-04 top only from critical designation” is incorrect: rootCause and due keys already put it first when all critical inputs are false. The original fixture's critical flags/prerequisites/escalations are under-specified. The suggested MS-02→RQ-08 fix has an incorrect reachability claim. Do not collapse these two diagnoses.

Smallest baseline fixture proposal: retain all 24 nodes and seven edges; explicitly set every milestone critical=false and prerequisites=[] and every OWNER critical escalation absent. Normalize gates to approved RULE-003 and retain T0 due dates. Under the candidate comparator expected order is RQ-04, AC-10, RQ-11, AC-05, AC-07, AC-08. This proves neither critical-chain membership nor a runtime PASS. Milestones are UNASSESSED, not READY. All critical-unsatisfied flags are false.

## Isolating critical influence if that assertion is required

Companion JSON proposes a separate two-variant fixture: both variants have MS-02.prerequisites=[RQ-04] (a valid Requirement) and RQ-04 due June 23, with all other nodes/edges/due/rootCause/IDs identical. Variant 0 critical=false orders AC-10,RQ-11,RQ-04,AC-05,AC-07,AC-08. Change only MS-02.critical to true in variant 1: RQ-04 becomes a failing critical prerequisite and moves first. Its later due date controls the confound; the competing rootCause values are equal. This demonstrates only that priority key under the candidate comparator, not the missing RQ-08 path or critical status for every downstream Action.

Canonical Atlas IDs remain unchanged as aliases. The JSON supplies an explicit deterministic UUIDv7 map for candidate typed API refs, including all 24 nodes, milestones, edges and W1/M1. No seed is run. No ID, edge or product behavior is silently introduced into Atlas.

Acceptance before closure: validate all endpoints/UUIDs/same Matter, seven-edge DAG, exact reachability and gate states, rootCause and full sort tuples, no missing sort inputs, repeated same-snapshot deterministic expected order, no added edge, and targeted independent ZCode recheck. Until proposal adoption/recheck, CT-07 remains NEEDS_FIXTURE_DEFINITION, CT-21 remains NEEDS_CONTRACT_CLARIFICATION, F-11 OPEN. These checks are document/static integrity only; all runtime NOT_RUN.

Local scope: Codex read Atlas §2/4/5, approved rules and exact candidate comparator plus dependency-engine.md for this explicitly requested F-11 analysis. This does not retroactively authorize ZCode's extension or authorize transmitting those extra excerpts to Claude.
