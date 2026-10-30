# MC-P0-CODEX-FE-PATCH-20261028 — isolated implementation return

Actual identity: Local Codex internal worker `/root/p0_frontend_patch_20261028`, not external Claude, ZCode, OpenCode or Antigravity. Priority P0; requirements FR-012/FR-013, audit F02. Owner Codex for this explicitly authorized isolated patch. Proposed next status **IN_REVIEW**, pending actual nonauthor review and Claude reconciliation; no DONE/design/runtime/release approval.

## Provenance and boundary

Recorded source branch `codex/unified-project-flow`, base/head `a62d838791ba188838c4ff00b7b6e265ac775056`, from the root coordinator's baseline manifest captured `2026-10-28T03:21:25.779322+00:00`. Baseline includes in-flight public source bytes; recorded Git HEAD does not mean every source byte equals that commit. The worker ran no Git command and created no commit. Independent immutable copy: `/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/baseline`; writable copy: `/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/frontend`. All 819 manifest pins were rechecked against the immutable copy; see [integrity.json](evidence/integrity.json).

Input: copied audit `docs/testing/p0-codex-parallel-20261028/fe-alignment/return.md`, F02. Current copied code already had split Bulk/Import components, frozen intent helpers, action validation and row groups; this patch preserves and completes those seams. Read frontend AGENTS, architecture/TypeScript/security/testing/dependency rules, RTK guidance, installed Next server-action guide and orchestration protocol. Semble-first lookup used the exact isolated repository path. Framework configuration, packages and API contracts did not change.

Claude remains the live product writer. No live `apps/`, workboard, contract, backend, global styling, auth/access-loss, shell or other feature file was written. Product changes are **exactly five paths** under `apps/frontend/src/features/data-transfer/`; [changed-paths.json](evidence/changed-paths.json) records before/after SHA-256:

- `intent.ts`: normalize receipts to the exact submitted row identities; missing or duplicate receipts remain UNKNOWN rather than settling the attempt.
- `components/bulk-section.tsx`: bind Commit to the stored preview payload; any edit/add/remove permanently invalidates that approval, including edit-then-restore; block edits and duplicate calls while pending; catch rejected action transport; keep unresolved attempts locked and retain keys even if reconciliation is denied; remove discard-and-remint during UNKNOWN; show whole-attempt UNKNOWN row counts.
- `components/import-section.tsx`: lock file replacement while pending or unresolved; catch rejected action transport; normalize receipts; retain file/run/row keys through UNKNOWN; consume the preview when settled so a subsequent intent requires deliberate fresh preview; remove discard-and-remint during UNKNOWN; show whole-attempt UNKNOWN row counts.
- `components/data-transfer-ui.test.tsx`: update two changed recovery expectations and add two action-transport rejection regressions.
- `components/data-transfer-attempt.test.tsx` (new): seven regressions using actual components → actual actions → actual repository, with only authenticated-session/revalidation and the API-client boundary mocked.

No callers, exports, fixtures, dependency/config files or server action signatures needed changes. Existing actual action/repository seam tests were also run unchanged.

## Acceptance and verification

Synthetic fixtures only. Historical verification subprocesses used PATH, HOME=/private/tmp, TMPDIR=/private/tmp and NO_COLOR=1; that HOME override violated the command environment rule. Those real execution logs remain unchanged. The corrected final verification below used a cleared child environment containing only PATH, TMPDIR=/private/tmp and NO_COLOR=1. Parent HOME/home/CODEX_HOME were untouched and all three were absent from the child environment; no HOME override or private env loading was used. See the [environment erratum](evidence/corrected-env-20261028T034105457961Z-erratum.md). No real API/client request was allowed through test mocks. Existing node_modules symlink was reused read-only; no install/package scripts/hooks were run. Vitest used `--configLoader runner`, explicit cacheDir `/private/tmp/mc-p0-fe-vite-cache`, result cache disabled and fsModuleCache disabled, avoiding linked dependency-cache writes.

| Check | Result | Evidence |
|---|---|---|
| New seam regressions on unchanged immutable-baseline product files | Expected red: 7/7 failed, exit 1. Tested baseline copies were temporarily restored only in the worker's writable copy, with patched bytes restored in `finally`; immutable baseline was never edited. | [repro-before.log](evidence/repro-before.log), [command/UTC/exit](evidence/repro-before.json) |
| Focused Vitest: feature tests + existing action/repository/client seam suite | PASS: 4 files / 41 tests, exit 0; 18 UI + 7 full local seam + 6 intent + 10 existing seam cases. | [focused-final.log](evidence/corrected-env-20261028T034105457961Z-focused.log), [command/UTC/exit](evidence/corrected-env-20261028T034105457961Z-focused.json) |
| Preview edit/add/remove then restore cannot reuse approval | PASS in new actual-action seam tests. Commit body matches exact preview input, adding only minted keys. | Same focused log |
| Pending duplicate prevention and locked bulk/file inputs | PASS in new seam tests. | Same focused log |
| UNKNOWN and replay retain payload, file and attempt/run/row keys | PASS in seam and action-transport tests. Denied reconciliation does not settle the old command. | Same focused log |
| Missing/duplicate/unexpected receipts, visible counts | PASS: submitted identities retained as UNKNOWN; groups balance the submitted rows. | Same focused log |
| Settled import requires new preview and then fresh keys | PASS in new seam tests. | Same focused log |
| Scoped feature TypeScript, including real existing test setup types | PASS, exit 0; extends existing strict config, no generated-type stubs. | [typecheck-scoped-final.log](evidence/corrected-env-20261028T034105457961Z-typecheck.log), [command/UTC/exit](evidence/corrected-env-20261028T034105457961Z-typecheck.json), [config](evidence/tsconfig-scoped.json) |
| Scoped ESLint | PASS, exit 0. | [lint.log](evidence/corrected-env-20261028T034105457961Z-lint.log), [command/UTC/exit](evidence/corrected-env-20261028T034105457961Z-lint.json) |
| Prettier changed paths | PASS, exit 0. | [format.log](evidence/corrected-env-20261028T034105457961Z-format.log), [command/UTC/exit](evidence/corrected-env-20261028T034105457961Z-format.json) |
| Direct whole-frontend tsc without generating types | FAILED, exit 2: snapshot lacks `.next/types` route globals (PageProps/LayoutProps; two downstream route parameter type errors). No owned-file diagnostic. This is not a full frontend typecheck PASS. | [typecheck.log](evidence/typecheck.log), [command/UTC/exit](evidence/typecheck.json) |

