# Contract note — bounded, truthful review answer history (RMV-F03)

Written before implementation, per the step03 assignment. Scope: `GET /matters/{id}/review-grids/{gridId}/cells/{versionId}/{questionId}/history` only.

## Query parameters

- `limit` (optional, default 100): 1–100 inclusive. 0, negative, non-numeric or >100 → 400 `urn:mc:bad-request` (unchanged).
- `cursor` (optional): the opaque `nextCursor` token returned by a previous page. Present only when another page exists.

## Order

Newest first by the server-recorded facts: `answeredAt` descending (the instant the answer was recorded at the boundary), tie-broken by answer `id` descending — a unique, deterministic total order. UUIDv7 ids are NOT treated as a causal chain (API clock skew can put a successor's id lexically below its predecessor's); `answeredAt`+`id` is the recorded chronology. Append-only data is not rewritten; ids never change.

## Envelope (existing `page` convention)

`{items: [...], page: {limit, maxLimit: 100, total: null, nextCursor}}`.

- `total` is **omitted (null)** for history: the storage pages with a keyset seek and does not count the whole trail, so any number would be a guess. This replaces the old false `total == len(items)`; the envelope schema already allows a null total (`pageMeta.total: nullable`), matching the events endpoints that omit unknown totals.
- `nextCursor` is a base64url token `{at, id}` (the last item of the page) when at least one older answer may exist, and `null` on the last page. The server fetches limit+1 rows and hands back a cursor only when the extra row exists.

## Storage

`ReviewReader.ReviewAnswerPage` pages at the storage level for one exact cell with `LIMIT limit+1` and a `(answered_at, id)` keyset seek (`(answered_at, id) < (cursor.at, cursor.id)` in row-comparison terms, matching the DESC,DESC order). The grid read stays the authorization anchor: a hidden/foreign grid answers uniform `not-found` before any paging happens; the cursor is never an authorization input.

## Cursor validation and scope

The cursor is untrusted input: malformed base64/JSON, a non-time `at`, an over-long or wrongly-shaped `id`, or trailing data → 400 `urn:mc:bad-request`. A cursor copied from another cell/matter is just a seek position: it cannot expose data (the response still only contains the addressed cell's answers, re-authorized per page) and it cannot forge access. There is no encryption or signature: existing cursor conventions are plain encoded ordering keys.

## Append during pagination

A newly recorded answer (newer than the page-1 anchor) appears when a client re-reads page 1; continuing from page 1's cursor never duplicates or skips older rows, but pages after the first may not include answers recorded after the page-1 read — they are reachable from a fresh page 1. This is stated in the API docs.

## UI continuation

The cell detail keeps its authorized first page server-side; a client "Older answers" control fetches the next page through a Server Action, appends without duplication (keyset guarantee), keeps grid/cell/state/q context and per-answer wording/citations, and announces loading/error/end honestly (EN/VI). A transient page failure keeps the already-read history and offers retry; a definitive denial (`unauthenticated`/`forbidden`/`not-found`) clears the history and the protected surface per the step01 behavior. Answers of a removed version remain API-readable (existing product limitation, unchanged and documented).

## Compatibility

Default first page and item fields unchanged; page size stays ≤100. Consumers relying on `page.total` for history must now treat it as unknown (frontend already does). No new role, state, migration or second paging framework: the envelope and cursor conventions reuse `handlers.go`/`workspace_store.go` patterns.
