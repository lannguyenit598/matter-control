# MC-P0-FINAL-SOURCE-RESTORE-R1 — Codex DevOps riêng

Owner: actual Local Codex, session Restore. Priority P0. Requirement NFR-003/004 + CL-07; local synthetic recovery only. Độc lập với review/UI/Cloud; không sửa source.

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

## Allowlist riêng và prerequisites

Có quyền qua công cụ chính thức kiểm tra Docker local và thực thi đúng script đã pin: `ops/p0-local/restore-rehearsal/{run.sh,verify.py,test_verify.py}`. Đọc credential duy nhất `/tmp/mc-p0-zcode-testenv/dsns.env` trong bộ nhớ subprocess sau khi xác minh file regular, owner hiện tại, mode0600, không symlink. Dùng PRODUCT_DSN/RESTORE_DSN; không in DSN hoặc nội dung. Không đọc Cloud API key/IdP/admin config.

Resource được giao:
- Source container `mc-p0-zcode-pg-product-test`, loopback55442.
- Target container `mc-p0-zcode-pg-restore-target`, loopback55443.
Chỉ tạo **DB mới có run ID độc nhất** và object/work roots mới; không dùng native fixture55441, `mc_p0_run`, instance IdP, DB/volume cũ hoặc DB của phiên Cloud. Không tự start/restart/stop/reconfigure container đã có; nếu stopped/identity sai thì báo blocker cụ thể. Xác minh ownership labels/ID/ports và cluster khác nhau; không chỉ tin tên container. Cùng container có DB của task khác không đồng nghĩa được quyền mutate DB đó.

## Thực hiện

1. Pin script + current backend theo final-source-manifest. Xác minh phiên primary không còn đang ghi source bằng checkpoint/source hashes; process agent còn sống không tự chứng minh đang viết. Không tạo writer mới.
2. Đọc retained runs `20261028T071518Z`/`20261028T072524Z`, blocked final-source receipt; không sửa/xóa chúng. Quota failure trước không là runtime PASS hay đánh giá unsafe. Chỉ thử thực thi qua cơ chế quyền chính thức đang khả dụng; không bypass nếu vẫn lỗi.
3. Rerun pure checker9cases + shell syntax, lưu command/UTC/exit riêng.
4. Chuẩn bị run mới dưới output task này; dùng `MC_RR_OUT=<output>/runs/<UTC-id>` và `MC_RR_WORK=/private/tmp/mc-p0-final-restore-<id>` (đều absent trước). Đọc script và xác nhận actual generated SRC_DB/DST_DB/NEG_DB là mới; structural DSN helper không query/no-query/target override hazard. Không chạy sed/echo chứa credential.
5. Chạy đúng `rtk proxy bash ops/p0-local/restore-rehearsal/run.sh` với private env/overrides trong subprocess; không đưa secret vào argv/log. Không chạy full Go race song song trên cùng test DB nếu phát hiện phiên khác đang sử dụng; dừng phạm vi xung đột.
6. Đánh giá evidence thật: exact source-at-B vs restored identity/count/fact sets; census/hash/objects; marker source1/restore0; readback fresh-process restart; corrupt/truncated archives nonzero +0tables; altered/missing object được phát hiện theo thực tế. Số Matters có thể khác54 vì test inventory thay đổi: đo lại, không hardcode hay giảm seed để ép khớp.
7. Nếu script fail: giữ logs/exit, phân loại env/source/test defect, không sửa script rồi chạy ngoài scope. Return CHANGES_REQUIRED cho Codex chính. Không claim RPO/RTO sản xuất/IdP recovery/$0.
8. Cleanup chỉ temporary archives/negative DB do chính run tạo theo script. Retain source/target DB/object roots để QA và kê disposition; không DROP existing DB/prune/remove volume. Source/checksum closing không drift.

Output duy nhất: `docs/testing/p0-final-parallel-20261028/restore/` gồm `return.md`, `inputs.json`, `commands.json`, `resource-disposition.json`, `runs/<id>/`, `outputs-manifest.json`. Mọi runtime phải có argv/UTC/exit/raw→export hashes và privacy-reviewed public evidence. Proposed IN_REVIEW; reviewer actual independent QA, Codex chính intake, không self-award final recovery acceptance. Nếu official approval quota vẫn lỗi: NOT_EXECUTED_APPROVAL_REVIEW_UNAVAILABLE + action cụ thể; hoàn thành pure/static phần còn lại.
