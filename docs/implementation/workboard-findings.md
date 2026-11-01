# P0 Findings & Decisions Register (CO-01) — nguồn chân lý duy nhất

- Người tạo: actual ZCode (coordinator, theo PO 2026-10-31 "zcode thực hiện hết"). Cập nhật: 2026-10-31 ~16:45Z.
- Trạng thái: `OPEN → FIX_IN_PROGRESS → FIXED_PENDING_VERIFY → CLOSED_VERIFIED` (hoặc `WONTFIX_PO`, `BLOCKED:<lý do>`).
- Mỗi thay đổi state phải ghi evidence path + date. Independent verification = OpenCode trừ khi PO chỉ định reviewer khác; **ZCode không tự verify code của ZCode**.

## 0. Decision record — PO phê duyệt 2026-10-31 (AskUserQuestion, 4/4 mục)

| # | Quyết định | Trạng thái | Hệ quả |
|---|---|---|---|
| DEC-20261031-01 | **Commit/re-pin candidate** kèm known-defects register | RATIFIED | CO-03: freeze → commit baseline → re-pin. Commit/push chỉ commit cục bộ theo scope này; push chờ PO riêng. **Contingency nếu Mimosa git-gate chặn commit của agent: playbook `docs/implementation/plans/MC-MIMOSA-GATE-COMMIT-PLAYBOOK-20261031.md` — đường khuyến nghị = PO tự commit trong Terminal (gate chỉ chặn agent Bash, đã xác minh không có native git hook).** |
| DEC-20261031-02 | **D-9 purpose-typing criterion** (package/signature) — state-semantics amendment | RATIFIED | Mở khoá fix Z-F-01/02. Doc amendment đi cùng code change. |
| DEC-20261031-03 | **D-2 cookie locale** server-readable | RATIFIED | Mở khoá fix UX-L-02. |
| DEC-20261031-04 | **D-1(b)** đóng gói env walkthrough stub-IdP + backend (BA r2 pattern) thay vì demo fixtures frontend | RATIFIED | CO-17 scope thu hẹp. |

Còn CHỜ PO — **BATCH #2 (khuyến nghị coordinator kèm sẵn, PO chỉ cần duyệt/từ chối từng dòng):**

| # | Quyết định | Khuyến nghị coordinator | Thời điểm |
|---|---|---|---|
| R1 | D1 ingress | ENDORSE packet: giữ public + application auth cho synthetic pilot; IAM asymmetry ghi dokument | Ngay |
| R2 | D2 "$0" | ENDORSE: "alerts fire trước khi mất tiền", không phải "không thể mất tiền" | Ngay |
| R3 | D3 residency | ENDORSE: chấp nhận cho synthetic pilot; HARD GATE trước dữ liệu thật | Ngay |
| R4 | D4/B3 rate quota | ENDORSE: chấp nhận rủi ro pilot đã ghi; limiter build SAU staging smoke, bắt buộc trước dữ liệu thật | Ngay (quyết định); build sau |
| R5 | D5 B7 receipt retention | ENDORSE: giữ DISABLED đến khi có số TB-06 | Ngay |
| R6 | D6 OpenNext adapter | ENDORSE: chấp nhận 1.20.14 (build + local runtime đã có evidence) | Ngay |
| R7 | D7 workload numbers (maxScale 3, concurrency 10/20, **5 MiB ceiling** = trùng D-7 của UX plan) | ENDORSE: adopt defaults cho pilot, re-measure rồi chốt | Ngay |
| R8 | **6 PROVIDER case + 24 FINAL**: mở provider qualification wave | KHUYẾN NGHỊ: duyệt CÓ ĐIỀU KIỆN — staging-only, cost-capped, sau khi fix-wave return + OpenCode verify; thứ tự: CI thật (free) → 1 smoke nhỏ nhất (Cloud Run min-instances 0) → IAM negative tests → 24 FINAL case. Từ chối = goal "sẵn sàng deploy" giữ trạng thái điều kiện vĩnh viễn | Sau CO-14 |
| R9 | D8 release SHA | Baseline `4b6a65f` đã commit; release SHA = commit sau fix-wave + verify (không quyết bây giờ) | Sau verify |
| R10 | D-3 thuật ngữ (UX) | Matter="Hồ sơ" (giữ), Action="Hành động", Filing="Hồ sơ khai", role badge vi — theo glossary | CO-18 |
| R11 | Usability trials | Lịch tuần 2–3, sau locale-fix landed + walkthrough env | Lịch |

