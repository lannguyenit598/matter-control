# MC-P0-OPENCODE-POST-RV001-REVIEW-R1

Bạn là actual OpenCode, reviewer không phải tác giả. PO giao review candidate sau RV-001 trong khi Claude chạy runtime ở namespace khác. Đọc toàn bộ prompt rồi bắt đầu; hoàn thành return có bằng chứng hoặc blocker cụ thể.

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; HEAD `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`. Xác minh actual identity/tool/model và conflict authorship. Không đóng vai Claude/ZCode, không tự đổi provider/model.

## Input và identity

Đọc root/component AGENTS, RTK, current-workflow, project-status và task MC-P0-CODEX-PRIMARY-REMEDIATION-20261028. Routing lần này do PO chỉ định OpenCode review, Claude runtime. Các chỉ dẫn baseline cũ chỉ là lịch sử.

Packet mới `docs/testing/p0-final-parallel-20261028/claude-rv001-fix/`:

- `source-manifest.json`: SHA256 `de8424ead1e9cd911c7a6fe124b48e5d67b6dcc9e519bb10a8b87453b05d4489`, 719 entries.
- `source-delta.json`: SHA256 `38e9eb4fbd8f27ab256c404df29357176c91643bf73105f84b811b1732633b54`, 4 modified, 0 added/deleted.

Hash hai file và verify toàn bộ member bytes/hash ở đầu/cuối. Đọc return/inputs/checks; pin chúng trong review-inputs mới. Source drift => NEEDS_INPUT_REFRESH, không sửa source/manifest. Đọc thêm `claude-comprehensive-review-r1/{return.md,findings.json,source-delta.json}` và `review/comprehensive-delta-r1/{return.md,findings.json}` trong cùng final-parallel root. Packet comprehensive có EX-03 sai đã bị supersede; comprehensive-delta-r1 là AUTHOR_SELF_REVIEW_NOT_INDEPENDENT, không kế thừa thành độc lập. Pre-fix hash f9cbbdf4… là manifest tái capture do author khai; phân biệt với manifest comprehensive f596b7c6…; ghi lineage chưa chứng minh nếu thiếu actual artifact, không tự dựng lại.

## Scope review

1. RV-001: đọc `apps/frontend/src/lib/mc/{paths.ts,paths.test.ts}` và `oidc/{flow.ts,flow.test.ts}`. Trace `?from=` → work-item page → Link và login page/route → beginLogin → callback/resolveReturnTo. Canonical pathname bắt đầu `//` phải fallback sau URL normalization. Kiểm các biến thể dot/encoded-dot, raw backslash/control, absolute/protocol-relative; legitimate query, encoded slash, `/a//b`, normal navigation giữ hành vi. Không đòi percent decode lần hai. Phân biệt Back-link exploit với login lifecycle vốn sanitize nhiều lần và direct resolveReturnTo regression.
2. Review toàn bộ delta sau review trước: primary/partial ReadFailure, access-loss purge/regrant, test caller coverage, work-item causal navigation. Đọc `components/organisms/read-failure.tsx`, drafts tests, read-failure-callers.test.ts và callers thực tế. Whole-tab purge là limitation cần ghi rõ.
3. CR-001 import-preview error mapping: actions và data-transfer-seam test; đối chiếu backend errors/contract khi cần. bad-request có thể do invalid sheet hoặc multipart; không chứng nhận lời khẳng định “chỉ invalid sheet”. Commit/unavailable/UNKNOWN không được trình bày như thất bại chắc chắn hay tự mint key retry.
4. CR-002 giữ DECISION_REQUIRED. Không tự chọn browser persistence, server session slot/contract change hoặc waive. Report phạm vi duplicate-risk sau reload đúng evidence.

Đây là review delta và direct context, không full repository audit. Mỗi finding ghi severity, path:line, trigger, observed/expected, evidence và minimum fix. Không tìm thấy finding cũng phải nêu phạm vi đã xét.

## Thực thi và output

Read/hash/static và focused deterministic unit tests được phép. RTK mọi shell; Semble trước khám phá, Context7 nếu cần docs thư viện. Author full-check/build chỉ cited nếu không tự chạy. Không runtime/browser/IdP/Docker/PG/restore, không credential/private env, source writes, install, commit/push, provider switch hay dispatch agent. Claude đang sở hữu runtime; bạn chỉ read source và test thuần.

Chỉ tạo output mới sau absence check:
`docs/testing/p0-final-parallel-20261028/review/opencode-post-rv001-r1/`

Gồm return.md, inputs.json, checks.json, findings.json, outputs-manifest.json (không tự hash chính nó). Evidence có actual identity, opening/closing HEAD + pins, argv/cwd/UTC/exit, personally-run vs cited, ownership/independence, skipped/risks. Nếu output đã tồn tại resume đúng session/attempt hoặc tạo attempt con mới; không ghi đè return người khác.

Verdict PASS_SOURCE_ONLY_WITH_LIMITATIONS / CHANGES_REQUIRED / NEEDS_INPUT_REFRESH. Disposition RV-001 riêng, không tự đóng P0/MC-002/browser/IdP/recovery/release. Trả một return hoàn chỉnh cho human/Codex, không chỉ planning hoặc progress.
