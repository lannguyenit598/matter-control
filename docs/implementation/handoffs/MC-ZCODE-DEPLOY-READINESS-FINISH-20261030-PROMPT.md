# MC-ZCODE-DEPLOY-READINESS-FINISH-20261030 — prompt cho actual ZCode

Soạn bởi actual Claude Code (Solution Architect), 2026-10-30, theo yêu cầu trực tiếp của PO: "kiểm tra các phần còn lại để sẵn sàng deploy, giao việc cho ZCode". Đây là handoff thủ công; chưa dispatch. Chuyển nguyên văn từ mục 1 trở xuống cho ZCode.

---

## 0. Bối cảnh (đã kiểm chứng bởi Claude, 2026-10-30)

Mục tiêu: **synthetic pilot deploy candidate** theo ADR-006 (Next.js/BFF trên Cloudflare Workers; Go `mcapi` trên Cloud Run `asia-southeast1`; Supabase PostgreSQL `ap-southeast-1`; private R2; ZITADEL). ADR-007 (App Hosting / Compute Engine) chỉ là profile thay thế, KHÔNG phải điều kiện hoàn thành. Không phải production / dữ liệu pháp lý thật.

Claude vừa chạy trên working tree hiện tại (HEAD `0de3e5d` + dirty tree), exit code thật:

| Gate | Kết quả |
|---|---|
| `cd apps/backend && rtk make check` | exit 0, golangci-lint 0 issues, 14 package `ok`. Suite PostgreSQL KHÔNG được Claude chạy (không đặt `MC_TEST_DATABASE_URL`) |
| `cd apps/frontend && rtk pnpm check` | exit 0: typecheck, eslint, prettier, vitest 96 file pass / 1 skip, 816 test pass / 12 skip, agents:check OK |
| KHÔNG chạy | `pnpm build`, `pnpm build:worker`, Storybook, Playwright, PG-backed Go tests, bất kỳ provider nào |

Hiện trạng: `docs/testing/claude-adr006-deploy-candidate-20261030-r1/` **không tồn tại** — assignment `MC-CLAUDE-ADR006-FINISH-TO-DEPLOY-CANDIDATE-20261030` chưa bao giờ trả kết quả, và cũng chưa có `cloud-activation-packet.md`. OpenCode 82 case độc lập: toàn bộ NOT_RUN. Không có cloud resource nào được tạo.

## 1. Vai trò, quyền, giới hạn

Bạn là **actual ZCode**, backend execution owner (AGENTS.md). Task này gồm cả backend lẫn các thay đổi nhỏ ở `apps/frontend`, `ops/`, `.github/` và docs — PO giao rõ cho task này; ghi writer/path vào task record. Không có writer cạnh tranh được chỉ định; nếu phát hiện file đang bị sửa bởi tiến trình khác, nêu chính xác file rồi tiếp tục phần không xung đột.

Được phép: sửa source/config/tests/SQL triển khai/CI templates/runbook; Docker/PostgreSQL fixture mới có nhãn riêng; IdP và object storage synthetic/fake.

Cấm tuyệt đối: `git commit/push/merge/reset/stash/clean/restore`; ghi đè dirty work; tạo/đổi resource cloud, billing, IAM, DNS, IdP; dùng bucket/DB/secret thật; đọc `.env*`, `.dev.vars`, key; đặt secret/password/DSN vào chat, evidence hoặc git; sửa hook/security ledger; tự nhận PASS độc lập. Mọi thứ bạn viết/chạy là `AUTHOR_VERIFICATION`, không phải independent PASS.

Quy tắc dự án: đọc `AGENTS.md` gốc + `apps/backend/AGENTS.md` / `apps/frontend/AGENTS.md`; mọi lệnh shell prefix `rtk` (`rtk proxy` nếu không có wrapper); tìm code bằng Semble trước; docs framework/provider qua Context7 (resolve → query), không bịa flag. Dữ liệu synthetic. Thiếu quyền/tool: ghi exact failed action rồi làm phần còn lại, không lách.

Không tự dừng để hỏi "tiếp tục?" giữa các work package. Chỉ dừng khi hết việc làm được local, hoặc chỉ còn external prerequisite.

## 2. Đọc trước khi sửa (intake, tối đa ~30 phút)

