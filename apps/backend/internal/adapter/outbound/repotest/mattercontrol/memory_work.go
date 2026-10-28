package mattercontrol

// W2 memory-store extension: the work graph (typed items, edges, workstreams, parties,
// milestones) over the same double, with the same compare-and-set and rollback semantics.

import (
	"context"
	"fmt"
	"sort"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

var (
	_ port.WorkGraphTx       = (*memTx)(nil)
	_ port.WorkGraphSnapshot = (*memSnapshot)(nil)
)

func loadGraph(s *Store, m matter.MatterID) matter.WorkGraph {
	g := matter.WorkGraph{MatterID: m}
	for _, it := range s.requirements {
		if it.MatterID == m {
			g.Items = append(g.Items, it)
		}
	}
	for _, it := range s.actions {
		if it.MatterID == m {
			g.Items = append(g.Items, it)
		}
	}
	sort.Slice(g.Items, func(i, j int) bool { return g.Items[i].ID < g.Items[j].ID })
	for _, e := range s.edges {
		if e.MatterID == m {
			g.Edges = append(g.Edges, e)
		}
	}
	sort.Slice(g.Edges, func(i, j int) bool { return g.Edges[i].ID < g.Edges[j].ID })
	for _, w := range s.workstreams {
		if w.MatterID == m {
			g.Workstreams = append(g.Workstreams, w)
		}
	}
	for _, p := range s.parties {
		if p.MatterID == m {
			g.Parties = append(g.Parties, p)
		}
	}
	for _, ms := range s.milestones {
		if ms.MatterID == m {
			g.Milestones = append(g.Milestones, ms)
		}
	}
	g.Evidence = loadEvidenceSet(s, m)
	g.Filing = loadFilingSet(s, m)
	g.Context = loadContextSet(s, m)
	return g
}

func (t *memTx) LoadGraph(_ context.Context) (matter.WorkGraph, error) {
	if err := t.fail("load_graph"); err != nil {
		return matter.WorkGraph{}, err
	}
	return loadGraph(t.store, t.header.MatterID), nil
}

func (t *memTx) InsertAction(_ context.Context, item matter.WorkItem) error {
	if err := t.fail("insert_action"); err != nil {
		return err
	}
	if _, exists := t.store.nodes[item.ID]; exists {
		return fmt.Errorf("memory: node %s already exists", item.ID)
	}
	t.store.nodes[item.ID] = matter.Node{ID: item.ID, MatterID: item.MatterID, Kind: matter.NodeAction}
	t.store.actions[item.ID] = item
	return nil
}

func (t *memTx) SaveWorkItem(_ context.Context, item matter.WorkItem, expectedRevision int64) error {
	if err := t.fail("save_work_item"); err != nil {
		return err
	}
	item.Revision = expectedRevision + 1
	if item.Kind == matter.NodeAction {
		cur, ok := t.store.actions[item.ID]
		if !ok || cur.Revision != expectedRevision {
			return fmt.Errorf("work item update: %w", port.ErrVersionConflict)
		}
		t.store.actions[item.ID] = item
		return nil
	}
	cur, ok := t.store.requirements[matter.RequirementID(item.ID)]
	if !ok || cur.Revision != expectedRevision {
		return fmt.Errorf("work item update: %w", port.ErrVersionConflict)
	}
	t.store.requirements[matter.RequirementID(item.ID)] = item
	return nil
}

func (t *memTx) InsertEdge(_ context.Context, e matter.Edge) error {
	if err := t.fail("insert_edge"); err != nil {
		return err
	}
	for _, x := range t.store.edges {
		if x.MatterID == e.MatterID && x.Source == e.Source && x.Target == e.Target {
			return fmt.Errorf("memory: duplicate edge %s -> %s", e.Source, e.Target)
		}
	}
	t.store.edges[e.ID] = e
	return nil
}

func (t *memTx) DeleteEdge(_ context.Context, id string) error {
	if _, ok := t.store.edges[id]; !ok {
		return port.ErrNotFound
	}
	delete(t.store.edges, id)
	return nil
}

func (t *memTx) InsertWorkstream(_ context.Context, w matter.Workstream) error {
	t.store.workstreams[w.ID] = w
	return nil
}

func (t *memTx) InsertParty(_ context.Context, p matter.Party) error {
	t.store.parties[p.ID] = p
	return nil
}

func (t *memTx) SaveParty(_ context.Context, p matter.Party, expectedRevision int64) error {
	cur, ok := t.store.parties[p.ID]
	if !ok || cur.Revision != expectedRevision {
		return fmt.Errorf("party update: %w", port.ErrVersionConflict)
	}
	p.Revision = expectedRevision + 1
	t.store.parties[p.ID] = p
	return nil
}

func (t *memTx) InsertMilestone(_ context.Context, m matter.Milestone) error {
	t.store.milestones[m.ID] = m
	return nil
}

func (t *memTx) SaveMilestone(_ context.Context, m matter.Milestone, expectedRevision int64) error {
	cur, ok := t.store.milestones[m.ID]
	if !ok || cur.Revision != expectedRevision {
		return fmt.Errorf("milestone update: %w", port.ErrVersionConflict)
	}
	m.Revision = expectedRevision + 1
	m.Prerequisites = append([]matter.NodeID(nil), m.Prerequisites...)
	t.store.milestones[m.ID] = m
	return nil
}

func (t *memTx) AppendWorkEvent(_ context.Context, e matter.WorkEvent) error {
	if err := t.fail("append_event"); err != nil {
		return err
	}
	actor := e.Actor.String()
	rec := matter.EventRecord{
		MatterID: e.MatterID, Seq: e.Seq, ID: e.ID, Type: e.Type, SchemaVersion: 1, ActorKind: "USER", ActorID: &actor,
		TargetKind: e.TargetKind, TargetID: e.TargetID, EffectiveAt: e.EffectiveAt, RecordedAt: e.RecordedAt,
		CauseSeq: e.CauseSeq, Before: e.Before, After: e.After,
	}
	if e.Reason != "" {
		r := e.Reason
		rec.Reason = &r
	}
	t.store.records = append(t.store.records, rec)
	return nil
}

func (s *memSnapshot) LoadGraph(_ context.Context, m matter.MatterID) (matter.WorkGraph, error) {
	if _, ok := s.state.matters[m]; !ok {
		return matter.WorkGraph{}, port.ErrNotFound
	}
	return loadGraph(s.state, m), nil
}

func (s *memSnapshot) MattersOf(_ context.Context, actor matter.ActorID) ([]matter.MatterID, error) {
	var out []matter.MatterID
	for k, mm := range s.state.mMemberships {
		if k.actor != actor || mm.Status != matter.StatusActive {
			continue
		}
		h, ok := s.state.matters[k.m]
		if !ok {
			continue
		}
		if ws, ok := s.state.wsMemberships[wsKey{h.WorkspaceID, actor}]; ok && ws.Status == matter.StatusActive {
			out = append(out, k.m)
		}
	}
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out, nil
}
