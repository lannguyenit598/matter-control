# Focus and Quick Search — implementation plan after Goldfish review

Version2, 2026-11-01. Owner: Local Codex. Task MC-FOCUS-SEARCH-EGM-PLAN-20261101. **IMPLEMENTATION_IN_PROGRESS**. Six fresh-context Goldfish reviews are complete; this plan incorporates author dispositions, not an independent approval of its new wording or product acceptance. [Review synthesis](../testing/egm-focus-search-plan-20261101-r1/synthesis.md).

## 1. Outcome and source baseline

Deliver one complete local candidate: Focus on an eligible assigned Action and record-name Quick Search, while ordinary work, login, drafts and command recovery continue to work. Internal checkpoints prevent building on an untested mechanism; they do not create separate releases or require a continuation request after every stage.

Repository `matter-control`, branch `codex/unified-project-flow`, HEAD `978d8fc694a47e9beee528076bcf1af9473997e3` plus existing UI changes. Thirty-seven prior design inputs matched at intake; all38 frozen review files matched at close. Reconcile current files again before implementation. No new feature source exists at this plan's baseline. Preserve the already built calendar, selection, Pane and dialog work and every unrelated dirty change.

Read the [Focus BRD](../requirements/focus-mode-brd.md), [Search BRD](../requirements/quick-search-brd.md), [module package](../architecture/focus-search-codebase-design.md), [Focus design](../architecture/focus-module-design.md), [Search design](../architecture/quick-search-module-design.md) and this plan. This plan supersedes the specific v1 implementation choices listed below. Frozen reviewer inputs and raw reports remain unchanged. Existing approved business rules and feature exclusions are not superseded.

## 2. Review disposition and selected changes

| Finding                                 | Plan disposition                                                                                                                                                                      | Checkpoint proving it                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| FS-EGM-01 logout unload race            | Add immediate scoped privacy-hide plus bounded acknowledged purge before native navigation; server logout remains usable on storage failure                                           | P2 and actual navigation/two-tab checks in P6                |
| FS-EGM-02 stale privacy events          | Include source login epoch and request/runtime generation; old events cannot clear a newer login                                                                                      | P2 delayed-old401/account-switch cases                       |
| FS-EGM-03 fingerprint scope             | Select complete **authorized matching projection** for the current normalized query, before pagination; whole authorized group is comparison evidence, not the default implementation | P1/P4 unrelated-edit, matching-edit and hidden-edit fixtures |
| FS-EGM-04 combined capacity             | Prove classifier/search/normal command coexistence; reuse `/me/actions` if it passes; add a narrow target read only for a measured failure                                            | P1 local experiment, P6 repeat with exact candidate          |
| FS-EGM-05 failed migration              | Exact disposable-role preflight before runtime replacement; preserve running baseline on failure; no false optional-startup promise                                                   | P1 migration/bootstrap checks                                |
| FS-EGM-06 rollback                      | Rehearse candidate→baseline→candidate without down-migrating legal schema or reviving Focus                                                                                           | P6 reversal recipe                                           |
| FS-EGM-07 indistinguishable duplicates  | Preserve exact selected Action regardless of picker cap; Ready queue escape route. Same-scope duplicate presentation is a product decision below, never a false AC pass               | P3/P5 fixtures and QS-D01                                    |
| FS-EGM-08 diagnostics                   | Record fixed-group outcomes and stage durations, without legal terms or identifiers                                                                                                   | P2/P4 partial200 failure and log-canary cases                |
| FS-EGM-09 correlation                   | Reuse existing Go `X-Request-Id` metadata and add explicit BFF propagation for the new reads                                                                                          | P2 success/timeout/cancel trace case                         |
| FS-EGM-10 stale control acknowledgement | One shared transient EN/VI message after a rejected stale control; reconcile before another explicit operation                                                                        | P3 competing-control rendering case                          |
| FS-EGM-11 stable principal hash         | Defer this optional simplification. Retain the v1 token-free principal/epoch contract for now; no extra identity system or blocker                                                    | Identity tests and final source review                       |

