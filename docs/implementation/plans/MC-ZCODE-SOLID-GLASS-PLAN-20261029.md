# MC-ZCODE-SOLID-GLASS-PLAN-20261029

Status: **IN_IMPLEMENTATION** (revision 2). Revision 1 said "READY_FOR_IMPLEMENTATION — SHARED-FILE EDITS BLOCKED PENDING WRITER HANDOFF (see §9)"; the explicit Codex handoff of 2026-10-30 (`docs/testing/codex-system-solid-glass-intake-20261030-r1/writer-handoff.md`) resolved §9 — receipt in `docs/testing/zcode-solid-glass-20261029-r1/handoff-receipt-20261030.md`. **Revision-2 corrections (from the Codex intake, mandatory):** (a) §2 path erratum — there is no `src/features/my-actions`; My Work is `src/features/work/components/my-actions-view.tsx` + `src/app/(app)/my-actions/page.tsx`; (b) dialog `data-slot` hooks attach to the real DOM elements the native `Dialog` renders — no invented backdrop element; (c) §9's blocked-file statement is superseded by the handoff (kept as history). Owner: actual ZCode (combined assignment). Research/provenance and the compatibility matrix live in `docs/testing/zcode-solid-glass-20261029-r1/`.

## 1. Goal, non-goals, verified identity

- **Goal**: adapt the Solid Glass material (upstream `deeplethe/solid-glass` @ `6e8903e4…`, MIT) — surface finish, edge light, restrained depth — into MatterControl's EXISTING design system and implemented UI, as MatterControl-owned tokens and a small explicitly-mapped rules block. Light/dark, opaque fallback, no composition change.
- **Non-goals**: no upstream demo/AI-chat layout; no new dependency, registry, remote font, parallel component system; no backend/API/tenant/auth/draft behavior change; no replacement of Be Vietnam Pro or the compact density; no reopening of the approved focused-workbench composition.
- **Verified base identity**: branch `codex/unified-project-flow` @ `20feedbf…` + the uncommitted tree (audit inputs-manifest, 763 files). Any Phase C edit re-hashes touched files before/after and re-checks drift against this base.
- **Authorship boundary**: Phase A audit sealed; its findings describe the pinned pre-change candidate and are not rewritten by this plan.

## 2. Current UI inventory (implementation targets)

REST product routes under `apps/frontend/src/app/(app)/`: workspaces list/create, workspace detail (matters, members), matter detail tabs (Work, Documents, Proof, Filings, Reviews, Control Room, Context, Data, Verifiers, Members — ten tabs), requirements/actions detail, my-actions (My Work), sign-in. Shared primitives: `atoms/{button,input,select,textarea,badge,skeleton}`, `molecules/{form-field,alert,localized-*,page-header}`, `organisms/{intent-form,form-dialog,read-failure,draft-scope}`, shell `app/(app)/layout.tsx` + sidebar/navigation. Feature families: review (AUTHOR-owned files from the rework), proof/document forms, work panels, matters/workspaces creation forms, control context forms. Storybook exists (already installed) for primitives. Demo/prototype: `design-prototypes/focused-workbench/` (reference only). No inaccessible product paths noted; a Phase C walk re-verifies at implementation time.

## 3. Token mapping (light/dark)

Preserve ALL existing tokens and their meanings. Changes:

