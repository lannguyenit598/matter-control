# MC-003A-ARCH-COMPAT — Antigravity implementation constraints

Author: Claude Code (actual) 2.1.310, model claude-opus-5-5, Solution Architecture. 2026-10-25T07:21Z. Repository head 6530858 (intake base dbcc4a9), frozen local-r3 24103d1, frontend reference nextjs-atomic-starter 3e5a642 (both /tmp checkouts clean, read-only).

**Status: architecture constraints for a future authorized implementation. Not dispatch permission.** Full STEP03B and product UI/API implementation remain NOT_AUTHORIZED. Every API reference below is to `docs/architecture/api-contracts.md`, which is CANDIDATE (PROPOSED / WAITING_ARCHITECTURE_APPROVAL), not an approved contract. Approved PRD/SRS/business rules/state semantics/permission matrix and D-UX01..04 outrank this file. File:line references are to source at 3e5a642, observed by reading only; nothing was built, run or rendered.

MUST = architecture constraint. SHOULD = recommended composition, replaceable by an equivalent that meets the same acceptance. No mandatory new package, wholesale table replacement, spreadsheet extras or new component API is required by anything here.

## 1. Authentication and authorization seam (blocks integration, not design)

- **C-AUTH-1 MUST.** No product data path may use the shared token. `src/lib/api/backend.ts:25` (`session.accessToken ?? serverEnv.API_TOKEN`) must fail closed for MatterControl data: a missing user token is an authentication failure, not a fallback (security-architecture §1, TB-04).
- **C-AUTH-2 MUST.** Demo and anonymous sessions (`src/lib/auth.ts:33-45`, permissions `'*'`) must never reach a product build or product data. `resolveSession()` stays fail-closed (`src/lib/auth-provider.ts:27-36`) until the identity provider is selected by the PO (INT-D02, not selected).
- **C-AUTH-3 MUST.** Authentication only identifies the user. Authorization is active Workspace membership AND explicit Matter membership AND scoped role, evaluated by the backend on every read, write and indirect path (permission-matrix, RULE-017). The coarse `Session.permissions` list is not a MatterControl authorization model. Hidden/disabled affordances are UX only.
- **C-AUTH-4 MUST.** Workspace OWNER gets no implicit Matter access. Assignment never grants access. VIEWER sees read/export only.
- **C-AUTH-5 MUST.** Inaccessible and nonexistent look identical: show one "not available" state with no title, count, file name or party label. Use 403 role text only when the server returns 403 for a member.
- **C-AUTH-6 MUST.** Per-user data is rendered dynamically and never cached across users (security-architecture §4, Next.js caching row).
- **C-AUTH-7 MUST.** Verify/Reject eligibility (designated verifier AND not submitter; OWNER alone insufficient) is decided by the server. If no eligibility hint is provided by the read model (open TQ-03), show the action and render the 403 `self-verification` / `verifier-not-designated` problem accurately; never pretend the UI check is enforcement.
- **INT-A boundary.** The INT-A harness (DEC-028) proves transport only. It sends no Authorization, Cookie or Idempotency-Key. Nothing from it may be presented as product sign-in, isolation or readiness.

## 2. API access and error mapping

- **C-API-1 MUST.** Keep all backend calls behind feature service modules (the existing repository/service pattern under `src/features/*/services`). Components do not call `fetch`/`backendRequest` directly. Reason: ADR-001/ADR-003 are unresolved; option F3 would replace Server Actions with client-side transport, and this seam keeps that change out of components.
- **C-API-2 MUST.** Discriminate errors on HTTP status plus problem `type` from `ApiError.details`. `http-client.ts:82-86` maps 409, 412, 428 and 503 all to `HTTP_ERROR`. The code alone is insufficient.
- **C-API-3 MUST.** Do not route MatterControl mutations through `toActionFailure` unchanged (`action-result.ts:48-70`): it flattens conflict, guard-failed reasons, unavailable and 403 into one generic message. Extend the local result type with typed variants: `validation{fieldErrors}`, `notAvailable`, `forbidden{requiredRole}`, `conflict{currentRevision, serverValue}`, `guardFailed{failedGuards}`, `cycle{path}`, `unavailable{retryAfter}`, `partial{results}`, `outcomeUnknown{idempotencyKey}`. No new dependency.
- **C-API-4 MUST.** Derived fields (dependency, verification, timing, attention) are never sent in a write (candidate → 422) and never computed as authoritative values on the client (RULE-002).
- **C-API-5 MUST.** Show `asOf` provenance on current-state views. Unavailable (503) shows a stale/error state, never an empty list, zero count or READY.
- **C-API-6 SHOULD.** Grid reads use keyset paging. At the selected 50–200-row scale, one request at `limit=200` covers the view. Beyond it, add a "next" cursor control. The starter `Pagination` (`pagination.tsx:8-14`) is page-number based and needs `pageCount`; do not fake a total. A record count shows the loaded/filtered authorized rows unless the server supplies a scoped total.

