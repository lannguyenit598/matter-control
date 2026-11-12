package postgres

// MC-ZCODE-NOTIF-MAILPITCH-20261110: the per-user notification seen watermark. The watermark
// belongs to the person, not to a matter: a missing row means "nothing seen", an upsert replaces
// the instant, and reading an unknown user is simply nil. Mail capture store paths are exercised
// end-to-end by the walkthrough verification (real upload → document + version + envelope) and
// their grant classes by the B1 profile; this test pins the watermark contract.

import (
	"context"
	"strings"
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
	if err := store.SetNotificationSeen(ctx, userID, []string{strings.Repeat("a", 64)}, t1); err != nil {
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
	if err := store.SetNotificationSeen(ctx, userID, []string{strings.Repeat("b", 64)}, t2); err != nil {
		t.Fatalf("reset: %v", err)
	}
	seen, err = store.NotificationSeen(ctx, userID)
	if err != nil {
		t.Fatalf("read after reset: %v", err)
	}
	if seen == nil || !seen.Equal(t2) {
		t.Fatalf("seen %v, want %v", seen, t2)
	}

	// Reopen the adapter: identity acknowledgements survive instance replacement.
	reopened := NewMatterStore(pool)
	aKey, bKey := strings.Repeat("a", 64), strings.Repeat("b", 64)
	keys, err := reopened.SeenNotificationKeys(ctx, userID, []string{aKey, bKey})
	if err != nil || len(keys) != 2 {
		t.Fatalf("persistent keys: %v %v", keys, err)
	}
	// A marker from the legacy model must not fabricate identity acknowledgements.
	legacyID := uuid.NewString()
	if _, err := pool.Exec(ctx, `INSERT INTO users (id,idp_issuer,idp_subject,display_name) VALUES ($1,'http://localhost:8080',$2,'legacy-notif')`, legacyID, legacyID); err != nil {
		t.Fatal(err)
	}
	if _, err := pool.Exec(ctx, `INSERT INTO notification_seen(user_id,seen_at) VALUES ($1,$2)`, legacyID, t2); err != nil {
		t.Fatal(err)
	}
	keys, err = reopened.SeenNotificationKeys(ctx, legacyID, []string{aKey, bKey})
	if err != nil || len(keys) != 0 {
		t.Fatalf("user isolation/legacy: %v %v", keys, err)
	}
	// Independent tabs merge their sets without regressing timestamps.
	errs := make(chan error, 2)
	for _, k := range []string{aKey, bKey} {
		go func(k string) { errs <- reopened.SetNotificationSeen(ctx, userID, []string{k}, t1) }(k)
	}
	for range 2 {
		if err := <-errs; err != nil {
			t.Fatal(err)
		}
	}
	seen, err = reopened.NotificationSeen(ctx, userID)
	if err != nil || seen == nil || !seen.Equal(t2) {
		t.Fatalf("marker regressed: %v %v", seen, err)
	}
	keys, err = reopened.SeenNotificationKeys(ctx, userID, []string{aKey, bKey})
	if err != nil || len(keys) != 2 {
		t.Fatalf("concurrent union: %v %v", keys, err)
	}
	// A constraint failure rolls back the key batch and its metadata together.
	if err := reopened.SetNotificationSeen(ctx, userID, []string{strings.Repeat("c", 64), "invalid"}, t2.Add(time.Hour)); err == nil {
		t.Fatal("expected constraint failure")
	}
	keys, err = reopened.SeenNotificationKeys(ctx, userID, []string{strings.Repeat("c", 64)})
	if err != nil || len(keys) != 0 {
		t.Fatal("partially stored a failed batch")
	}

	// An unknown user is "nothing seen", never an error.
	seen, err = store.NotificationSeen(ctx, uuid.NewString())
	if err != nil || seen != nil {
		t.Fatalf("unknown user: seen %v err %v, want nil nil", seen, err)
	}
}
