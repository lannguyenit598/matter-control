package postgres

// A1 (audit tracing) verification: a denial audit recorded on a context carrying request meta
// must round-trip the dotted client IP into the INET column and the correlation id into the
// request_id column — through the real hidden-workspace deny path, not a raw INSERT. A context
// WITHOUT meta must still record (empty fields, NULL columns). Inert without
// MC_TEST_DATABASE_URL, like the other fixture tests.

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
	"leonx.me/matter-control/internal/adapter/outbound/system"
	"leonx.me/matter-control/internal/core/domain/matter"
	"leonx.me/matter-control/internal/core/port"
	"leonx.me/matter-control/internal/core/service"
)

func TestSecurityAuditRequestMetaRoundTrip(t *testing.T) {
	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()
	dsn := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	if err := MigrateMatterControl(ctx, dsn, slog.New(slog.NewTextHandler(io.Discard, nil))); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("pool: %v", err)
	}
	defer pool.Close()
	store := NewMatterStore(pool)
	world := &pgWorld{pool: pool, tb: t, dsn: dsn}

	owner := matter.ActorID(uuid.Must(uuid.NewV7()).String())
	outsider := matter.ActorID(uuid.Must(uuid.NewV7()).String())
	ws := uuid.Must(uuid.NewV7()).String()
	world.AddUser(owner)
	world.AddWorkspace(matter.WorkspaceID(ws))
	world.SetWorkspaceMembership(matter.WorkspaceID(ws), owner, matter.WorkspaceRoleOwner, matter.StatusActive)

	svc := service.NewWorkspaceService(store, system.RecordIDv7{}, slog.New(slog.NewTextHandler(io.Discard, nil)), matter.KeyAgePolicy{})

	// The hidden GRANT (an outsider on a real workspace) takes the deny path, which records
	// the restricted audit row; read denials intentionally do not audit.
	grant := func(ctx context.Context, actor matter.ActorID) error {
		_, err := svc.GrantWorkspaceMembership(ctx, port.GrantWorkspaceMembershipCmd{
			ActorID: actor.String(), WorkspaceID: ws, UserID: outsider.String(), Role: "MEMBER", ExpectedRevision: 1,
		})
		return err
	}

	t.Run("meta travels into the INET and request_id columns", func(t *testing.T) {
		metaCtx := port.WithRequestMeta(ctx, port.RequestMeta{ClientIP: "203.0.113.7", RequestID: "rid-roundtrip-1"})
		if err := grant(metaCtx, outsider); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("hidden grant: %v", err)
		}
		audits := world.Audits()
		if len(audits) == 0 {
			t.Fatal("no audit rows recorded")
		}
		last := audits[len(audits)-1]
		if last.ClientIP != "203.0.113.7" || last.RequestID != "rid-roundtrip-1" {
			t.Fatalf("tracing fields not round-tripped: %+v", last)
		}
	})

	t.Run("a context without meta records empty fields", func(t *testing.T) {
		if err := grant(ctx, outsider); !errors.Is(err, port.ErrNotFound) {
			t.Fatalf("hidden grant: %v", err)
		}
		audits := world.Audits()
		last := audits[len(audits)-1]
		if last.ClientIP != "" || last.RequestID != "" {
			t.Fatalf("absent meta must record empty fields, got %+v", last)
		}
	})
}
