package service_test

// W1 behavioral regression tests (intake W1-A01, W1-A02). These tests observe
// persisted authorization state through the memory double's test-kit readers, not
// only command results, so a result that disagrees with persisted state fails.

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/example/userapi/internal/adapter/outbound/repotest/mattercontrol"
	"github.com/example/userapi/internal/adapter/outbound/system"
	"github.com/example/userapi/internal/core/domain"
	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
	"github.com/example/userapi/internal/core/service"
)

// W1 fixtures: second workspace actor with a REVOKED former-OWNER row, and a fresh
// member for same-role reactivation.
var (
	w1RevokedOwner   = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	w1FreshMember    = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	w1SecondOwner    = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	w1Workspace      = matter.WorkspaceID(uuid.Must(uuid.NewV7()).String())
	w1Matter         = matter.MatterID(uuid.Must(uuid.NewV7()).String())
	w1AnyHash        = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
	w1OtherHash      = "0000000000000000000000000000000000000000000000000000000000000001"
	w1TestActorOwner = matter.ActorID(uuid.Must(uuid.NewV7()).String())
)

type w1SUT struct {
	ws    port.WorkspaceService
	store *mattercontrol.Store
	world *mattercontrol.MemoryWorld
}

func newW1SUT(t *testing.T) w1SUT {
	t.Helper()
	n := 0
	clock := func() time.Time { n++; return fixtureBase.Add(time.Duration(n) * time.Second) }
	store := mattercontrol.NewMemoryStore(clock)
	world := mattercontrol.NewMemoryWorld(store)
	seedW1(t, world)
	ws := service.NewWorkspaceService(store, system.RecordIDv7{}, discardLogger(), matter.KeyAgePolicy{})
	return w1SUT{ws: ws, store: store, world: world}
}

func seedW1(t *testing.T, w *mattercontrol.MemoryWorld) {
	t.Helper()
	for _, a := range []matter.ActorID{w1TestActorOwner, w1RevokedOwner, w1FreshMember, w1SecondOwner} {
		w.AddUser(a)
	}
	w.AddWorkspace(w1Workspace)
	// The calling actor is the workspace OWNER; w1SecondOwner keeps last-owner
	// protection from firing in grant-path tests.
	w.SetWorkspaceMembership(w1Workspace, w1TestActorOwner, matter.WorkspaceRoleOwner, matter.StatusActive)
	w.SetWorkspaceMembership(w1Workspace, w1SecondOwner, matter.WorkspaceRoleOwner, matter.StatusActive)
	// W1-A01 fixtures: a REVOKED row whose stored role is more privileged than the
	// role a reactivation will request.
	w.SetWorkspaceMembership(w1Workspace, w1RevokedOwner, matter.WorkspaceRoleOwner, matter.StatusRevoked)
	w.AddMatter(w1Matter, w1Workspace)
	w.Store().SetMatterRevision(w1Matter, 1)
	w.SetMatterMembership(w1Matter, w1TestActorOwner, matter.MatterRoleOwner, matter.StatusActive)
	w.SetMatterMembership(w1Matter, w1RevokedOwner, matter.MatterRoleOwner, matter.StatusRevoked)
}

// W1-A01 (workspace scope): reactivating a REVOKED OWNER as MEMBER must be refused
// and must leave the persisted row exactly as it was (REVOKED, OWNER).
func TestGrantWorkspaceMembership_RevokedOwnerToMember_RefusedRoleMismatch(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	rev, _ := s.store.WSRevision(w1Workspace)
	_, err := s.ws.GrantWorkspaceMembership(ctx, port.GrantWorkspaceMembershipCmd{
		ActorID:          w1TestActorOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		UserID:           w1RevokedOwner.String(),
		Role:             "MEMBER",
		ExpectedRevision: rev,
	})
	if !errors.Is(err, port.ErrForbidden) {
		t.Fatalf("expected ErrForbidden for OWNER->MEMBER reactivation, got %v", err)
	}
	got, ok := s.store.WSMembership(w1Workspace, w1RevokedOwner)
	if !ok {
		t.Fatal("membership row vanished")
	}
	if got.Role != matter.WorkspaceRoleOwner || got.Status != matter.StatusRevoked {
		t.Fatalf("persisted row mutated: role=%s status=%s (want OWNER/REVOKED)", got.Role, got.Status)
	}
}

