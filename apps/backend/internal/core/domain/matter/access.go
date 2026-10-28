package matter

import (
	"crypto/sha256"
	"errors"
	"time"
)

// WorkspaceRole is a workspace-level role. A workspace role alone grants no matter
// access; every matter operation requires an active matter membership.
type WorkspaceRole string

const (
	WorkspaceRoleOwner  WorkspaceRole = "OWNER"
	WorkspaceRoleMember WorkspaceRole = "MEMBER"
)

func (r WorkspaceRole) Valid() bool { return r == WorkspaceRoleOwner || r == WorkspaceRoleMember }

// MatterRole is a matter-level role carrying the operation matrix.
type MatterRole string

const (
	MatterRoleOwner  MatterRole = "OWNER"
	MatterRoleEditor MatterRole = "EDITOR"
	MatterRoleViewer MatterRole = "VIEWER"
)

func (r MatterRole) Valid() bool {
	switch r {
	case MatterRoleOwner, MatterRoleEditor, MatterRoleViewer:
		return true
	}
	return false
}

// MembershipStatus is the lifecycle status of a membership row.
type MembershipStatus string

const (
	StatusActive  MembershipStatus = "ACTIVE"
	StatusRevoked MembershipStatus = "REVOKED"
)

func (s MembershipStatus) Valid() bool { return s == StatusActive || s == StatusRevoked }

// WorkspaceMembership is a workspace access fact.
type WorkspaceMembership struct {
	WorkspaceID WorkspaceID
	ActorID     ActorID
	Role        WorkspaceRole
	Status      MembershipStatus
	Revision    int64
}

// MatterMembership is a matter access fact.
type MatterMembership struct {
	MatterID MatterID
	ActorID  ActorID
	Role     MatterRole
	Status   MembershipStatus
	Revision int64
}

// MatterHeader carries the locked matter state a command runs against.
type MatterHeader struct {
	MatterID               MatterID
	WorkspaceID            WorkspaceID
	Title                  string
	EventSeq               int64
	Revision               int64
	LastRecordedAt         time.Time
	BoundariesAppliedUntil time.Time
	NextBoundaryAt         *time.Time
}

// BoundaryDueAt reports whether the header carries a pending temporal boundary at or
// before now: evaluating it is required before any new domain mutation or fence
// advancement. The comparison is fail-closed — a boundary exactly at the command
// instant counts as due.
func (h MatterHeader) BoundaryDueAt(now time.Time) bool {
	return h.NextBoundaryAt != nil && !h.NextBoundaryAt.After(now)
}

// ScopeKind is the idempotency scope of a command receipt.
type ScopeKind string

const (
	ScopeMatter    ScopeKind = "MATTER"
	ScopeWorkspace ScopeKind = "WORKSPACE"
)

// Receipt is a stored command outcome: the primary key is (ActorID, IdempotencyKey),
// so one actor intent commits at most one outcome. Snapshot is the immutable stored
// result; it is decoded by the storage adapter and replayed verbatim.
type Receipt struct {
	ActorID        ActorID
	IdempotencyKey IdempotencyKey
	RequestHash    RequestHash
	ScopeKind      ScopeKind
	WorkspaceID    WorkspaceID
	MatterID       *MatterID
	StatusCode     int
	CommittedAt    time.Time
	// PurgeAfter is the retention deadline. It stays nil in this slice: no retention
	// policy value is approved (TB-06 open), so no default is invented.
	PurgeAfter *time.Time
	// Matters lists every matter represented in the stored snapshot; replay requires
	// current read access to each of them.
	Matters []MatterID
	// Snapshot keeps the BE01 requirement-create snapshot (Kind
	// REQUIREMENT_CREATED). WorkspaceSnapshot / MembershipSnapshot / ItemSnapshot /
	// CreatedSnapshot / BulkSnapshot / ImportSnapshot hold the W1/W2/W3/W6
	// snapshots. Exactly one snapshot is set per receipt, matching Kind.
	Snapshot           *RequirementCreatedResult
	Kind               SnapshotKind
	WorkspaceSnapshot  *WorkspaceCreatedResult
	MembershipSnapshot *MembershipChangeResult
	ItemSnapshot       *WorkItemCreatedResult
	CreatedSnapshot    *CreatedResult
	BulkSnapshot       *BulkRowApplied
	ImportSnapshot     *ImportRowApplied
}

// Node is a work-graph node row.
type Node struct {
	ID       NodeID
	MatterID MatterID
	Kind     NodeKind
}

// SecurityAuditEntry is a restricted security-audit record. It never contains titles,
// content or response bodies, only a hash of the requested identifier.
type SecurityAuditEntry struct {
	EventID               string
	OccurredAt            time.Time
	Actor                 ActorID
	Operation             string
	Outcome               string
	RequestedResourceKind string
	RequestedIDHash       []byte
}

// HashID returns the SHA-256 digest of an identifier string for restricted audit rows.
func HashID(id string) []byte {
	h := sha256.Sum256([]byte(id))
	return h[:]
}

// ErrKeyExpired reports a key-age failure (older than the retention window or further
// in the future than the allowed skew). It is a domain rule with injected policy values.
var ErrKeyExpired = errors.New("idempotency key expired")

// ErrBoundaryDue reports that a pending temporal boundary is due at the command instant
// and this slice does not implement boundary processing. The command must fail closed:
// no domain mutation, no fence advancement, no receipt; the pending boundary, the matter
// header, history and any stored receipt stay untouched.
var ErrBoundaryDue = errors.New("pending temporal boundary is due; its processing is unsupported in this slice")

// KeyAgePolicy bounds the age of an idempotency key, checked at the captured command
// instant. The zero value enforces nothing: production retention values are not yet
// decided (TB-06), so tests and boundaries inject explicit values instead of relying
// on invented defaults.
type KeyAgePolicy struct {
	Retention          time.Duration
	MaxCommandDuration time.Duration
	AllowedSkew        time.Duration
}

// Check validates the key against now. A key is rejected when it is older than
// Retention - MaxCommandDuration - AllowedSkew, or more than AllowedSkew in the future.
func (p KeyAgePolicy) Check(key IdempotencyKey, now time.Time) error {
	if p.Retention == 0 && p.MaxCommandDuration == 0 && p.AllowedSkew == 0 {
		return nil
	}
	keyTime := key.V7Time()
	if now.Sub(keyTime) > p.Retention-p.MaxCommandDuration-p.AllowedSkew {
		return ErrKeyExpired
	}
	if keyTime.Sub(now) > p.AllowedSkew {
		return ErrKeyExpired
	}
	return nil
}
