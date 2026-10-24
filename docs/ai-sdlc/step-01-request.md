# STEP 01 — MATTERCONTROL BUSINESS ANALYSIS & REQUIREMENTS ENGINEERING

## 1. ROLE

Bạn là Codex, đảm nhiệm:

- Business Analyst — Primary role.
- Project Manager.
- AI SDLC Orchestrator.
- Cloud Engineer và DevOps Engineer ở các phase phù hợp.

Trong Step 01, bạn chịu trách nhiệm chính về Product Requirements, Business Rules, Acceptance Criteria và Requirements Traceability.

### Agent Responsibilities

- **Codex:** Business Analysis, Requirements Engineering, Scope Management, Project Management.
- **Claude Code:** Solution Architect — tư vấn technical feasibility và chuẩn bị nhận architecture handoff.
- **OpenDesign:** UX Consultant — làm rõ usability requirements và operational workflows.
- **ZCode:** Backend Engineering Consultant — hỗ trợ đánh giá testability của business rules.
- **Antigravity:** Frontend Engineering Consultant — hỗ trợ đánh giá workflow feasibility.
- **OpenCode:** Independent QA Reviewer — kiểm tra Step 00A và đánh giá requirements testability.

Không chuyển ownership Business Analysis sang Claude Code.

---

## 2. CURRENT PROJECT STATUS

Official Product:

**MatterControl — Control Plane for High-Stakes Legal Work**

Core Positioning:

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.

Product Principle:

**The System of Operational Truth for Complex Legal Matters.**

Initial Vertical:

Transactions & Corporate Legal Work.

### Current AI SDLC Baseline

Step 00A.1 đã được thực hiện theo báo cáo tại commit:

`20f12fe`

Reported status:

- Step 00A: COMPLETED.
- Step 01: READY_FOR_BUSINESS_ANALYSIS.
- Working tree clean.
- Seven JTBD: 7/7.
- Domain concepts: 19.
- State dimensions: 5.
- P0/P1/P2: 20/14/7.
- Three Golden Workflows documented.
- Project Atlas dataset specified.
- Structural validation passed.
- Independent review: PENDING.
- Task MC-00A: IN_REVIEW.

Không coi các kết quả được báo cáo là evidence mới đã được tự kiểm chứng. Hãy đọc lại artifacts hiện có.

Không chạy lại Product Discovery hoặc Step 00A.

---

## 3. INITIAL ACTION — REVIEW CONTINUITY

Trước khi bắt đầu chi tiết, đọc:

- docs/ai-sdlc/project-status.md
- docs/product/canonical-product-context.md
- docs/product/context-provenance.md
- docs/requirements/p0-p1-p2-priorities.md
- docs/requirements/open-business-decisions.md
- docs/testing/step-00a-validation.md

### Handle Pending Independent Review

Task MC-00A hiện vẫn IN_REVIEW.

Hãy giao OpenCode thực hiện independent review cho:

- Product identity consistency.
- Seven JTBD coverage.
- Domain terminology consistency.
- Five state dimensions.
- P0/P1/P2 completeness.
- Three Golden Workflows.
- Requirements traceability.
- Project Atlas consistency.
- Critical contradictions.

Nếu OpenCode có thể được gọi trực tiếp, thực hiện review và lưu evidence.

Nếu không có direct orchestration, tạo structured review handoff và giữ trạng thái PENDING.

Không tuyên bố independent review hoàn thành khi chưa có kết quả.

Step 01 Business Analysis có thể tiến hành dựa trên approved baseline hiện có trong khi review này đang xử lý.

Nếu review phát hiện Critical/High issues ảnh hưởng baseline, Codex phải xử lý hoặc đánh dấu BLOCKED đối với phần requirements chịu ảnh hưởng.

Chỉ chuyển MC-00A thành DONE khi đạt Definition of Done thực tế.

---

## 4. SOURCE OF TRUTH

Sử dụng các artifacts hiện có trong Git repository:

docs/product/
docs/requirements/
docs/ai-sdlc/

Đặc biệt:

- Canonical Product Context.
- Domain Glossary.
- Three Golden Workflows.
- Project Atlas Dataset.
- P0/P1/P2 Priorities.
- Open Business Decisions.
- Requirements Traceability.

Approved prompts và repository artifacts là baseline hợp lệ.

