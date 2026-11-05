# Return — MC-ZCODE-BA-FLOW-COMPLETENESS-REVIEW-20261030 (r1)

**Status proposed: `BA_REVIEW_RETURNED / IN_REVIEW_WITH_VERIFICATION_BLOCKERS`.** This is a business-analyst review by actual ZCode acting as BA. It is **`BA_REVIEW (author-adjacent)`**: ZCode authored part of the backend, so this is NOT an independent QA PASS; OpenCode still owns independent verification. No commit/push/deploy was made; source is unchanged by this review.

## 1. Identity, base, continuity

- Agent: actual ZCode (BA role), session of 2026-10-30/31, continuing this task's earlier r1 session (which left Step A artifacts: `flow-inventory.md`, `traceability-matrix.csv`).
- Base: HEAD `0de3e5d` + dirty tree = the Claude Code BF-01..10 remediation candidate (author-verified only) plus concurrent-session files. HEAD unchanged through the run. Tracked-diff drift during the window (`5b086afe…` → `21817f51…` → `76a07216…`) is attributable to concurrent sessions (UIUX audit writing its own docs + `project-status.md`; deploy-readiness session) — detailed in `source-manifest.json`.
- Runtime built for evidence: `mcapi` from this exact tree on `127.0.0.1:18082`, task-owned PG fixture `mc-ba-flow-pg` (migrations v9 incl. 0009), synthetic IdP stub (leftover of this task's earlier session, reused, not stopped). Fixture password kept in mode-600 scratch files outside Git; tokens are synthetic `tok-ba-*`.

## 2. What was executed vs only read

- **Ran for real** (this run): full backend suite `-race` against a fresh PostgreSQL fixture: **734 pass / 5 fail / 6 skip** — the 5 failures are `TestB1LeastPrivilegeProfile` (+4 subtests), the deploy-readiness task's own test failing on leftover profile-role objects and its `ops/adr006` relative read path in the shared container; out of BA scope, owner active. All ten `TestMatterSuite*_Postgres` contract suites (GW/BF/Review/W1–W7QA), migration-compat, rework and resolver tests green on memory AND PostgreSQL.
- **Ran for real** (this run): ≈150 live HTTP calls walking **GW-01, GW-02, GW-03 end-to-end** (5 synthetic actors: OWNER/EDITOR/verifier EDITOR/VIEWER/non-member) plus orientation probes (control room, `/matters?q`, `/me/actions`, `/me/reviews`, brief, export, import preview). Every call logged (UTC, status, body) under `commands/http-walkthrough/`.
- **Read only** (cited as such): remediation code paths for BF-03/04/06/07/09; frontend components/pages; contract docs.

## 3. Findings

- **BF-01..BF-10 recheck: 5 CLOSED_VERIFIED (live), 5 CLOSED_SOURCE_ONLY, 0 OPEN, 0 REGRESSED** — table with per-finding evidence in `findings.md`. The BF-01 package/outcome split is proven live end-to-end: `outcome-criterion-not-applicable` on a non-filing; submission gated by PACKAGE only (`guard-failed (MISSING)`); APPROVAL readback `verification: PARTIALLY_VERIFIED` + `outcomeVerification: PENDING`; then `VERIFIED`/`ACCEPTED` after the designated non-submitter's assessment.
- **New findings: 7, all P3** (0×P0, 0×P1, 0×P2): 2 DEFECT (contract-doc drift: bulk preview row shape, answers `questionRevision`), 1 GAP (workspace role vocabulary `OWNER|MEMBER` undocumented), 3 UX_FRICTION (brief `targetLabel` empty for membership events; minimal evidence-create response; WAITING needs owner via separate PATCH), 1 NOT_VERIFIED (live `OUTCOME_UNKNOWN` drill). No new P0/P1 business defect found in the implemented flows.

## 4. Coverage

- 20/20 P0 requirements concluded: **18 COMPLETE, 2 PARTIAL** (REQ-09 AC-137 human comprehension protocol; REQ-11 keyboard/200-row browser verification — both limited by human/browser availability, not implementation).
- 3/3 golden workflows walked end-to-end at the HTTP tier; **0/3 in a rendered UI (UI NOT_RUN)** — no synthetic IdP passwords were available without reading secret files (prompt §1 rule), so no browser login was attempted. Component/page tests from the remediation receipts cover the new screens' logic, cited as source-level support.
- False-success probes (Bước D): 15 of the 20 seeded traps exercised live over HTTP or via the `-race` suite run; the 5 UI-rendering traps recorded as UI NOT_RUN with their component-test support. Details in `journey-walkthroughs.md`/`findings.md`.

## 5. Not independent, and what remains open

- Author-adjacent limitation as declared above; all "CLOSED_VERIFIED" verdicts are author-verified executions, not independent QA.
- Open after this review: real-ZITADEL SSO login path; rendered-UI verification of BF-03/04/06/07/09/10 and a11y/keyboard; AC-137 with humans; live `OUTCOME_UNKNOWN` drill; import commit over HTTP; the deploy-readiness task's B1 test failures (other owner); remediation open PO decision D-BF1 (undisturbed).

## 6. Checks skipped and residual risks

- Skipped: browser/e2e runs (no credentials path without secrets), XLSX binary export content check, load/perf, Playwright, multi-jurisdiction legality of any workflow content.
- Residual risks: (1) all flow verdicts derive from the API tier + tests — a rendered-UI regression would not be caught by this review; (2) the fixture runtime used a stub IdP, so introspection edge behaviors (real ZITADEL response shapes, revocation windows) are untested here; (3) the shared fixture container carried another task's leftover roles — cleaned, but cluster-level hygiene in shared containers remains fragile; (4) concurrent sessions were writing the repo during the run — my claims about "source unchanged" are scoped to `apps/backend`/`apps/frontend` source and my own evidence namespace.
- Feeds `docs/implementation/plans/MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030.md` Phase 0 together with the parallel UX audit return.
