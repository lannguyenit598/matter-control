# Notification/mail review fixes: source candidate return

Task: **MC-NOTIF-MAIL-REVIEW-FIX-20261112**. Executor: actual Local Codex, native Superpowers execution. Status: **IN_REVIEW_WITH_RUNTIME_BLOCKERS**, not DONE or release-ready. Requirements: F-01/P1, F-02/P1, F-03/P1, F-04/P2; REQ-MC-P0-03/04/17, J9/J10.

## Source and delivery

- Base and unchanged HEAD: `d04491fa260686eafbe47d8d04fb3384b28378d3`.
- Implementation lives uncommitted in managed detached worktree `/Users/nguyenvanlan/Library/Application Support/orca/codex-accounts/0f9d5b46-d5f4-47b5-80f2-7b5d4b6ce9cd/home/worktrees/14c4/matter-control`.
- Final source manifest: [source-manifest.json](source-manifest.json), 35 changed/new/deleted source, test, grant and contract-document files. Manifest SHA-256: `51bc10a1e1f06f5254e8743fba7909f4ec93daada462a02f77472f4d902405d1` (sorted compact path/hash JSON; deletion is null).
- Reviewable delivery: [candidate.patch](candidate.patch). [Patch validation](patch-check.log) passed `git apply --check --whitespace=error-all` against the selected clean base files. This does not assert it applies cleanly to the primary dirty checkout.
- Primary `develop` product source was not changed. Existing Form Automation, term-sheet and skills edits remain in place. This task added only its documentation/evidence there. No commit, merge, push, deployment, credentials or global settings change.

## Changes and acceptance

| Finding | Source change | Verification result |
| --- | --- | --- |
| F-01/P1 | Stable SHA-256 key over notification identity and UTC-normalized due instant; explicit per-user `seen`; current-authorized submitted-key intersection; transactional acknowledgement/marker merge; displayed batch only | Domain/service/HTTP/frontend regressions PASS. Durable PG/restart/upgrade/grants acceptance NOT_RUN. |
| F-02/P1 | File upload goes through a browser feature repository directly to the same-origin BFF, removing the Server Action hop; selected intent retains the same key after all unresolved failures/refusals | Client/BFF tests cover 2 MiB, exactly 25 MiB, max+1, raw-byte SHA-256, origin/session/path/key guards, loss/replay and pending selection lock. Real authenticated browser/backend receipts NOT_RUN. |
| F-03/P1 | Nullable sent date in frontend schema; explicit unavailable-date label; dated/undated rows coexist | Schema/render/parser regressions PASS, including Vietnamese copy. No capture timestamp is invented as sent time. |
| F-04/P2 | Terminal work excluded within reminder derivation only | COMPLETED/CANCELLED regression RED -> GREEN; active work, milestones and existing boundary tests PASS. Shared agenda semantics unchanged. |

F-01 follows the PO's selected semantics: title/refresh changes preserve seen; changed kind/deadline/new claim changes key. An identical key reappearing remains seen. Existing timestamp-only markers cannot identify prior seen items, so reminders begin unread once after upgrade. No historical acknowledgements were fabricated.

New migration is `0021_notification_acknowledgements.sql`; `0020` remains reserved for the primary Form Automation work. The candidate does not contain or execute that dirty migration. Generated sqlc was regenerated, not hand-edited. Runtime grants use SELECT/INSERT/UPDATE; no retention/deletion job was added.

## Final executed checks

