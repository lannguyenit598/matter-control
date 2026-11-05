# MC-FOCUS-SEARCH-IMPLEMENTATION-20261101

Owner actual Local Codex; priority P1; status IN_REVIEW. Requirements FR-FOCUS-01..14, AC-FOCUS-01..18, QS-BR-001..007 and QS-AC-001..018, including direct PO QS-D01 decision. Branch codex/unified-project-flow, base 978d8fc694a47e9beee528076bcf1af9473997e3 plus pinned dirty tree.

Scope: execute the current Focus/Search implementation plan on primary source through a local candidate. Inputs: plan, BRDs, module designs, current contract and component rules. Outputs: backend metadata read service, authenticated BFF, Focus local coordinator/UI, Quick Search, tests, updated API/config docs and candidate evidence.

Dependencies: current authenticated runtime, existing graph/authorization reads, disposable PG17/18 ICU verification, installed tooling. No production/provider mutation. Preserve existing UI/drafts/UNKNOWN behavior.

Acceptance: per-case plan matrix, backend make check with owned PostgreSQL, frontend pnpm check/build/CSS guard/Storybook, privacy and concurrency checks; real browser cases stay blocked if official tooling is unavailable. Reviewer: final fresh nonauthor code review, independent runtime acceptance remains separate. Evidence: docs/testing/focus-search-implementation-20261101-r1/. No commit/push/deploy or self-awarded release DONE.

2026-11-02 local candidate: implementation and author gates complete; verification state IN_REVIEW_WITH_VERIFICATION_BLOCKERS. See docs/testing/focus-search-implementation-20261101-r1/return.md and36-row acceptance matrix. Original nonauthor review requested rework;11-file author repairs are pending nonauthor confirmation. No release/DONE/commit/deploy.
