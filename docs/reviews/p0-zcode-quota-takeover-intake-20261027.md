# P0 — ZCode quota interruption and Claude Code continuation intake

Task **MC-P0-CLAUDE-TAKEOVER**, continuing **MC-P0-ZCODE-EXECUTION**. Prepared by actual Codex / Local Codex, 2026-10-27, Asia/Ho_Chi_Minh. Status **INTAKE_COMPLETE / MANUAL_HANDOFF_READY_NOT_DISPATCHED**. Authority: direct PO request to inspect ZCode's work and transfer continuation to Claude Code because ZCode quota is exhausted.

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. Code lives in uncommitted imported working files; HEAD alone is not the source snapshot. Codex did not alter product source, workboard, IdP, databases or design outputs in this intake.

## Actual source found

Compared against `docs/implementation/p0-zcode-execution/evidence/baseline-20261027/source-baseline-manifest.txt`:

- Eight existing backend files changed: postgres `matter_store.go`, `matter_test.go`, generated `mcsqlc/matter.sql.go`, `queries_mattercontrol/matter.sql`; memory `repotest/mattercontrol/memory.go`; domain `matter/access.go`; port `errors.go`, `matter.go`.
- Seven new Go source/test files: `core/service/workspace_service.go`, `workspace_service_w1_test.go`, `core/port/identity.go`, `workspace.go`, `core/domain/matter/workspace.go`, `core/policy/workspace.go`, `adapter/outbound/repotest/mattercontrol/memory_w1.go`.
- Three symlink paths absent from the working baseline are byte-identical to imported `.claude/skills/{add-use-case,add-migration,steward}` links. They are preserved template imports, not new feature work.
- **323/323 frontend import entries match**. No MatterControl product FE/BFF implementation is present; existing task demo/template does not count as product delivery.
- No missing baseline entries. The baseline contains **462 hash records**, while owner narrative reports 464 files; there are also two comment lines. This intake records the mismatch without asserting why the owner counted differently or rewriting the baseline.

The W1 source implements the ten WorkspaceService use cases, domain/port/policy additions and memory transactions/read snapshots. Existing BE01 service/access/receipt/history work is retained. PostgreSQL only gained the WorkspaceByID query/accessor/read method, not the remaining W1 store implementation. The eight new behavioral regression tests cover W1-A01/A02; rev4 clarifies the per-operation CAS/receipt/lost-response distinction from W1-A03.

Absent paths confirmed: `internal/adapter/outbound/postgres/workspace_store.go`, `internal/adapter/outbound/identity/zitadel`, `internal/adapter/inbound/productapi`, `cmd/mcapi`, and the implementation `final-return.md`. No product source completion is inferred from ports or method names.

## Verification actually executed

Go: **go1.27.3 darwin/arm64**. Database environment variables `DATABASE_URL`, `TEST_DATABASE_URL`, `MC_TEST_DATABASE_URL` were removed for this run. Module network lookup was disabled (`GOPROXY=off`, `GOTOOLCHAIN=local`); a dedicated temporary build cache was used. No credential contents were read.

1. `rtk proxy go test -race -count=1 -json ./internal/core/service ./internal/core/domain/matter ./internal/core/policy ./internal/adapter/outbound/repotest/mattercontrol`, cwd `apps/backend`, 2026-10-27T06:39:53Z→06:40:01Z: **exit 0; 137 test/subtest pass events, 0 fail, 0 skip**. Package-level results are not added to test counts. Eight W1 regression test names occur in this selected suite; the raw JSON is retained.
2. `rtk proxy go build ./...`, cwd `apps/backend`, 2026-10-27T06:40:43Z→06:41:10Z: **exit 0**, stdout/stderr empty.
3. Read-only `rtk proxy gofmt -l` over the new/changed Go files: tool exit 0, **four files need formatting**: memory `memory_w1.go`, domain `workspace.go`, port `workspace.go`, and `workspace_service_w1_test.go`. Exit 0 is not a formatting PASS. Codex left source unchanged.

