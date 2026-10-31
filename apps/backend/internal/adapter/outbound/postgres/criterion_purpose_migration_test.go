package postgres

import (
	"context"
	"testing"

	"github.com/pressly/goose/v3"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
)

// BF-01 compatibility: a criterion stored before 0009 keeps gating submission (PACKAGE); the
// migration guesses nothing from the title and the CHECK refuses any other purpose.
func TestCriterionPurposeMigrationKeepsLegacyRowsAsPackage(t *testing.T) {
	dsn := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	db, err := openMatterControlMigrationDB(dsn)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = db.Close() })
	provider, err := goose.NewProvider(goose.DialectPostgres, db, mattercontrolMigrationsFS())
	if err != nil {
		t.Fatal(err)
	}
	ctx := context.Background()
	if _, err := provider.UpTo(ctx, 8); err != nil {
		t.Fatalf("apply the schema as it was before the purpose column: %v", err)
	}
	// A synthetic legacy row. Foreign keys are skipped for this one session: only the new column is
	// under test, not the matter/graph fixtures.
	conn, err := db.Conn(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = conn.Close() }()
	if _, err := conn.ExecContext(ctx, `SET session_replication_role = replica`); err != nil {
		t.Skipf("needs a role allowed to disable foreign-key triggers: %v", err)
	}
	const legacyTitle = "Authority decision accepted" // a title that merely sounds like an outcome
	if _, err := conn.ExecContext(ctx, `INSERT INTO criteria (id, matter_id, subject_id, title, mandatory, version_rule, revision)
		VALUES ('11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222', '33333333-3333-4333-8333-333333333333', $1, true, 'NONE', 1)`, legacyTitle); err != nil {
		t.Fatalf("legacy insert: %v", err)
	}
	if _, err := provider.UpTo(ctx, 9); err != nil {
		t.Fatalf("apply 0009: %v", err)
	}
	var purpose string
	if err := conn.QueryRowContext(ctx, `SELECT purpose FROM criteria WHERE title = $1`, legacyTitle).Scan(&purpose); err != nil {
		t.Fatal(err)
	}
	if purpose != "PACKAGE" {
		t.Fatalf("a legacy criterion stays a package gate regardless of its title, got %q", purpose)
	}
	if _, err := conn.ExecContext(ctx, `UPDATE criteria SET purpose = 'MAYBE' WHERE title = $1`, legacyTitle); err == nil {
		t.Fatal("an unknown purpose must be refused by the schema")
	}
	// Down restores the previous shape without touching other columns.
	if _, err := provider.DownTo(ctx, 8); err != nil {
		t.Fatalf("down 0009: %v", err)
	}
	var n int
	if err := conn.QueryRowContext(ctx, `SELECT count(*) FROM criteria WHERE title = $1`, legacyTitle).Scan(&n); err != nil || n != 1 {
		t.Fatalf("down keeps the row: %d %v", n, err)
	}
}
