# MatterControl — Canonical Product Context

Current Step 01 work: [PRD](../requirements/prd.md), [proposed rules/decisions](../requirements/open-business-decisions.md) and [project status](../ai-sdlc/project-status.md). The Step 00A readiness/review statements below describe the baseline at 20f12fe; actual baseline review has since returned PASS. New Step 01 policy remains pending PO approval.

Owner: Codex — BA / Product Requirements Owner / PM. Date: 2026-10-24.
**Status: VALIDATED_AGAINST_APPROVED_PROMPT_CONTEXT. Step 00A: COMPLETED; Step 01: READY_FOR_BUSINESS_ANALYSIS.**

## 1. Provenance và quyền ưu tiên

| Source ID | Nguồn | Trạng thái / cách sử dụng |
|---|---|---|
| SRC-00 | [Step 00](../ai-sdlc/step-00-request.md) | Identity, vertical, templates, Cloudflare constraints và team |
| SRC-00A | [Step 00A](../ai-sdlc/step-00a-request.md) | Chỉ thị hiện hành; P0/P1/P2 và product direction đã được PO chấp thuận |
| SRC-A | [Document A](source-brief.md) | ORIGINAL_BRIEFS_NOT_IN_REPOSITORY_BY_DESIGN; không trực tiếp verify bản gốc |
| SRC-B | [Document B](product-reality-addendum.md) | ORIGINAL_BRIEFS_NOT_IN_REPOSITORY_BY_DESIGN; B ưu tiên A về legal semantics/capability priorities khi đối chiếu bổ sung |
| SRC-00A1 | [Step 00A.1](../ai-sdlc/step-00a1-request.md) | PRODUCT_CONTEXT_PROVIDED_VIA_APPROVED_PROMPTS; xác nhận nguồn hợp lệ, seven JTBD và exit criteria |

Phân biệt: **APPROVED_INPUT** = nội dung trực tiếp từ chỉ thị; **WORKING_INTERPRETATION** = diễn giải BA; rules chi tiết cần Step 01; **SYNTHETIC_PROPOSAL** = fixture/acceptance example; **UNRESOLVED** = thiếu thông tin. Không coi mọi câu trong tài liệu này là trích dẫn từ A/B.

## 2. Product identity — APPROVED_INPUT

- Name: **MatterControl**.
- Positioning: **Control Plane for High-Stakes Legal Work**.
- Core positioning: **MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.**
- Product principle: **The System of Operational Truth for Complex Legal Matters.**
- Initial vertical: **Transactions & Corporate Legal Work**.
- Discovery đã đóng. Không tái chọn ý tưởng hoặc đổi positioning.

## 3. JTBD và operational thesis

Seven Core JTBD dưới đây là APPROVED_INPUT từ SRC-00A1 §5.2, không gán ngược cho bản gốc A. Trace IDs tham chiếu [capability register](../requirements/p0-p1-p2-priorities.md); AT-* là acceptance candidates trong Atlas, chưa chạy.

| ID | Approved JTBD | Capability trace | Atlas candidate |
|---|---|---|---|
| JTBD-01 | Understand current state. | REQ-MC-P0-09, REQ-MC-P0-20 | AT-STATE, AT-TIME, AT-UX |
| JTBD-02 | Identify blockers. | REQ-MC-P0-05, REQ-MC-P0-09 | AT-BLOCK |
| JTBD-03 | Know the next action. | REQ-MC-P0-03, REQ-MC-P0-10 | AT-UX |
| JTBD-04 | Track dependencies. | REQ-MC-P0-05 | AT-STATE, AT-BLOCK |
| JTBD-05 | Prove completion. | REQ-MC-P0-01, REQ-MC-P0-06, REQ-MC-P0-07, REQ-MC-P0-15 | AT-EVIDENCE, AT-DOC |
| JTBD-06 | Preserve history. | REQ-MC-P0-08, REQ-MC-P0-15 | AT-HISTORY |
| JTBD-07 | Report progress. | REQ-MC-P0-14, REQ-MC-P0-19 | AT-IO, AT-BRIEF |

