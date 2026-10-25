# INT-A — Current Owner Coordination

Codex,2026-10-25 Asia/Ho_Chi_Minh. Scope DEC-028/INTA-1 unchanged.

| Workstream | Current received evidence | Next dependency/action |
|---|---|---|
| ZCode MC-002-INTA-BE | Actual manual return, clean52b60a4 task worktree and matching clean-source binary; Codex read-only intake complete, preparation IN_REVIEW | WAITING_ENV. Preserve current binary/worktree; do not rerun native/full baselines. Resume migrate/start only after Codex verified new DB/private DSN |
| Antigravity MC-002-INTA-FE | No owner return yet. Frontend/harness directories and install log appeared during intake; execution/completion not inferred | Return acknowledgement/feasibility plus driver-generated runId and request-ID plan before coordinated ENV/runtime. Do not touch others' backend or DB resources |
| Codex MC-002-INTA-ENV | Not provisioned; no private DSN handoff yet | After frontend coordination, verify unused fixed ports/names; create only new owned capped PG and durable task storage; verify actual empty/healthy DB/user before private DSN handoff. Do not invent the driver's runId |
| OpenCode MC-002-INTA-QA | No INT-A runtime invocation/verdict | Wait for actual owner execution/ENV/evidence, independently verify36cases. Document-only prior review never substitutes |

## Phase schedule

No wall-clock start time is assigned without owner readiness. The order is frozen: verified ENV → ZCode migrate/start → Antigravity initial create/read/wire/negative checks → immutable checkpoint → ZCode Go restart → Codex same-PG stop/start → update/stale checks → Codex PG outage while Go remains running → PG recovery without Go restart and read-only reconciliation → ZCode Go stop/T12 → logs/isolation/privacy and owned teardown → independent conformance/evidence review.

Only metadata/ready signals are exchanged in governance. Private DSN is loaded by the owner without logging/tracing/env dump and never returned in reports or packets. An unknown POST is never re-POSTed/retried/probed by list/SQL; product receipts remain deferred.

Frontend owner may be active: do not recreate/reset or run its current worktree/harness before its return. No fresh manual ZCode dispatch is needed just to repeat completed preparation. The pending action is ENV/input coordination within already-approved scope, not a new PO scope gate.

All51case results remain NOT_RUN. Current owner sub-evidence does not satisfy the complete runtime rows. MC-002/C01-PRODUCT and product/cloud/cost/recovery gates remain OPEN.
