# MatterControl Quick Search — Business Requirements Document

- Document ID: MC-QS-BRD-001
- Status: PROPOSED / IN_REVIEW
- Owner: Business Analysis (actual Codex business-analyst subagent)
- Requested by: Product Owner, 2026-11-01
- Priority: P1 usability proposal
- Source: `codex/unified-project-flow` at `978d8fc694a47e9beee528076bcf1af9473997e3`
- Implementation / approval: NOT_STARTED / NOT_APPROVED

## 1. Problem and outcome

Quick Search currently looks like a global search but filters only four static page destinations. Entering a known Matter, Action, Requirement, Workspace, or Document name can therefore return “No page matches this search” even when an authorized record exists.

Source evidence:

- `apps/frontend/src/components/organisms/command-palette.tsx` accepts only `mainDestinations`, filters English/Vietnamese page labels in memory, and explicitly defers server-side results.
- Cross-Workspace Matter discovery already exists as authorized, bounded `GET /matters?q=...`, but Quick Search does not consume it.
- There is no current single search contract for Workspace, Work Item, and Document metadata. Fetching only the first page of each list and filtering in the browser would miss results and must not be called global search.

Desired outcome: an authenticated legal-team member can enter a known title/name, distinguish grouped result types and scopes, and open an authorized record directly without first remembering its Workspace or Matter.

This feature does not define a production latency SLA. Numeric performance budgets remain governed by OBD-09/10.

## 2. Users and jobs

Personas are usage examples; authority comes only from current Workspace/Matter roles.

| User | Job to be done | Needed result |
|---|---|---|
| Contributor | Find a known Action or Requirement quickly. | Result preserves Action versus Requirement and names its Matter. |
| Reviewer / Manager | Find a Matter or Document without remembering its Workspace. | Result shows enough authorized scope context to distinguish duplicates. |
| Transaction Owner | Move among active Workspaces and Matters. | Current access is rechecked; Workspace ownership does not imply confidential-Matter access. |
| Viewer | Find readable records without implied edit rights. | Read-only destination; result never creates a command or grant. |

## 3. Proposed MVP scope

Quick Search retains a static **Pages / Trang** group and adds server-backed metadata groups:

| Group | Match field | Visible context | Authorization |
|---|---|---|---|
| Workspaces / Không gian | Workspace name | Type label | ACTIVE Workspace membership |
| Matters / Hồ sơ | Matter title | Workspace name, caller Matter role | ACTIVE Workspace membership and explicit ACTIVE Matter membership |
| Work items / Công việc | Action/Requirement title | Kind, Matter title, Workspace name | Current authorized Matter read |
| Documents / Tài liệu | Document name | Matter title, Workspace name | Current authorized Matter read; document inherits Matter scope |

Stable IDs build destinations but are not normal visible labels. A Filing appears once as its Action/Work Item subtype; it does not also appear as a duplicate Filing result.

MVP searches title/name metadata only. It excludes file content, binary filenames, OCR, embeddings/AI, evidence descriptions, event history, people/email, external references, comments, signatures, audit logs, saved/recent searches, analytics, advanced typo/synonym support, and new roles or document ACLs.

## 4. Business and interaction requirements

These feature-local proposal IDs do not replace canonical `FR-001..020` until PO approval and traceability intake.

| ID | Requirement |
|---|---|
| QS-BR-001 | One input returns separately labelled Page, Workspace, Matter, Work Item, and Document groups. |
| QS-BR-002 | Authorization runs before metadata, counts, `hasMore`, or pagination enter a response; inaccessible and nonexistent records are indistinguishable. |
| QS-BR-003 | Work Item results preserve Requirement versus Action; Filing remains one Action subtype. |
| QS-BR-004 | Duplicate names show authorized Workspace/Matter context and available record metadata: Work Item outcome excerpt, execution and due date; Document current version number/upload time. If still identical, offer Open to inspect. Never use raw IDs as primary labels or imply guaranteed uniqueness. |
| QS-BR-005 | Loading, no match, partial, unavailable, access-changed, and stale-response states are distinct and accessible. |
| QS-BR-006 | Results are keyboard/mobile operable and supplied copy is English/Vietnamese-ready; user-authored legal text is never translated. |
| QS-BR-007 | Query text and returned titles are not persisted in browser history, analytics, public caches, domain history, or routine logs by default. |

Behavior:

- Empty query: show Pages only; do not expose recent business records or query history.
- Zero or one trimmed Unicode character shows the localized minimum-length hint and makes no business-data request. More than 100 code points shows an inline validation error and makes no request; the client must not silently truncate the user's text.
- After the business threshold is reached, business-data results are the primary section and matching Pages are clearly secondary. While data results are loading, Enter does not jump to a static Page or any prior/default result.
- Proposed matching: trim, normalize composed/decomposed Unicode forms, apply locale-independent case folding, strip combining diacritics, and map Vietnamese `đ`/`Đ` to `d` for comparison only. Display the original stored title unchanged.
- Literal `%`, `_`, quotes, backslashes, and other punctuation are search text, not SQL wildcard or query syntax. Backend matching is parameterized and escapes datastore pattern metacharacters.
- Rank exact normalized match, then prefix, then substring. Within the same match tier, authorized matches from the current Matter rank first; this is not an access rule or implicit filter.
- Return five results per business group. When `hasMore=true`, render a group-local **Show more / Xem thêm** control that appends the next five results through the current query's opaque cursor. Preserve the query and focused control, use stable ordering/tie-breaking, and never infer a total from truncated pages. The server rejects a requested page size above 25.
- Query filtering happens before limit/pagination. An implementation that searches only already-loaded rows fails the requirement.
- Proposed client default: 200 ms debounce. This is an implementation default for validation, not a release SLO.
- The active-result identity is stable for the current query. Arrow keys move through enabled current-query results; Enter opens only the visibly active current-query result; Escape closes and returns focus; Tab remains within the dialog. Result names wrap without widening the dialog.
- Clicking a result performs client-side navigation to a normal read route without a full-page form submission/reload; the destination reauthorizes on the server. Search results are never trusted as commands or durable grants. Show more appends in place without a page reload or query reset.

Suggested copy:

| State | English | Vietnamese |
|---|---|---|
| Input | Search pages and legal work | Tìm trang và công việc pháp lý |
| Too short | Enter at least 2 characters to search records. | Nhập ít nhất 2 ký tự để tìm bản ghi. |
| Too long | Search text must be 100 characters or fewer. | Nội dung tìm kiếm không được vượt quá 100 ký tự. |
| Loading | Searching authorized records… | Đang tìm các bản ghi được phép xem… |
| No match | No authorized result matches this search. | Không có kết quả được phép xem nào khớp. |
| Partial | Some result types are temporarily unavailable. | Một số loại kết quả tạm thời không khả dụng. |
| Unavailable | Record search is unavailable. Page navigation still works. | Tìm bản ghi đang không khả dụng. Điều hướng trang vẫn hoạt động. |
| Access changed | Your access changed. Results were cleared; search again. | Quyền truy cập đã thay đổi. Kết quả đã được xóa; hãy tìm lại. |

## 5. Authorization, tenancy, privacy, and stale data

The approved Permission Matrix remains authoritative. Search does not grant access.

- Matter, Work Item, and Document results require current scoped authorization under the existing session-currentness/version rules. Search must not extend the current authorization TTL or promise stronger instantaneous revocation than the accepted identity contract.
- A Workspace OWNER without explicit Matter membership cannot discover that confidential Matter or its children.
- The backend derives the actor from the authenticated session and fails closed on lookup/error. Browser-supplied Workspace/Matter IDs are hints only and never authorization evidence.
- If query or Matter context changes, visible business results are cleared before the next fetch; an older response cannot flash results from the prior query/scope.
- If authorization becomes stale, the next authorized search/read follows the existing currentness rules and fails closed. The UI clears affected results rather than retaining a stale title.
- The browser sends query text to the same-origin BFF in a POST JSON body, not a URL, so it does not enter browser navigation/history or routine URL/access logs. Existing BFF origin/CSRF protections remain in force even though search is read-only.
- Public/shared caching is forbidden. The safe MVP default is private/no-store. Cache keys must never omit actor and authorization context.
- Routine logs may record status, type counts, and duration, but not raw query text or returned legal titles. Denial logging must not echo the searched secret.
- Identical inaccessible/nonexistent outcomes expose no title, document metadata, count, `hasMore` change, group marker, or intentionally different response.

## 6. Proposed API and engineering handoff

The exact routes are an API-design proposal, not approved contracts. The preferred browser boundary is same-origin `POST /api/search` with JSON `{ q, types?, matterId?, limit?, cursors? }`. The BFF may call a bounded Go API. A BFF-to-Go GET is allowed only if raw query redaction is verified end-to-end across application, proxy, ingress, and provider access logs; POST JSON is the safer default. Neither layer logs the body.

