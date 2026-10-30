# Session 2 — Codex frontend: finish verification of existing frozen patch

I assign actual Codex continuation MC-P0-CODEX-FE-PATCH-20261028. Resume existing implementation, not a new UI rewrite. You are not alone: Claude writes live product source; sibling owns isolated backend; reviewer owns review. Preserve their files.

Project root: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control
Packet: docs/testing/p0-codex-implementation-20261028/
Reference branch/head: codex/unified-project-flow / a62d838791ba188838c4ff00b7b6e265ac775056. Uncommitted exact bytes are pinned by baseline-manifest.json and delivery/manifest.json; HEAD alone is not source identity.
Read applicable AGENTS/component rules, /Users/nguyenvanlan/.codex/RTK.md. Prefix shell commands with rtk. Semble-first for exploration; Context7 resolve/query for library/API/CLI documentation when needed. Preserve existing changes; no install/provider/login/account/model change, secret access, production/paid service, Git stage/commit/reset/stash/clean/merge/push, database/resource actions or permission bypass. Never repurpose HOME/home/CODEX_HOME; use task-specific cache/temp variables. No environment dumps.
Record actual agent/tool identity, exact cwd/source hashes, commands/UTC/exits, output paths and tests run/not run. Never claim DONE/acceptance/production readiness from an isolated patch. Preserve author vs independent-review evidence.

## Exact ownership

Writable product copy ONLY:
/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/frontend/apps/frontend
Code ownership ONLY src/features/data-transfer/**. Immutable baseline is sibling baseline/ directory. Existing node_modules symlink is read-only dependency reuse: no installation/hooks or cache writes into it.
Owned outputs ONLY packet frontend/return.md and new frontend/evidence/* attempts. Do not edit live apps, global styles/auth/shared draft boundary, workboard, contract or other feature source.

## Existing checkpoint — keep code frozen

Read frontend/return.md and evidence/changed-paths.json. Five completed paths:
- intent.ts
- components/bulk-section.tsx
- components/import-section.tsx
- components/data-transfer-ui.test.tsx
- new components/data-transfer-attempt.test.tsx

Patch fixes in-session preview invalidation, pending locking, same-payload/key UNKNOWN recovery, missing/duplicate receipt normalization and deliberate re-preview after settled import. Seven seam regressions failed on baseline;41 focused tests/4 files, scoped tsc/lint/format passed. Source is already exported in delivery/frontend/ with exact hashes. Do not reimplement those fixes.

## Immediate unfinished verification correction

Coordinator update: the four `*-corrected-env.json`/`.log` receipts are now present and verified; see `frontend/verification-closeout.md` and `coordinator-integrity.json`. If their hashes/source still match, this correction is complete: do not rerun it or change frozen code unnecessarily. The instructions below preserve the original recovery procedure if the inputs changed or a required receipt is genuinely missing.

Prior check receipts used HOME=/private/tmp, contrary command environment rules. Previous results remain historical real executions; do not erase/change their logs. The previous retry failed from quota before new evidence.

Repeat only final focused tests + scoped typecheck/lint/format with HOME/home/CODEX_HOME untouched. Reuse exact commands/configs from:
- frontend/evidence/focused-final.json
- frontend/evidence/typecheck-scoped-final.json
- frontend/evidence/lint.json
- frontend/evidence/format.json

Use cleared/allowlisted child environment without a HOME override; PATH plus TMPDIR/task-specific caches and NO_COLOR suffice where appropriate. Do not load private env files. Existing configs /private/tmp/mc-p0-fe-vitest.config.mts and /private/tmp/mc-p0-fe-tsconfig.json may be reused after inspection; ensure cacheDir outside node_modules, no result/fsModule cache writes into linked dependencies. If missing, reconstruct from retained evidence configs using actual installed tooling and rules, not type stubs or fabricated command results.

Write new uniquely named corrected-env-*.log/json receipts with real UTC/argv/cwd/exit. Keep code hashes unchanged. Add short evidence erratum and update return to point to corrected final checks. Whole-frontend tsc previously lacked generated PageProps/LayoutProps; do not fake globals or label scoped tsc as full-check/build PASS.

## Important residual scope

Attempts remain component-local: reload/tab close after UNKNOWN loses retry state. This is NOT fixed by current patch. Do not claim full F02 closure or durable UNKNOWN recovery. Report it to Claude for integrated receipt-backed recovery or an approved scoped persistence solution; do not persist raw import file/legal payload/token data ad hoc. Browser/API/PG/full check/build remain unverified here.

If independent review requests a real code fix, limit changes to owned isolated feature paths, add a meaningful regression, then create a new delivery revision with coordinator/reviewer awareness. Otherwise freeze code and finish verification/report only. No live patch application, acceptance self-approval or new scope.
