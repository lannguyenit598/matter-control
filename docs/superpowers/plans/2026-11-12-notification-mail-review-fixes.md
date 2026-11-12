# Notification and Mail Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native execution, or superpowers:subagent-driven-development only if the user selects that method. Steps use checkbox (`- [ ]`) syntax for tracking. Status: PLAN_READY_FOR_REVIEW, not an execution or commit instruction.

**Goal:** Resolve the four reproduced review findings with regression coverage and independent verification.

**Architecture:** Reuse the existing client-to-BFF upload flow and nullable API contract. Keep reminder filtering in the notification projection; replace time-based unread inference with acknowledgements of stable derived keys, following the PO's confirmed identity/kind/deadline semantics. Legal work state and raw mail remain authoritative in their existing stores.

**Tech Stack:** Existing Go, Echo v5, pgx/v5, PostgreSQL, sqlc, Next.js 16.4.2, React 19, Zod, Vitest and Playwright; no dependency upgrade.

**Spec:** [Proposed design](../specs/2026-11-12-notification-mail-review-fixes-design.md), [review and reproduction evidence](../../testing/dev-commit-review-20261112-r1/report.md), and `docs/implementation/tasks/MC-ZCODE-NOTIF-MAILPITCH-20261110.md`.

## Global Constraints

- Synthetic data only. No tokens, credentials, mail bytes or legal content in Git or evidence.
- No new dependencies, provider integration, global configuration, paid services, deployment or production-readiness claim.
- Preserve existing Form Automation, term-sheet and skills edits. In particular, `0020_form_automation.sql` already exists uncommitted; do not reuse or rewrite that migration number.
- Use append-only migration files and sqlc generation; never hand-edit generated Go.
- Preserve independent business state axes, per-request authorization, atomic mail receipts and same-key unknown-outcome recovery.
- Planning authority does not include commit/merge/push or permission to run a destructive database action.

## Review Focus

1. A new notification arriving after a read must not be acknowledged by the older displayed batch: Task 4 service/HTTP tests.
2. Two tabs marking different batches must preserve both sets, user isolation and a monotonic timestamp: Task 4 PostgreSQL tests.
3. Large mail and lost/unusable responses must preserve the exact bytes/key without weakening origin/session checks: Task 2 route/component/browser tests.
4. One absent/invalid sent date must not hide other captured mail or invent a sent time: Task 1 parser/schema/render tests.
5. Terminal work must not remind, and time-only/kind/deadline changes must still produce the intended new unread keys: Tasks 3 and 4 domain/service tests.

## Pin, ownership and execution boundary

- Plan ID: MC-NOTIF-MAIL-REVIEW-FIX-20261112. Priority P1 overall; F-04 is P2. Planning owner: actual Local Codex. Implementation owner: Local Codex only after user execution instruction; no external ZCode/OpenCode invocation is claimed. Reviewer: a fresh non-author reviewer selected during handoff.
- Actual checkout: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `develop`, upstream `origin/codex/unified-project-flow`, HEAD `d04491fa260686eafbe47d8d04fb3384b28378d3`. Reviewed base: `b851dec4154ef68518fc5d505c13f068ea669858`. Recheck all refs before implementation; HEAD does not identify the dirty tree.
- [Planning context](2026-11-12-notification-mail-review-fixes-context.json) records SHA-256 of 24 current target files and the dirty status at planning time. The earlier `source-manifest.json` pins committed review bytes. Neither permits overwriting later edits.
- Preferred execution checkout: a single isolated worktree at `/private/tmp/matter-control-notif-mail-fixes-20261112`, suggested branch `fix/notification-mail-review-20261112`, starting from the reviewed HEAD after rechecking refs. Use `superpowers:using-git-worktrees` at execution time; neither path nor branch has been created by planning. Do not stash/reset the primary checkout or silently include dirty Form Automation.
- This isolated baseline's next free migration is 0020, but reserve it for the existing primary Form Automation assignment. Use `0021_notification_acknowledgements.sql` only after verifying no newer writer has claimed 0021; renumber before generation if necessary. Test both reviewed baseline + 0021 and the exact reconciled 0020 + 0021 source manifest before integration.
- Read root/component AGENTS and matching core/persistence/HTTP/test/frontend rules before edits. `docs/ai-sdlc/current-workflow.md` and `project-status.md` are absent; do not invent them or resurrect historical statuses.
- No commits during this assignment. Each task ends with reviewable diff/evidence. Suggested logical commit boundaries are the task boundaries if the user later authorizes commits.

