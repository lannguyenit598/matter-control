# Feature Specification Audit Report: UI & Accessibility Issues Remediation Plan

**Target Document**: [`docs/implementation/ui-issues-remediation.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/ui-issues-remediation.md) (Lines 1–69, FeatureRange)  
**Standard Evaluated**: [`feature-spec-standard.md`](file:///Users/nguyenvanlan/.gemini/config/plugins/egm/resources/document_standards/feature-spec-standard.md)  
**Review Mode**: REVIEW  
**Reviewer**: `egm-design` (Hostile Design Critic)

---

### Summary of Audit
Lines 1–69 of `ui-issues-remediation.md` define a granular list of 10 micro-remediations across UI components, forms, and navigation. However, evaluated strictly against the **Feature Specification Standard**, the section **FAILS** the standard's core gates: it lacks high-level problem and architecture definitions, omits goals/non-goals, violates the mandatory Alternatives Rule, and contains zero risk analysis. Furthermore, technical stress-testing reveals architectural and usability flaws in WebKit select padding, `<details>` keyboard accessibility, RSC vs. Client landmark collisions, and `type="number"` validation.

---

### Findings

#### 1. Standard Compliance Gap: Missing Problem Statement & Business Motivation
- **Severity**: Blocker
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:1-4` (Document Header)
- **Finding & Recommendation**:
  - *Flaw*: Line 3 only mentions that the document is a "verified remediation plan for UI, accessibility (A11y), and usability issues in `apps/frontend`." It provides no problem statement detailing the business motivation, user personas affected (e.g., legal practitioners using screen readers, keyboard-only operators, touch/mobile users), or the legal/compliance risks of accessibility and input errors in high-stakes legal matter workflows.
  - *Recommendation*: Add a formal `Problem Statement` section before the itemized list, articulating the UX pain points, compliance targets (e.g., WCAG 2.1 AA), and operational impact of these UI deficiencies.

---

#### 2. Standard Compliance Gap: Missing Goals & Non-Goals
- **Severity**: Blocker
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:1-6`
- **Finding & Recommendation**:
  - *Flaw*: Lines 1–69 jump directly into component-level micro-fixes without defining the project boundaries. There are no explicit goals (e.g., WCAG 2.1 AA conformance, Apple HIG compliance, bilingual EN/VI parity, minimum 44px touch targets) or non-goals (e.g., not replacing native form controls with third-party headless libraries like Radix, not introducing new locales beyond EN/VI, not redesigning desktop layout templates).
  - *Recommendation*: Add a structured `Goals & Non-Goals` section defining measurable criteria for success and explicitly ruling out out-of-scope refactorings.

---

#### 3. Standard Compliance Gap: Missing Proposed Architecture & System Integration
- **Severity**: Blocker
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:5-6`
- **Finding & Recommendation**:
  - *Flaw*: The specification details fragmented file patches but fails to present an overarching system architecture. It does not illustrate:
    1. The React Server Component (RSC) vs. Client Component boundary layout (e.g., `layout.tsx` -> `AppSidebar` (RSC) vs. `BottomNav` / `Dialog` (Client)).
    2. The localization propagation pipeline (server cookie `uiLocale()` vs. client hook `useLocale()` vs. `<LocalizedText>` elements).
    3. The A11y event hierarchy (focus shifting via `FocusController`, announcements via `ActionAnnouncer`, and inline `aria-describedby` field validation).
  - *Recommendation*: Introduce a `Proposed Architecture` section illustrating the component hierarchy, data flows, and ecosystem integration across the client/server barrier.

---

#### 4. Standard Compliance Gap: Violation of the Mandatory Alternatives Rule
- **Severity**: Blocker
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:1-69` (Items 1–10)
- **Finding & Recommendation**:
  - *Flaw*: The Feature Specification Standard mandates: *"The specification must include a mandatory evaluation of alternatives. It fails this standard if it proposes a single path without proving that other viable designs were considered and rejected for specific, documented reasons."*
    Only Item 1 briefly discusses `role="alert"` vs. `aria-describedby`. Items 2 through 10 propose single solutions with zero evaluated alternatives (e.g., Item 2 does not evaluate native `<details>` vs. accessible popover/dialog triggers; Item 5 does not evaluate `type="text" inputMode="numeric"` vs. `type="number"`; Item 9 does not evaluate flexbox container centering vs. padding tweaks).
  - *Recommendation*: Add an `Alternatives Considered` section evaluating at least one viable alternative design for each major remediation, detailing trade-offs in complexity, cross-browser stability, and accessibility.

---

#### 5. Standard Compliance Gap: Missing Risks & Mitigations Section
- **Severity**: Blocker
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:1-69`
- **Finding & Recommendation**:
  - *Flaw*: Lines 1–69 contain no identification of constraints, failure modes, security risks, or browser-specific edge cases as mandated by the standard.
  - *Recommendation*: Add a dedicated `Risks & Mitigations` section explicitly analyzing browser rendering discrepancies, screen reader behavior variations, keyboard trap risks, and localization desynchronization.

---

#### 6. Flawed Assumption: WebKit Text Alignment via Fixed Padding (Item 9)
- **Severity**: Major
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:58-62` (Item 9) & `apps/frontend/src/components/atoms/select.tsx:157-161`
- **Finding & Recommendation**:
  - *Flaw*: Item 9 asserts that setting `max-sm:py-3` with `leading-normal` aligns the native select option text baseline with flanking icons and 44–47px touch targets. In iOS WebKit (`Safari`), native `<select>` controls with `appearance: none` calculate text baselines according to proprietary system font metrics and ignore standard CSS `line-height`, leading to inconsistent vertical shifts across iOS versions. Furthermore, setting `py-3` (12px top/bottom + 20px line height + 2px border = 46px) diverges from `Input` which uses `max-sm:py-2.5` (`input.tsx:16`), creating height and baseline misalignments when inputs and selects sit side-by-side in grid forms (e.g., `proof-panel.tsx`).
  - *Recommendation*: Normalize control heights using explicit height utilities (e.g., `h-11 flex items-center`) rather than asymmetric padding (`py-3` vs `py-2.5`), and verify visual centering across iOS Safari, Android Chrome, and Firefox Mobile.

---

#### 7. Architectural & Accessibility Flaw: Keyboard Navigation & Dismissal in Preferences Menu (Item 2)
- **Severity**: Major
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:12-16` (Item 2) & `apps/frontend/src/app/(app)/layout.tsx:92-105`
- **Finding & Recommendation**:
  - *Flaw*: Adding `focus-visible:outline-2 ...` to `<summary>` fixes only the visibility of the focus indicator. However, using native `<details>` as an absolute-positioned dropdown menu introduces critical keyboard navigation defects:
    1. Pressing `Escape` does not dismiss the menu.
    2. Clicking or tabbing outside does not close the disclosure, leaving the popover floating and obscuring content.
    3. Screen readers announce the trigger as a disclosure widget ("expanded/collapsed") rather than a popup menu (`aria-haspopup="true"`).
  - *Recommendation*: Specify keyboard event handlers (`onKeyDown` for `Escape` closure) and an outside-click/focus-out dismissal listener, or evaluate replacing the native `<details>` menu with an accessible dialog or popover component.

---

#### 8. Architectural Risk: Landmark Duplication and RSC/Client i18n Desynchronization (Item 6)
- **Severity**: Major
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:32-41` (Item 6) & `apps/frontend/src/app/(app)/layout.tsx:46-48, 110-113`
- **Finding & Recommendation**:
  - *Flaw*: In `layout.tsx`, both `AppSidebar` (desktop) and `BottomNav` (mobile) reside in the DOM simultaneously inside `DashboardTemplate`.
    1. **Landmark Duplication**: Both render `<nav aria-label="Primary navigation">` (or `"Điều hướng chính"`). Assistive technology (VoiceOver Rotor / NVDA Elements List) announces two identical "Primary navigation" landmarks, violating WCAG 1.3.1 / 2.4.1 landmark uniqueness guidelines.
    2. **RSC vs Client Boundary Drift**: `AppSidebar` receives its label from the server (`await uiLocale()`), while `BottomNav` derives its label on the client via `useLocale()`. If the user toggles locale via `LocaleToggle`, client state updates immediately while the RSC prop remains unchanged until a server refresh completes, causing split-language landmarks.
  - *Recommendation*: Differentiate the landmarks (e.g., `"Primary navigation"` for sidebar vs. `"Bottom navigation"` for mobile bar), ensure the inactive responsive nav is removed from the accessibility tree (`aria-hidden="true"` or CSS `display: none`), and document the server-revalidation trigger on locale change.

---

#### 9. Faulty Assumption & Data Integrity Risk: Virtual Keypad and `type="number"` (Item 5)
- **Severity**: Major
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:27-31` (Item 5) & `apps/frontend/src/features/proof/components/proof-panel.tsx:614, 655, 760-770`
- **Finding & Recommendation**:
  - *Flaw*: Item 5 assumes `type="number"` with `inputMode="numeric"` and `step={1}` prevents invalid fractions or alphanumeric inputs. In reality, HTML5 `type="number"` still permits exponential `'e'`, `'+'`, `'-'`, and `'.'`. On invalid entry, mobile browsers set `validity.badInput` and return `value = ""`. In `proof-panel.tsx:655`, the submit handler uses `validDays: v.validDays || '0'`. An invalid input or malformed entry silently defaults to `'0'` (unbounded validity), corrupting legal evidentiary validity rules without user awareness.
  - *Recommendation*: Evaluate using `type="text" inputMode="numeric" pattern="[0-9]*"` for integer-only days, or specify explicit client-side validation that checks `validity.badInput` before fallback to prevent unintended zero-day mutations.

---

#### 10. Risk: Windows High Contrast / Forced-Colors Contrast Fallback (Item 4)
- **Severity**: Nit
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:22-26` (Item 4) & `apps/frontend/src/components/atoms/input.tsx:6-7`
- **Finding & Recommendation**:
  - *Flaw*: Adding `text-foreground` to `fieldControlClass` resolves default dark mode text color inheritance, but does not specify behavior under `@media (forced-colors: active)`. In Windows High Contrast mode, custom text colors may conflict with system `Canvas` / `CanvasText` if `forced-color-adjust` is improperly cascaded.
  - *Recommendation*: Add an explicit test verification step for Windows High Contrast mode (Desert, Aquatic, Dusk themes) to ensure native control contrast is preserved.

---

#### 11. Erroneous Line Citations in Specification (Items 2, 7, 9)
- **Severity**: Nit
- **Affected Scope**: `docs/implementation/ui-issues-remediation.md:13, 43, 59`
- **Finding & Recommendation**:
  - *Flaw*:
    - Item 2 cites `layout.tsx:90`, but `<summary>` is at line 93.
    - Item 7 cites `matter-search.tsx:28, 62`, but the placeholder is at line 64.
    - Item 9 cites `select.tsx:135-139`, but the select element classes are at lines 157–161 (lines 135–139 contain the outer div and icon).
  - *Recommendation*: Correct the line citations to prevent developer confusion and audit test mismatches.
