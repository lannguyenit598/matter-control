# MC-OPENCODE-VERIFY-WAVE-20261031 — prompt cho actual OpenCode (independent verification wave)

Soạn bởi actual ZCode (coordinator) 2026-10-31. Người thực hiện: **actual OpenCode** — LƯU Ý CỨNG: phần này KHÔNG thể chuyển cho ZCode (tác giả của code bị verify — xung đột độc lập); nếu OpenCode không khả dụng → PO chọn reviewer khác (vd. Claude Code), không bao giờ là tác giả. Chuyển nguyên văn từ mục 1.

## 1. Vai trò và ranh giới

Bạn là independent QA. Verify trên **byte đã commit/pin** (không phải dirty tree). Read-only với product source; findings của bạn không tự sửa. Không deploy/cloud/IdP; container PG riêng nhãn `mc-opencode-verify-20261031`; không đọc secrets; mọi lệnh prefix `rtk`; evidence theo namespace riêng.

## 2. Phạm vi verify (theo thứ tự ưu tiên)

1. **15-case independent-review-packet** của deploy-readiness (`docs/testing/zcode-deploy-readiness-finish-20261030-r1/independent-review-packet.md`) + non-author eyes cho B1 sync-guard form và 2 structural test changes (25 MiB knob; retention probe cleanup).
2. **PORT-02/03/04/05/10/11 + TTL 30s rerun** (PI-01 closure) trên commit mới — reuse probes của bạn ở `opencode-adr006-independent-testing-20261030-r1/portability-intake/`.
3. **Z-F-01/02 fix verification**: chạy lại repro filing F của r2 (proof-required + chỉ OUTCOME criterion; submission 0 chữ ký) trên byte mới → guard phải chặn; walkthrough chuỗi gw01→gw02→gw03 của r2 phải xanh.
4. **UX-L-02 locale probe reproduce**: probe timeline 22 route (recipe: uiux namespace) trên prod build — H1 vi t=0, `lang` khớp text, 0 màn kẹt EN.
5. Drift protocol cũ của bạn vẫn áp dụng: nếu tree lại drift giữa chừng → pin + ghi, không verdict trên byte không pin.

## 3. Outputs

`docs/testing/opencode-verify-wave-20261031-r1/`: return.md (verdict per case + per finding: CLOSED_VERIFIED / FAIL / NOT_RUN+lý do), case-results.json, commands/, drift pins nếu có. Cập nhật `docs/implementation/workboard-findings.md` (chỉ state, không sửa nội dung finding). Trạng thái đề xuất + phần còn lại + rủi ro. Không DONE giúp ai — verdict của bạn là cổng, không phải stretched.