Proposed request: validated `q` (2–100 code points), optional type allowlist, optional current-Matter ranking hint, server-capped per-group limit, and opaque per-group cursors for Show more. The ranking hint never grants or restricts access.

Proposed response:

```text
{
  query,
  asOf,
  groups: {
    workspaces: { status, items, hasMore, nextCursor? },
    matters:    { status, items, hasMore, nextCursor? },
    workItems:  { status, items, hasMore, nextCursor? },
    documents:  { status, items, hasMore, nextCursor? }
  }
}
```

Each item contains type, stable ID, original label, authorized scope labels, and the IDs needed by existing allowlisted route helpers. Work Items also return kind; Matters may reuse caller role already present in Matter discovery. It excludes content, filenames, evidence, hidden-child counts, and write permissions.

Normal group `status` is `ok` or `unavailable`. Group-level `denied` is permitted only when the entire capability is unavailable to the caller independent of whether a matching record exists; it must never encode a per-record membership failure or hidden match. Authentication failure clears every business group and enters the existing sign-in/session-expired UX. Configured group headings remain fixed for all authenticated users, including no-match responses, so group presence does not reveal a hidden entity.

Partial group failure is explicit. If one common snapshot is impossible, each group returns its own `asOf`. Every Show more cursor is opaque and bound to actor/current authorization, normalized query, result type, sort order, page size, and snapshot/provenance. A cursor cannot change scope or query, and stale/invalid cursors fail closed. Ordering is exact match, prefix, substring, current-Matter boost, normalized label, then stable ID; this prevents duplicates or reordering across pages.

Backend implementation requirements:

1. One authorization-first search service with bounded per-type queries; reuse Matter discovery semantics without weakening them.
2. Apply normalized title/name filter in the data query before limit/cursor; use deterministic stable tie-breaking and a hard server page-size cap of 25.
3. Retain existing session-currentness rules and fail-closed errors; do not add a separate access cache.
4. Add query-plan/scale evidence before production acceptance; do not mandate a search-engine dependency for MVP.

Frontend implementation requirements:

1. Keep Pages locally available while business search loads/fails, but typed business results remain primary and Pages clearly secondary.
2. Debounce/cancel or sequence requests and reject out-of-order responses, including Matter-context switches; reset the active result when the query/result identity changes.
3. Use the existing shared Dialog/input/result-list/localization/route patterns.
4. Clear business results on access/session error; invoke existing sign-in UX on authentication failure; never navigate automatically because only one match exists and never let Enter activate a stale/static fallback while business results are pending.
5. Implement group-local Show more with the opaque current-query cursor, five-row append, stable focus, de-duplication, and no full-page reload.

## 7. Acceptance and QA matrix

All cases use synthetic data and record actor, memberships, query, source revision, response provenance, and visible output. All are NOT_RUN until implementation.

