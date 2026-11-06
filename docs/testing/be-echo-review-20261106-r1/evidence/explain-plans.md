# EXPLAIN ANALYZE evidence — hot access paths (2026-11-06, UTC+7 23:2x)

Fixture: docker `mc-r2-check-pg` (postgres:18-alpine, 0.0.0.0:5434), database `mattercontrol`,
schema `becho_explain` created by this review; product migrations 0001–0017 applied via
`go run ./cmd/mcapi migrate` (goose v3.29.0; apply log in migration-apply.log).
Method note: FK constraints were dropped INSIDE the probe transaction (DDL transactional) to seed
rows without building the full users/criteria chains; `ROLLBACK` restored all 8 constraints
(verified: constraint count 8/8 after rollback, tables 0 rows). Index choice for the probed
plans is unaffected by FKs.

## Query 1 — review history cell (grid+version+question, newest first)

```sql
EXPLAIN ANALYZE SELECT question_id, state, text, answered_at FROM review_answers
  WHERE grid_id=:grid AND version_id=:version AND question_id=:question
  ORDER BY answered_at DESC, id DESC;
```

Seed: 3000 review_answers rows in one grid/version.

```
Index Scan using review_answers_cell_history on review_answers
  (cost=0.28..8.30 rows=1 width=104) (actual time=0.006..0.006 rows=1.00 loops=1)
  Index Cond: ((grid_id = ...) AND (version_id = ...) AND (question_id = ...))
  Index Searches: 1
Planning Time: 0.223 ms
Execution Time: 0.014 ms
```

→ uses `review_answers_cell_history` (0010): **REMEDIATED**, runtime-backed.

## Query 2 — memberships of one user

```sql
EXPLAIN ANALYZE SELECT matter_id FROM matter_memberships
  WHERE user_id=:user AND status='ACTIVE';
```

Seed: 4000 matter_memberships rows across synthetic users.

```
->  Bitmap Index Scan on matter_memberships_user (cost=0.00..4.47 rows=25 width=0)
      (actual time=0.013..0.013 rows=2.00 loops=1)
      Index Cond: (user_id = ...)
      Index Searches: 1
Planning Time: 0.146 ms
Execution Time: 0.032 ms
```

→ uses `matter_memberships_user` (0010): **REMEDIATED**, runtime-backed.
