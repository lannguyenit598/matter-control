# MATTERCONTROL — ZCODE FOLLOW-UP SAU RETURN HIỆN TẠI: QA FIXES, CLOUD AUTH VÀ FINAL P0

**Chỉ thực hiện sau khi prompt implementation hiện tại đã kết thúc và bạn đã ghi actual return/checkpoint. Không chạy đồng thời hai prompt/writer trên cùng source.** Tiếp tục chính assignment **MC-P0-ZCODE-EXECUTION**, không restart sản phẩm, W0 hoặc W1–W5. Task follow-up MC-P0-ZCODE-POSTRUN-REMEDIATION-INTEGRATION, priority P0; actual ZCode vẫn sở hữu cả backend/API và frontend. Codex/nonauthor giữ review; PO giữ material policy/cost/release authority.

Mục tiêu: đối chiếu kết quả vừa làm → sửa findings còn đúng → nối Cloud profile đã được PO cung cấp → hoàn tất mọi phần P0 còn thiếu và verification được phép → nộp **một candidate BE+FE tổng hợp** cho review cuối. Không trả thêm planning-only pass hoặc dừng xin “tiếp tục” sau từng finding/wave.

## 1. Resume từ return mới nhất, không từ snapshot cũ

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch `codex/unified-project-flow`.
Reference HEAD khi chuẩn bị `a62d838791ba188838c4ff00b7b6e265ac775056`. Source đang uncommitted; recheck actual HEAD/working snapshot.

Đọc root/component AGENTS/rules/skills, RTK, Semble-first cho khám phá và current docs/Context7 khi dùng API/library/CLI. Không tự đổi account/model/provider, spawn writer mới, switch/reset/stash/clean checkout hoặc ép source về pin cũ.

Đầu tiên đọc **return của chính prompt vừa kết thúc**, workboard/contract/source/evidence mới nhất trong `docs/implementation/p0-zcode-execution/`. Xác định actual W6/W7 completion và hiện còn gì, không mặc định chúng đã xong hoặc vẫn ở W5. Rev 9 và 665-entry snapshot chỉ là historical reference; nếu contract/source của bạn đã tiến hợp lệ, dùng revision/hash mới và giữ progress.

Đọc toàn bộ inputs hiện đã có:

1. Existing full STOP implementation prompt và `docs/implementation/p0-zcode-end-to-end-execution-plan.md` để giữ complete P0/DoD/safety; câu starting-state cũ được actual return mới supersede.
2. `docs/testing/p0-parallel-20261027/qa/{return.md,inputs.json}` — 5 frozen-source findings.
3. `docs/testing/p0-parallel-20261027/idp/{return.md,inputs.json}` — local producer defect và Cloud integration/operator notes, không phải execution approval cho admin APIs.
4. `docs/testing/p0-parallel-20261027/acceptance-restore/{return.md,acceptance-matrix.json,golden-workflow-checklist.md,restore-plan.md}` — 63 AC/14 NFR/3 original GWs, kế hoạch NOT_RUN/PREPARED_NOT_EXECUTED, không phải acceptance đã pass.
5. `docs/implementation/p0-cloud-free-20261027/{README.md,cloud-inputs.json,frontend-public.env.example,backend-public.env.example,discovery-check-curl.json,discovery-public.json}` — actual received Cloud inputs/public discovery evidence.
6. `docs/implementation/handoffs/MC-P0-CLAUDE-CONSUME-DESIGN-R9-ADDENDUM.md` và `docs/reviews/p0-design-r9-final-intake-20261027.md`; current R9 source/spec/matrix/consumer handoff. Legacy Claude filename không đổi execution owner; bạn là consumer mới.
7. Approved requirements/business rules/state semantics/permissions, canonical 63-AC/14-NFR set và original GW-01..03. Không thay IDs/workflows hoặc xóa acceptance rows để phù hợp implementation.

