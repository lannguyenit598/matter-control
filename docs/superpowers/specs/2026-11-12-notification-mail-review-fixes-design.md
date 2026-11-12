# Notification and mail review fixes: proposed design

Status: PLAN_READY_FOR_REVIEW. The PO selected identity-based seen semantics in the conversation on 2026-11-12. The complete design/implementation plan still awaits review; no implementation, migration, commit or deployment is authorized by this document.

## Intent and evidence

Resolve F-01/P1, F-02/P1, F-03/P1 and F-04/P2 in [the independent review](../../testing/dev-commit-review-20261112-r1/report.md), at committed HEAD `d04491fa260686eafbe47d8d04fb3384b28378d3`. Preserve REQ-MC-P0-03/04/17 and the in-app/mail-capture boundary of MC-ZCODE-NOTIF-MAILPITCH-20261110. The four failures were reproduced in that review; existing green suites did not exercise them.

## Constraints

- Synthetic data only. No tokens, credentials, mail bytes or legal content in Git or evidence.
- No new dependencies, provider integration, global configuration, paid services, deployment or production-readiness claim.
- Preserve existing Form Automation, term-sheet and skills edits. In particular, `0020_form_automation.sql` already exists uncommitted; do not reuse or rewrite that migration number.
- Use append-only migration files and sqlc generation; never hand-edit generated Go.
- Preserve independent business state axes, per-request authorization, atomic mail receipts and same-key unknown-outcome recovery.
- Planning authority does not include commit/merge/push or permission to run a destructive database action.

## Approaches and recommendation

The PO explicitly selected F-01's identity-based seen semantics: keep seen by identity and notify again when kind or deadline changes. The storage, compatibility and other implementation choices below are Codex recommendations for review, not separate PO architecture approvals.

| Issue | Recommended approach | Alternative and trade-off |
| --- | --- | --- |
| F-01 | Persist per-user acknowledgements of stable notification keys; return explicit `seen` per current row | Reconstruct stable occurrence times from domain events. This supports repeated occurrences, but requires a larger event/provenance model for blocked assignments and timed reminders. A timestamp-only patch cannot implement this reliably. |
| F-02 | Client sends multipart directly to the existing mail BFF route | Raise the global Server Action body limit. Fewer initial edits, but retains the redundant browser -> action -> self-fetch hop and expands the body limit for unrelated actions. |
| F-03 | Keep nullable `sentAt` end to end; show an explicit missing-date label | Substitute capture time. This would misrepresent capture time as sent time unless separately labeled. |
| F-04 | Exclude terminal work rows within notification derivation | Filter the shared agenda. That would remove legitimate historical agenda entries and change another feature. |

## Proposed behavior

### F-01: acknowledgement, with bounded semantics

- Keep notifications derived from current authorized views. Store only `(user_id, notification_key, seen_at)` acknowledgements, not copies of notifications or legal content.
- `notification_key` is lowercase SHA-256 over the JSON array `[notification.ID, dueAtUTC]`, where absent due time is `""` and present time is UTC RFC3339Nano. ID already includes kind, matter and work/milestone/claim identity.
- An unchanged key stays seen across refresh, navigation and server restart. Kind changes, new claim IDs and changed due instants generate a new key. Title edits alone do not re-alert.
- A blocked item that disappears and later reappears with exactly the same key stays seen. Moving a deadline away and back to a previously acknowledged instant also restores its seen status. Tracking every recurrence is the alternative above and is not silently included.
- The button acknowledges only the keys rendered in its feed, not notifications arriving between the read and click. The service re-derives current authorized rows and intersects submitted keys; inaccessible/stale keys are ignored without revealing existence.
- Concurrent tabs merge acknowledgements. No request replaces the other tab's set or moves the metadata watermark backwards.
- Keep the existing `notification_seen.seen_at` as last-ack metadata; never use it to determine unread status. Existing watermark rows cannot identify prior seen items, so the migration does not fabricate historical acknowledgements: current keys start unread once after upgrade.
- Add `seenKey` and `seen` to each GET row. POST accepts `{keys: string[]}`, 0..200 unique 64-hex values; `{}` is a documented safe no-op for a stale client. Retain `{seenAt}` response metadata. New frontend relies on the new fields; deploy/backend compatibility must be coordinated and old clients refreshed.
- Honor the existing notification GET `limit` parameter using the house 1..200 parser, default 200. The header requests 50; `page.total` counts the derived candidate set, and `page.limit` reports the effective requested limit. No global count, walkable archive or pagination redesign is introduced.
- No retention or paid storage policy is chosen. Acknowledgement storage grows with keys explicitly marked seen; document this operational limit and measure during local verification. Automatic expiry would make seen reminders unread again and requires a separate decision.

The F-01 recurrence choice above is confirmed. Its upgrade behavior and the complete implementation design remain reviewable in the plan. F-02/F-03/F-04 can be implemented independently once execution is requested.

### F-02/F-03: mail

- Keep `MailPanel({matterId, items})`, multipart BFF input, API raw-byte forwarding and the 25 MiB file cap. Put browser transport in a feature-local client repository to obey R-FEAT-4 (components never call fetch). Remove the Server Action hop and its orphaned module after all callers/types/tests migrate.
- Preserve session/origin/path/key validation at the BFF; browser code never imports the server repository or handles a bearer token. Preserve raw `.eml` bytes and `INBOUND` intent.
- Network failure or unusable 2xx/5xx response remains outcome unknown and retains the same key and selected file for explicit retry. Known refusals keep their structured result. No automatic retry.
- `sentAt` is `string | null`. Null renders `Sent date unavailable` / `Không có ngày gửi`; dated rows keep the actual sent time. Capture timestamp stays a separate field.
- No new reload-recovery system, mail parsing features, direction selector or upload abstraction. Preserve current same-selection retry behavior; broader recovery remains separately scoped.

### F-04: notifications

Skip work rows whose execution is COMPLETED or CANCELLED before due reminder derivation. Use the existing execution type's validity/terminal semantics; do not change agenda inclusion, milestone readiness, the 48-hour window or boundary comparisons.

## Acceptance

All four review failures have targeted red -> green regressions; mark/read survives PostgreSQL restart and concurrent acknowledgement; new-between-read-and-mark remains unread; undated mail coexists with dated mail; a real browser sends >1 MiB through the BFF; exactly 25 MiB is accepted when the backend uses its existing matching default and 25 MiB + 1 is rejected; terminal work disappears from reminders while active work and milestones retain their semantics. Missing PostgreSQL or authenticated browser evidence remains NOT_RUN/BLOCKED, never PASS.

## Builder choices and review boundary

Use existing Go/pgx/sqlc and frontend feature/component/test patterns. The plan specifies stable keys, DTOs and storage interfaces; implementers retain routine code-layout choices within those files. A fresh independent reviewer checks the final source manifest and evidence; neither this design nor an implementation author's report closes the review alone.

Skipped: product code and infrastructure work. Remaining risk: the one-time upgrade unread reset needs plan review, and the current machine's PostgreSQL/IdP availability has not been refreshed during planning.
