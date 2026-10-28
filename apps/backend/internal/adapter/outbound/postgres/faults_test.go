package postgres

// Real-fault integration tests (C01-NATIVE A7/A8 evidence): each test injects a genuine
// PostgreSQL/pgx failure, records the actual error chain observed (types are asserted, not
// assumed), and asserts the mapError classification. Skips without TEST_DATABASE_URL.
//
// All statement-level database access goes through the generated sqlc queries (bound
// parameters) or argument-free fixed SQL strings; no value is ever interpolated into SQL.

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/url"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/example/userapi/internal/adapter/outbound/postgres/pgtest"
	"github.com/example/userapi/internal/adapter/outbound/postgres/sqlcgen"
	"github.com/example/userapi/internal/adapter/outbound/system"
	"github.com/example/userapi/internal/core/domain"
	"github.com/example/userapi/internal/core/port"
)

func faultDSN(t *testing.T) string {
	t.Helper()
	base := os.Getenv("TEST_DATABASE_URL")
	if base == "" {
		t.Skip("TEST_DATABASE_URL not set; skipping PostgreSQL integration test")
	}
	return base
}

func quietLogger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

// observeChain records the concrete pgx types behind a real fault so the evidence shows the
// actual API shape, then reports whether each typed predicate matches.
func observeChain(t *testing.T, err error) (pgCode string, isConnectError bool) {
	t.Helper()
	t.Logf("observed fault error: type=%T message=%q", err, err.Error())
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		t.Logf("observed *pgconn.PgError: code=%s message=%q", pgErr.Code, pgErr.Message)
		pgCode = pgErr.Code
	}
	var connErr *pgconn.ConnectError
	isConnectError = errors.As(err, &connErr)
	t.Logf("observed *pgconn.ConnectError in chain: %v", isConnectError)
	return pgCode, isConnectError
}

func TestFaults_ConnectionRefused_IsUnavailable(t *testing.T) {
	base := faultDSN(t)
	// Reserve then close a loopback port so the dial fails with connection refused.
	ln, err := (&net.ListenConfig{}).Listen(context.Background(), "tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	closedPort := ln.Addr().(*net.TCPAddr).Port
	if err := ln.Close(); err != nil {
		t.Fatal(err)
	}

	u, err := url.Parse(base)
	if err != nil {
		t.Fatal(err)
	}
	u.Host = net.JoinHostPort("127.0.0.1", fmt.Sprintf("%d", closedPort))
	dsn := u.String()

	ctx := context.Background()
	pool, err := NewPool(ctx, dsn, PoolOptions{MaxConns: 1, StatementTimeout: 2 * time.Second})
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	repo := NewUserRepository(pool, false)

	err = repo.Create(ctx, mustUser(t, "refused@example.com"))
	if !errors.Is(err, port.ErrUnavailable) {
		t.Fatalf("connection refused must classify as port.ErrUnavailable, got %v", err)
	}
	_, isConnectError := observeChain(t, err)
	if !isConnectError {
		t.Fatalf("expected a *pgconn.ConnectError in the observed chain; got %T", err)
	}
}

func TestFaults_WrongPassword_IsNotUnavailable(t *testing.T) {
	base := faultDSN(t)
	u, err := url.Parse(base)
	if err != nil {
		t.Fatal(err)
	}
	user := u.User.Username()
	u.User = url.UserPassword(user, "definitely-not-the-password")
	dsn := u.String()

	ctx := context.Background()
	pool, err := NewPool(ctx, dsn, PoolOptions{MaxConns: 1, StatementTimeout: 2 * time.Second})
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	repo := NewUserRepository(pool, false)

	err = repo.Create(ctx, mustUser(t, "authfail@example.com"))
	if errors.Is(err, port.ErrUnavailable) {
		t.Fatalf("28P01 authentication failure must stay an unexpected error, got %v", err)
	}
	pgCode, isConnectError := observeChain(t, err)
	t.Logf("wrong-password real chain: SQLSTATE=%q ConnectError=%v", pgCode, isConnectError)
	if pgCode != "28P01" {
		t.Fatalf("expected real SQLSTATE 28P01, got %q (err %v)", pgCode, err)
	}
}

func TestFaults_MissingDatabase_IsNotUnavailable(t *testing.T) {
	base := faultDSN(t)
	u, err := url.Parse(base)
	if err != nil {
		t.Fatal(err)
	}
	u.Path = "/no_such_database_c01"
	dsn := u.String()

	ctx := context.Background()
	pool, err := NewPool(ctx, dsn, PoolOptions{MaxConns: 1, StatementTimeout: 2 * time.Second})
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	repo := NewUserRepository(pool, false)

	err = repo.Create(ctx, mustUser(t, "nodb@example.com"))
	if errors.Is(err, port.ErrUnavailable) {
		t.Fatalf("3D000 invalid_catalog_name must stay an unexpected error, got %v", err)
	}
	pgCode, _ := observeChain(t, err)
	if pgCode != "3D000" {
		t.Fatalf("expected real SQLSTATE 3D000, got %q (err %v)", pgCode, err)
	}
}

func TestFaults_TerminatedConnection_IsUnavailable(t *testing.T) {
	dsn := faultDSN(t)
	ctx := context.Background()

	admin, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = admin.Close(ctx) }()
	victim, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = victim.Close(ctx) }()

	// Argument-free server-side calls only; the terminate below passes a numeric pid.
	var pid int64
	if err := victim.QueryRow(ctx, "SELECT pg_backend_pid()").Scan(&pid); err != nil {
		t.Fatal(err)
	}
	started := make(chan struct{})
	terminated := make(chan error, 1)
	go func() {
		<-started
		_, err := admin.Exec(ctx, "SELECT pg_terminate_backend($1)", pid)
		terminated <- err
	}()
	close(started)

	_, execErr := victim.Exec(ctx, "SELECT pg_sleep(4)") // fault substrate, bounded by the terminate
	if execErr == nil {
		t.Skip("pg_sleep finished before the termination arrived; fault not injected")
	}
	if err := <-terminated; err != nil {
		t.Fatalf("pg_terminate_backend: %v", err)
	}
	mapped := mapError(execErr)
	if !errors.Is(mapped, port.ErrUnavailable) {
		t.Fatalf("57P01 termination must classify as port.ErrUnavailable, got %v", mapped)
	}
	pgCode, _ := observeChain(t, execErr)
	if pgCode != "57P01" {
		t.Fatalf("expected real SQLSTATE 57P01, got %q (err %v)", pgCode, execErr)
	}
}

