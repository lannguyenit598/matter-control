package mattercontrol

// W4 memory-store extension: filing details, cycles, immutable submissions and append-only
// observations, with the same constraints the PostgreSQL schema enforces.

import (
	"context"
	"fmt"
	"time"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

var _ port.FilingTx = (*memTx)(nil)

func loadFilingSet(s *Store, m matter.MatterID) matter.FilingSet {
	set := matter.FilingSet{
		Filings: sortedValues(s.filings, func(f matter.Filing) matter.MatterID { return f.MatterID }, m),
	}
	for _, c := range s.filingCyc {
		if c.MatterID == m {
			set.Cycles = append(set.Cycles, c)
		}
	}
	for _, x := range s.filingSubs {
		if x.MatterID == m {
			set.Submissions = append(set.Submissions, x)
		}
	}
	for _, o := range s.filingObs {
		if o.MatterID == m {
			set.Observations = append(set.Observations, o)
		}
	}
	return set
}

func (t *memTx) InsertFilingAction(ctx context.Context, it matter.WorkItem, f matter.Filing) error {
	if err := t.InsertAction(ctx, it); err != nil {
		return err
	}
	t.store.filings[f.ItemID] = f
	return nil
}

func (t *memTx) SaveFiling(_ context.Context, f matter.Filing) error {
	if _, ok := t.store.filings[f.ItemID]; !ok {
		return fmt.Errorf("filing update: %w", port.ErrNotFound)
	}
	t.store.filings[f.ItemID] = f
	return nil
}

func (t *memTx) InsertCycle(_ context.Context, c matter.FilingCycle) error {
	for _, x := range t.store.filingCyc {
		if x.ItemID == c.ItemID && x.No == c.No {
			return fmt.Errorf("memory: duplicate filing cycle %d", c.No)
		}
	}
	t.store.filingCyc = append(t.store.filingCyc, c)
	return nil
}

func (t *memTx) MarkCycleSubmitted(_ context.Context, item matter.NodeID, no int, submissionID string, at time.Time) error {
	for i := range t.store.filingCyc {
		c := &t.store.filingCyc[i]
		if c.ItemID == item && c.No == no {
			c.SubmittedAt, c.SubmissionID = &at, submissionID
			return nil
		}
	}
	return fmt.Errorf("filing cycle update: %w", port.ErrNotFound)
}

func (t *memTx) InsertSubmission(_ context.Context, s matter.FilingSubmission) error {
	if s.Reference == "" {
		return fmt.Errorf("memory: a submission needs a reference")
	}
	t.store.filingSubs = append(t.store.filingSubs, s)
	return nil
}

func (t *memTx) InsertObservation(_ context.Context, o matter.FilingObservation) error {
	for _, x := range t.store.filingObs {
		if x.ItemID == o.ItemID && x.Seq == o.Seq {
			return fmt.Errorf("memory: duplicate observation seq %d", o.Seq)
		}
	}
	if (o.Kind == matter.ObsCorrection) != (o.CorrectsID != "") {
		return fmt.Errorf("memory: only a correction names the observation it corrects")
	}
	t.store.filingObs = append(t.store.filingObs, o)
	return nil
}
