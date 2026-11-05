# MATTERCONTROL — HOÀN TẤT DESIGN R9 TỪ CHECKPOINT HIỆN TẠI

Tiếp tục **chính phiên thiết kế MC-P0-DESIGN-R9-TARGETED-CORRECTION đang chạy**, không khởi tạo task mới, không tạo R10, không thiết kế lại từ đầu. Output vừa rồi là progress/checkpoint, chưa phải return hoàn tất. Hãy hoàn thiện trọn R8-N01..04, tự kiểm tra/sửa đến hết và trả **một candidate R9 tổng hợp** cho Claude Code consume.

Không dừng ở “đã khởi chạy agent nền”, “29 checks pass”, “đã viết regression” hoặc một planning pass nữa. Nếu đã có worker/run thực sự thuộc task này, tiếp nhận đúng kết quả của nó thay vì tạo writer trùng; không tự spawn thêm agent. Chỉ báo hoàn tất sau khi kiểm tra actual outputs. Nếu bị giới hạn context, lưu checkpoint chính xác để resume; không hứa một background completion không có cơ chế thực.

## 1. Resume đúng nơi, bảo toàn ownership

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch `codex/unified-project-flow`.
HEAD tham chiếu `a62d838791ba188838c4ff00b7b6e265ac775056` — phải kiểm tra actual HEAD và working bytes.

**`docs/design/p0-handoff-r9/` hiện đã tồn tại.** Câu “chưa tồn tại” trong progress trước là lịch sử, không phải chỉ dẫn xóa/khởi tạo lại. Xác minh đây là checkpoint của cùng task, đọc actual source rồi resume; không overwrite changes của phiên khác. Chỉ ghi trong thư mục R9. Không sửa R1–R8, reviewer evidence, product BE/FE, ops, implementation workboard/contract, AGENTS, formal ledgers hoặc security state.

Đọc root/applicable rules, dùng RTK, Semble-first cho khám phá. Không đổi account/model/provider/settings; không auth/install/khởi động generation workflow lồng nhau, không Git stage/commit/merge/push/deploy hoặc security/permission bypass.

Đọc đầy đủ các input sau, relative với root trên:

- `docs/implementation/handoffs/MC-P0-DESIGN-R9-TARGETED-CORRECTION-PROMPT.md` — toàn bộ phạm vi gốc vẫn giữ nguyên.
- `docs/reviews/p0-design-r9-intake-20261027.md` và `docs/reviews/p0-design-r9-recheck-20261027.md` — feedback mới nhất.
- `docs/testing/p0-claude-w1-review-20261027/{closing-check.json,design-r9-diagnostics.cjs,design-r9-diagnostics.json}` và hai cặp stdout/stderr/receipt của `check_r8_n01_n04_regressions.js`, `check_mock_dom_bootstrap.js`.
- `docs/testing/p0-design-r9-recheck-20261027/receipt.json` — 27 current R9 pins khớp lần review trước, không phải evidence của một run mới.
- Actual R9 source/checks/spec/matrix/study/ledger/return. Đọc approved requirements/state semantics/permission matrix/Atlas/GWs cần thiết.
- `docs/implementation/p0-zcode-execution/local-contract.md` **chỉ đọc**: lấy current revision/hash và reconcile; implementation có thể tiến hợp lệ. Không ép về revision cũ, không ghi đè contract.

Latest reviewer observations không chứng minh một export ngoài repo chưa xuất hiện là đã thất bại; chúng chỉ xác định checkpoint local đã kiểm tra. Nếu có progress mới của chính task sau receipt, ghi rõ delta rồi kiểm tra source mới, không reset để ép hash.

## 2. Ưu tiên xử lý regression đỏ trước khi claim green

Reviewer chạy trên R9:

- `check_mock_dom_bootstrap.js`: **29/29 pass**, exit 0.
- `check_r8_n01_n04_regressions.js`: **exit 1 sau 4 passes**. First failure ở promotion reason `.value` sau navigation.
- Diagnostic chạy tiếp từng assertion: 8 pass / 5 fail trong 13 assertions. Đây không phải passing suite thay thế.
- Generated textarea markup vẫn chứa lý do promotion đã nhập. `strict_dom.js` không hydrate textarea value từ child text; option text/default value và checkbox semantics cũng chưa mô phỏng đầy đủ. Vì vậy **không suy luận từ failure này rằng real browser mất draft**.

Làm root-cause chính xác:

1. Đọc mock, regression và actual concept source. Sửa **tối thiểu** test adapter cho semantics được các tests sử dụng: textarea child text/default value, option text/value fallback và selected/default selection, boolean checked/change behavior. Không xây DOM framework mới, cài dependency hoặc renderer.
2. Có selfchecks nhỏ xác nhận adapter xử lý các primitive ấy đúng; không trả “success” bằng catch/swallow/auto-create mọi missing node. Giữ strict missing-ID mutations và các negative assertions cũ.
3. Không sửa prototype thành HTML sai, thêm `value` attribute giả vào textarea hoặc đổi control semantics chỉ để chiều mock. Không bỏ assertions khó, đổi marker/expected value cho khớp lỗi hoặc claim diagnostic continuation là suite pass.
4. Với adapter đã đúng, chạy lại actual regression; failure còn lại của source thì sửa source trong R9 và regenerate outputs từ supporting source.
5. Kiểm expected-current test: thật sự chọn một guard KHÁC current, có valid non-current target/reason/ack, rồi chứng minh stale guard bị từ chối. Assertion kiểu “no target selected” không chứng minh concurrency guard đúng. Test đổi target cũng phải có valid trước/sau và chứng minh acknowledgment bị reset theo intent.
6. Red→green dùng cùng adapter đủ đúng, baseline R8 read-only và R9 corrected source để tách lỗi fixture/mock khỏi lỗi concept. Không chỉnh R8 hoặc fabricate red execution trước đây. Nếu baseline không thể chạy tương đương, ghi đúng giới hạn; không tự nhận một red run chưa có.

Chỉ ghi exact test/assertion counts từ invocation thực tế. Không mặc định 13 assertions đều phải fail trên baseline vì một số bảo vệ behavior vốn đã đúng.

## 3. Hoàn tất cả ba sửa đổi UX, giữ phần đã đúng

**R8-N01 — purge thật:** shared access-loss boundary xóa protected record/form drafts, selected bulk state, pending intent/preview/result và drawer trail của scope mất access. Revoke→regrant không hồi sinh dữ liệu. OWNER→VIEWER còn scoped read không bị nhầm là mất access. Logout/explicit discard dùng cleanup nhất quán. Không xóa state scope không bị ảnh hưởng. Nếu fixture chỉ có một identity/Workspace/Matter, ghi rõ giới hạn và dùng fixture tối thiểu để kiểm isolation cần thiết; không claim multi-scope proof từ single-scope state. Outcome đang UNKNOWN không tự thành failed/success/resend; mất readback không cho lộ protected payload.

**R8-N02 — giữ intent hợp lệ:** Create Matter title và promotion target/expected-current/reason/ack có lifecycle nhất quán, keys theo đúng identity/scope/document. Giữ input qua view/locale/re-render khi còn quyền; không bleed giữa documents/scopes. Current revision/target/impact đổi thì invalidation/rebase rõ ràng, không âm thầm giữ ack cũ hoặc thay expected-current để che stale intent. Revocation/logout/discard xóa đúng phạm vi, không giữ dữ liệu đã mất quyền để tiện retry.

**R8-N03 — promotion target độc lập:** target riêng với expected-current guard; preview current→target và impact theo target thực chọn; fixed references giữ nguyên, current-following references và criteria được giải thích đúng. Missing/invalid target, thiếu reason/ack, target=current và stale guard có kết quả đúng, không success giả/force-save/auto-verify. OWNER promote, EDITOR add-version, VIEWER scoped read giữ nguyên. Wire chưa định nghĩa thì `DEPENDENCY_PENDING`; đây là concept intent, không gọi API/promote/upload thật.

Giữ toàn bộ approved vocabulary, typed proof/causality, historical/current-policy distinctions, CAS 428/412, receipted vs nonreceipted recovery, persona/role/operation separation, full screen flows và original GWs. Giữ Enterprise Precision, Comfortable/Compact, EN/VI legal text và Lucide direction. Không thêm style vote hoặc feature ngoài scope.

## 4. R8-N04 — chốt hồ sơ R9 đúng thực tế

Current local `return.md` vẫn là bản R8; `findings-disposition.json` vẫn inherited ledger, chưa có current R9 disposition. Hoàn tất ngay trong cùng task:

- Đồng bộ current title/task/revision/owner trong return, spec, delta, validation, handoff và ledger. Historical provenance giữ nguyên, không tìm-thay R7/R8 hàng loạt. Consumer execution hiện là **actual Claude Code làm BE+FE**; có thể giữ filename `zcode-handoff.md` để nối lịch sử nhưng ghi owner đúng.
- Giữ nguyên nghĩa và attribution của **48 historical finding records** theo baseline gốc; xác minh census thực, append current R8-N01..04 cùng source locations/tests/evidence/remaining limits. Không sửa historical verdict thành independent closure. Nếu census khác phải báo exact difference, không thêm record giả để đủ số.
- Mỗi finding dùng `SOURCE_CORRECTED_PENDING_REVIEW` hoặc partial/open đúng bằng chứng. Author check pass không phải independent acceptance.
- Sửa dangling commands: cung cấp script thật cần thiết hoặc bỏ tham chiếu file không tồn tại. Mọi command trong validation-plan phải chạy được trên R9, không trỏ R8 rồi gọi R9 pass.
- Structural coverage phải kiểm exact 20 FR / 63 AC / 14 NFR / 13 screens / nine-state matrix / 3 original GWs và reciprocal mapping theo canonical sources. Structural presence không phải behavioral AC PASS.
- Capture fresh per-attempt command/argv, cwd, actual tool/version, UTC, exit, raw stdout/stderr và hashes trong `evidence/` của R9. Không ghi đè attempt đã pin, copy timestamps/logs R8 thành R9 hoặc claim “6 checks pass” mà không giao receipts.
- Regenerate prototype/participant artifacts từ corrected supporting source; kiểm embedded JS/CSS/datasets byte identity. Không hand-edit export bỏ quên builder/source.
- Full manifest pin bytes/SHA-256 cho mọi deliverable cần reproduce/consume: spec/delta/matrix/CSS/prototype/handoff/ledger/validation, supporting source/checks và study/participant/facilitator assets/evidence. Facilitator key không được embed vào participant bundle.
- Tránh hash cycle: manifest loại chính nó và `return.md`, ghi rõ exclusions; return pin manifest; hash/bytes của return báo riêng trong final message. Inventory không có undeclared/missing payload. Không tự tham chiếu vòng hoặc bỏ supporting modules để “pins match”.

## 5. Validation và đúng evidence tier

Sau khi sửa, chạy affected tests rồi toàn bộ available source/mock regression trên **R9 paths**. Giữ failures thật và corrective attempts. Cần đủ existing checks, new N01..03 regressions, mock adapter selfchecks, export identity, manifest và structural coverage. Tự sửa đến khi mọi nonbrowser check applicable pass; nếu còn thất bại thì báo partial, không nói author complete.

Phân biệt `SOURCE_CHECKED`, `MOCK_EXECUTED`, `BROWSER_EXECUTED`, `NOT_RUN`, `VERIFICATION_BLOCKED`. Đừng gọi script/mock là “runtime UI PASS”. Nếu browser đang disabled/unavailable, không thử CLI/headless/export/alternate-browser/server/proxy/native-capture để bypass. Hoàn tất source/mock/evidence và giữ rendered geometry/focus/keyboard/touch/screen-reader/real usability bị chặn. AC-137 cần người dùng thật; study fixtures không là participant results.

Không cần chờ Claude implement xong để hoàn thành design package. Không sửa source BE/FE, product workboard hoặc nhắn agent khác. Handoff chỉ mô tả exact delta, không thêm review gate theo từng wave, không restart W0 và không phát minh routes/ETags/enums/policy.

## 6. Một return cuối, không thêm progress-only response

Trước final, tự kiểm:

1. Current R9 source và generated outputs đồng bộ; mọi targeted nonbrowser assertion đã có actual results, negative tests không bị yếu đi.
2. R8-N01..04 có current dispositions, regression/evidence và exact remaining limits; lịch sử giữ nguyên.
3. Validation commands có thật; output inventory/pins đầy đủ, không cycle; participant không lộ facilitator answer key.
4. `return.md` thật sự của R9, ghi actual author/tool/mode/root/branch/base, current contract read hash, original/current source snapshot, tests/cwd/UTC/exits/evidence/pins, consumer delta và risks.
5. Source/spec/tests/evidence còn thiếu → `PARTIAL`/`IN_PROGRESS` kèm exact remaining work. Source/package đầy đủ và nonbrowser checks pass, chỉ còn browser/human/independent evidence → `AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS` / `READY_FOR_INDEPENDENT_REVIEW`. Không self-award DONE/ACCEPTED hoặc product/security/release PASS.

Final message cần: đường dẫn return, bytes + SHA-256 của return và manifest; từng finding đã sửa/còn mở; exact test counts và evidence locations; phần browser/human chưa chạy; next action là Codex intake + Claude consume delta. Không coi completion badge hay câu “agent sẽ báo sau” là deliverable.

**Thực hiện tiếp từ checkpoint R9 hiện có, sửa mock/regression và hoàn thiện evidence/ledger/manifest/return trong cùng lượt. Không làm lại từ đầu, không chuyển task nhỏ, không dừng ở 29 checks cũ.**
