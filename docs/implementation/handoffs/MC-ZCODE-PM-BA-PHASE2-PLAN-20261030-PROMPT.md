# MC-ZCODE-PM-BA-PHASE2-PLAN-20261030 — prompt cho actual ZCode (vai PM + BA, lập plan Pha 2)

Soạn bởi actual Claude Code (Solution Architect), 2026-10-30, theo yêu cầu trực tiếp của PO: "tiếp tục đóng vai là PM và BA để lên plan cho phase 2. viết prompt cho zcode". Handoff thủ công, chưa dispatch. Chuyển nguyên văn từ mục 1 trở xuống.

**"Pha 2" ở đây = Pha 2 – Tier A** trong `docs/implementation/plans/MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030.md` §5 (cải thiện flow cho legal quỹ đầu tư và legal law firm bằng các mục A2–A7 nằm trong P0 đã duyệt, sau Pha 0 sửa lỗi nền và Pha 1 nghiên cứu người dùng). Nếu PO muốn nghĩa khác (ví dụ Phase 2 của deploy), PO phải nói rõ trước khi dispatch.

**Ghi chú phân vai/tải:** AGENTS.md gán PM/BA cho Codex; ZCode đảm nhận vai này theo yêu cầu trực tiếp của PO, kết quả do Codex intake. ZCode đang giữ hai assignment khác (`MC-ZCODE-DEPLOY-READINESS-FINISH-20261030` sửa source; `MC-ZCODE-BA-FLOW-COMPLETENESS-REVIEW-20261030` review read-only). Task này **chỉ viết tài liệu**, không đụng source, nên không xung đột ghi; chỉ cần làm sau hoặc xen kẽ nếu ZCode còn dung lượng.

---

## 1. Vai trò và ranh giới

Bạn là **actual ZCode đóng vai đồng thời Product Manager và Business Analyst**. Sản phẩm của bạn là **một kế hoạch Pha 2 đủ chi tiết để một chủ sở hữu triển khai có thể nhận từng mục và bắt đầu** (spec đã sẵn sàng, tiêu chí chấp nhận kiểm thử được, thứ tự, phụ thuộc, rủi ro, quyết định cần PO).

- **Chỉ viết tài liệu. KHÔNG sửa source/test/config/SQL**, **KHÔNG sửa tài liệu đã duyệt** (`docs/product/*`, `docs/requirements/*`, ADR đã duyệt, `permission-matrix`, `state-semantics`). Đề xuất thay đổi spec đặt trong tài liệu *delta* mới nằm trong namespace của bạn, theo `docs/ai-sdlc/change-management.md`. Không commit/push/merge/reset/stash/clean.
- **Không tự duyệt, không tự promote.** Baseline P0/P1/P2 đã duyệt; không đưa P1/P2 vào Pha 2. Mục nào hóa ra cần dữ liệu/field/quy tắc mới → phân loại `SCOPE_CHANGE_NEEDS_PO` (kèm ADR/impact), không giấu trong "cải thiện UX".
- Giữ nguyên ngữ nghĩa lõi: năm trục trạng thái độc lập; Requirement ≠ Action; completed ≠ verified; receipt ≠ approval; verifier ≠ submitter; `OUTCOME_UNKNOWN`; CAS/revision; hidden-not-found; matter-level boundary (Workspace OWNER không tự đọc matter mật); VIEWER chỉ đọc phạm vi đã thấy.
- Không mở lại định vị (Discovery closed; vertical đầu Transactions & Corporate Legal Work). Không đưa vào kế hoạch: billing/time-tracking, conflict check, soạn thảo/so sánh văn bản, e-sign, e-filing, AI, cổng người ngoài, hạ tầng thông báo (đó là Tier C — chỉ nêu ảnh hưởng).
- Đọc `AGENTS.md` gốc; prefix lệnh shell bằng `rtk`; tìm code bằng Semble trước; dữ liệu synthetic; không mạo danh reviewer khác; quy trình tài liệu theo `docs/ai-sdlc/orchestration-protocol.md`, `quality-gates.md`, `requirements-traceability.md`, `raci-matrix.md`.

