# MATTERCONTROL — CLAUDE CODE TIẾP QUẢN VÀ HOÀN THÀNH TOÀN BỘ BACKEND + FRONTEND P0

Tôi là Product Owner. ZCode đã hết quota. Tôi giao **actual Claude Code** tiếp quản phần execution của assignment **MC-P0-ZCODE-EXECUTION**, hoàn thành cả backend lẫn frontend và tự kiểm thử/sửa lỗi xuyên suốt W1–W7 trước khi nộp **một candidate tổng hợp để review cuối**.

Đây là chuyển owner do quota, không phải yêu cầu làm lại sản phẩm hay review-only. Chỉ dẫn này thay owner ZCode trong phạm vi assignment local P0; không đổi independent reviewer/PO/release authority. Giữ tên/path assignment cũ để nối lịch sử. Không tự đổi account/provider/model, mua quota hay tiếp tục một action từng bị security/tool từ chối.

**Đọc xong hãy làm tiếp source thực tế. Không trả thêm planning pass, không restart W0, không dừng sau một use case, backend scaffold, W1 hoặc từng wave để xin “tiếp tục”.** Khi hết context, lưu checkpoint và resume cùng plan. Không hứa chạy nền nếu không có execution thật.

## 1. Tiếp nhận đúng checkout và snapshot

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch chuẩn bị: `codex/unified-project-flow`.
HEAD intake: `a62d838791ba188838c4ff00b7b6e265ac775056`.

Đọc root/component AGENTS, CLAUDE và rules applicable trước khi sửa. Latest PO owner amendment trong prompt/task này supersede các câu lịch sử giữ execution ở ZCode hoặc chỉ cho architecture. Các safety và business rules khác vẫn giữ nguyên. Shell luôn dùng RTK; Semble-first khi khám phá; Context7/current official documentation cho version-specific API/library usage. Không tạo thêm agent writer mặc định.

Đọc toàn bộ:

- `docs/implementation/tasks/MC-P0-CLAUDE-TAKEOVER.md`.
- `docs/reviews/p0-zcode-quota-takeover-intake-20261027.md` và `docs/testing/p0-claude-takeover-20261027/{source-inventory.json,checks.json,build-check.json}` nếu đã có; đây là current intake, không phải production acceptance.
- `docs/implementation/p0-zcode-end-to-end-execution-plan.md` — full backlog/sequence.
- `docs/implementation/handoffs/MC-P0-ZCODE-COMPLETE-PLAN-PROMPT.md` — giữ full BE+FE scope/DoD; các câu owner/design/contract cũ được delta trong prompt này cập nhật.
- `docs/implementation/p0-zcode-execution/workboard.json`, `local-contract.md`, `w1-implementation-notes.md`, `local-identity-approval.json` và baseline evidence. Không đánh đồng narrative cũ với trạng thái thực.
- Approved `docs/requirements/` (SRS/rules/state semantics/permission matrix/AC/GW), `docs/product/project-atlas-dataset.md`, `docs/testing/p0-zcode-plan-20261026/coverage.json` và source-import manifest.

Chứng minh actual root/branch/HEAD và working-source identity trước khi tiếp tục. Source apps đang uncommitted nên HEAD không chứa trọn phần đã làm. Intake `source-inventory.json` pin mọi source/config/docs đã chọn dưới apps; kiểm tra các files liên quan trước khi sửa. Nếu thay đổi là tiến độ hợp lệ sau intake, reconcile actual authorship/checkpoint, không reset hoặc bắt quay về import baseline. Drift không giải thích được cần cô lập đúng files.

Trong checkpoint đầu tiên ghi actual Claude tool/version/model, ownership acknowledgement và source hashes. Cập nhật **chính workboard hiện có**: append owner-transfer/session entry, reconcile stale top-level/W1/coverage fields, không xóa ZCode log/evidence hoặc đổi historical authorship thành Claude. Không rename toàn bộ thư mục/tài liệu vì tên chứa ZCode. Chưa có acknowledgement thì handoff chỉ READY_NOT_DISPATCHED; đừng tự báo đã có implementation trước khi làm.

