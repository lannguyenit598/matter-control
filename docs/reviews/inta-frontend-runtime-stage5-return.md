# MC-002-INTA-FE — Stage 5 Return (T11a/T11b/T11c/W11 outage cases, runId intamvnmoems3pd)

**Owner & role:** actual ZCode (frontend/Next/driver runtime owner under the released Codex stage5 cue; interactive session, no subagent). **Model/provider:** `account:zai-start-plan/GLM-5.3` via Z.AI, configured route unchanged; owner-reported, no independent provider attestation. **Authority:** DEC-028 / frozen INTA-1; stage4 intake received and Codex exact-PG-stop verified before this cue. Local native transport outage characterization — NOT product recovery/no-commit semantics and not independent QA.

**Status returned: IN_REVIEW / STAGE_5_EXECUTED / WAITING_CODEX_PG_RECOVERY.** Exactly one stage5 execution (allowed sequence only, `--confirm-pg-stopped` from the released cue); stopped immediately at the PG-recovery barrier. No PG start, no Go/Next restart, no stage6/7 or pre-set future flags, no repair of A, no resolution of X.

## Preconditions reverified immediately before execution (all PASS, 2026-10-26T00:20:49–00:21:35Z)

| Dimension | Verified value |
|---|---|
| Output paths | return file, raw `…/runtime-intamvnmoems3pd/stage5/`, governance export `stage5/` all absent before creation |
| PostgreSQL (read-only inspect only) | exact ID `04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01` / `mc002-inta-pg-intamvnmoems3pd`, **State.Status=exited**, ExitCode 0, FinishedAt `2026-10-26T00:14:55.81924409Z`; volume `mc002-inta-data-intamvnmoems3pd`, image `77f58511…`, labels/512MiB/1CPU/128pids/127.0.0.1:15457 all match the Codex lifecycle record — stopped BEFORE dispatch and re-verified exited at 00:22:07Z and 00:23:15Z AFTER execution (still stopped throughout; no start/restart/remove by me; no Config.Env, no SQL, no backend.env read; no readyz expectation during the outage) |
| Go | PID **98134**, lstart `Mon Oct 26 00:54:29 2026 (+07)`, argv `/tmp/mc002-inta-be/bin/userapi`, sole `127.0.0.1:18086` listener; binary SHA256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1` unchanged |
| Next | root PID **88444** / listener PID **88453** (start `Mon Oct 26 00:35:21 2026 (+07)`, `127.0.0.1:18085`) alive and untouched |
| Sources | harness clean @ `48cc03e949d66fc47a7d304413621eb79804e6c1`; template @ `3e5a642479acb789eb210e73fba956f3e85082e3`; backend worktree clean @ `52b60a4617081c41b949f2242e1784238c170f75`; no rebuild/config/dependency/lifecycle change |
| State ledger (read directly, no driver help/status) | **42 files**, hash chain **42/42 identical** to the Codex outage lifecycle record (`state_hashes`, 0 mismatch/missing/extra); counter **20**; **16 assertion records all pass**; markers `stage1..4` only; **zero** T11/W11/stage5 envelopes/intents; baseline A `01a17422-e796-…8393` **version 1 / INTA_A_INITIAL** immutable, current A **version 2 / INTA_A_UPDATED**; B `01a17422-e7ff-…d691` unchanged; `userXOutcome: null` before execution |
| Go log | `go-restart-01/20-restart.stdout.log` 1,880 B, SHA `5c7261d81470…` — identical to the stage4 after-snapshot (zero drift); snapshotted before execution |

## Execution (exactly once, allowed sequence only)

`rtk proxy node src/driver.ts stage5 --runId=intamvnmoems3pd --state-dir=/tmp/mc002-inta-state-intamvnmoems3pd --confirm-pg-stopped` from `/tmp/mc002-inta-harness` — started **2026-10-26T00:21:40Z**, finished **00:21:41Z**, **exit 0**, stderr 0 bytes. Four case submissions / four substeps only (counter 20 → **24**); no extra HTTP/SQL/record probes before or after.

## Observed result — four cases, four request IDs 21..24

- **T11a (`mc-int-intamvnmoems3pd-T11a-21`, app-client GET A)**: `apiError` **503** / `HTTP_ERROR`, harness classification **unavailable**, native problem detail `type /problems/unavailable`, integer `retryAfter 1`; latencyMs 24; `truncated:false`.
- **T11b (`…-T11b-22`, app-client PATCH A, If-Match "2", `INTA_A_OUTAGE`)**: `apiError` **503** / `HTTP_ERROR`, **unavailable**, same native problem literals; latencyMs 3; `truncated:false`. **No commit/no-change conclusion is drawn from the 503** — the envelope records the failed dispatch only; record reconciliation belongs to stage6 INT-PERS-03/04.
- **T11c (`…-T11c-23`, app-client POST synthetic X once)**: `apiError` **503** / `HTTP_ERROR`, **unavailable**, same literals; latencyMs 5; `truncated:false`. **X remains OUTCOME_UNKNOWN**: nested state `userXOutcome` = `OUTCOME_UNKNOWN`, substep intent state `unknown`; no retry, no re-POST, no new key, no list/SQL lookup, no missing-X conclusion.
- **W11 (`…-W11-24`, wire GET A)**: wire **status 503**, `content-type application/problem+json`, **x-request-id echo exact** for this request only; same `/problems/unavailable` + `retryAfter 1` inside the problem body; latencyMs 4; `truncated:false`. No Retry-After header expectation asserted (product convention remains deferred).
- **Assertions 16 → 20**, T11a/T11b/T11c/W11 all `pass:true` (driver-native literals asserted); nested state → **`STAGE_5_COMPLETED`**; A checkpoints byte-unchanged (baseline v1 + current v2 preserved — no record repair); B identity unchanged.
- **State delta (42 → 51 files)**: 9 new (envelopes `T11a/T11b/T11c/W11` + 4 substep statuses (T11c `unknown`) + `stage5.completed`) and 3 modified (`counters.json` 20→24, `assertions`, nested `state.json`) — full delta in `06-state-delta.diff`; before/after full-tree manifests `01`/`05`.

## Causal ordering and correlation (each request ID exactly once)

PG stop completed (`FinishedAt 2026-10-26T00:14:55.819Z`) **before** the first dispatch (`startedAt 2026-10-26T00:21:41.055Z`), and the container was still `exited` when re-inspected after execution — the outage window provably contains every dispatch. The post-Go-restart log `go-restart-01/20-restart.stdout.log` grew 1,880 → 3,855 B with **exactly four new ERROR lines**, one per request ID, each status **503** with the causal storage error `failed to connect … 127.0.0.1:15457 … connection refused` (T11a GET 07:21:41.076+07, T11b PATCH .149, T11c POST .204, W11 GET .262) — live connection-refused evidence the DB was unreachable for every attempt, not a timeout/stale-pool artifact. Zero matches for these IDs in the pre-restart log (before-snapshot identical to the accepted stage4 after-hash). Next dev log added exactly four `POST /harness/case 200` lines (the four dispatches; nothing else).

## Evidence, hashes, privacy

Raw: `/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/stage5/` (25 files incl. `state-copy/` of every new/changed ledger artifact and the untouched A checkpoints; `30-hashes.txt` covers 24 payloads, excludes itself). Governance exports: `docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage5/` — **25/25 raw/export pairs cmp-verified byte-identical**. Privacy scan (`12-privacy-scan.txt`, 00:22:50Z): synthetic fixture markers (A/B/X emails + all INTA_* names incl. `INTA_A_OUTAGE`) in Go/Next/driver application logs — **0 matches**; credential/DSN/token patterns across all stage5 evidence and the live state dir — **0 matches**; all 4 new envelopes complete (`truncated:false`). No backend.env read, no environment dump; no credential values in any artifact.

## Resource disposition and boundaries

**Left exactly as required for the next cue:** Go PID 98134 alive (18086), Next PID 88444/88453 alive (18085), PostgreSQL container `04552c273cb6…` **still STOPPED** (Codex owns the same-PG restart), state ledger preserved with stage5's own writes only. No stage6 `--confirm-pg-recovered`, no stage7, no future flags, no lifecycle/cleanup, no repair of current A or resolution of X through SQL/manual requests. New files only: this return and the two `stage5/` evidence sets. No governance/canonical-result edits; BE01/F10/UX work untouched; no paid activity, install, merge, deploy or STEP03B.

**Owner assertion vs independent acceptance:** owner-side native outage characterization; T11a/b/c/W11 formal acceptance, all 51 canonical results and independent runtime QA remain PENDING/NOT_RUN. **Remaining risks:** live processes/appendable logs can drift after the 00:21:40–00:23:15Z window; T11b commit outcome stays open until read-only recovery reconciliation (stage6); X stays OUTCOME_UNKNOWN permanently in this slice.

*Next: Codex intakes this return, then starts the SAME PG container WITHOUT a Go restart, and separately cues stage6 (`--confirm-pg-recovered`) for the read-only recovery observations.*
