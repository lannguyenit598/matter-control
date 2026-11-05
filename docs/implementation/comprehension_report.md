# Comprehension Audit Report: UI & Accessibility Issues Remediation Plan

**Target Document**: [`docs/implementation/ui-issues-remediation.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/ui-issues-remediation.md) (Lines 1–251)  
**Standard**: [Re-Implementation Standard](file:///Users/nguyenvanlan/.gemini/config/plugins/egm/resources/document_standards/re-implementation-standard.md) (Zero-Assumption Rule)  
**Review Mode**: REVIEW  
**Reviewer**: `egm-comprehension` (Naive Reader)

---

### Findings

#### 1. Severity: Blocker
- **Affected Scope**: Section 1 (`### 1. Form Inline Validation Announcement (form-field.tsx)`, lines 7–10) & Phase 1.3 (`Inline Form Field A11y Verification`, lines 91–94)
- **Discrepancy Description & Rationale**:
  Section 1 specifies: *"Focus shifting on server validation rejection belongs at the form root level in `IntentForm` (`form.querySelector('[aria-invalid="true"]')?.focus()`), preserving `FormField` as a pure presenter."*  
  However, Phase 1.3 only addresses `form-field.tsx` as a retention check and provides no diff, implementation steps, or lifecycle hook placement for `IntentForm` (`apps/frontend/src/components/organisms/intent-form.tsx`). Furthermore, `IntentForm` currently does not contain any such focus shifting logic.  
  A fresh developer cannot determine whether modifying `IntentForm` is an actionable requirement in this task or merely an architectural rationale. If actionable, the developer must guess where to execute the focus call (e.g., inside `start()`, an effect, or error boundary). The document must explicitly state whether `IntentForm` modification is deferred/out-of-scope or provide the exact diff and trigger lifecycle.

---

#### 2. Severity: Major
- **Affected Scope**: Section 9 (`### 9. Vertical Text Misalignment in Native Select on Small Screens (select.tsx)`, lines 58–62) & Phase 2.3 (`Native Select Vertical Alignment on Mobile`, lines 127–134)
- **Discrepancy Description & Rationale**:
  The document points to `apps/frontend/src/components/atoms/select.tsx:135-139` as the location for the select trigger classes and diff. In reality, lines 135–139 of `select.tsx` define the outer `<div>` wrapper and `leadingIcon` container. The actual trigger classes on `<select>` are located at line 159.  
  A naive reader attempting to locate or patch lines 135–139 will encounter mismatched markup and must guess where to apply the changes.

---

#### 3. Severity: Major
- **Affected Scope**: Undefined Concepts & Missing Types across Sections 4, 6, 7, 8 and Phases 1, 3, 4 (`ActionAnnouncer`, `useLocale`, `uiLocale`, `fieldControlClass`, `LocalizedText`)
- **Discrepancy Description & Rationale**:
  - `ActionAnnouncer` (lines 9, 94): Referenced as the dispatcher for form error summaries, but never defined, typed, or linked to its file (`apps/frontend/src/components/organisms/action-announcer.tsx`). A fresh reader cannot verify what it is or how it interacts with form fields.
  - `useLocale` (lines 38, 48, 144, 158, 193) & `uiLocale` (lines 40, 177, 180): While import paths are provided in Phase 3/4, neither utility is defined with its return type or contract. The document relies on context inference (e.g. `locale === 'vi'`) to imply that they return `'en' | 'vi'`. The distinct operational boundary between client hook `useLocale` and server helper `uiLocale` (and why one is used in RSC and the other in client components) is not explicitly explained.
  - `fieldControlClass` (lines 23–25, 98–104): Section 4 states that editing `fieldControlClass` in `input.tsx` fixes `Input`, `Textarea`, and `Select` uniformly. It does not explain that `Textarea` and `Select` import `fieldControlClass` from `input.tsx`, leaving a reader to wonder if `textarea.tsx` or `select.tsx` also require edits.

---

#### 4. Severity: Major
- **Affected Scope**: Phase 4.3 (`Sentence Case Standardization with Bilingual Localization`, lines 212–225) & Section 3 (line 19)
- **Discrepancy Description & Rationale**:
  Phase 4.3 introduces `<LocalizedText en="Save revision" vi="Lưu phiên bản" />` and `<LocalizedText en="Add criterion" vi="Thêm tiêu chí" />` into `apps/frontend/src/features/proof/components/proof-panel.tsx`. Unlike Phase 3.1, 3.2, and 4.1 which explicitly state import statements, Phase 4.3 omits the import for `LocalizedText` (`import { LocalizedText } from '@/components/molecules/localized-text'`).  
  A developer reading Phase 4.3 must search the codebase to discover where `LocalizedText` is defined.

---

#### 5. Severity: Major
- **Affected Scope**: Phase 5 (`Verification & Regression Suite`, lines 227–251)
- **Discrepancy Description & Rationale**:
  - **Machine-Specific Commands**: Commands are prefixed with `rtk proxy` without defining what `rtk` is or stating standard fallback commands (`pnpm --dir apps/frontend ...`).
  - **Incomplete Unit Test Scope**: The new test cases for `dialog.test.tsx` test the explicit `closeAriaLabel="Đóng"` prop and the default `'Close'`, but do not test the fallback when `locale === 'vi'` with no prop. Testing the Vietnamese fallback in Vitest requires mocking `useLocale` or wrapping in `UiLocaleContext.Provider`, but this prerequisite is omitted.
  - **Unstated E2E Prerequisites**: Step 4 specifies `PREFETCH_TEST=1 rtk proxy pnpm --dir apps/frontend exec playwright test`, but omits prerequisites such as whether a local dev server must be running or if Playwright manages the server lifecycle, and what `PREFETCH_TEST=1` controls.

---

#### 6. Severity: Nit
- **Affected Scope**: Phase 2.2 (`Virtual Numeric Keypad for Valid Days`, lines 113–125)
- **Discrepancy Description & Rationale**:
  Target 2 diff displays `<Input ...>` directly without its enclosing render prop `{(c) => ( ... )}` (unlike Target 1 at line 110 which includes `{(c) => ...}`). Additionally, the cited line range (755–762) spans `FormField`'s `hint` prop and only half of the `<Input>` definition.

---

#### 7. Severity: Nit
- **Affected Scope**: Section 6 (`Internationalization for Accessibility Labels`, lines 32–41)
- **Discrepancy Description & Rationale**:
  Section 6 addresses the hardcoded `aria-label="Main"` in `AppSidebar` (desktop). However, the mobile equivalent `MobileNav` (`apps/frontend/src/components/organisms/mobile-nav.tsx:34`) also has a hardcoded `<nav aria-label="Main">` and unlocalized `aria-label="Open navigation"`. The document does not define whether `MobileNav` was deliberately excluded from this scope.

---

#### 8. Severity: Nit
- **Affected Scope**: Section 1 heading (`### 1. Form Inline Validation Announcement (form-field.tsx)`, line 7)
- **Discrepancy Description & Rationale**:
  Section 1 specifies retaining existing behavior (no code change), but unlike Section 10 (`Multi-column Form Grid Alignment Invariant`) which explicitly notes *"Invariant verified; no code diff required"*, Section 1 does not flag itself as "(Verification Only)" in the heading, creating initial ambiguity for the implementer.
