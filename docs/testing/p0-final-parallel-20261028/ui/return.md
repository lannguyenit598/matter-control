# MC-P0-UI-REST-E2E-QA-R1 — Antigravity UI/UX + Product QA Return

**Task ID:** `MC-P0-UI-REST-E2E-QA-R1`  
**Actual Agent / Tool:** Antigravity (Google Antigravity Agent, Claude 3.5 Sonnet / Gemini model family)  
**Role:** Independent UI/UX + Product QA Reviewer (Non-Author of Local Codex remediation)  
**Repository:** `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`  
**Branch:** `codex/unified-project-flow`  
**Git Base / Head:** `a62d838791ba188838c4ff00b7b6e265ac775056` (Unchanged, product source uncommitted)  
**Evaluation Timestamp:** `2026-10-28T08:12:00Z`  
**Proposed Next Status:** `IN_REVIEW_WITH_VERIFICATION_BLOCKERS` (Requires Local Codex remediation for findings; no self-closed gate)

---

## 1. Input Verification & Integrity

All six mandatory inputs were verified against their task-declared SHA-256 checksums and exact byte counts. Zero drift was detected:

| File | Bytes | SHA-256 | Verification Status |
|---|---|---|---|
| `docs/testing/p0-codex-remediation-20261028/final-source-manifest.json` | 139,099 | `0f169ae1a25a0a94b591941d36eec78e8091c1c8beabc5357e193c8f0e5fd821` | **VERIFIED MATCH** |
| `docs/testing/p0-codex-remediation-20261028/return.md` | 10,478 | `c3c81cbcc76bc93f563fc23b1a5681f4a75c3bc9d6bb80f1fecc96dfee673583` | **VERIFIED MATCH** |
| `docs/testing/p0-codex-remediation-20261028/review-intake.json` | 993 | `c611c7e3103f18a9d8558a56a23ba717099391f7456801e3be1b4b78cf2e57b1` | **VERIFIED MATCH** |
| `docs/implementation/p0-zcode-execution/local-contract.md` (rev12) | 53,744 | `814c419222b966d6f340cb421ab8d8d44b3310ece336cc9cbe1b747472194e30` | **VERIFIED MATCH** |
| `docs/design/p0-handoff-r9/return.md` | 12,863 | `d4dc769f1958f486a17a9a90fa5b1060de3172a2b07b544c6f1adff788b14b3d` | **VERIFIED MATCH** |
| `docs/design/p0-handoff-r9/manifest.json` | 20,096 | `2b68bc92431270dc456111590ca1de2231e2a10dba95829dccd0a3b68ba87563` | **VERIFIED MATCH** |

### Design R9 Deliverable Pins Consumed (8 Root Pins from Manifest)
- `current-ux-spec.md` (27,927 bytes, `a6e1c030d1a48b6862ad204b3211278250ca84ebce50fc9a9166dd9a44b58e31`)
- `design-delta.md` (30,930 bytes, `ee06e417560f4ba168833f3d7706fbe607e716d2cca7cfaffab13b7e8ca1ee68`)
- `findings-disposition.json` (91,474 bytes, `c59a9cb9b5eb6a80b96aa5b143bd64b2ab14f5070102e5d51d0416537026f2bb`)
- `polish.css` (17,871 bytes, `8148d0a17d3d488f157a32fdf1c20fd2fc0b4f1079605e65b61bac6b6af59fcc`)
- `prototype.html` (213,630 bytes, `3a6c15484a722408f66137e68b3d7ada03c0f8670ffb421e8e3489b831ae0e2c`)
- `screen-state-matrix.json` (63,600 bytes, `f89ffb920bb1e4c8cd0f92b34ca35531bceeac17eb0dee86ae821f5567b27101`)
- `validation-plan.md` (21,681 bytes, `ca33df6c2d60d4129eb957f39850d23bb54bf86e6395c0d66553e5e20ef7a1a1`)
- `zcode-handoff.md` (15,705 bytes, `c1f71dc682d592f63e64aa145a4de884748859958b55eba8d59ab9a2ffd5a4a3`)

### Skills Audited & Recorded
- `a11y-debugging`: Loaded and applied for accessibility tree checks, ARIA role mapping, and keyboard focus flow analysis.
- `modern-web-guidance`: Loaded and applied for standard HTML dialogs, focus trapping, CSS container/media query rules.
- `design-taste-frontend`, `hallmark`, `impeccable`: Audited against the local plugin repository; verified as **NOT_INSTALLED** on this host. Evaluation strictly referenced R9 specification files directly.

