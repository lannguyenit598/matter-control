package postgres

// MC-ZCODE-NOTIF-MAILPITCH-20261110: the per-user notification seen watermark. The watermark
// belongs to the person, not to a matter: a missing row means "nothing seen", an upsert replaces
// the instant, and reading an unknown user is simply nil. Mail capture store paths are exercised
// end-to-end by the walkthrough verification (real upload → document + version + envelope) and
// their grant classes by the B1 profile; this test pins the watermark contract.

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
)

func TestNotificationSeenStore(t *testing.T) {
	dsn := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	if err := MigrateMatterControl(ctx, dsn, discardLogger()); err != nil {
		t.Fatalf("migrate mattercontrol: %v", err)
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("pool: %v", err)
	}
	defer pool.Close()
	store := NewMatterStore(pool)

	userID := uuid.NewString()
	if _, err := pool.Exec(ctx,
		`INSERT INTO users (id, idp_issuer, idp_subject, display_name) VALUES ($1, 'http://localhost:8080', $2, 'notif-probe')`,
		userID, "notif-probe-"+userID[:8]); err != nil {
		t.Fatalf("probe user: %v", err)
	}

	seen, err := store.NotificationSeen(ctx, userID)
	if err != nil {
		t.Fatalf("first read: %v", err)
	}
	if seen != nil {
		t.Fatalf("a user without a seen row must read nil, got %v", seen)
	}

	t1 := time.Date(2026, 11, 11, 8, 0, 0, 0, time.UTC)
	if err := store.SetNotificationSeen(ctx, userID, t1); err != nil {
		t.Fatalf("set: %v", err)
	}
	seen, err = store.NotificationSeen(ctx, userID)
	if err != nil {
		t.Fatalf("read after set: %v", err)
	}
	if seen == nil || !seen.Equal(t1) {
		t.Fatalf("seen %v, want %v", seen, t1)
	}

	// The upsert replaces the instant: moving the watermark forward is the whole contract.
	t2 := t1.Add(time.Hour)
	if err := store.SetNotificationSeen(ctx, userID, t2); err != nil {
		t.Fatalf("reset: %v", err)
	}
	seen, err = store.NotificationSeen(ctx, userID)
	if err != nil {
		t.Fatalf("read after reset: %v", err)
	}
	if seen == nil || !seen.Equal(t2) {
		t.Fatalf("seen %v, want %v", seen, t2)
	}

	// An unknown user is "nothing seen", never an error.
	seen, err = store.NotificationSeen(ctx, uuid.NewString())
	if err != nil || seen != nil {
		t.Fatalf("unknown user: seen %v err %v, want nil nil", seen, err)
	}
}
