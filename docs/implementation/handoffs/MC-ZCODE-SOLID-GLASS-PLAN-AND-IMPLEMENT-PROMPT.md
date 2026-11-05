# MC-ZCODE-SOLID-GLASS-PLAN-AND-IMPLEMENT-20261029

You are actual ZCode in a dedicated session. Research https://github.com/deeplethe/solid-glass and adapt its visual material to MatterControl's **existing design system and implemented UI**. First produce a detailed, reviewable implementation plan, then implement that plan in bounded increments. This is an implementation assignment, separate from the read-only UI consistency audit. Do not start by installing a registry or replacing the application's components.

## 1. Authority, workspace and scope

- Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
- Read root/component AGENTS.md, `/Users/nguyenvanlan/.codex/RTK.md`, current workflow, project status, frontend architecture/component guidelines and current task/workboard before editing. Use RTK for shell commands and Semble before code exploration; Context7 for current library documentation, with official upstream sources when the exact project is not indexed.
- Record actual agent/tool/version, timestamp, branch, HEAD and dirty-file inventory. At prompt preparation HEAD was `20feedbf06c859a9806055d609f5b132fe8bb086` on `codex/unified-project-flow`; verify again rather than assuming it is current. Preserve every existing dirty change and prior authorship. No reset, stash, clean, branch switch, commit, push, merge or deploy.
- The user's instruction authorizes this local frontend visual adaptation. Before touching shared files, establish that no active implementation session owns overlapping files. Do not infer that another writer stopped because this session is new. If overlap is unresolved, finish research and the plan, identify the exact files/owner conflict, and wait before dependent edits. Do not terminate another agent or its runtime.
- Allowed implementation: frontend design tokens/styles, existing shared UI components, necessary presentation-only caller changes, relevant tests/stories, task/evidence documents. Keep backend, PostgreSQL, API/business contracts, auth, permissions, drafts, UNKNOWN/recovery and data access behavior intact. Preserve `leonx.me/matter-control`.
- No real R2/provider calls, production access, secret capture or real legal data. Use synthetic fixtures. Do not install dependencies, run upstream scripts or CLI generators, or replace lockfiles as a shortcut. Research through source inspection is sufficient initially.

## 2. Inputs and precedence

Read and reconcile:

1. Current `apps/frontend/src/app/globals.css`, token/theme definitions and `apps/frontend/src/components/`, especially Button/buttonVariants, fields, cards, dialogs, menus, tabs, badges, tables and shell components; inspect actual consumers and CSS overrides.
2. `apps/frontend/docs/ai/rules/architecture.md`, `apps/frontend/docs/component-guidelines.md`, component AGENTS/rules, installed versions and package scripts. Preserve Atomic Design/import direction and domain-free shared components.
3. `docs/design/legal-team-experience-20261029/concepts/approved-selection.json`, selected concept 3, and `design-prototypes/focused-workbench/` including README, CSS and design QA. Treat it as the approved composition reference.
4. `docs/implementation/handoffs/MC-P0-CLAUDE-WORKBENCH-VISUAL-FIDELITY-ADDENDUM.md` and current UI fidelity task/return. Read supersession notes: historical owner names are not current writer availability.
5. `docs/implementation/handoffs/MC-ZCODE-UI-UX-CONSISTENCY-AUDIT-PROMPT.md` and any actual returned audit. A prepared prompt is not completed audit evidence. Read current review-matrix rework handoffs to avoid undoing fixes.

Received audit amendment: the UI-consistency audit now exists at `docs/testing/zcode-ui-ux-consistency-audit-20261029-r1/`. Consume its findings/metrics with `docs/testing/codex-ui-consistency-intake-20261029-r1/return.md` and the received-audit qualifications in `MC-ZCODE-SYSTEM-REVIEW-THEN-SOLID-GLASS-IMPLEMENT-PROMPT.md`. Reuse valid evidence, preserve compact CTA authority, reverify runtime identity and computed geometry, and do not mechanically adopt all proposed global normalizations. When dispatched through the combined prompt, follow its audit-first phase order and writer handoff.

The existing product semantics and accessibility are binding. Preserve approved information architecture, layout, typography hierarchy, spacing/density, control size tiers and action hierarchy. The requested Solid Glass adoption authorizes a coordinated material treatment: surface finish, edge, shadow, restrained depth and compatible theme tokens. It does not authorize replacing the legal workbench with an AI chat/dashboard demo. Record intentional material differences from the earlier flat reference. Raise only genuine conflicts that require changing approved layout, brand direction, business semantics or introducing dependencies; finish unaffected research/planning first.

## 3. Phase A — research and compatibility assessment; no application edits

