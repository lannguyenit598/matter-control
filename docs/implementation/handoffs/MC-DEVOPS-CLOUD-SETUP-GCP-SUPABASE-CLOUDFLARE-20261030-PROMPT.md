# MC-DEVOPS-CLOUD-SETUP-20261030 — prompt hướng dẫn DevOps setup GCP Cloud Run, Supabase, Cloudflare Worker, R2

Soạn bởi actual Claude Code (Solution Architect), 2026-10-30, theo yêu cầu trực tiếp của PO: "viết prompt hướng dẫn devops hoàn thiện các bước setup ở GCP cho Cloud Run, Supabase cho database, Worker Cloudflare cho FE và R2 cho storage". Handoff thủ công, chưa dispatch. Chuyển nguyên văn từ mục 1 trở xuống cho DevOps (actual Codex theo AGENTS.md, hoặc operator người cùng agent dẫn dắt).

Topology: ADR-006 (mặc định). Browser → **Cloudflare Worker** (Next.js/BFF) → **Cloud Run `asia-southeast1`** (Go `mcapi`) → **Supabase PostgreSQL `ap-southeast-1`**; file qua **Cloudflare R2 (private)**; danh tính **ZITADEL**. Đây là **synthetic pilot**, không phải production/dữ liệu pháp lý thật.

---

## 1. Vai trò, quyền và hai chế độ chạy

Bạn là DevOps của MatterControl. Bạn hướng dẫn và thực thi, theo thứ tự, việc thiết lập hạ tầng cho pilot.

**Quy tắc cứng (AGENTS.md):** không tự đăng nhập/xác thực thay người dùng; không đọc hay in secret; không đặt secret/DSN/token vào chat, git, log, evidence, build arg; không sửa cài đặt agent toàn cục; không commit/push (trừ khi PO yêu cầu rõ); không tuyên bố DONE/DEPLOYED/`$0`/production-ready khi thiếu bằng chứng. Đăng nhập tương tác (`gcloud auth login`, `wrangler login`) do **người vận hành** gõ trong phiên với tiền tố `!` (ví dụ `! gcloud auth login`); bạn chỉ chuẩn bị lệnh và đọc kết quả không nhạy cảm.

**Hai chế độ:**
- **PREP (mặc định, không cần phê duyệt thêm):** đọc source/tài liệu, render cấu hình bằng `node ops/deploy/profiles.mjs`, chạy kiểm tra local, soạn danh sách lệnh chính xác, kiểm cú pháp bằng `--help`/`--dry-run`/`describe` chỉ-đọc. KHÔNG tạo/sửa/xóa bất cứ tài nguyên nào ở provider.
- **EXECUTE (chỉ khi có Bản ghi Phê duyệt Cloud còn hiệu lực, mục 3):** thực thi đúng phạm vi đã ghi, từng pha, dừng ở mỗi cổng.

Nếu chưa có bản ghi phê duyệt: làm PREP đến hết, trả gói lệnh, **dừng**. Không được suy ra phê duyệt từ prompt này, từ ADR-004 hay từ việc PO từng "duyệt" bằng lời trong phiên khác.

## 2. Điều kiện tiên quyết (kiểm trước khi chạy bất cứ lệnh provider nào)

1. **ZCode đã trả `MC-ZCODE-DEPLOY-READINESS-FINISH-20261030`** (xem `docs/testing/zcode-deploy-readiness-finish-20261030-r1/return.md`, `cloud-activation-packet.md`) và Codex đã intake. Nếu chưa tồn tại → chỉ PREP; các file `ops/` có thể đang đổi (ví dụ TTL 30s, tách service account migrator, SQL role, migration 0010). Luôn đọc lại file ở thời điểm chạy; không dùng bản đã nhớ.
2. Có commit/SHA sạch đã review cho candidate (hiện cây làm việc còn nhiều file chưa commit; PO/Codex quyết commit — bạn KHÔNG tự commit). Ghi SHA vào evidence; nếu không có SHA sạch, mọi thứ chạy là "pilot-trên-working-tree" và phải ghi rõ.
3. Gate nội dung (đủ cả bốn): `make check` backend và `pnpm check` frontend xanh trên đúng byte sẽ triển khai; `pnpm build:worker` thành công; release preflight (artifact không chứa `.env*`, `.dev.vars`, key) đạt; ZCode đã tách danh tính migrator/runtime trong profile Cloud Run.
4. Máy thao tác: chip Apple Silicon (`arm64`) — **Cloud Run chạy `linux/amd64`**. Image phải build bằng `--platform linux/amd64`; image arm64 sẽ lỗi "exec format error" khi khởi động.

