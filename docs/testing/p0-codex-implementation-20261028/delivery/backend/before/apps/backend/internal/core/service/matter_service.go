package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"sort"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/policy"
	"github.com/example/userapi/internal/core/port"
)

// MatterService implements the MatterControl transaction spine use cases:
// CreateRequirement and GetRequirement.
//
// Authorization runs INSIDE the locked transaction via the policy package; denials
// never emit domain-success events, and replay happens only after current
// authorization for every represented matter. ActorID values are trusted calling
// identities supplied by the boundary: this slice proves membership/role enforcement,
// not authentication.
type MatterService struct {
	store  port.MatterStore
	ids    port.RecordIDGenerator
	logger *slog.Logger
	keyAge matter.KeyAgePolicy
}

var _ port.MatterService = (*MatterService)(nil)

// NewMatterService wires the spine. keyAge is the explicit key-age policy; its zero
// value enforces nothing (retention values are undecided, so none are invented).
func NewMatterService(store port.MatterStore, ids port.RecordIDGenerator, logger *slog.Logger, keyAge matter.KeyAgePolicy) *MatterService {
	return &MatterService{store: store, ids: ids, logger: logger, keyAge: keyAge}
}

// CreateRequirement creates one Requirement with its typed history event and immutable
// idempotency receipt in one transaction.
//
// Outcomes:
//   - *domain.ValidationError: malformed command (no store access).
//   - port.ErrNotFound: matter absent, caller lacks an active membership, or a stored
//     receipt exists whose saved scope / any represented matter the caller can no
//     longer read (uniform; never distinguishes nonexistent from inaccessible).
//   - port.ErrForbidden: caller is an active member with an insufficient role.
//   - port.ErrIdempotencyKeyReuse: same actor+key stored a different fingerprint.
//   - matter.ErrKeyExpired: key age outside the injected policy.
//   - matter.ErrBoundaryDue: the matter header carries a pending temporal boundary due
//     at the command instant; this slice does not process boundaries, so the command
//     fails closed before any mutation and the transaction aborts.
//   - port.ErrUnavailable / port.ErrOutcomeUnknown: storage failures, never fake results.
func (s *MatterService) CreateRequirement(ctx context.Context, cmd port.CreateRequirementCmd) (matter.RequirementCreatedResult, error) {
	actor, err := matter.NewActorID(cmd.ActorID)
	if err != nil {
		return matter.RequirementCreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.RequirementCreatedResult{}, err
	}
	key, err := matter.NewIdempotencyKey(cmd.IdempotencyKey)
	if err != nil {
		return matter.RequirementCreatedResult{}, err
	}
	hash, err := matter.NewRequestHash(cmd.RequestHash)
	if err != nil {
		return matter.RequirementCreatedResult{}, err
	}
	nodeID, err := matter.NewRequirementID(s.ids.NewRecordID())
	if err != nil {
		return matter.RequirementCreatedResult{}, fmt.Errorf("generate requirement id: %w", err)
	}
	req, err := matter.NewRequirement(nodeID, matterID, cmd.Title, cmd.Outcome)
	if err != nil {
		return matter.RequirementCreatedResult{}, err
	}

	var result matter.RequirementCreatedResult
	var outcome error // business denial/422 outcome committed together with its audit row
	err = s.store.Execute(ctx, matterID, func(tx port.MatterTx) error {
		header := tx.Matter()
		tCmd := tx.TCmd()

		ws, wsErr := tx.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := tx.MatterMembership(ctx, matterID, actor)

		rcpt, rcptErr := tx.Receipt(ctx, actor, key)
		if rcptErr != nil && !errors.Is(rcptErr, port.ErrNotFound) {
			return rcptErr
		}
		access, err := accessFrom(ws, wsErr, mm, mmErr)
		if err != nil {
			return err // storage failure: abort, never a fake denial or fake absence
		}

		if rcptErr == nil { // a stored outcome exists: replay path
			if d := policy.DecideReadRequirement(access); !d.Allowed {
				outcome = s.deny(ctx, tx, tCmd, actor, matterID, "DENIED_HIDDEN", port.ErrNotFound)
				return nil
			}
			// Replay authorization covers the receipt's saved scope and EVERY
			// represented matter, not only the command target (BE01-F01): a caller
			// that lost read access to anything the stored outcome represents must
			// not learn anything about the receipt — no age or hash comparison, no
			// stored body. The extra FOR SHARE membership reads are compatible with
			// each other and take no matter-row locks, so the documented lock order
			// (matter row, memberships, typed rows, history, receipt, matters update)
			// is preserved; saved-scope matters are visited in sorted order.
			if err := s.authorizeReceiptScope(ctx, tx, actor, rcpt); err != nil {
				if errors.Is(err, port.ErrNotFound) {
					outcome = s.deny(ctx, tx, tCmd, actor, matterID, "DENIED_HIDDEN", port.ErrNotFound)
					return nil
				}
				return err // storage failure aborts the transaction
			}
			if err := s.keyAge.Check(key, tCmd); err != nil {
				outcome = s.deny(ctx, tx, tCmd, actor, matterID, "IDEMPOTENCY_KEY_EXPIRED", err)
				return nil
			}
			if rcpt.RequestHash != hash {
				outcome = s.deny(ctx, tx, tCmd, actor, matterID, "IDEMPOTENCY_KEY_REUSE", port.ErrIdempotencyKeyReuse)
				return nil
			}
			// Replay performs no domain mutation and no fence advancement, so a
			// pending boundary needs no processing here: the stored outcome is
			// returned verbatim and the boundary stays pending (explicit replay
			// semantics; any NEW command on the matter still fails closed below).
			stored := *rcpt.Snapshot // immutable stored result; never rebuilt from live rows
			stored.Replayed = true
			result = stored
			return nil
		}

		if d := policy.DecideCreateRequirement(access); !d.Allowed {
			var err error
			if d.Hidden {
				err = port.ErrNotFound
			} else {
				err = port.ErrForbidden
			}
			outcome = s.deny(ctx, tx, tCmd, actor, matterID, "DENIED", err)
			return nil
		}
		// Fail closed on an unsupported pending temporal boundary (BE01-F02): a
		// boundary due at t_cmd would have to be evaluated before any new domain
		// mutation or fence advancement, which this slice does not implement.
		// Returning an error aborts the transaction: the matter header, history,
		// receipts and the pending boundary itself stay untouched. A boundary in
		// the future is safe — nothing is due, and CompleteMatter preserves it.
		if header.BoundaryDueAt(tCmd) {
			return matter.ErrBoundaryDue
		}
		if err := s.keyAge.Check(key, tCmd); err != nil {
			outcome = s.deny(ctx, tx, tCmd, actor, matterID, "IDEMPOTENCY_KEY_EXPIRED", err)
			return nil
		}

		seq := header.EventSeq + 1
		if err := tx.InsertNode(ctx, matter.Node{ID: matter.NodeID(nodeID), MatterID: matterID, Kind: matter.NodeRequirement}); err != nil {
			return err
		}
		if err := tx.InsertRequirement(ctx, req); err != nil {
			return err
		}
		event := matter.RequirementCreatedEvent{
			EventID:        s.ids.NewRecordID(),
			MatterID:       matterID,
			TargetID:       nodeID,
			Actor:          actor,
			IdempotencyKey: key,
			Seq:            seq,
			EffectiveAt:    tCmd,
			RecordedAt:     tCmd,
			Requirement:    req,
		}
		if err := tx.AppendRequirementCreated(ctx, event); err != nil {
			return err
		}
		snapshot := matter.RequirementCreatedResult{
			Requirement:    req,
			Seq:            seq,
			RecordedAt:     tCmd,
			IdempotencyKey: key,
			RequestHash:    hash,
		}
		target := matterID
		if err := tx.StoreReceipt(ctx, matter.Receipt{
			ActorID:        actor,
			IdempotencyKey: key,
			RequestHash:    hash,
			ScopeKind:      matter.ScopeMatter,
			WorkspaceID:    header.WorkspaceID,
			MatterID:       &target,
			StatusCode:     200,
			Kind:           matter.SnapshotRequirementCreate,
			CommittedAt:    tCmd,
			Matters:        []matter.MatterID{matterID},
			Snapshot:       &snapshot,
		}); err != nil {
			return err
		}
		if err := tx.CompleteMatter(ctx, seq, tCmd); err != nil {
			return err
		}
		result = snapshot
		return nil
	})
	if err != nil {
		return matter.RequirementCreatedResult{}, fmt.Errorf("create requirement: %w", err)
	}
	if outcome != nil {
		return matter.RequirementCreatedResult{}, outcome
	}
	return result, nil
}

