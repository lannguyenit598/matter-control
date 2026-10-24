# STEP 02.2 — MATTERCONTROL MC-002 C01 REMEDIATION & REMAINING TECHNICAL VALIDATION

## 1. ROLE

Bạn là Codex, đảm nhiệm:

- Project Manager.
- Business Analyst.
- Cloud Engineer.
- DevOps Engineer.
- AI SDLC Orchestrator.

Agent ownership:

- Claude Code: Solution Architect & Architecture Reviewer.
- ZCode: Go Backend Engineer.
- Antigravity: Next.js Frontend Engineer.
- OpenCode: Independent QA & Technical Verification.
- OpenDesign: Product UI/UX Designer — chưa bắt đầu Step 03.

Bạn chịu trách nhiệm điều phối và nghiệm thu, không thay thế các engineering agents.

## 2. CURRENT VERIFIED STATUS

Product:

**MatterControl — Control Plane for High-Stakes Legal Work**

Current task:

`MC-002 — Solution Architecture & Technical Feasibility`

Latest reported governance commits:

`74fbdec → f0f82a6`

Reported evidence:

- R01: PASS/CLOSED.
- R02: PASS/CLOSED.
- OpenCode independent evidence review: PASS_WITH_LIMITATIONS.
- 880 valid JSONL events.
- 205 named terminal pass events, including parent tests/subtests.
- 0 fail.
- 0 named test skip.
- 5 package-level no-test-files skip events.
- Four invalid-config/migration cases exited 1 as expected.
- 18 exported files matched their originals in the recorded integrity check.
- 17 manifest payload hashes matched.
- Backend source/binary unchanged.
- Containers stopped.
- MC-002-BE remains IN_REVIEW.
- MC-002 remains OPEN.

Known unresolved work:

1. C01 — Claude Code's existing 500→503 unavailable mapping disposition.
2. Backend characterization/acceptance activities not yet complete.
3. Frontend PoC status requires verification.
4. Frontend–backend integration PoC not complete.
5. Cloudflare production feasibility not demonstrated.
6. Infrastructure $0/month not verified.
7. Remaining recovery/restore validation must be checked against approved gates.

Verify these statuses from repository evidence before taking action.

Do not infer work is complete because it appears in a summary.

## 3. FIRST ACTION — PRESERVE CLOSED EVIDENCE

Read:

- `docs/reviews/step-02-backend-r01-r02-closure.md`
- `docs/reviews/step-02-backend-r01-r02-opencode.md`
- `docs/ai-sdlc/project-status.md`
- `docs/ai-sdlc/step-02-local-approval.md`
- Relevant Claude Code architecture reviews and ADRs.
- Current backend/frontend handoffs.
- Relevant technical PoC records.
- Current Git status.

Do not rerun R01/R02 merely for reassurance.

Do not reopen CLOSED findings without a new defect or evidence contradiction.

Preserve the distinction:

- Artifact verification.
- Runtime execution.
- Independent review.
- Architecture approval.
- Product conformance.

Do not describe OpenCode's packet-only review as a runtime replay.

Do not describe the 205 named pass events as 205 independent leaf test cases.

## 4. TASK A — C01 REQUIREMENTS & ARCHITECTURE INTAKE

Locate Claude Code's original C01 disposition.

C01 concerns unavailable/error handling, including an existing 500→503 classification.

Before assigning implementation:

1. Read the exact finding.
2. Identify the affected endpoint(s), execution path and contract.
3. Identify the expected unavailable behavior.
4. Determine when HTTP 503 is required.
5. Determine when HTTP 500 or other statuses must remain unchanged.
6. Identify error response contract requirements.
7. Identify relevant readiness, health or migration behavior if actually implicated.
8. Identify tests needed to prove the fix.
9. Verify the finding remains applicable to the current source.
10. Record the architecture authority for the decision.

Do not blindly replace HTTP 500 with HTTP 503 globally.

Do not invent error classifications missing from the approved contract.

If the original C01 disposition is ambiguous or unavailable, request Claude Code architecture clarification before implementation.

## 5. TASK B — DISPATCH C01 TO ZCODE

ZCode is the implementation owner for C01.

Prepare an actionable task contract:

`MC-002-BE-C01`

Include:

- Actual repository/worktree location.
- Baseline commit.
- Relevant source files.
- Original Claude Code C01 disposition.
- Exact expected behavior.
- Scope of changes.
- Regression tests.
- Compatibility constraints.
- Expected output artifacts.
- Review owner.
- Acceptance criteria.