## 3. Bản ghi Phê duyệt Cloud (bắt buộc cho EXECUTE)

Tạo `docs/deployment/cloud-authorization-record-<YYYYMMDD>.md` ở dạng **đề xuất để PO điền/xác nhận bằng tin nhắn của chính họ**. Bạn không tự điền chữ ký/xác nhận. Nội dung:

| Mục | Phải ghi |
|---|---|
| Phạm vi | Project GCP (id), account Cloudflare, project Supabase (ref), danh sách tài nguyên được tạo; **không** tài nguyên nào khác |
| Khu vực | Cloud Run `asia-southeast1`; Supabase `ap-southeast-1`; R2 location hint (ghi chính xác); ghi rõ Workers là edge toàn cầu, ZITADEL ở Úc (D3) — pilot synthetic |
| Chi phí | Gói Cloudflare Workers (Free hay Paid), Supabase (Free), GCP billing; ngân sách + ngưỡng cảnh báo (đề xuất 1/5/10 USD; cảnh báo không phải trần) |
| Dữ liệu | Chỉ synthetic, người dùng A/B có tên |
| Quyền | Ai là người triển khai (người thật), tài khoản dịch vụ nào được tạo, IAM tối thiểu |
| Hủy bỏ | Quyền teardown đúng các tài nguyên đã tạo, thời hạn hiệu lực của phê duyệt |
| Quyết định liên quan | D1 (ingress), D2 ($0), D3 (residency), D6 (adapter OpenNext), D7 (số workload) — ghi nhận đã chấp nhận hoặc còn mở |

Thiếu mục nào → không EXECUTE phần phụ thuộc mục đó.

## 4. Đầu vào đọc trước

`docs/architecture/adr/ADR-006-*.md`, `ADR-007-*.md`, ADR-004 (mục quyết định); `docs/deployment/{pilot-deploy-runbook.md (nếu ZCode đã tạo),zitadel-supabase-operator-setup-20261030.md,portability-runbook.md,free-tier-budget.md,free-phase-deploy-checklist.md (đoạn Cloud Run-frontend là lịch sử, KHÔNG chạy)}`; `ops/adr006/{README.md,bff-state.sql}` + SQL role B1 do ZCode đóng gói; `ops/deploy/{profiles.mjs,cloud-run/*.yaml,cloud-run.values.example.json}`; `apps/frontend/{wrangler.jsonc,.dev.vars.example,scripts/build-worker.mjs}`; `apps/backend/Dockerfile`, `apps/backend/.env.example`, `apps/backend/internal/config/product.go` (tên biến env thật); `docs/testing/zcode-adr006-cloud-readiness-20261030-r1/` (B1–B9). Với cú pháp lệnh provider: tra tài liệu chính thức qua Context7 (resolve → query) hoặc `--help`; cờ nào không chắc ghi `[verify]` và kiểm trước khi chạy — không bịa cờ.

## 5. Biến cần thu thập từ người vận hành (một lần, không gồm secret)

Điền vào `docs/deployment/cloud-inputs-<YYYYMMDD>.md` (chỉ giá trị công khai; secret là TÊN secret): GCP `PROJECT_ID`, billing account id (chỉ để link, không in ra nơi công khai), region, Artifact Registry repo; Cloudflare `ACCOUNT_ID`, tên Worker, **origin FE công khai** (workers.dev hoặc domain), tên bucket R2; Supabase project ref, host Session pooler/Direct, tên role; ZITADEL issuer/project/client IDs (đã có trong `zitadel-supabase-operator-setup-20261030.md`, chỉ "live-readback-needed"); email nhận cảnh báo; người triển khai. Không yêu cầu gửi token/password/DSN đầy đủ/private key.

**Thứ tự cho phép biết origin FE trước khi deploy:** lấy subdomain `workers.dev` của account Cloudflare (hoặc chốt custom domain) ở Pha 1, nên `APP_ORIGIN` và redirect URI ZITADEL biết trước, tránh deploy hai lần.

## 6. Các pha thiết lập (thứ tự bắt buộc; mỗi pha có cổng ra)

