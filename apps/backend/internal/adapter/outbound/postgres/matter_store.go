package postgres

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/example/userapi/internal/adapter/outbound/postgres/mcsqlc"
	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

// MatterStore persists the MatterControl transaction spine. Unlike the legacy
// UserRepository.write helper — which runs on the pool without a transaction when the
// outbox is disabled — every Execute here runs in ONE unconditional transaction, and
// every View in ONE REPEATABLE READ READ ONLY snapshot.
type MatterStore struct {
	pool *pgxpool.Pool

	// Test seams (unexported, in-package tests only): simulate commit-phase failures.
	commitFail  func() error // loses the acknowledgement after fn succeeded
	commitAbort error        // known abort at commit (e.g. serialization failure)
}

var _ port.MatterStore = (*MatterStore)(nil)

// NewMatterStore builds a store over an existing pool.
func NewMatterStore(pool *pgxpool.Pool) *MatterStore { return &MatterStore{pool: pool} }

// Execute locks the matter row FOR UPDATE, captures t_cmd = greatest(clock_timestamp(),
// last_recorded_at), runs fn in the same READ COMMITTED transaction, and commits once.
// Lock order inside fn: memberships (FOR SHARE), typed rows, history, receipt, then
// the matters update — the documented order reduces, but does not prove absence of,
// deadlocks; detected deadlocks map to retryable ErrUnavailable.
func (s *MatterStore) Execute(ctx context.Context, matterID matter.MatterID, fn func(tx port.MatterTx) error) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("matter store: %w: %w", port.ErrUnavailable, err)
	}
	tx, err := s.pool.Begin(ctx) // READ COMMITTED
	if err != nil {
		return mapMatterError(err)
	}
	defer func() { _ = tx.Rollback(ctx) }() // no-op after commit

	q := mcsqlc.New(tx)
	row, err := q.LockMatter(ctx, matterID.String())
	if err != nil {
		return mapMatterError(err)
	}
	header := lockRowToHeader(row)
	pgTx := &pgMatterTx{q: q, header: header, tCmd: row.TCmd.UTC()}
	if err := fn(pgTx); err != nil {
		return mapMatterError(err) // rolled back by the deferred Rollback
	}
	return s.commit(ctx, tx)
}

// commit finishes a write transaction once fn has succeeded. Shared by every Execute*
// variant so the commit-outcome contract (unknown vs known abort) is identical.
func (s *MatterStore) commit(ctx context.Context, tx pgx.Tx) error {
	if s.commitFail != nil {
		// Test seam: the commit itself happens, only the acknowledgement is lost —
		// a real lost-ack leaves the effect durable while the caller learns nothing.
		if err := s.commitFail(); err != nil {
			_ = tx.Commit(ctx) // best effort; either way the caller cannot know
			return fmt.Errorf("matter store commit: %w: %w", port.ErrOutcomeUnknown, err)
		}
	}
	if s.commitAbort != nil {
		return fmt.Errorf("matter store commit: %w: %w", port.ErrUnavailable, s.commitAbort)
	}
	if err := tx.Commit(ctx); err != nil {
		// A reported PostgreSQL error means the transaction did not commit (aborted or
		// rejected). Any other failure at commit time is a lost acknowledgement: the
		// outcome is unknown, never assumed rolled back.
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			return mapMatterError(err)
		}
		return fmt.Errorf("matter store commit: %w: %w", port.ErrOutcomeUnknown, err)
	}
	return nil
}

// View runs fn in one REPEATABLE READ READ ONLY snapshot; its first statement captures
// the asOf instant. Driver failures are unavailability, never invented empty results.
func (s *MatterStore) View(ctx context.Context, fn func(snap port.MatterSnapshot) error) error {
	if err := ctx.Err(); err != nil {
		return fmt.Errorf("matter store: %w: %w", port.ErrUnavailable, err)
	}
	tx, err := s.pool.BeginTx(ctx, pgx.TxOptions{IsoLevel: pgx.RepeatableRead, AccessMode: pgx.ReadOnly})
	if err != nil {
		return mapMatterError(err)
	}
	defer func() { _ = tx.Rollback(ctx) }() // read-only: always safe to discard

	q := mcsqlc.New(tx)
	asOf, err := q.GetSnapshotAsOf(ctx)
	if err != nil {
		return mapMatterError(err)
	}
	return fn(&pgSnapshot{q: q, asOf: asOf.UTC()})
}

