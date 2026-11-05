# Project check and manual runtime — 2026-11-01

- Task: `MC-CODEX-PROJECT-LOCAL-20261101`; actual Local Codex.
- Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
- Branch/head: `codex/unified-project-flow`, `64b9e0315e210953d7a7eaeacc0643b269a14ad9` plus the existing dirty changes. Seven commits ahead of the local remote-tracking reference; no fetch, commit or push in this task.
- Result: **LOCAL_MANUAL_READY / IN_REVIEW_WITH_KNOWN_TEST_FAILURES**. This is a source/build/local-health check, not exhaustive independent security, browser-business or release acceptance.

## Candidate and change coverage

The inspected candidate includes the business-flow and Liquid Form changes, D-9 PACKAGE/SIGNATURE/OUTCOME semantics, migration 0011 and its safe Down, combined Filing refusal copy, backup retention correction, and the existing uncommitted Brief replay, release-preflight and command-palette changes. Existing source work was preserved byte-for-byte.

`inputs.json` pins 4,257 application/component-repository files, including local agent support files. The closing comparison found zero changed or missing pinned files and unchanged HEAD. This is not an inventory of all historical governance evidence. The runtime was built from this isolated copy, not the stale `.next` in the primary checkout.

## Fresh checks

| Check | Result |
| --- | --- |
| Backend `make check` | PASS: sqlc consistency, gofmt, tidy, lint (0 issues), race tests; 14 test-bearing packages pass. PostgreSQL fixture was configured and exercised. |
| Frontend type generation/typecheck, ESLint | PASS, before format stopped the composite check. |
| Frontend formatting | FAIL: one existing Mimosa history JSON and `filing-guard-copy.test.tsx`. No immutable log was rewritten. |
| Complete frontend unit suite | 842 PASS / 1 FAIL / 12 SKIP; 101 files pass, 1 fails, 1 skips. |
| Release-preflight unit and real-main wiring tests | 8/8 PASS. |
| Deployment profile renderer tests | 6/6 PASS; no cloud deployment. |
| Production Webpack build and CSS guard | PASS, including the final Cloud-auth runtime build. |
| Agent configuration consistency | PASS: 17 skills, 3 scoped rules. |
| Git whitespace check | PASS. |

The frontend failure is an outdated assertion in `src/app/(app)/matters/[matterId]/work/[itemId]/page.test.tsx:186`: it expects `Package and signature readiness`, while the D-9 implementation now renders `Package readiness` and separates signature readiness. This task did not weaken assertions or change application source to conceal the failure.

The first backend gate failed because the initial snapshot lacked the expected repository-relative `ops/adr006` layout for the B1 operator-SQL synchronization test. A new snapshot with `project/apps/backend` and the matching operator SQL was created; the complete gate then passed. Both attempts are retained. The first non-escalated backend build was denied access to the Go cache; the permitted retry passed.

pnpm initially attempted its default dependency verification/install before scripts, then refused the symlinked snapshot `node_modules` directory. Subsequent commands used `verifyDepsBeforeRun: false` in the snapshot only, following the installed-version documentation. No install or relink was intentionally performed, and no source dependency/lockfile changed. Standalone tracing warns about dependency files outside the snapshot root; this local runtime uses `next start`, not an exported/deployed standalone bundle.

## Source observations still open

1. The uncommitted `ActionAnnouncer` is not mounted or called anywhere in application source. G7 shell-wide announcements remain incomplete; existing local live regions do not prove that new integration is finished.
2. The command-palette trigger has its text hidden below `sm` and marks its Search icon `aria-hidden`, without a persistent accessible label. Mobile accessible naming needs correction and a focused regression test. This is a source observation, not a completed accessibility audit.
3. Latest fix-wave units are author changes or local checks; their findings must not be automatically promoted to independently accepted/closed merely because this runtime starts.

## Running manual environment

- Frontend: **http://localhost:3000/login**, opened and visually observed in the in-app browser. Root returns 307 to `/my-actions`.
- API: `http://127.0.0.1:8081`; `/healthz` and `/readyz` return 200.
- Auth: existing approved ZITADEL Cloud profile, PKCE S256 and callback `http://localhost:3000/api/auth/callback`. `/api/auth/session` reports `authenticated:false` before user login. The user enters the synthetic account password themselves; no authenticated journey was executed by Codex.
- Current primary `.env.local` instead selects the retained local ZITADEL instance. A read-only probe reproduced its invalid callback registration (HTTP 400, missing `redirect_uri` registration). No local or Cloud IdP administration was performed. Only the isolated runtime uses the previously approved Cloud profile.
- New container: `mc-codex-manual-20261101`, label `mc.task=MC-CODEX-MANUAL-20261101`, loopback PostgreSQL `55441`, image `postgres:18.6-alpine`, 768 MiB / 2 CPU / 256 PID cap.
- `mc_manual` is a fresh restored copy of `mc-p0-claude-pg/mc_p0_run`; migrations 10 and 11 applied only to the copy. Verified after migration: **4 workspaces, 5 matters, 2 document-version records, 2 Cloud-mapped users**. Original database retained at schema 9; its rows were not changed.
- `mc_check` is a separate database for the test suite in the new container. No tests target the retained manual database.
- New document bytes go into this runtime's private object directory. **The two prior document-version records refer to object bytes formerly under `/tmp`, which are no longer available after the host restart.** Their original bytes were not invented or replaced. Historical downloads may fail; new upload/download can be tested.
- Node BFF uses the existing local memory profile: restarting it requires sign-in again.

Private run location: `/private/tmp/mc-manual-20261101-3gg7hq8j` (0700). Configuration/dump/logs remain private; credentials are not in this public report. Process wrapper IDs are in `runtime-processes.json`; observed listener PIDs: backend **12838**, frontend **12839**, both bound to loopback. The retained source DB container was started for the clone and remains running; no unrelated containers were stopped/deleted. Runtime and fixture resources are retained for manual testing.

## Manual checks to perform

1. Sign in with the previously used verified Cloud synthetic account; confirm My Work, Workspace and Matter lists.
2. Test creation dialogs, EN/VI, light/dark, narrow layout and command-palette keyboard/focus behavior.
3. Test Filing package/signature criteria separately, submission refusal copy, and outcome verification after the authority decision.
4. Upload a fresh synthetic document, download it, and test assigned independent review with the second synthetic user.

No real human login, authenticated Golden Workflow, screen-reader trial, restore rerun, Worker/cloud/provider deployment, production-cost assertion or release acceptance was performed. No application source, existing evidence, account policy or Git history was changed. Remaining risk: known frontend failures/accessibility gaps and missing pre-reboot object bytes; local readiness does not close those gates.
