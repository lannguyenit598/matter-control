# MATTERCONTROL — ZCODE TIẾP QUẢN CLAUDE VÀ HOÀN THÀNH TOÀN BỘ BACKEND + FRONTEND P0

Tôi là Product Owner. Claude Code đã hết quota. Tôi giao **actual ZCode** tiếp quản **cả backend/API và product frontend** của assignment hiện tại **MC-P0-ZCODE-EXECUTION**, tiếp nối phần Claude đã làm. Task tiếp nhận: **MC-P0-ZCODE-RESUME-AFTER-CLAUDE**.

**Đọc source/checkpoint hiện tại, consume Design R9, hoàn thiện W3 đang dở rồi đi hết W4–W7, tự test/sửa và trả một candidate BE+FE tổng hợp. Không restart W0, không reimport source, không dừng sau intake/design/một wave để hỏi “tiếp tục”.** W1/W2 phải được giữ và sửa regression nếu có, không làm lại từ đầu.

Đây là owner amendment cho product execution, supersede các câu lịch sử còn giao execution cho Claude hoặc chỉ backend cho ZCode trong phạm vi assignment này. Giữ attribution cũ, independent reviewer/architecture/design/PO/release authority, separate INT-A workstream và mọi safety boundary. Không tự đổi account/provider/model hoặc mua quota vì takeover.

