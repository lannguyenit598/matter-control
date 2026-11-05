# Eigenwelt → MatterControl integration assessment

Date: 2026-10-29. Owner: actual Local Codex, synthesizing the user-requested Research Analyst and Docs Researcher investigations. Status: RESEARCH_RECOMMENDATION, not implementation or product-scope approval. No external application was installed or executed.

## Product recommendation

Keep MatterControl as the operational truth layer. Learn LegalWork's task context, document work and citation patterns; add optional assistance around that core rather than replacing it with a general assistant. The selected focused-workbench composition remains the current UX direction. This research does not restart visual selection.

Three adoption modes must stay distinct:

1. **Interaction pattern:** implement the useful behavior inside existing Next.js/Go features. No dependency on LegalWork is needed.
2. **Bounded integration:** exchange an explicitly selected, authorized artifact with a separate service. Authenticate, scope, validate and audit every request; treat returned content as untrusted candidate data.
3. **Source reuse:** consider only after a specific module has a license/dependency/security review. A repository license is not a blanket license for external services, models, plugins or assets.

## Baseline and scope reconciliation

Approved inputs: `docs/requirements/prd.md`, `docs/requirements/p0-p1-p2-priorities.md`, the legal-team BA report and selected experience direction. The 20 P0 capabilities remain the MVP scope. AI extraction is explicitly **REQ-MC-P2-04**, a grounded assistant **P2-05**, and contradiction detection **P2-06**. Calling them useful does not promote them to P0 or P1. Phase labels below mean recommended research/delivery order, not changes to the approved capability priorities.

Current implementation completeness was not re-audited in this research. Existing capability means present in the approved requirements, not independently verified runtime completion.

## Feature decisions and adoption order

| Candidate | Legal-team benefit / concrete experience | MatterControl placement | Recommendation and necessary boundary |
|---|---|---|---|
| Focused workbench | Arrive at one work item, understand its reason, take one next step | Existing P0-03/04/09/10; selected concept 3 | **First: UX refinement.** Keep ready/waiting/blocked/history separate; reveal other controls on demand. Never collapse Requirement and Action into a generic task state. |
| Task-specific instructions and attachments | Relevant criteria and documents stay beside the work | P0-01/06/07/15 | **First: contextual composition.** Use existing authorized records and exact version references. A local folder is not a permission scope. |
| Source/evidence drawer | Inspect the exact basis of a claim without losing context | P0-06/07/08/15/19 | **First: improve existing evidence UX.** Show document/version, applicable criterion, verifier, as-of and upstream link. Page/quote anchors require a real contract; do not fabricate them. |
| Explainable table review | Compare many documents and click a cell to its source | Manual review can use existing Grid; automated extraction is P2-04 | **Next design candidate.** Preserve raw extraction, source/version/anchor and reviewer disposition. AI confidence is not legal verification. |
| Firm playbooks/templates | Reuse a reviewed checklist for repeated transactions | New template instantiation contract, potentially spanning existing P0 entities | **Next design candidate.** Versioned owner-approved templates create a preview of real Requirements/Actions/dependencies. Validate before commit; no generic workflow builder or silent auto-completion. |
| Intake with human triage | Turn incoming legal requests into accountable work | New scope; current create-Matter contract remains title-only | **Later, narrow pilot.** Retain request and attachments, propose Matter/owner, require human confirmation. Do not introduce an invisible draft-Matter lifecycle. |
| Document redlines and review | Examine proposed contract changes without replacing current evidence | Existing P0-15 for versions; editing/redlining is additional capability | **Later integration.** Separate working copy, proposed version and OWNER-selected current version. Preserve old proof/version history. No overwrite of authoritative objects. |
| Calendar/deadline view | Read upcoming work in one place | P0-02/03/04 presentation; external sync new scope | **Next: read-only view first.** Derive due dates from server records, show timezone and source. Bidirectional calendar events must not silently change legal deadlines. |
| Reusable saved dashboards | Give each role a focused view | P1-12 saved views, P1-13 management export, P1-14 snapshots | **Later within approved priority.** Distinguish live as-of view from immutable historical snapshot; no overall legal readiness score. |
| Firm wiki/knowledge retrieval | Find approved precedent and firm guidance | P1 authorities/propositions/questions; AI retrieval P2-05 | **Later.** Keep firm knowledge distinct from Matter facts and explicit Matter sharing; revoked access must remove search snippets and derived caches too. |
| Storage connections | Import selected files without manual re-upload | Connector scope additional to current P0 import/export | **Later, one connector only.** Read-only, explicit selection/import receipt, source provenance, SSRF/path limits and ACL mapping. No whole-drive indexing or automatic save-back. |
| Office add-in | Review/send a document from Word without context switching | Additional product/channel scope | **Later after web workflows.** Add-in uses the same authorized API and exact version semantics, with explicit upload/commit. |
| Private evaluations | Check extraction/summary quality on representative legal work | Internal QA supporting existing three Golden Workflows | **First for deterministic scenarios; later for AI.** Frozen synthetic cases, reviewer labels, false positives/negatives and permission leakage checks. Evaluation success never changes a legal record. |
| Scheduled work/reminders | Surface approaching dates and follow-ups | Reminder delivery new contract; recurring compliance P2-03 | **Later.** Start with notifications based on deterministic records; no scheduled autonomous legal decisions. |
| Read-only assistant/MCP bridge | Ask for authorized Matter context in another client | P2-05 and a new security surface | **Later.** Begin with bounded read resources, issuer/user/Matter authorization and audit; avoid unconstrained mutation tools or local filesystem access. |
| Audio/voice, remote workers, model fusion | Alternate assistance/execution channels | Additional product, privacy and infrastructure scope | **Defer.** No compelling dependency for usable P0. Multiple provider calls, voice streams and remote workers require distinct data/cost decisions. |

