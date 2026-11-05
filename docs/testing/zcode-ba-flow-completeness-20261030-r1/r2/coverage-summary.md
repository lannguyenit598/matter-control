# Coverage summary — attempt r2

Verdict vocabulary: COMPLETE (implemented and verified at the stated tier) / PARTIAL (verified with a named boundary) / MISSING / NOT_VERIFIED (with reason). Tiers: **API** = executed live over HTTP in this run; **test** = green in this run's `-race` suite on the isolated PG; **UI** = rendered browser — NOT_RUN in both r1 and r2.

## Per P0 requirement (20)

| REQ | Flow | Verdict | Basis |
|---|---|---|---|
| 01 Requirement vs Action | F05 | COMPLETE (API+test) | live: action COMPLETED, requirement NOT_STARTED+UNVERIFIED |
| 02 Milestones | F04 | COMPLETE (API+test) | live: NOT_READY 0/3 with reasons; empty set = unassessed (suite) |
| 03 Next Action | F05/F12 | COMPLETE (API+test) | Control Room next=4 with reasons; RULE-021 order (suite) |
| 04 Waiting On | F06 | COMPLETE (API+test) | live: WAITING+READY, waiting-on view, owner guard |
| 05 Dependencies & blockers | F06 | COMPLETE (API+test) | live: AND gates, cycle+path, blocked completion, cancel-no-waiver, 412 stale |
| 06 Evidence requirements | F07 | COMPLETE (API+test) | live: criteria vs claims, MISSING vs PENDING_REVIEW reasons |
| 07 Evidence verification | F07 | COMPLETE (API+test) | live: independent verifier, reject/accept, expiry, dispute cycle |
| 08 Event history | F14 | COMPLETE (API+test) | brief replay 37 changes with seq/actor/label; corrections append (suite) |
| 09 Control Room | F12 | PARTIAL | live snapshot coherent; AC-137 human comprehension NOT_RUN |
| 10 My Actions | F12 | COMPLETE (API+test) | own-scope reads; BF-06 landing (source); revocation scoping (suite) |
| 11 Operational Grid | F12 | PARTIAL | API list/CAS verified live (incl. >200 honest paging); keyboard/200-row browser (AC-150) NOT_RUN |
| 12 Bulk editing | F13 | COMPLETE (API+test) | live: preview→commit, per-row SUCCESS/FAILURE(stale), failed row unchanged |
| 13 Import | F13 | COMPLETE (test) | W6 contract suites green memory+PG; HTTP import commit NOT_RUN (also r1) |
| 14 Excel export | F13/F14 | COMPLETE (API+test) | live: axes distinct, VIEWER allowed, formula-escaping `'=1+2` |
| 15 Document versions | F08 | COMPLETE (API+test) | live: upload≠promotion, supersession invalidates current-version claim, signatures per version |
| 16 Filing lifecycle | F09 | COMPLETE (API+test) | live: 9-stage machine, supplement cycle, receipt≠approval, negative path, reopen — with Z-F-01/Z-F-02 defects recorded |
| 17 External parties | F11 | COMPLETE (API+test) | live: party + waiting link, no accounts |
| 18 Roles & ownership | F02/F03/F16 | COMPLETE (API+test) | live: 403/404 uniform, workspace-member-without-matter → no data, verifier designation |
| 19 Delta brief | F14 | COMPLETE (API+test) | live: changes vs outstanding, targetLabel, window rules (suite) |
| 20 Separate state dimensions | F16 | COMPLETE (API+test) | live: five axes distinct everywhere incl. waiting-on view and export |

**Total: 18/20 COMPLETE, 2/20 PARTIAL, 0 MISSING.** Both PARTIALs are bounded by humans/browser (AC-137, AC-150/151), not by implementation evidence.

## Per golden workflow

| GW | API tier | UI tier |
|---|---|---|
| GW-01 Transaction | **Walked end-to-end** (r2 live) | NOT_RUN |
| GW-02 Due diligence | **Walked end-to-end** (r2 live) | NOT_RUN |
| GW-03 Regulatory filing | **Walked end-to-end incl. supplement cycle + negative path + reopen** (r2 live) | NOT_RUN |

## Per flow (F01–F16 + F-extra)

F01 PARTIAL (bearer path live via stub IdP; SSO UI NOT_RUN) · F02 COMPLETE (API) · F03 COMPLETE (API, incl. discovery) · F04 COMPLETE (API) · F05 COMPLETE (API) · F06 COMPLETE (API) · F07 COMPLETE (API) · F08 COMPLETE (API) · F09 COMPLETE (API, defects Z-F-01/02 recorded) · F10 COMPLETE (test; API surface read, review-grids suites green) · F11 COMPLETE (API) · F12 PARTIAL (API complete; UI NOT_RUN) · F13 COMPLETE (API for bulk/export; import API NOT_RUN, suites green) · F14 COMPLETE (API) · F15 PARTIAL (replay+unknown-key live; live OUTCOME_UNKNOWN NOT_VERIFIED) · F16 COMPLETE (API, observations Z-OBS-03/04) · FE-01 (discovery) COMPLETE (API) · FE-02 (review queue) COMPLETE (API).

## Bước D trap ledger (20 seeded)

Executed live in r2: D1 (action≠verification), D2 (+filing outcome variant), D3 (expiry), D4 (+supersession), D5 (receipt≠approval; reference-required; signature-required; approval-refusal), D9 (cycle), D10 (blocked completion), D11 (cancel-no-waiver), D13 (idempotency), D15 (stale CAS), D17 (bulk partial), D18 (formula escape), D19 (>200), D21 (timezone instant), VIEWER×3, non-member×2, F15 unknown-key ×2 — **19 of 20 seeded traps exercised live** (several were split across sub-cases). NOT executed live: D22/D23 (navigation-context/unsaved-changes — UI tier; supported by author page tests), and OUTCOME_UNKNOWN fault injection (Z-NV-01). No trap produced a false success except the two recorded defects (Z-F-01, Z-F-02 signature asymmetry) and the two P3 observations.

## Cross-attempt note

r1 (parallel session, `../coverage-summary.md`) reached 18 COMPLETE / 2 PARTIAL with 7 P3 findings; r2 independently corroborates that coverage and adds 3 P2 findings (Z-F-01..03) that r1's walkthrough did not hit (r1 did not probe an OUTCOME-only criteria set, the signature-asymmetric submission, or the grid-level outcome disclosure). The two attempts agree on all BF recheck verdicts within the live/source-only granularity difference explained in findings.md.
