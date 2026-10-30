# OpenCode post-RV-001 review r1 — MC-P0 delta verification

## Identity and standing

| Field | Value |
|---|---|
| Actual reviewer | **OpenCode CLI v2.1.4**, provider `opencode`, model `glm-5.3-flash-free` (this session's configured identity; tool version observed via `opencode --version`, model self-reported as configured) |
| Mode | `INDEPENDENT_NON_AUTHOR_SOURCE_REVIEW` — reviewer is not the author of any reviewed byte; no provider/model switch; no source writes |
| Author of the candidate | Claude Code (Anthropic), `claude-sonnet-5-5` — per packet declaration; not independently verifiable beyond the packet recording |
| Review window | 2026-10-28, UTC 15:14Z–15:37Z (local +07) |
| Branch / HEAD | `codex/unified-project-flow` @ `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc` — identical at open and close |
| Worktree | dirty candidate state left untouched; reviewer wrote only this review directory |

## Verdict

**`PASS_SOURCE_ONLY_WITH_LIMITATIONS`** — RV-001 disposition **`CLOSED_SOURCE_ONLY`**.

The RV-001 fix is present, correct, and behavior-preserving on the pinned bytes; the delta signs are verified twice; the other carried items (CR-002, whole-tab purge, test-adequacy notes) are unchanged and remain open by design. Nothing passes beyond the pinned source: no browser, IdP, e2e, backend gate, storybook/webpack, AC-137, restore or release evidence was produced here. P0/MC-002 closure is explicitly **not** asserted.

## Input verification (opening and closing pins)

| Artifact | Pinned SHA-256 | Verified |
|---|---|---|
| `claude-rv001-fix/source-manifest.json` (719 entries) | `de8424ead1e9cd911c7a6fe124b48e5d67b6dcc9e519bb10a8b87453b05d4489` | open + close ✓; **719/719 member sha256+bytes match the filesystem at open AND at re-check at close — 0 missing, 0 mismatches, no source drift** |
| `claude-rv001-fix/source-delta.json` (4 modified, 0 added, 0 removed) | `38e9eb4fbd8f27ab256c404df29357176c91643bf73105f84b811b1732633b54` | ✓; all 4 candidate entries = current filesystem = candidate manifest |
| `claude-comprehensive-review-r1/source-manifest.json` | `f596b7c64a996ab821747de652485c26ca52910b959c63a4dd215e560d5fb868` | ✓ (existing artifact; head pin identical, captured 10:04:30Z) |
| `claude-comprehensive-review-r1/findings.json` (EX-03 wrong, superseded) | `f9734568cd11704eb7b5b1f97f7b0345aead8f0c0173ae0df78f4c20160f22dd` | ✓ kept immutable, not inherited |
| `review/comprehensive-delta-r1/{return.md,findings.json}` | `02498b27…`/`c822507c…` | ✓; mode `AUTHOR_SELF_REVIEW_NOT_INDEPENDENT` — **not inherited as independent**; its RV-001..006 content points were re-verified from source this round instead |

**Lineage of the delta.** The author-declared pre-fix baseline `f9cbbdf4…5595` has **no actual artifact in the repository** (the hash appears only in prose). It is recorded as **lineage unproven (OR1-005)**, per assignment the reviewer did not rebuild it. The delta itself does not rest on that declaration: computing an **independent diff between the two real artifacts** (f596b7c6 → de8424ea) yields exactly 4 modified / 0 added / 0 removed — the same four `src/lib` files with hashes identical to the packet delta — and all four delta `baseline_sha256` values equal the comprehensive manifest's entries on the same paths (entry-level lineage proven). Selection-rule reproduction (`git ls-files -co --exclude-standard` under apps/backend+frontend, with the stated exclusions) gives 722 paths vs 719 manifest entries: the 3 extras are untracked symlink *directories* under `apps/backend/.claude/skills/` (OR1-006, non-product-source).

## Scope 1 — RV-001 (verified, no new finding)

Sources read in full: `paths.ts`, `flow.ts` (+ their tests), the sink chain `work/[itemId]/page.tsx`, `login/page.tsx`, `api/auth/login/route.ts`, `api/auth/callback/route.ts`.

- **Fix mechanics.** `paths.ts:19` and `flow.ts:112` reject a *canonical* `url.pathname` starting with `//` after `new URL()` normalization, before the deny lists. Raw-input guards are intact and independent: length ≤ 2048, C0/C1/DEL controls + backslash rejected (`paths.ts:7`, `flow.ts:100`), leading-`/` and raw-`//` rejection, origin equality (probe `http://local.invalid` / caller `appOrigin`), deny lists (`/api/`, `/login` and `/api/auth/`, `/login`). Nothing is decoded a second time — `/a%2F%2Fb` stays inside one segment in both helpers ("encoded slash is kept" preserved).
- **Exploit vs lifecycle separation (confirmed).** The true exploit was the **Back-link sink**: `page.tsx:51 (?from=) → :55 safeInternalPath → :109 <Link href={from}>`, where `/..//evil.test` canonicalized to `//evil.test` and rendered as a scheme-relative href. That is closed. The **login lifecycle had four sanitize passes** (login page :33 → login route :13 → `beginLogin` stores via `safeReturnTo` at `flow.ts:137` → callback :26 `resolveReturnTo` re-runs `safeReturnTo`) and was not exploitable before the fix; the fix additionally makes a *direct, single-application* `resolveReturnTo('/..//x.test', origin)` safe, pinned by the new regression assertion `flow.test.ts:256` (resolves to `http://app.test/workspaces`). Prior `EX-03` in the comprehensive packet stays wrong and superseded.
- **Personally-run evidence.** `pnpm exec vitest run` on the five delta test files: **5 files, 124/124 pass** (includes both lib test files). Executed the **real** `paths.ts` probe beyond the test tables: fallback confirmed for `/%2f/..//evil.test`, `/.%2E//evil.test`, `/x/../%2E%2e//evil.test`, `/..//evil.test?a=1`; behavior preserved for `/a//b` (kept, prompt-required), `/matters/1/work?execution=WAITING&q=spa`, `/a%2F%2Fb`, `/a/b/../c?x=1 → /a/c?x=1`, path-with-colon `/evil.test:8080/x` (single-origin, harmless). Author T-RED (13 failed/77 passed pre-fix, red→green) is **cited, not re-run** (reproducing red would require editing source); consistent with the fix design.
- Tests cover the 6+6 protocol-relative classes (`/..//`, `/x/..//`, `/a/../..//`, `/..///`, `/%2e%2e//`, `/.//`) and the ordinary keep cases; the output check is the catch-all, so unlisted dot/encoded-dot variants funnel through the same invariant (probe confirms).

## Scope 2 — ReadFailure / draft access-loss / causal navigation (verified, notes carried)

- `read-failure.tsx:25-35`: purge exactly for `sign-in` (always) and `forbidden`/`not-found` when **not** `partial`; `unavailable`/`error` keep drafts.
- Census (executed test + manual grep): **31 `<ReadFailure` call sites in 15 non-test files, exactly one `partial`** (`work/[itemId]/page.tsx:275`, `subject="proof"`, a nested read after the primary `Promise.all` succeeded).
- `drafts.test.tsx`: keep across remount, cross-session/scope isolation, purge on denied kinds, keep on `unavailable`/`error`, partial keeps, sign-in+partial purges, and **no revival after re-grant** — all passing in the personally-run suite.
- **Whole-tab purge recorded as a documented limitation** (`draft-scope.tsx:27-29` says so in code; CR-003 in the packet): a primary denial purges drafts of *other* records in the same tab. Presented as tab-wide, not per-Matter — truthful.
- **OR1-001 (P3, open note):** the `read-failure-callers.test.ts` scan regex can't match tags with `>` inside attributes, aliased imports, or `{...props}`-passed partials — fail-open tripwire for future regressions (correct today). Carried from the previous round and independently re-confirmed; minimum fix named in findings.json.

## Scope 3 — CR-001 import-preview error mapping (verified with a note)

- Mapping present (`actions.ts:98-106`): preview `McError` `bad-request` → `{ kind: 'validation', fieldErrors: { file: [...] } }` with the message "The file could not be read. Nothing was stored." Seam test drives real fetch → `McError` → action and asserts no `console.error` — executed this round.
- **I do NOT certify the in-code claim "the only 400 … is an unreadable spreadsheet" (OR1-002).** Backend corroboration: `dataops_service.go:443-466` → `port.ErrSheetInvalid` → `problems.go:60` (urn:mc:bad-request), *and separately* `data_handlers.go` `readSheetUpload` returns `errBadRequest` for malformed multipart / missing-duplicate file part / part-open failure. The two share one code and `McError` drops the problem detail; the frontend cannot distinguish. The displayed message stays true in both cases (preview stores nothing), so the mapping is accepted with a precision note.
- Commit path (`importCommitAction` → `executeAttempt`) verified for truthful semantics: transport drop or refusal produces `outcome-unknown` (+ `retrySameKey`) or the mapped kind, **never a certain-failure claim**; no automatic resend (fetch called once, seam test); commit-catch ends the attempt **without results** (`endAttempt`, `pending-attempts.ts:69-81`), leaving it retained/unresolved and recoverable by re-executing the **same identity/key** — no key minting; `ACCESS_LOST` → `revokeAttempts` keeps a refusal marker and never revives on re-grant.

## Scope 4 — CR-002 (unchanged, DECISION_REQUIRED)

Fingerprints read directly: `intent-form.tsx:62` (key in `useState`), `:69` (frozen payload ref); `features/proof/components/document-forms.tsx:61` (same for version upload; re-mint at :83/:130). The independent two-artifact manifest diff proves **none of these files were touched** by this delta. Reload loses the attempt identity → re-submit mints a new key → duplicate creation is possible for receipted creates and version upload after an `OUTCOME_UNKNOWN`. Contract rev 12 §0 covers reload survival only for bulk/import. I did **not** choose browser persistence, a server session slot/contract change, or a waiver — those remain PO options A/B/C. Backend key-only dedupe was not re-verified beyond the contract table (unchanged limitation). Duplicate-risk scope over reload is accurately stated in the packet; nothing new found this round.

## Personally-run vs cited

- **Personally run:** manifest/delta hashing + 719-member verification twice (open/close), two-artifact diff, delta entry cross-checks, vitest 5 files 124/124, node probe on real `paths.ts`, backend/source greps and reads (data_handlers.go, dataops_service.go:443-466, problems.go, pending-attempts.ts, intent-form/document-forms pins), caller census, identity probe (`opencode --version` → v2.1.4), opening/closing HEAD + pins, dates.
- **Cited, not run:** `pnpm check` (48 files / 482 tests), `pnpm build` (Turbopack), T-RED red-state run, all backend gates/Storybook — author evidence in `claude-rv001-fix/checks.json`.
- **Not run (explicit):** Storybook/webpack build, backend gates, Playwright e2e/browser, hosted IdP, AC-137, restore rehearsal, Docker/PG, rendered work-item page (needs live session), Semble (unavailable in this session — recorded; exact packet-pinned reads used instead), Context7 (not needed; no code written).

## Remaining risks / skipped

1. OR1-002 comment precision (`actions.ts:96-97`) — the "only invalid sheet" wording must not be treated as certified; minimum fix named.
2. OR1-001 caller-scan fail-open tripwire — future misplaced partials can slip past silently.
3. OR1-005 pre-fix baseline lineage remains unproven (artifact absent) even though the delta is independently corroborated entry-for-entry.
4. OR1-006 manifest selection-rule deviation (3 symlink dir paths omitted).
5. CR-002 sits with the PO; nothing here changes it.
6. All runtime/IdP/browser/backend claims stay with the runtime owner; this review pins source+tests only. Author full-check/build numbers were not re-executed for the same bytes.
7. The comprehensive packet's wrong EX-03 entry remains in place by design (immutable), superseded by comprehensive-delta-r1 and now moot for the fixed bytes.

## Proposed next status

- Candidate `claude-rv001-fix`: `IN_REVIEW` → candidate can move to **`SOURCE_REVIEW_PASSED_WITH_LIMITATIONS`** on this evidence (non-author, independent).
- RV-001: **CLOSED_SOURCE_ONLY** (fix + regression tests verified at source/test level; no runtime evidence claimed or needed for this scope).
- CR-001: mapping verified; keep the precision note open (P3).
- CR-002: stays **DECISION_REQUIRED** for the Product Owner.
- Whole-tab purge (CR-003): stays documented limitation.
- Not affected / not closed by this review: P0, MC-002, browser/IdP/AC-137, recovery/final-byte restore, release, Git commit/push.
