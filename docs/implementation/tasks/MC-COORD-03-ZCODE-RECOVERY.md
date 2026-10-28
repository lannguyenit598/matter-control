# MC-COORD-03 — ZCode subscription interruption recovery

Status: **IN_REVIEW / SCOPED_CONTINUATION_DELIVERED**. Owner: actual Local Codex. Priority:P0. Date:2026-10-26. Authority: direct PO instruction that ZCode subscription is exhausted and Codex should inspect/continue its work. No paid account/model change or external ZCode invocation is authorized or needed. Subscription exhaustion is PO-reported; no billing/login probe was performed.

Requirement links: orchestration continuity for MC-BE-01,MC-BE-02-PREP,MC-002-INT-A,MC-003A.8A/N1; preserve their existing product requirement IDs and constraints. No product requirement, route, numeric policy or Design Gate is added by reassignment.

## Current baseline and scope

Primary repository /Users/nguyenvanlan/Documents/code/pet-projects/matter-control, branch codex/unified-project-flow, starting HEAD a62d838791ba188838c4ff00b7b6e265ac775056. Existing tracked/untracked changes and imported source snapshots are preserved. BE01remains136eae6+reviewedstagedpatch33297560; nativeINTAsources52b60a4/3e5a642/48cc03e and59filefinalledger remain immutable.

