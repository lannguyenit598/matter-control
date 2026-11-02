# Quick Search module — codebase design

Design candidate v1, 2026-11-01. Task MC-FOCUS-SEARCH-CODEBASE-DESIGN-20261101. Local Codex. **DESIGNED / NOT_IMPLEMENTED**. [Package](focus-search-codebase-design.md), [BRD](../requirements/quick-search-brd.md). All routes, types, errors, SQL support objects and limits below are proposed implementation contracts, not existing behavior or deployed capability.

## 1. Module and interface

Choose one metadata retrieval module across the browser/BFF/Go seam. The caller learns one search interface; authorization, normalization, grouping, deterministic paging and transport errors stay behind it. It does not retrieve files, infer permissions, execute commands or expose a general query language.

```ts
type SearchType = "workspaces" | "matters" | "workItems" | "documents";
type SearchRequest = {
  q: string;
  epoch: string;
  matterId?: string; // ranking hint only
  types?: SearchType[];
  limit?: number; // default5, max25
  cursors?: Partial<Record<SearchType, string>>;
};
type SearchItem = {
  id: string;
  type: SearchType;
  label: string;
  workspace?: { id: string; name: string };
  matter?: { id: string; title: string };
  kind?: "ACTION" | "REQUIREMENT";
  subtype?: "FILING";
  callerRole?: "OWNER" | "EDITOR" | "VIEWER";
};
type SearchGroup =
  | {
      status: "ok";
      items: SearchItem[];
      hasMore: boolean;
      nextCursor?: string;
      asOf: string;
    }
  | { status: "unavailable" | "stale"; items: []; hasMore: false };
```

Browser **interface**: `searchRepository.search(request, signal)` plus `<QuickSearch pages={mainDestinations} identity={uiSessionScope}/>`. **Go interface**: `Search(ctx, SearchQuery) (SearchResult, error)` in an inbound port. Actor is derived by the existing authenticated Go middleware; `Session.userId` in Next is an IdP subject and must not be substituted for the Go product actor UUID.

The module's depth comes from removing work from every caller: no UI fan-out over Workspaces/Matters, no hand-written eligibility filter, no query-string assembly, no cursor decoding and no direct `fetch` inside a rendering component.

## 2. Incumbent source and concrete placement

Current `CommandPalette` is a domain-free four-page navigation module with its own input/keyboard behavior. Matter discovery is `GET /matters?q=...`; `DiscoverMatters` first obtains authorized Matters, but currently loads headers and filters in Go memory. It is not the new aggregate search implementation. Existing PostgreSQL `MatterStore.View` already provides REPEATABLE READ READ ONLY snapshots; use it rather than a new transaction framework.

| Proposed path                                                                          | Responsibility                                                                                                  |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `apps/frontend/src/features/search/schemas.ts`                                         | Strict request/result types and validation, token-free DTOs                                                     |
| `.../features/search/repository.ts`                                                    | Server-only Go retrieval via `mcRequest`                                                                        |
| `.../features/search/client.ts`                                                        | Browser-to-BFF adapter, abort/response/schema errors                                                            |
| `.../features/search/use-search.ts`                                                    | Query generation, debounce, paging, active result and stale response exclusion                                  |
| `.../features/search/components/quick-search.tsx`                                      | Feature composition and typed result groups/copy/icons                                                          |
| `.../app/api/search/route.ts`                                                          | Thin same-origin authenticated read-POST handler                                                                |
| `.../components/organisms/command-palette.tsx`                                         | Keep domain-free shortcut/dialog shell; add body render slot and accessible description/trigger-label overrides |
| `.../lib/mc/client.ts` and `errors.ts`                                                 | Narrow read-POST semantics and new read-specific errors, without weakening commands                             |
| `apps/backend/internal/core/domain/matter/search.go`                                   | Search DTO/value constraints, no transport or driver imports                                                    |
| `.../core/port/search.go`, `.../core/service/search_service.go`                        | Inbound search interface and orchestration/validation/cursor contract                                           |
| `.../adapter/inbound/productapi/search_handlers.go`                                    | HTTP body/problem/header mapping                                                                                |
| `.../adapter/outbound/postgres/search_store.go` and `queries_mattercontrol/search.sql` | Authorization-first projection/filter/rank/fingerprint/page in a snapshot                                       |
| `.../adapter/outbound/repotest/mattercontrol/memory_search.go`                         | Reference adapter for the same observable contract                                                              |
| `.../internal/app/product.go`, config and server registration                          | Explicit wiring, bounded cursor-key configuration                                                               |

