# Logistics checklist cho PO — usability trial (MC-ZCODE-USABILITY-PREP-20261101, mục 2)

PO in tài liệu này + các tài liệu cùng bộ và cầm chạy được. Khâu **tuyển người và chạy phiên thuộc PO + moderator** — bộ prep này dừng ở "sẵn sàng in".

## 1. Điều kiện mở khoá (CHƯA ĐỦ thì KHÔNG mời ai — test-plan §"điều kiện tiên quyết")

| # | Điều kiện | Trạng thái cần thấy | Ai xác nhận |
|---|---|---|---|
| 1 | UX-L-01 (tiêu đề "Matters/Hồ sơ") đã đóng | rendered re-check pass | Codex intake + reviewer độc lập |
| 2 | UX-L-02 (locale kẹt EN) đã đóng | probe timeline H1-vi pass trên build chạy trial | như trên |
| 3 | Đường có dữ liệu hoạt động | walkthrough env (D-1(b)) up + smoke 18/18 (`dataset-checklist.md` §10) | người seed env |
| 4 | Gap env còn thiếu được đóng | E-2 (stub IdP có trang login) + E-4 (fault-injection T10) tồn tại và đã thử 1 lần | enablement/executor |
| 5 | Quyết định còn mở ở §8 đã chốt | bảng có chữ PO | PO |

Nếu điều kiện nào chưa xong vào ngày gần: **dời lịch, không chạy "tạm"** — mời người ngoài vào sản phẩm không vào được/lệch tiếng là thiệt hại kép (bài học UX-L-03).

## 2. Tuyển người (5–8 người)

### Tiêu chí (theo test-plan §2)

| Nhóm | Số tối thiểu | Sàng lọc |
|---|---|---|
| Legal in-house tại quỹ đầu tư / công ty quản lý quỹ (GC, counsel) | **2** | Đang làm việc pháp lý giao dịch (M&A/đầu tư), dùng Excel/tracker nội bộ hằng ngày |
| Law firm (associate/senior associate/paralegal) | **2** | Đang chạy closing checklist/DD cho khách hàng |
| Manager / scoped viewer (GC COO, kiểm soát nội bộ, người nhận báo cáo) | **1** | Không tự làm việc, chỉ theo dõi/báo cáo |
| Reviewer độc lập thường xuyên (đối soát/xác minh) | (tuỳ chọn) 1 | Có vai duyệt/xác minh tài liệu trong quy trình |
| **Tổng** | **5–8** | |

Nguyên tắc sàng:
- **Không dùng người trong dự án** (dev, PO, gia đình đội ngũ).
- **Đa dạng độ quen tool** trong mỗi nhóm: 1 người quen tool đa, 1 người chủ yếu Excel/email.
- Không hỏi PII khi sàng (không họ tên đầy đủ trong danh sách phân tích; danh sách mời do PO giữ).
- 3 câu sàng lọc đề xuất (trả lời tự do, không đúng/sai): "Anh/chị hiện phụ trách loại công việc pháp lý gì?", "Một tuần của anh/chị dùng những công cụ gì để theo dõi việc?", "Anh/chị có bao giờ phải tổng hợp tình trạng để báo cáo cho cấp trên/khách không?" — đủ để gán nhóm + độ quen tool, không lộ danh tính vào evidence.

### Thư mời mẫu (PO gửi; bộ prep KHÔNG gửi mời ai)

> "Anh/chị được mời tham gia buổi thử 30–45 phút một **công cụ quản lý công việc pháp lý đang thử nghiệm**. Toàn bộ dữ liệu trong buổi thử là **dữ liệu giả** — anh/chị không cần chuẩn bị gì, không làm trên hồ sơ thật. Buổi gồm: làm vài nhiệm vụ quen thuộc (máy tính bàn), trả lời vài câu hỏi, và một bảng câu hỏi ngắn. Màn hình được ghi lại để cải thiện sản phẩm, ẩn danh theo vai trò, không kèm tên; anh/chị có thể dừng bất cứ lúc nào. Địa điểm/thời gian: [điền]. Vị trí ghế có hạn — mong anh/chị xác nhận sớm."

Ghi rõ trong thư: sản phẩm đang thử nghiệm + dữ liệu giả (bắt buộc theo test-plan §4).

### Quà/hoặc trợ giúp

Quyết PO. Khuyến nghị: có (voucher/qua tải nhẹ), ghi trong thư mời. Mặc định nếu PO không nói: không có quà, thư mời nêu "cảm ơn + góp ý của anh/chị sẽ ảnh hưởng trực tiếp đến sản phẩm".

## 3. Thời lượng & lịch

