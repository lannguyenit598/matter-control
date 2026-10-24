# <TASK-ID> — <title>

- Task ID: MC-XXX
- Status: BACKLOG
- Requirement references: REQ-XXX
- Agent owner: one official agent
- Priority: P0 / P1 / P2 / P3
- Scope: exact behavior/artifacts and allowed file paths
- Out of scope / prohibited actions:
- Dependencies: task IDs and required completed evidence
- Repository / worktree:
- Base commit / branch:
- Input artifacts: paths or URLs with revisions
- Output artifacts: exact expected paths
- Acceptance criteria: numbered, observable PASS/FAIL criteria
- Test requirements: cases, commands/environment, expected results; N/A requires rationale
- Reviewer: independent named role/person
- Required human approvals: decision IDs or none with rationale
- Completion evidence: commits/diffs, result artifacts, test/review records
- Blocker / next action / owner:
- Created / last updated:
- Sender / receiver acknowledgement:
- Status history: timestamp, from → to, actor, evidence/reason

## Acceptance evidence

| Criterion | Result: PASS/FAIL/NOT_RUN | Evidence path + revision |
|---|---|---|
| AC-1 | NOT_RUN | Pending |

## Completion report

Record actual agent/tool identity, changed files, base/head, tests run/not run, reviewer disposition, residual risks and proposed status. Never fill a placeholder with an invented success. Review and release references can be pending; they cannot be silently omitted.

## State rules

BACKLOG → READY (DoR passes) → IN_PROGRESS (owner acknowledged) → IN_REVIEW (output submitted) → TESTING (initial independent review passed) → DONE (tests, final review and DoD pass).

- BLOCKED: technical/dependency failure; record prior state, blocker and owner.
- WAITING_APPROVAL: concrete decision packet awaits Human; record required decision.
- REWORK_REQUIRED: failed review/test with linked findings; return to IN_PROGRESS once corrected scope is acknowledged.
- Resolve a blocker/approval to the recorded prior eligible state, never directly to DONE.
- DONE does not mean deployed. Production release is a separate task with Human approval and runtime evidence.