| Token role | Light (data-theme light) | Dark | Notes |
|---|---|---|---|
| `--background` | keep value (opaque cool grey) | keep | page stays opaque; panes stand on it |
| NEW `--panel` | translucent pane α≈0.44 over background tone | higher α (≈0.62) | sidebar/shell rails |
| `--card` | translucent smoked-white pane α≈0.60 | α≈0.72 | cards, list sections, detail panes |
| NEW `--popover` | near-opaque α≈0.96 | α≈0.97 | dialogs, menus, dropdowns (thickest pane) |
| `--border`/`--input` | hairline α-based greys (replace flat hex with α equivalents of the same hue) | same | 1px hairline is part of the finish |
| NEW `--glass-rim/-inner/-edge/-shade/-contact` | top edge light, inner second line, hairline, under-shadow | stronger rim, softer shade (dark has no page lights) | composed into `--shadow-sm/md` stacks |
| NEW `--glass-state` (+rim/edge/armed) | smoked pane for selected/armed | equivalent | ADDS to word+color cues, never replaces |
| NEW `--field`, `--field-rim/-edge` | clear-glass fill for inputs | equivalent | `aria-invalid` destructive border unchanged |
| NEW `--radius-control` | 0.7rem (a step below `--radius`) | same | controls round a step below panes |
| NEW `--glass-blur` / `--glass-blur-control` | blur(26px) saturate(180%) / blur(14px) | no saturate boost | ONLY popover/dialog/overlay surfaces |
| `--focus-line`/ring | keep existing `--ring` focus system | keep | visibility never delegated to the rim |
| Legal state tokens (`--execution`, `--verification`, `--dependency-*`, `--timing`, `--attention`, `--selected`, `--destructive*`, `--disabled`) | UNCHANGED values | UNCHANGED | risk cues must stay distinguishable over glass (contrast verified) |
| Font | Be Vietnam Pro stack UNCHANGED | same | no remote font |
| Motion | no new animation; `prefers-reduced-motion` unaffected | same | finish is static |
| Forced colors | `@media (forced-colors: active)` → borders/system colors, no translucent panes | same | documented fallback |
| No-backdrop-filter fallback | `@supports not (backdrop-filter: blur(1px))` → raise pane alphas to opaque | same | usable without the effect |

Upstream's "delete `:root`/`.dark` variables" instruction is rejected; upstream `oklch` values are adapted (not copied wholesale) and any copied fragment carries attribution per research-provenance.md.

## 4. Component mapping / intended appearance

- **Buttons**: primary = solid ink pane with top rim + under-shade + hairline (upstream `--primary-*` mapping); secondary/outline/ghost = clear-glass small pane (`--glass-control` + rim), hover = `--hover` tint, selected/armed = `--glass-state`; loading/disabled semantics unchanged (`Button.loading` spinner, disabled styles from the existing system). All height/padding/icon tiers stay EXACTLY as the current compact system (Codex UI-fidelity era) — this plan changes SURFACE, not geometry.
- **Fields** (Input/Textarea/Select/FormField): clear-glass pane + top rim + hairline; focus line = existing ring; error states unchanged.
- **Dialogs/menus** (`form-dialog`, dropdowns): popover ladder (thickest), backdrop-filter on the pane only, native `<dialog>` top-layer behavior preserved, focus return unchanged.
- **Cards/tables/lists**: `--card` pane + hairline + contact shadow; **dense text/table regions stay near-opaque** (intentional material absence) — ReviewMatrix grid, work queues, history lists keep readable solid surfaces with only the edge finish.
- **Sidebar/shell**: `--panel` thinnest pane; active nav item = `--glass-state` pane; icons/labels unchanged.
- **Badges/status**: colors unchanged; optionally hairline rim — risk cues never washed out.
- **Links styled as buttons**: same-tier visual equivalence (accessibility skill: button-vs-link semantics preserved — no role changes).

## 5. Button specification (surface only; geometry inherited)

Tiers (from the current system): `sm` compact (min-h ≈ 8 = 32px, px-3), default (min-h-9 = 36px, px-3), scoped workbench primary CTA (larger, approved exception — unchanged). For every tier: height/padding/radius(`--radius-control`)/font-size+line-height (current compact values)/icon 16px + gap-2/focus ring unchanged; states: hover tint, pressed (scale/translate unchanged if any), selected (`--glass-state` + word/aria-current), disabled (existing muted), loading (spinner + disabled). Same-tier buttons agree across routes; exceptions table maintained in Phase C measurements.

## 6. Ordered change list (post-handoff)

