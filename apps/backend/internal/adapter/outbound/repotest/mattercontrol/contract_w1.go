package mattercontrol

// Shared W1 contract: workspace/matter administration, membership revocation,
// last-owner protection, scoped reads, history paging, own-receipt and concurrency. It
// runs unchanged against the in-memory double and the PostgreSQL adapter and asserts
// only service-visible behavior plus the World's row counts.

import (
	"context"
	"errors"
	"sync"
	"testing"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

const otherHash = "0000000000000000000000000000000000000000000000000000000000000001"

func newActor(b Bundle) matter.ActorID {
	a := matter.ActorID(uuid.Must(uuid.NewV7()).String())
	b.World.AddUser(a)
	return a
}

func w1Service(t *testing.T, b Bundle, store port.MatterStore) port.WorkspaceService {
	t.Helper()
	ws, ok := store.(port.WorkspaceStore)
	if !ok {
		t.Fatal("store does not implement port.WorkspaceStore")
	}
	ids := port.RecordIDGenerator(kitIDs{})
	if b.IDs != nil {
		ids = b.IDs
	}
	return service.NewWorkspaceService(ws, ids, discardLogger(), matter.KeyAgePolicy{})
}

type w1Env struct {
	t   *testing.T
	ws  port.WorkspaceService
	ctx context.Context
}

func (e w1Env) createWorkspace(actor matter.ActorID, key, hash, name string) (matter.WorkspaceCreatedResult, error) {
	return e.ws.CreateWorkspace(e.ctx, port.CreateWorkspaceCmd{ActorID: actor.String(), Name: name, IdempotencyKey: key, RequestHash: hash})
}

func (e w1Env) mustWorkspace(actor matter.ActorID, name string) matter.Workspace {
	e.t.Helper()
	res, err := e.createWorkspace(actor, newKey(), anyHash, name)
	if err != nil {
		e.t.Fatalf("create workspace: %v", err)
	}
	return res.Workspace
}

func (e w1Env) wsRevision(actor matter.ActorID, id matter.WorkspaceID) int64 {
	e.t.Helper()
	w, err := e.ws.GetWorkspace(e.ctx, port.GetWorkspaceQuery{ActorID: actor.String(), WorkspaceID: id.String()})
	if err != nil {
		e.t.Fatalf("get workspace: %v", err)
	}
	return w.Revision
}

func (e w1Env) createMatter(actor matter.ActorID, id matter.WorkspaceID, key, hash, title string, rev int64) (matter.WorkspaceCreatedResult, error) {
	return e.ws.CreateMatter(e.ctx, port.CreateMatterCmd{
		ActorID: actor.String(), WorkspaceID: id.String(), Title: title,
		IdempotencyKey: key, RequestHash: hash, ExpectedRevision: rev,
	})
}

func (e w1Env) mustMatter(actor matter.ActorID, id matter.WorkspaceID, title string) matter.MatterHeader {
	e.t.Helper()
	res, err := e.createMatter(actor, id, newKey(), anyHash, title, e.wsRevision(actor, id))
	if err != nil {
		e.t.Fatalf("create matter: %v", err)
	}
	return *res.Matter
}

func (e w1Env) matterRevision(actor matter.ActorID, ws matter.WorkspaceID, m matter.MatterID) int64 {
	e.t.Helper()
	page, err := e.ws.ListAccessibleMatters(e.ctx, port.ListAccessibleMattersQuery{ActorID: actor.String(), WorkspaceID: ws.String(), Limit: 200})
	if err != nil {
		e.t.Fatalf("list matters: %v", err)
	}
	for _, am := range page.Matters {
		if am.Header.MatterID == m {
			return am.Header.Revision
		}
	}
	e.t.Fatalf("matter %s not visible to %s", m, actor)
	return 0
}

func (e w1Env) grantWS(owner matter.ActorID, ws matter.WorkspaceID, user matter.ActorID, role string, rev int64) error {
	_, err := e.ws.GrantWorkspaceMembership(e.ctx, port.GrantWorkspaceMembershipCmd{
		ActorID: owner.String(), WorkspaceID: ws.String(), UserID: user.String(), Role: role, ExpectedRevision: rev,
	})
	return err
}

func (e w1Env) revokeWS(owner matter.ActorID, ws matter.WorkspaceID, user matter.ActorID, rev int64) error {
	_, err := e.ws.RevokeWorkspaceMembership(e.ctx, port.RevokeWorkspaceMembershipCmd{
		ActorID: owner.String(), WorkspaceID: ws.String(), UserID: user.String(), ExpectedRevision: rev,
	})
	return err
}

func (e w1Env) grantMatter(owner matter.ActorID, m matter.MatterID, user matter.ActorID, role string, rev int64) error {
	_, err := e.ws.GrantMatterMembership(e.ctx, port.GrantMatterMembershipCmd{
		ActorID: owner.String(), MatterID: m.String(), UserID: user.String(), Role: role, ExpectedRevision: rev,
	})
	return err
}

func (e w1Env) revokeMatter(owner matter.ActorID, m matter.MatterID, user matter.ActorID, rev int64) error {
	_, err := e.ws.RevokeMatterMembership(e.ctx, port.RevokeMatterMembershipCmd{
		ActorID: owner.String(), MatterID: m.String(), UserID: user.String(), ExpectedRevision: rev,
	})
	return err
}

func (e w1Env) history(actor matter.ActorID, m matter.MatterID, limit int, cursor *matter.EventCursor) (matter.EventPage, error) {
	return e.ws.HistoryRead(e.ctx, port.HistoryReadQuery{ActorID: actor.String(), MatterID: m.String(), Limit: limit, Cursor: cursor})
}

func mustIs(t *testing.T, label string, err, want error) {
	t.Helper()
	if !errors.Is(err, want) {
		t.Fatalf("%s: got %v, want %v", label, err, want)
	}
}

// SuiteW1 runs the W1 contract against any Bundle whose Store implements
// port.WorkspaceStore.
func SuiteW1(t *testing.T, newBundle Factory) {
	t.Helper()

	setup := func(t *testing.T) (Bundle, w1Env) {
		b := newBundle(t)
		return b, w1Env{t: t, ws: w1Service(t, b, b.Store), ctx: context.Background()}
	}

	t.Run("create workspace: owner, replay, restart replay, key reuse", func(t *testing.T) {
		b, e := setup(t)
		alice, bob := newActor(b), newActor(b)
		key := newKey()
		first, err := e.createWorkspace(alice, key, anyHash, "  Acme  ")
		if err != nil {
			t.Fatal(err)
		}
		if first.Workspace.Name != "Acme" || first.Workspace.Revision != 1 || first.Replayed {
			t.Fatalf("first: %+v", first)
		}
		if _, err := e.ws.GetWorkspace(e.ctx, port.GetWorkspaceQuery{ActorID: bob.String(), WorkspaceID: first.Workspace.ID.String()}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("non-member read: %v", err)
		}
		again, err := e.createWorkspace(alice, key, anyHash, "  Acme  ")
		if err != nil || !again.Replayed || again.Workspace != first.Workspace {
			t.Fatalf("replay: %+v %v", again, err)
		}
		reopened := w1Env{t: t, ws: w1Service(t, b, b.World.Reopen()), ctx: e.ctx}
		third, err := reopened.createWorkspace(alice, key, anyHash, "  Acme  ")
		if err != nil || !third.Replayed || third.Workspace != first.Workspace {
			t.Fatalf("restart replay: %+v %v", third, err)
		}
		_, err = e.createWorkspace(alice, key, otherHash, "Acme")
		mustIs(t, "key reuse", err, port.ErrIdempotencyKeyReuse)
		if _, err := e.createWorkspace(bob, key, anyHash, "Acme"); err != nil {
			t.Fatalf("same key under another actor must be independent: %v", err)
		}
		if c := b.World.Counts(); c.WorkspaceMembers != 2 || c.Receipts != 2 {
			t.Fatalf("counts: %+v", c)
		}
	})

	t.Run("create matter: CAS, title, list, history, replay without CAS", func(t *testing.T) {
		b, e := setup(t)
		alice, bob := newActor(b), newActor(b)
		ws := e.mustWorkspace(alice, "Acme")
		key := newKey()
		_, err := e.createMatter(alice, ws.ID, key, anyHash, "Project Atlas", 0)
		mustIs(t, "missing CAS", err, port.ErrPreconditionRequired)
		_, err = e.createMatter(alice, ws.ID, key, anyHash, "Project Atlas", 99)
		mustIs(t, "stale CAS", err, port.ErrPreconditionFailed)
		_, err = e.createMatter(bob, ws.ID, newKey(), anyHash, "Nope", 1)
		mustIs(t, "non-member", err, port.ErrNotFound)
		if c := b.World.Counts(); c.Matters != 0 {
			t.Fatalf("refusals wrote matters: %+v", c)
		}
		res, err := e.createMatter(alice, ws.ID, key, anyHash, "  Project Atlas ", 1)
		if err != nil {
			t.Fatal(err)
		}
		if res.Matter == nil || res.Matter.Title != "Project Atlas" || res.CallerRole != matter.MatterRoleOwner || res.Seq != 1 {
			t.Fatalf("result: %+v", res)
		}
		if rev := e.wsRevision(alice, ws.ID); rev != 2 {
			t.Fatalf("workspace revision after create = %d", rev)
		}
		replay, err := e.createMatter(alice, ws.ID, key, anyHash, "  Project Atlas ", 1) // now-stale CAS
		if err != nil || !replay.Replayed || replay.Matter.MatterID != res.Matter.MatterID {
			t.Fatalf("replay must not re-check CAS: %+v %v", replay, err)
		}
		if c := b.World.Counts(); c.Matters != 1 || c.MatterMembers != 1 {
			t.Fatalf("counts: %+v", c)
		}
		page, err := e.ws.ListAccessibleMatters(e.ctx, port.ListAccessibleMattersQuery{ActorID: alice.String(), WorkspaceID: ws.ID.String()})
		if err != nil || page.Total != 1 || len(page.Matters) != 1 ||
			page.Matters[0].Header.Title != "Project Atlas" || page.Matters[0].CallerRole != matter.MatterRoleOwner {
			t.Fatalf("list: %+v %v", page, err)
		}
		hist, err := e.history(alice, res.Matter.MatterID, 0, nil)
		if err != nil || len(hist.Events) != 1 || hist.Events[0].Type != "matter.created" || hist.Events[0].Seq != 1 {
			t.Fatalf("history: %+v %v", hist, err)
		}
		if _, err := e.history(bob, res.Matter.MatterID, 0, nil); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("history for non-member: %v", err)
		}
	})

	t.Run("workspace membership: CAS, authorization, last owner, role mismatch, revocation", func(t *testing.T) {
		b, e := setup(t)
		alice, bob, carol, dave := newActor(b), newActor(b), newActor(b), newActor(b)
		ws := e.mustWorkspace(alice, "Acme")
		mustIs(t, "missing CAS", e.grantWS(alice, ws.ID, bob, "MEMBER", 0), port.ErrPreconditionRequired)
		mustIs(t, "stale CAS", e.grantWS(alice, ws.ID, bob, "MEMBER", 7), port.ErrPreconditionFailed)
		if err := e.grantWS(alice, ws.ID, bob, "MEMBER", 1); err != nil {
			t.Fatal(err)
		}
		if rev := e.wsRevision(alice, ws.ID); rev != 2 {
			t.Fatalf("revision after grant = %d", rev)
		}
		mustIs(t, "member cannot administer", e.grantWS(bob, ws.ID, carol, "MEMBER", 2), port.ErrForbidden)
		mustIs(t, "outsider is hidden", e.grantWS(dave, ws.ID, carol, "MEMBER", 2), port.ErrNotFound)
		var roleErr matter.InvalidRoleError
		if err := e.grantWS(alice, ws.ID, carol, "SUPERUSER", 2); !errors.As(err, &roleErr) {
			t.Fatalf("invalid role: got %v", err)
		}
		mustIs(t, "last owner", e.revokeWS(alice, ws.ID, alice, 2), port.ErrLastOwner)
		if err := e.grantWS(alice, ws.ID, carol, "OWNER", 2); err != nil {
			t.Fatal(err)
		}
		if err := e.revokeWS(carol, ws.ID, alice, 3); err != nil {
			t.Fatalf("revoke second owner: %v", err)
		}
		if _, err := e.ws.GetWorkspace(e.ctx, port.GetWorkspaceQuery{ActorID: alice.String(), WorkspaceID: ws.ID.String()}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("revoked member must lose read access: %v", err)
		}
		mustIs(t, "role mismatch on reactivation", e.grantWS(carol, ws.ID, alice, "MEMBER", 4), port.ErrForbidden)
		if err := e.grantWS(carol, ws.ID, alice, "OWNER", 4); err != nil {
			t.Fatalf("same-role reactivation: %v", err)
		}
		mustIs(t, "revoke unknown membership", e.revokeWS(carol, ws.ID, dave, 5), port.ErrNotFound)
	})

	t.Run("matter membership: workspace prerequisite, events, CAS, last owner", func(t *testing.T) {
		b, e := setup(t)
		alice, bob, carol := newActor(b), newActor(b), newActor(b)
		ws := e.mustWorkspace(alice, "Acme")
		if err := e.grantWS(alice, ws.ID, bob, "MEMBER", 1); err != nil {
			t.Fatal(err)
		}
		m := e.mustMatter(alice, ws.ID, "Atlas")
		rev := e.matterRevision(alice, ws.ID, m.MatterID)
		mustIs(t, "target must be a workspace member", e.grantMatter(alice, m.MatterID, carol, "EDITOR", rev), port.ErrForbidden)
		mustIs(t, "missing CAS", e.grantMatter(alice, m.MatterID, bob, "EDITOR", 0), port.ErrPreconditionRequired)
		mustIs(t, "stale CAS", e.grantMatter(alice, m.MatterID, bob, "EDITOR", rev+5), port.ErrPreconditionFailed)
		if err := e.grantMatter(alice, m.MatterID, bob, "EDITOR", rev); err != nil {
			t.Fatal(err)
		}
		mustIs(t, "editor cannot administer", e.grantMatter(bob, m.MatterID, carol, "VIEWER", rev+1), port.ErrForbidden)
		bobList, err := e.ws.ListAccessibleMatters(e.ctx, port.ListAccessibleMattersQuery{ActorID: bob.String(), WorkspaceID: ws.ID.String()})
		if err != nil || len(bobList.Matters) != 1 || bobList.Matters[0].CallerRole != matter.MatterRoleEditor {
			t.Fatalf("bob list: %+v %v", bobList, err)
		}
		mustIs(t, "stale revoke", e.revokeMatter(alice, m.MatterID, bob, rev), port.ErrPreconditionFailed)
		if err := e.revokeMatter(alice, m.MatterID, bob, rev+1); err != nil {
			t.Fatal(err)
		}
		bobList, err = e.ws.ListAccessibleMatters(e.ctx, port.ListAccessibleMattersQuery{ActorID: bob.String(), WorkspaceID: ws.ID.String()})
		if err != nil || len(bobList.Matters) != 0 || bobList.Total != 0 {
			t.Fatalf("revoked matter must disappear from the list: %+v %v", bobList, err)
		}
		if _, err := e.history(bob, m.MatterID, 0, nil); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("revoked member history: %v", err)
		}
		mustIs(t, "last matter owner", e.revokeMatter(alice, m.MatterID, alice, rev+2), port.ErrLastOwner)
		hist, err := e.history(alice, m.MatterID, 0, nil)
		if err != nil {
			t.Fatal(err)
		}
		var types []string
		for i, ev := range hist.Events {
			types = append(types, ev.Type)
			if ev.Seq != int64(i+1) {
				t.Fatalf("history seq not contiguous: %+v", hist.Events)
			}
		}
		want := []string{"matter.created", "membership.granted", "membership.revoked"}
		if len(types) != len(want) || types[0] != want[0] || types[1] != want[1] || types[2] != want[2] {
			t.Fatalf("history types = %v", types)
		}
	})

	t.Run("get matter and member lists respect their boundaries", func(t *testing.T) {
		b, e := setup(t)
		alice, bob, carol := newActor(b), newActor(b), newActor(b)
		ws := e.mustWorkspace(alice, "Acme")
		if err := e.grantWS(alice, ws.ID, bob, "MEMBER", 1); err != nil {
			t.Fatal(err)
		}
		m := e.mustMatter(alice, ws.ID, "Atlas")

		got, err := e.ws.GetMatter(e.ctx, port.GetMatterQuery{ActorID: alice.String(), MatterID: m.MatterID.String()})
		if err != nil || got.Header.Title != "Atlas" || got.CallerRole != matter.MatterRoleOwner || got.Header.MatterID != m.MatterID || got.AsOf.IsZero() {
			t.Fatalf("get matter: %+v %v", got, err)
		}
		for name, actor := range map[string]matter.ActorID{"workspace member without matter access": bob, "outsider": carol} {
			if _, err := e.ws.GetMatter(e.ctx, port.GetMatterQuery{ActorID: actor.String(), MatterID: m.MatterID.String()}); !errors.Is(err, port.ErrNotFound) {
				t.Fatalf("%s: %v", name, err)
			}
		}

		wm, err := e.ws.ListWorkspaceMembers(e.ctx, port.ListMembersQuery{ActorID: alice.String(), ScopeID: ws.ID.String()})
		if err != nil || len(wm) != 2 {
			t.Fatalf("workspace members: %+v %v", wm, err)
		}
		if _, err := e.ws.ListWorkspaceMembers(e.ctx, port.ListMembersQuery{ActorID: bob.String(), ScopeID: ws.ID.String()}); !errors.Is(err, port.ErrForbidden) {
			t.Fatalf("workspace member listing is OWNER-only: %v", err)
		}
		if _, err := e.ws.ListWorkspaceMembers(e.ctx, port.ListMembersQuery{ActorID: carol.String(), ScopeID: ws.ID.String()}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("outsider: %v", err)
		}

		if err := e.grantMatter(alice, m.MatterID, bob, "VIEWER", e.matterRevision(alice, ws.ID, m.MatterID)); err != nil {
			t.Fatal(err)
		}
		mm, err := e.ws.ListMatterMembers(e.ctx, port.ListMembersQuery{ActorID: bob.String(), ScopeID: m.MatterID.String()})
		if err != nil || len(mm) != 2 {
			t.Fatalf("any active matter member lists matter members: %+v %v", mm, err)
		}
		roles := map[matter.ActorID]string{}
		for _, v := range mm {
			roles[v.UserID] = v.Role
			if v.Status != matter.StatusActive {
				t.Fatalf("only active members are listed: %+v", v)
			}
		}
		if roles[alice] != "OWNER" || roles[bob] != "VIEWER" {
			t.Fatalf("roles = %v", roles)
		}
		if _, err := e.ws.ListMatterMembers(e.ctx, port.ListMembersQuery{ActorID: carol.String(), ScopeID: m.MatterID.String()}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("outsider matter members: %v", err)
		}
	})

	t.Run("my workspaces lists only the caller's active memberships", func(t *testing.T) {
		b, e := setup(t)
		alice, bob, carol := newActor(b), newActor(b), newActor(b)
		w1 := e.mustWorkspace(alice, "Acme")
		w2 := e.mustWorkspace(alice, "Beta")
		if err := e.grantWS(alice, w1.ID, bob, "MEMBER", 1); err != nil {
			t.Fatal(err)
		}
		roles := func(actor matter.ActorID) map[matter.WorkspaceID]matter.WorkspaceRole {
			t.Helper()
			page, err := e.ws.ListMyWorkspaces(e.ctx, port.ListMyWorkspacesQuery{ActorID: actor.String()})
			if err != nil || page.AsOf.IsZero() {
				t.Fatalf("list: %+v %v", page, err)
			}
			out := map[matter.WorkspaceID]matter.WorkspaceRole{}
			for _, w := range page.Workspaces {
				out[w.Workspace.ID] = w.CallerRole
			}
			if page.Total != len(out) {
				t.Fatalf("total = %d, rows = %d", page.Total, len(out))
			}
			return out
		}
		if got := roles(alice); len(got) != 2 || got[w1.ID] != matter.WorkspaceRoleOwner || got[w2.ID] != matter.WorkspaceRoleOwner {
			t.Fatalf("alice: %v", got)
		}
		if got := roles(bob); len(got) != 1 || got[w1.ID] != matter.WorkspaceRoleMember {
			t.Fatalf("bob: %v", got)
		}
		if got := roles(carol); len(got) != 0 {
			t.Fatalf("carol must see nothing: %v", got)
		}
		if err := e.revokeWS(alice, w1.ID, bob, e.wsRevision(alice, w1.ID)); err != nil {
			t.Fatal(err)
		}
		if got := roles(bob); len(got) != 0 {
			t.Fatalf("revocation must remove the workspace from the list: %v", got)
		}
		// paging without gaps or duplicates
		for i := range 3 {
			e.mustWorkspace(alice, "W"+string(rune('0'+i)))
		}
		seen := map[matter.WorkspaceID]bool{}
		var cursor *matter.WorkspaceCursor
		for pages := 0; ; pages++ {
			page, err := e.ws.ListMyWorkspaces(e.ctx, port.ListMyWorkspacesQuery{ActorID: alice.String(), Limit: 2, Cursor: cursor})
			if err != nil {
				t.Fatal(err)
			}
			for _, w := range page.Workspaces {
				if seen[w.Workspace.ID] {
					t.Fatalf("duplicate %s", w.Workspace.ID)
				}
				seen[w.Workspace.ID] = true
			}
			if page.NextCursor == nil {
				break
			}
			cursor = page.NextCursor
			if pages > 5 {
				t.Fatal("paging does not terminate")
			}
		}
		if len(seen) != 5 {
			t.Fatalf("listed %d of 5", len(seen))
		}
	})

	t.Run("accessible matters page without gaps or duplicates", func(t *testing.T) {
		b, e := setup(t)
		alice, bob := newActor(b), newActor(b)
		ws := e.mustWorkspace(alice, "Acme")
		if err := e.grantWS(alice, ws.ID, bob, "MEMBER", 1); err != nil {
			t.Fatal(err)
		}
		seen := map[matter.MatterID]bool{}
		for i := range 5 {
			h := e.mustMatter(alice, ws.ID, "Matter "+string(rune('A'+i)))
			seen[h.MatterID] = false
		}
		var cursor *matter.MatterCursor
		pages := 0
		for {
			page, err := e.ws.ListAccessibleMatters(e.ctx, port.ListAccessibleMattersQuery{ActorID: alice.String(), WorkspaceID: ws.ID.String(), Limit: 2, Cursor: cursor})
			if err != nil {
				t.Fatal(err)
			}
			pages++
			if page.Total != 5 {
				t.Fatalf("total = %d", page.Total)
			}
			for _, am := range page.Matters {
				if dup, ok := seen[am.Header.MatterID]; !ok || dup {
					t.Fatalf("unknown or duplicate matter %s", am.Header.MatterID)
				}
				seen[am.Header.MatterID] = true
			}
			if page.NextCursor == nil {
				break
			}
			cursor = page.NextCursor
			if pages > 10 {
				t.Fatal("paging does not terminate")
			}
		}
		if pages != 3 {
			t.Fatalf("pages = %d, want 3 for 5 rows at limit 2", pages)
		}
		for id, got := range seen {
			if !got {
				t.Fatalf("matter %s never listed", id)
			}
		}
		empty, err := e.ws.ListAccessibleMatters(e.ctx, port.ListAccessibleMattersQuery{ActorID: bob.String(), WorkspaceID: ws.ID.String()})
		if err != nil || len(empty.Matters) != 0 || empty.Total != 0 {
			t.Fatalf("a workspace member without matter access sees none: %+v %v", empty, err)
		}
	})

	t.Run("history pages without gaps or duplicates", func(t *testing.T) {
		b, e := setup(t)
		alice, bob := newActor(b), newActor(b)
		ws := e.mustWorkspace(alice, "Acme")
		if err := e.grantWS(alice, ws.ID, bob, "MEMBER", 1); err != nil {
			t.Fatal(err)
		}
		m := e.mustMatter(alice, ws.ID, "Atlas")
		for i := range 3 { // grant, revoke, grant: three more events
			rev := e.matterRevision(alice, ws.ID, m.MatterID)
			var err error
			if i%2 == 0 {
				err = e.grantMatter(alice, m.MatterID, bob, "VIEWER", rev)
			} else {
				err = e.revokeMatter(alice, m.MatterID, bob, rev)
			}
			if err != nil {
				t.Fatalf("event %d: %v", i, err)
			}
		}
		var cursor *matter.EventCursor
		var seqs []int64
		for pages := 0; ; pages++ {
			page, err := e.history(alice, m.MatterID, 3, cursor)
			if err != nil {
				t.Fatal(err)
			}
			if page.AsOf.IsZero() {
				t.Fatal("history page must carry its as-of instant")
			}
			for _, ev := range page.Events {
				seqs = append(seqs, ev.Seq)
			}
			if page.NextCursor == nil {
				break
			}
			cursor = page.NextCursor
			if pages > 5 {
				t.Fatal("history paging does not terminate")
			}
		}
		if len(seqs) != 4 {
			t.Fatalf("seqs = %v", seqs)
		}
		for i, s := range seqs {
			if s != int64(i+1) {
				t.Fatalf("seqs = %v", seqs)
			}
		}
	})

	t.Run("history includes requirement creation in contiguous sequence", func(t *testing.T) {
		b, e := setup(t)
		alice := newActor(b)
		ws := e.mustWorkspace(alice, "Acme")
		m := e.mustMatter(alice, ws.ID, "Atlas")
		reqs := service.NewMatterService(b.Store, kitIDs{}, discardLogger(), matter.KeyAgePolicy{})
		res, err := reqs.CreateRequirement(e.ctx, port.CreateRequirementCmd{
			ActorID: alice.String(), MatterID: m.MatterID.String(), IdempotencyKey: newKey(), RequestHash: anyHash,
			Title: "Sign SPA", Outcome: "Executed SPA",
		})
		if err != nil {
			t.Fatal(err)
		}
		hist, err := e.history(alice, m.MatterID, 0, nil)
		if err != nil || len(hist.Events) != 2 {
			t.Fatalf("history: %+v %v", hist, err)
		}
		last := hist.Events[1]
		if last.Type != "requirement.created" || last.Seq != 2 || last.TargetID != res.Requirement.ID.String() || last.TargetKind != "REQUIREMENT" {
			t.Fatalf("requirement event: %+v", last)
		}
		if last.ActorID == nil || *last.ActorID != alice.String() || last.CommandKey == nil {
			t.Fatalf("requirement event attribution: %+v", last)
		}
	})

	t.Run("own receipt: owner only, revocation hides it", func(t *testing.T) {
		b, e := setup(t)
		alice, bob, carol := newActor(b), newActor(b), newActor(b)
		key := newKey()
		first, err := e.createWorkspace(alice, key, anyHash, "Acme")
		if err != nil {
			t.Fatal(err)
		}
		rc, err := e.ws.OwnReceipt(e.ctx, port.OwnReceiptQuery{ActorID: alice.String(), IdempotencyKey: key})
		if err != nil || rc.Kind != matter.SnapshotWorkspaceCreate || rc.WorkspaceSnapshot == nil || rc.WorkspaceSnapshot.Workspace != first.Workspace {
			t.Fatalf("own receipt: %+v %v", rc, err)
		}
		if _, err := e.ws.OwnReceipt(e.ctx, port.OwnReceiptQuery{ActorID: bob.String(), IdempotencyKey: key}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("another actor must not see the receipt: %v", err)
		}
		if err := e.grantWS(alice, first.Workspace.ID, bob, "OWNER", 1); err != nil {
			t.Fatal(err)
		}
		mkey := newKey()
		res, err := e.createMatter(bob, first.Workspace.ID, mkey, anyHash, "Bob matter", 2)
		if err != nil {
			t.Fatal(err)
		}
		rc, err = e.ws.OwnReceipt(e.ctx, port.OwnReceiptQuery{ActorID: bob.String(), IdempotencyKey: mkey})
		if err != nil || rc.WorkspaceSnapshot == nil || rc.WorkspaceSnapshot.Matter == nil ||
			rc.WorkspaceSnapshot.Matter.MatterID != res.Matter.MatterID || rc.WorkspaceSnapshot.Matter.Title != "Bob matter" ||
			len(rc.Matters) != 1 {
			t.Fatalf("matter receipt: %+v %v", rc, err)
		}
		if err := e.revokeWS(alice, first.Workspace.ID, bob, 3); err != nil {
			t.Fatal(err)
		}
		if _, err := e.ws.OwnReceipt(e.ctx, port.OwnReceiptQuery{ActorID: bob.String(), IdempotencyKey: mkey}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("revoked workspace access must hide the receipt: %v", err)
		}
		if _, err := e.ws.OwnReceipt(e.ctx, port.OwnReceiptQuery{ActorID: carol.String(), IdempotencyKey: newKey()}); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("unknown key: %v", err)
		}
	})

	t.Run("concurrency: same-key creation has one effect; same-revision grants have one winner", func(t *testing.T) {
		b, e := setup(t)
		alice := newActor(b)
		key := newKey()
		const n = 8
		errs := make([]error, n)
		res := make([]matter.WorkspaceCreatedResult, n)
		start := make(chan struct{})
		var wg sync.WaitGroup
		for i := range n {
			wg.Go(func() {
				<-start
				res[i], errs[i] = e.createWorkspace(alice, key, anyHash, "Acme")
			})
		}
		close(start)
		wg.Wait()
		for i := range n {
			if errs[i] != nil {
				t.Fatalf("racer %d: %v", i, errs[i])
			}
			if res[i].Workspace != res[0].Workspace {
				t.Fatalf("racers disagree: %+v vs %+v", res[i], res[0])
			}
		}
		if c := b.World.Counts(); c.WorkspaceMembers != 1 || c.Receipts != 1 {
			t.Fatalf("one effect expected: %+v", c)
		}

		ws := res[0].Workspace
		users := make([]matter.ActorID, n)
		for i := range users {
			users[i] = newActor(b)
		}
		grantErrs := make([]error, n)
		start = make(chan struct{})
		for i := range n {
			wg.Go(func() {
				<-start
				grantErrs[i] = e.grantWS(alice, ws.ID, users[i], "MEMBER", 1)
			})
		}
		close(start)
		wg.Wait()
		wins := 0
		for _, err := range grantErrs {
			switch {
			case err == nil:
				wins++
			case errors.Is(err, port.ErrPreconditionFailed):
			default:
				t.Fatalf("unexpected grant outcome: %v", err)
			}
		}
		if wins != 1 {
			t.Fatalf("winners = %d, want exactly 1", wins)
		}
		if c := b.World.Counts(); c.WorkspaceMembers != 2 {
			t.Fatalf("members = %d", c.WorkspaceMembers)
		}
	})

	t.Run("commit outcome unknown is not a rollback", func(t *testing.T) {
		b, e := setup(t)
		inj, ok := b.Store.(commitInjector)
		if !ok {
			t.Skip("store has no commit injection seam")
		}
		alice := newActor(b)
		key := newKey()
		inj.SetCommitUnknown(errors.New("lost acknowledgement"))
		_, err := e.createWorkspace(alice, key, anyHash, "Acme")
		mustIs(t, "unknown", err, port.ErrOutcomeUnknown)
		inj.SetCommitUnknown(nil)
		res, err := e.createWorkspace(alice, key, anyHash, "Acme")
		if err != nil || !res.Replayed {
			t.Fatalf("same-key retry must replay the durable effect: %+v %v", res, err)
		}
		if c := b.World.Counts(); c.WorkspaceMembers != 1 {
			t.Fatalf("counts: %+v", c)
		}
	})
}
