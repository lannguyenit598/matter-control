# MATTERCONTROL — CLAUDE CODE TIẾP QUẢN VÀ HOÀN THIỆN TOÀN BỘ P0

## 1. Nhiệm vụ và quyền thực hiện

Tôi là Product Owner. Tôi giao **actual Claude Code** tiếp quản implementation **cả backend/API và product frontend** từ ZCode, tiếp tục parent `MC-P0-ZCODE-EXECUTION` với continuation `MC-P0-CLAUDE-FINISH-AFTER-ZCODE-20261028`, priority P0.

Đây là yêu cầu implementation dài: sửa toàn bộ findings còn áp dụng, hoàn thiện chức năng/verification P0 còn thiếu và trả **một candidate BE+API+FE tổng hợp** để review. Không restart W0/W1–W5, không chỉ trả plan, không dừng sau design intake/auth config/một finding hoặc mỗi wave để xin “tiếp tục”. Giữ toàn bộ tiến độ và authorship Claude/ZCode/Codex trước đó.

Chỉ một product writer tại một thời điểm. Trước khi sửa, xác nhận ZCode đã kết thúc hoặc có stopped/handoff acknowledgement từ PO/owner. Không suy diễn process không chạy nghĩa là assignment đã dừng. Nếu ZCode vẫn đang sửa hoặc chưa rõ, chỉ intake/read-only và báo cần dừng writer cũ; không tạo worker/source branch thứ hai để né xung đột. Khi handoff đã rõ, không hỏi lại quyền takeover đã được PO giao ở đây.

Instruction này supersede các owner labels cũ giới hạn Claude chỉ ở Solution Architecture hoặc giữ ZCode/Antigravity là sole implementation owner, **riêng continuation P0 này**. Quyền quyết định material product policy/cost/release vẫn thuộc PO; independent reviewer không được là tác giả của phần code mình duyệt.

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch dự kiến: `codex/unified-project-flow`.
Reference HEAD: `a62d838791ba188838c4ff00b7b6e265ac775056`.
Source đang uncommitted; actual files và checkpoint mới nhất là điểm resume, không phải HEAD đơn lẻ.

Owned sau handoff: `apps/backend/`, `apps/frontend/`, task-owned dev/test profile `ops/p0-local/`, existing `docs/implementation/p0-zcode-execution/`; task-scoped test/evidence mới và cập nhật task owner/status đúng phạm vi. Không thay đổi reviewer reports/design exports/approved requirements hoặc immutable receipts. Không ghi đè private runtime config hay evidence của session khác. Không reset/stash/clean/switch checkout, stage/commit/scan retry/merge/push/deploy; giữ nguyên unresolved Mimosa gate.

## 2. Intake ngắn, rồi triển khai từ source mới nhất

Đọc AGENTS/rules/component instructions, `/Users/nguyenvanlan/.codex/RTK.md`; dùng `rtk` cho shell, Semble-first khi khám phá code, Context7 resolve→query cho API/library/cloud documentation. Dùng skills phù hợp với việc thực tế, không cài tool/provider hoặc đổi account/model để vượt permission. Không spawn thêm writer nếu chưa được giao.

Đọc toàn bộ:

1. `docs/ai-sdlc/current-workflow.md`, `docs/ai-sdlc/project-status.md`; nhận diện historical owner/gate labels so với direct PO authority mới này.
2. `docs/reviews/p0-zcode-progress-check-20261028.md` — **review mới nhất bắt buộc xử lý**.
3. `docs/implementation/p0-zcode-execution/{workboard.json,local-contract.md,final-return.md}` và actual return/checkpoint mới hơn nếu có. Current observed contract rev 10; không ép source về rev 9 hoặc snapshot Claude cũ.
4. `docs/implementation/p0-zcode-end-to-end-execution-plan.md` và `docs/implementation/handoffs/MC-P0-ZCODE-POSTRUN-FOLLOWUP-PROMPT.md`: giữ complete P0/DoD/safety, thay execution owner/resume point bằng prompt này. Không giao lại ZCode khi bạn đã tiếp quản.
5. `docs/testing/p0-parallel-20261027/qa/{return.md,inputs.json}`, `idp/{return.md,inputs.json}`, `acceptance-restore/{return.md,acceptance-matrix.json,golden-workflow-checklist.md,restore-plan.md}`.
6. `docs/implementation/p0-cloud-free-20261027/` public input/discovery files; không mở private key chỉ để intake hoặc tạo packet.
7. `docs/implementation/handoffs/MC-P0-CLAUDE-CONSUME-DESIGN-R9-ADDENDUM.md`, `docs/reviews/p0-design-r9-final-intake-20261027.md`, final `docs/design/p0-handoff-r9/` spec/matrix/handoff. Consume R9, không restart design. Prototype/mock không thay thế server enforcement.
8. Approved canonical PRD/SRS/business rules/state/permission/AC/NFR/GW sources trỏ từ plan/matrix. Giữ **20 FR, 63 AC, 14 NFR, 3 original GWs** và IDs.

Review report pin khi chuẩn bị: `docs/reviews/p0-zcode-progress-check-20261028.md`, 11,092 bytes, SHA256 `f5881148ff9d8e16390c9c0ea483d7389a151e710199b045fd1dbf174efbf45a`. R9 return SHA256 `d4dc769f1958f486a17a9a90fa5b1060de3172a2b07b544c6f1adff788b14b3d`. Verify immutable input integrity; mutable workboard/contract/source có thể tiến hợp lệ, ghi current hashes và reconcile delta thay vì reset hoặc dừng vì hash cũ khác.

Record actual identity/tool/model, UTC, root/branch/HEAD, handoff basis, fresh public-source manifest và owner transition trong **same workboard**. Không xuất secret hoặc hash private credential. Lập disposition ngắn cho từng item dưới đây: already fixed / needs implementation / needs tests / external blocker. Đối chiếu code trước sửa; báo cáo mới này là static inspection, không phải mọi lỗi vẫn còn sau source update của owner.

## 3. Đóng các thiếu sót W6 trước khi nhận code-complete

### A. Import: tạo graph đúng từ các dòng mới và atomicity của connected group

Observed `dataops_service.go:409` (`parseSheet`) chỉ chấp nhận dependencies đã có trong graph, nên Requirement/Action mới tham chiếu row key cùng file bị reject. `ImportCommit` gọi transaction riêng từng row; không phải group transaction như return mô tả.

Sửa đầy đủ preview→row-key mapping→validation→group commit→persisted edge→retry/readback. Tham chiếu dòng mới phải resolve thành actual persisted item IDs; validate type, duplicate keys, references, cycles, owner/date/scope trước mutation. Invalid connected group bị reject cả nhóm, nhóm độc lập hợp lệ có thể thành công. Recheck rights/inputs ở mutation boundary. Dùng existing transaction/store abstraction, không rewrite framework.

RULE-014 dedupe phải đúng cả trong retry/concurrency: same source identity + row key + content không tạo duplicate record/link/audit; changed content là explicit conflict. Nếu transaction của connected group gặp storage error giữa chừng, không để lại partial invalid graph; UNKNOWN cần receipt/reconciliation đúng commit boundary, không tự retry mutation với new keys. Giữ imported VERIFIED là reviewable claim, không authoritative VERIFIED, và giữ original claim/provenance thực.

Tests bắt buộc: valid new-row dependency graph + readback exact edges; invalid reference/cycle rejects whole group; independent group succeeds; injected mid-group failure rollback; same-key lost-response recovery; same-source replay/conflict; concurrent duplicate import; revoked access between preview/commit. Run against memory **và PostgreSQL**, qua HTTP producer/consumer khi phù hợp.

### B. Status Brief: đúng facts tại t2

Observed `Brief` replay allowlist bỏ qua `work.execution_changed` và `import.*.created`. Không đủ thêm hai string nếu proof/dependency/expiry/history vẫn sai.

