# ZCode — cập nhật task ĐANG CHẠY: W6–W7 + ZITADEL Cloud Free + Codex review

**Đây là delta cho chính phiên implementation đang chạy, không phải task mới.** Tiếp tục `MC-P0-ZCODE-EXECUTION` theo `MC-P0-ZCODE-RESUME-AFTER-CLAUDE-STOP-PROMPT.md`; không restart W0/W3, không tạo workboard/branch hoặc writer thứ hai, không nộp chỉ planning pass. Bạn vẫn là owner duy nhất của product backend/API/frontend.

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; reference HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. Khi Codex kiểm tra delta này, selected 665-entry stop snapshot chưa đổi; current contract vẫn revision 9, SHA-256 `06b4c929cc9d7762f3acfc61950ccb691cf84488a9debdba20e1b98005cb3aaa`, workboard còn ghi Claude và W6 next. Nếu source của bạn đã tiến hợp lệ sau đó, preserve và ghi actual snapshot/contract, không rollback để ép pin cũ.

## 1. Ghi nhận takeover rồi tiếp tục code

Ở checkpoint hiện tại append actual ZCode/tool/model/UTC/ownership acknowledgement vào **workboard đang có**, giữ Claude history/evidence. Record current source identity, W6 actual progress và R9 consumed/not-yet-consumed đúng thực tế. Việc sửa stale metadata là ngắn gọn; không làm một vòng audit/intake mới rồi ngừng implementation.

Giữ W1–W5, complete W6 bulk/import/export/brief ở cả BE/API/FE, rồi W7 và residual P0 gaps. Preserve current scope 20 FR/63 AC/14 NFR/3 original GWs, operation-specific UNKNOWN/idempotency/atomicity và correct historical time-window semantics; không coi CAS là receipt hoặc tự hạn chế Brief về current t2.

## 2. Hướng IdP mới: chuẩn bị ZITADEL Cloud Free cho dev/test

PO nêu ZITADEL Cloud Free là phương án có thể dùng. Codex đang chuẩn bị nó như profile dev/test thay cho việc chờ local bootstrap được sửa. Đây **chưa** là một Cloud instance đã được tạo/configured/tested, chưa có issuer/client credentials mới được bàn giao và không phải production/paid-service approval.

Phân công:

- **Codex IdP subagent:** public source/official-doc preflight, confirmed local script defects và minimal Cloud migration/operator checklist trong `docs/testing/p0-parallel-20261027/idp/`.
- **Human/operator có quyền account:** tạo/chọn đúng Cloud Free instance và cấu hình app qua cơ chế được hỗ trợ; bàn giao public issuer/project/web-client/API-client metadata cùng secret references qua private local inputs. Không yêu cầu gửi secret/key/token vào chat.
- **ZCode:** khi có metadata/config phù hợp, reuse existing issuer/client/audience/introspection configuration và kiểm thử integration. Không cần framework đa-provider hoặc rewrite BFF/verifier. W6 source độc lập vẫn tiếp tục trong lúc chưa có Cloud inputs.

Readiness trước switch thật:

1. Exact Cloud issuer/discovery, Web PKCE app/callback đúng route thực của app, API application's authenticated introspection method/key và actual project audience phải verified. Không đoán domains/ids hoặc copy local instance values sang Cloud.
2. Giữ code+PKCE/state/nonce, token server-side, strict issuer/audience/subject checks và backend current Workspace/Matter/operation rights. Machine auth không là user-login proof.
3. Cloud có `(issuer, subject)` mới. Không tự map account theo email/display name hoặc cấp membership. Dùng explicit synthetic identity seed/mapping và task-owned fresh dataset nếu cần; preserve local identities/data, ghi strategy trước mutation, không silently overwrite old ownership.
4. Giữ local resources/volume/credentials hiện có. Không rerun old provisioning scripts, `down -v`, broad delete hoặc sửa unrelated DB vì chọn Cloud.
5. Chỉ Free/dev-test, không billing/card/paid upgrade/custom-domain cost hay production deployment. Exact Free quota cadence/enforcement chưa được chứng minh bởi một con số trên pricing; public plan cần được operator xác nhận, không hứa toàn hệ thống $0 hoặc tự nâng gói khi limit.

