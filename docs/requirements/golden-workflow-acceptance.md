# Golden Workflow Acceptance Specifications

Owner: Codex. Status: DRAFT_FOR_PO_APPROVAL / NOT_RUN. Sequences are APPROVED_INPUT; guards and policies are PROPOSED per RULE/OBD. Tests must exercise persisted business behavior, permissions, history and state readback across views; mock screens alone do not pass. Synthetic Atlas at `20f12fe` is a starting context, not a completed workflow fixture.

## GW-01 — Transaction / Restructuring

**Approval → Document → Signature → Payment → Transfer → Closing → Filing → Post-Closing.**

- Actors: Transaction Owner (matter OWNER), contributors (EDITOR), designated non-submitter verifier (EDITOR/OWNER), manager (scoped VIEWER or edit role); external signatory/authority represented as parties.
- Preconditions: active memberships; typed requirements/actions and explicit prerequisites; approval/closing criteria and milestone prerequisites defined; synthetic documents and evidence available for staged progression. No real payments/signatures performed by product.
- Main path: record internal approval requirement and proof; reviewer verifies it. Add agreement version, OWNER promotes authority, record content review. Track partial then complete signature criteria on exact version. Record actual payment and transfer confirmations against respective requirements. Evaluate explicit closing prerequisites; record closing outcome/proof. Prepare and track filing as GW-03. Complete post-closing handover requirement and independent proof.
- State transitions: each action starts only when READY, may WAITING on party, then COMPLETED without automatic verification. Requirement completion attested separately; proof verification separately. Dependency recomputed after each accepted change. Closing readiness follows RULE-008, not total action completion.
- Evidence/documents: approval record; agreement with version/signature components; payment confirmation; transfer/closing checklist and proof; filing submission/receipt/outcome; handover acknowledgement. These are scenario categories, not jurisdiction-defined legal sufficiency.
- Alternative paths: missing signature → WAITING + partial verification and blocked chain; completion without uploaded proof → COMPLETED/UNVERIFIED; no-signature applicability only via explicit OWNER rationale. Explicit scope change cannot silently remove a legal obligation.
- Exceptions: upstream reopened or proof expires → downstream re-blocks without rewriting completed history; supersession invalidates current-version criteria only; concurrent completion rejected if prerequisite changed; cancelled prerequisite does not satisfy closing.
- Permissions: matrix on every observation/transition; OWNER milestone prerequisites/promotion/cancellation; designated verifier cannot be submitter; read/export scoped.
- Outputs: traceable closing readiness and remaining gaps, exact document lineage, attributable payment/transfer assertions, filing status, post-closing proof, deterministic draft delta.
- Event History: approval/proof decision, version/promotion, signature observation, dependency impact, completion/verification/reversal, milestone definition/readiness, filing cycle and handover events.
- P0 minimum: basic linked decisions, signature observations, filing and entity context; P1 compatibility: keep exact version/party/decision references for future advanced tracking without implementing it.
- Test target: synthetic progression extends Atlas RQ-04→AC-05→AC-07→AC-08→AC-09. Under proposed RULE-006 use distinct submitter/verifier; existing Atlas self-review is not a valid approval fixture. Define gates explicitly under RULE-003. AC-161 plus AC-102/107/115/121/123/124/128/140/141.

## GW-02 — Due Diligence

**Request → Document → Review → Gap → Finding → Follow-Up → Resolution.**

- Actors: contributor requester/coordinator, external provider, reviewer/verifier, Transaction Owner deciding follow-up priorities.
- Preconditions: RQ-03-style review requirement and RQ-04-style gap requirement distinct; acceptable evidence criteria, current-version policy, ownership and access set; separate provider and internal owner; no automated external messaging implied.
- Main path: record request and expected proof; receive document as a new version; review identified version against criteria; identify missing component as gap; record typed Finding and responsible follow-up Action; record external wait/response; submit resolution proof; independent verifier assesses; explicitly complete requirement when outcome attained.
- State transitions: request Action may COMPLETED while Requirement UNVERIFIED; review can create partial proof/gap; follow-up WAITING with READY if no dependency; valid proof may unlock dependent work only after completion/proof gates; findings resolve with reference, not by deleting gap history.
- Evidence/documents: requested-document reference, exact received pack version, review note, missing component criterion, supplementary proof and resolution decision. Request sent is not evidence of resolved gap.
- Alternative paths: no gap found → record review result and resolve directly without inventing Finding; incomplete response → remain waiting/partial and schedule new explicit follow-up; another document version → review current/fixed applicability before acceptance.
- Exceptions: evidence rejected/expired/disputed, contributor lacks read rights, response linked to wrong matter, duplicate import or concurrent review. Keep accepted prior history and deny invalid transition; do not suppress finding because a document exists.
- Permissions: contributors record requests/documents/follow-up; designated independent reviewer accepts evidence; OWNER assigns/changes critical policy; VIEWER cannot mutate.
- Outputs: gap status with owner/evidence, finding/follow-up lineage, next action and outstanding external wait, completed/verified resolution distinguished.
- Event History: request, version received, review verdict, finding raised/updated, follow-up/waiting, response and resolution with exact proof links.
- P0 minimum: basic Finding/Decision/Risk/context; P1 advanced finding taxonomy, legal propositions and legal-question models remain deferred.
- Test target: extend Atlas RQ-03/04, AC-03/04, ER-03/04, FD-01. AC-162 plus AC-101/106/126/127/130/140/157/159; no auto external email task.

