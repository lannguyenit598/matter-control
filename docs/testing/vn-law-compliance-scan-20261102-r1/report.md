# Rà soát pháp lý VN: MatterControl (mức 3 — SaaS/nền tảng)

**Ngày audit:** 2026-11-02
**Phương pháp:** skill `vn-law-check` (triage → checklist 01–08 → Mẫu B), theo `docs/implementation/handoffs/MC-ZCODE-VNLAW-COMPLIANCE-SCAN-20261102-PROMPT.md`. Read-only; không sửa code/tài liệu nào.
**Trạng thái sản phẩm tại thời điểm audit:** LOCAL_CANDIDATE, chưa deploy production, chưa có người dùng thật/dữ liệu thật → nghĩa vụ pháp lý phát sinh **khi bắt đầu xử lý dữ liệu cá nhân thật**; các mục 🔴 dưới đây là *điều kiện cần trước go-live*, không phải xác định vi phạm đang xảy ra.

## Kết quả quét (triage)

Script gợi ý mức 2 (bán hàng) — **đã re-verify bằng tay và kết luận lại: mức 3**. Toàn bộ hit COMMERCE/PERMISSIONS/SDK_TRACKING là false positive trong build/dev artifacts (`storybook-static/`, `pnpm-lock.yaml` tên dependency, `.agents/skills/` dữ liệu icon), không phải hành vi app. Tín hiệu thật:

| Tín hiệu | Trạng thái | Bằng chứng |
|---|---|---|
| FORM (form thu thập dữ liệu) | CÓ | Form sản phẩm thật (filing, review grid, intake, saved views) trong `apps/frontend/src/features/**`; hit script chỉ thấy Storybook runtime |
| AUTH (tài khoản người dùng) | CÓ | ZITADEL OIDC + BFF session; bảng `users` (`0001_mattercontrol_core.sql:9`), routes `/me/*` (`productapi/server.go:140-142`) |
| COMMERCE / thanh toán | KHÔNG | Không stripe/vnpay/momo/checkout trong app; hit duy nhất = pnpm-lock + demo repo |
| TRACKING/analytics bên thứ 3 | KHÔNG | Chỉ comment placeholder Sentry chưa wired (`app/global-error.tsx:18`, `app/(app)/error.tsx:13`) |
| AI / chatbot | KHÔNG | 0 hit OpenAI/Anthropic/ai-sdk trong `apps/**`; LegalMemory/AI là phase sau (quyết định PO 2026-10-29) |
| HOST nước ngoài | CÓ | Cloud Run `asia-southeast1` = Singapore (`ops/deploy/cloud-run.values.example.json:15`), Cloudflare Workers (`apps/frontend/wrangler.jsonc`), Cloudflare R2 (`internal/adapter/outbound/objectstore/r2.go`), Supabase PostgreSQL |
| Mobile app | KHÔNG | Không Flutter/RN/Expo/Android/iOS |

**Mức 3** (SaaS có tài khoản, xử lý dữ liệu pháp lý — bao gồm dữ liệu cá nhân của bên thứ ba trong hồ sơ Matter) → áp dụng checklist 01–08.

## Tổng quan

| Lĩnh vực | 🔴 | 🟡 | 🟢 |
|---|---|---|---|
| 01 Bảo vệ dữ liệu cá nhân | 3 | 3 | 3 |
| 03 An ninh mạng | 1 | 2 | 1 |
| 06 Giao dịch điện tử | 0 | 1 | 0 |
| 07 Minh bạch AI | 0 | 0 | 1 (chưa áp dụng — không có AI) |

**Không áp dụng:** 02 TMĐT (không bán hàng/nền tảng TMĐT — false positive đã loại), 04 Bảo vệ người tiêu dùng (B2B cho luật sư/doanh nghiệp; nếu sau này mở self-serve cho cá nhân phải xem lại Điều 23/28 về hợp đồng theo mẫu), 05 Quảng cáo (không có quảng cáo/affiliate), 09 Mobile (không có app).

## 🔴 Cần xử lý ngay (go-live gates)

