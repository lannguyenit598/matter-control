# MC-ZCODE-P1-FIX-WAVE-20261031 — prompt cho actual ZCode (fix wave, session mới)

Soạn bởi actual ZCode (coordinator) 2026-10-31 theo plan `docs/implementation/plans/MC-COORDINATION-P0-CLOSURE-PLAN-20261031.md`. PO đã phê duyệt decision batch (DEC-20261031-01..04: commit/re-pin, D-9 purpose-typing, D-2 cookie locale, D-1(b)). Người thực hiện: **actual ZCode** (PO: "zcode thực hiện hết"). Chuyển nguyên văn từ mục 1.

## 1. Vai trò và ranh giới

Bạn là engineer full-stack của MatterControl, thực hiện **fix wave** đóng 3×P2 (Z-F-01..03) và các UX Blocker/Major (UX-L-01/02/04/05/06) trên candidate P0. Đọc trước: AGENTS.md gốc + `docs/implementation/workboard-findings.md` (register — nguồn chân lý) + plan điều phối + các evidence nguồn: `docs/testing/zcode-ba-flow-completeness-20261030-r1/r2/` (repro Z-F), `docs/testing/uiux-lawyer-experience-audit-20261030-r1/` (UX findings + probe recipe + tools/contrast.js).

Sửa được: apps/backend, apps/frontend, docs contracts/state-semantics (theo D-9), tests. KHÔNG: deploy/cloud/IdP, không push (commit cục bộ thôi), không đụng :3000/:8080/runtime agent khác, không đọc .env*/.dev.vars/ops/p0-local/secrets, không bypass Mimosa hook (nếu hook chặn commit → ghi BLOCKED + giữ staged/durable patch, KHÔNG bypass, báo coordinator), không mở positioning, không tự verify độc lập (OpenCode làm — bạn dừng ở IN_REVIEW).

Mỗi fix: **red test trước → fix → green → evidence**. Không refactor ngoài scope. Commit theo fix-unit (message tham chiếu ID finding).

## 2. Freeze & baseline (làm đầu tiên, thứ tự bắt buộc)

1. Freeze-verify: `find apps -mmin -60` phải rỗng và `git status --porcelain | wc -l` khớp con số workboard ghi (207 tại 16:45Z). Nếu có writer mới → STOP, báo coordinator.
2. Commit **baseline candidate** (1 commit, message: "P0 local candidate baseline @0de3e5d+dirty, known defects Z-F-01/02 + PI-01..04 pending verify — see workboard-findings.md"). Nếu Mimosa git-gate chặn: giữ staged + tạo durable patch `docs/testing/mc-p1-fix-wave-20261031-r1/baseline.patch`, ghi BLOCKED_COMMIT, tiếp tục fix trên working tree (review-delta = patch), báo coordinator.
3. Re-pin: cập nhật `source-manifest` (hash các file đổi) vào namespace của wave.

## 3. Các fix theo thứ tự (mỗi cái một commit/patch-unit)

**F1 — Z-F-01 + Z-F-02 (backend, D-9 đã duyệt):** đọc guard `package-criteria-required` + signature gate trong `apps/backend/internal/core/.../filing.go` (r2 đã định vị); thiết kế purpose-typing criterion: thêm phân loại purpose (PACKAGE / SIGNATURE / OUTCOME) vào criterion model + migration nếu cần (goose StatementBegin cho plpgsql; sqlc null-override cẩn thận); guard mới: PACKAGE_PREPARATION chỉ đếm criterion purpose=PACKAGE; submission proof-required chỉ nhận purpose=SIGNATURE đã thỏa (0 signature → chặn). Red tests: repro filing F của r2 (proof-required + chỉ OUTCOME criterion → chặn ở PACKAGE_PREPARATION; submission 0 chữ ký → chặn). Update `docs/requirements/state-semantics.md` + contract doc theo amendment D-9 (đánh dấu RATIFIED 2026-10-31). sqlc generate + migration 0011 reversible + EXPLAIN harness nếu đổi index.

**F2 — Z-F-03 (backend + FE):** expose `outcomeVerification` (NOT_DECLARED/PENDING/VERIFIED/…) trên grid + control-room read models; FE hiển thị per-axis, không aggregate che trục; test contract + unit FE.

**F3 — UX-L-01 + metadata (FE):** sửa `apps/frontend/src/app/(app)/workspaces/page.tsx:15,21` → "Workspaces/Không gian làm việc"; `generateMetadata` theo route cho param pages (dùng id khi chưa có tên).

**F4 — UX-L-02 locale cookie (FE, D-2 đã duyệt):** thiết kế 1 trang: cookie `ui-locale` server-readable trong RSC (Cache Components), localStorage làm mirror, `document.lang` sync, hydration không flip. Implement + **chạy lại probe timeline 22 route trên prod build** (recipe: uiux namespace 00-worklog.md) — AC: H1 vi ngay t=0; 0 màn kẹt EN; `lang` khớp text.

**F5 — UX-L-04/05 (FE):** ReadFailure context variant (breadcrumb + section name + giữ MatterTabs khi matter read riêng OK + H1) + localize toàn bộ bypass (~21 literal: danh sách trong uiux audit-findings + Agent A inventory: read-failure.tsx:79,93, error.tsx:27, proof-panel, document-forms, filing-forms, planning-view, rejection-details, search-picker…).

**F6 — Storybook (FE):** decorator mock next/navigation; sửa DashboardTemplate/Badge/Feedback stories; thêm GlassSurface stories (2 theme); `build-storybook` vào CI workflow.

**F7 — Gates toàn phần (bắt buộc trước khi return):** backend `make check` trên PG container NHÃN RIÊNG (mc-p1-fix-wave, xóa sau) + `-race`; frontend `pnpm check` + build + build:worker + build-storybook; **chạy lại chuỗi walkthrough r2** (gw01→gw02→gw03, DB sạch) chứng minh Z-F fix live; UX probe suite + tools/contrast.js; durable 14/14.

## 4. Outputs

Namespace `docs/testing/mc-p1-fix-wave-20261031-r1/`: return.md (agent thật, base/head từng commit, per-fix evidence, gates receipts, NOT_RUN), findings-update (state từng ID trong register), source-manifest, commands/. Task record mới `docs/implementation/tasks/MC-ZCODE-P1-FIX-WAVE-20261031.md` + 1 đoạn đầu project-status.md. Cập nhật `workboard-findings.md` state.

## 5. Điều kiện hoàn thành

Tất cả fix có red→green + receipts; gates exit 0; probe 22 route vi xanh trên prod build; walkthrough r2 chạy lại xanh (filing F giờ bị chặn đúng); register cập nhật FIXED_PENDING_VERIFY; KHÔNG tự đóng CLOSED_VERIFIED. Dừng — bàn giao OpenCode verify wave. Kết thúc bằng: checks bỏ qua + rủi ro còn lại.