Hoàn thiện reconstruction/projection để changes trong **(t1,t2]** tách khỏi outstanding tại **t2**, theo recorded-time semantics, effective/late-recorded attribution và approved policy. Bao gồm creations/imports, metadata/execution, reopen/epoch, proof assessment/revocation/dispute/expiry và downstream dependency facts liên quan. Missing/corrupt authoritative replay data phải báo không thể dựng đúng, không im lặng bỏ qua rồi trả success.

Giữ deterministic ordering/provenance/authorized scope và no-change explicit. Không giới hạn t2=current để né historical reconstruction; đó chưa được PO duyệt. Tests ít nhất gồm completion/cancellation/reopen, import presence, proof/dispute/expiry ảnh hưởng readiness, boundary events đúng t1/t2, t1=t2, invalid future/reversed window, inaccessible content và consistency. Sửa cả API/FE/export nếu wire thay đổi.

### C. Test các lớp mới, không chỉ chạy suite cũ

W6 hiện có memory service tests; targeted inspection chưa thấy W6 PostgreSQL behavior/API/FE tests. 361 tests cũ xanh không chứng minh W6 UI/API đúng.

Bổ sung meaningful shared PG parity/integration tests cho transaction/registry/receipt/temporal reads; HTTP tests cho validation/auth/error/UNKNOWN/download; FE tests qua action→repository→client và UI cho preview/commit, per-row SUCCESS/REPLAYED/FAILURE/UNKNOWN, frozen retry intent, stale preview, inaccessible scope, empty/error/brief results. Không viết test chỉ sao chép implementation; mỗi test chứng minh observable requirement hoặc failure mode.

## 4. Hoàn tất parallel QA F01..F05 và giữ fixes cũ

Đọc full `qa/return.md`. Các ID này khác original CW1-F01..03; giữ old UNKNOWN/returnTo fixes và tests.

- **F01 dispute precedence:** source correction đã thấy; verify current same-epoch unresolved dispute vẫn DISPUTED sau withdraw/revoke, không satisfying; authorized resolution recompute; historical/irrelevant epochs không block vô hạn. Thêm regressions thực nếu chưa có.
- **F02 stale assessments:** `ExpectedAssessmentID` mới thấy ở port/service, observed HTTP/FE chưa truyền. Hoàn tất read DTO/schema/form intent/action/repository/HTTP/service atomic check/contract/PG parity; phân biệt explicit first-assessment expectation với thiếu input. Hai reviewer cùng đọc: một cập nhật, người còn lại bị stale/no mutation/event; fresh explicit reversal hợp lệ. Epoch-only không đủ; UNKNOWN không auto-resend.
- **F03 filing guards:** có domain fields/guards mới nhưng chưa chứng minh đủ wiring. Hoàn tất OWNER applicability + reason/audit, store/schema/DTO/API/UI và stage checks, giữ outcome-proof flag riêng với package/signature applicability. Editor `proofRequired=false` không được waive package hoặc chữ ký. Test no-signature không đồng nghĩa bỏ package; mandatory criteria/version/signature vẫn đúng với actual policy. Không làm hỏng W4 cycles/reopen.
- **F04 Control Room snapshot:** page hiện trộn room với work/parties/members/context từ các reads khác. Dùng facts/labels cùng advertised boundary hoặc detect/withhold/label stale đúng semantics; edit panel riêng có currentness rõ. Test actual orchestration khi revisions lệch, không chỉ mock component snapshot.
- **F05 causal explanation:** render returned gate/reasons, kể cả upstream COMPLETED nhưng UPSTREAM_BLOCKED và proof gate chưa thỏa. Không thêm client business evaluator; người dùng phải hiểu nguyên nhân và đi đến đúng record trong context.

Nếu phát hiện material semantic trade-off thật, soạn concrete proposal + impact cho PO, giữ affected decision pending, tiếp tục độc lập. Không hỏi lại các policy đã approved hoặc đổi requirements để test xanh.

## 5. W7: full workflow/recovery evidence, không nhận assertions hời hợt

