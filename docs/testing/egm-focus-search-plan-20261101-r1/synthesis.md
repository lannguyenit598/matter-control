# Focus and Quick Search — Goldfish brainstorm synthesis

Task: **MC-FOCUS-SEARCH-EGM-PLAN-20261101**. Mode: **BRAINSTORM**. Compiler: actual Local Codex intermediate EGM Synthesizer. Compiled after all six native reviewers returned, 2026-11-01 UTC.

**Recommendation:** retain the existing Next/BFF/Go/PostgreSQL architecture and deliver one local candidate. Amend the implementation plan before dispatch: make privacy invalidation and native logout ordering explicit; choose the smallest measured search-consistency implementation; test combined capacity; define migration failure and rollback behavior; and resolve ambiguous duplicate-result presentation. This is a brainstorm result, not implementation, design approval, acceptance or release authorization.

The weakest shared assumption is that small visible results imply inexpensive reads. Existing My Actions classification rebuilds readable Work graphs, while proposed search hashing processes complete authorized groups. The most immediate lifecycle risk is different: a fire-and-forget logout event cannot establish that asynchronous browser cleanup committed before native navigation.

## Review execution and input integrity

All source references in this report mean the **frozen** tree at `docs/testing/egm-focus-search-plan-20261101-r1/review-inputs/`, with original repository-relative paths underneath. Its declared source provenance is `978d8fc694a47e9beee528076bcf1af9473997e3` plus preserved dirty UI work. The swarm did not verify live Git or import later source. Missing proposed implementation files were not treated as defects.

Each reviewer used `fork_turns: "none"`, read its absolute bundled persona and Codex integration instructions, then the same seven mandatory concept/BRD/design/handoff documents, both frozen component AGENTS and selected frozen actual source. All confirmed complete readings; two reviewers supplied explicit instruction-reading addenda. All six reported successful Semble searches against the exact frozen root. No parent conversation or external memory was supplied or retrieved, and no other lens's findings were supplied to a reviewer. Fresh conversation isolation does not physically isolate the shared filesystem; the readers were explicitly restricted to the packet and mandatory instruction files.

Actual capacity was **four total concurrent agents**. Root plus intermediate synthesizer left two reviewer slots. Six reviews therefore ran as **three sequential pairs**, with at most two reviewers active concurrently. Completeness clarification reused the original reviewers after their reports; it introduced no seventh reviewer. No reviewer failed, timed out or required a failed-review retry.

| Reviewer / native task suffix | Assigned lens / bundled persona | Actual status | Verbatim return |
| --- | --- | --- | --- |
| `egm_design` | Architecture/cost — `agents/design_critic.md` | COMPLETE | [egm-design.md](reviews/egm-design.md) |
| `egm_codebase_details` | Observability/SRE — `agents/codebase_details.md` | COMPLETE | [egm-codebase-details.md](reviews/egm-codebase-details.md) |
| `egm_zoom_out` | YAGNI/reuse — `agents/zoom_out.md` | COMPLETE | [egm-zoom-out.md](reviews/egm-zoom-out.md) |
| `egm_comprehension` | UX/developer ergonomics — `agents/comprehension.md` | COMPLETE | [egm-comprehension.md](reviews/egm-comprehension.md) |
| `egm_implementation_readiness` | Migration/rollback — `agents/implementation_readiness.md` | COMPLETE | [egm-implementation-readiness.md](reviews/egm-implementation-readiness.md), [reading addendum](reviews/egm-implementation-readiness-read-completeness.md) |
| `egm_structural` | Long-term coupling — `agents/structural.md` | COMPLETE | [egm-structural.md](reviews/egm-structural.md), [reading addendum](reviews/egm-structural-read-completeness.md) |

Canonical reviewer task prefix: `/root/egm_focus_search_synthesis/`. Personas came from `/Users/nguyenvanlan/.codex/plugins/cache/egm/egm/0.1.0/`; none of these role labels claim that Claude Code, ZCode, Antigravity or OpenCode ran.

Open and close SHA-256 checks matched **all 38 frozen files** against `review-inputs-manifest.json`, with **zero mismatches**. [Close receipts](reviews/frozen-inputs-close-hashes.json) record per-file actual/expected hashes. This proves the reviewed frozen inputs remained stable, not that live source remained unchanged.

