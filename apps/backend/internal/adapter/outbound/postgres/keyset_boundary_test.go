package postgres

// MC-BE-FIXWAVE-20261106 W3 (BE-R1-02): the events keyset moved from the OR-form
// (recorded_at > $1 OR (recorded_at = $1 AND seq > $2)) to the row comparison
// (recorded_at, seq) > ($1, $2). The boundary that must not move: a cursor parked on
// (T, seq) still returns the later events that share T — equal timestamp, greater seq.

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

func TestEventsPage_CursorReturnsEqualTimestampGreaterSeq(t *testing.T) {
	b, _ := newProductStore(t)
	w := b.World.(*pgWorld)
	ctx := context.Background()

	m := matter.MatterID(uuid.Must(uuid.NewV7()).String())
	w.AddWorkspace(rwWorkspace) // satisfies matters.workspace_id FK; EventsPage itself needs only the rows below
	w.AddMatter(m, rwWorkspace)

	at := time.Date(2026, 11, 7, 9, 0, 0, 0, time.UTC)
	for _, e := range []struct {
		seq  int64
		when time.Time
	}{
		{1, at},
		{2, at}, // same recorded_at as the cursor target: the exact OR-form boundary
		{3, at},
		{4, at.Add(time.Second)},
	} {
		if _, err := w.pool.Exec(ctx,
			`INSERT INTO domain_events (matter_id, seq, id, type, schema_version, actor_kind,
			    actor_id, target_kind, target_id, effective_at, recorded_at)
			 VALUES ($1, $2, $3, 'synthetic', 1, 'USER', $4, 'MATTER', $5, $6, $7)`,
			m.String(), e.seq, uuid.Must(uuid.NewV7()).String(), uuid.Must(uuid.NewV7()).String(),
			m.String(), e.when, e.when); err != nil {
			t.Fatalf("seed event %d: %v", e.seq, err)
		}
	}

	err := b.Store.View(ctx, func(snap port.MatterSnapshot) error {
		read, ok := snap.(port.MatterReadSnapshot)
		if !ok {
			t.Fatal("snapshot does not support event reads")
		}
		page, err := read.EventsPage(ctx, m, &matter.EventCursor{RecordedAt: at, Seq: 1}, 10)
		if err != nil {
			return err
		}
		got := make([]int64, 0, len(page.Events))
		for _, e := range page.Events {
			got = append(got, e.Seq)
		}
		want := []int64{2, 3, 4}
		if len(got) != len(want) {
			t.Fatalf("cursor (T,1) must return seqs %v, got %v", want, got)
		}
		for i := range want {
			if got[i] != want[i] {
				t.Fatalf("cursor (T,1) must return seqs %v, got %v", want, got)
			}
		}
		return nil
	})
	if err != nil {
		t.Fatal(err)
	}
}
