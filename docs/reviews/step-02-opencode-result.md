# Step 02 OpenCode Independent Review — Round 1

Date: 2026-10-24. Actual OpenCode CLI2.1.4, configured provider, packet-only plan mode with tools denied. Session `ses_e929198d8ffeFwkVV16SNbAFYR`; CLI exit0; result **CHANGES_REQUIRED**, five High / nine Medium numbered findings plus observations. Actual model is verified separately from session metadata, not from self-description. Human explicitly authorized this named30-snapshot337591-byte packet. No architecture, policy or runtime approval inferred.

## Recorder qualifications

The returned report incorrectly says31 manifest entries; actual packet contains30. It also says hash-verified: reviewer tools were disabled, so this is not independent hash recomputation; Codex's per-file hashes identify the exact subject. Reviewer handoff/switch-agent questions at the end are model prose, not instructions to Codex; Codex is authorized to preserve this report. Findings/recommendations require architect disposition; F-07 must not silently broaden approved RULE-003 (proof gate requires VERIFIED, not NOT_REQUIRED). The boundary comparison observation addresses pure timing predicates, not necessarily boundary scheduling completeness; additional Codex observations go to Claude for adjudication. Hosting/etc open gates are not fabricated failures.

## Reviewed snapshot SHA256

| File | SHA256 |
|---|---|
| docs/architecture/system-architecture.md | 7c991677b31015f984c30aa5882f1099c6c8a37c477a0c86c6850a4caeea4ef9 |
| docs/architecture/domain-model.md | 37e160c183db33210d29c301fa50a22b17945be98ff811f5b4c089dcf13c24a8 |
| docs/architecture/state-machine.md | 6194b024e867f2eba080ce9c88fa5d0b8d2169c3e04f9cadc2ae43e85986883d |
| docs/architecture/dependency-engine.md | 7f7ddc40f6384bd725b53446254d78a0be0d55367f6d1ed6bc07e172df0f079d |
| docs/architecture/evidence-model.md | a1796c06de7116e15ab7230cbf776f1a5d61630ec87b616df1222401fa1e6f55 |
| docs/architecture/document-lineage.md | 33b62940a6099e059f74a3f8bac09b9ebad2775599702fc1fe9a276b7787b4b4 |
| docs/architecture/filing-model.md | 1c2c8e6f76f5e772e0493849c94b56749c50167d7969314e044f47ae5fdcc176 |
| docs/architecture/api-contracts.md | b513294fff2ccc0b5e0cd4d411b57d864409f9f8c1d9b4ab48fd27f19191f24e |
| docs/architecture/data-model.md | 9863c4766267aeb090f24f617fd1844d348f115b8975500f7deb5b39ddc07810 |
| docs/architecture/security-architecture.md | e63004b84c452aa22842b12510d140c19c704ea789e31328c872c1ce88e4ac9d |
| docs/architecture/technical-blockers.md | e50d8fd77fd4f3ae9df3e46930432b61052378ad55c61f06d6a49da5217b1ad8 |
| docs/architecture/adr/ADR-001-runtime-and-hosting.md | e3fb634cea2e67aaa12230d6edccefcd333e974ef45f542ed255a438cc636eb2 |
| docs/architecture/adr/ADR-002-transaction-and-concurrency.md | 13d1ae699a4ffb7249df53ac43c8c46dba631316e00f79c443cb0d2dedfbb1fe |
| docs/architecture/adr/ADR-003-frontend-runtime.md | 77d5155f3cf2eee6c4083fe86d9579f7c879778999357559ab51b61525b78070 |
| docs/reviews/step-02-claude-architecture-result.md | 9d1ac60335718b583bdf519f8a4323ad9c0342f714e9a5cf8d2df768925c7b9b |
| docs/requirements/prd.md | bcdd1c9e2ead81c9242e44dd485f4aa7e39039609f57c9246d53dd543afe4a03 |
| docs/requirements/srs.md | 9b813badd88a196c938d9e0503d904ad767f3090ff7522dcc6fae3eb689869f8 |
| docs/requirements/business-rules.md | 96be507d3b0d70f0b9ad1c2b27b3152fd5e2700f13e8a647920c60c220f2aa81 |
| docs/requirements/state-semantics.md | 156ca1dd2f75a7374a59d2aa4af4a9815ce62a2f11c03f84977bad2860a2ad51 |
| docs/requirements/permission-matrix.md | f352fcf0f1f2617b5d5c072c34472f84619f4bda555c855dbdf1871b469b0276 |
| docs/requirements/acceptance-criteria.md | 809c206e576e6d4cc0f3642caeec4ee6997b465ffe2f0b316368f7e106e97fa7 |
| docs/requirements/golden-workflow-acceptance.md | 0a7d44521bdb89e2499de588242c3b9244827ef9a6366d6bcb5b5a576238a787 |
| docs/requirements/open-business-decisions.md | b950aead586e74d0639b72693e8238fa6fbd197510475fc2b5dc931233e69ede |
| docs/architecture/cloudflare-feasibility.md | a1f8fa2a76e4875314a16ff49a505866d4b41d24007d2869636814369a26b959 |
| docs/deployment/free-tier-budget.md | 16e3ebf68519461a4a4f6c775e07d1a9746e4060b0551096de96bf4a35f3067c |
| docs/architecture/repository-audit.md | ea47ef81fb701fd4e9b822a3814cedbce0bfd889dd1e1419369e629559702d14 |
| docs/ai-sdlc/step-01-approval.md | 72228a67ca5ccfe63b5f7f44070da8edfd5cbda1b0912ba27c917311bdc0ae74 |
| docs/ai-sdlc/step-02-request.md | 29f64b90dca7b2752ba5da67131833af509de5b7584bf64f69a91a0c25a45a05 |
| docs/tooling/step-02-sources.md | 315273db9525932ed90da3c3381658be957bfcde31ed7f1e0187a19ce1e98199 |
| docs/tooling/step-02-claude-output-manifest.json | 397c9b0fdfca089373d3d4220fd345414fbd844e03c49b155ead28cc2d21578c |

