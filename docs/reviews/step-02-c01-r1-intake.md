# MC-002-BE-C01-R1 — Corrected Return Intake

Codex PM/BA/DevOps, 2026-10-25 Asia/Ho_Chi_Minh. Governance base13efdef8e859cd9689b264596926fca9fb626e9c, branch task/MC-002-solution-architecture. Actual owner ZCode desktop/model GLM-5.3-Flash identity remains owner-reported. [Verbatim return](step-02-c01-zcode-rework-return.md); scope [R1 contract](../implementation/handoffs/MC-002-BE-C01-ZCODE-REWORK-PROMPT.md), [prior reviews and qualifications](step-02-c01-intake.md). Egress is covered by the human's explicit C01 source/test/log and correction-loop approval, not a new inferred blanket authorization.

## Source and required corrections

Backend worktree `/tmp/mattercontrol-step022-backend-c01`, task/MC-002-be-c01; clean basefd747ae11aad05bd98737bc91f6bd19894fd72e7 → head52b60a4617081c41b949f2242e1784238c170f75. Exactly3 files,+16/−2: map_error_test F1 cause-preservation subtest; docs/api F5 cancellation-before-every-classification wording; persistence.md F6 exact authorized SQLSTATE-first replacement. No production implementation/dependency/config/schema/migration/API/retry/auth change. Original source worktrees,59 protected governance inputs and19 fd747ae exports remain unchanged. No Codex backend edit/push/merge.

F1 asserts both errors.Is(mapped,context.Canceled) and errors.Is(mapped,port.ErrUnavailable). Immediate PASS is expected because production code was already correct; no artificial RED. F2 and M1 dispositions preserved; F3/F4/F7 not adopted. Native/product boundaries remain as previously reviewed. [Exact diff and checks](../testing/step-02-c01-r1-intake/checks.json).

## Owner execution and integrity checks

Owner metadata records focusedF1 exit0 17:34:32–34UTC, makecheck exit0 17:35:02–17UTC and full raceJSON exit0 17:35:24–34UTC; empty stderr. Codex parsed all1193 JSON lines:279 unique named passes including parents/subtests,0fail/0namedskip,11 packagepasses plus5 no-test-files package skips. Postgres85 and httpapi96. These are not279 independent leaf tests. The owner checks ran on the corrected working tree before commit; the log wrappers contain no tested Git tree hash. The later clean commit represents the returned edits, but literal execution on an already-created52b60a4 is not independently attested. No full-suite/DB replay by Codex or OpenCode is inferred.

All16 exported files match/tmp originals byte-for-byte. Fourteen are payloads and2 are hash lists. The original49 list has14 entries including its own stale hash (13 valid non-self payload entries), omitting42-final-state;49b has16 entries including its own stale hash (15 valid non-self entries, including42-final-state and the current49 list). Self-reference mismatches are **not** silently accepted as valid manifest checks. Codex preserves both originals and supplies [verified export inventory](../testing/step-02-c01-r1-intake/verified-export-manifest.json),16 recomputed hashes excluding the new inventory itself. This resolves the inventory representation without rewriting owner bytes or rerunning tests. Owner report's varying14/15/16file counts are superseded only by this exact accounting.

F8: all7 disclosed synthetic body values are absent in both retained application log samples; Codex repeated that sample check independently. Exact fixture-password absence is owner-asserted; Codex did not read a secret value/Config.Env. The first owner scan was invalid due to an unset shell variable; the corrected scan reports0. Its timestamp contains literal shell text rather than an expanded timestamp; no exact scan UTC is inferred. Current common-secret-pattern checks find no unredacted secret-shaped DSN/token. Sample evidence is not a general logging/privacy guarantee.

Host read-only checks confirm all4 exact fixtures stopped/exit0 and no listeners15457/15458/18095/18096. Older container start/finish timestamps can be compared with prior preserved inventories; this is current metadata, not a whole-host process audit or proof of every historical action. No DB query/start/stop/volume deletion by Codex. [Host state](../testing/step-02-c01-r1-intake/host-state.json).

## Independent review boundary

Actual OpenCode corrected-head review follows these exact snapshots. The earlier source/evidence/architecture reviews remain the basis for unchanged production code. No additional A1/A2/A3/A9/A14 smoke replay is needed solely for reassurance; no HTTP57014/42P01 or new runtime claim is added. C01-NATIVE acceptance is PENDING until actual reviewer return. C01-PRODUCT/auth/idempotency/UoW/Workers/log policy/product retry conventions remain OPEN/NOT_RUN. R01/R02 CLOSED, MC-002 OPEN, Architecture Approval Gate NOT_PASSED, Step03 NOT_STARTED.

Skipped: full DB/runtime replay, production/integration work. Risk: current corrected-head acceptance is scoped to native template behavior and the retained evidence limits, not full product conformance.

## Actual independent corrected-head acceptance

OpenCode2.1.4 / opencode/glm-5.3-flash-free, sessionses_e90ff024dffeuJ1Kmcnp6qicY9, exit0/60.596s: PASS_WITH_LIMITATIONS; accepts C01-NATIVE at52b60a4, F1/F5/F6/E-03/F8 CLOSED with the qualifications above. No runtime/hash replay by reviewer. No further owner correction/reassurance rerun required. [Verbatim review](step-02-c01-r1-opencode-review.md), [current closure](step-02-c01-native-closure.md). Initial pending labels above describe intake time; current state NATIVE_PASS / PRODUCT_OPEN.
