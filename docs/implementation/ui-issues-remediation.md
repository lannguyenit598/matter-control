# UI & Accessibility Issues Remediation Plan (Post-EGM Review)

This design document specifies the verified remediation plan for UI, accessibility (A11y), and usability issues in `apps/frontend`, refined and approved through the Elephant-Goldfish Model (EGM) Review Protocol.

## Feature Specification

### 1. Form Inline Validation Announcement (`form-field.tsx`)
- **Location**: `apps/frontend/src/components/molecules/form-field.tsx:37-49`
- **Issue & Resolution**: Inline error text `<p id={errorId}>` is already associated with the input control via `aria-describedby` and `aria-invalid="true"`. Adding `role="alert"` causes screen reader thrashing and duplicate speech announcements on multi-field failures. Global validation summaries are already dispatched via `ActionAnnouncer`.
- **Specification**: Retain the existing `aria-describedby` and `aria-invalid` architecture. Do NOT add `role="alert"` to individual inline error paragraphs. Focus shifting on server validation rejection belongs at the form root level in `IntentForm` (`form.querySelector('[aria-invalid="true"]')?.focus()`), preserving `FormField` as a pure presenter.

### 2. Visible Keyboard Focus Ring on Preferences Menu (`layout.tsx`)
- **Location**: `apps/frontend/src/app/(app)/layout.tsx:90`
- **Issue**: The mobile `<details>` `<summary>` element for preferences (`Settings2` trigger) lacks a visible focus indicator. Keyboard users tabbing through header controls cannot distinguish when this summary has focus.
- **Specification**: Apply explicit focus utilities `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-md` directly to the `<summary>` element at line 90.

### 3. Decorative Icon Hiding in Primary Navigation (`navigation.tsx`)
- **Location**: `apps/frontend/src/config/navigation.tsx:40`
- **Issue**: Navigation menu icons (`ListChecks`, `ClipboardCheck`, `FolderOpen`, `Building2`) are rendered as `<Icon />` without `aria-hidden="true"`. Because navigation items already possess explicit text labels (`LocalizedText`), the icons are purely decorative.
- **Specification**: Pass `<Icon aria-hidden />` when mapping `mainDestinations` into `mainNavigation`.

### 4. Native Select & Form Controls Text Contrast (`input.tsx`)
- **Location**: `apps/frontend/src/components/atoms/input.tsx:6-7`
- **Issue**: The canonical `fieldControlClass` sets `bg-card` but omits `text-foreground`. In Windows Dark Mode or High Contrast themes, controls inheriting from ancestors with color overrides can render unreadable text against the card background.
- **Specification**: Add `text-foreground` directly to `fieldControlClass` in `input.tsx` to fix `Input`, `Textarea`, and `Select` uniformly across the design system.

### 5. Virtual Numeric Keypad for Valid Days Input (`proof-panel.tsx`)
- **Location**: `apps/frontend/src/features/proof/components/proof-panel.tsx:614, 755`
- **Issue**: The `validDays` inputs (in both `AssessForm` and `CriterionForm`) are declared as `type="number"` without `inputMode="numeric"` or integer constraints. On mobile devices, the virtual keyboard may open an alphanumeric layout or allow invalid fractions.
- **Specification**: Add `inputMode="numeric"` and `step={1}` to both `validDays` input instances in `proof-panel.tsx`.

### 6. Internationalization for Accessibility Labels (`dialog.tsx`, `app-sidebar.tsx`)
- **Location**: `apps/frontend/src/components/molecules/dialog.tsx:10-23, 31-39, 117-125`, `apps/frontend/src/components/organisms/app-sidebar.tsx:7-15, 21`, `apps/frontend/src/app/(app)/layout.tsx:33-44`
- **Issue**:
  - `dialog.tsx`: The close icon button carries a hardcoded English `aria-label="Close"`.
  - `app-sidebar.tsx`: The `<nav>` element has hardcoded English `aria-label="Main"`. `AppSidebar` is a React Server Component (RSC); calling client hooks inside it violates RSC boundaries.
- **Specification**:
  - In `dialog.tsx`: Import `useLocale`, expose optional `closeAriaLabel?: string` in `DialogProps`, destructure `closeAriaLabel` in `Dialog` parameters, and default to `closeAriaLabel ?? (locale === 'vi' ? 'Đóng' : 'Close')`.
  - In `app-sidebar.tsx`: Add `navAriaLabel?: string` to `AppSidebarProps`, destructure `navAriaLabel` in `AppSidebar` parameters, and render `<nav aria-label={navAriaLabel ?? 'Main'} ...>`.
  - In `layout.tsx:33-44`: In `AuthenticatedWorkbench`, resolve `const locale = await uiLocale()` and pass `navAriaLabel={locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'}` to `<AppSidebar>`.

