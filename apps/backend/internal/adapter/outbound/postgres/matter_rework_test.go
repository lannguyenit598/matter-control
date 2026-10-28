package postgres

// BE01 rework (R1) regressions that assert PostgreSQL row-level behavior the shared
// contract suite cannot observe: header integrity after a refused elapsed boundary
// (BE01-F02), exact preservation of a not-due boundary across CompleteMatter, and the
// unchanged receipt ledger across an explicitly replayed command.

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
	"github.com/example/userapi/internal/core/service"
)

var (
	rwEditor    = matter.ActorID(uuid.Must(uuid.NewV7()).String())
	rwWorkspace = matter.WorkspaceID(uuid.Must(uuid.NewV7()).String())
	rwMatter    = matter.MatterID(uuid.Must(uuid.NewV7()).String())
)

const rwHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

type reworkIDs struct{}

func (reworkIDs) NewRecordID() string { return uuid.Must(uuid.NewV7()).String() }

type reworkSUT struct {
	world *pgWorld
	svc   port.MatterService
	store *faultCapableStore
}

func newReworkSUT(t *testing.T) reworkSUT {
	t.Helper()
	b, fs := newProductStore(t)
	w := b.World.(*pgWorld)
	w.AddUser(rwEditor)
	w.AddWorkspace(rwWorkspace)
	w.SetWorkspaceMembership(rwWorkspace, rwEditor, matter.WorkspaceRoleMember, matter.StatusActive)
	w.AddMatter(rwMatter, rwWorkspace)
	w.SetMatterMembership(rwMatter, rwEditor, matter.MatterRoleEditor, matter.StatusActive)
	svc := service.NewMatterService(fs, reworkIDs{}, discardLogger(), matter.KeyAgePolicy{})
	return reworkSUT{world: w, svc: svc, store: fs}
}

func (s reworkSUT) create(ctx context.Context, key, hash string) (matter.RequirementCreatedResult, error) {
	return s.svc.CreateRequirement(ctx, port.CreateRequirementCmd{
		ActorID: rwEditor.String(), MatterID: rwMatter.String(),
		IdempotencyKey: key, RequestHash: hash,
		Title: "Sign the SPA", Outcome: "Executed SPA countersigned by both parties",
	})
}

// rwHeaderState reads the raw matter header row for integrity assertions.
type rwHeaderState struct {
	eventSeq       int64
	revision       int64
	lastRecordedAt time.Time
	appliedUntil   time.Time
	nextBoundary   *time.Time
}

func (s reworkSUT) headerState(t *testing.T) rwHeaderState {
	t.Helper()
	var h rwHeaderState
	err := s.world.pool.QueryRow(context.Background(),
		`SELECT event_seq, revision, last_recorded_at, boundaries_applied_until, next_boundary_at
		 FROM matters WHERE id = $1`, rwMatter.String()).
		Scan(&h.eventSeq, &h.revision, &h.lastRecordedAt, &h.appliedUntil, &h.nextBoundary)
	s.world.check("read matter header", err)
	return h
}

// BE01-F02: an elapsed pending boundary must fail closed on the real adapter — the
// command aborts with no receipt, no history and no fence advancement, and the header
// (including the pending boundary itself) is byte-identical afterwards.
func TestMatterRework_ElapsedBoundaryRollsBack_Postgres(t *testing.T) {
	sut := newReworkSUT(t)
	ctx := context.Background()
	sut.world.SetElapsedBoundary(rwMatter)
	before := sut.headerState(t)
	if before.nextBoundary == nil {
		t.Fatal("fixture: elapsed boundary not set")
	}

	_, err := sut.create(ctx, uuid.Must(uuid.NewV7()).String(), rwHash)
	if !errors.Is(err, matter.ErrBoundaryDue) {
		t.Fatalf("want ErrBoundaryDue, got %v", err)
	}
	c := sut.world.Counts()
	if c.Nodes != 0 || c.Requirements != 0 || c.Events != 0 || c.Receipts != 0 ||
		c.ReceiptMatters != 0 || c.Audits != 0 {
		t.Fatalf("refused command wrote rows: %+v", c)
	}
	after := sut.headerState(t)
	if after.eventSeq != before.eventSeq || after.revision != before.revision ||
		!after.lastRecordedAt.Equal(before.lastRecordedAt) ||
		!after.appliedUntil.Equal(before.appliedUntil) ||
		after.nextBoundary == nil || !after.nextBoundary.Equal(*before.nextBoundary) {
		t.Fatalf("header changed after refusal:\n before %+v\n after  %+v", before, after)
	}
}

