# Command log — MC-BE-ECHO-REVIEW-20261106 (rtk-prefixed on this workstation; timestamps UTC+7 2026-11-06 ~22:5x–23:3x)

| # | Command (abridged) | Exit | Output |
|---|---|---|---|
| 1 | `git rev-parse HEAD` / `git branch --show-current` / `git status --porcelain` | 0 | b86152d2…, develop, 4 untracked (none in apps/backend) |
| 2 | `go version` / `golangci-lint version` / `command -v sqlc; goose` | 0 | go1.27.3; golangci-lint 2.14.0; sqlc binary absent (Makefile-pinned v1.31.1); goose CLI absent (library v3.29.0) |
| 3 | `lsof -nP -iTCP:8080 -iTCP:8081 -iTCP:18082 -sTCP:LISTEN` | 0/empty | nothing listening |
| 4 | `docker ps` | 0 | only `mc-r2-check-pg` (this session's fixture) |
| 5 | `go list ./...` | 0 | 21 packages (evidence in report §1 Pass A) |
| 6 | `go list -f '{{.Imports}}' ./internal/core/domain/...` | 0 | stdlib only |
| 7 | `go list -f` adapter-import filter on `./internal/core/{service,port,policy}` | 0 | empty (no adapter imports in core) |
| 8 | `grep -rn "fmt\.Sprintf" --include=*.go internal/ cmd/` filtered by SQL keywords | 0 | 1 hit = error message (filing.go:386), not SQL |
| 9 | `grep -rnE '"(SELECT\|INSERT\|UPDATE\|DELETE\|WITH) .*\+"'` non-test | 0 | 0 hits |
| 10 | raw Exec/Query inventory (rtk grep) | 0 | 255 matches/22 files → hand-written production SQL = bff_retention.go + matter_migrate.go only |
| 11 | `grep -rn "revision" queries_mattercontrol/*.sql` | 0 | CAS present (context.sql:6-7, matter.sql:132-134) |
| 12 | migration hygiene greps (StatementBegin, statement_timestamp, Down sections) | 0 | see report §1 Pass B |
| 13 | `CREATE SCHEMA becho_explain` + `MC_DATABASE_URL=…5434/…search_path=becho_explain go run ./cmd/mcapi migrate` (synthetic OIDC/fs env) | 0 | migrations 0001–0017 applied (evidence/migration-apply.log) |
| 14 | `MC_TEST_DATABASE_URL=…5434/… make check` at b86152d2 | **0** | evidence/make-check-b86152d2-exit0.log |
| 15 | psql heredoc probe ×6 attempts (FK/uuid/check-constraint corrections) + final `EXPLAIN ANALYZE` ×2 | 0 | evidence/explain-plans.md; 8/8 FKs restored, tables empty |
| 16 | `gitleaks detect --source apps/backend --no-git` + `--report-format json` | 0 (8 FP) | evidence/gitleaks-backend-tree-8fp.json — all go.sum checksums inside git-ignored .mimosa/hook-state |
| 17 | `gitleaks detect --source apps/backend` (history) | 0 (1171 hits) | ALL under docs/ (prose-FP family); classification via node aggregation (docs/*: 1171, Go files: 0) |
| 18 | `command -v govulncheck` | not found | NOT_RUN per dispatch rule |
| 19 | test-quality greps: Test counts, wantErr tables, time.Sleep, F01-F03 | 0 | 296 tests; 0 sleeps |

Environment: macOS darwin 27.2.0 arm64; shell zsh; rtk wrapper per host rule; PG fixture started by
this session (`docker run -d --name mc-r2-check-pg … postgres:18-alpine -p 5434:5432`) and kept for
the reviewer; no shared process killed or restarted; no file outside this evidence directory written
by the review (report.md/evidence/commands are the only additions).
