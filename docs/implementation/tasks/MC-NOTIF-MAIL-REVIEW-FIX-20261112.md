# MC-NOTIF-MAIL-REVIEW-FIX-20261112

Owner: actual Local Codex. Priority P1 (F-04 P2). Status: IN_REVIEW_WITH_RUNTIME_BLOCKERS; not DONE. Authority: PO requested a Superpowers plan, selected identity-based seen semantics, then instructed continuation of implementation. No commit/merge/push/deploy authority is inferred.

Requirements: F-01/P1, F-02/P1, F-03/P1, F-04/P2 from the independent dev review; J9/J10 and REQ-MC-P0-03/04/17 under MC-ZCODE-NOTIF-MAILPITCH-20261110.

Base/head: `d04491fa260686eafbe47d8d04fb3384b28378d3`, unchanged. Work: application-managed detached worktree `/Users/nguyenvanlan/Library/Application Support/orca/codex-accounts/0f9d5b46-d5f4-47b5-80f2-7b5d4b6ce9cd/home/worktrees/14c4/matter-control`. The primary `develop` source and its dirty Form Automation/term-sheet/skills work were preserved; only documentation/evidence was added there.

Scope: notification and mail feature source/tests, HTTP DTOs, acknowledgement persistence/generated queries, runtime grants and contract/operations notes. No new dependency/provider or legal-state change. Migration 0020 remains reserved for existing Form Automation; this candidate adds 0021.

Inputs: [plan](../../superpowers/plans/2026-11-12-notification-mail-review-fixes.md), its linked design and pinned review evidence. Outputs: [fix return](../../testing/notif-mail-review-fix-20261112-r1/return.md), source manifest, candidate patch, gate logs, execution ledger and [independent review disposition](../../testing/notif-mail-review-fix-20261112-r1/independent-review.md).

Acceptance:

- Stable per-user seen keys survive refresh; changed kind/deadline becomes unread; no invisible/new-between-read-and-mark acknowledgement. Persistence and runtime restart require live PG evidence.
- Direct browser repository upload bypasses the File-bearing Server Action; preserves origin/session/path/size validation and same-file/same-key retry, including unknown -> refusal -> restored success.
- Nullable sent dates preserve the complete mail list and render explicit absence.
- COMPLETED/CANCELLED work does not generate due reminders; active/milestone semantics remain intact.
- Required source gates and independent review/fix pass are recorded against final bytes; runtime gates are explicit.

Reviewer: actual internal Codex `notif_mail_final_review`, read-only fresh context; not external OpenCode. One Important finding was reproduced with two failing tests and fixed; final gate results belong to the author-run evidence, not a fabricated reviewer re-approval.

Dependencies/blockers: no Docker daemon/test PostgreSQL DSN was available; authenticated browser/IdP E2E, DB restart/upgrade, B1 runtime grants and combined 0020+0021 verification remain open. Candidate is ready for source intake review, not deployment. Inspect the fix return for exact executed test counts and limits.

Skipped: integration into the primary dirty source, commits/push/deploy and live runtime acceptance. Remaining risk: one-time upgrade unread reset, acknowledgement growth without a new retention policy, and unverified combined-tree/runtime behavior.
