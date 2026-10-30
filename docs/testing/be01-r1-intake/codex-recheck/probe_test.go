package service_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/example/userapi/internal/adapter/outbound/system"
	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
	"github.com/example/userapi/internal/core/service"
	"github.com/google/uuid"
)

func TestCodexBE01ReceiptAuthorizationAcrossMatters(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	cmd := createCmd(editorID, key, anyHash)
	if _, err := s.svc.CreateRequirement(ctx, cmd); err != nil {
		t.Fatal(err)
	}
	b := matter.MatterID(uuid.Must(uuid.NewV7()).String())
	s.world.AddMatter(b, workspace)
	s.world.SetMatterMembership(b, editorID, matter.MatterRoleEditor, matter.StatusActive)
	s.world.SetMatterMembership(matterA, editorID, matter.MatterRoleEditor, matter.StatusRevoked)
	cmd.MatterID = b.String()
	// A fingerprint for another target must differ. Authorization of represented A
	// is still required before exposing any receipt-derived reuse outcome.
	cmd.RequestHash = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
	_, err := s.svc.CreateRequirement(ctx, cmd)
	if !errors.Is(err, port.ErrNotFound) {
		t.Fatalf("represented Matter revoked: want uniform ErrNotFound before hash comparison; got %v", err)
	}
}

type codexPendingStore struct {
	port.MatterStore
	completed *bool
}
type codexPendingTx struct {
	port.MatterTx
	completed *bool
}

func (s codexPendingStore) Execute(ctx context.Context, id matter.MatterID, fn func(port.MatterTx) error) error {
	return s.MatterStore.Execute(ctx, id, func(tx port.MatterTx) error { return fn(codexPendingTx{tx, s.completed}) })
}
func (tx codexPendingTx) Matter() matter.MatterHeader {
	h := tx.MatterTx.Matter()
	due := tx.TCmd().Add(-time.Second)
	h.NextBoundaryAt = &due
	return h
}
func (tx codexPendingTx) CompleteMatter(ctx context.Context, seq int64, at time.Time) error {
	*tx.completed = true
	return tx.MatterTx.CompleteMatter(ctx, seq, at)
}
func TestCodexBE01PendingBoundaryFailsClosed(t *testing.T) {
	s := newMatterSUT(t)
	completed := false
	svc := service.NewMatterService(codexPendingStore{s.store, &completed}, system.RecordIDv7{}, discardLogger(), matter.KeyAgePolicy{})
	_, err := svc.CreateRequirement(context.Background(), createCmd(editorID, newKey(), anyHash))
	if err == nil || completed {
		t.Fatalf("unsupported elapsed boundary accepted: error=%v CompleteMatter=%t Requirements=%d", err, completed, s.world.Counts().Requirements)
	}
}

type codexUnavailableViewStore struct{ port.MatterStore }
type codexUnavailableSnapshot struct{ port.MatterSnapshot }

func (s codexUnavailableViewStore) View(ctx context.Context, fn func(port.MatterSnapshot) error) error {
	return s.MatterStore.View(ctx, func(snap port.MatterSnapshot) error { return fn(codexUnavailableSnapshot{snap}) })
}
func (s codexUnavailableSnapshot) WorkspaceMembership(context.Context, matter.WorkspaceID, matter.ActorID) (matter.WorkspaceMembership, error) {
	return matter.WorkspaceMembership{}, port.ErrUnavailable
}
func TestCodexBE01MembershipReadUnavailablePreserved(t *testing.T) {
	s := newMatterSUT(t)
	res, err := s.svc.CreateRequirement(context.Background(), createCmd(editorID, newKey(), anyHash))
	if err != nil {
		t.Fatal(err)
	}
	svc := service.NewMatterService(codexUnavailableViewStore{s.store}, system.RecordIDv7{}, discardLogger(), matter.KeyAgePolicy{})
	_, err = svc.GetRequirement(context.Background(), port.GetRequirementQuery{ActorID: editorID.String(), ID: res.Requirement.ID.String()})
	if !errors.Is(err, port.ErrUnavailable) {
		t.Fatalf("membership storage failure: want ErrUnavailable, got %v", err)
	}
}
