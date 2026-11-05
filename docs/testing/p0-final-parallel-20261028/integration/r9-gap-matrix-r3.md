# R9 gap matrix and continuation return (r3)

Supersedes the r2 manifest, delta and review request, which were written before the partial-section fix and are void. Gate directories `-r4` are likewise superseded by `-r5`.

Actor: actual Claude Code (Sonnet 5.5, `claude-sonnet-5-5`), local CLI session, direct file edits and shell. Not OpenCode, not an independent reviewer.
Dispatch basis: `MC-P0-CLAUDE-CONTINUE-PROMPT.md` (SHA-256 `c2dde508…019a`); the pasted prompt matched it on all distinctive sentences checked, not byte-compared.
Root `AGENTS.md` still records Local Codex as sole primary writer; this continuation ran on the user's direct instruction. No competing writer was observed (manifest re-hashed before writing: 720/720 match).
Repository: `codex/unified-project-flow`, HEAD `a62d838791ba188838c4ff00b7b6e265ac775056` (does not identify the candidate; source is uncommitted).

## Source identity

| Item | Value |
|---|---|
| Pinned manifest (input) | `source-manifest.json`, 720 entries, SHA-256 `c40dc8b16a7791d6bc3cbf007d39281a775926802b0e5bbf21a212e81d13c6ec` |
| Candidate manifest | `source-manifest-r3.json`, 720 entries, SHA-256 `6bf9a3ba58635d4bb4ac0e1b016827a798979cdc67c55166cc75fbd0ff11fdf0` |
| Delta | `source-delta-r3.json`, 4 modified paths (SHA-256 `509cf512…8f61`), none added or removed |
| Drift before work | none: 720/720 byte and SHA-256 matches |
| Build-tool churn | none: webpack, Storybook, `next typegen` and `tsc` changed no manifest path |

## Changed paths

| Path | Change |
|---|---|
| `components/organisms/draft-scope.tsx` | adds client leaf `PurgeDrafts` (calls existing `clearAllDrafts()` once on mount) |
| `components/organisms/read-failure.tsx` | `ReadFailure` renders `PurgeDrafts` for `sign-in`, `forbidden`, `not-found` unless the new `partial` prop is set; state rendering moved unchanged into `ReadFailureState` |
| `app/(app)/matters/[matterId]/work/[itemId]/page.tsx` | the secondary proof-section `ReadFailure` passes `partial` (one attribute) |
| `components/organisms/drafts.test.tsx` | 8 new cases (3 purge, 2 keep on unavailable/error, 2 keep for a `partial` denial, 1 no-revival after re-grant) |

Requirement ID: R8-N01 (access-loss cleanup is a real boundary; R9 `zcode-handoff.md` §8.1). RULE-019 (traceable history) was cited in an earlier draft and does not cover draft purge; not claimed. No API, wire, migration or contract change; contract stays revision 12.

## Defect and fix

Defect: `IntentForm` dropped a draft only when its own submit failed with `unauthenticated`/`forbidden`/`not-found`. Drafts of every other form stayed in `sessionStorage` after a denied screen and reappeared after a re-grant. The `drafts.ts` header already promised "cleared on … revoked access".
Regression first, twice: the four purge/no-revival tests failed before the change (4 failed / 14 passed); the two `partial` tests failed against the first version (2 failed), which purged on a secondary denial. Final: 20/20.
Trade-off, stated: drafts are keyed by item, filing, document and Matter ids, not by Matter, so the purge is tab-wide (sessionStorage is already per tab) rather than a guess at which keys belonged to the lost scope. A user denied on one Matter loses unsent drafts in that tab for other Matters. Fail-closed by choice; a per-Matter index would be the upgrade if that proves costly.
`not-found` also appears for a mistyped record inside an accessible Matter, so that case purges too.
Not covered: no signal path exists for access loss that is detected without a denied screen (for example a mid-session membership change noticed only on a later server read). Such a change is caught at the next denied read or failed submit.

## R9 rows checked (sampled, not exhaustive)

