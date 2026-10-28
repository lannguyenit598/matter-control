package service

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/policy"
	"github.com/example/userapi/internal/core/port"
)

// WorkspaceService implements the W1 administration and read use cases on top of the
// same transaction/receipt/audit patterns as the BE01 spine. Authorization runs
// inside the locked transaction; denials are committed with their audit row; receipts
// replay only after current authorization of the saved scope and every represented
// matter.
type WorkspaceService struct {
	store  port.WorkspaceStore
	ids    port.RecordIDGenerator
	logger *slog.Logger
	keyAge matter.KeyAgePolicy
}

var _ port.WorkspaceService = (*WorkspaceService)(nil)

func NewWorkspaceService(store port.WorkspaceStore, ids port.RecordIDGenerator, logger *slog.Logger, keyAge matter.KeyAgePolicy) *WorkspaceService {
	return &WorkspaceService{store: store, ids: ids, logger: logger, keyAge: keyAge}
}

// auditTx is the audit capability shared by every transaction shape.
type auditTx interface {
	RecordSecurityAudit(ctx context.Context, e matter.SecurityAuditEntry) error
}

// deny records the restricted audit row for a committed denial and returns the
// outcome error. Workspace-scoped denials reference the workspace in the audit hash.
func (s *WorkspaceService) deny(ctx context.Context, tx auditTx, wCmd time.Time, actor matter.ActorID, workspace matter.WorkspaceID, operation, result string, err error) error {
	if auditErr := tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
		EventID:               s.ids.NewRecordID(),
		OccurredAt:            wCmd,
		Actor:                 actor,
		Operation:             operation,
		Outcome:               result,
		RequestedResourceKind: "WORKSPACE",
		RequestedIDHash:       matter.HashID(workspace.String()),
	}); auditErr != nil {
		return auditErr
	}
	return err
}

func parseWorkspaceRole(s string) (matter.WorkspaceRole, error) {
	r := matter.WorkspaceRole(s)
	if !r.Valid() {
		return "", matter.InvalidRoleError{Value: s}
	}
	return r, nil
}

func parseMatterRole(s string) (matter.MatterRole, error) {
	r := matter.MatterRole(s)
	if !r.Valid() {
		return "", matter.InvalidRoleError{Value: s}
	}
	return r, nil
}

// CreateWorkspace creates one workspace with the caller as its initial OWNER and an
// immutable receipt, in one transaction. CAS scope: none (an If-Match is rejected by
// the boundary before the service).
func (s *WorkspaceService) CreateWorkspace(ctx context.Context, cmd port.CreateWorkspaceCmd) (matter.WorkspaceCreatedResult, error) {
	actor, err := matter.NewActorID(cmd.ActorID)
	if err != nil {
		return matter.WorkspaceCreatedResult{}, err
	}
	key, err := matter.NewIdempotencyKey(cmd.IdempotencyKey)
	if err != nil {
		return matter.WorkspaceCreatedResult{}, err
	}
	name, err := matter.NewDisplayName(cmd.Name, "name")
	if err != nil {
		return matter.WorkspaceCreatedResult{}, err
	}
	hash, err := matter.NewRequestHash(cmd.RequestHash)
	if err != nil {
		return matter.WorkspaceCreatedResult{}, err
	}
	wsID, err := matter.NewWorkspaceID(s.ids.NewRecordID())
	if err != nil {
		return matter.WorkspaceCreatedResult{}, fmt.Errorf("generate workspace id: %w", err)
	}

	var result matter.WorkspaceCreatedResult
	var outcome error
	run := func(tx port.WorkspaceCreationTx) error {
		wCmd := tx.WCmd()
		rcpt, rcptErr := tx.Receipt(ctx, actor, key)
		if rcptErr != nil && !errors.Is(rcptErr, port.ErrNotFound) {
			return rcptErr
		}
		if rcptErr == nil {
			if rcpt.Kind != matter.SnapshotWorkspaceCreate || rcpt.WorkspaceSnapshot == nil {
				outcome = matter.ErrSnapshotKind
				return nil
			}
			if rcpt.RequestHash != hash {
				outcome = s.deny(ctx, tx, wCmd, actor, rcpt.WorkspaceID, "CREATE_WORKSPACE", "IDEMPOTENCY_KEY_REUSE", port.ErrIdempotencyKeyReuse)
				return nil
			}
			if err := s.keyAge.Check(key, wCmd); err != nil {
				outcome = s.deny(ctx, tx, wCmd, actor, rcpt.WorkspaceID, "CREATE_WORKSPACE", "IDEMPOTENCY_KEY_EXPIRED", err)
				return nil
			}
			stored := *rcpt.WorkspaceSnapshot
			stored.Replayed = true
			result = stored
			return nil
		}
		if err := s.keyAge.Check(key, wCmd); err != nil {
			outcome = s.deny(ctx, tx, wCmd, actor, wsID, "CREATE_WORKSPACE", "IDEMPOTENCY_KEY_EXPIRED", err)
			return nil
		}
		if err := tx.InsertWorkspace(ctx, matter.Workspace{ID: wsID, Name: name, Revision: 1}); err != nil {
			return err
		}
		owner := matter.WorkspaceMembership{WorkspaceID: wsID, ActorID: actor, Role: matter.WorkspaceRoleOwner, Status: matter.StatusActive, Revision: 1}
		if err := tx.InsertWorkspaceMembership(ctx, owner); err != nil {
			return err
		}
		result = matter.WorkspaceCreatedResult{Workspace: matter.Workspace{ID: wsID, Name: name, Revision: 1}, RecordedAt: wCmd}
		if err := tx.StoreReceipt(ctx, matter.Receipt{
			ActorID: actor, IdempotencyKey: key, RequestHash: hash,
			ScopeKind: matter.ScopeWorkspace, WorkspaceID: wsID,
			StatusCode: 201, CommittedAt: wCmd,
			Kind: matter.SnapshotWorkspaceCreate, WorkspaceSnapshot: &result,
		}); err != nil {
			return err
		}
		return tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
			EventID: s.ids.NewRecordID(), OccurredAt: wCmd, Actor: actor,
			Operation: "CREATE_WORKSPACE", Outcome: "OK",
			RequestedResourceKind: "WORKSPACE", RequestedIDHash: matter.HashID(wsID.String()),
		})
	}
	err = s.store.ExecuteCreation(ctx, run)
	if errors.Is(err, port.ErrIdempotencyKeyReuse) {
		// No row exists to lock, so a concurrent same-key creation can win the receipt
		// primary key first. Rerun once: the committed receipt is then found and either
		// replays (same intent) or reports genuine key reuse (different intent).
		result, outcome = matter.WorkspaceCreatedResult{}, nil
		err = s.store.ExecuteCreation(ctx, run)
	}
	if err != nil {
		return matter.WorkspaceCreatedResult{}, fmt.Errorf("create workspace: %w", err)
	}
	if outcome != nil {
		return matter.WorkspaceCreatedResult{}, outcome
	}
	return result, nil
}

