# MATTERCONTROL — ZCODE RESUME SAU KHI CLAUDE ĐÃ DỪNG: HOÀN THÀNH W6, W7 VÀ TOÀN BỘ P0 BE+FE

Tôi là Product Owner. **Claude Code đã xác nhận dừng** và bàn giao trạng thái PARTIAL_IMPLEMENTATION. Tôi giao **actual ZCode** tiếp quản **cả backend/API và product frontend** của assignment **MC-P0-ZCODE-EXECUTION**. Task tiếp nhận hiện tại: **MC-P0-ZCODE-RESUME-AFTER-CLAUDE-STOP**.

**Điểm resume đã đổi: W1–W5 có code ở cả hai stack và author tests; W6 mới có spreadsheet codec; W7 còn lại. Không quay về W3, không restart W0, không reimport và không viết lại những phần Claude đã làm.** Hoàn thiện W6 cùng API/FE, xử lý gaps còn lại của W1–W5 và thực hiện W7; tự test/sửa rồi nộp **một candidate BE+FE tổng hợp để review cuối**. Không chỉ đọc/plan/acknowledge rồi dừng, không xin “tiếp tục” sau từng use case/wave.

Prompt này supersede **điểm resume và owner** trong prompt cũ `MC-P0-ZCODE-RESUME-AFTER-CLAUDE-PROMPT.md`, vốn được chuẩn bị trước khi Claude tiếp tục W3–W5. Không execute checklist “W3 finish now” cũ như thể source đó chưa có. Full scope/business/safety/independent acceptance vẫn giữ nguyên; historical Claude/ZCode authorship không đổi. No automatic quota/account/model/provider switch.

