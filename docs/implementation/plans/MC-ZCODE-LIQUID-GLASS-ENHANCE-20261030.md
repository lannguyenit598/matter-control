# MC-ZCODE-LIQUID-GLASS-ENHANCE-20261030

Status: **IMPLEMENTED — IN_REVIEW (author verification)**. Revision 1 executed 2026-10-30; return + evidence: `docs/testing/zcode-liquid-glass-20261030-r1/`. Deviation from §2: the base-select picker stays frosted (native `::picker` cannot host the layered structure) — recorded exception. Note: lightningcss drops the standard `backdrop-filter` when a `-webkit-` twin is present in the same rule — write standard-only and gate exclusions with `:not(.glass-host)`. Owner: actual ZCode. Target: upgrade the current Solid Glass material (edge-carried, near-opaque — reads as "solid glass") to **real liquid glass** on floating surfaces: refraction/lensing that bends the content behind the pane, per Apple's Liquid Glass and the web implementations researched below.

## 0. Research summary (sources, fetched 2026-10-30)

| Source | What it establishes |
|---|---|
| Apple, Technology Overview / Liquid Glass (developer.apple.com) | The material is a simulated physical lens: it **refracts** (bends) content behind it, carries **specular highlights**, **adapts** tint/shadow to the content underneath, and shapes **morph/merge** (GlassEffectContainer groups so surfaces share lighting and blend). Rendered per frame, not declared once. |
| liquidglassdesign.com/what-is-liquid-glass | The glassmorphism vs liquid glass distinction: glassmorphism = translucent + blur + hairline + shadow (static); liquid glass adds **real refraction** (straight lines visibly bend) + motion-aware highlights. Implementation ladder: CSS blur (→ capped at glassmorphism) → **SVG `feDisplacementMap`** (real refraction, no WebGL) → WebGL/shaders (highest fidelity) → framework components. Glass belongs on floating act-through layers only; never body copy; check contrast on the busiest background; honor Reduce Transparency; restraint (1–2 glass layers). |
| liqui.design/docs + handbook/glass | The production-grade web recipe. **5-layer anatomy**: (1) backdrop A `blur()+saturate()` plain CSS; (2) backdrop B `backdrop-filter: url(#…)` displacement only — split because Chromium treats a combined `url() blur() saturate()` chain as inert while `feImage` decodes; (3) tint gradient scaled by `frost`; (4) specular rim (canvas-rendered); (5) content. **Dials**: `frost` 0–1 (0 ≈ Apple "clear", 1 ≈ "regular"), `refraction` px (feDisplacementMap scale), `bezel` px (refracting rim width; menus ~28, buttons ~11), `blur` px, `dispersion` (chromatic aberration, ~3× filter cost), `specular` 0–1, `radius`, `material auto|frost|clear`. **Degradation**: Chromium = full refraction; Safari/Firefox drop `backdrop-filter: url(#…)` (WebKit bug 245510) → automatic frosted-blur fallback. **Performance**: displacement maps cached module-wide keyed by size+optics; half-resolution generation above ~180×180; `dispersion>0` triples cost; one large surface beats many small. **Gotchas**: never measure with `getBoundingClientRect` mid-`scale()` (bakes an undersized map) — use `ResizeObserver.contentRect`/`offsetWidth`; never build the map as an SVG data-URI (Chromium rasterizes feImage sources with CSS disabled → smear) — generate on **canvas**; honor `prefers-reduced-transparency`. Design rule: glass is for surfaces you act *through*; value-carrying controls (checkbox/radio/toggle) and brand-color controls stay solid. |
| liquidglassdesign.com/ui, /prompts, /resources | /ui is a gallery index (no code); /prompts is AI-image vocabulary (frost, luminous backlighting, layered depth — informs the visual target, not CSS); /resources confirms the ecosystem: the production path for selectable-text refraction is the SVG-filter approach (not WebGL overlay, which would break text selection/clicks). |

## 1. Gap analysis — current Solid Glass vs liquid glass

