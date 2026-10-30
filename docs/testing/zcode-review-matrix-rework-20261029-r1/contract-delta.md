# Contract delta — corrected candidate (task-local proposal, needs independent review)

Two narrow, documented deltas; no business-role, state-axis, lifecycle or approval change. Original contracts preserved everywhere else.

## 1. Explicit expectation presence on `POST /{gridId}/answers` (RMV-F01)

- `expectedAnswerId` is now presence-distinguishing at the trust boundary: **absent or null → 428 `urn:mc:precondition-required`** ("state what you saw"), **`""` → an explicitly observed empty cell (201 when it still is)**, **a stale id → 412**, **a wrong JSON type → 400 `urn:mc:malformed-body`** (unchanged strict decoding).
- Order preserved: 401 unauthenticated → 403 known nonmember/revoked/hidden foreign grid (standing class) → 403 VIEWER → in-grid 409 `not-in-grid` → revision 0/428 → revision stale 412 → expectation presence 428 → expectation mismatch 412. The 428-for-missing-expectation sits **after** authorization, mirroring the shipped `expectedAssessmentId` precedent; nothing about hidden existence is revealed earlier.
- A refused command stores no receipt: the same idempotency key may later carry a corrected body (a stored receipt would have made that key-reuse).
- Port type: `RecordReviewAnswerCmd.ExpectedAnswerID *string` (mirrors `ExpectedAssessmentID`); no HTTP/driver type entered core; no migration; no sqlc change for presence.
- Client: unchanged on the wire — the frontend always sends the field explicitly (`""` for an observed empty cell), so existing UIs are compatible.

## 2. Bounded, truthful answer history (RMV-F03)

- `GET /{gridId}/cells/{versionId}/{questionId}/history?limit=&cursor=` keeps the 100-per-page cap and default; item fields unchanged.
- Order is now defined as **server-recorded chronology** (`answeredAt` desc, unique tie-break `id` desc) instead of raw UUIDv7 byte order — the same effective order for same-instant sequences, and truthful under clock skew. Append-only data untouched.
- Envelope: `page.total` is now **`null`** (a keyset page does not count the trail — no false completeness; the events endpoints already omit unknown totals, and the client `pageMeta` schema already allows null). `page.nextCursor` is a base64url `{at,id}` seek token when older answers may exist, `null` on the last page.
- Cursor handling: malformed base64/JSON, non-time `at`, malformed `id`, or oversized token → 400. A cursor is a seek position only: every page re-authorized through the unchanged grid anchor (uniform 404 for outsiders/revoked on every page); copying a cursor across cells/matters cannot expose or forge access.
- Append during pagination: new answers appear on a fresh first page; pages anchored to an earlier cursor never duplicate or skip older rows.
- Client: `repository.history` returns `{items, nextCursor}`; the cell detail offers an accessible EN/VI "Older answers" continuation (loading/error/end announced; transient failure keeps the read history; definitive denial clears per the step01 behavior).
- Compatibility: consumers reading `page.total` for history must treat it as unknown; the frontend schema already did. No second paging framework — the existing `page` envelope and cursor helpers are reused. Full note: `contract-delta-history.md` (written before implementation).

## 3. Client-side interfaces (frontend only)

- `IntentForm` gains an optional `onAccessLoss({kind, error})` invoked only for `unauthenticated`/`forbidden`/`not-found`; all existing callers are unaffected (optional prop; their suites pass).
- `answer-form.tsx`: draft key is cell-scoped (`review:{gridId}:{versionId}:{questionId}`) and the CAS facts ride in hidden form fields, so a pending/UNKNOWN intent cannot be reinterpreted by refreshed props or a remount; retries replay the original key and values; a new intent still requires the explicit discard/resolved flow.
- `lib/mc/drafts.ts` gains `clearScopeDrafts(namespace, scopePrefix)` (scoped purge alongside the existing `clearAllDrafts`); the review surface purges only its own grid's drafts/attempts, never another session's namespace or unrelated scopes.
