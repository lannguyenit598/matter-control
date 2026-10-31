package port

import (
	"context"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Inbound (driving): workspace/matter administration (W1) ----------
//
// Commands follow the spine contract: primitives in, domain results out, and
// authorization always runs inside the locked transaction. Receipt participation is
// per the contract §2.1 table: creation commands (CreateWorkspace/CreateMatter,
// plus BE01 CreateRequirement) carry idempotency keys with immutable outcome
// snapshots; membership grant/revocation are CAS-guarded audited commands WITHOUT
// receipts — their lost-response rule is the authorized re-read, never a state
// inference or a blind resend.

type CreateWorkspaceCmd struct {
	ActorID        string
	Name           string
	IdempotencyKey string
	RequestHash    string
}

type CreateMatterCmd struct {
	ActorID        string
	WorkspaceID    string
	Title          string
	IdempotencyKey string
	RequestHash    string
	// ExpectedRevision is the caller's view of the workspace revision (If-Match
	// strong-validator mapping). 0 = precondition omitted (428); a mismatch with the
	// locked workspace header is 412.
	ExpectedRevision int64
}

type GetWorkspaceQuery struct {
	ActorID     string
	WorkspaceID string
}

type ListAccessibleMattersQuery struct {
	ActorID     string
	WorkspaceID string
	Limit       int
	Cursor      *matter.MatterCursor
}

// DiscoverMattersQuery finds the caller's accessible Matters by title across their active
// workspaces (BF-08). Query is a case-insensitive title substring; empty lists all.
type DiscoverMattersQuery struct {
	ActorID string
	Query   string
	Limit   int
	After   *matter.DiscoveryCursor
}

type GrantWorkspaceMembershipCmd struct {
	ActorID          string // calling OWNER
	WorkspaceID      string
	UserID           string // target product user
	Role             string
	ExpectedRevision int64 // 0 = caller omitted If-Match: refused (428)
}

type RevokeWorkspaceMembershipCmd struct {
	ActorID          string
	WorkspaceID      string
	UserID           string
	ExpectedRevision int64
}

type GrantMatterMembershipCmd struct {
	ActorID          string
	MatterID         string
	UserID           string
	Role             string
	ExpectedRevision int64
}

type RevokeMatterMembershipCmd struct {
	ActorID          string
	MatterID         string
	UserID           string
	ExpectedRevision int64
}

type HistoryReadQuery struct {
	ActorID  string
	MatterID string
	Limit    int
	Cursor   *matter.EventCursor
}

// ListMyWorkspacesQuery lists the caller's own ACTIVE workspace memberships; no other
// authorization applies because the result is derived from the caller's own rows.
type ListMyWorkspacesQuery struct {
	ActorID string
	Limit   int
	Cursor  *matter.WorkspaceCursor
}

type GetMatterQuery struct {
	ActorID  string
	MatterID string
}

// ListMembersQuery lists the ACTIVE members of the workspace or matter named by ScopeID.
type ListMembersQuery struct {
	ActorID string
	ScopeID string
}

type OwnReceiptQuery struct {
	ActorID        string
	IdempotencyKey string
}

// MatterMemberCandidates lists names of active workspace members for a Matter OWNER.
// It grants no membership; commands still reauthorize and enforce CAS independently.
type MatterMemberCandidates interface {
	ListMatterMemberCandidates(ctx context.Context, q ListMembersQuery) ([]matter.Member, error)
}

// WorkspaceService defines the W1 administration and read use cases.
type WorkspaceService interface {
	CreateWorkspace(ctx context.Context, cmd CreateWorkspaceCmd) (matter.WorkspaceCreatedResult, error)
	GetWorkspace(ctx context.Context, q GetWorkspaceQuery) (matter.Workspace, error)
	ListAccessibleMatters(ctx context.Context, q ListAccessibleMattersQuery) (matter.AccessibleMatterPage, error)
	// DiscoverMatters is the cross-workspace Matter search: only Matters the caller holds an ACTIVE
	// membership in, inside workspaces where they are ACTIVE.
	DiscoverMatters(ctx context.Context, q DiscoverMattersQuery) (matter.MatterDiscoveryPage, error)
	GrantWorkspaceMembership(ctx context.Context, cmd GrantWorkspaceMembershipCmd) (matter.MembershipChangeResult, error)
	RevokeWorkspaceMembership(ctx context.Context, cmd RevokeWorkspaceMembershipCmd) (matter.MembershipChangeResult, error)
	CreateMatter(ctx context.Context, cmd CreateMatterCmd) (matter.WorkspaceCreatedResult, error)
	GrantMatterMembership(ctx context.Context, cmd GrantMatterMembershipCmd) (matter.MembershipChangeResult, error)
	RevokeMatterMembership(ctx context.Context, cmd RevokeMatterMembershipCmd) (matter.MembershipChangeResult, error)
	ListMyWorkspaces(ctx context.Context, q ListMyWorkspacesQuery) (matter.AccessibleWorkspacePage, error)
	GetMatter(ctx context.Context, q GetMatterQuery) (matter.MatterRead, error)
	// ListWorkspaceMembers is Workspace-OWNER only (non-owner members: ErrForbidden,
	// non-members: ErrNotFound).
	ListWorkspaceMembers(ctx context.Context, q ListMembersQuery) ([]matter.Member, error)
	// ListMatterMembers is readable by any ACTIVE matter member.
	ListMatterMembers(ctx context.Context, q ListMembersQuery) ([]matter.Member, error)
	HistoryRead(ctx context.Context, q HistoryReadQuery) (matter.EventPage, error)
	OwnReceipt(ctx context.Context, q OwnReceiptQuery) (matter.Receipt, error)
}

// ---------- Outbound (driven): workspace transaction + read extensions ----------

// WorkspaceStore is implemented by the same storage adapters as MatterStore; it adds
// the workspace-scoped transaction used by administration commands. Error contract:
// identical to MatterStore (commit-phase failure wraps ErrOutcomeUnknown unless the
// DB provably aborted; snapshot failures wrap ErrUnavailable; row methods return
// ErrNotFound for absent rows; receipt primary-key violations wrap
// ErrIdempotencyKeyReuse).
type WorkspaceStore interface {
	MatterStore
	// ExecuteWorkspace runs fn in ONE READ COMMITTED transaction that first locks the
	// workspace row FOR UPDATE and captures the command instant. Lock order: workspace
	// row, workspace memberships, then anything created inside (matters, their
	// memberships, history), receipts, audit last.
	ExecuteWorkspace(ctx context.Context, workspace matter.WorkspaceID, fn func(tx WorkspaceTx) error) error
	// ExecuteCreation runs fn in ONE READ COMMITTED transaction for a command that
	// creates its own workspace row (no row exists to lock; the receipt primary key
	// serializes same-key racing creations). It must never touch an existing
	// workspace's rows.
	ExecuteCreation(ctx context.Context, fn func(tx WorkspaceCreationTx) error) error
}

// WorkspaceCreationTx runs inside an ExecuteCreation transaction.
type WorkspaceCreationTx interface {
	// WCmd returns the captured DB command instant.
	WCmd() time.Time
	// Receipt behaves like MatterTx.Receipt.
	Receipt(ctx context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error)
	// InsertWorkspace inserts the workspace header row (revision 1).
	InsertWorkspace(ctx context.Context, w matter.Workspace) error
	// InsertWorkspaceMembership inserts a membership row.
	InsertWorkspaceMembership(ctx context.Context, m matter.WorkspaceMembership) error
	// StoreReceipt behaves like MatterTx.StoreReceipt.
	StoreReceipt(ctx context.Context, rc matter.Receipt) error
	// RecordSecurityAudit behaves like MatterTx.RecordSecurityAudit.
	RecordSecurityAudit(ctx context.Context, e matter.SecurityAuditEntry) error
}

// WorkspaceTx runs inside an ExecuteWorkspace transaction after the workspace row is
// locked and the command instant captured.
type WorkspaceTx interface {
	// Workspace returns the locked workspace header.
	Workspace() matter.Workspace
	// WCmd returns the captured DB command instant.
	WCmd() time.Time
	// WorkspaceMembershipOf reads one workspace membership (share lock); ErrNotFound
	// when absent.
	WorkspaceMembershipOf(ctx context.Context, user matter.ActorID) (matter.WorkspaceMembership, error)
	// MatterMembership reads one matter membership (share lock); ErrNotFound when
	// absent. Used by receipt-scope authorization inside workspace transactions.
	MatterMembership(ctx context.Context, m matter.MatterID, actor matter.ActorID) (matter.MatterMembership, error)
	// CountActiveWorkspaceOwners returns the number of ACTIVE workspace OWNER rows.
	CountActiveWorkspaceOwners(ctx context.Context) (int, error)
	// InsertWorkspaceMembership inserts a membership row at the given revision.
	InsertWorkspaceMembership(ctx context.Context, m matter.WorkspaceMembership) error
	// UpdateWorkspaceMembershipStatus flips the status only when the locked workspace
	// header revision still equals expectedRevision (the caller has already validated
	// it), returning the new workspace revision. A zero-rows update is
	// ErrVersionConflict. Implementations bump BOTH the membership row revision and
	// the workspace header revision to newRevision.
	UpdateWorkspaceMembershipStatus(ctx context.Context, user matter.ActorID, status matter.MembershipStatus, expectedRowRevision int64) (int64, error)
	// BumpWorkspaceRevision advances the locked workspace header revision.
	BumpWorkspaceRevision(ctx context.Context, newRevision int64) error
	// InsertMatter creates the matter header row (revision 1, empty fences).
	InsertMatter(ctx context.Context, h matter.MatterHeader) error
	// InsertMatterMembership inserts a matter membership row.
	InsertMatterMembership(ctx context.Context, m matter.MatterMembership) error
	// AppendMatterCreatedEvent appends the first matter-scoped history event (seq 1).
	AppendMatterCreatedEvent(ctx context.Context, matterID matter.MatterID, seq int64, id string, actor matter.ActorID, target string, effectiveAt, recordedAt time.Time) error
	// Receipt behaves like MatterTx.Receipt.
	Receipt(ctx context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error)
	// StoreReceipt behaves like MatterTx.StoreReceipt.
	StoreReceipt(ctx context.Context, rc matter.Receipt) error
	// RecordSecurityAudit behaves like MatterTx.RecordSecurityAudit.
	RecordSecurityAudit(ctx context.Context, e matter.SecurityAuditEntry) error
}

// The MatterTx and MatterSnapshot interfaces gain these W1 read/write capabilities.
// They are declared as separate interfaces that the concrete adapters also satisfy,
// so the BE01 contract suite keeps compiling unchanged.
type MatterMembershipAdminTx interface {
	// CountActiveMatterOwners returns the number of ACTIVE matter OWNER rows.
	CountActiveMatterOwners(ctx context.Context) (int, error)
	// InsertMatterMembership inserts a matter membership row.
	InsertMatterMembership(ctx context.Context, m matter.MatterMembership) error
	// UpdateMatterMembershipStatus flips status under revision CAS and returns the
	// new revision; zero updated rows is ErrVersionConflict.
	UpdateMatterMembershipStatus(ctx context.Context, user matter.ActorID, status matter.MembershipStatus, expectedRowRevision int64) (int64, error)
	// AppendMembershipEvent appends a matter-scoped membership history event with the
	// next seq supplied by the service.
	AppendMembershipEvent(ctx context.Context, matterID matter.MatterID, seq int64, id, eventType, targetKind string, targetID string, actor matter.ActorID, targetUser matter.ActorID, reason string, effectiveAt, recordedAt time.Time) error
}

type MatterReadSnapshot interface {
	// EventsPage returns one authorized, recorded_at+seq-ordered history page for the
	// matter. nextCursor is nil after the last page.
	EventsPage(ctx context.Context, m matter.MatterID, cursor *matter.EventCursor, limit int) (matter.EventPage, error)
	// ReceiptFor returns the stored receipt for (actor, key) with every represented
	// matter; ErrNotFound when absent.
	ReceiptFor(ctx context.Context, actor matter.ActorID, key matter.IdempotencyKey) (matter.Receipt, error)
	// AccessibleMatters returns the caller's active matters inside the workspace with
	// their active matter role, ordered by matter id, as one page.
	AccessibleMatters(ctx context.Context, workspace matter.WorkspaceID, actor matter.ActorID, cursor *matter.MatterCursor, limit int) (matter.AccessibleMatterPage, error)
	// MyWorkspaces returns the caller's ACTIVE workspace memberships ordered by workspace id.
	MyWorkspaces(ctx context.Context, actor matter.ActorID, cursor *matter.WorkspaceCursor, limit int) (matter.AccessibleWorkspacePage, error)
	// WorkspaceMembers returns the ACTIVE workspace members ordered by user id.
	WorkspaceMembers(ctx context.Context, workspace matter.WorkspaceID) ([]matter.Member, error)
	// MatterMembers returns the ACTIVE matter members ordered by user id.
	MatterMembers(ctx context.Context, m matter.MatterID) ([]matter.Member, error)
}
