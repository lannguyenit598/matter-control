# Stage 7: Critic Review Report (Round 2)

- **Target**: [`docs/implementation/ui-issues-remediation.md`](ui-issues-remediation.md)
- **Reviewer**: Hostile Design Critic (`egm-design`)
- **Standard**: WCAG 2.2 AA / Section 508 / WAI-ARIA 1.2 / Design Tokens & Typography
- **Date**: 2026-11-02
- **Verdict**: ⚠️ **REWORK REQUIRED (2 Blockers, 3 Majors, 2 Nits)**

---

## 1. Executive Summary

The remediation plan targets valid accessibility, usability, and styling issues across `apps/frontend`. However, a hostile audit reveals:
1. **Compilation Blockers**: Missing parameter destructuring for newly added props in `dialog.tsx` (`closeAriaLabel`) and `app-sidebar.tsx` (`navAriaLabel`).
2. **Focus Management Gap**: Rejecting `role="alert"` in favor of `aria-describedby` is A11y best practice, but must be paired with programmatic focus movement to the first invalid control so blind/low-vision users aren't stranded on Submit.
3. **Location & Baseline Drift**: `select.tsx` trigger classes reside at lines 136–139 (not 31–35); `proof-panel.tsx:744-751` label/hint split is already in place (phantom remediation), requiring recognition as an invariant verification and recommendation of CSS `subgrid` for long-term multi-column alignment under text zoom.

---

## 2. Findings Matrix

| ID | Area / Scope | Severity | Summary | Required Remediation |
|---|---|---|---|---|
| **F-01** | `dialog.tsx:31` | 🔴 **Blocker** | `closeAriaLabel` omitted from `Dialog` parameter destructuring | Add `closeAriaLabel` to `Dialog({ ... }: DialogProps)` |
| **F-02** | `app-sidebar.tsx:15` | 🔴 **Blocker** | `navAriaLabel` omitted from `AppSidebar` parameter destructuring | Add `navAriaLabel` to `AppSidebar({ ... }: AppSidebarProps)` |
| **F-03** | `form-field.tsx` / `intent-form.tsx` | 🟡 **Major** | Inline validation lacks programmatic focus movement to first invalid field | Document requirement for focusing first invalid field upon validation failure |
| **F-04** | `proof-panel.tsx:744-751` | 🟡 **Major** | Phantom remediation (already present in code); fragile under zoom | Reclassify as verified invariant; recommend `subgrid` for resilient multi-column alignment |
| **F-05** | `select.tsx` | 🟡 **Major** | Line reference drift (lines 136–139); 47px height delta vs 44px Input | Update line reference to actual trigger lines; document height delta |
| **F-06** | `layout.tsx:90` | 🟢 **Nit** | `<details>` preferences menu lacks keyboard `Escape` dismissal | Note keyboard dismissal enhancement for `<details>` |
| **F-07** | `input.tsx:6-7` | 🟢 **Nit** | High contrast ratios verified (18.2:1 light, 11.4:1 dark) | Confirmed compliant with WCAG AAA |