Nếu actual Cloud account/issuer metadata chưa có, ghi `CLOUD_PROFILE_PENDING_OPERATOR_INPUT`, giữ fail-closed và làm tiếp code/tests độc lập. Không đọc bootstrap/admin secrets hay tự tạo provider/account/login workflow để lấp khoảng trống. Runtime/Cloud mutation không được cấp quyền chỉ bởi các task preflight.

## 3. Ba nhánh Codex song song — không đụng source của bạn

Codex đã dispatch subagents thật, dùng immutable public snapshot `/private/tmp/mc-p0-parallel-20261027-0da4q45k` theo `docs/testing/p0-parallel-20261027/snapshot-manifest.json`:

- `idp/`: ZITADEL preflight / Cloud operator proposal.
- `qa/`: frozen W1–W5 source correctness/security review.
- `acceptance-restore/`: canonical AC/NFR/GW matrix và isolated DB+objects+history restore preparation.

Các thư mục trên nằm dưới `docs/testing/p0-parallel-20261027/`. Chúng không sửa apps/ops/workboard/contract/design. Không sửa output của reviewer hoặc snapshot. Chỉ consume final return được coordinator/human bàn giao hoặc status đã ghi RETURNED; thư mục tồn tại/partial write không là completed review. Không claim chúng pass trước actual return.

Khi nhận findings:

- So exact frozen path/hash/line với current source trước sửa, vì bạn có thể đã xử lý cùng lỗi. Không rollback current progress để tái tạo frozen finding.
- Với defect thật, sửa root cause và callers/tests trong owned product source; giữ selected action/dataflow/recovery guarantees, run focused regression rồi tiếp tục. Không biến mọi source observation thành scope change hoặc bỏ test để xanh.
- Source QA là STATIC_REVIEWED, acceptance matrix/restore plan là PREPARED_NOT_EXECUTED. Actual login/browser/PG/restore/load/GWs vẫn cần execution receipts riêng; Codex prep không tự cấp PASS hay giao quyền resource mutation.
- IdP/QA/restore reports không thêm per-wave gate. Một material security/scope dependency chặn đúng đường liên quan; tiếp tục những phần độc lập, không dừng whole assignment.

## 4. Final delivery và boundaries vẫn như full STOP prompt

**Cập nhật: hai return IdP và source QA đã được Codex nhận và kiểm output pins.** Đọc trước khi xử lý source:

- `docs/testing/p0-parallel-20261027/qa/return.md` — SHA-256 `8b7a7673f0f97cafb2f984a556f38d805e562a6ae145cc9f4691e466e42704e0`; `qa/inputs.json` — `d1225f28eb5701097b089835ecb24631788fa532ad24b72871b5fff05c147f5c`.
- `docs/testing/p0-parallel-20261027/idp/return.md` — SHA-256 `20b106f8647ad635b3988509f92323f65ef3b36e8380e3bf1867b85762c8b02e`; `idp/inputs.json` — `6449a06095fa6f5bf2c87858638f56d2b7299874f096457433a600bfa253bb24`.

### 4.1 Giao sửa findings W1–W5 trong cùng assignment

Report Ids dưới đây là **F01..F05 của `qa/return.md`**, không phải original CW1-F01..03. Đây là STATIC_REVIEWED trên frozen bytes; recheck current code trước sửa, ghi disposition nếu đã fixed. Ở checkpoint an toàn tiếp theo, ưu tiên ba P1, tự chạy meaningful regressions, rồi tiếp tục W6/W7; không tạo một task/refactor lại từ đầu hoặc dừng xin review theo từng finding.

