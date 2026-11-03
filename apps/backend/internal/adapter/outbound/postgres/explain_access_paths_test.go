package postgres

// F-02 verification harness (SQL review 2026-10-30): proves the access-path claim for the
// user/workspace list queries on a real database and measures the effect of the proposed 0009
// indexes. Inert unless MC_EXPLAIN_VERIFY=1 with MC_TEST_DATABASE_URL set, mirroring perf_test.go.
// The proposed indexes are created INSIDE the disposable per-test schema only — this test never
// changes the shipped migrations; the 0009 migration itself is a separate schema-change decision.
// Results are reported via t.Logf (captured in the evidence log); no files are written.

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"

	"leonx.me/matter-control/internal/adapter/outbound/postgres/pgtest"
)

// The five reviewed queries, exactly as in queries_mattercontrol/matter.sql (parameterized).
const (
	qListMattersOfActor = `SELECT m.id FROM matters m
JOIN matter_memberships mm ON mm.matter_id = m.id AND mm.user_id = $1 AND mm.status = 'ACTIVE'
JOIN workspace_memberships wm ON wm.workspace_id = m.workspace_id AND wm.user_id = $1 AND wm.status = 'ACTIVE'
ORDER BY m.id`
	qListAccessibleMatters = `SELECT m.id AS matter_id, m.title, m.revision, m.event_seq, m.last_recorded_at, mm.role AS caller_role
FROM matters m
JOIN matter_memberships mm ON mm.matter_id = m.id AND mm.user_id = $2
WHERE m.workspace_id = $1 AND mm.status = 'ACTIVE' AND m.id > $3
ORDER BY m.id LIMIT $4`
	qCountAccessibleMatters = `SELECT count(*)::bigint AS n
FROM matters m
JOIN matter_memberships mm ON mm.matter_id = m.id AND mm.user_id = $2
WHERE m.workspace_id = $1 AND mm.status = 'ACTIVE'`
	qListMyWorkspaces = `SELECT w.id AS workspace_id, w.name, w.revision, wm.role AS caller_role
FROM workspace_memberships wm JOIN workspaces w ON w.id = wm.workspace_id
WHERE wm.user_id = $1 AND wm.status = 'ACTIVE' AND w.id > $2
ORDER BY w.id LIMIT $3`
	qCountMyWorkspaces = `SELECT count(*)::bigint AS n FROM workspace_memberships WHERE user_id = $1 AND status = 'ACTIVE'`
	// B2 candidate: the review history first page — equality on the cell, ordered by the
	// recorded-chronology keyset (answered_at DESC, id DESC). The existing review_answers_cell
	// index covers the equality but not the ordering.
	qReviewHistoryCell = `SELECT id, grid_id, version_id, question_id, question_revision, state, text, page_ref, quote_ref, author, answered_at, supersedes_id
FROM review_answers
WHERE matter_id = $1 AND grid_id = $2 AND version_id = $3 AND question_id = $4
ORDER BY answered_at DESC, id DESC
LIMIT $5`
)

// Proposed 0009 indexes, created in the disposable test schema only. The review-history index
// extends the existing review_answers_cell equality prefix with the ordering keyset.
var proposedIndexes = []string{
	`CREATE INDEX idx_explain_matter_memberships_user ON matter_memberships (user_id, matter_id)`,
	`CREATE INDEX idx_explain_workspace_memberships_user ON workspace_memberships (user_id, workspace_id)`,
	`CREATE INDEX idx_explain_matters_workspace ON matters (workspace_id, id)`,
	`CREATE INDEX idx_explain_review_answers_history ON review_answers (grid_id, version_id, question_id, answered_at DESC, id DESC)`,
}

type explainRun struct {
	Query       string          `json:"query"`
	Phases      []explainResult `json:"phases"`
	PlanSummary []string        `json:"plan_summary"`
}

type explainResult struct {
	Phase           string   `json:"phase"`
	ExecutionTimeMs float64  `json:"execution_time_ms"`
	TopPlanNodes    []string `json:"top_plan_nodes"`
}