Inspect the exact upstream repository, README, `src/solid-glass.css`, component examples, material/installation documentation, `registry.json`, LICENSE and NOTICE. Record URL, exact inspected commit SHA/date and relevant paths. Pin the inspected revision in research and attribution; avoid untracked imports from moving `main`. Do not invent a package, React API, supported browser list or compatibility claim.

Preparation observations to verify against that revision:

- Upstream describes a restrained, mostly opaque glass material, rather than transparent liquid/refraction effects. Its material distinguishes panel, card and popover depth.
- The README presents a stylesheet targeting shadcn/ui's tokens, `data-slot` and existing classes, with React 19/Tailwind 4/Base UI as its documented starting point.
- MatterControl currently has custom Atomic primitives. Its Button uses CVA variants and does not declare the shadcn `data-slot="button"` contract. Shared language/framework versions alone therefore do not establish drop-in compatibility.
- Upstream defines global color/font/radius tokens and broad selectors. Its recommended removal of generated theme variables must not be applied blindly to MatterControl's existing semantic system.
- Context7 lookup at preparation returned unrelated glass projects, not an exact Solid Glass match. Recheck availability, then use the actual upstream sources if still absent; never substitute a similarly named library as documentation.

Produce a compatibility matrix: upstream mechanism/selector/token → current implementation → conflict or missing contract → proposed adaptation → affected callers → verification. Include cascade/layers/import order, specificity, dark-mode activation, native dialog/top-layer/backdrop, portals, focus rings, reduced motion/transparency where supported, forced colors, translucent contrast, browser fallback and rendering cost. Inspect source before making claims about which capabilities upstream provides.

Compare feasible approaches: limited source-derived CSS/token adaptation; verified stylesheet integration with explicitly mapped contracts; wholesale component migration. Select the smallest approach that satisfies the requested material while preserving the house components. Explain rejected approaches briefly. No new glass wrapper library or parallel component system. Copy only necessary source, retain applicable copyright/license notices and record local modifications and provenance.

## 3A. Additional authoritative references — bounded research, not additional dependencies

Use this shortlist to answer specific implementation questions. Solid Glass remains the material reference; the existing MatterControl design system remains the integration target. Do not combine multiple component libraries or import their visual identities. Repository popularity alone is not evidence of suitability or accessibility.

| Official repository | Research purpose | Required result for this task |
| --- | --- | --- |
| https://github.com/shadcn-ui/ui | Closest upstream ecosystem to Solid Glass; semantic theme tokens, component variants/composition and selector contracts | Map only relevant token/variant patterns to the existing Atomic primitives; identify API differences before adopting examples. |
| https://github.com/mui/base-ui | Unstyled primitives and interaction/state contracts; upstream documented foundation for Solid Glass examples | Check how focus, keyboard, open/disabled/selected states and overlays are modeled; preserve equivalent native/current behavior without migrating primitives. |
| https://github.com/adobe/react-spectrum | Adobe's accessible adaptive components and React Aria interaction patterns | Cross-check button versus link semantics, accessible names, focus handling and keyboard interaction for changed controls. Do not install React Aria or replace forms. |
| https://github.com/microsoft/fluentui | Enterprise component design and accessibility review practices | Reference semantic state treatment, control consistency and its React v9 accessibility review checklist; do not import Fluent styling or mix v8/v9 APIs. |
| https://github.com/storybookjs/storybook | Isolated component documentation and testing | Reuse the already installed Storybook setup for a representative matrix of existing button variants/sizes/states, fields and overlays; avoid creating another showcase application. |
| https://github.com/dequelabs/axe-core | Automated accessibility testing engine and rule explanations | Use existing compatible accessibility tooling if available; report automated findings separately from keyboard, screen-reader and visual checks. No new scanner installation by default. |

These official repositories were reachable during prompt preparation on 2026-10-29; no claim is made that their latest branches match the installed application versions. For each source actually used, record the exact inspected revision, relevant file/document URL, maintainer identity, license, compatibility, one concrete adopted practice and rejected/inapplicable practices. Check current maintenance/release evidence rather than quoting stale star counts. Research only relevant sections: do not clone/build every repository or turn this into a library migration comparison project. Pin and attribute any copied source.

For library-specific instructions use Context7 resolve → query on the exact library and relevant version. If the exact project is absent, use its official documentation/source and record the limitation. For normative accessibility criteria, use current W3C WCAG/APG sources; repository and skill examples are supporting guidance, not proof of conformance. Do not equate a scanner pass with complete accessibility acceptance.

## 3B. Skills and compliance contract

Read the available applicable skills before the phase they govern. Announce their use and record `skill-compliance.md` in the evidence directory: skill/path → applicable requirements → concrete implementation/verification evidence → exceptions or NOT_RUN reason. These are local files on this workstation, not guaranteed capabilities of another runtime. If a file is unavailable in the ZCode session, report that explicitly and follow the equivalent concrete requirements in this prompt; do not silently install skills, change global configuration or claim the skill ran.

