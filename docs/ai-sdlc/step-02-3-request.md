# STEP 02.3 — MATTERCONTROL RUNTIME INTEGRATION, API & AUTH DECISION GATE

## 1. ROLE

Bạn là Codex, đảm nhiệm:

- Project Manager.
- Business Analyst.
- Cloud Engineer.
- DevOps Engineer.
- AI SDLC Orchestrator.

Bạn điều phối:

- Claude Code: Solution Architect, Architecture Decision Owner.
- ZCode: Go Backend Engineer.
- Antigravity: Next.js Frontend Engineer.
- OpenCode: Independent QA Engineer.

Mục tiêu hiện tại là **chốt phạm vi triển khai Integration/API/Auth cho MatterControl**, không phải tiếp tục sửa C01-NATIVE hoặc bắt đầu xây dựng sản phẩm.

## 2. CURRENT BASELINE

Product:

MatterControl — Control Plane for High-Stakes Legal Work.

Current workstream:

MC-002 — Solution Architecture & Technical Feasibility.

### Verified / Accepted According to Current Governance

- C01-NATIVE accepted at `52b60a4`.
- Verdict: PASS_WITH_LIMITATIONS.
- OpenCode closed F1/F5/F6, E-03 and F8.
- Owner evidence: 279 named pass events including parent tests and subtests.
- Zero failed tests.
- Zero named test skips.
- Codex independently ran F1 against committed head: PASS, without database.
- 16/16 exports matched their originals in the recorded integrity verification.
- Two invalid self-hash entries were preserved and covered by a separate verification manifest.
- Production source remained unchanged during R1.
- R01/R02 baselines and evidence preserved.

Governance commit range:

`13efdef → e377568`

### Still Open

- C01-PRODUCT.
- MC-002 overall.
- Integration/API/Auth decision.
- Product-level conformance.
- Full recovery validation.
- Cloudflare production feasibility.
- Total infrastructure cost verification.

No full-suite or database replay was performed in this latest closure.

Do not reinterpret C01-NATIVE acceptance as C01-PRODUCT acceptance.

Do not infer new execution results from review documents.

## 3. SOURCE OF TRUTH

First, inspect:

`docs/ai-sdlc/step-02-runtime-decision-request.md`

Also inspect:

- `docs/ai-sdlc/project-status.md`
- `docs/ai-sdlc/step-02-local-approval.md`
- `docs/reviews/step-02-c01-native-closure.md`
- `docs/reviews/step-02-c01-r1-opencode-review.md`
- Current approved architecture documents.
- Relevant ADRs.
- Approved PRD/SRS.
- API contracts.
- Authentication/authorization requirements.
- Backend/frontend technical PoC reports.
- Outstanding MC-002 task contracts and handoffs.

Use actual repository contents, not assumptions based on filenames.

Do not recreate previously closed findings.

## 4. TASK A — DECISION REQUEST ANALYSIS

Read the entire runtime decision request.

For each pending decision, identify:

1. Decision ID.
2. Exact question.
3. Why the decision is required.
4. Current approved baseline.
5. Available options.
6. Technical implications.
7. Product implications.
8. Security implications.
9. Integration implications.
10. Cloudflare implications.
11. Cost implications.
12. Dependencies.
13. Evidence available.
14. Evidence missing.
15. Recommended option.
16. Required approval owner.

Separate:

- Already approved decisions.
- Technical decisions Claude Code can own.
- Product/business decisions Codex can recommend.
- Material trade-offs requiring Product Owner approval.

Do not silently approve material changes.

## 5. TASK B — DEFINE THE MINIMUM INTEGRATION SCOPE

Propose the smallest meaningful end-to-end integration scope that validates the approved architecture.

Expected conceptual seam:

Next.js Frontend
→ REST API
→ Go Backend
→ Persistence.

Define:

- Integration objective.
- Participating services.
- Required API endpoints.
- Authentication requirements.
- Authorization behavior.
- Required database state.
- Error handling.
- Test fixtures.
- Expected responses.
- Observability requirements.
- Failure scenarios.

Use existing approved API contracts whenever available.

Do not introduce a new product feature merely to demonstrate connectivity.

If temporary PoC endpoints or fixtures are necessary:

- Isolate them.
- Document why they are required.
- Prevent accidental production exposure.
- Define removal or retention conditions.

Do not turn the integration PoC into full MatterControl implementation.

## 6. TASK C — API CONTRACT DECISION

Claude Code is the architecture owner.

