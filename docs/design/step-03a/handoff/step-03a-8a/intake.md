# MC-003A.8A — review intake and targeted findings

Local Codex PM/BA/orchestration. Branch task/MC-003A-remediation, contract baseline 97356ce45c2b10070e9303f7c2ab39a425fad7a5. Status IN_REVIEW / FINDINGS_OPEN; MC-003A REWORK_REQUIRED. Reviewer original preserved verbatim in zcode-review-original.txt; original request in request.md. Intake of an actual human-returned ZCode review is not an independently attested model/billing/egress record. No new full 32-operation review performed.

Approval: these new files may be created only through the normal official require_escalated intended-write request. Ordinary usageAllowed/quota is not write authorization. No alternative path on rejection. A successful write permit covers bounded local documentation only, never Claude transmission, runtime or product approval. Commit and check evidence recorded separately after actual execution.

## Findings and next owners

11 OPEN findings: 4 Medium / 7 Low. intake.json retains each original finding and per-finding candidate reference, approved requirement, minimal proposal, alternatives/impact, compatibility, ADR need and acceptance. F-01..10 actual Claude handoff READY_NOT_DISPATCHED: new exact payload/model/destination/execution authorization is not established. F-11 Codex's graph/fixture proposal is prepared, not adopted or independently accepted.

- F-01 Medium: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-02 Medium: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-03 Medium: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-04 Low: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-05 Low: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-06 Low: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-07 Low: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-08 Low: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-09 Low: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-10 Low: Actual Claude Code (contract), ZCode targeted recheck; OPEN.
- F-11 Medium: Codex (fixture/BA), ZCode targeted recheck; OPEN.

## Scope deviation SCOPE-OBS-8A-01

ZCode self-reported reading dependency-engine.md and grep across docs/architecture/*.md beyond its 18-input manifest. Exact local access/context/egress inventories have not been independently verified. The narrative uses those results; provider/model/cost claims remain self-report. No assertion of verified egress or zero-egress, no retroactive approval. input-manifest.json records independently recomputed baseline bytes/hashes; this does not attest the reviewer session. Codex's current local extra read for the explicit F-11 task is separately authorized by that task and not transmitted to another agent. Future expansion requires exact path/sections/reason/destination/model/permissions/known cost and official scoped approval; see intake.json. The full original report/extra file/unknown grep results are excluded from proposed Claude payload.

## Scenarios — classifications preserved, all NOT_RUN

16 TESTABLE_AS_SPECIFIED: CT-01/02/03/04/06/08/09/10/11/12/13/15/16/17/18/22. This retains the reviewer classification, including caveats for subcases; it is not a claim that every test variant is executable now.
4 NEEDS_CONTRACT_CLARIFICATION: CT-05→F-05 (Claude), CT-14→F-02/fault seam (Claude), CT-19→TQ-05 OPEN (Claude; not automatically resolved by F-09), CT-21→F-03 (Claude) plus F-11 (Codex).
1 NEEDS_FIXTURE_DEFINITION: CT-07→F-11 (Codex).
1 BLOCKED_BY_ARCHITECTURE_DECISION: CT-20→TB-05 storage-provider/streaming decision (Claude/applicable PO gate); authorization assertions do not resolve storage.
All original 22 IDs/text and individual dependency caveats retained in intake.json; no new test IDs or runtime result promotion.

## Eight QA dispositions

- Q1: original RESOLVED_IN_REVIEWED_CANDIDATE; intake RESOLVED_IN_REVIEWED_CANDIDATE; runtime NOT_RUN.
- Q2: original RESOLVED_IN_REVIEWED_CANDIDATE; intake ANSWER_CONDITIONAL_ON_FINDING_RESOLUTION; depends F-02; runtime NOT_RUN.
- Q3: original RESOLVED_IN_REVIEWED_CANDIDATE; intake RESOLVED_IN_REVIEWED_CANDIDATE; runtime NOT_RUN.
- Q4: original RESOLVED_IN_REVIEWED_CANDIDATE; intake ANSWER_CONDITIONAL_ON_FINDING_RESOLUTION; depends F-01; runtime NOT_RUN.
- Q5: original ANSWERED_FROM_APPROVED_SOURCE; intake ANSWERED_FROM_APPROVED_SOURCE; runtime NOT_RUN.
- Q6: original RESOLVED_IN_REVIEWED_CANDIDATE; intake ANSWER_CONDITIONAL_ON_FINDING_RESOLUTION; depends F-03, F-11; runtime NOT_RUN.
- Q7: original RESOLVED_IN_REVIEWED_CANDIDATE; intake RESOLVED_IN_REVIEWED_CANDIDATE; runtime NOT_RUN.
- Q8: original RESOLVED_IN_REVIEWED_CANDIDATE; intake ANSWER_CONDITIONAL_ON_FINDING_RESOLUTION; depends F-05 (adjacent malformed-ID convention); runtime NOT_RUN.

Q1/Q3/Q7 remain reviewed-candidate document answers, not approved product/security proof. Q5 approved-source answer remains document-only. No new QA question added.

## Freeze and gates

Original indexed base, delta, Claude addendum and superseded-rejection history remain immutable. External Party point lookup, Evidence Claim parent envelope, Workstream point lookup without total cap retained. Product 412/bulk200 remain candidates; INT-A native412 transport-only; ImportDraft preview-before-confirm, guarded Requirement completion and CAS-scoped If-Match unchanged.

- G5-A: ARCHITECTURE_COMPATIBLE_WITH_CONSTRAINTS_DOCUMENT_ONLY
- G5-B: REVIEW_RETURN_RECEIVED / FINDINGS_OPEN
- G3: NOT_VERIFIED
- G4: PENDING
- G6: REWORK_REQUIRED
- STEP_03B: NOT_AUTHORIZED

Next: obtain official scoped authorization for exact focused Claude F-01..10 payload/model/destination/execution; then actual Claude return, Codex intake and ZCode targeted recheck only. If write approval fails first, none of these files is applied and the response is the provisional handoff. No independent OpenCode QA PASS or architecture/product approval inferred.

Skipped: runtime, Go/PostgreSQL/frontend/build/browser/security/render/performance execution and external dispatch. Risk: all findings and required architecture/render/QA gates remain open.
