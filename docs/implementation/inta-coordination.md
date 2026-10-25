# INT-A — Current Owner Coordination

Codex,2026-10-25 Asia/Ho_Chi_Minh. Scope DEC-028/INTA-1 unchanged.

| Workstream | Current received evidence | Next dependency/action |
|---|---|---|
| ZCode MC-002-INTA-BE | Actual manual return, clean52b60a4 task worktree and matching clean-source binary; Codex read-only intake complete, preparation IN_REVIEW | WAITING_ENV. Preserve current binary/worktree; do not rerun native/full baselines. Resume migrate/start only after Codex verified new DB/private DSN |
| Antigravity MC-002-INTA-FE | Actual manual R4 received at clean48cc03e; integrity/focused recheck complete; independent R4 verdict PENDING quota | IN_REVIEW; no new owner rework assigned. Wait actual OpenCode R4 review on a usable human-selected route. Preserve source/owner state |
| Codex MC-002-INTA-ENV | Not provisioned; no private DSN handoff yet | Held for independent R4 review (provider429quota); read-only Docker/image/port preflight completed; then recheck; then verify unused fixed ports/names; create only new owned capped PG and durable task storage; verify actual empty/healthy DB/user before private DSN handoff. Do not invent the driver's runId |
| OpenCode MC-002-INTA-QA | R4 actual invocation failed provider.free-limit429, no review text/verdict; previous reviews historical; runtime QA PENDING | Wait for actual owner execution/ENV/evidence, independently verify36cases. Document-only prior review never substitutes |

## Phase schedule

No wall-clock start time is assigned without owner readiness. The order is frozen: verified ENV → ZCode migrate/start → Antigravity initial create/read/wire/negative checks → immutable checkpoint → ZCode Go restart → Codex same-PG stop/start → update/stale checks → Codex PG outage while Go remains running → PG recovery without Go restart and read-only reconciliation → ZCode Go stop/T12 → logs/isolation/privacy and owned teardown → independent conformance/evidence review.

Only metadata/ready signals are exchanged in governance. Private DSN is loaded by the owner without logging/tracing/env dump and never returned in reports or packets. An unknown POST is never re-POSTed/retried/probed by list/SQL; product receipts remain deferred.

Frontend return is received: preserve its clean e25bbc6 companion/source archive and provide the R1 prompt; do not recreate/reset or run owner sources as Codex. No fresh manual ZCode dispatch is needed just to repeat completed preparation. The pending action is ENV/input coordination within already-approved scope, not a new PO scope gate.

All51case results remain NOT_RUN. Current owner sub-evidence does not satisfy the complete runtime rows. MC-002/C01-PRODUCT and product/cloud/cost/recovery gates remain OPEN.

Latest frontend intake: [Codex disposition](../reviews/inta-frontend-intake.md), [actual OpenCode source review](../reviews/inta-frontend-opencode-source-review.md), [R1 manual prompt](handoffs/MC-002-INTA-FE-REWORK-PROMPT.md). R1 is READY / NOT_DISPATCHED until owner acknowledgement. No PG provisioned; backend preparation requires no rebuild. Independent runtime verdict remains PENDING.

Latest R1 checkpoint: [intake](../reviews/inta-frontend-r1-intake.md), [actual review](../reviews/inta-frontend-r1-opencode-review.md), [R2 prompt](handoffs/MC-002-INTA-FE-R2-PROMPT.md). R1 manual execution received (supersedes R1 not-dispatched); R2 READY / NOT_DISPATCHED. No upstream/PG action before reviewed corrections; driver readiness gates must not amend endpoint contract.

Latest R2: [intake](../reviews/inta-frontend-r2-intake.md), [actual review](../reviews/inta-frontend-r2-opencode-review.md), [R3 full prompt](handoffs/MC-002-INTA-FE-R3-PROMPT.md). R2 actual manual return received; R3 READY / NOT_DISPATCHED. No new PG/private DSN/Go launch; backend binary retained. Driver must stop between lifecycle stages and prevent replay before I/O.

Latest R3: [intake](../reviews/inta-frontend-r3-intake.md), [actual review](../reviews/inta-frontend-r3-opencode-review.md), [R4 full prompt](handoffs/MC-002-INTA-FE-R4-PROMPT.md). R3 actual manual return received; R4 READY / NOT_DISPATCHED. Codex isolated helper counterexample reproduced invalid-intent acceptance with0network; no owner baseline replay/Go/PG. Actual runtime commands stage1..7 ONLY; phase* combining aliases prohibited.

Latest R4: [intake](../reviews/inta-frontend-r4-intake.md), [actual failed review](../reviews/inta-frontend-r4-review-blocker.md), [manual QA prompt](handoffs/MC-002-INTA-FE-R4-QA-PROMPT.md) READY/NOT_DISPATCHED. Human authorized an alternate model/provider; big-pickle also failed429; no authenticated integration available, no further cycling/login/payment. R4 received; not REWORK_REQUIRED merely for quota. ENV still not created;51NOT_RUN.

Latest provider checkpoint: actual per-invocation opencode/big-pickle session ses_e8dab66d3ffeZNJjY1xaZY1cnt also failed provider.free-limit429 with no verdict. Await usable externally restored/authenticated OpenCode route or quota recovery. No new source-rework assignment, no provider substitution, no ENV creation.

## Human routing override — R4 source review to ZCode

Human explicitly requests rewriting the R4 review prompt for actual ZCode. [Complete manual prompt](handoffs/MC-002-INTA-FE-R4-ZCODE-REVIEW-PROMPT.md) READY / NOT_DISPATCHED; no invocation or verdict. Same33immutable source snapshots, reviewed head48cc03e; ZCode checks Antigravity frontend source only and discloses authorship conflicts. Both failed OpenCode attempts preserved; no impersonated OpenCode result. This source-review override does not replace independent OpenCode QA for36runtime cases. ENV_HELD,51NOT_RUN and MC-002/product/cloud/cost/recovery gates unchanged. Next: human delivers prompt, returns ZCode report for Codex intake.
