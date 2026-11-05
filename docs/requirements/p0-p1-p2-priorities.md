# P0 / P1 / P2 Capability Baseline

Source: [SRC-00A / Task 3](../ai-sdlc/step-00a-request.md), clarified by [SRC-00A1 / §5.5–5.7](../ai-sdlc/step-00a1-request.md). **APPROVED_INPUT**: product direction và danh sách capability đã được Product Owner chấp thuận. Không xin phê duyệt lại danh sách này; acceptance rules chi tiết sẽ ở Step 01.

Các ID REQ-MC dưới đây định danh capability, không phải bảng dữ liệu hay implementation task. Giữ nguyên các ID cũ khi chuẩn hóa tên; thêm P0-20 để trace Separate State Dimensions đã có trong canonical context. Đây là sửa coverage, không promote P1/P2.

## P0 — Operational MVP

| ID | Approved capability | Acceptance focus cần đặc tả |
|---|---|---|
| REQ-MC-P0-01 | Requirement vs Action | Hai khái niệm phân biệt; hoàn tất action không tự chứng minh requirement |
| REQ-MC-P0-02 | Milestones | Nhìn thấy mốc, điều kiện và blocker ảnh hưởng |
| REQ-MC-P0-03 | Next Action | Nhận biết việc tiếp theo và người phụ trách |
| REQ-MC-P0-04 | Waiting On | Nhìn thấy bên/điều kiện đang chờ, không lẫn dependency |
| REQ-MC-P0-05 | Dependencies and Blocker Logic | Quan hệ tiên quyết và blocker giải thích được; READY/BLOCKED xác định bằng business logic, rules Step 01 |
| REQ-MC-P0-06 | Evidence Requirements | Tiêu chí bằng chứng tồn tại tách biệt bằng chứng nộp |
| REQ-MC-P0-07 | Evidence Verification | Phân biệt đủ/chưa đủ/disputed và execution |
| REQ-MC-P0-08 | Event History | Thay đổi domain có thể truy vết, không chỉ trạng thái mới nhất |
| REQ-MC-P0-09 | Matter Control Room | Comprehension, exception, blocker, milestone, decision |
| REQ-MC-P0-10 | My Actions | Người dùng tìm được việc của mình theo scope quyền |
| REQ-MC-P0-11 | Operational Grid | Nhiều records, inline editing, contextual detail, keyboard và giảm context switching |
| REQ-MC-P0-12 | Bulk Editing | Thay đổi nhiều record có validation và phản hồi rõ |
| REQ-MC-P0-13 | Excel/CSV Import | Nhập dữ liệu, mapping/validation/error handling cần Step 01 |
| REQ-MC-P0-14 | Excel Export | Xuất dữ liệu nghiệp vụ có ý nghĩa, giữ phân biệt trạng thái |
| REQ-MC-P0-15 | Document Versions | Lineage, current/superseded và version-aware evidence |
| REQ-MC-P0-16 | Regulatory Filing Lifecycle | Theo dõi từ chuẩn bị đến phản hồi/kết quả, không coi receipt là approval |
| REQ-MC-P0-17 | External Parties | Liên hệ/chờ bên ngoài gắn đúng context |
| REQ-MC-P0-18 | Simple Roles and Ownership | Quyền và người chịu trách nhiệm rõ ràng; assignment/role matrix ở Step 01. Khác Ownership Provenance P1 |
| REQ-MC-P0-19 | Delta-Based Status Brief | Thay đổi từ baseline xác định, reporting deterministic |
| REQ-MC-P0-20 | Separate State Dimensions | Năm chiều độc lập; COMPLETED khác VERIFIED; dependency theo logic, timing và attention riêng |

## P1 — Legal Domain Depth

| ID | Approved capability |
|---|---|
| REQ-MC-P1-01 | Legal Authorities |
| REQ-MC-P1-02 | Legal Propositions |
| REQ-MC-P1-03 | Open Legal Questions |
| REQ-MC-P1-04 | Structured Decisions |
| REQ-MC-P1-05 | Entity Master |
| REQ-MC-P1-06 | Temporal Entity Relationships |
| REQ-MC-P1-07 | Ownership Provenance |
| REQ-MC-P1-08 | Advanced Findings and Risks |
| REQ-MC-P1-09 | Signature Tracking |
| REQ-MC-P1-10 | Advanced Filing Packages |
| REQ-MC-P1-11 | Power of Attorney |
| REQ-MC-P1-12 | Saved Views |
| REQ-MC-P1-13 | Management-Ready Export |
| REQ-MC-P1-14 | Historical Report Snapshots |

## P2 — Future Intelligence

| ID | Approved capability |
|---|---|
| REQ-MC-P2-01 | Beneficial Ownership Graph |
| REQ-MC-P2-02 | Regulatory Change Impact |
| REQ-MC-P2-03 | Recurring Compliance |
| REQ-MC-P2-04 | AI-Assisted Document Extraction |
| REQ-MC-P2-05 | Grounded AI Matter Assistant |
| REQ-MC-P2-06 | Source Contradiction Detection |
| REQ-MC-P2-07 | Advanced Risk Intelligence |

## Release boundaries

Early vertical slice và internal alpha là các mốc học/kiểm tra, không thay full MVP. Full MVP cần toàn bộ 20 P0 và ba Golden Workflows, cùng criteria được đặc tả ở Step 01. P1/P2 không mặc định nằm trong full MVP.

Excel export P0 khác management-ready exports P1; delta brief P0 khác historical snapshots P1; document version/signature awareness tối thiểu cho workflows khác advanced signature tracking P1. Chi tiết biên giới cần OBD-03/07, không phải lý do xin lại approval toàn baseline.

Không cắt P0 vì giới hạn triển khai/hosting; trade-off thật phải có phân tích và Human decision. P0 ở đây là priority sản phẩm, không phải priority P1 của task tài liệu MC-00A.