Không yêu cầu tìm lại hai original ChatGPT documents A/B như điều kiện bắt buộc.

Không viết lại toàn bộ artifacts khi chưa cần thiết.

---

# PART A — PRODUCT REQUIREMENTS DOCUMENT

## 5. PRODUCT DEFINITION

Tạo Product Requirements Document cho MatterControl.

PRD phải bao gồm:

1. Product Vision.
2. Core Positioning.
3. Problem Statement.
4. Target Users.
5. Jobs to Be Done.
6. Value Proposition.
7. Product Principles.
8. Product Scope.
9. MVP Capabilities.
10. Golden Workflows.
11. User Journeys.
12. Business Requirements.
13. UX Requirements.
14. Success Criteria.
15. Risks and Assumptions.
16. Explicit Non-Goals.

### Primary Personas

**Transaction Owner**

Cần nắm:

- Matter state.
- Blockers.
- Milestones.
- Decisions.
- Next actions.
- Evidence gaps.
- Closing readiness.

**Contributor**

Cần:

- My Actions.
- Actionable work.
- Waiting On.
- Owner assignments.
- Due dates.
- Required evidence.
- Efficient bulk editing.

**Reviewer / Manager**

Cần:

- What changed.
- Verification status.
- Risk and exceptions.
- Document versions.
- Critical blockers.
- Decisions required.
- Delta-based Status Brief.

### Seven JTBD

- JTBD-01: Understand current state.
- JTBD-02: Identify blockers.
- JTBD-03: Know the next action.
- JTBD-04: Track dependencies.
- JTBD-05: Prove completion.
- JTBD-06: Preserve history.
- JTBD-07: Report progress.

Mỗi JTBD phải liên kết với business requirements, UX outcomes và acceptance criteria.

---

# PART B — DOMAIN REQUIREMENTS

## 6. LEGAL DOMAIN SEMANTICS

Không thiết kế MatterControl như generic task manager.

Phải phân biệt về nghiệp vụ:

- Matter.
- Workstream.
- Milestone.
- Requirement.
- Action.
- Dependency.
- Evidence Requirement.
- Evidence.
- Document.
- Document Version.
- Filing.
- External Party.
- Entity.
- Decision.
- Finding.
- Risk.
- Legal Question.
- Event History.
- Workspace/Membership.

Không tự thêm hoặc xóa domain concepts chỉ để đạt số lượng cố định.

Sử dụng domain glossary hiện có làm baseline và giải thích quan hệ giữa các khái niệm.

### Requirement vs Action

Requirement là một condition hoặc outcome phải được đáp ứng.

Action là công việc con người thực hiện để đạt outcome đó.

Một Requirement có thể:

- Có nhiều Actions.
- Chưa có Action nào actionable.
- Đang Waiting On external party.
- Được Completed nhưng chưa Verified.
- Bị Blocked bởi Requirement khác.

Không dùng generic Item + JSON metadata làm thay thế mặc định cho các khái niệm này.

---

## 7. FIVE STATE DIMENSIONS

Formalize business semantics cho:

### Execution State

NOT_STARTED
IN_PROGRESS
WAITING
COMPLETED
CANCELLED.

### Verification State

NOT_REQUIRED
UNVERIFIED
PARTIALLY_VERIFIED
VERIFIED
DISPUTED.

### Dependency State

READY
BLOCKED.

### Timing State

ON_TRACK
DUE_SOON
OVERDUE.

### Attention State

NORMAL
ATTENTION
CRITICAL.

Với mỗi chiều:

- Business meaning.
- Applicable objects.
- Transition conditions.
- Allowed transitions.
- Invalid transitions.
- Actors/permissions.
- Side effects.
- Audit events.
- Edge cases.

Không kết luận COMPLETED đồng nghĩa VERIFIED.

Không trộn Waiting với Blocked nếu chúng thể hiện điều kiện nghiệp vụ khác nhau.

Không để frontend tự quyết định critical legal state độc lập với backend.

---

## 8. BUSINESS RULE DECISIONS

Đọc toàn bộ:

docs/requirements/open-business-decisions.md

Với mỗi open decision:

1. Mô tả vấn đề nghiệp vụ.
2. Xác định impacted workflows.
3. Đề xuất alternatives.
4. Đánh giá risks.
5. Đề xuất recommended rule.
6. Xác định acceptance criteria.
7. Đánh dấu decision status.
8. Xác định cần Product Owner approval hay không.

