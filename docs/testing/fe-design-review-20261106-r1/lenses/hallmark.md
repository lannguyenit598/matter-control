# Lens 3 — hallmark (identity lens)

**SELF-REVIEW / OWNER-CONFIRMATION** — ADDENDUM-2. Not independent verification; non-author confirmation pass required before anything here gates.

- Base bytes: pin `41098a4d…` (isolated worktree). Render tier of `sloplint --render` BLOCKED (puppeteer-core absent — known baseline); lint tier run without render. One fresh capture round: `evidence/screens/lens3-hallmark/` (74 shots incl. 2 forced-dark).
- Identity question per dispatch §3: does the product feel like one system — token adherence, Solid Glass conformance, vi/en coherence?

## Hallmark Floor (code-level checks, deterministic greps on `apps/frontend/src`)

| Floor rule | Result |
|---|---|
| 1. No literal colour past token block | **PASS** — 0 hex literals in any `.tsx` (grep `#[0-9a-fA-F]{6}`); colours only in `globals.css`/`pane-workbench.css` token blocks |
| 2. Never `transition: all`; never animate width/height/top/left | **PASS** — 0 `transition-all`/`transition: all` |
| 6. `:focus-visible` on interactive elements | **PASS (present)** — 3 rule sites in `globals.css`; ring token `--ring` measured 7.383:1 vs background in prior sweep |
| 7. `prefers-reduced-motion` fallbacks | **PASS** — `globals.css:453,1084` |
| 9. No tracked-caps labels | PASS in all observed captures (sentence-case labels) |
| 11. No purple→blue gradient / emoji icons / card-in-card | PASS in product chrome; the teal→purple gradient exists ONLY in the glass-demo fixture backdrop (`molecules-glasssurface--dialog`), not in app surfaces (6/6 app captures show neutral grounds) |

`sloplint` (lint tier, `globals.css` + `src/app/pane-workbench.css`): **3 FAIL, 10 WARN, 36 NOTE**. Dispositions below; full output preserved in `commands/` transcript.

## Findings (identity lens) — all SELF-REVIEW / owner-confirmation

- **UX-R1-12 (P3, identity)** — Spacing off the 4px scale in 36+ places (sloplint NOTEs): `.work-sequence` 10px, `.work-needs` 25px/5px/6px, `.work-up-next` 22px/15px, `.select-popover [role='option']` 8px 10px, bottom-nav 6px, compact record-table 6px 12px (`globals.css:815-897`, `pane-workbench.css:290,373`). Proposal: adopt the P-14 spacing tokens and normalise these to the 4px grid during the next fix-wave. Effort M. LANE-A. Own-work: yes.
- **UX-R1-13 (P3, identity)** — sloplint FAIL 56: two `position: sticky; top: 0` elements coexist (`pane-workbench.css:137` — `.app-sidebar-slot` + `.app-toolbar`). Risk: toolbar overlapping/colliding with sidebar sticky on scroll. Not observable in top-of-page captures; needs a scrolled-browser check (Pass 5) before severity is final. Fix hint from tool: offset the second sticky by the banner height. Effort S. LANE-A. Own-work: yes.
- **UX-R1-14 (INFO, guard-verified)** — `globals.css:305-306` carries the `-webkit-backdrop-filter` + standard pair (`blur(18px) saturate(135%)`) — the known lightningcss drop-the-standard-property pitfall. Mitigation on record: `package.json` build = `next build && node scripts/check-built-css.mjs` (the built-CSS guard from deploy-readiness WP-1). Built output NOT re-verified this round (no `next build` — shared-checkout/build-time constraints); the guard's own green run is the standing evidence. Owner-confirmation only.
- **UX-R1-15 (INFO, dismiss)** — sloplint WARN 41 "dark surface (L 29%)" on pane sidebar/toolbar/bottom-nav: this is the dark-theme `--panel oklch(0.24 …)` material itself — intended per Solid Glass dark design ("darker translucent panes, faint lit rim, no saturate boost", `globals.css:131-140`). Dismissed with reason.
- **UX-R1-16 (INFO, positive — Solid Glass conformance)** — Light faces near-opaque (`--panel …/0.8`, `--popover …/0.97`), blur confined to pane/overlay surfaces in all observed app captures (6/6 neutral grounds, no glass-everywhere); dark captures (liquid-workbench-dark, button glass dark, forced-dark ×7) show neutral rims and **no saturation boost** — exactly the PO-adjudicated intent of 2026-11-01. `--glass-blur: blur(26px) saturate(150%)` light vs `blur(26px)` dark confirms the saturate-on-light-only rule at token level.
- **UX-R1-17 (INFO, positive — vi/en coherence)** — vi renders server-side at t=0 on every probed route (`lang=vi`, vi h1: `Hồ sơ`, `Không gian làm việc`, `Việc của tôi`); D-3 terms live in nav/tabs; language switcher coherent (`select--language` shows "Tiếng Việt" with language glyph); stories are EN-by-convention with vi variants where identity matters (bottom-nav vi). One system, two languages, no mixed-voice leaks observed in rendered surfaces (P-05 EN-literal sweep: no EN literals observed in vi-mode app captures).

## Capture notes
- `atoms-badge--variants` console 404 recurs every round (same single resource); all other 71 stories + app surfaces render clean. Non-fatal; recorded for the quality lens and as a Storybook-hygiene nit.
