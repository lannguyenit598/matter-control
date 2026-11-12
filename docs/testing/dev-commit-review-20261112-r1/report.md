# Latest develop commits: independent review and verification

Task: MC-DEV-COMMIT-REVIEW-20261112. Executor/reviewer: actual Local Codex, non-author review of the committed changes. Review date: 2026-11-12, Asia/Ho_Chi_Minh. Priority: P1. Review result: **REQUEST_CHANGES**. Proposed implementation status for MC-ZCODE-NOTIF-MAILPITCH-20261110: **REWORK_REQUIRED**; this report does not alter the author's task record or approve release.

## Pin and scope

- Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
- Actual local branch: `develop`; upstream: `origin/codex/unified-project-flow`. There is no fetched branch literally named `dev`.
- `rtk git fetch origin` succeeded. Local HEAD and the upstream both resolve to `d04491fa260686eafbe47d8d04fb3384b28378d3`.
- Reviewed range: `b851dec4154ef68518fc5d505c13f068ea669858..d04491fa260686eafbe47d8d04fb3384b28378d3` (the latest four commits on this line).
- Commits: `4dee45e7` (gitleaks configuration), `5a903401` (backend notifications/mail capture), `20e72306` (frontend notifications/mail capture), `d04491fa` (task/pitch/verification evidence).
- Requirement inputs: MC-ZCODE-NOTIF-MAILPITCH-20261110, REQ-MC-P0-03/04/17, J9/J10; notifications remain derived in-app reminders and mail capture remains a receipted document/envelope creation. No push provider, SMTP, or policy changes were reviewed or executed.
- Snapshot: `git archive d04491fa` extracted to `/private/tmp/matter-dev-review-w33kl9co`. All verification used committed source in that snapshot. Existing Form Automation, term-sheet and skill edits in the primary checkout were excluded and preserved.
- Read root/component instructions, RTK rules and the notification/mail task and author return. The root instructions reference `docs/ai-sdlc/current-workflow.md` and `project-status.md`, but those paths are absent from this checkout; no historical status was substituted for live Git/source evidence.
- No source fixes, commits, merges, pushes, provider actions or deployment were performed. Only this review evidence directory was added to the primary checkout.

## Required findings

### F-01 / P1: marking notifications seen cannot clear unchanged unread items

Location: `apps/backend/internal/core/domain/matter/notifications.go:115-120` (also the blocked/review constructors at lines 80 and 88); `apps/frontend/src/features/notifications/schemas.ts:35-38`.

Every read sets each notification's `CreatedAt` to the current derivation instant. The seen command records its own earlier instant, then the frontend refreshes and counts items with `createdAt > seenAt`. Therefore every unchanged item becomes unread again on that refresh. Stable notification IDs do not help because unread calculation ignores identity.

Reproduction: derive the same overdue item at t0, mark seen at t1, derive again at t2. The same ID has `CreatedAt=t2 > seenAt=t1`. `TestReviewSeenNotificationStaysSeenAfterRefresh` fails on the pinned source. The existing UI test only verifies that `router.refresh()` was called; it does not exercise refreshed data.

Required remedy: base seen/unread comparison on stable notification occurrence identity/time, including when time-derived reminders first become applicable. Updating timestamps on every read cannot implement this contract. Apply consistently to all four notification kinds and add a read -> mark -> read regression covering unchanged and genuinely new occurrences.

### F-02 / P1: the advertised 25 MiB mail upload is rejected above the Server Action limit

Location: `apps/frontend/src/features/mail/components/mail-panel.tsx:65-70`; `apps/frontend/src/features/mail/actions.ts:28-32`; `apps/frontend/next.config.ts`.

The client passes the entire File/FormData into `uploadEmlAction`. The action then forwards it to the BFF, but the initial browser-to-action request already carries the bytes. No `serverActions.bodySizeLimit` override exists; installed Next.js 16.4.2 enforces 1 MiB before action execution. This contradicts both UI/schema validation allowing 25 MiB and the comment that bytes never pass through the action body.

HTTP reproduction on the built snapshot, loopback port 3117, using the actual action ID from the build manifest:

- 194-byte synthetic `.eml`: HTTP 200 with the action's structured unauthenticated result (expected control; no credentials configured).
- 2,097,218-byte synthetic `.eml`: HTTP 500 Flight error; server logs `Body exceeded 1 MB limit`, internal `statusCode: 413`.
- Both requests target the same action; the large request fails during framework body parsing, before application authentication/upload handling. This is not an authenticated ingestion/E2E claim.

