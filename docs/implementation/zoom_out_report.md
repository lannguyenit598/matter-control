# Stage 5: Initial Zoom-Out Review Report (Round 2)

- **Target**: [`docs/implementation/ui-issues-remediation.md`](ui-issues-remediation.md)
- **Reviewer**: Skeptical Architect (`egm-zoom-out`)
- **Date**: 2026-11-02
- **Verdict**: ✅ **PASS (with 3 Nits)**

---

## 1. Executive Architectural Verdict

The remediation plan in `docs/implementation/ui-issues-remediation.md` exemplifies **architectural restraint, simplicity, and strict adherence to YAGNI**. It systematically rejects speculative abstractions, heavy UI/i18n libraries, and over-engineered wrappers in favor of direct HTML/A11y standards, existing Tailwind tokens, and canonical primitives.

The design is **approved for implementation** with minor documentation/destructuring nits noted below.

---

## 2. Evaluation Across the 10 Remediation Areas

### Area 1: Form Inline Validation Announcement (`form-field.tsx`)
- **Simplicity & Minimalism**: **Exemplary**. The plan explicitly rejects adding `role="alert"` to `<p id={errorId}>`, avoiding screen reader announcement thrashing and duplicate speech on multi-field forms.
- **Codebase Reuse**: Leverages existing `aria-describedby`, `aria-invalid`, and the global `ActionAnnouncer`.

### Area 2: Visible Keyboard Focus Ring on Preferences Menu (`layout.tsx`)
- **Simplicity & Minimalism**: Adds standard Tailwind focus ring classes (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-md`) directly to `<summary>`. Zero custom CSS rules, zero JS event listeners.
- **Codebase Reuse**: Reuses design token `--ring` via `@theme inline` (`outline-ring`).

### Area 3: Decorative Icon Hiding in Primary Navigation (`navigation.tsx`)
- **Simplicity & Minimalism**: Injects `aria-hidden` directly into `<Icon aria-hidden />` during `mainNavigation` mapping.
- **Codebase Reuse**: Avoids adding wrapper `<span>` tags or altering navigation consumers (`NavMenu`, `AppSidebar`, `BottomNav`).

### Area 4: Native Select & Form Controls Text Contrast (`input.tsx`)
- **Simplicity & Minimalism**: Single point of truth. Adding `text-foreground` to `fieldControlClass` resolves text contrast under Windows Dark Mode and High Contrast modes across all text controls in one edit.
- **Codebase Reuse**: Directly shared by `Input`, `Textarea`, and `Select` through the exported `fieldControlClass` utility.

### Area 5: Virtual Numeric Keypad for Valid Days (`proof-panel.tsx`)
- **Simplicity & Minimalism**: Uses native HTML attributes `inputMode="numeric"` and `step={1}`. Rejects heavy third-party masking or numeric input libraries.
- **Codebase Reuse**: Spread through standard `Input` (`ComponentProps<'input'>`).

### Area 6: Bilingual Dialog/Sidebar A11y Names (`dialog.tsx`, `app-sidebar.tsx`, `layout.tsx`)
- **Simplicity & Minimalism**:
  - `Dialog`: Uses existing `useLocale()` hook and simple ternary defaulting (`closeAriaLabel ?? (locale === 'vi' ? 'Đóng' : 'Close')`).
  - `AppSidebar`: Preserves React Server Component (RSC) boundary by exposing `navAriaLabel?: string` and resolving `await uiLocale()` in `layout.tsx`.
- **Codebase Reuse**: Achieves 100% design symmetry with `BottomNav` (which already uses `locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'`) using `@/lib/locale-server` and `@/hooks/use-locale`.

### Area 7: Microcopy, Apple HIG Shortcuts & Localized Placeholder (`matter-search.tsx`, `command-palette.tsx`)
- **Simplicity & Minimalism**: Adheres strictly to platform conventions (Apple HIG `⌘K` without space; non-breaking space `'Ctrl\u00A0K'` on Windows/Linux; `whitespace-nowrap`).
- **Codebase Reuse**: Uses `useLocale()` directly for string resolution; avoids creating unnecessary shortcut registration frameworks.

### Area 8: Title Case Standardization with Translation Preservation
- **Simplicity & Minimalism**: Replaces raw unlocalized English strings in `proof-panel.tsx:636` with `<LocalizedText />` while strictly respecting grammar rules (Chicago Title Case for English, lowercase for Vietnamese).
- **Codebase Reuse**: Uses existing `<LocalizedText en="..." vi="..." />` seamlessly within `IntentForm`'s `submitLabel: ReactNode`.

### Area 9: Native Select Dropdown Vertical Alignment on Mobile (`select.tsx`)
- **Simplicity & Minimalism**: Fixes mobile baseline misalignment directly via CSS utilities (`leading-normal max-sm:py-3`). Rejects replacing native `<select>` with custom dropdown primitives (e.g. Radix/Floating UI), preserving accessibility, performance, and native mobile pickers.
- **Codebase Reuse**: Direct enhancement to `Select` in `apps/frontend/src/components/atoms/select.tsx`.

### Area 10: Multi-column Form Grid Alignment (`proof-panel.tsx`, `FormField`)
- **Simplicity & Minimalism**: Solves form grid misalignment at the root cause by keeping field labels concise (`"Valid for (days)"`) and offloading secondary explanations into `hint` (`"Days once accepted; 0 = unbounded."`).
- **Codebase Reuse**: Respects `FormField` component architecture (`label` above control, `hint` below control). Completely avoids brittle CSS subgrid hacks or extra alignment wrappers.

---

## 3. Findings & Recommendations

### Finding 1: Explicit Destructuring of `closeAriaLabel` in `Dialog`
- **Severity**: **Nit**
- **Affected Scope**: Section 6 & Phase 3.1 (`apps/frontend/src/components/molecules/dialog.tsx:31-39, 147-157`)
- **Recommendation**: Ensure the implementation destructs `closeAriaLabel` along with other props to prevent an `undefined` reference.

### Finding 2: Minor Line Number Reference Drift in `layout.tsx`
- **Severity**: **Nit**
- **Affected Scope**: Section 2 & Phase 1.1 (`apps/frontend/src/app/(app)/layout.tsx:84`)
- **Recommendation**: Target `<summary>` element wrapping `<Settings2>` is located at line 90 (lines 89–95).

### Finding 3: Historical Parity in Unmounted `MobileNav`
- **Severity**: **Nit**
- **Affected Scope**: Section 6 (`apps/frontend/src/components/organisms/mobile-nav.tsx:34`)
- **Recommendation**: If `MobileNav` is maintained for future drawer use, consider aligning its `<nav>` label with `BottomNav` and `AppSidebar`.