| Command | Result / evidence |
| --- | --- |
| Backend `rtk proxy make check` | **PASS**, exit 0: sqlc comparison, gofmt, tidy, lint (0 issues), full `go test -race -count=1 ./...`. [Final log](logs/backend-final.log). PostgreSQL-dependent tests skipped without DSN. |
| Frontend `rtk proxy pnpm check` | **PASS**, exit 0: typegen/tsc, ESLint, Prettier, **987 passed / 12 skipped**, agent config. [Final log](logs/frontend-final-2.log). |
| Frontend targeted mail/notifications/BFF suite | **PASS 33/33**, [log](logs/targeted-final.log). |
| `rtk proxy pnpm build:webpack` | **PASS**, compile/typecheck/prerender and CSS utility checks. [Final log](logs/build-final.log). Standalone packaging is limited by the dependency symlink warning below. |
| PostgreSQL acknowledgement test with `-v` | **SKIPPED**, explicitly `MC_TEST_DATABASE_URL not set`; process exit 0 is not a PG PASS. [Log](logs/postgres.log). |
| Patch check on clean base | **PASS**, [log](patch-check.log). No patch applied to primary source. |

Retained failed checks: initial backend gate failed goimports grouping; initial post-review frontend gate failed Prettier on the added regression test. Both were corrected and final gates rerun; earlier logs remain. During test development, deep comparison of a 25 MiB typed array exhausted a Vitest worker; assertion was changed to SHA-256 equality, and the size cases then passed without raising memory limits.

Installed frontend dependencies were reused through a `node_modules` symlink. pnpm's preliminary auto-install warned that the hoist directory was not real, then ran every check successfully. A fresh frozen-lockfile installation and complete standalone artifact were not verified; build compilation is not packaging certification. No dependency/package/lockfile change was introduced.

## Independent review and fix pass

[Reviewer disposition](independent-review.md): fresh-context internal Codex `notif_mail_final_review`, not external OpenCode; one Important, no Critical. It found key rotation after unknown -> definite refusal, which could duplicate a previously committed upload. Two regressions for HTTP 401/403 failed before the fix, then passed after removing refusal-driven rotation. Key now belongs to the complete selected-file intent; no automatic retry was introduced.

The original review pin predates this fix. Per native execution workflow, the author handled one RED -> GREEN fix pass and reran full gates; no second independent PASS is claimed. [Execution ledger](execution-ledger.md) records scope, rulings and task progress.

Deferred minor: the revoked-membership service test could assert store-call count rather than only unchanged acknowledgement-map size. Reviewer found the production authorization intersection correct by inspection; the test-strength improvement remains explicit.

## Rulings and operational limits

- The host-created detached worktree replaces the proposed `/private/tmp` branch. It remains preserved because there are no authorized commits; deleting it would lose uncommitted work.
- The direct BFF path is the approved upload exception to the template's generic Server Action rule; no unrelated/global action size limit was raised.
- Blocked reminders include the work item's recorded due date so changing it produces a new key under the selected semantics. Review-queue rows have no due field.
- Legacy `{}` seen requests are safe no-ops; their response timestamp is request metadata, not evidence that the whole feed was seen. Coordinated backend/frontend update and stale-client refresh are required.
- Acknowledgement keys accumulate for explicitly seen identities. No automatic expiry, retention policy, production storage cost or capacity was inferred; expiry could re-alert old keys.
- Live runtime and combined dirty-tree checks remain open. Source PASS does not override these acceptance gates.

## Remaining work

1. Reconcile the patch with primary dirty source, especially generated `models.go`, runtime grants and reserved migration 0020; then run tests on that exact combined manifest. The isolated candidate's PASS does not certify combined-tree behavior.
2. With a permitted task-owned PostgreSQL fixture, run migration/upsert/concurrency/rollback/isolation, restart/upgrade and B1 restricted-role tests. The Docker socket was unavailable and no PostgreSQL test DSN was supplied during this run.
3. On the permitted real-IdP walkthrough stack, verify browser-to-BFF uploads at size boundaries, backend byte hashes/receipts and same-key lost-response replay; verify seen state across browser navigation and application restart, access revocation and another user. Route/component mocks do not close this gate.

Skipped: primary source integration, real PostgreSQL/IdP/browser acceptance, production/merge/release and standalone packaging certification. Remaining risk: the candidate closes the reproduced source defects but needs the runtime and combined-tree evidence above before operational acceptance.