| Phiên | Persona | Giờ chuẩn bị + chạy | Ghế đặt trước |
|---|---|---|---|
| A | Contributor/Owner | 45' (10' giấy tờ/thiết bị + 25' phiên + 10' dự phòng) | slot riêng |
| B | Reviewer | 35' | slot riêng |
| C | Owner | 40' | slot riêng |
| D | Manager (có chân mobile 390) | 35' | slot riêng |
| E | Contributor/import | 35' | slot riêng |
| F | mỗi người 10' | **gắn ngay sau phiên chính của từng người** (khuyến nghị; mặc định nếu PO không quyết — chạy luôn, không hẹn phiên F riêng) | gộp slot trên |

Khuyến nghị lịch: **2 nửa ngày** — ngày 1: A, B, C (3 người); ngày 2: D, E (+1–3 người còn lại). Giữa 2 phiên liên tiếp ≥30 phút để reset+seed lại (dataset §9, <5 phút) và moderator đi phiếu tổng kết. Mặc định nếu PO không quyết: theo khuyến nghị này.

## 4. Thiết bị & phòng

| Mục | Chuẩn | Ghi chú |
|---|---|---|
| Máy chính | Desktop/laptop màn ≥**1440×900**, trình duyệt Chrome/Edge bản mới, profile sạch (không extension), đăng xuất hết tài khoản khác | máy dùng riêng cho trial; đã login sẵn tài khoản đúng vai **trước** khi participant vào phòng |
| Phiên mobile | **1 phiên trên 390px** (thiết bị thật hoặc devtools kích thước 390×844) — gán cho **phiên D** (khuyến nghị; mặc định nếu PO không nói: phiên D) | quota: đúng 1 phiên, không mở rộng trong đợt này |
| Ngôn ngữ | **vi** mặc định cho mọi người; **en** cho tối đa 1 participant nếu tự nhiên dùng tiếng Anh | đặt trong app, không đổi giữa chừng trừ khi participant tự đổi (quan sát được) |
| Ghi hình | 1 tool quay màn hình (không quay camera) + pin/ổ đủ 4 giờ | kiểm tra 5' trước từng phiên |
| Dự phòng | 1 máy thứ 2 cùng cấu hình + file CSV + PDF mẫu (T3/T9) đã cài sẵn | nếu máy chính lỗi → dừng phiên, đổi máy, reset dữ liệu, tính lại giờ |
| Phòng/không gian | yên tĩnh, 2 ghế (participant + moderator), note-taker ngồi sau hoặc online | nếu online: participant dùng máy được gửi/được hướng dẫn cài — **không** gửi credential qua chat |
| Bìa tài liệu | task card in + phiếu in (forms) + **phong bì credential** (tài khoản/mật khẩu synthetic của phiên đó) | credential chỉ đưa participant lúc bắt đầu; thu lại sau phiên |

## 5. Runbook chuẩn bị (T-1 ngày) và ngày chạy

### T-1 ngày

1. ☐ Đủ điều kiện mở khoá §1 (5/5).
2. ☐ Env trial up: PG container + `mcapi` + stub IdP riêng port (walkthrough-env §2) — KHÔNG đụng :3000/:8080 của task khác.
3. ☐ Seed bộ dữ liệu đúng `dataset-checklist.md` §3–§7.
4. ☐ Smoke 18/18 (dataset §10) — in trang smoke, tick từng dòng.
5. ☐ Thử phục hồi T10 một lần trên máy dự phòng (fault on → OUTCOME_UNKNOWN → retry → 1 event) rồi **reset lại**.
6. ☐ In bộ tài liệu: session-scripts + forms (số lượng = số người + 2 dự phòng).
7. ☐ Lịch gửi participant + phòng/máy sẵn.

### Ngày chạy — mỗi phiên (checklist lặp lại)