The table records design dispositions at planning time. Implementation and verification now continue under MC-FOCUS-SEARCH-IMPLEMENTATION-20261101; consult its evidence ledger for executed checks, unresolved cases and author repair status. Frozen EGM reports remain unchanged.

### Query consistency clarification

Authorization precedes matching. Within each read snapshot, match the entire authorized group against the normalized query, then fingerprint all matching rows with exposed context/role and stable ranking inputs, then return a limited page. Match filtering still precedes LIMIT; the implementation must never scan just the first200 records.

An unrelated nonmatching rename must not reset this query. A nonmatch becoming a match, matching rename/removal/insertion, exposed parent-name change or relevant access change does reset it. Hidden-row edits remain indistinguishable from no such edits. Reauthorize every page; the cursor binds actor, epoch, query, group, hint, limit and matching-set fingerprint. Use the encrypted anchor-ID scheme already designed. Query-specific hashing reduces unrelated hashing/reset work; it does not eliminate the normalization/authorization scan.

On a genuine stale result, conservatively clear every current-query business group/cursor and say results changed; keep input and local Pages. Do not describe a rename as proven revocation. Keep ordinary partial network failure separate. Any later narrower reset policy needs its own privacy evidence.

### Logout and privacy ordering

Distinguish an **invalidate presentation** event from an **acknowledged stored state change**. Both are internal technical notifications; neither grants access or changes legal state.

1. Capture the submitting view's login epoch and runtime generation. Stop accepting its pending operations; clear protected labels locally and send a scoped privacy-hide message immediately. Receivers from that same epoch hide before awaiting anything. A proved older epoch is ignored; unknown scope triggers currentness verification rather than authoritative deletion of the current login.
2. Start the IDB terminal-fence transaction with identity/generation comparison. Acknowledge only on transaction completion; publish committed revision afterward. An in-flight pre-logout Start must fail its captured generation check.
3. Prevent the first native form submission only while this cleanup attempt runs. Local candidate default wait bound:1000ms. On success or timeout/failure, use a guarded one-time native submit to the existing same-origin logout route; do not loop through the interceptor. Preserve current synchronous draft cleanup and server Origin/session destruction. Do not delay logout indefinitely for client storage.
4. On failure, report cleanup as unresolved, not successful End. Visible receivers stay unverified and attempt reconciliation; next bootstrap rechecks authentication/epoch and removes stale resumable data before revealing a title. IDB/channel failure cannot promise instantaneous sibling synchronization. Record that limit honestly.

The privacy messages carry only source epoch, protocol/runtime generation and bounded reason, never titles, actor subjects, credentials or command keys. Terminal storage writes still compare the current slot; an old failure event cannot purge a new login. Partial `ReadFailure` must retain current unrelated state and existing form recovery.

## 3. Work packages and dependencies

One primary source writer owns shared shell/auth/HTTP changes. Read-only reviewers may run in parallel, but no second writer is created by this plan. No external Claude/ZCode/OpenCode invocation is implied.

| Step                                   | Implementation work                                                                                                                                  | Required evidence before dependent work                                                                                    |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| P0 reconcile and pin                   | Read current AGENTS/contract/returns, inspect every dirty target, record source and owned runtime/config resources                                   | Exact input manifest; no reset/stash/clean; protected source stays byte-identical unless a listed change requires it       |
| P1 validate difficult mechanisms       | Prove PG17/18 normalization/migration, matching fingerprint behavior/cost, atomic coordinator races and combined load using owned synthetic fixtures | Interface checks and explicit failure decisions below; browser-dependent work may be BLOCKED while unrelated code proceeds |
| P2 identity/privacy/transport          | Public identity, persistent composition, scoped invalidation/logout, exact Search read-POST semantics, cancellation/correlation/diagnostics          | Existing draft/UNKNOWN/session/RV-001 behavior green; old epoch cannot clear new data; no token serialization              |
| P3 Focus complete path                 | Pure model/coordinator → eligibility BFF → My Work card/header controller                                                                            | Real server order, exact selected item beyond picker cap, truthful stale/refused messages; no domain writes                |
| P4 Search backend complete path        | Normalizer/support migration → authorized matching projections/fingerprint → real cursor → Go handler/config/memory+PG tests                         | No hidden metadata/count/reset effect, >200 late match, 5/5/2 pages and explicit matching-set reset                        |
| P5 Search BFF/UI and combined UX       | Typed read-POST route → feature palette → IME/current-query navigation/paging/error states; coexist with Focus/forms                                 | No reload, stale Enter, cross-epoch flash, body/query log leak or implicit domain command                                  |
| P6 candidate verification and reversal | Full gates, allowed real browser/IdP scenarios, privacy census, owned local runtime, rollback rehearsal and reviewer packet                          | Exact final manifest, PASS/FAIL/NOT_RUN/BLOCKED rows and nonauthor handoff; no self-awarded release                        |

