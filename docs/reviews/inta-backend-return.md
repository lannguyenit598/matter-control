# MC-002-INTA-BE — Backend Owner Return (source/binary prepared; runtime WAITING_ENV)

- Executed by: ZCode (actual desktop app), model GLM-5.3-Flash (`account:zai-start-plan/GLM-5.3`), backend runtime owner MC-002-INTA-BE. Manual dispatch under DEC-028 / INT-D01=INT-A ([approval](../ai-sdlc/inta-po-approval.md), subject `e7dbfbf`, handoff commit `ca649fe` verified as governance head at execution).
- **Proposed status: IN_REVIEW (preparation phase complete) / runtime WAITING_ENV.** OpenCode independently verifies; Codex intakes; Claude only on material deviation. No INT-A0/B/C switch, no MC-002 DONE, no Step03 implication.

## 1. Inputs read in full

Root AGENTS.md, RTK.md, inta-po-approval.md, INTA-1 approved contract, MC-002-INT-A task plan, integration-acceptance-matrix.md (51 rows), step-02-4-runtime-classification.md, inta-runtime-status.json; backend AGENTS.md and the config/testing rule files (from the accepted `52b60a4` source). Semble attempted and recorded unavailable ("MCP dependencies are not installed"); targeted reads used.

## 2. Source identity and preparation evidence

| Item | Value |
|---|---|
| Read-only seed | `/tmp/mattercontrol-step022-backend-c01`, verified **clean at `52b60a4617081c41b949f2242e1784238c170f75`** before and after (untouched: no edit/build/run there) |
| New worktree | `/tmp/mc002-inta-be`, NEW branch `codex/mc-002-inta-be`, created at exactly `52b60a4617081c41b949f2242e1784238c170f75` after confirming path and branch absent (snapshot repo branch scan empty) |
| Base == Head | `52b60a4` — **zero tracked diff** (`git status --porcelain` empty; `git diff 52b60a4 --stat` empty; binary lives only in gitignored `bin/`) |
| Build | UTC 2026-10-25T02:51:43→45Z, `rtk proxy make build`, **exit 0**; recipe executed: `CGO_ENABLED=0 go build -trimpath -ldflags "-X main.version=52b60a4" -o bin/userapi ./cmd/userapi` — **source-stamped from a clean tree** (the E-07 dirty-stamp limitation is thereby not repeated) |
| Binary | `/tmp/mc002-inta-be/bin/userapi`, 42,202,722 bytes, sha256 `f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1`; the runtime start log will additionally print `version=52b60a4` as in-process stamp verification at INT-ENV-03 |
| INT-ISO-01 backend sub-checks | diff vs `52b60a4` empty ✓; `grep -ri 'cors\|access-control-allow' internal/ cmd/` → **0 matches** (no CORS configuration; server-to-server scope) ✓ |

Raw evidence: `/tmp/mc002-inta-evidence/backend/` (`10-build-meta.txt`, `11-build.stdout.log`, `12-build.stderr.log`); sanitized exports with hashes: [docs/testing/inta-returns/backend/](../testing/inta-returns/backend/20-export-hashes.txt). No secrets involved in this phase (no DSN, no ENV, no containers).

## 3. Runtime status: WAITING_ENV (blocked input, not a defect)

Checked at UTC 2026-10-25T02:5xZ: `DATABASE_URL`, `TEST_DATABASE_URL` and INTA-named variants are **absent** from the session environment, and no Codex environment handoff exists yet (no `/tmp/mc002-inta-evidence/environment/` directory). Per the frozen contract and my dispatch I therefore:

- did **not** create or start any container, did **not** use any default/retained database, did **not** invoke `make run-pg`, and started **no process** (nothing to stop; no listeners);
- did not run migration (INT-ENV-02 waits for the verified owned DB);
- preserved all retained fixtures and other agents' evidence untouched.

**Needed to proceed (in the frozen sequence):**
1. Codex INT-ENV-01: the new owned, labelled, capped PostgreSQL (`mc002-inta-pg-<runId>`, DB `mc002_inta`, user `mc002_inta`, loopback `127.0.0.1:15457`) verified empty/healthy, plus the **private DATABASE_URL handoff** (secret-safe channel; never pasted into evidence).
2. Phase coordination with Codex/Antigravity for the ordered sequence: INT-ENV-02 migrate → INT-ENV-03 Go start (INTA-1 config exactly: `STORAGE=postgres HTTP_ADDR=127.0.0.1:18086 EVENTS_SINK=none API_DOCS_ENABLED=false TRUSTED_PROXIES= MIGRATE_ON_START=false READINESS_CHECK_DB=true LOG_LEVEL=info REQUEST_TIMEOUT=10s DB_STATEMENT_TIMEOUT=5s DB_MAX_CONNS=5 DB_MIN_CONNS=0 SHUTDOWN_DELAY=0s`, OTel unset) → T1/T2/W1/W2 and initial negatives → checkpoint → **INT-PERS-01 Go restart (mine, before A is updated)** → INT-PERS-02 PG stop/start (Codex) → T9/W9/T10 → one PG outage (T11a/b/c, W11; **Go stays running**) → PG recovery without Go restart → INT-PERS-03/04 → **T12: I stop owned Go only after dependent observations** → correlation/privacy/isolation/teardown.
3. The runId and harness request-ID plan from the driver (Antigravity) so INT-COR-01 log correlation can be asserted against my retained Go logs.

## 4. Per-case status (my owned/co-owned rows)

| Case | Role | Result |
|---|---|---|
| INT-ENV-02 migrate | operate | **WAITING_ENV** (NOT_RUN) |
| INT-ENV-03 Go runtime | own | **WAITING_ENV** (NOT_RUN) — binary/config ready |
| T1 (co-owner with Antigravity) | observe | NOT_RUN (blocked on ENV + harness) |
| INT-PERS-01 Go restart | operate | NOT_RUN (sequenced after T1/T2 checkpoint) |
| INT-PERS-02 (Codex operates PG) | coordinate | NOT_RUN |
| T12 Go stop | own | NOT_RUN (only after dependent observations) |
| INT-COR-01 / INT-PRIV-01 / INT-ISO-01 (backend components) | evidence | backend diff + no-CORS recorded above; log correlation/privacy scans pending runtime logs |
| INT-ISO-03 teardown (backend part) | own | nothing started yet — no owned listeners exist |
| All T/W transport rows | harness-driven | NOT_RUN |

No acceptance criterion is claimed from this phase; no process exit, build success or document statement sets any matrix row to PASS.

## 5. Boundaries honored

No production/test/config/schema/dependency patch, no auth middleware, no endpoint, no C01 remediation, no relay/Kafka/retry, no full-suite/R01/R02 baseline rerun, no DB/volume modification or deletion, no global auth/provider/permission change, no paid service, no push/merge/deploy, no MC-003A edit, no MC-002 DONE. Owned resources created this phase: worktree `/tmp/mc002-inta-be` (branch `codex/mc-002-inta-be`, clean) and evidence directories only.

**Next action:** Codex performs INT-ENV-01 and hands the private DSN + phase schedule; then I execute INT-ENV-02/03 and the coordinated backend phases exactly as frozen in INTA-1.