### If ZCode Can Be Invoked Directly

Dispatch the task.

Collect execution evidence.

Record:

- Agent invocation.
- Branch/worktree.
- Changed files.
- Commit.
- Tests executed.
- Exit codes.
- Findings.

### If ZCode Cannot Be Invoked Directly

Create:

`docs/implementation/handoffs/MC-002-BE-C01-ZCODE-PROMPT.md`

This file must contain a COMPLETE, COPY-PASTE-READY prompt for ZCode.

Print the full prompt in your final response so the Product Owner can paste it directly into ZCode.

The prompt must tell ZCode to:

1. Read the approved C01 disposition.
2. Inspect actual backend code.
3. Implement the smallest correct fix.
4. Add focused regression tests.
5. Verify expected unavailable responses.
6. Verify normal error handling is unchanged.
7. Run relevant tests.
8. Capture commands, exits and logs.
9. Avoid altering unrelated R01/R02 behavior.
10. Return a structured handoff report.

Mark task `WAITING_MANUAL_DISPATCH`, not EXECUTED.

## 6. TASK C — INDEPENDENT C01 VERIFICATION

After ZCode returns actual implementation evidence, assign OpenCode to review C01.

Required verification:

- C01 acceptance criteria.
- Correct HTTP status.
- Response contract.
- Non-regression of unrelated errors.
- Relevant automated tests.
- Source diff.
- Test evidence.
- No unauthorized architecture changes.

OpenCode must not simply accept the ZCode conclusion.

Independent review should be based on actual artifacts, and runtime verification should be performed where feasible and approved.

If OpenCode is unavailable, create a complete manual review prompt.

Do not mark C01 CLOSED without appropriate implementation and verification evidence.

Claude Code must review architecture-impacting deviations.

## 7. TASK D — FRONTEND POC STATUS

Determine the exact state of the Antigravity frontend audit/PoC.

Classify:

- NOT_PREPARED.
- PREPARED.
- WAITING_MANUAL_DISPATCH.
- EXECUTED.
- VERIFIED.
- BLOCKED.

Check whether the following have actual evidence:

- Next.js repository audit.
- Dependency installation.
- Typecheck.
- Lint.
- Existing tests.
- Production build.
- Local startup.
- Basic route smoke test.
- Environment configuration.
- Cloudflare runtime compatibility assessment.

Do not assume the frontend PoC is complete.

### If Antigravity Has Not Executed

Create or update:

`docs/implementation/handoffs/MC-002-FE-ANTIGRAVITY-PROMPT.md`

Include a complete executable prompt using actual repository paths and approved technical contracts.

Print the full prompt for manual copy/paste if direct orchestration is unavailable.

Do not implement MatterControl product screens during Step 02.

## 8. TASK E — LOCAL INTEGRATION POC

Only when backend and frontend prerequisites are satisfied, prepare or execute the approved local integration PoC.

Target:

Next.js
→ REST API
→ Go Backend
→ PostgreSQL.

Validate:

- Local startup.
- Configuration.
- API reachability.
- Backend/frontend connectivity.
- PostgreSQL persistence.
- Existing endpoint behavior.
- Expected error mapping.
- Minimal integration smoke tests.

Use isolated synthetic data.

Do not change approved architecture.

Do not execute destructive migrations against existing databases.

Do not delete existing Docker volumes.

If prerequisites are missing, create a dependency-aware execution plan and mark integration PENDING.

Do not claim integration PASS from separate frontend/backend builds.

## 9. TASK F — RESTORE & RECOVERY GATE

Read the approved decisions for:

- H5 local.
- W1.
- RPO target: 24 hours.
- RTO target: 8 hours.
- ARCH-Q3/Q5.

Do not infer meaning from decision IDs alone.

Check whether a restore drill has actual evidence.

If still pending, coordinate the approved safe drill using:

- Isolated PostgreSQL test instance.
- Synthetic data.
- Documented backup procedure.
- Disposable restore target.
- Integrity verification.
- Actual recovery duration.
- Resource cleanup.

Distinguish restore drill success from proof of production recovery objectives.

Do not overwrite databases or delete Docker volumes containing important data.

## 10. TASK G — CLOUDFLARE PRODUCTION FEASIBILITY

Codex owns Cloud Engineering and DevOps.

