package httpapi

// Focused tests for the single error mapping shared by the Huma operations (register) and the
// Echo error handler (newErrorHandler): cancellation precedence, unavailable classification,
// renderer type ownership, and probe byte preservation. No pgx/pgconn import is allowed in
// this package, tests included (depguard inbound-adapters rule).

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"

	"github.com/example/userapi/internal/core/domain"
	"github.com/example/userapi/internal/core/port"
)

// stubUsers fails every use case with err, like the contract tests' failingUsers but inside
// the package so renderer internals can be exercised directly.
type stubUsers struct{ err error }

func (s stubUsers) Register(context.Context, port.RegisterUserCmd) (domain.User, error) {
	return domain.User{}, s.err
}
func (s stubUsers) Get(context.Context, string) (domain.User, error) {
	return domain.User{}, s.err
}
func (s stubUsers) List(context.Context, port.ListUsersQuery) (port.UserPage, error) {
	return port.UserPage{}, s.err
}
func (s stubUsers) Update(context.Context, port.UpdateUserCmd) (domain.User, error) {
	return domain.User{}, s.err
}
func (s stubUsers) Delete(context.Context, string) error { return s.err }

var errUnavailable = fmt.Errorf("get user: %w", port.ErrUnavailable)

func TestToProblem_MappingRows(t *testing.T) {
	ve := &domain.ValidationError{}
	ve.Add("email", "must be a valid email address")

	cancelled, cancel := context.WithCancel(context.Background())
	cancel()

	cases := []struct {
		name       string
		ctx        context.Context
		err        error
		probe      bool
		wantStatus int
		wantType   string // "" means the renderer default (about:blank)
		wantDetail string
		wantRetry  int
	}{
		{"validation error", context.Background(), ve, false, http.StatusUnprocessableEntity, "", "request failed validation", 0},
		{"not found", context.Background(), fmt.Errorf("user x: %w", port.ErrNotFound), false, http.StatusNotFound, "", "resource not found", 0},
		{"email conflict", context.Background(), domain.ErrEmailAlreadyExists, false, http.StatusConflict, "", "a user with this email already exists", 0},
		{"plain version conflict", context.Background(), fmt.Errorf("update user: %w", port.ErrVersionConflict), false, http.StatusConflict, "", "the user was modified concurrently, please retry", 0},
		{"cancellation", context.Background(), context.Canceled, false, StatusClientClosedRequest, "", "client closed request", 0},
		{"cancelled request context with unavailable chain", cancelled, errUnavailable, false, StatusClientClosedRequest, "", "client closed request", 0},
		{"cancelled request context with deadline chain", cancelled, fmt.Errorf("get user: %w", context.DeadlineExceeded), false, StatusClientClosedRequest, "", "client closed request", 0},
		{"cancellation inside an unavailable chain", context.Background(), fmt.Errorf("postgres: %w: %w", port.ErrUnavailable, context.Canceled), false, StatusClientClosedRequest, "", "client closed request", 0},
		{"unavailable sentinel", context.Background(), errUnavailable, false, http.StatusServiceUnavailable, "/problems/unavailable", "service temporarily unavailable", 1},
		{"request deadline", context.Background(), fmt.Errorf("get user: %w", context.DeadlineExceeded), false, http.StatusServiceUnavailable, "/problems/unavailable", "service temporarily unavailable", 1},
		{"echo 503 non-probe", context.Background(), echo.ErrServiceUnavailable, false, http.StatusServiceUnavailable, "/problems/unavailable", "service temporarily unavailable", 1},
		{"echo 503 probe keeps legacy bytes", context.Background(), echo.ErrServiceUnavailable, true, http.StatusServiceUnavailable, "", "", 0},
		{"echo 404 unchanged", context.Background(), echo.NewHTTPError(http.StatusNotFound, "Not Found"), false, http.StatusNotFound, "", "Not Found", 0},
		{"echo 400 keeps detail", context.Background(), echo.NewHTTPError(http.StatusBadRequest, "limit must be an integer"), false, http.StatusBadRequest, "", "limit must be an integer", 0},
		{"unexpected stays 500", context.Background(), errors.New("dial tcp 10.0.0.5:5432: password=secret"), false, http.StatusInternalServerError, "", "", 0},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := toProblem(tc.ctx, tc.err, tc.probe)
			if got.Status != tc.wantStatus {
				t.Errorf("status = %d, want %d", got.Status, tc.wantStatus)
			}
			if got.Type != tc.wantType {
				t.Errorf("type = %q, want %q", got.Type, tc.wantType)
			}
			if got.Detail != tc.wantDetail {
				t.Errorf("detail = %q, want %q", got.Detail, tc.wantDetail)
			}
			if got.RetryAfter != tc.wantRetry {
				t.Errorf("retryAfter = %d, want %d", got.RetryAfter, tc.wantRetry)
			}
		})
	}
}