Extend `MatterSnapshot` through a focused `SearchSnapshot` capability, matching existing work/evidence patterns. Do not add search methods to every unrelated transaction/write port. Production PostgreSQL and the existing memory reference are real adapters at this seam; tests cross the same search interface.

`components/**` never imports the Search feature. A small optional `renderBody({close})` slot in the existing palette lets the feature own query/data/active-result behavior while keeping native Dialog/hotkey/focus behavior local to the shell. Existing page-only default/stories remain valid. The app supplies the single-source `mainDestinations`; do not copy four paths into another navigation registry. The feature uses installed primitives/icons/localization and current glass surfaces, not another design system.

## 3. Read-POST transport and errors

Proposed browser `POST /api/search` → Go `POST /api/v1/search`. Send JSON only; no search text in either URL, browser history, telemetry or routine request/body/access logs. Preserve private/no-store responses on success and error. Enforce configured exact Origin and cookie authentication in the BFF; Go retains bearer authentication. Never pass a browser-selected actor/issuer to the Go search interface.

Bounds: strict allowlisted types; unique known group keys; request max16KiB; trimmed q2–100 Unicode code points before comparison folding; each cursor max2KiB; five rows per group by default; reject limits above25 or below1. Count code points, not UTF16 units or bytes, consistently on browser and Go. Reject invalid UTF8/NUL/control input; punctuation remains literal. Empty/one-character/overlong input makes no browser business request; backend independently validates direct calls. Normalizing cannot silently truncate. A combining-mark-only query with no searchable characters is rejected rather than matching every title. Canonical matching applies after the length guard; do not silently redefine that guard as a grapheme or byte count.

**Existing seam defect to address:** `mcRequest` sets `command = method !== 'GET'`. Reusing it unchanged for POST search would classify timeout/503/unusable body as `outcome-unknown`, which is incorrect for a read.

Small selected change: add an internal request option `semantics: 'read'` permitted only for the exact owned `POST /search` path, with neither idempotency key nor receipted body. Defaults for every existing request remain unchanged. Reject misuse on any other POST/PATCH/PUT. Use the same fetch/auth/schema/error implementation; no duplicate HTTP client. Lost read responses map to `unavailable`; malformed successful read results map to internal502; never offer same-key command reconciliation for Search. Tests must prove ordinary import/creation commands still produce UNKNOWN when their answer is lost.

| HTTP / problem                | Browser behavior                                                                                                       |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| 200 groups                    | Show authorized rows; each group has its own `asOf`; a failed group is not an empty success                            |
| 400 invalid query/cursor/type | Inline generic validation; no raw payload/token echo                                                                   |
| 401                           | Clear all business results and use existing sign-in UX                                                                 |
| 409 `ui-session-changed`      | Clear old epoch/results, reacquire shell identity; do not reuse a pre-login response                                   |
| 409 `search-stale`            | Clear all business rows/cursors for the current query and show an explicit refresh control; keep query and local Pages |
| 413                           | Input-size message, do not retry unchanged                                                                             |
| 503                           | Retain local Pages; business retrieval unavailable, not zero results                                                   |
| 502/internal contract failure | Generic failed retrieval, never a raw error or optimistic match                                                        |

A batch can mark a group `stale` while other groups succeed; a single-group paging request with stale provenance uses409. If all groups are unavailable, use503. No per-record `denied` result is returned in MVP. Configured headings are fixed; inaccessible/nonexistent rows both disappear before matching. This avoids a hidden-match side channel.

