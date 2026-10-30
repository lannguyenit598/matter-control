package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"sort"
	"strings"
	"time"

	"leonx.me/matter-control/internal/core/domain"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/policy"
	"leonx.me/matter-control/internal/core/port"
)

// WorkService implements the W2 work-graph use cases: typed Actions, metadata, the execution
// transition table, AND-gate dependencies with cycle refusal, milestones, external parties and
// the deterministic Next/My Actions/Waiting On reads. Derived dimensions (dependency, timing,
// attention, milestone readiness) are computed here from the whole graph; nothing in a
// command can set them.
type WorkService struct {
	store  port.MatterStore
	ids    port.RecordIDGenerator
	logger *slog.Logger
	keyAge matter.KeyAgePolicy
}

var _ port.WorkService = (*WorkService)(nil)

// NewWorkService builds the service over a store whose transactions support the work graph.
func NewWorkService(store port.MatterStore, ids port.RecordIDGenerator, logger *slog.Logger, keyAge matter.KeyAgePolicy) *WorkService {
	return &WorkService{store: store, ids: ids, logger: logger, keyAge: keyAge}
}

// workEnv is the locked-transaction context of one command.
type workEnv struct {
	tx     port.MatterTx
	g      port.WorkGraphTx
	header matter.MatterHeader
	tCmd   time.Time
	actor  matter.ActorID
	role   matter.MatterRole
	seq    int64
	ids    port.RecordIDGenerator
	// A saved receipt may have lost authority independently of the command target.
	replayHidden bool
}

// emit appends one history event with the next sequence number and returns it.
func (e *workEnv) emit(ctx context.Context, typ, targetKind, targetID, reason string, before, after any, cause *int64) (int64, error) {
	e.seq++
	b, err := marshalOpt(before)
	if err != nil {
		return 0, err
	}
	a, err := marshalOpt(after)
	if err != nil {
		return 0, err
	}
	return e.seq, e.g.AppendWorkEvent(ctx, matter.WorkEvent{
		MatterID: e.header.MatterID, Seq: e.seq, ID: e.ids.NewRecordID(), Type: typ,
		TargetKind: targetKind, TargetID: targetID, Actor: e.actor, Reason: reason, CauseSeq: cause,
		Before: b, After: a, EffectiveAt: e.tCmd, RecordedAt: e.tCmd,
	})
}

func marshalOpt(v any) ([]byte, error) {
	if v == nil {
		return nil, nil
	}
	b, err := json.Marshal(v)
	if err != nil {
		return nil, fmt.Errorf("marshal event payload: %w", err)
	}
	return b, nil
}

// execute runs body inside the locked matter transaction after authorization. Denials commit
// the restricted audit row and surface uniformly; a domain rejection or an error rolls the
// whole command back (no successful event, no partial write).
func (s *WorkService) execute(
	ctx context.Context, actorID, matterIDStr, operation string,
	decide func(policy.Access) policy.Decision,
	body func(env *workEnv) error,
) error {
	actor, err := matter.NewActorID(actorID)
	if err != nil {
		return err
	}
	matterID, err := matter.NewMatterID(matterIDStr)
	if err != nil {
		return err
	}
	var outcome error
	err = s.store.Execute(ctx, matterID, func(tx port.MatterTx) error {
		gtx, ok := tx.(port.WorkGraphTx)
		if !ok {
			return fmt.Errorf("matter transaction does not support the work graph")
		}
		header, tCmd := tx.Matter(), tx.TCmd()
		ws, wsErr := tx.WorkspaceMembership(ctx, header.WorkspaceID, actor)
		mm, mmErr := tx.MatterMembership(ctx, matterID, actor)
		access, err := accessFrom(ws, wsErr, mm, mmErr)
		if err != nil {
			return err
		}
		if d := decide(access); !d.Allowed {
			derr := port.ErrForbidden
			if d.Hidden {
				derr = port.ErrNotFound
			}
			outcome = s.matterDeny(ctx, tx, tCmd, actor, matterID, operation, "DENIED", derr)
			return nil
		}
		if header.BoundaryDueAt(tCmd) {
			return matter.ErrBoundaryDue
		}
		env := &workEnv{tx: tx, g: gtx, header: header, tCmd: tCmd, actor: actor, role: mm.Role, seq: header.EventSeq, ids: s.ids}
		if err := body(env); err != nil {
			if env.replayHidden && errors.Is(err, port.ErrNotFound) {
				outcome = s.matterDeny(ctx, tx, tCmd, actor, matterID, operation, "DENIED_HIDDEN", err)
				return nil
			}
			return err
		}
		if env.seq > header.EventSeq {
			if err := tx.CompleteMatter(ctx, env.seq, tCmd); err != nil {
				return err
			}
		}
		return nil
	})
	if err != nil {
		return fmt.Errorf("%s: %w", operation, err)
	}
	return outcome
}

func casCheck(item matter.WorkItem, expected int64) error {
	if expected == 0 {
		return port.ErrPreconditionRequired
	}
	if item.Revision != expected {
		return port.ErrPreconditionFailed
	}
	return nil
}

func findItem(g matter.WorkGraph, raw string) (matter.WorkItem, error) {
	id, err := matter.NewNodeID(raw)
	if err != nil {
		return matter.WorkItem{}, err
	}
	it, ok := g.Item(id)
	if !ok {
		return matter.WorkItem{}, port.ErrNotFound // uniform: absent and foreign are alike
	}
	return it, nil
}