Tool versions: Node v24.22.1; Vitest 5.0.5; TypeScript 5.9.3; ESLint 9.39.5; Prettier 3.9.10; React 19.3.1; Next 16.4.2, obtained from installed package metadata. See [versions.log](evidence/versions.log). All check metadata includes exact command, cwd, UTC timestamps, environment policy and exit. Retained intermediate failed-check artifacts are superseded by the named final artifacts: `focused-after` had one test assertion before awaiting the actual asynchronous action; initial `typecheck-scoped` omitted existing test setup's matcher augmentation. Those harness issues were corrected without product stubs, and their original logs are retained.

The required project-wide `pnpm check` was not run because this assignment explicitly limited execution to focused checks and prohibited package scripts, builds and linked-cache mutation. No full-check or build PASS is claimed. Root coordinator exports the reviewable patch separately; nothing has been auto-applied to current Claude files.


## Corrected-environment continuation — 2026-10-28

Task MC-P0-CODEX-FE-PATCH-20261028; actual executor Local Codex `/root` continuation. Original patch authorship above is retained; this verification is not independent review. Actual coordination branch/head remains `codex/unified-project-flow` / `a62d838791ba188838c4ff00b7b6e265ac775056`; exact source identity also requires the pinned uncommitted bytes. No source, test, config, caller, fixture, export or delivery patch was edited in this continuation. Outputs are this return and new `frontend/evidence/corrected-env-*` artifacts only.

All four exact retained commands were rerun against the frozen isolated frontend with the inspected existing temporary configs. Focused tests PASS 41/41 in 4 files; scoped TypeScript, scoped ESLint and changed-path Prettier PASS, each exit 0. Each new JSON receipt records real UTC start/end, argv, cwd, environment policy and log hash. The [summary](evidence/corrected-env-20261028T034105457961Z-summary.json) records installed tool versions, config content/hashes, 819 immutable baseline pins verified before/after, all five patch hashes and delivery-after hashes, unchanged delivery patch hash, and an unchanged before/after inventory of 455 isolated frontend files. All 31 pre-existing evidence files were unchanged when checks completed. Dependency reuse remained through the existing symlink with Vitest cache outside node_modules and result/fsModule caches disabled; no install or package script ran.

Acceptance of this verification correction: PASS_SCOPED. Proposed patch status stays **IN_REVIEW**, pending assigned nonauthor review and Claude current-source reconciliation. No full application typecheck/build or acceptance is inferred.

**Claude integration follow-up / residual F02:** UNKNOWN retry state is component-local. Reload or tab close loses the retained payload and attempt/run/row keys; the current patch does not implement durable recovery and cannot close all of F02. This limit is source/checkpoint evidence, not a newly executed browser reload test. Integrate receipt-backed recovery or obtain approval for a narrowly scoped persistence approach; do not persist raw import files, legal payloads or tokens ad hoc. Reconcile current source before integrating any frozen hunks, then verify recovery across reload/tab close with real receipts and appropriate access controls. This return is the handoff artifact; no external Claude invocation or acknowledgement is claimed.

## Integration and remaining gates

Nonauthor reviewer must inspect these exact frozen bytes, then Claude must compare baseline hashes with current live files, preserve its newer changes, integrate the applicable hunks once and run integration/final gates. No branch reset, directory replacement or automatic patch apply is authorized by this return.

Attempt retention remains component-local; reload/tab close after UNKNOWN loses retry state. Durable recovery is NOT_FIXED, and full F02 closure is not claimed; browser reload behavior was NOT_RUN. A page reload is not represented as reconciliation. UNKNOWN has no discard-and-remint path in this patch. Real browser serialization/focus/geometry/visual/accessibility, actual API/auth/provider/DB behavior and full application acceptance remain unverified; mocked local component tests establish only their stated seam behavior.

Skipped: full `pnpm check`, builds, browser/E2E, real API/auth/DB/provider, install, Git/commit/deploy and live source application. Risk: concurrent Claude changes can supersede these isolated bytes; independent review and current-source reconciliation remain required.
