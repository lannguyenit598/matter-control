# MatterControl — parallel assignments while Antigravity R4 is pending

Coordination task MC-PARALLEL-20261026; priority P0; actual owner Local Codex; authority: direct human request to list and assign independent parallel work while waiting for R4, followed by instruction to continue. Branch `codex/unified-project-flow`, base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. Inputs: current workflow, each named owner task and its pinned packets. No new product scope, paid route, runtime, Step03B or security-gate bypass is authorized.

## Assignments ready now

| Task / owner | Scope and requirement IDs | State and dependency | Exact handoff / next output |
| --- | --- | --- | --- |
| MC-002-INTA-FE-VALIDATION-R4 / actual Antigravity | INT-ENV-05/R07, carried R2-I02..06, R3-N01..06/NF-1..6; bounded source/mock correction | Prompt prepared; human reports waiting for return, but no R4 acknowledgement/return currently recorded in this workspace. Do not redispatch if already running. | [Existing R4 prompt](handoffs/MC-002-INTA-FE-VALIDATION-R4-ANTIGRAVITY-PROMPT.md); new validation-r4 paths only. |
| MC-INTA-PRIVACY-QA-R1 / actual OpenCode, session A | INT-PRIV-01/INT-ISO-03; independent static review of completed original+supplemental scan and stopped-PG evidence | READY_NOT_DISPATCHED; does not depend on R4 or live PG. | [Full privacy QA prompt](handoffs/MC-INTA-PRIVACY-QA-R1-OPENCODE-PROMPT.md); new privacy-teardown-review-r1 outputs. |
| MC-BE02-N1-CONTRACT-REVIEW-R1 / actual OpenCode, session B | FR-001/008/018/020, PF01..04, F10 N1/N2, corresponding AC/NFR; combined technical contract review | READY_NOT_DISPATCHED; does not depend on R4, live PG or a corrected committed source base for this read-only review. Implementation still waits for those separate gates. | [Full BE02/N1 prompt](handoffs/MC-BE02-N1-CONTRACT-REVIEW-R1-OPENCODE-PROMPT.md); new be02-n1 review outputs. |
| MC-002-INTA-PRIVACY-SUPPLEMENT / actual Codex | Fill omitted/new evidence coverage under already assigned Part P | EXECUTED / IN_REVIEW; 123 files / 1,838,578 bytes / zero actual-value matches. Original 1,153 files unchanged. Independent acceptance pending. | [Actual supplement return](../reviews/inta-codex-privacy-supplement-return.md); raw/export six pairs retained. No lifecycle. |
| MC-BE01-MIMOSA-OPERATOR-R1 / Human/operator/maintainer | Existing finding f4bd71af…; supported finding-scoped resolution for blocked commit | READY_FOR_OPERATOR / NOT_SENT. Requires real operator mechanism/authority, not another Codex scan. | [Operator prompt](handoffs/MC-BE01-MIMOSA-OPERATOR-R1-PROMPT.md) reuses [existing dossier](../testing/be01-r1-commit-intake/MIMOSA-FINDING-RESOLUTION.md); return supported disposition or BLOCKED. |

The two OpenCode sessions may run concurrently only if the current permitted route supports it. Use separate sessions and unique output namespaces. Do not switch provider/model or start a paid route to obtain concurrency. If one session at a time is available, do privacy QA first and queue BE02/N1; Antigravity R4 and operator action can continue independently. No external agent has been invoked by Codex in this planning turn. Three internal read-only Codex explorers helped scope these lanes; they are not actual external OpenCode/ZCode/Claude and do not supply the independent acceptance verdict.

## Ownership and completion contract

All read sets are pinned under [parallel packet directory](../testing/parallel-work-20261026/). All 100 direct/transitive input checks passed. Each full prompt defines exact output paths, input hash rechecks, actor acknowledgement, acceptance questions, permitted static checks and required return evidence. The reviewer owns only its new report/metadata; neither review may edit source, canonical contract/task/status, R4 or the other session's outputs. Codex alone integrates returns into current status. Existing shared branch/index/history are unchanged; no parallel product writer or extra source worktree is authorized.

