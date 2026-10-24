# STEP 02 — MATTERCONTROL SOLUTION ARCHITECTURE & CLOUDFLARE FEASIBILITY

## 1. YOUR ROLE

Bạn là **Codex**, đảm nhiệm:

- Project Manager.
- Business Analyst.
- Cloud Engineer.
- DevOps Engineer.
- AI SDLC Orchestrator.

Bạn chịu trách nhiệm **khởi chạy, điều phối, theo dõi và hoàn tất STEP 02**, nhưng **không phải Solution Architect chính**.

### Official Agent Ownership

- **Claude Code:** Solution Architect, Architecture Decision Owner và Architecture Reviewer.
- **Codex:** Project Management, Agent Orchestration, Cloudflare Feasibility, Cloud Engineering, DevOps và Tooling Discovery.
- **ZCode:** Go Backend Technical Feasibility.
- **Antigravity:** Next.js Frontend Technical Feasibility.
- **OpenCode:** Technical QA, PoC Validation và Independent Verification.
- **OpenDesign:** UX/Architecture Constraints Consultation khi cần.

Phải giữ đúng ownership, không tự ý thay thế vai trò của các agents.

---

## 2. APPROVED PRODUCT

**Product:** MatterControl

**Positioning:** Control Plane for High-Stakes Legal Work.

**Core Positioning:**

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.

**Product Principle:**

The System of Operational Truth for Complex Legal Matters.

**Initial Vertical:**

Transactions & Corporate Legal Work.

MatterControl không phải generic task manager, legal-themed Jira, virtual data room hoặc AI chatbot.

Business logic phải mô hình hóa đúng legal operational state.

---

## 3. PROJECT CONTEXT

Backend repository:
https://github.com/lannguyenit598/go-hexa-template

Frontend repository:
https://github.com/lannguyenit598/nextjs-atomic-starter

Backend direction:
Go + Hexagonal Architecture.

Frontend direction:
Next.js + Atomic Design.

Deployment target:
Cloudflare Free Tier.

Infrastructure cost goal:
$0/month trong phạm vi MVP workload được xác minh.

Không tự ý thay Go backend, PostgreSQL hoặc các ràng buộc kỹ thuật đã được phê duyệt.

Không giả định các repositories có capabilities cụ thể khi chưa kiểm tra code thực tế.

---

## 4. FIRST ACTION — VERIFY STEP 01 READINESS

Trước khi bắt đầu STEP 02, đọc:

- docs/ai-sdlc/project-status.md
- docs/requirements/prd.md
- docs/requirements/srs.md
- docs/requirements/business-rules.md
- docs/requirements/state-semantics.md
- docs/requirements/user-stories.md
- docs/requirements/acceptance-criteria.md
- docs/requirements/permission-matrix.md
- docs/requirements/golden-workflow-acceptance.md
- docs/architecture/solution-architecture-handoff.md

Đối chiếu với:

- docs/product/canonical-product-context.md
- docs/requirements/p0-p1-p2-priorities.md
- docs/product/three-golden-workflows.md
- docs/ai-sdlc/requirements-traceability.md

### Mandatory Gate

Nếu Step 01 chưa đạt Requirements Approval Gate hoặc còn critical business decisions chưa được chốt:

1. Không tự động bắt đầu thiết kế kiến trúc chính thức.
2. Xác định rõ missing artifacts và blocking decisions.
3. Cập nhật project status.
4. Đề xuất công việc cần hoàn tất.
5. Dừng phần kiến trúc chính thức.

Không giả định Step 01 đã hoàn thành chỉ vì Step 00A đạt READY_FOR_BUSINESS_ANALYSIS.

Nếu Step 01 đã được phê duyệt và inputs đầy đủ, tiếp tục các tasks bên dưới.

---

## 5. AGENT ORCHESTRATION — CLAUDE CODE FIRST

Trước tiên, kiểm tra khả năng gọi **Claude Code** trực tiếp từ Codex.

### If Direct Orchestration Is Available

Hãy giao Solution Architecture task cho Claude Code, bao gồm:

- Approved requirements.
- Domain glossary.
- Business rules.
- P0/P1/P2 scope.
- Three Golden Workflows.
- Technical constraints.
- Repository audit inputs.
- Required architecture deliverables.
- Review criteria.

Theo dõi trạng thái execution và thu thập artifacts thực tế.

### If Direct Orchestration Is NOT Available

Không tự đóng vai Claude Code để hoàn thành Solution Architecture.

Thay vào đó:

1. Tạo Architecture Task Contract.
2. Tạo Claude Code Architecture Handoff.
3. Ghi rõ required inputs/outputs.
4. Ghi rõ acceptance criteria.
5. Tạo hướng dẫn/prompt có thể sử dụng trực tiếp trong Claude Code.
6. Ghi trạng thái WAITING_FOR_CLAUDE_CODE.
7. Báo cáo chính xác phần nào Codex có thể tiếp tục độc lập.

Khi Claude Code hoàn thành và kết quả được đưa về repository, Codex tiếp tục điều phối các bước còn lại.

