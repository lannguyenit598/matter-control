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
| Z-F-01 | P2 DEFECT | Filing proof-required nộp được package rỗng (guard purpose-blind) | OPEN | zcode-ba-flow...r1/r2/findings.md (filing F, live) | Fix-wave CO-06 (D-9 ✓) |
| Z-F-02 | P2 GAP | Không criterion-kind signature; gate chữ ký nhận bất kỳ criterion | OPEN | như trên | Fix-wave CO-06 (D-9 ✓) |
| Z-F-03 | P2 GAP | `outcomeVerification: NOT_DECLARED` không lộ Grid/Control Room | OPEN | như trên | Fix-wave CO-11 |
| UX-L-01 | Blocker | `/workspaces` title "Matters/Hồ sơ" (workspaces/page.tsx:15,21) | OPEN | uiux...r1/audit-findings.json | Fix-wave CO-07 |
| UX-L-02 | Blocker | Locale kẹt EN máy chủ; `lang`=vi–text en (WCAG 3.1.2) | OPEN | uiux...r1 (probe timeline) | Fix-wave CO-08 (D-2 ✓) |
| UX-L-04 | Major | Trộn ngôn ngữ trong component (ReadFailure, login, ~21 literal) | OPEN | uiux...r1 | Fix-wave CO-09 |
| UX-L-05 | Major | Fail-state mất context (h1 null, mất tabs, 16 route) | OPEN | uiux...r1 | Fix-wave CO-09 |
| UX-L-06 | Major | Storybook crash từng phần (TypeError useRouter) | OPEN | uiux...r1/screens/storybook | Fix-wave CO-10 |
| UX-L-03 | Blocker enablement | Không có đường populated chuẩn | CLOSED_BY_DECISION (D-1(b) ✓ — CO-17 đóng gói) | — | CO-17 |
| UX-L-07..11 | Minor/Polish | metadata; aria-live; border 3:1; dev-streaming (prod NOT_VERIFIED); dev-tools bubble | OPEN (xếp sau wave) | uiux...r1 | Backlog |
| PI-01..04 | P2/P2/P1/P3 | TTL 30s; SA tách; preflight/CI; erratum | FIXED_PENDING_VERIFY | deploy-readiness WP-1/4/5/8 | OpenCode CO-14 |
| r1 P3 ×7, r2 P3 ×4 | P3 | xem findings.md của từng attempt | OPEN (adjudicate tại intake) | từng namespace | — |
| **OV-R13-01** | **P2 (deploy-blocker đến khi sửa)** | `ops/deploy/cloud-run/migrate-job.yaml` **fail YAML parse (indent)** — job migration sẽ không deploy được; 5/6 yaml khác PASS | **FIXED_PENDING_VERIFY** (commit `6b0c358`, receipts m1-yaml-before/after) | opencode-verify-wave-20261031-r1/commands/verify-R13-yaml-structure/stdout.final + mc-enablement-minifix-20261101-r1/commands/ | OpenCode confirm trong wave |
| OV-R14 | INFO/CLEAN | Secrets scan 509 file CLEAN — mọi hit classify synthetic fixture có basis (mattercontrol:mattercontrol trong CI yml author = fixture; `***` = author scrub; `<redacted>` = vết stdout run cũ) | CLOSED_VERIFIED (OpenCode) | verify-wave commands (R14) | — |
| OV-R15 | INFO/CLEAN | No-overclaim scan: mọi "DONE" là task-level/negative; author không claim independent PASS — ngôn ngữ kỷ luật | CLOSED_VERIFIED (OpenCode) | verify-wave R15 | — |
| **US-R-01** | P2 GAP | Stub IdP walkthrough **chưa có trang login browser/authorize HTML** (chỉ /introspect machine-token) + phải chấp nhận redirect_uri của frontend trial → participant không vào được UI | OPEN (coordinator grep xác nhận 2026-11-01: 0 hit login/html/authorize trong ops/local/walkthrough/) | usability-prep-20261101-r1/return.md | Enablement follow-up — chặn session trial E-2 |
| **US-R-02** | P2 GAP | **Fault-injection cho T10 chưa tồn tại** — phiên A không chạy được chân khôi phục (OUTCOME_UNKNOWN live) | OPEN (probe coordinator không kết luận — grep dính "default"; cần receipt thật) | usability-prep-20261101-r1/return.md | Enablement follow-up — chặn phiên A |
| US-PREP | docs | Usability prep 6 file (scripts/forms/metrics/logistics/dataset) | IN_REVIEW (cần reviewer độc lập theo chính nó) | usability-prep-20261101-r1/ | PO + OpenCode bundle |
| **CO-17** | work item | Walkthrough scripts up/mint-token/down + stub IdP + smoke | **DONE (commit `ed23be3`, smoke 4/4, teardown sạch không orphan)**; M3 runbook erratum pooler **DONE (commit `bb54d6e`** — Nano/Free = 200 pooler clients, verify docs chính thức 2026-11-01**)** | mc-enablement-minifix-20261101-r1/commands/ | — |
| **CO-15** | work item | OpenDesign UX plan review (UX owner) | **DONE — REVIEW_RETURNED**: 11 AGREE / 3 AMEND (P-02 effort M–L→**L**; P-03 scope thu hẹp theo D-1(b), effort L→**M**, AC mới = "pnpm dev + documented env → workbench 3 matter"; P-06 tách 2 bước — sweep EN literals ngay, nhãn vi sau R10) / 1 REPRIORITISE (**P-09 aria-live Pha 3→Pha 1**, WCAG 4.1.3 — relay fix-wave như **F8 addendum**) / **D-3 CHỐT** (`terminology-final.md` — Matter="Hồ sơ", Filing="Hồ sơ khai"/badge "Khai", Action="Hành động", roles vi; 3 amendments: Approval="Chấp thuận", As-of="Dữ liệu tại", badge "Khai") + UX copy vi/en cho guard Z-F (aria-live polite, gộp vi phạm đồng thời) + checklist populated-UI V-01..V-14 | opendesign-ux-plan-review-20261101-r1/ | P-09 → fix-wave relay F8; D-3 áp nhãn vi sau PO ratify R10 |
| **P-03** | Blocker enablement | Không có đường populated chuẩn | **GẦN ĐÓNG**: env + scripts + docs DONE (CO-17); còn UI-entry = US-R-01/02 (U1/U2 session) | walkthrough-env.md + ops/local/walkthrough/ | US-fix session |