Ký hiệu: **[M]** = thay đổi provider (chỉ EXECUTE); **[R]** = chỉ đọc; `[verify]` = cú pháp phải kiểm bằng `--help`/tài liệu trước khi chạy. Mọi lệnh shell thêm tiền tố `rtk` khi chạy từ phiên agent.

### Pha 1 — Tài khoản, ngân sách, guardrail
1. **[M] GCP:** project riêng không dùng chung (`gcloud projects create` hoặc dùng project trống đã tạo); link billing (`gcloud billing projects link`); đặt project mặc định.
2. **[M] Budget & cảnh báo:** `gcloud billing budgets create` (mốc 1/5/10 USD, thông báo tới email giám sát) `[verify]`. Cảnh báo trễ, không phải trần chi tiêu — ghi rõ trong evidence.
3. **[M] Bật API tối thiểu:** `run`, `artifactregistry`, `secretmanager`, `cloudbuild` (chỉ nếu dùng), `iam`, `iamcredentials`, `monitoring`, `logging`, (nếu có job định kỳ) `cloudscheduler`. Không bật thừa.
4. **[R] Cloudflare:** xác nhận account, lấy `ACCOUNT_ID`, subdomain `workers.dev`; xác nhận gói Workers (Free/Paid) và quyết định tương ứng ở bản ghi phê duyệt. **[M]** Bật R2 (có thể yêu cầu phương thức thanh toán — theo phê duyệt).
5. **[M] Supabase:** project mới (hoặc dùng project đã chỉ định trong bản ghi) region **Singapore `ap-southeast-1`**, mật khẩu admin trong password manager. Không bật add-on trả phí để vượt lỗi kết nối.
- **Cổng ra:** budget alert tồn tại và đã test thông báo; danh sách API đã bật; hai tài khoản (GCP, Cloudflare) đăng nhập bởi người; project Supabase đã tạo.

### Pha 2 — ZITADEL (đăng ký origin)
Theo `zitadel-supabase-operator-setup-20261030.md` §2–5: dùng cùng issuer cho FE và Go (không dấu `/` cuối); đăng ký **redirect URI + post-logout URI đúng origin FE** (HTTPS, không wildcard); web app Authorization Code + PKCE, refresh grant bật, ID token RS256, Dev Mode tắt; API app private-key-JWT, tạo key JSON, **lưu thẳng vào Secret Manager ở Pha 5**, không lưu vào repo; hai user synthetic A/B hoàn tất thiết lập. Đây là thao tác Console của người vận hành.
- **Cổng ra:** bản công khai mục §10 của guide đã điền; không có credential nào trong chat.

### Pha 3 — Supabase: bảo mật và DB
Theo guide §6–8:
1. **[R→M] Kết nối:** lấy host/port từ **Connect** (Session pooler 5432 cho API; Direct cho migration nếu mạng hỗ trợ IPv6; **không** dùng Transaction pooler 6543 — pgx prepared statements và advisory lock của goose).
2. **[M] TLS:** tải CA từ Database → SSL Configuration; DSN dùng `sslmode=verify-full` + CA; bật Enforce SSL (có thể reboot DB — ngoài giờ dùng).
3. **[M] Data API:** tắt nếu không dùng; nếu còn bật, bỏ schema ứng dụng khỏi exposed schemas và kiểm quyền `anon`/`authenticated`/`service_role`/`PUBLIC`.
4. **[M] Role & schema:** chạy SQL **đã review** do ZCode đóng gói (B1: owner NOLOGIN, migrator, runtime, maintenance; role BFF riêng chỉ DML trên `mc_bff.state`) — **tuyệt đối không** dùng `b1_least_privilege_test.go` (có `DROP OWNED/SCHEMA CASCADE/ROLE`) làm bootstrap. Mật khẩu role đặt qua kênh riêng (không nằm trong SQL/chat).
5. **[M] Schema BFF:** áp `ops/adr006/bff-state.sql` bằng danh tính migrator (không dùng role runtime).
6. **[M] Migrations sản phẩm:** KHÔNG chạy ở đây; chạy bằng Cloud Run Job ở Pha 6.
7. **[R] Tính ngân sách kết nối:** pool mcapi = 10/instance × `maxScale` (đề xuất 3) × tính cả revision cũ+mới khi rollout + BFF (một kết nối ngắn mỗi giao dịch state × concurrency Worker) so với giới hạn pooler/direct đo được; ghi phép tính vào evidence.
- **Negative bắt buộc (chạy bằng kết nối runtime, chỉ đọc kết quả):** runtime không CREATE/ALTER/DROP/TRUNCATE; không UPDATE/DELETE bảng append-only; không SET ROLE owner; role BFF không đọc bảng sản phẩm; `anon`/`authenticated` không thấy bảng; kết nối không TLS bị từ chối.
- **Cổng ra:** bảng kết quả negative = PASS hết; `current_schema`/`search_path` đúng; DSN lưu thành secret (tên + version), không lộ nội dung.