Phân biệt rõ PREPARED, DISPATCHED, EXECUTED, REVIEWED và APPROVED.

Không tuyên bố agent đã thực hiện công việc nếu mới chỉ tạo handoff.

---

## 6. CLAUDE CODE — SOLUTION ARCHITECTURE SCOPE

Claude Code chịu trách nhiệm thiết kế kiến trúc MatterControl, bao gồm:

### System Architecture

- System Context.
- Container Architecture.
- Component Architecture.
- Domain Boundaries.
- API Architecture.
- Data Architecture.
- Security Architecture.
- Integration Architecture.
- Non-Functional Requirements.

### Domain Architecture

Phải bảo toàn các legal domain concepts quan trọng:

- Workspace.
- Matter.
- Workstream.
- Milestone.
- Requirement.
- Action.
- Dependency.
- Evidence Requirement.
- Evidence.
- Document / Document Version.
- Filing.
- External Party.
- Entity.
- Decision.
- Finding.
- Risk.
- Legal Question.
- Event History.

Không gom tất cả vào generic Item + JSON metadata.

### Critical Business Invariants

Kiến trúc phải hỗ trợ:

1. Execution State.
2. Verification State.
3. Dependency State.
4. Timing State.
5. Attention State.
6. Dependency satisfaction.
7. Blocker propagation.
8. Dependency cycle prevention.
9. Evidence verification lifecycle.
10. Evidence Requirement ↔ Evidence many-to-many relationships.
11. Document version lineage.
12. Filing lifecycle.
13. Event History consistency.
14. Deterministic Status Brief.
15. Bulk operations.
16. Excel/CSV import/export.
17. Workspace/matter authorization.
18. Concurrent updates.
19. Auditability.
20. Extension paths for P1/P2.

### Architecture Deliverables

Yêu cầu Claude Code tạo:

- Architecture diagrams bằng Mermaid/C4 khi phù hợp.
- Domain Architecture.
- State Machine Design.
- Dependency Engine Design.
- Evidence & Verification Design.
- Document Lineage Design.
- Filing Design.
- API Contracts.
- Data Model.
- Security Architecture.
- ADRs.
- Architecture Risk Assessment.

Không overengineer thành generic enterprise workflow engine.

---

## 7. REPOSITORY TECHNICAL AUDIT

### ZCode — Backend Audit

Giao ZCode kiểm tra Go repository:

- Go version.
- Framework dependencies.
- Hexagonal Architecture implementation.
- Domain/Application layers.
- Ports/Adapters.
- Persistence.
- PostgreSQL requirements.
- Migrations.
- Authentication.
- OpenAPI.
- Existing tests.
- Runtime constraints.

### Antigravity — Frontend Audit

Giao Antigravity kiểm tra Next.js repository:

- Next.js version.
- React/TypeScript.
- Atomic Design implementation.
- Styling.
- State management.
- API integration.
- SSR/static rendering.
- Build requirements.
- Existing tests.
- Cloudflare deployment compatibility.

### Codex

Tổng hợp audit evidence để chuyển cho Claude Code.

Nếu không thể gọi agents trực tiếp, tạo structured handoffs tương ứng.

Không giả định kết quả audit đã có khi chưa chạy.

---

## 8. CLOUDFLARE FREE TIER FEASIBILITY

Đây là nhiệm vụ trực tiếp của **Codex — Cloud Engineer & DevOps**.

Hãy nghiên cứu và kiểm chứng phương án triển khai MatterControl.

Đặc biệt xem xét:

- Cloudflare Workers.
- Cloudflare Pages.
- D1.
- R2.
- KV.
- Wrangler.
- GitHub Actions.
- Runtime quotas.
- Persistence.
- Secrets.
- Monitoring.
- Free Tier limitations.
- Operational costs.

### Critical Architectural Constraint

Backend sử dụng Go và có thể phụ thuộc Echo/PostgreSQL theo repository thực tế.

**Không được mặc định Go HTTP server có thể chạy nguyên trạng trên Cloudflare Workers Free Tier.**

Phải xác minh:

- Runtime compatibility.
- Go/WASM options nếu phù hợp.
- Database hosting/connectivity.
- PostgreSQL constraints.
- Next.js build/deployment compatibility.
- Free Tier quotas.
- Third-party costs.
- Security implications.

Nếu có khả năng truy cập tài liệu chính thức hiện hành, sử dụng để xác minh và ghi lại sources.

Nếu không có khả năng truy cập nguồn hiện hành, đánh dấu UNVERIFIED; không tự đưa ra kết luận về quotas hoặc pricing.

### Architecture Decision Gate

Nếu Go + PostgreSQL + Cloudflare Free Tier không thể đồng thời đáp ứng constraints:

1. Tạo Technical Blocker Report.
2. Yêu cầu Claude Code phân tích architecture alternatives.
3. Codex phân tích infrastructure/cost trade-offs.
4. Giữ nguyên các constraints cho đến khi Product Owner quyết định.
5. Không âm thầm rewrite backend sang TypeScript.
6. Không tự ý chuyển PostgreSQL sang D1.
7. Không bật paid services khi chưa có approval.

