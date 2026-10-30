# Step03 — RMV-F03 truthful, reachable bounded answer history

Read COMMON.md and the earlier checkpoints. This step owns the end-to-end correction for existing answer-history retrieval; no export/search/template feature is added.

## Owned paths

- Backend review history query/result port, service, HTTP DTO/handler and tests; memory review store/shared contract; PostgreSQL review store and `queries_mattercontrol/review.sql` where necessary.
- Generated `mcsqlc/` only via `make sqlc-generate` after actual SQL changes, followed by sqlc-check. Preserve the pre-existing SearchLocalWorkspacePeople query/code; review all generated drift.
- Frontend review schemas/repository/history selection/page/CellDetail/tests; preserve step01 access-loss/UNKNOWN corrections.
- Narrow backend API/operations documentation and task-local contract delta. No applied migration0008 edit, new role or unrelated schema/index project.

## Contract before code

Inspect existing authorized pagination patterns: `productapi/handlers.go` event cursor handling, `core/port/workspace.go` EventsPage and `postgres/workspace_store.go` pageLimit+1 pattern. Reuse applicable envelope/error/validation conventions rather than introducing a second arbitrary paging framework.

Write a short concrete contract note in your task evidence before implementation: query parameters, page limit, stable order/cursor, response metadata, append-during-pagination behavior, malformed/wrong-scope cursor behavior and UI continuation. Then implement that bounded compatible correction; do not stop at the note. Treat this assignment as authority for the narrow history-continuation fix, not for unrelated business policy. Escalate only an unavoidable material incompatibility with real consumers, supported by the exact caller and alternatives.

The existing endpoint/default first page and item fields stay compatible where possible. Keep max100 per page. A truncated result cannot claim total==returned count or no-more-data. Use a truthful total or omit unknown total under the existing envelope convention. Older answers must be reachable; a badge saying “partial” alone does not close F03.

## Implementation requirements

1. Page the selected Matter/grid/cell history at storage level when practical, using parameterized sqlc queries and limit+1; avoid fetching all answers of every grid just to slice100. Preserve one authorized consistent read snapshot per request.
2. Use deterministic newest-first history order that represents actual recorded/supersession chronology. Do not assume UUIDv7 ordering is a causal chain across skewed API clocks; use existing server-recorded facts and a unique tie-break. Do not change append-only data or rewrite old IDs. Specify what subsequent pages do when a new answer arrives.
3. Cursor scope and validation are untrusted input. Reauthorize every page; do not leak another Matter/grid/cell via a copied cursor. No new cryptographic framework unless required by existing conventions. Preserve ordinary hidden-resource precedence for inaccessible data.
4. UI exposes an accessible EN/VI “older answers”/continuation control, preserves grid/cell/state/q/Back context and original wording/citations for every retrieved answer, and announces partial/loading/error/end states honestly. Do not duplicate/skip rows when appending pages; transient page failure keeps the authorized already-read history and retry route; definitive denial clears it under step01.
5. Do not make removed-version answers newly public or invent provenance. If UI support for removed rows is not part of this bounded correction, keep that limitation explicitly visible/documented; the existing API must remain authorized and usable.

## Acceptance tests

- 0/1/100/101/205 answers; traverse all pages, every stored answer appears exactly once in the documented order, first/original answer reachable. Assert truthful total/nextCursor/end-of-history.
- Same/malformed/oversized/wrong-scope cursor; page limits invalid0/negative/>100; same-timestamp tie; a successor ID lexically below its predecessor; concurrent append between pages. No blind mutation replay in any read test.
- Active VIEWER reads, nonmember/revoked user denied on every page, including revocation after page1. No protected history remains after definitive refusal in the UI.
- Reword question multiple times across pages; old answers show their exact revision wording and typed refs marked not validated; no work/proof/filing state or answer event-text leakage changes.
- Keep the verifier's101-answer failure meaningful; replace its desired assertion only as needed to match the newly documented concrete continuation contract, never by deleting the completeness requirement.
- Shared memory/PG contract and HTTP consumer tests; frontend schema/repository/continuation/context/keyboard tests. Re-run concurrency, Unicode bounds and state isolation if their owning code changes.

Record contract delta, source/generated delta and tests; continue04. No need to add defense-in-depth schema migrations merely because they were listed as minors.

Skipped: exports, global audit redesign, retained DB migration/rollback, schema hardening and unrelated feature scope. Risk: first-page tests alone can hide skipped/duplicate history or a wrong-scope cursor leak.
