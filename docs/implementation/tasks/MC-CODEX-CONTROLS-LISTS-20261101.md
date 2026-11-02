# MC-CODEX-CONTROLS-LISTS-20261101

- Owner: actual Local Codex; priority P1 UI consistency/interaction; status **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**.
- Request: PO asked to check all buttons and lists, continuing the Matter/list/Control Room rim fix.
- Requirement: existing shared component semantics, real routes/forms and permission/state guards preserved; uniform list corners, usable named icon controls, coherent disabled/read-only/loading behavior and no overlapping visual material.
- Base/head: `codex/unified-project-flow` at `64b9e0315e210953d7a7eaeacc0643b269a14ad9`, preserving pre-existing dirty work.
- Scope: source inventory across app/components/features; Button variants and wrappers, bordered/interactive lists, tables, picker controls, targeted fixes and local source/build verification. No backend, API, database, dependency or business-rule change.
- Inputs/dependencies: current Button/Input/SearchInput/ListSection/SearchPicker/DataTable/NavMenu, Pane workbench CSS, prior rim fix, installed frontend tools and existing local API. Skills: frontend-design and Impeccable refinement guidance already active in this session.
- Outputs: six application/test/story files, source inventory and evidence under docs/testing/codex-controls-lists-20261101-r1/; see return.md for exact checks and limits.
- Acceptance: clear icon button uses shared control and localized accessible text; no accidental form submit; disabled/read-only input cannot be cleared; review Search uses shared Input/Button with preserved GET fields; evidence-basis selected/hover corners reuse existing rounded-list geometry; button stories use actual Pane surface.
- Tests: red-before/green-after for localized and disabled/read-only clear; 16 related files/134 tests PASS; production Webpack/CSS guard and Storybook PASS; source detector no findings; changed files formatting PASS. Whole-check and full-suite dispositions in return.md.
- Reviewer: nonauthor pending. Current author render check is BLOCKED: approved browser tool reports local browser use disabled in Work settings. No fallback renderer or bypass used.
- Local runtime: verified owned frontend replaced after successful isolated build; API/database untouched. No commit, push, merge or deployment.
