# MC-002-INTA-ENV — new local fixture return and manual runtime boundary

Codex actual ENV owner,2026-10-25 Asia/Ho_Chi_Minh. Authority DEC-028/frozen INTA-1; [accepted actual ZCode source review](inta-frontend-r4-source-closure.md). Requirement trace NFR-001/002/003/008/009 as local boundary plus INT-ENV-01; no product features. Governance base cefcc3b, task/MC-002-INT-A, branch task/MC-002-solution-architecture.

**Executed: new PG fixture VERIFIED_READY / owner acceptance IN_REVIEW.** Not MC-002 DONE; no full canonical case PASS awarded. [Actual command/UTC/exits/stdout/stderr and resource checks](../testing/inta-returns/environment/env-intamvnmoems3pd/environment.json), [Codex checks](../testing/inta-returns/environment/env-intamvnmoems3pd/checks.json), [driver-generated runId](../testing/inta-environment-preflight/driver-runid.json). Source helper generateRunId was invoked by Codex ENV operator without constructing/running driver/stages or HTTP; fresh runId **intamvnmoems3pd**. Previous proposed inta20261025a is not used.

| Asset | Verified identity / disposition |
|---|---|
| Container | `mc002-inta-pg-intamvnmoems3pd`; ID `04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01`; label task MC-002-INTA-ENV / owner Codex / runId intamvnmoems3pd |
| Image | postgres18-alpine pinned locally available digest77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873; --pull=never |
| Storage | NEW named volume `mc002-inta-data-intamvnmoems3pd` mounted /var/lib/postgresql; no anonymous/inherited/tmpfs storage |
| Caps / publish |512MiB /1CPU /128PIDs; only127.0.0.1:15457→5432 |
| Readiness | actual container running/healthy; host published port TCP connects |
| Database | current_database=mc002_inta; current_user=mc002_inta; public base tables=0 before handoff |
| Auth connection | actual in-container TCP password connection to exact DB/user verified; this and host-port connect are separate observations |
| Private handoff | local `/tmp/mc002-inta-private/intamvnmoems3pd/backend.env`; directory0700/file0600; values never printed or exported |
| Backend | existing clean52b60a4 binary SHA f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1 retained; migration/start NOT_RUN |
| Frontend | clean48cc03e companion/template3e5a642 preserved; actual Next/stages NOT_RUN in this environment |

Created only the new named container/volume after fresh name/port/source checks. No existing container/volume stopped/removed/reused, no prune, no pull, no paid/cloud/production action. Health/empty/schema checks are Codex execution evidence, not independent QA. No Go binary or Next launched and no native data mutations/migration/tests run by Codex. Exact private password checked against controlled exported evidence,0matches; scan counts/provenance without values. Full inspect/env dumps prohibited and not used; inspection fields allowlisted.

Resource disposition: **new container left running healthy and volume retained for imminent manual owner handoff**. No automatic shutdown/retry/reminder or deletion scheduled. Codex owns later stop/start of this exact container; backend/Next owners must not control Docker. Recheck actual health/identity before migration; port/empty observations are timestamp-scoped. No source/code/lock changes.

## Next manual tasks and dependency order

1. [ZCode full migrate/start prompt](../implementation/handoffs/MC-002-INTA-BE-RUNTIME-START-PROMPT.md): READY / NOT_DISPATCHED. Actual ZCode loads the private file without emitting it, verifies52b60a4/binary, migrates new DB once, starts Go127.0.0.1:18086, returns exact process/readiness/version/log identity and waits. No rebuild, full-suite replay, API mutations or autonomous lifecycle stage advancement.
2. [Antigravity full staged-run prompt](../implementation/handoffs/MC-002-INTA-FE-RUNTIME-PROMPT.md): READY / NOT_DISPATCHED / WAITING_BE_READY. Keep runId intamvnmoems3pd; fresh shared harness/driver state path `/tmp/mc002-inta-state-intamvnmoems3pd`. Do not create state directories/counters using that ID before actual stage1 readiness. Full driver CLI stage1..7 only; one external-owner action and confirmation at each barrier. No standalone live-guards observer after Go owns18086.
3. Actual OpenCode independent runtime QA remains mandatory/pending. Its provider route remains quota-limited; do not claim actual replay/source review by OpenCode or silently substitute ZCode for runtime QA. Existing QA manual task/procedures still apply to later evidence/replay in separately verified fresh run if needed.

All51canonical acceptance results remain NOT_RUN,0PASS/0FAIL;36required/14deferred/1blocked. INT-ENV-01 now has actual executed sub-evidence; independent complete profile acceptance not yet awarded. Later rows not executed. C01-PRODUCT/auth/authorization/Workspace-Matter isolation/Cloudflare/$0/full recovery/architecture/MC-002 gates OPEN. No Step03 action/MC-003A change/merge.

Skipped: Go migration/start, Next/stage execution,36case assertions, independent runtime QA, complete real-run log marker/secret scans and final owned teardown (resources deliberately retained for continuation). Remaining risk: compatible source and healthy empty PG still do not prove end-to-end integration; manual owner returns and real runtime evidence are required.
