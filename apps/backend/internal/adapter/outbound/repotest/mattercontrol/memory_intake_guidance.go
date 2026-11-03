package mattercontrol

// RLF-06 + RLF-07 memory double: intake records and versioned guidance.

import (
	"context"
	"fmt"
	"sort"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.IntakeSnapshot   = (*memSnapshot)(nil)
	_ port.IntakeTx         = (*memTx)(nil)
	_ port.GuidanceSnapshot = (*memSnapshot)(nil)
	_ port.GuidanceTx       = (*memTx)(nil)
)

func (s *Store) intakeListOf(m matter.MatterID) []matter.IntakeRecord {
	out := make([]matter.IntakeRecord, 0)
	for _, r := range s.intakeRecords {
		if r.MatterID == m {
			out = append(out, r)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if !out[i].CreatedAt.Equal(out[j].CreatedAt) {
			return out[i].CreatedAt.After(out[j].CreatedAt)
		}
		return out[i].ID < out[j].ID
	})
	return out
}

func (s *memSnapshot) ListIntakeRecords(_ context.Context, m matter.MatterID) ([]matter.IntakeRecord, error) {
	return s.state.intakeListOf(m), nil
}

func (t *memTx) ListIntakeRecords(_ context.Context, m matter.MatterID) ([]matter.IntakeRecord, error) {
	return t.store.intakeListOf(m), nil
}

func (t *memTx) InsertIntakeRecord(_ context.Context, r matter.IntakeRecord) error {
	if _, dup := t.store.intakeRecords[r.ID]; dup {
		return fmt.Errorf("memory: intake %s exists", r.ID)
	}
	t.store.intakeRecords[r.ID] = r
	return nil
}

func (t *memTx) LoadIntakeRecord(_ context.Context, m matter.MatterID, id matter.IntakeID) (matter.IntakeRecord, error) {
	r, ok := t.store.intakeRecords[id]
	if !ok || r.MatterID != m {
		return matter.IntakeRecord{}, port.ErrNotFound
	}
	return r, nil
}

func (t *memTx) SaveIntakeRecord(_ context.Context, r matter.IntakeRecord, expectedRevision int64) error {
	current, ok := t.store.intakeRecords[r.ID]
	if !ok || current.MatterID != r.MatterID {
		return port.ErrNotFound
	}
	if current.Revision != expectedRevision {
		return port.ErrPreconditionFailed
	}
	r.Revision = expectedRevision + 1
	t.store.intakeRecords[r.ID] = r
	return nil
}

func (s *Store) guidanceDocsOf(m matter.MatterID) []matter.GuidanceDocument {
	out := make([]matter.GuidanceDocument, 0)
	for _, d := range s.guidanceDocs {
		if d.MatterID == m {
			out = append(out, d)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if !out[i].CreatedAt.Equal(out[j].CreatedAt) {
			return out[i].CreatedAt.After(out[j].CreatedAt)
		}
		return out[i].ID < out[j].ID
	})
	return out
}

func (s *Store) guidanceRevsOf(m matter.MatterID) []matter.GuidanceRevision {
	out := make([]matter.GuidanceRevision, 0)
	for _, r := range s.guidanceRevs {
		if r.MatterID == m {
			out = append(out, r)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].DocumentID != out[j].DocumentID {
			return out[i].DocumentID < out[j].DocumentID
		}
		return out[i].No < out[j].No
	})
	return out
}

func (s *memSnapshot) ListGuidanceDocuments(_ context.Context, m matter.MatterID) ([]matter.GuidanceDocument, error) {
	return s.state.guidanceDocsOf(m), nil
}
func (s *memSnapshot) ListGuidanceRevisions(_ context.Context, m matter.MatterID) ([]matter.GuidanceRevision, error) {
	return s.state.guidanceRevsOf(m), nil
}
func (t *memTx) ListGuidanceDocuments(_ context.Context, m matter.MatterID) ([]matter.GuidanceDocument, error) {
	return t.store.guidanceDocsOf(m), nil
}
func (t *memTx) ListGuidanceRevisions(_ context.Context, m matter.MatterID) ([]matter.GuidanceRevision, error) {
	return t.store.guidanceRevsOf(m), nil
}

func (t *memTx) InsertGuidanceDocument(_ context.Context, d matter.GuidanceDocument) error {
	for _, existing := range t.store.guidanceDocs {
		if existing.MatterID == d.MatterID && existing.Title == d.Title {
			return fmt.Errorf("memory: guidance title already used: %s", d.Title)
		}
	}
	if _, dup := t.store.guidanceDocs[d.ID]; dup {
		return fmt.Errorf("memory: guidance doc %s exists", d.ID)
	}
	t.store.guidanceDocs[d.ID] = d
	return nil
}

func (t *memTx) InsertGuidanceRevision(_ context.Context, r matter.GuidanceRevision, _ []byte) error {
	for _, existing := range t.store.guidanceRevs {
		if existing.DocumentID == r.DocumentID && existing.No == r.No {
			return fmt.Errorf("memory: guidance revision %s#%d exists", r.DocumentID, r.No)
		}
	}
	t.store.guidanceRevs[r.ID] = r
	return nil
}

func (t *memTx) PublishGuidanceRevision(_ context.Context, docID matter.GuidanceDocumentID, revID matter.GuidanceRevisionID, m matter.MatterID, by matter.ActorID, at time.Time) error {
	r, ok := t.store.guidanceRevs[revID]
	if !ok || r.MatterID != m || r.DocumentID != docID || r.Status != "DRAFT" {
		return port.ErrPreconditionFailed
	}
	r.Status = "PUBLISHED"
	r.PublishedBy, r.PublishedAt = &by, &at
	t.store.guidanceRevs[revID] = r
	return nil
}

func (t *memTx) LoadGuidanceRevision(_ context.Context, m matter.MatterID, id matter.GuidanceRevisionID) (matter.GuidanceRevision, error) {
	r, ok := t.store.guidanceRevs[id]
	if !ok || r.MatterID != m {
		return matter.GuidanceRevision{}, port.ErrNotFound
	}
	return r, nil
}

func (t *memTx) MaxGuidanceRevisionNo(_ context.Context, docID matter.GuidanceDocumentID) (int64, error) {
	var max int64
	for _, r := range t.store.guidanceRevs {
		if r.DocumentID == docID && r.No > max {
			max = r.No
		}
	}
	return max, nil
}
