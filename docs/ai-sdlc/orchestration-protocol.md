# Agent Orchestration and Handoff Protocol

Strategy: Git-based coordination with explicit task packets; direct CLI/MCP is an optional delivery channel only after its route is verified. No orchestration daemon, integration, polling service or agent model configuration is installed.

## Source and ownership

Codex creates a task using [the contract](task-template.md), identifies repo URL/local root, base SHA, owner and paths, checks dependencies and assigns an independent reviewer. The receiving agent must acknowledge the same task and scope before IN_PROGRESS.

This is a documentation coordination repository. Product changes belong to explicitly selected backend/frontend repositories. Do not assume those URLs are authorized production destinations or add them as remotes of this repo.

## Git handoff

1. Verify current status and source revision; preserve user changes. Start each task from a recorded commit.
2. Use branch task/<task-id>-<short-name>. Parallel writers require separate worktrees and disjoint ownership; no implicit agent spawning.
3. Provide task file + referenced input revisions + root instructions. For a different product repo, copy only the reviewed instruction/task packet into the approved checkout and record the source governance commit.
4. Human-assisted fallback: Codex prepares the packet; Human opens the target workspace in the named external app and supplies the task. The packet remains READY/WAITING_APPROVAL until delivery is acknowledged. Preparing it is not dispatch.
5. Agent returns a commit/diff and completion report. Codex checks task ID, actual agent identity, repo, base/head, allowed paths and evidence before IN_REVIEW.
6. Reviewer examines the exact diff, then OpenCode validates relevant criteria in TESTING. Changes invalidate affected earlier results. Another reviewer must approve OpenCode-authored code.
7. Codex updates traceability, status and risks; DONE requires the [DoD](quality-gates.md). Create a PR only against a confirmed remote; no remote means a local review packet with base/head/diff. Link PR ID/URL once it exists.
8. Human approval gates apply to scope, critical rules, architecture trade-offs, design, cost and production release. A merged code PR alone is not production release approval.

Worktree commands (templates only; replace placeholders after verifying repo and base):

```sh
rtk git status --short --branch
rtk git worktree list --porcelain
rtk git worktree add -b task/MC-XXX-scope /approved/worktree/path <base-sha>
```

Do not remove dirty worktrees, reset, force-push or rewrite shared history. Record recovery evidence before any separately authorized cleanup.

## Packet and acknowledgement

Sender records: task ID, requirement IDs, owner, repo/base/branch, scope and denied actions, inputs with revisions, expected outputs, tests, reviewer, dependencies and relevant approvals. Receiver replies: task ID, actual tool/version, cwd/branch/base, understood scope, blockers and expected deliverables. Missing acknowledgement = not started.

## Return report

```text
Task ID:
Actual agent / tool / version:
Repo / worktree / base SHA / head SHA:
Changed files and scope:
Acceptance criteria: PASS / FAIL / NOT_RUN with evidence
Tests: command, environment, timestamp, exit, artifact
Review findings / resolutions:
Risks / blockers / skipped checks:
Proposed status:
Completion evidence:
```

Store returned reports under docs/reviews/ and test evidence under docs/testing/. A log without a final successful task result is not completion. Redact credentials and use synthetic data.

## Failures and retries

On unavailable tool, auth, packaging or permission error: retain the error evidence, set the affected work BLOCKED or WAITING_APPROVAL, and prepare Git fallback. Record a new attempt ID for retry; never resubmit a mutating job until prior status is known. Do not switch providers, bypass permissions, register MCP or install integrations silently. Escalate consequential choices with a concrete decision packet.

## Step 00 boundary

No external task completed successfully during bootstrap. No GUI task was dispatched. The Product Owner subsequently authorized Step 00A as Canonical Product Context; see scope-rebaseline.md. That authorization does not dispatch external agents or approve architecture/deployment. Step 00A.1 accepts approved prompts as the baseline and makes original archival optional. Direct A/B comparison is unperformed, not a Step 01 blocker; see context-provenance.md in docs/product/.