Each owner acknowledges task ID, actual identity, root/base and scope after human delivery. Missing acknowledgement means READY, not IN_PROGRESS. State changes follow READY → IN_PROGRESS → IN_REVIEW → TESTING → DONE only with evidence. Review completion is not implementation/adoption. Independent reviewer for R4 is later actual OpenCode; independent reviewer for Codex-authored privacy and BE02/N1 is actual OpenCode in the assigned lanes. Codex intakes operator evidence without claiming to be the security authority. Parent MC-002 retains all remaining acceptance gates.

Acceptance: each independent return verifies its pinned input, answers every assigned question or records a concrete gap, writes only its absent-owned output, provides hashes/bytes/tool/UTC/test limits and leaves formal cases/gates unchanged. No implementation-mirroring or runtime tests are assigned to these static reviews. Completion evidence: output manifest/pins, source/contract findings and explicit verdict; every unperformed runtime check remains NOT_RUN.

## Work that remains dependency-bound

- R4 runtime/next source review waits for actual R4 return; do not create another review of unchanged R3.
- BE02 implementation waits for independent technical review, architecture/PO scope/adoption decisions and an accepted corrected BE01 base. Do not implement HTTP/auth/product features just to keep busy.
- BE01 commit remains BLOCKED until a supported Mimosa gate-state change; no equivalent scan/commit retry or hook/baseline/evidence/context bypass.
- UX remains BLOCKED_PROVIDER_QUOTA with browser/rendering restrictions. No silent Cloud/provider switch or duplicate OpenDesign run. After the selected route is actually recovered, resume the retained bounded UX task rather than recreate discovery.
- Final INT-A 36-case acceptance waits for corrected runtime evidence, conformance and reviewed privacy/teardown; 51 formal results are unchanged. PG is stopped/retained and must not be restarted by these tasks. New R4/reviewer output requires supplemental privacy coverage.

## Current handoff history

2026-10-26: user authorized independent parallel work; Codex completed three internal read-only scoping explorations, executed the authorized 123-file privacy supplement and prepared two OpenCode packets plus one operator packet. External dispatch/receiver acknowledgement is not recorded. No report of actual R4 execution is invented. No source commit, external message, runtime or gate promotion follows.

Exact next action: human opens two separate actual OpenCode sessions in the same repository and delivers the corresponding full prompts, while Antigravity continues its existing R4 assignment. Operator receives the separate dossier through a supported mechanism. Return each output independently; Codex can intake whichever completes first.

Skipped: external agent dispatch, operator contact, source/runtime/DB/commit/deploy and blocked UX retry. Risk: provider capacity may serialize the two reviews; security/adoption/runtime gates remain material dependencies even when document reviews complete.

## R4 receipt update — 2026-10-26

Antigravity R4 has actually returned; do not redispatch that author prompt. [Intake](../reviews/inta-fe-validation-r4-intake.md) verifies packet integrity and retains source/proof questions. [Independent R4 source QA](handoffs/MC-002-INTA-OPENCODE-FE-R4-SOURCE-REVIEW-PROMPT.md) is READY_NOT_DISPATCHED with its own namespace. Privacy QA and BE02/N1 contract review remain independent. If only two OpenCode sessions are available, queue R4 review after one finishes; no provider change or duplicate session on the same output paths.

## Three parallel OpenCode returns received — 2026-10-26

[Consolidated intake](../reviews/parallel-opencode-reviews-intake-20261026.md): 10 output pins and 1,480 read/hash checks PASS. Privacy combined measured corpus PASS_WITH_LIMITATIONS and exact PG teardown PASS_SCOPED independently accepted; overall PRIV remains PARTIAL for later R4/new artifacts. BE02 PF01..04/N1/N2 document-PASS with adoption/source gaps; Codex author clarification identifies actual U+E000 vector/presence semantics and supplies non-adopting deltas. R4 CHANGES_REQUIRED with twoP1 proof/private-binding blockers and source closures retained.

[Antigravity R5](handoffs/MC-002-INTA-FE-VALIDATION-R5-ANTIGRAVITY-PROMPT.md) READY_NOT_DISPATCHED; Codex actual private stage follows stable source before combined independent readiness review. No live runtime, PG restart, SIGKILL, new scan/commit or canonical adoption. Model identity is per returned session; no Codex provider switch. Formal51/MC002/Step03B/product/security/cost/recovery unchanged.
