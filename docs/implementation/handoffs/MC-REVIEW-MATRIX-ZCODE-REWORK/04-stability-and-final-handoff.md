# Step04 — diagnose timing failures and deliver the corrected candidate

Read COMMON.md and all three source/test checkpoints. Finish the work; do not merely list the fixes as plans. Own only affected test/harness paths and minimal confirmed root-cause changes. Do not broaden into shell design, dependency upgrades or unrelated feature work.

## Diagnose the observed failures

Read the exact original logs:

- `docs/testing/codex-review-matrix-verification-20261029-r1/frontend-check.log`: upload-attempt “a different file is a different intent and gets a new key” timed out at5000ms; 691pass/1fail.
- `frontend-targeted.log`: create-grid UNKNOWN retry did not make its second mocked call before waitFor timed out; 42pass/1fail. Separate file4/4 and later targeted43/43 passed; all remain valid observations.
- `adversarial-ui-r3.log`: deterministic command-fidelity/access-loss failures are separate from timing failures; fixes from01 must pass these unchanged behavioral requirements.

Identify whether the timing failure is a genuine UI scheduling/state bug, a click while the button is still pending/disabled, uncontrolled test resources/fake timers/module state, or a worker/load constraint. Trace actual mocks, pending completion and DOM state. Correct the smallest real cause using existing test patterns. Do not delete assertions, skip tests, extend5s/15s arbitrarily, force single-worker execution merely to hide a race, or call a green rerun proof that it vanished. A justified harness/config change must explain the cause and retain concurrency/UNKNOWN coverage.

Bound diagnosis: one focused reproducer and an explained comparison of isolated versus suite conditions; run a small recorded repeat set only when testing the proposed cause. Stop repetitions once evidence is decisive. If still unexplained, retain exact failures and mark the full gate unresolved instead of spending indefinitely rerunning. Do not block independent corrected source delivery solely on an unproven timing explanation.

## Final gates after source settles

1. Verify all RMV-F01..04 regression cases, including missing/null expectation with ACL precedence, complete UNKNOWN intent after props/remount, protected whole-surface purge and complete bounded history traversal. Any still failing finding remains open, not “partially closed” by happy-path results.
2. Backend `make check` with the new owned synthetic fixture; targeted review suites; affected shared memory/PG contracts; relevant concurrency/state/Unicode regressions. SQL changes require generation and sqlc-check; no handwritten generated edits. Record exact counts/skips (counts may change from634; do not chase a historical count).
3. Frontend `pnpm check`, review/matters targeted tests, affected shared IntentForm/draft/proof/Data tests, required Storybook checks if shared components changed, and both production build engines with CSS guard in safe private output. No active `.next` writes. If direct installed commands are needed because pnpm wants an unauthorized install, record literal commands and that distinction honestly.
4. After final tests, hash actual corrected bytes/lengths and compare against intake. A later edit invalidates affected checks; do not certify mutable current source using an earlier manifest.

## Rendered/operator checks

The previous verifier did **not** perform an authenticated browser journey; API200 health/ready is not proof of any feature or fix. Use only the permitted human-assisted, synthetic, runtime-owner-approved context. Do not restart the owner's API to force verification. If corrected backend uptake requires lifecycle/config not assigned to ZCode, provide a sanitized build/launch handoff for the runtime owner and mark live uptake blocked.

Prepare or execute, as authorized:

- OWNER/EDITOR records answer; VIEWER can read and sees no write controls.
- While a cell/grid/history is open, controlled loss of membership causes the next authoritative denial and the protected surface/drafts disappear; no unrelated user/resource affected.
- A controlled lost response with possible commit followed by refreshed props/ordinary navigation reconciles the original key/payload; no fresh-key replay or second effect. Use an existing supported test fault seam, not a destructive shared-runtime outage.
- More than100 synthetic answers in a disposable owned test context: older answers reachable, no duplicate/missing rows, exact old wording/citations, Back/filter context preserved; do not pollute retained data to fabricate this proof.
- Keyboard/focus/error announcements and visible selected/partial/loading/end state at desktop/390px/320px, EN/VI for touched strings. No legal data, tokens or cookies in screenshots.

If login/browser/owned context is unavailable, leave a precise operator procedure and mark each affected check NOT_RUN/BLOCKED. Do not downgrade an author-verified test into a false browser PASS, change IdP policy, provision users or obtain tokens by copying another session.

## Consolidated final return

In the same new ZCode evidence namespace produce:

- `return.md`: actual identity/tool, repo/branch/intake/final HEAD, one row per RMV finding with exact fix/test/limit, changed paths and scope, test commands/cwd/UTC/version/exit/pass/fail/skip counts, every failed/interrupted run, timing diagnosis, runtime disposition and remaining risk.
- Before/final source SHA-256/bytes manifest and diff, plus generated SQL delta where relevant; noncircular evidence index. Preserve original Claude/Codex packets and dirty work.
- `contract-delta.md`: explicit expectation-presence and bounded history continuation behavior/compatibility; no business-role/state changes.
- `runtime-handoff.md`: safe actual URL/build identity if observed; which owner must perform any pending binary uptake or browser test. No secret values or broad process-kill instructions.
- `proposed-status-delta.md`: IN_REVIEW when all assigned author gates pass, otherwise IN_REVIEW_WITH_VERIFICATION_BLOCKERS with exact open items. The original task is not DONE and no independent acceptance/release is awarded.
- Owned PG/container/volume cleanup evidence after label checks, privacy scan over new outputs and completion verification on final source pins.

Next exact action: Codex/non-author verifier reviews the corrected source/delta and reruns the affected adversarial cases. If ZCode changes any test/code, ZCode does not independently approve those bytes. Do not start playbooks/intake/knowledge/AI or answer D2–D9 as part of closing this task.

End with what was skipped and remaining risk. No commit/push/merge/deploy, real R2/provider operation, retained-data migration/rollback or external-agent dispatch.
