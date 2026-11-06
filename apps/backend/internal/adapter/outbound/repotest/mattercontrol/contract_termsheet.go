package mattercontrol

// MC-ZCODE-TERMSHEET-01 contract: content-hash idempotent import and receipted promotion with the
// fixed field→target mapping. Runs on the memory double and PostgreSQL.

import (
	"errors"
	"io"
	"strings"
	"testing"

	"leonx.me/matter-control/internal/adapter/outbound/sheet"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

// SuiteTermSheets runs the term-sheet contracts.
func SuiteTermSheets(t *testing.T, newBundle Factory) {
	t.Run("promotion keeps foreign lines hidden", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		source := *e
		source.m = (w1Env{t: t, ws: e.ws, ctx: e.ctx}).mustMatter(e.owner, e.wsID, "Private source").MatterID
		source.editor = e.owner
		version := termSheetVersion(&source)
		svc := termSheetService(e)
		importTermSheet(t, &source, svc, source.owner, version, termSheetCSV("n1,NOTE,hidden synthetic term,"))
		line := listTermLines(t, &source, svc, source.owner)[0]
		foreignImport := termSheetCommand(t, e, svc, e.editor, version, termSheetCSV("n1,NOTE,foreign reference,"))
		if _, err := svc.ImportTermSheet(e.ctx, foreignImport); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("a foreign source version must be hidden: %v", err)
		}
		_, denied := svc.ListTermLines(e.ctx, port.ListTermLinesQuery{ActorID: e.editor.String(), MatterID: source.m.String()})
		if denied == nil {
			t.Fatal("fixture editor can read private source")
		}
		result, err := svc.PromoteTermLine(e.ctx, port.PromoteTermLineCmd{
			ActorID: e.editor.String(), MatterID: e.m.String(), TermLineID: line.ID.String(),
			IdempotencyKey: newKey(), RequestHash: anyHash, ExpectedRevision: line.Revision,
		})
		if err == nil {
			target := e.detail(matter.NodeID(result.TargetID))
			t.Fatalf("cross-matter promotion succeeded and copied title %q", target.View.Item.Title)
		}
		if !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("expected uniform not-found: %v", err)
		}
	})
	t.Run("promotion receipt survives a source line lost before the promoted-line guard", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		svc := termSheetService(e)
		version := termSheetVersion(e)
		importTermSheet(t, e, svc, e.owner, version, termSheetCSV("n1,NOTE,original,"))
		line := listTermLines(t, e, svc, e.owner)[0]
		cmd := port.PromoteTermLineCmd{
			ActorID: e.owner.String(), MatterID: e.m.String(), TermLineID: line.ID.String(),
			IdempotencyKey: newKey(), RequestHash: anyHash, ExpectedRevision: line.Revision,
		}
		first, err := svc.PromoteTermLine(e.ctx, cmd)
		if err != nil {
			t.Fatal(err)
		}
		// Data written before the guard existed: the promoted source line is gone while its
		// receipt and draft remain. Production imports can no longer reach this state, so the
		// fixture removes the line through the store seam directly.
		if err := e.b.Store.Execute(e.ctx, e.m, func(tx port.MatterTx) error {
			tt, ok := tx.(port.MatterTermSheetTx)
			if !ok {
				return errors.New("store transaction does not support term lines")
			}
			return tt.ReplaceTermLinesOfDocumentVersion(e.ctx, e.m, version, nil)
		}); err != nil {
			t.Fatalf("remove the source line: %v", err)
		}
		if lines := listTermLines(t, e, svc, e.owner); len(lines) != 0 {
			t.Fatalf("the source line must be gone before the replay: %+v", lines)
		}
		replay, err := svc.PromoteTermLine(e.ctx, cmd)
		if err != nil || !replay.Replayed || replay.TargetID != first.TargetID || replay.TargetKind != first.TargetKind || replay.TargetMissing {
			t.Fatalf("receipt did not replay after the source line was lost: %+v, %v", replay, err)
		}
		page, err := e.work.ListWorkItems(e.ctx, port.ListWorkItemsQuery{ActorID: e.owner.String(), MatterID: e.m.String()})
		if err != nil {
			t.Fatal(err)
		}
		drafts := 0
		for _, v := range page.Items {
			if v.Item.Title == "NOTE: original" {
				drafts++
			}
		}
		if drafts != 1 {
			t.Fatalf("replay must keep exactly one draft, found %d", drafts)
		}
	})
	t.Helper()
	t.Run("import receipt survives a newer sheet", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		svc := termSheetService(e)
		version := termSheetVersion(e)
		original := termSheetCSV("n1,NOTE,original,")
		cmd := termSheetCommand(t, e, svc, e.editor, version, original)
		first, err := svc.ImportTermSheet(e.ctx, cmd)
		if err != nil || first.Created != 1 {
			t.Fatalf("initial import: %+v, %v", first, err)
		}
		importTermSheet(t, e, svc, e.owner, version, termSheetCSV("n1,NOTE,replaced,"))
		e.b.World.SetElapsedBoundary(e.m)
		cmd.Sheet = strings.NewReader(original)
		if _, err := svc.ImportTermSheet(e.ctx, cmd); !errors.Is(err, matter.ErrBoundaryDue) {
			t.Fatalf("expected a retryable temporal boundary: %v", err)
		}
		e.b.World.SetFutureBoundary(e.m)
		cmd.Sheet = strings.NewReader(original)
		replay, err := svc.ImportTermSheet(e.ctx, cmd)
		if err != nil || !replay.Replayed || replay.Created != first.Created {
			t.Fatalf("replay must use the persisted outcome: %+v, %v", replay, err)
		}
		cmd.Sheet = strings.NewReader(original)
		stale := cmd
		stale.IdempotencyKey = newKey()
		if _, err := svc.ImportTermSheet(e.ctx, stale); !errors.Is(err, port.ErrPreconditionFailed) {
			t.Fatalf("stale import must fail CAS: %v", err)
		}
		if got := listTermLines(t, e, svc, e.owner)[0].ValueText; got != "replaced" {
			t.Fatalf("old content overwrote the newer sheet: %q", got)
		}
		w1 := w1Env{t: t, ws: e.ws, ctx: e.ctx}
		if err := w1.revokeMatter(e.owner, e.m, e.editor, w1.matterRevision(e.owner, e.wsID, e.m)); err != nil {
			t.Fatal(err)
		}
		cmd.Sheet = strings.NewReader(original)
		if _, err := svc.ImportTermSheet(e.ctx, cmd); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("receipt must be hidden after access revocation: %v", err)
		}
	})
	t.Run("promoted lines are locked against replacement", func(t *testing.T) { termSheetPromotedLockContract(t, newBundle) })
	t.Run("promotion requires an expected revision", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		svc := termSheetService(e)
		importTermSheet(t, e, svc, e.owner, termSheetVersion(e), termSheetCSV("n1,NOTE,x,"))
		line := listTermLines(t, e, svc, e.owner)[0]
		_, err := svc.PromoteTermLine(e.ctx, port.PromoteTermLineCmd{
			ActorID: e.owner.String(), MatterID: e.m.String(), TermLineID: line.ID.String(),
			IdempotencyKey: newKey(), RequestHash: anyHash,
		})
		if !errors.Is(err, port.ErrPreconditionRequired) {
			t.Fatalf("missing expectedRevision must be precondition-required: %v", err)
		}
	})
	t.Run("import decodes only after authorization", func(t *testing.T) {
		e := newW2Env(t, newBundle)
		codec := &countingCodec{SheetCodec: sheet.Codec{}}
		svc := service.NewTermSheetService(e.work, codec)
		version := termSheetVersion(e)
		for _, actor := range []matter.ActorID{e.viewer, e.out} {
			cmd := termSheetCommand(t, e, termSheetService(e), actor, version, termSheetCSV("p1,PARTY,Bên A,"))
			if _, err := svc.ImportTermSheet(e.ctx, cmd); err == nil {
				t.Fatalf("%s import must be refused", actor)
			}
		}
		if codec.calls != 0 {
			t.Fatalf("an unauthorized import decoded the sheet %d times", codec.calls)
		}
	})
	t.Run("import idempotency and replace", func(t *testing.T) { termSheetImportContract(t, newBundle) })
	t.Run("promotion mapping receipt and guards", func(t *testing.T) { termSheetPromotionContract(t, newBundle) })
}

