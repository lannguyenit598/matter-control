# Accessibility report — WCAG 2.2 AA (theo khả năng đo của audit này)

Phạm vi thật: shell + login + trạng thái fail-closed của 22 route, 2 theme, 2 viewport (1440/390). Các màn populated: **NOT_VERIFIED** (UX-L-03). Ký hiệu: ✅ PASS (có bằng chứng đo/quan sát) · ❌ FAIL (bằng chứng) · ⚠️ RỦI RO · ❔ NOT_VERIFIED · ⛔ NOT_RUN.

## 1. Tương phản (1.4.3 / 1.4.11) — đo bằng màu browser-resolved
- Phương pháp: probe `getComputedStyle` trên trang thật cho 196 token × 2 theme; oklch→sRGB chuyển đổi chuẩn (oklab→LMS→linear sRGB→gamma); composite alpha qua nền; tỉ số WCAG luminance. Kết quả đầy đủ: `contrast-results.md` + `contrast-results.json` (52 cặp).
- Text (4.5:1): ✅ PASS cho foreground, muted-foreground, mọi control label pair (primary/secondary/accent/destructive/success/warning/header) ở cả 2 theme.
- Trục trạng thái vs card (3:1): ✅ PASS cả 5 (execution/verification/dependency-ready/dependency-blocked/timing/attention) cả 2 theme.
- ❌ FAIL đo được: border vs background 1.167 (light), 1.422 (dark) — xem UX-L-09: không tự động vi phạm 1.4.11 nếu viền chỉ trang trí; ⚠️ cần verify input trên dialog kính (composite thật) khi có runtime populated.
- Glass panel composite (panel@alpha over background): ✅ foreground ≥4.5, ⚠️ muted-foreground phụ thuộc backdrop gradient thật — được ghi là xấp xỉ (cùng giả định encoding-sRGB như liquid-form-legibility-20261030).

## 2. Cấu trúc & điều hướng
- Skip link: ✅ có, localize ("Đến nội dung"/"Skip to content"), focus hiển thị.
- Heading: ✅ my-actions/my-reviews/matters/workspaces có H1; ❌ mọi trang matter con + param detail có **h1 null** trong trạng thái lỗi (UX-L-05) — chỉ H2 "Tạm thời không khả dụng".
- Nav: ✅ `aria-current="page"` cho nav chính + matter tabs + queue rail; `nav aria-label="Matter sections"`/"Main".
- Landmarks: ✅ complementary/sidebar, main, banner header.
- Tab title: ⚠️ EN-only generic (UX-L-07) — không vi phạm trực tiếp WCAG nhưng ảnh hướng định hướng.

## 3. Bàn phím & focus
- Focus visible: ✅ `:focus-visible` outline 2px ring token toàn cục; header override màu.
- Dialog: ✅ native `<dialog>.showModal()` → focus trap/inert/Escape/focus return miễn phí; `data-autofocus`; `aria-labelledby/describedby`. (SOURCE_READ + Storybook formdialog capture.)
- Touch target: ✅ 2.75rem (44px) ≤639px/coarse pointer; 2rem desktop (globals.css:437–450) — đo qua CSS, không đo runtime trên populated grid.
- Keyboard-only trên grid dày/filings/import: ⛔ NOT_RUN (UX-L-03). AC-111 keyboard-nav NOT_RUN.

## 4. Ngôn ngữ (3.1.1 / 3.1.2)
- ❌ FAIL quan sát được: `document.lang` lật en→vi sau hydration trong khi phần lớn text nội dung vẫn EN (UX-L-02) → screen reader đọc EN bằng quy tắc vi. Cả hai chiều đều sai (vi-mode hiện EN; en-mode với người vi).
- ✅ Phần localize đúng: nav, skip link, ReadFailure title/button, theme toggle aria-label ("Đổi giao diện sáng/tối"), settings popover.

## 5. Thông báo trạng thái (4.1.3)
- ✅ `role="alert"` (5) / `role="status"` (17) inline cho kết quả hành động + Alert destructive; 3 `aria-live=polite` (work-grid, planning-view, search-picker).
- ⚠️ UX-L-08: không có live-region cấp shell cho đổi queue/kết quả cấp trang — cần verify với dữ liệu thật (⛔).

## 6. Chuyển động & hiển thị thay thế
- ✅ `prefers-reduced-motion`: kill-switch toàn cục (animation/transition none) + glass-button riêng.
- ✅ `prefers-reduced-transparency` + `forced-colors`: override tokens (globals.css:276–287, 1021–1137).
- Zoom 200% / reflow 320px: ⛔ NOT_RUN trong audit này (prior author đã quan sát 320px không tràn ở focused-workbench r1 — OBSERVED_STATIC).

## 7. Ảnh & media
- ✅ Không có raster ảnh sản phẩm (alt n/a); icons lucide `aria-hidden`.

## 8. Screen reader
- ⛔ NOT_RUN toàn bộ (không có màn populated + không cấu hình AT trong audit). Bất kỳ claim "a11y pass" nào trước nay đều phải hiểu là source-level.

## 9. Tổng hợp trạng thái theo màn hình chính
| Màn | Contrast | Keyboard | SR | i18n-lang | Notes |
|---|---|---|---|---|---|
| Shell (sidebar/header) | ✅ | ✅ (nền tảng CSS) | ⛔ | ⚠️ vi chrome + EN content | |
| /login | ✅ | ❔ | ⛔ | ❌ card EN | |
| /my-actions | ✅ | ⛔ grid | ⛔ | ❌ H1 kẹt EN (reproduced) | |
| Matter subpages (fail state) | ✅ | ❔ | ⛔ | ⚠️ body EN | h1 null |
| Storybook (component) | ✅ (token) | n/a | n/a | ⚠️ EN strings | stories crash (UX-L-06) |

## 10. Việc cần làm để đóng gaps
1. Sửa UX-L-02 (locale) → re-run lang-of-parts check.
2. Dựng đường demo populated (UX-L-03) → chạy keyboard-only + NVDA/VoiceOver trên 3 luồng Golden Workflow + zoom/320.
3. Bổ sung H1 + context cho fail states (UX-L-05).
4. Chạy lại contrast trên component kính thật (dialog populated).
