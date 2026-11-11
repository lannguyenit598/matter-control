# MC-ZCODE-NOTIF-MAILPITCH-20261110 — One-run verification return (2026-11-11)

Executor: **actual ZCode** (PO dispatch 2026-11-10 "zcode thực hiện hết"). Base `4dee45e7` develop, uncommitted.
Stack: walkthrough E-2 env (`up.sh`) — ZITADEL :8080 (real IdP) · PG :55440 (retained volume, migrations 0018/0019 applied on start) · mcapi built from tree :8083 · faultproxy :8082 · next dev :3000.

## Steps & results (verify-features.mjs, real Chrome, mc-alice, real IdP login)

| # | Step | Result |
|---|---|---|
| 1 | login-e2e-real-idp (session cookie mc_session) | PASS |
| 2 | workspaces populated | PASS |
| 3 | matter discovered via workspace | PASS |
| 4 | matter overview (provenance "Read at…"/"Scope read at…" visible) | PASS |
| 5 | bell present in header (aria-haspopup dialog) | PASS |
| 6 | bell panel opens (shared Dialog molecule) | PASS |
| 7 | Add-work dialog opens | PASS |
| 8 | Action created via UI, landed on item detail | PASS |
| 9 | metadata due field present (Edit details disclosure) | PASS |
| 10 | second item due field | PASS |
| 11 | **bell shows OVERDUE row** (Record notarized SPA copy · M1 · 1 Nov 2026 09:00) | **PASS** |
| 12 | **bell shows DUE SOON row** (Signing meeting prep · M1 · 12 Nov 2026 09:00) | **PASS** |
| 13 | mark-seen button present (mark → refresh) | PASS |
| 14 | mail panel file input | PASS |
| 15 | **mail captured**: subject/sender→recipients/Inbound/sentAt/excerpt row + "Captured" message | **PASS** |
| 16 | document detail opened (targeted re-run `verify-doc-detail.mjs`) | PASS |
| 17 | **document-version-sha-visible** (64-hex sha256 trên version list) | **PASS** |
| 18 | mail version listed (message.eml / message/rfc822) | PASS |
| 19 | control-room renders | PASS |
| 20 | **provenance as-of visible** ("As of … · source revision 9 · same snapshot") | **PASS** |

Bằng chứng trực quan key: `07-bell-overdue-and-due-soon.png` (panel OVERDUE·1 + DUE SOON·1, badge "2", Mark as seen, đè lên matter overview có As-of + What-changed feed) · `09/10` (mail panel + captured row) · `11` (document detail với version sha256) · `12-control-room.png` ("As of … source revision 9 · same snapshot"; **event `mail.intaken` trong What changed** — bằng chứng event emission end-to-end).

## Chạy lại / tái lập

- Scripts: `commands/verify-features.mjs` + `commands/verify-doc-detail.mjs` (password đọc runtime từ `ops/p0-local/secrets/test-users.json`, không bao giờ in/commit).
- Re-run: `up.sh` → chạy 2 script với env như header → `down.sh`. Đã chạy: up → 4 vòng main script (3 vòng debug selector, các vòng sau tạo thêm synthetic records) + 2 vòng targeted → down CLEAN (orphan check CLEAN: 0 listeners/0 containers trên {3000,8082,8083,55440,8080}).
- Synthetic data tác động lên retained volume: 4× action "Record notarized SPA copy (synthetic)" (1 per debug run, không gán owner — hiện trong Control Room Gaps "No owner") + 1× "Signing meeting prep (synthetic)" + 1× mail document "Email: Signed SPA scan and supplement request". **Không xoá bằng SQL trên bảng projection** (tiền lệ E-2); ai cần sạch có thể tạo matter mới để demo.

## Lỗi gặp trong verify (đã sửa, không phải lỗi product)

1. Định hướng script (waitForURL sau click, split URL) ×2 — lỗi script.
2. `form button[type="submit"]` trượt vào form Sign out ở sidebar → tự đăng xuất giữa chừng (screenshot 05 lúc đó là trang signed-out) → sửa thành `form:has(input[name="due"]) button[type="submit"]`. **Không phải lỗi product** — nhưng là ghi chú cho Playwright suite: bare `form button[type="submit"]` nguy hiểm trên layout này.
3. `element.getAttribute` vs `page.getAttribute(selector)` — lỗi API script.

## Gates tổng (trước verify run)

- Backend `make check` + PG fixture `mc-notifmail-pg:5433` (task-owned, **giữ lại cho reviewer**): sqlc-check/gofmt/tidy/lint/race/PG contract — **PASS** (2 vòng fix: B1 sync-guard + class-probe; forbidigo → `port.Clock`).
- FE `pnpm check` (typegen+tsc+eslint+prettier+vitest **967/967**+agents:check) — **PASS** (1 flake run đầu, không reproduce; 2 file prettier --write trước khi pass).
- FE production build — **PASS** (PPR note: route tĩnh/dynamic đúng như cũ).
- FE features mới: vitest 12/12, tsc 0, eslint 0.

## Skipped / remaining risk

- M1–M5 usability với người dùng thật: NOT_RUN (cần người).
- Party-match theo email trong mail capture: deferred (bảng parties không có cột email).
- Notification kinds PREFLIGHT_GAP: deferred có chủ đích (tránh duplicate predicate D-20).
- Playwright e2e spec mới cho bell/mail: chưa viết (verify bằng script đứng ngoài repo; suite e2e hiện có 3 spec không đụng path mới).
- Server-level HTTP test cho 4 route mới: chưa viết (đã phủ bởi walkthrough E2E + unit/contract tests; ghi nhận làm gap nhỏ cho reviewer).
- Fixwave batch-2 (term-sheet dirty tree) và `docs/testing/fe-nextjs-review-20261106-r1/` không đụng tới — dirty work của writer khác được bảo toàn nguyên vẹn.
- Commit: **chưa commit** — theo playbook, chờ independent review + PO xác nhận; commit có thể bị Mimosa chặn theo tiền lệ, khi đó ghi BLOCKED_NO_DISPOSITION.