func TestFaults_StatementTimeoutUnderRowLock_IsUnavailableAndRolledBack(t *testing.T) {
	dsn := pgtest.FreshSchemaDSN(t) // skips without TEST_DATABASE_URL
	ctx := context.Background()
	if err := Migrate(ctx, dsn, quietLogger()); err != nil {
		t.Fatal(err)
	}

	// Fixed synthetic UUIDv7-shaped identifier; all row access goes through generated queries.
	const lockedID = "01a15359-aa28-7a00-a380-0000000000c1"
	clock := &system.Clock{}
	u, err := domain.NewUser(domain.UserID(lockedID), "locked@example.com", "Locked", clock.Now())
	if err != nil {
		t.Fatal(err)
	}
	base := NewUserRepository(mustPool(t, ctx, dsn, 0), false)
	if err := base.Create(ctx, u); err != nil {
		t.Fatal(err)
	}

	// Locker session: run the generated compare-and-set UPDATE inside an open transaction, so
	// the row lock is held until the blocked update has failed. The transaction rolls back:
	// the locker never commits anything.
	lockErr := make(chan error, 1)
	locked := make(chan struct{})
	done := make(chan struct{})
	released := make(chan struct{})
	locker, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	// The body defer (close done) runs before cleanups: the goroutine is released on every
	// exit path, then the cleanup waits for the rollback to land before closing the session.
	defer close(done)
	t.Cleanup(func() { <-released; _ = locker.Close(ctx) })
	go func() {
		defer close(released)
		tx, err := locker.Begin(ctx)
		if err != nil {
			lockErr <- fmt.Errorf("begin: %w", err)
			return
		}
		q := sqlcgen.New(tx)
		row, err := q.GetUser(ctx, lockedID)
		if err != nil {
			lockErr <- fmt.Errorf("lock read: %w", err)
			_ = tx.Rollback(ctx)
			return
		}
		if _, err := q.UpdateUser(ctx, sqlcgen.UpdateUserParams{
			Email:           row.Email,
			Name:            row.Name, // unchanged values: only the row lock matters
			UpdatedAt:       row.UpdatedAt,
			Version:         row.Version,
			ID:              lockedID,
			ExpectedVersion: row.Version,
		}); err != nil {
			lockErr <- fmt.Errorf("lock update: %w", err)
			_ = tx.Rollback(ctx)
			return
		}
		close(locked) // row lock acquired; the blocked update may start now
		<-done
		_ = tx.Rollback(ctx) // release the lock; nothing was committed
	}()
	select {
	case err := <-lockErr:
		t.Fatal(err)
	case <-locked:
	}
	t.Cleanup(func() { <-released }) // the rollback must land before the deferred Close

	// Victim pool: short statement_timeout, so the blocked UPDATE fails with 57014, bounded
	// by the timeout itself rather than a test sleep.
	slow := NewUserRepository(mustPool(t, ctx, dsn, 400*time.Millisecond), false)
	next, err := u.Apply(domain.Changes{Name: ptr("Renamed")}, clock.Now())
	if err != nil {
		t.Fatal(err)
	}
	updateErr := slow.Update(ctx, next, u.Version)
	if !errors.Is(updateErr, port.ErrUnavailable) {
		t.Fatalf("57014 statement timeout under a row lock must classify as port.ErrUnavailable, got %v", updateErr)
	}
	var mapped *pgconn.PgError
	if !errors.As(updateErr, &mapped) || mapped.Code != "57014" {
		t.Fatalf("expected SQLSTATE 57014 in the chain, got %v", updateErr)
	}

	// The failed update is known not to have executed: after the locker rolls back, the row
	// keeps its original values and version. (An unknown-commit failure must never be
	// described as rolled back; here the outcome is known because the statement timed out
	// while waiting for the lock.)
	after, err := base.GetByID(ctx, u.ID)
	if err != nil {
		t.Fatal(err)
	}
	if after.Name != "Locked" || after.Version != u.Version {
		t.Fatalf("row changed after a rolled-back failed update: name=%q version=%d", after.Name, after.Version)
	}
}