[Execution summary](reviews/execution-summary.json) records actual statuses, pair scheduling, report hashes and a static assertion that all 19 raw IDs map exactly once to the 11 synthesized findings. This artifact check is not a product test.

## Severity and deduplication

| Count basis | Blocker | Major | Nit | Total |
| --- | ---: | ---: | ---: | ---: |
| Raw reviewer findings | 0 | 17 | 2 | 19 |
| Distinct synthesized findings | 0 | 9 | 2 | 11 |
| Recommended plan amendments | 0 | 9 | 1 | 10 |
| Optional simplification deferred | 0 | 0 | 1 | 1 |

No Blocker was established by this read-only brainstorm. That does not establish engineering readiness: all nine Major items remain proposed plan amendments, and no finding is claimed fixed.

| Synthesis ID | Severity | Raw IDs | Disposition |
| --- | --- | --- | --- |
| FS-EGM-01 | Major | DESIGN-03, READY-02, STRUCT-03 | Specify navigation-safe logout and honest purge acknowledgement |
| FS-EGM-02 | Major | STRUCT-04 | Bind privacy invalidations to their source epoch/generation |
| FS-EGM-03 | Major | DESIGN-01, ZOOM-01, UX-01, STRUCT-01 | Compare and prefer query-bound matching-projection fingerprint if contract tests pass |
| FS-EGM-04 | Major | DESIGN-02, DETAILS-03, ZOOM-02, STRUCT-02 | Add combined workload gate; keep aggregate eligibility reuse provisional |
| FS-EGM-05 | Major | READY-01 | Define failed-migration ordering before replacing owned runtime |
| FS-EGM-06 | Major | READY-03 | Add bounded candidate-to-baseline-to-candidate reversal |
| FS-EGM-07 | Major | UX-02 | Resolve identical-visible-record limitation and picker escape route |
| FS-EGM-08 | Major | DETAILS-01 | Define privacy-safe group/stage diagnostics |
| FS-EGM-09 | Major | DETAILS-02 | Reuse and verify existing request correlation across BFF/Go |
| FS-EGM-10 | Nit | UX-03 | Centralize transient stale/refused control acknowledgement |
| FS-EGM-11 | Nit | ZOOM-03 | Defer optional stable-principal simplification; test need before removing |

Every raw ID maps once. Findings 03 and 04 combine independent support without presenting repeated opinions as extra defects. Findings 08 and 09 remain separate because degraded-success diagnostics and cross-hop correlation require different acceptance checks.

## Ranked risks and minimum corrections

### FS-EGM-01 — Logout navigation can outrun durable cleanup — Major

**Evidence:** frozen `apps/frontend/src/features/auth/components/sign-out-form.tsx:10–14` submits a native POST and performs synchronous draft cleanup; `src/app/api/auth/logout/route.ts:19–34` destroys the server session and redirects. Proposed `docs/architecture/focus-module-design.md` §4, especially lines 119–127, requires IDB transaction completion, a terminal fence and post-commit notification; §6 adds privacy events.

**Existing versus proposed:** native navigation exists; transactional Focus purge is proposed. No implemented logout failure was reproduced.

**Amendment:** define local runtime invalidation and a generic sibling privacy-hide signal immediately, then a bounded durable purge attempt before final navigation. Distinguish privacy invalidation from an authoritative committed state-change notification. Never claim the purge committed before transaction completion. Server logout must remain usable on storage failure; consumers stay unverified, reject pending old validation, and reconcile cleanup on subsequent execution. Test actual native navigation with pending Start, delayed/aborted purge, visible sibling and later login. A fast normal transaction is no counterexample to the failure case.

### FS-EGM-02 — Old privacy events can invalidate a new login — Major

**Evidence:** `focus-search-codebase-design.md` §3 and `focus-module-design.md` §6 define two generic events without an executable epoch/currentness contract. Existing `read-failure.tsx:11–27,56–64` has failure kind and partial/primary context, while normal Focus/Search interfaces are generation-bound.