// itemSnapshot is the command-owned event payload of the audited attributes of an item.
func itemSnapshot(it matter.WorkItem) map[string]any {
	m := map[string]any{
		"title": it.Title, "outcome": it.Outcome, "execution": string(it.Execution),
		"dependency": string(it.Dependency), "revision": it.Revision,
	}
	if it.ImportedVerificationClaim != nil {
		m["importedVerificationClaim"] = *it.ImportedVerificationClaim
	}
	m["proofRequired"], m["applicability"], m["proofEpoch"] = it.ProofRequired, string(it.Applicability), it.ProofEpoch
	if it.Verification != "" {
		m["verification"] = string(it.Verification)
	}
	put := func(k string, v any) {
		if v != nil {
			m[k] = v
		}
	}
	if it.OwnerActorID != nil {
		put("owner", it.OwnerActorID.String())
	}
	if it.DueAt != nil {
		put("due", it.DueAt.UTC().Format(time.RFC3339Nano))
	}
	if it.WorkstreamID != nil {
		put("workstream", it.WorkstreamID.String())
	}
	if it.CompletedAt != nil {
		put("completedAt", it.CompletedAt.UTC().Format(time.RFC3339Nano))
	}
	if it.WaitingPartyID != nil {
		put("waitingParty", it.WaitingPartyID.String())
		put("waitingCondition", derefString(it.WaitingCondition))
	}
	if it.EscalationReason != nil {
		put("escalation", *it.EscalationReason)
	}
	return m
}

func derefString(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func reasonsKey(rs []matter.GateReason) string {
	parts := make([]string, len(rs))
	for i, r := range rs {
		parts[i] = r.EdgeID + ":" + string(r.Code)
	}
	return strings.Join(parts, ",")
}

// applyDerived recomputes every proof-requiring item's verification and every dependency from
// the (already updated) in-memory graph at the command instant, so the stored cache catches up
// with anything time or proof changed since it was last written.
func applyDerived(g *matter.WorkGraph, asOf time.Time) {
	*g = matter.EffectiveGraph(*g, asOf)
}

// loadGraphs returns the graph as stored and the same graph evaluated at the command instant.
// Guards decide on the effective one (an acceptance that just expired must not satisfy a gate);
// persistence writes the difference back.
func (s *WorkService) loadGraphs(ctx context.Context, env *workEnv) (stored, effective matter.WorkGraph, err error) {
	stored, err = env.g.LoadGraph(ctx)
	if err != nil {
		return stored, stored, err
	}
	return stored, matter.EffectiveGraph(stored, env.tCmd), nil
}

// persist saves every item that differs from the loaded graph (CAS on the loaded revision,
// one revision bump per changed item) and emits one causal event per derived dependency
// state change. The primary item is saved with the same single write as its derived change.
func (s *WorkService) persist(ctx context.Context, env *workEnv, before, after matter.WorkGraph, primary matter.NodeID, cause int64) error {
	return persistGraph(ctx, env, before, after, primary, cause)
}

// persistGraph is persist without the service receiver, shared with the group import.
func persistGraph(ctx context.Context, env *workEnv, before, after matter.WorkGraph, primary matter.NodeID, cause int64) error {
	old := make(map[matter.NodeID]matter.WorkItem, len(before.Items))
	for _, it := range before.Items {
		old[it.ID] = it
	}
	ids := make([]matter.NodeID, 0, len(after.Items))
	for _, it := range after.Items {
		ids = append(ids, it.ID)
	}
	sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })
	for _, id := range ids {
		cur, _ := after.Item(id)
		prev := old[id]
		if sameItem(prev, cur) {
			continue
		}
		if err := env.g.SaveWorkItem(ctx, cur, prev.Revision); err != nil {
			return err
		}
		var c *int64
		if cause != 0 {
			c = &cause
		}
		if prev.Verification != cur.Verification {
			if _, err := env.emit(ctx, "work.verification_changed", string(cur.Kind), id.String(), "",
				map[string]any{"verification": string(prev.Verification)},
				map[string]any{"verification": string(cur.Verification)}, c); err != nil {
				return err
			}
		}
		if prev.Dependency != cur.Dependency {
			if _, err := env.emit(ctx, "work.dependency_changed", string(cur.Kind), id.String(), "",
				map[string]any{"dependency": string(prev.Dependency)},
				map[string]any{"dependency": string(cur.Dependency), "gates": gateStrings(cur.DependencyReasons)}, c); err != nil {
				return err
			}
		}
	}
	return nil
}

func gateStrings(rs []matter.GateReason) []string {
	out := make([]string, len(rs))
	for i, r := range rs {
		out[i] = string(r.Gate) + ":" + r.Source.String() + ":" + string(r.Code)
	}
	return out
}

func sameItem(a, b matter.WorkItem) bool {
	ja, _ := json.Marshal(itemSnapshot(a)) // skip: map of primitives always marshals
	jb, _ := json.Marshal(itemSnapshot(b))
	return string(ja) == string(jb) && reasonsKey(a.DependencyReasons) == reasonsKey(b.DependencyReasons) &&
		a.ProofEpoch == b.ProofEpoch && a.Applicability == b.Applicability
}

func cloneGraph(g matter.WorkGraph) matter.WorkGraph {
	c := g
	c.Items = append([]matter.WorkItem(nil), g.Items...)
	c.Edges = append([]matter.Edge(nil), g.Edges...)
	return c
}

func setItem(g *matter.WorkGraph, it matter.WorkItem) {
	for i := range g.Items {
		if g.Items[i].ID == it.ID {
			g.Items[i] = it
			return
		}
	}
}

func parseInstant(raw, field string) (time.Time, error) {
	t, err := time.Parse(time.RFC3339, raw)
	if err != nil {
		v := &domain.ValidationError{}
		v.Add(field, "must be an RFC 3339 instant with an explicit offset, for example 2026-06-15T09:00:00+07:00")
		return time.Time{}, v
	}
	return t.UTC(), nil
}

// ownerMustBeMember checks an assignee is an ACTIVE matter and workspace member. Assignment
// never grants access: the check refuses, it never creates a membership.
func ownerMustBeMember(ctx context.Context, env *workEnv, owner matter.ActorID) error {
	mm, err := env.tx.MatterMembership(ctx, env.header.MatterID, owner)
	if err != nil && !errors.Is(err, port.ErrNotFound) {
		return err
	}
	ws, wsErr := env.tx.WorkspaceMembership(ctx, env.header.WorkspaceID, owner)
	if wsErr != nil && !errors.Is(wsErr, port.ErrNotFound) {
		return wsErr
	}
	if err != nil || mm.Status != matter.StatusActive || wsErr != nil || ws.Status != matter.StatusActive {
		return &matter.RejectedError{Code: "owner-not-member", Message: "the assignee must be an active member of this matter"}
	}
	return nil
}

// ---------- commands ----------

