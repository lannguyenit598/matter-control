# MC-P0-CLAUDE-BROWSER-IDP-RESTORE-R2

Bạn là actual Claude Code, tiếp tục sau RV-001. PO giao bạn thực thi local browser/IdP/restore; OpenCode review source song song. Bạn là tác giả một phần source: đây là AUTHOR_RUNTIME_VERIFICATION, không phải independent source acceptance. Làm tới khi hoàn tất phần khả dụng và một return tổng hợp; blocker email/browser không chặn restore hoặc test độc lập khác.

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; HEAD `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`. Ghi actual tool/version/model, không tự đổi provider/model. Đọc AGENTS root/component, RTK, project-status/task MC-P0-CODEX-PRIMARY-REMEDIATION-20261028.

## Candidate và input precedence

Candidate authoritative: `docs/testing/p0-final-parallel-20261028/claude-rv001-fix/source-manifest.json`, SHA256 `de8424ead1e9cd911c7a6fe124b48e5d67b6dcc9e519bb10a8b87453b05d4489` (719 entries); delta SHA256 `38e9eb4fbd8f27ab256c404df29357176c91643bf73105f84b811b1732633b54`. Verify manifest file và mọi member mở/đóng. Hash hiện tại của contract `docs/implementation/p0-zcode-execution/local-contract.md`: `814c419222b966d6f340cb421ab8d8d44b3310ece336cc9cbe1b747472194e30`. Design R9 manifest `2b68bc92431270dc456111590ca1de2231e2a10dba95829dccd0a3b68ba87563`; verify actual entries khi consume.

Đọc hướng dẫn chi tiết cũ ở `docs/implementation/handoffs/p0-final-parallel-20261028/02-CODEX-RESTORE.md`, `03-CODEX-ZITADEL-RUNTIME.md`, `04-ANTIGRAVITY-UI-E2E.md`. Lần này thay owner bằng actual Claude, baseline bằng 719-file manifest trên, output bằng namespace R2 bên dưới. KHÔNG dùng bảng pin/source a62d838/714 cũ để từ chối candidate mới hợp lệ. Giữ safety/resources/acceptance thực chất của các prompt đó. Pin historical inputs như historical evidence, không sửa chúng.

Đọc actual `docs/testing/p0-final-parallel-20261028/{restore,zitadel,ui}/return.md`, resource ledgers, runtime-ready và auth-slot-released nếu tồn tại. Restore cũ có PASS_LOCAL_SYNTHETIC_FINAL_SOURCE cho 714-file candidate, không còn là chưa chạy; cần compare backend/restore delta trước kết luận applicability. IdP return ghi BLOCKED_EMAIL_VERIFICATION; không tự kết luận user đã verified vì đã có client config.

## Ownership và scope

Source freeze trong lúc OpenCode review. Không sửa apps/backend, apps/frontend, contract/workboard/design, không regenerate, install/upgrade, stage/commit/push/deploy. Nếu có defect thì giữ reproduction + CHANGES_REQUIRED, trả Codex intake; chỉ sửa sau review/runtime slots được release và assignment riêng. Có thể tạo test/config/orchestration riêng dưới output mới hoặc private scratch, pin những bytes đó. Build trong isolated public-source snapshot dùng dependency hiện có; không copy .env/keys hay private files vào snapshot.

Chỉ synthetic, local stack và existing ZITADEL Cloud test instance Free đã cấp. Không tạo paid resources, đổi billing/provider policy/IdP email verification/MFA/redirect/roles, không tự admin-verify email, không dùng admin account thay A/B. Human nhập password/MFA/verification trực tiếp, không qua chat/log. Không lấy cookie/token của session người khác.

Credential allowlist kế thừa: API key `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/keys/396983916088540712.json` chỉ dùng existing server verifier; DB file `/tmp/mc-p0-zcode-testenv/dsns.env`. Kiểm regular/current uid/mode0600/not symlink, load privately vào subprocess memory. Không print/hash/export credential/DSN/cookie/token/assertion, không env dump/set-x, không đọc secret khác. Nếu thiếu hoặc quyền bị chặn, báo đúng blocker; hoàn thành phần không phụ thuộc. Mọi quyền runtime qua cơ chế chính thức, không bypass.

## A — Runtime/IdP và browser

