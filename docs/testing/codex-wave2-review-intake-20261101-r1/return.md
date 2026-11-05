# Wave2 independent review intake — Local Codex

- Task: MC-ZCODE-P1-FIX-WAVE-2-20261101; owner actual Local Codex; priority P1.
- Candidate: `codex/unified-project-flow` at `978d8fc694a47e9beee528076bcf1af9473997e3`, base `64b9e0315e210953d7a7eaeacc0643b269a14ad9`.
- Input: [OpenCode review](../opencode-wave2-codex-review-20261101-r1/return.md), its inputs/checks/findings and outputs manifest. All four output pins and all declared input pins match current bytes. Base→commit diff matches the 38,271-byte candidate patch (`60f018eb…8a6fd01`).
- Evidence: [intake checks](checks.json). This is intake of an independent return, not a new reviewer test run. No source, reviewer output, historical pinned task/evidence, Git index or runtime changed.

## Disposition

| Unit | Finding | Accepted current status | Boundary |
| --- | --- | --- | --- |
| G1 | OV-F1-01 | FIXED_PENDING_VERIFY / SOURCE_VERIFIED_BROWSER_BLOCKED | Schema/UI tests and backend contract reviewed; actual Filing submission browser journey NOT_RUN. |
| G2 | OV-R8-01 | CLOSED_VERIFIED | Both real content readers, unit/integration and independent artifact/tracked synthetic CLI plants verified. Clean tracked scan does not certify untracked files or every credential transform. |
| G3 | OV-F1-02 | CLOSED_VERIFIED | SIGNATURE replay purpose preserved; 12 replay tests reported passing. |
| G4 | OV-F1-03 | CLOSED_VERIFIED | Fresh PG rollback test; downgrade conservatively maps SIGNATURE to PACKAGE and preserves relations, not the original purpose label. |
| G5 | OV-R12-01 | CLOSED_VERIFIED | Multi-stale/empty retention probe verified with fake tools; cloud backup scheduling/provider reliability remain unverified. |
| G6 | OV-F1-04 | CLOSED_VERIFIED | Combined refusal, intentional StageResponse D-9 re-submission semantics, guard copy and migration coverage reviewed. StageResponse was retained intentionally, not newly invented. |
| G7 | F8/P-09 | FIXED_PENDING_VERIFY / SOURCE_VERIFIED_SR_BLOCKED | Persistent announcements/callers and DOM tests reviewed; actual screen-reader speech smoke NOT_RUN. |

Five of seven Wave2 units have scoped independent closure; two retain real execution gates. Z-F-01/02 parent business/browser acceptance is not closed by child source fixes. No overall MC-002/P0/release approval follows.

## Gate and provenance qualifications

1. Reviewer identity/model are taken from the returned session; no provider/version invocation was repeated in this intake.
2. Commit `978d8fc` was executed by actual Local Codex after the PO explicitly approved it. The review attributes execution to the operator; this is an execution-actor erratum only. Candidate patch identity is independently correct. Historical rejected commit attempts were superseded by this later authorization and successful commit; old evidence stays immutable.
3. The reviewer reports independent Vitest 858 PASS / 12 SKIP, agents check, product formatting, SQLC, Go format/tidy/lint and focused G1..G7 checks. The pasted activity also contains a failed full `pnpm check`; no cause/output is retained in the review packet. Therefore intake does not certify a successful complete independent `pnpm check`, typecheck/lint/build, durable-BFF rerun or full PG/race gate. Earlier author receipts remain author evidence; they are not promoted to independent runs.
4. The review preserves current dirty UI work. Candidate Set B is the commit; frontend tests reported against Set A include unstaged UI. Closure is limited to the reviewed fixes and declared source pins, not blanket approval of the dirty UI.
5. The pinned original task/author report are preserved as review inputs. This intake and the current register/dashboard supersede their stale WAITING_COMMIT_AUTHORIZATION and nonauthor-review-pending statements.

## Next actions / remaining scope

- Enable the approved browser through normal Work settings, then assign an independent G1 synthetic Filing journey (PACKAGE + SIGNATURE accepted, OUTCOME pending) and G7 screen-reader smoke (EN/VI; repeated success, denied/error and honest UNKNOWN; no focus steal/duplicate announcement). Do not infer either from DOM tests.
- Obtain the actual failure output or a successful full-check receipt before claiming independent complete frontend gate PASS. Do not alter exclusions or source merely to hide the unreported failure.
- Verify which build is running before manual testing. Existing :3000/:8081 and IdP :8080 were not refreshed by Wave2 or this intake.
- Keep deployment/provider/real-IdP/human usability gates separate. No new external dispatch, commit, push or deploy is included in this intake.

Proposed task status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**. Source implementation is complete; five scoped independent closures accepted, G1/G7 remain pending. Skipped: new tests, runtime/browser/SR, provider calls and Git mutations. Risk: unobserved actual UI/speech behavior and incomplete aggregate independent frontend gate evidence.
