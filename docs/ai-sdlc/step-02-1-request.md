# STEP 02.1 — MATTERCONTROL TECHNICAL POC, AGENT RECOVERY & FEASIBILITY VALIDATION

## 1. ROLE

Bạn là Codex với các vai trò:

- Project Manager.
- Business Analyst.
- Cloud Engineer.
- DevOps Engineer.
- AI SDLC Orchestrator.

Bạn chịu trách nhiệm tiếp tục task MC-002, điều phối technical audits, triển khai các PoC đã được phê duyệt, xác minh evidence và quản lý Architecture Quality Gate.

Agent ownership:

- Claude Code: Solution Architect & Architecture Reviewer.
- ZCode: Go Backend Engineer / Backend Technical Feasibility.
- Antigravity: Next.js Frontend Engineer / Frontend Technical Feasibility.
- OpenCode: Independent QA & PoC Verification.
- OpenDesign: Design Authority — chưa bắt đầu high-fidelity design.

## 2. CURRENT STATUS — DO NOT RESTART

Product:

**MatterControl — Control Plane for High-Stakes Legal Work**

Current task:

MC-002 — Solution Architecture & Technical Feasibility.

Theo báo cáo gần nhất:

- Local commit range: `8521c2a → 2000d94`.
- Working tree clean.
- H5 local approved.
- W1 approved.
- Restore test objectives: RPO 24h / RTO 8h.
- ARCH-Q3/Q5 decisions recorded.
- Docker Engine 29.8.2 available.
- Docker Compose 5.6.0 available.
- Architecture reviewed.
- Requirements unchanged.
- Technical PoC not executed.
- Build not executed.
- Restore drill not executed.
- ZCode/Antigravity require official installation recovery and provenance verification.
- Production feasibility not demonstrated.
- Cloudflare $0/month not verified.
- STEP 02 NOT DONE.

Read the actual repository to confirm current status.

Important document:

`docs/ai-sdlc/step-02-local-approval.md`

Do not interpret H5, W1 or ARCH-Q3/Q5 from their IDs alone. Read their approved definitions in the repository.

Do not restart Solution Architecture from scratch.

## 3. OBJECTIVE

Complete the next technically executable part of Step 02:

1. Recover or establish trusted agent availability.
2. Determine whether Codex can invoke ZCode and Antigravity.
3. Prepare direct or manual agent handoffs.
4. Conduct repository audits.
5. Execute approved local technical PoCs.
6. Validate build and runtime compatibility.
7. Conduct a safe backup/restore drill.
8. Collect independent verification evidence.
9. Update technical risks and architecture gate status.
10. Prepare the remaining Cloudflare feasibility decisions.

Do not implement full MatterControl business features.

## 4. TASK A — VERIFY REPOSITORY & APPROVAL BASELINE

Inspect:

- Project status.
- Step 02 approval documents.
- Approved ADRs.
- Architecture artifacts.
- Requirements baseline.
- Backend/frontend template audit status.
- Current Git history.
- Working tree.
- Existing Docker configuration.
- Environment setup.
- PoC tasks and quality gates.

Determine what is already:

- APPROVED.
- IMPLEMENTED.
- VERIFIED.
- PENDING.
- BLOCKED.

Do not repeat completed work without a concrete reason.

## 5. TASK B — ZCODE & ANTIGRAVITY RECOVERY

Verify whether ZCode and Antigravity are available in the current environment.

For each agent:

1. Check installation availability.
2. Check the actual execution/integration method.
3. Identify official publisher and distribution source.
4. Verify software provenance.
5. Verify release checksums or digital signatures when trustworthy publisher-provided verification material exists.
6. Check required permissions.
7. Check workspace/Git access.
8. Confirm whether Codex can dispatch tasks directly.
9. Record verification evidence.

Do not invent official download URLs, signatures or publisher identities.

Do not treat a locally generated checksum as independent verification of a downloaded package.

If official provenance cannot be established, do not install or execute the package.

If installation requires elevated permissions, external credentials, security exceptions or material system changes, request explicit authorization before proceeding.

Do not bypass OS security controls.

### IMPORTANT — ORCHESTRATION FALLBACK

If Codex CANNOT directly invoke ZCode or Antigravity:

DO NOT impersonate those agents.

DO NOT take ownership of their engineering tasks.

Instead, create complete, copy-paste-ready prompts for the Product Owner to execute manually in each agent.

Create:

`docs/implementation/handoffs/MC-002-ZCODE-PROMPT.md`

`docs/implementation/handoffs/MC-002-ANTIGRAVITY-PROMPT.md`

