Task: MC-FOCUS-SEARCH-EGM-PLAN-20261101. Lens: Long-Term Tech Debt & Maintainability. Actual reviewer: Local Codex Goldfish, BRAINSTORM, strictly read-only.

Review completeness: COMPLETE for the assigned reading set. Semble search succeeded against the exact frozen root. No memory, live application source, other review reports or subagents were used.

All locations below are relative to the frozen root:
`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/egm-focus-search-plan-20261101-r1/review-inputs`.

Fully read:

- `concepts_brief.md`, lines 1–109.
- `docs/requirements/focus-mode-brd.md`, lines 1–140.
- `docs/requirements/quick-search-brd.md`, lines 1–189.
- `docs/architecture/focus-search-codebase-design.md`, lines 1–106.
- `docs/architecture/focus-module-design.md`, lines 1–173.
- `docs/architecture/quick-search-module-design.md`, lines 1–166.
- `docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md`, lines 1–50.
- Both frozen component `AGENTS.md` files and the sibling `review-inputs-manifest.json`. Truncated required document ranges were recovered.

Source grounding included full reads of the frozen frontend layout, auth projection/session/logout routes, sign-out form, draft-scope server component, ReadFailure, shared HTTP client, Work repository and command palette; selected backend ranges covered `MyActions`, `readSnapshot`, Matter discovery and PostgreSQL read snapshots.

The architecture’s strongest choices survive this lens: separate Focus and Search modules, notification-only BroadcastChannel, transactional Focus mutations, server eligibility, search authorization before pagination, and preserving ordinary command UNKNOWN behavior. No separate search engine or global feature-state framework is justified.

The largest readiness weakness is the search fingerprint’s coupling to every authorized record, followed by lifecycle gaps at the shared privacy seam. These are proposed-design risks; no new runtime defect is claimed reproduced.

STRUCT-01 — Major — Whole-projection fingerprints couple a small search page to unrelated work across the actor’s entire readable estate.

Evidence: `quick-search-module-design.md:122–126` hashes the entire authorized searchable projection before the page limit. `:145` clears all business groups when any group becomes stale. The implementation handoff `:25` makes this mechanism mandatory, although `concepts_brief.md:34,71` explicitly calls it a choice to challenge.

Consequence: while searching for “Atlas”, a rename or insertion in an unrelated readable record can invalidate paging. A Work Item group becoming stale can also discard successful Workspace, Matter and Document lists. The user’s ability to finish a search therefore depends on unrelated colleagues’ activity. Every fresh query also pays for whole-projection serialization/hashing, independently of a five-row result limit.

Existing versus proposed: the frozen incumbent discovery code filters authorized headers in memory (`workspace_service.go:1000–1061`); it does not supply a cheap revision or fingerprint capable of supporting this new contract.

Minimum fix: retain honest reset-on-change semantics, but first evaluate a fingerprint of the complete authorized **matching result projection for that query**, including displayed context, ordering inputs and any membership facts necessary to reauthorize those results. Recheck authorization on every request. This still detects insertions, removals, renames and reorderings that affect the requested list, without making unrelated nonmatches invalidate it. Measure the complete query and fingerprint before locking the implementation.

Counterargument: whole-projection hashing offers a simple conservative proof. It can remain the selected local implementation if measured costs and interruption behavior are acceptable, but five-row paging is not evidence that the operation is bounded cheaply. Adding a trigram index alone would not remove the full fingerprint pass.

Maintainability requirement: consistency detection must have an explicit invalidation boundary; adding a metadata group must not silently broaden every search session’s reset triggers.

STRUCT-02 — Major — Focus refresh is coupled to rebuilding all accessible Work graphs in every visible tab.

Evidence: `focus-module-design.md:89–97,147` selects `/me/actions`, additional detail/name reads and independent successful-read freshness per visible tab. The actual `work_service.go:1253–1305` obtains readable Matters, loads each Matter graph, computes effective state and critical chains, walks assigned items and ranks the combined candidates.

Consequence: a timer for one Action repeatedly invokes an aggregate My Work computation. One/five visible-tab measurements are required, but the architecture currently fixes the aggregate endpoint before defining what happens if it cannot meet the proposed refresh window. This also makes timer availability sensitive to an unrelated readable Matter’s graph-read failure. Adding a BFF wrapper does not reduce this underlying work.

Existing versus proposed: aggregate My Work computation exists; 20-second independent-tab polling and the 30-second presentation bound are new.

Minimum fix: make the pre-UI checkpoint exercise the real aggregate path with representative graphs, tab count, name enrichment, latency and failures. State the fallback engineering choice in the plan: a narrow Go eligibility read reusing the same classifier/domain rules, if measurements reject aggregate polling. Do not duplicate eligibility rules in the browser or introduce an independent authorization cache. Keep the existing endpoint for initial ordered candidate selection if appropriate.

