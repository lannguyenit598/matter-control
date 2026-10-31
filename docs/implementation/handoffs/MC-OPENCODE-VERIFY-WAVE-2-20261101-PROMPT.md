# MC-OPENCODE-VERIFY-WAVE-2-20261101 — prompt cho actual OpenCode (verify wave leg 2)

Soạn bởi actual ZCode (coordinator) 2026-11-01. Người thực hiện: **actual OpenCode** — khuyến nghị dispatch: **tiếp tục ngay trong phiên OpenCode verify đang chạy** (đã tự re-pin `4b6a65f`, 0 drift — giữ rhythm; nếu phiên đó đã đóng thì session OpenCode mới, pre-flight re-pin như cũ). Ranh giới không đổi: read-only product source; không verdict trên byte chưa pin; container nhãn riêng; không secrets; lệnh prefix `rtk`.

## 1. Việc mới kể từ leg 1 (làm trước — nhanh)

**V2-1 · Confirm OV-R13-01 (P2 → chờ verify):** chạy lại probe YAML-structure của bạn trên HEAD mới — kỳ vọng **6/6 PASS** kể cả `ops/deploy/cloud-run/migrate-job.yaml` (fix ở commit `6b0c358`, receipts `mc-enablement-minifix-20261101-r1/commands/m1-yaml-before/after.txt`). PASS → register OV-R13-01 = CLOSED_VERIFIED; FAIL → mở lại với diff mới.

**V2-2 · Verify CO-17 walkthrough env (claim DONE `ed23be3`):** chạy độc lập `ops/local/walkthrough/up.sh` → 4 mốc (readyz 200 / no-token 401 / token hợp lệ 200 / token lạ 401) → `down.sh` → **orphan check** (không còn listener/container). PASS → CO-17 = CLOSED_VERIFIED; ghi bất kỳ drift nào giữa README và thực tế.

**V2-3 · Review package usability-prep (IN_REVIEW):** `docs/testing/usability-prep-20261101-r1/` — verdict APPROVE_FOR_USE / AMEND (chỉ ra dòng cụ thể) / REJECT. Kiểm: ngưỡng metrics khớp test-plan §5 (không bị vận hành hoá làm lệch), dataset checklist đủ cho GW-01..03 + matter bẫy + receipt replay, forms không thu PII, 7 quyết định logistics có khuyến nghị + mặc định.

## 2. Tiếp tục scope leg 1 (đang dở)

- **Verdicts R1/R7/R9** (config tests / renderer tests / action refs — namespaces đã mở): chốt từng case, bind commit bytes.
- **PORT-02/03/04/05/10/11 + TTL-30s rerun** (PI-01 closure) — đã unblocked, dùng probes của bạn từ portability-intake.
- **15-case packet** — các case còn lại.
- **Z-F-01/02/03 + UX fixes (F2..F7)**: **HOLD** cho tới khi fix-wave commit các fix-unit (F1 đã có patch `mc-p1-fix-wave-20261031-r1/f1-zf01-zf02.patch` — có thể pre-review cấu trúc/red-green ngay, nhưng **verdict cuối chỉ trên commit bytes**). Khi fix-unit commit: chạy lại repro filing F của r2 + probe locale 22 route trên prod build.
- Drift protocol: tree đang có nhiều writer — mọi verdict gắn `git rev-parse HEAD` tại thời điểm chốt; byte đổi sau đó → verdict giữ nguyên nhưng ghi anchor.

## 3. Outputs

Cùng namespace `docs/testing/opencode-verify-wave-20261031-r1/` (leg 2 ghi tiếp: `commands/verify-V2-*/`, return.md bổ sung phần leg 2). Cập nhật `docs/implementation/workboard-findings.md` (chỉ state). Return cuối: verdict per case + per finding, các phần HOLD và điều kiện mở, trạng thái đề xuất, checks bỏ qua, rủi ro.
