# MATTERCONTROL — CLAUDE CODE: SỬA W1, TÍCH HỢP DESIGN VÀ HOÀN THÀNH TOÀN BỘ BACKEND + FRONTEND P0

Tôi là Product Owner. **Tiếp tục assignment MC-P0-CLAUDE-TAKEOVER / MC-P0-ZCODE-EXECUTION hiện tại**, với actual Claude Code làm execution owner của **cả backend và product frontend**. Dùng source đang có; sửa findings W1, hoàn thiện W1 rồi đi hết W2–W7, tự test/sửa và bàn giao **một candidate BE+API+FE tổng hợp** cho review cuối.

**Đây là giao việc implementation, không phải yêu cầu viết plan hay review-only. Không restart W0, không dừng sau ba bug fixes, một use case hoặc W1 để xin “tiếp tục”.** Waves chỉ là checkpoint nội bộ. Quota của OpenCode, design acceptance chưa xong, browser unavailable hoặc cấu hình IdP đang bị chặn không phải lý do ngừng mọi phần source độc lập. Giữ riêng blocker thật và tiếp tục mọi việc không phụ thuộc nó. Không thay đổi policy, bypass permissions hoặc tự đóng acceptance để đạt mục tiêu này.

## 1. Resume đúng source và ownership

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch `codex/unified-project-flow`.
HEAD đã kiểm tra `a62d838791ba188838c4ff00b7b6e265ac775056`.
Source đang uncommitted; HEAD không đại diện toàn bộ implementation.

Đọc root/component AGENTS, CLAUDE/rules applicable. RTK cho shell; Semble-first khi khám phá; Context7/current official docs cho library/framework/SDK/API/CLI cụ thể. Ghi actual tool/version/model, root/branch/HEAD và source checkpoint trước khi sửa. Không tự đổi account/provider/model, mua quota hoặc spawn thêm writer mặc định.

Đọc toàn bộ các input sau, đều relative với root trên:

1. `docs/implementation/tasks/MC-P0-CLAUDE-TAKEOVER.md` và `docs/implementation/handoffs/MC-P0-CLAUDE-TAKEOVER-COMPLETE-PLAN-PROMPT.md`. Prompt mới này cập nhật các câu starting-state/design/contract đã cũ; giữ nguyên toàn bộ phạm vi BE+FE và safety.
2. `docs/implementation/p0-zcode-end-to-end-execution-plan.md`, full-plan prompt liên quan và `docs/implementation/p0-zcode-execution/{workboard.json,local-contract.md,final-return.md,w1-implementation-notes.md,local-identity-approval.json}`.
3. `docs/reviews/p0-claude-w1-review-20261027.md`; actual reviewer probes/receipts trong `docs/testing/p0-claude-w1-review-20261027/`. Đây là ba findings đã tái hiện, không phải một báo cáo giả định.
4. `docs/reviews/p0-design-r9-intake-20261027.md`, `docs/reviews/p0-design-r9-recheck-20261027.md`, `docs/testing/p0-design-r9-recheck-20261027/receipt.json` và design input nói ở §4.
5. Approved `docs/requirements/`, permission matrix, state semantics, business rules, ba Golden Workflows, canonical `docs/product/project-atlas-dataset.md`, `docs/testing/p0-zcode-plan-20261026/coverage.json`, adopted/current contract candidates và source-import provenance.

Recheck source pins liên quan trước editing. Nếu có tiến độ hợp lệ sau receipt, reconcile đúng tác giả/checkpoint và dùng source mới; **không reset/stash/clean/rollback để ép hash về cũ**. Drift không giải thích được chỉ chặn đúng files/consumer bị ảnh hưởng. Một writer cho source được giao.

Dùng **chính workboard hiện có**. Append session/ownership và reconcile top-level owner/status/current_source_checkpoint với actual Claude progress; không xóa lịch sử ZCode hoặc tạo bộ workboard cạnh tranh. Chỉ ghi actual checks đã chạy; reviewer receipts không phải author execution mới của bạn.

## 2. Starting point đã xác minh — không làm lại phần này

