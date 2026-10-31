# Kế hoạch cải thiện flow cho legal của quỹ đầu tư và legal của law firm

- Tác giả: actual Claude Code (Solution Architect), 2026-10-30, theo yêu cầu trực tiếp của PO. Trạng thái: **PROPOSED — chờ PO duyệt; chưa được người dùng thật kiểm chứng**.
- Căn cứ hiện trạng: source đã đọc (22 route, ≈88 endpoint), `docs/product/*`, `docs/requirements/*`, `docs/design/legal-team-experience-20261029/`. Chưa có nghiên cứu người dùng nào về hai nhóm này trong repo (đã tìm: không có tài liệu nói về law firm/quỹ đầu tư). Mọi mô tả persona dưới đây là **giả thuyết từ hiểu biết nghề chung**, không phải kết luận pháp lý theo một jurisdiction cụ thể.
- Ranh giới: AGENTS.md — Discovery closed, vertical đầu là Transactions & Corporate Legal Work; baseline P0/P1/P2 đã duyệt; không promote P1/P2 nếu chưa có PO duyệt. Kế hoạch chia **Tier A** (trong P0 đã duyệt, làm được ngay), **Tier B** (promote capability P1/P2 đã có trong baseline, cần PO duyệt thứ tự), **Tier C** (ngoài baseline, chỉ nêu để PO quyết, KHÔNG đề xuất build).
- Đầu vào song song: kết quả `MC-ZCODE-BA-FLOW-COMPLETENESS-REVIEW-20261030` (lỗi/gap hiện hữu) và `MC-UIUX-LAWYER-EXPERIENCE-AUDIT-AND-PLAN-20261030` (UX). Plan này phải được cập nhật sau khi hai kết quả đó về (Phase 0).

## 1. Hai nhóm người dùng (giả thuyết cần kiểm chứng)

| | A. Legal quỹ đầu tư (in-house tại quỹ / GP / công ty quản lý quỹ) | B. Legal law firm (associate, senior associate, paralegal, partner) |
|---|---|---|
| "Khách hàng" | Ban đầu tư, IC, đối tác góp vốn (LP), công ty danh mục | Khách hàng bên ngoài của hãng |
| Hình dạng công việc | Nhiều giao dịch/nghĩa vụ song song trên danh mục; lặp lại theo nhịp | Nhiều matter của nhiều khách; mỗi matter có đội riêng, deadline giao dịch |
| Việc cốt lõi | Đầu tư/thoái vốn (DD, SPA/SHA, closing), cấu trúc pháp nhân quỹ/SPV, nộp hồ sơ với cơ quan quản lý, phê duyệt nội bộ (IC, LPAC…), điều phối luật sư bên ngoài | Closing checklist, vòng sửa tài liệu với bên kia, DD request/issues list, thu chữ ký, báo cáo tiến độ cho khách |
| "Xong" nghĩa là | Đã có bằng chứng, đã phê duyệt đúng thẩm quyền, đã nộp và nhận kết quả | Mọi điều kiện closing có bằng chứng, bộ hồ sơ closing đầy đủ, khách được báo |
| Người nhận báo cáo | GC, IC, ban điều hành | Partner, khách hàng |
| Rủi ro riêng | Quên nghĩa vụ định kỳ, không thấy toàn danh mục | Lộ thông tin giữa các khách/matter, báo cáo chậm, trách nhiệm không rõ |
| Yêu cầu bảo mật | Ranh giới theo giao dịch/quỹ | Ranh giới nghiêm theo matter/khách (ethical wall) |

Kết luận làm việc: **một sản phẩm, hai cách dùng** (cùng domain: Requirement/Action/Evidence/Document/Filing/Party). Không fork sản phẩm; chỉ cân nhắc "cấu hình hồ sơ sử dụng" (thuật ngữ, view mặc định) — quyết định ở D-3.

## 2. Hiện trạng: đã có gì cho hai nhóm này

Đã implement (đối chiếu source): Workspace/Matter + vai OWNER/EDITOR/VIEWER và ranh giới theo matter (phù hợp ethical wall cho law firm); workstream, milestone + prerequisite; Requirement vs Action; dependency/blocker/waiting-on; evidence criteria, nộp/duyệt/tranh chấp với verifier không phải người nộp; document version, chữ ký theo version; filing lifecycle (receipt ≠ approval); review grid cho DD; context records (decision/finding/risk/entity); external parties; Control Room, My Actions/My Reviews; bulk, import/export; history; delta Status Brief; khôi phục `OUTCOME_UNKNOWN`.

