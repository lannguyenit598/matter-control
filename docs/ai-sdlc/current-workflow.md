# MatterControl — unified project workflow

As of 2026-10-26, Asia/Ho_Chi_Minh. Owner: Local Codex, PM/BA/orchestration.

## One coordination branch

Use `codex/unified-project-flow` in `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` for all further governance, design intake and integration coordination. The Product Owner explicitly requested this consolidation. The former MC-002/MC-003A coordination branches were deleted after ancestry verification. Their commits remain in the unified merge history. The old design worktree is detached at the unified revision, with its untracked files retained; it is not an active writing destination. Dedicated backend/frontend source checkouts retain their own reviewed baselines and ownership; this merge does not merge or modify their product source.

This is one delivery flow with separately evidenced workstreams. A branch merge is not design approval, architecture approval, runtime acceptance or production release.

## Current engineering ownership — 2026-10-26

The Product Owner explicitly assigns backend and frontend development to ZCode. Antigravity has no default new frontend assignment; its existing source and accepted reports retain their original authorship. See [RACI](raci-matrix.md). Codex still coordinates and owns PostgreSQL barriers; ZCode owns Go and Next/driver in separate scoped steps. OpenDesign owns UX and Claude Code architecture; OpenCode/formally designated independent reviewers remain separate from ZCode-authored changes.

The active [frontend stage1 handoff](../implementation/handoffs/MC-002-INTA-FE-RUNTIME-PROMPT.md) now addresses ZCode using its currently configured provider/model and permitted quota, with no automatic model switch or dispatch. The historical FE filename is stable. Stage1 actual return has now been received; [Codex intake](../reviews/inta-frontend-runtime-stage1-intake.md) records STAGE_1_EXECUTED / WAITING_GO_RESTART. Do not replay stage1; the new separate backend restart handoff remains READY_NOT_DISPATCHED and requires fresh identity checks. Ownership does not grant backend/private-config access inside a frontend-only step or permission to skip a later Go/PG barrier.

Coordination change MC-COORD-02: owner Local Codex; priority P0; status IN_REVIEW; process-only requirement linkage MC-002-INT-A, MC-CONT-01 and MC-003A-READ-CONSUMPTION. Inputs are the direct PO instruction and current tasks/handoffs. Outputs are aligned role/RACI/workflow/task instructions and the ZCode frontend handoff. Acceptance is consistent current ownership, preserved authorship, stage/QA gates and configured-route constraints. Validation is focused document assertions and Git whitespace checks; no runtime or external agent execution. Reviewer is PO for this directly requested role change; product/architecture/design/runtime acceptance remains with the existing independent authorities.

## Current evidence and next actions

| Workstream | Evidence currently committed | Next action and dependency |
|---|---|---|
| MC-BE-01 | [Actual implementation intake](../reviews/be01-intake.md): clean136eae6,31files, owner391passes/1intentional skip; three new Codex overlay counterexamples reproduce defects | REWORK_REQUIRED: saved-Matter receipt authorization, pending-boundary fail-closed, membership failure propagation. Scoped ZCode rework prompt ready/notdispatched, corrected gate then nonauthor review; no BE02 expansion. |
| F-08/F-10 | [Final owner confirmation](../design/step-03a/handoff/step-03a-8a/zcode-f10-owner-confirmation-r1/intake.md): C1/C2/C3 consolidated as OWNER_TECHNICALLY_CONFIRMED_CANDIDATE; F08 unchanged | One exact-revision independent review by a nonauthor, six-snapshot packet prepared/notdispatched; then field/bounds/catalogue PO choices. No mandatory Claude owner loop or full rewrite; catalogue32/gates unchanged. |
| INT-A | [Stage2 intake + actual same-PG restart](../reviews/inta-frontend-runtime-stage2-intake.md): full A equal after Go restart; Codex one stop/start exact container/volume, healthy, Go/Next and32ledger files unchanged | Deliver [released ZCode stage3 cue](../implementation/handoffs/MC-002-INTA-FE-STAGE3-PROMPT.md), one INT-PERS-02 readback then WAITING_CODEX_STAGE4_CUE. No restart replay or stage4 mutation. |
| UX validation | local-r3 concept, source remediation, candidate contracts and handoffs | [Contract/design/consumer mapping](../testing/continuation-20261026/contract-design-consumer-trace.json) added. Source161/162PASS, one explained live decision-log append drift; historical bytes verified in Git. Rendered target restriction and independent QA remain pending. |
| Approval | Product requirements approved; architecture/product/security/cost/recovery gates remain scoped and open | Update each gate only from actual evidence and the required authority. MC-003A REWORK_REQUIRED; STEP03B NOT_AUTHORIZED. |