Ưu tiên:

### Dependency Satisfaction

- Requires completion?
- Requires verification?
- Multiple dependencies?
- AND/OR semantics?
- Reopened upstream?
- Cycles?
- Waivers/exceptions?

### Evidence Verification

- Who submits?
- Who reviews?
- Who verifies?
- Can submitter verify own evidence?
- What happens when evidence expires?
- How is verification reversed?

### Milestone Readiness

- What defines milestone readiness?
- Is a percentage appropriate?
- Which prerequisites matter?
- What makes a blocker critical?

### Document Authority

- What is the current authoritative version?
- What happens when a version is superseded?
- How are execution states represented?

### Filing Lifecycle

- What makes a package complete?
- What is submitted vs acknowledged?
- What does Waiting on Authority mean?
- What happens after supplement requests?

### Bulk Operations

- Partial success or atomic operations?
- Validation rules?
- Permissions?
- Audit logging?
- Error reconciliation?

### Historical Reporting

- What is a report draft?
- What is an issued report?
- Which P0 reporting guarantees are required?
- What is deferred to P1 snapshots?

Không tự động approve các quyết định mang tính pháp lý hoặc gây tác động lớn đến product semantics.

---

# PART C — OPERATIONAL MVP

## 9. P0 FUNCTIONAL REQUIREMENTS

Đọc P0 baseline hiện có.

Đặc tả đầy đủ từng capability trong 20 P0 entries đã được ghi nhận.

Tập trung vào:

- Separate State Dimensions.
- Requirement vs Action.
- Next Action.
- Dependency and Blocker Logic.
- Milestones.
- Evidence Requirements.
- Evidence Verification.
- Event History.
- Waiting On.
- My Actions.
- Matter Control Room.
- Operational Grid.
- Bulk Editing.
- Excel/CSV Import.
- Excel Export.
- Document Versions.
- Regulatory Filing Lifecycle.
- Delta-Based Status Brief.
- External Parties.
- Simple Roles and Ownership.

Đối với mỗi P0 capability, tạo:

- Requirement ID.
- Business purpose.
- User persona.
- Functional behavior.
- Inputs.
- Outputs.
- Business rules.
- Validation.
- Error behavior.
- Permission requirements.
- Audit requirements.
- Dependencies.
- Acceptance criteria.

Không âm thầm hạ P0 xuống P1 vì implementation complexity.

Các implementation trade-offs sẽ được đánh giá ở Step 02.

---

## 10. THREE GOLDEN WORKFLOWS

### GW-01 — Transaction / Restructuring

Approval
→ Document
→ Signature
→ Payment
→ Transfer
→ Closing
→ Filing
→ Post-Closing.

### GW-02 — Due Diligence

Request
→ Document
→ Review
→ Gap
→ Finding
→ Follow-Up
→ Resolution.

### GW-03 — Regulatory Filing

Requirement
→ Package Preparation
→ Signature
→ Submission
→ Receipt
→ Authority Review
→ Supplement
→ Response
→ Approval.

Với từng workflow:

- Actors.
- Preconditions.
- Main path.
- Alternative paths.
- Exception paths.
- State transitions.
- Required evidence.
- Relevant documents.
- Permissions.
- Expected outputs.
- Event History.
- Test scenarios.

Đánh dấu rõ phần nào là minimum P0 implementation và phần nào chỉ cần domain compatibility cho future P1.

Ba Golden Workflows phải có acceptance targets thực tế.

Không coi mock screens là hoàn thành workflow.

---

# PART D — REAL-WORLD UX REQUIREMENTS

## 11. UX REQUIREMENTS

MatterControl phải có hai trải nghiệm chính:

### Control Room — Comprehension

Giúp người dùng biết:

- What is true now?
- What changed?
- What is blocked?
- Why is it blocked?
- What needs action?
- Who owns the next action?
- What are we waiting for?
- What evidence is missing?
- What deadline or milestone matters next?

### Operational Grid — Execution

Giúp người dùng:

- Review 50–200 rows.
- Edit inline.
- Use multi-select.
- Apply bulk changes.
- Filter operational work.
- Import Excel/CSV.
- Export Excel.
- Navigate using keyboard.
- Quickly identify missing evidence.
- Distinguish blocked from actionable work.

