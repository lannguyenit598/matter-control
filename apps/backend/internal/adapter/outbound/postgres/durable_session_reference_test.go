package postgres

// §4 (ADR-006) reference verification for the durable OIDC session + refresh-rotation design on
// PostgreSQL. The Workers frontend will hold NO tokens in process memory: the cookie carries an
// opaque random handle, and the row below is the single source of truth. This test proves the SQL
// semantics the design depends on, on a real database, before any Worker code adopts them:
//
//	rotation is atomic under concurrent refresh (exactly one winner via conditional UPDATE),
//	a destroyed/revoked/expired session cannot be refreshed or read (fail-closed),
//	refresh-token reuse after rotation is detectable (generation monotonically increases),
//	no readable token ever leaves the row without the row being valid.
//
// It is a design-verification harness (like B1), not product code: the production table arrives
// with the Workers adapter implementation under its own writer handoff and security review.
// Inert unless MC_TEST_DATABASE_URL is set.

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
)

const durableSessionDDL = `
CREATE TABLE durable_sessions (
	handle        TEXT PRIMARY KEY,          -- opaque random 256-bit, hex; the cookie value
	user_id       TEXT NOT NULL,             -- (issuer, subject) resolved identity
	access_enc    BYTEA NOT NULL,            -- access token, sealed at rest (app key)
	refresh_enc   BYTEA NOT NULL,            -- refresh token, sealed at rest (app key)
	generation    INT  NOT NULL DEFAULT 0,   -- incremented by every successful rotation
	absolute_at   TIMESTAMPTZ NOT NULL,      -- hard lifetime; refresh never extends it
	idle_until    TIMESTAMPTZ NOT NULL,      -- sliding inactivity deadline
	destroyed_at  TIMESTAMPTZ,               -- set by logout/revocation; terminal
	updated_at    TIMESTAMPTZ NOT NULL DEFAULT statement_timestamp()
)`

// refreshSession is the entire rotation protocol in one statement: the generation CAS makes the
// rotation atomic — under N concurrent refreshers exactly one UPDATE matches generation=g, the
// others match nothing and must re-read or fail closed. Revocation is checked in the same
// predicate, so a session destroyed concurrently can never be refreshed back to life.
const refreshSessionSQL = `
UPDATE durable_sessions
SET access_enc = $2, refresh_enc = $3, generation = generation + 1,
    idle_until = $4, updated_at = statement_timestamp()
WHERE handle = $1 AND generation = $5
  AND destroyed_at IS NULL AND absolute_at > statement_timestamp()
  AND idle_until > statement_timestamp()
RETURNING generation`

