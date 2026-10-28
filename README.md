# MatterControl

**Control Plane for High-Stakes Legal Work**
**The System of Operational Truth for Complex Legal Matters.**

Vertical ban đầu: Transactions & Corporate Legal Work. Product Discovery đã kết thúc.

Repository này chứa governance/evidence và source đã được đưa về theo yêu cầu trực tiếp của Product Owner ngày 2026-10-26. Các thư mục source bên dưới hiện có trên filesystem; việc import chưa được commit vì gate Mimosa còn chặn. Repo hiện chưa có remote `origin`.

| Source | Vị trí | Nội dung / revision nguồn |
|---|---|---|
| Backend | [apps/backend](apps/backend/README.md) | Go template + C01 + BE-01 Requirement service, domain, persistence và tests; nguồn `136eae6` cộng patch R1 `33297560…` đã được review nhưng chưa commit |
| Frontend | [apps/frontend](apps/frontend/README.md) | Next.js Atomic Design baseline `3e5a642`; chưa phải đầy đủ UI nghiệp vụ MatterControl |
| INT-A harness | [tools/inta-harness](tools/inta-harness/package.json) | Source harness tạm tại `48cc03e`; giữ nguyên snapshot và các alias `/tmp` cũ, chưa port runtime sang vị trí mới |

Chi tiết vị trí, commit và giới hạn: [source layout](docs/implementation/source-layout.md). [Manifest import](docs/source-import/manifest.json) đối chiếu 485 file bằng SHA256, giữ cả mode/symlink. Không copy `.git`, `node_modules`, build cache, state runtime hoặc file env thật.

- [Step 01 PRD](docs/requirements/prd.md)
- [Step 01 SRS](docs/requirements/srs.md)
- [Product Requirements Approval Packet](docs/requirements/open-business-decisions.md)
- [Canonical Product Context — validated prompt baseline](docs/product/canonical-product-context.md)
- [Approved P0/P1/P2 capabilities](docs/requirements/p0-p1-p2-priorities.md)
- [Project Atlas synthetic dataset specification](docs/product/project-atlas-dataset.md)
- [Project status và Step 01 readiness](docs/ai-sdlc/project-status.md)
- [Operating model](docs/ai-sdlc/operating-model.md)
- [Project charter](docs/ai-sdlc/project-charter.md)
- [RACI và trách nhiệm agents](docs/ai-sdlc/raci-matrix.md)
- [Verified capability matrix](docs/ai-sdlc/agent-capabilities.md)
- [Orchestration protocol](docs/ai-sdlc/orchestration-protocol.md)
- [Task contract](docs/ai-sdlc/task-template.md)
- [Quality gates, DoR, DoD](docs/ai-sdlc/quality-gates.md)
- [Requirements traceability](docs/ai-sdlc/requirements-traceability.md)
- [Source-of-truth structure](docs/ai-sdlc/source-of-truth.md)
- [Verification evidence](docs/tooling/verification-2026-10-24.md)

Step 00A và Step 01 đã hoàn tất trong phạm vi được review/phê duyệt. Step 02 và các bước thiết kế/PoC có evidence trong [current workflow](docs/ai-sdlc/current-workflow.md); đọc checkpoint mới nhất thay vì coi baseline template là sản phẩm hoàn chỉnh. BE-01 có source/evidence review PASS_WITH_LIMITATIONS; BE-02 mới ở bước chuẩn bị contract. Import source không phê duyệt kiến trúc tổng thể, product authentication, production, chi phí hoặc triển khai. [Provenance](docs/product/context-provenance.md) giữ approved prompts là nguồn hợp lệ.