## 3. Concurrency, stale revision (412) and idempotency

- **C-REV-1 MUST.** Every mutation that names a CAS target sends `If-Match` from the revision the user saw. Candidate: missing → 428, mismatch → 412 `stale-revision` with `currentRevision`. Never rely on the native template leniency, where absent If-Match means no precondition.
- **C-REV-2 MUST.** 412 renders conflict reconciliation: server value plus retained draft, reload/reconcile, no automatic overwrite or silent retry. Treat `stale-criterion-revision` separately: the review must restart against the current criterion.
- **C-REV-3 MUST.** Native INT-A 412 (T10) is a harness transport observation, not product contract evidence.
- **C-IDEM-1 MUST.** Each non-GET user intent gets one Idempotency-Key, stored with its draft above any unmounting boundary, and reused on retry (candidate §4).
- **C-IDEM-2 MUST.** For a mutation, a timeout, network error, rejected Server Action call (`action-result.ts:17-23`) or 503 is **outcome unknown**, not "not applied". Show that state. Offer a retry that reuses the same key, or a reconcile via the operations lookup. An operations 404 means only "no committed outcome visible to you now", never "never committed". The final retry convention is open (INT-D09).

## 4. Bulk editing (RULE-013, candidate §3.6)

- **C-BULK-1 MUST.** Allowed fields are only title, description, assigned internal owner and due date. Blank means unchanged. No state, type, link, criteria, role, verify, waiver, promotion or delete fields.
- **C-BULK-2 MUST.** Preview shows exact IDs, kinds, before/after and row validity from the server preview. Inaccessible IDs show NOT_FOUND without detail.
- **C-BULK-3 MUST.** Commit sends the preview digest. Row CAS is against the **preview-bound** revision. Note: the r3 concept's local `applyBulk` passes each record's current revision into `commitMetadata` (HTML, functions `applyBulk`/`commitMetadata`). That is a simulation shortcut and must not become the production pattern.
- **C-BULK-4 MUST.** A 200 commit response is not success by itself. Read `summary` and per-row `results`. `failed > 0` is a partial result and `applied = 0` is a failure. Never show a success toast or `{ok:true}` for the batch. Stale rows arrive as `STALE` inside the 200, never as a 412.
- **C-BULK-5 MUST.** Keep the result list visible until the user dismisses it. Successful rows deselect; failed rows stay selected with their scoped reason (STALE, FORBIDDEN, NOT_FOUND, INVALID). Retry uses a new failed-only preview (`fromPreviewId, onlyFailed:true`) so successful rows are excluded (AC-133). Retrying the same preview returns stored outcomes and never reapplies.
- **C-BULK-6 MUST.** Binding problems: 404 (no longer authorized or not the actor), 410 preview-expired and 409 preview-mismatch → re-preview, with no partial assumption.
- **C-BULK-7 MUST.** No optimistic display for bulk; results render only after commit.

## 5. Optimistic updates

- **C-OPT-1 SHOULD/MUST.** Optimistic display (React `useOptimistic`) is allowed only for single-record metadata fields (title/description/owner/due). It requires a visible pending state, then replacement by the server response or revert with an explicit error. React reverts optimistic state when the transition ends; showing the error is the caller's job (React reference docs via Context7; installed 19.3.1 behaviour not executed).
- **C-OPT-2 MUST.** Never optimistic for execution transitions, verification, dependency edges, milestone readiness, filing stages, promotion, reopen/cancel, imports or bulk. No gate may look satisfied before server confirmation (A-07).

## 6. Dialog/drawer lifecycle, drafts and focus

Source observations (not runtime results): `dialog.tsx:18-24,82` mounts children only while open; native `showModal()` supplies trap/Escape/focus return; no fallback exists when the opener has been removed. Draft loss and focus landing on `<body>` were **not reproduced**.

