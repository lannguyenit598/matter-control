# Step02 OpenCode Round2 — Actual Returned Report

Recorder: Codex. Actual CLI2.1.4 / opencode/glm-5.3-flash-free, exit0, session ses_e925d49fdffeSMIfB3Oj123T0f. Duration240.174s; exact architecture subject3a86ca8 (transport snapshots authoritative). Provider/model verified via session export. Document PASS only, oneMedium/twoLow; all runtime/PO gates remain open. No reviewer hash recomputation.

## Exact sent snapshot manifest

```json
{
  "snapshots": {
    "docs/architecture/system-architecture.md": "1babdefea40bc29c8e9e7e87f46202ab23fba81920b7c4e4d830d170eb6f0956",
    "docs/architecture/domain-model.md": "6b1f7fa53723e427d3ff0255e303bf27f2c455fb65da97f642f16922cc9cef60",
    "docs/architecture/state-machine.md": "652273cb442c73ffc3ffc869fdbd3ac3188c7ef053e8dcd10cd0f7fbb336bca7",
    "docs/architecture/dependency-engine.md": "44ff0e3ae53b06d87a45a09ed511aff4e2034eb236bb58cb9bd3e991c07891b2",
    "docs/architecture/evidence-model.md": "73ebd112b9aeae30308195b0f8632395d66dcdde3529b46435f63cf5b7190fae",
    "docs/architecture/document-lineage.md": "33b62940a6099e059f74a3f8bac09b9ebad2775599702fc1fe9a276b7787b4b4",
    "docs/architecture/filing-model.md": "632f9c8670c98de2065f40a28ed34f31257c1615a1e73cfd25fcafc7a90c60dd",
    "docs/architecture/api-contracts.md": "1db6b8d987b8c60c365c76c4f3d0e9c7d0afcfb3f69a71f1f269ae8409012da9",
    "docs/architecture/data-model.md": "607a6b3fabaf30ebe79f181a40f7911f963d14f6319bb9263a4ea448e06e32a1",
    "docs/architecture/security-architecture.md": "519af1539f30ef4d7e93f60e6063d677246959fd4a54eb3ae1bce780c356b465",
    "docs/architecture/technical-blockers.md": "0b8f667433142e29fb35af14e7fdd2cfb8eee1784e799925509dea4c3ce7e566",
    "docs/architecture/adr/ADR-001-runtime-and-hosting.md": "e3fb634cea2e67aaa12230d6edccefcd333e974ef45f542ed255a438cc636eb2",
    "docs/architecture/adr/ADR-002-transaction-and-concurrency.md": "656dbf1041f5ded59366d3c1d424bad57f8fbf03974d40e67190a58da9d23d0d",
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
    "docs/architecture/repository-audit.md": "ea47ef81fb701fd4e9b822a3814cedbce0bfd889dd1e1419369e629559702d14",
    "docs/ai-sdlc/step-01-approval.md": "72228a67ca5ccfe63b5f7f44070da8edfd5cbda1b0912ba27c917311bdc0ae74",
    "docs/ai-sdlc/step-02-request.md": "29f64b90dca7b2752ba5da67131833af509de5b7584bf64f69a91a0c25a45a05",
    "docs/tooling/step-02-sources.md": "fcf2d86dfae5904be1171cbc5d075d67995bd0b056d2469b15359516879018ea",
    "docs/tooling/step-02-claude-rework-output-manifest.json": "3016a34f72145a0fe8ca9468165373de0291de12f1e5533715bb32151e9ee13e",
    "docs/reviews/step-02-opencode-result.md": "b34125827476fc55146270aac219ed7d4758fdce5901dbeae95d59b1c7178109",
    "docs/reviews/step-02-claude-rework-result.md": "45d139fec659a2c51273ee79c489573a032c6d7df60942847f602942fb22cbf7"
  },
  "bytes": 410598,
  "packet_sha256": "352f52c2fa64a83f4a7c2bf414639f8b09eba302c1244259ea8f32002b44cdec"
}
```

