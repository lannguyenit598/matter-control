package port

import (
	"context"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Playbooks (RLF-05) ----------

// ListPlaybooksQuery lists the caller's authorized playbooks of one workspace.
type ListPlaybooksQuery struct {
	ActorID     string
	WorkspaceID string
}

// CreatePlaybookCmd creates the container. Workspace OWNER only, receipted (§2.1).
type CreatePlaybookCmd struct {
	ActorID          string
	WorkspaceID      string
	IdempotencyKey   string
	RequestHash      string
	ExpectedRevision int64 // workspace revision CAS
	Name             string
}

// PublishPlaybookRevisionCmd appends ONE immutable revision. Workspace OWNER only, receipted.
type PublishPlaybookRevisionCmd struct {
	ActorID          string
	WorkspaceID      string
	PlaybookID       string
	IdempotencyKey   string
	RequestHash      string
	ExpectedRevision int64 // workspace revision CAS
	Entries          []matter.PlaybookEntry
}

// GetPlaybookQuery reads one playbook with its revisions (authorized workspace members).
type GetPlaybookQuery struct {
	ActorID    string
	PlaybookID string
}

// PlaybookApplicationView is what a Matter OWNER previews before applying: the exact names,
// kinds, owner mappings and dependency graph of one revision, with the problems apply would
// refuse. The preview stores nothing.
type PlaybookApplicationView struct {
	Playbook   matter.Playbook
	Revision   matter.PlaybookRevision
	OwnerNames map[string]string // entry key -> resolved member display name ("" = unresolved)
	Problems   []string          // validation problems apply would refuse
}

// PreviewPlaybookApplicationQuery builds the view for one exact revision.
type PreviewPlaybookApplicationQuery struct {
	ActorID    string
	MatterID   string
	RevisionID string
}

// ApplyPlaybookCmd instantiates one exact revision inside one Matter. Matter OWNER only,
// receipted and atomic: either every entry becomes work (with its provenance instance row) or
// nothing does. Retrying with the SAME key replays the stored outcome; applying the same
// revision again under a different key is refused (`playbook-already-applied`).
type ApplyPlaybookCmd struct {
	ActorID        string
	MatterID       string
	RevisionID     string
	IdempotencyKey string
	RequestHash    string
	// OwnerMap resolves each entry that declares an ownerKey to an explicit person; every
	// mapping is revalidated against ACTIVE matter membership at commit.
	OwnerMap map[string]string
}

// AppliedPlaybook is the readback of one application.
type AppliedPlaybook struct {
	Items      []matter.WorkItemView
	Instances  []matter.PlaybookInstance
	PlaybookID matter.PlaybookID
	RevisionID matter.PlaybookRevisionID
	RevisionNo int64
	// Replayed marks a stored outcome returned under the SAME key (§2.1).
	Replayed bool
}

// PlaybookSnapshot reads playbooks inside one store snapshot.
type PlaybookSnapshot interface {
	ListPlaybooks(ctx context.Context, w matter.WorkspaceID) ([]matter.Playbook, error)
	LoadPlaybook(ctx context.Context, id matter.PlaybookID) (matter.Playbook, error)
	ListPlaybookRevisions(ctx context.Context, ids []matter.PlaybookID) ([]matter.PlaybookRevision, error)
	LoadPlaybookRevision(ctx context.Context, id matter.PlaybookRevisionID) (matter.PlaybookRevision, error)
	ListPlaybookInstancesOfMatter(ctx context.Context, m matter.MatterID) ([]matter.PlaybookInstance, error)
	ListPlaybookInstancesOfItems(ctx context.Context, ids []matter.NodeID) ([]matter.PlaybookInstance, error)
}

// WorkspacePlaybookTx writes playbook containers and revisions inside the locked workspace
// transaction.
type WorkspacePlaybookTx interface {
	ListPlaybooks(ctx context.Context, w matter.WorkspaceID) ([]matter.Playbook, error)
	InsertPlaybook(ctx context.Context, p matter.Playbook) error
	InsertPlaybookRevision(ctx context.Context, r matter.PlaybookRevision, entries []byte) error
	MaxPlaybookRevisionNo(ctx context.Context, id matter.PlaybookID) (int64, error)
	LoadPlaybook(ctx context.Context, id matter.PlaybookID) (matter.Playbook, error)
}

// MatterPlaybookTx reads templates and records provenance inside the locked matter transaction.
type MatterPlaybookTx interface {
	LoadPlaybookRevision(ctx context.Context, id matter.PlaybookRevisionID) (matter.PlaybookRevision, error)
	LoadPlaybook(ctx context.Context, id matter.PlaybookID) (matter.Playbook, error)
	ListPlaybookInstancesOfMatter(ctx context.Context, m matter.MatterID) ([]matter.PlaybookInstance, error)
	InsertPlaybookInstance(ctx context.Context, i matter.PlaybookInstance) error
}

// ListPlaybookInstancesQuery reads the provenance of one matter's applications.
type ListPlaybookInstancesQuery struct {
	ActorID  string
	MatterID string
}

// PlaybookService defines the playbook use cases.
type PlaybookService interface {
	ListPlaybooks(ctx context.Context, q ListPlaybooksQuery) ([]matter.Playbook, error)
	CreatePlaybook(ctx context.Context, cmd CreatePlaybookCmd) (matter.CreatedResult, error)
	PublishPlaybookRevision(ctx context.Context, cmd PublishPlaybookRevisionCmd) (matter.CreatedResult, error)
	GetPlaybook(ctx context.Context, q GetPlaybookQuery) (matter.Playbook, []matter.PlaybookRevision, error)
	PreviewPlaybookApplication(ctx context.Context, q PreviewPlaybookApplicationQuery) (matter.PlaybookApplicationView, error)
	ApplyPlaybook(ctx context.Context, cmd ApplyPlaybookCmd) (AppliedPlaybook, error)
	ListMatterPlaybookInstances(ctx context.Context, q ListPlaybookInstancesQuery) ([]matter.PlaybookInstance, error)
}
