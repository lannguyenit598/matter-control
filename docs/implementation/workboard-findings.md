# P0 Findings & Decisions Register (CO-01) — nguồn chân lý duy nhất

- Người tạo: actual ZCode (coordinator, theo PO 2026-10-31 "zcode thực hiện hết"). Cập nhật: 2026-10-31 ~16:45Z.
- Trạng thái: `OPEN → FIX_IN_PROGRESS → FIXED_PENDING_VERIFY → CLOSED_VERIFIED` (hoặc `WONTFIX_PO`, `BLOCKED:<lý do>`).
- Mỗi thay đổi state phải ghi evidence path + date. Independent verification = OpenCode trừ khi PO chỉ định reviewer khác; **ZCode không tự verify code của ZCode**.

## 0. Decision record — PO phê duyệt 2026-10-31 (AskUserQuestion, 4/4 mục)

| # | Quyết định | Trạng thái | Hệ quả |
|---|---|---|---|
| DEC-20261031-01 | **Commit/re-pin candidate** kèm known-defects register | RATIFIED | CO-03: freeze → commit baseline → re-pin. Commit/push chỉ commit cục bộ theo scope này; push chờ PO riêng. |
| DEC-20261031-02 | **D-9 purpose-typing criterion** (package/signature) — state-semantics amendment | RATIFIED | Mở khoá fix Z-F-01/02. Doc amendment đi cùng code change. |
| DEC-20261031-03 | **D-2 cookie locale** server-readable | RATIFIED | Mở khoá fix UX-L-02. |
| DEC-20261031-04 | **D-1(b)** đóng gói env walkthrough stub-IdP + backend (BA r2 pattern) thay vì demo fixtures frontend | RATIFIED | CO-17 scope thu hẹp. |

Còn CHỜ PO: 6 PROVIDER case + cloud D1–D8 + B3/D4 + D-7 (5 MiB số cuối) — xem cloud-activation-packet.

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