## 1. Đúng checkout, đúng working source

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch `codex/unified-project-flow`.
Reference HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`.
Source implementation đang uncommitted, nên HEAD không chứa đầy đủ phần Claude đã làm.

Đọc root/component AGENTS, CLAUDE/rules và applicable skills trước sửa. RTK cho shell, Semble-first khi khám phá, Context7/current official docs cho version-specific API/library/tool usage; frontend đọc actual installed Next docs như component rules yêu cầu. Không tự tạo parallel agent writer hoặc generation workflow khác.

Đọc toàn bộ inputs sau, relative với root:

1. `docs/implementation/tasks/MC-P0-ZCODE-RESUME-AFTER-CLAUDE.md` và `docs/reviews/p0-claude-quota-zcode-resume-intake-20261027.md` — task/summary mới nhất.
2. `docs/testing/p0-zcode-resume-after-claude-20261027/`: inventory/input pins, fresh Go/build/frontend receipts và raw logs, closing snapshot khi có.
3. Existing `docs/implementation/p0-zcode-execution/{workboard.json,local-contract.md,final-return.md,w1-implementation-notes.md,local-identity-approval.json}`. Chúng có phần stale được summary nêu rõ; reconcile với source, không làm mất progress.
4. `docs/implementation/p0-zcode-end-to-end-execution-plan.md`, `MC-P0-ZCODE-COMPLETE-PLAN-PROMPT.md`, `MC-P0-CLAUDE-CONTINUE-W1-FIXES-TO-FULL-P0-PROMPT.md` và full takeover prompt trong `docs/implementation/handoffs/`. Giữ đầy đủ scope/DoD; chỉ owner/current-state statements cũ được prompt này supersede.
5. Approved `docs/requirements/`, original 3 GWs, canonical Atlas, `docs/testing/p0-zcode-plan-20261026/coverage.json`, architecture/current contract candidates và source-import provenance. Không mở lại discovery hoặc các quyết định đã duyệt.
6. **Toàn bộ `docs/implementation/handoffs/MC-P0-CLAUDE-CONSUME-DESIGN-R9-ADDENDUM.md`**, R9 final intake và verified final design package theo §3 dưới đây. Tên file và câu “Claude consumer” là lịch sử; **bạn là ZCode consumer/executor mới**.

Snapshot hiện tại: **613 public source/config/doc entries** dưới `apps/backend` và `apps/frontend`, aggregate SHA-256 `4fcd245181a6672453cd88b125a32e1e5e962c3ad859982f675b68a2484e97f9`, method và per-file hashes trong `inventory.json`. Compared with Claude start: 29 modified +141 added, no missing; không phải số feature đã accepted.

Đó là snapshot trước checks. `pnpm check` chỉ làm đổi generated cache `apps/frontend/tsconfig.tsbuildinfo`; xem `closing.json` và `post-check-cache.json` để có exact post-check cache pin/updated aggregate. Authored source và các input pins không drift. Đừng nhầm cache này với writer conflict hoặc rollback nó để ép pin cũ; recheck semantic source và ghi cache exception đúng phạm vi.

Verify actual root/branch/HEAD, relevant source bytes và không có implementation writer khác cùng paths trước takeover. Nếu có progress hợp lệ sau snapshot, reconcile đúng actor/checkpoint và preserve nó; **không reset/stash/clean/switch existing checkout hoặc ép source về baseline**. Drift không giải thích được chỉ chặn đúng scope liên quan, không bỏ cả plan.

Trong acknowledgement đầu, ghi actual ZCode/tool/model/configured route, đọc/pin source và quyền sở hữu. Append transition Claude→ZCode vào **chính workboard đang có**, giữ session/history/author evidence. Reconcile stale top-level/W1/W3/contract/current_source_checkpoint/coverage; không tạo workboard song song hoặc đổi tên cả thư mục vì legacy filename.

## 2. Những gì đã có — preserve rồi đi tiếp

**W1 BE+FE có source:** PG workspace/membership/access/history/receipt; shared memory/PG contracts; ZITADEL introspection + lookup-only identity; separate product API/composition/`cmd/mcapi`; OIDC/BFF server-side session, Workspace/Matter navigation/admin và Requirement create/read/history.

**CW1-F01..03 đã có source fixes và tests:** operation-specific receipted/UNKNOWN recovery, lost body/unusable command reply remains UNKNOWN, same-origin/control-character-safe returnTo. Đọc current tests, giữ nguyên guarantees và bổ sung nếu phát hiện gap; đừng chạy old bug-reproducer rồi suy diễn bug vẫn tồn tại vì nó assert old behavior.

**W2 BE/API/FE đã có source và author checkpoint:** typed Actions, metadata, execution/waits/guards, AND dependencies/cycles/reblock, timing/attention/critical chain/milestones/parties/workstreams, Grid/My Actions/Waiting On, rejection explanations; migration 0002, WorkService + memory/PG adapters + contracts + HTTP tests; `features/work` và Matter work/detail/planning/My Actions pages. Browser/UI→Go→PG vẫn chưa accepted.

**W3 đã bắt đầu, dù return/workboard còn ghi NOT_STARTED:**

- Backend: `domain/matter/evidence.go`, `port/evidence.go`, `service/evidence_service.go`; `postgres/evidence_store.go`, `migrations_mattercontrol/0003_documents_evidence.sql`; `repotest/mattercontrol/{memory_evidence,memory_objects,contract_w3}.go`; `outbound/objectstore` adapter/tests; evidence HTTP handlers/DTO/tests và product composition/config.
- FE: `features/proof/{schemas,repository,actions}.ts`; BFF raw upload và content/download routes dưới `app/api/matters/.../documents/...`; raw-body/download client support. **Full documents/proof product pages/components chưa thấy trong intake**, nên đây là resume điểm W3, không coi đã xong hoặc tạo lại backend.
- Actual **contract revision 7**, 34,487 B, SHA-256 `75cf6493d33f38aa4daabb8472fa8f21e66a6998ebc09a55777bc546b69869ae`: §2.4 documents/proof/upload/content/promotion/assessment đã có. Workboard còn rev 6, return còn rev 5; sửa references khi tiếp nhận. Nếu contract đã tiến hợp lệ, dùng actual revision/hash, không rollback.

Codex kiểm mới: **Go build pass; 226 scoped Go race test/subtest pass, 0 fail/skip; frontend `pnpm check` pass, 30 files/325 tests**. Go scope gồm core, product API, W1/W2/W3 memory contracts và object store; không có PG fixtures/real login. Author reports `make check`+PG/build cho W1/W2 nhưng intake không có fresh raw receipts để độc lập tái xác nhận; chạy actual gates của final candidate sau khi sửa, không biến report cũ thành execution của bạn.

## 3. Bắt buộc consume Design R9 final và addendum

Thực hiện đầy đủ instruction này, với **ZCode thay Claude làm executor**:

> Đọc và thực hiện addendum: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/handoffs/MC-P0-CLAUDE-CONSUME-DESIGN-R9-ADDENDUM.md`. Consume R9 final, xử lý error mapping theo từng operation rồi tiếp tục toàn bộ backend/API/frontend W1–W7 theo plan hiện tại. Không restart hoặc dừng sau design intake.