func TestDurableSessionRotationSemantics(t *testing.T) {
	dsn := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("pool: %v", err)
	}
	defer pool.Close()
	if _, err := pool.Exec(ctx, durableSessionDDL); err != nil {
		t.Fatalf("ddl: %v", err)
	}

	handle := randHex(t)
	access1, refresh1 := []byte("access-1"), []byte("refresh-1")
	now := time.Now().UTC()
	if _, err := pool.Exec(ctx,
		`INSERT INTO durable_sessions (handle, user_id, access_enc, refresh_enc, absolute_at, idle_until) VALUES ($1,$2,$3,$4,$5,$6)`,
		handle, "issuer|subject", access1, refresh1, now.Add(24*time.Hour), now.Add(30*time.Minute)); err != nil {
		t.Fatal(err)
	}

	t.Run("rotation is atomic under concurrent refresh", func(t *testing.T) {
		// Ten workers race to refresh generation 0: exactly one UPDATE may match.
		var wg sync.WaitGroup
		winners := make([]string, 10)
		for i := 0; i < 10; i++ {
			wg.Add(1)
			go func(i int) {
				defer wg.Done()
				conn, err := pool.Acquire(ctx)
				if err != nil {
					return
				}
				defer conn.Release()
				var gen int
				err = conn.QueryRow(ctx, refreshSessionSQL, handle,
					[]byte("access-2"), []byte("refresh-2"), now.Add(30*time.Minute), 0).Scan(&gen)
				if err == nil {
					winners[i] = fmt.Sprintf("gen=%d", gen)
				}
			}(i)
		}
		wg.Wait()
		won := 0
		for _, w := range winners {
			if w != "" {
				won++
			}
		}
		if won != 1 {
			t.Fatalf("exactly one concurrent refresh must win, got %d: %v", won, winners)
		}
		var gen int
		if err := pool.QueryRow(ctx, `SELECT generation FROM durable_sessions WHERE handle=$1`, handle).Scan(&gen); err != nil || gen != 1 {
			t.Fatalf("generation after race = %d, %v", gen, err)
		}
	})

	t.Run("stale rotation (reused old generation) matches nothing", func(t *testing.T) {
		tag, err := pool.Exec(ctx, refreshSessionSQL, handle,
			[]byte("access-stale"), []byte("refresh-stale"), now.Add(30*time.Minute), 0)
		if err != nil {
			t.Fatal(err)
		}
		if tag.RowsAffected() != 0 {
			t.Fatal("a rotation replaying the old generation must not apply")
		}
	})

	t.Run("destroyed session cannot be refreshed or read", func(t *testing.T) {
		if _, err := pool.Exec(ctx, `UPDATE durable_sessions SET destroyed_at = statement_timestamp() WHERE handle=$1`, handle); err != nil {
			t.Fatal(err)
		}
		tag, err := pool.Exec(ctx, refreshSessionSQL, handle,
			[]byte("access-3"), []byte("refresh-3"), now.Add(30*time.Minute), 1)
		if err != nil {
			t.Fatal(err)
		}
		if tag.RowsAffected() != 0 {
			t.Fatal("a destroyed session must not rotate (fail-closed)")
		}
		var n int
		if err := pool.QueryRow(ctx, `SELECT count(*) FROM durable_sessions WHERE handle=$1 AND destroyed_at IS NULL`, handle).Scan(&n); err != nil || n != 0 {
			t.Fatalf("destroyed session must not read as live: %d, %v", n, err)
		}
	})

	t.Run("expired absolute lifetime refuses rotation", func(t *testing.T) {
		h2 := randHex(t)
		if _, err := pool.Exec(ctx,
			`INSERT INTO durable_sessions (handle, user_id, access_enc, refresh_enc, absolute_at, idle_until) VALUES ($1,'u',$2,$3,$4,$5)`,
			h2, []byte("a"), []byte("r"), now.Add(-time.Second), now.Add(time.Hour)); err != nil {
			t.Fatal(err)
		}
		tag, err := pool.Exec(ctx, refreshSessionSQL, h2, []byte("a2"), []byte("r2"), now.Add(30*time.Minute), 0)
		if err != nil {
			t.Fatal(err)
		}
		if tag.RowsAffected() != 0 {
			t.Fatal("an expired session must not rotate")
		}
	})

	t.Run("expired idle lifetime refuses rotation", func(t *testing.T) {
		h := randHex(t)
		if _, err := pool.Exec(ctx,
			`INSERT INTO durable_sessions (handle, user_id, access_enc, refresh_enc, absolute_at, idle_until) VALUES ($1,'u',$2,$3,$4,$5)`,
			h, []byte("a"), []byte("r"), now.Add(time.Hour), now.Add(-time.Second)); err != nil {
			t.Fatal(err)
		}
		tag, err := pool.Exec(ctx, refreshSessionSQL, h, []byte("a2"), []byte("r2"), now.Add(30*time.Minute), 0)
		if err != nil {
			t.Fatal(err)
		}
		if tag.RowsAffected() != 0 {
			t.Fatal("an idle-expired session must not rotate")
		}
	})
}

func randHex(t *testing.T) string {
	t.Helper()
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		t.Fatal(err)
	}
	return hex.EncodeToString(b)
}
