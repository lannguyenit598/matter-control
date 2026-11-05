# Backend isolated implementation return — MC-P0-CODEX-ISOLATED-IMPLEMENTATION-20261028

Actual implementer: Local Codex internal worker `/root/p0_backend_patch_20261028`. No Claude Code, ZCode or OpenCode execution is claimed. Proposed status: **IN_REVIEW / IMPLEMENTED_LOCALLY / INDEPENDENT_REVIEW_PENDING**. This is not acceptance PASS, DONE, architecture approval or production evidence.

Task scope: **BQ-01 (P1)** saved receipt scope and complete currently supported row intent binding for bulk/import; **BQ-04 (P2)** whole-sheet parser failures. Requirements: FR-016/018, RULE-014/017, AC-132/133; input is the frozen `docs/testing/p0-codex-parallel-20261028/backend-qa/return.md` and baseline manifest. Parent coordination explicitly authorized this isolated implementation while actual Claude owns the live product source. Reviewer is the separately assigned nonauthor reviewer; final external acceptance ownership stays with orchestration.

## Identity and boundaries

Manifest branch/base HEAD: `codex/unified-project-flow` / `a62d838791ba188838c4ff00b7b6e265ac775056`. These identify the manifest provenance; the selected working bytes are uncommitted and pinned by hashes, not represented as a new Git HEAD. No Git command or commit was run.

- Isolated writable product root: `/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/backend/apps/backend`.
- Immutable comparison root: `/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/baseline`.
- Baseline manifest SHA-256: `03b8ccd2c2af70b8204891a119958589725c3cd46389243091ae9967db75e905`.
- Frozen product bytes at `2026-10-28T03:30:20.194186+00:00`; exact old/new hashes and tool versions: `evidence/changed-files.json`.
- Tools actually used: RTK 1.1.0; Go 1.27.3 darwin/arm64; Semble search against the exact isolated repository, followed by exact-path/literal reads. Applied `go-testing-and-verification` skill and component rules. No library API question required a documentation lookup.
- Live writes are limited to this return and its evidence directory. No live backend/frontend/workboard/contract, immutable baseline, sibling source, database, credentials, provider, Git, lifecycle or dependency installation was modified.

## Implementation and acceptance evidence

1. Bulk/import receipts authorize the existing saved workspace and every represented Matter before exposing replay or distinguishing incompatible intent. Inaccessible saved receipts uniformly produce a row failure without saved item/revision/content hash, including changed-content or different-operation reuse through an accessible second Matter.
2. Scope identity must match the requested single Matter, workspace and operation. Bulk fingerprints include RowKey and all supported changes; import additionally binds saved SourceName/RowKey and supported content. Receipt checks precede registry reuse, so a registry hit cannot bypass a reused key from another intent.
3. The existing saved-scope helper was mechanically extracted from a receiver method to a package function; its one old caller is updated, with existing saved-scope/read/revocation/storage-error tests passing. No other service authorization helper was rewritten. Existing import preview/mutation authorization requirements are preserved.
4. JSON fingerprints remove delimiter and absent-value ambiguities in bulk and import. Import uses an explicit ordered struct of currently supported kind/title/outcome/owner/due/dependencies; no BQ-05 claim field or schema was added.
5. Whole-sheet errors propagate instead of becoming empty success. Unsupported format, malformed CSV/XLSX, empty sheet, missing required columns, over 5,000 data rows and over 8 MiB are tagged `ErrSheetInvalid`. Owner lookup/storage errors propagate with their original classification. Row/group validation remains represented in rows.
6. Source discovery: the product HTTP error table had no `ErrSheetInvalid` case. The minimal new case returns HTTP400 / `urn:mc:bad-request` / `application/problem+json` with fixed actionable detail, without uploaded file contents. Existing cancellation/malformed-body precedence remains ahead of it. API documentation and an invalid multipart example accompany it.

Regression oracles inspect actual persisted rows/edges via existing readbacks, source/row identity, responses and table counts rather than only helper calls. Coverage includes exact replay, changed Matter/source/row/content/operation, saved-scope revocation, nil versus empty/sentinel and delimiter boundaries, legacy registry/receipt conflicts, no duplicate rows/receipts/events/audits, group rollback, concurrent imports and lost acknowledgement recovery. HTTP tests verify cross-Matter saved-scope non-disclosure and invalid-file400/no destination mutation.

## Tests actually executed

All test commands use the isolated backend cwd, private `GOCACHE=/private/tmp/mc-p0-codex-impl-20261028-1o2z4r_1/backend-go-cache`, cached dependencies read-only, `GOPROXY=off GOSUMDB=off GOTOOLCHAIN=local`, and unset `DATABASE_URL`, `TEST_DATABASE_URL`, `MC_TEST_DATABASE_URL`. Exact argv/cwd/UTC/exit are in each paired `*-command.json`; logs contain synthetic fixture data only.

- `evidence/red.log` / `red-command.json`: **exit1, genuine RED** before implementation. Equal-content cross-Matter/source/row reuse replayed incorrectly; invalid sheets returned nil; HTTP returned200. This first test version also attempted an unsupported role-change fixture (forbidden); that fixture was removed rather than widening membership semantics.
- `evidence/red-import-fingerprint.log` / matching command JSON: **exit1, genuine RED** before the import fingerprint change. Distinct title/description boundaries and legacy hashes incorrectly replayed.
- `evidence/green-initial.log`: initial focused `go test -race` service/shared-memory/HTTP run **exit0**, including existing receipt saved-scope, revocation and unknown-outcome regressions.
- `evidence/green-expanded.log`: all tests in `internal/core/service`, `internal/adapter/outbound/repotest/mattercontrol`, `internal/adapter/inbound/productapi` ran with `-race -count=1`, **exit0**, at the intermediate revision before the final import fingerprint change. This broad pass is not presented as the final-byte full-package result.
- `evidence/green-final.log`: final initial binding/parser/counter assertions before the additional import-fingerprint fix, **exit0**.
- **Final frozen-byte relevant run**: `evidence/green-frozen.log` / `green-frozen-command.json`, `go test -race -count=1` across those three packages with filter `TestBulk|TestImport|TestDataCommit|TestSuiteW6|TestCreateRequirement|TestReceipt`, **exit0**. This includes canonical import/legacy/collision regressions and the existing complete W6 memory suite. 98 reported PASS nodes, zero FAIL; this is test-tree output, not a distinct acceptance-case count or coverage metric.
- `gofmt` applied successfully to all changed Go files. No source change followed the final frozen test; only documentation wording and evidence/report capture followed it.

