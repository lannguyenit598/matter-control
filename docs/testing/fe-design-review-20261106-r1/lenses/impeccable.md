# Lens 2 — impeccable (quality lens)

⚠️ DEGRADED: single-context (dispatch MC-FE-DESIGN-REVIEW-20261106 §3 requires per-lens attribution to a single reviewer; Assessment A run inline, deterministic detector run separately afterwards) — and **SELF-REVIEW / OWNER-CONFIRMATION** throughout (ADDENDUM-2). Not independent verification; non-author confirmation pass required before anything here gates.

- Base bytes: pin `41098a4d…` (isolated worktree). Render path: impeccable's own `--render`/slop-lint browser path BLOCKED (puppeteer-core not installed — known baseline, nothing installed); browser fallback used per dispatch §4.
- Mode: **Operate** (app UI for task completion) — scanability, consistency, native expectations outrank expression; brand lives in precise details.
- Method: fresh capture round `evidence/screens/lens2-impeccable/` (74 shots: 72 stories + 2 forced-dark), curated reads (formfield error, select invalid, pagination, inline-edit, search-picker slow, button states from lens-1 set), `impeccable detect --json src` over the frontend source, `impeccable context` loaded PRODUCT.md successfully (personas: Transaction Owner / Contributor / Reviewer-Manager).

## Nielsen heuristic scores (Operate mode; /40)

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Loading/spinner/fail states are honest and block-local; `aria-busy` on loading buttons; global action-completion announce exists as shell live-region (ActionAnnouncer) — announced-correctness check deferred to Pass 5 |
| 2 | Match System / Real World | 4 | D-3 vi voice renders at t=0 ("Hồ sơ", "Việc của tôi", "Cần xác minh"); legal-domain wording consistent |
| 3 | User Control & Freedom | 3 | Cancel/Retry/back present in observed surfaces; undo semantics not verifiable without populated runtime (VERIFICATION_BLOCKED) |
| 4 | Consistency & Standards | 4 | One button primitive with cva variants everywhere; pill controls; one control height per row; story set shows same primitives across all features |
| 5 | Error Prevention | 3 | Z-F-01/02 fail-closed guards + disabled-submit pattern implemented (fix-wave); date/time constrained fields; guard UX copy verified at source (§5) — populated-dialog confirmation blocked |
| 6 | Recognition over Recall | 3 | Visible nav labels + icons; ⌘K palette with visible trigger + shortcut hint; role/verb labels vi |
| 7 | Flexibility & Efficiency | 2 | ⌘K palette is the main accelerator; bulk/keyboard grid (AC-111/112, P-11) not verifiable at pin without populated data — remains the weakest area |
| 8 | Aesthetic & Minimalist | 4 | Token discipline, colour on status only, honest empty/fail states, no decorative clutter |
| 9 | Error Recovery | 4 | Plain-language errors + Retry near source; fail copy preserves user context ("Phiên của bạn không bị ảnh hưởng") |
| 10 | Help & Documentation | 2 | No visible help/onboarding layer beyond honest empty states + hints; acceptable at P0 but scored honestly |
| **Total** | | **32/40** | **Good band (address weak areas; solid foundation)** |

## Detector result (deterministic, Assessment B)

`impeccable detect --json src` → **1 finding** across the whole frontend tree:
- `border-accent-on-rounded` (warning) — `features/matters/components/matter-tabs.tsx:75` `border-b-2`.
- Disposition: **false positive** for this pattern — it is the active-tab underline indicator (2px `border-primary` when active, `border-transparent` otherwise, on `rounded-t-md` tab buttons with `aria-current="page"`, `matter-tabs.tsx:74-79`). Underline tabs with a 1–4px indicator are the standard app-screen tab affordance; the "accent border on rounded card" slop it matches is a different device. No change.

## Findings (quality lens) — all SELF-REVIEW / owner-confirmation

- **UX-R1-07 (P2, quality)** — Form-field stories render unconstrained at the 1440px iframe (inputs/selects span full canvas width; `formfield--with-error`, `select--invalid`). In-app forms are constrained, so this is fixture-level, but it hides real measure/rhythm problems from the review surface. Proposal: give form stories a realistic max-width container (~420px). Surface: `molecules/form-field.stories.tsx`, `atoms/select.stories.tsx`. Evidence: `lens2-impeccable/molecules-formfield--with-error.png`, `atoms-select--invalid.png`. Effort S. LANE-A. Own-work: yes.
- **UX-R1-08 (P3, quality)** — Inline-edit affordance distance: pencil icon sits at the far container edge (~1400px from the text at fixture width) — in real constrained containers the gap is small, but the affordance would read better with a hover-proximate reveal. Fixture-level + component-level polish. Surface: `organisms/inline-edit.stories.tsx` + component. Evidence: `lens2-impeccable/organisms-inline-edit--default.png`. Effort S. LANE-A. Own-work: yes.
- **UX-R1-09 (P3, quality)** — Error message hierarchy inside FormField: helper text ("We never share your email.") and the error ("Enter a valid email address.") both render below the field with only colour separating them; when both are visible the error should take visual precedence (weight or icon) — currently same size/weight, red vs grey. Minor legibility nit, honest otherwise. Surface: `molecules/form-field.tsx`. Evidence: `lens2-impeccable/molecules-formfield--with-error.png`. Effort S. LANE-A. Own-work: yes.
- **UX-R1-10 (INFO, positive)** — State coverage is a genuine strength: search-picker ships 8 distinct states (slow/failed/unavailable/no-match/permission-lost/truncated/same-names/default) each with block-local honest copy + status text; buttons carry loading (`aria-busy` + spinner) and legible disabled; motion uses the 160ms token (`duration-160`, P-14 applied). No finding.
- **UX-R1-11 (INFO, deferred)** — Micro-interaction verification beyond static states (focus rings, hover, palette open/close, dialog transitions) requires interaction — executed in Pass 5 (design QA), not inferred here.

## Run notes
- Target slug/persistence/trend: skipped (dispatch output contract `lenses/impeccable.md` replaces `.impeccable/critique` snapshot; Questions skipped: dispatch mode — non-interactive review, §7 output contract).
- PRODUCT.md loaded by `impeccable context`; no DESIGN.md surfaced by the tool in this repo (design tokens live in `globals.css`; recorded, not repaired — "never repair drift as a side effect").
- Puppeteer render path not used (constraint recorded in §1); no dependency installs.
