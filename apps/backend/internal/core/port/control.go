package port

import (
	"context"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// ---------- Inbound: W5 Control Room and context records ----------
//
// CreateContextRecord is a receipted creation; UpdateContextRecord is revision-guarded and, after an
// unknown outcome, is re-read and never resent. The Control Room is a read: it never mutates.

type CreateContextRecordCmd struct {
	ActorID        string
	MatterID       string
	IdempotencyKey string
	RequestHash    string
	Kind           string
	Title          string
	Body           string
	Links          []string
}

type UpdateContextRecordCmd struct {
	ActorID          string
	MatterID         string
	RecordID         string
	ExpectedRevision int64
	Title            *string
	Body             *string
	// Links replaces the linked records when non-nil.
	Links *[]string
	// Close closes the record (Reason required); Reopen reopens a closed one.
	Close  bool
	Reopen bool
	Reason string
}

type ControlRoomQuery struct {
	ActorID  string
	MatterID string
	// RecentChanges bounds the changes section (default 20, at most 100).
	RecentChanges int
}

// ControlService defines the W5 use cases.
type ControlService interface {
	CreateContextRecord(ctx context.Context, cmd CreateContextRecordCmd) (matter.CreatedResult, error)
	UpdateContextRecord(ctx context.Context, cmd UpdateContextRecordCmd) (matter.ContextRecord, error)
	ListContextRecords(ctx context.Context, q MatterListQuery) ([]matter.ContextRecord, error)
	ControlRoom(ctx context.Context, q ControlRoomQuery) (matter.ControlRoom, error)
}

// ContextTx is implemented by the MatterTx of storage adapters. Records are updated only by revision CAS.
type ContextTx interface {
	InsertContextRecord(ctx context.Context, r matter.ContextRecord) error
	// SaveContextRecord replaces the mutable columns and the link set; zero updated rows is ErrVersionConflict.
	SaveContextRecord(ctx context.Context, r matter.ContextRecord, expectedRevision int64) error
}

// RecentEventsSnapshot is implemented by the MatterSnapshot of storage adapters: the newest history
// records of a matter, newest first, from the same snapshot as every other read.
type RecentEventsSnapshot interface {
	RecentEvents(ctx context.Context, m matter.MatterID, limit int) ([]matter.EventRecord, error)
}
