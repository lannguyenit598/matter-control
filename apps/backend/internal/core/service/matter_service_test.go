package service_test

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/google/uuid"

	"leonx.me/matter-control/internal/adapter/outbound/repotest/mattercontrol"
	"leonx.me/matter-control/internal/adapter/outbound/system"
	"leonx.me/matter-control/internal/core/domain"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

// Deterministic world fixtures.
var (
	editorID       = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	secondEditorID = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	viewerID       = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	outsider       = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	wsOwnerID      = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	workspace      = matter.WorkspaceID(uuid.Must(uuid.NewV7()).String())
	matterA        = matter.MatterID(uuid.Must(uuid.NewV7()).String())
)

const anyHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

type matterSUT struct {
	svc   port.MatterService
	store *mattercontrol.Store
	world *mattercontrol.MemoryWorld
}

func newMatterSUT(t *testing.T) matterSUT {
	t.Helper()
	return newMatterSUTWithKeyAge(t, matter.KeyAgePolicy{})
}

// fixtureBase anchors the deterministic store clock; keyAt mints a UUIDv7 whose
// embedded timestamp is the given instant, so key-age policy tests are clock-driven.
var fixtureBase = time.Date(2026, 10, 25, 12, 0, 0, 0, time.UTC)

func newMatterSUTWithKeyAge(t *testing.T, keyAge matter.KeyAgePolicy) matterSUT {
	t.Helper()
	n := 0
	clock := func() time.Time { n++; return fixtureBase.Add(time.Duration(n) * time.Second) }
	store := mattercontrol.NewMemoryStore(clock)
	world := mattercontrol.NewMemoryWorld(store)
	seed(t, world)
	svc := service.NewMatterService(store, system.RecordIDv7{}, discardLogger(), keyAge)
	return matterSUT{svc: svc, store: store, world: world}
}

func discardLogger() *slog.Logger { return slog.New(slog.NewTextHandler(io.Discard, nil)) }

func seed(t *testing.T, w *mattercontrol.MemoryWorld) {
	t.Helper()
	for _, a := range []matter.ActorID{editorID, viewerID, wsOwnerID} {
		w.AddUser(a)
	}
	w.AddWorkspace(workspace)
	w.SetWorkspaceMembership(workspace, editorID, matter.WorkspaceRoleMember, matter.StatusActive)
	w.SetWorkspaceMembership(workspace, viewerID, matter.WorkspaceRoleMember, matter.StatusActive)
	w.SetWorkspaceMembership(workspace, wsOwnerID, matter.WorkspaceRoleOwner, matter.StatusActive)
	w.AddMatter(matterA, workspace)
	w.SetMatterMembership(matterA, editorID, matter.MatterRoleEditor, matter.StatusActive)
	w.SetMatterMembership(matterA, viewerID, matter.MatterRoleViewer, matter.StatusActive)
}

func newKey() string { return uuid.Must(uuid.NewV7()).String() }

// keyAt builds a canonical UUIDv7 string carrying t's millisecond timestamp.
func keyAt(t time.Time) string {
	ms := t.UnixMilli()
	hi := uint64(ms >> 16)
	mid := uint64(ms & 0xffff)
	return fmt.Sprintf("%08x-%04x-7000-8000-000000000001", hi, mid)
}

func createCmd(actor matter.ActorID, key, hash string) port.CreateRequirementCmd {
	return port.CreateRequirementCmd{
		ActorID:        actor.String(),
		MatterID:       matterA.String(),
		IdempotencyKey: key,
		RequestHash:    hash,
		Title:          "Sign the SPA",
		Outcome:        "Executed SPA countersigned by both parties",
	}
}

// BE01-T02/T08: malformed commands are rejected by validation before any store access.
func TestCreateRequirement_ValidationBeforeStore(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	cases := []struct {
		name string
		mut  func(*port.CreateRequirementCmd)
	}{
		{"bad actor", func(c *port.CreateRequirementCmd) { c.ActorID = "nope" }},
		{"bad matter", func(c *port.CreateRequirementCmd) { c.MatterID = "nope" }},
		{"non-v7 key", func(c *port.CreateRequirementCmd) { c.IdempotencyKey = "00000000-0000-4000-8000-000000000001" }},
		{"bad hash", func(c *port.CreateRequirementCmd) { c.RequestHash = "deadbeef" }},
		{"blank title", func(c *port.CreateRequirementCmd) { c.Title = "   " }},
		{"blank outcome", func(c *port.CreateRequirementCmd) { c.Outcome = "" }},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			cmd := createCmd(editorID, newKey(), anyHash)
			tc.mut(&cmd)
			_, err := s.svc.CreateRequirement(ctx, cmd)
			var v *domain.ValidationError
			if !errors.As(err, &v) {
				t.Fatalf("want ValidationError, got %v", err)
			}
			if c := s.world.Counts(); c.Nodes != 0 || c.Requirements != 0 || c.Events != 0 || c.Receipts != 0 {
				t.Fatalf("store touched by invalid command: %+v", c)
			}
		})
	}
}

