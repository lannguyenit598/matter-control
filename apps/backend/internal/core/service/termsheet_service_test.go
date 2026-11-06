package service

import (
	"strings"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// parseTermSheet tests: the sheet is the deterministic "auto-fill" surface, so its parser is
// pinned exactly — header shape, closed vocabulary, per-field value carriers, named rejections.

func termSheetTable(rows ...[]string) port.Table {
	header := []string{"row_key", "field", "value_text", "value_date"}
	return port.Table{Rows: append([][]string{header}, rows...)}
}

func TestParseTermSheetAcceptsWellFormedRows(t *testing.T) {
	t.Parallel()
	rows, rejected := parseTermSheet(termSheetTable(
		[]string{"p1", "PARTY", "Công ty TNHH ABC", ""},
		[]string{"d1", "EFFECTIVE_DATE", "", "2026-12-01"},
		[]string{"d2", "RENEWAL_DATE", "", "2026-01-02T00:00:00Z"},
		[]string{"n1", "NOTICE_PERIOD", "90 days", ""},
		[]string{"v1", "VALUE_AMOUNT", "1200000000", ""},
	))
	if len(rejected) != 0 {
		t.Fatalf("no rejections expected: %+v", rejected)
	}
	if len(rows) != 5 {
		t.Fatalf("5 rows expected: %+v", rows)
	}
	if rows[1].Field != matter.TermEffectiveDate || rows[1].ValueDate == nil {
		t.Fatalf("date carrier: %+v", rows[1])
	}
	want := time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC)
	if !rows[1].ValueDate.Equal(want) {
		t.Fatalf("date normalized to UTC: %v", rows[1].ValueDate)
	}
	if !rows[2].ValueDate.Equal(time.Date(2026, 1, 2, 0, 0, 0, 0, time.UTC)) {
		t.Fatalf("RFC 3339 accepted: %v", rows[2].ValueDate)
	}
}

func TestParseTermSheetRejectsAndNamesRows(t *testing.T) {
	t.Parallel()
	rows, rejected := parseTermSheet(termSheetTable(
		[]string{"p1", "PARTY", "Bên A", ""},
		[]string{"x1", "CLAUSE", "whatever", ""},     // outside the closed vocabulary
		[]string{"x2", "PARTY", "", ""},              // text field without text
		[]string{"x3", "EFFECTIVE_DATE", "", "soon"}, // not a date
		[]string{"x4", "PARTY", "Bên B"},             // wrong cell count
		[]string{"", "PARTY", "Bên C", ""},           // missing row key
		[]string{"d1", "EFFECTIVE_DATE", "", "2026-12-01"},
		[]string{"d1", "EFFECTIVE_DATE", "", "2027-01-01"}, // duplicate field+row_key identity
	))
	if len(rows) != 2 {
		t.Fatalf("only the valid rows parsed: %+v", rows)
	}
	if len(rejected) != 6 {
		t.Fatalf("6 rejections expected: %+v", rejected)
	}
	for i, want := range []string{"row-3", "row-4", "row-5", "row-6", "row-7", "row-9"} {
		if rejected[i].RowKey != want || rejected[i].Code != "validation" {
			t.Fatalf("rejection %d = %+v, want %s/validation", i, rejected[i], want)
		}
	}
	if !strings.Contains(rejected[5].Detail, "duplicate") {
		t.Fatalf("the duplicate must be named as such: %+v", rejected[5])
	}
}

func TestParseTermSheetRefusesAnEmptySheet(t *testing.T) {
	t.Parallel()
	// An empty sheet would erase the version's lines while looking like a success; the parser
	// names it instead of writing nothing quietly.
	rows, rejected := parseTermSheet(termSheetTable())
	if len(rows) != 0 || len(rejected) != 1 || !strings.Contains(rejected[0].Detail, "no data rows") {
		t.Fatalf("empty sheet must be a named rejection: rows=%v rejected=%+v", rows, rejected)
	}
}

func TestParseTermSheetRejectsBadHeaders(t *testing.T) {
	t.Parallel()
	cases := []port.Table{
		{Rows: nil},
		{Rows: [][]string{{"row_key", "field", "value"}}},
		{Rows: [][]string{{"key", "field", "value_text", "value_date"}}},
	}
	for i, tc := range cases {
		rows, rejected := parseTermSheet(tc)
		if rows != nil || len(rejected) != 1 || rejected[0].RowKey != "header" {
			t.Fatalf("case %d: header must be rejected and named: rows=%v rejected=%+v", i, rows, rejected)
		}
	}
}

func TestTermRowHashIsContentIdentity(t *testing.T) {
	t.Parallel()
	d := time.Date(2026, 12, 1, 0, 0, 0, 0, time.UTC)
	a := termRow{Field: matter.TermParty, ValueText: "Bên A"}
	b := termRow{Field: matter.TermParty, ValueText: "Bên A"}
	c := termRow{Field: matter.TermParty, ValueText: "Bên B"}
	e := termRow{Field: matter.TermEffectiveDate, ValueDate: &d}
	f := termRow{Field: matter.TermEffectiveDate, ValueDate: &d}
	// RowKey is the identity address, not part of the content identity: same content = same hash.
	if termRowHash(a) != termRowHash(b) {
		t.Fatal("identical content must hash identically")
	}
	if termRowHash(a) == termRowHash(c) {
		t.Fatal("different content must hash differently")
	}
	if termRowHash(e) != termRowHash(f) {
		t.Fatal("identical dates must hash identically")
	}
	if strings.TrimSpace(termRowHash(a)) == "" {
		t.Fatal("hash must be non-empty")
	}
}

func TestPromotionTargetPresent(t *testing.T) {
	t.Parallel()
	const id = "synthetic-draft"
	graph := matter.WorkGraph{
		Items:      []matter.WorkItem{{ID: matter.NodeID(id)}},
		Milestones: []matter.Milestone{{ID: matter.MilestoneID(id)}},
		Context:    matter.ContextSet{Records: []matter.ContextRecord{{ID: id}}},
	}
	for _, kind := range []matter.TermPromotionKind{
		matter.TermPromotesAction, matter.TermPromotesRequirement,
		matter.TermPromotesMilestone, matter.TermPromotesContextRecord,
	} {
		if !promotionTargetPresent(graph, kind, id) || promotionTargetPresent(graph, kind, "missing") {
			t.Errorf("incorrect draft presence for %s", kind)
		}
	}
}
