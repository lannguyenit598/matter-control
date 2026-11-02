# Wave2 completion candidate — actual Local Codex takeover

Date:2026-11-01, Asia/Ho_Chi_Minh. Task MC-ZCODE-P1-FIX-WAVE-2-20261101. Actual current executor: Local Codex after the PO requested “tiếp nhận và hoàn tất”. Prior actual ZCode work and four commits are retained, not attributed to Codex. Status **IMPLEMENTED_SELF_TESTED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS / WAITING_COMMIT_AUTHORIZATION**. No independent closure, DONE, deployment or production claim.

## Candidate and source ownership

- Branch/base/head: `codex/unified-project-flow` / `64b9e0315e210953d7a7eaeacc0643b269a14ad9`. HEAD remains unchanged in this takeover.
- Existing ZCode commits: G1 `c76947a`, G4 `066e974`, G6 `1db0d96`, G5 `64b9e03`.
- Existing uncommitted ZCode G2 readers/tests and G3 purpose mapping/test were inspected, retained and freshly verified. Local Codex added tracked-file real CLI coverage to G2 and completed the G7 announcer scaffold/callers. Test-only reconciliation updates the stale Filing heading assertion and formats the guard-copy test; no business rule changed.
- Current combined source:592 pinned application/test/script/config files, zero source drift at close-out. `codex-takeover/source-manifest-final.json`.
- Reviewable Wave2-only source:16 staged paths, exact patch bytes/hash in `codex-takeover/staged-candidate.json` and candidate-source.patch. The layout's staged hunk contains only ActionAnnouncer import/wrapper. Existing dirty Pane/bottom-nav/control/list/search styling changes are excluded from that index patch and preserved in the working tree.
- HEAD plus that staged patch was reconstructed independently of the dirty UI. Its frontend check and production Webpack build pass. All196 backend Go/SQL source files match the combined source whose full backend gate passed. These two source sets are explicitly distinguished; no blanket extension of a result to an unpinned tree.

## Per-unit results

| Unit | Actual current result | Remaining acceptance |
| --- | --- | --- |
| G1 OV-F1-01 | Pre-G1 proof schema/panel with the current signature-UI tests:3FAIL; corrected source:3PASS. SIGNATURE parses, has its own axis and appears in purpose selection. Current full backend HTTP suite includes proof-required submission with accepted PACKAGE+SIGNATURE and pending OUTCOME. | Real browser Filing submission is BLOCKED_NOT_RUN. Unit/memory HTTP evidence is not an authenticated UI journey. |
| G2 OV-R8-01 | Both probe readers return file content. Actual old CLI with normal PEM/sentinel plants falsely exits0; old env plant TypeError reproduced. Corrected CLI reports findings/nonzero without crash.9 node tests pass, including real git-tracked synthetic files, env names, content and no value echo. Built Webpack standalone and Worker artifacts scan clean. | Nonauthor R8 repeat. Artifact scan ran outside a Git checkout and explicitly skipped tracked-primary scan; separate synthetic Git CLI test covers that branch. No full-repository secrets certification. |
| G3 OV-F1-02 | Pre-fix purpose mapper fails SIGNATURE regression; corrected mapping passes, preserves legacy empty purpose as PACKAGE. Complete backend make check/PG/race passes on these bytes. | Nonauthor replay review; commit authorization. |
| G4 OV-F1-03 | Fresh PG pre-fix Down reproduces23514 with SIGNATURE row; corrected Down passes. Existing row retained and mapped to legacy PACKAGE. | Nonauthor validation. This is a conservative purpose downgrade, not lossless recovery of the original SIGNATURE label; no production Down run. |
| G5 OV-R12-01 | Fake-tool probe red→green:4old+1new/RETAIN2 leaves2archives+2sidecars, pruned3; initial empty directory yields1archive, pruned0. | Independent R12 probe; no real backup/provider job execution claimed. |
| G6 OV-F1-04 | Pre-fix domain test fails combined refusal; current source passes. Existing localized guard-copy tests pass. StageResponse retains D-9 re-submission gates as documented.0011 rollback tested with G4. | Nonauthor semantics/copy review. |
| G7 F8/P-09 | Shell-level persistent polite/atomic region is mounted around app content. IntentForm, ConfirmActionButton and InlineEdit emit fixed localized outcome copy after actual results. UNKNOWN is never called Saved and CAS-only UNKNOWN never suggests resend. Repeated identical messages update the DOM. Local feedback survives outside the shell; in-shell local/closed-dialog notices avoid duplicate live announcements. No raw record/server details enter the global message.6 new tests plus supporting form/recovery tests pass (19 across3focused files). | Actual assistive-technology smoke is BLOCKED_NOT_RUN. DOM mutation/focus assertions do not prove spoken output in every SR/browser. Other custom feature-local live regions remain unchanged. |

All seven units are source-corrected candidates, **FIXED_PENDING_VERIFY**, not CLOSED_VERIFIED. See findings-update.md and the updated current findings register; old OpenCode evidence was not edited.

