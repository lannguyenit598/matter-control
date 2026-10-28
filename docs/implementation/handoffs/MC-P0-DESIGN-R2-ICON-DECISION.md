# MatterControl — icon family and motion selection

Task **MC-P0-ICON-01**, owner Local Codex, design selection under D-UX01..04; 2026-10-27, Asia/Ho_Chi_Minh. User requested evaluation and selection among Potlab Icons, Lordicon and Lucide Animated. Consumers: actual design owner and actual ZCode backend/product frontend implementer. Reviewer: assigned nonauthor for the implementation. Status: **DESIGN_DIRECTION_SELECTED / IMPLEMENTATION_NOT_STARTED**. This supplements the [R2 correction prompt](MC-P0-DESIGN-R2-CORRECTION-PROMPT.md) and [experience brief](MC-P0-DESIGN-R2-EXPERIENCE-ADDENDUM.md), preserving their gates and existing outputs.

## Selection

Use **Lucide as the single product icon language**: existing `lucide-react` for the application baseline, with a small curated **Lucide Animated** subset for purposeful interaction feedback. Lucide Animated is a separate community project built on Lucide/Motion, not the official Lucide React package. This selects the design direction; importing animated source and introducing Motion still require the scoped frontend dependency checks below.

Local source inspection: `apps/frontend/package.json` declares `lucide-react: ^1.59.0`, Next `16.4.2`, React `19.3.1`; neither `motion` nor `framer-motion` is declared. Existing `src/components/molecules/theme-toggle.tsx` already uses Lucide icons inside a labelled Button. These are source/manifest observations, not executed compatibility results.

## Comparison and evidence

