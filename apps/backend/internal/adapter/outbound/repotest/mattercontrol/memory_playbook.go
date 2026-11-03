package mattercontrol

// RLF-05 memory double for playbooks: workspace-scoped containers with immutable revisions and
// the provenance of their applications.

import (
	"context"
	"fmt"
	"sort"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.PlaybookSnapshot    = (*memSnapshot)(nil)
	_ port.MatterPlaybookTx    = (*memTx)(nil)
	_ port.WorkspacePlaybookTx = (*memWorkspaceTx)(nil)
)

func (s *Store) playbookList(w matter.WorkspaceID) []matter.Playbook {
	out := make([]matter.Playbook, 0)
	for _, p := range s.playbooks {
		if p.WorkspaceID == w {
			out = append(out, p)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].Name != out[j].Name {
			return out[i].Name < out[j].Name
		}
		return out[i].ID < out[j].ID
	})
	return out
}

func (s *Store) playbook(id matter.PlaybookID) (matter.Playbook, error) {
	p, ok := s.playbooks[id]
	if !ok {
		return matter.Playbook{}, port.ErrNotFound
	}
	return p, nil
}

func (s *Store) playbookRevision(id matter.PlaybookRevisionID) (matter.PlaybookRevision, error) {
	r, ok := s.playbookRevs[id]
	if !ok {
		return matter.PlaybookRevision{}, port.ErrNotFound
	}
	return r, nil
}

func (s *Store) playbookRevisionList(ids []matter.PlaybookID) []matter.PlaybookRevision {
	want := map[matter.PlaybookID]bool{}
	for _, id := range ids {
		want[id] = true
	}
	out := make([]matter.PlaybookRevision, 0)
	for _, r := range s.playbookRevs {
		if want[r.PlaybookID] {
			out = append(out, r)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].PlaybookID != out[j].PlaybookID {
			return out[i].PlaybookID < out[j].PlaybookID
		}
		return out[i].No < out[j].No
	})
	return out
}

func (s *Store) playbookInstancesOf(m matter.MatterID) []matter.PlaybookInstance {
	out := make([]matter.PlaybookInstance, 0)
	for _, i := range s.playbookInstances {
		if i.MatterID == m {
			out = append(out, i)
		}
	}
	return out
}

func (s *memSnapshot) ListPlaybooks(_ context.Context, w matter.WorkspaceID) ([]matter.Playbook, error) {
	return s.state.playbookList(w), nil
}
func (s *memSnapshot) LoadPlaybook(_ context.Context, id matter.PlaybookID) (matter.Playbook, error) {
	return s.state.playbook(id)
}
func (s *memSnapshot) ListPlaybookRevisions(_ context.Context, ids []matter.PlaybookID) ([]matter.PlaybookRevision, error) {
	return s.state.playbookRevisionList(ids), nil
}
func (s *memSnapshot) LoadPlaybookRevision(_ context.Context, id matter.PlaybookRevisionID) (matter.PlaybookRevision, error) {
	return s.state.playbookRevision(id)
}
func (s *memSnapshot) ListPlaybookInstancesOfMatter(_ context.Context, m matter.MatterID) ([]matter.PlaybookInstance, error) {
	return s.state.playbookInstancesOf(m), nil
}
func (s *memSnapshot) ListPlaybookInstancesOfItems(_ context.Context, ids []matter.NodeID) ([]matter.PlaybookInstance, error) {
	want := map[matter.NodeID]bool{}
	for _, id := range ids {
		want[id] = true
	}
	out := make([]matter.PlaybookInstance, 0)
	for _, i := range s.state.playbookInstances {
		if want[i.ItemID] {
			out = append(out, i)
		}
	}
	return out, nil
}

// matter tx

func (t *memTx) LoadPlaybookRevision(_ context.Context, id matter.PlaybookRevisionID) (matter.PlaybookRevision, error) {
	return t.store.playbookRevision(id)
}
func (t *memTx) LoadPlaybook(_ context.Context, id matter.PlaybookID) (matter.Playbook, error) {
	return t.store.playbook(id)
}
func (t *memTx) ListPlaybookInstancesOfMatter(_ context.Context, m matter.MatterID) ([]matter.PlaybookInstance, error) {
	return t.store.playbookInstancesOf(m), nil
}
func (t *memTx) InsertPlaybookInstance(_ context.Context, i matter.PlaybookInstance) error {
	for _, existing := range t.store.playbookInstances {
		if existing.MatterID == i.MatterID && existing.RevisionID == i.RevisionID && existing.EntryKey == i.EntryKey {
			return fmt.Errorf("memory: playbook instance exists: %s/%s", i.RevisionID, i.EntryKey)
		}
	}
	t.store.playbookInstances = append(t.store.playbookInstances, i)
	return nil
}

// workspace tx (the locked workspace transaction is a distinct type from the matter tx)

func (t *memWorkspaceTx) ListPlaybooks(_ context.Context, w matter.WorkspaceID) ([]matter.Playbook, error) {
	return t.store.playbookList(w), nil
}

func (t *memWorkspaceTx) InsertPlaybook(_ context.Context, p matter.Playbook) error {
	for _, existing := range t.store.playbooks {
		if existing.WorkspaceID == p.WorkspaceID && existing.Name == p.Name {
			return fmt.Errorf("memory: playbook name already used: %s", p.Name)
		}
	}
	if _, dup := t.store.playbooks[p.ID]; dup {
		return fmt.Errorf("memory: playbook %s exists", p.ID)
	}
	t.store.playbooks[p.ID] = p
	return nil
}

func (t *memWorkspaceTx) InsertPlaybookRevision(_ context.Context, r matter.PlaybookRevision, _ []byte) error {
	if _, ok := t.store.playbooks[r.PlaybookID]; !ok {
		return fmt.Errorf("memory: playbook %s missing", r.PlaybookID)
	}
	for _, existing := range t.store.playbookRevs {
		if existing.PlaybookID == r.PlaybookID && existing.No == r.No {
			return fmt.Errorf("memory: playbook revision %s#%d exists", r.PlaybookID, r.No)
		}
	}
	if _, dup := t.store.playbookRevs[r.ID]; dup {
		return fmt.Errorf("memory: playbook revision %s exists", r.ID)
	}
	t.store.playbookRevs[r.ID] = r
	return nil
}

func (t *memWorkspaceTx) LoadPlaybook(_ context.Context, id matter.PlaybookID) (matter.Playbook, error) {
	return t.store.playbook(id)
}

func (t *memWorkspaceTx) MaxPlaybookRevisionNo(_ context.Context, id matter.PlaybookID) (int64, error) {
	var max int64
	for _, r := range t.store.playbookRevs {
		if r.PlaybookID == id && r.No > max {
			max = r.No
		}
	}
	return max, nil
}
