# Independent review request (r3)

Supersedes the r2 request, which named bytes that no longer exist.

Status: PENDING. No reviewer has been invoked; the author did not review its own change.

Pin the review to these bytes only. A verdict does not extend to later bytes.

- Candidate manifest: `source-manifest-r3.json`, SHA-256 `6bf9a3ba58635d4bb4ac0e1b016827a798979cdc67c55166cc75fbd0ff11fdf0`
- Delta from the earlier pin: `source-delta-r3.json` (4 paths: `draft-scope.tsx`, `read-failure.tsx`, `drafts.test.tsx` under `apps/frontend/src/components/organisms/`, and `work/[itemId]/page.tsx`)
- Base: `codex/unified-project-flow` at `a62d838791ba188838c4ff00b7b6e265ac775056`, source uncommitted

Questions for the reviewer:

1. `read-failure.tsx` / `draft-scope.tsx`: does purging every draft in the tab on `sign-in`, `forbidden` and `not-found` primary reads satisfy R8-N01 without over-purging an OWNER to VIEWER downgrade? Check the classification of the 17 call sites in the gap matrix and the single `partial` site.
2. Is the tab-wide breadth acceptable, or should drafts be indexed by Matter?
3. Does `ReadFailure` (a server component) importing the client leaf `PurgeDrafts` respect the Next.js boundary and `components/` import rules?
4. Carry-over: the earlier `global-error.tsx` `<title>` fix was never given a final-byte verdict. It is inside the 720-path selection.

Route: the authorized independent route named in `AGENTS.md` (OpenCode, or a non-author Local Codex review). Not Claude Code.
