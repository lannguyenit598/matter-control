# MC-002 — Local Integration PoC Dependency Plan

Owner: Codex coordination; implementation owners ZCode/Antigravity; reviewer OpenCode; architecture owner Claude Code. Priority P0 technical gate. Status **PENDING / NOT_EXECUTED / WAITING_COMPATIBLE_APPROVED_CONTRACT**. Authority: Step02.2 Task E and approved H5 local, not approval of a new identity provider or product flow. Requirement trace: NFR-001/002/003/008/009, AC-147/153/156.

Both original native template baselines have actual returned evidence and independent PASS_WITH_LIMITATIONS. Frontend Task REST contract (`/tasks`, `/tasks/stats`) does not match Go User API (`/api/v1/users`); `resolveSession` returns null and Go APIMiddleware has no auth. Separate builds do not form an integration. C01-NATIVE also must pass before expected unavailable integration behavior can be accepted. [Claude prerequisite assessment](../reviews/step-02-c01-claude-clarification.md), [C01 contract](step-02-c01-verification.md).

## Ordered dependencies and acceptance

| Order | Owner / work | Input / output / passing evidence | State |
|---|---|---|---|
| 1 | ZCode, then OpenCode: C01-NATIVE | Exact new source diff and native accepted error/probe/persistence evidence | WAITING_MANUAL_DISPATCH |
| 2 | Claude + PO: decide scope of H5 integration | Explicit choice of transport-only harness versus defer to product API/auth; approved request/response/error/session contract and allowed paths, no Task/User alias | WAITING_DECISION |
| 3 | Codex environment; owners acknowledge | New labelled/capped loopback-only fixture, verified empty DB before assigning DSN; pinned source/heads; synthetic inputs; owned process groups/ports | NOT_PREPARED pending2 |
| 4 | Antigravity + ZCode implement only approved seam | Next→real REST→Go→real PostgreSQL; session behavior under exact agreed scope; no mock presented as end-to-end | NOT_RUN |
| 5 | Owners execute smoke; OpenCode verify | Actual HTTP status/body assertions, create/read/restart/read persistence, nonmatching/invalid errors, outage503/recovery, no false empty/success; current auth negatives if the approved seam includes auth | NOT_RUN |
| 6 | Codex intake / independent review | Per-command argv/UTC/exits/raw output, base/head/diff/config redacted hashes, DB identity/integrity and exact stopped owned resources; no volume deletion | NOT_RUN |

For a later transport-only option, a separate local harness may characterize reachability and parsing without pretending to validate product identity, UI flows or Matter invariants. It requires explicit scope approval first. The architect has proposed it, not approved or selected it. No new route, endpoint or screen is authorized by this plan. An identity choice is required if an actual auth seam is introduced. No AUTH_ALLOW_ANONYMOUS wildcard, shared principal or User→Task conversion.

Local execution after dependencies pass must bind127.0.0.1, verify unused ports, retain credential-free metadata, capture exact process identities, fail on lingering owned listeners and stop only owned processes/containers. Never migrate against a retained baseline/important DB, overwrite a target, prune Docker or delete volumes. Use deterministic barriers for faults and bounded waits/watchdogs. Existing API success and error behavior must be asserted, not inferred from curl exit0.

Completion requires actual connected-chain evidence and independent review against the chosen scope. It cannot close full product authorization, W1 capacity, Cloudflare or cost gates. No integration commands/tests have run in this step.

Skipped: integration scaffolding/execution until contract and identity boundaries are decided. Risk: either pretending the domains match or weakening fail-closed auth would manufacture a misleading PASS.
