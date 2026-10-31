# MC-UIUX-LAWYER-EXPERIENCE-AUDIT-AND-PLAN-20261030 — prompt cho agent đóng vai chuyên gia UI/UX

Soạn bởi actual Claude Code (Solution Architect), 2026-10-30, theo yêu cầu trực tiếp của PO: "với kinh nghiệm của một chuyên gia UI/UX đánh giá lại toàn bộ UI/UX và lên plan hoàn thiện project (UI/UX dành cho luật sư), chạy song song với 2 prompt kia". Handoff thủ công, chưa dispatch.

**Người thực hiện đề xuất:** OpenDesign (chủ sở hữu UI/UX theo AGENTS.md); nếu không dùng được thì Antigravity (frontend owner). **Không giao cho ZCode** vì ZCode đang giữ hai assignment song song (deploy readiness, BA review). Chuyển nguyên văn từ mục 1 trở xuống.

---

## 1. Vai trò và ranh giới

Bạn là **chuyên gia UI/UX cao cấp, chuyên sản phẩm cho luật sư** (legal-tech: matter management, due diligence, closing checklist, e-discovery workbench). Việc của bạn: **đánh giá lại toàn bộ UI/UX hiện có** của MatterControl bằng mắt người dùng là luật sư, rồi **lập plan hoàn thiện** có thứ tự ưu tiên, đo được và khả thi với kiến trúc hiện tại.

- **Chỉ đánh giá + lập plan. KHÔNG sửa source/test/CSS/token**, không commit/push/merge/reset/stash/clean/restore, không deploy, không đổi cloud/IdP, không dùng secret thật, không đọc `.env*`/`.dev.vars`/key. Chỉ ghi vào namespace evidence mới (mục 8). Prototype/mockup nếu làm thì là file tĩnh nằm trong namespace evidence, không đụng `apps/frontend`.
- Không đổi nghiệp vụ đã duyệt: năm trục trạng thái độc lập, OWNER/EDITOR/VIEWER, "receipt ≠ approval", "completed ≠ verified", `OUTCOME_UNKNOWN`, CAS/revision, hidden-not-found. UI/UX được phép đổi **thứ tự ưu tiên thông tin, bố cục, nhãn, luồng thao tác**; không được hứa giao diện hiển thị điều backend chưa có (đánh dấu `NEEDS_READ_MODEL`).
- Không mở lại định vị (Discovery closed; vertical đầu: Transactions & Corporate Legal Work). Đề xuất vượt P0/P1/P2 đã duyệt → `RECOMMENDATION_NEEDS_PO`. Không đề xuất billing, time-tracking, chatbot, e-sign/e-filing, AI intake, draft-Matter lifecycle, template engine như một phần plan chính (đã bị loại khỏi redesign hiện tại; chỉ liệt kê ở phần "ngoài phạm vi" nếu thấy cần).
- Tuân thủ: đọc `AGENTS.md` gốc + `apps/frontend/AGENTS.md` (Next.js 16 khác bản bạn biết — đọc `node_modules/next/dist/docs/` khi cần giải thích giới hạn kỹ thuật); mọi lệnh shell prefix `rtk`; tìm code bằng Semble trước; dữ liệu synthetic; không mạo danh reviewer khác; không đọc/tiết lộ credential.

## 2. Chạy song song an toàn với hai assignment khác

Đang chạy cùng lúc (ZCode): `MC-ZCODE-DEPLOY-READINESS-FINISH-20261030` (có sửa source `apps/backend`, `ops/`, `.github/`, một ít `apps/frontend`) và `MC-ZCODE-BA-FLOW-COMPLETENESS-REVIEW-20261030` (read-only, dùng runtime local).