## 2. Đầu vào bắt buộc

1. **Kế hoạch gốc:** `docs/implementation/plans/MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030.md` (personas A=legal quỹ đầu tư, B=legal law firm; bảng J1–J14; Tier A/B/C; giả thuyết H1–H8; quyết định D-1..D-6). Bạn được phép **phản biện và sửa** các mục Tier A trong đó nếu bằng chứng cho thấy sai — ghi rõ lý do.
2. **Kết quả Pha 0, nếu đã tồn tại** (đọc ngay, không chờ): `docs/testing/zcode-ba-flow-completeness-20261030-r1/` (findings, coverage, BF-01..10), `docs/testing/uiux-lawyer-experience-audit-20261030-r1/` (improvement-plan, findings), `docs/testing/zcode-deploy-readiness-finish-20261030-r1/`. Nếu chưa có: lập kế hoạch với giả định tường minh và đánh dấu mọi mục phụ thuộc là `CONDITIONAL_ON_PHASE0`; phần này sẽ được cập nhật khi kết quả về.
3. **Spec đã duyệt:** `docs/product/{jtbd,user-journeys,three-golden-workflows,domain-glossary}.md`; `docs/requirements/{prd,srs,business-rules,state-semantics,permission-matrix,acceptance-criteria,golden-workflow-acceptance,p0-p1-p2-priorities,open-business-decisions,user-stories}.md`; `docs/ai-sdlc/{change-management,requirements-traceability,risk-register,decision-log,quality-gates,raci-matrix}.md`.
4. **Thiết kế/UX đã có:** `docs/design/legal-team-experience-20261029/` (đặc biệt `design-direction.md` — "Default information budget"), `docs/implementation/tasks/MC-P0-UX-FOCUSED-WORKBENCH.md`, `docs/testing/codex-business-flow-review-20261030-r1/` (BF-01..10).
5. **Source (chỉ đọc, để xác định cái gì có sẵn):** `apps/backend/internal/adapter/inbound/productapi/server.go` + `docs/api.md`; `internal/core/domain/matter/{workgraph.go (Party), workview.go (MyActions), controlroom.go, derive.go, dataops.go, filing.go}`; frontend `src/features/{control,work,proof,filings,data-transfer,workspaces,matters}` và `src/app/(app)/**`. Mọi khẳng định "đã có / chưa có" phải kèm file:line hoặc endpoint; không suy diễn.

## 3. Phạm vi kế hoạch Pha 2 (các mục cần đặc tả)

Với **mỗi mục dưới đây** bạn làm đủ bộ đặc tả ở mục 4. Trước hết, ở từng mục, **xác minh nó thật sự nằm trong P0**: nêu REQ-MC-P0-xx, BR, AC liên quan; nếu cần field/bảng/quy tắc mới thì ghi `SCOPE_CHANGE_NEEDS_PO` và đề xuất phương án nhỏ nhất vẫn trong P0 (nếu có).