| Row | Verdict | Evidence |
|---|---|---|
| R8-N01 purge on access loss, bulk/import slots | PRESENT | `pending-attempts.ts` `revokeAttempts`, `pending-attempts.test.ts` |
| R8-N01 purge of form drafts on access loss | WAS MISSING, now PRESENT | this change; `drafts.test.tsx` |
| R8-N01 purge on sign-out | PRESENT | `sign-out-form.tsx` `clearAllDrafts()` |
| R8-N01 no purge on OWNER to VIEWER downgrade | PRESENT, verified by classification | all 17 `ReadFailure` call sites were classified: 16 are primary route reads that replace the page (so no form shares the page and the restore-then-purge ordering hazard cannot occur); 1 (`work/[itemId]/page.tsx` proof section) is a secondary read and now passes `partial`. Tests: `keeps drafts when a %s section sits inside a page the user can still read`. No end-to-end downgrade test. |
| R8-N02 draft survives view change and locale switch | PRESENT | remount: `drafts.test.tsx` (keeps what was typed across a remount); locale switch: `localized-instant.test.tsx` `switches labels and display zone without resetting mounted drafts…` (mounted drafts, not sessionStorage) |
| R8-N02 per-document isolation | PRESENT | namespace + scope key test in `drafts.test.tsx` |
| R8-N03 distinct promotion target and expected-current guard | PRESENT | contract §2.4 now defines `POST …/documents/{docId}/promotion`; `PromoteForm` sends `targetVersionId` and `expectedCurrentVersionId` separately; `proof-ui.test.tsx`. R9's DEPENDENCY_PENDING was true at contract revision 6 and is stale. |
| `409 urn:mc:rejected` handling | PRESENT | `errors.ts` `McRejection`, `client.ts`, `action-result.ts`, `IntentForm` `renderRejection` |
| Read-failure states per route | PRESENT on 15 of 16 pages; `matters/[matterId]/data/page.tsx` has no server read and is gated client-side by `RecoveryGate`, which renders forms only after an authorized recovery read succeeds (fail-closed). |
| Data route denial wording | PARTIAL, not changed | a denied recovery read shows the generic "Recovery unavailable" alert, not the distinct forbidden/not-found state R9 specifies for SCR-10/11/12. Left as a follow-up; no safety effect found. |
| Remaining SCR-01..13 state grids (9 states each) | NOT_AUDITED | no route-by-route state comparison beyond the rows above was performed |
| Rendered layout, keyboard, touch, screen reader | NOT_RUN | no browser capability |

Pre-existing oddity, not touched: `apps/frontend/src/features/data-transfer/components/data-transfer-ui.test.tsx.orig` is a stray file already in the pinned manifest.

## Commands (cwd `apps/frontend`, wrapper records argv/time/exit in each `command.json`)

| Gate | Directory under `gates/` | Exit | Result |
|---|---|---|---|
| `pnpm check` (typecheck, eslint, prettier, vitest, agents:check) | `frontend-check-r5` | 0 | 47 files / 457 tests passed |
| `pnpm exec next build --webpack` | `frontend-webpack-r5` | 0 | compiled successfully |
| `pnpm build-storybook` | `frontend-storybook-r5` | 0 | build completed |

Earlier runs (`-r4`, 455 tests; one unrecorded run outside the evidence tree) are superseded by `-r5`.
Backend: untouched, so `make sqlc-check`, gofmt, tidy, lint and race tests were not re-run. The race and PostgreSQL gates need the loopback fixture DSN (credential); not supplied, so those gates stay bound to the earlier `backend-*` evidence and not to these bytes except that no backend path changed.
DB/resource disposition: none created, changed or removed. No credentials, key files or `ops/p0-local/secrets/**` were opened.

## Not done from the prompt

- Step 3 W6/W7 propagation: no genuine gap found by sampling, so no backend change; this is a sampling statement, not a clean bill.
- Step 4 localization: no new static chrome was added; existing EN/VI coverage was not re-audited.
- Browser, IdP, Cloud token cases, final-source restore rehearsal, AC-137 and accessibility: NOT_RUN or BLOCKED as before.
- Independent review: pending (see `review-request-r3.md`).

## Remaining risk

Tab-wide purge breadth; the audit covers a sample of R9 rows, not all 13 screens; the final-byte restore and the internal nonauthor review of the earlier GlobalError fix are still open.