## Returned report — verbatim except trailing whitespace

## MC-002-QA — Independent Architecture / Security / Technical-Testability Review

**Reviewer identity:** OpenCode (independent QA/verification role). No tools, no commands, no repository access beyond the supplied manifest and file snapshots.
**Inputs reviewed:** the 31 manifest entries, hash-verified as supplied. Requirements authority: `docs/requirements/*` at subject `572835a`, approval record `docs/ai-sdlc/step-01-approval.md`.
**Not reviewed / not inferred:** template source code, DDL execution, compilation, migrations, PoC output, Cloudflare account state. Every statement below is a document-to-document consistency finding. I do not approve business policy, architecture, or infrastructure cost. No security certification is claimed.

**Verdict: `CHANGES_REQUIRED`** — targeted corrections, no re-architecture. Five findings block architecture approval on their own terms (F-01, F-02, F-03, F-04, F-07). Hosting/frontend/IdP/storage/workload choices and NOT_RUN PoCs are treated as legitimate gate limitations, not defects; Step 02 nonetheless cannot be `DONE` while they remain, which the author already states.

---

### HIGH

**F-01 — Advertised cross-matter structural impossibility is contradicted by the DDL sketch**
- File/section: `data-model.md` §1 ("composite foreign keys … a cross-matter reference is structurally impossible") vs §4.
- Evidence: `evidence_claims` carries `matter_id UUID NOT NULL` with **no** FK to `matters` and no `UNIQUE (matter_id, id)`; its only FK is `(evidence_id, evidence_submitter_id) → evidence (id, submitted_by)` — matter-free. `evidence_assessments` has no `matters` FK and its claim FK is `(claim_id, evidence_submitter_id, claimant_id)`. `evidence_disputes.assessment_id REFERENCES evidence_assessments` is single-column. `criterion_components → criterion_revisions` is single-column. `evidence_requirements.subject_node_id` has no FK to `graph_nodes` and no same-matter check. `document_versions.document_id` has no matter-composite path, so `matter_id` can disagree with the document's matter.
- Impact: AC-135 / NFR-005 are asserted from constraints that do not instantiate them. A cross-matter claim, assessment or dispute can be persisted and then feed `componentSatisfied` in the wrong Matter; per-Matter locking would not serialize it. This is the invariant the reviewer specifically asked to check (M:N epoch/no-self), and it is exactly where the composite-FK pattern breaks.
- Correction: add `UNIQUE (matter_id, id)` on every parent named above; make claim/assessment/dispute/component FKs carry `matter_id`; add `FOREIGN KEY (matter_id) REFERENCES matters`; add subject/edge existence FKs. If the sketch is not to be completed now, downgrade §1 from "structurally impossible" to "application-enforced; DB enforcement pending" and mark AC-135 `NOT_SATISFIED_BY_DESIGN_AS_WRITTEN`.
- Owner: Claude Code (design); ZCode (owner audit of instantiation).

