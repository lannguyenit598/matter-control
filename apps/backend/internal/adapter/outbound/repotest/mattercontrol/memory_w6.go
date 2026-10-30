package mattercontrol

// W6 memory-store extension: brief replay reads (DataOpsSnapshot) and the RULE-014
// import-source registry over the same in-memory double.

import (
	"context"
	"fmt"
	"sort"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// EventsWindow returns records with recorded_at in (t1, t2], ordered.
func (s *memSnapshot) EventsWindow(_ context.Context, m matter.MatterID, t1, t2 time.Time) ([]matter.EventRecord, error) {
	var out []matter.EventRecord
	for _, r := range s.state.records {
		if r.MatterID != m {
			continue
		}
		if !r.RecordedAt.After(t1) || r.RecordedAt.After(t2) {
			continue
		}
		out = append(out, r)
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].RecordedAt.Equal(out[j].RecordedAt) {
			return out[i].Seq < out[j].Seq
		}
		return out[i].RecordedAt.Before(out[j].RecordedAt)
	})
	return out, nil
}

// EventsUpTo returns every record with recorded_at ≤ t2, ordered.
func (s *memSnapshot) EventsUpTo(_ context.Context, m matter.MatterID, t2 time.Time) ([]matter.EventRecord, error) {
	var out []matter.EventRecord
	for _, r := range s.state.records {
		if r.MatterID == m && !r.RecordedAt.After(t2) {
			out = append(out, r)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].RecordedAt.Equal(out[j].RecordedAt) {
			return out[i].Seq < out[j].Seq
		}
		return out[i].RecordedAt.Before(out[j].RecordedAt)
	})
	return out, nil
}

var _ port.DataOpsSnapshot = (*memSnapshot)(nil)

// --- RULE-014 import-source registry over the memory transaction ---

func (t *memTx) FindImportSource(_ context.Context, matterID matter.MatterID, sourceName, rowKey string) (*matter.ImportSource, error) {
	is, ok := t.store.importSources[importSourceKey{matterID, sourceName, rowKey}]
	if !ok {
		return nil, port.ErrNotFound
	}
	cp := is
	return &cp, nil
}

func (t *memTx) RegisterImportSource(_ context.Context, m matter.ImportSource) error {
	if err := t.fail("register_import_source"); err != nil {
		return err
	}
	k := importSourceKey{m.MatterID, m.SourceName, m.RowKey}
	if _, exists := t.store.importSources[k]; exists {
		return fmt.Errorf("memory: import source already registered: %w", port.ErrVersionConflict)
	}
	t.store.importSources[k] = m
	return nil
}

var _ port.ImportRegistry = (*memTx)(nil)