// GetWorkspace reads one workspace through a snapshot; non-members receive the
// uniform not-found denial.
func (s *WorkspaceService) GetWorkspace(ctx context.Context, q port.GetWorkspaceQuery) (matter.Workspace, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.Workspace{}, err
	}
	wsID, err := matter.NewWorkspaceID(q.WorkspaceID)
	if err != nil {
		return matter.Workspace{}, err
	}
	var ws matter.Workspace
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		wm, wmErr := snap.WorkspaceMembership(ctx, wsID, actor)
		if wmErr != nil && !errors.Is(wmErr, port.ErrNotFound) {
			return fmt.Errorf("workspace membership: %w", wmErr)
		}
		wa := policy.WorkspaceAccess{}
		if wmErr == nil && wm.Status == matter.StatusActive {
			wa.WorkspaceFound = true
			wa.WorkspaceRole = wm.Role
		}
		if d := policy.DecideWorkspaceRead(wa); !d.Allowed {
			return port.ErrNotFound
		}
		ws, err = snap.WorkspaceByID(ctx, wsID)
		return err
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return matter.Workspace{}, port.ErrNotFound
		}
		return matter.Workspace{}, fmt.Errorf("get workspace: %w", err)
	}
	return ws, nil
}

// ListAccessibleMatters returns the caller's active matters inside the workspace.
// Active workspace membership AND an active matter membership are both required.
func (s *WorkspaceService) ListAccessibleMatters(ctx context.Context, q port.ListAccessibleMattersQuery) (matter.AccessibleMatterPage, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.AccessibleMatterPage{}, err
	}
	wsID, err := matter.NewWorkspaceID(q.WorkspaceID)
	if err != nil {
		return matter.AccessibleMatterPage{}, err
	}
	var page matter.AccessibleMatterPage
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		wm, wmErr := snap.WorkspaceMembership(ctx, wsID, actor)
		if wmErr != nil && !errors.Is(wmErr, port.ErrNotFound) {
			return fmt.Errorf("workspace membership: %w", wmErr)
		}
		wa := policy.WorkspaceAccess{}
		if wmErr == nil && wm.Status == matter.StatusActive {
			wa.WorkspaceFound = true
		}
		if d := policy.DecideWorkspaceRead(wa); !d.Allowed {
			return port.ErrNotFound
		}
		read, ok := snap.(port.MatterReadSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support W1 reads")
		}
		page, err = read.AccessibleMatters(ctx, wsID, actor, q.Cursor, q.Limit)
		return err
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return matter.AccessibleMatterPage{}, port.ErrNotFound
		}
		return matter.AccessibleMatterPage{}, fmt.Errorf("list accessible matters: %w", err)
	}
	return page, nil
}

