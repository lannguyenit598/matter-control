# Audit findings — MC-UIUX-LAWYER-EXPERIENCE-AUDIT-AND-PLAN-20261030 (r1)

- Auditor: actual ZCode (GLM session) acting as senior legal-tech UI/UX expert. **Không phải OpenDesign/Antigravity; không phải review độc lập của OpenCode; chưa kiểm chứng với luật sư thật.**
- Base: HEAD `0de3e5d` (2026-10-30T10:49:44+07:00), 175 dirty files song song (không đụng). Runtime quan sát: `127.0.0.1:3100`, Next 16.4.2 webpack dev, `API_MODE=demo` (process env override .env.local), IAB Chromium 1440×900 / 390×844.
- Thang mức: **Blocker** = sai/gây hiểu lầm nghiệp vụ hoặc không dùng được với AT/bàn phím; **Major** = làm chậm/nhầm đáng kể; **Minor**; **Polish**.
- Class: `OBSERVED_RENDERED` (chụp/probe thật trên runtime của tôi) · `OBSERVED_STATIC` (artifact của author run trước, trích dẫn) · `SOURCE_READ` (đọc code/docs) · `NOT_VERIFIED`.

## 1. Findings

### UX-L-01 — Blocker — Trang Workspaces có tiêu đề "Matters/Hồ sơ"
- Screen: `/workspaces` (toàn cục). Viewport/theme: mọi state. Role: tất cả.
- Bằng chứng: rendered H1 "Hồ sơ" + description workspace (`screens/workspaces__vi-light__1440x900__demo-anon.png`); source `apps/frontend/src/app/(app)/workspaces/page.tsx:15` `metadata: { title: 'Matters' }`, `:21` `title en="Matters" vi="Hồ sơ"`. Sidebar cùng trang lại ghi "Không gian làm việc".
- Heuristic: consistency & standards, match between system and real world. AC liên quan: AC-163-adjacent IA; BA §9.6 (human labels).
- Tác động: 2 đích toàn cục cùng tên → history/tab title ("Matters") gây hiểu nhầm; luật sư không phân biệt được Hồ sơ vs Workspace.
- Đề xuất: đổi title thành "Workspaces/Không gian làm việc" (S). Kiểm thử: rendered re-check + agents:check (backtick path rule).

### UX-L-02 — Blocker — Defect locale: nội dung trang kẹt tiếng EN máy chủ, không phản ứng với ngôn ngữ người dùng
- Screen: mọi PageHeader (my-reviews, matters, workspaces…), login card, một phần story/error copy. Đã reproduce có timeline.
- Bằng chứng rendered (`OBSERVED_RENDERED`): với `ui-locale=vi` + `document.lang=vi`: H1 `/my-reviews` = "Reviews due" giữ nguyên qua 6 mẫu trong 3s; chọn lại ngôn ngữ ngay trên trang (EN→VI) vẫn "My work"; login card "Sign in to your workspace/Sign in to continue./Sign in" EN trong khi tagline trên đó là tiếng Việt. `document.lang` lật en→vi trong 0.5–1.5s sau load (probe t=0.3s→1.5s). Ngược lại sidebar/nav + ReadFailure title/button localize đúng → phần layout hydrate bình thường, phần nội dung trang không.
- Bằng chứng source (`SOURCE_READ`): strings ĐÃ có cặp vi/en (`my-reviews/page.tsx:21`, `login/page.tsx:51,54,69`) → không phải thiếu bản dịch. Giả thuyết cơ chế: Cache Components/partial prefetch serve segment chưa hydrate với snapshot server (`getServerSnapshot` mặc định EN); my-actions từng render vi đúng ngay sau lần compile đầu tiên (fresh compile) — nhất quán với cache. Cơ chế CHƯA proven — đánh dấu hypothesis.
- WCAG: 3.1.2 Language of Parts (FAIL — `lang=vi` nhưng text EN); AC-137-style comprehension target cho người vi.
- Tác động: người vi (đối tượng chính) thấy tiêu đề/mô tả/error EN; screen reader đọc EN bằng quy tắc phát âm vi; mất niềm tin "sản phẩm không hiểu tôi".
- Đề xuất: đưa locale về server-readable (cookie + middleware/`setRequestLocale`-equivalent của Next 16 hoặc đọc cookie trong RSC) để SSR khớp client; nếu giữ localStorage thì phải bảo đảm re-render mọi `LocalizedText` sau hydration (bắt buộc test trên prod build). Effort M–L. Kiểm thử: script probe timeline (như audit này) chạy lại trên build production + screenshot vi mỗi route.

