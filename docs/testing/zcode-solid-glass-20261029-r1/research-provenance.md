# Solid Glass — upstream research and provenance (Phase B)

Actual ZCode session, 2026-10-29. Research by source inspection only; nothing installed, no registry commands run.

## Primary reference — deeplethe/solid-glass

| Field | Value |
|---|---|
| URL | https://github.com/deeplethe/solid-glass |
| Maintainer | DeepLethe (GitHub organization) |
| License | MIT (`LICENSE`, "Copyright (c) 2026 DeepLethe") — SPDX MIT |
| Repo created / pushed | 2026-10-12 / 2026-10-29 (active) |
| Inspected revision | **`6e8903e494a15491ceda38fafea5056c95a74d44`** (main, commit dated 2026-10-16, "Release: readable charts in the light theme") — pinned, not moving `main` |
| Files inspected (SHA-256 at that SHA) | `src/solid-glass.css` c3c9e4e7…55827B · `README.md` cbdeeadde…10 184B · `registry.json` 04ced4f8…6 470B · `LICENSE` eb9d0395…1 066B |
| Local pinned copy | `/private/tmp/solid-glass-upstream-6e8903e/` (raw downloads, provenance for this packet) |
| Description | "A design system for AI applications. Material, physical, tactile, technical." |
| Registry | shadcn registry:file `solid-glass` — "The stylesheet: the whole material in one file" |

## What the upstream material actually is (verified from the pinned source)

1. **One stylesheet targeting shadcn/ui token names** (`--background`, `--card`, `--popover`, `--muted`, `--border`, `--input`, `--ring`, `--primary`, …). Components take the material "by using the colour they already used: nothing in components/ui has to change".
2. **Tailwind 4 constructs**: `@import 'tailwindcss'`, `@theme inline { --color-*: var(--*) }`, `@custom-variant dark (&:is(.dark *))` — upstream dark activation is the `dark` **class** on `<html>`.
3. **Material rules** (from the header comment): finish lives at the EDGE (rim + hairline + shadow, never a face gradient); heavy neutral grey panes, blur softens without recolouring; depth = thickness — panel (44% alpha) < card (60%) < popover (96%); ONE state pane for hovered/selected/held-open.
4. **Glass finish tokens** (new names upstream adds): `--glass-rim/inner/edge/shade/contact/lift/control/state`, `--field*`, `--well-*`, `--knob*`, `--glass-blur: blur(26px) saturate(180%)`, `--glass-blur-control: blur(14px)`, `--radius-control`, `--popover-edge/under`, `--primary-solid/rim/under/inner/edge`, `--hover/--hover-faint`, plus three faint light sources in light theme (`--light-1..3`) and none in dark.
5. **Selector contract**: 133 `data-slot="…"` selectors (button ×12, badge ×10, toggle, textarea ×5, input ×5, select-trigger ×5, native-select, tabs-list, tooltip-content, sidebar, chat "bubble", questionnaire…). It ALSO styles bare element/ARIA selectors for overlays (native dialog/top-layer) — verified by presence of dialog/backdrop rules in the file.
6. **Install expectation**: import after Tailwind + shadcn stylesheet **and delete the `:root`/`.dark` colour variables `shadcn init` wrote** — an instruction that must NOT be applied to MatterControl's existing semantic system (it carries legal state colors: `--execution`, `--verification`, `--dependency-*`, `--timing`, `--attention`, `--selected`, `--disabled`).

## Reference repositories (bounded: one adopted practice each; exact revisions checked via GitHub API 2026-10-29)

| Repository | License | Adopted practice for this task | Explicitly rejected |
|---|---|---|---|
| shadcn-ui/ui (shadcn) | MIT | Semantic token naming + `data-slot` as an explicit, locally-maintained selector hook if/when we add hooks; variant composition via CVA | Running `shadcn init`/registry add; replacing components; adopting `components/ui` paths |
| mui/base-ui (`@base-ui-components/react`, MIT) | MIT | Overlay/`native dialog` + top-layer/backdrop and `open/disabled/selected` state modeling as the interaction contract the CSS must respect | Migrating primitives; installing Base UI |
| adobe/react-spectrum (Apache-2.0) | Apache-2.0 | Button-vs-link semantics and accessible-name discipline for any restyled control | Installing React Aria |
| microsoft/fluentui (MIT) | MIT | Its React v9 accessibility review checklist approach (focus visible, hit targets, state contrast) for the verification matrix | Importing Fluent styling; mixing v8/v9 patterns |
| storybookjs/storybook (MIT) | MIT | Reuse the ALREADY-installed Storybook for a button/field/overlay state matrix — no new showcase app | Creating a second storybook workspace |
| dequelabs/axe-core (MPL-2.0) | MPL-2.0 | Use the already-installed axe-based tooling if present; report automated a11y findings separately from manual checks | Installing new scanners |

Each repo's default-branch HEAD was confirmed alive via the GitHub API on 2026-10-29; no claim is made that their HEADs match the application's installed versions (Next 16.4.2, React 19.3.1, Tailwind 4.3.3, CVA — `apps/frontend/package.json`).

## Context7 note

A Context7 lookup for "solid glass" was recorded at prompt preparation as returning unrelated glass projects; per the prompt this research used the official upstream sources directly (raw.githubusercontent at a pinned SHA). No similarly-named library was substituted.

## Attribution requirement for any copied source

If any upstream CSS text is later copied into MatterControl (Phase C), it must carry: source URL, revision `6e8903e4…`, MIT license notice, the local modification list, and land in the existing token stylesheet structure — never as a wholesale file import.
