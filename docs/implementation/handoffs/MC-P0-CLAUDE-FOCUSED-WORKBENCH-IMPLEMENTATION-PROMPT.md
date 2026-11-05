# MC-P0-UX-FOCUSED-WORKBENCH — implement the selected legal-team experience

Owner amendment,2026-10-29: the PO subsequently assigned the UI correction to actual Local Codex. This Claude handoff is historical/reference for that scope; do not start a competing frontend writer. See `docs/implementation/tasks/MC-P0-CODEX-UI-FIDELITY-20261029.md` and its evidence for the current correction. Later feature work must consume the new source after an actual handoff.

Revision 2 — reconciled with Claude Code's 2026-10-29 backend-hardening/action-entry handoff. This revision supersedes revision 1's broad backend read-model editing allowance. Resume the current session and current source; do not repeat completed dialog work or turn this task into infrastructure remediation.

You are actual Claude Code, continuing the current MatterControl implementation. The Product Owner requests implementation of the selected UI now, before adding new capabilities from the Eigenwelt research. Deliver a connected, usable local product experience, not another planning-only pass or a restyled prototype. Continue through implementation, regression checks and permitted rendered validation in one assignment; stop only for a concrete blocker or a material product-policy decision.

## 1. Context, ownership and scope

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Expected coordination branch: `codex/unified-project-flow`. Verify actual HEAD and dirty changes at intake; do not reset to a historical manifest. Preserve prior Claude/ZCode/Antigravity/Codex work and actual authorship.

This is a manual handoff prepared by Local Codex, not evidence of dispatch or execution. Once the human pastes this assignment into the current Claude session, continue that session instead of starting a duplicate writer. If another task is actually modifying the same source, identify the conflicting files and coordinate ownership; a resident process alone does not prove active writing. Do not require closing every app or killing unowned processes.

Owner: Claude Code, frontend composition and local frontend verification. Codex retains backend/DevOps coordination and separate intake of the hardening return. Reviewer: a nonauthor assigned by Codex after return; your checks are author verification. Priority: current usable local P0 experience. Dependencies: existing Next.js/Go REST, authenticated sessions, authorized Matter data. Do not replace these with mocks.

### Current checkpoint — do not restart it

The latest Claude return reports the following; verify current bytes before relying on them. Reported author checks are not independent acceptance.

- Backend module is now **`leonx.me/matter-control`**, confirmed in the current `apps/backend/go.mod`. Preserve this user-requested rename and its dirty changes. Never restore `github.com/example/userapi` or copy stale imports from an older worktree. Accepting this as the current source baseline does not certify the 101-file rename/hardening diff.
- Backend R2 adapter/configuration/AWS dependencies, depguard hardening, shared object contract suites, missing/corrupt object sentinels and integrity logging already exist. Their evidence is under `docs/testing/p0-final-parallel-20261028/claude-r2-object-store-r1/` and `claude-backend-hardening-r1/`. Preserve them without redoing/reverting them. Real R2 and PostgreSQL checks remain unverified where reported skipped.
- **Action-entry UX is already implemented**: named create/add triggers, `TaskDialog`/`TaskSuccess`, `UnresolvedReporter`, `TaskChoice`, bounded dialogs, Data task chooser and `/matters/[matterId]/filings/new`. Read `docs/testing/p0-final-parallel-20261028/claude-action-entry-ux-r1/return.md` and its delta. Reuse these mechanisms rather than introducing competing dialog/success/draft state systems.
- That return reports author checks of 64 files / 605 tests, both product builds/CSS guards and Storybook. These are historical results for that candidate, not proof of the new candidate. Browser validation was **NOT_RUN**. The proof-upload test's reported timeout remains a test reliability issue to diagnose if reproduced; do not remove assertions, extend waits arbitrarily or report a green rerun as proof of no flake.
- The frontend standalone Dockerfile/output changes exist. Preserve them; image builds or Cloud Run deployment are not deliverables of this UI task.
- ADR-004/005 and deployment checklists contain reported PO infrastructure decisions. Read only enough to avoid incompatible changes. This prompt neither re-adjudicates those records nor authorizes deployment, paid resources or their blocker queue.

The remaining UI job is **selected focused-workbench composition + connected-flow consistency + real rendered validation**, not another pass moving forms into dialogs. Create or resume one task record at `docs/implementation/tasks/MC-P0-UX-FOCUSED-WORKBENCH.md` with this ownership, requirements, dependencies, outputs, acceptance and reviewer. Do not mark the separate backend hardening return accepted or create a misleading completed review of it.