func termSheetVersion(e *w2Env) matter.VersionID {
	doc := e.document("Synthetic contract")
	return e.version(doc.Document.ID.String(), strings.Repeat("a", 64))
}

// termSheetService builds the service under test on the env's store and work service.
func termSheetService(e *w2Env) *service.TermSheets {
	return service.NewTermSheetService(e.work, sheet.Codec{})
}

func termSheetCSV(rows ...string) string {
	body := []string{"row_key,field,value_text,value_date"}
	body = append(body, rows...)
	return strings.Join(body, "\n")
}

func importTermSheet(t *testing.T, e *w2Env, svc *service.TermSheets, actor matter.ActorID, version matter.VersionID, csv string) port.TermSheetImportResult {
	t.Helper()
	res, err := svc.ImportTermSheet(e.ctx, termSheetCommand(t, e, svc, actor, version, csv))
	if err != nil {
		t.Fatalf("import: %v", err)
	}
	return res
}

func termSheetCommand(t *testing.T, e *w2Env, svc *service.TermSheets, actor matter.ActorID, version matter.VersionID, csv string) port.ImportTermSheetCmd {
	t.Helper()
	view, err := svc.ListTermLines(e.ctx, port.ListTermLinesQuery{ActorID: e.owner.String(), MatterID: e.m.String()})
	if err != nil {
		t.Fatal(err)
	}
	return port.ImportTermSheetCmd{
		ActorID: actor.String(), MatterID: e.m.String(), DocumentVersionID: version.String(),
		IdempotencyKey: newKey(), RequestHash: anyHash, ExpectedRevision: view.MatterRevision,
		Format: "csv", Sheet: strings.NewReader(csv), MaxBytes: 1 << 20,
	}
}