1. `docs/deployment/free-phase-deploy-checklist.md` (đoạn Cloud Run-frontend là lịch sử, KHÔNG chạy), `portability-runbook.md`, `zitadel-supabase-operator-setup-20261030.md`, `free-tier-budget.md`.
2. ADR-004 (mục quyết định đã duyệt), ADR-006, ADR-007.
3. `docs/testing/zcode-adr006-cloud-readiness-20261030-r1/` (đặc biệt `zero-trust-b1-b9.md`, `cloud-validation-approval-packet.md`), `docs/testing/codex-adr006-remediation-20261030-r1/`, `docs/testing/codex-claude-portability-intake-20261030-r1/return.md` (PI-01..04), `docs/testing/claude-deployment-portability-20261030-r1/`.
4. `ops/adr006/{README.md,bff-state.sql}`, `ops/deploy/{profiles.mjs,profiles.test.mjs,cloud-run/*,compute-engine/*}`, `.github/workflows/{backend,frontend}.yml`, `apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go`, `apps/frontend/{wrangler.jsonc,apphosting.yaml,next.config.ts,scripts/build-worker.mjs,Dockerfile}`.
5. Rehash các file bạn sắp sửa trước khi kết luận; nếu byte đã khác evidence cũ, intake delta, không rollback.

## 3. Work package (làm theo thứ tự ưu tiên; mỗi WP có AC + test)

Mỗi WP: sửa → test red/green → ghi lệnh/exit/UTC vào evidence. Lỗi thì root cause + sửa có giới hạn + chạy lại phần bị ảnh hưởng; KHÔNG nới assertion để xanh.

### WP-1 (P1) Khôi phục `MC_OIDC_CACHE_TTL` về 30s đã duyệt (PI-01)
- ADR-004 quyết định 4 đã duyệt `30s`. Hiện còn `15s` tại: `apps/backend/internal/config/product.go:104` (default), `apps/backend/.env.example:29`, `ops/deploy/cloud-run/service.yaml:45`, `ops/deploy/compute-engine/cloud-init.yaml:23`, `docs/deployment/portability-runbook.md` (bảng BE + bước 6 "15 s TTL"), `apps/backend/docs/operations.md` (cột default ghi `0s` — đối chiếu code rồi sửa cho đúng).
- Giữ `0s` tường minh ở `.env.example` dòng local/test (đoạn 49) và ở test cần revocation tức thời. KHÔNG xin PO chọn lại 15/30.
- AC: grep `15s` còn lại chỉ là chủ đích; test config default = 30s; `profiles.test.mjs` assert 30s; test thu hồi (revocation) ghi rõ TTL nó dùng; không dùng timing 15s làm bằng chứng cho 30s.

### WP-2 (P1) Đóng gói B1 least-privilege thành SQL triển khai được
- Hiện profile role (`mcapp`, `mc_owner`, `mc_migrator`, `mc_runtime`, `mc_maintenance`) chỉ nằm trong Go test (`b1_least_privilege_test.go`). Không có artifact để operator chạy trên Supabase.
- Tạo `ops/adr006/b1-roles.sql` (hoặc thư mục `ops/adr006/db/`), idempotent, KHÔNG chứa password/DSN (password đặt qua bước operator riêng, ghi trong runbook), tham số hoá tên schema/role nếu cần. Gồm: schema private ngoài Data API, REVOKE PUBLIC + default privileges, grant chính xác theo lớp bảng (append-only: SELECT+INSERT; 4 bảng replace-on-save thêm DELETE: `context_links`, `dependency_edges`, `milestone_prerequisites`, `review_grid_versions`), role BFF riêng chỉ `USAGE` trên `mc_bff` + `SELECT,INSERT,UPDATE,DELETE` trên `mc_bff.state`.
- Refactor `b1_least_privilege_test.go` để dùng CHÍNH file SQL này (một nguồn sự thật), không copy.
- Phải sinh grant cho bảng/migration mới (0010 ở WP-3) — kiểm tra bằng test "mọi bảng trong schema đều có grant class".
- AC: test B1 55/55 (hoặc nhiều hơn) chạy trên PG 18 mới có nhãn riêng, qua file SQL mới; denial tests giữ nguyên; thêm test BFF role: chỉ chạm được `mc_bff.state`, không đọc bảng sản phẩm, không CREATE.

