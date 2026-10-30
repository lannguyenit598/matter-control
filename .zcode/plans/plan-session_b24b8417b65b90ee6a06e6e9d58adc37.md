Thực hiện 2 workstream độc lập (không đụng chéo file): **A — resume Phase C Solid Glass** (theo handoff Codex 2026-10-30) và **B — fix các finding SQL review**. Không restart audit/research đã seal.

# Workstream A — Solid Glass Phase C (pilot → propagation → verification)

Căn cứ: plan đã lưu `docs/implementation/plans/MC-ZCODE-SOLID-GLASS-PLAN-20261029.md`, writer-handoff.md (Codex → ZCode, task-scoped), intake return (hiệu chỉnh bắt buộc: My Work = `features/work/components/my-actions-view.tsx` + `app/(app)/my-actions/page.tsx`, KHÔNG có `src/features/my-actions`; hook gắn vào DOM owner thật của native Dialog, không invented backdrop).

1. **Ghi nhận handoff** — append boundary-status record mới trong `docs/testing/zcode-solid-glass-20261029-r1/` (không sửa sealed audit); sửa erratum path trong plan (đánh dấu revision note).
2. **Baseline** — before-hash từng file sẽ đụng (globals.css, atoms button/input/textarea/select/badge, organisms sidebar/header/mobile-nav/form-dialog, layout, my-actions-view, my-actions page); chạy baseline test của các component đó; zero-drift check để tách delta của writer khác.
3. **Step 1 tokens (globals.css)** — thêm `--panel`, `--popover` (ladder α: panel < card < popover), `--glass-rim/-inner/-edge/-shade/-state*`, `--field*`, `--radius-control`, `--glass-blur*`; giá trị dark đặt trong block `[data-theme='dark']` hiện có (KHÔNG thêm class `.dark`); `@supports not (backdrop-filter…)` → opaque fallback; `@media (forced-colors: active)`. Giữ nguyên 100% token hiện có + Be Vietnam Pro + legal-state colors. Không import CSS upstream; mọi giá trị oklch viết lại trong token system nhà.
4. **Step 2 hooks** — thêm `data-slot` tường minh (button/input/textarea/select-trigger/badge + dialog panel trên element thật) vào các primitive CVA; một dòng mỗi chỗ, không khớp class substring.
5. **Step 3 surface mapping** — shell/sidebar → `--panel`; cards → card pane; dialog/menu → popover ladder + backdrop-filter CHỈ trên surface này; fields → field glass; vùng dense (queue, bảng, history) gần-opaque có cạnh finish (material absence có chủ ý).
6. **Pilot (plan §7)** — Button primary/secondary + Input + Select; vùng dense My Work (`my-actions-view.tsx`); dialog Create grid (qua FormDialog thật). Light+dark, 1440/390/320. Pass criteria: material thấy được và coherent; composition nhận ra; không overflow 320px; test/keyboard/focus xanh; status colors phân biệt được; fallback opaque xác minh. Fail → sửa ở token level hoặc dừng expansion.
7. **Propagation** — các family còn lại (work panels, creation forms, review surface — file của session này, control room, my-actions page); Work route/WorkFilters chỉ material-only sau khi check overlap với thay đổi search/density của feature owner (đã hoàn tất = completed inputs).
8. **Verification (plan §8)** — `pnpm typecheck && lint && format:check && agents:check` (ghi riêng fail Mimosa-state nếu còn), `pnpm test`, cả 2 build engine + CSS guard trong output private (không đụng `.next` đang chạy), Storybook stories, before/after screenshots (viewport/theme/EN/VI), `getBoundingClientRect` same-tier heights/hit areas, keyboard/focus walk, screen-reader NOT_RUN, perf spot mở/đóng overlay. AUTHOR_VERIFICATION — không tự nhận independent PASS.
9. **Post-implementation manifest/delta** vs pin Phase A; cập nhật task `MC-ZCODE-SOLID-GLASS-20261029.md` → IN_REVIEW; return cập nhật trong namespace solid-glass.

# Workstream B — Fix SQL review findings (task backend riêng, user chỉ định trực tiếp)

Phân loại theo đúng gating mà review đã đề ra (code-only làm ngay; schema change → EXPLAIN trước + proposal cho Codex/PO):

- **B1 code-only (F-07, F-08)**:
  - F-07: `filing_store.go:190-192` `SaveFiling` rows==0 → đổi `port.ErrNotFound` → `port.ErrVersionConflict` (đồng bộ 13 site còn lại; delta 404→412 ghi nhận — không có HTTP test nào khẳng định 404 cho path này); mirror `memory_filing.go:47-53`; thêm contract regression (repotest, memory+PG) khẳng định mapping CAS zero-rows đồng nhất.
  - F-08: `evidence_store.go:263` `InsertAssessment` SubjectEpoch → `int32Checked` (bỏ nolint); 3 raw cast còn lại có nolint + lý do bound rõ ràng → giữ nguyên (VersionNo/Position/clampLimit).
- **B2 EXPLAIN verification (F-02)** — chạy trên PG fixture mới có nhãn (port 519xx chưa dùng): seed memberships/matters ở scale (≥500 matters/users), capture `EXPLAIN (ANALYZE, BUFFERS)` cho 5 query (`ListMattersOfActor`, `ListAccessibleMatters`, `CountAccessibleMatters`, `ListMyWorkspaces`, `CountMyWorkspaces`) trước; `CREATE INDEX` đề xuất **trong test schema** rồi capture sau — bằng chứng lợi ích, không đụng schema thật.
- **B3 proposal migration 0009 (KHÔNG apply)** — soạn sẵn `0009_access_path_indexes.sql` (3 index: `matter_memberships(user_id, matter_id)`, `workspace_memberships(user_id, workspace_id)`, `matters(workspace_id, id)`; Down drop tương ứng; không đụng 0001-0008) + pg_trgm cho F-09 là mục OPTIONAL mặc định off → gửi Codex/PO duyệt như schema-change decision, kèm EXPLAIN evidence.
- **B4 ghi nhận, không code**: F-09 giữ strpos ở P0 (đánh giá của chính review; pg_trgm chỉ khi user base lớn — option trong B3); F-06 decision note 3 hướng (populate client_ip/request_id cần đụng HTTP layer + ~12 call sites; drop column cần migration; keep+document) — khuyến nghị keep + quyết định khi audit scope chốt; F-10 đã accept, không action; **A-01 để nguyên cho backend implementation owner (Codex) theo chỉ thị**.
- **B5 evidence** — namespace mới `docs/testing/zcode-sql-review-fixes-20261030-r1/`: red/green logs, EXPLAIN outputs, 0009 proposal, return.md, manifest. Gates: `make check` trên fixture mới (sqlc không đổi — không có query change trong scope apply).

# Ràng buộc chung

rtk prefix; Mimosa: SQL parameterized 100% (B không thêm SQL string nào — F-07/F-08 là Go-level, EXPLAIN dùng bind params); goose StatementBegin/End nếu có plpgsql (0009 không có); không sửa migration đã apply; không commit/push/merge/deploy; không đụng retained DB/runtime (API 3000, Next dev, IdP, PG); giữ toàn bộ dirty work + author attribution; A-01/A-02 không thuộc task này.

# Trình tự & trạng thái

A1–A2 → B1 (song song, khác file) → A3–A6 pilot → A7 propagation → B2–B3 evidence → A8–A9 verification/manifest. Kết: Workstream A = IN_REVIEW (author verification, rendered evidence); Workstream B = code fixes green + evidence + proposals chờ duyệt. Không có DONE/independent PASS nào tự nhận.