- **Source đang có thể thay đổi dưới chân bạn.** Pin HEAD + hash các file frontend bạn đọc ngay đầu và cuối; nếu đổi, ghi delta, không rollback, không kết luận trên bản cũ mà không nói rõ.
- **Không dùng chung tài nguyên chạy:** KHÔNG dừng/chiếm `localhost:3000` (runtime của Codex), ZITADEL `mc-p0-idp`, hay DB đang chạy của người khác. Chạy frontend của bạn ở **cổng riêng (ví dụ 3100+)**, dùng container PG mới có nhãn riêng nếu cần REST mode; hoặc dùng `API_MODE=demo` (in-memory) cho khảo sát bố cục và trạng thái. Nếu cần đăng nhập ZITADEL thật mà thiếu credential synthetic được cấp → ghi `BLOCKED` đúng hành động, dùng demo mode/Storybook và nói rõ giới hạn.
- **Không ghi vào namespace của hai assignment kia.** Ghi vào namespace riêng ở mục 8. Hai assignment kia có thể tạo finding trùng chủ đề: bạn đọc `docs/testing/zcode-ba-flow-completeness-20261030-r1/` **nếu đã tồn tại** để tham chiếu chéo, không chờ nó.

## 3. Đầu vào bắt buộc

- Sản phẩm/nghiệp vụ: `docs/product/{jtbd,user-journeys,three-golden-workflows}.md`, `docs/requirements/{state-semantics,permission-matrix,golden-workflow-acceptance,acceptance-criteria}.md` (đoạn UX: AC-109..120, AC-137, AC-144, AC-161..163).
- Thiết kế đã có: `docs/design/legal-team-experience-20261029/` (`business-analysis.md`, `design-direction.md`, `product-design-brief.md`, `concepts/`, `platform-research.md`, `legalwork-feature-inventory.md`), `docs/design/action-entry-ux-20261029/`, `docs/design/creation-flow-ux-r1/`, `docs/design/liquid-form-legibility-20261030/`, `docs/implementation/tasks/MC-P0-UX-FOCUSED-WORKBENCH.md`, `MC-P0-CODEX-UI-FIDELITY-20261029.md`, `MC-P0-CREATION-FLOW-UX-20261029.md`, `MC-P0-READABLE-IDENTITY-UX-20261028.md`.
- Bằng chứng UI đã có: `docs/testing/p0-final-parallel-20261028/` (focused-workbench, creation-flow, readable-ux), `docs/testing/codex-liquid-main-20261030-r1/`, `codex-dark-glass-20261030-r1/`, `codex-system-solid-glass-intake-20261030-r1/`, `zcode-liquid-glass-20261030-r1/`, `codex-vietnamese-font-20261029-r1/`. Các thay đổi này phần lớn là **author-verified**, chưa có rendered/browser/accessibility acceptance độc lập; không coi là đã đạt.
- Design system: `apps/frontend/src/components/**` (atoms/molecules/organisms/templates), `src/app/globals.css`, `src/config/navigation.tsx`, Storybook (`pnpm build-storybook`, `storybook-static/`), `docs/ai/rules/*`, skill vendored `ui-ux-pro-max`, `web-design-guidelines` (advisory; khi mâu thuẫn thì `docs/ai/rules/` thắng).
- Cổng đầu vào cố định cho persona: Transaction Owner, Contributor, Reviewer, Manager/Viewer (xem `business-analysis.md` §2) — cộng hai bối cảnh sử dụng **legal của quỹ đầu tư (in-house)** và **legal của law firm**, như mô tả trong `docs/implementation/plans/MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030.md` nếu file đã tồn tại (nếu chưa, dùng giả định: người dùng luật sư làm việc căng, đọc nhiều, ra quyết định có hậu quả, không chịu được màn hình "đoán").

## 4. Phạm vi đánh giá

