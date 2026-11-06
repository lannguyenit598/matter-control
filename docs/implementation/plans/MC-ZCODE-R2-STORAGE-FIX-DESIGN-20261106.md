# Design — R2 File Storage Fix (MC-ZCODE-R2-STORAGE-FIX-DESIGN-20261106)

- **Status**: IMPLEMENTED (PO duyệt design + lệnh "Triển khai ngay" 2026-11-06) — AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW, uncommitted trên `zcode/r2-storage-fix-20261106` từ `develop@41098a4d`; gates xanh (task record: `docs/implementation/tasks/MC-ZCODE-R2-STORAGE-FIX-20261106.md`)
- **Origin**: audit 2 vòng tầng lưu trữ file (r2 adapter + manifests + BFF), base `develop@41098a4d`; findings D-01..D-08 ghi trong memory `mc-r2-storage-audit-20261106`
- **Design facilitator**: ZCode · **PO**: chọn scope/executor/approach qua AskUserQuestion từng bước
- **Scope chốt**: đóng gate B3 (provision R2 thật + real-bucket test) + fix 2 P2 (D-01 OOM risk, D-02 transfer window) bằng config/manifest — **0 dòng Go**

## 1. Understanding Summary

- **What**: (1) guide PO tự provision bucket R2 private + token bucket-scoped + chạy `TestContract_R2_RealBucket` để đóng B3; (2) chỉnh sizing/timeout trên Cloud Run + compute-engine manifests và 3 một-dòng timeout BFF FE.
- **Why**: toàn bộ bằng chứng R2 hiện là fake-S3/static (B3 unchecked); D-01: 512Mi × 10 concurrency × 25MiB buffer ≈ 250MiB → OOM khả thi giữa chuyền; D-02: cửa sổ transfer 60s đòi ≥3.4 Mbps cho 25MiB — mạng VN yếu fail đều.
- **Who**: PO (dashboard Cloudflare + chạy test) · ZCode (design + implementation sau khi được lệnh).
- **Constraints**: giữ kiến trúc proxy-qua-backend (không presigned/CORS); target $0 (free tier); 25MiB ceiling theo ADR-006; secrets không vào repo; không đụng ZITADEL/Supabase; validate manifest ở dạng rendered.
- **Non-goals**: GC orphan (D-04), retention/lifecycle (D-05), residency (D-07), multipart upload, mọi thay đổi Go code, deploy thật.
- **Nền đã xác minh trong code**: R2 adapter chuẩn (checksum riêng cho R2, verify-digest-at-EOF, abort connection khi corrupt — `objectstore/r2.go`); error mapping 413/503 chuẩn (`problems.go:116,122`); fs bị cấm trên Cloud Run (`config/product.go:146`); BFF stream không buffer (`lib/mc/client.ts:103-104`).

## 2. Assumptions (PO xác nhận)

| Hạng mục | Assumption |
|---|---|
| Upload ceiling | 25MiB đã duyệt theo ADR-006 ("near-25 MiB uploads" là gate) — chỉ chỉnh timeout/concurrency quanh nó |
| Scale pilot | Vài người dùng → 4 chuyển đồng thời là dư; không cần multipart |
| Chi phí | Concurrency 4 + 512Mi giữ ở sâu trong free tier Cloud Run; orphan tích lũy billed $0.015/GB-tháng — chấp nhận được đến khi PO quyết D-04 |
| Bảo mật | Token R2 Object Read & Write, scope 1 bucket (R2 không tách được quyền delete khỏi Write — ghi nhận, không phải lỗi design) |

## 3. Decision Log

| # | Quyết định | Alternatives | Lý do |
|---|---|---|---|
| 1 | Scope = B3 + P2 fixes; D-04/05/07 → PO decisions | Full hardening (GC + retention + multipart); ops-only | Đủ cho pilot, YAGNI ruthlessly |
| 2 | PO tự làm cloud theo guide | Giao Codex | Pattern Phase 0 đã chạy tốt ([[mc-pilot-deploy-readiness-20261103]]) |
| 3 | `containerConcurrency` 4, giữ 512Mi | 1Gi × concurrency 10; multipart streaming code | Worst case 100MiB buffer ~20% memory; free tier; 0 code |
| 4 | Chuỗi timeout **BFF 330s ≥ platform 330s ≥ backend 300s** | Giữ 60s + ghi chú băng thông; split timeout per-route | Một giá trị phủ mọi transfer 25MiB @ ≥0.7 Mbps; không đụng Go |
| 5 | BFF sửa cả 3 route transfer (upload/download/export) | Chỉ upload | Cùng cửa sổ 25MiB; đã verify cả 3 hardcode `120_000` |
| 6 | compute-engine `cloud-init.yaml` parity | Chỉ Cloud Run | Portability runbook coi 2 profile tương đương; VM chỉ có in-flight limiter làm chốt |
| 7 | B3 = contract test real bucket (không thêm smoke API riêng) | Boot mcapi + upload qua API | Checklist B3 mô tả đúng test này; 1 lệnh, cleanup đơn giản |

## 4. Final Design

