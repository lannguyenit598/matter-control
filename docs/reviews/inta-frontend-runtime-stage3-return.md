# MC-002-INTA-FE — Stage 3 Return (INT-PERS-02 after same-PG restart, runId intamvnmoems3pd)

**Owner & role:** actual ZCode (frontend/Next/driver owner for this released cue; interactive session, no subagent). **Model/provider:** `account:zai-start-plan/GLM-5.3` via Z.AI, configured route unchanged; owner-reported, no independent provider attestation. **Authority:** DEC-028 / frozen INTA-1, stage3 cue released after [stage2 intake + actual Codex same-container PG restart](inta-frontend-runtime-stage2-intake.md). Owner execution, not independent QA.

**Status returned: IN_REVIEW / STAGE_3_EXECUTED / WAITING_CODEX_STAGE4_CUE.** Exactly one stage3 execution; stopped immediately at the stage4 barrier. No stage4/T9/PATCH, no future confirmation flags, no Go/PG/Next lifecycle, no cleanup.

## Preconditions reverified immediately before execution (all PASS)

| Dimension | Verified value |
|---|---|
| Output paths | return file, raw `…/frontend/runtime-intamvnmoems3pd/stage3/`, governance export `stage3/` all absent before creation |
| Go | PID **98134**, lstart `Mon Oct 26 00:54:29 2026 (+07)`, argv `/tmp/mc002-inta-be/bin/userapi`, sole `127.0.0.1:18086` listener; binary SHA256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1` unchanged |
| Next | root PID **88444** (start `Mon Oct 26 00:35:21 2026 (+07)`), listener PID **88453** on `127.0.0.1:18085` — untouched |
| Sources | harness clean @ `48cc03e949d66fc47a7d304413621eb79804e6c1`; template @ `3e5a642479acb789eb210e73fba956f3e85082e3`; backend worktree clean @ `52b60a4617081c41b949f2242e1784238c170f75`; no rebuild/config/dependency change |
| PostgreSQL (read-only identity/health only) | exact ID `04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01`, name `mc002-inta-pg-intamvnmoems3pd`, image `sha256:77f585114c32…1873`, volume `mc002-inta-data-intamvnmoems3pd`, loopback `127.0.0.1:15457->5432`, `Up (healthy)` — consistent with Codex's recorded 18:13:34–18:13:37Z same-container stop/start; no Config.Env/full inspect/SQL; emptiness NOT claimed |
| State ledger (read directly, no driver help/status) | **32 files**; `stage1.completed`+`stage2.completed` markers only; **zero** stage3/INT-PERS-02 strings anywhere; counters `{"intamvnmoems3pd":15}`; **12 assertion records all `pass:true`**; nested `STAGE_2_COMPLETED` (B `01a17422-e7ff-7daf-a9a1-a0994eaed691`, X null); A baseline == current (version 1) |
| Live Go log | `go-restart-01/20-restart.stdout.log` (the current post-Go-restart log for PID 98134) at 455 B, SHA256 `ce7f9c48…` — identical to my stage2 after-snapshot, snapshotted before execution |

## Execution (exactly once)

`rtk proxy node src/driver.ts stage3 --runId=intamvnmoems3pd --state-dir=/tmp/mc002-inta-state-intamvnmoems3pd --confirm-pg-restarted` from `/tmp/mc002-inta-harness` — started **2026-10-25T18:20:29Z**, finished **18:20:29Z**, **exit 0**, stderr 0 bytes. Driver stdout: `Executing Stage 3 (INT-PERS-02 after PG restart)` → `[LIFECYCLE_BARRIER] Stage 3 completed successfully. User A verified unchanged after PostgreSQL restart.` No duplicate record HTTP/SQL lookup by me; the single upstream GET is the driver's own readback.

## Observed result

- **Envelope** `INT-PERS-02.json`: requestId **`mc-int-intamvnmoems3pd-INT-PERS-02-16`**, mode `app-client`, `GET /api/v1/users/{id}`, started `2026-10-25T18:20:29.866Z`, **latencyMs 79** (raw driver unit, milliseconds), `actualNextVersion 16.4.2`, harness `48cc03e…`, outcome `value`/classification `success`; **wire block null with `not-observable-via-client`** — wire success status/headers remain unobservable for this app-client call; `truncated:false`.
- **A readback == baseline, complete record**: identical id `01a17422-e796-7465-a325-1c87c74d8393`, email, `INTA_A_INITIAL`, **`version: 1`**, `created_at`/`updated_at` equal to the microsecond (`2026-10-25T17:36:46.998289Z`). Checkpoint A files byte-unchanged (no A mutation before T9).
- **State delta (32 before-hashes vs 32 after)**: exactly 3 modified (`counters.json` 15→**16**, `assertions` 12→**13** with `INT-PERS-02 pass:true`, nested `state.json` → **`STAGE_3_COMPLETED`**, B identity and `userXOutcome:null` preserved, `updatedAtUTC 18:20:29.954Z`) and 3 new (`INT-PERS-02.json` envelope, `INT-PERS-02.status`, `stage3.completed`). Nothing else changed.
- **Go-log correlation against the post-Go-restart log only**: requestId `…-INT-PERS-02-16` appears **exactly once** in `go-restart-01/20-restart.stdout.log` — `GET /api/v1/users/01a17422-e796…` → **200** at log time `2026-10-26T01:20:29.941367+07:00` = **2026-10-25T18:20:29.941367Z** (UTC conversion explicit), server latency field raw value **57853333** (slog.Duration nanoseconds ≈ 57.853333 ms; app-client 79 ms is the separate driver-side measure). **Zero** matches in the original pre-Go-restart `20-server.stdout.log`. Log grew 455 → 747 B (exactly the one API line); before (SHA `ce7f9c48…`) and after (SHA `e731a45d…`) snapshots retained.

## Evidence, hashes, privacy

Raw: `/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/stage3/` (9 files: driver stdout/stderr/meta, state before/after manifests, Go-restart log before/after snapshots, privacy scan, `30-hashes.txt` — 8 hashed artifacts, **manifest excludes itself**). Governance exports: `docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage3/` — **all 9 raw/export pairs `cmp`-verified byte-identical**. Privacy scan (18:20:52Z): credential-pattern matches across all stage3 files **0**; synthetic fixture-marker matches in the two Go-log snapshots **0**. Synthetic bodies appear only inside the controlled state/evidence paths; no backend.env read, no environment dump, no credential values anywhere.

## Resource disposition and boundaries

**Left running unchanged:** Go PID 98134, Next root 88444 / listener 88453, PostgreSQL container `04552c273cb6` healthy with its volume. State ledger preserved with stage3's own writes only. No source edits/rebuild/migration, no Docker access beyond the read-only identity/health check above, no stage4/mutation, no cleanup. New files only: this return and the two `stage3/` evidence sets (untracked for Codex intake). No governance status/ledger/canonical-result edits; BE01/F10 untouched; no provider call, deployment, merge or STEP03B.

**Owner assertion vs independent acceptance:** everything above is owner-side execution evidence; INT-PERS-02 formal acceptance, all 51 canonical results and independent runtime QA (OpenCode/formally designated) remain **PENDING/NOT_RUN**. Product/design/architecture/security/cost/release gates unchanged.

**Skipped:** stage4 and any T9/PATCH mutation, future confirmation flags, PG/Go/Next lifecycle, record probes beyond the single driver readback, independent-QA claims. **Remaining risk:** live processes/appendable logs can drift after the 18:20:29–18:20:52Z window; persistence is evidenced by this readback only, not a general durability proof; X remains OUTCOME_UNKNOWN if ever encountered later.

*Next: Codex intakes this return, then releases the stage4 cue (T9/W9/T10 mutations) separately.*