// CreateMatter creates one matter inside the workspace with the caller as its initial
// OWNER and the first history event, in one workspace transaction.
func (s *WorkspaceService) CreateMatter(ctx context.Context, cmd port.CreateMatterCmd) (matter.WorkspaceCreatedResult, error) {
	actor, err := matter.NewActorID(cmd.ActorID)
	if err != nil {
		return matter.WorkspaceCreatedResult{}, err
	}
	wsID, err := matter.NewWorkspaceID(cmd.WorkspaceID)
	if err != nil {
		return matter.WorkspaceCreatedResult{}, err
	}
	key, err := matter.NewIdempotencyKey(cmd.IdempotencyKey)
	if err != nil {
		return matter.WorkspaceCreatedResult{}, err
	}
	hash, err := matter.NewRequestHash(cmd.RequestHash)
	if err != nil {
		return matter.WorkspaceCreatedResult{}, err
	}
	title, err := matter.NewDisplayName(cmd.Title, "title")
	if err != nil {
		return matter.WorkspaceCreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(s.ids.NewRecordID())
	if err != nil {
		return matter.WorkspaceCreatedResult{}, fmt.Errorf("generate matter id: %w", err)
	}

	var result matter.WorkspaceCreatedResult
	var outcome error
	err = s.store.ExecuteWorkspace(ctx, wsID, func(tx port.WorkspaceTx) error {
		header := tx.Workspace()
		wCmd := tx.WCmd()
		wm, wmErr := tx.WorkspaceMembershipOf(ctx, actor)
		if wmErr != nil && !errors.Is(wmErr, port.ErrNotFound) {
			return wmErr
		}
		wa := policy.WorkspaceAccess{}
		if wmErr == nil && wm.Status == matter.StatusActive {
			wa.WorkspaceFound = true
			wa.WorkspaceRole = wm.Role
		}

		rcpt, rcptErr := tx.Receipt(ctx, actor, key)
		if rcptErr != nil && !errors.Is(rcptErr, port.ErrNotFound) {
			return rcptErr
		}
		if rcptErr == nil {
			if rcpt.Kind != matter.SnapshotWorkspaceCreate || rcpt.WorkspaceSnapshot == nil || rcpt.WorkspaceSnapshot.Matter == nil {
				outcome = matter.ErrSnapshotKind
				return nil
			}
			if d := policy.DecideWorkspaceRead(wa); !d.Allowed {
				outcome = s.deny(ctx, tx, wCmd, actor, wsID, "CREATE_MATTER", "DENIED_HIDDEN", port.ErrNotFound)
				return nil
			}
			if err := s.authorizeReceiptMatter(ctx, tx, actor, rcpt); err != nil {
				if errors.Is(err, port.ErrNotFound) {
					outcome = s.deny(ctx, tx, wCmd, actor, wsID, "CREATE_MATTER", "DENIED_HIDDEN", port.ErrNotFound)
					return nil
				}
				return err
			}
			if rcpt.RequestHash != hash {
				outcome = s.deny(ctx, tx, wCmd, actor, wsID, "CREATE_MATTER", "IDEMPOTENCY_KEY_REUSE", port.ErrIdempotencyKeyReuse)
				return nil
			}
			if err := s.keyAge.Check(key, wCmd); err != nil {
				outcome = s.deny(ctx, tx, wCmd, actor, wsID, "CREATE_MATTER", "IDEMPOTENCY_KEY_EXPIRED", err)
				return nil
			}
			stored := *rcpt.WorkspaceSnapshot
			stored.Replayed = true
			result = stored
			return nil
		}

		if d := policy.DecideCreateMatter(wa); !d.Allowed {
			var derr error
			if d.Hidden {
				derr = port.ErrNotFound
			} else {
				derr = port.ErrForbidden
			}
			outcome = s.deny(ctx, tx, wCmd, actor, wsID, "CREATE_MATTER", "DENIED", derr)
			return nil
		}
		// W1-A02: fresh creates carry the workspace-revision CAS (428 when the
		// precondition is omitted, 412 when stale). Authorization runs first so a
		// refusal never leaks workspace existence to a non-member.
		if err := workspaceHeaderRevisionCAS(header, cmd.ExpectedRevision); err != nil {
			outcome = s.deny(ctx, tx, wCmd, actor, wsID, "CREATE_MATTER", "PRECONDITION", err)
			return nil
		}
		if err := s.keyAge.Check(key, wCmd); err != nil {
			outcome = s.deny(ctx, tx, wCmd, actor, wsID, "CREATE_MATTER", "IDEMPOTENCY_KEY_EXPIRED", err)
			return nil
		}
		header2 := matter.MatterHeader{MatterID: matterID, WorkspaceID: wsID, Title: title, EventSeq: 1, Revision: 1, LastRecordedAt: wCmd, BoundariesAppliedUntil: wCmd}
		if err := tx.InsertMatter(ctx, header2); err != nil {
			return err
		}
		if err := tx.InsertMatterMembership(ctx, matter.MatterMembership{MatterID: matterID, ActorID: actor, Role: matter.MatterRoleOwner, Status: matter.StatusActive, Revision: 1}); err != nil {
			return err
		}
		eventID := s.ids.NewRecordID()
		if err := tx.AppendMatterCreatedEvent(ctx, matterID, 1, eventID, actor, matterID.String(), wCmd, wCmd); err != nil {
			return err
		}
		// A successful create advances the workspace revision so the caller's next
		// CAS write presents the fresh revision (readback rule of the contract).
		if err := tx.BumpWorkspaceRevision(ctx, header.Revision+1); err != nil {
			return err
		}
		result = matter.WorkspaceCreatedResult{Workspace: header, Matter: &header2, CallerRole: matter.MatterRoleOwner, Seq: 1, RecordedAt: wCmd}
		if err := tx.StoreReceipt(ctx, matter.Receipt{
			ActorID: actor, IdempotencyKey: key, RequestHash: hash,
			ScopeKind: matter.ScopeWorkspace, WorkspaceID: wsID,
			StatusCode: 201, CommittedAt: wCmd,
			Matters:           []matter.MatterID{matterID},
			Kind:              matter.SnapshotWorkspaceCreate,
			WorkspaceSnapshot: &result,
		}); err != nil {
			return err
		}
		return tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
			EventID: s.ids.NewRecordID(), OccurredAt: wCmd, Actor: actor,
			Operation: "CREATE_MATTER", Outcome: "OK",
			RequestedResourceKind: "WORKSPACE", RequestedIDHash: matter.HashID(wsID.String()),
		})
	})
	if err != nil {
		return matter.WorkspaceCreatedResult{}, fmt.Errorf("create matter: %w", err)
	}
	if outcome != nil {
		return matter.WorkspaceCreatedResult{}, outcome
	}
	return result, nil
}

