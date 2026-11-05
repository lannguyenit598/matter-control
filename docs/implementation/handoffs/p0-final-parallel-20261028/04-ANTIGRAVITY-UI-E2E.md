# MC-P0-UI-REST-E2E-QA-R1 — Antigravity UI/UX + product QA

Owner: actual Antigravity; kiểm thử độc lập đối với remediation Local Codex, không phải implementation frontend mới. Priority P0. Requirements R9 UIUX/access-loss/independent axes, NFR-010, Golden Workflows và AC-137 (human-only). Không tự launch agent nền rồi dừng ở progress; hoàn thành một return tổng hợp hoặc blocker thật.

## Nhiệm vụ và baseline chung

Repo: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch: `codex/unified-project-flow`.
Git base/head khi chuẩn bị: `a62d838791ba188838c4ff00b7b6e265ac775056`.
Source sản phẩm đang uncommitted: HEAD giống nhau không đủ chứng minh cùng source.

Đây là assignment thực thi khi Product Owner dán prompt này vào đúng phiên agent. Bắt đầu phần được giao ngay qua công cụ được phép; không chỉ trả planning pass hoặc yêu cầu phê duyệt lại những phần đã được PO cho phép. File prompt được chuẩn bị không có nghĩa đã dispatch/executed. Không tự đổi provider/model, login hoặc cấu hình agent. Ghi identity/tool/version/model thật và xác nhận bạn không phải tác giả của phần mình review. Đọc AGENTS root/component, RTK, current-workflow, task `docs/implementation/tasks/MC-P0-CODEX-PRIMARY-REMEDIATION-20261028.md` và return hiện tại trước khi làm.

Các input phải xác minh bytes + SHA256:

| File | SHA256 |
|---|---|
| `docs/testing/p0-codex-remediation-20261028/final-source-manifest.json` | `0f169ae1a25a0a94b591941d36eec78e8091c1c8beabc5357e193c8f0e5fd821` |
| `docs/testing/p0-codex-remediation-20261028/return.md` | `c3c81cbcc76bc93f563fc23b1a5681f4a75c3bc9d6bb80f1fecc96dfee673583` |
| `docs/testing/p0-codex-remediation-20261028/review-intake.json` | `c611c7e3103f18a9d8558a56a23ba717099391f7456801e3be1b4b78cf2e57b1` |
| `docs/implementation/p0-zcode-execution/local-contract.md` (revision12) | `814c419222b966d6f340cb421ab8d8d44b3310ece336cc9cbe1b747472194e30` |
| `docs/design/p0-handoff-r9/return.md` | `d4dc769f1958f486a17a9a90fa5b1060de3172a2b07b544c6f1adff788b14b3d` |
| `docs/design/p0-handoff-r9/manifest.json` | `2b68bc92431270dc456111590ca1de2231e2a10dba95829dccd0a3b68ba87563` |

Đọc/hash source cần thiết theo entries của final-source-manifest; R9 theo manifest riêng. Nếu pin lệch: báo exact path/hash/byte drift, giữ `NEEDS_INPUT_REFRESH` cho phần phụ thuộc; không sửa manifest hoặc source để ép khớp. Có thể tiếp tục phần độc lập không phụ thuộc input lệch. Giữ requirement IDs, scope và lịch sử; không mở lại discovery hay đổi business rules. Shell command prefix `rtk`, raw commands dùng `rtk proxy`. Semble trước khám phá code; đọc exact path/kiểm tra literal khi đã biết vị trí. Context7 resolve→query trước dùng API/config/CLI framework mới, không đoán flags.

## Ranh giới chung

