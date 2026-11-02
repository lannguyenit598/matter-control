# UI & Accessibility Issues Remediation Plan (Post-EGM Review)

## Executive Summary & Problem Statement

This design document specifies the verified remediation plan for UI, accessibility (A11y), and usability issues in `apps/frontend`, refined and approved through the Elephant-Goldfish Model (EGM) Review Protocol.

### Background & Objective
During automated and manual WCAG 2.1 AA and usability audits of the MatterControl frontend, several high-impact user experience and accessibility defects were identified across navigation landmarks, mobile touch interactions, dark-mode styling, and bilingual screen-reader experiences. This remediation establishes a coherent set of non-breaking fixes ensuring full compliance with design system invariants, legal control-plane precision, and cross-browser stability.

### Goals & Non-Goals
- **Goals**:
  - Full WCAG 2.1 AA conformance for keyboard focus visibility, screen reader labels, and form contrast.
  - Strict preservation of the React Server Component (RSC) boundary (no client hooks in RSC layouts).
  - Bilingual parity (EN/VI) across interactive landmarks, placeholders, and action triggers.
  - Consistent minimum 44px touch targets on mobile viewports with centered text baselines.
  - Maintain 100% compatibility with existing test suites (900+ tests passing).
- **Non-Goals**:
  - Replacing native `<details>` preferences menu with third-party popover or modal libraries.
  - Altering business logic, state machines, or domain validation schemas.
  - Introducing automated focus shifting in `IntentForm` on server rejection (handled by `ActionAnnouncer`).

---

## Architectural Invariants & Patterns

1. **RSC vs. Client Boundary Isolation**:
   - Server Components (e.g. `AppSidebar`, `AuthenticatedWorkbench` in `layout.tsx`) resolve locale asynchronously on the server via `await uiLocale()`.
   - Client Components (e.g. `Dialog`, `BottomNav`, `MatterSearch`, `LocaleToggle`) consume client state via `useLocale()`.
   - Locale props passed across the RSC boundary avoid hydration mismatches or client hook leakage.

2. **Sentence Case Button Invariant**:
   - In `apps/frontend`, all action triggers strictly adhere to sentence case (`Create workspace`, `Create requirement`, `Save revision`, `Add criterion`). Multiple test suites enforce exact sentence case strings. English labels remain sentence case, while Vietnamese copy uses natural Vietnamese casing (`Lưu phiên bản`, `Thêm tiêu chí`).

3. **Single Source of Truth for Control Styling**:
   - `fieldControlClass` in `input.tsx` cascades `text-foreground`, `bg-card`, and borders uniformly across `Input`, `Textarea`, and `Select`.

4. **Mutual Exclusion of Navigation Landmarks**:
   - Responsive CSS media queries (`globals.css` and `pane-workbench.css`) apply `display: none` to the inactive navigation slot (`.app-sidebar-slot` at `<= 800px`, `.app-bottom-nav` at `> 800px`). Elements with `display: none` are removed from the accessibility tree, guaranteeing landmark uniqueness without duplicate announcements.

---

## Feature Specification

### 1. Form Inline Validation Announcement (`form-field.tsx`)
- **Location**: `apps/frontend/src/components/molecules/form-field.tsx`
- **Issue & Resolution**: Inline error text `<p id={errorId}>` is already associated with input controls via `aria-describedby` and `aria-invalid="true"`. Adding `role="alert"` causes screen reader thrashing on multi-field forms. Form submission errors are announced globally via `ActionAnnouncer`.
- **Specification (Verification Only)**: Retain existing `aria-describedby` and `aria-invalid` architecture. Do NOT add `role="alert"` to individual inline error paragraphs. Focus shifting on server validation rejection in `IntentForm` is an explicit Non-Goal for this milestone; `FormField` remains a pure presenter.

### 2. Visible Keyboard Focus Ring on Preferences Menu (`layout.tsx`)
- **Location**: `apps/frontend/src/app/(app)/layout.tsx:93`
- **Issue**: The mobile `<details>` `<summary>` element for preferences (`Settings2` trigger) lacked a visible focus indicator. Keyboard users tabbing through header controls could not distinguish when the summary had focus.
- **Specification**: Apply explicit focus utilities `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-md` directly to the `<summary>` element. Zero-JS native `<details>` disclosure is retained.

