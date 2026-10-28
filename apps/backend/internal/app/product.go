package app

// Product composition root: the MatterControl product API (`mcapi`). It is a separate
// Fx graph from the native User API and talks only to the PRODUCT database and migration
// bundle. Lifecycle rules match app.go: constructors do no network I/O, start hooks open
// and ping, every started resource is released on every error path, shutdown drains.

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"sync/atomic"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/fx"
	"go.uber.org/fx/fxevent"

	"github.com/example/userapi/internal/adapter/inbound/httpapi"
	"github.com/example/userapi/internal/adapter/inbound/productapi"
	"github.com/example/userapi/internal/adapter/outbound/identity/zitadel"
	"github.com/example/userapi/internal/adapter/outbound/objectstore"
	"github.com/example/userapi/internal/adapter/outbound/postgres"
	"github.com/example/userapi/internal/adapter/outbound/sheet"
	"github.com/example/userapi/internal/adapter/outbound/system"
	"github.com/example/userapi/internal/config"
	"github.com/example/userapi/internal/core/domain/matter"
	"github.com/example/userapi/internal/core/port"
	"github.com/example/userapi/internal/core/service"
)

// ProductOptions configures RunProduct.
type ProductOptions struct {
	Version string
	// Listener: nil = listen on cfg.HTTPAddr; tests supply a 127.0.0.1:0 listener.
	Listener net.Listener
}

// RunProduct serves the product API until ctx is canceled, then drains.
func RunProduct(ctx context.Context, cfg config.ProductConfig, logger *slog.Logger, opts ProductOptions) error {
	failed := make(fatal, 1)
	app := fx.New(productOptions(ctx, cfg, logger, opts, failed))
	if err := app.Start(context.WithoutCancel(ctx)); err != nil {
		return err
	}
	var runErr error
	select {
	case runErr = <-failed:
	case <-ctx.Done():
	}
	return errors.Join(runErr, app.Stop(context.Background()))
}

// MigrateProduct applies the product migration bundle and returns (`mcapi migrate`).
func MigrateProduct(ctx context.Context, cfg config.ProductConfig, logger *slog.Logger) error {
	return postgres.MigrateMatterControl(ctx, cfg.DatabaseURL, logger)
}

func productOptions(ctx context.Context, cfg config.ProductConfig, logger *slog.Logger, opts ProductOptions, failed fatal) fx.Option {
	return fx.Options(
		fx.Supply(cfg, logger, opts, failed, runContext{ctx}, Options{Version: opts.Version}),
		fx.WithLogger(func() fxevent.Logger {
			l := &fxevent.SlogLogger{Logger: logger}
			l.UseLogLevel(slog.LevelDebug)
			l.UseErrorLevel(slog.LevelDebug)
			return l
		}),
		fx.Module("telemetry", fx.Invoke(startTelemetry)),
		productGraph(),
	)
}

func productGraph() fx.Option {
	return fx.Options(
		fx.Module("storage", fx.Provide(newProductPool, newProductStore, newProductIdentityResolver, newObjectStore)),
		fx.Module("identity", fx.Provide(newTokenVerifier)),
		fx.Module("http", fx.Provide(newProductServices, newProductHTTPServer), fx.Invoke(func(*http.Server) {})),
	)
}

func newProductPool(lc fx.Lifecycle, cfg config.ProductConfig, logger *slog.Logger, run runContext) (*pgxpool.Pool, error) {
	pool, err := postgres.NewPool(context.Background(), cfg.DatabaseURL, postgres.PoolOptions{
		MaxConns: 10, StatementTimeout: 5 * time.Second,
	})
	if err != nil {
		return nil, err
	}
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			ctx, cancel := abortOnRun(ctx, run)
			defer cancel()
			if err := prepareProductDB(ctx, cfg, pool, logger); err != nil {
				pool.Close() // fx runs no OnStop for a hook whose OnStart failed
				return err
			}
			return nil
		},
		OnStop: func(context.Context) error { pool.Close(); return nil },
	})
	return pool, nil
}

func prepareProductDB(ctx context.Context, cfg config.ProductConfig, pool *pgxpool.Pool, logger *slog.Logger) error {
	if err := postgres.Ping(ctx, pool); err != nil {
		return err
	}
	if cfg.MigrateOnStart {
		if err := postgres.MigrateMatterControl(ctx, cfg.DatabaseURL, logger); err != nil {
			return err
		}
	}
	pending, err := postgres.PendingMatterControlMigrations(ctx, pool)
	if err != nil {
		return err
	}
	if pending {
		return errors.New("product database has pending migrations: run `mcapi migrate` first (or set MC_MIGRATE_ON_START=true)")
	}
	return nil
}

func newProductStore(pool *pgxpool.Pool) *postgres.MatterStore { return postgres.NewMatterStore(pool) }

func newProductIdentityResolver(pool *pgxpool.Pool) port.IdentityResolver {
	return postgres.NewIdentityResolver(pool)
}

// apiKeyFile is the ZITADEL API application key JSON (private_key_jwt).
type apiKeyFile struct {
	KeyID    string `json:"keyId"`
	Key      string `json:"key"`
	ClientID string `json:"clientId"`
}

