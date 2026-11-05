# MC-CODEX-WORK-TITLE-LINK-20261102 — local return

Actual Local Codex; branch codex/unified-project-flow; base/head 978d8fc694a47e9beee528076bcf1af9473997e3 plus preserved dirty candidate. Proposed status IN_REVIEW / IMPLEMENTED_SELF_TESTED; nonauthor acceptance pending.

UI-WORK-NAV-01 implemented: WorkGrid record name is the detail link; separate Open details link removed. Existing grid `from` query is preserved. Pencil remains a separate edit button, including permissions, CAS, draft and UNKNOWN behavior. Title column minimum16rem prevents the pictured one-word-per-line collapse. Four source files modified and one generic InlineEdit story added; final-source-manifest.json pins exact bytes. No backend/API/DB/auth/dependency changes.

Validation: RED regression1failed/38pass before implementation; focused GREEN45/45. Final pnpm check901pass/12skip (types/lint/format/agents included); Webpack/CSS guard and Storybook builds exit0. Earlier invalid RTL assertion-option gate failure is retained in the earlier logs; corrected before all final checks.

Official in-app browser on owned synthetic3109: title click opened the exact first record; Back retained kind=REQUIREMENT and density=compact. Pencil opened inline editor without navigation, Cancel restored link; no save submitted. Measured title column256px, title/pencil aligned within1px, neither nested in the other, no duplicate detail-link text. Evidence browser-observations.json and title-linked-grid.jpg. Local synthetic OIDC only; no real IdP credentials read.

Final composite657/657 hashes match; all5 changed-source pins match primary and tested snapshot.652 prior inputs unchanged. Source-delta.json records4modified/1added against the prior Select/density candidate. Historical manifests remain intact, including initial source-manifest.json before the assertion-option correction; use final-source-manifest.json for this final candidate.

Owned old3109 stopped by SIGTERM only after exact cwd/listener verification; new frontend-r5-title standalone now serves3109. Main3000/8081, API18084, IdP18094 and databases unchanged. Memory BFF session restarted and synthetic browser signed in normally. No commit/push/deploy.

Skipped: backend suites (unchanged), full responsive/screen-reader and independent review. This local UI verification does not close product/release/cloud gates.
