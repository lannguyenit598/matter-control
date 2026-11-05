# MATTERCONTROL — MC-003A.8A
## APPROVAL-SAFE REVIEW INTAKE & TARGETED CONTRACT FINDINGS RESOLUTION

Bạn là Codex — Project Manager, Business Analyst và AI SDLC Orchestrator của MatterControl.

Nhiệm vụ: tiếp nhận kết quả ZCode document-only review, xử lý 11 findings theo đúng ownership và bảo vệ governance khi approval mechanism đang bị chặn.

**Không mở thêm một vòng review toàn bộ 32 operations.**

## 1. BASELINE

Product: MatterControl — Control Plane for High-Stakes Legal Work.

Worktree: `task/MC-003A-remediation`.

Contract baseline checkpoint: `97356ce`.

Reviewed contract index:

`docs/design/step-03a/handoff/step-03a-7/current-reviewed-read-set.json`

Reported ZCode review:

`PASS_WITH_LIMITATIONS — DOCUMENT_ONLY`

Evidence reported:

- 32 operations covered.
- 22 scenarios classified:
  - 16 TESTABLE.
  - 4 NEED_CLARIFICATION.
  - 1 NEED_FIXTURE.
  - 1 NEED_STORAGE_DECISION.
- 8 QA question dispositions.
- 11 findings: 4 Medium, 7 Low.
- No runtime execution.
- Original contract/addendum baseline remains preserved.

Important:

The review has NOT yet been formally committed into the MC-003A intake because the normal automatic approval mechanism encountered a usage-limit blocker.

Do not claim that the intake was saved or a new checkpoint commit exists.

Verify accessible read-only evidence without violating existing access restrictions.

## 2. FIRST PRIORITY — GOVERNANCE SAFETY

Before any mutation or agent dispatch:

1. Check the actual status of the official approval mechanism.
2. Determine which operations are permitted now.
3. Do not interpret usage-limit failure as permission to switch tools or routes.
4. Do not attempt alternate write mechanisms to bypass blocked approval.
5. Do not automatically retry paid/external services.
6. Do not create a Git commit while write authorization remains blocked.
7. Do not dispatch new model payloads without the applicable scope authorization.

If approval is still blocked:

- Preserve the current report as provisional session evidence.
- Produce a read-only findings disposition plan in the response.
- Prepare proposed documentation changes without applying them.
- Identify the official approval prerequisite.
- Stop before mutation, dispatch or commit.

A pending approval does not imply rejection of the technical review, but it does prohibit treating unapproved execution as completed.

## 3. ACCOUNT FOR THE 18-FILE REVIEW ALLOWLIST

ZCode reportedly read:

- `dependency-engine.md`.
- Additional content via grep outside the approved 18-file allowlist.

Record a scope-deviation observation.

Distinguish:

- Files accessed locally.
- Content actually included in model context.
- Content transmitted to an external provider.
- Information supported only by reviewer self-report.
- Information not independently verifiable.

Do not claim verified data egress or verified zero-egress without evidence.

Do not retroactively approve the expanded scope.

Do not send the extra material to Claude or another model merely because ZCode previously accessed it.

If resolving a finding genuinely requires an additional file, prepare a minimal payload expansion with:

- Exact file path.
- Reason.
- Needed sections.
- Destination/model.
- Permission requirements.
- Estimated cost, when known.

Use the official approval route before transmission.

## 4. F-01 THROUGH F-10 — TARGETED CLAUDE REVIEW

Claude Code is the architecture authority for the technical contract questions.

Prepare a focused handoff for F-01 through F-10 only.

The handoff must address the precise findings relating to:

- Bidirectional pagination.
- Reason/status vocabularies.
- Exclusion precedence.
- Nullability.
- Deterministic ordering.
- Malformed identifiers.
- Embedded arrays.

Read each original finding to obtain its actual details; do not invent mappings between these topics and finding IDs.

For every finding, include:

- Finding ID and severity.
- Exact contract reference.
- Current candidate behavior.
- Ambiguity or contradiction.
- Applicable approved requirement.
- Proposed minimal resolution.
- Alternatives and consequences.
- Contract compatibility impact.
- Whether a new architecture decision is required.
- Acceptance criteria.
- Candidate versus approved status.

Avoid a full architecture rereview.

Claude may recommend revisions, but a returned technical recommendation is not automatically formal Product Owner or architecture approval where separate authorization is required.

Dispatch only when the relevant model, destination, payload and execution permissions are actually in place.

If unavailable, output a complete copy-paste-ready Claude handoff and mark `READY_NOT_DISPATCHED`.

## 5. F-11 — CODEX FIXTURE CORRECTION

Codex owns F-11.

Reported issue:

The proposed MS-02 fixture uses prerequisite RQ-08, but the current dependency graph does not establish the claimed critical chain from RQ-04.

Additionally, `rootCause` and due-date values can influence the expected ordering.

Required actions:

1. Reconstruct the fixture graph from the actual approved dependency rules.
2. List nodes, edges, direction and prerequisite meaning.
3. Verify whether a valid dependency path exists from RQ-04 to the asserted downstream item.
4. Do not invent a missing edge merely to make the expected result pass.
5. Identify the actual inputs used by the ordering algorithm.
6. Distinguish critical-chain designation, rootCause and due-date ordering effects.
7. Determine whether the current expected result is under-specified or incorrect.
8. Propose the smallest valid fixture correction.

### Fixture Acceptance Rules

- Graph must be acyclic.
- References must use canonical IDs.
- Dependency direction must be correct.
- Expected blocker/root-cause behavior must match approved rules.
- Ordering expectations must identify all relevant sort inputs.
- Expected result must be deterministic under specified conditions.