### UX-L-03 — Blocker (enablement) — Không tồn tại đường render có dữ liệu nào chạy được local mà không đụng runtime/IdP của người khác
- Bằng chứng (`OBSERVED_RENDERED` + `SOURCE_READ`): (a) demo mode: `src/lib/mc/client.ts:53` throw `unavailable` 503 cho MỌI data MatterControl — không có demo repository cho product features (chỉ feature `tasks` template chết); (b) REST mode: đòi `session.accessToken` từ IdP (`mc/client.ts:62` 401 nếu không token; `AUTH_ALLOW_ANONYMOUS` không có token); (c) `/api/auth/login` redirect tới ZITADEL local `:8080` và bị từ chối JSON `invalid_request: "The requested redirect_uri is missing in the client configuration"` (`screens/login__zitadel-authorize-redirect__1440x900__anonymous.png`); (d) `redirect_uri` pin `localhost:3000` (runtime Codex — ngoài phạm vi) → cookie không bao giờ map sang origin khác; (e) production build **từ chối demo mode** đúng thiết kế TB-12 ("API_MODE must be 'rest' when the production server runs…") — xác nhận guard hoạt động.
- Tác động: mọi demo/audit/trial với dữ liệu đều phải dựng full backend+IdP hoặc dùng runtime chia sẻ; giải thích vì sao toàn bộ evidence "rendered" trước nay là author-only; PO/luật sư không thể "nhìn thấy sản phẩm".
- Đề xuất (cần PO — xem improvement-plan D-1): demo fixtures cho product features (in-memory, banner "demo data") HOẶC chấp nhận "no-demo" và chuẩn hoá một môi trường dùng thử được phép chia sẻ. Không phải lỗi UI code nhưng chặn mọi kiểm chứng UX.
- Lưu ý ranh giới: tôi không sửa .env.local, không sửa IdP, không dùng runtime :3000 — đúng prompt.

### UX-L-04 — Major — Trộn ngôn ngữ trong cùng một component/cụm màn hình
- Bằng chứng: ReadFailure: title "Tạm thời không khả dụng" + button "Thử lại" (vi) vs body "The service could not be reached…" (EN) — `screens/my-actions__vi-light__1440x900__demo-anon.png`; source `read-failure.tsx:79` `` `This ${subject} is not available` `` + `:93` EN-only description; `error.tsx:27`; SearchPicker unavailable message EN (`screens/storybook/sb-molecules-searchpicker--unavailable.png`); ~21 attribute literals + JSX bypass (Agent A inventory: proof-panel "Challenge this acceptance", document-forms "Earlier upload not confirmed", filing-forms placeholder "Choose the authority", planning-view "Waiting on (…)", rejection-details "Not satisfied:", document detail "Make version … current").
- WCAG 3.1.2; BA §9.6 (human labels). Tác động: lỗi hệ thống là thời điểm nhạy cảm nhất về niềm tin.
- Đề xuất: sweep toàn bộ bypass qua `LocalizedText` + table vi/en (xem terminology-glossary); effort S–M.

### UX-L-05 — Major — Trạng thái lỗi mất toàn bộ ngữ cảnh trang: không H1, không breadcrumb, không MatterTabs
- Bằng chứng: probe 22 route — mọi trang matter con + param detail có `h1: null`, chỉ còn H2 "Tạm thời không khả dụng"; MatterTabs biến mất (MatterScope fail toàn subtree); tab title generic EN ("Matter · MatterControl", "Work item · MatterControl"). Ảnh: `screens/matter-*__vi-light__1440x900__demo-anon.png`.
- Heuristic: orientation/recovery; BA §3 (Re-orient). Tác động: luật sư không biết mình đang ở đâu, thất bại ở bước nào; "Thử lại" mù.
- Đề xuất: ReadFailure giữ layout ngữ cảnh (breadcrumb + tên section + MatterTabs nếu matter read OK riêng); thêm H1 ẩn/vizu per route; tab title giữ route name vi. Effort M. NEEDS: đọc matter riêng từ cache/segment (không phải read model mới).

### UX-L-06 — Major — Storybook runtime vỡ từng phần → cửa ngõ visual/a11y của design system không đáng tin
- Bằng chứng: DashboardTemplate (cả 3 variants), Badge Variants, Feedback&display alerts crash `TypeError: Cannot read properties of undefined (reading 'data')` tại `useRouter`/`RedirectBoundary` (`screens/storybook/sb-templates-dashboardtemplate--liquid-workbench.png`, recheck badge/alerts qua DOM text); SearchPicker set render đúng. addon-a11y `test: 'error'` không thể là gate khi stories crash. Khớp baseline cũ "Storybook runtime broken" và mở rộng.
- Đề xuất: sửa story env (provider cho next/navigation hoặc mock router decorator); gate build-storybook trong CI; effort M.

### UX-L-07 — Minor — Tab title EN-only, tĩnh, generic cho trang param
- `metadata: { title: 'Matter'|'Work item'|… }` không localize, không chứa tên bản ghi. Đề xuất: `generateMetadata` theo locale cookie + tên từ read (NEEDS_READ_MODEL cho tên; có thể dùng id tạm thời). Effort S–M.

