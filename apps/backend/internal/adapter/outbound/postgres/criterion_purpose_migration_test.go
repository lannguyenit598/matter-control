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

// D-9 (OV-F1-03, fix-wave #2 G4): 0011 accepts SIGNATURE rows and its Down is data-safe — the
// rollback maps SIGNATURE rows back to PACKAGE (the only reading a pre-0011 row had) instead of
// failing 23514, so claims and assessments survive a rollback.
func TestCriterionPurposeMigration0011DownIsDataSafe(t *testing.T) {
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
	if _, err := provider.UpTo(ctx, 11); err != nil {
		t.Fatalf("apply through 0011: %v", err)
	}
	conn, err := db.Conn(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = conn.Close() }()
	if _, err := conn.ExecContext(ctx, `SET session_replication_role = replica`); err != nil {
		t.Skipf("needs a role allowed to disable foreign-key triggers: %v", err)
	}
	const sigTitle = "Signed filing form"
	if _, err := conn.ExecContext(ctx, `INSERT INTO criteria (id, matter_id, subject_id, title, mandatory, version_rule, revision, purpose)
		VALUES ('44444444-4444-4444-8444-444444444444', '55555555-5555-4555-8555-555555555555', '66666666-6666-4666-8666-666666666666', $1, true, 'NONE', 1, 'SIGNATURE')`, sigTitle); err != nil {
		t.Fatalf("a SIGNATURE row is accepted under the widened CHECK: %v", err)
	}
	// Roll back only 0011: the row survives, mapped back to the legacy PACKAGE reading.
	if _, err := provider.DownTo(ctx, 10); err != nil {
		t.Fatalf("data-safe down 0011: %v", err)
	}
	var purpose string
	if err := conn.QueryRowContext(ctx, `SELECT purpose FROM criteria WHERE title = $1`, sigTitle).Scan(&purpose); err != nil {
		t.Fatal(err)
	}
	if purpose != "PACKAGE" {
		t.Fatalf("the rollback maps SIGNATURE back to PACKAGE, got %q", purpose)
	}
	if _, err := conn.ExecContext(ctx, `UPDATE criteria SET purpose = 'SIGNATURE' WHERE title = $1`, sigTitle); err == nil {
		t.Fatal("the rolled-back CHECK refuses SIGNATURE again")
	}
}
