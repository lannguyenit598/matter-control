Task: MC-FOCUS-SEARCH-EGM-PLAN-20261101. Lens: implementation readiness, migration and rollback. Identity: actual Local Codex Goldfish subagent, BRAINSTORM, read-only.

Read completeness: COMPLETE. Read fully from the frozen root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/egm-focus-search-plan-20261101-r1/review-inputs`:

- `concepts_brief.md`
- `docs/requirements/focus-mode-brd.md`
- `docs/requirements/quick-search-brd.md`
- `docs/architecture/focus-search-codebase-design.md`
- `docs/architecture/focus-module-design.md`
- `docs/architecture/quick-search-module-design.md`
- `docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md`
- Both `apps/frontend/AGENTS.md` and `apps/backend/AGENTS.md`.

Selected frozen actual source read fully: frontend `auth-provider.ts`, auth session/logout routes, `sign-out-form.tsx`, app layout, client/server draft-scope components, `lib/mc/client.ts`; backend `matter_store.go` and migrations `0010_access_path_indexes.sql` / `0011_criterion_purpose_signature.sql`. Read the sibling manifest; all 38 frozen file hashes match it. Semble successfully searched the exact frozen root before source exploration. No live source, memory, other reviews or runtime evidence used.

The largest migration weakness is the missing bridge between “Search can be unavailable while ordinary functionality survives” and the operational path that applies its mandatory ICU-dependent migration before the API runs. The additive schema direction is sound; failure and rollback ordering need explicit instructions.

READY-01 — Major — Migration & Backward Compatibility: optional Search capability can become a mandatory startup prerequisite.

Affected frozen paths:

- `docs/architecture/quick-search-module-design.md:110–118`, especially line 116.
- `docs/architecture/quick-search-module-design.md:134`.
- `docs/architecture/focus-search-codebase-design.md:75`.
- `apps/backend/AGENTS.md:12–14`.

Evidence and hazard: the proposed Search support migration requires UTF8, ICU and creation privileges. The design says missing provider capability should leave Focus/navigation working, and a missing cursor key must not prevent existing endpoints from starting. Existing backend operating instructions say `make run` applies migrations first and compose starts migrate plus API. The frozen inputs do not establish how an unsupported Search migration avoids blocking that operational path. Cursor-key capability handling alone does not solve failed DDL.

Existing versus proposed: the current operating convention is documented; the Search migration does not yet exist. This is a conditional integration hazard, not a reproduced startup failure.

Minimum requirement: add a short ordering contract before implementation: preflight the exact migration under the intended migrator role on an owned disposable fixture; do not replace/restart the existing local API until migration succeeds; on failed preflight retain the working baseline and report Search’s exact blocker. If unsupported SQL capability must also be tolerated by a newly started API, specify how migration selection and Search capability detection achieve that without marking an unapplied migration successful. No deployment system or generic feature-flag framework is needed.

Counterargument: provider deployment is outside this local candidate. That appropriately defers Supabase proof, but the local candidate still needs an explicit failed-migration procedure.

READY-02 — Major — Migration & Backward Compatibility: logout cleanup needs a navigation-safe commit protocol.

Affected frozen paths:

- `docs/architecture/focus-module-design.md:117–127`.
- `docs/architecture/focus-module-design.md:151–155`.
- `docs/requirements/focus-mode-brd.md:73`, `96`.
- `apps/frontend/src/features/auth/components/sign-out-form.tsx:10–14`.
- `apps/frontend/src/app/api/auth/logout/route.ts:19–34`.

Evidence and hazard: current sign-out immediately submits a normal POST form and performs synchronous draft cleanup. The proposed Focus purge is an asynchronous IndexedDB transaction; state changes and notifications are acknowledged only after transaction completion. Merely adding a privacy event to the existing `onSubmit` can start cleanup and then unload its writer before commit/notification. The server logout route destroys the authenticated session, but cannot itself purge browser IndexedDB. Other already-visible tabs could therefore retain labels until their next validation, despite the immediate sibling-clear requirement.

Existing versus proposed: the existing form’s navigation behavior is confirmed from source. No Focus implementation exists, so the purge race is a design execution risk rather than a confirmed bug.

Minimum requirement: define the actual sign-out sequence and failure behavior. Clear local labels synchronously, invalidate pending validations, and arrange a bounded asynchronous coordination attempt before navigation; distinguish an acknowledged purge from unresolved storage failure. Logout must remain usable when storage fails. Add one real-browser case exercising the actual form submission/navigation with delayed or aborted IDB commit and a visible sibling, rather than testing only an in-memory `session-ended` callback.

Counterargument: the current browser tests broadly mention logout and aborted commits. Those are necessary, but the plan should explicitly connect them to native form navigation, where the lifecycle differs from an ordinary Focus End.

READY-03 — Major — Migration & Backward Compatibility: additive changes lack a concrete candidate rollback matrix.

Affected frozen paths:

- `concepts_brief.md:83–91`.
- `docs/architecture/focus-module-design.md:103–125`.
- `docs/architecture/quick-search-module-design.md:116–118`, `130–134`.
- `docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md:27`, `48`.

Evidence and hazard: the proposal introduces three independently surviving states: SQL function/collation, private browser current-session/fence, and encrypted cursors bound to deployment configuration/version. The handoff asks for resource cleanup and a manual runbook, but never states what happens when candidate code is reverted while its SQL objects remain, a timer is active in another tab, or an old cursor reaches the replacement backend. Baseline frontend source has no Focus cleanup listener, so simply restoring baseline files cannot clean the newly created browser record.

Existing versus proposed: the proposed SQL objects are additive and there is no legal-row backfill, making a safe rollback straightforward. No existing-client break is demonstrated. The gap is an actionable rollback procedure for the candidate’s new persistent state.

Minimum requirement: document and locally rehearse one bounded reversal:

1. Stop new candidate interactions and clear/terminate the owned synthetic Focus session through its acknowledged coordinator before replacing frontend code; preserve the content-free fence while stale candidate tabs remain.
2. Restore the reconciled baseline application/config without downgrading unrelated migrations; leave the new unused additive SQL objects in place for application rollback.
3. Treat old/rotated-key or unsupported-version cursors as a recoverable search refresh/unavailable state, without exposing payloads or affecting ordinary endpoints.
4. Reopen the candidate and verify no terminated session revives and baseline navigation/domain commands still work.

Specify unknown IDB schema/protocol behavior as fail-closed without automatic database deletion. For this first local candidate, a controlled close/reload of all owned test tabs is sufficient; elaborate rolling browser-version support is unnecessary.

No additional product decision is required to settle these three points. They can be engineering safety defaults inside the already selected private-current-session and additive-search scope. A product question arises only if the team wants to promise timer preservation through application rollback or simultaneous support for incompatible browser protocol versions.

Recommended minimum sequence: reconcile/pin source; prove migration compatibility and complete fingerprint cost; add the navigation-safe identity/privacy lifecycle; implement Focus and Search vertical paths; then rehearse candidate-to-baseline-to-candidate rollback alongside the existing domain/UNKNOWN regressions. Keep the current “one final local candidate” boundary.

Skipped: tests, builds, browser/provider execution, writes and Git mutations, as required by this read-only review.  
Remaining risk: these are source-backed implementation hazards; actual migration/startup and navigation-unload behavior remain unverified.
