# Claude continuation — W1 source and evidence review, 2026-10-27

Verdict: **CHANGES_REQUIRED for the reviewed W1 snapshot; overall delivery remains PARTIAL_IMPLEMENTATION**. The author explicitly records W2–W7 as NOT_STARTED. This is an interim intake requested by the PO, not a new per-wave approval gate or completion of the full P0 review.

Task: MC-P0-CLAUDE-TAKEOVER, continuing MC-P0-ZCODE-EXECUTION. Reviewer: actual Local Codex, nonauthor of the reviewed Claude changes; no Claude/OpenCode invocation in this review. Priority P0. Requirements: parent assignment FR-001..020, AC-101..163 (63-row set), NFR-001..014 and GW-01..03; this review covers W1 and the frozen contract revision 5, especially §2.1 command recovery and authentication. It does not accept all those requirements.

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`. Implementation is uncommitted. Exact source pins and comparison with the takeover snapshot are in [inventory-check.json](../testing/p0-claude-w1-review-20261027/inventory-check.json); closing identity is in `closing-check.json` in the same directory. HEAD alone does not identify the reviewed source. No existing source/governance file was edited by this review.

## Findings

### CW1-F01 — P1: nonreceipted membership receives a safe-retry instruction

[action-result.ts](../../apps/frontend/src/lib/mc/action-result.ts:88) maps every `outcome-unknown` to `retrySameKey: true`; its generic message says the same request is safe to send again. [IntentForm](../../apps/frontend/src/components/organisms/intent-form.tsx:53) converts that flag into the actionable label “Retry (safe to send again)”. Workspace and Matter grant forms use this organism, but [workspaceRepository.grantMember/revokeMember](../../apps/frontend/src/features/workspaces/repository.ts:39) and their Matter equivalents send CAS headers without an Idempotency-Key. Revocation uses an actionable confirmation component as well.

This contradicts contract §2.1: membership commands are audited/CAS guarded, not receipted; an ambiguous response requires authorized state re-read before a fresh intent. CAS may reject an old request, but cannot establish that the first command did or did not happen. The pure-function probe reproduced the unsafe recovery metadata and message; caller binding was verified statically. No second network mutation was sent.

Minimum correction: make recovery behavior command aware. Keep identical-key recovery only for commands whose contract actually supports it. For membership UNKNOWN, prevent blind resend, preserve UNKNOWN and require an authorized re-read/rebase before a new intent. Cover grant and revoke at both scopes and the actual organism behavior; preserve receipted creation recovery.

### CW1-F02 — P1: truncated command response loses unknown-outcome semantics

[mcRequest](../../apps/frontend/src/lib/mc/client.ts:76) reads `await res.text()` outside the fetch-error catch. A synthetic POST response whose headers report 201 and whose body stream rejects throws a raw TypeError. `toMcFailure` then produces a generic error and “Please try again”, rather than OUTCOME_UNKNOWN.

The reviewer executed the actual transpiled functions with a synthetic fetch stub: status 201 → body read throws → action `kind: error`. No real request was made. The server may already have committed when a body is lost; a body-read failure cannot establish rollback.

Minimum correction: include response consumption in the transport failure boundary; classify a lost/unusable command answer as UNKNOWN and a failed read as unavailable. Retain per-command recovery constraints from CW1-F01. Add body-stream failure and unusable successful-command response tests; do not merely wrap errors with a generic retry hint.

### CW1-F03 — P2: returnTo validation permits a cross-origin login redirect

[safeReturnTo](../../apps/frontend/src/lib/oidc/flow.ts:85) accepts a decoded slash + TAB + slash path. [The callback](../../apps/frontend/src/app/api/auth/callback/route.ts:26) passes it to `new URL(returnTo, cfg.appOrigin)`. URL whitespace normalization turns `/\t/attacker.invalid` into `http://attacker.invalid/` when the application origin is `http://localhost:3000`.

The reviewer reproduced acceptance and URL construction using the actual helper. This is a post-login open redirect; no external request was sent and no token/cookie disclosure was demonstrated.

