# MC-002-BE — Backend Template PoC Evidence (POC-02-01, native Go boundary)

- Executed by: ZCode (actual app: ZCode desktop, model GLM-5.3-Flash via account `zai-start-plan/GLM-5.3`), 2026-10-24, manual dispatch per [MC-002-ZCODE-PROMPT](../implementation/handoffs/MC-002-ZCODE-PROMPT.md).
- Actual independent reviewer: OpenCode, PASS_WITH_LIMITATIONS for unchanged-template characterization; R01/R02 acceptance evidence still requires ZCode rechecks. Status: **REWORK_REQUIRED_FOR_EVIDENCE / NOT_DONE**. Actual Claude disposition confirms an implementation obligation under the unchanged product contract.
- Approval basis: DEC-023 H5 (disposable local validation), DEC-024 W1 inputs. No cloud, no paid service, no product features, no auth changes.
- Scope executed: existing-template PoC only, pinned SHA `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`, no source changes (diff empty).

Codex PM intake corrections: original owner return is preserved in docs/testing/step-02-backend-intake/zcode-return.txt and the exact archived review packet. Only reporting/redaction changed; Codex did not replay backend tests or mutate source. Model/agent/session assertions are owner-reported for this manual execution.

## 1. Identities and environment

| Item | Value |
|---|---|
| Host | macOS darwin 27.0.0 arm64, user workspace `/Users/nguyenvanlan` |
| Command wrapper | `rtk` / `rtk proxy` on every shell command (RTK.md followed) |
| Go toolchain | go1.27.3 darwin/arm64, `GOTOOLCHAIN=auto`; go.mod requires `go 1.26.0` (minimum satisfied) |
| golangci-lint | v2.14.0 built with go1.27.1 at `/Users/nguyenvanlan/go/bin/golangci-lint` (CI-pinned version) |
| Docker | Engine 29.8.2, linux/arm64 |
| Missing from PATH (reported, not installed) | `psql` (used inside the container instead), `goose` CLI (migrations run through the app binary; goose v3.28.0 is a library dependency), `sqlc` CLI (Makefile pins `sqlc@v1.31.1` via `go run`, no install needed or performed) |
| Semble | `semble` present but non-functional: "MCP dependencies are not installed" (failure recorded; targeted reads used instead; nothing installed globally) |

## 2. Source and worktree (base == head, no source changes)

| Item | Value |
|---|---|
| Read-only snapshot | `/tmp/mattercontrol-step02-backend`, HEAD `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`, origin `https://github.com/lannguyenit598/go-hexa-template`, status clean, branch `main...origin/main`; preserved untouched |
| Worktree | `/tmp/mattercontrol-step021-backend` created via `git worktree add -b task/MC-002-be-poc d024e3e…`; verified absent before creation (path and branch did not exist) |
| Base / head | `d024e3e` / `d024e3e` — `git status` clean before and after all PoC steps; `bin/` is gitignored; go.mod/go.sum unchanged (`git diff` empty) |
| Changed paths | **none** (source diff empty; only untracked gitignored `bin/userapi`) |
| Binary | `bin/userapi` sha256 `ff973fb7883c16898e5cfef6bb4e80df0252abc17ff5235c52fdc7ebabd9ad03`, version stamp `d024e3e` |

## 3. Isolation and safety boundaries observed

- Session-start hook NOT executed (it creates a `userapi` SUPERUSER role/database and persists `TEST_DATABASE_URL`); verified no `DATABASE_URL`/`TEST_DATABASE_URL` existed in the session before assignment (`env` grep: none).
- `TEST_DATABASE_URL` consumers enumerated before assignment: `pgtest.FreshSchemaDSN` (per-test schema `t_<unixnano>`, dropped on cleanup), direct read in `user_repository_test.go`, Makefile `test-integration`/`check` env passing, CI workflow. Nothing at runtime consumes it; the API reads only `DATABASE_URL`.
- New disposable PostgreSQL container created (not the default compose DB/volume; compose never started); credentials random per-run; one original shell-trace line exposed the disposable DB password. Codex redacted the exported copy and the exact original task log after recording its original hash; synthetic data only. No unredacted export entered Git/review packets.
- No global installs; no OS permission bypasses; no volumes pruned or deleted; only owned processes/containers stopped; container and its anonymous volume retained (stopped) for OpenCode inspection.
- Owner source evidence: `/tmp/mc002be-evidence/` (20 logs and2 PID records); durable credential-safe exports and source/stored hashes: `docs/testing/step-02-backend-poc/manifest.json` (10-download, 11-build, 20-pg-container, 30/31-migrate, 32-schema-state, 40-make-test, 41-make-check, 50-docker-build, 51-image-manifest, 60-66 API runtime, 70-cleanup-state). Key outputs embedded below with credentials redacted.