func listTermLines(t *testing.T, e *w2Env, svc *service.TermSheets, actor matter.ActorID) []matter.TermLine {
	t.Helper()
	lines, err := svc.ListTermLines(e.ctx, port.ListTermLinesQuery{ActorID: actor.String(), MatterID: e.m.String()})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	return lines.Lines
}

func termSheetImportContract(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	svc := termSheetService(e)
	version := termSheetVersion(e)

	// First import creates every parsed line.
	res := importTermSheet(t, e, svc, e.owner, version, termSheetCSV(
		"p1,PARTY,Công ty TNHH ABC,",
		"d1,EFFECTIVE_DATE,,2026-12-01",
		"n1,NOTICE_PERIOD,90 days,",
	))
	if res.Created != 3 || res.Replaced != 0 || res.Unchanged != 0 || len(res.Rejected) != 0 {
		t.Fatalf("first import: %+v", res)
	}
	lines := listTermLines(t, e, svc, e.owner)
	if len(lines) != 3 {
		t.Fatalf("three lines: %+v", lines)
	}
	var party, effective matter.TermLine
	for _, l := range lines {
		switch l.Field {
		case matter.TermParty:
			party = l
		case matter.TermEffectiveDate:
			effective = l
		}
	}
	if party.ValueText != "Công ty TNHH ABC" || effective.ValueDate == nil {
		t.Fatalf("value carriers: party=%+v effective=%+v", party, effective)
	}

	// The same bytes are a full no-op.
	res = importTermSheet(t, e, svc, e.owner, version, termSheetCSV(
		"p1,PARTY,Công ty TNHH ABC,",
		"d1,EFFECTIVE_DATE,,2026-12-01",
		"n1,NOTICE_PERIOD,90 days,",
	))
	if res.Created != 0 || res.Replaced != 0 || res.Unchanged != 3 {
		t.Fatalf("re-import: %+v", res)
	}

	// Changed bytes create a new fact identity (the changed row is a new line); unchanged facts
	// keep theirs. Replaced counts this version's prior lines that did not survive.
	partyID := party.ID
	res = importTermSheet(t, e, svc, e.owner, version, termSheetCSV(
		"p1,PARTY,Công ty CP XYZ,",
		"d1,EFFECTIVE_DATE,,2026-12-01",
		"n1,NOTICE_PERIOD,90 days,",
		"g1,GOVERNING_LAW,Việt Nam,",
	))
	if res.Created != 2 || res.Replaced != 1 || res.Unchanged != 2 {
		t.Fatalf("changed import: %+v", res)
	}
	lines = listTermLines(t, e, svc, e.owner)
	if len(lines) != 4 {
		t.Fatalf("four lines after replace: %+v", lines)
	}
	for _, l := range lines {
		if l.Field == matter.TermParty && l.ValueText == "Công ty CP XYZ" && l.ID == partyID {
			t.Fatalf("a replaced fact kept the old identity: %+v", l)
		}
	}

	// A rejected row fails the WHOLE import and names the row; nothing is written.
	res = importTermSheet(t, e, svc, e.owner, version, termSheetCSV(
		"p1,PARTY,Công ty CP XYZ,",
		"b1,CLAUSE,sneaky,",
	))
	if len(res.Rejected) != 1 || res.Rejected[0].RowKey != "row-3" {
		t.Fatalf("rejection names the row: %+v", res)
	}
	if got := len(listTermLines(t, e, svc, e.owner)); got != 4 {
		t.Fatalf("rejected import must write nothing: %d lines", got)
	}

	// A non-editor cannot import.
	if _, err := svc.ImportTermSheet(e.ctx, termSheetCommand(t, e, svc, e.viewer, version, termSheetCSV("p1,PARTY,Bên A,"))); err == nil {
		t.Fatal("viewer import must be refused")
	}
}