Use existing API timeout/request admission controls and coalesce browser requests. The current `mcRequest` accepts a timeout but no caller signal: add an optional internal signal, combine it with the timeout for the Search read, and forward the route request's abort signal. Go SQL reads must observe the HTTP context. Abort still cannot replace client generation checks, and aborting a real command still means UNKNOWN rather than proof of rollback. Test cancellation without weakening that distinction. Do not add a paid proxy/search service or claim a production latency SLO. Read-only POST protection must be implemented/tested explicitly; the existing logout origin check is a pattern, not a universal helper already present.

## 4. Authorization-first PostgreSQL implementation

The authoritative existing tables are `workspaces`, `workspace_memberships`, `matters`, `matter_memberships`, `actions`, `requirements`, `documents`; `filing_details` identifies a Filing Action. No new search table or asynchronous index is needed for this metadata MVP.

For each group, in one existing read snapshot:

1. Derive permitted rows for the current product actor. Workspaces require caller ACTIVE Workspace membership. Matter/Work Item/Document rows require both ACTIVE Workspace and explicit ACTIVE Matter membership. Workspace OWNER has no implicit confidential-Matter read.
2. Project only allowed names/titles/IDs/type/context/role. Action and Requirement branches use UNION ALL with explicit kinds. A Filing is its Action row plus subtype; never UNION another duplicate Filing row. Document metadata excludes version filenames/content/signatures.
3. Obtain the group's authorized projection fingerprint and query page from the same snapshot. Do not apply a broad database row limit before matching.
4. Normalize the title/name and parameterized q; filter by literal substring. `strpos(key,q)>0` avoids wildcard semantics for `%`, `_`, quotes and backslashes entirely.
5. Rank by exact0/prefix1/substring2, then current-Matter boost within the same tier, normalized label under binary `C` sort order, type/ID tie-break. Fetch `limit+1`; return only limit and honest `hasMore`.

A Matter ranking hint that is not readable must behave as no hint. Do not load its title or return a special existence error. The request actor and all joins are server-derived/parameterized. Counts of filtered-out or hidden rows never enter the DTO or cursor.

Execute requested groups sequentially in separate read snapshots under one request deadline, avoiding four simultaneous pool acquisitions. This makes partial failure explicit and bounded; each group reports its own `asOf`, not a fabricated global snapshot. Every page rechecks current memberships. No access cache is added. A schema/query/programmer fault is a logged generic internal failure (without q/row data), not a successful empty group.

### Normalization profile and migration

Select a versioned `mc_search_key_v1(text)` SQL implementation: Unicode NFD, strip combining diacritic marks used by EN/VI, map `Đ/đ` to `d`, and root-locale lowercasing. Preserve punctuation and original display text. Use an explicitly named deterministic ICU root/`und` collation for case mapping, and `C` for final key ordering. Do not rely on the database's default locale or PostgreSQL18-only `casefold`. This is an EN/VI metadata-matching profile, not fuzzy/linguistic equivalence or a promise that `ß` equals `ss`.

The memory adapter must implement that same profile and pass shared golden vectors, including every Vietnamese vowel/`đ`, NFC/NFD, dotted-I/root-locale cases, punctuation and unchanged originals. `golang.org/x/text v0.42.0` is already indirect in go.mod: a direct adapter import may promote it at that exact version. No version upgrade or third-party import in core is authorized by this design. Record this dependency promotion if needed. SQL and memory behavior must agree; do not substitute ASCII-only matching if a provider capability is missing.

Propose an additive next-unused migration (currently after0011) for the root collation and normalization function only. Do not edit old migrations, create an index table, add pg_trgm/unaccent/pgcrypto, or backfill legal rows. Preflight UTF8, ICU availability/migrator permissions and PG17/18 behavior on disposable fixtures before calling this portable to Supabase. If unavailable, surface that exact deployment gap; Focus and ordinary navigation still work. No live/production migration is executed by this document.

