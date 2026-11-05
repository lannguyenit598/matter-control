# Return — MC-ZCODE system/multi-tenancy audit (Phase A of the combined assignment)

Actual identity: ZCode session (model account:zai-start-plan/GLM-5.3-Flash) in the combined System-Review-then-Solid-Glass assignment. Candidate: branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086`, uncommitted tree pinned to 763 files (`inputs-manifest.json`), copied byte-verified into an isolated review workspace. No shared product source was modified by this audit; all writes are inside this namespace. Reviewer-added probe code lives only in the isolated copy (`audit_cross_scope.go` + two runner registrations) and is listed here.

## Authorship declaration

- AUTHOR_REVIEW (this session previously implemented): the Review Matrix correction packet (frontend `features/review` files incl. answer-form/cell-detail/review-access, `IntentForm.onAccessLoss`, `lib/mc/drafts.ts` scope purge; backend review port/service/HTTP/stores/sqlc + tests) — 26 files per the rework manifest, since consumed and intake-verified by Codex.
- NONAUTHOR (fresh review, fresh tests): everything else — W1..W6 domains/services/stores/HTTP, migrations 0001-0007, identity/verifier, object storage, policy, frontend shell/other features, composition root.

## RMV-F01..04 focused rereview verdicts (corrected bytes, per the intake addendum)

| Finding | Verdict | Proof and limits |
|---|---|---|
| F01 expectation presence | CORRECTED_SOURCE_CONFIRMED + independently re-run here: absent/null→428 after gates, explicit ""→201 empty cell, wrong type→400, stale→412, refused key not consumed, 401/403 precedence unchanged | `TestReviewGrid_HTTPAnswerExpectationPresence` in the 656-run suite; hidden-resource semantics re-read from code (uniform not-found for nonmember/revoked; the historical 403 for a resolvable non-member ghost identity is the standing documented class) |
| F02 UNKNOWN command fidelity | CORRECTED_SOURCE_CONFIRMED: frozen values now include CAS facts via hidden fields; cell-scoped draft key survives props refresh and remount; discard-only new intent | `answer-form.test.tsx` (4) among the 88×3 isolated frontend runs |
| F03 bounded truthful history | CORRECTED_SOURCE_CONFIRMED on real PostgreSQL: keyset `(answered_at,id)`, limit+1, `total:null`, cursor 400s, per-page re-auth, oldest reachable, foreign cursor cannot leak (reviewer probe) | 101/205-class HTTP traversal tests + `SuiteReview` + audit probe, both stores |
| F04 denial clears protected surface | CORRECTED_SOURCE_CONFIRMED at component level; rendered second-user revocation remains NOT_RUN | `cell-detail.test.tsx` (8) in isolated runs; browser journey blocked (A-06) |
| Timing regressions | AUTHOR test-fix diagnosis accepted as mechanism-explained: wait-until-enabled retained assertions; 3 clean isolated repeats ×88 tests under worker concurrency; not a universal reliability proof | `audit-frontend-repeat.log` |

Preserved qualifications: the author's literal `pnpm check` failure on two Mimosa state files is not reported as green; the author's 640/707 receipts stay author evidence; the fixture prose port erratum is noted as benign.

## Multi-tenancy conclusion (headline)

**SUPPORTED_WITH_LIMITS at Workspace+Matter level; organization-level SaaS tenancy NOT_SATISFIED (absent by design).** The product implements workspace-level logical multi-tenancy with explicit confidential Matter membership; the boundary holds end to end in the audited source and 656-run test suite (9 negative-case classes executed fresh, both stores; PG 18.6 fixture label `MC-ZCODE-SYSTEM-MULTITENANCY-AUDIT`, removed after). It is not certified — and is not built — for multiple independent customer organizations sharing one issuer: no organization entity exists (A-03) and the only people-discovery surface is issuer-wide behind a local-only flag (A-02).

## Top findings (full detail in findings.json / remediation-plan.md)

1. **A-01 (P2, CONFIRMED, reproduced on both stores):** service-layer receipt replay is not matter-scope-bound; the product HTTP boundary mitigates via the URL-path fingerprint. Smallest fix + regression provided.
2. **A-02 (P2):** local people directory is issuer-wide; needs non-local deployment gating + eventual org scoping.
3. **A-03 (P2, decision-required):** no organization/customer entity — one Workspace per customer firm is the current model.
4. **A-04 (P3):** no RLS; application-enforced isolation only (demonstrated correct; depth-of-defense gap).
5. **A-05 (P3):** review schema defense-in-depth minors unchanged (recorded follow-up).
6. **A-06 (INFO/BLOCKED):** browser/live-uptake checks NOT_RUN — needs runtime-owner handoff; the retained API is not the corrected binary.

## Execution summary

- Backend on the isolated copy with a fresh PG fixture: `go test -race -count=1 ./...` → **656 passed / 0 failed / 20 packages** (includes standing contracts on memory+PG, review suites, HTTP adversarial, and the reviewer-added cross-scope probes).
- Frontend on the isolated copy: review+proof+organisms+timing set ×3 → **88 tests × 3, all pass**.
- 18-case tenant isolation matrix: 9 PASS_REVIEWER_RUN, 6 source-confirmed classes, 1 FINDING_CONFIRMED (A-01), 1 NOT_RUN (browser), 1 PASS_ISOLATED_TESTS_BROWSER_NOT_RUN — see `tenant-isolation-matrix.json`.
- Cleanup: audit PG container+volume removed after label check; isolated copy and its GOCACHE retained at `/private/tmp/mc-zcode-audit-20261029-r1/` until Phase C consumes it, then removable; secrets dir 0700/0600 (no values in evidence).

## Next exact action

Codex/non-author intake of this packet; schedule A-01; provide the runtime handoff to unblock browser checks. Then Phase B/C of the combined assignment continues in this session (Solid Glass research/plan done next; shared-file implementation blocked behind the active Codex UI-fidelity writer until an actual handoff).

Skipped: commit/push/deploy, retained DB/runtime use, real R2/IdP, production claims, mutation of other writers' work. Residual risks: source/local proof cannot certify production multi-company readiness; the audit binds to pinned bytes and needs a delta rereview after the implementation sessions finish.
