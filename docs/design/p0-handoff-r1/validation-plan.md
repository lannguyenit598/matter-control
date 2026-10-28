# MatterControl Comprehensive Validation Plan — MC-P0-DESIGN-R1

## 1. Governance Authority & Execution State

- **Document ID**: VAL-MC-P0-DESIGN-R1
- **Task Reference**: MC-P0-DESIGN-R1 (Validation Contract & Protocol)
- **Coordinator**: Local Codex
- **Execution State**: `PREPARED_NOT_DISPATCHED / VALIDATION_SPECIFIED_ONLY`
- **Rendered Acceptance Status**: `RENDERED_VALIDATION_UNAVAILABLE` on current policy-restricted local target.
- **Strict Invariant**: **No rendered, accessibility, or usability test is marked PASS from static CSS or mock interactions.** All visual and runtime scenarios remain explicitly `NOT_RUN` until executed against an authorized, running browser target.

---

## 2. Test Datasets & Operational Environments

### 2.1 Canonical Atlas Baseline (T0 Snapshot)
- **Dataset**: `Project Atlas` (Acquisition & Corporate Restructuring, 100% synthetic, non-jurisdictional).
- **Scale**: Exactly 24 records (12 Requirements `RQ-01..RQ-12`, 12 Actions `AC-01..AC-12`).
- **Baseline Timestamps**: As-of $T_0$ = `2026-06-15T09:00:00+07:00`; Baseline $T_{-1}$ = `2026-06-14T09:00:00+07:00`.
- **Key Characteristics**:
  - Exactly 0 candidate Next Actions at $T_0$ (12 Actions present, 2 in progress blocked by unverified proof, 10 blocked by dependencies).
  - Milestones $MS-01$, $MS-02$, $MS-03$ unassessed for overall percentage; display unsatisfied blocker counts only.

### 2.2 Scaled Operational Datasets (50 / 100 / 200 Rows)
To validate grid virtualization, performance, multiline layout stability, and last-row reachability, synthetic datasets must be labeled as follows:
- **Dataset-50**: 25 Requirements, 25 Actions across 6 workstreams. Tests standard matter scale.
- **Dataset-100**: 50 Requirements, 50 Actions with multi-tier dependency chains (depth 4). Tests scroll performance and filter reactivity.
- **Dataset-200**: 100 Requirements, 100 Actions with dense Vietnamese labels (diacritics, long phrases). Tests memory usage, virtualization boundaries, and mobile reflow.

### 2.3 Viewports & Zoom Test Profiles
1. **Desktop Standard**: `1440 x 900` CSS px, 1.0x scale. Primary executive layout.
2. **Desktop Compact / Laptop**: `1280 x 800` CSS px, 1.0x scale. Tests column wrapping and horizontal density.
3. **Mobile Modern**: `390 x 844` CSS px (iPhone 14/15 profile), touch input emulation. Tests card stack reflow and touch targets ($\ge 44$px).
4. **Accessibility Zoom**: `1280 x 800` scaled at **200% browser zoom** (effective 640px viewport). Tests reflow without horizontal scroll and no overlapping elements.

---

## 3. Scenario Matrix & Acceptance Criteria

