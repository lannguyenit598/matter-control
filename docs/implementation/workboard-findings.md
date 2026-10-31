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
- Fix-wave đang fix trên top (F1..F7) — commit theo fix-unit kế tiếp.

## 5. Pooler verification (đóng gap WP-8 / deploy-ready)
- **Supavisor max client connections = 200 trên Nano-tier** (Supabase docs chính thức "Connection pooling and limits" — URL lúc WP-8 bị 404, giờ xác nhận: https://supabase.com/docs/guides/database/connecting-to-postgres/pooling-and-limits); limits scale theo compute tier; transaction mode cho serverless; direct ~60 vẫn áp cho upstream.
- Kết luận connection budget của runbook §1 (peak ~72–102 < 200): **XÁC NHẬN, không cần MC_DB_MAX_CONNS** — caveat ghi rõ "Nano-tier; re-check nếu tier khác". Fix-wave/reviewer fold thành erratum vào `docs/deployment/pilot-deploy-runbook.md` §1.
