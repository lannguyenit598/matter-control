package productapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"leonx.me/matter-control/internal/core/port"
)

type deadlineVerifier struct{ remaining time.Duration }

func (v *deadlineVerifier) Verify(ctx context.Context, _ string) (port.VerifiedToken, error) {
	deadline, _ := ctx.Deadline()
	v.remaining = time.Until(deadline)
	return port.VerifiedToken{}, port.ErrUnauthenticated
}

func TestTimeout_TransferRoutesHaveSeparateBudget(t *testing.T) {
	for _, route := range []struct {
		method, path string
		want         time.Duration
	}{
		{http.MethodGet, "/api/v1/workspaces", 10 * time.Second},
		{http.MethodPost, "/api/v1/matters/m/documents/d/versions", 60 * time.Second},
		{http.MethodGet, "/api/v1/matters/m/documents/d/versions/v/content", 60 * time.Second},
		{http.MethodPost, "/api/v1/matters/m/import/preview", 60 * time.Second},
		{http.MethodPost, "/api/v1/matters/m/import/commit", 60 * time.Second},
		{http.MethodPost, "/api/v1/matters/m/bulk/commit", 60 * time.Second},
		{http.MethodGet, "/api/v1/matters/m/export", 60 * time.Second},
	} {
		t.Run(route.path, func(t *testing.T) {
			v := &deadlineVerifier{}
			h := NewServer(Deps{Verifier: v})
			req := httptest.NewRequestWithContext(context.Background(), route.method, route.path, nil)
			req.Header.Set("Authorization", "Bearer synthetic")
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)
			if rec.Code != http.StatusUnauthorized || v.remaining > route.want || v.remaining < route.want-time.Second {
				t.Fatalf("status=%d budget=%s want=%s", rec.Code, v.remaining, route.want)
			}
		})
	}
}

func TestTimeout_ConfiguredTransferHonorsEarlierCallerDeadline(t *testing.T) {
	for _, caller := range []time.Duration{0, time.Second} {
		v := &deadlineVerifier{}
		h := NewServer(Deps{Verifier: v, RequestTimeout: time.Second, TransferTimeout: 3 * time.Second})
		ctx := context.Background()
		want := 3 * time.Second
		if caller != 0 {
			var cancel context.CancelFunc
			ctx, cancel = context.WithTimeout(ctx, caller)
			defer cancel()
			want = caller
		}
		req := httptest.NewRequestWithContext(ctx, http.MethodPost, "/api/v1/matters/m/import/commit", nil)
		req.Header.Set("Authorization", "Bearer synthetic")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized || v.remaining > want || v.remaining < want-100*time.Millisecond {
			t.Fatalf("caller=%v remaining=%v status=%d", caller, v.remaining, rec.Code)
		}
	}
}
