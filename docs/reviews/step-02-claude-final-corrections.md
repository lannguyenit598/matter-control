MC-002-ARCH narrow correction. Actual Claude Code (claude-opus-5-5), packet-only; no tools, no runtime, no hash computation. Base: snapshots at 3a86ca8 per supplied manifest. 29 edits across 8 architecture files; requirements unchanged; the 24 closed findings were not reopened.

R2-1 (Medium) — RESOLVED IN TEXT. evidence-model §2 rule 4: assessed version = evidence.document_version_id (required for DOCUMENT_VERSION, NULL otherwise). Non-document evidence cannot satisfy CURRENT_AUTHORITATIVE/FIXED, so a claim against such a criterion is rejected (422); NONE criteria still accept it. This makes the existing satisfaction function explicit rather than adding policy. The guard now appears in §5 and in the api §1.1 claims/assessment rows. DB backstop: triggers assessment_version_consistent and claim_version_rule_kind (data-model §4). Negative tests EV-14 and DM-14 are NOT_RUN.

R2-2 (Low) — RESOLVED. The evidence kind CASE now has an explicit OBSERVATION branch and ELSE false, with variant semantics unchanged. domain_events: USER requires actor_id; SYSTEM_CLOCK requires NULL; ELSE false.

R2-3 (Low) — RESOLVED. Removed the dangling comment.

C02-R2-P01 — CONTRACT CORRECTED. The final-absence promise is withdrawn: a 404 never implies the original will not commit, and the reason is stated. What remains is guaranteed by the receipt PK, the scope lock and a key-age check evaluated at t_cmd inside the transaction, so network delay cannot bypass it:
- The window is retention − maxCommandDuration − allowedSkew.
- purge_after = committed_at + retention, so a request passing the check (including a delayed original) still finds any committed same-key receipt.
- The DB deadline is retained only for brief sealing and this purge margin. It runs from transaction start, before t_cmd, so it does bound commit relative to recorded_at, but never network delay.
- References were aligned in TB-13, the system-architecture risk table, ADR-002 R15 and security §7.
- Delayed-original test: NOT_RUN.

C02-R2-P02 — RESOLVED IN TEXT. New table command_receipt_matters records every Matter represented in a stored body, including one created by POST /workspaces/{ws}/matters. Its column is named represented_matter_id so the DM-08 lint rule is unaffected. Replay and operations require current read access to the scope AND every represented Matter; anything else gets the uniform 404. Workspace OWNER grants nothing (AC-118); no superuser was introduced. Aligned in api §1/§2/§5, data-model §1a/§6/§7/DM-12 and security §3/§4/§7. Negative test is NOT_RUN.

C02-R2-P03 — CLARIFIED. In state-machine §6.3 the nonterminal filter applies only to the due rows. Validity start/end applies in any execution state, so expiry on a COMPLETED Requirement/Action or an approved Filing invalidates verification, downstream gates, milestone and attention (RULE-007, AC-126). The same population feeds pure reads, materialization and next_boundary_at. One propagation test was added to §8 (NOT_RUN). No new business policy.

Remaining gates (unchanged, OPEN):
- PO architecture approval.
- ADR-001/003, the identity provider and the object store.
- Workload, retention and RPO/RTO values.
- ARCH-Q1..Q5.
- TB-01..TB-13 values, including receiptRetention, maxCommandDuration and allowedSkew.
- Owner audits (TB-10).
- All PoCs and DM/DG/EV/FL/DL/security suites: NOT_RUN.

The OpenCode round-2 PASS applies only to the 3a86ca8 snapshot. These amendments require a targeted independent re-review, and no PASS is self-awarded.
