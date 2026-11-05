# Chỉ số, ngưỡng đạt và template báo cáo — usability trial (MC-ZCODE-USABILITY-PREP-20261101, mục 2)

Nguồn ngưỡng: `usability-test-plan.md` §5 (đã chốt) + AC-137 protocol (`docs/requirements/acceptance-criteria.md`). Tài liệu này chỉ **vận hành hoá cách đo và chấm**, không đổi ngưỡng.

## 0. Điều kiện hiệu lực của đợt trial

Kết quả chỉ có giá trị khi:
- UX-L-01 (tiêu đề Workspaces) + UX-L-02 (locale kẹt EN) đã **đóng có bằng chứng rendered** trên build chạy trial; đường có dữ liệu (UX-L-03/D-1(b) walkthrough env) chạy ổn định.
- Không demo không-dữ-liệu, không đụng runtime chia sẻ của task khác (xem logistics §1).
- Bộ dữ liệu reset đúng `dataset-checklist.md` trước mỗi phiên (nếu một phiên chạy trên dữ liệu lệch trạng thái → phiên đó đánh dấu `INVALID_DATASET`, không gộp số).

## 1. Bảng ngưỡng (không đổi so với test-plan §5)

| # | Chỉ số | Ngưỡng đạt | Cách đo | Nguồn dữ liệu |
|---|---|---|---|---|
| 1 | Tỷ lệ hoàn thành nhiệm vụ, **mỗi phiên chính** (A, B, C, D, E) | ≥80% nhiệm vụ trong phiên | "Hoàn thành" = participant tự đi tới kết quả không cần gợi ý ≥C2 (C1 không chấm hỏng); đếm trên phiếu quan sát | Phiếu quan sát (forms §2) |
| 2 | T1 — hiểu việc tiếp theo + vì sao trong ≤10 giây | **≥4/5 participant** đúng cả 3 ý, mỗi ý trong 10 giây; nếu chạy >5 người thì giữ nguyên tỷ lệ AC-137: **≥80%** participant | Bấm giờ từng ý; chấm theo answer key §2.1 | Phiếu T1 (forms §3) |
| 3 | SEQ luồng chính (trung bình mỗi phiên chính) | trung vị **≥5** (thang 1=rất khó…7=rất dễ; tương đương cách ghi "độ khó ≤5" trong test-plan) | SEQ sau mỗi nhiệm vụ; lấy trung vị mỗi phiên | Phiếu quan sát |
| 4 | Hiểu sai "hoàn tất = đã xác minh" hoặc "biên nhận = chấp thuận" | **0 trường hợp** (ngưỡng cứng, toàn bộ participant) | Đếm từ (a) trả lời Q1/Q2 phiên F sai, (b) phát biểu ngược hai trục khi làm nhiệm vụ (phiếu quan sát cột hiểu sai) | Phiếu F + phiếu quan sát |
| 5 | SUS tổng thể | ≥70/100 | Câu chẵn/lẻ chuẩn (forms §4); điểm từng người; báo cáo cả trung vị | Phiếu SUS |
| 6 | Dead-end, error rate, "Thử lại" vô ích | Không ngưỡng đạt — **ghi định lượng đầy đủ** để xếp hạng sửa lỗi | Mỗi nhiệm vụ 1 dòng; tổng hợp theo tần suất × mức độ | Phiếu quan sát + ghi hình |

Quy tắc chấm hoàn thành: một nhiệm vụ có nhiều phần (T3 = hoàn tất action + nộp evidence) được tính **đạt khi cả các phần xong**; gợi ý C2/C3 → "đạt sau gợi ý" (tính không-độc-lập khi đo ngưỡng 1).

## 2. Answer key chấm

### 2.1 T1 — 3 ý (phiên A, AC-137-style trên My Work)

| Ý | Đúng nếu participant nêu |
|---|---|
| 1. Việc tiếp theo | Chỉ đúng **việc đang sẵn sàng của chính họ** (A4 "Gửi biên bản bàn giao cho IC" trên M1) — không phải việc bị chặn (A1) hay đang chờ (A2) |
| 2. Vì sao | Nêu được lý do máy đưa (đúng vai/gán cho họ + sẵn sàng làm) — chấp nhận diễn đạt tự do, ví dụ "việc này là của tôi và làm được ngay" |
| 3. Bước đầu tiên | Nêu đúng hướng hành động đầu (mở việc đó / bắt đầu làm) — chấp nhận "bấm vào nó để xem" |

Sai phổ biến cần ghi (không tính đúng): chỉ "hồ sơ ACME" mà không chỉ việc; chọn việc bị chặn; không nêu được vì sao.

### 2.2 Phiên F — định nghĩa

Dùng bảng chấm ở `forms.md` §5. Chỉ Q1/Q2 trả lời **Sai** đếm vào ngưỡng cứng #4. Q3–Q5 sai không phá ngưỡng nhưng phải liệt kê trong báo cáo (dữ liệu cho glossary D-3).

## 3. Quyết định giả thuyết H-A…H-E (test-plan §1)

