package productapi

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestSearchHTTPAuthenticatedBoundedRead(t *testing.T) {
	e := newEnv(t)
	for _, tc := range []struct {
		token, body string
		status      int
	}{
		{"t-alice", `{"q":"Atlas","epoch":"epoch"}`, 200},
		{"", `{"q":"Atlas","epoch":"epoch"}`, 401},
		{"t-alice", `{"q":"a","epoch":"epoch"}`, 400},
		{"t-alice", `{"q":"Atlas","epoch":"epoch","types":["people"]}`, 400},
		{"t-alice", `{"q":"Atlas","epoch":"epoch","extra":true}`, 400},
		{"t-alice", `{"q":"` + strings.Repeat("a", 17000) + `","epoch":"epoch"}`, 413},
	} {
		req := httptest.NewRequestWithContext(context.Background(), http.MethodPost, "/api/v1/search", strings.NewReader(tc.body))
		req.Header.Set("Content-Type", "application/json")
		if tc.token != "" {
			req.Header.Set("Authorization", "Bearer "+tc.token)
		}
		rec := httptest.NewRecorder()
		e.h.ServeHTTP(rec, req)
		if rec.Code != tc.status {
			t.Fatalf("status %d wanted %d: %s", rec.Code, tc.status, rec.Body.String())
		}
		if tc.status != 401 && rec.Header().Get("Cache-Control") != "private, no-store" {
			t.Fatal("cacheable")
		}
	}
}
