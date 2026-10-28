package postgres

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"

	"github.com/example/userapi/internal/core/port"
)

// combinedChain carries several errors at once through multi-error unwrap (Go 1.20), so tests can
// build chains shaped like pgconn.ConnectError wrapping a *pgconn.PgError even though ConnectError
// has no exported constructor. Real driver chains are exercised in faults_test.go.
type combinedChain struct{ errs []error }

func (c combinedChain) Error() string   { return "combined chain" }
func (c combinedChain) Unwrap() []error { return c.errs }

func TestMapError_UnavailableClassification(t *testing.T) {
	// SQLSTATE-first: every retryable code classifies as port.ErrUnavailable.
	for _, code := range []string{
		"08000", "08003", "08006", // connection exception class 08
		"57P01", "57P02", "57P03", // admin termination / the database is starting up / shutting down
		"53300", // too_many_connections
		"40P01", // deadlock_detected
		"40001", // serialization_failure
		"55P03", // lock_not_available
		"57014", // query_canceled: statement_timeout or pg_cancel_backend
	} {
		t.Run(code, func(t *testing.T) {
			err := mapError(&pgconn.PgError{Code: code, Message: "fault " + code})
			if !errors.Is(err, port.ErrUnavailable) {
				t.Fatalf("SQLSTATE %s must classify as port.ErrUnavailable, got %v", code, err)
			}
			if code == "57014" && errors.Is(err, context.DeadlineExceeded) {
				t.Fatal("57014 must no longer surface as context.DeadlineExceeded; it is ErrUnavailable now")
			}
		})
	}

	// Misconfiguration and programming faults stay unexpected errors (HTTP 500), never 503.
	for _, code := range []string{
		"28000", "28P01", // authentication failures
		"3D000", // invalid_catalog_name (no such database)
		"42501", // insufficient_privilege
		"42P01", // undefined_table
		"42P07", // duplicate_table
		"22001", // string_data_right_truncation
		"23503", // foreign_key_violation (unmapped constraint)
		"23502", // not_null_violation (unmapped constraint)
	} {
		t.Run(code, func(t *testing.T) {
			err := mapError(&pgconn.PgError{Code: code, Message: "fault " + code})
			if errors.Is(err, port.ErrUnavailable) {
				t.Fatalf("SQLSTATE %s must stay an unexpected error, got %v", code, err)
			}
		})
	}

	// A unique violation is a data error, never retryable unavailability.
	if err := mapError(&pgconn.PgError{Code: "23505", ConstraintName: "other_pkey"}); errors.Is(err, port.ErrUnavailable) {
		t.Fatal("23505 on an unmapped constraint must not classify as unavailable")
	}

	t.Run("existing mappings preserved", func(t *testing.T) {
		if err := mapError(pgx.ErrNoRows); !errors.Is(err, port.ErrNotFound) {
			t.Errorf("ErrNoRows must map to ErrNotFound, got %v", err)
		}
		if err := mapError(&pgconn.PgError{Code: "23505", ConstraintName: "other_pkey"}); err == nil || errors.Is(err, port.ErrNotFound) {
			t.Errorf("a unique violation must stay an unexpected error, got %v", err)
		}
	})

	t.Run("wrapped depth", func(t *testing.T) {
		err := mapError(fmt.Errorf("write user: %w", &pgconn.PgError{Code: "57P02"}))
		if !errors.Is(err, port.ErrUnavailable) {
			t.Fatalf("wrapped 57P02 must classify as unavailable, got %v", err)
		}
	})

	t.Run("bare typed connect fault", func(t *testing.T) {
		if err := mapError(&pgconn.ConnectError{}); !errors.Is(err, port.ErrUnavailable) {
			t.Fatalf("typed *pgconn.ConnectError without any PgError must classify as unavailable, got %v", err)
		}
	})

	// C01-R1 (architect F1): a cancelled connect must keep the driver cause reachable
	// through the ErrUnavailable wrap, so the inbound mapping can answer 499 (edge-case
	// table row "ConnectError wrapping context.Canceled → 499"). This asserts the invariant
	// on already-correct code; it must fail if a future change drops the cause.
	t.Run("cancelled connect keeps the cause for inbound 499", func(t *testing.T) {
		mapped := mapError(combinedChain{errs: []error{&pgconn.ConnectError{}, context.Canceled}})
		if !errors.Is(mapped, context.Canceled) {
			t.Fatalf("context.Canceled must survive the ErrUnavailable wrap, got %v", mapped)
		}
		if !errors.Is(mapped, port.ErrUnavailable) {
			t.Fatalf("a cancelled connect must still classify as unavailable, got %v", mapped)
		}
	})

	// SQLSTATE wins over a wrapping ConnectError: the PgError in the chain decides.
	for _, tc := range []struct {
		code        string
		unavailable bool
	}{
		{"28P01", false},
		{"3D000", false},
		{"42501", false},
		{"53300", true},
		{"57P03", true},
	} {
		t.Run("connecterror_pgerror_"+tc.code, func(t *testing.T) {
			err := mapError(combinedChain{errs: []error{&pgconn.ConnectError{}, &pgconn.PgError{Code: tc.code}}})
			if got := errors.Is(err, port.ErrUnavailable); got != tc.unavailable {
				t.Fatalf("ConnectError wrapping PgError %s: unavailable=%v, want %v (err %v)", tc.code, got, tc.unavailable, err)
			}
		})
	}

	// No string matching: lookalike text is never classification.
	for _, raw := range []string{
		"connection refused",
		"conn closed",
		"57P01 terminating connection due to administrator command",
		"too many connections",
		"statement timeout",
	} {
		t.Run("lookalike", func(t *testing.T) {
			if err := mapError(errors.New(raw)); errors.Is(err, port.ErrUnavailable) {
				t.Fatalf("text %q must not classify as unavailable", raw)
			}
		})
	}
}
