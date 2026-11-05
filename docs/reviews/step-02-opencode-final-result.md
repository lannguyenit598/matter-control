# Step02 Final OpenCode Review — Actual Returned Result

Recorder: Codex. Actual OpenCode2.1.4 / opencode/glm-5.3-flash-free, exit0; session ses_e92505488ffe3ySTAWXz7qxG2c. Provider/model verified via exported metadata. PASS_DOCUMENT_ONLY: six fixes verified, no High/Medium reported; two Low recording/admission notes handled in disposition. No PO approval or runtime/security/cost certification.

## Exact reviewed snapshot manifest

```json
{
  "snapshots": {
    "docs/architecture/system-architecture.md": "8e3e600182f03d2bdc2f5068e4bbcb6bd039e8d28cea317c9902bcebdede4d83",
    "docs/architecture/domain-model.md": "6b1f7fa53723e427d3ff0255e303bf27f2c455fb65da97f642f16922cc9cef60",
    "docs/architecture/state-machine.md": "599c6831c3a07e4f579ec9f8aa666ee2978c4a19e3701e5b91af9e1bdc270127",
    "docs/architecture/dependency-engine.md": "44ff0e3ae53b06d87a45a09ed511aff4e2034eb236bb58cb9bd3e991c07891b2",
    "docs/architecture/evidence-model.md": "38fa1508a35a7ec53313e5c8f9b353c6c345373f656c814022494101876ea919",
    "docs/architecture/document-lineage.md": "33b62940a6099e059f74a3f8bac09b9ebad2775599702fc1fe9a276b7787b4b4",
    "docs/architecture/filing-model.md": "632f9c8670c98de2065f40a28ed34f31257c1615a1e73cfd25fcafc7a90c60dd",
    "docs/architecture/api-contracts.md": "49ec8aa506386df03c4995a53553d51dd615e1fd0e1fd02f4fd45d146d576e75",
    "docs/architecture/data-model.md": "873a23b4791a1656a0e54edda5fccf28628c65d432151b5e5ba7faa058badf6f",
    "docs/architecture/security-architecture.md": "08efcaad3e53aef33352b49e0665b6e03d82b7ed303a194833e27ca3e57b9306",
    "docs/architecture/technical-blockers.md": "84d07f37948698916fc8b52d8a63a170c9e8f4561977b13e4dbaa8a4d8cdce7b",
    "docs/architecture/adr/ADR-001-runtime-and-hosting.md": "e3fb634cea2e67aaa12230d6edccefcd333e974ef45f542ed255a438cc636eb2",
    "docs/architecture/adr/ADR-002-transaction-and-concurrency.md": "812e225fe1afc7d1d10ab9368dbd19e63c278591fce8c1a0a1cbb4c57e371a63",
    "docs/architecture/adr/ADR-003-frontend-runtime.md": "bfbdc5a78aa2ffe57988de777ee07893d29dd9bb8b7d7fd4758798fea10999bb",
    "docs/reviews/step-02-claude-architecture-result.md": "5cc70ba06b180f0a9baf1f91840ddc3519d10d9754d3e02c94a546bf2361bf55",
    "docs/requirements/prd.md": "bcdd1c9e2ead81c9242e44dd485f4aa7e39039609f57c9246d53dd543afe4a03",
    "docs/requirements/srs.md": "9b813badd88a196c938d9e0503d904ad767f3090ff7522dcc6fae3eb689869f8",
    "docs/requirements/business-rules.md": "96be507d3b0d70f0b9ad1c2b27b3152fd5e2700f13e8a647920c60c220f2aa81",
    "docs/requirements/state-semantics.md": "156ca1dd2f75a7374a59d2aa4af4a9815ce62a2f11c03f84977bad2860a2ad51",
    "docs/requirements/permission-matrix.md": "f352fcf0f1f2617b5d5c072c34472f84619f4bda555c855dbdf1871b469b0276",
    "docs/requirements/acceptance-criteria.md": "809c206e576e6d4cc0f3642caeec4ee6997b465ffe2f0b316368f7e106e97fa7",
    "docs/requirements/golden-workflow-acceptance.md": "0a7d44521bdb89e2499de588242c3b9244827ef9a6366d6bcb5b5a576238a787",
    "docs/requirements/open-business-decisions.md": "b950aead586e74d0639b72693e8238fa6fbd197510475fc2b5dc931233e69ede",
    "docs/architecture/cloudflare-feasibility.md": "a1f8fa2a76e4875314a16ff49a505866d4b41d24007d2869636814369a26b959",
    "docs/deployment/free-tier-budget.md": "16e3ebf68519461a4a4f6c775e07d1a9746e4060b0551096de96bf4a35f3067c",
    "docs/architecture/repository-audit.md": "23005ef30f64c779d952088e6f538b3890941079d4119c471d3f6e178648b042",
    "docs/ai-sdlc/step-01-approval.md": "72228a67ca5ccfe63b5f7f44070da8edfd5cbda1b0912ba27c917311bdc0ae74",
    "docs/ai-sdlc/step-02-request.md": "29f64b90dca7b2752ba5da67131833af509de5b7584bf64f69a91a0c25a45a05",
    "docs/tooling/step-02-sources.md": "ea8545d982ca280aa801b068ba5c8ef1387c85117292f6f3f6828bbe57bab8ad",
    "docs/tooling/step-02-claude-final-output-manifest.json": "07a162cdb2eb3f9e7e278d33406c1230c28fc315ec553d3ab6053c4210919672",
    "docs/reviews/step-02-opencode-round2-result.md": "be003059395aec670b215a5c071ce855b987b1bf024fe270bb3522598b8d3b6d",
    "docs/reviews/step-02-claude-final-corrections.md": "9abb35c70a4722266fbb6416be088f5b834be7018ad1573d7a4faf2d790ed423"
  },
  "bytes": 406313,
  "packet_sha256": "904ec420d16ee1a629300e257c8e4633de2988a6c7bb9d67b27544f388cefd73",
  "authority": "DEC-022 bounded Step02 correction/review loop"
}
```

