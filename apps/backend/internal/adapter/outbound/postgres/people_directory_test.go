package postgres

import (
	"context"
	"fmt"
	"testing"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/core/domain/matter"
)

func TestLocalPeopleDirectoryIssuerOwnerAndLimit(t *testing.T) {
	b, _ := newProductStore(t)
	w := b.World.(*pgWorld)
	ctx := context.Background()
	owner, ws := matter.ActorID(uuid.NewString()), matter.WorkspaceID(uuid.NewString())
	w.AddUser(owner)
	w.AddWorkspace(ws)
	w.SetWorkspaceMembership(ws, owner, matter.WorkspaceRoleOwner, matter.StatusActive)
	for i := 0; i < 24; i++ {
		id := matter.ActorID(uuid.NewString())
		w.AddUser(id)
		_, err := w.pool.Exec(ctx, `UPDATE users SET display_name=$2 WHERE id=$1`, id.String(), fmt.Sprintf("Alex %02d", i))
		w.check("name", err)
	}
	other := matter.ActorID(uuid.NewString())
	w.AddUser(other)
	_, err := w.pool.Exec(ctx, `UPDATE users SET idp_issuer='https://other.example.test',display_name='Alex foreign' WHERE id=$1`, other.String())
	w.check("issuer", err)
	r := NewIdentityResolver(w.pool)
	people, err := r.SearchWorkspacePeople(ctx, ws.String(), owner.String(), "aLeX")
	if err != nil || len(people) != 20 {
		t.Fatalf("bounded search: %d %v", len(people), err)
	}
	for _, p := range people {
		if p.UserID == other.String() || p.UserID == owner.String() {
			t.Fatal("directory leaked out-of-scope user")
		}
	}
	people, err = r.SearchWorkspacePeople(ctx, ws.String(), owner.String(), "Alex 23")
	if err != nil || len(people) != 1 {
		t.Fatalf("search: %v %v", people, err)
	}
	w.SetWorkspaceMembership(ws, owner, matter.WorkspaceRoleMember, matter.StatusActive)
	people, err = r.SearchWorkspacePeople(ctx, ws.String(), owner.String(), "")
	if err != nil || len(people) != 0 {
		t.Fatalf("non-owner disclosure: %v %v", people, err)
	}
}