This profile makes the BRD's intended EN/VI matching concrete; compatibility expansion/full international case folding remains outside the selected profile. Pin normalizer/ICU version to cursor protocol and golden tests. A DB/ICU upgrade invalidates cursors and requires a repeat of those vectors.

### Consistency across Show more

Keyset ordering alone does **not** provide a stable list across a rename, insertion or membership change. This design restarts a changed group instead of silently duplicating/missing rows.

Compute SHA-256 of a canonical ordered representation of the **entire authorized searchable projection** for that group (IDs, exposed labels/context/roles and the caller's relevant membership facts). Use fixed field order and length-prefixed UTF8 cells with explicit null markers, sorted by type/ID, so SQL and memory serialization are unambiguous. PostgreSQL17 has built-in `sha256(bytea)`; no pgcrypto extension is needed. Empty projection has one fixed digest. Include only authorized/exposed metadata: do not hash hidden Matters or broad Workspace header revisions that can change because a confidential child changed. A change exclusively to hidden records must not invalidate an otherwise identical search.

The fingerprint is computed before page limit, within the same snapshot as the page. A cursor carries the previous fingerprint and last row's type/ID, not its label. After verifying the unchanged fingerprint, derive that anchor's rank/boost/normalized label from the same authorized projection and apply the keyset predicate. A missing anchor is stale, not a guessed offset. If the fingerprint differs, return `search-stale`, discard accumulated business lists/cursors for this query, and require an explicit refresh. Do not apply an old cursor to a new dataset or hold a database transaction across HTTP requests. Under an unchanged projection, 5→5→2 pages have no duplicates/reordering. Concurrent authorized changes are an explicit reset, not a false stability claim. Query-plan and payload evidence must include fingerprint cost, not just the last LIMIT query.

## 5. Opaque cursor and configuration

A plain base64 cursor is neither opaque nor tamper-resistant. Choose AES-256-GCM authenticated encryption with stdlib crypto, purpose-separated key derivation, fresh random nonce and a strict versioned payload. The browser stores it only in current in-memory search state. Reconstructing the ordering key by authorized anchor ID avoids storing legal titles even inside the encrypted cursor and keeps cursor size independent of title length.

Payload: protocol/normalizer version; product actor; request binding (keyed digest of normalized q, allowed group, authorized ranking hint, limit, UI epoch); group fingerprint; last row type/ID; issued/expiry time. TTL recommendation5minutes applies only to navigation cursors, not legal records or existing retention policy. Never embed query text or label keys. Enforce max2KiB, authentication before parsing, strict fields/types, supported versions and clock/expiry bounds. Every read still reauthorizes; encryption is not access permission.

Proposed new configuration: `MC_SEARCH_CURSOR_KEY`, a32-byte base64 secret shared across Go instances for one deployment. Use a dedicated key, not IdP signing credentials or a browser value. A key change invalidates old cursors cleanly; no legal data is lost. Supply local synthetic key in a private0600 runtime file; cloud secret provisioning/rotation is a separate deploy action. Do not invent an ephemeral per-instance key in production. Missing/invalid key leaves Search unavailable with a precise startup/config report; it does not weaken authentication or prevent existing endpoints from starting. Wire explicit capability state rather than nil handler dependencies.

Cryptography can remain private to the Search implementation using standard-library primitives and an injected clock/key at construction; do not expose a public cursor framework or configurable cipher. Tests use the real codec with a synthetic key and negative tamper/rotation cases.

## 6. Browser behavior, privacy and race control

The feature keeps one in-memory query generation per `{epoch,ranking context,q}`. On any change, immediately drop prior data/active identity, cancel outstanding request where possible, and reject late responses regardless of abort outcome. Changing only language re-renders supplied labels, never translates stored titles. IME composition must not fire partial Vietnamese queries; apply debounce after composition end. Compare raw input code-point length before any truncation.

- Empty query: Pages only. One character: Pages and minimum-length guidance, no business request.
- At2+ valid characters: data groups first; matching Pages secondary. No auto-navigation on one match. While pending, Enter does not activate an old/static default. Explicit pointer activation of a named Page remains available.
- Arrow navigation follows visible current-generation items; Enter acts only on the visibly active item. Show more buttons are separate named controls, not pseudo-result rows. Keep focus on the control after append; announce the incremental count once. On final page, move focus predictably to that group's last appended result if the control disappears.
- Group stale/error/partial state is announced once; network error is never an empty result. Any `search-stale` clears all current-query business groups/cursors conservatively because changed membership may affect several groups; ordinary unavailable groups do not erase successful ones. Retry reuses current input/epoch, not a previous cursor after reset. Keep safe local Pages on data failure.
- Result links are built locally from strict typed IDs and known routes (`/workspaces/{id}`, `/matters/{id}`, `/matters/{matterId}/work/{id}`, `/matters/{matterId}/documents/{id}`). Requirements and Filing Actions can open the common work detail. Do not accept arbitrary backend href values or bypass `safeInternalPath`/current return-context rules.
- Title/context wrap in a bounded scrollable dialog; no raw-ID placeholder, mixed new design library or focus stealing from another modal. Test EN/VI, light/dark,320/390 and zoom with actual rendering.

Explicit logout/401/epoch change clears query results/cursors/labels and ignores pending responses. Generic access-recheck events from the shared private-UI seam also clear results before a new read. Re-opening starts a new query session; no localStorage/sessionStorage/recent search log. No body/URL logging; redact raw transport/schema errors so logging a Zod failure cannot include private response titles. Trace request IDs/status/duration only. Prove this with synthetic canary terms through browser/BFF/Go/proxy fixtures.

## 7. Tests, performance and deployment scope

| Interface test                                       | Required BRD evidence                                                                                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search use case on memory + real PostgreSQL adapters | QS-AC-002..005/008..010/014..017: typed results, hidden records, >200 completeness, normalization, literal input, page stability/reset                                        |
| Cursor real-codec tests                              | Wrong actor/epoch/q/group/limit, tamper/truncate/oversize/expired/rotated key, no plaintext label/query in token                                                              |
| Authorization equivalence fixture pairs              | QS-AC-004/005/017: adding/modifying an inaccessible Matter does not change rows, group status, hasMore or cursor reset; asOf/ciphertext nonce itself is not a count assertion |
| BFF + transport seam                                 | QS-AC-013/018: POST read loss is unavailable, original commands remain UNKNOWN; exact Origin, auth, no-store/body bounds, sanitized errors/logs                               |
| Browser query module                                 | QS-AC-001/006/007/011/012: IME/debounce, late Q1/page responses, scope/epoch switch, active Enter, retry/paging/focus                                                         |
| Official browser and accessibility                   | Grouped real results,320/390/zoom, keyboard/announcements, no reload/history leakage, destination reauthorization                                                             |

First implementation uses existing membership indexes (0010) and bounded metadata queries, not another search engine. Measure the complete operation at approved W1 and a clearly labelled >200/large synthetic fixture, including fingerprint and repeated typing. Record EXPLAIN ANALYZE, rows examined, payload and p50/p95. Existing generic count/index evidence does not prove this new query.

If a measured scan is too expensive, add a separately reviewed trigram/index/projection migration to the same query contract; do not ship incomplete first200 filtering. This is a performance trade-off, not permission to add paid infrastructure. Real Supabase/TLS/pooler/cost validation stays NOT_RUN until separately executed.

Platform references fetched through Context7: [PostgreSQL17 normalization and locale-dependent lower](https://www.postgresql.org/docs/17/functions-string.html), [explicit ICU collations](https://www.postgresql.org/docs/17/collation.html), [built-in SHA-2 functions](https://www.postgresql.org/docs/17/functions-binarystring.html). The proposed SQL/function/profile has not been executed by this design task.
