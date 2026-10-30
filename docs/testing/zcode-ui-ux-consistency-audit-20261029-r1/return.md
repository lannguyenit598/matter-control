# MC-ZCODE-UI-UX-CONSISTENCY-AUDIT-20261029 — return

- Task: `docs/implementation/tasks/MC-ZCODE-UI-UX-CONSISTENCY-AUDIT-20261029.md`
- Actual owner: actual ZCode, separate review session, read-only auditor of application source and the owner's runtime. No app source, behavior, dependency, runtime-lifecycle or settings change. Only permitted writes: this namespace + the task record.
- Checkout: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` (verified at session start 2026-10-29 ~22:33+0700). Reviewed bytes are the **dirty working tree** (the frontend is broadly modified by the in-flight UI-fidelity / review-matrix work); pinned hashes in `evidence-manifest.json`. Recheck at return: `button.tsx` `71c20401…` and `globals.css` `89ddff3b…` unchanged during the audit window (22:35–23:20+0700).
- Independence disclosure: ZCode holds the P0 BE+FE execution assignment and previously authored FE baseline work; the specific surfaces reviewed here (workbench, UI-fidelity/density corrections, review matrix) were authored by Claude / Codex in their own sessions. No author self-review is claimed for those surfaces.

## Direct answers

**1. Are equivalent buttons visually the same?**
At source level, yes for everything that goes through the shared `Button`/`buttonVariants`: one cva contract (5 variants × 3 sizes), and every product route I could reach renders `md=36px`, `sm=32px`, `icon=32×32` at desktop 1440 with identical padding (6/12 md, 4/12 sm), radius 6, font 14/20 weight 500, svg 16. Confirmed pairs that differ, and why:

| Pair | Observed | Verdict |
|---|---|---|
| Work-grid "Search" submit (`work-filters.tsx:162`, Button primary md) vs Reviews "Search" submit (`review-filters.tsx:63-68`, hand-rolled raw `<button>` outline) | 36px dark primary vs 32px white outline, weight 500 vs 400 | **INCONSISTENT (F-01)** — same semantic role, same page family, two implementations |
| `Input` 40px vs `Select`/Button-md 36px in the same form row (work-filters search row; New-workspace dialog input vs submit) | rendered 40 vs 36, bottoms aligned | **INCONSISTENT (F-02)** — adjacent same-tier controls differ by 4px |
| Work filter chips (36px, text-xs, bg-muted) vs Review state chips (22px, text-sm, border) | rendered | **INCONSISTENT (F-03)** — two chip languages |
| `global-error.tsx` "Try again" (raw `px-4 py-2`) vs `not-found.tsx` / `(app)/error.tsx` (buttonVariants outline md) | source + class math | **INCONSISTENT (F-04)** — bypass of the shared contract |
| My Work "Open task" CTA 160×44/14px vs approved prototype 200×56/16px | rendered 160×44 | **INTENTIONAL_VARIANT** — the addendum's exact numbers were superseded the same day by the PO typography/density amendment (compact 14px body). Provenance in findings; keep. |
| Sidebar "Sign in" (outline sm 32px) vs page ReadFailure "Sign in" (primary md 36px) | rendered | INTENTIONAL_VARIANT — persistent shell action vs page-resolution CTA |
| Dialog triggers primary (one create action per surface) vs outline (secondary mutators) | rendered | INTENTIONAL_VARIANT — consistent rule, keep |

**2. Do heights, padding, font/icon sizes and hit areas match within the same tier/context?**
Measured (see `button-metrics.csv`): md buttons 36px everywhere measured (login anchor, New workspace, New document, New filing, Add work, structure triggers, search submit); sm 32px (density toggle, Sign out, pagination-style links); icon ghost 32×32 (theme toggle, dialog close). Desktop hit areas are small only for deliberate text-tier controls (Step prev/next 26px in the sequence bar, per-row "Open details" 12px link, inline summaries). At 390px every `control-target` control measured exactly 44px min-height/min-width (queue tabs, CTA, Step, View matter, disclosures) — the responsive contract holds. **Gaps:** raw icon-only controls outside `Button` (search-input clear: ~24px wide, no `control-target` min-width on touch) and the underline-disclosure summaries in proof/planning/dependency/control surfaces (no 44px enlargement; `summary` is not covered by the coarse-pointer base rule) — F-06/F-09, SOURCE_ONLY rendered.

**3. Are desktop/mobile, light/dark, EN/VI and loading/disabled/focus states consistent?**
- Desktop/mobile: consistent; mobile adds the app header with account + preferences and 44px touch minimums as designed. No horizontal overflow at 390 (`scrollWidth=390`).
- Light/dark: token mapping consistent (light primary `#202124`, dark primary near-white oklch(0.94) with dark foreground — measured). Single dark-mode caveat: prototype reference is light-only, so dark fidelity to the reference is unverifiable by design.
- EN/VI: strings are overwhelmingly wrapped in `LocalizedText`; two partial gaps found (`document-forms.tsx:267,271,277` upload submit/alerts hardcoded English; `(app)/error.tsx:23` alert body English while its title is localized) — F-08. Attempting a live VI switch on the retained dev runtime did not re-render server-rendered labels (old runtime behavior), so rendered VI switching is NOT_VERIFIED here.
- Loading/disabled: one loading pattern (`Button loading` → spinner + `aria-busy` + disabled) used consistently; disabled token style (`bg-muted`, `text-disabled`) measured on the Data page buttons. Loading-in-flight and focus-visible ring are defined in source and used uniformly but were not exercised live (would require submitting mutations) — FIXTURE/SOURCE_ONLY, see coverage.