### Other UX Requirements

- My Actions.
- Waiting On.
- Evidence verification.
- Document version identification.
- Filing process visibility.
- Contextual navigation.
- Desktop-first usability.
- Responsive secondary workflows.
- Accessibility.
- Clear dates and timezones.
- Bilingual-ready system.
- Useful loading/error/empty states.

### North Star

A Manager should be able to understand major Matter state within approximately 10 seconds.

Đây là usability target, không phải một kết quả đã được chứng minh.

OpenDesign sẽ thiết kế chi tiết ở Step 03.

Không tạo high-fidelity UI tại Step 01.

---

# PART E — SECURITY & NON-FUNCTIONAL REQUIREMENTS

## 12. AUTHORIZATION

Proposed MVP roles:

- OWNER.
- EDITOR.
- VIEWER.

Tạo Permission Matrix cho:

- Matter access.
- Requirements.
- Actions.
- Evidence submission.
- Evidence verification.
- Document access.
- Filing updates.
- Bulk editing.
- Import/export.
- Event History.
- Membership management.

Đặc biệt lưu ý:

- Workspace isolation.
- Matter membership.
- Confidential information.
- Sensitive document metadata.
- Audit history.
- Unauthorized state changes.

Không coi demo authentication là đủ cho production readiness.

## 13. NON-FUNCTIONAL REQUIREMENTS

Xác định yêu cầu cho:

- Security.
- Confidentiality.
- Reliability.
- Auditability.
- Data integrity.
- Performance.
- Accessibility.
- Availability expectations.
- Error recovery.
- Localization readiness.
- Date/timezone consistency.
- Testability.
- Maintainability.
- Backup/recovery expectations.

Các NFR phải có measurable acceptance criteria khi có thể.

Không tự bịa các mức SLA, performance metrics hoặc legal compliance guarantees.

Nếu thiếu benchmark, ghi rõ proposed target cần validation.

---

# PART F — TESTABLE REQUIREMENTS

## 14. USER STORIES

Tạo user stories theo:

As a [persona],
I want [capability],
so that [business outcome].

Mỗi story phải có:

- Stable ID.
- Related P0 capability.
- Persona.
- Description.
- Business value.
- Priority.
- Dependencies.
- Acceptance criteria.
- Negative scenarios.

## 15. ACCEPTANCE CRITERIA

Dùng Given/When/Then khi phù hợp.

Ưu tiên các trường hợp:

1. Completed but Unverified.
2. Blocked Requirement.
3. Upstream verification unlocks downstream.
4. Upstream reopening re-blocks dependent work.
5. Invalid dependency cycle.
6. Evidence rejected/expired.
7. Missing required evidence.
8. Superseded document.
9. Filing supplement request.
10. External party Waiting On.
11. Import invalid rows.
12. Duplicate/safe import retry.
13. Bulk update failures.
14. Viewer unauthorized update.
15. Cross-workspace access attempt.
16. Correct audit history.
17. Correct delta-based Status Brief.
18. Concurrent state changes.

OpenCode phải có thể sử dụng các scenarios để tạo automated tests ở các bước tiếp theo.

---

# PART G — AI SDLC TRACEABILITY & HANDOFF

## 16. REQUIREMENTS IDENTIFIERS

Sử dụng:

- BR-xxx: Business Requirement.
- FR-xxx: Functional Requirement.
- NFR-xxx: Non-Functional Requirement.
- RULE-xxx: Business Rule.
- US-xxx: User Story.
- AC-xxx: Acceptance Criterion.

Duy trì:

JTBD
→ Business Requirement
→ Functional Requirement
→ User Story
→ Acceptance Criterion
→ Architecture
→ Design
→ Implementation Task
→ Test Evidence.

Không tạo IDs trùng hoặc thay đổi IDs đã được sử dụng mà không có migration mapping.

## 17. SOLUTION ARCHITECTURE HANDOFF

Tạo handoff cho Claude Code.

Bao gồm:

- Approved requirements.
- Domain glossary.
- Business invariants.
- State transition rules.
- Dependency semantics.
- Evidence semantics.
- Document/version requirements.
- Filing lifecycle.
- Authorization rules.
- Import/export requirements.
- Event History requirements.
- Status Brief requirements.
- NFRs.
- Constraints.
- Open technical questions.