**F-02 — Replay of stored responses is not re-authorized, and 404 does not mean "never committed"**
- File/section: `api-contracts.md` §1 (Idempotency, Unknown outcome), §3.4–3.6; `security-architecture.md` §3, §4; `data-model.md` §6 (`command_receipts`).
- Evidence: receipts store the full `response JSONB` keyed only `(actor_id, idempotency_key)`. `GET /operations/{key}` returns that body with no membership check stated. The contract asserts `404` means "never committed; safe to resubmit". `command_receipts` has no `expires_at`, no matter scoping, no retention rule.
- Impact: (a) A revoked or demoted member can retrieve a matter payload after revocation by replaying a key — violates RULE-017 / AC-147 ("deny all current access") and the uniform-404 rule. (b) Absence of a receipt at read time cannot distinguish "never ran" from "in flight / not yet visible"; a concurrent duplicate may take the unique-violation path with no specified mapping, and the stored response may concern a different matter than the caller assumes — a cross-matter payload echo risk. (c) Unbounded receipt growth conflicts with deferred retention (TB-06) and is a storage-cost input nobody has counted.
- Correction: require the operations endpoint to resolve `matter_id` and run the same in-transaction authorization as the original command; return uniform 404 when unauthorized. Scope receipts to matter or validate request-hash + matter before replay. Define "unknown" as `202 IN_PROGRESS`/`409 still-running` rather than reusing 404. Add receipt retention/cleanup to TB-06.
- Owner: Claude Code; security re-review by OpenCode.

**F-03 — Filing reopen does not reset proof epoch or verification; a previously accepted authority outcome can keep satisfying the reopened filing**
- File/section: `filing-model.md` §4 ("Change after approval | OWNER reopen | prior submission/outcome preserved"); `state-machine.md` §2 (epoch increment specified only for Requirement/Action reopen); `evidence-model.md` §4 (satisfaction requires `a.subject_epoch == subject.proof_epoch`).
- Evidence: only node reopen increments `proof_epoch`. Filings have `proof_epoch` in `data-model.md` §5 but no reopen rule touches it, and no filing-side rule resets `verification_state` to `UNVERIFIED` (RULE-004 explicitly requires this "unless NOT_REQUIRED").
- Impact: AC-145's "Approval after negative outcome rejected unless OWNER reopen **and new authority approval evidence**" is not enforced. Old accepted outcome proof continues to satisfy the reopened filing's criterion, so the "new evidence" guard is satisfiable by state that should have been invalidated — a direct requirement violation, and the mirror of EV-08 which exists only for nodes.
- Correction: on filing reopen, increment `proof_epoch`, set verification `UNVERIFIED` (unless NOT_REQUIRED), apply time boundaries, recompute readiness; add `FL-08` asserting an old authority-outcome assessment cannot satisfy a reopened filing. Align `filing-model` §2's "APPROVAL → COMPLETED with verification UNVERIFIED" with the `proof_required=false` case.
- Owner: Claude Code; test owner ZCode.