// CreateAction creates an Action in its initial state: a receipted creation with an immutable
// outcome snapshot (contract §2.1).
func (s *WorkService) CreateAction(ctx context.Context, cmd port.CreateActionCmd) (matter.WorkItemCreatedResult, error) {
	actor, err := matter.NewActorID(cmd.ActorID)
	if err != nil {
		return matter.WorkItemCreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.WorkItemCreatedResult{}, err
	}
	key, err := matter.NewIdempotencyKey(cmd.IdempotencyKey)
	if err != nil {
		return matter.WorkItemCreatedResult{}, err
	}
	hash, err := matter.NewRequestHash(cmd.RequestHash)
	if err != nil {
		return matter.WorkItemCreatedResult{}, err
	}
	nodeID, err := matter.NewNodeID(s.ids.NewRecordID())
	if err != nil {
		return matter.WorkItemCreatedResult{}, fmt.Errorf("generate action id: %w", err)
	}
	item, err := matter.NewAction(nodeID, matterID, cmd.Title, cmd.Outcome)
	if err != nil {
		return matter.WorkItemCreatedResult{}, err
	}

	var result matter.WorkItemCreatedResult
	err = s.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_ACTION", policy.DecideCreateRequirement, func(env *workEnv) error {
		// Replay first: a stored outcome is returned byte-stably without a second effect.
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
				rcpt.MatterID == nil || *rcpt.MatterID != matterID {
				return port.ErrIdempotencyKeyReuse
			}
			if rcpt.Kind != matter.SnapshotActionCreate || rcpt.ItemSnapshot == nil {
				return matter.ErrSnapshotKind
			}
			if rcpt.RequestHash != hash {
				return port.ErrIdempotencyKeyReuse
			}
			stored := *rcpt.ItemSnapshot
			stored.Replayed = true
			result = stored
			return nil
		}
		if err := s.keyAge.Check(key, env.tCmd); err != nil {
			return err
		}
		if err := env.g.InsertAction(ctx, item); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "action.created", "ACTION", item.ID.String(), "", nil, itemSnapshot(item), nil)
		if err != nil {
			return err
		}
		result = matter.WorkItemCreatedResult{Item: item, Seq: seq, RecordedAt: env.tCmd}
		return env.tx.StoreReceipt(ctx, matter.Receipt{
			ActorID: actor, IdempotencyKey: key, RequestHash: hash, ScopeKind: matter.ScopeMatter,
			WorkspaceID: env.header.WorkspaceID, MatterID: &matterID, StatusCode: 201, CommittedAt: env.tCmd,
			Matters: []matter.MatterID{matterID}, Kind: matter.SnapshotActionCreate, ItemSnapshot: &result,
		})
	})
	if err != nil {
		return matter.WorkItemCreatedResult{}, err
	}
	return result, nil
}

// UpdateWorkItem edits metadata (title, outcome, owner, due date, workstream) under item
// revision CAS. Derived values have no field here.
func (s *WorkService) UpdateWorkItem(ctx context.Context, cmd port.UpdateWorkItemCmd) (matter.WorkItemView, error) {
	var view matter.WorkItemView
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "UPDATE_WORK_ITEM", policy.DecideCreateRequirement, func(env *workEnv) error {
		stored, g, err := s.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		it, err := findItem(g, cmd.ItemID)
		if err != nil {
			return err
		}
		if err := casCheck(it, cmd.ExpectedRevision); err != nil {
			return err
		}
		next := it
		if cmd.Title != nil {
			if next.Title, err = matter.NewDisplayName(*cmd.Title, "title"); err != nil {
				return err
			}
		}
		if cmd.Outcome != nil {
			if next.Outcome, err = matter.NewDisplayName(*cmd.Outcome, "outcome"); err != nil {
				return err
			}
		}
		if cmd.Owner.Set {
			next.OwnerActorID = nil
			if cmd.Owner.Value != "" {
				owner, err := matter.NewActorID(cmd.Owner.Value)
				if err != nil {
					return err
				}
				if err := ownerMustBeMember(ctx, env, owner); err != nil {
					return err
				}
				next.OwnerActorID = &owner
			} else if next.Execution == matter.ExecutionWaiting {
				return &matter.RejectedError{Code: "waiting-owner-required", Message: "a responsible internal owner is required while waiting"}
			}
		}
		if cmd.Due.Set {
			next.DueAt = nil
			if cmd.Due.Value != "" {
				at, err := parseInstant(cmd.Due.Value, "due")
				if err != nil {
					return err
				}
				next.DueAt = &at
			}
		}
		if cmd.Workstream.Set {
			next.WorkstreamID = nil
			if cmd.Workstream.Value != "" {
				ws, err := matter.NewWorkstreamID(cmd.Workstream.Value)
				if err != nil {
					return err
				}
				found := false
				for _, w := range g.Workstreams {
					found = found || w.ID == ws
				}
				if !found {
					return &matter.RejectedError{Code: "unknown-workstream", Message: "the workstream does not exist in this matter"}
				}
				next.WorkstreamID = &ws
			}
		}
		asOf := env.tCmd
		if sameItem(it, next) {
			view = matter.ViewOf(it, asOf, matter.CriticalChain(g))
			return nil // same-value retry: no mutation, no event
		}
		before, after := changedFields(it, next)
		seq, err := env.emit(ctx, "work.updated", string(it.Kind), it.ID.String(), "", before, after, nil)
		if err != nil {
			return err
		}
		updated := cloneGraph(g)
		setItem(&updated, next)
		applyDerived(&updated, env.tCmd)
		if err := s.persist(ctx, env, stored, updated, it.ID, seq); err != nil {
			return err
		}
		saved, _ := updated.Item(it.ID)
		saved.Revision = it.Revision + 1
		view = matter.ViewOf(saved, asOf, matter.CriticalChain(updated))
		return nil
	})
	if err != nil {
		return matter.WorkItemView{}, err
	}
	return view, nil
}

func changedFields(a, b matter.WorkItem) (before, after map[string]any) {
	sa, sb := itemSnapshot(a), itemSnapshot(b)
	before, after = map[string]any{}, map[string]any{}
	for _, k := range []string{"title", "outcome", "owner", "due", "workstream"} {
		if fmt.Sprint(sa[k]) != fmt.Sprint(sb[k]) {
			before[k], after[k] = sa[k], sb[k]
		}
	}
	return before, after
}

