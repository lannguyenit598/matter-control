# Operations

Audience: whoever runs `mcapi`, the MatterControl product API. Configuration is read from environment variables only (12-factor) and validated as a whole at start: every problem is reported at once and the process exits with code 1.

## Commands

| Command | What it does |
|---|---|
| `mcapi` | Serve the HTTP API until SIGINT/SIGTERM |
| `mcapi migrate` | Apply the product migrations (`migrations_mattercontrol`) and exit |

Both commands need the full configuration below, because it is validated before the command is chosen. For a migrate-only job pass placeholders for the `MC_OIDC_*` values; `migrate` never reads the key file or contacts the identity provider.

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `MC_DATABASE_URL` | required | PostgreSQL URL of the **product** database. Never point it at another application's database |
| `MC_OBJECT_DIR` | required | Private directory for document bytes (created `0700`). Local/PoC adapter, not a production object store |
| `MC_OIDC_ISSUER` | required | The one canonical issuer; tokens from any other issuer are refused |
| `MC_OIDC_INTROSPECTION_URL` | required | Token introspection endpoint of that issuer |
| `MC_OIDC_AUDIENCE` | required | Audience every accepted token must contain (the API application's client id) |
| `MC_OIDC_API_KEY_FILE` | required | JSON key of the API application, used to sign the introspection client assertion. Keep mode `0600`; it is never printed or logged |
| `MC_OIDC_API_CLIENT_ID` | empty | When set, startup fails if the key file belongs to another application |
| `MC_OIDC_CACHE_TTL` | `0s` | Caches positive introspection results per token digest. A load shield only, **not** a revocation guarantee; `0s` disables it |
| `MC_HTTP_ADDR` | `127.0.0.1:8081` | Listen address. Containers must use `:8081` |
| `MC_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `MC_REQUEST_TIMEOUT` | `10s` | Per-request deadline |
| `MC_SHUTDOWN_DELAY` | `0s` | Wait after SIGTERM, still serving, before the listener closes (give load balancers time to drain) |
| `MC_SHUTDOWN_TIMEOUT` | `10s` | Drain budget for in-flight requests |
| `MC_MAX_UPLOAD_BYTES` | `26214400` | Upper bound of one upload (25 MiB) |
| `MC_MIGRATE_ON_START` | `false` | Development only: apply migrations at start. Production runs `mcapi migrate` separately |
| `MC_LOCAL_PEOPLE_DIRECTORY` | `false` | Local/dev only: enables the people-directory endpoint used to pick members. Production needs an organization boundary first |

OpenTelemetry uses the standard variables (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_SDK_DISABLED`); without an endpoint nothing is exported.

Security notes: use `https` for the issuer and introspection URLs. The configuration currently accepts `http` for any host, which sends bearer tokens and the client assertion in clear text; use `http` only for a loopback identity provider in development.

## Running

- **Local:** `make run` applies the migrations and starts the API (export the variables first, see `.env.example`).
- **Compose:** `make up` starts PostgreSQL, runs `mcapi migrate` once, then starts the API on `127.0.0.1:8081`. Set `MC_OIDC_ISSUER`, `MC_OIDC_INTROSPECTION_URL`, `MC_OIDC_AUDIENCE` and `MC_OIDC_API_KEY_FILE_HOST`; compose stops with a message when one is missing.
- **Image:** `docker build .` produces a `distroless/static` image running as `nonroot`, listening on `8081`, entry point `/mcapi`, with an empty `/data/objects` owned by the runtime user. The image has no shell and no HTTP client, so probe it from outside.

## Health and shutdown

- `GET /healthz` returns 200 while the process is up.
- `GET /readyz` returns 200 unless the process is draining; after SIGTERM it returns 503 for `MC_SHUTDOWN_DELAY`, the listener then closes and in-flight requests drain for up to `MC_SHUTDOWN_TIMEOUT`. It does **not** ping the database, so a 200 says nothing about database availability; requests made while the database is down fail individually with 503 `unavailable`.
- All product routes live under `/api/v1` and require a verified bearer token.

## Backups

Restore has been rehearsed locally with synthetic data only (`ops/p0-local/restore-rehearsal`). It is not a production recovery objective: no RPO/RTO has been agreed.
