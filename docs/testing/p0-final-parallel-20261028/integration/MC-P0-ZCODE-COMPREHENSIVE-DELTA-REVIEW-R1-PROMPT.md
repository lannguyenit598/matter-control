# MC-P0 — independent review of comprehensive-fix candidate

## Assignment

You are actual ZCode, acting as an independent non-author reviewer. Review the
current exact candidate in:

`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

The candidate is not committed. Base commit is
`2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc` on `codex/unified-project-flow`.

Author packet:

`docs/testing/p0-final-parallel-20261028/claude-comprehensive-review-r1/`

Required manifest SHA-256:

`f596b7c64a996ab821747de652485c26ca52910b959c63a4dd215e560d5fb868`

Required delta SHA-256:

`d7a2ab12249634ecb8c4fc3b0ac666fdc5b46a38f98e0076231a9300719ca4e8`

Verify the author manifest against disk before reviewing. If any selected byte
differs, stop with `NEEDS_INPUT_REFRESH`. Do not review later bytes.

## Review scope

Review the full post-prior-review delta and its direct callers/tests only:

1. **CR-001 import preview error mapping**
   - `apps/frontend/src/features/data-transfer/actions.ts`
   - `apps/frontend/src/test/data-transfer-seam.test.ts`
   - Confirm `bad-request` at preview is truly a user-fixable invalid-sheet
     condition on the current contract/backend mapping, while ambiguous commit
     errors remain non-misleading.
   - Check the new test proves the observable UI-action result, not just an
     implementation branch.
2. **Draft/access-loss delta**
   - `apps/frontend/src/components/organisms/read-failure.tsx`
   - `apps/frontend/src/components/organisms/drafts.test.tsx`
   - `apps/frontend/src/components/organisms/read-failure-callers.test.ts`
   - `apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx`
   - Verify primary versus partial failure handling, every `ReadFailure` caller,
     re-grant non-revival and the documented whole-tab purge limitation.
3. **Redirect regression coverage only**
   - `apps/frontend/src/lib/mc/paths.test.ts`
   - `apps/frontend/src/lib/oidc/flow.test.ts`
   - Ensure the added dot-segment cases match existing safe-redirect semantics
     and do not mask a parser/security gap.
4. Reconcile CR-002 as `DECISION_REQUIRED`, not a defect that the author may
   silently waive. Do not implement it: it requires a PO choice between browser
   storage, server-side session state plus contract change, or an explicit local
   limitation.

Earlier P0 source is outside this delta review except direct context needed to
validate the above. Do not re-run an unbounded full product audit or reopen W1–W7.

## Allowed verification

Read/hash/static review first. You may run only focused deterministic tests needed
for a finding. Treat author logs in `checks.json` as cited evidence unless you
personally execute the command. Do not run browser/E2E, hosted ZITADEL, Docker,
PostgreSQL lifecycle, restore rehearsal, secret reads, source edits, commits,
pushes or deployments.

## Output

After verifying absence, write only:

`docs/testing/p0-final-parallel-20261028/review/comprehensive-delta-r1/`

Create `return.md`, `inputs.json`, `checks.json`, and `findings.json`, including
identity/tool/model, input pins, exact examined paths/lines, personally run
commands/exits, cited author evidence, finding severity/status, skipped work and
residual risks.

Verdict: `PASS_SOURCE_ONLY_WITH_LIMITATIONS`, `CHANGES_REQUIRED`, or
`NEEDS_INPUT_REFRESH`. Do not grant P0/MC-002/R9/release approval, final-byte
restore, browser/a11y/IdP/AC-137 acceptance, or resolve CR-002 without PO input.