// TransitionExecution applies the approved execution transition table under item CAS.
func (s *WorkService) TransitionExecution(ctx context.Context, cmd port.TransitionExecutionCmd) (matter.WorkItemView, error) {
	to := matter.ExecutionState(strings.TrimSpace(cmd.To))
	var view matter.WorkItemView
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "TRANSITION_EXECUTION", policy.DecideCreateRequirement, func(env *workEnv) error {
		stored, g, err := s.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		it, err := findItem(g, cmd.ItemID)
		if err != nil {
			return err
		}
		if err := casCheck(it, cmd.ExpectedRevision); err != nil {
			return err
		}
		if _, isFiling := g.Filing.Of(it.ID); isFiling {
			// A filing's execution follows its stage; moving it here would contradict the record.
			return &matter.RejectedError{Code: "managed-by-filing", Message: "this record is a regulatory filing: its status changes with its stage"}
		}
		req := matter.TransitionRequest{Item: it, To: to, Role: env.role, Reason: cmd.Reason, WaitingCondition: cmd.WaitingCondition, AsOf: env.tCmd}
		if cmd.WaitingPartyID != "" {
			pid := matter.PartyID(cmd.WaitingPartyID)
			known := false
			for _, p := range g.Parties {
				known = known || p.ID == pid
			}
			if !known {
				return &matter.RejectedError{Code: "unknown-party", Message: "the waiting party does not exist in this matter"}
			}
			req.WaitingPartyID = &pid
		}
		if cmd.CompletedAt != "" {
			at, err := parseInstant(cmd.CompletedAt, "completedAt")
			if err != nil {
				return err
			}
			req.CompletedAt = &at
		}
		res, err := matter.DecideTransition(req)
		if errors.Is(err, matter.ErrTransitionForbidden) {
			return port.ErrForbidden
		}
		if err != nil {
			return err
		}
		chain := matter.CriticalChain(g)
		if res.NoOp {
			view = matter.ViewOf(it, env.tCmd, chain)
			return nil // same-state retry: no mutation, no duplicate event
		}
		seq, err := env.emit(ctx, "work.execution_changed", string(it.Kind), it.ID.String(), strings.TrimSpace(cmd.Reason),
			itemSnapshot(it), itemSnapshot(res.Item), nil)
		if err != nil {
			return err
		}
		updated := cloneGraph(g)
		setItem(&updated, res.Item)
		applyDerived(&updated, env.tCmd)
		if err := s.persist(ctx, env, stored, updated, it.ID, seq); err != nil {
			return err
		}
		saved, _ := updated.Item(it.ID)
		saved.Revision = it.Revision + 1
		view = matter.ViewOf(saved, env.tCmd, matter.CriticalChain(updated))
		return nil
	})
	if err != nil {
		return matter.WorkItemView{}, err
	}
	return view, nil
}

// Escalate sets or clears an explicit CRITICAL escalation (OWNER only, reason mandatory).
func (s *WorkService) Escalate(ctx context.Context, cmd port.EscalateCmd) (matter.WorkItemView, error) {
	var view matter.WorkItemView
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "ESCALATE_WORK_ITEM", policy.DecideMatterAdmin, func(env *workEnv) error {
		stored, g, err := s.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		it, err := findItem(g, cmd.ItemID)
		if err != nil {
			return err
		}
		if err := casCheck(it, cmd.ExpectedRevision); err != nil {
			return err
		}
		reason := strings.TrimSpace(cmd.Reason)
		next := it
		next.EscalationReason = nil
		if reason != "" {
			next.EscalationReason = &reason
		}
		chain := matter.CriticalChain(g)
		if derefString(it.EscalationReason) == derefString(next.EscalationReason) {
			view = matter.ViewOf(it, env.tCmd, chain)
			return nil
		}
		typ := "work.escalated"
		if reason == "" {
			typ = "work.escalation_cleared"
		}
		seq, err := env.emit(ctx, typ, string(it.Kind), it.ID.String(), reason,
			map[string]any{"escalation": derefString(it.EscalationReason)}, map[string]any{"escalation": reason}, nil)
		if err != nil {
			return err
		}
		updated := cloneGraph(g)
		setItem(&updated, next)
		if err := s.persist(ctx, env, stored, updated, it.ID, seq); err != nil {
			return err
		}
		next.Revision = it.Revision + 1
		view = matter.ViewOf(next, env.tCmd, chain)
		return nil
	})
	if err != nil {
		return matter.WorkItemView{}, err
	}
	return view, nil
}

// AddDependency adds a prerequisite edge after refusing self-edges, duplicates, cross-matter
// links and cycles; the target's dependency and everything reachable is recomputed in the
// same transaction. The matter row lock serializes concurrent edge changes, so two edges
// that would together close a cycle cannot both commit.
func (s *WorkService) AddDependency(ctx context.Context, cmd port.AddDependencyCmd) (matter.WorkItemDetail, error) {
	var detail matter.WorkItemDetail
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "ADD_DEPENDENCY", policy.DecideCreateRequirement, func(env *workEnv) error {
		if strings.TrimSpace(cmd.Reason) == "" {
			return &matter.RejectedError{Code: "reason-required", Message: "a reason is required to add a dependency"}
		}
		stored, g, err := s.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		target, err := findItem(g, cmd.TargetID)
		if err != nil {
			return err
		}
		if err := casCheck(target, cmd.ExpectedTargetRevision); err != nil {
			return err
		}
		source, err := matter.NewNodeID(cmd.SourceID)
		if err != nil {
			return err
		}
		gate := matter.GateKind(strings.TrimSpace(cmd.Gate))
		if err := matter.ValidateNewEdge(g.Items, g.Edges, source, target.ID, gate); err != nil {
			return err
		}
		edge := matter.Edge{ID: env.ids.NewRecordID(), MatterID: env.header.MatterID, Source: source, Target: target.ID, Gate: gate}
		if err := env.g.InsertEdge(ctx, edge); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "dependency.added", "DEPENDENCY", edge.ID, strings.TrimSpace(cmd.Reason), nil,
			map[string]any{"source": source.String(), "target": target.ID.String(), "gate": string(gate)}, nil)
		if err != nil {
			return err
		}
		updated := cloneGraph(g)
		updated.Edges = append(updated.Edges, edge)
		applyDerived(&updated, env.tCmd)
		if err := s.persist(ctx, env, stored, updated, target.ID, seq); err != nil {
			return err
		}
		detail = buildDetail(updated, target.ID, env.tCmd, env.seq)
		return nil
	})
	if err != nil {
		return matter.WorkItemDetail{}, err
	}
	return detail, nil
}

