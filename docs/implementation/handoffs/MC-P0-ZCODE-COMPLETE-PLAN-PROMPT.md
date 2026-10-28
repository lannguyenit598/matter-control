# MATTERCONTROL — HOÀN THÀNH TOÀN BỘ PLAN BACKEND + FRONTEND P0

## 1. Nhiệm vụ duy nhất và cách thực hiện

Tôi giao **actual ZCode** tiếp tục nhiệm vụ đang chạy **MC-P0-ZCODE-EXECUTION** cho đến khi hoàn thành toàn bộ phần triển khai backend, frontend sản phẩm, tích hợp local, tự kiểm thử và sửa lỗi của plan P0. Không mở assignment mới, không chạy lại W0, không trả một planning pass khác.

**Đích giao duy nhất:** một sản phẩm P0 local có backend Go/PostgreSQL và frontend Next.js kết nối thật, có đủ các flow nghiệp vụ đã duyệt, dùng ZITADEL local đã chọn, có hướng dẫn chạy và bằng chứng tự kiểm thử, sẵn sàng cho một lượt review tổng hợp cuối cùng.

Đây là cập nhật trực tiếp của Product Owner về cách thực hiện. Nó thay các chỉ dẫn lịch sử yêu cầu chờ activation/review sau từng wave trong phạm vi assignment local P0 này. Plan gốc vẫn là nguồn backlog chi tiết:

`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/p0-zcode-end-to-end-execution-plan.md`

Đọc toàn bộ plan và prompt này; làm liên tục theo dependency cho đến hết. **W1–W7 chỉ là checkpoint nội bộ của một plan dài**, không phải bảy task cần giao lại. Hoàn thành backend + API + frontend + author checks cho từng slice rồi tự chuyển tiếp. Không dừng ở backend, auth, scaffold, một màn hình, W1 hay một checkpoint để xin “tiếp tục”. Không gửi bảy bộ handoff/review request. Chỉ cần cập nhật tiến độ ngắn khi làm và nộp một final return tổng hợp khi đã hết công việc được phép thực hiện.

Nếu có lỗi thuộc source/implementation của mình, tự sửa và kiểm tra lại. Không chuyển lỗi có thể tự xử lý thành câu hỏi PO. Khi context/session bị ngắt, lưu checkpoint rồi tiếp tục từ checkpoint; không dựng lại môi trường hay khám phá lại sản phẩm. Không hứa tác vụ nền nếu không có cơ chế thực thi thật.

## 2. Tiếp nhận trạng thái hiện tại, bảo toàn công việc

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.

Branch chuẩn bị: `codex/unified-project-flow`. HEAD quan sát khi chuẩn bị: `a62d838791ba188838c4ff00b7b6e265ac775056`.

Xác nhận root/branch/HEAD thực tế; đọc root và component AGENTS/rules. Đọc:

- `docs/implementation/p0-zcode-execution/workboard.json`: **một workboard duy nhất**, do bạn tiếp tục cập nhật.
- `docs/implementation/p0-zcode-execution/local-contract.md`: hợp đồng client/server hiện hành.
- `docs/implementation/p0-zcode-execution/w1-implementation-notes.md`: ghi chú triển khai để resume, không phải điểm kết thúc.
- `docs/testing/p0-zcode-w0-intake-20261027/inputs.json` và baseline manifest/checkpoint do bạn đã tạo.
- `docs/implementation/p0-zcode-execution/local-identity-approval.json`.

Workboard hiện báo `IN_PROGRESS_STEP0_DONE_W1_STARTING`; canonical contract đã là revision 3. Session log ghi các sửa trước đã được xử lý: server-side token store/opaque cookie handle; catalogue Matter list và session-currentness; machine-only probe tách khỏi human PKCE; trạng thái IdP/checkpoint được đồng bộ. Kiểm tra checkpoint của chính bạn và source hiện tại trước khi tiếp tục, không chạy lại các phần này chỉ vì prompt cũ nói chúng chưa làm.

Workboard ghi ZITADEL đã provision bởi owner; đây chưa phải independent runtime acceptance. **Reuse đúng tài nguyên task-owned đã xác minh**, không provision một bộ IdP nữa. Không in hoặc đưa private provisioning files/credentials vào return. Việc Codex đọc workboard không chứng minh provider đang healthy.

