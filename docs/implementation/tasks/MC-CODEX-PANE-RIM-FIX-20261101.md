# MC-CODEX-PANE-RIM-FIX-20261101

- Owner: actual Local Codex; priority P1 UI defect; status **IN_REVIEW**.
- Input: PO screenshots of Matter row hover square corners and duplicated Milestones panel bottom rim, 2026-11-01.
- Base/head: `codex/unified-project-flow` / `64b9e0315e210953d7a7eaeacc0643b269a14ad9` with preserved dirty work.
- Scope: existing frontend shared list CSS and Control Room section presentation. No product rules, API, backend, schema, credentials or dependency changes.
- Requirements: retain existing list navigation, icons, keyboard focus, responsive Pane material and unchanged Control Room facts; remove square interactive corners and doubled refracted panel borders.
- Inputs/dependencies: pane-workbench.css, ControlRoomView Section, existing globals.css hover/material rules, running local API/session; frontend-design and Impeccable polish/craft guidance.
- Outputs: two application files; evidence/return in docs/testing/codex-pane-rim-fix-20261101-r1/.
- Acceptance: first/last interactive list rows inherit corresponding container radii; overflow remains visible for focus; section uses exactly one CSS material, no nested displacement layer; existing labels/icons/facts preserved; desktop and 390px observations.
- Tests: 4 related files / 31 tests PASS; Webpack build/CSS guard PASS; changed files format and Git whitespace PASS. Full pnpm check passes typecheck/lint, stops at existing unrelated filing-guard-copy.test.tsx formatting.
- Reviewer: nonauthor pending. Render/source checks are Local Codex author verification, not whole-product acceptance.
- Runtime: replaced only verified Codex frontend on 3000 using a separately built snapshot; API/database untouched. No commit/push/deploy.