### 3. Decorative Icon Hiding in Primary Navigation (`navigation.tsx`)
- **Location**: `apps/frontend/src/config/navigation.tsx:40`
- **Issue**: Navigation menu icons (`ListChecks`, `ClipboardCheck`, `FolderOpen`, `Building2`) were rendered without `aria-hidden="true"`. Because navigation links have explicit text labels, icons are purely decorative.
- **Specification**: Pass `<Icon aria-hidden />` when mapping `mainDestinations` into `mainNavigation`.

### 4. Native Select & Form Controls Text Contrast (`input.tsx`)
- **Location**: `apps/frontend/src/components/atoms/input.tsx:6-7`
- **Issue**: `fieldControlClass` sets `bg-card` but omitted `text-foreground`. In Windows Dark Mode or High Contrast themes, controls could inherit unreadable text colors against the card background.
- **Specification**: Add `text-foreground` directly to `fieldControlClass` in `input.tsx` to uniformly style `Input`, `Textarea`, and `Select`.

### 5. Virtual Numeric Keypad for Valid Days Input (`proof-panel.tsx`)
- **Location**: `apps/frontend/src/features/proof/components/proof-panel.tsx:614, 761`
- **Issue**: The `validDays` inputs (in `AssessForm` and `CriterionForm`) were declared as `type="number"` without `inputMode="numeric"` or integer step constraints. On mobile devices, virtual keyboards could display alphanumeric layouts.
- **Specification**: Add `inputMode="numeric"` and `step={1}` to both `validDays` inputs in `proof-panel.tsx`.

### 6. Internationalization for Accessibility Labels (`dialog.tsx`, `app-sidebar.tsx`, `layout.tsx`)
- **Location**:
  - `apps/frontend/src/components/molecules/dialog.tsx:43, 122`
  - `apps/frontend/src/components/organisms/app-sidebar.tsx:12, 22`
  - `apps/frontend/src/app/(app)/layout.tsx:37, 47`
- **Issue**:
  - `dialog.tsx`: The close icon button carried a hardcoded English `aria-label="Close"`.
  - `app-sidebar.tsx`: The `<nav>` element had hardcoded English `aria-label="Main"`. `AppSidebar` is an RSC; calling client hooks inside it violates RSC boundaries.
- **Specification**:
  - In `dialog.tsx`: Use `useLocale()` and self-contained bilingual label `locale === 'vi' ? 'Đóng' : 'Close'`. No speculative public props.
  - In `app-sidebar.tsx`: Add `navAriaLabel?: string` to `AppSidebarProps` and render `<nav aria-label={navAriaLabel ?? 'Main'} ...>`.
  - In `layout.tsx`: Resolve `const locale = await uiLocale()` in `AuthenticatedWorkbench` and pass `navAriaLabel={locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'}` to `<AppSidebar>`.

### 7. Microcopy, Placeholder Localization, and Shortcut Badges (`matter-search.tsx`, `command-palette.tsx`)
- **Location**:
  - `apps/frontend/src/features/matters/components/matter-search.tsx:29, 64`
  - `apps/frontend/src/components/organisms/command-palette.tsx:88-91`
- **Issue**:
  - Search input placeholder was unlocalized English and lacked standard typographic ellipsis (`"Search matters by name"`).
  - Shortcut badge on macOS must adhere to Apple Human Interface Guidelines (`⌘K` without space), while Windows/Linux uses a non-breaking space (`'Ctrl\u00A0K'`). Badge must not wrap lines.
- **Specification**:
  - In `matter-search.tsx`: Localize placeholder as `{locale === 'vi' ? 'Tìm hồ sơ theo tên…' : 'Search matters by name…'}`.
  - In `command-palette.tsx`: Format shortcut badge as `{isApple ? '⌘K' : 'Ctrl\u00A0K'}` and add `whitespace-nowrap` to `<kbd>`.

### 8. Sentence Case Button Label Invariant with Bilingual Localization (`proof-panel.tsx`)
- **Location**: `apps/frontend/src/features/proof/components/proof-panel.tsx:636`
- **Issue**: Action buttons adhere strictly to sentence case across all forms (`Create workspace`, `Create requirement`, `Save revision`, `Add criterion`). In `proof-panel.tsx:636`, `submitLabel` used raw unlocalized English strings.
- **Specification**: Wrap labels in `<LocalizedText en="Save revision" vi="Lưu phiên bản" />` and `<LocalizedText en="Add criterion" vi="Thêm tiêu chí" />` without modifying existing sentence-case labels in other forms.