(PO duyệt batch #2 → mọi cổng còn lại là thi hành; coordinator sẽ ghi state từng dòng vào register.)

## 1. Defects & gaps (code)
| ID | Mức | Tóm tắt | State | Evidence | Fix assignment |
|---|---|---|---|---|---|
| Z-F-01 | P2 DEFECT | Filing proof-required nộp được package rỗng (guard purpose-blind) | **REWORK_REQUIRED (backend PASS, UI blocked)** — OpenCode 2026-11-01T00:59Z trên `72266cb`/`dac4262`: red-green PASS (domain+service+postgres 46.5s; B1 -race exit 0) nhưng UI không tạo/parse được SIGNATURE → OV-F1-01 P1; (trước: fix-wave r1 D-9 purpose-typing, guard PACKAGE-only) | mc-p1-fix-wave-20261031-r1/f1-structural-prereview-opencode.md + commands/verify-F1-* | Fix-wave FE |
| Z-F-02 | P2 GAP | Không criterion-kind signature; gate chữ ký nhận bất kỳ criterion | **REWORK_REQUIRED (backend PASS, UI blocked)** — OpenCode 2026-11-01T00:59Z trên `72266cb`: PurposeSignature + declared/satisfied guard đúng, OWNER waivers giữ; thiếu UI purpose + replay mapping → OV-F1-01/02 | như trên | Fix-wave FE/BE |
| Z-F-03 | P2 GAP | `outcomeVerification: NOT_DECLARED` không lộ Grid/Control Room | **FIXED_PENDING_VERIFY** (fix-wave r1: WorkItemView.OutcomeVerification trên ListWorkItems+BuildControlRoom, `derived.outcomeVerification`, FE per-axis badge; domain+HTTP+FE tests) | như trên (f2 patch) | OpenCode verify CO-14 |
| **OV-F1-01** | **P1** | D-9 không dùng được qua UI: `schemas.ts` L98/L231 zod enum thiếu SIGNATURE → checklist có SIGNATURE fail parse/proof view không load; form chỉ gửi PACKAGE/OUTCOME + `proof-panel` L297/321/624 lọc/ẩn SIGNATURE → filing proof-required bị `signature-criteria-required` chặn nộp, UI không có cách khắc phục | **OPEN** (OpenCode trên `72266cb`/`dac4262`) | mc-p1-fix-wave-20261031-r1/f1-structural-prereview-opencode.md + commands/verify-F1-committed-redgreen/ | Fix-wave FE |
| **OV-F1-02** | **P2** | `brief_proof.go` L217 `purposeOf` map SIGNATURE→PACKAGE khi replay → brief proof sai trục + tăng package count; không test replay | **OPEN** (OpenCode `72266cb`) | như trên | Fix-wave BE |
| **OV-F1-03** | **P2** | Migration 0011 Down không data-safe: re-add CHECK 2 giá trị khi còn row SIGNATURE → lỗi 23514 (đã repro); cần map/backfill hoặc precondition | **OPEN** (OpenCode `72266cb`) | như trên + commands/verify-F1-migration-down-probe/ | Fix-wave |
| **OV-F1-04** | **P3** | (a) refusal không nêu cả package+signature khi thiếu cả hai; (b) gate áp cả `StageResponse` (xác nhận chủ đích); (c) không test 0011 Up/Down (migration test dừng 0009) | **OPEN** (OpenCode `72266cb`) | như trên | Fix-wave (tuỳ chọn) |
| UX-L-01 | Blocker | `/workspaces` title "Matters/Hồ sơ" (workspaces/page.tsx:15,21) | **FIXED_PENDING_VERIFY** (fix-wave r1: title/H1/metadata "Workspaces/Không gian làm việc" + generateMetadata 4 param page) | như trên + probe 22/22 | OpenCode verify |
| UX-L-02 | Blocker | Locale kẹt EN máy chủ; `lang`=vi–text en (WCAG 3.1.2) | **FIXED_PENDING_VERIFY** (fix-wave r1: D-2 cookie ui-locale server-readable, root-shell per-request lang, LocaleProvider no-flip; **probe 22/22 lang=vi+vi strings+h1 t=0 trên prod build**; node/worker build split qua root-shell + resolveAlias) | như trên (f4 patch + design note + commands/probe-22-routes.log) | OpenCode verify |
| UX-L-04 | Major | Trộn ngôn ngữ trong component (ReadFailure, login, ~21 literal) | **FIXED_PENDING_VERIFY** (fix-wave r1: ReadFailure 2 literal + error.tsx + proof-panel + document-forms + filing-forms + planning-view + rejection-details + document detail; SearchPicker đã localize sẵn trong source từ trước) | như trên (f5 patch) | OpenCode verify |
| UX-L-05 | Major | Fail-state mất context (h1 null, mất tabs, 16 route) | **FIXED_PENDING_VERIFY** (fix-wave r1: ReadFailure heading prop; MatterScope fail/sign-in giữ breadcrumb+h1 không stale label; workspace+requirement detail thêm heading sau probe; tabs giữ khi matter read OK — cấu trúc layout sẵn có) | như trên + probe (h1 trên 22/22) | OpenCode verify |
| UX-L-06 | Major | Storybook crash từng phần (TypeError useRouter) | **FIXED_PENDING_VERIFY** (fix-wave r1: navigation mock qua .storybook/navigation-mock.ts + viteFinal alias; GlassSurface stories 2 theme; build-storybook exit 0, 60 stories; CI đã có sẵn step này) | như trên (f6 patch) | OpenCode verify |
| **F8 (addendum relay P-09 aria-live)** | Major→Pha 1 (OpenDesign CO-15) | aria-live cho work-grid/planning/search-picker | **NOT_EXECUTED in fix-wave r1** — relay tới sau khi prompt wave (F1..F7) đã dispatch; cần coordinator mở rộng scope hoặc đưa verify-wave/backlog | opendesign-ux-plan-review-20261101-r1/ | Coordinator quyết |
| UX-L-03 | Blocker enablement | Không có đường populated chuẩn | CLOSED_BY_DECISION (D-1(b) ✓ — CO-17 đóng gói) | — | CO-17 |
| UX-L-07..11 | Minor/Polish | metadata; aria-live; border 3:1; dev-streaming (prod NOT_VERIFIED); dev-tools bubble | OPEN (xếp sau wave) | uiux...r1 | Backlog |
| PI-01..04 | P2/P2/P1/P3 | TTL 30s; SA tách; preflight/CI; erratum | FIXED_PENDING_VERIFY | deploy-readiness WP-1/4/5/8 | OpenCode CO-14 |
| r1 P3 ×7, r2 P3 ×4 | P3 | xem findings.md của từng attempt | OPEN (adjudicate tại intake) | từng namespace | — |
| **OV-R13-01** | **P2 (deploy-blocker đến khi sửa)** | `ops/deploy/cloud-run/migrate-job.yaml` **fail YAML parse (indent)** — job migration sẽ không deploy được; 5/6 yaml khác PASS | **CLOSED_VERIFIED** (OpenCode V2-1 leg-2: 6/6 YAML PASS trên HEAD `bb54d6e` tại 2026-10-31T17:47Z; fix `6b0c358` = indent 10→6, đúng phạm vi) | opencode-verify-wave-20261031-r1/commands/verify-R13-yaml-structure/ + verify-V2-1-yaml-structure/ + mc-enablement-minifix-20261101-r1/commands/ | — |
| OV-R14 | INFO/CLEAN | Secrets scan 509 file CLEAN — mọi hit classify synthetic fixture có basis (mattercontrol:mattercontrol trong CI yml author = fixture; `***` = author scrub; `<redacted>` = vết stdout run cũ) | CLOSED_VERIFIED (OpenCode) | verify-wave commands (R14) | — |
| OV-R15 | INFO/CLEAN | No-overclaim scan: mọi "DONE" là task-level/negative; author không claim independent PASS — ngôn ngữ kỷ luật | CLOSED_VERIFIED (OpenCode) | verify-wave R15 | — |
| **OV-R12-01** | **P2** | `ops/backup/scheduled-dump.sh` L51: vòng prune quoted `$(ls -1t …)` → **no-op khi ≥2 archive cũ** (rm nhận 1 "filename" nhiều dòng, fail im lặng, JSON vẫn báo `pruned`); thư mục rỗng cũng báo `pruned:1` sai (`rm -f ""` rc=0). Trái contract "keep newest N"; R12 đúng quy trình 3×/RETAIN=2 vẫn PASS end-state (2 archive) | **OPEN** (OpenCode leg-2 2026-11-01T00:49Z trên `bb54d6e`; repro: 4 cũ + 1 mới → còn 5 dump, `pruned:1`; empty-dir → `pruned:1`) | opencode-verify-wave-20261031-r1/r12-scheduled-dump-retention.md + commands/verify-R12-scheduled-dump-3x/ + verify-R12-multistale-probe/ | Fix-wave (ops script) |
| **OV-R8-01** | **P1 (release gate)** | `apps/frontend/scripts/release-preflight.mjs`: `probeFactory(read)` cần `read` trả **string** nhưng cả 2 callback trong `main()` trả **object probe** → (a) content sentinel (PEM block / `MC-RELEASE-SENTINEL`) **không bao giờ match** (false clean), (b) gặp file `.env*`/`.dev.vars`/`*.pem` → uncaught `TypeError` (vẫn exit 1 nhưng 0 finding, mất mọi finding khác). Unit test chỉ gọi `scanFiles` với probe dựng tay nên xanh | **OPEN** (OpenCode R8 2026-11-01T~00:55Z trên `bb54d6e`: sentinel + PEM trong `.txt` → clean exit 0; `.env.local` → crash; value plant 0 lần xuất hiện) | opencode-verify-wave-20261031-r1/r8-release-preflight-plant.md + commands/verify-R8-preflight-plant/ + verify-R8-isolate/ | Fix-wave (frontend script + integration test) |
| **US-R-01** | P2 GAP | Stub IdP walkthrough **chưa có trang login browser/authorize HTML** (chỉ /introspect machine-token) + phải chấp nhận redirect_uri của frontend trial → participant không vào được UI | OPEN (coordinator grep xác nhận 2026-11-01: 0 hit login/html/authorize trong ops/local/walkthrough/) | usability-prep-20261101-r1/return.md | Enablement follow-up — chặn session trial E-2 |
| **US-R-02** | P2 GAP | **Fault-injection cho T10 chưa tồn tại** — phiên A không chạy được chân khôi phục (OUTCOME_UNKNOWN live) | OPEN (probe coordinator không kết luận — grep dính "default"; cần receipt thật) | usability-prep-20261101-r1/return.md | Enablement follow-up — chặn phiên A |
| US-PREP | docs | Usability prep 6 file (scripts/forms/metrics/logistics/dataset) | **AMEND** (OpenCode V2-3 2026-10-31T17:52Z — 5 mục cụ thể A-1..A-5; không REJECT, cấu trúc tổng thể chặt) | opencode-verify-wave-20261031-r1/v2-3-usability-prep-review.md + usability-prep-20261101-r1/ | Author sửa A-1..A-5 → OpenCode re-review diff |
| **CO-17** | work item | Walkthrough scripts up/mint-token/down + stub IdP + smoke | **DONE → CLOSED_VERIFIED** (OpenCode V2-2 độc lập 2026-10-31T17:48Z từ pin `bb54d6e`: up exit-0, 4/4 mốc chuẩn, down sạch, orphan-check exit-code-based 0 listener/0 process/0 container; README↔thực tế 0 drift — opencode-verify-wave-20261031-r1/commands/verify-V2-2-*); M3 runbook erratum pooler **DONE (commit `bb54d6e`** — Nano/Free = 200 pooler clients, verify docs chính thức 2026-11-01**)** | mc-enablement-minifix-20261101-r1/commands/ | — |
| **CO-15** | work item | OpenDesign UX plan review (UX owner) | **DONE — REVIEW_RETURNED**: 11 AGREE / 3 AMEND (P-02 effort M–L→**L**; P-03 scope thu hẹp theo D-1(b), effort L→**M**, AC mới = "pnpm dev + documented env → workbench 3 matter"; P-06 tách 2 bước — sweep EN literals ngay, nhãn vi sau R10) / 1 REPRIORITISE (**P-09 aria-live Pha 3→Pha 1**, WCAG 4.1.3 — relay fix-wave như **F8 addendum**) / **D-3 CHỐT** (`terminology-final.md` — Matter="Hồ sơ", Filing="Hồ sơ khai"/badge "Khai", Action="Hành động", roles vi; 3 amendments: Approval="Chấp thuận", As-of="Dữ liệu tại", badge "Khai") + UX copy vi/en cho guard Z-F (aria-live polite, gộp vi phạm đồng thời) + checklist populated-UI V-01..V-14 | opendesign-ux-plan-review-20261101-r1/ | P-09 → fix-wave relay F8; D-3 áp nhãn vi sau PO ratify R10 |
| **P-03** | Blocker enablement | Không có đường populated chuẩn | **GẦN ĐÓNG**: env + scripts + docs DONE (CO-17); còn UI-entry = US-R-01/02 (U1/U2 session) | walkthrough-env.md + ops/local/walkthrough/ | US-fix session |

## 2. Verify-wave checklist (OpenCode — sau commit Pha 1)
15-case deploy packet · PORT-02/03/04/05/10/11 + TTL 30s rerun · Z-F-01/02 repro r2 trên byte mới · locale probe reproduce · B1 sync-guard non-author eyes.

## 2b. Fix-wave return + COMMIT ADJUDICATION (coordinator, 2026-11-01 ~00:50Z)

- **Wave result**: F1..F6 patch + F7 gates toàn xanh (make check PG+race 14pk, vitest 830/0, durable 14/14, node 29/29, worker, storybook 60 stories, SuiteGW 8/8, probe 22/22 vi t=0). Register: FIXED_PENDING_VERIFY ×8. Điểm kỹ thuật mới: **root-shell split** (node/worker + resolveAlias) — OpenCode phải verify adjacency PI-02/03.
- **Gate block adjudicated**: Mimosa chặn commit fix deltas — scan project-wide bắt "6 high sql-injection" tại handlers.go/evidence_handlers.go = **pre-existing baseline code, ngoài diff wave**; independent SQL review 2026-10-29 (ZCode exhaustive): PASS, 100% sqlc-parameterized, không injection; không có disposition interface (tiền lệ BE-01-R1). **Quyết định: playbook B3 kích hoạt — PO tự commit trong Terminal** (sheet cập nhật cho fix deltas bên dưới). Không bypass, không đụng plugin. Sau commit: OpenCode leg-2 re-pin HEAD mới → verdicts Z-F/locale bind được.
- **F8 (aria-live) adjudicated**: fix-wave đã đóng → **QUEUED: mini-fix đầu tiên sau commit PO** (gộp với findings leg-2 nếu có) — không mở lại fix-wave.
- **Commit sheet (fix deltas — PO dán; KHÔNG add namespace verify-wave đang sống):**
  ```sh
  cd /Users/nguyenvanlan/Documents/code/pet-projects/matter-control
  git add apps/ docs/requirements/ docs/testing/mc-p1-fix-wave-20261031-r1/ \
          docs/implementation/workboard-findings.md docs/implementation/tasks/ \
          docs/ai-sdlc/project-status.md
  git commit -m "Fix wave F1-F6: D-9 purpose-typing guards (Z-F-01/02), outcome verification surfaced (Z-F-03), workspaces title+metadata (UX-L-01), locale cookie server-readable (UX-L-02), ReadFailure context + i18n sweep (UX-L-04/05), Storybook mock + GlassSurface stories (UX-L-06); gates green (PG+race, vitest 830/0, durable 14/14, probe 22/22) — register FIXED_PENDING_VERIFY, OpenCode verify next (DEC-20261031-01)"
  git log -1 --format='%H'
  ```
  (verify-wave namespace `docs/testing/opencode-verify-wave-20261031-r1/` để nguyên — owner commit khi wave đóng.)

## 3. Runtime/teardown ledger
| Runtime | Trạng thái | Ghi chú |
|---|---|---|
| :3000 next-server PID 171 | LIVE (Codex) | không đụng; đã tự hồi phục css-3000 |
| :8080 ZITADEL docker | LIVE | không đụng |
| 28719/28720/28721 (deploy-readiness PG/rehearsal) | LIVE | giữ cho reviewer |
| 28550 (OpenCode QA PG) | LIVE | giữ |
| 15499 / 18099 / 18081 / **18082** | STOPPED | 18082 orphan do coordinator stop 2026-10-31 (CO-02, PO "thực hiện hết") |
| mc-p1-fix-wave-pg (container PG nhãn wave) | **DELETED** | fix-wave dùng cho make check + durable 14/14, xoá sau gates 2026-11-01 |
| next start 18923/18924 (fix-wave probe) | **STOPPED** | prod-build probe server, tắt sau probe 22/22 |
| mcapi @8081 | KHÔNG TỒN TẠI từ fix-wave | fix-wave r1 KHÔNG chạy mcapi nào (sửa attribution dòng trước: không phải runtime của wave này) |

## 4. CO-03 milestone — BASELINE COMMITTED (2026-10-31 ~16:47Z)
- **HEAD `4b6a65f`** "P0 local candidate baseline @0de3e5d+dirty, known defects Z-F-01/02 + PI-01..04 pending verify" — toàn bộ dirty tree 211 entry đã pin; dirty còn 2 (WIP fix-wave). **Mimosa git-gate KHÔNG chặn** ở ngữ cảnh này (rủi ro playbook không cần kích hoạt; playbook giữ lại cho tương lai).
- Hệ quả: OpenCode verify wave giờ chạy được trên byte pin; mọi verdict mới hợp lệ. Nếu OpenCode verify đã chạy TRƯỚC commit → rerun trên `4b6a65f`.
- **Update 2026-11-01 ~17:00Z**: OpenCode verify wave **đã tự re-pin vào `4b6a65f` (5706 blobs, 0 drift)** → verdicts bind vào commit bytes, **CO-14 rerun KHÔNG cần**; 6 verify namespaces đang chạy: R1-config-tests, R7-renderer-tests, R9-action-refs, R13-yaml-structure (→ OV-R13-01 FAIL thật), R14-secret-sweep (CLEAN), R15-claims-audit (no-overclaim). PORT-02/03/04/05/10/11 + TTL-30s rerun đã unblocked và đang chạy. Commit `5e932bd` (register+playbook) do coordinator-playbook session — KHÔNG phải fix-wave (sửa lại attribution trước đó của coordinator).
- Fix-wave F1 đang lộ trên tree: `0011_criterion_purpose_signature.sql` + `criterion_purpose_migration_test.go` (Z-F-01/02 purpose-typing theo D-9) — dirty 6 file apps/backend, các path rời nhau, không xung đột writer.
- **Update 2026-11-01 ~17:40Z (minifix session)**: MC-ZCODE-ENABLEMENT-MINIFIX-20261101 hoàn tất 3/3 — M1 `6b0c358` (OV-R13-01 → FIXED_PENDING_VERIFY, chờ OpenCode rerun trong wave), M2 `ed23be3` (CO-17 DONE: scripts + stub IdP + smoke 4/4 readyz-200/401/200/401, teardown sạch), M3 `bb54d6e` (runbook erratum pooler). Orphan 18082 xác nhận FREE (khớp ledger). US-R-01 (browser login/authorize cho stub IdP) còn mở — enablement follow-up, chặn trial E-2. Session không đụng apps/** và không để runtime nào lại (walkthrough đã teardown).
- **Update 2026-11-01 ~17:55Z (opencode wave leg 2)**: V2-1 PASS 6/6 → **OV-R13-01 CLOSED_VERIFIED**; V2-2 PASS toàn màn → **CO-17 CLOSED_VERIFIED** (0 drift README↔thực tế); R9 PASS 6/6 action pin = tag target chính xác (GPG-verified; webfetch API, cột `summary-final.json`); V2-3 → **US-PREP AMEND** (5 mục, review doc trong wave namespace). Leg-1 backlog tiếp: PORT/TTL rerun + PG batch + R8 + F1 pre-review. Verdicts bind HEAD `bb54d6e` tại thời điểm chốt.
- **Update 2026-11-01 ~00:50Z (opencode wave leg 2, R12)**: R12 đúng quy trình packet (3× RETAIN=2) **PASS** — end-state đúng 2 archive + 2 sidecar, 41 TABLE DATA/archive, sha256 khớp. Repro thêm phát hiện **OV-R12-01 (P2, OPEN)**: prune L51 no-op khi ≥2 archive cũ (4 cũ + 1 mới → còn 5, JSON `pruned:1`) và `pruned:1` sai khi thư mục rỗng; trái contract keep-N, có thể làm đầy đĩa backup location. Evidence: `opencode-verify-wave-20261031-r1/r12-scheduled-dump-retention.md`. Không sửa source.
- **Update 2026-11-01 ~00:55Z (opencode wave leg 2, R8)**: R8 **FAIL** — **OV-R8-01 (P1, OPEN)**: `release-preflight.mjs` content scan chết (probe callback trả object thay vì string) → PEM block + `MC-RELEASE-SENTINEL` trong file tên thường **pass clean exit 0**; plant `.env.local` gây uncaught `TypeError` (exit 1 nhưng không in finding nào). Value plant không xuất hiện trong log (đúng). Evidence: `r8-release-preflight-plant.md` + `commands/verify-R8-*`. Đây là release gate nên cần fix-wave trước deploy.
- **Update 2026-11-01 ~01:00Z (opencode wave leg 2, F1/R11)**: fix-wave đã commit `dac4262` (HEAD `72266cb`) → re-anchor F1: backend D-9 **PASS** trên byte commit (domain+service+postgres 46.5s; B1 `-race` exit 0) nhưng **REWORK_REQUIRED** — **OV-F1-01 (P1)**: UI zod `purpose` enum thiếu SIGNATURE + form/filters không hỗ trợ → filing proof-required bị `signature-criteria-required` chặn nộp qua UI, checklist có SIGNATURE fail parse; **OV-F1-02 (P2)**: `brief_proof.go purposeOf` replay map SIGNATURE→PACKAGE; **OV-F1-03 (P2)**: migration 0011 Down fail khi còn row SIGNATURE (repro 23514); OV-F1-04 (P3). R11 **PASS**: 7/7 verdict khớp author (census/objects/marker/readback/restart/refusals/missing), số đo khác như dự kiến, 2 container riêng đã xoá. Không DONE.

## 5. Pooler verification (đóng gap WP-8 / deploy-ready)
- **Supavisor max client connections = 200 trên Nano-tier** (Supabase docs chính thức "Connection pooling and limits" — URL lúc WP-8 bị 404, giờ xác nhận: https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits); limits scale theo compute tier; transaction mode cho serverless; direct ~60 vẫn áp cho upstream.
- Kết luận connection budget của runbook §1 (peak ~72–102 < 200): **XÁC NHẬN, không cần MC_DB_MAX_CONNS** — caveat ghi rõ "Nano-tier; re-check nếu tier khác". Fix-wave/reviewer fold thành erratum vào `docs/deployment/pilot-deploy-runbook.md` §1.

## 6. COMMIT EXECUTED — playbook B3 thành công (2026-11-01 ~00:52Z)
- **HEAD `dac4262`** "Fix wave F1-F6…" — PO tự commit Terminal theo sheet §2b; 70 files +4206/−145 (apps/ + fix-wave namespace + register). Mimosa không can thiệp (gate = agent-only, đúng cơ chế playbook). Dirty còn 2 docs coordination + verify-wave namespace (owner).
- **Hệ quả**: OpenCode leg-2 re-pin `dac4262` → verdicts Z-F-01/02/03 + UX-L-01/02/04/05/06 + root-shell split adjacency MỞ HÀNG. F8 (aria-live) = mini-fix đầu tiên sau leg-2 findings.