## Changed product paths

- `apps/backend/api.http`
- `apps/backend/docs/api.md`
- `apps/backend/internal/adapter/inbound/productapi/data_server_test.go`
- `apps/backend/internal/adapter/inbound/productapi/problems.go`
- `apps/backend/internal/adapter/outbound/repotest/mattercontrol/contract_w6.go`
- `apps/backend/internal/core/service/dataops_service.go`
- `apps/backend/internal/core/service/matter_service.go`

At the original worker return, no patch had been exported or applied to live source. The parent coordinator subsequently exported `delivery/backend/changes.patch`; the resume verification below confirms that existing export. Live integration remains pending nonauthor review and current-byte reconciliation.

## Compatibility, limits and next status

**Fingerprint compatibility is deliberately fail-closed, not backwards-compatible replay.** Existing bulk or import receipts with old fingerprints return `key-reuse`; a fresh per-row idempotency key against an old import registry entry returns `content-conflict`. Legacy rows, registry hashes and receipts are preserved; no hashes are silently migrated. The legacy import regression proves both same-key receipt and fresh-key registry paths refuse without writes. Recover using authorized item readback and the original-key own-operation receipt query/reconciliation. Never resend an uncertain command with a new key to get past this conflict. Existing `UNKNOWN` semantics and same-revision lost-acknowledgement recovery tests pass; no rollback is inferred from UNKNOWN.

BQ-05 imported verification claim retention and all Brief/Filing findings remain outside this assignment. No schema, generated SQL, auth model, new dependency or global configuration was changed. Shared tests are registered for the PostgreSQL adapter, but running the memory implementation is not PostgreSQL proof. No deployment, full build, `make check`, SQL generation, lint/full-repository gate or actual external reviewer acceptance is claimed. The HTTP example is covered by equivalent httptest multipart behavior; it was not sent to a live server.

Proposed next status: **IN_REVIEW** for the seven-path isolated diff, then parent-controlled reconciliation against Claude's live edits. Independent review and a separately authorized PostgreSQL gate remain required; no automatic adoption or release.

## Resume closeout — MC-P0-CODEX-BE-PATCH-20261028

Actual continuation: Local Codex `/root`, 2026-10-28 UTC; author-side verification only. The original implementer identity above is preserved. Actual branch/head remains `codex/unified-project-flow` / `a62d838791ba188838c4ff00b7b6e265ac775056`; no product commit or source modification was made. Requirements, priorities and seven-path ownership remain unchanged.

[Resume integrity evidence](evidence/resume-20261028T034118Z/integrity.json) verifies all 819 immutable baseline pins, all 230 isolated backend files against baseline plus exactly seven changes, every before/after/isolated hash against both manifests, and the existing patch SHA-256 `b77279d71fccf73170313a2b77b96120c0baddb06583d26452d1b4f73aa936d7`. **`delivery/backend/changes.patch` remains valid and unchanged.** Frozen code hashes are listed per path in that evidence and `evidence/changed-files.json`; no new delivery revision is necessary.

[Coverage audit and exact next reviewer action](evidence/resume-20261028T034118Z/coverage.md) confirms the requested saved-scope/intent/non-disclosure/no-duplicate, parser/storage/HTTP, nil/empty/delimiter and legacy receipt/registry cases in the frozen tests/log. All six prior test command metadata files contain task-specific GOCACHE/offline flags/unset DSNs and no HOME override. Retained final result: three relevant packages, `-race -count=1`, exit 0, 98 reported PASS nodes. Product tests were **not rerun**: bytes and compliant final evidence already cover this bounded scope. A metadata-count mistake in the new integrity checker was corrected with the failed attempt preserved; the corrected integrity audit exited 0.

Only this return and new `backend/evidence/resume-20261028T034118Z/` outputs were written. No live backend, isolated product code, immutable baseline, frontend, workboard, contract, schema, generated SQL or runtime was edited. No prior log or delivery artifact was overwritten. No new independent review result is present in this packet; missing reviewer output is not a code-change reason.

Proposed next status: **IN_REVIEW / IMPLEMENTED_LOCALLY / INDEPENDENT_REVIEW_PENDING**. The separately assigned nonauthor reviewer should consume the existing independent-review prompt, exact delivery manifest/patch/snapshots and this closeout, then return findings and disposition. Claude integration must reconcile its current source once after review; this is not automatic adoption, DONE or acceptance.

**Compatibility limit retained:** legacy receipts/registry hashes are preserved and fail closed. Use authorized original-key receipt/readback/reconciliation; never blindly issue fresh-key mutations to bypass `key-reuse` or `content-conflict` after an uncertain outcome.

Skipped: new product test runs, PostgreSQL/Docker/provider/live execution, full `make check`, integrated/full-product gates, and out-of-scope BQ-02/03/05/06 changes. Risk: legacy fingerprint recovery needs authorized readback/reconciliation; integration can conflict with concurrently changed live source; independent review remains pending.
