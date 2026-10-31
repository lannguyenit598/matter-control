package app

// BFF state retention entry point (deploy-readiness finish, WP-6): bounded deletion of expired
// rows from mc_bff.state, run on a schedule with the maintenance role's DSN. The composition root
// owns environment parsing and the pool (cmd stays a thin wrapper by architecture rule); the
// deletion itself is internal/adapter/outbound/postgres.PurgeExpiredBFFState. Logs counts only —
// no keys, payloads, tenant data, and never the DSN. Receipts (B7) stay untouched.

import (
	"context"
	"log/slog"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/postgres"
)

// RunBFFCleanup executes one retention pass and returns the process exit code.
func RunBFFCleanup(ctx context.Context, logger *slog.Logger) int {
	dsn := os.Getenv("BFF_DATABASE_URL")
	if dsn == "" {
		logger.Error("BFF_DATABASE_URL is required (maintenance role DSN)")
		return 2
	}
	graceStr := os.Getenv("MC_BFF_RETENTION_GRACE")
	if graceStr == "" {
		graceStr = "24h"
	}
	grace, err := time.ParseDuration(graceStr)
	if err != nil || grace < 0 {
		logger.Error("MC_BFF_RETENTION_GRACE must be a non-negative duration", "got", graceStr)
		return 2
	}
	batchStr := os.Getenv("MC_BFF_CLEANUP_BATCH")
	if batchStr == "" {
		batchStr = "500"
	}
	batch, err := strconv.Atoi(batchStr)
	if err != nil || batch <= 0 {
		logger.Error("MC_BFF_CLEANUP_BATCH must be a positive integer", "got", batchStr)
		return 2
	}
	maxRowsStr := os.Getenv("MC_BFF_CLEANUP_MAX_ROWS")
	if maxRowsStr == "" {
		maxRowsStr = "0"
	}
	maxRows, err := strconv.ParseInt(maxRowsStr, 10, 64)
	if err != nil || maxRows < 0 {
		logger.Error("MC_BFF_CLEANUP_MAX_ROWS must be a non-negative integer", "got", maxRowsStr)
		return 2
	}

	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		logger.Error("open maintenance pool failed (DSN withheld)")
		return 1
	}
	defer pool.Close()

	start := time.Now()
	deleted, err := postgres.PurgeExpiredBFFState(ctx, pool, batch, maxRows, time.Now().Add(-grace))
	if err != nil {
		logger.Error("purge failed", "deleted_before_error", deleted, "error", err)
		return 1
	}
	logger.Info("bff state retention pass complete",
		"deleted", deleted,
		"retention_grace", grace.String(),
		"batch_size", batch,
		"max_rows", maxRows,
		"duration", time.Since(start).Round(time.Millisecond).String(),
	)
	return 0
}