BE-01 is a product slice separate from the frozen native INT-A baseline. Do not substitute the BE-01 binary/schema into INT-A. Actual source, runtime, reviewer and PO acceptance remain separate statuses.

## Shared continuation rules

1. Read this file, [project status](project-status.md), the assigned task and its latest intake before work. Confirm branch/HEAD and preserve existing local changes.
2. Follow the newest actual return rather than a historical READY_NOT_DISPATCHED label. If a return is missing from accessible sources, request only its exact location while continuing independent work.
3. Record owner, input/source revision, scope, evidence and next dependency in the task/intake. Cross-link integration and design impacts; retain original reviewer artifacts and immutable contracts.
4. Keep external-owner stage barriers and independent review boundaries. A prepared prompt is not an invocation; an owner return is not independent approval.
5. Do not commit untracked runtime returns, raw logs, `.mimosa`, `node_modules`, secrets or unrelated evidence as part of this consolidation. Intake and security/provenance checks precede any later evidence commit.
6. Use normal permission controls. No automatic provider switch, paid retry, login, push, deploy or Step03B transition follows from this merge.

## Consolidation task and recovery evidence

- Task: MC-COORD-01; owner Local Codex; priority P0 coordination; status IN_REVIEW (mechanical merge completed after the checks below, no independent product review claimed).
- Requirement linkage: process/traceability only; MC-002, MC-003A.8A and MC-BE-01. No FR/RULE semantics changed.
- Authority: direct Product Owner instruction to merge the two branches into one flow on 2026-10-26.
- Inputs: MC-002 `7cdde5358328879b98ec799c51d6b4835c1c510a`; MC-003A `2c14cbb6239984bdafa178c8326e75d8b839200f`; merge base `3ebc0f0e8daa6dc7682e02dfa61b8fa6b9ca20fb`.
- Preflight: 12 integration-only and 25 design-only commits; 209 and 228 changed tracked paths respectively, with no overlapping changed paths. Both tracked working trees were clean. Existing untracked material was preserved.
- Recovery: original source commits are reachable through the unified merge. The two former task branches were subsequently deleted with `git branch -d` after verifying both were ancestors; no force deletion was used. Three primary untracked export files were byte-identical to the incoming tracked versions; copies and a SHA-256 inventory of 44 primary/45 design untracked documentation files were saved under `/var/folders/9b/zd6k4tc179587w4ntkqvvlqr0000gn/T/mattercontrol-merge-recovery-zmg5plm0/` before merging. This temporary backup is supplemental; original commits remain durable recovery references.
- Outputs: the merged histories, this workflow, dashboard checkpoint and root agent routing instructions.
- Acceptance/checks: no merge conflicts; both original heads are ancestors; every original tracked file retained byte-for-byte except the intentionally updated AGENTS/dashboard; original untracked documentation hashes preserved; relative links in the new workflow resolve; whitespace checks pass for the three coordination updates. The full incoming diff retains 12 trailing-space warnings already present in the historical `subagent-a-operational-ux.md` report (mostly Markdown hard breaks); that evidence file is preserved byte-for-byte rather than rewritten for this merge.
- Tests: focused Git/document integrity checks only. No product/runtime/build/Go/PostgreSQL/browser tests, owner dispatch, provider call or release operation.
- Reviewer: Product Owner can inspect this local coordination merge; independent product/design/runtime reviews retain their existing owners and gates. No independent review was invoked for this mechanical merge.
- Completion evidence: the local two-parent merge commit contains both exact input heads; its SHA is available from Git history. No push or worktree removal. Subsequent branch cleanup preserved all 45 untracked files in the design worktree by SHA-256; `main` remains the baseline branch and `codex/unified-project-flow` is the active coordination branch.

