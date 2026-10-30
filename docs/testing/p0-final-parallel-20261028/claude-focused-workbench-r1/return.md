# MC-P0-UX-FOCUSED-WORKBENCH — return (author verification)

- Task: `docs/implementation/tasks/MC-P0-UX-FOCUSED-WORKBENCH.md`. Agent: actual Claude Code (`claude-sonnet-5-5`), continuing the same session. No external agent was invoked.
- Branch `codex/unified-project-flow`. Intake HEAD = final HEAD = `20feedbf06c859a9806055d609f5b132fe8bb086`; the tree is dirty with Codex and earlier Claude work. **Nothing committed, pushed or deployed.**
- Proposed status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS** (see "Not verified").

## 1. Intake map

| Area | State at intake | Action |
|---|---|---|
| Module `leonx.me/matter-control`, backend hardening, R2 adapter | present | verified `go.mod`; not touched |
| Action-entry mechanisms (`TaskDialog`, `TaskSuccess`, `UnresolvedReporter`, `TaskChoice`, Data chooser, `/filings/new`) | implemented | **reused**, verification only (browser, section 4) |
| Frontend Dockerfile / standalone | present | preserved |
| My Actions | four stacked card sections | **rebuilt** as focused workbench |
| Matter overview | members + full history | **adjusted**: causes and own next step first, history collapsed |
| Navigation | "Workspaces", "My Actions" | **adjusted** labels and order: My Work, Matters |
| TB-12 | `API_MODE` unset defaulted to demo with a fake session in a production server | **added** fail-closed guard |
| Matter titles on `/me/actions` | missing from the read model | **backend request** (`backend-requests.md`), interim bounded server reads |
| Completed-work evidence-assessment journey | not exercised | **not verified** |

## 2. What changed (source manifest: `source-manifest.json`, 25 files, 6 new)

- **My Work** (`features/work/my-work-selection.ts`, `components/my-actions-view.tsx`, `app/(app)/my-actions/page.tsx`): queue rail (Ready / Waiting / Blocked / History with returned list lengths, never a total), one current item (Matter name, title, due, reason, one primary action, expected outcome), Up next (at most 3), Previous/Next, disclosures. The whole selection is in the URL (`?queue=&item=`), and every outgoing link carries it as `from`, so Back returns to the same item. A moved item is followed with a notice; a vanished one is explained and the list stays usable. Blocked items name the unsatisfied prerequisites as links, with worded reasons (no raw codes). EN/VI complete for touched strings.
- **Matter overview** (`components/matter-attention.tsx`, Matter page): "Blocked here" (blocked Actions, exact `Showing n of N` or an honest "there may be more", link to the filtered Work grid) and "Your work here" (own next step and per-queue counts). Each read fails separately and says so. History is collapsed and shows member names instead of raw user ids (`actorNames`, also on `/history`).
- **Shell**: My Work first, Matters second (`/workspaces` retained as the route); Matters stays highlighted inside a matter (`alsoActiveFor`).
- **TB-12** (`lib/env.ts`): a production server (`NODE_ENV=production`, phase other than `phase-production-build`) refuses unset or `demo` `API_MODE` at start-up. `playwright.config.ts` now always uses `pnpm dev` (the template e2e are demo-mode and would be refused by `pnpm start`).
- **Prerender hygiene found by the browser run**: `getSession()` read the clock before any request-time API, producing a Next error on every section in dev. Fixed once at the source with `awaitRequest()` (`lib/request-time.ts`, a one-line wrapper over `connection()`); also in `AccountMenu` and `DraftScope`. The Data page is now wrapped in `<Suspense>`. Unit tests replace the wrapper in `src/test/setup.ts`.

## 3. Journeys (real API, real ZITADEL Cloud session of synthetic user A, `API_MODE=rest`)

1. **Ready Action → command → readback → return.** My Work → Open task → completed with reason and completion time. The server first refused the change three times with its own messages (reason, completion time, future time) and "Nothing was changed" was shown; then "Saved", execution read back as Completed. Back returned to `?queue=ready&item=…`; that item had moved to History and was followed with the moved notice; Ready/Blocked/History counts changed 2/1/0 → 2/0/1 and the previously blocked item became the first Ready item.
2. **Blocked → causal prerequisite → return.** A prerequisite was added through the real dependency form; the item appeared under Blocked with its prerequisite as a link and a worded cause; the Matter overview listed it under "Blocked here" with `1 prerequisite not satisfied`.
3. **Completed work → exact-version evidence assessment: NOT EXERCISED.** No proof/document flow was run and no verifier right was granted.

