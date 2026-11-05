# MC-P0-CODEX-BACKEND-LOCAL-20261029 — consolidated return

Actual agent: Local Codex in Codex desktop. No Claude/OpenCode/subagent invocation or message dispatch. Date: 2026-10-29. Repo: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. Branch: `codex/unified-project-flow`; intake/final HEAD: `20feedbf06c859a9806055d609f5b132fe8bb086`. All existing dirty work and `leonx.me/matter-control` preserved. No commit, push, merge, deploy or real-R2 call.

**Proposed status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS.** Reviewable backend candidate and fixture-backed evidence are delivered. Corrections are Codex author verification; a separate nonauthor must review them. No MC-002 DONE, release, production, cost or recovery certification.

## Result and scope

- Intake: 190/190 Claude S6 files matched; both aggregates verified; exactly 101 rename-only files reconstruct S0 hashes by in-memory reverse substitution. No missing/unexplained drift at intake. The exact original textual lineage of eight behavioral edits remains unproven because S0 bytes are not present. See [intake](intake.md) and [comparison](intake-comparison.json).
- Fixed product readiness: pool Ping under the existing 500ms deadline; DB failure/draining returns generic product 503 rather than misleading 200 or the discovered error-mapping 500. Health remains process liveness.
- Added positive `MC_TRANSFER_TIMEOUT` (60s local engineering default) for document upload/content, import preview/commit, export and bulk commit; ordinary requests retain 10s. Finite socket read/write bounds align with transfer work. Auth, upload/concurrency limits, cancellation, business statuses, receipts/idempotency/CAS and hidden-resource precedence remain intact. A possible write timeout remains OUTCOME_UNKNOWN.
- Added narrow K_SERVICE/fs fail-closed guard, preserving local filesystem mode. No shutdown implementation change: existing drain/cancel/close behavior passed active-request tests and owned API SIGTERM smoke.

Seven existing backend paths modified and two tests added:

1. `apps/backend/internal/app/product.go`
2. `apps/backend/internal/app/product_readiness_test.go` (new)
3. `apps/backend/internal/adapter/inbound/productapi/server.go`
4. `apps/backend/internal/adapter/inbound/productapi/timeout_test.go` (new)
5. `apps/backend/internal/config/product.go`
6. `apps/backend/internal/config/product_test.go`
7. `apps/backend/.env.example`
8. `apps/backend/docs/operations.md`
9. `apps/backend/docs/api.md` (narrow runtime addendum; S5 stays deferred)

Governance writes are only this new evidence namespace and [the task](../../implementation/tasks/MC-P0-CODEX-BACKEND-LOCAL-20261029.md). [Proposed shared status/contract delta](proposed-status-delta.md) is task-local; shared workboard/contract and frontend are untouched. [Source delta](source-delta.json) binds before/after SHA-256 and byte lengths. [Final manifest](final-source-manifest.json): 192 source entries, aggregate `e649a03a30f17824e2e334bf30753c9ff3813aeb7535a6c9fc5d3051513a00d8`; excludes six observed `.DS_Store` metadata entries. Historical input packets remain unchanged.

## Acceptance and verification

