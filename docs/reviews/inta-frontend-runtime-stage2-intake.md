# INT-A stage2 intake and actual same-container PostgreSQL restart

Task MC-002-INTA-STAGE2-AND-PG-RESTART; owner Local Codex PM/BA/ENV; priority P0; base767f548 on codex/unified-project-flow;2026-10-26 local. Scope INT-PERS-01 owner evidence intake and Codex's assigned INT-PERS-02 PG lifecycle substep under DEC-028/frozen INTA-1. Actual ZCode model/provider is owner-reported; no independent provider/version/billing attestation. Reviewer actual OpenCode/formally designated independent runtime QA remains pending; no self-awarded DONE or canonical PASS.

## Stage2 evidence verified

[Original owner report](inta-frontend-runtime-stage2-return.md) retained unchanged; pasted session archived losslessly. [57 checks](../testing/inta-stage2-intake/checks.json) verify9/9 raw/export pairs,8manifest payload hashes, state29->32 files (exactly3modified+3added), A full record equality to baseline/current/version1, one new app-client envelope and exact one GET200 line appended to the post-restart Go log; zero matches in old Go log. Counter15,12true assertion records, STAGE_2_COMPLETED, only stage1/stage2 markers. Wire status/headers remain null for the successful app-client call; Go200 is separate upstream correlation. Captured stage2 additions/modified state are saved immutably before later stages.

Errata, without altering raw return: pasted narrative's +07 timestamp equality is wrong;2026-10-26T01:09:19.968582+07:00 =2026-10-25T18:09:19.968582Z. Formal report's server188ms is incorrect: raw latency18825209 from slog.Duration at backend internal/adapter/inbound/httpapi/server.go:185 is18.825209ms; app-client50ms is separate. Neither erratum changes exact A equality or the request identity.

## Actual Codex PostgreSQL lifecycle

Preflight verified exact owned container04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01, name mc002-inta-pg-intamvnmoems3pd, pinned image sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873, runId/owner labels,536870912memory/1CPU/128pids,127.0.0.1:15457, volume mc002-inta-data-intamvnmoems3pd at /var/lib/postgresql and volume identity.32ledger files and Go98134/Next88444+88453 source/process/start/listener checks passed. No Config.Env/private file read, SQL or record HTTP query.

Actual window2026-10-25T18:13:34.830474Z–18:13:37.779006Z (2026-10-26 local). One `rtk proxy docker stop --time 20 <exactID>` returned0; inspect observed exited/ExitCode0 with same mounts. One `rtk proxy docker start <exactID>` returned0; healthy running observed with changed StartedAt and identical container/image/volume/labels/caps/ports. Go/Next PID/start identities and all32ledger hashes unchanged.13exact command/UTC/exit records saved. No container removal/recreation/volume deletion, Go/Next restart or record/data mutation by Codex. Docker stop/start and operational health are actual execution, not a completed data-persistence assertion.

Raw [lifecycle evidence](../testing/inta-returns/environment/pg-restart-intamvnmoems3pd-01/) has secret-safe selected inspect fields only, exact preflight and lifecycle command records, and no-self-hash inventory. Raw copies remain /tmp/mc002-inta-evidence/environment/pg-restart-intamvnmoems3pd-01/. Existing owner snapshots retained; appendable live logs do not invalidate historical snapshots. Limited high-signal credential-value scan had0matches; it is not a full confidentiality/zero-egress attestation.

## Released next action and limits

Status SAME_PG_RESTART_EXECUTED / WAITING_STAGE3_READBACK. [ZCode stage3 cue](../implementation/handoffs/MC-002-INTA-FE-STAGE3-PROMPT.md) CUE_RELEASED / READY_NOT_DISPATCHED. Human delivers; ZCode verifies current identities and stage2 state, executes only canonical stage3 --confirm-pg-restarted once, reads A through the reviewed Next/client, then stops WAITING_CODEX_STAGE4_CUE. No stage4 mutation or additional PG/Go lifecycle is authorized by that cue. INT-PERS-02 persistence remains pending until stage3 evidence and applicable independent acceptance.

[New51case checkpoint](../testing/inta-stage2-intake/canonical-case-checkpoint.json) explicitly records executed owner and Codex sub-evidence while preserving frozen formal NOT_RUN results,36required/14deferred/1blocked and pending independent QA. No product/identity-isolation/C01-PRODUCT/cloud/cost/full-recovery/architecture/design/release gate advanced; BE01/F10 separate.

Skipped: stage3/4..7, record HTTP/SQL by Codex, independent QA, baseline suites, browser/rendered UX and push. Risk: process/health evidence is time-scoped; persistence is not proven from a healthy restarted container without the next A readback.