func TestFaults_PoolAcquireTimeout_Classifies503(t *testing.T) {
	dsn := faultDSN(t)
	ctx := context.Background()
	pool, err := NewPool(ctx, dsn, PoolOptions{MaxConns: 1, StatementTimeout: 2 * time.Second})
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()

	held, err := pool.Acquire(ctx) // exhaust the single connection
	if err != nil {
		t.Fatal(err)
	}
	defer held.Release()

	// A second acquire must fail once the bounded context expires; this is the same error the
	// repository path surfaces when every pooled connection is busy.
	bounded, cancel := context.WithTimeout(context.Background(), 500*time.Millisecond)
	defer cancel()
	_, err = pool.Acquire(bounded)
	if err == nil {
		t.Fatal("expected an acquire failure against an exhausted pool")
	}
	t.Logf("observed acquire-timeout error: type=%T message=%q", err, err.Error())
	// The request deadline (row 3 of the mapping) makes acquire waits retryable 503s.
	if !errors.Is(err, context.DeadlineExceeded) && !errors.Is(err, port.ErrUnavailable) {
		t.Fatalf("pool-acquire timeout must reach HTTP as 503 (DeadlineExceeded or ErrUnavailable), got %T: %v", err, err)
	}
}

func TestFaults_MissingTable_IsNotUnavailable(t *testing.T) {
	dsn := pgtest.FreshSchemaDSN(t) // fresh schema, deliberately NOT migrated
	ctx := context.Background()
	pool := mustPool(t, ctx, dsn, 0)
	defer pool.Close()
	repo := NewUserRepository(pool, false)

	err := repo.Create(ctx, mustUser(t, "nomigration@example.com"))
	if errors.Is(err, port.ErrUnavailable) {
		t.Fatalf("42P01 undefined_table must stay an unexpected error, got %v", err)
	}
	pgCode, _ := observeChain(t, err)
	if pgCode != "42P01" {
		t.Fatalf("expected real SQLSTATE 42P01, got %q (err %v)", pgCode, err)
	}
}

func mustPool(t *testing.T, ctx context.Context, dsn string, statementTimeout time.Duration) *pgxpool.Pool {
	t.Helper()
	pool, err := NewPool(ctx, dsn, PoolOptions{MaxConns: 2, StatementTimeout: statementTimeout})
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(pool.Close)
	return pool
}

func mustUser(t *testing.T, email string) domain.User {
	t.Helper()
	u, err := domain.NewUser((&system.UUIDv7{}).NewID(), email, "Fault User", (&system.Clock{}).Now())
	if err != nil {
		t.Fatal(err)
	}
	return u
}

func ptr[T any](v T) *T { return &v }