1. **01.A — Không có chính sách BVDLCN công khai + kênh thực hiện quyền chủ thể dữ liệu.** Không tồn tại route/page chính sách hay điều khoản nào trong `apps/frontend/src/app/**` (find = rỗng; hit "chính sách" duy nhất trong FE là ngữ nghĩa domain ở `create-grid-dialog.tsx`). Chưa có self-service xóa tài khoản; export mới chỉ theo Matter (`productapi/data_handlers.go:198-223`), chưa phải cung cấp dữ liệu theo yêu cầu chủ thể. Căn cứ: Điều 4, 9 Luật 91/2025/QH15 (hiệu lực 01/01/2026), NĐ 356/2025/NĐ-CP (SLA phản hồi 2 ngày làm việc / xem-sửa 10 / rút đồng ý 15 / xóa 20 ngày). Đề xuất: trang chính sách ở footer (loại dữ liệu, mục đích, thời hạn lưu, bên thứ ba: ZITADEL/Supabase/Cloudflare/GCP), kênh yêu cầu + SLA, mở rộng export & thêm xóa tài khoản.
2. **01.B — Không có cơ chế ghi nhận sự đồng ý khi thu thập/xử lý.** Không có consent record tại tạo tài khoản hay khi nạp dữ liệu Matter; không lưu thời điểm/nội dung đồng ý (kiểm chứng được theo Điều 9 Luật 91/2025; im lặng ≠ đồng ý). Lưu ý: với mô hình B2B (luật sư tự nạp hồ sơ khách) có thể dùng cơ sở xử lý khác — vai trò controller/processor của nền tảng **CHƯA XÁC MINH, cần phân tích pháp lý**; riêng dữ liệu tài khoản (display_name, IdP identity — `0001:9-14`) cần cơ sở rõ ràng.
3. **01.D — Toàn bộ hạ tầng offshore → hồ sơ chuyển dữ liệu xuyên biên giới.** Cloud Run `asia-southeast1` (Singapore), Cloudflare Workers + R2, Supabase PG (region cần xác nhận — câu hỏi mở). Căn cứ: Điều 20 Luật 91/2025 — lập + gửi hồ sơ đánh giá tác động chuyển DLXB trong **60 ngày** từ lần chuyển đầu tiên, văn bản ràng buộc với bên nhận nước ngoài, Mẫu 09 (Điều 18 NĐ 356/2025). Sản phẩm xử lý dữ liệu nhạy cảm (hồ sơ pháp lý chứa dữ liệu cá nhân bên thứ ba) → **không thuộc diện miễn Điều 39**.
4. **03.B — Thời hạn lưu nhật ký hệ thống chưa chốt theo NĐ 333/2026.** Yêu cầu lưu log tối thiểu **12 tháng** (Điều 16, 20 NĐ 333/2026/NĐ-CP, hiệu lực 19/08/2026). Bằng chứng: `security_audit_events` có `client_ip INET`, `request_id` (`0001_mattercontrol_core.sql:206-216`) nhưng `purge_after` nullable với comment "no retention policy value is approved (TB-06 open)" (`0001:176-177`). Đề xuất: chốt retention ≥12 tháng cho log hệ thống khi quyết TB-06.

## 🟡 Nên cải thiện

5. **01.A — Phân loại dữ liệu nhạy cảm:** tài liệu/by-product trong Matter có thể chứa dữ liệu cá nhân bên thứ ba (bên ký, người đại diện…). NĐ 356/2025 mở rộng danh mục nhạy cảm (theo dõi hành vi trực tuyến, thông tin tài khoản, mật khẩu định danh — số điều CHƯA XÁC MINH). Schema hiện chỉ có `contact`/`display_name` (`0001:12-13`) — cần phân loại trong chính sách, không nhất thiết đổi schema.
6. **01.E — Nghĩa vụ tổ chức nội bộ:** DPIA gửi trong 60 ngày (Điều 21 Luật 91/2025), quy trình thông báo vi phạm/rò rỉ **72 giờ** + Mẫu 08 (Điều 23 khoản 1; Điều 27 NĐ 356/2025 — số điều CHƯA XÁC MINH), chỉ định nhân sự bảo vệ dữ liệu (Điều 33 Luật 91/2025; Điều 13 NĐ 356/2025). Không thấy bằng chứng trong repo; xử lý dữ liệu nhạy cảm → không miễn.
7. **03.C — Quy trình ứng phó sự cố ANM:** có runbook deploy/restore (WP-8, rehearsal) nhưng chưa thấy quy trình sự cố bảo mật/báo cáo cơ quan chuyên trách (Điều 40 khoản 1 điểm c, Điều 41 khoản 3 Luật 116/2025/QH15, hiệu lực 01/07/2026).
8. **03.A — Phân tích nghĩa vụ lưu trữ dữ liệu tại VN:** Điều 25 khoản 3 Luật 116/2025 + Điều 19–20 NĐ 333/2026 — hiện toàn bộ storage offshore; nghĩa vụ phụ thuộc tư cách doanh nghiệp (VN/nước ngoài, có chi nhánh VN hay không) và loại dịch vụ → **CHƯA XÁC MINH**, cần phân tích và lưu hồ sơ kết luận.
9. **06.D — Retention tài liệu theo pháp luật chuyên ngành:** Điều 13 Luật GDTD 20/2023 — hồ sơ điện tử lưu đủ giá trị chứng cứ; `purge_after` đang mở (TB-06): khi chốt retention phải đối chiếu nghĩa vụ lưu trữ chuyên ngành của tài liệu pháp lý, không xóa theo TTL kỹ thuật thuần túy.
10. **Registration policy (ZITADEL):** app chấp nhận mọi tài khoản ZITADEL hợp lệ; self-registration là policy cấp instance **chưa xác minh** (pending R12/D-10). Nếu mở đăng ký tự do → luồng account data phải nằm trong chính sách + consent (mục 1, 2).

