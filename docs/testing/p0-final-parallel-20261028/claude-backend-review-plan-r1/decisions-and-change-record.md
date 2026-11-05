# Decisions and change record: removing `userapi`, root CI

**Author:** Claude Code (`claude-sonnet-5-5`), not independent. **State:** working tree only; nothing staged, committed or pushed. Backup of `apps/backend` before the first edit: `/private/tmp/mc-userapi-removal-backup-20261028T170145Z.tar`. Exact file lists and hashes: `userapi-removal-delta.json` (65 removed, 6 added, 23 modified).

## Decisions recorded (PO, 2026-10-28)
1. **Delete `userapi`.** Done in the working tree (below).
2. **CI at the repository root with path filters.** Done: `.github/workflows/backend.yml`, `frontend.yml`, `.github/dependabot.yml`.
3. **CR-002.** Needs more explanation; see the end of the chat answer. Still `DECISION_REQUIRED`.
4. **Infrastructure.** Undecided; the PO is looking for free sources. Nothing in this change depends on a host: the product ships as a container image plus PostgreSQL.

## What changed
- **Removed:** `cmd/userapi`; `inbound/httpapi` (except one file, below); `outbound/{kafka,memory}`; `internal/outbox`; `repotest/contract.go`; the user domain, service and repository; the outbox store; the native migrations, queries and `sqlcgen`; `app/relay.go`; nested `apps/backend/.github`; `api.http`; `scripts/rename.sh`; `docs/{architecture,events,new-project}.md`; the `messaging` agent rule; 3 direct and 3 indirect Go dependencies (`huma`, `franz-go`, `kfake`).
- **Kept, extracted or rewritten:** `postgres/pool.go` (pool, ping, error mapping, `application_name=mcapi`), `httpapi/instrument.go` (only `Instrument`, because Codex's `product.go` imports it), `app.go` (shared lifecycle helpers only), `config.go` (parser only), `port.go` (`Clock` only), `domain/errors.go`, `system.go`, `Dockerfile`, `docker-compose.yml`, `Makefile`, `sqlc.yaml`, `.golangci.yml` (stale depguard rules removed), `.env.example`, `AGENTS.md`, `README.md`, `README.vi.md`, `docs/operations.md`.
- **Not touched (Codex was editing them):** `product.go`, `config/product.go`, `port/{identity,workspace}.go`, `handlers.go`, `server.go`, `server_test.go`, `identity_resolver.go`, the `matter.sql` queries and `mcsqlc`, the member-candidate files, `docs/api.md`. Their hashes are unchanged from my first snapshot.

## Verification (all run on the final tree, `apps/backend`)
| Check | Result |
|---|---|
| `make sqlc-check`, gofmt, `go mod tidy -diff`, `go vet ./...`, `go build ./...` | exit 0 |
| `golangci-lint run ./...` | 2 issues, both goimports formatting in Codex's new test files (`member_candidates_test.go`, `people_directory_test.go`), identical to the baseline before my edits; no new issue |
| depguard still rejects violations | temporary files confirmed rejection for `cmd` (pgx), `core` (net/http), inbound adapters (fx); removed afterwards |
| `go test -race -count=1 ./...`, no database | 404 pass, 109 skip (PostgreSQL), 0 fail (before: 586 pass, 144 skip) |
| Test accounting | the 132 vanished top-level tests all sit in removed code or were bound to it (httpapi 33, outbox 15, service 15, app 17, postgres 29, kafka 7, domain 7, config 6, memory 1, system 1, matter 1). The only product-relevant losses are BR-13 (real-PostgreSQL fault tests) and BR-17 (hook-order test) |
| `docker build` | succeeds; image 38 MB, user `nonroot`, entrypoint `/mcapi`, port 8081; refuses to start with no configuration; test image removed |
| `docker compose config` | fails fast with a message when a required variable is missing; parses when set; no container started |
| CI skip guard | script from the workflow passes on the earlier real PostgreSQL run (4 env-gated skips) and fails on a no-DB run, listing the PG tests |
| CI migrate step | with the placeholder values, config validation passes and `mcapi migrate` stops only at the database connection |
| `govulncheck` | 0 vulnerabilities affect the code; 2 advisories in `golang.org/x/net@v0.60.0` (GO-2026-6866, GO-2026-6860, fixed in v0.62.0) are not called |

**Not executed:** GitHub Actions (`NOT_EXECUTED_ON_GITHUB`; YAML parsed and each command run locally); the PostgreSQL suites (no authorization to use a database in this pass; the CI skip guard and the earlier 765-pass run are the only evidence); `docker compose up` end to end and the image against a real database.

## New findings
| ID | Sev | Finding |
|---|---|---|
| BR-10 | P3 | `/readyz` does not ping the database (`product.go` passes `nil`), so 200 says nothing about DB availability. Documented in `operations.md`; fix is in Codex's file |
| BR-11 | P3 | `mcapi migrate` demands the full configuration (OIDC values and key path) just to migrate; a deployment migrate job must carry them. Fix is in `config/product.go` (Codex's file) |
| BR-12 | INFO | `golang.org/x/net` advisories above; dependabot will propose the bump |
| BR-13 | P3 | **Lost coverage:** the 7 `TestFaults_*` real-PostgreSQL fault tests (connection refused, wrong password, missing database or table, terminated connection, statement timeout under a row lock, pool acquire timeout) plus `TestStatementTimeout_IsUnavailable` were bound to the removed `UserRepository`. `map_error_test.go` still covers the classification by unit test. Port them to `MatterStore` |
| BR-14 | P3 | Frontend workflow still pins `pnpm/action-setup@v6`, `actions/setup-node@v7`, `actions/upload-artifact@v7` by tag (GitHub is not reachable from here to resolve SHAs); the nested `apps/frontend/.github` is now an inert duplicate in Codex's area |
| BR-15 | P3 | `httpapi/instrument.go` exists only because `product.go` imports `httpapi.Instrument`; move it next to `internal/observability` and delete the package |
| BR-16 | P3 | `docs/api.md` still carries the whole removed `/users` reference (about lines 12-197); outdated: `.agents/skills/{add-migration,add-use-case,steward}`, `.claude/hooks/session-start.sh` (creates a `userapi` DB role), `.claude/rules/{composition-and-config,tooling-and-deps}.md` and `docs/mattercontrol-backend.md` |
| BR-17 | P3 | The hook-order tests for the old `Run` graph were removed with it; the product graph has no hook-order test (`TestProductGraph_ResolvesEveryDependency` remains) |
| BR-18 | INFO | Module path `github.com/example/userapi` renamed? **No**, deliberately deferred: it touches every import including Codex's files |

## Status of the plan
Phase 1 (delivery) and Phase 2 (template removal) are done in the working tree and unreviewed. Phase 3-6 unchanged. Review request: non-author review of the exact working tree once Codex's backend edits settle, then commit.