## Gates actually run

| Gate | Actual result |
| --- | --- |
| Backend make check | **PASS**, generated SQL consistency, gofmt, tidy, lint0issues, race suite with fresh owned PostgreSQL18.6.14test-bearing package outputs are not claimed as a test-case/zero-skip count; see actual log. |
| Combined primary frontend pnpm check | **PASS:858PASS/12SKIP**, typegen/typecheck/lint/format/agents check pass. Skipped durable PostgreSQL paths were exercised separately below. |
| Staged-only candidate pnpm check | **PASS:843PASS/12SKIP**; unrelated unstaged UI and its added tests are absent by design. |
| Release preflight unit + real-main/CLI tests | **9/9PASS**, including synthetic Git tracked branch; preflight-tests-final.json. |
| Durable BFF/PostgreSQL suites | **14/14PASS**, own mc_fixture database, no real IdP/provider calls. |
| Production Webpack + compiled CSS | **PASS**, combined primary candidate and independently reconstructed staged-only candidate. |
| Production Turbopack + compiled CSS | **PASS**, combined primary candidate. |
| OpenNext Worker build | **PASS**, combined primary candidate; local artifact only, no Worker/provider deployment or runtime qualification. |
| Storybook build | **PASS**, includes the new synthetic announcement story; no actual browser interaction. |
| Built-artifact release preflight | **PASS**, standalone+Worker byte scan; tracked-source scan explicitly skipped because snapshot has no .git. |
| Git staged and working whitespace checks | **PASS**. |

Initial failed attempts are retained. The first frontend check caught an ambiguous new heading query (heading and option share “Package readiness”) and a timeout in an unchanged interrupted-upload test while concurrent builds ran. The query now targets the heading by role; the upload test was not weakened or given a larger timeout, and both final combined/staged checks passed. The initial Turbopack/Worker snapshots could not resolve node_modules symlink targets outside their root. Installed dependencies were APFS-cloned into those two isolated roots and both builds passed without changing Next config, installing dependencies, relinking primary modules or expanding filesystem roots. A test-only added tracked-file CLI case was subsequently run with Node and ESLint; the final combined frontend check was repeated after it.

Full receipts/logs/source pins: codex-takeover/. Earlier log snapshots are retained; log-manifest-closeout.json identifies final copies. Tool versions: RTK1.1.0, Go1.27.3, Node24.22.1, pnpm12.11.2, Next16.4.2, OpenNext1.20.14. Fixture image ID and bounds are in fixture.json. No source dependency version was changed.

## Browser, commit and runtime boundaries

The official browser tool returned **“Local browser use is disabled in Work settings”**. G1 UI Filing smoke and G7 real screen-reader smoke remain BLOCKED_NOT_RUN. No alternate/headless browser, detector URL scan, native capture or other render bypass was attempted. A nonauthor review is prepared, not dispatched, in [the OpenCode handoff](../../implementation/handoffs/MC-OPENCODE-WAVE2-CODEX-CANDIDATE-REVIEW-20261101.md).

An ordinary `git commit` attempt for G2 was rejected before execution by automatic approval review: history mutation was not explicitly authorized for this takeover and the existing task instructions exclude commit/merge/push/deploy. This was not an executed Git failure or a newly observed Mimosa finding. No alternate execution route, hook/config change, no-verify flag, ledger edit or human-terminal workaround was used. Source remains staged for review. Explicit PO commit authorization is required before another normal attempt. Do not interpret the old prompt's commit-unit wording as resolving the current automatic-review rejection.

Existing :3000/:8081 manual runtime, :8080 IdP, database/container/QA resources and original OpenCode verify-wave namespace were not modified. The manual frontend therefore remains its previous UI build; this takeover did not silently refresh it with G7. New owned fixture `mc-wave2-codex-20261101-z9l4vtqi` was capped at768MiB/2CPU/256PIDs on loopback; random credentials stayed in0600private files. It was stopped and retained for QA, not removed; no volume or existing database deleted. Public log scan found0matches for the known fixture credential. Raw originals stay in the0700private task directory; no real legal data or credentials were exported.

## Exact next actions

1. PO explicitly authorizes normal scoped Wave2 commits if desired; retain the16-path staged patch and exclude other UI work. No push requested.
2. With the approved browser enabled, execute G1 Filing submission and G7 actual SR smoke in an isolated synthetic walkthrough. Do not mutate the retained manual/QA resources without a fresh handoff.
3. Actual OpenCode independently verifies the pinned candidate and remaining test cases; Codex intakes the return. Only evidence-backed dispositions may close findings. No P0/MC-002 DONE, cloud/cost/recovery/production or release gate closes here.

Skipped/remaining risk: real browser and assistive-technology acceptance, nonauthor verification and commit remain open; cloud/provider/production tests were outside scope. Local test/build success is not final acceptance.
