package postgres

// BFF state retention (WP of the deploy-readiness finish): bounded deletion of expired
// mc_bff.state rows by the maintenance role. Inert unless MC_TEST_DATABASE_URL is set. The setup
// mirrors the operator order exactly: b1-roles.sql profile → bff-state.sql → b1-bff-grants.sql,
// with the maintenance role made LOGIN (the documented activation step). Synthetic rows only.

import (
	"context"
	"net/url"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
)

func TestBFFStateRetentionPurge(t *testing.T) {
	adminDSN := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()
	admin, err := pgxpool.New(ctx, adminDSN)
	if err != nil {
		t.Fatalf("admin pool: %v", err)
	}
	defer admin.Close()

	migrPass, maintPass := b1Password(t), b1Password(t)
	b1DropProfileObjects(t, admin, ctx)
	b1ApplyProfile(t, admin, ctx, map[string]string{b1Migr: migrPass, b1Maint: maintPass})
	// Activation of the cleanup role: the documented operator step (NOLOGIN until then).
	if _, err := admin.Exec(ctx, "ALTER ROLE mc_maintenance LOGIN"); err != nil {
		t.Fatalf("activate maintenance login: %v", err)
	}

	// bff-state.sql as the database admin (see b1 test: CREATE SCHEMA needs database CREATE),
	// ownership aligned, then the BFF grants — the runbook order.
	for _, sql := range b1BFFStateSQL() {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("bff-state: %v: %v", sql, err)
		}
	}
	if _, err := admin.Exec(ctx, "ALTER TABLE mc_bff.state OWNER TO mc_owner"); err != nil {
		t.Fatalf("bff-state ownership: %v", err)
	}
	for _, sql := range b1BFFGrants() {
		if _, err := admin.Exec(ctx, sql); err != nil {
			t.Fatalf("bff grants: %v: %v", sql, err)
		}
	}

	// Maintenance DSN.
	maintDSN := func() string {
		t.Helper()
		u, err := url.Parse(adminDSN)
		if err != nil {
			t.Fatalf("parse admin DSN: %v", err)
		}
		q := u.Query()
		q.Set("user", b1Maint)
		q.Set("password", maintPass)
		u.RawQuery = q.Encode()
		return u.String()
	}()
	maint, err := pgxpool.New(ctx, maintDSN)
	if err != nil {
		t.Fatalf("maintenance pool: %v", err)
	}
	defer maint.Close()

	now := time.Now()
	seed := []struct {
		key       string
		expiresAt time.Time
	}{
		{"future-1", now.Add(1 * time.Hour)},
		{"within-grace-1", now.Add(-1 * time.Hour)},
		{"within-grace-2", now.Add(-2 * time.Hour)},
		{"past-grace-1", now.Add(-25 * time.Hour)},
		{"past-grace-2", now.Add(-30 * time.Hour)},
		{"past-grace-3", now.Add(-48 * time.Hour)},
		{"past-grace-4", now.Add(-72 * time.Hour)},
		{"past-grace-5", now.Add(-96 * time.Hour)},
		{"past-grace-6", now.Add(-120 * time.Hour)},
		{"past-grace-7", now.Add(-144 * time.Hour)},
	}
	for _, r := range seed {
		if _, err := admin.Exec(ctx,
			`INSERT INTO mc_bff.state (state_key, sealed, expires_at) VALUES ($1, decode('0011', 'hex'), $2)`,
			r.key, r.expiresAt); err != nil {
			t.Fatalf("seed %s: %v", r.key, err)
		}
	}

	const grace = 24 * time.Hour
	cutoff := now.Add(-grace)

	t.Run("bounded batches delete exactly the past-grace rows", func(t *testing.T) {
		deleted, err := PurgeExpiredBFFState(ctx, maint, 2, 0, cutoff)
		if err != nil {
			t.Fatalf("purge: %v", err)
		}
		if deleted != 7 {
			t.Fatalf("deleted %d rows, want the 7 past-grace rows", deleted)
		}
		var remaining int
		if err := admin.QueryRow(ctx, `SELECT count(*) FROM mc_bff.state`).Scan(&remaining); err != nil {
			t.Fatal(err)
		}
		if remaining != 3 {
			t.Fatalf("%d rows remain, want the 3 future/within-grace rows", remaining)
		}
		// A second pass finds nothing.
		deleted, err = PurgeExpiredBFFState(ctx, maint, 2, 0, cutoff)
		if err != nil {
			t.Fatalf("second purge: %v", err)
		}
		if deleted != 0 {
			t.Fatalf("second pass deleted %d rows, want 0", deleted)
		}
	})

	t.Run("max rows bound stops the pass early", func(t *testing.T) {
		for _, r := range []string{"bound-1", "bound-2", "bound-3", "bound-4"} {
			if _, err := admin.Exec(ctx,
				`INSERT INTO mc_bff.state (state_key, sealed, expires_at) VALUES ($1, decode('0011', 'hex'), $2)`,
				r, now.Add(-72*time.Hour)); err != nil {
				t.Fatal(err)
			}
		}
		deleted, err := PurgeExpiredBFFState(ctx, maint, 3, 4, cutoff)
		if err != nil {
			t.Fatalf("purge: %v", err)
		}
		if deleted != 4 {
			t.Fatalf("deleted %d rows, want the 4 bounded rows", deleted)
		}
	})

	t.Run("maintenance role is read/delete only", func(t *testing.T) {
		if _, err := maint.Exec(ctx,
			`INSERT INTO mc_bff.state (state_key, sealed, expires_at) VALUES ('x', decode('00', 'hex'), now())`); err == nil {
			t.Fatal("maintenance INSERT must be denied")
		} else if !isPrivilegeDenied(err) {
			t.Fatalf("expected a privilege error, got %v", err)
		}
		if _, err := maint.Exec(ctx, `UPDATE mc_bff.state SET expires_at = now() + interval '1 year'`); err == nil {
			t.Fatal("maintenance UPDATE must be denied")
		} else if !isPrivilegeDenied(err) {
			t.Fatalf("expected a privilege error, got %v", err)
		}
		// The product schema stays invisible even when a table exists there. The probe is
		// admin-owned inside the role-owned schema, so it is dropped before the fixture teardown.
		if _, err := admin.Exec(ctx, "CREATE TABLE mcapp.retention_probe (id int)"); err != nil {
			t.Fatal(err)
		}
		t.Cleanup(func() {
			_, _ = admin.Exec(context.Background(), "DROP TABLE IF EXISTS mcapp.retention_probe")
		})
		if _, err := maint.Exec(ctx, `SELECT * FROM mcapp.retention_probe`); err == nil {
			t.Fatal("maintenance must not read product tables")
		} else if !isPrivilegeDenied(err) {
			t.Fatalf("expected a privilege error, got %v", err)
		}
	})
}
