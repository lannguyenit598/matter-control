# Pass 4 — guideline conformance (web-design-guidelines + frontend-design)

**SELF-REVIEW / OWNER-CONFIRMATION** — ADDENDUM-2. Not independent verification.

- Method: Vercel web-interface-guidelines catalogue fetched fresh (2026-11-06) and applied to the shell + primitives + feature surfaces (source greps + captures); frontend-design lens used for the authored-vs-category-default judgement. Responsive evidence: fresh 390px round `evidence/screens/pass4-guidelines/mobile-390/` (5 stories + 2 app pages, overflow probe each) + inspector tablet/mobile renders in `evidence/taste-inspect/`.

## Guideline checklist results (deterministic greps, `apps/frontend/src`)

| Rule | Result |
|---|---|
| Icon-only buttons carry `aria-label` | PASS (sampled: `command-palette.tsx`, `bottom-nav.tsx` both ≥1) |
| `outline-none` without focus replacement | PASS — zero occurrences |
| `transition: all` | PASS — zero occurrences |
| `onPaste` blocking | PASS — zero occurrences |
| `user-scalable=no` / `maximum-scale` | PASS — zero occurrences |
| `color-scheme` light+dark | PASS (`globals.css:14,93`) |
| `<meta name="theme-color">` | **MISSING** — see UX-R1-18 |
| `overscroll-behavior: contain` in overlays | PASS (`globals.css:879,1266`) |
| `touch-action: manipulation` | **MISSING** — see UX-R1-19 |
| `…` not `...` in loading copy | PASS — zero `Loading...`/`Searching...`/`Saving...` literals; `Searching…` renders with proper ellipsis |
| `tabular-nums` for figures | PASS — 7 files + globals |
| `Intl.DateTimeFormat`/`Intl.NumberFormat` | PASS — agenda, calendar-popover, localized-instant |
| Skip link for main content | PASS (`dashboard-template.tsx:27-32`, sr-only→focus pattern) |
| Semantic `<button>`/`<Link>` for actions/nav | PASS (sampled: tabs use `Link` + `aria-current="page"`; buttons are `<button>` with `data-slot`) |
| `autoFocus` | Single justified use (`inline-edit.tsx:105`, desktop inline edit; `dialog.tsx` documents why React autoFocus is deliberately avoided pre-`showModal()`) |
| Reduced motion | PASS (globals.css:453,1084) |

## Findings — all SELF-REVIEW / owner-confirmation

- **UX-R1-18 (P3, guidelines)** — No `<meta name="theme-color">`: mobile browser chrome will not match the page background in light/dark. Surface: `apps/frontend/src/app/layout.tsx`. Proposal: emit theme-color per theme (`#fafbfc` / dark ground). Effort S. LANE-A. Own-work: yes.
- **UX-R1-19 (P3, guidelines)** — No `touch-action: manipulation` on interactive elements: double-tap-zoom latency risk on mobile controls. Surface: globals layer for `button/a/control-target`. Effort S. LANE-A. Own-work: yes.
- **UX-R1-20 (INFO, positive — responsive)** — 7/7 probed surfaces at 390×844 render with **zero horizontal overflow** (`mobile-390/_results.json`); sidebar folds to a compact icon top-bar + floating bottom nav (4–5 destinations, icon+label, visible active pill — `organisms-bottomnav--vietnamese-labels.png`, `app-my-actions-390.png`); title stays at ~20–24px; fail card wraps honestly. Bottom-nav touch targets ≈64px tall.
- **UX-R1-21 (INFO, positive — IA)** — Cross-screen IA coherent: the same 5 destinations (Việc của tôi / Lịch của tôi / Cần xác minh / Hồ sơ / Không gian làm việc) appear as sidebar (desktop) and bottom nav (mobile); utilities (Tập trung, Tìm kiếm ⌘K, theme) stay in the top cluster at both widths; `/` routes to the workbench (`/my-actions`).
- **UX-R1-22 (INFO, positive — authored identity, frontend-design lens)** — The product is not category-default: Be Vietnam Pro chosen for Vietnamese diacritics (not Inter/Geist default), scale-mark logo, operational-truth voice ("Không có gì hiển thị ở đây là một kết quả."), D-3 legal vocabulary, five semantic axis colours tied to execution/verification/dependency/timing states. None of the generated-page tells observed (no cream+terracotta, acid-green-on-black, ALL-CAPS eyebrows, middle-dot meta, `→` glued to links, identical card grids). Cross-ref UX-R1-13 (sticky collision) remains the one open structural item.
- **UX-R1-23 (INFO, deferred)** — Production-build responsive verification NOT_RUN (`next build` constraints); all responsive evidence is dev-server renders (inspector `dev-server` WARN). Recorded in report limitations.
