# MATTERCONTROL — DESIGN R8: HOÀN THIỆN TOÀN BỘ UI VÀ HANDOFF TRONG MỘT LƯỢT

Tiếp tục project và phiên thiết kế hiện tại. Task **MC-P0-DESIGN-R8-CONSOLIDATED-FINALIZATION**, priority P0. Design R7 đã được Codex review toàn bộ source/spec, verdict **CHANGES_REQUIRED**. Nhiệm vụ này là sửa DR7-01..08, hoàn thiện các màn hình còn thiếu và tự kiểm tra thành một gói cuối để ZCode tiếp tục toàn bộ backend + frontend W1–W7.

**Thực hiện đến hết phần được phép. Không chỉ trả plan, không dừng sau từng finding/màn hình, không yêu cầu tám prompt nhỏ.** Giữ hướng thiết kế đã chọn. Không restart W0, không tạo review gate sau từng wave. Nếu hết context, lưu checkpoint trong chính output của task rồi tiếp tục; không coi checkpoint là hoàn thành.

## 1. Nguồn, authority và giới hạn ghi

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch được chuẩn bị: `codex/unified-project-flow`.
HEAD tại preparation: `a62d838791ba188838c4ff00b7b6e265ac775056`.

Trước khi sửa: xác nhận root/branch/HEAD, actual author/tool/mode, đọc AGENTS/RTK applicable; giữ nguyên mọi thay đổi của phiên khác. Dùng Semble trước khi khám phá repository, các known paths dưới đây có thể đọc trực tiếp. Không khởi động workflow generation lồng nhau, tự đổi provider/model, login, cài dependency hoặc chỉnh settings.

Đọc đầy đủ:

1. `docs/reviews/p0-design-r7-full-review-20261027.md` — **16,656 bytes**, SHA-256 `c271018278efa75a6dfd26655045d71b9b632e1dc4b5c69f1388e399f20e1d2f`.
2. `docs/design/p0-handoff-r7/return.md` — **13,699 bytes**, SHA-256 `508af367374d4a48966967a4f8b38126f59ba089d5b90c5d53b24076f34586d9`; xác minh 22 output pins khai trong return trước khi consume các payload liên quan.
3. `docs/testing/p0-design-r7-full-review-20261027/receipt.json`, `reference-pins.json`, `reviewer-probes.cjs` và report. Đây là bằng chứng source/mock; không phải browser/product acceptance.
4. Approved SRS, business rules, state semantics, permission matrix, acceptance criteria, Golden Workflows trong `docs/requirements/`; Atlas trong `docs/product/project-atlas-dataset.md`; coverage trong `docs/testing/p0-zcode-plan-20261026/coverage.json`; selected visual baseline trong `docs/design/step-03a/revised/local-r3/`.
5. `docs/implementation/p0-zcode-end-to-end-execution-plan.md`, `docs/implementation/handoffs/MC-P0-ZCODE-COMPLETE-PLAN-PROMPT.md` và **contract hiện hành** `docs/implementation/p0-zcode-execution/local-contract.md`, chỉ đọc. Tại preparation là revision 4, **19,264 bytes**, SHA-256 `b418471bc137839b906397a406d572001b7992076ac64c52e3618fd7d1e268a3`. ZCode đang thực hiện assignment dài: nếu living contract đã có revision mới, ghi actual revision/hash, đối chiếu delta và theo authority hiện hành; không ghi đè contract, không coi thay đổi hợp lệ của owner là lý do restart toàn task. Nếu có xung đột thực chưa giải được, cô lập đúng phần đó và tiếp tục phần độc lập.

Chỉ tạo output **`docs/design/p0-handoff-r8/`** sau absence check. Nếu đã có output của chính task, xác minh checkpoint/ownership để resume; nếu là phiên khác thì không overwrite và báo collision. Không sửa R1–R7, review/evidence gốc, requirements, formal ledgers, apps/backend, apps/frontend, ZCode workboard/contract, AGENTS hoặc security state. Không stage/commit/push/merge, provision DB/Docker, đọc secret, gọi agent/provider khác hay deploy.

## 2. Sửa toàn bộ DR7-01..04: truth, proof, lỗi và quyền

### DR7-01 — Axis vocabulary

- Xóa `EXPIRED` khỏi danh sách aggregate Verification states và `CIRCULAR_CONFLICT` khỏi Dependency states trong specification/fixtures/handoff.
- Dùng đúng state semantics đã duyệt: proof expiry là input/reason làm aggregate recompute; cycle là graph validation rejection. Không biến reason thành enum mới, không sửa approved semantics/API/schema để khớp prototype.
- Thêm exact-vocabulary check đối chiếu nguồn approved, kiểm tra cả spec, matrix và prototype. Các từ này có thể xuất hiện khi mô tả error/reason rõ ràng; không dùng cách cấm từ máy móc.

