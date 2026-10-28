// Package pgtest provides PostgreSQL integration test helpers. For tests only.
package pgtest

import (
	"context"
	"fmt"
	"net/url"
	"os"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
)

// FreshSchemaDSN creates an empty schema named "t_<unixnano>" and returns a DSN pointing
// search_path to it, giving each test a fresh database view without affecting other tests.
// t.Cleanup runs DROP SCHEMA ... CASCADE. Skip if TEST_DATABASE_URL is empty.
func FreshSchemaDSN(t testing.TB) string {
	t.Helper()
	return FreshSchemaDSNFrom(t, "TEST_DATABASE_URL")
}

// FreshSchemaDSNFrom is FreshSchemaDSN reading the base DSN from the named environment
// variable instead of TEST_DATABASE_URL, so a second isolated database (for example the
// MatterControl product schema via MC_TEST_DATABASE_URL) gets the same per-test schema
// isolation without process-wide environment mutation. Native behavior is unchanged.
func FreshSchemaDSNFrom(t testing.TB, envVar string) string {
	t.Helper()
	base := os.Getenv(envVar)
	if base == "" {
		t.Skip(envVar + " not set; skipping PostgreSQL integration test")
	}
	schema := fmt.Sprintf("t_%d", time.Now().UnixNano())
	exec(t, base, "CREATE SCHEMA "+schema)
	t.Cleanup(func() { exec(t, base, "DROP SCHEMA IF EXISTS "+schema+" CASCADE") })
	return schemaDSN(t, base, schema)
}

// schemaDSN returns base with search_path set to schema.
func schemaDSN(t testing.TB, base, schema string) string {
	t.Helper()
	u, err := url.Parse(base)
	if err != nil {
		t.Fatalf("parse %s: %v", base, err)
	}
	q := u.Query()
	q.Set("search_path", schema) // pgx passes unknown DSN parameters as runtime parameters.
	u.RawQuery = q.Encode()
	return u.String()
}

func exec(t testing.TB, dsn, sql string) {
	t.Helper()
	ctx := context.Background()
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	defer func() { _ = conn.Close(ctx) }()
	if _, err := conn.Exec(ctx, sql); err != nil {
		t.Fatalf("%s: %v", sql, err)
	}
}
