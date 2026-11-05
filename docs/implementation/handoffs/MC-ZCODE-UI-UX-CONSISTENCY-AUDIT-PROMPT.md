# MC-ZCODE-UI-UX-CONSISTENCY-AUDIT-20261029

You are actual ZCode in a **separate review session**. Independently audit the entire implemented MatterControl product UI/UX for consistency, with special attention to buttons: do equivalent actions actually share appearance, dimensions and interaction behavior? Produce an actionable, measured audit, not a general design critique or a claim based only on component names.

This is a manual review assignment, PREPARED_NOT_DISPATCHED. The human pasting this prompt starts the assignment. Do not message other sessions or spawn additional writers. You are a read-only reviewer of application source and the owner's runtime; this prompt does **not** authorize fixing UI, changing product behavior or taking over the active implementation/rework session.

## 1. Context and boundaries

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Expected branch: `codex/unified-project-flow`. HEAD observed at prompt preparation: `20feedbf06c859a9806055d609f5b132fe8bb086`. Verify current repo/branch/HEAD and dirty paths; this historical HEAD is not a reset target and does not identify uncommitted source bytes.

Preserve all Claude/ZCode/Antigravity/Codex work and actual authorship. Keep `leonx.me/matter-control`. Do not reset/stash/clean/switch/commit/push/merge/deploy. No frontend/backend source edits, dependency install/relink/upgrade, global settings, real R2/provider call, database migration/seed/reset, permission/role change, or retained-runtime lifecycle.

The separate review-matrix rework may be running from `docs/implementation/handoffs/MC-REVIEW-MATRIX-ZCODE-REWORK/`. Do not compete with its writer or treat in-progress code as frozen. Snapshot reviewed files; record later drift and narrow any conclusion invalidated by it. If you also authored a reviewed component in another session, disclose that section as **author self-review**, not independent approval. A fresh session alone does not establish nonauthor independence.

Read root/frontend AGENTS and applicable rules, current workflow/status and actual task returns. All shell commands use `rtk`/`rtk proxy`; Semble before code exploration, then exact/exhaustive source searches as needed. Use current documentation through Context7 for framework/library/tool usage, not guessed flags. Use relevant installed UI/accessibility audit skills if available and compatible; no skill/tool install or permission bypass.

## 2. Source of truth and current clues

Read these inputs and current callers:

1. `apps/frontend/src/components/atoms/button.tsx`, its tests/stories if present, shared Input/Select/Textarea/link/dialog/menu/tab components and existing component guidelines.
2. `apps/frontend/src/app/globals.css`, actual theme/design tokens, utility merge behavior (`cn`), scoped workbench selectors and responsive overrides.
3. `docs/design/legal-team-experience-20261029/concepts/approved-selection.json`, selected concept3; `design-prototypes/focused-workbench/README.md`, `design-qa.md`, its CSS and retained evidence. The approved prototype is a visual reference, not product data/permissions truth.
4. `docs/implementation/handoffs/MC-P0-CLAUDE-WORKBENCH-VISUAL-FIDELITY-ADDENDUM.md`, current workbench/design-conformance returns and `docs/testing/claude-backend-handoff-integration-20261029-r1/visual-delta.md`. Old screenshots/findings are historical; confirm current implementation before repeating them.
5. `docs/testing/codex-review-matrix-verification-20261029-r1/return.md` and the current rework task, for known UNKNOWN/access-loss findings. Track their current disposition; do not start a competing fix or count them as newly discovered UI polish defects.

At preparation the shared Button has variants primary/secondary/outline/ghost/destructive and sizes sm/md/icon. Source uses `min-h-8`, `min-h-9`, text-sm, svg size4, plus `.control-target` raising coarse-pointer/small-screen minimum height/width to2.75rem. The workbench has a deliberately larger scoped primary action (`work-primary`); the approved reference asks for at least200×56 with16px text. **These are source clues, not measured rendered dimensions.** Read current definitions and cascade; do not assume every button should be56px or every link should look like a button.

Correct consistency means the **same semantic role, emphasis, size tier and responsive context** follow the same contract. Different labels naturally have different widths. Destructive versus primary, compact table controls versus page actions, icon-only versus text, navigation versus mutation, and the approved workbench CTA may legitimately differ. Explain each exception; do not label every difference a bug or flatten the hierarchy.

## 3. Required coverage inventory

First enumerate all actual product routes and their feature/component ownership; do not rely only on a remembered menu. Cover implemented flows including:

- App shell, desktop/mobile navigation, workspace switch/context, account, sign-in/out, theme/language/preferences.
- My Work queue/selection/current work/previous-next/Up next/disclosures and empty/error states.
- Workspaces, Matter list/create, membership/person pickers and Matter overview/tabs.
- Work grid/detail, requirements/actions, metadata, execution, dependencies, escalation and planning/milestones/parties.
- Documents/version upload/download/promotion, proof/evidence/assessment/dispute/revocation/basis views.
- Filings list/detail/new/stage/signature/outcome/reopen controls.
- Control Room/context, Matter Agenda, Reviews grid/structure/cell/answer/history controls.
- Data import/export/bulk/preview/commit/receipt/recovery, including hidden-task alerts.

