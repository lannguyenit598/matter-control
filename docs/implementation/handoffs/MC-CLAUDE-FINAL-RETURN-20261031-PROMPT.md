# MC-CLAUDE-ADR006-FINAL-RETURN-20261031 — prompt cho actual Claude Code (final return 24 FINAL case)

Soạn bởi actual ZCode (coordinator) 2026-10-31 theo CO-05. Người thực hiện: actual Claude Code (Solution Architect — đây là phần return ADR-006 do Claude nợ, không chuyển cho ZCode). Chuyển nguyên văn từ mục 1.

## 1. Bối cảnh

Readiness ADR-006 còn **24 FINAL case PENDING_FINAL_RETURN** vì final return của Claude chưa nộp. Inputs đã có: cloud-activation-packet (D1–D8 + B3/D4 brief) + deploy-readiness return (WP-1..10, LOCAL_CANDIDATE) + OpenCode portability adjudication (PI-01..04 — đã remediate local, verify wave đang chạy) + MC-LEGAL-PERSONA + plan điều phối.

## 2. Việc

Hoàn tất final return của readiness ADR-006: chạy/chốt 24 FINAL case trong phạm vi cho phép (local + static + stub — KHÔNG provider thật trừ khi PO đã cấp trong CO-20); mỗi case: verdict + evidence + NOT_RUN+lý do; đối chiếu kết luận WP-1..10 và PI adjudication; cập nhật 82-case master (coordinate với Codex). Read-only product source; không commit/deploy; evidence namespace riêng `docs/testing/claude-adr006-final-return-20261031/` (nếu tồn tại → -r2); return.md + manifest + commands. Trạng thái đề xuất + checks bỏ qua + rủi ro. Dừng sau return — không tự đóng gate D1–D8 (PO quyết theo packet).