### Pha 4 — Cloudflare R2
1. **[M] Bucket:** tạo bucket riêng, private. Khu vực/location hint theo bản ghi phê duyệt (`wrangler r2 bucket create <name> --location <hint>` `[verify]`). Không bật public access, `r2.dev`, custom domain công khai.
2. **[M] API token (S3):** tạo trong Dashboard → R2 → Manage API tokens, quyền **Object Read & Write giới hạn đúng bucket này** (không Admin, không account-wide); ghi lại Access Key ID/Secret **trực tiếp vào Secret Manager (Pha 5)**, không qua chat/file. Endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`.
3. Không cần CORS/presigned URL cho browser: mọi truy cập file đi qua Go (server-side). Không cấu hình CORS.
4. **[R] Kiểm** (bằng script do ZCode chuẩn bị, hoặc `aws s3api` với endpoint R2 `[verify]`): PUT/GET/HEAD một object synthetic, SHA-256 khớp, ListObjects, xóa object test; xác nhận credential không đọc được bucket khác.
- **Cổng ra:** smoke R2 đạt; bucket xác nhận không có public URL; token có phạm vi tối thiểu; dọn object test.

### Pha 5 — GCP: registry, danh tính, secret, image
1. **[M] Artifact Registry:** repo Docker `mattercontrol` ở `asia-southeast1`; chính sách dọn giữ 2–3 image gần nhất (`set-cleanup-policies`, bắt đầu bằng dry-run `[verify]`).
2. **[M] Hai service account riêng:** `mcapi-runtime` (chạy dịch vụ) và `mcapi-migrator` (chạy job migrate) — **không dùng chung**. Chỉ cấp `roles/secretmanager.secretAccessor` **trên từng secret** (không project-wide): runtime = DB runtime URL, R2 key id/secret, OIDC key; migrator = migrate DB URL + những secret mà lệnh `mcapi migrate` thực sự yêu cầu (full config validation — đọc `product.go`). Không cấp quyền editor/owner.
3. **[M] Secret Manager:** tạo secret (replication user-managed ở `asia-southeast1` `[verify]`): `mcapi-database-url`, `mcapi-migrate-database-url`, `mcapi-r2-access-key-id`, `mcapi-r2-secret-access-key`, `mcapi-oidc-api-key`. Thêm version **qua stdin/tệp 0600 tạm đã xóa**, không dùng đối số dòng lệnh (lộ trong lịch sử shell/process list). Giữ ít version.
4. **[M] Build & push image bằng digest:** `docker buildx build --platform linux/amd64` từ `apps/backend` (distroless, non-root); push lên Artifact Registry; lấy **digest** `@sha256:…` (profile từ chối tag trôi nổi). Không build trên cây có `.env*` chưa loại trừ (kiểm `.dockerignore`).
5. **[M] Xác thực chuỗi cung ứng cơ bản:** chạy scan image (nếu bật Artifact Analysis/`trivy` local) và ghi digest + kết quả; không chặn nếu không có công cụ, ghi NOT_RUN.
- **Cổng ra:** digest được ghi; mọi secret có version; kiểm IAM binding: runtime KHÔNG đọc được secret migrator và ngược lại (negative IAM: thử `gcloud secrets versions access` bằng impersonation chỉ khi được phép; nếu không, kiểm bằng `get-iam-policy`).

### Pha 6 — Render profile và chạy migrate
1. **[R]** Điền values JSON từ `ops/deploy/cloud-run.values.example.json` (chỉ giá trị không-secret: IMAGE digest, OIDC_*, R2_ENDPOINT/BUCKET, **tên** secret, SERVICE_NAME, REGION, hai service account, MAX_INSTANCES=3). Render: `node ops/deploy/profiles.mjs cloud-run values.json out-cloudrun/` (thư mục **mới**). Đọc kỹ file render; xác nhận `MC_OIDC_CACHE_TTL=30s`, `MC_SHUTDOWN_TIMEOUT=8s`, `timeoutSeconds: 75`, `containerConcurrency: 10`, không có giá trị secret inline.
2. **[M] Job migrate:** `gcloud run jobs replace out-cloudrun/migrate-job.yaml --region asia-southeast1`, rồi `gcloud run jobs execute <service>-migrate --region asia-southeast1 --wait`. Xác nhận exit 0, phiên bản goose đã áp (0001→mới nhất), qua log (không có secret). Chạy **đúng một lần**; nếu lỗi → đọc log, sửa nguyên nhân, không lặp mù quáng.
- **Cổng ra:** migration version ghi vào evidence; kiểm lại quyền runtime trên bảng mới (grant class đúng).

### Pha 7 — Deploy Cloud Run
1. **[M]** `gcloud run services replace out-cloudrun/service.yaml --region asia-southeast1`. Ingress `all`; **IAM invoker không bật** theo ADR-007 (ranh giới ứng dụng = bearer ZITADEL mỗi người dùng): cần cho phép gọi công khai (`allUsers` với `roles/run.invoker`, hoặc cờ tắt kiểm invoker IAM của Cloud Run `[verify]`). Nếu org policy chặn chia sẻ công khai → dừng, báo PO (D1), không lách.
2. **[R]** Kiểm: revision Ready; log khởi động cho thấy backend `r2` (không phải `fs`); `K_SERVICE` guard hoạt động; `/healthz`, `/readyz` là probe nội bộ (đường kết thúc bằng `z` có thể bị Cloud Run chiếm cho truy cập công khai — kiểm chứng bằng probe thay vì gọi từ ngoài).
3. **[R] Negative bảo mật từ ngoài:** gọi `https://<api>/api/v1/workspaces` không bearer → 401; bearer sai audience → 401/403; không có đường nào trả dữ liệu khi thiếu xác thực.
- **Cổng ra:** revision đang phục vụ 100%, giữ revision trước để rollback (ở lần đầu chưa có). Ghi URL API vào inputs.

