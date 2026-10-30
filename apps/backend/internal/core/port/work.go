package port

import (
	"context"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Inbound (driving): W2 work graph ----------
//
// Commands carry primitives. Receipt participation follows contract §2.1: CreateAction is a
// receipted creation (idempotency key + immutable outcome snapshot); every other command here
// is a revision-CAS audited command WITHOUT a receipt. Its lost-response rule is the
// authorized re-read, never a blind resend.

// OptString is an optional field in a patch: Set=false leaves the field alone; Set=true with
// an empty Value clears a nullable field.
type OptString struct {
	Set   bool
	Value string
}

type CreateActionCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	Title          string
	Outcome        string
}

// UpdateWorkItemCmd changes metadata only. Execution/dependency/verification/timing/attention
// are never accepted here: a client-supplied derived value has no field to land in.
type UpdateWorkItemCmd struct {
	ActorID          string
	MatterID         string
	ItemID           string
	ExpectedRevision int64
	Title            *string
	Outcome          *string
	Owner            OptString // user id; "" clears
	Due              OptString // RFC 3339 WITH an explicit offset; "" clears
	Workstream       OptString // workstream id; "" clears
}

type TransitionExecutionCmd struct {
	ActorID          string
	MatterID         string
	ItemID           string
	ExpectedRevision int64
	To               string
	Reason           string
	WaitingPartyID   string
	WaitingCondition string
	CompletedAt      string // RFC 3339 with offset; optional
}

// EscalateCmd sets (non-empty Reason) or clears (empty) an explicit CRITICAL escalation. OWNER only.
type EscalateCmd struct {
	ActorID          string
	MatterID         string
	ItemID           string
	ExpectedRevision int64
	Reason           string
}

type AddDependencyCmd struct {
	ActorID                string
	MatterID               string
	SourceID               string
	TargetID               string
	Gate                   string
	Reason                 string // required: the audited reason for adding the prerequisite
	ExpectedTargetRevision int64
}

type RemoveDependencyCmd struct {
	ActorID                string
	MatterID               string
	EdgeID                 string
	Reason                 string // the audited scope-change reason (required)
	ExpectedTargetRevision int64
}

type CreateWorkstreamCmd struct {
	ActorID  string
	MatterID string
	Name     string
}

type CreatePartyCmd struct {
	ActorID  string
	MatterID string
	Name     string
	Kind     string
	Contact  string
	Notes    string
}

type UpdatePartyCmd struct {
	ActorID          string
	MatterID         string
	PartyID          string
	ExpectedRevision int64
	Name             *string
	Kind             *string
	Contact          *string
	Notes            *string
}

type CreateMilestoneCmd struct {
	ActorID  string
	MatterID string
	Name     string
	Due      string // RFC 3339 with offset; optional
	Critical bool
}

// SetMilestonePrerequisitesCmd replaces the designated required Requirements and the
// critical designation. OWNER only, with a reason (RULE-008).
type SetMilestonePrerequisitesCmd struct {
	ActorID          string
	MatterID         string
	MilestoneID      string
	ExpectedRevision int64
	Prerequisites    []string
	Critical         bool
	Reason           string
}

// WorkFilter narrows the operational grid. Every field is optional and ANDed.
type WorkFilter struct {
	Kind       string   // REQUIREMENT | ACTION
	Execution  []string // any of
	Dependency string
	Timing     string
	Attention  string
	Owner      string // user id, or "none" for unassigned
	Workstream string
	Text       string // case-insensitive substring of title/outcome
}

type ListWorkItemsQuery struct {
	ActorID  string
	MatterID string
	Filter   WorkFilter
	Sort     string // title | due | execution | attention | updated (default due)
	Desc     bool
	Limit    int
	Offset   int
}

type GetWorkItemQuery struct {
	ActorID  string
	MatterID string
	ItemID   string
}

type MatterListQuery struct {
	ActorID  string
	MatterID string
}

type MyActionsQuery struct{ ActorID string }

