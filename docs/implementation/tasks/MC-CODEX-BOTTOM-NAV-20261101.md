# MC-CODEX-BOTTOM-NAV-20261101

- Owner: actual Local Codex; priority P1; status **IN_REVIEW**.
- Request: PO's 2026-11-01 Pane tablet navigation request. Requirement: responsive access to the existing four primary destinations, with full EN/VI labels and current-route indication. No new business requirement or route.
- Base/head: `codex/unified-project-flow`, `64b9e0315e210953d7a7eaeacc0643b269a14ad9`; existing dirty work preserved.
- Inputs: existing navigation configuration, NavMenu, Pane workbench, DESIGN.md, the PO's reference screenshot and live Pane reference. Skills: frontend-design and Impeccable Adapt/craft-floor.
- Scope: shared frontend composition, bottom navigation, responsive CSS, stories, focused tests and design documentation. No backend, schema, credentials, dependency or business-state change.
- Dependencies: existing authenticated local frontend/API and installed frontend tooling.
- Acceptance: bottom navigation at <=800px, sidebar above 800px; real existing links and route aliases; visible current destination; no clipped EN/VI labels at 320/768px; touch targets >=44px; content reserves dock space; mobile preferences remain available at 768–800px.
- Outputs/evidence: `docs/testing/codex-bottom-nav-20261101-r1/return.md`, delivery-source-check.json, command receipts, screenshots and geometry records.
- Verification: four focused suites (13 tests), changed-file lint/format, production Webpack/CSS guard and Storybook pass. Browser observations cover narrow and tablet EN/VI and light/dark. Existing full-suite test/format defects remain open.
- Reviewer: independent nonauthor acceptance pending; Local Codex's browser checks are author verification.
- No commit, push, deployment or MC-002/P0 gate closure.