**4. Which differences should stay (do-not-normalize list)?**
workbench `work-primary` CTA (PO-approved compact density); primary-vs-outline dialog trigger hierarchy; two "Sign in" tiers; Step/queue/Up-next families; TaskChoice card buttons; badge vs chip (different semantics); breadcrumb/inline text links; the approved workbench composition deltas with documented provenance (workspace line, date, account row — see addendum + task record).

**5. What should the implementation owner fix first?**
Root-first: (1) F-01 — replace the hand-rolled Reviews search submit with the shared Button (or an agreed outline variant), which also fixes its 32px/weight drift; (2) F-02 — pick one adjacent-control height tier (Input 40 vs Select/Button 36) in `fieldControlClass`/`Button md`; (3) F-06 — add `summary` to the coarse-pointer min-height rule and adopt one disclosure style family; then the P3 items (chips, global-error, disabled-link semantics, icon-button sizes, dead `a[data-control]`, unused Pagination molecule, partial localization). Details in `normalization-plan.md`.

**6. What remains SOURCE_ONLY / NOT_RUN / BLOCKED?**
- BLOCKED: rendered measurement of the **approved prototype at :4176** — the retained Vite dev server stopped during this audit (~23:05+0700); restarting a retained runtime is out of my authorization. Reference values were taken from the committed `styles.css`, `design-qa.md` and `concept-3.png` (read directly) instead.
- BLOCKED (partial): rendered deep states of filing detail, control room, agenda, planning, proof/evidence dialogs — route renders on the retained dev runtime intermittently stalled (observed 3×; resolved by reload on other routes; consistent with the recorded timing flakiness). Source coverage for all of them is complete.
- NOT_RUN: keyboard focus walk, screen-reader pass, coarse-pointer emulation (width-rule only was measured; pointer type was not forced), Storybook fixture states (no storybook server; none started), 320px, loading/focus-visible live capture, live VI switch.
- RUNTIME_REVISION_UNCONFIRMED: the :3000 server is this workspace's `apps/frontend` under `next dev` (Turbopack v16.4.2, PID 87665, started 15:03+0700 — **before** the last source edits at 16:50). `/` currently 307s to `/dashboard`, which does not exist in the reviewed source (source redirects `/` → `/workspaces`); a stale module graph or an earlier revision is serving. All rendered numbers are therefore labeled RUNTIME_REVISION_UNCONFIRMED; where rendered geometry matched reviewed-source class math exactly (it did for every measured shared control), that is corroboration, not proof.

## Findings index
See `findings.md`: F-01…F-12 (2×P2, 10×P3; no new P1 UI/accessibility defect found in scope). Known functional P1s (RMV-F04 access-loss retention, RMV-F02 UNKNOWN retry payload) are owned by the separate review-matrix rework and are cross-referenced, not re-counted.

## Skipped and remaining risk
Skipped: any mutation (no form was submitted; the New-workspace dialog was opened and closed without typing), prototype restart, builds/tests (no full build/check run — not required for this read-only audit), screen-reader/coarse-pointer emulation, Storybook. Remaining risk: conclusions about rendered current-source behavior rest on a dev runtime that predates the newest edits; the rework writer may change `review-filters.tsx` (F-01/F-03 location) while this audit is read — the finding should be re-checked against the rework's final bytes before implementation.