// authorizeReceiptMatter re-checks current read access for every matter represented
// in a stored receipt (BE01-F01 rule, generalized): one lost membership hides the
// whole receipt.
func (s *WorkspaceService) authorizeReceiptMatter(ctx context.Context, tx port.WorkspaceTx, actor matter.ActorID, rcpt matter.Receipt) error {
	wm, wmErr := tx.WorkspaceMembershipOf(ctx, actor)
	if wmErr != nil {
		if errors.Is(wmErr, port.ErrNotFound) {
			return port.ErrNotFound
		}
		return wmErr
	}
	if wm.Status != matter.StatusActive {
		return port.ErrNotFound
	}
	for _, m := range rcpt.Matters {
		mm, mmErr := tx.MatterMembership(ctx, m, actor)
		if mmErr != nil {
			if errors.Is(mmErr, port.ErrNotFound) {
				return port.ErrNotFound
			}
			return mmErr
		}
		if mm.Status != matter.StatusActive {
			return port.ErrNotFound
		}
	}
	return nil
}

// matterDeny records the restricted audit row for a committed matter-scoped denial.
func (s *WorkspaceService) matterDeny(ctx context.Context, tx port.MatterTx, tCmd time.Time, actor matter.ActorID, matterID matter.MatterID, operation, result string, err error) error {
	if auditErr := tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
		EventID:               s.ids.NewRecordID(),
		OccurredAt:            tCmd,
		Actor:                 actor,
		Operation:             operation,
		Outcome:               result,
		RequestedResourceKind: "MATTER",
		RequestedIDHash:       matter.HashID(matterID.String()),
	}); auditErr != nil {
		return auditErr
	}
	return err
}

// workspaceHeaderRevisionCAS validates the caller's expected revision against the
// locked workspace header.
func workspaceHeaderRevisionCAS(header matter.Workspace, expected int64) error {
	if expected == 0 {
		return port.ErrPreconditionRequired
	}
	if header.Revision != expected {
		return port.ErrPreconditionFailed
	}
	return nil
}

// matterHeaderRevisionCAS validates the caller's expected revision against the locked
// matter header.
func matterHeaderRevisionCAS(header matter.MatterHeader, expected int64) error {
	if expected == 0 {
		return port.ErrPreconditionRequired
	}
	if header.Revision != expected {
		return port.ErrPreconditionFailed
	}
	return nil
}

// GrantWorkspaceMembership grants (or reactivates) a workspace membership. CAS scope:
// the workspace revision.
func (s *WorkspaceService) GrantWorkspaceMembership(ctx context.Context, cmd port.GrantWorkspaceMembershipCmd) (matter.MembershipChangeResult, error) {
	return s.changeWorkspaceMembership(ctx, cmd.ActorID, cmd.WorkspaceID, cmd.UserID, cmd.Role, cmd.ExpectedRevision, matter.StatusActive, "GRANT_WORKSPACE_MEMBER")
}

// RevokeWorkspaceMembership revokes a workspace membership under last-owner
// protection. CAS scope: the workspace revision.
func (s *WorkspaceService) RevokeWorkspaceMembership(ctx context.Context, cmd port.RevokeWorkspaceMembershipCmd) (matter.MembershipChangeResult, error) {
	return s.changeWorkspaceMembership(ctx, cmd.ActorID, cmd.WorkspaceID, cmd.UserID, "", cmd.ExpectedRevision, matter.StatusRevoked, "REVOKE_WORKSPACE_MEMBER")
}

