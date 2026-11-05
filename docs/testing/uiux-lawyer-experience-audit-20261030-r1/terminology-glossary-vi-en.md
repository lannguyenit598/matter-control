# Terminology glossary vi/en (đề xuất) — các khái niệm lõi

Trạng thái: ĐỀ XUẤT cho PO/design quyết — chưa phải chuẩn sản phẩm. Căn cứ: nhãn đang dùng trong source (863 LocalizedText + 13 bảng pair), docs pháp lý (state-semantics, permission-matrix), và thực hành pháp lý Việt. Nguyên tắc: nhất quán 1 từ/khái niệm; tránh thuật ngữ kỹ thuật; không dịch "Requirement" thành "Điều kiện".

| EN (canonical) | Đang dùng trong app | Đánh giá | Đề xuất vi | Ghi chú |
|---|---|---|---|---|
| Matter | Hồ sơ | ⚠️ mơ hồ: trùng "hồ sơ" (dossier), trùng Documents context | **Hồ sơ** (giữ) hoặc **Vụ việc** | "Hồ sơ vụ việc" rõ nhất nhưng dài; nếu giữ "Hồ sơ" thì Document phải là "Tài liệu" (đang đúng) và tab title phải phân biệt với Workspace |
| Workspace | Không gian làm việc | ✅ ổn, dài | Không gian làm việc (giữ) | tab title có thể rút "Workspace" |
| My Work | Việc của tôi | ✅ tốt | Việc của tôi | |
| Reviews due | Cần xác minh | ✅ tốt (hàm vai trò verifier) | Cần xác minh | |
| Action | (KindBadge; "Mở tác vụ") | ⚠️ lệch: "tác vụ" là task-like; Action = hành động pháp lý | **Hành động** | my-actions-view dùng "Việc của tôi" + "Mở tác vụ" trong cùng màn — cần thống nhất: Action=Hành động, work item=Công việc |
| Requirement | (KindBadge) | cần kiểm nhãn hiện tại | **Yêu cầu** | distinct từ Action là acceptance criterion BA §9.3 |
| Work item | Công việc / tác vụ | ⚠️ lẫn lộn | Công việc | |
| Evidence / proof | Bằng chứng / chứng minh | cần kiểm | **Bằng chứng** | "proof" trong bản dịch giữ "bằng chứng" |
| Verification | Xác minh | ✅ | Xác minh | "verify"=xác minh; "review"=soát/xét — tách rõ |
| Disputed | (trạng thái) | cần kiểm | **Bị tranh chấp** | |
| Filing | (filings) | ⚠️ "nộp hồ sơ" đụng Matter=Hồ sơ | **Hồ sơ khai** / "Khai" (ngắn) hoặc "Tờ trình" | PO quyết; tránh "đơn" (quá hẹp) |
| Receipt | (filing stage) | cần kiểm | **Biên nhận** | receipt ≠ approval bắt buộc phân biệt |
| Authority | (party) | cần kiểm | **Cơ quan** | |
| Approval | (outcome) | cần kiểm | **Phê duyệt/Chấp thuận** | của cơ quan = "chấp thuận" đề xuất |
| Waiting on | Đang chờ / "đang chờ" | ✅ + tên bên | Đang chờ: <tên> | theo GW: named party |
| Blocked | Bị chặn | ✅ | Bị chặn | kèm nguyên nhân, không để badge đỏ trần |
| Ready | Sẵn sàng | ✅ | Sẵn sàng | |
| Due soon / Overdue | Hạn / (timing) | cần kiểm | Sắp đến hạn / Quá hạn | |
| Submit | (forms) | cần kiểm | **Nộp/Gửi** | evidence submit = "Nộp bằng chứng" |
| Promote version | "Make version … current" | EN-only hiện tại | **Chọn làm phiên bản hiện hành** | |
| Sign in / Sign out | Đăng nhập | ✅ | Đăng nhập / Đăng xuất | |
| Owner/Editor/Viewer | (role badge EN) | ⚠️ badge hiển thị mã | **Chủ hồ sơ / Người chỉnh sửa / Người xem** | callerRole badge đang hiện 'OWNER' raw (source matter page: Badge variant primary {matter.callerRole}) — phải map nhãn |
| As-of | "Read at/Đọc lúc" | ⚠️ | **Dữ liệu tại** / "Đọc lúc" (giữ) | |
| Status brief | Tạo báo cáo tình hình | ✅ | Báo cáo tình hình | |
| Verification vs Completion | — | — | Hoàn tất ≠ Đã xác minh | cặp từ bắt buộc xuất hiện cùng nhau khi COMPLETED+UNVERIFIED |

Quyết định PO cần (liên kết improvement-plan D-3):
1. Matter = "Hồ sơ" hay "Vụ việc" (ảnh hưởng mọi nhãn, breadcrumb, tab title).
2. Filing = ? (đề xuất "Hồ sơ khai").
3. Action = "Hành động", work item = "Công việc", bỏ "tác vụ".
4. Role badges hiển thị nhãn vi thay mã OWNER/EDITOR/VIEWER.
5. Bảng này thành nguồn chân lý duy nhất (thay 13 pair-table cục bộ dần dần).
