# MC-P0-UX-FOCUSED-WORKBENCH — visual fidelity correction

Superseded owner: direct PO instruction assigns this UI correction to actual Local Codex. Keep this addendum as the comparison brief; Claude must not execute overlapping UI changes while Codex owns the correction. Current task: `docs/implementation/tasks/MC-P0-CODEX-UI-FIDELITY-20261029.md`.

PO feedback: the implemented UI still does not look like the approved interactive reference at **http://localhost:4176/**. Continue the existing Claude session. This addendum supplements revision 2 of `MC-P0-CLAUDE-FOCUSED-WORKBENCH-IMPLEMENTATION-PROMPT.md`; it does not restart the assignment or transfer backend ownership.

## Required outcome

Reproduce the **actual selected visual composition**, not merely its vocabulary of queue/current item/Up next. Preserve the real Next.js/Go product behavior, accessible interactions, auth, permissions, drafts and UNKNOWN semantics. Keep prototype and product data implementations separate.

The prototype is the visual reference; the production API/approved business rules are behavioral truth. Use the prototype's layout/type/spacing values through existing product tokens/components or a small appropriate variant. Do not wholesale copy its simulation handlers, global CSS resets, fixed fixture counts, people, dates or nonexistent fields. No new Vite/Medusa/animation dependency.

## Source-based discrepancies already found by Codex

These are confirmed differences in source, not a rendered production audit. Recheck current files in case they changed after this note.

| Element | Approved prototype | Current product source observed | Required correction |
|---|---|---|---|
| Desktop sidebar | `.shell` 260px at >1100px; sidebar padding 24px/17px; brand 25px | `DashboardTemplate` 14.25rem (~228px); sidebar brand `text-sm` | Match reference width, brand scale and nav placement for the selected app composition. |
| Outer shell | Content opens directly alongside sidebar; no extra desktop toolbar or bordered rounded page container | `app/(app)/layout.tsx` inserts `AppHeader`; template main has `md:rounded-2xl md:border` | Remove the extra chrome for this composition; relocate essential account/preferences access so functionality stays available. |
| Main spacing | Main padding 30px top, 40px left, 28px right; heading and queue establish the rhythm | Existing template supplies its own header and inner card padding | Match the reference page geometry instead of layering it inside the old dashboard frame. |
| Heading/current title | Page h1 34px; current task title 40px above1100px, 32px at801–1100px | Current task `text-2xl sm:text-3xl` (24/30px) | Match hierarchy and line-height; long real titles wrap without breaking the layout. |
| Queue navigation | 17px labels, 32px desktop gap, blue selected text/underline | Product `text-sm`, gap-x-1, foreground/primary underline | Match visual scale, spacing, selected affordance and icon use. Keep truthful counts and accessible navigation. |
| Current/Up next split | Main column plus256px rail, clear divider; rail left padding29px, top31px | Product uses16rem rail but different surrounding shell, spacing and smaller content | Keep the width where correct; align top positions, divider and row rhythm to the reference. |
| Primary action | Dark #202124, at least200px wide ×56px tall,16px label | Product shared button plus `min-h-11` (44px) and `px-5` | Use a scoped workbench action variant matching the reference; do not enlarge every button in the app. |
| Section hierarchy | Why padding34px/31px; needs section30px/34px; disclosure summary25px vertical | Compact generic gaps and `py-3` disclosure | Restore the reference whitespace and separator rhythm. |
| Workspace/account | Workspace context below brand; account anchored at sidebar bottom | Preferences anchored at bottom, account in header | Compose actual permitted account/context controls in the intended areas; no fixture name, role or fake workspace label. |

Starting files: `design-prototypes/focused-workbench/src/styles.css`, `src/App.jsx`, `apps/frontend/src/components/templates/dashboard-template.tsx`, `organisms/app-sidebar.tsx`, `organisms/app-header.tsx`, `apps/frontend/src/app/(app)/layout.tsx`, `app/(app)/my-actions/page.tsx`, `features/work/components/my-actions-view.tsx`.

The prototype's reference light palette is #fafbfc page, #f5f7f9 sidebar, #18181b text, #687184 secondary, #dfe3e9 separators, #0754e8 selected navigation and #202124 primary action. Inspect actual CSS before adopting; the earlier prose design brief alone is not a substitute for this selected implementation. Retain accessible dark mode as a corresponding token mapping, not an inverted screenshot or hard-coded light-only controls.

## Execute now

1. Open both reference and actual product using the permitted browser tool at the **same viewport, zoom, locale and theme**. Use the real product My Work route, not a different landing page. If only one product item or no assignments exist, compare shell/empty geometry truthfully; never seed or fake product data merely to match reference counts. Deterministic component fixtures can separately exercise populated rendering but must be labelled as fixtures.
2. Compare structure first: outer chrome, sidebar, header offsets, content width, queue, selected item and right rail. Fix these before polishing individual controls. Reuse shared components/variants; keep business composition out of domain-free shared primitives.
3. Compare typography, wrapping, button dimensions, spacing, dividers, selected/hover/focus affordances and Up next density. Preserve evidence/error/security alerts even if the prototype lacks them. Record necessary semantic differences rather than concealing them.
4. Use actual permitted actions and contextual navigation. A reference's simulated action is not permission to add an unsupported Start/Complete command. Where the product can only safely open the task, keep that truthful action and match its appearance; document the difference.
5. Match the reference responsive transitions: desktop >1100px; intermediate sidebar210px and smaller rail at801–1100px; stacked task/Up next at≤800px. Preserve the app's actual accessible mobile navigation/account controls, test at390px and320px. Avoid clipping or horizontal page overflow. Do not force hard-coded widths that break long Vietnamese/legal text.
6. Apply the same visual language to connected Matter/context and creation dialogs without reopening every existing form or redesigning workflows. Do not redo correct action-entry/draft/UNKNOWN infrastructure.

## Proof required before returning

- Same-viewport reference/product screenshots for desktop, narrow layout and relevant empty/populated states. Use synthetic, nonsecret content and approved capture tools only. State exact viewport, theme, locale, route, source revision and capture time. Do not compare a stale runtime build to current source or claim a fixture screenshot is authenticated product rendering.
- If visual overlay/diff tooling is available and permitted, compare the two captures for geometry; different actual text/dates are expected. No arbitrary similarity percentage or screenshot fabrication.
- A short `visual-delta.md`: each table row above → files changed → final observation → remaining intentional difference. Keep SOURCE_VERIFIED separate from BROWSER_OBSERVED.
- Existing `pnpm check`, affected component/Storybook tests and build/CSS guard per the main assignment. Do not call a successful build or the presence of class names visual acceptance.
- Keyboard/focus/scroll at320px; real queue selection/Back context; visible UNKNOWN/recovery state; no loss of protected draft cleanup. Verify the runtime loaded the CSS/build you changed.

If the browser tool is disabled or login awaits the human, complete the source correction and identify that narrow blocker. Do not bypass browser/OS restrictions. Codex's attempted browser inventory reported `Local browser use is disabled in Work settings`; this is a limitation of that inspection, not proof that your session has the same permission state. Check your actual tools.

Return one consolidated correction with final local URL, current runtime/build identity and evidence. Do not stop at a new plan, do not change the approved prototype to make the mismatch disappear, and do not self-award independent acceptance. No backend edits, dependency installs, commits, pushes or deployment under this addendum.

Skipped until real evidence: authenticated rendered fidelity if browser/login remains unavailable, and moderated legal-team acceptance. Risk: a functionally similar screen may still fail the chosen visual design; report that honestly until compared.
