Read status: COMPLETE. Read the persona and Codex integration instructions, RTK instructions, sibling `review-inputs-manifest.json`, and all seven required documents in full, retrieving truncated ranges. Semble succeeded against the exact frozen root. No memory, live source, other review artifacts or subagents were used.

All references below are relative to this frozen root:
`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/egm-focus-search-plan-20261101-r1/review-inputs`

Required reads confirmed:

- `concepts_brief.md`, lines 1–109.
- `docs/requirements/focus-mode-brd.md`, lines 1–140.
- `docs/requirements/quick-search-brd.md`, lines 1–189.
- `docs/architecture/focus-search-codebase-design.md`, lines 1–106.
- `docs/architecture/focus-module-design.md`, lines 1–173.
- `docs/architecture/quick-search-module-design.md`, lines 1–166.
- `docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md`, lines 1–50.

Also read both frozen component AGENTS and selected frozen frontend implementation, authentication and SQL schema sections cited below.

UX-01 — Major — UX & Developer Ergonomics  
Unrelated authorized edits can repeatedly erase a search the user is paging through.

Evidence: `docs/architecture/quick-search-module-design.md:124–126` fingerprints the entire authorized searchable projection before matching. Lines 85 and 145 clear all accumulated business groups on any stale cursor. The existing palette is a local page filter (`apps/frontend/src/components/organisms/command-palette.tsx:108–116`); this disruptive paging behavior is proposed.

An unrelated Document rename that does not match the current query can invalidate that group’s cursor. When the user next selects Show more, every accumulated business group disappears, including successful Matter/Work Item results. In a busy Workspace, repeated refreshes can prevent users reaching later matches. This is a usability cost of the chosen consistency mechanism, separate from its already identified computation cost.

Minimum fix: compare a fingerprint of the complete authorized **matching** result projection, including exposed scope labels and relevant ordering/context, before the page limit. A nonmatch becoming a match must still invalidate it. Keep the existing explicit reset for a changed matching set. Add one test where an unrelated readable record changes while paging; the visible search should continue. Also test an actual matching/context change and explain “Results changed; refresh” rather than implying access was necessarily revoked.

Counterargument: whole-projection hashing is simpler to specify and conservatively catches all changes. If retained, validate repeated-edit usability explicitly and acknowledge the possibility that later pages become impractical to reach; correctness alone does not settle that trade-off.

UX-02 — Major — UX & Developer Ergonomics  
The proposed visible metadata cannot always distinguish duplicate records.

Evidence: `docs/requirements/quick-search-brd.md:40–47,60,161` promises distinguishable duplicate names using Workspace/Matter context. The DTO at `docs/architecture/quick-search-module-design.md:19–27` supplies label, scope, kind/subtype and role. The frozen schema permits two Actions with the same title in one Matter (`apps/backend/internal/adapter/outbound/postgres/migrations_mattercontrol/0001_mattercontrol_core.sql:113–142`) and two same-name Documents in one Matter (`0003_documents_evidence.sql:7–14`). Their searchable rows can therefore have identical visible information despite different destinations.

The Focus picker has the related edge case: it filters titles and displays the first 20 (`docs/architecture/focus-module-design.md:89`). More than 20 same-title eligible Actions cannot be separated by refining that title query. The existing Ready queue can traverse every selected item through URL selection (`apps/frontend/src/features/work/my-work-selection.ts:30–35,54–63`).

Minimum fix: add same-name, same-kind, same-Matter fixtures to Search and Focus acceptance. Specify a safe fallback for ambiguous Search rows and an explicit route to the existing Ready queue for a truncated Focus picker. Preserve one-click Focus for the already selected eligible Action even when it falls beyond the picker’s first 20.

Real product decision: either accept an explicit “same-name records—open to inspect” limitation, or approve one additional authorized discriminator. Do not claim Workspace/Matter labels resolve every duplicate, invent titles, impose new uniqueness rules, or quietly add sensitive metadata.

UX-03 — Nit — UX & Developer Ergonomics  
Cross-tab correctness has an API outcome but lacks a complete user acknowledgement contract.

Evidence: `docs/architecture/focus-module-design.md:18–28` returns `accepted | stale | refused`, binds commands to the rendered revision and forbids silent rebasing. Lines 122 and 127 correctly require commit acknowledgement and prohibit false successful End. Neither specifies the visible outcome when a competing tab wins and the user’s control is rejected.

A user can press +5 or End and see another tab’s resulting state without knowing whether their own operation happened. Developers otherwise have to invent inconsistent messages in the card and controller.

Minimum fix: keep the small existing interface; make the shared Focus view expose one transient, localized status for stale/refused operations. Reconcile first, then announce once, for example: “Focus changed in another tab. Your change was not applied.” Require a fresh explicit action where appropriate. Add one two-handle case that asserts the user-facing acknowledgement, not only the winning stored revision. No command queue or automatic retry is needed.

The strongest choices survive: reuse the existing work selection, keep Focus separate from legal execution, use atomic storage with notification-only messages, retain ordinary links and native dialog behavior, and keep Search authorization behind one server interface. The largest readiness weakness through this lens is that paging consistency currently receives stronger specification than the user’s ability to finish finding a record.

Skipped: implementation, tests, builds, browser execution, runtime and provider checks; no files changed.  
Remaining risk: these are frozen-source design findings, not proof of implemented behavior or accepted product decisions.