func TestAccessPathExplainVerification(t *testing.T) {
	if os.Getenv("MC_EXPLAIN_VERIFY") != "1" {
		t.Skip("MC_EXPLAIN_VERIFY not set; the F-02 access-path verification is inert")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 180*time.Second)
	defer cancel()
	dsn := pgtest.FreshSchemaDSNFrom(t, "MC_TEST_DATABASE_URL")
	if err := MigrateMatterControl(ctx, dsn, discardLogger()); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		t.Fatalf("pool: %v", err)
	}
	defer pool.Close()

	// Seed: one actor with 400 active matter memberships in one workspace, 30 other workspaces
	// it belongs to, and 150 matters of the same workspace it is NOT a member of. MC_EXPLAIN_SCALE
	// multiplies the row counts so the crossover point (where index scans overtake seq scans) can
	// be demonstrated on the same harness.
	scale := 1
	if v := os.Getenv("MC_EXPLAIN_SCALE"); v != "" {
		if _, err := fmt.Sscanf(v, "%d", &scale); err != nil || scale < 1 {
			scale = 1
		}
	}
	actor := uuid.Must(uuid.NewV7()).String()
	seed := func(sql string, args ...any) {
		t.Helper()
		if _, err := pool.Exec(ctx, sql, args...); err != nil {
			t.Fatalf("seed %q: %v", sql[:40], err)
		}
	}
	seed(`INSERT INTO users (id, idp_issuer, idp_subject, display_name) VALUES ($1, 'https://idp.test', 'seed-actor', 'Seed Actor')`, actor)
	ws := uuid.Must(uuid.NewV7()).String()
	seed(`INSERT INTO workspaces (id, name) VALUES ($1, 'Explain WS')`, ws)
	seed(`INSERT INTO workspace_memberships (workspace_id, user_id, role, status) VALUES ($1, $2, 'OWNER', 'ACTIVE')`, ws, actor)
	for i := 0; i < 400*scale; i++ {
		m := uuid.Must(uuid.NewV7()).String()
		seed(`INSERT INTO matters (id, workspace_id, title) VALUES ($1, $2, $3)`, m, ws, fmt.Sprintf("Matter %d", i))
		seed(`INSERT INTO matter_memberships (matter_id, user_id, role, status) VALUES ($1, $2, 'EDITOR', 'ACTIVE')`, m, actor)
	}
	for i := 0; i < 150*scale; i++ {
		seed(`INSERT INTO matters (id, workspace_id, title) VALUES ($1, $2, $3)`, uuid.Must(uuid.NewV7()).String(), ws, "Other matter")
	}
	for i := 0; i < 30*scale; i++ {
		w := uuid.Must(uuid.NewV7()).String()
		u := uuid.Must(uuid.NewV7()).String()
		seed(`INSERT INTO users (id, idp_issuer, idp_subject, display_name) VALUES ($1, 'https://idp.test', $2, $3)`, u, fmt.Sprintf("seed-%d", i), fmt.Sprintf("Person %d", i))
		seed(`INSERT INTO workspaces (id, name) VALUES ($1, $2)`, w, fmt.Sprintf("WS %d", i))
		seed(`INSERT INTO workspace_memberships (workspace_id, user_id, role, status) VALUES ($1, $2, 'MEMBER', 'ACTIVE')`, w, actor)
		seed(`INSERT INTO workspace_memberships (workspace_id, user_id, role, status) VALUES ($1, $2, 'OWNER', 'ACTIVE')`, w, u)
	}

	// B2: seed one review cell with 2000*scale answers so the history keyset ordering claim is
	// measured against real rows (equality prefix + answered_at DESC, id DESC ordering).
	grid := uuid.Must(uuid.NewV7()).String()
	mid := uuid.Must(uuid.NewV7()).String()
	ver := uuid.Must(uuid.NewV7()).String()
	seed(`INSERT INTO matters (id, workspace_id, title) VALUES ($1, $2, 'Explain review matter')`, mid, ws)
	doc := uuid.Must(uuid.NewV7()).String()
	seed(`INSERT INTO documents (id, matter_id, name, revision) VALUES ($1, $2, 'Explain doc', 1)`, doc, mid)
	seed(`INSERT INTO document_versions (id, matter_id, document_id, version_no, filename, media_type, sha256, size_bytes, uploaded_by, uploaded_at) VALUES ($1, $2, $3, 1, 'explain.pdf', 'application/pdf', $4, 10, $5, statement_timestamp())`,
		ver, mid, doc, "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", actor)
	seed(`INSERT INTO review_grids (id, matter_id, name, created_by, created_at, revision) VALUES ($1, $2, 'Explain grid', $3, statement_timestamp(), 1)`, grid, mid, actor)
	seed(`INSERT INTO review_grid_versions (grid_id, matter_id, version_id, position) VALUES ($1, $2, $3, 0)`, grid, mid, ver)
	q := uuid.Must(uuid.NewV7()).String()
	seed(`INSERT INTO review_questions (id, matter_id, grid_id, position, revision, text, revised_by, revised_at) VALUES ($1, $2, $3, 0, 1, 'Explain question?', $4, statement_timestamp())`, q, mid, grid, actor)
	seed(`INSERT INTO review_question_revisions (question_id, revision, text, revised_by, revised_at) VALUES ($1, 1, 'Explain question?', $2, statement_timestamp())`, q, actor)
	base := time.Now().UTC()
	for i := 0; i < 2000*scale; i++ {
		seed(`INSERT INTO review_answers (id, matter_id, grid_id, version_id, question_id, question_revision, state, text, author, answered_at) VALUES ($1, $2, $3, $4, $5, 1, 'REVIEWED', $6, $7, $8)`,
			uuid.Must(uuid.NewV7()).String(), mid, grid, ver, q, fmt.Sprintf("answer %d", i), actor, base.Add(time.Duration(i)*time.Millisecond))
	}

	runs := []explainRun{
		{Query: "ListMattersOfActor"},
		{Query: "ListAccessibleMatters"},
		{Query: "CountAccessibleMatters"},
		{Query: "ListMyWorkspaces"},
		{Query: "CountMyWorkspaces"},
		{Query: "ReviewHistoryCell"},
	}
	explain := func(phase string) {
		t.Helper()
		for i := range runs {
			var sql string
			var args []any
			cursor := uuid.Must(uuid.NewV7()).String()
			switch runs[i].Query {
			case "ListMattersOfActor":
				sql, args = qListMattersOfActor, []any{actor}
			case "ListAccessibleMatters":
				sql, args = qListAccessibleMatters, []any{ws, actor, cursor, 200}
			case "CountAccessibleMatters":
				sql, args = qCountAccessibleMatters, []any{ws, actor}
			case "ListMyWorkspaces":
				sql, args = qListMyWorkspaces, []any{actor, cursor, 200}
			case "CountMyWorkspaces":
				sql, args = qCountMyWorkspaces, []any{actor}
			case "ReviewHistoryCell":
				sql, args = qReviewHistoryCell, []any{mid, grid, ver, q, 100}
			}
			res, err := explainOnce(ctx, pool, sql, args)
			if err != nil {
				t.Fatalf("explain %s (%s): %v", runs[i].Query, phase, err)
			}
			res.Phase = phase
			runs[i].Phases = append(runs[i].Phases, res)
			runs[i].PlanSummary = res.TopPlanNodes
		}
	}
	explain("before")
	for _, idx := range proposedIndexes {
		if _, err := pool.Exec(ctx, idx); err != nil {
			t.Fatalf("proposed index: %v", err)
		}
	}
	explain("after-proposed-indexes")
	// Repeat the after phase once more so the comparison excludes one-off caching.
	explain("after-proposed-indexes-repeat")

	for _, r := range runs {
		for _, p := range r.Phases {
			t.Logf("%-24s %-30s %9.3f ms  nodes=%v", r.Query, p.Phase, p.ExecutionTimeMs, p.TopPlanNodes)
		}
	}
}