| Scenario ID | Test Domain | Test Conditions & Viewport | Step-by-Step Procedure | Expected Result | Method | Owner | Status |
|---|---|---|---|---|---|---|---|
| **VAL-SCN-01** | **Manager Comprehension (AC-137)** | Control Room (SCR-02), Desktop 1440x900, Atlas T0 | 1. Present Control Room to user with zero training.<br>2. Prompt: "What is blocking MS-01, who owns the fix, and what is next?"<br>3. Measure time to comprehension. | Participant identifies condition (RQ-04 Due Diligence gap), root cause (unverified Cedar contracts), accountable owner (U-01), and next step within **10 seconds**. | Moderated Usability Protocol | Usability Lead / QA | `NOT_RUN` |
| **VAL-SCN-02** | **Next Action T0 Truthfulness** | Control Room (SCR-02), Desktop 1440x900, Atlas T0 | 1. Inspect Next Action queue.<br>2. Count displayed items.<br>3. Verify explanation text. | Queue displays **0 candidate cards**. Renders `EMPTY_EXPLAINED` card explaining that remaining work is blocked or awaiting proof. No fake action displayed. | Automated E2E (Playwright) | ZCode FE / QA | `NOT_RUN` |
| **VAL-SCN-03** | **Grid Density & Text Expansion** | Operational Grid (SCR-03), Desktop 1280x800, Dataset-100 | 1. Set density to Comfortable (min 44px).<br>2. Verify long legal titles expand vertically without ellipsis.<br>3. Switch to Compact (min 36px).<br>4. Re-check multiline titles and status reasons. | Text size stays 14px body across both modes. Cells expand vertically to show complete legal text. No clipping, no `overflow: hidden` truncation. | Headless Visual Regression | ZCode FE / QA | `NOT_RUN` |
| **VAL-SCN-04** | **Last-Row Reachability & Virtualization** | Operational Grid (SCR-03), Desktop & Mobile, Dataset-200 | 1. Scroll rapidly to bottom of Grid.<br>2. Inspect last row (`ROW-200`).<br>3. Open inline editor on last row.<br>4. Verify footer/pagination does not obstruct row. | Row 200 is fully reachable, visible, and interactive. Controls are not occluded by floating action buttons, sticky footers, or sub-bars. | Automated E2E (Playwright) | ZCode FE / QA | `NOT_RUN` |
| **VAL-SCN-05** | **Self-Verification Prohibition** | Evidence Drawer (SCR-07), Desktop 1440x900 | 1. Log in as user `U-01 Coordinator` (submitter of EV-04).<br>2. Navigate to EV-04 verification view.<br>3. Attempt to click "Accept / Verify". | Verify button is disabled with `--disabled` styling. Tooltip explicitly states: "Submitter cannot verify own proof." Action is blocked client-side and server-side. | Automated E2E (Playwright) | ZCode FE / QA | `NOT_RUN` |
| **VAL-SCN-06** | **Bulk Edit Allowlist & Partial Results** | Bulk Modal (SCR-10), Desktop 1440x900 | 1. Select 5 rows.<br>2. Open Bulk Editor.<br>3. Verify form only allows editing owner, due date, and note.<br>4. Trigger simulated conflict on Row 3.<br>5. Submit batch. | Rows 1, 2, 4, 5 update successfully. Row 3 fails with 409 Conflict. Dialog clearly reports 4 updated, 1 failed. Row 3 remains selected with error reason visible. | Automated Integration Test | ZCode BE+FE / QA | `NOT_RUN` |
| **VAL-SCN-07** | **Keyboard Navigation & Focus Restore** | Operational Grid (SCR-03), Desktop 1440x900 | 1. Navigate grid rows using `ArrowUp` / `ArrowDown`.<br>2. Press `Enter` on row to open Drawer.<br>3. Press `Escape` to close Drawer.<br>4. Verify focus returns to the original row trigger. | Focus ring is clearly visible (2px blue halo). Escape closes drawer and restores focus strictly to the triggering row. No loss of focus to `body`. | Automated Accessibility Test | ZCode FE / QA | `NOT_RUN` |
| **VAL-SCN-08** | **200% Accessibility Zoom Reflow** | All Screens, Desktop 1280x800 at 200% Zoom | 1. Scale browser viewport to 200%.<br>2. Walk through Control Room, Grid, and Detail Drawers.<br>3. Inspect for horizontal scrolling and text overlap. | Content reflows into single column where appropriate. No accidental text overlap, clipped modal titles, or horizontal page scroll bars. | Manual / Headless Inspection | Accessibility Lead | `NOT_RUN` |
| **VAL-SCN-09** | **Mobile Reflow & Touch Targets** | Mobile Viewport 390x844, Touch Emulation | 1. Access Control Room on mobile.<br>2. Verify cards render vertically with minimum 44px tap targets.<br>3. Navigate to Grid.<br>4. Verify Triage Card stack replaces horizontal table. | All touch targets meet 44px minimum. Touch controls respond without lag. Triage cards expose all matching records without truncation. | Manual Device Lab / Mobile QA | ZCode FE / QA | `NOT_RUN` |
| **VAL-SCN-10** | **Long Vietnamese Labels & Diacritics** | Grid & Drawers, Desktop & Mobile | 1. Inject Vietnamese strings (e.g., "Nghị quyết phê duyệt giao dịch mua bán sáp nhập và tái cơ cấu doanh nghiệp").<br>2. Inspect line heights and diacritic clipping. | Vietnamese diacritics (dấu ngã, dấu nặng, dấu hỏi) render crisply without clipping top or bottom accents. Line-height 1.5 accommodates accents. | Visual Inspection | Localization / QA | `NOT_RUN` |
| **VAL-SCN-11** | **Delta Status Brief Windowing** | Brief Viewer (SCR-12), Desktop 1440x900 | 1. Set $t_1 = T_{-1}$, $t_2 = T_0$.<br>2. Generate Brief.<br>3. Verify Section A shows changes in $(t_1, t_2]$.<br>4. Verify Section B shows outstanding items at $t_2$. | Changes between $t_1$ and $t_2$ are strictly separated from outstanding items. Report includes provenance hash, generator timestamp, and matter ID. | Automated Test | ZCode BE+FE / QA | `NOT_RUN` |
| **VAL-SCN-12** | **Inaccessible Matter Security (404)** | App Shell (SCR-01), Direct URL Navigation | 1. Log in as user without membership in `ATLAS-002`.<br>2. Directly navigate to `/ATLAS-WS/ATLAS-002`.<br>3. Inspect HTTP status and rendered DOM. | Server returns HTTP 404. Page renders generic "Matter not found" card. Zero matter metadata, title, or member counts appear in response headers or HTML. | Automated Security Test | ZCode BE / SecOps | `NOT_RUN` |

---

## 4. Execution Responsibility & Tooling Architecture

- **Tooling Stack**:
  - Headless Browser Testing: Playwright with Chromium, Firefox, WebKit engines.
  - Accessibility Automation: `axe-core` integrated into Playwright test runners (WCAG 2.1 AA ruleset).
  - Visual Regression: Pixel-diff comparison at $0.1\%$ tolerance threshold.
  - Performance: Chrome DevTools Protocol measuring First Contentful Paint (FCP) and Layout Shift (CLS).
- **Independent QA Gate**: All test outputs must be formally reviewed and signed off by an **independent, nonauthor reviewer** assigned by Codex before production deployment.