### Pha 8 — Cloudflare Worker (FE/BFF)
1. **[R] Build trên checkout sạch:** `cd apps/frontend && pnpm install --frozen-lockfile && pnpm build:worker`. Script từ chối build nếu `.env*` chứa secret runtime; **không đặt secret vào file build**. Không build đồng thời hai profile FE trong cùng cây.
2. **[R] Đo kích thước upload thật:** `wrangler deploy --dry-run --outdir <dir>` `[verify]` và đọc dòng Total Upload/gzip. Số đo cục bộ trước đó (`handler.mjs` ≈5.6 MB, gzip ≈1.44 MB) KHÔNG phải số upload của Cloudflare. So với giới hạn kích thước Worker của **gói đã chọn** (Free thấp hơn Paid — tra tài liệu Cloudflare, `[verify]`). Vượt giới hạn gói Free → dừng, báo PO (cần Paid hoặc cắt bundle); không cắt tính năng để né.
3. **[M] Secret của Worker** (nhập tương tác qua stdin, người vận hành gõ; không `echo` vào lệnh): `wrangler secret put BFF_DATABASE_URL` (role BFF, session host, `sslmode=verify-full`), `BFF_STATE_KEYS` (JSON key ring, 32 byte base64 độc lập; tạo bằng `openssl rand -base64 32` trong shell người vận hành, không in ra chat), `BFF_DATABASE_CA` (nếu cần). Không đặt vào `vars`.
4. **[M] Biến không-secret** (`vars`/cờ `--var`, theo env, không commit giá trị thật vào repo nếu chưa được duyệt): `API_MODE=rest`, `API_BASE_URL=https://<api>/api/v1`, `AUTH_ALLOW_ANONYMOUS=false`, `APP_ORIGIN=<origin FE>`, `OIDC_ISSUER`, `OIDC_CLIENT_ID`, `OIDC_PROJECT_ID`, `SESSION_COOKIE_SECURE=true`, `BFF_STATE_BACKEND=postgres`, `BFF_STATE_KEY_ID=v1`.
5. **[M] Deploy:** `wrangler deploy` hoặc `wrangler versions upload` + `wrangler versions deploy` (để giữ phiên bản trước) `[verify]`. Ghi Worker version id.
- **Cổng ra:** Worker truy cập được qua `https://…`; `APP_ORIGIN` trùng chính xác origin thật; redirect URI ZITADEL đã đăng ký đúng origin này.