Claude Code sẽ chịu trách nhiệm thiết kế Solution Architecture tại Step 02.

Không tự thiết kế database schema chi tiết hoặc quyết định hosting architecture trong Step 01.

## 18. CLOUDFLARE CONSTRAINTS

Giữ nguyên:

Backend:
https://github.com/lannguyenit598/go-hexa-template

Frontend:
https://github.com/lannguyenit598/nextjs-atomic-starter

Deployment:
Cloudflare Free Tier.

Infrastructure:
Target $0/month for defined MVP workload.

Go/Echo/PostgreSQL compatibility chưa được kiểm chứng.

Không tự ý thay Go backend hoặc PostgreSQL để làm requirements có vẻ khả thi.

Ghi nhận technical blockers cho Claude Code và Codex xử lý tại Step 02.

---

# PART H — DELIVERABLES & QUALITY GATES

## 19. REQUIRED ARTIFACTS

Tạo hoặc cập nhật:

docs/product/product-definition.md
docs/product/product-vision.md
docs/product/jtbd.md
docs/product/user-journeys.md
docs/product/mvp-scope.md

docs/requirements/prd.md
docs/requirements/srs.md
docs/requirements/business-rules.md
docs/requirements/state-semantics.md
docs/requirements/user-stories.md
docs/requirements/acceptance-criteria.md
docs/requirements/permission-matrix.md
docs/requirements/golden-workflow-acceptance.md
docs/requirements/open-business-decisions.md

docs/architecture/solution-architecture-handoff.md

docs/ai-sdlc/requirements-traceability.md
docs/ai-sdlc/risk-register.md
docs/ai-sdlc/project-status.md

Nếu file đã tồn tại, đọc trước khi chỉnh sửa.

Không tạo tài liệu trùng lặp không cần thiết.

## 20. REQUIREMENTS QUALITY REVIEW

Codex tự kiểm tra:

- P0 coverage.
- JTBD coverage.
- Domain consistency.
- Business rule consistency.
- Testability.
- Acceptance criteria quality.
- Permission coverage.
- Golden Workflow coverage.
- UX requirements.
- Traceability.
- Open decisions.

Yêu cầu OpenCode thực hiện testability review nếu khả dụng.

Yêu cầu Claude Code tư vấn architecture feasibility nếu cần, nhưng không chuyển toàn bộ architecture design sang Step 01.

Phân biệt independent review thực tế với review handoff đang pending.

## 21. QUALITY GATE — STEP 01

Step 01 đạt khi:

- PRD đủ rõ.
- SRS đầy đủ.
- 20 P0 capabilities có requirements coverage.
- Seven JTBD được trace.
- Domain semantics nhất quán.
- Critical business rules được đặc tả.
- Three Golden Workflows testable.
- Permission matrix rõ.
- Acceptance criteria measurable.
- Critical open business decisions được giải quyết hoặc đưa ra approval gate.
- Architecture handoff sẵn sàng.
- Requirements traceability cập nhật.

Không chuyển Step 01 thành DONE nếu còn các business decisions quan trọng chưa được phê duyệt.

## 22. FINAL REPORT

Báo cáo:

1. PRD Summary.
2. SRS Summary.
3. P0 Requirements Coverage.
4. Seven JTBD Coverage.
5. Business Rules & State Transitions.
6. Three Golden Workflow Specifications.
7. Permission Matrix.
8. Acceptance Criteria Coverage.
9. Open Business Decisions.
10. Technical Risks for Claude Code.
11. MC-00A Independent Review Status.
12. Step 01 Quality Gate Status.
13. Step 02 Architecture Readiness.

## 23. STOP CONDITION

Không coding frontend/backend.

Không tạo high-fidelity UI.

Không tự triển khai Solution Architecture.

Không deploy.

Không tự động chuyển sang Step 02.

Dừng tại Product Requirements Approval Gate.

## FINAL DIRECTIVE

MatterControl must model the truth of legal work, not merely display tasks.

Prioritize:

- Operational correctness.
- Trust.
- Legal domain semantics.
- Evidence-based verification.
- Dependency consistency.
- Auditability.
- Bulk productivity.
- Outstanding usability.

Preserve the approved MatterControl identity, P0/P1/P2 baseline and three Golden Workflows.