| Property | Current (Solid Glass) | Liquid glass target | Gap |
|---|---|---|---|
| Backdrop | Blur only on overlays; faces near-opaque | Refraction bends content behind the pane | **Core gap — no displacement** |
| Edge | Rim + hairline + shadow (static) | Lensing bezel: the edge itself refracts (bezel curvature in the map) | Static vs geometric |
| Specular | Static inset rim light | Rim light that tracks the light/pointer; brighter, lens-like | Static vs dynamic |
| Adaptivity | Fixed light/dark tokens | Tint adapts to content beneath (frost dial) | Partial |
| Morph | None | Shapes morph/merge (Apple GlassEffectContainer) | Out of pilot scope (native dialog/surfaces don't morph); recorded |
| Where | Cards + overlays + fields | Floating act-through surfaces only; dense text stays solid | Correct subset already chosen |

Conclusion: the current implementation is exactly the liqui "frosted fallback tier". The upgrade adds layers 2 (displacement) and 4 (dynamic specular) on the floating surfaces, keeping everything else as the fallback.

## 2. Decisions (all ZCode's, per assignment)

1. **Technique: SVG `feDisplacementMap` via a second backdrop layer** — the only approach that gives real refraction while keeping text selectable and links clickable (WebGL overlay rejected: breaks selection/clicks, heavyweight for a workbench). Chromium gets full refraction; Safari/Firefox get the existing frosted tier automatically (documented engine behavior, not a bug to fix).
2. **Self-written kernel, zero new dependencies** (`@liqui-design/glass` license/compat not verified; the technique is public knowledge). Kernel ~150–200 lines: canvas rounded-rect displacement-map generator (R/G channels = normal offsets, bezel curvature), module-wide map cache keyed `(w,h,radius,bezel,refraction)` (half-res above 180px), hoisted persistent hidden `<svg>` filter registry, `ResizeObserver.contentRect` measurement (never `getBoundingClientRect`).
3. **One React primitive** `GlassSurface` (molecule) wrapping the 5-layer anatomy + a `useGlassOptics` hook; applied to existing surfaces, not replacing components.
4. **Surfaces (pilot → propagation)**: dialog panels (native `<dialog>`, the Create-grid dialog first) → base-select picker + mobile-nav drawer → menus. Cards, tables, forms, value-carrying controls stay Solid Glass (design rule: glass only on act-through floating layers; 1–2 glass layers on screen).
5. **Dials (profile inputs, ZCode-set)**: dialogs `frost 0.35 / refraction 24 / bezel 28 / blur 10 / specular 0.5`; picker/nav `refraction 14 / bezel 20`; `dispersion 0` everywhere (3× cost, no workbench justification); `radius` inherits the surface.
6. **Engine gating**: displacement applies when `CSS.supports('backdrop-filter','url(#f)')` **and** a Chromium engine is detected (UA heuristic — Safari reports support but silently drops; WebKit 245510). Detection failure → frosted tier (current behavior). No UA sniffing beyond the documented engine split.
7. **Dynamic specular**: pointer-tracked rim highlight on dialogs only (`--spec-x/y` CSS vars, rAF-throttled), disabled under `prefers-reduced-motion`; static rim otherwise.
8. **Accessibility**: `prefers-reduced-transparency` → tint goes fully opaque (design tokens, per liqui pattern); `prefers-reduced-motion` → no morph/specular motion; contrast re-checked over the busiest real background; focus/keyboard unchanged; native dialog semantics unchanged.
9. **Fallback tiers preserved**: Tier 3 (Chromium) refraction+frost; Tier 2 (Safari/Firefox) current frosted Solid Glass; Tier 1 (no backdrop-filter / forced-colors / reduced-transparency) opaque tint. CSS guard extended to assert the layered rules exist.
10. **Writer boundaries**: `globals.css`, `dialog.tsx`, atoms were handed to ZCode (2026-10-30 receipt) — in scope. New files are new (no handoff needed). next.config untouched.

## 3. Implementation order

1. `src/lib/mc/glass.ts` — kernel: map generator (canvas, rounded-rect + bezel), cache, filter registry, support detection. Unit tests: deterministic map, cache dedupe (same optics = one entry), registry hoisting, detection branches.
2. `src/components/molecules/glass-surface.tsx` — the 5-layer primitive with the dials; ResizeObserver; filter id registration; `data-glass-tier` attribute for tests.
3. `globals.css` — `@supports`/UA-tier classes: layer composition (`--glass-frost` tint gradient, `--glass-specular` rim), reduced-transparency/motion overrides, tier-2/1 fallbacks.
4. `dialog.tsx` — render the panel through `GlassSurface` (pilot: Create-grid dialog).
5. Pilot verification (§5) → propagate to picker + mobile nav (§6) → full gates (§7).
6. `select.tsx` picker + `mobile-nav.tsx` after pilot pass.

## 4. Visual/verification matrix

| Check | Method |
|---|---|
| Refraction visibly bends content | Fixture: striped/gradient backdrop behind an open dialog — straight lines must curve at the bezel (screenshot, Chromium) |
| Text selectable / links clickable through glass | Playwright interaction through the pane |
| Fallback tiers | UA-emulated Safari/Firefox → frosted tier; forced-colors/reduced-transparency → opaque; screenshots per tier |
| Performance | One dialog open: frame cost vs Solid Glass baseline (repeatable local interaction; no invented FPS); cache hit on second same-optics surface |
| Contrast | Status colors over the busiest backdrop at frost 0.35 |
| A11y | reduced-motion/transparency honored; keyboard/focus unchanged; 320px no overflow |
| Gates | tsc, full `pnpm test`, both engines + CSS guard (private output), eslint/prettier |

## 5. Risks

- workerd (future Workers adapter) and Safari can never show refraction — the design must be judged on Chromium while remaining correct everywhere else (recorded emulation gap).
- Stacked large backdrop-filter surfaces are the real frame cost — dialogs are one pane, but the picker inside a dialog must not double-filter (rule: nested surfaces inherit, not stack).
- `feImage`/canvas map correctness is Chromium-version sensitive — the kernel pins map generation to canvas (never data-URI) and tests the rendered result, not just code paths.