## 2. Phần đã có — giữ và mở rộng, không viết lại từ đầu

Codex đã kiểm tra current source khi chuẩn bị:

- **8 baseline files backend đã sửa**, **7 files Go mới**. Ba symlinks `.claude/skills/{add-use-case,add-migration,steward}` trông như added so với working baseline nhưng khớp import gốc: không tính là feature mới của ZCode.
- `internal/core/port/{identity.go,workspace.go}` và additive errors; `domain/matter/workspace.go`/receipt extensions; `policy/workspace.go`.
- `internal/core/service/workspace_service.go`: 10 use cases CreateWorkspace, GetWorkspace, ListAccessibleMatters, CreateMatter, grant/revoke Workspace/Matter membership, HistoryRead, OwnReceipt; authorization/CAS/audit/receipt spine đã được viết.
- Memory store `repotest/mattercontrol/memory_w1.go` và state/snapshot extensions.
- PostgreSQL mới có `GetWorkspaceByID` query/generated accessor và snapshot method; **chưa có full W1 WorkspaceStore adapter**.
- `workspace_service_w1_test.go`: **8 regression tests** cho revoked-role mismatch, same-role reactivation, CreateMatter missing/stale/matching CAS, replay/hash conflict và fresh-write revision conflict.
- W1-A01/A02 source fixes đã có; contract **revision 4** giải thích receipt/CAS/lost-response per operation. Không làm lại như findings chưa được xử lý.
- Codex chạy lại core/service/domain/policy/memory race suite: **137 test/subtest pass, 0 fail, 0 skip**, exit 0. Đây chỉ là scoped memory/core evidence; không phải PG/API/auth/FE acceptance. Đọc actual receipts để dùng đúng kết quả build/format và scope.
- `go build ./...` cũng exit 0. `gofmt -l` còn báo bốn files: `memory_w1.go`, domain `workspace.go`, port `workspace.go`, `workspace_service_w1_test.go`. Sửa formatting bằng tooling khi tiếp quản; chưa có full `make check`/lint/PG PASS tại intake này.
- Frontend **323/323 imported entries còn byte-identical**, chưa có product feature/BFF implementation. Existing tasks demo là template, không phải MatterControl P0.
- Chưa có `productapi`, `outbound/identity/zitadel`, `cmd/mcapi`, full PG `workspace_store.go`, hoặc final-return. Workboard ghi W2–W7 NOT_STARTED, `current_source_checkpoint=null`, một số top-level statuses cũ hơn source.

Tiếp tục từ đây. Không coi compile xanh hoặc 137 tests là W1 hoàn thành. Baseline manifest có 462 hash entries nhưng owner narrative ghi 464 files: dùng actual entries/content hashes và import symlink evidence; đây là census erratum, không phải lý do bỏ hoặc tái tạo source.

## 3. Hoàn thành W1 còn thiếu rồi đi hết W2–W7

Làm theo dependency; tự test/sửa và tiếp tục, không tạo vòng review sau từng checkpoint:

1. **W1 complete:** bổ sung shared memory/PG contract tests cho admin, current membership/revocation, last-owner, scoped Matter list/paging/count, history, own-receipt, replay/concurrency/unknown outcomes. Implement remaining PG/sqlc queries và transaction/snapshot interfaces; regenerate bằng tooling, không hand-edit generated code. Implement real ZITADEL verifier + lookup-only identity mapping; product HTTP DTO/decode/fingerprint/problems/ETag/CAS; separate product composition và `cmd/mcapi`; complete Next.js BFF session/token store, real login/logout/expiry, Workspace/Matter navigation/admin, Requirement create/read/history và negative/recovery states.
2. **W2 daily operations:** typed Requirements/Actions/workstreams/ownership/due/parties, allowed transitions/waits, AND gates/cycle/cross-Matter rejection/reblock, explicit milestone sets, five axes và deterministic Next/My Actions/Waiting On. Complete actual Grid/create/edit/detail/assignment/filter/sort/paging/selection/density/keyboard/mobile and causal navigation.
3. **W3 documents/proof:** local stored bytes and scoped reads, exact versions, OWNER promotion/signature observations, criteria/applicability, claims/independent assessment, dispute/expiry/reversal and derived impacts. Complete FE upload/version/proof/review/recovery, not mock acceptance.
4. **W4 Filing:** full approved nine-stage flow, exact submitted versions/observations, distinct repeated supplement-response cycles/binding, no-supplement and negative paths, correction/reopen/proof epochs, linked context and FE package/timeline/wait flows. Receipt≠approval; upload≠authorized stage command.
5. **W5 Control Room/context:** authorized consistent snapshot/as-of, blockers→Next Actions with adjacent Decisions→Waiting On→Milestones→Gaps→Changes; basic Decision/Finding/Risk/entity context; connected drill-down and mobile triage; no unavailable→zero/READY fallback.
6. **W6 data/brief:** four-field bulk preview/per-row atomic change+audit/results/unknown reconciliation; CSV/XLSX mapping/group validation/idempotency/partial recovery; meaningful scoped formula-safe XLSX export; draft recorded-time changes `(t1,t2]` separate from outstanding at t2. Complete the FE flows too.
7. **W7 stabilize:** all three full Golden Workflows, permission/concurrency/security/regression/restart/isolated full restore and applicable workload/UX tests. Repair failures until source and all executable author checks meet scope; retain genuine external verification blockers explicitly.

A completed capability needs BE behavior + API + actual FE interaction + persistence/history/readback + relevant negative/recovery tests. Do not stop after backend and leave FE mocked, or after FE and leave endpoints TODO. P0 is all **20 FR / 63 AC / 14 NFR / 3 GW**, not template Task CRUD. All full-plan business semantics and local boundaries remain in force.

## 4. Contract và design mới nhất: không consume draft như approval

Current local contract tại intake là revision 4, SHA-256 `b418471bc137839b906397a406d572001b7992076ac64c52e3618fd7d1e268a3`. Đây là living client/server contract; ghi exact revision/hash thực dùng, chỉ tăng revision khi thay đổi có lý do và cập nhật cả consumers/tests. Routine implementation choices không cần lặp PO approval; material business/privacy/retry/cost/release policy phải trình owner đúng phạm vi.

Design R7 đã có full source/spec review, **CHANGES_REQUIRED**:
`docs/reviews/p0-design-r7-full-review-20261027.md`, SHA-256 `c271018278efa75a6dfd26655045d71b9b632e1dc4b5c69f1388e399f20e1d2f`.

Áp dụng findings khi implement:

- Không thêm aggregate Verification `EXPIRED` hoặc Dependency `CIRCULAR_CONFLICT`; theo approved enums, expiry/cycle là reason/rejection.
- Exact typed subject/proof/edges: RQ-11 có DEP-07→AC-12; RQ-07 READY không mượn BLOCKED của AC-07. Historical/current-policy caveats riêng, không silently rewrite Atlas.
- Theo current contract: absent CAS 428, stale CAS 412, actual domain conflicts riêng. Non-receipted commands khác creation receipts; current state/412 không tự chứng minh prior write. `OUTCOME_UNKNOWN` không blind resend; revocation có thể làm mất quyền readback.
- Persona không cấp quyền. VIEWER có scoped read/history/export; EDITOR bulk/import/ordinary edges; OWNER-specific operations và independent verifier guards theo matrix.
- R7 có sáu screens chỉ SPECIFIED_ONLY: vẫn phải implement product flows theo approved requirements/full plan, dùng actual primitives; đừng bỏ P0 vì mockup chưa đủ.

