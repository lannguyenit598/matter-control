# MATTERCONTROL — DESIGN R9: SỬA BỐN FINDINGS R8 TRONG MỘT LƯỢT

Tiếp tục **phiên thiết kế hiện tại**. Task **MC-P0-DESIGN-R9-TARGETED-CORRECTION**, priority P0. Codex đã kiểm tra R8, chạy lại các check có thật và 29 mock assertions, sau đó tái hiện ba lỗi concept/UX và một lệch handoff/evidence. Hãy sửa gộp **R8-N01..04**, tự kiểm tra/sửa đến hết, rồi trả **một candidate tổng hợp**.

Không thiết kế lại từ đầu, không thêm feature, không mở lại direction/requirements, không trả thêm planning pass hoặc dừng sau từng finding. Giữ toàn bộ phần R8 đã đúng. Claude Code đang implement sản phẩm BE+FE trong **một phiên khác**; task này chỉ sửa design package, không sửa source sản phẩm và không chờ implementation xong.

## 1. Đúng nguồn, đúng ownership

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch chuẩn bị: `codex/unified-project-flow`.
HEAD preparation: `a62d838791ba188838c4ff00b7b6e265ac775056`.

Xác nhận actual root/branch/HEAD, author/tool/mode và input bytes trước khi làm. Đọc AGENTS/rules applicable; shell prefix RTK, Semble-first khi khám phá. Không overwrite thay đổi của người khác, không tự spawn thêm agent, không đổi account/model/provider/settings hoặc khởi động generation workflow lồng nhau.

Đọc đầy đủ:

- **Review R8:** `docs/reviews/p0-design-r8-intake-20261027.md`, **12,444 bytes**, SHA-256 `2fc0e55939c6caedfb7c036b1727ed044cb6253410bbd6a26d45eca77ad4eb04`.
- **R8 return:** `docs/design/p0-handoff-r8/return.md`, **11,319 bytes**, SHA-256 `ba6e720a865b989f04416d1631d16317df049d4e0050c1005d21b55bc5f1b1db`.
- **Reviewer full package pins:** `docs/testing/p0-design-r8-intake-20261027/receipt.json`, **23,701 bytes**, SHA-256 `84e2ce59dd6467797d1c0d256d74fa5619ff469802d6a9665b71d83e7317a9b0`; kiểm tra `package_pins` trước khi consume R8 supporting files.
- Reviewer regression reproducer `docs/testing/p0-design-r8-intake-20261027/reviewer-probes.cjs`, SHA-256 `e27fb28a69a87e59f1fe44811eb68a7de87ea05cdd3f0fe32c1504296c6be022`; đọc cùng `reviewer-probes-rerun.json`. Receipt đầu có lỗi hashbang loader của reviewer đã sửa; không coi đó là lỗi prototype.
- R8 spec/matrix/source/prototype/checks/study assets và các approved requirements/rules/state semantics/permission matrix/GWs liên quan.
- Living contract `docs/implementation/p0-zcode-execution/local-contract.md` **chỉ đọc**: lấy actual revision/hash hiện hành. Claude implementation có thể đang cập nhật hợp lệ; không ghi đè hoặc ép nó quay về revision cũ. Nếu có delta mới, reconcile đúng phạm vi, không restart task.

**Chỉ ghi `docs/design/p0-handoff-r9/`**, sau absence/ownership check. Nếu là checkpoint của chính task thì verify và resume; collision của phiên khác thì không overwrite. Giữ R1–R8 và reviewer evidence immutable. Không sửa `apps/backend`, `apps/frontend`, `ops/`, workboard/contract của implementation, approved requirements, AGENTS, formal ledgers hoặc security state. Không stage/commit/push/merge/provision/deploy, đọc credential, gọi agent khác hoặc retry action bị từ chối.

## 2. R8-N01 — Purge thật trong concept khi mất access

Lỗi đã tái hiện: mở RQ-04 → nhập title draft riêng → role REVOKED → panel nói đã purge → role OWNER → mở lại RQ-04, draft cũ vẫn xuất hiện. Shared drafts Map và protected operation intent chưa bị clear; thay HTML không phải purge state.

Sửa tại shared access-loss/state boundary, không chỉ đổi câu thông báo:

- Khi access thực sự mất trong fixture, loại bỏ protected draft/selection/pending-preview/result/intent state và protected drawer trail của **đúng identity/Workspace/Matter bị ảnh hưởng**, trước khi render denied state.
- Re-grant sau đó không được phục hồi nội dung đã purge từ cache cũ. Nếu có outcome của lệnh đang bay, giữ UNKNOWN và đường authorized-owner reconciliation phù hợp; không giữ protected payload để tiện retry hoặc tự resend.
- Phân biệt revocation với downgrade còn read rights. Không xóa mọi draft của scope khác hoặc làm hỏng recovery được phép. Giữ đúng approved permission/privacy semantics, không tự phát minh retention policy.
- Logout/explicit discard và các state chuyển access thật dùng cùng cleanup phù hợp; một selector xem state specimen không được âm thầm tuyên bố đã thực hiện business command.
- Vì đây là concept synthetic, ghi rõ purge được chứng minh trong local concept state; không gọi đó là product authorization/security PASS.

Regression bắt buộc: draft không trở lại sau revoke→re-grant; selected/protected bulk state không hồi sinh; downgrade vẫn có scoped read không bị nhầm thành mất toàn bộ access; unaffected-scope recovery vẫn đúng. Test phải kiểm actual state/value qua listeners, không chỉ match câu “purged”.

## 3. R8-N02 — Giữ form intent khi navigation/re-render còn hợp lệ

Hiện title ở form Create Matter và promotion reason mất khi chuyển sang Control Room rồi quay lại. `renderSession`/`renderDocuments` dựng lại markup, còn listeners chỉ giữ record title/bulk values.

- Dùng state pattern đã có, thêm phần tối thiểu cho Create Matter và promotion form; key theo đúng user/scope/document để không lẫn draft giữa documents/Matters.
- Khôi phục unsent input khi đổi view, đổi EN/VI hoặc re-render không làm mất quyền. Promotion target, expected-current guard, reason và impact acknowledgment phải có lifecycle nhất quán; nếu current revision/target/impact thay đổi thì không âm thầm tái dùng acknowledgment cũ không còn tương ứng.
- Khi explicit discard/logout/access loss, clear đúng phần theo mục 2. Không đưa legal drafts/token vào localStorage/cookie hoặc thêm persistence dependency.
- Giữ fields/error association/focus intent phù hợp; không sửa bằng cách bỏ validation hoặc ngừng render dữ liệu cần refresh.

Regression bắt buộc: Create Matter title tồn tại sau view switch và locale switch; promotion intent tồn tại khi còn cùng document/context; đổi document không làm lẫn lý do/target; discard/access loss không restore protected values. Mọi kết quả chỉ là mock/source nếu chưa có browser thật.

## 4. R8-N03 — Promotion có target riêng với expected-current

Form R8 chỉ có `promote-expected`, reason, impact; không có phiên bản đích. Text còn nói promote phiên bản đang CURRENT, gây hiểu nhầm target với concurrency guard.

- Bổ sung target/candidate version choice rõ ràng, tách khỏi expected prior current version. Không dùng một dropdown cho cả hai nghĩa.
- Show current → proposed target và impact theo target thực chọn: current-version criteria cần recompute, fixed references giữ nguyên, không auto-verify.
- Nếu target không hợp lệ/chưa chọn hoặc chọn lại current, trình bày no-change/validation đúng contract; không tạo success giả. Contract chưa định nghĩa operation/status nào thì giữ DEPENDENCY_PENDING cho wire, chỉ hoàn thiện UX intent.
- Giữ OWNER-only promotion, expected-current concurrency guard, reason và acknowledgement. EDITOR vẫn add version được nhưng không promote; VIEWER vẫn đọc được nội dung trong scope.
- Form/control và validation nên cho xem intent/preview có nhãn; không gọi backend, upload, promote hoặc mint assessment thật.

Regression bắt buộc: target và expected-current là hai values độc lập; target change cập nhật impact; thiếu reason/ack/valid target không tạo ready intent; stale expected-current không thành force-save; EDITOR/VIEWER không có promotion action nhưng không mất scoped read.

## 5. R8-N04 — Handoff tái kiểm chứng được, ledger và evidence đúng thực tế

R8 validation plan tham chiếu ba file không tồn tại (`run_all_checks.sh`, `check_manifest_pins.py`, `check_screen_state_matrix.py`), `evidence/` rỗng, finding ledger vẫn là R7 và không có dispositions mới. Return chỉ pin tám file chính, bỏ supporting modules/checks/study assets.

Sửa đủ nhưng không xây thêm framework:

- Chọn cách nhỏ nhất hoàn chỉnh: cung cấp các script thực sự cần, hoặc xóa command/reference không tồn tại và chỉ dẫn exact commands có thật. Mọi command được nói là executed phải có actual command/cwd/tool version/UTC/exit và raw stdout/stderr hoặc receipt tương ứng.
- Run checks của candidate mới; mỗi attempt có thư mục riêng, không overwrite pinned evidence. Không copy timestamps/tool versions/results cũ thành một lần chạy mới. Không tuyên bố owner từng có logs mà thực tế không bàn giao.
- Cung cấp executable structural checks cho exact 20 FR/63 AC/14 NFR/13 screens/nine states/3 GWs và reciprocal mapping, hoặc tái sử dụng implementation check đã có thực sự phù hợp. Structural coverage không phải behavioral AC PASS.
- Cập nhật current task/revision của `findings-disposition.json`; giữ **48 historical finding records** và lịch sử cũ nguyên nghĩa, append/update current DR7-01..08 dispositions theo review và thêm R8-N01..04. Mỗi finding ghi changed locations, actual regression evidence, status SOURCE_CORRECTED_PENDING_REVIEW hoặc còn open. Không tự biến author fix thành independent closure.
- Cung cấp manifest hash/bytes **mọi deliverable cần consume/reproduce**, gồm supporting source, checks, participant assets và facilitator-only assets. Giữ facilitator key ngoài participant payload/bundle. Không tạo vòng self-hash: manifest loại chính nó và return; return pin manifest; hash return báo riêng trong final message.
- Đồng bộ spec, matrix, prototype, validation, handoff và return theo R9; chỉ đổi labels/claims thực sự liên quan. Giữ historical R4 image đúng nhãn, không dùng làm R9 render evidence.

## 6. Verification và phần không được suy diễn

Đầu tiên tái hiện regression trên baseline R8 hoặc bản copy trước fix để biết test bắt đúng lỗi. Sau sửa, chạy lại các tests bị ảnh hưởng và toàn bộ available R8 source/mock regression suite trên **R9 paths**. Không gọi script trỏ nhầm R8 rồi báo R9 pass. Regenerate artefacts từ corrected `src/`; kiểm embedded logic/CSS/datasets khớp supporting source. Không hand-edit export một đằng rồi để builder tạo lại code lỗi.

Giữ các phần đã đúng: approved axis vocabulary; typed proof/causality cho toàn Atlas; historical/current-policy caveat; CAS 428/412 và receipted/non-receipted OUTCOME_UNKNOWN; role/read/operation separation; six distinct screen layouts; full GWs; 50-row study datasets/participant-safe surface; strict missing-ID mutations; all existing evidence-tier limits.

Tách rõ **SOURCE_CHECKED / MOCK_EXECUTED / BROWSER_EXECUTED / NOT_RUN / VERIFICATION_BLOCKED**. Mock DOM/state tests không chứng minh actual rendering/focus/geometry/keyboard/screen reader. Study assets không phải human-trial PASS. Không cài package hoặc tạo emulator/browser framework chỉ để có nhãn xanh.

Nếu browser được phép, kiểm tra actual navigation/forms/promotion/draft/access-loss trên candidate, capture→inspect→fix→recheck ở desktop và 390px, rồi ghi đúng viewport/revision/tool. Nếu Work settings vẫn disabled, không bypass qua CLI/headless/export, alternate browser, server/proxy hoặc native capture; hoàn tất nonbrowser work và giữ rendered cases VERIFICATION_BLOCKED. Không tự đổi settings. Không cần chờ browser để hoàn thành source corrections.

## 7. Một gói bàn giao để implementation tiếp tục

Output mới gồm bộ spec/matrix/prototype/CSS/supporting source đã đồng bộ; design delta; finding ledger; validation plan; checks/evidence; full manifest; `return.md` và consumer handoff.

Consumer hiện là **Claude Code đang hoàn thành BE+FE W1–W7**, thay ZCode do quota. Có thể giữ filename `zcode-handoff.md` như historical contract filename, nhưng ghi rõ execution owner hiện tại; không nhắn hay sửa checkpoint của phiên implementation từ task này. Handoff delta chỉ cần nêu các thay đổi purge/form-state/promotion-target và evidence; không restart W0, không thêm per-wave review gate.

Acceptance trước return:

1. R8-N01..04 có actual corrections và meaningful regression results; không chỉ đổi disposition prose.
2. Các screen/flows trước đây đúng không bị mất; selected Enterprise Precision/Compact/legal text/Lucide không đổi direction.
3. Exact source/output pins, tool/time/exit và actual test outcomes được bàn giao, không dangling command/file.
4. R1–R8/reviewer evidence và product source của Claude giữ nguyên.
5. Còn thiếu code/spec → PARTIAL/IN_PROGRESS; source đủ nhưng browser/human checks blocked → AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS; không self-DONE/ACCEPTED hoặc product/security/release PASS.

Kết thúc bằng một return tổng hợp: actual identity/mode, branch/base, input/output hashes, từng finding và evidence, tests run/not run, remaining risks và next action. **Sửa và tự kiểm tra cả bốn findings trong cùng assignment, không trả thêm nhiều task nhỏ.**