### UX-L-08 — Minor — aria-live mỏng cho app dày đặc trạng thái
- Chỉ 3 `aria-live` (work-grid, planning-view, search-picker); inline `role=status/alert` gần form tốt; nhưng thay đổi queue/filter/kết quả hành động cấp trang chưa có kênh announce riêng (cần verify với dữ liệu thật — `NOT_VERIFIED` hành vi live).
- Đề xuất: một polite live-region cấp shell cho kết quả hành động/đổi queue; audit sau khi có demo data. Effort M.

### UX-L-09 — Minor — Viền mảnh dưới ngưỡng 3:1 với nền trang (đo được)
- `contrast-results.md`: border on background 1.167 (light) / 1.422 (dark). Không tự động FAIL WCAG 1.4.11 — chỉ áp dụng khi viền là tín hiệu nhận diện duy nhất của control; các control có fill riêng. Rủi ro nằm ở input trên nền kính (liquid dialog) — `NOT_VERIFIED` với dữ liệu thật.
- Đề xuất: giữ border, thêm field background/inner rim đủ cặp 3:1 trên composite kính; đo lại trên component thật.

### UX-L-10 — Major (risk, NOT_VERIFIED prod) — Streaming fail trong dev: `main` rỗng hoàn toàn, không lỗi, không nút thử lại
- Bằng chứng: sau nhiều điều hướng, mọi route động render `main` rỗng (innerHTML 74 ký tự) trong khi curl nhận HTML đầy đủ; log server cảnh báo Next 16 "segment was dropped from rendering" (`work/[itemId]`); tái lập trên tab mới + sau restart server; tự hồi phục không rõ nguyên nhân. Có thể là flake dev-runtime (Cache Components/partial prefetch); KHÔNG kết luận cho prod (`NOT_VERIFIED`).
- Nếu tái lập được trên prod build → Blocker trần trụi (màn trắng không phản hồi). Đề xuất: repro script trên `next start` + error boundary cho segment fail.

### UX-L-11 — Polish — Next.js dev-tools "N" bubble che góc dưới-phải trong dev
- Dev-only chrome, không phải product. Ghi để người review không nhầm là defect product.

## 2. Điểm mạnh giữ lại (bằng chứng)

1. **Workbench My Work = concept-3 đã duyệt, hiện thực trung thực** (`my-actions-view.tsx` toàn văn + `screens/my-actions__vi-light__1440x900__demo-anon.png` cấu trúc): queue rail 4 hàng đợi + counts, "Vì sao đây là việc tiếp theo", 1 hành động chính ("Open task" chỉ ELIGIBLE mới primary), Up next, disclosure 5 trục, selection nằm ở URL.
2. **Kỷ luật token mẫu mực**: 0 literal màu ngoài `globals.css` (verify grep), Badge 12 variants trong đó 5 màu trục trạng thái có ngữ nghĩa domain; light hex/dark oklch; fallback `forced-colors` + `prefers-reduced-motion` + `prefers-reduced-transparency`; native `<dialog>` focus trap; skip link localize được.
3. **Tương phản đo được: 50/52 cặp PASS cả 2 theme** (text ≥4.5, trục trạng thái vs card ≥3) — `contrast-results.md` (browser-resolved, oklch→sRGB thật). 2 FAIL duy nhất là viền trang trí (UX-L-09).
4. **Copy trung thực theo Required State Specification**: "Nothing shown here is a result", "Nothing is recommended in its place", "An assignment is not a recommendation", empty queue phân biệt none-ready vs waiting/blocked, không bëa % hoàn thành, "missing name is never replaced by an id".
5. **Fail-closed đúng thiết kế**: prod demo bị từ chối rõ ràng (TB-12); REST fail-closed; hidden-not-found tôn trọng ở ReadFailure.
6. **Responsive nền tốt**: 390px không tràn ngang, drawer 85vw, touch target 44px ≤639px/coarse, sidebar thu 210px ở 801–1100.
7. **Be Vietnam Pro render dấu tiếng Việt chuẩn** (observed nhiều màn hình).
8. **Mobile preferences reachable**: settings popover có language + theme.

## 3. Phân loại theo mức
- Blocker: UX-L-01, UX-L-02, UX-L-03.
- Major: UX-L-04, UX-L-05, UX-L-06, UX-L-10 (risk).
- Minor: UX-L-07, UX-L-08, UX-L-09. Polish: UX-L-11.

## 4. Giới hạn của chính findings này
- Không màn hình nào có dữ liệu thật → mọi nhận xét về grid dày, review cells, filing flow, bulk/import là `SOURCE_READ` + prior author artifacts (`OBSERVED_STATIC`, provenance từng cái trong screen-inventory). Không keyboard-only, không screen reader, không zoom 200%/reflow 320px chạy trong audit này (bảng NOT_RUN trong accessibility-report). Cơ chế UX-L-02 là hypothesis có bằng chứng gián tiếp — cần confirm trên prod build.