### DR7-02 — Kiểm tra toàn bộ proof panels

- RQ-11 phải chỉ đúng DEP-07 proof gate tới AC-12; fallback không được báo không có downstream proof gates.
- RQ-07 giữ dependency READY của chính Requirement; không mượn BLOCKED của Action AC-07.
- Rà **tất cả 24 canonical records**: exact typed subject, criteria, version, actors, execution/dependency/verification, incoming/outgoing gates và causal claims phải khớp nguồn. Thiếu dữ liệu thì hiển thị unavailable/unsupplied, không bịa negative fact.
- Giữ các sửa đã đúng cho RQ-03/RQ-05: historical baseline khác current-policy caveat. Giữ AC-06 COMPLETED/READY/U-03; Action/Filing có proof khi được yêu cầu rõ. AC-DEMO-PROOF là fixture riêng có nhãn, truy cập được nhưng không nhập Atlas totals.
- Sửa root cause một lần trong shared presentation logic nếu có; bổ sung regression cho RQ-11/RQ-07 và fallback thiếu thông tin. Không thay các canonical facts để làm test pass.

### DR7-03 — UX theo contract hiện hành

- CAS thiếu precondition → 428; stale precondition → 412; domain conflict chỉ dùng status/problem mà actual contract định nghĩa. Không hard-code mọi concurrent edit thành 409.
- Giữ draft nếu còn quyền; chỉ so sánh current values được phép đọc; có đường refresh/rebase an toàn.
- OUTCOME_UNKNOWN: phân biệt command có receipt và không có receipt theo contract §2.1. Receipt/readback chỉ có ý nghĩa trong phạm vi contract; current state hay một 412 không tự chứng minh kết quả của write trước.
- Nếu actor bị revoke và mất quyền đọc lại, purge protected data/draft đúng policy; outcome có thể vẫn UNKNOWN, chuyển hướng an toàn cho authorized owner. Không tự unlock resend chỉ vì đã thực hiện một GET.
- Xuất bảng ngắn: condition → user message → retained/purged intent → permitted recovery → disabled actions. Đây là UX consumer mapping, không thay wire contract.

### DR7-04 — Persona không phải quyền

- Mỗi screen tách persona, scoped read roles và operation-specific controls.
- Scoped OWNER/EDITOR/VIEWER được đọc Matter/records/docs/domain history và export theo matrix. Workspace OWNER không tự có quyền vào confidential Matter.
- EDITOR/OWNER được bulk/import/ordinary edge edit và assign Action cho active member trong scope. Assignment không cấp access.
- Promotion, cancellation/reopen/applicability, membership/verifier designation theo đúng OWNER/Workspace OWNER boundary. Verification chỉ dành designated independent EDITOR/OWNER, không phải submitter; OWNER không tự là verifier.
- Phân biệt denied read phải tránh leak với denied mutation trong record vẫn được phép đọc. Không suy quyền từ Lead Operator, Counsel, Admin hoặc Auditor persona.

## 3. DR7-05: Hoàn thiện các screen và luồng còn thiếu

Không chỉ thay screen ID vào cùng một state card. Hoàn thiện layout và navigation thật trong **concept prototype có nhãn synthetic/local**, không gọi backend/IdP hay tạo business success thật. Fixture có thể cho xem các outcome đã khai báo rõ; không trình simulation như persisted/enforced product result.

Sáu surface bắt buộc:

| Screen | Nội dung UI cần hoàn thiện |
|---|---|
| SCR-01 | Login/session loading/expired/logout intent; accessible Matter list, Workspace/Matter switcher; create Matter và member/role/last-owner flow; access-lost state không lộ record. Chỉ fixture navigation, không thu credential hay tạo grant thật. |
| SCR-08 | Document/version lineage; fixed/current references; signature completeness; add-version intent; OWNER promotion với expected current version, reason, impact acknowledgment; stale/forbidden/supersession context. |
| SCR-09 | Filing list/detail, package/checklist/exact submitted versions; submission/receipt/outcome tách biệt; hai supplement-response cycles có distinct binding; no-supplement alternative, rejection/withdrawal/correction/reopen và accountable waits. |
| SCR-10 | Exact selected IDs và hidden count; bốn metadata fields với Unchanged/Set/Clear hợp lệ; before/proposed preview; row-atomic succeeded/failed/unknown results; giữ failed drafts và reconciliation path. |
| SCR-11 | CSV/XLSX file intent → column/type/date/key/reference mapping → validation/group preview → result/recovery; connected-group rejection, independent valid groups, duplicate/changed-content handling. Không chạy formulas/macros/links hoặc upload thật. |
| SCR-13 | Scoped domain-event list/detail, actor, recorded/effective time, reason, before/after, correlation/causal links; filters/paging và return context; restricted security logs không trộn vào ordinary history. |