Coordinate a focused API-contract review covering:

- Resource boundaries.
- Frontend/backend communication.
- Request/response contracts.
- Error classification.
- Unavailable-state behavior where relevant.
- Authentication integration.
- Authorization enforcement.
- Request validation.
- Correlation/traceability.
- API versioning assumptions.
- CORS and origin policy.
- Idempotency/concurrency needs for the selected seam.

Distinguish:

1. Existing backend-template contracts.
2. Approved MatterControl product contracts.
3. Temporary integration-test contracts.
4. Future P0 feature contracts.

Do not claim product-level compliance based solely on native backend template behavior.

Do not change the accepted C01-NATIVE behavior without a new documented defect or approved architecture change.

## 7. TASK D — AUTHENTICATION & AUTHORIZATION DECISION

Review approved requirements for:

- Authenticated users.
- Workspace access.
- Matter membership.
- OWNER / EDITOR / VIEWER.
- Workspace and Matter isolation.
- Sensitive legal data.
- API authorization.
- Evidence access.
- Auditability.

Determine the minimal auth scope needed for the integration milestone.

Explicitly distinguish:

### Authentication

Who is making the request?

### Authorization

What is that user allowed to access or modify?

### Tenant / Matter Isolation

Which workspace and Matter resources are accessible?

### Local Integration Test Identity

How are synthetic test identities created and used?

Do not treat a successful authenticated request as proof of correct authorization.

Do not use hardcoded demo tokens or bypassed permissions as evidence of production security.

If a temporary local-only auth mechanism is proposed, label it clearly as non-production and define its limitations.

Do not build enterprise SSO or IAM during Step 02.

## 8. TASK E — C01-PRODUCT BOUNDARY

Determine the precise relationship between:

- Accepted C01-NATIVE behavior.
- Unresolved C01-PRODUCT.
- Approved API/Auth contracts.
- Integration acceptance criteria.

Use the existing decision request and Claude Code's architecture disposition.

Do not infer requirements from the C01-PRODUCT label alone.

Clarify:

- What native behavior is already proven.
- What product behavior is still required.
- What is not testable without product implementation.
- What can be validated through the minimum integration seam.
- What should remain assigned to later product implementation milestones.

Do not close C01-PRODUCT without actual product-level evidence.

Do not unnecessarily force full P0 implementation into the architecture PoC.

## 9. TASK F — AGENT RESPONSIBILITY & HANDOFF

Codex must assign:

### Claude Code

- Architecture decision analysis.
- API/Auth design recommendation.
- Security boundary review.
- ADR updates when approved.

### ZCode

- Backend feasibility of the selected seam.
- Minimal API/Auth implementation task, only after approval.
- Focused integration tests.

### Antigravity

- Frontend integration feasibility.
- API client/auth integration task, only after approval.
- Local frontend integration validation.

### OpenCode

- Independent contract/testability review.
- API negative test design.
- Auth/authorization scenarios.
- Integration acceptance criteria.
- Independent verification of later execution.

### Codex

- Decision coordination.
- Task sequencing.
- Local infrastructure.
- DevOps.
- Test environment governance.
- Risk/approval tracking.

If agents cannot be invoked directly, prepare structured handoffs.

For any handoff requiring manual dispatch, provide a complete copy-paste-ready agent prompt in the final report.

Do not mark PREPARED as EXECUTED.

## 10. TASK G — RECOMMENDED DECISION PACKAGE

Produce a decision package that allows Product Owner to choose without needing to interpret low-level code.

For each material decision:

### Decision

What must be decided?

### Current Baseline

What is already approved?

### Options

Present technically viable options grounded in actual evidence.

### Recommendation

Choose one option and explain why.

### Benefits

What does this option enable?

### Trade-offs

What complexity or limitations does it introduce?

### Impact

Assess:

- Product behavior.
- API architecture.
- Auth/security.
- Implementation scope.
- Local PoC.
- Cloudflare deployment.
- Cost.

### Risk

What could fail?

### Validation

How will the decision be verified?

### Approval

Who needs to approve it?

Do not manufacture options just to make a comparison appear complete.

If existing decisions already settle an issue, preserve them.

## 11. TASK H — PROPOSE IMPLEMENTATION ORDER

After decisions are approved, the expected workflow should be:

1. Claude Code finalizes API/Auth architecture contracts.
2. Codex creates implementation task contracts.
3. ZCode implements the approved backend integration seam.
4. Antigravity implements the approved frontend integration seam.
5. Codex prepares isolated local infrastructure.
6. OpenCode independently verifies API/Auth/integration behavior.
7. Claude Code reviews architecture conformance.
8. Codex collects evidence and updates MC-002 status.

Parallel execution is allowed where dependencies permit.

Do not implement those tasks before the required decisions are approved.

## 12. TEST ACCEPTANCE PLAN

OpenCode should define an evidence-based verification matrix covering, as applicable:

- Valid authenticated request.
- Missing authentication.
- Invalid/expired credentials.
- Unauthorized workspace access.
- Unauthorized Matter access.
- Insufficient role permissions.
- Malformed request.
- Unavailable backend.
- Correct API error response.
- Frontend/backend compatibility.
- Persistence connectivity.
- No sensitive data leaked into logs.

Do not claim these tests have passed.

This step produces the test plan, not test execution results.

## 13. CLOUDFLARE & COST BOUNDARY

The integration decision must not assume Cloudflare production feasibility.

Preserve:

- Go backend direction.
- Next.js frontend direction.
- Approved persistence architecture.
- Cloudflare Free Tier goal.
- Target $0/month infrastructure within verified workload constraints.

Distinguish:

- Local architecture compatibility.
- Local integration feasibility.
- Cloudflare runtime compatibility.
- Production deployment feasibility.
- Total cost verification.

A local integration PASS does not prove Cloudflare production viability.

If a decision has material impact on hosting or costs, escalate it for Product Owner approval.

## 14. REQUIRED ARTIFACTS

Update existing files where appropriate:

- `docs/ai-sdlc/step-02-runtime-decision-request.md`
- `docs/ai-sdlc/project-status.md`
- `docs/ai-sdlc/risk-register.md`
- `docs/implementation/agent-handoffs.md`
- Relevant architecture ADRs.

Create only if not already covered:

- `docs/architecture/integration-scope-proposal.md`
- `docs/architecture/api-auth-decision-analysis.md`
- `docs/testing/integration-acceptance-matrix.md`
- `docs/implementation/step-02-integration-task-plan.md`
- `docs/ai-sdlc/step-02-decision-package.md`

Avoid documentation duplication.

Preserve accepted C01-NATIVE and R01/R02 review evidence.

## 15. QUALITY GATE

STEP 02.3 succeeds when:

- Existing runtime decision request has been analyzed.
- Already approved choices are preserved.
- Remaining decisions are identified.
- Claude Code architecture ownership is respected.
- Minimum integration scope is proposed.
- API/Auth boundaries are documented.
- C01-PRODUCT boundaries are explicit.
- QA acceptance plan is defined.
- Agent assignments are ready.
- Material trade-offs have recommendations.
- Product Owner has a clear approval package.

STEP 02.3 completion does NOT imply:

- Integration tests passed.
- C01-PRODUCT closed.
- MC-002 completed.
- Cloudflare deployment feasible.
- $0/month cost proven.

## 16. REQUIRED FINAL OUTPUT

Report:

1. Current accepted baseline.
2. Runtime decision request analysis.
3. Existing approvals vs outstanding decisions.
4. Recommended minimum integration scope.
5. API contract boundaries.
6. Authentication/authorization boundaries.
7. C01-PRODUCT classification.
8. Claude Code architecture review status.
9. Proposed ZCode/Antigravity/OpenCode tasks.
10. Integration test acceptance matrix.
11. Cloudflare/cost implications.
12. Decision package requiring Product Owner approval.
13. Current MC-002 status.
14. Exact next action after approval.

If Claude Code cannot be called directly and a technical architecture decision is pending, generate a complete copy-paste-ready Claude Code review prompt.

## 17. STOP CONDITION

Do NOT:

- Reopen C01-NATIVE without new evidence.
- Replay the full backend test suite unnecessarily.
- Run database or integration tests merely as part of decision preparation.
- Implement new backend/frontend product features.
- Implement the integration seam before approval.
- Begin STEP 03 OpenDesign.
- Deploy production.
- Claim Cloudflare/$0 feasibility without evidence.
- Mark MC-002 DONE.

Stop at the **Integration/API/Auth Decision Approval Gate**.

## FINAL DIRECTIVE

**Preserve verified work. Resolve architectural decisions before implementation.**

Codex orchestrates.

Claude Code owns Solution Architecture.

ZCode implements backend.

Antigravity implements frontend.

OpenCode verifies independently.

MatterControl must remain a reliable system of operational truth for high-stakes legal work.