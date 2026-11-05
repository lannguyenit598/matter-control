# MC-P0 — fix RV-001 normalized protocol-relative redirects

## Assignment

You are actual Claude Code fixing the confirmed security finding RV-001 in the
existing shared checkout:

`/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`

The current candidate is uncommitted on `codex/unified-project-flow`, base
`2d410816cd9a9b2664ec388a98aa8f5fdb8f00cc`. Preserve every unrelated dirty
change. Do not reset, stash, clean, switch branch, stage, commit, push, deploy,
read credentials, or alter ZITADEL/provider configuration.

Read root `AGENTS.md`, frontend `AGENTS.md`, matching frontend rules, the
author self-review at:

`docs/testing/p0-final-parallel-20261028/review/comprehensive-delta-r1/`

and current sources/tests before editing.

## Confirmed boundary

`safeInternalPath` and `safeReturnTo` reject raw `//host`, then canonicalize raw
paths with `new URL`. A raw value such as `/..//evil.test` can normalize to a
pathname beginning `//evil.test` while retaining the trusted probe origin during
the first parse. Returning that normalized string is unsafe:

- Work-item causal navigation renders it as `<Link href={from}>`; a leading
  `//` is protocol-relative at the browser link sink.
- `safeReturnTo` has the same standalone canonical-output weakness. Its current
  login/callback lifecycle re-applies the helper and rejects the stored
  `//evil.test`, so this exact payload does **not** bypass login today. Still
  preserve the helper invariant at its own boundary so a future caller cannot
  convert its returned value into an external redirect.

The invariant is: every value returned by either safe helper must remain a
single-origin, in-app path **after canonicalization and at its final consumer**.
Valid ordinary paths, queries, and normal dot-segment paths must retain current
behavior; auth/login routes must still be refused.

## Minimal fix

1. Add focused test cases first that fail on current source for normalized
   protocol-relative output. Cover both helpers and `resolveReturnTo`, including
   `/..//evil.test`. Keep existing raw `//`, control and auth-route coverage.
2. Fix the common post-normalization boundary in both `safeInternalPath` and
   `safeReturnTo`: validate the canonical pathname/result before returning it.
   Reject canonical protocol-relative forms (`//...`) and any canonical form
   that could become an external scheme-relative target at the consumer. Do not
   decode/reinterpret arbitrary percent-encoded path bytes or redesign redirect
   APIs.
3. Verify the original trigger now falls back, the existing login/callback
   revalidation still stays at the configured origin, and ordinary internal
   paths with query preserve current output. Review direct callers after the
   change.

Do not modify CR-002 (it remains a PO decision), draft persistence, import
error mapping, visual design, or unrelated P0 behaviour in this pass.

## Required checks and evidence

Run the focused tests red before the fix and green after it. Then run `pnpm
check` and `pnpm build`; record any host limitation as such, without bypassing
it by exposing a service or changing host-wide settings.

After confirming absence, create only:

`docs/testing/p0-final-parallel-20261028/claude-rv001-fix/`

Include `return.md`, `inputs.json`, `checks.json`, `source-manifest.json` and
`source-delta.json`, with exact current hashes, command/UTC/exit evidence and
the source-to-sink path. No claim of independent review, P0/MC-002 closure,
browser/IdP verification, release, or production readiness.

Return actual identity/tool/model, changed files, regression proof and remaining
risks. The next step after your return is non-author review of the new manifest.
