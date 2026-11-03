# RLF rework intake and commit verification

Task: MC-CODEX-RLF-VERIFY-COMMIT-20261103. Reviewer: actual Local Codex, not the author of the
ZCode RLF implementation/rework. Base: `7bf198c103476f490ebbdf58b1bd563d0bba8a61`, branch
`codex/unified-project-flow`. The previous ZCode review remains author-adjacent historical
evidence; its original verdict is not rewritten.

## Scoped conclusion

The seven rework items are corrected in source and the local verification gates pass. No new
commit-blocking defect was identified in this scoped intake. This permits a local code commit;
it is not complete business/browser acceptance or production approval.

| Finding | Verified remedy |
|---|---|
| RLF-REV-04-02 | Saved View DELETE is granted in the operator SQL and both Go grant maps; the positive mc_runtime probe executes in the fresh PostgreSQL test run. |
| RLF-REV-04-01 | Create/rename duplicate checks occur inside the locked Matter transaction; wire regressions cover 409 responses. |
| RLF-REV-05-01 | Workspace-locked playbook name check returns a typed refusal; shared memory/PostgreSQL contracts cover duplicate creation. |
| RLF-REV-06-01 | GetIntake propagates ListIntakeRecords errors instead of converting them to absence. The error branch was inspected; no dedicated injected-failure test was added or claimed. |
| RLF-REV-07-01 | Guidance title pre-check and the final 0016 uniqueness constraint agree; shared contracts reject duplicates on both stores. |
| RLF-REV-A11Y-01 | Save/delete/publish labels use EN/VI LocalizedText and repeated Saved View deletion buttons carry the view name in their accessible labels. Actual assistive-technology verification remains NOT_RUN. |
| RLF-REV-02-01 | Failed proof reads pass null; the component explicitly reports unavailable criteria and its regression passes. |

## Executed checks

- `rtk proxy make check`: PASS with fresh PostgreSQL 18.6 fixture, SQL generation comparison,
  formatting, module tidy diff, zero lint issues and race-tested packages. See `backend-pg.log`
  and its receipt. The fixture was stopped and retained; existing containers were not started,
  deleted or migrated by this task. Docker Desktop had to be started for the fixture.
- `rtk proxy pnpm check`: PASS, 920 tests passed / 12 skipped, agent configuration valid.
- `rtk proxy pnpm build:webpack`: PASS, including compiled CSS guard.
- `rtk proxy pnpm build-storybook`: PASS; upstream module-directive warnings remain warnings.
- Initial changed-file pins showed no concurrent source drift before documentation updates.
  `candidate-manifest.json` pins the selected final source/document candidate. Staged bytes
  are checked against it before the normal commit.
- Credential-pattern inspection found a credential-shaped fixture URL in the original new
  ZCode command log. That original is preserved unmodified and left untracked; only
  `zcode-commands.redacted.log` is included here. This is a bounded pattern check, not a full
  security certification. Build log exports normalize ANSI escapes and trailing whitespace; originals stay private.
  Private fixture credentials, environment files and raw logs stay
  outside Git.

The API route summary and shared contract revision 14 now record the shipped local extensions;
the workboard contract pointer is refreshed with its previous pointer retained in the note.
No business policy or implementation source was changed during this review.

## Remaining limits

The retained manual-testing copy had already applied an earlier draft of 0016 before ZCode
added guidance-title uniqueness. Its version number alone does not establish schema equality.
This task preserves it and verifies final source using a new fixture; a future manual-runtime
refresh must reconcile that schema explicitly. The snapshot frontend/backend, if still running,
also do not automatically pick up this commit.

No browser/E2E, real ZITADEL journey, screen-reader/human trial, load, new-feature restore or
cloud test was performed. Earlier author reports remain attributed to their authors. Research,
pre-flight and unrelated verification files remain outside this commit. Proposed overall
status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS; no release, MC-002 DONE or pre-flight implementation.