| ID | Given / When | Then |
|---|---|---|
| QS-AC-001 | Authenticated user opens an empty palette. | Pages remain keyboard-accessible; no business request occurs. |
| QS-AC-002 | Authorized names across all four business groups match `atlas`. | Correct grouped labels, type/scope context, and destinations render. |
| QS-AC-003 | Requirement and Action share a title; one Action is a Filing. | Requirement/Action identity remains correct; Filing appears once. |
| QS-AC-004 | Workspace OWNER lacks membership in confidential Matter B and searches B's exact child titles. | No B data, count, `hasMore`, group marker, destination, or existence-specific error appears. |
| QS-AC-005 | User belongs only to Workspace A and guesses Workspace B/Matter B identifiers. | Outcome is indistinguishable from no authorized match; no B parent context is fetched. |
| QS-AC-006 | Q1 is pending, then query or Matter context changes to Q2. | Q1 rows and active-result identity clear before fetch; late Q1 response never renders; Enter cannot open Q1 or a default Page. |
| QS-AC-007 | Access expires/revokes according to existing currentness rules while the palette is open. | Next search/read fails closed; visible affected results clear; destination read reauthorizes. |
| QS-AC-008 | Duplicate authorized names exist in different scopes. | Authorized labels distinguish results without raw IDs as primary text. |
| QS-AC-009 | `Hồ sơ tái cấu trúc` exists; user searches case/NFC variants and proposed `ho so tai cau truc`. | Original title displays; approved normalized variants match deterministically. |
| QS-AC-010 | A group has 12 authorized matches with tied normalized labels; the user chooses Show more twice while another group fails. | The group appends 5, then 5, then 2 rows in stable order with no duplicate, reorder, query reset, focus loss, full reload, or invented total; partial state identifies only the unavailable capability. Replaying a cursor under another query, scope, actor, or page size fails closed. |
| QS-AC-011 | Mouse-free user invokes Ctrl/Command-K, searches, changes query while loading, navigates, opens, and closes. | Only the visibly active current-query result opens through client navigation; correct focus order, focus trap/return, and polite announcements. |
| QS-AC-012 | 320/390 px, 200% zoom, long English/Vietnamese duplicate names. | Labels wrap, context remains visible, no horizontal page overflow, touch targets remain operable. |
| QS-AC-013 | Synthetic confidential query succeeds, fails, and retries. | Raw query/titles absent from public cache, persistent browser storage, analytics, and routine logs. |
| QS-AC-014 | Approved W1 and larger synthetic fixtures run exact/prefix/substring searches. | Completeness, query plan, p50/p95, payload, cancellation, and errors are recorded; no SLA inferred. |
| QS-AC-015 | More than 200 authorized records exist and the only match sorts beyond the first 200 unfiltered records. | The sole match is returned because filtering precedes limit/cursor. A separate broad query matching more than five rows also exercises page two with no page-one duplicates. |
| QS-AC-016 | The user enters 0, 1, 2, 100, and 101 code points; `Đ`/`đ`, composed/decomposed accents, `%`, `_`, quotes, and backslashes are included. | 0/1 shows guidance and 101 shows an inline error with no business request; valid lengths are not silently truncated; Vietnamese forms match as specified; punctuation is literal and cannot alter the query or inject datastore syntax. |
| QS-AC-017 | Hidden records match exactly, then the same query runs in a fixture with no such records. | Both responses retain the same configured groups and expose no differing `denied`, count, `hasMore`, hidden context, or existence-specific detail. A group-level denial appears only for a capability globally unavailable to that actor. |
| QS-AC-018 | A synthetic confidential query is sent through browser, BFF, Go API, reverse proxy, and test ingress. | Query text is absent from browser URL/history and routine URL/access/body logs; response is private/no-store; the same-origin POST passes existing CSRF/origin checks. |

Independent QA must include backend negative isolation, the >200 filter-before-limit case, multi-page cursor/query binding, literal-character/injection cases, stale-response races, browser/BFF/proxy log inspection, frontend error/keyboard/localization tests, and rendered responsive/screen-reader checks. UI filtering alone cannot prove isolation.

## 8. Traceability, decisions, and status

| Proposed requirement | Existing approved dependency | Qualification |
|---|---|---|
| QS-BR-002, QS-AC-004..007 | FR-018; AC-135; NFR-001/002; Permission Matrix | Reuses approved isolation and currentness; creates no role. |
| QS-BR-003 | FR-001 | Requirement is not Action. |
| Work Item results | FR-003/004/010/011 | New discoverability surface over existing records. |
| Document results | FR-015 | Metadata inherits current Matter boundary; no content search. |
| QS-BR-005/006 | NFR-007/008/010/012/013 | Accessibility, error honesty, localization, testability. |

Recommended defaults avoid blocking estimation. PO acceptance of this BRD confirms: five result groups including Pages; Vietnamese diacritic-insensitive metadata matching; and no persistent query history/telemetry by default. A different choice requires a BRD revision, not an engineering assumption. The proposed endpoint and payload receive normal API-contract review during candidate intake; that review is not a separate permission gate or reason to stop a bounded implementation after scope acceptance.

Risks: client fan-out can miss matches; each added result group creates an indirect retrieval path; existing Matter discovery notes an in-memory scale limit; partial responses need a stable accessibility contract. These require implementation evidence and independent review.

Validation state: documentation/source analysis only. No product code, executable test, browser acceptance, performance measurement, security test, commit, push, deployment, or production approval occurred.

## PO duplicate-result decision — 2026-11-01

The PO accepted additional authorized metadata and immediate implementation. QS-D01 is resolved as specified in the current implementation plan; optional metadata cannot guarantee unique presentation. Include exact same-Matter duplicate fixtures and detail-route checks. File content, binary filenames and new permissions remain excluded.
