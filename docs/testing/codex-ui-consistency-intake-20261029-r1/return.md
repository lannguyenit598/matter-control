# UI-consistency audit — Codex intake

Actual Local Codex, 2026-10-29. UI audit received; accepted as bounded audit input, not final visual acceptance or completion of the system/database/multi-tenancy audit. No product source/runtime/data changed. Original packet retained unchanged.

Verified17/17 source/reference hashes against current bytes. Inventory50forms; metric CSV46M-IDs plus one trailing comment parsed as a malformed/non-data row;12PNG files present. No full historical screenshot hashes were asserted by the original index, so their existence is not a byte-integrity verdict. Detailed checks in checks.json.

Source confirms: ReviewFilters uses a raw search submit and native GET form; Input uses40px versus shared Select/Button36px; SearchInput raw clear button lacks shared control-target; base narrow/coarse media rule omits summary; upload recovery strings remain partly English. These support investigation/remediation, not complete runtime/accessibility certification.

## Intake dispositions

- UI-F01: real duplicate search-control implementation. Reuse shared primitives under writer handoff. The native review form is a separate full-document-navigation review lead; confirm and assign any behavioral change to the feature owner rather than assuming a styling fix resolves it.
- UI-F02: confirmed source sizing difference; define intentional tiers/row alignment before global Input resizing. Same-tier peers should align; dialog fields/footer actions need not have identical dimensions.
- UI-F03: applied removable chips and state-navigation filters have distinct semantics; target/typography consistency may help, but a new shared abstraction is not automatically required.
- UI-F04: source divergence in global-error button; preserve root fallback robustness before importing shared code or assuming style availability.
- UI-F05/F12: unused Pagination/convention cleanup is low-priority maintenance; not a core product blocker. Avoid forcing a page-number component onto cursor navigation.
- UI-F06/F09: source-supported narrow/coarse hit-target coverage gaps; verify actual effective target and spacing at320px/coarse pointer before declaring numeric accessibility failure or applying overlays.
- UI-F07: unused selector is cleanup, not demonstrated user harm.
- UI-F08: source-confirmed partial localization; extend existing EN/VI mechanism without changing upload UNKNOWN intent or exposing user content.
- UI-F10: needs computed-geometry confirmation. InlineEdit size-7 coexists with shared min-h-8/min-w-8; the declaration alone cannot prove a28px control.
- UI-F11: intentional navigation hierarchy; preserve unless task evidence shows a user problem.

## Critical qualifications

Keep approved compact CTA160×44/14px; historical prototype200×56 does not supersede the PO amendment. Dev-server start time predating a source edit is insufficient proof of stale modules. The reported root redirect mismatch warrants checking response/source identity; it does not independently establish old INT-A provenance or authorize a restart. Keep RUNTIME_REVISION_UNCONFIRMED and observed measurements scoped accordingly. Route stalls are not proven to share the root cause of unit-test clicks on intentionally disabled controls.

The original UI packet references pre-fix RMV-F02/F04; the final corrected26-file candidate and Codex rework intake must also be consumed. Dirty files/mtime do not establish an active writer or handoff. No repeated UI fixes should conflict with the continuing feature owner.

## Next action

The combined system-review→Solid-Glass prompt now includes this received packet and per-finding caveats. Review session continues full system/multi-tenancy audit; after sealing pre-change findings and obtaining frontend writer handoff, plan and implement within-scope visual/target/localization corrections alongside the restrained material adaptation. Capture current builds and fresh permitted desktop/narrow/keyboard/EN-VI evidence. Final authored visual changes require later nonauthor review.

Skipped: browser/render/contrast/keyboard checks, runtime restart, source fixes, tests/builds and commit/push. Risk: blindly normalizing every numeric/style difference could remove deliberate hierarchy or regress fallback/recovery flows; a correctly labeled audit is an input to the plan, not a blanket patch prescription.
