# Improvement plan — Hoàn thiện UI/UX dành cho luật sư (MatterControl P0)

- Tác giả: actual ZCode với vai trò chuyên gia UI/UX (theo dispatch MC-UIUX-LAWYER-EXPERIENCE-AUDIT-AND-PLAN-20261030). **Đây là đánh giá chuyên gia trên source + runtime fail-closed; CHƯA kiểm chứng với người dùng thật; KHÔNG phải acceptance, KHÔNG phải PASS độc lập.**
- Căn cứ: audit-findings.md (11 findings), accessibility-report.md (52 cặp contrast đo được), design-system-audit.md, task-walkthroughs.md (10 nhiệm vụ), screen-inventory.md, business-analysis.md §2/§9, design-direction.md (info budget), MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030 (Tier A/B/C — plan này nằm đúng Pha 0 của plan đó).

## 1. Tóm tắt điều hành

**Giữ lại (điểm mạnh có bằng chứng):** workbench My Work hiện thực trung thực concept-3 đã duyệt; kỷ luật token mẫu mực (0 literal màu; 5 màu trục trạng thái đúng ngữ nghĩa; fallback forced-colors/reduced-motion/transparency); tương phản đo được 50/52 cặp PASS cả 2 theme; copy trạng thái trung thực ("Nothing shown here is a result", không % bịa, không id thay tên); fail-closed đúng thiết kế (prod demo bị từ chối rõ ràng); nền responsive tốt; Be Vietnam Pro render dấu vi chuẩn.

**5 vấn đề lớn nhất:** (1) trang Workspaces có tiêu đề sai thành "Matters/Hồ sơ" (Blocker, copy-paste); (2) defect locale — nội dung trang kẹt EN không phản ứng ngôn ngữ người dùng, `lang` nói vi nhưng chữ là en (Blocker, reproduce được); (3) không có đường nào chạy sản phẩm có dữ liệu ở local mà không đụng runtime/IdP của người khác → mọi demo/kiểm chứng UX bị tê liệt (Blocker enablement); (4) trạng thái lỗi mất toàn bộ ngữ cảnh (mất H1/tabs/breadcrumb — Major); (5) Storybook vỡ từng phần → cửa visual/a11y gate của design system không đáng tin (Major).

**Kết luận mức sẵn sàng:** **CHƯA sẵn sàng thử nghiệm với luật sư thật.** Điều kiện tối thiểu để mở trial: đóng (1)(2)(3) + keyboard/screen-reader pass trên 3 luồng Golden Workflow. Nền tảng thiết kế đủ tốt để tin rằng sau các bản sửa đó, sản phẩm sẽ đứng vững trước người dùng thật — nhưng đây là đánh giá chuyên gia, không phải dự đoán người dùng.

## 2. Backlog ưu tiên

Mức effort: S ≤½ ngày · M 1–3 ngày · L 1–2 tuần · XL >2 tuần. Phụ thuộc: NEEDS_PO / NEEDS_READ_MODEL / NEEDS_API / none. "AC quan sát được" = tiêu chí chấp nhận kiểm bằng mắt/kịch bản, không cần đo người dùng.