// RemoveDependency removes a prerequisite edge with an audited scope-change reason; it never
// relabels anything as satisfied.
func (s *WorkService) RemoveDependency(ctx context.Context, cmd port.RemoveDependencyCmd) (matter.WorkItemDetail, error) {
	var detail matter.WorkItemDetail
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "REMOVE_DEPENDENCY", policy.DecideCreateRequirement, func(env *workEnv) error {
		reason := strings.TrimSpace(cmd.Reason)
		if reason == "" {
			return &matter.RejectedError{Code: "reason-required", Message: "an explicit scope-change reason is required to remove a dependency"}
		}
		stored, g, err := s.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		var edge matter.Edge
		found := false
		for _, e := range g.Edges {
			if e.ID == cmd.EdgeID {
				edge, found = e, true
			}
		}
		if !found {
			return port.ErrNotFound
		}
		target, _ := g.Item(edge.Target)
		if err := casCheck(target, cmd.ExpectedTargetRevision); err != nil {
			return err
		}
		if err := env.g.DeleteEdge(ctx, edge.ID); err != nil {
			return err
		}
		seq, err := env.emit(ctx, "dependency.removed", "DEPENDENCY", edge.ID, reason,
			map[string]any{"source": edge.Source.String(), "target": edge.Target.String(), "gate": string(edge.Gate)}, nil, nil)
		if err != nil {
			return err
		}
		updated := cloneGraph(g)
		updated.Edges = nil
		for _, e := range g.Edges {
			if e.ID != edge.ID {
				updated.Edges = append(updated.Edges, e)
			}
		}
		applyDerived(&updated, env.tCmd)
		if err := s.persist(ctx, env, stored, updated, target.ID, seq); err != nil {
			return err
		}
		detail = buildDetail(updated, target.ID, env.tCmd, env.seq)
		return nil
	})
	if err != nil {
		return matter.WorkItemDetail{}, err
	}
	return detail, nil
}

func (s *WorkService) CreateWorkstream(ctx context.Context, cmd port.CreateWorkstreamCmd) (matter.Workstream, error) {
	var out matter.Workstream
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_WORKSTREAM", policy.DecideCreateRequirement, func(env *workEnv) error {
		name, err := matter.NewDisplayName(cmd.Name, "name")
		if err != nil {
			return err
		}
		id, err := matter.NewWorkstreamID(env.ids.NewRecordID())
		if err != nil {
			return err
		}
		out = matter.Workstream{ID: id, MatterID: env.header.MatterID, Name: name, Revision: 1}
		if err := env.g.InsertWorkstream(ctx, out); err != nil {
			return err
		}
		_, err = env.emit(ctx, "workstream.created", "WORKSTREAM", id.String(), "", nil, map[string]any{"name": name}, nil)
		return err
	})
	return out, err
}

func (s *WorkService) CreateParty(ctx context.Context, cmd port.CreatePartyCmd) (matter.Party, error) {
	var out matter.Party
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_PARTY", policy.DecideCreateRequirement, func(env *workEnv) error {
		name, err := matter.NewDisplayName(cmd.Name, "name")
		if err != nil {
			return err
		}
		out = matter.Party{
			ID: matter.PartyID(env.ids.NewRecordID()), MatterID: env.header.MatterID, Name: name,
			Kind: strings.TrimSpace(cmd.Kind), Contact: strings.TrimSpace(cmd.Contact), Notes: strings.TrimSpace(cmd.Notes), Revision: 1,
		}
		if err := env.g.InsertParty(ctx, out); err != nil {
			return err
		}
		_, err = env.emit(ctx, "party.created", "PARTY", out.ID.String(), "", nil, map[string]any{"name": name}, nil)
		return err
	})
	return out, err
}

// UpdateParty edits external-party context. It is context only: no account or role is
// created or granted (AC-117).
func (s *WorkService) UpdateParty(ctx context.Context, cmd port.UpdatePartyCmd) (matter.Party, error) {
	var out matter.Party
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "UPDATE_PARTY", policy.DecideCreateRequirement, func(env *workEnv) error {
		g, err := env.g.LoadGraph(ctx)
		if err != nil {
			return err
		}
		var cur matter.Party
		found := false
		for _, p := range g.Parties {
			if p.ID.String() == cmd.PartyID {
				cur, found = p, true
			}
		}
		if !found {
			return port.ErrNotFound
		}
		if cmd.ExpectedRevision == 0 {
			return port.ErrPreconditionRequired
		}
		if cur.Revision != cmd.ExpectedRevision {
			return port.ErrPreconditionFailed
		}
		next := cur
		if cmd.Name != nil {
			if next.Name, err = matter.NewDisplayName(*cmd.Name, "name"); err != nil {
				return err
			}
		}
		if cmd.Kind != nil {
			next.Kind = strings.TrimSpace(*cmd.Kind)
		}
		if cmd.Contact != nil {
			next.Contact = strings.TrimSpace(*cmd.Contact)
		}
		if cmd.Notes != nil {
			next.Notes = strings.TrimSpace(*cmd.Notes)
		}
		if next == cur {
			out = cur
			return nil
		}
		if err := env.g.SaveParty(ctx, next, cur.Revision); err != nil {
			return err
		}
		next.Revision = cur.Revision + 1
		out = next
		// History links the party to the work waiting on it.
		_, err = env.emit(ctx, "party.updated", "PARTY", cur.ID.String(), "",
			map[string]any{"name": cur.Name, "kind": cur.Kind, "contact": cur.Contact, "notes": cur.Notes},
			map[string]any{"name": next.Name, "kind": next.Kind, "contact": next.Contact, "notes": next.Notes}, nil)
		return err
	})
	return out, err
}