## Verbatim final review

## MC-002-QA — OpenCode Independent Review, Round 2 (final)

**Identity / scope.** OpenCode (actual), Round-2 reviewer of the MC-002-ARCH rework. Packet-only: tools, filesystem, commands, builds, DDL, and hash recomputation all denied. Inputs: the 32-file supplied transport snapshot. Manifest hashes are **Codex-declared transport evidence**; I compared manifest strings textually only (e.g., the rework-output manifest's `stored_sha256` values match the transport manifest; `previous_sha256` values match the round-1 reviewed set; unchanged files document-lineage.md and ADR-001 show identical previous/stored hashes). The round-1 manifest remains immutable in Git; historical hashes are not current-version claims — I reviewed only the corrected current text. Scope: document-to-document coherence of the architecture against approved requirements at `572835a` / `54e1db5`. I never approved business policy, architecture itself, infrastructure cost, or cited this as a security certification. Reviewer-corrections from round 1 accepted: "31 manifest entries" count, the unsupported "hash-verified" wording, and my round-1 premise that claims span subjects (they do not).

**Verdict: `PASS` — DOCUMENT ARCHITECTURE ONLY.** Not PO approval, not Step 02 `DONE`, not satisfaction of the Step 02 quality gate (hosting/identity/frontend/storage/workload gates, owner audits, and all PoCs/tests remain NOT_RUN/OPEN, exactly as the author states). No unresolved High **document** defect remains. One tracked Medium finding and two cosmetic observations remain (below), including one unenforceable-as-DB-claim invariant to pin down before implementation authoring.

### Disposition verification — all 14 F IDs + 10 preflight IDs

| ID | Class | Verified disposition (location) | Status |
|---|---|---|---|
| F-01 | High | §1a register + instantiated composite FKs on every matter reference (claims→evidence/revision/component; assessments→claims incl. denormalized independent-check `CHECKs`; disputes; components; ER subject CASE FKs; documents/versions/predecessor/content; filings/cycles/submissions/items; edges; waiting; receipts). DM-08 pg_catalog lint; §1 NULL/MATCH-SIMPLE rules stated honestly | VERIFIED APPLIED |
| F-02 | High | Receipt only in command txn; replay/operations re-authorize current scope → uniform 404, stored body never leaks; 404 ≠ "never committed" (final only after `maxCommandDuration`, TB-13); same-key duplicates serialize on scope lock; key-age 422 vs past-retention 410; `purge_after` retention gated TB-06 (api §1; data-model §6; security §3/§4/§7) | VERIFIED APPLIED |
| F-03 | High | Filing reopen: epoch+1, `opened_at=t_cmd`, prior-epoch assessments stop counting (shared insert trigger covers node+filling), UNVERIFIED unless explicit NOT_REQUIRED; approval guard requires evidence recorded ≥ `proof_epoch_opened_at` when epoch>0 and rejects while `negative_outcome_epoch = proof_epoch`; FL-08–10, ARCH-Q5 flagged (filing-model §2/§4; state-machine §2; data-model §5) | VERIFIED APPLIED |
| F-04 | High | Kind-carrying FK `(matter_id, id, kind)`+kind CHECKs (at-most-one structural), deferred totality trigger (at-commit), no UPDATE/DELETE on `graph_nodes`, id/kind non-updatable; engine fail-closed 503; DM-09, DG-13 | VERIFIED APPLIED |
| F-05 | High | Reads pure at server-captured `asOf`, never write; client `asOf` → 422; historical state via recorded-time brief fold only; materialization by next write/worker with late recoring (`effective_at`≤`recorded_at` consistent, incl. future `valid_from` b≤t_cmd); linearization explicit at `t_cmd`/snapshot; 503 fail-closed is legitimate; DM-13 reads issue no write | VERIFIED APPLIED (modification coherent) |
| F-06 | Med | If-Match iff §1.1 names target; 428/412/400 table; all §3 examples match table; generated "every route has one scope" test | VERIFIED APPLIED |
| F-07 | Med | Author rejected my round-1 suggestion — correctly per rule; NOT_REQUIRED never satisfies proof gates (RULE-003); fail-closed order-independent handling with audited `:replace-gate` remediation; my option recorded as unapproved ARCH-Q1-B; DG-11 | REJECTED CORRECTLY — ENDORSED |
| F-08 | Med | Global order workspace→matters asc→workspace_memberships→matter_memberships→typed→receipts; grants hold workspace FOR SHARE; no absolute deadlock claim; 40P01→retryable 503; R13/R14 barrier tests | VERIFIED APPLIED |
| F-09 | Med | Statements×requests arithmetic; W2 Hyperdrive headroom NOT_SHOWN; Hyperdrive conditional (not H1 Go origin); owner Codex; round-1 read-amplification removed by F-05 | VERIFIED APPLIED |
| F-10 | Med | Premise corrected: a claim has exactly one subject (criterion revision → evidence requirement → subject); CAS = claim revision + `expectedSubjectEpoch`; no multi-subject span exists in the corrected model | REJECTED NO PREMISE EXISTS — ENDORSED |
| F-11 | Med | Commit binding actor/matter/expiry/digest before rows (409/410 distinct); per-row outcome records `(previewId,rowId)` give unknown-outcome recovery; retry via new failed-only preview | VERIFIED APPLIED |
| F-12 | Med | Group = connected component of in-file references; **one matter-locked txn per group, all-or-none**, group-level validation incl. cycle check; per-`(importId,groupId)` outcomes; AC-131 named; data-model §6 tables | VERIFIED APPLIED |
| F-13 | Med | §10 rows 21–23 name GW-01/02/03 owners + HTTP seam + checkpoint-ledger evidence, suites NOT_RUN, execution owners with Codex | VERIFIED APPLIED |
| F-14 | Med | §6.1 F3 entry conditions (strict CSP, in-memory tokens+PKCE, exact-origin CORS, optional DPoP) — gated, not selected; ADR-003 §4/§5 aligned | VERIFIED APPLIED |
| C02-P01 | =F-06 | §1.1 per-endpoint table | VERIFIED |
| C02-P02 | =F-02 | 410/422 retention distinction implemented | VERIFIED |
| C02-P03 | =F-01 | Register §1a | VERIFIED |
| C02-P04 | Boundary set due−48h, **due+1µs** (exclusive overdue, consistent with RULE-009 and AC-142), future `valid_from`, half-open validity end; **nonterminal qualifier on all rows incl. filings**; next_boundary recompute; terminal excluded | VERIFIED |
| C02-P05 | Milestone recompute on `prerequisites ∩ Δ ≠ ∅` (DG-12); critical chain recompute on `Δ ∩ C ≠ ∅` or structural change — propagation via downstream closure Δ makes this sound | VERIFIED |
| C02-P06 | Canonical current-verdict: partial unique index `(claim_id, subject_epoch) WHERE superseded_by_id IS NULL`; supersede-then-insert ordering works with immediate index + deferred self-FK; epoch trigger; EV-11, DM-10 | VERIFIED |
| C02-P07 | NULL-safe discriminators: CASE…ELSE false with only IS [NOT] NULL/num_nonnulls operands instantiated in ER subjects, version_rule, document versions, filings, receipts (one cosmetic deviation → R2-2) | VERIFIED |
| C02-P08 | Effective OWNER = OWNER ∧ ACTIVE matter ∧ ACTIVE workspace; guards on both demotion/revocation and workspace revocation; deferred re-check trigger on both tables; problem leaks no matter/count; ARCH-Q4 open; DM-11, R12/R14 | VERIFIED |
| C02-P09 | Result §2: abbreviated hashes removed, exact manifests declared as evidence; no PASS self-awarded | VERIFIED |
| C02-P10 | Security §7 three-column test table | VERIFIED |

### Remaining findings (non-blocking; tracked)

**R2-1 (Medium, tracked) — assessed-version consistency seam.**
- **File/section:** `evidence-model.md` §2 rule 4 and §5 assess guard (cryptic "assessed version matches"); `api-contracts.md` §1.1 assessment row (does not name it); `data-model.md` §4 (no DB backstop); test tables §8 (no negative test).
- **Evidence:** The invariant "for DOCUMENT_VERSION evidence the assessed version must equal the evidence's version" is asserted but has no named enforcement seam (command guard implied, no trigger, no EV/DM row) and is ambiguous for EXTERNAL_REFERENCE/OBSERVATION evidence under a CURRENT/FIXED rule.
- **Impact:** A verifier inserting a wrong `assessed_document_version_id` (matter-scoped, so DB-valid) would satisfy a CURRENT/FIXED criterion from offered evidence that shows a different version — false satisfaction/false invalidation (AC-127/128, NFR-005). Requires a code defect plus a misbehaving verifier; not a cross-cutting structural hole.
- **Correction:** One-sentence rule "assessed version = evidence's `document_version_id` for DOCUMENT_VERSION kind; assessments on non-document evidence are rejected under document-version rules", optional defense-in-depth trigger per the register's declared style, and one negative test row (EV/DM). **Owner:** Claude Code (spec), ZCode (test at instantiation).
- **Blocking?** No — it is an implementation-seam tightening, not re-architecture.

**R2-2 (LOW) — NULL/variant-rule deviations.** `data-model.md` §4: evidence `kind` CASE uses `ELSE document_version_id IS NULL` instead of the §1-declared `ELSE false` pattern (harmless because the kind CHECK restricts values); `domain_events` lacks `actor_kind='USER' → actor_id NOT NULL` variant check the §1 rule implies. **Owner:** Claude Code, one-line tidy.

**R2-3 (LOW, cosmetic) — stray comment fragment** on the `evidence_claims.revision` line in `data-model.md` §4 ("-- '' = implicit single component" dangling after the CAS comment). Remove. **Owner:** Claude Code.

### Genuine unresolved High defects vs gated decisions

- **No unresolved High document defects remain** from round 1 or round 2.
- **Gated PO/infra decisions (not defects, not waived):** ADR-001 topology, ADR-003 adapter, IdP, object store/R2 billing, workload/retention/RPO/RTO numbers, ARCH-Q1..Q5, TB-06/TB-13 values, emergency revocation (Q4), brief window axis (Q3).
- **Gated open blockers:** TB-01..TB-13 as listed.
- **NOT_RUN evidence:** all PoCs (P-BE-1..3, P-OS-1, P-HOST-1, P-FE-1..4), owner audits (TB-10: ZCode, Antigravity), and every DM/DG/EV/FL/DL/security test suite. Unenforceable-until-proven claims are correctly labeled as such (transaction timeout TB-13, RP-B PITR, DPoP, F1/F2/F4 CSP, Hyperdrive headroom NOT_SHOWN) rather than asserted.

### Boundary of this verdict

This PASS certifies only that the corrected architecture documents are internally consistent with the approved requirements and that the round-1/preflight dispositions are substantiated as written — the round-1 blocking set (F-01..F-05, and F-06..F-14 dispositions) is closed at document level. It cannot certify runtime invariants (FK enforcement-under-load, lock behavior, boundary worker, idempotency deadline), PostgreSQL behavior as sketched, or $0 feasibility; P-BE-2 and ZCode instantiation will be the first real check. Step 02 remains: author may take this as the independent review record for the Architecture Approval Gate; PO approval and the remaining gates decide Step 02 closure.

**Skipped / residual risk:** no tool execution, no repository checkout, no hash recomputation, no build/DDL/PoC/cost measurement, no re-derivation of the requirements baseline beyond supplied files. Main residual risk: R2-1 and any remaining literal instantiation gaps will be confirmed or amplified by ZCode's schema instantiation; historical-vs-current hash confusion remains possible for downstream consumers who skip the manifest comparison above.