## 4. Executed steps (UTC, argv, exit)

### 4.1 Dependency resolution and build — PASS

| UTC | Command | Exit | Result |
|---|---|---|---|
| 14:46:14 | `rtk proxy go mod download` | 0 | No output; go.mod/go.sum unchanged (baseline preserved) |
| 14:46:20 | `rtk proxy make build` (`CGO_ENABLED=0 go build -trimpath -ldflags "-X main.version=d024e3e" -o bin/userapi ./cmd/userapi`) | 0 | Binary 42,186,050 bytes |
| 14:52:48 | `./bin/userapi migrate` (no DATABASE_URL) | owner-reported1 | `DATABASE_URL is required for migrate` — owner-reported; dedicated raw output was not retained |

### 4.2 Disposable PostgreSQL container — PASS

| UTC | Command | Exit | Result |
|---|---|---|---|
| 14:53:xx | `rtk proxy docker network create --label org.mattercontrol.poc=mc002be mc002be-poc-net` | 0 | Net `20344aedfb01…`, driver bridge |
| 14:53:xx | `rtk proxy docker run -d --name mc002be-pg-20261024T1454Z --label org.mattercontrol.poc=mc002be --network mc002be-poc-net --memory=512m --cpus=1 --pids-limit=128 --publish 127.0.0.1:15455:5432 --health-cmd 'pg_isready -U mc002be -d mc002be_poc' --health-interval 2s --health-timeout 3s --health-retries 30 -e POSTGRES_USER=mc002be -e POSTGRES_PASSWORD=<random> -e POSTGRES_DB=mc002be_poc postgres:18-alpine` | 0 | Container `a34a25df7d34…`, healthy within seconds |

Manifest (redacted): image `postgres:18-alpine` digest `sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873`; memory 536,870,912 B; 1 CPU; pids 128; port `127.0.0.1:15455→5432`; network `mc002be-poc-net` (dedicated); mount: anonymous volume `45f0a3abfa47…` at `/var/lib/postgresql` (no named volume); DSN `postgres://mc002be:REDACTED@127.0.0.1:15455/mc002be_poc?sslmode=disable`; Docker endpoint: default Docker Desktop unix socket. Port 15455 verified unused beforehand (`nc -z`).

### 4.3 Explicit migrations (MIGRATE_ON_START=false honored) — PASS

| UTC | Command | Exit | Result |
|---|---|---|---|
| 14:54:43 | `DATABASE_URL=$DSN MIGRATE_ON_START=false ./bin/userapi migrate` (run 1) | 0 | versions 1–6 applied (0001_create_users … 0006_drop_outbox_unpublished_index) |
| 14:54:54 | same (one retained no-op rerun) | 0 | no "migration applied" lines — no-op |
| 14:54:5x | `psql` (in container) `SELECT version_id, is_applied … FROM goose_db_version` | 0 | rows 0–6 all applied at 2026-10-24T14:54:43Z; tables `goose_db_version`, `outbox`, `users`; `users` count 0 before tests |

### 4.4 Tests — package runs PASS; per-test skip counts UNVERIFIED

