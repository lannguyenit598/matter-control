# MC-P0 comprehensive source review and fix pass: return

**Actor:** Claude Code (Anthropic), model `claude-sonnet-5-5`, local CLI session. Author of the fixes below. This is not an independent review.
**Branch / HEAD:** `codex/unified-project-flow` at `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`. Nothing staged, committed or pushed.
**Proposed status:** `IN_REVIEW_WITH_VERIFICATION_BLOCKERS`. No `DONE`, release, production, MC-002, browser/a11y, ZITADEL login, Cloudflare/cost or AC-137 result is claimed.

## Source identity

| Item | Value |
|---|---|
| Candidate at start | HEAD + 4 uncommitted frontend files: `read-failure.tsx`, `drafts.test.tsx`, `work/[itemId]/page.tsx` (modified) and `read-failure-callers.test.ts` (untracked; the assignment text names three) |
| Selection rule | `git ls-files -co --exclude-standard` under `apps/backend` and `apps/frontend`, minus `node_modules`, `.next`, `storybook-static`, `*.tsbuildinfo`, `next-env.d.ts`, `.env.local` |
| Entries | 719 before, 719 after; 4 modified, 0 added, 0 removed |
| Post-fix manifest | `source-manifest.json`, SHA-256 `f596b7c64a996ab821747de652485c26ca52910b959c63a4dd215e560d5fb868` |
| Delta of this pass | `source-delta.json`, SHA-256 `d7a2ab12249634ecb8c4fc3b0ac666fdc5b46a38f98e0076231a9300719ca4e8` |
| Backend bytes changed | none |

The previous review (`review/return.md`, `PASS_WITH_LIMITATIONS`) pins an older manifest; it was used as context, not as a pin of current bytes.

## Findings

| ID | Sev | Status | Summary |
|---|---|---|---|
| CR-001 | P2 | **FIXED** | An unreadable spreadsheet showed "Something went wrong" instead of a fixable file error |
| CR-002 | P2 | **DECISION_REQUIRED** | Same-key retry after `OUTCOME_UNKNOWN` does not survive a reload for `IntentForm` creates and version upload |
| CR-003 | P3 | LIMITATION | A primary denial purges every draft in the tab |
| CR-004 | INFO | CLOSED | Prior F1, legacy Filing revision: guard at `brief_replay.go:193-195`, named test passes |
| CR-005 | INFO | no defect | Prior F2, id encoding: Next passes params percent-encoded, so adding `encodeURIComponent` would double-encode; advisory not applied |
| CR-006 | INFO | not a defect | `document-forms.tsx` `fetch()` goes to the same-origin BFF route for a binary upload |

### CR-001 (fixed)
- **Reference:** contract rev 12 §2.7 and §3 problem codes; R9 error presentation (a state, not a generic fault).
- **Cause:** backend maps `port.ErrSheetInvalid` to `400 urn:mc:bad-request` with a fixable message (`problems.go:60-61`, `data_server_test.go`). `importPreviewAction` sent every error to `toMcFailure`, whose default branch logs `console.error` and returns `kind: 'error'`.
- **Fix:** `importPreviewAction` returns `kind: 'validation'` with `fieldErrors.file` for `bad-request`. `importCommitAction` is left alone: it re-sends a file that already previewed, so a 400 there is ambiguous.
- **Regression:** `data-transfer-seam.test.ts` "an unreadable spreadsheet at the import seam": red before (1 failed / 10 passed, `kind: "error"`), 11/11 after.

### CR-002 (decision required, not guessed)
`IntentForm` keeps the key in `useState` and the frozen payload in a ref (`intent-form.tsx:62,69`); `UploadVersionForm` keeps its key in `useState`. After a reload the draft restores field values but a new key is minted, so a re-submit after a lost answer can create a duplicate (the backend dedupes by key only). Contract rev 12 §0 promises reload survival only for bulk/import; R9 handoff §4 says a retry under a new key is disabled, which the client can enforce only while it still holds the attempt. Options: (A) persist `{key, payload}` beside the draft in `sessionStorage` (conflicts with the no-browser-persistence-of-legal-payload principle); (B) extend the BFF session slot to these commands (new server state, contract revision); (C) accept as a local-profile limitation.

### CR-005 (evidence)
A loopback probe showed `GET /matters/a%2Fb/history` rendering `returnTo=%2Fmatters%2Fa%25252Fb`, i.e. `matterId` is `a%2Fb`. For allowlisted ids (`[A-Za-z0-9_-]`) encoding is a no-op; any other id stops at `pathId` with `not-found`.

## Changed paths (this pass)

| Path | Change |
|---|---|
| `apps/frontend/src/features/data-transfer/actions.ts` | CR-001 fix |
| `apps/frontend/src/test/data-transfer-seam.test.ts` | CR-001 regression |
| `apps/frontend/src/lib/mc/paths.test.ts` | 2 dot-segment cases (coverage only) |
| `apps/frontend/src/lib/oidc/flow.test.ts` | 2 dot-segment cases (coverage only) |

## Checks (full detail in `checks.json`)

| Gate | Exit | Result |
|---|---|---|
| `make sqlc-check`, gofmt, `go mod tidy -diff`, `golangci-lint run ./...` | 0 | clean |
| `go test -race -count=1 ./...`, no database | 0 | 586 pass / 144 skip (PostgreSQL suites) / 0 fail |
| same, against isolated `*_test` databases | 0 | 765 pass / 4 skip / 0 fail |
| `pnpm check` | 0 | 48 files, 465/465 |
| `pnpm build` (Turbopack) | 0 | compiled |
| `pnpm build-storybook` | 0 | completed |
| restore checker `unittest`, `bash -n run.sh` | 0 | 9 tests OK |

Two gate runs failed before the final ones (`pnpm check` exit 2 and `pnpm build` exit 1): a TS2339 type error in my own new test, fixed in the test. A first restore-test attempt with `python3 -I` failed to import (isolated mode drops the cwd); a harness error, not a product failure.

## PostgreSQL fixture disposition
Used the existing container `mc-p0-claude-pg` (label `mc.task=MC-P0-CLAUDE-TAKEOVER`, no `mc.role` label) and only its `mc_p0_native_test` and `mc_p0_product_test` databases; `pgtest` isolates each test in a `t_*` schema it drops (0 left behind). The `zcode`-labelled fixtures were not used (no credentials available to this session). The container had been stopped at the user's request; it was started for this pass and stopped again. DSNs were built by an out-of-repo launcher from the local secret file under the earlier authorization for that container; nothing was printed and the logs were scanned for the secret (none found). No DB, volume or credential was created or changed.

## Skipped / not examined
See `findings.json` `not_examined`: per-handler authorization ordering by reading, the role matrix, import atomicity and epoch/filing guards by reading (relied on passing suites), a11y/locale rendering beyond tests, webpack build and e2e on final bytes, later-wave receipted mapping, browser/keyboard/touch/screen reader, hosted ZITADEL, AC-137, final-byte restore rehearsal, Cloudflare/cost.

## Remaining risk
CR-002 (duplicate on reload) and CR-003 (tab-wide purge); the route scan left 17 code routes unmatched to literal contract text (health probes and shorthand-documented routes), so catalogue parity is not claimed; no independent reviewer has seen these bytes.

## Requested next step
Independent review of exactly `source-manifest.json` (`f596b7c6…b868`), covering the 4 paths in `source-delta.json` plus the 4 carried draft/access-loss files. Please decide CR-002 (A, B or C). Also pending from earlier: a final-byte restore rehearsal and a `global-error.tsx` verdict.
