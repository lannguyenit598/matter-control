# MC-ZCODE-P1-FIX-WAVE-2-20261101 — prompt cho session ZCode mới (sửa findings leg-2 của OpenCode)

Soạn bởi actual ZCode (coordinator) 2026-11-01. Người thực hiện: session ZCode mới. Khuyến nghị dispatch: **NGAY** — fix-wave #1 đã đóng, không writer nào giữ apps/**; đây là đường găng cho CẢ HAI goal (2×P1). Chuyển nguyên văn từ mục 1.

## 1. Vai trò và ranh giới

Bạn sửa các finding do OpenCode leg-2 phát hiện trên `72266cb`/`dac4262`. Đọc trước: `docs/testing/opencode-verify-wave-20261031-r1/return.md` + `r8-release-preflight-plant.md` + `mc-p1-fix-wave-20261031-r1/f1-structural-prereview-opencode.md` + register `docs/implementation/workboard-findings.md`. KHÔNG: đụng verify-wave namespace, :3000/:8080/container QA OpenCode (`mc-opencode-verify-20261031` — giữ cho re-run), secrets; push; bypass Mimosa (chặn → playbook B3, PO commit). Commit theo fix-unit, red→green bắt buộc, lệnh prefix `rtk`. Browser: có IAB nếu cần verify UI (OV-F1-01 nên chứng minh bằng browser sau fix).

## 2. Việc theo thứ tự ưu tiên (mỗi cái một commit-unit)

**G1 — OV-F1-01 (P1, mở khoá nộp filing proof-required qua UI):** `apps/frontend/src/features/work/schemas.ts` L98/L231 thêm `SIGNATURE` vào zod `purpose` enum; `checklistSchema` thêm part `signature`; `proof-panel.tsx` L297/321/624 bỏ lọc/ẩn SIGNATURE (hiện row, cho tạo/thay thế criterion purpose=signature); form gửi đủ 3 purpose; filters/selector hỗ trợ. **Red test**: checklist có SIGNATURE row phải parse OK + submission proof-required đủ chữ ký phải đi qua. **Gate: browser smoke qua walkthrough env (IAB) — nộp filing proof-required từ UI thành công.**

**G2 — OV-R8-01 (P1, release gate content-blind):** `apps/frontend/scripts/release-preflight.mjs` `main()` 2 callback trả object thay vì content string → sửa callback trả string (hoặc probeFactory nhận reader); thêm **integration test gọi `main()` thật** với planted sentinel/PEM trong file tên thường (kỳ vọng exit≠0 + finding) và `.env.local` plant (kỳ vọng finding, không crash); giữ unit cũ.

**G3 — OV-F1-02 (P2):** `brief_proof.go purposeOf` replay map SIGNATURE→PACKAGE — sửa mapping theo D-9 (SIGNATURE giữ SIGNATURE); test replay.

**G4 — OV-F1-03 (P2):** migration `0011` Down fail 23514 khi còn row SIGNATURE — quyết định: Down xoá rows phụ thuộc trước (data migration thứ tự đúng) HOặc document "Down chỉ chạy khi không còn SIGNATURE rows" + guard; test Up/Down sạch (OV-F1-04 cũng đòi test này).

**G5 — OV-R12-01 (P2):** `ops/backup/scheduled-dump.sh` L51 prune quoted → `while-read`/mapfile + đếm rm thật; contract keep-N; red test: 4 cũ + 1 mới → còn đúng N; empty dir → `pruned:0`.

**G6 — OV-F1-04 (P3):** refusal message nêu CẢ package + signature khi vi phạm đồng thời (dùng copy của OpenDesign `ux-copy-for-guards.md` — gộp 1 thông điệp); nếu gate áp cả StageResponse không đúng D-9 → siết scope guard; test 0011 Up/Down (gộp G4).

**G7 — F8 (P-09 aria-live, relay từ OpenDesign):** shell-level polite live-region announce kết quả hành động (work-grid/planning đã có, thêm kênh shell) — dùng copy chuẩn OpenDesign; SR smoke.

## 3. Gates & outputs

Full gates như fix-wave #1 (make check PG+race container nhãn riêng, vitest, builds, storybook; browser smoke G1). Namespace `docs/testing/mc-p1-fix-wave-2-20261101-r1/`: return.md + per-unit receipts + findings-update (state → FIXED_PENDING_VERIFY). Nếu Mimosa chặn commit → playbook B3 (báo coordinator, PO commit). KHÔNG đụng verify-wave namespace; container QA OpenCode để nguyên.

## 4. Hoàn thành

7 fix-unit red→green + gates + browser smoke G1; register cập nhật; dừng ở IN_REVIEW — OpenCode re-run R8 probe / R12 multi-stale / F1 red-green + proof-parse probe (container đã giữ).