**F-04 — `dependency_edges` references the supertype only; orphan graph nodes are representable, and edges may point at a node with no typed state**
- File/section: `data-model.md` §3; `domain-model.md` §4–5; `dependency-engine.md` §1–2.
- Evidence: both edge FKs target `graph_nodes (matter_id, id)`. `requirements` and `actions` each add a `kind`-checked FK into `graph_nodes`, but nothing guarantees every `graph_nodes` row has exactly one typed child row, and no `UNIQUE`/trigger enforces it. `Recompute` reads `exec`/`ver` per node.
- Impact: an edge can be created to a `graph_node` with no `requirements`/`actions` row; readiness then either errors at runtime or defaults to a value — both contradict invariant 3 ("no default READY") and NFR-005. This is the one place the class-table inheritance pattern is load-bearing, and it is unguarded.
- Correction: either add a deferred constraint trigger asserting child existence per `kind`, or have edges FK to `requirements`/`actions` composite keys with a kind discriminator. Add a DM test inserting an orphan node + edge.
- Owner: Claude Code.

**F-05 — Boundary fence makes reads depend on a write transaction, creating self-imposed unavailability and per-read write amplification**
- File/section: `state-machine.md` §6; `data-model.md` §8; `system-architecture.md` §8; `evidence-model.md` §4.
- Evidence: `componentSatisfied`/verification and timing are already pure functions of `asOf`. Nevertheless "before any command **or read** … the service runs `ApplyBoundaries` inside the matter write transaction", and "if boundaries cannot be applied … the read returns 503 instead of pre-expiry state". The read path is REPEATABLE READ, and the fence is a *separate* write transaction preceding it.
- Impact: (a) any provider read-only window, fence bug or lock contention turns every read of that Matter into total unavailability — a chosen availability regression against NFR-008 that the design does not need, because read-time evaluation already yields correct expiry semantics. (b) The first read after each boundary costs a write transaction plus n events; this is the statement multiplier missing from the §12 cost discussion (see F-09). (c) If `asOf` can be caller-supplied and is in the past, `boundaries_applied_until > asOf` makes historical current-state reads impossible while the contract promises `asOf` on every response; the contract never states `asOf = now`.
- Correction: split the two concerns — evaluate reads purely at `asOf` (no write, always available); record boundary events asynchronously for history, with the honest consequence documented (recorded-time briefs will attribute late-recorded expiry to the window in which it was first observed). State explicitly that `asOf` for current-state views is server-now and historical reads are event-fold only.
- Owner: Claude Code.

---

### MEDIUM

**F-06 — "All mutations require If-Match" contradicts the creation and evidence-submission exceptions.** `api-contracts.md` §1 vs §3.3 ("creation-type commands do not require If-Match… submission does not change subject state"). AC-160/428 tests cannot be written unambiguously. Correction: state the rule as "If-Match required iff the request mutates an existing revisioned target", and classify each catalogue row. Owner: Claude Code.

**F-07 — ARCH-Q1's proposed resolution converts an approved OWNER exemption into a permanent unsatisfiable gate.** `dependency-engine.md` §2, `state-machine.md` §3, `evidence-model.md` §5. Under the proposal, a `COMPLETION_AND_VERIFIED` edge is rejected if upstream is `NOT_REQUIRED` at creation, and if applicability later becomes `NOT_REQUIRED` the edge "stays unsatisfied" forever — because aggregate returns `NOT_REQUIRED`, never `VERIFIED`. Outcome then depends on ordering (exempt-then-link vs link-then-exempt). This is presented as open (correctly), but the proposed default is a trap that RULE-003/005 do not require. Recommendation before PO/BA decision: treat `NOT_REQUIRED` upstream as satisfying the proof gate (the obligation is satisfied by explicit reasoned decision) and surface the exemption as a reason; alternatively require the OWNER exemption to re-gate affected edges atomically. Owner: Claude Code → PO/BA.

