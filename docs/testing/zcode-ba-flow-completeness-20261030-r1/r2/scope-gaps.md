# Scope gaps vs approved baseline — attempt r2 (Bước F)

Boundary: comparisons against the approved P0/P1/P2 register (`docs/requirements/p0-p1-p2-priorities.md`), the approved rules/ACs, and the remediation's own declared limits. No new capability is proposed beyond the baseline; anything beyond baseline is listed as an observation, not a recommendation to keep or cut (that is a PO decision).

## P0 present and verified (nothing MISSING)

All 20 P0 capabilities have an implemented, exercised API surface (coverage-summary.md). No approved P0 flow lacks a reachable path; the three Golden Workflows complete end-to-end at the API tier.

## Where implementation exceeds the approved P0 (already-built P1-adjacent pieces)

1. **Review grids (F10)** — a Matter-scoped grid of exact document versions × versioned questions with append-only cited answers and per-cell history. The baseline places this near REQ-MC-P1 (management-ready exports/saved views; GW-02 needs only typed findings). It is implementation beyond P0, working and suite-covered; scope governance (keep as early P1 slice vs trim) is a PO call.
2. **Cross-workspace Matter discovery (`GET /matters`, BF-08)** — a new read model added during remediation (BF-08 was classified a recommendation). Beyond the original P0 list; bounded (title search only, no owner/attention facts) and authorization-first.
3. **Verifier review queue (`GET /me/reviews`, BF-05)** — likewise a remediation-added read model supporting the approved Review-and-prove journey; beyond the minimal P0 read set but within BR-005/BR-003 intent.

## P0 areas with incomplete verification (not implementation gaps)

- AC-137 comprehension protocol (humans), AC-150/151 keyboard/screen-reader, AC-154 measured performance, AC-156 rendered unavailable-vs-empty states, AC-152 rendered localization — all require a rendered UI/humans/budgets and remain NOT_RUN in r1 and r2. These are verification debts, recorded as PARTIAL in coverage.
- Live `OUTCOME_UNKNOWN` drill (Z-NV-01) — recovery QA track.
- Real-ZITADEL SSO login path (F01 UI half) — blocked by the no-secrets rule for synthetic passwords; needs the credential owner.

## Approved-policy decisions still open (not defects)

- **D-BF1** (remediation): must APPROVAL require a declared OUTCOME criterion on proof-required filings? r2 adds evidence for deciding it: today a filing can be approved with the aggregate reading VERIFIED while `outcomeVerification=NOT_DECLARED` (disclosed on filing surfaces, not in Grid/Control Room — Z-F-03).
- Numeric workload/retention/RPO/RTO remain PO-deferred (OBD-09/11) — untouched by this review.

## Golden-workflow needs with no P0 item shielding them (the r2 additions)

1. **Z-F-01** — package completeness (RULE-012) can be vacuously satisfied; GW-03's "package prepared" step has no structural floor. Needs the state-semantics filing-table row + guard change; currently only the proof-read disclosure stands between a manager and an empty "submitted" package.
2. **Z-F-02** — signature completeness (RULE-011) has no recognizable criterion kind for proof-required filings; GW-01's partial→full signature story works when criteria are declared honestly, but the system cannot tell a signature criterion from any other. Needs a business-level definition (which the approved semantics already imply) and a guard.

Neither gap lets false verification through (verification stays criteria-driven and independent), so both are P2 — but both sit exactly on the "completion/evidence discipline" principle the product is positioned on, which is why they are raised rather than noted.

## Explicitly not raised

- Export/brief formatting depth (P1-13 management-ready export, P1-14 snapshots) — correctly absent.
- Advanced findings/risks, entity master, signature tracking automation (P1-08/09/05) — correctly absent; the minimal typed context records satisfy RULE-020.
- Anything AI/assistive — later phase per PO 2026-10-29.