- Contract hiện tại **revision 5**, 23,077 B, SHA-256 `377f7ae1758d302952e9a3417ac60dc1b88e94f9e976ed53588fd2586bd3f2c4`.
- `final-return.md`: 9,066 B, SHA-256 `ff3048918567d3adf3bc2168b763a5e89636e3775a123db2733ff45bb5fd21fd`; ghi **PARTIAL_IMPLEMENTATION**, W2–W7 NOT_STARTED.
- W1 đã có PG workspace store/shared contract suite, identity resolver/ZITADEL verifier, 17 product API routes/plain Echo composition/`cmd/mcapi`, BFF/OIDC/server-side sessions, product client và Workspace/Matter/Requirement FE slices.
- Đối chiếu takeover: 21 backend files đổi +17 mới; 5 frontend files đổi +55 mới; 544 source pins được reviewer kiểm tra lại không drift. Source tồn tại không có nghĩa W1 hoặc P0 đã accepted.
- Reviewer chạy Go build PASS; selected Go race tests tổng 201 test/subtest pass sau retry package verifier bằng normal permitted escalation; không chạy PG fixture/full `make check`. `pnpm check` PASS 24 files/180 tests. Frontend build reviewer bị Turbopack local port/process permission denial qua cả hai attempts; không phải evidence build PASS mới hoặc lỗi code đã kết luận.
- Human login/UI→BFF→Go→PG còn chưa xác minh. Return báo redirect URI của ZITADEL bị reject và user-token audience chưa chốt bằng real login. Không thay bằng machine identity để tự đóng E2E.

## 3. Sửa dứt điểm CW1-F01..03 trước khi mở rộng dependent UI

Đọc actual callers/tests trước thay đổi. Sửa shared root cause nhỏ nhất nhưng đầy đủ consumers, fixtures, config/docs và tests liên quan. Không chỉ đổi thông báo hoặc thêm test phản chiếu implementation.

**CW1-F01, P1 — UNKNOWN không đồng nghĩa safe retry cho mọi command.**

`src/lib/mc/action-result.ts` trả `retrySameKey: true` cho mọi UNKNOWN; `IntentForm` nói “Retry (safe to send again)”. Workspace/Matter membership grant/revoke không gửi Idempotency-Key và contract §2.1 không cấp receipt cho chúng.

- Phân biệt operation có receipt với operation chỉ CAS/audit tại shared client/action/organism seam; sửa cả grant và revoke, Workspace và Matter.
- Receipted creation: giữ đúng key + payload khi retry/read receipt, không silently tạo key mới.
- Nonreceipted membership UNKNOWN: giữ UNKNOWN, không blind resend; cần authorized re-read/rebase và một quyết định intent mới hợp lệ. Current state hoặc 412 không tự chứng minh kết quả attempt cũ.
- Nếu mất quyền đọc lại, purge protected values/intent phù hợp, chặn resend/download/export và không nói failed/rolled back. Giữ recovery của scope khác còn hợp lệ.
- Có regression kiểm actual submit/revoke affordance hoặc handler orchestration: ambiguous result không phát sinh mutation thứ hai chỉ bởi generic retry. Không thêm receipt policy mới cho membership để né finding.

**CW1-F02, P1 — mất response body của command vẫn có thể đã commit.**

`src/lib/mc/client.ts` gọi `res.text()` ngoài transport-error boundary. Reviewer fake POST nhận 201 headers rồi body stream throw: raw TypeError bị đổi thành generic error + “Please try again”.

- Bao phủ fetch, body consumption và unusable successful-command response bằng boundary phù hợp; transport loss sau command phải UNKNOWN, không giả định rollback. GET read failure là unavailable theo contract.
- Recovery phải dùng operation semantics của F01. Thử body-stream rejection, malformed/missing required successful-command payload và lost receipt; giữ exact safe-retry boundaries.
- Không blanket-map mọi exception thành cùng một lỗi hoặc retryable=true; không swallow programmer errors để tests xanh.

**CW1-F03, P2 — returnTo có thể thoát khỏi application origin.**

`src/lib/oidc/flow.ts:safeReturnTo` nhận slash + TAB + slash (`/\t/attacker.invalid` sau query decoding); callback dùng `new URL(returnTo, cfg.appOrigin)` dẫn sang external origin.

- Reject control characters/ambiguous slash-backslash forms; canonicalize với configured origin và enforce same-origin ở boundary lưu/sử dụng redirect. Giữ legitimate local route/query behavior và tránh login loops.
- Test TAB/CR/LF, protocol-relative/backslash/absolute forms, malformed values và normal in-app redirects. Không cần gửi request ra domain ngoài.
- Không claim token leak nếu chỉ chứng minh redirect; không làm yếu state/nonce/issuer/audience/PKCE checks.

Chạy regression liên quan, tự sửa đến khi pass, cập nhật findings disposition trong workboard rồi **đi tiếp W2–W7 trong cùng assignment**. Review này không tạo wave-approval gate mới.