// GetRequirement reads one Requirement through an authorized REPEATABLE READ READ ONLY
// snapshot. Inaccessible, nonexistent and kind-mismatched ids are indistinguishable
// (port.ErrNotFound); storage failures wrap port.ErrUnavailable and never invent
// empty results.
func (s *MatterService) GetRequirement(ctx context.Context, q port.GetRequirementQuery) (matter.RequirementRead, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.RequirementRead{}, err
	}
	id, err := matter.NewRequirementID(q.ID)
	if err != nil {
		return matter.RequirementRead{}, err
	}

	var read matter.RequirementRead
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		req, matterID, err := snap.RequirementByID(ctx, id)
		if err != nil {
			return err
		}
		header, err := snap.MatterHeader(ctx, matterID)
		if err != nil {
			return err
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := snap.MatterMembership(ctx, matterID, actor)
		access, err := accessFrom(ws, wsErr, mm, mmErr)
		if err != nil {
			return err // storage failure: unavailable, never a fake not-found
		}
		if d := policy.DecideReadRequirement(access); !d.Allowed {
			return port.ErrNotFound
		}
		read = matter.RequirementRead{
			Requirement:    req,
			AsOf:           snap.AsOf(),
			SourceRevision: header.EventSeq,
		}
		return nil
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return matter.RequirementRead{}, port.ErrNotFound
		}
		return matter.RequirementRead{}, fmt.Errorf("get requirement: %w", err)
	}
	return read, nil
}

