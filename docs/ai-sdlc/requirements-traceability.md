# Requirements Traceability

Direction: source → requirement → task → output/design/ADR → test → independent review → release evidence. Update links on every handoff; affected test/review results become stale when their subject changes.

Historical subject below: Step 00 documentation baseline. Current Step 00A mappings follow in separate tables. [Requirement register](../requirements/README.md). [Task MC-000](../implementation/tasks/MC-000.md). [Test report](../testing/step-00-validation.md). [Review packet](../reviews/step-00-review.md). [Release status](../release/README.md).

| Requirement | Task | Output evidence | Test ID | Review | Release |
|---|---|---|---|---|---|
| REQ-S00-001 | MC-000 | charter, product baseline, Git diff | DOC-01 | REV-00 pending Human | REL-00 N/A: documentation-only, no runtime release |
| REQ-S00-002 | MC-000 | agent-capabilities + tooling verification | TOOL-01 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-003 | MC-000 | operating-model | DOC-02 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-004 | MC-000 | charter, RACI, gates, risks, changes, decisions, status | DOC-03 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-005 | MC-000 | task-template + orchestration-protocol | DOC-04 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-006 | MC-000 | source-of-truth + local Git baseline | DOC-05 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-007 | MC-000 | root AGENTS.md, CLAUDE.md, capabilities/formats | DOC-06 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-008 | MC-000 | this matrix + task/test/review/release records | DOC-07 | REV-00 pending Human | REL-00 N/A |
| REQ-S00-009 | MC-000 | project-status + MC-00A packet | DOC-08 | REV-00 pending Human | REL-00 N/A |

A structural PASS is not agent runtime success or independent review. Product direction and capability priorities are approved inputs from Step 00A; implementation acceptance is not claimed.

Future rows must link actual test cases/results, PR/reviewer decisions and release manifests containing tested/deployed backend/frontend SHAs, environment, date, approval and runtime evidence. Use PENDING until evidence exists; N/A requires rationale and reviewer acceptance.

## Step 00A artifact traceability

Source: SRC-00A; task: [MC-00A](../implementation/tasks/MC-00A.md); tests: [S00A report](../testing/step-00a-validation.md); review: [REV-00A](../reviews/step-00a-review.md) NOT_RUN. Runtime release: N/A, documentation only.

| Requirement | Artifact | Check | Remaining gate |
|---|---|---|---|
| REQ-S00A-001 | source-brief.md | S00A-01 / S00A-SOURCE | A missing; full-text intake blocked |
| REQ-S00A-002 | product-reality-addendum.md | S00A-01 / S00A-SOURCE | B missing; full-text intake blocked |
| REQ-S00A-003 | canonical-product-context.md | S00A-02 / S00A-SOURCE | JTBD/reconciliation blocked |
| REQ-S00A-004 | domain-glossary.md + canonical state axes | S00A-02 / S00A-DOMAIN | Legal-source reconciliation blocked |
| REQ-S00A-005 | three-golden-workflows.md | S00A-04 | Detailed criteria Step 01; execution NOT_RUN |
| REQ-S00A-006 | project-atlas-dataset.md | S00A-05 | Synthetic proposal; no runtime fixtures/tests |
| REQ-S00A-007 | requirements-delta-analysis.md | S00A-06 / S00A-SOURCE | Actual comparison blocked |
| REQ-S00A-008 | p0-p1-p2-priorities.md | S00A-03 | No implementation acceptance yet |
| REQ-S00A-009 | open-business-decisions.md | S00A-06 | Decisions/clarifications remain open |
| REQ-S00A-010 | scope-rebaseline.md + status/risk/decision records | S00A-07 | Full Step 01 entry NOT_READY |

## P0 capability to candidate acceptance

For every row: source = SRC-00A Task 3; specification task = MC-00A; implementation task = NOT_PLANNED (Step 00A forbids code); test results = NOT_RUN; review = REV-00A pending; runtime release evidence = PENDING, no product release.

| Capability requirement | Atlas acceptance candidate | Workflow / UX context |
|---|---|---|
| REQ-MC-P0-01 | AT-STATE / AT-IO | All workflows; Requirement vs Action |
| REQ-MC-P0-02 | AT-BLOCK | GW-01 milestones |
| REQ-MC-P0-03 | AT-BLOCK / AT-UX | Next Action across workflows |
| REQ-MC-P0-04 | AT-FILING / AT-UX | Waiting On, GW-02/03 |
| REQ-MC-P0-05 | AT-STATE / AT-BLOCK | Dependency chain |
| REQ-MC-P0-06 | AT-EVIDENCE | Missing criteria/evidence |
| REQ-MC-P0-07 | AT-STATE / AT-EVIDENCE | Independent verification |
| REQ-MC-P0-08 | AT-HISTORY | Domain changes across workflows |
| REQ-MC-P0-09 | AT-BLOCK / AT-TIME / AT-UX | Control Room |
| REQ-MC-P0-10 | AT-UX | My Actions |
| REQ-MC-P0-11 | AT-TIME / AT-UX | Operational Grid |
| REQ-MC-P0-12 | AT-UX | Bulk editing |
| REQ-MC-P0-13 | AT-IO | Excel/CSV import |
| REQ-MC-P0-14 | AT-IO | Excel export |
| REQ-MC-P0-15 | AT-DOC / AT-EVIDENCE | Document/version awareness |
| REQ-MC-P0-16 | AT-FILING / AT-GW | GW-03 filing lifecycle |
| REQ-MC-P0-17 | AT-FILING | External party waiting |
| REQ-MC-P0-18 | AT-ROLE | Simple roles and permissions |
| REQ-MC-P0-19 | AT-BRIEF | Delta-based Status Brief |

P1/P2 baseline IDs: all 14 REQ-MC-P1 and 7 REQ-MC-P2 rows in the priority register trace to SRC-00A Task 3 and MC-00A/S00A-03 for faithful classification. Implementation tasks, product tests, implementation reviews and release evidence are DEFERRED because these capabilities are outside the approved P0 MVP. REV-00A still covers their documentation. No inferred DONE status.
