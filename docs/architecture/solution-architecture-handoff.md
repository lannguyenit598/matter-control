# Solution Architecture Handoff — Step 02

Sender/requirements owner: Codex — BA/PM. Receiver: **Claude Code — Solution Architect**. Status: **PREPARED_CONDITIONAL_ON_PRODUCT_REQUIREMENTS_APPROVAL; NOT_DISPATCHED**. Base `20f12fe`; requirements revision is the Step 01 commit containing MC-001/CHG-003. Pin its full SHA and any later approved decision changes before starting. No architecture work authorized by this packet alone.

## Authority and inputs

Approved: identity/positioning/vertical, original 20 P0/14 P1/7 P2, three target workflows, five state vocabularies, distinct legal concepts, templates and Cloudflare constraints. Proposed, not approved: detailed RULE policies, permission matrix, transitions, acceptance protocol and numeric targets. [OBD packet](../requirements/open-business-decisions.md) owns approval state; do not treat a complete SRS as PO acceptance. Pending baseline/testability reviews remain visible.

Read [PRD](../requirements/prd.md), [SRS](../requirements/srs.md), [glossary](../product/domain-glossary.md), [rules](../requirements/business-rules.md), [states](../requirements/state-semantics.md), [permissions](../requirements/permission-matrix.md), [workflow acceptance](../requirements/golden-workflow-acceptance.md), [AC](../requirements/acceptance-criteria.md), [traceability](../ai-sdlc/requirements-traceability.md) and [risk register](../ai-sdlc/risk-register.md). Synthetic Atlas must be adapted to accepted policies before runtime tests.

## Required architectural questions after approval

| Area / requirement | Invariant or proposed contract to preserve | Question/evidence Claude must return |
|---|---|---|
| Typed domain FR-001 / RULE-001/020 | Requirement/Action and criteria/proof distinct; membership scoped; basic legal context preserved | Show domain boundaries and ownership without generic metadata replacement; exact approved P0/P1 boundary |
| States FR-020 | Five independent axes and authorized transitions; frontend not authority | Locate authoritative evaluation, explain consistency/stale handling and test seam |
| Dependencies FR-005 / RULE-003/004 | No cycles; AND gates and recursive readiness; reopened upstream exposes downstream | Concurrency strategy and invariant tests for graph/recompute, including already-completed downstream |
| Evidence FR-006/007 | Independent verifier, validity/version/applicability, attributable reversal | Enforce permissions/expiry/current proof and explain async failure behavior without false VERIFIED |
| Documents FR-015 | Version identity/lineage, explicit promotion and exact submission references | Content/metadata confidentiality, storage/access/cost and lifecycle under retention policy |
| Filing FR-016 | Package criteria, submission/receipt/outcome separation, repeating supplement cycles | Represent authorized observations and history without pretending to execute legal filing |
| Authorization FR-018 | Workspace + matter membership, no implicit grants, all indirect access paths | Threat/access boundaries, revocation and export/download negative tests; demo auth insufficient |
| Bulk/import/export FR-012/013/014 | Per-row/group outcomes, retries, scoped references, formula safety | Isolation/reconciliation/identity strategy; malformed file/resource limits with approved workload |
| History FR-008 | Mutation/history inseparable; corrections append; effective vs recorded time | Durability, ordering, retention and recovery; do not infer mandatory event sourcing |
| Brief FR-019 | Deterministic authorized draft from explicit inputs; P1 snapshots deferred | What historical facts can be retrieved under accepted retention? Fail honestly when unavailable |
| NFR-001..014 | Measurable protocols with open budgets explicitly gated | Security, correctness, usability/performance, availability/recovery evidence and trade-offs |

## Constraints / technical risks

Backend source: https://github.com/lannguyenit598/go-hexa-template

Frontend source: https://github.com/lannguyenit598/nextjs-atomic-starter

Deployment target: Cloudflare Free Tier. Infrastructure target: $0/month for defined MVP workload. **Go/Echo/PostgreSQL compatibility UNVERIFIED.** No permission to swap backend/database or purchase infrastructure to make a proposal fit. Inspect exact source commits and runtime dependencies before deciding. No source audit was performed in Step 01.

Open inputs: tenant/matter/user/concurrency envelope; document sizes/version growth; import/export frequency; retention/legal hold/erasure needs; RPO/RTO; latency/availability budgets; matter-level vs narrower confidential-document access. 50–200-row UX and 10-second comprehension are not infrastructure capacity/SLA evidence. Cost inventory must include required storage/backup/traffic/ancillary services, not only compute.

## Return contract and stop boundaries

When Step 02 is explicitly assigned: acknowledge task, tool identity, exact input revision, PO decision status and allowed paths. Return requirement-linked alternatives, feasibility evidence, architecture/API/data/security contracts and ADRs for material decisions. Identify unresolved conflicts and affected FR/NFR/AC; do not silently lower P0, erase guard conditions or infer legal sufficiency. Human approves architecture/cost trade-offs. OpenDesign designs detailed UX at Step 03. ZCode/Antigravity implement only later approved contracts; OpenCode independently validates.

Current deliverable is an input packet, not schema, hosting topology, chosen service, deployed architecture or external handoff acknowledgement. Step 02 readiness: **CONDITIONAL / NOT_AUTHORIZED_TO_START**, pending Product Requirements Approval Gate and review disposition.