// W1-A01 (matter scope): reactivating a REVOKED OWNER as VIEWER must be refused and
// the persisted row must stay OWNER/REVOKED; no membership.granted event may appear.
func TestGrantMatterMembership_RevokedOwnerToViewer_RefusedRoleMismatch(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	rev, _ := s.store.MatterRevision(w1Matter)
	_, err := s.ws.GrantMatterMembership(ctx, port.GrantMatterMembershipCmd{
		ActorID:          w1TestActorOwner.String(),
		MatterID:         w1Matter.String(),
		UserID:           w1RevokedOwner.String(),
		Role:             "VIEWER",
		ExpectedRevision: rev,
	})
	if !errors.Is(err, port.ErrForbidden) {
		t.Fatalf("expected ErrForbidden for OWNER->VIEWER reactivation, got %v", err)
	}
	got, ok := s.store.MMembershipOf(w1Matter, w1RevokedOwner)
	if !ok {
		t.Fatal("membership row vanished")
	}
	if got.Role != matter.MatterRoleOwner || got.Status != matter.StatusRevoked {
		t.Fatalf("persisted row mutated: role=%s status=%s (want OWNER/REVOKED)", got.Role, got.Status)
	}
	for _, r := range s.store.AllRecords() {
		if r.MatterID == w1Matter && r.Type == "membership.granted" {
			t.Fatalf("membership.granted event persisted despite rejection: %+v", r)
		}
	}
}

// W1-A01 inverse mismatch: a revoked lower role granted a higher role is also refused.
func TestGrantMatterMembership_RevokedEditorToOwner_RefusedRoleMismatch(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	rev, _ := s.store.MatterRevision(w1Matter)
	// Seed a revoked EDITOR row for a fresh actor.
	s.world.SetMatterMembership(w1Matter, w1FreshMember, matter.MatterRoleEditor, matter.StatusRevoked)
	_, err := s.ws.GrantMatterMembership(ctx, port.GrantMatterMembershipCmd{
		ActorID:          w1TestActorOwner.String(),
		MatterID:         w1Matter.String(),
		UserID:           w1FreshMember.String(),
		Role:             "OWNER",
		ExpectedRevision: rev,
	})
	if !errors.Is(err, port.ErrForbidden) {
		t.Fatalf("expected ErrForbidden for EDITOR->OWNER reactivation, got %v", err)
	}
	got, _ := s.store.MMembershipOf(w1Matter, w1FreshMember)
	if got.Role != matter.MatterRoleEditor || got.Status != matter.StatusRevoked {
		t.Fatalf("persisted row mutated: role=%s status=%s (want EDITOR/REVOKED)", got.Role, got.Status)
	}
}

// W1-A01: same-role reactivation must still work and persist ACTIVE with that role.
func TestGrantWorkspaceMembership_SameRoleReactivation_Succeeds(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	rev, _ := s.store.WSRevision(w1Workspace)
	res, err := s.ws.GrantWorkspaceMembership(ctx, port.GrantWorkspaceMembershipCmd{
		ActorID:          w1TestActorOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		UserID:           w1RevokedOwner.String(),
		Role:             "OWNER",
		ExpectedRevision: rev,
	})
	if err != nil {
		t.Fatalf("same-role reactivation failed: %v", err)
	}
	if res.Status != matter.StatusActive || res.Role != "OWNER" {
		t.Fatalf("unexpected result %+v", res)
	}
	got, ok := s.store.WSMembership(w1Workspace, w1RevokedOwner)
	if !ok || got.Role != matter.WorkspaceRoleOwner || got.Status != matter.StatusActive {
		t.Fatalf("persisted row wrong after reactivation: %+v ok=%v", got, ok)
	}
	// Subsequent authorization reflects the restored membership: the caller can now
	// create a matter in this workspace.
	cm, err := s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID:          w1RevokedOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		Title:            "Restored owner matter",
		IdempotencyKey:   newKey(),
		RequestHash:      w1AnyHash,
		ExpectedRevision: rev + 1,
	})
	if err != nil {
		t.Fatalf("restored OWNER could not create matter: %v", err)
	}
	if cm.Matter == nil || cm.CallerRole != matter.MatterRoleOwner {
		t.Fatalf("unexpected create-matter result %+v", cm)
	}
}

