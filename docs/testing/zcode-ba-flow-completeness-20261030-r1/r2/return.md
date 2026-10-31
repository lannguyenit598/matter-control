# Return — MC-ZCODE-BA-FLOW-COMPLETENESS-REVIEW-20261030 (attempt r2)

**Status proposed: `BA_REVIEW_RETURNED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS`.** Business-analyst review by **actual ZCode acting as BA** (GLM-5.3-Flash session model on the ZCode harness, 2026-10-30/31). **`BA_REVIEW (author-adjacent)`** — ZCode authored part of the backend under MC-P0-ZCODE-EXECUTION, so nothing here is an independent QA PASS; OpenCode still owns independent verification. No "PASS độc lập", "DONE", "DEPLOY_READY" or "production-ready" claim is made. No commit/push/merge/deploy; no cloud/IdP/billing change; no secret touched; **no tracked source file changed by this attempt** (drift in the window is other sessions' — see source-manifest.json).

This namespace already held a completed **r1 attempt by an earlier parallel ZCode session** (`../return.md`, 7 P3 findings). Per the assignment rule the r1 files are untouched; everything in `r2/` is this second independent pass. r1's Step-A artifacts it cited (`../flow-inventory.md`, `../traceability-matrix.csv`) were authored by this task's first session and are reused by both attempts.

## 1. Identity, base, drift

- HEAD at start and close: `0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee` (unchanged). Dirty tracked diff: `5b086afe…` (106 files) → `2c8ef445…` (118 files) across the window — **concurrent sessions were writing the repo** (a deploy-readiness scope: `ops/deploy/*`, `.github/workflows/frontend.yml`, `b1_least_privilege_test.go`; plus r1's own namespace writes). Attribution and hashes: `source-manifest.json`. All finding anchors (`filing.go:355-364/379-394`, `discovery.go`, `server.go`, FE files) were **re-verified in the drifted tree before findings were finalized**; hashes of the 19 key files at close: `commands/read-file-hashes.txt`.
- Runtime built for evidence: `mcapi` from this tree (go1.27.3) on `127.0.0.1:18081`; fresh isolated PostgreSQL 18.6 container `mc-ba-flow-pg` (label `mc.owner=zcode-ba-flow-review`, DB `mc_ba_flow_r1`, migrations v9 incl. `0009_criterion_purpose`); synthetic introspection stub IdP on loopback 18099 with a key pair generated for this runtime (protects nothing, replaces no real IdP). No other agent's runtime/DB/secret was read, stopped or migrated; the fixture password stayed in mode-600 scratch files outside Git.

## 2. What ran vs what was only read

- **Ran (this attempt):** full backend suite `go test -race -count=1 ./...` against the isolated PG — **exit 0, all 14 packages ok, 0 FAIL** in this run's window (r1's later window recorded 5 failures in the concurrent deploy task's `TestB1LeastPrivilegeProfile` — out of BA scope, owner active; both records stand for their windows).
- **Ran (this attempt): 570 live HTTP calls** walking **GW-01, GW-02, GW-03 end-to-end** with five synthetic principals (OWNER / EDITOR submitter / EDITOR+designated verifier / VIEWER / workspace-member-without-matter), plus trap batches: bulk preview→commit with a stale row, >200-item honest pagination, export formula-escaping, timezone instant round-trip, receipt replay + unknown-key recovery probes, AC-145 negative-outcome refusal, filing-machine guard probes (package-criteria-required, signature-required, reference-required, not-verifier).
- **Read only:** BF-03/06/07/09/10 FE screens (source + author page tests), review-grids UI, contract docs. The rendered browser UI was **NOT_RUN** in both attempts — no browser tooling was used and real-IdP login is blocked by the no-secrets rule for synthetic passwords (prompt §1); recorded as blocked, not as product failure.

## 3. Findings (r2)

- **BF-01..BF-10: 7 CLOSED_VERIFIED (live), 3 CLOSED_SOURCE_ONLY, 0 OPEN, 0 REGRESSED** (r1: 5 live / 5 source-only; r2's deeper GW-03 pass moved BF-02/05/08 to live). Details and per-finding evidence: `findings.md`.
- **New: 0×P0, 0×P1, 3×P2, 4×P3:**
  - **Z-F-01 (P2 DEFECT)** — a proof-required filing can reach SUBMISSION with an **empty declared package** (single OUTCOME criterion satisfies the purpose-blind criteria guard; `package.declared=false` disclosed but not blocking). Live-proven (filing F).
  - **Z-F-02 (P2 GAP)** — for proof-required filings the signature gate accepts any satisfied mandatory criterion; no signature-specific criterion kind exists, so submission can pass with zero signature observations (live: filing A). No-proof filings ARE guarded.
  - **Z-F-03 (P2 GAP)** — `outcomeVerification:NOT_DECLARED` disclosure verified live on filing surfaces, but Grid/Control Room keep the package-driven aggregate (corroborates remediation §9; PO decision D-BF1 open).
  - P3: Z-OBS-03 (400-before-403 error precedence on receipted commands, 2 live instances), Z-OBS-04 (stale-If-Match members grant → 403 instead of contract's 412, 1 live instance), Z-OBS-05 (WAITING needs owner via separate PATCH — corroborates r1 F-06), Z-NV-01 (live OUTCOME_UNKNOWN drill NOT_VERIFIED; replay/unknown-key paths verified live).

## 4. Coverage

- **18/20 P0 COMPLETE, 2/20 PARTIAL** (REQ-09 bounded by AC-137 human protocol; REQ-11 by keyboard/200-row browser verification) — matches r1 independently. 0 MISSING.
- **3/3 Golden Workflows walked end-to-end at the HTTP tier; 0/3 in a rendered UI (UI NOT_RUN).**
- Bước D: **19 of 20 seeded traps exercised live**; D22/D23 (navigation/unsaved-changes) are UI-tier — author page tests only; OUTCOME_UNKNOWN fault injection NOT_VERIFIED.
- Per-flow: F01 PARTIAL (SSO UI), F12/F15 PARTIAL as above, all others COMPLETE at the API tier — `coverage-summary.md`.

## 5. Not independent, and what remains open

All verdicts are author-adjacent executions. Open after r2: rendered-UI verification of BF-03/04/06/07/09/10 + a11y/keyboard; AC-137 with humans; real-ZITADEL SSO path (credential owner); live OUTCOME_UNKNOWN drill; import commit over HTTP; the concurrent deploy task's B1 test failures (other owner); PO decisions D-BF1 (undisturbed) and now the two new filing guards (Z-F-01/Z-F-02) which need a state-semantics amendment + PO acceptance before any code change.

## 6. Checks skipped and residual risks

- Skipped: browser/e2e (no credential path), XLSX binary content check, load/perf, Playwright, import-commit HTTP pass, jurisdictional legality of any content.
- Residual risks: (1) rendered-UI regressions would not be caught by either attempt; (2) the runtime used a stub IdP, so real ZITADEL introspection shapes/revocation windows are untested here; (3) concurrent sessions modified the tree during the review — flow-logic anchors were re-verified at close, but per-file byte-level pinning across the whole window was not possible; (4) Z-F-01/Z-F-02 give editors a legitimate-looking path to record submissions that lack a complete package/signature basis until the guards are corrected.

**Next status proposal:** task `MC-ZCODE-BA-FLOW-COMPLETENESS-REVIEW-20261030` → IN_REVIEW (two attempts returned; findings routed to PO/Claude-architect for disposition; no fix authorized by this review).
