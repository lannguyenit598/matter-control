package service

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/policy"
	"github.com/example/userapi/internal/core/port"
)

// ControlService implements the W5 use cases: the Control Room read and basic context records.
type ControlService struct{ w *WorkService }

var _ port.ControlService = (*ControlService)(nil)

func NewControlService(w *WorkService) *ControlService { return &ControlService{w: w} }

func ctxTx(env *workEnv) (port.ContextTx, error) {
	t, ok := env.g.(port.ContextTx)
	if !ok {
		return nil, fmt.Errorf("matter transaction does not support context records")
	}
	return t, nil
}

func contextSnapshot(r matter.ContextRecord) map[string]any {
	return map[string]any{
		"kind": string(r.Kind), "title": r.Title, "status": string(r.Status), "links": strs(r.Links),
		"revision": r.Revision,
	}
}

func (s *ControlService) links(g matter.WorkGraph, raw []string) ([]matter.NodeID, error) {
	var out []matter.NodeID
	for _, r := range raw {
		id, err := matter.NewNodeID(r)
		if err != nil {
			return nil, err
		}
		if _, ok := g.Item(id); !ok {
			return nil, rejected("unknown-link", "a context record can only be linked to records of this matter")
		}
		out = append(out, id)
	}
	return out, nil
}

func (s *ControlService) CreateContextRecord(ctx context.Context, cmd port.CreateContextRecordCmd) (matter.CreatedResult, error) {
	actor, key, hash, err := parseReceiptInputs(cmd.ActorID, cmd.IdempotencyKey, cmd.RequestHash)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	matterID, err := matter.NewMatterID(cmd.MatterID)
	if err != nil {
		return matter.CreatedResult{}, err
	}
	var out matter.CreatedResult
	err = s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "CREATE_CONTEXT_RECORD", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := ctxTx(env)
		if err != nil {
			return err
		}
		out, err = s.w.createdReceipt(ctx, env, actor, key, hash, func() (matter.CreatedResult, error) {
			g, err := env.g.LoadGraph(ctx)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			links, err := s.links(g, cmd.Links)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			rec, err := matter.NewContextRecord(env.ids.NewRecordID(), matterID, matter.ContextKind(strings.TrimSpace(cmd.Kind)), cmd.Title, cmd.Body, links, env.actor, env.tCmd)
			if err != nil {
				return matter.CreatedResult{}, err
			}
			if err := tx.InsertContextRecord(ctx, rec); err != nil {
				return matter.CreatedResult{}, err
			}
			seq, err := env.emit(ctx, "context.created", "CONTEXT_RECORD", rec.ID, "", nil, contextSnapshot(rec), nil)
			return matter.CreatedResult{Kind: "CONTEXT_RECORD", ID: rec.ID, Seq: seq}, err
		})
		return err
	})
	return out, err
}

func (s *ControlService) UpdateContextRecord(ctx context.Context, cmd port.UpdateContextRecordCmd) (matter.ContextRecord, error) {
	var out matter.ContextRecord
	err := s.w.execute(ctx, cmd.ActorID, cmd.MatterID, "UPDATE_CONTEXT_RECORD", policy.DecideCreateRequirement, func(env *workEnv) error {
		tx, err := ctxTx(env)
		if err != nil {
			return err
		}
		g, err := env.g.LoadGraph(ctx)
		if err != nil {
			return err
		}
		var cur matter.ContextRecord
		found := false
		for _, r := range g.Context.Records {
			if r.ID == cmd.RecordID {
				cur, found = r, true
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
		if cmd.Close && cmd.Reopen {
			return rejected("close-or-reopen", "choose either close or reopen")
		}
		next := cur
		if cmd.Title != nil || cmd.Body != nil {
			title, body := cur.Title, cur.Body
			if cmd.Title != nil {
				title = *cmd.Title
			}
			if cmd.Body != nil {
				body = *cmd.Body
			}
			checked, err := matter.NewContextRecord(cur.ID, cur.MatterID, cur.Kind, title, body, cur.Links, cur.CreatedBy, cur.CreatedAt)
			if err != nil {
				return err
			}
			next.Title, next.Body = checked.Title, checked.Body
		}
		if cmd.Links != nil {
			links, err := s.links(g, *cmd.Links)
			if err != nil {
				return err
			}
			sort.Slice(links, func(i, j int) bool { return links[i] < links[j] })
			next.Links = links
		}
		switch {
		case cmd.Close:
			if cur.Status == matter.ContextClosed {
				return rejected("already-closed", "this record is already closed")
			}
			if strings.TrimSpace(cmd.Reason) == "" {
				return rejected("reason-required", "a reason is required to close a record")
			}
			next.Status, next.ClosedReason = matter.ContextClosed, strings.TrimSpace(cmd.Reason)
		case cmd.Reopen:
			if cur.Status != matter.ContextClosed {
				return rejected("not-closed", "only a closed record can be reopened")
			}
			next.Status, next.ClosedReason = matter.ContextOpen, ""
		}
		if sameRecord(cur, next) {
			out = cur // no change: no event, no revision
			return nil
		}
		if err := tx.SaveContextRecord(ctx, next, cur.Revision); err != nil {
			return err
		}
		next.Revision = cur.Revision + 1
		if _, err := env.emit(ctx, "context.updated", "CONTEXT_RECORD", cur.ID, strings.TrimSpace(cmd.Reason), contextSnapshot(cur), contextSnapshot(next), nil); err != nil {
			return err
		}
		out = next
		return nil
	})
	return out, err
}

func sameRecord(a, b matter.ContextRecord) bool {
	if a.Title != b.Title || a.Body != b.Body || a.Status != b.Status || a.ClosedReason != b.ClosedReason || len(a.Links) != len(b.Links) {
		return false
	}
	for i := range a.Links {
		if a.Links[i] != b.Links[i] {
			return false
		}
	}
	return true
}

func (s *ControlService) ListContextRecords(ctx context.Context, q port.MatterListQuery) ([]matter.ContextRecord, error) {
	var out []matter.ContextRecord
	err := s.w.readGraph(ctx, q.ActorID, q.MatterID, func(g matter.WorkGraph, _ time.Time, _ int64) error {
		out = append([]matter.ContextRecord{}, g.Context.Records...)
		sort.Slice(out, func(i, j int) bool { return out[i].ID > out[j].ID })
		return nil
	})
	return out, err
}

// ControlRoom reads the graph, the context and the recent history in ONE snapshot, so every
// section agrees with the underlying records at the returned boundary (AC-109).
func (s *ControlService) ControlRoom(ctx context.Context, q port.ControlRoomQuery) (matter.ControlRoom, error) {
	limit := q.RecentChanges
	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}
	var out matter.ControlRoom
	err := s.w.readSnapshot(ctx, q.ActorID, q.MatterID, func(snap port.MatterSnapshot, g matter.WorkGraph, asOf time.Time, rev int64) error {
		var recent []matter.EventRecord
		if rs, ok := snap.(port.RecentEventsSnapshot); ok {
			id, err := matter.NewMatterID(q.MatterID)
			if err != nil {
				return err
			}
			if recent, err = rs.RecentEvents(ctx, id, limit); err != nil {
				return err
			}
		}
		out = matter.BuildControlRoom(g, asOf, rev, recent)
		return nil
	})
	return out, err
}