Each prompt must include:

- Agent role.
- Project context.
- Exact working directory/repositories.
- Approved architecture references.
- Assigned task scope.
- Input files.
- Technical audit checklist.
- PoC scope.
- Expected commands/tests.
- Safety constraints.
- Expected output artifacts.
- Acceptance criteria.
- Handoff-back instructions.

Use real repository paths and actual source code findings.

Avoid generic instructions that require the receiving agent to guess the task.

The prompts must be independently executable after the corresponding tools are safely available.

### REQUIRED HUMAN HANDOFF

If manual dispatch is required, Codex must print the FULL prompts directly in its final response under separate headings:

1. PROMPT FOR ZCODE — COPY AND PASTE.
2. PROMPT FOR ANTIGRAVITY — COPY AND PASTE.

Do not provide file paths alone.

The user must be able to copy the complete prompt directly from Codex's response into the respective agent.

Mark tasks:

`PREPARED / WAITING_MANUAL_DISPATCH`

not EXECUTED.

## 6. TASK C — ZCODE BACKEND AUDIT & POC

ZCode owns backend technical validation.

Audit:

- Go version.
- HTTP framework.
- Hexagonal architecture structure.
- Domain/application boundaries.
- Ports/adapters.
- PostgreSQL dependencies.
- Database migrations.
- Authentication foundation.
- Backend test tooling.
- OpenAPI/API contracts.
- Docker compatibility.
- Runtime configuration.
- Build reproducibility.

### Required Backend PoC

Use the approved local architecture.

Validate:

1. Backend dependency resolution.
2. Go build.
3. Existing backend tests.
4. Container build if approved configuration supports it.
5. Application startup.
6. PostgreSQL connection.
7. Migration execution on isolated test database.
8. Minimal health/API request.
9. Runtime failure behavior.
10. Environment variable handling.

Do not invent test results.

Use isolated development/test data.

Do not modify actual client/legal data.

Do not redesign the domain model unless the audit reveals a concrete blocker; escalate architectural changes to Claude Code.

## 7. TASK D — ANTIGRAVITY FRONTEND AUDIT & POC

Antigravity owns frontend technical validation.

Audit:

- Next.js version.
- React version.
- TypeScript setup.
- Atomic Design structure.
- Routing strategy.
- SSR/static rendering.
- API integration.
- Environment variables.
- Existing Storybook/test configuration.
- Build scripts.
- Package dependencies.
- Cloudflare runtime compatibility assumptions.

### Required Frontend PoC

Validate:

1. Dependency installation.
2. Typecheck.
3. Lint.
4. Existing tests.
5. Production build.
6. Local application startup.
7. Basic routing.
8. Backend connectivity where an approved test endpoint exists.
9. Environment configuration.
10. Deployment adapter/runtime limitations.

Do not design MatterControl screens.

Do not implement Control Room or Operational Grid yet.

Do not silently modify the approved frontend stack to satisfy Cloudflare.

## 8. TASK E — SAFE LOCAL INTEGRATION POC

After the required individual PoCs succeed, Codex coordinates a minimal integration test.

Expected conceptual flow:

Next.js Frontend
→ REST API
→ Go Backend
→ PostgreSQL.

Validate:

- Local startup.
- Configuration consistency.
- API reachability.
- Container networking if used.
- Test database persistence.
- Error handling.
- Shutdown/restart behavior.

Use existing endpoints or minimal test scaffolding approved for the PoC.

Do not implement actual MatterControl features.

If the test requires code changes, use dedicated branches/worktrees and record them.

## 9. TASK F — BACKUP & RESTORE DRILL

The following objectives were approved:

- RPO target: 24 hours.
- RTO target: 8 hours.

Do not claim these objectives have been achieved without evidence.

Codex owns DevOps execution planning.

OpenCode verifies the results.

Use:

- Synthetic data.
- Isolated test database.
- Disposable local environment.
- Approved backup procedure.

### Restore Drill

1. Confirm backup source.
2. Verify backup integrity.
3. Prepare isolated restore target.
4. Restore the data.
5. Run integrity checks.
6. Verify representative records.
7. Record actual elapsed time.
8. Document failure/recovery behavior.
9. Record the restore result.
10. Identify unresolved recovery risks.

Assess RPO using the actual backup cadence, recovery-point characteristics and available evidence.

Assess RTO using measured recovery duration and documented operational steps.

A successful single restore drill does not automatically prove all future production recovery conditions.

Never overwrite a development or production database containing important data.

Never delete an existing Docker volume without explicit approval.

## 10. TASK G — INDEPENDENT VERIFICATION

