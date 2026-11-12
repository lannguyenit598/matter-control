# SDD ledger — plan: docs/superpowers/plans/2026-11-12-notification-mail-review-fixes.md
Execution: actual Local Codex, Native, user 'tiếp tục' after plan handoff (2026-11-12). No commit/merge/deploy authority.
Base: d04491fa260686eafbe47d8d04fb3384b28378d3; managed detached worktree 14c4.
Ruling: use application-managed worktree instead of proposed /private/tmp branch — native tool owns isolation — final deliverable is an uncommitted patch, not a branch/merge.
Ruling: preserve workspace/ledger until delivery because no commits are authorized — deleting uncommitted artifacts would lose evidence — cleanup remains manual after intake.
Pre-flight: Tasks 1/2 share MailItem and mail-panel tests; nullable type remains authoritative. Tasks 3/4 share DeriveNotifications; terminal filtering precedes seen keys. Task 5 consumes all exact source pins. No interface conflicts.
Baseline: backend domain/service/productapi PASS; frontend mail/notifications running; Docker socket absent, PG/real-IdP gates unresolved.
Task 1: complete (uncommitted; 2 failing regression tests -> 8/8 frontend PASS; Go parser tests PASS; tool outputs c61c87/536bd0). Baseline frontend 12/12 PASS.
Task 2: complete (uncommitted; direct-fetch regression failed with 0 fetch calls before fix; 20/20 mail/schema/BFF tests PASS, output 10c825). A test deep comparison of 25 MiB exhausted worker memory; switched assertion to SHA-256, no increased heap or product change.
Task 3: complete (uncommitted; COMPLETED/CANCELLED red -> domain suite PASS, output c8b219).
Task 4: source implemented; stable key/domain and service read-mark-read PASS, API/FE targeted 29/29 PASS (702e4a). Real PG tests compile but skip without MC_TEST_DATABASE_URL; not complete runtime verification. Go red API additions initially failed compilation; fixed fixture made.Item typo before observing green; original behavioral red evidence remains pinned in review.
Ruling: blocked reminder includes its existing work deadline in DueAt — otherwise changing a blocked item's deadline could not re-alert under the PO's identity rule — queue rows have no deadline field.
Ruling: zero-key legacy requests return current request instant as no-op response metadata; stored marker remains unchanged — preserve old response shape without acknowledging unseen rows — clients must not treat this as a full-feed seen watermark.
Task 5: source gates and independent review pending. PostgreSQL runtime still unavailable; implement source/tests then retain integration gate open. Ruling: keep native BFF exception to template Server Action rule — approved design and existing upload pattern require direct transport — no global action body limit changes.

Final review: fresh-context internal Codex reviewer notif_mail_final_review; one Important, no Critical. Reviewed source manifest digest edef5db66c3c5a1344fbb047db6b3ab8506b66867af9f9cdd8f290f08e399afb.
Final: fixed unknown -> 401/403 -> success key rotation; two regressions failed before removal of refusal-driven key rotation (tool 88eb71); final green pending.
Final: minor (deferred): revoked-membership negative test checks existing key count and could be stronger with a write-call counter; production intersection is correct by reviewer inspection.
Final: Ruling: runtime PG/IdP/browser/upgrade and primary-tree reconciliation remain unverified — no available runtime evidence — no merge/release readiness inferred.

Final: fixed reviewer Important — unknown -> 401/403 -> success tests RED then GREEN, targeted 33/33 PASS.
Final source manifest: 51bc10a1e1f06f5254e8743fba7909f4ec93daada462a02f77472f4d902405d1; uncommitted patch preserves primary checkout.
Task 4/5: source candidate verified where gates ran; PostgreSQL integration and authenticated browser/IdP acceptance remain BLOCKED/NOT_RUN. No DONE or release approval.
