package app

import (
	"context"
	"log/slog"
	"testing"

	"go.uber.org/fx"

	"leonx.me/matter-control/internal/config"
)

// Wiring is resolved at runtime, so a missing provider must fail here rather than at startup.
func TestProductGraph_ResolvesEveryDependency(t *testing.T) {
	opts := productOptions(context.Background(), config.ProductConfig{}, slog.New(slog.DiscardHandler), ProductOptions{}, make(fatal, 1))
	if err := fx.ValidateApp(opts); err != nil {
		t.Fatal(err)
	}
}