Repo có nhiều modified/untracked files từ các owner khác. Dùng working-source manifests và diff của assignment để phân biệt baseline, phần mình đã sửa và drift chưa giải thích. Thay đổi hợp lệ của bạn sau baseline là tiến độ, không phải lý do restart. Không reset/stash/overwrite công việc người khác. Nếu phát hiện collision thật, cô lập đúng các file bị ảnh hưởng và tiếp tục phần không xung đột.

Prompt này là **manual handoff**, chưa chứng minh ZCode đã nhận hay đã chạy. Khi nhận, ghi actual tool/model/provider hiện dùng và acknowledgement vào checkpoint của assignment; không tự nhận là OpenCode/Claude/OpenDesign hay đổi provider/login để làm task.

## 3. Nguồn nghiệp vụ và design dùng xuyên suốt

Giữ đủ **FR-001..020, AC-101..163, NFR-001..014 và ba Golden Workflows gốc**. Đọc các nguồn đã duyệt trong `docs/requirements/`, permission matrix, business rules/state semantics và `docs/testing/p0-zcode-plan-20261026/coverage.json`. Không mở lại positioning/discovery, không đổi FR identity và không thu nhỏ P0 thành template Task CRUD.

Design authority: approved product semantics → D-UX01..04/selected `docs/design/step-03a/revised/local-r3/` → design source/spec tương thích đã kiểm chứng. Formal design/independent/rendered acceptance vẫn tách riêng khỏi quyền author implementation.

**Design R3 hiện đã có**, thay cho câu lịch sử “R2 chưa có” trong plan/prompt cũ. Codex đã xác minh 8/8 output pins của R3; FR/AC identities và ba GW sequences không đổi so với R2. Dùng R3 làm source/spec input mới nhất sau khi bạn tự kiểm tra bytes; không coi hash match là semantic/rendered approval.

R3 directory: `docs/design/p0-handoff-r3/`.

`return.md` SHA-256: `cd42f5a44536807ba6e38a4af735ec211fa211dc9185c357ef58e36b8e2106ec`.

| Output | Bytes | SHA-256 |
|---|---:|---|
| current-ux-spec.md | 42136 | 95e581b1f5cfb49f521f0a002c530c4ec34ff1dc587b25a0c8ed8087c3b87d41 |
| design-delta.md | 7995 | 4ec85cc6a644d2a9d3f68f9b96bf0e5ff689521fe9e48ea73420fc0c0b960ca2 |
| findings-disposition.json | 51882 | 33035ef8b862c3d01cddde9efc5c2ec0a8b1999646fa02a69f7641dd11bc22bb |
| polish.css | 8634 | 32f3866323feeee669768ba89b12b7cc486df13670785136d4d2c259dbd982c1 |
| prototype.html | 52352 | 772d5630b5ac076219cf80577d0aa22f1d9aaf666ba8a4aba288568b01ced3a3 |
| screen-state-matrix.json | 42665 | 1eae3e9a37125b3f382292ad961a213eb5ed72862afd4aa3f35021d8e7fad561 |
| validation-plan.md | 24601 | ba51b4acfd44a94d1d2e19613a84d62bf70b3e8d38f27b465870db4a1e7a479c |
| zcode-handoff.md | 12899 | 61cdc001c38c4e488f31a97a1a7e9ab80efd2935a0af17e5c1c278037ae9b800 |

Đọc nội dung spec/matrix/handoff liên quan khi implement, không chỉ kiểm hash. Nếu bytes khác, phân biệt revision mới có return thật với drift; không âm thầm dùng bản không xác định. R2 và các return cũ giữ nguyên lịch sử. Không sửa các export đã pin để làm chúng khớp implementation.

Gộp hai lưu ý trong `docs/reviews/p0-design-r2-source-review-20261027.md` vào công việc product FE của cùng plan, không tạo vòng task/review riêng:

- Causal navigation có Back/breadcrumb giữ record/trail/origin; proof-back khác previous-record-back. AC-05 → RQ-04 → proof → RQ-04 → AC-05 → Grid phải giữ draft, filter, selection và focus. Liên kết ngược hiện vẫn mở record được; phần cần hoàn thiện là đường quay lại có ngữ cảnh.
- My Actions tách rõ eligible, waiting, blocked và historical/completed. WAITING+BLOCKED giữ cả hai ý nghĩa; cùng record dùng chung draft/selection. Actor lấy từ session/authorized API, không hardcode U-01. Canonical Atlas có zero eligible Actions, không bịa khuyến nghị.

Thiết kế sản phẩm phải được triển khai đầy đủ, không chỉ giống prototype: Enterprise Precision, causal hierarchy, Comfortable/Compact, legal text EN/VI không cắt nghĩa, năm trục tách biệt, quyền/lý do/trạng thái lỗi rõ ràng, loading/empty/no-match/unavailable/forbidden/stale/conflict/partial/recovery có hành vi thật. Dùng tasteskill app-screen, Hallmark app scope và Impeccable Operate nếu có; giữ selected tokens và Lucide direction. Tái sử dụng primitives hiện có, business compositions dưới `src/features/*`. Không copy fixture evaluator/attention/actor/draft simulation làm enforcement.

## 4. Hoàn thành toàn bộ sản phẩm trong một lượt execution dài

Thực hiện tuần tự theo dependency, nhưng **không trả từng mục thành một nhiệm vụ chờ giao tiếp**:

1. **Foundation W1:** hoàn thiện Go auth/introspection, identity mapping, Workspace/Matter administration, membership/last-owner/revocation, typed Requirement create/read, scoped history và operation receipts. Nối frontend login/logout/session expiry, authorized Matter list, create/detail/history và recovery vào API/PG thật. Contract hiện đã có Matter list và BFF session-currentness; cập nhật cả port/query/service/DTO/repository/route/tests khi có thay đổi.
2. **Daily operations W2:** Requirements/Actions/workstreams/owner/due/parties; allowed transitions và waiting relations; AND dependencies, cycle/foreign-scope denial, reopen/reblock; explicit milestone prerequisites; năm trục; Next/My Actions/Waiting On. Hoàn thiện Grid có search/filter/sort/paging/selection/edit/validation/conflict, causal Back/trail, hai density và mobile detail. Không dùng state dropdown tùy ý hay readiness percentage.
3. **Proof/documents W3:** lưu/đọc bytes local thật, versions/lineage, OWNER current promotion, signature observations; criteria/components/applicability, exact-version proof, independent designation, submit/review/dispute/resolve/expiry/reversal và propagation. Hoàn thiện toàn bộ FE upload/version/criterion/proof/review flows, secure retrieval và error/recovery. Upload không tự promotion/VERIFIED; submitter không tự xác minh.
4. **Filing W4:** Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval. Giữ đúng version sets, authority observations, repeated request/response cycles, owner/due/wait, correction/rejection/withdrawal/reopen và proof epochs theo F10/ARCH-Q5. Hoàn thiện FE package/timeline/cycle navigation. Receipt không phải approval; reopen không mặc định cần authority reissue.
5. **Control Room/context W5:** snapshot/read model có quyền và as-of nhất quán; causal blockers, Next Actions, Important Decisions, Waiting On, milestones, evidence gaps, changes; basic Decision/Finding/Risk/Entity context. FE điều hướng liền mạch blocker→record→criterion→proof→return, mobile triage và unavailable/stale đúng nghĩa. Không biến thiếu dữ liệu thành zero/READY.
6. **Data/brief W6:** bulk đúng bốn trường title/description/internal owner/due; preview exact IDs và per-row atomic mutation+audit, failed/unknown reconciliation. CSV/XLSX import mapping/validation/connected-group rejection/idempotency, meaningful scoped XLSX export và formula safety. Draft brief dùng recorded changes `(t1,t2]`, outstanding tại t2, provenance và quyền hiện hành. Hoàn thiện FE staging/result/recovery/download/brief; không placeholder/export giả.
7. **Stabilization W7:** đi hết GW-01 transaction→post-closing, GW-02 DD→resolution, GW-03 filing với hai supplement cycles và các nhánh thay thế. Chạy regression/security/concurrency/restart/restore/workload và UX checks được phép; sửa lỗi xuyên cả BE/FE đến khi hết lỗi triển khai đã biết thuộc scope. Gói source snapshot, evidence và hướng dẫn local để reviewer tiếp nhận một candidate hoàn chỉnh.

