package productapi

import (
	"encoding/json"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
)

// Wire DTOs. Resource bodies carry only revision-determined fields; per-read provenance
// travels in MC-* headers so equal ETags imply equal bytes (contract §4). Nullable
// members are always present (null until set), never invented.

func ts(t time.Time) string { return t.UTC().Format(time.RFC3339Nano) }

func tsPtr(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := ts(*t)
	return &s
}

type workspaceBody struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Revision int64  `json:"revision"`
}

func workspaceDTO(w matter.Workspace) workspaceBody {
	return workspaceBody{ID: w.ID.String(), Name: w.Name, Revision: w.Revision}
}

type workspaceListItem struct {
	ID         string `json:"id"`
	Name       string `json:"name"`
	Revision   int64  `json:"revision"`
	CallerRole string `json:"callerRole"`
}

type matterBody struct {
	ID             string `json:"id"`
	WorkspaceID    string `json:"workspaceId"`
	Title          string `json:"title"`
	Revision       int64  `json:"revision"`
	EventSeq       int64  `json:"eventSeq"`
	CallerRole     string `json:"callerRole"`
	LastRecordedAt string `json:"lastRecordedAt"`
}

func matterDTO(h matter.MatterHeader, role matter.MatterRole) matterBody {
	return matterBody{
		ID: h.MatterID.String(), WorkspaceID: h.WorkspaceID.String(), Title: h.Title,
		Revision: h.Revision, EventSeq: h.EventSeq, CallerRole: string(role), LastRecordedAt: ts(h.LastRecordedAt),
	}
}

type memberBody struct {
	UserID      string `json:"userId"`
	DisplayName string `json:"displayName"`
	Role        string `json:"role"`
	Status      string `json:"status"`
	Revision    int64  `json:"revision"`
}

func memberDTO(m matter.Member) memberBody {
	return memberBody{UserID: m.UserID.String(), DisplayName: m.DisplayName, Role: m.Role, Status: string(m.Status), Revision: m.Revision}
}

type membershipChangeBody struct {
	Scope       string  `json:"scope"`
	WorkspaceID string  `json:"workspaceId"`
	MatterID    *string `json:"matterId"`
	UserID      string  `json:"userId"`
	Role        string  `json:"role"`
	Status      string  `json:"status"`
	Revision    int64   `json:"revision"`
	RecordedAt  string  `json:"recordedAt"`
}

func membershipChangeDTO(r matter.MembershipChangeResult) membershipChangeBody {
	b := membershipChangeBody{
		Scope: string(r.ScopeKind), WorkspaceID: r.WorkspaceID.String(), UserID: r.UserID.String(),
		Role: r.Role, Status: string(r.Status), Revision: r.Revision, RecordedAt: ts(r.RecordedAt),
	}
	if r.MatterID != nil {
		s := r.MatterID.String()
		b.MatterID = &s
	}
	return b
}

type requirementBody struct {
	ImportedVerificationClaim *string `json:"importedVerificationClaim,omitempty"`
	ID                        string  `json:"id"`
	MatterID                  string  `json:"matterId"`
	Title                     string  `json:"title"`
	Outcome                   string  `json:"outcome"`
	ExecutionState            string  `json:"executionState"`
	DependencyState           string  `json:"dependencyState"`
	VerificationState         string  `json:"verificationState"`
	VerificationApplicability string  `json:"verificationApplicability"`
	ApplicabilityReason       *string `json:"applicabilityReason"`
	ProofEpoch                int64   `json:"proofEpoch"`
	WorkstreamID              *string `json:"workstreamId"`
	OwnerID                   *string `json:"ownerId"`
	DueAt                     *string `json:"dueAt"`
	Revision                  int64   `json:"revision"`
}

func requirementDTO(r matter.Requirement) requirementBody {
	b := requirementBody{
		ID: r.ID.String(), MatterID: r.MatterID.String(), Title: r.Title, Outcome: r.Outcome,
		ExecutionState: string(r.ExecutionState), DependencyState: string(r.DependencyState),
		VerificationState: string(r.VerificationState), VerificationApplicability: string(r.VerificationApplicability),
		ImportedVerificationClaim: r.ImportedVerificationClaim, ApplicabilityReason: r.ApplicabilityReason, ProofEpoch: r.ProofEpoch, DueAt: tsPtr(r.DueAt), Revision: r.Revision,
	}
	if r.WorkstreamID != nil {
		s := r.WorkstreamID.String()
		b.WorkstreamID = &s
	}
	if r.OwnerActorID != nil {
		s := r.OwnerActorID.String()
		b.OwnerID = &s
	}
	return b
}

