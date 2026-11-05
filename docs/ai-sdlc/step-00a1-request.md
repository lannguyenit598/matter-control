# STEP 00A.1 — MATTERCONTROL CONTEXT BASELINE VALIDATION & CLOSURE

## 1. ROLE

Bạn là Codex, đảm nhiệm:

- Project Manager.
- Business Analyst.
- AI SDLC Orchestrator.
- Cloud Engineer.
- DevOps Engineer.

Trong bước này, bạn đóng vai Business Analyst và Project Manager để hoàn thiện Step 00A, xác nhận Product Context Baseline và chuẩn bị chuyển sang Step 01 — Business Analysis & Requirements Engineering.

Không implement product features.

---

## 2. IMPORTANT CONTEXT CORRECTION

Repository MatterControl ban đầu là một **empty project**.

Hai tài liệu:

- Document A — Control Plane for High-Stakes Work.
- Document B — MatterControl: Product Reality & Legal Workflow Context.

được Product Owner xây dựng trong các cuộc trò chuyện với ChatGPT trước khi khởi tạo repository.

**Hai tài liệu này chưa từng được lưu vào repository hoặc Codex workspace.**

Vì vậy:

- Không tìm kiếm lại hai file A/B như thể chúng phải tồn tại trong Git.
- Không coi việc thiếu hai file là lỗi repository.
- Không bắt buộc import nguyên văn A/B mới được chuyển Step 01.
- Không tái tạo nội dung nguyên văn A/B bằng suy đoán.
- Không tuyên bố đã đối chiếu trực tiếp với A/B nếu chưa nhận được nội dung đầy đủ.

Các requirements và Product Context đã được Product Owner chuyển giao thông qua các prompts Step 00/00A trước đó.

**Product Owner xác nhận những quyết định sản phẩm được truyền đạt trong các prompts này là nguồn đầu vào hợp lệ để tạo Product Baseline ban đầu.**

Việc không có file A/B gốc KHÔNG tự động khiến Step 01 bị BLOCKED.

---

## 3. CURRENT REPOSITORY STATUS

Step 00A đã có kết quả tại commit:

`b5224ce`

Theo báo cáo trước đó:

- Canonical Product Context đã được tạo.
- Domain terminology đã được tổng hợp.
- Five State Dimensions đã được xác định.
- P0/P1/P2 baseline đã được lập.
- Three Golden Workflows đã được bổ sung.
- Project Atlas synthetic dataset đã được đặc tả.
- Requirements Delta Analysis đã được tạo.
- Open Business Decisions đã được ghi nhận.
- Governance và Traceability đã được cập nhật.
- Structural validation và internal links đã được kiểm tra.

Báo cáo trước đó ghi:

`Step 01 Readiness: BLOCKED`

Lý do chính:

`Source A/B: MISSING`

Hãy đánh giá lại trạng thái này theo Project Owner clarification mới.

Không giả định các kết quả trước đó đều chính xác tuyệt đối; hãy kiểm tra các artifacts hiện có.

Không làm lại Step 00A từ đầu.

---

## 4. APPROVED PRODUCT IDENTITY

**Name:** MatterControl

**Positioning:** Control Plane for High-Stakes Legal Work

**Official Core Positioning:**

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.

**Product Principle:**

The System of Operational Truth for Complex Legal Matters.

**Initial Vertical:**

Transactions & Corporate Legal Work.

Product Discovery đã kết thúc.

Không đổi tên, positioning hoặc product direction.

---

## 5. APPROVED PRODUCT CONTEXT BASELINE

Sử dụng các quyết định dưới đây để kiểm tra tính đầy đủ của Canonical Product Context.

### 5.1 Core Value

MatterControl giúp legal và transaction teams:

- Understand current matter state.
- Identify blockers.
- Know next actions.
- Track dependencies.
- Understand Waiting On.
- Verify evidence.
- Track decisions.
- Preserve change history.
- Generate status updates.
- Reduce operational uncertainty.

MatterControl không phải:

- Generic task manager.
- Legal-themed Jira.
- Spreadsheet replacement đơn thuần.
- Virtual data room.
- Legal AI chatbot.
- Generic workflow builder.