Core value: understand current matter state, identify blockers, know next actions, track dependencies, understand Waiting On, verify evidence, track decisions, preserve change history, generate status updates và reduce operational uncertainty.

MatterControl không phải generic task manager, legal-themed Jira, spreadsheet replacement đơn thuần, virtual data room, legal AI chatbot hoặc generic workflow builder.

Các nguyên tắc trực tiếp từ SRC-00A: operational state thesis; evidence-based verification; deterministic reporting; Event History; Requirement khác Action; không dùng generic metadata blob thay domain semantics. COMPLETED không mặc định đồng nghĩa VERIFIED.

Chi tiết domain ở [glossary](domain-glossary.md). Danh sách phạm vi có ID ở [P0/P1/P2](../requirements/p0-p1-p2-priorities.md).

## 4. Năm chiều trạng thái

Các tập giá trị dưới đây là APPROVED_INPUT; mô tả ý nghĩa là WORKING_INTERPRETATION. Chúng không phải năm bảng kỹ thuật hoặc quyết định storage.

| Chiều | Giá trị | Ý nghĩa vận hành / câu hỏi Step 01 |
|---|---|---|
| Execution State | NOT_STARTED / IN_PROGRESS / WAITING / COMPLETED / CANCELLED | Tiến độ thực thi; làm rõ đối tượng áp dụng, quyền chuyển, reopen và cancellation propagation |
| Verification State | NOT_REQUIRED / UNVERIFIED / PARTIALLY_VERIFIED / VERIFIED / DISPUTED | Mức chứng minh so với tiêu chí; ai xác minh, tính đầy đủ, dispute và version nào được công nhận |
| Dependency State | READY / BLOCKED | Sẵn sàng theo điều kiện tiên quyết; phải được xác định bằng business logic, không chỉ trang trí UI; AND/OR, cycle, override và loại gate cần Step 01 |
| Timing State | ON_TRACK / DUE_SOON / OVERDUE | Quan hệ với mốc thời gian; cần timezone, ngưỡng due-soon, ngày không có deadline và calendar rules |
| Attention State | NORMAL / ATTENTION / CRITICAL | Mức cần chú ý; cần công thức, quyền override và ảnh hưởng từ blocker/risk |

Không dùng trạng thái task của AI SDLC (READY, IN_REVIEW, TESTING, DONE...) thay trạng thái sản phẩm. Dependency READY không có nghĩa Action đã bắt đầu.

Ví dụ fixture: COMPLETED + UNVERIFIED; WAITING + READY (chờ bên ngoài, không có dependency chặn); WAITING + BLOCKED; IN_PROGRESS + PARTIALLY_VERIFIED. Các tổ hợp này là acceptance candidates; Step 01 xác định ma trận hợp lệ và transitions, không mặc định mọi tích Descartes đều hợp lệ.

## 5. Evidence, document và history semantics

- Evidence Requirement là điều kiện bằng chứng cần đáp ứng; Evidence là bằng chứng được cung cấp. Có attachment không tự chứng minh điều kiện đã đạt.
- Document là tài liệu có identity; Document Version là một revision cụ thể. Cần biết bằng chứng/review đang tham chiếu version nào; bản mới không được âm thầm ghi đè lineage.
- Superseded document không được trình bày như bản hiện hành. Tác động tới verification trước đó là quyết định Step 01, không tự động kết luận mọi verification phải vô hiệu.
- Event History phải thể hiện thay đổi domain có thể truy vết. Candidate fields: người thực hiện, thời điểm, đối tượng, hành động, thay đổi trước/sau và lý do/references khi phù hợp. Đây là yêu cầu thông tin, không chỉ định event sourcing.
- Deterministic reporting: diễn giải cần xác nhận là cùng phạm vi, dữ liệu/baseline và thời điểm hiệu lực cho cùng kết quả, không dùng nội dung AI tự suy diễn làm sự thật.
- Delta-based Status Brief phải thể hiện thay đổi so với baseline được nêu rõ; cần định nghĩa phạm vi, quyền thấy dữ liệu, cách chọn baseline và kết quả khi không có thay đổi. Không tự kéo historical snapshots P1 vào P0.