1. **QA-F01 / P1 — open dispute biến mất khỏi derived state khi withdraw/revoke.** Giữ current-applicable unresolved dispute precedence cho đến authorized resolution dù evidence không còn satisfying; không làm historical/old-epoch dispute tác động vô hạn. Test accepted→disputed→withdraw và →revoke, còn dispute/open history/dependency non-satisfaction, sau resolve recompute đúng.
2. **QA-F02 / P1 — stale verifier review supersede verdict mới trong cùng epoch.** Epoch fence đơn lẻ không chống lost human decision. Bind review intent với current assessment/generation và kiểm atomically, gồm explicit first-review generation; đồng bộ port/service/HTTP/FE/contract. Test hai màn hình cùng-read, A đổi verdict, B stale bị từ chối/no mutation/event; fresh deliberate reversal vẫn được theo policy. Lost-response retry của nonreceipted review không tự thành safe resend hoặc PASS.
3. **QA-F03 / P1 — `proofRequired=false` của EDITOR bỏ qua package/signature applicability.** Tách outcome-verification axis khỏi Filing stage guards. Không cho flag này thay OWNER explicit no-signature applicability/reason hoặc xóa package completeness. Giữ supported no-proof semantics. Test editor/no-proof/undeclared signatures không submit; approved OWNER applicability path vẫn chạy, no unauthorized submission/event/revision.
4. **QA-F04 / P2 — FE Control Room trộn nhiều snapshots.** Display facts/causal labels/context phải cùng advertised room boundary, hoặc detect/label/withhold mismatched reads. Separate current edit panels phải nói rõ boundary riêng. Test different room/work/context revisions và concurrent context closure; không chỉ test handcrafted component fixture.
5. **QA-F05 / P2 — bỏ causal reason cho transitive blockers.** Render existing gate/reason code theo đúng upstream link, gồm UPSTREAM_BLOCKED trên upstream đã COMPLETED và completion vs proof differences. Không viết client evaluator hoặc endpoint mới chỉ cho việc này. Test actual returned reasons được trình bày bằng business wording.

Report có exact source lines, requirements và suggested tests; đọc đầy đủ trước fix. Các thay đổi khôi phục approved rules, không mặc nhiên approve mọi local contract trước đó. Nếu có material semantic conflict thật, trình đúng scoped decision và tiếp tục phần không bị chặn. Fix root cause, update all affected consumers/tests, preserve nonauthor report, không nới assertions để giữ những fixtures sai.

### 4.2 Giao phần IdP/Cloud theo ranh giới owner

IdP source report xác nhận `provision.sh` dùng JSON field names/enums không khớp supported schema; old receipt ghi redirect literals thay vì app readback. Không replay script đó để tạo Cloud. Cần public supported configuration và readback như report, giữ Cloud/local identities khác nhau và strict audience checks. Live current app/cause vẫn UNKNOWN vì preflight không gọi IdP.

ZCode chỉ chuẩn bị/áp dụng compatible app config và tests trong owned paths khi có actual verified Cloud inputs. Không tự chạy operator PUT/create/account/private admin steps trong report: đó là **proposal NOT_EXECUTED** cần đúng operator authority. Codex/operator xử lý instance setup/readback; source implementation W6 vẫn đi tiếp. Không hứa Free hard limits, auto-upgrade hoặc coi IdP switch giải quyết browser/human-study acceptance.

Hoàn thiện một product candidate BE+API+FE; cập nhật living contract/version cả producer+consumer, API/config/docs, same workboard/return, exact source/evidence manifests và full requirement/GW outcomes. Author checks qua permitted tools, fresh disposable PG fixtures đã verified, FE checks/build, actual negative/UNKNOWN/restart/recovery evidence; no historical owner report relabeled as your execution.

Giữ no source collision/private leak/permission bypass/security-scan or commit retry/stage/merge/push/deploy, no INT-A/MC-003A/design/reviewer evidence edit. Browser/human-study/IdP/production/cost/recovery acceptance tách rõ; missing code vẫn PARTIAL_IMPLEMENTATION, không self-DONE/ACCEPTED/MC-002/Step03B/production-ready.

**Chỉ cập nhật checkpoint hiện tại, tích hợp delta này và làm tiếp W6–W7. Không chạy lại prompt như một task mới hoặc dừng để chờ ba nhánh Codex khi phần code không phụ thuộc chúng.**
