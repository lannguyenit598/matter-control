package postgres

// Bounded deletion of expired rows from mc_bff.state (BFF durable-session retention, ADR-006
// addendum; ops/adr006/README.md "Bounds, cleanup and rotation"). Expired rows are already
// unreadable through the BFF role; this job frees their physical storage. It is designed to run
// with the maintenance role, whose only rights are SELECT and DELETE on mc_bff.state
// (ops/adr006/db/b1-bff-grants.sql) — so the deletion path uses plain row-level DELETE (no
// FOR UPDATE row locks, which would need UPDATE privilege the role deliberately lacks). It logs
// counts only: no keys, no payloads, no tenant data. Receipts (B7) are deliberately untouched.

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// PurgeExpiredBFFState deletes mc_bff.state rows whose expires_at is before cutoff (the operator
// passes now minus the retention grace) in bounded batches, oldest first, until nothing past the
// cutoff remains or maxRows is reached (maxRows <= 0 means no total cap; each batch stays bounded
// by batchSize). It returns the number of rows deleted. Concurrent BFF writers are only
// momentarily blocked by per-row delete locks.
func PurgeExpiredBFFState(ctx context.Context, pool *pgxpool.Pool, batchSize int, maxRows int64, cutoff time.Time) (int64, error) {
	if batchSize <= 0 {
		return 0, fmt.Errorf("batch size must be positive, got %d", batchSize)
	}
	var total int64
	for {
		tag, err := pool.Exec(ctx, `
			WITH victim AS (
				SELECT ctid FROM mc_bff.state
				WHERE expires_at < $1
				ORDER BY expires_at
				LIMIT $2
			)
			DELETE FROM mc_bff.state s USING victim v WHERE s.ctid = v.ctid`, cutoff, batchSize)
		if err != nil {
			return total, fmt.Errorf("purge batch: %w", err)
		}
		deleted := tag.RowsAffected()
		total += deleted
		if deleted < int64(batchSize) || (maxRows > 0 && total >= maxRows) {
			return total, nil
		}
	}
}
