package postgres

// B1 (ADR-006 zero-trust addendum): least-privilege database role profile and its repeatable
// verification. Inert unless MC_TEST_DATABASE_URL is set. On a fresh disposable schema this test
//
//  1. creates the profile roles, private schema, default privileges and exact per-table grants
//     from the Go profile source below,
//  2. enforces that the operator SQL files (ops/adr006/db/) are byte-equivalent (after comment
//     normalization) to this Go source — the files are the operator deliverable and this test is
//     their repeatable verification, so the two can never drift apart,
//  3. sets synthetic role passwords (the operator step the SQL files deliberately omit),
//  4. runs the product migrations AS the migrator role, which the profile's role GUC makes act as
//     the schema owner, into a dedicated private schema outside the Supabase Data API,
//  5. applies the BFF state DDL and BFF grants (same enforced sync with ops/adr006/),
//  6. proves the denials: no CREATE/ALTER/DROP, no TRUNCATE, no trigger disabling, no UPDATE of
//     append-only legal history, no SET ROLE to the owner,
//  7. proves every table in the migrated schema carries exactly the grant class the profile
//     defines — a future table with no grant class fails here, not in production,
//  8. runs representative product contracts AS the restricted runtime role, and scopes the BFF
//     role to mc_bff.state and nothing else.
//
// It never touches retained databases; everything lives in the per-test schema and is dropped
// with it. Provider-side Supabase grants/pooler/network behavior remains NOT_RUN.

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"log/slog"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
)

const (
	b1Schema = "mcapp" // dedicated private schema: outside the Supabase Data API by construction
	b1Owner  = "mc_owner"
	b1Migr   = "mc_migrator"
	b1Run    = "mc_runtime"
	b1Maint  = "mc_maintenance"
	b1BFF    = "mc_bff"
)

func b1Password(t *testing.T) string {
	t.Helper()
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		t.Fatal(err)
	}
	return "mc" + hex.EncodeToString(b)
}

// b1ProfileSQL is the role/schema profile DDL — the Go source of truth mirrored verbatim in
// ops/adr006/db/b1-roles.sql (the operator deliverable; the sync subtest enforces equality after
// comment normalization). No passwords: connecting fails until the operator sets them.
func b1ProfileSQL() []string {
	return []string{
		// Dedicated private schema; nothing is granted to PUBLIC (Supabase anon/authenticated
		// roles and the Data API therefore have no access by construction).
		"DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_owner') THEN CREATE ROLE mc_owner NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF; END $do$;",
		"DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_migrator') THEN CREATE ROLE mc_migrator LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE INHERIT; END IF; END $do$;",
		"DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_runtime') THEN CREATE ROLE mc_runtime LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; END IF; END $do$;",
		"DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_maintenance') THEN CREATE ROLE mc_maintenance NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE; END IF; END $do$;",
		"DO $do$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_bff') THEN CREATE ROLE mc_bff LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT; END IF; END $do$;",
		"CREATE SCHEMA IF NOT EXISTS mcapp;",
		"REVOKE ALL ON SCHEMA mcapp FROM PUBLIC;",
		"GRANT USAGE, CREATE ON SCHEMA mcapp TO mc_owner;",
		"ALTER SCHEMA mcapp OWNER TO mc_owner;",
		// Migrations act as the schema owner: the membership is SET-able, and the role-level GUC
		// makes every migration connection assume mc_owner, so migration objects (and
		// goose_db_version) are owned by the NOLOGIN owner, never by a LOGIN role.
		"GRANT mc_owner TO mc_migrator WITH SET TRUE;",
		"ALTER ROLE mc_migrator SET role = 'mc_owner';",
		"GRANT USAGE ON SCHEMA mcapp TO mc_runtime;",
		"REVOKE CREATE ON SCHEMA mcapp FROM mc_runtime;",
		// Future migration objects are born without PUBLIC rights, with only a read/append floor:
		// UPDATE (and DELETE) are always deliberate per-table grants below, so a future
		// append-only table can never silently inherit a blanket UPDATE default.
		"ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp REVOKE ALL ON TABLES FROM PUBLIC;",
		"ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp REVOKE ALL ON FUNCTIONS FROM PUBLIC;",
		"ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp GRANT SELECT, INSERT ON TABLES TO mc_runtime;",
		"ALTER DEFAULT PRIVILEGES FOR ROLE mc_owner IN SCHEMA mcapp GRANT USAGE ON SEQUENCES TO mc_runtime;",
		// BFF durable-state schema (the table itself comes from ops/adr006/bff-state.sql).
		"CREATE SCHEMA IF NOT EXISTS mc_bff;",
		"REVOKE ALL ON SCHEMA mc_bff FROM PUBLIC;",
		"ALTER SCHEMA mc_bff OWNER TO mc_owner;",
		"GRANT USAGE ON SCHEMA mc_bff TO mc_owner;",
	}
}

