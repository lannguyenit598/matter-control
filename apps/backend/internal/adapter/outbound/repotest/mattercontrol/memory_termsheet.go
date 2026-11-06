package mattercontrol

// MC-ZCODE-TERMSHEET-01 memory double for contract term lines: typed facts per document version
// with content-hash idempotent replacement and the promotion link.

import (
	"context"
	"sort"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

var (
	_ port.TermLineSnapshot  = (*memSnapshot)(nil)
	_ port.MatterTermSheetTx = (*memTx)(nil)
)

func (s *Store) termLinesOf(m matter.MatterID) []matter.TermLine {
	out := make([]matter.TermLine, 0)
	for _, l := range s.termLines {
		if l.MatterID == m {
			out = append(out, l)
		}
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].DocumentVersionID != out[j].DocumentVersionID {
			return out[i].DocumentVersionID < out[j].DocumentVersionID
		}
		if out[i].Field != out[j].Field {
			return out[i].Field < out[j].Field
		}
		if out[i].RowKey != out[j].RowKey {
			return out[i].RowKey < out[j].RowKey
		}
		return out[i].ID < out[j].ID
	})
	return out
}

func (s *Store) termLine(m matter.MatterID, id matter.TermLineID) (matter.TermLine, error) {
	for _, l := range s.termLines {
		if l.MatterID == m && l.ID == id {
			return l, nil
		}
	}
	return matter.TermLine{}, port.ErrNotFound
}

// replaceTermLines swaps one document version's lines wholesale, mirroring the PostgreSQL
// delete+insert pair inside the same transaction.
func (s *Store) replaceTermLines(m matter.MatterID, documentVersionID matter.VersionID, lines []matter.TermLine) {
	kept := s.termLines[:0:0]
	for _, l := range s.termLines {
		if l.MatterID != m || l.DocumentVersionID != documentVersionID {
			kept = append(kept, l)
		}
	}
	kept = append(kept, lines...)
	s.termLines = kept
}

func (s *memSnapshot) ListTermLines(_ context.Context, m matter.MatterID) ([]matter.TermLine, error) {
	return s.state.termLinesOf(m), nil
}

func (t *memTx) ListTermLines(_ context.Context, m matter.MatterID) ([]matter.TermLine, error) {
	return t.store.termLinesOf(m), nil
}

func (t *memTx) LoadTermLine(_ context.Context, m matter.MatterID, id matter.TermLineID) (matter.TermLine, error) {
	return t.store.termLine(m, id)
}

func (t *memTx) ReplaceTermLinesOfDocumentVersion(_ context.Context, m matter.MatterID, documentVersionID matter.VersionID, lines []matter.TermLine) error {
	t.store.replaceTermLines(m, documentVersionID, lines)
	return nil
}

func (t *memTx) MarkTermLinePromoted(_ context.Context, m matter.MatterID, id matter.TermLineID, ref string, kind matter.TermPromotionKind, at time.Time) error {
	for i := range t.store.termLines {
		if t.store.termLines[i].MatterID == m && t.store.termLines[i].ID == id {
			t.store.termLines[i].PromotedRef = ref
			t.store.termLines[i].PromotedKind = kind
			v := at
			t.store.termLines[i].PromotedAt = &v
			t.store.termLines[i].UpdatedAt = v
			t.store.termLines[i].Revision++
			return nil
		}
	}
	return port.ErrNotFound
}
