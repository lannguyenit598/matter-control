# MatterControl backend

`mcapi` is the MatterControl product API: Go 1.26, Echo v5, PostgreSQL (pgx/v5 + sqlc), Hexagonal Architecture. It authenticates callers by introspecting bearer tokens at an OpenID Connect issuer and enforces workspace and matter membership on every operation.

| | |
|---|---|
| Entry point | `cmd/mcapi` (`mcapi` serves, `mcapi migrate` migrates) |
| Design | [docs/mattercontrol-backend.md](docs/mattercontrol-backend.md) |
| HTTP contract | [docs/api.md](docs/api.md) and the shared contract in `../../docs/implementation/p0-zcode-execution/local-contract.md` |
| Configuration and operations | [docs/operations.md](docs/operations.md), [.env.example](.env.example) |
| Rules for contributors and agents | [AGENTS.md](AGENTS.md) |

## Quick start

```bash
cp .env.example .env        # fill the required MC_* values, then export them
make test                   # unit, HTTP and memory-contract tests; no database needed
make test-integration       # also the PostgreSQL contract suites (starts the compose database)
make check                  # everything CI runs: sqlc, gofmt, tidy, lint, tests
make run                    # applies the migrations, then serves on 127.0.0.1:8081
make up                     # PostgreSQL + migrate + API through docker compose
```

`make help` lists every target. The Postgres suites create and drop their own schemas, so they are safe on a development database.

## Layout

```text
cmd/mcapi                       entry point
internal/core/{domain,port,service}   business rules, ports, use cases (stdlib only)
internal/adapter/inbound/productapi   Echo handlers and the problem+json error mapping
internal/adapter/outbound/*           postgres, objectstore, sheet (CSV/XLSX), identity/zitadel, system
internal/app                    composition root (Uber Fx), the only place that wires adapters
internal/config, internal/observability   configuration and OpenTelemetry
```

Dependency direction and the lint rules that enforce it are described in [AGENTS.md](AGENTS.md).

## CI

GitHub Actions run from the repository root: `../../.github/workflows/backend.yml` (lint, tests against PostgreSQL, govulncheck, image build).