| ID | Màn/flow | Vấn đề (bằng chứng) | Thay đổi đề xuất | Persona | Mức | Effort | Phụ thuộc | AC quan sát được | Kiểm thử |
|---|---|---|---|---|---|---|---|---|---|
| P-01 | `/workspaces` | Title "Matters/Hồ sơ" (UX-L-01) | Đổi en="Workspaces" vi="Không gian làm việc" + metadata | All | Blocker | S | none | H1 trang = nhãn nav; tab title "Workspaces · MatterControl" | Rendered re-check + unit title |
| P-02 | Mọi route | Locale kẹt EN máy chủ (UX-L-02) | Đưa locale về server-readable: cookie `ui-locale` + middleware/RSC đọc cookie; giữ localStorage làm mirror; bảo đảm mọi LocalizedText re-render sau hydration; set `lang` đồng bộ | All (vi chủ yếu) | Blocker | M–L | none (thuần FE) | Probe timeline: H1 vi ngay tại t=0 trên prod build; đổi locale → 0 màn kẹt EN; `lang` = ngôn ngữ hiển thị | Script probe (như audit) chạy trên prod build + screenshot vi từng route |
| P-03 | Demo runtime | Không có data layer demo cho product features (UX-L-03) | Demo fixtures in-memory cho matters/work/proof/filings/workspaces (seed synthetic Atlas rút gọn) + banner "Dữ liệu demo, sẽ mất khi khởi động lại" | All | Blocker (enablement) | L | NEEDS_PO (chính sách demo) | `pnpm dev` thuần (không .env) vào được workbench có 3 matter mẫu theo 3 Golden Workflow; mọi route có dữ liệu | Screenshot bộ + smoke E2E demo |
| P-04 | ReadFailure | Mất context: không H1/tabs/breadcrumb (UX-L-05) | ReadFailure nhận context props (route name vi + breadcrumb + giữ MatterTabs nếu matter read riêng OK); thêm H1 | All | Major | M | none | Khi matter API fail: vẫn thấy "đang ở đâu", tabs mờ có thể quay lại /matters | Rendered fail-state trên 5 route |
| P-05 | ReadFailure/login/search-picker/error.tsx + ~21 literal | Trộn ngôn ngữ (UX-L-04) | Sweep toàn bộ qua LocalizedText + bảng thuật ngữ | All | Major | S–M | P-06 một phần | 0 chuỗi EN trong vi-mode (grep + screenshots) | Grep audit + probe vi |
| P-06 | Thuật ngữ | Lẫn lộn Action/tác vụ/việc; Matter=Hồ sơ mơ hồ | Áp terminology-glossary-vi-en.md sau khi PO quyết D-3; map role badge vi | All | Major | M | NEEDS_PO (D-3) | KindBadge hiện "Hành động/Yêu cầu"; role badge "Chủ hồ sơ/…" | Source sweep + rendered |
| P-07 | Storybook | Stories crash (UX-L-06) | Decorator mock next/navigation; sửa stories; đưa `build-storybook` vào gate CI | Dev/QA | Major | M | none | 58/58 stories render; addon-a11y chạy green trên stories hợp lệ | CI + local run |
| P-08 | Metadata | Tab title EN generic (UX-L-07) | generateMetadata theo locale; param pages thêm id/tên (NEEDS_READ_MODEL cho tên) | All | Minor | S | NEEDS_READ_MODEL (tên) | Tab title vi + chứa tên/id bản ghi | Rendered |
| P-09 | Shell/queues | Thiếu kênh announce kết quả hành động (UX-L-08) | 1 polite live-region cấp shell; announce kết quả theo ActionResult | AT users | Minor | M | P-03 (cần dữ liệu test) | Đổi queue/hành động → SR đọc đúng (manual SR test) | Screen reader session |
| P-10 | Fields trên glass | Border <3:1; rủi ro input trên kính (UX-L-09) | Inner rim/field face đủ 3:1 trên composite; đo trên dialog thật | All | Minor | S | none | Cặp màu field vs backdrop ≥3:1 (script) | Contrast script v2 trên component |
| P-11 | Grid keyboard | AC-111 keyboard-nav 50/200 hàng | Keyboard nav + selection-attributable-by-row-id; bulk preview theo AC-112 | Contributor | Major | L | P-03 + NEEDS_API (bulk đã có contract) | AC-111/112 walkthrough pass | E2E keyboard |
| P-12 | Provenance adjacency | Brief §7: version/criterion/submitter/as-of phải liền kề quyết định | Audit từng màn populated sau P-03; chỉnh chỗ thiếu | Reviewer | Major | M | P-03 | Checklist provenance từng màn proof/review/filing pass | Rendered checklist |
| P-13 | Failing-stream UX | UX-L-10 (dev-only, NOT_VERIFIED prod) | Repro trên prod; nếu có: error boundary + retry affordance cho segment fail | All | Major (risk) | M | none | Prod build không tái lập; nếu tái lập → boundary hiện thông điệp + retry | Prod repro script |
| P-14 | Motion/spacing/z tokens | Không có contract (DS audit) | Thêm dần: motion token 160ms, z-index scale | Dev | Minor | S | none | tokens tồn tại + docs | Lint/grep |
| P-15 | Onboarding rỗng lần đầu | Empty workspace → "create workspace and matter first" đã có text nhưng đường dài 2 bước | Giữ honest copy; thêm link trực tiếp "Tạo không gian làm việc" | New user | Polish | S | none | 1 click từ empty state tới form tạo | Rendered |

## 3. Công việc design system
- Token: giữ nguyên khung màu (đã đo PASS); bổ sung motion/z-index/spacing dần (P-14); quy tắc Liquid Glass đã có (liquid-form-legibility): glass cho reading/form plane, text luôn opaque — giữ, thêm "field on glass ≥3:1" vào rules.
- Component: thiếu = toast/announcer shell (P-09), ReadFailure context variant (P-04), EmptyState per-row cho grid; thừa/không dùng = template tasks demo repo (dọn khi làm P-03); chuẩn hoá pattern: bảng dày + chọn hàng, panel chi tiết, dialog hành động, kết quả hành động (success/refusal/stale/unknown), trạng thái rỗng, nhãn đa trục (grammar Badge 12-variant + Why-section của workbench làm chuẩn).
- Storybook: fix crash (P-07) → GlassSurface stories (thiếu hoàn toàn) + badge/focus states 2 theme → addon-a11y là gate thật.