Verify trước consume:

- `docs/design/p0-handoff-r9/return.md`: **12,863 B**, SHA-256 `d4dc769f1958f486a17a9a90fa5b1060de3172a2b07b544c6f1adff788b14b3d`.
- `docs/design/p0-handoff-r9/manifest.json`: **20,096 B**, SHA-256 `2b68bc92431270dc456111590ca1de2231e2a10dba95829dccd0a3b68ba87563`; 102 payloads/992,101 B, excludes manifest/return, full input identity verified by Codex.
- `docs/reviews/p0-design-r9-final-intake-20261027.md` và current spec/delta/matrix/CSS/prototype/supporting sources/handoff/validation. Input đủ để implement, không phải visual/security acceptance.

Giữ Enterprise Precision, Comfortable/Compact, EN/VI legal text, Lucide và actual Atomic primitives/domain feature boundaries. Áp dụng scoped purge, valid draft retention, identity/Workspace/Matter/document isolation; target/current-guard/reason/impact acknowledgment; contextual Back/drill-down; My Actions eligible/waiting/blocked/historical; đủ denied/stale/unavailable/UNKNOWN/readback-lost states. Không copy prototype fixtures/role selector/evaluator thành enforcement hoặc giảm P0 để giống mockup.

**Wire mới supersede observation cũ:** R9 còn ghi promotion DEPENDENCY_PENDING tại thời điểm đọc rev 6; rev 7 hiện đã có `/promotion` và impact token. Verify/reuse current producer/consumer, hoàn thiện FE thật và tests; không nói phải chờ wire chưa tồn tại hoặc tạo một API thứ hai.

**Error mapping theo operation:** missing precondition 428; stale CAS 412; explicit guarded domain refusal 409 `urn:mc:rejected` với typed reason/gates/alternatives/path theo contract; key reuse 422; lost command answer UNKNOWN, không optimistic success/rollback/blind resend. Receipted command mới giữ same key + exact frozen payload; nonreceipted command cần authorized readback trước new intent. Phân biệt 409 refusal đã xác nhận với transport loss/unknown. Test client/action/component/server behavior và no-second-mutation/no-domain-success-on-refusal.

Design checker global `"409" not in contract` là known reconciliation gap; emitted result tại final R9 intake là **30 PASS +1 FAIL**, không phải narrative 31/32. Không bỏ 409, đổi CAS thành 409, nới test hoặc sửa pinned R9 để lấy xanh. Design-owner correction riêng; current product contract/consumers/tests phải coherent và remaining check gap ghi thật. R9 packages và reviewer evidence read-only.

## 4. Hoàn thành toàn bộ phần còn lại theo một plan dài

Không dừng sau acknowledgement/intake hay W3. Mỗi slice cần persisted backend behavior + API + actual FE + history/readback + relevant negatives/recovery. Không backend-only, FE mock, TODO endpoint hoặc list-of-fields completion.