## 4. Tích hợp design vào product, không chờ một vòng planning nữa

Dùng selected **Enterprise Precision**, causal hierarchy, Comfortable/Compact, EN/VI legal content và Lucide direction đã chọn. Reuse actual atoms/molecules/organisms/templates; business composition/state ở `src/features/*`. Giữ feature code Claude đã làm; không rename/rebuild chỉ vì handoff cũ còn ghi `features/session` hoặc tên ZCode.

**Trạng thái design thật tại preparation:** `docs/design/p0-handoff-r9/` gồm 27 file, tất cả byte-identical với lượt review trước. User báo phiên design đã xong, nhưng connector đọc bị `Transport closed`, nên chưa xác minh được export mới ngoài repo. R9 `return.md` vẫn copy R8; ledger cũ chưa có disposition mới. Không tự gọi “R9 accepted/completed” từ thông báo này.

Đọc `current-ux-spec.md`, `design-delta.md`, `zcode-handoff.md`, `screen-state-matrix.json`, `polish.css`, `prototype.html` và R7/R8/R9 reviews cùng approved semantics. Dùng phần source/spec đã reconcile làm implementation input; pending evidence là pending acceptance, không phải lý do bỏ P0 hoặc chờ vô hạn. Nếu có export mới, verify actual return/pins và integrate delta vào cùng checkpoint; đừng consume `.build/` hoặc file của phiên khác đang viết như final.

Chuyển các yêu cầu UX sau thành product behavior thật:

- SCR-01 session/access/Matter navigation và membership; SCR-02 Control Room; SCR-03 Grid/My Actions/Waiting On; SCR-04/05 typed record drawers; SCR-06 dependency/impact; SCR-07 proof context; SCR-08 documents/signatures; SCR-09 Filing; SCR-10 bulk; SCR-11 import; SCR-12 draft brief; SCR-13 scoped event history.
- Giữ form input qua navigation/locale/re-render khi identity/scope còn quyền; key theo actor/Workspace/Matter/document/intent đúng phạm vi. Revocation/logout/discard không cho draft hồi sinh. Không global-clear draft của scope không bị ảnh hưởng.
- Promotion có target version riêng, expected-current guard riêng, reason và impact acknowledgment gắn với đúng target/revision. Target/current/impact đổi phải invalidate acknowledgment cũ khi cần; stale guard không thành force-save; current-as-target là no-change.
- Causal navigation phải giữ selected record/origin/filter/trail: Back về proof khác Back về previous record. My Actions tách eligible/waiting/blocked/historical; không vẽ mọi assignment thành Next Action.
- Đủ loading/empty/no-match/denied/not-found/stale/unavailable/UNKNOWN và relevant expiry/revocation states; feedback giữ đúng backend truth, không unavailable→0/READY. Không chỉ match text để coi behavior pass.
- Precision ở hierarchy/spacing/type/density, responsive reading order, labels/focus/error association, long legal text, touch targets và reduced motion; không thêm decoration/icon library hoặc “readiness score” không có trong requirements.

R9 original mock suite mới exit 1; reviewer chứng minh textarea reason có trong restored markup nhưng mock không hydrate `.value`. Đây **không phải** bằng chứng browser làm mất draft. Không copy workaround sai HTML/mock behavior vào product; viết component/recovery tests đúng platform. Owner của design package sẽ hoàn thiện design tests/evidence; bạn không sửa `docs/design/p0-handoff-r*` của phiên đó.

Conflict xử lý theo approved requirements/rules → living contract thực dùng → reconciled design spec. Ví dụ: absent/null theo DTO contract, không theo một câu handoff nói ngược; wave dependency theo full execution plan (W3 proof, W4 Filing, W5 Control Room), không đổi thứ tự chỉ vì handoff cũ xếp khác. Kỹ thuật tương thích thì tự resolve và ghi rationale; material business/privacy/authority changes cần actual owner, không tự approve.

## 5. Đi hết scope BE + API + FE, không dừng sau W1

Mỗi slice có persisted behavior, API, real FE interaction/readback/history và negative/recovery tests. UI gọi thật qua BFF tới Go; prototype fixtures, persona selector hoặc client evaluator không được biến thành enforcement/demo fallback.