func (s *WorkService) CreateMilestone(ctx context.Context, cmd port.CreateMilestoneCmd) (matter.MilestoneView, error) {
	var out matter.MilestoneView
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_MILESTONE", policy.DecideMatterAdmin, func(env *workEnv) error {
		name, err := matter.NewDisplayName(cmd.Name, "name")
		if err != nil {
			return err
		}
		m := matter.Milestone{ID: matter.MilestoneID(env.ids.NewRecordID()), MatterID: env.header.MatterID, Name: name, Critical: cmd.Critical, Revision: 1}
		if cmd.Due != "" {
			at, err := parseInstant(cmd.Due, "due")
			if err != nil {
				return err
			}
			m.DueAt = &at
		}
		if err := env.g.InsertMilestone(ctx, m); err != nil {
			return err
		}
		if _, err := env.emit(ctx, "milestone.created", "MILESTONE", m.ID.String(), "", nil, map[string]any{"name": name, "critical": m.Critical}, nil); err != nil {
			return err
		}
		out = matter.MilestoneView{Milestone: m, Status: matter.MilestoneReadiness(m, matter.WorkGraph{})}
		return nil
	})
	return out, err
}

// SetMilestonePrerequisites replaces the designated required Requirements and the critical
// designation: OWNER only with a reason, because it changes readiness (RULE-008).
func (s *WorkService) SetMilestonePrerequisites(ctx context.Context, cmd port.SetMilestonePrerequisitesCmd) (matter.MilestoneView, error) {
	var out matter.MilestoneView
	err := s.execute(ctx, cmd.ActorID, cmd.MatterID, "SET_MILESTONE_PREREQUISITES", policy.DecideMatterAdmin, func(env *workEnv) error {
		reason := strings.TrimSpace(cmd.Reason)
		if reason == "" {
			return &matter.RejectedError{Code: "reason-required", Message: "a reason is required to change what a milestone requires"}
		}
		_, g, err := s.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		var cur matter.Milestone
		found := false
		for _, m := range g.Milestones {
			if m.ID.String() == cmd.MilestoneID {
				cur, found = m, true
			}
		}
		if !found {
			return port.ErrNotFound
		}
		if cmd.ExpectedRevision == 0 {
			return port.ErrPreconditionRequired
		}
		if cur.Revision != cmd.ExpectedRevision {
			return port.ErrPreconditionFailed
		}
		seen := map[matter.NodeID]bool{}
		var prereqs []matter.NodeID
		for _, raw := range cmd.Prerequisites {
			id, err := matter.NewNodeID(raw)
			if err != nil {
				return err
			}
			it, ok := g.Item(id)
			if !ok || it.Kind != matter.NodeRequirement {
				return &matter.RejectedError{Code: "prerequisite-not-requirement", Message: "milestone prerequisites must be Requirements of this matter"}
			}
			if !seen[id] {
				seen[id] = true
				prereqs = append(prereqs, id)
			}
		}
		sort.Slice(prereqs, func(i, j int) bool { return prereqs[i] < prereqs[j] })
		next := cur
		next.Prerequisites, next.Critical = prereqs, cmd.Critical
		if err := env.g.SaveMilestone(ctx, next, cur.Revision); err != nil {
			return err
		}
		next.Revision = cur.Revision + 1
		if _, err := env.emit(ctx, "milestone.prerequisites_changed", "MILESTONE", cur.ID.String(), reason,
			map[string]any{"prerequisites": nodeStrings(cur.Prerequisites), "critical": cur.Critical},
			map[string]any{"prerequisites": nodeStrings(next.Prerequisites), "critical": next.Critical}, nil); err != nil {
			return err
		}
		out = matter.MilestoneView{Milestone: next, Status: matter.MilestoneReadiness(next, g)}
		return nil
	})
	return out, err
}

func nodeStrings(ids []matter.NodeID) []string {
	out := make([]string, len(ids))
	for i, id := range ids {
		out[i] = id.String()
	}
	return out
}

// ---------- reads ----------

// readGraph loads the graph of one matter in a consistent snapshot after authorizing reads.
func (s *WorkService) readGraph(ctx context.Context, actorID, matterIDStr string, fn func(g matter.WorkGraph, asOf time.Time, rev int64) error) error {
	return s.readSnapshot(ctx, actorID, matterIDStr, func(_ port.MatterSnapshot, g matter.WorkGraph, asOf time.Time, rev int64) error {
		return fn(g, asOf, rev)
	})
}

// readSnapshot authorizes the caller and evaluates the matter's graph in ONE snapshot; fn may read
// anything else it needs from the same snapshot so every part agrees with the same instant.
func (s *WorkService) readSnapshot(ctx context.Context, actorID, matterIDStr string, fn func(snap port.MatterSnapshot, g matter.WorkGraph, asOf time.Time, rev int64) error) error {
	actor, err := matter.NewActorID(actorID)
	if err != nil {
		return err
	}
	matterID, err := matter.NewMatterID(matterIDStr)
	if err != nil {
		return err
	}
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		gs, ok := snap.(port.WorkGraphSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support the work graph")
		}
		header, err := snap.MatterHeader(ctx, matterID)
		if err != nil {
			return err
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
		g, err := gs.LoadGraph(ctx, matterID)
		if err != nil {
			return err
		}
		// Reads always show the state at the snapshot instant, not a stale cache.
		return fn(snap, matter.EffectiveGraph(g, snap.AsOf()), snap.AsOf(), header.Revision)
	})
	if err != nil {
		if errors.Is(err, port.ErrNotFound) {
			return port.ErrNotFound
		}
		return fmt.Errorf("work read: %w", err)
	}
	return nil
}

