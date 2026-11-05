# Compliance improvements — gate 01.A focus, r1 (2026-11-03)

- **Nguồn**: `docs/testing/vn-law-compliance-scan-20261102-r1/report.md` (SCAN_RETURNED_IN_REVIEW; AI-generated, không phải tư vấn pháp lý — verify văn bản + tham vấn luật sư trước khi quyết)
- **Skill**: `brainstorming` — đang ở **UNDERSTANDING_LOCK_PENDING_PO** (2 lần hỏi không nhận được trả lời; default đã áp dụng theo quy ước PO). Chưa sang approaches, chưa design.
- **Spot-check 3/3 khớp**: 0 route chính sách trong `src/app` · export chỉ Matter (`data_handlers.go:198-223`) · `purge_after` nullable TB-06 (`0001_mattercontrol_core.sql:176`).

## Ý tưởng đã trình (grounded theo báo cáo)

**Code**: A1 trang chính sách BVDLCN + điều khoản (footer, vi/EN, inventory từ 🟢 report) · A2 DSAR export tài khoản + xóa self-service + kênh SLA 2/10/15/20 ngày · A3 consent ledger append-only (**blocked bởi B1**) · A4 log retention ≥12 tháng (TB-06).
**Docs**: B1 memo pháp lý nền tảng (controller/processor Q4, pháp nhân VN Q2, self-registration Q3, Supabase region Q1) — mở khóa A3+01.D+03.A · B2 hồ sơ DLXB prep pack (Mẫu 09, 60 ngày) · B3 runbook sự cố ANM + breach 72h.
**Meta**: C1 4 gate 🔴 thành go-live checklist trong release runbook.

## Trạng thái áp dụng default

- **Mục tiêu design**: gói **A1+A2 = đóng gate 01.A** (default khi PO im lặng).
- **NFR assumptions**: DSAR deletion async state-machine (không hard-delete tức thì); SLA tính ngày làm việc VN configurable; DSAR requests nhỏ → DB state machine, không queue infra; policy content versioned (số version dùng cho A3 sau).
- **Decision points**: D-17 deletion khi caller là OWNER → yêu cầu transfer/xóa trước, không cascade âm thầm (default) · D-18 kênh DSAR in-app primary, email fallback (default) · D-19 policy text merge chỉ sau PO/counsel duyệt (default).
- **Open question**: ZITADEL user-deletion API capability — verify khi implement; fallback soft-deactivate v1.

## Việc tiếp khi PO xác nhận Lock

1. Approaches 2–3 phương án (khuyến nghị dẫn đầu) → 2. Design sections incremental → 3. Decision log + design doc tại `docs/implementation/plans/` → 4. Handoff qua Codex intake (pattern `MC-CODEX-PREFLIGHT-INTAKE-20261103-PROMPT.md`).