Requirements: BR-001..007; REQ-MC-P0-01..20 remain intact. Focus this change on P0-03/04/06/07/09/10/11/15/18/20 and connected navigation. This is UI execution authority for the selected composition, not approval of new business features, providers or production release.

## 2. Read these inputs before editing

Read root/component AGENTS instructions, RTK rules, current-workflow, latest project-status/workboard and relevant frontend rules. Use Semble first for code exploration. Use Context7 for framework/library documentation and installed Next.js documentation where required. All shell commands use `rtk` or `rtk proxy`.

Design source of truth, in order:

1. `docs/design/legal-team-experience-20261029/concepts/approved-selection.json` and `concept-3.png` in that directory. The PO selected **option 3: focused workbench**. Inspect the image; do not open a new design vote.
2. `design-prototypes/focused-workbench/README.md`, `design-qa.md`, source and retained screenshots in `evidence/`. Inspect the interactive reference if safely available. It is synthetic-only and demonstrates composition, not product policy or API behavior.
3. `docs/design/legal-team-experience-20261029/design-direction.md`, `business-analysis.md`, `product-design-brief.md`.
4. `docs/research/eigenwelt-20261029/mattercontrol-integration-assessment.md` and the LegalWork feature inventory linked from its README. Consume the **interaction patterns**, not the entire future-feature roadmap.
5. Existing `MC-P0-CLAUDE-FOCUSED-WORKBENCH-SELECTED-DESIGN.md` in this handoff directory, R9 consumer addendum, current API contract, permission/state semantics and Golden Workflow acceptance.
6. `docs/testing/p0-final-parallel-20261028/claude-action-entry-ux-r1/return.md` and `source-delta.json`; `claude-backend-hardening-r1/return.md`; `docs/superpowers/specs/2026-10-29-backend-hexagonal-hardening-design.md`. These are source/checkpoint inputs, not newly accepted gates.

Direct PO selection and this implementation assignment take precedence over stale documents saying visual selection or UI execution is still pending. R9 business/state safeguards remain; option 3 defines the new hierarchy. The research's intake/templates/AI/connectors are proposals, not approved P0 implementation.

Use relevant installed Impeccable/design-taste/Hallmark skills if available. Preserve the selected visual rather than generating alternatives. If a skill runtime is unavailable, state that and proceed from actual project context without installing global tooling or blocking the assignment. Follow skill craft/accessibility guidance before UI edits.

## 3. Required user experience

The core loop must be obvious: **My Work → choose one real assigned item → understand why → take the permitted next step → see the confirmed result → return to the same context**.

### A. Shell and My Work

- Two primary destinations: My Work and Matters; workspace switching/admin remains contextual. Preserve existing domain routes and deep links, including `/my-actions`. Visible labels can improve without slug/ID migrations.
- Follow option 3: a short queue/priority rail, one dominant current-work panel, and a small Up next list. Do not render four long queue sections, a wall of metrics or a catalogue of create forms.
- Queue choices map to actual next/waiting/blocked/historical data. An item may legitimately appear under more than one derived condition; do not invent mutually exclusive state or total counts. Use exact page/partial count semantics.
- Current item: readable title and Matter name, accountable person where authorized, due context, one plain-language reason, relevant criterion/version and one primary permitted action. Details/history/provenance are available on demand.
- Preserve server ordering; do not invent priority scores, due dates, people or cross-Matter review/decision feeds. If a selected record disappears or becomes inaccessible, clear protected content and explain the safe continuation.
- No ready work is an honest empty state with Waiting/Blocked/Matters navigation, not fabricated tasks or a claim that all work is complete.

### B. Matter overview and contextual work

- Lead with Matter name, scope/as-of and actual blockers/next actions/waiting relevant to this Matter. Surface consequential information first; keep full Grid, documents, filings, history and administration reachable by clear contextual navigation.
- Show causes and upstream links rather than unexplained red badges. Preserve Requirement versus Action and execution versus evidence verification. A completed Action may still lack verified proof.
- No invented overall readiness percentage or aggregate legal status. Do not hide mandatory UNKNOWN alerts, refusal reasons or decision-critical version information behind an optional disclosure.
- Use existing version/evidence data to build a contextual drawer/panel when feasible. Show criterion, exact document/version, submitter/reviewer eligibility and as-of where supplied. Do not fabricate quoted text, PDF page anchors or source metadata absent from the API.
- Preserve current Filing semantics, including receipt versus approval, supplement/outcome and reopen proof epoch.

### C. Creation, people and lists

First reconcile this section against the implemented action-entry return. Keep correct existing dialogs and chooser flows; change only actual gaps or mismatches with the selected composition. Do not delete their regression coverage while restyling.

