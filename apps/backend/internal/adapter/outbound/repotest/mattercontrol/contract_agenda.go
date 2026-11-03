package mattercontrol

// RLF-03 My Agenda (GET /me/agenda): one authorized cross-Matter agenda read over recorded due
// dates with deterministic window bounds, stable keyset cursors and per-page authorization.
// The suite runs unchanged against the in-memory double and PostgreSQL.

import (
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// SuiteAgenda runs the My Agenda read-model contracts.
func SuiteAgenda(t *testing.T, newBundle Factory) {
	t.Helper()
	t.Run("agenda rows window and ordering", func(t *testing.T) { agendaBasics(t, newBundle) })
	t.Run("agenda authorization and pagination", func(t *testing.T) { agendaAuthAndPages(t, newBundle) })
}

// datedAction creates an action owned by the actor with an explicit recorded due date.
func (e *w2Env) datedAction(actor matter.ActorID, title string, due time.Time) matter.WorkItem {
	e.t.Helper()
	it := e.action(actor, title)
	if _, err := e.work.UpdateWorkItem(e.ctx, port.UpdateWorkItemCmd{
		ActorID: actor.String(), MatterID: e.m.String(), ItemID: it.ID.String(), ExpectedRevision: it.Revision,
		Due: port.OptString{Set: true, Value: due.Format(time.RFC3339)},
	}); err != nil {
		e.t.Fatalf("due date: %v", err)
	}
	return it
}

func (e *w2Env) agenda(actor matter.ActorID, q port.MeAgendaQuery) matter.MeAgenda {
	e.t.Helper()
	q.ActorID = actor.String()
	if q.Limit == 0 {
		q.Limit = 200
	}
	res, err := e.work.MeAgenda(e.ctx, q)
	if err != nil {
		e.t.Fatalf("my agenda: %v", err)
	}
	return res
}

// agendaBasics proves the rows: only dated records, both record kinds, derived timing for work
// and readiness for milestones, matter titles attached, and the window bounds applied to the
// recorded dueAt.
func agendaBasics(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	overdue := time.Now().UTC().Add(-48 * time.Hour).Truncate(time.Second)
	soon := time.Now().UTC().Add(24 * time.Hour).Truncate(time.Second)
	far := time.Now().UTC().Add(30 * 24 * time.Hour).Truncate(time.Second)

	a1 := e.datedAction(e.editor, "Overdue draft", overdue)
	e.datedAction(e.editor, "Soon draft", soon)
	// An item without a due date is never scheduled and never appears.
	e.action(e.editor, "Undated draft")
	if _, err := e.work.CreateMilestone(e.ctx, port.CreateMilestoneCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), Name: "Closing", Due: far.Format(time.RFC3339),
	}); err != nil {
		t.Fatalf("milestone: %v", err)
	}

	all := e.agenda(e.editor, port.MeAgendaQuery{})
	if len(all.Entries) != 3 {
		t.Fatalf("three dated rows expected (undated action excluded): %+v", all.Entries)
	}
	// Deterministic order: recorded instant first.
	if all.Entries[0].ItemID != a1.ID.String() || all.Entries[0].DueAt.Compare(overdue) != 0 {
		t.Fatalf("overdue work row first: %+v", all.Entries[0])
	}
	last := all.Entries[2]
	if last.Kind != "milestone" || last.Title != "Closing" || last.Readiness != string(matter.MilestoneUnassessed) || last.Execution != "" || last.Timing != "" {
		t.Fatalf("milestone row carries readiness, never timing: %+v", last)
	}
	if last.MatterTitle != "Atlas" || all.Entries[0].MatterTitle != "Atlas" {
		t.Fatalf("rows carry their matter title: %+v", all.Entries)
	}
	if w := all.Entries[0]; w.Execution != string(matter.ExecutionNotStarted) || w.Timing != string(matter.TimingOverdue) {
		t.Fatalf("work row carries execution and derived timing: %+v", w)
	}

	// Window bounds are inclusive on the recorded dueAt day (until is the inclusive named day).
	from := overdue.Add(-time.Hour)
	until := soon.Add(-time.Hour) // named day = the day of `overdue` only
	windowed := e.agenda(e.editor, port.MeAgendaQuery{From: &from, Until: &until})
	if len(windowed.Entries) != 1 || windowed.Entries[0].ItemID != a1.ID.String() {
		t.Fatalf("window keeps only the in-bound row: %+v", windowed.Entries)
	}
	emptyFrom, emptyUntil := far.Add(time.Hour), far.Add(2*time.Hour)
	empty := e.agenda(e.editor, port.MeAgendaQuery{From: &emptyFrom, Until: &emptyUntil})
	if len(empty.Entries) != 0 || empty.Next != nil {
		t.Fatalf("empty window is empty: %+v", empty)
	}
}