Counterargument: aggregate reads can be entirely adequate at W1, and the design already requests measurements. This is not a demonstrated performance failure or a reason to add an endpoint speculatively. It is a reason to keep endpoint reuse provisional until that checkpoint passes.

Maintainability requirement: the personal timer must not force permanent reuse of an increasingly expensive dashboard aggregation solely to avoid one narrow read contract.

STRUCT-03 — Major — Native logout navigation has no specified acknowledgement boundary for the asynchronous Focus purge.

Evidence: the incumbent `sign-out-form.tsx:13` performs synchronous draft cleanup in `onSubmit` and immediately submits a native form. The proposed integration is a privacy notification (`focus-module-design.md:151–155`), while a valid Focus purge must complete an IndexedDB transaction and advance the fence (`:119–127`). The design correctly says request success is insufficient and failed End must not be reported committed.

Consequence: simply adding a notification to the current submit handler can start a purge and then unload the document before transaction completion. A server logout can succeed while the intended browser fence/purge is aborted. A pending Start validation or sibling tab then encounters a different state from the cleanup the UI intended. New-login epoch validation mitigates later restoration, but does not establish acknowledged logout cleanup or immediate sibling convergence.

Existing versus proposed: native logout is existing behavior; asynchronous transactional cleanup is new. This is a missing integration protocol, not a claim that the current application already contains a broken Focus implementation.

Minimum fix: explicitly coordinate logout’s cleanup and final navigation. Clear ephemeral labels immediately, invalidate pending operations, and allow the IDB purge acknowledgement to finish before navigating when coordination works. Storage failure must still permit server logout; record that failure honestly, disable local Focus interaction and preserve fail-closed bootstrap/revalidation. Avoid claiming cleanup succeeded merely because an event was emitted.

Required stress case: pending Start + logout + transaction abort/unload, followed by a surviving sibling tab and later login. Prove both no resurrection and truthful cleanup status.

Maintainability requirement: privacy lifecycle operations that require durable acknowledgement must not be hidden behind a fire-and-forget event.

STRUCT-04 — Major — The shared privacy events need explicit epoch scope to prevent an old failure from invalidating a new login.

Evidence: `focus-search-codebase-design.md:60` and `focus-module-design.md:151–155` introduce only `session-ended` and `access-recheck`. The defined payload excludes legal text but does not specify principal/epoch or request-generation binding. Existing `ReadFailure` receives only failure kind and partial/primary context (`read-failure.tsx:11–27,56–64`); the sign-out form similarly carries no explicit UI-session scope. Conversely, Focus commands and Search responses are carefully generation-bound elsewhere.

Consequence: after an account or login epoch changes, a delayed failure from the old page/request could emit a generic session-ended event. Consumers could then clear current Search data or attempt to purge the new login’s Focus slot. The event bus becomes an unversioned side channel around the versioning that protects both modules’ normal interfaces.

Existing versus proposed: failure components exist; the shared event contract is proposed. “Scoped privacy events” appears in `concepts_brief.md:87`, but the downstream executable contract needs to define that scope concretely.

Minimum fix: keep two events, adding only opaque source epoch/principal scope and a rule that consumers ignore mismatched old-session signals. Define how an unknown-scope failure obtains current scope or triggers a currentness read without claiming authoritative session loss. Terminal IDB changes must still compare identity/generation; a generic event must never bypass CAS. Add one delayed-old-401/account-switch test covering both consumers.

Counterargument: existing per-module generation checks may already be intended to cover this. Make that rule explicit at the event seam so future failure producers cannot accidentally bypass it.

Maintainability requirement: every cross-feature invalidation must identify the private state generation it is allowed to invalidate; no new domain event bus is needed.

A minimal coherent plan is:

1. Reconcile/pin the input tree and preserve the single writer and all dirty UI work.
2. Before dependent UI, prove SQL EN/VI normalization, complete search/fingerprint cost and reset behavior, real aggregate Focus-read cost, and transactional coordination failure cases. Keep internal staging; deliver one final candidate.
3. Define public identity, epoch-scoped privacy events and acknowledged logout integration together. Preserve draft/UNKNOWN behavior and narrowly classify only Search POST as a read.
4. Implement Focus’s pure model/coordinator and eligible-read path, then compose My Work/header callers.
5. Implement authorized Search snapshots and the selected query-consistency strategy, real cursor codec, BFF and grouped palette.
6. Run combined regression and actual permitted browser/two-tab cases; prepare exact manual blockers and nonauthor evidence where execution is unavailable.

No additional product approval is needed merely to narrow an implementation’s invalidation boundary while preserving the stated result/authorization guarantees. A proposal to relax the 30-second freshness bound, accept silent pagination gaps, retain server Focus history, or weaken EN/VI matching would change observable scope and must return as a concrete product trade-off.

Skipped: builds, tests, browser/provider execution and all mutations, as required by this read-only review. Remaining risk: these findings establish design failure cases to test; they do not establish runtime failure, implementation acceptance or production readiness.