**R8 đang có thư mục và checkpoint IN_PROGRESS do phiên design khác sở hữu; tại intake chưa có return.md.** Không consume `.build/` hay draft copied files như completed baseline, không sửa output/checkpoint của design session. Bạn là Claude implementation owner, không phải chính phiên Claude đang làm design; không đồng nhất hai phiên chỉ vì cùng product/model. Khi có actual completed return, xác minh pins và integrate delta vào cùng plan; không chờ vô hạn hoặc restart.

Giữ Enterprise Precision A/selective causal hierarchy/Comfortable+Compact, multiline EN/VI legal text và Lucide direction; Atomic primitives domain-free, business code `src/features/*`. Dùng applicable installed UI skills cho actual product UI. Không copy prototype's fixture actor/evaluator/hard-coded state làm enforcement, không giảm chức năng thật để khớp prototype.

## 5. Identity, tài nguyên local và bí mật trong phạm vi tiếp quản

PO đã chọn **ZITADEL self-hosted local**, không hỏi lại provider và không chuyển Keycloak/anonymous/shared-token fallback. Existing task-owned profile nằm `ops/p0-local/`; owner report nói đã provision, nhưng intake này không probe health/credentials.

- Đọc public README/config/scripts trước; đọc redacted provisioning receipt để xác minh exact task-owned identity trước khi dùng/lifecycle. Không chạy lại prepare/provision chỉ vì prompt lịch sử ghi NOT_PROVISIONED.
- Việc tiếp quản cùng assignment bao gồm sử dụng **chỉ cấu hình riêng của chính synthetic local profile** khi cần chạy integration: `ops/p0-local/runtime/provisioning.json`, API key file `runtime/mc-api-app-key.json`, synthetic test-user credentials `secrets/test-users.json`, và private profile `.env` qua code/Compose cần thiết. Không cat/print/export các secret; dùng in-memory/private file inputs, giữ permissions, không đưa raw values vào prompts/logs/screenshots/source/manifests. Không đọc bootstrap PAT, master/admin/system keys hoặc unrelated secrets chỉ vì chúng cùng folder; nếu thật sự cần thay đổi admin/provisioning ngoài task, báo đúng dependency.
- No production/INT-A/other-agent credentials. No credential reset/account/provider change. Private credential content không phải source payload để gửi reviewer/provider.
- Auth Code+PKCE/state/nonce; token giữ server-side BFF, cookie chỉ opaque handle; Go exact active/issuer/audience/expiry/subject và `(iss,sub)` mapping. Current Workspace AND explicit Matter AND operation rights ở backend, không IdP-role shortcut.
- Real machine-token introspection probe là machine-only, không phải human login; không seed API subject thành human để tạo acceptance. Browser human login giữ blocked nếu không có permitted browser.
- DB fixtures native `TEST_DATABASE_URL` và product `MC_TEST_DATABASE_URL` phải mới/riêng/được verify; native tests có truncate/drop. Reuse owned product/IdP resources chỉ sau identity check. Không dùng nhầm legacy migration vào product DB, không sửa/xóa DB hoặc volume có sẵn, broad prune/down-with-volumes, hay signal process không xác minh ownership.
- Được làm fresh uniquely named loopback-only synthetic fixtures và isolated restore theo full-plan authorization qua permitted tools; giữ resource ledger và data/volumes. Codex vẫn điều phối lifecycle/evidence khi cần; không suy quyền với tài nguyên INT-A từ task này.

## 6. Rules, checks và recovery của assignment

Owner paths: `apps/backend/`, `apps/frontend/`, task-owned `ops/p0-local/`, `docs/implementation/p0-zcode-execution/`. Read matching component rules/skills trước edit. Preserve native user API, separate product composition/migrations, Go inward architecture/sqlc, existing Next.js/Atomic/features/security conventions. New dependencies chỉ khi thực sự cần và có justification/compatibility/tests, không framework rewrite.