Rà lại các screen hiện có để tạo một hệ thống thống nhất: Control Room, Grid, My Actions, Waiting On, Requirement/Action drawers, dependency/proof context, Brief/export. Giữ toàn bộ 20 FR, 63 AC, 14 NFR, 13 screen IDs, ba canonical GWs và nine-state contract.

Cho mỗi screen: happy path + những high-risk states có cấu trúc riêng phải thể hiện bằng layout/interaction tương ứng, đặc biệt permission loss, stale/conflict và partial/unknown. Không cần 117 trang độc lập; dùng reusable patterns nhưng không bỏ form hierarchy, field validation, action placement hay recovery theo screen.

- Reset search/filter chỉ reset đúng local screen/tab/filter; không đẩy mọi no-match về Grid. Search affordance phải khớp fields thực hỗ trợ.
- Causal Back/breadcrumb/Close/Escape giữ origin, draft, filter/selection/scroll và focus khi còn hợp lệ; native dismissal phải cleanup. Nested input/IME không bị row key handler chiếm.
- Mobile drawer có top navigation sticky thực tế, không chỉ câu mô tả. Giữ Back/Close tiếp cận được khi nội dung dài.
- Thể hiện trọn ba GW theo canonical sequences, có stage/screen navigation cụ thể; Atlas excerpts là example, không thay full journey.

## 4. UI phải đạt chất lượng làm việc, giữ art direction

Giữ **Enterprise Precision A**, selective causal hierarchy B, Comfortable default/Compact opt-in, selected tokens và Lucide. Dùng tasteskill app-screen, Hallmark app/refinement, Impeccable Operate và accessibility guidance đã cài khi có thể. Đọc applicable skills; không cài thêm hoặc chọn lại palette/theme chỉ để thay cho sửa UX.

Chất lượng mong muốn: primary blocker, accountable owner và permitted next step nhận ra nhanh; typography/alignment/spacing nhất quán; causal chain không lặp paragraph; complex details progressive disclosure; primary actions rõ; empty/error recovery cụ thể. Legal titles/reasons EN/VI phải đọc đủ. Compact không giảm body 14px; color có text/reason; motion có mục đích và reduced-motion fallback. Không vanity metrics, readiness percentage hay marketing layout.

Nếu browser được phép, thực hiện **capture → inspect → fix → recheck** cho exact candidate:

- Desktop 1440×900 và 1280×800, tablet khoảng 768px, mobile 390px; 200% zoom.
- Comfortable/Compact; long EN/VI titles/errors; hàng cuối của density 50/200.
- Các screen mới, Control Room causal drill-down, Grid/My Actions, Brief và full GW walkthrough.
- Keyboard-only, nested controls/IME, visible focus, modal close/return, touch targets; reading order/names/error association/announcements. Screen-reader test chỉ đánh dấu executed nếu thực sự chạy đúng công cụ.
- Ghi actual viewport/zoom/tool/version/candidate hashes, capture filenames và observations. Sửa lỗi quan sát được trong cùng assignment.

Nếu browser disabled hoặc Mac chưa unlock: **không bypass qua CLI browser/renderer/`od export`, native capture, alternate browser, server/proxy/tunnel hoặc tự chỉnh settings**. Hoàn thành mọi source/spec/mock phần còn làm được; ghi từng visual/interactive case VERIFICATION_BLOCKED. Không suy chất lượng render từ CSS, screenshots R4 hoặc mock DOM. Nếu đã có candidate images từ owner, bind đúng revision và nêu rõ giới hạn ảnh tĩnh.

## 5. DR7-06: Chuẩn bị study assets AC-137 thật sự sử dụng được

Giữ nguyên protocol đã duyệt: năm representative managers thật, hai unseen 50-row synthetic matters, counterbalanced order, facilitator key ghi trước, không gợi ý; ba câu trả lời major state/top blocker/next owner-action; ≥4/5 đúng cả ba trong 10 giây ở mỗi scenario, raw timing/accuracy từng người/scenario. Không đổi ngưỡng và không hỏi lại approval đã có.

Trong output mới:

- Hai dataset tách biệt, **50 records mỗi dataset**, typed Requirements/Actions, scoped owners/parties, exact incoming/outgoing gates, đủ criteria/proof và explicit milestone sets để đáp án được suy ra có căn cứ. Không dùng density-only generator.
- Participant-safe scenario surface/view selector riêng, không chứa answer key hoặc những label bật mí đáp án. Không nhập dữ liệu study vào canonical Atlas 24 rows.
- Facilitator-only key/protocol/scoring template có path/hash rõ, tách khỏi participant HTML/JS/data payload và participant bundle inventory. Không tự serve/upload các file key.
- Source check kiểm counts/references/acyclic graph/declared criteria và expected state/blocker/next owner bằng logic phù hợp approved semantics; lưu derivation để reviewer tái kiểm tra. Không chỉ assert lại text đáp án tự viết.
- Ghi actual preparation status. Chưa có người thử thì **TRIAL NOT_RUN / AWAITING_HUMAN_TRIAL**, không tự liên hệ participant, bịa kết quả/timing hay claim usability PASS.

