package postgres

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"testing"
)

// Nothing writes matters.next_boundary_at today, so a "boundary due" refusal (503, retryable) can
// never fire. If a writer appears, retryable clients would loop on a matter nobody can advance
// until a boundary processor exists and the wire contract is decided. This guard fails first.

var sqlComment = regexp.MustCompile(`(?m)--.*$`)

// writesNextBoundary reports the statements in sqlText that INSERT or UPDATE next_boundary_at.
func writesNextBoundary(sqlText string) []string {
	var hits []string
	for _, stmt := range strings.Split(sqlComment.ReplaceAllString(sqlText, ""), ";") {
		s := strings.ToLower(strings.TrimSpace(stmt))
		if (strings.HasPrefix(s, "insert") || strings.HasPrefix(s, "update") || strings.HasPrefix(s, "with")) &&
			strings.Contains(s, "next_boundary_at") {
			hits = append(hits, strings.TrimSpace(stmt))
		}
	}
	return hits
}

func TestWritesNextBoundary_Detector(t *testing.T) {
	for name, tc := range map[string]struct {
		sql  string
		want int
	}{
		"update":          {"UPDATE matters SET next_boundary_at = now() WHERE id = $1;", 1},
		"insert":          {"INSERT INTO matters (id, next_boundary_at) VALUES ($1, $2);", 1},
		"cte write":       {"WITH x AS (SELECT 1) UPDATE matters SET next_boundary_at = NULL;", 1},
		"read only":       {"SELECT next_boundary_at FROM matters;", 0},
		"comment only":    {"-- name: X :exec\n-- next_boundary_at stays\nUPDATE matters SET revision = 1;", 0},
		"other statement": {"UPDATE matters SET revision = 1; SELECT next_boundary_at FROM matters;", 0},
	} {
		if got := len(writesNextBoundary(tc.sql)); got != tc.want {
			t.Errorf("%s: %d hits, want %d", name, got, tc.want)
		}
	}
}

func TestNothingWritesNextBoundary(t *testing.T) {
	files, err := filepath.Glob("queries_mattercontrol/*.sql")
	if err != nil || len(files) == 0 {
		t.Fatalf("query files: %v %v", files, err)
	}
	// Raw SQL inside Go sources of this package (the generated mcsqlc package is covered by the
	// query files it is generated from).
	goFiles, _ := filepath.Glob("*.go")
	for _, f := range goFiles {
		if !strings.HasSuffix(f, "_test.go") {
			files = append(files, f)
		}
	}
	for _, f := range files {
		b, err := os.ReadFile(filepath.Clean(f))
		if err != nil {
			t.Fatal(err)
		}
		for _, h := range writesNextBoundary(string(b)) {
			t.Errorf("%s writes next_boundary_at: %.80s", f, h)
		}
	}
}
