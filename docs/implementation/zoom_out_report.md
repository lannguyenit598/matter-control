# Zoom-Out Architecture Audit: UI & Accessibility Issues Remediation Plan

**Target Document**: [`docs/implementation/ui-issues-remediation.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/ui-issues-remediation.md) (Lines 1–252)  
**Standard**: [`zoom-out-standard.md`](file:///Users/nguyenvanlan/.gemini/config/plugins/egm/resources/document_standards/zoom-out-standard.md)  
**Review Mode**: REVIEW  
**Reviewer**: `egm-zoom-out` (Skeptical Architect)

---

### Executive Summary

The remediation plan successfully captures critical accessibility, dark-mode contrast, and internationalization fixes across `apps/frontend`. In particular, the boundary separation between Server Components (`uiLocale()` in `layout.tsx`) and Client Components (`useLocale()` in `Dialog` and `MatterSearch`), the centralized styling in `fieldControlClass`, and the strict preservation of sentence-case button labels adhere well to codebase conventions.

However, from an architectural Zoom-Out perspective, the document exhibits significant altitude drops (duplicating specs with 150+ lines of raw Git diffs), speculative API additions violating YAGNI (`closeAriaLabel`), an unfulfilled architectural assertion around form focus handling in [`IntentForm`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/organisms/intent-form.tsx), and a misleading section heading ("Button Title Case") that directly contradicts the project's sentence-case invariant.

---

### Findings

#### 1. Contradictory Terminology in Heading: "Title Case" vs "Sentence Case"
- **Severity**: **Major**
- **Affected Scope**: Line 190 (`### Phase 4: Typography & Button Title Case (P3)`)
- **Simplicity Rationale**:
  Section 8 (lines 51–57) and Phase 4.3 (lines 212–225) explicitly establish and enforce **sentence case** for English button labels (`Create workspace`, `Create requirement`, `Save revision`, `Add criterion`). Automated test suites (e.g., `create-requirement-form.test.tsx`, `creation-reload.test.tsx`) enforce exact sentence-case string matching. 
  Titling the phase heading "Button Title Case" is a direct contradiction of the architectural invariant and the actual implementation. In a legal control-plane system where precision is paramount, this naming collision invites future regression and confusion for developers and CI checks.
- **Recommendation**: Rename line 190 to `### Phase 4: Typography & Button Sentence Case (P3)`.

---

#### 2. Speculative Prop Abstraction on Dialog (`closeAriaLabel`)
- **Severity**: **Major**
- **Affected Scope**: Lines 38, 143–163 (Item 6 & Phase 3.1); [`dialog.tsx:23`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/molecules/dialog.tsx#L23)
- **Simplicity Rationale**:
  `Dialog` exposes `closeAriaLabel?: string` in `DialogProps` and resolves:
  ```ts
  const resolvedCloseLabel = closeAriaLabel ?? (locale === 'vi' ? 'Đóng' : 'Close')
  ```
  A codebase search reveals that **zero** consumers pass `closeAriaLabel`. Every modal consumer across the application uses the default bilingual resolution. The prop exists solely as speculative flexibility (YAGNI) and to support a synthetic unit test in `dialog.test.tsx`. Exposing unused props expands the public API surface of a core design-system molecule and introduces unnecessary branch complexity.
- **Recommendation**: Remove `closeAriaLabel` from `DialogProps`. Keep `Dialog` self-contained using internal `locale === 'vi' ? 'Đóng' : 'Close'`.

---

#### 3. Unfulfilled Architectural Assertion in Form Error Focus Handling
- **Severity**: **Major**
- **Affected Scope**: Lines 9–10 (Item 1) & Lines 91–94 (Phase 1.3)
- **Simplicity Rationale**:
  Item 1 asserts:
  > *"Focus shifting on server validation rejection belongs at the form root level in `IntentForm` (`form.querySelector('[aria-invalid="true"]')?.focus()`), preserving `FormField` as a pure presenter."*
  
  However, inspection of [`apps/frontend/src/components/organisms/intent-form.tsx`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/organisms/intent-form.tsx#L181-L210) reveals that `IntentForm` does **not** currently implement this focus shift on server validation rejection, nor does this remediation plan include any task or diff to implement it.
  While keeping `FormField` as a pure presenter is correct, stating where a critical accessibility behavior belongs while failing to actually plan or implement it in the root component leaves a recognized WCAG requirement (Error Focus Management) unfulfilled.
- **Recommendation**: Either explicitly schedule the focus shift implementation in `IntentForm` in Phase 1, or remove the claim from the specification so it is not mistaken for a completed remediation.

---

#### 4. Extreme Altitude Drop & Redundant Diff Weeds
- **Severity**: **Major**
- **Affected Scope**: Lines 70–226 (`## Detailed Implementation Plan`)
- **Simplicity Rationale**:
  The document suffers from a severe altitude collapse. Section `## Feature Specification` (lines 5–67) already specifies each component's issue and resolution clearly. Section `## Detailed Implementation Plan` (lines 70–226) repeats the exact same 10 items almost verbatim, padded with over 150 lines of line-by-line `git diff` blocks.
  Per the Zoom-Out Standard: *"High-level sections must focus on architecture, interfaces, and data flows, not code-level implementation details... writing detailed pseudocode or listing minor implementation helper functions instead of high-level structure."*
  An architectural remediation plan should specify component boundaries, contracts, invariants, and verification steps rather than functioning as a duplicate patch file.
- **Recommendation**: Condense the Detailed Implementation Plan into a concise phase checklist focused on files, invariants, and sequence. Eliminate redundant raw diff chunks that mirror the Feature Specification.

---

#### 5. Context Insufficiency & Missing Executive Frame
- **Severity**: **Major**
- **Affected Scope**: Lines 1–4 (Document Introduction)
- **Simplicity Rationale**:
  Under Section 0 of the Zoom-Out Standard: *"The document must contain enough information to define the overall objective. If the reviewer cannot determine what we are trying to achieve and why, the review must fail immediately with a request for context."*
  The document opens abruptly with a punch list of 10 disparate UI items. It lacks an executive problem statement, does not state the origin of the audit (e.g. mobile Safari / WebKit touch issues, dark mode contrast audit, WCAG 2.1 AA evaluation), and does not define the overarching success criteria or release boundary.
- **Recommendation**: Add a brief Executive Context section explaining the audit's origin, the target WCAG standard, and why these 10 items constitute a coherent remediation milestone.

---

#### 6. Inconsistent Fallback Landmark String in `AppSidebar`
- **Severity**: **Nit**
- **Affected Scope**: Lines 39, 166–175; [`app-sidebar.tsx:12, 22`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/organisms/app-sidebar.tsx#L12)
- **Simplicity Rationale**:
  `AppSidebar` exposes `navAriaLabel?: string` and defaults to `<nav aria-label={navAriaLabel ?? 'Main'} ...>`.
  However, in `layout.tsx:47`, the caller passes:
  `navAriaLabel={locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'}`.
  Meanwhile, [`bottom-nav.tsx:11`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/organisms/bottom-nav.tsx#L11) hardcodes the exact same navigation landmark to `{locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'}`.
  Defaulting to `'Main'` in `AppSidebar` introduces an unnecessary third label variation for the primary navigation landmark.
- **Recommendation**: Default `navAriaLabel ?? 'Primary navigation'` in `AppSidebar` to align English landmark naming across desktop and mobile.

---

#### 7. Scope Bloat via Non-Remediation Verification Items
- **Severity**: **Nit**
- **Affected Scope**: Lines 63–66 (Item 10) & Lines 136–140 (Phase 2.4)
- **Simplicity Rationale**:
  Item 10 ("Multi-column Form Grid Alignment Invariant") explicitly concludes: *"Invariant verified in current code; no code diff required."*
  Including non-remediations as active items across both the specification and implementation phases adds noise and misleads reviewers about what work was actually performed.
- **Recommendation**: Move verified unchanged invariants to a separate "Architectural Invariants Preserved" subsection or design tokens reference.

---

#### 8. Fragile Hardcoded Line Numbers Across Drifting Files
- **Severity**: **Nit**
- **Affected Scope**: Lines 59, 128, 13–15, 28
- **Simplicity Rationale**:
  The document relies on brittle, concrete line numbers that are already out of sync with the codebase:
  - Lines 59 & 128 cite `select.tsx:135-139`, but the select trigger class is at line 159 (lines 135–139 are the JSX outer wrapper).
  - Line 13 cites `layout.tsx:90`, but line 90 is `<QuickSearch />` (the mobile summary is at line 93).
  - Line 28 cites `proof-panel.tsx:755`, but the input is at line 761.
- **Recommendation**: Reference semantic symbols, component names, or selector targets rather than absolute line numbers.

---

### Codebase Reuse & Pattern Verification (Pass)

The actual code implementation demonstrates sound architectural discipline in several key areas:
1. **RSC vs. Client Boundary Respect**: [`AppSidebar`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/organisms/app-sidebar.tsx) remains a pure Server Component by receiving `navAriaLabel` from async [`layout.tsx`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/%28app%29/layout.tsx#L37) (`await uiLocale()`), avoiding leaking client hooks into RSCs.
2. **Proper Component vs. Attribute i18n**: Correctly uses [`<LocalizedText />`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/molecules/localized-text.tsx) for ReactNode children (e.g. `submitLabel` in `proof-panel.tsx`), and `useLocale()` for primitive string attributes (`placeholder` in `matter-search.tsx`, `aria-label` in `bottom-nav.tsx`).
3. **Single Source of Truth for Control Styling**: `fieldControlClass` in [`input.tsx`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/atoms/input.tsx#L6-L7) cleanly cascades `text-foreground` and card backgrounds across `Input`, `Textarea`, and `Select` without CSS duplication.
