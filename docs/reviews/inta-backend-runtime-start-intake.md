# INT-A backend runtime-start — Codex intake, 2026-10-26

Task MC-CONT-01 / MC-002-INTA-BE. Owner Local Codex PM/BA/ENV; priorityP0. Governance base16c9b5d on codex/unified-project-flow. Requirement trace INT-ENV-01/02/03, NFR001/002/003/008/009; synthetic local transport only. Backend operator actual ZCode/GLM5.3 Z.AI as reported, not independent QA.

Received actual owner runtime-start return and18 evidence files. Codex verified17 manifest payload hashes,18/18 raw/export byte-equality (wrapper filename differs only in documentary export) and a19-file credential/URI scan with0matches. Original report/evidence retained unchanged. See ../testing/continuation-20261026/runtime-intake-checks.json and runtime-readiness-recheck.json.

Owner ran migration twice: first exit1 due missing exported DSN, second exit0 with six native migrations. First failure/preconnection rationale is owner-diagnosed and supported by config-error log; Codex did not rerun migration or query DB to infer uncertain state. Go started on exact52b60a4 binary; no source/rebuild/native regression rerun.

Codex current operational recheck verified PID77632/start time/executable, numeric127.0.0.1:18086 listener, binary hash f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1, exact container04552c...bd01/volume mc002-inta-data-intamvnmoems3pd/image77f585.../task-owner-runId labels/512MiB-1CPU-128PIDs/127.0.0.1:15457; running healthy. Healthz/readyz returned200. Private parent0700/file0600; no values returned. Initial lsof used DNS resolution and initial label keys were wrong; preserved observation superseded by numeric -nP/exact-key recheck, no lifecycle/data mutation.

Disposition: OWNER_RETURN_RECEIVED / OPERATIONAL_READY_FOR_STAGE1 at recorded time; independent QA PENDING. State path and frontend runtime evidence absent. Stage1 full Antigravity prompt updated with Codex cue and immediate fresh-check requirement, READY_NOT_DISPATCHED; no Next/driver execution or acknowledgement by Codex. No Go/PG lifecycle needed now. Resources retained running, no deletion/prune.

Canonical51 cases remain NOT_RUN (36 required/14 deferred/1 external feasibility blocked),0PASS/0FAIL. ENV01/02/03 carry verified partial evidence only; full criteria and independent OpenCode acceptance remain. C01-PRODUCT/auth/isolation/Cloudflare/cost/recovery/MC002 and MC003A/STEP03B gates unchanged.

BE01/F08/F10: user explicitly asks to wait for those returns; no reassignments or adoption. Next: human sends complete updated Antigravity runtime prompt, stage1 only then return checkpoint before Go restart.

Skipped: stage1..7, runtime QA, DB queries/mutations/migration/restart/start/stop, product/source/full baseline reruns and external calls. Risk: readiness can change; recheck immediately, never replay uncertain mutations.
