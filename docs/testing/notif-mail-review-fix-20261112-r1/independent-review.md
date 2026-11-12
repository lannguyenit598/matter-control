# Independent source review and disposition

Task: MC-NOTIF-MAIL-REVIEW-FIX-20261112. Reviewer: fresh-context internal Codex agent `notif_mail_final_review` (gpt-6-astra, high), dispatched under the Superpowers native execution workflow. This was not external OpenCode execution. Review was read-only and covered `git diff HEAD` plus untracked source/tests in managed worktree `14c4`; base and unchanged HEAD are `d04491fa260686eafbe47d8d04fb3384b28378d3`.

Reviewed source manifest digest: `edef5db66c3c5a1344fbb047db6b3ab8506b66867af9f9cdd8f290f08e399afb` (35 changed/deleted source, test, grant and contract-document entries). The final delivered manifest is separate: later fixes must not be attributed to the reviewer's original pin.

## Returned assessment

REWORK_REQUIRED: one Important finding, no Critical findings.

At `apps/frontend/src/features/mail/components/mail-panel.tsx`, a lost upload response retained key K, but a subsequent structured 401/403 without `retrySameKey` replaced K. That refusal cannot establish the original upload's outcome. Retrying unchanged bytes after access recovery could create a second mail/document/version.

Smallest recommended fix: retain the key for the complete selected-file intent, rotating only on confirmed success or a new selection. Add unknown -> definite refusal -> success regressions asserting identical bytes and key on every request.

Reviewer strengths: stable UTC-normalized keys, bounded validated acknowledgement batches, authorized current-row intersection, per-user transactional SQL upserts and monotonic markers, direct browser repository upload retaining origin/session guards, nullable mail dates, terminal reminder filtering, and migration/grants/generated-query consistency by inspection.

## Author fix pass

Two component regressions for unknown -> HTTP 401/403 -> restored success failed before the fix: the third request carried a different key (tool output `88eb71`). The refusal-driven key reset was removed; only success/new selection rotates the key. Final targeted mail/notification/route suite: **33/33 PASS**, retained in `logs/targeted-final.log`.

No re-review was dispatched: Superpowers native execution calls for one independent review followed by a test-proven author fix pass. The final source manifest and full gate logs identify the post-review candidate; this disposition is not a new reviewer-authored PASS or release approval.

## Deferred minor

The revoked-membership service test submits previously acknowledged keys and checks map size. A store-write counter would make its negative assertion stronger; production current-access intersection is correct by reviewer inspection. Deferred test-strength improvement, not proof of live authorization acceptance.

## Declined-to-judge items and disposition

- Live PostgreSQL migration, constrained-role grants, concurrency, restart and upgrade fixtures: remain NOT_RUN/BLOCKED without a test DSN/runtime.
- Authenticated browser uploads, byte/hash/receipt replay, lower backend cap and real IdP recovery: remain NOT_RUN, not inferred from mocked route/component tests.
- Combined primary checkout with Form Automation `0020`: not verified; final patch remains isolated and must be reconciled before combined-tree tests.
- Full source gates: author-run logs recorded separately. Dependency symlink warnings mean compilation does not certify standalone packaging or a fresh lockfile install.
- Merge, deployment and production release: not authorized or performed.

Skipped: reviewer test execution, external QA and runtime acceptance. Remaining risk: final source tests close the demonstrated key-rotation defect, while PostgreSQL/browser/IdP/integration readiness remains open.
