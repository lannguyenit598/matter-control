# Solid Glass research & compatibility — MC-ZCODE-SOLID-GLASS-20261029 (Phase B)

Date: 2026-10-29 (research executed ~23:50–00:10 +0700). Researcher: actual ZCode. Source research only — nothing installed, no registry command, no upstream script executed.

## 1. Upstream provenance (pinned)

- Repository: https://github.com/deeplethe/solid-glass
- Inspected revision: **main @ `6e8903e494a15491ceda38fafea5056c95a74d44`** (commit "Merge pull request #52 from deeplethe/dev — Release: readable charts in the light theme", dated 2026-10-16T04:34:26Z, via api.github.com/repos/deeplethe/solid-glass/commits/main). Avoids untracked `main` drift.
- License: **MIT** (`LICENSE` present at root; `NOTICE.md` present). Attribution obligation: retain the MIT notice when copying source-derived CSS.
- Files inspected: README (rendered), `src/solid-glass.css` (raw @ main), root file list (`registry.json`, `components.json`, `LICENSE`, `NOTICE.md` present). Not inspected: demo app source (`src/` components beyond the stylesheet), docs site content beyond README.

## 2. What upstream actually provides (verified against the pinned revision)

- One stylesheet (`src/solid-glass.css`) + a shadcn registry. Material: **restrained, mostly opaque glass** — "between flat and liquid glass": three thickness tiers mapped to shadcn surfaces, plus a control tier.
- Token names are shadcn's own (`--background/--foreground/--panel/--card/--popover/--primary/--muted/--accent/--destructive/--border/--input/--ring` + glass finishing tokens `--glass-rim/inner/edge/shade/contact/lift/control…`, `--glass-blur: blur(26px) saturate(180%)`, `--glass-blur-control: blur(14px)`, alpha fills `--panel 44%`, `--card 60%`, `--popover 96%`, `--primary-solid 88%`).
- Tier recipes (from the pinned CSS): **card** = blur 26px, inset rim + inner line + 1px edge + contact shadow + large soft shade; **popover** = 96% fill, underside highlight, 1px edge, bigger lift shadow; **panel** = 44% fill + hairline; **control** = blur 14px, control rim (fields, outline/secondary buttons); **primary** stays solid via `color-mix(primary var(--primary-solid), transparent)`, hover thins 10%.
- Component contracts: extensive `[data-slot=…]` selectors for shadcn/Base-UI components (`button`, `input`, `select-trigger`, `tabs-list`, `dropdown-menu-content`, …). **MatterControl has no data-slot attributes** — direct stylesheet integration would match nothing.
- Fallback/a11y actually present upstream: `prefers-reduced-transparency` → opaque overrides (panel/card/popover/sidebar + primary-solid 100%); motion keyframes disabled under `prefers-reduced-motion`. **Absent upstream:** dialog/`::backdrop`/top-layer handling, z-index rules, disabled-state styling, browser-support statement, forced-colors handling.
- Integration demand the README makes that must NOT be copied blindly: delete shadcn's `:root`/`.dark` variables because upstream "defines the same names". MatterControl's `:root`/`[data-theme='dark']` tokens are the product's own semantic system — they stay.

## 3. Compatibility matrix (upstream → MatterControl current)

