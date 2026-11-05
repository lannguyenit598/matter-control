# MC-CLAUDE-BUSINESS-FLOW-REMEDIATION-20261030

Preparation status: READY_FOR_MANUAL_DISPATCH. Preparing this file is not agent invocation. Execution begins when the Product Owner pastes this assignment into actual Claude Code.

## Assignment and finish condition

You are actual Claude Code. Take over the backend/API/frontend remediation of BF-01 through BF-10 in one continuous assignment. Deliver one integrated local candidate, with passing applicable author checks and a finding-by-finding return. Do not stop after planning, design intake, one finding, one wave or a progress checkpoint to ask whether to continue. Save checkpoints and resume from them if interrupted. Stop dependent work only for a concrete unresolved business decision, permission boundary or demonstrated conflicting writer; continue unrelated authorized fixes.

This is an implementation assignment following the BA/PM business-flow review, not another report-only audit. The current review contains two P1 Filing defects and eight P2 defects/product-flow recommendations. P1/P2 here are remediation priorities, not changes to the approved capability register. Implement the bounded review-queue and Matter-discovery improvements described below; do not expand into an organization model, AI platform or generic workflow builder.

## Repository, ownership and preflight

- Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
- Expected branch: `codex/unified-project-flow`.
- Review HEAD: `0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee`. Re-read actual HEAD and source; record legitimate drift rather than resetting to this checkpoint.
- Codex has finished its preceding Liquid Glass/dark-mode source work in this chat. This handoff transfers the frontend/backend source paths necessary for BF-01..10 to actual Claude Code. Preserve all existing uncommitted work and prior authorship. Do not demand that ZCode, Codex or MCP applications quit merely because processes exist; only concrete overlapping writes establish a competing writer.
- Concurrent OpenCode QA artifacts belong to their reviewer. Do not alter their outputs or evidence namespaces.
- Allowed: necessary existing backend/domain/service/port/API/persistence/tests, frontend routes/features/shared UI/tests/stories, new forward migrations where required, and matching contract/docs/task/evidence updates. Apply the existing architecture and every matching AGENTS/rule file.
- No reset, stash, clean, branch switch, overwrite of another task, stage, commit, push, merge or deployment. No paid service, new provider payload, IdP policy change or production data.
- Prefix shell commands with `rtk`; use `rtk proxy` for raw commands. Semble before code exploration. Resolve/query Context7 for library-specific API/configuration questions; use local official installed docs where appropriate. Do not install/upgrade dependencies merely to start work.

First record actual tool/model identity, root/branch/HEAD, dirty-path inventory and a candidate source manifest. Verify the review packet before consuming it. If a source pin changed, assess the actual delta and mark supersession; the old report remains immutable.

## Required inputs

Read completely:

1. `docs/testing/codex-business-flow-review-20261030-r1/return.md`
2. Its `findings.json`, `inputs.json`, `closing-checks.json`, `outputs-manifest.json` and command receipts. Manifest SHA-256 at preparation: `e66f13b199aa28e3cb8f700473eda0f59489524bfc5ec6777aa5374fdcf5f381` for inputs.json; findings.json `cd2051b616294db52c0f500ba91f736ba5788d17d2e36489819e36bbdc0f13bd`; return.md `c9cd7803159a6092da26c934811f36b4fa7c7262d1739965baa9c8f2f9bf3aa9`.
3. `docs/requirements/prd.md`, `business-rules.md`, `permission-matrix.md`, `state-semantics.md`, `golden-workflow-acceptance.md`, and `docs/product/user-journeys.md`.
4. Current implementation contract `docs/implementation/p0-zcode-execution/local-contract.md`; actual backend `docs/api.md`; latest matching architecture/design decisions and workboard. Reconcile stale status prose against current source.
5. `docs/design/legal-team-experience-20261029/product-design-brief.md` and the existing focused-workbench/creation-flow direction.
6. `docs/testing/codex-liquid-main-20261030-r1/return.md` and `docs/testing/codex-dark-glass-20261030-r1/return.md`: retain the current UI material, compact typography, Vietnamese font, icons, and accessibility fallbacks.

Review provenance matters: the PM completed a source review. The BA supplied four findings then hit its usage limit; Local Codex verified those four before consolidating. Neither that report nor the passing memory/component tests is connected browser acceptance.

## One execution plan

Create one plan/checkpoint/workboard for this assignment. Implement the following groups in dependency order and continue through all of them. Design the small contract delta immediately before its implementation; do not run a separate approval loop for routine implementation choices already implied by these corrections. If a proposal would change approved business policy rather than implement it, isolate the exact decision and continue the rest.

### A. Filing correctness — BF-01 and BF-02 first

Reproduce both mismatches before changing behavior:

- Package/signature readiness currently feeds the same aggregate as final outcome verification. The GW fixture already expects VERIFIED before submission and still VERIFIED at approval merely after an outcome observation. Do not treat that green test as the approved outcome semantics.
- `proofRequired=no` is offered by the create form, but backend requires package criteria while the generic work detail and ProofPanel hide the checklist and its commands.

Implement the smallest explicit distinction between pre-submission package/signature criteria and outcome criteria. The exact schema/DTO design is yours to document, consistent with the approved rules. Required behavior:

1. An applicable verified package/signature gate permits submission without requiring a future authority outcome in advance.
2. Actual authority approval evidence can be recorded while required outcome verification remains UNVERIFIED/pending until a designated non-submitter accepts it. Do not relabel package acceptance as final outcome acceptance.
3. Preserve independent execution/verification/dependency/time/attention axes, exact submitted versions, repeated supplement cycles, negative outcomes, corrections, proof epochs and history.
4. Preserve the distinction between the Filing Action and linked Requirement. No automatic completion/verification of the linked Requirement.
5. Existing `proofRequired=false` behavior must not waive package/signature gates; its checklist must remain reachable through authorized UI capabilities. If the flag means no outcome verification state, say so accurately instead of implying that it removes package requirements. The actual authority-outcome observation remains required by the filing stage machine.
6. Signature applicability remains an explicit OWNER decision with reason. Do not weaken the F03/backend guards to make the UI pass.

For persistence changes: inspect the latest migration inventory, add a new forward migration, never edit applied migrations or generated sqlc output. Define safe legacy behavior without guessing criterion purpose from titles. Preserve all historical facts; uncertainty must not grant VERIFIED or bypass submission. Test migration/backward compatibility on a task-owned synthetic fixture. Do not apply migrations to the retained manual-login database or rewrite evidence.

Update memory and PostgreSQL adapters, HTTP/DTO/docs, service contracts, frontend rendering/forms, and GW tests together. A changed test expectation requires an explicit link to the approved semantics and a regression that failed before the fix.

### B. Correct dates and complete record selection — BF-03 and BF-04

- Use the client/device zone for wall-clock date entry, not a default `+00:00` manual dropdown. Reuse `useTimeZone` and date helpers. Render the zone read-only; preserve explicit instants on the wire and unchanged values on edit.
- Apply this consistently to due dates, completion, filing/supplement observations and other affected entry callers. Inventory callers first; do not change only the displayed date component.
- Use the selected date's actual offset, including DST/non-hour zones. Reject nonexistent local times and make ambiguous times explicit rather than silently guessing. Keep the UI small; do not introduce a global timezone configuration feature.
- Replace first-page-only dependency and Filing Requirement selectors with existing searchable/paginated control patterns. Every eligible authorized record must be reachable beyond200 rows; keep requests bounded, selection stable and empty/loading/error/access-loss states truthful.
- Search must not implicitly submit the surrounding mutation form or trigger a whole-document navigation. Retain URL filter/deep-link semantics where applicable.

### C. Entry and operational context — BF-06 and BF-07

- Default `/` and login-without-valid-return-target to `/my-actions`. Retain valid deep-link return targets and all existing URL safety protections, including RV-001. New users with no work need a clear workspace/Matter setup path.
- Make the Matter landing expose its operational brief using the existing authorized Control Room composition/read model: current truth, blocker/waiting cause, next actor/action, proof/filing exposure, relevant date and meaningful changes.
- Move administration/history into deliberate secondary navigation and group secondary tabs where helpful. Preserve every existing function, role guard, deep link, draft and return origin. Avoid duplicating Control Room under two subtly different implementations.

### D. Connect review and Matter discovery — BF-05 and BF-08

Implement bounded authorized read models with API contract/tests before wiring the FE; do not stitch a global index from uncontrolled frontend fan-out.

- A designated independent verifier must discover pending assessments even when not the work-item owner. Provide a clearly named review queue with exact criterion/document/version context and the assessment destination. This is separate from ordinary assigned execution queues; do not distort Next Action eligibility or let a submitter assess their own evidence.
- The primary Matters entry should allow finding accessible Matters by name across the caller's active Workspaces, retaining visible Workspace context and bounded pagination. Use supported owner/attention/due facts only where defined by the read model; do not invent summary scores or misleading partial totals. Keep Workspace administration separately reachable and accurately labelled.
- Apply authorization before returning rows, names, counts, snippets or pagination metadata. Active Workspace plus explicit Matter membership remain required; Workspace OWNER has no implicit access to confidential Matters. Revocation must remove results and cached derived data. Test wrong-Matter/nonmember/viewer/revoked cases.
- No Organization/customer entity, automatic sharing, firm-wide directory or production discovery expansion is part of this assignment.

### E. Finish the working journey and manager output — BF-09 and BF-10