### 5.2 Seven Core Jobs to Be Done

JTBD-01 — Understand current state.

JTBD-02 — Identify blockers.

JTBD-03 — Know the next action.

JTBD-04 — Track dependencies.

JTBD-05 — Prove completion.

JTBD-06 — Preserve history.

JTBD-07 — Report progress.

Kiểm tra xem cả bảy JTBD đã có trong Canonical Product Context hoặc artifacts liên quan hay chưa.

Nếu thiếu, bổ sung dựa trên approved baseline này.

### 5.3 Core Domain Concepts

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

Phải bảo toàn ý nghĩa nghiệp vụ của từng khái niệm.

### 5.4 Five State Dimensions

**Execution State**

- NOT_STARTED.
- IN_PROGRESS.
- WAITING.
- COMPLETED.
- CANCELLED.

**Verification State**

- NOT_REQUIRED.
- UNVERIFIED.
- PARTIALLY_VERIFIED.
- VERIFIED.
- DISPUTED.

**Dependency State**

- READY.
- BLOCKED.

**Timing State**

- ON_TRACK.
- DUE_SOON.
- OVERDUE.

**Attention State**

- NORMAL.
- ATTENTION.
- CRITICAL.

Không đồng nhất COMPLETED với VERIFIED.

Dependency State phải được xác định bằng business logic thay vì chỉ dùng để trang trí UI.

Các transition rules và guard conditions chi tiết sẽ được formalize trong Step 01 và thiết kế kỹ thuật ở Step 02.

### 5.5 P0 Operational MVP

Baseline P0 gồm các năng lực:

- Requirement vs Action.
- Separate State Dimensions.
- Next Action.
- Dependencies and Blocker Logic.
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

Một số capabilities có thể được nhóm thành các mục chung trong documents; kiểm tra coverage theo nội dung, không chỉ đếm số hàng.

Không tự ý loại bỏ P0.

### 5.6 P1 Legal Domain Depth

- Legal Authorities.
- Legal Propositions.
- Open Legal Questions.
- Structured Decisions.
- Entity Master.
- Temporal Entity Relationships.
- Ownership Provenance.
- Advanced Findings and Risks.
- Signature Tracking.
- Advanced Filing Packages.
- Power of Attorney.
- Saved Views.
- Management-Ready Export.
- Historical Report Snapshots.

### 5.7 P2 Future Capabilities

- Beneficial Ownership Graph.
- Regulatory Change Impact.
- Recurring Compliance.
- AI-Assisted Document Extraction.
- Grounded AI Matter Assistant.
- Source Contradiction Detection.
- Advanced Risk Intelligence.

Không đưa P1/P2 vào P0 một cách tự động.

### 5.8 Three Golden Workflows

**GW-01 — Transaction / Restructuring**

Approval
→ Document
→ Signature
→ Payment
→ Transfer
→ Closing
→ Filing
→ Post-Closing.

**GW-02 — Due Diligence**

Request
→ Document
→ Review
→ Gap
→ Finding
→ Follow-Up
→ Resolution.

**GW-03 — Regulatory Filing**

Requirement
→ Package Preparation
→ Signature
→ Submission
→ Receipt
→ Authority Review
→ Supplement
→ Response
→ Approval.

Ba Golden Workflows là mục tiêu kiểm chứng nghiệp vụ của operational MVP.

Phân biệt implementation tối thiểu P0 với advanced capabilities thuộc P1.

### 5.9 Product UX Direction

MatterControl cần hai trải nghiệm cốt lõi:

**Control Room — Comprehension**

Giúp Manager nhanh chóng hiểu:

- Current matter state.
- Critical blockers.
- Next actions.
- Waiting On.
- Upcoming milestones.
- Missing evidence.
- Decisions.
- Recent changes.

**Operational Grid — Execution**

Giúp Contributor:

- Work with many records.
- Perform bulk actions.
- Use inline editing.
- Import existing trackers.
- Export useful tables.
- Navigate efficiently with keyboard.
- Work without excessive context switching.

Desktop-first.