### 7. Microcopy, Placeholder Localization, and Shortcut Badges (`matter-search.tsx`, `command-palette.tsx`)
- **Location**: `apps/frontend/src/features/matters/components/matter-search.tsx:28, 62`, `apps/frontend/src/components/organisms/command-palette.tsx:87-92`
- **Issue**:
  - Search input placeholder is unlocalized English and lacks standard ellipsis (`"Search matters by name"`).
  - Shortcut badge on macOS must adhere to Apple Human Interface Guidelines (HIG) without space (`⌘K`), while Windows/Linux uses a non-breaking space (`'Ctrl\u00A0K'`). Badge must not wrap lines.
- **Specification**:
  - In `matter-search.tsx`: Localize placeholder as `{locale === 'vi' ? 'Tìm hồ sơ theo tên…' : 'Search matters by name…'}`.
  - In `command-palette.tsx`: Format shortcut badge as `{isApple ? '⌘K' : 'Ctrl\u00A0K'}` and add `whitespace-nowrap` to `<kbd>`.

### 8. Title Case Standardization with Translation Preservation
- **Location**:
  - `apps/frontend/src/features/workspaces/components/create-workspace-form.tsx:37`
  - `apps/frontend/src/features/requirements/components/create-requirement-form.tsx:20`
  - `apps/frontend/src/features/proof/components/proof-panel.tsx:636`
- **Issue**: Action buttons use sentence case on English labels. In bilingual components, only English copy takes Chicago Title Case (Vietnamese grammar forbids title-casing every word).
- **Specification**:
  - In `create-workspace-form.tsx:37`: Update to `<LocalizedText en="Create Workspace" vi="Tạo không gian làm việc" />`.
  - In `create-requirement-form.tsx:20`: Update to `<LocalizedText en="Create Requirement" vi="Tạo yêu cầu" />`.
  - In `proof-panel.tsx:636`: Replace raw strings with `<LocalizedText en="Save Revision" vi="Lưu phiên bản" />` and `<LocalizedText en="Add Criterion" vi="Thêm tiêu chí" />`.

### 9. Vertical Text Misalignment in Native Select on Small Screens (`select.tsx`)
- **Location**: `apps/frontend/src/components/atoms/select.tsx:135-139`
- **Issue**: In native `<select>` controls on mobile (`max-sm:min-h-11 max-sm:py-2.5`), WebKit/Blink renders option text baseline biased towards top padding rather than vertically centering within the 44px touch target. When paired with `leadingIcon` (e.g. `Languages` in `LocaleToggle`) and `ChevronDown` (both centered at `top-1/2 -translate-y-1/2`), the label text appears shifted noticeably upward ("lệch lên trên").
- **Specification**: Adjust mobile vertical padding to `max-sm:py-3` and ensure `leading-normal` at lines 135-139 to align text baseline with the vertical center of flanking icons and the 44-47px touch container.

### 10. Multi-column Form Grid Alignment Invariant (`proof-panel.tsx`)
- **Location**: `apps/frontend/src/features/proof/components/proof-panel.tsx:744-765`
- **Issue**: Multi-column form layouts (`grid sm:grid-cols-2 items-start`) become vertically misaligned when one field's label overflows to two lines (e.g., historical `"Valid for (days once accepted, 0 = unbounded)"` dropping `"unbounded)"` to line 2) while adjacent fields have single-line labels (`"Required?"`).
- **Specification**: Preserve invariant separation between concise field label (`"Valid for (days)"`) and auxiliary explanations placed into `hint` (`"Days once accepted; 0 = unbounded."`). Both labels remain single-line, preserving identical top-alignment for adjacent form controls. Invariant verified; no code diff required.

---

## Detailed Implementation Plan

### Phase 1: Core Accessibility & Focus States (P1)
1. **Header Preferences Focus Ring**:
   - File: `apps/frontend/src/app/(app)/layout.tsx:90`
   - Target: `<summary>` element wrapping `<Settings2>`
   - Diff:
     ```diff
     - <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md hover:bg-accent">
     + <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-md hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring">
     ```