P1 may use disposable proof implementations that later become tested modules; it is not permission to install a new framework or write a second throwaway product. Keep scratch tools outside the source tree. A failed provider leg does not stop pure model, BFF or synthetic/reference-adapter work.

## 4. P1 experiment contracts

### PostgreSQL and normalization

Use fresh owned databases/roles on disposable PG17 and PG18 fixtures. Apply the exact proposed additive function/collation under the intended migrator role, then read with the runtime role. Use the same EN/VI golden cases for SQL and memory adapters; cover NFC/NFD, `Đ/đ`, root case behavior and literal `%`, `_`, quotes/backslashes. No current user database or existing volume is modified.

Current live source confirms `make run` migrates first, and `internal/app/product.go` checks pending product migrations before starting. Therefore a failed required Search migration can prevent **new candidate** startup. Do not promise that candidate boots with unsupported ICU merely by leaving Search disabled. Keep the current running baseline until exact preflight succeeds; on failure label this Search/target leg blocked and retain existing runtime. Supporting unsupported SQL in a newly started candidate would require a separately specified optional-migration contract; do not invent one in a catch block or mark an unapplied migration successful.

### Query and matching fingerprint

Use exact/prefix/substring queries over an approved W1-shaped fixture and a labelled larger fixture (>200 authorized records), with hidden/confidential records in a different membership scope. Record full transaction cost, membership joins, normalization, fingerprint serialization, paging and payload. Compare whole-group and matching-set costs/reset behavior; the selected output contract is query-specific unless evidence forces a documented revision.

Pass conditions: correct vectors; late-only match returned; matching set pages5/5/2 without duplicates; unrelated nonmatching edit does not reset; matching/context/access change resets; hidden mutation does not change observable membership/result/reset outcomes. Random cipher nonces and `asOf` timestamps are not expected to be byte-identical in equivalence tests.

### Combined workload

Keep existing configured request timeouts. Before running, record fixture size, API/DB limits and machine resources. Use isolated local admission cap10 only as an experiment parameter, not a production setting. Baseline:20 sequential authorized synthetic reads and20 ordinary explicit commands on disposable records, one of each per second, with valid guards. Repeat with one, then five visible Focus tabs, one actively typed Search query stream (200ms input cadence,20 query changes and paging) and the same ordinary operations.

Local proceed criteria: every ordinary test operation returns the expected contract outcome; zero added admission503/server500/timeout/UNKNOWN caused by the background feature workload; cancellations terminate abandoned Search work; no unbounded query/refresh queue; Focus does not falsely claim fresh eligibility after its configured30s age. Record baseline/mixed p50/p95, complete SQL/graph volume, pool/admission waits and actual backend/IdP calls. These are finite controlled-fixture checks, not a production latency SLA.

If baseline itself fails, repair the fixture/test before judging the new features. If aggregate Focus polling fails while baseline passes, evaluate one narrow target-classification read reusing current Go domain rules; keep `/me/actions` for candidates/order. Do not add it speculatively, share sibling authorization freshness, make a browser classifier or silently relax30s. If matching fingerprint fails, show the measured simpler alternatives before adding infrastructure or accepting incomplete paging.

Real browser concurrency remains a separate test. If permission is unavailable, use five independent authorized test clients only for a clearly labelled HTTP load approximation and leave actual visible-tab behavior BLOCKED; do not call it browser proof.