### WP-3 (P1) Migration index B2 — đúng số thứ tự
- Slot `0009` ĐÃ DÙNG bởi `apps/backend/internal/adapter/outbound/postgres/migrations_mattercontrol/0009_criterion_purpose.sql`. Migration index (B2) được soạn trong `docs/testing/zcode-sql-review-fixes-20261030-r1/` dưới tên 0009 → phải là **`0010_*.sql`**. Đọc packet đó, đưa vào cây nguồn với Up/Down đúng, kiểm tra `CREATE INDEX` có `IF NOT EXISTS` theo quy ước goose của repo.
- Indexes: `review_answers(grid_id,version_id,question_id,answered_at DESC,id DESC)`, `matter_memberships(user_id,matter_id)` (+ cái thứ 3/4 trong packet). Không đổi SQL text query ⇒ không cần sqlc regen (xác nhận bằng `sqlc` diff rỗng).
- AC: migrate fresh 0001→0010 trên PG 18, rollback 0010 sạch, `EXPLAIN` harness (`MC_EXPLAIN_VERIFY=1`) chạy lại, B1 grants phủ 0010, full contracts dưới `mc_runtime` pass.

### WP-4 (P1) Tách danh tính migrator và runtime (PI-02)
- `ops/deploy/cloud-run/service.yaml:21` và `migrate-job.yaml:17` dùng chung placeholder `{{SERVICE_ACCOUNT}}`. Thêm `MIGRATOR_SERVICE_ACCOUNT` riêng vào `ops/deploy/profiles.mjs` (keys + regex email), cả `cloud-run.values.example.json`, `profiles.test.mjs`.
- Test: renderer từ chối khi hai giá trị trùng nhau; secret `MC_MIGRATE_DATABASE_URL` chỉ xuất hiện trong `migrate-job.yaml`, secret runtime chỉ ở `service.yaml`.
- Runbook ghi IAM tối thiểu mỗi SA (Secret Manager accessor đúng secret nào, Cloud SQL/network không cần) + kế hoạch negative test trên provider (NOT_RUN cho tới khi được cấp quyền).
- Compute Engine profile: tương tự (migrate unit đọc secret migrator, service unit không).

### WP-5 (P1) CI/release preflight + build artifact sạch (PI-03)
- `.github/workflows/frontend.yml`: thêm job `build:worker` (không credential cloud), chạy `pnpm build:worker` và kiểm tra artifact; ghim 3 action còn `TODO(supply chain)` theo SHA như backend.yml (lấy SHA thật từ nguồn chính thức, không đoán).
- Thêm job/test kích hoạt durable BFF state với PG service container trong CI (hiện `backend.yml` có PG, frontend không có) — chạy suite `durable-*` với `BFF_DATABASE_URL` trỏ fixture `mc_fixture`.
- Thêm **release preflight** (script nhỏ trong `ops/deploy/` hoặc `apps/frontend/scripts/`): quét `git ls-files` và thư mục build (`.open-next`, `.next/standalone`) tìm file bị cấm (`.env*` trừ `*.example`, `.dev.vars`, `*.pem`, `*.key`, `*api-key*.json`) và sentinel secret tổng hợp. App Hosting adapter đã được tái hiện copy `.env.local`/`.dev.vars` vào standalone — preflight phải bắt được điều đó trên artifact thật, không chỉ so chuỗi `.gitignore`.
- Thêm workflow deploy MẪU (`workflow_dispatch`, environment protected, Workload Identity Federation, KHÔNG key JSON dài hạn, deploy + migrate tuần tự) — chỉ là template trong `ops/deploy/ci/` hoặc `.github/workflows/deploy.yml.disabled`; không kích hoạt, không chứa secret.
- AC: workflow YAML hợp lệ (dùng `actionlint` nếu có, hoặc ghi rõ không chạy); preflight có test dương tính/âm tính với sentinel; `pnpm check` + `make check` vẫn xanh.

### WP-6 (P1) Cleanup/retention cho `mc_bff.state` + sao lưu thực sự
- Hàng hết hạn không đọc được nhưng vẫn nằm vật lý. Viết job dọn bounded (xóa theo batch `expires_at < now() - grace`, giới hạn số hàng, chạy bằng role maintenance riêng, có audit/log không nhạy cảm) + test. Không xoá receipt (B7 giữ DISABLED mặc định, chỉ thiết kế).
- Backup: đối chiếu `ops/p0-local/restore-rehearsal/run.sh` (hiện là drill công cụ synthetic). Viết quy trình + script `pg_dump` định kỳ cho schema MatterControl thật, ghi sang vị trí THỨ HAI, giữ 7 bản; và một **restore rehearsal local trên schema + migration thật 0001→0010** (tạo dữ liệu synthetic qua contract, dump, restore vào DB trống, so sánh row count/hash, tải lại một document và so SHA-256). Đây là điều kiện RPO/RTO local; ghi số đo thật, không suy diễn.
- Supabase Free: keep-alive + auto-pause. Kiểm tra `/readyz` thực sự gọi DB (xem `d.Ready` trong `apps/backend/internal/app/product.go`; `free-phase-deploy-checklist` nói nó không truy vấn DB). Nếu không, thêm kiểm tra DB tối thiểu vào `Ready` (timeout ngắn) có test; ghi runbook scheduler keep-alive (lệnh, không chạy).