## Scope and order

One bounded remediation wave with two independently verifiable tracks: mail (Tasks 1–2), notifications (Tasks 3–4). Suggested order: **F-03 -> F-02 -> F-04 -> F-01 -> final verification**. F-01 is last because it changes the seen contract and storage. The PO has confirmed its identity/kind/deadline semantics. All tasks await review of this complete plan and a user execution instruction; no execution is inferred from that semantic choice.

### Task 1: F-03/P1 — preserve missing sent dates

**Requirements/owner:** F-03, J10, REQ-MC-P0-17; assigned implementation owner above. No database migration or backend behavior change.

**Files:**

- Modify: `apps/frontend/src/features/mail/schemas.ts`, `components/mail-panel.tsx`, `components/mail-panel.test.tsx`.
- Create: `apps/frontend/src/features/mail/schemas.test.ts`.
- Extend: `apps/backend/internal/core/service/mail_parse_test.go`.
- Input: `docs/testing/dev-commit-review-20261112-r1/repro/apps/frontend/src/features/mail/review-contract.test.ts` and the paired Go parser probe.

**Interfaces:** `MailItem.sentAt: string | null`; `MailPanel({matterId, items}: {matterId: string; items: MailItem[]})` unchanged. Backend continues serializing nullable `mailBody.SentAt`; no fabricated Date.

- [ ] **Step 1 — Add regression tests.** Port the existing null-date schema probe. Add named tests `accepts mixed dated and undated captured mail` and `renders an explicit unavailable sent date without hiding dated mail`: parse two rows, one `sentAt:null`, one actual date; assert both document links render and only the undated row contains the missing-date label. Table-test absent and malformed Date in `TestParseEml`, asserting successful parse and `SentAt == nil` (this backend guard already passes).
- [ ] **Step 2 — Observe the frontend regression fail for the expected schema/render reason.** From `apps/frontend`: `rtk proxy pnpm test src/features/mail/schemas.test.ts src/features/mail/components/mail-panel.test.tsx`. Keep the red log; a missing file/dependency is not the intended failure.
- [ ] **Step 3 — Apply the minimal fix.** Change only `sentAt` to `z.string().nullable()` and conditionally render the actual `LocalizedInstant` or `Sent date unavailable` / `Không có ngày gửi`. Keep `createdAt` separate. Update affected fixtures/types; do not widen all timestamps or suppress page validation.
- [ ] **Step 4 — Verify and hand off.** Repeat targeted frontend tests; from `apps/backend` run `rtk proxy go test ./internal/core/service -run 'TestParseEml' -count=1`. Expected PASS, including existing dated cases. Record files/checks/evidence in the fix return; proposed status IN_REVIEW, not DONE.

### Task 2: F-02/P1 — bypass the Server Action body hop

**Requirements/dependencies:** F-02, J10; preserve Task 1's date type and labels. Reuse the direct-fetch structure in `features/proof/components/document-forms.tsx`; no general upload framework.

**Files:**

- Modify: `apps/frontend/src/features/mail/components/mail-panel.tsx`, `components/mail-panel.test.tsx`.
- Create: `apps/frontend/src/features/mail/client-repository.ts`, `client-repository.test.ts`; modify `features/mail/schemas.ts` only for the upload result schema/type. This repository owns browser fetch and keeps components compliant with R-FEAT-4.
- Modify only where validation/tests require: `apps/frontend/src/app/api/matters/[matterId]/mail-intake/route.ts`.
- Create: `apps/frontend/src/app/api/matters/[matterId]/mail-intake/route.test.ts`.
- Remove after exhaustive caller/type search and migration: `apps/frontend/src/features/mail/actions.ts` (including `uploadEmlAction` and its exported type).
- Keep: `features/mail/repository.ts`, `schemas.ts` limits, `next.config.ts` global action limit; no unrelated refactor.

