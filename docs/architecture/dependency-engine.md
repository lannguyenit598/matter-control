# Dependency Engine Design

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`.
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**.

## 1. Graph definition

- Nodes: Requirements and Actions of one Matter (`graph_nodes` supertype, kind REQUIREMENT|ACTION). Filings are gated through their linked Requirement/Action; Milestones are not nodes (they have prerequisites, not edges).
- Edge `u → d` means *d depends on u*. Attributes: `gate ∈ {COMPLETION, COMPLETION_AND_VERIFIED}` (explicit, no default), reason, author, revision, soft removal with reason.
- Structural constraints: same Matter (composite FK), no self-edge (CHECK), at most one active edge per ordered pair (partial unique index), acyclic (algorithmic under lock, §3).
- Not supported in P0 (require approved change): OR groups, cross-matter edges, automatic waivers, edges to milestones.

## 2. Readiness semantics (RULE-003)

```
satisfied(e: u→d) = dep(u) == READY && exec(u) == COMPLETED &&
                    (e.gate == COMPLETION || ver(u) == VERIFIED)
dep(d) = READY  iff  ∀ active e into d: satisfied(e)     // no incoming edges ⇒ READY
```

Proof gates use VERIFIED only, as RULE-003 states. **Open interpretation ARCH-Q1:** whether an upstream with verification NOT_REQUIRED satisfies a proof gate. Proposal: reject creating a COMPLETION_AND_VERIFIED edge from an upstream whose applicability is NOT_REQUIRED (validation error suggesting a COMPLETION gate), and if applicability later becomes NOT_REQUIRED the edge stays unsatisfied and is surfaced as a reason. PO/BA confirmation needed; no behavior is invented silently.

Each BLOCKED node carries `blockingReasons[]`: `{edgeId, upstreamId, gate, failed: [UPSTREAM_BLOCKED | NOT_COMPLETED | NOT_VERIFIED]}`, ordered by upstream ID. The Control Room "why blocked" view walks reasons upstream to the root causes (nodes that are themselves READY but not completed/verified).

## 3. Mutation algorithm (inside MatterUnitOfWork)

```
AddEdge(cmd{matter, u, d, gate, reason, expectedRevisions{u, d}}):
  lock matter row (FOR UPDATE)                       // serializes all graph mutations of the matter
  authorize EDITOR|OWNER (FOR SHARE on memberships)
  apply time boundaries ≤ now
  load u, d; check same matter, kinds, revisions == expected
  if u == d → reject self-edge
  if active edge (u,d) exists → reject duplicate
  path := bfsPath(from=d, to=u, over active edges)    // adding u→d creates a cycle iff d ⇝ u
  if path != nil → reject cycle-detected{path: [d, …, u]}
  insert edge; emit edge.added
  Recompute(roots={d})

Recompute(roots):
  S := downstream closure of roots (including roots)
  order := topological order of S restricted to induced subgraph (Kahn)
  for n in order:
     newDep := READY iff all incoming edges satisfied (reads already-updated upstream values)
     if newDep != n.dep or reasons changed: update row (revision+1), emit node.dependency_derived{cause}
  recompute milestone readiness for milestones whose prerequisites ⊆ S∪roots
  recompute critical-chain membership if edges or milestone prerequisites changed