Codex takes over execution of already assigned ZCode backend/frontend responsibilities until the PO changes ownership again. Completed ZCode evidence keeps its actual authorship; independent QA/architecture/PO acceptance never transfers to the implementer. No source assignment may evade a missing accepted base, unresolved Mimosa enforcement or contract/design gate. Existing runtime tasks retain their exact/tmp paths rather than silently moving to imported apps/*.

Allowed work this recovery: new governance/evidence outputs under docs/testing/zcode-recovery-20261026 and docs/reviews; root/current ownership/task/RACI updates; read-only named source/manifest/partial evidence and selected metadata; complete existing read-only INT-A and BE02 technical tasks. No new product source code, DB/HTTP/build/guard tests, lifecycle, commit or provider action is implied by those read-only tasks. Broader implementation continues only when each previously required readiness/approval condition is met.

## Inventory and disposition

| Work | Observed checkpoint | Codex action / status |
|---|---|---|
| INT-A stages1..7 | Executed,23endpoint cases/27attempts/23trueassertions | Preserve, no replay. |
| INT-A closeout readiness |24partial raw files, no ZCode final report/manifest | Completed read-only assembly in Codex-authored return; runtime gaps explicit. |
| INT-A live resource state |Go absent,Next expected PIDs/listener now absent,samePGhealthy | Runtime continuation held for Next disappearance reconciliation; no restart/cleanup. |
| BE02 four corrections |9pinned inputs, PF01..04 awaiting author recommendation | Codex supplied all four corrected candidate clauses/acceptance assertions; no BE02 code. |
| BE01 completion |Independent source/evidence PASS,9reviewed paths staged,commitMimosaBLOCKED | Ownership adopted, patch integrity reverified; no redundant review/test or equivalent commit retry. Supported gate resolution remains required. |
| F10 N1 |Codex technical pin already completed,79referencechecksPASS | No new ZCode action; independent contract acceptance/adoption still pending. |
| Older C01/harness/source reviews |Completed reports/history | No replay/re-authoring; retain original identities. |
| Product frontend |Pinned template source, no approved productUIimplementation | Codex owns future permitted implementation; Design Gate still prevents starting it now. |
| UX/provider quota |Separate LocalCodex/OpenDesign attempt quota block | Not ZCode work; no provider switch/retry inferred. |

## Outputs and acceptance checks

- [INT-A recovered return](../../reviews/inta-closeout-readiness-codex-return.md): exact ENV02..07/ISO01..02 evidence,11missing guard negatives, absent retained product build artifacts and Next drift disposition.
- [BE02 corrected return](../../reviews/be02-codex-correction-return.md): PF01deterministic versioned projection,PF02outside-body provenance,PF03product status/fingerprint/path matrix,PF04transport-neutral identity.
- [Recovery evidence](../../testing/zcode-recovery-20261026/):100integrity checks PASS,24partial inventories/exactsourceexcerpts,59ledger/source pins, selected resource metadata and proposed BE02 assertions.
- Root AGENTS/currentworkflow/RACI/task amendments route new work to Codex and supersede pending ZCode dispatch actions while keeping immutable old packets unchanged.

Acceptance: no source/evidence overwritten, no remaining read-only task waits on ZCode subscription, every actual runtime mismatch is explicit, BE01stagedpatch and oldsource/result/gates preserved. Document/hash/link checks verify the recovery changes; no product behavior tests are relevant to this documentation-only continuation. No DONE without required independent review/commit evidence under project policy.

Reviewer: PO for the directly requested ownership routing, independent OpenCode/designated contract reviewer for new technical proposals, Claude/PO for applicable architecture/material trade-offs. None invoked or self-approved by this task.

Skipped: billing/account checks, ZCode/provider calls, source implementation, guard/build/runtime/DB/HTTP/lifecycle and commit/push. Risks: Next shutdown telemetry is absent, live PG remains retained, source commits are still gate-blocked and new contract proposals await proper acceptance.

## Final preservation cross-check

[33 additional focused checks](../../testing/codex-owner-takeover-20261026/final-checks.json) PASS:485imported source files by bytes/hash/mode, original nine-input correction packet, reviewed BE01stagedpatch, three clean frozen sources,59ledger files,24partial originals,27planned NOT_RUN and51formal INT-A NOT_RUN rows, links/routing/whitespace. These are document/source integrity checks, not runtime tests or independent QA. [Initial six-workstream audit](../../testing/codex-owner-takeover-20261026/audit.json) preserves pre-edit input hashes and selected read-only metadata permission outcomes.

[Existing successful Next attempt log inspection](../../testing/codex-owner-takeover-20261026/next-existing-log-reconciliation.json) records1906byte stdout/empty stderr without a retained terminal signal/exit/cause. The earlier Turbopack failure is a different attempt and cannot explain the later disappearance. Runtime reconciliation and controlled later validation remain pending; no restart or cleanup was performed.

## INT-A readiness packet finalized — 2026-10-26

[Final Codex readiness return](../../reviews/inta-closeout-readiness-return.md) completes the missing artifact delivery:44payloads+manifest,615780payload bytes,305 checks PASS;24original partial files/59ledger files unchanged. Exact8procedure references, full source hashes/lines/attribution,61application-log marker scans,27bounded complete envelopes and a minimal guard/artifact plan retained in byte-identical raw/export. The original24files were preserved; new outputs are under completion-codex. No fresh test/build/HTTP/SQL/private config/lifecycle/agent call or commit. Readiness IN_REVIEW/CLOSEOUT_READINESS_RETURNED; actual-secret coverage,11startup guards, product artifacts, historical Next termination reconciliation, owned teardown and independent review remain pending.51formal results and all existing quality gates unchanged.

## Backend ownership restored to ZCode — 2026-10-26

The latest direct PO instruction, “chốt lại backend vẫn là zcode đảm nhiệm”, supersedes this task's temporary backend execution takeover prospectively. Actual ZCode owns backend execution; Antigravity retains frontend execution. Codex retains coordination, PostgreSQL/DevOps, privacy/evidence, task preparation and intake. Earlier Codex/ZCode work keeps its actual authorship; this historical recovery task is not rewritten or marked DONE by the routing change.

BE01 commit remains Mimosa-blocked; use the existing scoped ZCode investigation handoff without a new scan/commit loop. BE02 remains preparation/contract work until its accepted base, required decisions and bounded implementation assignment exist. Existing independent OpenCode reviews and architecture/PO gates remain mandatory. Availability/quota and dispatch are unverified; report BLOCKED if unavailable, with no automatic Codex fallback. Refresh live task-document pins before any later packet dispatch; frozen review packets remain unchanged.