| ID | Mục (từ plan gốc) | Câu hỏi nghiệp vụ cần trả lời | Gợi ý nơi đọc |
|---|---|---|---|
| A1 | Hoàn thiện flow sẵn có sau Pha 0 | Lỗi/gap nào từ BA review + UX audit là điều kiện trước? Mục nào của Pha 2 bị chặn bởi chúng? | kết quả Pha 0 |
| A2 | "Ai cầm bóng" (bên chịu trách nhiệm: nội bộ / bên kia / khách / cơ quan) | Hiện `Party`/waiting-on đã biểu diễn được gì? Nhóm theo bên có cần field mới hay chỉ read-model/UI? Khác Waiting-On vs Dependency thế nào để không lẫn? | `workgraph.go` Party, `GET /matters/:id/waiting-on`, `control-room-view.tsx` |
| A3 | Import thông minh hơn (nhớ ánh xạ cột, lỗi theo dòng có cách sửa, mẫu CSV synthetic, hướng dẫn chuẩn bị checklist) | "Nhớ ánh xạ" lưu ở đâu và là dữ liệu gì (per-user? per-matter?) — có chạm P0-13 hay thành dữ liệu mới? Quy tắc trùng/orphan/cycle giữ nguyên thế nào? | `dataops.go`, `features/data-transfer`, import preview/commit |
| A4 | Nhãn bản hiện hành / đang thương lượng / đã thay thế; luôn gắn "bản nào" vào evidence & chữ ký | Trạng thái nào đã tồn tại (current/superseded/promotion)? "Đang thương lượng" có phải trạng thái mới hay chỉ nhãn trình bày? | document/version/promotion API, `features/proof` |
| A5 | Status Brief dễ đọc + chế độ "bàn giao matter" (delta từ mốc), múi giờ client, tên thay vì ID, xuất theo trục trạng thái | Delta baseline hiện chọn thế nào? "Bàn giao" có thể chỉ là cách chọn baseline + mẫu trình bày, không phải thực thể mới? Quy tắc access-loss/unknown giữ nguyên. | `GET /matters/:id/brief`, `brief_proof.go`, `brief-section.tsx`, BF-03/BF-10 |
| A6 | Hiển thị phạm vi truy cập matter ("ai thấy matter này, vai gì") | Đọc từ members/verifiers có sẵn có đủ không? Quyền xem danh sách thành viên theo vai? Có rò thông tin cho VIEWER? Nhắc "Workspace OWNER không mặc định đọc". | `GET /matters/:id/members`, `/verifiers`, `permission-matrix.md` |
| A7 | View "đến hạn tuần này / quá hạn" xuyên matter | `GET /me/actions` đã có hạn/timing gì? Lọc ở server hay client (không N+1)? Quy tắc "overdue" lấy từ `derive.go` TimingOf — dùng lại, không định nghĩa lại. Saved Views là P1-12 → để ngoài. | `workview.go` MyActions, `derive.go`, `my-actions/page.tsx` |

Thêm mục **A0 (PM)**: khung quản trị Pha 2 — thứ tự, năng lực, cổng vào/ra, owner, review độc lập, cập nhật traceability. Nếu phát hiện mục Tier A hợp lý khác chưa có trong bảng (từ kết quả Pha 0), thêm **A8+** có lý do; không quá 3 mục thêm.

## 4. Bộ đặc tả cho mỗi mục (phần BA)

1. **Vấn đề và bằng chứng**: persona (A legal quỹ / B legal law firm; Transaction Owner / Contributor / Reviewer / Manager), công việc cần làm (J-id), hiện trạng có file:line, khoảng cách, tại sao thuộc P0 (REQ/BR/AC).
2. **User stories** dạng INVEST theo vai, mỗi story có giá trị rõ; không trộn nhiều hành vi.
3. **Tiêu chí chấp nhận** Given/When/Then kiểm thử được, mỗi tiêu chí gắn trace tới REQ/BR/AC; có trường hợp **âm tính** (từ chối quyền, dữ liệu rỗng, >200 bản ghi, mất quyền giữa chừng, stale revision, múi giờ, tiếng Việt dài). Không tiêu chí mơ hồ ("dễ dùng") — dùng số đo (số bước, ≤10 giây theo ngưỡng đã duyệt, đủ/không đủ).
4. **Quy tắc nghiệp vụ & bất biến cần giữ** (liệt kê rõ cái KHÔNG được đổi: trục trạng thái, quyền, hidden-not-found, idempotency), và **quy tắc mới** nếu có (đánh dấu cần PO).
5. **Tác động dữ liệu/API/read-model**: `NONE` / `UI_ONLY` / `NEEDS_READ_MODEL` / `NEEDS_API` / `NEEDS_SCHEMA` / `SCOPE_CHANGE_NEEDS_PO`; mô tả hợp đồng ở mức nghiệp vụ (đầu vào/đầu ra mong muốn), không viết code/SQL. Nếu `NEEDS_SCHEMA` → nêu cần ADR của Solution Architect và migration ordering (hiện slot migration kế tiếp có thể đã đổi; kiểm tra lại).
6. **Tác động quyền & bảo mật**: ai thấy gì mới; có lộ thông tin chéo matter/chéo bên không; audit cần ghi gì.
7. **Trạng thái UI cần đặc tả ở mức yêu cầu**: rỗng, tải, lỗi, từ chối, stale, unknown; nhãn/thuật ngữ vi/en (đối chiếu glossary); không phụ thuộc thông báo/nhắc việc.
8. **Kịch bản kiểm thử** ở mức nghiệp vụ (cho OpenCode/QA): dữ liệu Atlas synthetic nào, vai nào, kết quả mong đợi; điều kiện chạy browser.
9. **Chỉ số đo** (từ plan gốc §6) và cách đo trong thử nghiệm có kịch bản.
10. **Ngoài phạm vi / không làm** của mục đó.

