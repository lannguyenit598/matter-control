# Proposal — migration 0009 `access_path_indexes` (SCHEMA-CHANGE DECISION REQUIRED — NOT APPLIED)

Prepared by actual ZCode, 2026-10-30, per the SQL-review remediation plan. This file is a **proposal**: the SQL below is NOT in `migrations_mattercontrol/` and nothing has been applied. Adding a migration is the migration owner's (Codex) + PO's decision; per `apps/backend/.claude/rules/persistence.md` a new file may be added but never edits 0001–0008. Decision needed before the next migration slot is assigned (re-inventory applied migrations first — `docs/testing/codex-claude-return-intake-20261029-r1/return.md:59`).

## Measured evidence (this namespace)

`explain-verification.log` + `explain-scale{1,12}-events.json` — `EXPLAIN (ANALYZE, BUFFERS)` on a labelled disposable fixture (postgres 18.6, 1 CPU/512MiB), seed scaled ×12 (4,800 matters, 4,830 matter_memberships, 31 workspaces/61 workspace_memberships), before vs after creating the proposed indexes inside the per-test schema:

| Query | before (×12) | after (repeat) | Verdict |
|---|---|---|---|
| `ListMattersOfActor` (unbounded) | 25.44 ms | **6.34 ms** | ✅ **4× faster** — `matter_memberships(user_id, …)` serves the join |
| `ListAccessibleMatters` (LIMIT 200) | 0.94 ms | 0.98 ms | parity at this scale |
| `CountAccessibleMatters` | 3.12 ms | 3.59 ms | parity (bitmap count ≈ seq at 5k rows) |
| `ListMyWorkspaces` (LIMIT 200) | 0.13 ms | 0.09 ms | parity |
| `CountMyWorkspaces` | 0.046 ms | 0.044 ms | parity |

At P0-local scale (×1: hundreds of rows) the indexes show **no win and one small regression** (`CountAccessibleMatters` 0.40→8.9 ms — the planner's bitmap choice loses to a seq scan on tiny tables). This confirms the review's own assessment that F-02 is not a current-gate problem; the indexes pay off as membership/matter counts grow (the unbounded actor list is the sensitive path).

## Proposed Up (new file `0009_access_path_indexes.sql`, additive only)

```sql
-- +goose Up
-- F-02 (SQL review 2026-10-30): secondary indexes for the user/workspace access paths.
-- The membership PKs lead with matter_id/workspace_id, so actor-centric lists
-- (ListMattersOfActor, ListMyWorkspaces, CountMyWorkspaces, ListAccessibleMatters,
-- CountAccessibleMatters) scan. Measured 4x on the unbounded actor matter list at
-- 4.8k memberships (see docs/testing/zcode-sql-review-fixes-20261030-r1/).
CREATE INDEX matter_memberships_user ON matter_memberships (user_id, matter_id);
CREATE INDEX workspace_memberships_user ON workspace_memberships (user_id, workspace_id);
CREATE INDEX matters_workspace ON matters (workspace_id, id);

-- +goose Down
DROP INDEX IF EXISTS matters_workspace;
DROP INDEX IF EXISTS workspace_memberships_user;
DROP INDEX IF EXISTS matter_memberships_user;
```

Measured per-index verdicts: `matter_memberships_user` — proven 4×; `matters_workspace` — parity now, cheap (matters inserts are rare), enables the workspace-scoped list as it grows; `workspace_memberships_user` — marginal (workspaces per person are few). A defensible narrower decision is to ship only the first index and keep the other two recorded. No query text changes; `sqlc` regeneration is NOT required for indexes.

## Optional (default OFF) — F-09 pg_trgm for SearchLocalWorkspacePeople

Only if the user base grows materially (the review judged `strpos(lower(),lower())` acceptable at P0 with manually provisioned users). Requires, in the same or a later migration:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX users_display_name_trgm ON users USING gin (lower(display_name) gin_trgm_ops);
```

…plus a query change (`strpos(lower(u.display_name), lower($3)) > 0` → `u.display_name ILIKE '%' || $3 || '%'` with `%`/`_` escaped in the Go layer before binding) and `make sqlc-generate`. Notes: (a) `CREATE EXTENSION` needs privileges the disposable fixtures have but production roles may not — a deployment decision; (b) the privilege check (actor must be ACTIVE workspace OWNER) stays in SQL either way; (c) `ILIKE` treats `%`/`_` as wildcards, so the escape is mandatory for identical semantics.

## Related decision note — F-06 (dead audit columns)

`security_audit_events.client_ip` / `request_id` are never written (the only insert query writes 7 of 9 columns; `matter.SecurityAuditEntry` has no fields for them; no HTTP layer captures a client address). Three options: (1) keep + document until the audit-scope decision (recommended — zero code churn, the restricted-audit contract may want them); (2) populate them (requires HTTP-layer capture + port/domain struct fields + ~12 construction sites — a behavior change beyond this SQL task); (3) drop the columns (a migration). Owner of the decision: PO with the audit-scope workstream (Codex/DevOps).

## Explicitly out of this proposal

F-10 residuals (unbounded `ListReviewVersionRefs` array + replay windows) — accepted governance residual; A-01 receipt-scope binding — owned by the backend implementation owner (Codex), probe + fix spec already handed over in the audit packet.
