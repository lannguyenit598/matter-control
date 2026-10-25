# MC-003A.8A — Claude targeted return R1 intake

Local Codex PM/BA. Human-returned actual Claude targeted document review received; self-review disclosed. Baseline contract 97356ce remains immutable. Source checkpoint 838fde6. Intake PARTIAL_RETURN / TARGETED_REWORK_REQUIRED; no findings closed and no normalized delta applied.

Original bytes are preserved in review-original.txt.gz (lossless gzip; decompress to recover exact original bytes, including the trailing whitespace on line 586). Return/model/provider/version/routing/cost statements remain reviewer claims; Codex independently checked the exact 12-snapshot manifest (11607 bytes, SHA eed78855…0979) and all 164137 snapshot bytes. Version was not rerun and source HEAD was manifest-declared.

## Findings

- F-01 (Medium): PROPOSED_READY_FOR_TARGETED_RECHECK; OPEN.
- F-02 (Medium): PARTIAL_PROPOSAL_REWORK_REQUIRED; OPEN.
- F-03 (Medium): REWORK_REQUIRED; OPEN.
- F-04 (Low): PROPOSED_READY_FOR_TARGETED_RECHECK; OPEN.
- F-05 (Low): PROPOSED_READY_FOR_TARGETED_RECHECK; OPEN.
- F-06 (Low): PROPOSED_READY_FOR_TARGETED_RECHECK; OPEN.
- F-07 (Low): NEEDS_AUTHORIZED_SOURCE; OPEN.
- F-08 (Low): PARTIAL_PROPOSAL_REWORK_REQUIRED; OPEN.
- F-09 (Low): PROPOSED_READY_FOR_TARGETED_RECHECK; OPEN.
- F-10 (Low): SPLIT / NESTED_DECISION_REQUIRED / INTERIM_NOT_ACCEPTED; OPEN.
- F-11 (Medium): CODEX_FIXTURE_PROPOSAL_AWAITING_ADOPTION_AND_TARGETED_RECHECK; OPEN.

Five recommendations (F-01/04/05/06/09) are ready as PROPOSALS for a targeted reviewer, not accepted fixes. F-02/03/08/10 have targeted corrections/limitations; F-07 needs source. F-11 remains Codex's unadopted fixture proposal.

## Intake observations

**INT-R1-01 — ARTIFACT_FORMAT**
Original delta lines 586-588 has a truncated first preserved member with a trailing comma and a duplicate preserved key. Strict JSON parsing fails. Original bytes retained; normalized copy removes only original lines 586-587, retains complete preserved member and all finding objects.
Status: NORMALIZED_FOR_INSPECTION_ONLY_NOT_APPLIED.

**INT-R1-02 — RETURN_SUMMARY_ERRATUM**
Intro says 7 document-only findings; actual delta has 8 full RECOMMENDED_CLARIFICATION_DOCUMENT_ONLY findings, one NEEDS_AUTHORIZED_SOURCE and one SPLIT. F-10 outer portions are additional partial recommendations.
Status: RECORDED_NON_BLOCKING.

**INT-R1-03 — CONTRACT_COUNTEREXAMPLE**
Returned excluded membership (line 185) includes every visible nonterminal noncandidate Action, while W/B/U omits assignment to another active member. For U1 viewing an eligible READY Action owned by active U2, approved RULE-021 says not a U1 candidate, but the returned all-false table says Candidate=yes and no reason is available for returned excluded membership.
Status: REWORK_REQUIRED.

**INT-R1-04 — INTRA_RETURN_CONTRADICTION**
F-02 B1 (line 168) says any one-section fault makes condition INCOMPLETE. F-08 line 440 excludes nextActions and recentChanges from condition completeness. A nextActions-only evaluation failure yields different expected completeness under the two statements.
Status: REWORK_REQUIRED.

**INT-R1-05 — UNSUPPORTED_INTERIM_INFERENCE**
Return lines 521-535 treats RC-10 as forbidding a truncation flag and calls complete untruncated nested arrays base behaviour. RC-10 says there is no product truncation contract and INT-A rules are harness-only; it establishes neither a universal flag prohibition nor complete embedding for unspecified arrays. Original DR-12 leaves bounds unstated.
Status: DECISION_REQUIRED / SOURCE_CHECK_PENDING.

**INT-R1-06 — DECLARED_LIMITATION**
Return line 460 leaves count units for codes other than CRITICAL/ATTENTION unspecified. Envelope/code-split proposals do not close all numeric-condition assertions.
Status: OPEN_LIMITATION.

**INT-R1-07 — PROVENANCE**
Human-relayed actual Claude return; reviewer self-discloses authorship and self-review. Version 2.1.310 carried from earlier session, not rerun; model/provider from reported session metadata, routing/cost not independently attested. Source HEAD is manifest-declared, not reviewer-verified. Codex independently verifies the received packet hashes only.
Status: LIMITATION_RETAINED.

The machine-readable copy removes only the first truncated preserved member (original lines 586–587). This addresses trailing-comma/duplicate-key corruption without changing any finding. It is a normalized transcription, not a contract patch. The report intro says seven document-only findings; the actual ten-item delta contains eight full recommendations, one source request and one split finding.

## Scenarios, questions and gates

Original 22 CT IDs retain 16 TESTABLE_AS_SPECIFIED / 4 NEEDS_CONTRACT_CLARIFICATION / 1 NEEDS_FIXTURE_DEFINITION / 1 BLOCKED_BY_ARCHITECTURE_DECISION; every runtime NOT_RUN. A testable classification retains its noted finding-dependent subcases; it is not a pass.

CT-05 F-05, CT-14 F-02, CT-19 TQ-05, CT-21 F-03+F-11 remain open; CT-07 F-11; CT-20 TB-05. CT-06/F-08, CT-13/F-06/F-10, CT-16/F-01/F-09, CT-17/F-07, CT-18/F-04 remain conditional as applicable.

All eight original QA dispositions retained; Q2/F-02, Q4/F-01, Q6/F-03/F-11, Q8/F-05-adjacent remain ANSWER_CONDITIONAL_ON_FINDING_RESOLUTION. Q5 ANSWERED_FROM_APPROVED_SOURCE is a document answer. No QA/runtime PASS.

G5-A ARCHITECTURE_COMPATIBLE_WITH_CONSTRAINTS_DOCUMENT_ONLY; G5-B REVIEW_RETURN_RECEIVED / FINDINGS_OPEN; G3 NOT_VERIFIED; G4 PENDING; G6 REWORK_REQUIRED; STEP03B NOT_AUTHORIZED.

## Next owner action

Focused Claude follow-up only for F-02/03/07/08/10, with locally prepared source expansion in claude-followup-v1. Exact source sections/hashes and recipient/cost/permissions are in its manifest. New payload remains WAITING_SCOPED_AUTHORIZATION; no external model or reviewer was invoked. Prior packet authorization is not expanded by this intake. Keep F-01/04/05/06/09 stable; do not repeat the 32-operation or full-architecture review. After the owner resolves actionable contradictions, ZCode rechecks only corrected findings and the Codex F-11 fixture; independent Design QA remains separate.

Skipped: product/runtime, Go/PostgreSQL/frontend/build/render/security execution and all new agent/provider dispatch. Risk: semantic contradictions, claim vocabulary and nested-array decision remain unresolved.