## 1. Tiếp nhận source hiện tại và xác nhận quyền sở hữu

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch `codex/unified-project-flow`.
Reference HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`.
Implementation đang uncommitted, nên HEAD không chứa toàn bộ source đã làm.

Đọc root/component AGENTS, CLAUDE/rules/skills applicable. Latest direct PO assignment trong prompt này giao ZCode execution BE+FE; các câu lịch sử nói Claude execution hoặc chỉ ZCode backend được supersede đúng phạm vi product task, không đổi INT-A/design/independent QA. Shell dùng RTK, Semble-first khi khám phá, Context7/current official docs khi dùng API/library/CLI cụ thể; frontend đọc actual installed Next docs theo component rules. Không tự spawn thêm source writers.

Đọc đầy đủ, relative với root trên:

1. `docs/implementation/tasks/MC-P0-ZCODE-RESUME-AFTER-CLAUDE-STOP.md` và `docs/reviews/p0-claude-stop-zcode-handoff-20261027.md`.
2. `docs/testing/p0-claude-stop-zcode-handoff-20261027/claude-stop-return.txt` — nguyên bản author stop return do PO cung cấp. Đọc cả phần “chưa làm/blocker/rủi ro”, không chỉ bảng đã làm.
3. Cùng thư mục evidence: `inventory.json`, `input-pins.json`, actual build/sheet receipts/raw logs và closing identity nếu có.
4. Existing `docs/implementation/p0-zcode-execution/{workboard.json,local-contract.md,final-return.md,local-identity-approval.json}`; full `p0-zcode-end-to-end-execution-plan.md` và original P0 scope/DoD/requirements/coverage/GWs. Older source/census/owner statements là lịch sử, không áp lại khi source đã tiến.
5. Approved `docs/requirements/`: business rules, state semantics, permission matrix, SRS, acceptance criteria, original Golden Workflows; canonical Atlas và `docs/testing/p0-zcode-plan-20261026/coverage.json`.
6. **Toàn bộ** `docs/implementation/handoffs/MC-P0-CLAUDE-CONSUME-DESIGN-R9-ADDENDUM.md`, `docs/reviews/p0-design-r9-final-intake-20261027.md` và final R9 package. Câu “Claude thực hiện” trong addendum nay áp dụng cho **ZCode**, không phải chỉ dẫn gọi Claude lại.

Fresh inventory: **665 selected public source/config/doc entries**, aggregate SHA-256 `c6821c3cf3d58fe9dbc8ba510711445f00d10bce5c1b064e373051f0af14e6d7`; exact method/per-file hashes trong inventory. So với Claude acknowledgement 472 entries: 29 modified +193 added, no missing. Đây là source identity, không phải completion metric. Generated TypeScript cache nếu đổi do check phải ghi riêng, không nhầm với một writer hay rollback để ép hash.

Actual root/branch/HEAD/relevant bytes phải recheck trước sửa. PO đã có stop report; không tự signal/kill một process không rõ ownership. Nếu còn concurrent writer thật, bảo vệ đúng files và báo điều phối, không ghi đè. Nếu có progress hợp lệ sau snapshot, reconcile actor/checkpoint và preserve; không reset/stash/clean/switch checkout hoặc ép source về old baseline.

Trong acknowledgement đầu ghi actual ZCode/tool/version/model/configured route, verified source snapshot và ownership. Update **chính workboard đang có**: append transition Claude→ZCode, cập nhật current source/contract/design và W6 state. Không tạo workboard mới, xóa session log hoặc relabel Claude contribution thành của mình. Chuẩn bị handoff chưa phải dispatch/execution; chỉ claim việc bạn đã thực hiện thật.

## 2. Phần đã làm phải giữ

| Wave | Current implementation |
|---|---|
| W1 + CW1 fixes | PG stores, separate product API/composition/`cmd/mcapi`, ZITADEL verifier/identity mapping, server-side OIDC/BFF sessions, Workspace/Matter/Requirement FE; receipted-vs-CAS-only UNKNOWN recovery, lost response-body handling và safe returnTo fixes |
| W2 | Typed Actions/metadata/execution/AND dependencies/cycles/reblock/critical chain/milestones/parties/workstreams/derived states, shared memory/PG contracts; Grid/detail/planning/My Actions FE |
| W3 | Immutable document versions, guarded current promotion/impact token, signature observations, criteria/evidence/claims/independent assessment/dispute/applicability/verifier, local objects and streamed upload/download; Proof card và Documents UI; migration 0003 |
| W4 | Filing nine-stage machine, repeated supplement cycles/exact submissions/observations/negative paths/reopen/proof epoch/correction, shared memory/PG tests; filing list/detail/per-stage forms; migration 0004 |
| W5 | Single-snapshot Control Room and Decision/Finding/Risk/Entity context records, shared memory/PG tests; Control Room/context FE; migration 0005 |
| W6 partial | `internal/core/port/sheet.go`, `internal/adapter/outbound/sheet/{codec,codec_test}.go`: stdlib CSV/XLSX codec. **Chưa có đủ bulk/import/export/brief domain/service/API/FE** |

Actual contract hiện tại **revision 9**, **41,389 B**, SHA-256 `06b4c929cc9d7762f3acfc61950ccb691cf84488a9debdba20e1b98005cb3aaa`, §2.1–2.6. Không quay về rev 6/7 của earlier handoff. W6 cần extension versioned trước khi producer/consumer diverge.

Claude báo last full checks trước codec: `make check` exit 0, PG fixtures/race, no lint issues; FE 34 files/361 tests và build exit 0. Sau codec chỉ package tests đã chạy. **Đó là author-reported**, không phải evidence của bạn hay independent acceptance.

Codex fresh checks trong STOP intake: `go build ./...` exit 0; **sheet package race tests 4 pass/0 fail/0 skip**. Không có full PG/FE/browser revalidation ở intake này. Source presence/compiled/tested != toàn bộ AC đã pass. Chạy baseline gates phù hợp một lần sau preflight, giữ failures và sửa actual defects, không dùng việc tái kiểm làm lý do restart tất cả.

## 3. Consume R9 ngay trong cùng assignment

Instruction bắt buộc bao gồm nguyên phần này, với actual ZCode làm executor:

> Đọc và thực hiện addendum: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/handoffs/MC-P0-CLAUDE-CONSUME-DESIGN-R9-ADDENDUM.md`. Consume R9 final, xử lý error mapping theo từng operation rồi tiếp tục toàn bộ backend/API/frontend W1–W7 theo plan hiện tại. Không restart hoặc dừng sau design intake.

Verify final design pins:

- `docs/design/p0-handoff-r9/return.md`: 12,863 B, SHA-256 `d4dc769f1958f486a17a9a90fa5b1060de3172a2b07b544c6f1adff788b14b3d`.
- `docs/design/p0-handoff-r9/manifest.json`: 20,096 B, SHA-256 `2b68bc92431270dc456111590ca1de2231e2a10dba95829dccd0a3b68ba87563`; 102 payloads/992,101 B. Validate consumer files và reconcile actual current input trước dùng.

