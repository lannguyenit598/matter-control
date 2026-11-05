# MC-CODEX-ADR006-REMEDIATION-20261030 — author return

Actual Local Codex, local source remediation and verification. Base/head: `20feedbf06c859a9806055d609f5b132fe8bb086`, branch `codex/unified-project-flow`, preserved dirty shared checkout. No commit, push, cloud mutation, real credential use or independent self-approval. Proposed status: **IN_REVIEW_WITH_VERIFICATION_BLOCKERS**.

## Delivered corrections

1. **Creation receipt authority/scope:** document and Action creation reauthorize the receipt's saved scope, require matching Workspace/Matter scope before replay, and preserve same-scope replay. Revoked saved authority returns uniform hidden denial with a restricted audit record and no domain write. Shared memory/PostgreSQL contract regressions cover scope mismatch, same-scope replay, current-authority loss and audit/event/receipt counts.
2. **Idle expiry reference:** the actual PostgreSQL reference refresh now requires `idle_until > statement_timestamp()`. Its new expiry regression failed first, then passed. This is separate from the newly implemented application BFF store.
3. **Entry route:** `/` redirects to the implemented `/workspaces`, with config regression coverage.
4. **Durable BFF:** implemented opt-in encrypted PostgreSQL PKCE, opaque sessions and pending-transfer storage. AES-GCM authenticates the row scope; tokens remain server-side. Logout, child attempts and refresh completion share a session lock. Refresh claims commit before the real IdP call; parallel clients send one rotating token; unknown/crashed refresh cannot silently retry it. Expired access without refresh fails closed. Malformed config/storage failure does not fall back to memory.
5. **Pending-command recovery:** frozen payload/keys survive independent store instances. Explicit lease-expired retry retains the same command identity; late completion cannot settle a replacement dispatcher. Logout/access-loss purges prevent revival; acknowledgement requires the matching result/key. Near-25 MiB pending import bytes round-trip exactly in the local PostgreSQL test.
6. **Worker candidate:** OpenNext Cloudflare1.20.14, Wrangler4.156.0, pg8.23.1/@types8.23.1; build wrapper, runtime-secret guard, config and private-variable example. Native `node:net` Socket avoids the pg-cloudflare close-loop rejection reproduced in workerd. The exact Worker profile uses dynamic SSR (`cacheComponents=false`, `partialPrefetching=false`); Node defaults retain both features. Added generated-output exclusions only, never security-hook edits.
7. **Verification maintenance:** serialize test-only BFF schema bootstrap across Vitest workers; wait for the actual dialog-close effect in the existing creation-flow test rather than sampling before it runs; two backend formatting/error-wrapping fixes required by the existing gate. No UI/business behavior change from these test adjustments.

Detailed operating constraints: `ops/adr006/README.md`. Changed-path pins are in `source-manifest.json`; no claim that this task authored every pre-existing HEAD-to-worktree hunk.

## Actual checks

| Check | Result | Evidence |
| --- | --- | --- |
| Full Go `-race -count=1 -json ./...`, fresh owned PG |717testPASS/0FAIL/6SKIP, exit0|backend-final-green.jsonl + meta + stderr|
| Backend make check |PASS: sqlc/format/tidy/lint/race; this command had no PG DSN|Observed tool output; full PG proof is the separate retained717-event run, not an inferred no-skip gate|
| Final frontend check |typecheck/lint/format,726PASS/12SKIP, agent rules PASS|frontend-final-check-r2.log/json|
| Shared frontend Webpack build |PASS; compiled CSS verified, Node cache profile retained|frontend-webpack-final.log/json|
| Storybook build |PASS with upstream module-directive warnings; no rendered/a11y acceptance inferred|frontend-storybook-final.log/json|
| Concurrent BFF PostgreSQL suites |14/14PASS|durable-bff-final-r3.log + meta|
| Worker exact-source build |PASS, isolated copy, no diagnostic route|adapter-opennext-final-build.log/json, worker-copy-comparison.json|
| Worker HTTP integration |17/17PASS|worker-smoke-1793328787640.json, worker-final-attempt.json|
| Dependency peers / production advisories |PASS / no known vulnerabilities|frontend-peers-final and frontend-audit-final logs/json|
| Frozen lockfile install |PASS in isolated copy|adapter-opennext-final-install.log/json|

The six Go skips are explicitly test-level skips: intentional pgtest missing-environment subtest; real R2; EXPLAIN opt-in; memory-only failure-injection seam; performance opt-in; restore opt-in. No zero-skip claim. Frontend default gate skips PostgreSQL cases without its private DSN; the14-case DSN-enabled run is separate and passed.