### Pha 9 — Smoke và negative end-to-end (synthetic A/B)
Theo checklist §4 của `free-phase-deploy-checklist.md` (đã cập nhật bởi `pilot-deploy-runbook.md` nếu có): đăng nhập ZITADEL → đăng xuất → đăng nhập lại; tạo workspace/matter; thêm B vào matter; B thấy, non-member không thấy; tạo action/requirement, tải lại còn nguyên; tạo document, upload 1 MB và ~25 MiB, tải xuống so SHA-256, upload lại cùng file → "already stored"; export CSV; xem preview import (không commit). **Negative:** upload với `Origin` sai bị từ chối; user không quyền nhận 403/404; request Supabase bằng publishable key vào bảng không trả dữ liệu; **restart/scale Worker và Cloud Run → phiên bền vẫn còn (durable BFF state), thu hồi quyền có hiệu lực trong ≤ TTL 30s**; khóa BFF sai/thiếu → hệ thống báo unavailable, không rơi về memory.
- Ghi từng bước: lệnh/UI, UTC, kết quả, bằng chứng đã redact. Lỗi cấu hình/môi trường không được gọi là FAIL sản phẩm; lỗi nghiệp vụ → báo lại cho chủ sở hữu, không tự sửa source.
- **Cổng ra:** mọi mục PASS hoặc NOT_RUN có lý do; không có negative nào FAIL (nếu FAIL → rollback theo Pha 11).

### Pha 10 — Quan sát, sao lưu, giữ-sống
1. **Giám sát tối thiểu (B9):** cảnh báo Cloud Run (5xx, độ trễ, số instance, bộ nhớ), log lỗi, ngân sách, dung lượng DB Supabase (cảnh báo ở 400/500 MB), thao tác R2, DAU ZITADEL; mọi cảnh báo >70% hạn mức trước cuối tháng. Không đưa token/nội dung pháp lý vào nhãn log/metric.
2. **Sao lưu logic hằng đêm** (script ZCode WP-6): `pg_dump` sang vị trí **thứ hai** (prefix R2 khác với token riêng, hoặc GCS trong hạn mức), giữ 7 bản; lên lịch bằng Cloud Run Job + Cloud Scheduler `[M]`; **một lần restore rehearsal** vào DB tạm và kiểm SHA-256 một tài liệu. Supabase Free không có backup tự động/PITR — đây là phương án duy nhất.
3. **Giữ-sống Supabase Free:** lịch gọi thực hiện truy vấn DB thật ít nhất vài ngày/lần (theo kiểm tra `/readyz` của ZCode WP-6). Xác nhận hành vi pause/restore trên dashboard.
4. **Dọn `mc_bff.state` hết hạn:** lên lịch job dọn có giới hạn (ZCode WP-6).
- **Cổng ra:** cảnh báo đã bắn thử (không gửi nội dung nhạy cảm); backup đầu tiên + restore rehearsal có số đo.

### Pha 11 — Ghi nhận, rollback, teardown
- **Ghi release:** commit SHA/trạng thái cây, image digest, revision Cloud Run, Worker version id, migration version, người triển khai, UTC (không secret) vào `docs/testing/devops-cloud-setup-20261030-r1/release-record.md`.
- **Rollback** (triệu chứng ở `free-phase-deploy-checklist.md` §7): Cloud Run → chuyển traffic về revision trước (`gcloud run services update-traffic` `[verify]`); Worker → `wrangler rollback` hoặc deploy version trước `[verify]`; schema chỉ forward-fix, không chạy down; tài liệu bất biến nên không cần rollback đối tượng. Sau rollback giữ log, ghi thời điểm/nguyên nhân, không deploy lại tới khi biết nguyên nhân.
- **Teardown (chỉ theo bản ghi phê duyệt):** xóa đúng tài nguyên đã tạo (Worker, bucket R2 sau khi rỗng, service/job Cloud Run, secret, repo registry, SA, project nếu riêng), thu hồi token/key R2 và key ZITADEL liên quan; xác nhận bằng liệt kê chỉ-đọc rằng không còn tài nguyên mồ côi. Không xóa thứ không do bạn tạo.

## 7. Bẫy thường gặp (kiểm trước, đừng đoán)

