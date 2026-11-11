# PO DECISION PACKET — Hosting & DPA cho dữ liệu matter (Sửa 2, phần PO-owned)

Status: **WAITING_PO_DECISION**. Packet này KHÔNG quyết định gì — nêu options + trade-offs + recommendation để PO chốt. Nguồn ràng buộc: PRODUCT.md (Cloudflare Free Tier $0 là constraint, chưa phải bằng chứng khả thi), vn-law compliance scan 2026-11-02 (4 gate 🔴 gồm residency/offshore stack), MC-ADR006 topology (SG/CF/Supabase/ZITADEL).

## Câu hỏi PO phải trả lời (Q1–Q3)

**Q1 — Ranh giới dữ liệu nào được phép nằm ở đâu?**
Options:
- (A) Toàn bộ (matters + documents bytes) trên stack hiện tại (CF Workers/R2/SG region hoặc Supabase offshore).
- (B) Metadata trên stack, bytes tài liệu ở storage do firm/quỹ kiểm soát (on-prem/VN cloud) — kiến trúc ObjectStore đã tách adapter (fs|R2) nên khả thi về code.
- (C) Pilot nội bộ chỉ dùng dữ liệu synthetic/đã redact — không ký DPA nào, không nhận dữ liệu thật.

**Q2 — DPA nào cần ký trước khi nhận dữ liệu thật?** Với (A): DPA với provider hosting + điều khoản xử lý dữ liệu VN (NĐ 13/2023, Nghị định 53/2022 về dữ liệu tại VN nếu thuộc phạm vi). Với (B): chỉ DPA nội bộ giữa firm và khách. Với (C): không cần trước pilot.

**Q3 — Mức chi phí được duyệt?** $0 (Free Tier, residency không đảm bảo) vs Workers Paid $5/mo (no egress, Enterprise mới có residency controls) vs Supabase/VN-region VPS (chi phí thật, cần ngân sách).

## Trade-offs chính (tóm tắt, không rực rỡ)

| Option | Residency | Chi phí | Trì trệ vận hành | Rủi ro chính |
|---|---|---|---|---|
| A — all-in CF/Supabase | ❌ (Enterprise mới có) | $0–5/mo | thấp | từ chối của quỹ khi hỏi "data tôi ở đâu" |
| B — bytes do firm giữ | ✅ theo nơi firm đặt | trung bình (VPS VN) | trung bình | phải vận hành backup/DR phía firm |
| C — synthetic only | ✅ (mặc định) | $0 | thấp | không chứng minh giá trị với dữ liệu thật |

## Recommendation (không ràng buộc)

C trước → B sau: pilot 1 deal nội bộ với synthetic + redact (C) trong khi chuẩn bị B (bytes tại storage firm kiểm soát) cho dữ liệu thật; A chỉ khi PO chấp nhận rủi ro residency. Việc chọn B cần 1 ADR cập nhật ADR-006 (ObjectStore fs|R2 đã chừa chỗ).

## Điều kiện thực thi sau quyết định

1. PO chọn Q1/Q2/Q3 → ghi decision ID (D-xx) vào register.
2. Nếu B: OpenDesign/Codex cập nhật ADR-006 + runbook backup/DR; ZCode thực thi cấu hình ObjectStore.
3. Nếu A: ghi nhận rõ "residency không đảm bảo" vào mọi pitch/nguyên tắc bán hàng.
4. Nếu C: pilot tiếp tục trên walkthrough env hiện tại (đã RUNNABLE, evidence 2026-11-11).
