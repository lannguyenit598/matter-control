<!-- source docs/architecture/adr/ADR-002-transaction-and-concurrency.md, lines 1-16 -->
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