`gw_ledger_test.go` GW03 hiện tạo generic Action và có assertion `stageEvents >= 0` luôn đúng. Thay bằng actual original workflow checkpoint assertions; không sửa tên expectation thành một workflow nhẹ hơn.

Chạy original GW-01/02/03 theo checklist, gồm roles độc lập, Requirement≠Action, completion≠verification, AND dependencies, waiting details, exact document versions, signatures, filing stages/multiple cycles/receipt≠approval/negative/reopen/outcome evidence, history/provenance/permissions và readback. Existing W4 unit tests có giá trị nhưng không tự là full GW03 E2E. Phân biệt service/PG/HTTP/browser evidence; thiếu browser giữ exact E2E rows pending.

Restore đã làm là mẫu nhỏ (2 users/1 ws/1 Matter/1 Requirement/1 event/1 receipt + copied object probe). Dùng `restore-plan.md` để mở rộng trên **fresh isolated synthetic targets**: complete representative DB/document objects/versions/memberships/relations/import sources/history/receipts; consistent source boundary, corrupted/missing-object refusal, restart/readback and measured duration/data loss. Không dump private unrelated data, không restore đè run DB, không xóa existing volumes. Cloud IdP recovery là phạm vi khác, không được claim từ product DB restore. Local test targets không là production RPO/RTO commitments.

Đối chiếu toàn bộ NFR với approved exact expectations: thực hiện checks local khả thi (security/privacy/size/load/time/error/audit/export) bằng workload đã duyệt và ghi số đo; những chỉ tiêu production/budget/retention cần quyết định vẫn pending. Không blanket-label mọi NFR là browser-blocked.

## 6. ZITADEL Cloud đã có inputs — tích hợp vào local product

Consume public bundle `docs/implementation/p0-cloud-free-20261027/`. Không tiếp tục coi lỗi redirect của **local IdP cũ** là bằng chứng Cloud app sai cấu hình.

```text
Plan: Free; region Australia (PO-reported)
Issuer: https://matter-control-legal-dev-fm2k48.au1.zitadel.cloud
Organization ID: 396978885222316422
Project ID: 396983669648046470
Web Client ID: 396983754624613928
APP_ORIGIN: http://localhost:3000
Redirect URI: http://localhost:3000/api/auth/callback
Dev Mode / refresh: enabled (PO-reported)
API Client ID: 396983864414715432
Introspection: https://matter-control-legal-dev-fm2k48.au1.zitadel.cloud/oauth/v2/introspect
API key file: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control/keys/396983916088540712.json
Synthetic A subject: 396984919567415686
Synthetic B subject: 396984802881878406
```

Use existing auth/BFF/verifier; preserve server-side access/refresh tokens, PKCE S256/state/nonce, opaque HttpOnly/SameSite session, strict issuer/active/audience/expiry/subject checks và application Matter authorization. Request project audience; Project ID là candidate audience cần real human-token verification, không lấy API client ID làm audience mặc định.

Chỉ consume supplied application key qua intended private runtime input cho dev/test profile; privately validate `clientId` match API Client ID. Không print/hash/export/copy key contents, tokens/cookies/assertions/passwords vào prompts/logs/Git/evidence. Check existing exact ignore/0600/symlink ownership before use; private unrelated/admin credentials không thuộc scope. Không tạo/đổi Cloud resources, reset user/key, đổi billing/plan/region, paid service hoặc production.

Explicitly map Cloud `(issuer,sub)` A/B bằng authorized synthetic fixtures; không email auto-link, implicit grants, rewrite historical actors hoặc clear old users. Giữ local IdP/data và old runtime config; chỉ sửa task-owned profile cần thiết, ghi exact target/rollback. Không tạo auth framework mới.

Check real permitted human login → BFF session → Go token verification → scoped API/PG, A/B isolation/revocation, refresh/logout/expiry/unknown identity/unavailable và UNKNOWN recovery. Discovery hoặc machine introspection không chứng minh human login.

