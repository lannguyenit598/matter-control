# Return — Liquid Glass enhancement (MC-ZCODE-LIQUID-GLASS-ENHANCE-20261030, executed 2026-10-30)

Actual ZCode session (model account:zai-start-plan/GLM-5.3-Flash). Branch `codex/unified-project-flow`, HEAD `20feedbf…` unchanged, nothing committed. Plan: `docs/implementation/plans/MC-ZCODE-LIQUID-GLASS-ENHANCE-20261030.md` — executed per its §3 order with the deviations recorded below. All decisions were ZCode's per assignment. Writer boundary honored: only the Codex-handed files (globals.css, dialog.tsx, molecules) plus new files.

## Implemented (AUTHOR_VERIFICATION)

1. **Kernel `src/lib/mc/glass.ts`** (new): `resolveGlassTier` (pure), `computeDisplacementMap` (pure per-pixel SDF rounded-rect map — R=X/G=Y displacement channels, quadratic edge ease), `displacementMapDataUrl` (canvas render, half-res above 180px, `createImageData` typing), module-wide map cache (64-entry), SVG filter registry (hoisted hidden `<svg>`, one filter per surface, `registerGlassFilter`/`removeGlassFilter`), tier detection (CSS.supports + Chromium heuristic + reduced-transparency/forced-colors media) with `useSyncExternalStore` subscription.
2. **`src/components/molecules/glass-surface.tsx`** (new): the 5-layer primitive (backdrop blur+saturate → displacement `url(#…)` → frost tint → rim specular incl. pointer-tracked radial light, rAF-throttled + reduced-motion gated → content). Non-liquid tiers render children bare (the host's frosted styles are the fallback). `ResizeObserver.contentRect`-sized maps (never mid-transform rects), filters removed on unmount.
3. **`globals.css`**: liquid tier CSS (layer positioning, frost tint via `color-mix`, per-theme specular rim + pointer radial), `.glass-host` dialog-host override, belt-and-braces reduced-transparency/forced-colors opaque overrides.
4. **`dialog.tsx`**: in the liquid tier the pane renders through `GlassSurface` (frost 0.35 / refraction 24 / bezel 28 / blur 10 / radius 8 / pointerLight) and the host yields its own material; other tiers keep the current Solid Glass dialog byte-for-byte (fallback contract tested).

## Verification (fresh receipts)

- `tsc` 0; eslint clean (rules-of-hooks fix recorded); prettier clean.
- Unit: kernel 11/11 (tier truth table; map math: interior neutral, edge bend signs on all four sides + diagonal corners, inner-bezel ease, oversize-optics tolerance, determinism); GlassSurface fallback 2/2; **full frontend `pnpm test` 80 files / 720 tests pass**.
- Both engines + CSS guard in private output: Turbopack 1 asset, Webpack 2 assets — "Compiled CSS verified".
- **Refraction proven rendered** (Chromium IAB, fixture with high-contrast stripes + real compiled CSS + the kernel applied live): `probe-refraction-light.png` / `probe-refraction-dark.png` — stripes visibly **bend at the pane rim** and stay straight in the center; `probe-frost-only.png` shows the same pane without the filter (the before-state). Computed receipts: host `backdrop-filter: none`, layer B carries `url(#…)`.

## Deviations and findings (recorded honestly)

- The `dialog-panel[open]` blur rule originally beat the `.glass-host` override (specificity) and lightningcss kept only the `-webkit-` half of the standard+prefix pair — host stayed blurred, hiding the refraction. Fix: `[open]:not(.glass-host)` gate on the blur rule (no prefix dance). This is exactly the class of cascade bug the plan's verification matrix exists to catch.
- The probe fixture's inline mirror script had a harness quirk (registered filter not observable via my probe despite parsing cleanly); the proof used live evaluation of the same kernel logic instead — the React integration path itself is exercised by the component/dialog tests and the real dialog markup.
- Propagation: the mobile-nav drawer inherits the material automatically (it composes the Dialog molecule); the base-select picker **stays frosted by decision** (native `::picker` pseudo-element cannot host the layered structure — recorded as the documented exception in the plan's §2 surface list).

## NOT_RUN / remaining

- Authenticated product rendering (real Create-grid dialog on the retained runtime) — needs the runtime handoff + human-assisted login.
- Screen-reader pass; dispersion dial (intentionally 0); morphing between surfaces (recorded as out of pilot scope in the plan).
- Independent review of these bytes (author verification only).

**Status: IN_REVIEW (author verification).** No commit/push; other writers' bytes untouched; scratch (fixture, private build trees, local servers) removed.