## Verbatim final review

# MC-002-QA — Targeted Final Re-Review (document-only)

**Verdict: `PASS` — DOCUMENT ARCHITECTURE ONLY.** All six final corrections are substantiated in the current text; no material regression of the round-2 accepted invariants (F-01..F-14, C02-P01..P10) was found. Two Low actionable items remain (report tidy + a derived constraint to name). No PO approval of architecture/cost/policy is implied; no Step 02 DONE; all PoCs/tests/gates remain NOT_RUN/OPEN. Model identity is taken only from the snapshots' declarations (claude-opus-5-5 for corrections; opencode/glm-5.3-flash-free declared for round 2); confirmation is a Codex session-export task, not a text claim.

## Disposition — all 6 IDs

| ID | Status | Evidence verified in current snapshots |
|---|---|---|
| R2-1 | **RESOLVED** | evidence-model §2 rule 4 (assessed version = evidence's `document_version_id`; NULL for non-document; non-document evidence on CURRENT/FIXED → 422, NONE allowed), §5 assess guard; api §1.1 claims + assessment rows and §3.4; DB backstops `assessment_version_consistent` / `claim_version_rule_kind` (data-model §4, `IS NOT DISTINCT FROM` handles NULL); negative tests EV-14 and DM-14 present, NOT_RUN. No false-satisfaction path remains: for a FIXED(v3) criterion with v2 evidence the claim inserts but satisfaction fails honestly. |
| R2-2 | **RESOLVED** | evidence `kind` CASE now has an explicit OBSERVATION branch + `ELSE false` (data-model §4); `domain_events` enforces USER→`actor_id NOT NULL`, SYSTEM_CLOCK→NULL via CASE…`ELSE false` (§6), consistent with the SYSTEM_CLOCK boundary actor in state-machine §6.4. |
| R2-3 | **RESOLVED** | Dangling `-- '' = implicit single component` fragment gone from `evidence_claims.component_key` (data-model §4); single clean comment naming `claim_component_shape`. |
| C02-R2-P01 | **RESOLVED** | Final-absence inference withdrawn: api §1 states a 404 means only "no committed outcome visible to you as of `asOf`" and "**No final-absence guarantee:** a 404 never means the original will not commit later"; DB deadline cannot bound network/pre-admission delay. Key age checked at `t_cmd` after admission; window = `receiptRetention − maxCommandDuration − allowedSkew`; future keys > `allowedSkew` → 422; `purge_after = committed_at + retention` opens the delayed-original corner: any request passing the age check necessarily runs before the earliest possible `purge_after` (original's own admission check bounds `committed_at ≥ keyCreated − skew`), so the receipt is purged only **after** the margin expires — same-key resubmission therefore always replays or deterministically 422s; never unsafe re-execution. Safe action is same-key resubmission only; no fresh-key retry is proposed. Aligned in TB-13, system-architecture §13, ADR-002 R15, security §7, and contract test "404 never asserted as 'never committed'". "Never commit later" inference is fully gone from normative text. |
| C02-R2-P02 | **RESOLVED** | `command_receipt_matters` child table with FK to receipts and `represented_matter_id → matters(id)` (data-model §6), inserted only in the command's own txn; replay and `GET /operations/{key}` both require current read access to scope **and** every represented Matter, else uniform 404 (api §1/§2; data-model §7; security §3/§4). Explicit workspace-OWNER negative coverage in DM-12, contract test §5 ("still Workspace OWNER but no longer a member of the created Matter → uniform 404 byte-identical") and security §7. Workspace OWNER grants no Matter access (AC-118); no superuser path was introduced — receipt rows are reachable only via the two re-authorizing paths. DM-08 lint unaffected: FK to `matters(id)` is §1a-exempt. |
| C02-R2-P03 | **RESOLVED** | state-machine §6.3: `nonterminal` qualifier explicitly only on the two due rows; validity start/end applies "in any subject execution state (incl. COMPLETED/CANCELLED Requirement/Action, approved/completed Filing)", with one population feeding pure reads, materialization and `next_boundary_at`. New §8 propagation test: COMPLETED+VERIFIED upstream and approved Filing whose sole accepted proof reaches `valid_until` → execution unchanged, verification UNVERIFIED, proof-gated downstream BLOCKED, milestone not ready, EXPIRED attention, instant in `next_boundary_at` (NOT_RUN). Consistent with evidence-model §5 Expiry, EV-04, RULE-007 and AC-126; due-row terminal exclusion matches RULE-009/AC-142. |

## Material regression scan (prior accepted invariants)

- **F-02/F-05 boundary work untouched beyond scope**: pure evaluation, read-never-writes, linearization, receipt-in-txn, hash-scope binding all retain their round-2 text. The removal of the round-2 "final after maxCommandDuration" wording in favor of C02-R2-P01 is the demanded correction, not a regression — and the stronger text is present in every normative location.
- **New tables/FKs**: `command_receipt_matters` conforms to the §1a register and lint exemption; `evidence_assessments.assessed_document_version_id` FK is matter-composed. No lint or register violation introduced.
- **Unchanged files** (domain-model, dependency-engine, filing-model, document-lineage, ADR-001/003) preserve RULE-003 VERIFIED-only gates, RULE-008 separate milestone predicate, filing epoch/reopen semantics, and the no-presigned download policy — no contradiction with the six edits.
- **Trigger coherence**: the version trigger combines version-equality and kind-compat at insert for both claim time and assessment time; the satisfaction function remains the sole authority at read time, so a claim that inserts on a mismatched FIXED version simply never satisfies — honest, no leak.

## Remaining actionable findings (non-blocking)

1. **Low — edit-count contradiction in the amendment records.** The corrections file and manifest summary say "29 edits"; the manifest's own `edits_applied: 30` and per-file counts sum to 30 (1+3+4+8+9+3+1+1). Recorders counted 30. One-line reconciliation (state "30 (summary undercounted by 1)" in both places). Content-wise I verified every claimed edit is present; the discrepancy is reporting only.
2. **Low — derived constraint on TB-06/TB-13 numeric approval is unnamed.** The key-age window only exists if `receiptRetention > maxCommandDuration + allowedSkew` (with positive margin); if the PO approves values violating this, every key is rejected on submission and idempotency becomes unusable. Add one acceptance line to TB-06/TB-13 closure criteria: "approved values must satisfy retention > maxCommandDuration + allowedSkew". Prevents an untraceable failure at instantiation.
3. **Informational — historical record conflict.** The round-2 review file's F-02 row still describes the withdrawn finality ("final only after `maxCommandDuration`"). It is the historical record of snapshot 3a86ca8 and should not be rewritten; but this report and the corrections file are the governing records for downstream readers.

## Boundary

Packet-only review of 32 supplied snapshots; no tools, no repository/manifest recomputation (hashes are Codex-declared transport evidence), no build/DDL/runtime/cost evidence, no owner audits (TB-10 still blocked on tool-integrity), no model-identity verification beyond declared strings. This verdict certifies document-level consistency of the six corrections only; it is not a security certification, not PO approval of hosting/IdP/store/workload/retention/RPO/RTO or ARCH-Q1..Q5, and not closure of Step 02. All suites (DM/DG/EV/FL/DL/security, P-BE-*, P-OS-1, delayed-original test) remain NOT_RUN; every runtime and cost gate stays exactly as the author left it.

**Skipped / residual risk:** no re-derivation of the requirements baseline; no verification that a code implementation could satisfy the triggers (that is ZCode's instantiation risk). Main residual risk: the new key-age/purge-margin arithmetic is correct as expressed but is unproven until P-BE-2 and actual TB-13/TB-06 values exist.
