# MC-002-INTA-BE — Runtime Start Return (migrate + Go server start, runId intamvnmoems3pd)

**Owner & Role:** Actual ZCode (backend runtime owner; interactive session, no subagent) · **Model/Provider:** account:zai-start-plan/GLM-5.3 via Z.AI, normally configured, unchanged · **UTC window:** 2026-10-25T09:41–09:51Z · **Authority:** DEC-028 / frozen INTA-1; this task is backend execution, not independent QA.

**Proposed status: IN_REVIEW / BACKEND_RUNNING_READY / WAITING_STAGE_1_COORDINATION.** Not DONE; no runtime case PASS awarded; OpenCode independent 36-case QA pending. All 51 canonical rows remain NOT_RUN (36 required / 14 deferred / 1 blocked).

## Provenance verified before action

| Dimension | Verified value |
|---|---|
| Worktree | `/tmp/mc002-inta-be` clean on `codex/mc-002-inta-be` at `52b60a4617081c41b949f2242e1784238c170f75`; zero tracked diff; no rebuild |
| Binary | `bin/userapi`, 42,202,722 bytes, SHA256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1` (recomputed this session; matches intake/ENV return) |
| CLI | `cmd/userapi/main.go`: `userapi migrate` then `userapi` (no args) = HTTP server; config from env (`internal/config/config.go`) |
| Private config | `/tmp/mc002-inta-private/intamvnmoems3pd/backend.env`; directory `0700`, file `0600`; contents never read into chat/logs/argv; approved native config per INTA-1 (STORAGE=postgres, HTTP_ADDR=127.0.0.1:18086, MIGRATE_ON_START=false, READINESS_CHECK_DB=true, events/OTel/docs off) |
| Container (read-only recheck) | `04552c273cb6…bd01` = `mc002-inta-pg-intamvnmoems3pd` `running healthy`, publishing only `127.0.0.1:15457->5432`; minimal inspect fields, no Config.Env, no Docker mutation by ZCode |
| Port 18086 | Free before start (lsof none, nc refused); owned listener only after start |
| Inputs read | INTA-1 in full, MC-002-INT-A, inta-coordination, R4 source closure, ENV return/backend intake, environment.json/checks.json, docs/api.md, main.go/config; matrix/classification via contract §4 bindings and prior R4-review packet reads |

## Execution record

**1. Migration (2 attempts, both fully recorded; net effect: exactly one successful migration run)**

- **Attempt 1 — exit 1, zero DB side effects.** `env -i /bin/sh -c '. /tmp/mc002-inta-private/intamvnmoems3pd/backend.env …; exec bin/userapi migrate'` failed config validation: stdout (1 line) `…ERROR…"userapi stopped with error","error":"DATABASE_URL is required for migrate"`. Root cause: my first wrapper sourced the private file **without `set -a`**, so nothing was exported across `exec`; the binary ran with an empty environment and never received a DSN — no connection was possible, no migration ran, DB state untouched (this is a diagnosed deterministic pre-connection failure, not an uncertain exit; the no-blind-replay rule targets uncertain DB state). Evidence `09-migrate-attempt1.*`.
- **Attempt 2 (corrected sourcing) — exit 0.** `env -i /bin/sh -c 'set -a; . /tmp/mc002-inta-private/intamvnmoems3pd/backend.env; set +a; exec /tmp/mc002-inta-be/bin/userapi migrate'`; started `2026-10-25T09:49:0xZ`, exit 0, stderr empty. Six native migrations applied in order: `0001_create_users.sql`, `0002_add_users_version.sql`, `0003_create_outbox.sql`, `0004_outbox_parking.sql`, `0005_outbox_pending_index.sql`, `0006_drop_outbox_unpublished_index.sql`. No alternate migration tool, no second DB, no schema change beyond native files. Evidence `10-migrate.*`.

**2. Server start — running and ready.**

- Wrapper `start-userapi.sh` (evidence dir, mode 0700; sources the private env, `exec`s the exact binary; **no secret literals**; content hook-scanned) launched via `env -i` so no inherited runtime/product settings can conflict.
- **Owned process: PID 77632**, lstart `Sun Oct 25 16:49:50 2026 (+07)`, argv exactly `/tmp/mc002-inta-be/bin/userapi` (no DSN in argv), still alive at final recheck 09:51:35Z. Sole listener on `127.0.0.1:18086 (LISTEN)` is this PID.
- Startup stdout (1 line, metadata only): `…"starting userapi","addr":"127.0.0.1:18086","storage":"postgres","version":"52b60a4","otel":false` — in-process version assertion for INT-ENV-03. stderr 0 bytes.
- Operational probes (gates, not product cases): `GET /healthz` → HTTP 200 `{"status":"ok"}`; `GET /readyz` → HTTP 200 `{"status":"ready"}` (READINESS_CHECK_DB=true with healthy PG). No POST/PATCH/list/SQL probe, no docs/relay/Kafka activation.

## Evidence, hashes and redaction

Raw evidence `/tmp/mc002-inta-evidence/backend/runtime-intamvnmoems3pd/` (18 files incl. wrapper); manifest `30-hashes.txt` (SHA256, no self-hash entry). Reviewed byte-identical exports `docs/testing/inta-returns/backend/runtime-intamvnmoems3pd/` — 17 files copied 1:1 plus the wrapper exported as `start-userapi-wrapper.sh.txt` (same bytes, non-executable documentary name; `cmp`-verified). Secret-safe scan `24-redaction-scan.txt`: in-shell extraction of the actual `DATABASE_URL` and its password fragment from the private file, `grep -rF` over all evidence — **0 exact-DSN matches, 0 password-fragment matches, 0 URI-pattern matches**; values never printed. Wrapper/env policy: nothing loaded from product env; private file only ever consumed inside `env -i` shells.

## Resource disposition and boundaries

- **Go process left RUNNING** (PID 77632) for Antigravity stage1; not restarted/stopped by me now. Later lifecycle only on Codex checkpoint cues: Go restart between frontend stage1↔stage2; Go stays alive through the Codex PG outage/recovery; Go stop for T12 only between stage6↔stage7 after confirmed recovery readbacks. No retry/re-POST/new-key/list/SQL lookup; X stays OUTCOME_UNKNOWN.
- Docker container/volume: Codex-owned; I performed read-only health/identity checks only. No existing database/volume touched; no pg query issued.
- No source/test/docs/config/dependency changes in `/tmp/mc002-inta-be`; no rebuild; no baseline rerun; MC-003A and others' paths untouched. Only new files written: this return, the new evidence/export paths listed above.

**Skipped:** stage execution (stage1..7 belong to Antigravity with external-owner cues), any API record mutation, PG lifecycle, relay/Kafka/docs features, product implementation, paid/deploy/merge. **Remaining risks:** migrate attempt-1 wrapper bug is documented and corrected but means two migrate invocations occurred (1 failed pre-connection, 1 successful) — reviewers should anchor DB state on attempt-2 evidence; transport behavior under the harness is still unproven until stage1; OpenCode QA quota still blocks independent runtime verification.

*Next: deliver this return to the human for Codex intake. Frontend stage1 may proceed against 127.0.0.1:18086 with runId intamvnmoems3pd once Codex confirms coordination.*
