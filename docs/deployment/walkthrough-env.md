# Walkthrough environment — MatterControl P0 (D-1(b), RATIFIED 2026-10-31)

Mục đích: một đường **chuẩn, có tài liệu** để chạy MatterControl với dữ liệu thật ở local (backend thật + dữ liệu synthetic) — cho PO xem sản phẩm, cho luật sư thử nhiệm vụ (usability-test-plan), cho reviewer đi bộ Golden Workflows — mà KHÔNG cần ZITADEL/cloud và KHÔNG đụng runtime của ai. Đây là phương án D-1(b) được PO phê duyệt; pattern đã được **chứng minh sống** bởi BA flow-completeness r2 (570 HTTP calls, GW-01→03) — receipts: `docs/testing/zcode-ba-flow-completeness-20261030-r1/r2/commands/` (runtime-env.txt, run-records.md).

## 1. Thành phần (4 mảnh, tất cả loopback-only, disposable)

| Mảnh | Ghi chú |
|---|---|
| PG 18.6 container | nhãn riêng (vd `mc-walkthrough-pg`), port riêng (vd 15432), DB riêng; migrations do `mcapi migrate` / `MC_MIGRATE_ON_START=true` áp (bundle goose của `apps/backend`) |
| `mcapi` backend | build từ tree hiện tại (`go build ./cmd/mcapi`), port riêng (vd 18083), env trỏ vào PG container |
| **Stub IdP** | HTTP nhỏ: POST /introspect trả active=true với user/role synthetic; **tự sinh key, không đọc secret của ai**; r2 đã có mẫu hoạt động (5 user: OWNER/EDITOR-submit/EDITOR-verifier/VIEWER/non-member) |
| Token minter | script cấp bearer token cho từng synthetic user (r2 dùng UUIDv7 cho Idempotency-Key — uuidgen macOS ra v4, không dùng được) |

## 2. Các bước (thứ tự)

1. `docker run -d --name mc-walkthrough-pg --label mc.task=MC-WALKTHROUGH -p 127.0.0.1:15432:5432 postgres:18.6-alpine` → tạo DB → migrations do `mcapi` áp (bundle goose của backend). Toàn bộ chuỗi này `ops/local/walkthrough/up.sh` tự chạy.
2. Build `mcapi` từ tree; env: `DB_URL`→PG trên, `OIDC_INTROSPECT_URL`→stub, bind 127.0.0.1:18083.
3. Khởi động stub IdP (tự sinh key, lưu vào thư mục tạm 0700 ngoài git).
4. Verify 4 mốc (như r2): `readyz` 200 → no-token 401 → token hợp lệ 200 → token lạ 401.
5. Đi bộ GW-01→GW-02→GW-03 bằng bộ script của BA r2 (repro `r2/walkthrough-evidence/` + `commands/`) hoặc thủ công qua curl.
6. **Teardown bắt buộc khi xong**: `ops/local/walkthrough/down.sh` (kill mcapi + stub theo pidfile, xoá container, xoá key tạm, tự kiểm chứng không orphan). (Tiền lệ: orphan 18082 — đừng lặp.)

## 3. Ràng buộc

- Chỉ synthetic data; không PII; key stub là key dùng-1-lần tự sinh, không bao giờ là secret thật.
- Không đụng :3000/:8080/container của task khác; port riêng toàn bộ.
- Mọi lệnh prefix `rtk` theo AGENTS.md; Mimosa không đánh giá stub key là secret (tự sinh, 0700, ngoài git) — nếu hook flags, ghi vào receipt.
- Env này KHÔNG phải production profile: không TLS, không multi-tenant thật, không backup — chỉ để hiểu flow & trial nội bộ. Deploy thật theo `pilot-deploy-runbook.md`.

## 4. Trạng thái (cập nhật 2026-11-01, MC-ZCODE-ENABLEMENT-MINIFIX-20261101)

- Đã đóng gói: `ops/local/walkthrough/up.sh` / `mint-token.sh` / `down.sh` + `stubidp/` — smoke 4/4 mốc PASS (readyz 200 / no-token 401 / token 200 / token lạ 401), teardown sạch, không orphan. Receipts: `docs/testing/mc-enablement-minifix-20261101-r1/commands/`.
- Còn mở (phase sau, ngoài phạm vi env này): UI demo mode — frontend demo chưa có data layer (UX-L-03); cho tới khi có P-03-type bridge, trial dùng env này + HTTP qua backend thật; locale fix (UX-L-02) phải landed trước để UI tiếng Việt đúng khi trial.
