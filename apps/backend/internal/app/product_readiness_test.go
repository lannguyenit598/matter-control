package app

import (
	"context"
	"errors"
	"io"
	"log/slog"
	"net"
	"net/http"
	"net/http/httptest"
	"sync/atomic"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"go.uber.org/fx"
	"go.uber.org/fx/fxtest"

	"leonx.me/matter-control/internal/config"
	"leonx.me/matter-control/internal/core/port"
)

type refusingVerifier struct{}

func (refusingVerifier) Verify(context.Context, string) (port.VerifiedToken, error) {
	return port.VerifiedToken{}, port.ErrUnauthenticated
}

func TestProductReadiness_ClosedPoolIsUnavailable(t *testing.T) {
	pool, err := pgxpool.New(context.Background(), "postgres://127.0.0.1:1/synthetic")
	if err != nil {
		t.Fatal(err)
	}
	pool.Close()
	var srv *http.Server
	var objects port.ObjectStore
	a := fx.New(productOptions(context.Background(), config.ProductConfig{
		ObjectDir: t.TempDir(), RequestTimeout: time.Second,
	}, slog.New(slog.DiscardHandler), ProductOptions{}, make(fatal, 1)),
		fx.Replace(pool), fx.Replace(fx.Annotate(refusingVerifier{}, fx.As(new(port.TokenVerifier)))), fx.Populate(&srv, &objects))
	if err := a.Err(); err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() {
		if closer, ok := objects.(io.Closer); ok {
			_ = closer.Close()
		}
	})
	for path, want := range map[string]int{"/readyz": 503, "/healthz": 200} {
		rec := httptest.NewRecorder()
		srv.Handler.ServeHTTP(rec, httptest.NewRequestWithContext(context.Background(), http.MethodGet, path, nil))
		if rec.Code != want {
			t.Fatalf("%s: got %d, want %d", path, rec.Code, want)
		}
	}
}

func TestReadiness_BoundsAndCancellation(t *testing.T) {
	var draining atomic.Bool
	for _, canceled := range []bool{false, true} {
		ctx, cancel := context.WithCancel(context.Background())
		if canceled {
			cancel()
		}
		err := readiness(&draining, func(ctx context.Context) error {
			deadline, ok := ctx.Deadline()
			if !ok || time.Until(deadline) > 500*time.Millisecond {
				t.Error("database probe lacks bounded deadline")
			}
			return ctx.Err()
		})(ctx)
		cancel()
		if (err != nil) != canceled {
			t.Fatalf("canceled=%v: %v", canceled, err)
		}
	}
	draining.Store(true)
	if err := readiness(&draining, func(context.Context) error {
		t.Fatal("draining must not call database")
		return nil
	})(context.Background()); !errors.Is(err, errDraining) {
		t.Fatalf("draining: %v", err)
	}
}

func TestProductShutdown_DrainsOrCancelsRequests(t *testing.T) {
	for _, forced := range []bool{false, true} {
		t.Run(map[bool]string{false: "drain", true: "cancel"}[forced], func(t *testing.T) {
			pool, err := pgxpool.New(context.Background(), "postgres://127.0.0.1:1/synthetic")
			if err != nil {
				t.Fatal(err)
			}
			defer pool.Close()
			lc := fxtest.NewLifecycle(t)
			ln, err := (&net.ListenConfig{}).Listen(context.Background(), "tcp", "127.0.0.1:0")
			if err != nil {
				t.Fatal(err)
			}
			defer ln.Close()
			srv := newProductHTTPServer(lc, config.ProductConfig{HTTPAddr: "127.0.0.1:0", RequestTimeout: time.Second,
				TransferTimeout: 2 * time.Second, ShutdownTimeout: 100 * time.Millisecond},
				slog.New(slog.DiscardHandler), ProductOptions{Listener: ln}, nil, nil, nil, nil, nil, nil, nil, nil, nil, nil, pool, make(fatal, 1))
			if srv.WriteTimeout != 7*time.Second || srv.ReadTimeout != 30*time.Second {
				t.Fatalf("server budgets read=%v write=%v", srv.ReadTimeout, srv.WriteTimeout)
			}
			entered, finished := make(chan struct{}), make(chan struct{})
			release := make(chan struct{})
			srv.Handler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				close(entered)
				select {
				case <-release:
					w.WriteHeader(http.StatusNoContent)
				case <-r.Context().Done():
				}
				close(finished)
			})
			// A real connection inherits BaseContext and exercises Shutdown's active-request path.
			if err := lc.Start(context.Background()); err != nil {
				t.Fatal(err)
			}
			defer srv.Close()
			client := &http.Client{Timeout: 3 * time.Second, Transport: &http.Transport{DisableKeepAlives: true}}
			done := make(chan struct{})
			go func() {
				defer close(done)
				req, reqErr := http.NewRequestWithContext(context.Background(), http.MethodGet, "http://"+ln.Addr().String(), nil)
				if reqErr != nil {
					return
				}
				resp, requestErr := client.Do(req)
				if requestErr == nil {
					_ = resp.Body.Close()
				}
			}()
			select {
			case <-entered:
			case <-time.After(3 * time.Second):
				t.Fatal("request did not enter")
			}
			if !forced {
				close(release)
			}
			start := time.Now()
			stopErr := lc.Stop(context.Background())
			if (stopErr != nil) != forced || time.Since(start) > 2*time.Second {
				t.Fatalf("stop forced=%v: %v", forced, stopErr)
			}
			select {
			case <-finished:
			case <-time.After(time.Second):
				t.Fatal("request not drained/canceled")
			}
			select {
			case <-done:
			case <-time.After(time.Second):
				t.Fatal("client not released")
			}
		})
	}
}
