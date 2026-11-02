# MC-CODEX-SELECT-DENSITY-20261102 — author return

Actual Local Codex, primary frontend writer. Branch codex/unified-project-flow, HEAD978d8fc694a47e9beee528076bcf1af9473997e3 plus preserved dirty candidate. Status IMPLEMENTED_SELF_TESTED / IN_REVIEW. No commit/push/deploy or independent acceptance.

## Root causes and changes

1. The Select relied on customizable native picker support. The reported UI still showed a platform-native menu; DOM feature support alone was not proof of consistent picker rendering. The shared Select now retains its one native named form field, reset/required/disabled/ref/controlled value and input/change behavior, while presenting a token-styled top-layer option list. No second submitted field, new dependency, business read or command was added. Pointer/label activation, arrows/Home/End/Enter/Escape, Vietnamese-aware typeahead and selected checkmark are covered. Old Popover-API-unsupported browsers and multi-select/listbox controls retain the native fallback.
2. Pane CSS unconditionally applied12px20px table-cell padding, defeating WorkGrid's density utility classes. WorkGrid now exposes data-density; a scoped compact rule uses6px12px, preserving content and controls.
3. During browser QA, wrapping labels were found to concatenate every option into the popup's name. A RED regression proved this. The popup now uses a cleaned label and is portalled outside labels, inside the closest native dialog when present so modal inertness and Escape remain correct. The native field's accessible name stays stable.

Changed source: Select atom and tests, Form controls stories, globals.css, pane-workbench.css and WorkGrid (6 files). Final composite manifest binds656 source/config inputs: exactly6 UI changes relative to the Focus/Search final candidate;650 other inputs unchanged. Earlier pre-label-fix manifests/gates retained with explicit filenames. No backend, DB, API, authentication or legal-state semantics changed.

## Verification

- Initial regression RED: no custom listbox and keyboard commit missing (2 failing tests). Wrapping-label regression also RED before its correction. Final Select suite8 cases; full final pnpm check901 pass/12 skip, types/lint/format/agent config pass.
- Final Webpack production build + CSS guard and Storybook build pass (frontend-r3-* logs and exact command/cwd/UTC/exit receipts). Built in an isolated snapshot without install; cloned installed dependencies, snapshot-only verifyDepsBeforeRun:false. New standalone runtime includes public/static assets; no private env was bundled.
- One intermediate full-suite attempt failed an existing Upload dialog asynchronous-close assertion in action-entry.test.tsx. The unchanged file passed12/12 in focused execution, and the unchanged full candidate then passed901/12. It was not rewritten, suppressed or omitted; retain this as an observed test-timing risk rather than claiming every attempt was green.
- Official browser, actual synthetic API/data: custom popup Loại renders Bất kỳ/Yêu cầu/Hành động with checkmark. Mouse selection sets the native value REQUIREMENT; Apply filters yields exactly2 Requirement rows and preserves density=compact.
- Same first3 record identities: comfortable heights148.5/149/149px with padding12px20px; compact136.5/137/137px with6px12px. Each row is12px shorter, not merely a selected toggle style.
- Real keyboard: ArrowDown opens; Home/Escape preserves REQUIREMENT and returns focus. In native Focus dialog, popup name is exactly Phút; Home/Escape preserves25 and leaves parent dialog open. Pointer15min commits15 without starting Focus or submitting a command.
- Light and dark popup screenshots saved, including final nested-dialog and light views. Some earlier control attempts on the shared user tab were interrupted by concurrent navigation/collapsing filters; final keyboard/dialog checks used a separate QA tab, closed afterward.
- Full screen-reader/old-browser/forced-colors/320px matrix NOT_RUN. No claim of independent accessibility approval. Backend was not rerun because no backend source changed.

## Runtime and prior packet disposition

The verified task-owned3109 runtime was refreshed to frontend-r4-select/.next/standalone/server.js after build. Memory BFF login/old Focus epoch ended as announced; the normal synthetic OIDC login was rerun. Main3000/8081 and all databases remained untouched. API18084 and local IdP18094 were reused. Private runtime env remains outside source/build/output.

Focus/Search's previous656-member final manifest is historical and now has6 expected UI drifts. Use this folder's composite-source-manifest.json plus source-delta.json for a new review; do not reuse the prior packet as a live-tree match. Earlier independent Focus findings remain author-fixed/pending review; this UI repair does not close them or any MC-002/P0/release gate.

Next action: manual test current3109 and nonauthor review of the6-file UI delta with current composite pins. No additional implementation writer or external-provider dispatch was created.

Skipped: commit/push/deploy, backend rerun, full screen-reader/browser matrix and independent acceptance. Remaining risk: native fallback appearance on old engines and one observed pre-existing asynchronous Upload test assertion; final repeat is green, failure evidence retained.