// BE01-T03: one successful create yields exactly one typed row, one history event and
// one receipt with its represented matter; no security audit on success.
func TestCreateRequirement_OneAtomicOutcome(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	res, err := s.svc.CreateRequirement(ctx, createCmd(editorID, newKey(), anyHash))
	if err != nil {
		t.Fatal(err)
	}
	if res.Replayed {
		t.Fatal("first create must not be marked replayed")
	}
	if res.Requirement.ExecutionState != matter.ExecutionNotStarted ||
		res.Requirement.VerificationState != matter.VerificationUnverified ||
		res.Requirement.DependencyState != matter.DependencyReady ||
		res.Requirement.Revision != 1 || res.Requirement.ProofEpoch != 0 {
		t.Fatalf("initial shape wrong: %+v", res.Requirement)
	}
	if res.Seq != 1 {
		t.Fatalf("seq = %d, want 1", res.Seq)
	}
	if res.RecordedAt.IsZero() {
		t.Fatal("recorded time missing")
	}
	c := s.world.Counts()
	if c.Nodes != 1 || c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 || c.ReceiptMatters != 1 {
		t.Fatalf("counts after create: %+v", c)
	}
	if c.Audits != 0 {
		t.Fatalf("success must not audit: %+v", c)
	}
}

// BE01-T02: the operation matrix through the service: VIEWER is forbidden; missing or
// revoked memberships and foreign scopes fail uniformly as not-found; denials write no
// domain-success event, only a restricted audit row.
func TestCreateRequirement_DenialMatrix(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()

	t.Run("viewer member is forbidden", func(t *testing.T) {
		before := s.world.Counts()
		_, err := s.svc.CreateRequirement(ctx, createCmd(viewerID, newKey(), anyHash))
		if !errors.Is(err, port.ErrForbidden) {
			t.Fatalf("want ErrForbidden, got %v", err)
		}
		after := s.world.Counts()
		if after.Requirements != before.Requirements || after.Events != before.Events ||
			after.Receipts != before.Receipts {
			t.Fatalf("denial wrote domain rows: %+v -> %+v", before, after)
		}
		if after.Audits != before.Audits+1 {
			t.Fatalf("denial must audit once: %+v -> %+v", before, after)
		}
	})

	t.Run("workspace owner without matter membership is uniform not-found", func(t *testing.T) {
		_, err := s.svc.CreateRequirement(ctx, createCmd(wsOwnerID, newKey(), anyHash))
		if !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("want ErrNotFound, got %v", err)
		}
	})

	t.Run("complete outsider is uniform not-found", func(t *testing.T) {
		_, err := s.svc.CreateRequirement(ctx, createCmd(outsider, newKey(), anyHash))
		if !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("want ErrNotFound, got %v", err)
		}
	})

	t.Run("nonexistent matter is uniform not-found", func(t *testing.T) {
		cmd := createCmd(editorID, newKey(), anyHash)
		cmd.MatterID = uuid.Must(uuid.NewV7()).String()
		_, err := s.svc.CreateRequirement(ctx, cmd)
		if !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("want ErrNotFound, got %v", err)
		}
	})
	if c := s.world.Counts(); c.Requirements != 0 || c.Events != 0 || c.Receipts != 0 {
		t.Fatalf("denials wrote rows: %+v", c)
	}
}

// BE01-T04: sequential replay returns the immutable stored result; nothing new is written.
func TestCreateRequirement_SequentialReplay(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	first, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
	if err != nil {
		t.Fatal(err)
	}
	second, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
	if err != nil {
		t.Fatal(err)
	}
	if !second.Replayed {
		t.Fatal("replay must be marked")
	}
	first.Replayed = true
	if first != second {
		t.Fatalf("replayed result differs:\n first  %+v\n second %+v", first, second)
	}
	if c := s.world.Counts(); c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
		t.Fatalf("replay wrote rows: %+v", c)
	}
}