If the intended test is to isolate critical-chain influence, explicitly control the other ordering variables instead of assuming they have no effect.

If multiple outcomes remain possible, mark the assertion `NEEDS_CLARIFICATION` rather than fabricating a unique expected order.

Do not alter production dependency semantics to make a test fixture pass.

## 6. CLASSIFY THE 22 SCENARIOS

Preserve all existing scenario IDs.

Create a disposition matrix:

| Category | Count | Required action |
|---|---:|---|
| Testable as specified | 16 | Preserve; no runtime claim |
| Contract clarification | 4 | Map to specific findings and owner |
| Fixture clarification | 1 | Resolve through F-11 |
| Storage decision | 1 | Identify architecture decision and dependency |

Do not assume all four contract clarifications are resolved merely because Claude produced an addendum.

The storage-dependent scenario remains open until the authoritative storage design is established.

All 22 scenarios must remain `NOT_RUN`.

Do not start Go, PostgreSQL, frontend integration or runtime tests in this task.

## 7. PROCESS THE EIGHT QA QUESTIONS

Preserve the original eight question IDs and dispositions.

Where a QA answer depends on a finding, record:

`ANSWER_CONDITIONAL_ON_FINDING_RESOLUTION`

Do not mark the question unconditionally closed.

Update each question's status only when the supporting contract evidence actually exists.

Avoid creating new QA questions unless a material issue has been discovered.

## 8. REVIEW RETURN AND RECHECK

After permissions are available and the targeted corrections are made:

### Claude Code

Owns the relevant architecture/contract clarifications for F-01..F-10.

### Codex

Owns F-11 fixture correction, traceability and review intake.

### ZCode

Performs a **targeted recheck** of corrected findings only.

Do not ask ZCode to repeat its entire 32-operation review unless the correction materially changes the wider contract set.

For every rechecked finding, require:

- Before/after reference.
- Exact correction.
- Supporting evidence.
- Reviewer disposition.
- Remaining limitation.

If independent QA is still mandatory, the ZCode recheck does not substitute for OpenCode or the formally designated independent reviewer.

## 9. CONTRACT FREEZE RULE

Preserve:

- The 32-operation reviewed read set.
- Claude addendum.
- Superseded-rejection history.
- Product candidate status for stale-revision `412`.
- Product candidate status for bulk `200` with per-row results.
- Native INT-A `412` as transport-only scope.
- Import Draft as preview before confirm.
- Guarded Requirement completion.
- CAS-scoped `If-Match`.
- External Party point lookup.
- Evidence Claim parent envelope.
- Workstream point lookup without arbitrary total limit.

Do not silently promote reviewed candidates into approved product API contracts.

Do not modify STEP 02 INT-A worktree.

## 10. COMMIT AND INTAKE — ONLY AFTER AUTHORIZATION

Once the official approval mechanism demonstrably permits writes:

1. Save the ZCode review intake.
2. Preserve original reviewer artifacts.
3. Record 11 findings and their ownership.
4. Record the reported allowlist expansion.
5. Record the limitation on provider/model, cost and egress verification.
6. Link findings to the 22 scenario classifications.
7. Save the F-11 fixture correction if actually completed.
8. Save authorized Claude review returns if actually received.
9. Run focused document/integrity checks.
10. Commit in the MC-003A worktree according to project conventions.

Do not backdate a commit or describe a prepared change as committed.

If permission remains unavailable, return the proposed changes in the response and stop safely.

## 11. QUALITY GATE STATUSES

Maintain separate results:

**G5-A — Claude Architecture Compatibility**

`ARCHITECTURE_COMPATIBLE_WITH_CONSTRAINTS_DOCUMENT_ONLY`

**G5-B — Contract/Testability Review**

`REVIEW_RETURN_RECEIVED / FINDINGS_OPEN`

ZCode's document-level verdict does not establish independent OpenCode approval.

**G3 — Rendered UX**

`NOT_VERIFIED`

**G4 — Independent Design QA**

`PENDING`

**G6 — Overall MC-003A Closure**

`REWORK_REQUIRED`

**STEP 03B**

`NOT_AUTHORIZED`

Only change these based on new evidence and applicable approval rules.

## 12. FINAL RESPONSE FORMAT

Report:

### A. Governance
- Approval mechanism status.
- Whether writes/dispatch were authorized.
- Intake saved or pending.
- Exact scope-deviation record.

### B. Review Findings
- F-01..F-10 Claude handoff readiness.
- F-11 graph/fixture disposition.
- Severity and unresolved count.

### C. Scenario Status
- 16 testable.
- 4 clarification.
- 1 fixture.
- 1 storage.
- All runtime `NOT_RUN`.

### D. QA Questions
- Eight question statuses and conditional dependencies.

### E. Execution Evidence
- Actual tools invoked.
- Actual reviews performed.
- Actual files changed.
- Commits, only if created.

### F. Quality Gates
- G5-A.
- G5-B.
- G3.
- G4.
- G6.
- STEP 03B.

### G. Next Action

Give one concrete, authorized next action.

If the approval mechanism remains blocked, explain the precise prerequisite for proceeding without suggesting a bypass.

## STOP CONDITIONS

No unauthorized write or Git commit.

No alternate path around blocked automatic approval.

No new external payload without authorization.

No repeated full architecture review.

No repeated full ZCode review.

No production code implementation.

No Go/PostgreSQL/runtime execution.

No claims of independent QA PASS.

No MC-003A DONE.

No STEP 03B.

## FINAL DIRECTIVE

**Resolve the real findings, not the entire architecture again.**

Keep governance and technical evidence separate.

Claude handles material contract decisions.

Codex owns the fixture and orchestration.

ZCode verifies only corrected findings.

Respect the approval gate, preserve the 32-operation baseline and advance only through genuinely authorized execution.