# Normalization plan — PROPOSAL ONLY (MC-ZCODE-UI-UX-CONSISTENCY-AUDIT-20261029)

No source was edited in the audit session. Implementation needs a separately assigned writer; F-01/F-03 touch files owned by the active review-matrix rework writer — sequence after that rework lands or coordinate explicitly.

## Order of work (root corrections first)

### Step 1 — shared roots (one decision each, propagates everywhere)
1. **Control height tier (F-02).** Decide the adjacent input/select/button height. Recommended: move `Input` to `min-h-9 py-1.5` so Input = Select = Button md = 36px. Files: `components/atoms/input.tsx` (one class). Check: work-filters row, all dialogs, search-picker list rows (min-h-10 radio rows are list items, not fields — leave them). Regression: grep tests asserting input height; Storybook form-controls story.
   - Alternative (equally valid): raise Button md + Select to 40px. Larger blast radius; only choose if 40px fields are the intended density.
2. **Touch-target rule for summaries (F-06).** Add `summary` to the coarse-pointer/small-screen base rule in `globals.css` (the `@media (max-width: 639px), (pointer: coarse)` block). One line; raises all bare disclosures to 44px on touch while leaving desktop unchanged. Then converge the bare `cursor-pointer underline` summaries (proof-panel ×3, planning-view ×2, dependency-panel, context-forms) on a single shared style — recommended a tiny `TextDisclosure` molecule or a documented class, not per-file classes.
3. **Search submit (F-01).** Replace `review-filters.tsx` raw button with the shared `Button` (choose primary md to match the work grid, or introduce one shared outline "SearchSubmit" used by BOTH grids — do not leave one primary and one outline). Also align its input (32 → the chosen field tier).

### Step 2 — caller overrides (small, local)
4. **global-error (F-04):** import `buttonVariants({ variant: 'outline' })`; delete the hand-rolled classes.
5. **search-input clear (F-09):** add `control-target` (or `Button size="icon"`); confirm no overlay clipping at 390.
6. **inline-edit icon size (F-10):** drop `size-7` (or document 28 as the compact variant if row density requires it).
7. **Chip family (F-03):** one `FilterChip` molecule used by work-filters and review-filters (single size, typography, active treatment).

### Step 3 — isolated exceptions / cleanup
8. **Disabled-link semantics (F-05):** adopt the `aria-disabled` + `text-disabled` Step pattern as the rule; align or delete `molecules/pagination.tsx` (F-12) accordingly.
9. **Dead selector (F-07):** remove `a[data-control]` from `globals.css`.
10. **Localization (F-08):** wrap the four hardcoded strings (`document-forms.tsx:267,271,277`, `(app)/error.tsx:23`) in `LocalizedText` with owner-provided VI copy.

## Intended exceptions — do NOT normalize
`work-primary` CTA (PO density amendment); primary-vs-outline trigger hierarchy; two Sign-in tiers; workbench Step/queue/Up-next; TaskChoice cards; Badge vs chips (different semantics); breadcrumb/inline text links; ConfirmActionButton two-step destructive; matter-tab vs work-queue tab geometry (different nav levels — revisit only with the design owner); the approved prototype's 200×56/17px/260px reference numbers (superseded for the product by the PO amendment).

## Meaningful regression / visual checks for the writer
- `pnpm check` full suite (record it; the known upload-test timing flake must stay visible, not suppressed).
- Storybook: button/form-controls/search-input/pagination stories still render at both themes.
- Rendered: same-viewport screenshots at 1440/390 of work-filters row, one dialog, reviews filter row, workbench CTA — before/after, labeled RUNTIME identity (restart the dev server first so the module graph is current; the current server predates the 16:50 edits and still serves `/` → `/dashboard`).
- Keyboard: tab through a form row and a dialog; verify focus-visible ring unchanged.

## Safe writer ownership
Shared atoms (`input.tsx`, `globals.css`) affect every surface: assign one writer for Steps 1-2 in a single pass; do not parallel-edit `review-filters.tsx` with the review-matrix rework. Each step is independently revertible; no API/permission/business behavior change is required by any item.