Required remedy: use the existing direct browser-to-BFF upload pattern used by document versions, retaining origin/session/size/idempotency validation and same-key recovery. Verify small uploads, a payload above 1 MiB, the configured maximum and a too-large refusal. Framework reference checked through Context7 plus installed runtime source: [Next.js Server Actions bodySizeLimit](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#bodysizelimit).

### F-03 / P1: one mail without a valid Date hides the entire mail panel

Location: `apps/frontend/src/features/mail/schemas.ts:19`; backend parser `apps/backend/internal/core/service/mail_parse.go:77-85`; HTTP DTO `notification_mail_handlers.go:106`.

The backend accepts an absent/unparseable Date and represents it as nullable `sentAt`. The frontend requires `sentAt: z.string()`. A single such row rejects the entire mail page schema; `mcRequest` reports an internal contract error and Documents renders mail only when `mailRead.ok`, hiding the whole mail card for that matter.

Reproduction: `TestReviewMailWithoutDateIsAccepted` passes with `SentAt=nil`; the paired frontend `review-contract.test.ts` fails for the corresponding response at `items[0].sentAt` (`expected string, received null`). The database migration also explicitly permits NULL.

Required remedy: preserve nullable Date in the frontend schema/type and render a labeled absence or a clearly labeled capture timestamp. Do not invent a sent date. Add a schema/render regression mixing dated and undated mail.

### F-04 / P2: completed/cancelled work still generates due-soon reminders

Location: `apps/backend/internal/core/domain/matter/notifications.go:71-72`.

The due-soon branch checks only the date, although agenda rows also contain `Execution`. Agenda intentionally retains terminal work, and `TimingOf` returns ON_TRACK for terminal items. A COMPLETED or CANCELLED work item whose recorded deadline is tomorrow therefore produces DUE_SOON and contributes to the bell's unread count despite no longer needing work.

Reproduction: `TestReviewTerminalWorkDoesNotProduceDueSoon` fails for both COMPLETED and CANCELLED, using the actual `TimingOf` output as input.

Required remedy: exclude terminal work rows before reminder derivation while retaining the approved milestone-date semantics. Add regressions for terminal work and active work/milestones.

## Verification actually executed

Tools: Go 1.27.4 darwin/arm64; golangci-lint 2.14.0; Node 24.22.1; pnpm 12.11.2; Next.js 16.4.2; Vitest 5.0.5; gitleaks 8.30.1.

| Command / scope | Result and limit |
| --- | --- |
| `rtk git fetch origin` | PASS; upstream pin confirmed |
| `rtk proxy make check` in snapshot backend | PASS, exit 0: sqlc generation comparison, gofmt, tidy diff, lint (0 issues), full race suite. Initial sandbox attempt could not resolve proxy.golang.org; approved rerun succeeded. PostgreSQL-dependent cases skipped because MC_TEST_DATABASE_URL was unset. |
| `rtk proxy pnpm check` in snapshot frontend | PASS, exit 0: typegen/tsc, ESLint, Prettier, 966 unit tests passed, 12 skipped; 127 test files passed, 1 skipped; agent config check passed. Completed before adding reproduction tests. |
| `rtk proxy node node_modules/next/dist/bin/next build --webpack` | PASS, exit 0: compile/typecheck/prerender. Standalone tracing warned about 27 external dependency paths due to the temporary node_modules symlink; standalone packaging/runtime completeness was not verified. |
| `rtk proxy node scripts/check-built-css.mjs` | PASS, exit 0; 2 assets, required layout/accessibility/theme utilities present |
| `rtk proxy go test -count=1 -run '^TestReview' ./internal/core/domain/matter ./internal/core/service` | Expected FAIL, exit 1: F-01 and F-04 reproduced; backend undated-mail parser probe passed |
| `rtk proxy node node_modules/vitest/vitest.mjs run src/features/mail/review-contract.test.ts` | Expected FAIL, exit 1: F-03 reproduced |
| `rtk proxy python3 /private/tmp/matter-dev-review-w33kl9co/upload-probe.py` | PASS, exit 0: asserts small request reaches action and large request fails; F-02 server error observed. Raw synthetic response excerpts retained in upload-http-probe.json. |
| `rtk proxy gitleaks git --log-opts=b851dec4..d04491fa --redact --no-banner --report-format json --report-path /private/tmp/matter-dev-review-w33kl9co/gitleaks-latest.json .` | PASS, exit 0: 4 commits, approximately 167 KB, no findings. This does not assert a clean full repository history or independently re-adjudicate prior allowlists. |

The snapshot reused installed frontend dependencies via a symlink; pnpm emitted an auto-install warning because its hoist directory was not a real directory, then completed every check successfully. A fresh lockfile installation was not tested. Reproduction files were added only after baseline checks, so their expected failures are separate from the existing suite result.

## Evidence and handoff

`source-manifest.json` pins 49 reviewed changed text files to the commit; `repro/` contains the added failing regression tests and the successful parser probe; `upload-probe.py` and `upload-http-probe.json` retain the synthetic HTTP probe. The test sources are copied evidence, not additions to the product test suite. `backend-reproduction-rerun.log` records the confirmed Go failures after an approved rerun; `backend-reproduction.log` retains an intervening sandbox/cache setup failure and is not defect evidence. `frontend-reproduction.log` records the schema failure. Command results above are recorded from observed tool outputs; full console transcripts for baseline checks were not persisted.

For reproduction, extract the same Git commit into a disposable directory, copy each `repro/` file to its original path, reuse/install matching dependencies, then run the targeted commands above. For HTTP, build before copying reproduction tests, run the built frontend on loopback with `API_MODE=rest` and `API_BASE_URL=http://127.0.0.1:39999/api/v1`, no real IdP/session, and execute `upload-probe.py` from the snapshot root. Stop that server afterward; the review server was stopped with exit 130 and no product data was written.

Acceptance for this review: committed scope pinned, implementation and author verification inspected, baseline gates rerun where available, four findings reproduced, evidence retained. Implementation acceptance remains unmet pending fixes and independent re-verification. A report is not a completed implementation or release approval.

Skipped: uncommitted source, unrelated Dependabot branches, live PostgreSQL/B1 integration, authenticated browser/IdP/E2E, accessibility/human usability, restore/deployment and full-history secret rescanning. Docker socket was absent; no PostgreSQL executables or test DSN were available. No daemon startup, global settings changes or credential access was attempted.

Remaining risk: baseline green checks do not cover the four demonstrated user-visible failures; pilot/release readiness remains unverified.
