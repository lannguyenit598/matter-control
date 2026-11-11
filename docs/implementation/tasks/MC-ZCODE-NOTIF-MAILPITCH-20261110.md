# MC-ZCODE-NOTIF-MAILPITCH-20261110

Owner: **actual ZCode** (PO dispatch trực tiếp 2026-11-10, "zcode thực hiện hết"; base HEAD `4dee45e7` develop). Priority P1. Status: AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW.
Evidence namespace: `docs/testing/mc-zcode-notif-mailpitch-20261111-r1/`.

## Requirement IDs and origin

Đóng 3 kết luận của vòng đánh giá nhân dạng (BA/PM/BO lens, 2026-11-10) được PO duyệt sửa:

- **Sửa 1** — gap thật = push-notification (J9) + email-capture (J10), không phải "chase". → REQ-MC-P0-03/04 (next action, waiting-on visibility) + REQ-MC-P0-17 (external parties context); notification v1 = **in-app, derived**, không provider.
- **Sửa 2** — verification gate (IdP thật + browser E2E + hosting/DPA) trước mọi pilot. → thực thi E-2 browser path trên stack mới + **decision packet hosting/DPA** cho PO (không tự quyết).
- **Bổ sung** — J7 onboard-context (Control Room + history) + J8 as-of provenance lên đầu pitch. → pitch doc + kiểm chứng provenance hiển thị khi đi bộ.

## Scope (đã thực hiện)

- **Notifications (in-app, v1)**: `GET /me/notifications` + `POST /me/notifications/seen`; projection thuần từ My Agenda (OVERDUE/DUE_SOON — milestone có DUE_SOON, không bao giờ có timing), MyActions.Blocked, ReviewQueue; watermark per-user (0018); pure derivation `matter.DeriveNotifications`; FE bell + panel (shared Dialog molecule, Escape/focus discipline), mark-seen → refresh.
- **Mail capture (v1)**: `POST /matters/:id/mail-intake` (raw .eml, X-Filename, `?direction=`, receipted) + `GET /matters/:id/mail`; 1 upload = Document + immutable version (`message/rfc822`) + envelope row (0019), 1 transaction; parser std-lib RFC5322 (+ multipart/quoted-printable), caps cứng (excerpt 2000 runes, subject 300, recipients 50, depth 3, body-read 256KiB); BFF route nhận multipart từ browser rồi forward raw bytes; FE panel tại Documents page.
- **B1 sync**: `mail_messages` = read/append (SELECT, INSERT); `notification_seen` = standard class; Go source + `ops/adr006/db/b1-runtime-grants.sql` đồng bộ (sync-guard + class-probe đều xanh).

## Out of scope (giữ nguyên ranh giới)

Browser-push/email-push/SMS (provider policy + paid = PO), SMTP/IMAP (credentials), `.msg` (dependency ngoài std-lib), party-match theo email (parties không có cột email — deferred), filing-preflight-gap notification (sẽ duplicate predicate D-20 — cố ý tránh), WebSocket/polling realtime.

## Files

- Backend mới: `migrations_mattercontrol/{0018_notification_seen,0019_mail_messages}.sql`, `queries_mattercontrol/notifications.sql`, `domain/matter/{notifications,mail}.go`, `port/notifications.go`, `service/{notification_service,mail_service,mail_parse}.go`, `postgres/notification_mail_store.go`, `postgres/notification_seen_store_test.go`, `productapi/notification_mail_handlers.go`.
- Backend sửa: `productapi/server.go` (Deps + 4 route + skipper/transferRequest), `app/product.go` (wiring + `system.Clock{}`), `postgres/b1_least_privilege_test.go` (class map ×2 nơi), `ops/adr006/db/b1-runtime-grants.sql`.
- Backend tests: `service/mail_parse_test.go` (7 case), `domain/matter/notifications_test.go` (2 case).
- Frontend (agent ZCode, cùng session): `features/notifications/*` (bell/panel/actions/schemas + 6 test), `features/mail/*` (panel/actions/repository/schemas + 6 test), BFF `api/matters/[matterId]/mail-intake/route.ts`, `layout.tsx` (bell), `documents/page.tsx` (mail card — read lỗi độc lập, không kéo sập trang).

