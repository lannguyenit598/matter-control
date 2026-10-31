# Incident: CSS 500 trên runtime :3000 (gây ra bởi build audit MC-UIUX-LAWYER-EXPERIENCE-AUDIT-AND-PLAN-20261030)

- Báo cáo: actual ZCode, 2026-10-30T18:05Z (local 2026-10-31 01:05+07; erratum 2026-10-31: bản đầu ghi nhầm "~01:10Z" do trộn múi giờ). Người nhận: **Local Codex** (owner runtime :3000). PO đã chọn phương án bàn giao (không cho ZCode tự restart).
- **RESOLVED 2026-10-31 (erratum 2 — không cần repair):** sau khi mọi writer tranh chấp dừng (build/dev của audit kết thúc ~17:45Z), process gốc :3000 **PID 171 (chưa từng restart)** tự tái tạo chunk dev theo yêu cầu — verify `200 text/css`, 65,913 byte tại URL `/​_next/static/chunks/02j5xcjb5sr-y.css`. `repair.sh` KHÔNG được chạy, giữ lại chỉ làm lịch sử. Bài học phòng ngừa vẫn nguyên: 500 window là thật khi `.next` bị nhiều writer ghi đồng thời; không build/server thứ hai vào `.next` của server đang sống (distDir riêng hoặc điều phối).
- Trạng thái: ĐÃ CHẨN ĐOÁN ĐỦ, CHƯA SỬA. Không có source bị đổi.

## 1. Triệu chứng
Mọi trang trên `http://127.0.0.1:3000` trả HTML 200 nhưng không style: `<link rel="stylesheet" href="/_next/static/chunks/02j5xcjb5sr-y.css" data-precedence="next">` → **HTTP 500 "Internal Server Error"** (text/plain, 21 byte).

## 2. Timeline & root cause
1. `next-server (v16.4.2)` PID **171** start **2026-10-30 15:46:25 +07** (dưới launchd), serve :3000 — dùng `apps/frontend/.next` như mọi dev server của repo này.
2. Trong audit MC-UIUX-LAWYER-EXPERIENCE-AUDIT-AND-PLAN-20261030, ZCode chạy `next build --webpack` trong **cùng thư mục** → `.next` bị ghi đè bằng production build; `BUILD_ID` mtime **2026-10-30 17:33:16 +07** (khớp khung build 17:20–17:33Z).
3. Chunk CSS dev `02j5xcjb5sr-y.css` mà :3000 đang tham chiếu **không còn trên đĩa** (`find .next/static/chunks -name '02j5xcjb5sr-y.css'` = rỗng; 0 file .css trong `.next/static/chunks`).
4. Trước đó, các lần `next dev`isolated (:3100) của audit cũng dùng chung `.next` — yếu tố góp phần; đòn quyết định là build prod. Trách nhiệm: ZCode (audit phải dùng distDir riêng hoặc điều phối).
5. Source KHÔNG đổi: `apps/frontend/src/app/globals.css` sha256 `c095ebb9f48a841bfbc1a78ce19b52840a499a36f401e78f7cf6bb4ed357ca37` — khớp pin trước sự cố.

## 3. Cách sửa (cho Codex chạy, theo đúng lệnh/env gốc của runtime)
1. Xác nhận process: `ps -p 171 -o pid,lstart,command` → `next-server (v16.4.2)`.
2. Stop đúng tiến trình :3000 (Codex giữ quyền; không chạy lệnh này hộ process khác): `kill 171`.
3. Xóa build state: `rm -rf apps/frontend/.next` (chỉ artifact, không phải source).
4. **Khởi động lại bằng chính lệnh Codex đã dùng** (ZCode không biết env/flags gốc — title đã bị Next đổi; khả năng cao là `pnpm dev` trong `apps/frontend`, REST mode từ `.env.local`).
5. Verify:
   - `curl -s -o /dev/null -w '%{http_code} %{content_type}\n' http://127.0.0.1:3000/<css-href-lấy-từ-HTML>` → 200 text/css
   - `curl -s http://127.0.0.1:3000/my-actions | grep -o 'stylesheet' | head -1` + mở trang trong browser thấy có style.
6. Script mẫu: `repair.sh` trong thư mục này (có confirmprompt, KHÔNG chạy mù).

## 4. Phòng tái phát (đề xuất cho orchestration)
- Quy ước: mọi `next build`/dev server phụ phải dùng **distDir riêng** (vd `NEXT_DIST_DIR=.next-audit`) hoặc được điều phối qua owner; hai dev server không cùng `.next`.
- Đã lưu vào memory dự án của ZCode.