Claude Code owns architecture decisions.

Continue investigating:

- Go/Echo runtime suitability.
- PostgreSQL hosting and connectivity.
- Next.js Cloudflare runtime/build compatibility.
- Cloudflare Workers/Pages.
- Storage requirements.
- Secrets.
- Runtime and resource quotas.
- Operational constraints.
- Free Tier limitations.
- Backup/recovery.
- Cost.

Use current official technical/pricing documentation when available.

Otherwise mark relevant claims UNVERIFIED.

Do not infer Cloudflare compatibility from Docker local tests.

Do not infer $0/month infrastructure from passing unit tests.

Do not silently replace Go/PostgreSQL or enable paid services.

If a hard conflict remains, prepare an Architecture Decision Request with alternatives and trade-offs for Product Owner approval.

## 11. TASK H — QUALITY GATE EVALUATION

Evaluate MC-002 across independent workstreams.

Create a status matrix:

| Workstream | Owner | Status | Evidence | Blocker |
|---|---|---|---|---|
| Architecture | Claude Code | Actual status | References | Risks |
| Backend R01 | ZCode/OpenCode | CLOSED | Evidence | None unless new defect |
| Backend R02 | ZCode/OpenCode | CLOSED | Evidence | None unless new defect |
| Backend C01 | ZCode/OpenCode | Actual status | Evidence | Risks |
| Frontend PoC | Antigravity | Actual status | Evidence | Risks |
| Local Integration | Assigned owners | Actual status | Evidence | Risks |
| Restore Drill | Codex/OpenCode | Actual status | Evidence | Risks |
| Cloudflare Feasibility | Codex/Claude | Actual status | Evidence | Risks |
| Free Tier Cost | Codex | Actual status | Evidence | Risks |

Do not mark the entire MC-002 task DONE when only R01/R02 are closed.

## 12. REQUIRED ARTIFACTS

Update appropriate existing files:

- `docs/ai-sdlc/project-status.md`
- `docs/ai-sdlc/risk-register.md`
- `docs/implementation/agent-handoffs.md`
- `docs/architecture/technical-poc.md`
- `docs/architecture/cloudflare-feasibility.md`
- `docs/deployment/free-tier-budget.md`

Create as needed:

- `docs/implementation/handoffs/MC-002-BE-C01-ZCODE-PROMPT.md`
- `docs/implementation/handoffs/MC-002-FE-ANTIGRAVITY-PROMPT.md`
- `docs/testing/step-02-c01-verification.md`
- `docs/testing/step-02-integration-poc.md`
- `docs/ai-sdlc/step-02-remaining-gates.md`

Avoid duplicating existing artifacts.

## 13. REQUIRED FINAL RESPONSE

Report in this exact order:

### 1. Confirmed Current Status

Summarize R01/R02 closure and remaining MC-002 work.

### 2. C01 Disposition

Show the exact approved behavior, implementation owner and action status.

### 3. Agent Dispatch

For ZCode, Antigravity and OpenCode:

- Availability.
- Direct invocation possible?
- Prepared/Dispatched/Executed/Verified.
- Handoff references.

### 4. COPY-PASTE AGENT PROMPTS

If direct invocation is unavailable, include the FULL prompts for whichever agents require manual dispatch.

Do not return file paths alone.

### 5. Technical Evidence

Show only genuinely executed commands/tests, actual results and references.

### 6. Remaining Quality Gates

Report backend, frontend, integration, restore, Cloudflare and cost independently.

### 7. Exact Next Action

State which prompt must be pasted into which agent next, or what Codex will do next based on actual task dependencies.

## 14. STOP CONDITIONS

Do not restart R01/R02 without new evidence.

Do not implement full MatterControl product features.

Do not start OpenDesign STEP 03.

Do not deploy production.

Do not enable paid services.

Do not change approved architecture without Claude Code review and required approval.

Do not declare MC-002 DONE unless all mandatory Step 02 quality gates are met.

If agent handoff is necessary, prepare complete ready-to-paste prompts and stop at the appropriate handoff boundary.

## FINAL DIRECTIVE

**Preserve completed evidence. Resolve C01 precisely. Validate frontend and integration independently. Keep production feasibility and cost as separate gates.**

Codex orchestrates and owns Cloud/DevOps.

Claude Code architects.

ZCode implements backend changes.

Antigravity validates frontend.

OpenCode verifies independently.

Report actual execution, not intended execution.