## 5. Create/modify map

All paths below are relative to `apps/frontend/src/` or `apps/backend/` as labelled. Exact names can be consolidated where it reduces caller complexity; responsibilities and layer rules remain fixed.

| Action            | Path / set                                                                                                                                      | Owner responsibility                                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Create FE         | `lib/ui-session.ts`, `lib/mc/private-ui-events.ts`                                                                                              | Token-free DTO and exactly scoped privacy events, no generic state framework                                       |
| Modify FE         | `lib/auth-provider.ts`, `features/auth/components/sign-out-form.tsx`, `components/organisms/read-failure.tsx`                                   | One live-session projection, acknowledged cleanup/navigation, source-epoch binding and preserved partial semantics |
| Modify FE         | `app/(app)/layout.tsx`; extract `workbench.tsx` only if needed                                                                                  | Persistent provider above header/page callers without remounting forms                                             |
| Create FE         | `features/work/focus/{model,coordinator,provider,transport,eligibility}` plus its two UI leaves                                                 | One Focus interface, injected platform/read seams, reference and browser tests                                     |
| Modify FE         | `features/work/components/my-actions-view.tsx`                                                                                                  | Client Focus leaf over the exact server selection; Ready queue escape route                                        |
| Create FE         | `app/api/focus/eligibility/route.ts`                                                                                                            | Bounded read-only app composition of current repositories, exact Origin/session/error checks                       |
| Create FE         | `features/search/{schemas,repository,client,use-search}` and `components/quick-search.tsx`, `app/api/search/route.ts`                           | One feature-owned query/paging implementation and thin BFF route                                                   |
| Modify FE         | `components/organisms/command-palette.tsx`, existing stories/tests                                                                              | Domain-free body slot/hotkeys/Dialog and preserved page-only default                                               |
| Modify FE         | `lib/mc/client.ts`, `errors.ts`, existing client tests                                                                                          | Exact Search read-POST semantics, combined timeout/signal and new problems; commands unchanged                     |
| Create BE         | `internal/core/domain/matter/search.go`, `internal/core/port/search.go`, `internal/core/service/search_service.go`                              | Input validation and observable search use case, no driver/crypto dependencies in core                             |
| Create/modify BE  | `internal/adapter/outbound/postgres/search_store.go`, `queries_mattercontrol/search.sql`, snapshot capability and next-unused support migration | Authorized matching-set read, normalizer, fingerprint/cursor integration and real SQL test coverage                |
| Create BE         | `internal/adapter/outbound/repotest/mattercontrol/memory_search.go` and shared contract cases                                                   | Real reference adapter, same vectors/ordering/visibility behavior                                                  |
| Create/modify BE  | `internal/adapter/inbound/productapi/search_handlers.go`, server wiring, app/config                                                             | Bounded authenticated read endpoint, cursor codec/key capability, safe diagnostics and existing correlation reuse  |
| Generate BE       | `mcsqlc/` through pinned sqlc only                                                                                                              | Do not edit generated output by hand                                                                               |
| Modify docs/tests | Current API/local contract/config/operations, focused tests/stories/evidence                                                                    | Document actual behavior, migration/reversal and exact run/not-run cases with candidate                            |

No application source deletion is planned. Keep all unrelated tests and prior evidence. Existing deps first; an exact-version adapter use of installed indirect x/text may require a recorded direct promotion, never an unrelated upgrade. Do not introduce an empty barrel, per-command class, second HTTP implementation or new event bus.

## 6. Diagnostics and correlation

Parent follow-up verified existing `productapi/requestmeta.go` accepts bounded printable `X-Request-Id` or generates a32-hex ID and places it in `port.RequestMeta`. It does not establish that the current BFF client sends one or that responses expose it.

For each new BFF operation, generate a fresh safe operation ID on the server, pass it to its downstream Go reads through existing `X-Request-Id`, and return a safe diagnostic ID to the browser. Do not reuse client-provided arbitrary text, login epochs, principal keys or cursors as that ID. Focus child-read stage labels are fixed (`classification`, `detail`, `name`), so they need no user data to correlate. Audit IDs are tracing only, never authorization.

