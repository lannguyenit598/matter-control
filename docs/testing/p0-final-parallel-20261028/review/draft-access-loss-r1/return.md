# Draft access-loss boundary: review return (R8-N01 / R8-N02)

> **This is an AUTHOR SELF-REVIEW. It is NOT an independent review and does NOT satisfy the independent-review gate.**
> The assignment asked for "actual ZCode, non-author reviewer". The actual reviewer is Claude Code, which authored all three reviewed changes. The user was told this and chose author self-review. Identity and independence are not negotiable here, so the formal verdict is withheld.

| Field | Value |
|---|---|
| Actual identity | Claude Code (Anthropic), model `claude-sonnet-5-5`, local CLI session |
| Requested identity | actual ZCode, non-author |
| Reviewer mode | `AUTHOR_SELF_REVIEW_NOT_INDEPENDENT` |
| Formal verdict | **none** (`independent_review_gate_satisfied: false`) |
| Author assessment (informational) | would be `PASS_SOURCE_ONLY_WITH_LIMITATIONS` |
| Base | `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`, `codex/unified-project-flow` |
| Pins | 4/4 match, verified before and after the checks (`inputs.json`) |

Do not read the assessment as ZCode, OpenCode or any other non-author PASS. A real independent pass is still required.

## What was reviewed

Source lines (current pins):

- `read-failure.tsx:16-20` adds `partial?: boolean`; `:24-28` sets `lost = !partial && (sign-in | forbidden | not-found)` and renders `PurgeDrafts` only when `lost`.
- `draft-scope.tsx` `PurgeDrafts` (committed in the base) calls `clearAllDrafts()` once on mount.
- `work/[itemId]/page.tsx:275` is the only caller passing `partial`.
- `drafts.test.tsx:207-215` adds the two `partial` cases; earlier cases cover purge for the three kinds, keep for `unavailable`/`error`, and no revival after re-grant.

## Questions asked

1. **Primary denial purges, so a re-grant cannot revive the draft.** Yes, for every denial the client sees. A primary `sign-in`/`forbidden`/`not-found` renders `PurgeDrafts`, which clears every `mc:draft:` key in the tab. Primary reads return in place of the page (no form shares the page, so no restore-then-purge ordering hazard). `MatterScope` (the `matters/[matterId]` layout) also returns `ReadFailure` instead of children.
2. **A denied proof section keeps the page's draft.** Yes. The proof read is an `attempt` nested after the primary `Promise.all` (record, Matter, members, workstreams, parties, list) has succeeded (`page.tsx:59-88`), so the page's scope has just been confirmed readable.
3. **No primary denial is marked `partial`.** Confirmed by enumeration: 31 `<ReadFailure` call sites in 15 files; exactly 1 has `partial` (`page.tsx:275`); the other 30 are primary.
4. **Tab-wide purge: acceptable limitation, not a security defect, no minimal correction required.** Reasons:
   - The namespace is `sha256("mc-draft:" + sessionHandle)[:24]` (`auth-provider.ts`): session-scoped only, no workspace or Matter dimension.
   - Keys carry entity ids (`matter:`, `item:`, `filing:`, `document:`, `evidence:`, `claim:` …); only `matter:<id>:` keys carry a Matter id.
   - `not-found` is indistinguishable from "hidden" by contract. A Matter-prefix purge would leave `item:`/`filing:` drafts of a revoked scope revivable. That is the security direction, so the broad purge is the safe choice.
   - The cost is availability: a primary denial (including a genuinely missing record in an accessible Matter) discards unsent drafts in that tab.
   - Upgrade path (out of scope): add the Matter id to the `draftKey` of roughly 30 forms and purge by prefix.

## Findings

| # | Severity | Finding | Disposition |
|---|---|---|---|
| F1 | LOW (availability) | Whole-tab purge also fires for a `not-found` on a record inside an accessible Matter, because the layout's Matter read already succeeded but the page cannot say so. Unrelated unsent drafts in that tab are lost. | Accepted, documented limitation. |
| F2 | LOW (test gap) | No test asserts which call sites pass `partial`. Dropping it from `page.tsx:275` over-purges (data loss); adding it to a primary site under-purges (security direction). Neither would fail a unit test. | Recommend a guard (for example a small route-level test or a lint rule). Not required for this change. |
| F3 | INFO | `partial` also suppresses the purge for `sign-in`. Hygiene only: a fresh sign-in always mints a new random handle (`session-store.ts:43` `newHandle()` = `randomBytes(32)`, sole caller `api/auth/callback/route.ts:25`), so the old namespace cannot load. Mounted forms would re-save on the next keystroke, so purging there would not help. | No change. |
| F4 | INFO | A narrow window exists between the primary `Promise.all` and the nested proof read. Access lost inside it yields a `partial` denial that keeps drafts for that render; the next navigation shows a primary denial and purges. | Accepted. |
| F5 | INFO | The purge runs in `useEffect` after hydration, not before the denied screen paints. The denied screen renders no draft fields, so nothing is exposed. If hydration fails at that moment the purge does not run and a later re-grant could restore a draft. | Accepted, very narrow. |
| F6 | INFO | If access is revoked and re-granted without the user ever seeing a denied screen (and without sign-out), the draft revives. No client signal exists for that case. | Documented limit of a client-only draft store. |

No finding blocks the change. No security defect found in the reviewed scope.

## R9 reconciliation

- R9 §8.1 (cleanup on real access loss; none on a downgrade that keeps read access): satisfied for observed denials; a downgrade renders no `sign-in`/`forbidden`/`not-found` primary screen. No end-to-end downgrade test exists.
- R9 §8.2 (form intent survives view change and locale switch, scoped per document): untouched by these edits. Covered by `drafts.test.tsx` (remount, key namespacing) and `localized-instant.test.tsx:22` (mounted drafts across a locale switch). Not re-run beyond the full `pnpm check`.
- R9 wording "before showing the denied screen" is met in effect, not in timing (see F5).

## Commands personally run (details in `checks.json`)

| Command | Exit | Result |
|---|---|---|
| pin hashes, `git rev-parse HEAD`, `git diff -U0`, caller enumeration | 0 | as above |
| `vitest run src/components/organisms/drafts.test.tsx` | 0 | 1 file, 20/20 |
| `pnpm check` | 0 | 47 files, 457/457 |

Logs live only in the Claude scratchpad (`.../scratchpad/final-hardening/review-*`), not in the repo.

## Author evidence cited, not re-verified

- `pnpm build` (Turbopack) exit 0 at 2026-10-28T09:32:12Z-09:32:19Z.
- webpack and Storybook builds (`frontend-webpack-r5`, `frontend-storybook-r5`).
- Red-then-green run of the `partial` tests.

## Skipped

`pnpm build` and Storybook in this review; any change to source (so no mutation test of the guard); browser, keyboard, touch, screen reader; hosted identity; AC-137; Git actions.

## Residual risk

Whole-tab purge breadth (F1); no guard against a wrong `partial` placement (F2); revival without an observed denial (F6); and, above all, no independent reviewer has yet looked at these bytes. `global-error.tsx` also still lacks a final-byte verdict.

## Proposed status

`IN_REVIEW_WITH_VERIFICATION_BLOCKERS`. Independent review pending. Nothing here is product acceptance, MC-002 closure, R9 rendered acceptance, browser/IdP/AC-137 evidence, release or Git approval.