Chưa thấy trong source (cần xác minh lại bằng kết quả BA review): thông báo/nhắc việc (không có hạ tầng email/notification), lịch/ICS, template/playbook closing checklist, đăng ký pháp nhân có quan hệ theo thời gian, chia sẻ báo cáo ra ngoài cho khách/LP, lịch tuân thủ định kỳ, khung nhìn cross-matter đã lưu.

## 3. Phân tích khoảng cách theo công việc cần làm

| # | Công việc của người dùng | Nhóm | Hiện trạng | Khoảng cách | Tier / baseline |
|---|---|---|---|---|---|
| J1 | Mở máy sáng: cần làm gì hôm nay trên mọi giao dịch/matter | A, B | My Actions + Matters + Control Room | Chưa xác nhận UX 10 giây, thiếu "đến hạn tuần này" xuyên matter, thiếu lưu bộ lọc | A (làm trơn) → B: Saved Views P1-12 |
| J2 | Dựng checklist closing từ mẫu quen thuộc | A, B | Import CSV/Excel có preview | Không có mẫu/playbook tái sử dụng, ánh xạ cột không nhớ lại | A: lưu preset ánh xạ import (trong P0-13); mẫu checklist đầy đủ → C |
| J3 | Biết ai đang cầm bóng: phía mình/bên kia/khách/cơ quan | A, B | External parties + waiting-on | Chưa gom theo bên chịu trách nhiệm; chưa có view "chờ bên kia" gọn | A (P0-04, P0-17): nhóm Waiting-On theo bên, câu hỏi "phía ai" ngay trên checklist |
| J4 | Vòng sửa tài liệu, biết bản nào là bản hiện hành | B (chính), A | Document version, promotion, supersede | Thiếu so sánh/đánh dấu "bản đang thương lượng vs bản đã chốt" ở mức quy trình (không soạn thảo) | A: nhãn trạng thái bản rõ hơn; còn lại ngoài baseline |
| J5 | Thu chữ ký, trang chữ ký theo từng bên | A, B | Signature theo version (mức P0 tối thiểu) | Chưa có bảng ký theo người ký/trang, nhắc người ký | B: Signature Tracking P1-09 |
| J6 | DD: request list → tài liệu → issue list → báo cáo | A, B | Review grid, findings, gaps | Chưa có xuất "issues list/báo cáo DD" có nguồn; Advanced findings P1-08 | A (xuất grid) → B P1-08/P1-13 |
| J7 | Phê duyệt nội bộ (IC, LPAC, board) như điểm kiểm soát có người quyết, lý do, ngày | A | Decision record cơ bản | Chưa có luồng quyết định có cấu trúc (người phải quyết, hạn, kết quả) | B: Structured Decisions P1-04 |
| J8 | Cấu trúc pháp nhân quỹ/SPV/danh mục, ai nắm gì theo thời điểm | A | Entity record cơ bản | Không có entity master hay quan hệ theo thời gian | B: P1-05/06; đồ thị sở hữu P2-01 chưa nên |
| J9 | Nghĩa vụ nộp hồ sơ/tuân thủ định kỳ | A | Filing lifecycle một lần | Không lặp theo lịch, không nhắc | B/C: Recurring Compliance P2-03 (cần PO) |
| J10 | Báo cáo cho GC/IC/khách/partner | A, B | Delta Status Brief, export | Brief dành cho nội bộ; xuất "management-ready" và ảnh chụp lịch sử chưa có; chia sẻ ra ngoài chưa có | A: sửa độ đọc brief (BF-10); B: P1-13, P1-14; chia sẻ ngoài → C |
| J11 | Phối hợp với bên ngoài (luật sư ngoài, khách) | A, B | External party không có tài khoản | Phải xuất file tay; không portal | C: truy cập bên ngoài (đi ngược quyết định hiện tại "bên ngoài không tự có account") |
| J12 | Không bỏ sót hạn/nhắc việc | A, B | Không có thông báo | Rủi ro bỏ sót thật | C → quyết định D-4 (đây có thể là khoảng trống lớn nhất) |
| J13 | Tách bạch khách/matter, chứng minh tách bạch | B | Matter-level membership, hidden-not-found | Chưa có chỉ báo trực quan "ai thấy matter này", kiểm tra xung đột | A: hiển thị rõ phạm vi truy cập matter (đọc thêm API sẵn có); kiểm tra xung đột → C |
| J14 | Cổng ra vào/chuyển giao matter giữa đội | B | Thêm/thu hồi thành viên, history | Chưa có "bàn giao" có tóm tắt | A: dùng delta brief làm bản bàn giao |

## 4. Các cải thiện đề xuất (theo chủ đề)