## 5. Phần PM

1. **Phân rã giao hàng**: chia thành các **lát dọc nhỏ** (mỗi lát: đặc tả → backend/read-model nếu cần → frontend → test → review độc lập), mỗi lát có tiêu chí xong quan sát được; ưu tiên lát cho kết quả nhìn thấy sớm và ít rủi ro.
2. **Sắp thứ tự & phụ thuộc**: đồ thị phụ thuộc giữa A1–A7 và với Pha 0/Pha 1; đường găng; những gì chạy song song được và những gì tuần tự; đánh dấu rõ lát bị chặn bởi quyết định PO hoặc kết quả Pha 0.
3. **Ước lượng**: S (≤½ ngày) / M (1–3) / L (1–2 tuần) / XL, kèm giả định và độ tin cậy; không hứa ngày lịch.
4. **Chủ sở hữu theo RACI** (AGENTS.md): backend execution = ZCode; frontend = Antigravity; UI/UX = OpenDesign; PG/DevOps/orchestration = Codex; kiểm thử độc lập = OpenCode; Solution Architect (Claude Code) cho ADR/hợp đồng; PO duyệt phạm vi/đánh đổi. Một chủ sở hữu mỗi task; nêu nhánh/worktree cô lập khi có nhiều người sửa chung source. Cảnh báo xung đột ghi (nhiều agent sửa cùng file như hiện nay).
5. **Cổng vào/ra Pha 2** (Definition of Ready / Done): ví dụ điều kiện vào = Pha 0 đóng các DEFECT P0–P1, quyết định D-1; điều kiện ra = AC đạt trên byte cuối, review độc lập không còn Blocker, traceability cập nhật, kiểm thử người dùng lặp lại đạt ngưỡng.
6. **Kế hoạch kiểm chứng với người dùng** nối với Pha 1: giả thuyết H1–H8 nào ảnh hưởng thứ tự Pha 2; kịch bản thử nhiệm vụ trên dữ liệu synthetic; ngưỡng đạt (đề xuất tỷ lệ hoàn thành, thời gian, "biết việc kế tiếp ≤10 giây"); bảo mật dữ liệu thử nghiệm.
7. **Quản trị thay đổi & truy vết**: danh sách delta cần cho SRS/AC/traceability (viết trong tài liệu delta, không sửa bản duyệt); ADR cần soạn; cập nhật `risk-register` (đề xuất dòng mới, không sửa trực tiếp nếu chưa được giao).
8. **Rủi ro & giảm thiểu** (có chủ, xác suất, tác động): mở rộng phạm vi âm thầm sang Tier B/C; giả định persona sai; lỗi nền Pha 0 chưa sửa làm số đo vô nghĩa; xung đột ghi nhiều agent; phụ thuộc read-model; chất lượng thuật ngữ tiếng Việt; thiếu thông báo (D-4) làm pilot thất bại dù flow đúng; số đo "10 giây" khó đo.
9. **Quyết định cần PO** (bảng: ID, câu hỏi, lựa chọn, khuyến nghị, hậu quả nếu trì hoãn, hạn cần quyết). Tối thiểu: các mục `SCOPE_CHANGE_NEEDS_PO` phát hiện được, D-1, D-3, D-4, D-6 từ plan gốc.
10. **Truyền thông/handoff**: tóm tắt 1 trang cho PO; danh sách task đề xuất (ID, chủ sở hữu, AC, reviewer, phụ thuộc, đầu vào/đầu ra) theo mẫu `docs/ai-sdlc/task-template.md` — là **đề xuất**, trạng thái BACKLOG; không đặt READY nếu chưa có cổng vào.

