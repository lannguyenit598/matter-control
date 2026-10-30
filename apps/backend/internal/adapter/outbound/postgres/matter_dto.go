package postgres

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/mcsqlc"
	"leonx.me/matter-control/internal/core/domain/matter"
)

// Receipt and event payloads are adapter-owned DTOs: the domain has no JSON tags, so
// serialization lives at the persistence boundary, following the repository convention.

type requirementDTO struct {
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
	OwnerActorID              *string `json:"ownerActorId"`
	DueAt                     *string `json:"dueAt"`
	Revision                  int64   `json:"revision"`
}

type createdResultDTO struct {
	Requirement    requirementDTO `json:"requirement"`
	Seq            int64          `json:"seq"`
	RecordedAt     string         `json:"recordedAt"`
	IdempotencyKey string         `json:"idempotencyKey"`
	RequestHash    string         `json:"requestHash"`
}

func requirementToDTO(r matter.Requirement) requirementDTO {
	dto := requirementDTO{
		ID:                        r.ID.String(),
		MatterID:                  r.MatterID.String(),
		Title:                     r.Title,
		Outcome:                   r.Outcome,
		ExecutionState:            string(r.ExecutionState),
		DependencyState:           string(r.DependencyState),
		VerificationState:         string(r.VerificationState),
		VerificationApplicability: string(r.VerificationApplicability),
		ApplicabilityReason:       r.ApplicabilityReason,
		ProofEpoch:                r.ProofEpoch,
		Revision:                  r.Revision,
	}
	if r.WorkstreamID != nil {
		s := r.WorkstreamID.String()
		dto.WorkstreamID = &s
	}
	if r.OwnerActorID != nil {
		s := r.OwnerActorID.String()
		dto.OwnerActorID = &s
	}
	// Create fixes DueAt to nil; no temporal serialization exists in this slice.
	return dto
}

func (d requirementDTO) toDomain() matter.Requirement {
	r := matter.Requirement{
		ID:                        matter.RequirementID(d.ID),
		MatterID:                  matter.MatterID(d.MatterID),
		Title:                     d.Title,
		Outcome:                   d.Outcome,
		ExecutionState:            matter.ExecutionState(d.ExecutionState),
		DependencyState:           matter.DependencyState(d.DependencyState),
		VerificationState:         matter.VerificationState(d.VerificationState),
		VerificationApplicability: matter.VerificationApplicability(d.VerificationApplicability),
		ApplicabilityReason:       d.ApplicabilityReason,
		ProofEpoch:                d.ProofEpoch,
		Revision:                  d.Revision,
	}
	if d.WorkstreamID != nil {
		id := matter.WorkstreamID(*d.WorkstreamID)
		r.WorkstreamID = &id
	}
	if d.OwnerActorID != nil {
		id := matter.ActorID(*d.OwnerActorID)
		r.OwnerActorID = &id
	}
	return r
}

func encodeRequirementJSON(r matter.Requirement) ([]byte, error) {
	b, err := json.Marshal(requirementToDTO(r))
	if err != nil {
		return nil, fmt.Errorf("marshal requirement: %w", err)
	}
	return b, nil
}

func encodeCreatedResultJSON(res *matter.RequirementCreatedResult) ([]byte, error) {
	if res == nil {
		return nil, fmt.Errorf("nil receipt snapshot")
	}
	dto := createdResultDTO{
		Requirement:    requirementToDTO(res.Requirement),
		Seq:            res.Seq,
		RecordedAt:     res.RecordedAt.UTC().Format(time.RFC3339Nano),
		IdempotencyKey: res.IdempotencyKey.String(),
		RequestHash:    res.RequestHash.String(),
	}
	b, err := json.Marshal(dto)
	if err != nil {
		return nil, fmt.Errorf("marshal receipt snapshot: %w", err)
	}
	return b, nil
}

