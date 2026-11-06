package service_test

// MC-BE-FIXWAVE-20261106 W2 (BE-R1-01): replace-per-version semantics drop the prior lines that
// the new sheet no longer carries. The import result must report how many lines were deleted —
// created/replaced/unchanged alone hide a silent erasure. Failing-before: the Deleted field does
// not exist yet, so this file does not compile until the fix lands.

import (
	"context"
	"errors"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
	"leonx.me/matter-control/internal/adapter/outbound/sheet"
	"leonx.me/matter-control/internal/adapter/outbound/system"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

func newTermSheetSUT(t *testing.T) (*service.TermSheets, *mattercontrol.MemoryWorld) {
	t.Helper()
	n := 0
	clock := func() time.Time { n++; return fixtureBase.Add(time.Duration(n) * time.Second) }
	store := mattercontrol.NewMemoryStore(clock)
	world := mattercontrol.NewMemoryWorld(store)
	seed(t, world)
	work := service.NewWorkService(store, system.RecordIDv7{}, discardLogger(), matter.KeyAgePolicy{})
	// A directly seeded matter header carries revision 0, which the import CAS refuses by design
	// (expected==0 is precondition-required). One receipted create bumps the header to revision 1,
	// the state a matter reaches through its real creation command.
	msvc := service.NewMatterService(store, system.RecordIDv7{}, discardLogger(), matter.KeyAgePolicy{})
	if _, err := msvc.CreateRequirement(context.Background(), createCmd(editorID, newKey(), anyHash)); err != nil {
		t.Fatal(err)
	}
	return service.NewTermSheetService(work, sheet.Codec{}), world
}

// seedContractVersion pins one document version into the matter — the replace target of the import.
func seedContractVersion(t *testing.T, world *mattercontrol.MemoryWorld, docID matter.DocumentID, verID matter.VersionID) {
	t.Helper()
	ctx := context.Background()
	err := world.Store().Execute(ctx, matterA, func(tx port.MatterTx) error {
		et, ok := tx.(port.EvidenceTx)
		if !ok {
			return errors.New("memory tx does not support evidence writes")
		}
		if err := et.InsertDocument(ctx, matter.Document{ID: docID, MatterID: matterA, Name: "synthetic contract.pdf", Revision: 1}); err != nil {
			return err
		}
		return et.InsertVersion(ctx, matter.DocumentVersion{
			ID: verID, MatterID: matterA, DocumentID: docID, No: 1,
			Filename: "synthetic contract.pdf", MediaType: "application/pdf",
			SHA256: strings.Repeat("ab", 32), SizeBytes: 10, UploadedBy: editorID, UploadedAt: fixtureBase,
		})
	})
	if err != nil {
		t.Fatal(err)
	}
}

// matterRevisionOf reads the current matter revision through the authorized read path, so the
// import CAS targets the real header instead of a guessed constant.
func matterRevisionOf(t *testing.T, svc *service.TermSheets) int64 {
	t.Helper()
	view, err := svc.ListTermLines(context.Background(), port.ListTermLinesQuery{ActorID: editorID.String(), MatterID: matterA.String()})
	if err != nil {
		t.Fatal(err)
	}
	return view.MatterRevision
}

// TestImportTermSheet_ReportsDeletedLines: the second sheet drops the n1 row; the result must say
// deleted=1, not only created/replaced/unchanged.
func TestImportTermSheet_ReportsDeletedLines(t *testing.T) {
	svc, world := newTermSheetSUT(t)
	ctx := context.Background()
	docID := matter.DocumentID(uuid.Must(uuid.NewV7()).String())
	verID := matter.VersionID(uuid.Must(uuid.NewV7()).String())
	seedContractVersion(t, world, docID, verID)

	full := "row_key,field,value_text,value_date\n" +
		"p1,PARTY,Công ty TNHH ABC,\n" +
		"d1,EFFECTIVE_DATE,,2026-12-01\n" +
		"n1,NOTICE_PERIOD,90 days,\n"
	trimmed := "row_key,field,value_text,value_date\n" +
		"p1,PARTY,Công ty TNHH ABC,\n" +
		"d1,EFFECTIVE_DATE,,2026-12-01\n"

	first, err := svc.ImportTermSheet(ctx, port.ImportTermSheetCmd{
		ActorID: editorID.String(), MatterID: matterA.String(), DocumentVersionID: verID.String(),
		ExpectedRevision: matterRevisionOf(t, svc), IdempotencyKey: newKey(), RequestHash: strings.Repeat("ab", 32),
		Format: "csv", Sheet: strings.NewReader(full), MaxBytes: 1 << 20,
	})
	if err != nil || first.Created != 3 {
		t.Fatalf("seed import: %+v %v", first, err)
	}
	second, err := svc.ImportTermSheet(ctx, port.ImportTermSheetCmd{
		ActorID: editorID.String(), MatterID: matterA.String(), DocumentVersionID: verID.String(),
		ExpectedRevision: matterRevisionOf(t, svc), IdempotencyKey: newKey(), RequestHash: strings.Repeat("cd", 32),
		Format: "csv", Sheet: strings.NewReader(trimmed), MaxBytes: 1 << 20,
	})
	if err != nil {
		t.Fatal(err)
	}
	// Contract semantics (contract_termsheet.go): Created counts records written, Replaced counts
	// this version's prior lines that did not survive, Unchanged the byte-identical keeps. The
	// dropped n1 is both "did not survive" (Replaced) and "dropped outright" (Deleted).
	if second.Created != 0 || second.Replaced != 1 || second.Unchanged != 2 {
		t.Fatalf("replace counts: %+v", second)
	}
	if second.Deleted != 1 {
		t.Fatalf("the dropped line n1 must be reported as deleted=1: %+v", second)
	}
}
