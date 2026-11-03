package productapi

import (
	"context"
	"net/http"
	"testing"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
)

func (f fakeResolver) SearchWorkspacePeople(_ context.Context, _, _, _ string) ([]port.PersonOption, error) {
	return []port.PersonOption{{UserID: f["s-bob"], DisplayName: "Bob Nguyen"}}, nil
}

func TestWorkspaceDirectoryOptInAndOwnerOnly(t *testing.T) {
	for _, enabled := range []bool{false, true} {
		e := newEnvSized(t, 64, enabled)
		ws := matter.WorkspaceID(uuid.NewString())
		e.world.AddWorkspace(ws)
		e.world.SetWorkspaceMembership(ws, matter.ActorID(e.alice), matter.WorkspaceRoleOwner, matter.StatusActive)
		e.world.SetWorkspaceMembership(ws, matter.ActorID(e.bob), matter.WorkspaceRoleMember, matter.StatusActive)
		path := "/api/v1/workspaces/" + ws.String() + "/member-candidates"
		e.expect(e.do("GET", path, "", nil, ""), 401, "urn:mc:unauthenticated")
		if !enabled {
			e.expect(e.do("GET", path, "t-alice", nil, ""), 404, "urn:mc:not-found")
			continue
		}
		e.expect(e.do("GET", path, "t-bob", nil, ""), 403, "urn:mc:forbidden")
		e.expect(e.do("GET", path, "t-carol", nil, ""), 404, "urn:mc:not-found")
		r := e.do("GET", path, "t-alice", nil, "")
		e.expect(r, 200, "")
		if r.json()["items"].([]any)[0].(map[string]any)["displayName"] != "Bob Nguyen" {
			t.Fatal("missing display name")
		}
	}
}

func TestMatterMemberCandidatesRequireOwnerAndActiveWorkspace(t *testing.T) {
	e := newEnv(t)
	ws, mid := uuid.NewString(), uuid.NewString()
	e.world.AddWorkspace(matter.WorkspaceID(ws))
	e.world.AddMatter(matter.MatterID(mid), matter.WorkspaceID(ws))
	e.world.SetWorkspaceMembership(matter.WorkspaceID(ws), matter.ActorID(e.alice), matter.WorkspaceRoleMember, matter.StatusActive)
	e.world.SetWorkspaceMembership(matter.WorkspaceID(ws), matter.ActorID(e.bob), matter.WorkspaceRoleMember, matter.StatusActive)
	e.world.SetMatterMembership(matter.MatterID(mid), matter.ActorID(e.alice), matter.MatterRoleOwner, matter.StatusActive)
	e.world.SetMatterMembership(matter.MatterID(mid), matter.ActorID(e.bob), matter.MatterRoleViewer, matter.StatusActive)
	path := "/api/v1/matters/" + mid + "/member-candidates"
	e.expect(e.do("GET", path, "", nil, ""), http.StatusUnauthorized, "urn:mc:unauthenticated")
	e.expect(e.do("GET", path, "t-carol", nil, ""), http.StatusNotFound, "urn:mc:not-found")
	e.expect(e.do("GET", path, "t-bob", nil, ""), http.StatusForbidden, "urn:mc:forbidden")
	r := e.do("GET", path, "t-alice", nil, "")
	e.expect(r, http.StatusOK, "")
	if got := len(r.json()["items"].([]any)); got != 2 {
		t.Fatalf("candidate count=%d", got)
	}
	e.world.SetWorkspaceMembership(matter.WorkspaceID(ws), matter.ActorID(e.alice), matter.WorkspaceRoleMember, matter.StatusRevoked)
	e.expect(e.do("GET", path, "t-alice", nil, ""), http.StatusNotFound, "urn:mc:not-found")
}