---

## 2. Phase A: Source & Specification QA Results

### 2.1 13-Screen 9-State Matrix Coverage
Audit against `docs/design/p0-handoff-r9/screen-state-matrix.json` across all 117 matrix cells (13 screens x 9 states):
- **Implemented in Source & Routes:** 103 cells
- **Not Applicable to Specific Surface:** 14 cells (e.g., freeform text search on detail drawers, conflict states on read-only aggregator views)
- **Missing or Unreachable Gaps:** 0 cells
- Full mapping recorded in `screen-state-coverage.json`.

Key Surface Routing:
1. **SCR-01 (App Shell & Navigation):** `apps/frontend/src/app/(app)/layout.tsx`, `/workspaces`, `/login`.
2. **SCR-02 (Executive Control Room):** `/matters/[matterId]/control-room` (`control-room-view.tsx`).
3. **SCR-03 (Operational Grid & My Actions):** `/matters/[matterId]/work` (`work-grid.tsx`) and `/my-actions` (`my-actions-view.tsx`).
4. **SCR-04 & SCR-05 (Requirement vs Action Drawers):** `/matters/[matterId]/work/[itemId]` (`work-item-detail.tsx`).
5. **SCR-06 (Dependency Graph & Impact):** `/matters/[matterId]/planning` (`planning-view.tsx`, `milestone-list.tsx`).
6. **SCR-07 (Evidence Submission & Verification):** Embedded via `ProofPanel` (`proof-panel.tsx`).
7. **SCR-08 (Document Versions & Promotion):** `/matters/[matterId]/documents/[documentId]` (`document-forms.tsx`).
8. **SCR-09 (Regulatory Filing Tracker):** `/matters/[matterId]/filings/[filingId]` (`filing-view.tsx`).
9. **SCR-10..12 (Bulk Edit, Import Wizard, Delta Brief):** `/matters/[matterId]/data` (`data-transfer-panel.tsx`).
10. **SCR-13 (Scoped Event History & Ledger):** `/matters/[matterId]/history` (`matter-history.tsx`).

### 2.2 Design System, Typography, Radius & Color Semantics
- **Typography:** Body strictly uses `"Segoe UI", "Helvetica Neue", Arial, sans-serif` at 14px (`text-sm`, line-height `1.5`). Headings strictly use 22px (`text-[1.375rem]`, semibold, tracking normal). Monospace strictly applied to IDs, timestamps, and hashes. Geist fonts completely eliminated from `layout.tsx` and dependencies.
- **Density:**
  - Comfortable rows: `h-11` (min 44px height), `px-3 py-2.5` padding, 14px body font.
  - Compact rows: `h-9` (min 36px height), `px-2 py-1` padding, 14px body font.
  - Long titles and reasons wrap naturally in `max-w-xs` without horizontal text truncation.
- **5-Axis Independent Color Tokens:**
  - `--execution: #364152`
  - `--verification: #236341`
  - `--dependency-ready: #174ea6`
  - `--dependency-blocked: #8a2925`
  - `--timing: #775317`
  - `--attention: #783e14`
  - Zero conflation of Execution with Verification in badge rendering (`work-badges.tsx`).
- **Dark Theme Equivalence:** `[data-theme='dark']` defines OKLCH equivalents for all semantic tokens and axes. Theme switcher in `theme.ts` applies `data-theme` prior to DOM hydration, preventing flash of unstyled content.
- **Reflow & Mobile Touch Targets:** `@media (max-width: 639px), (pointer: coarse)` enforces min 44px (`2.75rem`) on buttons, inputs, selects, textareas, and interactive `.control-target` anchors.

