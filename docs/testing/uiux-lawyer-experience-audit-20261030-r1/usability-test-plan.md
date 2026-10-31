# Usability test plan — kiểm chứng với luật sư thật (SAU khi đóng Blocker)

Trạng thái: kế hoạch, CHƯA chạy. Điều kiện tiên quyết: UX-L-01/02 đóng + đường chạy có dữ liệu (UX-L-03) — không mời ai thử sản phẩm không vào được.

## 1. Mục tiêu & giả thuyết (kế thừa H1–H8 của MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030, chọn 5 kiểm được bằng nhiệm vụ)
- H-A: Luật sư nhận ra "việc tiếp theo + vì sao" trong ≤10 giây trên My Work (AC-137-style, ≥4/5).
- H-B: Phân biệt Action vs Requirement và "hoàn tất ≠ đã xác minh" sau ≤2 màn hình giải thích.
- H-C: Tìm được đường từ blocker về điều kiện tiên quyết mà không lạc (re-orient loop).
- H-D: Reviewer hiểu đúng phải xét theo version/criterion nào trước khi bấm.
- H-E: Khôi phục sau lỗi mạng/OUTCOME_UNKNOWN mà không tạo trùng thao tác.

## 2. Người tham gia
- 5–8 người: ≥2 legal quỹ đầu tư (in-house: GC/counsel), ≥2 law firm (associate/paralegal), 1 manager/scoped viewer, (tùy) 1 reviewer độc lập thường xuyên. Đa dạng độ quen tool. Không dùng người trong dự án.

## 3. Kịch bản (10 nhiệm vụ = task-walkthroughs.md T1–T10, rút gọn còn 6 phiên)
- Phiên A (Contributor/Owner, 25 phút): T1 → T2 → T3 → T10(gây lỗi mạng có kiểm soát).
- Phiên B (Reviewer, 15 phút): T4 + 1 case rejected/expired.
- Phiên C (Owner, 20 phút): T5 → T6 (2 chu kỳ supplement).
- Phiên D (Manager, 15 phút): T8 (soạn brief từ delta) + T2 đọc loại.
- Phiên E (Contributor, 15 phút): T9 import + sửa 2 lỗi import.
- Phiên F (tất cả, 10 phút): câu hỏi định nghĩa (H-B) + SUS ngắn.

## 4. Dữ liệu & đạo đức
- 100% synthetic (bộ Atlas synthetic có sẵn); không PII; ghi hình màn hình có sự đồng ý; không thu thông tin cá nhân ngoài vai trò; lời mời ghi rõ "sản phẩm đang thử nghiệm, dữ liệu giả".

## 5. Chỉ số & ngưỡng đạt
- Tỷ lệ hoàn thành nhiệm vụ ≥80% mỗi phiên chính; thời gian trung vị T1 ≤10s (AC-137: ≥4/5 đúng 3 câu trả lời trong 10s); SEQ ≤5 cho luồng chính; SUS ≥70 tổng; "hiểu sai completed=verified hoặc receipt=approval" = **0 trường hợp** (ngưỡng cứng, theo persona-plan).
- Ghi: dead-end (bế tắc phải quay lại), error rate, số lần dùng "Thử lại" vô ích.

## 6. Thiết bị & môi trường
- Desktop 1440 + 1 phiên mobile 390; vi là ngôn ngữ mặc định (đối tượng chính), en cho 1 người nếu có; runtime demo/populated ổn định, network fault injection có kịch bản.

## 7. Sau chạy
- Báo cáo tìm kiếm định tính + số; cập nhật improvement-plan (Tier A/B); KHÔNG tự coi là acceptance — review độc lập theo quy trình dự án.