- Create Matter, add member and similar creation flows open from named buttons into focused dialogs/drawers or dedicated task routes when complexity requires. No permanent creation form on the landing/list view.
- Keep the current title-only Create Matter contract; do not add mandatory client/type/template fields. After confirmed creation, navigate to the actual Matter and make the next supported step clear.
- Reuse and finish the existing searchable person picker/member-candidates flow. Show names and useful authorized distinguishing information; never require users to type a raw user ID. Duplicate names need a safe differentiator supplied by the real contract, not guessed email/role.
- Search filters/results update their own region without a full document reload, preserve focus/query, handle loading/no matches/error and stale responses. Avoid a fetch per keystroke without existing debounce/cancellation behavior; do not introduce a new data library.
- Lists use readable labels, restrained status cues and contextual actions. IDs remain technical identifiers in routes/commands, optionally available through details/copy. Do not expose hidden Matter titles or directory results outside approved OWNER/local-dev scope.

### D. Visual and interaction quality

- Match option 3's proportions, whitespace, readable typography, quiet neutral surfaces and restrained accents. Use existing R9 tokens/Lucide/shared components; avoid nested card walls, many equal-weight badges and decorative animation.
- Apply the composition consistently across My Work, Matter overview and connected creation/member flows. Changing colors alone or moving every form into a modal is insufficient.
- Keep English/Vietnamese complete for touched strings, dates/timezones explicit and long legal names wrapping safely.
- At narrow widths the queue becomes an accessible switch/list above the selected detail. No horizontal page overflow; intentional wide Grid scrolling stays inside the Grid.
- Keyboard: operable picker and dialogs, visible focus, Escape, focus trap/return, usable error announcements and touch targets. Respect reduced motion. Keep draft intent on ordinary close/reopen where policy allows; access loss must purge it.

## 4. Engineering boundaries

Reuse the current app: Next.js Server Components and interactive client leaves, feature repositories/actions, shared domain-free Atomic components and business compositions under `src/features/`. No Vite runtime or synthetic handlers from the prototype in production. Preserve compiled Tailwind/PostCSS CSS guard and existing Webpack/Turbopack support.

Starting points (verify current contents and callers):

- `apps/frontend/src/app/(app)/my-actions/page.tsx`
- `apps/frontend/src/features/work/components/my-actions-view.tsx`
- `apps/frontend/src/features/control/components/control-room-view.tsx`
- app layouts, Matter/workspace routes, existing member forms/pickers and shared dialog/select primitives.

If actual My Actions lacks authorized Matter titles/context, verify current API/FE schemas first. Reuse already-loaded authorized bounded context if available. Avoid client N+1 joins, unbounded scans or a second directory API. If an additive Go read-model change is genuinely necessary, produce a narrow backend request for Codex (fields, permission predicate, store/API impact, tests and affected UX), continue the remaining frontend work and label only the dependent slice blocked. This revision does **not** assign Go edits, sqlc regeneration, module refactors, storage or timeout work to Claude. Do not make the whole frontend wait for optional metadata; never invent labels or present opaque IDs as meaningful names.

### Real-data boundary and TB-12

The checkpoint identifies that unset `API_MODE` currently defaults to demo and may produce a demo session. Do not let the restyled product silently demonstrate fake data. Use **`API_MODE=rest`**, the real local API and ordinary authenticated session for all product runtime verification; record only sanitized configuration facts.

Inspect existing env/auth initialization and repository rules. Apply a minimal frontend fail-closed guard for product runtime: refuse unset/demo API mode or anonymous fallback before protected product data is rendered. Keep build/type-generation phases compatible through the documented actual Next.js lifecycle; do not broadly rewrite auth or add a bypass variable. Existing isolated stories/test fixtures may remain synthetic with their explicit boundaries; they cannot satisfy runtime acceptance. Test the real runtime failure for missing/demo mode and success for correctly configured REST mode without exposing secrets. If the lifecycle distinction cannot be implemented safely under current contracts, report the exact blocker and complete the other UI slices; do not mask it by assuming NODE_ENV alone proves runtime phase.

### Separate Codex/DevOps backlog — record, do not execute here

Per-route upload/download/import/bulk timeouts, Cloud Run filesystem guard, database readiness/keep-alive, Supabase role statement_timeout, shutdown/instance caps, nightly dump/restore, real R2 bucket testing, architecture documentation reconciliation, deferred S5 API/Postman and ZITADEL tester-app questions remain separate assignments. No infrastructure, billing, bucket, IdP or database-role changes in this UI task. Existing recorded PO decisions are not silently revoked; previously approved resource actions must still be assigned to their actual owner.