| UTC | Command | Exit | Result |
|---|---|---|---|
| 14:55:0x | `TEST_DATABASE_URL=$DSN rtk proxy make test` (`go test -race ./...`) | 0 | 11 packages ok;5 packages have no test files (incl. `internal/adapter/outbound/postgres` 3.567s, `internal/app` 8.267s); nonverbose output does not enumerate per-test skips; grep absence is not proof of zero skips |
| 14:56:31 | `TEST_DATABASE_URL=$DSN rtk proxy make check` (sqlc-check → gofmt → `go mod tidy -diff` → golangci-lint → `go test -race -count=1 ./...`) | 0 | 0 FAIL; lint/sqlc/tidy/gofmt silent (pass); PG tests ran again (residue: one synthetic `race@example.com` "Worker 2" row left by the suite's shared-table tests — synthetic, noted) |

### 4.5 Container image — PASS

| UTC | Command | Exit | Result |
|---|---|---|---|
| 14:55:49 | `rtk proxy docker build --label org.mattercontrol.poc=mc002be --build-arg VERSION=poc-d024e3e-20261024 -t mc002be/userapi:poc-d024e3e-20261024 .` | 0 | Existing Dockerfile unchanged: golang:1.26-alpine build → distroless/static-debian12:nonroot; local image ID `sha256:5d401294715c…`,43.2MB; not an attested registry/release digest |

### 4.6 Native API in PostgreSQL mode — PASS

Startup (14:57:31, PID 90601): `HTTP_ADDR=127.0.0.1:18091 STORAGE=postgres DATABASE_URL=$DSN READINESS_CHECK_DB=true MIGRATE_ON_START=false EVENTS_SINK=none LOG_LEVEL=info ./bin/userapi` → log `starting userapi addr=127.0.0.1:18091 storage=postgres version=d024e3e otel=false` (no telemetry credential; port 18091 verified unused). Exit 0 checks:

| Check | Expected | Actual |
|---|---|---|
| GET `/healthz` | 200 liveness | **200** `{"status":"ok"}` |
| GET `/readyz` | 200 with migrated reachable DB | **200** `{"status":"ready"}` |
| POST `/api/v1/users` synthetic `alice.poc@example.test` | 201 + ETag + Location | **201**, `ETag: "1"`, id `01a16e6b-25fd-72e6-8217-1eb9a1ed6644`, UUIDv7, version 1 |
| GET `/api/v1/users/{id}` readback | 200 same data | **200**, ETag "1" |
| GET `/api/v1/users` list | 200 includes user | **200** (also contains suite residue row, synthetic) |
| GET unknown id | 404 problem+json uniform | **404** `{"type":"about:blank",…,"detail":"resource not found"}` |
| POST invalid email | 422 + field errors | **422** `errors:[{field:"email",message:"must be a valid email address"}]` |
| POST duplicate email | 409 | **409** `a user with this email already exists` |
| PATCH with `If-Match: "1"` | 200, version 2 | **200**, `ETag: "2"` |
| PATCH stale `If-Match: "1"` | 412 | **412** Precondition Failed |
| goose_db_version during API run | unchanged (no auto-migrate) | Log62 numbers7/6/2 are interpreted as Goose row count/max version/User count from owner context; original SQL labels not retained. Raw32 separately lists applied rows0..6 |
| SIGTERM | graceful drain | `shutting down, draining` → `userapi stopped gracefully` |

### 4.7 Persistence across API restart — PASS

API restarted (14:58:47, PID 91126, same env): `GET /api/v1/users/01a16e6b-…` → **200**, name "Alice Poc Updated", `ETag: "2"`, version 2 — state survived restart (PostgreSQL system of record, not in-memory).

### 4.8 DB-unavailable behavior (container stopped under running API) — PASS with finding

With `docker stop mc002be-pg-20261024T1454Z` (exit 0) while the API ran:

| Check | Expected | Actual |
|---|---|---|
| GET `/healthz` | 200 (liveness independent of DB) | **200** |
| GET `/readyz` (READINESS_CHECK_DB=true) | 503 | **503** problem+json; log: `readiness check failed error="failed to connect to user=mc002be database=mc002be_poc … connection refused"` |
| GET `/api/v1/users` | error path, no data leak | **500** problem+json, no internals in body; log shows wrapped pgx error |

`docker start` → `/readyz` **200**, `/api/v1/users` **200** (recovery).

**Finding reviewed by actual Claude Code (architecture-relevant):** the template maps unexpected/persistence errors to generic 500 (`toProblem` falls through to 500; only context.DeadlineExceeded → 503). MatterControl's api-contracts require **503 `unavailable`** when the database is unreachable. The inbound adapter error mapping must be extended (classify pgx/pgconn connectivity failures as 503 `unavailable` with `retryAfter`). Actual Claude review d4633b32-7d45-4576-bd6b-22c73c716cc1 confirms the product-contract gap; native template characterization stands. No normative ADR change is required; future implementation must preserve hexagonal boundaries and unknown-outcome/idempotency semantics. No source change made. See ../reviews/step-02-backend-claude-disposition.md.

### 4.9 Invalid configuration — incomplete evidence; pending-migration guard PASS

| Check | Expected | Actual |
|---|---|---|
| `STORAGE=postgres` without `DATABASE_URL` | exit 1 | **owner-reported exit1/message** `DATABASE_URL is required when STORAGE=postgres`; raw65 has only unpaired exit markers, no argv/stderr |
| `STORAGE=bogus` | exit 1 | **owner-reported exit1/message** `STORAGE must be "memory" or "postgres"`; raw65 has only unpaired exit markers, no argv/stderr |
| `LOG_LEVEL=bogus` | exit 1 | **owner-reported exit1/message** `LOG_LEVEL: slog: level string "bogus": unknown name`; raw65 has only unpaired exit markers, no argv/stderr |
| API vs unmigrated DB `mc002be_pending` (created in same disposable container), `MIGRATE_ON_START=false` | fail startup before serving | **exit 1** `database has pending migrations: run `userapi migrate` first (or set MIGRATE_ON_START=true)` |

Liveness (200) stayed distinct from readiness (503) and from schema verification (startup guard) throughout.

## 5. Fixture manifest (synthetic only)

| Fixture | Value |
|---|---|
| User created via API | `alice.poc@example.test`, "Alice Poc" → "Alice Poc Updated", id `01a16e6b-25fd-72e6-8217-1eb9a1ed6644`, final version 2 |
| Suite residue | `race@example.com`, "Worker 2", version 7 — created by `make check` race tests in the shared DB schema (suite truncates but does not fully clean up), synthetic, retained only in the disposable container |
| `mc002be_pending` database | empty, deliberately unmigrated, created for the startup-guard check |
| Evidence privacy | Fixture names/emails are synthetic. A local test credential was present in original30 trace; source and exported task log were sanitized after inventory. Original/stored hashes and redaction action are explicit. No blanket statement about all workstation data or future logging is made |

## 6. Acceptance summary

| Acceptance item | Result |
|---|---|
| Dependency resolution (`go mod download`, lock unchanged) | **PASS** |
| Build (`make build`, binary + version stamp + sha256) | **PASS** |
| New disposable PostgreSQL container (unique name/label/port, capped resources, synthetic only) | **PASS** |
| Explicit migrations with `DATABASE_URL`, `MIGRATE_ON_START=false`, idempotent re-run | **PASS** |
| `make test` package run / per-test skips | Package exit0 supported; R01 requires per-test JSON/verbose evidence before claiming zero skips |
| `make check` (sqlc-check, gofmt, tidy -diff, golangci-lint v2.14.0, race tests) | **PASS** |
| Existing Dockerfile build (unique tag, digest recorded) | **PASS** |
| Native API startup PG-mode, healthz/readyz distinct | **PASS** |
| `/api/v1/users` create/read/list + 404/422/409 + If-Match 412 | **PASS** |
| Migration version verification + no auto-migration | **PASS** |
| Persistence across API restart | **PASS** |
| DB-unavailable liveness/readiness/API behavior + recovery | **PASS** (with 503-mapping finding) |
| Invalid configuration exits/messages | **R02 RECHECK_REQUIRED**; three exit1 markers retained, exact command/error pairs owner-reported |
| Pending-migrations startup guard | **PASS** |
| Environment-variable handling (all via env, no files/global state) | **PASS** |
| `go test -race` explicitly outside make | NOT_RUN (covered twice by make test / make check) |
| govulncheck | NOT_RUN (CI-only step, not part of `make check`; no network tooling installed) |
| Workers/Wasm compatibility (POC-02-02/06), product persistence harness (02-04), object lifecycle (02-05), full restore (02-07) | NOT_RUN / out of MC-002-BE scope — native success does not prove Workers compatibility |
| Frontend/integration PoC | NOT_RUN (Antigravity/Codex scope) |

## 7. Skips, risks, residual work

- Per-test skip counts are **UNVERIFIED** from the nonverbose retained runs; do not claim no skips. **MC002BE-R01** requires a bounded owner JSON/verbose rerun; **R02** requires paired invalid-config stdout/stderr/argv. Missing PATH tools (psql/goose/sqlc) were reported, not installed; none blocked execution.
- Retained for OpenCode verification: stopped container `mc002be-pg-20261024T1454Z` (with its anonymous volume and `mc002be_poc`/`mc002be_pending` databases), network `mc002be-poc-net`, image `mc002be/userapi:poc-d024e3e-20261024`, worktree `/tmp/mattercontrol-step021-backend` (branch `task/MC-002-be-poc`, clean). Nothing removed or pruned. Do not remove retained resources as part of intake; deleting an existing Docker volume still requires explicit authorization, even after review. The container is stopped/exited0; the later inspect Health.Status field is unhealthy despite last probe outputs exit0/FailingStreak0. Initial healthy-at-start is a separate timestamp; no new DB failure or exact cause of the terminal health value is inferred.
- Local/native evidence only: this does NOT prove Cloudflare Workers compatibility, production behavior, or $0 infrastructure cost (ADR-001 blockers TB-01/02 remain OPEN).
- Actual Claude Code architecture review returned (not merely an escalation label): (1) 500-vs-503 error mapping for DB unavailability; (2) no other architecture-impacting source change was needed — template compiles, tests, migrates, serves, and fails safe without modification.


## 8. Independent intake disposition

OpenCode session ses_e917e3944ffe6y18sR8sJysMln returned PASS_WITH_LIMITATIONS for native template characterization, with2 owner rechecks R01/R02 required before full acceptance of those criteria. M01: correct11 ok packages+5 no-test packages. M02: only one retained migration no-op. M03: original local trace and exported copy sanitized, pre/post hashes retained. M04: raw62 labels absent,7/6/2 interpretation qualified. M05: initial healthy and later stopped/unhealthy snapshots distinguished. Logs/HTTP exchanges corroborate runtime characterization; a clean500 body is a sample observation, not universal leakage proof. Source/.mod/.sum unchanged.

Actual Claude Code / claude-opus-5-5 confirms C01, an obligation for future MatterControl adapter implementation:503 /problems/unavailable+retryAfter under the unchanged approved contract. Its remediation/case list is advisory and NOT_RUN, not permission for a blanket500→503 conversion or new product code. Source also supports Echo HTTPError status mapping; the raw reviewer phrase that only deadline can ever yield503 is shorthand for the examined core-error branch, not exhaustive behavior. retryAfter units/header and any additional numeric policy remain unselected.

Full client-body behavior, role/Matter security, transaction recovery, adapter/cloud compatibility and deployment costs are unverified. R01/R02 follow-up is owned by actual ZCode; Codex does not substitute engineering execution. See ../implementation/handoffs/MC-002-ZCODE-RECHECK-PROMPT.md.

## 9. Actual R01/R02 recheck closure

The earlier nonverbose/invalid-config evidence limits above are historical for that first run. New owner evidence in step-02-backend-recheck/ supplies205 named test/subtest pass events,0fail/0namedskip from880 JSON lines,11 test-bearing packages+5 no-test packages; four complete argv/UTC/exit/stdout/stderr pairs all exit1. Binary/source unchanged. Actual OpenCode PASS_WITH_LIMITATIONS closes R01/R02; see ../reviews/step-02-backend-r01-r02-closure.md. Do not imply the old logs themselves acquired missing data, or that product C01/integration/Cloudflare/cost work passed. No further R01/R02 replay requested.
