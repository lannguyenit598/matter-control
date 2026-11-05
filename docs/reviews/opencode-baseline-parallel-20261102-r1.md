# OpenCode baseline parallel review — 2026-11-02 (r1)

Task: MC-OPENCODE-BASELINE-PARALLEL-20261102. Constraint honored: READ_HASH_STATIC_ONLY. Verdict: **PASS_SOURCE_ONLY_WITH_LIMITATIONS**. Priority: P1 (independent verification while ZCode implements). Reviewer status: **DONE (source review only; no runtime acceptance)**.

## 1. Reviewer identity and independence

- Harness: OpenCode v2.2.5, running locally on the project workstation (darwin). Model: **GLM-5.3-Flash Free** (provider `opencode`, model `glm-5.3-flash-free`). No automatic provider/model switching or paid retry occurred; there were also no provider calls at all during review.
- Independence: a fresh-session reviewing agent, not an author of any reviewed source. All reviewed code authorship is Local Codex and/or external agents (ZCode/Claude/Other); this reviewer is process-independent of those authors and reviewed the frozen snapshot rather than anyone's narration.
- Deviation **DEV-1** (disclosed for honesty): during evidence collection (2026-11-02, prior phase), two read-only node probes imported the snapshot's `zod` dependency and `apps/frontend/src/features/search/schemas.ts` to check zod-RFC3339 acceptance and q-trim length semantics. That narrowly crosses the prompt's "no execution/import of reviewed source" rule. No application logic, tests, builds, browsers, networks or databases were run; no reviewed file was modified; the results are recorded as supporting observations only. Recorded in `review-inputs.json#deviations[0]` (DEV-1).
- Rule compliance: every shell invocation on this workstation was prefixed with `rtk` (non-wrapped invocations via `rtk proxy`). Semble was not used: no index could be built without writing index files into/near the reviewed inputs, so targeted literal/exact-path reads were used per the prompt's stated fallback. No live-tree semantic result was substituted for frozen-source proof.

## 2. Input binding and hash verification

| Item | Value |
|---|---|
| Frozen commit | `7bf198c103476f490ebbdf58b1bd563d0bba8a61` (branch `codex/unified-project-flow` at prepare time; tree `bf762ff72b6b7c77e21ed0eec34033ba34bb4fdf`) |
| Manifest | `/private/tmp/mc-opencode-baseline-20261102-zw_hhfw8/inputs-manifest.json` — 201,860 bytes; SHA-256 `db836183f639f4602d1a74f2e0fee696105217869c84c1ec1b67fc5bd2841c7e` (byte-level match re-checked 2026-11-03) |
| Payload | 1029 declared regular files / 10,030,599 bytes; 3 tracked nonregular/symlink entries intentionally not materialized (declared in manifest); no full tracked-tree equivalence claimed for those |
| Opening verification (2026-11-02) | 1029/1029 SHA-256 matched; 0 bad, 0 missing |
| Closing verification (**2026-11-03T01:28Z**, before return) | 1029/1029 SHA-256 matched again; 0 bad, 0 missing; aggregate bytes unchanged — **no input drift** |
| ZCode concurrency | Live HEAD moves are out of scope and were never treated as input; all reads were from the pinned snapshot, never from moving bytes |

No NEEDS_INPUT_REFRESH condition arose; no repinning or overwriting occurred.

## 3. Findings

Detected defects (source-only, actionable, deduplicated; full detail in `findings.json`):

- **F-1 — LOW, hygiene.** Three committed `.orig` merge/patch artifacts ship inside the frozen tree: `apps/backend/docs/api.md.orig`, `apps/backend/internal/adapter/inbound/productapi/data_server_test.go.orig`, `apps/frontend/src/features/data-transfer/components/data-transfer-ui.test.tsx.orig`. No build/runtime impact observed (none are compiled/executed), but they risk being mistaken for canonical content by future searches/packaging. Minimal remedy: delete in ZCode's next delta and add `*.orig` to ignore rules (or document the evidence-retention policy that keeps them).
- **F-2 — LOW/MEDIUM, validation-contract gap (zero-time instants end-to-end).** `parseInstant` (`apps/backend/internal/core/service/work_service.go:317-325`) and the equivalent filing/dataops paths accept **any** RFC3339 instant, including Go's zero time `"0001-01-01T00:00:00Z"`; the timestamps are persisted (TIMESTAMPTZ), re-emitted by Search SQL (`to_char`, `queries_mattercontrol/search.sql:15,18,21`), re-parsed (`search_store.go:59-72`), sent by the handler (`search_handlers.go:53`), accepted by the frontend schemas (`search/schemas.ts:41,43,52` — `z.iso.datetime({offset:true})` accepts year-0001; verified via DEV-1 probe), and rendered (`localized-instant.tsx:16-22`, quick-search `:364-369`). No crash, no leak, no write-intent risk observed; but a legal control plane will show year-0001 "due" or "uploaded" values on cards/detail/search once such an instant is written. Minimal remedy: one shared plausible-range instant validation on the write side (plus the same refinement in the frontend schemas) and a representative regression.

