# Addendum: fixes after the author self-review (supersedes the pins in `inputs.json`)

Actor: Claude Code (`claude-sonnet-5-5`), same author as the reviewed changes. This is author work, not an independent review. `return.md`, `inputs.json` and `checks.json` above are historical and are not rewritten; **their pins for `read-failure.tsx` and `drafts.test.tsx` no longer match the working tree.**

Base: `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`, `codex/unified-project-flow`. Nothing staged, committed or pushed.

## Findings addressed

| Finding | Action |
|---|---|
| F3 `partial` suppressed the purge for `sign-in` | Fixed. `read-failure.tsx`: `lost = sign-in || (!partial && (forbidden || not-found))`; an ended session is never a partial denial. Test written first and seen failing (1 failed / 20 passed), then passing (21/21). |
| F2 nothing pinned where `partial` is used | Fixed. New `read-failure-callers.test.ts` scans every non-test `.tsx` for `<ReadFailure … />` tags and requires exactly one `partial`, in `work/[itemId]/page.tsx`, with `subject="proof"`. Mutation-checked on the final code: `partial` added to `my-actions/page.tsx` fails the test, `partial` removed from the proof section fails the test; both files restored with identical hashes. |
| F1 whole-tab purge | **Not fixed (accepted limitation).** Needs Matter-tagged draft keys. A per-Matter namespace was considered and rejected: forms on routes outside `/matters/[id]` (for example `/requirements/[id]`) would escape a Matter-scoped purge and could revive after a re-grant, which is the security direction. |
| F4 window between the primary read and the proof read | Not fixed; inherent to two reads. |
| F5 purge runs after hydration | Not fixed; a server component cannot touch `sessionStorage`. |
| F6 revoke and re-grant with no denied screen observed | Not fixed; the client has no signal. |

## New pins (SHA-256)

| Path (under `apps/frontend/src/`) | Bytes | SHA-256 |
|---|---|---|
| `components/organisms/read-failure.tsx` | 3955 | `81d1578abd4f08fa2c53a3adfaa493c45a39b5bce4ca4b9913fa014ad3ddcc8c` |
| `components/organisms/drafts.test.tsx` | 8771 | `7d8f81497eb081d714d0e9f352adb30cbe09b122cfff011c0e534f0da6c659f1` |
| `components/organisms/read-failure-callers.test.ts` (new, untracked) | 1428 | `f7cdc92c09668438734a0f3374d74831bbcfefc13afe12cfaf81368c7230937c` |
| `app/(app)/matters/[matterId]/work/[itemId]/page.tsx` (unchanged) | 13280 | `d3c988e849715acf129571aaaedd80e2f8bdcfa8f8531df8bdad2647d14e45df` |

## Commands (cwd `apps/frontend`; logs only in the Claude scratchpad `final-hardening/fix-*`)

| Command | UTC | Exit | Result |
|---|---|---|---|
| `pnpm check` (first try) | 09:46:27-09:46:29 | 2 | typecheck failed: `read-failure-callers.test.ts(7,39) TS1501`, regex flag `s` not allowed by the tsconfig target. My defect. |
| `pnpm build` (first try) | 09:46:29-09:46:32 | 1 | same type error ("Failed to type check") |
| `pnpm check` | 09:46:54-09:47:44 | 0 | 48 files, 460/460 |
| `pnpm build` (Turbopack) | 09:47:44-09:47:48 | 0 | Compiled successfully |

The flag was dropped (`[^>]*?` already matches newlines). The two mutation checks were re-run on this final regex and still fail the test for the right reason.

## Not run / still open

webpack and Storybook builds (a shared organism changed, so they should be re-run before any receipt relies on these bytes); browser, keyboard, touch, screen reader; hosted identity; AC-137. No independent reviewer has seen these bytes; the earlier independent-review request is void for the changed files.

Status unchanged: `IN_REVIEW_WITH_VERIFICATION_BLOCKERS`.