“Xong” một capability phải có backend behavior + API + UI interaction + persistence/history/readback + negative/recovery checks phù hợp. Không đánh dấu bằng tên test, một screenshot, một mock response, TODO endpoint, nút ẩn hoặc toast thành công giả. Mọi P0 flow đều phải có implementation; blocker kiểm chứng không phải lý do bỏ code cần thiết.

## 5. Contract, identity và an toàn local

Giữ một `local-contract.md` versioned cho cả hai stack. Reuse revision 3 đã sửa và tăng revision khi thực sự đổi contract; pin/diff và cập nhật consumers/tests đồng bộ. Consolidate BG-01..08, strict decode/fingerprint/errors, CAS/representation/strong ETag, own-key receipts/replay/unknown reconciliation, F08 classifier/F10 cycle/observation/read grain/fence/paging và object seam trước phần phụ thuộc. Không dùng governance HEAD làm resource revision hoặc no-store/weak ETag để che concurrency defect.

ZITADEL self-hosted local đã được PO chọn; không hỏi chọn provider lại, không chuyển Keycloak/anonymous/shared-token fallback. Auth Code + PKCE S256/state/nonce; token chỉ trong server-side BFF store, cookie chỉ opaque session handle. Go kiểm active/exact issuer/audience/expiry/subject, map `(issuer,subject)`, recheck Workspace+Matter+operation rights. IdP admin/org role không cấp product access. Introspection outage fail-closed; cache/revocation guarantee phải đúng tests. Machine-token probe không chứng minh human PKCE và không seed API identity thành human để tạo PASS.

Owner paths: `apps/backend/`, `apps/frontend/`, `ops/p0-local/` và `docs/implementation/p0-zcode-execution/`, gồm các caller/config/docs/tests/lockfiles liên quan thật. Reuse Go/PostgreSQL/hexagonal/sqlc và Next.js/Atomic/features hiện có; không framework rewrite hoặc thêm layer/dependency không cần thiết. Theo RTK, Semble-first và Context7 rules. Không tự tạo thêm agent writer.

Chỉ local synthetic. Bảo toàn private secrets bằng quyền phù hợp, không log/export DSN/token/password/env dump; không đọc INT-A credentials. Product/native test/IdP storage tách biệt; `TEST_DATABASE_URL` và `MC_TEST_DATABASE_URL` trỏ fresh verified fixtures riêng vì native tests có thể truncate/drop schemas. Không tạo lại fixtures đã có chỉ vì resume. Xác minh exact ownership trước start/stop; giữ evidence và data/volumes, không broad prune/down-with-volumes hay signal tài nguyên không thuộc task.

Không stage/commit/merge/push/deploy, cloud/paid service, security-scan retry, sửa hook/ledger/rule/exclusion hoặc chuyển tool/context/host để vượt refusal. Mimosa commit gate chưa có disposition hợp lệ; việc được sửa local không mở gate này. Không sửa `tools/inta-harness`, formal 51-row ledger, immutable returns/manifests, ngoài-root BE01 staged patch hay MC-003A worktree. INT-A closure/production feasibility không thuộc assignment product này.

## 6. Tự kiểm thử, sửa lỗi và tiếp tục đến cuối

Giữ một workboard mapping đầy đủ 20 FR / 63 AC / 14 NFR / 3 GW tới source/API/UI/tests/evidence. Tách implementation, actual execution và independent acceptance; không tự sửa formal gates thành PASS.

