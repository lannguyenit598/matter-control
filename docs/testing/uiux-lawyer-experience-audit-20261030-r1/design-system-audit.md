# Design system audit

## 1. Tokens — đánh giá: XUẤT SẮC (giữ nguyên + 3 khoảng trống nhỏ)
- 196 custom properties; **0 literal màu** trong `.ts/.tsx` ngoài `globals.css` (verify grep: hex/rgb/oklch/hsl = 0; inline style chỉ backdropFilter). Quy ước được ghi ngay đầu globals.css và có build guard (`scripts/check-built-css.mjs`).
- Light = hex, dark = oklch; glass/liquid = oklch+alpha; `@theme inline` Tailwind v4 map ~31 utilities → var() (theme switch runtime bằng `data-theme`, set trước paint bởi themeInitScript — không flash theme quan sát được).
- Ngữ nghĩa domain: 5 màu trục trạng thái độc lập (execution/verification/dependency-ready/block, timing, attention) + `selected` cho workbench — đúng yêu cầu "compact visual grammar cho 5 trục" của BA §11.2.
- Khoảng trống: (1) **không spacing scale** (Tailwind default; nhất quán nhưng không có contract); (2) **không z-index/motion tokens** (160ms hard-code, z-10/20/50 rải rác — rủi ro xung đột layer khi thêm surface mới); (3) radii ngoài scale (10/14/18/20px hard-code trong surface rules).

## 2. Components (Atomic)
- atoms 9 / molecules 20 / organisms 10 / templates 1. Badge 12 variants; Button 5×3 + loading (`aria-busy`); Input/Select error qua `aria-invalid`; Skeleton `aria-hidden` + hướng dẫn `aria-busy` ở region; Spinner `role=status`.
- **Không có toast system** — kết quả hành động hiển thị inline (`role=status`/alert) hoặc TaskSuccess trong FormDialog. Với app pháp lý "confirm → return-to-context", inline là lựa chọn hợp lý, nhưng cần pattern chuẩn cho cross-page action result (hiện mỗi feature tự xếp).
- GlassSurface: tiered liquid/frost/opaque + registry filter; **chưa có story riêng** (chỉ indirect qua DashboardTemplate — mà story đó lại crash, UX-L-06) → phần quan trọng nhất của visual system hiện không có gallery/a11y gate.
- DataTable: presentational, `caption` sr-only, `th scope`, row hover; sort/pagination compose ở feature — OK cho P0.

## 3. Storybook — đánh giá: ĐANG VỠ (UX-L-06)
- 10.6.2 + addon-a11y `test: 'error'` + toolbar light/dark; 19 story files / 58 stories; coverage phủ atoms/molecules/organisms/template/features-work-filters.
- Observed: DashboardTemplate (3 variants), Badge Variants, Feedback&display crash `TypeError: Cannot read properties of undefined (reading 'data')` (useRouter/RedirectBoundary — Next client context thiếu trong story env). SearchPicker set (7 stories) render đúng, trong đó các trạng thái recovery (unavailable/failed/permission-lost/same-names/truncated) là sample UX recovery tốt.
- Hệ quả: addon-a11y gate không đáng tin; dark-variants story không chụp được → dark audit dựa vào token measure + app runtime.

## 4. i18n infra
- `LocalizedText` en/vi inline (863 usages) + `useLocale` (useSyncExternalStore, localStorage `ui-locale`, `document.lang` sync, cross-tab storage event) + 13 bảng pair cục bộ. Không dictionary file, không locale route — phù hợp P0.
- Điểm gãy: server snapshot mặc định EN + segment chưa hydrate giữ EN (UX-L-02); ~30–40 literal bypass (UX-L-04). Metadata title không localize (UX-L-07).
- Thuật ngữ: xem terminology-glossary-vi-en.md — điểm cần quyết: "Matters=Hồ sơ" (mơ hồ với workspace/documents), "task=tác vụ" vs "việc" (my-actions dùng "Việc của tôi" + "Mở tác vụ" trong cùng màn).

## 5. Pattern đang hình thành (nên chuẩn hoá thành pattern library nội bộ)
1. ReadFailure (fail-closed banner + retry + subject) — cần thêm context-preserving variant (UX-L-05).
2. IntentForm + attempt + draft scope bindings (creation-flow) — pattern recovery tốt, cần tài liệu hoá.
3. SearchPicker recovery states (unavailable/failed/permission-lost) — ready-made mẫu cho các picker khác.
4. MatterTabs primary/secondary split — đúng hướng giảm tab overload; cần rule "khi nào tab nào".
5. State-axis Badge set + Why-section (workbench) — grammar cho "causality dominant".

## 6. Việc đề xuất (chi tiết trong improvement-plan)
- Fix Storybook crash (decorator router mock) + đưa build-storybook vào gate.
- Thêm GlassSurface stories + badge/focus-state stories cho cả 2 theme.
- Motion/spacing/z-index tokens (nhỏ, dần dần).
- Localize 30–40 literal + metadata; cookie-locale để SSR khớp.
