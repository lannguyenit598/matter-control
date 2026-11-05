Status: COMPLETE — read-only BRAINSTORM review. Three Major findings; no Blocker established. These concern the proposed implementation, not defects in already implemented Focus/Search code.

Actual identity: Local Codex acting as egm-design, architecture/cost lens. Reviewed only the frozen packet at `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/egm-focus-search-plan-20261101-r1/review-inputs`. The packet identifies baseline `978d8fc694a47e9beee528076bcf1af9473997e3` plus preserved dirty work; I did not independently inspect live Git state.

Reading confirmations

Read fully:

- `concepts_brief.md`
- `docs/requirements/focus-mode-brd.md`
- `docs/requirements/quick-search-brd.md`
- `docs/architecture/focus-search-codebase-design.md`
- `docs/architecture/focus-module-design.md`
- `docs/architecture/quick-search-module-design.md`
- `docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md`
- Frozen `apps/frontend/AGENTS.md` and `apps/backend/AGENTS.md`
- The supplied manifest, bundled `agents/design_critic.md`, bundled `docs/codex.md`, and workstation RTK instructions.

Selected frozen source inspected:

- `apps/frontend/src/lib/mc/client.ts`
- `apps/frontend/src/features/work/repository.ts`
- `apps/frontend/src/lib/auth-provider.ts`
- `apps/frontend/src/app/(app)/layout.tsx`
- `apps/frontend/src/app/api/auth/session/route.ts`
- `apps/frontend/src/app/api/auth/logout/route.ts`
- `apps/frontend/src/features/auth/components/sign-out-form.tsx`
- `apps/frontend/src/components/organisms/read-failure.tsx`
- `apps/frontend/src/components/organisms/command-palette.tsx`
- `apps/backend/internal/core/service/work_service.go`, specifically `readSnapshot` and `MyActions`
- `apps/backend/internal/core/service/workspace_service.go`, specifically `DiscoverMatters`
- `apps/backend/internal/adapter/outbound/postgres/matter_store.go`, specifically `View` and surrounding snapshot handling
- `apps/backend/internal/adapter/inbound/productapi/server.go`
- `apps/backend/internal/adapter/outbound/postgres/migrations_mattercontrol/0010_access_path_indexes.sql`

Semble succeeded against the exact frozen root before source exploration. Truncated document output was retrieved again in separate complete returns.

1. DESIGN-01 — Major — Narrow the fingerprint to the current query’s authorized matching projection

Dimension: Cost and consistency.

Affected proposed contract: `docs/architecture/quick-search-module-design.md:122–126`; implementation obligation at `docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md:25`.

The proposal fingerprints the entire authorized searchable group before filtering by the current query. Consequently, renaming an unrelated readable Document can invalidate paging for a query whose matching Document results are unchanged. The frontend then clears every business group. In an active legal workspace, ordinary unrelated edits can repeatedly interrupt Show more.

This also forces canonical serialization, ordering and hashing of nonmatching metadata. A five-row page bounds the response, not this work. The brief already acknowledges fingerprint cost; the additional actionable issue is that the selected fingerprint invalidates more changes than the requested list needs.

Minimal fix: fingerprint the complete authorized matching projection for the bound query, including exposed context, relevant roles and deterministic ordering inputs. Recompute it inside the page snapshot. Matching insertions, removals, renames, permission changes and context changes still reset the list; unrelated nonmatching edits do not. Keep the encrypted cursor and existing actor/query/hint/limit bindings.

Required comparison: unchanged query plus unrelated readable edit must continue paging; matching insertion/rename/removal must reset; hidden-record mutation must remain equivalent.

Counterargument: whole-group hashing is easier to explain and conservatively invalidates everything. That simplicity can justify it at a measured small fixture, but the candidate should explicitly accept its extra reset behavior rather than imply it is necessary for stable query paging. Query-specific hashing reduces churn and hash volume; it does not eliminate the substring authorization/filter scan.

2. DESIGN-02 — Major — Focus refresh reuses an unbounded portfolio operation, and needs a mixed-workload decision before UI depends on it

Dimension: Database work and shared capacity.

Affected proposed contract: `docs/architecture/focus-module-design.md:89–97,147`; `docs/architecture/quick-search-module-design.md:92,108,162–164`.

