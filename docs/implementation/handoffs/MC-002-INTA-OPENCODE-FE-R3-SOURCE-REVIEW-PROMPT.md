# INT-A — OpenCode independent R3 source/evidence review

**READY_NOT_DISPATCHED / READ_HASH_STATIC_ONLY / RUNTIME_NOT_RELEASED**

Human delivery assigns actual OpenCode as independent nonauthor reviewer for MC-002-INTA-FE-VALIDATION-R3-SOURCE-REVIEW (P0). Requirements: INT-ENV-05, R07, existing C01..C04 and R2-I01..06; scope includes the supported launch binding under INTA-1-LAUNCH-01. Preparing this prompt is not dispatch.

## Workspace, identity and inputs

Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch: `codex/unified-project-flow`. Prepared base/head: `a62d838791ba188838c4ff00b7b6e265ac775056`.

Acknowledge actual tool/version/model/provider/session and independence from R3 authorship. Use the currently permitted provider/model; no login, switching, global setting/permission changes or new paid route. Recheck root/branch/HEAD, applicable instructions/RTK and Semble before exploration. Preserve all others' files. Do not stage, commit, merge, reset, stash or push.

Start with `docs/testing/inta-fe-validation-r3-intake/review-inputs.json`. Verify every direct pin, all 20 R3 payload pins and all 15 frozen R2 pins. Verify bytes again before closing the review. A mismatch is NEEDS_INPUT_REFRESH; do not analyze mixed revisions or silently update source/manifests. Relative paths below resolve from the root above:

- `docs/reviews/inta-fe-validation-r3-antigravity-return.md` (owner claims only).
- `docs/testing/inta-returns/frontend/validation-r3-20261026/` (manifest, corrected source/tests, seven diffs, proposals, scan, owner JSON/stdout).
- `docs/testing/inta-fe-validation-r2-approval-update-intake/review-snapshot/` (frozen baseline).
- `docs/reviews/inta-opencode-fe-r2-source-review.md` (independent prior findings).
- `docs/implementation/handoffs/MC-002-INTA-FE-VALIDATION-R3-ANTIGRAVITY-PROMPT.md` (assigned acceptance scope).
- `docs/reviews/inta-fe-validation-r3-intake.md` and `docs/testing/inta-fe-validation-r3-intake/source-observations.json` (Codex observations to independently confirm or refute).
- Pinned checks/diff-validation, launch addendum, approval and original contract.

Read only the actual guard `/tmp/mc002-inta-harness/src/guards.ts` if needed; its full hash is pinned. Do not traverse private state/credentials, dependencies, databases or unrelated worktrees. Additional necessary internal sources require a documented scope gap; do not invent behavior from unavailable code. No tools/API documentation lookup is necessary for this static review; use applicable project rules if a version-specific claim requires documentation.

## Strict execution boundary

Read, hash, parse JSON/AST, and compare static source/diffs only. **Do not run or import any delivered Python/JS/shell source, suite, wrapper, coordinator, launcher, observer, driver/help/status or product build.** The selfcheck is not fully isolated: cases 20/21 and case 25 can reach default real `os.kill`; no rerun even to reproduce that issue.

No socket/HTTP/probe/lsof/ps/real signal (including 0), Next/Go/PostgreSQL/Docker/process control, dependency copy/install/download, private credential access, provider invocation or runtime cue. Small read/hash/JSON scripts that do not import reviewed code are allowed. Do not fix source. Owner tests are cited evidence only.

## Review questions and acceptance

Review every R2-I01..06 independently; do not adopt the author's CLOSED claim or Codex observations as your conclusion. Record CLOSED_SOURCE_ONLY / PARTIAL / OPEN / NEEDS_SOURCE with exact source lines, severity and a concrete minimum correction. Group C01..C04 accurately. Specifically inspect:

1. Actual wrapper → coordinator → launcher flow, count/order of intended variants, first-failure stopping and collision handling. The list named 22 currently contains 24 entries; relate this to the 11 missing variables, prior API_TOKEN coverage and NODE_ENV production without changing canonical IDs or waiving required supported-path proof.
2. Guard import before spawn, exact executable/argv/cwd/env/state binding, forbidden inputs including empty values, PATH/HOME defaults and observer environment. Distinguish approved boundary from unverified defaults. No new PO option-A approval is needed.
3. Identity values actually passed at all cleanup call sites, start identity/owned handles, ignored returns, bounded exit capture, early-return/finally behavior, stale/reused PID and cleanup failure propagation. Do not accept helper existence as proof that real calls use it.
4. Complete observer record, error-field policy including empty/falsey values, strict types/defaults, run/variant identity, counter durability and caught writer failures. Track fast-exit behavior and sampling limits against the actual never-listen acceptance claim.
5. Launcher CLI entry/lifecycle tests versus helper-only tests; unbound defaults, swallowed signal errors, close/exit handling and relative-path OR fallback. Verify all production paths are covered before accepting readiness.
6. Test safety and actual reach: missing kill injection; case25 checks an error note rather than successful cleanup; absent successful coordinator path and write/replace/fsync/probe timeout/exception tests. Identify what the 30/10 counts prove and what they do not.
7. Evidence provenance: seven diffs reconstruct exact source, manifest/raw/export equality, claimed Node version (proposal v24.10.0 vs summary v24.22.1), exact command/exit/stream gaps. Codex's five initial textual diff mismatches were comparator artifacts; semantic reconstruction passed all seven. Do not re-report them as stale source without new evidence.

Review R3-N01..06 with an independent disposition; add only material new findings. Prefer a small coherent correction over another framework or full architecture review. Report PASS_SOURCE_ONLY / CHANGES_REQUIRED / NEEDS_AUTHORIZED_SOURCE as appropriate. A source verdict cannot award runtime PASS, INT-CONF-01, final 36-case acceptance or MC-002 DONE. Do not repeat the full 36-row audit; retain previous coverage limits.

## Output ownership and delivery

Before writing, check both these NEW targets are absent; if occupied STOP and report the collision. Never overwrite older QA rounds:

- `docs/reviews/inta-opencode-fe-r3-source-review.md`
- `docs/testing/inta-returns/qa/fe-validation-r3-source-review-20261026/` — only `review-inputs.json` and `checks-log.json`.

Only these output areas are writable. Return identity, input hashes/base/head, exact reviewed paths, per-finding disposition/lines, acceptance/test reach, prohibited checks not run, limitations, remaining risks and proposed status. Include full hashes/bytes of all three final outputs in the human return; do not create a self-referencing manifest. Use actual timestamps; label uncertain timing. Recheck input hashes before final output. Do not message other agents or start a repair/runtime round.

Preserve PO option A, raw-CLI historical FAIL, T11c OUTCOME_UNKNOWN, original ledger, all 51 formal results, termination/privacy/PG teardown limitations and product/security/Cloudflare/cost/recovery gates. End with skipped checks and remaining risk.