### 2.3 Full Keyboard & Accessibility (A11y)
- **Focus Rings:** Distinct `:focus-visible` styling (`outline-2 outline-offset-2 outline-ring`) with custom white outline contrast on dark header (`app-header :focus-visible`).
- **Dialogs & Modals:** Built using native `<dialog>` elements with `showModal()`, automated focus trap, and Escape key restoration.
- **Screen Reader Readiness:** Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<section>`), `sr-only` table captions, `scope="col"` and `scope="row"` headers, and `aria-live="polite"` on result counts are properly wired.
- **Limitation:** Physical assistive screen reader voice output verification is marked `VERIFICATION_BLOCKED` as actual assistive software cannot run in this headless environment.

### 2.4 Product Workflows & Integrity Gates
- **Requirement vs. Action Separation (RULE-007):** Distinct domain entities. Requirements track what must be true (lifecycle & proof verification); Actions track work assignments (execution). An item can be `COMPLETED` in execution while remaining `UNVERIFIED` in verification.
- **Independent Verifier Separation (RULE-014):** Evidence submitter is prevented from self-verifying. Only designated verifiers render assessment affordances.
- **Explicit Version Promotion (RULE-016):** Uploading a new document version does not make it current. Current status requires an explicit decision by an OWNER. R9-N03 fix verified: separate `promote-target` select and expected-current guard.
- **Regulatory Filings & Negative Outcomes (RULE-019):** Stepper marks current step with `aria-current="step"`. Open negative outcomes render a prominent alert indicating that approval is blocked until an owner closes or reopens the filing.
- **Import Verification Claim Non-Authoritative (CL-03):** Import preview displays `importedVerificationClaim` as an unverified source claim (`unverified until proved here`), never granting `VERIFIED`. Dependency events land atomically on backend commit.
- **Bulk Edit Reconciliation & Slots:** Server session slot locks prevent concurrent running mutations. Terminal receipts cached until explicit browser ACK (`acknowledgeTransferAction`).

### 2.5 Recovery Regressions & Access-Loss Purge
- **Reload / Tab Close (CL-04):** `RecoveryGate` mount runs `recoverTransfersAction` in read-only mode; withholds new mutation forms and never posts mutations on reload.
- **Terminal Response Lost:** Receipts read from session cache without resending mutation; matching ACK releases the lock.
- **UNKNOWN Outcome Idempotency:** Receipted commands freeze the exact submitted payload and idempotency key for same-key retry (`retrySameKey=true`). CAS-only commands block resending and enforce state re-read (`requiresReread=true`).
- **Access-Loss Purge (R8-N01 & CL-04):** `revokeAttempts` purges protected payloads immediately and sets `{ blocked: matterId }`. Subsequent re-grant never revives purged data.

### 2.6 NFR-010 Multi-Language Audit
- **Findings:**
  - Form intent and selections survive EN/VI language toggling via `sessionStorage` draft persistence.
  - User-authored legal content is strictly untranslated.
  - **Critical Gap:** Vietnamese localization is currently implemented ONLY in `MatterHistory`, `locale-toggle`, and the dashboard skip-link. Screens SCR-01 through SCR-12 (App Shell, Control Room, Work Grid, Planning, Proof, Documents, Filings, Data Transfer, Bulk Edit, Import, Brief) use hardcoded English strings.
  - **Verdict:** NFR-010 status is **PARTIAL_INFRASTRUCTURE_ONLY / CHANGES_REQUIRED**, NOT PASS.

### 2.7 AC-137 Human-Only Comprehension Protocol
- Prepared two decoupled deliverables in the QA output directory:
  1. `ac-137-participant-packet.md`: Complete scenario guide (Scenario A: Control Room, Scenario B: Work Grid/Proof), tasks, and response sheet for 5 legal managers without any answer hints.
  2. `ac-137-facilitator-guide.md`: Confidential scoring rubric (50 points total, 80% passing threshold for 5 real managers), timing protocols, and complete answer key.
- **Verdict:** Formally recorded as `TRIAL_NOT_RUN / AWAITING_HUMAN_TRIAL`. Zero synthetic participant data was fabricated.

---

## 3. Test Suites Execution & Verification Evidence

| Test Suite | Command | Result | Test Counts | Notes |
|---|---|---|---|---|
| Frontend Check | `pnpm --dir apps/frontend check` | **EXIT 0** | Typegen OK, TypeScript OK, ESLint OK, Prettier OK, **44 files / 444 tests pass**, Agent config OK | Ran against candidate source |
| Webpack Build | `pnpm --dir apps/frontend exec next build --webpack` | **EXIT 0** | 24 static and dynamic routes compiled successfully | Confirmed all product routes compile |
| Targeted Recovery Test | `pnpm --dir apps/frontend vitest run src/components/organisms/recovery.test.tsx` | **EXIT 0** | 1 file / 8 tests pass | Verified pass in isolation |

### Test Flakiness Finding (FINDING-UI-01)
During initial full parallel vitest run (44 files / 444 tests), `src/components/organisms/recovery.test.tsx:163` failed intermittently:
`AssertionError: expected "vi.fn()" to be called at least once`
**Root Cause:** Line 163 asserted `expect(router.refresh).toHaveBeenCalled()` synchronously after clicking "Reload current state". In `ConfirmActionButton`, `reread()` wraps `router.refresh()` in React 19's `startTransition`. Under high parallel jsdom load, the transition does not flush synchronously. When rerun sequentially or when using `await waitFor(...)`, the test passes 100%. Recorded in `findings.json` as `CHANGES_REQUIRED`.

---

## 4. Phase B: Runtime Status & Blockers

Per explicit assignment instructions:
> "B. Runtime chỉ sau verified `docs/testing/p0-final-parallel-20261028/zitadel/runtime-ready.json` **và** `auth-slot-released.json`. Read back origin/source/resource ledger, xác minh REST profile/current source. Nếu chưa có, hoàn thành A + testplan/fixtures/specs trong output; đánh dấu runtime WAITING_RUNTIME_CUE, không tự start stack/mock/auth bypass."

### Runtime Cue Verification
- `docs/testing/p0-final-parallel-20261028/zitadel/runtime-ready.json`: **ABSENT** (`No such file or directory`)
- `docs/testing/p0-final-parallel-20261028/zitadel/auth-slot-released.json`: **ABSENT** (`No such file or directory`)
- **Status:** **`WAITING_RUNTIME_CUE`**
- In compliance with protocol, Antigravity has NOT started backend/frontend stacks, bypassed authentication, or used mock route handlers.

### Prepared REST E2E Artifacts (Ready for Execution when Cue Arrives)
1. `docs/testing/p0-final-parallel-20261028/ui/playwright.rest.config.ts`: Configured strictly for non-demo REST execution (workers: 1, trace: off to protect secrets, no auto webServer start, targeting external REST baseURL).
2. `docs/testing/p0-final-parallel-20261028/ui/e2e/product-rest-validation.spec.ts`: Test suite verifying CSP violations, Control Room triage hierarchy, Work Grid 5-axis independence, My Actions 4-part structure, and recovery gate behavior.

---

## 5. Summary of Findings

| ID | Title | Severity | Disposition | Proposed Resolution |
|---|---|---|---|---|
| **FINDING-UI-01** | Intermittent timing flakiness in `recovery.test.tsx:163` | MEDIUM | CHANGES_REQUIRED | Wrap assertion in `await waitFor(() => expect(router.refresh).toHaveBeenCalled())` |
| **FINDING-UI-02** | NFR-010 Vietnamese localization incomplete across SCR-01..12 | HIGH | CHANGES_REQUIRED | Add translation dictionaries across all feature chrome/navigation; keep legal content untouched |
| **FINDING-UI-03** | 409 `urn:mc:rejected` contract error mapping recognized | LOW | IN_REVIEW | Handled properly in frontend; design check scripts should recognize rev12 contract |
| **FINDING-UI-04** | Live REST E2E & Browser verification blocked on Zitadel cue | MEDIUM | VERIFICATION_BLOCKED | Held at `WAITING_RUNTIME_CUE`; Playwright REST config and specs prepared |
| **FINDING-UI-05** | AC-137 5 real managers trial awaiting participant cohort | MEDIUM | AWAITING_HUMAN_TRIAL | Participant packet & Facilitator guide delivered; await real human cohort |

---

## 6. Deliverable Manifest

All deliverables have been created exclusively under `docs/testing/p0-final-parallel-20261028/ui/`:
1. `return.md`: This comprehensive evaluation return.
2. `inputs.json`: Verified input file hashes and byte counts.
3. `screen-state-coverage.json`: Complete 13-screen 9-state (117 cells) implementation matrix.
4. `cases.json`: Detailed 25-case evaluation log covering tokens, a11y, workflows, and recovery.
5. `findings.json`: 5 structured findings with severity, proof, and proposed remediation.
6. `ac-137-participant-packet.md`: Independent participant testing material.
7. `ac-137-facilitator-guide.md`: Confidential facilitator scoring guide and answer key.
8. `playwright.rest.config.ts`: Dedicated REST E2E Playwright configuration.
9. `e2e/product-rest-validation.spec.ts`: Dedicated REST E2E test specification with CSP guard.
10. `outputs-manifest.json`: SHA-256 and byte inventory of all produced artifacts.

---

## 7. Proposed Next Actions

1. Local Codex primary remediation owner to resolve `FINDING-UI-01` (recovery test timing race) and `FINDING-UI-02` (comprehensive NFR-010 multi-language dictionaries).
2. Zitadel session owner to provide `runtime-ready.json` and `auth-slot-released.json` cues when the live REST environment is accessible.
3. Product Owner to authorize and schedule the AC-137 human trial using the prepared decoupled participant and facilitator packages.
4. Retain status as **`IN_REVIEW_WITH_VERIFICATION_BLOCKERS`**. Do not self-close any release or architecture gates.