// changeWorkspaceMembership implements the shared workspace-membership change flow.
// Membership changes are CAS-guarded audited commands, not receipted intents (W1
// decision recorded in the workboard).
func (s *WorkspaceService) changeWorkspaceMembership(ctx context.Context, actorID, workspaceID, userID, role string, expectedRevision int64, status matter.MembershipStatus, operation string) (matter.MembershipChangeResult, error) {
	actor, err := matter.NewActorID(actorID)
	if err != nil {
		return matter.MembershipChangeResult{}, err
	}
	wsID, err := matter.NewWorkspaceID(workspaceID)
	if err != nil {
		return matter.MembershipChangeResult{}, err
	}
	target, err := matter.NewActorID(userID)
	if err != nil {
		return matter.MembershipChangeResult{}, err
	}
	wsRole, roleErr := parseWorkspaceRole(role)
	if status == matter.StatusActive && roleErr != nil {
		return matter.MembershipChangeResult{}, roleErr
	}

	var result matter.MembershipChangeResult
	var outcome error
	err = s.store.ExecuteWorkspace(ctx, wsID, func(tx port.WorkspaceTx) error {
		header := tx.Workspace()
		wCmd := tx.WCmd()
		caller, callerErr := tx.WorkspaceMembershipOf(ctx, actor)
		if callerErr != nil && !errors.Is(callerErr, port.ErrNotFound) {
			return callerErr
		}
		wa := policy.WorkspaceAccess{}
		if callerErr == nil && caller.Status == matter.StatusActive {
			wa.WorkspaceFound = true
			wa.WorkspaceRole = caller.Role
		}

		if err := workspaceHeaderRevisionCAS(header, expectedRevision); err != nil {
			// Non-members always receive the hidden denial; the precondition outcome
			// never leaks workspace existence.
			if d := policy.DecideWorkspaceAdmin(wa); d.Hidden {
				outcome = s.deny(ctx, tx, wCmd, actor, wsID, operation, "DENIED_HIDDEN", port.ErrNotFound)
				return nil
			}
			outcome = s.deny(ctx, tx, wCmd, actor, wsID, operation, "PRECONDITION", err)
			return nil
		}

		if d := policy.DecideWorkspaceAdmin(wa); !d.Allowed {
			var derr error
			if d.Hidden {
				derr = port.ErrNotFound
			} else {
				derr = port.ErrForbidden
			}
			outcome = s.deny(ctx, tx, wCmd, actor, wsID, operation, "DENIED", derr)
			return nil
		}

		existing, exErr := tx.WorkspaceMembershipOf(ctx, target)
		if exErr != nil && !errors.Is(exErr, port.ErrNotFound) {
			return exErr
		}
		if status == matter.StatusActive {
			if exErr == nil && existing.Role != wsRole {
				// Role changes are outside the W1 catalogue for an ACTIVE row AND for
				// a reactivation: a stored role must never persist silently under a
				// command result describing a different role (W1-A01).
				outcome = port.ErrForbidden
				return nil
			}
			if exErr == nil && existing.Status == matter.StatusActive {
				result = matter.MembershipChangeResult{ScopeKind: matter.ScopeWorkspace, WorkspaceID: wsID, UserID: target, Role: string(wsRole), Status: existing.Status, Revision: existing.Revision, RecordedAt: wCmd}
				return nil // same-role grant is a no-op outcome
			}
			newRev := header.Revision + 1
			if exErr == nil { // REVOKED row: reactivate
				if _, err := tx.UpdateWorkspaceMembershipStatus(ctx, target, matter.StatusActive, expectedRevision); err != nil {
					return err
				}
			} else if err := tx.InsertWorkspaceMembership(ctx, matter.WorkspaceMembership{WorkspaceID: wsID, ActorID: target, Role: wsRole, Status: matter.StatusActive, Revision: newRev}); err != nil {
				return err
			}
			if err := tx.BumpWorkspaceRevision(ctx, newRev); err != nil {
				return err
			}
			result = matter.MembershipChangeResult{ScopeKind: matter.ScopeWorkspace, WorkspaceID: wsID, UserID: target, Role: string(wsRole), Status: matter.StatusActive, Revision: newRev, RecordedAt: wCmd}
		} else {
			if exErr != nil {
				outcome = port.ErrNotFound // nothing to revoke
				return nil
			}
			if existing.Role == matter.WorkspaceRoleOwner {
				n, err := tx.CountActiveWorkspaceOwners(ctx)
				if err != nil {
					return err
				}
				if n <= 1 {
					outcome = port.ErrLastOwner
					return nil
				}
			}
			newRev := header.Revision + 1
			if _, err := tx.UpdateWorkspaceMembershipStatus(ctx, target, matter.StatusRevoked, expectedRevision); err != nil {
				return err
			}
			if err := tx.BumpWorkspaceRevision(ctx, newRev); err != nil {
				return err
			}
			result = matter.MembershipChangeResult{ScopeKind: matter.ScopeWorkspace, WorkspaceID: wsID, UserID: target, Role: string(existing.Role), Status: matter.StatusRevoked, Revision: newRev, RecordedAt: wCmd}
		}
		return tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
			EventID: s.ids.NewRecordID(), OccurredAt: wCmd, Actor: actor,
			Operation: operation, Outcome: "OK",
			RequestedResourceKind: "WORKSPACE", RequestedIDHash: matter.HashID(wsID.String()),
		})
	})
	if err != nil {
		return matter.MembershipChangeResult{}, fmt.Errorf("%s: %w", operation, err)
	}
	if outcome != nil {
		return matter.MembershipChangeResult{}, outcome
	}
	return result, nil
}

