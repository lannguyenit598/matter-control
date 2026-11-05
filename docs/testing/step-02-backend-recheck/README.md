# MC-002-BE Recheck Evidence — OpenCode findings MC002BE-R01 / MC002BE-R02

- Executed by: ZCode (actual), model GLM-5.3-Flash (`account:zai-start-plan/GLM-5.3`), 2026-10-24, manual dispatch per MC-002-ZCODE-RECHECK handoff. Intake base: governance commit `74fbdec` (branch `task/MC-002-solution-architecture`).
- Reviewer: OpenCode (independent) — pending review of this return. Proposed status for MC-002-BE: **IN_REVIEW** (R01/R02 now executed with evidence; no DONE claim, MC-002 remains open).
- Out of scope (unchanged): the C01 500→503 implementation obligation (separate future assignment per Claude disposition), product features, integration work, source edits, upgrades, global installs/settings/auth changes, cloud/paid services, pruning or volume deletion.

## 1. Source identity and no-diff confirmation

| Item | Value |
|---|---|
| Worktree | `/tmp/mattercontrol-step021-backend`, branch `task/MC-002-be-poc` |
| Base == Head | `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b` (verified before and after; `git status --porcelain` empty — **no source diff**, no source edit performed) |
| Origin | `https://github.com/lannguyenit598/go-hexa-template` (snapshot `/tmp/mattercontrol-step02-backend`, untouched) |
| Binary | existing `bin/userapi`, sha256 `ff973fb7883c16898e5cfef6bb4e80df0252abc17ff5235c52fdc7ebabd9ad03` — identical to the reviewed PoC binary; not rebuilt |
| Prior evidence | originals in `/tmp/mc002be-evidence/` and `docs/testing/step-02-backend-poc*` preserved unmodified (Codex corrections intact) |

## 2. R01 — fresh disposable fixture + per-test JSON run — EXECUTED, PASS

Fixture (new; the retained original review DB `mc002be-pg-20261024T1454Z` was never started or mutated; prior credential not reused):

- Container `mc002be-recheck-pg-20261024T1539Z` (id `970007bbc363…`), label `org.mattercontrol.poc=mc002be-recheck`, network `mc002be-recheck-net` (new, id `1f08f66e15be…`).
- Image `postgres:18-alpine` pinned by digest `sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`.
- Capped: memory 512 MiB, 1 CPU, pids 128. Publish `127.0.0.1:15456→5432` (port verified unused before create, open after). Anonymous volume only.
- Fresh random per-run credential: generated in-session, **no shell tracing, no DSN logging, no environment dump**; never in argv; container `Config.Env` retains it as normal (presence counted, value never printed). Redacted DSN form: `postgres://mc002ber:REDACTED@127.0.0.1:15456/mc002ber_recheck?sslmode=disable`.
- Target verified **before** assigning `TEST_DATABASE_URL` (via `docker exec` psql on the local socket — no credential in argv): `current_database=mc002ber_recheck`, `current_user=mc002ber`, public-schema tables = 0, healthcheck healthy, host port open.

Command and result (from the worktree):

- UTC start `2026-10-24T15:40:29Z`, end `15:40:39Z`, **exit 0**.
- `TEST_DATABASE_URL=<verified fixture DSN> rtk proxy go test -race -count=1 -json ./...`
- stdout: 880 JSON event lines preserved verbatim in `21-r01-gotest.stdout.json` (all 880 parse as JSON; 0 invalid lines). stderr: empty (`22-r01-gotest.stderr.log`, sha256 of empty file).

Per-test totals parsed from the JSON events (`23-r01-parse-summary.txt`):

| Package | pass | fail | skip |
|---|---|---|---|
| internal/adapter/inbound/httpapi | 65 | 0 | 0 |
| internal/adapter/outbound/kafka | 10 | 0 | 0 |
| internal/adapter/outbound/memory | 10 | 0 | 0 |
| internal/adapter/outbound/postgres | 43 | 0 | 0 |
| internal/adapter/outbound/system | 2 | 0 | 0 |
| internal/app | 20 | 0 | 0 |
| internal/config | 6 | 0 | 0 |
| internal/core/domain | 14 | 0 | 0 |
| internal/core/service | 14 | 0 | 0 |
| internal/observability | 3 | 0 | 0 |
| internal/outbox | 18 | 0 | 0 |
| **Total** | **205** | **0** | **0** |

- 11 packages with tests, all package results `pass`; 5 packages report package-level `skip` = `[no test files]` (no tests exist; not test skips).
- **Actual skipped tests: none** (0 `skip` events with a Test name; no reasons to report). This is enumerated from events, not inferred from missing text. The corrected §4.4 statement can now read: PostgreSQL and all other tests ran with **zero per-test skips**.

## 3. R02 — invalid-config command/error pairs — EXECUTED, PASS

