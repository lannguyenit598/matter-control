# Creation-flow UX and external-return intake

Actual Local Codex. Branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`. Proposed status IN_REVIEW_WITH_VERIFICATION_LIMITATIONS. This is implementation plus author verification, not product/release completion.

## PM/BA collaboration and delivered behavior

Requested Product Manager and Business Analyst subagents ran, reviewed actual source and approved requirements, exchanged constraints and produced a reconciled proposal. Their four artifacts are in `docs/design/creation-flow-ux-r1/`. Their source-only implementation reviews include refreshed-HEAD addenda and retain browser/human limitations.

Delivered changes: named Workspace/Matter guidance and empty-state links; one shared Action-versus-Requirement chooser on Matter Overview and Work; one open form with both instances retained; minimal existing required fields; canonical operational detail after Requirement creation; Document/Filing success continuation; missing Filing prerequisites linked to existing Work/Planning screens. No new API, transaction, permission, state coupling, required field or default record.

Requirement now has the same scoped draft mechanism as Action. Intake of Claude's CR-002 found Workspace/Matter lacked a scope, so the existing new attempt persistence could not restore those forms after remount. Added only their scope bindings; two real-form tests reproduced missing retry state before the fix, then verified identical original request/key after remount. No changes to Claude's shared attempt implementation were needed.

## External returns reconciled

- Verified three Claude commits exist in ancestry: `f8c0928` removes legacy userapi/moves CI; `fc09bec` implements CR-002 option A; `20feedb` adds TLS-loopback validation, optional migration DSN, optional in-flight cap and boundary-write guard. No reset/rollback/merge was performed. The three shared Go diffs still contain Codex's directory configuration, routes and wiring. Fixed Codex's two goimports issues; lint now reports zero issues.
- Claude's `phase3-and-cr002-record.md` says “working tree only”; that status is superseded by the actual verified commits and the user-supplied completion return. Original evidence remains untouched. No push claim is made.
- OpenCode R2 output manifest verified 4/4 payload hashes and sizes (see `external-intake.json`). Its 20-path UI/CSS PASS and retained-restore PASS stand only on their original bytes. Its NEEDS_INPUT_REFRESH is honored: the new candidate is pinned separately. Its historical CR-002 DECISION_REQUIRED is not rewritten; newer author implementation exists at `fc09bec`, with independent/browser acceptance still pending.
- No production throttle number, per-user rate-limit identity/algorithm, boundary-due protocol change or split-role grants were invented. MC_MAX_IN_FLIGHT remains its new default 0 in the retained local process. Old restore evidence is not promoted to a current-source restore result.

## Candidate and checks

`source-manifest.json`: SHA-256 `975b108323ad3a3f821472414fc778504a7d2f9bf7a163c0450f1eb8dac8f165`, 675 selected regular files, 6,885,972 bytes. Selection is current nonignored regular files under backend/frontend/root workflows; symlink declarations are excluded. Relative to the previous 724-entry local-UX manifest there are 60 changed/added entries and 65 removed selected paths; all 65 are absent on disk following the newer legacy-stack removal. `source-delta.json` explicitly records the changed selection and removed entries. No old snapshot was modified. Closing rehash: 675/675 match, zero mismatches.

Logs have adjacent exact argv/cwd/UTC/exit receipts:

- `backend-check.log`: `make check` exit 0 (generated-query check, formatting, tidy diff, golangci-lint **0 issues**, full Go race suite). PostgreSQL suites skipped because no MC_TEST_DATABASE_URL was supplied. Prior real directory test remains evidence for its earlier pins, not a new split-role or full-PG result.
- `frontend-check.log`: exit 0; typecheck, lint, format, **54 files / 506 tests**, agent configuration.
- `frontend-build.log`: supported Webpack production build and compiled-CSS guard exit 0.
- `backend-build.log`: current mcapi build exit 0.
- Focused creation tests cover success routes, missing Filing prerequisites, permission-aware empty affordance, exclusive disclosure/input retention and Workspace/Matter remount key/payload recovery. Initial test authoring corrected a label matcher before isolating the route mismatch. The first native-details-only exclusivity assertion failed in jsdom; controlled `selected` state fixed it without loosening the assertion. No browser result is inferred from these tests.

## Live local result

Updated only the two verified Codex-owned processes after successful builds. Listener start/parent/cwd/executable checked before SIGTERM. Exact new parents/argv in `runtime.json`; observed listeners API 76416 and frontend 76417. Same database/object directory retained, no migration or seed reset. Helper: `/private/tmp/mc-creation-flow-20261029.py`. No existing DB/volume deletion, pruning, commit, push or deploy.

API health/readiness and login HTTP 200 (`http-preflight.json`). Browser became available through official CUA; normal SSO signed in. The product UI identified `cloud-synthetic-b` rather than A, so evidence is explicitly scoped to the observed B display identity, not an asserted JWT subject.

Actual browser observations: create synthetic Workspace → Matter → choose Requirement; switch to Action and back with Return without losing entered Requirement values; create Requirement → canonical rich work detail with expected independent initial states and editable next-step controls. Names appear in scope navigation and member choices. A clean screenshot is `matter-creation-choice.jpg`. New synthetic records are retained and listed in `browser-observations.json`; no membership was granted to another person.

The user subsequently elected to enter their own login; browser actions stopped and the tab was retained for handoff. That user action does not become an A verification claim.

## Remaining and exact next action

Next: user completes A sign-in; nonauthor QA reviews the refreshed candidate and executes the scoped creation journey, then browser negative/reload recovery, role isolation and accessibility checks. Remaining design work from the PM proposal includes secondary hierarchy for populated Workspaces, explicit next-step summaries, proof-to-document return context, Filing prerequisite preselection and primary/advanced Matter navigation. These are not falsely marked complete.

No current-source restore, split-role PostgreSQL grants, performance/rate-limit acceptance, full mobile/keyboard/screen-reader audit, AC-137 or release closure. Source-only PM/BA reviews are not substitutes for independent technical QA, external OpenCode acceptance or human comprehension evidence. All previous MC-002/production/cost/security gates retain their actual state.

Skipped: unrelated source refactors, new packages, provider administration, deletion and Git mutations. Remaining risk: browser proof covers one positive synthetic flow, not all failure/identity/accessibility cases; current source still needs refreshed independent technical review.
