# MC-P0 — independent review: draft access-loss boundary

## Assignment

You are actual ZCode acting as a non-author reviewer. Review only the three
uncommitted frontend changes below in the shared checkout:

`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

Base commit: `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc` on
`codex/unified-project-flow`.

Current required hashes:

| Path | SHA-256 |
| --- | --- |
| `apps/frontend/src/components/organisms/read-failure.tsx` | `3d117ffff5e3c0646d0e592ce1110322cf508c9b96959daa8e8b4bf4cf80a37e` |
| `apps/frontend/src/components/organisms/drafts.test.tsx` | `6c77bb133ddfcd0ea82c82e5919c5a38cc7e08593c6cccfdd8844864dd8c02f5` |
| `apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx` | `d3c988e849715acf129571aaaedd80e2f8bdcfa8f8531df8bdad2647d14e45df` |
| `docs/design/p0-handoff-r9/return.md` | `d4dc769f1958f486a17a9a90fa5b1060de3172a2b07b544c6f1adff788b14b3d` |

If any pin differs, stop with `NEEDS_INPUT_REFRESH`; do not review later bytes.

## Scope

Review R8-N01/R8-N02 access-loss and form-intent behaviour only:

1. A primary `sign-in`, `forbidden`, or `not-found` read must purge a draft that
   belongs to a now-unreadable scope so re-grant does not revive it.
2. A denied proof sub-section inside a readable work-item page must preserve the
   page's draft; it is not loss of the page's access scope.
3. Verify all `ReadFailure` callers so `partial` is not accidentally used for a
   primary page denial.
4. Inspect namespace/key behaviour enough to assess Claude's declared limitation:
   a primary denial currently purges the whole tab because item keys cannot be
   reliably attributed to a Matter. Decide whether this is an acceptable
   documented availability/data-loss limitation, a security defect, or requires
   a minimal correction. Do not design a new persistence system.

The author claims `pnpm check` (47 files / 457 tests) and `pnpm build` passed on
the Claude host. Treat those as author evidence until you personally verify what
the selected review mode allows. Do not invoke hosted identity, read credentials,
run browser/E2E, commit, push, deploy, or alter source.

## Required output

First check that this output directory is absent, then write only:

`docs/testing/p0-final-parallel-20261028/review/draft-access-loss-r1/`

Create `return.md`, `inputs.json`, and `checks.json`, recording exact identity,
tool/model, reviewer mode, pins, source lines/callers, personally run commands
and exits, author evidence merely cited, finding severity/disposition, skipped
work, and residual risks.

Allowed verdicts: `PASS_SOURCE_ONLY_WITH_LIMITATIONS`, `CHANGES_REQUIRED`, or
`NEEDS_INPUT_REFRESH`. Do not self-award product acceptance, MC-002 closure,
R9 rendered acceptance, browser/IdP/AC-137 evidence, release, or Git approval.