func explainOnce(ctx context.Context, pool *pgxpool.Pool, sql string, args []any) (explainResult, error) {
	rows, err := pool.Query(ctx, "EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) "+sql, args...)
	if err != nil {
		return explainResult{}, err
	}
	defer rows.Close()
	var plans []map[string]any
	for rows.Next() {
		var raw []byte
		if err := rows.Scan(&raw); err != nil {
			return explainResult{}, err
		}
		var parsed []map[string]any
		if err := json.Unmarshal(raw, &parsed); err != nil {
			return explainResult{}, err
		}
		plans = append(plans, parsed...)
	}
	if err := rows.Err(); err != nil {
		return explainResult{}, fmt.Errorf("explain rows: %w", err)
	}
	if len(plans) == 0 {
		return explainResult{}, fmt.Errorf("explain returned no plans")
	}
	plan, ok := plans[0]["Plan"].(map[string]any)
	if !ok {
		return explainResult{}, fmt.Errorf("explain plan shape unexpected")
	}
	total, ok := plan["Actual Total Time"].(float64)
	if !ok {
		return explainResult{}, fmt.Errorf("explain timing missing")
	}
	return explainResult{ExecutionTimeMs: total, TopPlanNodes: collectNodes(plan, 0)}, nil
}

// collectNodes flattens the top plan shapes (skipping leaf detail) so the report shows whether
// a Seq Scan turned into an Index Scan after the proposed indexes.
func collectNodes(node map[string]any, depth int) []string {
	out := []string{fmt.Sprintf("%v", node["Node Type"])}
	if depth >= 4 {
		return out
	}
	if children, ok := node["Plans"].([]any); ok {
		for _, c := range children {
			if cm, ok := c.(map[string]any); ok {
				out = append(out, collectNodes(cm, depth+1)...)
			}
		}
	}
	return out
}
