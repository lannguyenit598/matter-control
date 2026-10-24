# P0 / P1 / P2 Capability Baseline

Source: [SRC-00A / Task 3](../ai-sdlc/step-00a-request.md). **APPROVED_INPUT**: product direction và danh sách capability đã được Product Owner chấp thuận. Không xin phê duyệt lại danh sách này; acceptance rules chi tiết sẽ ở Step 01.

Các ID REQ-MC dưới đây định danh capability, không phải bảng dữ liệu hay implementation task.

## P0 — Operational MVP

| ID | Capability nguyên bản | Acceptance focus cần đặc tả |
|---|---|---|
| REQ-MC-P0-01 | Requirement vs Action | Hai khái niệm phân biệt; hoàn tất action không tự chứng minh requirement |
| REQ-MC-P0-02 | Milestones | Nhìn thấy mốc, điều kiện và blocker ảnh hưởng |
| REQ-MC-P0-03 | Next Action | Nhận biết việc tiếp theo và người phụ trách |
| REQ-MC-P0-04 | Waiting On | Nhìn thấy bên/điều kiện đang chờ, không lẫn dependency |
| REQ-MC-P0-05 | Dependencies | Quan hệ tiên quyết và READY/BLOCKED, ưu tiên computed |
| REQ-MC-P0-06 | Evidence Requirements | Tiêu chí bằng chứng tồn tại tách biệt bằng chứng nộp |
| REQ-MC-P0-07 | Evidence verification | Phân biệt đủ/chưa đủ/disputed và execution |
| REQ-MC-P0-08 | Event History | Thay đổi domain có thể truy vết, không chỉ trạng thái mới nhất |
| REQ-MC-P0-09 | Control Room | Comprehension, exception, blocker, milestone, decision |
| REQ-MC-P0-10 | My Actions | Người dùng tìm được việc của mình theo scope quyền |
| REQ-MC-P0-11 | Operational Grid | Làm việc với thông tin dày, contextual detail, keyboard |
| REQ-MC-P0-12 | Bulk editing | Thay đổi nhiều record có validation và phản hồi rõ |
| REQ-MC-P0-13 | Excel/CSV import | Nhập dữ liệu, mapping/validation/error handling cần Step 01 |
| REQ-MC-P0-14 | Excel export | Xuất dữ liệu nghiệp vụ có ý nghĩa, giữ phân biệt trạng thái |
| REQ-MC-P0-15 | Document versions | Lineage, current/superseded và version-aware evidence |
| REQ-MC-P0-16 | Filing lifecycle | Theo dõi từ chuẩn bị đến phản hồi/kết quả, không coi receipt là approval |
| REQ-MC-P0-17 | External parties | Liên hệ/chờ bên ngoài gắn đúng context |
| REQ-MC-P0-18 | Simple roles | Quyền tối thiểu rõ ràng; role names/matrix chưa tự chốt |
| REQ-MC-P0-19 | Delta-based Status Brief | Thay đổi từ baseline xác định, reporting deterministic |

## P1 — Legal Domain Depth

| ID | Capability nguyên bản |
|---|---|
| REQ-MC-P1-01 | Legal authorities |
| REQ-MC-P1-02 | Legal propositions |
| REQ-MC-P1-03 | Open Legal Questions |
| REQ-MC-P1-04 | Structured Decisions |
| REQ-MC-P1-05 | Entity master |
| REQ-MC-P1-06 | Temporal relationships |
| REQ-MC-P1-07 | Ownership provenance |
| REQ-MC-P1-08 | Advanced Findings/Risks |
| REQ-MC-P1-09 | Signature tracking |
| REQ-MC-P1-10 | Advanced filing packages |
| REQ-MC-P1-11 | Power of Attorney |
| REQ-MC-P1-12 | Saved views |
| REQ-MC-P1-13 | Management-ready exports |
| REQ-MC-P1-14 | Historical report snapshots |

## P2 — Future Intelligence

| ID | Capability nguyên bản |
|---|---|
| REQ-MC-P2-01 | Beneficial ownership graph |
| REQ-MC-P2-02 | Regulatory change impact |
| REQ-MC-P2-03 | Recurring compliance |
| REQ-MC-P2-04 | AI-assisted extraction |
| REQ-MC-P2-05 | Grounded AI Matter Assistant |
| REQ-MC-P2-06 | Contradiction detection |
| REQ-MC-P2-07 | Advanced risk intelligence |

## Release boundaries

Early vertical slice và internal alpha là các mốc học/kiểm tra, không thay full MVP. Full MVP cần toàn bộ 19 P0 và ba Golden Workflows, cùng criteria được đặc tả ở Step 01. P1/P2 không mặc định nằm trong full MVP.

Excel export P0 khác management-ready exports P1; delta brief P0 khác historical snapshots P1; document version/signature awareness tối thiểu cho workflows khác advanced signature tracking P1. Chi tiết biên giới cần OBD-03/07, không phải lý do xin lại approval toàn baseline.

Không cắt P0 vì giới hạn triển khai/hosting; trade-off thật phải có phân tích và Human decision. P0 ở đây là priority sản phẩm, không phải priority P1 của task tài liệu MC-00A.
