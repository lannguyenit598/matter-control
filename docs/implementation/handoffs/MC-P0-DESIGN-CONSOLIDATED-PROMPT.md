# MATTERCONTROL — CONSOLIDATED DESIGN EXECUTION

## 1. Assignment and execution boundary

Bạn là design owner thực tế trong project **MatterControl Step 03A — Atlas UX Concepts**. Hãy hoàn thiện một bản thiết kế thống nhất: đúng nghiệp vụ, UX ấn tượng, UI tinh tế và đủ cụ thể để ZCode triển khai backend + product frontend theo từng wave.

Task: **MC-P0-DESIGN-R2**. Priority: P0 design prerequisite. Coordinator: Codex. Consumer: actual ZCode. Reviewer: tác nhân độc lập, không phải tác giả, do Codex giao sau khi nhận return.

Đây là **một prompt thực thi duy nhất**, tổng hợp correction R2, experience brief, icon selection và prototype polish. Không cần nhận thêm các prompt cũ. Bản Codex chuẩn bị chưa phải invocation; khi PO trực tiếp gửi prompt này vào phiên đã chọn, hãy thực hiện phạm vi được giao, không yêu cầu xác nhận dispatch lần nữa. Nếu task R2 đã có owner đang chạy, không tạo writer thứ hai; báo đúng collision/trạng thái để Codex điều phối.

Làm trực tiếp trong project/phiên được chọn. Ghi nhận actual identity, tool/version, mode, model nếu được công cụ cung cấp. Giữ mode **Local Codex hoặc OpenDesign Cloud đã được người dùng chọn**, provider/model và hạn mức hiện tại; không tự đổi route khi lỗi/quota, không đăng nhập hoặc kích hoạt mua thêm dịch vụ. Nếu đây là child runtime đang chạy bên trong project, không mở workflow plugin/MCP/generation lồng nhau.

Mục tiêu của lượt này là **source-level exploratory prototype + UX specification + handoff**. Không viết product code vào `apps/`, không triển khai backend, không tự mở STEP03B/high-fidelity hoặc production. Hoàn thành đầu ra trong phạm vi này thay vì chỉ trả kế hoạch.

## 2. Repository, nguồn và quyền ưu tiên

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch: `codex/unified-project-flow`.
Prepared HEAD: `a62d838791ba188838c4ff00b7b6e265ac775056`.

Đọc AGENTS.md và quy tắc liên quan; dùng RTK/Semble theo repository khi có terminal/search. Xác minh root/branch/HEAD và các source pins trong:

`docs/testing/p0-design-consolidated-inputs-20261027.json`

Manifest ghi exact paths/bytes/SHA256; không chứa credential. Đọc đúng các nguồn cần thiết, không quét thư mục private. Nếu pin bắt buộc lệch hoặc không truy cập được nguồn, nêu đường dẫn và khác biệt cụ thể; không tự ghép revision hoặc đoán nội dung. Không dùng preview URL đơn lẻ làm bằng chứng của revision.

Ưu tiên nội dung:

1. Yêu cầu PO hiện tại và approved product requirements/business rules/permission/state/AC/Golden Workflows.
2. D-UX01..04, selected system/tokens và frozen `docs/design/step-03a/revised/local-r3/`.
3. `docs/reviews/p0-design-uiux-source-review-20261027.md`: 11 lỗi UIUX-01..11 phải xử lý.
4. `docs/design/p0-visual-polish-r1/prototype.html`, `polish.css`, README và source-checks: reference refinement, chưa visual acceptance.
5. `docs/design/p0-handoff-r1/`: proposal cần sửa, không phải authority ghi đè approved contracts.

Các nguồn cốt lõi: `docs/requirements/{srs,business-rules,state-semantics,permission-matrix,acceptance-criteria,golden-workflow-acceptance}.md`, `docs/product/project-atlas-dataset.md`, `docs/design/step-03a/{design-decision-register.md,design-decisions.json}`, `docs/implementation/p0-zcode-delivery-plan.md`, `docs/testing/p0-zcode-plan-20261026/coverage.json`, `apps/frontend/AGENTS.md` và `apps/frontend/docs/ai/rules/dependencies.md`. Đọc theo exact entries trong manifest; không diễn giải dấu `{…}` thành tên file thật.

## 3. Product và quality bar đã chốt