Required guidance for this assignment:

1. **Accessibility** — `/Users/nguyenvanlan/.agents/skills/accessibility/SKILL.md`. Apply native semantics, accessible names, keyboard/focus management, errors, contrast, zoom and interaction targets. Check authoritative criteria when a numerical threshold or exception matters. Keep MatterControl's existing stronger responsive targets; do not shrink them to a generic minimum. Report manual screen-reader checks as NOT_RUN if unavailable.
2. **Frontend testing/debugging** — `/Users/nguyenvanlan/.codex/plugins/cache/openai-curated-remote/build-web-apps/0.1.2/skills/frontend-testing-debugging/SKILL.md`. Define the target flow, use a permitted browser path, verify page/build identity, meaningful content, no framework overlay, console health, rendered screenshots and interaction results. Keep a reference/product mismatch ledger. Adapt APIs to tools actually available; do not invent the Browser plugin or bypass disabled browser permissions with another capture path. Store required durable evidence in the task directory already authorized here; no additional report application.
3. **Verification before completion** — `/Users/nguyenvanlan/.codex/plugins/cache/openai-curated-remote/superpowers/7.0.1/skills/verification-before-completion/SKILL.md`. Make each success claim depend on fresh receipts for the final changed source: exact command, exit, output and environment. A source edit, class name, previous passing run or another agent's statement is not evidence that the current UI works. This skill does not authorize commits or dispatch.

Conditional reference:

4. **shadcn** — `/Users/nguyenvanlan/.codex/plugins/cache/openai-curated-remote/build-web-apps/0.1.2/skills/shadcn-best-practices/SKILL.md`. Use its applicable principles for semantic tokens, existing variants, composition and documented primitive contracts when inspecting shadcn/Solid Glass patterns. MatterControl's primitives are custom: do not enforce stock shadcn prop names, `FieldGroup`, Sonner, `data-icon`, `asChild`/`render` or `components/ui` paths without verifying they exist and are appropriate. In particular, preserve the current `Button.loading` API and its spinner/disabled semantics. Do not execute embedded dynamic commands, `npx ...@latest`, registry initialization, add/overwrite, preset switches or dependency downloads; this task's no-install and dirty-work constraints take precedence. Obtain documentation through Context7/official sources. Record this as a scoped adaptation of guidance, not blanket stock-shadcn conformance.

Follow current repository Atomic/import/component rules as the primary implementation contract. Use the selected design and existing components first; skills do not authorize a redesign or adding abstractions. Do not invoke broad app-builder/brainstorm workflows that reopen the already approved concept. Do not spawn agents merely because a skill describes delegation. Resolve conflicts in favor of direct user scope and current repository behavior; disclose exceptions rather than inventing approvals or silently rewriting the system.

## 4. Phase B — detailed plan before implementation

Write `docs/implementation/plans/MC-ZCODE-SOLID-GLASS-PLAN-20261029.md` before any product-source edit. Include:

1. Goal, non-goals, verified source/base identity and ownership boundaries.
2. Current UI inventory: every implemented product route/family, shared components and bespoke controls; distinguish REST product, demo, prototype and Storybook. Mark inaccessible paths explicitly.
3. Token mapping for light/dark: page, panel/card/popover, foreground/muted, border/rim, primary/secondary/destructive, success/warning/error, selected/focus, shadow, radius and motion. Preserve meaningful status differentiation; neutral glass must not erase legal-work risk cues.
4. Component mapping and precise intended appearance for buttons, links styled as buttons, fields, menus/tabs, dialogs, cards, tables, sidebar and workbench. Explain where material is intentionally absent or subtle, especially dense text/table areas.
5. Button specification by semantic role and size tier: height/min-height, padding, radius, font/line-height, icon size/gap, hit target, focus/hover/pressed/selected/disabled/loading; table of allowed exceptions. Same-tier equivalents must agree across routes. Preserve responsive `.control-target` hit areas and the approved larger scoped workbench primary CTA; do not make all buttons the same size or encode hover as the only selected-state cue.
6. An ordered file-level change list, affected consumers/tests/stories, dependencies between steps, expected blast radius and rollback that removes only this session's changes without reverting existing dirty work.
7. A representative pilot covering shared primitives, one dense workbench/table region and one dialog in light/dark before expanding to remaining routes. Define pilot pass/fail criteria; expand only after they pass. No unnecessary feature flag or theme switch.
8. Verification matrix with concrete commands from the current package scripts, browser viewports/states, accessibility/contrast and performance checks, evidence outputs and acceptance criteria. Separate baseline failures from introduced failures.
9. Reference/skill compliance matrix from sections 3A–3B: which source informs each decision, which installed capability verifies it, and which guidance is intentionally inapplicable. Keep research bounded to concrete implementation decisions.