| Acceptance | Result / evidence |
|---|---|
| Original candidate PG/object/service/API baseline | PASS: `go test -json -race -count=1 ./...` with new owned PG: 574 named test/subtest pass, 5 skip, 0 fail. 175 passes in the PostgreSQL adapter package. `baseline-command.json`, `baseline.log`, `baseline-counts.json` |
| New behavior red before green | PASS: cloud fs accepted, closed-pool ready returned 200, and transfer routes had 10s rather than 60s; `reliability-red.log`. First green attempt found readiness 500 mapping, retained in `reliability-green.log`. Corrected scoped race checks pass in `reliability-green-r3.log` |
| Required final gate | PASS: `make check`, `GOFLAGS=-v`, fixture-only `MC_TEST_DATABASE_URL`; 08:11:58–08:12:52 UTC, exit 0. sqlc-check, gofmt, tidy-diff, golangci-lint and `go test -race -count=1 ./...`; **593 pass / 5 skip / 0 fail**, six packages without test files separately recorded. `check-command.json`, `check.log`, `test-summary.json` |
| Healthy/down/canceled/draining readiness | PASS: helper cancellation/deadline tests, closed-pool server regression and real PG pause/unpause smoke. Ready 503 in 0.5018s while health stays 200; recovery ready 200. Response has no DB details |
| Route/config compatibility | PASS: default route selection, configured transfer budget, earlier caller deadline, config invalid/default/cloud fs/r2 cases; existing product suites pass. No near-25 MiB deployed workload claim |
| Graceful shutdown | PASS: active request drain and timeout cancellation tests; owned API SIGTERM exit 0, 0.0035s observed smoke shutdown; DB/object hooks complete through normal app exit |
| Local API readiness handoff | PASS_SCOPED: owned API health/ready 200 and missing bearer 401, product migration 7, local fs. Synthetic signing key only; no authenticated success claimed. [Runtime handoff](runtime-handoff.md) and `runtime-results.json` |
| Preservation / cleanup / privacy | Scoped diff-check exit 0; both run-owned PG containers and anonymous volumes removed after exact owner-label checks, owned APIs reaped. Original API/PG/IdP/frontend retained. Public evidence scanned for fresh fixture credentials/key material; see `privacy-scan.json` and `cleanup.json` |

Five skips are explicit: real R2 opt-in, performance opt-in, restore opt-in, memory-only W6 fault-injection seam in the PG suite, and the pgtest self-test that intentionally omits its environment variable. None is a silently skipped PG suite. Counts include parent tests and subtests. Local fake-S3/filesystem/memory object suites and W1–W7 PG contracts ran. No generated sqlc output or SQL source was edited.

Tool versions: Go 1.27.3 darwin/arm64; golangci-lint 2.14.0 (built Go 1.27.1); Docker client/server 29.9.2; cached PostgreSQL 18.6. See `versions.json`. Exact argv/cwd/UTC/exits are in command JSONs; supplemental early regression commands have log-completion mtime, not independently captured start times. Driver-source text snapshots document orchestration without publishing credentials.

## Retained failures and limitations

1. First fixture's 384 MiB tmpfs filled after baseline plus repeated schema/migration work. PostgreSQL exited 1, OOM false; diagnostics show `No space left on device`. First `make check` failed (514 pass / 80 fail / 4 skip) as PG entered recovery; this is retained, not erased or counted as a backend regression. The first runtime migration attempt then failed to connect. A second newly created fixture used a private anonymous volume with the same CPU/memory/PID limits; final gate passed.
2. First runtime recovery attempt failed because Docker reassigned the dynamic published PG port after restart (56901 → 57632); health/down checks had passed, recovery did not. API was still gracefully reaped. Retained in `attempt2-runtime-*`. The corrected orchestration discovered its actual port and used pause/unpause; all final assertions passed. No product fix or silent successful-retry claim for the earlier attempt.
3. A scoped test attempt was blocked by sandbox Go-cache permissions; the permitted rerun succeeded. An initial existing-API probe observation was likewise sandbox-blocked; permitted read-only probes later observed 200/200/401. No approval-review rejection or permission bypass occurred.
4. Final corrected candidate needs nonauthor review. Real R2, provider behavior, deployed/full-size transfer/bulk performance, browser/IdP/authenticated verification, retained API replacement and final recovery acceptance remain open. Historical S0 behavioral bytes and real-provider evidence were not manufactured.

## Next action

Claude: read [runtime-handoff.md](runtime-handoff.md), retain the existing API base/data and continue focused-workbench. Its runtime owner must rebuild/restart the owned API with its existing approved configuration before claiming this corrected backend is running there. Codex: submit the nine-path manifest-pinned candidate for a separate nonauthor review and let the shared workboard owner consume the proposed delta; no external dispatch was made.

Skipped: frontend edits/builds, retained-runtime lifecycle, authenticated/browser/IdP checks, real R2, full-size/deployed performance, restore repeat, S5, provider/production actions and commit/push/deploy. Remaining risk: local passing contracts and readiness are not production acceptance, and the existing user-facing API binary is not proven to include these corrections.