Giữ Enterprise Precision, Comfortable/Compact, EN/VI legal text, Lucide, existing Atomic primitives và business code `src/features/*`. Implement scoped draft/intent purge khi mất quyền, valid retention qua navigation/locale, independent promotion target/current guard/impact ack, context-preserving causal Back, truthful empty/denied/stale/unavailable/UNKNOWN states. Không copy prototype fixture actor/evaluator thành product enforcement.

Addendum's rev-6 wire observations là lịch sử; contract rev 9 đã có promotion và các W3–W5 routes. Reuse current source, không tạo duplicate endpoints hoặc chờ nonexistent wire dependency. Design packages/reviewer evidence read-only; không redesign/đổi tokens để né component gaps.

Giữ operation-specific errors: 428 missing precondition; 412 stale CAS; 409 explicit guarded domain rejection với reason/gates/alternatives/path phù hợp quyền; 422 key reuse; lost command answer UNKNOWN. Không đổi domain refusal thành generic concurrency/retry. Global design checker cấm mọi 409 là known check gap, không xóa 409 khỏi product để xanh. Ghi gap thật, không self-claim toàn bộ design suite pass.

## 4. W6 — hoàn thiện BỐN vertical slices ở cả BE/API/FE

Đầu tiên reconcile exact W6 contract trong cùng living file: operations, DTO presence/null, allowed fields/types/roles, preview vs mutation, row/group/run identity, CAS/receipt/reconciliation, canonical fingerprint, errors/provenance, limits và deterministic ordering. Routine compatible technical choices tự xử lý và test; không tự đổi approved business/privacy/retention/release policy. Dùng existing services/stores/codec, không framework mới.

### 4.1 Bulk

- Chỉ allowlist title, description, internal owner, due; không bulk execution/verification/access/membership hoặc hidden fields.
- Preview không mutation; commit từng row có authorization/CAS hiện hành và atomic mutation+audit. Valid independent rows có thể thành công trong khi stale/revoked row thất bại; không all-or-nothing whole selection khi approved semantics cho partial.
- Result đầy đủ success/failure/UNKNOWN theo exact submitted rows, scoped reasons và stable attempt identities. Known-success rows không resend khi recovery; nếu quyền mất, không lộ protected fields.
- **CAS không phải idempotency/receipt hoặc bằng chứng kết quả attempt cũ.** Claude's “bulk không receipt, retry nhờ CAS” chỉ là phương án chưa chốt. Thiết kế technical recovery phù hợp approved rules, giữ UNKNOWN khi chưa chứng minh outcome; không gọi một 412/readback/current value là proof của previous write. Không blind auto-retry hoặc fabricate rollback.
- FE chọn/preview/confirm/per-row progress/results/re-read/reconciliation có thật, không chỉ JSON endpoint. Test commit-race, revocation-after-preview, dropped body/response after commit và no duplicate effects; AC-133 vẫn 1 success/2 distinct failures, retry excludes proven success.

### 4.2 Import CSV/XLSX

- Reuse `SheetCodec`; decode text != domain validation. Preview/mapping kiểm types, dates/timezones, scoped references, missing fields, duplicate source keys và graph cycles, **zero writes**.
- RULE-014/AC-132: same source identity+row key+content returns existing outcome, không thêm records/audit; changed content conflicts và explicit reconciliation. Không fuzzy-merge names.
- Invalid dependency-connected group reject whole; valid independent groups có thể commit với per-row/group results. No orphan relations/partial invalid group; preserve requested graph and foreign-scope/authorization boundaries.
- Imported label VERIFIED là original claim awaiting independent review/current UNVERIFIED, không bypass verifier/epoch/criterion/version rules hoặc auto-create membership.
- Reject/effectively neutralize formula/macro/zip-bomb/unsupported structures theo explicit policy; không execute/fetch links. Có byte/expanded-size/cell/row limits declared as local inputs, not invented production capacity. Test adversarial payloads beyond codec happy-path; frontend mapping/preview/error groups/partial recovery dùng actual API.

### 4.3 Export