Existing source evidence: `apps/backend/internal/core/service/work_service.go:1247` onward obtains every accessible Matter, loads each complete graph, derives effective state and critical chain, then selects and ranks the caller’s items. The proposed Focus refresh invokes this classifier every twenty seconds in every visible tab. With five visible tabs, one principal produces fifteen portfolio classifications per minute before route/refocus/picker reads and Matter-name enrichment.

The API’s existing admission seam is shared across `/api/v1`: `apps/backend/internal/adapter/inbound/productapi/server.go:55–56,110`. Reusing that limit prevents unrestricted concurrency when configured, but does not reserve capacity for ordinary work commands. Search’s sequential groups avoid four simultaneous acquisitions per request while still adding repeated metadata scans.

The missing decision is whether this combined steady workload leaves normal reads and commands usable. Separate Focus call counts and Search query plans cannot establish that.

Minimal fix: make the early P1 experiment a combined workload: one and five visible Focus tabs, realistic typing/paging, and representative ordinary reads/commands on the same owned fixture. Record graph loads, SQL work, queue/admission failures and command behavior. Define a local proceed/revise criterion before dependent UI work, without inventing a production SLO.

If portfolio polling fails that experiment, add a narrow target-validation read that reuses existing authoritative classification rules; retain the full server `next` operation for candidate selection and ordering. Do not introduce browser eligibility arithmetic, incomplete candidates or a new cache.

Counterargument: the approved local workload may be small enough that existing reads are entirely adequate. In that case retain them. The concern is treating endpoint reuse and a small returned picker as evidence that the underlying work is bounded.

3. DESIGN-03 — Major — Native logout navigation needs an explicit asynchronous purge protocol

Dimension: Cross-tab lifecycle and privacy.

Affected proposed contract: `docs/architecture/focus-module-design.md:119–127,151–155`.

Existing source evidence: `apps/frontend/src/features/auth/components/sign-out-form.tsx:13` submits a native POST form and performs synchronous draft cleanup. `apps/frontend/src/app/api/auth/logout/route.ts:22–34` destroys the server session and redirects. The proposed Focus cleanup requires an asynchronous IDB transaction, acknowledges only transaction completion, and broadcasts only after commit.

A generic client notification does not establish that the IDB purge and sibling notification finish before native navigation unloads the submitting page. A cancelled or delayed purge can leave another visible tab presenting the prior session until its next authorization check. Generation fencing prevents stale writes only after the fence has actually advanced.

Minimal fix: specify the logout ordering and failure behavior at the sign-out seam. Immediately invalidate the local runtime and notify sibling tabs to hide protected presentation and reject pending responses. Coordinate the durable content-free fence before navigation where possible. Server logout must still proceed if browser storage fails; receiving tabs must remain unverified, with cleanup retried during reconciliation/bootstrap. Keep this distinct from asserting that a durable purge committed.

Add a real-navigation test: delay or abort the IDB purge, submit the existing native logout form while another tab has a pending Start/validation, and verify no visible sibling title or old response survives.

Counterargument: successful transactions may usually complete quickly before unload. That is insufficient for the explicitly required failure paths. The proposal already tests races and failed commits; the missing architectural detail is their interaction with this existing navigation mechanism.

Minimal plan recommendation

Keep the existing architecture, metadata-only Search, browser-local Focus, one writer and shared domain-free UI primitives. Retain the proposed IDB CAS seam, notification-only state synchronization, strict authorization, narrow read-POST transport change and independent evidence gates.

Before building dependent UI:

1. Select and test query-specific fingerprinting against whole-group fingerprinting.
2. Run the combined read-amplification experiment and retain existing Focus endpoints if adequate.
3. Pin logout invalidation, durable purge and navigation ordering, including storage failure.

Then follow the existing identity → Focus → Search → combined verification checkpoints. No new search service, worker, state framework or package is justified by this review.

The biggest readiness weakness is the combination of expensive portfolio reads and full-group hashing under shared API capacity. The packet names both risks, but its current implementation contract still fixes the expensive mechanisms before the combined experiment selects them.

No new product decision is required for these corrections. A decision would be needed only if evidence forces weaker paging guarantees, a changed visible freshness promise, additional retained search state or paid infrastructure.

Skipped: implementation, builds, tests, browser/provider execution, live source and Git inspection. Remaining risk: findings are grounded in frozen source and proposed contracts; runtime feasibility remains unverified.
