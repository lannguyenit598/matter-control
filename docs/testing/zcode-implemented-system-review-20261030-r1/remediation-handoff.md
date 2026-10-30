# Remediation handoff — findings from implemented-system review r1

From: actual ZCode review session (author-review). Evidence: `docs/testing/zcode-implemented-system-review-20261030-r1/`. Candidate: `codex/unified-project-flow` @ `20feedbf06c859a9806055d609f5b132fe8bb086` + dirty tree (hash-bound). This is a handoff **request-for-rework**, not an accepted-fix record; no fixes were applied during review (only a snapshot-only, reversible A-01 probe — files listed inside R-02 of `findings.md`).

## Root-cause dedup (6 distinct causes)

| # | Root cause | Findings |
|---|---|---|
| RC-1 | Stale route names surviving the `/dashboard`→`(app)` rename cycle (config + comments vs router reality) | R-01 |
| RC-2 | Receipt dedup key omits matter-scope binding at the service layer | R-02 |
| RC-3 | Gate hygiene drift after a return without declarations (gofmt import order + `%v`) | R-04 |
| RC-4 | Receipt-generation script invoked outside the Go module → error captured as "verified receipt" | R-05 |
| RC-5 | Approval-time config values later plumbed to code without ADR reconciliation (TTL) | R-03 |
| RC-6 | Visual/verification tooling (Storybook runtime) broke in a tooling-only change; product-tier visual claims became unverifiable | R-08, liquid NOT_RUN |

R-06 (filename pointer) and R-07 (raw button) are local one-line fixes under RC-4/known-consistency tracks; R-09 is measurement input, no root cause.

## Priority order + dependencies

1. **R-01 (P1, RC-1)** — remove/retarget `next.config.ts` redirect. No dependency. Owner proposal: frontend(Exciter) writer handoff (Antigravity is the current frontend execution owner; whoever holds the next.config writer handoff). Acceptance: build passes + a static next.config test/scan asserts every redirect destination exists; grep `*/dashboard` cleans config+comments.
2. **R-02 (P2, RC-2)** — matter-scope the receipt dedup at service layer. Independent of #1. Owner: backend (actual ZCode) with non-author reviewer. Acceptance: permanent test (memory + PG) asserting cross-matter same-key+hash replay refuses or scopes correctly — embed the probe steps in findings R-02 as test cases; suite green including new test; HTTP fingerprint behavior unchanged.
3. **R-04 (P3, RC-3)** — gofmt `matter_test.go` + `%w` fix at `explain_access_paths_test.go:223`. Trivial; do first since `make check` is the gate every other change must rerun through. Acceptance: `make check` exit 0 on the candidate tree, exact command in task evidence.
4. **R-03 (P2, RC-5)** — TTL 15s vs 30s: one PO-approved reconciliation (config→30s or ADRs→15s). Owner proposal: Codex (config/ADR writer) + PO approve; blocked on decision, not code.
5. **R-05 + R-06 (P3, RC-4)** — regenerate `durable-session-events.json` inside the backend module path; fix the two citations; rename/point `ci-cd-templates.md`→`ci-cd-and-runbook.md` in readiness-matrix row 9. Owner: doc owner of the ADR-006 chain or next DevOps session. Acceptance: receipts re-bound, citations corrected, manifest hash updated.
6. **R-07 (P3)** — Button primitive for the unread filter. Rides the frontend design-system owner. Acceptance: DOM assertion + story updated; a11y sweep re-run when tooling allows.
7. **R-08 (P3, RC-6)** — Storybook runtime build repair (dedicated tooling task). Independently useful for the liquid-tier product verification that is otherwise NOT_RUN.
8. **R-09 / 0009** — no code change now. When applying 0009: production-scale EXPLAIN or scale note required; decision sits with B2/SQL-fixes owner + PO.

## Historical dispositions (per prompt requirement)

- **Re-opened:** review-matrix-rework "green gates" claim → red (R-04; historical claim stale vs reviewed bytes, hash-bound). audit-fixes TTL disposition → unresolved (R-03).
- **Fixed-and-verified this review (no rework needed):** durable-session rotation semantics (author-design claim confirmed by PASS receipt *inside the race run* — the citation defect R-05 is documentation-only); HTTP-layer cross-matter mitigation (fingerprint probe PASS re-run); 0001–0008 migration application; B1/B2 event-logs bind to bytes.
- **Fixed (source) but not author-independent-accepted:** everything else in the 8 prior chains — independent acceptance explicitly delegated to a non-author session per the authorship boundary of this review.
- **Not reproduced:** none (no historical defect failed to reproduce in this review's scope).

## Fix-scope permissions (for the implementation owner)

- Permitted: the exact smallest fixes above; permanent regression tests in the modules owning the code; doc corrections in the named files.
- Not permitted in the same change window: new features, schema behavior changes (0009 apply is a separate named deployment action), provider/cloud actions, Marking previous task records DONE, rewriting historical evidence.
- Every fix task must record: task ID, owner, base commit, changed files, `make check`/`pnpm` gate outputs, new test names, and end in IN_REVIEW for a non-author review.

## Open items that gate later stages (not fixable by this handoff)

- PO decisions: OIDC TTL (R-03), ADR-006 stage-2 authorization (6-decision packet), strict-$0 interpretation, residency scope, 0009 application policy.
- Authorized-stage verifications: managed-provider legs, real R2, IdP readback, browser/a11y/visual (after R-08), second-user runtime journeys.
- Independent acceptance of this review itself by a non-author (OpenCode first-touch or equivalent).