## Gates (đã chạy, kết quả thật)

- `make check` + `MC_TEST_DATABASE_URL=...:5433` (container `mc-notifmail-pg`, task-owned): sqlc-check + gofmt + tidy + golangci-lint + **race tests toàn repo + PG contract suite = PASS** (sau 2 vòng fix: B1 sync-guard/class-probe, forbidigo Clock).
- FE: vitest features mới **12/12**, `tsc --noEmit` 0 lỗi, eslint 0 lỗi; full `pnpm check` + build → xem evidence run.
- Migrations 0018/0019 apply sạch trên fixture (goose log 2 dòng).

## Verification status

- One-run browser verify (E-2 real-IdP, golden path + 2 tính năng mới + provenance) → evidence dir; kết quả ghi ở return.md.
- Hosting/DPA: packet `docs/implementation/plans/MC-PO-DECISION-HOSTING-DPA-20261110.md` — **WAITING_PO_DECISION**, không tự chốt.

## Reviewer note

Non-author reviewer cần: re-run `make check` (PG env), re-run FE `pnpm check`, và đi bộ lại browser receipts. Commit theo playbook sau khi gates độc lập xác nhận.

## Review rounds 2026-11-11 — findings & dispositions (author self-review; independent review vẫn pending)

**BE (go-code-review / go-performance-review / go-coding-standards / go-architecture-review):**
- 🟡 index/query mismatch 0019 — FIXED (index theo `created_at`), fresh-schema re-apply + B1 PASS.
- 🟢→FIXED: dedupe recipients To+Cc (case-insensitive, giữ wire order) + test case mới.
- 🟢→FIXED: tests cho `ParseMailDirection` (domain) + `readLimited` (kèm đổi param `max`→`limit` — shadowing builtin) + `mailDocumentName` (truncate + sender fallback).
- 🟢→FIXED: B1 class map gộp 1 nguồn (`b1AppendOnlyTables`/`b1ReadAppendTables`/`b1DeletableTables`) dùng chung bởi `b1RuntimeGrants` và class-probe subtest.
- 🟢 KEEP (disposition): `ListMail` không LIMIT — theo precedent `listIntake`; `decodeHeaderWord` chỉ utf-8/us-ascii — fail-open an toàn; due==now không rơi cửa sổ nào — semantics chấp nhận; bell 5 round-trips/nav — chờ benchmark (không tối ưu không có số đo); server-level HTTP test cho 4 route mới — gap ghi cho reviewer.

**FE (vercel-react-best-practices / vercel-optimize — code-scope, không có production signal):**
- 🟡 async-parallel (documents page) — FIXED (hoist mail read song song).
- 🟡 retrySameKey mất ở chặng BFF — FIXED (route patch `outcome-unknown → retrySameKey: true`); test riêng cho hop này → gap ghi cho reviewer.
- 🟢 KEEP: bell ≤50 items/nav; BFF formData buffer ≤25MiB — đo trước khi tối ưu.

**Design (frontend-design / taste / hallmark / impeccable):**
- 🟡 group headers caps — FIXED (sentence case theo giọng nhà); 🟡 aria-label EN — FIXED (bilingual).
- 🟢 WAIVED on record: middle-dot join = idiom nhà (precedent Control Room); BellRow timestamp không nhãn — chờ usability.
- `impeccable detect` trên 4 file đã đổi: **0 findings**. Prettier + vitest 12/12 PASS sau fix.

**Governance:** `terminology-final.md` đã MẤT (cleanup 2026-11-05) — các nhãn mới dưới đây là **PROPOSED** chờ PO tái phê duyệt: Thông báo (Notifications) · Quá hạn (Overdue) · Bị chặn (Blocked) · Sắp đến hạn (Due soon) · Chờ bạn xác minh (Pending review) · Thư đến/Thư đi (Inbound/Outbound) · Ghi nhận email (.eml) (Email capture).

**Gates sau fix batch (2026-11-11):** `make check` + PG fixture — PASS (exit 0) · service/domain/postgres targeted tests PASS · FE prettier + vitest 12/12 PASS · `impeccable detect` 0 findings.
