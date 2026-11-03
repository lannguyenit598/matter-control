---
paths:
  - "internal/adapter/outbound/**/*.go"
  - "internal/adapter/outbound/postgres/migrations/*.sql"
  - "internal/adapter/outbound/postgres/queries/*.sql"
  - "internal/adapter/outbound/postgres/migrations_mattercontrol/*.sql"
  - "internal/adapter/outbound/postgres/queries_mattercontrol/*.sql"
  - "sqlc.yaml"
---

# Outbound adapters and persistence

- Outbound adapters are independent: no other outbound adapters, inbound adapters, Echo, or `internal/app` imports (enforced by depguard). Add new adapter paths to `outbound-adapters` in `.golangci.yml`.
- Repositories must satisfy the `port.UserRepository` comment contract and **pass `repotest.Run`**. Add new behavior to the shared suite first so every adapter is checked.
- Return bare sentinels (`port.ErrNotFound`, `port.ErrVersionConflict`, `domain.ErrEmailAlreadyExists`). Translate driver errors in `mapError`; never leak `pgx`/`pgconn`. Classify SQLSTATE first: wrap retryable codes (class `08`, `57P01`–`57P03`, `53300`, `40P01`, `40001`, `55P03`, `57014`) with `port.ErrUnavailable` (HTTP 503); every other `*pgconn.PgError` stays unexpected (500); a `*pgconn.ConnectError` maps to `port.ErrUnavailable` only when no `PgError` is in the chain; never classify by error text.
- `Update` uses compare-and-set on `version` in **one** `UPDATE ... WHERE id = $1 AND version = $n`, without `SELECT ... FOR UPDATE`. With outbox enabled, the update and event insert share a short transaction (`r.write`).
- New repository writes use `r.write` and call `r.appendEvent` on success so events commit with data (see `.claude/rules/messaging.md`).
- **MatterControl exception (scoped, not a relaxation):** legacy `r.write` rules above apply to legacy User writes only. The MatterControl spine (`postgres.MatterStore`, `matter_*.go`, `migrations_mattercontrol/`, `queries_mattercontrol/`, `mcsqlc/`) runs EVERY command in one unconditional `pgx` transaction that first locks the matter row `FOR UPDATE` — it must never run on the pool without a transaction, because the legacy helper legitimately skips the transaction when the outbox is disabled. Reads run in one REPEATABLE READ READ ONLY snapshot. Product and legacy schemas stay separate: never run one bundle's migrations or generated queries against the other's database. See `docs/mattercontrol-backend.md`.
- Runtime SQL lives in `postgres/queries/*.sql` as named sqlc queries with explicit columns; run `make sqlc-generate` and commit `sqlcgen/` with the change. Never edit `sqlcgen/` by hand, and do not duplicate generated SQL in Go. Handwritten SQL stays only in Goose (migrations, `PendingMigrations`) and tests.
- Parameterize SQL (`$1`, `@name`); do not concatenate values. Cast parameters (`sqlc.arg(n)::bigint`, `::text`) where sqlc would infer `int32` for LIMIT/OFFSET or a nullable `pgtype` type for a nullable column.
- Generated types (`sqlcgen.*`) stay inside the postgres adapter: convert at the boundary (`toDomain`, `domain.EmailFromStore` without revalidation), and keep pages non-nil (`make`), since `:many` returns nil for no rows.
- Writes run every query through the `q *sqlcgen.Queries` that `r.write` passes (bound to its transaction when the outbox is enabled); `r.queries` is pool-bound and would commit outside it. `TestOutbox_WriteAndEventShareOneTransaction` catches this.
- Traces must not contain parameter values (personal data): keep default `otelpgx` settings without `WithIncludeQueryParameters`.
- Migrations: **never change executable SQL in a merged migration**; add a new file. Use `/add-migration`. Comment-only translations must preserve SQL and goose directives.
- Runtime migration checks must be read-only. `goose.HasPending` creates `goose_db_version`, so check `to_regclass` first as in `PendingMigrations`.
