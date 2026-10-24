# ADR-002 — Transaction and Concurrency Model

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b` (CAS on version, `pgx.BeginFunc`, transactional outbox pattern, 20-goroutine contention test).
- Status: **PROPOSED (logical) / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**. Independent of hosting except where noted.

## 1. Decision proposal

1. **Matter-scoped single writer.** Every mutating command runs in one PostgreSQL transaction (READ COMMITTED) whose first statement locks the matter row `FOR UPDATE`. All graph, proof, state and history changes of that matter serialize at this point.
2. **Record revision CAS** on the rows the client read (`If-Match` / `expectedRevisions`), reusing the template's version compare-and-set, so stale commands fail with 412 instead of overwriting (RULE-018).
3. **Authorization inside the transaction** with `FOR SHARE` on workspace and matter membership rows; revocation is causally ordered with writes.
4. **Synchronous derived-state propagation** in the same transaction: dependency, verification aggregate, milestone readiness, critical chain; every command first materializes boundaries up to its captured instant `t_cmd`. Reads never write; they evaluate time-derived state purely at `asOf` (state-machine §6).
5. **History and idempotency receipt in the same transaction**; per-matter monotonic `seq` and nondecreasing `recorded_at`.
6. **Reads** use REPEATABLE READ READ ONLY snapshots carrying `sourceRevision`.
7. **No event bus.** The template outbox remains off; no Kafka.

### 1a. Global lock order

Locks are taken only in this order, skipping unneeded levels:
1. `workspaces` row — `FOR SHARE` for matter creation and matter-membership changes; `FOR UPDATE` for workspace-membership changes.
2. `matters` rows `FOR UPDATE`, ascending id when several (workspace revocation: every matter where the target is an ACTIVE member).
3. `workspace_memberships`.
4. `matter_memberships`, then `verifier_designations`.
5. Typed rows, history inserts, then receipts/outcome records.

Domain commands start at level 2. Levels 1–4 are acquired only by `MatterUnitOfWork`/`WorkspaceUnitOfWork`, never by service code. Implicit FK key-share locks always fall on parent rows at an earlier or equal level; P-BE-2 must verify this. The order **reduces** deadlock risk and is not a proof of deadlock freedom. PostgreSQL deadlock detection remains the backstop: `40P01` → `503 unavailable`, retryable with the same Idempotency-Key, no partial effect.

Port: `MatterUnitOfWork.Execute(ctx, matterID, fn)`; implementations: PostgreSQL (production) and memory (per-matter mutex; tests only). The shared contract suite (template `repotest` pattern) runs concurrency contracts against both.

## 2. Alternatives considered

| Alternative | Why not proposed |
|---|---|
| SERIALIZABLE isolation + retry | Correct for write skew but produces retry storms on wide recompute transactions; error handling more complex; row-lock approach gives the same guarantee with predictable waits |
| Row CAS only (no matter lock) | Does not prevent cycle write skew (two disjoint edges) or stale READY completion when the stale input is a different row |
| Event sourcing as source of truth | Not required by requirements (handoff: "do not infer mandatory event sourcing"); typed tables + append-only history meet audit needs with simpler queries |
| Asynchronous projection of derived state | Violates synchronous causal consistency (revocation/expiry/reopen must be visible immediately) |
| Advisory locks | Unsupported via Hyperdrive; row locks keep ADR-001 options open |
| Durable Object per matter | Only meaningful under H3/H4; would replace PostgreSQL transactions; not proposed |

## 3. Consequences

- Write throughput per matter is bounded by transaction duration. At the 50–200 row interaction scale and W1/W2 options this is expected to be adequate; it must be measured (AC-154), not assumed. Bulk and import commit per row/group, so long batches do not hold the lock.
- Locking follows §1a: domain commands lock one matter row; workspace revocation locks the workspace row then matters ascending. Deadlock freedom is not claimed absolutely; detected deadlocks map to retryable 503, and lock waits/deadlocks are operational metrics.
- Lock wait time becomes an operational metric (template otelpgx pool metrics).

## 4. Critical races and tests

| Race | Without control | Control | Test | AC |
|---|---|---|---|---|
| R1 Concurrent edges forming a cycle | Both commit | Matter lock; BFS after lock | DG-06 | AC-125 |
| R2 Complete downstream while upstream reopened | Stale READY completion | Guard re-read under lock | Two-session test with barrier | AC-139 |
| R3 Two edits of same field from revision r | Lost update | CAS 412 | Golden + concurrent | AC-139 |
| R4 Verify while criterion revised | Acceptance of superseded criterion | Criterion revision ID check under lock | EV-06 | AC-160 |
| R5 Membership revoked during bulk commit | Write after revocation | FOR SHARE membership per row txn | AC-133 fixture with revoke between rows | AC-133, AC-147 |
| R6 Promotion while assessment in flight on old version | Old-version acceptance satisfying CURRENT criterion | Satisfaction checks current pointer at evaluation; recompute on promotion | DL-03 + concurrent | AC-128 |
| R7 Expiry instant vs read | Read shows VERIFIED after expiry | Pure evaluation at `asOf`; stored values used only in their validity interval | State-machine boundary test, DM-13 | AC-126 |
| R8 Client disconnect after commit | Duplicate on retry | Idempotency receipt in same txn; operations endpoint | Kill connection after COMMIT, retry same key | AC-153 |
| R9 History write failure | Mutation without history | Single transaction | DM-04 | AC-153 |
| R10 Dispute raised while resolution in flight | Resolution of wrong state | Unique open dispute index; lock | EV-05 concurrent | AC-157 |
| R11 Import retry concurrent with first apply | Duplicate records | Unique `(matter, source_id, row_key)` | Parallel confirm | AC-132 |
| R12 Last two owners demote each other | Zero owners | Lock + deferred last-owner trigger | Concurrent demotion | AC-158 |
| R13 Grant vs workspace revocation vs command | Lock inversion; grant to revoked user | §1a order; grants hold workspace row FOR SHARE | Three-session barrier test | AC-147, AC-158 |
| R14 Workspace revocation of last effective OWNER | Matter without effective owner | Effective-owner guard + trigger on both membership tables | Concurrent revoke + demote | AC-158 |
| R15 Same key in flight twice | Duplicate effect; false "never committed" | Replay check after scope lock; receipt PK; 404 not final | Barrier before COMMIT | AC-153 |
| R16 Boundary during a command | Ambiguous state | Linearized at `t_cmd`; next write/worker materializes; reads evaluate purely | Clock injected between lock and commit | AC-126 |
| R17 Unbound preview commit | Other actor/expired/altered preview applied | Binding check before rows | API race test | AC-133 |

All race tests run against real PostgreSQL in a disposable schema (template `pgtest.FreshSchemaDSN`), with `-race`, repeated (e.g., 100 iterations) and with injected barriers rather than sleeps.
