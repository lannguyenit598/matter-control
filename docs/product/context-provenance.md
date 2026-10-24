# Product Context Provenance

Owner: Codex. Authority: Product Owner. Date: 2026-10-24.

**ORIGINAL_BRIEFS_NOT_IN_REPOSITORY_BY_DESIGN**

**PRODUCT_CONTEXT_PROVIDED_VIA_APPROVED_PROMPTS**

Repository ban đầu là empty project. Document A — Control Plane for High-Stakes Work và Document B — MatterControl: Product Reality & Legal Workflow Context được PO xây dựng trong các cuộc trò chuyện ChatGPT trước khi khởi tạo repository; hai bản gốc chưa từng được lưu vào repository/Codex workspace. Đây không phải lỗi thiếu file trong Git.

| Source ID | Nguồn được lưu | Authority / phạm vi |
|---|---|---|
| SRC-00 | [Step 00](../ai-sdlc/step-00-request.md) | PO: identity, roles, constraints và operating model |
| SRC-00A | [Step 00A](../ai-sdlc/step-00a-request.md) | PO: context, capabilities, workflows và dataset targets |
| SRC-00A1 | [Step 00A.1](../ai-sdlc/step-00a1-request.md) | PO: xác nhận prompts là baseline hợp lệ; seven JTBD, coverage và exit criteria hiện hành |
| SRC-A / SRC-B | [A source record](source-brief.md), [B source record](product-reality-addendum.md) | Provenance records; không chứa full text hoặc bản gốc do AI tái tạo |

Canonical Product Context tổng hợp các chỉ thị được phê duyệt trên. SRC-00A1 sửa cách diễn giải câu trả lời trước đó “chưa có”: không được biến việc chưa có file gốc thành blocker Step 01. Khi có khác biệt với gate cũ tại b5224ce, clarification SRC-00A1 có hiệu lực.

**Validated against approved prompt context. Not directly verified against original A/B files.** Không tuyên bố đã đọc, hợp nhất nguyên văn hoặc đối chiếu trực tiếp hai bản gốc. Điều này không làm mất tính hợp lệ của requirements do PO đã chuyển giao qua prompt.

Verbatim archival A/B là optional provenance enhancement, không phải Step 01 hard gate. Nếu PO cung cấp sau này, archive kèm nguồn/phiên bản rồi đối chiếu bổ sung; không tìm kiếm lại hoặc tái tạo bằng suy đoán. B ưu tiên A về legal semantics/capability priorities theo SRC-00A; xung đột thực sự với baseline hiện hành phải được ghi và trình PO.

Approved input khác với BA interpretation và SYNTHETIC_PROPOSAL: definitions đã được rà soát theo prompt, rules chi tiết vẫn ở Step 01; Atlas không tự trở thành policy. [Validation](../testing/step-00a-validation.md) tách structural checks, author semantic review và independent review Pending. [Quality gate](../ai-sdlc/quality-gates.md) áp dụng cho stage completion; task chưa DONE khi thiếu independent review.