### WP-7 (P1) Giới hạn pending-import trong Worker
- Pending import lưu sealed trong PG, tối đa 36 MiB/giá trị; chưa chứng minh Worker Free CPU/memory/latency (xem `ops/adr006/README.md`, mục Bounds). KHÔNG kích hoạt khối lượng lớn.
- Khuyến nghị thực hiện: đặt trần pending-import cho pilot ở mức nhỏ có thể đo được (đề xuất ≤ 5 MiB, cấu hình qua biến, fail-closed với thông báo rõ), test biên (đúng trần / vượt trần), và test upload tài liệu 25 MiB đi đường streamed riêng vẫn pass. Con số cuối cùng PO quyết (decision D7); bạn chỉ đề xuất + ghi vào packet.

### WP-8 (P2) Dọn nợ nhỏ có thật
- `apps/frontend/Dockerfile`: comment "one instance only" đã sai (state bền). Sửa comment, không đổi hành vi.
- `ops/deploy/*`/runbook: lỗi evidence PI-04 (Caddy validate "PASS" vs "not run") — thêm erratum file, KHÔNG sửa receipt lịch sử.
- `MC_DB_MAX_CONNS`: chỉ thêm nếu tính toán ngân sách kết nối Supabase (pool 10 × maxScale 3 + BFF) vượt giới hạn pooler đã ghi; nếu không, ghi "không cần" kèm phép tính.
- `pnpm format:check` baseline (file trạng thái Mimosa) — hiện đang xanh; chỉ xác nhận lại, không đổi.

### WP-9 (P1) Observability tối thiểu + runbook triển khai hiện hành (B9, supersede checklist cũ)
- Một tài liệu duy nhất `docs/deployment/pilot-deploy-runbook.md`: thứ tự triển khai ADR-006 (Supabase roles → `b1-roles.sql` → `bff-state.sql` → migrate job → backend → Worker → smoke), smoke test A/B (sign-in, tạo workspace/matter, thêm member, document upload 1 MB + gần 25 MiB + SHA-256, export, negative origin/403/Data API), rollback (revision trước; schema forward-fix), cleanup tài nguyên, monitoring (5xx, latency, instance, budget alert 1/5/10 USD, DB size 400 MB, R2 ops, ZITADEL DAU), xoay secret (B8: thêm key id → chuyển `BFF_STATE_KEY_ID` → giữ key cũ tới khi hết hạn).
- Trong `free-phase-deploy-checklist.md` chỉ THÊM addendum "superseded by pilot-deploy-runbook.md", không viết lại lịch sử.
- Mọi lệnh provider chỉ là lệnh mẫu có placeholder; ghi rõ "NOT_RUN".

### WP-10 (P2, quyết định PO — chỉ chuẩn bị) Rate admission (B3)
- Hiện chỉ có `MC_MAX_IN_FLIGHT`. KHÔNG tự viết limiter theo thời gian khi chưa có số liệu PO. Trình bày: rủi ro chấp nhận cho pilot synthetic (có in-flight cap + xác thực ZITADEL bắt buộc) vs bắt buộc trước dữ liệu thật; thiết kế tối thiểu (per actor+tenant tại biên Go, đếm bằng bảng Postgres CAS, `X-Forwarded-For` chỉ tin từ proxy khai báo) để PO quyết.

## 4. Kiểm thử bắt buộc trên byte cuối

Chạy và lưu raw log + UTC + argv + cwd + exit + version tool:

