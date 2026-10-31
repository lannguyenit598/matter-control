// mc-bff-cleanup: bounded operator job that deletes expired rows from mc_bff.state (BFF durable
// session/attempt retention; ADR-006 addendum). It runs anywhere the pilot schedules a job (Cloud
// Run Job, VM timer) using the maintenance role's DSN — that role's only rights are SELECT and
// DELETE on mc_bff.state (ops/adr006/db/b1-bff-grants.sql). Logs batch counts only: no keys, no
// payloads, no tenant data, and no DSN is ever printed. Receipt retention (B7) stays disabled.
//
//	Env: BFF_DATABASE_URL            required — maintenance-role DSN (sslmode=verify-full remotely)
//	     MC_BFF_RETENTION_GRACE      default 24h — rows are deleted once expires_at < now - grace
//	     MC_BFF_CLEANUP_BATCH        default 500 — rows per DELETE batch
//	     MC_BFF_CLEANUP_MAX_ROWS     default 0 (no total cap; the loop stops when nothing remains)
//
// Environment parsing and pool wiring live in internal/app (the composition root); this command
// is a thin wrapper by architecture rule.
package main

import (
	"context"
	"log/slog"
	"os"

	"leonx.me/matter-control/internal/app"
)

func main() {
	os.Exit(app.RunBFFCleanup(context.Background(), slog.New(slog.NewJSONHandler(os.Stdout, nil))))
}