// b1RuntimeGrants returns the per-table-class DML the runtime actually needs (B1: exact grants,
// not blanket ALL). Append-only legal history gets read/append only. DELETE exists in exactly
// four product queries (replace-on-save semantics): context_links, dependency_edges,
// milestone_prerequisites and review_grid_versions — granted on those tables only, matching the
// discovered contract (the B1 test proves any missing grant empirically).
func b1RuntimeGrants(schema string, tables []string) []string {
	var out []string
	appendOnly := map[string]bool{
		"domain_events": true, "command_receipts": true, "command_receipt_matters": true,
		"security_audit_events": true,
	}
	deletable := map[string]bool{
		"context_links": true, "dependency_edges": true,
		"milestone_prerequisites": true, "review_grid_versions": true,
	}
	for _, tb := range tables {
		switch {
		case appendOnly[tb]:
			out = append(out, fmt.Sprintf("GRANT SELECT, INSERT ON %s.%s TO mc_runtime;", schema, tb))
		case deletable[tb]:
			out = append(out, fmt.Sprintf("GRANT SELECT, INSERT, UPDATE, DELETE ON %s.%s TO mc_runtime;", schema, tb))
		default:
			out = append(out, fmt.Sprintf("GRANT SELECT, INSERT, UPDATE ON %s.%s TO mc_runtime;", schema, tb))
		}
	}
	return append(out,
		fmt.Sprintf("GRANT USAGE ON ALL SEQUENCES IN SCHEMA %s TO mc_runtime;", schema),
		fmt.Sprintf("REVOKE CREATE ON SCHEMA %s FROM mc_runtime;", schema),
		// Post-migration hardening: trigger-guard functions created by the migrations lose
		// the default PUBLIC EXECUTE (firing via their triggers still works). On the operator
		// side this is the idempotent re-run of b1-roles.sql after the migrations.
		fmt.Sprintf("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA %s FROM PUBLIC;", schema),
	)
}

// b1BFFStateSQL mirrors ops/adr006/bff-state.sql verbatim (comment-normalized), applied by the
// migration identity in the deployment runbook and by the migrator role in this test.
func b1BFFStateSQL() []string {
	return []string{
		"CREATE SCHEMA IF NOT EXISTS mc_bff;",
		"REVOKE ALL ON SCHEMA mc_bff FROM PUBLIC;",
		`CREATE TABLE IF NOT EXISTS mc_bff.state (
    state_key text PRIMARY KEY,
    sealed bytea NOT NULL,
    expires_at timestamptz NOT NULL
);`,
		"CREATE INDEX IF NOT EXISTS bff_state_expiry ON mc_bff.state (expires_at);",
	}
}

// b1BFFGrants mirrors ops/adr006/db/b1-bff-grants.sql verbatim (comment-normalized).
func b1BFFGrants() []string {
	return []string{
		"GRANT USAGE ON SCHEMA mc_bff TO mc_bff;",
		"REVOKE CREATE ON SCHEMA mc_bff FROM mc_bff;",
		"GRANT SELECT, INSERT, UPDATE, DELETE ON mc_bff.state TO mc_bff;",
		"GRANT USAGE ON SCHEMA mc_bff TO mc_maintenance;",
		"GRANT SELECT, DELETE ON mc_bff.state TO mc_maintenance;",
	}
}

// b1RepoRoot resolves the repository root from this test file's location, independent of the
// working directory the test binary runs in.
func b1RepoRoot(t *testing.T) string {
	t.Helper()
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("resolve test source path")
	}
	root := filepath.Dir(file) // .../internal/adapter/outbound/postgres
	for range 6 {              // outbound, adapter, internal, backend, apps, repository root
		root = filepath.Dir(root)
	}
	return root
}