Ghi actual identity/tool/model và new follow-up entry vào **same workboard**. Preserve historical Claude/ZCode/Codex attribution. Một bảng disposition nhỏ: từng finding/Cloud task/remaining feature là already-fixed, needs-fix, verified, execution-blocked hoặc decision-required, kèm actual source/test evidence. Làm bước reconcile ngắn rồi triển khai, không audit lại từ đầu hoặc tạo workboard khác.

## 2. Sửa năm QA findings còn áp dụng, ưu tiên ba P1

Các F01..F05 dưới đây thuộc `qa/return.md`, khác original CW1-F01..03. Đây là STATIC_REVIEWED trên `/private/tmp/mc-p0-parallel-20261027-0da4q45k`; source hiện tại có thể đã sửa. So trigger/callers/current code trước editing, ghi existing fix/test nếu đã xử lý. Không rollback để khớp frozen lines.

1. **F01 / P1 — unresolved dispute bị mất sau withdrawal/revocation.** Current-applicable open dispute phải giữ đúng aggregation precedence đến authorized resolution, dù withdrawn/revoked proof không còn satisfying. Test accepted→disputed→withdraw và →revoke; DISPUTED/open-history/dependency non-satisfaction vẫn đúng; sau resolve recompute từ remaining proof. Không để historical/irrelevant epoch dispute chặn vô hạn.
2. **F02 / P1 — stale assessment overwrites intervening verdict cùng epoch.** Epoch fence không đủ chống stale human review. Bind intent với current assessment/generation (cả explicit first-review generation), kiểm atomically, update service/HTTP/FE/contract. Hai screen cùng-read: A đổi verdict, stale B bị reject/no mutation/event; fresh B có thể explicit reversal theo policy. Nonreceipted lost-response không được auto-resend hay xem 412 là proof previous outcome.
3. **F03 / P1 — editor `proofRequired=false` bypass package/signature applicability.** Outcome-verification flag không là OWNER no-signature applicability decision. Stage guards phải giữ applicable package/signature completeness riêng, no-signature cần authorized reason; giữ supported no-proof axis. Test undeclared/no-proof/editor không submit/no event/revision; explicit valid OWNER applicability path vẫn chạy.
4. **F04 / P2 — Control Room FE trộn nhiều snapshots.** Display facts, causal labels/context phải cùng advertised read boundary, hoặc detect/withhold/label stale mismatch. Current edit panel có boundary riêng rõ ràng. Test different room/work/context revisions và concurrent decision closure qua actual page orchestration, không chỉ handcrafted component fixture.
5. **F05 / P2 — bỏ causal reasons của transitive blockers.** Render existing authorized gate/reason, gồm UPSTREAM_BLOCKED khi upstream vẫn COMPLETED và proof-vs-completion gate. Không thêm client evaluator/endpoint không cần thiết. Test returned cause có business wording bên đúng upstream link.

Đọc full report exact lines/requirements/test gap. Sửa root cause nhỏ nhất đầy đủ producer/consumer/callers/tests/docs. Không nới/skip guards, che failure hoặc đổi approved semantics để giữ old fixtures xanh. Run meaningful regression sau fix; một static report hay author disposition chưa phải independent closure. Nếu có material semantic conflict thật, đưa một concrete scoped decision và tiếp tục việc độc lập, không tự waive.

## 3. Tích hợp ZITADEL Cloud Free vào local dev/test profile

PO đã cung cấp instance/application/user metadata và đường dẫn key; **không còn chặn vì thiếu issuer/client inputs**. Public discovery đã được Codex verify bằng HTTPS với TLS verification bật; effective client registration, key linkage và user-token claims chưa verified. Không tạo Cloud account/instance/app mới, không rerun provision scripts hoặc admin-credential repair route của local IdP.

Thông tin thực:

```text
Plan: Free (PO-reported), region Australia
Issuer: https://matter-control-legal-dev-fm2k48.au1.zitadel.cloud
Organization ID: 396978885222316422
Project ID: 396983669648046470
Web Client ID: 396983754624613928
APP_ORIGIN: http://localhost:3000
Callback: http://localhost:3000/api/auth/callback
Dev Mode / Refresh token: enabled (PO-reported, effective setting not read back)
API Client ID: 396983864414715432
Introspection URL: https://matter-control-legal-dev-fm2k48.au1.zitadel.cloud/oauth/v2/introspect
API key local file: /Users/nguyenvanlan/Documents/code/pet-projects/matter-control/keys/396983916088540712.json
Synthetic A reported subject: 396984919567415686
Synthetic B reported subject: 396984802881878406
```

Hành động trong existing permitted profile:

- Preserve prior private runtime configuration and local IdP/resources. Apply the supplied public overlays only to the correct task-owned dev/test profile; do not overwrite DB/object settings, unrelated processes, old run data or production configuration. Reuse existing config/BFF/verifier, no multi-provider framework/rewrite. Keep local origin/cookie development exception separate from HTTPS Cloud issuer.
- You may consume **only the PO-supplied API application's key** through the intended private runtime input to configure/check this dev/test integration. Validate JSON structure and that its `clientId` matches `396983864414715432`; fail closed if not. Key is metadata-checked 0600, not a symlink, untracked and exact-path Git-ignored. Never print/hash/export key contents, tokens/assertions/cookies/code/passwords or copy them into evidence/Git/provider prompts. No admin PAT/master/system key/private unrelated access.
- Use canonical issuer **without trailing slash**, from discovery. Keep exact callback above, PKCE S256/state/nonce, server-side access/refresh tokens, opaque HttpOnly/SameSite session and Go strict active/issuer/audience/expiry/subject checks. No ID-token-as-API-bearer, anonymous/shared-token or verifier weakening.
- Request project audience using Project ID. Candidate `MC_OIDC_AUDIENCE=396983669648046470` is NOT empirically verified yet. API Client ID authenticates introspection; it is not automatically user-token audience. Validate actual synthetic human session/token through authenticated introspection, record allowlisted booleans/ids/statuses only. Machine introspection or discovery success does not prove human login.
- Cloud `(issuer,sub)` is new. Explicitly verify A/B and seed/map intended product identities with authorized synthetic fixtures; never auto-match email/display name, grant implicit membership, rewrite historical actor ownership or clear existing data. Prefer a fresh task-owned synthetic test dataset if needed for an isolated profile; record exact target/ownership/mapping/rollback before writes. Keep current local users/data available.
- Verify allowed principal/read/write/history, foreign-Matter/Workspace denial, revoked rights, unknown identity, expiry/refresh/logout and unavailable/UNKNOWN cases. An IdP user being created is not a product role grant; authorized product seeding remains explicit and tested.
- No paid upgrade/billing/card/custom domain/region change, production switch, account reset, broad teardown or local IdP delete. The PO-reported Free plan and public pricing do not prove all system usage is $0 or unlimited.

Nếu permitted browser vẫn unavailable, hoàn thiện config/source/tests và prepare exact local start/user-login steps; actual human/browser run giữ NOT_RUN/VERIFICATION_BLOCKED. Không tạo user token bằng Session API/password grant/machine identity để fake human evidence hoặc bypass browser settings. Nếu provider/client/audience thật bị reject, retain sanitized error + exact next action; không rotate key/change issuer/admin settings hoặc guess alternate IDs. Tiếp tục unrelated code/test work.

## 4. Dùng acceptance/restore packet để hoàn thiện P0, không lặp việc đã xong

Reconcile matrix với current return/source: giữ every canonical case và expected behavior; case đã có actual matching source/evidence thì link nó, không rerun vì đổi prompt. Case missing/failing/changed cần execution/fix theo đúng evidence tier. Prepared matrix không phải existing PASS hoặc quyền mới lên resource bất kỳ.