// BE01-T04: repository restart replays the stored receipt.
func TestCreateRequirement_ReplayAfterRestart(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	first, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
	if err != nil {
		t.Fatal(err)
	}
	reopened := service.NewMatterService(s.world.Reopen(), system.RecordIDv7{}, discardLogger(), matter.KeyAgePolicy{})
	second, err := reopened.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
	if err != nil {
		t.Fatal(err)
	}
	first.Replayed = true
	if first != second {
		t.Fatalf("restart replay differs:\n first  %+v\n second %+v", first, second)
	}
}

// BE01-T05: the same actor+key with a different fingerprint is key reuse; the stored
// outcome is not returned and no second effect happens.
func TestCreateRequirement_KeyReuse(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash)); err != nil {
		t.Fatal(err)
	}
	other := strings.Repeat("cd", 32)
	_, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, other))
	if !errors.Is(err, port.ErrIdempotencyKeyReuse) {
		t.Fatalf("want ErrIdempotencyKeyReuse, got %v", err)
	}
	if c := s.world.Counts(); c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
		t.Fatalf("reuse wrote rows: %+v", c)
	}
}

// BE01-T05: the same key under a different actor is an independent intent.
func TestCreateRequirement_SameKeyDifferentActor(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash)); err != nil {
		t.Fatal(err)
	}
	s.world.AddUser(secondEditorID)
	s.world.SetWorkspaceMembership(workspace, secondEditorID, matter.WorkspaceRoleMember, matter.StatusActive)
	s.world.SetMatterMembership(matterA, secondEditorID, matter.MatterRoleEditor, matter.StatusActive)
	if _, err := s.svc.CreateRequirement(ctx, createCmd(secondEditorID, key, anyHash)); err != nil {
		t.Fatalf("independent actor intent failed: %v", err)
	}
	if c := s.world.Counts(); c.Requirements != 2 || c.Receipts != 2 {
		t.Fatalf("two actors must create two outcomes: %+v", c)
	}
}

// BE01-T03: an injected failure at any transaction step rolls back everything.
func TestCreateRequirement_InjectedFailureRollsBack(t *testing.T) {
	for _, step := range []string{"insert_node", "insert_requirement", "append_event", "store_receipt", "complete_matter"} {
		t.Run(step, func(t *testing.T) {
			s := newMatterSUT(t)
			s.store.FailAt = step
			_, err := s.svc.CreateRequirement(context.Background(), createCmd(editorID, newKey(), anyHash))
			if err == nil || errors.Is(err, port.ErrNotFound) {
				t.Fatalf("injected failure must surface, got %v", err)
			}
			if c := s.world.Counts(); c.Nodes != 0 || c.Requirements != 0 || c.Events != 0 ||
				c.Receipts != 0 || c.ReceiptMatters != 0 {
				t.Fatalf("rollback incomplete after %s: %+v", step, c)
			}
		})
	}
}

// BE01-T08: a lost commit acknowledgement is OUTCOME_UNKNOWN, never proof of rollback;
// a known rollback stays unavailable. Neither invents a result.
func TestCreateRequirement_CommitOutcomes(t *testing.T) {
	t.Run("unknown outcome commits but loses the acknowledgement", func(t *testing.T) {
		s := newMatterSUT(t)
		s.store.CommitUnknown = errors.New("connection reset during commit")
		_, err := s.svc.CreateRequirement(context.Background(), createCmd(editorID, newKey(), anyHash))
		if !errors.Is(err, port.ErrOutcomeUnknown) {
			t.Fatalf("want ErrOutcomeUnknown, got %v", err)
		}
		if c := s.world.Counts(); c.Requirements != 1 || c.Receipts != 1 {
			t.Fatalf("lost ack must leave the committed effect: %+v", c)
		}
	})
	t.Run("known rollback is unavailable with no effect", func(t *testing.T) {
		s := newMatterSUT(t)
		s.store.CommitRollback = errors.New("serialization failure")
		_, err := s.svc.CreateRequirement(context.Background(), createCmd(editorID, newKey(), anyHash))
		if !errors.Is(err, port.ErrUnavailable) {
			t.Fatalf("want ErrUnavailable, got %v", err)
		}
		if c := s.world.Counts(); c.Requirements != 0 || c.Receipts != 0 {
			t.Fatalf("known rollback must leave nothing: %+v", c)
		}
	})
}

