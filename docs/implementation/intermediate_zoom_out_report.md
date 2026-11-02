# Skeptical Architect Intermediate Review (Stage 8)

**Target File**: [`docs/implementation/ui-issues-remediation.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/ui-issues-remediation.md) (Lines 1–252)  
**Standard**: [`zoom-out-standard.md`](file:///Users/nguyenvanlan/.gemini/config/plugins/egm/resources/document_standards/zoom-out-standard.md)  
**Stage**: Intermediate Zoom Out Review (Synthesis of Initial Zoom Out, Comprehension, and Critic Audits)  
**Reviewer**: `egm-zoom-out` (Skeptical Architect)

---

### Executive Evaluation

An architectural audit of the remediation plan in light of the Initial Zoom Out, Comprehension, and Critic reports confirms that the core architectural invariants and boundaries remain structurally sound:
1. **RSC vs. Client Boundary**: Pure Server Components (`AppSidebar`, `AuthenticatedWorkbench`) resolve locale asynchronously on the server (`await uiLocale()`), while Client Components (`Dialog`, `BottomNav`, `MatterSearch`, `LocaleToggle`) consume client state (`useLocale()`) without hydration flashes or client-hook leakage across the server boundary.
2. **Sentence Case Invariant**: Form action buttons strictly preserve sentence-case labels (`Create workspace`, `Create requirement`, `Save revision`, `Add criterion`), matching automated test suites.
3. **Centralized Field Styling**: `fieldControlClass` in `input.tsx` remains the single source of truth for `Input`, `Textarea`, and `Select`.
4. **Touch Target Dimensions**: 44px min-dimensions (`min-h-11`, `min-w-11`) are preserved across mobile triggers and form controls.

However, several critiques proposed during earlier stages risk introducing unnecessary complexity, bloat, and premature refactorings. Furthermore, the remediation document itself exhibits severe altitude drops and redundant diff bloat that must be pruned.

---

### Architectural Invariant & Mitigation Assessment (Contrarian / YAGNI Lens)

#### 1. Native `<details>` vs. Custom Popover / JS Event Suite (Item 2)
- **Critic Proposal**: Replace the native `<details>` preferences menu with an accessible dialog/popover library or implement custom JavaScript listeners for `Escape` dismissal and outside-click closure.
- **Skeptical Architect Assessment (REJECT Critic Proposal)**: The mobile preferences menu in [`layout.tsx:92-105`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/%28app%29/layout.tsx#L92-L105) contains only two secondary controls (`LocaleToggle` and `AccountMenu`). Native `<details>` provides zero-JS, browser-native disclosure behavior that functions inside a React Server Component layout without hydration penalties or runtime overhead. Replacing this with a third-party popover library (e.g. Radix) or custom event listener hooks adds state overhead, hydration requirements, and runtime dependencies for zero tangible benefit. Adding visible focus indicators via Tailwind (`focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`) resolves the accessibility defect with minimal footprint.

#### 2. HTML5 `type="number"` vs. Custom Text/Regex Parsing (Item 5)
- **Critic Proposal**: Replace `type="number"` with `type="text" inputMode="numeric" pattern="[0-9]*"` and custom validation handlers to prevent input of `'e'`, `'+'`, or decimal points.
- **Skeptical Architect Assessment (REJECT Critic Proposal)**: `type="number" min={0} max={36500} step={1} inputMode="numeric"` in [`proof-panel.tsx:614, 761`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/proof/components/proof-panel.tsx#L614) leverages native browser spinners, HTML5 step constraints, and invokes numeric virtual keypads on iOS and Android. Backing action schemas already validate payload values server-side. Replacing native number semantics with bespoke regex string parsing and custom client-side validation logic is speculative edge-case hardening (YAGNI) that increases codebase maintenance overhead.

#### 3. Responsive Navigation Landmark Uniqueness (Item 6)
- **Critic Proposal**: Rename the mobile navigation landmark to `"Bottom navigation"` to avoid duplicate landmark announcements with desktop `AppSidebar`.
- **Skeptical Architect Assessment (REJECT Critic Proposal)**: Inspection of the CSS architecture in [`globals.css:754`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/globals.css#L754) (`.app-sidebar-slot { display: none; }` at `<= 800px`) and [`pane-workbench.css:360-366`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/pane-workbench.css#L360-L366) (`.app-bottom-nav { display: none; }` at `> 800px`) reveals that desktop and mobile navigation slots are **mutually exclusive**. Elements styled with `display: none` are completely removed from the accessibility tree. At no point do assistive technologies encounter duplicate "Primary navigation" landmarks. Renaming the mobile bar to "Bottom navigation" would degrade screen reader UX on mobile devices, where the bottom bar is genuinely the primary navigation.

#### 4. Native Select Centering vs. Flexbox Redesign (Item 9)
- **Critic Proposal**: Re-engineer native `<select>` controls with flexbox (`h-11 flex items-center`) rather than padding adjustments.
- **Skeptical Architect Assessment (REJECT Critic Proposal)**: CSS Flexbox on native `<select>` elements is non-standard and ignored by browser rendering engines (WebKit and Blink). Padding (`max-sm:py-3`) paired with `leading-normal` is the platform-standard method to align text baselines in native `<select>` elements without breaking cross-browser styling.

---

### Detailed Findings

#### 1. Severity: Blocker
- **Affected Scope**: Lines 70–226 (`## Detailed Implementation Plan`)
- **Simplicity Rationale**:
  The document suffers from severe altitude collapse and bloat. Lines 5–67 (`## Feature Specification`) already clearly specify the exact components, invariants, and resolutions for each of the 10 items. Lines 70–226 duplicate these same 10 items almost verbatim across 150+ lines of raw `git diff` blocks.
  Per the Zoom-Out Standard (Section 3: Anti-Weeds): *"High-level sections must focus on architecture, interfaces, and data flows, not code-level implementation details... writing detailed pseudocode or listing minor implementation helper functions instead of high-level structure."*
  An architectural remediation plan is not a duplicate patch file. It must define contracts, invariants, file ownership, and verification gates. The low-level diff blocks add visual clutter, drift rapidly, and obscure high-level architectural tracking.
- **Recommendation**: Condense Section 2 into a high-level Phase Roadmap listing target files, invariant requirements, and execution order. Strip the redundant raw git diffs.

---

#### 2. Severity: Major
- **Affected Scope**: Lines 9–10 (Section 1) & Lines 91–94 (Phase 1.3)
- **Simplicity Rationale**:
  Section 1 asserts:
  > *"Focus shifting on server validation rejection belongs at the form root level in `IntentForm` (`form.querySelector('[aria-invalid="true"]')?.focus()`), preserving `FormField` as a pure presenter."*
  
  Inspection of [`apps/frontend/src/components/organisms/intent-form.tsx:180-210`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/organisms/intent-form.tsx#L180-L210) reveals that `IntentForm` currently relies on `ActionAnnouncer` for submission result announcements and does not shift DOM focus. The remediation plan neither schedules nor implements this focus shift.
  Including architectural pseudocode for a root component without scheduling its execution creates ambiguity (as flagged by Comprehension) and invites premature scope creep. Form submission errors are already audibly announced by `ActionAnnouncer`.
- **Recommendation**: Explicitly clarify that automated focus shifting in `IntentForm` is **Out of Scope (Non-Goal)** for this remediation milestone. Reaffirm that `FormField` remains a pure presenter relying on `aria-describedby` and `aria-invalid`.

---

#### 3. Severity: Major
- **Affected Scope**: Lines 38, 143–163 (Item 6 & Phase 3.1); [`dialog.tsx:23`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/components/molecules/dialog.tsx#L23)
- **Simplicity Rationale**:
  The document introduces `closeAriaLabel?: string` into `DialogProps`. In the entire application, **zero** dialog consumers pass this prop. Every modal dialog in the application relies on the internal bilingual resolution:
  `locale === 'vi' ? 'Đóng' : 'Close'`.
  Exposing an unused configuration prop violates YAGNI and expands the public API surface of a core design system molecule purely to satisfy a synthetic test case.
- **Recommendation**: Remove `closeAriaLabel` from `DialogProps` and `Dialog`. Keep `Dialog` self-contained using internal `locale === 'vi' ? 'Đóng' : 'Close'`.

---

#### 4. Severity: Major
- **Affected Scope**: Line 190 (`### Phase 4: Typography & Button Title Case (P3)`)
- **Simplicity Rationale**:
  The codebase enforces strict **sentence case** for English button labels (`Create workspace`, `Create requirement`, `Save revision`, `Add criterion`), verified by automated test suites (`create-requirement-form.test.tsx`, `creation-reload.test.tsx`). 
  Naming the section heading "Button Title Case" directly contradicts the project invariant and Section 8 (lines 51–57). This terminological collision risks confusion and accidental regressions during future maintenance.
- **Recommendation**: Rename line 190 to `### Phase 4: Typography & Button Sentence Case (P3)`.

---

#### 5. Severity: Nit
- **Affected Scope**: Lines 63–66 (Item 10) & Lines 136–140 (Phase 2.4)
- **Simplicity Rationale**:
  Item 10 ("Multi-column Form Grid Alignment Invariant") explicitly concludes: *"Invariant verified in current code; no code diff required."*
  Listing non-remediations as active items across both the specification and implementation checklists introduces scope bloat and dilutes focus from actual engineering tasks.
- **Recommendation**: Consolidate unchanged architectural invariants (including Item 1 and Item 10) into a dedicated "Architectural Invariants Preserved" section.

---

#### 6. Severity: Nit
- **Affected Scope**: Lines 13, 28, 43, 59, 128 (Absolute Line Citations)
- **Simplicity Rationale**:
  The document relies heavily on exact line numbers that have already drifted:
  - `select.tsx:135-139` cites the outer JSX wrapper; the trigger class is at line 159.
  - `layout.tsx:90` cites `<QuickSearch />`; `<summary>` is at line 93.
  - `matter-search.tsx:62` is at line 64.
- **Recommendation**: Reference target component names and JSX elements rather than brittle line numbers.

---

### Conclusion & Direction for Remediation Document
The architecture is well-founded and minimal. We must resist the Critic's pressure to add heavy popover libraries, complex text/regex input managers, or landmark renames. To meet the Zoom-Out Standard, the remediation document simply needs to:
1. Strip the 150+ lines of redundant git diff weeds.
2. Formally declare `IntentForm` focus changes as out of scope.
3. Remove the speculative `closeAriaLabel` prop from `Dialog`.
4. Fix the "Title Case" heading collision.
