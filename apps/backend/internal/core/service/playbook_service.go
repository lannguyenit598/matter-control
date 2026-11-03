package service

// RLF-05: versioned playbooks. A Workspace OWNER authors and publishes immutable revisions; a
// Matter OWNER previews and applies one exact revision inside an authorized Matter of the SAME
// workspace. Applying neither grants membership nor completes or verifies any work — it only
// creates the template's records with their provenance. Publication provenance is kept, never
// treated as evidence.

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

type Playbooks struct {
	store  port.WorkspaceStore
	w      *WorkService
	ids    port.RecordIDGenerator
	keyAge matter.KeyAgePolicy
}

func NewPlaybookService(store port.WorkspaceStore, w *WorkService, ids port.RecordIDGenerator) *Playbooks {
	return &Playbooks{store: store, w: w, ids: ids}
}

func playbookSnap(snap port.MatterSnapshot) (port.PlaybookSnapshot, error) {
	s, ok := snap.(port.PlaybookSnapshot)
	if !ok {
		return nil, fmt.Errorf("snapshot does not support playbooks")
	}
	return s, nil
}

func workspacePlaybookTx(tx port.WorkspaceTx) (port.WorkspacePlaybookTx, error) {
	t, ok := tx.(port.WorkspacePlaybookTx)
	if !ok {
		return nil, fmt.Errorf("workspace transaction does not support playbooks")
	}
	return t, nil
}

func matterPlaybookTx(env *workEnv) (port.MatterPlaybookTx, error) {
	t, ok := env.tx.(port.MatterPlaybookTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support playbooks")
	}
	return t, nil
}

// ListPlaybooks lists the playbooks of one workspace for an ACTIVE member; a non-member gets
// the uniform 404.
func (s *Playbooks) ListPlaybooks(ctx context.Context, q port.ListPlaybooksQuery) ([]matter.Playbook, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return nil, err
	}
	wsID, err := matter.NewWorkspaceID(q.WorkspaceID)
	if err != nil {
		return nil, err
	}
	var out []matter.Playbook
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		header, err := snap.WorkspaceByID(ctx, wsID)
		if err != nil {
			return port.ErrNotFound
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, wsID, actor)
		wa := policy.WorkspaceAccess{}
		if wsErr == nil && ws.Status == matter.StatusActive {
			wa.WorkspaceFound, wa.WorkspaceRole = true, ws.Role
		}
		if d := policy.DecideWorkspaceRead(wa); !d.Allowed {
			return port.ErrNotFound
		}
		ps, err := playbookSnap(snap)
		if err != nil {
			return err
		}
		out, err = ps.ListPlaybooks(ctx, header.ID)
		return err
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return nil, port.ErrNotFound
		}
		return nil, fmt.Errorf("list playbooks: %w", err)
	}
	return out, nil
}