| Upstream mechanism | MatterControl current | Conflict / missing contract | Proposed adaptation | Affected callers | Verification |
|---|---|---|---|---|---|
| `:root`/`.dark` token replacement, `.dark` class variant | Own token system in `globals.css`; dark via `[data-theme='dark']` + `@custom-variant dark` | Direct replacement would erase the legal-work state palette (execution/verification/dependency/timing/attention/selected/disabled) | Keep all existing tokens; **add** glass finishing tokens (`--glass-*`, `--panel`, `--popover`, alpha values) as new names; no variable deletion | `globals.css` only | token snapshot; visual diff of state badges before/after |
| `[data-slot=…]` component selectors | CVA classes (`buttonVariants`), native `<dialog>`, native `select` (`.ui-select` + `appearance:base-select`), `fieldControlClass` | Selectors match nothing | Port tier **recipes** onto MatterControl's real hooks: `.bg-card` consumers (Card, Dialog surface), `dialog` element, `.app-sidebar` (panel), `.ui-select::picker(select)` + menus (popover), `buttonVariants` outline/secondary (control), primary (solid mix) | Card, Dialog, sidebar, Select picker, confirm dialogs, Button variants | rendered tier check on pilot surfaces |
| `.bg-card` blur utility override (rules outside layers) | Tailwind v4 `@layer` discipline; `bg-card` used widely incl. dense text areas | Unscoped blur would hit tables/text cards and cost paint | Scope blur to explicit surfaces: dialog, popover-ish menus, app sidebar; leave dense work grid/table and text cards opaque (documented exception) | DashboardTemplate, dialog.tsx, select.tsx | paint/perf spot check; 320/390 overflow |
| Native `<dialog>` (MatterControl) vs upstream silence | `dialog::backdrop: var(--overlay)`, top layer, focus trap by browser | Upstream gives no dialog treatment | Give `<dialog>` the **popover/card** tier surface + keep `::backdrop` token; no new z-index logic | `dialog.tsx` | Escape/focus-return test (existing dialog tests) |
| Focus ring replacement (`--tw-ring-shadow` 3px) | `:focus-visible { outline: 2px var(--ring) }` global | Different mechanism; upstream targets shadcn ring utilities | Keep MatterControl's outline ring; only recolor via `--focus-line`-style token if needed. Do not import the ring-shadow approach | `globals.css` base layer | keyboard walk on pilot |
| Motion utilities (`sg-*`, shimmer, float-in) | Motion already globally disabled under `prefers-reduced-motion` | Decorative shimmer/sweep is out of character for legal work UI | **Do not adopt** decorative animation; keep transition-colors only | none | n/a |
| Fonts (Geist) + radius (0.875rem) | Be Vietnam Pro (local, Vietnamese-complete), `--radius: 0.375rem` | Prompt forbids new remote font; PO typography amendment fixed compact scale | Keep Be Vietnam Pro + current radius; upstream values rejected | none | EN/VI snapshot |
| `prefers-reduced-transparency` opaque fallback | Not present | Missing (good idea) | Adopt: opaque overrides for panel/card/popover fills + primary-solid 100% under the media query | `globals.css` | forced-emulation check if available; otherwise source+caniuse citation |
| Forced colors / Windows High Contrast | Not present upstream; product currently default | Unverified | Record as untested; system colors generally bypass CSS effects | n/a | NOT_RUN note |

**Rejected approaches:** (a) verified stylesheet integration as-is — requires shadcn `data-slot` components, would override the product token system, brings demo motion; (b) wholesale component migration — out of scope, breaks Atomic custom primitives and `Button.loading` contract. **Selected:** limited source-derived token/recipe adaptation into `globals.css` + minimal presentation-only caller hooks, with MIT attribution.

## 4. Reference sources consulted (bounded; what each contributed)

| Source | Inspected | License (verified via API) | Concrete adopted practice | Rejected/inapplicable |
|---|---|---|---|---|
| deeplethe/solid-glass @ 6e8903e | README + src/solid-glass.css | MIT | tier recipes, alpha fills, `--glass-*` token naming, reduced-transparency fallback | `:root/.dark` deletion demand; data-slot selectors; demo motion; Geist font |
| shadcn-ui/ui (API metadata; token naming reference) | repo metadata | MIT | semantic token naming conventions when naming new glass tokens | registry install flow (`npx shadcn add`), `components/ui` paths, stock props |
| mui/base-ui (API metadata; state-contract reference) | repo metadata | MIT | confirmation that upstream's interactive contracts assume Base-UI primitives → why recipes must be re-hooked to native controls | migrating any primitive |
| adobe/react-spectrum, microsoft/fluentui | NOT inspected this session | not recorded (not used) | checklist ideas only (button-vs-link semantics, state treatment) — already covered by the accessibility skill + product rules | all styling/API |
| storybookjs/storybook | installed app tooling (not re-fetched) | MIT (upstream project) | use the existing Storybook button/form stories as the state matrix | no new showcase app |
| dequelabs/axe-core | not installed; no new scanner per prompt | — | report automated a11y separately IF a compatible tool exists; otherwise manual checklist | installing @axe-core/cli |
| W3C WCAG 2.2 quick ref (via accessibility skill references) | skill content | — | contrast (1.4.3), focus visible (2.4.7), target size (2.5.8), reduced motion (2.3.3) | scanner-pass ≠ conformance |

Context7: not queried this session for solid-glass (preparation lookup already established it indexes unrelated projects); framework usage questions here are CSS-only, covered by Tailwind 4 in-repo conventions.

## 5. Fallback, theming and performance posture (decisions for the plan)

1. Opaque fallback: `@media (prefers-reduced-transparency: reduce)` → opaque fills; blur rules gated behind `@supports (backdrop-filter: blur(1px))` so unsupported browsers get the current flat surfaces (usable opaque fallback by construction).
2. Dark theme: map the same finishing tokens in `[data-theme='dark'] .app-shell` scope — upstream's smoky values as starting numbers, verified against contrast on real surfaces.
3. Performance: blur only on sidebar + dialogs + menus (few, mostly static surfaces); never on the work grid/table or text-dense cards; no animated backgrounds; repeatable-interaction cost check vs baseline on the pilot (dialog open) — no FPS claims.
4. Legal semantics: status badges, disabled (`--disabled`), UNKNOWN/access-loss alerts keep their exact tokens; glass is neutral-surface-only.