**Interfaces:** `mailUploadRepository.intake(matterId: string, file: File, idempotencyKey: string): Promise<MailUploadOutcome>` in `client-repository.ts`; browser POST `/api/matters/${matterId}/mail-intake`, multipart `file` + `direction=INBOUND`, header `Idempotency-Key`; origin/cookie are browser-managed. `mailUploadOutcomeSchema` in `schemas.ts` validates a discriminated success `{ok:true,documentId,versionId,mailId,replayed}` or the house failure kinds, error string and optional retry/field-error metadata; derive `MailUploadOutcome` there. No server repository/config/auth module is imported into the browser.

- [ ] **Step 1 — Replace mocked-action tests with transport tests.** Stub `globalThis.fetch`, select a File and submit; assert exactly one same-origin BFF request, multipart contains the same bytes, the key is UUIDv7 and no manual multipart Content-Type is set. Add cases for >1 MiB (2 MiB), exactly `MAX_EML_BYTES=25*1024*1024`, and max+1; max+1 must make zero fetch calls. The old component must fail the direct-fetch assertion.
- [ ] **Step 2 — Add BFF negative and replay tests.** Use the existing node-environment route-test pattern. Wrong/missing Origin -> 403; missing session -> 401; invalid matter path, key, extension, missing File and oversize -> refusal before backend intake. Success forwards byte-identical File, normalized valid direction and the same key. Test `outcome-unknown` preserves `retrySameKey:true`. Mock at the repository boundary; assertions here are not proof of full ingestion.
- [ ] **Step 3 — Implement direct upload and preserve retry.** The client repository validates the matter ID with the existing browser-safe `idSchema`, constructs the FormData and performs the direct BFF request. `MailPanel.submit` calls that repository, not fetch or a Server Action. Validate success/error JSON with `mailUploadOutcomeSchema`; never turn malformed 2xx/5xx or a transport exception into a confirmed failure. Retain file/key for explicit retry on unknown; a new selected file creates a new key. Preserve button pending/error/success behavior and `router.refresh()` after confirmed success. Keep origin/session/raw-byte backend forwarding checks in the route.
- [ ] **Step 4 — Delete the now-unused action module and update all imports/tests.** First run `rtk proxy rg -n 'uploadEmlAction|MailUploadOutcome' apps/frontend/src`. Remove every product caller/type reference; leave immutable review evidence untouched. Do not add a pass-through replacement action. No new reload persistence or automatic retry.
- [ ] **Step 5 — Verify transport/error cases.** Run `rtk proxy pnpm test src/features/mail/client-repository.test.ts src/features/mail/components/mail-panel.test.tsx 'src/app/api/matters/[matterId]/mail-intake/route.test.ts'`. Exercise unknown response followed by replay: identical key on both attempts, then key reset after success; new file uses a different key. Test 401/403 display without a backend write, and prevent changing the selected intent while submission is pending. Record PASS or actual blockers and hand off IN_REVIEW.

### Task 3: F-04/P2 — exclude terminal work from reminders

**Requirements/dependencies:** F-04, REQ-MC-P0-03/04; independent of mail and acknowledgement persistence.

**Files:** modify `apps/backend/internal/core/domain/matter/notifications.go` and `notifications_test.go`. Read `derive.go` (`TimingOf`) and `workgraph.go` (`WorkItem.Terminal`) as the shared semantics; do not edit shared agenda behavior.

**Interfaces:** keep `DeriveNotifications(agenda []AgendaEntry, actions MyActions, queue ReviewQueue, now time.Time) []Notification` unchanged.

