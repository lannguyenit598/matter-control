# Terminology Final — D-3 chốt bởi UX Owner (OpenDesign)

- Reviewer: actual OpenDesign (UI/UX owner), 2026-11-01
- Căn cứ: terminology-glossary-vi-en.md (ZCode đề xuất), audit-findings.md, source LocalizedText pairs, BA §9 (human labels)
- Trạng thái: **UX OWNER RATIFIED** — chờ PO duyệt R10 (workboard batch #2) để trở thành chuẩn sản phẩm

---

## 1. Bảng thuật ngữ chốt

| EN (canonical) | VI chốt | Dùng khi | Ghi chú |
|---|---|---|---|
| Matter | **Hồ sơ** | Heading, breadcrumb, nav, tab title | Giữ nguyên. "Vụ việc" gợi hình sự; "Hồ sơ" đủ rộng cho transaction/corporate. Điều kiện: Workspace ≠ "Hồ sơ" (P-01 đã sửa) |
| Workspace | **Không gian làm việc** | Nav, heading | Giữ nguyên |
| My Work | **Việc của tôi** | Nav, heading | Giữ nguyên |
| Reviews due | **Cần xác minh** | Nav, heading | Giữ nguyên |
| Action | **Hành động** | KindBadge, heading, breadcrumb | ~~tác vụ~~ → "Hành động". "Tác vụ" = task-like, lệch ngữ nghĩa pháp lý |
| Requirement | **Yêu cầu** | KindBadge | Phân biệt rõ với Action (BA §9.3) |
| Work item | **Công việc** | Generic reference | ~~tác vụ~~ bỏ |
| Evidence / Proof | **Bằng chứng** | Proof panel, labels | Thống nhất 1 từ |
| Verification | **Xác minh** | Trạng thái, action labels | "verify" = xác minh; phân biệt "review" = soát/xét |
| Filing | **Hồ sơ khai** | Heading, breadcrumb | Badge ngắn: **"Khai"**. Loại "Đơn" (hẹp), "Tờ trình" (hành chính nội bộ) |
| Receipt | **Biên nhận** | Filing stage | receipt ≠ approval — bắt buộc phân biệt |
| Authority | **Cơ quan** | Party labels | |
| Approval | **Chấp thuận** | Outcome labels | "Chấp thuận" (của cơ quan) thay vì "Phê duyệt" (dễ nhầm với internal approval) |
| Waiting on | **Đang chờ: [tên]** | Status labels | Luôn kèm tên bên |
| Blocked | **Bị chặn** | Status labels | Kèm nguyên nhân, không badge đỏ trần |
| Ready | **Sẵn sàng** | Status labels | |
| Due soon | **Sắp đến hạn** | Timing labels | |
| Overdue | **Quá hạn** | Timing labels | |
| Submit | **Nộp** | Form buttons | Evidence submit = "Nộp bằng chứng" |
| Promote version | **Chọn làm phiên bản hiện hành** | Document actions | ~~"Make version … current"~~ → vi |
| Disputed | **Bị tranh chấp** | Status labels | |
| Sign in / Sign out | **Đăng nhập / Đăng xuất** | Auth | Giữ nguyên |
| Owner | **Chủ hồ sơ** | Role badge | ~~OWNER~~ raw → nhãn vi |
| Editor | **Người chỉnh sửa** | Role badge | ~~EDITOR~~ raw → nhãn vi |
| Viewer | **Người xem** | Role badge | ~~VIEWER~~ raw → nhãn vi |
| As-of | **Dữ liệu tại** | Provenance timestamps | "Đọc lúc" cũng chấp nhận — chọn "Dữ liệu tại" rõ hơn |
| Status Brief | **Báo cáo tình hình** | Report labels | |
| Completion vs Verification | **Hoàn tất ≠ Đã xác minh** | Cặp trạng thái | Bắt buộc xuất hiện cùng nhau khi COMPLETED+UNVERIFIED |

---

## 2. Amendments so với glossary đề xuất gốc (ZCode)

1. **Approval: "Chấp thuận" thay vì "Phê duyệt"** — "Phê duyệt" dễ nhầm với internal approval flow (PO duyệt, IC duyệt); "Chấp thuận" gắn rõ hơn với cơ quan/authority bên ngoài. Trong ngữ cảnh internal approval (IC, LPAC) dùng "Phê duyệt" — 2 từ phân biệt 2 scope.

2. **As-of: "Dữ liệu tại" thay vì "Đọc lúc"** — "Đọc lúc" gợi hành động đọc của user; "Dữ liệu tại" gợi thời điểm dữ liệu snapshot — đúng ngữ nghĩa hơn khi provenance adjacency yêu cầu "as-of what point in time".

3. **Filing badge ngắn: "Khai" thay vì "Hồ sơ khai"** — Badge có giới hạn ký tự; "Khai" đủ phân biệt trong context badge. Heading/breadcrumb dùng đầy đủ "Hồ sơ khai".

---

## 3. Quy tắc áp dụng

1. Bảng này là **nguồn chân lý duy nhất** cho nhãn vi — thay 13 pair-table cục bộ dần dần.
2. Sweep P-05 (EN literals → LocalizedText) dùng key EN canonical (cột 1) ngay; thay nhãn vi theo bảng này sau khi PO duyệt R10.
3. Mọi nhãn mới thêm vào app phải check bảng trước khi chọn từ.
4. Badge hiển thị nhãn vi (không phải mã EN) khi `ui-locale = vi`.