// BE01-T04: injected key-age policy rejects old and future keys without executing;
// a fresh key creates and replays. The policy values are explicit test inputs.
func TestCreateRequirement_KeyAgePolicy(t *testing.T) {
	ctx := context.Background()
	t.Run("fresh key creates and replays", func(t *testing.T) {
		s := newMatterSUTWithKeyAge(t, matter.KeyAgePolicy{Retention: 10 * time.Minute, AllowedSkew: time.Minute})
		key := keyAt(fixtureBase.Add(time.Minute)) // fixture clock starts at fixtureBase+1s
		if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash)); err != nil {
			t.Fatal(err)
		}
		if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash)); err != nil {
			t.Fatalf("fresh replay rejected: %v", err)
		}
	})
	t.Run("expired key is rejected without effect", func(t *testing.T) {
		s := newMatterSUTWithKeyAge(t, matter.KeyAgePolicy{Retention: 10 * time.Minute, AllowedSkew: time.Minute})
		key := keyAt(fixtureBase.Add(-time.Hour))
		_, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
		if !errors.Is(err, matter.ErrKeyExpired) {
			t.Fatalf("want ErrKeyExpired, got %v", err)
		}
		if c := s.world.Counts(); c.Requirements != 0 || c.Receipts != 0 {
			t.Fatalf("expired key wrote rows: %+v", c)
		}
	})
	t.Run("key beyond future skew is rejected without effect", func(t *testing.T) {
		s := newMatterSUTWithKeyAge(t, matter.KeyAgePolicy{Retention: 10 * time.Minute, AllowedSkew: time.Minute})
		key := keyAt(fixtureBase.Add(time.Hour))
		_, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
		if !errors.Is(err, matter.ErrKeyExpired) {
			t.Fatalf("want ErrKeyExpired, got %v", err)
		}
		if c := s.world.Counts(); c.Requirements != 0 || c.Receipts != 0 {
			t.Fatalf("future key wrote rows: %+v", c)
		}
	})
}

// BE01-T06: revocation defeats new writes and replays uniformly.
func TestCreateRequirement_RevocationBeatsCreateAndReplay(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash)); err != nil {
		t.Fatal(err)
	}
	s.world.SetMatterMembership(matterA, editorID, matter.MatterRoleEditor, matter.StatusRevoked)
	if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash)); !errors.Is(err, port.ErrNotFound) {
		t.Fatalf("replay after revocation: want uniform ErrNotFound, got %v", err)
	}
	if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, newKey(), anyHash)); !errors.Is(err, port.ErrNotFound) {
		t.Fatalf("create after revocation: want uniform ErrNotFound, got %v", err)
	}
	if c := s.world.Counts(); c.Requirements != 1 {
		t.Fatalf("revocation path wrote rows: %+v", c)
	}
}

// BE01-T06: demotion to VIEWER keeps replay (read access) but blocks new creates.
func TestCreateRequirement_DemotionKeepsReplayBlocksCreate(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	first, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
	if err != nil {
		t.Fatal(err)
	}
	s.world.SetMatterMembership(matterA, editorID, matter.MatterRoleViewer, matter.StatusActive)
	replayed, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
	if err != nil {
		t.Fatalf("replay after demotion failed: %v", err)
	}
	first.Replayed = true
	if first != replayed {
		t.Fatal("replayed result changed after demotion")
	}
	if _, err := s.svc.CreateRequirement(ctx, createCmd(editorID, newKey(), anyHash)); !errors.Is(err, port.ErrForbidden) {
		t.Fatalf("new create after demotion: want ErrForbidden, got %v", err)
	}
}

// BE01-T04: concurrent same-key creates produce exactly one effect; every caller gets
// the same immutable outcome (one fresh, the rest replayed).
func TestCreateRequirement_ConcurrentSameKeyOneEffect(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	key := newKey()
	const n = 8
	errs := make([]error, n)
	results := make([]matter.RequirementCreatedResult, n)
	start := make(chan struct{})
	var wg sync.WaitGroup
	for i := range n {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			res, err := s.svc.CreateRequirement(ctx, createCmd(editorID, key, anyHash))
			results[i], errs[i] = res, err
		}()
	}
	close(start)
	wg.Wait()
	fresh := 0
	for i := range n {
		if errs[i] != nil {
			t.Fatalf("goroutine %d: %v", i, errs[i])
		}
		if !results[i].Replayed {
			fresh++
		}
		normalized := results[i]
		normalized.Replayed = true
		want := results[0]
		want.Replayed = true
		if normalized != want {
			t.Fatalf("goroutine %d result differs", i)
		}
	}
	if fresh != 1 {
		t.Fatalf("fresh results = %d, want 1", fresh)
	}
	if c := s.world.Counts(); c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
		t.Fatalf("concurrency wrote more than one effect: %+v", c)
	}
}

