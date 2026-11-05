# Findings — MC-ZCODE-UI-UX-CONSISTENCY-AUDIT-20261029

Priority key: **P1** functional/accessibility harm; **P2** repeated design-system drift; **P3** isolated polish. Every finding names the comparison pair, evidence, and the smallest correction (proposal only — no source was edited). "Rendered" = measured on the retained dev runtime :3000, **RUNTIME_REVISION_UNCONFIRMED** (next dev Turbopack started 15:03+0700, before the 16:50 edits; `/` currently 307s to a `/dashboard` route absent from the reviewed source). Where rendered geometry matches reviewed-source class math exactly, the source conclusion stands independently.

Known functional findings are **not** re-counted here: RMV-F01 (missing answer expectation), RMV-F02 (UNKNOWN retry payload drift), RMV-F03 (truncated history), RMV-F04 (P1 access-loss retention) belong to the review-matrix rework (`docs/implementation/handoffs/MC-REVIEW-MATRIX-ZCODE-REWORK/`), whose writer owns `features/review/**` — findings F-01/F-03 below touch that writer's files and must be re-checked against the rework's final bytes.

---

## F-01 — P2 — INCONSISTENT — Two different "Search" submit buttons on the same class of grid page
- Family: search submit on a filterable grid.
- Pair: `features/work/components/work-filters.tsx:162` uses `<Button type="submit">` (primary md, rendered 36px, dark #202124, weight 500) vs `features/review/components/review-filters.tsx:63-68` hand-rolls a raw `<button type="submit" className="control-target rounded-md border border-input bg-card px-3 text-sm hover:bg-accent">` (rendered 32px, white outline, weight 400).
- Evidence: metrics M-25 vs M-33 (same viewport/theme/locale); source lines above.
- Impact: identical verbs ("Search") look and behave like different control tiers on the two main grids; keyboard/AT users get no signal that they differ on purpose.
- Smallest correction: replace the raw button in `review-filters.tsx` with `Button` (an outline variant if primary is considered too heavy there — but then apply the same choice to both grids), or extract a shared `SearchSubmit`. Affected tests: review filters UI tests; work filters tests unchanged.
- Note: review-filters is owned by the active review-matrix rework writer — coordinate before editing.

## F-02 — P2 — INCONSISTENT — Adjacent same-tier controls differ in height: Input 40px vs Select/Button 36px
- Family: form row of input/select/button.
- Source: `components/atoms/input.tsx:13` adds `min-h-10 py-2` (40px) on top of `fieldControlClass`, while `select.tsx:32` uses `min-h-9` (36px) and Button `md` is `min-h-9` (36px). Rendered: work-filters search row (M-24 40px vs M-25 36px, `items-end` aligned); New-workspace dialog (M-13 40px vs M-14 36px).
- Impact: every form shows a 4px top-edge mismatch between the text field and the submit button / selects in the same row; the most repeated geometry in the product.
- Smallest correction: decide the tier — either `Input` → `min-h-9 py-1.5` (matches Select and Button md), or raise Button md/Select to 40px. First option is the smaller change (one class in `input.tsx`) but shifts input height everywhere (tests with fixed heights, Storybook snapshots). Owner decision required.

## F-03 — P3 — INCONSISTENT — Two filter-chip visual languages
- Pair: work applied-filter chips (`work-filters.tsx:226-240`: `min-h-9 rounded-full border bg-muted px-3 py-1 text-xs`) vs review cell-state chips (`review-filters.tsx:20-24`: `control-target rounded-full border px-3 text-sm`, active `bg-primary/10`). Rendered 36px/12px-text vs 22px/14px-text (M-27-context vs M-30/31).
- Also differs from `Badge` (rounded-sm px-2 py-0.5) — badge is a status label, chips are interactive, so Badge is a legitimate separate family; the two chip implementations are not.
- Smallest correction: extract one `FilterChip` (link-based, control-target, one size/typography), use it in both filters and reviews.

## F-04 — P3 — INCONSISTENT — `global-error.tsx` bypasses the shared button contract
- `app/global-error.tsx:36-42`: raw `<button className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent">` — `px-4 py-2` (≈38-40px) vs buttonVariants outline md `px-3 py-1.5` (36px), missing `bg-card`, `shadow-xs`, `control-target`, and the disabled-token block. Sibling pages do it right: `not-found.tsx:22` and `(app)/error.tsx:25` use `buttonVariants`/`Button`.
- Correction: import `buttonVariants({ variant: 'outline' })` — it is a pure module and already imported-adjacent (LocalizedText is imported there), no app-shell dependency.

## F-05 — P3 — INCONSISTENT — Two disabled-pagination-link conventions, and the shared molecule that owns one of them is unused
- Pair: `my-actions-view.tsx:429` Step disabled = `<span aria-disabled class="text-disabled">` (kept in the a11y tree, announced; rendered 26px, M-17) vs `molecules/pagination.tsx:38` edge disabled = `<span aria-hidden class="pointer-events-none opacity-50">` (removed from the a11y tree; opacity-based, the exact style the earlier visual-delta recommended against for Step).
- Amplifier: `pagination.tsx` has **no product consumers** (grep: only its own file/tests/stories); actual pagination controls (`matter-history.tsx:141-150`, `work-grid.tsx:198-204`) render outline md links conditionally with no disabled state at all.
- Correction: pick one semantic rule (recommend: keep `aria-disabled` + `text-disabled`, i.e. the Step pattern, since "you are at the boundary" is state information), and either adopt `Pagination` for matter-history/work-grid or delete it.

## F-06 — P3 — INCONSISTENT + touch-target gap — Disclosure `summary` families (SOURCE_ONLY for the touch behavior)
- Two families: (a) `control-target` disclosures — workbench (`my-actions-view.tsx:489`), matter History (`matters/[matterId]/page.tsx:134`), event details (`matter-history.tsx:115`), Advanced filters styled as an outline button (`work-filters.tsx:168`); (b) bare `cursor-pointer underline` summaries with no `control-target` — `proof-panel.tsx:227,386,422`, `planning-view.tsx:131,226`, `dependency-panel.tsx:221`, `context-forms.tsx:111` (also color/size variants: `text-primary underline` vs plain).
- Gap: the coarse-pointer/small-screen base rule (`globals.css:173-186`) covers `button, input, select, textarea, a[data-control]` — **not `summary`** — so family (b) keeps a ~20px touch row on phones while family (a) grows to 44px. Also `a[data-control]` has zero users in src (dead selector, F-07).
- Correction: add `summary` to that media rule (one line), then converge family (b) on one style (either the workbench disclosure look or one shared `TextDisclosure` component).

## F-07 — P3 — dead selector `a[data-control]`
- `globals.css:178` styles `a[data-control]`; `grep -rn "data-control" src` → 0 hits. The intended link touch-target mechanism is unused (button-styled links get 44px via `control-target` instead; plain text links are not enlarged — arguably by design).
- Correction: delete the selector, or document+use it. Deleting is the smaller change.

## F-08 — P3 — INCONSISTENT — partial localization on the upload surface and one error body
- `features/proof/components/document-forms.tsx:267` (`'Retry upload' : 'Upload version'`), `:271` (`'Earlier upload not confirmed'`), `:277` (`'Version stored.'` / `'This file had already been stored.'`) are hardcoded English inside an otherwise localized file (26 `LocalizedText` uses); `app/(app)/error.tsx:23` hardcodes the alert body while its title is localized. VI users get mixed-language strings on these surfaces.
- Correction: wrap the four strings in `LocalizedText` (no layout change expected; VI copy needed from the owner).

## F-09 — P3 — INCONSISTENT — raw icon-only clear button lacks the touch min-width (SOURCE_ONLY)
- `molecules/search-input.tsx:21-29`: absolute `p-1` raw `<button>` (~24×24 desktop). The base media rule forces `min-height: 2.75rem` on all buttons at ≤639px/coarse but **not min-width** — only `.control-target` adds min-width, and this button doesn't have it. So on touch: 44px tall, ~24px wide. Button `size="icon"` controls (theme toggle, dialog close) get 44×44 via `control-target` (measured M-04/M-12 at desktop 32×32; 44px rule verified at 390 for control-target controls, M-38..M-41).
- Correction: give it `control-target` (accepting 44×44 overlay) or rebuild as `Button size="icon"`; verify overlay doesn't clip the input's clear affordance at 390.

## F-10 — P3 — INCONSISTENT — icon-button sizes 28 vs 32
- `inline-edit.tsx:65` overrides `size="icon"` with `size-7` (28×28); `dialog.tsx:106` uses `size-8` (32×32); `theme-toggle.tsx:14` uses default icon (32×32). Two sizes for the same "small inline icon button" role.
- Correction: standardize on 32 (drop the `size-7` override) unless the row-density context justifies 28 — if kept, document it as an allowed compact variant.

## F-11 — P3 — observation — two tab families differ (likely intentional; recorded to prevent accidental "harmonization")
- My Work queue tabs: 44px flat, selected = `--navigation` blue underline (M-15/16). Matter section tabs: 38px `rounded-t-md` underline (M-22). Different levels (top-level section nav vs in-page section nav) — plausibly intentional hierarchy. Also the density segmented control marks the active segment with `outline` while the (unused) Pagination molecule marks the current page with `secondary` — if Pagination is adopted, align the active treatment.

## F-12 — P3 — SOURCE_ONLY — unused shared Pagination molecule
- `molecules/pagination.tsx` (outline sm edges, secondary current page, aria-labeled, disabled edges) has no product consumers; the product's two real paginations hand-roll outline md links with different a11y semantics (F-05). Either adopt it (matter-history + work-grid + any future API pagination) or delete it to stop the drift.

---

## Explicit do-not-normalize list (INTENTIONAL_VARIANT, with provenance)
1. **`work-primary` CTA 160×44/14px** (`globals.css:395-400` + `my-actions-view.tsx:268-270`). The fidelity addendum demanded ≥200×56/16px, but the same-day PO typography/density amendment ("supersedes the original exact prototype sizes with a compact 14px app body") superseded those numbers (`docs/implementation/tasks/MC-P0-CODEX-UI-FIDELITY-20261029.md`, amendment section; evidence `codex-vietnamese-font-20261029-r1`, `codex-ui-density-20261029-r1`). Rendered M-18 confirms 160×44.
2. **Primary vs outline dialog triggers** — one primary create action per surface (`New workspace/Matter/document/filing/review grid/Add work`), `triggerVariant="outline"` for secondary mutators (Add version/question, staged filing forms, Add to matter). Consistent rule; keep.
3. **Two "Sign in" tiers** (sidebar outline sm vs page primary md) — shell action vs state-resolution CTA.
4. **Step prev/next, queue rail, Up next** families in the workbench — approved composition; their disabled Step (`aria-disabled` span) is the recommended pattern (F-05 goes the other way).
5. **TaskChoice card buttons** and **Badge** — different control semantics, not buttons/chips.
6. **Breadcrumb and inline text links** (`underline` family) — navigation, not buttons; do not button-ify (F-07-style inline color variance is the only P3 note).
7. **Destructive two-step** (`ConfirmActionButton` sm destructive + warning) — consistent everywhere it is used; keep.
8. **Prototype-only 200×56/17px/260px values** — reference artifact numbers, not current product targets (see 1).

## Cross-references (not counted as UI polish findings)
- RMV-F04 (P1): access-loss keeps protected review detail rendered — functional, owned by the rework.
- RMV-F02: UNKNOWN retry payload drift — functional, owned by the rework.
- Retained dev runtime intermittently stalls route renders (observed 3×; API /healthz /readyz 200 throughout) — consistent with the recorded timing-flake work in the rework packet; operations, not UI.
- `global-error`/`error` pages console.error only — acceptable for P0; noted, not a finding.