func decodeCreatedResult(b []byte) (*matter.RequirementCreatedResult, error) {
	var dto createdResultDTO
	if err := json.Unmarshal(b, &dto); err != nil {
		return nil, fmt.Errorf("unmarshal receipt snapshot: %w", err)
	}
	recordedAt, err := time.Parse(time.RFC3339Nano, dto.RecordedAt)
	if err != nil {
		return nil, fmt.Errorf("receipt snapshot recordedAt: %w", err)
	}
	// Replayed stays false in stored snapshots; the service marks replayed copies.
	return &matter.RequirementCreatedResult{
		Requirement:    dto.Requirement.toDomain(),
		Seq:            dto.Seq,
		RecordedAt:     recordedAt.UTC(),
		IdempotencyKey: matter.IdempotencyKey(dto.IdempotencyKey),
		RequestHash:    matter.RequestHash(dto.RequestHash),
	}, nil
}

func requirementFromRow(row mcsqlc.GetRequirementByIDRow) (matter.Requirement, error) {
	r := matter.Requirement{
		ImportedVerificationClaim: textPtr(row.ImportedVerificationClaim),
		ID:                        matter.RequirementID(row.ID),
		MatterID:                  matter.MatterID(row.MatterID),
		Title:                     row.Title,
		Outcome:                   row.Outcome,
		ExecutionState:            matter.ExecutionState(row.ExecutionState),
		DependencyState:           matter.DependencyState(row.DependencyState),
		VerificationState:         matter.VerificationState(row.VerificationState),
		VerificationApplicability: matter.VerificationApplicability(row.VerificationApplicability),
		ProofEpoch:                int64(row.ProofEpoch),
		Revision:                  row.Revision,
	}
	if row.ApplicabilityReason.Valid {
		s := row.ApplicabilityReason.String
		r.ApplicabilityReason = &s
	}
	if row.WorkstreamID.Valid {
		id := matter.WorkstreamID(uuid.UUID(row.WorkstreamID.Bytes).String())
		r.WorkstreamID = &id
	}
	if row.OwnerUserID.Valid {
		id := matter.ActorID(uuid.UUID(row.OwnerUserID.Bytes).String())
		r.OwnerActorID = &id
	}
	if row.DueAt.Valid {
		t := row.DueAt.Time.UTC()
		r.DueAt = &t
	}
	return r, nil
}

// hexHash decodes the 64-character hex fingerprint into bytes for BYTEA storage.
func hexHash(h matter.RequestHash) ([]byte, error) {
	b, err := hex.DecodeString(h.String())
	if err != nil {
		return nil, fmt.Errorf("matter store: decode request hash: %w", err)
	}
	return b, nil
}

func uuidPtr(u pgtype.UUID) *matter.MatterID {
	if !u.Valid {
		return nil
	}
	id := matter.MatterID(uuid.UUID(u.Bytes).String())
	return &id
}

func uuidVal(id *matter.MatterID) pgtype.UUID {
	if id == nil {
		return pgtype.UUID{}
	}
	parsed, err := uuid.Parse(id.String())
	if err != nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: parsed, Valid: true}
}

func uuidString(s string) pgtype.UUID {
	parsed, err := uuid.Parse(s)
	if err != nil {
		return pgtype.UUID{}
	}
	return pgtype.UUID{Bytes: parsed, Valid: true}
}

func timestamptzPtr(t pgtype.Timestamptz) *time.Time {
	if !t.Valid {
		return nil
	}
	v := t.Time.UTC()
	return &v
}

func timestamptzVal(t *time.Time) pgtype.Timestamptz {
	if t == nil {
		return pgtype.Timestamptz{}
	}
	return pgtype.Timestamptz{Time: t.UTC(), Valid: true}
}

func pgText(s string) pgtype.Text {
	if s == "" {
		return pgtype.Text{}
	}
	return pgtype.Text{String: s, Valid: true}
}

// ---------- W1 receipt snapshots ----------
//
// Requirement-create receipts keep the BE01 shape (no "kind" member) so stored rows
// stay readable; W1 snapshots carry an explicit "kind" discriminator.

type workspaceDTO struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Revision int64  `json:"revision"`
}

type matterHeaderDTO struct {
	ID                     string  `json:"id"`
	WorkspaceID            string  `json:"workspaceId"`
	Title                  string  `json:"title"`
	EventSeq               int64   `json:"eventSeq"`
	Revision               int64   `json:"revision"`
	LastRecordedAt         string  `json:"lastRecordedAt"`
	BoundariesAppliedUntil string  `json:"boundariesAppliedUntil"`
	NextBoundaryAt         *string `json:"nextBoundaryAt"`
}