Separate product REST flows from legacy template/demo-only routes and Storybook fixtures. Include template routes in a separate coverage appendix if they still ship, but never count a demo screen or fixture as authenticated product coverage. For inaccessible routes/states, record exact NOT_RUN/BLOCKED reason and source coverage instead of inventing data or changing roles to make a screenshot.

Inventory every actionable implementation form: `<Button>`, `buttonVariants`, raw `<button>`, button-styled Link/anchor, input type submit/button, role=button/custom controls, menu triggers/items, dialog close/footer actions, disclosure summaries and pagination/toolbar/icon-only actions. Tabs and navigation links are separate control families; inspect their consistency without prescribing button semantics to them. Use exhaustive literal/AST scans after Semble to find bypasses, but absence/presence of shared imports alone is not a verdict.

## 4. Button audit — measure actual results

Create a canonical role/variant/size table from existing approved sources and actual shared component contracts. For each comparable family, inspect:

- Rendered border-box width/height, min-height/min-width and interactive hit area, separately from painted icon/background bounds. Record padding top/right/bottom/left, border width/radius, gap, font family/size/weight/line-height, icon size/stroke and text alignment.
- Surface/foreground/border tokens, hover/active/focus-visible/disabled/loading/selected appearance, shadow and opacity. Identify conflicting className overrides, scoped CSS/cascade, Link styling or global selectors that cause deviation.
- Consistent size tier within page headers, toolbars, table rows, forms and dialog footers. Compare adjacent input/select/button heights and baseline alignment. Track icon-only square controls versus labelled controls and spacing in action groups.
- Default, hover, focus-visible, pressed/active where meaningful, disabled, loading and long-label/wrapped-label states. A disabled anchor must have correct semantics and behavior; `aria-disabled` or opacity alone must not leave a forbidden mutation clickable.
- Loading spinner placement, duplicate-submit protection, accessible busy state, focus preservation and avoidable layout shift. Loading/disabled must not silently change a form's intent, keyboard behavior or command key.
- Primary/secondary/destructive hierarchy, action placement/order, cancellation/close semantics and submit button types. Avoid multiple equally dominant actions unless justified by the actual flow. Verify icon meaning and labels are consistent for equivalent actions.
- EN/VI labels, long legal names, text wrapping and narrow-width behavior. Do not call variable text width an inconsistency. Note mismatched heights only after controlling label length, viewport, pointer mode, state and intended tier.

Measure CSS pixels from `getBoundingClientRect()` and resolved `getComputedStyle()` with the permitted browser tooling. Capture actual viewport, zoom, theme, locale, pointer mode, browser/device-scale context and timestamp. Compare like-for-like controls at the same conditions. Screenshots alone may miss hit-area/cascade differences; source tokens alone do not prove rendered equality. Do not report percentage similarity without a justified measurement method.

Include a **side-by-side button comparison sheet** using permitted synthetic crops/screenshots and a metric table. If creating a standalone comparison artifact from existing assets, label it as audit evidence, not a new product screen. Never fabricate a state/screenshot or copy private content into it.

## 5. Broader UI/UX consistency

Review the surrounding implementation, while keeping button consistency the priority:

- Shared typography hierarchy, spacing/density, section separators, page headers, cards/lists/tables, theme token usage and responsive container behavior.
- Dialog/drawer/task-route selection, open/close/backdrop/Escape/focus-return, scroll bounds and reachable submit/cancel at320px.
- Form labels/help/validation/error placement, required indicators, search/picker focus and loading/empty/error affordances.
- Repeated badge/status wording and visual families, icon language, links/navigation/Back/filter context and active tabs. Preserve separate domain state axes; no invented aggregate readiness or legal status.
- Success only after confirmed save/readback; UNKNOWN and access-loss notices visible in all relevant states; retry does not mint a replacement key or erase text. Keep known functional findings separate from visual discrepancies, with cross-references.
- Keyboard reachability/visible focus, accessible names for icon-only controls, disabled semantics, announcements, light/dark contrast and touch hit areas. Audit against actual project accessibility requirements/current authoritative references; do not call this a WCAG certification from a screenshot or source scan.

Do not reopen approved positioning, select another concept, rewrite workflows, redesign the product, propose a new component library, or make cosmetic sameness override accessibility/permissions/status truth.

## 6. Browser and runtime safety

Existing reference may be at `http://localhost:4176/`; product web may be `http://localhost:3000`, API `http://127.0.0.1:8081`. These are historical observations: confirm available URLs and ownership without printing private process environments. An open port is not proof of source/build identity.

