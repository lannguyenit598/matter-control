# Codex review — Claude people/membership/Matter UX r1

Verdict: **CHANGES_REQUIRED**. Reviewer: actual Local Codex, nonauthor of this Claude delta; author of earlier baseline work, not an external OpenCode review. Branch codex/unified-project-flow; HEAD 20feedbf06c859a9806055d609f5b132fe8bb086. All 278 author-manifest entries match at opening and closing; no source drift. No primary source change, commit, push or runtime mutation.

What this change does: Claude implemented a radio-based searchable person picker, bounded authenticated workspace lookup, contextual membership/create dialogs, unified lists, and layout-persistent Matter tabs. Existing command/auth checks remain in place; no architecture/dependency migration.

## Must fix

### UXR-01 — P2: refreshed eligibility is ignored

Source: apps/frontend/src/features/matters/components/grant-matter-member-form.tsx:91 and apps/frontend/src/components/molecules/search-picker.tsx:81-113,128-131.

Reproduction on copied exact candidate: open add-to-Matter, select Alex with candidates=[Alex], then rerender the same Matter with a refreshed If-Match and candidates=[]. Alex remains checked and submit-ready. This models route refresh after another owner adds/removes that member. Changing the search callback only updates a ref; it neither re-runs the source nor reconciles chosen. The unconditional pinned choice also survives a new result that no longer contains it.

Fix: explicitly reconcile complete eligible candidates and invalidate removed choices on authoritative data refresh. Preserve unaffected role, pending/UNKNOWN and command state. Do not remount the entire IntentForm to reset this, and do not confuse absence from a name-filtered workspace search with ineligibility. Add a rerender regression for same Matter/new candidates+ETag. API authorization remains the enforcement; no unauthorized mutation was demonstrated, but the UI keeps offering a now-invalid selection after its requested reread.

### UXR-02 — P2: old query rows remain selectable

Source: apps/frontend/src/components/molecules/search-picker.tsx:128-131,254-268.

Reproduction: first query returns Alex; type Bao and leave its request pending. The status says Searching, but Alex remains an enabled radio from the old query. A user can select and submit the wrong person while expecting current results. Ignoring late responses does not prevent this retained-result issue.

Fix: show/enable only unselected rows bound to the current query. A previously selected person may stay pinned in a clearly separate selected state. Add a deferred-response regression; verify keyboard behavior too.

## Checks actually run

- pnpm check: exit0, **61 files / 572 tests pass**. The author-reported intermittent proof upload timeout did not occur in this one run; not declared fixed.
- pnpm build:webpack: exit0; compiled-CSS guard pass.
- Two independent reviewer regressions in an isolated current-source copy: **2 expected failures**, confirming UXR-01 and UXR-02. Probe source/log retained beside this return.
- 278/278 source pins matched twice. Source scope is the author's frontend-only manifest, not a whole-repository acceptance.

## Remaining verification / scope

Author Turbopack and Storybook build results are cited, not rerun. No browser-rendered/focus/touch/screen-reader, Cloud IdP, PG, production or human acceptance. No listener on localhost3000 was observed; candidate was not started. No backend changes were part of this delta. Keep status IN_REVIEW_WITH_VERIFICATION_BLOCKERS until fixes and browser evidence are supplied.

Claude follow-up: consume this review and reviewer-picker.test.tsx; correct UXR-01/02 narrowly, run the regressions plus existing close/reopen/UNKNOWN and access-loss tests, then pnpm check/build and refresh the source manifest. Do not lose existing drafts or clear unresolved command state merely to refresh the picker. Return an exact fix delta and runtime/browser limits. Do not commit/push.

Skipped: rendered/browser and backend/IdP/recovery tests. Remaining risk: stale eligible/query rows and unverified real-dialog behavior; no independent UI acceptance or release closure awarded.