- **C-DLG-1 MUST.** Draft state (field values, validation errors, Idempotency-Key) for any edit that can be dismissed lives above the Dialog in the owning feature component, or dismissal is guarded while dirty/pending. The existing veto path (keep `open` while pending, `confirmation-dialog.tsx`) is reused. Zustand, React Hook Form and a new Dialog prop are not required.
- **C-DLG-2 MUST.** On close, return focus to the opener if it is still connected. Otherwise move focus to the labeled table/list container or section heading and announce it (r3 §3.2, I-03, I-12). This is feature-level logic around the existing Dialog. The `focusFallbackId` name from the Antigravity return is optional, not an accepted API.
- **C-DLG-3 MUST.** A failed mutation keeps the dialog open with the error and draft (r3 I-11). Success history is never created client-side for a failed command.
- **C-DLG-4 MUST.** Opening context (drawer/dialog) preserves filter, sort, selection and scroll. Density changes preserve focused object, draft, error, selection and filter.

## 7. Grid composition and keyboard

- **C-GRID-1 SHOULD.** Compose the existing presentational `DataTable` (`data-table.tsx:24-35`) with feature-owned selection, row focus and inline editor. `caption` and `getRowKey` already exist. The single real gap is that `<tr>` (`data-table.tsx:57`) takes only `key` and a fixed className. Row focus and selection (tabIndex, aria-selected, onKeyDown, data-*) therefore need **one** small additive optional row-props callback. Nothing broader is needed, and no new grid library. No universal `role=grid`, virtualization, column resize or spreadsheet paste is required in P0.
- **C-GRID-2 MUST.** Row Up/Down/Enter/Space act only when focus is on the row, never inside a nested editor or control. Native multiline Enter in textareas is preserved. Inline edit: Enter commits an allowed value, Escape cancels, an invalid value stays local with its reason.
- **C-GRID-3 MUST.** Comfortable (44px minimum row) is the default and Compact (36px) is optional. Both are minima with multiline growth (D-UX02); expose density as a data attribute on the table and keep tokens in the existing CSS-variable system.

## 8. Tokens, responsive, mobile

- **C-TOK-1 MUST.** Map the selected `mc-*` roles (design-tokens.json / selected-tokens.css) into the starter's single CSS-variable + `@theme` system (`globals.css:1-40`). Do not ship a second theme system or the alternative boards' palettes. Color supplements text and is never the only axis signal.
- **C-TOK-2 SHOULD.** Add a touch size to the existing Button variants for 44px mobile targets. Current `sm` h-8, `md` h-9 and `icon` size-9 are below the selected touch contract (a design choice, not a universal WCAG threshold).
- **C-MOB-1 MUST.** Mobile keeps the E-01 logical order and every matching record reachable. It shows state/reason/owner and the permitted simple actions, using the same server permissions. Advanced bulk stays on desktop. `MobileNav` is navigation only, not domain triage.
- Static token ratios are not computed-contrast acceptance. Rendered geometry, zoom, contrast and keyboard checks stay in G3/G4.

## 9. Domain invariants the frontend must not bypass

Requirement ≠ Action. Evidence Requirement ≠ Evidence. COMPLETED ≠ VERIFIED. WAITING ≠ BLOCKED. Dependency readiness and milestone readiness are server-computed (RULE-003 vs RULE-008 predicates differ). Upload never verifies or promotes. One current document version; promotion is an explicit OWNER event. Signature completeness is a separate observation. Filing receipt/submission is not outcome/approval. Repeated supplement cycles are retained, and rejection/withdrawal is an explicit negative outcome (OWNER CANCELLED). History is append-only, and corrections append. Import "Draft" means the pre-confirm preview; never introduce a persisted draft record state. Imported VERIFIED labels are claims. Reopen/promote impact shown before confirm is non-authoritative unless the server provides a dry-run (TQ-01).

## 10. Acceptance hooks for a future slice

Each implemented slice needs:

- contract tests against the then-approved API, covering success, each problem type, missing If-Match → 428, stale → 412, bulk partial 200, unknown outcome and replay;
- negative authorization (VIEWER write, cross-workspace uniform 404, revoked access mid-flow, self-verification);
- Grid/Control Room cross-view consistency after each accepted change;
- G3 rendered keyboard/focus/zoom/mobile evidence and G4 independent QA.

None of these are run or claimed by this review.
