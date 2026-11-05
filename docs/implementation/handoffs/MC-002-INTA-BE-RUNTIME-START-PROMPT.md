# MC-002-INTA-BE-RUNTIME-START — full manual ZCode prompt

You are actual ZCode, backend runtime owner. This task follows your accepted frontend R4 source review, but it is BACKEND EXECUTION, not independent QA. Authority DEC-028/INTA-1; local synthetic only; priority P0, trace INT-ENV-02/03 and NFR-001/002/003/008/009. Acknowledge actual tool/model/provider, cwd/branch/base/head, binary hash, exact new ENV and boundaries before work. READY/NOT_DISPATCHED until actual human delivery/acknowledgement.

Read governance /Users/nguyenvanlan/Documents/code/pet-projects/matter-control/AGENTS.md and /Users/nguyenvanlan/.codex/RTK.md. Inputs relative to governance: docs/implementation/inta-approved-contract.md IN FULL; docs/implementation/tasks/MC-002-INT-A.md; docs/implementation/inta-coordination.md; docs/reviews/inta-frontend-r4-source-closure.md; docs/reviews/inta-environment-return.md; docs/reviews/inta-backend-intake.md; docs/testing/integration-acceptance-matrix.md; docs/testing/step-02-4-runtime-classification.md; docs/testing/inta-returns/environment/env-intamvnmoems3pd/environment.json and checks.json. Read backend instructions/docs/api.md/current CLI/config rules. Prefix shell commands with rtk.

Reuse EXISTING /tmp/mc002-inta-be, branch codex/mc-002-inta-be clean52b60a4617081c41b949f2242e1784238c170f75. Existing bin/userapi42202722bytes SHA256 f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1. Verify before action; stop on dirty/unexpected hash/source, no reset/recreate/rebuild. Native command is userapi migrate, then userapi without arguments for server. No source/test/docs/config/dependency changes or baseline rerun. You are not alone; preserve others' work/MC-003A and all prior reports/evidence.

ENV verified by Codex:
runId=intamvnmoems3pd
container=mc002-inta-pg-intamvnmoems3pd
containerId=04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01
volume=mc002-inta-data-intamvnmoems3pd
DB/user=mc002_inta
publish=127.0.0.1:15457; caps512MiB/1CPU/128PIDs
Private configuration file: /tmp/mc002-inta-private/intamvnmoems3pd/backend.env
This file is mode0600 in directory0700 and contains DATABASE_URL plus approved native config. Load via local shell/process without printing/returning its contents, no cat/read output to model/chat, no set-x/env dump, no DSN/password in argv or logs. No copy into source/Git/screenshots/review packets. If inaccessible, report only path/error, never request credential in chat. Do not invent/reuse a DSN/default/retained database. Never start/stop/create Docker resources; Codex owns them. Read-only health/identity may be rechecked without Config.Env/full inspect; if not healthy/exact, stop to Codex. No pg query to existing databases.

Native config in private file: STORAGE=postgres, HTTP_ADDR=127.0.0.1:18086, EVENTS_SINK=none, API_DOCS_ENABLED=false, TRUSTED_PROXIES empty, MIGRATE_ON_START=false, READINESS_CHECK_DB=true, LOG_LEVEL=info, REQUEST_TIMEOUT=10s, DB_STATEMENT_TIMEOUT=5s, DB_MAX_CONNS=5, DB_MIN_CONNS=0, SHUTDOWN_DELAY=0s, OTEL_EXPORTER_OTLP_ENDPOINT empty. Prevent inherited conflicting runtime settings/product env; never dump values. Verify18086free, do not kill unknown processes.

Execute now only:
1. Native migrate ONCE against this verified new DB; exact argv/UTC/exit and stdout/stderr files. On uncertain exit/state, stop, never blind replay or use another DB. No alternate migration/schema tools.
2. Start exact binary with approved private env bound127.0.0.1:18086, source-stamp52b60a4. Capture only owned process identity/PID/start time/argv, initial version/readiness/probe observations and raw stdout/stderr separately. No API record POST/PATCH/list/SQL probing or relay/Kafka/docs feature activation. Probes are operational gates, not product cases.
3. Return BACKEND_RUNNING_READY and WAITING_STAGE_1_COORDINATION. Keep exact Go process alive for Antigravity stage1; do not restart/stop it now or execute later stages autonomously. Any failure -> bounded exact-owned cleanup and report; no production patch. Explicitly record whether process remains running or stopped.

Later only after Codex gives checkpoint cue: Go restart occurs between frontendstage1 andstage2; no PG restart by you. Keep Go alive throughout Codex PG outage/recovery; Go stop forT12 only betweenstage6 andstage7 after confirmed recovery readbacks. No retry/re-POST/new-key/list/SQL lookup, X alwaysOUTCOME_UNKNOWN. This prompt does not execute those later lifecycle changes yet.

NEW raw evidence /tmp/mc002-inta-evidence/backend/runtime-intamvnmoems3pd/; NEW reviewed exports docs/testing/inta-returns/backend/runtime-intamvnmoems3pd/; NEW docs/reviews/inta-backend-runtime-start-return.md. Preserve original preparation return/logs. Record agent/tool/model, base/head/tree, binary hash, exact commands/UTC/exits/metadata-only startup probes/ownedPID identity, output hash manifest/no self-cycle, redaction check counts with secret values never shown, resource disposition/skips. If supported, start wrapper files live only in own evidence dir; no secret literals in wrapper/source. No global login/settings/permission repair.

Propose IN_REVIEW / BACKEND_RUNNING_READY / WAITING_STAGE_1, neverDONE or self-awarded runtime PASS. OpenCode independent36case QA pending; you do not self-review backend runtime. All51canonical results remain unawarded pending full evidence/independent acceptance. No product implementation/auth/isolation/C01-PRODUCT/Cloudflare/cost/full recovery/paid/deploy/merge/MC-003A work. Stop at this return; deliver it to the human for Codex intake.
