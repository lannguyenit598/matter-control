# MC-002-INTA-FE — Stage 4 Return (T9/W9/T10 mutations & stale update, runId intamvnmoems3pd)

**Owner & role:** actual ZCode (frontend/Next/driver owner for this released cue; interactive session, no subagent). **Model/provider:** `account:zai-start-plan/GLM-5.3` via Z.AI, configured route unchanged; owner-reported, no independent provider attestation. **Authority:** DEC-028 / frozen INTA-1, stage4 cue released after [stage3 intake](inta-frontend-runtime-stage3-intake.md). Synthetic local native transport characterization — NOT product CAS/idempotency/security semantics and not independent QA.

**Status returned: IN_REVIEW / STAGE_4_EXECUTED / WAITING_CODEX_PG_STOP.** Exactly one stage4 execution (allowed sequence only); stopped immediately at the PG-stop barrier. No stage5/`--confirm-pg-stopped`, no PG/Go/Next lifecycle, no extra probes, no cleanup.

## Preconditions reverified immediately before execution (all PASS)

| Dimension | Verified value |
|---|---|
| Output paths | return file, raw `…/frontend/runtime-intamvnmoems3pd/stage4/`, governance export `stage4/` all absent before creation |
| Go | PID **98134**, lstart `Mon Oct 26 00:54:29 2026 (+07)`, argv `/tmp/mc002-inta-be/bin/userapi`, sole `127.0.0.1:18086` listener; binary SHA256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1` unchanged |
| Next | root PID **88444** (start `Mon Oct 26 00:35:21 2026 (+07)`), listener PID **88453** on `127.0.0.1:18085` — untouched |
| Sources | harness clean @ `48cc03e949d66fc47a7d304413621eb79804e6c1`; template @ `3e5a642479acb789eb210e73fba956f3e85082e3`; backend worktree clean @ `52b60a4617081c41b949f2242e1784238c170f75`; no rebuild/config/dependency change |
| PostgreSQL (read-only) | exact ID `04552c273cb6…bd01`, volume `mc002-inta-data-intamvnmoems3pd`, loopback `15457`, `Up (healthy)` and **RUNNING** (no restart/outage before stage4); no Config.Env/private file/SQL |
| State ledger (read directly, no driver help/status) | **35 files**, hash-identical to the stage3 recorded after-manifest (`00-state-before.sha256` == stage3 `11-state-after.sha256`, all 35 entries); markers `stage1..3` only; **zero** stage4/T9/W9/T10 strings; counter `16`; **13 assertion records all pass**; nested `STAGE_3_COMPLETED` (B `01a17422-e7ff-7daf-a9a1-a0994eaed691`, X null); A baseline == current (version 1) |
| Live Go log | `go-restart-01/20-restart.stdout.log` at 747 B, SHA `e731a45d…` — identical to stage3 after-snapshot; snapshotted before execution |

## Execution (exactly once, allowed sequence only)

`rtk proxy node src/driver.ts stage4 --runId=intamvnmoems3pd --state-dir=/tmp/mc002-inta-state-intamvnmoems3pd` from `/tmp/mc002-inta-harness` — started **2026-10-25T18:25:40Z**, finished **18:25:40Z**, **exit 0**, stderr 0 bytes. No confirm flag (stage4 needs none). No extra PATCH/POST/record GET/SQL was issued by me beyond the driver's own four substeps.

## Observed result — three case submissions, four substeps (counter 16 → 20)

- **T9 (requestId `mc-int-intamvnmoems3pd-T9-17`, app-client PATCH, If-Match "1", `INTA_A_UPDATED`)**: outcome `value`/success — A advanced to **version 2**, `name INTA_A_UPDATED`, `updated_at 2026-10-25T18:25:40.422511Z` (actual observed value), `created_at` unchanged; **client-success status/headers not inferred** (null in envelope). Driver latencyMs 36.
- **W9 (requestId `…-W9-18`, wire GET A)**: wire **status 200** with **ETag `"2"`** in the wire envelope, exact echo of A's v2 record for this request only; `truncated:false`; latencyMs 3.
- **T10 PATCH (requestId `…-T10-19`, app-client stale If-Match "1", `INTA_A_STALE`)**: outcome `apiError` — **status 412**, code `HTTP_ERROR`, native problem detail `If-Match does not match the current version of the resource` (type `about:blank`; native behavior only, **not** generalized to product API semantics); latencyMs 5.
- **T10 readback (requestId `…-T10-20`, driver-owned GET A)**: `value`/success — A **still version 2 / `INTA_A_UPDATED`**, full exact record equal to the T9 value including `updated_at` to the microsecond; no stale mutation applied; latencyMs 3.
- **Checkpoints**: `checkpointA.baseline.json` **byte-unchanged (version 1, INTA_A_INITIAL)** — original baseline preserved separately; `checkpointA.current.json` = version 2/`INTA_A_UPDATED`; ids identical. Nested state → **`STAGE_4_COMPLETED`** (B identity, X null preserved). **Assertions 13 → 16**, T9/W9/T10 all `pass:true`.
- **State delta (35 → 43 files)**: 5 modified (`counters.json` 16→**20**, `assertions`, nested `state.json`, `checkpointA.current.json`, and the top-level initializer `checkpoints/intamvnmoems3pd.json` which embeds the current-A snapshot) and 8 new (envelopes `T9.json`/`W9.json`/`T10.json` — T10 file carries both substeps — plus 3 substep statuses and `stage4.completed`). Baseline checkpoint untouched.
- **Go-log correlation (post-Go-restart log only, each request ID exactly once, zero matches in the original pre-restart log):**
  - `T9-17` → PATCH `/api/v1/users/01a17422-e796…` **200** at `2026-10-26T01:25:40.430127+07:00` = **18:25:40.430127Z**, latency raw `14807208` ns ≈ 14.807208 ms;
  - `W9-18` → GET **200** at `01:25:40.472644+07:00` = **18:25:40.472644Z**, `703584` ns ≈ 0.703584 ms;
  - `T10-19` → PATCH **412** (WARN) at `01:25:40.514281+07:00` = **18:25:40.514281Z**, `1839125` ns ≈ 1.839125 ms;
  - `T10-20` → GET **200** at `01:25:40.519076+07:00` = **18:25:40.519076Z**, `439042` ns ≈ 0.439042 ms.
  Log grew 747 → 1,880 B (exactly the four lines); before (`e731a45d…`) and after (`5c7261d8…`) snapshots retained. All envelope bodies `truncated:false` (≤16 KiB) — complete-equality assertions stand.

## Evidence, hashes, privacy

Raw: `/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/stage4/` (9 files; `30-hashes.txt` covers 8 artifacts, **excludes itself**). Governance exports: `docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage4/` — **all 9 raw/export pairs `cmp`-verified byte-identical**. Privacy scan (18:26:13Z): credential-pattern matches across all stage4 files **0**; synthetic fixture-marker matches (emails + INTA_A_INITIAL/UPDATED/STALE) in the two Go-log snapshots **0** — synthetic response values exist only in the controlled state/evidence paths, never in application logs. No backend.env read, no environment dump.

## Resource disposition and boundaries

**Left running unchanged:** Go PID 98134, Next root 88444 / listener 88453, PostgreSQL container `04552c273cb6` healthy **and still RUNNING** (the outage belongs to Codex's separate barrier). State ledger preserved with stage4's own writes only; changed/new live state captured immutably in the manifests. No source edits/rebuild/migration, no stage5/6/7 or future confirmation flags, no lifecycle/cleanup. New files only: this return and the two `stage4/` evidence sets (untracked for Codex intake). No governance/canonical-result edits; BE01/F10 untouched; no dependency installation, deployment, merge or paid activity.

**Owner assertion vs independent acceptance:** this is owner-side native transport characterization; T9/W9/T10 formal acceptance, all 51 canonical results and independent runtime QA (OpenCode/formally designated) remain **PENDING/NOT_RUN**; product CAS/idempotency/security semantics are NOT claimed from native 412/ETag behavior. Product/design/architecture/security/cost/release/STEP03B gates unchanged. **Remaining risk:** live processes/appendable logs can drift after the 18:25:40–18:26:13Z window; X remains OUTCOME_UNKNOWN if ever encountered later.

*Next: Codex intakes this return (checkpoints/version2), then separately stops the exact same PG container before releasing the stage5 outage cue.*