1. Reconcile actual retained runtime identity/source version/ports bằng ledger và read-only probes. Retained process không tự động được bàn giao chỉ vì cùng repo; chỉ tiếp quản lifecycle nếu có release/owned handoff rõ. Nếu không có, coi unowned và không signal/reuse; lập runtime mới khi ports/callback cho phép. Không kill process chỉ để giải phóng 3000/8081, không tự đổi Cloud callback. Fresh DB/object dirs độc nhất, migrations chỉ DB mới. Không start/stop/reconfigure existing container. Dùng permitted task product container đúng ID/labels/loopback55442 sau fresh check.
2. Build/run đúng pinned source API + frontend REST (không demo). Ghi ownership PIDs/start/cwd/executable/ports, nguồn build, health/auth-negative thật. Cập nhật cue trong output R2 riêng; cue cũ chỉ là lịch sử. `playwright.config.ts` mặc định demo không chứng minh REST: nếu browser tool được phép, config riêng target owned REST runtime, không tự launch thêm stack, không fake auth/API route mocks.
3. ZITADEL public configuration dùng từ original Cloud prompt/ops README. Kiểm human A/B thực sự nhận được email/xác minh qua normal flow. Nếu còn invalid mailbox => BLOCKED_EMAIL_VERIFICATION, báo bước human/admin cần thực hiện; không vòng lặp đăng nhập vô ích và không disable verification. Vẫn chạy signed-out/error/browser tests và restore.
4. Khi human login khả dụng: actual hosted PKCE/state/nonce/callback → server session → Go issuer/audience/sub acceptance. Verify trusted in-memory/server flow, public output chỉ booleans/status/problem/public IDs. A/B isolation, workspace then Matter membership, VIEWER write denial, scoped grant/revoke/recheck trên fixtures MỚI của run. Không sửa provider roles hoặc dữ liệu cũ.
5. Actual refresh/expiry/logout/relogin nếu khả dụng; chưa tới real expiry ghi WAITING_REAL_EXPIRY, không thay token lifetime/mock-clock để claim runtime. Outage chỉ own API process, khôi phục đúng identity, không stop PG/IdP.
6. Browser thật: RV-001 Back link không ra external origin, normal causal Back/query/context; R9 desktop/mobile/reflow/keyboard/focus/dialog/permission/unavailable/access-loss/regrant/EN-VI, Golden Workflows chạy được xuyên REST. Mapping từng case requirement/expected/observed/evidence; không gọi mock/ARIA source là rendered/screen-reader PASS. Capture synthetic app only; tắt HAR/auth traces/video mặc định, tránh URL code/token và storageState public. AC-137 chỉ con người thật: chuẩn bị protocol nếu chưa có người, không giả 5 managers.
7. CR-002 vẫn DECISION_REQUIRED: có thể tái hiện limitation trên synthetic fixtures bằng observation, không tự chọn persistence hay blind retry/mint key sau OUTCOME_UNKNOWN. Giữ original receipt/key và readback theo contract.

## B — Restore trên candidate hiện tại

Restore script pins:
- `ops/p0-local/restore-rehearsal/run.sh`: `8e4af211f4b6fadedccafa853d0939d1ef6b91b3cd2a1f602ebbb571477ec288`
- `verify.py`: `93e2177298915534e341594f2119d26ff9c66115abf5903d408ffd6d4a2f044b`
- `test_verify.py`: `80d8c5ed14cbd6bff79479b7547434b3b4455209d1eefec7fee60c7aae4e64d3`

Read/pin old return and actual retained evidence, compare backend/ops bytes with old 714-file manifest and disclose unchanged/changed; không tuyên bố frontend được restore. Chạy một fresh rehearsal gắn candidate mới, không xóa run cũ. Pure checker 9 tests + bash syntax; runtime qua exact script với private env MC_RR_OUT/MC_RR_WORK đến fresh unique paths. Verified existing product55442 và restore-target55443 là distinct clusters/IDs/labels; chỉ DB mới/run roots mới, không DB của auth hoặc native55441, không mc_p0_run. Không full suites destructive trên shared DB.

So source-at-B/restored exact IDs/facts, table census/hash/object integrity, marker1/0, fresh-process readback; corrupt/truncated archive; altered/missing object detection. Đo actual counts, không hardcode54/3 hoặc production RPO/RTO. Capture actual argv/cwd/UTC/exits/inputs/raw→redacted lineage. Nếu script fail giữ evidence, không sửa pinned script trong lúc review. Cleanup giới hạn owned attempt theo script; giữ source/target DB/object roots cho QA, không drop existing DB/container/volume/prune. Không tự dùng quyền cũ để điều khiển retained runtime chưa bàn giao.

## Outputs và finish

Sau absence check tạo duy nhất `docs/testing/p0-final-parallel-20261028/claude-runtime-r2/` với các subdirs browser/, idp/, restore/, resources/. Existing namespace thì inspect và resume đúng identity/attempt; không ghi đè artifact người khác.

Return tổng hợp: identity/author status, opening/closing source pins, input lineage, commands UTC/exit, per-case results PASS/FAIL/NOT_RUN/BLOCKED với evidence, resource ledger/ownership/cleanup, sanitized outputs manifest (không tự tham chiếu), skipped/risks và exact human/next action. Giữ raw auth/DB artifacts private, scan public exports chống secret trước bàn giao. Chuẩn bị càng nhiều test độc lập càng tốt nếu một gate blocked. Không tự cấp independent PASS, MC-002 DONE, production/release/cost/Cloudflare approval.

Không dừng chỉ sau intake hoặc planning; chạy phần đã được giao qua công cụ được phép và trả actual execution evidence, hoặc blocker cụ thể theo từng phần.
