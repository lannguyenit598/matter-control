# Step02.3 — Conditional Integration Task Plan

Owner Codex PM/BA/DevOps; base e377568ac47f8f1b88e3875a8f13d7e57fc30667, task/MC-002-solution-architecture,2026-10-25 Asia/Ho_Chi_Minh. Parent MC-002-INT-DEC. **PREPARED / WAITING_PO_APPROVAL. No engineering dispatch or implementation has occurred.** Requirements below constrain future work; they do not claim full FR/AC fulfillment.

## Execution dependencies

PO explicitly selects the local integration scope and accepts its security-evidence limits → Claude finalizes the selected contract → Codex issues exact per-repository task contracts → ZCode backend and Antigravity frontend work from those contracts → Codex provisions the isolated local fixture → OpenCode independently verifies → Claude reviews conformance → Codex records evidence. Backend/frontend contract-driven development may overlap only after interfaces are frozen, with separate owner worktrees. Runtime execution waits for the verified environment. No extra agents are spawned by this plan.

H5/W1/local restore/Q3/Q5 approvals are preserved; they do not select the integration/auth/provider/hosting option. The [scope proposal](../architecture/integration-scope-proposal.md), [decision analysis](../architecture/api-auth-decision-analysis.md), [acceptance matrix](../testing/integration-acceptance-matrix.md) and [PO package](../ai-sdlc/step-02-decision-package.md) govern scope once reviewed. No Task→User alias, anonymous wildcard, shared-principal product access, extra product endpoints or C01 rewrite is permitted.

## MC-002-INT-ARCH-FINAL — Claude Code

- Owner: actual Claude Code; reviewer actual OpenCode, PO for material changes. Priority P0. Status WAITING_APPROVAL.
- Trace: FR-018, NFR-001/002/003/008/009; existing candidate API/security contracts and selected INT decisions. Dependencies: recorded explicit PO selection.
- Inputs: exact approved proposal revision, accepted backend52b60a4/frontend3e5a642, approved requirements and all relevant unresolved decision dispositions.
- Scope/paths: finalize chosen API/auth/harness boundary and allowed engineering paths; governance architecture/ADR addendum only if the PO decision authorizes it. Preserve historical normative manifests; a later approved revision must get a new manifest, never silently replace the historical one.
- Outputs/acceptance: frozen methods/payloads/errors/origins/identity/isolation/evidence limits; unambiguous expected failures; no unapproved product policy, dependencies or retry semantics; independently reviewed contract plus decision record.
- Checks/completion: document/source-contract review, no test result inferred. Record actual tool/model/session, packet/return hashes and review. New material variance returns to PO.

Current-round routing: the human reassigned the remaining bounded clarification/review to actual OpenCode and skipped Claude review this round. Returned wording is applied; PREREQ-01/02 and F1..F4 are closed at documentation/source-evidence level. The [override](../ai-sdlc/step-02-3-review-routing.md) supersedes the manual Claude prompt for these items. No Claude login/return is awaited for this current round; future material architecture and post-approval contract/conformance gates retain their owners.

## MC-002-INT-BE — ZCode

- Owner: actual ZCode; reviewers actual OpenCode and Claude for conformance. Priority P0 technical gate. Status WAITING_APPROVAL_AND_FINAL_CONTRACT.
- Trace: NFR-003/008/009 and scoped API compatibility; FR-018/NFR-001/002 constrain exclusions or any separately approved auth. Dependencies: ARCH-FINAL and Codex exact task contract; runtime tests additionally require ENV.
- Input repository: go-hexa-template accepted source52b60a4. New isolated worktree/branch; exact base/cleanliness/allowed paths verified at dispatch. Preserve prior R01/R02/C01 evidence worktrees.
- Scope: backend feasibility and the smallest selected seam support; reuse existing native API/persistence/error behavior. No new product/domain/auth implementation is authorized by this plan. If no backend production change is necessary, return evidence of that assessment and focused future integration checks; never invent code to fill the task.
- Outputs/acceptance: bounded diff or explicit no-diff result; source/base/head and focused assertion evidence for only the approved seam. Accepted C01 behavior preserved. Unknown write outcomes remain explicit; no unsafe retry. No test credential/log/body exposure.
- Tests/completion: future focused contract/integration checks selected from QA matrix, exact argv/UTC/exit/raw redacted evidence and named pass/fail/skip counts. Status IN_REVIEW until independent QA and architect review; never product/C01-PRODUCT closure inferred.

## MC-002-INT-FE — Antigravity