OpenCode must independently review:

- Backend PoC evidence.
- Frontend PoC evidence.
- Integration results.
- Build/test outputs.
- Restore procedure and results.
- Missing tests.
- Technical blockers.
- Unsupported assumptions.

If OpenCode cannot be invoked directly:

Create a complete manual QA prompt and review handoff.

Do not mark independent review DONE based solely on Codex's own checks.

Claude Code reviews architecture-impacting findings and ADR changes.

## 11. TASK H — CLOUDFLARE FEASIBILITY

Codex continues Cloud Engineering feasibility analysis.

Assess the approved architecture against:

- Go runtime constraints.
- PostgreSQL hosting/connectivity.
- Next.js deployment compatibility.
- Cloudflare Workers/Pages options.
- Persistent storage.
- Free Tier quotas.
- Security requirements.
- Operational recovery.
- Estimated resource usage.

Use current official documentation when accessible.

If official limits, pricing or runtime details cannot be verified, mark them UNVERIFIED.

Distinguish:

- LOCAL_POC_PASSED.
- PRODUCTION_FEASIBILITY_CONFIRMED.
- COST_VERIFIED.

These are separate evidence states.

Do not infer production feasibility from Docker Compose success.

Do not infer $0/month infrastructure from local development success.

Do not silently replace Go/PostgreSQL or approve a paid solution.

## 12. REQUIRED ARTIFACTS

Create or update appropriate files:

`docs/ai-sdlc/project-status.md`

`docs/ai-sdlc/risk-register.md`

`docs/implementation/agent-handoffs.md`

`docs/implementation/handoffs/MC-002-ZCODE-PROMPT.md`

`docs/implementation/handoffs/MC-002-ANTIGRAVITY-PROMPT.md`

`docs/architecture/backend-audit.md`

`docs/architecture/frontend-audit.md`

`docs/architecture/technical-poc.md`

`docs/architecture/cloudflare-feasibility.md`

`docs/testing/step-02-poc-validation.md`

`docs/deployment/local-backup-restore.md`

`docs/deployment/free-tier-budget.md`

`docs/ai-sdlc/step-02-execution-report.md`

Adapt filenames to existing repository conventions and avoid unnecessary duplication.

## 13. QUALITY GATE

Step 02 can only be marked DONE when:

- Required architecture deliverables exist.
- Architecture review completed.
- Required repository audits completed.
- Technical PoCs executed with evidence.
- Independent validation completed.
- Critical technical blockers addressed.
- Restore drill completed or explicitly resolved by an approved decision.
- Cloudflare deployment architecture has a defensible feasibility decision.
- Material cost assumptions documented and verified to the extent required by the approved gate.
- Product Owner approvals recorded where needed.

Do not treat a successful local PoC as proof of Cloudflare production compatibility.

If production feasibility remains unresolved, preserve the actual blocker and keep Step 02 open according to the approved Quality Gate.

## 14. FINAL RESPONSE FORMAT

Report:

### A. Current Status

- Completed.
- In Progress.
- Blocked.
- Pending Approval.

### B. Agent Availability

For each agent:

- Installed?
- Provenance verified?
- Direct invocation available?
- Actual execution status?

### C. Technical PoC

- Backend.
- Frontend.
- Integration.
- Backup/restore.

Include commands, exit codes, logs and artifact references when tests actually ran.

### D. Architecture & Cloudflare

- Architecture findings.
- Cloudflare feasibility.
- Cost verification.
- Remaining blockers.

### E. Manual Agent Prompts

If direct invocation fails, include the FULL ZCode and Antigravity prompts in your response for manual copy/paste.

### F. Next Actions

Show exactly:

1. What I need to paste into ZCode.
2. What I need to paste into Antigravity.
3. What files/results those agents must return.
4. What to do when both handoffs are complete.
5. Current Step 02 Quality Gate status.

## 15. STOP CONDITION

Do not implement full product features.

Do not start OpenDesign Step 03.

Do not deploy production.

Do not enable paid services.

Do not claim agent execution without evidence.

If manual dispatch is required, stop after preparing the complete agent prompts and all independent Codex work that can be performed safely without them.

Wait for agent results to be returned through the normal workflow.

## FINAL DIRECTIVE

**Codex orchestrates and owns Cloud/DevOps. Claude Code architects. ZCode validates backend. Antigravity validates frontend. OpenCode verifies independently.**

If direct agent orchestration is unavailable, provide ready-to-paste task prompts rather than pretending the agents have executed.

Preserve MatterControl architecture, legal domain requirements and approved technical decisions.