```

The same `Recompute` is invoked after: execution change of any node, verification aggregate change, reopen, cancellation, edge removal, criteria revision, boundary expiry. Because the graph is a DAG and each node is processed once in topological order, recomputation terminates in O(|S| + |E(S)|). For the 50–200 row interaction scale and W1/W2 options, a matter graph fits in memory; the engine loads the matter's edges and node states once per command.

Cycle-error payload includes the path node IDs and titles. Disclosure is acceptable because every node in the path is in the same Matter and the caller has Matter access (all members read all matter records under the approved Matter-level boundary).

## 4. Concurrency (AC-125, AC-139)

The classic failure is write skew: T1 adds C→A while T2 adds A→C; each validates against a snapshot without the other edge and both commit, forming a cycle. Prevention layers:

1. **Matter row lock**: every graph-affecting command first executes `SELECT … FROM matters WHERE id = $1 FOR UPDATE`. T2 blocks until T1 commits, then (READ COMMITTED, new statement snapshot) sees T1's edge and its BFS finds the cycle. Exactly one succeeds.
2. **Revision CAS** on involved nodes: a command based on a stale read of u or d returns `412 stale-revision`.
3. **Database guards**: CHECK (u ≠ d), partial unique index on active (u, d), composite same-matter FKs. Optional defense-in-depth: a `DEFERRABLE INITIALLY DEFERRED` constraint trigger running a recursive-CTE cycle check on insert; it also locks the matter row so it cannot be bypassed by a code path that forgot the lock. Proposed as optional because the single write path already enforces it; OpenCode may require it.
4. **Completion against stale READY**: completion guard re-reads `dependency_state` under the lock; if an upstream was reopened between the client's read and commit, the completion is rejected with current reasons (AC-139).

No PostgreSQL advisory locks are used in the request path (Hyperdrive does not support them; keeping row locks preserves options in ADR-001).

## 5. Milestones and critical chain

- Readiness (RULE-008): no prerequisites → UNASSESSED; else READY iff every prerequisite Requirement has `exec = COMPLETED ∧ ver ∈ {VERIFIED, NOT_REQUIRED} ∧ dep = READY`. Output `satisfied/total` and per-prerequisite failure reasons (AC-102, AC-141). Cancelled prerequisites are unsatisfied; there is no waiver label.
- Critical chain set `C` = prerequisites of milestones with `critical = true` ∪ all graph ancestors of those prerequisites. A node in `C` is **critical-unsatisfied** if (a) it is a critical prerequisite and fails milestone satisfaction, or (b) it is an ancestor and at least one of its outgoing edges on a path into `C` is unsatisfied. Such nodes get CRITICAL attention with reasons naming the milestone(s) (RULE-010).
- Prerequisite add/remove and critical designation are OWNER-only, reasoned, audited, and trigger recomputation.

## 6. Removal and scope change (RULE-004, AC-146)

- Removing an edge requires EDITOR/OWNER (OWNER for milestone prerequisites), a reason, and emits `edge.removed` (scope change). It may make downstream READY; this is an explicit audited decision, never automatic.
- Cancelling an upstream does not satisfy edges; downstream stays BLOCKED with reason `NOT_COMPLETED (CANCELLED)`.
- Deleting a node with active edges is not offered; nodes are never hard-deleted.

## 7. Next Action (RULE-021)

Candidates: visible Actions assigned to the caller (or a selected member for owners), `exec ∈ {NOT_STARTED, IN_PROGRESS}`, `dep = READY`. Order: critical-unsatisfied first; then `due_at` ascending with no-due last; then ID ascending (UUIDv7 bytes, stable). Excluded items are returned with reasons (`WAITING`, `BLOCKED`, `UNASSIGNED`). Response carries `sourceRevision`; a completion submitted with an older node revision fails (AC-103, AC-144).

## 8. Tests

| ID | Scenario | AC |
|---|---|---|
| DG-01 | Two incoming edges, completion + proof; only completion satisfied → BLOCKED with proof reason | AC-105 |
| DG-02 | Complete R2 while R1 unverified → reject, no event | AC-122 |
| DG-03 | Verify R1 → R2 READY in same transaction; R2 execution unchanged | AC-123 |
| DG-04 | Reopen R1 → A2, A3 BLOCKED; A2 completion history retained | AC-124 |
| DG-05 | C→A on A→B→C, self-edge → reject with path; graph unchanged | AC-125 |
| DG-06 | Concurrency: N goroutines add random edges on one matter against real PostgreSQL; assert acyclic and every committed edge has exactly one event (mirrors template's 20-goroutine CAS test) | AC-125, AC-139 |
| DG-07 | Cancel upstream → downstream BLOCKED; relabel attempt rejected | AC-146 |
| DG-08 | Property test: random DAG + random state changes; stored `dependency_state` equals full recomputation after every command | NFR-005 |
| DG-09 | Next Action ordering fixture K1..N3 and exclusions | AC-103, AC-144 |
| DG-10 | Milestone unassessed, cancelled/disputed prerequisite | AC-102, AC-141 |
