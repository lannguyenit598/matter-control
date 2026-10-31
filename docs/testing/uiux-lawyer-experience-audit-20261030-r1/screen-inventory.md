# Screen inventory — 22/22 route có kết luận

Runtime: `127.0.0.1:3100` (Next 16.4.2 webpack dev, `API_MODE=demo`). Ảnh trong `screens/` (dev runtime của auditor). Vì demo mode không có data layer cho product features (UX-L-03), mọi route product render trạng thái fail-closed — đây chính là các hàng Loading/Empty/Unknown của Required State Specification (design-direction.md).

Ký hiệu trạng thái chụp: `V` = vi-light-1440 (mặc định), `E` = en-light-1440, `D` = en-dark-1440, `M` = 390×844, `T` = 834×1112 tablet (KHÔNG chạy — NOT_RUN), `1280` = laptop (KHÔNG chạy — NOT_RUN).

| # | Route | Mục đích (theo source) | Đã chụp | Kết luận rendered | Populated |
|---|---|---|---|---|---|
| 1 | `/login` | Sign-in entry (OIDC handoff) | V | Card "Sign in to your workspace" EN + tagline vi; nút dark primary; UX-L-02/04 | BLOCKED (UX-L-03) |
| 2 | `/my-actions` | Focused workbench (concept-3) | V,E,D,M +390 nav-open +390 settings-popover | Shell + ReadFailure trung thực; cấu trúc workbench xem source | BLOCKED; cấu trúc SOURCE_READ full (my-actions-view.tsx) |
| 3 | `/my-reviews` | Hàng đợi xác minh độc lập | V | H1 EN (UX-L-02) + ReadFailure | BLOCKED; review-queue.tsx SOURCE_READ |
| 4 | `/matters` | Danh sách hồ sơ | V,E | ReadFailure | BLOCKED |
| 5 | `/matters/[matterId]` | Matter overview (as-of, role badge, Add work, status brief) | V | ReadFailure, h1 null (UX-L-05) | BLOCKED; source confirms info-budget shape |
| 6–18 | matter subpages: agenda, control-room, data, documents, documents/[documentId], filings, filings/[filingId], filings/new, history, planning, reviews, work, work/[itemId] | Các khu vực chuyên môn + tabs | V từng route (13 ảnh) | Đều chỉ ReadFailure; h1 null; tabs mất; tab title generic EN | BLOCKED; source-level: action-entry pattern (không form permanence), WorkGrid min-w 56rem + overflow-x |
| 19 | `/requirements/[requirementId]` | Yêu cầu cross-matter detail | V | ReadFailure | BLOCKED |
| 20 | `/workspaces` | Workspace + tạo workspace | V | **H1 sai "Hồ sơ"** (UX-L-01) | BLOCKED |
| 21 | `/workspaces/[workspaceId]` | Workspace detail | V | ReadFailure | BLOCKED |
| 22 | `/` | redirect → /my-actions | (redirect, không chụp) | OK | n/a |

Storybook (`screens/storybook/`, port 6007, 58 stories): 13 capture đại diện; ≥3 crash TypeError (DashboardTemplate×3, Badge variants, Feedback&display); SearchPicker set render đúng; còn lại đã lưu, nhiều file là error page trắng do crash (ghi trong design-system-audit).

Prior author rendered artifacts trích làm `OBSERVED_STATIC` (provenance: author-run, không phải capture của audit này):
- `docs/testing/p0-final-parallel-20261028/claude-focused-workbench-r1/` — populated workbench journeys thật (ZITADEL Cloud, REST), 1280/390/320, dark; KHÔNG có screen-reader; completed-evidence journey NOT EXERCISED.
- `docs/testing/p0-final-parallel-20261028/local-creation-flow-20261029/` — creation flow SSO journey (cloud-synthetic-b).
- `docs/testing/codex-vietnamese-font-20261029-r1/` — 390px pre-login vi render; font bytes verification.
- `docs/testing/zcode-liquid-glass-20261030-r1/` — refraction probes (fixture-level).

NOT_RUN và lý do: tablet 834 (ngân sách thời gian, risk thấp — breakpoints đã đọc source), 1280×720 (1440 là chính), zoom 200%/reflow 320px (cần dữ liệu thật mới có ý nghĩa), keyboard-only/screen-reader (blocked bởi UX-L-03), dark theme cho 16 route Tier-2 (chụp 1 route đại diện dark — token set giống nhau, measure bằng script thay vì ảnh).