Responsive support cho những workflows phù hợp.

UI/UX quality nghĩa là người dùng hiểu công việc nhanh hơn và giảm sai sót, không phải có nhiều animation.

### 5.10 Project Atlas Dataset

Synthetic demo:

Project Atlas — Acquisition & Corporate Restructuring.

Dataset mục tiêu:

- 5–6 Workstreams.
- 3 Milestones.
- 20–30 Requirements/Actions.
- 5–8 Dependencies.
- Approximately 5 Documents.
- Multiple Document Versions.
- External Parties.
- Filing Processes.
- Evidence Requirements.
- Decisions.
- Findings.
- Risks.
- Critical Blocker Chain.

Phải có các trạng thái:

- Completed + Verified.
- Completed + Unverified.
- Blocked.
- Waiting.
- Overdue.
- Missing Evidence.
- Superseded Document.
- Partially Signed Document.
- Filing Waiting on Authority.

Dataset sử dụng synthetic data, không có tài liệu pháp lý bảo mật.

---

## 6. TASK 1 — REVIEW EXISTING ARTIFACTS

Đọc:

- docs/product/canonical-product-context.md
- docs/product/domain-glossary.md
- docs/product/three-golden-workflows.md
- docs/product/project-atlas-dataset.md
- docs/requirements/p0-p1-p2-priorities.md
- docs/requirements/requirements-delta-analysis.md
- docs/requirements/open-business-decisions.md
- docs/ai-sdlc/project-status.md
- docs/ai-sdlc/risk-register.md

Đối chiếu với approved product context được cung cấp trong prompt này.

Kiểm tra:

- Identity.
- JTBD.
- Domain semantics.
- State Dimensions.
- P0/P1/P2.
- Golden Workflows.
- Project Atlas.
- UX direction.
- Cloudflare constraints.
- AI SDLC ownership.

Phân loại:

- COVERED.
- PARTIALLY_COVERED.
- MISSING.
- CONFLICT.
- REQUIRES_STEP_01_ANALYSIS.

Không thay thế các yêu cầu đã được phê duyệt bằng assumptions mới.

---

## 7. TASK 2 — FIX SOURCE PROVENANCE

Cập nhật trạng thái nguồn tài liệu cho đúng thực tế.

Không sử dụng:

`SOURCE A/B MISSING → PROJECT BLOCKED`

Thay bằng một phân loại phản ánh thực tế:

`ORIGINAL_BRIEFS_NOT_IN_REPOSITORY_BY_DESIGN`

và:

`PRODUCT_CONTEXT_PROVIDED_VIA_APPROVED_PROMPTS`

Ghi nhận rõ:

- Initial repository là project trống.
- Product Owner đã cung cấp context thông qua ChatGPT/Codex prompts.
- Canonical Product Context được tổng hợp từ những chỉ thị được phê duyệt.
- Không có direct source-to-original-file verification.
- Điều này không đồng nghĩa requirements không hợp lệ.
- Verbatim archival của hai tài liệu gốc là optional provenance enhancement, không phải Step 01 hard gate.

Tạo hoặc cập nhật:

docs/product/context-provenance.md

Không tạo file mang tên original-product-brief.md chứa nội dung AI tự tổng hợp rồi trình bày như bản gốc.

Nếu sau này Product Owner cung cấp original documents, có thể archive và đối chiếu bổ sung.

---

## 8. TASK 3 — VALIDATE BASELINE

Kiểm tra:

1. Product Identity đã thống nhất chưa?
2. Seven JTBD đã được bảo toàn chưa?
3. Domain concepts đã đầy đủ chưa?
4. Five State Dimensions có nhất quán không?
5. Requirement vs Action có được phân biệt không?
6. Evidence Requirement khác Actual Evidence không?
7. P0 capability coverage có đầy đủ không?
8. Three Golden Workflows có đầy đủ không?
9. Project Atlas dataset có đáp ứng độ phức tạp đã chốt không?
10. Open Decisions đã được ghi nhận chưa?
11. Cloudflare constraints có được giữ nguyên không?
12. Agent ownership có đúng không?

