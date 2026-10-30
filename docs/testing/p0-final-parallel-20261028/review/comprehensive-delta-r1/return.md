# Comprehensive-fix candidate: delta review return

> **AUTHOR SELF-REVIEW. NOT an independent review. It does not satisfy the independent-review gate.**
> The assignment asked for "actual ZCode, independent non-author reviewer". The actual reviewer is Claude Code, which wrote every change under review. On the earlier draft-access-loss review the user chose author self-review after being told of the same mismatch; that precedent is applied here and was disclosed at the start of the task. A real independent reviewer is still needed.

| Field | Value |
|---|---|
| Identity / tool / model | Claude Code (Anthropic), `claude-sonnet-5-5`, local CLI |
| Mode | `AUTHOR_SELF_REVIEW_NOT_INDEPENDENT` |
| Formal verdict | none (withheld; see above) |
| Author assessment | **`CHANGES_REQUIRED`** (RV-001, an open-redirect output defect) |
| Base / HEAD | `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`, `codex/unified-project-flow`, nothing committed |
| Manifest pin | `f596b7c6…b868` matches disk; 719/719 entries verified, 0 missing, 0 mismatch |
| Delta pin | `d7a2ab12…a4e8` matches disk |

## Findings

| ID | Sev | Status | Summary |
|---|---|---|---|
| **RV-001** | **P2** | **OPEN, changes required** | `safeInternalPath` returns `//evil.test` for `/..//evil.test`; the work-item page renders it as the "Back" link |
| RV-002 | P3 | accepted with note | CR-001: `bad-request` at preview is mostly a fixable sheet, but also a multipart fault; comment overclaims |
| RV-003 | P3 | note | Seam test proves the action result; no component test renders a failed preview |
| RV-004 | P3 | note | The `ReadFailure` placement guard can miss a tag containing `>` or a spread |
| RV-005 | INFO | verified | Primary versus partial handling, re-grant, and the whole-tab limitation |
| RV-006 | INFO | confirmed | CR-002 remains `DECISION_REQUIRED` |

### RV-001 (the blocker)
- **Executed evidence (V4, real `paths.ts`):** `/..//evil.test`, `/x/..//evil.test`, `/%2e%2e//evil.test` and `/a/../..//evil.test` all return `//evil.test`; `/..///evil.test` returns `///evil.test`.
- **Cause:** the `startsWith('//')` guard checks the raw input; `new URL()` then resolves `..` and leaves a pathname beginning with `//`, which is returned unchecked (`paths.ts:17`).
- **Exposure:** `work/[itemId]/page.tsx:55` feeds `?from=` into it and `:109` renders `<Link href={from}>`. A signed-in user following a crafted link and clicking Back leaves the site. The page needs a session, so I did not render it; the claim rests on the executed function plus the code path.
- **Login path:** `safeReturnTo` (`flow.ts:96-113`) has the same defect (V5, a verbatim replica because the module will not load in strip-only mode), but `beginLogin`, the login route and `resolveReturnTo` re-validate, and the second pass rejects `//evil.test` (the callback resolves to `/workspaces`). That is defense in depth, not a fix.
- **Relation to the delta:** pre-existing code, not introduced by the delta. The added dot-segment tests pass but cover only `/x/../login`-style input, so they give false assurance about the output, and the author packet entry **EX-03 ("redirect safety: no finding") is wrong**; this finding supersedes it.
- **Minimal fix (not applied; edits are outside this review mode):** in both functions reject any output starting with `//` or `/\` and return the fallback; add `/..//evil.test`, `/x/..//evil.test`, `/%2e%2e//evil.test`, `/..///evil.test` to both tests, red before the fix.

### Other scope items
1. **CR-001 / import preview (RV-002, RV-003).** The mapping is right for the main cases: the backend deliberately turns `ErrSheetInvalid` (byte limit, decode error, empty sheet, missing column, row limit; `dataops_service.go:443-466`) into `400 bad-request` with a fixable message. But `readSheetUpload` (`data_handlers.go:141,147,151`) also returns `bad-request` for a malformed or incomplete multipart, and `McError` drops the problem detail, so the two are indistinguishable. The comment "only" overclaims; the message shown stays true because preview writes nothing. The new test drives fetch to `McError` to the action result, so it proves the observable action result and not a branch; nothing renders a failed preview. Commit errors are unchanged and generic; a 400 there leaves the attempt retained and unresolved (`actions.ts:166`, `pending-attempts.ts:70-81`), which is pre-existing.
2. **Draft / access loss (RV-005, RV-004).** Verified: `sign-in` always purges, `forbidden`/`not-found` purge unless `partial`; 31 call sites in 15 files, exactly one `partial` (`page.tsx:275`, a nested proof read after the primary reads succeeded); re-grant non-revival is tested; the whole-tab purge is documented, not presented as per-Matter. The placement guard is correct today but fail-open for odd tag shapes (V6).
3. **Redirect coverage.** The two added cases are correct and pass, but they do not exercise the real gap (RV-001).
4. **CR-002.** Confirmed as `DECISION_REQUIRED`, not waived and not implemented: `intent-form.tsx:62,69`, `document-forms.tsx:61`; contract rev 12 §0 covers only bulk/import; `zcode-handoff.md:95`. Needs a Product Owner choice among browser storage, a server-side slot with a contract revision, or an explicit local limitation. That creation commands dedupe by key only was not verified beyond the contract table.

## Commands I ran (see `checks.json`)
Manifest and delta verification, `git rev-parse`; focused `vitest` on the five delta test files (5 files, 107/107, exit 0); executed the real `safeInternalPath`; a replica of `safeReturnTo`/`resolveReturnTo`; a regex probe; static greps. Probe scripts live in the Claude scratchpad.

## Author evidence cited, not re-run
`pnpm check` (48 files / 465 tests), `pnpm build`, Storybook, all backend gates and tests (586 pass / 144 skip without a DB; 765 pass / 4 skip against isolated PostgreSQL), restore checker (9 tests), the params-encoding probe. No Docker, PostgreSQL, browser, hosted identity, restore rehearsal, secret read or source edit in this review.

## Residual risk and next step
RV-001 is open and should be fixed before anything relies on these bytes; fixing it changes the manifest, so the candidate needs a new pin and review. The earlier limitations stand: CR-002 undecided, whole-tab purge, no browser/IdP/AC-137/final-byte restore evidence, and no independent reviewer yet. Proposed status stays `IN_REVIEW_WITH_VERIFICATION_BLOCKERS`. Nothing here approves P0, MC-002, R9, a release or any Git action.