- [ ] **Step 1 — Add a table-driven regression.** Port `TestReviewTerminalWorkDoesNotProduceDueSoon`; use actual `TimingOf` results. COMPLETED/CANCELLED with due +1h -> no reminder; NOT_STARTED/IN_PROGRESS/WAITING with due +1h -> DUE_SOON. Past active work -> OVERDUE. A future milestone -> DUE_SOON; a past milestone -> no OVERDUE. Keep existing exact-now/48-hour boundary expectations.
- [ ] **Step 2 — Run red.** From `apps/backend`: `rtk proxy go test ./internal/core/domain/matter -run 'Test.*Notification' -count=1`. Expected failure for COMPLETED and CANCELLED, not fixture validation.
- [ ] **Step 3 — Add the terminal-work guard before agenda reminder derivation.** Interpret work execution through the existing domain type/terminal predicate; skip only work with COMPLETED/CANCELLED. Do not filter milestones by work execution, change `TimingOf`, mutate the agenda or alter the due-soon window.
- [ ] **Step 4 — Run green and hand off.** Repeat the notification tests and existing workgraph/agenda regressions. Expected PASS with active/milestone behavior unchanged. Proposed status IN_REVIEW.

### Task 4: F-01/P1 — stable per-user notification acknowledgement

**Gate/dependencies:** The PO selected identity-based seen semantics on 2026-11-12. Apply Task 3 before pinning notification keys. Present the one-time upgrade unread reset during plan review; do not claim every blocked/unblocked recurrence is tracked. Execution still requires the complete plan review and a user instruction.

**Files and responsibilities:**

- `apps/backend/internal/core/domain/matter/notifications.go`, `notifications_test.go`: add `SeenKey string` and `Seen bool`; `NotificationSeenKey(n Notification) string` computes the key over `[ID, dueAtUTC]`; retain `CreatedAt` as computed-at metadata, never unread authority.
- `apps/backend/internal/core/port/notifications.go`: submitted keys/query limit and acknowledgement store contract.
- `apps/backend/internal/core/service/notification_service.go`; create `notification_service_test.go`: derive, bound response, load seen flags, reauthorize and intersect submitted keys.
- `apps/backend/internal/adapter/outbound/postgres/migrations_mattercontrol/0021_notification_acknowledgements.sql`: new acknowledgement relation; see migration reservation above.
- `queries_mattercontrol/notifications.sql`, `notification_mail_store.go`, `notification_seen_store_test.go`: parameterized batched acknowledgement lookup/upsert and atomic watermark update.
- `mcsqlc/models.go`, `mcsqlc/notifications.sql.go`: regenerate with sqlc; never hand-edit.
- `apps/backend/internal/adapter/inbound/productapi/notification_mail_handlers.go`; create `notification_mail_handlers_test.go`: explicit DTO fields, bounded keys/body validation and safe empty legacy body; reuse `parseLimit` from `server.go` without editing its unrelated dirty routes.
- `apps/backend/internal/adapter/outbound/postgres/b1_least_privilege_test.go`, `ops/adr006/db/b1-runtime-grants.sql`: exact runtime grant sync, preserving Form Automation changes during later integration.
- `apps/frontend/src/features/notifications/{schemas.ts,repository.ts,actions.ts}`, `components/{notification-bell.tsx,bell-button.tsx,notification-bell.test.tsx}`: use explicit seen flags, send only displayed keys, assert refreshed badge state. Create `schemas.test.ts` and `actions.test.ts`.
- `apps/backend/docs/api.md`, `docs/implementation/p0-zcode-execution/local-contract.md`: notification/mail contract addendum, safe legacy `{}` behavior, limits, migration/upgrade semantics. Update `apps/backend/docs/operations.md` for acknowledgement growth and coordinated rollout, without inventing retention.

**Exact interfaces proposed:**

```go
// Additional inbound primitives, alongside existing fields:
// ListNotificationsQuery.Limit int
// MarkNotificationsSeenCmd.Keys []string

type NotificationSeenStore interface {
    NotificationSeen(ctx context.Context, userID string) (*time.Time, error)
    SeenNotificationKeys(ctx context.Context, userID string, keys []string) ([]string, error)
    SetNotificationSeen(ctx context.Context, userID string, keys []string, at time.Time) error
}
// NotificationService signatures remain unchanged; input structs gain the fields above.
```

Frontend: `markSeenAction(keys: string[]): Promise<MarkSeenOutcome>`; `notificationsRepository.markSeen(keys: string[])`; `unreadOf(items: NotificationItem[]): number` counts `!item.seen`. `NotificationItem` gains required `seenKey` (64-hex) and `seen:boolean`. Keep `seenAt` only as last-action display metadata.

