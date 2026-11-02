# MatterControl Focus and Quick Search

- Author: Local Codex
- Date: 2026-11-01
- Status: WORKING_HYPOTHESIS / WAITING_FOR_EGM_READINESS_CONFIRMATION
- Task: MC-FOCUS-SEARCH-EGM-PLAN-20261101
- Review: Goldfish reviews NOT_STARTED; this is the author's preparation, not independent review.

## Overview

Build one local candidate containing a private Focus timer for a server-eligible Action and Quick Search over authorized Workspace, Matter, Work Item and Document names. Keep the existing Next.js/BFF/Go/PostgreSQL architecture and current legal rules. Reuse current navigation, forms, login and UI controls; do not add a separate search platform, billing, Focus history or a cloud deployment.

The working hypothesis is that the two features can share a small server-provided login identity and privacy reset mechanism while keeping their data and behavior independent. Focus uses an atomic browser store for one current session across tabs. Search uses authorized database reads and treats changes during paging as a visible refresh, rather than showing incomplete or misleading results.

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

### Weakest points to challenge

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

These are positions to stress-test, not conclusions from reviewers who have not run.

1. **Finish only page navigation and a per-tab timer.** Less code, but it does not solve the requested record search or cross-tab Focus requirements. Reject as an implementation shortcut unless the PO changes scope.
2. **IndexedDB transactions plus notification-only BroadcastChannel.** Candidate choice: storage can compare and commit one current state; notifications ask other tabs to reread it. The remaining risk is async lifecycle and failed coordination, not just storage syntax.
3. **Web Locks plus localStorage.** A possible alternative; compare support, privacy and lock lifetime against IDB before adding two mechanisms. Do not use an unprotected localStorage read/write as a lock.
4. **Server-stored Focus.** Simplifies some tab/device coordination but creates new persistence, cleanup and privacy contracts. It is outside the browser-local BRD scope and not selected automatically.
5. **Go/PostgreSQL metadata search.** Candidate choice: use the current permission model and metadata tables. Measure authorization and normalization cost before claiming it is sufficient.
6. **New search engine or asynchronous indexed corpus.** Could help later scale/content search, but adds synchronization, access-filtering, operations and cost obligations. Not justified by the current name/title-only scope alone.
7. **Fingerprint-reset paging.** Candidate choice for a stable readable list; can be expensive. Reviewers should compare it with a simpler honest reset contract before treating the whole-projection hash as fixed architecture.

## Key Decisions & Staging for Next Steps

### Anchored constraints already known

Both features belong in one final local candidate. Internal checkpoints are not separate releases or repeated requests to continue. Existing BRD exclusions and legal permissions stay intact. One writer owns shared source; future review readers do not become competing implementation writers.

Numeric defaults in the design are proposals for testing, not production guarantees. The supported number of simultaneously visible tabs, request budget and target database capabilities still need evidence. Do not convert an unspecified limit into an unbounded performance claim.

### Provisional implementation order

| Step                           | Work                                                                                                                  | Exit check / recovery                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| P0 — reconcile source          | Inventory current changes, actual contract, runtime ownership and installed dependencies; pin the chosen input tree   | Preserve all prior work; no reset, blind sqlc regeneration or implicit package install                    |
| P1 — prove difficult choices   | Use synthetic fixtures to test SQL normalization/fingerprint cost and the browser coordination protocol               | If a choice fails, revise that implementation choice before writing dependent UI; continue unrelated work |
| P2 — shared identity/privacy   | Add token-free principal/epoch/expiry and scoped privacy events; narrowly add Search read-POST semantics/cancellation | Draft/UNKNOWN/RV-001/session and partial-denial regressions remain green                                  |
| P3 — Focus complete path       | Model → atomic coordinator → current eligibility reads → My Work entry/header controller                              | No domain writes; stale End/logout cannot revive; show explicit unsupported/unverified states             |
| P4 — Search complete path      | Authorized SQL/memory reads → normalization → chosen paging/cursor → Go/BFF → grouped palette                         | Beyond-first200 match, hidden-data equivalence, literal input and changed-data behavior are proven        |
| P5 — combined product behavior | EN/VI, keyboard/IME, long content, private-state cleanup, route/theme/form interaction                                | Search does not launch commands; Focus does not change current selection or erase pending forms           |
| P6 — final local candidate     | Full gates, actual two-tab/browser cases, privacy/log census, manual runbook, safe cleanup and exact nonauthor packet | PASS/FAIL/NOT_RUN/BLOCKED separated; no product/release DONE inferred                                     |

### Goldfish review plan — not started

After the explicit readiness checkpoint, use fresh contexts for the six bundled lenses: design, codebase details, zoom-out, comprehension, implementation readiness and structural review. Read-only review inputs are this brief, the two BRDs, the design package, the implementation handoff and a selected pinned source reading list. Do not provide conversation history or author answers to reviewers. Record tool failures and actual completions; a launched reviewer is not a completed review.

The synthesis must decide which choices survive, which need smaller alternatives, which tests must run first and which risks affect only later deployment. Only then rewrite the final implementation plan. No automatic switch to another skill, external publication or source implementation follows from this draft.

## Inputs

- [Focus BRD](docs/requirements/focus-mode-brd.md)
- [Quick Search BRD](docs/requirements/quick-search-brd.md)
- [Codebase-design package](docs/architecture/focus-search-codebase-design.md)
- [Focus design](docs/architecture/focus-module-design.md)
- [Search design](docs/architecture/quick-search-module-design.md)
- [Implementation handoff](docs/implementation/handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md)
- [Current-source intake](docs/testing/egm-focus-search-plan-20261101-r1/intake.json)

No application code, database, runtime, provider, commit or approval state changed in this EGM intake. Product tests and Goldfish findings are NOT_RUN/NOT_STARTED respectively.
