# MC-P0 — final candidate hardening after Claude completion

## Assignment and boundary

You are actual Claude Code working in the existing shared checkout:

`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

This is a narrow final-source hardening pass, **not** a restart of W1–W7 and not a
new feature wave. The current candidate is the source imported at committed base
`2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`, plus three uncommitted frontend edits.
Do not reset, stash, clean, switch branch, stage, commit, push, deploy, modify
ZITADEL Cloud, open credentials, or alter provider policy. Preserve all existing
dirty and untracked governance/evidence artifacts outside your owned paths.

Read before editing:

1. Root `AGENTS.md`, `/Users/nguyenvanlan/.codex/RTK.md`, and
   `apps/frontend/AGENTS.md` plus the applicable frontend rules.
2. `docs/implementation/p0-zcode-execution/final-return.md` (the author return;
   it is not independent acceptance).
3. `docs/implementation/tasks/MC-P0-CODEX-PRIMARY-REMEDIATION-20261028.md`.
4. `docs/design/p0-handoff-r9/return.md` and its manifest.
5. This current diff only:
   - `apps/frontend/src/components/organisms/read-failure.tsx`
   - `apps/frontend/src/components/organisms/drafts.test.tsx`
   - `apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx`

Run a status and diff inventory before writing. If another writer changes source
while you work, stop, report the exact overlap and do not overwrite it.

## What is already confirmed in this candidate

The author reports W1–W7 implementation and author-level source checks. Local
Codex independently ran the new `drafts.test.tsx`: 20/20 passed, then current
`pnpm check`: 47 files / 457 tests passed. Neither result is browser, hosted-IdP,
human-study, production, release, or independent acceptance.

The three pending edits add a `partial` read-failure boundary: failure to read a
proof section inside a still-readable work-item page must not be treated as loss
of the whole page's draft scope. The unit test proves that narrow case.

## Required work

### 1. Verify and close the actual access-loss scope boundary

Trace every `ReadFailure` caller, `DraftScopeProvider` namespace/scope derivation,
and draft key format before changing code. Validate both security and data-loss
directions:

- A primary sign-in/forbidden/not-found result must not allow a draft from the
  revoked identity/workspace/matter scope to revive after a re-grant.
- A partial sub-resource denial (the proof panel is the known case) must retain
  the still-authorized page's draft.
- A primary denial for one Matter/workspace must not unnecessarily erase a
  separately scoped draft that remains authorized, unless the existing approved
  draft model makes this distinction impossible. If it is impossible, keep the
  safe existing behavior and document the limitation rather than inventing a
  broad client persistence model.

Make the smallest correct shared change only if source inspection proves a real
gap. Add a behavioural regression that would fail before the fix. Do not add a
dependency, persistent raw-file storage, token storage, or a new translation
framework.

### 2. Reconcile R9 rather than reimplement it

Confirm the above behaviour against Design R9's access-loss/form-intent rules.
Do not revisit unrelated visual polish, layout, typography, or browse-only
checks. If the current three edits fully satisfy the relevant R9 requirement,
say so with source/test references; do not manufacture a change.

### 3. Stabilize candidate evidence

Run `pnpm check` after any frontend edit. Because this includes a route and a
shared organism, run `pnpm build` in the actual Claude environment. Codex's
local build was blocked before compilation because Turbopack received OS
`Operation not permitted` while creating a process/binding a port; distinguish
that host limitation from a source failure. Do not use a workaround that exposes
a server or changes host-wide settings.

If source bytes change, write a new, additive receipt under:

`docs/testing/p0-final-parallel-20261028/integration/claude-final-hardening/`

Only create that directory after confirming it is absent. Include: exact base and
current source hashes, changed paths, commands, exit codes, test counts, and the
specific R9/requirement mapping. Do not rewrite the historic author return or
claim an independent review.

## Explicitly out of scope / still blocked

- Hosted ZITADEL login/token/audience/refresh/logout/revocation verification.
- Browser, keyboard, touch, screen-reader and visual geometry verification.
- AC-137 manager trial; it still requires five representative managers and the
  pre-registered 50-row scenario.
- New product features, Cloudflare/cost/retention/deployment/release, source
  commits and Mimosa gate disposition.

## Return format

Report actual identity/tool/model; source base/current hashes; every changed
path; requirement/design references; commands/time/exit/test counts; whether
the build ran or remained environment-blocked; skipped work; remaining risk; and
proposed status. Never call MC-002, P0, R9, browser acceptance, or release DONE
from this pass.
