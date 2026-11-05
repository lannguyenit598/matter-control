# MC-002-INTA-GO-STOP — Backend Go graceful-stop return (runId intamvnmoems3pd)

**Owner & role:** actual ZCode in the **backend runtime role** (separate lifecycle cue; interactive session, no subagent). **Model/provider:** `account:zai-start-plan/GLM-5.3` via Z.AI, configured route unchanged; owner-reported, not independently attested. **Authority:** DEC-028 / frozen INTA-1; released after stage6 intake (coordination base `a62d838…`, current HEAD verified, not reset). One bounded graceful stop only — this is not stage7, not a restart, not cleanup, not product development.

**Status returned: IN_REVIEW / GO_STOP_EXECUTED / WAITING_CODEX_STAGE7_CUE.** Exactly one SIGTERM to the freshly re-verified exact PID; graceful shutdown observed in the application log and process/listener disappearance independently observed. Go intentionally remains stopped; Next/PG retained running; ledger untouched.

## Fresh preflight before any signal (all PASS, 2026-10-26T00:38:27Z)

| Dimension | Verified value |
|---|---|
| Backend source | `/tmp/mc002-inta-be` clean at `52b60a4617081c41b949f2242e1784238c170f75`; no rebuild/migration; binary SHA256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1` unchanged |
| Target process (all identifiers together, not PID alone) | PID **98134**, PPID 1, lstart `Mon Oct 26 00:54:29 2026 (+07)`, ps command exactly `/tmp/mc002-inta-be/bin/userapi`, **sole** `127.0.0.1:18086` LISTEN; fd1/fd2 = `go-restart-01/20-restart.stdout.log` (4,438 B) / `21-restart.stderr.log` (0 B) |
| Next (preserved) | root PID **88444** / listener PID **88453**, start `Mon Oct 26 00:35:21 2026 (+07)`, `127.0.0.1:18085` listening; harness clean `48cc03e…`; template clean `3e5a642…`; no driver help/status invocation |
| PostgreSQL (preserved) | same ID `04552c273cb6…bd01`, volume `mc002-inta-data-intamvnmoems3pd`, image `sha256:77f58511…`, loopback 15457, 512MiB/1CPU/128pids, task labels unchanged, **running healthy** (read-only inspect only) |
| Ledger | `/tmp/mc002-inta-state-intamvnmoems3pd` exactly **56 files, 56/56 hashes identical** to the accepted stage6 after-manifest (`01-ledger-before.sha256`); counter 26; 22 true assertions; markers `stage1..6` only; `STAGE_6_COMPLETED`; A baseline v1 / current v2 preserved; B unchanged; `userXOutcome OUTCOME_UNKNOWN` + T11c intent `unknown`; **zero** stage7/T12 intents/envelopes/markers |
| Documented shutdown path (read from source) | `main.go:40` NotifyContext(SIGTERM); `app.go` OnStop logs `shutting down, draining` (delay `0s` per INTA-1), bounded `srv.Shutdown` drain, then `userapi stopped gracefully`; error path logs `userapi stopped with error` + exit 1 |
| Output paths | return file, raw `go-stop-01/`, export `go-stop-01/` all absent before creation |

## Execution (exactly one signal)

- **Command:** `kill -TERM 98134` — **2026-10-26T00:39:27Z**, **exit 0** (signal delivery). No pkill/fuser, no SIGKILL, no escalation, no second signal, no other target.
- **Disappearance:** bounded wait (≤10s documented drain bound) — process gone after ~0.1s; `ps -p 98134` empty; **no listener on 18086** (`lsof` exit 1); `pgrep -fl '[u]serapi'` no matches → **no replacement started**.
- **Graceful-shutdown evidence (fd1 log 4,438 → 4,636 B, exactly +198 = two lines):**
  - `2026-10-26T00:39:27.856771Z` INFO `shutting down, draining` `delay=0s`
  - `2026-10-26T00:39:27.857439Z` INFO `userapi stopped gracefully`
  - stderr 0 bytes before and after; no ERROR line (the exit-1 error path was not taken).
- **Evidence-quality distinction (per cue):** the graceful-shutdown *messages* are observed in the application log; process disappearance is *independently* observed via ps/lsof/pgrep. The **exit code is not directly observable** — the process was orphaned (PPID 1, reaped by launchd), so no waitable status exists; `kill` exit 0 proves only signal delivery. The two graceful lines plus the source's nil-return path support graceful exit 0 without claiming a direct waitpid observation.

## Postcondition verification (00:39:40Z)

Next PID 88444/88453 unchanged and listening on 18085; PG container same ID **running healthy**; ledger re-hashed — `04-ledger-after.sha256` **byte-identical** to the before-manifest (56/56, counter 26 / 22 assertions / A v1+v2 / B / X unknown all untouched). No record HTTP, health/ready probe, SQL, harness request, stage7 invocation, future flag, replay, X query, POST/PATCH/list/search, teardown or resource cleanup was performed at any point in this task.

## Evidence, hashes, privacy

Raw: `/tmp/mc002-inta-evidence/backend/runtime-intamvnmoems3pd/go-stop-01/` — **10 files** (identity-before, stop record, before/after ledger manifests, before/after Go stdout/stderr snapshots, privacy scan, `30-hashes.txt` covering **9 payloads**, excluding itself). Governance exports: `docs/testing/inta-returns/backend/runtime-intamvnmoems3pd/go-stop-01/` — **10/10 raw/export pairs cmp-verified byte-identical**. Privacy scan (`12-privacy-scan.txt`, 00:40:02Z): synthetic fixture markers (A/B/X emails + INTA_* names) in the Go application-log snapshots — **0 matches**; credential/DSN/token patterns (incl. `postgres://`, `password=`, `DATABASE_URL`, backend.env reference) across all evidence — **0 matches**. No Config.Env read, no private backend.env access, no environment dump.

## Resource disposition and boundaries

**Go STOPPED (intentional)** — awaiting Codex intake of this stop evidence, then a **separate stage7 cue** (`--confirm-go-stopped`, T12) which was NOT invoked here. Next PID 88444/88453 and PG container `04552c273cb6…` retained running. No source/config edit, no migration, no data repair, no lifecycle of PG/Next, no governance/canonical-result edits, no commit/merge/push, no provider change, no BE01/F-08/F-10/UX work, no independent QA or product recovery claim, no deploy/STEP03B.

**Skipped/not done:** stage7 execution and `--confirm-go-stopped` (separate cue required), any Go restart, health probes after stop (documented boundary: no probes), exit-code observation (structurally impossible for a reaped orphan — see distinction above), full egress/secret audit (limited pattern scan only). **Remaining limitations:** live Next/PG and appendable logs can drift after the 00:39:27–00:40:07Z window; graceful exit 0 is supported by log lines + source path, not a captured wait status; the earlier stage6 Mimosa route-compliance caveat (owner-reported) remains as recorded by the intake.

*Next: Codex intakes this stop evidence and separately releases the stage7 T12 cue to the frontend/driver role.*
