# Requirements Traceability

Direction: source → requirement → task → output/design/ADR → test → independent review → release evidence. Update links on every handoff; affected test/review results become stale when their subject changes.

Current subject: Step 00 documentation baseline. [Requirement register](../requirements/README.md). [Task MC-000](../implementation/tasks/MC-000.md). [Test report](../testing/step-00-validation.md). [Review packet](../reviews/step-00-review.md). [Release status](../release/README.md).

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

A structural PASS is not agent runtime success or Human approval. No requirement is recorded as independently accepted yet.

Future rows must link actual test cases/results, PR/reviewer decisions and release manifests containing tested/deployed backend/frontend SHAs, environment, date, approval and runtime evidence. Use PENDING until evidence exists; N/A requires rationale and reviewer acceptance.