## Go restart return received — 2026-10-26

Actual ZCode Go restart return is received; Local Codex verified22export pairs/21payload hashes/29unchanged ledger files and observed newGo98134 with unchangedNext88444/88453. Old77632 absent; graceful stop/start evidence retained. Current status RESTART_EVIDENCE_VERIFIED_WITH_LIMITATIONS / WAITING_STAGE2; INTA-GOV-RESTART-01 requires text-only reconciliation of the reported Mimosa refusal followed by Write/split-command actions. No retrospective permission or conclusive hook violation determination is inferred. See docs/reviews/inta-backend-go-restart-intake.md (repository-relative). MC-002-INTA-RESTART-GOVERNANCE-CLARIFICATION.md is the immediate handoff; FE-STAGE2 prompt is PREPARED_NOT_RELEASED until Codex disposition. Do not replay restart/stage1, invoke stage2 or touchPG from historical next-action labels above. All51canonical results/QA/product/design gates unchanged. No lifecycle or record request by Codex.

## Restart route clarified; stage2 cue released — 2026-10-26

Actual ZCode text-only clarification quotes Mimosa explicitly prescribing Write/Edit/MultiEdit for script-content scan; INTA-GOV-RESTART-01 is EXPLAINED_TOOL_WRITE_ROUTING / NO_REMAINING_STAGE2_HOLD with owner-reported telemetry limits. See docs/reviews/inta-go-restart-route-clarification-intake.md (repository-relative). This supersedes the provisional stage2 hold above, not any independent-QA gate. Stage2 CUE_RELEASED / READY_NOT_DISPATCHED: deliver MC-002-INTA-FE-STAGE2-PROMPT.md to actual ZCode; immediate source/process/state recheck, one INT-PERS-01 readback only, then WAITING_PG_RESTART. Go/Next observed unchanged at18:06:18Z;29ledger hashes unchanged. No restart replay, PG action, driver invocation or provider call by Codex. All51formal results/runtimeQA/product/design/release gates remain unchanged.

## Stage2 received and same-PG restart executed — 2026-10-26

[Repository-relative: docs/reviews/inta-frontend-runtime-stage2-intake.md] Local Codex verifies9owner export pairs/8hashes, full A baseline equality/version1, one INT-PERS-01 request correlated in newGo log;32state files counter15/12assertions/STAGE_2_COMPLETED. Report UTC/latency errata retained, no raw rewrite. Codex then ACTUALLY stop/start exactPG04552c…bd01 once at18:13:34–18:13:37Z, exit0, same volume/image/container/labels/caps/ports and healthy; Go98134/Next88444+88453/start times and32ledger hashes unchanged. No SQL/recordHTTP or Go/Next lifecycle. Status SAME_PG_RESTART_EXECUTED / WAITING_STAGE3_READBACK. Stage3 MC-002-INTA-FE-STAGE3-PROMPT.md is CUE_RELEASED / READY_NOT_DISPATCHED; human delivers to ZCode, one readback then WAITING_CODEX_STAGE4_CUE. Supersedes older stage2-pending/PG-next-action labels only; no restart replay/stage4 or further lifecycle.51formal results/independent QA/product/design gates unchanged, explicit executed subevidence in new checkpoint.