**F-08 — Lock order inversion between membership grant paths and commands.** `data-model.md` §7, `security-architecture.md` §3, `ADR-002` §1. Commands lock `matters` `FOR UPDATE` then read `workspace_memberships`/`matter_memberships` `FOR SHARE`; `POST /workspaces/{ws}/matters` and membership grants necessarily touch membership rows before/with the matter row. ADR-002 §3's claim "deadlocks across matters cannot occur because each command locks exactly one matter row first" covers only domain commands. Correction: declare one global lock order (membership → matter) or take the matter lock first in grant paths too; add the inversion to the R1–R12 race map. Owner: Claude Code.

**F-09 — Workers/Hyperdrive headroom claim in §12 is not supported once statements-per-request is applied.** `system-architecture.md` §12 states W1 ≈6,000 and W2 ≈20,000 requests/day "both sit below … Hyperdrive Free 100,000 queries/day". The same sentence concedes "a single Control Room view may issue several queries"; at ≥5 statements/request W2 already exceeds 100,000, and F-05 adds a write transaction per post-boundary read. Correction: present the comparison as `requests × measured statements/request ≤ 100,000`, mark it `NOT_SHOWN` rather than "below", and add the fence's amplification. Owner: Codex (cost); Claude (design input).

**F-10 — Assessment CAS/`If-Match` target is undefined when claims span subjects.** `api-contracts.md` §3.4 uses a single `If-Match: <subject revision>` while §1/§2 allow `expectedRevisions{}` maps for multi-resource commands and one evidence item may be claimed across subjects. Correction: require `expectedRevisions` for every affected subject, or define which single subject the ETag binds. Owner: Claude Code.

**F-11 — Bulk preview integrity is under-specified.** `api-contracts.md` §3.6, `data-model.md` §5 (`bulk_previews`). Commit accepts `previewId` with no stated check of preview owner, matter, expiry, or patch equality; `expiresAt` is returned but never enforced. RULE-013 requires recheck of permission and revision — revision is covered, the preview envelope is not. Correction: commit validates `(actor, matter, not expired, patch hash)` and returns a distinct problem type. Owner: Claude Code.

**F-12 — Import group atomicity is asserted in requirements but not in the transaction section.** `api-contracts.md` §3.7, `data-model.md` §7 ("bulk and import commit per row/group"), RULE-014/SRS FR-013 require a dependency-connected group to be rejected or applied as a whole. The contract never states that one group = one matter-locked transaction, nor that cycles/missing refs reject the whole group rather than the row. Correction: state group-unit atomicity explicitly and add AC-131 to the DM/API test list. Owner: Claude Code.

**F-13 — Golden-workflow end-to-end invariants are not in the ownership matrix.** `system-architecture.md` §10 covers AC-101..160 but never AC-161/162/163; only FL-02/FL-05/FL-06 touch AC-163, and nothing covers AC-161/162 readback consistency. Step 02 §12 requires all three workflows preserved. Correction: add three workflow rows naming the owning services and integration test seams. Owner: Claude Code.

**F-14 — If ADR-003 option F3 is selected, the existing CSP and token model are unsafe as documented.** `ADR-003` §2/§4 propose browser-held bearer tokens as the most $0-plausible frontend; `security-architecture.md` §1 records that `next.config.ts` CSP uses `'unsafe-inline'` without nonces and was "accepted by template for PPR". `'unsafe-inline'` + browser bearer token = token exfiltration via any injected script; NFR-001/AC-147 rely on current authorization which a stolen token satisfies. Because F3 remains gated, this is not an automatic defect — but §5–§6 should state the conditional control (strict nonce CSP, in-memory token, or a BFF) so gate selection is not blind. Owner: Claude Code (with F3 PoC, OpenCode security review).

---

### LOW / OBSERVATIONS

