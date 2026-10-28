# MATTERCONTROL — HOÀN TẤT CÁC SỬA DESIGN R5

Tiếp tục project MatterControl đang mở. Thực hiện **MC-P0-DESIGN-R6-CORRECTION**: sửa trọn R5-N01..N05, tự kiểm tra và trả một gói design thống nhất để ZCode tiếp nhận trong plan BE+FE W1–W7 đang chạy. Giữ phần R5 đã đúng; không thiết kế lại từ đầu, không dừng sau từng finding để xin prompt tiếp theo.

Root local nếu được cấp quyền đọc:
`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

Đọc toàn bộ:
- `docs/reviews/p0-design-r5-intake-20261027.md`.
- `docs/design/p0-handoff-r5/return.md` và tám deliverables được pin trong return.
- Approved SRS, rules, state semantics, permission matrix, AC/GW trong `docs/requirements/`.
- `docs/product/project-atlas-dataset.md`, canonical coverage `docs/testing/p0-zcode-plan-20261026/coverage.json` và selected tokens dưới `docs/design/step-03a/revised/local-r3/`.
- Contract hiện hành `docs/implementation/p0-zcode-execution/local-contract.md`, component inventory/rules và `docs/implementation/handoffs/MC-P0-ZCODE-COMPLETE-PLAN-PROMPT.md`, chỉ đọc.

Input pins:
- R5 return: `85641ebfa6e3bc9de37cee954f9037f15c6644908aba404a7b98bd87b58267bc`.
- R5 intake: `bdb5f3c606975888e3d02dedde92419d0e29fa4f3d61e1a47ee1c23aa7085586`.

Xác minh các pin và tám output hashes trước khi consume. Nếu thiếu nguồn, báo chính xác phần thiếu; không giả đã đọc hoặc tự dựng requirement. Dùng mode/project hiện tại, không khởi động workflow lồng nhau hay đổi provider/settings.

## Sửa bắt buộc trong cùng một lượt

**N01 — Prototype thiếu helper `$`.** Khai báo một helper lookup local trước các callers hoặc dùng DOM lookup trực tiếp nhất quán. Trang standalone không được phụ thuộc `$` từ DevTools, host injection hoặc test harness. Kiểm tra undefined identifiers/dependencies bằng tooling được phép. `node --check` chỉ kiểm cú pháp, không chứng minh bootstrap chạy được. Khi browser được phép, kiểm initial render và console trên exact export.

**N02 — Proof applicability và canonical facts.** Giữ explicit typed record/criterion/evidence/version relations. Không quy định mọi Action đều NOT_REQUIRED hoặc proof chỉ thuộc Requirement: approved semantics cho phép Action/Filing có verification khi proof được yêu cầu rõ. NOT_REQUIRED cần explicit applicability, không suy ra từ việc lookup không thấy dữ liệu.

Sửa AC-06 về đúng canonical COMPLETED/READY, owner U-03; không mô tả bị chặn. Với RQ-05/DEP-05, giữ historical baseline và phân biệt current-policy caveat với một snapshot thực sự đã recompute. Không âm thầm chuyển historical VERIFIED thành current UNVERIFIED hoặc khẳng định DEP-05 blocked. AC-05 vẫn NOT_REQUIRED và không mượn proof của RQ-05. Thêm kiểm tra đối chiếu panel với canonical state/owner/edge facts; dùng fixture riêng có nhãn để minh họa proof-required Action. Không sửa Atlas để làm test pass.

**N03 — Back phải khôi phục saved mode.** Giữ popped record/mode trong biến local qua `openRecord()`; không kiểm tra mode vừa bị hàm đó ghi đè. Cover record → proof → breadcrumb sang record trước → Back về đúng proof. Breadcrumb phải quay về/truncate trail, không cứ append lại ancestor. Giữ centralized cleanup khi fresh-open/Close/Escape, real origin và per-record drafts riêng. Kiểm cả close/reopen, Waiting On/Filing origins và focus fallback; không ghi browser PASS từ source reasoning.

**N04 — Hiệu chỉnh validation/evidence.** Các flow tạo Requirement, submit/verify proof, bulk atomic, promotion, Filing cycles và XLSX export chưa được prototype thực thi thì không gán CONFIRMED_IN_PROTOTYPE như đã chạy. Tách rõ SPECIFIED_ONLY/source inspection, actual execution và independent acceptance. R4 screenshot không chứng minh R5/R6 render. Không copy trạng thái PASS/CONFIRMED cũ sang revision mới.

Bàn giao source-check scripts/logs thực tế có command, tool/version, UTC, exit, input/output pins và actual result. Lint sạch và syntax pass không chứng minh bootstrap, auth, proof hay usability. Controls không hoạt động phải ghi rõ specimen/non-operational, không giả retry/recovery/save thành công.

**N05 — Handoff đúng codebase và authority.** Sửa `components/ui/` không tồn tại thành inventory thật dưới `apps/frontend/src/components/{atoms,molecules,organisms}/`; brace notation là danh sách thư mục. Reuse primitives, business compositions dưới `src/features/*`; không tạo thêm UI layer. Handoff là UX consumer specification, không tự thay backend API/security/schema contract đang được ZCode version hóa. Không sửa contract của ZCode để khớp design prose.

## Giữ nguyên và hoàn thiện đồng bộ

Giữ Enterprise Precision A, causal rail B, Comfortable/Compact, selected tokens và Lucide. Áp dụng tasteskill app-screen, Hallmark app scope và Impeccable Operate nếu có sẵn. Giữ đủ 20 FR, 63 AC, 14 NFR, 13 SCR/nine states và ba Golden Workflows; không đổi identities, roles hoặc semantics đã duyệt. Giữ các sửa đúng về token server-side/opaque cookie, upload không tự đổi stage, EDITOR/OWNER assignment, CSV/XLSX import/scoped XLSX export và My Actions groups.

Rà toàn bộ spec ↔ matrix ↔ prototype ↔ validation ↔ handoff, không chỉ sửa riêng một file hoặc disposition. Tự sửa các lỗi còn phát hiện trong phạm vi. Không mở lại style/discovery hoặc hỏi routine implementation choices.

Chạy checks source/non-DOM phù hợp với công cụ được phép. Nếu browser được phép, capture → inspect → fix desktop/tablet/390px, 200% zoom, hai densities, long EN/VI, modal/keyboard/focus. Nếu browser disabled, không dùng CLI renderer/`od export`, alternate browser, proxy/server hay OS capture để vượt restriction; hoàn tất source/spec và giữ affected checks VERIFICATION_BLOCKED. AC-137 cần người thật, không tạo participant/timing giả.

## Một bộ bàn giao cuối

Chỉ tạo **`docs/design/p0-handoff-r6/`** sau khi xác minh chưa tồn tại; nếu collision thì không ghi đè. Bảo toàn R1–R5, application source, ZCode workboard/contract, AGENTS, security state và formal ledgers. Không install/provision/commit/deploy hay tự dispatch agent.

Xuất một bộ thống nhất: `current-ux-spec.md`, `screen-state-matrix.json`, `prototype.html`, `polish.css`, `design-delta.md`, `findings-disposition.json`, `validation-plan.md`, `zcode-handoff.md`, `return.md`, cùng actual check scripts/logs và captures chỉ khi có phép.

Disposition N01..N05 phải có changed locations, expected/actual evidence và giới hạn. Giữ historical records, thêm correction records riêng. Return ghi actual author/tool/revision, commands/UTC/exits/skips và bytes/SHA-256 của mọi deliverable/supporting artifact; báo hash return riêng, không self-hash lồng vòng.

Handoff tích hợp toàn bộ design vào plan BE+FE W1–W7 đang chạy, không restart W0 hay thêm per-wave review gates. Chỉ ghi AUTHOR_COMPLETE_PENDING_REVIEW khi source/spec đã đầy đủ và applicable checks thực pass; nếu thiếu mandatory execution thì AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS kèm exact cases. Còn thiếu code/spec thì PARTIAL/IN_PROGRESS. Không tự cấp independent approval hoặc product/production DONE.

**Thực hiện sửa và kiểm tra đến hết năm findings, rồi trả một gói tổng hợp; không trả thêm planning pass.**