**Amendment:** keep exactly two events, carrying opaque source session scope and the relevant generation/currentness guard. Ignore proven old-epoch events. An unknown-scope failure requests a currentness check rather than authoritatively purging whichever login happens to be current. Terminal writes still compare identity/generation in the coordinator. Test a delayed old 401 after account switch against both consumers. This clarifies the proposed seam; it does not require a global event bus or legal payloads.

### FS-EGM-03 — Whole-group consistency creates avoidable reset and hashing scope — Major

**Evidence:** `quick-search-module-design.md:122–126` fingerprints every authorized record before matching; lines 85/145 clear all business groups on stale provenance. The implementation handoff line 25 mandates it although `concepts_brief.md` treats it as provisional.

**Amendment:** compare whole-group hashing against the **complete authorized matching projection bound to the query**, before pagination and within the same read snapshot. Include displayed context, ranking inputs and relevant exposed role/membership facts. Keep fresh authorization, strict cursor binding, encrypted tokens and honest reset when that matching list changes. Nonmatch-to-match insertion/rename must reset; unrelated nonmatching edits should not. Hidden-data mutation remains observationally equivalent.

Prefer the query-bound version if those cases pass and measurements support it. It reduces serialization and interruption scope, not the underlying authorization/substring scan. Whole-group hashing remains a defensible conservative fallback only with measured cost and explicit repeated-edit usability evidence. Do not substitute plain keyset paging while retaining a false unchanged-list guarantee. Retain conservative all-business-group clearing on a genuine stale result for now; narrowing that behavior needs separate revocation evidence.

### FS-EGM-04 — Aggregate timer reads and Search scans need one capacity experiment — Major

**Evidence:** existing `work_service.go:1247–1311` obtains readable Matters, loads Work graphs, derives effective state and critical chains, then ranks actions. Proposed Focus §5 refreshes each visible tab every 20 seconds with a 30-second successful-read-age bound. Search §4 hashes authorized projections. Both meet the shared `/api/v1` admission seam shown in `productapi/server.go:55–56,110`.

**Amendment:** P1 must include one and five visible Focus tabs, repeated Search typing/paging, and a representative ordinary command/read on the same owned fixture, compared with the ordinary-operation baseline. Record complete graph/SQL work, name/detail fan-out, full fingerprint cost, admission/pool wait, cancellation and command outcomes. Declare concrete local proceed/revise criteria before execution; do not invent a production SLO.

Keep existing `/me/actions` reuse if adequate. Only a demonstrated failure justifies a narrow authoritative target-eligibility read reusing the same Go classification/domain rules; retain ordered aggregate candidates. No speculative endpoint, client classifier, sibling-shared authorization freshness, independent access cache or new infrastructure is recommended. An unrelated Matter failure affecting aggregate validation belongs in the experiment as well as throughput.

### FS-EGM-05 — Optional Search cannot rely on unexplained mandatory DDL success — Major

**Evidence:** Search design §4 proposes ICU/UTF8-dependent additive normalization DDL while stating ordinary Focus/navigation survive unsupported capability. Frozen backend AGENTS lines 12–14 documents migration-before-run and compose migrate/API ordering. The actual startup implementation was outside the selected packet; a runtime failure is conditional, not confirmed.

**Amendment:** preflight exact migration and role on an owned disposable fixture before replacing/restarting the working baseline. On failure, preserve baseline and report the precise blocked Search leg. Do not mark an unapplied migration successful or silently weaken EN/VI matching. If a newly started API must tolerate unsupported Search SQL, explicitly design migration selection plus capability detection. Missing cursor-key handling alone cannot handle failed DDL. No cloud/provider execution follows from this recommendation.

### FS-EGM-06 — Additive SQL, browser state and cursors need an application reversal recipe — Major

**Evidence:** Focus design §4 adds independently surviving browser state; Search §§4–5 add SQL support objects and version/key-bound cursors. The handoff asks for cleanup/runbook but not candidate reversal ordering.