func TestNewErrorHandler_UnavailableBodyAndProbes(t *testing.T) {
	const existing = "/api/v1/users/01a15359-aa28-7a00-a380-000000000001"
	wantUnavailable := func(instance string) string {
		return `{"type":"/problems/unavailable","title":"Service Unavailable","status":503,` +
			`"detail":"service temporarily unavailable","instance":"` + instance + `","retryAfter":1}`
	}

	e := NewServer(stubUsers{errUnavailable}, Options{
		Logger: slog.New(slog.NewTextHandler(io.Discard, nil)),
		Ready:  func(context.Context) error { return errors.New("database unreachable") },
	})

	t.Run("api unavailable keeps the mapped type", func(t *testing.T) {
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, httptest.NewRequestWithContext(context.Background(), http.MethodGet, existing, nil))
		if rec.Code != http.StatusServiceUnavailable {
			t.Fatalf("status = %d, want 503", rec.Code)
		}
		if ct := rec.Header().Get("Content-Type"); ct != problemContentType {
			t.Fatalf("content-type = %q", ct)
		}
		if body := rec.Body.String(); body != wantUnavailable(existing) {
			t.Fatalf("body = %s\nwant %s", body, wantUnavailable(existing))
		}
	})

	t.Run("readiness probe bytes are unchanged", func(t *testing.T) {
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/readyz", nil))
		if rec.Code != http.StatusServiceUnavailable {
			t.Fatalf("status = %d, want 503", rec.Code)
		}
		want := `{"type":"about:blank","title":"Service Unavailable","status":503,"instance":"/readyz"}`
		if body := rec.Body.String(); body != want {
			t.Fatalf("probe body = %s\nwant %s", body, want)
		}
	})

	t.Run("healthz stays 200 with its current bytes", func(t *testing.T) {
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/healthz", nil))
		if rec.Code != http.StatusOK || rec.Body.String() != "{\"status\":\"ok\"}\n" {
			t.Fatalf("healthz = %d %q", rec.Code, rec.Body.String())
		}
	})

	t.Run("HEAD 503 has no body", func(t *testing.T) {
		// API routes answer HEAD with 405 (see the contract goldens), so the bodyless HEAD
		// branch of the error handler is exercised directly.
		logger := slog.New(slog.NewTextHandler(io.Discard, nil))
		rec := httptest.NewRecorder()
		e2 := echo.New()
		c := e2.NewContext(httptest.NewRequestWithContext(context.Background(), http.MethodHead, existing, nil), rec)
		c.SetPath(existing)
		newErrorHandler(logger)(c, echo.ErrServiceUnavailable)
		if rec.Code != http.StatusServiceUnavailable {
			t.Fatalf("status = %d, want 503", rec.Code)
		}
		if rec.Body.Len() != 0 {
			t.Fatalf("HEAD body must stay empty, got %q", rec.Body.String())
		}
	})

	t.Run("echo 503 on a non-probe route follows the unavailable mapping", func(t *testing.T) {
		logger := slog.New(slog.NewTextHandler(io.Discard, nil))
		rec := httptest.NewRecorder()
		e2 := echo.New()
		c := e2.NewContext(httptest.NewRequestWithContext(context.Background(), http.MethodGet, existing, nil), rec)
		c.SetPath(existing)
		newErrorHandler(logger)(c, echo.ErrServiceUnavailable)
		if rec.Code != http.StatusServiceUnavailable {
			t.Fatalf("status = %d, want 503", rec.Code)
		}
		if body := rec.Body.String(); body != wantUnavailable(existing) {
			t.Fatalf("body = %s\nwant %s", body, wantUnavailable(existing))
		}
	})
}

// TestContextTimeout_MiddlewareShape captures the actual shape Echo v5's ContextTimeout
// middleware produces (an *echo.HTTPError 503 wrapping the deadline), then asserts the single
// mapping classifies it as unavailable. This documents the observed API rather than assuming
// either an HTTPError or a raw context error.
func TestContextTimeout_MiddlewareShape(t *testing.T) {
	var captured error
	e := echo.New()
	e.HTTPErrorHandler = func(c *echo.Context, err error) {
		captured = err
		_ = c.NoContent(http.StatusInternalServerError)
	}
	e.Use(middleware.ContextTimeout(20 * time.Millisecond))
	e.GET("/probe-shape", func(c *echo.Context) error {
		<-c.Request().Context().Done()
		return c.Request().Context().Err() // what a context-aware service returns
	})

	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, httptest.NewRequestWithContext(context.Background(), http.MethodGet, "/probe-shape", nil))
	if captured == nil {
		t.Fatal("no error reached the handler")
	}
	t.Logf("observed ContextTimeout error: type=%T message=%q", captured, captured.Error())
	var he *echo.HTTPError
	if !errors.As(captured, &he) || he.Code != http.StatusServiceUnavailable {
		t.Fatalf("ContextTimeout must surface an *echo.HTTPError 503, got %T: %v", captured, captured)
	}
	if !errors.Is(captured, context.DeadlineExceeded) {
		t.Fatalf("the HTTPError must still wrap context.DeadlineExceeded, got %v", captured)
	}
	if p := toProblem(context.Background(), captured, false); p.Status != http.StatusServiceUnavailable || p.Type != "/problems/unavailable" {
		t.Fatalf("middleware timeout must map to unavailable, got %+v", p)
	}
}