- Meaningful scoped XLSX/CSV chứa actual authorized business data, appropriate identities/states/owner/due/references và as-of/timezone/provenance; không mock template dump.
- Recheck quyền tại retrieval, protect downloads; formula-leading text là literal/string/escaped theo format, không executable spreadsheet formulas. No hidden records/counts/metadata leakage; proper EN/VI legal content/time handling.
- FE export action/download/filter/scope/empty/unavailable states, tests actual output cell values và denied/revoked paths.

### 4.4 Draft delta brief

- FR-019/RULE-016: choose Matter scope and `t1≤t2`; recorded changes **(t1,t2]** tách khỏi outstanding **at t2**, stable event ordering/references/source revisions, effective vs recorded times distinct, explicit no changes và draft provenance.
- AC-138: E1 at t1 excluded, E2 at t2 included; `t1=t2` changes empty nhưng outstanding vẫn riêng; invalid reversed window reject; inaccessible facts/counts không leak; same authorized source/window yields same business facts.
- **Chỉ cho t2=hiện tại chưa được PO phê duyệt.** Đừng âm thầm implement restriction từ stop return. P0 không yêu cầu retained issued-report artifact/managed immutable snapshots, nhưng điều đó không tự xóa approved as-of semantics.
- Kiểm event/history/source-revision model và implement technical solution tương thích để có facts đúng at t2. Không dùng current state giả làm historical outstanding. Nếu một historical case thật sự không thể đáp ứng, đưa một concrete gap/options/recommendation với impacted AC tới PO, giữ hàng đó open và làm tiếp phần độc lập; không tự giảm scope/claim full PASS.
- FE window/scope/preview/provenance/export/readback và errors thực; không report thành approved/issued legal conclusion.

Sau từng slice chạy focused meaningful tests và tự sửa rồi tiếp tục; không thêm external review gate giữa slices. Khi W6 coherent, version contract và actual coverage/checkpoint/return, rồi làm W7 ngay.

## 5. W7 — hoàn thiện phần còn thiếu, không chỉ chạy unit tests

- Đối chiếu toàn bộ **20 FR /63 AC /14 NFR /3 original GWs** với actual BE/API/FE/persistence/history/readback. W1–W5 “code-complete author-tested” không miễn residual gaps: W4 SIGNATURE/waiting coupling và Filing/Grid integration, W3 promotion clarity/object security limits, W5 freshness/as-of behavior phải đối chiếu requirements và xử lý relevant gaps, không mặc định waive hay mở rộng ngoài scope.
- Thực hiện AC-161/162/163 và full original workflow checkpoint ledgers (actors/rights, before/after five axes, exact proof/version/epoch, event/history, Grid/Control Room, delta/export). Golden workflow không thay bằng một test happy-path đơn lẻ; có alternative/reopen/partial/UNKNOWN/revocation/concurrency paths.
- Persistence/restart, actual isolated full restore của synthetic DB+objects+relations/history/source provenance, appropriate regression/security/load checks theo approved local inputs và full plan. Không dùng memory test thay PG/restore; không restore đè run DB. Missing production retention/encryption/malware/cloud policy không tự thành implemented/PASS.
- Rà actual docs/config/API catalogue: `apps/backend/docs/api.md`, `api.http`, operations/events/env examples và UI docs; rename/remove unneeded template `/dashboard`/`/tasks` sau caller check, không phá product routes chỉ vì tương tự tên template.
- Actual keyboard/touch/zoom/focus/visual/screen-reader/E2E nếu permitted; browser blocked thì ghi exact rows NOT_RUN/VERIFICATION_BLOCKED, không giả test bằng source/jsdom. AC-137 cần 5 manager thật theo approved protocol.
- Run final applicable backend/frontend/PG/integration checks và repair failures. Đưa ra một runnable local full-P0 candidate, không trả backend-only hoặc FE mocked/TODO.

## 6. Runtime và safety của takeover

Owned after acknowledgement: `apps/backend/`, `apps/frontend/`, existing task-owned `ops/p0-local/`, `docs/implementation/p0-zcode-execution/`. Preserve native/product migrations/composition, inward Go architecture/sqlc generation, Next/Atomic/features/auth patterns. Apply component skills/rules; no broad dependency upgrade or new abstraction without need.