Known-assigned, recorded per prompt (not new discovery): **KA-1** stale filing-advance stage default (`filing-forms.tsx:303`, `detail.next[0]` in `useState` initializer) → assigned to ZCode as RLF-01.

Closed observations (no defect):
- **O-1** The earlier-pass suspicion of a nested *interactive* inside a quick-search table row does **not** hold against this frozen tree: results are `ul/li/Link` (`quick-search.tsx:248-289`, pages `:336-352`), and the work-grid title cell (`work-grid.tsx:143-160`, `row-title-edit.tsx:25-40`) renders Link and edit-Button as **siblings** via `InlineEdit` (`inline-edit.tsx:69-89`).
- **O-2** q semantics (control-char refine *before* trim, then 2..100 on the trimmed value): client already sends `query.trim()` (`use-search.ts:25,48`); no ordering or accepted-padding defect.

## 4. Q1 — Focus/Search repair dispositions (source-only)

All three original findings from `docs/reviews/focus-search-candidate-20261102-r1.md` were reviewed against the pinned tree. Dispositions are source-level; none of the tests were executed by this reviewer (author green runs in `focus-search-implementation-20261101-r1/return.md` are **CITED**, never REVIEWER_EXECUTED).

- **FS-R1 (Resume access-loss purge) — CLOSED_SOURCE_ONLY.** `provider.tsx` dispatch routes every non-eligible reply through `observeRefusal` mapping `access-lost`/`ineligible`/`unavailable` (`provider.tsx:354-378`), and its catch maps 401/`ui-session-changed` to `observeRefusal('session-ended')` (`:396-404`). `observeRefusal` (`:60-123`) fences by generation token, aborts the pending read, clears the protected title, records `endedEpoch`, invalidates the coordinator for exactly the observed epoch (terminal epoch fencing; a foreign-epoch slot is refused at `:85-91`), scoped-announces over `notifyPrivateUi`, and either resets (`:95`) or persists suspension (`:97`, mapping to idle/suspended/unsupported states with explicit `cause`); coordinator failure falls back to `unsupported` (`:117-119`). Regression tests present and behaviorally oriented (assert shared IDB stored state, not mirrors): access-lost fence (`provider.test.tsx:111-122`), persistent suspension on ineligible (`:124-135`), session-loss propagation + purge + no-revival (`:137-154`). No meaningful behavioral regression identified in source.
- **FS-R2 (backward wall clock at restore) — CLOSED_SOURCE_ONLY.** The restore path checks `Date.now() < active.writtenAtWallMs → observeRefusal('clock')` before publishing active state (`provider.tsx:176-179`); every refocus/visibility entry re-enters `sync()` so hidden-tab callbacks cannot bypass it (`:253-261,292`); `transition` additionally rejects `now < writtenAtWallMs` except suspend (`model.ts:100`), and `remaining()` clamps safely (`model.ts:45-53`). Regressions: provider restore test (`provider.test.tsx:156-172`) and model backward-clock test (`model.test.ts:94`).
- **FS-R3 (pagination session-loss propagation) — CLOSED_SOURCE_ONLY.** The `more()` catch now classifies 401/`ui-session-changed` as `session-ended` and calls the same scoped `notifyPrivateUi` as the initial-search path, retaining the sequence/key fencing before publishing (`use-search.ts:142-155`; initial path `:61-75`). Regression: `search.test.tsx:45-89` broadcasts session loss observed during paging and clears the private query.

None of these dispositions is runtime acceptance: no browser, no IDB instance, no real IdP, no clock jump was executed by this reviewer.

## 5. Q2 — scope covered and held boundaries (source level)

Areas audited, with the discrete defects already listed (F-1, F-2):