// GrantMatterMembership grants (or reactivates) a matter membership. The target must
// already be an ACTIVE workspace member (approved matrix: "active workspace members
// only"). CAS scope: the matter revision. Emits a matter-scoped membership.granted
// event and advances the matter fence.
func (s *WorkspaceService) GrantMatterMembership(ctx context.Context, cmd port.GrantMatterMembershipCmd) (matter.MembershipChangeResult, error) {
	return s.changeMatterMembership(ctx, cmd.ActorID, cmd.MatterID, cmd.UserID, cmd.Role, cmd.ExpectedRevision, matter.StatusActive, "GRANT_MATTER_MEMBER")
}

// RevokeMatterMembership revokes a matter membership under last-active-OWNER
// protection. CAS scope: the matter revision. Emits membership.revoked.
func (s *WorkspaceService) RevokeMatterMembership(ctx context.Context, cmd port.RevokeMatterMembershipCmd) (matter.MembershipChangeResult, error) {
	return s.changeMatterMembership(ctx, cmd.ActorID, cmd.MatterID, cmd.UserID, "", cmd.ExpectedRevision, matter.StatusRevoked, "REVOKE_MATTER_MEMBER")
}

func (s *WorkspaceService) changeMatterMembership(ctx context.Context, actorID, matterIDStr, userID, role string, expectedRevision int64, status matter.MembershipStatus, operation string) (matter.MembershipChangeResult, error) {
	actor, err := matter.NewActorID(actorID)
	if err != nil {
		return matter.MembershipChangeResult{}, err
	}
	matterID, err := matter.NewMatterID(matterIDStr)
	if err != nil {
		return matter.MembershipChangeResult{}, err
	}
	target, err := matter.NewActorID(userID)
	if err != nil {
		return matter.MembershipChangeResult{}, err
	}
	roleV, roleErr := parseMatterRole(role)
	if status == matter.StatusActive && roleErr != nil {
		return matter.MembershipChangeResult{}, roleErr
	}

	var result matter.MembershipChangeResult
	var outcome error
	err = s.store.Execute(ctx, matterID, func(tx port.MatterTx) error {
		header := tx.Matter()
		tCmd := tx.TCmd()
		admin, ok := tx.(port.MatterMembershipAdminTx)
		if !ok {
			return fmt.Errorf("matter transaction does not support W1 membership administration")
		}
		ws, wsErr := tx.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := tx.MatterMembership(ctx, matterID, actor)
		access, err := accessFrom(ws, wsErr, mm, mmErr)
		if err != nil {
			return err
		}

		if err := matterHeaderRevisionCAS(header, expectedRevision); err != nil {
			if d := policy.DecideMatterAdmin(access); d.Hidden {
				outcome = s.matterDeny(ctx, tx, tCmd, actor, matterID, operation, "DENIED_HIDDEN", port.ErrNotFound)
				return nil
			}
			outcome = s.matterDeny(ctx, tx, tCmd, actor, matterID, operation, "PRECONDITION", err)
			return nil
		}

		if d := policy.DecideMatterAdmin(access); !d.Allowed {
			var derr error
			if d.Hidden {
				derr = port.ErrNotFound
			} else {
				derr = port.ErrForbidden
			}
			outcome = s.matterDeny(ctx, tx, tCmd, actor, matterID, operation, "DENIED", derr)
			return nil
		}

		existing, exErr := tx.MatterMembership(ctx, matterID, target)
		if exErr != nil && !errors.Is(exErr, port.ErrNotFound) {
			return exErr
		}
		if status == matter.StatusActive {
			// The target must be an active member of the workspace.
			tws, twsErr := tx.WorkspaceMembership(ctx, header.WorkspaceID, target)
			if twsErr != nil {
				if errors.Is(twsErr, port.ErrNotFound) {
					outcome = port.ErrForbidden // target not an active workspace member
					return nil
				}
				return twsErr
			}
			if tws.Status != matter.StatusActive {
				outcome = port.ErrForbidden
				return nil
			}
			if exErr == nil && existing.Role != roleV {
				// W1-A01: a reactivation must not silently restore a stored role that
				// differs from the requested one.
				outcome = port.ErrForbidden
				return nil
			}
			if exErr == nil && existing.Status == matter.StatusActive {
				result = matter.MembershipChangeResult{ScopeKind: matter.ScopeMatter, WorkspaceID: header.WorkspaceID, MatterID: &matterID, UserID: target, Role: string(roleV), Status: existing.Status, Revision: existing.Revision, RecordedAt: tCmd}
				return nil
			}
			newRev := header.Revision + 1
			if exErr == nil {
				if _, err := admin.UpdateMatterMembershipStatus(ctx, target, matter.StatusActive, expectedRevision); err != nil {
					return err
				}
			} else if err := admin.InsertMatterMembership(ctx, matter.MatterMembership{MatterID: matterID, ActorID: target, Role: roleV, Status: matter.StatusActive, Revision: newRev}); err != nil {
				return err
			}
			if err := admin.AppendMembershipEvent(ctx, matterID, header.EventSeq+1, s.ids.NewRecordID(), "membership.granted", "MATTER_MEMBERSHIP", target.String(), actor, target, "", tCmd, tCmd); err != nil {
				return err
			}
			if err := tx.CompleteMatter(ctx, header.EventSeq+1, tCmd); err != nil {
				return err
			}
			result = matter.MembershipChangeResult{ScopeKind: matter.ScopeMatter, WorkspaceID: header.WorkspaceID, MatterID: &matterID, UserID: target, Role: string(roleV), Status: matter.StatusActive, Revision: newRev, RecordedAt: tCmd}
		} else {
			if exErr != nil {
				outcome = port.ErrNotFound
				return nil
			}
			if existing.Role == matter.MatterRoleOwner {
				n, err := admin.CountActiveMatterOwners(ctx)
				if err != nil {
					return err
				}
				if n <= 1 {
					outcome = port.ErrLastOwner
					return nil
				}
			}
			newRev := header.Revision + 1
			if _, err := admin.UpdateMatterMembershipStatus(ctx, target, matter.StatusRevoked, expectedRevision); err != nil {
				return err
			}
			if err := admin.AppendMembershipEvent(ctx, matterID, header.EventSeq+1, s.ids.NewRecordID(), "membership.revoked", "MATTER_MEMBERSHIP", target.String(), actor, target, "", tCmd, tCmd); err != nil {
				return err
			}
			if err := tx.CompleteMatter(ctx, header.EventSeq+1, tCmd); err != nil {
				return err
			}
			result = matter.MembershipChangeResult{ScopeKind: matter.ScopeMatter, WorkspaceID: header.WorkspaceID, MatterID: &matterID, UserID: target, Role: string(existing.Role), Status: matter.StatusRevoked, Revision: newRev, RecordedAt: tCmd}
		}
		return tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
			EventID: s.ids.NewRecordID(), OccurredAt: tCmd, Actor: actor,
			Operation: operation, Outcome: "OK",
			RequestedResourceKind: "MATTER", RequestedIDHash: matter.HashID(matterID.String()),
		})
	})
	if err != nil {
		return matter.MembershipChangeResult{}, fmt.Errorf("%s: %w", operation, err)
	}
	if outcome != nil {
		return matter.MembershipChangeResult{}, outcome
	}
	return result, nil
}

