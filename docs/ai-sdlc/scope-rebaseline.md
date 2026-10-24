# Scope Rebaseline — Step 00A

Date: 2026-10-24. Owner: Codex. Source: [chỉ thị Step 00A](step-00a-request.md).
**Authorized by explicit Product Owner request. Không chờ phê duyệt lại bước chuyển hoặc P0 baseline.**

## Thay đổi so với đề xuất Step 00

| Trước — đề xuất của Codex | Hiện tại — chỉ thị PO |
|---|---|
| Step 00A dự kiến audit repository/tooling/hosting | Step 00A là Canonical Product Context: BA / Product Requirements Owner / PM |
| MC-00A WAITING_APPROVAL | Đã được giao; phần có nguồn được thực hiện, hoàn tất hợp nhất bị BLOCKED vì thiếu A/B |
| Chưa có capability baseline | 19 P0, 14 P1, 7 P2 được PO chấp thuận trong chỉ thị |
| Next step có thể bắt đầu bằng technical feasibility | Giữ vấn đề feasibility như risk/open decision; không thiết kế solution architecture |
| Readiness nói tới đầu vào Step 00A | Báo cáo đầu vào và gate Step 01 |

Đề xuất cũ không phải quyết định của PO. Lịch sử còn trong Git; không thực hiện audit kỹ thuật dưới tên Step 00A mới. Việc PO giao Step 00A không phải bằng chứng independent review toàn bộ Step 00 đã hoàn tất.

## Source boundary

Workspace có Step 00 và Step 00A requests. Không có Document A/B; PO xác nhận “chưa có”. Hai source artifact được tạo dạng MISSING record, không tạo giả nội dung.

APPROVED_INPUT từ chỉ thị vẫn được giữ đầy đủ. Glossary, acceptance narratives và Atlas synthetic specification là diễn giải/đề xuất có nhãn; verified A/B delta và original JTBD chưa thể hoàn tất.

## Deliverable map

| Artifact | Kết quả hiện tại |
|---|---|
| [source-brief](../product/source-brief.md) | MISSING source record |
| [product-reality-addendum](../product/product-reality-addendum.md) | MISSING source record + precedence |
| [canonical-product-context](../product/canonical-product-context.md) | Partial source baseline |
| [domain-glossary](../product/domain-glossary.md) | 19 terms, working semantics / P0–P2 boundaries |
| [three-golden-workflows](../product/three-golden-workflows.md) | Ba approved sequences + candidate acceptance |
| [project-atlas-dataset](../product/project-atlas-dataset.md) | Synthetic specification, không phải seed code |
| [requirements-delta-analysis](../requirements/requirements-delta-analysis.md) | Tám trục; comparison blocked |
| [p0-p1-p2-priorities](../requirements/p0-p1-p2-priorities.md) | Approved capability list, stable IDs |
| [open-business-decisions](../requirements/open-business-decisions.md) | Missing inputs, Step 01 clarifications và material trade-offs |
| scope-rebaseline | Bản ghi thay đổi phạm vi này |

## Step 01 gate

Product identity, approved capability tiers, workflows và open-question packet có thể dùng để chuẩn bị Step 01. **Full readiness: NOT_READY — thiếu A/B, chưa verify core JTBD và reconciliation.** Không chặn vì yêu cầu PO duyệt lại direction đã duyệt; chặn vì thiếu nguồn bắt buộc.

Stop: không code, solution architecture, high-fidelity UI hoặc deploy. Không dispatch agent hoặc đổi integration trong bước này.
