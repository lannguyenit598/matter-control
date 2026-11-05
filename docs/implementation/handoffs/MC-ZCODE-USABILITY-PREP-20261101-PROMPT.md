# MC-ZCODE-USABILITY-PREP-20261101 — prompt cho session ZCode mới (CO-19 preparation)

Soạn bởi actual ZCode (coordinator) 2026-11-01. Người thực hiện: session ZCode mới. Khuyến nghị dispatch: **BẤT KỲ LÚC NÀO** (docs-only, 0 xung đột tree) — ưu tiên thấp hơn 2 prompt kia nhưng chạy song song được. Chuyển nguyên văn từ mục 1.

## 1. Vai trò và ranh giới

Bạn chuẩn bị **toàn bộ vật chất cho phiên thử với luật sư thật** (theo `docs/testing/uiux-lawyer-experience-audit-20261030-r1/usability-test-plan.md`). Docs-only: KHÔNG đụng apps/**, không deploy, không liên hệ người tham gia thật (phần đó là PO), không thu PII. Dữ liệu synthetic 100%.

## 2. Việc

1. **6 kịch bản phiên** (A–F theo test-plan §3): script moderator từng phiên — lời thoại mở đầu, nhiệm vụ T1–T10 tương ứng, câu hỏi H-A..H-E, quy tắc không-gợi-ý.
2. **Bộ dữ liệu synthetic chuẩn**: checklist matter/action/evidence/filing cần seed qua walkthrough env (khớp 3 Golden Workflows + 1 matter "bẫy" có blocker + receipt replay case); liệt kê chính xác số lượng để người seed không phải đoán.
3. **Phiếu ghi**: form quan sát từng nhiệm vụ (thời gian, sai lầm, dead-end, SEQ 1–7), form SUS 10 câu (tiếng Việt), form đồng ý tham gia (tiếng Việt, không PII lưu cùng evidence).
4. **Ngưỡng đạt**: bảng metrics từ test-plan §5 (≥4/5 trong 10s; 0 hiểu sai completed≠verified/receipt≠approval; SUS ≥70) + template báo cáo kết quả.
5. **Logistics checklist** cho PO: tiêu chí tuyển 5–8 người (in-house fund 2+, law firm 2+, manager 1, reviewer 1), thời lượng, thiết bị (desktop 1440 + 1 phiên mobile 390).

## 3. Outputs

`docs/testing/usability-prep-20261101-r1/`: session-scripts.md, dataset-checklist.md, forms.md, metrics-thresholds.md, logistics-checklist.md, return.md. KHÔNG đụng project-status.md; KHÔNG gửi mời ai.

## 4. Hoàn thành

PO có thể in/cầm chạy ngay mà không phải chuẩn bị thêm; dừng — khâu tuyển người và chạy phiên thuộc PO + moderator.