- [ ] **Step 1 — Pin domain and service regressions before implementation.** Key stays equal across t0/t2 with unchanged ID/due; equivalent instants in different zones match; due change/kind/new claim changes key; title change does not. Read t0 -> mark those keys at t1 -> read t2 yields unread=0; a newly added item remains unread=1. Repeat for all four kinds. Use the existing memory matter world, deterministic clock and a test-only acknowledgement store. Do not add a production memory adapter solely for tests.
- [ ] **Step 2 — Pin persistence/security regressions.** Extend the real PG test: user A acknowledging K does not affect B; repeated K creates no duplicate; two tabs acknowledging disjoint sets retain their union; older timestamps cannot regress the watermark; restart/reopen preserves seen; preexisting watermark-only user gets no fabricated keys. HTTP tests cover unauthenticated requests, malformed/over-200 keys, duplicates, `{}` safe no-op, explicit empty batch, current-access removal and a hidden key returning no existence signal. New-between-read-and-mark is not stored because only submitted keys may be acknowledged.
- [ ] **Step 3 — Run the intended red tests.** `rtk proxy go test ./internal/core/domain/matter ./internal/core/service ./internal/adapter/inbound/productapi -run 'Test.*Notification' -count=1`; separately run `rtk proxy go test ./internal/adapter/outbound/postgres -run 'TestNotificationSeenStore' -count=1` with a permitted task-owned MC_TEST_DATABASE_URL. A skipped PG suite does not complete this step.
- [ ] **Step 4 — Implement storage.** Add table `notification_acknowledgements(user_id UUID REFERENCES users, notification_key TEXT CHECK (...64 lowercase hex...), seen_at TIMESTAMPTZ NOT NULL, PRIMARY KEY(user_id,notification_key))`; no title/body/event payload. Add sqlc batch lookup using actor + current keys, and upsert via `unnest` with conflict handling. `SetNotificationSeen` runs key inserts plus existing watermark upsert in one explicit pgx transaction; use `GREATEST` for stored timestamps. Empty keys perform no acknowledgement mutation. Preserve historical 0018/0019 and the reserved 0020. Regenerate and inspect sqlc output. Standard SELECT/INSERT/UPDATE grants only; no DELETE grant or retention job.
- [ ] **Step 5 — Implement service and HTTP.** Derive stable keys after authorization. Apply validated 1..200 limit to sorted output, preserving candidate `total`; query acknowledgements only for returned keys and set `Seen`. For mark, validate actor and keys, rederive authorized candidates, intersect with submitted keys and atomically store only matching keys. Legacy missing keys and an empty intersection are safe no-ops. Never accept a client actor or suppress membership rechecks. Preserve GET's current read/error boundaries; no event feed/provider work.
- [ ] **Step 6 — Implement frontend and refreshed-state tests.** Replace timestamp unread comparison, validate required new row fields, pass displayed keys through the Server Action (small JSON only), and refresh after success. Add RTL rerender assertion for badge 1 -> 0 using refreshed `seen:true`; add an unseen new row -> badge 1. Verify failed mark keeps the unread badge and accessible error. Test action session failure makes no repository call; Zod validates the key array before forwarding. Label read-time metadata as computed time where shown rather than an event creation time.
- [ ] **Step 7 — Run green, document compatibility, hand off.** Repeat targeted Go/PG/frontend tests, `rtk proxy make sqlc-check`, and B1 grant tests. Expected PASS on fresh and preexisting-marker fixtures. Append the precise GET/POST examples, safe `{}` no-op, one-time unread reset, old-client refresh requirement and no-retention caveat. Proposed status IN_REVIEW pending independent final evidence.

### Task 5: verify the integrated fix candidate and return it for independent review

**Dependencies:** Tasks 1–4 complete and the F-01 design accepted; otherwise report partial completion with F-01 still waiting. Reviewer must be non-author and inspect the exact final manifest. No automatic DONE/release.

