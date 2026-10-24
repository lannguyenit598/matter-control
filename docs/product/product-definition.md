# Product Definition

Owner: Codex — BA. Status: DRAFT_FOR_PRODUCT_REQUIREMENTS_APPROVAL. Source: [Step 01](../ai-sdlc/step-01-request.md), baseline `20f12fe`. Product identity/scope remain approved; new detailed policy is proposed until the decision gate is accepted.

MatterControl — **Control Plane for High-Stakes Legal Work**.

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.

Principle: **The System of Operational Truth for Complex Legal Matters.** Initial vertical: **Transactions & Corporate Legal Work**. Discovery is closed.

The unit of coordination is a Matter, with conditions to satisfy (Requirements), work people perform (Actions), evidence criteria and supplied proof, dependencies, documents/versions, filings and traceable changes. Completion describes execution; verification describes proof. Neither a task count nor an attachment count establishes closing readiness.

| Persona | Decision/job | Information needed | Failure to avoid |
|---|---|---|---|
| Transaction Owner | Coordinate matter and closing readiness | State, blockers, milestones, decisions, next actions, evidence gaps | Declaring readiness because tasks look complete |
| Contributor | Perform accountable work | My Actions, Waiting On, assignment, due dates, required proof, bulk tools | Working from stale versions or hidden prerequisites |
| Reviewer / Manager | Assess proof and communicate progress | Changes, verification, exceptions, versions, blockers, pending decisions, delta brief | Treating reported progress as verified truth |

Personas are user goals, not application roles. Proposed OWNER/EDITOR/VIEWER permissions are in [permission matrix](../requirements/permission-matrix.md). One person may serve multiple personas while retaining limited permissions.

[PRD](../requirements/prd.md) owns business requirements; [SRS](../requirements/srs.md) owns observable functional/NFR contracts; [glossary](domain-glossary.md) owns terminology. Approved provenance remains [prompt-based](context-provenance.md); originals A/B are optional.