type eventBody struct {
	Seq           int64           `json:"seq"`
	ID            string          `json:"id"`
	Type          string          `json:"type"`
	SchemaVersion int             `json:"schemaVersion"`
	ActorKind     string          `json:"actorKind"`
	ActorID       *string         `json:"actorId"`
	TargetKind    string          `json:"targetKind"`
	TargetID      string          `json:"targetId"`
	EffectiveAt   string          `json:"effectiveAt"`
	RecordedAt    string          `json:"recordedAt"`
	CauseSeq      *int64          `json:"causeSeq"`
	CorrelationID *string         `json:"correlationId"`
	CommandKey    *string         `json:"commandKey"`
	Reason        *string         `json:"reason"`
	Before        json.RawMessage `json:"before"`
	After         json.RawMessage `json:"after"`
}

func eventDTO(e matter.EventRecord) eventBody {
	return eventBody{
		Seq: e.Seq, ID: e.ID, Type: e.Type, SchemaVersion: e.SchemaVersion, ActorKind: e.ActorKind,
		ActorID: e.ActorID, TargetKind: e.TargetKind, TargetID: e.TargetID,
		EffectiveAt: ts(e.EffectiveAt), RecordedAt: ts(e.RecordedAt),
		CauseSeq: e.CauseSeq, CorrelationID: e.CorrelationID, CommandKey: e.CommandKey, Reason: e.Reason,
		Before: rawOrNull(e.Before), After: rawOrNull(e.After),
	}
}

func rawOrNull(b []byte) json.RawMessage {
	if len(b) == 0 {
		return json.RawMessage("null")
	}
	return json.RawMessage(b)
}

// page is the paging envelope. MaxLimit is declared so no cap is hidden.
type page[T any] struct {
	Items []T      `json:"items"`
	Page  pageMeta `json:"page"`
}

type pageMeta struct {
	Limit      int     `json:"limit"`
	MaxLimit   int     `json:"maxLimit"`
	Total      *int    `json:"total"`
	NextCursor *string `json:"nextCursor"`
}

type receiptBody struct {
	IdempotencyKey string           `json:"idempotencyKey"`
	Kind           string           `json:"kind"`
	StatusCode     int              `json:"statusCode"`
	CommittedAt    string           `json:"committedAt"`
	Workspace      *workspaceBody   `json:"workspace"`
	Matter         *matterBody      `json:"matter"`
	Requirement    *requirementBody `json:"requirement"`
	// BulkRow and ImportRow carry what a per-row W6 receipt committed, so a lost answer can be
	// settled from the receipt alone (no content hash, no payload).
	BulkRow   *rowReceiptBody `json:"bulkRow,omitempty"`
	ImportRow *rowReceiptBody `json:"importRow,omitempty"`
}

type rowReceiptBody struct {
	ItemID   string `json:"itemId"`
	Kind     string `json:"kind"`
	Revision int64  `json:"revision"`
	RowKey   string `json:"rowKey,omitempty"`
}

func receiptDTO(rc matter.Receipt) receiptBody {
	b := receiptBody{IdempotencyKey: rc.IdempotencyKey.String(), Kind: string(rc.Kind), StatusCode: rc.StatusCode, CommittedAt: ts(rc.CommittedAt)}
	if s := rc.WorkspaceSnapshot; s != nil {
		w := workspaceDTO(s.Workspace)
		b.Workspace = &w
		if s.Matter != nil {
			m := matterDTO(*s.Matter, s.CallerRole)
			b.Matter = &m
		}
	}
	if s := rc.Snapshot; s != nil {
		r := requirementDTO(s.Requirement)
		b.Requirement = &r
	}
	if s := rc.BulkSnapshot; s != nil {
		b.BulkRow = &rowReceiptBody{ItemID: s.ItemID, Kind: s.Kind, Revision: s.Revision}
	}
	if s := rc.ImportSnapshot; s != nil {
		b.ImportRow = &rowReceiptBody{ItemID: s.ItemID, Kind: s.Kind, Revision: s.Revision, RowKey: s.RowKey}
	}
	return b
}
