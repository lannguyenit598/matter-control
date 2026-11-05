# MatterControl Focus and Quick Search

- Author: Local Codex
- Date: 2026-11-01
- Status: IMPLEMENTATION_IN_PROGRESS / QS-D01_RESOLVED
- Task: MC-FOCUS-SEARCH-EGM-PLAN-20261101
- Review: Six actual fresh-context Goldfish reviews COMPLETE. Author plan dispositions are not yet reviewed or approved implementation.

## Overview

Build one local candidate containing a private Focus timer for a server-eligible Action and Quick Search over authorized Workspace, Matter, Work Item and Document names. Keep the existing Next.js/BFF/Go/PostgreSQL architecture and current legal rules. Reuse current navigation, forms, login and UI controls; do not add a separate search platform, billing, Focus history or a cloud deployment.

The reviewed hypothesis is that the two features can share a small server-provided login identity and scoped privacy reset mechanism while keeping their data and behavior independent. Focus uses an atomic browser store for one current session across tabs. Search uses authorized database reads and treats changes to the current matching result set during paging as a visible refresh, rather than showing incomplete or misleading results. The implementation choices are consolidated in the [revised implementation plan](docs/implementation/focus-search-implementation-plan.md).

## Analysis

### Verified current code

Repository `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, HEAD `978d8fc694a47e9beee528076bcf1af9473997e3`, with existing uncommitted UI work preserved.

- All37 reference inputs from the codebase-design package still match their recorded hashes.
- `features/work/focus`, `features/search`, the proposed Focus/Search BFF routes and the proposed Go Search implementation do not exist yet. This statement comes from exact path checks, not a stale semantic index alone.
- Quick Search still filters local page labels. Current code does not provide global record search.
- `mcRequest` classifies every non-GET as a command. A Search POST would therefore receive command-style UNKNOWN errors unless the read path is deliberately added and tested.
- The draft namespace identifies one login session; it is not the stable principal identity required by the Focus proposal.
- The shared checkout contains current Pane, dialog and calendar/selection work. A clean checkout/reset would discard or exclude relevant source. One source writer must reconcile it before editing shared files.

The two BRDs and three codebase-design documents are inputs, not proof that the new behavior works. Current runtime/frontend test counts do not carry over to the new features.

### Goldfish findings and selected amendments

All six assigned reviewers completed in fresh contexts against the same frozen packet. Capacity permitted two concurrent reviewers in each of three pairs; no earlier findings were supplied to later pairs. Raw19 findings (17 Major,2 Nit) were deduplicated into9 Major and2 Nit, with no Blocker established. This is design analysis, not proof of runtime feasibility. [Verbatim reports, status and synthesis](docs/testing/egm-focus-search-plan-20261101-r1/synthesis.md).

The plan accepts scoped privacy events, navigation-safe logout, matching-result fingerprints, mixed-load evidence, migration failure/rollback ordering, fixed-group diagnostics and existing correlation reuse. It adds a shared stale-control acknowledgement. Stable-principal simplification is deferred rather than blocking implementation. The PO resolved QS-D01: add authorized existing metadata, then offer Open to inspect if still identical.

The principal counterargument remains: the existing aggregate classifier may be sufficient at W1 and a whole-group fingerprint can be simple. Neither is rejected from assumed performance alone. The revised plan defines a finite combined experiment and keeps existing classifier reuse unless it fails, while selecting the smaller query-bound matching projection to avoid unrelated resets.

### Risks challenged by review

| Concern                             | Why it can break this plan                                                                                                                                     | Evidence needed before accepting the approach                                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Whole-projection search fingerprint | Hashing every readable name for each group on every keystroke can cost more than the paged search itself. Default debounce does not make this cheap by itself. | Measure the entire read, including permission joins/fingerprint, at approved W1 and a labelled larger fixture; compare a simpler reset/paging approach. |
| SQL normalization/provider support  | Explicit ICU/root-locale behavior is proposed but not tested here. Default locale or an ASCII fallback can violate EN/VI matching.                             | PG17/18 disposable tests for every Vietnamese vector, NFC/NFD, literal punctuation and actual migration permissions; production support stays separate. |
| Cross-tab timer lifecycle           | IDB storage alone does not prevent stale async validation from resurrecting an ended session. Notifications can fail or arrive late.                           | Two independent handles and real browser tabs racing Start/Pause/+5/End/logout, including aborted commits and old responses.                            |
| Tombstone lifetime                  | A revision fence helps prevent stale writes, but careless cleanup can revive an old session or retain identity data after logout.                              | Define exactly which non-sensitive fields remain and prove all active identity/target/timing data is removed.                                           |
| Shared identity and shell edits     | Moving providers or changing identity can remount existing forms and lose draft/UNKNOWN state.                                                                 | Existing recovery tests plus route/theme/login-change tests with an unresolved form still present.                                                      |
| Search read-POST errors             | A broad transport exception can weaken real command UNKNOWN handling.                                                                                          | Narrow allowlist tests: Search loss is unavailable; existing writes still retain UNKNOWN semantics.                                                     |
| Browser verification                | A memory adapter and build cannot prove real IDB serialization, keyboard focus or rendered layout.                                                             | Official browser and two-tab checks, or exact BLOCKED/manual cases without alternate-browser bypass.                                                    |
| Combined scope                      | Implementing two stateful features in one uninterrupted change can delay useful verification and hide regressions.                                             | Small internal checkpoints with a working vertical path and source pins, while still delivering one final candidate.                                    |

## Goals vs. Non-Goals

### In-Scope Goals

- Focus linked only to authorized Actions in the current server `next` list; no client ranking or domain writes.
- One private browser-origin session, pause/resume/+5/end, reload recovery, safe clock handling and explicit suspension on uncertainty.
- Search names/titles across the four authorized data groups, with Pages retained as a separate local group.
- Correct access filtering before result limits, EN/VI comparison, honest paging/reset, keyboard/mobile states and no query/title leakage into ordinary logs or persistent search history.
- Preserve current login, drafts, command keys, UNKNOWN recovery, dialog/calendar controls and legal state axes.
- Finish a locally verified candidate with exact evidence and a later nonauthor review.

### Out-of-Scope Non-Goals

- Focus billing, manager monitoring, stored history, cross-device synchronization, sound/OS notifications or work auto-completion.
- File-content/OCR/semantic/AI search, people directory search or another external search engine.
- Production deployment, paid services, cloud provisioning, IdP-policy changes or a new cost/SLO promise.
- Automatically stage, commit, push, merge or discard current changes.

## Alternatives Weighed

These alternatives were considered by the completed Goldfish reviews; selected changes are author dispositions awaiting final alignment.

1. **Finish only page navigation and a per-tab timer.** Less code, but it does not solve the requested record search or cross-tab Focus requirements. Reject as an implementation shortcut unless the PO changes scope.
2. **IndexedDB transactions plus notification-only BroadcastChannel.** Candidate choice: storage can compare and commit one current state; notifications ask other tabs to reread it. The remaining risk is async lifecycle and failed coordination, not just storage syntax.
3. **Web Locks plus localStorage.** A possible alternative; compare support, privacy and lock lifetime against IDB before adding two mechanisms. Do not use an unprotected localStorage read/write as a lock.
4. **Server-stored Focus.** Simplifies some tab/device coordination but creates new persistence, cleanup and privacy contracts. It is outside the browser-local BRD scope and not selected automatically.
5. **Go/PostgreSQL metadata search.** Candidate choice: use the current permission model and metadata tables. Measure authorization and normalization cost before claiming it is sufficient.
6. **New search engine or asynchronous indexed corpus.** Could help later scale/content search, but adds synchronization, access-filtering, operations and cost obligations. Not justified by the current name/title-only scope alone.
7. **Fingerprint-reset paging.** Retain an explicit reset when the matching list changes, but fingerprint the complete authorized matching projection before LIMIT. Reject whole-group hashing as the default because an unrelated nonmatch should not reset this query; measure complete query cost and keep the stronger hidden-data equivalence cases. Plain keyset paging cannot claim the same unchanged-list guarantee.

## Key Decisions & Staging for Next Steps

### Anchored constraints already known

Both features belong in one final local candidate. Internal checkpoints are not separate releases or repeated requests to continue. Existing BRD exclusions and legal permissions stay intact. One writer owns shared source; future review readers do not become competing implementation writers.

Numeric defaults in the design are proposals for testing, not production guarantees. The supported number of simultaneously visible tabs, request budget and target database capabilities still need evidence. Do not convert an unspecified limit into an unbounded performance claim.

### Reviewed implementation order

| Step                           | Work                                                                                                                  | Exit check / recovery                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P0 — reconcile source          | Inventory current changes, actual contract, runtime ownership and installed dependencies; pin the chosen input tree   | Preserve all prior work; no reset, blind sqlc regeneration or implicit package install                    |
| P1 — prove difficult choices   | Use synthetic fixtures to test SQL normalization/fingerprint cost and the browser coordination protocol               | If a choice fails, revise that implementation choice before writing dependent UI; continue unrelated work |
| P2 — shared identity/privacy   | Add token-free principal/epoch/expiry and scoped privacy events; narrowly add Search read-POST semantics/cancellation | Draft/UNKNOWN/RV-001/session and partial-denial regressions remain green                                  |
| P3 — Focus complete path       | Model → atomic coordinator → current eligibility reads → My Work entry/header controller                              | No domain writes; stale End/logout cannot revive; show explicit unsupported/unverified states             |
| P4 — Search complete path      | Authorized SQL/memory reads → normalization → chosen paging/cursor → Go/BFF → grouped palette                         | Beyond-first200 match, hidden-data equivalence, literal input and changed-data behavior are proven        |
| P5 — combined product behavior | EN/VI, keyboard/IME, long content, private-state cleanup, route/theme/form interaction                                | Search does not launch commands; Focus does not change current selection or erase pending forms           |
| P6 — final local candidate     | Full gates, actual two-tab/browser cases, privacy/log census, manual runbook, safe cleanup and exact nonauthor packet | PASS/FAIL/NOT_RUN/BLOCKED separated; no product/release DONE inferred                                     |

### Review completion and remaining alignment

Design, codebase-details, zoom-out, comprehension, implementation-readiness and structural reviews are COMPLETE; all38 frozen input hashes remained stable. The author has integrated their objections into the plan without changing product source or rewriting frozen evidence. [Execution record](docs/testing/egm-focus-search-plan-20261101-r1/reviews/execution-summary.json).

QS-D01 is resolved by the PO: show existing authorized outcome/execution/due metadata for Work Items and current version/upload time for Documents. Same-name rows retain “Open to inspect” when metadata cannot establish distinction. Do not invent uniqueness or expose raw IDs as primary labels. Acceptance still requires execution evidence.

Final plan/brief alignment and the EGM handoff choice remain with the user. No automatic move to egm-draft, publication or source implementation follows from these review results.

## Inputs

- [Focus BRD](docs/requirements/focus-mode-brd.md)
- [Quick Search BRD](docs/requirements/quick-search-brd.md)
- [Codebase-design package](docs/architecture/focus-search-codebase-design.md)
- [Focus design](docs/architecture/focus-module-design.md)
- [Search design](docs/architecture/quick-search-module-design.md)
- [Implementation handoff](docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md)
- [Current-source intake](docs/testing/egm-focus-search-plan-20261101-r1/intake.json)

No application code, database, runtime, provider, commit or approval state changed in this EGM planning run. Product tests are NOT_RUN; the six Goldfish reviews have actually completed.

## PO execution amendment

2026-11-01: QS-D01 additional metadata approved by direct reply and Local Codex assigned to implement through a complete local candidate. Current implementation task and evidence supersede NOT_IMPLEMENTED planning labels; frozen EGM input/reviewer files remain unchanged.
