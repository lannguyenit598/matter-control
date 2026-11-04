package postgres

// WP2 (MC-ZCODE-PILOT-DEPLOY-READINESS-20261103): the operator SQL files are executed AS FILES,
// in the documented order, by this test — the Go mirror plus sorted statement equality in
// b1_least_privilege_test.go proves the two sources agree, but only THIS test proves an operator
// can actually run them in order on an empty fixture:
//
//  1. b1-roles.sql (bootstrap) FIRST application as a constrained NON-superuser CREATEROLE admin
//     on PostgreSQL 16+ semantics (WP1 item 5): no SUPERUSER/BYPASSRLS, only the documented
//     setup rights (CREATE on the database + the createrole_self_grant SET/INHERIT rights the
//     file sets itself),
//  2. the operator password step (the synthetic stand-in for the secret-store step),
//  3. the product migrations AS mc_migrator with NO DSN search_path — the role-level
//     search_path set by the bootstrap file must resolve mcapp on a fresh connection (A2),
//  4. bootstrap re-run (idempotency) + b1-runtime-grants.sql first application AND reapplication,
//  5. bff-state.sql (admin identity) + ownership alignment + b1-bff-grants.sql,
//  6. probes: fresh runtime/migrator logins without DSN search_path, SHOW
//     search_path/current_user/session_user/role/statement_timeout, authorized product CRUD,
//     BFF CRUD, real Search through the store as mc_runtime (EN/VI folding), admin seeding
//     authority, and the DDL/privilege refusals.
//
// It never touches retained databases; the fixture is the disposable MC_TEST_DATABASE_URL
// database and the roles/schemas are dropped before every run. Provider-side Supabase behavior
// (actual admin rights, pooler parameter forwarding) remains NOT_RUN — a stock local cluster is
// not a Supabase permission proof, which the runbook keeps as an explicit provider gate.

import (
	"context"
	"log/slog"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
	"leonx.me/matter-control/internal/core/port"
)

const b1BootstrapOperator = "mc_b1_operator"

// b1ReadBlocks reads an operator SQL file and returns its statements: comment lines are dropped,
// consecutive non-empty lines form one blank-line-separated statement block (the documented
// file convention). This is an execution helper, not a general SQL parser.
func b1ReadBlocks(t *testing.T, rel string) []string {
	t.Helper()
	text, err := os.ReadFile(filepath.Join(b1RepoRoot(t), filepath.FromSlash(rel)))
	if err != nil {
		t.Fatalf("read operator SQL %s: %v", rel, err)
	}
	var blocks []string
	var current []string
	for _, line := range strings.Split(string(text), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			if len(current) > 0 {
				blocks = append(blocks, strings.Join(current, "\n"))
				current = nil
			}
			continue
		}
		if strings.HasPrefix(line, "--") {
			continue
		}
		current = append(current, line)
	}
	if len(current) > 0 {
		blocks = append(blocks, strings.Join(current, "\n"))
	}
	return blocks
}

// b1ExecBlocks executes one operator file, in block order, on ONE connection (one session — the
// bootstrap's session-scoped createrole_self_grant must be visible to the role-creation blocks).
// First error fails the test with the failing block: partial psql success is never a pass.
func b1ExecBlocks(t *testing.T, ctx context.Context, conn *pgx.Conn, rel string) {
	t.Helper()
	for i, block := range b1ReadBlocks(t, rel) {
		if _, err := conn.Exec(ctx, block); err != nil {
			t.Fatalf("%s: statement %d failed (ON_ERROR_STOP semantics): %v\nstatement: %s", rel, i+1, err, block)
		}
	}
}

// b1FreshRoleDSN swaps the fixture DSN to a profile role and REMOVES the per-test search_path
// (and every other runtime parameter): the fresh login must resolve the product schema through
// the role-level setting alone (A2), never through the connection string. The URL is rebuilt
// because pgx ConnString returns the connection string AS PARSED (a struct mutation would not
// reach it) — the same URL-rebuild pattern the B1 profile test uses for its role DSNs.
func b1FreshRoleDSN(t *testing.T, adminDSN, user, pass string) string {
	t.Helper()
	u, err := url.Parse(adminDSN)
	if err != nil {
		t.Fatalf("parse admin DSN: %v", err)
	}
	q := u.Query()
	for key := range q {
		if key != "sslmode" {
			q.Del(key)
		}
	}
	q.Set("user", user)
	q.Set("password", pass)
	u.RawQuery = q.Encode()
	return u.String()
}

