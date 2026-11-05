# Route coverage — MC-ZCODE-UI-UX-CONSISTENCY-AUDIT-20261029

Coverage key: **S** = source reviewed (exact files/lines), **R** = rendered on the retained dev runtime :3000 (RUNTIME_REVISION_UNCONFIRMED, see return.md), **R\*** = rendered limited/shell only, **N** = not rendered (reason given). All routes below are authenticated product REST surfaces unless marked otherwise. `src/features/tasks/**` and `dashboard-template.stories` are template/demo fixtures (appendix); `src/app/api/**` are route handlers (no UI).

## App shell & preferences
| Surface | Source | Rendered | Notes |
|---|---|---|---|
| `(app)` shell: sidebar, nav, skip link, preferences footer | S (layout.tsx, app-sidebar, nav-menu, dashboard-template, globals.css) | R (1440 + 390) | nav links 42px, locale select 36px, theme toggle 32×32 |
| Mobile header + Preferences disclosure + MobileNav drawer | S | R* (header at 390; drawer not opened) | drawer open/close not exercised (avoids state churn) |
| Sign in / Sign out / account row | S (account-menu, sign-out-form) | R (signed-out ReadFailure state; signed-in sidebar) | two intentional size tiers |
| Login page | S (login/page.tsx) | R (1440, light) | primary md anchor `w-full` 36px |
| not-found, (app)/error, global-error | S | R (not-found via legacy `/dashboard` 404); errors N (hard to trigger harmlessly) | F-04 on global-error |
| Theme/locale toggles | S | R (both directions exercised, restored) | client-side only |

## My Work (workbench)
| Surface | Source | Rendered | Notes |
|---|---|---|---|
| Queue rail (4 queues), selection, counts | S (my-actions-view, my-work-selection) | R (1440 + 390) | 44px tabs, blue `--navigation` selected |
| Current item: Step prev/next, badges, reason, needs | S | R | disabled Step = `aria-disabled` span (F-05) |
| Actions: `work-primary` CTA + View matter ghost | S | R | 160×44 vs 36 (F-09 provenance) |
| Disclosures ×2, Up next list | S | R | control-target summaries |
| Empty queue / empty account / notice states | S | R (empty queue state before selection) | EmptyState family consistent |

## Workspaces & matters
| Surface | Source | Rendered | Notes |
|---|---|---|---|
| /workspaces list + New workspace dialog | S | R (row 56px, badge 22px; dialog measured, no submit) | input 40 vs submit 36 (F-02) |
| /workspaces/[id] matter list + Create matter + members | S | N — page render stalled twice on the retained runtime | source complete |
| Matter overview + 10 tabs + Add work + history disclosure | S | R (1440) | tabs 38px rounded-t (see F-11 note) |
| Matter history pagination (matter-history) | S | N (history route not reached) | outline md links, no disabled state (F-05) |

## Work grid & item
| Surface | Source | Rendered | Notes |
|---|---|---|---|
| /m/[id]/work: search, advanced filters, chips, density, table, next page | S | R (1440) | F-01/F-02/F-03 context; density sm 32px; row "Open details" 12px link |
| /m/[id]/work/[itemId] detail + proof/evidence/assessment/dispute/revocation/basis | S (proof-panel, document-forms, evidence-basis, intent-form) | N (route render stalled) | summaries without control-target (F-06); partial localization (F-08) |
| Planning/milestones/parties, dependencies, escalation | S (planning-view, dependency-panel, add-work-dialog) | N | disclosures F-06 |

## Documents / Filings
| Surface | Source | Rendered | Notes |
|---|---|---|---|
| /m/[id]/documents + version upload dialog | S | R (list + New document trigger) | upload dialog N (no file chosen — no mutation) |
| /m/[id]/documents/[documentId] versions | S | N | |
| /m/[id]/filings list + New filing anchor | S | R (primary md anchor 36px) | |
| /m/[id]/filings/new, /filings/[fid] staged forms (intent/signature/outcome/reopen) | S (filing-forms, filing detail page) | N | TaskDialog outline triggers consistent at source |

## Control Room / Reviews / Agenda / Data
| Surface | Source | Rendered | Notes |
|---|---|---|---|
| Control Room context + Agenda | S (control-room page, context-forms) | N (not reached) | "Close…" disclosure F-06 |
| Reviews list + grid + cell detail + answer form + history | S (review-filters, cell-detail, answer-form, grid-structure-forms, create-grid-dialog) | R (list, grid, chips, raw search submit, 4 structure triggers) | rework-writer files: findings may be invalidated by in-flight RMV fixes |
| Data: import/export/bulk/preview/commit/recovery/brief | S (data-transfer-panel, import-section, bulk-section, recovery-gate, brief-section) | R* (hidden panels measured for tokens/disabled style; interactive states N — no file selected, no mutation) | hidden-task alerts source-reviewed |

## Template/demo fixtures (excluded from product coverage)
`src/features/tasks/**` (task-form, task-form-dialog, delete-task-button, demo repository), `dashboard-template.stories.tsx`, and all `*.stories.tsx` fixtures. `features/tasks` has **no route imports** in `src/app/**` (verified by grep); it ships only via Storybook/tests. Never counted as authenticated product coverage.

## API routes (no UI)
`/api/auth/*`, `/api/matters/*/documents/*/versions*`, `/api/matters/*/export` — source-reviewed only where they produce anchor targets (login, export downloads).
