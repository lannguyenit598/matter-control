# Scope Rebaseline — Step 00A

Date: 2026-10-24. Owner: Codex. Source: [Step 00A](step-00a-request.md), corrected by [Step 00A.1](step-00a1-request.md).
**Authorized by explicit Product Owner request. Không chờ phê duyệt lại bước chuyển hoặc P0 baseline.**

## Thay đổi so với đề xuất Step 00

| Trước — đề xuất của Codex | Hiện tại — chỉ thị PO |
|---|---|
| Step 00A dự kiến audit repository/tooling/hosting | Step 00A là Canonical Product Context: BA / Product Requirements Owner / PM |
| MC-00A WAITING_APPROVAL | Stage COMPLETED theo revised exit criteria; MC-00A IN_REVIEW, independent review Pending |
| Chưa có capability baseline | 20 P0, 14 P1, 7 P2 được PO chấp thuận trong chỉ thị |
| Next step có thể bắt đầu bằng technical feasibility | Giữ vấn đề feasibility như risk/open decision; không thiết kế solution architecture |
| Readiness nói tới đầu vào Step 00A | Báo cáo đầu vào và gate Step 01 |

Đề xuất cũ không phải quyết định của PO. Lịch sử còn trong Git; không thực hiện audit kỹ thuật dưới tên Step 00A mới. Việc PO giao Step 00A không phải bằng chứng independent review toàn bộ Step 00 đã hoàn tất.

## Source boundary

Workspace lưu Step 00/00A/00A.1 requests. A/B được tạo trong ChatGPT trước repository và chưa từng có trong workspace. Hai source artifacts là provenance records, không tái tạo originals. [Context provenance](../product/context-provenance.md) ghi ORIGINAL_BRIEFS_NOT_IN_REPOSITORY_BY_DESIGN và PRODUCT_CONTEXT_PROVIDED_VIA_APPROVED_PROMPTS.

APPROVED_INPUT từ chỉ thị vẫn được giữ đầy đủ. Glossary, acceptance narratives và Atlas synthetic specification là diễn giải/đề xuất có nhãn; seven JTBD được SRC-00A1 xác nhận rõ; chưa direct verify A/B. Original archival là optional.

## Deliverable map

| Artifact | Kết quả hiện tại |
|---|---|
| [source-brief](../product/source-brief.md) | Original provenance record |
| [product-reality-addendum](../product/product-reality-addendum.md) | Original provenance record + precedence |
| [canonical-product-context](../product/canonical-product-context.md) | Validated approved-prompt baseline |
| [domain-glossary](../product/domain-glossary.md) | 19 terms, working semantics / P0–P2 boundaries |
| [three-golden-workflows](../product/three-golden-workflows.md) | Ba approved sequences + candidate acceptance |
| [project-atlas-dataset](../product/project-atlas-dataset.md) | Synthetic specification, không phải seed code |
| [requirements-delta-analysis](../requirements/requirements-delta-analysis.md) | Tám trục từ prompt + closure deltas; không direct compare A/B |
| [p0-p1-p2-priorities](../requirements/p0-p1-p2-priorities.md) | Approved capability list, stable IDs |
| [open-business-decisions](../requirements/open-business-decisions.md) | Provenance resolved; Step 01 clarifications và material trade-offs |
| scope-rebaseline | Bản ghi thay đổi phạm vi này |

## Step 01 gate

Product identity, seven JTBD, domain/states, approved capability tiers, workflows, Atlas và open decisions là inputs dùng được. **Step 00A: COMPLETED; Step 01: READY_FOR_BUSINESS_ANALYSIS.** Quy tắc chi tiết được phân tích tại Step 01; không có blocker product direction/scope. Review độc lập Pending, không tự đánh dấu task DONE.

Stop: không code, solution architecture, high-fidelity UI hoặc deploy. Không dispatch agent hoặc đổi integration trong bước này.