// accessFrom summarizes membership lookups into policy access facts. Only ErrNotFound
// means absence: any other lookup failure is a storage failure and is returned so the
// caller aborts instead of converting it into missing facts (which would surface as a
// false not-found). Wrapped causes are preserved (BE01-F03).
func accessFrom(ws matter.WorkspaceMembership, wsErr error, mm matter.MatterMembership, mmErr error) (policy.Access, error) {
	if wsErr != nil && !errors.Is(wsErr, port.ErrNotFound) {
		return policy.Access{}, fmt.Errorf("workspace membership: %w", wsErr)
	}
	if mmErr != nil && !errors.Is(mmErr, port.ErrNotFound) {
		return policy.Access{}, fmt.Errorf("matter membership: %w", mmErr)
	}
	a := policy.Access{MatterRole: mm.Role}
	if wsErr == nil && ws.Status == matter.StatusActive {
		a.WorkspaceActive = true
	}
	if mmErr == nil {
		a.MatterFound = true
		if mm.Status == matter.StatusActive {
			a.MatterActive = true
		}
	}
	return a, nil
}

// authorizeReceiptScope requires current read authority for a stored receipt's saved
// scope before any replay outcome is exposed (BE01-F01): an ACTIVE workspace membership
// in the receipt's workspace and, for EVERY represented matter (Receipt.Matters
// contract), an ACTIVE matter membership with any role. Lookups run inside the same
// locked transaction; losing any authority returns ErrNotFound so the receipt stays
// invisible (uniform denial, audit-committed, no stored body). Only ErrNotFound is
// absence; every other lookup failure is a storage failure and propagates (BE01-F03).
func (s *MatterService) authorizeReceiptScope(ctx context.Context, tx port.MatterTx, actor matter.ActorID, rcpt matter.Receipt) error {
	ws, wsErr := tx.WorkspaceMembership(ctx, rcpt.WorkspaceID, actor)
	if wsErr != nil && !errors.Is(wsErr, port.ErrNotFound) {
		return fmt.Errorf("receipt workspace membership: %w", wsErr)
	}
	if wsErr != nil || ws.Status != matter.StatusActive {
		return port.ErrNotFound // saved workspace access lost
	}
	matters := append([]matter.MatterID(nil), rcpt.Matters...)
	sort.Slice(matters, func(i, j int) bool { return matters[i] < matters[j] })
	for _, m := range matters {
		mm, mmErr := tx.MatterMembership(ctx, m, actor)
		access, err := accessFrom(ws, nil, mm, mmErr)
		if err != nil {
			return err
		}
		if d := policy.DecideReadRequirement(access); !d.Allowed {
			return port.ErrNotFound // represented-matter read access lost
		}
	}
	return nil
}

// deny records the restricted security-audit row and returns the outcome error. The
// transaction still commits: the audit row is the only write, and no domain-success
// event exists. Audit rows carry no titles or content, only a hash of the matter id.
func (s *MatterService) deny(ctx context.Context, tx port.MatterTx, tCmd time.Time, actor matter.ActorID, matterID matter.MatterID, result string, err error) error {
	auditErr := tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
		EventID:               s.ids.NewRecordID(),
		OccurredAt:            tCmd,
		Actor:                 actor,
		Operation:             "create_requirement",
		Outcome:               result,
		RequestedResourceKind: "MATTER",
		RequestedIDHash:       matter.HashID(matterID.String()),
	})
	if auditErr != nil {
		s.logger.Error("security audit write failed", "operation", "create_requirement", "outcome", result, "err", auditErr)
	}
	return err
}