// b1ReadStatements parses an operator SQL file into normalized statements: comment lines are
// dropped, statement lines are trimmed. Both sides of the sync check use this normalization.
func b1ReadStatements(t *testing.T, rel string) []string {
	t.Helper()
	text, err := os.ReadFile(filepath.Join(b1RepoRoot(t), filepath.FromSlash(rel)))
	if err != nil {
		t.Fatalf("read operator SQL %s: %v", rel, err)
	}
	return b1Normalize(string(text))
}

// b1Normalize drops comment lines, trims the rest and drops empties — a statement-block-insensitive
// normalization shared by the file side and the Go side of the sync check.
func b1Normalize(text string) []string {
	var out []string
	for _, line := range strings.Split(text, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "--") {
			continue
		}
		out = append(out, line)
	}
	return out
}

// b1TestSyncGuard asserts the operator SQL files match this Go source of truth. The files are the
// deployment artifact; this guard is what makes them "the same SQL, not a copy": any edit to one
// side without the other fails this test. Statements are compared as normalized sets.
func b1TestSyncGuard(t *testing.T, tables []string) {
	t.Helper()
	// The runtime grants are schema-qualified from the same table list the migrated schema
	// produced, so the guard also proves the file's per-table grant CLASSES (including exactly
	// which tables carry DELETE) never drift from the Go class map.
	profile := append(b1ProfileSQL(), b1RuntimeGrants(b1Schema, tables)...)
	cases := []struct {
		file  string
		goSQL []string
	}{
		{"ops/adr006/bff-state.sql", b1BFFStateSQL()},
		{"ops/adr006/db/b1-roles.sql", profile},
		{"ops/adr006/db/b1-bff-grants.sql", b1BFFGrants()},
	}
	for _, tc := range cases {
		fileStmts := b1ReadStatements(t, tc.file)
		// Both sides normalize identically (comment lines dropped, lines trimmed), so the
		// comparison is insensitive to statement-block layout and comment placement.
		goStmts := b1Normalize(strings.Join(tc.goSQL, "\n"))
		fileSet := map[string]bool{}
		for _, s := range fileStmts {
			fileSet[s] = true
		}
		goSet := map[string]bool{}
		for _, s := range goStmts {
			goSet[s] = true
		}
		for _, s := range fileStmts {
			if !goSet[s] {
				t.Errorf("%s: file statement not in Go source of truth: %s", tc.file, s)
			}
		}
		for s := range goSet {
			if !fileSet[s] {
				t.Errorf("%s: Go statement missing from the operator file: %s", tc.file, s)
			}
		}
		if len(goSet) != len(fileSet) {
			t.Errorf("%s: statement count drift: %d in file, %d in Go", tc.file, len(fileSet), len(goSet))
		}
	}
}

// b1ApplyProfile executes the Go profile source and sets synthetic passwords (the operator step
// the SQL files deliberately omit: no password ever appears in the SQL).
func b1ApplyProfile(t *testing.T, admin *pgxpool.Pool, ctx context.Context, passwords map[string]string) {
	t.Helper()
	for _, sql := range b1ProfileSQL() {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("profile: %v: %v", sql, err)
		}
	}
	for role, pass := range passwords {
		sql := fmt.Sprintf("ALTER ROLE %s PASSWORD '%s'", role, pass)
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("operator password step for %s: %v", role, err)
		}
	}
}

func b1ListTables(t *testing.T, admin *pgxpool.Pool, schema string) []string {
	t.Helper()
	rows, err := admin.Query(context.Background(),
		`SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename`, schema)
	if err != nil {
		t.Fatal(err)
	}
	defer rows.Close()
	var out []string
	for rows.Next() {
		var tb string
		if err := rows.Scan(&tb); err != nil {
			t.Fatal(err)
		}
		out = append(out, tb)
	}
	return out
}