2. **Decorative Navigation Icon Hiding**:
   - File: `apps/frontend/src/config/navigation.tsx:40`
   - Target: `mainNavigation` icon mapping
   - Diff:
     ```diff
     - icon: Icon ? <Icon /> : undefined,
     + icon: Icon ? <Icon aria-hidden /> : undefined,
     ```

3. **Inline Form Field A11y Verification**:
   - File: `apps/frontend/src/components/molecules/form-field.tsx:45-49`
   - Retain current structure (`aria-invalid` and `aria-describedby`). Do NOT add `role="alert"` to `<p id={errorId}>`. Form-level submission error summary remains in `ActionAnnouncer`.

### Phase 2: Form Controls & Mobile Input Modes (P2)
1. **Design System Text Contrast in Dark Mode**:
   - File: `apps/frontend/src/components/atoms/input.tsx:6-7`
   - Target: `fieldControlClass` definition
   - Diff:
     ```diff
      export const fieldControlClass =
     -  'control-target w-full min-w-0 rounded-md border border-input bg-card px-3 text-sm transition-colors duration-160 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled aria-invalid:border-destructive aria-invalid:outline-destructive'
     +  'control-target w-full min-w-0 rounded-md border border-input bg-card text-foreground px-3 text-sm transition-colors duration-160 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:bg-muted disabled:text-disabled aria-invalid:border-destructive aria-invalid:outline-destructive'
     ```

2. **Virtual Numeric Keypad for Valid Days**:
   - File: `apps/frontend/src/features/proof/components/proof-panel.tsx:614, 755`
   - Target 1 (Line 614, `AssessForm`):
     ```diff
     - {(c) => <Input type="number" min={0} max={36500} name="validDays" {...c} />}
     + {(c) => <Input type="number" min={0} max={36500} step={1} inputMode="numeric" name="validDays" {...c} />}
     ```
   - Target 2 (Lines 755–762, `CriterionForm`):
     ```diff
       <Input
         type="number"
         min={0}
         max={36500}
     +   step={1}
     +   inputMode="numeric"
         name="validDays"
         defaultValue={existing?.validDays ?? 0}
         {...c}
       />
     ```

3. **Native Select Vertical Alignment on Mobile**:
   - File: `apps/frontend/src/components/atoms/select.tsx:135-139`
   - Target: `Select` component trigger classes
   - Diff:
     ```diff
     - 'ui-select min-h-10 appearance-none truncate py-2 pr-9 text-left whitespace-nowrap max-sm:min-h-11 max-sm:py-2.5',
     + 'ui-select min-h-10 appearance-none truncate py-2 pr-9 text-left whitespace-nowrap leading-normal max-sm:min-h-11 max-sm:py-3',
     ```

4. **Multi-column Form Grid Alignment Invariant (Verification Only)**:
   - File: `apps/frontend/src/features/proof/components/proof-panel.tsx:744-765`
   - Target: `FormField` label and hint in `CriterionForm`
   - Verify that `Valid for (days)` remains a single-line label with `Days once accepted; 0 = unbounded.` in `hint`, aligning horizontally with the adjacent `Required?` field. Invariant verified in current code; no code diff required.

### Phase 3: Accessibility Internationalization (P2)
1. **Dialog Close Button Bilingual Accessible Name**:
   - File: `apps/frontend/src/components/molecules/dialog.tsx:10-23, 31-39, 117-125`
   - Import `useLocale` from `@/hooks/use-locale`.
   - Add `closeAriaLabel?: string` to `DialogProps`.
   - Update `Dialog` parameter destructuring and resolve label:
     ```diff
      export function Dialog({
        open,
        onOpenChange,
        title,
        description,
        children,
        className,
        keepMounted,
     +  closeAriaLabel,
      }: DialogProps) {
     +  const locale = useLocale()
     +  const resolvedCloseLabel = closeAriaLabel ?? (locale === 'vi' ? 'Đóng' : 'Close')
      ...
     -  <Button variant="ghost" size="icon" aria-label="Close" className="-mt-2 -mr-2 size-8" onClick={() => onOpenChange(false)}>
     +  <Button variant="ghost" size="icon" aria-label={resolvedCloseLabel} className="-mt-2 -mr-2 size-8" onClick={() => onOpenChange(false)}>
     ```