| Checkpoint | Việc tiếp tục cho cả BE/API và FE |
|---|---|
| W1/W2 preserve | Recheck regressions, current authorization/session/CAS/receipts, domain 409 vs concurrency, real draft cleanup/navigation; sửa failures khi có. Không recreate source đã pass. |
| **W3 finish now** | Reuse partial documents/proof service/PG/object store/API and FE plumbing; hoàn thiện documents/version/signature upload/read/list/detail, target/current promotion + impact ack/rebase, criteria/applicability, claims, designated independent assessments/disputes/revocation/expiry, current/fixed references và derived impacts. Real UI interactions và scoped streaming; full shared memory/PG/API/client/component/recovery/security tests; sync config/docs/migrations. |
| **W4 Filing** | Approved complete manual filing flow/package/signatures/submission/receipt/wait/supplement/response/outcome, repeated distinct cycles/exact observations/version binding, no-supplement/reject/withdraw/correction/reopen/current proof epoch; full permitted relation paging và FE package/timeline/cycle/wait views. Receipt ≠ approval. |
| **W5 Control Room/context** | Consistent authorized/as-of snapshots, causal blockers/Next Actions/adjacent Decisions/Waiting On/Milestones/Gaps/Changes, basic Decision/Finding/Risk/entity context; connected record→proof→Back and mobile triage. No unavailable→zero/READY. |
| **W6 data/brief** | Four-field row-atomic bulk+audit/results/reconciliation, safe CSV/XLSX mapping/preview/connected-group validation/commit/idempotency/partial recovery, meaningful scoped formula-safe XLSX export, recorded-time changes `(t1,t2]` vs outstanding at t2; full FE operations/download/recovery/provenance. |
| **W7 stabilize/handover** | Complete three original GWs, security/revocation/foreign-scope/concurrency/restart/restore/load/regression, complete every P0 screen/action/state, remove unused template demos after checking callers, actual permitted UI/a11y checks, reproducible local run/test/isolated-restore instructions và final source/evidence manifests. |

Preserve Requirement ≠ Action, five approved independent axes, waiting ≠ blocked, completion ≠ verification, non-self-verifier, assignment grants no access, upstream reopen reblocking without history erasure, filing proof epoch, VIEWER scoped export và current authorization. Không đổi approved policy, FR identity/GWs, introduce fabricated states/scores hoặc P1/P2 scope.

## 5. Runtime/resources/private inputs và blockers

Owner paths sau acknowledgement: `apps/backend/`, `apps/frontend/`, same task-owned `ops/p0-local/`, `docs/implementation/p0-zcode-execution/`. Preserve existing Go/PostgreSQL architecture, native/product migration split, composition/sqlc generated boundaries, Next.js Atomic/features/security rules. New dependency chỉ khi cần, có justification/lockfile/tests; no broad rewrite.

Giữ PO-selected **self-hosted local ZITADEL**, không chuyển provider/anonymous/shared-token/password-grant fallback. Tokens giữ server-side, browser opaque handle, exact verifier active/issuer/audience/expiry/subject và backend current Workspace/Matter/operation rights. Machine introspection probe không là human login.

Runtime evidence trước: `mc-p0-claude-pg`, loopback 55440, retained `mc-p0-claude-pgdata`, label `mc.task=MC-P0-CLAUDE-TAKEOVER`; native/product test DBs riêng và `mc_p0_run`; existing `mc-p0-idp-*`. **Đây là owner report, phải verify live exact identity/ownership/DB trước dùng.** Label cũ chứa Claude không biến resource thành unrelated, cũng không cho quyền lên resource khác.

Được sử dụng chỉ runtime configuration đã thuộc cùng synthetic local assignment và cần thiết để chạy ứng dụng/tests: task PG env (`ops/p0-local/secrets/claude-pg.env`), API introspection key (`runtime/mc-api-app-key.json`), synthetic users (`secrets/test-users.json`), task profile `.env`/frontend private config qua code/process inputs. Không cat/print/log/hash/export secret values, không đưa vào source/prompt/screenshot/manifest. Không đọc bootstrap PAT/master/admin/system keys, unrelated credentials hoặc tự reset/provision vì đổi owner.

