# MC-CODEX-CURATED-MAIN-INTEGRATION-20261103

Owner: actual Local Codex. Priority P1. Status IN_REVIEW_WITH_VERIFICATION_BLOCKERS; local integration completed.
Authorization: PO approved the proposed selective integration and local merge into main.
Requirements: retain implemented product code/current documentation without coordination dossiers.

- Source: codex/unified-project-flow at 6172f234be5a25393cddffaf841cc0370b587334.
- Target base: local main at 54e1db541157706dee9037b23f630faf59249c27.
- Isolated worktree: /private/tmp/mc-main-release-20261103, branch codex/main-release-preparation.
- Scope: apps, CI, ops, current architecture/API/business-rule/design/operator documentation;
  exclude development evidence, task/prompt/handoff/workboard/research/prototype and runtime cache.
- Preserve source authorship through the source revision and archive references. No rewrite or
  selective deletion in the original coordination checkout; untracked files remain there.
- Acceptance: source byte parity for business code/tests, no excluded dossiers in target tree,
  repaired documentation links, backend make check with fresh PG, frontend tests/types/lint,
  production Webpack/CSS, Storybook, agent checks and profile renderer. Normal commit + local
  main fast-forward only after checks. No push, deploy or retained runtime/database refresh.
- Reviewer: actual Local Codex verifies import parity and final diff; earlier implementation
  reviews remain historical and this is not new independent release acceptance.
- Outputs: curated main commit; concise docs/release/integration.md in product tree. Raw logs
  stay private at /private/tmp/mc-main-release-verification-20261103.
- Limits: browser/real IdP/accessibility/human/recovery/cloud NOT_RUN; retained 0016 draft schema
  mismatch remains explicit. Archive remote links require separately publishing the source commit.

Task/evidence coordination records stay outside the curated main tree by design.

## Local merge receipt

- Curated commit/main: 048776b3862ab384ab4e42356c46c0a320a93488.
- Normal commit followed by fast-forward from 54e1db5; target worktree clean.
- 1023 product files, 21 primary docs; all excluded development namespaces absent.
- 686 business code/test/fixture blobs identical to source 6172f23.
- Backend PostgreSQL make check, frontend 920 tests, type/lint/format/agents, Webpack/CSS,
  Storybook and 6 renderer tests passed. Browser/provider/recovery/human acceptance NOT_RUN.
- Original coordination branch/files preserved; no push/deploy.