// BE01-T07: reads authorize inside the snapshot; inaccessible, nonexistent and
// kind-mismatched ids are indistinguishable.
func TestGetRequirement_UniformNotFound(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	res, err := s.svc.CreateRequirement(ctx, createCmd(editorID, newKey(), anyHash))
	if err != nil {
		t.Fatal(err)
	}

	actionNode := matter.NodeID(uuid.Must(uuid.NewV7()).String())
	s.world.InsertActionNode(actionNode, matterA)

	// Malformed ids are validation errors, decided before store access; the uniform
	// not-found outcome covers the inaccessible/nonexistent/kind-mismatch triple.
	t.Run("malformed id is a validation error", func(t *testing.T) {
		_, err := s.svc.GetRequirement(ctx, port.GetRequirementQuery{ActorID: editorID.String(), ID: "nope"})
		var v *domain.ValidationError
		if !errors.As(err, &v) {
			t.Fatalf("want ValidationError, got %v", err)
		}
	})

	cases := []struct {
		name  string
		actor matter.ActorID
		id    string
	}{
		{"nonexistent id", editorID, uuid.Must(uuid.NewV7()).String()},
		{"kind mismatch (action node)", editorID, actionNode.String()},
		{"outsider on existing id", outsider, res.Requirement.ID.String()},
		{"revoked member", editorID, res.Requirement.ID.String()},
	}
	// The last case revokes editor's membership first.
	s.world.SetMatterMembership(matterA, editorID, matter.MatterRoleEditor, matter.StatusRevoked)
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := s.svc.GetRequirement(ctx, port.GetRequirementQuery{ActorID: tc.actor.String(), ID: tc.id})
			if !errors.Is(err, port.ErrNotFound) {
				t.Fatalf("want uniform ErrNotFound, got %v", err)
			}
		})
	}
}

// BE01-T07: an authorized read returns the record with revision, asOf and sourceRevision.
func TestGetRequirement_Authorized(t *testing.T) {
	s := newMatterSUT(t)
	ctx := context.Background()
	created, err := s.svc.CreateRequirement(ctx, createCmd(editorID, newKey(), anyHash))
	if err != nil {
		t.Fatal(err)
	}
	for _, actor := range []matter.ActorID{editorID, viewerID} {
		read, err := s.svc.GetRequirement(ctx, port.GetRequirementQuery{ActorID: actor.String(), ID: created.Requirement.ID.String()})
		if err != nil {
			t.Fatalf("actor %s: %v", actor, err)
		}
		if read.Requirement != created.Requirement {
			t.Fatalf("read differs from created:\n read    %+v\n created %+v", read.Requirement, created.Requirement)
		}
		if read.Requirement.Revision != 1 {
			t.Fatalf("revision = %d", read.Requirement.Revision)
		}
		if read.AsOf.IsZero() {
			t.Fatal("asOf missing")
		}
		if read.SourceRevision != created.Seq {
			t.Fatalf("sourceRevision = %d, want %d", read.SourceRevision, created.Seq)
		}
	}
}

// BE01-T08: an unavailable snapshot is never reported as empty or not-found.
func TestGetRequirement_UnavailableIsDistinct(t *testing.T) {
	s := newMatterSUT(t)
	ctx, cancel := context.WithCancel(context.Background())
	created, err := s.svc.CreateRequirement(ctx, createCmd(editorID, newKey(), anyHash))
	if err != nil {
		t.Fatal(err)
	}
	cancel()
	_, err = s.svc.GetRequirement(ctx, port.GetRequirementQuery{ActorID: editorID.String(), ID: created.Requirement.ID.String()})
	if !errors.Is(err, port.ErrUnavailable) {
		t.Fatalf("want ErrUnavailable, got %v", err)
	}
	if errors.Is(err, port.ErrNotFound) {
		t.Fatal("unavailable misclassified as not-found")
	}
}