After saving the plan, send a concise progress update with its path, selected approach and scope, then implement in that order within the authorization above. The user requested planning before implementation, not a plan-only response or an extra routine approval round. If a material design conflict or concurrent writer blocks implementation, report the exact decision/conflict and keep the plan complete rather than silently choosing a redesign.

## 5. Phase C — implement incrementally

- Establish baseline evidence and relevant existing test results first. Keep a session-specific touched-file list and source hashes; detect concurrent drift before subsequent edits and final verification.
- Add only necessary material tokens/styles through the existing system. Avoid wholesale upstream CSS imports, global resets, font replacement, hard-coded colors in components and new dependency installation. Use existing variants/composition and native accessible behavior. Any selector hooks must be explicit and locally maintained, not accidental class-name substring matching.
- Complete and verify the pilot. Resolve actual cascade/focus/contrast issues at the shared source, then propagate the agreed treatment consistently to all inventoried applicable product families. Do not leave duplicate legacy button styles creating arbitrary differences. Retain justified exceptions with documented reasons.
- Preserve data flows and protected information cleanup. Keep disabled/loading semantics, submit defaults, navigation links, keyboard operation, focus return, error visibility and retry/recovery behavior unchanged. Do not copy upstream demo handlers or fixtures into product code.
- Keep visual changes readable and restrained: no decorative animated backgrounds, large-area unnecessary blur, new remote fonts or excessive nested backdrop filters. Provide usable opaque fallback when glass features are unsupported. Document how the current theme behaves in forced colors and reduced-motion modes.
- Do not overwrite/restart another session's runtime or build into its active output directory. Establish an isolated, session-owned build/runtime using existing supported mechanisms if needed; record URL, PID ownership and source/build identity. Use permitted browser tools and human-assisted login where required, with no credential/session extraction or permission bypass.

## 6. Verification and acceptance

Use existing tests/scripts; do not add tests that merely assert decorative class strings. Add/update focused tests only where behavior or a real regression boundary needs coverage. Run affected component tests, frontend type/lint/format/agent checks and production build/CSS guard with the current package manager. Report exact commands, exits and pre-existing failures. Builds do not establish visual acceptance.

Capture permitted before/after evidence at matched viewport, zoom, theme, locale and synthetic state. Cover desktop 1440px, intermediate around 1100px/800px and mobile 390px/320px; light/dark, representative EN/VI long text, empty/populated/error and dialog/menu overlays. Disclose combinations not sampled. Distinguish fixture rendering from authenticated product rendering.

Measure representative controls with `getBoundingClientRect` and computed styles in CSS pixels: same-tier button heights/padding/icon alignment, clickable hit areas, scoped CTA exceptions and wrapping. Check keyboard focus/return, contrast over actual composited surfaces, selected versus hover states, loading layout shift, mobile overflow, native dialogs, scrolling/sticky layers and backdrop performance. Compare rendering cost on a repeatable local interaction to the baseline; do not invent FPS or performance guarantees.

Acceptance requires: the documented Solid Glass material is visible and coherent; approved composition remains recognizable; equivalent controls agree; semantic statuses remain distinguishable; existing interactions/tests remain sound; no unexpected horizontal overflow at 320px; fallback remains usable; actual rendered evidence is linked or the missing browser/auth/runtime check is explicitly BLOCKED. Never label browser-unchecked CSS as visually accepted or claim an independent review of your own implementation.

## 7. Deliverables and handoff

Create a task record at `docs/implementation/tasks/MC-ZCODE-SOLID-GLASS-20261029.md` with requirement traceability (reuse actual IDs; do not invent approvals), owner, priority, scope, dependencies, inputs/outputs, acceptance, reviewer and current status. Start IN_PROGRESS; final candidate is IN_REVIEW with evidence, or BLOCKED with a precise cause. No self-awarded DONE.

Use a new, non-overwriting evidence directory `docs/testing/zcode-solid-glass-20261029-r1/` (increment suffix if it already exists). Include research/provenance and compatibility matrix, route/component coverage, button specification/measurements, before/after captures when allowed, verification receipts, remaining visual deltas and final return. Link the saved plan and identify its revision and any justified implementation deviations.

Final return: actual identity/tool version; base/head and dirty-work preservation; upstream revision/license; chosen adaptation; changed files and why; covered routes/components; plan steps completed; test/browser results; reachable session-owned local URL if started; remaining findings and next reviewer. Provide an independent QA checklist focused on the changed surfaces and button consistency. No external-agent invocation claim unless it actually ran and returned evidence.

Finish with skipped checks and residual risks. Deliver a tested local candidate or a concrete blocker after a complete research/plan package; do not stop at generic recommendations.
