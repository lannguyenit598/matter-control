# MC-002-INT-DEC — Integration/API/Auth Decision Gate

- Owner: Codex PM/BA/Cloud/DevOps orchestration. Actual Claude Code owns architecture; actual OpenCode independent testability review and acceptance plan.
- Priority: P0 architecture readiness. Status: IN_REVIEW / WAITING_PO_APPROVAL; proposal document review passed, never automatic implementation or MC-002 DONE.
- Repository/branch/base: matter-control, task/MC-002-solution-architecture, e377568ac47f8f1b88e3875a8f13d7e57fc30667.
- Authority: step-02-3-request.md; specific provider permission in testing/step-02-3/provider-review-approval.md. H5/W1/Q3/Q5 already approved, not re-requested.
- Requirement references: FR-018, NFR-001/002/003/008/009, AC-134/135/140/147/153/156/158; references express product constraints, not product implementation acceptance.
- Scope: analyze existing runtime decision request, smallest local integration proposal, API/auth and C01 boundaries, PO decisions, dependency-aware future assignments and independent acceptance plan.
- Allowed changes: new Step02.3 decision/proposal/task/review/evidence documents; existing runtime-decision request, project-status, risk-register, agent-handoffs, integration dependency plan, remaining-gates and MC-002 task overlays. Protected product/requirements,15 candidate normative architecture/ADRs, accepted native/R01/R02 evidence remain byte-identical.
- Inputs: full request, runtime request, PO local approval, approved SRS/permission matrix, candidate API/security/ADRs, C01 closure/actual review, native source heads backend52b60a4 and frontend3e5a642, owner PoC reports, current task/handoffs; exact packet manifests in testing/step-02-3.
- Outputs: integration-scope-proposal.md, api-auth-decision-analysis.md (actual Claude); integration-acceptance-matrix.md (actual OpenCode); step-02-integration-task-plan.md and step-02-decision-package.md (Codex); execution/review/provenance records.
- Dependencies: accepted C01-NATIVE and R01/R02 preserved; external analysis can run under specific permission; engineering depends on later explicit PO choice and finalized contracts.
- Acceptance: all16 decision-analysis fields covered; no invented product contract approval; smallest scope and alternatives explicit; auth/authz/isolation/local identity distinct; C01-PRODUCT remains OPEN; all runtime acceptance rows NOT_RUN; actual architect and reviewer returns identified; PO-readable material choices; assigned future owners/dependencies; preserved hashes and local Markdown links valid.
- Checks: document/manifests/hash/link/provenance checks only; no full-suite, DB, integration or baseline rerun. Review PASS qualifies proposal documents only.
- Reviewer: actual OpenCode; Human Product Owner accepts consequential scope/security/hosting/cost trade-offs. Claude reviews later architecture conformance.
- Exclusions: implementation, new product features, enterpriseSSO/IAM, global settings/auth, tests/runtime/containers, paid/production/deploy, Step03, source-template mutation, self-approval.
- Completion evidence: recorded later in the Step02.3 review/execution artifacts and project-status overlay. Stop at Integration/API/Auth Decision Approval Gate.

Current evidence: actual Claude return/correction and actual OpenCode PASS_DOCUMENT_ONLY in ../../reviews/step-02-3-execution.md; future acceptance matrix entirely NOT_RUN. Documentation readiness is distinct from PO approval and engineering execution. No assigned engineering task is READY for dispatch before its dependencies.
