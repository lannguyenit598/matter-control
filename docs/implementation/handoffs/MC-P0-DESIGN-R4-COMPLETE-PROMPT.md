# MATTERCONTROL — DESIGN R4: HOÀN THIỆN UX VÀ HANDOFF TOÀN BỘ P0

Tiếp tục thiết kế MatterControl từ Design R3. Hoàn thành một gói design thống nhất để ZCode triển khai toàn bộ backend + frontend theo plan đang chạy. Làm đến hết phạm vi dưới đây, tự kiểm tra và sửa các lỗi design có thể xử lý; nộp một return tổng hợp, không dừng sau từng màn để xin prompt tiếp theo.

## Bối cảnh và nguồn chuẩn

MatterControl là Control Plane for High-Stakes Legal Work / System of Operational Truth for Complex Legal Matters; vertical đầu tiên là Transactions & Corporate Legal Work. Người dùng chính: manager, matter owner, contributor và designated verifier. Đây là phần mềm làm việc hằng ngày với hồ sơ pháp lý phức tạp.

Root nếu môi trường hiện tại có quyền đọc local:
`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

Đọc nguồn hiện có trước khi sửa:
- `docs/design/p0-handoff-r3/return.md` và tám deliverables mà return khai báo.
- `docs/design/p0-handoff-r3/{current-ux-spec.md,screen-state-matrix.json,prototype.html,polish.css,validation-plan.md,zcode-handoff.md,findings-disposition.json,design-delta.md}`; brace notation là danh sách file, không phải một path literal.
- `docs/reviews/p0-design-r2-source-review-20261027.md`.
- `docs/requirements/{srs.md,business-rules.md,state-semantics.md,permission-matrix.md,acceptance-criteria.md,golden-workflow-acceptance.md}`.
- `docs/product/project-atlas-dataset.md` và `docs/design/step-03a/revised/local-r3/` để giữ selected system/tokens.
- `docs/implementation/p0-zcode-end-to-end-execution-plan.md`, `docs/implementation/handoffs/MC-P0-ZCODE-COMPLETE-PLAN-PROMPT.md` và contract hiện hành `docs/implementation/p0-zcode-execution/local-contract.md`, chỉ đọc.

Design R3 return SHA-256: `cd42f5a44536807ba6e38a4af735ec211fa211dc9185c357ef58e36b8e2106ec`. Kiểm tra hash return và tám output pins trước khi consume. Codex đã kiểm chúng khớp khi chuẩn bị prompt; kiểm lại bytes thực tế trong phiên của bạn. Không dùng một revision chỉ vì thư mục có tên mới hơn. Nếu không truy cập được source, báo chính xác phần thiếu, không bịa rằng đã đọc/hash/render. Không yêu cầu quyền rộng hơn nhu cầu thiết kế.

## Hướng thiết kế đã chốt

Giữ **Enterprise Precision A**, selective causal rail B và Comfortable mặc định / Compact tùy chọn. Không mở lại discovery hay đổi brand/font/palette. Dùng tasteskill theo **app-screen**, Hallmark theo **app scope/refinement**, Impeccable theo **Operate** khi các skills có sẵn; đọc hướng dẫn trước khi áp dụng. Nếu skill/engine thiếu, ghi rõ và dùng approved project context, không tự cài hoặc đổi provider.

“Ấn tượng” phải thể hiện ở việc nhìn ra vấn đề nhanh, đọc hồ sơ dễ và thao tác liền mạch: hierarchy rõ, typography chính xác, alignment/spacing nhất quán, tương tác có chủ đích. Không marketing hero, vanity KPI, readiness percentage, gradient/glass hoặc animation trang trí. Product rules và khả năng đọc legal text cao hơn các lint shortcut chung.

Giữ body 14px/1.5, metadata 12px, heading 22px và spacing base 4px của selected system; mono chỉ dành cho IDs/time/code/data phù hợp. Comfortable/Compact giữ cỡ chữ, thay spacing; hàng phải tăng chiều cao cho nội dung dài. Màu trạng thái có ý nghĩa, luôn kèm chữ/lý do. Icon Lucide thống nhất; animated accent chỉ khi giúp hiểu activation/pending/feedback, có static reduced-motion fallback; không thêm thư viện/CDN hoặc trộn Potlab/Lordicon.

## Các phần cần sửa và hoàn thiện

**1. Causal navigation có đường quay lại rõ ràng.** Prototype hiện chỉ giữ một current record; reverse dependency link vẫn mở lại record cũ nhưng chưa có Back theo lịch sử điều hướng. Thiết kế và thực hiện local prototype trail: AC-05 → RQ-04 → ER-04/proof → RQ-04 → AC-05 → Grid. Phân biệt Back-to-record, Back-to-previous-record và Close-to-origin. Giữ draft từng record, filters, sort, selection, scroll và exact opener/focus; có fallback rõ khi origin không còn hợp lệ. Mobile dùng full-screen detail có Back, không bắt người dùng tự tìm đường qua graph.

**2. My Actions trở thành queue để làm việc.** Tách Eligible, Waiting On, Blocked và Historical/Completed; giải thích zero eligible bằng nguyên nhân thật. Một Action WAITING+BLOCKED vẫn giữ cả hai trục; nếu xuất hiện ở hai nhóm thì cùng identity/draft/selection và có giải thích, không nhân đôi số lượng công việc. Thiết kế theo current actor; U-01 chỉ là fixture alias. Không biến Requirement thành Action, không bịa việc có thể làm để lấp empty state.

**3. Control Room có một điểm nhìn chính.** Giữ thứ tự Blockers → Next Actions với Important Decisions kề bên → Waiting On → Milestones → Evidence Gaps → Changes. Causal chain phải đọc được condition/cause → impact → accountable owner → permitted next step, không thành một dãy card dày chữ khó scan. Detail/progressive disclosure giữ đủ lý do và proof khi mở, không truncate thông tin pháp lý. Giữ scope, role và as-of rõ; missing/unavailable/stale không được hiển thị như zero/READY.

**4. Hoàn thiện trải nghiệm toàn bộ 13 screen IDs hiện có.** Giữ nguyên identity, FR/AC mapping và ba Golden Workflows. Bao phủ shell/session/Matter selection/admin, Control Room, Grid/My Actions/Waiting On, Requirement detail, Action detail, dependency/impact, evidence review, document versions/signatures, Filing/package/cycles, bulk preview/results, import wizard, draft brief/export và scoped event history. Một số là subview; không tạo thêm route nghiệp vụ chỉ để đủ số màn.

Mỗi screen/subview cần composition cụ thể, dữ liệu/actor/permission, primary action, fields/validation, entry/exit/return, keyboard/mobile và chín state: loading, empty, no-match, unavailable, forbidden, stale, conflict, partial, recovery. Cung cấp navigable source prototype cho các flow chính và các state quan trọng bằng fixtures có nhãn; phần chưa interactive phải ghi SPECIFIED_ONLY và mô tả đủ để implement. Không thay màn phức tạp bằng đoạn văn “sẽ làm sau”. Prototype là minh họa thiết kế, không có auth/persistence/enforcement thật; tuyệt đối không giả một server save/verify/upload/export thành công.

**5. Grid và forms dùng được trong công việc dài.** Search/filter/sort/paging/selection rõ phạm vi; hidden selected IDs phải được nêu trước bulk. Giữ nguyên draft khi conflict hoặc dialog remount; unknown write phải reconcile trước resend, không có Overwrite tùy ý. Row keyboard không chiếm phím nhập văn bản/IME của nested input. Có persistent label/error, error summary, focus/focus-return và lý do disabled đọc được. Mobile có đủ matching records, reasons và các simple updates; complex comparison/bulk/import có staged flow/desktop alternative rõ, không xóa P0 hoặc quyền khỏi mobile.

**6. Giữ nguyên sự thật nghiệp vụ khi làm đẹp.** Requirement khác Action; năm state axes tách biệt. Completion không tự verify; designated independent verifier khác submitter, OWNER không mặc định có quyền verify. Upload không tự promote version hoặc đổi Filing stage; receipt khác approval. Filing giữ đầy đủ các stage, repeated supplement/response cycles và proof epoch/reopen theo approved interpretation. Bulk chỉ title/description/internal owner/due, per-record atomic mutation+audit và explicit partial/unknown results. Brief tách recorded changes `(t1,t2]` khỏi outstanding tại t2, có provenance và authorized scope. Assignment không cấp quyền truy cập; revoked view phải purge protected values/drafts.

Atlas giữ 24 records, 12 Requirements/12 Actions, bảy edges, Action census 4 completed / 3 waiting / 5 not started / 0 in progress; zero eligible Next Action; MS-01..03 thiếu declared required sets thì UNASSESSED. Không sửa canonical dataset để có demo đẹp hơn. DENSITY-50/100/200 và các workflow progression là fixtures riêng có nhãn. Giữ historical self-review caveat và tất cả historical finding records.

**7. Sửa các claim chưa có bằng chứng trong R3.** R3 design-delta nói đã xác nhận focus không bị clip và sticky không bị ảnh hưởng, trong khi rendered tests NOT_RUN. Trong R4, phân biệt CSS intent/static reasoning với measured behavior; chỉ ghi CONFIRMED_RENDERED khi đã thật sự quan sát exact revision. Không dùng viewport-level overflow clipping để giấu overflow hoặc vượt lint; giữ region scroll và kiểm tra focus/long text/reflow khi được phép. Row sizing phải kiểm tra trên rendered table thật, không suy ra bảo đảm 44/36px từ một khai báo min-height. Dùng một authority token/spacing đúng, giải thích mọi shorthand để tránh lệch giữa “base 4px” và mô tả “8px grid”. Không sửa lại immutable R3 để che lịch sử.

## Kiểm tra và vòng tự sửa

Tự kiểm tra coherent semantics, FR/AC/screen links, 13-screen state coverage, full GW sequences, fixture census, embedded CSS/export consistency, IDs/labels/links và prototype navigation/draft state. Sửa các lỗi phát hiện được trong cùng assignment, không xin prompt riêng cho từng finding.

Nếu môi trường thực sự cho phép browser/render, chạy và nhìn exact export ở desktop 1440×900/1280×800, tablet 768px, mobile 390px và 200% zoom; hai densities, long EN/VI text, last row ở 50/200 records, nested modal/back/focus, errors/conflict/unknown và reduced motion. Capture → inspect → fix → recheck; lưu actual revision/viewport/tool/time và ảnh đã xem. Work browser từng bị disabled: không dùng alternate browser/CLI/OS capture để vượt restriction. Nếu vẫn bị chặn, hoàn thành source/spec, ghi rõ visual/keyboard/touch/assistive NOT_RUN hoặc VERIFICATION_BLOCKED; không tự cấp PASS. AC-137 vẫn cần năm quản lý thật theo protocol đã duyệt; không dùng synthetic participants hay suy ra kết quả từ screenshot.

## Bàn giao một lần, dùng ngay trong plan đang chạy

Chỉ tạo **`docs/design/p0-handoff-r4/`** nếu chưa tồn tại; nếu trùng, báo collision, không ghi đè. Không sửa R1–R3, apps/backend, apps/frontend, ZCode workboard/contract, AGENTS hay formal ledgers. Không provision, deploy, commit, đổi provider/settings hoặc tự gửi dữ liệu sang một agent khác. Làm trực tiếp trong project hiện tại bằng mode đã chọn, không khởi động một workflow OpenDesign Cloud/Local Codex lồng nhau.

Xuất một bộ thống nhất: `current-ux-spec.md`, `screen-state-matrix.json`, `prototype.html`, `polish.css`, `design-delta.md`, `findings-disposition.json`, `validation-plan.md`, `zcode-handoff.md`, `return.md`; thêm captures/logs nếu thực sự tạo được bằng công cụ được phép. Return pin đúng tất cả deliverables/supporting artifacts bằng bytes/SHA-256, actual author/tool/revision và tests run/not-run. Historical findings giữ nguyên; thêm current dispositions riêng, không tự đóng các gate cần reviewer.

`zcode-handoff.md` phải là một hướng dẫn tích hợp toàn bộ design vào **assignment BE+FE W1–W7 đang chạy**, không phải nhiều task chờ giao lại: screens/components/interactions/tokens/state/semantic data needs và cách tự kiểm tra. Tái sử dụng generic primitives; business compositions dưới `apps/frontend/src/features/*`. Đối chiếu contract hiện hành bằng read-only, không phát minh endpoint/DTO/ETag/auth semantics. Nếu thiếu wire binding, ghi rõ dependency để ZCode xử lý trong cùng contract/plan; không biến yêu cầu thiết kế thường lệ thành một vòng approval mới.

Giữ design/spec, rendered validation, product enforcement và independent acceptance là bốn trường kết quả riêng. Nộp một gói R4 hoàn chỉnh với danh sách thay đổi thực, acceptance evidence, phần chưa kiểm và rủi ro. Không tự đánh dấu MC-002/STEP03A/STEP03B/production DONE hoặc tuyên bố đã có external agent execution.
