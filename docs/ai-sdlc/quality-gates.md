# Definition of Ready, Definition of Done and Quality Gates

## Definition of Ready

A task is READY only when: requirement IDs and current baseline exist; scope/exclusions and allowed paths are clear; acceptance criteria are testable; dependencies/inputs are available at known revisions; owner and independent reviewer are assigned; test approach and risk/permission boundaries are specified; required upstream Human decisions are recorded. Missing information belongs in an explicit discovery-of-facts task, never hidden inside feature implementation.

## Definition of Done

A task is DONE only when all acceptance criteria pass with revision-specific evidence; required tests pass; independent review has no unresolved blocker; relevant security/accessibility/migration checks pass; docs/traceability/risk entries are updated; required Human decisions exist; artifacts are committed and locatable. Any N/A check needs rationale and reviewer acceptance. An author's self-check is not independent review.

For documentation-only bootstrap: structure, required fields, links and consistency are checked; code/runtime tests are N/A. Human review is still pending, so MC-000 is IN_REVIEW.

For Step 00A: product direction and P0 baseline are already approved by direct PO instruction; do not request them again. The [Step 00A.1 directive](step-00a1-request.md) replaces the former original-file gate: original A/B archival is optional. Stage completion requires the 12 criteria below; independent review was Pending at that baseline and was reported separately (actual REV-00A now PASS; MC-00A DONE for 20f12fe). This PO-defined stage gate permitted Step 01 readiness while the documentation task was IN_REVIEW; it does not waive the task DONE/independent review rule. Clarification work for Step 01 is distinct from approval of a material change.

## Gates

| Gate | Required evidence | Owner / acceptor | Blocks |
|---|---|---|---|
| G0 — Scope | Approved positioning, charter, boundaries | Codex / Human | Scope drift and feature work without requirements |
| G1 — Requirements | Rules, scenarios, acceptance thresholds, trace IDs | Codex / Human for critical rules | Specification completion |
| G2 — Architecture | API/data/security contracts, ADRs, threat/risk analysis and hosting feasibility | Claude / Human for trade-offs | Implementation depending on unresolved decisions |
| G3 — Design | Revisioned flows/screens/states, interaction and accessibility spec | OpenDesign / Human | Frontend implementation against unapproved design |
| G4 — Ready | Complete task contract and dependencies | Codex / assigned owner | Task start |
| G5 — Implementation | Scoped diff, engineer tests, no secret leakage, relevant static checks | Engineer / independent reviewer | QA admission |
| G6 — Verification | QA acceptance, integration/regression; applicable visual, accessibility, performance and security checks | OpenCode / independent reviewer | DONE and final review pass |
| G7 — Review | Findings resolved, exact-head approval, traceability complete | Independent reviewer / Codex tracks | Merge/completion |
| G8 — Release | Tested commit manifest, migration/recovery plan, cost/workload evidence, release notes, Human go/no-go | Codex / Human | Production deployment |
| G9 — Observe | Deployed revision, smoke results, runtime health, usage/cost against thresholds | Codex + OpenCode / Human for escalation | Release closure |

Before CI exists, store equivalent command and result evidence locally. Planned CI is not a passing CI check. Establish exact required checks and branch protection after repository audit; this bootstrap installs neither.

## Test mapping

Backend: changed domain rules, authorization boundaries, persistence and API contract/integration tests. Frontend: approved states, responsive behavior, keyboard/accessibility, API errors. Cross-stack: critical user journeys and regressions. Release: migration recovery, deployment smoke and actual workload/cost measurements.

Select checks by actual change and risk; no meaningless tests that duplicate trivial documentation or constants. Test absence must be explicit.

## Exceptions

Codex records exception ID, rationale, impacted requirements, risk, compensating evidence, owner and expiry. Human must approve material exceptions; never waive the explicit prohibition on self-approval, credentials in Git, or unapproved production release.

## Step 00A exit criteria — SRC-00A1

1. Official product identity confirmed.
2. Canonical Product Context exists.
3. Domain terminology documented.
4. Seven JTBD preserved.
5. Five State Dimensions documented.
6. P0/P1/P2 capability baseline documented.
7. Three Golden Workflows documented.
8. Project Atlas specification created.
9. Requirements Delta Analysis recorded.
10. Open Business Decisions tracked.
11. Risk Register updated.
12. Step 01 input artifacts are usable.

Evidence: [current validation](../testing/step-00a-validation.md). Structural checks and author semantic review are separate from independent review. Unformalized rules are TO_BE_ANALYZED_IN_STEP_01. Only a missing product-direction or approved-scope decision preventing BA constitutes a Step 01 context blocker; none was identified in this closure.

## Step 01 — Product Requirements Approval Gate

Source: step-01-request.md §21/23. PRD/SRS must specify all 20 P0 and trace seven JTBD; domain/rules/states, three workflow paths, permission matrix and measurable AC/NFR protocols must be coherent. Every critical OBD needs resolution or a concrete approval gate; prepared packet does not equal approval. MC-001 cannot be DONE with unapproved critical business policy. Independent QA testability review is separate from author structure/semantic checks and from PO approval. Claude handoff must separate approved inputs from proposals; no automatic Step 02. See project-status.md and step-01-validation.md under docs/testing for evidence.
