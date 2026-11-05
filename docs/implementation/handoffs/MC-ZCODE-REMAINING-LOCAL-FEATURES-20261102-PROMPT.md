# MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102 — continuous backend/API/frontend completion

## 1. Assignment: implement, integrate and finish one candidate

I assign actual ZCode as the single backend/API/frontend writer for this named local continuation. Resume MatterControl's current source, fix the confirmed Filing flow defect and complete the five approved local additions below. Deliver one integrated, persisted and tested candidate across the existing Next.js/BFF → Go → PostgreSQL/object-storage architecture. Do not return only a plan, a backend stub, a design intake or one finished slice. Do not ask me to authorize the next internal wave; this is one continuous assignment.

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Expected branch: `codex/unified-project-flow`.
Prepared source HEAD: `7bf198c103476f490ebbdf58b1bd563d0bba8a61`.
Actual executor/model: identify your real ZCode application/tool, provider and model once; do not rename another agent as ZCode or silently change provider/model.

This prompt is PREPARED_NOT_DISPATCHED until the human delivers it to the actual ZCode session. Delivery activates this source assignment; historical Claude/Antigravity/Codex routing must not create a second competing writer. Preserve all prior authorship and dirty work. No evidence currently says ZCode has executed this new task.

## 2. Scope and approved policy — already decided, do not ask again

Read `docs/implementation/remaining-features-audit-20261102.md`. The PO explicitly approved the bundled local scope and rights on 2026-11-02 in the current Codex chat:

- **My Agenda:** authorized read-only cross-Matter aggregation; it grants no new access.
- **Playbooks:** Workspace OWNER publishes an immutable revision; Matter OWNER previews/applies it inside an authorized Matter. No new role and no membership grant.
- **Intake:** existing Matter only; OWNER/EDITOR may record/triage; no workspace-wide inbox, external submission or email ingestion.
- **Guidance:** existing Matter only; OWNER/EDITOR draft, OWNER publishes immutable revisions; no firm/workspace library or automatic cross-Matter sharing.
- **Saved Views:** personal private filters, not shared views or copied snapshots; current authorization still governs every result.

Keep capability IDs/priorities: Saved Views is REQ-MC-P1-12, not retroactively a P0 release criterion. Complete these local additions as explicitly assigned without claiming all P1/P2 are delivered.

**D-BF1 is unchanged:** do not require an OUTCOME criterion before APPROVAL unless a later explicit PO decision changes that rule. Preserve the honest NOT_DECLARED/PENDING/ACCEPTED outcome axis independently of package verification.

Outside this assignment: other P1 legal-domain depth, management-ready export, immutable report snapshots, external storage connectors, Office add-ins, DOCX tracked changes, reminder/email delivery, LegalMemory/MCP, AI extraction/assistant/contradiction, voice/remote workers/model fusion, cloud deployment and paid/provider actions. Do not create placeholder adapters to count them as complete.

## 3. Fresh intake and durable checkpoint

Read root/component AGENTS and `/Users/nguyenvanlan/.codex/RTK.md`. Prefix shell commands with `rtk`; use `rtk proxy` for generic commands. Semble-first local exploration; resolve/query Context7 and current installed documentation when using version-specific APIs. Obey real tool/security refusals; do not bypass hooks or permission mechanisms.

Consume current authoritative inputs, not historical completion labels:

1. `docs/implementation/remaining-features-audit-20261102.md` and `docs/requirements/p0-p1-p2-priorities.md`.
2. Current PRD, business rules, state semantics, permission matrix, acceptance criteria and Golden Workflow definitions through their current repository pointers.
3. `docs/implementation/p0-zcode-execution/local-contract.md` — revision13 at preparation; verify current revision before extending it.
4. `docs/implementation/p0-zcode-execution/workboard.json` and `docs/ai-sdlc/project-status.md`. They include historical statements; source/actual returns and later direct PO instructions supersede stale scheduling/provisioning claims.
5. `docs/testing/zcode-ba-flow-completeness-20261030-r1/coverage-summary.md`, original Eigenwelt assessment and the old roadmap. Roadmap D2–D5 were author defaults; only the specific policies in §2 are now expressly approved.
6. `docs/testing/focus-search-implementation-20261101-r1/return.md`, its acceptance matrix, original nonauthor report `docs/reviews/focus-search-candidate-20261102-r1.md`, review-fix delta and the newer committed UI corrections. FS-R1..03 repairs exist; do not recreate the module or inherit an unearned independent PASS.
7. `docs/testing/codex-sidebar-locale-20261102-r1/return.md`: latest exact-source frontend check906pass/12skip, Webpack/CSS and Storybook PASS. These are prior receipts, not your new execution results.