Preserve: authorization, hidden-resource precedence, ETags/CAS, original idempotency/receipt identity, safe return paths including RV-001, CR-002 attempt persistence, access-loss purge and OUTCOME_UNKNOWN reconciliation. No blind mutation retries, fresh keys after ambiguous writes or optimistic success without readback.

No new AI assistant/extraction, intake lifecycle, LegalMemory deployment, generic workflow builder, Office editor, cloud storage connector, billing, model subscription, new role or provider. Do not add Medusa as a platform/dependency. No global tool/IdP policy changes, production credentials, paid services, destructive DB/volume actions, commit, merge or push.

## 5. Execute and verify

1. Intake current source/dirty work, acknowledge the module rename and existing action-entry mechanisms, and document a short **already implemented / adjust / missing / verification only** map. Then implement the remaining workbench; do not stop at the map or ask to continue after each screen. Do not wait for Codex to accept the unrelated backend-hardening packet before progressing on frontend files.
2. Complete the three connected journeys: ready Action → actual permitted command → confirmed readback; blocked Action → causal prerequisite → return; completed work → exact-version evidence assessment when the current user is eligible. Do not grant verifier rights to make a demo pass.
3. Add focused regression tests for queue/selection/context restoration, inaccessible selections, loading/empty/error/partial/UNKNOWN states, dialog/picker keyboard behavior and access-loss cleanup. Exercise actual component/action seams rather than markup-only assertions.
4. From `apps/frontend`, run the existing scripts with RTK: `pnpm check`, `pnpm build` and `pnpm build:webpack`, including the compiled-CSS guard. Run affected Storybook checks per repository testing rules. Inspect existing e2e before running: the prior return says they target template demo mode, so do not use them as product evidence. Add/update focused product browser coverage where supported by the permitted test setup. Backend hardening/PG/R2 rechecks belong to Codex's separate intake and do not gate unrelated frontend source progress.
5. Use the permitted browser tool for real rendered local checks. Inspect desktop and narrow layouts (including 390px and 320px), names with long text, keyboard/focus, create/member search and Back/context behavior. Compare actual rendered product with option 3; fix visible issues, not just test failures.
   Specifically complete the action-entry gaps: dialog focus return, Escape/backdrop behavior, bounded scrolling and reachable submit at 320px, light/dark themes, success notice after confirmed readback, hidden pending/UNKNOWN affordances, Data recovery alerts outside hidden tasks, and the real `/filings/new` navigation. Exercise Work, Planning, Documents, Filings, Control Room and Data without opening every form at once.
6. Preserve existing authenticated runtime/session ownership. Do not stop an unowned process or replace the database to obtain a prettier screenshot. If restart is required, inspect ownership/config and follow the current runtime handoff. Never print env, secrets, cookies or private account data.
7. If login requires the human, leave the page ready and request only human entry; do useful non-authenticated checks meanwhile. If browser access is unavailable, deliver source/build work and mark rendered checks BLOCKED with exact cause. Do not bypass denied browser/OS permissions or infer a browser PASS from a build.

Do not broaden the existing approved 10-second manager-comprehension trial or claim it passed without actual participants. Author checks remain separate from independent QA and release acceptance.

## 6. Final return

Choose a new absent evidence directory under `docs/testing/` for this task; resume only if it demonstrably belongs to this assignment. Produce:

- `return.md`: identity/tool, intake/final HEAD, ownership, changed files, implemented journeys, visual comparison, exact tests/results and blockers.
- `design-conformance.md`: selected concept elements → production components/routes; retained functionality and any real contract limitation.
- `backend-requests.md` only if a genuine read-model dependency exists; distinguish it from the previously reported infrastructure backlog. Do not create an empty tracking framework.
- Source manifest/delta and bounded command receipts (UTC, cwd, argv, exit, version), plus permitted synthetic screenshots. Hash the final artifacts without circular self-reference.
- Update the applicable task/workboard with factual status and evidence; do not rewrite historical packets or claim external review ran.

Completion means a coherent local implementation with functioning real flows and recorded verification, not a new mock or a progress-only response. Proposed status: `IN_REVIEW_WITH_VERIFICATION_BLOCKERS` if any rendered/IdP/user checks remain, otherwise `IN_REVIEW`. No self-awarded independent PASS, MC-002 DONE or release approval.

End with the exact local URL/current runtime disposition, remaining checks, and what Codex should review next. Explicitly separate: workbench implemented, existing action-entry reused, TB-12 runtime guard, browser observed versus blocked, and backend requests. State skipped work and remaining risk. No commit/push in this assignment; Codex will coordinate the next review and any later commit instruction.
