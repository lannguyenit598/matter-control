# MATTERCONTROL — HOÀN TẤT DESIGN P0 VÀ HANDOFF CHO ZCODE

Tiếp tục project MatterControl hiện tại từ Design R4. Nhiệm vụ **MC-P0-DESIGN-R5-FINALIZATION**: sửa toàn bộ tám findings R4-I01..08, hoàn thiện UX và trả một gói design/handoff thống nhất cho assignment BE+FE W1–W7 mà ZCode đang thực hiện.

**Thực hiện đến hết, không chỉ trả kế hoạch hoặc vài màn minh họa.** Tự kiểm tra, sửa các lỗi phát hiện được trong phạm vi rồi nộp một return tổng hợp. Không chia thành các task nhỏ chờ prompt/review sau từng màn, không hỏi lại các lựa chọn style đã chốt.

## 1. Nguồn chuẩn và phạm vi

Nếu project có quyền truy cập local, root là:
`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

Đọc trước khi sửa:
- `docs/reviews/p0-design-r4-intake-20261027.md` — tám findings bắt buộc và nhận xét ảnh.
- `docs/design/p0-handoff-r4/return.md` và toàn bộ tám deliverables được pin trong return.
- Approved SRS, business rules, state semantics, permission matrix, acceptance criteria và Golden Workflow acceptance trong `docs/requirements/`.
- `docs/testing/p0-zcode-plan-20261026/coverage.json` — canonical FR/AC/NFR/wave mapping.
- Selected design/tokens `docs/design/step-03a/revised/local-r3/`, canonical `docs/product/project-atlas-dataset.md`.
- `docs/implementation/p0-zcode-execution/local-contract.md` và `docs/implementation/handoffs/MC-P0-ZCODE-COMPLETE-PLAN-PROMPT.md`, chỉ đọc.

R4 return SHA-256: `8ccad46f0300dcb460910faf56807541e2b8ae14b720ffa640e066b69b83d9fe`.
R4 intake report SHA-256: `85bb1d381e3ba2fc7b1362d69275be5e191e935aefc820595d6d1b150415fe2b`.

Kiểm tra return/tám output pins trước khi consume. Pin phiên bản contract thực đọc; revision 3 là checkpoint đã được đối chiếu, không ghi đè thay đổi hợp lệ mới hơn của ZCode. Nếu input không truy cập được hoặc có drift không giải thích được, nêu chính xác phạm vi bị thiếu và tiếp tục phần độc lập; không giả đã đọc/hash/render hoặc tự dựng lại requirement.

Làm trực tiếp trong project và mode đã chọn. Không khởi động workflow lồng nhau, đổi provider/login/settings, tự tạo agent hoặc gửi dữ liệu ra ngoài. Không sửa backend/frontend, ZCode workboard/contract, AGENTS, formal ledgers, R1–R4 hay security state.

## 2. Giữ đúng hướng thiết kế, nâng chất lượng hoàn thiện

MatterControl là phần mềm vận hành công việc pháp lý phức tạp, không phải landing page. Giữ **Enterprise Precision A**, selective causal rail B, Comfortable mặc định / Compact tùy chọn, selected tokens, Lucide và legal text EN/VI.

Áp dụng **tasteskill app-screen, Hallmark app-scope/refinement, Impeccable Operate** khi có sẵn. Đọc hướng dẫn phù hợp; không đổi brand để chạy theo một theme khác. Nếu engine thiếu, ghi rõ và dùng project context; không tự cài hoặc bypass.

Mục tiêu “ấn tượng” là hierarchy, typography, khả năng hiểu blocker và thao tác liên tục. Giữ body 14px/1.5, metadata 12px, heading 22px, spacing base 4px; Compact không giảm cỡ chữ. Màu có ý nghĩa và luôn kèm chữ. Không hero/KPI trang trí/readiness percentage, glass/gradient hoặc motion không phục vụ thao tác.

Tinh gọn causal chain đang quá nhiều chữ: làm rõ một primary cause, downstream impact, accountable owner và permitted next step; đưa diễn giải chi tiết vào inspector/progressive disclosure. Không lặp cùng nguyên nhân ở năm card đỏ rồi thêm một summary giống hệt. Giữ đầy đủ thông tin pháp lý khi mở detail; không dùng truncation/clipping để làm màn trông gọn.

## 3. Sửa tám findings đồng bộ trong toàn bộ gói

### R4-I01 — Canonical mapping và test oracles

Khôi phục đúng FR identities trong validation prose, JSON matrix, spec, handoff và test IDs:

FR-001 Requirement vs Action; FR-002 Milestones; FR-003 Next Action; FR-004 Waiting On; FR-005 Dependencies/Blockers; FR-006 Evidence Requirements; FR-007 Evidence Verification; FR-008 Event History; FR-009 Control Room; FR-010 My Actions; FR-011 Operational Grid; FR-012 Bulk; FR-013 Import; FR-014 Export; FR-015 Document Versions; FR-016 Filing; FR-017 External Parties; FR-018 Roles/Ownership; FR-019 Draft Delta Brief; FR-020 Five Axes.

Dùng exact approved rule/AC bindings từ SRS và coverage, không chỉ sửa tên cột cho khớp. Auth, concurrency, responsive và accessibility có cross-cutting scenario IDs riêng, không chiếm identity FR khác. Giữ ba Golden Workflows gốc đầy đủ.

Milestone: mọi explicit required Requirement phải READY + COMPLETED + (valid VERIFIED hoặc explicit valid NOT_REQUIRED). Không có declared required set thì UNASSESSED/count unavailable. Proof edge vẫn yêu cầu valid VERIFIED; NOT_REQUIRED không thỏa proof edge. Các predicate này không được đánh đồng.

### R4-I02 — Session/token

Sửa mọi checklist/copy/example thành: OAuth tokens ở **server-side BFF session store**; browser cookie chỉ chứa **opaque session handle**. Không ghi “tokens stored in session cookie”, không localStorage tokens. Giữ token-exposure negatives và contract hiện hành; design không tự chọn lại mô hình auth.

### R4-I03 — Filing receipt không tự chuyển stage

File upload chỉ tạo/supply artifact. Chỉ authorized command/observation được backend chấp nhận, có actual acknowledgement, exact scope/version/reference và current guards mới ghi nhận receipt/authority waiting. Không có auto-advance chỉ vì upload.

Receipt khác approval; approval observation khác independent proof verification. Giữ đầy đủ stage/cycles/negative/reopen theo RULE-012 và ARCH-Q5, không yêu cầu authority reissue chỉ vì owner reopen. Sửa đồng thời spec, prototype narrative, validation và handoff/checklist. Không tiếp tục dẫn RULE-016 của Status Brief làm Filing rule.

### R4-I04 — Proof lookup theo explicit typed relations

Bỏ lookup `id.slice(-2)` dùng chung Action và Requirement. Chọn criterion/evidence/exact document version bằng liên kết rõ ràng theo record kind và identity.

AC-05 NOT_REQUIRED không được nhận EV-05/DOC-03 hoặc verification state của RQ-05. Kiểm thêm AC-01/03/06/10 và RQ-03/05. Phân biệt historical VERIFIED/current-policy caveat với actual current gate evaluation; không khẳng định DEP-05 bị chặn khi đang trình bày canonical historical baseline đã supplied khác. Không sửa canonical Atlas để che lỗi lookup.

### R4-I05 — Navigation session, Back và focus

Khởi tạo trail/current record/mode khi mở một modal session mới. Cleanup tập trung khi modal thực sự close, gồm cả Close button và Escape; giữ draft map riêng theo record. Không kéo record của session cũ vào breadcrumb của lần mở mới.

Lưu đúng origin Grid/My Actions/Waiting On/Filing/Control Room, không đặt mặc định tất cả thành Grid. Khi Back, khôi phục record và mode phù hợp. Giữ draft, filters, selection, scroll và focus; có fallback khi opener mất quyền/không tồn tại.

Cover AC-05 → RQ-04 → proof → RQ-04 → AC-05 → origin; Close rồi mở record khác; Escape rồi mở lại; nhiều origins; lặp drill-down. Không coi source reasoning là focus/browser PASS.

### R4-I06 — Permission nhất quán

Personas không phải roles. Matter EDITOR và OWNER đều được assign Action trong scope cho active member; không owner-only hóa assignment. VIEWER vẫn đọc/export đúng quyền. OWNER-only membership/verifier designation giữ riêng; OWNER không tự thành verifier, submitter không self-review. Recheck quyền và purge protected content/drafts sau revocation theo contract.

### R4-I07 — Import/export và producer authority

Giữ CSV/XLSX import và meaningful scoped XLSX export theo execution plan; không thay bằng CSV/JSON hoặc CSV/PDF làm mất scope. Imported verification là claim, không tự VERIFIED; không phát minh wire enum `CLAIM_IMPORTED`. Nếu cần minh họa, dùng prose rõ là design-only và giữ actual DTO/status do contract quyết định.

Giữ bulk title/description/internal owner/due, per-record atomic mutation+audit, explicit partial/unknown outcomes; invalid connected import group reject whole, valid independent groups có thể thành công. Unknown write phải reconcile trước safe retry. Brief giữ recorded changes `(t1,t2]` riêng outstanding tại t2. Draft retention theo adopted privacy/session contract, không tự thêm persistent localStorage legal drafts.

### R4-I08 — Screen states và evidence trung thực

Một generic template đổi mỗi screen label không chứng minh 13 màn hoàn thiện. Dùng state/role/primary action thật của từng SCR; không đặt Create-first-record ở nơi không có create. Loading specimen phải có semantics thật khi được implement trong prototype, không chỉ in literal `aria-busy="true"` thành chữ. Counts và listed IDs phải khớp nhau.

Các controls mô tả retry/rebase/submit chưa có behavior phải ghi rõ SPECIFIED_ONLY/không thực thi, không giả “Recovery Complete”, “Retrying in 5s” hoặc business success. Có thể dùng fixture-labelled states để review design, nhưng không gắn chúng với product execution PASS.

Sửa mọi trạng thái đánh giá quá mức: source checks, image inspection, measured interaction và product enforcement là các kết quả riêng. Chỉ ghi đã chạy khi có command/tool/version/UTC/exit/input revision và output thật. Lint sạch không chứng minh permission, proof, navigation hay usability đúng.

## 4. Hoàn thiện toàn bộ trải nghiệm P0, không chỉ vá tám dòng

Giữ đủ 13 SCR IDs, 20 FR, 63 AC, 14 NFR và ba Golden Workflows; từng màn có concrete composition/fields/validation/roles/entry/exit/return/keyboard/mobile và chín states hiện có. Không thay flow phức tạp bằng “sẽ làm sau”.

Giữ My Actions Eligible/Waiting/Blocked/Historical. AC-05 có thể xuất hiện ở Waiting và Blocked nhưng cùng identity/draft, không nhân đôi workload; canonical T0 vẫn zero eligible. Atlas giữ 24 records, 12+12, bảy edges, Action census 4/3/5/0 và undefined milestones UNASSESSED. Density/progression fixtures phải tách và có nhãn.

Hoàn thiện Control Room → record → criterion/proof → return; Grid editing/selection/conflict/unknown recovery; versions/signatures/independent review; Filing với hai supplement-response cycles; bulk/import/export/brief/history. Reuse primitives; domain compositions dưới `apps/frontend/src/features/*`. Không copy mock actor/state evaluator thành product enforcement, không thêm endpoint/ETag/schema để thuận tiện cho prototype.

## 5. Tự kiểm tra và sửa trước return

Tạo checks có thể chạy lại cho:
- Prose validation ↔ canonical FR/rule/AC/wave mapping ↔ JSON matrix ↔ handoff.
- Typed proof association và absence/applicability cases; các predicate completion/proof/milestone khác nhau.
- Navigation state/session cleanup và queue counts/overlap bằng phép kiểm phù hợp công cụ được phép.
- 13-screen/nine-state coverage, fixture arithmetic, links/IDs, HTML/JS syntax, embedded CSS identity và token/density consistency.
- Cross-file search bảo đảm không còn chỉ dẫn token-in-cookie, upload-auto-stage, owner-only assignment hoặc invented enum bị coi là adopted wire.

Chạy checks source/non-DOM phù hợp và giữ actual logs/exits. Nếu browser thực sự được phép, capture → inspect → fix trên exact revision ở desktop/tablet/390px/200% zoom, hai densities, long EN/VI, last 200-row entry, modal/keyboard/reduced-motion và state variants.

Nếu browser vẫn bị disabled, không dùng alternate browser, CLI renderer/`od export`, server/proxy/tunnel hay OS capture để vượt restriction; không đổi Work settings. Có thể xem ảnh đã bàn giao, nhưng không suy ra mobile/focus/capture provenance chưa có. Giữ interactive/assistive/AC-137 NOT_RUN hoặc VERIFICATION_BLOCKED, vẫn hoàn tất mọi source/spec correction có thể làm. AC-137 cần năm quản lý thật, không giả participant hoặc timing.

## 6. Một gói kết quả và một handoff cuối

Chỉ ghi vào **`docs/design/p0-handoff-r5/`** nếu chưa tồn tại; nếu collision, không ghi đè, báo đúng điểm bị chặn. Giữ nguyên R4/previous intakes. Không chỉnh application source hay current ZCode files.

Bộ kết quả thống nhất:
`current-ux-spec.md`, `screen-state-matrix.json`, `prototype.html`, `polish.css`, `design-delta.md`, `findings-disposition.json`, `validation-plan.md`, `zcode-handoff.md`, `return.md`; kèm source-check scripts/logs và captures chỉ khi thực sự tạo bằng công cụ được phép.

Với từng R4-I01..08, disposition phải chỉ đúng changed file/line, expected behavior, actual check/evidence và giới hạn còn lại. Giữ nguyên historical records; chỉ thêm correction disposition mới. Source-corrected không đồng nghĩa independently closed.

Return ghi actual author/tool/mode, exact export revision, baseline và current input pins, commands/UTC/exits/skips, all output bytes/SHA-256. Không tự hash lồng vòng cho return; báo hash return riêng khi bàn giao. Không viết timestamp tương lai hoặc claim log chưa tồn tại.

ZCode handoff là **một hướng dẫn tích hợp toàn bộ design vào plan BE+FE W1–W7 đang chạy**: components, tokens, interactions, states, semantic data needs, permitted recovery và acceptance checks; không yêu cầu restart W0 hoặc dừng xin review sau mỗi wave. Routine technical wire binding thuộc contract của ZCode/architecture, không tự chọn trong design.

Chỉ báo **AUTHOR_COMPLETE_PENDING_REVIEW** khi cả tám findings đã được sửa đồng bộ, các source checks thực chạy pass và không còn known design/spec contradiction trong scope. Nếu còn thiếu source/spec thì ghi PARTIAL/IN_PROGRESS; nếu chỉ thiếu rendered/interactive evidence, ghi rõ AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS cùng exact cases. Không tự cấp independent acceptance, MC-002/STEP03A/STEP03B/security/production DONE.

**Bắt đầu từ R4, sửa và hoàn thiện toàn bộ gói trong cùng lượt làm việc; không trả thêm một planning pass hoặc nhiều handoff nhỏ.**
