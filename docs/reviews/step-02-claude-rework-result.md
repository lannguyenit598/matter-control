# MC-002-ARCH-REWORK — Claude Code rework report (round 1)

Author: Claude Code (actual), claude-opus-5-5. Packet-only; tools/MCP disabled. Inputs: supplied rework snapshot manifest; OpenCode round 1 (opencode/big-pickle, session `ses_e929198d8ffeFwkVV16SNbAFYR`, exit 0, CHANGES_REQUIRED, 5 High / 9 Medium, no Critical); Codex preflight C02-P01..P10. **Not performed:** hash computation/verification, build, test, PoC, deploy, provider activation, product approval. **No PASS self-awarded.**

## Dispositions

| ID | Disposition | Normative location |
|---|---|---|
| F-01 High | ACCEPTED. Every matter-scoped reference is now a composite FK incl. `matter_id` to a declared UNIQUE key; register + schema-lint test | data-model §1, §1a, §3–§6, DM-08; evidence-model §3 |
| F-02 High | ACCEPTED with modification. Receipt only in command txn; replay/operations re-authorize scope, else uniform 404; 404 ≠ never committed; same-key resubmission; DB-enforced deadline finality; UUIDv7 key expiry; retention gated. Reviewer's `202 IN_PROGRESS` rejected (see disputes) | api-contracts §1; data-model §6; security §3/§4/§7; TB-06, TB-13 |
| F-03 High | ACCEPTED. Filing reopen advances proof epoch; prior-epoch assessments stop counting; negative-outcome epoch guard; new-evidence Approval guard; proof_required=false case explicit | filing-model §1/§2/§4, FL-08..10; state-machine §2; data-model §5 |
| F-04 High | ACCEPTED. Deferred typed-totality trigger; kind-carrying FK; engine fails 503 on missing typed row | data-model §3; dependency-engine §1/§3, DG-13; DM-09 |
| F-05 High | ACCEPTED with modification. Reads evaluate purely at server-captured `asOf`, never write; history materialized by next write/worker with late-recording semantics; linearization at `t_cmd`; no clock-crossing atomicity claimed | state-machine §6; system-architecture §8; data-model §7/§8; ADR-002 R7/R16 |
| F-06 Med | ACCEPTED. If-Match iff §1.1 names a target; 428/412/400 rules | api-contracts §1, §1.1 |
| F-07 Med | REJECTED as proposed (would broaden RULE-003). Adopted fail-closed, order-independent handling; reviewer option recorded as unapproved ARCH-Q1-B | dependency-engine §2, DG-11; state-machine §4 |
| F-08 Med | ACCEPTED with different order (workspace → matters asc → memberships → typed rows → receipts); absolute deadlock-free claim removed; 40P01 → retryable 503 | ADR-002 §1a/§3, R13–R14; data-model §2/§7 |
| F-09 Med | ACCEPTED. Statements × requests arithmetic; W2 Hyperdrive headroom NOT_SHOWN. Cost measurement owner Codex | system-architecture §12 |
| F-10 Med | PARTIALLY REJECTED: a claim has exactly one subject; CAS = claim revision + `expectedSubjectEpoch` | api-contracts §1.1/§3.4; evidence-model §5 |
| F-11 Med | ACCEPTED. Actor/matter/expiry/digest binding; per-row outcome records; retry via new preview | api-contracts §3.6; data-model §6 |
| F-12 Med | ACCEPTED. One matter-locked txn per connected group; group definition; mixed mapping → CONFLICT | api-contracts §3.7 |
| F-13 Med | ACCEPTED. Rows 21–23 with owners and HTTP seam; NOT_RUN | system-architecture §10 |
| F-14 Med | ACCEPTED. F3 entry conditions (not a selection) | security §6.1; ADR-003 §4/§5 |
| C02-P01 | ACCEPTED (= F-06) | api-contracts §1.1 |
| C02-P02 | ACCEPTED (= F-02); purged scope distinguished by key age (410/422) | api-contracts §1 |
| C02-P03 | ACCEPTED (= F-01) | data-model §1a |
| C02-P04 | ACCEPTED. Boundary set: due−48h, due+1µs (not due), future valid_from, validity end; terminal excluded | state-machine §6.3 |
| C02-P05 | ACCEPTED. Milestones recomputed on prerequisite ∩ Δ ≠ ∅ | dependency-engine §3, DG-12 |
| C02-P06 | ACCEPTED. One current (non-superseded) assessment per (claim, epoch) | evidence-model §2/§4/§5, EV-11; data-model §4 |
| C02-P07 | ACCEPTED. CASE…ELSE false variant CHECKs; NULL-CHECK rule | data-model §1, §4, §5 |
| C02-P08 | ACCEPTED. Effective OWNER = matter OWNER ∧ active workspace membership; workspace revocation guarded without leakage; ARCH-Q4 for emergencies | data-model §2; domain-model §3 |
| C02-P09 | ACCEPTED. Abbreviated hashes removed; exact manifests authoritative | result §2 |
| C02-P10 | ACCEPTED. Three-column table | security §7 |

## Disputed or partially accepted recommendations
- F-02 `202 IN_PROGRESS`/`409 still-running`: rejected. In-flight state isn't visible before commit unless an extra pre-commit write is added. The contract instead uses same-key resubmission, which serializes on the scope lock, plus deadline-based finality.
- F-05 "asynchronous history": accepted only as defined materialization by the next write or the boundary worker. No separate queue is added. Late recording is explicit.
- F-07: rejected. RULE-003 names VERIFIED, and NOT_REQUIRED is never equated with it. The earlier proposal to reject edge creation is withdrawn because the final graph depended on command order.
- F-08: the reviewer's "membership → matter" order is not adopted. Domain commands must take the matter lock first, so grants hold the workspace row instead.
- F-10: the premise is incorrect; claims do not span subjects.
- Reviewer observation (3): agreed the RULE-009 predicates are contiguous. C02-P04 still corrects the boundary instant (due+1µs).

## Reporting corrections
- My first result printed abbreviated narrative hashes. The root confirmed several were incorrect (one even carried "?"). They are removed, and the exact manifests are authoritative. The reviewer's "no hallucinated input hashes found" is superseded by the root's finding.
- OpenCode's "31 manifest entries" is wrong: the transport had 30 files. Its "hash-verified" claim is unsupported because its tools were denied. My own claims are no stronger: I verified no hash in either round.

## Interpretation questions for PO/BA (none approved here)
ARCH-Q1 (fail-closed adopted; Q1-B exception unapproved), ARCH-Q2 (uploader exclusion), ARCH-Q3 (recorded-time brief window), **ARCH-Q4** (emergency workspace revocation of the last effective OWNER), **ARCH-Q5** (AC-145 "new authority approval evidence" read as evidence recorded after reopen).

## Remaining honest gates
ADR-001 hosting, ADR-003 frontend, identity provider, object store/R2 billing, workload/retention/RPO/RTO values, plus three new config values (receiptRetention, preview expiry, maxCommandDuration). Also open: TB-01..TB-13 (TB-13: DB-enforced transaction deadline unverified), ZCode/Antigravity owner audits, all PoCs (P-BE-1..3, P-FE-1..4, P-OS-1, P-HOST-1), and every DM/DG/EV/FL/R/security test, all NOT_RUN. Still needed: OpenCode re-review of this rework, and PO decisions on ARCH-Q1..Q5. Step 02 quality gate: not met.
