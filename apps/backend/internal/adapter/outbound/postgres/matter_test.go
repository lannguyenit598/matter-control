package postgres

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/netip"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
	"leonx.me/matter-control/internal/adapter/outbound/sheet"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// pgWorld implements mattercontrol.World over the product schema with handwritten test
// SQL (handwritten SQL outside generated queries is allowed in tests only). Every
// statement is a fixed literal with bind parameters; no SQL is built by concatenation.
type pgWorld struct {
	pool *pgxpool.Pool
	tb   testing.TB
	dsn  string
}

func (w *pgWorld) check(sqlLabel string, err error) {
	w.tb.Helper()
	if err != nil {
		w.tb.Fatalf("%s: %v", sqlLabel, err)
	}
}

// AddUser records a product identity.
func (w *pgWorld) AddUser(id matter.ActorID) {
	_, err := w.pool.Exec(context.Background(),
		`INSERT INTO users (id, idp_issuer, idp_subject, display_name) VALUES ($1, $2, $3, $4)
		 ON CONFLICT (id) DO NOTHING`,
		id.String(), "https://idp.example.test", "sub|"+id.String(), "Test User")
	w.check("insert user", err)
}

func (w *pgWorld) AddWorkspace(id matter.WorkspaceID) {
	_, err := w.pool.Exec(context.Background(),
		`INSERT INTO workspaces (id, name) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
		id.String(), "Workspace")
	w.check("insert workspace", err)
}

func (w *pgWorld) SetWorkspaceMembership(ws matter.WorkspaceID, actor matter.ActorID, role matter.WorkspaceRole, status matter.MembershipStatus) {
	_, err := w.pool.Exec(context.Background(),
		`INSERT INTO workspace_memberships (workspace_id, user_id, role, status) VALUES ($1, $2, $3, $4)
		 ON CONFLICT (workspace_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status, revision = workspace_memberships.revision + 1`,
		ws.String(), actor.String(), string(role), string(status))
	w.check("set workspace membership", err)
}

func (w *pgWorld) AddMatter(id matter.MatterID, ws matter.WorkspaceID) {
	_, err := w.pool.Exec(context.Background(),
		`INSERT INTO matters (id, workspace_id, title) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING`,
		id.String(), ws.String(), "Matter")
	w.check("insert matter", err)
}

func (w *pgWorld) SetMatterMembership(m matter.MatterID, actor matter.ActorID, role matter.MatterRole, status matter.MembershipStatus) {
	_, err := w.pool.Exec(context.Background(),
		`INSERT INTO matter_memberships (matter_id, user_id, role, status) VALUES ($1, $2, $3, $4)
		 ON CONFLICT (matter_id, user_id) DO UPDATE SET role = EXCLUDED.role, status = EXCLUDED.status, revision = matter_memberships.revision + 1`,
		m.String(), actor.String(), string(role), string(status))
	w.check("set matter membership", err)
}

// InsertActionNode adds an ACTION node with its typed row in ONE statement (a
// data-modifying CTE is atomic, so typed totality holds): the kind-mismatch fixture
// must itself obey the constraint it tests.
func (w *pgWorld) InsertActionNode(id matter.NodeID, m matter.MatterID) {
	_, err := w.pool.Exec(context.Background(),
		`WITH node AS (
		     INSERT INTO graph_nodes (id, matter_id, kind) VALUES ($1, $2, 'ACTION')
		 )
		 INSERT INTO actions (id, kind, matter_id, title, outcome, execution_state,
		                      dependency_state, proof_required, revision)
		 SELECT $1, 'ACTION', $2, 'Structural action', 'Structural typed-totality row',
		        'NOT_STARTED', 'READY', false, 1`,
		id.String(), m.String())
	w.check("insert action node", err)
}

// Counts reports per-table row counts for atomicity assertions, in one fixed-literal
// query.
// SetVerification pins a Requirement's verification state without any command.
func (w *pgWorld) SetVerification(id matter.NodeID, state matter.VerificationState) {
	_, err := w.pool.Exec(context.Background(),
		`UPDATE requirements SET verification_state = $2 WHERE id = $1`, id.String(), string(state))
	w.check("set verification", err)
}

func (w *pgWorld) Counts() mattercontrol.Counts {
	var c mattercontrol.Counts
	err := w.pool.QueryRow(context.Background(), `SELECT
		(SELECT count(*) FROM graph_nodes),
		(SELECT count(*) FROM requirements),
		(SELECT count(*) FROM actions),
		(SELECT count(*) FROM domain_events),
		(SELECT count(*) FROM command_receipts),
		(SELECT count(*) FROM command_receipt_matters),
		(SELECT count(*) FROM security_audit_events),
		(SELECT count(*) FROM matters),
		(SELECT count(*) FROM workspace_memberships),
		(SELECT count(*) FROM matter_memberships)`).
		Scan(&c.Nodes, &c.Requirements, &c.Actions, &c.Events, &c.Receipts,
			&c.ReceiptMatters, &c.Audits, &c.Matters, &c.WorkspaceMembers, &c.MatterMembers)
	w.check("counts", err)
	return c
}

func (w *pgWorld) Requirement(id matter.RequirementID) (matter.Requirement, bool) {
	var title, outcome, exec, dep, ver, app string
	var revision int64
	var epoch int32
	err := w.pool.QueryRow(context.Background(),
		`SELECT title, outcome, execution_state, dependency_state, verification_state,
		        verification_applicability, proof_epoch, revision
		 FROM requirements WHERE id = $1`, id.String()).
		Scan(&title, &outcome, &exec, &dep, &ver, &app, &epoch, &revision)
	if errors.Is(err, pgx.ErrNoRows) {
		return matter.Requirement{}, false
	}
	w.check("requirement", err)
	return matter.Requirement{
		ID: id, Title: title, Outcome: outcome,
		ExecutionState:            matter.ExecutionState(exec),
		DependencyState:           matter.DependencyState(dep),
		VerificationState:         matter.VerificationState(ver),
		VerificationApplicability: matter.VerificationApplicability(app),
		ProofEpoch:                int64(epoch),
		Revision:                  revision,
	}, true
}

func (w *pgWorld) Events() []matter.RequirementCreatedEvent {
	ctx := context.Background()
	rows, err := w.pool.Query(ctx,
		`SELECT matter_id, seq, id, actor_id, target_id, effective_at, recorded_at, command_key, after
		 FROM domain_events ORDER BY matter_id, seq`)
	w.check("events", err)
	defer rows.Close()
	var out []matter.RequirementCreatedEvent
	for rows.Next() {
		var e matter.RequirementCreatedEvent
		var matterID, actorID, targetID, commandKey string
		var payload []byte
		if err := rows.Scan(&matterID, &e.Seq, &e.EventID, &actorID, &targetID,
			&e.EffectiveAt, &e.RecordedAt, &commandKey, &payload); err != nil {
			w.tb.Fatalf("scan event: %v", err)
		}
		e.MatterID = matter.MatterID(matterID)
		e.Actor = matter.ActorID(actorID)
		e.TargetID = matter.RequirementID(targetID)
		e.IdempotencyKey = matter.IdempotencyKey(commandKey)
		var dto requirementDTO
		if err := json.Unmarshal(payload, &dto); err != nil {
			w.tb.Fatalf("decode event payload: %v", err)
		}
		e.Requirement = dto.toDomain()
		out = append(out, e)
	}
	w.check("events iterate", rows.Err())
	return out
}

func (w *pgWorld) Receipts() []matter.Receipt {
	ctx := context.Background()
	rows, err := w.pool.Query(ctx,
		`SELECT actor_id, idempotency_key, request_hash, scope_kind, workspace_id, matter_id,
		        status_code, response, committed_at
		 FROM command_receipts ORDER BY committed_at, actor_id`)
	w.check("receipts", err)
	defer rows.Close()
	var out []matter.Receipt
	for rows.Next() {
		var rc matter.Receipt
		var actorID, key, scope, ws string
		var hash []byte
		var response []byte
		var matterID *string
		if err := rows.Scan(&actorID, &key, &hash, &scope, &ws, &matterID,
			&rc.StatusCode, &response, &rc.CommittedAt); err != nil {
			w.tb.Fatalf("scan receipt: %v", err)
		}
		rc.ActorID = matter.ActorID(actorID)
		rc.IdempotencyKey = matter.IdempotencyKey(key)
		rc.RequestHash = matter.RequestHash(hex.EncodeToString(hash))
		rc.ScopeKind = matter.ScopeKind(scope)
		rc.WorkspaceID = matter.WorkspaceID(ws)
		if matterID != nil {
			id := matter.MatterID(*matterID)
			rc.MatterID = &id
		}
		snap, err := decodeCreatedResult(response)
		if err != nil {
			w.tb.Fatalf("decode receipt: %v", err)
		}
		rc.Snapshot = snap

		mrows, err := w.pool.Query(ctx,
			`SELECT represented_matter_id FROM command_receipt_matters WHERE actor_id = $1 AND idempotency_key = $2`,
			actorID, key)
		w.check("receipt matters", err)
		for mrows.Next() {
			var m string
			if err := mrows.Scan(&m); err != nil {
				w.tb.Fatalf("scan receipt matter: %v", err)
			}
			rc.Matters = append(rc.Matters, matter.MatterID(m))
		}
		mrows.Close()
		out = append(out, rc)
	}
	w.check("receipts iterate", rows.Err())
	return out
}

func (w *pgWorld) Audits() []matter.SecurityAuditEntry {
	ctx := context.Background()
	rows, err := w.pool.Query(ctx,
		`SELECT id, occurred_at, actor_id, operation, outcome, requested_resource_kind, requested_id_hash, client_ip, request_id
		 FROM security_audit_events ORDER BY occurred_at, id`)
	w.check("audits", err)
	defer rows.Close()
	var out []matter.SecurityAuditEntry
	for rows.Next() {
		var e matter.SecurityAuditEntry
		var actor string
		var kind, requestID *string
		var clientIP *netip.Addr
		if err := rows.Scan(&e.EventID, &e.OccurredAt, &actor, &e.Operation, &e.Outcome,
			&kind, &e.RequestedIDHash, &clientIP, &requestID); err != nil {
			w.tb.Fatalf("scan audit: %v", err)
		}
		if kind != nil {
			e.RequestedResourceKind = *kind
		}
		if clientIP != nil {
			e.ClientIP = clientIP.String()
		}
		if requestID != nil {
			e.RequestID = *requestID
		}
		e.Actor = matter.ActorID(actor)
		out = append(out, e)
	}
	w.check("audits iterate", rows.Err())
	return out
}

// Reopen builds a NEW pool over the same schema, simulating a repository restart.
func (w *pgWorld) Reopen() port.MatterStore {
	pool, err := pgxpool.New(context.Background(), w.dsn)
	w.check("reopen pool", err)
	w.tb.Cleanup(pool.Close)
	return NewMatterStore(pool)
}

// SetElapsedBoundary pins a pending temporal boundary in the recent past. The schema
// CHECK requires next_boundary_at > boundaries_applied_until at write time, so
// boundaries_applied_until moves back with it; at command time the boundary is due.
func (w *pgWorld) SetElapsedBoundary(m matter.MatterID) {
	_, err := w.pool.Exec(context.Background(),
		`UPDATE matters SET next_boundary_at = clock_timestamp() - interval '1 second',
		                       boundaries_applied_until = clock_timestamp() - interval '2 seconds'
		 WHERE id = $1`, m.String())
	w.check("set elapsed boundary", err)
}

// SetFutureBoundary pins a pending temporal boundary one hour ahead: not due.
func (w *pgWorld) SetFutureBoundary(m matter.MatterID) {
	_, err := w.pool.Exec(context.Background(),
		`UPDATE matters SET next_boundary_at = clock_timestamp() + interval '1 hour'
		 WHERE id = $1`, m.String())
	w.check("set future boundary", err)
}

// NextBoundary reads the matter's pending boundary, if any.
func (w *pgWorld) NextBoundary(m matter.MatterID) (time.Time, bool) {
	var next *time.Time
	err := w.pool.QueryRow(context.Background(),
		`SELECT next_boundary_at FROM matters WHERE id = $1`, m.String()).Scan(&next)
	w.check("next boundary", err)
	if next == nil {
		return time.Time{}, false
	}
	return *next, true
}

var _ mattercontrol.World = (*pgWorld)(nil)

// ---------- test entrypoints ----------

// discardLogger keeps migration logs out of test output.
func discardLogger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

// newProductStore migrates a fresh per-test schema in the product database
// (MC_TEST_DATABASE_URL) and returns the wrapped store plus its world.
func newProductStore(t *testing.T) (mattercontrol.Bundle, *faultCapableStore) {
	t.Helper()
	dsn := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	if err := MigrateMatterControl(ctx, dsn, discardLogger()); err != nil {
		t.Fatalf("migrate mattercontrol: %v", err)
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("pool: %v", err)
	}
	t.Cleanup(pool.Close)
	fs := &faultCapableStore{inner: NewMatterStore(pool)}
	world := &pgWorld{pool: pool, tb: t, dsn: dsn}
	return mattercontrol.Bundle{Store: fs, World: world}, fs
}

// TestMatterSuite_Postgres runs the shared transaction-spine contract against the real
// PostgreSQL adapter with per-test schemas in the product fixture database (BE01-T09).
func TestMatterSuite_Postgres(t *testing.T) {
	mattercontrol.Suite(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	})
}

// TestMatterSuiteW1_Postgres runs the shared W1 administration contract against the
// real adapter.
func TestMatterSuiteW1_Postgres(t *testing.T) {
	mattercontrol.SuiteW1(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	})
}

// TestMatterSuiteW2_Postgres runs the shared W2 work-graph contract against the real adapter.
func TestMatterSuiteW2_Postgres(t *testing.T) {
	mattercontrol.SuiteW2(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	})
}

// TestMatterSuiteW3_Postgres runs the shared W3 documents/proof contract against the real adapter.
func TestMatterSuiteW3_Postgres(t *testing.T) {
	mattercontrol.SuiteW3(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	})
}

// TestMatterSuiteW4_Postgres runs the shared W4 regulatory-filing contract against the real adapter.
func TestMatterSuiteW4_Postgres(t *testing.T) {
	mattercontrol.SuiteW4(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	})
}

// TestMatterSuiteW5_Postgres runs the shared W5 Control Room / context contract against the real adapter.
func TestMatterSuiteW5_Postgres(t *testing.T) {
	mattercontrol.SuiteW5(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	})
}

// BE01-T09: the product bundle applies to an empty schema, a second run is a no-op,
// and no pending migrations remain.
func TestMatterMigrations_Idempotent(t *testing.T) {
	dsn := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	for range 2 {
		if err := MigrateMatterControl(ctx, dsn, discardLogger()); err != nil {
			t.Fatalf("migrate: %v", err)
		}
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	pending, err := PendingMatterControlMigrations(ctx, pool)
	if err != nil {
		t.Fatalf("pending: %v", err)
	}
	if pending {
		t.Fatal("migrations still pending after two runs")
	}
}

// BE01-T09 (DM-09 analog): a graph node without its typed row cannot commit — the
// deferred totality trigger rejects it, and nothing persists; the no-delete guard
// holds as well.
func TestGraphNode_TypedTotalityEnforced(t *testing.T) {
	dsn := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	ctx := context.Background()
	if err := MigrateMatterControl(ctx, dsn, discardLogger()); err != nil {
		t.Fatal(err)
	}
	conn, err := pgx.Connect(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer conn.Close(ctx)

	var ws, m string
	if err := conn.QueryRow(ctx,
		`INSERT INTO workspaces (id, name) VALUES ($1, 'w') RETURNING id`, uuid.NewString()).Scan(&ws); err != nil {
		t.Fatal(err)
	}
	if err := conn.QueryRow(ctx,
		`INSERT INTO matters (id, workspace_id, title) VALUES ($1, $2, 'm') RETURNING id`,
		uuid.NewString(), ws).Scan(&m); err != nil {
		t.Fatal(err)
	}
	if _, err := conn.Exec(ctx,
		`INSERT INTO users (id, idp_issuer, idp_subject, display_name)
		 VALUES ($1, 'https://i', 's', 'n') ON CONFLICT DO NOTHING`, uuid.NewString()); err != nil {
		t.Fatal(err)
	}

	_, err = conn.Exec(ctx,
		`INSERT INTO graph_nodes (id, matter_id, kind) VALUES ($1, $2, 'REQUIREMENT')`,
		uuid.NewString(), m)
	if err == nil {
		t.Fatal("orphan node committed; typed totality not enforced")
	}
	var nodes int
	if err := conn.QueryRow(ctx, `SELECT count(*) FROM graph_nodes`).Scan(&nodes); err != nil {
		t.Fatal(err)
	}
	if nodes != 0 {
		t.Fatalf("orphan node persisted: %d", nodes)
	}

	// No-hard-delete guard: with an existing node+typed row, DELETE is rejected
	// (a row-level trigger cannot prove itself on an empty table).
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatal(err)
	}
	defer pool.Close()
	world := &pgWorld{pool: pool, tb: t}
	world.InsertActionNode(matter.NodeID(uuid.NewString()), matter.MatterID(m))
	if _, err := conn.Exec(ctx, `DELETE FROM graph_nodes`); err == nil {
		t.Fatal("graph_nodes delete allowed")
	}
	if err := conn.QueryRow(ctx, `SELECT count(*) FROM graph_nodes`).Scan(&nodes); err != nil {
		t.Fatal(err)
	}
	if nodes != 1 {
		t.Fatalf("node count after rejected delete = %d, want 1", nodes)
	}
}

// BE01-T08: error classification — receipt PK conflict is key reuse; retryable
// SQLSTATEs are unavailable; unrelated unique violations are neither.
func TestMapMatterError_Classification(t *testing.T) {
	receiptPK := &pgconn.PgError{Code: "23505", ConstraintName: "command_receipts_pkey"}
	if !errors.Is(mapMatterError(fmt.Errorf("wrap: %w", receiptPK)), port.ErrIdempotencyKeyReuse) {
		t.Fatal("receipt PK conflict must map to key reuse")
	}
	err := mapMatterError(fmt.Errorf("wrap: %w", &pgconn.PgError{Code: "40001"}))
	if !errors.Is(err, port.ErrUnavailable) {
		t.Fatalf("serialization failure must be unavailable, got %v", err)
	}
	if errors.Is(err, port.ErrOutcomeUnknown) {
		t.Fatal("known abort must not be outcome-unknown")
	}
	other := &pgconn.PgError{Code: "23505", ConstraintName: "users_email_key"}
	if errors.Is(mapMatterError(fmt.Errorf("wrap: %w", other)), port.ErrIdempotencyKeyReuse) {
		t.Fatal("unrelated unique violation misclassified as key reuse")
	}
}

// faultCapableStore adds the suite's fail/commit injection seams to the real adapter.
type faultCapableStore struct {
	inner *MatterStore
	fail  string
	mu    sync.Mutex
}

var _ port.WorkspaceStore = (*faultCapableStore)(nil)

func (f *faultCapableStore) SetFailAt(step string) { f.fail = step }

func (f *faultCapableStore) SetCommitRollback(err error) { f.inner.commitAbort = err }
func (f *faultCapableStore) SetCommitUnknown(err error) {
	f.inner.commitFail = func() error { return err }
}

func (f *faultCapableStore) Execute(ctx context.Context, matterID matter.MatterID, fn func(tx port.MatterTx) error) error {
	f.mu.Lock()
	step := f.fail
	f.mu.Unlock()
	if step == "" {
		return f.inner.Execute(ctx, matterID, fn)
	}
	return f.inner.Execute(ctx, matterID, func(tx port.MatterTx) error {
		return fn(&failingTx{tx: tx, step: step})
	})
}

func (f *faultCapableStore) ExecuteWorkspace(ctx context.Context, ws matter.WorkspaceID, fn func(tx port.WorkspaceTx) error) error {
	return f.inner.ExecuteWorkspace(ctx, ws, fn)
}

func (f *faultCapableStore) ExecuteCreation(ctx context.Context, fn func(tx port.WorkspaceCreationTx) error) error {
	return f.inner.ExecuteCreation(ctx, fn)
}

func (f *faultCapableStore) View(ctx context.Context, fn func(snap port.MatterSnapshot) error) error {
	f.mu.Lock()
	step := f.fail
	f.mu.Unlock()
	if step == "" {
		return f.inner.View(ctx, fn)
	}
	return f.inner.View(ctx, func(snap port.MatterSnapshot) error {
		return fn(&failingSnapshot{snap: snap, step: step})
	})
}

type failingTx struct {
	tx   port.MatterTx
	step string
}

func (t *failingTx) Matter() matter.MatterHeader { return t.tx.Matter() }
func (t *failingTx) TCmd() time.Time             { return t.tx.TCmd() }

func (t *failingTx) WorkspaceMembership(ctx context.Context, ws matter.WorkspaceID, a matter.ActorID) (matter.WorkspaceMembership, error) {
	if err := membershipFailure(t.step); err != nil {
		return matter.WorkspaceMembership{}, err
	}
	return t.tx.WorkspaceMembership(ctx, ws, a)
}
func (t *failingTx) MatterMembership(ctx context.Context, m matter.MatterID, a matter.ActorID) (matter.MatterMembership, error) {
	if err := membershipFailure(t.step); err != nil {
		return matter.MatterMembership{}, err
	}
	return t.tx.MatterMembership(ctx, m, a)
}
func (t *failingTx) Receipt(ctx context.Context, a matter.ActorID, k matter.IdempotencyKey) (matter.Receipt, error) {
	return t.tx.Receipt(ctx, a, k)
}
func (t *failingTx) InsertNode(ctx context.Context, n matter.Node) error {
	if t.step == "insert_node" {
		return errInjected
	}
	return t.tx.InsertNode(ctx, n)
}
func (t *failingTx) InsertRequirement(ctx context.Context, r matter.Requirement) error {
	if t.step == "insert_requirement" {
		return errInjected
	}
	return t.tx.InsertRequirement(ctx, r)
}
func (t *failingTx) AppendRequirementCreated(ctx context.Context, e matter.RequirementCreatedEvent) error {
	if t.step == "append_event" {
		return errInjected
	}
	return t.tx.AppendRequirementCreated(ctx, e)
}
func (t *failingTx) StoreReceipt(ctx context.Context, rc matter.Receipt) error {
	if t.step == "store_receipt" {
		return errInjected
	}
	return t.tx.StoreReceipt(ctx, rc)
}
func (t *failingTx) CompleteMatter(ctx context.Context, seq int64, tCmd time.Time) error {
	if t.step == "complete_matter" {
		return errInjected
	}
	return t.tx.CompleteMatter(ctx, seq, tCmd)
}
func (t *failingTx) RecordSecurityAudit(ctx context.Context, e matter.SecurityAuditEntry) error {
	return t.tx.RecordSecurityAudit(ctx, e)
}

var errInjected = errors.New("injected failure")

// membershipFailure mirrors the adapters' real failure shapes for the membership
// seam steps: "membership_unavailable" wraps port.ErrUnavailable exactly like a
// driver failure; "membership_unexpected" is any non-ErrNotFound failure. Only
// ErrNotFound (never injected) means absence.
func membershipFailure(step string) error {
	switch step {
	case "membership_unavailable":
		return fmt.Errorf("matter store: %w: %w", port.ErrUnavailable, errInjected)
	case "membership_unexpected":
		return fmt.Errorf("matter store: %w", errInjected)
	}
	return nil
}

// failingSnapshot injects membership lookup failures into View snapshots so the
// read path's propagation (BE01-F03) is exercised against the real adapter.
type failingSnapshot struct {
	snap port.MatterSnapshot
	step string
}

func (s *failingSnapshot) AsOf() time.Time { return s.snap.AsOf() }

func (s *failingSnapshot) RequirementByID(ctx context.Context, id matter.RequirementID) (matter.Requirement, matter.MatterID, error) {
	return s.snap.RequirementByID(ctx, id)
}

func (s *failingSnapshot) MatterHeader(ctx context.Context, id matter.MatterID) (matter.MatterHeader, error) {
	return s.snap.MatterHeader(ctx, id)
}

func (s *failingSnapshot) WorkspaceMembership(ctx context.Context, ws matter.WorkspaceID, a matter.ActorID) (matter.WorkspaceMembership, error) {
	if err := membershipFailure(s.step); err != nil {
		return matter.WorkspaceMembership{}, err
	}
	return s.snap.WorkspaceMembership(ctx, ws, a)
}

func (s *failingSnapshot) MatterMembership(ctx context.Context, m matter.MatterID, a matter.ActorID) (matter.MatterMembership, error) {
	if err := membershipFailure(s.step); err != nil {
		return matter.MatterMembership{}, err
	}
	return s.snap.MatterMembership(ctx, m, a)
}

func (s *failingSnapshot) WorkspaceByID(ctx context.Context, id matter.WorkspaceID) (matter.Workspace, error) {
	if err := membershipFailure(s.step); err != nil {
		return matter.Workspace{}, err
	}
	return s.snap.WorkspaceByID(ctx, id)
}

// TestMatterSuiteW7QA_Postgres runs the postrun QA regressions (F01..F03) against the real adapter.
func TestMatterSuiteW7QA_Postgres(t *testing.T) {
	mattercontrol.SuiteW7QA(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	})
}

// TestMatterSuiteW6_Postgres runs the shared W6 import contract against the real adapter.
func TestMatterSuiteW6_Postgres(t *testing.T) {
	mattercontrol.SuiteW6(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	}, sheet.Codec{})
}

// TestMatterSuiteGW_Postgres runs the original Golden Workflow ledgers against the real adapter.
func TestMatterSuiteGW_Postgres(t *testing.T) {
	mattercontrol.SuiteGW(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	})
}

// TestMatterSuiteReview_Postgres runs the shared review-matrix contract against the real adapter.
func TestMatterSuiteReview_Postgres(t *testing.T) {
	mattercontrol.SuiteReview(t, func(t *testing.T) mattercontrol.Bundle {
		b, _ := newProductStore(t)
		return b
	})
}
