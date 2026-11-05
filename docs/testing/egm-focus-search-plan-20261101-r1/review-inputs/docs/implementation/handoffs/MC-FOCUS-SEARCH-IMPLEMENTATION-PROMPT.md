# MC-FOCUS-SEARCH-IMPLEMENTATION — complete local candidate

Prepared by Local Codex, 2026-11-01. **PREPARED_NOT_DISPATCHED**. This file is an engineer handoff; its existence is not execution, product acceptance or release authorization. Run after the PO actually assigns this bounded implementation to one writer. Preserve existing authorship and dirty work.

## Assignment

Implement Focus and product-data Quick Search as one complete locally verified candidate, using the two existing BRDs and the codebase design below. Do not stop after reading/design intake, a static timer, mock search, one wave or a planning report. Continue through implementation, regression checks, local runtime and evidence until a coherent candidate exists or an exact external blocker prevents a named step.

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Expected coordination branch: `codex/unified-project-flow`. Design baseline HEAD978d8fc plus dirty work; fresh source wins. Read root/component AGENTS and RTK rules. Confirm actual agent/tool, branch/head, source writer and changed files. A running app/MCP process alone is not a competing writer. Do not rollback unrelated source, regenerate to fit an old snapshot, reset/stash/clean the checkout or claim another external product ran.

Read fully:

1. `docs/architecture/focus-search-codebase-design.md`.
2. `docs/architecture/focus-module-design.md`.
3. `docs/architecture/quick-search-module-design.md`.
4. `docs/requirements/focus-mode-brd.md` and `quick-search-brd.md`.
5. `docs/requirements/permission-matrix.md`, current `docs/implementation/p0-zcode-execution/local-contract.md`, current project-status/workboard and relevant component rules.
6. Exact implementation source paths from the pinned design inputs, then reconcile any drift. Existing calendar/dialog/Pane changes must survive.

## Required implementation

- FS-01: token-free public principal/epoch/expiry projection at the app seam; two privacy events; no cross-feature imports or token-bearing client context; preserve draft/UNKNOWN and partial-denial semantics.
- FS-02/03: Work Focus module, model, atomic IndexedDB current slot/fence, notification-only BroadcastChannel, authoritative eligibility BFF, My Work entry and persistent header controller. One same-origin private session across tabs. Keep server next ordering; no domain writes, history, billing, analytics, auto-completion, cross-device claim or fallback independent timers.
- FS-04: Go Search module and PostgreSQL+memory adapters over authorized Workspace/Matter/Action/Requirement/Document metadata. Normalize/filter before limit, literal punctuation, no hidden-parent disclosure. Filing is one Action. Versioned encrypted cursors and visible-projection fingerprint reset on change; hidden records never affect that fingerprint.
- FS-05: same-origin POST JSON throughout Search, narrow shared `mcRequest` read semantics, explicit problems/no-store/body limits, grouped palette with current-query active item, IME/debounce/cancellation and group-local Show more. No frontend first200/global fan-out, raw IDs as labels or raw queries in URLs/logs.
- FS-06: run complete local verification, refresh only explicitly owned frontend/API runtime if necessary after fresh resource identity checks, and assemble one candidate with scope-limited manifests and a manual test runbook. Do not touch an unowned local database/container/process. Use new synthetic fixtures and dedicated local cursor key0600; never print it or add it to Git.

Preserve project architecture: Go core stdlib/inward imports, SQL through queries+sqlc generation, frontend Atomic shared primitives and feature modules. New server route composition can import repositories from multiple features; feature modules cannot. No new framework/provider or package upgrade. An adapter-only exact-version promotion of existing x/text must be recorded and checked. Verify PG support/normalization on disposable fixtures; never silently weaken EN/VI matching.

## Verification and evidence

Follow every AC-FOCUS-01..18 and QS-AC-001..018, recording PASS/FAIL/NOT_RUN/BLOCKED separately. Implement tests at the chosen module interfaces, including failing-before evidence for reproduced bugs where feasible. Keep existing unrelated tests; do not add a second mirror suite merely to boost counts.

At minimum:

- Pure clock/frozen-time/expiry/DST-independent duration and transition cases.
- Real shared coordination: two tabs, simultaneous Start, stale Pause/+5/End, pending validation after logout/epoch switch, aborted transaction and no false committed End. A memory adapter is not browser IDB proof.
- Revocation vs missing candidate vs unavailable; no protected title flash, no raw-ID fallback, no automatic resume/regrant revival; bounded visible freshness and measured read fan-out.
- Real Go+PostgreSQL isolation, >200 records with only late match, 12 results paging5/5/2, same-name ordering, changed authorized projection reset and hidden-record mutation equivalence.
- Unicode/root-case/EN-VI vectors, punctuation/injection/length, encrypted cursor tamper/wrong actor/epoch/query/group/limit/expiry/rotation and no plaintext labels.
- Search POST timeout/5xx stays read-unavailable; original creation/import UNKNOWN behavior is unchanged. No-store, exact Origin, schema/body bounds and no canary terms in ordinary application/proxy logs.
- Keyboard, event-only announcements,320/390/800/801px, long EN/VI, light/dark, open forms/dialogs and existing local calendar controls. Follow official browser permissions; if unavailable, mark render/real-tab tests BLOCKED and prepare exact manual cases, never bypass through another tool.
- Before/after synthetic domain revisions/events and HTTP command census prove Focus makes zero domain writes; explicit real work commands retain CAS/idempotency/UNKNOWN behavior.

Run backend `make check` with owned PG fixture and frontend `pnpm check`, production build/CSS guard and Storybook on the exact candidate. Disable pnpm12 automatic dependency install only in a controlled verification environment when reusing symlinked installed dependencies; never let an implicit install relink another writer's node_modules. Preserve failed attempts with causes.

Write a unique task record and `docs/testing/focus-search-implementation-<actual-date>-r1/` only after absence checks. Include actual identity/source pins, commands/cwd/UTC/exit, result matrix, request/log/privacy census, resource ownership/cleanup, screenshots only from allowed synthetic UI, exact changed files and one final return. Update actual contract/config/ops/API documentation with implemented behavior and exact current revision. New tests/self-checks are author verification, not independent acceptance.

End at IMPLEMENTED_SELF_TESTED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS if independent/browser/provider gates remain. Assign/prepare one nonauthor review packet for this exact candidate. No self-awarded DONE, production readiness, $0 claim, commit, push, merge, cloud provisioning, provider-policy change or deploy is authorized by this handoff. Report a genuine missing dependency concretely and continue unaffected work; do not request continuation after each internal stage.
