# MC-P0-ZITADEL-CLOUD-E2E-R1 — Codex Runtime/Auth + Human

Owner: actual Local Codex, session ZITADEL/Runtime; Human nhập credential. Priority P0. Requirement product auth, scoped permission/isolation, NFR-001/002/003. Bạn là **owner duy nhất lifecycle runtime product cho lượt Cloud/UI này**. Không sửa primary source; không điều khiển browser/session của agent UI cùng lúc.

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

## Input Cloud đã được PO cung cấp

Plan Free/Region Australia là thông tin PO, không tự xác nhận billing hoặc thay plan.
Issuer `https://matter-control-legal-dev-fm2k48.au1.zitadel.cloud/`.
Organization396978885222316422; Project396983669648046470.
Web client396983754624613928; callback `http://localhost:3000/api/auth/callback`; Dev mode/refresh đã bật theo PO.
API client396983864414715432.
Synthetic A sub396984919567415686; B sub396984802881878406.

Private API key allowlist DUY NHẤT: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/keys/396983916088540712.json`. Dùng tại chỗ cho existing API introspection flow sau khi kiểm regular/uid/mode0600/not-symlink và clientId đúng (chỉ ghi boolean). Không print/hash/copy/upload key; không JSON toàn bộ vào context hoặc diagnostic. DB fixture credential allowlist `/tmp/mc-p0-zcode-testenv/dsns.env` chỉ load vào subprocess privately sau các kiểm tra tương tự. Không đọc secret khác để “thử cho chạy”. Không hỏi Human dán password/token/cookie vào chat.

Đọc `ops/p0-local/cloud/README.md`, public overlays/examples, current contract/config/seed source trước chạy. README có hướng dẫn lịch sử không phải blanket authorization: không tự start `mc-p0-claude-pg`, sửa `.env.local`, seed vào `mc_p0_run`, đổi Cloud lifetime/redirect/provider/plan, hoặc inspect token qua browser devtools. Audience/claims được xác minh trong trusted existing server verifier hoặc kiểm tra riêng trong bộ nhớ và chỉ xuất boolean/canonical public expected identifiers. Không xuất access/refresh token.

## Provision/runtime local giới hạn

- Kiểm kê nguồn/binaries/ports và exact existing ownership. FE canonical localhost3000, API loopback8081 chỉ dùng nếu còn trống hoặc resource đã có được owner bàn giao rõ. Port có listener chưa owned => báo, không kill/reuse tùy tiện. Không đổi callback hay hosts để né xung đột.
- Dùng DB synthetic **mới** và object dir **mới** cho runtime Cloud/UI trong owned product container `mc-p0-zcode-pg-product-test` nếu verified healthy/label/55442 đúng. Không sử dụng DB của native/test suite/restore, `mc_p0_run` hoặc IdP. Ghi run ID/database name (không DSN). Qua công cụ chính thức CREATE đúng DB mới, migrate chỉ DB mới, map A/B đúng public issuer+sub sau đọc seed source; không email-link, không tự cấp membership toàn cục.
- Build/run product BE/FE từ source pinned bằng env riêng theo process, không ghi overlay vào primary `.env.local` hoặc sửa file người khác. Dùng dependency hiện có; không install/upgrade. Webpack production build đã pass; default Turbopack bị compiler-port denial, giữ sự phân biệt. Nếu cần build/run theo CLI khác, tra Context7 trước; không tắt security checks.
- Record actual PIDs/start times/cwd/executable/source hash + bound ports, ownership ledger, safe stop procedure. Chỉ tín hiệu tới process chính mình tạo và identity được xác minh lại; PID tồn tại không đủ ownership. Không stop Docker/IdP để test outage.
- Tạo `runtime-ready.json` **chỉ sau** startup/health/read auth-negative kiểm chứng thật; ghi source manifest hash, exact origins, resource identities, profile REST, DB/object scope, available synthetic fixture IDs, readiness limits và lifecycle owner. Không credential/cookie/token. Health ready không nghĩa Cloud login hay UI PASS.

## Kịch bản phải kiểm chứng

1. Without token/bogus token từ local requests: auth-negative đúng, outage phân biệt từ chối với unavailable. HTTP status và sanitized problem code thôi.
2. Human login A bằng hosted login thật qua browser được phép. Tạm dừng tại password/MFA/consent và hướng dẫn human nhập trực tiếp; không bypass/đọc password. Code callback/PKCE/state/nonce/session currentness token-server-only theo source và actual runtime; browser chỉ opaque HttpOnly cookie. Không lưu raw network headers/HAR/traces có token.
3. Xác minh real token accepted cho expected issuer/audience/subject bằng existing trusted verifier; canonical expected public IDs ghi được, token không xuất. Redirect307/health200 không thay cho bước này.
4. A tạo workspace/Matter synthetic mới trong app. B chưa được cấp quyền phải không đọc được. Theo contract, B cần active workspace membership trước khi grant Matter role; không bypass bước đó bằng IdP role. Grant B VIEWER/EDITOR theo permission matrix, A-only Matter khác vẫn hidden; viewer write denial, cross-Matter read/write denial, revoke và role change recheck. Chỉ sửa memberships của fixtures mới do task tạo, không dữ liệu cũ/provider roles.
5. Refresh qua luồng thật khi token vào refresh window; không đổi Cloud token lifetime để rút thời gian. Nếu chưa tới expiry, WAITING_REAL_EXPIRY/NOT_RUN, không dùng mock clock rồi gọi runtime PASS. Session expiry/sign-out/logout/re-login/callback failures và unavailable mapping: ghi actual observation, không mặc định revoke tức thì nếu contract có cache TTL.
6. Outage chỉ API subprocess owned, đo503/unavailable vs empty-data, khôi phục đúng ownership. Không stop PG/IdP/container người khác. Thực hiện trước bàn giao UI hoặc trong slot độc quyền sau khi UI giải phóng; không phá test song song.
7. Ghi `auth-slot-released.json` khi hoàn thành các test đổi session/roles/outage, kèm kết quả thật hoặc blockers và sanitized runtime ledger. UI chỉ dùng sau cả runtime-ready + slot-released, không cần đợi mọi refresh/human gate PASS nếu report rõ chưa chạy. Không teardown runtime đã bàn giao cho UI; keep running theo ledger để coordinator quyết định cleanup. Nếu không thể giữ, report explicit runtime unavailable, không phát cue giả.

Output duy nhất: `docs/testing/p0-final-parallel-20261028/zitadel/` gồm `return.md`, `inputs.json`, `commands.json`, `auth-cases.json`, `runtime-ready.json` khi đủ evidence, `auth-slot-released.json` khi nhả slot, `resource-ledger.json`, `outputs-manifest.json`. Nếu chỉ preflight xong: PARTIAL/BLOCKED, không “Cloud E2E PASS”. Codex chính intake, reviewer độc lập kiểm kết quả. Kết thúc skipped/risk, nhất là process-memory session không phải durable recovery/production deployment.