// CreatePlaybook creates the container. Workspace OWNER only, receipted (§2.1), CAS on the
// workspace revision like every other workspace-scoped creation.
func (s *Playbooks) CreatePlaybook(ctx context.Context, cmd port.CreatePlaybookCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	wsID, err := matter.NewWorkspaceID(cmd.WorkspaceID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	name, err := playbookName(cmd.Name)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	var out matter.CreatedResult
	err = s.store.ExecuteWorkspace(ctx, wsID, func(tx port.WorkspaceTx) error {
		header := tx.Workspace()
		wCmd := tx.WCmd()
		wm, wmErr := tx.WorkspaceMembershipOf(ctx, actor)
		wa := policy.WorkspaceAccess{}
		if wmErr == nil && wm.Status == matter.StatusActive {
			wa.WorkspaceFound, wa.WorkspaceRole = true, wm.Role
		}
		// Replay first (§2.1): the stored outcome replays byte-stably.
		rcpt, rcptErr := tx.Receipt(ctx, actor, key)
		if rcptErr != nil && !errors.Is(rcptErr, port.ErrNotFound) {
			return rcptErr
		}
		if rcptErr == nil {
			if d := policy.DecideWorkspaceRead(wa); !d.Allowed {
				return port.ErrNotFound
			}
			if rcpt.Kind != matter.SnapshotCreated || rcpt.CreatedSnapshot == nil || rcpt.ScopeKind != matter.ScopeWorkspace {
				return matter.ErrSnapshotKind
			}
			if rcpt.RequestHash != hash {
				return port.ErrIdempotencyKeyReuse
			}
			if err := s.keyAge.Check(key, wCmd); err != nil {
				return err
			}
			stored := *rcpt.CreatedSnapshot
			stored.Replayed = true
			out = stored
			return nil
		}
		if d := policy.DecideWorkspaceAdmin(wa); !d.Allowed {
			if d.Hidden {
				return port.ErrNotFound
			}
			return port.ErrForbidden
		}
		if err := workspaceHeaderRevisionCAS(header, cmd.ExpectedRevision); err != nil {
			return err
		}
		if err := s.keyAge.Check(key, wCmd); err != nil {
			return err
		}
		tx2, err := workspacePlaybookTx(tx)
		if err != nil {
			return err
		}
		if existing, lerr := tx2.ListPlaybooks(ctx, wsID); lerr == nil {
			for _, pb := range existing {
				if pb.Name == name {
					return rejected("duplicate-playbook-name", "a playbook with this name already exists in this workspace")
				}
			}
		} else if lerr != nil {
			return lerr
		}
		p := matter.Playbook{
			ID: matter.PlaybookID(s.ids.NewRecordID()), WorkspaceID: wsID, Name: name,
			CreatedBy: actor, CreatedAt: wCmd, Revision: 1,
		}
		if err := tx2.InsertPlaybook(ctx, p); err != nil {
			return err
		}
		out = matter.CreatedResult{Kind: "PLAYBOOK", ID: p.ID.String(), Seq: 0, RecordedAt: wCmd}
		if err := tx.StoreReceipt(ctx, matter.Receipt{
			ActorID: actor, IdempotencyKey: key, RequestHash: hash, ScopeKind: matter.ScopeWorkspace,
			WorkspaceID: wsID, StatusCode: 201, CommittedAt: wCmd, Kind: matter.SnapshotCreated, CreatedSnapshot: &out,
		}); err != nil {
			return err
		}
		return tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
			ClientIP: port.RequestMetaFromContext(ctx).ClientIP, RequestID: port.RequestMetaFromContext(ctx).RequestID,
			EventID: s.ids.NewRecordID(), OccurredAt: wCmd, Actor: actor,
			Operation: "CREATE_PLAYBOOK", Outcome: "OK",
			RequestedResourceKind: "WORKSPACE", RequestedIDHash: matter.HashID(wsID.String()),
		})
	})
	if err != nil {
		return matter.CreatedResult{}, fmt.Errorf("create playbook: %w", err)
	}
	return out, nil
}

