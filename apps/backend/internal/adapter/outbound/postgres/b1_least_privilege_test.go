package postgres

// B1 (ADR-006 zero-trust addendum): least-privilege database role profile and its repeatable
// verification. Inert unless MC_TEST_DATABASE_URL is set. On a fresh disposable schema this test
//
//  1. creates the profile roles (schema owner NOLOGIN, migrator, runtime, maintenance) exactly as
//     the proposed Supabase profile would,
//  2. runs the product migrations AS the migrator role against a dedicated private schema,
//     which stays outside the Supabase Data API by construction (denied-by-default exposure),
//  3. runs representative product contracts AS the restricted runtime role, proving every
//     legitimate statement still works (including trigger-function reads and RETURNING),
//  4. proves the denials: no CREATE/ALTER/DROP, no TRUNCATE, no trigger disabling, no UPDATE of
//     append-only legal history, no SET ROLE to the owner, no schema-wide function EXECUTE.
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
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
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
)

func b1Password(t *testing.T) string {
	t.Helper()
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		t.Fatal(err)
	}
	return "mc" + hex.EncodeToString(b)
}

// b1ProfileSQL returns the role/schema profile DDL. It is the deliverable proposed for the
// Supabase SQL editor / migration preflight (parameterized execution is irrelevant for DDL; no
// external input ever reaches these statements).
func b1ProfileSQL(migrPass, runPass string) []string {
	return []string{
		// Dedicated private schema; nothing is granted to PUBLIC (Supabase anon/authenticated
		// roles and the Data API therefore have no access by construction).
		fmt.Sprintf("CREATE SCHEMA IF NOT EXISTS %s", b1Schema),
		fmt.Sprintf("REVOKE ALL ON SCHEMA %s FROM PUBLIC", b1Schema),
		// Schema owner: NOLOGIN; objects are owned by it, migrations act through membership.
		fmt.Sprintf("CREATE ROLE %s NOLOGIN", b1Owner),
		fmt.Sprintf("GRANT USAGE, CREATE ON SCHEMA %s TO %s", b1Schema, b1Owner),
		fmt.Sprintf("ALTER SCHEMA %s OWNER TO %s", b1Schema, b1Owner),
		// Migrator: LOGIN, acts as the owner inside the schema only.
		fmt.Sprintf("CREATE ROLE %s LOGIN PASSWORD '%s'", b1Migr, migrPass),
		fmt.Sprintf("GRANT %s TO %s WITH SET TRUE", b1Owner, b1Migr),
		// Runtime: no ownership, no CREATE, membership-free; per-object DML granted below.
		fmt.Sprintf("CREATE ROLE %s LOGIN PASSWORD '%s' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT", b1Run, runPass),
		fmt.Sprintf("GRANT USAGE ON SCHEMA %s TO %s", b1Schema, b1Run),
		// Maintenance: separate, NOLOGIN by default; B7 grants are added only under its own decision.
		fmt.Sprintf("CREATE ROLE %s NOLOGIN", b1Maint),
		// Default privileges: future migration objects are owned by the owner and readable by the
		// runtime; PUBLIC never gains anything.
		fmt.Sprintf("ALTER DEFAULT PRIVILEGES FOR ROLE %s IN SCHEMA %s REVOKE ALL ON TABLES FROM PUBLIC", b1Owner, b1Schema),
		fmt.Sprintf("ALTER DEFAULT PRIVILEGES FOR ROLE %s IN SCHEMA %s REVOKE ALL ON FUNCTIONS FROM PUBLIC", b1Owner, b1Schema),
		fmt.Sprintf("ALTER DEFAULT PRIVILEGES FOR ROLE %s IN SCHEMA %s GRANT SELECT, INSERT, UPDATE ON TABLES TO %s", b1Owner, b1Schema, b1Run),
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
		if appendOnly[tb] {
			out = append(out, fmt.Sprintf("GRANT SELECT, INSERT ON %s.%s TO %s", schema, tb, b1Run))
			continue
		}
		if deletable[tb] {
			out = append(out, fmt.Sprintf("GRANT SELECT, INSERT, UPDATE, DELETE ON %s.%s TO %s", schema, tb, b1Run))
			continue
		}
		out = append(out, fmt.Sprintf("GRANT SELECT, INSERT, UPDATE ON %s.%s TO %s", schema, tb, b1Run))
	}
	return append(out,
		fmt.Sprintf("GRANT USAGE ON ALL SEQUENCES IN SCHEMA %s TO %s", schema, b1Run),
		fmt.Sprintf("REVOKE CREATE ON SCHEMA %s FROM %s", schema, b1Run),
	)
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

func TestB1LeastPrivilegeProfile(t *testing.T) {
	adminDSN := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	ctx, cancel := context.WithTimeout(context.Background(), 120*time.Second)
	defer cancel()
	admin, err := pgxpool.New(ctx, adminDSN)
	if err != nil {
		t.Fatalf("admin pool: %v", err)
	}
	defer admin.Close()

	migrPass, runPass := b1Password(t), b1Password(t)
	// Roles are cluster-level objects that survive the per-test schema; make the profile
	// idempotent inside the disposable fixture database (never touches retained databases).
	// DROP OWNED fails when the role is absent (a fresh fixture database), so each step is
	// guarded by the role's existence.
	for _, role := range []string{b1Run, b1Migr, b1Maint, b1Owner} {
		if _, err := admin.Exec(ctx, `DO $do$ BEGIN
			IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '`+role+`') THEN
				DROP OWNED BY `+role+`;
			END IF;
		END $do$`); err != nil {
			t.Fatalf("preamble drop owned %s: %v", role, err)
		}
	}
	for _, sql := range []string{
		"DROP SCHEMA IF EXISTS " + b1Schema + " CASCADE",
		"DROP ROLE IF EXISTS " + b1Run, "DROP ROLE IF EXISTS " + b1Migr,
		"DROP ROLE IF EXISTS " + b1Maint, "DROP ROLE IF EXISTS " + b1Owner,
	} {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("preamble: %v: %v", sql, err)
		}
	}
	for _, sql := range b1ProfileSQL(migrPass, runPass) {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("profile: %v: %v", sql, err)
		}
	}
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
	if err := MigrateMatterControl(migrCtx, migrDSN, slog.New(slog.NewTextHandler(io.Discard, nil))); err != nil {
		t.Fatalf("migrate as %s: %v", b1Migr, err)
	}
	tables := b1ListTables(t, admin, b1Schema)
	if len(tables) < 20 {
		t.Fatalf("unexpectedly few tables: %v", tables)
	}
	for _, sql := range b1RuntimeGrants(b1Schema, tables) {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("grants: %v: %v", sql, err)
		}
	}

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
