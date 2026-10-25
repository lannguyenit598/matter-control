# MATTERCONTROL — STEP 02.4
## PRODUCT OWNER SCOPE DECISION & INTEGRATION EXECUTION PLANNING

Bạn là Codex — Project Manager, Business Analyst, Cloud/DevOps Engineer và AI SDLC Orchestrator.

Nhiệm vụ hiện tại: chuyển kết quả STEP 02.3 thành một quyết định phạm vi có thể phê duyệt, sau đó chuẩn bị triển khai technical integration có kiểm soát.

**Không tự bắt đầu implementation trước khi Product Owner chốt phạm vi.**

### 1. Current baseline

Product: MatterControl — Control Plane for High-Stakes Legal Work.

STEP 02.3 đã có các kết quả được báo cáo:

- Local commit `a7e9992`.
- OpenCode verdict: `PASS_DOCUMENT_ONLY`.
- Các làm rõ về `refId`, `value`/truncation, client support và DB-stop evidence đã được cập nhật.
- Hai prerequisite cũ đã đóng ở mức tài liệu.
- Claude review không còn là prerequisite của vòng STEP 02.3 này.
- Cả 51 runtime test cases vẫn `NOT_RUN`.
- Product Owner chưa chốt integration scope.
- MC-002 vẫn `OPEN`.

Đọc và xác minh trạng thái từ repository trước khi tiếp tục.

Đặc biệt đọc:

- `docs/ai-sdlc/step-02-runtime-decision-request.md`
- `docs/reviews/step-02-3-opencode-clarification-review.md`
- Các API/Auth contracts hiện có.
- Approved ADRs.
- Requirements, state semantics và permission matrix.
- Current project status.
- Existing integration test matrix.

Không làm lại các clarification đã được nghiệm thu nếu không có findings mới.

### 2. Preserve review boundaries

Ghi nhận chính xác:

- OpenCode đã hoàn thành document-only clarification review.
- OpenCode chưa chứng minh runtime correctness.
- Không có runtime test nào được thực hiện trong vòng này.
- Claude Code vẫn là Solution Architecture Authority.
- Không cần khởi động lại Claude review chỉ để lặp lại các clarification vừa đóng.
- Nếu phạm vi được chọn dẫn đến architecture changes quan trọng, phải xử lý qua Architecture Decision/Approval process hiện hành.

Không tự biến `PASS_DOCUMENT_ONLY` thành `RUNTIME_PASS`.

### 3. Extract the actual Product Owner decisions

Đọc toàn bộ runtime decision request và xác định chính xác các lựa chọn còn chờ Product Owner.

Với từng lựa chọn, trình bày:

1. Decision ID.
2. Exact options từ tài liệu.
3. Approved baseline liên quan.
4. Lợi ích.
5. Trade-offs.
6. API/Auth impact.
7. Security impact.
8. Backend/frontend impact.
9. Testing impact.
10. Cloudflare/cost impact.
11. Recommended option.
12. Lý do đề xuất.

Không tự tạo phương án rồi gán chúng thành các lựa chọn chính thức.

Nếu tài liệu đã có một recommendation, hãy đối chiếu và giải thích lý do giữ hoặc thay đổi đề xuất.

### 4. Recommended scope principle

Đánh giá phương án **Minimum End-to-End Integration Slice** nếu phù hợp với các lựa chọn đã được ghi nhận.

Mục tiêu là kiểm chứng một chuỗi kỹ thuật thực sự:

Next.js frontend
→ Approved API contract
→ Go backend
→ PostgreSQL persistence.

Phạm vi nên đủ để kiểm thử:

- API request/response contracts.
- Authentication behavior.
- Authorization boundaries theo approved scope.
- Workspace/Matter isolation nếu là điều kiện của seam được chọn.
- Input validation.
- Expected error handling.
- Backend unavailable behavior.
- Database connectivity.
- Frontend/backend integration.
- Logging và evidence collection.

Dùng synthetic data và isolated local environment.

Không mở rộng thành full MatterControl implementation.

Không dùng authentication bypass hoặc hardcoded demo identity như bằng chứng production security.

Nếu current approved options quy định một phạm vi khác, hãy trình bày sự khác biệt và xin Product Owner quyết định.

### 5. C01-PRODUCT boundary

Phân biệt rõ:

- C01-NATIVE: accepted with limitations.
- C01-PRODUCT: open.
- Minimum integration scope.
- Full P0 product conformance.

Xác định phần nào của C01-PRODUCT có thể kiểm chứng trong integration slice và phần nào phải chờ các product implementation milestones.

Không đóng C01-PRODUCT chỉ dựa vào native template evidence.

### 6. Runtime test plan

Đọc danh sách 51 runtime test cases hiện tại.

Phân loại từng case thành:

- REQUIRED_FOR_SELECTED_INTEGRATION_SLICE.
- DEPENDS_ON_LATER_PRODUCT_IMPLEMENTATION.
- BLOCKED_BY_EXTERNAL_FEASIBILITY.
- NEEDS_SCOPE_DECISION.

Giữ nguyên test IDs.

Với các test thuộc integration slice, bổ sung:

- Prerequisites.
- Owner.
- Test environment.
- Expected behavior.
- Execution command hoặc test procedure.
- Evidence requirements.
- Cleanup requirements.
- Independent reviewer.

Tất cả các test chưa chạy phải tiếp tục giữ trạng thái `NOT_RUN`.

Không báo cáo PASS khi mới lập test plan.

### 7. Agent implementation handoffs

Sau khi Product Owner chọn phạm vi, Codex sẽ chuẩn bị task contracts cho:

**ZCode — Backend**

- API/Auth seam.
- Contract-compatible implementation.
- Persistence connectivity.
- Focused backend tests.

**Antigravity — Frontend**

- API client integration.
- Approved authentication interaction.
- Frontend error handling.
- Local integration smoke test.

**OpenCode — Independent QA**

- Contract verification.
- Authentication/authorization negative cases.
- Integration test review.
- Runtime evidence validation.

**Codex — Cloud/DevOps**

- Local integration environment.
- Docker/PostgreSQL setup.
- Test orchestration.
- Evidence collection.
- Safe cleanup.
- Cloudflare feasibility tracking.

**Claude Code — Solution Architecture Authority**

- Architecture changes hoặc material deviations nếu phát sinh.
- Không yêu cầu lặp lại document review STEP 02.3 đã đóng.

Nếu Codex không thể gọi ZCode, Antigravity hoặc OpenCode trực tiếp, tạo prompt hoàn chỉnh cho từng agent, có thể copy/paste thủ công.

Nhưng **chỉ dispatch implementation sau Product Owner approval**.

### 8. Parallel OpenDesign workstream

STEP 03A OpenDesign đang triển khai trên branch/worktree riêng.

Không chỉnh sửa trực tiếp worktree thiết kế.

Nếu API/Auth decisions ảnh hưởng UI, tạo Design Impact Notice bao gồm:

- Decision ID.
- Affected UX flow.
- Required user-visible behavior.
- Architecture dependency.
- Recommendation for OpenDesign.

Không tự thay đổi UX artifacts.

Không chuyển STEP 03A hoặc STEP 03B sang DONE.

### 9. Cloudflare and cost

Giữ riêng các quality gates:

- Local integration feasibility.
- Runtime correctness.
- Product conformance.
- Cloudflare production feasibility.
- Infrastructure cost verification.
- Recovery requirements.

Local integration PASS không chứng minh Cloudflare Free Tier hoặc $0/month.

Không đổi Go/PostgreSQL, kích hoạt paid services hoặc triển khai production nếu chưa được phê duyệt.

### 10. Required output

Trước khi implementation, cung cấp:

**A. Product Owner Decision Package**

Một bảng ngắn gọn gồm:

- Decision ID.
- Option A/B/C nếu thực sự tồn tại.
- Recommended option.
- Trade-offs.
- Approval required.

**B. Proposed Integration Scope**

- In scope.
- Out of scope.
- Dependencies.
- Acceptance criteria.

**C. Runtime Test Coverage**

- Tổng số test cases.
- Required now.
- Deferred.
- Blocked.
- NOT_RUN.

**D. Agent Execution Plan**

- ZCode tasks.
- Antigravity tasks.
- OpenCode review tasks.
- Codex DevOps tasks.
- Claude Code architecture escalation conditions.

**E. Current Gate Status**

- STEP 02.3 document clarification.
- Product Owner scope approval.
- Runtime execution.
- C01-PRODUCT.
- MC-002.

**F. Exact Product Owner Response**

Viết một đoạn phê duyệt ngắn, có các option cụ thể lấy từ decision request, để tôi có thể chọn và gửi lại mà không cần tự diễn giải technical documents.

### 11. Stop condition

Không:

- Tự chọn scope thay Product Owner.
- Implement API/Auth.
- Chạy 51 runtime tests trước quyết định.
- Dispatch ZCode/Antigravity implementation.
- Thay đổi approved ADRs.
- Reopen C01-NATIVE.
- Bắt đầu production deployment.
- Đánh dấu MC-002 DONE.

**Dừng tại Product Owner Integration Scope Approval Gate.**

Sau khi tôi chấp thuận, mới chuyển sang bước thực thi integration và runtime verification.

### FINAL DIRECTIVE

Preserve approved requirements and closed evidence.

Do not confuse document review with runtime validation.

Obtain an explicit Product Owner scope decision, then execute the smallest approved integration slice with independent verification.