// WorkService defines the W2 use cases.
type WorkService interface {
	CreateAction(ctx context.Context, cmd CreateActionCmd) (matter.WorkItemCreatedResult, error)
	UpdateWorkItem(ctx context.Context, cmd UpdateWorkItemCmd) (matter.WorkItemView, error)
	TransitionExecution(ctx context.Context, cmd TransitionExecutionCmd) (matter.WorkItemView, error)
	Escalate(ctx context.Context, cmd EscalateCmd) (matter.WorkItemView, error)
	AddDependency(ctx context.Context, cmd AddDependencyCmd) (matter.WorkItemDetail, error)
	RemoveDependency(ctx context.Context, cmd RemoveDependencyCmd) (matter.WorkItemDetail, error)
	CreateWorkstream(ctx context.Context, cmd CreateWorkstreamCmd) (matter.Workstream, error)
	CreateParty(ctx context.Context, cmd CreatePartyCmd) (matter.Party, error)
	UpdateParty(ctx context.Context, cmd UpdatePartyCmd) (matter.Party, error)
	CreateMilestone(ctx context.Context, cmd CreateMilestoneCmd) (matter.MilestoneView, error)
	SetMilestonePrerequisites(ctx context.Context, cmd SetMilestonePrerequisitesCmd) (matter.MilestoneView, error)

	ListWorkItems(ctx context.Context, q ListWorkItemsQuery) (matter.WorkItemPage, error)
	GetWorkItem(ctx context.Context, q GetWorkItemQuery) (matter.WorkItemDetail, error)
	ListWorkstreams(ctx context.Context, q MatterListQuery) ([]matter.Workstream, error)
	ListParties(ctx context.Context, q MatterListQuery) ([]matter.Party, error)
	ListMilestones(ctx context.Context, q MatterListQuery) ([]matter.MilestoneView, error)
	// WaitingOn lists the matter's WAITING items with their external party and owner.
	WaitingOn(ctx context.Context, q MatterListQuery) ([]matter.WorkItemView, error)
	// MyActions lists the caller's assigned items across the matters they can access.
	MyActions(ctx context.Context, q MyActionsQuery) (matter.MyActions, error)
}

// ---------- Outbound (driven): work-graph transaction + snapshot ----------

// WorkGraphTx is implemented by the MatterTx of storage adapters (like MatterMembershipAdminTx).
// Writes run inside the locked matter transaction; SaveWorkItem is compare-and-set on the
// item revision. Derived dependency changes are written through SaveWorkItem too, so a
// derived change bumps the item revision and stale commands against it are refused.
type WorkGraphTx interface {
	LoadGraph(ctx context.Context) (matter.WorkGraph, error)
	InsertAction(ctx context.Context, item matter.WorkItem) error
	// SaveWorkItem writes every mutable column and sets revision = expectedRevision+1.
	// Zero updated rows is ErrVersionConflict.
	SaveWorkItem(ctx context.Context, item matter.WorkItem, expectedRevision int64) error
	InsertEdge(ctx context.Context, e matter.Edge) error
	DeleteEdge(ctx context.Context, id string) error
	InsertWorkstream(ctx context.Context, w matter.Workstream) error
	InsertParty(ctx context.Context, p matter.Party) error
	SaveParty(ctx context.Context, p matter.Party, expectedRevision int64) error
	InsertMilestone(ctx context.Context, m matter.Milestone) error
	// SaveMilestone replaces the milestone row and its prerequisite set under revision CAS.
	SaveMilestone(ctx context.Context, m matter.Milestone, expectedRevision int64) error
	AppendWorkEvent(ctx context.Context, e matter.WorkEvent) error
}

// WorkGraphSnapshot is implemented by the MatterSnapshot of storage adapters.
type WorkGraphSnapshot interface {
	LoadGraph(ctx context.Context, m matter.MatterID) (matter.WorkGraph, error)
	// MattersOf returns the matters where the actor holds an ACTIVE matter membership AND an
	// ACTIVE membership in its workspace, ordered by id.
	MattersOf(ctx context.Context, actor matter.ActorID) ([]matter.MatterID, error)
}