// PublishPlaybookRevision appends ONE immutable revision. The entries are validated before
// anything is written; a published revision is never mutated and old instantiations keep
// reading their exact bytes.
func (s *Playbooks) PublishPlaybookRevision(ctx context.Context, cmd port.PublishPlaybookRevisionCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	wsID, err := matter.NewWorkspaceID(cmd.WorkspaceID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	pbID, err := matter.NewPlaybookID(cmd.PlaybookID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	if err := matter.ValidatePlaybookEntries(cmd.Entries); err != nil {
		ve := &domain.ValidationError{}
		ve.Add("entries", err.Error())
		return matter.CreatedResult{}, ve
	}
	entries, err := json.Marshal(cmd.Entries)
	if err != nil {
		return matter.CreatedResult{}, fmt.Errorf("playbook entries: %w", err)
	}
	var out matter.CreatedResult
	err = s.store.ExecuteWorkspace(ctx, wsID, func(tx port.WorkspaceTx) error {
		header := tx.Workspace()
		wCmd := tx.WCmd()
		wm, wmErr := tx.WorkspaceMembershipOf(ctx, actor)
		wa := policy.WorkspaceAccess{}
		if wmErr == nil && wm.Status == matter.StatusActive {
			wa.WorkspaceFound, wa.WorkspaceRole = true, wm.Role
		}
		rcpt, rcptErr := tx.Receipt(ctx, actor, key)
		if rcptErr != nil && !errors.Is(rcptErr, port.ErrNotFound) {
			return rcptErr
		}
		if rcptErr == nil {
			if d := policy.DecideWorkspaceRead(wa); !d.Allowed {
				return port.ErrNotFound
			}
			if rcpt.Kind != matter.SnapshotCreated || rcpt.CreatedSnapshot == nil || rcpt.ScopeKind != matter.ScopeWorkspace {
				return matter.ErrSnapshotKind
			}
			if rcpt.RequestHash != hash {
				return port.ErrIdempotencyKeyReuse
			}
			if err := s.keyAge.Check(key, wCmd); err != nil {
				return err
			}
			stored := *rcpt.CreatedSnapshot
			stored.Replayed = true
			out = stored
			return nil
		}
		if d := policy.DecideWorkspaceAdmin(wa); !d.Allowed {
			if d.Hidden {
				return port.ErrNotFound
			}
			return port.ErrForbidden
		}
		if err := workspaceHeaderRevisionCAS(header, cmd.ExpectedRevision); err != nil {
			return err
		}
		if err := s.keyAge.Check(key, wCmd); err != nil {
			return err
		}
		tx2, err := workspacePlaybookTx(tx)
		if err != nil {
			return err
		}
		p, err := tx2.LoadPlaybook(ctx, pbID)
		if err != nil {
			return err
		}
		if p.WorkspaceID != wsID {
			return port.ErrNotFound
		}
		no, err := tx2.MaxPlaybookRevisionNo(ctx, pbID)
		if err != nil {
			return err
		}
		rev := matter.PlaybookRevision{
			ID: matter.PlaybookRevisionID(s.ids.NewRecordID()), PlaybookID: pbID, No: no + 1,
			Entries: cmd.Entries, CreatedBy: actor, CreatedAt: wCmd,
		}
		if err := tx2.InsertPlaybookRevision(ctx, rev, entries); err != nil {
			return err
		}
		out = matter.CreatedResult{Kind: "PLAYBOOK_REVISION", ID: rev.ID.String(), Seq: 0, RecordedAt: wCmd}
		if err := tx.StoreReceipt(ctx, matter.Receipt{
			ActorID: actor, IdempotencyKey: key, RequestHash: hash, ScopeKind: matter.ScopeWorkspace,
			WorkspaceID: wsID, StatusCode: 201, CommittedAt: wCmd, Kind: matter.SnapshotCreated, CreatedSnapshot: &out,
		}); err != nil {
			return err
		}
		return tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
			ClientIP: port.RequestMetaFromContext(ctx).ClientIP, RequestID: port.RequestMetaFromContext(ctx).RequestID,
			EventID: s.ids.NewRecordID(), OccurredAt: wCmd, Actor: actor,
			Operation: "PUBLISH_PLAYBOOK_REVISION", Outcome: "OK",
			RequestedResourceKind: "WORKSPACE", RequestedIDHash: matter.HashID(wsID.String()),
		})
	})
	if err != nil {
		return matter.CreatedResult{}, fmt.Errorf("publish playbook revision: %w", err)
	}
	return out, nil
}

// GetPlaybook reads one playbook with its revisions for an ACTIVE workspace member.
func (s *Playbooks) GetPlaybook(ctx context.Context, q port.GetPlaybookQuery) (matter.Playbook, []matter.PlaybookRevision, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.Playbook{}, nil, err
	}
	pbID, err := matter.NewPlaybookID(q.PlaybookID)
	if err != nil {
		return matter.Playbook{}, nil, err
	}
	var p matter.Playbook
	var revs []matter.PlaybookRevision
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		ps, err := playbookSnap(snap)
		if err != nil {
			return err
		}
		p, err = ps.LoadPlaybook(ctx, pbID)
		if err != nil {
			return err
		}
		ws, wsErr := snap.WorkspaceMembership(ctx, p.WorkspaceID, actor)
		wa := policy.WorkspaceAccess{}
		if wsErr == nil && ws.Status == matter.StatusActive {
			wa.WorkspaceFound, wa.WorkspaceRole = true, ws.Role
		}
		if d := policy.DecideWorkspaceRead(wa); !d.Allowed {
			return port.ErrNotFound
		}
		revs, err = ps.ListPlaybookRevisions(ctx, []matter.PlaybookID{pbID})
		return err
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return matter.Playbook{}, nil, port.ErrNotFound
		}
		return matter.Playbook{}, nil, fmt.Errorf("get playbook: %w", err)
	}
	return p, revs, nil
}

