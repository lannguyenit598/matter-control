# INT-A — Current Owner Coordination

Codex,2026-10-25 Asia/Ho_Chi_Minh. DEC-028/INTA-1 unchanged. This current table supersedes prior preparation/ENV-held snapshots; raw historical returns/reviews remain immutable.

| Workstream | Actual current evidence | Next dependency/action |
|---|---|---|
| Antigravity source | R4 clean48cc03e; actual human-routed ZCode SOURCE/EVIDENCE PASS_WITH_LIMITATIONS accepted; R3-F01..F07 closed/dispositioned | No more source rework assigned; preserve reviewed source, canonicalstage1..7 only |
| Codex ENV | Actual new mc002-inta-pg-intamvnmoems3pd, ID04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01, healthy/empty verified; new named volume; privateDSN0600ready | Retained RUNNING_READY for manual backend handoff. Codex only owns later exact-container lifecycle |
| ZCode backend | Existing clean52b60a4 binary hash unchanged; no migration/start yet | [Migrate/start full prompt](handoffs/MC-002-INTA-BE-RUNTIME-START-PROMPT.md) READY/NOT_DISPATCHED. Human delivers now; actual return required |
| Antigravity runtime | No actual Next/driver stage in this new ENV | [Full staged prompt](handoffs/MC-002-INTA-FE-RUNTIME-PROMPT.md) READY/NOT_DISPATCHED, WAITING_BE_READY. Stage1 only after accepted backend-ready return |
| OpenCode runtime QA | Original provider.free-limit429 source attempts retained; no runtime QA verdict | Mandatory36case independent QA still pending; no silent substitution with ZCode. Usable route/runtime permission and actual owner evidence needed |

## Frozen run and manual stage barriers

Actual driver-generated runId `intamvnmoems3pd`, fresh shared Next/driver state `/tmp/mc002-inta-state-intamvnmoems3pd`. State path was absent before ENV; do not create it or invoke status/invalid CLI/pausedstage1 with this runId before actual stage1 prerequisites. Evidence owner attempts use runtime-/env-prefixed leaf names to avoid fresh-preflight per-runId collision. Previous proposed inta20261025a not used.

Private backend config `/tmp/mc002-inta-private/intamvnmoems3pd/backend.env` stays local0600/parent0700; never render/copy values into chat/Git/review packets. ZCode loads privately only after verified DB identity. Antigravity does not read this file. Frontend has no product auth/provider secrets.

Order: ZCode migrate/start → frontendstage1/checkpoint → ZCode Go restart → frontendstage2/PERS01 → Codex samePGrestart → frontendstage3/PERS02 → frontendstage4/update/stale → Codex PGstop whileGoalive → frontendstage5/outage → Codex samePGrecovery withoutGorestart → frontendstage6/recoveryreads → ZCodeGostop → frontendstage7/T12 → log/privacy/correlation/isolation/ownedteardown and independentQA. Every arrow crossing an external-owner action requires actual return/confirmed identity before the next stage; printed instructions are not execution.

No direct owner engineering dispatch performed by Codex; manual prompts READY until human delivery/owner acknowledgement. Codex provisioning was actual execution and is separately evidenced. No backend rebuild, no source changes, no Next/Go/mutation cases yet. X POST alwaysOUTCOME_UNKNOWN, never retry/re-POST/newkey/list/SQLprobe. Resources deliberately retained; no stop/remove/prune of existing assets.

[Source closure](../reviews/inta-frontend-r4-source-closure.md), [actual ENV return](../reviews/inta-environment-return.md), [ENV evidence](../testing/inta-returns/environment/env-intamvnmoems3pd/environment.json).51canonical acceptance results NOT_RUN; INT-ENV-01 has actual executed sub-evidence pending full independent acceptance,0PASS/0FAIL. MC-002/C01-PRODUCT/product identity-isolation/Cloudflare/cost/full recovery/architecture gates OPEN. No Step03/paid/deploy/merge/MC-003A changes.
