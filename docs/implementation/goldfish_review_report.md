# Goldfish Annotated Review Report

**Target:** [`docs/implementation/ui-issues-remediation.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/ui-issues-remediation.md) (Lines 1–251)  
**Standard:** Combined EGM Standards (Zoom-Out, Re-Implementation, Feature Spec, Implementation Readiness)

---

## Prioritized Findings & AI Suggestions

### 1. Remove Speculative `closeAriaLabel` Prop from `Dialog` [`egm-zoom-out`, `egm-comprehension`, `egm-implementation-readiness`] - Severity: High
* **Affected Scope:** `apps/frontend/src/components/molecules/dialog.tsx:23` & `docs/implementation/ui-issues-remediation.md:38, 143-163`
* **Discrepancy Description:** `Dialog` introduces `closeAriaLabel?: string` into `DialogProps`. In the entire application, zero consumers pass this prop. Every modal dialog in the application relies on the internal bilingual resolution: `locale === 'vi' ? 'Đóng' : 'Close'`. Exposing an unused configuration prop violates YAGNI and expands the public API surface purely to satisfy a synthetic test case.
* **Rationale:** Design system molecules should not expose speculative customization hooks when self-contained locale resolution satisfies 100% of product use cases.
* ***AI Suggestion:*** **PROPOSE FIX**
* ***Justification:*** Removing `closeAriaLabel` simplifies the component API, eliminates dead branches, and keeps `Dialog` self-contained.
* ***Proposed Edit:***
  * Location: `apps/frontend/src/components/molecules/dialog.tsx` and `docs/implementation/ui-issues-remediation.md`
  * Change: Remove `closeAriaLabel` from `DialogProps` and `Dialog`. Render `<Button variant="ghost" size="icon" aria-label={locale === 'vi' ? 'Đóng' : 'Close'} ...>`. Update `dialog.test.tsx` to test English default and Vietnamese context default via `<UiLocaleContext.Provider value="vi">`.

---

### 2. Contradictory Heading: "Title Case" vs "Sentence Case" [`egm-zoom-out`, `egm-comprehension`] - Severity: Medium
* **Affected Scope:** `docs/implementation/ui-issues-remediation.md:190`
* **Discrepancy Description:** Phase 4 heading reads `### Phase 4: Typography & Button Title Case (P3)`, which directly contradicts Section 8 and the project's canonical sentence-case invariant (`Create workspace`, `Create requirement`, `Save revision`, `Add criterion`).
* **Rationale:** Precision in legal control plane documentation is critical to avoid regression during future maintenance.
* ***AI Suggestion:*** **PROPOSE FIX**
* ***Justification:*** Matches the documented invariant and actual test suites.
* ***Proposed Edit:***
  * Location: `docs/implementation/ui-issues-remediation.md:190`
  * Change: Rename heading to `### Phase 4: Typography & Button Sentence Case (P3)`.

---

### 3. Clarify `IntentForm` Focus Shifting as Out of Scope [`egm-zoom-out`, `egm-comprehension`] - Severity: Medium
* **Affected Scope:** `docs/implementation/ui-issues-remediation.md:9-10, 91-94`
* **Discrepancy Description:** Item 1 asserts that focus shifting belongs at the form root level in `IntentForm` (`form.querySelector('[aria-invalid="true"]')?.focus()`), but neither schedules nor implements it, creating confusion as to whether it is an unfulfilled requirement.
* **Rationale:** Form submission errors are already audibly announced by `ActionAnnouncer`. `FormField` remains a pure presenter.
* ***AI Suggestion:*** **PROPOSE FIX**
* ***Justification:*** Clarifies scope boundary without introducing speculative changes to `IntentForm`.
* ***Proposed Edit:***
  * Location: `docs/implementation/ui-issues-remediation.md:9-10, 91-94`
  * Change: Explicitly mark root focus shifting in `IntentForm` as **Out of Scope (Non-Goal)** for this remediation milestone, and note that error notification is fulfilled via `ActionAnnouncer` and `aria-invalid`.

---

### 4. Correct Brittle Line Citation for `select.tsx` [`egm-comprehension`, `egm-design`, `egm-implementation-readiness`] - Severity: Medium
* **Affected Scope:** `docs/implementation/ui-issues-remediation.md:58, 128`
* **Discrepancy Description:** Document points to lines 135–139 in `select.tsx`, which contains the outer `<div>` and icon wrapper, whereas the trigger `<select>` classes are at lines 157–161 (line 159).
* **Rationale:** Inaccurate line numbers hinder automated patch tools and cause confusion for reviewers.
* ***AI Suggestion:*** **PROPOSE FIX**
* ***Justification:*** Corrects reference to exact code location.
* ***Proposed Edit:</a>
  * Location: `docs/implementation/ui-issues-remediation.md:58, 128`
  * Change: Update citation to `apps/frontend/src/components/atoms/select.tsx:157-161`.

---

### 5. Expand Unit Test Assertions for Vietnamese Fallback & Ellipsis [`egm-implementation-readiness`] - Severity: Medium
* **Affected Scope:** `apps/frontend/src/components/molecules/dialog.test.tsx` & `apps/frontend/src/features/matters/components/matter-search.test.tsx`
* **Discrepancy Description:** `dialog.test.tsx` lacks a test for automatic Vietnamese fallback without explicit props. `matter-search.test.tsx` does not assert the presence of the localized ellipsis placeholder.
* **Rationale:** Automated unit tests must verify newly introduced bilingual behaviors.
* ***AI Suggestion:*** **PROPOSE FIX**
* ***Justification:*** Increases test coverage and prevents regression of internationalized labels.
* ***Proposed Edit:***
  * Location: `apps/frontend/src/components/molecules/dialog.test.tsx` and `apps/frontend/src/features/matters/components/matter-search.test.tsx`
  * Change: In `dialog.test.tsx`, add test using `<UiLocaleContext.Provider value="vi">` asserting `screen.getByRole('button', { name: 'Đóng' })`. In `matter-search.test.tsx`, add test checking placeholder `Search matters by name…`.

---

### 6. Prune Redundant Diff Weeds from Detailed Implementation Plan [`egm-zoom-out`] - Severity: Medium
* **Affected Scope:** `docs/implementation/ui-issues-remediation.md:70-226`
* **Discrepancy Description:** Detailed Implementation Plan repeats the 10 specification items with 150+ lines of raw `git diff` blocks, causing severe altitude collapse.
* **Rationale:** Architectural documents should specify components, invariants, and verification steps rather than duplicating git patches.
* ***AI Suggestion:*** **PROPOSE FIX**
* ***Justification:*** Improves readability, eliminates doc drift, and complies with the Zoom-Out Standard.
* ***Proposed Edit:***
  * Location: `docs/implementation/ui-issues-remediation.md:70-226`
  * Change: Condense into a clean phase checklist detailing component files, invariant requirements, and verification gates.

---

### 7. Critic Proposal: Replace Native `<details>` with Custom Popover/Library [`egm-design`] - Severity: High
* **Affected Scope:** `apps/frontend/src/app/(app)/layout.tsx:92-105`
* **Discrepancy Description:** Critic argues that `<details>` lacks `Escape` closure and outside-click dismissal, recommending replacement with a third-party popover library or custom JS listeners.
* **Rationale:** Native `<details>` provides zero-JS, browser-native disclosure behavior that functions inside a React Server Component layout without hydration penalties or runtime dependencies. Adding visible focus indicators via Tailwind (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`) resolves the accessibility defect with minimal footprint.
* ***AI Suggestion:*** **CONTEST**
* ***Justification:*** Adding heavy popover libraries or client JS hooks to an RSC layout for two secondary links violates YAGNI and compromises performance.

---

### 8. Critic Proposal: Replace `type="number"` with `type="text"` & Custom Regex [`egm-design`] - Severity: High
* **Affected Scope:** `apps/frontend/src/features/proof/components/proof-panel.tsx:614, 761`
* **Discrepancy Description:** Critic argues that HTML5 `type="number"` permits `'e'`, `'+'`, and decimal points, proposing `type="text" inputMode="numeric"` with custom regex parsing.
* **Rationale:** `type="number" min={0} max={36500} step={1} inputMode="numeric"` is the web platform standard, triggers native numeric keypads on iOS and Android, and server schemas strictly enforce numeric bounds.
* ***AI Suggestion:*** **CONTEST**
* ***Justification:*** Speculative edge-case hardening via custom regex string parsing increases maintenance overhead without practical benefit.

---

### 9. Critic Proposal: Rename Mobile Navigation Landmark to "Bottom navigation" [`egm-design`] - Severity: High
* **Affected Scope:** `apps/frontend/src/components/organisms/bottom-nav.tsx` & `apps/frontend/src/app/(app)/layout.tsx`
* **Discrepancy Description:** Critic argues that `AppSidebar` and `BottomNav` create duplicate "Primary navigation" landmarks in assistive technologies.
* **Rationale:** Desktop and mobile navigation slots are mutually exclusive via CSS `display: none` (`.app-sidebar-slot` at `<= 800px`, `.app-bottom-nav` at `> 800px`). Elements with `display: none` are completely removed from the accessibility tree. Assistive technologies never encounter duplicate landmarks.
* ***AI Suggestion:*** **CONTEST**
* ***Justification:** Landmark uniqueness is already guaranteed by responsive CSS media queries. Renaming mobile navigation degrades UX for mobile screen reader users.
