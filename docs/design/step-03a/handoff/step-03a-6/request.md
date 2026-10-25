# MATTERCONTROL — MC-003A.6
## CLAUDE CODE ARCHITECTURE COMPATIBILITY REVIEW & DESIGN HANDOFF GATE

### 1. ROLE

Bạn là Codex — Project Manager, Business Analyst và AI SDLC Orchestrator.

Nhiệm vụ: điều phối một vòng Architecture Compatibility Review có phạm vi giới hạn, sử dụng kết quả Antigravity đã được tiếp nhận tại checkpoint `dbcc4a9`.

**Claude Code là Solution Architecture Authority.**

Codex chịu trách nhiệm orchestration, evidence intake, requirements traceability và quality-gate reporting.

Không thay Claude Code tự ký xác nhận architecture compatibility.

### 2. CURRENT BASELINE

Product: **MatterControl — Control Plane for High-Stakes Legal Work**.

Current workstream: `MC-003A`.

Design branch: `task/MC-003A-remediation`.

Approved UX direction:

- D-UX01: Enterprise Precision làm nền, bổ sung impact rail từ B.
- D-UX02: Comfortable mặc định; Compact tùy chọn.
- D-UX03: Critical Blockers và Next Actions ưu tiên; Decision Queue nổi bật.
- D-UX04: Mobile triage/details và simple permitted actions.

Frontend feasibility intake:

- Checkpoint `dbcc4a9`.
- 26 checks PASS.
- 20 Functional Requirements mapped.
- Acceptance Criteria aligned with SRS.
- Two frontend checkouts clean.
- local-r3 baseline hashes preserved.
- Atomic primitives reusable.
- Operational Grid, evidence review, bulk operations và filing cần specialized components.

Important corrections already recorded:

- Candidate stale-revision API uses `412`, not an assumed `409`.
- Candidate bulk API returns `200` with per-row results.
- Dialog unmount is source-observed; actual draft loss and focus returning to body are NOT reproduced.
- Zustand, React Hook Form and wholesale DataTable replacement are NOT mandatory.
- Static contrast corrections do NOT establish computed-contrast PASS.
- Owner-reported model identity, zero-egress and command history are not independently attested.

Current gates:

- MC-003A: REWORK_REQUIRED.
- Rendered validation: UNAVAILABLE / NOT_EXECUTED.
- Independent QA: PENDING.
- Architecture compatibility: PENDING.
- STEP 03B: NOT_AUTHORIZED.

Read the repository to verify this baseline.

### 3. REQUIRED INPUTS

Read:

- `docs/design/step-03a/handoff/step-03a-5/antigravity-intake/intake.md`
- `docs/design/step-03a/design-gate-decision.md`
- `docs/design/step-03a/revised/local-r3/`
- Approved D-UX01–04 decisions.
- Requirements-to-design traceability.
- PRD/SRS.
- Business rules.
- State semantics.
- Permission matrix.
- Three Golden Workflows.
- Approved architecture documents.
- Relevant ADRs.
- API/Auth contracts.
- STEP 02.3/02.4 decisions and current integration scope.

Use actual paths and approved revisions.

Do not infer approved API behavior solely from candidate design mappings.

### 4. ORCHESTRATE CLAUDE CODE

First verify whether Claude Code can be invoked through an authorized integration.

#### If direct invocation is available

Dispatch a focused architecture-review task with:

- Frozen local-r3 design references.
- Antigravity frontend feasibility findings.
- Approved functional requirements.
- Current API/Auth architecture contracts.
- Relevant decisions and ADRs.
- Explicit review questions and acceptance criteria.

Only transfer the authorized minimum necessary context. Verify destination and permissions before any new external payload transfer.

Record actual invocation and returned evidence.

#### If direct invocation is unavailable

Create:

`docs/design/step-03a/handoff/MC-003A-CLAUDE-ARCHITECTURE-REVIEW-PROMPT.md`

Produce a **complete, copy-paste-ready Claude Code prompt** containing all necessary context, artifact paths, scope, review criteria and expected outputs.

Print the FULL prompt in your final response.

Mark the task `WAITING_MANUAL_DISPATCH`, not EXECUTED.

Do not impersonate Claude Code.

### 5. CLAUDE REVIEW SCOPE

Claude Code must review the following architectural compatibility boundaries.

#### A. Frontend Composition

Evaluate whether local-r3 UX can be implemented using the existing Next.js Atomic Design starter.

Examine:

- Component composition.
- Specialized Operational Grid.
- Contextual inspector.
- Evidence review.
- Bulk editing.
- Filing lifecycle UI.
- Design token architecture.
- Comfortable/Compact density.
- Responsive behavior.

Do not require new dependencies without demonstrated need.

#### B. API Contract Compatibility

Compare design expectations against approved API contracts.

Focus on:

- Resource identifiers and `refId`.
- Request/response shape.
- Field presence and truncation.
- Error handling.
- Data loading and pagination.
- Bulk operations.
- Concurrency and stale revisions.
- Retry/idempotency expectations.

Specifically assess the candidate assumptions:

- Stale revision → HTTP `412`.
- Bulk result → HTTP `200` with per-row outcomes.

For each, explicitly classify:

- Already approved contract.
- Compatible proposal.
- Contract conflict.
- Needs technical decision.
- Not applicable to current architecture.

Do not automatically promote a candidate contract into an approved API requirement.

Do not replace existing approved contracts merely to match the UX concept.

#### C. Authentication & Authorization

Evaluate compatibility with:

- OWNER / EDITOR / VIEWER.
- Workspace isolation.
- Matter access.
- Evidence permissions.
- Bulk-operation permissions.
- Sensitive legal data.
- Auditable consequential state changes.

Keep authentication separate from authorization.

Do not mistake STEP 02 INT-A temporary integration harness for production product security.

#### D. Domain Invariants

Ensure frontend behavior cannot incorrectly determine or bypass backend legal state.

Preserve:

- Requirement ≠ Action.
- Evidence Requirement ≠ Evidence.
- COMPLETED ≠ VERIFIED.
- WAITING ≠ BLOCKED.
- Backend-computed dependency readiness.
- Evidence verification rules.
- Document version lineage.
- Filing lifecycle.
- Event History consistency.

#### E. UI State & Interaction Architecture

Review:

- Loading and error states.
- Optimistic-update safety.
- Rollback and conflict handling.
- Bulk partial-success presentation.
- Draft preservation.
- Dialog/drawer lifecycle.
- Focus restoration.
- Keyboard interaction contracts.
- Accessibility responsibilities.

Distinguish source observations from runtime-verified behavior.

Do not claim dialog focus loss or draft loss occurred unless evidence demonstrates it.

#### F. Three Golden Workflows

Verify architectural support for:

1. Transaction / Restructuring.
2. Due Diligence.
3. Regulatory Filing.

Identify the actual API, state and permission dependencies needed for their eventual implementation.

Do not force full P0 feature development into this review.

### 6. ARCHITECTURE COMPATIBILITY MATRIX

For every material design feature, produce:

- Requirement ID.
- Design reference.
- Frontend component/interaction.
- Required backend capability.
- Relevant API contract.
- Authorization requirement.
- Architecture status.
- Evidence.
- Risk.
- Recommended action.
- Responsible agent.

Use statuses:

- COMPATIBLE.
- COMPATIBLE_WITH_CONSTRAINTS.
- CANDIDATE_NOT_YET_APPROVED.
- CHANGE_REQUIRED.
- DEFERRED_TO_IMPLEMENTATION.
- UNKNOWN / NEEDS_EVIDENCE.

An UNKNOWN is not automatically a blocker; evaluate actual impact.

### 7. ARCHITECTURE DECISION MANAGEMENT

If Claude Code finds a conflict:

1. Identify its exact source.
2. Determine whether it is a design assumption, candidate contract or approved architectural invariant.
3. Propose the smallest correction.
4. Identify whether the fix belongs to UX specification, API contract, implementation or infrastructure.
5. Assign an owner.
6. Create an ADR proposal only when a material architectural decision is actually needed.

Preserve existing approvals.

Do not reopen STEP 02.3 documentation clarification without new material evidence.

Do not change Product Owner-approved legal semantics.

### 8. REVIEW QUALITY

Claude Code must distinguish:

- Document compatibility.
- Source compatibility.
- Runtime compatibility.
- Verified security behavior.

If only documents/source are reviewed, return a verdict such as:

`ARCHITECTURE_COMPATIBLE_DOCUMENT_ONLY`

or another accurate project-supported classification.

Do not call it runtime PASS.

Independent UI QA remains a separate gate.

### 9. REQUIRED DELIVERABLES

Create or update:

- Claude Code architecture review report.
- Architecture Compatibility Matrix.
- API/Auth Dependency Matrix.
- Design-to-Architecture Handoff.
- Required ADR proposals, only if justified.
- Implementation constraints for Antigravity.
- Remaining technical questions.
- MC-003A architecture-gate status.

Preserve local-r3 and the prior Antigravity intake evidence.

Do not modify production frontend or backend source.

### 10. CONTROLLED NEXT STEPS

After Claude Code returns:

1. Codex verifies the actual review artifacts.
2. Classifies any critical/high incompatibilities.
3. Assigns remediation only where necessary.
4. Updates requirements/design traceability.
5. Separates architecture compatibility from rendered validation and independent QA.
6. Prepares the next executable design task without crossing unauthorized gates.

If architecture compatibility PASSes at document level, record that achievement without falsely closing the remaining visual/QA gates.

Do not keep generating another full architectural review when no new material issue exists.

### 11. REQUIRED FINAL REPORT

Report:

1. Claude Code invocation status.
2. Actual review owner and evidence.
3. Architecture compatibility verdict.
4. Frontend component feasibility.
5. API contract findings.
6. Auth/authorization findings.
7. Domain invariant coverage.
8. 412/200 candidate-contract disposition.
9. Architecture conflicts and required decisions.
10. Updated artifacts.
11. MC-003A architecture-gate status.
12. Remaining rendered/QA blockers.
13. Exact next task.

If manual dispatch is required, print the COMPLETE Claude Code prompt.

### 12. STOP CONDITIONS

Do not:

- Reopen approved D-UX01–04 decisions without a material contradiction.
- Modify STEP 02 integration worktree.
- Implement frontend production UI.
- Introduce unapproved libraries.
- Change approved API contracts without architecture decision.
- Retry blocked OpenCode automatically.
- Invoke OpenDesign Cloud.
- Bypass browser restrictions.
- Claim independent QA or rendered PASS.
- Mark MC-003A DONE prematurely.
- Begin full STEP 03B.

## FINAL DIRECTIVE

**Review compatibility, not redesign the system.**

Claude Code owns architecture decisions.

Codex owns coordination and traceability.

Antigravity owns eventual frontend implementation.

Preserve MatterControl's approved legal domain semantics and operational usability requirements.

**Control Room for comprehension. Operational Grid for execution.**