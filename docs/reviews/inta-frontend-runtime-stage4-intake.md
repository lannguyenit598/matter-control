# INT-A stage4 intake and actual PostgreSQL outage barrier

Task MC-002-INTA-STAGE4-INTAKE; owner Local Codex PM/BA/ENV; priority P0; base4285321 on unified branch;2026-10-26 local. Actual human-returned ZCode runtime result received; two pasted user messages are the same execution report, not two runs. [Original owner report](inta-frontend-runtime-stage4-return.md) preserved unchanged. Scope T9/W9/T10 and assigned Codex PG-stop substep for T11; actual independent QA remains pending.

## Verified stage4 evidence

[72 checks](../testing/inta-stage4-intake/checks.json) pass:9raw/export pairs,8payload hashes, full stage3-before-state hash chain,35->42live files (5modified+7new), counter20/16trueassertions and STAGE_4_COMPLETED only. Baseline A version1/INTA_A_INITIAL is immutable. T9value/W9value/T10readback/current checkpoint agree on the complete A version2/INTA_A_UPDATED record and actual updated_at; original created_at preserved. W9 separately observes200/ETag2/requestID echo. T10 native412/HTTP_ERROR then equal-version2 readback supports scoped stale-rejection behavior, not product CAS/idempotency/security acceptance.

Exactly4envelopes/unique IDs17..20 correlate one-to-one with four new post-Go-restart log lines PATCH200,GET200,PATCH412,GET200; zero same IDs in pre-restart log. App-client success wire status/headers remain null; W9 headers belong only to its own request. All retained envelopes complete/truncatedfalse, source identities52b60a4/3e5a642/48cc03e remain clean. Changed/new ledger files captured immutably before outage; historical log snapshots retained.

Erratum: owner prose says43after/8new, but actual manifest/live tree contain42after/7new. Three envelopes+three intents+one marker=7new, not8. No missing eighthfile or rerun is inferred. Raw report unchanged. Model/provider/version remain owner reports; export integrity is directly checked. Limited credential-value scan on9exports/report had0matches; no private config read, full privacy/zero-egress guarantee or extra record probe.

## Actual Codex PG stop

After intake, normal official execution permitted exact-container preflight and ONE stop. Raw evidence /tmp/mc002-inta-evidence/environment/pg-outage-intamvnmoems3pd-01/; [reviewed export](../testing/inta-returns/environment/pg-outage-intamvnmoems3pd-01/) includes all commandUTC/exits and safe selected inspect fields. Same ID04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01/name mc002-inta-pg-intamvnmoems3pd, volume mc002-inta-data-intamvnmoems3pd,image/labels/limits/ports validated before/after. `docker stop --time20 <exactID>` exited0; inspect directly observed exited/ExitCode0. No start/remove/recreate,volume deletion,SQL or record HTTP by Codex. PostgreSQL is intentionally STOPPED for stage5, not healthy-running. Go98134/Next88444+88453/start times/listeners and42ledger hashes unchanged. Lifecycle timestamps are in checks.json/lifecycle.json; this is actual execution, not only a prepared plan.

Status EXACT_PG_STOPPED / WAITING_STAGE5_OUTAGE_OBSERVATION. PGstop itself does not prove503/no-commit; Go stays alive and current A checkpoint isversion2. Do not recover/start PostgreSQL before the outage observations and actual stage5 intake unless reconciliation of a failure requires an explicitly recorded recovery action.

## Released next action and gates

Deliver [ZCode stage5 cue](../implementation/handoffs/MC-002-INTA-FE-STAGE5-PROMPT.md): T11a/b/c/W11 exactly once while exactPG remains stopped and Go lives; preserve X as OUTCOME_UNKNOWN, never retry/list/SQL lookup. Stop WAITING_CODEX_PG_RECOVERY. Stage6/read-only recovery requires Codex's subsequent samePGstart without Go restart; no future flags now. [51case checkpoint](../testing/inta-stage4-intake/canonical-case-checkpoint.json) preserves formal NOT_RUN/36required14deferred1blocked with actual executed subevidence explicit. Independent QA/product/design/architecture/security/cost/release gates unchanged. BE01/F10 and UX work remain separate.

Skipped: stage5..7, record/driver execution by Codex, independent QA, full suites, rendered UX and push. Risks: PostgreSQL intentionally remains stopped; resource identities must be rechecked before stage5. Native transport evidence is not approved product behavior or full recovery proof.