## 🟢 Đạt yêu cầu

- **Không tracking/quảng cáo bên thứ ba** → bề mặt dữ liệu hành vi tối thiểu; cookie/storage chỉ chức năng, first-party: cookie `ui-locale` 1 năm `samesite=lax` (`apps/frontend/src/hooks/use-locale.ts:60`), theme/locale localStorage (`lib/theme.ts:7,13`). Vẫn cần liệt kê trong chính sách khi viết.
- **Kiểm soát truy cập tốt so với mặt bằng chung:** IdP chuyên biệt (ZITADEL), session server-side opaque, least-privilege DB grants (đã verify B1 55/55), authz membership theo Workspace/Matter, CAS + `domain_events` append-only.
- **07 AI — chưa phát sinh:** không có chatbot/nội dung AI. Khi triển khai phase LegalMemory/AI (luôn có nhãn "nội dung do AI tạo", Điều 11 Luật 134/2025/QH15 hiệu lực 01/03/2026 + NĐ 142/2026 Điều 18 về gắn nhãn; dữ liệu người dùng gửi sang AI ở nước ngoài → quay lại 01.B/01.D).

## Mức phạt tham khảo (chỉ cho mục 🔴)

Điều 8 Luật 91/2025: chuyển dữ liệu xuyên biên giới sai phạm tới **5% doanh thu** năm liền trước; hành vi khác (tổ chức) tới **3 tỷ đồng**. Xử phạt hành chính lĩnh vực ANM + BVDLCN theo NĐ 330/2026/NĐ-CP (hiệu lực 19/08/2026) — mức từng hành vi: CHƯA XÁC MINH.

## Câu hỏi mở (không suy đoán được từ repo)

1. Region chính xác của Supabase project (đang dùng pooler Supavisor — hosted).
2. Tư cách pháp nhân đơn vị vận hành tại VN (quyết định 03.A/01.D/Điều 39).
3. ZITADEL instance: self-registration bật/tắt; nội dung màn hình consent của IdP.
4. Vai trò controller/processor đối với dữ liệu cá nhân bên thứ ba trong Matter.

## Giới hạn & khuyến nghị

> Báo cáo này do AI tạo dựa trên bộ checklist tổng hợp từ văn bản pháp luật công khai (skill `vn-law-check`), **không phải ý kiến tư vấn pháp lý chính thức**. Khung pháp lý VN về dữ liệu cá nhân, TMĐT, ANM, AI vừa thay đổi lớn 2025–2026 (Luật 91/2025 hiệu lực 01/01/2026, Luật 116/2025 hiệu lực 01/07/2026, Luật 134/2025 hiệu lực 01/03/2026, NĐ 356/2025 thay thế NĐ 13/2023, NĐ 333/2026 & NĐ 330/2026 hiệu lực 19/08/2026). Trước khi quyết định, xác minh từng văn bản tại thuvienphapluat.vn / vbpl.vn và tham vấn luật sư.

**Trạng thái:** `SCAN_RETURNED_IN_REVIEW` — 4 câu hỏi mở, 0 fix thực hiện (read-only).