MatterControl là **Control Plane for High-Stakes Legal Work**, System of Operational Truth cho complex legal Matters; initial vertical Transactions & Corporate Legal Work. Discovery đã đóng. Người dùng chính: legal manager/Transaction Owner, contributor và designated independent verifier; dùng desktop trong phiên làm việc dài, mobile để triage/theo dõi/đọc evidence và thao tác đơn giản được phép.

Giữ **Enterprise Precision A**, selective causal impact rail B và Compact behavior C. Comfortable mặc định, Compact tùy chọn. Giữ humanist sans application stack, body 14px/1.5, metadata 12px, heading 22px, spacing base 4px và selected semantic palette. Monospace dành cho IDs/time/code/data. Không mở lại vote A/B/C, không đổi brand/font/palette bằng theme ngẫu nhiên.

Chất lượng mong muốn: người dùng thấy rõ điều gì đang chặn, vì sao, tác động đến đâu, ai chịu trách nhiệm và bước nào thực sự được phép. Giao diện có bản sắc từ **causal chain + proof context + operational truth**. Typography, spacing, alignment, density và feedback phải được thiết kế có chủ đích trên toàn hành trình.

Hierarchy Control Room giữ: **Blockers → Next Actions → Waiting On → Milestones → Evidence Gaps → Changes**, Important Decisions nằm nổi bật cạnh Next Actions. Dữ liệu khó/thiếu/đang chờ vẫn phải đọc được. Không thêm KPI, readiness percentage, chart hoặc lời hứa không có nguồn.

## 4. Áp dụng đủ ba skill vào đúng loại ứng dụng

Đọc các installed skills nếu môi trường có quyền truy cập:

- `/Users/nguyenvanlan/.codex/skills/design-taste-frontend/SKILL.md`, đặc biệt `references/app-screens.md`.
- `/Users/nguyenvanlan/.codex/skills/hallmark/SKILL.md`, đặc biệt app scope trong `references/flow.md`, refinement/redesign guidance và static gates.
- `/Users/nguyenvanlan/.codex/skills/impeccable/SKILL.md`, `reference/operate.md`, `reference/polish.md` và craft floor trước UI edit.

Upstream references: `https://github.com/nutlope/hallmark`, `https://github.com/pbakaus/impeccable`. Dùng bản installed hiện có; không tự cài, cập nhật hoặc thay cấu hình. Nếu skill/reference thiếu, báo chính xác phần không đọc được và tiếp tục phần được phép theo project context; không tự tạo lệnh/reference không tồn tại.

Đây là **Operate/app screen refinement**. Áp dụng:

- **tasteskill:** mỗi screen có câu hỏi chính, một finding đáng chú ý, dữ liệu có nguồn; hierarchy/alignment/density rõ; bảng có substance; labels đọc được; zero/empty/missing/unavailable khác nhau.
- **Hallmark:** giữ content/wiring, token hóa phần style mới, controls/focus/states/reduced motion nhất quán; loại bỏ ornamental UI không giúp công việc; app scope, không marketing hero, word budget hay ảnh stock.
- **Impeccable:** polish trong incumbent system; ưu tiên correctness/accessibility/recovery, rồi hierarchy/layout/type và motion; kiểm tra toàn đường đi thay vì một screenshot đẹp.

Approved product constraints thắng generic taste defaults: không truncate legal titles/reasons/errors; không gộp five axes thành một badge; không giảm chữ khi Compact; không bỏ P0 trên mobile. Không tự thêm font/display face, dark theme, dependency hoặc bộ component mới. Không ghi full skill workflow PASS nếu chỉ đọc guidance/chạy static lint.

## 5. Sửa đầy đủ UIUX-01..11

**UIUX-01 — Traceability và Golden Workflows.** Giữ chính xác FR-001..020/AC mapping từ SRS. Đặc biệt FR-009 Control Room, FR-010 My Actions, FR-012 Bulk, FR-013 Import, FR-014 Export, FR-015 Document Versions. Signature observations thuộc approved scope, không đổi FR IDs. Giữ inventory 13 screen identities, bổ sung flow/subview My Actions/Waiting On/context cần thiết. Giữ đủ ba GW gốc:

- GW-01: Approval → Document → Signature → Payment → Transfer → Closing → Filing → Post-Closing.
- GW-02: Request → Document → Review → Gap → Finding → Follow-Up → Resolution.
- GW-03: Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval; có hai supplement-response cycles và alternatives/negative paths theo AC-163.

Dashboard review/signature reconciliation có thể là subscenario, không thay thế GW/AC identities.

**UIUX-02 — Bulk.** Allowlist: **title, description, assigned internal owner, due date**. Không thêm `operational_note` thay description; không bulk type/links/waiting/state/criteria/roles/verify/waiver/promotion/delete. Preview exact selected IDs/changes, unchanged-versus-clear, recheck rights/revisions, per-record atomic mutation+audit, persistent partial results và failed drafts. AC-112 là bulk, AC-113 là import.

**UIUX-03 — Conflict và uncertain write.** Không có unconditional “Overwrite”. Giữ draft, chỉ so sánh current values trong quyền truy cập, reload/rebase và gửi command mới theo current revision đã được contract chấp nhận. Timeout/mất response không đồng nghĩa thất bại; giữ OUTCOME_UNKNOWN và reconciliation trước safe retry. Cơ chế receipt/wire chưa adopted phải ghi dependency.

**UIUX-04 — Filing.** Khôi phục đủ canonical stages, package/signature guards, exact version và repeated-cycle history. Upload đơn thuần không tự ghi authoritative stage hoặc verify proof. Receipt không phải approval. Giữ OWNER rejection/withdrawal/correction/reopen; approval observation khác independent proof verification. ARCH-Q5 không mặc định đòi authority cấp lại quyết định sau reopen. Unknown enum/schema/API không được tự chốt.

**UIUX-05 — State predicates.** Requirement ≠ Action; criteria ≠ supplied proof; COMPLETED ≠ VERIFIED; WAITING ≠ BLOCKED. Áp dụng từng axis đúng subject theo state semantics. Completion edge cần upstream READY+COMPLETED; proof edge còn cần valid VERIFIED, NOT_REQUIRED không thỏa proof edge. Milestone cần mọi explicit required Requirement READY+COMPLETED+(valid VERIFIED hoặc explicitly valid NOT_REQUIRED). Không có required set → UNASSESSED, counts unavailable. Unavailable evaluator không default READY. Không tự yêu cầu cả hai wire fields waiting_party/waiting_condition từ business wording; giữ internal accountable owner và guards/allowed transitions đã duyệt.

**UIUX-06 — Atlas truth.** Giữ đúng 24 rows: 12 Requirements + 12 Actions. Action census T0: **4 COMPLETED, 3 WAITING, 5 NOT_STARTED, 0 IN_PROGRESS**. Không có eligible Next Action; năm NOT_STARTED AC-07/08/09/11/12 đều BLOCKED. AC-04/05/10 thuộc Waiting On với owner U-01/U-01/U-03. MS-01..03 chưa có declared required sets: UNASSESSED, không invent counts. EV-04 không tồn tại; ER-04 thiếu proof. Giữ historical self-review caveat; dùng labelled synthetic scenarios riêng cho proof mới, known prerequisite sets hoặc trạng thái mở rộng.

**UIUX-07 — Contract authority.** UX chỉ nêu semantic data/commands cần có. Không invent/adopt endpoints, DTOs, status codes, tables, ETag format, auth provider hay storage/SSE/export library. Git commit không phải resource ETag. Dẫn exact adopted architecture reference nếu có; còn thiếu ghi DEPENDENCY_PENDING. Server quyết định proof/dependency/readiness và quyền; UI không tự tạo sự thật bằng optimistic animation.

**UIUX-08 — Interaction/accessibility.** Mỗi screen/flow có allowed roles/operations, loading/empty/no-match/unavailable/forbidden/stale/conflict/partial/recovery. Blocker/disabled reasons phải đọc được qua keyboard/touch, không chỉ hover/tooltip trên disabled control. Có named controls, field-associated/announced errors, grid row/cell/editor key ownership, dialog focus entry/trap/return, unsaved draft và revocation recovery. Filter/sort/pagination/selection phải explicit, không edit hidden rows vô tình. Mobile giữ matching records, critical reasons và permitted operations; complex flows có desktop alternative rõ ràng. Không invent mutation “acknowledge status”.