| Giả thuyết | Được hỗ trợ khi | Bị bác bỏ khi | Cả hai |
|---|---|---|---|
| **H-A** — nhận ra việc tiếp theo + vì sao ≤10s | Ngưỡng #2 đạt (≥4/5) trên các participant chạy T1 | <4/5 đạt, HOẶC ≥2 người chọn việc bị chặn/đang chờ | Số liệu #2 + nhận xét tự do |
| **H-B** — phân biệt Action/Requirement + hoàn tất ≠ xác minh sau ≤2 màn giải thích | 0 hiểu sai ngưỡng cứng (Q1/Q2) **và** người sai ban đầu khi làm nhiệm vụ tự sửa sau ≤2 lần tiếp xúc với nội dung giải thích trên màn hình | Bất kỳ 1 case hiểu sai nào giữ nguyên đến cuối phiên | Sổ hiểu sai (mỗi case: xảy ra ở đâu, có tự sửa không, sau mấy lần) |
| **H-C** — đường từ blocker về điều kiện tiên quyết không lạc | ≥80% participant chạy T2 đi tới đúng điều kiện tiên quyết còn thiếu không cần ≥C2 | Đa số đi vào vòng lặp/quay ra list và bỏ | Đường đi ghi ở phiếu T2 |
| **H-D** — reviewer hiểu version/criterion trước khi bấm | ≥80% reviewer tự nêu đủ 4 yếu tố (version/criterion/submitter/tư cách) trước khi quyết | Bấm quyết mà không tra version hoặc không biết đang xét criterion nào | Phiếu T4 |
| **H-E** — khôi phục sau OUTCOME_UNKNOWN không trùng thao tác | Participant tự thử lại cùng intent (hoặc dùng kênh phục hồi) và xác nhận không trùng, không tái lập OUTCOME_UNKNOWN làm 2 lần | Tạo thao tác mới khác key / bỏ cuộc / tin rằng việc đã mất | Phiếu T10 + assertion kỹ thuật §8 dataset |

Lưu ý: đây là kết luận **hướng cải thiện**, không phải acceptance — xem §5.

## 4. Template báo cáo kết quả (điền sau đợt trial)

```
# Báo cáo usability trial — MatterControl (đợt 2026-11)

1. Tóm tắt điều hành
   - Số participant: __ (in-house __ / firm __ / manager __ / reviewer __); phiên chạy: A×__, B×__, ...
   - Kết luận 5 dòng: giả thuyết nào hỗ trợ/bác bỏ; ngưỡng nào đạt/không; 3 việc cần sửa nổi bật nhất.

2. Điều kiện chạy (hiệu lực số liệu)
   - Build/commit chạy trial: ____________ · locale: vi (đã đóng UX-L-01/02? ☐) · dataset: checklist version ____
   - Sự cố kỹ thuật/số phiên INVALID_DATASET: ____

3. Bảng ngưỡng (kết quả so với §1)
   | Ngưỡng | Kết quả | Đạt? |
   | 1 hoàn thành ≥80%/phiên | A: __% B: __% C: __% D: __% E: __% | |
   | 2 T1 ≥4/5 trong 10s | __/5 | |
   | 3 SEQ trung vị ≥5 | A: __ B: __ C: __ D: __ E: __ | |
   | 4 hiểu sai = 0 | hoàn tất=đã xác minh: __ · biên nhận=chấp thuận: __ | |
   | 5 SUS ≥70 | trung vị __ · khoảng __–__ | |

4. Kết luận giả thuyết H-A…H-E (bảng §3, cột kết quả + bằng chứng trích dẫn)

5. Findings định tính (xếp theo tần suất × mức độ, mỗi finding: mô tả, phiếu/trích dẫn, đề xuất sửa)
   F-01 ____ (tần suất __/__) — đề xuất: ____
   ...

6. Bảng dead-end + "Thử lại" vô ích (đích: improvement-plan Tier A/B — bổ sung mục tiêu sửa)

7. Sổ hiểu sai (ngưỡng cứng): từng case một dòng — participant, vị trí, phát biểu nguyên văn, có tự sửa không

8. Điều quan sát được nhưng KHÔNG kết luận (ví dụ mobile 390 chỉ 1 phiên; SUS nhóm nhỏ; quota người chưa đủ)

9. Việc kế tiếp: cập nhật improvement-plan (Tier A/B) + proposta trial vòng 2; KHÔNG tự coi là acceptance —
   kết quả đi qua review độc lập theo quy trình dự án trước khi dùng làm căn cứ phê duyệt.

Phụ lục: bộ phiếu đã điền (ẩn danh P#), danh sách file ghi hình, ngày xoá theo phiếu đồng ý.
```

## 5. Rào chắn suy diễn (bắt buộc ghi vào đầu báo cáo)

1. **Trial này không phải acceptance, không phải release gate.** Kết quả chỉ là đầu vào nghiên cứu người dùng (persona-plan Phase 1) cho improvement-plan.
2. N = 5–8: số liệu là **hướng chỉ dẫn**, không phải ước lượng thị trường; không ngoại suy ra "x% người dùng".
3. Không phát minh số: mọi con số trong báo cáo phải truy được về phiếu (forms) và file ghi hình.
4. Bộ dữ liệu synthetic: kết quả đo **dễ đọc/khó đọc của flow**, không đo tính đầy đủ nghiệp vụ pháp lý.
5. Người viết báo cáo không tự phê duyệt các đề xuất sửa — đề xuất đi qua quy trình task/reviewer thông thường (AGENTS.md).
6. Điều kiện mở trial (UX-L-01/02 + đường có dữ liệu) chưa đóng → **không chạy trial, không có số** — tránh "chạy cho có".