## 6. Quy tắc bằng chứng và chất lượng

- Mỗi "đã có/chưa có" kèm file:line/endpoint; phân biệt *đọc source* / *đã chạy* / *suy từ tài liệu*. Không tự chạy runtime của người khác; nếu cần xác minh bằng chạy thì ghi `NOT_RUN` (đã có BA review chuyên trách).
- Không sao chép nguyên văn tài liệu cũ dài; trích dẫn ID/đường dẫn. Không thêm tính năng ngoài mục 3. Mỗi tiêu chí chấp nhận phải kiểm thử được bởi người không đọc code.
- Dùng ngôn ngữ nhất quán với `docs/requirements/*` (tiếng Việt, thuật ngữ glossary). Ghi rõ nơi cần thuật ngữ vi/en mới.
- Kế hoạch này **chưa được người dùng thật kiểm chứng** và **chưa được PO duyệt**; ghi rõ ở đầu mọi tài liệu.

## 7. Đầu ra

Namespace `docs/implementation/plans/phase2-tier-a-20261030/` (nếu tồn tại: `-r2`, không ghi đè):
- `phase2-plan.md` — **tài liệu chính**: tóm tắt điều hành (≤1 trang), phạm vi/không phạm vi, đồ thị phụ thuộc và thứ tự, lát giao hàng, ước lượng, cổng vào/ra, rủi ro, quyết định PO.
- `requirements/A0..A7(+A8).md` — bộ đặc tả §4 cho từng mục.
- `traceability-delta.csv` — mục × REQ/BR/AC × task đề xuất × loại tác động (`UI_ONLY`…`SCOPE_CHANGE_NEEDS_PO`).
- `spec-delta-proposals.md` — thay đổi đề xuất cho SRS/AC/glossary (không sửa bản duyệt), kèm lý do và cần ai duyệt.
- `task-backlog.md` — danh sách task đề xuất theo task-template (BACKLOG).
- `user-validation-plan.md`, `risk-and-decision-log.md` (rủi ro + quyết định PO).
- `source-manifest.json` (HEAD, hash file đã đọc, xác nhận không sửa source), `return.md`.
- Task record `docs/implementation/tasks/MC-ZCODE-PM-BA-PHASE2-PLAN-20261030.md` (đã tạo khung — điền); thêm MỘT đoạn ngắn đầu `docs/ai-sdlc/project-status.md`.

`return.md` nêu: agent thật + vai (PM+BA), base/head, đã đọc kết quả Pha 0 nào (hay giả định), số mục có `SCOPE_CHANGE_NEEDS_PO`, các mục `CONDITIONAL_ON_PHASE0`, quyết định PO cần gấp, và rõ ràng: đây là kế hoạch đề xuất chưa được PO duyệt, chưa kiểm chứng người dùng, không phải implementation hay release approval. Trạng thái đề xuất: `PLAN_PROPOSED / WAITING_APPROVAL`. Kết thúc bằng phần bị bỏ qua và rủi ro còn lại.

## 8. Điều kiện hoàn thành

Xong khi: mọi mục A0–A7 có bộ đặc tả đủ 10 phần (hoặc nêu rõ vì sao thiếu), mỗi mục đã được xác minh là P0 hay gắn `SCOPE_CHANGE_NEEDS_PO`, thứ tự + phụ thuộc + cổng vào/ra rõ ràng, backlog đề xuất có chủ sở hữu và reviewer, quyết định PO đã gom, source không bị đổi. Sau đó dừng — không tự dispatch task, không bắt đầu triển khai, không mở assignment mới.