type workspaceCreatedDTO struct {
	Kind       string           `json:"kind"`
	Workspace  workspaceDTO     `json:"workspace"`
	Matter     *matterHeaderDTO `json:"matter"`
	CallerRole string           `json:"callerRole"`
	Seq        int64            `json:"seq"`
	RecordedAt string           `json:"recordedAt"`
}

func encodeReceiptResponse(rc matter.Receipt) ([]byte, error) {
	switch rc.Kind {
	case "", matter.SnapshotRequirementCreate:
		return encodeCreatedResultJSON(rc.Snapshot)
	case matter.SnapshotCreated:
		return encodeCreated(rc.CreatedSnapshot)
	case matter.SnapshotActionCreate:
		return encodeActionCreated(rc.ItemSnapshot)
	case matter.SnapshotWorkspaceCreate:
		res := rc.WorkspaceSnapshot
		if res == nil {
			return nil, fmt.Errorf("nil workspace receipt snapshot")
		}
		dto := workspaceCreatedDTO{
			Kind:       string(matter.SnapshotWorkspaceCreate),
			Workspace:  workspaceDTO{ID: res.Workspace.ID.String(), Name: res.Workspace.Name, Revision: res.Workspace.Revision},
			CallerRole: string(res.CallerRole),
			Seq:        res.Seq,
			RecordedAt: res.RecordedAt.UTC().Format(time.RFC3339Nano),
		}
		if m := res.Matter; m != nil {
			dto.Matter = &matterHeaderDTO{
				ID: m.MatterID.String(), WorkspaceID: m.WorkspaceID.String(), Title: m.Title,
				EventSeq: m.EventSeq, Revision: m.Revision,
				LastRecordedAt:         m.LastRecordedAt.UTC().Format(time.RFC3339Nano),
				BoundariesAppliedUntil: m.BoundariesAppliedUntil.UTC().Format(time.RFC3339Nano),
			}
			if m.NextBoundaryAt != nil {
				s := m.NextBoundaryAt.UTC().Format(time.RFC3339Nano)
				dto.Matter.NextBoundaryAt = &s
			}
		}
		b, err := json.Marshal(dto)
		if err != nil {
			return nil, fmt.Errorf("marshal workspace receipt snapshot: %w", err)
		}
		return b, nil
	case matter.SnapshotBulkRowApplied:
		res := rc.BulkSnapshot
		if res == nil {
			return nil, fmt.Errorf("nil bulk receipt snapshot")
		}
		b, err := json.Marshal(map[string]any{
			"kind": string(matter.SnapshotBulkRowApplied), "itemId": res.ItemID,
			"kindRow": res.Kind, "revision": res.Revision, "contentHash": res.ContentHash,
		})
		if err != nil {
			return nil, fmt.Errorf("marshal bulk receipt snapshot: %w", err)
		}
		return b, nil
	case matter.SnapshotImportRowApplied:
		res := rc.ImportSnapshot
		if res == nil {
			return nil, fmt.Errorf("nil import receipt snapshot")
		}
		b, err := json.Marshal(map[string]any{
			"kind": string(matter.SnapshotImportRowApplied), "itemId": res.ItemID,
			"rowKey": res.RowKey, "sourceName": res.SourceName,
			"contentHash": res.ContentHash, "revision": res.Revision,
			"recordedAt": res.RecordedAt.UTC().Format(time.RFC3339Nano),
		})
		if err != nil {
			return nil, fmt.Errorf("marshal import receipt snapshot: %w", err)
		}
		return b, nil
	default:
		return nil, fmt.Errorf("unsupported receipt snapshot kind %q", rc.Kind)
	}
}

