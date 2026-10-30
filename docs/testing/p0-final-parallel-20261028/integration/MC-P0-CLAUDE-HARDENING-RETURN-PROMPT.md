# MC-P0 — close the hardening return only

## Why this follow-up exists

The shared working tree still contains only these three uncommitted frontend
changes, and no `claude-final-hardening/` receipt exists yet:

1. `apps/frontend/src/components/organisms/read-failure.tsx`
2. `apps/frontend/src/components/organisms/drafts.test.tsx`
3. `apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx`

The prior OpenCode `PASS_WITH_LIMITATIONS` review binds an earlier 714-file
candidate. It cannot be extended to these later bytes without a new exact
handover and independent review. This follow-up closes that evidence gap only.

## Assignment

You are actual Claude Code in:

`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

Read the root and frontend instructions, the existing
`MC-P0-CLAUDE-FINAL-CANDIDATE-HARDENING-PROMPT.md`, the three-file diff, and the
Design R9 access-loss requirement. Do not restart product implementation;
do not reset, stash, clean, switch branch, stage, commit, push, deploy, change
ZITADEL Cloud, read credentials, or rewrite historical evidence.

### Required decision

1. Confirm from the actual draft key/namespace model whether the three-file
   implementation has both properties:
   - a primary denied page cannot revive its old draft after re-grant;
   - a denied proof sub-section cannot purge a draft belonging to the still
     readable work-item page.
2. Check whether it also incorrectly deletes an unrelated still-authorized
   Matter/workspace draft. If it does, make the **smallest** scope-aware shared
   correction plus an ordinary user-visible regression. If the current model
   cannot distinguish scopes safely, retain the fail-safe behaviour and explain
   the explicit limitation; do not add a persistence system or store legal
   data/tokens in the browser.
3. Run `pnpm check`. Run `pnpm build` in the actual Claude environment. If the
   host blocks Next/Turbopack process/port creation, record the full error and
   label the build `ENVIRONMENT_BLOCKED`, not source-failed and not passed.

## Required additive output

After confirming the directory is absent, write only under:

`docs/testing/p0-final-parallel-20261028/integration/claude-final-hardening/`

Create `return.md`, `inputs.json`, and `checks.json` with current source hashes,
the exact diff paths, Design R9 mapping, actual commands/exits/test counts, build
result, skipped work, and remaining risks. Do not label this independent review,
P0 DONE, MC-002 DONE, browser acceptance, IdP acceptance, or release approval.

Return your identity/tool/model and the hashes of these three output files.
