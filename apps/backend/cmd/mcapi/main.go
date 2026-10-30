// Command mcapi is the MatterControl product API entry point: read config, create a
// logger, handle signals, and delegate to internal/app.
//
// Usage:
//
//	mcapi           run the product HTTP API
//	mcapi migrate   apply the PRODUCT migration bundle and exit
package main

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/signal"
	"strings"
	"syscall"

	"leonx.me/matter-control/internal/app"
	"leonx.me/matter-control/internal/config"
	"leonx.me/matter-control/internal/observability"
)

// version is set at build time: go build -ldflags "-X main.version=$(git describe --tags)".
var version = "dev"

func main() {
	cfg, err := config.LoadProduct(os.LookupEnv)
	if err != nil {
		slog.Error("invalid configuration", "error", err)
		os.Exit(1)
	}
	logger := slog.New(observability.NewContextHandler(
		slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{Level: cfg.LogLevel}),
	))
	slog.SetDefault(logger)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	context.AfterFunc(ctx, stop) // the second signal terminates immediately

	switch cmd := strings.Join(os.Args[1:], " "); cmd {
	case "":
		err = app.RunProduct(ctx, cfg, logger, app.ProductOptions{Version: version})
	case "migrate":
		err = app.MigrateProduct(ctx, cfg, logger)
	default:
		err = fmt.Errorf("unknown command %q (usage: mcapi [migrate])", cmd)
	}
	if err != nil {
		logger.Error("mcapi stopped with error", "error", err)
		os.Exit(1)
	}
}