## 6. DR7-07 và DR7-08: Test hữu ích, evidence trung thực, revision đồng bộ

- Mock bắt buộc fail nếu thiếu required static DOM ID. Chỉ mô hình hóa dynamic elements thực sự được tạo; không autovivify mọi lookup, không hard-code return đủ để tests luôn pass.
- Thêm negative mutation test thiếu `query` ID phải bị phát hiện; regression RQ-07/RQ-11; all-record proof/gate consistency; boundary tests của completion/proof/milestone predicates. Test cả missing/invalid/disputed/NOT_REQUIRED cases phù hợp approved rules.
- Nếu cần source/unit event tests, giữ actual handlers và trigger đúng đường click/change/close; no-op focus không chứng minh focus restoration. Không xây một browser emulator lớn để né browser limitation.
- Tách từng assertion: SOURCE_CHECKED, MOCK_EXECUTED, BROWSER_EXECUTED hoặc NOT_RUN/BLOCKED. Không đánh dấu measured geometry, no-clipping, visual hierarchy hay complete keyboard flow từ mock.
- Lưu source checks và raw outputs/commands/cwd/tool version/UTC/exit/input hashes trong output mới. Lấy versions/timestamps thực tế, không copy từ return trước. Runner không overwrite pinned logs; mỗi execution attempt có path riêng, finalize manifest sau cùng, không self-hash loop.
- Đồng bộ revision R8 giữa spec/matrix/prototype/validation/handoff/return; ghi supersession R7 bằng delta. R4 screenshot chỉ là historical R4 evidence. Giữ 48 historical finding records và previous dispositions nguyên nghĩa, append DR7-01..08 disposition với source location/evidence/limitations.
- Dùng actual Atomic primitives inventory dưới `apps/frontend/src/components/{atoms,molecules,organisms,templates}/`; business compositions dưới `src/features/*`. Không thêm duplicate generic layer, bịa component/library hoặc thay contract backend.

## 7. Một gói output và một return tổng hợp

Xuất trong `docs/design/p0-handoff-r8/`:

1. `current-ux-spec.md` — source of UX truth của candidate, đồng bộ approved semantics.
2. `screen-state-matrix.json` — FR/AC/NFR/GW/screen coverage và actual implementation/evidence status.
3. `prototype.html`, `polish.css` và supporting modules/assets cần thiết để mở full concept; self-contained hoặc dependencies local được khai báo rõ, không CDN/network surprises.
4. `design-delta.md`, `findings-disposition.json` — disposition cả tám findings, không tự ghi independent acceptance.
5. `validation-plan.md` — actual checks/results và remaining browser/human cases.
6. `zcode-handoff.md` — một blueprint đầy đủ cho plan đang chạy W1–W7: component/feature bindings, flows, state/error/permission mapping, changed consumer expectations; không yêu cầu review từng wave.
7. Study fixtures, participant surface/bundle inventory và facilitator-only materials tách biệt.
8. `checks/`, `evidence/` và actual captures khi được phép.
9. `return.md` — actual identity/mode, source revision, input pins và hash/bytes của mọi output (trừ chính return), commands/tests/results, từng DR7 disposition, skipped/remaining risk và exact next action. Báo hash return riêng trong final message.

Acceptance trước khi return:

- DR7-01..08 đều có actual correction/evidence hoặc exact unresolved dependency; không đóng bằng prose assertion.
- Sáu screen mới có concrete reachable layouts/critical paths; 20 FR và ba full journeys không bị mất scope. Browser unavailable không được dùng để biện minh cho source layout chưa viết.
- Source/unit checks liên quan thực pass sau corrections; không sửa expectation/canonical facts để che lỗi.
- Không fabricate saved/verified/exported/enforced product result, không mark toàn bộ 63 AC PASS từ design.
- Review mọi output thống nhất một lần trước handoff. Nếu còn source/spec chưa hoàn thiện: PARTIAL/IN_PROGRESS. Chỉ khi source/spec đủ nhưng real browser/human checks bị chặn mới dùng AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS. Nếu mọi applicable author checks đã thực hiện thì AUTHOR_COMPLETE_PENDING_REVIEW; independent approval vẫn OPEN.

**Hoàn thành cả correction lẫn screen design và tự kiểm tra trong cùng assignment, rồi trả một gói để Codex review tổng hợp. Không tự đánh dấu MC-002 DONE, production/design acceptance hay release approved.**
