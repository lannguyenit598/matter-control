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

## 5. Browser walkthrough path — real-IdP login + fault injection (MC-ENABLE-E2-E4-20261107)

**Mục đích**: đường login browser THẬT (ZITADEL Login UI → authorize → callback → session
cookie → product data hiển thị) cho session trial D-1(b), V-01..V-14, đo contrast on-dialog
(D-23), và G1 two-actor path — đóng US-R-01/E-2 (browser login) + US-R-02/E-4 (fault
injection cho T10 replay). Stub path ở §1–4 GIỮ NGUYÊN (không cần ZITADEL, machine-token);
path này bổ sung khi cần UI thật.

**Prerequisites** (one-time, đã có): `ops/p0-local` prepared+provisioned (secrets 0600,
`runtime/mc-api-app-key.json`), volume `mc-p0-claude-pgdata` giữ sẵn, `apps/frontend/.env.local`
(gitignored) trỏ `API_BASE_URL=http://127.0.0.1:8082/api/v1`, playwright global + Google Chrome
trên máy.

**UP — một lệnh**: `ops/local/walkthrough/browser/up.sh`
1. ZITADEL compose `mc-p0-idp` up (:8080) → discovery 200.
2. Container `mc-p0-claude-pg` (:55440, volume retained) → pg_isready.
3. Build `mcapi` từ tree → `mcapi migrate` (idempotent) → `seed-users.sh` (idempotent) →
   chạy **127.0.0.1:8083** với introspection `http://localhost:8080/oauth/v2/introspect`,
   `MC_OIDC_AUDIENCE=396855005832806403` (project id), key file `mc-api-app-key.json`,
   `MC_LOCAL_PEOPLE_DIRECTORY=true` (dev-only, cho member picker).
4. `faultproxy` **127.0.0.1:8082** → :8083 (mode off) — frontend gọi :8082 nên fault nhìn thấy
   ở UI thật mà không sửa product code.
5. `next dev` **127.0.0.1:3000** (redirect URI đã đăng ký) → HTTP 200/307.

**Login** (browser thường hoặc `./browser-check.sh` — Playwright channel:'chrome', cả hai
user, screenshot + timings vào evidence dir): mở `http://localhost:3000` → Sign in →
loginName **plain username** (`mc-alice` / `mc-bob`; dạng `@localhost` BỊ từ chối) → mật
khẩu (secrets/test-users.json, 0600, không bao giờ in/commit) → callback → session cookie
`mc_session` → `/workspaces` populated.

**Dữ liệu seeded (synthetic)**: workspace "Walkthrough WS (synthetic)" — mc-alice Owner,
mc-bob Member (đã thêm qua member picker — cần `MC_LOCAL_PEOPLE_DIRECTORY=true`), matters
M1/M2/M3. Seed QUA UI (`seed-browser.mjs`, command path thật, idempotent; không INSERT SQL
vào bảng event-sourced). Matter-level access cấp riêng (UI nói rõ) — grant matter cho mc-bob
KHÔNG nằm trong seed này.

**Fault injection (E-4)** — một lệnh mỗi fault, inverse rõ, không persist sau teardown:
`./fault-5xx.sh [code]` (default 503) · `./fault-latency.sh [ms]` (default 2000) ·
`./api-stop.sh` (inverse `./api-start.sh`) · `./fault-restore.sh` = tắt mọi fault ·
`./fault-demo.mjs` = demo từng fault với screenshot UI + đo API (503/2s-latency/502 → restore).
T10 replay (OUTCOME_UNKNOWN live) dùng chuỗi: thao tác đang ghi → fault → quan sát UI → restore.

**DOWN — bắt buộc khi xong**: `ops/local/walkthrough/browser/down.sh` — chỉ kill theo pidfile
của env này, stop+rm container `mc-p0-claude-pg` (volume giữ lại), compose down mc-p0-idp
(volume giữ lại), xoá state dir, **orphan check** 5 port {3000,8082,8083,55440,8080} + 5
container; exit 1 nếu còn orphan (không tự kill gì nó không start).

**Ràng buộc**: loopback-only tuyệt đối (faultproxy từ chối non-loopback listen/upstream;
next dev `-H 127.0.0.1`); chỉ synthetic data; secrets 0600 ngoài git; đây KHÔNG phải
production profile (không TLS, không multi-tenant thật). Env này làm các đo D-1(b)
**RUNNABLE** — không tự coi là done.