### Tier A — làm trong P0 đã duyệt (không cần promote)

- **A1. Hoàn thiện flow sẵn có theo kết quả Phase 0:** sửa DEFECT/GAP từ BA review và Blocker/Major từ UX audit; đây là điều kiện trước mọi thứ khác. Nếu hai kết quả cho thấy flow golden chưa chạy đúng thì tất cả mục dưới dừng.
- **A2. "Ai cầm bóng" (J3):** thêm trường/nhóm hiển thị bên chịu trách nhiệm (nội bộ / bên kia / khách / cơ quan) dựa trên external party và waiting-on có sẵn; nhóm trong My Work và Control Room. Đo: người dùng trả lời "đang chờ ai về điều gì" ≤10 giây. `NEEDS_READ_MODEL` nếu thiếu.
- **A3. Import thông minh hơn (J2):** nhớ ánh xạ cột theo nguồn, báo lỗi theo dòng với cách sửa, import lặp lại idempotent đã có; thêm hướng dẫn "chuẩn bị checklist Excel" kèm mẫu CSV ví dụ synthetic. Không tạo template engine.
- **A4. Bản hiện hành và bản đang thương lượng (J4):** làm rõ nhãn current/superseded/đang chờ promote; luôn gắn "bản nào" vào evidence/signature trên UI.
- **A5. Báo cáo dễ đọc (J10, J14):** Status Brief dùng ngày/giờ theo múi giờ client, tên thay vì ID (BF-10), có chế độ "bàn giao matter" (delta từ mốc chọn), xuất bảng theo trục trạng thái độc lập.
- **A6. Hiển thị phạm vi truy cập (J13):** trong Matter, một khu "ai thấy matter này và vai gì" đọc từ members/verifiers; nhắc rõ Workspace OWNER không mặc định đọc matter.
- **A7. View "tuần này/quá hạn" xuyên matter (J1):** dựa My Actions + Matters; bộ lọc theo hạn. Lưu view bền → B (P1-12).

### Tier B — promote P1/P2 trong baseline (cần PO duyệt thứ tự)

Thứ tự đề xuất theo giá trị giả định cho cả hai nhóm (xác nhận bằng nghiên cứu ở Phase 1):
1. **B1 Signature Tracking (P1-09)** — J5, giá trị rõ cho closing ở cả A, B.
2. **B2 Saved Views (P1-12) + Management-Ready Export (P1-13)** — J1, J10.
3. **B3 Structured Decisions (P1-04)** — J7, đặc biệt nhóm A (IC/LPAC).
4. **B4 Advanced Findings & Risks (P1-08)** — J6 báo cáo DD.
5. **B5 Entity Master + Temporal Relationships (P1-05/06)** — J8, nhóm A.
6. **B6 Historical Report Snapshots (P1-14)** — J10, đối soát báo cáo đã gửi.
7. **B7 Recurring Compliance (P2-03)** — J9; P2 nên chỉ cân nhắc sau B1–B6 và sau khi có nhu cầu kiểm chứng.

Mỗi mục B phải qua: cập nhật SRS/AC, ADR nếu đổi dữ liệu, task, reviewer độc lập (theo quy trình repo). Plan này không tự promote.

### Tier C — ngoài baseline, để PO quyết (KHÔNG build theo plan này)

- **C1 Thông báo/nhắc việc/lịch ICS (J12).** Khoảng trống rủi ro cao nhất cho cả hai nhóm; cần quyết định về kênh (email?), nhà cung cấp, quyền riêng tư, chi phí. Gợi ý bước nhỏ nhất nếu PO muốn: digest hằng ngày tự tạo từ My Actions (không cần thêm miền dữ liệu mới), chưa làm realtime.
- **C2 Cổng truy cập bên ngoài (J11)** — đổi quyết định "bên ngoài không tự có account"; cần phân tích bảo mật và phân quyền mới.
- **C3 Mẫu/playbook closing checklist (J2 đầy đủ).**
- **C4 Kiểm tra xung đột lợi ích, thời gian/billing, soạn thảo/so sánh văn bản, e-sign, e-filing, AI** — đã bị loại khỏi định vị hiện tại; ghi nhận để PO biết nhóm law firm có thể kỳ vọng.

## 5. Lộ trình theo pha (tương đối, không hứa ngày)

