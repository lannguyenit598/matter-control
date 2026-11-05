# MC-002-INTA-FE — Stage 2 Return (INT-PERS-01 after Go restart, runId intamvnmoems3pd)

**Owner & role:** actual ZCode (frontend/Next/driver owner for this released cue; interactive session, no subagent). **Model/provider:** `account:zai-start-plan/GLM-5.3` via Z.AI, configured route unchanged; no provider/model/settings/auth change. **Authority:** DEC-028 / frozen INTA-1, stage2 cue released per [route-clarification intake](inta-go-restart-route-clarification-intake.md) (`INTA-GOV-RESTART-01` EXPLAINED_TOOL_WRITE_ROUTING / NO_REMAINING_STAGE2_HOLD). Owner execution, not independent QA. Governance at unified branch, verified latest HEAD before work.

**Status returned: IN_REVIEW / STAGE_2_EXECUTED / WAITING_PG_RESTART.** Exactly one stage2 execution. Stopped at the PostgreSQL barrier: no stage3, no `--confirm-pg-restarted`, no Go/PG/Next lifecycle, no cleanup. Codex owns the same-container PostgreSQL restart after intake of this return.

## Preconditions reverified immediately before execution (all PASS)

| Dimension | Verified value |
|---|---|
| Output paths | return file, raw `…/frontend/runtime-intamvnmoems3pd/stage2/`, governance export `stage2/` all absent before creation |
| Go | PID **98134**, lstart `Mon Oct 26 00:54:29 2026 (+07)`, argv `/tmp/mc002-inta-be/bin/userapi`, **sole** `127.0.0.1:18086` listener; binary SHA256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1` (unchanged; worktree not touched) |
| Next | root PID **88444** (start `Mon Oct 26 00:35:21 2026 (+07)`), listener PID **88453** on `127.0.0.1:18085` — untouched |
| Sources | harness `/tmp/mc002-inta-harness` clean @ `48cc03e949d66fc47a7d304413621eb79804e6c1`; template `/tmp/mc002-inta-fe` clean @ `3e5a642479acb789eb210e73fba956f3e85082e3`; no edits/rebuild/migration |
| State ledger (read directly, no driver help/status) | `stages/` contained **only** `stage1.completed`; no stage2 marker/INT-PERS-01 string anywhere; counters `{"intamvnmoems3pd":14}`; 11 assertion records all `pass:true`; 14 substep envelopes; A baseline == A current (id `01a17422-e796-7465-a325-1c87c74d8393`, INTA_A_INITIAL, **version 1**); nested state `STAGE_1_COMPLETED`, `checkpointBId 01a17422-e7ff-7daf-a9a1-a0994eaed691`, `userXOutcome: null` |
| Go-restart evidence | `go-restart-01/` evidence present from my prior restart return; post-restart log snapshotted **before** stage2 (SHA256 `2d44c9ff…`, 163 B) for correlation; all 29 state files hashed before execution |

## Execution (exactly once)

`rtk proxy node src/driver.ts stage2 --runId=intamvnmoems3pd --state-dir=/tmp/mc002-inta-state-intamvnmoems3pd --confirm-go-restarted` from `/tmp/mc002-inta-harness` — started **2026-10-25T18:09:19Z**, finished **18:09:19Z**, **exit 0**, stderr empty. Driver stdout: `Executing Stage 2 (INT-PERS-01 after Go restart)` → `[LIFECYCLE_BARRIER] Stage 2 completed successfully. User A verified unchanged after Go restart alone.` → next-barrier notice for the Codex same-container PostgreSQL restart. No duplicate record HTTP/SQL probe was made by me; the single upstream GET is the driver's own readback.

## Observed result

- **Envelope** `envelopes/intamvnmoems3pd/INT-PERS-01.json`: appId/requestId **`mc-int-intamvnmoems3pd-INT-PERS-01-15`**, mode `app-client`, `GET /api/v1/users/{id}`, started `18:09:19.929Z`, latency 50 ms, `actualNextVersion 16.4.2`, `harnessRevision 48cc03e…`, outcome `value`/classification `success`; **wire block null with `not-observable-via-client`** (client/wire observability distinction preserved); `truncated:false`.
- **A readback == baseline, full record**: identical `id`, `email`, name `INTA_A_INITIAL`, **`version: 1`**, and `created_at`/`updated_at` equal to the microsecond (`2026-10-25T17:36:46.998289Z`). No A mutation: the checkpoint A files are byte-unchanged by stage2 (before/after hash diff).
- **State delta (all 29 before-hashes vs after)**: exactly 3 modified (`counters.json` 14→**15**, `assertions` 11→**12** with `INT-PERS-01 pass:true`, nested `state.json` → **`STAGE_2_COMPLETED`**, B identity and `userXOutcome:null` preserved, `updatedAtUTC 18:09:19.989Z`) and 3 new (`INT-PERS-01.json` envelope, `INT-PERS-01.status`, `stage2.completed`). Nothing else changed.
- **Go-log correlation against the POST-restart log only** (`go-restart-01/20-restart.stdout.log`): requestId `…-INT-PERS-01-15` appears **exactly once** — `GET /api/v1/users/01a17422-e796…` → **200** at `2026-10-26T01:09:19.968582+07:00` (= 18:09:19.968Z, consistent with the envelope), latency 188 ms server-side. **Zero** matches in the pre-restart `20-server.stdout.log`. Post-restart log grew 163 → 455 B (exactly the one API line); before/after snapshots retained.

## Evidence, hashes, privacy

Raw: `/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/stage2/` (9 files: driver stdout/stderr/meta, state before/after manifests, Go-restart log before/after snapshots, privacy scan, `30-hashes.txt` manifest — 8 hashed artifacts, **manifest excludes itself**). Governance exports: `docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage2/` — **all 9 raw/export pairs `cmp`-verified byte-identical**. Privacy scan (18:10:31Z): credential-pattern matches across all stage2 files **0**; synthetic fixture-marker matches in the two Go-log snapshots **0**. No backend.env read, no env dump, no secrets anywhere in the packet.

## Resource disposition and boundaries

**Left running:** Go PID 98134 (sole 18086 listener), Next root 88444 / listener 88453, PostgreSQL container `04552c273cb6` healthy with its volume — all untouched. State ledger preserved with stage2's own writes only. No source edits, rebuild, migration, Docker/private-config access, stage3/future flags, cleanup/teardown. New files only: this return and the two `stage2/` evidence sets (untracked for Codex intake). No governance ledger/status or canonical-result edits; BE01/F10 untouched; no paid activity or STEP03B.

**Skipped:** stage3 and `--confirm-pg-restarted`, PG/Go/Next lifecycle, user-record probes beyond the single driver readback, independent-QA claims. **Remaining risk:** live processes/appendable logs can drift after the 18:09–18:10Z observation window; app-client success status/headers remain unobservable by design (wire evidence belongs to W-cases); independent OpenCode/formally designated QA and all 51 canonical results remain PENDING/NOT_RUN.

*Next: Codex intakes this return, then owns the same-container PostgreSQL stop/start (INT-PERS-02 barrier) before any separately cued stage3.*
