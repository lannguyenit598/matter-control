# MC-ZCODE-ENABLEMENT-USFIX-20261101 — prompt cho session ZCode mới (US-R-01/R-02: mở khoá UI trial)

Soạn bởi actual ZCode (coordinator) 2026-11-01. Người thực hiện: session ZCode mới. Khuyến nghị dispatch: **sau khi fix-wave return** (tránh 2 writer cùng chạm frontend env) — hoặc NGAY nếu chấp nhận kỷ luật path-rời-nhau nghiêm ngặt (việc này chỉ đụng `ops/local/walkthrough/**`). Chuyển nguyên văn từ mục 1.

## 1. Vai trò và ranh giới

Bạn đóng 2 gap do usability-prep phát hiện (register US-R-01/US-R-02, cả hai P2). CHỈ đụng `ops/local/walkthrough/**` + namespace của mình. KHÔNG đụng apps/**, `docs/testing/opencode-verify-wave-20261031-r1/**`, `mc-p1-fix-wave-20261101-r1/**`, `mc-enablement-minifix-20261101-r1/**` (phiên kia có thể còn sống), :3000/:8080. Freeze-check từng file trước sửa. rtk prefix; không secrets; commit theo unit; Mimosa chặn → playbook.

## 2. Việc

**U1 — US-R-01: stub IdP có trang login browser.** Mở rộng `ops/local/walkthrough/stubidp/main.go`: endpoint `/authorize` trả HTML login (chọn 1 trong 5 synthetic user, form mật khẩu synthetic check đơn giản), POST → redirect về `redirect_uri` của frontend trial với `code` + `state` (chấp nhận allowlist redirect_uri: đọc từ env `STUB_REDIRECT_URIS`, ví dụ `http://127.0.0.1:3101/api/auth/callback`); endpoint `/token` đổi code → token (giả lập code exchange đầy đủ để BFF frontend chạy được flow OIDC thật). Cập nhật README + `up.sh` (env redirect). **Smoke browser thật qua IAB/agent browser: đăng nhập qua UI tới khi thấy My Work có dữ liệu** — receipt screenshot + steps.

**U2 — US-R-02: fault-injection cho T10.** Thêm cơ chế chèn lỗi có kiểm soát vào `mcapi` hoặc proxy: env `STUB_FAULT_RULES` (vd `after_commit:action-id=A5`) — lệnh *đã commit* nhưng response bị drop/timeout để sinh `OUTCOME_UNKNOWN` thật trên UI. Ghi contract của rule vào README (kích hoạt/tắt, chỉ synthetic). **Smoke: chạy đúng chân T10 của phiên A → UI phải hiện trạng thái unknown + retry-same-key hoạt động.**

**U3 — dọn nợ nhỏ:** nếu `docs/deployment/pilot-deploy-runbook.md` §1 chưa có erratum pooler (M3 của enablement-minifix — check trước khi viết): thêm (Supavisor 200 Nano-tier đã verify, budget ~72–102, caveat tier).

## 3. Outputs

Namespace `docs/testing/mc-enablement-usfix-20261101-r1/`: return.md (per-item evidence + smoke browser receipts), commands/. Cập nhật `workboard-findings.md`: US-R-01/02 → FIXED_PENDING_VERIFY; walkthrough-env.md §4 cập nhật. Task record + KHÔNG đụng project-status.md.

## 4. Hoàn thành

U1 smoke qua browser PASS (login UI → My Work có dữ liệu); U2 smoke T10 PASS (unknown + same-key retry); teardown sạch không orphan; dừng — independent verify do OpenCode (thêm vào verify wave leg 2 kế tiếp).
