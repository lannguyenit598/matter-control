# MC-002 — Step 02.1 Validation

Owner: Codex DevOps/orchestrator. Continuation base2000d9435a7a3d405cb89e92ea72610f09b1f1cf; approved requirements572835a. Date2026-10-24. Acceptance states are scoped below; reviewer OpenCode is tracked separately.

| Check | Actual result | Evidence / limit |
|---|---|---|
| Host tool provenance | PASS for app signatures and notarized Gatekeeper assessments | [Commands](step-02-1/host-provenance.json). Corrects sandbox-only integrity conclusion; no reinstall/bypass |
| ZCode direct acknowledgement | FAIL exit1, missing built-in provider config | [Probe](step-02-1/agent-probes.json); no backend work executed |
| Antigravity supplied-source audit | RETURNED exit0, requested Gemini3.8FlashHigh/efforthigh | [Execution](step-02-1/antigravity-execution.json); flags/model list recorded; JSON does not attest effective model |
| Backend/FE install/build/runtime PoCs | NOT_RUN | Manual owner packets; no substitution by Codex |
| Next→Go→PG integration | NOT_RUN / BLOCKED_BY_OWNER_POC_AND_CONTRACT | Task/User and auth seams unresolved; no bypass or new feature |
| Synthetic PostgreSQL tooling restore | PASS_LOCAL_TOOLING_DRILL | [Exact command/log evidence](step-02-1/restore-evidence.json), [reproducible script](step-02-restore-drill.py), [procedure](../deployment/local-backup-restore.md) |
| Full product DB/blob/history/access restore POC-02-07 | NOT_RUN | The fixture is not the proposed MatterControl schema or W1 dataset |
| Cloudflare production / full bill | UNVERIFIED / UNKNOWN | No remote resources, account/plan or full service inventory |

## Restore evidence and acceptance

Command: `rtk proxy python3 docs/testing/step-02-restore-drill.py /tmp/mattercontrol-step021-restore-drill`, exit0. UTC14:19:57.488014→14:20:08.201634. Docker29.8.2 local Unix endpoint only; official postgres18.6-alpine resolved to digest898c60cb390d1085bc97bdd6a1ae968757421df394b071848b52b1c09c89d6a5. Source and target were distinct new task-labelled containers, network none, no ports/binds/volumes, tmpfs storage, 256MB/1CPU each. Container IDs and all exits/stdout/stderr are retained in the JSON record. Only those two containers were stopped; no volumes deleted or Docker pruning performed. Stopped containers/image remain; tmpfs data was discarded after evidence capture.

Archive5957bytes, SHA25686d75ba5c123df0bab6e8b214771dc2f0fc61fdcac053dccb638021ea4679596, retained [synthetic.dump](step-02-1/synthetic.dump). pg_dump/custom and pg_restore/list/transactional restore exit0. Corrupt COPY rejected with nonzero exit. SQL asserts100 records/100 links/sum35350 and deterministic content hash; pre-backup marker present, post-backup marker absent; sequence next101; FK/CHECK/PK invalid inserts rejected; source retains both markers. These are assert-based checks in the executed script, not inferred successful SQL exit alone.

Restore-only0.04121s; target provisioning through validated read1.16291s; whole invocation including image pull/initial source10.71300s. The tiny local recovery elapsed below8h; no representative W1 volume/operations, human detection, encryption/key retrieval or remote recovery was exercised. Backup was one manual dump with paused source writes; one known post-backup marker was omitted. No scheduled cadence exists, so RPO24h is **NOT_DEMONSTRATED**. RTO8h is met only for this tiny tooling rehearsal, not a product/production guarantee. One-db pg_dump does not cover global roles, blobs, history/access consistency or disaster recovery.

## Independent review

Actual OpenCode2.1.4 / opencode/glm-5.3-flash-free, session ses_e91b1f9a5ffe1zY7Ix4zxMwma3, exit0/159.396s, returned PASS_WITH_LIMITATIONS (0High/0Medium/3Low/2Info), document/evidence review only, no runtime replay. [Verbatim review](../reviews/step-02-1-opencode-result.md), [execution](step-02-1/opencode-execution.json). F1: raw Antigravity stdout/stderr/usage and installed help now referenced in execution record. F2: procedure now states tmpfs is lost at stop. F3: original evidence qualifications retained; script now records each readiness poll and rolls back the test row, with an additional row-count assert. Final narrow recheck returned PASS_WITH_LIMITATIONS, closing F1/F2/F3 with no new High/Medium/Low; no owner/production gate waived.


## Review-driven restore recheck

Same guarded procedure rerun after Low F3 correction, exit0: `rtk proxy python3 docs/testing/step-02-restore-drill.py /tmp/mattercontrol-step021-restore-drill-recheck`. UTC14:29:50.549049→14:29:57.844797. [All outputs](step-02-1/restore-recheck-evidence.json), [archive](step-02-1/synthetic-recheck.dump), SHA256a41ab5b6bfe919ea8a6689bc24ed14ea082c752d30f74486905130692206565d /5957bytes. Restore0.046824s, recovery-through-validated-read1.247520s, invocation7.295601s. Same100 rows/100 links/hash/sum/markers/PK/FK/CHECK tests PASS. Sequence-check row rolled back and count100 reasserted; PostgreSQL sequence values consumed by validation remain nontransactional. Every readiness poll is now logged, including expected transient failures before the confirming success. Two further new owned containers stopped; four stopped task containers across both runs, no volumes/deletions. Initial script/evidence was reviewed; current script/recheck is a separate revised execution, not retroactive replacement of history. RPO cadence/full-product/production conclusions unchanged.


Final actual reviewer: OpenCode2.1.4 / opencode/glm-5.3-flash-free, session ses_e91acdd14ffedn9CdMVHx7nsPU, exit0, outcome succeeded; exact elapsed/argv in [execution](step-02-1/opencode-recheck-execution.json). [Verbatim recheck](../reviews/step-02-1-opencode-recheck-result.md). Three Info residuals are retained: row count after negative checks is not separately reasserted (transaction abort on connection close), first review metadata is referenced rather than supplied to this narrow packet, and unsupported CPU estimates remain only in the verbatim Antigravity report. No further code change or runtime result is inferred. This closes the scoped independent evidence review, not MC-002, owner PoCs or the Architecture Approval Gate.


Supplemental final capability probe (outside independent review snapshots): [Antigravity tool denial](step-02-1/antigravity-tool-probe.json), conversation b9174f44-a511-4ab6-8f3b-da986e09b79a. A single synthetic Git-read command was auto-denied by headless command permission; CLI exit0/JSON SUCCESS is not counted as execution. No global allow-rule or bypass used. Owner runtime remains WAITING_MANUAL_DISPATCH.
