COMPLETE — BRAINSTORM / YAGNI and reuse lens. Actual reviewer: Local Codex fresh-context Goldfish. Read-only frozen-input review; no implementation or approval claimed.

All cited original paths below resolve beneath:
`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/egm-focus-search-plan-20261101-r1/review-inputs/`

Required reads completed in full:

- `concepts_brief.md`
- `docs/requirements/focus-mode-brd.md`
- `docs/requirements/quick-search-brd.md`
- `docs/architecture/focus-search-codebase-design.md`
- `docs/architecture/focus-module-design.md`
- `docs/architecture/quick-search-module-design.md`
- `docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md`
- Frozen `apps/frontend/AGENTS.md` and `apps/backend/AGENTS.md`
- Sibling `review-inputs-manifest.json`
- Assigned EGM persona, Codex integration instructions and workstation RTK rules.

Semble search succeeded against the exact frozen root. Selected actual-source reads covered:

- Frontend `command-palette.tsx`, authenticated `layout.tsx`, My Actions `page.tsx`, `my-work-selection.ts`, Work `repository.ts`
- `auth-provider.ts`, `draft-scope-server.tsx`, `draft-scope.tsx`, `sign-out-form.tsx`
- `lib/mc/client.ts` lines 1–180
- Backend `work_service.go` lines 968–1050 and 1244–1315
- `workspace_service.go` lines 997–1068
- PostgreSQL `matter_store.go` lines 93–110

Baseline `978d8fc…` and preserved dirty work are documentary provenance from these inputs, not a live checkout verification.

ZOOM-01 — Major — Make search consistency query-bound before committing to whole-corpus fingerprinting.

Dimension: YAGNI and code minimization.

Evidence: `docs/architecture/quick-search-module-design.md:124–126` requires hashing the entire authorized searchable projection before page limits, including nonmatching records. Lines 145 and 90 allow one stale group to clear every accumulated business group. The brief explicitly identifies this cost at `concepts_brief.md:34,71`. Existing PostgreSQL snapshot reuse is real: `apps/backend/internal/adapter/outbound/postgres/matter_store.go:93–108` already supplies REPEATABLE READ / READ ONLY. Existing Matter discovery remains a bounded-scale implementation with an explicit warning at `workspace_service.go:997–1003`.

Existing versus proposed: snapshot transactions exist; full-projection fingerprints, cross-request reset semantics and canonical SQL/memory fingerprint serialization are new.

Challenge: a rename to an authorized record that never matched the current query invalidates an otherwise unchanged result list. Every keystroke also pays for canonicalizing and hashing unrelated accessible metadata across up to four groups. This is stronger consistency than needed to prevent duplicate/missing results in the current query.

Minimum fix: first compare a fingerprint of the complete authorized **matching** projection, including exposed context and ranking fields, against the proposed full-projection fingerprint. Keep authorization before matching, fingerprint before pagination, actor/query/cursor binding, hidden-record equivalence and explicit reset when the matching list changes. Measure complete reads under both approaches. This reduces hash work and irrelevant resets; it does not eliminate the underlying normalization/filter scan.

Counterargument: the whole projection is straightforward to describe and conservatively catches membership/context changes. Retain it if measured cost and reset frequency are acceptable. Do not weaken membership rechecks or replace it with plain keyset paging while claiming an unchanged-list guarantee.

Biggest readiness weakness: the implementation handoff makes the heavier choice mandatory at line 25 while the brief still correctly treats it as an alternative to stress-test. Resolve that inconsistency before a writer builds dependent SQL, memory adapters and cursor tests.

ZOOM-02 — Major — Verify the cost of reusing `/me/actions` as a permanent timer heartbeat before adding coordination machinery.

Dimension: reuse with workload awareness.

Evidence: `docs/architecture/focus-module-design.md:97,147` selects `/me/actions` as primary classification and gives each visible tab its own proposed 20-second refresh / 30-second successful-read-age bound. Actual `apps/backend/internal/core/service/work_service.go:1253–1305` enumerates accessible Matters, loads each graph, derives effective state and critical chains, classifies assignments, then ranks candidates. Frontend `apps/frontend/src/app/(app)/my-actions/page.tsx:45–60` uses this today for a page read, followed by bounded detail/name enrichment.

Existing versus proposed: the authoritative classifier exists. Repeating its whole cross-Matter work from every visible tab throughout Focus is new workload.

Challenge: a timer for one Action turns a navigation-oriented aggregate read into sustained graph processing. Five visible tabs imply roughly fifteen aggregate classification reads per minute before route/refocus triggers and extra name/detail reads. “Reuse existing endpoints” avoids a new contract but does not make their work small.

Minimum fix: preserve the brief’s P1 measurement before shell/provider work. Measure actual query count, graph volume, elapsed time and provider calls for one and five visible tabs, including failure paths. Initially keep the existing endpoint if that passes. If it cannot support the proposed freshness behavior, evaluate one narrow target-classification read reusing the same domain classification and permission rules; do not build a second browser classifier or generic scheduler. Do not share a sibling’s authorization freshness merely to reduce calls.

Counterargument: for the approved small local workload this may be entirely adequate, and a targeted endpoint would add unnecessary code. This is a preflight decision, not a demonstrated runtime bottleneck. The 30-second product behavior must remain honest while testing it.

ZOOM-03 — Nit — The stable principal hash appears redundant under the chosen singleton/login model.

Dimension: YAGNI and privacy minimization.

Evidence: `docs/architecture/focus-module-design.md:68–75` introduces principal key, epoch and expiry; lines 103–111 simultaneously specify one cookie-authenticated principal per origin, one singleton slot and mandatory invalidation on account change. Existing `apps/frontend/src/lib/auth-provider.ts:42–68` already derives expiry and a unique per-login draft namespace.

Existing versus proposed: per-login namespace and expiry reads exist. Stable issuer/subject-derived browser coordination identity is new.

Challenge: with one current slot and one authenticated cookie identity, the login epoch already prevents a new login from restoring an older session. A stable cross-login identifier adds derivation, validation and privacy surface without an identified cross-login feature; recovery across new logins is explicitly prohibited.

Minimum fix: test whether `{epoch, validUntil}` plus singleton generation/revision fully satisfies current tab/account-switch acceptance cases. If so, omit the stable principal key and resolve the remaining public projection from one live-session read. Keep server-side authentication and actor derivation unchanged.

Counterargument: an explicit stable principal may make identity assertions easier to audit. Keeping it is reasonable if an actual current acceptance case requires distinguishing principal from epoch. Future simultaneous-account support alone is insufficient justification.

Minimal plan recommendation:

1. Keep the current Next/BFF/Go/PostgreSQL architecture, existing palette Dialog shell, navigation registry, Work selection helpers, HTTP client and snapshot store. These are supported reuse choices.
2. Resolve ZOOM-01 and run the ZOOM-02 preflights before treating the existing implementation handoff as final.
3. Implement one vertical Focus path and one vertical authorized Search path before expanding their test matrices and UI polish; still deliver one combined candidate.
4. Retain the IDB generation fence, narrow read-POST semantics, negative authorization tests and real two-tab checks. These complexity costs directly satisfy stated requirements.

No additional product feature is justified. The real unresolved product choice is the desired search reset experience when authorized data changes; the scope of consistency detection should be explicit. The visible Focus freshness bound also remains a proposal requiring workload evidence, rather than an inferred production commitment.

Skipped: builds, tests, browser/provider checks, live source and all mutations, as required by the review boundary. Risk: performance and platform feasibility remain unmeasured; these findings do not establish implementation failure or acceptance.