| Pha | Mục tiêu | Nội dung | Cổng ra |
|---|---|---|---|
| 0 | Biết sự thật hiện tại | Nhận kết quả BA review + UX audit; phân loại và sửa Blocker/DEFECT P0–P1; xác nhận ba Golden Workflow chạy đúng | BF-01..10 đóng có bằng chứng độc lập; GW-01/02/03 walk-through đạt |
| 1 | Học từ người dùng thật | Phỏng vấn + thử nhiệm vụ 5–8 người/nhóm (A và B) trên dữ liệu synthetic; kiểm chứng giả thuyết H1–H8 | Báo cáo nghiên cứu; điều chỉnh thứ tự Tier A/B |
| 2 | Tier A | A2–A7 theo thứ tự giá trị; mỗi mục có AC quan sát được | Đạt chỉ số mục 6 trong thử nghiệm lặp lại |
| 3 | Tier B (đã được PO duyệt) | B1→B2→B3… từng mục, mỗi mục một vòng spec→build→verify độc lập | Từng mục: AC pass + reviewer độc lập |
| 4 | Quyết định Tier C | PO quyết C1–C4 dựa dữ liệu pha 1 | ADR/quyết định ghi lại |

## 6. Chỉ số thành công (đo trong thử nghiệm có kịch bản, không cần thêm tracking)

- Biết việc kế tiếp và lý do trong ≤10 giây (mục tiêu đã duyệt, nhóm A và B).
- Trả lời "đang chờ ai về điều gì" ≤10 giây (A2).
- Thời gian dựng checklist closing từ Excel đến khi ra bảng có blocker (A3), so với làm tay.
- Thời gian chuẩn bị bản status/bàn giao matter (A5).
- Tỷ lệ hoàn thành nhiệm vụ golden không cần hướng dẫn ≥ ngưỡng đặt ở Phase 1 (đề xuất 80%).
- 0 trường hợp người dùng hiểu sai "hoàn tất = đã xác minh" hoặc "receipt = đã duyệt".

## 7. Giả thuyết cần kiểm chứng ở Phase 1

H1 nhóm B ưu tiên chữ ký và checklist hơn mọi thứ khác. H2 nhóm A ưu tiên danh mục xuyên giao dịch và nghĩa vụ định kỳ. H3 thiếu nhắc việc là rào cản chấp nhận lớn nhất (C1). H4 người dùng chấp nhận nhập checklist qua Excel thay vì mẫu dựng sẵn. H5 "bên kia đang cầm bóng" là câu hỏi họ hỏi nhiều nhất. H6 law firm cần tách khách chặt hơn mức matter-level hiện tại. H7 báo cáo cho khách/IC là sản phẩm đầu ra họ quan tâm nhất. H8 một sản phẩm đủ cho cả hai, không cần hai cấu hình. Mỗi giả thuyết ghi rõ điều gì sẽ bác bỏ nó trong kịch bản phỏng vấn.

## 8. Quyết định cần PO

| ID | Câu hỏi | Khuyến nghị |
|---|---|---|
| D-1 | Duyệt Tier A (không đổi baseline)? | Duyệt, sau Phase 0 |
| D-2 | Thứ tự promote Tier B | Giữ B1→B7, điều chỉnh sau Phase 1 |
| D-3 | Một sản phẩm với "hồ sơ sử dụng" (thuật ngữ + view mặc định) hay hai cấu hình riêng | Một sản phẩm; hồ sơ sử dụng chỉ khi Phase 1 chứng minh cần |
| D-4 | Thông báo/nhắc việc có vào lộ trình không và kênh nào | Quyết sớm — có thể là điều kiện chấp nhận |
| D-5 | Truy cập bên ngoài (C2) | Chưa; giữ xuất file/brief cho pilot |
| D-6 | Nhóm nào ưu tiên cho pilot đầu tiên (A hay B) | Chọn một để tránh loãng; đề xuất B vì giá trị closing/ký rõ và mạnh với ranh giới matter hiện có, xác nhận ở Phase 1 |

## 9. Rủi ro

Giả định persona sai (giảm bằng Phase 1 trước khi build Tier B); mở rộng phạm vi âm thầm sang law-firm management (billing, conflicts) — chặn bằng Tier C; kỳ vọng thông báo (D-4) nếu không xử lý sẽ làm pilot thất bại dù flow đúng; số liệu cải thiện không thể kết luận nếu BA/UX review cho thấy lỗi nền chưa sửa; nhiều agent sửa chung source (xung đột ghi) — mọi triển khai Tier A/B phải có task một chủ sở hữu và isolated branch/worktree theo AGENTS.md.

## 10. Chưa làm / chưa kiểm

Chưa có phỏng vấn người dùng; chưa chạy ứng dụng để xác nhận từng khoảng cách (dựa trên đọc source và tài liệu); chưa ước lượng công sức chi tiết cho Tier B; chưa đánh giá pháp lý theo jurisdiction.