1. Backend: `rtk make check` + suite PG đầy đủ với `MC_TEST_DATABASE_URL` trỏ container PG 18 mới (nhãn riêng, tên duy nhất, không dùng DB retained) + race. Báo số pass/fail/**skip** thật; mọi skip phải giải thích.
2. Frontend: `rtk pnpm check`, `pnpm build` (+ CSS guard), `pnpm build:worker`, `pnpm build-storybook`, vitest durable suite với PG.
3. `rtk proxy node --test ops/deploy/profiles.test.mjs` và test renderer mới.
4. E2E local: login synthetic (IdP fake hoặc ZITADEL dev đã có — không tạo credential mới) → Workspace → Matter → readback → upload/download → restart → recovery → logout; user A/B, cross-matter denial, idle/absolute expiry, refresh concurrency, role denial, storage down. Browser chỉ khi được cấp công cụ; nếu không thì ghi đúng giới hạn và chạy tầng HTTP.
5. Quét secret trên toàn bộ evidence trước bàn giao. Pin source (hash) trước/sau, kiểm tra drift cuối.

Không báo "xanh" cho thứ chưa chạy. Phân biệt: *đã suy luận đúng* / *đã kiểm tĩnh* / *đã chạy và xác minh*.

## 5. Bàn giao

Tạo/cập nhật:
- Task record `docs/implementation/tasks/MC-ZCODE-DEPLOY-READINESS-FINISH-20261030.md` (đã tạo khung; điền kết quả).
- Evidence `docs/testing/zcode-deploy-readiness-finish-20261030-r1/` (nếu tồn tại: attempt con `-r2`, không ghi đè): `return.md`, `findings-disposition.md` (WP-1..10 + B1..B9 + PI-01..04), `source-manifest.json`, `outputs-manifest.json`, log lệnh, `independent-review-packet.md` (pin bytes, danh sách case cho OpenCode; KHÔNG tự cấp PASS), `cloud-activation-packet.md`.
- `cloud-activation-packet.md` tách 3 mục: (1) READY_FOR_REVIEW (đã chạy local), (2) READY_FOR_SCOPED_CLOUD_AUTHORIZATION (lệnh/resource/IAM/origin/migration/secret-ref cụ thể + chi phí + rollback + negative/readback tests; liệt kê đúng input operator còn thiếu: Cloudflare account/Worker origin/R2 bucket; GCP project/registry/service accounts/invocation model; Supabase ref/hosts/CA/role secret refs; ZITADEL callbacks/API key secret ref), (3) VERIFIED_ON_PROVIDER (để trống tới khi chạy thật).
- Cập nhật `docs/ai-sdlc/project-status.md` bằng MỘT đoạn ngắn ở đầu (theo mẫu các đoạn "Latest update" hiện có).

Return cuối cần có: agent/tool thật + version, base/head + hash dirty tree, file đổi, kết quả AC từng WP, test chạy/không chạy (số thật), rủi ro còn lại, proposed status `LOCAL_CANDIDATE / IN_REVIEW_WITH_VERIFICATION_BLOCKERS`. KHÔNG ghi DONE / DEPLOYED / DEPLOY_READY / `$0` / production-ready. Kết thúc bằng skipped checks và remaining risk.

## 6. Quyết định PO còn mở (ZCode KHÔNG tự quyết; đưa vào packet kèm khuyến nghị)

| ID | Quyết định | Khuyến nghị của Solution Architect |
|---|---|---|
| D1 | Ingress backend: public + bearer ZITADEL (hiện tại) vs private/IAM | Giữ public + app-auth cho pilot synthetic; ghi bất đối xứng IAM (ADR-007 §6) |
| D2 | Diễn giải "$0" | Chấp nhận "cảnh báo trước khi tốn tiền", không phải "không thể tốn tiền" |
| D3 | Residency (ZITADEL AU, Workers edge, R2 APAC vs mục tiêu Singapore) | Pilot synthetic không cần; BẮT BUỘC chốt trước dữ liệu thật |
| D4 | B3 quota số | Chấp nhận rủi ro pilot; bắt buộc trước dữ liệu thật |
| D5 | B7 retention receipt | Giữ DISABLED tới khi có TB-06 |
| D6 | Adapter Worker: OpenNext 1.20.14 | Chấp nhận (đã có bằng chứng chạy), vinext chỉ build-only |
| D7 | Số workload (maxScale, concurrency, trần pending-import) | Dùng đề xuất WP-7 + ADR-007 §5 cho pilot, đo lại sau |
| D8 | Commit/branch phát hành | Cây 156 file dirty: PO/Codex quyết commit; release cần SHA sạch đã review |

## 7. Điều kiện hoàn thành task này

Xong khi: WP-1..9 có AC đạt (hoặc BLOCKED có lý do chính xác), test final-byte chạy và lưu, hai packet (review + cloud activation) sẵn sàng, và chỉ còn lại việc cần PO/operator/provider. Sau đó DỪNG ở một operator handoff cụ thể (liệt kê input cần điền + lệnh tiếp theo), không mở thêm vòng lập kế hoạch.