- Search authorization and data path: membership CTEs gate before matching and limit (`search.sql:2-38`); same-name detection precedes pagination; the fingerprint aggregates all projection/sort inputs (`:28-34`); SQL `to_char`/coalesce memory-store equivalence confirmed (`memory_search.go:149-204`); hidden-matter edits never surface rows and out-of-perimeter actors get zero rows (contract test, `contract_search.go:28-113`); document search projects metadata only (label = document name; no content/filenames).
- Cursor safety: tokens bound to actor/epoch/query/group/limit/hint/anchor, 6-minute expiry, tamper/append/oversize rejected, missing key disables the evaluation codec (`search_cursor_test.go:13-50`).
- HTTP surface: 401/400/413 table and `Cache-Control: private,no-store` everywhere non-401 (`search_handlers_test.go:11-38`); search read-POST mints nothing and validates before store read (`search_service_test.go:32-55`); revoked-access-mid-pagination converges through the fingerprint/anchor staleness (`search_store.go:46-48`) and the frontend stale status (`use-search.ts`).
- Focus boundaries: identity/epoch fencing on every publish, scoped notifications, timer progress never touched legal state (fixes above; historical claims from the implementation return are CITED, not adopted).
- CAS/receipt behavior at new seams: `InlineEdit` save is CAS-only via `If-Match` (`row-title-edit.tsx:38`), refusal of unknown outcome cannot be resent (`inline-edit.tsx:46-58` — "blocked" requires re-read), so no blind resend path was introduced by the delta.
- Sidebar locale fix (the frozen commit's own summary), Select/dialog/calendar/density/title-navigation: source composition reviewed, no new actionable defect this pass (C-18, C-19); visual/SR/keyboard runtime acceptance remains explicitly open elsewhere and is not granted by this review.

## 6. Q3 — evidence cross-check and final-delta QA checklist for ZCode's eventual return

CITED (author-executed, retained in the frozen packets; not re-run): backend `make check` recorded in `focus-search-implementation-20261101-r1/return.md` (search contract PG17/PG18 rows); frontend `pnpm check` 906 passed/12 skipped (sidebar-locale return) and 896/12 (focus-search return); production Webpack + CSS guard; Storybook build; finite HTTP approximation 128 ops/0 errors; focus zero-domain-write before/after; privacy scan bounded scope. CROSS_CHECKED by this reviewer (structural source checks): C-01…C-19 in `checks.json` (hash binding, SQL authorization ordering, cursor binding, refusal handling, regressions presence, hygiene). REVIEWER_EXECUTED: opening/closing hash verification, structural JSON validation of outputs, DEV-1 zod probes (disclosed).

Prepare these gates for the delta review that follows ZCode's return (a checklist is not a verdict and binds no unreturned source):

1. New binding first: fresh manifest over the delta as committed; re-verify every payload; record absolute output paths/hashes; no reuse of this sealed review's namespace.
2. Authorization/atomicity/replay: per-row rechecks inside transactions for any new bulk/import W6-like path; receipts keyed and acknowledged before unlock; UNKNOWN stays unknown with no blind resend.
3. Search/Focus races: revocation mid-franchise mid-pagination and mid-session; access-loss purge order; restoration with pathological clocks; sibling synchronous announcements across two tabs.
4. Keyboard/SR/responsive: real AT pass on quick search (combobox/listbox advertised semantics — currently `ul/li`), dense modes, 320/390/800/801 viewports, vi locale.
5. Current-source manifests (fresh 1029-style binding; plus the removed `.orig` files if F-1 is fixed); `grep` CI for committed merge artifacts.
6. Human checks signed off by the Product Owner strictly after an independent review of the returned source.

## 7. Outputs (new, collision-checked)

- `docs/reviews/opencode-baseline-parallel-20261102-r1.md` — this report. (This file's own SHA-256 is published in the chat return; the testing JSON hashes below were computed independently of this file at write time.)
- `docs/testing/opencode-baseline-parallel-20261102-r1/`
  - `review-inputs.json` — SHA-256 `c10f8dfb63bd785ec10fcc17e6c2eb22a2e46a0d91a85a8c8e45bf8c77f41aaa`
  - `checks.json` — SHA-256 `12bb7c78779e66f3c83cdef8ead6952762c4d737a2dc7e7a65507899a180e02b`
  - `findings.json` — SHA-256 `c048306c944191f4767ab257b189016997f67dd10cfd055eb68a0c38060270d1` (updated once post-write to fix a garbled phrase in F-2 "consequence"; JSON re-validated; the pre-edit file hashed `6ca73ae1e0a7160ce4e1b92f789b8d42e9d3872ba25c3ffcc8091e2ae2f8b375`)

All three JSON files were structurally validated (plain node `JSON.parse`, not a reviewed file). Both output namespaces were verified absent immediately before creation; nothing was overwritten.

## 8. Outstanding instructions asked of this review (negatives)

- No source repairs, edits, copy moves across repositories, or re-pinning were performed.
- ZCode's return is untouched and its live focused work does not overlap with the frozen set reviewed (both areas were only read).

## 9. Skipped and remaining risks

Skipped: any runtime/browser/IdP/DB/HTTP/SQL/Docker usage; test/build reruns including the CITED regressions; Semble semantic search (indexing constraint instead of blind grep); review of the 3 unmaterialized symlink entries; full read of select-density/work-title-link return files (areas read from pinned source instead); visual/SR/IM accessibility acceptance; line-level read of every one of the 1029 files (read profile ~75 files + targeted greps, spread across the assigned focus areas). DEV-1 narrow deviation as disclosed.

Remaining risks: F-2's force/exploit field remains unverified at runtime, so severity could move either way once a write is actually attempted against a running store; whether `.orig` files are intentional evidence retention is unknown to this reviewer and unresolved pending a policy answer; the A11y story for the new `ul/li` quick search vs possible table-based grids elsewhere is left to the next evaluation; the identity/provider attribution of this OpenCode review rests on the local harness's self-report of its environment.