## 2. Verify-wave checklist (OpenCode — sau commit Pha 1)
15-case deploy packet · PORT-02/03/04/05/10/11 + TTL 30s rerun · Z-F-01/02 repro r2 trên byte mới · locale probe reproduce · B1 sync-guard non-author eyes.

## 3. Runtime/teardown ledger
| Runtime | Trạng thái | Ghi chú |
|---|---|---|
| :3000 next-server PID 171 | LIVE (Codex) | không đụng; đã tự hồi phục css-3000 |
| :8080 ZITADEL docker | LIVE | không đụng |
| 28719/28720/28721 (deploy-readiness PG/rehearsal) | LIVE | giữ cho reviewer |
| 28550 (OpenCode QA PG) | LIVE | giữ |
| 15499 / 18099 / 18081 / **18082** | STOPPED | 18082 orphan do coordinator stop 2026-10-31 (CO-02, PO "thực hiện hết") |
| mcapi @8081 (fix-wave) | LIVE | runtime fix-wave session |

## 4. CO-03 milestone — BASELINE COMMITTED (2026-10-31 ~16:47Z)
- **HEAD `4b6a65f`** "P0 local candidate baseline @0de3e5d+dirty, known defects Z-F-01/02 + PI-01..04 pending verify" — toàn bộ dirty tree 211 entry đã pin; dirty còn 2 (WIP fix-wave). **Mimosa git-gate KHÔNG chặn** ở ngữ cảnh này (rủi ro playbook không cần kích hoạt; playbook giữ lại cho tương lai).
- Hệ quả: OpenCode verify wave giờ chạy được trên byte pin; mọi verdict mới hợp lệ. Nếu OpenCode verify đã chạy TRƯỚC commit → rerun trên `4b6a65f`.
- **Update 2026-11-01 ~17:00Z**: OpenCode verify wave **đã tự re-pin vào `4b6a65f` (5706 blobs, 0 drift)** → verdicts bind vào commit bytes, **CO-14 rerun KHÔNG cần**; 6 verify namespaces đang chạy: R1-config-tests, R7-renderer-tests, R9-action-refs, R13-yaml-structure (→ OV-R13-01 FAIL thật), R14-secret-sweep (CLEAN), R15-claims-audit (no-overclaim). PORT-02/03/04/05/10/11 + TTL-30s rerun đã unblocked và đang chạy. Commit `5e932bd` (register+playbook) do coordinator-playbook session — KHÔNG phải fix-wave (sửa lại attribution trước đó của coordinator).
- Fix-wave F1 đang lộ trên tree: `0011_criterion_purpose_signature.sql` + `criterion_purpose_migration_test.go` (Z-F-01/02 purpose-typing theo D-9) — dirty 6 file apps/backend, các path rời nhau, không xung đột writer.
- **Update 2026-11-01 ~17:40Z (minifix session)**: MC-ZCODE-ENABLEMENT-MINIFIX-20261101 hoàn tất 3/3 — M1 `6b0c358` (OV-R13-01 → FIXED_PENDING_VERIFY, chờ OpenCode rerun trong wave), M2 `ed23be3` (CO-17 DONE: scripts + stub IdP + smoke 4/4 readyz-200/401/200/401, teardown sạch), M3 `bb54d6e` (runbook erratum pooler). Orphan 18082 xác nhận FREE (khớp ledger). US-R-01 (browser login/authorize cho stub IdP) còn mở — enablement follow-up, chặn trial E-2. Session không đụng apps/** và không để runtime nào lại (walkthrough đã teardown).

## 5. Pooler verification (đóng gap WP-8 / deploy-ready)
- **Supavisor max client connections = 200 trên Nano-tier** (Supabase docs chính thức "Connection pooling and limits" — URL lúc WP-8 bị 404, giờ xác nhận: https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits); limits scale theo compute tier; transaction mode cho serverless; direct ~60 vẫn áp cho upstream.
- Kết luận connection budget của runbook §1 (peak ~72–102 < 200): **XÁC NHẬN, không cần MC_DB_MAX_CONNS** — caveat ghi rõ "Nano-tier; re-check nếu tier khác". Fix-wave/reviewer fold thành erratum vào `docs/deployment/pilot-deploy-runbook.md` §1.