1. Image arm64 trên Cloud Run (build `linux/amd64`).
2. Dùng Transaction pooler 6543 cho pgx/goose → lỗi prepared statement/advisory lock; dùng Session pooler 5432 hoặc Direct.
3. DSN chưa percent-encode password; username pooler phải có dạng `role.PROJECT_REF`.
4. `APP_ORIGIN` ≠ origin thật hoặc redirect URI lệch → login lỗi, Server Action bị từ chối origin.
5. Issuer FE và Go lệch (dấu `/` cuối).
6. Secret đặt vào `vars` của Worker, `.env` lúc build, hoặc cờ dòng lệnh (lộ qua bundle/lịch sử).
7. Cấp `secretAccessor` project-wide thay vì theo từng secret; dùng chung một SA cho job migrate và service.
8. Org policy chặn `allUsers` invoker → đừng lách, báo PO.
9. Số liệu bundle cục bộ ≠ giới hạn Cloudflare; đo bằng `--dry-run`.
10. Cảnh báo ngân sách GCP không phải trần chi tiêu; R2/Workers/Cloud Run đều có thể phát sinh phí khi vượt hạn mức.
11. Supabase Free tạm dừng sau thời gian không hoạt động; không có sao lưu tự động.
12. `/healthz`/`/readyz` có thể bị Cloud Run chiếm với một số đường dẫn công khai; chỉ dùng làm probe.
13. Rolling deploy làm tổng kết nối vượt giới hạn pooler (10 × số instance cũ+mới).

## 8. Đầu ra

Namespace `docs/testing/devops-cloud-setup-20261030-r1/` (nếu tồn tại: attempt con `-r2`):
- `cloud-authorization-record.md` (bản đề xuất và xác nhận của PO — do PO xác nhận), `cloud-inputs.md` (không secret).
- `prep-report.md` (chế độ PREP: danh sách lệnh chính xác đã kiểm cú pháp, file render, các `[verify]` đã giải quyết, phép tính ngân sách kết nối, số đo bundle dry-run).
- `phase-log.md` (EXECUTE: từng pha — lệnh, UTC, kết quả, bằng chứng đã redact, tài nguyên tạo ra với ID công khai).
- `negative-tests.md` (DB, IAM, R2, API không xác thực, origin, Data API).
- `smoke-results.md` (Pha 9), `monitoring-and-backup.md` (Pha 10), `release-record.md`, `teardown-plan.md` (và kết quả nếu đã chạy), `return.md`.
- Task record `docs/implementation/tasks/MC-DEVOPS-CLOUD-SETUP-20261030.md` (đã tạo khung — điền); một đoạn ngắn đầu `docs/ai-sdlc/project-status.md`.

`return.md` phải nêu: agent/tool/version thật, chế độ đã chạy (PREP hay EXECUTE và đến pha nào), SHA/trạng thái cây, tài nguyên đã tạo (ID công khai), kết quả negative, những gì NOT_RUN, chi phí phát sinh quan sát được, rollback/teardown đã sẵn sàng chưa, và phân loại bằng chứng: *tài liệu nhà cung cấp* / *đã chạy trên provider* / *chỉ suy luận*. Trạng thái đề xuất: `PILOT_PROVISIONED_SYNTHETIC / IN_REVIEW_WITH_VERIFICATION_BLOCKERS` hoặc `PREP_COMPLETE / WAITING_CLOUD_AUTHORIZATION`. KHÔNG ghi DONE/DEPLOY_READY/`$0`/production-ready. Độc lập: kết quả này là bằng chứng của DevOps; OpenCode vẫn thực hiện các case provider-only độc lập (6 case). Kết thúc bằng checks bị bỏ qua và rủi ro còn lại.

## 9. Điều kiện hoàn thành

PREP hoàn tất khi: lệnh/cấu hình/phép tính của mọi pha đã kiểm tra, các `[verify]` đã đóng, bản ghi phê duyệt đề xuất đã soạn, và dừng ở đúng một handoff cho PO/operator. EXECUTE hoàn tất khi: Pha 1–10 có cổng ra đạt hoặc BLOCKED có lý do chính xác, negative test đạt, release record + rollback + teardown sẵn sàng. Không mở thêm vòng lập kế hoạch; không tự sửa source — lỗi code chuyển cho chủ sở hữu (ZCode backend, Antigravity/Codex frontend).