**Output paths:** `docs/testing/notif-mail-review-fix-20261112-r1/{return.md,source-manifest.json,commands/,logs/,screenshots/}`; task tracking under `docs/implementation/tasks/MC-NOTIF-MAIL-REVIEW-FIX-20261112.md` when execution is assigned. Preserve the original red evidence directory.

- [ ] **Step 1 — Run full source gates once on the final candidate.** Backend `rtk proxy make check` with a task-owned PG fixture; frontend `rtk proxy pnpm check` and `rtk proxy pnpm build:webpack`. Check target source hashes and dirty scope before and after. Backend checks without a DSN remain a separate unit-only result. If frontend dependencies are symlinked, compilation does not prove standalone packaging; verify normal dependency layout before claiming packaging readiness.
- [ ] **Step 2 — Execute a bounded real browser/API scenario.** Reuse the existing permitted E-2 walkthrough harness and `e2e/fixtures.ts` CSP discipline. Store a narrowly scoped verification script under this task's evidence commands; do not rewrite shared Playwright lifecycle or bootstrap IdP/credentials. Missing runtime/auth blocks this step. Authenticate with permitted synthetic users; browser request capture must show direct BFF upload and no File-bearing Server Action. Upload a valid 2 MiB message and one exactly 25 MiB, verify success, server receipt/document/version identifiers and matching SHA-256. Refuse 25 MiB+1 in both direct BFF and UI checks; exercise the configured lower-backend-cap refusal without changing global config.
- [ ] **Step 3 — Verify loss/seen/terminal/null-date behavior end to end.** Same-key retry after a deliberately lost response yields exactly one mail/document/version; mixed dated/undated messages remain visible. Bell mark -> refresh -> navigation/reload stays seen; introduce a new key -> unread=1; complete/cancel near-due work -> no reminder; milestone reminder remains. Restart only the task-owned application against the retained fixture and confirm acknowledgements persist. Test another user and revoked membership with no cross-user/content leak. Retain redacted screenshots/receipts, not raw mail/auth data.
- [ ] **Step 4 — Reconcile source with the primary dirty tree for review.** Return a narrow patch/source manifest; compare migration reservations and overlapping grants/models/docs before applying anything. Do not copy whole files over Form Automation. If the primary owner requests integration, rerun required gates on the exact combined manifest including 0020 + the new migration; isolated-branch PASS does not certify the combined checkout.
- [ ] **Step 5 — Independent review and status.** Reviewer verifies all four acceptance rows and final pin. Record actual tool/agent identity, base/head, hashes, changed files, red/green outputs, PG executed/skipped, browser/auth details and residual risks. Author submits IN_REVIEW; failed gates -> REWORK_REQUIRED/BLOCKED with reason. Mark DONE only after actual independent acceptance and the project's applicable approval gates. Do not commit/merge/push/deploy by inference.

## Acceptance matrix and planning self-review

| Finding | Fix/test owner task | Required evidence |
| --- | --- | --- |
| F-01/P1 | Task 4 | Stable key tests, service read-mark-read, SQL persistence/concurrency/isolation, refreshed badge, real browser + restart |
| F-02/P1 | Task 2 | Direct-fetch failure before fix, BFF guards, 2 MiB/max/max+1, exact bytes/hash, same-key lost-response replay |
| F-03/P1 | Task 1 | Nullable schema regression, parser guard, mixed list render, explicit absent-date label |
| F-04/P2 | Task 3 | Terminal cases red -> green, active-work/milestone and original boundary regressions |

Planning self-review: all four findings and five review-focus conditions map to tasks; API/type names agree across the proposed interfaces; generated files/grants/docs/callers are accounted for; task/branch/migration collision checks are explicit. F-01's confirmed semantic choice is distinguished from proposed storage/upgrade implementation decisions. The feature-local client repository keeps upload fetch out of components as required by R-FEAT-4. No product code or infrastructure was changed during planning.

Skipped: implementation, test reruns and runtime provisioning during this planning turn. Remaining risk: the one-time upgrade unread reset awaits plan review; live PostgreSQL/IdP evidence and reconciliation with the dirty Form Automation tree remain execution gates.
