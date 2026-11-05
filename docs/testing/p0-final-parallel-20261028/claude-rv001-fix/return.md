# RV-001 fix: normalized protocol-relative redirects

**Actor:** Claude Code (Anthropic), model `claude-sonnet-5-5`, local CLI session. Author of this fix. This is not an independent review.
**Branch / HEAD:** `codex/unified-project-flow` at `2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`; nothing staged, committed or pushed.
**Proposed status:** `IN_REVIEW_WITH_VERIFICATION_BLOCKERS`. No claim of independent review, P0/MC-002 closure, browser or IdP verification, release or production readiness.

## Source identity

| Item | Value |
|---|---|
| Pre-fix manifest (same selection rule as `claude-comprehensive-review-r1`) | SHA-256 `f9cbbdf496d975d08530552828e48a838535189f92248e510f031f1dacc7d595` (also in `inputs.json`); 719 entries |
| Post-fix manifest | `source-manifest.json`, SHA-256 `de8424ead1e9cd911c7a6fe124b48e5d67b6dcc9e519bb10a8b87453b05d4489`, 719 entries |
| Delta | `source-delta.json`, SHA-256 `38e9eb4fbd8f27ab256c404df29357176c91643bf73105f84b811b1732633b54`; 4 modified, 0 added, 0 removed |

## Changed files (all `apps/frontend/src/lib/`)

| Path | Change |
|---|---|
| `mc/paths.ts` | `safeInternalPath` refuses a canonical pathname that starts with `//` |
| `oidc/flow.ts` | `safeReturnTo` refuses the same canonical form |
| `mc/paths.test.ts` | 6 protocol-relative payloads added to the fallback list; 3 ordinary and dot-segment cases added to the keep list |
| `oidc/flow.test.ts` | 6 payloads added to the `safeReturnTo` fallback table; 2 keep cases; 3 payloads and an explicit `resolveReturnTo('/..//x.test')` expectation in the origin test |

## Boundary and fix

`new URL(raw, base)` resolves dot segments, so `/..//evil.test` (which does not start with `//`) canonicalizes to the pathname `//evil.test` on the trusted probe origin. Both helpers returned that string, and the leading-`//` guard only ran on the raw input.

Fix: after canonicalization and before the deny lists, both helpers return their fallback when `url.pathname.startsWith('//')`. Nothing is decoded or reinterpreted; percent-encoded slashes (`/a%2F%2Fb`) stay inside one segment and are kept, as before.

## Source-to-sink path

1. **Link sink (the exploitable one).** `?from=` → `work/[itemId]/page.tsx:51` (`fromRaw`) → `:55` `safeInternalPath(fromRaw, gridPath)` → `:109` `<Link href={from}>`. Before the fix `from` could be `//evil.test`, a scheme-relative external href. `:56` re-encodes `from` into `here` (`encodeURIComponent`), which is a query value, not a sink.
2. **Redirect sink (not exploitable today, now hardened at its own boundary).** `login/page.tsx:33` `safeReturnTo` → `href=/api/auth/login?returnTo=<encoded>` → `api/auth/login/route.ts:13` `safeReturnTo(.., cfg.appOrigin)` → `beginLogin` (`flow.ts:133`) stores it → `api/auth/callback/route.ts:26` `NextResponse.redirect(resolveReturnTo(returnTo, cfg.appOrigin))`. The lifecycle re-applied the helper, which rejected a stored `//evil.test`; but a direct `resolveReturnTo('/..//evil.test', origin)` (single application) resolved to `http://evil.test/`. That is the case the new origin test pins.

## Regression proof

- **Red** (15:09:32-15:09:35Z, before the fix): `13 failed / 77 passed (90)`: six `safeInternalPath` cases, six `safeReturnTo` cases and the `resolveReturnTo` origin test. The new keep cases passed at the same time (current behaviour preserved).
- **Green** (15:09:47-15:09:49Z, after): `2 files, 90/90`.
- **Real function** (`paths.ts` executed): the original trigger `/..//evil.test` and five variants return the fallback; `/matters/1/work?execution=WAITING&q=spa`, `/my-actions`, `/a/b/../c?x=1` (→ `/a/c?x=1`), `/a/./b`, `/a%2F%2Fb` and the `?from=` round-trip are unchanged.
- `pnpm check`: exit 0, 48 files / 482 tests. `pnpm build`: exit 0, compiled; no host limitation was hit. Details in `checks.json`.

## Callers reviewed after the change
`work/[itemId]/page.tsx` (`from` can no longer be scheme-relative), `login/page.tsx`, `api/auth/login/route.ts`, `flow.ts` `beginLogin`, `api/auth/callback/route.ts`. All consume an in-app path or the fallback; none needed a change. No other file calls either helper.

## Not changed / not run
CR-002 (PO decision), draft persistence, import error mapping and all other P0 behaviour are untouched. Not run: Storybook and webpack (no shared component or route changed), backend gates (no backend byte changed), e2e and browser, hosted IdP, and rendering of the work-item page (it needs a session, so the sink is shown by code path plus the executed helper, not by a rendered page). `flow.ts` itself could not be executed outside vitest, so its behaviour rests on the 90-test run.

## Remaining risks
- The deny lists are string prefixes on the canonical pathname; other link sinks fed by unvalidated query parameters elsewhere were not audited in this pass.
- The earlier author packet `claude-comprehensive-review-r1` still carries the wrong EX-03 entry; `review/comprehensive-delta-r1` supersedes it and was not edited.
- The packet's other open items stand: CR-002 undecided, whole-tab draft purge, no browser/IdP/AC-137/final-byte restore evidence.

## Next step
Non-author review of exactly `source-manifest.json` (`de8424ea…4489`), especially `paths.ts:10-18`, `flow.ts:96-118` and the new cases.
