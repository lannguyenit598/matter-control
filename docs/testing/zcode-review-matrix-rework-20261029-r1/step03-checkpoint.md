# Step03 checkpoint — RMV-F03 truthful, reachable bounded history

Date: 2026-10-29. Actual ZCode session; same repo/branch/HEAD (no commit). Contract note written BEFORE implementation: `contract-delta-history.md`. sqlc generated via `make sqlc-generate` (v1.31.1, pinned in Makefile) and verified with `make sqlc-check`; no handwritten generated edits. The pre-existing `SearchLocalWorkspacePeople` query is untouched; generated drift limited to the new review queries + their regenerative rebuild.

## Backend

- Domain: `matter.ReviewAnswerCursor{AnsweredAt, ID}` and `matter.ReviewAnswerPage{Items, NextCursor}`.
- Port: `ReviewHistoryQuery.Cursor`; `ReviewService.AnswerHistory` returns `ReviewAnswerPage`; new `ReviewReader.ReviewAnswerPage` (storage-level keyset page).
- Service: validates limit (0→100, >100 rejected), parses grid/version/question ids as UUIDs (a malformed path id is a validation error, never a PG cast 500), keeps the grid read as the authorization anchor (uniform not-found before paging). Version/question ids are parsed BEFORE authorization — validation errors leak no existence; revoked/nonmember denial semantics preserved (contract test now uses well-formed ids).
- Memory store: `reviewAnswerPageOf` — filter cell, sort (`AnsweredAt` desc, `id` desc), seek strictly after the cursor tuple, limit+1 → NextCursor only when an older row exists.
- PostgreSQL: two parameterized sqlc queries (`ListReviewAnswersOfCell` with `(answered_at, id) < ($at,$id)` seek, `ListReviewAnswersOfCellFirst`) with `LIMIT limit+1`; `review_store.go` maps rows, builds the cursor from the limit-th item.
- HTTP: `cursor` query param decoded with the existing `decodeCursor` (malformed → 400); `at` must parse RFC3339Nano and `id` a UUID (400 otherwise); envelope `{items, page:{limit, maxLimit:100, total:null, nextCursor}}` — `total` truthfully omitted; `nextCursor` null on the last page. `docs/api.md` updated.

## Frontend

- `repository.history(..., cursor?)` returns `{items, nextCursor}`; new Server Action `reviewHistoryAction` (re-validates input, carries the user's session) so the client can continue without importing the server-only repository.
- `CellDetail` (client) owns the trail state: renders "Older answers" (`Older answers`/`Các câu trả lời cũ hơn`) when a cursor exists, appends pages in order (keyset — no dup/skip), announces loading (`role="status"`, aria-busy), transient failure (`role="alert"` + Try again — already-read history kept) and end of history (`role="status"`). A definitive denial from a continuation call runs the step01 access-loss path (purge + clear + report). Section shows when >1 item or a continuation exists (a single fully-visible page needs no history section — unchanged behavior).
- Reviews page keys `CellDetail` per cell so the trail/loss state resets with the selection.

## Tests (red→green where behavioral)

- Service: `TestAnswerHistoryIsBoundedOrderedAndComplete` — 5 answers, limit 3 → 2 pages, every answer exactly once, original answer reachable, limit>100 refused.
- Shared contract (memory now, same suite on PG at step04): new subtest "history pages stay truthful when an answer is recorded between pages" (anchored page 2 keeps old rows; fresh page 1 shows the newcomer) and "history order is recorded chronology, not the id byte order" (directly seeded answers with lexically smaller later ids and a same-instant tie — exact recorded order traversed).
- HTTP `TestReviewGrid_HTTPHistoryPagination`: empty page (no invented total/cursor), 1 answer, 101 answers → page 1 = 100 items + `total:null` + `nextCursor` (the verifier's failing regression semantics), page 2 reaches "Answer 0"; limit=7 full traversal sees all 101 with no duplicates; malformed/non-time/oversized cursor → 400, unknown-field cursor → 200; limit 0/-1/101 → 400; viewer reads pages, known nonmember denied.
- Frontend: continuation append + honest end state; transient failure keeps history + retry succeeds; definitive denial during continuation clears the protected detail; existing wording/refs/author history test updated to the new shape only.

## Evidence

`step03-green-backend.log` (SuiteReview memory 11 passed; service+productapi 161 passed; gofmt/vet clean; `make sqlc-check` pass), `step03-green-frontend.log` (16 files / 155 tests passed — one load-dependent recurrence of the known review-list UNKNOWN-retry timing flake occurred in an intermediate run and passed in the final run; diagnosis belongs to step04), `contract-delta-history.md`, `step03-after-hashes.txt` (19 files). PG-store contract run + full gates happen in step04 with a fresh owned fixture.

Limitation: no browser journey; UI continuation verified at component level.