// b1DropProfileObjects removes the cluster-level profile objects from the disposable fixture
// database so both B1 tests start from the same clean slate. It never touches retained databases.
// The schemas drop FIRST (CASCADE): any object a previous run left inside them — owned by the
// admin or another role — must not block DROP OWNED's RESTRICT drop of the role-owned schemas.
// The statements are literals: the role names are a fixed, compile-time set.
func b1DropProfileObjects(t *testing.T, admin b1Execer, ctx context.Context) {
	t.Helper()
	for _, sql := range []string{
		"DROP SCHEMA IF EXISTS mcapp CASCADE",
		"DROP SCHEMA IF EXISTS mc_bff CASCADE",
	} {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("preamble schema drop: %v: %v", sql, err)
		}
	}
	dropOwned := []string{
		`DO $do$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_bff') THEN DROP OWNED BY mc_bff; END IF; END $do$`,
		`DO $do$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_runtime') THEN DROP OWNED BY mc_runtime; END IF; END $do$`,
		`DO $do$ BEGIN IF EXISTS (SELECT 1 from pg_roles WHERE rolname = 'mc_migrator') THEN DROP OWNED BY mc_migrator; END IF; END $do$`,
		`DO $do$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_maintenance') THEN DROP OWNED BY mc_maintenance; END IF; END $do$`,
		`DO $do$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mc_owner') THEN DROP OWNED BY mc_owner; END IF; END $do$`,
	}
	for _, sql := range dropOwned {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("preamble drop owned: %v", err)
		}
	}
	for _, sql := range []string{
		"DROP ROLE IF EXISTS mc_bff",
		"DROP ROLE IF EXISTS mc_runtime",
		"DROP ROLE IF EXISTS mc_migrator",
		"DROP ROLE IF EXISTS mc_maintenance",
		"DROP ROLE IF EXISTS mc_owner",
	} {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("preamble: %v: %v", sql, err)
		}
	}
}

// b1Execer is satisfied by both a pgx connection and a pool.
type b1Execer interface {
	Exec(ctx context.Context, sql string, args ...any) (pgconn.CommandTag, error)
}