Giữ selected local synthetic ZITADEL, server-side tokens/opaque browser session và strict issuer/audience/expiry/subject, `(iss,sub)` lookup-only, backend current Workspace/Matter/operation rights. Không provider switch, anonymous/shared-token fallback, ID-token-as-bearer, password/session trick hoặc weakening verifier để đóng login.

Owner-reported resources: `mc-p0-claude-pg` on loopback 55440, retained `mc-p0-claude-pgdata`, label `mc.task=MC-P0-CLAUDE-TAKEOVER`; separate native/product test fixtures và `mc_p0_run`; existing `mc-p0-idp-*`. Verify exact identity/ownership/DB trước reuse; no replay prepare/provision, credential reset, `down -v`, prune/delete unrelated data/volume. Native tests có destructive fixture operations, chỉ chạy disposable verified test DB, không product run DB. Use fresh isolated restore target và resource ledger.

Chỉ sử dụng private configuration đã nằm trong same synthetic assignment và cần để chạy tests/app: task PG env, API introspection key, synthetic user inputs và local app config qua process/private inputs. Không cat/print/hash/export secret contents, đọc bootstrap PAT/master/admin/system keys/unrelated credentials hoặc gửi credential-bearing evidence ra provider. Không real legal data trong logs/prompts/screenshots/Git.

ZITADEL effective redirect URI đang bị reject, audience user-token chưa xác minh: cần actual authorized admin/operator correction hoặc permitted login evidence; takeover không thêm admin-secret authority. Báo exact dependency một lần, giữ fail-closed, không cố mint human token bằng machine identity. Tiếp tục independent source/tests, không dừng cả assignment vì blocker này.

No browser permission bypass qua CLI/headless/alternate browser/server/export/native capture/settings. No stage/commit/scan retry/merge/push/deploy, hooks/security-baseline edit, unsupported Mimosa disposition hoặc context/host switch để né refusal. No change INT-A harness/evidence, MC-003A worktree, pinned design/reviewer records hoặc approved requirements. Production/Cloudflare/$0/cost/retention/release gates không đóng từ local tests.

## 7. Checkpoints và final return

Chạy baseline phù hợp sau preflight, gồm full `make check` với **đúng two disposable PG fixtures** vì sheet addition chưa đi qua full gate, và frontend `pnpm check`/build theo rules. Không ghi package skip như PG PASS. New behavior cần negative/recovery tests và actual raw receipts; nếu environment refuse, giữ error và continue unaffected work qua permitted tools, không bypass.

Mỗi attempt ghi actual command/argv/cwd/tool/version/start-end UTC/exit/redacted stdout/stderr/source hashes. Giữ Claude evidence với đúng actor; không relabel owner report thành execution của bạn. Focused checks sau edits, final combined suites khi ổn định, tránh rerun mọi thứ vô ích sau từng file.

Update one workboard/coverage/final-return có current owner/source/contract/design revision, code vs runtime vs independent acceptance. Context interruption thì checkpoint exact next action và resume cùng plan; không biến checkpoint thành final product hoặc hứa unsupported background completion.

Final output vẫn `docs/implementation/p0-zcode-execution/final-return.md`, kèm final working-source/diff/evidence manifests, complete feature/API/UI inventory và 20-FR/63-AC/14-NFR/3-GW outcomes, actual commands/logs/hashes/skips/blockers, reproducible local start/login/seed/run/test/stop/isolated restore và resource disposition. No new parallel execution plan/workboard.

Code còn thiếu → PARTIAL_IMPLEMENTATION. Code đủ nhưng mandatory execution blocked → IMPLEMENTED_WITH_VERIFICATION_BLOCKERS, exact rows. Full BE/API/FE và applicable author tests đạt/no known critical-high defect → FULL_P0_BE_FE_IMPLEMENTED_SELF_TESTED_PENDING_REVIEW. Không tự DONE/ACCEPTED/production-ready/MC-002/Step03B/release approval. Nonauthor final review vẫn bắt buộc và không chuyển cho author do đổi tool.

**Bắt đầu ngay: verify stop snapshot → acknowledge owner trong workboard → consume R9/current rev 9 → hoàn thiện W6 và W7 cùng residual P0 gaps. Không restart W0/W3 hoặc chỉ trả thêm planning pass.**
