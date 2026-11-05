# MC-FOCUS-BRD-20261101

- Owner: actual Local Codex, BA/orchestration. Internal contributors: Codex Product Manager and Business Analyst subagents, explicitly requested by the PO.
- Priority: P1 feature proposal; status **IN_REVIEW**. Research/documentation complete; feature NOT_IMPLEMENTED.
- Scope: inspect Pane Home Focus via the approved browser; inspect current My Work and approved rules; produce business requirements, acceptance matrix and full implementation handoff. No app/source/runtime/database changes.
- Base/head: `codex/unified-project-flow` / `64b9e0315e210953d7a7eaeacc0643b269a14ad9`, existing dirty work preserved.
- Requirement: proposed BR-FOCUS-01 and FR-FOCUS-01..14, preserving FR-003/010/018 and RULE-001/002/017/018/019/021. Existing baseline IDs unchanged.
- Inputs: direct PO request 2026-11-01, Pane public demo, My Work source, business rules/SRS/ACs, focused-workbench task.
- Outputs: docs/research/pane-focus-20261101/assessment.md + public screenshots; docs/requirements/focus-mode-brd.md; docs/implementation/handoffs/MC-FOCUS-MVP-IMPLEMENTATION-PROMPT.md.
- Acceptance: observed behavior separated from assumptions; existing capability versus missing timer stated; proposed MVP, lifecycle, privacy/concurrency/access-loss, no-domain-write semantics and 18 testable ACs present; exact source reuse and execution boundaries included.
- Checks: live demo preset/start/pause/+5/resume/navigation/reload/end and selected-task noncompletion observed; static source/requirements inspection, document/link/whitespace validation. No MatterControl Focus execution/test because implementation does not exist yet.
- Reviewer: PO for new product scope; nonauthor requirements/implementation review as assigned. PM/BA contributed to this document and are not represented as independent acceptance.
- Remaining: adopt/adjust FOCUS-D01..05, assign one implementation owner, then author checks and nonauthor/browser acceptance. No reapproval of existing P0 rules requested.