Verify root, branch, actual HEAD, staged/unstaged/untracked paths, local migrations and source ownership. Normal app/MCP processes are not evidence of a writer. Pause only a concretely conflicting path if another task is actually writing it; continue independent work and report the exact conflict. Do not kill agent applications or overwrite source to match old pins.

Create/resume `docs/implementation/tasks/MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102.md` and a task-owned evidence/checkpoint namespace under `docs/testing/`. Check absence/identity first; do not overwrite another session's return. Track RLF-01..08 below, requirements, dependencies, current contract revision, changed files, next action, resource IDs and exact test/build receipts. A checkpoint must let the same task resume after context/quota interruption without restarting completed work.

Choose routine implementation details from existing patterns. Before a new vertical slice, document the minimum operation/schema/error/permission/atomicity contract, then implement it immediately. Contract writing is not a separate approval gate for ordinary details. Only genuinely new material policy beyond §2 requires a decision; isolate that dependency and keep working elsewhere.

## 4. RLF-01 — fix Filing's stale transition selection first

Current target: `apps/frontend/src/features/filings/components/filing-forms.tsx`, `AdvanceForm`, around line303. Selected `to` is initialized from `detail.next[0]` but refreshed stage/allowed transitions can leave it pointing to an old target. The current `filing-ui.test.tsx` does not cover the decisive rerender.

- Reproduce RED by rendering stageA, selecting a transition and rerendering the same mounted form with stageB/changed `detail.next`.
- If the selection is still allowed, preserve user intent and the associated in-progress input. If no longer allowed, use a valid permitted target or render no action when none exists.
- Keep target label, required fields and submitted command consistent with the current detail. Never send an invalid old stage just because a select visually shows another option.
- Preserve unresolved command identity, CAS and OUTCOME_UNKNOWN behavior. Do not blindly clear/reissue an attempt when a response is uncertain.
- Verify forward/supplement/reopen cases, empty next list and conflict refresh. Keep backend guards authoritative.

## 5. RLF-02 — preserve the core and finish contextual composition

The audit found source for all20 P0 capabilities; do not rewrite W1–W7 or treat old READY labels as missing implementation. Focus, Quick Search, Manual Review Matrix, exact-version evidence, URL filters and the separate Filing outcome axis already exist.

- Reconcile actual current behavior and repaired review findings. Fix only reproduced source/runtime defects and meaningful missing wiring.
- Compose work detail's instructions/outcome, criteria, evidence basis, exact document version and dependency/upstream reason into one clear read-only context area. Use existing authorized records; do not create duplicate attachment storage or make local paths into permissions.
- Preserve Requirement versus Action and all independent axes. A Focus timer, template, intake conversion, guidance publication or review answer must never verify/complete legal work as an incidental side effect.
- Preserve current Pane/glass components, Be Vietnam Pro, compact Vietnamese typography, icons with clear accessible names, client-detected timezone, searchable named people selection, linked record titles and separate edit affordances.
- Keep create/edit surfaces behind explicit buttons/dialogs; avoid adding all new forms/cards/tabs to the initial Matter screen. Preserve filter/density/return context, keyboard/focus and unsaved/UNKNOWN state on locale/material changes.

## 6. RLF-03 — complete My Agenda and honest calendar coverage

- Add an authenticated, server-authorized cross-Matter agenda read (recommended `GET /me/agenda`, within the existing API prefix). Model a coherent read boundary, stable ordering/cursors and deterministic date bounds using recorded dates. Document exact included record types, filters and pagination.
- Query authorized aggregate data in Go/PostgreSQL rather than having the FE enumerate every Workspace/Matter and fan out unbounded requests. Provide memory/PostgreSQL contract parity.
- Denied/revoked/inactive scopes must not leak titles, people, counts, snippets or old cursor contents. Recheck authorization on each page and handle changed data/cursors explicitly.
- Reuse the existing per-Matter agenda UI/date helpers. Fix or truthfully disclose its one-page200-row limitation; do not call a bounded page a complete calendar. My Agenda's completeness must be clear too.
- Render human-readable names, source links, device-zone dates, loading/empty/error/access-loss states and accessible filter controls. No calendar sync, computed legal deadlines, scheduled execution or reminder claim.

## 7. RLF-04 — private persisted Saved Views

