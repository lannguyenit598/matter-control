# MC-002-INTA-FE — Stage 6 Return (INT-PERS-03/04 read-only recovery readbacks, runId intamvnmoems3pd)

**Owner & role:** actual ZCode (frontend/Next/driver runtime owner under the released Codex stage6 cue; interactive session, no subagent). **Model/provider:** `account:zai-start-plan/GLM-5.3` via Z.AI, configured route unchanged; owner-reported, no independent provider attestation. **Authority:** DEC-028 / frozen INTA-1; stage5 intake received and Codex same-PG recovery verified before this cue. Local native read-only recovery characterization — NOT product recovery acceptance and not independent QA.

**Status returned: IN_REVIEW / STAGE_6_EXECUTED / WAITING_CODEX_GO_STOP_CUE.** Exactly one stage6 execution (allowed sequence only, `--confirm-pg-recovered` from the released cue); stopped immediately at the Go-stop barrier. No Go/Next/PG lifecycle, no stage7 or pre-set future flags, no repair/PATCH/retry, no extra record GET/list/SQL/probe.

## Preconditions reverified immediately before execution (all PASS, 2026-10-26T00:29:34–00:30:00Z)

| Dimension | Verified value |
|---|---|
| Output paths | return file, raw `…/runtime-intamvnmoems3pd/stage6/`, governance export `stage6/` all absent before creation |
| Go (recovery WITHOUT restart) | PID **98134**, lstart `Mon Oct 26 00:54:29 2026 (+07)`, argv `/tmp/mc002-inta-be/bin/userapi`, sole `127.0.0.1:18086` listener; binary SHA256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1` unchanged — the SAME process that served the stage5 outage 503s served these recovery reads |
| Next | root PID **88444** / listener PID **88453** (start `Mon Oct 26 00:35:21 2026 (+07)`, `127.0.0.1:18085`) alive and untouched |
| Sources | harness clean @ `48cc03e949d66fc47a7d304413621eb79804e6c1`; template @ `3e5a642479acb789eb210e73fba956f3e85082e3`; backend worktree clean @ `52b60a4617081c41b949f2242e1784238c170f75`; no rebuild/config/dependency/source edit |
| PostgreSQL (read-only inspect only) | exact ID `04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01` / `mc002-inta-pg-intamvnmoems3pd`, **running healthy**, StartedAt `2026-10-26T00:26:58.345144717Z` (Codex same-container start); volume `mc002-inta-data-intamvnmoems3pd`, image `77f58511…`, labels/512MiB/1CPU/128pids/127.0.0.1:15457 unchanged — same container/volume identity across stop/start; no Config.Env/private backend.env/SQL/lifecycle action by me; re-verified `running healthy` again after execution (00:30:25Z) |
| State ledger (read directly, no driver help/status) | **51 files**, hash chain **51/51 identical** to the accepted stage5 after-manifest (`05-state-after.sha256`, diff empty); counter **24**; **20 assertion records all pass**; markers `stage1..5` only; **zero** INT-PERS-03/04 envelopes/intents; nested `STAGE_5_COMPLETED`; baseline A version 1 / current A version 2 (`INTA_A_UPDATED`) retained; B `01a17422-e7ff-…d691` unchanged; `userXOutcome: OUTCOME_UNKNOWN` with T11c intent `unknown` |
| Go log | `go-restart-01/20-restart.stdout.log` 3,855 B — identical to the stage5 after-state (zero drift since); snapshotted before execution |

## Execution (exactly once, allowed sequence only)

`rtk proxy node src/driver.ts stage6 --runId=intamvnmoems3pd --state-dir=/tmp/mc002-inta-state-intamvnmoems3pd --confirm-pg-recovered` from `/tmp/mc002-inta-harness` — started **2026-10-26T00:30:02Z**, finished **00:30:02Z**, **exit 0**, stderr 0 bytes. Two app-client GET A readbacks only (counter 24 → **26**); no other upstream request issued.

## Observed result — two readbacks, request IDs 25..26

- **INT-PERS-03 (`mc-int-intamvnmoems3pd-INT-PERS-03-25`)**: outcome `value` / classification `success`, latencyMs 33 (envelope) — the first read after recovery, visibly paying pool re-establishment (Go-side 24.99 ms vs 1.11 ms for the second read); `truncated:false`.
- **INT-PERS-04 (`…-INT-PERS-04-26`)**: outcome `value` / `success`, latencyMs 3; `truncated:false`.
- **Complete actual record comparison (not inferred before receipt):** both envelopes carry the identical complete known-A record — `id 01a17422-e796-7465-a325-1c87c74d8393`, `email inta-a-intamvnmoems3pd@example.test`, `name INTA_A_UPDATED`, **version 2**, `created_at 2026-10-25T17:36:46.998289Z` (original), `updated_at 2026-10-25T18:25:40.422511Z` (T9's exact timestamp) — **field-for-field equal to the PRE-OUTAGE current-A v2 checkpoint**, not the v1 baseline. Read-only reconciliation outcome: the actual committed state of A after the outage window equals its pre-outage state; the T11b outage PATCH left no committed change. No repair, PATCH, retry or variant substitution was performed; equality was asserted only after receiving these complete responses.
- **X stays OUTCOME_UNKNOWN** (nested state preserved; no query of X, email search, list, SQL, re-POST or new key — permanently unresolved in this slice).
- **Assertions 20 → 22** (INT-PERS-03/INT-PERS-04 `pass:true`); nested state → **`STAGE_6_COMPLETED`** (B identity and X-unknown preserved); A checkpoint files byte-unchanged.
- **State delta (51 → 56 files)**: 5 new (envelopes `INT-PERS-03/04`, 2 substep statuses, `stage6.completed`) + 3 modified (`counters.json` 24→26, `assertions`, nested `state.json`) — full delta `06-state-delta.diff`; before/after full-tree manifests `01`/`05` (all prior stage files immutable, current log append kept separate from snapshots).

## Go-log correlation (each request ID exactly once)

`go-restart-01/20-restart.stdout.log` grew 3,855 → 4,438 B with **exactly two new INFO lines**: `INT-PERS-03-25` GET `/api/v1/users/01a17422-e796…` **200** at `2026-10-26T07:30:02.656365+07:00` (=00:30:02.656365Z, latency 24.99 ms) and `INT-PERS-04-26` GET **200** at `07:30:02.697963+07:00` (=00:30:02.697963Z, latency 1.11 ms) — one line per ID, no duplicates in the pre-restart log, no other new requests. Next dev log added exactly two `POST /harness/case 200` lines (the two dispatches; nothing else). App-client success wire status/headers remain unobservable/null by design; the Go-log lines are separate transport-side correlation evidence, not client-observable headers.

## Evidence, hashes, privacy

Raw: `/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/stage6/` (21 files incl. `state-copy/` of every new/changed ledger artifact and the untouched A checkpoints; `30-hashes.txt` covers 19 payloads, excludes itself). Governance exports: `docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage6/` — **21/21 raw/export pairs cmp-verified byte-identical**. Privacy scan (`12-privacy-scan.txt`, 00:31:00Z): synthetic fixture markers (A/B/X emails + `INTA_A_INITIAL/UPDATED/OUTAGE`) in Go/Next/driver application logs — **0 matches**; credential/DSN/token patterns across all stage6 evidence and the live state dir — **0 matches**; both new envelopes complete (`truncated:false`), so the complete-equality assertions stand. No backend.env read, no environment dump.

## Resource disposition and boundaries

**Left exactly as required for the next cue:** Go PID 98134 alive (18086), Next PID 88444/88453 alive (18085), PostgreSQL container `04552c273cb6…` running healthy — all retained untouched. The next barrier is the **separate ZCode backend Go-stop cue** (after Codex intakes this return), then stage7 `--confirm-go-stopped` for T12; nothing pre-set, no lifecycle performed by me. No governance/canonical-result edits, no earlier-stage file overwrites; BE01/F10/UX untouched; no paid activity, install, merge, deploy or STEP03B.

**Owner assertion vs independent acceptance:** owner-side native recovery characterization — INT-PERS-03/04 formal acceptance, all 51 canonical results and independent runtime QA remain PENDING/NOT_RUN; no product recovery/availability semantics claimed. **Remaining risks:** live processes/appendable logs can drift after the 00:30:02–00:31:00Z window; health is time-scoped; T11b no-commit is established by this read-only readback equality within the observed window only; X remains OUTCOME_UNKNOWN forever in this slice.

*Next: Codex intakes this return, issues the separate ZCode Go-stop cue, then stage7 (T12) under its own cue.*