Toàn bộ 22 route trong `apps/frontend/src/app` (login, my-actions, my-reviews, workspaces/*, matters/*, requirements/[id], và mọi trang con của matter: agenda, control-room, data, documents(+detail), filings(+new,+detail), history, planning, reviews, work(+detail)), cộng dialog, form, bảng/grid, trạng thái rỗng/lỗi/tải, điều hướng toàn cục, chuyển ngôn ngữ/múi giờ.

Phủ **đủ các trục** sau cho mọi màn hình:
- **Theme:** sáng / tối / Liquid-Glass / solid-glass (nếu có) — kiểm độ tương phản thật.
- **Viewport:** desktop 1440×900 (chính), laptop 1280×720, tablet 834×1112, mobile 390×844 (đọc/duyệt/cập nhật đơn giản; grid dày desktop-first).
- **Vai trò:** OWNER, EDITOR, VIEWER, non-member (nơi có thể quan sát).
- **Trạng thái dữ liệu:** rỗng, 1 bản ghi, nhiều bản ghi (≥200, nhiều ký tự tiếng Việt dài, tên matter/entity dài, tên có dấu), lỗi mạng, stale conflict, `OUTCOME_UNKNOWN`, đang tải.
- **Ngôn ngữ:** vi và en; font tiếng Việt (dấu, độ cao dòng); ngày/giờ theo múi giờ client.

## 5. Phương pháp (làm theo thứ tự)

**Bước A — Chụp hiện trạng có hệ thống.** Với mỗi route × theme × viewport chính, chụp ảnh thật (hoặc ghi giới hạn nếu không có công cụ trình duyệt; khi đó dùng Storybook + DOM/CSS tĩnh và ghi `NOT_RENDERED`). Lưu vào `screens/` kèm tên chuẩn `route__theme__viewport__role.png`. Không chụp dữ liệu thật; không để lộ token/ID nhạy cảm.

**Bước B — Đánh giá chuyên gia.** Với mỗi màn hình đánh giá có bằng chứng:
1. *Heuristics (Nielsen 10)* + *tiêu chí riêng cho luật sư*: tin cậy và nguồn gốc dữ liệu (as-of, provenance, ai/khi nào), không "thành công giả", tách rõ Requirement vs Action và các trục trạng thái, mật độ thông tin hợp lý cho người đọc nhiều, khả năng quét nhanh trong ~10 giây, ngôn ngữ nghiệp vụ thay vì thuật ngữ kỹ thuật/ID thô/UTC.
2. *Information architecture:* hai đích toàn cục My Work / Matters có thực sự dẫn dắt? Điều hướng trong matter (quá nhiều tab?), breadcrumb, quay lại giữ bộ lọc/selection, deep link.
3. *Interaction:* một hành động chính rõ ràng mỗi ngữ cảnh? Dialog vs route? Xác nhận cho hành động không hoàn tác; xử lý lỗi/stale/unknown dễ hiểu; giữ draft; phím tắt/bàn phím cho grid dày; chọn hàng, bulk, inline edit; undo hợp lý.
4. *Hình ảnh & chữ:* hệ thống phân cấp, khoảng cách, màu và ý nghĩa màu (không chỉ dựa màu), mật độ bảng, độ dễ đọc đoạn văn pháp lý/tên dài, truncation thông minh (hiển thị đầy đủ khi cần), Liquid Glass có làm giảm độ đọc không.
5. *Khả năng tiếp cận (WCAG 2.2 AA tối thiểu):* tương phản chữ/viền/trạng thái focus, thứ tự tab, focus trap dialog, nhãn form, thông báo lỗi, `aria-live` cho kết quả hành động, kích thước vùng chạm, giảm chuyển động, zoom 200%/reflow 320 px, đọc bằng screen reader ở các luồng chính (nếu có công cụ; nếu không ghi `NOT_RUN`).
6. *Hiệu năng cảm nhận:* skeleton/loading, layout shift, độ trễ sau hành động, phản hồi tức thì (optimistic không được gây "thành công giả").
7. *Nhất quán design system:* component dùng đúng chưa, biến thể trùng, token màu/khoảng cách bị hard-code, Storybook phủ tới đâu, trạng thái hover/focus/disabled/error có đủ không.
8. *Tiếng Việt/i18n:* nhãn, độ dài chuỗi, ngắt dòng, định dạng ngày/số, locale toggle, thuật ngữ pháp lý nhất quán (lập bảng thuật ngữ đề xuất vi/en cho các khái niệm lõi: Matter, Requirement, Action, Evidence, Verification, Filing, Waiting On…).

**Bước C — Walk-through theo nhiệm vụ của luật sư** (đo bằng số bước/số click/thời gian ước lượng, ghi ngõ cụt): (1) Sáng mở ứng dụng: biết việc cần làm và vì sao trong ≤10 giây; (2) Vào một Matter: hiểu tình trạng, blocker, ai cần hành động; (3) Thực hiện một Action và nộp evidence; (4) Reviewer xét một evidence theo đúng version; (5) Theo dõi ký tên từng phần; (6) Theo dõi một filing đến kết quả; (7) Review due diligence trên review grid; (8) Soạn status brief gửi quản lý/khách; (9) Import checklist từ Excel; (10) Khôi phục sau lỗi/`OUTCOME_UNKNOWN`/stale. Dùng dữ liệu Atlas synthetic; nếu không có runtime thì dựa trên Storybook/demo mode và ghi giới hạn.

**Bước D — Đối chiếu design-direction đã chọn** với hiện trạng: các ràng buộc trong `design-direction.md` ("Default information budget": hai đích toàn cục, My Work một hàng đợi chủ động, mỗi dòng ≤1 cue ưu tiên, Matter Overview một câu sự thật + vài blocker, không % hoàn thành tự bịa, không hiển thị metadata chưa tồn tại) đã được thực hiện đúng chưa? Chỗ nào lệch, chỗ nào direction đó chưa đủ cho luật sư? Đừng bác bỏ direction đã duyệt nếu không có bằng chứng; đề xuất điều chỉnh có lý do.

**Bước E — Plan hoàn thiện** (mục 6).

## 6. Plan hoàn thiện (đầu ra chính)

`improvement-plan.md` gồm:
1. **Tóm tắt điều hành** (≤1 trang): điểm mạnh giữ lại, 5 vấn đề lớn nhất, tác động với luật sư, kết luận mức "sẵn sàng thử nghiệm với luật sư thật".
2. **Backlog ưu tiên**: mỗi mục có `id`, màn hình/flow, vấn đề (bằng chứng), thay đổi đề xuất, persona hưởng lợi, mức độ (**Blocker** = sai/gây hiểu lầm nghiệp vụ hoặc không dùng được bằng bàn phím/AT; **Major** = làm chậm/nhầm đáng kể; **Minor**; **Polish**), công sức (S ≤½ ngày, M 1–3 ngày, L 1–2 tuần, XL >2 tuần), phụ thuộc (`NEEDS_READ_MODEL` / `NEEDS_API` / `NEEDS_PO` / none), tiêu chí chấp nhận quan sát được, cách kiểm thử.
3. **Công việc design system**: token (màu, tương phản, khoảng cách, chữ), component thiếu/thừa, quy tắc dùng Liquid Glass (khi nào dùng/khi nào solid), pattern chuẩn cho: bảng dày + chọn hàng, panel chi tiết, dialog hành động, kết quả hành động (thành công/từ chối/stale/unknown), trạng thái rỗng, nhãn trạng thái đa trục.
4. **Lộ trình theo pha** với cổng ra rõ ràng: Pha 0 sửa Blocker + a11y nền; Pha 1 làm trơn các luồng Golden Workflow (GW-01/02/03) cho luật sư; Pha 2 mật độ/tốc độ cho người dùng thường xuyên (phím tắt, bulk, saved views nếu thuộc baseline); Pha 3 hoàn thiện (responsive, polish, i18n sâu). Mỗi pha: mục tiêu, danh sách mục backlog, định nghĩa xong (DoD), cách xác minh độc lập.
5. **Kế hoạch kiểm chứng với luật sư thật**: giả thuyết cần kiểm, tuyển 5–8 người/persona (in-house quỹ đầu tư, law firm associate/paralegal/partner), kịch bản nhiệm vụ trên dữ liệu synthetic, chỉ số (tỷ lệ hoàn thành nhiệm vụ, thời gian, lỗi, SUS/SEQ, "biết việc kế tiếp trong 10 giây"), ngưỡng đạt, cách xử lý bảo mật (không dữ liệu thật).
6. **Chỉ số thành công** và cách đo trong sản phẩm hiện tại (không thêm theo dõi người dùng nếu chưa được duyệt).
7. **Rủi ro & quyết định cần PO** (ví dụ mật độ vs thoáng, Liquid Glass vs độ đọc, mobile phạm vi, thuật ngữ tiếng Việt), kèm khuyến nghị.
8. **Ngoài phạm vi / không làm** và lý do.

## 7. Quy tắc bằng chứng và phân loại

Mỗi phát hiện: `id`, `screen/route`, `viewport/theme/role/state`, mô tả, **bằng chứng** (ảnh trong `screens/`, file:line, kết quả đo tương phản, số bước), `heuristic/WCAG/AC` liên quan, mức độ (Blocker/Major/Minor/Polish), `class` ∈ {OBSERVED_RENDERED, OBSERVED_STATIC (Storybook/DOM), SOURCE_READ, NOT_VERIFIED}. Phân biệt rõ cái đã nhìn thấy thật và cái suy từ source. Đo tương phản bằng công thức WCAG trên màu thực tính toán (kể cả nền kính mờ), ghi cặp màu và tỉ lệ; không ước lượng bằng mắt. Không suy diễn hành vi; không rõ thì `NOT_VERIFIED`. Lưu cả lần thử thất bại. Quét secret/PII trong evidence trước khi bàn giao.

## 8. Đầu ra

Namespace `docs/testing/uiux-lawyer-experience-audit-20261030-r1/` (nếu tồn tại: attempt con `-r2`, không ghi đè):
- `improvement-plan.md` (mục 6) — **sản phẩm chính**.
- `audit-findings.md` + `audit-findings.json`.
- `screen-inventory.md` (route → vai trò → mục đích → trạng thái đã chụp / chưa chụp) + `screens/`.
- `task-walkthroughs.md` (10 nhiệm vụ mục 5C, số bước, ngõ cụt).
- `accessibility-report.md` (WCAG 2.2 AA theo màn hình/tiêu chí, kết quả đo tương phản, kiểm bàn phím).
- `design-system-audit.md` (nhất quán, token, Storybook coverage).
- `terminology-glossary-vi-en.md` (đề xuất thuật ngữ lõi).
- `usability-test-plan.md` (kế hoạch kiểm chứng với luật sư).
- `source-manifest.json` (HEAD, hash file đọc, dirty snapshot trước/sau), `commands/` (argv, cwd, UTC, exit, version công cụ), `return.md`.
- Task record `docs/implementation/tasks/MC-UIUX-LAWYER-EXPERIENCE-AUDIT-AND-PLAN-20261030.md` (đã tạo khung — điền kết quả); thêm MỘT đoạn ngắn ở đầu `docs/ai-sdlc/project-status.md`.

`return.md` nêu: agent/tool/version thật, base/head + dirty hash, route nào chụp thật vs chỉ đọc source, số finding theo mức độ, các phần NOT_RUN và lý do, ảnh hưởng của source thay đổi song song (nếu có), tuyên bố rõ: đây là đánh giá chuyên gia **chưa kiểm chứng với người dùng thật**, không phải acceptance, không phải PASS độc lập. Đề xuất trạng thái: `UX_AUDIT_RETURNED / IN_REVIEW`. Kết thúc bằng checks bị bỏ qua và rủi ro còn lại.

## 9. Điều kiện hoàn thành

Xong khi: mọi route trong 22 route có kết luận (chụp thật hoặc `NOT_VERIFIED` kèm lý do), 10 nhiệm vụ luật sư được walk-through, báo cáo a11y có số đo thật, design-direction đã được đối chiếu, `improvement-plan.md` có backlog ưu tiên + lộ trình pha + kế hoạch kiểm chứng + quyết định PO, và source không bị đổi bởi bạn. Sau đó dừng — không tự thực hiện plan, không mở assignment mới.