Backend: TDD cho behavior mới, existing service/store spine, `make check` và race/JSON events với đúng hai PG fixtures; distinguish test skips/no-test packages. Frontend: applicable tests, `pnpm check`, `pnpm build`, stories/build-storybook/E2E theo rules; product REST/fail-closed session, không template demo acceptance. Update actual callers/config/docs/tests khi contract behavior đổi.

Lỗi tự sửa được thì sửa, chạy lại affected checks rồi tiếp tục. Không tự giảm scope/disable lint/security/a11y để xanh. Run final combined suites khi candidate ổn định; không chạy lặp toàn bộ vô ích sau mọi edit.

Browser Work trước đó disabled: recheck permitted capability trước browser-dependent verification; không bypass bằng CLI browser/alternate renderer/native capture/server/proxy hoặc tự đổi Work settings. Vẫn implement source và chạy nonbrowser checks. Browser/keyboard/touch/zoom/screen-reader/visual results chỉ PASS khi thực thi thật. AC-137 cần real five-manager protocol; không giả participants hoặc timing. Local restore/load results không chứng minh production SLA/$0/Cloudflare.

Không stage/commit/push/merge/deploy/paid service; không retry Mimosa scan/commit, sửa hooks/exclusions/security evidence hoặc đổi host/context/tool để vượt refusal. Quota takeover không mở gate này. Không sửa `tools/inta-harness`, formal 51-row ledger, immutable returns/manifests, external BE01 staged patch hoặc MC-003A worktree. Nếu một action thực sự bị refuse thì dừng đúng action đó, lưu error/impact và tiếp tục phần permitted độc lập.

## 7. Một workboard, một final return, review độc lập sau cùng

Maintain existing workboard's 20 FR / 63 AC / 14 NFR / 3 GW mappings: source/API/UI, actual test command/result, evidence, source revision, unresolved code vs blocked execution vs review. Append Claude authorship và inherited ZCode checks rõ ràng. Không biến owner report hoặc test name thành execution proof.

Final output vẫn là `docs/implementation/p0-zcode-execution/final-return.md`, cùng exact final working-source/diff manifest, redacted evidence và local start/login/seed/run/test/stop/restore instructions. Include:

- Actual Claude identity/tool/model; branch/HEAD; starting snapshot; retained ZCode source và Claude delta; contract/design revisions thực dùng.
- Complete BE/API/FE inventory cho 20 FR; per-AC/NFR expected/actual/pass/fail/skip/blocked; toàn bộ three-GW ledgers và negative/alternative paths.
- Commands/cwd/UTC/exits/log hashes, PG fixture scope, auth evidence kind, frontend/integration/recovery/load/visual evidence hoặc exact blockers.
- Owned-resource disposition, remaining defects/budgets/human-study/browser/security/production gates; không lộ secrets.

Chỉ dùng `FULL_P0_BE_FE_IMPLEMENTED_SELF_TESTED_PENDING_REVIEW` khi code của cả BE/API/FE đầy đủ, applicable author checks pass và không còn known critical/high implementation defect. Code còn thiếu → `IN_PROGRESS`/`PARTIAL_IMPLEMENTATION`. Code đủ nhưng mandatory execution bị chặn → `IMPLEMENTED_WITH_VERIFICATION_BLOCKERS`, exact rows.

Claude không tự review độc lập hoặc approve architecture/source của chính mình. Codex/nonauthor reviewer sẽ review final candidate; quota OpenCode hoặc formal acceptance chưa có không phải lý do dừng implementation độc lập. Không self-award DONE/ACCEPTED/production-ready, MC-002 closure hay Step03B/release approval.

**Bắt đầu từ source hiện tại, hoàn thiện W1 PG/API/auth/BFF/FE rồi đi hết W2–W7, tự test/sửa và trả một candidate BE+FE tổng hợp. Không trả chỉ acknowledgement/plan hoặc một phần nhỏ.**