func termSheetPromotionContract(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	svc := termSheetService(e)
	version := termSheetVersion(e)
	importTermSheet(t, e, svc, e.owner, version, termSheetCSV(
		"p1,PARTY,Công ty TNHH ABC,",
		"d1,EFFECTIVE_DATE,,2026-12-01",
		"n1,NOTICE_PERIOD,90 days,",
		"g1,GOVERNING_LAW,Việt Nam,",
	))
	lines := listTermLines(t, e, svc, e.owner)
	byField := map[matter.TermField]matter.TermLine{}
	for _, l := range lines {
		byField[l.Field] = l
	}

	promote := func(t *testing.T, actor matter.ActorID, line matter.TermLine, rev int64, key string) port.PromotedTermLine {
		t.Helper()
		out, err := svc.PromoteTermLine(e.ctx, port.PromoteTermLineCmd{
			ActorID: actor.String(), MatterID: e.m.String(), TermLineID: line.ID.String(),
			IdempotencyKey: key, RequestHash: anyHash, ExpectedRevision: rev,
		})
		if err != nil {
			t.Fatalf("promote %s: %v", line.Field, err)
		}
		if out.TargetID == "" || out.LineID != line.ID {
			t.Fatalf("promotion link: %+v", out)
		}
		return out
	}

	// Each field maps to its fixed target kind, and the line carries the link.
	partyKey := newKey()
	p1 := promote(t, e.owner, byField[matter.TermParty], byField[matter.TermParty].Revision, partyKey)
	if p1.TargetKind != matter.TermPromotesContextRecord {
		t.Fatalf("PARTY target: %+v", p1)
	}
	d1 := promote(t, e.owner, byField[matter.TermEffectiveDate], byField[matter.TermEffectiveDate].Revision, newKey())
	if d1.TargetKind != matter.TermPromotesMilestone || d1.TargetID == p1.TargetID {
		t.Fatalf("EFFECTIVE_DATE target: %+v", d1)
	}
	n1 := promote(t, e.owner, byField[matter.TermNoticePeriod], byField[matter.TermNoticePeriod].Revision, newKey())
	if n1.TargetKind != matter.TermPromotesAction {
		t.Fatalf("NOTICE_PERIOD target: %+v", n1)
	}
	g1 := promote(t, e.owner, byField[matter.TermGoverningLaw], byField[matter.TermGoverningLaw].Revision, newKey())
	if g1.TargetKind != matter.TermPromotesRequirement {
		t.Fatalf("GOVERNING_LAW target: %+v", g1)
	}

	// The same key replays the stored outcome: same target, Replayed=true.
	replay, err := svc.PromoteTermLine(e.ctx, port.PromoteTermLineCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), TermLineID: byField[matter.TermParty].ID.String(),
		IdempotencyKey: partyKey, RequestHash: anyHash, ExpectedRevision: byField[matter.TermParty].Revision,
	})
	if err != nil || !replay.Replayed || replay.TargetID != p1.TargetID {
		t.Fatalf("replay: %+v (%v)", replay, err)
	}

	// An already-promoted line is rejected under a new key.
	if _, err := svc.PromoteTermLine(e.ctx, port.PromoteTermLineCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), TermLineID: byField[matter.TermParty].ID.String(),
		IdempotencyKey: newKey(), RequestHash: anyHash, ExpectedRevision: byField[matter.TermParty].Revision + 1,
	}); err == nil || !strings.Contains(err.Error(), "term-already-promoted") {
		t.Fatalf("double promotion must be rejected: %v", err)
	}

	// A stale revision is a typed conflict, not a silent overwrite.
	if _, err := svc.PromoteTermLine(e.ctx, port.PromoteTermLineCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), TermLineID: byField[matter.TermEffectiveDate].ID.String(),
		IdempotencyKey: newKey(), RequestHash: anyHash, ExpectedRevision: byField[matter.TermEffectiveDate].Revision,
	}); err == nil {
		t.Fatal("a stale revision must be a conflict")
	}
}