## Recommended end-to-end scenarios

1. **Daily execution:** My Work → named Matter + one assigned Action → reason and criterion/version → permitted command → confirmed readback → same queue/selection. Blocked work opens the upstream condition instead of showing an unexplained disabled button.
2. **Due diligence:** selected document versions → manual review grid → inspect source/evidence → propose findings → independent evidence assessment. Automated extraction can later populate a review queue, never satisfy the Requirement itself.
3. **Transaction playbook:** select an approved template version → preview Requirements, Actions, ownership and dependency edges → validate → explicit creation command. Template state is not evidence of actual completion.
4. **Filing:** prepare package → submit → distinguish receipt from authority approval → record outcome evidence → independent assessment in the correct proof epoch. An AI-generated checklist cannot bypass those stages.

## Integration architecture constraints

### Ecosystem disposition

- **LegalWork** (`dev` `2b8cb18d338da618f686fcdf4dea0ec0eedbe819`, MIT): use work-context, source-review, saved procedure and conflict interaction patterns. A whole desktop/runtime import is a poor fit for Next.js/Go. [Repository](https://github.com/eigenweltlabs/legalwork/tree/2b8cb18d338da618f686fcdf4dea0ec0eedbe819).
- **LegalMemory** (`main` `bdc62e8b71abb526da3e4970ffbcb4ee03b077cf`, AGPL-3.0): a possible separately deployed read-only knowledge provider, after license/deployment and identity/ACL review. Its permission-aware retrieval and exact-version provenance are useful references, not verified behavior in this project. No source reuse is approved. [Repository](https://github.com/eigenweltlabs/LegalMemory/tree/bdc62e8b71abb526da3e4970ffbcb4ee03b077cf).
- **legaloss** (`main` `fa0ba4699561b214e39963d0467a56bee51e9364`, MIT): discovery/reference catalog only; no runtime dependency needed. [Repository](https://github.com/eigenweltlabs/legaloss).
- **emotion-steering** (`main` `a12431875f9f7e1d498af6955704b48ba353404e`, Apache-2.0): unrelated to the approved operational-truth product; exclude from the roadmap. [Repository](https://github.com/eigenweltlabs/emotion-steering).

The ecosystem report's Near/Next/Later labels are research proposals. In particular, a new intake record, external search provider or connector is **not** an already approved P0 implementation. The priority register controls approved scope. No automatic license conclusion follows solely from choosing REST instead of embedding code; deployment/use/distribution details need their own review.

### Data and authority boundary

Existing Next.js BFF and Go authorization/domain services remain authoritative; PostgreSQL retains events, receipts, versions and deterministic state. Optional retrieval/extraction belongs behind a bounded service interface and may produce candidate artifacts only. Do not directly attach LegalWork's desktop filesystem, session, plugin or computer-use model to the Go command layer.

Any future connector/extraction request needs: authenticated caller; explicit Workspace/Matter scope; selected immutable versions; declared provider/data destination; bounded size/time/cost; attributable provenance; idempotent command/reconciliation behavior; output validation; and access-loss handling. Preserve existing receipts/CAS and OUTCOME_UNKNOWN handling for actual writes. A network timeout is not proof that no write occurred.

Retrieval must authorize before returning chunks, citations, names, counts or cached summaries. Document replacement/revocation must invalidate derived retrieval data. Do not use a shared embedding index as an authorization mechanism.

For a LegalMemory pilot, external search visibility and MatterControl context permission must both permit disclosure. Identity mapping and which external documents belong in the chosen Matter are separate design questions; possession of general Matter access alone cannot authorize arbitrary firm knowledge. Begin without write tools or autonomous command execution.

## Important details from the user guide

The reviewed guide explains distinctions that should survive any adaptation:

- A due date tracks work; a scheduled task runs an assistant. Local schedules depend on the computer being awake and the app being open. MatterControl server reminders must define their own delivery/recovery guarantees. [Tasks](https://github.com/eigenweltlabs/legalwork/blob/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/tasks-intake.md), [Schedules](https://github.com/eigenweltlabs/legalwork/blob/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/scheduled-tasks.md).
- Tabular Review separates preparation/OCR errors, absence, uncertainty, empty cells and stale answers. Source/question/model changes can invalidate prior results. Probability does not imply a source quotation exists. Preserve these distinctions instead of turning every completed cell green. [Review guide](https://github.com/eigenweltlabs/legalwork/blob/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/reviews.md).
- Project sharing has content-specific scopes and exceptions: sharing a review can include referenced documents. MatterControl must not copy those implicit disclosure semantics; review citations need independently authorized documents. [Sharing guide](https://github.com/eigenweltlabs/legalwork/blob/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/projects-sharing.md).
- Workflow instructions/resources are reusable inputs, not permissions or legal authority. Changing a workflow does not rewrite old outputs. [Workflow guide](https://github.com/eigenweltlabs/legalwork/blob/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/skills-workflows.md).
- An evaluation judge remains a model; its rubric score is not legal validation. Keep human assessment and product acceptance distinct. [Evaluation guide](https://github.com/eigenweltlabs/legalwork/blob/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/evaluations.md).
- Folder permission, tool permission, model-provider consent and OS permission are separate; a local workspace can still send content to the selected provider. An integration can run on a remote worker. “Local-first” cannot stand in for a data-flow review. [Integration guide](https://github.com/eigenweltlabs/legalwork/blob/2b8cb18d338da618f686fcdf4dea0ec0eedbe819/docs/user-guide/integrations.md).

## Proposed execution sequence

1. Complete the selected focused-workbench experience using current contracts and human-readable labels. Validate the three connected user journeys before adding more surfaces.
2. Improve contextual evidence/version review and deterministic Golden Workflow evaluation. These strengthen existing P0 rather than adding a new AI platform.
3. Prepare separate design contracts for versioned templates and source-linked review grids; distinguish manual review from P2 extraction.
4. Evaluate one read-only document connector or retrieval service with synthetic data only after scope/provider/license decisions.
5. Add optional AI extraction/grounded assistance under the existing P2 boundary, measured against private fixtures and human review.

No dispatch, code import, dependency installation, cloud provisioning or provider payload transmission follows from this sequence. PM and Product Design can consume this assessment and the two research reports to refine the roadmap; implementation scope remains a separate assignment.

## Acceptance of this research

Required: feature claims linked to first-party documents, version/provenance recorded where accessible, implementation/runtime gaps stated, ecosystem licenses differentiated, and recommendations reconciled against MatterControl priorities. The supporting reports retain exact source coverage and access failures. This report makes product-fit recommendations, not independent security, legal-license or runtime certification.

Skipped: external application execution, integration/code reuse and new user testing. Risks: vendor documentation is not implementation proof; scope expansion can delay the usable legal-team core.
