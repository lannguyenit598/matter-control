-- +goose Up
-- B2 (ADR-006 zero-trust addendum) + SQL-review F-02: secondary indexes for the measured access
-- paths. Additive only; no query text changes, so sqlc regeneration is not required. Measured on
-- the disposable fixture (EXPLAIN ANALYZE, docs/testing/zcode-adr006-cloud-readiness-20261030-r1/
-- b2-index-plan-events.json and docs/testing/zcode-sql-review-fixes-20261030-r1/):
-- ReviewHistoryCell 1.194 ms -> 0.022 ms (~54x) with the review_answers ordering index;
-- ListMattersOfActor 25.4 -> 6.3 ms (4x) at 4.8k memberships with matter_memberships(user_id, …);
-- parity at tiny scales (the recorded counter-evidence stays in the packets).
CREATE INDEX IF NOT EXISTS review_answers_cell_history ON review_answers (grid_id, version_id, question_id, answered_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS matter_memberships_user ON matter_memberships (user_id, matter_id);
CREATE INDEX IF NOT EXISTS workspace_memberships_user ON workspace_memberships (user_id, workspace_id);
CREATE INDEX IF NOT EXISTS matters_workspace ON matters (workspace_id, id);

-- +goose Down
DROP INDEX IF EXISTS review_answers_cell_history;
DROP INDEX IF EXISTS matter_memberships_user;
DROP INDEX IF EXISTS workspace_memberships_user;
DROP INDEX IF EXISTS matters_workspace;