Public `ops/p0-local/README.md` có historical bootstrap/delete commands; chúng không là approval để replay provisioning/`down -v`. Không sửa/xóa existing unrelated DB/volume; no prune/broad teardown. Native PG suite có truncate/drop: chỉ disposable fixture đã xác minh, tuyệt đối không run DB. Giữ resource ledger và product data/objects. New task-scoped isolated fixtures/restore targets giữ loopback/synthetic/no paid services theo existing full-plan scope.

ZITADEL redirect URI bị reject và actual user-token audience chưa verified là dependency riêng. Inspect public/current app config và compatible code; admin-side fix cần actual authorized operator, không mở private admin scope từ prompt này. Không nới issuer/audience hoặc làm synthetic token để “chứng minh” E2E. Ghi exact actionable blocker một lần và làm tiếp source/tests độc lập.

Nếu browser disabled/unavailable, không bypass bằng CLI/headless/alternate browser/server/export/OS capture hoặc tự đổi settings. Mark keyboard/touch/visual/screen-reader rows blocked; AC-137 cần 5 người thật theo protocol, không simulate pass. Cloudflare/cost/production retention/SLA/provider/release là external gates, không blockers giả cho mọi code task và không tự award PASS.

No stage/commit/scan retry/merge/push/deploy, hook/security baseline edit, unsupported Mimosa disposition/context-host switch. Takeover do quota không hồi sinh action đã bị từ chối. Không sửa design/reviewer artifacts, INT-A/harness, MC-003A worktree hoặc approved requirements/formal evidence. Real tool refusal chặn đúng action; không bypass, tiếp tục phần độc lập.

## 6. Test, checkpoint và final delivery

Đọc applicable component rules/skills trước sửa. Reuse current code/helpers; fix root cause và toàn bộ callers/tests/config/docs trong scope, không lặp lại cuộc audit không cần thiết. Backend behavior tests theo rules/TDD, `make check`/race với **đúng native/product PG fixtures**; regenerate sqlc bằng pinned tooling. FE `pnpm check`/`pnpm build` và relevant story/E2E/a11y checks theo permissions. Không suppress lint/security hoặc đổi expected criteria để xanh.

Run affected checks sau edits, combined gates khi candidate ổn định. Report test skips vs packages không có tests; source/mock/bounded API tests ≠ PG/human/browser/production proof. Mỗi actual attempt cần argv/cwd/tool/start-end UTC/exit/redacted stdout/stderr/source hashes. Preserve failures và logs; không gán Claude receipts thành execution của bạn.

Cập nhật **một workboard** và existing `final-return.md` theo progress: current owner/source/contract/design revision, actual FR/AC/NFR/GW evidence, source vs execution vs acceptance limits, stale statements được reconcile. Context limit thì checkpoint exact next action rồi resume cùng plan; không coi quota/context checkpoint là final product hoặc hứa unsupported background work.

Final candidate phải có: real BE/API/FE inventory cho **20 FR /63 AC /14 NFR /3 original GWs**, exact source/diff manifest và authorship, actual checks/log hashes và remaining blockers, local setup/migrate/seed/login/run/test/stop/isolated full restore instructions, owned-resource disposition, known defects và outstanding architecture/design/security/production gates.

Thiếu code → PARTIAL_IMPLEMENTATION. Code đủ nhưng mandatory execution thật bị chặn → IMPLEMENTED_WITH_VERIFICATION_BLOCKERS. BE+API+FE đầy đủ, applicable author tests pass, no known critical/high defects → FULL_P0_BE_FE_IMPLEMENTED_SELF_TESTED_PENDING_REVIEW. Không tự DONE/ACCEPTED/MC-002 closure/Step03B/production-ready. Independent review vẫn do nonauthor, không chuyển cho source author khi đổi tool.

**Bắt đầu: acknowledge source snapshot → consume R9 addendum → reconcile rev 7 và W3 partial → hoàn thiện W3 rồi W4–W7 ở cả backend/frontend. Không trả thêm planning pass hoặc dừng sau một checkpoint.**
