# MC-OPENCODE-WAVE2-CODEX-CANDIDATE-REVIEW-20261101

Status: **PREPARED_NOT_DISPATCHED**. Reviewer: actual OpenCode/non-author, not a renamed Codex subagent. Do not change login/provider/model or send new payloads automatically. This handoff is ready for the operator's existing approved OpenCode session.

## Task and exact candidate

Independently verify Wave2 G1..G7 after Local Codex takeover. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`. Expected base HEAD `64b9e0315e210953d7a7eaeacc0643b269a14ad9`; commit was rejected by automatic approval review for lack of explicit takeover commit authority. No later commit is implied. Recheck actual HEAD before analysis.

Read:

1. docs/implementation/tasks/MC-ZCODE-P1-FIX-WAVE-2-20261101.md.
2. docs/testing/mc-p1-fix-wave-2-20261101-r1/return.md and findings-update.md.
3. The codex-takeover source manifests, staged-candidate.json, candidate-source.patch, command receipts and log manifests. Verify declared hashes/bytes before consumption.
4. Original OpenCode leg-2 return, R8/R12/F1 findings and OpenDesign guard copy, read-only. Do not modify the original OpenCode verify-wave namespace or its receipts.

Distinguish two tested source sets: (A) current combined primary candidate with previously authorized unstaged Pane/list/UI edits, and (B) HEAD plus the16-path staged Wave2-only patch, reconstructed in a separate directory. The latter excludes unrelated UI work; the layout patch contains only the announcer import/wrapper. Check the actual patch against declared hashes. Do not review HEAD alone and claim it includes G2/G3/G7. If commits occurred after this handoff, explicitly re-pin and compare the patch; no silent extension of a verdict.

## Review coverage

- G1: SIGNATURE criterion contracts/checklist/purpose options and actual proof panel rows. Reproduce schema/UI negatives on pre-G1 code and verify the corrected code. Backend HTTP test must permit submission only after accepted PACKAGE+SIGNATURE, with independent verifier and OUTCOME still pending. Author browser smoke is BLOCKED, not passed.
- G2: inspect both real-main content readers. Run unit/real-main tests and actual CLI synthetic plants for normally named PEM/sentinel, env-shaped files and a git-tracked synthetic set. Require nonzero finding output, no TypeError and no planted values echoed. Distinguish artifact-only scan from tracked-file scan. Inspect final built artifacts if independently rebuilding them is in scope.
- G3: SIGNATURE must survive purposeOf replay mapping; legacy missing purpose stays PACKAGE. Check the real diff and regression, not just a title saying “replay”.
- G4: migration0011 Up/Down with a SIGNATURE row on a fresh owned disposable PG. Validate documented lossy downgrade purpose mapping to PACKAGE while row/relations are retained; do not call this restoration of original purpose or run Down on any retained manual/QA DB.
- G5: fake pg_dump/pg_restore probe,4old+1new/RETAIN2 yields2archives+2sidecars/pruned3; initially empty yields1archive/pruned0. Real job/provider reliability is not established by a fake-tool test.
- G6: combined package/signature refusal, localized friendly copy and StageResponse as cycle re-submission per current D-9 state semantics. Existing guards must not weaken.
- G7: persistent empty shell polite/atomic region, actual callers in IntentForm/ConfirmActionButton/InlineEdit, identical repeated messages create updates, fixed EN/VI copy, UNKNOWN never called Saved, no raw record/server text relayed, no focus steal, local fallback outside shell, no duplicate dialog/local result announcement. Include pending-attempt recovery/CAS safety. Other feature-local live regions remain in use; do not infer every custom flow uses the new channel.

## Safe execution and outputs

Use Semble first, RTK-prefixed commands and current component rules. Reviewer source changes are not assigned. Local synthetic tests/builds may run in a new isolated copy using installed dependencies, no install/relink of primary dependencies. No :3000/:8080/:8081 mutation, existing DB/volume cleanup, provider/IdP calls, secrets read, Git stage/commit/push, hooks or evidence rewrites.

For PG tests create a new independently owned fixture, or use the retained Wave2 fixture only after an explicit fresh resource handoff. The fixture was stopped; do not read its private credential file from this public packet. Never reuse the manual database. Record whether PG suites ran or skipped.

Official browser is currently disabled in Work settings. Do not use headless/alternate browser, screenshots through another service, detector URL rendering or other bypass. When normal browser authority becomes available, G1 Filing submission through the UI and G7 actual assistive-technology smoke are mandatory separate receipts. Until then, return source/test verdicts with BLOCKED/NOT_RUN browser/SR cells, not a complete acceptance PASS.

New output paths only, after absence checks:

- docs/testing/opencode-wave2-codex-review-20261101-r1/return.md
- same directory: inputs.json, checks.json, findings.json and outputs-manifest.json (no self-reference)

If the directory already exists, resume only your own proven session; otherwise choose a unique suffix and record it. Pin source at both ends. Report actual identity/tool/model/version, base/head/patch identity, drift, per-G findings and verification, tests/exit codes, author receipts merely cited, unresolved browser/commit gates, risks and skipped work. No automatic CLOSED_VERIFIED/MC-002 DONE/release/deploy. Return the package to Codex for intake.