- Chỉ local/synthetic; giữ mọi dirty changes và resource hiện có. Không reset/stash/clean/switch/stage/commit/merge/push, không sửa index/hooks/Mimosa/baseline/immutable evidence.
- Không production/deploy/paid/billing/provider admin hoặc bypass quyền. Giữ trạng thái `NOT_RUN`, `OUTCOME_UNKNOWN`, `BLOCKED` khi không có bằng chứng. Các quyền shell/browser/credential vẫn phải đi qua cơ chế chính thức. Nếu automatic approval review lỗi/hết quota, ghi action NOT_EXECUTED và lý do; không dùng đường khác để lách.
- Không chạm source primary, workboard, contract, AGENTS, task/status của người khác; chỉ owner Codex chính hợp nhất findings và sửa source. Ngoại lệ của từng task chỉ là resource/runtime synthetic hoặc file test riêng được nêu rõ bên dưới.
- Không đọc `.env`, `keys/`, private runtime files hoặc credential trừ đúng allowlist task được cấp bên dưới. Không in/hash/copy/export key/token/password/cookie/assertion; không env dump/set-x. Không ghi chúng vào argv, prompt, ảnh, log, trace hoặc manifest. Public subject/client IDs có thể ghi.
- Chỉ output mới trong namespace riêng; kiểm tra vắng trước tạo. Nếu đã có, đọc metadata để resume đúng task/attempt; không ghi đè artifact khác hay kết luận collision là được quyền sửa. Mỗi attempt mới dùng thư mục mới với UTC thật.
- Ghi mỗi command/action: argv đã loại secret, cwd, UTC start/end, exit/status, input hashes, artifact path. Log đầy đủ giữ ở nơi private nếu chứa auth/session data; public evidence chỉ allowlist/redacted và không làm mất raw lineage.
- Kết luận: source/static, unit/service/PG/HTTP, browser/human và production là các loại bằng chứng khác nhau. Không tự đóng MC-002/C01-PRODUCT/INT-A formal51/AC-137/Cloudflare/cost/production hoặc release gate. Không biến pinned review cũ thành review final-byte.

## Hai giai đoạn, không chờ vô ích

A. Làm ngay phần source/spec: consume R9 theo 8/102 pins thực tế từ manifest (không tự hardcode count làm approval), `current-ux-spec`, screen/state matrix, validation plan, findings disposition, prototype/polish/handoff; đọc implementation handoff `docs/implementation/handoffs/MC-P0-CLAUDE-FE-DESIGN-R9-ALIGNMENT-ADDENDUM.md`, current source manifest và report. 48 historical ledger records giữ nguyên. R9/source corrections là input, không đồng nghĩa rendered acceptance. Lỗi kiểm tra409 lịch sử phải phân biệt CAS từng operation với work-graph rejection; không replace code/status toàn cục để ép suite xanh.

B. Runtime chỉ sau verified `docs/testing/p0-final-parallel-20261028/zitadel/runtime-ready.json` **và** `auth-slot-released.json`. Read back origin/source/resource ledger, xác minh REST profile/current source. Nếu chưa có, hoàn thành A + testplan/fixtures/specs trong output; đánh dấu runtime WAITING_RUNTIME_CUE, không tự start stack/mock/auth bypass. Resume chính task khi cue đến, không cần làm lại input đã pin.

## Công cụ/skills và thực thi

- Dùng các skills cài sẵn phù hợp: accessibility, design-taste-frontend, hallmark, impeccable; ghi skill thật đã đọc/dùng. Không cài thêm skill/browser/dependency hay gửi payload provider mới. Tôn trọng design R9 và hệ thống primitives hiện có; không redesign direction hoặc sửa prototype để che lệch của app.
- Nếu quyền browser/render bị deny thì giữ VERIFICATION_BLOCKED; không bypass bằng headless/browser khác/OS screenshot/server renderer/remote proxy. Pure DOM/unit không phải geometry/focus/screen-reader evidence.
- `apps/frontend/playwright.config.ts` hiện là **DEMO**: webServer/API_MODE=demo, `/dashboard`. Vì vậy không chạy `pnpm test:e2e` mặc định rồi gọi là product REST QA. Đọc fixture và cấu hình hiện có; nếu browser execution được phép, tạo config/spec **chỉ trong output riêng**, target exact externally-owned REST baseURL, webServer không tự start, workers1. Reuse/import `apps/frontend/e2e/fixtures.ts` để giữ CSP guard. Tra Context7 khi cần option/CLI hiện hành. Không sửa canonical config/tests/source; không giả auth/session/API bằng route mocks.
- Auth traces/HAR/video/network headers có thể chứa secret: tắt mặc định cho OAuth/auth flows; không chụp password/MFA/code/token/session content. Chỉ sanitized synthetic app screenshots, allowlisted response status/problem và DOM assertions. Không lưu authenticated storageState/cookie vào public QA artifact. Human login test users trực tiếp nếu browser session riêng cần; không lấy token/session từ phiên Codex auth.
- Phiên ZITADEL sở hữu lifecycle BE/FE/DB. Bạn không start/stop/kill/reconfigure stack, không đổi roles/logout trong lúc họ chạy auth test. Sau slot-released chỉ dùng synthetic fixtures mới được giao; các action app tạo thêm fixture cùng DB phải có unique ID, ledger, và dữ liệu giả. Không mutate fixtures của review/restore hay Matter cũ. Outage/revocation cần coordination slot riêng, không tự phá runtime shared.

