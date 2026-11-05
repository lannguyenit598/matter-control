# MATTERCONTROL — HOÀN TẤT UI VÀ HANDOFF TỪ DESIGN R6

Tiếp tục project hiện tại. Nhiệm vụ **MC-P0-DESIGN-R7-UI-FINALIZATION**: xử lý R6-E01..E03, hoàn thiện chất lượng UI và trả **một gói bàn giao thống nhất** cho ZCode tiếp tục plan BE+FE W1–W7.

Làm đến hết phần được phép: sửa source/spec, tự kiểm tra và sửa lỗi, rồi trả kết quả tổng hợp. Không chỉ lập kế hoạch, không dừng sau từng màn/finding xin prompt mới. Giữ các sửa R6 đã đúng và hướng thiết kế đã chọn.

## 1. Đọc đúng nguồn và giữ phạm vi

Root local nếu project được phép truy cập:
`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

Đọc toàn bộ:
- `docs/reviews/p0-design-r6-intake-20261027.md`.
- `docs/design/p0-handoff-r6/return.md` cùng tám deliverables được pin trong return.
- Approved SRS/rules/state semantics/permission matrix/AC/GW trong `docs/requirements/`.
- `docs/product/project-atlas-dataset.md`, `docs/testing/p0-zcode-plan-20261026/coverage.json` và selected tokens dưới `docs/design/step-03a/revised/local-r3/`.
- Contract hiện hành `docs/implementation/p0-zcode-execution/local-contract.md` và `docs/implementation/handoffs/MC-P0-ZCODE-COMPLETE-PLAN-PROMPT.md`, chỉ đọc.

R6 return SHA-256: `583a18a48ed89caaec7aedebfb796789dd0399df2cc375f40b6de3ea5f0423c5`.
R6 intake SHA-256: `7f4ced49fbadc8add2e0eecff84ce2d6ac04a3bde40dde87402162738c42e98c`.

Xác minh input pins trước khi consume; ghi phiên bản contract thực đọc. Nếu thiếu nguồn, báo chính xác ảnh hưởng, không giả đã đọc/render hoặc tự bịa requirement. Tiếp tục trong mode/project hiện tại, không khởi động workflow lồng nhau hay tự đổi provider/settings.

## 2. Sửa proof presentation — R6-E01

- RQ-03 phải nhất quán giữa record, Grid và proof panel: giữ historical VERIFIED của canonical T0; hiển thị self-review/current-policy caveat riêng. Không chuyển một panel sang UNVERIFIED nếu chưa có assessment/snapshot mới được ghi rõ.
- RQ-05/DEP-05: tách historical reported state khỏi current-policy evaluation. Không vừa mô tả gate historical satisfied vừa dùng các field khác snapshot để tính một kết luận trái ngược mà không giải thích. Không đặt proof valid chỉ để làm assertion pass.
- Biến `AC-DEMO-PROOF` thành một fixture riêng có nhãn và có control mở được từ UI; khai báo record, proof applicability, criterion/version/actors rõ. Không chỉ để một entry không thể truy cập trong proof map, không thêm nó vào canonical Atlas 24 records hoặc các totals của Atlas.
- Giữ Action/Filing có verification khi proof được yêu cầu rõ; NOT_REQUIRED chỉ khi có explicit applicability. AC-05 không mượn proof RQ-05. Giữ AC-06 COMPLETED/READY, owner U-03.

Kiểm tra typed relation, displayed state, owner, historical/current context và missing-proof cases cùng nhau. Source prototype không có quyền tạo một assessment pháp lý thật.

## 3. Kiểm tra và hoàn thiện UI thực tế

Giữ Enterprise Precision A, selective causal rail B, Comfortable/Compact, selected tokens và Lucide. Áp dụng tasteskill app-screen, Hallmark app scope/refinement và Impeccable Operate nếu có sẵn; không đổi brand/theme để thay cho việc sửa UX.

Tập trung chất lượng làm việc: hierarchy rõ, typography/alignment chính xác, causal chain dễ scan, primary cause/owner/permitted next step nổi bật; giảm các đoạn nguyên nhân lặp lại và dùng progressive detail. Legal text dài phải đọc đủ. Compact không giảm body font; màu luôn có chữ/lý do; motion có mục đích và reduced-motion fallback.

Nếu browser thực sự được phép, thực hiện capture → inspect → fix → recheck trên exact revision:
- Desktop 1440×900/1280×800, tablet 768px, mobile 390px và zoom 200% ở các trạng thái đại diện.
- Comfortable/Compact, long EN/VI labels/reasons/errors, hàng cuối của fixtures 50/200 records.
- Control Room → record → criterion/proof → Back → origin; Close/Escape/reopen; draft/selection/filter/scroll/focus preservation.
- Grid keyboard editing và nested input/IME; loading, empty/no-match, unavailable, forbidden, stale, conflict, partial và recovery.
- Named controls, visible focus, error association/announcement, modal keyboard behavior, touch targets và meaningful reading order.

Ghi actual viewport/zoom/tool/revision và ảnh đã xem; không suy viewport từ kích thước PNG. Sửa các lỗi quan sát được trong cùng assignment.

Nếu browser vẫn disabled trong Work settings, không dùng alternate browser, CLI renderer/`od export`, proxy/server/tunnel hay OS capture để vượt restriction; không tự đổi settings. Hoàn tất source/spec và đánh dấu đúng các visual/interactive cases VERIFICATION_BLOCKED. Không khẳng định UI đã đạt visual acceptance chỉ từ mock DOM, CSS hoặc lint.

## 4. Khôi phục protocol AC-137 — R6-E02

Sửa validation plan theo đúng AC đã duyệt:
- Năm representative managers thật.
- Unseen 50-row synthetic Matter, hai scenarios counterbalanced, answer key ghi trước và không gợi ý.
- Mỗi scenario phải trả đủ ba ý: major state, top blocker, next owner/action.
- Ngưỡng ≥4/5 managers trả đúng cả ba trong 10 giây; giữ thời gian/accuracy của từng người và từng scenario, không thay bằng trung bình.

Không thay protocol bằng hai câu hỏi Atlas quen thuộc hoặc dùng typography-only DENSITY generator thiếu causal relations làm dữ liệu nghiên cứu. Mô tả fixtures riêng có cấu trúc nghiệp vụ phù hợp và cách giữ unseen; key chỉ dành cho người điều phối, không lộ trên UI người thử.

Chỉ chuẩn bị protocol/fixtures/ledger template khi chưa có người thử. Actual study giữ NOT_RUN/AWAITING_HUMAN_TRIAL; không tự liên hệ người khác, bịa participant, câu trả lời, timing hoặc PASS. Không hỏi PO duyệt lại protocol đã chốt.

## 5. Evidence có thể tái kiểm chứng — R6-E03

Lưu actual source-check scripts trong output `checks/`, actual outputs/exit metadata trong `evidence/`, thay vì chỉ dẫn các file `/tmp` đã mất hoặc command có dấu `...`. Bind script, input revision, command/cwd/tool/version/UTC/exit và output hashes.

Chạy lại các checks bị ảnh hưởng, sửa đến khi source assertions hợp lệ. Giữ các kiểm tra FR/AC/GW/screen links, canonical counts/typed proof, standalone dependencies, navigation state, embedded CSS và component inventory. Dùng tooling hiện có; không cài thêm engine chỉ để có nhãn PASS.

Tách rõ bốn loại kết quả: source inspection/assertions, mock/unit execution, real browser interaction/render, product enforcement. Mock DOM bootstrap không chứng minh focus, reflow hoặc mọi click flow. Screenshot R4 không chứng minh R7. Flow chưa implement như actual verification/bulk/export giữ SPECIFIED_ONLY hoặc NOT_RUN, không giả business success. Sửa metadata CSS byte count bằng giá trị đo từ actual deliverable.

## 6. Xuất một gói cuối cho plan đang chạy

Chỉ tạo **`docs/design/p0-handoff-r7/`** sau khi kiểm tra chưa tồn tại; nếu collision, không ghi đè. Giữ nguyên R1–R6, application source, ZCode workboard/contract, AGENTS/security state và formal ledgers. Không install/provision/commit/deploy hay tự dispatch agent.

Xuất bộ thống nhất: `current-ux-spec.md`, `screen-state-matrix.json`, `prototype.html`, `polish.css`, `design-delta.md`, `findings-disposition.json`, `validation-plan.md`, `zcode-handoff.md`, `return.md`, cùng `checks/`/`evidence/` và captures chỉ khi có phép.

Rà đồng bộ spec ↔ matrix ↔ prototype ↔ validation ↔ handoff; giữ 20 FR, 63 AC, 14 NFR, 13 SCR/nine states, ba Golden Workflows và historical records. Ghi disposition E01..E03 bằng changed locations và actual evidence, không tự đóng independent gates.

Handoff là UX consumer specification dùng actual Atomic primitives và domain compositions `src/features/*`; không thay API/schema/security authority. Tích hợp vào **cùng plan BE+FE W1–W7 của ZCode**, không restart W0 hoặc thêm review gate sau từng wave.

Return ghi actual author/tool/mode, export revision, input/output bytes/SHA-256, commands/results, skipped checks và exact blockers. Chỉ ghi AUTHOR_COMPLETE_PENDING_REVIEW khi source/spec đầy đủ và applicable author checks thực pass; nếu còn mandatory execution blockers thì AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS, không gộp thành visual/product acceptance. Còn thiếu source/spec thì PARTIAL/IN_PROGRESS.

**Sửa và kiểm tra đến hết phần được phép, rồi trả một gói tổng hợp; không trả thêm planning pass hoặc nhiều handoff nhỏ.**
