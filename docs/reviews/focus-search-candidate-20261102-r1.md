# Focus + Quick Search candidate — final source review

Task: MC-FOCUS-SEARCH-IMPLEMENTATION-20261101. Reviewer: actual Local Codex agent `focus_search_final_review`, a fresh-context nonauthor reviewer. This is not external OpenCode/ZCode or independent production QA. Priority: P1. Proposed status: **REWORK_REQUIRED** for the three findings below; runtime acceptance remains separate.

Scope: Focus coordinator/model/provider/transport and composition, Search browser/BFF/Go/SQL paths, cursor and authorization boundaries, shared privacy/read helpers, and focused tests. Requirements: FR-FOCUS-01..14 / AC-FOCUS-01..18 and QS-BR-001..007 / QS-AC-001..018, especially observed access loss, timing restoration and private result lifetime. Inputs: review request/manifests, implementation task and plan, Focus/Search BRDs, component rules and local contract revision 13 section 8. Acceptance for this review: pinned source inspected without repairs, actionable source locations and reproduction conditions, actual checks distinguished from runtime gaps.

Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Branch: `codex/unified-project-flow`. Base and opening/closing HEAD: `978d8fc694a47e9beee528076bcf1af9473997e3`, plus the pinned dirty candidate.

Opening and closing SHA-256 verification matched **all 656 files** in `docs/testing/focus-search-implementation-20261101-r1/review-source-manifest.json`; no source drift. Manifest SHA-256: `b38288fde908c272ac7f5815c06e6a57f1c3905e28c28d394228a3b53fe912c6`. Closing check: `2026-11-02T00:55:41.408647Z`. All 49 paths listed as removed in the delta still exist: these are manifest selection differences, not application deletions. Report path was absent before creation. The only authored output is this report.

## Findings

### FS-R1 — P1: Apply observed denial during Resume before returning refused

Location: `apps/frontend/src/features/work/focus/provider.tsx:280-286`; related error catch at lines 307-309.

Reproduction: start and pause Focus while the target is authorized, revoke its Matter access, then press Resume before the next background refresh. `readFocus` returns the explicit `access-lost` outcome from the BFF classifier. The dispatch branch returns `refused` for every non-eligible reply without clearing the previous target or terminating the stored session. The previous protected title remains visible and the resumable record remains intact until another refresh. The same branch ignores an `ineligible` outcome instead of persisting suspension. A 401/session-change error takes the generic catch, which hides only this tab's target and leaves the stored session and other tabs uninformed.

This contradicts FR-FOCUS-09/10/14 and AC-FOCUS-08/09: once the authoritative observation arrives, cleanup/suspension must happen immediately, not on a later poll. Reuse the established scoped outcome handling for dispatch as well as background synchronization: hide first, compare and fence only the captured session on access/session loss, propagate the appropriate invalidation, and persist suspension for a current ineligible response. Preserve the generation check so an old reply cannot clear a newer login. Add regressions for paused Resume returning `access-lost`, `ineligible`, and 401/session-change; include sibling notification and a delayed old-epoch reply.

Evidence level: **CONFIRMED_FROM_CODE**. The existing provider tests cover successful pause/revalidation and pending Start versus logout, not these refusal paths.

### FS-R2 — P2: Detect backward wall time before restoring a running session

Location: `apps/frontend/src/features/work/focus/provider.tsx:102-112` and `137-141`; supporting calculation in `model.ts:42-46` and clock initialization in `provider.tsx:214-217`.

Reproduction: create a 25-minute RUNNING session at wall time `1800000000000`, close/reload after moving wall time back one hour, and let the fresh eligibility read succeed. The restored record passes the expiry check and becomes active. `remaining` calculates 85 minutes because it subtracts the new wall time from the old deadline. The interval's clock baseline is initialized after restoration, so it never observes the earlier clock jump. The model's mutation-time guard at line 93 does not run on this restore path. Refocus can similarly lose the discontinuity when hidden-tab timer callbacks have already advanced the local baseline.