**Amendment:** rehearse one owned synthetic candidate → reconciled baseline → candidate cycle. Stop new interactions, acknowledge session termination, keep the content-free fence while stale candidate tabs exist, and close/reload owned test tabs. Restore application/config without downgrading unrelated migrations; leave unused additive SQL objects in place. Old protocol/key cursors cause recoverable refresh/unavailable behavior. Unknown browser schemas fail closed without automatic database deletion. Verify no terminated session revives and ordinary navigation/commands remain usable. Timer preservation through rollback and general rolling-version support are unnecessary new promises.

### FS-EGM-07 — Scope labels do not distinguish every duplicate record — Major

**Evidence:** Search BRD §§3–4/acceptance promises distinguishable duplicate names; proposed DTO at `quick-search-module-design.md:19–27` has label, scope, kind/subtype and role. Existing core migration lines 113–142 and Document migration lines 7–14 allow identical titles/names in one Matter. Focus §3 caps title-filtered candidates at 20; existing `my-work-selection.ts` can traverse the Ready queue.

**Amendment:** add same-title/same-kind/same-Matter fixtures. Keep selected eligible Action one-click Focus even beyond the picker cap and offer the existing Ready queue when selection is truncated. For Search, settle the actual user-visible limitation or approved extra discriminator described below; do not invent titles, expose raw IDs, add sensitive fields or impose uniqueness as an engineering shortcut.

### FS-EGM-08 — HTTP 200 is insufficient evidence that each group works — Major

**Evidence:** Search §3 permits partial groups within HTTP 200; §6 limits tracing to request IDs/status/duration. The BRD permits privacy-safe status/type counts and duration.

**Amendment:** use existing logging for a bounded per-operation/group outcome record: fixed group, outcome, allowlisted reason and duration, with stage timing for the P1 diagnosis where necessary. Exclude query/labels/cursor/actor/target/fingerprint data. Force one group failure and verify healthy HTTP success cannot hide it operationally. This is operational diagnostics, not Focus history, user analytics or a monitoring-platform request.

### FS-EGM-09 — Request correlation needs an executable boundary — Major

**Evidence:** frozen `lib/mc/client.ts` does not expose/forward a correlation identifier in its visible contract. `productapi/server.go` registers `requestMeta`, but that helper was not supplied; absence of wider tracing is not established.

**Amendment:** during reconciliation inspect and reuse the actual metadata mechanism. Specify propagation for the two new BFF routes and their downstream reads, including Focus fan-out. Verify success plus timeout/cancellation can be followed across BFF/Go without legal/session identifiers. Prefer a documentation/test amendment if current middleware already satisfies it; no second tracing framework is justified.

### FS-EGM-10 — Explain a rejected stale control once — Nit

Proposed Focus interface returns `accepted | stale | refused` and forbids silent rebasing, but does not fully specify user acknowledgement. Put one transient localized outcome in the shared Focus view and announce once after reconciliation: the change was not applied because another tab changed Focus. No automatic retry or command queue. Assert user feedback in one two-handle case. This amendment belongs to the shared interface, not duplicated card/controller messages.

### FS-EGM-11 — Stable principal hash may be unnecessary — Nit, optional

Under the singleton, single-cookie-principal and per-login-epoch model, a stable cross-login hash may add no required behavior. Test whether epoch/expiry plus generation/revision cover current account-switch and restoration cases. Omit it only if those cases prove equivalence; keep it if a present assertion requires it. This optional cleanup must not delay the privacy/currentness fixes or create new multi-account scope. No removal is claimed approved by this synthesis.

## Implementation choices that survive

- One source writer, reconciled dirty tree, one final local candidate with internal checkpoints.
- Separate Focus and Search features; shared composition and a tiny token-free scoped privacy seam.
- Atomic IDB current-slot CAS, post-commit authoritative state notifications, no independent per-tab timer fallback, no server Focus history.
- Server-authoritative Action eligibility and ranking; no business writes or completion side effects from Focus.
- Go/PostgreSQL authorized metadata reads, existing read snapshots, filtering before limits, shared SQL/memory vectors, EN/VI correctness and literal punctuation.
- Opaque encrypted cursors, strict actor/query/epoch/type/hint/limit binding, fresh membership checks and explicit stale reset.
- Exact Search read-POST allowlist and cancellation through the existing HTTP client; ordinary commands retain UNKNOWN semantics.
- Existing Dialog, navigation registry, work selection, UI controls and draft/UNKNOWN recovery.

