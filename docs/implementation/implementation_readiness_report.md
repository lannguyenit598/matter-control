# Stage 9: Implementation Readiness Test Report (Round 2)

- **Target Document**: [`docs/implementation/ui-issues-remediation.md`](ui-issues-remediation.md#L75-L250) (Detailed Implementation Plan: lines 75–250)
- **Reviewer**: Pragmatic Tech Lead (`egm-implementation-readiness`)
- **Date**: 2026-11-02
- **Verdict**: ✅ **READY FOR EXECUTION (0 Blockers, 1 Major, 1 Nit)**

---

## 1. Executive Implementation Verdict

The Detailed Implementation Plan in `docs/implementation/ui-issues-remediation.md` has successfully incorporated all rulings from the Intermediate Zoom-Out Review:
- **Blockers Cleared**: Both previous compilation blockers (**F-01** parameter destructuring in `Dialog` and **F-02** parameter destructuring in `AppSidebar`) are resolved with explicit signatures and diffs.
- **Line & Selector Precision**: Line references for `select.tsx` (135–139), `layout.tsx` (90 and 33–44), `matter-search.tsx` (28), and `proof-panel.tsx` invariant verification match the actual source files in `apps/frontend`.
- **Command & Build Prerequisite**: Verification commands correctly wrap `rtk proxy pnpm --dir apps/frontend ...` and explicitly include the mandatory production build prerequisite (`pnpm build`) before executing `PREFETCH_TEST=1` Playwright runs.
- **Actionability**: Plan is ready for turnkey execution.

---

## 2. Checkpoint Verifications against Upstream Rulings

### 1. F-01 & F-02 Destructuring Integrity
- **F-01 (`dialog.tsx`)**: Confirmed. `dialog.tsx:31-39` destructures `closeAriaLabel` within `DialogProps`, calls `const locale = useLocale()`, computes `resolvedCloseLabel = closeAriaLabel ?? (locale === 'vi' ? 'Đóng' : 'Close')`, and assigns it to `<Button aria-label={resolvedCloseLabel} ...>`.
- **F-02 (`app-sidebar.tsx` & `layout.tsx`)**: Confirmed. `app-sidebar.tsx:15` destructures `navAriaLabel` and renders `<nav aria-label={navAriaLabel ?? 'Main'} ...>`. `layout.tsx:33-44` resolves `const locale = await uiLocale()` inside `AuthenticatedWorkbench` and passes `navAriaLabel={locale === 'vi' ? 'Điều hướng chính' : 'Primary navigation'}` to `<AppSidebar>`, preserving the React Server Component boundary without client hook leakage.

### 2. Line Number & Selector Accuracy
- **`select.tsx:135-139`**: Confirmed. Targets `ui-select min-h-10 ... max-sm:py-2.5` trigger classes and replaces with `leading-normal max-sm:min-h-11 max-sm:py-3`.
- **`layout.tsx:90`**: Confirmed. Targets `<summary>` at line 90 and appends `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring`.
- **`layout.tsx:33-44`**: Confirmed. Correctly targets `AuthenticatedWorkbench` and `<AppSidebar>` callsite.
- **`matter-search.tsx:28`**: Confirmed. Targets hook invocation location directly after `useTransition()`.
- **`proof-panel.tsx:744-765` Invariant Verification**: Confirmed. Documents that concise label (`"Valid for (days)"`) and hint separation is an existing invariant in current code.

### 3. Verification Suite & Production Build Prerequisite
- **Vitest**: `rtk proxy pnpm --dir apps/frontend test`.
- **Typecheck**: `rtk proxy pnpm --dir apps/frontend typecheck`.
- **Production Build Prerequisite**: `rtk proxy pnpm --dir apps/frontend build` explicitly listed before Step 4.
- **Playwright Suite**: `PREFETCH_TEST=1 rtk proxy pnpm --dir apps/frontend exec playwright test`.

---

## 3. Findings Matrix

| ID | Severity | Affected Scope | Finding & Remediation Guidance |
|---|---|---|---|
| **F-08** | 🟡 **Major** | Phase 5.1 (`dialog.test.tsx:56`) | **Provide exact test code diff**: Append test cases for default and custom `closeAriaLabel` to `dialog.test.tsx`. |
| **F-09** | 🟢 **Nit** | Phase 3.1 & Section 6 (`dialog.tsx:117-125`) | **Line number correction**: Close button is located at lines 117–125 (not lines 147–157). |

---

## 4. Concrete Remediation

### Guidance for F-08 (Phase 5.1: `dialog.test.tsx` Test Assertions)
Append to `describe('Dialog', ...)` in `apps/frontend/src/components/molecules/dialog.test.tsx`:
```tsx
  it('renders default close button accessible name', () => {
    setup()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('renders custom close button accessible name when closeAriaLabel is provided', () => {
    render(
      <Dialog open onOpenChange={() => {}} title="Edit" closeAriaLabel="Đóng">
        <input aria-label="Name" />
      </Dialog>,
    )
    expect(screen.getByRole('button', { name: 'Đóng' })).toBeInTheDocument()
  })
```

### Guidance for F-09 (Phase 3.1 & Section 6: `dialog.tsx` Line Reference)
Update line reference in `ui-issues-remediation.md` to `dialog.tsx:10-23, 31-39, 117-125`.