// HistoryRead returns one authorized, append-only history page. Any ACTIVE matter
// member may read; restricted security-audit rows are never part of domain history.
func (s *WorkspaceService) HistoryRead(ctx context.Context, q port.HistoryReadQuery) (matter.EventPage, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.EventPage{}, err
	}
	matterID, err := matter.NewMatterID(q.MatterID)
	if err != nil {
		return matter.EventPage{}, err
	}
	var page matter.EventPage
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		header, headerErr := snap.MatterHeader(ctx, matterID)
		if headerErr != nil {
			return headerErr
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := snap.MatterMembership(ctx, matterID, actor)
		access, err := accessFrom(ws, wsErr, mm, mmErr)
		if err != nil {
			return err
		}
		if d := policy.DecideReadRequirement(access); !d.Allowed {
			return port.ErrNotFound
		}
		read, ok := snap.(port.MatterReadSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support W1 reads")
		}
		page, err = read.EventsPage(ctx, matterID, q.Cursor, q.Limit)
		return err
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return matter.EventPage{}, port.ErrNotFound
		}
		return matter.EventPage{}, fmt.Errorf("history read: %w", err)
	}
	return page, nil
}

// OwnReceipt returns the caller's own stored command outcome. Authorization covers
// the saved workspace and every represented matter (BE01-F01 rule); anything less is
// the uniform not-found denial.
func (s *WorkspaceService) OwnReceipt(ctx context.Context, q port.OwnReceiptQuery) (matter.Receipt, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.Receipt{}, err
	}
	key, err := matter.NewIdempotencyKey(q.IdempotencyKey)
	if err != nil {
		return matter.Receipt{}, err
	}
	var rcpt matter.Receipt
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		read, ok := snap.(port.MatterReadSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support W1 reads")
		}
		rc, rcErr := read.ReceiptFor(ctx, actor, key)
		if rcErr != nil {
			return rcErr
		}
		wm, wmErr := snap.WorkspaceMembership(ctx, rc.WorkspaceID, actor)
		if wmErr != nil {
			if errors.Is(wmErr, port.ErrNotFound) {
				return port.ErrNotFound
			}
			return wmErr
		}
		if wm.Status != matter.StatusActive {
			return port.ErrNotFound
		}
		for _, m := range rc.Matters {
			mm, mmErr := snap.MatterMembership(ctx, m, actor)
			if mmErr != nil {
				if errors.Is(mmErr, port.ErrNotFound) {
					return port.ErrNotFound
				}
				return mmErr
			}
			if mm.Status != matter.StatusActive {
				return port.ErrNotFound
			}
		}
		rcpt = rc
		return nil
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return matter.Receipt{}, port.ErrNotFound
		}
		return matter.Receipt{}, fmt.Errorf("own receipt lookup: %w", err)
	}
	return rcpt, nil
}