Kiểm tra browser capability/permission hiện tại, không mặc định historical unavailable vẫn đúng. Nếu được phép, thực thi browser UI/E2E/keyboard/focus/touch/zoom/visual/a11y trên synthetic profile; nếu không, không bypass bằng headless/CLI/Session API/password grant. Hoàn thiện code/config/tests và exact manual run/login steps; chỉ rows cần browser giữ VERIFICATION_BLOCKED. AC-137 cần 5 real managers, không được simulate.

## 7. Hoàn thiện UX và source theo Design R9

Áp dụng R9 spec/tokens/layout/interactions vào product components thực; giữ draft intent đúng identity/scope, purge state thật khi mất access, không hồi sinh sau re-grant, promotion target khác expected-current guard, causal Back giữ context và My Actions tách đúng sections. Không copy prototype simulation thành actual enforcement.

Dùng inventory/components có sẵn và relevant UX/accessibility skills; không redesign sản phẩm hoặc thêm icon/motion dependencies tùy ý. Geometry/keyboard/rendered results cần tool evidence thật. Error mapping theo từng operation: 401/403/404, missing/stale precondition, domain rejection, unavailable và lost mutation outcome phải phân biệt. Không force mọi 409 thành CAS hoặc xóa domain 409 để làm old design checker xanh.

## 8. Final gate, bàn giao một lần

Sau targeted red→green regressions và source ổn định, run backend required `make check` (sqlc/format/tidy/lint/race với **native và product PG fixtures tách biệt**), FE `pnpm check` + `pnpm build`, applicable auth/integration/workflow/load/restore checks. Reconcile commands với current component config; không chạy destructive native tests lên run DB. Verify resource identities trước lifecycle, chỉ dừng process/container đã tạo/được giao có ownership evidence; giữ data/volumes cần handoff. Không lặp suite chỉ để tăng số lần PASS.

Green log phải gắn current source hash và command/cwd/tool/version/UTC/exit/raw redacted output; logs cũ còn demo routes hoặc trước partial QA edits không chứng minh new candidate. Không claim zero skips khi chưa parse test events. Preserve failed attempts/flakes và không mask timeout.

Update **same** workboard/contract/final-return: actual owner/history, revision/hash pointers, fresh source checkpoint, current FR/AC/NFR/GW evidence mapping, findings disposition, exact remaining blockers, resources và runbook. Giữ lịch sử, nhưng top-level current fields không được vẫn ghi Claude starting checkpoint/FR NOT_STARTED khi code đã có. Không promote case chỉ vì có function hoặc test cũ xanh.

Final return phải có:

1. Actual identity/root/branch/base/current source hashes và preserved authorship.
2. BE/API/FE implemented inventory; per-finding fix/already-fixed/unresolved + regression evidence.
3. **20 FR / 63 AC / 14 NFR / 3 original GWs** coverage: code vs author test vs independent review vs external blockers, không gộp thành phần trăm giả.
4. Cloud config/identity mapping/login status và privacy-safe evidence; exact user/operator action nếu còn blocked.
5. Current check/build/integration/restore results, failures/skips/flakes; hashes + raw evidence manifest không tự tham chiếu.
6. Reproducible local start/login/test/owned stop/isolated restore; resource disposition; remaining risks.

Nếu còn known code defect/missing functionality: `PARTIAL_IMPLEMENTATION`. Chỉ dùng `IMPLEMENTED_WITH_VERIFICATION_BLOCKERS` khi implementation thực sự đủ nhưng mandatory external execution chưa khả dụng, ghi exact rows. Nếu code đầy đủ và author gates pass: `FULL_P0_BE_FE_IMPLEMENTED_SELF_TESTED_PENDING_REVIEW`. Không tự DONE/ACCEPTED/production-ready, waive quality gates, đóng MC-002/Step03B hoặc deploy.

Nếu context hết, ghi checkpoint source/pending tests/exact next action vào same workboard để resume cùng assignment; checkpoint không phải completed return. **Tiếp tục cho tới khi toàn bộ công việc được phép đã hoàn thành hoặc có blocker thật; không dừng ở một đợt sửa nhỏ.**