### 9. Vertical Text Misalignment in Native Select on Small Screens (`select.tsx`)
- **Location**: `apps/frontend/src/components/atoms/select.tsx:157-161`
- **Issue**: In native `<select>` controls on mobile (`max-sm:min-h-11 max-sm:py-2.5`), option text baseline was biased towards top padding rather than vertically centering within the 44px touch target.
- **Specification**: Adjust mobile vertical padding to `max-sm:py-3` and add `leading-normal` at lines 157–161 to vertically align the text baseline with the flanking icons.

### 10. Multi-column Form Grid Alignment Invariant (`proof-panel.tsx`)
- **Location**: `apps/frontend/src/features/proof/components/proof-panel.tsx:744-765`
- **Specification (Verification Only)**: Preserve invariant separation between concise field label (`"Valid for (days)"`) and auxiliary explanations in `hint` (`"Days once accepted; 0 = unbounded."`). Adjacent form controls maintain identical top-alignment. Invariant verified; no code change required.

---

## Implementation Roadmap

### Phase 1: Core Accessibility & Focus States (P1)
1. **Header Preferences Focus Ring**: Apply `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring` to `<summary>` in `apps/frontend/src/app/(app)/layout.tsx`.
2. **Decorative Navigation Icon Hiding**: Add `aria-hidden` to `<Icon />` in `apps/frontend/src/config/navigation.tsx`.
3. **Inline Form Field Verification**: Confirm retention of `aria-describedby` in `apps/frontend/src/components/molecules/form-field.tsx`.

### Phase 2: Form Controls & Mobile Input Modes (P2)
1. **Design System Text Contrast**: Add `text-foreground` to `fieldControlClass` in `apps/frontend/src/components/atoms/input.tsx`.
2. **Virtual Numeric Keypad**: Add `step={1}` and `inputMode="numeric"` to `validDays` inputs in `apps/frontend/src/features/proof/components/proof-panel.tsx`.
3. **Native Select Mobile Alignment**: Add `leading-normal max-sm:py-3` to trigger classes in `apps/frontend/src/components/atoms/select.tsx`.

### Phase 3: Accessibility Internationalization (P2)
1. **Dialog Close Button Accessible Name**: Import `useLocale` and render `aria-label={locale === 'vi' ? 'Đóng' : 'Close'}` in `apps/frontend/src/components/molecules/dialog.tsx`.
2. **Sidebar Navigation Landmark**: Add `navAriaLabel?: string` prop to `apps/frontend/src/components/organisms/app-sidebar.tsx`; pass `locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'` from `apps/frontend/src/app/(app)/layout.tsx`.

### Phase 4: Typography & Button Sentence Case (P3)
1. **Search Placeholder**: Localize placeholder with ellipsis in `apps/frontend/src/features/matters/components/matter-search.tsx`.
2. **Apple HIG Shortcut**: Add `whitespace-nowrap` and format `⌘K` / `Ctrl\u00A0K` in `apps/frontend/src/components/organisms/command-palette.tsx`.
3. **Button Sentence Case**: Localize `submitLabel` using `<LocalizedText />` with sentence case in `apps/frontend/src/features/proof/components/proof-panel.tsx`.

### Phase 5: Verification & Regression Gates
1. **Unit & Component Tests**:
   - `dialog.test.tsx`: Verify default English and Vietnamese context fallback (`<UiLocaleContext.Provider value="vi">`).
   - `matter-search.test.tsx`: Verify ellipsis placeholder in English and Vietnamese.
   - Run: `rtk proxy pnpm --dir apps/frontend test` (904/904 PASS).
2. **TypeScript Compilation**:
   - Run: `rtk proxy pnpm --dir apps/frontend typecheck` (0 errors).
3. **Production Build**:
   - Run: `rtk proxy pnpm --dir apps/frontend build` (31 routes built).
4. **Prefetch & E2E Validation**:
   - Run: `PREFETCH_TEST=1 rtk proxy pnpm --dir apps/frontend exec playwright test e2e/prefetch-optimization.spec.ts` (3/3 PASS).