**UIUX-09 — Validation.** AC-137 đã duyệt: **5 representative managers, unseen 50-row matter, 2 counterbalanced scenarios, no hints, answer key, ≥4/5 trả lời đúng đủ câu hỏi trong 10 giây**. Không thay bằng Atlas quen thuộc hoặc một người không định danh. Có full GW/negative roles/revocation/unknown writes/filing cycles; 24-row Atlas và labelled 50/100/200-row fixtures; hai density, long English/Vietnamese labels, last row, selected viewports/200% zoom, focus/editor/filter context. Những gì chưa chạy giữ NOT_RUN.

**UIUX-10 — Provenance.** Ghi actual identity/mode/tool/revision và bind preview/export/hash. Cite exact old lines cho mỗi correction; phân biệt inherited fix, proposed spec, source check và rendered test. Không kết luận “không còn contradiction” nếu findings còn mở; không tự đóng independent gate hoặc tạo lại lỗi đã sửa ở local-r3.

**UIUX-11 — Components.** Reuse existing UI primitives. `apps/frontend/src/components/` domain-free; Matter switcher/five-axis business compositions vào `src/features/`. Ghi đúng `src/` paths; shared generic badge/selector/dialog có thể dùng chung. Không đổi architecture hoặc thêm dependency chỉ để làm đẹp.

## 6. Năm trải nghiệm phải thiết kế nối liền

1. **Understand:** Control Room cho thấy condition → cause → downstream impact → accountable owner → permitted next step. Empty Next Action và undefined milestone có lời giải thích hữu ích.
2. **Trace:** Blocker → causal detail → Requirement/Action → exact proof/version → return. Giữ Matter, origin, filter, selected row, scroll/focus và as-of context.
3. **Operate:** Grid có typography/columns/density rõ; chỉnh sửa mượt, feedback đúng, draft không mất khi validation/conflict; state labels luôn phân biệt.
4. **Review:** Criterion, evidence version, submitter, designated independent verifier, validity và consequences nằm trong cùng ngữ cảnh. Submitter không tự verify; OWNER không tự có verifier authority. Không review được thì có reason/allowed next step rõ ràng.
5. **Handover:** Draft Status Brief tách changes `(t1,t2]` theo recorded-time policy và outstanding tại t2; no-change, ordering, provenance và quyền export rõ. Không biến thành managed issued-report/snapshot P1.

Với mỗi moment, trả actor/permission, initial state, user intent, từng step, feedback, authoritative result, recovery và keyboard/mobile behavior. Đầu ra phải có **updated concept có thể review**, không chỉ liệt kê tính từ hoặc thay màu.

## 7. Icon và motion đã chọn

**Lucide là ngôn ngữ icon duy nhất:** `lucide-react` hiện có làm baseline, curated **Lucide Animated** cho điểm nhấn. Frontend hiện chưa khai báo Motion; lựa chọn visual không phải quyền tự cài package. Potlab/Lordicon chỉ là reference, không trộn family vào product.

Navigation/Grid/state dùng icon tĩnh, outline nhất quán, `currentColor` và text label. Candidate glyph sizes 16px compact/20px standard, không nhầm glyph với hit target 32px desktop/44px mobile. Giữ license/source notices; exact icon exports và imported source revision phải được ZCode kiểm tra khi activated implementation.

Animation chỉ hỗ trợ focus/activation, upload đang thực sự pending, hoặc một confirmation ngắn sau authoritative success. Không loop toàn màn hình, không animate từng hàng Grid, không tạo page-load choreography. Completion animation không có nghĩa proof VERIFIED. Keyboard/touch có đường đi tương đương; static reduced-motion fallback; reserve geometry, không làm mất focus/draft. Dùng CSS/platform cho feedback đơn giản trước; dependency Motion chỉ khi có lý do và compatibility/bundle checks theo R-DEP. Không tải icon từ runtime CDN hoặc thêm analytics/MCP.

## 8. Deliverables — một bản hoàn chỉnh, không ghi đè lịch sử

Chỉ ghi **NEW** directory:

`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/p0-handoff-r2/`

Kiểm tra absent trước khi ghi. Nếu collision, dừng writer và báo đường dẫn; không ghi đè hoặc merge âm thầm.

Trả các file sau, không tạo thêm bộ tài liệu song song:

1. `design-delta.md`: old→new/reason, preserved decisions, actual provenance và open dependencies.
2. `current-ux-spec.md`: một spec coherent, W1/W2 chi tiết; W3..W6 đầy đủ flow/state inventory; ba Golden Workflows đúng scope.
3. `screen-state-matrix.json`: 20 FR đúng identity + screens/flows/states/roles/waves/RULE/AC/test mappings; không chỉ đếm đủ IDs rồi claim coverage.
4. `zcode-handoff.md`: per-wave reuse/components/variants/tokens/interaction acceptance/data needs và architecture dependencies; ưu tiên W1/W2 actionable.
5. `validation-plan.md`: scenario/fixture/steps/expected/method/owner/status, actual run limits và AC-137 protocol.
6. `findings-disposition.json`: giữ historical IDs/classifications, thêm UIUX-01..11 dispositions và exact evidence; không tự đóng independent review.
7. `prototype.html` cùng `polish.css`: updated source-level concept theo selected system, canonical data và các moment trên. Reuse frozen local-r3 + polish proposal nơi hợp lý. Không copy sai R1; giữ wiring/caveats và đánh dấu simulation/spec-only. Không fake backend, auth, upload/export hoặc verification bằng toast.
8. `return.md`: actual identity/mode/project/source/export revision; inputs checked; file paths/bytes/SHA256 (không self-hash bên trong return); thay đổi, tests run/not run, findings còn mở, proposed IN_REVIEW và exact next action. Trả hash riêng của return trong final response nếu thực sự tính được.

Ưu tiên file workspace nếu có quyền được giao. Nếu môi trường chỉ ghi được project artifact, trả các deliverables có tên tương ứng và exact project/export revision; Codex intake ra workspace sau. Không claim đã ghi local files hoặc tính hashes khi chưa làm được. Preview URL đơn lẻ không thay thế source handoff.

## 9. Kiểm chứng và giới hạn

Chạy permitted static parse/hash/link/traceability checks và installed skill static lint phù hợp; giữ commands/tool version/exit/raw evidence. Sửa finding thật trong phần mới, giải thích false positive hoặc inherited scope cụ thể. Kết quả lint CSS-only không phải full-prototype/visual/a11y PASS.

Browser đang bị tắt trong Work settings ở lượt chuẩn bị. **Không bypass bằng browser/runtime khác, dev server/proxy/tunnel/OS capture.** Nếu setting vẫn tắt, hoàn thành source/spec và ghi RENDERED_NOT_RUN; không chạy script `--render`. Nếu sau đó browser đã được cho phép thực sự và target nằm trong phạm vi này, capture đúng revision bằng công cụ được phép tại 1440×900, 1280×800, 768px, 390px và 200% zoom; inspect ảnh rồi kiểm keyboard/focus/touch/error paths. Không chạy product app/DB/backend để tạo bằng chứng design. Không claim usability AC-137 nếu chưa có actual study đúng protocol.

Không sửa `apps/backend`, `apps/frontend`, `tools/inta-harness`, MC-003A worktree, frozen local-r3, R1, prior prompts/manifests, các packet R5/R6, BE01, security scans/ledgers, formal 51-row results, AGENTS hoặc global settings/memory. Không credential/legal-data reads, installs, SQL/Docker/lifecycle, product build/runtime, external agent messaging, Git stage/commit/push/merge hoặc paid-service activation. Không tự chuyển mode/provider khi thiếu tool/quota.

Không tự tạo thêm subagents chỉ vì có tên role/skill. Không tự dispatch reviewer. Corrected source vẫn cần actual nonauthor semantic/testability review; rendered/interaction/user-task acceptance là evidence riêng.

## 10. Definition of return

Hoàn thành khi có **một prototype/source handoff coherent**, xử lý UIUX-01..11 bằng evidence, giữ đúng 20 FR và 3 GW, W1/W2 đủ cụ thể để ZCode tiêu thụ khi gate sẵn sàng, và liệt kê chính xác dependency/test chưa hoàn thành. Không tự đánh dấu MC-002 DONE, STEP03A_APPROVED, STEP03B, production/security/cost/recovery PASS hoặc waiver.

Trả lời cuối ngắn gọn bằng tiếng Việt: actual agent/mode; revision và links; đã sửa gì; output hashes; tests run/not run; remaining findings/dependencies; proposed status; exact next action. Kết thúc bằng phần bỏ qua và rủi ro còn lại.
