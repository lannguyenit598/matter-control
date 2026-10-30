# MC-002-INTA-FE — Stage 7 Return (T12 shutdown case, runId intamvnmoems3pd)

**Owner & role:** actual ZCode (frontend/Next/driver runtime owner under the released Codex stage7 cue; interactive session, no subagent). **Model/provider:** `account:zai-start-plan/GLM-5.3` via Z.AI, configured route unchanged; owner-reported, no independent provider attestation. **Authority:** DEC-028 / frozen INTA-1; go-stop intake verified before this cue (coordination base `a62d838…`, current HEAD verified, not reset). This is the seventh and final canonical driver stage — native transport shutdown characterization, NOT independent QA or product acceptance.

**Status returned: IN_REVIEW / STAGE_7_EXECUTED / WAITING_CODEX_FINAL_INTAKE.** Exactly one stage7 execution (`--confirm-go-stopped` from the released cue); exactly one fixed T12 attempt. No restart, no stop signal, no health probe, no substitute process, no retry/alternate route/repair, no extra record GET/POST/PATCH/list/search/SQL, no X lookup/re-POST/new key — X remains OUTCOME_UNKNOWN permanently within this slice.

## Preflight (all PASS, 2026-10-26T00:46:19Z — no driver help/status construction)

| Dimension | Verified value |
|---|---|
| Go (stopped state) | PID 98134 **absent** (`ps` exit 1); `pgrep -fl '[u]serapi'` no matches; **no listener/replacement owns 127.0.0.1:18086** (`lsof` exit 1) — re-verified still absent at 00:47:01Z after execution; no restart/stop/force-kill/probe/contact of any process |
| Backend source | `/tmp/mc002-inta-be` clean at `52b60a4617081c41b949f2242e1784238c170f75`; binary SHA256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1`; no build/source/config/dependency change |
| Next / template / harness | root PID **88444** / listener PID **88453**, start `Mon Oct 26 00:35:21 2026 (+07)`, `127.0.0.1:18085` — the same running server; template clean `3e5a642…`; harness clean `48cc03e…` |
| PostgreSQL (read-only inspect only) | exact ID `04552c273cb6…bd01`, **running healthy**, StartedAt `2026-10-26T00:26:58.345144717Z` unchanged, image `77f58511…`, volume `mc002-inta-data-intamvnmoems3pd`, loopback 15457, 512MiB/1CPU/128pids, task labels unchanged; no Config.Env/private backend.env/full environment/SQL/lifecycle |
| Ledger | `/tmp/mc002-inta-state-intamvnmoems3pd` exactly **56 files, 56/56 hashes identical** to the accepted stage6 after-manifest AND the go-stop before/after manifests (diff empty); counter **26**; **22 true assertions**; markers `stage1..6` only; `STAGE_6_COMPLETED`; A baseline v1 / current v2 preserved; B unchanged; `userXOutcome OUTCOME_UNKNOWN` + T11c intent `unknown`; **zero** T12/stage7 intents/envelopes/markers |
| Output paths | return file, raw `stage7/`, export `stage7/` all absent before creation |
| Prior intake evidence | go-stop intake (`92 checks PASS`), authorized resource observation (00:43:17Z: Go absent, Next/PG unchanged — historical, superseded by this fresh preflight) |

## Execution (exactly once)

`rtk proxy node src/driver.ts stage7 --runId=intamvnmoems3pd --state-dir=/tmp/mc002-inta-state-intamvnmoems3pd --confirm-go-stopped` from `/tmp/mc002-inta-harness` — started **2026-10-26T00:46:45Z**, finished **00:46:45Z**, **exit 0**, stderr 0 bytes. Driver summary: `All 23 companion endpoint cases completed and asserted. 13 external-owner procedures (INT-ENV-01..07, INT-COR-01, INT-PRIV-01, INT-ISO-01..03, INT-CONF-01) remain pending external-owner evidence.`

## Observed result — one T12 attempt, request ID 27

- **T12 (`mc-int-intamvnmoems3pd-T12-27`, app-client GET A through the unchanged shared client)**: outcome `apiError` — **status 0**, **code `NETWORK_ERROR`**, message `Network error: could not reach the server`; harness classification **unavailable**; latencyMs 18; envelope complete (`truncated:false`). **Status 0 is a client-side network observation (fetch refusal/connection failure), NOT an upstream HTTP 503** — no upstream status/headers are claimed or invented.
- **Next dispatch attribution:** the Next dev log appended exactly one line — `POST /harness/case 200 in 55ms` (the harness dispatch itself returned 200 carrying the failure envelope; application-code 51ms covers the failed upstream connect). Recorded separately; not substituted for Go status.
- **Stopped-Go log continuity:** the Go stdout log is **byte-unchanged** (4,636 B, diff exit 0 vs the pre-execution snapshot, which itself equals the accepted go-stop after-snapshot) and stderr stays 0 bytes — Go is stopped and correctly produced **no** new API request line; no successful server-side correlation is invented and **no historical request ID is reused**. The one T12 envelope/intent (`T12.status` `completed`) + requestId 27 + the single Next dispatch line are the complete attribution set.
- **Bookkeeping (driver-written, not manually set):** counter 26 → **27**; assertions 22 → **23** (T12 `pass:true`); nested state → **`STAGE_7_COMPLETED`**; `stage7.completed` marker; A baseline v1 / current v2, B identity and X OUTCOME_UNKNOWN all byte-preserved.
- **State delta (56 → 59 files)**: 3 new (envelope `T12.json`, intent `T12.status`, marker `stage7.completed`) + 3 modified (`counters.json` 26→27, `assertions` (T2 timestamp refresh again per the driver helper pattern noted by the stage6 intake; T12 record appended), nested `state.json`) — full delta `06-state-delta.diff`; before/after full-tree manifests `01`/`05`.

## Evidence, hashes, privacy

Raw: `/tmp/mc002-inta-evidence/frontend/runtime-intamvnmoems3pd/stage7/` — **19 files** (driver meta/logs, ledger before/after manifests, stopped-Go stdout/stderr before-snapshots + live-log byte-equality checks, Next before/after, state delta, `state-copy/` of all 6 new/changed ledger artifacts incl. untouched A checkpoints and nested state; `30-hashes.txt` covers **18 payloads**, excluding itself — payload count stated accurately). Governance exports: `docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage7/` — **19/19 raw/export pairs cmp-verified byte-identical**. Privacy scan (`12-privacy-scan.txt`, 00:47:30Z): synthetic fixture markers (A/B/X emails + `INTA_A_INITIAL/UPDATED/OUTAGE`) in Go/Next/driver application logs — **0 matches**; credential/DSN/token patterns (`postgres://`, `postgresql://`, `password=`, `PGPASSWORD`, `Bearer `, `backend.env`, `DATABASE_URL`) across all stage7 evidence and the live state dir — **0 matches** (declared scan patterns are not credential contents). No private config read, no env dump.