Nếu thiếu, sửa artifacts tương ứng.

Không cần khởi tạo lại toàn bộ documentation.

---

## 9. TASK 4 — OPEN BUSINESS DECISIONS

Phân loại những nội dung chưa có business rules cuối cùng:

- Dependency satisfaction.
- Completion vs verification.
- Evidence verifier permissions.
- Verification reversal.
- Readiness calculations.
- Requirement cancellation/waiver.
- Document authority/current version.
- Filing lifecycle transitions.
- Bulk operation behavior.
- Report snapshot semantics.

Đánh dấu:

`TO_BE_ANALYZED_IN_STEP_01`

trừ khi đây là quyết định đã được Product Owner chốt.

Step 01 chính là giai đoạn để phân tích và formalize những business rules này.

Không chặn Step 01 chỉ vì business rules chưa được phân tích chi tiết.

Chỉ đánh dấu BLOCKED nếu còn thiếu quyết định về product direction hoặc approved scope khiến BA không thể tiếp tục.

---

## 10. TASK 5 — UPDATE STEP 00A QUALITY GATE

Áp dụng Exit Criteria phù hợp với một project khởi tạo từ empty repository.

Step 00A đạt khi:

- Official product identity confirmed.
- Canonical Product Context exists.
- Domain terminology documented.
- Seven JTBD preserved.
- Five State Dimensions documented.
- P0/P1/P2 capability baseline documented.
- Three Golden Workflows documented.
- Project Atlas specification created.
- Requirements Delta Analysis recorded.
- Open Business Decisions tracked.
- Risk Register updated.
- Step 01 input artifacts are usable.

Original documents A/B are NOT mandatory files for this gate.

Independent review nếu chưa thực hiện phải ghi đúng trạng thái Pending, không giả vờ đã hoàn thành.

Structural validation và semantic review phải được báo cáo riêng.

---

## 11. TASK 6 — CORRECT PROJECT STATUS

Cập nhật:

docs/ai-sdlc/project-status.md

Điều chỉnh Step 00A từ BLOCKED sang COMPLETED nếu toàn bộ Exit Criteria phía trên đạt.

Điều chỉnh Step 01 Readiness thành:

`READY_FOR_BUSINESS_ANALYSIS`

nếu các inputs cần thiết đã có.

Nếu có blocker thực sự ngoài vấn đề thiếu A/B, phải liệt kê chính xác từng blocker.

Không để trạng thái BLOCKED chỉ vì original files chưa từng nằm trong repository.

---

## 12. TASK 7 — MINIMAL CHANGES ONLY

Kiểm tra commit `b5224ce` và working tree hiện tại.

Chỉ sửa:

- Incorrect source assumptions.
- Project status.
- Context provenance.
- Genuine missing requirements.
- Inconsistent terminology.
- Traceability gaps.

Không rewrite toàn bộ artifacts.

Không reset project.

Không tạo duplicated documentation.

Không đụng vào production code.

---

## 13. REQUIRED OUTPUT

Báo cáo:

1. Context Baseline Validation.
2. Corrected Source Provenance.
3. Seven JTBD Coverage.
4. Domain & State Coverage.
5. P0/P1/P2 Coverage.
6. Three Golden Workflows Coverage.
7. Open Business Decisions.
8. Updated Artifacts.
9. Validation Results.
10. Step 00A Final Status.
11. Step 01 Readiness.

Phân biệt rõ:

- Validated against approved prompt context.
- Not directly verified against original A/B files.
- Pending business rules for Step 01.

## 14. STOP CONDITION

Không coding.

Không thiết kế solution architecture.

Không tạo UI.

Không deploy.

Không chuyển sang Step 01 tự động.

Sau khi hoàn thành, dừng và báo cáo Step 01 Readiness.

## FINAL DIRECTIVE

**Do not block the AI SDLC because original ChatGPT discussion documents were never committed to an initially empty repository.**

Use the approved product context and existing repository artifacts as the baseline.

Validate what is actually available.

Preserve MatterControl's legal domain semantics and P0 capability scope.

Proceed to Business Analysis when the documented baseline is complete.