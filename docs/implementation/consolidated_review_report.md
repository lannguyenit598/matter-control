# Consolidated EGM Review Report: UI & A11y Issues Remediation (Round 2)

- **Target Document**: [`docs/implementation/ui-issues-remediation.md`](ui-issues-remediation.md)
- **Review Pipeline**: EGM Goldfish Review Protocol (Consolidated Full Flow Re-Audit)
- **Reviewers**:
  - Stage 5 (Initial Zoom Out): `egm-zoom-out` (Skeptical Architect)
  - Stage 6 (Comprehension Test): `egm-comprehension` (Naive Reader)
  - Stage 7 (Critic Review): `egm-design` (Hostile Design Critic)
  - Stage 8 (Intermediate Zoom Out): `egm-zoom-out` (Skeptical Architect)
  - Stage 9 (Implementation Readiness): `egm-implementation-readiness` (Pragmatic Tech Lead)
- **Date**: 2026-11-02
- **Final Verdict**: ✅ **APPROVED FOR EXECUTION (100% CONVERGENCE REACHED)**

---

## 1. Executive Summary

This second round of the **EGM Goldfish Review Protocol** executed an exhaustive re-audit of the refined remediation plan in `docs/implementation/ui-issues-remediation.md`. The scope encompasses the 8 original accessibility/usability issues plus the 2 visual defect areas highlighted in the user's screenshots:
1. **Dropdown Vertical Alignment**: On small screens, native `<select>` text baseline was shifted upward relative to the 16px flanking icons (`Languages`, `ChevronDown`) due to WebKit UA text alignment quirks with 10px padding inside a 44px touch target.
2. **Form Grid Alignment & Label Wrapping**: Multi-column form layouts became vertically misaligned when a long label wrapped to multiple lines while adjacent labels remained single-line.

Through the multi-perspective audit:
- **Blockers Resolved**: Destructuring of `closeAriaLabel` in `Dialog` and `navAriaLabel` in `AppSidebar` are explicitly integrated into component function signatures, preventing TypeScript compilation errors.
- **Architectural Minimalism Confirmed**: Rejecting `role="alert"` in favor of `aria-describedby` + `ActionAnnouncer` was reaffirmed as standard W3C practice; speculative abstractions (such as CSS `subgrid` or imperative error event buses) were firmly rejected to preserve component encapsulation.
- **Precision Verified**: All file paths, line numbers (`select.tsx:135-139`, `layout.tsx:90`, `matter-search.tsx:28`), and test snippets (`dialog.test.tsx`) match the actual codebase.

---

## 2. Traceability Matrix

| Area / Issue | Stage 5 (Zoom Out) | Stage 6 (Comprehension) | Stage 7 (Critic) | Stage 8 (Inter. Zoom Out) | Stage 9 (Readiness) | Final Consolidated Resolution |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Form Error A11y** (`form-field.tsx`) | Validated | Clear | 🟡 **Major**: Focus shift needed on submit failure | Reaffirmed stateless presenter; form root handles focus | Validated | **REJECT `role="alert"`**. Inline fields use `aria-describedby` + `aria-invalid`. Form root (`IntentForm`) manages submit failure notification. |
| **2. Header Preferences Focus** (`layout.tsx`) | 🟢 **Nit**: Line 90 not 84 | 🟡 **Major**: Line 90 accuracy | 🟢 **Nit**: `<details>` Escape dismissal | Upheld line 90; native Tailwind utilities | Validated | In `layout.tsx:90`, apply `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-md` to `<summary>`. |
| **3. Nav Icons A11y** (`navigation.tsx`) | Approved | Clear | Approved | Component boundary validated | Validated | In `navigation.tsx:40`, pass `Icon ? <Icon aria-hidden /> : undefined`. |
| **4. Select Text Contrast** (`input.tsx`) | Approved | Clear | 🟢 **Nit**: Token contrast confirmed AAA | Single source of truth | Validated | In `input.tsx:6-7`, add `text-foreground` directly to `fieldControlClass`. |
| **5. Numeric Keypad** (`proof-panel.tsx`) | Approved | Clear | Approved | Leverages standard HTML5 | Validated | Add `inputMode="numeric"` and `step={1}` to both `validDays` inputs (lines 614 & 755). |
| **6. Dialog & Sidebar i18n** (`dialog.tsx`, `app-sidebar.tsx`) | 🟢 **Nit**: Destructure `closeAriaLabel` | 🔴 **Blocker**: Missing destructuring in `Dialog` & `AppSidebar` | 🔴 **Blocker**: Compilation error on missing destructuring | 🔴 **Blocker Upheld**: Explicit destructuring diffs | 🟢 **Nit**: Line reference 117–125 | In `dialog.tsx:31`, destructure `closeAriaLabel`. In `app-sidebar.tsx:15`, destructure `navAriaLabel`. Pass label from `layout.tsx:33-44`. |
| **7. Shortcuts & Microcopy** (`matter-search.tsx`, `command-palette.tsx`) | Approved | 🟢 **Nit**: Specify line 28 for hook | Approved | HIG compliance confirmed | Validated | Apple HIG `⌘K` (no space), Windows/Linux `'Ctrl\u00A0K'` (`whitespace-nowrap`). In `matter-search.tsx:28`, insert `useLocale()` and localize placeholder. |
| **8. Button Title Case** (`LocalizedText`) | Approved | Clear | Approved | Grammar preserved | Validated | Capitalize only English `en` prop (`"Create Workspace"`, `"Save Revision"`). Preserve Vietnamese grammar (`"Tạo không gian làm việc"`). |
| **9. Select Vertical Alignment** (`select.tsx`) | Approved | 🟡 **Major**: Target lines 135–139 | 🟡 **Major**: Fix line drift; verify 44–47px touch height | Upheld lines 135–139; confirmed baseline centering | Validated | In `select.tsx:135-139`, replace classes with `leading-normal max-sm:min-h-11 max-sm:py-3` to center text baseline with 16px flanking icons. |
| **10. Form Grid Alignment** (`proof-panel.tsx`) | Approved | 🟡 **Major**: Clarify invariant | 🟡 **Major**: Invariant already present; reject subgrid | Reclassified as Invariant; subgrid rejected | Validated | Verify invariant separation of concise `label` (`"Valid for (days)"`) and `hint` (`"Days once accepted; 0 = unbounded."`). No code diff required. |
| **Verification Prerequisite** | Validated | Validated | Validated | Validated | 🟡 **Major**: Added exact test diff in `dialog.test.tsx` | Run Vitest, Typecheck, mandatory `pnpm build`, and `PREFETCH_TEST=1` Playwright suite. |