| Checkpoint | Backend/API cần hoàn thiện | Frontend cần hoàn thiện |
|---|---|---|
| W1 | Repair F01..03 consumers; finish auth/config/role/currentness/last-owner/CAS/history/receipt negatives; retain native API and separate product composition | Real session flow, Workspace/Matter admin/navigation, Requirement create/detail/history, correct unknown/revoked/stale recovery |
| W2 | Requirement/Action metadata/workstreams/parties/owner/due, transitions/waits, AND dependency graph, cycle/cross-Matter refusal/reblock, explicit milestones, five independent axes and deterministic Next/My Actions | Operational Grid, create/edit/detail, assignment/filter/sort/paging/selection, density/keyboard/mobile, causal blocker navigation and My Actions |
| W3 | Actual local stored bytes, scoped authorized reads, exact DocumentVersions/current promotion, per-version signatures, applicability/criteria/claims, independent assessment/dispute/expiry/reversal and derived impacts | Upload/version lineage/promotion/signatures/proof submission/review, exact subject/version/provenance, scoped denied/partial/error/recovery |
| W4 | Full approved Filing flow, immutable submitted versions, receipt/outcome observations, repeated request/response supplement cycles with exact binding, no-supplement/reject/withdraw/correction/reopen/proof epochs and complete authorized paging | Filing list/detail/package/timeline/cycle navigation, accountable waits, independent proof assessment and complete repeated-cycle views |
| W5 | Consistent scoped Control Room snapshots/as-of/causal reasons/gaps/changes, basic Decision/Finding/Risk/entity references | Connected blockers→Next Actions/Decisions→Waiting On→Milestones→Gaps→Changes, context-preserving drill-down and mobile triage |
| W6 | Four-field bulk allowlist with row-atomic outcomes/audit, CSV/XLSX preview/mapping/connected-group validation/commit/idempotency, meaningful formula-safe scoped XLSX export, deterministic recorded-time draft brief | Bulk preview/per-row results/UNKNOWN recovery, import mapping/errors/partial recovery, authorized downloads and brief window/provenance |
| W7 | Full contract/security/concurrency/restart/regression, isolated whole-product restore (DB + objects + relations/history), approved local workload measurements, complete docs/config/API catalogue | Finish every P0 route/action/state, replace unneeded template demo surfaces after checking callers, three actual Golden Workflows and applicable UX/integration checks |

Preserve approved rules: Requirement ≠ Action; five independent axes; waiting ≠ blocked; completed ≠ verified; submitter cannot self-verify; receipt ≠ approval; upstream reopen reblocks without erasing historical execution; filing reopen needs current proof epoch/outcome-evidence; VIEWER scoped export; assignment never grants access. No invented aggregate EXPIRED/cycle state, no substituted workflows or renumbered FR identities.

P0 target remains **20 FR / 63 AC / 14 NFR / 3 original Golden Workflows**. Record exact per-row implementation/test evidence in the existing workboard/coverage. Empty field/schema or stub route is not implemented capability. An endpoint with mock FE, or a finished screen with TODO persistence, is incomplete.

## 6. Auth and runtime blockers: isolate, never manufacture PASS

Keep PO-selected **local synthetic ZITADEL**, BFF server-side tokens/opaque session handle, exact introspection active/issuer/audience/expiry/subject and `(iss,sub)` lookup-only identity. Current product rights are checked in the authoritative backend transaction/read, not IdP admin roles or browser-supplied actor.

The current return reports redirect URI rejection and user-token audience uncertainty. Review public task-owned config/receipts and compatible app code. Do not read bootstrap PAT/master/admin keys, reset credentials, change account/provider, weaken audience/issuer checks, forge human identity or use a password-grant/session bypass to close E2E. If a verified operator change is needed, record one concrete bounded dependency with the exact intended config delta, no secret values. Continue W2–W7 source and permitted nonbrowser tests in the meantime. Do not repeatedly stop at this same blocker.

Use only private runtime inputs already permitted by the takeover profile, only when necessary for that synthetic profile, without printing/hashing/exporting secret contents. Never include legal data, live tokens, DSNs/passwords, private key bytes or credential-bearing evidence in Git/prompts/logs/screenshots/manifests. Do not read unrelated resources merely because they are nearby.

Existing task-owned PG/IdP resources must be identity-verified before reuse; do not replay provisioning from a historical NOT_PROVISIONED sentence. Separate native/product test fixtures and migrations: native tests may truncate/drop. Keep current run DB distinct from disposable fixtures. No deletion/prune/down-with-volumes or mutation of existing unrelated DB/volumes. New isolated fixtures/restore targets remain local-only and synthetic under the existing full-plan scope, with resource ledger and bounded lifecycle; no new paid/cloud/production resource.