func b1DropBootstrapOperator(t *testing.T, admin b1Execer, ctx context.Context) {
	t.Helper()
	for _, sql := range []string{
		`DO $do$ BEGIN IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '` + b1BootstrapOperator + `') THEN DROP OWNED BY ` + b1BootstrapOperator + `; END IF; END $do$`,
		"DROP ROLE IF EXISTS " + b1BootstrapOperator,
	} {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("drop bootstrap operator: %v: %v", sql, err)
		}
	}
}

func TestB1OperatorFileSequence(t *testing.T) {
	adminDSN := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	ctx, cancel := context.WithTimeout(context.Background(), 180*time.Second)
	defer cancel()
	admin, err := pgx.Connect(ctx, adminDSN)
	if err != nil {
		t.Fatalf("admin connect: %v", err)
	}
	defer admin.Close(ctx)

	migrPass, runPass, bffPass := b1Password(t), b1Password(t), b1Password(t)
	// Cluster-level objects survive the per-test schema; make the run idempotent in the fixture
	// database (never touches retained databases), including any leftover bootstrap operator.
	b1DropBootstrapOperator(t, admin, ctx)
	b1DropProfileObjects(t, admin, ctx)

	// The constrained bootstrap admin: CREATEROLE plus CREATE on this database only — the exact
	// rights the operator procedure documents for the Supabase project admin. It is created here
	// by the fixture admin; everything inside b1-roles.sql runs AS it (non-superuser).
	opPass := b1Password(t)
	dbName := strings.TrimPrefix(pgtestDSNPath(t, adminDSN), "/")
	if _, err := admin.Exec(ctx, "CREATE ROLE "+b1BootstrapOperator+" LOGIN CREATEROLE PASSWORD '"+opPass+"'"); err != nil {
		t.Fatalf("create constrained bootstrap admin: %v", err)
	}
	if _, err := admin.Exec(ctx, "GRANT CREATE ON DATABASE "+pgtestQuoteIdent(dbName)+" TO "+b1BootstrapOperator); err != nil {
		t.Fatalf("grant database CREATE to bootstrap admin: %v", err)
	}
	// Cleanup with its own connection (deferred Close runs before t.Cleanup on the admin conn).
	// A failed cleanup is logged, not fatal: the next run's preamble drops the same objects.
	t.Cleanup(func() {
		cctx, ccancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer ccancel()
		conn, err := pgx.Connect(cctx, adminDSN)
		if err != nil {
			t.Logf("cleanup connect: %v", err)
			return
		}
		defer conn.Close(cctx)
		b1DropBootstrapOperator(t, conn, cctx)
	})

	opDSN := b1FreshRoleDSN(t, adminDSN, b1BootstrapOperator, opPass)
	op, err := pgx.Connect(ctx, opDSN)
	if err != nil {
		t.Fatalf("bootstrap admin connect: %v", err)
	}
	defer op.Close(ctx)

	// 1. Bootstrap FIRST application as the constrained non-superuser admin. Before the split,
	// b1-roles.sql aborted here on a fresh database (per-table grants on not-yet-created tables);
	// the split bootstrap must now run clean, including the createrole_self_grant block.
	b1ExecBlocks(t, ctx, op, "ops/adr006/db/b1-roles.sql")

	// 2. The operator password step (synthetic stand-ins for the secret-store values; the file
	// itself never carries passwords). The bootstrap admin holds ADMIN OPTION on the LOGIN roles
	// it created, so this works on PG16+ where CREATEROLE alone no longer suffices.
	for role, pass := range map[string]string{b1Migr: migrPass, b1Run: runPass, b1BFF: bffPass} {
		if _, err := op.Exec(ctx, "ALTER ROLE "+role+" PASSWORD '"+pass+"'"); err != nil {
			t.Fatalf("operator password step for %s: %v", role, err)
		}
	}

	// 3. Product migrations AS mc_migrator with NO DSN search_path: the role-level search_path
	// (and the role GUC acting as mc_owner) must resolve everything server-side (A2/R3).
	migrDSN := b1FreshRoleDSN(t, adminDSN, b1Migr, migrPass)
	migrCtx, migrCancel := context.WithTimeout(ctx, 90*time.Second)
	defer migrCancel()
	if err := MigrateMatterControl(migrCtx, migrDSN, slog.New(slog.NewTextHandler(os.Stderr, nil))); err != nil {
		t.Fatalf("migrate as %s without DSN search_path: %v", b1Migr, err)
	}

	// 4. Bootstrap re-run (idempotency as the same non-superuser admin, now a member of the
	// owner), then the runtime-grants file first application AND reapplication.
	b1ExecBlocks(t, ctx, op, "ops/adr006/db/b1-roles.sql")
	b1ExecBlocks(t, ctx, op, "ops/adr006/db/b1-runtime-grants.sql")
	b1ExecBlocks(t, ctx, op, "ops/adr006/db/b1-runtime-grants.sql")

	// 5. BFF durable state: the documented admin identity (database-level CREATE), ownership
	// alignment, then the BFF grants — grant re-runs under the same sequence.
	b1ExecBlocks(t, ctx, op, "ops/adr006/bff-state.sql")
	if _, err := op.Exec(ctx, "ALTER TABLE mc_bff.state OWNER TO mc_owner"); err != nil {
		t.Fatalf("bff-state ownership alignment: %v", err)
	}
	b1ExecBlocks(t, ctx, op, "ops/adr006/db/b1-bff-grants.sql")

	// 6a. Fresh runtime login WITHOUT DSN search_path: the private product schema resolves via
	// the role setting, not via the connection string or pooler forwarding.
	run, err := pgx.Connect(ctx, b1FreshRoleDSN(t, adminDSN, b1Run, runPass))
	if err != nil {
		t.Fatalf("runtime connect: %v", err)
	}
	defer run.Close(ctx)
	var searchPath, currentUser, sessionUser, currentSchema string
	if err := run.QueryRow(ctx, "SHOW search_path").Scan(&searchPath); err != nil {
		t.Fatalf("SHOW search_path: %v", err)
	}
	if strings.TrimSpace(searchPath) != b1Schema {
		t.Fatalf("runtime search_path = %q, want %q", searchPath, b1Schema)
	}
	if err := run.QueryRow(ctx, "SELECT current_schema()").Scan(&currentSchema); err != nil {
		t.Fatalf("current_schema: %v", err)
	}
	if currentSchema != b1Schema {
		t.Fatalf("runtime current_schema = %q, want %q", currentSchema, b1Schema)
	}
	if err := run.QueryRow(ctx, "SELECT current_user, session_user").Scan(&currentUser, &sessionUser); err != nil {
		t.Fatalf("current/session user: %v", err)
	}
	if currentUser != b1Run || sessionUser != b1Run {
		t.Fatalf("runtime users = %s/%s, want %s/%s", currentUser, sessionUser, b1Run, b1Run)
	}
	// Client-sent runtime parameters reach the server (the mechanism the pooler must forward for
	// statement_timeout; actual Supavisor forwarding stays a provider gate, NOT_RUN).
	{
		timeoutDSN := b1FreshRoleDSN(t, adminDSN, b1Run, runPass)
		cfg, err := pgx.ParseConfig(timeoutDSN)
		if err != nil {
			t.Fatalf("parse timeout DSN: %v", err)
		}
		cfg.RuntimeParams["statement_timeout"] = "5000"
		conn, err := pgx.ConnectConfig(ctx, cfg)
		if err != nil {
			t.Fatalf("runtime connect with statement_timeout: %v", err)
		}
		defer conn.Close(ctx)
		var got string
		if err := conn.QueryRow(ctx, "SHOW statement_timeout").Scan(&got); err != nil {
			t.Fatalf("SHOW statement_timeout: %v", err)
		}
		if got != "5s" {
			t.Fatalf("statement_timeout = %q, want 5s", got)
		}
	}

	// 6b. Authorized product CRUD as mc_runtime (unqualified names resolved by search_path).
	if _, err := run.Exec(ctx, `INSERT INTO users (id, idp_issuer, idp_subject, display_name)
		VALUES (gen_random_uuid(), 'http://b1-op-seq.synthetic.test', 'op-seq-a', 'probe-a')`); err != nil {
		t.Fatalf("runtime insert into users: %v", err)
	}
	if _, err := run.Exec(ctx, `SELECT count(*) FROM workspace_memberships`); err != nil {
		t.Fatalf("runtime select workspace_memberships: %v", err)
	}

	// 6c. Fresh migrator login WITHOUT DSN search_path: the role GUC applied at backend start
	// makes the session act as the owner (login-name + role settings both effective).
	migr, err := pgx.Connect(ctx, migrDSN)
	if err != nil {
		t.Fatalf("migrator connect: %v", err)
	}
	defer migr.Close(ctx)
	var role, migrSchema string
	if err := migr.QueryRow(ctx, "SHOW role").Scan(&role); err != nil {
		t.Fatalf("SHOW role: %v", err)
	}
	if strings.TrimSpace(role) != b1Owner {
		t.Fatalf("migrator SHOW role = %q, want %q", role, b1Owner)
	}
	if err := migr.QueryRow(ctx, "SELECT current_schema()").Scan(&migrSchema); err != nil {
		t.Fatalf("migrator current_schema: %v", err)
	}
	if migrSchema != b1Schema {
		t.Fatalf("migrator current_schema = %q, want %q", migrSchema, b1Schema)
	}

	// 6d. BFF role: full CRUD on its own table, nothing else (fresh login, schema-qualified).
	bff, err := pgx.Connect(ctx, b1FreshRoleDSN(t, adminDSN, b1BFF, bffPass))
	if err != nil {
		t.Fatalf("bff connect: %v", err)
	}
	defer bff.Close(ctx)
	if _, err := bff.Exec(ctx, `INSERT INTO mc_bff.state (state_key, sealed, expires_at)
		VALUES ('op-seq-key', decode('00ff', 'hex'), now() + interval '1 hour')`); err != nil {
		t.Fatalf("bff insert: %v", err)
	}
	var sealed []byte
	if err := bff.QueryRow(ctx, `SELECT sealed FROM mc_bff.state WHERE state_key = 'op-seq-key'`).Scan(&sealed); err != nil {
		t.Fatalf("bff select: %v", err)
	}
	if _, err := bff.Exec(ctx, `DELETE FROM mc_bff.state WHERE state_key = 'op-seq-key'`); err != nil {
		t.Fatalf("bff delete: %v", err)
	}

	// 6e. Refusals stay intact after the real file sequence (no fixture-only grants were used).
	if _, err := run.Exec(ctx, `CREATE TABLE mcapp.evil (id int)`); err == nil {
		t.Fatal("runtime CREATE TABLE must be denied")
	} else if !isPrivilegeDenied(err) {
		t.Fatalf("expected a privilege error, got %v", err)
	}
	if _, err := bff.Exec(ctx, `SELECT count(*) FROM mcapp.users`); err == nil {
		t.Fatal("BFF must not read product tables")
	} else if !isPrivilegeDenied(err) {
		t.Fatalf("expected a privilege error, got %v", err)
	}

	// 6f. Metadata Quick Search as mc_runtime: the function grant AND the table rights. First the
	// function itself, then a real search through the store with EN/VI folding.
	var folded string
	if err := run.QueryRow(ctx, `SELECT mc_search_key_v1('Đặng Văn')`).Scan(&folded); err != nil {
		t.Fatalf("runtime cannot call mc_search_key_v1 (grant missing?): %v", err)
	}
	if folded != "dang van" {
		t.Fatalf("mc_search_key_v1('Đặng Văn') = %q, want dang van", folded)
	}

	// Seed through the documented authority: the constrained bootstrap admin is a member of the
	// NOLOGIN owner, so it can seed mcapp.users (the runbook's operator seeding step).
	if _, err := op.Exec(ctx, `INSERT INTO mcapp.users (id, idp_issuer, idp_subject, display_name)
		VALUES (gen_random_uuid(), 'http://b1-op-seq.synthetic.test', 'op-seq-admin-seed', 'admin-seed')`); err != nil {
		t.Fatalf("admin seeding authority: %v", err)
	}

	// Real search: a member sees their workspace/matter (EN query folds the VI label); a
	// non-member sees nothing. Runtime store on a fresh login without DSN search_path.
	var actorID string
	if err := run.QueryRow(ctx, `SELECT id FROM users WHERE idp_subject = 'op-seq-a'`).Scan(&actorID); err != nil {
		t.Fatalf("lookup probe actor: %v", err)
	}
	if _, err := run.Exec(ctx, `INSERT INTO workspaces (id, name) VALUES (gen_random_uuid(), 'Hồ sơ nghiệm thu B1')`); err != nil {
		t.Fatalf("seed workspace: %v", err)
	}
	if _, err := run.Exec(ctx, `INSERT INTO workspace_memberships (workspace_id, user_id, role, status)
		SELECT w.id, $1, 'OWNER', 'ACTIVE' FROM workspaces w WHERE w.name = 'Hồ sơ nghiệm thu B1'`, actorID); err != nil {
		t.Fatalf("seed membership: %v", err)
	}
	if _, err := run.Exec(ctx, `INSERT INTO matters (id, workspace_id, title)
		SELECT gen_random_uuid(), w.id, 'Hồ sơ D-1 vật chất' FROM workspaces w WHERE w.name = 'Hồ sơ nghiệm thu B1'`); err != nil {
		t.Fatalf("seed matter: %v", err)
	}
	// Search requires BOTH a workspace and an active matter membership for the actor.
	if _, err := run.Exec(ctx, `INSERT INTO matter_memberships (matter_id, user_id, role, status)
		SELECT m.id, $1, 'OWNER', 'ACTIVE' FROM matters m WHERE m.title = 'Hồ sơ D-1 vật chất'`, actorID); err != nil {
		t.Fatalf("seed matter membership: %v", err)
	}

	storePool := mustRuntimePool(t, ctx, b1FreshRoleDSN(t, adminDSN, b1Run, runPass))
	defer storePool.Close()
	store := NewMatterStore(storePool)
	for _, q := range []string{"ho so", "Hồ Sơ", "d-1"} {
		page, err := store.SearchPage(ctx, port.SearchRead{
			Binding: port.SearchBinding{ActorID: actorID, Group: "matters", Query: q, Limit: 5},
		})
		if err != nil {
			t.Fatalf("search %q as runtime: %v", q, err)
		}
		if len(page.Items) != 1 || page.Items[0].Label != "Hồ sơ D-1 vật chất" {
			t.Fatalf("search %q = %+v, want exactly the seeded matter", q, page.Items)
		}
	}
	var outsiderID string
	if err := run.QueryRow(ctx, `SELECT id FROM users WHERE idp_subject = 'op-seq-admin-seed'`).Scan(&outsiderID); err != nil {
		t.Fatalf("lookup outsider: %v", err)
	}
	hidden, err := store.SearchPage(ctx, port.SearchRead{
		Binding: port.SearchBinding{ActorID: outsiderID, Group: "matters", Query: "ho so", Limit: 5},
	})
	if err != nil {
		t.Fatalf("search as non-member: %v", err)
	}
	if len(hidden.Items) != 0 {
		t.Fatalf("non-member search leaked: %+v", hidden.Items)
	}
}

// The search-test pool rides a fresh runtime login (no DSN search_path — the role setting must
// carry the schema resolution for the store's unqualified queries too).
func mustRuntimePool(t *testing.T, ctx context.Context, dsn string) *pgxpool.Pool {
	t.Helper()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("runtime pool: %v", err)
	}
	return pool
}

func pgtestDSNPath(t *testing.T, dsn string) string {
	t.Helper()
	cfg, err := pgx.ParseConfig(dsn)
	if err != nil {
		t.Fatalf("parse DSN: %v", err)
	}
	return cfg.Database
}

func pgtestQuoteIdent(name string) string {
	return `"` + strings.ReplaceAll(name, `"`, `""`) + `"`
}
