# INT-A backend Go-stop intake and stage7 release

Task MC-002-INTA-GO-STOP-INTAKE; Local Codex PM/BA/orchestration; P0;2026-10-26. Coordination repository /Users/nguyenvanlan/Documents/code/pet-projects/matter-control, branch codex/unified-project-flow, base/head a62d838791ba188838c4ff00b7b6e265ac775056 at intake. Requirements: frozen INTA-1 graceful Go-stop prerequisite and T12 transport characterization. Scope: owner-evidence intake, selected read-only resource verification and next cue; no source/runtime/lifecycle mutation.

Disposition: **GO_STOP_OWNER_EVIDENCE_VERIFIED_WITH_LIMITATIONS / STAGE7_CUE_RELEASED / READY_NOT_DISPATCHED**. Independent runtime QA remains PENDING. Reviewer: actual OpenCode for the complete selected INT-A evidence, not invoked here.

## Evidence verified

[Original owner return](inta-backend-go-stop-return.md) retained unchanged. [92 focused checks](../testing/inta-go-stop-intake/checks.json) PASS:10 raw/export byte-identical pairs;9 manifest payload hashes excluding the manifest;56 before/after ledger entries equal the accepted stage6 after-manifest and current live ledger. Counter26,22 true assertions,STAGE_6_COMPLETED,A baselinev1/currentv2,B and X OUTCOME_UNKNOWN remain unchanged; no T12/stage7 artifact. All three source checkouts are clean at their pinned backend52b60a4/template3e5a642/harness48cc03e revisions; binary SHA256 f3bcdc2f…a54c1 matches.

Go stdout-before equals stage6 stdout-after byte-for-byte. The append-only snapshot grows4438->4636 bytes with exactly two INFO lines at2026-10-26T00:39:27.856771Z and00:39:27.857439Z: `shutting down, draining` delay0s, then `userapi stopped gracefully`. Both stderr snapshots are empty. The owner stop record reports one `kill -TERM 98134` at00:39:27Z, signal-command exit0, subsequent PID/listener absence and unchanged Next/PG. These command observations are owner-authored records, not an independent full shell transcript. No direct Go process wait status was captured: **Go exit code remains NOT_OBSERVED**, not an awarded exit0. Graceful log messages plus observed disappearance support the scoped stop prerequisite without fabricating waitpid evidence or an independently timed0.1s shutdown.

## Fresh selected resource observation

At00:42:53Z the default sandbox denied ps execution and Docker socket access; these failures are retained in [initial resource observation](../testing/inta-go-stop-intake/current-resource-observation.json). lsof showed no18086 listener and Next88453 listening on127.0.0.1:18085. Codex then used the official exec_command require_escalated route for the same read-only metadata checks; it was permitted. [Authorized observation](../testing/inta-go-stop-intake/current-resource-observation-authorized.json),00:43:17Z: Go98134 absent; Next88444/88453 retain00:35:21 start times; exact PG04552c…bd01 running/healthy with unchanged StartedAt00:26:58.345144717Z, named volume, loopback15457 and512MiB/1CPU/128pid caps. No secret environment, Config.Env, SQL, HTTP request or lifecycle action was used. These observations are time-scoped, not a continuous uptime/process trace; the receiving owner must preflight again.

Limited credential-literal scanning excludes the privacy report's own pattern declarations. Application-log fixture marker checks pass. This is not a full secret-value or egress audit. No new hook denial was reported by the owner; no permission controls were changed. Earlier stage6 route-telemetry caveats remain historical and are not silently cleared.

## Released next step and acceptance boundary

[Stage7 prompt](../implementation/handoffs/MC-002-INTA-FE-STAGE7-PROMPT.md) is **CUE_RELEASED / READY_NOT_DISPATCHED** for actual ZCode frontend/Next/driver ownership. Human delivers it; one canonical T12 attempt only after fresh Go-stopped preflight. Expected native app-client status0/NETWORK_ERROR and unavailable classification; report actual failure if different, no retry or restart. Preserve Go stopped and Next/PG running, then return WAITING_CODEX_FINAL_INTAKE. No automatic cleanup or external-QA dispatch.

The [checkpoint](../testing/inta-go-stop-intake/canonical-case-checkpoint.json) retains stage6 subevidence with the Go-stop prerequisite separately recorded. All51 formal results stayNOT_RUN and independent verdictsPENDING under existing process;36required/14deferred/1blocked unchanged. Stage7 is not yet executed; even successful completion of seven driver stages will leave external-owner procedures, source/privacy/isolation/correlation, owned teardown and conformance/independent review outstanding. No product API/auth/CAS/idempotency/recovery/production claim follows. MC-003A REWORK_REQUIRED and STEP03B NOT_AUTHORIZED; BE01/F10/UX work preserved.

Outputs: this intake, stage7 handoff, new inta-go-stop-intake checks/inventory/resource observations/checkpoint and appended INT-A coordination status. No commit made; existing unrelated work preserved.

Skipped: stage7, request/SQL probes, lifecycle, full suites, independent QA and commit. Risk: live resources can drift; Go wait exit status and full raw command telemetry remain unavailable.