- Use permitted browser tools and ordinary human-assisted authorization. No cookie/token copying, login impersonation, provider administration, synthetic account provisioning or screenshots containing credentials/legal data. If login is required, request human entry and continue source-only work meanwhile.
- Keep browser activity read-only: do not submit mutations, trigger downloads/exports, create/delete data or change memberships merely to populate states. Opening a form/dialog, choosing a harmless tab/filter and entering disposable unsent text is permitted for review; do not accidentally submit. Use existing isolated stories/test fixtures for destructive/pending/error states and label those observations FIXTURE_OBSERVED.
- Do not stop/restart the owner's frontend/API/containers or build into its active `.next`. If the live runtime cannot be bound to reviewed source, label visual results RUNTIME_REVISION_UNCONFIRMED and keep source conclusions separate.
- Compare at desktop1440 or the approved reference viewport, intermediate1100/800 and narrow390/320 CSS px, light/dark, EN/VI. Test coarse-pointer conditions through supported emulation; width alone is not a pointer-type guarantee. Use representative shared control families across the full matrix and explicitly list unsampled combinations rather than claiming every cross-product state was observed.
- Do not bypass disabled browser/OS/render permissions with another capture route. If rendered access is blocked, complete the static inventory and proposed measurement checklist, mark exact remaining browser checks BLOCKED/NOT_RUN, and never answer “buttons have identical rendered dimensions” from classes alone.
- No full build/check is required merely to write this read-only audit. Run existing targeted tests or permitted component evidence only when they answer a concrete question and do not mutate shared runtime/artifacts. Record every command/result; do not install tools or change test config.

## 7. Findings and decision rules

For each finding record: ID, severity by actual user impact, route/control/caller, current file:line and source hash, comparison family/baseline, exact state/environment, expected versus observed metrics/appearance/behavior, reproducible steps, source cause if confirmed, evidence link and smallest proposed correction with affected callers/tests. Do not claim a proposed cause is proven by a screenshot alone.

Classify each comparison as:

- CONSISTENT — the relevant observed dimensions/style/behavior follow its role contract.
- INTENTIONAL_VARIANT — approved role/size/context difference, with the specific reason/source.
- INCONSISTENT — actual unapproved same-family discrepancy, with evidence.
- SOURCE_ONLY — source conclusion awaiting rendered confirmation.
- NOT_RUN / BLOCKED — exact missing access/state/tool/revision.

Separate P1 functional/accessibility problems from P2 repeated design-system drift and P3 isolated polish. Do not inflate a2px difference into a critical defect without explaining clipping, alignment, touch/accessibility or visual hierarchy impact. Conversely, a shared component can propagate one real defect across many routes: record one root finding with all affected consumers, not fifty duplicate issues.

Propose a prioritized normalization plan: shared root correction first where justified, then conflicting caller overrides, then isolated exceptions. Specify which controls should share height/tier/style and which deliberately should not. Include an explicit **do not normalize** list for legitimate exceptions, especially the selected workbench CTA and navigation/disclosure families. No source fixes in this session; implementation needs a separately assigned writer.

## 8. Deliverables and final answer

Create a new absent evidence namespace, e.g. `docs/testing/zcode-ui-ux-consistency-audit-20261029-r1/`; resume only if demonstrably yours. The only permitted repository writes are your new audit evidence and `docs/implementation/tasks/MC-ZCODE-UI-UX-CONSISTENCY-AUDIT-20261029.md`. Preserve other tasks/workboard and immutable returns.

Task record: actual owner/identity, requirements (existing P0 UX/accessibility/design conformance), priority, review scope, dependencies, inputs/outputs, acceptance/tests, reviewer, source/runtime limits and evidence. Status IN_REVIEW or IN_REVIEW_WITH_VERIFICATION_BLOCKERS, never DONE by self-approval.

Required artifacts:

1. `return.md`: direct answer to whether the current UI/buttons are consistent, top root findings, actual coverage/limits and proposed next action.
2. `route-coverage.md`: every implemented route/flow and its source/render/state/viewport coverage; distinguish REST product/template/fixture.
3. `button-inventory.csv` or JSON: component/caller/file:line/route/semantic role/variant/size/overrides, expected tier and observation classification. Separate repeated instances from unique implementations.
4. `button-metrics.csv` or JSON: actual measured dimensions/hit area/typography/padding/icon/border/radius/tokens by viewport/theme/locale/state, plus runtime/source identity. Unknown means unknown, never guessed pixels.
5. `findings.md`: prioritized reproducible root findings with concrete comparison pairs, evidence and affected callers.
6. `normalization-plan.md`: smallest proposed component/caller changes, intended exceptions, meaningful regression/visual checks and safe writer ownership; **proposal only**.
7. Permitted screenshots/comparison sheet, source manifests with hashes/bytes, sanitized command/tool receipts and a noncircular evidence index. Recheck drift at return; invalidate only the affected comparisons if another writer changed source.

The final response must explicitly answer:

- Are equivalent buttons visually the same? Which confirmed pairs differ, and why?
- Do heights, padding, font/icon sizes and hit areas match within the same tier/context? Which exact measurements support that?
- Are desktop/mobile, light/dark, EN/VI and loading/disabled/focus states consistent?
- Which differences are intentional and should stay?
- What should the implementation owner fix first, in which shared component/callers?
- What remains SOURCE_ONLY, NOT_RUN or BLOCKED?

End with skipped checks and remaining risk. No commit/push/deploy, application edits, runtime lifecycle or external dispatch. Do not claim rendered consistency, product acceptance or independent approval of code you authored without the corresponding evidence and independence.
