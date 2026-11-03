// Package postgres provides PostgreSQL storage through pgx/v5.
// This is the ONLY storage adapter area that knows SQL and database drivers.
package postgres

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/exaring/otelpgx"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/core/port"
)

const uniqueViolation = "23505"

// unavailableSQLSTATE reports whether a PostgreSQL SQLSTATE is a transient connection or
// server fault that HTTP clients may retry. All other SQLSTATEs (authentication 28xxx,
// missing database 3D000, privilege 42501, schema 42xxx, data 22xxx, unmapped constraint
// violations) stay unexpected errors: misconfiguration must never become a retryable 503.
func unavailableSQLSTATE(code string) bool {
	switch code {
	case "57P01", "57P02", "57P03", // administrator shutdown / startup
		"53300", // too_many_connections
		"40P01", // deadlock_detected
		"40001", // serialization_failure
		"55P03", // lock_not_available
		"57014": // query_canceled: statement_timeout or pg_cancel_backend
		return true
	}
	return strings.HasPrefix(code, "08") // connection_exception class
}

// PoolOptions configures the connection pool. Zero uses pgx defaults.
//
// Always set MaxConns explicitly: pgx defaults to max(4, runtime.NumCPU()), and in a
// container NumCPU reports the NODE's core count rather than the pod CPU limit.
// A 1-CPU pod on a 64-core node may open 64 connections; multiplied by replicas, this can
// exceed PostgreSQL max_connections (default 100).
type PoolOptions struct {
	MaxConns        int32
	MinConns        int32
	MaxConnLifetime time.Duration
	MaxConnIdleTime time.Duration
	// StatementTimeout sets the server-side statement_timeout to bound queries even after
	// the client leaves (context cancellation does not always reach the server).
	StatementTimeout time.Duration
}

// NewPool creates a pool without checking connectivity: pgx connects on first use, or in the
// background when MinConns > 0. The composition root pings it in a lifecycle start hook (see Ping).
func NewPool(ctx context.Context, dsn string, opts PoolOptions) (*pgxpool.Pool, error) {
	cfg, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return nil, fmt.Errorf("parse database url: %w", err)
	}
	if opts.MaxConns > 0 {
		cfg.MaxConns = opts.MaxConns
	}
	if opts.MinConns > 0 {
		cfg.MinConns = opts.MinConns
	}
	if opts.MaxConnLifetime > 0 {
		cfg.MaxConnLifetime = opts.MaxConnLifetime
	}
	if opts.MaxConnIdleTime > 0 {
		cfg.MaxConnIdleTime = opts.MaxConnIdleTime
	}
	if opts.StatementTimeout > 0 {
		cfg.ConnConfig.RuntimeParams["statement_timeout"] = strconv.FormatInt(opts.StatementTimeout.Milliseconds(), 10)
	}
	cfg.ConnConfig.RuntimeParams["application_name"] = "mcapi"
	// Trace each query (SQL only, NEVER parameter values that could leak personal data)
	// and pool acquisition waits, exposing connection pool exhaustion in traces.
	// Global providers make this a no-op when OpenTelemetry is disabled.
	cfg.ConnConfig.Tracer = otelpgx.NewTracer()

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("create pool: %w", err)
	}
	// Pool metrics (busy/idle connections, acquisition wait...): the first signals to check
	// when latency rises while database CPU remains low.
	if err := otelpgx.RecordStats(pool); err != nil {
		pool.Close()
		return nil, fmt.Errorf("record pool stats: %w", err)
	}
	return pool, nil
}

// Ping checks connectivity, bounded to 5s so an unreachable database fails startup promptly.
func Ping(ctx context.Context, pool *pgxpool.Pool) error {
	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()
	if err := pool.Ping(ctx); err != nil {
		return fmt.Errorf("ping database: %w", err)
	}
	return nil
}

// mapError translates driver errors into core errors so core never sees pgx.
//
// SQLSTATE is classified FIRST: a *pgconn.PgError in the chain decides the outcome even when
// a ConnectError wraps it, so an authentication failure inside a connect attempt stays an
// unexpected error. Only a chain without any PgError may classify a typed *pgconn.ConnectError
// as unavailability. Text is never classification input (no string matching).
func mapError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return port.ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		if unavailableSQLSTATE(pgErr.Code) {
			return fmt.Errorf("postgres: %w: %w", port.ErrUnavailable, err)
		}
		return fmt.Errorf("postgres: %w", err)
	}
	var connErr *pgconn.ConnectError
	if errors.As(err, &connErr) {
		return fmt.Errorf("postgres: %w: %w", port.ErrUnavailable, err)
	}
	return fmt.Errorf("postgres: %w", err)
}