## 4. Browser observations (Playwright Chromium 156, headed, persistent profile; synthetic data only)

- 1280 / 390 / 320 px: My Work (ready, blocked), Matter overview and the eight Matter sections: **no horizontal overflow**; no inputs open on landing (Work keeps its filter bar); console clean after the fixes above.
- Add-work dialog at 320×560: bounded (17→543 of 560 px), scrolls inside, submit reachable, Escape closes, **focus returns to the trigger**; same at 1280.
- Create Matter: opens from a button, title only, navigates to the real Matter with the "created" banner. Member dialog opens, picker is operable by keyboard and shows the honest empty state.
- Dark theme observed on My Work; Tab order reaches queue rail → Next → Open task with computed focus outlines.
- Screenshots: `screenshots/`.

## 5. Checks run (receipts: `receipts/`)

- `pnpm check`: typecheck, lint, format, **67 files / 631 tests passed**, agent config OK (last run).
- `pnpm build` and `pnpm build:webpack` succeeded; compiled-CSS guard passed on both. Exit codes were not captured by the receipt wrapper; success is shown by the output.
- TB-12 runtime: production standalone server **exits at start-up** without `API_MODE` (log line "API_MODE must be "rest"…"); with REST variables it serves `/login` 200 and `/my-actions` without a session shows only the sign-in prompt.
- New tests: `my-actions-view.test.tsx` (selection and view, 16), `matter-attention.test.tsx` (5), `nav-menu.test.tsx` (2), history actor names (1), TB-12 env cases (5). The three old `MyActionsView` cases were replaced by equivalents in the new file.

## 6. Not verified / risks

- **Flaky test, reproduced, not fixed:** `upload-attempt.test.tsx › a different file is a different intent` timed out at 5 s in 3 of about 8 full-suite runs this session; alone it takes 16 ms and passes; the last full run passed. The stall is not CPU cost (16 ms alone), so a green rerun is not proof. Cause not found; no waits were extended, no assertions removed.
- Member picker was seen only with its **empty** state: user B is not a workspace member, so candidate rows, duplicate-name differentiation and keyboard selection of a row were not observed in the browser (covered only by unit tests).
- Completed-work evidence journey, light/dark of every screen, 390/320 of every dialog, Vietnamese of untouched strings (e.g. the member "Remove" button, `My account`) and screen-reader behaviour: not checked.
- Storybook not run: no story was added or changed. Existing Playwright e2e are template/demo tests and were not used as product evidence.
- The local ZITADEL profile still rejects the registered redirect URIs (needs admin rights, outside this task); the ZITADEL Cloud profile was used instead.
- No independent review, QA, 10-second comprehension trial or release approval is claimed.

## 7. Runtime disposition (left running for review)

- Web `http://localhost:3000` (`next dev`, started by this session with the Cloud profile passed as process variables; `.env.local` untouched), API `127.0.0.1:8081` (binary built from the current tree into the session scratchpad), Playwright Chromium (CDP `9333`) already signed in as synthetic user A. Sessions live in process memory: restarting `next dev` signs out.
- Containers started with `docker start` only (volumes untouched): `mc-p0-claude-pg`, `mc-p0-idp-postgres-1`, `mc-p0-idp-zitadel-api-1`, `mc-p0-idp-zitadel-login-1`, `mc-p0-idp-proxy-1`. Stop only the processes above by their own PID; the containers can be stopped with `docker stop` (data retained).
- Synthetic data created in database `mc_p0_run`: Matter "m&a" (3 Actions, 1 dependency, one Action completed) and Matter "Atlas restructuring".

## 8. For Codex to review next

1. `backend-requests.md` (one additive field). 2. The `getSession()` change in `src/lib/auth.ts` and `lib/request-time.ts` (shared auth path). 3. The flaky upload test. 4. Whether `/workspaces` should be renamed to a Matters route later (labels only changed here). 5. Separate infrastructure backlog from ADR-004/005 is untouched.

**Skipped:** completed→evidence journey, real multi-person picker, Storybook, independent verification. **Remaining risk:** author checks only; shared auth change touches every request path.