| Candidate | Verified source facts | MatterControl disposition |
|---|---|---|
| **Lucide Animated** | Its [official site](https://lucide-animated.com/) describes React icons built with Motion and Lucide; [source license](https://github.com/pqoqubbw/icons/blob/main/LICENSE) is MIT. The [CircleCheck source](https://github.com/pqoqubbw/icons/blob/main/icons/circle-check.tsx) is a client component importing `motion/react`, uses `currentColor`, 24×24 viewBox and stroke width 2, and exposes start/stop animation methods. | **Selected for curated accents.** Matching the existing Lucide family is the strongest fit for the selected enterprise system. New runtime cost, compatibility and reduced-motion behavior remain to be verified per imported icon. |
| **Potlab Icons** | Its [site](https://www.potlabicons.com/) advertises free animated SVG, copy/paste and no Lottie. Context7 did not return a matching library; the site's GitHub link resolved to a placeholder URL and failed. No explicit license/source package sufficient for adoption was verified in this review. | **Not selected for the current product baseline.** Keep as visual reference. “Free/open source” marketing alone is not the project's license/provenance receipt; this is a verification limit, not a finding that no license exists. |
| **Lordicon** | [React docs](https://lordicon.com/docs/react) use `@lordicon/react` with icon JSON and allow self-hosting. [Published licenses](https://lordicon.com/licenses) distinguish attributed free usage from PRO terms. Its [System family](https://lordicon.com/) targets clarity/readability. | **Not selected for P0.** It introduces another player and asset/license workflow alongside an already present icon family. Potentially useful for separately scoped illustrated content later; no subscription, account or purchase is assigned. |

The suitability ranking is design judgment informed by these facts. No comparative bundle, rendering, performance or usability benchmark was run. Official Lucide [React documentation](https://lucide.dev/guide/react) supports individually imported inline SVG components; [license notices](https://lucide.dev/license) must be retained along with the selected animated source's notices. No legal clearance beyond identifying these published terms is claimed.

## Where motion adds value

| Surface | Baseline | Permitted accent |
|---|---|---|
| Navigation and Grid | Static, consistent outline glyphs; existing selected type/color tokens | A single subtle interaction on deliberate focus/activation of a selected primary control. Keep dense row/status icons static. |
| Search/filter | Static search/filter glyphs; visible labels and filter state | Optional brief response to opening the relevant control; results and focus remain stable. |
| Evidence submission/review | Distinct upload, proof and review concepts, always text-labelled | An upload icon may accompany real progress; a proof confirmation plays once only after the authoritative accepted result. Upload completion never means verified proof. |
| Brief export | Static export/download affordance | One short confirmation after the export is actually available; retain error/uncertain states and draft/provenance labels. |
| Empty/zero-candidate/unavailable | Explicit explanation and permitted next action | Static or one-shot restrained emphasis where useful. No continuous motion on a reading surface. |

Execution completion and evidence verification must have distinct labelled representations; a decorative check animation cannot merge them. Critical/blocker indicators remain readable and steady. Required meaning, success and error recovery are available without animation. A real pending-operation indicator may animate while pending, with appropriate accessible status.

## Icon contract for the design owner

- Use one consistent outline family with `currentColor`; preserve the selected semantic text colors. A 24×24 source grid and stroke width 2 align with the sampled animated source. Propose 16px glyphs for compact rows and 20px for standard controls; actual legibility remains a rendered check. Glyph size is separate from the existing 32px desktop/44px mobile control target requirements.
- Candidate semantic vocabulary: dashboard/panels for Control Room, list for My Actions, table for Grid, document for Requirement, branch for dependencies, shield for proof verification, clock for Waiting On, history for events and download for export. Select exact exports available in the pinned package during implementation; do not make an unverified icon name an API contract.
- Keep persistent text for domain states and reasons. Icon-only buttons need their accessible name on the control; decorative glyphs are hidden from assistive technology. See [Lucide accessibility guidance](https://lucide.dev/guide/react/advanced/accessibility).
- Specify keyboard/touch as well as pointer behavior. The sampled animated component defaults to hover and a `div` wrapper; it does not supply the application's button semantics. Its source does not demonstrate a reduced-motion guard. The consumer must provide correct control semantics, stop/cleanup behavior and a static reduced-motion fallback. Do not assume every animated component forwards standard SVG props identically to `lucide-react`.
- Keep glyph geometry reserved before loading, preserve focus and avoid layout shifts. Do not animate each row of a 200-row Grid or trigger every icon on page entry. Respect reduced motion from the first applicable render; motion is never required to complete a task.

## Smallest implementation path for ZCode

Within a separately activated FE slice, reuse existing Lucide, Button and token patterns. For simple rotate/translate feedback, prefer existing CSS/platform capabilities before adding a runtime. For an accent whose path animation genuinely needs the selected library, import only the few reviewed component sources and pin their upstream revision and licenses; do not copy a whole gallery or invoke a remote registry CLI blindly.

If Motion is needed, document the need and rejected simpler alternative, exact version/peer compatibility and measured bundle impact per `apps/frontend/docs/ai/rules/dependencies.md` R-DEP-1/4/5. Preserve pnpm/lockfile rules and client-leaf boundaries. Use local bundled icon source/assets; no runtime icon CDN, third-party script, new MCP or analytics integration is selected. If an accent cannot justify its added cost, keep its static Lucide equivalent while retaining the chosen visual language.

Implementation acceptance: required frontend checks pass; no hydration or invalid nested-control warnings; accessible names and focus work; reduced-motion mode stays static; no false success on failed/unknown writes; both densities, long labels and mobile remain usable; relevant payload/bundle change is measured. Actual nonauthor review precedes acceptance. These checks are **NOT_RUN** in this selection task.

Return the chosen icon mapping and static/animated states inside R2's existing component handoff. This document does not dispatch the design owner or ZCode, install packages, authorize product code before its gates, or change business/architecture/cost/release decisions. Existing pinned inputs and R1/R2 outputs are preserved.

Checks performed: Context7 resolution for all three candidates (Potlab no match), queries for Lucide Animated/Lordicon/Lucide, official web/source/license reads, local package/component/dependency-rule inspection and document-link/format checks. No website animation was visually inspected in a browser. Skipped: installation, builds, browser/keyboard/runtime and bundle tests, external agent dispatch. Remaining risk: selected animated components need per-component accessibility, dependency and rendering validation before use.