- Implement REQ-MC-P1-12 as persisted named **private filter definitions**, scoped to owner and the applicable existing list/Matter. Store a versioned validated filter schema, not legal record copies, tokens, arbitrary URLs or executable queries.
- Create/rename/update/delete/list/apply via the authorized existing BFF/API architecture; use current command patterns for mutable records, revision conflicts and uncertain writes. Each saved view belongs to its actual actor; knowing an ID never grants another user's filter or data.
- Restore supported filters/sort/density through the existing list URL contract, preserve Back/Forward and reject unknown/unsafe filter shapes. Reapply current authorization; handle renamed/deleted/revoked targets with clear empty/denied behavior.
- Keep this behind the list's view/filter controls. No shared library, global sharing, immutable report snapshot or retention-policy invention.

## 8. RLF-05 — versioned playbooks end to end

- Workspace OWNER authors/publishes under existing workspace authorization; publish immutable revision content and provenance. Do not mutate published revisions or old instantiations.
- Model stable entries, Requirement/Action distinction, outcomes/instructions, safe initial fields and dependency edges. Reuse existing ownership/member validation; no automatic member creation/grant. Avoid general-purpose workflow scripting or arbitrary code execution.
- Matter OWNER selects an exact published revision and previews names, item kinds, owner mappings, dependency graph and validation errors before explicit apply. Validate publication/source Workspace and target Matter scopes under the approved policy; do not infer cross-Workspace sharing.
- Reauthorize/revalidate at apply; reject cycles, foreign references and invalid people. Instantiation is **atomic** with an idempotency/receipt contract: failure creates no partial graph, retry uses the original command identity, uncertain results reconcile before another apply. This atomicity does not replace approved bulk/import partial-success semantics.
- Keep reproducible source revision/entry provenance on created work without treating it as evidence or completion. Prove persistence/restart and concurrent/replayed apply behavior on both memory and PostgreSQL.

## 9. RLF-06 — Matter-scoped human intake end to end

- OWNER/EDITOR of an existing active Matter can record original request text, received time, attributable requester/context, authorized exact-version attachments and triage disposition. Distinguish submitter/requester metadata from product membership.
- Keep original request/provenance, accountable triager and explicit linkage to resulting actual work. Intake is not a hidden draft-Matter lifecycle, Workspace-wide inbox or external form.
- Convert into an actual Requirement/Action through explicit validated confirmation. Make conversion atomic/idempotent with duplicate prevention and original receipt/UNKNOWN reconciliation; recheck role, current Matter and referenced documents/people at commit.
- Show pending/converted/declined or equivalently minimal documented states with audit/history. Do not reinterpret conversion as execution completion or evidence verification.
- Deliver a usable list/detail/triage flow through contextual navigation; no email/connector ingestion claim.

## 10. RLF-07 — Matter-only versioned guidance

- OWNER/EDITOR create/edit drafts inside an existing Matter; only its OWNER publishes immutable revisions. Keep draft concurrency and publication provenance explicit. Apply existing read/denial precedence; published guidance does not escape its Matter.
- Guidance has readable text and attributable authorized source/version references. Do not fabricate validated quote/page anchors, AI citations or import third-party knowledge code.
- Keep guidance distinct from Matter facts, legal authority, evidence and permissions. Publishing must not satisfy criteria or change any legal state axis.
- Reauthorize lists, detail, snippets and source reads; access loss purges protected client state. Referenced immutable versions stay explicit when another document version becomes current.
- Provide a concise contextual view and author/publish flow with EN/VI labels and meaningful empty/validation/conflict/history states. No shared firm wiki, retrieval provider or implicit copying between Matters.

## 11. RLF-08 — integrated acceptance and final candidate

Implement full domain/ports/policy/service/store/API/repository/FE behavior for every selected slice; no UI-only localStorage replacement for authoritative shared data. Reuse current conventions for Zod/DTO validation, central error mapping, hidden-resource precedence, revision CAS, command receipts and OUTCOME_UNKNOWN. Ensure Brief/history replay remains valid after new event target kinds; events may not accidentally reinterpret guidance/intake/playbook metadata as legal item state.

Inventory existing migrations immediately before adding compatible ones;0012 is only the last observed migration, not permission to reuse a number. Do not edit applied migrations or generated SQL by hand. Check runtime/migrator permissions for new tables without broad grants. Preserve old data, object versions, append-only events and unrelated work.

Run risk-appropriate checks and retain real commands/UTC/exits/skips:

- Backend generator/tidy/format/lint and `make check`, race tests and shared memory/PostgreSQL contracts against a new verified task-owned synthetic fixture. Cover two actors/roles, foreign scope, revocation, stale CAS, malformed inputs, replays, uncertain writes, atomic failure and persistence/restart.
- FE `pnpm check`, production build with compiled-CSS guard, applicable alternate bundle and Storybook for shared components. Use installed dependencies and isolated build outputs. Do not auto-install/relink shared node_modules through copied symlinks; isolate dependency reconciliation when necessary. Keep failures and diagnose causes rather than weakening tests.
- Connected GW-01/02/03 through the actual product UI when the supported browser and synthetic login are available: positive independent-verifier Filing path, missing/declared outcome distinction, supplement/reopen, history/Grid/Control Room/Brief, denied actions and UNKNOWN recovery.
- Focus/Search: preserve repaired FS-R1..03; author verification of actual two-tab races, account/access loss, storage failure/backward clock, current-query/IME behavior, cursor expiry/revocation mid-pagination and partial group errors. Author verification is not a new independent review.
- UI: desktop and measured320/390px, both languages/light-dark as applicable, keyboard/focus, real screen-reader announcement when available,200-row grid and no misleading truncated lists. Human AC-137 and AC-FOCUS-18 require actual participants; do not impersonate users or invent ratings.

If a browser/real IdP/human/provider-dependent check cannot run, preserve its exact NOT_RUN/BLOCKED reason and continue every independent implementation/test task. Do not stop the whole assignment after a missing browser receipt or silently count mocks as ZITADEL acceptance.

## 12. Local resources, safety and execution limits

The PO intentionally paused the retained MatterControl FE/BE/DB/IdP stack. **Do not restart or mutate those retained services/databases/volumes** or leave a new manual runtime running. Existing ports3000/3109/8081/18084/18094/8080/55440/55441/55462 were closed at handoff preparation; re-inventory before relying on that state.

For this implementation's tests, use only new isolated task-owned loopback synthetic fixtures/processes with a verified ID/label/cwd/build/port and bounded resources; credentials stay in private0600/0700 storage. Never use a production or retained user DB for migration/failure tests. Stop your test processes/fixtures at the end and retain auditable state/resource receipts; do not prune/remove unrelated containers or volumes. A local test fixture is not the user's resumed manual environment.

No production credentials, real legal documents, external provider payloads, cloud mutations, paid services, IdP administration, MFA/email-verification bypass, messages, commits, push, merge or deployment are authorized by this implementation prompt. Existing normal tool/security checks remain active. Real login, if separately permitted, is entered by the human; never request passwords/tokens in the final report.

## 13. Completion policy — continue until one full return

Internal order: RLF-01 fix → RLF-02 core/context → RLF-03 agenda → RLF-04 saved filters → RLF-05 playbooks → RLF-06 intake → RLF-07 guidance → RLF-08 integration. Adjust independent execution order when technically justified, but do not ask to start each slice or silently omit one. Contract details, tests and checkpoints are part of implementation, not substitute final deliveries.

Continue until every implementable approved local item has real source, persisted behavior, integrated UI and meaningful author checks, or an exact external/policy/tool blocker. Resolve ordinary bugs and test/build failures autonomously within scope. If quota/context interrupts, record the precise next unfinished operation and source/resource identities; the same task remains resumable. Never mark unexecuted work DISPATCHED/EXECUTED or self-award independent acceptance.

Final return, one consolidated packet:

1. Actual ZCode identity/model, root/branch/base/head and one-writer acknowledgement.
2. RLF-01..08 matrix: source/API/FE/migration locations, implementation status, tests actually run, browser/human results and remaining gaps.
3. All16 original Eigenwelt rows dispositioned honestly; distinguish implemented bounded scope, still missing, dependency-gated and intentionally deferred. List remaining P1/P2 separately; do not claim all product capabilities complete.
4. Six delivered improvements: Filing fix plus the five new local features; contextual work composition; precise operation/permission/atomicity contracts and any deviations.
5. Final source manifest/delta and reproducible commands, UTC, exits, pass/fail/skip counts, retained failed attempts and public-evidence privacy boundaries.
6. Regression of existing core/Focus/Search/Review/data/history/locale behavior, including independent reviewer still needed for your source changes.
7. Resources stopped/retained, no existing-volume mutation and no resumed retained stack. Exact manual-start instructions may be prepared, not executed.
8. One concise unresolved-decision/dependency list and the next independent QA action. D-BF1 is unchanged, not a reason to suspend all work.

Use `AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW` only when the approved local source/test scope is genuinely complete; otherwise `PARTIAL_IMPLEMENTATION` with an exact unfinished list. No MC-002/P0/release DONE. End with skipped checks and remaining risks. Do not end at a checkpoint asking whether to continue.