- Owner: actual Antigravity; reviewers actual OpenCode/Claude. Priority P0. Status WAITING_APPROVAL_AND_FINAL_CONTRACT.
- Trace: NFR-001/002/008/009; selected compatibility/failure-display criteria. Dependencies: ARCH-FINAL and exact task contract; end-to-end execution additionally requires BE and ENV.
- Input repository: nextjs-atomic-starter accepted source3e5a642. New isolated worktree/branch and exact allowed paths at dispatch.
- Scope: isolated local harness/client boundary selected by PO, real REST requests, schema/error validation, explicit unavailable/unknown outcome. Keep existing Task UI and fail-closed auth semantics. Do not repurpose TaskRepository as UserRepository or present synthetic template records as MatterControl identity.
- Outputs/acceptance: minimal bounded harness/client change; production exclusion demonstrated; direct server entry validation and privacy/no-shared-cache checks as applicable; no product screens or Cloudflare adapter selected implicitly.
- Tests/completion: future focused rendering/compatibility/failure assertions from matrix with source/head/argv/UTC/exits and synthetic fixture provenance. Do not repeat the accepted99unit/9E2E/build baseline merely for reassurance. Independent QA required before scoped acceptance.

## MC-002-INT-ENV — Codex

- Owner: Codex Cloud/DevOps; reviewer actual OpenCode. Priority P0. Status WAITING_APPROVAL_AND_FINAL_CONTRACT.
- Trace: NFR-002/003/008/009; H5/DEC-023 and W1/DEC-024 are inputs, not achieved capacity/recovery promises. Dependencies: approved selected seam, finalized versions/fixture/resource needs and owner task acknowledgement. Prepare after implementation contracts; provision before runtime validation.
- Scope/paths: local test-environment governance and new synthetic disposable fixture only. No cloud/account/paid/production or existing container/database mutation.
- Inputs/outputs: pin Go/Node/Next/PG and source heads, choose unused owned loopback ports, fresh random credentials without tracing/env dumps; verify exact new empty healthy DB/user before assigning DSN; capped/labelled resources and no real legal data. No credentials in Git or review packets.
- Acceptance: all services intentionally loopback-only, fixture isolation and process/container ownership checked, no public test harness exposure, redacted config and lifecycle plan; stop owned resources and retain evidence without destructive prune/volume cleanup.
- Checks/completion: future preflight/identity assertions and metadata. Environment readiness alone is not integration success, production isolation, W1 performance, RPO or cost proof.

## MC-002-INT-QA — OpenCode

- Owner: actual OpenCode independent QA; Codex intake, Claude conformance review. Priority P0. Status WAITING_APPROVAL_IMPLEMENTATION_AND_ENV.
- Trace: matrix row-level references to NFR-001/002/003/008/009 and applicable AC-134/135/140/147/153/156/158. Dependencies: selected/frozen contract, actual owner returns, exact diffs/heads and verified ENV.
- Scope: independently verify only applicable local integration rows; retain NOT_RUN and deferred reasons for product-auth/isolation/receipts/recovery cases. No matrix PASS based on a document review or owner narrative alone.
- Outputs/acceptance: expected versus observed assertions, status/body/header evidence, fixture/readback across restart as selected, outage/recovery/no false success, malformed requests, log/privacy/artifact/production-exclusion checks. Identify which checks QA executed versus owner-executed/reviewed. No synthetic identity accepted as product authorization proof.
- Tests/completion: record all actual commands/UI actions, UTC/exits, source and packet hashes, no sensitive values; independent findings and verdict with limitations. Supporting code changes need separate assignment and another reviewer. No unchanged-baseline reruns without a specific new reason.

## MC-002-INT-ARCH-CHECK / MC-002-INT-EVIDENCE

- Architecture conformance owner actual Claude Code; priority P0, reviewer OpenCode. WAITING_QA. Inputs: approved contracts/PO record, precise diffs and actual acceptance evidence. Output: per-boundary conformance/variance disposition, not PO approval or runtime replay. New material changes escalate.
- Evidence/intake owner Codex; priority P0, independent reviewer OpenCode. WAITING_QA_AND_CONFORMANCE. Trace all selected matrix IDs and task inputs/outputs; verify manifests, revisions, preserved baselines, redaction and exact resource disposition. Output: scoped local result and updated parent gates. Parent MC-002, C01-PRODUCT, full recovery, production Cloudflare and total cost remain OPEN unless separately evidenced and approved.

## Dispatch boundary

These are conditional assignments, not active manual handoffs. No ZCode/Antigravity engineering prompt is due for dispatch in Step02.3. After PO approval and ARCH-FINAL, Codex must create full copy-paste-ready manual prompts under the existing handoff protocol, containing approved exact contract, repository/base/allowed paths, tests, environment, reviewer and return schema. Current known direct-route limitations remain: ZCode packaged provider configuration missing; Antigravity headless RunCommand denied. No repair/auth/global permission workaround is authorized. Actual Claude/OpenCode document calls are tracked separately from future engineering execution.

Skipped: implementation, runtime/environment provisioning and all acceptance execution. Risk: task readiness is conditional on PO selection and finalized contracts; a prepared plan does not establish integration or security feasibility.
