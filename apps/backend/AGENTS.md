# MatterControl backend (`mcapi`): instructions for AI agents

The MatterControl product API in Go 1.26 + Echo v5 + PostgreSQL through pgx/v5 and sqlc (generated typed queries), with Hexagonal Architecture. Entry point: `cmd/mcapi`. References: `docs/mattercontrol-backend.md` (design), `docs/api.md` (HTTP contract), `docs/operations.md` (configuration and operations), and the shared contract `../../docs/implementation/p0-zcode-execution/local-contract.md`.

## Commands

| Task | Command |
|---|---|
| Required pre-commit checks | `make check`: `make sqlc-check`, gofmt, `go mod tidy -diff`, golangci-lint (including depguard), `go test -race -count=1 ./...` |
| Regenerate SQL queries | `make sqlc-generate` after changing `internal/adapter/outbound/postgres/queries_mattercontrol/*.sql`, `migrations_mattercontrol/*.sql` or `sqlc.yaml`; never edit `mcsqlc/` |
| PostgreSQL tests | Set `MC_TEST_DATABASE_URL=postgres://...` (or `make test-integration`, which starts the compose database). Each test creates and drops its own schema. Without it the PostgreSQL tests skip; state this in results |
| Run | `make run` (applies migrations first; needs the `MC_OIDC_*` variables and `MC_OBJECT_DIR`, see `.env.example`) |
| Migration | `MC_DATABASE_URL=... go run ./cmd/mcapi migrate` (the command validates the whole configuration, so the other `MC_*` values must be set) |
| Image / stack | `docker build .` builds the `mcapi` image; `make up` runs PostgreSQL + migrate + API through compose |

Tools: Go >= 1.26 and golangci-lint **v2.14.0**, built with Go >= the `go.mod` version or lint refuses to run. sqlc needs no install: the Makefile pins its version and runs it with `go run`. CI lives in the repository root: `../../.github/workflows/backend.yml`.

## Rules

Before editing or creating a file, read every rule whose paths match it.

| Editing | Read first |
|---|---|
| `internal/core/**` | `.claude/rules/core.md` |
| `internal/adapter/inbound/**` | `.claude/rules/http-adapter.md` |
| `internal/adapter/outbound/**`, `internal/adapter/outbound/postgres/{migrations_mattercontrol,queries_mattercontrol}/*.sql`, `sqlc.yaml` | `.claude/rules/persistence.md` |
| `cmd/**`, `internal/app/**`, `internal/config/**`, `internal/observability/**`, `.env.example`, `docker-compose.yml`, `Dockerfile` | `.claude/rules/composition-and-config.md` |
| `**/*_test.go`, `internal/adapter/outbound/repotest/**`, `internal/adapter/outbound/postgres/pgtest/**` | `.claude/rules/tests.md` |
| `go.mod`, `go.sum`, `.golangci.yml`, `Makefile`, `sqlc.yaml`, `../../.github/**` | `.claude/rules/tooling-and-deps.md` |
| `**/*.md` | `.claude/rules/docs.md` |

These rule files were written for the template this service started from and still mention `userapi`, outbox and `cmd/userapi`. Where a rule names something that no longer exists, follow its intent and fix the rule in the same change.

## Architecture: mandatory rules

- Imports point inward: `domain` <- `port` <- `service` <- adapter <- `internal/app` <- `cmd`. `internal/core/**` imports only the standard library and itself. depguard in `.golangci.yml` enforces this; fix code, **not** lint rules, when it fails.
- Inbound ports accept primitives (`string`, `*string`, `int`, `int64`); services convert and validate domain types. Results may use domain types.
- Errors: business rules in `domain` (`ValidationError`); shared use-case outcomes in `port` (`ErrNotFound`, `ErrForbidden`, ...). Repositories return bare sentinels; services wrap context (`fmt.Errorf("get thing: %w", err)`). Compare with `errors.Is`/`errors.As`. Core does not know HTTP status codes.
- No global core state: inject loggers, clocks, and ID generators through constructors/ports (`forbidigo` and `gochecknoglobals` enforce this in `internal/core`).
- Only the composition root knows adapters: `internal/app` wires them with Uber Fx (the only package importing fx); `cmd/mcapi` calls only `internal/app`.
- Every mutation goes through the central gate in `WorkService.execute` (membership + `policy.Decide*`, hidden resources are not-found, denials are audited); every read goes through `readSnapshot`. Do not add a path around them.

## Conventions

- All repository content must be in English: code comments, documentation, examples, configuration guidance, and agent instructions. **Only `README.vi.md` may use Vietnamese.** Commit subjects are imperative English; bodies explain *why*.
- Do not add abstractions without a use case.
- Prefer dependency releases at least 2 weeks old. Before upgrading, inspect their Go directive (`go mod download -json <module>@<version>`, then read `GoMod`): an upgrade may raise the repository minimum. Security fixes may be newer.
- Branches and PRs: **base is always `main`**, compare is the working branch. Do not push directly to `main`.

## Definition of done

1. `make check` passes; report whether PostgreSQL tests ran or skipped.
2. Observe tests for new behavior **fail before implementation** (TDD).
3. Update documentation in the same commit for changes to:
   - HTTP contracts -> `docs/api.md` and the shared contract file;
   - environment variables -> `docs/operations.md`, `.env.example`, `internal/config/product_test.go`;
   - architecture/dependency rules -> `docs/mattercontrol-backend.md` and `.golangci.yml`;
   - README behavior/content -> keep English `README.md` and Vietnamese `README.vi.md` aligned. Pure English translations may leave `README.vi.md` unchanged.
4. Verify new behavioral documentation claims (statuses, error messages, commands) by execution rather than source inspection alone.

## Skills

`.agents/skills/` (`add-use-case`, `add-migration`, `steward`) were written for the removed `userapi` template and are outdated until rewritten for `mcapi`.
