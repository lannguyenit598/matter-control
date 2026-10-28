package pgtest

import (
	"testing"
)

// The explicit-DSN helper rewrites search_path exactly like the native helper, for any
// base URL shape the test DSNs use, without mutating the base string. Fixtures carry
// no userinfo: credentials never appear in source.
func TestSchemaDSN(t *testing.T) {
	cases := []struct {
		name   string
		base   string
		schema string
		want   string
	}{
		{
			name:   "plain dsn",
			base:   "postgres://127.0.0.1:5432/db?sslmode=disable",
			schema: "t_1",
			want:   "postgres://127.0.0.1:5432/db?search_path=t_1&sslmode=disable",
		},
		{
			name:   "existing search_path replaced",
			base:   "postgres://127.0.0.1:5432/db?sslmode=disable&search_path=public",
			schema: "t_2",
			want:   "postgres://127.0.0.1:5432/db?search_path=t_2&sslmode=disable",
		},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := schemaDSN(t, tc.base, tc.schema)
			if got != tc.want {
				t.Fatalf("got %q, want %q", got, tc.want)
			}
		})
	}
}

// FreshSchemaDSNFrom skips (rather than fails) when the named variable is unset, keeping
// no-database runs green for both native and product suites.
func TestFreshSchemaDSNFrom_SkipsWithoutEnv(t *testing.T) {
	t.Run("skip", func(t *testing.T) {
		FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL_DEFINITELY_UNSET")
	})
}
