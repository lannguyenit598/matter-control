# Implementation Readiness Audit Report: UI & Accessibility Issues Remediation Plan

**Target File**: [`docs/implementation/ui-issues-remediation.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/ui-issues-remediation.md#L70-L251)  
**Target Scope**: Lines 70–251 (Detailed Implementation Plan, Phases 1–5)  
**Standard**: [Implementation Readiness Standard](file:///Users/nguyenvanlan/.gemini/config/plugins/egm/resources/document_standards/implementation-readiness-standard.md) (Zero-Decision Rule)  
**Reviewer**: `egm-implementation-readiness` (Pragmatic Tech Lead)

---

### Executive Summary
The Detailed Implementation Plan exhibits exceptionally high actionability. For code modifications across Phases 1–4, exact file paths, component parameter types, prop extensions, and copy-pasteable unified diffs are provided. There are **zero open architectural or design decisions** left to the implementer. However, the audit identified **brittle line-number citations** (notably in `select.tsx`) and **coverage gaps in the Phase 5 test plan**.

---

### Audit Findings

#### 1. Brittle Line-Number Target in `select.tsx`
- **Severity**: Major
- **Affected Scope**: Phase 2, Item 3 (`apps/frontend/src/components/atoms/select.tsx:135-139`, lines 127–134)
- **Finding & Guidance**:
  - The plan targets lines 135–139 in `apps/frontend/src/components/atoms/select.tsx` for updating trigger classes (`leading-normal max-sm:py-3`).
  - In the actual file, lines 135–139 contain the `leadingIcon` wrapper (`<div className={cn('relative min-w-0', className)}>` and icon rendering). The trigger `<select>` element and its `className` are actually located at **lines 157–161** (specifically line 159).
  - An implementer or automated tooling jumping directly to lines 135–139 will not find the target string.
  - **Guidance**: Update the target citation from `apps/frontend/src/components/atoms/select.tsx:135-139` to `apps/frontend/src/components/atoms/select.tsx:157-161`.

#### 2. Phase 5 Test Suite Coverage & Localization Assertions Gap
- **Severity**: Major
- **Affected Scope**: Phase 5, Item 1 (`apps/frontend/src/components/molecules/dialog.test.tsx`, lines 228–245)
- **Finding & Guidance**:
  - **Omission of automatic Vietnamese fallback test**: The proposed test cases in `dialog.test.tsx` test: (1) default English accessible name (`Close`), and (2) manual prop override (`closeAriaLabel="Đóng"`). They **do not** test that `resolvedCloseLabel` automatically defaults to `'Đóng'` when `useLocale()` resolves to `'vi'` without passing `closeAriaLabel`. In standard unit test runs, `useLocale()` defaults to `'en'`, leaving the Vietnamese branch of `resolvedCloseLabel` untested.
  - **Absence of unit assertions for other modified components**: The plan only updates `dialog.test.tsx`. No unit test assertions are specified to verify:
    - `AppSidebar` rendering `navAriaLabel` (or defaulting to `'Main'`).
    - `MatterSearch` rendering the ellipsis placeholder (`Search matters by name…` / `Tìm hồ sơ theo tên…`).
    - `CommandPalette` rendering `Ctrl\u00A0K` with `whitespace-nowrap`.
  - While existing test suites verify non-regression, the new behaviors lack dedicated unit verification.
  - **Guidance**:
    1. Append a test case to `dialog.test.tsx` wrapping `Dialog` in `<UiLocaleContext.Provider value="vi">` to assert that the close button receives `name: 'Đóng'` by default without `closeAriaLabel`.
    2. Add unit test assertions in `apps/frontend/src/features/matters/components/matter-search.test.tsx` checking that `screen.getByPlaceholderText(/Search matters by name…/)` is present.

#### 3. Minor Line-Number Drift in `layout.tsx`, `matter-search.tsx`, and `proof-panel.tsx`
- **Severity**: Nit
- **Affected Scope**:
  - Phase 1, Item 1: [`apps/frontend/src/app/(app)/layout.tsx:90`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/layout.tsx#L90-L98)
  - Phase 2, Item 2: [`apps/frontend/src/features/proof/components/proof-panel.tsx:755`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/proof/components/proof-panel.tsx#L755-L771)
  - Phase 4, Item 1: [`apps/frontend/src/features/matters/components/matter-search.tsx:1, 28, 62`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/matters/components/matter-search.tsx#L1-L65)
- **Finding & Guidance**:
  - In `layout.tsx`, `<summary>` is at line 93 (line 90 is `<QuickSearch />`).
  - In `proof-panel.tsx`, `validDays` input in `CriterionForm` is at lines 760–771 rather than 755–762.
  - In `matter-search.tsx`, `useLocale` import belongs at line 11 (line 1 is `'use client'`), hook invocation is line 29, and `placeholder` is line 64.
  - **Guidance**: Adjust line numbers in doc headers to match actual file positions to maintain documentation integrity.

#### 4. Implicit Import Clarification for `LocalizedText` in `proof-panel.tsx`
- **Severity**: Nit
- **Affected Scope**: Phase 4, Item 3 (`apps/frontend/src/features/proof/components/proof-panel.tsx:636`, lines 212–225)
- **Finding & Guidance**:
  - Phase 4 Item 3 introduces `<LocalizedText en="Save revision" vi="Lưu phiên bản" />` in `submitLabel`. While `LocalizedText` is already imported at line 7 of `proof-panel.tsx`, the task item does not explicitly mention this pre-existing import (unlike Phase 3.1, Phase 3.2, and Phase 4.1 which specify explicit import instructions).
  - **Guidance**: Clarify with `(LocalizedText already imported at line 7)` to eliminate any potential second-guessing by a junior developer.

#### 5. Default Fallback String Semantic Divergence in `AppSidebar`
- **Severity**: Nit
- **Affected Scope**: Phase 3, Item 2 (`apps/frontend/src/components/organisms/app-sidebar.tsx`, lines 165–175)
- **Finding & Guidance**:
  - `AppSidebarProps` defines `navAriaLabel?: string`, and `AppSidebar` defaults to `navAriaLabel ?? 'Main'`.
  - In `layout.tsx`, `AuthenticatedWorkbench` passes `navAriaLabel={locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'}`.
  - If any consumer omits `navAriaLabel`, it falls back to `'Main'` rather than `'Primary navigation'`. While unambiguous, this creates a slight naming inconsistency.
  - **Guidance**: Consider aligning fallback to `navAriaLabel ?? 'Primary navigation'` or explicitly documenting `'Main'` as the fallback for external tests/consumers.

---

### Verification Against Core Audit Criteria

1. **Actionability (Zero-Decision Rule)**:  
   **PASS**. A developer knows exactly what to code, where, and how. Every change provides code diffs, exact prop types, and explicit hook calls.
2. **Imports, Component Parameters, Props & File Paths**:  
   **PASS**. All file paths are valid repo paths. Prop modifications (`closeAriaLabel`, `navAriaLabel`, `step`, `inputMode`) and imports are fully typed and unambiguous.
3. **Phase 5 Verification & Commands**:  
   **PASS WITH GUIDANCE**. The command sequence accurately reflects `package.json` scripts and `playwright.config.ts` requirements:
   - Vitest: `rtk proxy pnpm --dir apps/frontend test`
   - Typecheck: `rtk proxy pnpm --dir apps/frontend typecheck`
   - Build: `rtk proxy pnpm --dir apps/frontend build` (correctly recognized as prerequisite for prefetch)
   - Playwright: `PREFETCH_TEST=1 rtk proxy pnpm --dir apps/frontend exec playwright test`
   *(Test coverage assertions should be expanded per Finding #2).*
4. **Brittle Citations & Design Decisions**:  
   No open design decisions remain. Brittle line citations are identified in Finding #1 and Finding #3.
