# Pass 5 — design QA (design-testing-strategy + browser-use:web-gui-tester)

**SELF-REVIEW / OWNER-CONFIRMATION** — ADDENDUM-2. Not independent verification.

- Framing (G3/G4): testable design criteria executed as GUI black-box interaction tests via the in-app browser (IAB) + deterministic token-contrast sweep via Playwright/system-Chrome probe (audit method re-run at pin).
- Test matrix (criticality MEDIUM-HIGH UI surfaces): component-level design criteria here; unit/E2E ownership stays with the test suites + MC-FE-NEXTJS-REVIEW-20261106 (cross-ref, not duplicated).

## T1 — ⌘K palette open/filter/close (P0 main flow, visual + DOM cross-validated)

- **Open**: PASS. Trigger `Search pages` click → `dialog "Quick search"` renders with heading (h2), subtitle "Jump to a page.", visible Close affordance, backdrop dim. **Focus management PASS**: `searchbox "Filter pages" [active]` immediately on open (`data-autofocus` pattern, `dialog.tsx:55`).
- **Filter**: PASS. Typing "wor" narrows 5 links → exactly `My Work` + `Workspaces`, all real `/url` links (Link-based → Cmd-click-able per guideline).
- **Close via Escape**: **FAILED in GUI test (2 attempts: searchbox + dialog container)** while `dialog.tsx:67-70` implements `onCancel → onOpenChange(false)` — see UX-R1-25.
- **Close via mouse**: UNTESTABLE in this runtime — see runtime limitation below.
- Evidence: emitted screenshots in session transcript (runtime did not expose persistent artifact paths; static open-state capture `lens1-design-taste/organisms-commandpalette--default.png` shows closed trigger).

## T2/T3 — Dialog open state + field-in-dialog

- Not individually re-run interactively: the IAB runtime cannot click inside native `showModal()` `<dialog>` elements (see limitation), and static open-state evidence for FormDialog/DateTimeField was obtained via bulk story captures (`lens1-design-taste/organisms-formdialog--*.png`, `molecules-localdatetimefield--*.png`). Dialog internals verified at source: near-opaque GlassSurface frost 0.84 + blur 18 (overlay-tier blur per Solid Glass intent), `data-autofocus` focus routing, vi/EN localized Close label, `keepMounted` draft-survival option.

## T4 — Sticky collision (UX-R1-13 disposition)

- sloplint FAIL 56 (two sticky top:0) **REFUTED by measurement**: toolbar sticky occupies x[248→1440], sidebar sticky x[0→248] — `axesCollide:false` (`commands/` transcript; `pass5-design-qa/app-matters-scrolled-900.png`). Side-by-side stickies sharing top:0 are the intended workbench pattern.
- Residual: scroll behaviour with populated content (page scrolls) NOT_VERIFIED — fail-closed pages do not scroll (docHeight=900); needs walkthrough env.

## Contrast sweep (deterministic, audit method re-run at pin)

- Method: computed-token probe on live `:3100/login`, both themes forced via `data-theme`, alpha composited over the underlying surface, WCAG 2.x ratios; parser handles rgb/oklch/lab computed forms (Chrome canonicalises oklch → lab). Raw: `evidence/contrast-results-r1.json`.
- **Light 22/24 PASS · Dark 22/24 PASS** (dark `border` 1.421 reproduces the audit's 1.422 → method validated).
- Standing FAILs: `border on background` (1.167/1.421) — the same 2 pairs the 2026-10-30 audit accepted → **STILL_OPEN unchanged**; plus **new measurement** `field-face vs background` (1.037/1.188) → UX-R1-24 below.

## Findings (design QA) — all SELF-REVIEW / owner-confirmation

- **UX-R1-24 (P3, design QA + hallmark)** — Field-on-glass distinction is rim-carried: `--field-face` face colour over the page/glass composite measures ≈1.0–1.2:1 (below the 3:1 non-text criterion of V-03/P-10); fields on glass are currently distinguished by `--glass-field-rim` (white 0.9) and border only. The criterion's original scope ("measure on real populated dialog") remains VERIFICATION_BLOCKED; this is the token-level confirmation that P-10 is **still open**. Proposal (LANE-A): strengthen field face vs glass composite (deeper inset tint per theme) OR record rim-only affordance as the accepted design. Effort S–M. Own-work: yes.
- **UX-R1-25 (P2, design QA — OPEN-VERIFY)** — Escape did not close the Quick-search dialog in 2 GUI attempts at pin, while `dialog.tsx:67-70` implements Escape via `onCancel`. Discrepancy unresolved: either story-level wiring differs from app wiring or the IAB runtime failed to deliver the key event to the native dialog (it also cannot click inside it). Requires one independent verification (Playwright-local or human) before disposition; if real in-app, Escape-to-close is a platform-convention violation (Nielsen 3). Own-work: yes (dialog primitive authored in the ZCode design-system work).
- **UX-R1-26 (INFO, positive)** — Palette interaction quality: focus lands in filter on open, filtering is instant and exact, links are real anchors, Close affordance labelled and localized, backdrop dim + overlay-tier blur conforms to Solid Glass intent.

## Runtime limitations recorded (honest, non-product)

1. IAB click: any click targeting elements **inside a native `<dialog>` (showModal) times out** despite verified actionability (visible, enabled, unoccluded, bounding box stable across 300 ms, no CSS animation). Trigger clicks in light DOM work (after one transient first-click timeout). Close-button path therefore untested.
2. IAB navigation stale-frame: after cross-port goto, `url()`/`title()` updated while screenshot/evaluate briefly served the old document; test re-based on a settled page.
3. Console errors on every app page (2/page) = **HMR WebSocket handshake failures** (`_next/hmr`), a dev-server artifact — not product errors; fail-closed pages render otherwise clean.