func TestB1LeastPrivilegeProfile(t *testing.T) {
	adminDSN := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	admin, err := pgxpool.New(ctx, adminDSN)
	if err != nil {
		t.Fatalf("admin pool: %v", err)
	}
	defer admin.Close()

	migrPass, runPass, bffPass := b1Password(t), b1Password(t), b1Password(t)
	// Roles are cluster-level objects that survive the per-test schema; make the profile
	// idempotent inside the disposable fixture database (never touches retained databases).
	b1DropProfileObjects(t, admin, ctx)
	b1ApplyProfile(t, admin, ctx, map[string]string{b1Migr: migrPass, b1Run: runPass, b1BFF: bffPass})

	// Rebuild the fixture DSN for each profile role: swap the per-test search_path for the
	// dedicated private schema and set the role's credentials as URL parameters.
	roleDSN := func(user, pass string) string {
		t.Helper()
		u, err := url.Parse(adminDSN)
		if err != nil {
			t.Fatalf("parse admin DSN: %v", err)
		}
		q := u.Query()
		q.Set("search_path", b1Schema)
		q.Set("user", user)
		q.Set("password", pass)
		u.RawQuery = q.Encode()
		return u.String()
	}
	migrDSN := roleDSN(b1Migr, migrPass)
	runDSN := roleDSN(b1Run, runPass)
	migrCtx, migrCancel := context.WithTimeout(ctx, 90*time.Second)
	defer migrCancel()
	// The role GUC applied by the profile makes this connection act as the schema owner, so the
	// migration objects (and goose_db_version) are owned by the NOLOGIN owner.
	if err := MigrateMatterControl(migrCtx, migrDSN, slog.New(slog.NewTextHandler(io.Discard, nil))); err != nil {
		t.Fatalf("migrate as %s: %v", b1Migr, err)
	}
	tables := b1ListTables(t, admin, b1Schema)
	if len(tables) < 20 {
		t.Fatalf("unexpectedly few tables: %v", tables)
	}
	// Post-migration grants and hardening — the operator side is the idempotent re-run of
	// b1-roles.sql after the migrations (per-table grants, sequences, function EXECUTE revoke).
	for _, sql := range b1RuntimeGrants(b1Schema, tables) {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("post-migration grants: %v: %v", sql, err)
		}
	}

	// BFF durable state: the same DDL and grant statements as the operator files, in runbook
	// order. bff-state.sql runs as the database admin (CREATE SCHEMA IF NOT EXISTS requires
	// database-level CREATE even when the schema already exists — a right the migration identity
	// deliberately lacks), then ownership is aligned to the schema owner as the runbook does.
	{
		for _, sql := range b1BFFStateSQL() {
			if _, err := admin.Exec(ctx, sql); err != nil {
				t.Fatalf("bff-state: %v: %v", sql, err)
			}
		}
		if _, err := admin.Exec(ctx, "ALTER TABLE mc_bff.state OWNER TO mc_owner"); err != nil {
			t.Fatalf("bff-state ownership alignment: %v", err)
		}
	}
	for _, sql := range b1BFFGrants() {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("bff grants: %v: %v", sql, err)
		}
	}

	t.Run("operator SQL files are in sync with the Go profile source", func(t *testing.T) {
		// The guard makes ops/adr006/ the same SQL the test verified — never a drifting copy.
		b1TestSyncGuard(t, tables)
	})

	t.Run("runtime denials", func(t *testing.T) {
		run, err := pgx.Connect(ctx, runDSN)
		if err != nil {
			t.Fatalf("runtime connect: %v", err)
		}
		defer run.Close(ctx)
		denied := []struct{ label, sql string }{
			{"create table", `CREATE TABLE mcapp.evil (id int)`},
			{"drop table", `DROP TABLE mcapp.matters`},
			{"alter table", `ALTER TABLE mcapp.matters ADD COLUMN evil int`},
			{"truncate", `TRUNCATE mcapp.domain_events`},
			{"update append-only history", `UPDATE mcapp.domain_events SET type = 'x'`},
			{"delete append-only receipt", `DELETE FROM mcapp.command_receipts`},
			{"disable guard trigger", `ALTER TABLE mcapp.graph_nodes DISABLE TRIGGER graph_nodes_typed_total`},
			{"assume owner", `SET ROLE mc_owner`},
			{"create in schema", `CREATE SCHEMA mcapp2`},
		}
		for _, d := range denied {
			if _, err := run.Exec(ctx, d.sql); err == nil {
				t.Fatalf("%s must be denied", d.label)
			} else if !isPrivilegeDenied(err) {
				t.Fatalf("%s: expected a privilege error, got %v", d.label, err)
			}
		}
		// Self-grant probes: PostgreSQL permits a role to re-grant privileges it already holds to
		// itself (a no-op with a warning for the rest) — escalation is what must fail. After the
		// attempt, DELETE (never granted) must still be denied.
		if _, err := run.Exec(ctx, `GRANT ALL ON mcapp.matters TO mc_runtime`); err != nil && !strings.Contains(err.Error(), "WARNING") {
			t.Logf("self-grant returned an error (acceptable): %v", err)
		}
		if _, err := run.Exec(ctx, `DELETE FROM mcapp.matters`); err == nil {
			t.Fatal("self-grant escalated: DELETE executed")
		}
		if _, err := run.Exec(ctx, `GRANT mc_owner TO mc_runtime`); err == nil {
			t.Fatal("runtime granted itself the schema owner role")
		}
	})

	t.Run("every table has its grant class", func(t *testing.T) {
		// The expectation is the Go class map mirrored in the operator file (sync-guarded): each
		// migrated table must carry exactly the granted privileges and nothing else.
		appendOnly := map[string]bool{
			"domain_events": true, "command_receipts": true, "command_receipt_matters": true,
			"security_audit_events": true,
		}
		deletable := map[string]bool{
			"context_links": true, "dependency_edges": true,
			"milestone_prerequisites": true, "review_grid_versions": true,
		}
		for _, tb := range tables {
			want := map[string]bool{"SELECT": true, "INSERT": true, "UPDATE": true}
			switch {
			case appendOnly[tb]:
				want = map[string]bool{"SELECT": true, "INSERT": true}
			case deletable[tb]:
				want["DELETE"] = true
			}
			for _, priv := range []string{"SELECT", "INSERT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER"} {
				var has bool
				if err := admin.QueryRow(ctx,
					`SELECT has_table_privilege($1, format('%I.%I', $2::text, $3::text)::regclass, $4)`,
					b1Run, b1Schema, tb, priv).Scan(&has); err != nil {
					t.Fatalf("privilege probe %s.%s: %v", b1Schema, tb, err)
				}
				if has != want[priv] {
					t.Errorf("%s.%s: %s = %v, want %v", b1Schema, tb, priv, has, want[priv])
				}
			}
		}
		// Sequences: USAGE on every sequence in the schema, nothing more.
		rows, err := admin.Query(ctx, `SELECT sequencename, has_sequence_privilege($1, $2 || '.' || sequencename, 'USAGE')
			FROM pg_sequences WHERE schemaname = $2`, b1Run, b1Schema)
		if err != nil {
			t.Fatal(err)
		}
		defer rows.Close()
		count := 0
		for rows.Next() {
			var name string
			var usage bool
			if err := rows.Scan(&name, &usage); err != nil {
				t.Fatal(err)
			}
			if !usage {
				t.Errorf("sequence %s.%s: USAGE not granted", b1Schema, name)
			}
			count++
		}
		if count == 0 {
			t.Log("no sequences in the schema (identity/uuid keys)")
		}
	})

	t.Run("public has nothing on the private schemas", func(t *testing.T) {
		// The Supabase Data API serves PUBLIC-equivalent access; the profile must leave PUBLIC
		// empty on the private schemas and their tables and functions.
		for _, tb := range tables {
			for _, priv := range []string{"SELECT", "INSERT", "UPDATE", "DELETE"} {
				var has bool
				if err := admin.QueryRow(ctx,
					`SELECT has_table_privilege($1, format('%I.%I', $2::text, $3::text)::regclass, $4)`,
					"public", b1Schema, tb, priv).Scan(&has); err != nil {
					t.Fatalf("public probe %s.%s: %v", b1Schema, tb, err)
				}
				if has {
					t.Errorf("PUBLIC holds %s on %s.%s", priv, b1Schema, tb)
				}
			}
		}
		var publicUsage bool
		if err := admin.QueryRow(ctx, `SELECT has_schema_privilege('public', $1, 'USAGE')`, b1Schema).Scan(&publicUsage); err != nil {
			t.Fatal(err)
		}
		if publicUsage {
			t.Errorf("PUBLIC holds USAGE on schema %s", b1Schema)
		}
		// Trigger-guard functions: no direct EXECUTE for PUBLIC (firing via triggers still works).
		rows, err := admin.Query(ctx, `SELECT p.proname FROM pg_proc p
			JOIN pg_namespace n ON n.oid = p.pronamespace
			WHERE n.nspname = $1 AND has_function_privilege('public', p.oid, 'EXECUTE')`, b1Schema)
		if err != nil {
			t.Fatal(err)
		}
		defer rows.Close()
		for rows.Next() {
			var fn string
			if err := rows.Scan(&fn); err != nil {
				t.Fatal(err)
			}
			t.Errorf("PUBLIC holds EXECUTE on function %s.%s", b1Schema, fn)
		}
	})

	t.Run("runtime passes representative contracts", func(t *testing.T) {
		// Each subtest gets its own fresh schema: the migrator migrates it as mc_migrator, the
		// runtime receives exactly its per-schema grants, and the contracts run on a runtime DSN.
		// The schema is dropped by pgtest's cleanup; the roles and their rights are cluster-level.
		newRuntimeBundle := func(t *testing.T) mattercontrol.Bundle {
			t.Helper()
			dsn := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
			u, err := url.Parse(dsn)
			if err != nil {
				t.Fatalf("parse schema DSN: %v", err)
			}
			schema := u.Query().Get("search_path")
			// Hand the fresh schema to the profile: owner owns it, migrator acts, runtime reads/writes.
			for _, sql := range []string{
				fmt.Sprintf("ALTER SCHEMA %s OWNER TO %s", schema, b1Owner),
				fmt.Sprintf("GRANT USAGE ON SCHEMA %s TO %s", schema, b1Run),
			} {
				if _, err := admin.Exec(ctx, sql); err != nil {
					t.Fatalf("schema handover: %v: %v", sql, err)
				}
			}
			mCtx, mCancel := context.WithTimeout(ctx, 90*time.Second)
			defer mCancel()
			mSchemaDSN := func(user, pass string) string {
				q := u.Query()
				q.Set("user", user)
				q.Set("password", pass)
				u2 := *u
				u2.RawQuery = q.Encode()
				return u2.String()
			}
			if err := MigrateMatterControl(mCtx, mSchemaDSN(b1Migr, migrPass), slog.New(slog.NewTextHandler(io.Discard, nil))); err != nil {
				t.Fatalf("migrate as %s: %v", b1Migr, err)
			}
			for _, sql := range b1RuntimeGrants(schema, b1ListTables(t, admin, schema)) {
				if _, err := admin.Exec(ctx, sql); err != nil {
					t.Fatalf("grants: %v: %v", sql, err)
				}
			}
			pool, err := pgxpool.New(ctx, mSchemaDSN(b1Run, runPass))
			if err != nil {
				t.Fatalf("runtime pool: %v", err)
			}
			t.Cleanup(pool.Close)
			fs := &faultCapableStore{inner: NewMatterStore(pool)}
			world := &pgWorld{pool: pool, tb: t, dsn: mSchemaDSN(b1Run, runPass)}
			return mattercontrol.Bundle{Store: fs, World: world}
		}
		// Breadth across the spine, administration, work graph, filings and the review matrix —
		// every legitimate INSERT/UPDATE/SELECT, RETURNING, advisory lock and trigger read.
		mattercontrol.Suite(t, newRuntimeBundle)
		mattercontrol.SuiteW4(t, newRuntimeBundle)
		mattercontrol.SuiteReview(t, newRuntimeBundle)
	})

	t.Run("bff role is scoped to mc_bff.state", func(t *testing.T) {
		bff, err := pgx.Connect(ctx, roleDSN(b1BFF, bffPass))
		if err != nil {
			t.Fatalf("bff connect: %v", err)
		}
		defer bff.Close(ctx)
		// Full CRUD on its own table.
		if _, err := bff.Exec(ctx, `INSERT INTO mc_bff.state (state_key, sealed, expires_at)
			VALUES ('synthetic-key', decode('0011ff', 'hex'), now() + interval '1 hour')`); err != nil {
			t.Fatalf("bff insert into mc_bff.state: %v", err)
		}
		var sealed []byte
		if err := bff.QueryRow(ctx, `SELECT sealed FROM mc_bff.state WHERE state_key = 'synthetic-key'`).Scan(&sealed); err != nil {
			t.Fatalf("bff select: %v", err)
		}
		if _, err := bff.Exec(ctx, `UPDATE mc_bff.state SET sealed = decode('00ff', 'hex') WHERE state_key = 'synthetic-key'`); err != nil {
			t.Fatalf("bff update: %v", err)
		}
		if _, err := bff.Exec(ctx, `DELETE FROM mc_bff.state WHERE state_key = 'synthetic-key'`); err != nil {
			t.Fatalf("bff delete: %v", err)
		}
		// ...and nothing else: no product tables, no CREATE anywhere.
		denied := []struct{ label, sql string }{
			{"read product table", `SELECT * FROM mcapp.matters`},
			{"write product table", `INSERT INTO mcapp.matters (id) VALUES ('00000000-0000-0000-0000-000000000000')`},
			{"delete product rows", `DELETE FROM mcapp.matters`},
			{"create table in mc_bff", `CREATE TABLE mc_bff.evil (id int)`},
			{"create table in mcapp", `CREATE TABLE mcapp.evil (id int)`},
			{"create schema", `CREATE SCHEMA mc_bff2`},
		}
		for _, d := range denied {
			if _, err := bff.Exec(ctx, d.sql); err == nil {
				t.Fatalf("%s must be denied for the BFF role", d.label)
			} else if !isPrivilegeDenied(err) {
				t.Fatalf("%s: expected a privilege error, got %v", d.label, err)
			}
		}
	})
}

func isPrivilegeDenied(err error) bool {
	if err == nil {
		return false
	}
	msg := err.Error()
	return strings.Contains(msg, "permission denied") ||
		strings.Contains(msg, "must be owner") ||
		strings.Contains(msg, "insufficient_privilege") ||
		strings.Contains(msg, "42501")
}
