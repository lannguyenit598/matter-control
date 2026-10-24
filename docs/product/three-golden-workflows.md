# Three Golden Workflows

Source: SRC-00A / Task 4. **Cả ba workflows là acceptance targets đã được chấp thuận của Operational MVP.**
Các sequence giữ nguyên; scenarios/output checks là SYNTHETIC_PROPOSAL cho Step 01. Không phải quy trình pháp lý bắt buộc của một jurisdiction cụ thể.

## GW-01 — Transaction / Restructuring

**Approval → Document → Signature → Payment → Transfer → Closing → Filing → Post-Closing.**

Context: legal coordinator/transaction team và external parties — actor labels làm việc, chưa chốt role permissions.

Acceptance narrative: theo dõi từng Requirement cần đạt và Action phải làm, xác định prerequisite, document version/evidence và trạng thái riêng. Nhìn rõ signature còn thiếu, payment/transfer chưa thể tiến hành, closing milestone bị ảnh hưởng và việc sau closing.

Candidate checks:
- Completed action nhưng chưa đủ evidence vẫn hiển thị UNVERIFIED.
- Agreement có version cũ và version mới; partial signature không hiển thị như đã ký đủ.
- Critical dependency chain giải thích được blocker đến payment/closing/filing.
- Closing không tự hoàn tất filing/post-closing; mỗi bước có context và history.
- Control Room, Grid, My Actions và brief cùng phản ánh trạng thái có nguồn.

Atlas: WS-01/03/04/05/06, MS-01/02/03, DEP-01..05, FIL-01. P0 chính: 01–09, 15–19; cross-cutting 10–14 kiểm tra trong AT-UX.

## GW-02 — Due Diligence

**Request → Document → Review → Gap → Finding → Follow-Up → Resolution.**

Acceptance narrative: gửi/ghi nhận yêu cầu, nhận đúng version tài liệu, review theo criteria, nhận ra thiếu hụt, ghi finding tối thiểu, giao follow-up và chờ external party; resolution cần evidence phù hợp.

Candidate checks:
- Request đã gửi và Action đã hoàn tất không đồng nghĩa requirement đã được chứng minh.
- Thiếu evidence tạo gap có thể thấy; Finding liên kết tới đối tượng và follow-up.
- WAITING xác định rõ bên đang chờ; không tự biến thành BLOCKED nếu không có dependency.
- Evidence mới được review và quyết định resolution có Event History.
- Advanced Findings/Risks P1 không là điều kiện để mô tả finding tối thiểu trong GW-02.

Atlas: WS-02, RQ-03/04, AC-03/04, ER-03/04, FD-01. P0 chính: 01, 03–11, 15, 17–19.

## GW-03 — Regulatory Filing

**Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval.**

Acceptance narrative: theo dõi requirement, package/document version, chữ ký, submission và receipt riêng biệt; nhận biết đang chờ authority, yêu cầu bổ sung, response và kết quả approval.

Candidate checks:
- Submission hoặc receipt không tự trở thành approval/VERIFIED.
- Đúng version package và evidence đi cùng từng sự kiện filing.
- Waiting on authority có external party và context để thấy trong Control Room/Grid.
- Supplement/response tạo traceable changes; conditional/repeat/negative outcome rules được quyết định ở Step 01.
- Không suy diễn e-filing integration, e-signature integration hoặc advanced filing packages là P0.

Atlas: WS-05/06, FIL-01/02, DOC-05, EP-03. P0 chính: 01–09, 15–19.

## Common acceptance dimensions

Mỗi workflow cần test execution/verification separation, dependencies, overdue/missing evidence, permissions, history, contextual navigation và deterministic delta. Các bước signature, payment, transfer là việc theo dõi vận hành; không mặc định sản phẩm tự ký, chuyển tiền hoặc nộp hồ sơ qua API bên ngoài.

| Mức | Coverage cần công khai |
|---|---|
| Early vertical slice | Một chuỗi hẹp được chọn trong Step 01; liệt kê bước/capability chưa có |
| Internal alpha | Coverage thực tế trên ba workflows và gap list; không tự nâng thành release |
| Full MVP | Cả GW-01/02/03 + toàn bộ P0; scenario evidence và criteria Step 01 được thỏa mãn |

Ba sequence chưa xác định toàn bộ transition/branch/exception. Việc có bước Supplement trong target không đồng nghĩa mọi filing đều phải bị yêu cầu bổ sung. OBD-05 sẽ làm rõ đường đi và ngoại lệ.