// newTokenVerifier reads the key file locally (no network I/O) and never logs its content.
func newTokenVerifier(cfg config.ProductConfig) (port.TokenVerifier, error) {
	raw, err := os.ReadFile(cfg.OIDC.APIKeyFile)
	if err != nil {
		return nil, fmt.Errorf("read MC_OIDC_API_KEY_FILE: %w", err)
	}
	var k apiKeyFile
	if err := json.Unmarshal(raw, &k); err != nil {
		return nil, errors.New("MC_OIDC_API_KEY_FILE is not valid key JSON")
	}
	if want := cfg.OIDC.APIClientID; want != "" && k.ClientID != want {
		// Neither id is logged: a mismatch means the wrong application's key was supplied.
		return nil, errors.New("MC_OIDC_API_KEY_FILE belongs to a different application than MC_OIDC_API_CLIENT_ID")
	}
	return zitadel.New(zitadel.Config{
		IntrospectionURL: cfg.OIDC.IntrospectionURL, Issuer: cfg.OIDC.Issuer, Audience: cfg.OIDC.Audience,
		ClientID: k.ClientID, KeyID: k.KeyID, PrivateKeyPEM: []byte(k.Key), CacheTTL: cfg.OIDC.CacheTTL,
	})
}

type productServices struct {
	fx.Out
	Workspaces port.WorkspaceService
	Matters    port.MatterService
	Work       port.WorkService
	Evidence   port.EvidenceService
	Filings    port.FilingService
	Control    port.ControlService
	DataOps    port.DataOpsService
}

// newObjectStore opens the private document directory; it is closed with the app.
func newObjectStore(lc fx.Lifecycle, cfg config.ProductConfig) (port.ObjectStore, error) {
	s, err := objectstore.New(cfg.ObjectDir)
	if err != nil {
		return nil, err
	}
	lc.Append(fx.Hook{OnStop: func(context.Context) error { return s.Close() }})
	return s, nil
}

func newProductServices(store *postgres.MatterStore, objects port.ObjectStore, logger *slog.Logger) productServices {
	ids := system.RecordIDv7{}
	work := service.NewWorkService(store, ids, logger, matter.KeyAgePolicy{})
	return productServices{
		Evidence:   service.NewEvidenceService(work, objects),
		Filings:    service.NewFilingService(work),
		Control:    service.NewControlService(work),
		Workspaces: service.NewWorkspaceService(store, ids, logger, matter.KeyAgePolicy{}),
		Matters:    service.NewMatterService(store, ids, logger, matter.KeyAgePolicy{}),
		Work:       work,
		DataOps:    service.NewDataOpsService(store, ids, sheet.Codec{}, logger),
	}
}

// newProductHTTPServer mirrors newHTTPServer's lifecycle: synchronous listen, serve in the
// background, drain on stop, cancel request contexts before the pool closes.
func newProductHTTPServer(lc fx.Lifecycle, cfg config.ProductConfig, logger *slog.Logger, opts ProductOptions,
	ws port.WorkspaceService, ms port.MatterService, work port.WorkService, evidence port.EvidenceService, filings port.FilingService, control port.ControlService, dataOps port.DataOpsService, verifier port.TokenVerifier, ids port.IdentityResolver, failed fatal,
) *http.Server {
	var draining atomic.Bool
	e := productapi.NewServer(productapi.Deps{
		Workspaces: ws, Matters: ms, Work: work, Evidence: evidence, Filings: filings, Control: control, DataOps: dataOps, DataOpsCodec: sheet.Codec{}, MaxUploadBytes: cfg.MaxUploadBytes, Verifier: verifier, Identities: ids, Logger: logger,
		Ready:          readiness(&draining, nil),
		RequestTimeout: cfg.RequestTimeout,
	})
	baseCtx, cancelRequests := context.WithCancel(context.Background())
	srv := &http.Server{
		Handler:           httpapi.Instrument(e),
		BaseContext:       func(net.Listener) context.Context { return baseCtx },
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      cfg.RequestTimeout + 5*time.Second,
		IdleTimeout:       75 * time.Second,
		ErrorLog:          slog.NewLogLogger(logger.Handler(), slog.LevelWarn),
	}
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) error {
			ln := opts.Listener
			if ln == nil {
				var err error
				if ln, err = (&net.ListenConfig{}).Listen(ctx, "tcp", cfg.HTTPAddr); err != nil {
					return fmt.Errorf("http listen: %w", err)
				}
			}
			go func() {
				if err := srv.Serve(ln); !errors.Is(err, http.ErrServerClosed) {
					failed.report(fmt.Errorf("http server: %w", err))
				}
			}()
			logger.Info("starting mcapi", "addr", ln.Addr().String(), "version", opts.Version)
			return nil
		},
		OnStop: func(context.Context) error {
			defer cancelRequests()
			draining.Store(true)
			time.Sleep(cfg.ShutdownDelay)
			shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
			defer cancel()
			if err := srv.Shutdown(shutdownCtx); err != nil {
				cancelRequests()
				_ = srv.Close()
				return fmt.Errorf("graceful shutdown: %w", err)
			}
			logger.Info("mcapi stopped gracefully")
			return nil
		},
	})
	return srv
}
