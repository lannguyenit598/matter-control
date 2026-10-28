package postgres

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"io/fs"
	"log/slog"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
	"github.com/pressly/goose/v3/lock"
)

//go:embed migrations_mattercontrol/*.sql
var mattercontrolEmbedded embed.FS

// mattercontrolMigrationsFS exposes the product migration bundle without any process-
// global migration state: a provider built from it touches only the target database.
func mattercontrolMigrationsFS() fs.FS {
	sub, err := fs.Sub(mattercontrolEmbedded, "migrations_mattercontrol")
	if err != nil {
		panic(err) // Only an incorrect embed path can cause this programming error.
	}
	return sub
}

// MigrateMatterControl applies the MatterControl product migrations with goose: its
// own advisory-locked connection, statement_timeout = 0 and the same 5s lock timeout
// as the legacy migrator. Only a fresh product database or per-test schema may receive
// this DDL; never point it at a legacy userapi database.
func MigrateMatterControl(ctx context.Context, dsn string, logger *slog.Logger) error {
	db, err := openMatterControlMigrationDB(dsn)
	if err != nil {
		return err
	}
	defer func() { _ = db.Close() }()

	locker, err := lock.NewPostgresSessionLocker()
	if err != nil {
		return err
	}
	provider, err := goose.NewProvider(goose.DialectPostgres, db, mattercontrolMigrationsFS(),
		goose.WithSessionLocker(locker),
		goose.WithSlog(logger),
	)
	if err != nil {
		return fmt.Errorf("create mattercontrol migration provider: %w", err)
	}
	results, err := provider.Up(ctx)
	if err != nil {
		return fmt.Errorf("apply mattercontrol migrations: %w", err)
	}
	for _, r := range results {
		logger.Info("mattercontrol migration applied", "version", r.Source.Version, "file", r.Source.Path, "duration", r.Duration.String())
	}
	return nil
}

// PendingMatterControlMigrations reports whether product migrations remain, read-only:
// goose_db_version is detected with to_regclass first, so an unmigrated database is
// not silently created here (same contract as PendingMigrations).
func PendingMatterControlMigrations(ctx context.Context, pool *pgxpool.Pool) (bool, error) {
	var hasVersionTable bool
	if err := pool.QueryRow(ctx, `SELECT to_regclass('goose_db_version') IS NOT NULL`).Scan(&hasVersionTable); err != nil {
		return false, fmt.Errorf("check mattercontrol migration table: %w", err)
	}
	if !hasVersionTable {
		return true, nil
	}
	db := stdlib.OpenDBFromPool(pool)
	defer func() { _ = db.Close() }() // Close only the wrapper, not the pool.
	provider, err := goose.NewProvider(goose.DialectPostgres, db, mattercontrolMigrationsFS())
	if err != nil {
		return false, fmt.Errorf("create mattercontrol migration provider: %w", err)
	}
	return provider.HasPending(ctx)
}

func openMatterControlMigrationDB(dsn string) (*sql.DB, error) {
	cfg, err := pgx.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse database url: %w", err)
	}
	cfg.RuntimeParams["statement_timeout"] = "0"
	cfg.RuntimeParams["lock_timeout"] = fmt.Sprint(migrationLockTimeout.Milliseconds())
	cfg.RuntimeParams["application_name"] = "mattercontrol-migrate"
	return stdlib.OpenDB(*cfg), nil
}