The17 Worker checks cover root, anonymous session, PKCE, callback after Worker restart, session after another restart, actual Workspace rendering from Go/PostgreSQL, compiled CSS link/serve,1MiB and26,213,376-byte upload/download SHA equality, Server Action foreign-origin rejection and same-origin persisted write/readback, logout and refusal of the old cookie. These are HTTP/RSC/Route Handler/Server Action checks; **no browser or real provider**. Object adapter is local filesystem. Final Worker private logs contain zero unhandled-rejection/socket-closed occurrences (`worker-log-summary.json`).

`worker-copy-comparison.json` compares350 shared source/config/script/assets with the isolated build. Exactly one subsequent difference is the test-only dialog wait fix; no runtime implementation/config drift. HTTP attempt start/end fields were not retained inside the original smoke file; its timestamp filename is the final-write anchor. `worker-final-attempt.json` explicitly records that limitation rather than inventing times. Seven executed verification programs are retained for reproduction, with private fixture values loaded at runtime, never embedded.

## Failed attempts retained and supersession

- The original author packet is preserved: audit return hash expected `fbda3036af04e80b7bc17dc0c3865ccb74801ad2f3ba1ed8f3069380eafdd992`/4671B, observed `ed11be914cf44e124c94f040d191ed63a97e87462d2bd1652b7b24a0bfc8200f`/4679B. No fabricated repair of its lineage.
- Original `durable-session-events.json` contains a missing-main-module error, not test events. The new correctly located PG runs supersede its PASS claim within their explicit scope; they do not change the failed file.
- `backend-final` is a failed compile attempt after the added audit regression; its0test-fail count is not success (exit1, build failures). `backend-final-green` is the accepted subsequent717-pass attempt.
- `durable-idle-red*` preserve the expiry failure. `durable-bff-final` preserves the two-worker schema-bootstrap race; final-r2 fixes bootstrap, final-r3 also covers expired token without refresh. `durable-expired-token-red` preserves the actual failure before that correction.
- Earlier Worker attempts preserve fixture/SQL/env/tracing failures and the full-cache-profile render failure. The full feature profile's successful build did not imply runtime compatibility. Native-socket and final17-probe runs supersede the earlier socket-close problem within the tested SSR profile.
- `frontend-final-check` preserves the asynchronous dialog assertion failure; `frontend-final-check-r2` passes after waiting for the real effect. No weakening of the closed-dialog assertion.

## Scope still open

This is a local candidate, not completion of B1–B9 or every integration recommendation. B1 has no applied Supabase runtime-role grants; B2 remains a proposed index migration (product migrations end0008). No per-actor/edge limiter, deployed TLS topology/MFA/device policy, receipt-retention executor, real secret-rotation execution or live alert consumer is newly certified here. No deploy permission is inferred.

Pending imports are encrypted inline PostgreSQL values capped36MiB, not the earlier proposed R2-reference design. Large **pending-import** Worker CPU/memory/database/cost remains unmeasured; the streamed document upload proof does not satisfy that requirement. Physical cleanup/retention requires a bounded approved operator path. The runtime pg connection uses verified TLS for remote hosts, but real Supabase CA/pooler/least-privilege/Data API negatives are NOT_RUN.

Other open gates: real ZITADEL and exact public-origin login/refresh/logout; actual Cloud Run/R2 path and recovery; Worker compressed upload/resource quota and strict zero-cost/residency evidence; independent nonauthor review; authenticated browser/keyboard/accessibility/human acceptance. No MC-002 DONE, production, release or real-data approval. New exact dependencies and workerd/minimum-age allowlist changes are disclosed in the runbook; no global agent/security configuration was changed.

## Resources and next action

Only newly owned loopback runtimes/fixture were used. Per-attempt smoke children stopped themselves; ports3000/8081 and other retained containers/databases were not assigned or controlled. Final fixture disposition and ID/label verification are recorded in `fixture-disposition.json`; preserve its synthetic database for QA, do not prune volumes. Raw logs and synthetic credentials remain private under `/private/tmp/mc-codex-adr006-fixture` with restrictive modes.

Next: independent source/security review of the pinned candidate and the documented SSR/inline-payload decisions, followed by separately authorized provider qualification. No external reviewer was invoked by preparing this return. Skipped: cloud/browser/real-IdP/R2/restore/performance activation, existing-resource lifecycle, commit/push. Remaining risk: cross-provider limits/security/cost are not proven by local PASS results.
