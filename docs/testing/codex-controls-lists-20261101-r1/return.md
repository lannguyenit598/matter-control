# Buttons and lists audit/remediation — Local Codex return

Task MC-CODEX-CONTROLS-LISTS-20261101, 2026-11-01. Actual agent: Local Codex. Base/head `codex/unified-project-flow` / `64b9e0315e210953d7a7eaeacc0643b269a14ad9`, existing dirty work preserved. Status **IMPLEMENTED / SOURCE_AND_UNIT_VERIFIED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS**. No full rendered audit or independent acceptance is claimed.

## Scope and findings

Source inventory covers app/components/features TSX (tests/stories excluded), including shared Button variants, button wrappers, button-shaped links, intrinsic controls, all ul/ol/table markup sites, selectors and shared CSS. See source-inventory-final.json and audit-matrix.md; source counts are not numbers of rendered controls or executed tests.

Four concrete corrections:

1. SearchInput's small raw clear icon was replaced by the existing ghost/icon Button. Its container handles vertical centering, so the shared button hover lift cannot overwrite the centering transform. The input reserves space for the full touch target. Accessible text now follows EN/VI; the native WebKit cancel icon is hidden only when the explicit custom clear is present, avoiding duplicate X controls.
2. The same clear control previously stayed active when the input was disabled/readOnly. It now inherits both restrictions. A new behavioral regression fails before the change and passes afterward; clicking clear must not submit the enclosing form.
3. ReviewFilters uses existing Input/Button with Search icon, preserving the GET contract and grid/state/q fields. No router, API or filter semantics changed.
4. EvidenceBasis uses existing LIST_CLASS for the criterion selector. Its selected/hover link now inherits the prior shared first/last-row corner correction and nested-panel material behavior, rather than maintaining a separate square-highlight list.

Button material stories now opt into the actual Pane workbench context. Remaining four native button sites were reviewed and retained intentionally: the Button primitive itself, TaskChoice pressed control, inline form recovery Reload and standalone global-error recovery. No blanket icon insertion, extra glass surfaces, clipping or domain behavior changes.

Six delivered application/test/story files are pinned in delivery-source-check.json and match the running snapshot. No backend, API, DB schema, identity policy, dependency or business-state change. All pre-existing rim, bottom navigation, Pane, auth, idempotency/UNKNOWN and draft work remains intact.

## Actual tests and limits

| Check | Result / receipt |
| --- | --- |
| Old SearchInput plus new locale/no-submit regression | **RED**: 1fail/1pass, missing Vietnamese clear name; red-search-clear.json |
| Pre-disabled-fix candidate plus disabled/readOnly regressions | **RED**: expected disabled assertions fail; red-disabled.json |
| Final related controls/picker/review/proof/Matter suites | **16 files /134 tests PASS**; related-final.json |
| Full frontend unit suite | **851 PASS /1 FAIL /12 SKIP**, 103 files pass/1fail/1skip; unit-all.json. Existing item page expectation at line186 still asks for “Package and signature readiness” while implementation displays “Package readiness”. No assertion was weakened or unrelated text changed. |
| Final production Webpack build and CSS guard | **PASS**; build-final.json |
| Final Storybook build | **PASS**; storybook-final.json |
| Final whole pnpm check | Typegen/typecheck and lint PASS; **FAIL** at pre-existing unrelated formatting in filing-guard-copy.test.tsx; check-closeout.json. Not a whole-check PASS. |
| Changed-file Prettier / Git whitespace | **PASS** |
| Static Impeccable detector on six changed files | **0 findings**, exit0; detector.json/detector-meta.json. Not a rendered/a11y certificate. |

The initial build/check attempts caught two invalid Testing Library test options written in this task; they were corrected, and the final build/typecheck passed. A subsequent task-owned test-format warning was corrected before check-closeout. Those earlier receipts are retained, not rewritten. First source-inventory.json counts only basic tags; source-inventory-final.json additionally includes button wrappers/button-shaped links and is the audit inventory of record.

## Render limitation and local handoff

The approved in-app browser returned **“Local browser use is disabled in Work settings”** when opening the built component library. No screenshot, hover run, Storybook interaction, authenticated journey, mobile/zoom, color contrast or screen-reader verification was executed for this new six-file delta. No alternate browser, headless renderer, screenshot service or detector URL scan was used to bypass the setting. Earlier rim-task browser screenshots are prior evidence only and are not relabeled as new coverage.

Frontend remains available at http://localhost:3000, snapshot `/private/tmp/mc-controls-lists-20261101/frontend`, wrapper PID39126 (runtime.json). Only the verified old owned listener32799/cwd/parent32797 was stopped after the replacement build succeeded. API127.0.0.1:8081 and databases/containers/object data untouched. Memory sessions reset on frontend replacement; the user can use the existing normal login flow. No credentials/cookies/tokens were read or exported.

HTTP readiness returned200 on login/My Work/Matters and API health/ready. This is reachability only: Next streaming pages may return200 containing an auth/error view, so it proves neither authenticated landing nor authorization correctness. An earlier302-only assumption in a status check failed; the corrected interpretation is documented in http-readiness.json and caused no source change. The owned temporary loopback Storybook server was stopped after browser access was blocked; its static build is retained.

## Next validation

When the approved browser becomes available, inspect Button's Pane light/dark stories (primary/secondary/outline/ghost/destructive, icon/loading/disabled), SearchInput clear EN/VI/keyboard/no-overlap at320/390/768, ReviewFilters GET search, selected EvidenceBasis first/last/one-row cases, picker scroll/focus and the record list/table screens. Use actual negative/loading/long-label states without making business mutations merely for screenshots. A nonauthor reviewer can then evaluate the pinned candidate; no all-screen visual PASS is currently justified.

Skipped: complete rendered interaction matrix, all role/data permutations, physical tablet/Safari, screen-reader/contrast certification, backend reruns and independent acceptance. Known unrelated test/format failures remain open. No commit, push, cloud change or deployment; P0/MC-002 gates unchanged.