func lockRowToHeader(row mcsqlc.LockMatterRow) matter.MatterHeader {
	return matter.MatterHeader{
		MatterID:               matter.MatterID(row.MatterID),
		WorkspaceID:            matter.WorkspaceID(row.WorkspaceID),
		Title:                  row.Title,
		EventSeq:               row.EventSeq,
		Revision:               row.Revision,
		LastRecordedAt:         row.LastRecordedAt.UTC(),
		BoundariesAppliedUntil: row.BoundariesAppliedUntil.UTC(),
		NextBoundaryAt:         timestamptzPtr(row.NextBoundaryAt),
	}
}

// ---------- write transaction ----------

type pgMatterTx struct {
	q      *mcsqlc.Queries
	header matter.MatterHeader
	tCmd   time.Time
}

func (t *pgMatterTx) Matter() matter.MatterHeader { return t.header }
func (t *pgMatterTx) TCmd() time.Time             { return t.tCmd }

func (t *pgMatterTx) WorkspaceMembership(ctx context.Context, ws matter.WorkspaceID, actor matter.ActorID) (matter.WorkspaceMembership, error) {
	row, err := t.q.GetWorkspaceMembershipForShare(ctx, mcsqlc.GetWorkspaceMembershipForShareParams{
		WorkspaceID: ws.String(), UserID: actor.String(),
	})
	if err != nil {
		return matter.WorkspaceMembership{}, mapMatterError(err)
	}
	return matter.WorkspaceMembership{
		WorkspaceID: matter.WorkspaceID(row.WorkspaceID),
		ActorID:     matter.ActorID(row.UserID),
		Role:        matter.WorkspaceRole(row.Role),
		Status:      matter.MembershipStatus(row.Status),
		Revision:    row.Revision,
	}, nil
}

func (t *pgMatterTx) MatterMembership(ctx context.Context, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error) {
	row, err := t.q.GetMatterMembershipForShare(ctx, mcsqlc.GetMatterMembershipForShareParams{
		MatterID: m.String(), UserID: actor.String(),
	})
	if err != nil {
		return matter.MatterMembership{}, mapMatterError(err)
	}
	return matter.MatterMembership{
		MatterID: matter.MatterID(row.MatterID),
		ActorID:  matter.ActorID(row.UserID),
		Role:     matter.MatterRole(row.Role),
		Status:   matter.MembershipStatus(row.Status),
		Revision: row.Revision,
	}, nil
}

func (t *pgMatterTx) Receipt(ctx context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error) {
	return findReceipt(ctx, t.q, actor, key)
}

func (t *pgMatterTx) InsertNode(ctx context.Context, node matter.Node) error {
	return mapMatterError(t.q.InsertGraphNode(ctx, mcsqlc.InsertGraphNodeParams{
		ID: node.ID.String(), MatterID: node.MatterID.String(), Kind: string(node.Kind),
	}))
}

func (t *pgMatterTx) InsertRequirement(ctx context.Context, r matter.Requirement) error {
	epoch, err := int32Checked(r.ProofEpoch)
	if err != nil {
		return err
	}
	return mapMatterError(t.q.InsertRequirement(ctx, mcsqlc.InsertRequirementParams{
		ID:                        r.ID.String(),
		MatterID:                  r.MatterID.String(),
		Title:                     r.Title,
		Outcome:                   r.Outcome,
		ExecutionState:            string(r.ExecutionState),
		DependencyState:           string(r.DependencyState),
		VerificationState:         string(r.VerificationState),
		VerificationApplicability: string(r.VerificationApplicability),
		ProofEpoch:                epoch,
		Revision:                  r.Revision,
	}))
}

func (t *pgMatterTx) AppendRequirementCreated(ctx context.Context, e matter.RequirementCreatedEvent) error {
	payload, err := encodeRequirementJSON(e.Requirement)
	if err != nil {
		return fmt.Errorf("matter store: encode event payload: %w", err)
	}
	return mapMatterError(t.q.InsertRequirementCreatedEvent(ctx, mcsqlc.InsertRequirementCreatedEventParams{
		MatterID:    e.MatterID.String(),
		Seq:         e.Seq,
		ID:          e.EventID,
		ActorID:     uuidString(e.Actor.String()),
		TargetID:    e.TargetID.String(),
		EffectiveAt: e.EffectiveAt,
		RecordedAt:  e.RecordedAt,
		CommandKey:  uuidString(e.IdempotencyKey.String()),
		After:       payload,
	}))
}

func (t *pgMatterTx) StoreReceipt(ctx context.Context, rc matter.Receipt) error {
	return storeReceipt(ctx, t.q, rc)
}

func (t *pgMatterTx) CompleteMatter(ctx context.Context, seq int64, tCmd time.Time) error {
	return mapMatterError(t.q.CompleteMatter(ctx, mcsqlc.CompleteMatterParams{
		ID: t.header.MatterID.String(), EventSeq: seq, LastRecordedAt: tCmd,
	}))
}

