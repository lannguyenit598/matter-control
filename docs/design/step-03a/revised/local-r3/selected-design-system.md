# MatterControl selected system — D-UX01..04

**Selected under PO delegation, not awaiting another routine PO vote.** Authority and complete decisions: ../../design-decisions.json. One A Enterprise Precision foundation; B contributes causal impact/inspector behavior, C optional compact density only. Alternative board palettes remain archived comparisons. No IBM/Linear/shadcn branding copied, library installed, framework version presumed or API contract selected. No manual PO visual review is claimed.

## Product and visual contract

Control Room answers condition→cause→downstream→accountable owner→permitted next step. Grid executes approved work while preserving proof/history/context. Requirement≠Action; Evidence Requirement≠Evidence; COMPLETED≠VERIFIED; WAITING≠BLOCKED. Text/reasons carry semantics; color is supplementary. No readiness percentage, no status dropdown that invents proof or READY, no generic task replacement.

Typography: system humanist sans for application,14px/1.5 body,12px/1.5 labels/metadata,22px/1.25 app heading. Monospace only IDs/time/data. Existing serif belongs to the review document/board, not a second application control font. Scale values are design choices, not WCAG thresholds. Long labels and Vietnamese diacritics wrap; multiline rows grow.

Palette and exact values: design-tokens.json. Surface/background/ink/muted establish quiet reading; execution neutral, accepted proof green, dependency-ready blue, blocked red, timing/attention named causes. COMPLETE is not proof green. Exact state labels and axes remain distinct even where colors share a family. The source-check report computes selected sRGB pairs only; actual computed colors/backgrounds/hover/disabled/focus need later rendering.

Spacing:4px base;8px close controls,12px panel padding/gaps,16px application gutters,24px group separation. Border/flat surface is resting elevation; shadow only for floating dialogs. No decorative animation, charts, glow, vanity metrics or marketing hero.

Density: Comfortable default, single-line row minimum44px/8px vertical padding; Compact opt-in minimum36px/4px padding. Body/state text does not shrink with density. Multiline rows expand; do not clip legal state/reason/errors to hit a target count. Selection, filter/sort, scroll, focused object and draft/error must survive density changes. Concept retains the existing standard/compact select; future persistence of user preference is an implementation detail, not a new storage/API decision.

Desktop control minimum32px; mobile touch control minimum44px as a chosen interaction contract, not a universal WCAG criterion. Native focus is2px selected blue with offset; white on dark header. Selected row differs from hover and focus; invalid fields retain value plus local error. Disabled controls keep a readable reason and do not rely on opacity alone. Exact CSS is in selected-tokens.css and embedded byte-identically in the self-contained HTML.

## Layout, navigation and responsiveness

Critical chain spans the Control Room, followed in DOM order by Next Actions and a dedicated Important Decisions queue, then Waiting On, Milestones, Evidence Gaps, Changes and contextual Finding/Risk. Desktop pairs adjacent sections; narrow layout uses the same logical order. No-candidate at T0 is an explicit result, not empty mystery. RQ-06 remains a Requirement, never a Next Action. Waiting On shows internal follow-up ownership without granting access or changing execution.

Critical chain cards use ID/type/state/reason, not ornamental metrics. On narrow screens two text columns reduce wasted vertical space while preserving all content; no row count cap or hidden first-eight rule. This is a source-level composition choice informed by A/B critiques and EV-UI-001's limited old-layout image, not a measured responsive fix. The ten-second comprehension goal is unverified.

Mobile prioritizes overview, accountable blockers, My Actions/Waiting On, detail/evidence status and permitted simple actions through cards/full-screen details. Search/filter can reach all matching records. Desktop concentrates dense multi-column Grid, comparison and complex bulk. Mobile gets an appropriate staged alternative/deferred continuation for complex work, not a security role ban or P0 feature deletion. Current complete My Actions/Waiting On/filing/submission remain specification-only, accurately labeled.

Dialog/detail navigation preserves the object/tab/selection/filter context; keyboard expectations are Tab/Shift+Tab, row arrows/Enter/Space, native nested-input keys, Escape, labeled focus fallback and visible error recovery. Existing code is unchanged; native behavior is not tested. Reduced-motion disables nonessential transitions/animation without hiding state changes. Touch, zoom, screen-reader and focus clipping need actual allowed rendering.

## Implementation boundary

Concept markup/CSS and specification updates are MC-003A corrective work. They do not initiate production frontend or full high-fidelity STEP03B. Authoritative state, permission/revision checks, storage and domain audit remain existing approved business/architecture requirements, not implemented here. See risk-assessment.md and next-milestone-handoff.md for owners, gates and validation scope. Codex owns validation planning; no manual PO screenshot prerequisite.