Browser permissions remain a real boundary. If disabled/unavailable, do not bypass through another browser/CLI/server/OS screenshot/export; implement source and permitted tests, mark dependent rows VERIFICATION_BLOCKED. Standard command restrictions may be addressed only through the tool's normal approval route, never alternate context/host/disabled guard. Build failures caused by environment restrictions are retained, not rewritten as PASS or automatically treated as code bugs.

## 7. Implementation discipline and final verification

Owned paths remain `apps/backend/`, `apps/frontend/`, existing task-owned `ops/p0-local/` and `docs/implementation/p0-zcode-execution/`. Design outputs, INT-A harness/evidence, MC-003A worktree and immutable baseline/security records are read-only/out of this assignment. Preserve other writers. No stage/commit/push/merge/deploy, new equivalent scan/commit retry, hook/security baseline edit or Mimosa bypass. This prompt has no such authority.

Use existing helpers/service/store/Atomic patterns, standard library then installed dependencies. No broad rewrite/framework upgrade/new abstraction for its own sake. Generated SQL stays generated by pinned tooling. Evolve shared contract with revision/hash when needed and update producer, consumer, config/docs/tests together; do not silently add policy or approve your own architecture deviation.

Run focused meaningful tests after each behavior change; once stable, run combined applicable suites. Backend `make check`/race suites with verified separate native/product PG fixtures; report test-level skips distinctly from packages with no tests. Frontend `pnpm check`, `pnpm build`, applicable story/build-storybook/integration checks under component rules. Test unauthorized/revoked/foreign-scope/last-owner/concurrency/replay/UNKNOWN/truncated-response and persistence/restart paths, not happy paths alone.

Local performance/load/restore use approved trial inputs and declared synthetic configuration; no invented production retention/capacity/RPO/RTO guarantees. AC-137 requires actual five representative managers and ≥4/5 within 10 seconds; no simulated participant pass. Keyboard/touch/zoom/screen-reader/visual testing requires actual permitted execution. Static/mock/API tests alone cannot close those rows.

Every actual receipt needs command/argv, cwd, tool/version, UTC, exit, source revision, redacted stdout/stderr and output hashes. Do not cite an author's summary as raw execution. Retain failed attempts and explain supersession; final snapshot must identify uncommitted source as well as HEAD. Update operations/config/API docs so a reviewer can reproduce without reverse-engineering source.

## 8. One final consolidated return, with honest completion status

Continue until all permitted implementation and tests are complete. If context/time limits interrupt, save exact checkpoint/resume action/source pins in the single workboard; do not call that checkpoint the completed assignment or promise unsupported background work. On resume continue from it.

Final `docs/implementation/p0-zcode-execution/final-return.md` must include:

- Actual Claude identity/tool/model and historical ZCode attribution; root/branch/HEAD, starting and final source manifests/diff, exact contract/design inputs and still-pending design findings.
- 20-FR feature/API/UI/persistence inventory, all 63 AC/14 NFR expected vs actual/evidence, three original GW checkpoint ledgers including negative/recovery paths.
- CW1-F01..03 correction evidence; backend/FE/PG/auth/integration/recovery/load checks, exact skips/blockers, commands/exits/log hashes. No repeated final review request after each wave.
- Runnable local setup/migrate/seed/login/start/test/stop/isolated-restore instructions; owned-resource disposition; known defects, unresolved IdP/browser/human-study/security/production/Cloudflare/cost/recovery acceptance items.

Statuses: missing code → `PARTIAL_IMPLEMENTATION`/IN_PROGRESS with exact remaining work; complete code but mandatory verification unavailable → `IMPLEMENTED_WITH_VERIFICATION_BLOCKERS`; full BE+FE and applicable author tests pass with no known critical/high defects → `FULL_P0_BE_FE_IMPLEMENTED_SELF_TESTED_PENDING_REVIEW`. Do not count speculative/unrun results as pass or silently drop a requirement to claim full delivery. No author-issued DONE/ACCEPTED/production-ready/MC-002 closure/Step03B or release approval.

**Bắt đầu ngay từ source W1 hiện tại: sửa ba findings, tích hợp design tương thích, tự test/sửa rồi tiếp tục hoàn thiện W2–W7 cho cả backend và frontend. Mục tiêu là một sản phẩm local P0 có thể bàn giao chạy thử, không phải thêm một plan hay một báo cáo dừng ở W1.**
