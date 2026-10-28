package port

import (
	"context"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
)

// ---------- Inbound (driving): MatterControl transaction spine ----------
//
// Commands and queries carry only primitives, following the port contract. ActorID is
// a trusted calling identity (product users.id) supplied by the boundary; this slice
// proves membership/role enforcement, not authentication.

// CreateRequirementCmd creates a Requirement in its initial state. RequestHash is the
// trusted server fingerprint of the command intent; it is replay-input, not a client
// trust claim.
type CreateRequirementCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	Title          string
	Outcome        string
}

// GetRequirementQuery reads one Requirement through an authorized snapshot.
type GetRequirementQuery struct {
	ActorID string
	ID      string
}

// MatterService defines the MatterControl use cases of this slice.
type MatterService interface {
	CreateRequirement(ctx context.Context, cmd CreateRequirementCmd) (matter.RequirementCreatedResult, error)
	GetRequirement(ctx context.Context, q GetRequirementQuery) (matter.RequirementRead, error)
}

// RecordIDGenerator mints ids for MatterControl records (graph nodes, events, receipts,
// audit rows). It is deliberately separate from IDGenerator: product records are not
// legacy users and their ids must never be cast into domain.UserID.
type RecordIDGenerator interface {
	NewRecordID() string
}

// ---------- Outbound (driven): Matter transaction and snapshot ----------

// MatterStore is the persistence boundary of the MatterControl spine.
//
// Error contract (required for every adapter):
//   - Execute always runs fn in ONE READ COMMITTED transaction that first locks the
//     matter row FOR UPDATE and captures the command instant t_cmd =
//     greatest(clock_timestamp(), matters.last_recorded_at); it never runs on a pool
//     without a transaction. An error from fn rolls back every change. A commit-phase
//     failure returns an error wrapping ErrOutcomeUnknown unless PostgreSQL provably
//     aborted the transaction (retryable SQLSTATEs wrap ErrUnavailable instead).
//   - View always runs fn in ONE REPEATABLE READ READ ONLY snapshot; the first
//     statement captures asOf. Driver failures wrap ErrUnavailable; View never
//     invents empty or not-found results.
//   - Row methods return ErrNotFound for absent rows; unique violations on the
//     command_receipts primary key wrap ErrIdempotencyKeyReuse (with rollback of the
//     open transaction in Execute).
type MatterStore interface {
	// Execute runs fn atomically for one matter, following the documented lock order:
	// matter row FOR UPDATE, then workspace and matter memberships, then typed rows,
	// history, receipts, and the matters update last.
	Execute(ctx context.Context, matterID matter.MatterID, fn func(tx MatterTx) error) error
	// View runs fn in one consistent read-only snapshot.
	View(ctx context.Context, fn func(snap MatterSnapshot) error) error
}

// MatterTx runs inside an Execute transaction, after the matter row is locked and the
// command instant captured.
type MatterTx interface {
	// Matter returns the locked matter header. MatterID must match the Execute target.
	Matter() matter.MatterHeader
	// TCmd returns the captured DB command instant (nondecreasing per matter).
	TCmd() time.Time
	// WorkspaceMembership reads the caller's workspace membership with a share lock.
	// It returns ErrNotFound when no row exists.
	WorkspaceMembership(ctx context.Context, workspace matter.WorkspaceID, actor matter.ActorID) (matter.WorkspaceMembership, error)
	// MatterMembership reads the caller's matter membership with a share lock.
	// It returns ErrNotFound when no row exists.
	MatterMembership(ctx context.Context, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error)
	// Receipt returns the stored receipt for (actor, key), with the decoded immutable
	// snapshot; ErrNotFound when none exists.
	Receipt(ctx context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error)
	// InsertNode inserts the graph node row.
	InsertNode(ctx context.Context, node matter.Node) error
	// InsertRequirement inserts the typed requirement row for an existing node.
	InsertRequirement(ctx context.Context, r matter.Requirement) error
	// AppendRequirementCreated appends the typed creation history event with seq.
	AppendRequirementCreated(ctx context.Context, e matter.RequirementCreatedEvent) error
	// StoreReceipt stores the immutable outcome snapshot and one row per represented
	// matter. A unique violation on the receipt primary key wraps ErrIdempotencyKeyReuse.
	StoreReceipt(ctx context.Context, rc matter.Receipt) error
	// CompleteMatter advances event seq, recorded time and revision of the locked matter.
	CompleteMatter(ctx context.Context, seq int64, t time.Time) error
	// RecordSecurityAudit appends a restricted security-audit row; it contains no
	// titles, content or response bodies.
	RecordSecurityAudit(ctx context.Context, e matter.SecurityAuditEntry) error
}

// MatterSnapshot runs inside a View.
type MatterSnapshot interface {
	// AsOf returns the instant captured by the snapshot's first statement.
	AsOf() time.Time
	// RequirementByID returns the typed requirement and its owning matter.
	// It returns ErrNotFound uniformly for absent rows and for graph nodes whose kind
	// is not REQUIREMENT.
	RequirementByID(ctx context.Context, id matter.RequirementID) (matter.Requirement, matter.MatterID, error)
	// MatterHeader returns the matter state observed in this snapshot.
	MatterHeader(ctx context.Context, id matter.MatterID) (matter.MatterHeader, error)
	// WorkspaceMembership reads a workspace membership; ErrNotFound when absent.
	WorkspaceMembership(ctx context.Context, workspace matter.WorkspaceID, actor matter.ActorID) (matter.WorkspaceMembership, error)
	// MatterMembership reads a matter membership; ErrNotFound when absent.
	MatterMembership(ctx context.Context, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error)
	// WorkspaceByID returns the workspace header observed in this snapshot.
	WorkspaceByID(ctx context.Context, id matter.WorkspaceID) (matter.Workspace, error)
}
