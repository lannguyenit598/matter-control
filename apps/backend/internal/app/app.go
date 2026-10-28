// Package app bootstraps the composition root: build the Uber Fx graph that wires adapters into
// core, and manage the HTTP server lifecycle (readiness, shutdown drain, timeouts). product.go
// holds the MatterControl graph (cmd/mcapi); this file keeps the lifecycle helpers it shares.
package app

import (
	"context"
	"errors"
	"log/slog"
	"sync/atomic"
	"time"

	"go.uber.org/fx"

	"github.com/example/userapi/internal/observability"
)

// Options carries process-wide values the shared lifecycle helpers need.
type Options struct {
	Version string // Included in startup logs and OTel service.version.
}

// fatal carries the first runtime failure of a background component (HTTP server) to the run loop.
type fatal chan error

// report forwards err without blocking; the first failure wins.
func (f fatal) report(err error) {
	select {
	case f <- err:
	default:
	}
}

// dbCheck pings the database for readiness; nil when readiness does not ping DB.
type dbCheck func(context.Context) error

// runContext is the context passed to the run function (canceled on SIGTERM). fx gets an
// uncancelable start context, so start hooks that may wait long use abortOnRun to still honor it.
type runContext struct{ context.Context }

// abortOnRun returns hookCtx, additionally canceled when the run context is.
func abortOnRun(hookCtx context.Context, run runContext) (context.Context, context.CancelFunc) {
	ctx, cancel := context.WithCancel(hookCtx)
	stop := context.AfterFunc(run, cancel)
	return ctx, func() {
		stop()
		cancel()
	}
}

// startTelemetry enables OpenTelemetry on start and flushes buffered spans/metrics on stop.
// Instruments created earlier by constructors come from the global providers, which delegate to
// the SDK once Setup installs it.
func startTelemetry(lc fx.Lifecycle, opts Options, logger *slog.Logger) {
	var shutdown observability.Shutdown
	lc.Append(fx.Hook{
		OnStart: func(ctx context.Context) (err error) {
			shutdown, err = observability.Setup(ctx, opts.Version)
			return err
		},
		OnStop: func(context.Context) error {
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := shutdown(ctx); err != nil {
				logger.Warn("telemetry shutdown failed", "error", err)
			}
			return nil
		},
	})
}

var errDraining = errors.New("shutting down")

// readiness reflects this pod's own state. Database ping is optional with a short timeout because
// probes default to 1s.
func readiness(draining *atomic.Bool, checkDB dbCheck) func(context.Context) error {
	return func(ctx context.Context) error {
		if draining.Load() {
			return errDraining
		}
		if checkDB == nil {
			return nil
		}
		ctx, cancel := context.WithTimeout(ctx, 500*time.Millisecond)
		defer cancel()
		return checkDB(ctx)
	}
}