// W1-A02: a missing precondition (ExpectedRevision=0) is refused with
// ErrPreconditionRequired and creates nothing.
func TestCreateMatter_MissingPrecondition_Refused428(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	before := matterCounts(s)
	_, err := s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID:        w1TestActorOwner.String(),
		WorkspaceID:    w1Workspace.String(),
		Title:          "No precondition",
		IdempotencyKey: newKey(),
		RequestHash:    w1AnyHash,
	})
	if !errors.Is(err, port.ErrPreconditionRequired) {
		t.Fatalf("expected ErrPreconditionRequired, got %v", err)
	}
	after := matterCounts(s)
	if after.matters != before.matters || after.receipts != before.receipts {
		t.Fatalf("state mutated on refused write: before=%+v after=%+v", before, after)
	}
}

// W1-A02: a stale precondition is refused with ErrPreconditionFailed and creates
// nothing.
func TestCreateMatter_StalePrecondition_Refused412(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	rev, _ := s.store.WSRevision(w1Workspace)
	// Advance the real revision with a successful membership grant.
	if _, err := s.ws.GrantWorkspaceMembership(ctx, port.GrantWorkspaceMembershipCmd{
		ActorID:          w1TestActorOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		UserID:           w1FreshMember.String(),
		Role:             "MEMBER",
		ExpectedRevision: rev,
	}); err != nil {
		t.Fatalf("seed grant failed: %v", err)
	}
	before := matterCounts(s)
	_, err := s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID:          w1TestActorOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		Title:            "Stale precondition",
		IdempotencyKey:   newKey(),
		RequestHash:      w1AnyHash,
		ExpectedRevision: rev, // now stale
	})
	if !errors.Is(err, port.ErrPreconditionFailed) {
		t.Fatalf("expected ErrPreconditionFailed, got %v", err)
	}
	after := matterCounts(s)
	if after.matters != before.matters || after.receipts != before.receipts {
		t.Fatalf("state mutated on refused write: before=%+v after=%+v", before, after)
	}
}

// W1-A02: a matching precondition succeeds, bumps the workspace revision, and the
// same key replays the stored outcome without creating a second matter.
func TestCreateMatter_MatchingPrecondition_SucceedsAndReplays(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	rev, _ := s.store.WSRevision(w1Workspace)
	key := newKey()
	first, err := s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID:          w1TestActorOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		Title:            "CAS create",
		IdempotencyKey:   key,
		RequestHash:      w1AnyHash,
		ExpectedRevision: rev,
	})
	if err != nil {
		t.Fatalf("matching-precondition create failed: %v", err)
	}
	newRev, ok := s.store.WSRevision(w1Workspace)
	if !ok || newRev != rev+1 {
		t.Fatalf("workspace revision not advanced on success: %d (want %d)", newRev, rev+1)
	}
	replay, err := s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID:          w1TestActorOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		Title:            "CAS create",
		IdempotencyKey:   key,
		RequestHash:      w1AnyHash,
		ExpectedRevision: newRev,
	})
	if err != nil {
		t.Fatalf("replay failed: %v", err)
	}
	if !replay.Replayed || replay.Matter == nil || replay.Matter.MatterID != first.Matter.MatterID {
		t.Fatalf("replay mismatch: first=%+v replay=%+v", first, replay)
	}
	if _, rerr := s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID:          w1TestActorOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		Title:            "CAS create",
		IdempotencyKey:   key,
		RequestHash:      w1OtherHash,
		ExpectedRevision: newRev,
	}); !errors.Is(rerr, port.ErrIdempotencyKeyReuse) {
		t.Fatalf("expected ErrIdempotencyKeyReuse for differing hash, got %v", rerr)
	}
}

