# INT-A frontend stage1 — Codex intake

Task MC-002-INTA-FE-STAGE1-INTAKE; actual actor Local Codex; priority P0. Base `68b5586`; branch `codex/unified-project-flow`; 2026-10-26 Asia/Ho_Chi_Minh. Owner runtime return: actual human-relayed ZCode, configured GLM-5.3/Z.AI self-report. Status IN_REVIEW / STAGE_1_EXECUTED / WAITING_GO_RESTART. Independent OpenCode QA PENDING; this is scoped owner-evidence intake, not an independent runtime QA verdict.

## Verified evidence

[Owner report](inta-frontend-runtime-stage1-return.md) is preserved unchanged. The user-pasted session narrative is archived losslessly in [intake evidence](../testing/inta-stage1-intake/). Codex checked 42/42 raw/export byte pairs, all 41 manifest payload hashes, pinned clean harness48cc03e/template3e5a642/backend52b60a4 and unchanged binary SHA256. No new driver invocation, HTTP request, SQL query, source/config change or lifecycle operation occurred during intake.

[77 focused checks](../testing/inta-stage1-intake/checks.json) passed: eleven case assertions, fourteen unique complete envelopes, monotonic request IDs/counter14, exact A baseline/current/client readbacks after rejected writes, separate B wire creation, negative outcomes and observable wire headers, fourteen one-to-one Go API-log correlations. Captured and live ledgers agree; only stage1 is marked completed. Application-client success wire status/headers remain unobservable; correlated Go metadata is separate upstream evidence, not a client-visible header assertion.

Read-only process inspection initially hit sandbox `ps` denial. The official approval route permitted the exact read-only check at 2026-10-25T17:44:19Z: Go77632 (start Oct25 16:49:50 local), Next root88444/listener88453 (start Oct26 00:35:21 local), sole known listeners127.0.0.1:18086/18085. No environment dump or new health probe. These are time-scoped observations; recheck exact identities before any later lifecycle cue.

## Count and checkpoint errata

- The report/pasted summary says fourteen assertions in places. The persisted assertion array has **11 records, all true**; the envelopes contain **14 substeps**. Do not label fourteen independent assertion records.
- The report says ten local logical IDs in places. The actual eleven IDs are T1,T2,W1,W2,T3,T4,T5,T8,W3,T6-W,T7-W; all exist in the canonical matrix. They have owner execution sub-evidence, not eleven independently accepted matrix rows.
- The top-level initializer checkpoint retains checkpointBId=null/INITIALIZED. The active nested checkpoint state has STAGE_1_COMPLETED and B's correct ID; A baseline/current match. The reviewed driver reads the nested state. No state repair is indicated by the initializer alone.
- Earlier transient narrative counts of 29/44 files are not the final inventory: final verified exports=42, manifest payloads=41. Raw report and artifacts are not rewritten to hide these corrections.

## Launch variance and review boundary

The first launch defaulted to Turbopack, compiled unsuccessfully and was stopped before stage1 per owner report. The retained failure log corroborates the missing-package compile error. The owner attributes it to the designed cross-root dependency layout; Codex has not reproduced the failure or independently proven the entire causal diagnosis.

The actual stage1 runtime used `--webpack`; the identical flag is present in accepted R4 launch evidence. No source/config/dependency edits or extra case attempts were introduced by Codex. Record INT-ENV-07 as WEBPACK_RUNTIME_SUBEVIDENCE_VARIANCE_RECORDED_FULL_CRITERION_PENDING: cross-root/loopback/version evidence does not satisfy the remaining dynamic/cache/product-glob requirements or constitute bundler/production approval. There is no basis to replay stage1 merely to remove this launch variance; independent QA must disposition the exact runtime used.

## Privacy and scope

Codex scanned 42 exported artifacts plus the report for high-signal private-key/credential-URI/Bearer/API-key value patterns: zero matches. Observed synthetic names/emails are absent from seven application-log files. These checks are limited pattern/marker checks, not a confidentiality, zero-egress or billing attestation. No backend.env was read. Literal pattern names in the generated scan report are descriptive metadata; its earlier zero-count statement is not a self-inclusive final-file scan guarantee.

Requirement linkage: T1/T2/W1/W2/T3/T4/T5/T8/W3/T6-W/T7-W, INT-COR-01 subset, INT-ENV-04/07 subsets, NFR-001/002/003/008/009; INT-PERS-01 is the next dependency, not executed. All 51 original canonical IDs, 36 required/14 deferred/1 blocked and NOT_RUN formal result convention are retained in [the new checkpoint](../testing/inta-stage1-intake/canonical-case-checkpoint.json), with explicit executed sub-evidence for the eleven IDs. Original ledgers/snapshots remain historical evidence.

## Next controlled action

Deliver [the separate Go restart cue](../implementation/handoffs/MC-002-INTA-GO-RESTART-PROMPT.md) to actual ZCode. Restart only the exact owned Go process against the same PostgreSQL/config/binary, preserve Next and stage1 state, return the new backend identity/readiness and logs. This is a prospective manual handoff READY_NOT_DISPATCHED; no restart or stage2 is claimed. Codex intakes that return before a separate frontend stage2 cue. PostgreSQL remains Codex-owned; no Go/PG combined barrier or future confirmation flag is permitted.

Independent reviewer: actual OpenCode/formally designated independent QA still pending. No DONE, product auth/isolation, C01-PRODUCT, architecture/design/cost/recovery/production acceptance or STEP03B authorization. BE01 and F08/F10 follow their own latest intake; this stage1 receipt changes none of those outcomes.

Skipped: driver/case replay, HTTP/SQL queries, Go/Next/PG lifecycle, stages2..7, baseline suites, rendered UX, external reviewer invocation and provider/auth changes. Remaining risk: owner assertions and limited log scans do not replace complete independent QA; retained live processes and raw logs can change after the recorded observation.
