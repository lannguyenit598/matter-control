# Comprehensive re-review — Liquid Glass implementation (2026-10-30, second pass)

Actual ZCode session re-reviewing its own implementation (`src/lib/mc/glass.ts`, `src/components/molecules/glass-surface.tsx`, `dialog.tsx` integration, `globals.css` liquid section, both test files) with fresh eyes, plus **live interactive checks on a rendered glass pane in the real browser**. Review record only — the review found no new P1/P2 defects; findings below with dispositions.

## Fresh-eyes re-read findings

| # | Severity | Finding | Disposition |
|---|---|---|---|
| R-01 | P3 | Overlay-click close has a micro-delta in the liquid tier: clicks landing in the rounded-corner notch of the pane now target the GlassSurface root instead of the `<dialog>`, so `pressedOnBackdrop` doesn't fire for those few pixels. Escape and true outside clicks (native ::backdrop retargeting) are unaffected. | Accepted — negligible; not worth a pointer-events special case. |
| R-02 | P3 | `subscribeGlassTier` registers matchMedia change listeners once at module lifetime and never removes them (only the subscriber set shrinks). | Accepted — app-lifetime singleton; bounded (2 listeners). |
| R-03 | P3 | With `keepMounted` while closed, a stale filter element can persist in the registry while the dialog is `display:none` (RO fires with size 0 → apply skips → old filter not yet replaced). | Self-healing: on reopen RO fires, new filter registers, previous removed. Verified in the interactive probe (resize path re-registers without accumulation). |
| R-04 | P3 | `pointerLight` responds to touch-drag pointermove (only reduced-motion is gated). | Accepted for the dialog surface; no legal-content risk; can be gated by pointer type later if it ever matters. |
| R-05 | P3 | `getDisplacementMap` cache clears wholesale at 64 entries (no LRU). | Matches liqui's documented approach; map generation is cheap (~35k px at half-res); revisit only if a profile shows churn. |
| R-06 | Info | `computeDisplacementMap` ignores `optics.refraction` (geometry-only); refraction feeds only the feDisplacementMap scale. | Intentional separation — map is scale-independent; confirmed correct. |
| R-07 | Info | Hook order in `GlassSurface` verified unconditional (tier, surfaceRef, light, filterId, effect) before the tier branch; eslint rules-of-hooks green. | Closed. |

No new P1/P2. The A-review's earlier cascade lessons ([open] specificity, lightningcss `-webkit-` pair-dropping) remain handled by `[open]:not(.glass-host)` + standard-only properties — re-verified in the compiled CSS during the interactive probe round.

## Interactive verification on the rendered pane (Chromium IAB, live glass layers)

`review-interactive-probe.png` + scripted checks (probe fixture at `127.0.0.1:4183`, striped backdrop, real compiled layer semantics + kernel runtime):

| Check | Result |
|---|---|
| Text editable **through** the glass pane | ✅ typed `typed-through-glass` into the input behind the layers |
| Click lands through the layers | ✅ click delta = 1 on the pane's button |
| Pointer-tracked rim light | ✅ `--spec-x/--spec-y` set on pointermove |
| Filter registry hygiene on resize | ✅ surface resized 560→620px: exactly **1 filter** after re-registration (old removed, layer B rewired to the new id) |
| Refraction visible | ✅ stripes bend/warp at the rim (chevron pattern), straight in the interior |

Screen-reader pass and authenticated product journeys remain NOT_RUN (unchanged from the first return).

## Re-run gates (unchanged bytes — spot re-verification)

`pnpm vitest run src/lib/mc src/components` → 14 files / 129 tests pass (kernel + surface + dialog suites). Full-suite receipts from the implementation run stand (80 files / 720 tests; both engines + CSS guard).

## Conclusion

The comprehensive re-review finds the implementation sound: no new actionable defects, the liquid tier behaves as specified (refraction rendered, interactivity preserved through the glass, fallbacks intact, registry bounded), and the four earlier verification receipts hold. Status remains **IN_REVIEW (author verification)** — the interactive-probe screenshot joins the evidence set; independent review and product-journey checks remain the next gates.