// decodeReceiptResponse fills the snapshot field matching the stored kind.
func decodeReceiptResponse(rc *matter.Receipt, b []byte) error {
	var peek struct {
		Kind string `json:"kind"`
	}
	if err := json.Unmarshal(b, &peek); err != nil {
		return fmt.Errorf("unmarshal receipt kind: %w", err)
	}
	switch matter.SnapshotKind(peek.Kind) {
	case "", matter.SnapshotRequirementCreate:
		res, err := decodeCreatedResult(b)
		if err != nil {
			return err
		}
		rc.Kind, rc.Snapshot = matter.SnapshotRequirementCreate, res
		return nil
	case matter.SnapshotCreated:
		res, err := decodeCreated(b)
		if err != nil {
			return err
		}
		rc.Kind, rc.CreatedSnapshot = matter.SnapshotCreated, res
		return nil
	case matter.SnapshotActionCreate:
		res, err := decodeActionCreated(b)
		if err != nil {
			return err
		}
		rc.Kind, rc.ItemSnapshot = matter.SnapshotActionCreate, res
		return nil
	case matter.SnapshotWorkspaceCreate:
		var dto workspaceCreatedDTO
		if err := json.Unmarshal(b, &dto); err != nil {
			return fmt.Errorf("unmarshal workspace receipt snapshot: %w", err)
		}
		recordedAt, err := time.Parse(time.RFC3339Nano, dto.RecordedAt)
		if err != nil {
			return fmt.Errorf("receipt snapshot recordedAt: %w", err)
		}
		res := &matter.WorkspaceCreatedResult{
			Workspace:  matter.Workspace{ID: matter.WorkspaceID(dto.Workspace.ID), Name: dto.Workspace.Name, Revision: dto.Workspace.Revision},
			CallerRole: matter.MatterRole(dto.CallerRole),
			Seq:        dto.Seq,
			RecordedAt: recordedAt.UTC(),
		}
		if m := dto.Matter; m != nil {
			last, err := time.Parse(time.RFC3339Nano, m.LastRecordedAt)
			if err != nil {
				return fmt.Errorf("receipt snapshot matter lastRecordedAt: %w", err)
			}
			applied, err := time.Parse(time.RFC3339Nano, m.BoundariesAppliedUntil)
			if err != nil {
				return fmt.Errorf("receipt snapshot matter boundariesAppliedUntil: %w", err)
			}
			h := matter.MatterHeader{
				MatterID: matter.MatterID(m.ID), WorkspaceID: matter.WorkspaceID(m.WorkspaceID), Title: m.Title,
				EventSeq: m.EventSeq, Revision: m.Revision,
				LastRecordedAt: last.UTC(), BoundariesAppliedUntil: applied.UTC(),
			}
			if m.NextBoundaryAt != nil {
				nb, err := time.Parse(time.RFC3339Nano, *m.NextBoundaryAt)
				if err != nil {
					return fmt.Errorf("receipt snapshot matter nextBoundaryAt: %w", err)
				}
				nb = nb.UTC()
				h.NextBoundaryAt = &nb
			}
			res.Matter = &h
		}
		rc.Kind, rc.WorkspaceSnapshot = matter.SnapshotWorkspaceCreate, res
		return nil
	case matter.SnapshotBulkRowApplied:
		var dto struct {
			ItemId      string `json:"itemId"`
			KindRow     string `json:"kindRow"`
			Revision    int64  `json:"revision"`
			ContentHash string `json:"contentHash"`
		}
		if err := json.Unmarshal(b, &dto); err != nil {
			return fmt.Errorf("unmarshal bulk receipt snapshot: %w", err)
		}
		rc.Kind, rc.BulkSnapshot = matter.SnapshotBulkRowApplied, &matter.BulkRowApplied{
			ItemID: dto.ItemId, Kind: dto.KindRow, Revision: dto.Revision, ContentHash: dto.ContentHash,
		}
		return nil
	case matter.SnapshotImportRowApplied:
		var dto struct {
			ItemId      string `json:"itemId"`
			RowKey      string `json:"rowKey"`
			SourceName  string `json:"sourceName"`
			ContentHash string `json:"contentHash"`
			Revision    int64  `json:"revision"`
			RecordedAt  string `json:"recordedAt"`
		}
		if err := json.Unmarshal(b, &dto); err != nil {
			return fmt.Errorf("unmarshal import receipt snapshot: %w", err)
		}
		recordedAt, err := time.Parse(time.RFC3339Nano, dto.RecordedAt)
		if err != nil {
			return fmt.Errorf("receipt snapshot recordedAt: %w", err)
		}
		rc.Kind, rc.ImportSnapshot = matter.SnapshotImportRowApplied, &matter.ImportRowApplied{
			ItemID: dto.ItemId, RowKey: dto.RowKey, SourceName: dto.SourceName,
			ContentHash: dto.ContentHash, Revision: dto.Revision, RecordedAt: recordedAt,
		}
		return nil
	default:
		return fmt.Errorf("unsupported stored receipt snapshot kind %q", peek.Kind)
	}
}

