package service_test

// BE01 rework (R1) regressions: ports the three independently written intake probes
// into owned test paths and extends them with the contract-required variants.
// Expectations are the corrected contract, not the behavior of source 136eae6 — the
// failing-before run on that head documents the defects this rework fixes.

import (
	"context"
	"errors"
	"strings"
	"testing"

	"github.com/google/uuid"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
)

// BE01-F01 (intake probe parity): receipt in A; A revoked; the caller remains
// authorized on B in the same workspace; the same key with a different trusted
// fingerprint targeting B must return uniform ErrNotFound — never a key-reuse
// outcome that discloses the receipt.
func TestCreateRequirement_ReplayAuthorizesRepresentedMatters(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash)); err != nil {
		t.Fatal(err)
	}
	matterB := uuid.Must(uuid.NewV7()).String()
	s.world.AddMatter(matter.MatterID(matterB), workspace)
	s.world.SetMatterMembership(matter.MatterID(matterB), editorID, matter.MatterRoleEditor, matter.StatusActive)
	s.world.SetMatterMembership(matterA, editorID, matter.MatterRoleEditor, matter.StatusRevoked)
	cmd := createCmd(editorID, key, strings.Repeat("cd", 32))
	cmd.MatterID = matterB
	if _, err := s.svc.CreateRequirement(ctx, cmd); !errors.Is(err, port.ErrNotFound) {
		t.Fatalf("represented matter revoked: want uniform ErrNotFound before hash comparison; got %v", err)
	}
	if c := s.world.Counts(); c.Requirements != 1 || c.Receipts != 1 {
		t.Fatalf("denied replay wrote rows: %+v", c)
	}
}

// BE01-F01 cross-workspace variant: the receipt's saved workspace is part of the
// saved scope; revoking it hides the receipt even though the command target stays
// fully authorized.
func TestCreateRequirement_ReplayAuthorizesSavedWorkspace(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash)); err != nil {
		t.Fatal(err)
	}
	ws2 := matter.WorkspaceID(uuid.Must(uuid.NewV7()).String())
	matterB := matter.MatterID(uuid.Must(uuid.NewV7()).String())
	s.world.AddWorkspace(ws2)
	s.world.AddMatter(matterB, ws2)
	s.world.SetWorkspaceMembership(ws2, editorID, matter.WorkspaceRoleMember, matter.StatusActive)
	s.world.SetMatterMembership(matterB, editorID, matter.MatterRoleEditor, matter.StatusActive)
	cmd := createCmd(editorID, key, strings.Repeat("cd", 32))
	cmd.MatterID = matterB.String()
	if _, err := s.svc.CreateRequirement(ctx, cmd); !errors.Is(err, port.ErrIdempotencyKeyReuse) {
		t.Fatalf("saved scope intact: want ErrIdempotencyKeyReuse, got %v", err)
	}
	s.world.SetWorkspaceMembership(workspace, editorID, matter.WorkspaceRoleMember, matter.StatusRevoked)
	if _, err := s.svc.CreateRequirement(ctx, cmd); !errors.Is(err, port.ErrNotFound) {
		t.Fatalf("saved workspace revoked: want uniform ErrNotFound, got %v", err)
	}
	if c := s.world.Counts(); c.Requirements != 1 || c.Receipts != 1 {
		t.Fatalf("rows changed: %+v", c)
	}
}

// BE01-F01 demotion variant across matters: read access to the represented matter
// keeps the legitimate replay alive (stored outcome returned verbatim).
func TestCreateRequirement_DemotionKeepsRepresentedMatterReplay(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	first, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
	if err != nil {
		t.Fatal(err)
	}
	matterB := matter.MatterID(uuid.Must(uuid.NewV7()).String())
	s.world.AddMatter(matterB, workspace)
	s.world.SetMatterMembership(matterB, editorID, matter.MatterRoleEditor, matter.StatusActive)
	s.world.SetMatterMembership(matterA, editorID, matter.MatterRoleViewer, matter.StatusActive)
	cmd := createCmd(editorID, key, anyHash)
	cmd.MatterID = matterB.String()
	replayed, err := s.svc.CreateRequirement(ctx, cmd)
	if err != nil {
		t.Fatalf("replay after demotion failed: %v", err)
	}
	first.Replayed = true
	if first != replayed {
		t.Fatal("replayed stored outcome changed")
	}
}

// BE01-F03 (intake probe parity): a workspace-membership read failure on the read
// path is unavailability, never a fabricated not-found.
func TestGetRequirement_MembershipReadUnavailablePreserved(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	res, err := s.svc.CreateRequirement(ctx, createCmd(editorID, newKey(), anyHash))
	if err != nil {
		t.Fatal(err)
	}
	s.store.SetFailAt("membership_unavailable")
	defer s.store.SetFailAt("")
	_, err = s.svc.GetRequirement(ctx, port.GetRequirementQuery{ActorID: editorID.String(), ID: res.Requirement.ID.String()})
	if !errors.Is(err, port.ErrUnavailable) {
		t.Fatalf("membership storage failure: want ErrUnavailable, got %v", err)
	}
	if errors.Is(err, port.ErrNotFound) {
		t.Fatal("unavailable misclassified as not-found")
	}
}