- Backend: behavioral tests theo component rules/TDD; generate sqlc bằng tooling hiện có; `make check` với hai DB fixtures đã xác minh; race/JSON events, exit codes và skips được ghi thật. Không coi skipped PostgreSQL tests là xanh.
- Frontend: component/behavior/security tests, `pnpm check`, `pnpm build`, affected stories/build-storybook và E2E theo repo rules khi môi trường cho phép. REST mode thật; demo/mock chỉ được làm unit fixture.
- Integration: synthetic actors/Matters/Workspaces riêng; real IdP transport, membership revocation/isolation, revision conflicts, dropped-response/unknown reconciliation, exact proof/version/file access, no-self-review, reopen propagation, import/bulk partial outcomes, export và history/delta readback. Test invalid/foreign/revoked cases chứ không chỉ happy path.
- Recovery/performance: restore toàn bộ synthetic product gồm DB, objects/versions/relations/history/rights vào isolated target; đo workload/50–200-row cases theo protocol và budget đã duyệt. Local RPO24h/RTO8h là trial target, không phải production SLA. Không tự đặt retention/deletion/cost commitment.
- UX: triển khai đủ keyboard/focus/validation/draft preservation, responsive/mobile, zoom/long text và permission states. Chạy visual/browser/assistive checks chỉ bằng công cụ thực sự được phép. Browser trong Work hiện disabled: không dùng alternate browser/CLI/OS capture để vòng qua; rows bị ảnh hưởng giữ `VERIFICATION_BLOCKED`. Vẫn hoàn thành source và mọi nonbrowser check được phép. AC-137 cần năm quản lý thật, không mô phỏng người dùng thành acceptance.

Mỗi lần fail: chẩn đoán root cause, sửa phạm vi đúng cả BE/FE/callers/tests, chạy lại checks bị ảnh hưởng rồi tiếp tục plan. Không chạy lặp toàn bộ suite vô ích sau mỗi sửa nhỏ; chạy bộ tổng hợp cuối khi candidate đã ổn định. Không tắt guard/lint/security/a11y chỉ để đạt xanh.

Chỉ dừng đúng action thật sự bị chặn bởi tool/security/authority/input cần thiết hoặc conflict không thể hòa giải an toàn. Ghi chính xác action, thông báo lỗi, ảnh hưởng và quyết định cần thiết; tiếp tục các phần còn làm được. Nếu có material business/privacy/retention/cost/release trade-off, gom thành một quyết định cụ thể cho đúng owner, không tự đổi policy. Không dùng thiếu reviewer/quota, visual approval hay production hosting để dừng toàn bộ author work local không phụ thuộc chúng.

## 7. Một bàn giao tổng hợp khi hoàn tất

Viết **`docs/implementation/p0-zcode-execution/final-return.md`** và cập nhật workboard/evidence của cùng assignment. Final return phải đủ để reviewer kiểm tra cả sản phẩm:

- Actual identity/tool/model; branch/base/current working-source/diff hashes; changed paths và design/contract revision thực dùng.
- Danh mục 20 FR: backend symbol/API, frontend route/interaction, test/evidence, implementation gap nếu còn.
- 63 AC + 14 NFR: expected/actual, commands/cwd/UTC/exits/skips, evidence; phân biệt chưa chạy, blocked và fail.
- Ba GW ledgers đầy đủ actor/state/proof/version/event/readback; nhánh âm/recovery và repeated filing cycles.
- Hướng dẫn local start/login/seed/run/test/stop/restore; nơi private config được owner giữ mà không tiết lộ giá trị; resource ownership và disposition.
- Known defects/blockers/risks còn lại, gồm browser/human study, independent design/architecture/security, Mimosa, hosting/Cloudflare/cost/release; không che dưới “done”.

Chỉ dùng **`FULL_P0_BE_FE_IMPLEMENTED_SELF_TESTED_PENDING_REVIEW`** khi cả BE và FE đủ toàn bộ scope, applicable author tests thực sự pass và không còn known critical/high implementation defect.

Nếu code đầy đủ nhưng mandatory execution bị chặn: **`IMPLEMENTED_WITH_VERIFICATION_BLOCKERS`**, liệt kê exact rows. Nếu còn thiếu code: **`PARTIAL_IMPLEMENTATION` / `IN_PROGRESS`**, không nói đã hoàn thành plan. Không self-award DONE/ACCEPTED/production-ready, không biến local test thành production security/$0/Cloudflare proof.

Review độc lập diễn ra **sau bản author candidate tổng hợp**, không sau từng wave. Bạn chịu trách nhiệm sửa findings thuộc implementation khi reviewer trả về; bạn không tự làm reviewer độc lập cho code của mình.

**Bắt đầu ngay từ checkpoint hiện tại: tiếp tục phần source chưa làm, nối đủ backend và frontend, tự test/sửa, đi hết W1–W7. Không trả thêm một bản kế hoạch hoặc dừng ở một phần nhỏ.**
