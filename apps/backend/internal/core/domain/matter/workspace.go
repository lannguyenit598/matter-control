package matter

import (
	"errors"
	"time"

	"github.com/example/userapi/internal/core/domain"
)

// Workspace is the locked workspace state a workspace-scoped command runs against.
type Workspace struct {
	ID       WorkspaceID
	Name     string
	Revision int64
}

// WorkspaceCreatedResult is the immutable outcome snapshot stored with a
// create-workspace or create-matter receipt and returned verbatim on replay.
type WorkspaceCreatedResult struct {
	// Workspace is the created workspace header (create-workspace commands), or the
	// workspace the new matter belongs to (create-matter commands).
	Workspace Workspace
	// Matter is set only for create-matter outcomes.
	Matter     *MatterHeader
	CallerRole MatterRole
	// Seq is the first history sequence allocated inside the new matter (create-matter
	// outcomes); zero for workspace creations, which carry no matter-scoped history.
	Seq        int64
	RecordedAt time.Time
	// Replayed stays false in stored snapshots; the service marks replayed copies so
	// boundaries can distinguish them.
	Replayed bool
}

// MembershipChangeResult is the immutable outcome snapshot of a membership grant or
// revocation receipt.
type MembershipChangeResult struct {
	ScopeKind   ScopeKind
	WorkspaceID WorkspaceID
	MatterID    *MatterID
	UserID      ActorID
	Role        string // MatterRole or WorkspaceRole spelled-out value
	Status      MembershipStatus
	Revision    int64
	RecordedAt  time.Time
	Replayed    bool
}

// ErrSnapshotKind reports a receipt whose stored snapshot kind does not match the
// operation replaying it.
var ErrSnapshotKind = errors.New("stored receipt snapshot kind does not match this operation")

// InvalidRoleError reports a role string outside the approved enum for its scope.
type InvalidRoleError struct{ Value string }

func (e InvalidRoleError) Error() string {
	return "invalid role: " + e.Value
}

// SnapshotKind discriminates the payload stored in Receipt.SnapshotJSON.
type SnapshotKind string

const (
	SnapshotRequirementCreate SnapshotKind = "REQUIREMENT_CREATED"
	SnapshotWorkspaceCreate   SnapshotKind = "WORKSPACE_CREATED"
	SnapshotMembershipChange  SnapshotKind = "MEMBERSHIP_CHANGED"
	SnapshotActionCreate      SnapshotKind = "ACTION_CREATED"
	// SnapshotCreated stores only what a creation produced (record kind, id, history seq): a
	// replay returns the same id and the caller re-reads the record with its own rights.
	SnapshotCreated SnapshotKind = "RECORD_CREATED"
)

// EventRecord is one append-only history row as returned by reads. Before/After stay
// raw JSON: only the owning command knows their schema.
type EventRecord struct {
	MatterID      MatterID
	Seq           int64
	ID            string
	Type          string
	SchemaVersion int
	ActorKind     string
	ActorID       *string
	TargetKind    string
	TargetID      string
	EffectiveAt   time.Time
	RecordedAt    time.Time
	CauseSeq      *int64
	CorrelationID *string
	CommandKey    *string
	Reason        *string
	Before        []byte
	After         []byte
}

// EventPage is one authorized history page. NextCursor is nil on the last page.
type EventPage struct {
	Events     []EventRecord
	NextCursor *EventCursor
	AsOf       time.Time
}

// EventCursor is the opaque-to-clients ordering key of the history page.
type EventCursor struct {
	RecordedAt time.Time
	Seq        int64
}

// AccessibleMatter is one row of the caller's authorized matter list: the matter as
// observed in the read snapshot plus the caller's own active matter role.
type AccessibleMatter struct {
	Header     MatterHeader
	CallerRole MatterRole
}

// AccessibleMatterPage is one page of the accessible-matter list. NextCursor is nil
// on the last page.
type AccessibleMatterPage struct {
	Matters    []AccessibleMatter
	Total      int
	NextCursor *MatterCursor
	AsOf       time.Time
}

// MatterCursor is the ordering key of the accessible-matter page.
type MatterCursor struct {
	MatterID MatterID
}

// NewDisplayName trims and validates a workspace name or matter title. Like
// requirement text it has no length cap: no business limit is approved for W1.
func NewDisplayName(raw, field string) (string, error) {
	v := &domain.ValidationError{}
	s := normalizeText(raw, field, v)
	if v.HasErrors() {
		return "", v
	}
	return s, nil
}

// MatterRead is one authorized matter read: the header observed in the read snapshot
// plus the caller's own active matter role.
type MatterRead struct {
	Header     MatterHeader
	CallerRole MatterRole
	AsOf       time.Time
}

// Member is one ACTIVE membership row of a workspace or matter. Role is the spelled-out
// WorkspaceRole or MatterRole value.
type Member struct {
	UserID      ActorID
	DisplayName string
	Role        string
	Status      MembershipStatus
	Revision    int64
}

// AccessibleWorkspace is one row of the caller's own workspace list.
type AccessibleWorkspace struct {
	Workspace  Workspace
	CallerRole WorkspaceRole
}

// AccessibleWorkspacePage is one page of the caller's ACTIVE workspace memberships.
// NextCursor is nil on the last page.
type AccessibleWorkspacePage struct {
	Workspaces []AccessibleWorkspace
	Total      int
	NextCursor *WorkspaceCursor
	AsOf       time.Time
}

// WorkspaceCursor is the ordering key of the workspace list.
type WorkspaceCursor struct {
	WorkspaceID WorkspaceID
}