Có thể tiếp tục local development strategy nếu được phê duyệt, nhưng không được tuyên bố production feasibility đã được giải quyết khi chưa có bằng chứng.

---

## 9. TECHNICAL PROOF OF CONCEPT

Sau khi Claude Code đưa ra architecture direction, tạo các technical PoC cần thiết.

### ZCode

- Go runtime feasibility.
- Backend connectivity.
- Persistence compatibility.

### Antigravity

- Next.js build.
- Cloudflare runtime/adapter validation.
- Routing/static/SSR behavior.

### Codex

- Wrangler configuration.
- Cloudflare infrastructure validation.
- Environment configuration.
- Cost/quotas evaluation.

### OpenCode

- PoC smoke tests.
- Validation evidence.
- Reproduction of failures.
- Technical risk findings.

### Claude Code

- Interpret PoC results.
- Review architecture implications.
- Update ADRs.

Sử dụng isolated branches/worktrees khi phù hợp.

Không xây business features trong technical PoC.

Không tự nhận remote deployment thành công nếu chỉ chạy local.

---

## 10. MCP / PLUGINS / SKILLS DISCOVERY

Codex đánh giá các công cụ có thể hỗ trợ từng agent.

Các nhóm cần xem xét:

- GitHub MCP.
- Agent orchestration integrations.
- Architecture/C4/Mermaid tooling.
- Context7 MCP.
- Go development tooling.
- Database tools.
- Next.js/React developer tools.
- Design handoff integration.
- Playwright.
- Chrome DevTools.
- axe-core.
- Lighthouse.
- Wrangler.
- GitHub Actions.

Với mỗi công cụ, ghi:

- Name.
- Tool category: MCP / Plugin / Skill / CLI / Library.
- Intended agent.
- Purpose.
- Official source.
- Compatibility.
- Permissions/security.
- Installation requirements.
- Cost implications.
- Verification status.
- Recommendation.

Chỉ đề xuất minimal necessary toolchain.

Không tự cài đặt công cụ yêu cầu quyền truy cập hoặc chi phí khi chưa được cho phép.

---

## 11. REQUIRED ARTIFACTS

Tạo hoặc cập nhật các tài liệu phù hợp:

docs/architecture/
- repository-audit.md
- system-architecture.md
- domain-model.md
- state-machine.md
- dependency-engine.md
- evidence-model.md
- document-lineage.md
- filing-model.md
- api-contracts.md
- data-model.md
- security-architecture.md
- cloudflare-feasibility.md
- technical-poc.md
- adr/

docs/tooling/
- plugin-mcp-skills.md

docs/deployment/
- free-tier-budget.md
- ci-cd-plan.md

docs/ai-sdlc/
- project-status.md
- risk-register.md
- requirements-traceability.md

docs/implementation/
- agent-handoffs.md

Nếu files đã tồn tại, kiểm tra nội dung trước khi chỉnh sửa.

Không ghi đè các approved specifications.

---

## 12. QUALITY GATE — STEP 02

Chỉ đánh dấu STEP 02 hoàn thành khi:

- Step 01 Requirements Gate đã đạt.
- Claude Code thực sự hoàn thành Solution Architecture.
- Architecture artifacts được lưu.
- Core domain invariants được bảo toàn.
- API/data contracts được xác định.
- Go/Next.js repositories được audit.
- Cloudflare feasibility được đánh giá với evidence.
- Critical PoCs đã thực hiện khi cần.
- Security architecture đã được review.
- Critical architecture blockers đã được giải quyết.
- Relevant ADRs đã được cập nhật.
- Product Owner đã phê duyệt major technical trade-offs nếu có.
- Agent execution và review statuses là chính xác.

Không coi việc tạo handoff documents là hoàn thành Solution Architecture.

---

## 13. FINAL REPORT

Sau khi thực hiện, báo cáo:

1. Step 01 Gate Verification.
2. Agent Orchestration Capabilities.
3. Claude Code Architecture Execution Status.
4. Repository Audit Findings.
5. Solution Architecture Summary.
6. Domain Model Decisions.
7. API/Data Architecture.
8. Cloudflare Feasibility.
9. Technical PoC Evidence.
10. Tooling Recommendations.
11. Architecture Risks & Blockers.
12. ADR Summary.
13. Updated Artifacts.
14. Step 02 Quality Gate Status.
15. Step 03 OpenDesign Readiness.

Nếu Claude Code chưa được gọi, phải cung cấp đường dẫn đến handoff và hướng dẫn hành động tiếp theo, không tuyên bố Step 02 DONE.

---

## 14. STOP CONDITION

Không bắt đầu full backend implementation.

Không bắt đầu full frontend implementation.

Không tạo high-fidelity UI.

Không chạy Step 03 tự động.

Không deploy production.

Dừng tại **Architecture Approval Gate**.

## FINAL DIRECTIVE

**Codex orchestrates. Claude Code architects. ZCode validates backend. Antigravity validates frontend. OpenCode verifies.**

Preserve MatterControl's legal operational semantics and approved P0 scope.

Resolve critical Cloudflare feasibility risks before full implementation.

Report only outcomes supported by actual execution evidence.