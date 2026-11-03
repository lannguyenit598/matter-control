package mattercontrol

// RLF-04 memory double for saved views: private per-actor grid filter definitions.

import (
	"context"
	"fmt"
	"sort"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.SavedViewSnapshot = (*memSnapshot)(nil)
	_ port.SavedViewTx       = (*memTx)(nil)
)

func (s *Store) savedViewList(m matter.MatterID, owner matter.ActorID) []matter.SavedView {
	out := make([]matter.SavedView, 0)
	for _, v := range s.savedViews[m] {
		if v.OwnerID == owner {
			out = append(out, v)
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

func (s *memSnapshot) ListSavedViews(_ context.Context, m matter.MatterID, owner matter.ActorID) ([]matter.SavedView, error) {
	return s.state.savedViewList(m, owner), nil
}

func (t *memTx) ListSavedViews(_ context.Context, m matter.MatterID, owner matter.ActorID) ([]matter.SavedView, error) {
	return t.store.savedViewList(m, owner), nil
}

func (t *memTx) InsertSavedView(_ context.Context, v matter.SavedView, _ []byte) error {
	m := t.store.savedViews[v.MatterID]
	if m == nil {
		m = map[matter.SavedViewID]matter.SavedView{}
		t.store.savedViews[v.MatterID] = m
	}
	for _, existing := range m {
		if existing.OwnerID == v.OwnerID && existing.Name == v.Name {
			return fmt.Errorf("memory: saved view name already used: %s", v.Name)
		}
	}
	if _, dup := m[v.ID]; dup {
		return fmt.Errorf("memory: saved view %s exists", v.ID)
	}
	m[v.ID] = v
	return nil
}

func (t *memTx) SaveSavedView(_ context.Context, v matter.SavedView, expectedRevision int64, _ []byte) error {
	m := t.store.savedViews[v.MatterID]
	current, ok := m[v.ID]
	if !ok || current.OwnerID != v.OwnerID {
		return port.ErrNotFound
	}
	if current.Revision != expectedRevision {
		return port.ErrPreconditionFailed
	}
	for _, existing := range m {
		if existing.ID != v.ID && existing.OwnerID == v.OwnerID && existing.Name == v.Name {
			return fmt.Errorf("memory: saved view name already used: %s", v.Name)
		}
	}
	v.Revision = expectedRevision + 1
	m[v.ID] = v
	return nil
}

func (t *memTx) DeleteSavedView(_ context.Context, v matter.SavedView, expectedRevision int64) error {
	m := t.store.savedViews[v.MatterID]
	current, ok := m[v.ID]
	if !ok || current.OwnerID != v.OwnerID {
		return port.ErrNotFound
	}
	if current.Revision != expectedRevision {
		return port.ErrPreconditionFailed
	}
	delete(m, v.ID)
	return nil
}
