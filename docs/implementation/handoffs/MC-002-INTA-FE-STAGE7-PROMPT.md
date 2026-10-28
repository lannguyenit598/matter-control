# INT-A frontend stage7 — released T12 Go-stopped cue for ZCode

**CUE_RELEASED / READY_NOT_DISPATCHED**,2026-10-26. Human delivery assigns actual ZCode, frontend/Next/driver runtime role, to run canonical stage7 ONCE under DEC-028/frozen INTA-1. The separate Go-stop return has been intaken: Go is intentionally stopped; Next and the same PG are retained. This is native transport characterization, not independent QA or product acceptance. Existing configured permitted provider/model/quota only: no provider/settings/login switch or paid retry. Report actual identity/tool/version and source revisions; preserve others' work.

Governance root /Users/nguyenvanlan/Documents/code/pet-projects/matter-control, branch codex/unified-project-flow; preparation base a62d838791ba188838c4ff00b7b6e265ac775056. Verify current HEAD, do not reset. Read AGENTS/RTK,current workflow, MC-002-INT-A task, inta-coordination.md,frozen inta-approved-contract.md, full reviewed frontend runtime plan, stage6 return/intake, docs/reviews/inta-backend-go-stop-return.md and inta-backend-go-stop-intake.md, docs/testing/inta-go-stop-intake/checks.json + current-resource-observation-authorized.json + canonical-case-checkpoint.json. Historical health observations do not replace immediate preflight.

## Preflight without driver construction/help/status

- Verify Go98134 remains absent and no listener/replacement owns127.0.0.1:18086. No restart, stop signal, force-kill, health/ready probe or substitute process. If a listener/replacement exists or state is ambiguous, return BLOCKED_FOR_RECONCILIATION; never contact or kill an unknown process to make T12 pass.
- Backend /tmp/mc002-inta-be clean52b60a4617081c41b949f2242e1784238c170f75; binarySHA f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1. Template /tmp/mc002-inta-fe clean3e5a642479acb789eb210e73fba956f3e85082e3, harness /tmp/mc002-inta-harness clean48cc03e949d66fc47a7d304413621eb79804e6c1. No build/source/config/dependency changes.
- Next root88444/listener88453, startMonOct26 00:35:21+07,127.0.0.1:18085 remains the same running server. Same PG04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01 running healthy, StartedAt2026-10-26T00:26:58.345144717Z; same image/labels/volume mc002-inta-data-intamvnmoems3pd, loopback15457,caps512MiB/1CPU/128pids. Selected read-only inspect only; no Config.Env/private backend.env/full environment/SQL/container lifecycle. Backend-private configuration is not part of this frontend step.
- runId intamvnmoems3pd, live /tmp/mc002-inta-state-intamvnmoems3pd:56files exactly matching accepted stage6 after-manifest and Go-stop before/after manifests; counter26,22trueassertions,markersstage1..6 only,STAGE_6_COMPLETED,A baselinev1/currentv2,B unchanged,X OUTCOME_UNKNOWN/T11c intentunknown. No T12/stage7 intent/envelope/completion marker. On drift stop; no reset/replay/repair.
- NEW docs/reviews/inta-frontend-runtime-stage7-return.md, raw /tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/stage7/ and matching docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage7/ exports must be absent. Never overwrite an earlier attempt.

## Execute exactly once

Snapshot current ledger/checkpoints, Next application logs and stopped-Go stdout/stderr (immutable copies, not rewrites). From /tmp/mc002-inta-harness run only:

```sh
rtk proxy node src/driver.ts stage7 --runId=intamvnmoems3pd --state-dir=/tmp/mc002-inta-state-intamvnmoems3pd --confirm-go-stopped
```

This issues one fixed T12 app-client GET attempt for known A through the unchanged shared client. Expected native outcome: apiError,status0,codeNETWORK_ERROR,classificationunavailable,complete envelope/truncatedfalse. Status0 is a client network observation, **not an upstream HTTP503**. Actual Next dispatch status must be recorded separately; do not substitute it for Go status. Go is stopped and therefore cannot provide a new API request log for this failed connection: preserve the unchanged Go log and do not invent a successful server-side correlation or reuse a historical request ID. Correlate the one T12 envelope/intent/request ID and Next dispatch evidence; expected monotonic request sequence27 if the canonical run succeeds as planned.

Expected successful driver bookkeeping is counter27,23trueassertions and STAGE_7_COMPLETED/stage7 marker. These are expectations, not values to write manually. Capture actual stderr/exit/output/state even on failure. If outcome differs, times out, is truncated or becomes uncertain, stop with actual evidence; no retry, all/resume/legacy command, restart, alternate route or repair. No additional recordGET/POST/PATCH/list/search/SQL, no X lookup/rePOST/newkey. X remains OUTCOME_UNKNOWN permanently within this slice.

## Return and stop

Return NEW report/raw/exports above: identity/model/provider/tool version, actual governance/source heads and clean status, preflight process/container/storage metadata, exact command/cwd/start/endUTC/exit, request/envelope/intent/Next-log attribution, stopped-Go log continuity, before/after ledger hashes and every changed/new state copy, assertion count and A/B/X/checkpoint preservation. Provide a no-self-hash payload manifest, accurate payload/export counts and byte-identical copy verification. Scan evidence for credentials and all fixture markers in application logs without exposing values; distinguish declared scan patterns from actual credential contents. No private config read or env dump.

Stop **IN_REVIEW / STAGE_7_EXECUTED / WAITING_CODEX_FINAL_INTAKE** if evidenced, otherwise the precise failure. Leave Go stopped, Next and PG retained running and state/evidence intact. No cleanup, container/volume removal, process stop/restart, source edit, commit/merge/push, canonical/governance status edit, provider activity or independent review dispatch. Follow official permissions/hooks; preserve any denial and use only explicitly permitted remediation, never evasion.

Seven driver stages do not complete the36required rows or independent QA. External-owner procedures, source/privacy/isolation/correlation, teardown and conformance review remain separate. All51formal results/QA/product/design/architecture/security/cost/release gates remain unchanged; BE01/F08/F10/UX untouched; MC-003A REWORK_REQUIRED, STEP03B NOT_AUTHORIZED. Include skipped checks and remaining risks. Preparing this prompt is not dispatch or execution.
