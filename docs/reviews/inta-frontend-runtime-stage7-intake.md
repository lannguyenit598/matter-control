# INT-A stage7 final driver intake

Task MC-002-INTA-STAGE7-INTAKE; Local Codex PM/BA/orchestration; P0;2026-10-26. Coordination branch codex/unified-project-flow, base/head a62d838791ba188838c4ff00b7b6e265ac775056 at intake. Requirement T12 and frozen INTA-1 end-of-driver evidence. Scope: evidence verification, correlation assembly and closeout-readiness handoff; no source/lifecycle mutation or external dispatch. Owner ZCode GLM-5.3/Z.AI identity is self-reported, not independently attested.

Disposition: **ALL_SEVEN_OWNER_DRIVER_STAGES_EXECUTED / STAGE7_EVIDENCE_VERIFIED_WITH_LIMITATIONS / WAITING_EXTERNAL_PROCEDURE_CLOSEOUT**. IN_REVIEW; no independent-QA acceptance or DONE.

## Verified result

[Original owner return](inta-frontend-runtime-stage7-return.md) preserved unchanged. [156 focused checks](../testing/inta-stage7-intake/checks.json) PASS:19 raw/export byte-identical pairs,18 manifest payload hashes excluding itself. Stage7 before56 hashes equal accepted stage6 and Go-stop manifests; after59 files match live ledger exactly,3 new/3 modified/no removals. All copied state artifacts match the manifest. Sources remain clean at backend52b60a4/template3e5a642/harness48cc03e, binary f3bcdc2f…a54c1 unchanged.

The single T12 envelope mc-int-intamvnmoems3pd-T12-27 records app-client GET, apiError,status0,NETWORK_ERROR,unavailable,truncatedfalse; no observable wire headers/status. Status0 is a client network failure, not a Go HTTP503 or the Next dispatch status. Counter27;23 true assertions;STAGE_7_COMPLETED; A baselinev1/currentv2 checkpoints byte-unchanged,B preserved,X OUTCOME_UNKNOWN. Previous22 assertion entries are exactly preserved.

[Full request correlation](../testing/inta-stage7-intake/request-correlation.json):23 logical endpoint envelope files contain27 unique request IDs, sequence1..27 without gaps/reuse. Initial immutable pre-restart Go snapshot contributes14 unique request rows; stopped-Go snapshot contributes12 more. Each of attempts1..26 has exactly one matching Go row and method. T12 has none, as expected for a refused connection to a stopped server; do not invent a Go correlation. This is evidence assembly, not formal INT-COR-01 acceptance or proof of unobserved transport behavior.

## Retained errata and evidence limits

- Owner narrative says T2 timestamp refreshed again. Actual stage7 assertion prefix equals stage6's22 records exactly; only T12 was appended. Record this documentary erratum without rewriting owner evidence.
- The19-file owner packet includes the Next BEFORE log but no immutable Next AFTER log. Codex captured [Next log at intake](../testing/inta-stage7-intake/next-stdout-observed.log), with [source/hash/time provenance](../testing/inta-stage7-intake/log-observations.json). It is append-only1828->1899 bytes with exactly one POST /harness/case200 line. This corroborates one dispatch, but capture is later than the owner's stage7 window. It is not retroactively labeled an owner-window snapshot, and the Next access line does not carry the T12 request ID.
- Stopped-Go stdout-before equals accepted Go-stop after and current observed stdout,4636 bytes; stderr remains0. No new Go request log exists. New intake snapshots are additional Codex evidence, not changes to the original19 exports.
- The first verifier pass used the backend-start snapshot, which predates all stage1 requests, for whole-run correlation. Those14 missing matches were verifier input-selection failures. Corrected input is the immutable go-restart-01/00-pre-stop/server-stdout.log containing stage1 traffic; all156 checks then PASS. Initial checks retained, no owner artifact/runtime rewritten or replayed.
- Limited credential-literal and fixture-marker scans pass with scan-report pattern declarations excluded. This is not a complete actual-secret-value or egress audit; final INT-PRIV-01 remains open for scoped assembly/reviewer disposition. No private env/config was read.

## Current resource observation

[Selected read-only metadata](../testing/inta-stage7-intake/current-resource-observation.json),2026-10-26T00:52:36Z, via official permitted exec_command escalation: Go98134 absent and18086 has no listener; Next88444/88453 retain00:35:21 start and listener127.0.0.1:18085; exact PG04552c…bd01 running healthy, unchanged image/StartedAt00:26:58.345144717Z/namedvolume/loopback15457/caps. No Config.Env/credentials/SQL/HTTP/lifecycle read or mutation. This is time-scoped; no current-health guarantee after capture. Go wait exit status remains NOT_OBSERVED from the separate stop intake.

## Remaining closeout and next handoff

[13-procedure readiness table](../testing/inta-stage7-intake/remaining-procedures.md) maps existing evidence and gaps, without reopening approved scope or re-running seven stages. [ZCode closeout-readiness prompt](../implementation/handoffs/MC-002-INTA-CLOSEOUT-READINESS-PROMPT.md) is CUE_RELEASED / READY_NOT_DISPATCHED: read-only existing-source/evidence assembly for remaining frontend/backend proof; no new tests/build/guard requests or lifecycle. This identifies exact residual runtime gaps before planning a bounded completion/teardown cue. Historical R4 live guards/source checks are retained as historical evidence, not automatically treated as final-run coverage of every condition.

Codex separately assembles ENV/privacy/conformance evidence and retains PG ownership. Next graceful stop, PG stop and final zero-listener teardown evidence remain separate owner actions; no cleanup is performed here. No new OpenCode payload is sent or implied authorized. Independent QA must assess all36required rows and deviations before formal acceptance; Claude only for material architecture variance under frozen INTA-1. All51formal NOT_RUN/36required14deferred1blocked and independent verdictsPENDING are retained in the [checkpoint](../testing/inta-stage7-intake/canonical-case-checkpoint.json). MC-003A REWORK_REQUIRED;STEP03B NOT_AUTHORIZED; BE01/F10/UX work preserved.

Skipped: stage/request replay, SQL/private config, new tests/builds, lifecycle/teardown, independent/provider dispatch and commit. Risk: external-procedure evidence remains partial, live logs/resources may drift, and seven executed stages do not establish complete acceptance.