- **Effective-time after recorded-time on corrections.** `domain-model.md` §10 / `state-machine.md` §2 allow `execution-corrections` to set a "corrected effective time"; `domain_events` has `CHECK (effective_at <= recorded_at)`. A correction asserting a future effective assertion is unrepresentable; state the constraint on corrections.
- **Proof applicability for filings.** `filing-model.md` §2 forces `UNVERIFIED` after approval even if the filing has no proof-required criterion; `state-semantics.md` allows `NOT_REQUIRED`. Make the conditional explicit.
- **`next_boundary_at` composition.** `state-machine.md` §6 includes "filing due instants" without the nonterminal qualifier used for nodes; a completed/cancelled due instant left in the minimum would pin the fence in the past. Recompute must exclude terminal objects.
- **`evidence_requirements` subject consistency.** §4 checks `num_nonnulls(...)=1` but not subject/kind alignment with the same matter; covered by F-01.
- **Verdict wording.** `security-architecture.md` header correctly says no independent review yet. My PASS/CHANGES_REQUIRED here concerns document consistency, not deployed behavior; it must not be cited as a security certification.
- **ARCH-Q1..Q3** are correctly labelled as open interpretations and do not silently rewrite approved requirements; RULE-003's proof gate and RULE-006's no-self authority are preserved. F-07 is the only place where the *proposed* resolution, not the requirement, is unsafe.
- **Author observations validated:** (1) confirmed and raised — F-02, F-06; (2) confirmed — F-01, F-04; (3) **not** a defect — `dueAt < asOf` and `asOf ≤ dueAt ≤ asOf+48h` are contiguous, no gap at either end, and the 48h window is inclusive per AC-142; (4) partly real — F-05; (5) the narrative's abbreviated hashes in `step-02-claude-architecture-result.md` §2 are correctly subordinated to the exact manifest, which matches the snapshot manifest; no hallucinated input hashes found; (6) confirmed — the three questions are labelled and gated.

### Coverage summary

20/20 P0 capabilities are represented and correctly separated (Requirement≠Action, criterion≠proof, completion≠verification, waiting≠blocked); typed aggregates are not collapsed into `Item+JSON`. Five axes are independently defined and mutually non-derivable, with the permitted combinations tested. Three golden workflows are structurally traceable but end-to-end acceptance is thin (F-13). M:N claims, epochs and DB-level no-self are genuinely well designed at the claim level — the failure is the *scope* of the constraints (F-01) and filing epochs (F-03). Cycle serialization via matter row lock + BFS under lock is sound for the stated write-skew case (DG-06 credible); the residual risk is lock ordering (F-08), not cycle logic. Documents/filings/receipts/brief design are the strongest parts; the brief's recorded-time fold is deterministic and the late-recorded split is honest, but ARCH-Q3 is rightly still open.

**Gate status:** architecture approval `NOT_GRANTED`. Required before approval: F-01, F-02, F-03, F-04, F-05 closed or converted into explicit, named gate items with owner and test. Hosting/frontend/IdP/storage/workload and P-BE/P-FE/P-OS/P-HOST PoCs remain legitimate open gates; they are not waived by this review.

**Skipped:** no source checkout, no DDL execution, no `go test`/`pnpm build`/`vinext check`, no PoC, no cost measurement, no re-derivation of the requirements baseline beyond the supplied files. **Residual risk:** document-level consistency cannot establish that the sketch compiles, that PostgreSQL enforces these constraints as written, or that Cloudflare quotas behave as documented; F-01/F-04 in particular will be either confirmed or amplified when ZCode instantiates the schema.

The review is delivered above as conversation output only — per Plan mode I have not written it to the repository (`docs/reviews/step-02-opencode-result.md` would be the natural location once authoring is authorized).

Two things worth deciding next:

1. **Persisting the review.** If you want the report committed as the MC-002-QA evidence artifact, that requires switching agents — I cannot create or edit files in this mode.
2. **Disposition of the five blocking findings.** F-01 (cross-matter FK sketch), F-02 (receipt replay / unknown outcome), F-03 (filing reopen epoch), F-04 (orphan graph nodes), F-05 (fence-coupled reads) are all Claude Code-authored design defects, not gate placeholders. The cheapest path is a targeted amendment to `data-model.md` §1/§4/§3, `api-contracts.md` §1, `filing-model.md` §4 and `state-machine.md` §6 — no re-architecture required — followed by a scoped re-review of just those sections rather than a full second pass.

I can work through the exact amendment text for any of these with you here, or draft the re-review checklist for the scoped pass. Which do you want?
