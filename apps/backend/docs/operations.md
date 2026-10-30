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
| `MC_OBJECT_BACKEND` | `fs` | Where document bytes live: `fs` (local directory, local/PoC) or `r2` (private Cloudflare R2 bucket). **A deployed API (Cloud Run: per-instance, ephemeral disk) must use `r2`**; the default `fs` would lose documents |
| `MC_OBJECT_DIR` | required for `fs` | Private directory for document bytes (created `0700`). Local/PoC adapter, not a production object store |
| `MC_R2_ENDPOINT` | required for `r2` | `https://<account>.r2.cloudflarestorage.com` (or the jurisdiction form). `https`, or `http` only for a loopback host |
| `MC_R2_BUCKET` | required for `r2` | Private bucket (no public access, no custom public domain) |
| `MC_R2_ACCESS_KEY_ID`, `MC_R2_SECRET_ACCESS_KEY` | required for `r2` | R2 API token limited to this bucket, Object Read & Write only. Supply from a secret store; never commit or log. Rotate by issuing a new token, deploying it, then revoking the old one |
| `MC_OIDC_ISSUER` | required | The one canonical issuer; tokens from any other issuer are refused. `https`, or `http` only for a loopback host |
| `MC_OIDC_INTROSPECTION_URL` | required | Token introspection endpoint of that issuer. `https`, or `http` only for a loopback host |
| `MC_OIDC_AUDIENCE` | required | Audience every accepted token must contain (the API application's client id) |
| `MC_OIDC_API_KEY_FILE` | required | JSON key of the API application, used to sign the introspection client assertion. Keep mode `0600`; it is never printed or logged |
| `MC_OIDC_API_CLIENT_ID` | empty | When set, startup fails if the key file belongs to another application |
| `MC_OIDC_CACHE_TTL` | `0s` | Caches positive introspection results per token digest. A load shield only, **not** a revocation guarantee; `0s` disables it |
| `MC_HTTP_ADDR` | `127.0.0.1:8081` | Listen address. Containers must use `:8081` |
| `MC_LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error` |
| `MC_REQUEST_TIMEOUT` | `10s` | Per-request deadline |
| `MC_TRANSFER_TIMEOUT` | `60s` | Deadline for document upload/content download, import preview/commit, export and bulk commit. Must be positive. Local engineering default, not a production SLA; measure deployed workload before release. Other routes keep `MC_REQUEST_TIMEOUT`. Server read timeout is at least this budget (minimum 30s); write timeout is the larger request budget plus 5s |
| `MC_SHUTDOWN_DELAY` | `0s` | Wait after SIGTERM, still serving, before the listener closes (give load balancers time to drain) |
| `MC_SHUTDOWN_TIMEOUT` | `10s` | Drain budget for in-flight requests |
| `MC_MAX_UPLOAD_BYTES` | `26214400` | Upper bound of one upload (25 MiB) |
| `MC_MIGRATE_DATABASE_URL` | empty | Optional PostgreSQL URL of the **schema owner**, used only by `mcapi migrate` and `MC_MIGRATE_ON_START`. Empty means migrations use `MC_DATABASE_URL`. Set it in production so the serving process connects as a role with data rights only (SELECT/INSERT/UPDATE/DELETE and sequence usage; no DDL, no table ownership) and a bug or injection in the API cannot alter the schema or drop the append-only triggers. Not yet verified against a real database with a split role: run the PostgreSQL suite as the runtime role before relying on it |
| `MC_MAX_IN_FLIGHT` | `0` (unlimited) | Maximum concurrent `/api/v1` requests. Over the cap the API answers at once with `503` `urn:mc:unavailable`, `retryable: true` and `Retry-After: 1`, before the request is read or executed (a refused command was never applied). `/healthz` and `/readyz` are never limited. The number is a workload decision for the Product Owner, so it is off by default; there is still no per-user rate limit |
| `MC_MIGRATE_ON_START` | `false` | Development only: apply migrations at start. Production runs `mcapi migrate` separately |
| `MC_LOCAL_PEOPLE_DIRECTORY` | `false` | Local/dev only: enables the people-directory endpoint used to pick members. Production needs an organization boundary first |

OpenTelemetry uses the standard variables (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`, `OTEL_SDK_DISABLED`); without an endpoint nothing is exported.

Security notes: the issuer and introspection URLs must use `https`. Plain `http` is accepted only when the host is `localhost` or a loopback IP (`127.0.0.0/8`, `::1`), for a development identity provider on the same machine; any other `http` host fails startup with `must use https unless the host is loopback`, because bearer tokens and the client assertion would cross the network in clear text.

## Running

- **Local:** `make run` applies the migrations and starts the API (export the variables first, see `.env.example`).
- **Compose:** `make up` starts PostgreSQL, runs `mcapi migrate` once, then starts the API on `127.0.0.1:8081`. Set `MC_OIDC_ISSUER`, `MC_OIDC_INTROSPECTION_URL`, `MC_OIDC_AUDIENCE` and `MC_OIDC_API_KEY_FILE_HOST`; compose stops with a message when one is missing.
- **Image:** `docker build .` produces a `distroless/static` image running as `nonroot`, listening on `8081`, entry point `/mcapi`, with an empty `/data/objects` owned by the runtime user. The image has no shell and no HTTP client, so probe it from outside.

## Health and shutdown

- `GET /healthz` returns 200 while the process is up.
- `GET /readyz` pings the product database with a 500ms deadline (also honors request cancellation), returning 503 if that fails or the process is draining. The probe response hides database error details. After SIGTERM it returns 503 for `MC_SHUTDOWN_DELAY`, the listener then closes and in-flight requests drain for up to `MC_SHUTDOWN_TIMEOUT`; on expiry, request contexts are canceled and connections close before the pool closes.
- All product routes live under `/api/v1` and require a verified bearer token.

When `K_SERVICE` is nonempty, configuration rejects `MC_OBJECT_BACKEND=fs` (including its default); use `r2`. Local filesystem mode remains available when `K_SERVICE` is absent or empty. This guard does not prove deployment readiness.

A request deadline after a possible write means OUTCOME_UNKNOWN. Reconcile using the original receipt/key; do not blindly replay writes or mint a replacement key. The 60s transfer budget allows a 25 MiB upload at 1 MiB/s that cannot fit the former 10s context; it does not prove a full-size workload completes. Database statements remain bounded to 5s individually.

## Backups

Restore has been rehearsed locally with synthetic data only (`ops/p0-local/restore-rehearsal`). It is not a production recovery objective: no RPO/RTO has been agreed.
