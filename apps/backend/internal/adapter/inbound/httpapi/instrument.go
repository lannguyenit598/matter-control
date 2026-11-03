// Package httpapi holds the one piece of shared HTTP plumbing that the product server still
// imports: the OpenTelemetry wrapper. The rest of the template API was removed with userapi.
// Follow-up: move Instrument next to internal/observability and delete this package.
package httpapi

import (
	"net/http"

	"go.opentelemetry.io/contrib/instrumentation/net/http/otelhttp"
)

// probePaths are not traced: probes run every few seconds on each pod.
var probePaths = map[string]bool{"/healthz": true, "/readyz": true}

// Instrument wraps a handler with OpenTelemetry at the net/http layer, outside Echo, so spans and
// metrics record the actual status of EVERY response, including errors written by the error
// handler. Probes are not traced. Without OpenTelemetry configuration, global providers are no-ops.
func Instrument(h http.Handler) http.Handler {
	return otelhttp.NewHandler(h, "http.server",
		otelhttp.WithFilter(func(r *http.Request) bool { return !probePaths[r.URL.Path] }),
	)
}
