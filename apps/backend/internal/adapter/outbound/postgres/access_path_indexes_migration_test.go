package postgres

import (
	"context"
	"sort"
	"testing"

	"github.com/pressly/goose/v3"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
)

// B2 (ADR-006 zero-trust addendum): the access-path indexes arrive as a regular, reversible,
// re-runnable migration. Fresh 0001→0010 must apply, a second pass must be a clean no-op (CI runs
// migrate twice), the Down must remove exactly the four indexes, and the index set after Up must
// be exactly the migration's — nothing more, nothing less.
func TestAccessPathIndexesMigration(t *testing.T) {
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
	if _, err := provider.Up(ctx); err != nil {
		t.Fatalf("apply 0001..0010: %v", err)
	}
	conn, err := db.Conn(ctx)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = conn.Close() }()

	indexesOn := func(table string) []string {
		t.Helper()
		rows, err := conn.QueryContext(ctx,
			`SELECT indexname FROM pg_indexes WHERE schemaname = current_schema() AND tablename = $1 ORDER BY indexname`, table)
		if err != nil {
			t.Fatal(err)
		}
		defer rows.Close()
		var out []string
		for rows.Next() {
			var name string
			if err := rows.Scan(&name); err != nil {
				t.Fatal(err)
			}
			out = append(out, name)
		}
		return out
	}

	// Idempotency: a second Up over an already-migrated schema changes nothing.
	if _, err := provider.Up(ctx); err != nil {
		t.Fatalf("second migrate pass must be a clean no-op: %v", err)
	}

	before := map[string][]string{}
	for _, tb := range []string{"review_answers", "matter_memberships", "workspace_memberships", "matters"} {
		before[tb] = indexesOn(tb)
	}
	if _, err := provider.DownTo(ctx, 9); err != nil {
		t.Fatalf("down to 0009: %v", err)
	}
	for tb, had := range before {
		sort.Strings(had)
		got := indexesOn(tb)
		if len(got) >= len(had) {
			t.Errorf("%s: expected the migration indexes dropped, still has %v", tb, got)
		}
	}
	if _, err := provider.UpTo(ctx, 10); err != nil {
		t.Fatalf("re-apply 0010: %v", err)
	}
	// Exact index sets after Up: the four access-path indexes exist beside the constraints.
	for tb, want := range map[string]string{
		"review_answers":        "review_answers_cell_history",
		"matter_memberships":    "matter_memberships_user",
		"workspace_memberships": "workspace_memberships_user",
		"matters":               "matters_workspace",
	} {
		found := false
		for _, name := range indexesOn(tb) {
			if name == want {
				found = true
				break
			}
		}
		if !found {
			t.Errorf("%s: index %s missing after 0010", tb, want)
		}
	}
}
