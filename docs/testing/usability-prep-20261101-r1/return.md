# RETURN — MC-ZCODE-USABILITY-PREP-20261101 (CO-19 preparation, docs-only)

- **Người thực hiện:** actual ZCode (session ZCode mới, model GLM) — đúng prompt dispatch mục 1.
- **Ngày:** 2026-11-01. **Nhánh:** `codex/unified-project-flow`.
- **Base:** `6b0c358` (HEAD tại thời điểm bắt đầu; cây dirty song song của các task khác không đụng tới). **Head:** `6b0c358` + 6 file mới **chưa commit** (không commit — commit/merge không thuộc quyền tác vụ này).
- **Phạm vi:** docs-only. **KHÔNG đụng `apps/**`, KHÔNG đụng `project-status.md`, KHÔNG gửi mời ai, KHÔNG thu PII** — đúng dispatch §1.

## 1. Outputs (6 file, đúng dispatch §3)

| File | Nội dung |
|---|---|
| `dataset-checklist.md` | Bộ dữ liệu synthetic chỉ định đầy đủ số lượng: 1 workspace / 4 tài khoản / 5 hồ sơ (M1–M3 = GW-01..03 theo BA r1; M4 = hồ sơ bẫy có blocker thật; M5 = target import) / 4 party / 4 document / 12 requirement / 7 action / 6 claim (gồm case REJECTED + case EXPIRED seed bằng `ValidFor=1s`) / 3 filing (2 chu kỳ supplement; approval-observed + outcomeVerification PENDING; đường âm WITHDRAWN) / 1 milestone / 2 context record / 1 review grid / CSV import 12 dòng (10 hợp lệ + 2 lỗi có đáp án) / case **receipt replay** (T10: fault sau commit trên A5, assertion 1 event) / 18 dòng smoke API / yêu cầu môi trường E-1..E-7 |
| `session-scripts.md` | 6 kịch bản phiên A–F theo test-plan §3: quy tắc không-gợi-ý (thang C1/C2/C3, bế tắc 3'), lời mở đầu nguyên văn, task card nguyên văn cho T1/T2/T3/T4/T5/T6/T8/T9/T10, probe H-A..H-E, wrap-up, bảng nhiệm vụ × giả thuyết × dữ liệu |
| `forms.md` | Phiếu đồng ý (vi, nguyên văn, bản ký PO giữ riêng ngoài evidence), phiếu quan sát nhiệm vụ, phiếu chấm T1 3-ý-10s, SUS 10 câu tiếng Việt + cách chấm, bảng chấm câu hỏi định nghĩa, phiếu tổng kết |
| `metrics-thresholds.md` | Ngưỡng test-plan §5 vận hành hoá (≥80%/phiên chính; T1 ≥4/5 mỗi ý ≤10s; SEQ trung vị ≥5 — ghi chú tương đương cách ghi "≤5" trong plan; hiểu sai = 0 ngưỡng cứng; SUS ≥70), answer key T1, quy tắc verdict H-A..H-E, template báo cáo, 6 rào chắn suy diễn |
| `logistics-checklist.md` | 5 điều kiện mở khoá, tiêu chí tuyển 5–8 người (in-house ≥2 / firm ≥2 / manager 1 / reviewer tuỳ chọn) + 3 câu sàng + thư mời mẫu, lịch 2 nửa ngày, thiết bị (desktop 1440 + 1 phiên mobile 390 gán D; vi mặc định), runbook T-1/ngày chạy 10 bước, xử lý sự cố, 7 quyết định còn mở (mỗi cái có khuyến nghị + mặc định nếu PO im lặng) |
| `return.md` | File này |

## 2. Đối chiếu yêu cầu → kết quả

| Yêu cầu dispatch | Kết quả |
|---|---|
| 6 kịch bản A–F, T1–T10, H-A..H-E, quy tắc không-gợi-ý | ✅ session-scripts.md (T7 không nằm trong 6 phiên theo test-plan §3 — ghi rõ ở đó; dữ liệu M2 vẫn đủ để T7 chạy sau nếu muốn) |
| Bộ dữ liệu chuẩn, số lượng chính xác, khớp 3 GW + matter bẫy + receipt replay | ✅ dataset-checklist.md §3–§8 (GW shape theo receipts BA r1; EXPIRED seed xác định bằng `ValidFor=1s` — `evidence.go:292` "accepted proof is past its validity"; receipt replay = replay receipt thao tác theo T10/H-E, ghi rõ KHÔNG phải probe cross-matter R-02) |
| Phiếu quan sát + SUS 10 câu vi + phiếu đồng ý (không PII lưu cùng evidence) | ✅ forms.md |
| Ngưỡng test-plan §5 + template báo cáo | ✅ metrics-thresholds.md |
| Logistics cho PO (tuyển, thời lượng, thiết bị) | ✅ logistics-checklist.md |

## 3. Kiểm tra đã chạy / chưa chạy

- **Đã chạy (docs-only):** đối chiếu chéo từng mục dispatch với test-plan §1–§7, task-walkthroughs T1–T10, journey-walkthroughs GW-01..03 (BA r1), AC-137 (acceptance-criteria.md:331), import contract (local-contract.md §W6 rows 4–8), EXPIRED semantics (`apps/backend/internal/core/domain/matter/evidence.go:292`, state-semantics.md:51), walkthrough-env D-1(b), glossary D-3. Kiểm tra `git status` thực tế (base 6b0c358, chỉ 6 file mới, 0 file khác bị chạm).
- **Chưa chạy (nằm ngoài phạm vi docs-only, đúng dispatch):** chưa dựng env, chưa seed thử, chưa smoke API, chưa chạy fault-injection, chưa có người dùng thật, không gửi mời. Mọi số lượng seed là **chỉ định để kiểm chứng khi seed**, không phải bằng chứng runtime.

## 4. Rủi ro & việc còn mở (cần Codex intake / PO)

| ID | Vấn đề | Hành động đề xuất |
|---|---|---|
| R-01 (P2, GAP MỚI) | **Stub IdP chưa có trang login trình duyệt** (r2 chỉ có `/introspect` machine-token) + phải chấp nhận `redirect_uri` của origin frontend trial — không có mảnh này thì participant không vào được UI (E-2 trong dataset-checklist §11) | Codex ghi nhận vào workboard-findings; gán vào task enablement kế tiếp; khuyến nghị: trang login tối giản trên chính stub (không phụ thuộc ZITADEL/shared runtime) |
| R-02 (P2, GAP MỚI) | **Fault-injection T10** chưa tồn tại (cắt response sau commit, bật/tắt được) — phiên A không chạy được chân T10 nếu thiếu (E-4) | Như trên; phương án dự phòng thủ công đã ghi trong dataset §8 nhưng không ổn định |
| R-03 (P3) | Seed EXPIRED dựa trên `ValidFor` của accepted proof — cần executor xác nhận API assessment nhận `ValidFor` như domain mô tả khi seed thật | Executor smoke dòng 9 (dataset §10); nếu khác → điều chỉnh seed, không đổi ngưỡng |
| R-04 (P3) | F1/F2 shape filing phụ thuộc trạng thái 0011 (criterion purpose SIGNATURE) — checklist cố tình dùng `signatureNotRequired` theo receipts r1 để không phụ thuộc 0011; nếu 0011 đã áp, kiểm lại đường seed | Executor chạy smoke 10–12 (dataset §10) |
| R-05 (P3) | Phiên D cần brief M1 ≥20 events — phát sinh tự nhiên khi seed nhưng chưa đo được (docs-only) | Smoke dòng 13–14; nếu thiếu → seed thêm thao tác phụ |
| R-06 (P2) | Một số mục trong test-plan §5 cách viết "SEQ ≤5" mơ hồ (thang dễ hay khó) — đã vận hành hoá thành "trung vị độ dễ ≥5" kèm chú thích tương đương, **không đổi ngưỡng gốc** | PO/Nhờ reviewer xác nhận cách hiểu khi xem metrics §1 dòng 3 |
| R-07 (P3) | Thông dịch "receipt replay case" trong dispatch = replay receipt thao tác (T10/H-E); đã ghi rõ ranh giới với probe cross-matter R-02 | Nếu PO hiểu khác → chỉnh dataset §8, các mục còn lại không đổi |

## 5. Đề xuất trạng thái kế tiếp

**IN_REVIEW** — tài liệu chuẩn bị xong theo phạm vi dispatch, nhưng theo AGENTS.md: báo cáo này không phải review hoàn tất; cần (a) Codex intake ghi nhận R-01/R-02 (và R-03..05 khi seed) vào workboard, (b) một reviewer độc lập soát trước khi coi DONE, (c) PO tick bảng quyết định còn mở (logistics §8). Khâu tuyển người + chạy phiên thuộc PO + moderator — bộ prep **dừng tại đây** đúng dispatch §4.

## 6. Đã bỏ qua / rủi ro còn lại

- **Đã bỏ qua:** dựng/chạy env và seed thật (ngoài phạm vi docs-only); soạn nội dung gửi mời ngoài thư mẫu; không cập nhật `project-status.md`/workboard (đúng lệnh); không commit.
- **Rủi ro còn lại:** các con số seed (§3–§7) chưa được kiểm chứng runtime — lỗi thực tế (nếu có) sẽ lộ ở bước smoke 18 dòng, không ở trong phiên; hai gap env R-01/R-02 chưa có chủ thực hiện; nếu UX-L-01/02 chưa đóng kịp ngày trial, toàn bộ số liệu mất hiệu lực theo metrics §0 — rủi ro lịch, không phải rủi ro thiết kế.