## GW-03 — Regulatory Filing

**Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval.**

- Actors: contributor filing coordinator, signatory/authority external parties, Transaction Owner, designated verifier, scoped manager.
- Preconditions: filing subject/owner, authority party, applicable package checklist/documents/signatures and exact version requirements known; access granted. No claim that these templates encode a jurisdiction's law.
- Main path: create filing requirement/package; prepare declared documents; collect/record necessary signature proof; validate package; record actual submission reference/time/version set; separately record receipt; WAITING on authority; record supplement request with owner/due and cycle; prepare response/new version and record submission; await review; record approval outcome proof; independently verify requirement.
- State transitions: follow Filing stage table in state-semantics.md. Submission and Receipt leave outcome open; Authority Review WAITING can coexist with dependency READY. Supplement returns execution to IN_PROGRESS; Response returns to authority waiting; Approval observation can be COMPLETED/UNVERIFIED before proof verification.
- Evidence/documents: checklist/applicability rationale, exact submitted package versions, signatures where required, submission reference, acknowledgement/receipt, authority request, supplement response and approval/rejection outcome.
- Alternative paths: no supplement → Authority Review directly Approval on actual proof; repeated supplement cycles → preserve each request/response, latest outstanding wait explicit; no signatures required → documented applicability rather than fake evidence.
- Exceptions: package incomplete, wrong version, submission without receipt, overdue authority response, rejected/withdrawn filing, superseded draft not submitted, stale concurrent stage update. Rejection is explicit negative outcome/CANCELLED by OWNER, never Approval; linked requirement remains unmet.
- Permissions: contributor records allowed stages; OWNER cancellation/reopen/correction; designated verifier handles proof; all documents/history/exports honor matter membership.
- Outputs: actual stage/proof/waiting and next owner, exact submission lineage, unresolved supplement needs, approved outcome only with supporting observation and separate verification.
- Event History: each package/version/submission/receipt/authority response/cycle/outcome, actor/time/reason/correlation; no overwriting old submitted versions.
- P0 minimum: manual operational tracking of declared package and authority interactions. P1 advanced filing packages and signature automation deferred; no external e-filing API required.
- Test target: extend FIL-02 beyond Atlas Authority Review into two supplement/response cycles and outcome; exercise FIL-01 no-supplement alternate and rejection. AC-163 plus AC-116/129/130/145/147.

## End-to-end acceptance contracts

### AC-161 — Transaction to post-closing

Given an authorized synthetic transaction with independently reviewed proof, declared required milestones and RULE-003 gates, when actors progress each GW-01 step, then intermediate missing signature/evidence prevents dependent completion, final closing readiness requires all explicit prerequisites, filing/post-closing remain separately tracked, and every accepted change appears consistently in Grid/Control Room/history/delta. Reopen an upstream verified requirement after closing: dependent exposure becomes visible without deleting the historical closing observation. Test must record before/after states and exact proof references; result NOT_RUN.

### AC-162 — Due diligence resolution

Given a received DD pack with missing mandatory component, when reviewer records gap/finding, contributor follows up and submits supplement, and independent verifier accepts valid proof, then gap resolves only against that criterion/version, external wait and follow-up lineage remain traceable, and related dependency is satisfied only under its gate. Rejected/expired proof and no-gap alternate tested separately. Wrong-matter response denied with no mutation. Result NOT_RUN.

### AC-163 — Filing with alternatives

Given complete declared package and version-specific proof, when coordinator records submission/receipt and two supplement-response cycles before approval, then all original submissions/cycles remain retrievable within permission scope, current authority wait is correct, receipt never implies approval, and final approval observation remains distinct from verified outcome. Also exercise no-supplement success, incomplete-package denial and rejection/withdrawal; readback/history/delta required. Result NOT_RUN.

For each AC-161..163 run, maintain a stage checkpoint ledger: actor/permission, before/after state and proof, exact version, history event, Grid/Control Room readback, scoped delta/export. This binds FR-008/009/011/014/018/019/020 alongside the workflow-specific contracts in traceability, so failures are reported at a named stage/contract. All three workflow ACs are cross-JTBD (BR-001..007). No new IDs or implementation tasks are created by these checkpoints.
