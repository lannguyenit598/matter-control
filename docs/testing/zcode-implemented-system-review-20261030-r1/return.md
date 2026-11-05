# Return — MC-ZCODE-IMPLEMENTED-SYSTEM-REVIEW-20261030 (r1)

- **Reviewer/actual identity:** actual ZCode, dedicated review session (invoked in-session; no external agent claimed, no other session contacted).
- **Authorship boundary (declared):** this reviewer's lineage authored most of the reviewed chains (phase-C backend, ui-ux, liquid-glass, SQL/A-006 evidence sets). This is therefore an **author-review**: it can classify, verify gates, reproduce probes and bind evidence, but it cannot serve as the independent acceptance for the chained deliverables. Independent acceptance is reserved for a non-author reviewer (OpenCode QA or an independent session), explicitly requested below.
- **Candidate base/head:** branch `codex/unified-project-flow`; HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`; head-of-record = dirty worktree (uncommitted) bytes, hash-bound via `source-manifest.csv` (1,096 entries) with terminal **drift 0** (`drift-report.md`); checkouts untouched for governance/doc entries (their 323 workspace entries re-hash 0-drift).
- **Boundary held:** no application source changed (only the snapshot-only A-01 probe, 4 declared files, removed-with-snapshot policy applies); no commits/pushes/deploy; no paid/provider actions; synthetic data only; secrets confined to a scratch file now destroyed.

## Findings first (details + evidence in `findings.md`)

| ID | P | One line |
|---|---|---|
| R-01 | P1 | `/`→`/dashboard` redirect shadows the real entry (`page.tsx`→`/workspaces`) → fresh entry 404 |
| R-02 | P2 | Cross-matter command-receipt replay accepted at the service layer (probe reproduced on memory + PG); HTTP admission fingerprint mitigates |
| R-03 | P2 | `MC_OIDC_CACHE_TTL` default 15s vs ADR-004-D4/ADR-005-approved 30s — approval/config mismatch (decision required) |
| R-04 | P3 | `make check` FAIL on reviewed bytes: gofmt (`matter_test.go:5`) + errorlint (`explain_access_paths_test.go:223` `%v`) — suite 708/0/4 still green |
| R-05 | P3 | `durable-session-events.json` is a captured go error, not the PASS receipt cited by two docs; semantics independently PASS via race run |
| R-06 | P3 | `readiness-matrix.md` cites nonexistent `ci-cd-templates.md` (actual: `ci-cd-and-runbook.md`) |
| R-07 | P3 | Unread review filter raw `<button>` (`review-filters.tsx:63`) — still open from ui-ux chain |
| R-08 | P3 | Storybook runtime build FAIL — product liquid-tier visual verification remains impossible |
| R-09 | P3 | EXPLAIN note: 0009 regressed `CountAccessibleMatters` at scale-1 (0.227→8.233 ms); ReviewHistoryCell ~20× better; no code action |

## Per-area verdicts

- **A — Workflows/API (92 routes):** IMPLEMENTED_SOURCE + LOCAL_VERIFIED where the race suite exercises contracts (products, receipts in-matter, W6, multipart integrity). Not an exhaustive handler-by-handler review (unsampled list in matrix).
- **B — Isolation/security:** auth admission and 10 × `requireSession` feature actions source-verified; OIDC browser/IdP journey NOT_RUN; B1 least-privilege PASS_SCOPED locally (56 pass/0 fail events); R-02 is the one confirmed isolation-adjacent gap at the service layer (HTTP-mitigated); MFA/assurance NOT_RUN.
- **C — PostgreSQL/migrations:** 0001–0008 apply cleanly; sqlc pinned check PASS; durable-session reference semantics 4/4 PASS on race run; B1/B2 evidence binds to bytes; 0009 drafted-not-applied (intentional); durable-session receipt mislabeled (R-05).
- **D — FE/UI-UX:** typecheck/lint/format/agents + 80 files/720 tests + both builds (turbopack, webpack) PASS incl. CSS guards; Solid Glass shipped and jsdom-verified; entry journey broken (R-01); liquid tier product rendering NOT_RUN; a11y NOT_RUN.
- **E — Deploy/storage/recovery/cost:** container profile PASS_SCOPED (ADR-006); adapter PoC PREPARED_NOT_EXECUTED; provider legs NOT_RUN pending stage-2 authorization; strict-$0 NOT guaranteed (fresh allowance checks); stage-1 packet correctly requests PO decisions — nothing is deployable from this state without authorization.

## Verified vs unverified completion (of the reviewed chains)

- **Verified by this review (executable proof, exact gates):** backend `sqlc-check` PASS; `go mod tidy -diff` PASS; `go test -race` 708/0/4 on PG 18.6 fixture (14 ok packages); EXPLAIN opt-in run; A-01 probe reproduction (both stores) + HTTP fingerprint mitigation; frontend typecheck/lint/format/test(720)/agents; both production builds + CSS guards; hash binding of all evidence + zero-drift; ADR-006 artifact manifests bind.
- **Unverified for independence:** all chain deliverables await non-author acceptance (post-this-review). **Unverified per scope:** handler-level semantics beyond tests, liquid product rendering, browser/a11y/IdP/second-user runs, managed-provider legs, adapter PoC.
- **Stale claims surfaced:** "backend gates green" (R-04 — red on reviewed bytes); receipt-file claims (R-05); nothing else contradicted bytes.

## Exact gates run (commands + exits in `verification-matrix.md`)

Backend: `make sqlc-check` 0 · `make check` 1 · `go mod tidy -diff` 0 · `golangci-lint` 1 · `go test -race -count=1 ./...` 0 (708/0/4). Frontend: typecheck 0 · lint 0 · format 0 · vitest 0 (80/720) · agents 0 · turbopack build 0 · webpack build 0 (+ CSS guards 0). Probes: A-01 memory/PG `EXIT=1` (reproduced) and fingerprint PASS. EXPLAIN opt-in 0. Fixture destroyed post-run (ownership/cleanup in same file).

## Next status

**Task status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS.** The review itself is complete with evidence; its acceptance is blocked on (a) non-author review of this return, and (b) the NOT_RUN verification set that this review was not authorized/suited to execute (browser/a11y, IdP journeys, second-user runtime, provider legs, adapter PoC). The implementation chains, if accepted by a non-author, carry **REWORK_REQUIRED** items R-01/R-02/R-03 (+trivial R-04/R-05–07, tooling R-08) via `remediation-handoff.md`. No DONE is proposed, by the prompt and correctly so.

## Limits

- Author-review only (independent acceptance outstanding) — the strongest structural limit of this review.
- No checkout freshness check of external repos (out of scope per prompt §2; HEAD + dirty tree pinned).
- Snapshot deletable artifacts: probe files live only in `/private/tmp/mc-implrev-20261030-r1/` (copied logs preserved here); the reproducibility contract for R-02 lives in the probe steps, which any session can re-materialize.
- Storybook ported baseline (R-08) not rerun; visual pipeline unverifiable until repaired.

## Direct answers (prompt §6)

1. **What is actually implemented and verified now?** A complete backend API surface (92 routes) with auth admission/multipart/timeout/in-flight shields, SQL layer + migrations 0001–0008, append-only receipts with in-matter idempotency and append-only triggers, least-privilege local profile — all passing a 708-test race suite on a real PG 18 fixture with zero drift; a complete frontend route surface with OIDC (PKCE/state/nonce, RS256 verify, opaque cookie) passing 720 unit tests and two production builds; ADR-006 stage-1 artifacts (container profile, durable-session SQL semantics, B1/B2) locally verified. Verified ≠ independently accepted: this review is author-bound.
2. **Which confirmed defects prevent normal use?** R-01: fresh entry `/` lands 404 (P1, one-line fix). Nothing else blocks normal HTTP use today; R-02 is mitigated at HTTP and is a contract/defense-in-depth gap; R-04 breaks the repo's own gate, not runtime; runtime users are otherwise unaffected per the 708-test suite.
3. **Which claims are design/probe-only?** Workers-side durable session store, B3 rate admission, B5 app-level sealing implementation, B7 purge function, Cloud Run profile, stage-2 plan, $0-cost feasibility, residency scope, and the adapter choice itself — all DESIGN/DECISION documents, not code. The adapter PoC is PREPARED_NOT_EXECUTED. Product liquid-glass rendering is declared implemented-source but has no product-tier rendering proof.
4. **What remains before Workers deployment?** (i) adapter PoC execution on workerd (script pinned), (ii) Workers-side implementation of the durable store + sealed-at-rest key service with writer handoff + independent security review, (iii) next.config/lockfile adoption of the chosen adapter, (iv) R-01 fix (entry), (v) stage-2 authorization under the packet's 6 PO decisions, (vi) authorized provider validation legs (R2/pooler/IAM/IdP/HTTPS), (vii) non-author acceptance of the above.
5. **What can be safely handed to an implementation owner next?** The fix bundle in order: R-01 (frontend writer), R-02+R-04 (backend writer, with the probe as the permanent test), R-05/R-06 doc receipts, R-07 (design system), R-08 (tooling owner) — all with concrete acceptance in the handoff; plus 0009 application only as a named deployment action after scale measurement.
6. **Skipped checks and residual risks.** Skipped (with reasons logged): browser/a11y/visual, IdP/auth runtime, real R2, Supabase/Cloud Run provider legs, Storybook runtime, adapter PoC, per-handler exhaustive line review, external-checkout checks. Residual risks: authorship overlap on this review, liquid-tier invisibility in automated tests while Storybook is red, cost/residency unknowns until stage-2, and the cross-matter receipt gap resurfacing through any future non-HTTP caller if R-02 stays unfixed.