Minimum correction: reject control characters and ambiguous slash/backslash forms, canonicalize against the configured application origin and enforce exact same-origin before storing/using the return target. Add TAB/CR/LF and other normalization regression cases alongside valid local paths.

## Implemented scope actually present

Compared with the takeover inventory: backend 21 modified + 17 added files; frontend 5 modified + 55 added files; no missing baseline files. These counts describe source changes, not feature acceptance.

- Backend W1 includes workspace/membership/history/receipt/access PG adapter work, shared memory/PG contract tests, ZITADEL introspection and identity resolution, 17 product API routes, `cmd/mcapi` and configuration.
- Frontend W1 includes server-side OIDC/BFF session flow, product request/error handling, workspace/Matter/Requirement feature slices and initial product routes.
- The return explicitly excludes W2–W7. Requirement listing, remaining domain workflows, documents/proof/Filing, Control Room, bulk/import/export/brief and stabilization are not a completed P0 implementation.
- Plain Echo product handlers rather than Huma operations are an author-disclosed architecture deviation for review. This intake does not silently approve it or the not-yet-verified audience configuration.

## Checks executed by the reviewer

All receipts and stdout/stderr are in [p0-claude-w1-review-20261027](../testing/p0-claude-w1-review-20261027/). UTC command intervals and exit codes are retained per attempt. DB-related environment variables were removed for the selected tests.

| Check | Reviewer result | Limit |
|---|---|---|
| Scoped Go core/domain/policy/service, product HTTP, identity lookup and repository contract tests, `-race -count=1` | 176 test/subtest passes in the initial invocation; verifier package hit sandbox loopback bind denial | No PostgreSQL fixture execution |
| ZITADEL verifier unit package after normal approved sandbox escalation | 25 pass / 0 fail / 0 skip; exit 0 | Synthetic httptest IdP only |
| Combined successful disjoint Go test scopes | 201 test/subtest passes | Not `make check`, not all PG tests |
| `go build ./...` | Exit 0 | Compilation only |
| `pnpm check` | Exit 0; 24 files / 180 tests pass, type/lint/format/agent checks pass | No browser/UI-to-PG path |
| `pnpm build`, initial and normal escalation retry | Both exit 1: Turbopack creating a process/binding a port → Operation not permitted | VERIFICATION_BLOCKED by local execution restriction; author's previous build PASS not independently reproduced |
| Three synthetic function probes | All three defects above reproduced | No live IdP, browser, DB or network |

The initial loopback denial is retained, not rewritten as a product failure. Escalation fixed the synthetic Go test environment; it did not fix the frontend build restriction. No alternative bundler, browser, proxy, cache clearing or permission bypass was attempted.

## Dependencies and next action

The author reports a real ZITADEL client redirect-URI rejection and uncertain user-token audience; these are not independently reproduced by this read-only intake. No bootstrap credential was read and no IdP configuration was changed. A scoped operator correction and a permitted real login remain prerequisites for auth E2E acceptance. Author PG/full-gate/live-smoke claims are attributed to the author; this review did not rerun them or bind them to new raw PG receipts.

Actual Claude Code should repair CW1-F01..03 within the existing assignment, then continue all W2–W7 implementation and applicable nonbrowser tests without waiting for another planning pass or a per-wave review. Maintain a current owner/status/checkpoint in the single workboard: its top-level ZCode owner and intake-era checkpoint are stale even though its execution-owner block correctly names Claude. Carry the IdP and browser limitations separately; they do not block unrelated domain implementation. Consume only an appropriately reconciled design input and retain unfinished design findings.

One consolidated final candidate must still provide both stacks, exact AC/NFR/GW coverage, reproducible redacted raw receipts, source manifest, runtime instructions and remaining verification blockers. No independent acceptance, MC-002 DONE, Step 03B, production deployment, cost or recovery approval is granted here.

Skipped: product source fixes, PG/IdP administration, live integrated login, browser/render/accessibility/human study, resource lifecycle, Git mutation and agent dispatch. Remaining risk: ambiguous command recovery and login redirect handling require correction; most product waves and end-to-end verification are still missing.