2. **Sidebar Navigation Accessible Name (Preserving RSC Boundary)**:
   - File 1: `apps/frontend/src/components/organisms/app-sidebar.tsx:7-15, 21`
     - Add `navAriaLabel?: string` to `AppSidebarProps`.
     - Update `AppSidebar` destructuring and `<nav>` element:
       ```diff
       - export function AppSidebar({ brand, items, footer, className }: AppSidebarProps) {
       + export function AppSidebar({ brand, items, footer, className, navAriaLabel }: AppSidebarProps) {
       ...
       - <nav aria-label="Main" className="app-navigation flex-1">
       + <nav aria-label={navAriaLabel ?? 'Main'} className="app-navigation flex-1">
       ```
   - File 2: `apps/frontend/src/app/(app)/layout.tsx:33-44`
     - Import `uiLocale` from `@/lib/locale-server`.
     - In `AuthenticatedWorkbench` (lines 33-44):
       ```tsx
       const locale = await uiLocale()
       ```
     - Pass to `AppSidebar`:
       ```tsx
       <AppSidebar
         navAriaLabel={locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'}
         ...
       />
       ```

### Phase 4: Typography & Button Title Case (P3)
1. **Search Input Placeholder Localization & Ellipsis**:
   - File: `apps/frontend/src/features/matters/components/matter-search.tsx:1, 28, 62`
   - Import `useLocale` from `@/hooks/use-locale`.
   - At line 28 (inside `MatterSearch`), call `const locale = useLocale()`.
   - Update line 62:
     ```diff
     - placeholder="Search matters by name"
     + placeholder={locale === 'vi' ? 'Tìm hồ sơ theo tên…' : 'Search matters by name…'}
     ```

2. **Apple HIG Shortcut Formatting**:
   - File: `apps/frontend/src/components/organisms/command-palette.tsx:87-92`
   - Keep `'⌘K'` (no space) on macOS, use `'Ctrl\u00A0K'` on Windows/Linux, and prevent wrapping:
     ```diff
     - <kbd aria-hidden className="hidden rounded border bg-muted px-1 text-xs text-muted-foreground sm:inline">
     -   {isApple ? '⌘K' : 'Ctrl K'}
     + <kbd aria-hidden className="hidden rounded border bg-muted px-1 text-xs whitespace-nowrap text-muted-foreground sm:inline">
     +   {isApple ? '⌘K' : 'Ctrl\u00A0K'}
       </kbd>
     ```

3. **Title Case Standardization (Preserving Vietnamese Translations)**:
   - File 1: `apps/frontend/src/features/workspaces/components/create-workspace-form.tsx:37`
     ```diff
     - submitLabel={<LocalizedText en="Create workspace" vi="Tạo không gian làm việc" />}
     + submitLabel={<LocalizedText en="Create Workspace" vi="Tạo không gian làm việc" />}
     ```
   - File 2: `apps/frontend/src/features/requirements/components/create-requirement-form.tsx:20`
     ```diff
     - submitLabel={<LocalizedText en="Create requirement" vi="Tạo yêu cầu" />}
     + submitLabel={<LocalizedText en="Create Requirement" vi="Tạo yêu cầu" />}
     ```
   - File 3: `apps/frontend/src/features/proof/components/proof-panel.tsx:636`
     ```diff
     - submitLabel={existing ? 'Save revision' : 'Add criterion'}
     + submitLabel={
     +   existing ? (
     +     <LocalizedText en="Save Revision" vi="Lưu phiên bản" />
     +   ) : (
     +     <LocalizedText en="Add Criterion" vi="Thêm tiêu chí" />
     +   )
     + }
     ```

### Phase 5: Verification & Regression Suite
1. **Unit Test Suite**:
   - Update `apps/frontend/src/components/molecules/dialog.test.tsx` by appending the following test cases to `describe('Dialog', ...)`:
     ```tsx
     it('renders default close button accessible name', () => {
       setup()
       expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
     })

     it('renders custom close button accessible name when closeAriaLabel is provided', () => {
       render(
         <Dialog open onOpenChange={() => {}} title="Edit" closeAriaLabel="Đóng">
           <input aria-label="Name" />
         </Dialog>,
       )
       expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument()
     })
     ```
   - Run Vitest: `rtk proxy pnpm --dir apps/frontend test`.
2. **Typecheck**:
   - Run: `rtk proxy pnpm --dir apps/frontend typecheck`.
3. **Mandatory Production Build (Prerequisite for Prefetch Playwright)**:
   - Run: `rtk proxy pnpm --dir apps/frontend build`.
4. **Playwright E2E & Prefetch Suite**:
   - Run: `PREFETCH_TEST=1 rtk proxy pnpm --dir apps/frontend exec playwright test`.
