# Stage 6: Comprehension Test Report (Round 2)

- **Target**: [`docs/implementation/ui-issues-remediation.md`](ui-issues-remediation.md)
- **Reviewer**: Naive Reader (`egm-comprehension`)
- **Date**: 2026-11-02
- **Verdict**: ⚠️ **REWORK REQUIRED (2 Blockers, 3 Majors, 2 Nits)**

---

## 1. Executive Summary

The remediation plan is conceptually sound and follows strong accessibility and design principles. However, auditing from the perspective of an implementer with zero institutional knowledge identified two compilation blockers and several location inaccuracies:
1. **Compilation Blockers**: Adding new props (`closeAriaLabel` in `Dialog`, `navAriaLabel` in `AppSidebar`) without destructuring them in the component function signatures causes TypeScript `TS2304: Cannot find name` errors.
2. **Location Inaccuracies**: `select.tsx` trigger classes are at line 89 (not lines 31–35); `layout.tsx` mobile `<summary>` is at line 90 (not 84).
3. **Ambiguity on Actionability**: Form grid alignment in `proof-panel.tsx` is an invariant verification (already present in the current source), but lacked explicit clarification.

---

## 2. Findings Matrix

| ID | Severity | Affected Scope | Summary | Remediation |
|---|---|---|---|---|
| **F-01** | 🔴 **Blocker** | `dialog.tsx:31-39` | Missing destructuring of `closeAriaLabel` in `Dialog` function signature | Add `closeAriaLabel` to destructured props in `Dialog` |
| **F-02** | 🔴 **Blocker** | `app-sidebar.tsx:15` | Missing destructuring of `navAriaLabel` in `AppSidebar` function signature | Add `navAriaLabel` to destructured props in `AppSidebar` |
| **F-03** | 🟡 **Major** | `select.tsx:89` | Trigger classes are located at line 89, not lines 31–35 | Update line reference to line 89 |
| **F-04** | 🟡 **Major** | `layout.tsx:90, 33-44` | Mobile `<summary>` is at line 90; `AppSidebar` is at lines 33–44 | Update line references to lines 90 and 33–44 |
| **F-05** | 🟡 **Major** | `proof-panel.tsx:745-751` | Area 10 is an invariant verification; needs explicit label | Mark as invariant verification (no diff required) |
| **F-06** | 🟢 **Nit** | Overview & Headers | Undefined acronyms: EGM, RSC, HIG | Expand acronyms on first use |
| **F-07** | 🟢 **Nit** | `matter-search.tsx:28` | Insertion point for `const locale = useLocale()` omitted | Specify line 28 inside `MatterSearch` |

---

## 3. Positive Verifications

1. **Vietnamese Grammar & Title Case**: Correctly preserves Chicago Title Case for English (`"Create Workspace"`, `"Create Requirement"`, `"Save Revision"`, `"Add Criterion"`) while preserving standard Vietnamese grammar (sentence case: `"Tạo không gian làm việc"`, `"Tạo yêu cầu"`, `"Lưu phiên bản"`, `"Thêm tiêu chí"`).
2. **Unicode Ellipsis**: Correctly specifies Unicode ellipsis (`…` U+2026) instead of three dots.
3. **Apple HIG**: Correctly uses zero-space `⌘K` on macOS and `'Ctrl\u00A0K'` on Windows/Linux with `whitespace-nowrap`.
4. **Select Vertical Alignment (Area 9)**: `leading-normal max-sm:py-3` correctly aligns text baseline with 16px flanking icons within 44px container.