## 4. Lộ trình theo pha (cổng ra rõ ràng, mỗi pha có xác minh độc lập)
- **Pha 0 — Sửa Blocker + a11y nền (P-01, P-02, P-04, P-05, P-07, P-13).** Mục tiêu: sản phẩm đúng tiếng vi, đúng tên trang, lỗi có ngữ cảnh, gallery tin được. DoD: probe timeline H1 vi trên prod build pass 22/22 route; 0 chuỗi EN lọt (grep + screenshots); 58/58 stories render; fail-state giữ context 5 route; keyboard-tab shell pass. Xác minh độc lập: OpenCode review + chạy lại bộ probe của audit này.
- **Pha 1 — Luồng Golden Workflow mượt cho luật sư (P-03, P-06, P-08, P-12).** Mục tiêu: GW-01/02/03 đi được end-to-end trên demo data, đúng thuật ngữ, provenance liền kề. DoD: 10 nhiệm vụ trong task-walkthroughs đi được (bộ demo data), 0 dead-end không giải thích; AC-109..120 render theo checklist; trial sẵn sàng (usability-test-plan). Xác minh: QA độc lập chạy lại walkthrough + chụp bộ bằng chứng.
- **Pha 2 — Mật độ/tốc độ người dùng thường xuyên (P-11, bulk, saved views nếu thuộc baseline đã duyệt).** DoD: AC-111/112/113/114 pass có bằng chứng; grid keyboard complete. Xác minh: OpenCode E2E.
- **Pha 3 — Hoàn thiện (P-09, P-10, P-14, P-15, responsive sâu, i18n depth).** DoD: a11y report mọi ô ✅/❔ hết NOT_RUN khả dĩ; SR session trên 3 luồng; tablet 834 pass.

## 5. Kế hoạch kiểm chứng với luật sư thật
Xem usability-test-plan.md (5–8 người/persona, 6 phiên, ngưỡng AC-137-style ≥4/5 trong 10s, 0 hiểu sai completed≠verified/receipt≠approval, SUS ≥70). Chỉ chạy sau Pha 0 + tối thiểu Pha 1.

## 6. Chỉ số thành công & cách đo trong sản phẩm hiện tại
- Không thêm theo dõi người dùng (chưa được duyệt). Đo bằng: (a) bộ probe/screenshot tái lập được (locale, contrast, overflow) chạy lại mỗi đợt sửa — script trong `tools/contrast.js` + probe timeline ghi trong worklog; (b) AC checklist rendered; (c) sau trial: số liệu phiên theo §5.

## 7. Rủi ro & quyết định cần PO
- **D-1 (P-03)**: Demo data mode — thương hiệu "no-demo" (an toàn, mất khả năng demo) vs demo fixtures + banner (thêm bề mặt phải giữ). Khuyến nghị: demo fixtures tách bạch, chỉ `API_MODE=demo`, prod vẫn fail-closed như hiện tại (guard TB-12 đã chứng minh hoạt động). **Amendment 2026-10-31 sau BA review r1 (MC-ZCODE-BA-FLOW-COMPLETENESS-20261030): đã có phương án thứ ba được chứng minh sống — backend thật + stub IdP + PG fixture (mcapi @18082 / stub @18099 / fixture @15499, GW-01..03 đi bộ ≈150 calls). D-1 nên adjudicate 3 lựa chọn: (a) frontend demo fixtures; (b) documented stub-IdP + local backend walkthrough env (khuyến nghị mới — chạy contract thật, không có nguy dữ liệu giả lệch contract, đã build một lần); (c) no-demo. Nếu chọn (b), thu hẹp P-03 thành "đóng gói + tài liệu hoá môi trường đó" thay vì viết fixtures frontend.**
- **D-2 (P-02)**: Cơ chế locale — cookie server-readable (khuyến nghị; SSR khớp, hết flash) vs sửa hydration-only (ít xâm phạm hơn nhưng khó chứng minh đúng hết).
- **D-3 (P-06)**: Thuật ngữ: Matter = "Hồ sơ" hay "Vụ việc"; Filing = "Hồ sơ khai"; Action = "Hành động"; role badge vi. Khuyến nghị bảng glossary.
- **D-4**: Mật độ vs thoáng ở grid 200 hàng (compact 14px đã chọn — giữ; review sau trial).
- **D-5**: Liquid Glass vs độ đọc ở field trên kính: giữ glass cho form plane + đo 3:1 (P-10); nếu fail → frost tier cho dialog input.
- **D-6**: Mobile scope: chỉ đọc/duyệt/cập nhật đơn giản (đúng brief) — không đầu tư grid mobile trong P0.

## 8. Ngoài phạm vi / không làm (giữ nguyên ràng buộc vị trí)
Billing, time-tracking, chatbot, e-sign/e-filing, AI intake, draft-Matter lifecycle, template engine — loại khỏi redesign hiện tại; chỉ liệt kê Tier C trong persona-plan. Không thông báo/nhắc lịch (Tier C), không external portal, không cross-matter dependency mới. Không đụng 5 trục trạng thái, permission matrix, receipt≠approval.

## 9. Tuyên bố giới hạn
Không màn populated nào được quan sát trong audit này (UX-L-03) — mọi kết luận về grid/review/filing/import là SOURCE_READ + prior author artifacts. Cơ chế UX-L-02 là hypothesis mạnh. Plan này KHÔNG tự thực hiện; chờ intake của Codex + PO duyệt từng quyết định D-1..D-6.