func (t *pgMatterTx) RecordSecurityAudit(ctx context.Context, e matter.SecurityAuditEntry) error {
	return recordSecurityAudit(ctx, t.q, e)
}

// ---------- read snapshot ----------

type pgSnapshot struct {
	q    *mcsqlc.Queries
	asOf time.Time
}

func (s *pgSnapshot) AsOf() time.Time { return s.asOf }

func (s *pgSnapshot) RequirementByID(ctx context.Context, id matter.RequirementID) (matter.Requirement, matter.MatterID, error) {
	row, err := s.q.GetRequirementByID(ctx, id.String())
	if err != nil {
		// Absent typed row covers nonexistent ids and ACTION nodes alike: uniform outcome.
		return matter.Requirement{}, "", mapMatterError(err)
	}
	req, err := requirementFromRow(row)
	if err != nil {
		return matter.Requirement{}, "", err
	}
	return req, matter.MatterID(row.MatterID), nil
}

// WorkspaceByID returns the workspace header observed in this snapshot (W1).
func (s *pgSnapshot) WorkspaceByID(ctx context.Context, id matter.WorkspaceID) (matter.Workspace, error) {
	row, err := s.q.GetWorkspaceByID(ctx, string(id))
	if err != nil {
		return matter.Workspace{}, mapMatterError(err)
	}
	return matter.Workspace{ID: matter.WorkspaceID(row.WorkspaceID), Name: row.Name, Revision: row.Revision}, nil
}

func (s *pgSnapshot) MatterHeader(ctx context.Context, id matter.MatterID) (matter.MatterHeader, error) {
	row, err := s.q.GetMatterHeader(ctx, id.String())
	if err != nil {
		return matter.MatterHeader{}, mapMatterError(err)
	}
	return matter.MatterHeader{
		MatterID:               matter.MatterID(row.MatterID),
		WorkspaceID:            matter.WorkspaceID(row.WorkspaceID),
		Title:                  row.Title,
		EventSeq:               row.EventSeq,
		Revision:               row.Revision,
		LastRecordedAt:         row.LastRecordedAt.UTC(),
		BoundariesAppliedUntil: row.BoundariesAppliedUntil.UTC(),
		NextBoundaryAt:         timestamptzPtr(row.NextBoundaryAt),
	}, nil
}

func (s *pgSnapshot) WorkspaceMembership(ctx context.Context, ws matter.WorkspaceID, actor matter.ActorID) (matter.WorkspaceMembership, error) {
	row, err := s.q.GetWorkspaceMembership(ctx, mcsqlc.GetWorkspaceMembershipParams{
		WorkspaceID: ws.String(), UserID: actor.String(),
	})
	if err != nil {
		return matter.WorkspaceMembership{}, mapMatterError(err)
	}
	return matter.WorkspaceMembership{
		WorkspaceID: matter.WorkspaceID(row.WorkspaceID),
		ActorID:     matter.ActorID(row.UserID),
		Role:        matter.WorkspaceRole(row.Role),
		Status:      matter.MembershipStatus(row.Status),
		Revision:    row.Revision,
	}, nil
}

func (s *pgSnapshot) MatterMembership(ctx context.Context, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error) {
	row, err := s.q.GetMatterMembership(ctx, mcsqlc.GetMatterMembershipParams{
		MatterID: m.String(), UserID: actor.String(),
	})
	if err != nil {
		return matter.MatterMembership{}, mapMatterError(err)
	}
	return matter.MatterMembership{
		MatterID: matter.MatterID(row.MatterID),
		ActorID:  matter.ActorID(row.UserID),
		Role:     matter.MatterRole(row.Role),
		Status:   matter.MembershipStatus(row.Status),
		Revision: row.Revision,
	}, nil
}

// ---------- error mapping ----------

// mapMatterError adapts the accepted SQLSTATE-first mapping to the MatterControl
// contract: the receipt primary key conflict is key reuse; everything else keeps the
// legacy classification (retryable classes wrap port.ErrUnavailable; no text matching).
func mapMatterError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, context.Canceled) || errors.Is(err, context.DeadlineExceeded) {
		return fmt.Errorf("matter store: %w: %w", port.ErrUnavailable, err)
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) &&
		pgErr.Code == uniqueViolation && pgErr.ConstraintName == "command_receipts_pkey" {
		return fmt.Errorf("matter store: %w", port.ErrIdempotencyKeyReuse)
	}
	return mapError(err)
}

// int32Checked converts without silent truncation; columns that store int32 must never
// receive an out-of-range domain value.
func int32Checked[T int | int64](v T) (int32, error) {
	if v < T(math.MinInt32) || v > T(math.MaxInt32) {
		return 0, fmt.Errorf("matter store: value %d overflows int32 column", v)
	}
	return int32(v), nil
}