No new search service, queue, state framework, generic plugin system, paid provider, global telemetry platform or extra feature is supported by the brainstorm.

## Recommended revised plan for the parent to integrate

This sequence proposes amendments; the existing BRDs/designs/handoff have **not** been rewritten by the swarm.

| Checkpoint | Minimum complete work | Evidence / exit |
| --- | --- | --- |
| P0 — reconcile | Confirm actual writer, HEAD/dirty inputs, component rules, owned runtime/fixtures and existing tracing; preserve prior work | Exact manifest and changed-path ownership; no reset or implicit installation |
| P1 — select hard choices | SQL normalizer/migration-role preflight; query-bound vs whole-group fingerprint; true shared-coordinator failure prototype; combined Focus/Search/ordinary-operation workload | Local proceed/revise criteria declared first; vectors, reset behavior, full cost and native storage failures; unresolved provider legs labelled |
| P2 — identity/privacy | One live-session token-free projection; epoch-scoped events; navigation-safe logout; bounded read-POST transport/cancellation; diagnostic/correlation contract | Delayed old 401, aborted purge/native logout, pending Start, partial-denial, draft/UNKNOWN/RV-001 regressions |
| P3 — Focus vertical path | Pure transitions, CAS coordinator, authoritative target/candidates, selected Action entry and persistent controls | Real two-handle + actual two-tab races; stale-command acknowledgement, zero-domain-write census, picker escape route |
| P4 — Search vertical path | Selected authorized SQL/memory consistency contract, real cursor codec, Go/BFF, grouped current-generation palette | >200 completeness, 5/5/2 paging, same-title ambiguity behavior, unrelated vs matching vs hidden mutation, key/origin/body/log negatives |
| P5 — coherent candidate | EN/VI, mobile/keyboard/IME, route/theme/form interactions, actual admitted workload and privacy logs | Required backend/frontend gates, permitted browser/two-tab execution; exact FAIL/NOT_RUN/BLOCKED preserved |
| P6 — reversal and review | Owned candidate-baseline-candidate rehearsal, final pins/runbook and nonauthor packet | No resurrection, baseline domain/UNKNOWN regression, additive SQL preserved; author verification remains distinct from independent acceptance |

Only P1 results justify changing the provisional implementation choices. If one leg is externally blocked, continue unaffected authorized work and report that named blocker. Do not request repeated continuation at each checkpoint, claim a full candidate without its evidence, or infer permission to commit/merge/deploy.

## Real unresolved product decisions

**Concrete decision:** the BRD's duplicate-name promise exceeds the supplied metadata for same-kind duplicates within one Matter. Choose either an explicit inspect-to-distinguish limitation or one additional authorized visible discriminator. The smaller fallback does not meet a promise that every duplicate is distinguishable directly in the palette, so that promise must be reconciled rather than silently declared satisfied.

**Conditional decisions only after evidence:** if measured behavior forces a weaker Focus freshness window, weaker search consistency, intentional repeated whole-group resets, new retained server data or paid infrastructure, present measured alternatives to the PO. None is required merely to scope a fingerprint correctly, add safe diagnostics, make logout truthful, or rehearse rollback. Settled legal permissions, state axes and initial product positioning are not reopened.

## Status and limits

Proposed next status: **BRAINSTORM_REVIEW_COMPLETE / PLAN_REVISION_REQUIRED**. Six complete reviewers are not implementation approval or an automatic transition to implementation. The parent owns final brief/plan integration and any required user checkpoint.

Changed by the intermediate synthesizer only: six verbatim raw reports, two verbatim reading addenda, the close-hash receipt, execution summary, and this synthesis under the assigned review artifact directory. No root `concepts_brief.md`, existing design, product source, configuration, dependency, database, provider or Git state was changed by this subtask.

Skipped: product tests, builds, browser/two-tab/provider execution, live source/Git verification and implementation; all were outside this read-only review.
Remaining risk: frozen-source design findings identify failure cases and plan gaps; runtime feasibility, independent acceptance and production behavior remain unverified.