// BE01-F03: an unexpected (non-ErrNotFound) membership failure propagates on the
// read path as well; only ErrNotFound is absence.
func TestGetRequirement_MembershipReadUnexpectedPropagates(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	res, err := s.svc.CreateRequirement(ctx, createCmd(editorID, newKey(), anyHash))
	if err != nil {
		t.Fatal(err)
	}
	s.store.SetFailAt("membership_unexpected")
	defer s.store.SetFailAt("")
	_, err = s.svc.GetRequirement(ctx, port.GetRequirementQuery{ActorID: editorID.String(), ID: res.Requirement.ID.String()})
	if err == nil || errors.Is(err, port.ErrNotFound) {
		t.Fatalf("unexpected membership failure must surface, got %v", err)
	}
}

// BE01-F03: membership lookup failures propagate on the create and replay paths —
// they abort the transaction instead of faking a denial, an absence or a key-reuse
// outcome; nothing is written.
func TestCreateRequirement_MembershipFailuresPropagate(t *testing.T) {
	for _, tc := range []struct {
		step      string
		wantErr   error
		wantNoErr error
	}{
		{step: "membership_unavailable", wantErr: port.ErrUnavailable, wantNoErr: port.ErrNotFound},
		{step: "membership_unexpected", wantNoErr: port.ErrNotFound},
	} {
		t.Run(tc.step+"/create", func(t *testing.T) {
			s := newMatterSUT(t)
			s.store.SetFailAt(tc.step)
			defer s.store.SetFailAt("")
			_, err := s.svc.CreateRequirement(context.Background(), createCmd(editorID, newKey(), anyHash))
			if err == nil || errors.Is(err, tc.wantNoErr) {
				t.Fatalf("membership failure must surface, got %v", err)
			}
			if tc.wantErr != nil && !errors.Is(err, tc.wantErr) {
				t.Fatalf("want %v, got %v", tc.wantErr, err)
			}
			if c := s.world.Counts(); c.Nodes != 0 || c.Requirements != 0 || c.Events != 0 ||
				c.Receipts != 0 || c.Audits != 0 {
				t.Fatalf("aborted create wrote rows: %+v", c)
			}
		})
		t.Run(tc.step+"/replay", func(t *testing.T) {
			s := newMatterSUT(t)
			key := newKey()
			if _, err := s.svc.CreateRequirement(context.Background(), createCmd(editorID, key, anyHash)); err != nil {
				t.Fatal(err)
			}
			s.store.SetFailAt(tc.step)
			defer s.store.SetFailAt("")
			_, err := s.svc.CreateRequirement(context.Background(), createCmd(editorID, key, anyHash))
			if err == nil || errors.Is(err, tc.wantNoErr) || errors.Is(err, port.ErrIdempotencyKeyReuse) {
				t.Fatalf("membership failure must surface during replay, got %v", err)
			}
			if tc.wantErr != nil && !errors.Is(err, tc.wantErr) {
				t.Fatalf("want %v, got %v", tc.wantErr, err)
			}
			if c := s.world.Counts(); c.Requirements != 1 || c.Receipts != 1 {
				t.Fatalf("aborted replay changed rows: %+v", c)
			}
		})
	}
}

// BE01-F02 (intake probe parity): an elapsed pending boundary fails closed before
// any domain mutation or fence advancement; the transaction aborts and nothing is
// written.
func TestCreateRequirement_ElapsedBoundaryFailsClosed(t *testing.T) {
	s := newMatterSUT(t)
	s.world.SetElapsedBoundary(matterA)
	_, err := s.svc.CreateRequirement(context.Background(), createCmd(editorID, newKey(), anyHash))
	if !errors.Is(err, matter.ErrBoundaryDue) {
		t.Fatalf("unsupported elapsed boundary accepted: error=%v requirements=%d", err, s.world.Counts().Requirements)
	}
	if c := s.world.Counts(); c.Nodes != 0 || c.Requirements != 0 || c.Events != 0 ||
		c.Receipts != 0 || c.Audits != 0 {
		t.Fatalf("refused command wrote rows: %+v", c)
	}
	if _, ok := s.world.NextBoundary(matterA); !ok {
		t.Fatal("pending boundary disappeared after refusal")
	}
}

// BE01-F02: a not-due pending boundary is safe; the create succeeds and the boundary
// stays pending.
func TestCreateRequirement_FutureBoundaryPreserved(t *testing.T) {
	s := newMatterSUT(t)
	s.world.SetFutureBoundary(matterA)
	if _, err := s.svc.CreateRequirement(context.Background(), createCmd(editorID, newKey(), anyHash)); err != nil {
		t.Fatalf("not-due boundary must not block create: %v", err)
	}
	if _, ok := s.world.NextBoundary(matterA); !ok {
		t.Fatal("successful create cleared a not-due pending boundary")
	}
	if c := s.world.Counts(); c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
		t.Fatalf("create counts: %+v", c)
	}
}

// BE01-F02: replay performs no mutation and no fence advancement, so it is not gated
// by a pending boundary and must not clear it (explicit replay semantics).
func TestCreateRequirement_ReplayIgnoresPendingBoundary(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	first, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
	if err != nil {
		t.Fatal(err)
	}
	s.world.SetElapsedBoundary(matterA)
	replayed, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
	if err != nil {
		t.Fatalf("replay must not be gated by a pending boundary: %v", err)
	}
	first.Replayed = true
	if first != replayed {
		t.Fatal("replayed outcome changed")
	}
	if _, ok := s.world.NextBoundary(matterA); !ok {
		t.Fatal("replay cleared the pending boundary")
	}
	if c := s.world.Counts(); c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
		t.Fatalf("replay wrote rows: %+v", c)
	}
}
