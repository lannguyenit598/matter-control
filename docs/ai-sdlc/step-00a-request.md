# STEP 00A — MATTERCONTROL CANONICAL PRODUCT CONTEXT

## ROLE

Bạn là Codex — Business Analyst, Product Requirements Owner và Project Manager.

Áp dụng AI SDLC Operating Model từ Step 00.

## APPROVED PRODUCT IDENTITY

**Name:** MatterControl

**Positioning:** Control Plane for High-Stakes Legal Work

**Core positioning:**

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.

**Product principle:**

The System of Operational Truth for Complex Legal Matters.

Đây là sản phẩm đã được chọn. Không chạy lại Idea Discovery.

## INPUT DOCUMENTS

Đọc đầy đủ hai tài liệu Product Owner cung cấp:

### Document A

Control Plane for High-Stakes Work — Initial Product Definition.

Bao gồm product thesis, JTBD, initial MVP, operational states, dependencies, evidence và Project Atlas demo.

### Document B

MatterControl — Product Reality & Legal Workflow Context.

Đây là addendum được Product Owner chấp thuận và có ưu tiên cao hơn đối với legal domain semantics và MVP capability priorities.

Nếu tài liệu chưa có trong workspace, chỉ rõ tài liệu thiếu trước khi kết luận context đã được consolidated.

Không tự tạo lại nội dung tài liệu từ giả định.

## OBJECTIVE

Tạo Canonical Product Context cho toàn bộ AI SDLC.

Giữ nguyên:

- Product positioning.
- Initial vertical.
- Core JTBD.
- Operational state thesis.
- Evidence-based verification.
- Deterministic reporting.
- Event History.
- Cloudflare Free Tier constraints.
- Existing GitHub templates.

Khi có xung đột giữa initial MVP và Product Reality Addendum, ưu tiên addendum mới; ghi rõ delta và những trade-offs cần phê duyệt.

## TASK 1 — DOMAIN CONSOLIDATION

Chuẩn hóa các khái niệm:

- Workspace.
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

Không gộp Requirement và Action thành generic Task.

Không sử dụng generic metadata blob để thay thế các domain semantics quan trọng.

Phân biệt core P0, P1 extensions và P2 future capabilities.

## TASK 2 — STATE SEMANTICS

Chuẩn hóa:

### Execution State

NOT_STARTED / IN_PROGRESS / WAITING / COMPLETED / CANCELLED.

### Verification State

NOT_REQUIRED / UNVERIFIED / PARTIALLY_VERIFIED / VERIFIED / DISPUTED.

### Dependency State

READY / BLOCKED — preferably computed.

### Timing State

ON_TRACK / DUE_SOON / OVERDUE.

### Attention State

NORMAL / ATTENTION / CRITICAL.

Không mặc định COMPLETED đồng nghĩa VERIFIED.

Các transition rules quan trọng cần được xác định ở Step 01.

## TASK 3 — P0/P1/P2 BASELINE

### P0 — Operational MVP

- Requirement vs Action.
- Milestones.
- Next Action.
- Waiting On.
- Dependencies.
- Evidence Requirements.
- Evidence verification.
- Event History.
- Control Room.
- My Actions.
- Operational Grid.
- Bulk editing.
- Excel/CSV import.
- Excel export.
- Document versions.
- Filing lifecycle.
- External parties.
- Simple roles.
- Delta-based Status Brief.

### P1 — Legal Domain Depth

- Legal authorities.
- Legal propositions.
- Open Legal Questions.
- Structured Decisions.
- Entity master.
- Temporal relationships.
- Ownership provenance.
- Advanced Findings/Risks.
- Signature tracking.
- Advanced filing packages.
- Power of Attorney.
- Saved views.
- Management-ready exports.
- Historical report snapshots.

### P2 — Future Intelligence

- Beneficial ownership graph.
- Regulatory change impact.
- Recurring compliance.
- AI-assisted extraction.
- Grounded AI Matter Assistant.
- Contradiction detection.
- Advanced risk intelligence.

Không âm thầm loại bỏ P0.

Không tự kéo toàn bộ P1/P2 vào MVP.

## TASK 4 — THREE GOLDEN WORKFLOWS

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

Ba workflows là acceptance targets của operational MVP.

Phân biệt early vertical slice, internal alpha và full MVP.

## TASK 5 — USER EXPERIENCE CONTEXT

MatterControl cần hai trải nghiệm bổ trợ:

### Control Room

Dành cho comprehension, exception management, blockers, milestones và decisions.

### Operational Grid

Dành cho execution, bulk editing, dense information, import/export và power users.

Bổ sung:

- My Actions.
- Waiting On.
- Contextual details.
- Dependency View.
- Document version awareness.
- Delta-based Status Brief.

Desktop-first.

Mobile hỗ trợ các thao tác phù hợp, không bắt buộc full feature parity.

Ưu tiên usability, operational correctness và keyboard efficiency.

Không biến sản phẩm thành legal-themed Jira hoặc một dashboard trang trí.

## TASK 6 — PRODUCT REALITY DATASET

Specification cho:

Project Atlas — Acquisition & Corporate Restructuring.

Dataset:

- 5–6 Workstreams.
- 3 Milestones.
- 20–30 Requirements/Actions.
- 5–8 Dependencies.
- 5 Documents và nhiều versions.
- 3 External Parties.
- 2 Filing Processes.
- Evidence Requirements.
- 2 Open Decisions.
- 1–2 Findings.
- 1 Risk.
- 1 Critical Blocker Chain.

Bao gồm các trường hợp:

- Completed + Verified.
- Completed + Unverified.
- Blocked.
- Waiting.
- Overdue.
- Missing evidence.
- Superseded document.
- Partially signed document.
- Filing waiting on authority.

Chỉ dùng synthetic data.

## TASK 7 — REQUIREMENTS DELTA ANALYSIS

So sánh hai documents.

Làm rõ:

1. Generic Item vs Requirement/Action.
2. Initial seven modules vs expanded P0.
3. One initial golden journey vs three workflows.
4. Evidence attachment vs evidence requirements.
5. Simple documents vs version lineage.
6. Minimal tracker vs Excel import/export, bulk editing.
7. Status changes vs auditable domain history.
8. Go/PostgreSQL vs Cloudflare Free Tier feasibility.

Không tự ý bỏ những requirements quan trọng vì implementation complexity.

## ARTIFACTS

- docs/product/source-brief.md
- docs/product/product-reality-addendum.md
- docs/product/canonical-product-context.md
- docs/product/domain-glossary.md
- docs/product/three-golden-workflows.md
- docs/product/project-atlas-dataset.md
- docs/requirements/requirements-delta-analysis.md
- docs/requirements/p0-p1-p2-priorities.md
- docs/requirements/open-business-decisions.md
- docs/ai-sdlc/scope-rebaseline.md

Cập nhật risk register, decision log và project status.

## QUALITY GATE

- Product identity preserved.
- Both briefs consolidated.
- Domain terminology reconciled.
- P0/P1/P2 boundaries documented.
- Three Golden Workflows documented.
- Requirements conflicts reported.
- Open decisions identified.
- Step 01 inputs ready.

## STOP CONDITION

Không code.
Không thiết kế solution architecture.
Không tạo high-fidelity UI.
Không deploy.

Coi product direction và P0 capability baseline là đã được Product Owner chấp thuận.

Chỉ xin approval thêm nếu phát hiện xung đột hoặc trade-off thực sự ảnh hưởng đến product semantics, MVP release criteria hoặc infrastructure constraints.

Báo cáo Canonical Product Context và Step 01 readiness rồi dừng.