### 4.1 Change set (branch `zcode/r2-storage-fix-20261106`, base `develop@41098a4d`)

**Backend manifests (2 file, không đổi Go):**

| File:line | Giá trị cũ → mới |
|---|---|
| `ops/deploy/cloud-run/service.yaml:30` | `containerConcurrency: 10` → `4` (comment dòng 29 cập nhật: 4 × 25 MiB = 100 MiB) |
| `ops/deploy/cloud-run/service.yaml:32` | `timeoutSeconds: 75` → `330` (≥ transfer + margin) |
| `ops/deploy/cloud-run/service.yaml:54` | `MC_TRANSFER_TIMEOUT: 60s` → `300s` |
| `ops/deploy/cloud-run/service.yaml:55` | `MC_MAX_IN_FLIGHT: '10'` → `'4'` |
| `ops/deploy/compute-engine/cloud-init.yaml:25` | `MC_TRANSFER_TIMEOUT=60s` → `300s` |
| `ops/deploy/compute-engine/cloud-init.yaml:26` | `MC_MAX_IN_FLIGHT=10` → `4` |

**Frontend BFF (3 file, mỗi file 1 số; thuộc assignment P0 BE+FE của ZCode):**

| File | `timeoutMs` |
|---|---|
| `apps/frontend/src/app/api/matters/[matterId]/documents/[documentId]/versions/route.ts` | `120_000` → `330_000` |
| `apps/frontend/src/app/api/matters/[matterId]/documents/[documentId]/versions/[versionId]/content/route.ts` | `120_000` → `330_000` |
| `apps/frontend/src/app/api/matters/[matterId]/export/route.ts` | `120_000` → `330_000` |

Route JSON khác giữ default `API_TIMEOUT_MS` 10s (payload nhỏ — không đụng).

### 4.2 Guide mới `docs/deployment/r2-provision-and-b3.md` (PO tự chạy, dashboard)

1. **Tạo bucket**: R2 → Create bucket (gợi ý tên `mc-pilot-docs`), private mặc định, **không** bật `r2.dev`/public domain (checklist B68-69). R2 không có jurisdiction APAC → để mặc định, residency vào bảng PO decisions (4.4).
2. **Tạo token**: R2 → Manage R2 API Tokens → Object Read & Write, scope đúng bucket trên. Lưu Key ID/Secret vào Secret Manager khi deploy / ops secrets 0600 local. Không repo, không prompt, không log.
3. **Chạy real-bucket test (đóng B3)**:
   ```bash
   export MC_TEST_R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
   export MC_TEST_R2_BUCKET=mc-pilot-docs
   export MC_TEST_R2_ACCESS_KEY_ID=... MC_TEST_R2_SECRET_ACCESS_KEY=...
   cd apps/backend && go test ./internal/adapter/outbound/objectstore/ -run TestContract_R2_RealBucket -v
   ```
   PASS → record evidence (tool/version, timestamp, exit code, output location) → cleanup object test tạo → tick B3 + B68-69 trong `free-phase-deploy-checklist.md`.
4. **Điền values**: `cloud-run.values.json` thêm `R2_ENDPOINT`/`R2_BUCKET`/2 secret names → render `node ops/deploy/profiles.mjs cloud-run ...` → validate **YAML rendered form** (gotcha `{{VAR}}`), grep 4 giá trị mới của 4.1.
5. Cập nhật `docs/ai-sdlc/project-status.md` (coordinator-only) sau khi B3 có evidence.

### 4.3 Verification (khi implement)

- Backend: `make check` (không đổi Go — chứng minh no-drift, cả PG + race như thường lệ)
- FE: vitest (routes test), `tsc --noEmit`, build
- Manifest: render + validate YAML rendered + grep đúng 6 giá trị 4.1
- B3 = real-bucket test PO chạy; evidence gắn vào guide
- **NOT_RUN**: deploy thật Cloud Run/Workers; load-test 4-concurrent uploads; verify billing $0; browser download end-to-end

### 4.4 Bảng PO decisions (đính kèm guide, trạng thái PROPOSED)

| ID | Vấn đề | Đề nghị | Chờ |
|---|---|---|---|
| D-04 | Orphan object (Put OK, AddVersion fail) tích lũy không GC | Defer; sweep reconciliation khi có tín hiệu chi phí | PO |
| D-05 | Không lifecycle/retention cho bucket; token R2 không tách được delete | Quyết khi có yêu cầu pháp lý cụ thể (NĐ 333 log retention là mảng khác) | PO |
| D-07 | R2 không chứng minh SG residency | Đánh giá theo NĐ 13/2023 khi lên sản phẩm thật; jurisdiction endpoint chỉ có EU/FE | PO |

## 5. Rủi ro còn lại

- Concurrency 4 là ceiling mọi request (không riêng upload) — nếu pilot cần nhiều hơn, nâng kèm memory (quyết riêng, không tự nâng)
- `timeoutSeconds: 330` giữ request lâu trên platform — free tier vẫn thoải mái, theo dõi khi có traffic thật
- B3 phụ thuộc PO có sẵn quyền dashboard + payment method đã duyệt (checklist:39 — đã tick)
