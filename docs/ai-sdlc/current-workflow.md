# MatterControl — unified project workflow

As of 2026-10-26, Asia/Ho_Chi_Minh. Owner: Local Codex, PM/BA/orchestration.

## One coordination branch

Use `codex/unified-project-flow` in `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control` for all further governance, design intake and integration coordination. The Product Owner explicitly requested this consolidation. Former coordination branches/worktrees remain recovery/history references, not active parallel writing destinations. Dedicated backend/frontend source checkouts retain their own reviewed baselines and ownership; this merge does not merge or modify their product source.

This is one delivery flow with separately evidenced workstreams. A branch merge is not design approval, architecture approval, runtime acceptance or production release.

## Current evidence and next actions

| Workstream | Evidence currently committed | Next action and dependency |
|---|---|---|
| MC-BE-01 | [Bounded task](../implementation/tasks/MC-BE-01.md) and handoff; PO reports work performed | Locate the latest ZCode implementation return, exact source head, tests and independent review; intake only missing evidence. Do not reassign the original task. |
| F-08/F-10 | [Latest committed intake](../design/step-03a/handoff/step-03a-8a/zcode-remaining-return-r1/intake.md) records rework/decision items; PO reports follow-up performed | Reconcile newer returns before declaring these items open or closed. Adopt no new counting unit, route or response-size risk without the applicable decision. |
| INT-A | [Coordination](../implementation/inta-coordination.md), accepted source review and provisioned fixture at imported head `7cdde53` | Intake the retained local backend runtime return, verify current resource/process identity, then advance the existing staged frontend runtime handoff. Never repeat a mutation/start solely because the committed dashboard predates its return. |
| UX validation | local-r3 concept, source remediation, candidate contracts and handoffs | Reconcile accepted contract changes into design/consumer obligations, then perform permitted rendered/interaction checks and independent Design QA. |
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
- Recovery: original branches retained. Three primary untracked export files were byte-identical to the incoming tracked versions; copies and a SHA-256 inventory of 44 primary/45 design untracked documentation files were saved under `/var/folders/9b/zd6k4tc179587w4ntkqvvlqr0000gn/T/mattercontrol-merge-recovery-zmg5plm0/` before merging. This temporary backup is supplemental; original commits remain durable recovery references.
- Outputs: the merged histories, this workflow, dashboard checkpoint and root agent routing instructions.
- Acceptance/checks: no merge conflicts; both original heads are ancestors; every original tracked file retained byte-for-byte except the intentionally updated AGENTS/dashboard; original untracked documentation hashes preserved; relative links in the new workflow resolve; whitespace checks pass for the three coordination updates. The full incoming diff retains 12 trailing-space warnings already present in the historical `subagent-a-operational-ux.md` report (mostly Markdown hard breaks); that evidence file is preserved byte-for-byte rather than rewritten for this merge.
- Tests: focused Git/document integrity checks only. No product/runtime/build/Go/PostgreSQL/browser tests, owner dispatch, provider call or release operation.
- Reviewer: Product Owner can inspect this local coordination merge; independent product/design/runtime reviews retain their existing owners and gates. No independent review was invoked for this mechanical merge.
- Completion evidence: the local two-parent merge commit contains both exact input heads; its SHA is available from Git history. No push, branch deletion or worktree removal.