---

## 3. Prioritized Implementation Phases

### Phase 1: Core Accessibility & Focus States (P1)
1. **Header Preferences Focus Ring**: Apply Tailwind focus ring classes to `<summary>` in `apps/frontend/src/app/(app)/layout.tsx:90`.
2. **Decorative Navigation Icons**: Inject `aria-hidden` into `<Icon />` mapping in `apps/frontend/src/config/navigation.tsx:40`.
3. **Inline Form Field A11y Invariant**: Retain `aria-describedby` and `aria-invalid` in `form-field.tsx`; reject `role="alert"`.

### Phase 2: Form Controls, Mobile Alignment & Touch Targets (P2)
4. **Design System Text Contrast**: Add `text-foreground` to `fieldControlClass` in `apps/frontend/src/components/atoms/input.tsx:6-7`.
5. **Virtual Numeric Keypad**: Add `inputMode="numeric"` and `step={1}` to `validDays` inputs in `proof-panel.tsx:614, 755`.
6. **Native Select Vertical Alignment on Mobile**: Update trigger classes in `apps/frontend/src/components/atoms/select.tsx:135-139` to `leading-normal max-sm:min-h-11 max-sm:py-3`.
7. **Form Grid Alignment Invariant**: Verify concise `label` and auxiliary `hint` in `proof-panel.tsx:744-765`.

### Phase 3: Accessibility Internationalization (P2)
8. **Dialog Close Button Accessible Name**: In `apps/frontend/src/components/molecules/dialog.tsx:10-39, 117-125`, add `closeAriaLabel` to `DialogProps`, destructure it in `Dialog`, and resolve localized fallback (`useLocale`).
9. **Sidebar Navigation Accessible Name**: In `apps/frontend/src/components/organisms/app-sidebar.tsx:7-15, 21`, add `navAriaLabel` to `AppSidebarProps` and destructure in `AppSidebar`. In `apps/frontend/src/app/(app)/layout.tsx:33-44`, resolve `const locale = await uiLocale()` and pass to `<AppSidebar>`.

### Phase 4: Typography, Shortcuts & Microcopy (P3)
10. **Search Input Placeholder Localization**: In `apps/frontend/src/features/matters/components/matter-search.tsx:28, 62`, invoke `useLocale()` and localize placeholder with Unicode ellipsis (`…`).
11. **Apple HIG Shortcuts**: In `apps/frontend/src/components/organisms/command-palette.tsx:87-92`, use `⌘K` for Apple, `'Ctrl\u00A0K'` for non-Apple, and add `whitespace-nowrap`.
12. **Title Case Standardization**: Capitalize English props in `create-workspace-form.tsx:37`, `create-requirement-form.tsx:20`, and `proof-panel.tsx:636`, while preserving Vietnamese translations intact.

### Phase 5: Verification & Regression Testing
13. **Unit Tests**: Append test cases for `closeAriaLabel` to `apps/frontend/src/components/molecules/dialog.test.tsx` and run `rtk proxy pnpm --dir apps/frontend test`.
14. **Typecheck**: Run `rtk proxy pnpm --dir apps/frontend typecheck`.
15. **Production Build**: Run `rtk proxy pnpm --dir apps/frontend build`.
16. **Playwright Suite**: Run `PREFETCH_TEST=1 rtk proxy pnpm --dir apps/frontend exec playwright test`.

---

## 4. Final Sign-off

The remediation plan has successfully passed all 5 stages of the EGM Goldfish Review Protocol in Round 2. All previous blockers and majors have been resolved, line references verified against the source code, and design tokens validated.

**Status**: ✅ **READY TO IMPLEMENT**.
