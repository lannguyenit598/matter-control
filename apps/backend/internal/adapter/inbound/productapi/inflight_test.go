package productapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"

	"github.com/example/userapi/internal/core/port"
)

// gateVerifier parks every Verify call until release is closed, so a request holds its slot.
type gateVerifier struct {
	entered chan struct{}
	release chan struct{}
}

func (g *gateVerifier) Verify(ctx context.Context, _ string) (port.VerifiedToken, error) {
	g.entered <- struct{}{}
	select {
	case <-g.release:
	case <-ctx.Done():
	}
	return port.VerifiedToken{}, port.ErrUnauthenticated
}

func serve(h http.Handler, path string) *httptest.ResponseRecorder {
	req := httptest.NewRequestWithContext(context.Background(), http.MethodGet, path, nil)
	req.Header.Set("Authorization", "Bearer t")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func TestMaxInFlight_RefusesBeyondTheCapAndFreesTheSlot(t *testing.T) {
	g := &gateVerifier{entered: make(chan struct{}, 4), release: make(chan struct{})}
	h := NewServer(Deps{Verifier: g, MaxInFlight: 1})

	var wg sync.WaitGroup
	wg.Add(1)
	go func() { defer wg.Done(); serve(h, "/api/v1/workspaces") }()
	<-g.entered // the first request now holds the only slot

	over := serve(h, "/api/v1/workspaces")
	if over.Code != http.StatusServiceUnavailable || over.Header().Get("Retry-After") == "" {
		t.Fatalf("over the cap: %d retry-after=%q body=%s", over.Code, over.Header().Get("Retry-After"), over.Body)
	}
	if got := over.Header().Get("Content-Type"); got != problemContentType {
		t.Fatalf("content type %q", got)
	}
	// Probes are never throttled: a saturated pod must still answer them.
	if hz := serve(h, "/healthz"); hz.Code != http.StatusOK {
		t.Fatalf("healthz while saturated: %d", hz.Code)
	}

	close(g.release)
	wg.Wait()
	if after := serve(h, "/api/v1/workspaces"); after.Code != http.StatusUnauthorized {
		t.Fatalf("slot not released: %d", after.Code) // reached the verifier again, which refuses
	}
}

func TestMaxInFlight_ZeroMeansUnlimited(t *testing.T) {
	g := &gateVerifier{entered: make(chan struct{}, 8), release: make(chan struct{})}
	close(g.release)
	h := NewServer(Deps{Verifier: g})
	for i := 0; i < 5; i++ {
		if r := serve(h, "/api/v1/workspaces"); r.Code != http.StatusUnauthorized {
			t.Fatalf("request %d: %d", i, r.Code)
		}
	}
}
