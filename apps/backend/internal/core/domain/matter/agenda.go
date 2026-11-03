package matter

import (
	"cmp"
	"time"
)

// ---------- My Agenda (RLF-03) ----------

// AgendaCursor is the seek position of one My Agenda page: the last emitted row's recorded due
// instant and its stable key. It carries ids only — never titles, names or counts — so a cursor
// can never leak content of a Matter whose access the caller has since lost.
type AgendaCursor struct {
	DueAt    time.Time
	MatterID MatterID
	Kind     string // "work" or "milestone"
	ID       string
}

// AgendaEntry is one dated row of the caller's cross-Matter agenda, drawn only from records the
// caller is already authorized to read at the read instant. Work rows carry the execution state
// and the derived timing; milestone rows carry the readiness state instead — a milestone is
// never given a derived timing. Every date is a recorded date: nothing computes a legal
// deadline and nothing is scheduled.
type AgendaEntry struct {
	MatterID    MatterID
	MatterTitle string
	Kind        string // "work" or "milestone"
	ItemID      string
	Title       string
	DueAt       time.Time
	Execution   string // work rows; "" for milestones
	Timing      string // work rows; "" for milestones
	Readiness   string // milestone rows; "" for work items
	Critical    bool
}

// MeAgenda is one page of the caller's agenda across the Matters they can access. No total is
// offered: rows derive per Matter snapshot at the read instant, and an uncomputed total must
// not be invented.
type MeAgenda struct {
	Entries []AgendaEntry
	Next    *AgendaCursor
	AsOf    time.Time
}

// CompareAgenda orders rows deterministically: recorded due instant, then matter, then kind,
// then id. Two distinct rows never compare equal, so a seek position is always unambiguous.
func CompareAgenda(a, b AgendaEntry) int {
	if c := a.DueAt.Compare(b.DueAt); c != 0 {
		return c
	}
	if c := cmp.Compare(a.MatterID.String(), b.MatterID.String()); c != 0 {
		return c
	}
	if c := cmp.Compare(a.Kind, b.Kind); c != 0 {
		return c
	}
	return cmp.Compare(a.ItemID, b.ItemID)
}
