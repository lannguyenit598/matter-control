package mattercontrol

// W5 memory-store extension: context records and links, with the same constraints the PostgreSQL
// schema enforces.

import (
	"context"
	"fmt"
	"sort"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var _ port.ContextTx = (*memTx)(nil)

func loadContextSet(s *Store, m matter.MatterID) matter.ContextSet {
	set := matter.ContextSet{}
	for _, r := range s.contexts {
		if r.MatterID == m {
			r.Links = append([]matter.NodeID(nil), r.Links...)
			set.Records = append(set.Records, r)
		}
	}
	sort.Slice(set.Records, func(i, j int) bool { return set.Records[i].ID < set.Records[j].ID })
	return set
}

func (t *memTx) checkLinks(r matter.ContextRecord) error {
	for _, l := range r.Links {
		if n, ok := t.store.nodes[l]; !ok || n.MatterID != r.MatterID {
			return fmt.Errorf("memory: context link %s is not a record of this matter", l)
		}
	}
	return nil
}

func (t *memTx) InsertContextRecord(_ context.Context, r matter.ContextRecord) error {
	if err := t.checkLinks(r); err != nil {
		return err
	}
	t.store.contexts[r.ID] = r
	return nil
}

func (t *memTx) SaveContextRecord(_ context.Context, r matter.ContextRecord, expectedRevision int64) error {
	cur, ok := t.store.contexts[r.ID]
	if !ok || cur.Revision != expectedRevision {
		return fmt.Errorf("context record update: %w", port.ErrVersionConflict)
	}
	if err := t.checkLinks(r); err != nil {
		return err
	}
	r.Revision = expectedRevision + 1
	t.store.contexts[r.ID] = r
	return nil
}