// agendaAuthAndPages proves stable keyset paging and per-page authorization: a second matter's
// rows disappear after the membership is revoked, cursors carry ids only, and an outsider or a
// membership-revoked caller sees nothing.
func agendaAuthAndPages(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
	m2 := w1.mustMatter(e.owner, e.wsID, "Borealis").MatterID
	for _, user := range []matter.ActorID{e.editor, e.viewer} {
		if err := w1.grantMatter(e.owner, m2, user, "EDITOR", w1.matterRevision(e.owner, e.wsID, m2)); err != nil {
			t.Fatal(err)
		}
	}
	// Rows in both matters at staggered instants.
	e.datedAction(e.editor, "Atlas row", time.Now().UTC().Add(2*time.Hour))
	if _, err := e.work.CreateMilestone(e.ctx, port.CreateMilestoneCmd{
		ActorID: e.owner.String(), MatterID: m2.String(), Name: "Borealis gate", Due: time.Now().UTC().Add(4 * time.Hour).Format(time.RFC3339),
	}); err != nil {
		t.Fatalf("milestone: %v", err)
	}
	e.datedAction(e.editor, "Later Atlas row", time.Now().UTC().Add(6*time.Hour))

	// Page through with limit 1: strictly increasing keys, ends without a cursor.
	var seen []matter.AgendaEntry
	var after *matter.AgendaCursor
	for page := 0; ; page++ {
		if page > 10 {
			t.Fatal("pagination did not terminate")
		}
		res := e.agenda(e.editor, port.MeAgendaQuery{After: after, Limit: 1})
		for _, en := range res.Entries {
			if n := len(seen); n > 0 && matter.CompareAgenda(seen[n-1], en) >= 0 {
				t.Fatalf("page order regressed: %+v after %+v", seen[n-1], en)
			}
			seen = append(seen, en)
		}
		if res.Next == nil {
			break
		}
		after = res.Next
	}
	if len(seen) != 3 {
		t.Fatalf("all rows reachable through pages: %+v", seen)
	}

	// Revoking the editor's matter-2 membership removes its rows on the next read; the old
	// cursor content stays harmless.
	if _, err := e.ws.RevokeMatterMembership(e.ctx, port.RevokeMatterMembershipCmd{
		ActorID: e.owner.String(), MatterID: m2.String(), UserID: e.editor.String(), ExpectedRevision: w1.matterRevision(e.owner, e.wsID, m2),
	}); err != nil {
		t.Fatal(err)
	}
	res := e.agenda(e.editor, port.MeAgendaQuery{Limit: 200})
	if len(res.Entries) != 2 || res.Entries[0].MatterID == m2 || res.Entries[1].MatterID == m2 {
		t.Fatalf("revoked matter's rows are gone: %+v", res.Entries)
	}
	// A viewer keeps their rows; an outsider sees nothing.
	vres := e.agenda(e.viewer, port.MeAgendaQuery{Limit: 200})
	if len(vres.Entries) != 3 {
		t.Fatalf("viewer keeps all authorized rows: %+v", vres.Entries)
	}
	ores := e.agenda(e.out, port.MeAgendaQuery{Limit: 200})
	if len(ores.Entries) != 0 {
		t.Fatalf("outsider sees nothing: %+v", ores.Entries)
	}
}