Record fixed route/group/stage, outcome/reason enum, duration, cancellation/admission status and generated operation ID. No q, title, URL-with-query, body, actor/target identifier, epoch, token, cursor or fingerprint is logged. Partial HTTP200 Search must emit per-group unavailable/stale outcomes so a failed Documents group is diagnosable. Reuse existing logs/OTel capability; do not add a monitoring platform or high-cardinality metric label. Prove success and timeout/cancel can be followed across BFF/Go, and forced partial failure is visible without confidential canary text.

## 7. UX decision and safe continuation

**QS-D01 — approved for implementation by direct PO reply, 2026-11-01.** Same-title, same-kind, same-Matter records receive additional already-authorized metadata: Work Items show a bounded outcome excerpt, execution state and due date; Documents show current version number and upload time when present. Keep labels and scope names primary, never raw IDs. No file content/binary filenames or new access grants are included. These fields are part of the matching projection fingerprint. If records remain identical or metadata is absent, show an honest “Open to inspect” hint and use their existing authorized detail routes. Do not promise uniqueness from optional metadata.

For Focus, the selected My Work Action can start after fresh exact-target validation even if it is beyond the picker's first20 entries. A truncated picker provides a link to existing Ready selection, not an unfindable result or client re-ranking. Stale/refused operations reconcile and announce once: “Focus changed in another tab. Your change was not applied.” Localized equivalent is supplied through the current locale mechanism; never replay automatically.

## 8. Verification and bounded reversal

Track all18 AC-FOCUS and18 QS-AC cases individually. Add the review cases: old-epoch privacy events, native logout with delayed/aborted IDB commit, selected target beyond20, unrelated nonmatch edit, mixed feature/ordinary workload, partial200 diagnostics, migration failure and application reversal. A raw read-only review is not a test pass.

Run backend `make check` with real owned PG fixture (state every skip), frontend `pnpm check`, production build/CSS guard, Storybook and focused interface regressions. Real browser: two tabs, actual IDB, navigation/logout, keyboard/IME/focus and320/390/800/801px in both themes/locales. Preserve approved browser permission rules; blocked render/IdP/provider legs stay labelled, never simulated into a pass. Privacy canary and before/after domain revision/event/request census remain mandatory. No domain writes are caused by Focus controls.

Reversal rehearsal on owned synthetic resources:

1. Stop new candidate interactions; acknowledge End/purge through the coordinator; retain only content-free fence and close/reload owned candidate test tabs.
2. Restore the reconciled baseline application/config. Do not down-migrate unrelated schema; leave unused additive Search SQL objects installed. Never point baseline at a legal-data fixture or remove existing volumes.
3. Old/rotated-key/unknown-protocol cursors give generic recoverable refresh/unavailable, without payload echo or ordinary-endpoint failure. Unsupported IDB protocol stays fail-closed without automatic database deletion.
4. Reopen candidate: no ended session revives, fresh login/current eligibility works, normal navigation/commands and existing draft/UNKNOWN behavior remain valid. A failed purge/reversal is a reported limitation, not a concealed success.

Final return includes exact source/contract/key-protocol versions (not secrets), commands/cwd/UTC/exit, result matrix, failed attempts, resource ownership/cleanup, actual screenshots if permitted, source/privacy manifests and one nonauthor packet. `IMPLEMENTED_SELF_TESTED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS` is available only after code and author checks; no MC-002/P0/release DONE or production/cost/IdP approval is inferred. No commit/push/deploy is assigned by the planning workflow.

## 9. Next action

QS-D01 is resolved and Local Codex is explicitly assigned to implement. Continue the existing [implementation handoff](handoffs/MC-FOCUS-SEARCH-IMPLEMENTATION-PROMPT.md) under the assigned Local Codex primary writer. Do not start another design rewrite or stop after each internal step. If a genuine blocker appears, name the exact failing step/evidence, preserve baseline and continue independent work.

The original planning task validated documentation/source integrity only. Current execution evidence is in `docs/testing/focus-search-implementation-20261101-r1/`; that evidence does not retroactively convert planning review into product acceptance.
