# MC-P0-FINAL-DELTA-REVIEW-R1 — reviewer độc lập

Owner: actual OpenCode; có thể dùng một session Local Codex mới không tham gia author remediation nếu OpenCode không khả dụng, do operator chủ động chọn. Identity phải đúng product/session thật; không gọi Codex subagent là OpenCode. Priority P0. Requirements RULE-007/014/016/019, NFR-003/004, R9 access-loss/history/scope. Đây là independent review, không implementation.

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

## Phạm vi và công việc

READ/HASH/STATIC + pure targeted tests; không lifecycle/DB/cloud/browser/private reads. Đọc:
- `docs/testing/p0-codex-remediation-20261028/review/{return.md,inputs.json}`, `review-intake.json`, `source-delta.json`, current contract12.
- Năm pin đổi cuối: `apps/backend/internal/core/service/{brief_replay.go,brief_replay_test.go,filing_service.go}`, `apps/frontend/src/features/data-transfer/components/{recovery-gate.tsx,recovery-gate.test.tsx}`.
- Cần ngữ cảnh: `brief_proof.go`, service `dataops_service.go`, `work_service.go`, shared `repotest/mattercontrol/contract_w6.go`; FE `pending-attempts.ts`, `actions.ts`, `recovery-session.ts`, bulk/import callers và tests. Đọc đúng đường dẫn trong source manifest, không đoán import path.
- Phần UI mới chưa review sâu: Matter scope/layout + test, Matter history/page/pagination/schema/repository, MatterTabs, five-axis work grid/badges, globals/primitives/header và locale infrastructure; `src/components/organisms/recovery.test.tsx` có sửa chờ pending transition. Dùng source manifest để tìm exact files. Review correctness, authorization, scope/currentness, accessibility từ source; không nhận visual acceptance.
- Receipts final: `validation/backend-r4/` 764pass/4skip, `validation/frontend-r5/`44files/444tests + Webpackbuild; `restore/runs/20261028T072524Z/`54Matters/3objects trước final legacy-owner fix; `restore/final-source-run-blocked.json`.

Thực hiện một lượt tổng hợp:
1. Xác minh input và input→tested-source bindings. Tách báo cáo review cũ khỏi delta mới; không viết lại review cũ.
2. Kiểm tra new Filing snapshot owner/null, stage/closure/reopen, full snapshot restore provenance; legacy omitted owner phải failclosed đến snapshot thật, không làm mất Filing hợp lệ mới.
3. Historical t2 phải dùng đúng criteria/revision/epoch/expiry/alternatives/dispute/version/dependency rules. Mất history phải failclosed rõ, không biến toàn bộ histories đủ dữ kiện thành unavailable. Imported claim không được tăng quyền/verification.
4. Recovery đọc reload không mutation; cached terminal rows trả lại sau authorize và không rePOST; chưa ACK không thể direct-begin attempt mới hoặc đổi payload/scope; ACK matching kind/Matter/key; late completion không xóa attempt khác; mất quyền purge cả payload/results và regrant không revive. Không lưu legal payload/tokens trong browser storage.
5. Matter scope/history không rò data sau mất quyền, pagination giữ đúng Matter/cursor, không tự bịa actor/cause/asOf. Phân biệt thiếu localization/rendered validation với lỗi source thực.
6. Chạy targeted pure tests nếu tool sẵn: replay tests, shared-memory owner case, FE pending-attempt/recovery-gate/attempt tests, scope/history tests, 9 restore checker tests + bash syntax. Không full PG suite/restore. Unset DSN env cho Go; task-specific cache. Không import scanner/app có side effects ngoài scope. Ghi exact test names/command/exit; tests không chạy không được cite là reviewer-run.
7. Closing hashes sau mọi output. Một return duy nhất; findings P0/P1/P2 có file:line, trigger, expected/actual, minimum fix và regression; không sửa source để tự đóng finding.

Output duy nhất: `docs/testing/p0-final-parallel-20261028/review/` gồm `return.md`, `inputs.json`, `checks.json`, `findings.json`, `outputs-manifest.json` (không pin chính nó). Không review PASS chung cho phần chưa đọc. Verdict: PASS_WITH_LIMITATIONS / CHANGES_REQUIRED / NEEDS_INPUT_REFRESH. Reviewer = actual nonauthor; Codex chính intake, mọi fix phải được recheck phù hợp. Kết thúc skipped work + residual risks.