- Work-item detail should lead with why now, expected outcome, current blocker/wait and one meaningful primary operation permitted by state/role. Put metadata/secondary/owner-only exceptions behind intentional disclosure; preserve all real controls and error/recovery behavior.
- Requirements remain conditions/outcomes; Actions remain work. Review-matrix answers, uploads and completed Actions never automatically satisfy a Requirement.
- Expose Create status brief from Matter context. Replace raw t1/t2 timestamp entry with ordinary date/time-range entry in the device zone; retain the exact `(t1,t2]` and recorded/effective-time semantics.
- Present change descriptions with safe human-readable object labels and links; put raw IDs/event kinds/provenance in details. Do not use today's renamed title as an asserted historical fact. Missing/historical/deleted labels must be honest and permission-safe.
- Keep changes separate from outstanding-at-t2, late-recorded facts explicit, unavailable/access-loss behavior fail-closed, and the output labelled a draft for human review.

## UX and compatibility constraints

Keep existing Next.js/Go/PostgreSQL architecture and project components. Use the selected focused workbench and the current Liquid Glass light/dark tokens rather than restarting design. Preserve compact text, Vietnamese glyph support, icons with understandable labels/tooltips, responsive layout, keyboard focus and reduced-motion/transparency/forced-colors fallbacks. No giant inline creation forms or blanket removal of functions to reduce visual density.

Preserve CAS/If-Match, receipts, exact original UNKNOWN attempt payload/key across refresh/reload, access-loss purge and draft recovery. A timeout/503 is not proof of no write. Do not turn a retry into a fresh intent automatically. Retain RV-001 redirect normalization protections and CR-002 attempt persistence.

## Validation and resource safety

Use only synthetic data. Never print or export secrets, cookies, tokens, DSNs or private-key content. Do not change ZITADEL settings or bypass email verification. No dependency installation/relink through shared node_modules; use installed tools and controlled isolated builds.

Run meaningful regressions for each fix and the appropriate final gates:

- Backend: `make check` against a newly created, identity-verified, loopback-only task-owned PostgreSQL fixture; memory+PG contracts, HTTP negative cases, migration compatibility and all three GW suites. Capture explicit pass/fail/skip counts. No retained DB/volume modification.
- Frontend: `pnpm check`; production build and Webpack build with compiled-CSS guard; Storybook build if shared UI changes; targeted keyboard/component/recovery tests. Run final gates after the integrated candidate settles, not on moving bytes.
- Add connected browser cases for GW-01/02/03 covering contributor → independent verifier → manager, plus no-proof Filing, pending outcome verification, reopen/reject/supplement, >200-record selection, client-zone dates, review inbox, default/deep-link login, access loss and UNKNOWN reconciliation.
- Run browser cases only through a permitted tool/session with ordinary synthetic accounts. The last Codex browser attempt reported local browser use disabled in Work settings. If still unavailable, do not use headless/OS capture/another browser path to bypass the denial. Finish all source and nonbrowser verification and return the exact remaining manual runbook; rendered/human results remain NOT_RUN. AC-137 needs actual participants, not a fabricated comprehension claim.
- Do not stop/restart the current manual runtime or reviewer fixtures without an explicit owned-resource handoff. Existing Codex frontend snapshot was `/private/tmp/mc-dark-manual-chv1bfpa/frontend` on3000 and API on8081; reverify current state, do not trust stale PIDs. Do not change callback ports/origins to bypass IdP registration. If runtime refresh is outside your resource authority, deliver a start/swap handoff with pinned build and exact owner checks.

## Outputs and single final return

Create `docs/testing/claude-business-flow-remediation-20261030-r1/` only after checking absence. If it already belongs to this assignment, inspect/resume it; otherwise choose a new attempt suffix without overwrite. Maintain one task/plan and resumable checkpoint rather than separate approval-gated tasks for each finding.

Return:

1. Actual identity/tool/model, branch/base/head and source-writer handoff record.
2. BF-01..BF-10 disposition table: fixed/partially fixed/decision required, exact implementation files, tests and remaining limitations. Distinguish optional design improvements from correctness defects.
3. Small contract/schema/read-model decisions, legacy compatibility, permission/recovery guarantees and UI journey changes.
4. Exact command receipts with UTC/cwd/exit, test counts/skips and failed attempts preserved.
5. Final source manifest/delta and output hashes, no self-referencing manifest cycle; closing drift check.
6. Evidence for memory/PG/HTTP/FE and any actually executed browser journeys; separate cited old evidence from new execution.
7. Local runtime/build handoff, cleanup disposition and exact next independent QA action.

Do not self-award independent PASS, MC-002 DONE, business acceptance, production multi-tenancy, cloud/cost/recovery or release approval. Appropriate result: IMPLEMENTED_SELF_TESTED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS when the source work is complete but browser or nonauthor acceptance is still missing.

End with skipped work and remaining risk. Continue implementation to that consolidated candidate; do not return only a plan or stop after design intake.