Four separate invocations of the **unchanged** `bin/userapi`, each with inherited `DATABASE_URL`/`TEST_DATABASE_URL` removed via `env -u`, bounded by a 10s watchdog (never fired; all exited in 0s), each captured as separate meta (argv, UTC start/end, exit, elapsed) + stdout + stderr files (`3x-r02-c*-{meta,stdout,stderr}.*`). Session env verified clean beforehand (`printenv` unset for both variables). No no-argument invocation was performed; no residual child processes (`pgrep bin/userapi` empty).

| Case | argv (verbatim from meta) | Exit | stdout | stderr |
|---|---|---|---|---|
| c1 | `env -u DATABASE_URL -u TEST_DATABASE_URL HTTP_ADDR=127.0.0.1:0 STORAGE=postgres ./bin/userapi` | **1** | empty | `ERROR invalid configuration error="DATABASE_URL is required when STORAGE=postgres"` |
| c2 | `env -u DATABASE_URL -u TEST_DATABASE_URL HTTP_ADDR=127.0.0.1:0 STORAGE=bogus DATABASE_URL=postgres://invalid ./bin/userapi` | **1** | empty | `ERROR invalid configuration error="STORAGE must be \"memory\" or \"postgres\", got \"bogus\""` |
| c3 | `env -u DATABASE_URL -u TEST_DATABASE_URL HTTP_ADDR=127.0.0.1:0 STORAGE=memory LOG_LEVEL=bogus ./bin/userapi` | **1** | empty | `ERROR invalid configuration error="LOG_LEVEL: slog: level string \"bogus\": unknown name"` |
| c4 (retained migrate claim) | `env -u DATABASE_URL -u TEST_DATABASE_URL ./bin/userapi migrate` | **1** | JSON log `userapi stopped with error error="DATABASE_URL is required for migrate"` | empty |

Notes: c2's `DATABASE_URL=postgres://invalid` is the original case's literal non-secret string. Config-validation errors are emitted on **stderr** (plain text, before the logger exists); the migrate subcommand failure is emitted on **stdout** (JSON slog, after logger construction). `HTTP_ADDR=127.0.0.1:0` is the original safety bound (config fails before any listen).

## 4. Redaction inspection (performed before handoff)

- Search of all 17 evidence files for the actual fixture credential: **0 occurrences**.
- `postgres://` occurrences: exactly 2, both benign and documented — the `postgres://invalid` literal in c2 argv, and the REDACTED DSN form in the fixture manifest.
- No environment dumps, no shell traces (`set -x` never used), no `docker inspect` env output in evidence.

## 5. Log hashes and file manifest

`40-sha256.txt` lists sha256 for every evidence file in this directory. Key hashes: R01 JSON stdout `6f5f76363d1070ed12d3b16c302e554fe45089308b6cb95c4d7d1174649993fc`; parse summary `e2809e87237205a3f8edce588d98cbe1463e1b35a9fb6830ce37837d26fb970e`; fixture manifest `86f7ade132ec1c700e0b3aaa480156f69253e72a7d67a8b634bc165683f8c93c`. Raw originals retained at `/tmp/mc002be-recheck/` (identical copies; governance copies are byte-identical exports).

## 6. Resource disposition

New owned resources created for this recheck: fixture container + anonymous volume + `mc002be-recheck-net` — container **stopped (Exited 0) and retained** for OpenCode inspection (consistent with prior practice); nothing removed, pruned, or deleted. The original review container `mc002be-pg-20261024T1454Z` remains retained/stopped and untouched. No processes remain (`pgrep bin/userapi` empty).

## 7. Acceptance status

| Item | Result |
|---|---|
| R01 fresh verified disposable fixture (new name/label/digest/caps/port; original DB untouched; fresh credential, no tracing/DSN logging/env dumps) | **PASS** |
| R01 exact command `rtk proxy go test -race -count=1 -json ./...`, valid JSON stdout + stderr + exit 0 + UTC bounds preserved | **PASS** |
| R01 per-test pass/fail/skip counts by package/test with actual skips and reasons | **PASS** — 205 pass / 0 fail / 0 skip; skipped test list empty (event-enumerated) |
| R02 three separate unchanged-binary invocations, env scrubbed, argv/UTC/stdout/stderr/exit captured separately, bounded | **PASS** |
| R02 migrate-without-DSN claim retained with captured invocation | **PASS** |
| No source edits / no-diff confirmation | **PASS** (base == head `d024e3e`, clean tree) |
| Redaction inspection before handoff | **PASS** (0 credential occurrences) |
| C01 503 implementation, integration work, product features | NOT_RUN — separate assignments, per intake/disposition |

Proposed status: **IN_REVIEW** — OpenCode to review this return; no self-awarded DONE. MC-002 remains open; no Step 03.