## Resource disposition and boundaries

**Left exactly as required:** Go remains STOPPED (no restart, no new listener at 00:47:01Z); Next PID 88444/88453 retained running on 18085; PG container `04552c273cb6…` retained running healthy; state ledger and all evidence intact. No cleanup, container/volume removal, process stop/restart, source edit, commit/merge/push, canonical/governance status edit, provider activity, teardown or independent review dispatch. No hook denial occurred in this task.

**What stage7 does and does not complete:** all seven canonical driver stages are now executed (23 companion endpoint cases; request IDs 1..27 monotonic with no gaps/reuse). This completes none of the 36 required acceptance rows, none of the external-owner procedures (INT-ENV-01..07, INT-COR-01, INT-PRIV-01, INT-ISO-01..03, INT-CONF-01), no source/privacy/isolation/correlation formal checks, no owned teardown, and no conformance/independent review — all remain separate. All 51 formal results stay NOT_RUN with independent QA PENDING; product/design/architecture/security/cost/release/STEP03B gates unchanged; BE01/F08/F10/UX untouched; MC-003A REWORK_REQUIRED; STEP03B NOT_AUTHORIZED.

**Skipped/not done:** everything listed above as separate; health probes of the stopped Go (prohibited); T11b strict no-change variant beyond the stage6 readback (not requested); exit-code observation for the stopped Go (structurally unavailable, remains NOT_OBSERVED per the go-stop intake). **Remaining risks:** live Next/PG and appendable logs can drift after the 00:46:45–00:47:38Z window; T12's status-0 proves only that this one client attempt could not reach a server on 18086 at that instant, not continuous downtime; owner assertions are not independent QA.

*Next: Codex final intake of this stage7 evidence; then external-owner procedures, correlation/privacy/isolation evidence assembly, owned teardown coordination and independent QA under their own cues.*