// ---------- W2 action-created receipt snapshot ----------

type actionCreatedDTO struct {
	Kind       string `json:"kind"`
	ID         string `json:"id"`
	MatterID   string `json:"matterId"`
	Title      string `json:"title"`
	Outcome    string `json:"outcome"`
	Revision   int64  `json:"revision"`
	Seq        int64  `json:"seq"`
	RecordedAt string `json:"recordedAt"`
}

func encodeActionCreated(res *matter.WorkItemCreatedResult) ([]byte, error) {
	if res == nil {
		return nil, fmt.Errorf("nil action receipt snapshot")
	}
	it := res.Item
	b, err := json.Marshal(actionCreatedDTO{
		Kind: string(matter.SnapshotActionCreate), ID: it.ID.String(), MatterID: it.MatterID.String(),
		Title: it.Title, Outcome: it.Outcome, Revision: it.Revision, Seq: res.Seq, RecordedAt: res.RecordedAt.UTC().Format(time.RFC3339Nano),
	})
	if err != nil {
		return nil, fmt.Errorf("marshal action receipt snapshot: %w", err)
	}
	return b, nil
}

// decodeActionCreated rebuilds the creation-time item: an Action is born in one fixed initial
// state, so the snapshot stores only what the creating command chose.
func decodeActionCreated(b []byte) (*matter.WorkItemCreatedResult, error) {
	var dto actionCreatedDTO
	if err := json.Unmarshal(b, &dto); err != nil {
		return nil, fmt.Errorf("unmarshal action receipt snapshot: %w", err)
	}
	at, err := time.Parse(time.RFC3339Nano, dto.RecordedAt)
	if err != nil {
		return nil, fmt.Errorf("action receipt snapshot recordedAt: %w", err)
	}
	it, err := matter.NewAction(matter.NodeID(dto.ID), matter.MatterID(dto.MatterID), dto.Title, dto.Outcome)
	if err != nil {
		return nil, fmt.Errorf("action receipt snapshot: %w", err)
	}
	it.Revision = dto.Revision
	return &matter.WorkItemCreatedResult{Item: it, Seq: dto.Seq, RecordedAt: at.UTC()}, nil
}

// ---------- W3 created-record receipt snapshot ----------

type createdDTO struct {
	Kind       string `json:"kind"`
	RecordKind string `json:"recordKind"`
	ID         string `json:"id"`
	Seq        int64  `json:"seq"`
	RecordedAt string `json:"recordedAt"`
}

func encodeCreated(res *matter.CreatedResult) ([]byte, error) {
	if res == nil {
		return nil, fmt.Errorf("nil created receipt snapshot")
	}
	b, err := json.Marshal(createdDTO{
		Kind: string(matter.SnapshotCreated), RecordKind: res.Kind, ID: res.ID, Seq: res.Seq, RecordedAt: res.RecordedAt.UTC().Format(time.RFC3339Nano),
	})
	if err != nil {
		return nil, fmt.Errorf("marshal created receipt snapshot: %w", err)
	}
	return b, nil
}

func decodeCreated(b []byte) (*matter.CreatedResult, error) {
	var dto createdDTO
	if err := json.Unmarshal(b, &dto); err != nil {
		return nil, fmt.Errorf("unmarshal created receipt snapshot: %w", err)
	}
	at, err := time.Parse(time.RFC3339Nano, dto.RecordedAt)
	if err != nil {
		return nil, fmt.Errorf("created receipt snapshot recordedAt: %w", err)
	}
	return &matter.CreatedResult{Kind: dto.RecordKind, ID: dto.ID, Seq: dto.Seq, RecordedAt: at.UTC()}, nil
}