// PreviewPlaybookApplication builds the read-only view a Matter OWNER sees before applying:
// the exact names, kinds, owner mappings and dependency graph of one revision, plus the
// problems apply would refuse. It stores nothing and changes nothing.
func (s *Playbooks) PreviewPlaybookApplication(ctx context.Context, q port.PreviewPlaybookApplicationQuery) (matter.PlaybookApplicationView, error) {
	revID, err := matter.NewPlaybookRevisionID(q.RevisionID)
	if err != nil {
		return matter.PlaybookApplicationView{}, err
	}
	var out matter.PlaybookApplicationView
	err = s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, _ int64) error {
		ps, err := playbookSnap(snap)
		if err != nil {
			return err
		}
		rev, err := ps.LoadPlaybookRevision(ctx, revID)
		if err != nil {
			return err
		}
		p, err := ps.LoadPlaybook(ctx, rev.PlaybookID)
		if err != nil {
			return err
		}
		header, err := snap.MatterHeader(ctx, matter.MatterID(q.MatterID))
		if err != nil {
			return err
		}
		out.Playbook, out.Revision = p, rev
		// The source workspace must be the matter's own workspace: no cross-workspace sharing.
		if p.WorkspaceID != header.WorkspaceID {
			out.Problems = append(out.Problems, "the playbook belongs to another workspace")
			return nil
		}
		// The preview resolves nothing by itself: an entry whose ownerKey is set needs an
		// explicit person chosen at apply, validated against ACTIVE matter membership then.
		out.OwnerNames = map[string]string{}
		for _, e := range rev.Entries {
			if e.OwnerKey != "" {
				out.OwnerNames[e.Key] = ""
			}
		}
		return nil
	})
	if err != nil {
		return matter.PlaybookApplicationView{}, fmt.Errorf("preview playbook application: %w", err)
	}
	return out, nil
}