// GetMatter reads one matter through a snapshot. Active workspace AND active matter
// membership are both required; anything else is the uniform not-found denial.
func (s *WorkspaceService) GetMatter(ctx context.Context, q port.GetMatterQuery) (matter.MatterRead, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.MatterRead{}, err
	}
	matterID, err := matter.NewMatterID(q.MatterID)
	if err != nil {
		return matter.MatterRead{}, err
	}
	var out matter.MatterRead
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		header, headerErr := snap.MatterHeader(ctx, matterID)
		if headerErr != nil {
			return headerErr
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := snap.MatterMembership(ctx, matterID, actor)
		access, err := accessFrom(ws, wsErr, mm, mmErr)
		if err != nil {
			return err
		}
		if d := policy.DecideReadRequirement(access); !d.Allowed {
			return port.ErrNotFound
		}
		out = matter.MatterRead{Header: header, CallerRole: mm.Role, AsOf: snap.AsOf()}
		return nil
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return matter.MatterRead{}, port.ErrNotFound
		}
		return matter.MatterRead{}, fmt.Errorf("get matter: %w", err)
	}
	return out, nil
}

// ListWorkspaceMembers lists ACTIVE workspace members for a Workspace OWNER.
func (s *WorkspaceService) ListWorkspaceMembers(ctx context.Context, q port.ListMembersQuery) ([]matter.Member, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return nil, err
	}
	wsID, err := matter.NewWorkspaceID(q.ScopeID)
	if err != nil {
		return nil, err
	}
	var members []matter.Member
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		wm, wmErr := snap.WorkspaceMembership(ctx, wsID, actor)
		if wmErr != nil && !errors.Is(wmErr, port.ErrNotFound) {
			return fmt.Errorf("workspace membership: %w", wmErr)
		}
		wa := policy.WorkspaceAccess{}
		if wmErr == nil && wm.Status == matter.StatusActive {
			wa.WorkspaceFound = true
			wa.WorkspaceRole = wm.Role
		}
		if d := policy.DecideWorkspaceAdmin(wa); !d.Allowed {
			if d.Hidden {
				return port.ErrNotFound
			}
			return port.ErrForbidden
		}
		read, ok := snap.(port.MatterReadSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support W1 reads")
		}
		members, err = read.WorkspaceMembers(ctx, wsID)
		return err
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) || errors.Is(err, port.ErrForbidden) {
			return nil, err
		}
		return nil, fmt.Errorf("list workspace members: %w", err)
	}
	return members, nil
}

// ListMatterMembers lists ACTIVE matter members for any ACTIVE matter member.
func (s *WorkspaceService) ListMatterMembers(ctx context.Context, q port.ListMembersQuery) ([]matter.Member, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return nil, err
	}
	matterID, err := matter.NewMatterID(q.ScopeID)
	if err != nil {
		return nil, err
	}
	var members []matter.Member
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		header, headerErr := snap.MatterHeader(ctx, matterID)
		if headerErr != nil {
			return headerErr
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := snap.MatterMembership(ctx, matterID, actor)
		access, err := accessFrom(ws, wsErr, mm, mmErr)
		if err != nil {
			return err
		}
		if d := policy.DecideReadRequirement(access); !d.Allowed {
			return port.ErrNotFound
		}
		read, ok := snap.(port.MatterReadSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support W1 reads")
		}
		members, err = read.MatterMembers(ctx, matterID)
		return err
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return nil, port.ErrNotFound
		}
		return nil, fmt.Errorf("list matter members: %w", err)
	}
	return members, nil
}

// ListMyWorkspaces returns the caller's own ACTIVE workspace memberships.
func (s *WorkspaceService) ListMyWorkspaces(ctx context.Context, q port.ListMyWorkspacesQuery) (matter.AccessibleWorkspacePage, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.AccessibleWorkspacePage{}, err
	}
	var page matter.AccessibleWorkspacePage
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		read, ok := snap.(port.MatterReadSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support W1 reads")
		}
		page, err = read.MyWorkspaces(ctx, actor, q.Cursor, q.Limit)
		return err
	})
	if err != nil {
		return matter.AccessibleWorkspacePage{}, fmt.Errorf("list my workspaces: %w", err)
	}
	return page, nil
}