## Coverage bắt buộc

1. Lập actual mapping13screen specs → actual routes/components,9states/screen dự kiến và trạng thái implemented/testable/missing. Không dựng sẵn kết quả hoặc xem đủ117 ô là đã chạy.
2. Render desktop/mobile + zoom200%/reflow320px với actual data dài, empty/loading/error/unavailable/permission-denied/stale/UNKNOWN/success nếu thao tác thực tái hiện được. Không có trigger thật => NOT_RUN/unreachable gap, không mock rồi gán PASS runtime.
3. Đối chiếu tokens/typography/radius/density44/36/body14/heading22, semantic color vai trò riêng5axes, dark theme, focus contrast/reduced motion, mobile touch target44. Đo geometry actual; không chỉ tìm CSS class.
4. Full keyboard: tab sequence, visible focus, dialogs trap/restore, labels/error/live announcements, table headers/scroll, navigation/Back/breadcrumb preserving scope/filter/from. Screen-reader chỉ PASS nếu actual assistive run; source ARIA lint không thay thế.
5. My Actions eligible/waiting/blocked/historical; ControlRoom boundary/currentness; Workspace/Matter/role strip; History pagination actual cursor/actor/reason/effective vs recorded/cause/before-after, no invented provenance.
6. Product workflows xuyên FE→BFF→Go→PG: requirement/action separation, dependencies/completed≠verified, proof/independent verifier, filing stages, import preview/commit/source claim, bulk per-row outcomes, export/Brief. Thực hiện các bước khả dụng trên fixtures task; binding/correlation/reload persistence qua actual API, không prototype simulation.
7. Recovery regression trên browser thật: pending request+reload/tab-close không tựmint/resend; terminal-response-lost retained receipts read khôngPOST, matching ACK mới unlock; UNKNOWN explicit same-key recovery; row/outcome counts; access-loss purge và regrant khôngrevive. Chỉ fault seam được owner bàn giao/test mode chính thức; không patch source/replace API để giả network outcome.
8. Locale đổi EN/VI không mất form intent/selection, legal user content không bị dịch/ghi đè; ghi rõ toàn bộ phần chưa localized, không gọi NFR-010 PASS vì chỉ toggle/history được dịch.
9. AC-137: chuẩn bị script/task và scoring rubric cho5 quản lý thật; không tự đóng human trial hoặc tạo participant evidence giả. Facilitator answer key tách khỏi participant packet.

Outputs duy nhất: `docs/testing/p0-final-parallel-20261028/ui/` gồm `return.md`, `inputs.json`, `screen-state-coverage.json`, `cases.json`, `findings.json`, browser evidence sanitized nếu có, participant/facilitator files tách biệt, `outputs-manifest.json`. Exact viewport/browser/tool/UTC/action/expected/observed/status/evidence/source hashes mỗi case. Không sửa app/polish.css/R9/ledger/workboard. Findings có severity, route/trigger, file:line khi biết, ảnh/DOM/HTTP proof và đề xuất fix nhỏ; Codex chính mới sửa. Nêu author/source vs runtime/human rõ; proposed IN_REVIEW hoặc CHANGES_REQUIRED, không tự gate DONE.
