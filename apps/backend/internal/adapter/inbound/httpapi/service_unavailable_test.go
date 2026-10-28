package httpapi_test

// A11-native parity: a TEST-ONLY decorator around the memory repository returns the same
// port.ErrUnavailable sentinel the postgres adapter produces for real faults (see
// postgres/faults_test.go), so the HTTP wire shape is asserted for both storages without any
// production fault switch, flag, or env var. No pgx/pgconn import is allowed in inbound code.

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/example/userapi/internal/adapter/inbound/httpapi"
	"github.com/example/userapi/internal/adapter/outbound/memory"
	"github.com/example/userapi/internal/core/domain"
	"github.com/example/userapi/internal/core/port"
	"github.com/example/userapi/internal/core/service"
)

// unavailableRepo wraps the memory repository and fails every use case with the shared
// sentinel, exactly as the postgres adapter does after mapError classification.
type unavailableRepo struct {
	*memory.UserRepository
}

func (unavailableRepo) Create(context.Context, domain.User) error {
	return fmt.Errorf("register user: %w", port.ErrUnavailable)
}

func (unavailableRepo) GetByID(context.Context, domain.UserID) (domain.User, error) {
	return domain.User{}, fmt.Errorf("get user: %w", port.ErrUnavailable)
}

func (unavailableRepo) List(context.Context, int, int) ([]domain.User, int, error) {
	return nil, 0, fmt.Errorf("list users: %w", port.ErrUnavailable)
}

func (unavailableRepo) Update(context.Context, domain.User, int64) error {
	return fmt.Errorf("update user: %w", port.ErrUnavailable)
}

func (unavailableRepo) Delete(context.Context, domain.UserID) error {
	return fmt.Errorf("delete user: %w", port.ErrUnavailable)
}

func TestServiceUnavailable_MemoryParity(t *testing.T) {
	svc := service.NewUserService(unavailableRepo{memory.NewUserRepository()}, &seqIDs{}, fixedClock{}, nil)
	e := httpapi.NewServer(svc, httpapi.Options{Logger: slog.New(slog.NewTextHandler(io.Discard, nil))})
	srv := httptest.NewServer(e)
	t.Cleanup(srv.Close)

	const (
		existing    = "/api/v1/users/01a15359-aa28-7a00-a380-000000000001"
		nonexistent = "/api/v1/users/01a15359-aa28-7a00-a380-000000000999"
	)

	requests := []struct {
		method string
		path   string
		body   string
	}{
		{http.MethodGet, existing, ""},
		{http.MethodGet, nonexistent, ""},
		{http.MethodGet, "/api/v1/users", ""},
		{http.MethodPost, "/api/v1/users", `{"email":"parity@example.com","name":"Parity"}`},
		{http.MethodPatch, existing, `{"name":"Parity"}`},
		{http.MethodDelete, existing, ""},
	}
	for _, ex := range requests {
		t.Run(ex.method+" "+ex.path, func(t *testing.T) {
			var body io.Reader
			if ex.body != "" {
				body = strings.NewReader(ex.body)
			}
			req, err := http.NewRequestWithContext(context.Background(), ex.method, srv.URL+ex.path, body)
			if err != nil {
				t.Fatal(err)
			}
			req.Header.Set("Content-Type", "application/json")
			resp, err := http.DefaultClient.Do(req)
			if err != nil {
				t.Fatal(err)
			}
			defer resp.Body.Close()
			if resp.StatusCode != http.StatusServiceUnavailable {
				t.Fatalf("status = %d, want 503", resp.StatusCode)
			}
			if ct := resp.Header.Get("Content-Type"); ct != "application/problem+json" {
				t.Fatalf("content-type = %q", ct)
			}
			var p struct {
				Type       string `json:"type"`
				Title      string `json:"title"`
				Status     int    `json:"status"`
				Detail     string `json:"detail"`
				Instance   string `json:"instance"`
				RetryAfter *int   `json:"retryAfter"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&p); err != nil {
				t.Fatal(err)
			}
			if p.Type != "/problems/unavailable" || p.Status != 503 ||
				p.Detail != "service temporarily unavailable" || p.RetryAfter == nil || *p.RetryAfter != 1 {
				t.Fatalf("problem = %+v (retryAfter=%v)", p, p.RetryAfter)
			}
			if p.Instance != ex.path {
				t.Fatalf("instance = %q, want %q", p.Instance, ex.path)
			}
		})
	}

	// A2-native: during unavailability, existing and nonexistent IDs get byte-identical
	// bodies except the instance field: no existence signal leaks through the error body.
	get := func(path string) string {
		req, err := http.NewRequestWithContext(context.Background(), http.MethodGet, srv.URL+path, nil)
		if err != nil {
			t.Fatal(err)
		}
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			t.Fatal(err)
		}
		defer resp.Body.Close()
		b, _ := io.ReadAll(resp.Body)
		return string(b)
	}
	a, b := get(existing), get(nonexistent)
	if !strings.Contains(a, `"instance":"`+existing+`"`) {
		t.Fatalf("body lacks its instance: %s", a)
	}
	normalize := func(s, id string) string { return strings.Replace(s, id, "ID", 1) }
	if normalize(a, existing) != normalize(b, nonexistent) {
		t.Fatalf("bodies differ beyond instance:\n%s\n%s", a, b)
	}
}

type seqIDs struct{ n int }

func (g *seqIDs) NewID() domain.UserID {
	g.n++
	return domain.UserID(fmt.Sprintf("01a15359-aa28-7a00-a380-%012d", g.n))
}

type fixedClock struct{}

func (fixedClock) Now() time.Time { return time.Date(2026, 10, 19, 8, 49, 7, 624656000, time.UTC) }