// ListWorkItems is the operational grid read: filter, sort and page on derived values at one
// snapshot instant. P0 scale (hundreds of rows per matter) is filtered in memory.
func (s *WorkService) ListWorkItems(ctx context.Context, q port.ListWorkItemsQuery) (matter.WorkItemPage, error) {
	var page matter.WorkItemPage
	err := s.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, asOf time.Time, rev int64) error {
		chain := matter.CriticalChain(g)
		var rows []matter.WorkItemView
		for _, it := range g.Items {
			v := matter.ViewOf(it, asOf, chain)
			if matchesFilter(v, q.Filter) {
				rows = append(rows, v)
			}
		}
		sortViews(rows, q.Sort, q.Desc)
		limit := q.Limit
		if limit <= 0 || limit > 200 {
			limit = 200
		}
		page = matter.WorkItemPage{Total: len(rows), AsOf: asOf, Revision: rev}
		start := q.Offset
		if start < 0 || start > len(rows) {
			start = len(rows)
		}
		end := start + limit
		if end < len(rows) {
			n := end
			page.NextOffset = &n
		} else {
			end = len(rows)
		}
		page.Items = rows[start:end]
		return nil
	})
	return page, err
}

func matchesFilter(v matter.WorkItemView, f port.WorkFilter) bool {
	it := v.Item
	if f.Kind != "" && string(it.Kind) != f.Kind {
		return false
	}
	if len(f.Execution) > 0 {
		ok := false
		for _, e := range f.Execution {
			ok = ok || string(it.Execution) == e
		}
		if !ok {
			return false
		}
	}
	if f.Dependency != "" && string(it.Dependency) != f.Dependency {
		return false
	}
	if f.Timing != "" && string(v.Timing.State) != f.Timing {
		return false
	}
	if f.Attention != "" && string(v.Attention.State) != f.Attention {
		return false
	}
	switch f.Owner {
	case "":
	case "none":
		if it.OwnerActorID != nil {
			return false
		}
	default:
		if it.OwnerActorID == nil || it.OwnerActorID.String() != f.Owner {
			return false
		}
	}
	if f.Workstream != "" && (it.WorkstreamID == nil || it.WorkstreamID.String() != f.Workstream) {
		return false
	}
	if t := strings.ToLower(strings.TrimSpace(f.Text)); t != "" &&
		!strings.Contains(strings.ToLower(it.Title), t) && !strings.Contains(strings.ToLower(it.Outcome), t) {
		return false
	}
	return true
}

func sortViews(rows []matter.WorkItemView, key string, desc bool) {
	less := func(a, b matter.WorkItemView) bool {
		switch key {
		case "title":
			if a.Item.Title != b.Item.Title {
				return strings.ToLower(a.Item.Title) < strings.ToLower(b.Item.Title)
			}
		case "execution":
			if a.Item.Execution != b.Item.Execution {
				return a.Item.Execution < b.Item.Execution
			}
		case "attention":
			if rank(a.Attention.State) != rank(b.Attention.State) {
				return rank(a.Attention.State) > rank(b.Attention.State) // most urgent first
			}
		default: // due: ascending, no due last
			switch {
			case a.Item.DueAt != nil && b.Item.DueAt != nil && !a.Item.DueAt.Equal(*b.Item.DueAt):
				return a.Item.DueAt.Before(*b.Item.DueAt)
			case a.Item.DueAt != nil && b.Item.DueAt == nil:
				return true
			case a.Item.DueAt == nil && b.Item.DueAt != nil:
				return false
			}
		}
		return a.Item.ID < b.Item.ID // stable
	}
	sort.SliceStable(rows, func(i, j int) bool {
		if desc {
			return less(rows[j], rows[i])
		}
		return less(rows[i], rows[j])
	})
}

func rank(a matter.Attention) int {
	switch a {
	case matter.AttentionCritical:
		return 2
	case matter.AttentionAttention:
		return 1
	}
	return 0
}

func buildDetail(g matter.WorkGraph, id matter.NodeID, asOf time.Time, rev int64) matter.WorkItemDetail {
	it, _ := g.Item(id)
	chain := matter.CriticalChain(g)
	evals := matter.EvaluateDependencies(g.Items, g.Edges)
	d := matter.WorkItemDetail{View: matter.ViewOf(it, asOf, chain), AsOf: asOf, Revision: rev}
	for _, e := range g.Edges {
		switch id {
		case e.Target:
			src, _ := g.Item(e.Source)
			code, bad := gateOutcome(src, e.Gate, evals[e.Source])
			d.Upstream = append(d.Upstream, matter.EdgeView{Edge: e, Other: src, Satisfied: !bad, Reason: code})
		case e.Source:
			dst, _ := g.Item(e.Target)
			code, bad := gateOutcome(it, e.Gate, evals[e.Source])
			d.Downstream = append(d.Downstream, matter.EdgeView{Edge: e, Other: dst, Satisfied: !bad, Reason: code})
		}
	}
	sort.Slice(d.Upstream, func(i, j int) bool { return d.Upstream[i].Edge.ID < d.Upstream[j].Edge.ID })
	sort.Slice(d.Downstream, func(i, j int) bool { return d.Downstream[i].Edge.ID < d.Downstream[j].Edge.ID })
	return d
}

// gateOutcome mirrors the dependency rule for display: why this edge is (not) satisfied.
func gateOutcome(src matter.WorkItem, gate matter.GateKind, srcDep matter.DependencyEval) (matter.GateReasonCode, bool) {
	switch {
	case src.Execution == matter.ExecutionCancelled:
		return matter.ReasonCancelled, true
	case src.Execution != matter.ExecutionCompleted:
		return matter.ReasonNotCompleted, true
	case srcDep.State != matter.DependencyReady:
		return matter.ReasonUpstreamBlocked, true
	case gate == matter.GateProof && src.Verification != matter.VerificationVerified:
		return matter.ReasonNotVerified, true
	}
	return "", false
}

func (s *WorkService) GetWorkItem(ctx context.Context, q port.GetWorkItemQuery) (matter.WorkItemDetail, error) {
	var d matter.WorkItemDetail
	err := s.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, asOf time.Time, rev int64) error {
		it, err := findItem(g, q.ItemID)
		if err != nil {
			return err
		}
		d = buildDetail(g, it.ID, asOf, rev)
		return nil
	})
	return d, err
}

func (s *WorkService) ListWorkstreams(ctx context.Context, q port.MatterListQuery) ([]matter.Workstream, error) {
	var out []matter.Workstream
	err := s.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, _ time.Time, _ int64) error {
		out = append([]matter.Workstream{}, g.Workstreams...)
		sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
		return nil
	})
	return out, err
}