// ApplyPlaybook instantiates one exact revision inside one Matter: atomic, receipted, and
// idempotent. Same key → the stored outcome replays; the same revision under a different key →
// `playbook-already-applied`. The Matter OWNER mapping is explicit and every mapped person is
// revalidated as an ACTIVE matter member at commit.
func (s *Playbooks) ApplyPlaybook(ctx context.Context, cmd port.ApplyPlaybookCmd) (port.AppliedPlaybook, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return port.AppliedPlaybook{}, err
	}
	revID, err := matter.NewPlaybookRevisionID(cmd.RevisionID)
	if err != nil {
		return port.AppliedPlaybook{}, err
	}
	var out port.AppliedPlaybook
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "APPLY_PLAYBOOK", policy.DecideMatterAdmin, func(env *workEnv) error {
		tx, err := matterPlaybookTx(env)
		if err != nil {
			return err
		}
		// Replay first (§2.1): a stored outcome replays byte-stably; the caller re-reads the
		// created items through their own authorized reads.
		rcpt, rcptErr := env.tx.Receipt(ctx, actor, key)
		if rcptErr != nil && !errors.Is(rcptErr, port.ErrNotFound) {
			return rcptErr
		}
		if rcptErr == nil {
			if err := authorizeReceiptScope(ctx, env.tx, actor, rcpt); err != nil {
				env.replayHidden = errors.Is(err, port.ErrNotFound)
				return err
			}
			if rcpt.ScopeKind != matter.ScopeMatter || rcpt.WorkspaceID != env.header.WorkspaceID ||
				rcpt.MatterID == nil || *rcpt.MatterID != env.header.MatterID {
				return port.ErrIdempotencyKeyReuse
			}
			if rcpt.Kind != matter.SnapshotCreated || rcpt.CreatedSnapshot == nil {
				return matter.ErrSnapshotKind
			}
			if rcpt.RequestHash != hash {
				return port.ErrIdempotencyKeyReuse
			}
			stored := *rcpt.CreatedSnapshot
			stored.Replayed = true
			// The receipt snapshot names the exact revision it instantiated; the created
			// items are re-read through the caller's own authorized reads.
			storedRev, perr := matter.NewPlaybookRevisionID(stored.ID)
			if perr != nil {
				return matter.ErrSnapshotKind
			}
			out = port.AppliedPlaybook{RevisionID: storedRev, Replayed: true}
			return nil
		}
		if err := s.keyAge.Check(key, env.tCmd); err != nil {
			return err
		}
		rev, err := tx.LoadPlaybookRevision(ctx, revID)
		if err != nil {
			return err
		}
		pb, err := tx.LoadPlaybook(ctx, rev.PlaybookID)
		if err != nil {
			return err
		}
		// The source workspace must be the matter's own workspace; a foreign template is the
		// uniform 404, never a partial application.
		if pb.WorkspaceID != env.header.WorkspaceID {
			return port.ErrNotFound
		}
		// Duplicate prevention: this exact revision was already applied to this matter.
		existing, err := tx.ListPlaybookInstancesOfMatter(ctx, env.header.MatterID)
		if err != nil {
			return err
		}
		for _, i := range existing {
			if i.RevisionID == revID {
				return rejected("playbook-already-applied", "this exact playbook revision was already applied to this matter")
			}
		}
		// Resolve the explicit owner mapping against ACTIVE matter membership; every entry
		// that declares an ownerKey must be mapped.
		byKey := map[string]matter.PlaybookEntry{}
		for _, e := range rev.Entries {
			byKey[e.Key] = e
		}
		owners := map[string]matter.ActorID{}
		for entryKey, userID := range cmd.OwnerMap {
			e, ok := byKey[entryKey]
			if !ok || e.OwnerKey == "" {
				return rejected("unknown-playbook-entry", "the owner mapping names an entry that takes no owner")
			}
			uid, uerr := matter.NewActorID(userID)
			if uerr != nil {
				return rejected("invalid-playbook-owner", "the owner mapping names an invalid user")
			}
			mm, merr := env.tx.MatterMembership(ctx, env.header.MatterID, uid)
			if merr != nil || mm.Status != matter.StatusActive {
				return rejected("invalid-playbook-owner", "the mapped owner is not an active member of this matter")
			}
			owners[entryKey] = uid
		}
		for _, e := range rev.Entries {
			if e.OwnerKey != "" {
				if _, ok := cmd.OwnerMap[e.Key]; !ok {
					return rejected("owner-mapping-required", "every entry with an owner must be mapped before applying")
				}
			}
		}
		// Create the items. Requirements follow the W1 event path so history replay keeps
		// working; actions follow the W2 path.
		itemIDs := map[string]matter.NodeID{}
		for _, e := range rev.Entries {
			nodeID, err := matter.NewNodeID(s.ids.NewRecordID())
			if err != nil {
				return err
			}
			itemIDs[e.Key] = nodeID
			due := time.Time{}
			var duePtr *time.Time
			if e.DueDaysOffset > 0 {
				due = env.tCmd.AddDate(0, 0, e.DueDaysOffset)
				duePtr = &due
			}
			owner := owners[e.Key]
			switch e.Kind {
			case "REQUIREMENT":
				req, err := matter.NewRequirement(matter.RequirementID(nodeID), env.header.MatterID, e.Title, e.Outcome)
				if err != nil {
					return err
				}
				if owner != "" {
					req.OwnerActorID = &owner
				}
				req.DueAt = duePtr
				env.seq++
				if err := env.tx.InsertNode(ctx, matter.Node{ID: nodeID, MatterID: env.header.MatterID, Kind: matter.NodeRequirement}); err != nil {
					return err
				}
				if err := env.tx.InsertRequirement(ctx, req); err != nil {
					return err
				}
				if err := env.tx.AppendRequirementCreated(ctx, matter.RequirementCreatedEvent{
					EventID: s.ids.NewRecordID(), MatterID: env.header.MatterID, TargetID: matter.RequirementID(nodeID),
					Actor: env.actor, IdempotencyKey: key, Seq: env.seq, EffectiveAt: env.tCmd, RecordedAt: env.tCmd, Requirement: req,
				}); err != nil {
					return err
				}
				if err := tx.InsertPlaybookInstance(ctx, matter.PlaybookInstance{
					MatterID: env.header.MatterID, RevisionID: revID, PlaybookID: pb.ID, EntryKey: e.Key,
					ItemID: nodeID, AppliedBy: env.actor, AppliedAt: env.tCmd,
				}); err != nil {
					return err
				}
			case "ACTION":
				item, err := matter.NewAction(nodeID, env.header.MatterID, e.Title, e.Outcome)
				if err != nil {
					return err
				}
				if owner != "" {
					item.OwnerActorID = &owner
				}
				item.DueAt = duePtr
				if err := env.g.InsertAction(ctx, item); err != nil {
					return err
				}
				if _, err := env.emit(ctx, "action.created", "ACTION", item.ID.String(), "", nil, itemSnapshot(item), nil); err != nil {
					return err
				}
				if err := tx.InsertPlaybookInstance(ctx, matter.PlaybookInstance{
					MatterID: env.header.MatterID, RevisionID: revID, PlaybookID: pb.ID, EntryKey: e.Key,
					ItemID: nodeID, AppliedBy: env.actor, AppliedAt: env.tCmd,
				}); err != nil {
					return err
				}
			}
		}
		// Edges: template dependencies become COMPLETION-gate edges, validated against the
		// graph that now contains every created item, then derived state recomputed once.
		stored, g, err := s.w.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		updated := cloneGraph(g)
		var lastSeq int64
		for _, e := range rev.Entries {
			for _, d := range e.DependsOn {
				source, target := itemIDs[d], itemIDs[e.Key]
				if err := matter.ValidateNewEdge(updated.Items, updated.Edges, source, target, matter.GateCompletion); err != nil {
					return err
				}
				edge := matter.Edge{ID: s.ids.NewRecordID(), MatterID: env.header.MatterID, Source: source, Target: target, Gate: matter.GateCompletion}
				if err := env.g.InsertEdge(ctx, edge); err != nil {
					return err
				}
				seq, err := env.emit(ctx, "dependency.added", "DEPENDENCY", edge.ID,
					"from playbook "+pb.Name+" revision "+fmt.Sprint(rev.No), nil,
					map[string]any{"source": source.String(), "target": target.String(), "gate": string(matter.GateCompletion)}, nil)
				if err != nil {
					return err
				}
				lastSeq = seq
				updated.Edges = append(updated.Edges, edge)
			}
		}
		applyDerived(&updated, env.tCmd)
		if err := s.w.persist(ctx, env, stored, updated, "", lastSeq); err != nil {
			return err
		}
		out = port.AppliedPlaybook{PlaybookID: pb.ID, RevisionID: revID, RevisionNo: rev.No}
		out.Instances = nil // the caller re-reads provenance through their own authorized reads
		// The receipt snapshot names the exact revision it instantiated (a UUID), so the same
		// key always replays to the same answer; the created items are re-read through the
		// caller's own authorized reads (playbook-instances + work items).
		created := matter.CreatedResult{Kind: "PLAYBOOK_APPLICATION", ID: revID.String(), Seq: lastSeq, RecordedAt: env.tCmd}
		return env.tx.StoreReceipt(ctx, matter.Receipt{
			ActorID: actor, IdempotencyKey: key, RequestHash: hash, ScopeKind: matter.ScopeMatter,
			WorkspaceID: env.header.WorkspaceID, MatterID: &env.header.MatterID, StatusCode: 201,
			CommittedAt: env.tCmd, Matters: []matter.MatterID{env.header.MatterID}, Kind: matter.SnapshotCreated, CreatedSnapshot: &created,
		})
	})
	if err != nil {
		return port.AppliedPlaybook{}, err
	}
	return out, nil
}

func playbookName(name string) (string, error) {
	n := strings.TrimSpace(name)
	if len(n) < 1 || len(n) > 100 {
		ve := &domain.ValidationError{}
		ve.Add("name", "a playbook name must be 1..100 characters")
		return "", ve
	}
	return n, nil
}

// ListMatterPlaybookInstances reads the provenance of every playbook application in one matter
// for an ACTIVE member: which exact revision produced which work item.
func (s *Playbooks) ListMatterPlaybookInstances(ctx context.Context, q port.ListPlaybookInstancesQuery) ([]matter.PlaybookInstance, error) {
	var out []matter.PlaybookInstance
	err := s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, _ matter.WorkGraph, _ time.Time, _ int64) error {
		ps, err := playbookSnap(snap)
		if err != nil {
			return err
		}
		out, err = ps.ListPlaybookInstancesOfMatter(ctx, matter.MatterID(q.MatterID))
		return err
	})
	if err != nil {
		return nil, fmt.Errorf("list playbook instances: %w", err)
	}
	return out, nil
}