// BE01-F02: a not-due pending boundary is safe. The create succeeds and
// CompleteMatter preserves the pending boundary instead of clearing it (the adapter
// divergence fixed in this rework: the memory double always preserved it).
func TestMatterRework_FutureBoundaryPreserved_Postgres(t *testing.T) {
	sut := newReworkSUT(t)
	ctx := context.Background()
	sut.world.SetFutureBoundary(rwMatter)
	before := sut.headerState(t)
	if before.nextBoundary == nil {
		t.Fatal("fixture: future boundary not set")
	}

	res, err := sut.create(ctx, uuid.Must(uuid.NewV7()).String(), rwHash)
	if err != nil {
		t.Fatalf("not-due boundary must not block create: %v", err)
	}
	c := sut.world.Counts()
	if c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 {
		t.Fatalf("create counts: %+v", c)
	}
	after := sut.headerState(t)
	if after.nextBoundary == nil || !after.nextBoundary.Equal(*before.nextBoundary) {
		t.Fatalf("pending boundary not preserved:\n before %+v\n after  %+v", before.nextBoundary, after.nextBoundary)
	}
	if after.eventSeq != res.Seq || after.revision != before.revision+1 {
		t.Fatalf("fence did not advance correctly: %+v vs seq %d", after, res.Seq)
	}
	if after.appliedUntil.Before(before.appliedUntil) {
		t.Fatalf("applied-until moved backwards: %v -> %v", before.appliedUntil, after.appliedUntil)
	}
}

// BE01-F02: replay performs no mutation and no fence advancement, so a pending
// boundary — even an elapsed one — neither blocks the replay nor is cleared by it;
// the explicit replay semantics are unchanged and the boundary stays pending.
func TestMatterRework_ReplayKeepsBoundary_Postgres(t *testing.T) {
	sut := newReworkSUT(t)
	ctx := context.Background()
	key := uuid.Must(uuid.NewV7()).String()
	first, err := sut.create(ctx, key, rwHash)
	if err != nil {
		t.Fatal(err)
	}
	sut.world.SetElapsedBoundary(rwMatter)

	replayed, err := sut.create(ctx, key, rwHash)
	if err != nil {
		t.Fatalf("replay must not be gated by a pending boundary: %v", err)
	}
	first.Replayed = true
	if first != replayed {
		t.Fatal("replayed outcome changed")
	}
	if _, ok := sut.world.NextBoundary(rwMatter); !ok {
		t.Fatal("replay cleared the pending boundary")
	}
	c := sut.world.Counts()
	if c.Requirements != 1 || c.Events != 1 || c.Receipts != 1 || c.Audits != 0 {
		t.Fatalf("replay wrote rows: %+v", c)
	}
}

func TestIdentityResolver_LookupOnly(t *testing.T) {
	b, _ := newProductStore(t)
	w := b.World.(*pgWorld)
	user := matter.ActorID(uuid.Must(uuid.NewV7()).String())
	w.AddUser(user) // issuer https://idp.example.test, subject "sub|<id>"
	r := NewIdentityResolver(w.pool)
	ctx := context.Background()

	got, err := r.Resolve(ctx, "https://idp.example.test", "sub|"+user.String())
	if err != nil || got != user.String() {
		t.Fatalf("known identity: %q %v", got, err)
	}
	for name, pair := range map[string][2]string{
		"unknown subject": {"https://idp.example.test", "sub|nobody"},
		"wrong issuer":    {"https://other.example.test", "sub|" + user.String()},
	} {
		if _, err := r.Resolve(ctx, pair[0], pair[1]); !errors.Is(err, port.ErrUnknownIdentity) {
			t.Fatalf("%s: %v", name, err)
		}
	}
	if c := w.Counts(); c.WorkspaceMembers != 0 {
		t.Fatalf("lookup must not provision: %+v", c)
	}
	var users int
	if err := w.pool.QueryRow(ctx, `SELECT count(*) FROM users`).Scan(&users); err != nil || users != 1 {
		t.Fatalf("users = %d %v", users, err)
	}
}
