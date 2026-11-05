# INT-A stage5 intake and actual same-PG recovery without Go restart

Task MC-002-INTA-STAGE5-INTAKE; Local Codex PM/BA/ENV; priority P0; base da7be11, unified branch;2026-10-26. Actual human-returned ZCode native transport outage execution received. Requirements T11a/b/c,W11 and Codex recovery prerequisite for INT-PERS-03/04. Owner model/provider are self-reported, not independent attestation. Status STAGE5_OWNER_OUTAGE_EVIDENCE_VERIFIED / SAME_PG_RECOVERED_HEALTHY / WAITING_STAGE6_READBACK; independent QA pending, no canonical PASS or DONE.

## Evidence and result

[Owner report](inta-frontend-runtime-stage5-return.md) preserved unchanged; pasted session archived losslessly. [101 focused intake checks](../testing/inta-stage5-intake/checks.json) pass:25exact raw/export pairs,24unique payload hashes excluding manifest self-hash,42before hashes match accepted stage4,51after hashes match live ledger,9new/3modified, counter24/20trueassertions/STAGE_5_COMPLETED. Four new unique IDs21..24 match exact methods and503 ERROR connection-refused lines appended to the post-Go-restart log, with no duplicate IDs in original log. Pinned sources clean. Source/execution evidence is not independent acceptance.

Allfour envelopes carry503/HTTP_ERROR/unavailable and native /problems/unavailable with integer retryAfter1, complete/truncatedfalse. W11 separately observes503/problem+json/x-request-id echo; no Retry-After header or product retry policy inferred. App-client wire fields remain unobservable. Baseline A v1 and current checkpointA v2/INTA_A_UPDATED unchanged in ledger, but this is not a database readback/no-commit proof. T11b reconciliation awaits stage6. T11c's nested userXOutcome=OUTCOME_UNKNOWN and intentstateunknown are preserved: no retry/rePOST/newkey/list/SQL lookup or absence conclusion.

Actual Codex PG-stop FinishedAt precedes allfour dispatches; each request log records connection refused at exact15457. Owner records before/afterexited checks. Together these support stopped/unreachable PG for the observed attempts, not continuous independent lifecycle telemetry at every instant. The cumulative Next log contains dispatch evidence but no standalone immediate-before Next snapshot; exact4upstream attempts are established by the Go snapshot delta instead. Limited credential-value pattern scan had0matches; not a full confidentiality/egress attestation. No private config read or additional recordHTTP/SQL/driver call by Codex.

## Actual Codex recovery

After intake, official execution permitted one `docker start` of exact existing container04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01. Prior exited state/FinishedAt matched recorded outage; same image/labels/caps/loopback15457/mounts and volume mc002-inta-data-intamvnmoems3pd verified. Start exited0; running/healthy observed with newStartedAt. Go98134 and Next88444/listener88453 retain identical PID/start/listeners;51ledger hashes unchanged and Xunknown. No Go/Next restart, container/volume replacement, SQL/recordHTTP or data repair. Selected inspect omits Config.Env/credentials.

Exact argv/UTC/exits, container/storage/process before/after and hashes in [recovery lifecycle evidence](../testing/inta-returns/environment/pg-recovery-intamvnmoems3pd-01/). Raw retained at /tmp/mc002-inta-evidence/environment/pg-recovery-intamvnmoems3pd-01/. PostgreSQL is now RUNNING/HEALTHY; older stopped-waiting labels are superseded. This does not prove pool/record recovery; next readback must do so.

## Released next step and limits

[Stage6 cue](../implementation/handoffs/MC-002-INTA-FE-STAGE6-PROMPT.md) CUE_RELEASED / READY_NOT_DISPATCHED for actual ZCode. Execute only canonical INT-PERS-03/04 reads once after fresh preflight; compare knownA to preoutage v2 checkpoint, report discrepancies without repair, keepXunknown. Stop WAITING_CODEX_GO_STOP_CUE; no Go/PG lifecycle or stage7 yet. Codex intakes stage6 before a separate exactGo-stop cue. Updated51case checkpoint explicitly records executed subevidence while formal NOT_RUN/36required14deferred1blocked remain per existing process; independent QA and product/design/architecture/cost/release gates unchanged. BE01/F10/UX independent.

Skipped: stage6/7, recordHTTP/SQL or driver execution by Codex, independent QA/full suites, browser and push. Risk: native503 does not determine write outcomes; health is time-scoped and A recovery must be observed, X remains unresolved in this slice.