func (s *WorkService) ListParties(ctx context.Context, q port.MatterListQuery) ([]matter.Party, error) {
	var out []matter.Party
	err := s.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, _ time.Time, _ int64) error {
		out = append([]matter.Party{}, g.Parties...)
		sort.Slice(out, func(i, j int) bool { return out[i].Name < out[j].Name })
		return nil
	})
	return out, err
}

func (s *WorkService) ListMilestones(ctx context.Context, q port.MatterListQuery) ([]matter.MilestoneView, error) {
	var out []matter.MilestoneView
	err := s.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, _ time.Time, _ int64) error {
		for _, m := range g.Milestones {
			out = append(out, matter.MilestoneView{Milestone: m, Status: matter.MilestoneReadiness(m, g)})
		}
		sort.Slice(out, func(i, j int) bool { return out[i].Milestone.ID < out[j].Milestone.ID })
		return nil
	})
	return out, err
}

// WaitingOn lists WAITING items ordered by due date; Waiting is not Blocked (RULE-002).
func (s *WorkService) WaitingOn(ctx context.Context, q port.MatterListQuery) ([]matter.WorkItemView, error) {
	var out []matter.WorkItemView
	err := s.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, asOf time.Time, _ int64) error {
		chain := matter.CriticalChain(g)
		for _, it := range g.Items {
			if it.Execution == matter.ExecutionWaiting {
				out = append(out, matter.ViewOf(it, asOf, chain))
			}
		}
		sortViews(out, "due", false)
		return nil
	})
	return out, err
}

// MyActions groups the caller's assigned items across the matters they can access, in one
// pass per matter snapshot: only the caller's own, only readable matters, no counts of
// anything else.
func (s *WorkService) MyActions(ctx context.Context, q port.MyActionsQuery) (matter.MyActions, error) {
	actor, err := matter.NewActorID(q.ActorID)
	if err != nil {
		return matter.MyActions{}, err
	}
	var out matter.MyActions
	err = s.store.View(ctx, func(snap port.MatterSnapshot) error {
		gs, ok := snap.(port.WorkGraphSnapshot)
		if !ok {
			return fmt.Errorf("snapshot does not support the work graph")
		}
		out.AsOf = snap.AsOf()
		matters, err := gs.MattersOf(ctx, actor)
		if err != nil {
			return err
		}
		var cands []matter.Candidate
		eligible := map[matter.NodeID]matter.AssignedView{}
		for _, m := range matters {
			header, err := snap.MatterHeader(ctx, m)
			if err != nil {
				return err
			}
			g, err := gs.LoadGraph(ctx, m)
			if err != nil {
				return err
			}
			g = matter.EffectiveGraph(g, out.AsOf)
			chain := matter.CriticalChain(g)
			for _, it := range g.Items {
				if it.OwnerActorID == nil || *it.OwnerActorID != actor {
					continue
				}
				v := matter.ViewOf(it, out.AsOf, chain)
				class := matter.ClassifyAssigned(it)
				av := matter.AssignedView{View: v, Class: class, MatterID: m, Revision: header.Revision, Reason: assignedReason(it, class)}
				if it.WaitingPartyID != nil {
					for _, p := range g.Parties {
						if p.ID == *it.WaitingPartyID {
							av.WaitingOn = p.Name
						}
					}
				}
				switch class {
				case matter.ClassEligible:
					cands = append(cands, matter.Candidate{Item: it, CriticalChain: chain[it.ID]})
					eligible[it.ID] = av
				case matter.ClassWaiting:
					out.Waiting = append(out.Waiting, av)
				case matter.ClassBlocked:
					out.Blocked = append(out.Blocked, av)
				default:
					out.Historical = append(out.Historical, av)
				}
			}
		}
		for _, c := range matter.RankNextActions(cands) {
			out.Next = append(out.Next, eligible[c.Item.ID])
		}
		return nil
	})
	if err != nil {
		return matter.MyActions{}, fmt.Errorf("my actions: %w", err)
	}
	return out, nil
}

func assignedReason(it matter.WorkItem, class matter.ActionClass) string {
	switch class {
	case matter.ClassEligible:
		return "assigned to you, ready to work"
	case matter.ClassWaiting:
		return "waiting on an external condition"
	case matter.ClassBlocked:
		if it.Kind == matter.NodeRequirement && it.Dependency == matter.DependencyReady {
			return "an assigned requirement is not a next action"
		}
		return "blocked by unsatisfied prerequisites"
	}
	return "completed or cancelled"
}

// matterDeny records the restricted audit row for a committed denial and returns err.
func (s *WorkService) matterDeny(ctx context.Context, tx port.MatterTx, tCmd time.Time, actor matter.ActorID, matterID matter.MatterID, operation, result string, err error) error {
	if auditErr := tx.RecordSecurityAudit(ctx, matter.SecurityAuditEntry{
		ClientIP:  port.RequestMetaFromContext(ctx).ClientIP,
		RequestID: port.RequestMetaFromContext(ctx).RequestID,
		EventID:   s.ids.NewRecordID(), OccurredAt: tCmd, Actor: actor, Operation: operation, Outcome: result,
		RequestedResourceKind: "MATTER", RequestedIDHash: matter.HashID(matterID.String()),
	}); auditErr != nil {
		return auditErr
	}
	return err
}

// Reevaluate recomputes the derived dependency state of the whole matter after an input
// changed outside a W2 command (for example a verification decision). Causal events are
// written only for items whose derived state actually changed: a refresh that changes nothing
// writes nothing.
func (s *WorkService) Reevaluate(ctx context.Context, actorID, matterID string) error {
	return s.execute(ctx, actorID, matterID, "REEVALUATE_DEPENDENCIES", policy.DecideCreateRequirement, func(env *workEnv) error {
		stored, g, err := s.loadGraphs(ctx, env)
		if err != nil {
			return err
		}
		updated := cloneGraph(g)
		applyDerived(&updated, env.tCmd)
		return s.persist(ctx, env, stored, updated, "", 0)
	})
}
