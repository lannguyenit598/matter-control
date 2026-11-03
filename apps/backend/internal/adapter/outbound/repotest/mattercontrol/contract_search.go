package mattercontrol

import (
	"errors"
	"fmt"
	"testing"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

// SuiteSearch crosses the same authorization/filter/page seam on memory and PostgreSQL.
func SuiteSearch(t *testing.T, factory Factory, search func(Bundle) port.SearchStore) {
	t.Helper()
	e := newW2Env(t, factory)
	store := search(e.b)
	for i := range 205 {
		e.action(e.owner, fmt.Sprintf("Unrelated %03d", i))
	}
	for i := range 12 {
		e.action(e.owner, "Đồng tên hợp đồng")
		_ = i
	}
	e.requirement("Đồng tên hợp đồng")
	e.document("Đồng tên hợp đồng")
	read := port.SearchRead{Binding: port.SearchBinding{ActorID: e.owner.String(), Group: "workItems", Query: "dong ten", Limit: 5}}
	first, err := store.SearchPage(e.ctx, read)
	if err != nil || len(first.Items) != 5 || !first.HasMore {
		t.Fatalf("first: %+v %v", first, err)
	}
	if !first.Items[0].SameName {
		t.Fatal("duplicates beyond the page were not marked")
	}
	seen := map[string]bool{}
	page := first
	for {
		for _, item := range page.Items {
			if seen[item.ID] || item.WorkspaceName != "Acme" || item.MatterTitle != "Atlas" || item.Outcome == "" || item.Execution == "" {
				t.Fatalf("row: %+v", item)
			}
			seen[item.ID] = true
		}
		if !page.HasMore {
			break
		}
		last := page.Items[len(page.Items)-1]
		read.Anchor = port.SearchAnchor{Fingerprint: page.Fingerprint, Kind: last.Kind, ID: last.ID}
		page, err = store.SearchPage(e.ctx, read)
		if err != nil {
			t.Fatal(err)
		}
	}
	if len(seen) != 13 {
		t.Fatalf("missing late match or duplicate: %d", len(seen))
	}
	e.action(e.owner, "Not matching anything")
	if _, err = store.SearchPage(e.ctx, read); err != nil {
		t.Fatalf("nonmatch reset: %v", err)
	}
	e.action(e.owner, "Đồng tên hợp đồng")
	if _, err = store.SearchPage(e.ctx, read); !errors.Is(err, port.ErrSearchStale) {
		t.Fatalf("matching edit not stale: %v", err)
	}
	read.Anchor = port.SearchAnchor{}
	read.Binding.ActorID = e.out.String()
	hidden, err := store.SearchPage(e.ctx, read)
	if err != nil || len(hidden.Items) != 0 || hidden.HasMore {
		t.Fatalf("hidden leaked: %+v %v", hidden, err)
	}
	read.Binding.ActorID = e.owner.String()
	read.Binding.Group = "documents"
	docs, err := store.SearchPage(e.ctx, read)
	if err != nil || len(docs.Items) != 1 || docs.Items[0].Kind != "DOCUMENT" {
		t.Fatalf("documents: %+v %v", docs, err)
	}
	read.Binding.Group = "workItems"
	read.Binding.Query = "Structural"
	visible := e.action(e.owner, "Structural action")
	before, err := store.SearchPage(e.ctx, read)
	if err != nil {
		t.Fatal(err)
	}
	hiddenMatter := matter.MatterID(uuid.NewString())
	e.b.World.AddMatter(hiddenMatter, e.wsID)
	e.b.World.SetMatterMembership(hiddenMatter, e.out, matter.MatterRoleOwner, matter.StatusActive)
	e.b.World.InsertActionNode(matter.NodeID(uuid.NewString()), hiddenMatter)
	after, err := store.SearchPage(e.ctx, read)
	if err != nil || before.Fingerprint != after.Fingerprint || len(after.Items) != 1 || after.Items[0].ID != visible.ID.String() {
		t.Fatalf("hidden edit leaked to workspace OWNER: %+v %v", after, err)
	}
	read.Binding.Query = "\u0301\u0300"
	if _, err = store.SearchPage(e.ctx, read); !errors.Is(err, port.ErrSearchInvalid) {
		t.Fatalf("empty folded query: %v", err)
	}
	for _, pair := range [][2]string{{"Hồ sơ Tái Cấu Trúc", "ho so tai cau truc"}, {"ĐĐông", "ddong"}, {"A\u0302\u0301n legal", "an legal"}, {"%_ literal", "%_"}, {"Quote '\\ literal", "'\\"}, {"İ Root", "i root"}, {"ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬ", "aaaaaaaaaaaaaaaaa"}} {
		created := e.action(e.owner, pair[0])
		read.Binding.Query = pair[1]
		found, err := store.SearchPage(e.ctx, read)
		if err != nil {
			t.Fatal(err)
		}
		matched := false
		for _, row := range found.Items {
			if row.ID == created.ID.String() && row.Label == pair[0] {
				matched = true
			}
		}
		if !matched {
			t.Fatalf("normalization/literal mismatch for %q -> %q", pair[0], pair[1])
		}
	}
}