No full `make check`, golangci-lint/sqlc-check, PostgreSQL fixture tests, IdP probe, HTTP/BFF/FE build or browser checks were run. Thus build and scoped memory/core tests are independently reproduced, but W1 is not fully implemented or accepted.

Evidence: `docs/testing/p0-claude-takeover-20261027/` contains the source snapshot, public reference pins, raw test events/stderr, command receipts, build output and read-only inventory script. Source hash verification at close-out is separate from compilation/test results.

## Checkpoint reconciliation and remaining work

The same workboard still says `IN_PROGRESS_STEP0_DONE_W1_STARTING`, has `current_source_checkpoint=null`, W1 `IN_PROGRESS_W1_BACKEND_TESTS_PG_HTTP_FE_PENDING`, and W2–W7 NOT_STARTED. Its detailed W1 state says A01/A02 fixed and tests green. Contract is now **revision 4**, SHA-256 `b418471bc137839b906397a406d572001b7992076ac64c52e3618fd7d1e268a3`. Some higher-level status/coverage and older resume-note assumptions have not caught up with source; Claude must reconcile them when it actually accepts ownership, preserving history.

Next dependency chain: broaden memory/store behavioral contract coverage → implement W1 PostgreSQL/sqlc/transactions and run separate verified native/product fixtures → real ZITADEL verifier/identity mapping → product HTTP/composition → real BFF/product frontend W1 → paired W2–W7 implementation/tests/repair. Existing owner report says local ZITADEL is provisioned, but this intake did not inspect private provisioning data, query the provider, inspect containers, or re-provision it. Reuse requires actual task-identity checks.

Full target stays all 20 FR, 63 AC, 14 NFR and three GWs across backend/API/frontend; W1–W7 are internal checkpoints with one consolidated final review. Do not restart W0, reimplement unchanged BE01, or call the existing template frontend complete.

## Concurrent design and review boundaries

Design R7 has the complete source/spec review at `docs/reviews/p0-design-r7-full-review-20261027.md`, verdict CHANGES_REQUIRED. Implement using approved requirements/current contract, applying DR7 constraints; do not copy unsupported axis states, incorrect proof fallback, generic 409 CAS handling or persona-derived permissions.

At intake, `docs/design/p0-handoff-r8/checkpoint.json` reports **IN_PROGRESS**, owned by a separate design session; `return.md` is absent. Draft `.build`/copied files are not a completed or approved input. Claude implementation takeover must not overwrite or consume them as a finished export. Await an actual final return for design-delta intake while continuing independent product work. This observation does not prove the design process is currently running.

Takeover does not transfer independent approval to Claude. Codex/nonauthor QA reviews the final candidate; architecture/design contributions require an appropriate nonauthor. Production, hosting/Cloudflare/cost/recovery acceptance, actual human usability, browser-dependent acceptance and Mimosa's unresolved commit gate remain separate. No provider/account changes or retries of refused actions follow from quota exhaustion.

## Deliverable and dispatch

The new task records the direct PO owner amendment. The full copy/paste handoff is `docs/implementation/handoffs/MC-P0-CLAUDE-TAKEOVER-COMPLETE-PLAN-PROMPT.md`. It directs Claude to acknowledge the same source/checkpoint, own both product stacks, preserve ZCode attribution, finish and self-test the complete plan, and return one reviewable candidate.

**No Claude call or message was sent.** Manual handoff remains READY_NOT_DISPATCHED until the human supplies the prompt and actual Claude acknowledges. There is no claim that Claude execution has begun.

Skipped: DB/IdP/container/process/credential operations, full backend/frontend/integration/browser verification, design execution, external dispatch, security-scan/commit retries and Git mutations. Remaining risk: most P0 implementation is still ahead; the proven W1 memory/core slice is a starting point, not product/auth/PG/FE acceptance.