// countingCodec records how often a sheet is decoded.
type countingCodec struct {
	port.SheetCodec
	calls int
}

func (c *countingCodec) Decode(format string, r io.Reader, maxBytes int64) (port.Table, error) {
	c.calls++
	return c.SheetCodec.Decode(format, r, maxBytes)
}

// termSheetPromotedLockContract: a re-import may neither change nor drop a promoted fact; the whole
// import is refused and names the fact, so promotion links survive and no duplicate draft appears.
func termSheetPromotedLockContract(t *testing.T, newBundle Factory) {
	e := newW2Env(t, newBundle)
	svc := termSheetService(e)
	version := termSheetVersion(e)
	importTermSheet(t, e, svc, e.owner, version, termSheetCSV("n1,NOTE,original,", "n2,NOTE,other,"))
	var promoted matter.TermLine
	for _, l := range listTermLines(t, e, svc, e.owner) {
		if l.RowKey == "n1" {
			promoted = l
		}
	}
	if _, err := svc.PromoteTermLine(e.ctx, port.PromoteTermLineCmd{
		ActorID: e.owner.String(), MatterID: e.m.String(), TermLineID: promoted.ID.String(),
		IdempotencyKey: newKey(), RequestHash: anyHash, ExpectedRevision: promoted.Revision,
	}); err != nil {
		t.Fatal(err)
	}
	promoted = listTermLines(t, e, svc, e.owner)[0]
	if promoted.RowKey != "n1" || promoted.PromotedRef == "" {
		t.Fatalf("promoted line: %+v", promoted)
	}
	revision := termSheetCommand(t, e, svc, e.owner, version, "").ExpectedRevision

	// Changing the promoted row is refused by sheet position.
	res := importTermSheet(t, e, svc, e.owner, version, termSheetCSV("n1,NOTE,changed,", "n2,NOTE,other,"))
	if len(res.Rejected) != 1 || res.Rejected[0].RowKey != "row-2" || res.Rejected[0].Code != "promoted" {
		t.Fatalf("changed promoted row must be refused by position: %+v", res)
	}
	// Dropping the promoted row is refused by its stored identity.
	res = importTermSheet(t, e, svc, e.owner, version, termSheetCSV("n2,NOTE,other,"))
	if len(res.Rejected) != 1 || res.Rejected[0].RowKey != "NOTE:n1" || res.Rejected[0].Code != "promoted" {
		t.Fatalf("dropped promoted row must be refused by identity: %+v", res)
	}
	lines := listTermLines(t, e, svc, e.owner)
	if len(lines) != 2 || lines[0].ID != promoted.ID || lines[0].PromotedRef != promoted.PromotedRef || lines[0].ValueText != "original" {
		t.Fatalf("refused imports must write nothing: %+v", lines)
	}
	if got := termSheetCommand(t, e, svc, e.owner, version, "").ExpectedRevision; got != revision {
		t.Fatalf("refused imports moved the matter revision %d -> %d", revision, got)
	}

	// Other rows still change; the promoted fact keeps its identity and link.
	res = importTermSheet(t, e, svc, e.owner, version, termSheetCSV("n1,NOTE,original,", "n2,NOTE,changed,"))
	if len(res.Rejected) != 0 || res.Created != 1 || res.Unchanged != 1 {
		t.Fatalf("unpromoted rows must stay replaceable: %+v", res)
	}
	for _, l := range listTermLines(t, e, svc, e.owner) {
		if l.RowKey == "n1" && (l.ID != promoted.ID || l.PromotedRef != promoted.PromotedRef) {
			t.Fatalf("promoted fact lost its link: %+v", l)
		}
	}
}