FR-FOCUS-07 and AC-FOCUS-16 require an explained suspension/reset on this detectable discontinuity. Check restored timing against `writtenAtWallMs` before publishing active state, and retain a bounded duration through the existing suspension mechanism. A provider restore regression is needed; the current backward-clock unit test exercises only `transition`, not restoration.

Evidence level: **CONFIRMED_FROM_CODE + EXECUTED_MODEL_VECTOR**. An in-memory TypeScript compilation of the actual model and its actual schema imports produced `initialMinutes:25, restoredMinutes:85` with assertions and exit 0. No application source or clock was changed. This is not a browser-clock experiment.

### FS-R3 — P2: Propagate session loss from Search pagination

Location: `apps/frontend/src/features/search/use-search.ts:132-142`.

Reproduction: keep an authorized Focus session and a successful Search page open, expire/change the login, then choose Show more. A paging 401 or `ui-session-changed` response sets only this hook's local `session-ended` state. Unlike the initial-search catch at lines 67-68, it never calls `notifyPrivateUi`. Focus and sibling private context therefore remain until their next independent check, and the query stays in the Search input because `SearchBody` clears it only on the missing scoped event.

Route this authoritative session-loss outcome through the same scoped notification used by initial searches, retaining the current sequence/key check before publishing it. Test paging failure with a private-scope listener and a concurrent Focus consumer, including an old request that finishes after the epoch changes. This is the same observed-session-loss requirement as AC-FOCUS-09 and Search's private-session isolation, not a request for faster background polling.

Evidence level: **CONFIRMED_FROM_CODE**. Existing Search tests cover stale query responses/IME/loading Enter but do not exercise authenticated pagination failure.

## Checks and retained boundaries

Executed from `apps/frontend` using the directly installed Vitest runner, with no install:

```sh
rtk proxy node node_modules/vitest/vitest.mjs run src/features/work/focus/model.test.ts src/features/work/focus/coordinator.test.ts src/features/work/focus/provider.test.tsx src/features/work/focus/transport.test.ts src/features/search/search.test.tsx src/lib/mc/private-ui-events.test.tsx --no-file-parallelism
```

Result: **6 files, 13 tests passed**, exit 0, 2.55 seconds. These passing tests do not cover the three findings. The model vector above also exited 0 and deliberately asserts the observed incorrect 85-minute value. Source-pin checks used SHA-256 on each manifest entry and read-only Git HEAD/branch inspection.

Source review found the following intended boundaries present: strict outgoing Focus target projection matches the BFF target schema; IDB mutation acknowledgment occurs on transaction completion, with generation/revision CAS and post-commit notification; Search SQL membership joins precede matching and limit, includes all matching projection/sort inputs in its fingerprint, and computes duplicate names before pagination; document search contains metadata rather than binary filenames/content; the cursor is authenticated encryption with actor/epoch/query/group/hint/limit binding and expiry; the read-POST exception is confined to exact Search while ordinary command UNKNOWN handling remains. These are source observations, not live SQL/browser guarantees or an exhaustive security certification.

The author-reported whole-project gates and browser observations in the request were not independently rerun or adopted as reviewer PASS. This review did not control runtimes, read credentials/private configs, access databases, use Docker/cloud/IdP/provider services, or commit/deploy. SQL normalization/performance/hidden-row equivalence, real IDB abort/unload/two-tab races, full wire runtime, mixed workload, browser keyboard/IME/focus/viewport checks, assistive technology, real IdP, and reversal/recovery remain **NOT_RUN by this reviewer**. The report is a completed nonauthor source review with requested rework, not release acceptance.

Skipped: source repairs, broad test/build reruns and runtime/provider acceptance. Remaining risk: explicit denial paths currently retain private state, and restored timing can stretch after a backward clock change; fix and verify these before accepting the candidate.