## 6. Capability / workflow / UX baseline

Full Operational MVP bao gồm toàn bộ **20 P0 capabilities**, và ba acceptance targets:
[GW-01 Transaction / Restructuring, GW-02 Due Diligence, GW-03 Regulatory Filing](three-golden-workflows.md).

Matter Control Room giúp Manager hiểu current matter state, critical blockers, next actions, Waiting On, upcoming milestones, missing evidence, decisions và recent changes. Operational Grid giúp Contributor xử lý nhiều records, bulk actions, inline editing, import trackers, export tables, keyboard navigation và giảm context switching. My Actions, Waiting On, contextual details, Dependency View, document version awareness và Delta-based Status Brief bổ trợ nhau.

Desktop-first; responsive/mobile hỗ trợ workflows phù hợp, không mặc định full parity. UX quality là hiểu công việc nhanh hơn và giảm sai sót; không đo bằng số animation. Ưu tiên usability, correctness và keyboard efficiency. Chưa thiết kế high-fidelity UI hoặc chọn component/layout. Không biến sản phẩm thành generic task tracker hay dashboard chỉ để trình diễn.

## 7. Milestones phát hành sản phẩm

| Mức | Mục đích | Không được tuyên bố |
|---|---|---|
| Early vertical slice | Chứng minh một chuỗi vận hành end-to-end hẹp, ví dụ requirement → action → evidence → delta | Không gọi là full MVP; phạm vi slice cụ thể còn Step 01 |
| Internal alpha | Người dùng nội bộ đánh giá luồng/cross-capability, ghi rõ gaps và lỗi còn lại | Không mặc định alpha đã bao phủ toàn bộ P0 hoặc ba workflows |
| Full MVP | Toàn bộ P0 và cả ba workflows đạt acceptance criteria đã đặc tả, có evidence | Không miễn P0 vì complexity hoặc do slice/alpha đã demo thành công |

Product direction/P0 không cần xin duyệt lại. Đề xuất bỏ P0, đổi acceptance target hoặc thay infrastructure constraint là trade-off phải trình PO.

## 8. Constraints giữ nguyên

Backend: https://github.com/lannguyenit598/go-hexa-template
Frontend: https://github.com/lannguyenit598/nextjs-atomic-starter
Design tool: OpenDesign. Deployment target: Cloudflare Free Tier; infrastructure target $0/month trong workload MVP đã xác minh.

Chưa xác minh feasibility. Go/PostgreSQL xuất hiện trong yêu cầu delta; không phải chứng cứ repository thực tế đã dùng PostgreSQL hoặc đã có quyết định kiến trúc. Không chọn runtime/database/adapter hay cắt capability để phù hợp hosting trong Step 00A.

## 9. Readiness / giới hạn

[Project Atlas](project-atlas-dataset.md) là specification tổng hợp synthetic, không phải nội dung được khôi phục từ A.
[Delta analysis](../requirements/requirements-delta-analysis.md) ghi delta theo approved prompts; không phải kết luận đã so sánh trực tiếp A/B.

**Step 01: READY_FOR_BUSINESS_ANALYSIS.** Các inputs đã đáp ứng exit criteria SRC-00A1; không có blocker product direction/approved scope. [Provenance](context-provenance.md) ghi rõ originals optional và chưa direct verification A/B. Rules chi tiết là TO_BE_ANALYZED_IN_STEP_01 trong [open decisions](../requirements/open-business-decisions.md); technical design ở Step 02. Independent review Pending không được trình bày là đã pass. Dừng tại readiness, không tự thực hiện Step 01.
