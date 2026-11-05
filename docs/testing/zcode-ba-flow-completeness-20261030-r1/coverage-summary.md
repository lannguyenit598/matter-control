# Coverage summary — MC-ZCODE-BA-FLOW-COMPLETENESS-20261030-r1

Status vocabulary: COMPLETE (verified this run: live HTTP and/or `-race` test run on memory+PG) / PARTIAL (verified with named limits) / MISSING / NOT_VERIFIED. "UI" always means a rendered browser session: **UI NOT_RUN for every flow** (no synthetic IdP passwords without reading secret files; browser login blocked per prompt §1). Component/page tests in the tree (green per the remediation task's receipts) are cited as source-level support, not as UI observation.

## Per P0 requirement (REQ-MC-P0-01..20)

| REQ | Flow(s) | Verdict | Basis |
|---|---|---|---|
| 01 Requirement/Action split | F05 | COMPLETE | Live GW-01/02: action completion never verifies; SuiteGW assertion green memory+PG |
| 02 Workstream/Milestone readiness | F04 | COMPLETE | Live milestone + prerequisites PUT + control-room readback; RULE-008 tested (SuiteGW) |
| 03 My Actions scoping | F12 | COMPLETE | Live `/me/actions` own-scope; RULE-021 ordering contract-tested; UI rendering NOT_RUN |
| 04 Waiting-On model | F06 | COMPLETE | Live WAITING (owner+party+condition) → `/waiting-on` entry; WAITING ≠ BLOCKED (`dependency: READY`, `attention: WAITING`) |
| 05 Dependency/Blocker gates | F06 | COMPLETE | Live 409 `dependency-blocked` with gates; cycle 409 with path; self/duplicate/cross-matter SuiteGW green |
| 06 Evidence criteria | F07 | COMPLETE | Live criteria create/revision rules incl. `outcome-criterion-not-applicable`; SuiteBF green |
| 07 Independent verification | F07 | COMPLETE | Live: self-assess 409, undesignated refusal (SuiteBF), designated verifier ACCEPT/REJECT, epoch/stale guards (`stale-review`, `version-not-current`) |
| 08 Append-only history | F14 | COMPLETE | Brief rebuilt 29 changes from history; corrections append; SuiteW6 green |
| 09 Control Room comprehension | F12 | PARTIAL | Live consistent snapshot readback (all sections, one boundary); AC-137 protocol with real users NOT_RUN (needs humans + browser) |
| 10 Grid + metadata | F12/F05 | PARTIAL | Live grid/PATCH/CAS 412; keyboard-only AC-150 and 200-row browser perf NOT_RUN |
| 11 Concurrent edit CAS | F05/F15 | COMPLETE | Live stale If-Match 412 + unchanged readback; If-Match semantics contract-tested |
| 12 Bulk preview→commit | F13 | COMPLETE | Live commit 200 per-row receipt; preview via SuiteW6 (request-shape doc drift → ZBA-F01); partial-success tests green |
| 13 Import | F13 | PARTIAL | Live import preview (per-row errors); commit/idempotent re-import via SuiteW6 tests green; HTTP commit not re-run |
| 14 Export axes | F13/F14 | COMPLETE | Live CSV: execution/dependency/verification columns distinct; VIEWER scope per approved matrix |
| 15 Document version/signature | F08 | COMPLETE | Live versions, promotion (+impact token), exact-version signatures; AC-128 supersession SuiteGW green |
| 16 Filing lifecycle | F09 | COMPLETE | Live 9-stage walk incl. 2 cycles, receipt≠approval, negative outcome, closure, reopening |
| 17 Parties/context records | F11 | COMPLETE | Live party + WAITING linkage; FINDING/RISK/DECISION/ENTITY records; no accounts for parties |
| 18 Tenancy/permissions | F02/F03/F16 | COMPLETE | Live uniform 404 outsider, 403 role denial, workspace-OWNER-no-membership SuiteBF; revocation SuiteBF |
| 19 Delta brief | F14 | COMPLETE | Live window/changes/targetLabel; no-change + access-loss SuiteW6; invalid window 400 |
| 20 Five state axes | F16 | COMPLETE | Export/reads keep axes distinct; AC-160 generated transition cases green; visual UI NOT_RUN |

**Score: 18/20 P0 COMPLETE, 2/20 PARTIAL (REQ-09, REQ-11 — both limited by human/browser verification, not by implementation).**

## Per golden workflow

| GW | Verdict | Notes |
|---|---|---|
| GW-01 Transaction | COMPLETE (HTTP tier) | Full chain: approval requirement → evidence → independent verification → document versions/promotion → signatures on exact version → critical milestone prerequisites → control-room readiness; probes 13–20 above |
| GW-02 Due Diligence | COMPLETE (HTTP tier) | Request-completed ≠ verified; v1 claim REJECTED → gap → finding → follow-up WAITING on external party → v2 promoted (impact token) → ACCEPTED → VERIFIED; stale-version guard; review grid answer recorded |
| GW-03 Regulatory Filing | COMPLETE (HTTP tier) | 9-stage machine with 2 supplement cycles; receipt ≠ approval at every readback; BF-01 split live (PARTIALLY_VERIFIED/PENDING → VERIFIED/ACCEPTED); negative outcome + closure + reopening; no-proof variant (BF-02) fully reachable |

**3/3 golden workflows walked end-to-end over HTTP; 0/3 walked in a rendered UI (UI NOT_RUN).**

## Per flow (F01..F16 + extras)

F01 PARTIAL (bearer path live with synthetic stub; real-IdP SSO login NOT_RUN — no synthetic passwords without reading secret files; uniform 403 for unprovisioned identity is test-covered, live probe only covers active-false → 401). F02–F10 COMPLETE (limits noted in journey-walkthroughs.md). F11–F16 COMPLETE except F13 PARTIAL (import commit not re-run over HTTP; test-verified) and F12/F11 noted above. F-extra FE-01 (discovery read model) COMPLETE live; FE-02 (review queue) COMPLETE live.

## Explicitly not verified this run

1. Any rendered-UI behavior: login page, BF-06 landing redirect, BF-07/09 screens, BF-10 rendered draft, a11y/keyboard (AC-150/151/152), 200-row picker/perf (BF-04 at scale), timezone form UX (BF-03 at the form).
2. Real ZITADEL introspection path (stub IdP used; the real path is exercised by ops scripts and HTTP tests elsewhere).
3. Live `OUTCOME_UNKNOWN` 503 + reconciliation (test-verified only).
4. Import commit over HTTP (test-verified only) and export XLSX binary content (CSV verified live).
5. AC-137 comprehension protocol with human participants.
