# Scope gaps — MC-ZCODE-BA-FLOW-COMPLETENESS-20261030-r1 (Bước F)

- Agent: actual ZCode acting as BA (author-adjacent). This lists gaps against the **approved P0 scope** only. Features beyond P0 that already exist (review grids F10, verifier queue `/me/reviews`, cross-workspace discovery) are recorded as beyond-baseline implementations, not gaps. New-feature wishes are excluded per prompt §4-F (see the persona improvement plan for those, as proposals).

## P0 approved scope: not fully satisfied

1. **AC-137 comprehension protocol (REQ-09)** — the Control Room/matter-brief comprehension bar ("answer state/cause/next/waiting/proof/milestone from the landing screen") requires real users and a rendered UI. Implementation and read model are complete; the acceptance evidence can only come from the human protocol. Not closable by any agent run alone.
2. **AC-150/151/152 keyboard-only + visual a11y (REQ-11/F16)** — component-level semantics exist (native `<details>`, focus management fixes in the tree), but keyboard-only walkthroughs and visual states of the new screens (BF-07/09/10 surfaces, icon disclosures) are NOT_RUN in a real browser.
3. **BF-03/BF-04 form-level UX in a real browser** — client-zone date entry and >200-record search picker are implemented with green unit/component tests; browser-scale verification remains open.
4. **AC-153 `OUTCOME_UNKNOWN` live reconciliation** — semantics fixed by contract + tests; a live lost-response drill (e.g., deliberate proxy fault) has not been executed in any recorded run.

## Implemented beyond the approved P0 baseline (recorded, not gaps)

- Review grids with per-cell history (P1 REQ-MC-P1 partial) — F10.
- Verifier pending-review queue `/me/reviews` + `/my-reviews` page (BF-05 remediation; read model extension).
- Cross-workspace matter discovery `GET /matters?q` (BF-08 remediation; bounded read model).
- Filing `outcomeVerification` display states (BF-01 remediation §9).

## Golden-workflow needs with no P0 owner item

None found: every step of GW-01/02/03 is reachable with the approved P0 capabilities (live walk-throughs). The only workflow-level residuals are the verification limits listed above, not missing capabilities.

## Boundary reminders carried from the review

- "receipt ≠ approval" and "action completed ≠ requirement verified" hold at every readback (live-verified). No flow allows a false success path found this run; the two contract-doc drifts (ZBA-F01/F02) are documentation-only.
- The open PO decision D-BF1 (require an OUTCOME criterion on proof-required filings) remains open from the remediation task and is NOT re-adjudicated here.