- Hoàn thiện **W6** còn thiếu: four-field bulk + row-atomic audit/results/UNKNOWN recovery; CSV/XLSX connected-group import + source/row/content idempotency; meaningful scoped safe export; draft recorded changes `(t1,t2]` riêng outstanding at t2. CAS không là receipt; t2=current-only chưa được phê duyệt. Don't execute formulas/macros/links, silently merge or import authoritative VERIFIED. Nếu previous run đã làm đúng, giữ và chỉ bổ sung gaps/tests.
- Hoàn thiện **W7/residual W1–W5**: actual original GW-01..03/AC-161..163 ledgers, current rights/negative/reopen/epoch/UNKNOWN paths, actual Grid/Control Room/history/delta/export readbacks. Template remnants/API docs/config phải đối chiếu current callers trước remove/update; no broad cleanup rewrite.
- Theo existing authorized local full-plan scope, use uniquely named fresh isolated synthetic fixtures for native/product PG tests and complete product restore; verify exact source/target/ownership/schema trước commands. Never native destructive suite against product run DB; never restore over existing run data or delete unrelated volumes. `restore-plan.md` is preparation, not evidence it ran.
- Full restore must account for DB + document objects + memberships/relations/history/receipts/provenance, consistent boundary, corrupted/missing-object behavior, post-restore readback/restart and measured timing/loss. Cloud IdP recovery is separate; restoring product DB does not prove ZITADEL backup/recovery. Do not simulate production RPO/RTO/capacity commitments.
- Run actual permitted full backend gates (correct separate PG fixtures, sqlc/lint/race), FE check/build and applicable integration/security/regression/load/restore checks; repair failures. Focused checks after fixes, final combined gate when stable, no meaningless repeated full-suite runs.
- Browser/keyboard/touch/zoom/focus/screen-reader/visual cases require actual permitted UI execution; AC-137 requires five real managers. No source/jsdom/mock study or generated screenshots stand in for those results. Missing external budget/study/browser inputs remain explicit exact rows, not silent feature cuts or blanket blockers on independent work.

## 5. Một return hợp nhất sau follow-up

Owned product paths/source rules and existing full-plan safety remain unchanged. No edits to pinned design/reviewer/requirements evidence, INT-A/MC-003A worktree, hook/security baseline, no scan/commit retry/stage/merge/push/deploy or permission/context/host bypass. Human-provided API key is not authorization for other Cloud/admin/provider operations.

Maintain existing workboard/contract/coverage/`final-return.md`, exact source/diff hashes and Claude/ZCode contribution history. Per finding record fixed/already-fixed/unresolved with current code + regression evidence. Per auth/GW/NFR case record actual commands/cwd/tool/version/start-end UTC/exits/redacted raw logs and expected vs actual; preserve failures/skips and author vs independent evidence.

Final return includes completed BE/API/FE inventory, all **20 FR /63 AC /14 NFR /3 original GWs**, Cloud state/config/identity mapping/evidence, QA disposition, workload/restore/resource disposition, reproducible local start/login/test/stop/isolated restore, source/evidence manifests and real remaining blockers. Do not submit only a list of new plans or claim old immutable evidence as fresh execution.

Missing code → PARTIAL_IMPLEMENTATION. Code complete but mandatory execution unavailable → IMPLEMENTED_WITH_VERIFICATION_BLOCKERS, exact affected rows. Full BE+FE and applicable author tests pass/no known critical-high defects → FULL_P0_BE_FE_IMPLEMENTED_SELF_TESTED_PENDING_REVIEW. No self-DONE/ACCEPTED/production-ready, MC-002/Step03B/release approval; designated nonauthor review still follows.

**Sau khi prompt trước đã trả kết quả, resume source mới nhất, sửa findings còn đúng, nối Cloud profile trong đúng scope và hoàn thiện candidate cuối. Không restart, không tạo writer/task trùng, không ngừng sau intake/config hoặc từng wave.**