1. ☐ **Reset + seed lại** (dataset §9) — kể cả phiên đầu ngày.
2. ☐ Smoke nhanh 4 dòng đầu (dataset §10: readyz/401/200/401) + dòng 5 (hàng chờ reviewer) + dòng 18 (locale vi).
3. ☐ Máy chính: đăng nhập sẵn tài khoản đúng vai; profile sạch; đóng tab thừa.
4. ☐ Bật ghi hình; phiếu quan sát đã in cho từng nhiệm vụ; bìa credential sẵn.
5. ☐ Participant vào: phiếu đồng ý (forms §1) → thu về giữ riêng (PO) → mở đầu chung (session-scripts §2).
6. ☐ Chạy phiên theo session-scripts; note-taker đi phiếu từng nhiệm vụ.
7. ☐ Phiên F gắn ngay sau (10') — SUS + câu hỏi định nghĩa.
8. ☐ Participant rời → moderator đi phiếu tổng kết (forms §6) trong 5 phút (còn nhớ chi tiết).
9. ☐ Reset dữ liệu cho phiên kế; thu credential; kiểm tra ghi hình đã lưu đúng nơi.
10. ☐ Cuối ngày: teardown env (dataset §9) nếu hết đợt; nếu còn ngày mai: teardown vẫn làm rồi dựng lại (sạch hơn giữ).

### Xử lý sự cố

| Tình huống | Hành động |
|---|---|
| Env chết giữa phiên | Ghi mốc thời gian; cố sửa ≤5'; không được → kết thúc phiên với phần đã làm, đánh dấu phiên `PARTIAL_TECH`, hẹn chạy lại participant đó trên phiên mới (không gộp số) |
| Participant gặp lỗi UI ngoài kịch bản | Để nó xảy ra — đó là data; ghi nguyên văn; chỉ khôi phục thao tác nếu nhiệm vụ không thể tiếp tục |
| Participant muốn dừng | Dừng ngay, thu credential, xoá ghi hình theo yêu cầu, không dùng số liệu phiên đó |
| Nhầm trạng thái dữ liệu (đã bị phiên trước làm đổi) | Đánh dấu phiên `INVALID_DATASET` trong báo cáo; không gộp số; reset và (nếu kịp) chạy lại |

## 6. Dữ liệu & đạo đức (tóm tắt điều hành — chi tiết ở forms.md)

- 100% synthetic; không PII vào evidence; phiếu đồng ý ký bản giấy PO giữ riêng.
- Trích dẫn chỉ theo vai trò; bản ghi màn hình ≤30 ngày rồi xoá; ghi chép phân tích xoá sau khi báo cáo phê duyệt.
- Không mời/làm việc với người tham gia có quan hệ trực tiếp với nội dung hồ sơ giả (tránh gợi nhớ dữ liệu thật).
- Trial KHÔNG tạo tài khoản thật, không đưa dữ liệu participant vào hệ thống nào khác ngoài mã P#.

## 7. Vai trò trong phòng

| Vai | Làm gì | Khuyến nghị nhân sự |
|---|---|---|
| Moderator | Đọc task card, theo session-scripts, chấm T1, quản gợi ý thang | 1 người đã đọc kỹ toàn bộ bộ prep, tập nói mở đầu 2 lần trước |
| Note-taker | Điền phiếu quan sát + sổ hiểu sai + ghi nguyên văn | 1 người (khuyến nghị có — vì moderator vừa đọc vừa chấm giờ không kẻ ghi đủ) |
| PO | (Ngoài phòng) tuyển người, thư mời, giữ phiếu đồng ý, quyết §8 | PO; nếu PO muốn ngồi nghe: ngồi ngoài tầm nhìn participant |

Mặc định nếu chỉ có 1 người: moderator kiêm note — bắt buộc bật ghi hình và dùng form có sẵn thời gian; phiếu tổng kết đi ngay sau phiên.

## 8. Quyết định còn mở — cần PO tick (khuyến nghị đi trước, mặc định nêu rõ)

| # | Câu hỏi | Khuyến nghị | Mặc định nếu PO im lặng |
|---|---|---|---|
| 1 | Phiên F chạy ngay sau phiên chính hay phiên nhóm riêng? | **Ngay sau phiên chính** (nhớ còn nóng, không tốn slot thêm) | Ngay sau phiên chính |
| 2 | Phiên mobile 390 gán cho phiên nào? | **Phiên D (manager)** — việc đọc/báo cáo hợp scope mobile của P0 | Phiên D |
| 3 | Có note-taker riêng không? | **Có** (moderator không kẻ ghi đủ khi vừa chấm giờ T1) | 1 người kiêm cả hai |
| 4 | Có quà/cảm ơn không? | **Có** (nhẹ, ghi trong thư mời) | Không có, thư mời nêu tác động của góp ý |
| 5 | Chạy 2 nửa ngày (A,B,C — D,E,…) hay dồn 1 ngày? | **2 nửa ngày** (đủ thời gian reset giữa phiên, moderator đỡ kiệt sức) | 2 nửa ngày |
| 6 | Participant thứ 6–8 (nếu tuyển được) dùng lại kịch bản nào? | A và E (2 phiên quyết định nhiều nhất cho Tier A) | A, E theo thứ tự tuyển được |
| 7 | Cho phép participant chạy thêm "tuỳ sáng tạo" ngoài task card nếu họ hào hứng? | **Cho phép ở 3 phút cuối phiên** (dữ liệu quý, không phá đo lường) | Cho phép 3 phút cuối |
