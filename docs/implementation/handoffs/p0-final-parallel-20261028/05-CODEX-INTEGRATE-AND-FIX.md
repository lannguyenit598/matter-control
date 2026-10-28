# MC-P0-FINAL-RETURNS-INTAKE-AND-FIX — Codex chính, chạy sau các returns

Owner: actual Local Codex primary-source writer. Priority P0. Đây là continuation của assignment hiện tại, không restart W0/W1–W7. Không tạo competing writer. Các phiên review/restore/auth/UI chỉ tạo evidence/test riêng; chỉ bạn sửa source chính sau khi xác định chúng đã nhả resource/source testing slots.

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

## Intake và hoàn thiện

1. Đọc bốn namespace `docs/testing/p0-final-parallel-20261028/{review,restore,zitadel,ui}/`. Input chưa về không được tự tạo return/PASS. Có thể intake từng phần sớm; giữ source frozen cho các session đang bind theo manifest, gom findings trước một lượt fix để tránh phá pin song song.
2. Verify return+outputs-manifest/raw-export byte equality, actual identity, test commands/status, source hashes/HEAD, resource disposition và privacy. Không đổi baseline hoặc xóa failed attempts để che defects. Match review fixes với exact source revision, không suy diễn “same HEAD” khi source uncommitted.
3. Normalize findings: confirmed defect/verification gap/policy decision; duplicate chỉ link chung, không đóng do “đã báo trước”. Không mở lại approved OBD/positioning. Decision mới thực sự material thì trình lựa chọn cụ thể một lần.
4. Sau khi runtime owner nhả test slot/source readers xác nhận snapshot frozen hoặc stopped, implement toàn bộ confirmed source defects trong cùng continuation: BE/API/FE, full locale gaps có phạm vi requirements rõ, UI alignment/history/state/recovery. Reuse helpers/primitives/domain evaluator; không thay architecture/IdP/cloud config hoặc cắt chức năng để khớp prototype. Trước sửa đọc relevant component rules/skills/callers, viết regression meaningful, red→green khi khả thi. Không commit/merge/deploy.
5. Update contract revision chỉ khi wire/behavior thực đổi và được authority hiện tại bao phủ; retain prior bytes/pins/authorship. Mọi policy/infrastructure tradeoff khác vẫn PO. Không sửa old QA output để thành pass.
6. Sau source ổn định, chạy required checks phù hợp trên bytes mới: backend sqlc/gofmt/tidy/lint/race và hai fixture DB tách biệt; FE pnpm check/build + required route/component/E2E/Storybook checks theo component rules và khả năng tool. Native suite không chạy trên product runtime DB. Không gọi mock/service success là browserE2E. Không rerun full suite lặp vô ích sau cùng bytes đã pass.
7. Repin source +delta/hashes, giao **bounded recheck** cho actual nonauthor reviewer (phải user-authorized/direct route thật; tạo prompt không bằng dispatch). Nếu reviewer/quyền runtime unavailable thì giữ pending với exact action. Không tự phê duyệt phần mình sửa.
8. Teardown chỉ own resources đã không còn consumer, verify PID/start/cwd/container/DB identity trước stop; giữ DB/object/evidence theo ledger. Không prune/delete volume/kill unowned; lỗi auth/permission thì báo resource disposition thực.
9. Cập nhật workboard/project-status/risks/coverage trung thực; acceptance từng yêu cầu dựa evidence. Final report liệt kê implemented, current tests, missing/human-only/blocked, independent verdict, source pin, resource disposition và next action. Không MC-002 DONE/fullP0 accepted/production/Cloudflare/$0/IdP recovery nếu gate thiếu.

Output intake/fix mới dưới `docs/testing/p0-final-parallel-20261028/integration/`; source edits only `apps/backend/**`, `apps/frontend/**`, assigned local ops plus required coordination docs. Source build/runtime prerequisites phải được inventory và authority hiện tại xác minh; không mặc định được đọc secret ngoài đúng scope riêng runtime/auth. Một return tổng hợp cuối, không dừng ở mỗi wave để xin “tiếp tục”. Kết thúc skipped + remaining risks.