// W1-A02: two fresh creates with the same precondition behave per the adopted
// revision rule — the first commits and advances the revision, the second (still
// presenting the old revision) is refused 412 and never invents success.
func TestCreateMatter_SecondFreshCreateWithSameRevision_Refused412(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	rev, _ := s.store.WSRevision(w1Workspace)
	if _, err := s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID:          w1TestActorOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		Title:            "First",
		IdempotencyKey:   newKey(),
		RequestHash:      w1AnyHash,
		ExpectedRevision: rev,
	}); err != nil {
		t.Fatalf("first create failed: %v", err)
	}
	second, err := s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID:          w1TestActorOwner.String(),
		WorkspaceID:      w1Workspace.String(),
		Title:            "Second",
		IdempotencyKey:   newKey(),
		RequestHash:      w1AnyHash,
		ExpectedRevision: rev,
	})
	if !errors.Is(err, port.ErrPreconditionFailed) {
		t.Fatalf("expected ErrPreconditionFailed for second create with stale revision, got %v", err)
	}
	if second.Matter != nil {
		t.Fatalf("refused command returned a matter result: %+v", second)
	}
}

// w1Counts is the persisted-state snapshot used by refusal assertions.
type w1Counts struct {
	matters, receipts, records int
}

func matterCounts(s w1SUT) w1Counts {
	c := s.world.Counts()
	recs := len(s.store.AllRecords())
	return w1Counts{matters: c.Matters, receipts: c.Receipts, records: recs}
}

// A created matter keeps its (trimmed) title and the accessible-matter list returns it.
func TestCreateMatter_PersistsTrimmedTitle(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	rev, _ := s.store.WSRevision(w1Workspace)
	res, err := s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID: w1TestActorOwner.String(), WorkspaceID: w1Workspace.String(),
		Title: "  Project Atlas  ", IdempotencyKey: uuid.Must(uuid.NewV7()).String(),
		RequestHash: w1AnyHash, ExpectedRevision: rev,
	})
	if err != nil {
		t.Fatalf("create matter: %v", err)
	}
	if res.Matter == nil || res.Matter.Title != "Project Atlas" {
		t.Fatalf("result title: %+v", res.Matter)
	}
	page, err := s.ws.ListAccessibleMatters(ctx, port.ListAccessibleMattersQuery{
		ActorID: w1TestActorOwner.String(), WorkspaceID: w1Workspace.String(),
	})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	found := false
	for _, m := range page.Matters {
		if m.Header.MatterID == res.Matter.MatterID {
			found = m.Header.Title == "Project Atlas"
		}
	}
	if !found {
		t.Fatalf("listed matters do not carry the created title: %+v", page.Matters)
	}
}

// Blank names are validation failures and write nothing.
func TestCreateWorkspaceAndMatter_BlankNameRejected(t *testing.T) {
	s := newW1SUT(t)
	ctx := context.Background()
	before := s.world.Counts()
	_, err := s.ws.CreateWorkspace(ctx, port.CreateWorkspaceCmd{
		ActorID: w1TestActorOwner.String(), Name: "   ",
		IdempotencyKey: uuid.Must(uuid.NewV7()).String(), RequestHash: w1AnyHash,
	})
	var verr *domain.ValidationError
	if !errors.As(err, &verr) {
		t.Fatalf("blank workspace name: want ValidationError, got %v", err)
	}
	rev, _ := s.store.WSRevision(w1Workspace)
	_, err = s.ws.CreateMatter(ctx, port.CreateMatterCmd{
		ActorID: w1TestActorOwner.String(), WorkspaceID: w1Workspace.String(),
		Title: "", IdempotencyKey: uuid.Must(uuid.NewV7()).String(),
		RequestHash: w1AnyHash, ExpectedRevision: rev,
	})
	if !errors.As(err, &verr) {
		t.Fatalf("blank matter title: want ValidationError, got %v", err)
	}
	if after := s.world.Counts(); after != before {
		t.Fatalf("validation failures wrote rows: %+v -> %+v", before, after)
	}
}
