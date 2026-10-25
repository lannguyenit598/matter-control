# MC-002-INTA-BE — Go Restart Return (go-restart-01, runId intamvnmoems3pd)

**Owner & role:** actual ZCode (backend runtime owner; interactive session, no subagent). **Model/provider:** `account:zai-start-plan/GLM-5.3` via Z.AI, normally configured and unchanged; no provider/model/login/quota change. **Authority:** DEC-028 / frozen INTA-1, this GO-RESTART cue only; owner execution, not independent QA. **Governance base:** verified latest HEAD `1e876935e73d58cf8ee6a72bdfe2e5384327a6ea` on `codex/unified-project-flow` (not pinned to the prompt's preparation base `68b5586`).

**Status returned: IN_REVIEW / BACKEND_RESTARTED_READY / WAITING_CODEX_STAGE2_CUE.** Exactly one backend restart performed. Next: Codex intake of this return; stage2 readback and PG restart remain separately cued. No stage2/`--confirm-go-restarted` invocation, no driver call, no canonical PASS.

## Preconditions reverified immediately before action (all PASS)

| Dimension | Verified value |
|---|---|
| Backend worktree | `/tmp/mc002-inta-be` clean on `codex/mc-002-inta-be` at `52b60a4617081c41b949f2242e1784238c170f75`; zero tracked changes; no build/migrate |
| Binary | `bin/userapi` SHA256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1` — same hash again after restart (no rebuild) |
| Old process | PID 77632, lstart `Sun Oct 25 16:49:50 2026 (+07)` (matches expectation), PPID 1, argv exactly `/tmp/mc002-inta-be/bin/userapi` (no DSN in argv); **sole** `127.0.0.1:18086 (LISTEN)` owner; stdout/stderr confirmed by fd inspection to be the existing `20-server.stdout.log`/`20-server.stderr.log` (append mode — never truncated) |
| Next process | root PID 88444 `next dev -H 127.0.0.1 -p 18085 --webpack` (start `Mon Oct 26 00:35:21 2026 (+07)`), listener PID 88453 `next-server (v16.4.2)` on `127.0.0.1:18085` — untouched, still running after the restart |
| Source identities | harness `/tmp/mc002-inta-harness` @ `48cc03e949d66fc47a7d304413621eb79804e6c1`; template `/tmp/mc002-inta-fe` @ `3e5a642479acb789eb210e73fba956f3e85082e3` |
| Stage1 ledger (read actual files, no driver/status invocation) | `/tmp/mc002-inta-state-intamvnmoems3pd`: counters `{"intamvnmoems3pd":14}`; **11 assertion records, all `pass:true`** (T1,T2,W1,W2,T3,T4,T5,T8,W3,T6-W,T7-W); **14 substep envelopes** across 11 envelope files; `stages/` contains **only** `stage1.completed` (stage 1, 2026-10-25T17:36:47.296Z); A baseline == A current (id `01a17422-e796-7465-a325-1c87c74d8393`, INTA_A_INITIAL, version 1); nested checkpoint state `STAGE_1_COMPLETED` with `checkpointBId 01a17422-e7ff-7daf-a9a1-a0994eaed691`, `userXOutcome: null`; top-level initializer `INITIALIZED` as documented in intake errata |
| PostgreSQL (read-only) | container `04552c273cb6` = `mc002-inta-pg-intamvnmoems3pd` `Up (healthy)`, publishing only `127.0.0.1:15457->5432`; volume `mc002-inta-data-intamvnmoems3pd` present. No Config.Env read, no Docker lifecycle, no SQL; emptiness NOT assumed |
| Private config | `/tmp/mc002-inta-private/intamvnmoems3pd` dir `0700`, `backend.env` `0600` (observed by `stat` only; contents never read into output). Outer shared parent `/tmp/mc002-inta-private` is `0755` as originally provisioned by Codex — unchanged, not mine to alter |
| Output paths | `docs/reviews/inta-backend-go-restart-return.md` and `docs/testing/inta-returns/backend/runtime-intamvnmoems3pd/go-restart-01/` both absent before creation; raw `go-restart-01/` absent before creation |

## Execution record

**1. Pre-stop immutable snapshot** (before any signal): byte-copies of the live server logs (stdout 3,829 B / stderr 0 B) and of the immediate stage1 ledger/checkpoint files (counters, assertions, initializer, A baseline/current, nested state, stage1.completed) into `go-restart-01/00-pre-stop/`; SHA-256 manifests of all **29 state-dir files** (`01-state-before.sha256`) and both server logs (`01-server-logs-before.sha256`). Earlier exports and their hash inventories untouched.

**2. Graceful shutdown of the exact verified PID — observed, not inferred.** `kill -TERM 77632` at **2026-10-25T17:54:09Z** (exit 0); process observed gone by **17:54:10Z** (bounded 30×1s poll of `ps -p`); `lsof -iTCP:18086 -sTCP:LISTEN` = **0 listeners** after exit. The live server log itself appended the graceful pair `"shutting down, draining","delay":"0s"` → `"userapi stopped gracefully"` (stdout grew 3,829 → 4,026 B; post-stop hashes in `11-server-logs-after-stop.sha256`). State ledger re-hashed immediately after the stop: identical.

**3. Start of the same binary, same private configuration.** Reviewed secret-free wrapper semantics, launched detached: `nohup env -i /bin/sh -c 'set -eu; set -a; . /tmp/mc002-inta-private/intamvnmoems3pd/backend.env; set +a; exec /tmp/mc002-inta-be/bin/userapi' > go-restart-01/20-restart.stdout.log 2> go-restart-01/21-restart.stderr.log &` at **2026-10-25T17:54:29Z**. No arguments, no migrate, no rebuild, no alternative config; the private file was consumed only inside this `env -i` process, never rendered anywhere. Documentary wrapper copy exported as `go-restart-wrapper.sh.txt` (mode 0700 in raw evidence).

**4. New backend identity and readiness.** **PID 98134**, lstart `Mon Oct 26 00:54:29 2026 (+07)` (= 17:54:29Z), PPID 1, argv exactly `/tmp/mc002-inta-be/bin/userapi`, **sole listener `127.0.0.1:18086`**; startup stdout (1 line, metadata only) reports `"starting userapi","addr":"127.0.0.1:18086","storage":"postgres","version":"52b60a4","otel":false`; stderr 0 bytes. Binary SHA256 re-verified identical after restart. Metadata-only operational probes at **17:54:41Z**: `GET /healthz` → **200** `{"status":"ok"}`; `GET /readyz` → **200** `{"status":"ready"}` (READINESS_CHECK_DB=true; readiness exercised the DB health path without any SQL query from me).

**5. Post-restart integrity.** All **29 state files byte-identical** (`24-state-after-restart.sha256` == before manifests; no ledger write). Next root 88444 and listener 88453 still running with unchanged start times. Container still `Up (healthy)` on loopback 15457 with its volume. **No** GET/PATCH/POST/list of user records and no SQL at any point; INT-PERS-01's readback belongs to the separately cued stage2; X remains OUTCOME_UNKNOWN if ever encountered.

## Evidence, hashes, privacy

Raw evidence: `/tmp/mc002-inta-evidence/backend/runtime-intamvnmoems3pd/go-restart-01/` (21 hashed artifacts + 00-pre-stop snapshots + wrapper). Manifest `30-hashes.txt` covers every new raw file **except itself** (no self-hash). Governance exports: `docs/testing/inta-returns/backend/runtime-intamvnmoems3pd/go-restart-01/` — 21 files copied 1:1 plus the wrapper as documentary `.txt`; **all 21 raw/export pairs `cmp`-verified byte-identical**, wrapper documentary export content-identical to the raw wrapper. Credential-value scan (`25-redaction-scan.txt`, 17:54:55Z): in-shell extraction of the actual `DATABASE_URL` and its password fragment from the private file, `grep` over all new evidence → **0 exact-DSN matches, 0 password-fragment matches, 0 URI-credential-pattern matches**; values never printed. Live `20-server.*.log` files were appended-to only by the processes themselves; pre-stop byte-copies preserve the prior content.

## Resource disposition and boundaries

- **New Go PID 98134 left RUNNING** ( sole 18086 listener); **Next 88444/88453 left RUNNING**; PostgreSQL container/volume untouched (Codex-owned). Nothing stopped/removed/pruned beyond the one commanded restart.
- No changes in `/tmp/mc002-inta-be` (clean at `52b60a4` throughout), no rebuild, no migration, no relay/Kafka/docs activation, no baseline rerun, no MC-003A/BE01/F08/F10 action, no governance-status edits, no modification of old reports/evidence/canonical results. New files only: this return and the `go-restart-01` export set (left untracked for Codex intake per workflow rule 5).

**Skipped:** stage2 execution and any `--confirm-go-restarted` flag, driver/status/help invocation, user-record HTTP/SQL reads, PG lifecycle, rebuild/migrate, independent QA claims, paid/deploy/merge/STEP03B. **Remaining risk:** live processes and appendable logs can change after the recorded observations (17:54:09–17:54:55Z window); readiness reflects the health path at probe time only; independent OpenCode QA of the 36 required cases remains PENDING and is not substituted by this owner return.

*Next: Codex intakes this return; stage2 (INT-PERS-01 readback) and the later WAITING_PG_RESTART barrier follow their own cues.*