1. `globals.css`: add glass tokens + pane/hairline/rim composition + `@supports`/`forced-colors` fallbacks + dark-theme values (single file, no selector outside token scope + the few `data-slot` hooks below).
2. Add explicit hooks ONLY where a rule needs one: `data-slot="button"` (Button), `data-slot="input"|"textarea"|"select-trigger"` (fields), `data-slot="badge"`, `data-slot="dialog-panel"|"dialog-backdrop"` (form-dialog) — one-line additions, locally maintained.
3. Map surfaces: shell/sidebar → panel; cards → card pane; dialogs/menus → popover ladder; fields → field glass.
4. Pilot (§7), verify, then propagate to remaining families (work panels, creation forms, review surface, control room, my-actions).
5. Tests/stories: no decorative class-string assertions; update stories for Button/Input/Dialog state matrices; add contrast-focused assertions only where a real boundary exists.
- Rollback: each step is additive in named hunks; reverting removes only this session's additions without touching Codex's density/typography/icon work.
- Blast radius: globals.css + ≤8 primitive files + stories; zero behavior files.

## 7. Pilot

Scope: (a) shared primitives — Button primary/secondary + Input + Select; (b) one dense region — My Work queue list (near-opaque + edge finish); (c) one dialog — Create grid dialog (popover ladder + backdrop-filter). Light + dark at 1440px and 390px.
Pass criteria: material visible and coherent on all three; approved composition recognizable; no horizontal overflow at 320px; keyboard/focus/test suites unchanged-green; status colors distinguishable over panes (contrast ≥ existing); opaque fallback verified via emulated `@supports not`. Fail → fix at token level or stop expansion. Expand only after pass.

## 8. Verification matrix (post-implementation)

| Check | Command/means | Evidence |
|---|---|---|
| Type/lint/format/agents | `pnpm typecheck && pnpm lint && pnpm format:check && pnpm agents:check` (split runs; Mimosa-state caveat recorded as in the audit) | logs with exits |
| Unit/story tests | `pnpm test` (78 files baseline; new expectations additive) | counts |
| Production build + CSS guard | private-output build (both engines) — `.next` in the workspace is Codex-active; reuse the audit's private-tree method | build logs + "Compiled CSS verified" |
| Visual matrix | browser at 1440/1100/800/390/320px, light/dark, EN/VI long text, empty/populated/error, dialog/menu overlays — before/after pairs | screenshots in evidence dir |
| Control measurements | `getBoundingClientRect` + computed styles: same-tier heights/padding/icon alignment, hit areas ≥ current, CTA exception | measurement JSON |
| A11y | keyboard walk, focus visibility over glass, automated axe if available, manual screen-reader NOT_RUN if unavailable | receipts + NOT_RUN notes |
| Performance spot | repeatable overlay open/close timing vs baseline (no invented FPS) | timing receipt |
| Identity | page/build identity recorded per capture (skill requirement) | capture manifest |

## 9. Ownership and the active blocker

Shared-file ownership (`globals.css`, shell/layout, Button/Input/Select/Textarea/Badge/Dialog, My Work routes, font setup) is **actively held by Local Codex** under `MC-P0-CODEX-UI-FIDELITY-20261029` (task updated 2026-10-29 19:57; PO-assigned; scope includes exactly these surfaces). No writer handoff exists for them. Therefore: steps 1–5 and the pilot DO NOT START until that task's owner (or the PO) hands the files to this session. Research, this plan, the compatibility matrix, and skill compliance are complete and current. Feature-local files owned by this session (`features/review/**` from the rework) may receive material treatment only AFTER the shared tokens land (they consume tokens) — so they are sequenced behind the same handoff, deliberately not edited now.

## 10. Reference/skill compliance

See `docs/testing/zcode-solid-glass-20261029-r1/skill-compliance.md` (accessibility, frontend-testing-debugging, verification-before-completion, scoped shadcn) and `research-provenance.md` (upstream + six reference repositories with licenses/adopted practices).
